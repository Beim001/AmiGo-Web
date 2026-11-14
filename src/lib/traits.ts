// 特质（undefined.md 第 27 题）：每个人物 1–3 个，子嗣按概率遗传父母的特质
// 本文件不依赖 family.ts，避免循环引用。

export interface TraitDef {
  id: string;
  name: string;
  desc: string;
  /** 不能同时拥有的特质 */
  conflicts?: string[];
  /** 特殊特质：不进随机池，只能通过保养或贵族、皇族出身获得（第 50 题） */
  special?: boolean;
}

export const TRAITS: TraitDef[] = [
  { id: 'fertile', name: '易孕', desc: '夫妻任一方有此特质：生育概率 ×2', conflicts: ['infertile'] },
  { id: 'twins', name: '双胞胎体质', desc: '夫妻任一方有此特质：双胞胎概率提高到 20%', conflicts: ['infertile'] },
  { id: 'infertile', name: '不孕', desc: '夫妻任一方有此特质：无法生育', conflicts: ['fertile', 'twins'] },
  { id: 'robust', name: '体魄强健', desc: '患病概率 ×0.5', conflicts: ['sickly'] },
  { id: 'sickly', name: '体弱多病', desc: '患病概率 ×1.5', conflicts: ['robust'] },
  { id: 'longevity', name: '长寿', desc: '50 岁起每月年龄衰减 -1' },
  { id: 'diligent', name: '勤勉', desc: '月薪 +10%' },
  { id: 'shrewd', name: '精明', desc: '银行存款利息 +20%' },
  { id: 'amiable', name: '亲和', desc: '家族互动好感度额外 +1' },
  { id: 'vigorous', name: '精力旺盛', desc: '生育年龄上限延长到女 50 岁、男 65 岁', special: true },
  { id: 'pampered', name: '富养', desc: '生育年龄上限延长到女 50 岁、男 65 岁', special: true },
];

export const TRAIT_INHERIT_CHANCE = 0.3;
export const MAX_TRAITS = 3;
export const TWIN_CHANCE_WITH_TRAIT = 0.2;

export const traitById = (id: string) => TRAITS.find((t) => t.id === id);
export const traitNames = (ids: string[] | undefined) => (ids ?? []).map((id) => traitById(id)?.name ?? id);

const compatible = (current: string[], id: string) =>
  !current.includes(id) && !current.some((c) => traitById(c)?.conflicts?.includes(id) || traitById(id)?.conflicts?.includes(c));

/** 在已有特质基础上随机补足到 target 个（不冲突） */
const fillRandom = (current: string[], target: number, rng: () => number): string[] => {
  const result = [...current];
  for (let attempt = 0; result.length < target && attempt < 50; attempt++) {
    const pool = TRAITS.filter((x) => !x.special);
    const t = pool[Math.floor(rng() * pool.length)];
    if (compatible(result, t.id)) result.push(t.id);
  }
  return result;
};

/** 随机 1–3 个特质 */
export const randomTraits = (rng: () => number = Math.random): string[] => fillRandom([], 1 + Math.floor(rng() * MAX_TRAITS), rng);

/** 子嗣遗传：父母每个特质各有 30% 概率遗传；不足 1 个时随机补足，最多 3 个 */
export const inheritTraits = (a: string[] = [], b: string[] = [], rng: () => number = Math.random): string[] => {
  const result: string[] = [];
  for (const id of [...new Set([...a, ...b])]) {
    if (result.length >= MAX_TRAITS) break;
    if (rng() < TRAIT_INHERIT_CHANCE && compatible(result, id)) result.push(id);
  }
  return result.length > 0 ? result : fillRandom([], 1, rng);
};

const has = (id: string, ...groups: Array<string[] | undefined>) => groups.some((g) => g?.includes(id));

/** 生育概率倍数：任一方不孕为 0，任一方易孕为 2 */
export const fertilityMultiplier = (a?: string[], b?: string[]) => (has('infertile', a, b) ? 0 : has('fertile', a, b) ? 2 : 1);
export const twinChanceFor = (base: number, a?: string[], b?: string[]) => (has('twins', a, b) ? TWIN_CHANCE_WITH_TRAIT : base);
export const diseaseTraitMultiplier = (t?: string[]) => (has('robust', t) ? 0.5 : has('sickly', t) ? 1.5 : 1);
export const decayReduction = (t: string[] | undefined, age: number) => (has('longevity', t) && age >= 50 ? 1 : 0);
export const salaryMultiplier = (t?: string[]) => (has('diligent', t) ? 1.1 : 1);
export const depositInterestMultiplier = (t?: string[]) => (has('shrewd', t) ? 1.2 : 1);
export const affinityBonus = (t?: string[]) => (has('amiable', t) ? 1 : 0);

export const PLAYER_TRAITS_KEY = 'amigo_player_traits';

// ---------- 生育年龄（第 50 题，默认值） ----------

/** 能延长生育年龄的特质 */
export const FERTILITY_TRAITS = ['vigorous', 'pampered'];
export const FERTILE_MAX_AGE: Record<'男' | '女', number> = { 女: 42, 男: 55 };
export const FERTILE_MAX_AGE_EXTENDED: Record<'男' | '女', number> = { 女: 50, 男: 65 };
/** 性别未知时（旧数据）沿用原来的 45 岁 */
export const FERTILE_MAX_AGE_UNKNOWN = 45;

/** 此人能生育的最大年龄 */
export const fertileMaxAge = (gender: string | null | undefined, traits?: string[]): number => {
  if (gender !== '男' && gender !== '女') return FERTILE_MAX_AGE_UNKNOWN;
  return FERTILITY_TRAITS.some((id) => traits?.includes(id)) ? FERTILE_MAX_AGE_EXTENDED[gender] : FERTILE_MAX_AGE[gender];
};

/** 保养：每次花费 MAINTENANCE_COST，有 MAINTENANCE_CHANCE 概率获得一项还没有的「精力旺盛」或「富养」 */
export const MAINTENANCE_COST = 20000;
export const MAINTENANCE_CHANCE = 0.25;
/** 简洁模式每月自动保养时的概率（低于手动保养） */
export const SIMPLE_MAINTENANCE_CHANCE = 0.1;
/** 自动保养时至少保留的现金 */
export const SIMPLE_MAINTENANCE_RESERVE = 50000;

export const rollMaintenance = (
  traits: string[],
  rng: () => number = Math.random,
  chance: number = MAINTENANCE_CHANCE,
): { traits: string[]; gained: string | null } => {
  const missing = FERTILITY_TRAITS.filter((id) => !traits.includes(id));
  if (missing.length === 0 || rng() >= chance) return { traits, gained: null };
  const gained = missing[Math.floor(rng() * missing.length)];
  return { traits: [...traits, gained], gained };
};

/** 贵族、皇族出身：出生登记时有概率自带「精力旺盛」或「富养」 */
export const NOBLE_FERTILITY_CHANCE: Record<string, number> = { noble: 0.3, royal: 0.5 };

export const withBirthPrivilege = (classId: string, traits: string[], rng: () => number = Math.random): string[] => {
  const chance = NOBLE_FERTILITY_CHANCE[classId] ?? 0;
  if (chance <= 0 || rng() >= chance || FERTILITY_TRAITS.some((id) => traits.includes(id))) return traits;
  return [...traits, FERTILITY_TRAITS[Math.floor(rng() * FERTILITY_TRAITS.length)]];
};
