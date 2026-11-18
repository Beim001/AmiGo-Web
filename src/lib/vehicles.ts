// 驾照管理（第 67.4 题，用户 2026-11-18 确认）：帝国时期改为「马车执照」，1900 年后才有汽车执照。
// - 考执照：16 岁起，交考试费即可取得；执照是个人证件，传承后继承人要重新考，重置人生清空。
// - 买车：要先有对应执照；购入时声望一次性上升；车辆属于家族资产（按转卖价计入资产净值），传承后保留。
// - 每月：按车价 1% 付草料、马夫或燃油保养费；付得起且当家人持有所拥有车辆的执照时，出行不再步行，健康恢复 +1。
//   付不起时不扣钱，本月只能步行（没有健康加成）。
// - 职业「车夫」需要马车执照（不需要自己有马车，给车行赶车）。

import { loadStored, saveStored } from './storage';

export type VehicleId = 'carriage' | 'car';

export interface VehicleDef {
  id: VehicleId;
  name: string;
  licenseName: string;
  licenseFee: number;
  price: number;
  /** 购入时声望一次性上升 */
  reputation: number;
  /** 从这一年起才能考执照、买车（0 表示不限） */
  fromYear: number;
  desc: string;
}

export const VEHICLES: VehicleDef[] = [
  {
    id: 'carriage',
    name: '四轮马车',
    licenseName: '马车执照',
    licenseFee: 500,
    price: 20_000,
    reputation: 2,
    fromYear: 0,
    desc: '两匹挽马拉的轻便四轮马车，出门不必再步行。',
  },
  {
    id: 'car',
    name: '汽车',
    licenseName: '汽车执照',
    licenseFee: 2_000,
    price: 300_000,
    reputation: 5,
    fromYear: 1900,
    desc: '从欧洲进口的内燃机汽车，北城街头罕见的新奇玩意。',
  },
];

export const LICENSE_MIN_AGE = 16;
/** 每月保养费占车价的比例 */
export const VEHICLE_UPKEEP_RATE = 0.01;
/** 出售车辆时按车价的这一比例回收，资产净值也按此计算 */
export const VEHICLE_RESALE_RATE = 0.5;
/** 有车可坐的月份健康恢复额外 +1 */
export const VEHICLE_HEALTH_BONUS = 1;

/** 当家人持有的执照（个人证件，传承时清空） */
export const LICENSES_KEY = 'amigo_licenses';
/** 家族拥有的车辆（传承后保留） */
export const VEHICLES_KEY = 'amigo_vehicles';

export const vehicleById = (id: string): VehicleDef | undefined => VEHICLES.find((v) => v.id === id);

const sanitize = (raw: unknown): VehicleId[] =>
  Array.isArray(raw) ? VEHICLES.map((v) => v.id).filter((id) => raw.includes(id)) : [];

export const loadLicenses = (): VehicleId[] => sanitize(loadStored<unknown>(LICENSES_KEY, []));
export const loadVehicles = (): VehicleId[] => sanitize(loadStored<unknown>(VEHICLES_KEY, []));
export const saveLicenses = (ids: VehicleId[]) => saveStored(LICENSES_KEY, sanitize(ids));
export const saveVehicles = (ids: VehicleId[]) => saveStored(VEHICLES_KEY, sanitize(ids));

export interface LicenseContext {
  isRegistered: boolean;
  age: number;
  year: number;
  coins: number;
  licenses: VehicleId[];
  vehicles: VehicleId[];
}

/** 不能考这本执照的原因；可以考时返回 null */
export const licenseBlocked = (def: VehicleDef, ctx: LicenseContext): string | null => {
  if (!ctx.isRegistered) return '请先完成出生登记';
  if (ctx.licenses.includes(def.id)) return `已持有${def.licenseName}`;
  if (ctx.year < def.fromYear) return `${def.fromYear} 年后才开设${def.licenseName}考试`;
  if (ctx.age < LICENSE_MIN_AGE) return `年满 ${LICENSE_MIN_AGE} 岁才能报考（当前 ${ctx.age} 岁）`;
  if (ctx.coins < def.licenseFee) return `考试费不足：需要 ${def.licenseFee.toLocaleString()}`;
  return null;
};

/** 不能买这辆车的原因；可以买时返回 null */
export const purchaseBlocked = (def: VehicleDef, ctx: LicenseContext): string | null => {
  if (!ctx.isRegistered) return '请先完成出生登记';
  if (ctx.vehicles.includes(def.id)) return `家里已有${def.name}`;
  if (ctx.year < def.fromYear) return `${def.fromYear} 年后才有${def.name}出售`;
  if (!ctx.licenses.includes(def.id)) return `需要先考取${def.licenseName}`;
  if (ctx.coins < def.price) return `现金不足：需要 ${def.price.toLocaleString()}`;
  return null;
};

export const vehicleUpkeep = (def: VehicleDef) => Math.round(def.price * VEHICLE_UPKEEP_RATE);
export const vehicleResale = (def: VehicleDef) => Math.round(def.price * VEHICLE_RESALE_RATE);

/** 家族车辆按转卖价计的总价值（计入资产净值） */
export const vehiclesValue = (vehicles: VehicleId[]) =>
  vehicles.reduce((sum, id) => sum + (vehicleById(id) ? vehicleResale(vehicleById(id)!) : 0), 0);

export interface VehicleSettlement {
  /** 本月保养费（付不起时为 0） */
  paid: number;
  /** 有车但付不起保养费 */
  unpaid: boolean;
  /** 本月健康恢复加成 */
  healthBonus: number;
}

/** 每月结算车辆保养：cash 为付完其他开销后可用的现金 */
export const settleVehicles = (vehicles: VehicleId[], licenses: VehicleId[], cash: number): VehicleSettlement => {
  const owned = vehicles.map(vehicleById).filter((v): v is VehicleDef => !!v);
  if (owned.length === 0) return { paid: 0, unpaid: false, healthBonus: 0 };
  const cost = owned.reduce((sum, v) => sum + vehicleUpkeep(v), 0);
  if (cash < cost) return { paid: 0, unpaid: true, healthBonus: 0 };
  const canDrive = owned.some((v) => licenses.includes(v.id));
  return { paid: cost, unpaid: false, healthBonus: canDrive ? VEHICLE_HEALTH_BONUS : 0 };
};

/** 职业所需执照是否满足 */
export const meetsLicense = (job: { requiresLicense?: VehicleId }, licenses: VehicleId[]) =>
  !job.requiresLicense || licenses.includes(job.requiresLicense);
