// 月度核心循环的数值规则（决定见 undefined.md 第一部分）

/** 固定基本俸禄（保留） */
export const BASE_STIPEND = 1500;
/** 月薪 = 日薪 × 每月工作日（第 2 题：固定按月发薪，取消手动打卡） */
export const WORK_DAYS_PER_MONTH = 22;
/** 就业年龄（第 3 题：A） */
export const MIN_WORK_AGE = 16;

/** 每月自然健康衰减（第 1 题：A 温和） */
export const healthDecayForAge = (age: number): number => {
  if (age >= 65) return 5;
  if (age >= 50) return 3;
  if (age >= 30) return 2;
  return 1;
};

export const monthlySalary = (dailySalary: number | null | undefined, age: number): number =>
  dailySalary && age >= MIN_WORK_AGE ? dailySalary * WORK_DAYS_PER_MONTH : 0;

/** 未满 18 岁住在父母家：没有自己的住处时，按父母家计算住房舒适度（随家族阶层不同，乞丐家庭为 0）；医疗费由父母承担 */
export const ADULT_AGE = 18;
/** 旧版默认的父母家舒适度（未传入阶层时使用） */
export const PARENT_HOME_COMFORT = 5;
export const isMinor = (age: number) => age < ADULT_AGE;

/** 老年住房加成打折：50–64 岁保留 60%，65 岁及以上保留 30%（向下取整） */
export const housingComfortFactor = (age: number): number => {
  if (age >= 65) return 0.3;
  if (age >= 50) return 0.6;
  return 1;
};

/**
 * 本月实际的住房舒适度恢复
 * @param ownComfort 自有住房/租房提供的舒适度（没有住处为 0）
 * @param parentHomeComfort 父母家的舒适度（由家族阶层决定，乞丐家庭为 0）
 */
export const effectiveComfort = (ownComfort: number, age: number, parentHomeComfort = PARENT_HOME_COMFORT): number => {
  const base = ownComfort > 0 ? ownComfort : isMinor(age) ? parentHomeComfort : 0;
  return Math.floor(base * housingComfortFactor(age));
};

/**
 * 健康变化：住房舒适度恢复 − 年龄衰减 − 额外损耗（疾病、童工），结果限制在 0–100
 * （comfortBonus 应已用 effectiveComfort 计算）
 */
export const nextHealth = (health: number, comfortBonus: number, age: number, extraDamage = 0): number =>
  Math.max(0, Math.min(100, health + comfortBonus - healthDecayForAge(age) - extraDamage));
