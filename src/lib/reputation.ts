// 声望（undefined.md 第 22 题）：0–100，五个等级；是家族排行榜「影响力」的来源

export const REPUTATION_KEY = 'amigo_reputation';
export const CHARITY_KEY = 'amigo_charity_month';

export const REP = {
  marriage: 3,
  child: 2,
  divorce: -3,
  /** 月薪 ≥ HIGH_SALARY 的岗位每年 1 月 +1 */
  highSalaryYearly: 1,
  /** 继承人获得前任声望的比例 */
  heirShare: 0.5,
};
export const HIGH_SALARY = 40000;
/** 慈善：每 10,000 ₽ 声望 +1，每个游戏月最多 +5 */
export const CHARITY_UNIT = 10000;
export const CHARITY_MONTHLY_CAP = 5;

export const clampReputation = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export const REPUTATION_LEVELS: Array<[number, string]> = [
  [80, '名震帝国'],
  [60, '名声远扬'],
  [40, '受人尊敬'],
  [20, '小有名气'],
  [0, '无名之辈'],
];

export const reputationLevel = (rep: number) => REPUTATION_LEVELS.find(([min]) => rep >= min)?.[1] ?? '无名之辈';

/** 本月还能通过慈善获得多少声望 */
export const charityRemaining = (record: { month: string; gained: number } | null, monthKey: string) =>
  record && record.month === monthKey ? Math.max(0, CHARITY_MONTHLY_CAP - record.gained) : CHARITY_MONTHLY_CAP;
