import { beforeEach, describe, expect, it } from 'vitest';
import {
  GarageContext,
  HIRED_COACHMAN_WAGE,
  LICENSE_MIN_AGE,
  RANCH_RETURN_MAX,
  RANCH_RETURN_MIN,
  RANCH_VET_FEE,
  SLAVE_FOOD,
  SLAVE_TRADE_ENDS,
  VEHICLES_KEY,
  canTravel,
  licenseBlocked,
  licenseById,
  loadVehicles,
  meetsLicense,
  parseCoachman,
  purchaseBlocked,
  saveVehicles,
  settleGarage,
  slaveBlocked,
  vehicleById,
  vehicleResale,
  vehicleUpkeep,
  vehiclesValue,
} from './vehicles';

const carriageLicense = licenseById('carriage')!;
const carLicense = licenseById('car')!;
const ctx = (over: Partial<GarageContext> = {}): GarageContext => ({
  isRegistered: true,
  age: 30,
  year: 1875,
  coins: 10_000_000,
  licenses: [],
  vehicles: [],
  ...over,
});
/** 1875 年没有历史大事件，1880 年处于神鹰军大起义 */
const CALM = 1875;
const TURMOIL = 1880;
const always = (v: number) => () => v;

describe('执照（第 67.4 题）', () => {
  it(`年满 ${LICENSE_MIN_AGE} 岁、交得起考试费就能考马车执照`, () => {
    expect(licenseBlocked(carriageLicense, ctx())).toBeNull();
    expect(licenseBlocked(carriageLicense, ctx({ age: LICENSE_MIN_AGE - 1 }))).not.toBeNull();
    expect(licenseBlocked(carriageLicense, ctx({ coins: carriageLicense.fee - 1 }))).not.toBeNull();
    expect(licenseBlocked(carriageLicense, ctx({ licenses: ['carriage'] }))).not.toBeNull();
  });

  it('汽车执照 1900 年后才开考', () => {
    expect(licenseBlocked(carLicense, ctx({ year: 1899 }))).not.toBeNull();
    expect(licenseBlocked(carLicense, ctx({ year: 1900 }))).toBeNull();
  });

  it('车夫需要马车执照', () => {
    expect(meetsLicense({ requiresLicense: 'carriage' }, [])).toBe(false);
    expect(meetsLicense({ requiresLicense: 'carriage' }, ['carriage'])).toBe(true);
    expect(meetsLicense({}, [])).toBe(true);
  });
});

describe('车马市场', () => {
  beforeEach(() => localStorage.clear());

  it('按年代解锁：汽车 1900、坦克 1916、直升飞机 1939；同一样只能有一件', () => {
    expect(purchaseBlocked(vehicleById('car')!, ctx({ year: 1899 }))).not.toBeNull();
    expect(purchaseBlocked(vehicleById('car')!, ctx({ year: 1900 }))).toBeNull();
    expect(purchaseBlocked(vehicleById('tank')!, ctx({ year: 1915 }))).not.toBeNull();
    expect(purchaseBlocked(vehicleById('helicopter')!, ctx({ year: 1920 }))).not.toBeNull();
    expect(purchaseBlocked(vehicleById('yacht')!, ctx())).toBeNull();
    expect(purchaseBlocked(vehicleById('carriage')!, ctx({ vehicles: ['carriage'] }))).not.toBeNull();
  });

  it('保养费按价格 1%（马场不收），资产按转卖价计', () => {
    expect(vehicleUpkeep(vehicleById('carriage')!)).toBe(140);
    expect(vehicleUpkeep(vehicleById('ranch')!)).toBe(0);
    expect(vehiclesValue(['carriage', 'ranch'])).toBe(vehicleResale(vehicleById('carriage')!) + vehicleResale(vehicleById('ranch')!));
  });

  it('马车要配挽马并由持照本人或车夫驾驶；骑乘马可直接骑；汽车要本人持照', () => {
    expect(canTravel(['carriage'], ['carriage'], null)).toBe(false);
    expect(canTravel(['carriage', 'draft_horses'], ['carriage'], null)).toBe(true);
    expect(canTravel(['carriage', 'draft_horses'], [], null)).toBe(false);
    expect(canTravel(['carriage', 'draft_horses'], [], { kind: 'hired', name: '伊万' })).toBe(true);
    expect(canTravel(['riding_horse'], [], null)).toBe(true);
    expect(canTravel(['car'], [], { kind: 'hired', name: '伊万' })).toBe(false);
  });

  it('存档读取时丢弃无效编号，车夫数据不完整时视为没有', () => {
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(['carriage', 'rocket']));
    expect(loadVehicles()).toEqual(['carriage']);
    saveVehicles(['car', 'carriage']);
    expect(loadVehicles()).toEqual(['carriage', 'car']);
    expect(parseCoachman({ kind: 'slave', name: '伊万' })).toEqual({ kind: 'slave', name: '伊万' });
    expect(parseCoachman({ kind: 'serf', name: '伊万' })).toBeNull();
  });
});

