// 社会福利（第 67.5 题，用户 2026-11-18 选定方案 A）：阿米诺斯维基中卡罗尼亚帝国时期没有失业救济、养老金等官方福利，
// 帝国时期只有宗教机构的「教会救济」：家里现金加存款不足 RELIEF_WEALTH_LIMIT，或健康低于 RELIEF_HEALTH_LIMIT 时，
// 每个季度可以领一次（不限阶层，富人家道中落也能领）。失业救济、养老金到联邦时代再开放。

import { CURRENCY } from '../data/seasons';

export const RELIEF_WEALTH_LIMIT = 500;
export const RELIEF_HEALTH_LIMIT = 30;
/** 领取记录的存档键：最近一次领取的季度（如 1871-Q2） */
export const RELIEF_KEY = 'amigo_relief_quarter';

export type ReliefId = 'soup' | 'alms';

export interface ReliefDef {
  id: ReliefId;
  name: string;
  desc: string;
  health?: number;
  coins?: number;
}

export const RELIEFS: ReliefDef[] = [
  { id: 'soup', name: '启明教经学院施粥', desc: '经学院在门前施粥，帮贫苦人家调养身体。', health: 10 },
  { id: 'alms', name: '东正教会救济金', desc: '东正教会向贫苦人家发放救济金。', coins: 300 },
];

/** 帝国时期尚未建立、联邦时代再开放的福利 */
export const FUTURE_WELFARE = [
  { name: '失业救济', note: '维基中失业救济是联邦时代工党的主张，帝国时期没有' },
  { name: '养老金', note: '帝国时期没有官方养老制度' },
];

export const quarterKey = (year: number, month: number) => `${year}-Q${Math.ceil(month / 3)}`;

export interface ReliefContext {
  isRegistered: boolean;
  /** 现金 + 存款 */
  wealth: number;
  health: number;
  year: number;
  month: number;
  /** 最近一次领取的季度 */
  lastQuarter: string | null;
}

/** 能否领取救济；可以时返回 null，否则返回原因 */
export const reliefBlocked = (ctx: ReliefContext): string | null => {
  if (!ctx.isRegistered) return '请先完成出生登记';
  if (ctx.lastQuarter === quarterKey(ctx.year, ctx.month)) return '本季度已经领过救济了，下个季度再来';
  if (ctx.wealth >= RELIEF_WEALTH_LIMIT && ctx.health >= RELIEF_HEALTH_LIMIT) {
    return `只有家里现金加存款不足 ${RELIEF_WEALTH_LIMIT.toLocaleString()} ${CURRENCY.symbol}，或健康低于 ${RELIEF_HEALTH_LIMIT} 时才能领`;
  }
  return null;
};

/** 领取后的健康与现金变化（健康最高 100） */
export const applyRelief = (relief: ReliefDef, health: number): { health: number; coins: number } => ({
  health: Math.min(100, health + (relief.health ?? 0)),
  coins: relief.coins ?? 0,
});
