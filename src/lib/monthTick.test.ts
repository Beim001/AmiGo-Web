import { describe, expect, it } from 'vitest';
import { advanceMonth, MonthInput } from './monthTick';
import { INITIAL_FAMILY_STATE, LEGACY_ORIGIN } from './family';
import { buildDefaultAccounts } from './bank';
import { loadMarket } from './stockMarket';
import { BASE_STIPEND, monthlySalary } from './monthly';
import { CHILD_JOBS, CHILD_LABOR_MAX_AGE } from './lineage';
import { propertyUpkeep, REPOSSESS_AFTER_MONTHS } from './homeUpkeep';
import { VEHICLE_HEALTH_BONUS, VehicleId, vehicleById, vehicleUpkeep } from './vehicles';
import { PRISON_HEALTH_LOSS } from './prison';

/** 固定种子的伪随机数，保证每次运行结果相同 */
const seeded = (seed = 1) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
/** 永远返回接近 1 的值：不患病、不生育、不开拍卖会、不出推演事件 */
const QUIET = () => 0.999;

const YEAR = 1880;
/** 让推进后的年龄恰好为 age */
const bornFor = (age: number, nextYear = YEAR) => nextYear - (age - 8);

const commonerFamily = { ...INITIAL_FAMILY_STATE, origin: { ...LEGACY_ORIGIN, classId: 'commoner', classLabel: '平民', isValentine: false } };

const input = (over: Partial<MonthInput> = {}): MonthInput => ({
  year: YEAR,
  month: 5,
  nextYear: YEAR,
  nextMonth: 6,
  isRegistered: true,
  birthRegisteredYear: bornFor(30),
  currentAge: 30,
  playerName: '测试玩家',
  gender: '男',
  playerOccupation: '待业',
  playerTraits: [],
  appearance: null,
  godMode: false,
  playerLifespan: null,
  coins: 100_000,
  health: 80,
  reputation: 0,
  family: INITIAL_FAMILY_STATE,
  disease: null,
  antibodies: [],
  guardianship: null,
  hasAuction: false,
  pendingSimEventIds: [],
  simRecent: {},
  bankAccounts: buildDefaultAccounts(0, 0),
  market: loadMarket(),
  properties: null,
  rental: null,
  vehicles: [],
  licenses: [],
  coachman: null,
  prison: null,
  job: null,
  childJob: null,
  ...over,
});

describe('收入', () => {
  it('在职时发月薪与俸禄，并解锁「第一份工资」', () => {
    const r = advanceMonth(input({ job: { dailySalary: 100 } }), QUIET);
    expect(r.salary).toBe(monthlySalary(100, 30));
    expect(r.netChange).toBe(BASE_STIPEND + r.salary);
    expect(r.notes[0]).toContain('俸禄');
    expect(r.achievements).toContain('first_salary');
  });

  it('不在职时不发俸禄，改由父母给零花', () => {
    const r = advanceMonth(input(), QUIET);
    expect(r.salary).toBe(0);
    expect(r.notes[0]).toMatch(/零花/);
  });

  it('出租房产收租并累计到房产记录，不修改传入的对象', () => {
    const props = [{ id: 'h1', isRentedOut: true, rentPerMonth: 2000, totalRentCollected: 500 }];
    const r = advanceMonth(input({ properties: props }), QUIET);
    expect(r.properties?.[0].totalRentCollected).toBe(2500);
    expect(props[0].totalRentCollected).toBe(500);
    expect(r.notes).toContain('房租 +2,000');
  });

  it('没有出租房产时不需要写回房产', () => {
    const r = advanceMonth(input({ properties: [{ id: 'h1', isPrimaryResidence: true, comfortBonus: 8 }] }), QUIET);
    expect(r.properties).toBeNull();
  });
});

