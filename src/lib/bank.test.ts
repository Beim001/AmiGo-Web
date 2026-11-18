import { describe, expect, it } from 'vitest';
import { BANK_LIST, BankAccounts, buildDefaultAccounts, loanRateFor, refundArchivedFunds, settleMonthlyInterest } from './bank';

const MAIN = BANK_LIST[0];
const QUIET_YEAR = 1870;

/** 只开主银行账户、只有贷款，便于单独观察贷款利息的扣款顺序 */
const withLoan = (loan: number, deposit = 0): BankAccounts => {
  const accounts = buildDefaultAccounts(0, loan);
  accounts[MAIN.id] = { ...accounts[MAIN.id], deposit, transactions: [] };
  return accounts;
};
const monthlyLoanInterest = (loan: number, year = QUIET_YEAR) => Math.round((loan * loanRateFor(MAIN, year)) / 12);

describe('每月贷款利息', () => {
  it('优先从现金扣款', () => {
    const interest = monthlyLoanInterest(120_000);
    const r = settleMonthlyInterest(withLoan(120_000), interest * 10, QUIET_YEAR, 1);
    expect(r.cashPaid).toBe(interest);
    expect(r.capitalized).toBe(0);
    expect(r.accounts[MAIN.id].loan).toBe(120_000);
  });

  it('现金不足时用存款补足，存款也不足的部分计入贷款本金', () => {
    const interest = monthlyLoanInterest(120_000);
    const cash = Math.floor(interest / 3);
    const deposit = Math.floor(interest / 3);
    const r = settleMonthlyInterest(withLoan(120_000, deposit), cash, QUIET_YEAR, 1);
    const fromDeposit = deposit + r.depositInterest;

    expect(r.cashPaid).toBe(cash);
    expect(r.accounts[MAIN.id].deposit).toBe(0);
    expect(r.capitalized).toBe(interest - cash - fromDeposit);
    expect(r.accounts[MAIN.id].loan).toBe(120_000 + r.capitalized);
  });

  it('历史大事件期间贷款利息上浮', () => {
    const quiet = settleMonthlyInterest(withLoan(120_000), 1e9, QUIET_YEAR, 1);
    const crisis = settleMonthlyInterest(withLoan(120_000), 1e9, 1880, 1);
    expect(crisis.loanInterest).toBeGreaterThan(quiet.loanInterest);
    expect(crisis.event).not.toBeNull();
    expect(quiet.event).toBeNull();
  });

  it('未开户的账户不结算利息', () => {
    const accounts = withLoan(0);
    const closed = Object.keys(accounts).find((id) => !accounts[id].opened)!;
    accounts[closed] = { ...accounts[closed], deposit: 100_000, loan: 100_000 };
    const r = settleMonthlyInterest(accounts, 0, QUIET_YEAR, 1);
    expect(r.accounts[closed]).toBe(accounts[closed]);
  });
});

describe('存款利息', () => {
  it('「精明」特质的倍数会提高存款利息', () => {
    const accounts = withLoan(0, 1_000_000);
    const normal = settleMonthlyInterest(accounts, 0, QUIET_YEAR, 1, () => 0.5, 1);
    const shrewd = settleMonthlyInterest(accounts, 0, QUIET_YEAR, 1, () => 0.5, 1.2);
    expect(shrewd.depositInterest).toBeGreaterThan(normal.depositInterest);
    expect(normal.accounts[MAIN.id].deposit).toBe(1_000_000 + normal.depositInterest);
  });
});

describe('理财基金归档退款', () => {
  it('未退款的申购本金退回存款，且只退一次', () => {
    const accounts = withLoan(0, 1000);
    accounts[MAIN.id].transactions = [{ id: 'inv', type: 'investment', title: '申购', amount: -5000, time: '1871.01' }];

    const once = refundArchivedFunds(accounts);
    const twice = refundArchivedFunds(once.accounts);

    expect(once.refunded).toBe(5000);
    expect(once.accounts[MAIN.id].deposit).toBe(6000);
    expect(twice.refunded).toBe(0);
    expect(twice.accounts[MAIN.id].deposit).toBe(6000);
  });
});
