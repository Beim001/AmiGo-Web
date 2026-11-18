// 简洁模式（面向 7 岁儿童设计的一屏界面）的纯规则：推荐工作、推荐住房、自动选择推演选项、一键买卖股票。
// 与完整模式共用同一份存档，只是把操作集中到一个大界面上。

import type { SimEventDef } from './simEvents';
import { optionBlocked } from './simEvents';
import type { StockHolding, StockItem, StockTradeLog } from './stockMarket';
import { classRank } from './lineage';

export const SIMPLE_MODE_KEY = 'amigo_simple_mode';

/** 推演事件自动选择：第一个不被现金卡住的选项（稳妥选项排在前面） */
export const autoOptionIndex = (def: SimEventDef, coins: number): number | null => {
  const safeFirst = def.options
    .map((o, i) => ({ o, i }))
    .sort((a, b) => (a.o.kind === 'safe' ? 0 : 1) - (b.o.kind === 'safe' ? 0 : 1));
  const hit = safeFirst.find(({ o }) => !optionBlocked(o, coins));
  return hit ? hit.i : null;
};

/**
 * 推荐工作：岗位按日薪从低到高分成三档，乞丐、平民家庭从低薪档推荐，小康、中产从中间档，富商、贵族、皇族从高薪档；
 * 在档位内随机挑 count 个（rng 由调用方按月份固定种子，同一个月内推荐不变）。
 */
export const recommendJobs = <T extends { dailySalary: number }>(jobs: T[], classId: string, rng: () => number, count = 3): T[] => {
  const sorted = [...jobs].sort((a, b) => a.dailySalary - b.dailySalary);
  const rank = Math.max(0, classRank(classId));
  const tier = rank <= 1 ? 0 : rank <= 3 ? 1 : 2;
  const size = Math.ceil(sorted.length / 3);
  const band = sorted.slice(tier * size, (tier + 1) * size);
  const pool = [...band];
  const picked: T[] = [];
  while (picked.length < count && pool.length > 0) picked.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return picked.sort((a, b) => b.dailySalary - a.dailySalary);
};

/** 推荐住房：买得起的房子里，留出三成现金后最舒适的一套；都买不起返回 null */
export const recommendHome = <T extends { price: number; comfortBonus: number }>(homes: T[], coins: number): T | null => {
  const affordable = homes.filter((h) => h.price <= coins * 0.7).sort((a, b) => b.comfortBonus - a.comfortBonus || a.price - b.price);
  return affordable[0] ?? null;
};

/** 简洁模式提示买房的条件：成年、没有房产、现金足够买最便宜的一套并留出三成 */
export const shouldSuggestHome = (age: number, ownsHome: boolean, coins: number, cheapest: number) =>
  age >= 18 && !ownsHome && coins * 0.7 >= cheapest;

/** 推荐股票：近期涨势最好的 count 只（按走势首尾比较） */
export const recommendStocks = (stocks: StockItem[], count = 3): StockItem[] =>
  [...stocks]
    .sort((a, b) => b.price / (b.history[0] || b.price) - a.price / (a.history[0] || a.price))
    .slice(0, count);

export interface TradeResult {
  holdings: StockHolding[];
  logs: StockTradeLog[];
  /** 现金变化：买入为负，卖出为正 */
  cashDelta: number;
  summary: string[];
}

/** 一键买入：用 budget 平均买入推荐的股票（整股，买不起一股的跳过） */
export const buyRecommended = (stocks: StockItem[], holdings: StockHolding[], budget: number, tradingDay: number, count = 3): TradeResult => {
  const picks = recommendStocks(stocks, count);
  const each = Math.floor(budget / Math.max(1, picks.length));
  const next = holdings.map((h) => ({ ...h }));
  const logs: StockTradeLog[] = [];
  const summary: string[] = [];
  let spent = 0;
  picks.forEach((s, i) => {
    const shares = Math.floor(each / s.price);
    if (shares <= 0) return;
    const cost = Math.round(shares * s.price);
    spent += cost;
    const h = next.find((x) => x.stockId === s.id);
    if (h) {
      h.avgCost = parseFloat(((h.shares * h.avgCost + cost) / (h.shares + shares)).toFixed(2));
      h.shares += shares;
    } else {
      next.push({ stockId: s.id, shares, avgCost: s.price });
    }
    logs.push({ id: `simple_buy_${tradingDay}_${i}_${s.id}`, type: 'buy', stockName: s.name, shares, price: s.price, total: cost, time: `交易日 #${tradingDay}` });
    summary.push(`${s.name} ${shares} 股`);
  });
  return { holdings: next, logs, cashDelta: -spent, summary };
};

/** 一键卖出全部持仓 */
export const sellAll = (stocks: StockItem[], holdings: StockHolding[], tradingDay: number): TradeResult & { profit: number } => {
  const logs: StockTradeLog[] = [];
  const summary: string[] = [];
  let income = 0;
  let profit = 0;
  holdings.forEach((h, i) => {
    const s = stocks.find((x) => x.id === h.stockId);
    if (!s || h.shares <= 0) return;
    const total = Math.round(h.shares * s.price);
    income += total;
    profit += total - Math.round(h.shares * h.avgCost);
    logs.push({ id: `simple_sell_${tradingDay}_${i}_${s.id}`, type: 'sell', stockName: s.name, shares: h.shares, price: s.price, total, time: `交易日 #${tradingDay}` });
    summary.push(`${s.name} ${h.shares} 股`);
  });
  return { holdings: [], logs, cashDelta: income, summary, profit };
};
