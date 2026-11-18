import { beforeEach, describe, expect, it } from 'vitest';
import { CLOTHING_COUPON_KEY, couponPrice, loadCouponLeft, saveCouponLeft } from './clothingCoupon';

describe('服饰 7 折券（Aminoac2026）', () => {
  beforeEach(() => localStorage.clear());

  it('还有次数时按 7 折四舍五入计价，用完后恢复原价', () => {
    expect(couponPrice(1000, 3)).toBe(700);
    expect(couponPrice(1555, 1)).toBe(1089);
    expect(couponPrice(1000, 0)).toBe(1000);
  });

  it('剩余次数读写存档，缺失或损坏时为 0，不会存成负数', () => {
    expect(loadCouponLeft()).toBe(0);
    saveCouponLeft(2);
    expect(loadCouponLeft()).toBe(2);
    saveCouponLeft(-1);
    expect(loadCouponLeft()).toBe(0);
    localStorage.setItem(CLOTHING_COUPON_KEY, '"abc"');
    expect(loadCouponLeft()).toBe(0);
  });
});
