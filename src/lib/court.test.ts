import { describe, expect, it } from 'vitest';
import {
  BASE_WIN_CHANCE,
  LAWYER_BONUS,
  MAX_WIN_CHANCE,
  NOBLE_APPEAL_COMPENSATION,
  NOBLE_CLASH_CRIME,
  SUIT_EXPIRE_MONTHS,
  activeCases,
  addCase,
  appealCase,
  caseCost,
  suitCase,
  tryCase,
  winChance,
} from './court';
import { SIM_EVENTS, resolveOption } from './simEvents';

describe('胜诉率（第 67.6 题）', () => {
  const suit = suitCase({ title: '起诉欠薪', defendant: '东家', claim: 4000 }, 1880, 5);

  it('40% + 声望 ÷ 2%，最高 90%；请律政士 +20%', () => {
    expect(winChance(suit, 0, false)).toBeCloseTo(BASE_WIN_CHANCE);
    expect(winChance(suit, 40, false)).toBeCloseTo(0.6);
    expect(winChance(suit, 40, true)).toBeCloseTo(0.6 + LAWYER_BONUS);
    expect(winChance(suit, 100, true)).toBe(MAX_WIN_CHANCE);
    expect(caseCost(true)).toBeGreaterThan(caseCost(false));
  });

  it('对手是贵族时减半；其他罪名上诉更难', () => {
    const noble = appealCase(NOBLE_CLASH_CRIME, 1880, 5);
    const theft = appealCase('偷窃', 1880, 5);
    expect(noble.noble).toBe(true);
    expect(noble.claim).toBe(NOBLE_APPEAL_COMPENSATION);
    expect(winChance(noble, 0, false)).toBeCloseTo(0.2);
    expect(winChance(theft, 0, false)).toBeCloseTo(0.16);
    expect(theft.claim).toBe(0);
  });

  it('按胜诉率开庭', () => {
    expect(tryCase(suit, 0, false, () => 0.39)).toBe(true);
    expect(tryCase(suit, 0, false, () => 0.41)).toBe(false);
  });
});

describe('案件有效期', () => {
  it('上诉案只在服刑期间、罪名一致时有效', () => {
    const a = appealCase('偷窃', 1880, 5);
    expect(activeCases([a], '偷窃', 1880, 6)).toEqual([a]);
    expect(activeCases([a], null, 1880, 6)).toEqual([]);
    expect(activeCases([a], '走私', 1880, 6)).toEqual([]);
  });

  it(`起诉案 ${SUIT_EXPIRE_MONTHS} 个月内有效；同一案件不重复加入`, () => {
    const s = suitCase({ title: '起诉抢劫', defendant: '劫匪', claim: 1000 }, 1880, 5);
    expect(activeCases([s], null, 1881, 4)).toEqual([s]);
    expect(activeCases([s], null, 1881, 5)).toEqual([]);
    expect(addCase([s], s)).toHaveLength(1);
  });
});

describe('与推演事件联动', () => {
  const ev = (id: string) => SIM_EVENTS.find((e) => e.id === id)!;

  it('冲撞贵族跪地赔罪后可起诉贵族伤人', () => {
    expect(resolveOption(ev('noble_clash').options[0]).lawsuit).toMatchObject({ title: '起诉贵族伤人', noble: true, claim: 3000 });
  });

  it('被骗、欠薪、抢劫受损后可起诉', () => {
    expect(resolveOption(ev('swindled').options[1], () => 0.99).lawsuit?.claim).toBe(5000);
    expect(resolveOption(ev('wage_theft').options[0]).lawsuit?.title).toBe('起诉欠薪');
    expect(resolveOption(ev('robbery').options[0]).lawsuit?.title).toBe('起诉抢劫');
    expect(resolveOption(ev('robbery').options[1], () => 0).lawsuit).toBeUndefined();
  });
});
