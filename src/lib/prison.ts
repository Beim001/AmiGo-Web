// 监狱服刑（第 67.7 题，用户 2026-11-18 确认）
// - 入狱途径：犯罪推演事件（走私、偷窃、斗殴、伪造票据）失败入狱 3–12 个月；平民、乞丐上街冲撞贵族被抓；
//   现有事件被抓时（私藏钱包、地下赌局）一定概率拘留 1 个月；去赌场、斗鸡有 RAID_CHANCE 概率遇上巡捕查抄，拘留 1 个月。
//   历史大事件（起义、逃役）以后做时再接入。
// - 入狱：丢掉工作（含童工），声望 JAIL_REPUTATION。
// - 狱中：不能求职、处理推演事件、去文娱场所、结婚、出国旅行；没有零花与俸禄；
//   每月健康 PRISON_HEALTH_LOSS、在世家人好感 PRISON_AFFINITY_LOSS。可以打点狱卒，每 BRIBE_PER_MONTH 减刑 1 个月（维基：腐败盛行）。
// - 出狱后留「前科」CRIMINAL_RECORD_YEARS 年：政法治安类岗位不录用，结婚候选人减半。
// - 服刑与前科都是个人的：传承后继承人不受影响；重置人生清空。

import { loadStored, saveStored } from './storage';

export const JAIL_REPUTATION = -5;
export const PRISON_HEALTH_LOSS = 5;
export const PRISON_AFFINITY_LOSS = 1;
export const BRIBE_PER_MONTH = 2_000;
export const CRIMINAL_RECORD_YEARS = 10;
/** 去赌场、斗鸡遇上巡捕查抄的概率 */
export const RAID_CHANCE = 0.03;
/** 有前科时不录用的岗位类别 */
export const BARRED_JOB_CATEGORY = '政法治安';

export interface PrisonState {
  /** 罪名 */
  crime: string;
  /** 刑期（月） */
  sentence: number;
  /** 剩余刑期（月） */
  monthsLeft: number;
  year: number;
  month: number;
}

/** 前科到期的月份（年 × 12 + 月） */
export interface CriminalRecord {
  crime: string;
  until: number;
}

export const PRISON_KEY = 'amigo_prison';
export const CRIMINAL_RECORD_KEY = 'amigo_criminal_record';

const monthIndex = (year: number, month: number) => year * 12 + month;

export const parsePrison = (raw: unknown): PrisonState | null => {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Partial<PrisonState>;
  if (typeof p.crime !== 'string' || typeof p.monthsLeft !== 'number' || p.monthsLeft <= 0) return null;
  return { crime: p.crime, sentence: p.sentence ?? p.monthsLeft, monthsLeft: Math.ceil(p.monthsLeft), year: p.year ?? 0, month: p.month ?? 0 };
};
export const loadPrison = (): PrisonState | null => parsePrison(loadStored<unknown>(PRISON_KEY, null));
export const savePrison = (p: PrisonState | null) => saveStored(PRISON_KEY, p);

export const parseRecord = (raw: unknown): CriminalRecord | null => {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<CriminalRecord>;
  return typeof r.crime === 'string' && typeof r.until === 'number' ? { crime: r.crime, until: r.until } : null;
};
export const loadCriminalRecord = (): CriminalRecord | null => parseRecord(loadStored<unknown>(CRIMINAL_RECORD_KEY, null));
export const saveCriminalRecord = (r: CriminalRecord | null) => saveStored(CRIMINAL_RECORD_KEY, r);

export const isInPrison = () => loadPrison() !== null;

/** 前科是否仍在有效期内 */
export const hasRecord = (record: CriminalRecord | null, year: number, month: number) => !!record && monthIndex(year, month) < record.until;
export const hasActiveRecord = (year: number, month: number) => hasRecord(loadCriminalRecord(), year, month);

/** 判刑 */
export const sentenceTo = (crime: string, months: number, year: number, month: number): PrisonState => ({
  crime,
  sentence: months,
  monthsLeft: months,
  year,
  month,
});

/** 出狱时留下的前科（从出狱当月起算 10 年） */
export const recordOnRelease = (crime: string, year: number, month: number): CriminalRecord => ({
  crime,
  until: monthIndex(year, month) + CRIMINAL_RECORD_YEARS * 12,
});

/** 每月服刑：剩余刑期减一；刑满时返回 released */
export const serveMonth = (p: PrisonState): { prison: PrisonState | null; released: boolean } => {
  const left = p.monthsLeft - 1;
  return left <= 0 ? { prison: null, released: true } : { prison: { ...p, monthsLeft: left }, released: false };
};

/** 打点：用 coins 最多能减几个月（不超过剩余刑期） */
export const bribeMonths = (p: PrisonState, coins: number) => Math.min(p.monthsLeft, Math.floor(Math.max(0, coins) / BRIBE_PER_MONTH));

/** 狱中禁止的行为提示 */
export const PRISON_BLOCK_TEXT = '正在狱中服刑，出狱后才能办理';

/** 前科：是否被这个岗位拒绝 */
export const barredByRecord = (job: { category: string }, record: boolean) => record && job.category === BARRED_JOB_CATEGORY;

/** 前科：结婚候选人减半 */
export const candidateCount = (base: number, record: boolean) => (record ? Math.max(1, Math.floor(base / 2)) : base);

/** 狱中每月家人好感下降（只影响在世的家人；以 state 中已有的好感为准） */
export const lowerFamilyAffinity = <S extends { affinity: Record<string, number> }>(
  state: S,
  members: Array<{ id: string; isPlayer?: boolean; status?: string; affinity: number }>,
): S => {
  const affinity = { ...state.affinity };
  members
    .filter((m) => !m.isPlayer && m.status !== '已故')
    .forEach((m) => {
      affinity[m.id] = Math.max(0, (affinity[m.id] ?? m.affinity) - PRISON_AFFINITY_LOSS);
    });
  return { ...state, affinity };
};
