import { CURRENCY } from '../data/seasons';
// 银行：银行列表、利率、历史大事件对贷款利率的影响，以及每月利息结算（纯函数，便于测试）
//
// 决定见 undefined.md 第 5 题：
// - 存款按年利率 ÷ 12 每月计息，直接计入该行存款，并记一笔「利息」流水（复利）
// - 贷款按年利率 ÷ 12 每月计息：先从现金扣；现金不足从该行存款扣；仍不足则计入贷款本金
// - 贷款利率随历史大事件上浮（事件依据阿米诺斯维基「卡罗尼亚帝国」条目）
// 理财基金已归档（第 7 题），旧存档中申购过的金额在读取账户时一次性退回存款。

export const BANK_ACCOUNTS_KEY = 'amigo_multi_bank_accounts_v1';

export interface BankInfo {
  id: string;
  name: string;
  shortName: string;
  type: string;
  rate: string;
  /** 存款年利率；[最低, 最高] 表示每月在区间内随机浮动 */
  depositRate: number | [number, number];
  /** 贷款基准年利率（未含大事件上浮） */
  loanRate: number;
  maxLoan: number;
  openFee: number;
  badge: string;
  desc: string;
}

export const BANK_LIST: BankInfo[] = [
  {
    id: 'aminoac',
    name: 'Bank Of Aminoac（阿米诺斯银行）',
    shortName: 'Bank Of Aminoac',
    type: '商业巨头',
    rate: '4.8% 活期年化',
    depositRate: 0.048,
    loanRate: 0.08,
    maxLoan: 1000000,
    openFee: 0,
    badge: '免开户费',
    desc: '阿米诺斯帝国商业与民用核心银行，资金结算迅捷，提供灵活资金周转。',
  },
  {
    id: 'aminoac_savings',
    name: '阿米诺斯储蓄银行',
    shortName: '阿米诺斯储蓄银行',
    type: '官方储蓄',
    rate: '5.8% 定期年化',
    depositRate: 0.058,
    loanRate: 0.09,
    maxLoan: 500000,
    openFee: 1000,
    badge: '保本保息',
    desc: '由阿米诺斯皇家财政部直辖担保，专精定期沉淀储蓄与稳健长效回报。',
  },
  {
    id: 'russia_invest',
    name: '俄罗斯投资银行',
    shortName: '俄罗斯投资银行',
    type: '资本投资',
    rate: '8.5%~16% 浮动',
    depositRate: [0.085, 0.16],
    loanRate: 0.14,
    maxLoan: 3000000,
    openFee: 10000,
    badge: '高额信贷',
    desc: '跨国重工业与能源风险投资银团，提供高额信用借贷。',
  },
  {
    id: 'joint_bank',
    name: 'Совместный банк России и Аминоас诺汇银行',
    shortName: '俄罗斯与阿米诺斯联合银行',
    type: '跨国银团',
    rate: '12.0% 尊享年化',
    depositRate: 0.12,
    loanRate: 0.16,
    maxLoan: 10000000,
    openFee: 50000,
    badge: 'VIP尊享',
    desc: '俄阿两国超级财团联合创立，VIP黑卡通道，享有极高利息与千万信贷。',
  },
];

// ---------- 历史大事件 → 贷款利率上浮 ----------

export interface RateEvent {
  title: string;
  desc: string;
  /** 起止年份（含） */
  fromYear: number;
  toYear: number;
  /** 贷款年利率上浮，例如 0.02 = +2 个百分点 */
  loanRateDelta: number;
}

