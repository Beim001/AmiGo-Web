// 帝国证券交易所：股票数据、行情推进与开户资格（纯函数，便于测试）

export interface StockItem {
  id: string;
  code: string;
  name: string;
  sector: string;
  price: number;
  prevPrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  history: number[];
  desc: string;
}

export interface StockHolding {
  stockId: string;
  shares: number;
  avgCost: number;
}

export interface StockTradeLog {
  id: string;
  type: 'buy' | 'sell';
  stockName: string;
  shares: number;
  price: number;
  total: number;
  time: string;
}

export interface StockNewsItem {
  id: string;
  title: string;
  desc: string;
  type: 'up' | 'down' | 'neutral';
  time: string;
  stockId?: string;
}

export const INITIAL_STOCKS: StockItem[] = [
  {
    id: 's1',
    code: '0001.CR',
    name: '卡罗尼亚重工',
    sector: '重工',
    price: 88.5,
    prevPrice: 85.0,
    highPrice: 94.2,
    lowPrice: 82.0,
    volume: 1250000,
    history: [78, 80, 82, 81, 85, 84, 88, 86, 85, 88.5],
    desc: '军工与齿轮重工巨头，主营战术蒸汽机甲与长枪大炮研发。',
  },
  {
    id: 's2',
    code: '0002.AM',
    name: '阿米诺斯医药',
    sector: '医药',
    price: 135.0,
    prevPrice: 128.0,
    highPrice: 142.5,
    lowPrice: 125.0,
    volume: 890000,
    history: [115, 118, 122, 120, 126, 128, 130, 127, 128, 135.0],
    desc: '医学院直属高能药企，专精抗体试剂与体能恢复液。',
  },
  {
    id: 's3',
    code: '0003.VT',
    name: '瓦伦丁机械工坊',
    sector: '工坊',
    price: 215.0,
    prevPrice: 210.0,
    highPrice: 228.0,
    lowPrice: 205.0,
    volume: 540000,
    history: [195, 198, 202, 208, 205, 210, 212, 208, 210, 215.0],
    desc: '名门家族核心实业，生产精密齿轮、皇家怀表与飞艇构件。',
  },
  {
    id: 's4',
    code: '0004.AT',
    name: '远洋飞艇航运',
    sector: '物流',
    price: 42.8,
    prevPrice: 45.0,
    highPrice: 48.5,
    lowPrice: 40.2,
    volume: 2100000,
    history: [48, 47, 46, 45, 44, 46, 45, 43, 45, 42.8],
    desc: '跨大西洋与极地蒸汽飞艇航线运营商，连通各大洲客货交通。',
  },
  {
    id: 's5',
    code: '0005.RM',
    name: '皇家晶石矿业',
    sector: '矿业',
    price: 64.2,
    prevPrice: 60.5,
    highPrice: 68.0,
    lowPrice: 58.0,
    volume: 1680000,
    history: [52, 55, 54, 58, 60, 59, 62, 60, 60.5, 64.2],
    desc: '开采高纯度蒸汽晶石与黑金矿脉，为工业提供动力源泉。',
  },
  {
    id: 's6',
    code: '0006.AI',
    name: '微型齿轮AI',
    sector: '科技',
    price: 310.0,
    prevPrice: 285.0,
    highPrice: 335.0,
    lowPrice: 270.0,
    volume: 420000,
    history: [240, 255, 260, 275, 280, 270, 290, 282, 285, 310.0],
    desc: '研制差分机自动化推演核心与智能算盘，高成长性科技龙头。',
  },
  {
    id: 's7',
    code: '0007.VB',
    name: '皇家飞雷黑啤',
    sector: '消费',
    price: 35.6,
    prevPrice: 35.0,
    highPrice: 37.2,
    lowPrice: 34.0,
    volume: 3200000,
    history: [33, 34, 34, 35, 35, 34.5, 35.2, 35, 35, 35.6],
    desc: '百年酿酒坊，经典黑啤畅销各大社交圈，属于高分红防御资产。',
  },
  {
    id: 's8',
    code: '0008.RB',
    name: '帝国皇家铁道',
    sector: '物流',
    price: 92.0,
    prevPrice: 90.0,
    highPrice: 96.5,
    lowPrice: 88.0,
    volume: 1850000,
    history: [82, 84, 85, 87, 88, 90, 91, 89, 90, 92.0],
    desc: '贯穿东西铁路主干线，客货运输垄断地位，现金流极为充沛。',
  },
  {
    id: 's9',
    code: '0009.EB',
    name: '远东联合商业银行',
    sector: '金融',
    price: 178.5,
    prevPrice: 172.0,
    highPrice: 185.0,
    lowPrice: 168.0,
    volume: 960000,
    history: [155, 160, 162, 165, 170, 168, 172, 170, 172, 178.5],
    desc: '跨国金融银行与抵押信用机构，盈利稳健且享受极高利息分红。',
  },
  {
    id: 's10',
    code: '0010.ST',
    name: '圣米迦勒新能源',
    sector: '科技',
    price: 52.4,
    prevPrice: 48.0,
    highPrice: 56.0,
    lowPrice: 45.0,
    volume: 1420000,
    history: [40, 42, 45, 44, 48, 46, 50, 47, 48, 52.4],
    desc: '主营高压气动涡轮与极光蓄电池组，绿色清洁能源新兴标杆。',
  },
];

