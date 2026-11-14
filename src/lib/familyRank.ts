// 家族排行榜：按凝聚力、财力、影响力综合排名（默认皇族第一，贵族依次）
// - 凝聚力：在世成员对当家人（玩家）的平均好感度
// - 财力：家族资产净值（现金 + 存款 − 贷款 + 房产 + 股票 + 监护托管），按对数折算为 0–100
// - 影响力：当家人的声望

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

export const NPC_FAMILIES: FamilyStanding[] = [
  { surname: '纳海', classLabel: '皇族', cohesion: 88, wealth: 5e9, influence: 100 },
  { surname: '伊马达', classLabel: '贵族', cohesion: 75, wealth: 3e8, influence: 82 },
  { surname: '洪图拉颜', classLabel: '贵族', cohesion: 70, wealth: 2e8, influence: 76 },
  { surname: '鄂登禾萨穆', classLabel: '贵族', cohesion: 72, wealth: 1.5e8, influence: 70 },
  { surname: '瓦伦丁', classLabel: '贵族', cohesion: 78, wealth: 1.2e8, influence: 66 },
  { surname: '扎哈罗夫', classLabel: '富商', cohesion: 65, wealth: 6e7, influence: 52 },
  { surname: '彼得罗夫', classLabel: '富商', cohesion: 60, wealth: 4e7, influence: 46 },
  { surname: '费佘', classLabel: '中产', cohesion: 70, wealth: 5e6, influence: 30 },
  { surname: '阿加德斯', classLabel: '小康', cohesion: 72, wealth: 8e5, influence: 18 },
  { surname: '阿布灭', classLabel: '平民', cohesion: 75, wealth: 5e4, influence: 8 },
  { surname: '伊体什', classLabel: '乞丐', cohesion: 80, wealth: 0, influence: 1 },
];

export const wealthScore = (wealth: number) =>
  Math.max(0, Math.min(100, (Math.log10(Math.max(1, wealth)) / Math.log10(WEALTH_FULL_SCORE)) * 100));

export const familyScore = (f: FamilyStanding) =>
  WEIGHTS.cohesion * f.cohesion + WEIGHTS.wealth * wealthScore(f.wealth) + WEIGHTS.influence * f.influence;

export interface RankedFamily extends FamilyStanding {
  rank: number;
  score: number;
}

/** 玩家家族与 NPC 家族一起排名；与玩家同姓的 NPC 家族不重复列出 */
export const rankFamilies = (player: FamilyStanding): RankedFamily[] =>
  [...NPC_FAMILIES.filter((f) => f.surname !== player.surname), { ...player, isPlayer: true }]
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
export const familyNetWorth = (cash: number, deposit: number, loan: number, held = 0): number => {
  const props = readJson<any[]>('amigo_owned_properties', []);
  const propertyValue = Array.isArray(props) ? props.reduce((s, p) => s + (p.currentValue || p.purchasePrice || 0), 0) : 0;
  const stocks = readJson<any[]>('amigo_stocks', []);
  const holdings = readJson<any[]>('amigo_stock_holdings', []);
  const stockValue = Array.isArray(holdings)
    ? holdings.reduce((s, h) => s + (h.shares || 0) * ((Array.isArray(stocks) ? stocks.find((x) => x.id === h.stockId)?.price : undefined) ?? h.avgCost ?? 0), 0)
    : 0;
  return Math.max(0, cash + deposit - loan + propertyValue + stockValue + held);
};
