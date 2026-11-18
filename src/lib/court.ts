// 法院诉讼（第 67.6 题，用户 2026-11-18 确认）：维基没有帝国时期司法的记载，以下为架空设定。
// - 案件来源：入狱后可上诉（冲撞贵族入狱胜诉另获贵族赔偿；其他罪名证据确凿，胜诉率更低）；
//   冲撞贵族时跪地赔罪挨了鞭子，可起诉贵族伤人；被骗、被欠薪、遭抢劫后可起诉追回损失。
// - 诉讼费 COURT_FEE；胜诉率 = 40% + 声望 ÷ 2%，对手是贵族时减半、其他罪名上诉 ×0.4；
//   可加请律政士 LAWYER_FEE，胜诉率 +20%；最高 90%。
// - 每个案件只能开庭一次。败诉只损失费用；上诉败诉刑期 +1 个月。
// - 上诉胜诉：当即出狱，不留前科。上诉案只在服刑期间有效；起诉案 SUIT_EXPIRE_MONTHS 个月内有效（诉讼时效）。
// - 案件只跟着本人：传承后清除，重置人生清空。

import { loadStored, saveStored } from './storage';

export const COURT_FEE = 1_000;
export const LAWYER_FEE = 5_000;
export const LAWYER_BONUS = 0.2;
export const BASE_WIN_CHANCE = 0.4;
export const MAX_WIN_CHANCE = 0.9;
/** 对手是贵族时胜诉率减半 */
export const NOBLE_FACTOR = 0.5;
/** 冲撞贵族以外的罪名证据确凿，上诉胜诉率 ×0.4 */
export const GUILTY_APPEAL_FACTOR = 0.4;
/** 冲撞贵族上诉胜诉时贵族的赔偿 */
export const NOBLE_APPEAL_COMPENSATION = 5_000;
/** 上诉败诉加刑（月） */
export const APPEAL_LOSS_EXTRA_MONTHS = 1;
export const SUIT_EXPIRE_MONTHS = 12;
export const NOBLE_CLASH_CRIME = '冲撞贵族';

export type CaseKind = 'appeal' | 'suit';

export interface CourtCase {
  id: string;
  kind: CaseKind;
  /** 案由 */
  title: string;
  /** 对方 */
  defendant: string;
  /** 对方是否贵族 */
  noble: boolean;
  /** 胜诉可得的赔偿或追回的钱 */
  claim: number;
  /** 上诉案：对应的罪名 */
  crime?: string;
  year: number;
  month: number;
}

export interface CaseVerdict {
  id: string;
  title: string;
  won: boolean;
  text: string;
  year: number;
  month: number;
}

/** 推演事件里可起诉的结果 */
export interface LawsuitOutcome {
  title: string;
  defendant: string;
  claim: number;
  noble?: boolean;
}

export const COURT_CASES_KEY = 'amigo_court_cases';
export const COURT_HISTORY_KEY = 'amigo_court_history';
const HISTORY_LIMIT = 10;

const monthIndex = (year: number, month: number) => year * 12 + month;

const isCase = (c: unknown): c is CourtCase => {
  const x = c as Partial<CourtCase>;
  return !!x && typeof x.id === 'string' && (x.kind === 'appeal' || x.kind === 'suit') && typeof x.title === 'string' && typeof x.claim === 'number';
};
export const loadCases = (): CourtCase[] => {
  const raw = loadStored<unknown>(COURT_CASES_KEY, []);
  return Array.isArray(raw) ? raw.filter(isCase) : [];
};
export const saveCases = (cases: CourtCase[]) => saveStored(COURT_CASES_KEY, cases);
export const loadHistory = (): CaseVerdict[] => {
  const raw = loadStored<unknown>(COURT_HISTORY_KEY, []);
  return Array.isArray(raw) ? (raw as CaseVerdict[]) : [];
};
export const pushHistory = (v: CaseVerdict) => saveStored(COURT_HISTORY_KEY, [v, ...loadHistory()].slice(0, HISTORY_LIMIT));

/** 入狱时生成的上诉案 */
export const appealCase = (crime: string, year: number, month: number): CourtCase => {
  const noble = crime === NOBLE_CLASH_CRIME;
  return {
    id: `appeal_${year}_${month}_${crime}`,
    kind: 'appeal',
    title: `上诉：${crime}`,
    defendant: noble ? '受冲撞的贵族' : '帝国检察署',
    noble,
    claim: noble ? NOBLE_APPEAL_COMPENSATION : 0,
    crime,
    year,
    month,
  };
};

/** 推演事件结果生成的起诉案 */
export const suitCase = (s: LawsuitOutcome, year: number, month: number, salt = ''): CourtCase => ({
  id: `suit_${year}_${month}_${s.title}${salt}`,
  kind: 'suit',
  title: s.title,
  defendant: s.defendant,
  noble: !!s.noble,
  claim: s.claim,
  year,
  month,
});

/** 加入案件（同一 id 不重复） */
export const addCase = (cases: CourtCase[], c: CourtCase) => (cases.some((x) => x.id === c.id) ? cases : [...cases, c]);

/** 仍然有效的案件：上诉案只在服刑期间、罪名一致时有效；起诉案 12 个月内有效 */
export const activeCases = (cases: CourtCase[], prisonCrime: string | null, year: number, month: number) =>
  cases.filter((c) =>
    c.kind === 'appeal' ? prisonCrime !== null && c.crime === prisonCrime : monthIndex(year, month) - monthIndex(c.year, c.month) < SUIT_EXPIRE_MONTHS,
  );

/** 胜诉率 */
export const winChance = (c: CourtCase, reputation: number, lawyer: boolean) => {
  let chance = BASE_WIN_CHANCE + Math.max(0, reputation) / 200;
  if (c.noble) chance *= NOBLE_FACTOR;
  if (c.kind === 'appeal' && c.crime !== NOBLE_CLASH_CRIME) chance *= GUILTY_APPEAL_FACTOR;
  if (lawyer) chance += LAWYER_BONUS;
  return Math.min(MAX_WIN_CHANCE, chance);
};

export const caseCost = (lawyer: boolean) => COURT_FEE + (lawyer ? LAWYER_FEE : 0);

/** 开庭：返回是否胜诉 */
export const tryCase = (c: CourtCase, reputation: number, lawyer: boolean, rng: () => number = Math.random) => rng() < winChance(c, reputation, lawyer);
