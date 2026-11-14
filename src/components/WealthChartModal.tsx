import React, { useState } from 'react';
import {
  ChevronLeft,
  PieChart as PieChartIcon,
  Coins,
  Landmark,
  TrendingUp,
  ArrowRight,
  Wallet,
  Sparkles,
  Home,
  ShieldCheck,
  CircleDollarSign,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Building2,
  Receipt,
  Scale,
  Award,
  AlertCircle,
  HelpCircle,
  BarChart3,
  Flame,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export interface AssetBreakdown {
  name: string;
  key: 'cash' | 'savings' | 'stocks' | 'housing';
  value: number;
  color: string;
  percentage: number;
  icon: any;
  desc: string;
  secondaryInfo: string;
}

export interface WealthChartModalProps {
  onClose: () => void;
  coins: number;
  bankDeposit: number;
  bankLoan?: number;
  onOpenBank?: () => void;
  onOpenStock?: () => void;
  onOpenHousing?: () => void;
}

const COLORS = {
  cash: '#f59e0b',    // 琥珀金 / 现金
  savings: '#3b82f6', // 银行蓝 / 储蓄
  stocks: '#10b981',  // 股市绿 / 证券
  housing: '#d97706', // 琥珀棕 / 不动产
  debt: '#ef4444',    // 债务红
};

export const WealthChartModal: React.FC<WealthChartModalProps> = ({
  onClose,
  coins,
  bankDeposit,
  bankLoan = 0,
  onOpenBank,
  onOpenStock,
  onOpenHousing,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'cashflow' | 'analysis'>('overview');
  const [selectedAssetKey, setSelectedAssetKey] = useState<string | null>(null);

  // 1. 获取银行总储蓄与负债（兼容多银行体系）
  let totalDeposit = bankDeposit;
  let totalLoan = bankLoan;
  let openedBankCount = 1;
  try {
    const savedAccs = localStorage.getItem('amigo_multi_bank_accounts_v1');
    if (savedAccs) {
      const accs = JSON.parse(savedAccs);
      let sumDep = 0;
      let sumLoan = 0;
      let count = 0;
      Object.values(accs).forEach((a: any) => {
        if (a && a.opened) {
          sumDep += (a.deposit || 0);
          sumLoan += (a.loan || 0);
          count++;
        }
      });
      if (count > 0) {
        totalDeposit = sumDep;
        totalLoan = sumLoan;
        openedBankCount = count;
      }
    }
  } catch (e) {}

  // 2. 获取股票持仓总市值与浮盈
  let stockMarketValue = 0;
  let stockCostValue = 0;
  let holdingStockCount = 0;
  try {
    const savedStocks = localStorage.getItem('amigo_stocks');
    const savedHoldings = localStorage.getItem('amigo_stock_holdings');
    const stocks = savedStocks ? JSON.parse(savedStocks) : null;
    const holdings = savedHoldings ? JSON.parse(savedHoldings) : [];
    if (Array.isArray(holdings)) {
      holdingStockCount = holdings.length;
      holdings.forEach((h: any) => {
        const s = Array.isArray(stocks) ? stocks.find((item: any) => item.id === h.stockId) : null;
        const price = s ? s.price : (h.avgCost || 0);
        stockMarketValue += (h.shares || 0) * price;
        stockCostValue += (h.shares || 0) * (h.avgCost || price);
      });
    }
  } catch (e) {}
  const stockProfitLoss = stockMarketValue - stockCostValue;

  // 3. 获取持有不动产总市值与租金收益
  let housingMarketValue = 0;
  let propertyCount = 0;
  let rentedOutCount = 0;
  let monthlyRentalIncome = 0;
  try {
    const savedProps = localStorage.getItem('amigo_owned_properties');
    if (savedProps) {
      const props = JSON.parse(savedProps);
      if (Array.isArray(props)) {
        propertyCount = props.length;
        props.forEach((p: any) => {
          housingMarketValue += (p.currentValue || p.purchasePrice || 0);
          if (p.isRentedOut && p.rentPerMonth > 0) {
            rentedOutCount++;
            monthlyRentalIncome += p.rentPerMonth;
          }
        });
      }
    }
  } catch (e) {}

  // 4. 获取当前租住支出
  let monthlyRentExpense = 0;
  try {
    const savedRental = localStorage.getItem('amigo_current_rental');
    if (savedRental) {
      const rental = JSON.parse(savedRental);
      if (rental && rental.monthlyRent) {
        monthlyRentExpense = rental.monthlyRent;
      }
    }
  } catch (e) {}

  // 5. 计算净资产总额与各项占比
  const grossAssets = coins + totalDeposit + stockMarketValue + housingMarketValue;
  const totalNetWorth = Math.max(0, grossAssets - totalLoan);
  const totalWealthForPct = Math.max(1, grossAssets);

  const rawData: AssetBreakdown[] = [
    {
      name: '现金资产',
      key: 'cash',
      value: coins,
      color: COLORS.cash,
      percentage: Number(((coins / totalWealthForPct) * 100).toFixed(1)),
      icon: Coins,
      desc: '随身随时可自由支配现金',
      secondaryInfo: '即时流动性 100%',
    },
    {
      name: '银行储蓄',
      key: 'savings',
      value: totalDeposit,
      color: COLORS.savings,
      percentage: Number(((totalDeposit / totalWealthForPct) * 100).toFixed(1)),
      icon: Landmark,
      desc: `已开立 ${openedBankCount} 家银行账户存款`,
      secondaryInfo: '保本稳健利息',
    },
    {
      name: '股票持仓',
      key: 'stocks',
      value: stockMarketValue,
      color: COLORS.stocks,
      percentage: Number(((stockMarketValue / totalWealthForPct) * 100).toFixed(1)),
      icon: TrendingUp,
      desc: `持有 ${holdingStockCount} 只股票持仓市值`,
      secondaryInfo: stockProfitLoss >= 0 ? `浮盈 +${stockProfitLoss.toFixed(0)} ₽` : `浮亏 ${stockProfitLoss.toFixed(0)} ₽`,
    },
    {
      name: '不动产估值',
      key: 'housing',
      value: housingMarketValue,
      color: COLORS.housing,
      percentage: Number(((housingMarketValue / totalWealthForPct) * 100).toFixed(1)),
      icon: Home,
      desc: `名下持有 ${propertyCount} 处不动产地契`,
      secondaryInfo: rentedOutCount > 0 ? `放租中 ${rentedOutCount} 处 (月收 +${monthlyRentalIncome} ₽)` : '暂未放租',
    },
  ];

  // 准备饼图数据（过滤0值或保持结构）
  const chartData = rawData.map((d) => ({
    name: d.name,
    key: d.key,
    value: Math.max(0, d.value),
    color: d.color,
  }));

  // 计算健康度与评级
  const liquidityRatio = Number((((coins + totalDeposit) / totalWealthForPct) * 100).toFixed(1));
  const debtRatio = grossAssets > 0 ? Number(((totalLoan / grossAssets) * 100).toFixed(1)) : 0;
  
  let ratingLabel = '卓越稳健';
  let ratingColor = 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10';
  if (debtRatio > 50) {
    ratingLabel = '高杠杆风险';
    ratingColor = 'text-red-300 border-red-500/40 bg-red-500/10';
  } else if (debtRatio > 30) {
    ratingLabel = '杠杆适中';
    ratingColor = 'text-amber-300 border-amber-500/40 bg-amber-500/10';
  } else if (liquidityRatio < 15) {
    ratingLabel = '偏重固定资产';
    ratingColor = 'text-blue-300 border-blue-500/40 bg-blue-500/10';
  }

  // 月度现金流计算
  const baseStipend = 1500;
  const estimatedBankInterest = Math.floor(totalDeposit * 0.003); // 预估月利息0.3%
  const estimatedLoanInterest = Math.floor(totalLoan * 0.005); // 预估月贷款利息0.5%
  const totalMonthlyInflow = baseStipend + monthlyRentalIncome + estimatedBankInterest;
  const totalMonthlyOutflow = monthlyRentExpense + estimatedLoanInterest;
  const netMonthlyCashflow = totalMonthlyInflow - totalMonthlyOutflow;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const pct = ((data.value / totalWealthForPct) * 100).toFixed(1);
      return (
        <div className="bg-[#181a24] border-2 border-black p-3 rounded-2xl shadow-[0_6px_16px_rgba(0,0,0,0.8)] text-xs space-y-1.5 z-50">
          <div className="flex items-center gap-2 font-black text-white">
            <div className="w-3 h-3 rounded-full shadow" style={{ backgroundColor: data.payload.color }} />
            <span>{data.name}</span>
          </div>
          <div className="text-amber-300 font-mono font-black text-sm">
            {data.value.toLocaleString()} ₽
          </div>
          <div className="text-gray-400 text-[11px] font-bold">
            资产占比: <span className="text-white">{pct}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#181a24] flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="relative w-full h-16 bg-[#1f2230] border-b-2 border-black shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20 flex items-center justify-between px-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-2 bg-[#2d3042] hover:bg-[#393d54] border-2 border-black rounded-xl active:translate-y-0.5 shadow-[0_2px_0_#000] cursor-pointer text-white flex items-center justify-center transition-all z-10"
        >
          <ChevronLeft size={20} className="text-white" strokeWidth={3} />
        </button>

        <div className="flex-1 flex items-center justify-center pointer-events-none px-2">
          <div className="bg-[#2a2d3e] border-2 border-amber-500/80 px-4 py-1.5 rounded-xl shadow-[0_3px_0_#000] flex items-center gap-2">
            <Wallet size={18} className="text-amber-400 flex-shrink-0" />
            <span className="text-amber-300 text-sm font-black tracking-wider">
              资产
            </span>
          </div>
        </div>

        <div className="flex items-center bg-[#151722] rounded-full px-2.5 py-1 border border-black text-xs font-mono font-black z-10 shadow-[0_2px_0_#000]">
          <CircleDollarSign size={14} className="text-yellow-400 mr-1" />
          <span className="text-amber-300">{coins.toLocaleString()} ₽</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-[#1a1c26] border-b-2 border-black px-3 py-2 flex items-center justify-between gap-1 flex-shrink-0 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: '资产全景', icon: PieChartIcon },
          { id: 'breakdown', label: '多元明细', icon: Layers },
          { id: 'cashflow', label: '月度现金流', icon: BarChart3 },
          { id: 'analysis', label: '评级与建议', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500 text-black border-black font-black'
                  : 'bg-[#252838] text-gray-400 hover:text-white hover:bg-[#2e3245]'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-black' : 'text-gray-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content View */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 custom-scrollbar bg-[#181a24]">
        {/* Top Summary Banner */}
        <div className="bg-[#222432] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12 scale-[2] pointer-events-none text-white">
            <Coins size={96} />
          </div>

          <div className="relative z-10 space-y-1">
            <div className="text-gray-400 text-xs font-bold flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" />
              <span>个人总资产净值</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300 drop-shadow-md flex items-baseline gap-1.5">
              <span>{totalNetWorth.toLocaleString()}</span>
              <span className="text-sm font-bold text-amber-400/80">₽</span>
            </div>
            <div className="text-[11px] text-gray-400 font-bold flex items-center gap-3">
              <span>总资产: <strong className="text-white font-mono">{grossAssets.toLocaleString()} ₽</strong></span>
              {totalLoan > 0 && (
                <span>总负债: <strong className="text-red-400 font-mono">-{totalLoan.toLocaleString()} ₽</strong></span>
              )}
            </div>
          </div>

          <div className="relative z-10 flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 border-black/40 pt-2 sm:pt-0">
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${ratingColor} flex items-center gap-1`}>
              <ShieldCheck size={13} />
              <span>{ratingLabel}</span>
            </span>
            <span className="text-[11px] text-gray-400 font-mono">
              流动性比率: <strong className="text-amber-300 font-bold">{liquidityRatio}%</strong>
            </span>
          </div>
        </div>

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Donut Chart & Visual Distribution Card */}
            <div className="bg-[#222432] border-2 border-black rounded-2xl p-4 sm:p-5 shadow-[0_4px_0_#000] flex flex-col items-center">
              <div className="text-xs font-black text-gray-300 mb-1 flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                  <PieChartIcon size={14} className="text-amber-400" />
                  <span>四大核心资产占比分布</span>
                </div>
                <span className="text-[10px] text-gray-400">点击分段可查看明细</span>
              </div>

              {/* Chart Container */}
              <div className="w-full h-56 relative flex items-center justify-center my-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="#222432"
                      strokeWidth={3}
                      onClick={(entry: any) => {
                        const k = entry?.key || entry?.payload?.key;
                        if (k) {
                          setSelectedAssetKey(k === selectedAssetKey ? null : k);
                        }
                      }}
                      cursor="pointer"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          opacity={selectedAssetKey && selectedAssetKey !== entry.key ? 0.4 : 1}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Callout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {selectedAssetKey ? rawData.find(r => r.key === selectedAssetKey)?.name : '净资产'}
                  </span>
                  <span className="text-sm font-black font-mono text-amber-300">
                    {selectedAssetKey
                      ? (rawData.find(r => r.key === selectedAssetKey)?.value || 0).toLocaleString() + ' ₽'
                      : totalNetWorth >= 1000000
                        ? (totalNetWorth / 10000).toFixed(1) + ' 万'
                        : totalNetWorth.toLocaleString() + ' ₽'}
                  </span>
                </div>
              </div>

              {/* Grid Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full pt-3 border-t border-black/60">
                {rawData.map((item) => {
                  const isSelected = selectedAssetKey === item.key;
                  return (
                    <button
                      key={item.name}
                      onClick={() => setSelectedAssetKey(isSelected ? null : item.key)}
                      className={`flex flex-col p-2 rounded-xl border transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-[#2d3042] border-amber-400 shadow-[0_2px_0_#000]'
                          : 'bg-[#1b1c26] border-black/60 hover:bg-[#252736]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-300">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xs font-black font-mono" style={{ color: item.color }}>
                          {item.percentage}%
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {item.value >= 10000 ? (item.value / 10000).toFixed(1) + '万' : item.value.toLocaleString()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Channel & Portal Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-black text-white tracking-wide">资产配置与产业通道</span>
                </div>
                <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  金融及产业机构快捷直达
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Cash Card */}
                <div className="bg-[#222432] border-2 border-black rounded-2xl p-3.5 shadow-[0_4px_0_#000] relative overflow-hidden flex flex-col justify-between space-y-3 group hover:border-amber-500/50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 border-2 border-amber-500/60 flex items-center justify-center text-amber-400 shadow-inner">
                        <Coins size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-black text-xs">现金流动资产</span>
                          <span className="text-[10px] bg-amber-400/20 text-amber-300 font-mono font-bold px-1.5 py-0.2 rounded border border-amber-400/30">
                            {rawData[0].percentage}%
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold">高流动 · 即时结算</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xl font-black font-mono text-amber-300">
                      {coins.toLocaleString()} <span className="text-xs text-amber-400/80">₽</span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{rawData[0].desc}</div>
                  </div>

                  {/* Allocation Bar */}
                  <div className="space-y-1 pt-1 border-t border-black/40">
                    <div className="w-full bg-[#181a24] h-1.5 rounded-full overflow-hidden border border-black/60">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, rawData[0].percentage)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                      <span>随时自由支配</span>
                      <span className="font-mono text-amber-300 font-bold">{rawData[0].secondaryInfo}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Bank Savings Card */}
                <div
                  onClick={() => {
                    onClose();
                    if (onOpenBank) onOpenBank();
                  }}
                  className="bg-[#222432] hover:bg-[#272a3b] border-2 border-black rounded-2xl p-3.5 shadow-[0_4px_0_#000] relative overflow-hidden flex flex-col justify-between space-y-3 cursor-pointer group transition-all active:translate-y-0.5 hover:border-blue-400/60"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/20 border-2 border-blue-500/60 flex items-center justify-center text-blue-400 shadow-inner group-hover:scale-105 transition-transform">
                        <Landmark size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-black text-xs">银行储蓄资产</span>
                          <span className="text-[10px] bg-blue-500/20 text-blue-300 font-mono font-bold px-1.5 py-0.2 rounded border border-blue-500/30">
                            {rawData[1].percentage}%
                          </span>
                        </div>
                        <span className="text-[10px] text-blue-300/80 font-bold">保本利息 · 存贷服务</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-500/40 flex items-center gap-1 group-hover:bg-blue-500 group-hover:text-black transition-all">
                      <span>前往银行</span>
                      <ArrowRight size={10} />
                    </span>
                  </div>

                  <div>
                    <div className="text-xl font-black font-mono text-blue-300">
                      {totalDeposit.toLocaleString()} <span className="text-xs text-blue-400/80">₽</span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{rawData[1].desc}</div>
                  </div>

                  {/* Allocation Bar */}
                  <div className="space-y-1 pt-1 border-t border-black/40">
                    <div className="w-full bg-[#181a24] h-1.5 rounded-full overflow-hidden border border-black/60">
                      <div
                        className="h-full rounded-full bg-blue-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, rawData[1].percentage)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                      <span>固定年息计提</span>
                      <span className="font-mono text-blue-300 font-bold">{rawData[1].secondaryInfo}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Stock Portfolio Card */}
                <div
                  onClick={() => {
                    onClose();
                    if (onOpenStock) onOpenStock();
                  }}
                  className="bg-[#222432] hover:bg-[#272a3b] border-2 border-black rounded-2xl p-3.5 shadow-[0_4px_0_#000] relative overflow-hidden flex flex-col justify-between space-y-3 cursor-pointer group transition-all active:translate-y-0.5 hover:border-emerald-400/60"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border-2 border-emerald-500/60 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-105 transition-transform">
                        <TrendingUp size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-black text-xs">证券股票持仓</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                            {rawData[2].percentage}%
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-300/80 font-bold">权益证券 · 交易市场</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                      <span>证券交易</span>
                      <ArrowRight size={10} />
                    </span>
                  </div>

                  <div>
                    <div className="text-xl font-black font-mono text-emerald-300">
                      {stockMarketValue.toLocaleString()} <span className="text-xs text-emerald-400/80">₽</span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{rawData[2].desc}</div>
                  </div>

                  {/* Allocation Bar */}
                  <div className="space-y-1 pt-1 border-t border-black/40">
                    <div className="w-full bg-[#181a24] h-1.5 rounded-full overflow-hidden border border-black/60">
                      <div
                        className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, rawData[2].percentage)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                      <span>二级市场行情</span>
                      <span className={`font-mono font-bold ${stockProfitLoss >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>
                        {rawData[2].secondaryInfo}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Housing Property Card */}
                <div
                  onClick={() => {
                    onClose();
                    if (onOpenHousing) onOpenHousing();
                  }}
                  className="bg-[#222432] hover:bg-[#272a3b] border-2 border-black rounded-2xl p-3.5 shadow-[0_4px_0_#000] relative overflow-hidden flex flex-col justify-between space-y-3 cursor-pointer group transition-all active:translate-y-0.5 hover:border-amber-400/60"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-600/20 border-2 border-amber-600/60 flex items-center justify-center text-amber-500 shadow-inner group-hover:scale-105 transition-transform">
                        <Home size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-black text-xs">名下不动产地契</span>
                          <span className="text-[10px] bg-amber-600/20 text-amber-300 font-mono font-bold px-1.5 py-0.2 rounded border border-amber-600/30">
                            {rawData[3].percentage}%
                          </span>
                        </div>
                        <span className="text-[10px] text-amber-300/80 font-bold">实物地契 · 租金被动收益</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-amber-600/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-600/40 flex items-center gap-1 group-hover:bg-amber-500 group-hover:text-black transition-all">
                      <span>房产大厅</span>
                      <ArrowRight size={10} />
                    </span>
                  </div>

                  <div>
                    <div className="text-xl font-black font-mono text-amber-300">
                      {housingMarketValue.toLocaleString()} <span className="text-xs text-amber-400/80">₽</span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{rawData[3].desc}</div>
                  </div>

                  {/* Allocation Bar */}
                  <div className="space-y-1 pt-1 border-t border-black/40">
                    <div className="w-full bg-[#181a24] h-1.5 rounded-full overflow-hidden border border-black/60">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, rawData[3].percentage)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                      <span>住房租售管理</span>
                      <span className="font-mono text-amber-300 font-bold">{rawData[3].secondaryInfo}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. BREAKDOWN TAB */}
        {activeTab === 'breakdown' && (
          <div className="space-y-3.5">
            <div className="bg-[#222432] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-3">
              <div className="flex items-center justify-between border-b border-black/60 pb-2">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <Layers size={14} className="text-amber-400" />
                  <span>各品类资产透视与指标详情</span>
                </span>
                <span className="text-[11px] font-mono text-gray-400">4大资产大类</span>
              </div>

              {rawData.map((item) => (
                <div key={item.key} className="bg-[#181a24] border-2 border-black/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center border"
                        style={{ backgroundColor: `${item.color}20`, borderColor: `${item.color}60`, color: item.color }}
                      >
                        <item.icon size={16} />
                      </div>
                      <div>
                        <div className="text-white font-black text-xs">{item.name}</div>
                        <div className="text-[10px] text-gray-400">{item.desc}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-black text-sm" style={{ color: item.color }}>
                        {item.value.toLocaleString()} ₽
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        占比 {item.percentage}%
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(2, item.percentage))}%`, backgroundColor: item.color }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                    <span>{item.secondaryInfo}</span>
                    {item.key === 'savings' && onOpenBank && (
                      <button
                        onClick={() => { onClose(); onOpenBank(); }}
                        className="text-blue-400 font-bold hover:underline cursor-pointer"
                      >
                        管理存款账户 →
                      </button>
                    )}
                    {item.key === 'stocks' && onOpenStock && (
                      <button
                        onClick={() => { onClose(); onOpenStock(); }}
                        className="text-emerald-400 font-bold hover:underline cursor-pointer"
                      >
                        证券买卖调仓 →
                      </button>
                    )}
                    {item.key === 'housing' && onOpenHousing && (
                      <button
                        onClick={() => { onClose(); onOpenHousing(); }}
                        className="text-amber-400 font-bold hover:underline cursor-pointer"
                      >
                        房产地契置业 →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Liabilities & Debts Card */}
            <div className="bg-[#222432] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-3">
              <div className="flex items-center justify-between border-b border-black/60 pb-2">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <CreditCard size={14} className="text-red-400" />
                  <span>负债与借贷账单</span>
                </span>
                <span className="text-[11px] font-mono text-red-400">
                  {totalLoan > 0 ? `未清借款: ${totalLoan.toLocaleString()} ₽` : '无任何负债'}
                </span>
              </div>

              {totalLoan > 0 ? (
                <div className="bg-[#2a1b1e] border-2 border-red-900/60 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-red-200 text-xs font-bold">银航商业借贷</span>
                    <span className="text-red-400 font-black font-mono text-sm">{totalLoan.toLocaleString()} ₽</span>
                  </div>
                  <div className="text-[10px] text-red-300/80">
                    预估每月产生利息支出约 {estimatedLoanInterest} ₽，按时推演结算自动扣除。
                  </div>
                </div>
              ) : (
                <div className="bg-[#1b241e] border-2 border-emerald-900/60 rounded-xl p-3 text-center space-y-1">
                  <div className="text-emerald-300 font-bold text-xs flex items-center justify-center gap-1">
                    <ShieldCheck size={14} />
                    <span>信用状况优异 · 零负债状态</span>
                  </div>
                  <p className="text-gray-400 text-[10px]">
                    您名下无任何银行贷款与欠款，财务自由度高，抗风险能力极强。
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. CASHFLOW TAB */}
        {activeTab === 'cashflow' && (
          <div className="space-y-3.5">
            <div className="bg-[#222432] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-3">
              <div className="flex items-center justify-between border-b border-black/60 pb-2">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <BarChart3 size={14} className="text-amber-400" />
                  <span>月度现金流预测</span>
                </span>
                <span className={`text-[11px] font-mono font-bold ${netMonthlyCashflow >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  月度净结余: {netMonthlyCashflow >= 0 ? `+${netMonthlyCashflow.toLocaleString()}` : `${netMonthlyCashflow.toLocaleString()}`} ₽
                </span>
              </div>

              {/* Monthly Inflow Section */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <ArrowUpRight size={13} />
                  <span>月度预期收入进账 (+{totalMonthlyInflow.toLocaleString()} ₽)</span>
                </div>
                <div className="space-y-1.5">
                  <div className="bg-[#181a24] p-2.5 rounded-xl border border-black/60 flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-bold">🏛️ 帝国月度基本俸禄/津贴</span>
                    <span className="text-emerald-300 font-mono font-black">+{baseStipend.toLocaleString()} ₽</span>
                  </div>
                  {monthlyRentalIncome > 0 && (
                    <div className="bg-[#181a24] p-2.5 rounded-xl border border-black/60 flex items-center justify-between text-xs">
                      <span className="text-gray-300 font-bold">🏠 名下出租房产租金净收入</span>
                      <span className="text-emerald-300 font-mono font-black">+{monthlyRentalIncome.toLocaleString()} ₽</span>
                    </div>
                  )}
                  {estimatedBankInterest > 0 && (
                    <div className="bg-[#181a24] p-2.5 rounded-xl border border-black/60 flex items-center justify-between text-xs">
                      <span className="text-gray-300 font-bold">🏦 银行活期及定期存款利息预估</span>
                      <span className="text-emerald-300 font-mono font-black">+{estimatedBankInterest.toLocaleString()} ₽</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Monthly Outflow Section */}
              <div className="space-y-2 pt-2 border-t border-black/40">
                <div className="text-[11px] font-bold text-red-400 flex items-center gap-1">
                  <ArrowDownRight size={13} />
                  <span>月度预期固定支出 (-{totalMonthlyOutflow.toLocaleString()} ₽)</span>
                </div>
                <div className="space-y-1.5">
                  {monthlyRentExpense > 0 ? (
                    <div className="bg-[#181a24] p-2.5 rounded-xl border border-black/60 flex items-center justify-between text-xs">
                      <span className="text-gray-300 font-bold">🔑 租赁住所每月应缴房租</span>
                      <span className="text-red-400 font-mono font-black">-{monthlyRentExpense.toLocaleString()} ₽</span>
                    </div>
                  ) : (
                    <div className="bg-[#181a24] p-2.5 rounded-xl border border-black/60 flex items-center justify-between text-xs">
                      <span className="text-gray-400">🔑 住所租金支出 (自住房产/无租金)</span>
                      <span className="text-gray-400 font-mono font-bold">0 ₽</span>
                    </div>
                  )}
                  {estimatedLoanInterest > 0 && (
                    <div className="bg-[#181a24] p-2.5 rounded-xl border border-black/60 flex items-center justify-between text-xs">
                      <span className="text-gray-300 font-bold">💳 银行借贷月度利息支出预估</span>
                      <span className="text-red-400 font-mono font-black">-{estimatedLoanInterest.toLocaleString()} ₽</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Net Cashflow Bar */}
              <div className="bg-[#1d1f2b] p-3 rounded-xl border border-black flex items-center justify-between mt-3">
                <div className="text-xs text-gray-300 font-bold">
                  每次步入下个月推演时净现金变动：
                </div>
                <div className={`text-sm font-mono font-black ${netMonthlyCashflow >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  {netMonthlyCashflow >= 0 ? `+${netMonthlyCashflow.toLocaleString()} ₽ /月` : `${netMonthlyCashflow.toLocaleString()} ₽ /月`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. ANALYSIS TAB */}
        {activeTab === 'analysis' && (
          <div className="space-y-3.5">
            <div className="bg-[#222432] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-3">
              <div className="flex items-center justify-between border-b border-black/60 pb-2">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <Award size={14} className="text-amber-400" />
                  <span>财务健康评级与智能配置建议</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${ratingColor}`}>
                  {ratingLabel}
                </span>
              </div>

              {/* Diagnostic Items */}
              <div className="space-y-2.5 text-xs">
                {/* 1. Liquidity */}
                <div className="bg-[#181a24] p-3 rounded-xl border border-black/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold flex items-center gap-1.5">
                      <Coins size={14} className="text-amber-400" />
                      <span>流动性储备指数</span>
                    </span>
                    <span className="text-amber-300 font-mono font-bold">{liquidityRatio}% (良好)</span>
                  </div>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    {liquidityRatio > 60
                      ? '随身现金及银行活期储蓄比例过高，建议适度配置优质股票或置办出租房产以实现财富复利增值。'
                      : liquidityRatio < 15
                      ? '流动性储备偏紧，需注意预留至少 3-6 个月的日常生活备用金以防突发事件。'
                      : '现金与储蓄结构均衡，兼顾了日常开支流动性与抗风险安全垫。'}
                  </p>
                </div>

                {/* 2. Real Estate Exposure */}
                <div className="bg-[#181a24] p-3 rounded-xl border border-black/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold flex items-center gap-1.5">
                      <Home size={14} className="text-amber-500" />
                      <span>不动产沉淀与被动收益</span>
                    </span>
                    <span className="text-amber-400 font-mono font-bold">
                      {housingMarketValue > 0 ? `${propertyCount} 处房产 (${rawData[3].percentage}%)` : '尚未置业'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    {propertyCount > 0
                      ? `名下不动产具备稳定的租金抗通胀属性，每月可产生 +${monthlyRentalIncome} ₽ 租金收益并带来体魄恢复加成。`
                      : '目前尚未购买任何不动产，建议在资金充裕时前往住房地产购置首套地契，提升宜居度并获取租金收益。'}
                  </p>
                </div>

                {/* 3. Equity Exposure */}
                <div className="bg-[#181a24] p-3 rounded-xl border border-black/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-emerald-400" />
                      <span>权益证券与资本增值</span>
                    </span>
                    <span className="text-emerald-300 font-mono font-bold">
                      {stockMarketValue > 0 ? `${holdingStockCount} 只标的 (${rawData[2].percentage}%)` : '空仓状态'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    {stockMarketValue > 0
                      ? `持仓总市值 ${stockMarketValue.toLocaleString()} ₽，${stockProfitLoss >= 0 ? `累计浮盈 +${stockProfitLoss.toFixed(0)} ₽` : `当前浮亏 ${stockProfitLoss.toFixed(0)} ₽`}。建议结合宏观周期逢低布局。`
                      : '暂无股票持仓。可前往帝国证券交易所选购高分红蓝筹或高成长科技股票，参与产业红利。'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Bar */}
      <div className="bg-[#1f2230] border-t-2 border-black p-3 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="text-gray-400 text-xs font-mono font-bold flex items-center gap-1">
          <span>总净值:</span>
          <span className="text-amber-300 font-black">{totalNetWorth.toLocaleString()} ₽</span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenBank && (
            <button
              onClick={() => {
                onClose();
                onOpenBank();
              }}
              className="bg-[#2d3042] hover:bg-[#383d54] text-blue-300 text-xs font-bold py-2 px-3 rounded-xl border-2 border-black active:translate-y-0.5 cursor-pointer flex items-center gap-1 shadow-[0_2px_0_#000]"
            >
              <Landmark size={14} />
              <span>银行</span>
            </button>
          )}

          {onOpenStock && (
            <button
              onClick={() => {
                onClose();
                onOpenStock();
              }}
              className="bg-[#2d3042] hover:bg-[#383d54] text-emerald-300 text-xs font-bold py-2 px-3 rounded-xl border-2 border-black active:translate-y-0.5 cursor-pointer flex items-center gap-1 shadow-[0_2px_0_#000]"
            >
              <TrendingUp size={14} />
              <span>证券</span>
            </button>
          )}

          {onOpenHousing && (
            <button
              onClick={() => {
                onClose();
                onOpenHousing();
              }}
              className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black py-2 px-3 rounded-xl border-2 border-black active:translate-y-0.5 cursor-pointer flex items-center gap-1 shadow-[0_2px_0_#000]"
            >
              <Home size={14} />
              <span>房产</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
