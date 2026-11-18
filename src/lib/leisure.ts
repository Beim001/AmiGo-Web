// 文娱休闲（第 67.10 题，用户 2026-11-18 确认）：剧院、赌场、赛马、斗鸡、斗牛、摔跤，每项每个游戏月一次。
// - 剧院：花钱看戏，健康恢复。
// - 赌场：押大小。赛马、斗鸡、斗牛、摔跤：观赛下注，或亲自上场赢奖金与声望（输了可能受伤或失去斗鸡）。
// - 下注由庄家抽水：每注期望回报 HOUSE_RETURN（90%），赔率 = 期望回报 ÷ 胜率，单注最多翻 MAX_ODDS 倍，每注上限为现金的一半。
// - 声望分雅俗：剧院、赛马是上流社交，去了声望 +1（每月合计最多 +1）；赌场、斗鸡是市井消遣，去了声望 -1；
//   斗牛、摔跤只有亲自上场获胜才加声望。

import { loadStored, saveStored } from './storage';
import { seededRng } from './appearance';
import { randomGivenName } from './names';
import type { VehicleId } from './vehicles';

export type LeisureId = 'theater' | 'casino' | 'horse_race' | 'cockfight' | 'bullfight' | 'wrestling';
export type LeisureTaste = 'elegant' | 'vulgar' | 'neutral';

export interface LeisureDef {
  id: LeisureId;
  name: string;
  venue: string;
  desc: string;
  taste: LeisureTaste;
}

export const LEISURES: LeisureDef[] = [
  { id: 'theater', name: '剧院', venue: '北城大剧院', desc: '上演俄国歌剧与本地史诗说唱，散场后神清气爽。', taste: 'elegant' },
  { id: 'casino', name: '赌场', venue: '码头赌坊', desc: '骰盅押大小，庄家抽一成水。', taste: 'vulgar' },
  { id: 'horse_race', name: '赛马', venue: '皇家御马场赛马会', desc: '权贵云集的赛马会，可押注，也可牵自家的马下场。', taste: 'elegant' },
  { id: 'cockfight', name: '斗鸡', venue: '集市斗鸡场', desc: '市井最热闹的赌局，可押注，也可养一只斗鸡上场。', taste: 'vulgar' },
  { id: 'bullfight', name: '斗牛', venue: '城郊斗牛场', desc: '斗牛士与公牛生死相搏，敢上场的人能一夜成名。', taste: 'neutral' },
  { id: 'wrestling', name: '摔跤', venue: '节庆摔跤场', desc: '传统摔跤比赛，按年龄与体魄定胜负。', taste: 'neutral' },
];

export const leisureById = (id: string): LeisureDef | undefined => LEISURES.find((l) => l.id === id);

export const THEATER_COST = 500;
export const THEATER_HEALTH = 5;
/** 观赛下注与赌场的最低年龄 */
export const BET_MIN_AGE = 16;
export const MIN_BET = 100;
/** 每注期望回报（庄家抽水 10%） */
export const HOUSE_RETURN = 0.9;
export const MAX_ODDS = 5;
export const ELEGANT_REP = 1;
export const VULGAR_REP = -1;

/** 亲自上场的规则 */
export const RACE_ENTRY_FEE = 1_000;
export const RACE_PRIZE = 10_000;
export const RACE_WIN_REP = 2;
/** 名驹与骑乘马的夺冠概率 */
export const RACE_WIN_CHANCE: Partial<Record<VehicleId, number>> = { thoroughbred: 0.45, riding_horse: 0.15 };

export const FIGHTING_COCK_PRICE = 500;
export const COCKFIGHT_ENTRY_FEE = 200;
export const COCKFIGHT_PRIZE = 1_500;
export const COCKFIGHT_WIN_CHANCE = 0.5;

