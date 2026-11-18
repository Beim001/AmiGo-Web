import { describe, expect, it } from 'vitest';
import { RELIEFS, RELIEF_HEALTH_LIMIT, RELIEF_WEALTH_LIMIT, applyRelief, quarterKey, reliefBlocked, ReliefContext } from './welfare';

const ctx = (over: Partial<ReliefContext> = {}): ReliefContext => ({
  isRegistered: true,
  wealth: RELIEF_WEALTH_LIMIT - 1,
  health: 80,
  year: 1875,
  month: 5,
  lastQuarter: null,
  ...over,
});

describe('教会救济资格', () => {
  it('现金加存款不足或健康过低时都可以领，不限阶层', () => {
    expect(reliefBlocked(ctx())).toBeNull();
    expect(reliefBlocked(ctx({ wealth: 1_000_000, health: RELIEF_HEALTH_LIMIT - 1 }))).toBeNull();
  });

  it('家境与健康都正常时不能领', () => {
    expect(reliefBlocked(ctx({ wealth: RELIEF_WEALTH_LIMIT, health: RELIEF_HEALTH_LIMIT }))).not.toBeNull();
  });

  it('每个季度只能领一次，下个季度可以再领', () => {
    const q2 = quarterKey(1875, 5);
    expect(reliefBlocked(ctx({ lastQuarter: q2, month: 6 }))).not.toBeNull();
    expect(reliefBlocked(ctx({ lastQuarter: q2, month: 7 }))).toBeNull();
  });

  it('未出生登记时不能领', () => {
    expect(reliefBlocked(ctx({ isRegistered: false }))).not.toBeNull();
  });
});

describe('救济效果', () => {
  const soup = RELIEFS.find((r) => r.id === 'soup')!;
  const alms = RELIEFS.find((r) => r.id === 'alms')!;

  it('施粥恢复健康且不超过 100；救济金只发钱', () => {
    expect(applyRelief(soup, 25).health).toBe(25 + soup.health!);
    expect(applyRelief(soup, 95).health).toBe(100);
    expect(applyRelief(alms, 25)).toEqual({ health: 25, coins: alms.coins });
  });
});