describe('居家开销', () => {
  const home = { id: 'h1', isPrimaryResidence: true, comfortBonus: 8, currentValue: 200_000 };
  const upkeep = propertyUpkeep(home, YEAR);

  it('自住房每月扣居家开销，计入净变化', () => {
    const r = advanceMonth(input({ properties: [home] }), QUIET);
    const none = advanceMonth(input(), QUIET);
    expect(upkeep).toBeGreaterThan(0);
    expect(r.netChange).toBe(none.netChange - upkeep);
    expect(r.notes).toContain(`居家开销 -${upkeep.toLocaleString()}`);
  });

  it('租房住的居家开销已含在房租里，不另收', () => {
    const r = advanceMonth(input({ rental: { monthlyRent: 1000, comfortBonus: 2 } }), QUIET);
    expect(r.notes.some((n) => n.includes('居家开销'))).toBe(false);
  });

  // 开销远高于当月零花，现金为 0 时付不起
  const mansion = { ...home, title: '庄园', currentValue: 50_000_000 };
  const cost = propertyUpkeep(mansion, YEAR);

  it('付不起的部分记为欠费，本月自住房的舒适度加成作废', () => {
    const broke = advanceMonth(input({ coins: 0, health: 50, properties: [mansion] }), QUIET);
    const paid = advanceMonth(input({ coins: cost, health: 50, properties: [mansion] }), QUIET);
    expect(broke.notes).toContain('⚠️ 交不起居家开销，住处没有取暖照明');
    expect(broke.properties?.[0].upkeepArrears).toBeGreaterThan(0);
    expect(broke.properties?.[0].upkeepArrearsMonths).toBe(1);
    expect(broke.health).toBeLessThan(paid.health);
  });

  it('拖欠超过半年收回房产并写入人生日志', () => {
    const owing = { ...mansion, upkeepArrears: cost * 6, upkeepArrearsMonths: REPOSSESS_AFTER_MONTHS };
    const r = advanceMonth(input({ coins: 0, properties: [owing] }), QUIET);
    expect(r.properties).toEqual([]);
    expect(r.logs.some(([, title]) => title === '房产「庄园」被收回')).toBe(true);
  });
});

describe('车马', () => {
  const coach = ['carriage', 'draft_horses'] as VehicleId[];
  const carriageCost = vehicleUpkeep(vehicleById('carriage')!) + vehicleUpkeep(vehicleById('draft_horses')!);

  it('有马车与挽马时每月扣保养费；持有执照时健康恢复 +1', () => {
    const none = advanceMonth(input({ health: 50 }), QUIET);
    const drive = advanceMonth(input({ health: 50, vehicles: coach, licenses: ['carriage'] }), QUIET);
    expect(drive.netChange).toBe(none.netChange - carriageCost);
    expect(drive.notes).toContain(`车马开销 -${carriageCost.toLocaleString()}`);
    expect(drive.health).toBe(none.health + VEHICLE_HEALTH_BONUS);
  });

  it('没有执照（例如刚继承）照付保养费，但没有健康加成；有车夫则照样出行', () => {
    const none = advanceMonth(input({ health: 50 }), QUIET);
    const r = advanceMonth(input({ health: 50, vehicles: coach }), QUIET);
    expect(r.netChange).toBe(none.netChange - carriageCost);
    expect(r.health).toBe(none.health);
    const hired = advanceMonth(input({ health: 50, vehicles: coach, coachman: { kind: 'hired', name: '伊万' } }), QUIET);
    expect(hired.health).toBe(none.health + VEHICLE_HEALTH_BONUS);
    expect(hired.coachman).toBeUndefined();
  });

  it('买来的车夫逃跑时写回存档并记入人生日志', () => {
    const r = advanceMonth(input({ coachman: { kind: 'slave', name: '伊万' } }), () => 0.001);
    expect(r.coachman).toBeNull();
    expect(r.logs.some(([, title]) => title === '车夫伊万逃跑')).toBe(true);
  });

  it('付不起保养费时不扣钱，本月只能步行', () => {
    // 先付的居家开销远高于当月零花，把现金全部用完
    const mansion = [{ id: 'm', isPrimaryResidence: true, currentValue: 50_000_000 }];
    const none = advanceMonth(input({ coins: 0, health: 50, properties: mansion }), QUIET);
    const r = advanceMonth(input({ coins: 0, health: 50, properties: mansion, vehicles: ['car'], licenses: ['car'] }), QUIET);
    expect(r.notes).toContain('⚠️ 养不起车马，本月只能步行');
    expect(r.netChange).toBe(none.netChange);
    expect(r.health).toBe(none.health);
  });
});

