import { describe, expect, it } from 'vitest';
import { RELIEFS, RELIEF_HEALTH_LIMIT, RELIEF_WEALTH_LIMIT, BEGGAR_KING_QUARTERS, applyRelief, earnsBeggarKing, nextReliefRecord, reliefBlocked, ReliefContext, ReliefRecord } from './welfare';

const ctx = (over: Partial<ReliefContext> = {}): ReliefContext => ({
  isRegistered: true,
  wealth: RELIEF_WEALTH_LIMIT - 1,
  health: 80,
  year: 1875,
  month: 5,
  record: null,
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
    const q2 = nextReliefRecord(null, 1875, 5);
    expect(reliefBlocked(ctx({ record: q2, month: 6 }))).not.toBeNull();
    expect(reliefBlocked(ctx({ record: q2, month: 7 }))).toBeNull();
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

describe('成就「丐帮帮主」', () => {
  /** 从 1875 年第一季度起连续领 n 个季度后的记录 */
  const streakOf = (n: number): ReliefRecord => {
    let r: ReliefRecord | null = null;
    for (let i = 0; i < n; i++) r = nextReliefRecord(r, 1875 + Math.floor(i / 4), (i % 4) * 3 + 1);
    return r!;
  };

  it('中间漏掉一个季度，连续季度数重新计算', () => {
    const q1 = nextReliefRecord(null, 1875, 1);
    expect(nextReliefRecord(q1, 1875, 4).streak).toBe(2);
    expect(nextReliefRecord(q1, 1875, 7).streak).toBe(1);
  });

  it(`连续 ${BEGGAR_KING_QUARTERS} 个季度领救济、期间没有工作才解锁`, () => {
    expect(earnsBeggarKing(streakOf(BEGGAR_KING_QUARTERS), null)).toBe(true);
    expect(earnsBeggarKing(streakOf(BEGGAR_KING_QUARTERS - 1), null)).toBe(false);
  });

  it('这一年里领过月薪或童工收入的不算；更早以前工作过的不影响', () => {
    const r = streakOf(BEGGAR_KING_QUARTERS);
    expect(earnsBeggarKing(r, 1875 * 12 + 3)).toBe(false);
    expect(earnsBeggarKing(r, 1874 * 12 + 12)).toBe(true);
  });
});
