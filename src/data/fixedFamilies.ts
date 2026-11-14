// ============================================================
// 固定家族列表
// ============================================================
// 在这里添加游戏中固定存在的家族，以及以后才会出现的家族。
//
// 这个列表会用在两个地方：
//   1. 家族排行榜：在当前游戏年份内「存在」的家族，都会和玩家家族一起排名；
//   2. 出身随机：出生登记随机到某个阶层时，可能出生在该阶层的固定家族里
//      （playable 为 false 的家族不会被随机到）。
//
// 每个家族的字段说明：
//   surname    姓氏（必填），例如 '纳海'
//   classId    阶层（必填）：'royal' 皇族 / 'noble' 贵族 / 'merchant' 富商 / 'middle' 中产 /
//              'modest' 小康 / 'commoner' 平民 / 'beggar' 乞丐
//   cohesion   凝聚力 0–100（排行榜用）
//   wealth     家族资产（卢布，排行榜用；10 亿为财力满分）
//   influence  影响力 0–100（排行榜用）
//   fromYear   从哪一年开始出现（可选，不填表示一开始就存在）
//   toYear     到哪一年为止（可选，不填表示一直存在）
//   playable   玩家能否随机出生在这个家族（可选，默认 true）
//   desc       简介（可选）
//
// 新增家族时，复制一行修改即可，例如：
//   { surname: '某某', classId: 'noble', cohesion: 70, wealth: 1e8, influence: 60, fromYear: 1880, desc: '……' },
// ============================================================

export type FixedFamilyClass = 'royal' | 'noble' | 'merchant' | 'middle' | 'modest' | 'commoner' | 'beggar';

export interface FixedFamily {
  surname: string;
  classId: FixedFamilyClass;
  cohesion: number;
  wealth: number;
  influence: number;
  fromYear?: number;
  toYear?: number;
  playable?: boolean;
  desc?: string;
}

export const FIXED_FAMILIES: FixedFamily[] = [
  // ---------- 皇族 ----------
  // 消失时间待定（帝国于 1920 年终结，纳海家族之后的去向待按维基确定）
  { surname: '纳海', classId: 'royal', cohesion: 88, wealth: 5e9, influence: 100, desc: '1824 年起统治卡罗尼亚帝国的纳海王朝。' },

  // ---------- 贵族 ----------
  { surname: '伊马达', classId: 'noble', cohesion: 75, wealth: 3e8, influence: 82 },
  { surname: '洪图拉颜', classId: 'noble', cohesion: 70, wealth: 2e8, influence: 76 },
  { surname: '鄂登禾萨穆', classId: 'noble', cohesion: 72, wealth: 1.5e8, influence: 70 },
  { surname: '瓦伦丁', classId: 'noble', cohesion: 78, wealth: 1.2e8, influence: 66, desc: '以机械工艺起家的名门。' },

  // ---------- 富商 ----------
  { surname: '扎哈罗夫', classId: 'merchant', cohesion: 65, wealth: 6e7, influence: 52 },
  { surname: '彼得罗夫', classId: 'merchant', cohesion: 60, wealth: 4e7, influence: 46 },

  // ---------- 中产及以下 ----------
  { surname: '费佘', classId: 'middle', cohesion: 70, wealth: 5e6, influence: 30 },
  { surname: '阿加德斯', classId: 'modest', cohesion: 72, wealth: 8e5, influence: 18 },
  { surname: '阿布灭', classId: 'commoner', cohesion: 75, wealth: 5e4, influence: 8 },
  { surname: '伊体什', classId: 'beggar', cohesion: 80, wealth: 0, influence: 1 },

  // ---------- 以后出现的家族（在下面添加，填写 fromYear） ----------
];

export const CLASS_LABELS: Record<FixedFamilyClass, string> = {
  royal: '皇族',
  noble: '贵族',
  merchant: '富商',
  middle: '中产',
  modest: '小康',
  commoner: '平民',
  beggar: '乞丐',
};

/** 指定年份存在的固定家族 */
export const familiesActiveIn = (year: number): FixedFamily[] =>
  FIXED_FAMILIES.filter((f) => (f.fromYear === undefined || year >= f.fromYear) && (f.toYear === undefined || year <= f.toYear));
