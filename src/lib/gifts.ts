// 家族礼物（undefined.md 第 35 题）
// - 来源：限定宝箱，每抽 30% 概率得到一件礼物（从原先 80% 的金币档中分出，服饰概率与保底不变）
// - 品质：普通 / 精致 / 珍贵，送出时好感 +5 / +10 / +20；送到对方喜好的礼物好感翻倍
// - 喜好：未满 16 岁的孩子都喜欢玩具；成年人的喜好出生时就随机决定（玩具 / 首饰 / 茶叶古董），
//   之后每月有小概率改变，改变后记入 FamilyState.giftTastes
// - 送礼物与现金赠礼都算本月与该家人的互动（每位家人每月 1 次）
// - 礼物背包不随家族传承清空，只有重置人生才清空

export type GiftQuality = '普通' | '精致' | '珍贵';
export type GiftTaste = 'toy' | 'jewelry' | 'antique';

export interface GiftDef {
  id: string;
  name: string;
  quality: GiftQuality;
  /** 礼物类别，与家人的喜好对应 */
  taste: GiftTaste;
  desc: string;
}

export const GIFTS: GiftDef[] = [
  { id: 'tin_soldier', name: '锡制小兵', quality: '普通', taste: 'toy', desc: '一盒涂着鲜艳军装的锡兵玩偶。' },
  { id: 'clockwork_train', name: '发条小火车', quality: '精致', taste: 'toy', desc: '上紧发条就能绕着轨道跑的黄铜小火车。' },
  { id: 'music_box', name: '自动人偶八音盒', quality: '珍贵', taste: 'toy', desc: '打开盒盖，小人偶会随乐声旋转起舞。' },
  { id: 'silk_handkerchief', name: '丝绸手帕', quality: '普通', taste: 'jewelry', desc: '绣着家族纹样的丝绸手帕。' },
  { id: 'pearl_brooch', name: '珍珠胸针', quality: '精致', taste: 'jewelry', desc: '镶着淡水珍珠的银质胸针。' },
  { id: 'sapphire_necklace', name: '蓝宝石项链', quality: '珍贵', taste: 'jewelry', desc: '一颗深蓝色宝石坠在细金链上。' },
  { id: 'black_tea', name: '里海红茶', quality: '普通', taste: 'antique', desc: '一罐产自里海沿岸的上等红茶。' },
  { id: 'meerschaum_pipe', name: '海泡石烟斗', quality: '精致', taste: 'antique', desc: '雕着狮头的海泡石烟斗，配一只皮囊。' },
  { id: 'mantel_clock', name: '古董座钟', quality: '珍贵', taste: 'antique', desc: '鎏金外壳的老座钟，报时声沉稳悠长。' },
];

export const TASTES: GiftTaste[] = ['toy', 'jewelry', 'antique'];
export const GIFT_TASTE_LABEL: Record<GiftTaste, string> = { toy: '玩具', jewelry: '首饰', antique: '茶叶古董' };

export const GIFT_AFFINITY: Record<GiftQuality, number> = { 普通: 5, 精致: 10, 珍贵: 20 };
/** 抽到礼物时各品质的概率 */
export const GIFT_QUALITY_WEIGHTS: Record<GiftQuality, number> = { 普通: 0.7, 精致: 0.25, 珍贵: 0.05 };
/** 送到对方喜好的礼物时好感倍数 */
export const LIKED_MULTIPLIER = 2;
/** 未满此年龄的孩子都喜欢玩具 */
export const CHILD_AGE = 16;
/** 成年家人每月改变喜好的概率（约每 9 年一次） */
export const TASTE_CHANGE_CHANCE = 0.01;

export const GIFT_QUALITY_STYLE: Record<GiftQuality, string> = {
  普通: 'bg-gray-700 text-gray-200',
  精致: 'bg-sky-600 text-white',
  珍贵: 'bg-amber-500 text-black',
};

export const giftById = (id: string) => GIFTS.find((g) => g.id === id);

/** 按品质概率抽一件礼物，同品质内均匀选择 */
export const rollGift = (rng: () => number = Math.random): GiftDef => {
  const r = rng();
  let acc = 0;
  let quality: GiftQuality = '普通';
  for (const q of ['普通', '精致', '珍贵'] as GiftQuality[]) {
    acc += GIFT_QUALITY_WEIGHTS[q];
    if (r < acc) {
      quality = q;
      break;
    }
  }
  const pool = GIFTS.filter((g) => g.quality === quality);
  return pool[Math.floor(rng() * pool.length)] ?? pool[0];
};

// ---------- 喜好 ----------

/** 成员 id → 改变后的成年喜好（未记录时用出生喜好） */
export type GiftTastes = Record<string, GiftTaste>;

/** 出生时决定的成年喜好：由成员 id 稳定地算出，同一个人每次结果相同 */
export const birthTaste = (id: string): GiftTaste => {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return TASTES[(h >>> 0) % TASTES.length];
};

export interface TasteSubject {
  id: string;
  age: number;
  isPlayer?: boolean;
}

/** 家人当前的礼物喜好；玩家本人返回 null */
export const tasteOf = (member: TasteSubject, tastes: GiftTastes = {}): GiftTaste | null => {
  if (member.isPlayer) return null;
  if (member.age < CHILD_AGE) return 'toy';
  return tastes[member.id] ?? birthTaste(member.id);
};

/** 送出这件礼物能增加的好感（不含特质加成） */
export const giftAffinityGain = (gift: GiftDef, member: TasteSubject, tastes: GiftTastes = {}) =>
  GIFT_AFFINITY[gift.quality] * (tasteOf(member, tastes) === gift.taste ? LIKED_MULTIPLIER : 1);

/** 每月结算：成年家人的喜好有小概率改变为另一种 */
export const driftGiftTastes = (
  tastes: GiftTastes,
  adults: TasteSubject[],
  rng: () => number = Math.random,
): { tastes: GiftTastes; changed: Array<{ id: string; from: GiftTaste; to: GiftTaste }> } => {
  let next = tastes;
  const changed: Array<{ id: string; from: GiftTaste; to: GiftTaste }> = [];
  for (const m of adults) {
    if (m.isPlayer || m.age < CHILD_AGE || rng() >= TASTE_CHANGE_CHANCE) continue;
    const from = tastes[m.id] ?? birthTaste(m.id);
    const others = TASTES.filter((t) => t !== from);
    const to = others[Math.floor(rng() * others.length)] ?? others[0];
    if (next === tastes) next = { ...tastes };
    next[m.id] = to;
    changed.push({ id: m.id, from, to });
  }
  return { tastes: next, changed };
};

// ---------- 背包 ----------

export const GIFT_INVENTORY_KEY = 'amigo_gift_inventory';
/** 礼物 id → 数量 */
export type GiftInventory = Record<string, number>;

export const addGifts = (inv: GiftInventory, ids: string[]): GiftInventory => {
  const next = { ...inv };
  for (const id of ids) next[id] = (next[id] ?? 0) + 1;
  return next;
};

/** 用掉一件礼物；没有这件礼物时返回 null */
export const removeGift = (inv: GiftInventory, id: string): GiftInventory | null => {
  const n = inv[id] ?? 0;
  if (n <= 0) return null;
  const next = { ...inv };
  if (n === 1) delete next[id];
  else next[id] = n - 1;
  return next;
};

export const giftCount = (inv: GiftInventory) => Object.values(inv).reduce((s, n) => s + n, 0);
