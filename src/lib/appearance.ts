// 外貌系统（第 61 题）：捏脸 7 项、随年龄变化、子嗣遗传、「倾国倾城」特质。
// - 出生登记时捏脸；之后只能在理发店改发型、发色、胡子（五官与肤色不变，遗传才有意义）
// - 子嗣每一项外貌随机来自父亲或母亲，另有 MUTATION_CHANCE 概率随机突变
// - 「倾国倾城」（beauty）：天生特质，拥有者使用预设的特殊外貌；随机 2%，父母一方有 8%，双方都有 40%

export type Gender = '男' | '女';

export interface Appearance {
  skin: number;
  face: number;
  hair: number;
  hairColor: number;
  eyes: number;
  brows: number;
  beard: number;
  /** 「倾国倾城」预设外貌编号 */
  preset?: number;
}

export const SKIN_TONES = ['#FBE3D3', '#F5D0B8', '#EAC0A0', '#D9A57E', '#B9825A', '#8D5A3B'];
export const SKIN_LABELS = ['白皙', '浅肤', '自然', '小麦', '古铜', '深肤'];
export const FACE_LABELS = ['圆脸', '鹅蛋脸', '方脸'];
export const HAIR_LABELS = ['短发', '侧分', '卷发', '长发', '盘发', '麻花辫', '光头', '波浪发'];
export const HAIR_COLORS = ['#2b2b2b', '#6b4226', '#8b5a2b', '#e8c46a', '#b5482f', '#7a3b2e'];
export const HAIR_COLOR_LABELS = ['乌黑', '深棕', '栗色', '金色', '红发', '赤褐'];
export const EYE_LABELS = ['圆眼', '大眼', '细长眼', '慵懒眼'];
export const BROW_LABELS = ['平眉', '挑眉', '浓眉'];
export const BEARD_LABELS = ['无胡子', '八字胡', '山羊胡', '络腮胡'];

export const APPEARANCE_PARTS: Array<{ key: keyof Omit<Appearance, 'preset'>; label: string; options: string[] }> = [
  { key: 'skin', label: '肤色', options: SKIN_LABELS },
  { key: 'face', label: '脸型', options: FACE_LABELS },
  { key: 'hair', label: '发型', options: HAIR_LABELS },
  { key: 'hairColor', label: '发色', options: HAIR_COLOR_LABELS },
  { key: 'eyes', label: '眼睛', options: EYE_LABELS },
  { key: 'brows', label: '眉毛', options: BROW_LABELS },
  { key: 'beard', label: '胡子', options: BEARD_LABELS },
];

/** 理发店可以改的部位 */
export const BARBER_PARTS: Array<keyof Appearance> = ['hair', 'hairColor', 'beard'];
export const BARBER_COST = 300;

export const APPEARANCE_KEY = 'amigo_appearance';
export const MUTATION_CHANCE = 0.1;

const pickIndex = (n: number, rng: () => number) => Math.floor(rng() * n);

/** 女性多为长发、盘发、辫子；男性多为短发 */
const hairFor = (gender: Gender | null, rng: () => number) => {
  const pool = gender === '女' ? [3, 4, 5, 7, 1, 2] : gender === '男' ? [0, 1, 2, 6, 7] : [0, 1, 2, 3, 4, 5, 7];
  return pool[pickIndex(pool.length, rng)];
};

export const randomAppearance = (gender: Gender | null, rng: () => number = Math.random): Appearance => ({
  skin: pickIndex(SKIN_TONES.length, rng),
  face: pickIndex(FACE_LABELS.length, rng),
  hair: hairFor(gender, rng),
  hairColor: pickIndex(HAIR_COLORS.length, rng),
  eyes: pickIndex(EYE_LABELS.length, rng),
  brows: pickIndex(BROW_LABELS.length, rng),
  beard: gender === '男' ? pickIndex(BEARD_LABELS.length, rng) : 0,
});

