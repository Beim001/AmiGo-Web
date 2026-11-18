// 驾照管理与车马市场（第 67.4 题，用户 2026-11-18 确认）
// - 执照：16 岁起可考马车执照，1900 年后开设汽车执照；执照是个人证件，传承后继承人要重新考，重置人生清空。
// - 车马市场：马匹分品种（挽马拉车、骑乘马与名驹可直接骑），车辆、游艇、坦克、直升飞机按年代解锁；
//   购入时声望一次性变化；全部属于家族资产（按转卖价计入资产净值），传承后保留，可半价转卖。
// - 每月：每件按价格 1% 付草料、马夫或燃油保养费，车夫另付工钱或口粮；付得起且能出行时健康恢复 +1。
//   能出行：有马车 + 挽马且（本人持马车执照或有车夫）、有汽车且持汽车执照、或有骑乘马 / 名驹。
//   付不起时不扣钱，本月只能步行；雇来的车夫因欠薪辞工，买来的车夫更容易逃跑。
// - 车夫：雇佣（月薪）或买奴隶（一次性身价 + 每月口粮，声望下降，每月有概率逃跑，历史大事件期间更高；帝国 1920 年灭亡后不能再买）。
// - 马场：家族产业，每月繁育、卖马分红，战乱年份军马需求大；偶有马瘟，当月没有收入还要付兽医费。
// - 职业：车夫需要马车执照；马夫、驯马师不需要。

import { loadStored, saveStored } from './storage';
import { currentRateEvent } from './bank';

export type LicenseId = 'carriage' | 'car';
export type VehicleId = 'draft_horses' | 'riding_horse' | 'thoroughbred' | 'carriage' | 'car' | 'yacht' | 'tank' | 'helicopter' | 'ranch';
export type VehicleKind = 'horse' | 'vehicle' | 'special' | 'estate';

export interface LicenseDef {
  id: LicenseId;
  name: string;
  fee: number;
  /** 从这一年起开考（0 表示不限） */
  fromYear: number;
}

export interface VehicleDef {
  id: VehicleId;
  kind: VehicleKind;
  name: string;
  price: number;
  /** 购入时声望一次性上升 */
  reputation: number;
  /** 从这一年起才有出售（0 表示不限） */
  fromYear: number;
  desc: string;
}

export const LICENSES: LicenseDef[] = [
  { id: 'carriage', name: '马车执照', fee: 500, fromYear: 0 },
  { id: 'car', name: '汽车执照', fee: 2_000, fromYear: 1900 },
];

export const VEHICLES: VehicleDef[] = [
  { id: 'draft_horses', kind: 'horse', name: '挽马（一对）', price: 6_000, reputation: 0, fromYear: 0, desc: '壮实耐劳的挽马，套上马车才能出行。' },
  { id: 'riding_horse', kind: 'horse', name: '骑乘马', price: 8_000, reputation: 1, fromYear: 0, desc: '温顺的骑乘马，不用马车也能代步。' },
  { id: 'thoroughbred', kind: 'horse', name: '名驹', price: 60_000, reputation: 4, fromYear: 0, desc: '血统纯正的阿哈尔捷金名驹，权贵竞相收藏。' },
  { id: 'carriage', kind: 'vehicle', name: '四轮马车', price: 14_000, reputation: 2, fromYear: 0, desc: '轻便四轮马车，需配挽马，由持照的本人或车夫驾驶。' },
  { id: 'car', kind: 'vehicle', name: '汽车', price: 300_000, reputation: 5, fromYear: 1900, desc: '从欧洲进口的内燃机汽车，需持汽车执照驾驶。' },
  { id: 'yacht', kind: 'special', name: '蒸汽游艇', price: 500_000, reputation: 6, fromYear: 0, desc: '停泊在厅和港的私人蒸汽游艇，宴请宾客的排场。' },
  { id: 'tank', kind: 'special', name: '坦克', price: 2_000_000, reputation: 8, fromYear: 1916, desc: '大战中出现的履带装甲车，退役后流入私人收藏。' },
  { id: 'helicopter', kind: 'special', name: '直升飞机', price: 3_000_000, reputation: 10, fromYear: 1939, desc: '能垂直起降的旋翼飞机。' },
  { id: 'ranch', kind: 'estate', name: '马场', price: 100_000, reputation: 2, fromYear: 0, desc: '城郊的家族马场，繁育幼马出售，战乱年份军马抢手。' },
];