describe('车夫', () => {
  it(`${SLAVE_TRADE_ENDS} 年帝国灭亡后不能再买奴隶；已有车夫时不能再买`, () => {
    const base = { isRegistered: true, year: CALM, coins: 1_000_000, coachman: null };
    expect(slaveBlocked(base)).toBeNull();
    expect(slaveBlocked({ ...base, year: SLAVE_TRADE_ENDS })).not.toBeNull();
    expect(slaveBlocked({ ...base, coachman: { kind: 'hired', name: '伊万' } })).not.toBeNull();
  });

  it('雇来的车夫欠薪就辞工', () => {
    const hired = { kind: 'hired' as const, name: '伊万' };
    const r = settleGarage({ vehicles: [], licenses: [], coachman: hired, cash: HIRED_COACHMAN_WAGE - 1, year: CALM }, always(0.99));
    expect(r.unpaid).toBe(true);
    expect(r.coachman).toBeNull();
    const ok = settleGarage({ vehicles: [], licenses: [], coachman: hired, cash: HIRED_COACHMAN_WAGE, year: CALM }, always(0.99));
    expect(ok.coachman).toBe(hired);
    expect(ok.paid).toBe(HIRED_COACHMAN_WAGE);
  });

  it('买来的车夫平时少逃跑，动乱年份与断粮时更容易逃', () => {
    const slave = { kind: 'slave' as const, name: '伊万' };
    const fed = SLAVE_FOOD;
    expect(settleGarage({ vehicles: [], licenses: [], coachman: slave, cash: fed, year: CALM }, always(0.05)).coachman).toBe(slave);
    expect(settleGarage({ vehicles: [], licenses: [], coachman: slave, cash: fed, year: TURMOIL }, always(0.05)).coachman).toBeNull();
    expect(settleGarage({ vehicles: [], licenses: [], coachman: slave, cash: 0, year: CALM }, always(0.2)).coachman).toBeNull();
  });
});

describe('每月结算', () => {
  it('付得起且能出行时健康 +1；付不起不扣钱、本月步行', () => {
    const v = ['carriage', 'draft_horses'] as const;
    const cost = vehicleUpkeep(vehicleById('carriage')!) + vehicleUpkeep(vehicleById('draft_horses')!);
    const ok = settleGarage({ vehicles: [...v], licenses: ['carriage'], coachman: null, cash: cost, year: CALM });
    expect(ok).toMatchObject({ paid: cost, unpaid: false, healthBonus: 1 });
    const broke = settleGarage({ vehicles: [...v], licenses: ['carriage'], coachman: null, cash: cost - 1, year: CALM });
    expect(broke).toMatchObject({ paid: 0, unpaid: true, healthBonus: 0 });
  });

  it('马场分红在区间内，大事件期间 ×1.5；闹马瘟时没有收成还要付兽医费', () => {
    const price = vehicleById('ranch')!.price;
    // 第一次随机决定是否马瘟，第二次决定分红比例
    const seq = (...vals: number[]) => () => vals.shift() ?? 0.5;
    const calm = settleGarage({ vehicles: ['ranch'], licenses: [], coachman: null, cash: 0, year: CALM }, seq(0.5, 1));
    expect(calm.ranchIncome).toBe(Math.round(price * RANCH_RETURN_MAX));
    const low = settleGarage({ vehicles: ['ranch'], licenses: [], coachman: null, cash: 0, year: TURMOIL }, seq(0.5, 0));
    expect(low.ranchIncome).toBe(Math.round(price * RANCH_RETURN_MIN * 1.5));
    const plague = settleGarage({ vehicles: ['ranch'], licenses: [], coachman: null, cash: RANCH_VET_FEE, year: CALM }, seq(0));
    expect(plague).toMatchObject({ ranchIncome: 0, paid: RANCH_VET_FEE });
  });
});
