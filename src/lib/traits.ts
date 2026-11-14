// 特质（undefined.md 第 27 题）：每个人物 1–3 个，子嗣按概率遗传父母的特质
// 本文件不依赖 family.ts，避免循环引用。

export interface TraitDef {
  id: string;
  name: string;
  desc: string;
  /** 不能同时拥有的特质 */
  conflicts?: string[];
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
    const t = TRAITS[Math.floor(rng() * TRAITS.length)];
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