export const NEWS_TEMPLATES = [
  { text: '【重大利好】卡罗尼亚重工斩获海军战术大单，核心军工股领涨！', stockId: 's1', impact: 1.08, type: 'up' as const },
  { text: '【科技突破】微型齿轮AI发布新一代差分机芯片，引发科技板块暴涨！', stockId: 's6', impact: 1.12, type: 'up' as const },
  { text: '【财报优异】阿米诺斯医药三季度高能恢复液销量创新高，资金大幅流入。', stockId: 's2', impact: 1.06, type: 'up' as const },
  { text: '【家族助力】瓦伦丁机械工坊完成自动化升级，皇家订单续约。', stockId: 's3', impact: 1.05, type: 'up' as const },
  { text: '【气象预警】远洋飞艇航运因极光雾航线受阻，物流板块回调。', stockId: 's4', impact: 0.94, type: 'down' as const },
  { text: '【矿脉大捷】皇家晶石矿业发现高纯度黑金矿区，估值再次飙升！', stockId: 's5', impact: 1.09, type: 'up' as const },
  { text: '【消费旺季】皇家飞雷黑啤进入夏季社交高峰，业绩稳健增长。', stockId: 's7', impact: 1.03, type: 'up' as const },
  { text: '【铁道扩建】皇家铁道获批新干线特许经营权，客流量创历史新高！', stockId: 's8', impact: 1.07, type: 'up' as const },
  { text: '【金融利好】远东联合商业银行三季度息差扩大，派发特别股息！', stockId: 's9', impact: 1.08, type: 'up' as const },
  { text: '【清洁能源】圣米迦勒新能源成功研发极光储能电池，主力抢筹！', stockId: 's10', impact: 1.11, type: 'up' as const },
  { text: '【降准降息】中央银行下调基准利率，流动性充裕资本流入股市！', stockId: '', impact: 1.04, type: 'up' as const },
  { text: '【黑天鹅事件】海峡飓风警报触发，交运与物流板块承压下跌。', stockId: 's4', impact: 0.92, type: 'down' as const },
];

// ---------- 行情推进（每次推进月份时调用） ----------

/** 每推进一个月，股市推进的交易日数（undefined.md 第 4 题：C） */
export const TRADING_DAYS_PER_MONTH = 20;
const MAX_NEWS = 25;

export const STOCK_KEYS = {
  stocks: 'amigo_stocks',
  holdings: 'amigo_stock_holdings',
  tradeLogs: 'amigo_stock_tradelogs',
  news: 'amigo_stock_news',
  tradingDay: 'amigo_stock_tradingday',
  favorites: 'amigo_stock_favorites',
  accountOpened: 'amigo_stock_account_opened',
};

export const INITIAL_NEWS: StockNewsItem[] = [
  {
    id: 'n1',
    title: '【开盘大吉】帝国证券交易所正式开盘！',
    desc: '十大核心工业、科技与金融龙头齐聚，各路资本交投火热。',
    type: 'up',
    time: '交易日 #1',
  },
];