export const BULLFIGHT_MIN_AGE = 18;
export const BULLFIGHT_MAX_AGE = 40;
export const BULLFIGHT_MIN_HEALTH = 60;
export const BULLFIGHT_PRIZE = 15_000;
export const BULLFIGHT_WIN_REP = 3;
export const BULLFIGHT_INJURY = 25;

export const WRESTLING_MIN_AGE = 16;
export const WRESTLING_MAX_AGE = 45;
export const WRESTLING_PRIZE = 5_000;
export const WRESTLING_WIN_REP = 2;
export const WRESTLING_INJURY = 8;

// ---------- 存档：每项每月一次 ----------

/** 各项活动最近一次参加的月份（年 × 12 + 月），以及雅事声望最近一次加分的月份 */
export const LEISURE_RECORD_KEY = 'amigo_leisure_record';
/** 是否养着一只斗鸡 */
export const FIGHTING_COCK_KEY = 'amigo_fighting_cock';

export type LeisureRecord = Partial<Record<LeisureId | 'elegantRep', number>>;
export const monthIndex = (year: number, month: number) => year * 12 + month;

export const loadLeisureRecord = (): LeisureRecord => {
  const raw = loadStored<unknown>(LEISURE_RECORD_KEY, {});
  return raw && typeof raw === 'object' ? (raw as LeisureRecord) : {};
};
export const saveLeisureRecord = (r: LeisureRecord) => saveStored(LEISURE_RECORD_KEY, r);
export const loadFightingCock = () => loadStored<unknown>(FIGHTING_COCK_KEY, false) === true;
export const saveFightingCock = (has: boolean) => saveStored(FIGHTING_COCK_KEY, has);

export const visitedThisMonth = (record: LeisureRecord, id: LeisureId, year: number, month: number) =>
  record[id] === monthIndex(year, month);

/** 本次活动带来的雅俗声望变化（雅事每月合计最多 +1），以及更新后的记录 */
export const visitLeisure = (record: LeisureRecord, id: LeisureId, year: number, month: number): { record: LeisureRecord; rep: number } => {
  const m = monthIndex(year, month);
  const taste = leisureById(id)!.taste;
  const next: LeisureRecord = { ...record, [id]: m };
  if (taste === 'vulgar') return { record: next, rep: VULGAR_REP };
  if (taste === 'elegant' && record.elegantRep !== m) return { record: { ...next, elegantRep: m }, rep: ELEGANT_REP };
  return { record: next, rep: 0 };
};

// ---------- 下注 ----------

export interface Contender {
  name: string;
  /** 胜率 */
  chance: number;
  /** 赔率（含本金） */
  odds: number;
}

/** 庄家赔率：期望回报 ÷ 胜率，向下取两位小数，最多 MAX_ODDS 倍 */
export const oddsFor = (chance: number) => Math.min(MAX_ODDS, Math.floor((HOUSE_RETURN / chance) * 100) / 100);

const HORSE_NAMES = ['追风', '赤焰', '雪蹄', '黑旋风', '金鬃', '踏云', '飞霜', '夜照'];
const COCK_NAMES = ['红冠将军', '黑羽霸王', '金爪', '铁嘴', '白翎', '花斑'];

/** 把权重归一为胜率 */
const toContenders = (names: string[], weights: number[]): Contender[] => {
  const total = weights.reduce((a, b) => a + b, 0);
  return names.map((name, i) => {
    const chance = weights[i] / total;
    return { name, chance, odds: oddsFor(chance) };
  });
};