export const VEHICLE_KIND_LABEL: Record<VehicleKind, string> = { horse: '马匹', vehicle: '车辆', special: '游艇与特种', estate: '产业' };

export const LICENSE_MIN_AGE = 16;
/** 每月保养费占价格的比例（马场的经营开支已计入分红，不另收） */
export const VEHICLE_UPKEEP_RATE = 0.01;
/** 出售时按价格的这一比例回收，资产净值也按此计算 */
export const VEHICLE_RESALE_RATE = 0.5;
/** 能出行的月份健康恢复额外 +1 */
export const VEHICLE_HEALTH_BONUS = 1;

// ---------- 车夫 ----------

export type CoachmanKind = 'hired' | 'slave';
export interface Coachman {
  kind: CoachmanKind;
  name: string;
}
/** 雇佣车夫的月薪 */
export const HIRED_COACHMAN_WAGE = 3_000;
/** 买奴隶：一次性身价、每月口粮、声望变化 */
export const SLAVE_PRICE = 8_000;
export const SLAVE_FOOD = 300;
export const SLAVE_REPUTATION = -3;
/** 释放奴隶时声望回升 */
export const FREE_SLAVE_REPUTATION = 1;
/** 帝国灭亡的年份起不能再买奴隶 */
export const SLAVE_TRADE_ENDS = 1920;
/** 买来的车夫每月逃跑概率：平时、历史大事件期间、欠口粮的月份 */
export const SLAVE_ESCAPE_CHANCE = 0.02;
export const SLAVE_ESCAPE_CHANCE_EVENT = 0.1;
export const SLAVE_ESCAPE_CHANCE_UNFED = 0.3;

// ---------- 马场 ----------

/** 马场每月分红占马场价格的比例区间（平均约 1.3%，年化约 15%） */
export const RANCH_RETURN_MIN = 0.006;
export const RANCH_RETURN_MAX = 0.02;
/** 历史大事件期间军马需求大，分红 ×1.5 */
export const RANCH_EVENT_MULTIPLIER = 1.5;
/** 每月闹马瘟的概率与兽医费 */
export const RANCH_PLAGUE_CHANCE = 0.05;
export const RANCH_VET_FEE = 3_000;

// ---------- 存档 ----------

/** 当家人持有的执照（个人证件，传承时清空） */
export const LICENSES_KEY = 'amigo_licenses';
/** 家族拥有的马匹、车辆与马场（传承后保留） */
export const VEHICLES_KEY = 'amigo_vehicles';
/** 家里的车夫（传承后保留） */
export const COACHMAN_KEY = 'amigo_coachman';

export const licenseById = (id: string): LicenseDef | undefined => LICENSES.find((l) => l.id === id);
export const vehicleById = (id: string): VehicleDef | undefined => VEHICLES.find((v) => v.id === id);

const sanitizeIds = <T extends string>(raw: unknown, all: readonly { id: T }[]): T[] =>
  Array.isArray(raw) ? all.map((x) => x.id).filter((id) => raw.includes(id)) : [];

export const loadLicenses = (): LicenseId[] => sanitizeIds(loadStored<unknown>(LICENSES_KEY, []), LICENSES);
export const loadVehicles = (): VehicleId[] => sanitizeIds(loadStored<unknown>(VEHICLES_KEY, []), VEHICLES);
export const saveLicenses = (ids: LicenseId[]) => saveStored(LICENSES_KEY, sanitizeIds(ids, LICENSES));
export const saveVehicles = (ids: VehicleId[]) => saveStored(VEHICLES_KEY, sanitizeIds(ids, VEHICLES));

