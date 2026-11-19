// 居家开销（第 76 题，用户 2026-11-18 确认）：名下房产每月的燃料、照明、用水与修缮费用。
// 1870 年代城市照明靠灯油、煤气，取暖做饭靠煤，因此不叫「水电费」。
// - 自住的房子：房产价值 × HOME_UPKEEP_RATE（燃料、照明、用水、修缮）
// - 出租中或空置的房子：只付修缮，房产价值 × REPAIR_RATE（燃料、照明、用水由租客负担）
// - 租住别人的房子：已含在房租里，不另收
// - 历史大事件期间物价上涨，开销 × EVENT_UPKEEP_MULTIPLIER
// 付不起的部分记为欠费（每套房产分别记账）；欠费拖欠超过 REPOSSESS_AFTER_MONTHS 个月，房产被收回。
// 当月自住房的开销没付上时，没有取暖照明，舒适度加成作废。

import { currentRateEvent } from './bank';

export const HOME_UPKEEP_RATE = 0.002;
export const REPAIR_RATE = 0.0005;
export const EVENT_UPKEEP_MULTIPLIER = 1.5;
/** 欠费连续拖欠超过这么多个月就收回房产（用户 2026-11-18：超过半年） */
export const REPOSSESS_AFTER_MONTHS = 6;

export interface UpkeepProperty {
  currentValue?: number;
  purchasePrice?: number;
  isPrimaryResidence?: boolean;
  isRentedOut?: boolean;
  /** 累计欠下的居家开销 */
  upkeepArrears?: number;
  /** 欠费已经拖欠的月数（结清后归零） */
  upkeepArrearsMonths?: number;
}

/** 是否为自己住着的房子（与舒适度加成的判定一致） */
export const livesIn = (p: UpkeepProperty) => !!p.isPrimaryResidence && !p.isRentedOut;

/** 一套房产本月的居家开销（₽，四舍五入）：按当前估值计算，没有估值时按买入价 */
export const propertyUpkeep = (p: UpkeepProperty, year: number): number => {
  const value = p.currentValue || p.purchasePrice || 0;
  const rate = livesIn(p) ? HOME_UPKEEP_RATE : REPAIR_RATE;
  return Math.round(value * rate * (currentRateEvent(year) ? EVENT_UPKEEP_MULTIPLIER : 1));
};

export interface UpkeepSettlement<T> {
  /** 结算后仍在名下的房产（新对象，不修改输入） */
  properties: T[];
  /** 本月实际付出的开销（含补交的欠费） */
  paid: number;
  /** 本月新增的欠费 */
  newArrears: number;
  /** 结算后全部欠费 */
  totalArrears: number;
  /** 本月被收回的房产 */
  repossessed: T[];
  /** 自住房本月的开销没付上（舒适度加成作废） */
  homeUnpaid: boolean;
  /** 房产列表是否有变化（需要写回存档） */
  changed: boolean;
}

/**
 * 按月结算全部房产的居家开销：先付自住房，再付其他房产；每套先付本月开销，再补交旧欠费。
 * 现金不够的部分记为该房产的欠费，拖欠超过 REPOSSESS_AFTER_MONTHS 个月则收回；
 * 收回的是主居所时，与出售一样迁入剩余房产中第一套未出租的住宅。
 */
export const settleUpkeep = <T extends UpkeepProperty>(input: T[], cash: number, year: number): UpkeepSettlement<T> => {
  let available = Math.max(0, cash);
  let paid = 0;
  let newArrears = 0;
  let homeUnpaid = false;
  let changed = false;
  const repossessed: T[] = [];
  const kept: T[] = [];
  const order = input.map((p, i) => i).sort((a, b) => Number(livesIn(input[b])) - Number(livesIn(input[a])));
  const settled: (T | null)[] = input.map(() => null);

  for (const i of order) {
    const p = input[i];
    const upkeep = propertyUpkeep(p, year);
    const arrears = p.upkeepArrears || 0;
    const due = upkeep + arrears;
    if (due <= 0) {
      settled[i] = p;
      continue;
    }
    const pay = Math.min(available, due);
    available -= pay;
    paid += pay;
    if (pay < upkeep) {
      newArrears += upkeep - pay;
      if (livesIn(p)) homeUnpaid = true;
    }
    const left = due - pay;
    const months = left > 0 ? (p.upkeepArrearsMonths || 0) + 1 : 0;
    if (left !== arrears || months !== (p.upkeepArrearsMonths || 0)) changed = true;
    const next = { ...p, upkeepArrears: left, upkeepArrearsMonths: months };
    if (months > REPOSSESS_AFTER_MONTHS) {
      repossessed.push(next);
      changed = true;
    } else {
      settled[i] = next;
    }
  }

  settled.forEach((p) => p && kept.push(p));
  if (repossessed.some((p) => p.isPrimaryResidence)) {
    const nextPrimary = kept.find((p) => !p.isRentedOut);
    if (nextPrimary) kept[kept.indexOf(nextPrimary)] = { ...nextPrimary, isPrimaryResidence: true };
  }
  const totalArrears = kept.reduce((sum, p) => sum + (p.upkeepArrears || 0), 0);
  return { properties: kept, paid, newArrears, totalArrears, repossessed, homeUnpaid, changed };
};