/** 本月这项活动的参赛者与赔率（同一个月内固定） */
export const contendersFor = (id: LeisureId, year: number, month: number): Contender[] => {
  const rng = seededRng(`leisure_${id}_${year}_${month}`);
  const pickDistinct = (pool: string[], n: number) => {
    const rest = [...pool];
    return Array.from({ length: n }, () => rest.splice(Math.floor(rng() * rest.length), 1)[0]);
  };
  switch (id) {
    case 'casino':
      return toContenders(['大', '小'], [1, 1]);
    case 'horse_race': {
      const names = pickDistinct(HORSE_NAMES, 4);
      return toContenders(names, names.map(() => 1 + rng() * 4));
    }
    case 'cockfight': {
      const names = pickDistinct(COCK_NAMES, 2);
      return toContenders(names, names.map(() => 1 + rng() * 2));
    }
    case 'bullfight': {
      const matador = 0.6 + rng() * 0.25;
      return toContenders([`斗牛士${randomGivenName('男', rng)}胜`, '公牛胜'], [matador, 1 - matador]);
    }
    case 'wrestling': {
      const a = randomGivenName('男', rng);
      let b = randomGivenName('男', rng);
      while (b === a) b = randomGivenName('男', rng);
      return toContenders([a, b], [1 + rng() * 2, 1 + rng() * 2]);
    }
    default:
      return [];
  }
};

/** 每注上限：现金的一半 */
export const maxBet = (coins: number) => Math.floor(Math.max(0, coins) / 2);

/** 下注的限制；可以下注时返回 null */
export const betBlocked = (ctx: { isRegistered: boolean; age: number; coins: number; amount: number }): string | null => {
  if (!ctx.isRegistered) return '请先完成出生登记';
  if (ctx.age < BET_MIN_AGE) return `年满 ${BET_MIN_AGE} 岁才能下注`;
  if (!Number.isFinite(ctx.amount) || ctx.amount < MIN_BET) return `每注至少 ${MIN_BET}`;
  if (ctx.amount > maxBet(ctx.coins)) return `每注最多为现金的一半（${maxBet(ctx.coins).toLocaleString()}）`;
  return null;
};

/** 按胜率开出结果：返回获胜者序号与下注者拿回的钱（含本金，输了为 0） */
export const resolveBet = (contenders: Contender[], pick: number, amount: number, rng: () => number = Math.random) => {
  let r = rng();
  let winner = contenders.length - 1;
  for (let i = 0; i < contenders.length; i++) {
    if (r < contenders[i].chance) {
      winner = i;
      break;
    }
    r -= contenders[i].chance;
  }
  return { winner, payout: winner === pick ? Math.floor(amount * contenders[pick].odds) : 0 };
};

// ---------- 亲自上场 ----------

export interface PlayerCtx {
  isRegistered: boolean;
  age: number;
  health: number;
  coins: number;
  vehicles: VehicleId[];
  hasCock: boolean;
}

/** 赛马用自家最好的马 */
export const bestRaceHorse = (vehicles: VehicleId[]): VehicleId | null =>
  vehicles.includes('thoroughbred') ? 'thoroughbred' : vehicles.includes('riding_horse') ? 'riding_horse' : null;

/** 摔跤胜率：20–30 岁最强，健康越好越强，限制在 10%–70% */
export const wrestlingChance = (age: number, health: number) => {
  const agePenalty = age < 20 ? (20 - age) * 0.03 : age > 30 ? (age - 30) * 0.02 : 0;
  return Math.min(0.7, Math.max(0.1, 0.35 + (health - 60) / 200 - agePenalty));
};

/** 斗牛胜率：健康越好越强，限制在 25%–55% */
export const bullfightChance = (health: number) => Math.min(0.55, Math.max(0.25, 0.25 + (health - 60) / 100));