export const parseCoachman = (raw: unknown): Coachman | null => {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Partial<Coachman>;
  return (c.kind === 'hired' || c.kind === 'slave') && typeof c.name === 'string' && c.name ? { kind: c.kind, name: c.name } : null;
};
export const loadCoachman = (): Coachman | null => parseCoachman(loadStored<unknown>(COACHMAN_KEY, null));
export const saveCoachman = (c: Coachman | null) => saveStored(COACHMAN_KEY, c);

// ---------- 判定 ----------

export interface GarageContext {
  isRegistered: boolean;
  age: number;
  year: number;
  coins: number;
  licenses: LicenseId[];
  vehicles: VehicleId[];
}

/** 不能考这本执照的原因；可以考时返回 null */
export const licenseBlocked = (def: LicenseDef, ctx: GarageContext): string | null => {
  if (!ctx.isRegistered) return '请先完成出生登记';
  if (ctx.licenses.includes(def.id)) return `已持有${def.name}`;
  if (ctx.year < def.fromYear) return `${def.fromYear} 年后才开设${def.name}考试`;
  if (ctx.age < LICENSE_MIN_AGE) return `年满 ${LICENSE_MIN_AGE} 岁才能报考（当前 ${ctx.age} 岁）`;
  if (ctx.coins < def.fee) return `考试费不足：需要 ${def.fee.toLocaleString()}`;
  return null;
};

/** 不能买的原因；可以买时返回 null */
export const purchaseBlocked = (def: VehicleDef, ctx: GarageContext): string | null => {
  if (!ctx.isRegistered) return '请先完成出生登记';
  if (ctx.vehicles.includes(def.id)) return `家里已有${def.name}`;
  if (ctx.year < def.fromYear) return `${def.fromYear} 年后才有${def.name}出售`;
  if (ctx.coins < def.price) return `现金不足：需要 ${def.price.toLocaleString()}`;
  return null;
};

/** 不能买奴隶的原因；可以买时返回 null */
export const slaveBlocked = (ctx: { isRegistered: boolean; year: number; coins: number; coachman: Coachman | null }): string | null => {
  if (!ctx.isRegistered) return '请先完成出生登记';
  if (ctx.coachman) return '家里已经有车夫';
  if (ctx.year >= SLAVE_TRADE_ENDS) return '帝国灭亡后奴隶买卖已被废除';
  if (ctx.coins < SLAVE_PRICE) return `现金不足：需要 ${SLAVE_PRICE.toLocaleString()}`;
  return null;
};

export const vehicleUpkeep = (def: VehicleDef) => (def.kind === 'estate' ? 0 : Math.round(def.price * VEHICLE_UPKEEP_RATE));
export const vehicleResale = (def: VehicleDef) => Math.round(def.price * VEHICLE_RESALE_RATE);
export const coachmanCost = (c: Coachman | null) => (!c ? 0 : c.kind === 'hired' ? HIRED_COACHMAN_WAGE : SLAVE_FOOD);

/** 家族马匹、车辆与马场按转卖价计的总价值（计入资产净值） */
export const vehiclesValue = (vehicles: VehicleId[]) =>
  vehicles.reduce((sum, id) => {
    const def = vehicleById(id);
    return sum + (def ? vehicleResale(def) : 0);
  }, 0);

/** 现有的车马能否让当家人出行（不考虑本月是否付得起保养） */
export const canTravel = (vehicles: VehicleId[], licenses: LicenseId[], coachman: Coachman | null): boolean =>
  (vehicles.includes('carriage') && vehicles.includes('draft_horses') && (licenses.includes('carriage') || !!coachman)) ||
  (vehicles.includes('car') && licenses.includes('car')) ||
  vehicles.includes('riding_horse') ||
  vehicles.includes('thoroughbred');

/** 职业所需执照是否满足 */
export const meetsLicense = (job: { requiresLicense?: LicenseId }, licenses: LicenseId[]) =>
  !job.requiresLicense || licenses.includes(job.requiresLicense);

