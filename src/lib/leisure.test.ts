import { describe, expect, it } from 'vitest';
import {
  BULLFIGHT_INJURY,
  BULLFIGHT_PRIZE,
  HOUSE_RETURN,
  LEISURES,
  MAX_ODDS,
  MIN_BET,
  PlayerCtx,
  RACE_ENTRY_FEE,
  RACE_PRIZE,
  betBlocked,
  compete,
  competeBlocked,
  contendersFor,
  maxBet,
  resolveBet,
  visitLeisure,
  visitedThisMonth,
  wrestlingChance,
} from './leisure';

const player = (over: Partial<PlayerCtx> = {}): PlayerCtx => ({
  isRegistered: true,
  age: 25,
  health: 80,
  coins: 100_000,
  vehicles: [],
  hasCock: false,
  ...over,
});
const always = (v: number) => () => v;

describe('下注（第 67.10 题）', () => {
  const betting = LEISURES.filter((l) => l.id !== 'theater');

  it('每注期望回报不超过 90%，单注最多翻 5 倍，胜率合计为 1', () => {
    for (let month = 1; month <= 24; month++) {
      for (const def of betting) {
        const cs = contendersFor(def.id, 1875 + Math.floor(month / 12), (month % 12) + 1);
        expect(cs.length).toBeGreaterThanOrEqual(2);
        expect(cs.reduce((s, c) => s + c.chance, 0)).toBeCloseTo(1);
        for (const c of cs) {
          expect(c.odds).toBeLessThanOrEqual(MAX_ODDS);
          expect(c.chance * c.odds).toBeLessThanOrEqual(HOUSE_RETURN + 1e-9);
        }
      }
    }
  });

  it('同一个月内参赛者与赔率固定', () => {
    expect(contendersFor('horse_race', 1880, 5)).toEqual(contendersFor('horse_race', 1880, 5));
  });

  it('按胜率开出结果，押中按赔率拿回，押错为 0', () => {
    const cs = contendersFor('casino', 1875, 1);
    expect(resolveBet(cs, 0, 1000, always(0.1))).toEqual({ winner: 0, payout: Math.floor(1000 * cs[0].odds) });
    expect(resolveBet(cs, 0, 1000, always(0.9))).toEqual({ winner: 1, payout: 0 });
  });

  it('未满 16 岁不能下注；每注至少 100，最多为现金的一半', () => {
    const ok = { isRegistered: true, age: 20, coins: 10_000, amount: 5_000 };
    expect(betBlocked(ok)).toBeNull();
    expect(betBlocked({ ...ok, age: 15 })).not.toBeNull();
    expect(betBlocked({ ...ok, amount: MIN_BET - 1 })).not.toBeNull();
    expect(betBlocked({ ...ok, amount: maxBet(ok.coins) + 1 })).not.toBeNull();
  });
});

describe('每月一次与雅俗声望', () => {
  it('雅事每月合计最多 +1，俗事每次 -1，斗牛摔跤观看不影响声望', () => {
    const a = visitLeisure({}, 'theater', 1880, 5);
    expect(a.rep).toBe(1);
    const b = visitLeisure(a.record, 'horse_race', 1880, 5);
    expect(b.rep).toBe(0);
    expect(visitLeisure(b.record, 'horse_race', 1880, 6).rep).toBe(1);
    expect(visitLeisure({}, 'casino', 1880, 5).rep).toBe(-1);
    expect(visitLeisure({}, 'wrestling', 1880, 5).rep).toBe(0);
    expect(visitedThisMonth(a.record, 'theater', 1880, 5)).toBe(true);
    expect(visitedThisMonth(a.record, 'theater', 1880, 6)).toBe(false);
  });
});

describe('亲自上场', () => {
  it('赛马要有骑乘马或名驹，名驹胜率更高', () => {
    expect(competeBlocked('horse_race', player())).not.toBeNull();
    const ctx = player({ vehicles: ['thoroughbred'] });
    expect(competeBlocked('horse_race', ctx)).toBeNull();
    expect(compete('horse_race', ctx, always(0.3))).toMatchObject({ won: true, coins: RACE_PRIZE - RACE_ENTRY_FEE });
    expect(compete('horse_race', player({ vehicles: ['riding_horse'] }), always(0.3))).toMatchObject({ won: false, coins: -RACE_ENTRY_FEE });
  });

  it('斗鸡要先买斗鸡，输了斗鸡会死', () => {
    expect(competeBlocked('cockfight', player())).not.toBeNull();
    expect(compete('cockfight', player({ hasCock: true }), always(0.9))).toMatchObject({ won: false, lostCock: true });
  });

  it('斗牛限 18–40 岁且健康不低于 60，输了重伤', () => {
    expect(competeBlocked('bullfight', player({ age: 17 }))).not.toBeNull();
    expect(competeBlocked('bullfight', player({ health: 59 }))).not.toBeNull();
    expect(compete('bullfight', player(), always(0.99))).toMatchObject({ won: false, health: -BULLFIGHT_INJURY });
    expect(compete('bullfight', player(), always(0))).toMatchObject({ won: true, coins: BULLFIGHT_PRIZE });
  });

  it('摔跤 20–30 岁、健康好时胜率最高', () => {
    expect(wrestlingChance(25, 80)).toBeGreaterThan(wrestlingChance(16, 80));
    expect(wrestlingChance(25, 80)).toBeGreaterThan(wrestlingChance(44, 80));
    expect(wrestlingChance(25, 100)).toBeGreaterThan(wrestlingChance(25, 40));
    expect(competeBlocked('wrestling', player({ age: 46 }))).not.toBeNull();
  });

  it('剧院与赌场不能亲自上场', () => {
    expect(competeBlocked('casino', player())).not.toBeNull();
  });
});
