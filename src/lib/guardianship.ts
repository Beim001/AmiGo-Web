// 未成年继承的监护（undefined.md 第 25 题 A）
// - 继承人未满 18 岁：现金与银行存款的一半交由监护人托管
// - 年满 18 岁：托管资产一次性返还；此后每月上缴返还金额的 1% 赡养监护人，持续 5 年或直到监护人去世
// - 监护人：前任主角在世的配偶 → 最年长的在世成年亲属 → 帝国育婴堂

export const GUARDIANSHIP_KEY = 'amigo_guardianship';
export const ADULT_AGE = 18;
export const SUPPORT_RATE = 0.01;
export const SUPPORT_MONTHS = 60;
export const ORPHANAGE_NAME = '帝国育婴堂';

export interface Guardianship {
  guardianName: string;
  /** 托管金额 */
  held: number;
  phase: 'holding' | 'supporting';
  supportPerMonth: number;
  supportMonthsLeft: number;
}

/** 把现金与各银行存款各取一半交由托管 */
export const takeCustody = <A extends { opened: boolean; deposit: number }>(
  cash: number,
  accounts: Record<string, A>,
): { cashLeft: number; accounts: Record<string, A>; held: number } => {
  const cashHeld = Math.floor(Math.max(0, cash) / 2);
  let depositHeld = 0;
  const next: Record<string, A> = {};
  for (const [id, acc] of Object.entries(accounts)) {
    if (!acc.opened || acc.deposit <= 0) {
      next[id] = acc;
      continue;
    }
    const half = Math.floor(acc.deposit / 2);
    depositHeld += half;
    next[id] = { ...acc, deposit: acc.deposit - half };
  }
  return { cashLeft: cash - cashHeld, accounts: next, held: cashHeld + depositHeld };
};

export interface GuardianshipStep {
  guardianship: Guardianship | null;
  /** 本月返还给继承人的金额 */
  returned: number;
  /** 本月上缴给监护人的赡养费 */
  support: number;
  note: string | null;
}

export const monthlyGuardianship = (g: Guardianship | null, heirAge: number, guardianAlive: boolean, cash: number): GuardianshipStep => {
  if (!g) return { guardianship: null, returned: 0, support: 0, note: null };
  if (g.phase === 'holding') {
    if (heirAge < ADULT_AGE) return { guardianship: g, returned: 0, support: 0, note: null };
    const per = Math.round(g.held * SUPPORT_RATE);
    return {
      guardianship: per > 0 && guardianAlive ? { ...g, phase: 'supporting', supportPerMonth: per, supportMonthsLeft: SUPPORT_MONTHS } : null,
      returned: g.held,
      support: 0,
      note: `成年了！${g.guardianName}返还托管资产 ${g.held.toLocaleString()} ₽`,
    };
  }
  if (!guardianAlive || g.supportMonthsLeft <= 0) {
    return { guardianship: null, returned: 0, support: 0, note: `对${g.guardianName}的赡养义务已结束` };
  }
  const support = Math.min(Math.max(0, cash), g.supportPerMonth);
  const left = g.supportMonthsLeft - 1;
  return { guardianship: left > 0 ? { ...g, supportMonthsLeft: left } : null, returned: 0, support, note: null };
};
