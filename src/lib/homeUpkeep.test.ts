import { describe, expect, it } from 'vitest';
import { EVENT_UPKEEP_MULTIPLIER, HOME_UPKEEP_RATE, REPAIR_RATE, propertyUpkeep } from './homeUpkeep';

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