/** 不能亲自上场的原因；可以时返回 null */
export const competeBlocked = (id: LeisureId, ctx: PlayerCtx): string | null => {
  if (!ctx.isRegistered) return '请先完成出生登记';
  switch (id) {
    case 'horse_race':
      if (ctx.age < BET_MIN_AGE) return `年满 ${BET_MIN_AGE} 岁才能下场`;
      if (!bestRaceHorse(ctx.vehicles)) return '需要先在车马市场买一匹骑乘马或名驹';
      if (ctx.coins < RACE_ENTRY_FEE) return `报名费不足：需要 ${RACE_ENTRY_FEE.toLocaleString()}`;
      return null;
    case 'cockfight':
      if (ctx.age < BET_MIN_AGE) return `年满 ${BET_MIN_AGE} 岁才能下场`;
      if (!ctx.hasCock) return '需要先买一只斗鸡';
      if (ctx.coins < COCKFIGHT_ENTRY_FEE) return `报名费不足：需要 ${COCKFIGHT_ENTRY_FEE.toLocaleString()}`;
      return null;
    case 'bullfight':
      if (ctx.age < BULLFIGHT_MIN_AGE || ctx.age > BULLFIGHT_MAX_AGE) return `${BULLFIGHT_MIN_AGE}–${BULLFIGHT_MAX_AGE} 岁才能上场`;
      if (ctx.health < BULLFIGHT_MIN_HEALTH) return `健康不低于 ${BULLFIGHT_MIN_HEALTH} 才能上场`;
      return null;
    case 'wrestling':
      if (ctx.age < WRESTLING_MIN_AGE || ctx.age > WRESTLING_MAX_AGE) return `${WRESTLING_MIN_AGE}–${WRESTLING_MAX_AGE} 岁才能上场`;
      return null;
    default:
      return '这项活动不能亲自上场';
  }
};

export interface CompeteResult {
  won: boolean;
  /** 现金变化（已扣报名费） */
  coins: number;
  health: number;
  rep: number;
  /** 斗鸡输了死去 */
  lostCock: boolean;
  text: string;
}

/** 亲自上场：调用前须确认 competeBlocked 为 null */
export const compete = (id: LeisureId, ctx: PlayerCtx, rng: () => number = Math.random): CompeteResult => {
  const base = { coins: 0, health: 0, rep: 0, lostCock: false };
  switch (id) {
    case 'horse_race': {
      const horse = bestRaceHorse(ctx.vehicles)!;
      const won = rng() < (RACE_WIN_CHANCE[horse] ?? 0);
      const name = horse === 'thoroughbred' ? '名驹' : '骑乘马';
      return won
        ? { ...base, won, coins: RACE_PRIZE - RACE_ENTRY_FEE, rep: RACE_WIN_REP, text: `骑着自家${name}夺得头名，赢得奖金 ${RACE_PRIZE.toLocaleString()}` }
        : { ...base, won, coins: -RACE_ENTRY_FEE, text: `自家${name}没能跑进头名，白交报名费` };
    }
    case 'cockfight': {
      const won = rng() < COCKFIGHT_WIN_CHANCE;
      return won
        ? { ...base, won, coins: COCKFIGHT_PRIZE - COCKFIGHT_ENTRY_FEE, text: `自家斗鸡连胜三场，赢得彩头 ${COCKFIGHT_PRIZE.toLocaleString()}` }
        : { ...base, won, coins: -COCKFIGHT_ENTRY_FEE, lostCock: true, text: '自家斗鸡被啄死在场上' };
    }
    case 'bullfight': {
      const won = rng() < bullfightChance(ctx.health);
      return won
        ? { ...base, won, coins: BULLFIGHT_PRIZE, rep: BULLFIGHT_WIN_REP, text: `亲手制服公牛，全场欢呼，赢得奖金 ${BULLFIGHT_PRIZE.toLocaleString()}` }
        : { ...base, won, health: -BULLFIGHT_INJURY, text: '被公牛顶伤，抬下场去' };
    }
    case 'wrestling': {
      const won = rng() < wrestlingChance(ctx.age, ctx.health);
      return won
        ? { ...base, won, coins: WRESTLING_PRIZE, rep: WRESTLING_WIN_REP, text: `连摔三名对手夺魁，赢得奖金 ${WRESTLING_PRIZE.toLocaleString()}` }
        : { ...base, won, health: -WRESTLING_INJURY, text: '被对手摔伤，落败下场' };
    }
    default:
      return { ...base, won: false, text: '' };
  }
};
