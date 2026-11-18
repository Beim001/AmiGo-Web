import { describe, expect, it } from 'vitest';
import {
  BRIBE_PER_MONTH,
  bribeMonths,
  barredByRecord,
  candidateCount,
  hasRecord,
  lowerFamilyAffinity,
  parsePrison,
  recordOnRelease,
  sentenceTo,
  serveMonth,
} from './prison';
import { resolveOption, SIM_EVENTS } from './simEvents';

describe('服刑（第 67.7 题）', () => {
  it('每月减一个月刑期，刑满出狱', () => {
    const p = sentenceTo('走私', 2, 1880, 3);
    const m1 = serveMonth(p);
    expect(m1).toEqual({ prison: { ...p, monthsLeft: 1 }, released: false });
    expect(serveMonth(m1.prison!)).toEqual({ prison: null, released: true });
  });

  it('打点按每月 2,000 计，最多减到刑满', () => {
    const p = sentenceTo('走私', 6, 1880, 3);
    expect(bribeMonths(p, BRIBE_PER_MONTH * 2 + 1)).toBe(2);
    expect(bribeMonths(p, BRIBE_PER_MONTH * 100)).toBe(6);
  });

  it('前科 10 年内有效', () => {
    const r = recordOnRelease('偷窃', 1880, 6);
    expect(hasRecord(r, 1890, 5)).toBe(true);
    expect(hasRecord(r, 1890, 6)).toBe(false);
    expect(hasRecord(null, 1880, 6)).toBe(false);
  });

  it('前科：政法治安类岗位不录用，结婚候选人减半', () => {
    expect(barredByRecord({ category: '政法治安' }, true)).toBe(true);
    expect(barredByRecord({ category: '政法治安' }, false)).toBe(false);
    expect(barredByRecord({ category: '工业制造' }, true)).toBe(false);
    expect(candidateCount(10, true)).toBe(5);
    expect(candidateCount(3, true)).toBe(1);
    expect(candidateCount(10, false)).toBe(10);
  });

  it('狱中在世家人好感 -1，不影响已故家人与自己', () => {
    const state = { affinity: { a: 50 } };
    const next = lowerFamilyAffinity(state, [
      { id: 'a', affinity: 60 },
      { id: 'b', affinity: 40 },
      { id: 'dead', affinity: 40, status: '已故' },
      { id: 'me', affinity: 100, isPlayer: true },
    ]);
    expect(next.affinity).toEqual({ a: 49, b: 39 });
  });

  it('存档损坏或刑期为 0 时视为不在狱中', () => {
    expect(parsePrison({ crime: '偷窃', monthsLeft: 0 })).toBeNull();
    expect(parsePrison('x')).toBeNull();
  });
});

describe('入狱的推演事件', () => {
  const ev = (id: string) => SIM_EVENTS.find((e) => e.id === id)!;

  it('犯罪事件冒险失败必定入狱', () => {
    const r = resolveOption(ev('smuggle').options[1], () => 0.99);
    expect(r.succeeded).toBe(false);
    expect(r.jail).toEqual({ crime: '走私', months: 6 });
  });

  it('冲撞贵族只发生在平民、乞丐家庭；据理力争失败入狱', () => {
    const e = ev('noble_clash');
    const ctx = { age: 20, employed: false, coins: 0, hasChildren: false };
    expect(e.when({ ...ctx, classId: 'beggar' })).toBe(true);
    expect(e.when({ ...ctx, classId: 'noble' })).toBe(false);
    expect(resolveOption(e.options[1], () => 0.99).jail).toEqual({ crime: '冲撞贵族', months: 3 });
  });

  it('私藏钱包被抓时按概率拘留 1 个月', () => {
    const opt = ev('wallet').options[1];
    // 第一次随机决定冒险失败，第二次决定是否拘留
    const seq = (...v: number[]) => () => v.shift()!;
    expect(resolveOption(opt, seq(0.99, 0.1)).jail).toEqual({ crime: '侵占财物', months: 1 });
    expect(resolveOption(opt, seq(0.99, 0.9)).jail).toBeUndefined();
  });

  it('冒险成功不会入狱', () => {
    expect(resolveOption(ev('smuggle').options[1], () => 0).jail).toBeUndefined();
  });
});