export interface MarketState {
  stocks: StockItem[];
  news: StockNewsItem[];
  tradingDay: number;
}

/** 推进一个交易日（逻辑与原交易所「推演」按钮一致） */
export const advanceOneDay = (state: MarketState, rng: () => number = Math.random): MarketState => {
  const nextDay = state.tradingDay + 1;
  const template = NEWS_TEMPLATES[Math.floor(rng() * NEWS_TEMPLATES.length)];

  const stocks = state.stocks.map((s) => {
    let changeRatio = (rng() - 0.48) * 0.12; // 单日 -6% ~ +6% 随机波动
    if (template.stockId === s.id) changeRatio = template.impact - 1 + (rng() - 0.5) * 0.04;
    const price = Math.max(1, parseFloat((s.price * (1 + changeRatio)).toFixed(2)));
    return {
      ...s,
      prevPrice: s.price,
      price,
      highPrice: Math.max(s.highPrice, price),
      lowPrice: Math.min(s.lowPrice, price),
      history: [...s.history.slice(1), price],
    };
  });

  const newsItem: StockNewsItem = {
    id: `news_${nextDay}`,
    title: template.text,
    desc: `交易日 #${nextDay} 快报：盘面波动率 ${(rng() * 3 + 1).toFixed(1)}%，大盘量能充沛，多空博弈激烈。`,
    type: template.type,
    time: `交易日 #${nextDay}`,
    stockId: template.stockId || undefined,
  };

  return { stocks, news: [newsItem, ...state.news].slice(0, MAX_NEWS), tradingDay: nextDay };
};

export const advanceMarket = (state: MarketState, days: number, rng: () => number = Math.random): MarketState => {
  let next = state;
  for (let i = 0; i < days; i++) next = advanceOneDay(next, rng);
  return next;
};

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const loadMarket = (): MarketState => ({
  stocks: readJson(STOCK_KEYS.stocks, INITIAL_STOCKS),
  news: readJson(STOCK_KEYS.news, INITIAL_NEWS),
  tradingDay: readJson(STOCK_KEYS.tradingDay, 1),
});

export const saveMarket = (state: MarketState) => {
  try {
    localStorage.setItem(STOCK_KEYS.stocks, JSON.stringify(state.stocks));
    localStorage.setItem(STOCK_KEYS.news, JSON.stringify(state.news));
    localStorage.setItem(STOCK_KEYS.tradingDay, String(state.tradingDay));
  } catch {}
};

// ---------- 证券开户资格 ----------
// 只有家族中有人读过金融学或从事过金融相关工作，才能开户炒股。
// - 从事过：玩家曾任金融岗位（就业记录），或配偶职业与金融相关
// - 读过金融学：教育系统尚未实装，暂无途径（以后在此接入学历）

/** 金融相关岗位：交易所代理经纪人（「金融文职」类别中的俄文通译、抄录员不算金融工作） */
export const FINANCE_JOB_IDS = ['j4'];
export const FINANCE_OCCUPATION_KEYWORDS = ['账房', '经纪', '银行', '金融', '证券', '会计'];

export const isFinanceOccupation = (occupation: string | null | undefined) =>
  !!occupation && FINANCE_OCCUPATION_KEYWORDS.some((k) => occupation.includes(k));

export interface FinanceBackgroundInput {
  /** 玩家的就业记录（含当前岗位） */
  jobIds: string[];
  playerName: string;
  /** 家族成员（含配偶、子嗣）的姓名与职业 */
  familyMembers: Array<{ name: string; relation: string; occupation: string }>;
}

/** 返回满足条件的说明（例如「你曾任交易所代理经纪人」），不满足返回 null */
export const findFinanceBackground = (input: FinanceBackgroundInput, jobTitleOf: (id: string) => string | undefined): string | null => {
  const financeJob = input.jobIds.find((id) => FINANCE_JOB_IDS.includes(id));
  if (financeJob) return `${input.playerName}（你）曾任「${jobTitleOf(financeJob) ?? financeJob}」`;
  const member = input.familyMembers.find((m) => isFinanceOccupation(m.occupation));
  if (member) return `${member.relation} ${member.name} 从事「${member.occupation}」`;
  return null;
};
