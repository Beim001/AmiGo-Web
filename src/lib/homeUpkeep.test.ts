import { describe, expect, it } from 'vitest';
import { EVENT_UPKEEP_MULTIPLIER, HOME_UPKEEP_RATE, REPAIR_RATE, REPOSSESS_AFTER_MONTHS, propertyUpkeep, settleUpkeep, UpkeepProperty } from './homeUpkeep';

/** 1875 年没有历史大事件；1880 年处于神鹰军大起义 */
const CALM = 1875;
const TURMOIL = 1880;

describe('居家开销', () => {
  it('自住按估值收全额开销，出租或空置只收修缮费', () => {
    expect(propertyUpkeep({ currentValue: 100_000, isPrimaryResidence: true }, CALM)).toBe(100_000 * HOME_UPKEEP_RATE);
    expect(propertyUpkeep({ currentValue: 100_000, isPrimaryResidence: true, isRentedOut: true }, CALM)).toBe(100_000 * REPAIR_RATE);
    expect(propertyUpkeep({ currentValue: 100_000 }, CALM)).toBe(100_000 * REPAIR_RATE);
  });

  it('没有估值时按买入价计算，两者都没有时为 0', () => {
    expect(propertyUpkeep({ purchasePrice: 50_000, isPrimaryResidence: true }, CALM)).toBe(50_000 * HOME_UPKEEP_RATE);
    expect(propertyUpkeep({ isPrimaryResidence: true }, CALM)).toBe(0);
  });

  it('历史大事件期间开销上涨', () => {
    expect(propertyUpkeep({ currentValue: 100_000, isPrimaryResidence: true }, TURMOIL)).toBe(100_000 * HOME_UPKEEP_RATE * EVENT_UPKEEP_MULTIPLIER);
  });
});

describe('欠费与收回房产', () => {
  type Prop = UpkeepProperty & { id: string };
  const home: Prop = { id: 'home', isPrimaryResidence: true, currentValue: 100_000 };
  const spare: Prop = { id: 'spare', currentValue: 100_000 };
  const homeCost = propertyUpkeep(home, CALM);
  const spareCost = propertyUpkeep(spare, CALM);

  it('现金够时全部付清，不产生欠费，也不修改输入', () => {
    const input = [home, spare];
    const r = settleUpkeep(input, 1_000_000, CALM);
    expect(r.paid).toBe(homeCost + spareCost);
    expect(r.totalArrears).toBe(0);
    expect(r.homeUnpaid).toBe(false);
    expect(r.changed).toBe(false);
    expect(input[0]).toBe(home);
  });

  it('先付自住房；付不起的部分记为该房产的欠费', () => {
    const r = settleUpkeep([spare, home], homeCost, CALM);
    expect(r.homeUnpaid).toBe(false);
    const s = r.properties.find((p) => p.id === 'spare')!;
    expect(s.upkeepArrears).toBe(spareCost);
    expect(s.upkeepArrearsMonths).toBe(1);
    expect(r.newArrears).toBe(spareCost);
  });

  it('自住房本月开销没付上时标记为没有取暖照明', () => {
    const r = settleUpkeep([home], homeCost - 1, CALM);
    expect(r.homeUnpaid).toBe(true);
    expect(r.properties[0].upkeepArrears).toBe(1);
  });

  it('先付本月开销再补交旧欠费，结清后拖欠月数归零', () => {
    const owing = { ...home, upkeepArrears: 500, upkeepArrearsMonths: 3 };
    const part = settleUpkeep([owing], homeCost + 200, CALM);
    expect(part.homeUnpaid).toBe(false);
    expect(part.properties[0]).toMatchObject({ upkeepArrears: 300, upkeepArrearsMonths: 4 });
    const full = settleUpkeep([owing], homeCost + 500, CALM);
    expect(full.properties[0]).toMatchObject({ upkeepArrears: 0, upkeepArrearsMonths: 0 });
    expect(full.changed).toBe(true);
  });

  it(`拖欠超过 ${REPOSSESS_AFTER_MONTHS} 个月收回房产，主居所迁到剩余未出租的住宅`, () => {
    const owing = { ...home, upkeepArrears: 500, upkeepArrearsMonths: REPOSSESS_AFTER_MONTHS };
    const rented: Prop = { id: 'rented', currentValue: 100_000, isRentedOut: true };
    const r = settleUpkeep([owing, rented, spare], 0, CALM);
    expect(r.repossessed.map((p) => p.id)).toEqual(['home']);
    expect(r.properties.map((p) => p.id)).toEqual(['rented', 'spare']);
    expect(r.properties.find((p) => p.id === 'spare')!.isPrimaryResidence).toBe(true);
    expect(r.properties.find((p) => p.id === 'rented')!.isPrimaryResidence).toBeFalsy();
  });

  it(`拖欠正好 ${REPOSSESS_AFTER_MONTHS} 个月时还不收回`, () => {
    const owing = { ...home, upkeepArrears: 500, upkeepArrearsMonths: REPOSSESS_AFTER_MONTHS - 1 };
    const r = settleUpkeep([owing], 0, CALM);
    expect(r.repossessed).toHaveLength(0);
    expect(r.properties[0].upkeepArrearsMonths).toBe(REPOSSESS_AFTER_MONTHS);
  });
});