/** 子嗣外貌：每一项随机来自父或母，另有 10% 突变；发型按孩子性别重新挑选；女性没有胡子 */
export const inheritAppearance = (
  a: Appearance | undefined,
  b: Appearance | undefined,
  gender: Gender,
  rng: () => number = Math.random,
): Appearance => {
  const fresh = randomAppearance(gender, rng);
  const from = (key: keyof Omit<Appearance, 'preset'>): number => {
    if (rng() < MUTATION_CHANCE) return fresh[key];
    const src = rng() < 0.5 ? a : b;
    return src?.[key] ?? (a ?? b)?.[key] ?? fresh[key];
  };
  return {
    skin: from('skin'),
    face: from('face'),
    hair: fresh.hair,
    hairColor: from('hairColor'),
    eyes: from('eyes'),
    brows: from('brows'),
    beard: gender === '男' ? from('beard') : 0,
  };
};

// ---------- 倾国倾城 ----------

export const BEAUTY_TRAIT = 'beauty';
export const BEAUTY_CHANCE = { none: 0.02, one: 0.08, both: 0.4 };

/** 预设的特殊外貌（男女各两套） */
export const BEAUTY_PRESETS: Record<Gender, Appearance[]> = {
  女: [
    { skin: 0, face: 1, hair: 7, hairColor: 3, eyes: 1, brows: 1, beard: 0, preset: 1 },
    { skin: 1, face: 1, hair: 4, hairColor: 0, eyes: 1, brows: 1, beard: 0, preset: 2 },
  ],
  男: [
    { skin: 1, face: 1, hair: 1, hairColor: 0, eyes: 2, brows: 2, beard: 0, preset: 3 },
    { skin: 2, face: 2, hair: 2, hairColor: 2, eyes: 1, brows: 1, beard: 1, preset: 4 },
  ],
};

export const beautyAppearance = (gender: Gender, rng: () => number = Math.random): Appearance => {
  const list = BEAUTY_PRESETS[gender];
  return { ...list[pickIndex(list.length, rng)] };
};

/** 是否天生「倾国倾城」：父母都有 40%，一方有 8%，都没有 2% */
export const rollBeauty = (a: string[] = [], b: string[] = [], rng: () => number = Math.random): boolean => {
  const n = Number(a.includes(BEAUTY_TRAIT)) + Number(b.includes(BEAUTY_TRAIT));
  return rng() < (n === 2 ? BEAUTY_CHANCE.both : n === 1 ? BEAUTY_CHANCE.one : BEAUTY_CHANCE.none);
};

/** 给特质列表加上或去掉「倾国倾城」，并返回对应的外貌 */
export const applyBeauty = (traits: string[], beauty: boolean, base: Appearance, gender: Gender, rng: () => number = Math.random) => {
  const without = traits.filter((t) => t !== BEAUTY_TRAIT);
  return beauty ? { traits: [...without, BEAUTY_TRAIT], appearance: beautyAppearance(gender, rng) } : { traits: without, appearance: base };
};

// ---------- 随年龄变化 ----------

export type AgeStage = 'child' | 'youth' | 'middle' | 'elder';
export const ageStage = (age: number): AgeStage => (age < 16 ? 'child' : age < 40 ? 'youth' : age < 60 ? 'middle' : 'elder');

/** 按年龄调整后的发色：40 岁起渐灰，60 岁起花白 */
export const hairColorAt = (a: Appearance, age: number): string => {
  const stage = ageStage(age);
  if (stage === 'elder') return '#d6d3d1';
  if (stage === 'middle' && age >= 50) return '#8a8580';
  return HAIR_COLORS[a.hairColor] ?? HAIR_COLORS[0];
};

/** 老年男性有一半会谢顶（按外貌稳定决定） */
export const isBaldAt = (a: Appearance, age: number, gender: Gender | null) =>
  a.hair === 6 || (gender === '男' && age >= 60 && (a.skin + a.face + a.eyes) % 2 === 0);
