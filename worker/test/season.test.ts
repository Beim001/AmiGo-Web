import { env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { currentSeason } from '../../src/data/seasons';
import { Client, client, verifiedAccount } from './client';

// 同一测试文件内的用例共用一个数据库，断言不依赖其他用例写入的数据
const SEASON = currentSeason().id;
const HOUR_MS = 60 * 60 * 1000;
const MINUTES = (n: number) => n * 60 * 1000;

const submit = (u: Client, body: { score: number; completedMs?: number | null; cheat?: boolean; lazy?: boolean }) =>
  u.req<{ score: number; completedMs: number | null }>('PUT', '/api/season/score', {
    season: SEASON,
    completedMs: null,
    lazy: false,
    cheat: false,
    ...body,
  });

const board = (u: Client, b: 'score' | 'speed') => u.req('GET', `/api/season/leaderboard?season=${SEASON}&board=${b}`);

/** 把某账号上次上报的时间往前拨，模拟现实时间流逝 */
const rewind = (u: Client, ms: number) =>
  env.DB.prepare('UPDATE season_scores SET updated_at = updated_at - ? WHERE user_id = ? AND season = ?').bind(ms, u.uid, SEASON).run();

describe('赛季成绩上报', () => {
  it('积分按现实时间限速：首次与紧接着的上报都被截断，一小时后才能再涨', async () => {
    const a = await verifiedAccount();
    const first = await submit(a, { score: 9_999_999 });
    const again = await submit(a, { score: 9_999_999 });
    await rewind(a, HOUR_MS);
    const later = await submit(a, { score: 9_999_999 });

    expect(again.data.score - first.data.score).toBeLessThan(10);
    expect(later.data.score).toBeGreaterThan(again.data.score);
    expect(later.data.score).toBeLessThan(9_999_999);
  });

  it('积分可以下降，不受限速影响', async () => {
    const a = await verifiedAccount();
    await submit(a, { score: 500 });
    expect((await submit(a, { score: 100 })).data.score).toBe(100);
  });

  it('过短的速通用时不计入；之后第一次有效的用时被保留', async () => {
    const a = await verifiedAccount();
    expect((await submit(a, { score: 10, completedMs: 1000 })).data.completedMs).toBeNull();
    expect((await submit(a, { score: 10, completedMs: MINUTES(40) })).data.completedMs).toBe(MINUTES(40));
    expect((await submit(a, { score: 10, completedMs: MINUTES(35) })).data.completedMs).toBe(MINUTES(40));
  });

  it('只接受当前赛季', async () => {
    const a = await verifiedAccount();
    const r = await a.req('PUT', '/api/season/score', { season: 'S999', score: 1, completedMs: null, lazy: false });
    expect(r.status).toBe(409);
  });

  it('同一账号上报过于频繁时被限流', async () => {
    const a = await verifiedAccount();
    const statuses: number[] = [];
    for (let i = 0; i < 31; i++) statuses.push((await submit(a, { score: 1 })).status);
    expect(statuses.slice(0, 30).every((s) => s === 200)).toBe(true);
    expect(statuses[30]).toBe(429);
  });

  it('未登录或未验证邮箱的账号不能上报', async () => {
    const guest = client();
    const unverified = client();
    await unverified.req('POST', '/api/auth/register', { email: 'unverified@example.com', password: 'secret123' });

    expect((await guest.req('PUT', '/api/season/score', { season: SEASON, score: 1 })).status).toBe(401);
    expect((await unverified.req('PUT', '/api/season/score', { season: SEASON, score: 1 })).status).toBe(403);
  });
});

describe('测试兑换码标记', () => {
  it('标记后成绩不上榜，之后上报 cheat=false 也无法撤销', async () => {
    const b = await verifiedAccount();
    await submit(b, { score: 500, cheat: true });
    await submit(b, { score: 600, cheat: false });
    const r = await board(b, 'score');

    expect(r.data.list.some((x: { uid: string }) => x.uid === b.uid)).toBe(false);
    expect(r.data.me).toMatchObject({ excluded: 'cheat', rank: null });
  });

  it('用过测试码的账号领不到致谢名单名次，正常账号可以', async () => {
    const cheater = await verifiedAccount();
    const normal = await verifiedAccount();
    await submit(cheater, { score: 1, cheat: true });

    const denied = await cheater.req('POST', '/api/achievements/complete');
    const granted = await normal.req('POST', '/api/achievements/complete');
    expect(denied.status).toBe(403);
    expect(typeof granted.data.rank).toBe('number');
  });
});

describe('排行榜名次', () => {
  it('速通用时并列时，先达成者在前，「我的名次」与列表中的位置一致', async () => {
    const early = await verifiedAccount();
    const late = await verifiedAccount();
    const tied = MINUTES(42) + 123;
    await submit(early, { score: 1, completedMs: tied });
    await rewind(early, 1000);
    await submit(late, { score: 1, completedMs: tied });

    const r = await board(late, 'speed');
    const rankOf = (u: Client) => r.data.list.find((x: { uid: string }) => x.uid === u.uid)?.rank;
    expect(rankOf(late)).toBe(rankOf(early) + 1);
    expect(r.data.me.rank).toBe(rankOf(late));
  });
});

describe('举报与管理', () => {
  let admin: Client;
  beforeAll(async () => {
    admin = await verifiedAccount('admin@example.com');
  });
  const setup = async () => {
    const target = await verifiedAccount();
    const reporter = await verifiedAccount();
    await submit(target, { score: 100 });
    return { target, reporter, admin };
  };
  const reportsOf = async (admin: Client, uid: string) =>
    (await admin.req('GET', `/api/admin/season/reports?season=${SEASON}`)).data.list.find((x: { uid: string }) => x.uid === uid);

  it('不能举报自己，也不能举报本赛季没有成绩的人', async () => {
    const { target, reporter } = await setup();
    expect((await target.req('POST', '/api/season/report', { season: SEASON, uid: target.uid, reason: 'score' })).status).toBe(400);
    expect((await target.req('POST', '/api/season/report', { season: SEASON, uid: reporter.uid, reason: 'score' })).status).toBe(404);
  });

  it('管理员看到待处理举报；非管理员无权查看', async () => {
    const { target, reporter, admin } = await setup();
    await reporter.req('POST', '/api/season/report', { season: SEASON, uid: target.uid, reason: 'speed' });

    expect((await reporter.req('GET', `/api/admin/season/reports?season=${SEASON}`)).status).toBe(403);
    expect((await board(reporter, 'score')).data.admin).toBe(false);
    expect((await board(admin, 'score')).data.admin).toBe(true);
    expect(await reportsOf(admin, target.uid)).toMatchObject({ reports: 1, reasons: ['speed'], hidden: false });
  });

  it('隐藏后成绩下榜、举报被处理；恢复后重新上榜', async () => {
    const { target, reporter, admin } = await setup();
    await reporter.req('POST', '/api/season/report', { season: SEASON, uid: target.uid, reason: 'score' });

    await admin.req('POST', '/api/admin/season/moderate', { season: SEASON, uid: target.uid, action: 'hide' });
    const hidden = await board(target, 'score');
    expect(hidden.data.list.some((x: { uid: string }) => x.uid === target.uid)).toBe(false);
    expect(hidden.data.me.excluded).toBe('hidden');
    expect(await reportsOf(admin, target.uid)).toMatchObject({ hidden: true, reports: 0 });
    expect((await target.req('POST', '/api/achievements/complete')).status).toBe(403);

    await admin.req('POST', '/api/admin/season/moderate', { season: SEASON, uid: target.uid, action: 'unhide' });
    const restored = await board(target, 'score');
    expect(restored.data.list.some((x: { uid: string }) => x.uid === target.uid)).toBe(true);
    expect(restored.data.me.excluded).toBeNull();
  });

  it('驳回举报后不再出现在待处理列表', async () => {
    const { target, reporter, admin } = await setup();
    await reporter.req('POST', '/api/season/report', { season: SEASON, uid: target.uid, reason: 'score' });
    await admin.req('POST', '/api/admin/season/moderate', { season: SEASON, uid: target.uid, action: 'dismiss' });
    expect(await reportsOf(admin, target.uid)).toBeUndefined();
  });

  it('隐藏不存在的成绩返回 404', async () => {
    const { admin } = await setup();
    expect((await admin.req('POST', '/api/admin/season/moderate', { season: SEASON, uid: 'nobody', action: 'hide' })).status).toBe(404);
  });
});
