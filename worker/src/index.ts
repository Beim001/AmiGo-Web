// AmiGO 后端：Cloudflare Worker（账号、邮箱验证、找回密码、云存档）
// 同一个 Worker 也负责托管前端静态文件（dist/），接口统一在 /api/* 下。

import { Hono, type Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { hashPassword, verifyPassword, generateToken, sha256Hex, PBKDF2_ITERATIONS } from './crypto';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  /** 站点地址，用于邮件中的链接，例如 https://amigo.example.com（本地为 http://localhost:3000） */
  APP_URL?: string;
  /** 发件人，例如 "AmiGO <noreply@amigo.example.com>"；与 RESEND_API_KEY 都配置后才真正发信 */
  MAIL_FROM?: string;
  RESEND_API_KEY?: string;
  /** 'true' 时在接口响应里附带邮件链接，便于本地测试；线上不要开启 */
  DEV_MODE?: string;
}

type AppContext = Context<{ Bindings: Env }>;

const SESSION_COOKIE = 'amigo_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
const MAX_SAVE_CHARS = 1_000_000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  password_salt: string;
  display_name: string;
  email_verified: number;
  created_at: number;
}

const publicUser = (u: UserRow) => ({
  uid: u.id,
  email: u.email,
  displayName: u.display_name,
  emailVerified: u.email_verified === 1,
});

const fail = (c: AppContext, status: 400 | 401 | 403 | 404 | 409 | 413 | 429, code: string, extra: Record<string, unknown> = {}) =>
  c.json({ ok: false, code, ...extra }, status);

const readJson = async (c: AppContext): Promise<Record<string, unknown>> => {
  try {
    const body = await c.req.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

const clientIp = (c: AppContext) => c.req.header('CF-Connecting-IP') || 'local';
const appUrl = (c: AppContext) => (c.env.APP_URL || new URL(c.req.url).origin).replace(/\/+$/, '');
const isDev = (c: AppContext) => c.env.DEV_MODE === 'true';

// ---------- 限流（固定时间窗口） ----------

const rateLimit = async (db: D1Database, key: string, limit: number, windowSec: number): Promise<boolean> => {
  const now = Date.now();
  const row = await db.prepare('SELECT window_start, count FROM rate_limits WHERE key = ?').bind(key).first<{ window_start: number; count: number }>();
  if (!row || now - row.window_start >= windowSec * 1000) {
    await db.prepare('INSERT OR REPLACE INTO rate_limits (key, window_start, count) VALUES (?, ?, 1)').bind(key, now).run();
    return true;
  }
  if (row.count >= limit) return false;
  await db.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').bind(key).run();
  return true;
};

// ---------- 会话 ----------

const createSession = async (c: AppContext, userId: string) => {
  const token = generateToken();
  const now = Date.now();
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),
    c.env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').bind(await sha256Hex(token), userId, now + SESSION_TTL_MS),
  ]);
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    // 线上为 HTTPS；本地开发经 Vite 转发时是 HTTP，Secure Cookie 会被手机等局域网设备拒收
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
};