// ---------- 每月结算 ----------

export interface GarageMonthInput {
  vehicles: VehicleId[];
  licenses: LicenseId[];
  coachman: Coachman | null;
  /** 付完其他开销后可用的现金（不含本月马场分红） */
  cash: number;
  year: number;
}

export interface GarageSettlement {
  /** 马场本月分红 */
  ranchIncome: number;
  /** 本月付出的保养费、车夫工钱与兽医费（付不起时为 0） */
  paid: number;
  /** 有开销但付不起 */
  unpaid: boolean;
  /** 本月健康恢复加成 */
  healthBonus: number;
  /** 结算后的车夫；与输入相同时为同一对象 */
  coachman: Coachman | null;
  notes: string[];
  /** [标题, 描述] 写入人生日志 */
  logs: Array<[string, string]>;
}

export const settleGarage = (input: GarageMonthInput, rng: () => number = Math.random): GarageSettlement => {
  const { vehicles, licenses, year } = input;
  const notes: string[] = [];
  const logs: Array<[string, string]> = [];
  const event = currentRateEvent(year);

  // 马场：先结算分红（马瘟当月没有收入，还要付兽医费）
  let ranchIncome = 0;
  let vetFee = 0;
  const ranch = vehicles.includes('ranch') ? vehicleById('ranch')! : null;
  if (ranch) {
    if (rng() < RANCH_PLAGUE_CHANCE) {
      vetFee = RANCH_VET_FEE;
      notes.push('🐴 马场闹马瘟，本月没有收成');
      logs.push(['马场闹马瘟', `马匹染病，本月卖不出马，还要付兽医费 ${RANCH_VET_FEE.toLocaleString()}。`]);
    } else {
      const rate = RANCH_RETURN_MIN + rng() * (RANCH_RETURN_MAX - RANCH_RETURN_MIN);
      ranchIncome = Math.round(ranch.price * rate * (event ? RANCH_EVENT_MULTIPLIER : 1));
      notes.push(`马场 +${ranchIncome.toLocaleString()}${event ? '（军马抢手）' : ''}`);
    }
  }

  let coachman = input.coachman;
  const upkeep = vehicles.reduce((sum, id) => sum + vehicleUpkeep(vehicleById(id)!), 0) + coachmanCost(coachman) + vetFee;
  let paid = 0;
  let unpaid = false;
  if (upkeep > 0) {
    if (input.cash + ranchIncome >= upkeep) {
      paid = upkeep;
      notes.push(`车马开销 -${upkeep.toLocaleString()}`);
    } else {
      unpaid = true;
      notes.push('⚠️ 养不起车马，本月只能步行');
    }
  }

  // 车夫：欠薪的雇工辞工；买来的车夫可能逃跑
  if (coachman?.kind === 'hired' && unpaid) {
    notes.push(`⚠️ 车夫${coachman.name}因欠薪辞工`);
    logs.push([`车夫${coachman.name}辞工`, '付不起工钱，雇来的车夫辞工离开。']);
    coachman = null;
  } else if (coachman?.kind === 'slave') {
    const chance = unpaid ? SLAVE_ESCAPE_CHANCE_UNFED : event ? SLAVE_ESCAPE_CHANCE_EVENT : SLAVE_ESCAPE_CHANCE;
    if (rng() < chance) {
      notes.push(`⚠️ 车夫${coachman.name}逃跑了`);
      logs.push([`车夫${coachman.name}逃跑`, unpaid ? '断了口粮，买来的车夫趁夜逃走。' : event ? `趁${event.title}的动乱，买来的车夫逃走了。` : '买来的车夫趁夜逃走了。']);
      coachman = null;
    }
  }

  const healthBonus = !unpaid && canTravel(vehicles, licenses, coachman) ? VEHICLE_HEALTH_BONUS : 0;
  return { ranchIncome, paid, unpaid, healthBonus, coachman, notes, logs };
};
