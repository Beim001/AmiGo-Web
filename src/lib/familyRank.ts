// 家族排行榜：按凝聚力、财力、影响力综合排名（默认皇族第一，贵族依次）
// - 凝聚力：在世成员对当家人（玩家）的平均好感度
// - 财力：家族资产净值（现金 + 存款 − 贷款 + 房产 + 股票 + 监护托管），按对数折算为 0–100
// - 影响力：当家人的声望

import { familiesActiveIn, CLASS_LABELS } from '../data/fixedFamilies';

export const WEIGHTS = { cohesion: 0.3, wealth: 0.4, influence: 0.3 };
/** 财力满分对应的资产（10 亿 ₽） */
export const WEALTH_FULL_SCORE = 1e9;

export interface FamilyStanding {
  surname: string;
  classLabel: string;
  cohesion: number;
  wealth: number;
  influence: number;
  isPlayer?: boolean;
}

/** 指定年份参与排名的 NPC 家族（来自 src/data/fixedFamilies.ts） */
export const npcFamiliesIn = (year: number): FamilyStanding[] =>
  familiesActiveIn(year).map((f) => ({
    surname: f.surname,
    classLabel: CLASS_LABELS[f.classId],
    cohesion: f.cohesion,
    wealth: f.wealth,
    influence: f.influence,
  }));

export const wealthScore = (wealth: number) =>
  Math.max(0, Math.min(100, (Math.log10(Math.max(1, wealth)) / Math.log10(WEALTH_FULL_SCORE)) * 100));

export const familyScore = (f: FamilyStanding) =>
  WEIGHTS.cohesion * f.cohesion + WEIGHTS.wealth * wealthScore(f.wealth) + WEIGHTS.influence * f.influence;

export interface RankedFamily extends FamilyStanding {
  rank: number;
  score: number;
}

/** 玩家家族与 NPC 家族一起排名；与玩家同姓的 NPC 家族不重复列出 */
export const rankFamilies = (player: FamilyStanding, year = 1870): RankedFamily[] =>
  [...npcFamiliesIn(year).filter((f) => f.surname !== player.surname), { ...player, isPlayer: true }]
    .map((f) => ({ ...f, score: Math.round(familyScore(f) * 10) / 10 }))
    .sort((a, b) => b.score - a.score)
    .map((f, i) => ({ ...f, rank: i + 1 }));

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
};

/** 家族资产净值 */
/** 家人的月收入按几个月计入家族资产净值（第 73 题：家人收入只计入家族财力） */
export const KIN_INCOME_MONTHS = 12;

export const familyNetWorth = (cash: number, deposit: number, loan: number, held = 0, heirloomValue = 0, kinIncome = 0): number => {
  const props = readJson<any[]>('amigo_owned_properties', []);
  const propertyValue = Array.isArray(props) ? props.reduce((s, p) => s + (p.currentValue || p.purchasePrice || 0), 0) : 0;
  const stocks = readJson<any[]>('amigo_stocks', []);
  const holdings = readJson<any[]>('amigo_stock_holdings', []);
  const stockValue = Array.isArray(holdings)
    ? holdings.reduce((s, h) => s + (h.shares || 0) * ((Array.isArray(stocks) ? stocks.find((x) => x.id === h.stockId)?.price : undefined) ?? h.avgCost ?? 0), 0)
    : 0;
  return Math.max(0, cash + deposit - loan + propertyValue + stockValue + held + heirloomValue + kinIncome * KIN_INCOME_MONTHS);
};
