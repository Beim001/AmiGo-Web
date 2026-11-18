import { beforeEach, describe, expect, it } from 'vitest';
import {
  LICENSE_MIN_AGE,
  LicenseContext,
  VEHICLES_KEY,
  licenseBlocked,
  loadVehicles,
  meetsLicense,
  purchaseBlocked,
  saveVehicles,
  settleVehicles,
  vehicleById,
  vehiclesValue,
  vehicleResale,
  vehicleUpkeep,
} from './vehicles';

const carriage = vehicleById('carriage')!;
const car = vehicleById('car')!;
const ctx = (over: Partial<LicenseContext> = {}): LicenseContext => ({
  isRegistered: true,
  age: 30,
  year: 1880,
  coins: 1_000_000,
  licenses: [],
  vehicles: [],
  ...over,
});

describe('执照（第 67.4 题）', () => {
  it(`年满 ${LICENSE_MIN_AGE} 岁、交得起考试费就能考马车执照`, () => {
    expect(licenseBlocked(carriage, ctx())).toBeNull();
    expect(licenseBlocked(carriage, ctx({ age: LICENSE_MIN_AGE - 1 }))).not.toBeNull();
    expect(licenseBlocked(carriage, ctx({ coins: carriage.licenseFee - 1 }))).not.toBeNull();
    expect(licenseBlocked(carriage, ctx({ licenses: ['carriage'] }))).not.toBeNull();
  });

  it('汽车执照 1900 年后才开考', () => {
    expect(licenseBlocked(car, ctx({ year: 1899 }))).not.toBeNull();
    expect(licenseBlocked(car, ctx({ year: 1900 }))).toBeNull();
  });

  it('车夫需要马车执照', () => {
    expect(meetsLicense({ requiresLicense: 'carriage' }, [])).toBe(false);
    expect(meetsLicense({ requiresLicense: 'carriage' }, ['carriage'])).toBe(true);
    expect(meetsLicense({}, [])).toBe(true);
  });
});

describe('车辆', () => {
  beforeEach(() => localStorage.clear());

  it('持照才能买车，同一种车只能有一辆', () => {
    expect(purchaseBlocked(carriage, ctx())).not.toBeNull();
    expect(purchaseBlocked(carriage, ctx({ licenses: ['carriage'] }))).toBeNull();
    expect(purchaseBlocked(carriage, ctx({ licenses: ['carriage'], vehicles: ['carriage'] }))).not.toBeNull();
    expect(purchaseBlocked(car, ctx({ year: 1899, licenses: ['car'] }))).not.toBeNull();
  });

  it('保养费按车价 1%，资产按转卖价计', () => {
    expect(vehicleUpkeep(carriage)).toBe(200);
    expect(vehiclesValue(['carriage', 'car'])).toBe(vehicleResale(carriage) + vehicleResale(car));
  });

  it('月结：付得起且持照才有健康加成；付不起不扣钱', () => {
    expect(settleVehicles([], [], 0)).toEqual({ paid: 0, unpaid: false, healthBonus: 0 });
    expect(settleVehicles(['carriage'], ['carriage'], 1000).healthBonus).toBe(1);
    expect(settleVehicles(['carriage'], [], 1000)).toEqual({ paid: 200, unpaid: false, healthBonus: 0 });
    expect(settleVehicles(['carriage'], ['carriage'], 199)).toEqual({ paid: 0, unpaid: true, healthBonus: 0 });
  });

  it('存档读取时丢弃无效的车辆编号', () => {
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(['carriage', 'rocket']));
    expect(loadVehicles()).toEqual(['carriage']);
    saveVehicles(['car', 'carriage']);
    expect(loadVehicles()).toEqual(['carriage', 'car']);
  });
});
