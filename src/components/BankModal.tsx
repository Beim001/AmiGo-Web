import React, { useState } from 'react';
import { ChevronLeft, Landmark, Wallet, Building, TrendingUp, ChevronRight, AlertTriangle } from 'lucide-react';
import { addLifeLog } from '../lib/lifeLog';
import { BANK_LIST, BankAccounts, loadAccounts, saveAccounts as persistBankAccounts, currentRateEvent, loanRateFor, formatRate } from '../lib/bank';

// 银行：各银行账户存取款、贷款与利率

type BankAccountData = BankAccounts[string];

export const BankModal = ({
  onClose,
  coins,
  setCoins,
  bankDeposit,
  setBankDeposit,
  bankLoan,
  setBankLoan,
  onOpenWealthChart,
  gameYear,
}: {
  onClose: () => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  bankDeposit: number;
  setBankDeposit: React.Dispatch<React.SetStateAction<number>>;
  bankLoan: number;
  setBankLoan: React.Dispatch<React.SetStateAction<number>>;
  onOpenWealthChart?: () => void;
  /** 当前游戏年份：决定贷款利率是否受历史大事件影响 */
  gameYear: number;
}) => {
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'deposit' | 'investment' | 'loan' | 'history'>('deposit');
  const [amountInput, setAmountInput] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 多银行账户数据（读取时会把已归档理财基金的申购本金退回存款）
  const [accounts, setAccounts] = useState<BankAccounts>(() => loadAccounts(bankDeposit, bankLoan));

  // 保存数据并同步总资产
  const saveAccounts = (updated: BankAccounts) => {
    setAccounts(updated);
    const totals = persistBankAccounts(updated);
    setBankDeposit(totals.deposit);
    setBankLoan(totals.loan);
  };

  // 打开时保存一次：落盘退款结果并刷新汇总
  React.useEffect(() => {
    saveAccounts(accounts);
  }, []);

  const rateEvent = currentRateEvent(gameYear);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // 开立新银行账户
  const handleOpenAccount = (bank: typeof BANK_LIST[0]) => {
    if (coins < bank.openFee) {
      showToast(`身上现金不足以支付开户费 (${bank.openFee.toLocaleString()} ₽)！`);
      return;
    }

    if (bank.openFee > 0) {
      setCoins(prev => prev - bank.openFee);
    }

    const randomCard = `${bank.id.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const updated = {
      ...accounts,
      [bank.id]: {
        opened: true,
        cardNo: randomCard,
        deposit: 0,
        loan: 0,
        transactions: [
          { id: Date.now().toString(), type: 'deposit' as const, title: `在 [${bank.shortName}] 开立银航账户`, amount: 0, time: '刚才' }
        ],
      },
    };

    saveAccounts(updated);
    addLifeLog('财富', `在${bank.shortName}开户`, `卡号 ${randomCard}。`);
    showToast(`成功在 [${bank.shortName}] 开户！获得卡号: ${randomCard}`);
    setSelectedBankId(bank.id);
  };

  const currentBank = BANK_LIST.find(b => b.id === selectedBankId);
  const currentAccount = selectedBankId ? accounts[selectedBankId] : null;

  // 增加流水
  const addTransactionForCurrent = (type: 'deposit' | 'withdraw' | 'loan' | 'repay' | 'interest' | 'investment', title: string, amount: number) => {
    if (!selectedBankId || !currentAccount) return;
    const newTx = {
      id: Date.now().toString(),
      type,
      title,
      amount,
      time: '刚才',
    };
    const updated = {
      ...accounts,
      [selectedBankId]: {
        ...currentAccount,
        transactions: [newTx, ...(currentAccount.transactions || [])],
      },
    };
    saveAccounts(updated);
  };

  // 存款处理
  const handleDeposit = () => {
    if (!selectedBankId || !currentAccount) return;
    const val = parseInt(amountInput, 10);
    if (isNaN(val) || val <= 0) {
      showToast('请输入有效的存款金额');
      return;
    }
    if (val > coins) {
      showToast('身上现金不足！');
      return;
    }

    setCoins(prev => prev - val);
    const updated = {
      ...accounts,
      [selectedBankId]: {
        ...currentAccount,
        deposit: currentAccount.deposit + val,
        transactions: [
          { id: Date.now().toString(), type: 'deposit' as const, title: `存入 [${currentBank?.shortName}]`, amount: val, time: '刚才' },
          ...(currentAccount.transactions || [])
        ],
      },
    };
    saveAccounts(updated);
    setAmountInput('');
    showToast(`成功存入 ${val.toLocaleString()} ₽ 储蓄金！`);
  };

  // 取款处理
  const handleWithdraw = () => {
    if (!selectedBankId || !currentAccount) return;
    const val = parseInt(amountInput, 10);
    if (isNaN(val) || val <= 0) {
      showToast('请输入有效的取款金额');
      return;
    }
    if (val > currentAccount.deposit) {
      showToast('该银行账户储蓄余额不足！');
      return;
    }

    const updated = {
      ...accounts,
      [selectedBankId]: {
        ...currentAccount,
        deposit: currentAccount.deposit - val,
        transactions: [
          { id: Date.now().toString(), type: 'withdraw' as const, title: `从 [${currentBank?.shortName}] 支取现金`, amount: -val, time: '刚才' },
          ...(currentAccount.transactions || [])
        ],
      },
    };
    saveAccounts(updated);
    setCoins(prev => prev + val);
    setAmountInput('');
    showToast(`成功支取 ${val.toLocaleString()} ₽ 现金！`);
  };

  // 申请贷款
  const handleApplyLoan = (loanAmount: number) => {
    if (!selectedBankId || !currentAccount || !currentBank) return;
    if (currentAccount.loan + loanAmount > currentBank.maxLoan) {
      showToast(`超出本行最高信贷额度 (${currentBank.maxLoan.toLocaleString()} ₽)！`);
      return;
    }

    const updated = {
      ...accounts,
      [selectedBankId]: {
        ...currentAccount,
        loan: currentAccount.loan + loanAmount,
        transactions: [
          { id: Date.now().toString(), type: 'loan' as const, title: `申请 [${currentBank.shortName}] 信贷放款`, amount: loanAmount, time: '刚才' },
          ...(currentAccount.transactions || [])
        ],
      },
    };
    saveAccounts(updated);
    setCoins(prev => prev + loanAmount);
    if (loanAmount >= 100000) addLifeLog('财富', `向${currentBank.shortName}贷款`, `借入 ${loanAmount.toLocaleString()} ₽。`);
    showToast(`成功贷款 ${loanAmount.toLocaleString()} ₽，资金已入账！`);
  };

  // 归还贷款
  const handleRepayLoan = () => {
    if (!selectedBankId || !currentAccount || !currentBank) return;
    const val = parseInt(amountInput, 10);
    if (isNaN(val) || val <= 0) {
      showToast('请输入有效的还款金额');
      return;
    }
    if (val > coins) {
      showToast('现金不足，无法还款！');
      return;
    }
    const repayVal = Math.min(val, currentAccount.loan);
    if (repayVal <= 0) {
      showToast('本行当前没有待还贷款！');
      return;
    }

    setCoins(prev => prev - repayVal);
    const updated = {
      ...accounts,
      [selectedBankId]: {
        ...currentAccount,
        loan: currentAccount.loan - repayVal,
        transactions: [
          { id: Date.now().toString(), type: 'repay' as const, title: `归还 [${currentBank.shortName}] 信贷欠款`, amount: -repayVal, time: '刚才' },
          ...(currentAccount.transactions || [])
        ],
      },
    };
    saveAccounts(updated);
    setAmountInput('');
    showToast(`成功归还贷款 ${repayVal.toLocaleString()} ₽！`);
  };

  // 计算多账户总资产
  const accountList = Object.values(accounts) as BankAccountData[];
  const totalDepositAll = accountList.reduce((acc, curr) => acc + (curr.opened ? curr.deposit : 0), 0);
  const totalLoanAll = accountList.reduce((acc, curr) => acc + (curr.opened ? curr.loan : 0), 0);
  const openedBankCount = accountList.filter(a => a.opened).length;

  return (
    <div className="absolute inset-0 bg-[#252632] flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-200 overflow-hidden text-white">
      {toastMsg && (
        <div className="absolute top-22 left-1/2 -translate-x-1/2 z-50 bg-black/95 text-yellow-300 border-2 border-yellow-500 text-xs font-black px-4 py-2 rounded-xl shadow-[0_4px_0_#000] animate-in fade-in slide-in-from-top-2 duration-200 text-center max-w-[85%]">
          {toastMsg}
        </div>
      )}

      {/* 帝国银行业顶栏 (Imperial Bank Vault Header) */}
      <div className="relative w-full h-16 bg-[#181a24] border-b-2 border-black shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20 flex items-center justify-between px-4 flex-shrink-0">
        {/* 左侧返回/切换按钮 */}
        <button
          onClick={selectedBankId ? () => setSelectedBankId(null) : onClose}
          className="p-2 bg-[#2d2f3d] hover:bg-[#383b4e] border-2 border-black rounded-xl active:translate-y-0.5 shadow-[0_2px_0_#000] cursor-pointer text-white flex items-center justify-center transition-all z-10"
        >
          <ChevronLeft size={20} className="text-white drop-shadow" strokeWidth={3} />
        </button>

        {/* 中央银行金库牌匾 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-12">
          <div className="bg-[#232635] border-2 border-amber-500/70 px-4 py-1.5 rounded-xl shadow-[0_3px_0_#000] flex items-center gap-2 max-w-[85%]">
            <Landmark size={18} className="text-amber-400 flex-shrink-0" />
            <span className="text-amber-300 text-xs sm:text-sm font-black tracking-wider truncate">
              {currentBank ? currentBank.shortName : '银行'}
            </span>
          </div>
        </div>

        {/* 右侧占位保持对称 */}
        <div className="w-9 z-10" />
      </div>

      {/* 主体区 */}
      <div className="flex-1 overflow-y-auto pb-6 pt-5 px-4 space-y-4">

        {/* 1. 银行选择大厅视图 (当未选择具体银行时) */}
        {!selectedBankId ? (
          <div className="space-y-4">
            {/* 总体资产卡片 */}
            <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] relative">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-yellow-400 font-bold flex items-center gap-1">
                    <Wallet size={14} /> 全域银行资产 (储蓄总额 + 现金)
                  </div>
                  <div className="text-white font-black text-2xl mt-1 tracking-wider font-mono">
                    {(coins + totalDepositAll).toLocaleString()} <span className="text-sm font-bold text-yellow-400">₽</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded border border-black shadow-[0_1px_0_#000]">
                    已开立 {openedBankCount} / {BANK_LIST.length} 家银航
                  </span>
                  {onOpenWealthChart && (
                    <button
                      onClick={onOpenWealthChart}
                      className="bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/50 text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                    >
                      <span>📊 个人资产全景</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-700/80 text-xs">
                <div className="bg-[#21232e] p-2 rounded-xl border border-black">
                  <span className="text-gray-400 text-[10px] block font-bold">身上现金</span>
                  <span className="text-yellow-400 font-black font-mono text-xs">{coins.toLocaleString()} ₽</span>
                </div>
                <div className="bg-[#21232e] p-2 rounded-xl border border-black">
                  <span className="text-gray-400 text-[10px] block font-bold">存款总额</span>
                  <span className="text-emerald-400 font-black font-mono text-xs">{totalDepositAll.toLocaleString()} ₽</span>
                </div>
                <div className="bg-[#21232e] p-2 rounded-xl border border-black">
                  <span className="text-gray-400 text-[10px] block font-bold">贷款总欠款</span>
                  <span className="text-red-400 font-black font-mono text-xs">{totalLoanAll.toLocaleString()} ₽</span>
                </div>
              </div>
            </div>

            {rateEvent && (
              <div className="bg-red-950/70 border-2 border-red-500/60 rounded-2xl p-3 text-xs shadow-[0_3px_0_#000]">
                <div className="text-red-300 font-black flex items-center gap-1.5">
                  <AlertTriangle size={14} /> 时局：{rateEvent.title}（{rateEvent.fromYear}–{rateEvent.toYear}）
                </div>
                <p className="text-red-200/80 font-bold mt-1 leading-relaxed">
                  {rateEvent.desc}各银行贷款年利率上浮 {formatRate(rateEvent.loanRateDelta)}。
                </p>
              </div>
            )}

            <div className="text-xs font-black text-yellow-400 flex items-center gap-1.5 px-1">
              <Building size={16} className="text-amber-400" /> 选择银行办理业务或开立新账户：
            </div>

            {/* 4 家银行列表 */}
            <div className="space-y-3">
              {BANK_LIST.map((bank) => {
                const acc = accounts[bank.id];
                const isOpened = acc && acc.opened;

                return (
                  <div
                    key={bank.id}
                    className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] relative overflow-hidden transition-all hover:bg-[#343747]"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-black text-sm">{bank.name}</h3>
                        </div>
                        <p className="text-gray-300 text-[11px] leading-relaxed max-w-[90%]">{bank.desc}</p>
                      </div>

                      <span className="bg-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded border border-black shrink-0">
                        {bank.badge}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-700/80 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-400 font-black flex items-center gap-1">
                          <TrendingUp size={14} /> {bank.rate}
                        </span>
                        <span className={`font-black text-[11px] ${rateEvent ? 'text-red-400' : 'text-gray-400'}`}>
                          贷款 {formatRate(loanRateFor(bank, gameYear))}
                        </span>
                        {isOpened && (
                          <span className="text-amber-300 font-mono text-[11px] font-bold">
                            卡号: {acc.cardNo}
                          </span>
                        )}
                      </div>

                      {isOpened ? (
                        <button
                          onClick={() => {
                            setSelectedBankId(bank.id);
                            setActiveTab('deposit');
                          }}
                          className="bg-amber-400 hover:bg-yellow-300 text-black font-black text-xs px-3.5 py-1.5 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer flex items-center gap-1 active:translate-y-0.5"
                        >
                          <span>进入银行</span>
                          <ChevronRight size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenAccount(bank)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs px-3.5 py-1.5 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer active:translate-y-0.5"
                        >
                          {bank.openFee === 0 ? '免费开立账户' : `开立账户 (${(bank.openFee/1000).toFixed(0)}k ₽)`}
                        </button>
                      )}
                    </div>

                    {isOpened && (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] bg-[#21232e] p-2 rounded-xl border border-black">
                        <div className="text-gray-300">
                          存款余额: <span className="text-emerald-400 font-mono font-bold">{acc.deposit.toLocaleString()} ₽</span>
                        </div>
                        <div className="text-gray-300">
                          信贷欠款: <span className="text-red-400 font-mono font-bold">{acc.loan.toLocaleString()} ₽</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* 2. 具体银行操作面板 (当选中某家银行时) */
          <div className="space-y-4">
            {/* 选中银行专属卡片 */}
            <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] relative">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-yellow-400 font-black flex items-center gap-1">
                    <Building size={14} /> {currentBank?.name}
                  </div>
                  <div className="text-white font-mono text-[11px] font-bold mt-0.5 text-gray-300">
                    账户卡号：{currentAccount?.cardNo}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBankId(null)}
                  className="bg-[#21232e] text-yellow-300 hover:text-white text-[10px] font-black px-2.5 py-1 rounded-lg border border-black cursor-pointer shadow-[0_1px_0_#000]"
                >
                  切换银行
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-700/80 text-xs">
                <div className="bg-[#21232e] p-2 rounded-xl border border-black">
                  <span className="text-gray-300 text-[10px] block font-bold">本行定期储蓄</span>
                  <span className="text-emerald-400 font-black font-mono text-sm">
                    {currentAccount?.deposit.toLocaleString()} ₽
                  </span>
                </div>
                <div className="bg-[#21232e] p-2 rounded-xl border border-black">
                  <span className="text-gray-300 text-[10px] block font-bold">本行信贷欠款</span>
                  <span className="text-red-400 font-black font-mono text-sm">
                    {currentAccount?.loan.toLocaleString()} ₽
                  </span>
                </div>
              </div>
            </div>

            {/* 标签栏 */}
            <div className="grid grid-cols-3 bg-[#21232e] p-1 rounded-xl border-2 border-black gap-1 shadow-[0_2px_0_#000]">
              <button
                onClick={() => setActiveTab('deposit')}
                className={`py-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer truncate ${
                  activeTab === 'deposit'
                    ? 'bg-amber-400 text-black border-black shadow-[0_1px_0_#000]'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                存款业务
              </button>
              <button
                onClick={() => setActiveTab('loan')}
                className={`py-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer truncate ${
                  activeTab === 'loan'
                    ? 'bg-amber-400 text-black border-black shadow-[0_1px_0_#000]'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                信贷借还
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer truncate ${
                  activeTab === 'history'
                    ? 'bg-amber-400 text-black border-black shadow-[0_1px_0_#000]'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                账户流水
              </button>
            </div>

            {/* 存款面板 */}
            {activeTab === 'deposit' && (
              <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-4">
                <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                  <span className="text-white font-black text-xs flex items-center gap-1.5">
                    <Landmark size={16} className="text-yellow-400" /> {currentBank?.shortName} 存款专区
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-600">
                    {currentBank?.rate}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-300 font-bold">
                    <span>办理金额：</span>
                    <span className="text-amber-300">身上现金: {coins.toLocaleString()} ₽</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="请输入金额"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="flex-1 bg-[#1b1c25] text-white font-black text-sm px-3 py-2 rounded-xl border-2 border-black focus:border-yellow-400 focus:outline-none font-mono"
                    />
                    <button
                      onClick={() => setAmountInput(coins.toString())}
                      className="bg-gray-700 hover:bg-gray-600 text-yellow-300 font-black text-xs px-3 rounded-xl border-2 border-black cursor-pointer shadow-[0_2px_0_#000]"
                    >
                      全部现金
                    </button>
                  </div>

                  <div className="flex gap-2 pt-1">
                    {[10000, 50000, 100000, 500000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setAmountInput(amt.toString())}
                        className="flex-1 bg-[#21232e] hover:bg-[#2e3142] text-gray-200 font-black text-[10px] py-1.5 rounded-lg border border-black cursor-pointer"
                      >
                        +{(amt / 10000)}万
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleDeposit}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-black py-3 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>存入本行</span>
                  </button>
                  <button
                    onClick={handleWithdraw}
                    className="bg-amber-400 hover:bg-amber-300 text-black font-black py-3 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>提取现金</span>
                  </button>
                </div>
              </div>
            )}

            {/* 信贷借还 */}
            {activeTab === 'loan' && (
              <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-4">
                <div className="bg-[#21232e] p-3 rounded-xl border border-black space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-bold">本行已借贷款：</span>
                    <span className="text-red-400 font-black font-mono">{currentAccount?.loan.toLocaleString()} ₽</span>
                  </div>
                  {currentBank && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400 font-bold">当前贷款年利率：</span>
                      <span className={`font-black font-mono ${rateEvent ? 'text-red-400' : 'text-amber-300'}`}>
                        {formatRate(loanRateFor(currentBank, gameYear))}
                        {rateEvent ? `（${rateEvent.title} +${formatRate(rateEvent.loanRateDelta)}）` : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="font-bold">利息每月结算：现金不足先扣本行存款，再不足计入本金</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-bold">本行剩余可用额度：</span>
                    <span className="text-emerald-400 font-black font-mono">
                      {Math.max(0, (currentBank?.maxLoan || 1000000) - (currentAccount?.loan || 0)).toLocaleString()} ₽
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-gray-300 text-xs font-bold block">快捷申请信贷：</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[50000, 200000, 500000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => handleApplyLoan(amt)}
                        className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs py-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer"
                      >
                        贷款 {(amt / 10000)}万 ₽
                      </button>
                    ))}
                  </div>
                </div>

                {currentAccount && currentAccount.loan > 0 && (
                  <div className="pt-2 border-t border-gray-700/80 space-y-2">
                    <label className="text-gray-300 text-xs font-bold block">归还本行贷款：</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="输入还款金额"
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        className="flex-1 bg-[#1b1c25] text-white font-black text-xs px-3 py-2 rounded-xl border-2 border-black focus:border-yellow-400 focus:outline-none font-mono"
                      />
                      <button
                        onClick={handleRepayLoan}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs px-4 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer"
                      >
                        归还欠款
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 交易明细 */}
            {activeTab === 'history' && (
              <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3 shadow-[0_4px_0_#000] space-y-2">
                <div className="text-white font-black text-xs border-b border-gray-700 pb-2 flex items-center justify-between">
                  <span>{currentBank?.shortName} 交易流水记录</span>
                  <span className="text-gray-400 text-[10px]">共 {currentAccount?.transactions?.length || 0} 条</span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {currentAccount?.transactions?.map((tx) => (
                    <div key={tx.id} className="bg-[#21232e] border border-black rounded-xl p-2.5 flex items-center justify-between">
                      <div>
                        <div className="text-white font-black text-xs">{tx.title}</div>
                        <div className="text-gray-400 text-[10px] font-mono mt-0.5">{tx.time}</div>
                      </div>
                      <div className={`font-black font-mono text-xs ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.amount >= 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()} ₽
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
