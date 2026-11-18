// 居家开销（第 76 题，用户 2026-11-18 确认）：名下房产每月的燃料、照明、用水与修缮费用。
// 1870 年代城市照明靠灯油、煤气，取暖做饭靠煤，因此不叫「水电费」。
// - 自住的房子：房产价值 × HOME_UPKEEP_RATE（燃料、照明、用水、修缮）
// - 出租中或空置的房子：只付修缮，房产价值 × REPAIR_RATE（燃料、照明、用水由租客负担）
// - 租住别人的房子：已含在房租里，不另收
// - 历史大事件期间物价上涨，开销 × EVENT_UPKEEP_MULTIPLIER
// 付不起时不扣钱，但当月自住房的舒适度加成作废（没有取暖照明），见 monthTick.ts。

import { currentRateEvent } from './bank';

export const HOME_UPKEEP_RATE = 0.002;
export const REPAIR_RATE = 0.0005;
export const EVENT_UPKEEP_MULTIPLIER = 1.5;

export interface UpkeepProperty {
  currentValue?: number;
  purchasePrice?: number;
  isPrimaryResidence?: boolean;
  isRentedOut?: boolean;
}

/** 是否为自己住着的房子（与舒适度加成的判定一致） */
export const livesIn = (p: UpkeepProperty) => !!p.isPrimaryResidence && !p.isRentedOut;

/** 一套房产本月的居家开销（₽，四舍五入）：按当前估值计算，没有估值时按买入价 */
export const propertyUpkeep = (p: UpkeepProperty, year: number): number => {
  const value = p.currentValue || p.purchasePrice || 0;
  const rate = livesIn(p) ? HOME_UPKEEP_RATE : REPAIR_RATE;
  return Math.round(value * rate * (currentRateEvent(year) ? EVENT_UPKEEP_MULTIPLIER : 1));
};
