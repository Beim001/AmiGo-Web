-- AmiGO 账号与云存档（Cloudflare D1）
-- 应用：npx wrangler d1 migrations apply DB --local   （线上去掉 --local，改 --remote）

-- 用户
CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,          -- 统一存小写
  password_hash  TEXT NOT NULL,                 -- PBKDF2-SHA256，十六进制
  password_salt  TEXT NOT NULL,                 -- 每个用户随机盐，十六进制
  display_name   TEXT NOT NULL,
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_at     INTEGER NOT NULL               -- 毫秒时间戳
);

-- 登录会话：只保存令牌的 SHA-256 哈希
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- 邮件令牌：验证邮箱 / 重置密码，单次有效
CREATE TABLE IF NOT EXISTS email_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('verify', 'reset')),
  expires_at INTEGER NOT NULL,
  used_at    INTEGER
);
CREATE INDEX IF NOT EXISTS idx_email_tokens_user ON email_tokens(user_id);

-- 游戏存档：每个用户一份，version 用于防止多设备互相覆盖
CREATE TABLE IF NOT EXISTS saves (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data       TEXT NOT NULL,
  version    INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 限流计数：固定时间窗口
CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count        INTEGER NOT NULL
);
