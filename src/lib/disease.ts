// 疾病（undefined.md 第 20 题）：每月按年龄段概率患病，患病期间每月额外扣健康，直到在医院治愈或自愈

export type AgeGroup = 'child' | 'adult' | 'middle' | 'elder';

export interface DiseaseInfo {
  id: string;
  name: string;
  group: AgeGroup;
  /** 每月额外扣除的健康 */
  monthlyDamage: number;
  /** 自愈所需月数；null 表示不会自愈，必须就医 */
  selfHealMonths: number | null;
  /** 医院治疗费（再乘以医院折扣） */
  cost: number;
  /** 传染病：痊愈或接种后可能获得抗体（第 53 题） */
  infectious?: boolean;
  /** 疫苗问世年份（按历史）；没有则无疫苗 */
  vaccineYear?: number;
  /** 接种费用 */
  vaccineCost?: number;
}

export const DISEASES: DiseaseInfo[] = [
  // 疫苗年份按历史：天花（琴纳牛痘，1796）、伤寒与霍乱（1896）、白喉（1913）、百日咳（1914）、肺结核（卡介苗，1921）、麻疹（1963）
  { id: 'measles', name: '麻疹', group: 'child', monthlyDamage: 3, selfHealMonths: 2, cost: 1500, infectious: true, vaccineYear: 1963, vaccineCost: 800 },
  { id: 'pertussis', name: '百日咳', group: 'child', monthlyDamage: 2, selfHealMonths: 3, cost: 1200, infectious: true, vaccineYear: 1914, vaccineCost: 600 },
  { id: 'diphtheria', name: '白喉', group: 'child', monthlyDamage: 5, selfHealMonths: null, cost: 4000, infectious: true, vaccineYear: 1913, vaccineCost: 1000 },
  { id: 'smallpox', name: '天花', group: 'child', monthlyDamage: 7, selfHealMonths: null, cost: 8000, infectious: true, vaccineYear: 1796, vaccineCost: 300 },
  { id: 'typhoid', name: '伤寒', group: 'adult', monthlyDamage: 5, selfHealMonths: 3, cost: 4000, infectious: true, vaccineYear: 1896, vaccineCost: 1500 },
  { id: 'malaria', name: '疟疾', group: 'adult', monthlyDamage: 3, selfHealMonths: 4, cost: 3000, infectious: true },
  { id: 'cholera', name: '霍乱', group: 'adult', monthlyDamage: 9, selfHealMonths: null, cost: 6000, infectious: true, vaccineYear: 1896, vaccineCost: 2000 },
  { id: 'tuberculosis', name: '肺结核', group: 'adult', monthlyDamage: 3, selfHealMonths: null, cost: 20000, infectious: true, vaccineYear: 1921, vaccineCost: 3000 },
  { id: 'gout', name: '痛风', group: 'middle', monthlyDamage: 2, selfHealMonths: 4, cost: 5000 },
  { id: 'pneumonia', name: '肺炎', group: 'middle', monthlyDamage: 6, selfHealMonths: null, cost: 8000 },
  { id: 'heart', name: '心脏病', group: 'middle', monthlyDamage: 4, selfHealMonths: null, cost: 30000 },
  { id: 'elder_pneumonia', name: '老年肺炎', group: 'elder', monthlyDamage: 8, selfHealMonths: null, cost: 12000 },
  { id: 'stroke', name: '中风', group: 'elder', monthlyDamage: 10, selfHealMonths: null, cost: 50000 },
  { id: 'heart_failure', name: '心力衰竭', group: 'elder', monthlyDamage: 6, selfHealMonths: null, cost: 40000 },
];

/** 每月患病基础概率 */
export const MONTHLY_DISEASE_CHANCE: Record<AgeGroup, number> = {
  child: 0.03,
  adult: 0.02,
  middle: 0.03,
  elder: 0.06,
};

// ---------- 疫苗与抗体（第 53 题，默认值） ----------

export const ANTIBODY_KEY = 'amigo_antibodies';
/** 接种后获得抗体的概率 */
export const VACCINE_SUCCESS = 0.8;
/** 传染病痊愈（自愈或治愈）后获得抗体的概率 */
export const RECOVERY_IMMUNITY = 0.5;
/** 父母每种抗体遗传给孩子的概率 */
export const ANTIBODY_INHERIT = 0.3;

export const diseaseById = (id: string) => DISEASES.find((d) => d.id === id);
export const antibodyNames = (ids: string[] | undefined) => (ids ?? []).map((id) => diseaseById(id)?.name ?? id);

/** 当年已经问世的疫苗 */
export const vaccinesAvailable = (year: number) => DISEASES.filter((d) => d.vaccineYear !== undefined && year >= d.vaccineYear);

/** 痊愈后是否获得抗体（只有传染病会） */
export const immunityAfterRecovery = (diseaseId: string, rng: () => number = Math.random) =>
  !!diseaseById(diseaseId)?.infectious && rng() < RECOVERY_IMMUNITY;

/** 子女遗传抗体：父母每种抗体各有 ANTIBODY_INHERIT 的概率传下去 */
export const inheritAntibodies = (a: string[] = [], b: string[] = [], rng: () => number = Math.random): string[] =>
  [...new Set([...a, ...b])].filter(() => rng() < ANTIBODY_INHERIT);

export const ageGroupOf = (age: number): AgeGroup => (age < 16 ? 'child' : age < 50 ? 'adult' : age < 65 ? 'middle' : 'elder');

export const DISEASE_KEY = 'amigo_disease';

export interface ActiveDisease {
  id: string;
  /** 已患病月数 */
  months: number;
}

export const diseaseInfo = (active: ActiveDisease | null | undefined): DiseaseInfo | null =>
  active ? DISEASES.find((d) => d.id === active.id) ?? null : null;

export interface DiseaseProgress {
  active: ActiveDisease | null;
  /** 本月因病扣除的健康 */
  damage: number;
  /** 本月新患的疾病 */
  contracted: DiseaseInfo | null;
  /** 本月自愈的疾病 */
  recovered: DiseaseInfo | null;
}

/**
 * 每月疾病结算：已患病则扣健康并累计月数（到期自愈）；未患病则按年龄段概率患病。
 * 同一时间最多患一种病；新患的疾病从下个月开始扣健康。
 */
export const progressDisease = (
  active: ActiveDisease | null,
  age: number,
  multiplier = 1,
  rng: () => number = Math.random,
  /** 已有抗体的疾病不会再患 */
  antibodies: string[] = [],
): DiseaseProgress => {
  const current = diseaseInfo(active);
  if (current && active) {
    const months = active.months + 1;
    if (current.selfHealMonths !== null && months >= current.selfHealMonths) {
      return { active: null, damage: current.monthlyDamage, contracted: null, recovered: current };
    }
    return { active: { id: current.id, months }, damage: current.monthlyDamage, contracted: null, recovered: null };
  }

  const group = ageGroupOf(age);
  if (rng() >= MONTHLY_DISEASE_CHANCE[group] * multiplier) return { active: null, damage: 0, contracted: null, recovered: null };
  const options = DISEASES.filter((d) => d.group === group && !antibodies.includes(d.id));
  if (options.length === 0) return { active: null, damage: 0, contracted: null, recovered: null };
  const disease = options[Math.floor(rng() * options.length)];
  return { active: { id: disease.id, months: 0 }, damage: 0, contracted: disease, recovered: null };
};
