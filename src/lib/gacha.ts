// 限定宝箱抽卡逻辑（纯函数，便于测试）
//
import { rollGift, type GiftQuality } from './gifts';

// 规则：
// - 每抽按概率出一个品质：限定 1%、稀有 6%、高级 13%（总出服饰概率 20%，与旧版一致）；
//   其余 30% 为家族礼物（见 gifts.ts，undefined.md 第 35 题）、50% 为金币
// - 稀有保底：连续 9 抽未出「稀有或更高」时，第 9 抽必出稀有（宝箱文案「9 次内必得稀有服饰」）
// - 限定保底：连续 99 抽未出「限定」时，第 99 抽必出限定（宝箱文案「99 次内必得限定皮肤」）
// - 出到限定会同时重置稀有保底计数
// - 抽到已拥有的服饰（或该品质已全部拥有）时，按该服饰售价的 50% 返还金币，保底计数照常重置

export type Rarity = 'advanced' | 'rare' | 'limited';

export const RARITY_LABEL: Record<Rarity, string> = {
  advanced: '高级',
  rare: '稀有',
  limited: '限定',
};

export const GACHA_RATES: Record<Rarity, number> = {
  limited: 0.01,
  rare: 0.06,
  advanced: 0.13,
};

/** 未出服饰时得到家族礼物的概率（占总抽数） */
export const GIFT_RATE = 0.3;

export const PITY_RARE = 9;
export const PITY_LIMITED = 99;
export const COIN_REWARD = 1000;
export const DUPLICATE_REFUND_RATIO = 0.5;

export interface PityState {
  /** 距上次出「稀有或更高」已抽次数 */
  sinceRare: number;
  /** 距上次出「限定」已抽次数 */
  sinceLimited: number;
}

export const INITIAL_PITY: PityState = { sinceRare: 0, sinceLimited: 0 };
/** 保底计数的存档键 */
export const GACHA_PITY_KEY = 'amigo_gacha_pity';

export interface GachaPoolItem {
  id: string;
  name: string;
  price: number;
  rarity: Rarity;
}

export type DrawReward =
  | { type: 'clothing'; id: string; name: string; rarity: Rarity; isPity: boolean }
  | { type: 'coin'; amount: number; name: string; rarity?: Rarity; isPity: boolean }
  | { type: 'gift'; id: string; name: string; quality: GiftQuality; isPity: false };

/** 本次抽卡是否靠限定保底出了限定（已全部拥有、按售价返还金币的也算），用于成就「大非酋」 */
export const hitLimitedPity = (rewards: DrawReward[]): boolean =>
  rewards.some((r) => r.isPity && r.rarity === 'limited');

export const drawGacha = (
  times: number,
  pool: GachaPoolItem[],
  owned: string[],
  pity: PityState,
  rng: () => number = Math.random,
): { rewards: DrawReward[]; pity: PityState } => {
  let { sinceRare, sinceLimited } = pity;
  const obtained = new Set(owned);
  const rewards: DrawReward[] = [];

  for (let i = 0; i < times; i++) {
    sinceRare++;
    sinceLimited++;

    const r = rng();
    let tier: Rarity | null = null;
    let isPity = false;

    if (sinceLimited >= PITY_LIMITED) {
      tier = 'limited';
      isPity = true;
    } else if (r < GACHA_RATES.limited) {
      tier = 'limited';
    } else if (sinceRare >= PITY_RARE) {
      tier = 'rare';
      isPity = true;
    } else if (r < GACHA_RATES.limited + GACHA_RATES.rare) {
      tier = 'rare';
    } else if (r < GACHA_RATES.limited + GACHA_RATES.rare + GACHA_RATES.advanced) {
      tier = 'advanced';
    }

    if (tier === 'limited') {
      sinceLimited = 0;
      sinceRare = 0;
    } else if (tier === 'rare') {
      sinceRare = 0;
    }

    if (!tier && r < GACHA_RATES.limited + GACHA_RATES.rare + GACHA_RATES.advanced + GIFT_RATE) {
      const gift = rollGift(rng);
      rewards.push({ type: 'gift', id: gift.id, name: gift.name, quality: gift.quality, isPity: false });
      continue;
    }

    if (!tier) {
      rewards.push({ type: 'coin', amount: COIN_REWARD, name: `${COIN_REWARD} 金币`, isPity: false });
      continue;
    }

    const tierItems = pool.filter((item) => item.rarity === tier);
    const unowned = tierItems.filter((item) => !obtained.has(item.id));

    if (unowned.length > 0) {
      const item = unowned[Math.floor(rng() * unowned.length)];
      obtained.add(item.id);
      rewards.push({ type: 'clothing', id: item.id, name: item.name, rarity: tier, isPity });
    } else if (tierItems.length > 0) {
      const dup = tierItems[Math.floor(rng() * tierItems.length)];
      const refund = Math.round(dup.price * DUPLICATE_REFUND_RATIO);
      rewards.push({ type: 'coin', amount: refund, name: `重复「${dup.name}」返还 ${refund.toLocaleString()} 金币`, rarity: tier, isPity });
    } else {
      rewards.push({ type: 'coin', amount: COIN_REWARD, name: `${COIN_REWARD} 金币`, isPity: false });
    }
  }

  return { rewards, pity: { sinceRare, sinceLimited } };
};