export const RATE_EVENTS: RateEvent[] = [
  { title: '格纳提斯运动', desc: '俄国驻厅和总督遇刺，十万余人参与的运动遭镇压，银根收紧。', fromYear: 1878, toYear: 1879, loanRateDelta: 0.02 },
  { title: '神鹰军大起义', desc: '神鹰军发动大起义，俄国出兵干涉，战事推高借贷成本。', fromYear: 1880, toYear: 1881, loanRateDelta: 0.04 },
  { title: '1905 年起义', desc: '受俄国革命影响再度爆发起义，金融市场动荡。', fromYear: 1905, toYear: 1906, loanRateDelta: 0.03 },
  { title: '第一次世界大战', desc: '卡罗尼亚仆从军随俄军出征奥斯曼东线，战时财政吃紧。', fromYear: 1914, toYear: 1916, loanRateDelta: 0.05 },
  { title: '俄国崩溃与帝国末日', desc: '俄国革命崩溃，失去宗主国支撑的帝国财政濒临破产。', fromYear: 1917, toYear: 1920, loanRateDelta: 0.08 },
];

export const currentRateEvent = (year: number): RateEvent | null =>
  RATE_EVENTS.find((e) => year >= e.fromYear && year <= e.toYear) ?? null;

export const loanRateFor = (bank: BankInfo, year: number): number => bank.loanRate + (currentRateEvent(year)?.loanRateDelta ?? 0);

export const depositRateFor = (bank: BankInfo, rng: () => number = Math.random): number =>
  Array.isArray(bank.depositRate) ? bank.depositRate[0] + rng() * (bank.depositRate[1] - bank.depositRate[0]) : bank.depositRate;

export const formatRate = (rate: number) => `${(rate * 100).toFixed(1)}%`;

// ---------- 账户数据 ----------

export type BankTxType = 'deposit' | 'withdraw' | 'loan' | 'repay' | 'interest' | 'investment' | 'refund';

export interface BankTransaction {
  id: string;
  type: BankTxType;
  title: string;
  amount: number;
  time: string;
  /** 理财基金归档时已退款 */
  refunded?: boolean;
}

export interface BankAccountData {
  opened: boolean;
  cardNo: string;
  deposit: number;
  loan: number;
  transactions: BankTransaction[];
}

export type BankAccounts = Record<string, BankAccountData>;

/** 新存档的默认账户：默认开通 Bank Of Aminoac，并继承旧版的存贷款数据 */
export const buildDefaultAccounts = (bankDeposit: number, bankLoan: number): BankAccounts => ({
  aminoac: {
    opened: true,
    cardNo: 'AMN-8801-9214',
    deposit: bankDeposit,
    loan: bankLoan,
    transactions: bankDeposit > 0 ? [{ id: 'init', type: 'deposit', title: '存入Bank Of Aminoac储蓄金', amount: bankDeposit, time: '开户' }] : [],
  },
  aminoac_savings: { opened: false, cardNo: 'AMN-SAV-1029', deposit: 0, loan: 0, transactions: [] },
  russia_invest: { opened: false, cardNo: 'RUS-INV-7731', deposit: 0, loan: 0, transactions: [] },
  joint_bank: { opened: false, cardNo: 'RUS-AMN-9988', deposit: 0, loan: 0, transactions: [] },
});

/** 理财基金已归档：把旧存档中未退款的申购金额一次性退回该行存款 */
export const refundArchivedFunds = (accounts: BankAccounts): { accounts: BankAccounts; refunded: number } => {
  let refunded = 0;
  const next: BankAccounts = {};
  for (const [id, acc] of Object.entries(accounts)) {
    const pending = (acc.transactions || []).filter((t) => t.type === 'investment' && !t.refunded);
    const amount = pending.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    if (amount <= 0) {
      next[id] = acc;
      continue;
    }
    refunded += amount;
    next[id] = {
      ...acc,
      deposit: acc.deposit + amount,
      transactions: [
        { id: `refund_${id}`, type: 'refund', title: '理财基金停办，申购本金退回存款', amount, time: '系统' },
        ...acc.transactions.map((t) => (t.type === 'investment' ? { ...t, refunded: true } : t)),
      ],
    };
  }
  return { accounts: next, refunded };
};

