// 服饰折扣券（用户 2026-11-18）：兑换码 Aminoac2026 每个账号可兑换一次，之后前 3 次在服饰商城购买服饰享 7 折。
// 剩余次数与服饰一样属于账号级数据：重置人生时保留，随云存档同步。

import { loadStored, saveStored } from './storage';

/** 兑换码（输入时不区分大小写，统一按大写比较） */
export const CLOTHING_COUPON_CODE = 'AMINOAC2026';
export const CLOTHING_COUPON_USES = 3;
export const CLOTHING_COUPON_RATE = 0.7;
/** 剩余可用次数 */
export const CLOTHING_COUPON_KEY = 'amigo_clothing_coupon';

export const loadCouponLeft = (): number => {
  const n = loadStored<unknown>(CLOTHING_COUPON_KEY, 0);
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
};

export const saveCouponLeft = (n: number) => saveStored(CLOTHING_COUPON_KEY, Math.max(0, n));

/** 还有折扣次数时按 7 折（四舍五入）计价 */
export const couponPrice = (price: number, left: number): number => (left > 0 ? Math.round(price * CLOTHING_COUPON_RATE) : price);
