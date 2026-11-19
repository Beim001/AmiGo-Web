import { env } from 'cloudflare:test';
import app from '../src/index';

// 测试用的接口客户端：直接调用 Hono 的 app.request，自动保存会话 Cookie。
// 每个客户端使用不同的 CF-Connecting-IP，避免注册、登录的按 IP 限流互相影响。

export interface ApiResult<T = any> {
  status: number;
  data: T;
}

let nextIp = 0;

export const client = () => {
  let cookie = '';
  const ip = `10.0.${Math.floor(++nextIp / 250)}.${nextIp % 250}`;
  const req = async <T = any>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> => {
    const res = await app.request(
      path,
      {
        method,
        headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip, ...(cookie ? { Cookie: cookie } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      env,
    );
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    const text = await res.text();
    return { status: res.status, data: text ? JSON.parse(text) : null };
  };
  return { req };
};

export type Client = ReturnType<typeof client> & { uid: string };

let nextEmail = 0;

/** 注册并完成邮箱验证（开发模式下注册接口会返回验证链接） */
export const verifiedAccount = async (email = `player${++nextEmail}@example.com`): Promise<Client> => {
  const c = client();
  const reg = await c.req<{ devLink?: string; user: { uid: string } }>('POST', '/api/auth/register', { email, password: 'secret123' });
  if (!reg.data?.devLink) throw new Error(`注册失败：${JSON.stringify(reg)}`);
  const token = new URL(reg.data.devLink).searchParams.get('token');
  await c.req('GET', `/api/auth/verify?token=${token}`);
  return { ...c, uid: reg.data.user.uid };
};