export const loadAccounts = (bankDeposit: number, bankLoan: number): BankAccounts => {
  let accounts: BankAccounts | null = null;
  try {
    const saved = localStorage.getItem(BANK_ACCOUNTS_KEY);
    if (saved) accounts = JSON.parse(saved);
  } catch {}
  return refundArchivedFunds(accounts ?? buildDefaultAccounts(bankDeposit, bankLoan)).accounts;
};

export const totalsOf = (accounts: BankAccounts) =>
  Object.values(accounts).reduce(
    (t, acc) => (acc.opened ? { deposit: t.deposit + acc.deposit, loan: t.loan + acc.loan } : t),
    { deposit: 0, loan: 0 },
  );

/** 保存账户，并同步两个汇总键（资产全景、旧版代码读取） */
export const saveAccounts = (accounts: BankAccounts) => {
  const totals = totalsOf(accounts);
  try {
    localStorage.setItem(BANK_ACCOUNTS_KEY, JSON.stringify(accounts));
    localStorage.setItem('amigo_bank_deposit', String(totals.deposit));
    localStorage.setItem('amigo_bank_loan', String(totals.loan));
  } catch {}
  return totals;
};

// ---------- 每月利息结算 ----------

export interface InterestSettlement {
  accounts: BankAccounts;
  /** 从现金中扣除的贷款利息（正数） */
  cashPaid: number;
  depositInterest: number;
  loanInterest: number;
  /** 现金与存款都不足、计入本金的利息 */
  capitalized: number;
  event: RateEvent | null;
}

export const settleMonthlyInterest = (
  accounts: BankAccounts,
  cash: number,
  year: number,
  month: number,
  rng: () => number = Math.random,
  /** 存款利息倍数（「精明」特质为 1.2） */
  depositMultiplier = 1,
): InterestSettlement => {
  let cashLeft = Math.max(0, cash);
  let cashPaid = 0;
  let depositInterest = 0;
  let loanInterest = 0;
  let capitalized = 0;
  const time = `${year}.${month < 10 ? '0' + month : month}`;
  const next: BankAccounts = {};

  for (const bank of BANK_LIST) {
    const acc = accounts[bank.id];
    if (!acc) continue;
    if (!acc.opened) {
      next[bank.id] = acc;
      continue;
    }
    let deposit = acc.deposit;
    let loan = acc.loan;
    const txs: BankTransaction[] = [];

    const dInt = Math.round((deposit * depositRateFor(bank, rng) * depositMultiplier) / 12);
    if (dInt > 0) {
      deposit += dInt;
      depositInterest += dInt;
      txs.push({ id: `int_${bank.id}_${time}`, type: 'interest', title: '存款利息结算', amount: dInt, time });
    }

    const lInt = Math.round((loan * loanRateFor(bank, year)) / 12);
    if (lInt > 0) {
      loanInterest += lInt;
      let remaining = lInt;
      const fromCash = Math.min(cashLeft, remaining);
      cashLeft -= fromCash;
      cashPaid += fromCash;
      remaining -= fromCash;
      const fromDeposit = Math.min(deposit, remaining);
      deposit -= fromDeposit;
      remaining -= fromDeposit;
      loan += remaining;
      capitalized += remaining;
      txs.push({
        id: `loanint_${bank.id}_${time}`,
        type: 'repay',
        title: remaining > 0 ? `贷款利息（${remaining.toLocaleString()} ${CURRENCY.symbol} 无力支付，计入本金）` : '贷款利息扣款',
        amount: -lInt,
        time,
      });
    }

    next[bank.id] = { ...acc, deposit, loan, transactions: [...txs, ...acc.transactions].slice(0, 200) };
  }
  // 保留不在列表中的未知账户
  for (const [id, acc] of Object.entries(accounts)) if (!next[id]) next[id] = acc;

  return { accounts: next, cashPaid, depositInterest, loanInterest, capitalized, event: currentRateEvent(year) };
};