describe('监狱服刑（第 67.7 题）', () => {
  const jail = (monthsLeft: number) => ({ crime: '偷窃', sentence: 3, monthsLeft, year: YEAR, month: 5 });

  it('狱中没有月薪、俸禄与零花，每月健康 -5，不出推演事件', () => {
    const free = advanceMonth(input({ job: { dailySalary: 100 }, health: 50 }), seeded(5));
    const r = advanceMonth(input({ job: { dailySalary: 100 }, health: 50, prison: jail(2) }), seeded(5));
    expect(r.salary).toBe(0);
    expect(r.netChange).toBe(0);
    expect(r.health).toBe(free.health - PRISON_HEALTH_LOSS);
    expect(r.simEvent).toBeNull();
    expect(r.prison).toEqual(jail(1));
    expect(r.criminalRecord).toBeNull();
  });

  it('刑满出狱留下 10 年前科，写入人生日志', () => {
    const r = advanceMonth(input({ prison: jail(1) }), QUIET);
    expect(r.prison).toBeNull();
    expect(r.criminalRecord).toEqual({ crime: '偷窃', until: YEAR * 12 + 6 + 120 });
    expect(r.logs.some(([, title]) => title === '刑满出狱')).toBe(true);
  });

  it('不在狱中时服刑状态不变', () => {
    expect(advanceMonth(input(), QUIET).prison).toBeUndefined();
  });
});

describe('童工', () => {
  const kid = (age: number) =>
    input({ family: commonerFamily, birthRegisteredYear: bornFor(age), currentAge: age - 1, childJob: CHILD_JOBS[0] });

  it('平民家庭未满 16 岁可以做童工，计入收入', () => {
    const r = advanceMonth(kid(CHILD_LABOR_MAX_AGE), QUIET);
    expect(r.childJobEnded).toBe(false);
    expect(r.salary).toBe(CHILD_JOBS[0].salary);
  });

  it('年满 16 岁时童工结束并写入人生日志', () => {
    const r = advanceMonth(kid(CHILD_LABOR_MAX_AGE + 1), QUIET);
    expect(r.childJobEnded).toBe(true);
    expect(r.logs.some(([, title]) => title === '结束童工生涯')).toBe(true);
  });
});

describe('健康与寿命', () => {
  it('到达寿命即寿终正寝：健康归零、记入辞世，不再结算家族与推演', () => {
    const r = advanceMonth(input({ playerLifespan: 30 }), seeded());
    expect(r.health).toBe(0);
    expect(r.died).toBe(true);
    expect(r.logs.some(([, title]) => title === '辞世')).toBe(true);
    expect(r.simEvent).toBeNull();
    expect(r.simQuiet).toBeNull();
  });

  it('测试兑换码生效时健康保持 100，到达寿命也不会去世', () => {
    const r = advanceMonth(input({ godMode: true, playerLifespan: 30, health: 40 }), seeded());
    expect(r.health).toBe(100);
    expect(r.died).toBe(false);
  });

  it('未出生登记时只按住房舒适度恢复健康，不结算收入与事件', () => {
    const r = advanceMonth(input({ isRegistered: false, health: 50, job: { dailySalary: 100 } }), seeded());
    expect(r.salary).toBe(0);
    expect(r.health).toBeGreaterThanOrEqual(50);
    expect(r.simEvent).toBeNull();
    expect(r.achievements).not.toContain('first_salary');
  });
});

describe('推演事件与拍卖会', () => {
  it('本月没有新事件时给出「本月无事发生」', () => {
    const r = advanceMonth(input(), QUIET);
    expect(r.simEvent).toBeNull();
    expect(r.simQuiet).toBe(`${YEAR}.06 本月无事发生`);
  });

  it('上个月的拍卖会在本月没有新拍卖会时结束', () => {
    expect(advanceMonth(input({ hasAuction: true }), QUIET).auction).toEqual({ action: 'close' });
    expect(advanceMonth(input({ hasAuction: false }), QUIET).auction).toEqual({ action: 'none' });
  });
});

describe('纯函数性质', () => {
  it('相同输入与相同随机序列得到相同结果，且不修改输入', () => {
    const base = input({ job: { dailySalary: 80 }, properties: [{ id: 'h', isRentedOut: true, rentPerMonth: 100 }] });
    const snapshot = JSON.stringify(base);
    const a = advanceMonth(base, seeded(42));
    const b = advanceMonth(base, seeded(42));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(base)).toBe(snapshot);
  });
});