const currentUser = async (c: AppContext): Promise<UserRow | null> => {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return null;
  return c.env.DB.prepare(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`,
  )
    .bind(await sha256Hex(token), Date.now())
    .first<UserRow>();
};

// ---------- 邮件 ----------

const createEmailToken = async (db: D1Database, userId: string, kind: 'verify' | 'reset') => {
  const token = generateToken();
  const ttl = kind === 'verify' ? VERIFY_TTL_MS : RESET_TTL_MS;
  await db
    .prepare('INSERT INTO email_tokens (token_hash, user_id, kind, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256Hex(token), userId, kind, Date.now() + ttl)
    .run();
  return token;
};

const mailLayout = (title: string, body: string, link: string, linkText: string) => `
<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:2px solid #222;border-radius:12px">
  <h2 style="margin-top:0">${title}</h2>
  <p>${body}</p>
  <p><a href="${link}" style="display:inline-block;background:#facc15;color:#000;padding:10px 18px;border-radius:8px;font-weight:bold;text-decoration:none">${linkText}</a></p>
  <p style="color:#666;font-size:12px">如果按钮无法点击，请复制以下链接到浏览器打开：<br>${link}</p>
  <p style="color:#666;font-size:12px">如果这不是你的操作，请忽略本邮件。—— AmiGO Lite</p>
</div>`;

/** 已配置 Resend 时真正发信；否则只打印到控制台（本地开发） */
const sendMail = async (env: Env, to: string, subject: string, html: string, link: string): Promise<void> => {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) {
    console.log(`[开发模式·未发送邮件] 收件人 ${to}｜${subject}｜${link}`);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM, to, subject, html }),
  });
  if (!res.ok) console.error(`[邮件发送失败] ${res.status} ${await res.text()}`);
};

const sendVerifyMail = async (c: AppContext, user: UserRow) => {
  const token = await createEmailToken(c.env.DB, user.id, 'verify');
  const link = `${appUrl(c)}/api/auth/verify?token=${token}`;
  await sendMail(c.env, user.email, '验证你的 AmiGO 账号邮箱', mailLayout('欢迎来到 AmiGO Lite', `${user.display_name}，请点击下方按钮验证邮箱，链接 24 小时内有效。`, link, '验证邮箱'), link);
  return link;
};

// ---------- 路由 ----------

const app = new Hono<{ Bindings: Env }>();

app.post('/api/auth/register', async (c) => {
  const body = await readJson(c);
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const displayName = String(body.displayName ?? '').trim().slice(0, 20) || email.split('@')[0];

  if (!EMAIL_RE.test(email) || email.length > 254) return fail(c, 400, 'INVALID_EMAIL');
  if (password.length < 6 || password.length > 128) return fail(c, 400, 'WEAK_PASSWORD');
  if (!(await rateLimit(c.env.DB, `register:ip:${clientIp(c)}`, 5, 3600))) return fail(c, 429, 'TOO_MANY_REQUESTS');

  const exists = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (exists) return fail(c, 409, 'EMAIL_IN_USE');

  const { hash, salt } = await hashPassword(password);
  const user: UserRow = {
    id: crypto.randomUUID(),
    email,
    password_hash: hash,
    password_salt: salt,
    display_name: displayName,
    email_verified: 0,
    created_at: Date.now(),
  };
  await c.env.DB.prepare(
    'INSERT INTO users (id, email, password_hash, password_salt, display_name, email_verified, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)',
  )
    .bind(user.id, user.email, user.password_hash, user.password_salt, user.display_name, user.created_at)
    .run();

  await createSession(c, user.id);
  const link = await sendVerifyMail(c, user);
  return c.json({ ok: true, user: publicUser(user), ...(isDev(c) ? { devLink: link } : {}) });
});

app.post('/api/auth/login', async (c) => {
  const body = await readJson(c);
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  if (
    !(await rateLimit(c.env.DB, `login:ip:${clientIp(c)}`, 20, 600)) ||
    !(await rateLimit(c.env.DB, `login:email:${email}`, 5, 600))
  ) {
    return fail(c, 429, 'TOO_MANY_REQUESTS');
  }

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>();
  if (!user) {
    // 账号不存在时也做一次哈希，避免通过响应时间判断邮箱是否注册
    await hashPassword(password, PBKDF2_ITERATIONS);
    return fail(c, 401, 'INVALID_CREDENTIALS');
  }
  if (!(await verifyPassword(password, user.password_hash, user.password_salt))) return fail(c, 401, 'INVALID_CREDENTIALS');

  await createSession(c, user.id);
  return c.json({ ok: true, user: publicUser(user) });
});

app.post('/api/auth/logout', async (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) await c.env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256Hex(token)).run();
  deleteCookie(c, SESSION_COOKIE, { path: '/', secure: new URL(c.req.url).protocol === 'https:' });
  return c.json({ ok: true });
});

app.get('/api/auth/me', async (c) => {
  const user = await currentUser(c);
  if (!user) return fail(c, 401, 'UNAUTHORIZED');
  return c.json({ ok: true, user: publicUser(user) });
});

app.post('/api/auth/resend-verification', async (c) => {
  const user = await currentUser(c);
  if (!user) return fail(c, 401, 'UNAUTHORIZED');
  if (user.email_verified === 1) return c.json({ ok: true, alreadyVerified: true });
  if (!(await rateLimit(c.env.DB, `verify-mail:${user.id}`, 3, 600))) return fail(c, 429, 'TOO_MANY_REQUESTS');
  const link = await sendVerifyMail(c, user);
  return c.json({ ok: true, ...(isDev(c) ? { devLink: link } : {}) });
});

app.get('/api/auth/verify', async (c) => {
  const token = c.req.query('token') || '';
  const row = await c.env.DB.prepare(
    "SELECT user_id FROM email_tokens WHERE token_hash = ? AND kind = 'verify' AND used_at IS NULL AND expires_at > ?",
  )
    .bind(await sha256Hex(token), Date.now())
    .first<{ user_id: string }>();
  if (!row) return c.redirect(`${appUrl(c)}/?verify_error=1`, 302);

  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').bind(row.user_id),
    c.env.DB.prepare("UPDATE email_tokens SET used_at = ? WHERE user_id = ? AND kind = 'verify' AND used_at IS NULL").bind(Date.now(), row.user_id),
  ]);
  return c.redirect(`${appUrl(c)}/?verified=1`, 302);
});

app.post('/api/auth/request-password-reset', async (c) => {
  const body = await readJson(c);
  const email = String(body.email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return fail(c, 400, 'INVALID_EMAIL');
  if (
    !(await rateLimit(c.env.DB, `reset:ip:${clientIp(c)}`, 5, 3600)) ||
    !(await rateLimit(c.env.DB, `reset:email:${email}`, 3, 3600))
  ) {
    return fail(c, 429, 'TOO_MANY_REQUESTS');
  }

  // 无论邮箱是否注册都返回成功，避免被用来探测邮箱
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>();
  let link: string | undefined;
  if (user) {
    const token = await createEmailToken(c.env.DB, user.id, 'reset');
    link = `${appUrl(c)}/?reset_token=${token}`;
    await sendMail(c.env, user.email, '重置你的 AmiGO 账号密码', mailLayout('重置密码', `${user.display_name}，请点击下方按钮设置新密码，链接 1 小时内有效。`, link, '设置新密码'), link);
  }
  return c.json({ ok: true, ...(isDev(c) && link ? { devLink: link } : {}) });
});

app.post('/api/auth/reset-password', async (c) => {
  const body = await readJson(c);
  const token = String(body.token ?? '');
  const password = String(body.password ?? '');
  if (password.length < 6 || password.length > 128) return fail(c, 400, 'WEAK_PASSWORD');

  const row = await c.env.DB.prepare(
    "SELECT user_id FROM email_tokens WHERE token_hash = ? AND kind = 'reset' AND used_at IS NULL AND expires_at > ?",
  )
    .bind(await sha256Hex(token), Date.now())
    .first<{ user_id: string }>();
  if (!row) return fail(c, 400, 'INVALID_TOKEN');

  const { hash, salt } = await hashPassword(password);
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?').bind(hash, salt, row.user_id),
    c.env.DB.prepare("UPDATE email_tokens SET used_at = ? WHERE user_id = ? AND kind = 'reset' AND used_at IS NULL").bind(Date.now(), row.user_id),
    // 改密码后让所有已登录设备失效
    c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(row.user_id),
  ]);
  return c.json({ ok: true });
});

// ---------- 云存档 ----------

const requireVerifiedUser = async (c: AppContext) => {
  const user = await currentUser(c);
  if (!user) return { error: fail(c, 401, 'UNAUTHORIZED') };
  if (user.email_verified !== 1) return { error: fail(c, 403, 'EMAIL_NOT_VERIFIED') };
  return { user };
};

app.get('/api/save', async (c) => {
  const { user, error } = await requireVerifiedUser(c);
  if (error) return error;
  const row = await c.env.DB.prepare('SELECT data, version, updated_at FROM saves WHERE user_id = ?')
    .bind(user.id)
    .first<{ data: string; version: number; updated_at: number }>();
  return c.json({ ok: true, data: row?.data ?? null, version: row?.version ?? 0, updatedAt: row?.updated_at ?? null });
});

app.put('/api/save', async (c) => {
  const { user, error } = await requireVerifiedUser(c);
  if (error) return error;
  const body = await readJson(c);
  const data = body.data;
  const baseVersion = Number(body.baseVersion ?? 0);
  if (typeof data !== 'string' || !Number.isInteger(baseVersion) || baseVersion < 0) return fail(c, 400, 'BAD_REQUEST');
  if (data.length > MAX_SAVE_CHARS) return fail(c, 413, 'SAVE_TOO_LARGE');

  const now = Date.now();
  // 只有服务器上的版本等于客户端所基于的版本时才写入，防止多设备互相覆盖
  const result =
    baseVersion === 0
      ? await c.env.DB.prepare('INSERT INTO saves (user_id, data, version, updated_at) VALUES (?, ?, 1, ?) ON CONFLICT(user_id) DO NOTHING')
          .bind(user.id, data, now)
          .run()
      : await c.env.DB.prepare('UPDATE saves SET data = ?, version = version + 1, updated_at = ? WHERE user_id = ? AND version = ?')
          .bind(data, now, user.id, baseVersion)
          .run();

  if (result.meta.changes === 0) {
    const current = await c.env.DB.prepare('SELECT version, updated_at FROM saves WHERE user_id = ?')
      .bind(user.id)
      .first<{ version: number; updated_at: number }>();
    return fail(c, 409, 'SAVE_CONFLICT', { version: current?.version ?? 0, updatedAt: current?.updated_at ?? null });
  }
  return c.json({ ok: true, version: baseVersion + 1, updatedAt: now });
});

// ---------- 全成就名次（致谢名单） ----------

/**
 * 记录当前账号集齐全部成就，返回名次（第几个集齐的玩家）。
 * 同一账号重复调用返回同一个名次。成就数据保存在客户端，服务器无法核验是否真的集齐。
 */
app.post('/api/achievements/complete', async (c) => {
  const { user, error } = await requireVerifiedUser(c);
  if (error) return error;
  const findRank = () =>
    c.env.DB.prepare('SELECT rank FROM completions WHERE user_id = ?').bind(user.id).first<{ rank: number }>();
  const existing = await findRank();
  if (existing) return c.json({ ok: true, rank: existing.rank });

  // 并发时两个请求可能算出同一个名次，rank 的唯一约束会让其中一个失败，失败后重试。
  // 「WHERE true」用于消除 SQLite 中 INSERT ... SELECT 与 ON CONFLICT 的语法歧义。
  for (let attempt = 0; ; attempt++) {
    try {
      await c.env.DB.prepare(
        'INSERT INTO completions (user_id, rank, completed_at) SELECT ?, COALESCE(MAX(rank), 0) + 1, ? FROM completions WHERE true ON CONFLICT(user_id) DO NOTHING',
      )
        .bind(user.id, Date.now())
        .run();
      break;
    } catch (err) {
      if (attempt >= 4 || !/UNIQUE constraint failed: completions\.rank/.test(String(err))) throw err;
    }
  }
  const row = await findRank();
  return c.json({ ok: true, rank: row?.rank ?? null });
});

// 未知接口返回 JSON 404；其余请求交给前端静态文件
app.all('/api/*', (c) => fail(c, 404, 'NOT_FOUND'));
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
