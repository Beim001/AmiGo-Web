import { describe, expect, it } from 'vitest';
import { client, verifiedAccount } from './client';

describe('云存档', () => {
  it('按版本号写入：基于旧版本的写入返回 409 并告知服务器上的最新版本', async () => {
    const a = await verifiedAccount();
    const first = await a.req('PUT', '/api/save', { data: '{"coins":1}', baseVersion: 0 });
    const second = await a.req('PUT', '/api/save', { data: '{"coins":2}', baseVersion: first.data.version });
    const stale = await a.req('PUT', '/api/save', { data: '{"coins":3}', baseVersion: first.data.version });

    expect(second.data.version).toBe(first.data.version + 1);
    expect(stale.status).toBe(409);
    expect(stale.data).toMatchObject({ code: 'SAVE_CONFLICT', version: second.data.version });
    expect((await a.req('GET', '/api/save')).data).toMatchObject({ data: '{"coins":2}', version: second.data.version });
  });

  it('另一台设备首次上传时，若服务器已有存档则返回 409', async () => {
    const a = await verifiedAccount();
    await a.req('PUT', '/api/save', { data: '{}', baseVersion: 0 });
    expect((await a.req('PUT', '/api/save', { data: '{}', baseVersion: 0 })).status).toBe(409);
  });

  it('存档按账号隔离', async () => {
    const a = await verifiedAccount();
    const b = await verifiedAccount();
    await a.req('PUT', '/api/save', { data: '{"owner":"a"}', baseVersion: 0 });
    expect((await b.req('GET', '/api/save')).data.data).toBeNull();
  });

  it('未验证邮箱的账号不能使用云存档', async () => {
    const u = client();
    await u.req('POST', '/api/auth/register', { email: 'nosave@example.com', password: 'secret123' });
    expect((await u.req('GET', '/api/save')).status).toBe(403);
  });
});

describe('账号', () => {
  it('同一邮箱不能重复注册，邮箱大小写视为相同', async () => {
    await verifiedAccount('dup@example.com');
    const r = await client().req('POST', '/api/auth/register', { email: 'DUP@example.com', password: 'secret123' });
    expect(r.status).toBe(409);
  });

  it('密码错误时登录失败，正确时成功', async () => {
    await verifiedAccount('login@example.com');
    const wrong = await client().req('POST', '/api/auth/login', { email: 'login@example.com', password: 'wrong-password' });
    const right = await client().req('POST', '/api/auth/login', { email: 'login@example.com', password: 'secret123' });
    expect(wrong.status).toBe(401);
    expect(right.data.user.emailVerified).toBe(true);
  });
});
