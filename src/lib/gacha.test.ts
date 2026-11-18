import { describe, expect, it } from 'vitest';
import { drawGacha, hitLimitedPity, GachaPoolItem, INITIAL_PITY, PITY_LIMITED, PITY_RARE, DUPLICATE_REFUND_RATIO } from './gacha';

const POOL: GachaPoolItem[] = [
  { id: 'adv1', name: '高级一', price: 1000, rarity: 'advanced' },
  { id: 'rare1', name: '稀有一', price: 8000, rarity: 'rare' },
  { id: 'lim1', name: '限定一', price: 50000, rarity: 'limited' },
];

// 0.99 永远落在「金币」档，用来模拟连续不出货；0 落在最高档
const NOTHING = () => 0.99;

describe('抽卡保底', () => {
  it('连续不出稀有时，第 PITY_RARE 抽必出稀有并重置稀有计数', () => {
    const { rewards, pity } = drawGacha(PITY_RARE, POOL, [], INITIAL_PITY, NOTHING);
    const last = rewards[rewards.length - 1];

    expect(rewards.slice(0, -1).every((r) => r.type === 'coin')).toBe(true);
    expect(last).toMatchObject({ type: 'clothing', rarity: 'rare', isPity: true });
    expect(pity.sinceRare).toBe(0);
    expect(pity.sinceLimited).toBe(PITY_RARE);
  });

  it('保底计数跨多次抽卡累计', () => {
    const half = drawGacha(PITY_RARE - 1, POOL, [], INITIAL_PITY, NOTHING);
    const next = drawGacha(1, POOL, [], half.pity, NOTHING);
    expect(next.rewards[0]).toMatchObject({ rarity: 'rare', isPity: true });
  });

  it('限定保底优先于稀有保底，出限定时两个计数都重置', () => {
    const { rewards, pity } = drawGacha(1, POOL, [], { sinceRare: PITY_RARE - 1, sinceLimited: PITY_LIMITED - 1 }, NOTHING);
    expect(rewards[0]).toMatchObject({ type: 'clothing', rarity: 'limited', isPity: true });
    expect(pity).toEqual({ sinceRare: 0, sinceLimited: 0 });
  });

  it('自然抽到稀有也会重置稀有计数，不必等到保底', () => {
    const { pity } = drawGacha(1, POOL, [], { sinceRare: 5, sinceLimited: 5 }, () => 0.02);
    expect(pity.sinceRare).toBe(0);
  });
});

describe('重复服饰', () => {
  it('该品质全部已拥有时按售价比例返还金币，保底照常重置', () => {
    const { rewards, pity } = drawGacha(1, POOL, ['rare1'], { sinceRare: PITY_RARE - 1, sinceLimited: 0 }, NOTHING);
    expect(rewards[0]).toMatchObject({ type: 'coin', amount: Math.round(8000 * DUPLICATE_REFUND_RATIO), rarity: 'rare' });
    expect(pity.sinceRare).toBe(0);
  });

  it('同一次十连内不会重复抽到同一件未拥有的服饰', () => {
    const twoRare: GachaPoolItem[] = [...POOL, { id: 'rare2', name: '稀有二', price: 8000, rarity: 'rare' }];
    const { rewards } = drawGacha(2, twoRare, [], INITIAL_PITY, () => 0.02);
    const ids = rewards.filter((r) => r.type === 'clothing').map((r) => (r as { id: string }).id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(2);
  });
});

describe('成就「大非酋」判定', () => {
  it('靠限定保底抽到限定才算，自然抽到的限定与稀有保底都不算', () => {
    const pityLimited = drawGacha(1, POOL, [], { sinceRare: 0, sinceLimited: PITY_LIMITED - 1 }, NOTHING).rewards;
    const luckyLimited = drawGacha(1, POOL, [], INITIAL_PITY, () => 0).rewards;
    const pityRare = drawGacha(1, POOL, [], { sinceRare: PITY_RARE - 1, sinceLimited: 0 }, NOTHING).rewards;
    expect(hitLimitedPity(pityLimited)).toBe(true);
    expect(hitLimitedPity(luckyLimited)).toBe(false);
    expect(hitLimitedPity(pityRare)).toBe(false);
  });

  it('限定服饰已全部拥有、保底改为返还金币时也算', () => {
    const refund = drawGacha(1, POOL, ['lim1'], { sinceRare: 0, sinceLimited: PITY_LIMITED - 1 }, NOTHING).rewards;
    expect(refund[0].type).toBe('coin');
    expect(hitLimitedPity(refund)).toBe(true);
  });
});
