import {
  addLifeLog } from '../lib/lifeLog';
import React,
  { useState,
  useEffect,
  useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  RefreshCw,
  Star,
  Zap,
  BarChart2,
  Wallet,
  Newspaper,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Award,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
  Maximize2,
  Sliders,
  DollarSign,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';

import {
  StockItem,
  StockHolding,
  StockTradeLog,
  StockNewsItem,
  INITIAL_STOCKS,
  INITIAL_NEWS,
  STOCK_KEYS,
  TRADING_DAYS_PER_MONTH,
} from '../lib/stockMarket';
import { CURRENCY } from '../data/seasons';

export type { StockItem, StockHolding, StockTradeLog, StockNewsItem } from '../lib/stockMarket';
export { INITIAL_STOCKS, NEWS_TEMPLATES } from '../lib/stockMarket';

export const StockModal: React.FC<{
  onClose: () => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  /** 家族金融背景（满足时为说明文字，否则为 null）；决定能否开立证券账户 */
  financeBackground: string | null;
}> = ({ onClose, coins, setCoins, financeBackground }) => {
  // 证券账户：旧存档已有持仓的视为已开户
  const [accountOpened, setAccountOpened] = useState<boolean>(() => {
    try {
      if (localStorage.getItem(STOCK_KEYS.accountOpened) === 'true') return true;
      const legacy = JSON.parse(localStorage.getItem(STOCK_KEYS.holdings) || '[]');
      return Array.isArray(legacy) && legacy.length > 0;
    } catch (e) {
      return false;
    }
  });

  const [stocks, setStocks] = useState<StockItem[]>(() => {
    try {
      const saved = localStorage.getItem('amigo_stocks');
      return saved ? JSON.parse(saved) : INITIAL_STOCKS;
    } catch (e) {
      return INITIAL_STOCKS;
    }
  });

  const [holdings, setHoldings] = useState<StockHolding[]>(() => {
    try {
      const saved = localStorage.getItem('amigo_stock_holdings');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [tradeLogs, setTradeLogs] = useState<StockTradeLog[]>(() => {
    try {
      const saved = localStorage.getItem('amigo_stock_tradelogs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [newsFeed, setNewsFeed] = useState<StockNewsItem[]>(() => {
    try {
      const saved = localStorage.getItem('amigo_stock_news');
      return saved ? JSON.parse(saved) : INITIAL_NEWS;
    } catch (e) {
      return [];
    }
  });

  const [tradingDay, setTradingDay] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('amigo_stock_tradingday');
      return saved ? parseInt(saved, 10) : 1;
    } catch (e) {
      return 1;
    }
  });

  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'quotes' | 'portfolio' | 'news' | 'history'>('quotes');
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [tradeSharesInput, setTradeSharesInput] = useState('100');
  const [sectorFilter, setSectorFilter] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [chartMode, setChartMode] = useState<'line' | 'candlestick'>('line');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ day: number; price: number } | null>(null);

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('amigo_stock_favorites');
      return saved ? JSON.parse(saved) : ['s1', 's6'];
    } catch (e) {
      return ['s1', 's6'];
    }
  });

  const toggleFavorite = (e: React.MouseEvent, stockId: string) => {
    e.stopPropagation();
    let updated: string[];
    if (favorites.includes(stockId)) {
      updated = favorites.filter((id) => id !== stockId);
      showToast('已从自选股移除');
    } else {
      updated = [...favorites, stockId];
      showToast('已加入自选关注 ⭐');
    }
    setFavorites(updated);
    try {
      localStorage.setItem('amigo_stock_favorites', JSON.stringify(updated));
    } catch (err) {}
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Save changes to localStorage
  const saveAllData = (
    newStocks: StockItem[],
    newHoldings: StockHolding[],
    newLogs: StockTradeLog[],
    newNews: StockNewsItem[],
    newDay: number
  ) => {
    try {
      localStorage.setItem('amigo_stocks', JSON.stringify(newStocks));
      localStorage.setItem('amigo_stock_holdings', JSON.stringify(newHoldings));
      localStorage.setItem('amigo_stock_tradelogs', JSON.stringify(newLogs));
      localStorage.setItem('amigo_stock_news', JSON.stringify(newNews));
      localStorage.setItem('amigo_stock_tradingday', newDay.toString());
    } catch (e) {}
  };


  // Calculate Portfolio Totals
  const totalMarketValue = useMemo(() => {
    return holdings.reduce((sum, h) => {
      const stock = stocks.find((s) => s.id === h.stockId);
      return sum + h.shares * (stock ? stock.price : h.avgCost);
    }, 0);
  }, [holdings, stocks]);

  const totalCostValue = useMemo(() => {
    return holdings.reduce((sum, h) => sum + h.shares * h.avgCost, 0);
  }, [holdings]);

  const totalFloatProfit = totalMarketValue - totalCostValue;
  const totalProfitPercent = totalCostValue > 0 ? (totalFloatProfit / totalCostValue) * 100 : 0;

  // Market Breadth Stats
  const { gainersCount, losersCount, flatCount, avgPctChange, totalVolumeVal } = useMemo(() => {
    let up = 0;
    let down = 0;
    let flat = 0;
    let sumPct = 0;
    let volSum = 0;

    stocks.forEach((s) => {
      const pct = ((s.price - s.prevPrice) / s.prevPrice) * 100;
      sumPct += pct;
      volSum += s.volume;
      if (pct > 0.05) up++;
      else if (pct < -0.05) down++;
      else flat++;
    });

    return {
      gainersCount: up,
      losersCount: down,
      flatCount: flat,
      avgPctChange: stocks.length > 0 ? sumPct / stocks.length : 0,
      totalVolumeVal: volSum,
    };
  }, [stocks]);

  // Stock Index
  const averagePrice = stocks.length > 0 ? stocks.reduce((sum, s) => sum + s.price, 0) / stocks.length : 100;
  const stockIndexValue = Math.round(3000 + averagePrice * 3.5);

  // Buy Stock
  const handleBuy = (stock: StockItem, shares: number) => {
    if (shares <= 0 || isNaN(shares)) {
      showToast('请输入有效的买入股数！');
      return;
    }
    const cost = Math.round(shares * stock.price);
    if (coins < cost) {
      showToast(`❌ 现金不足！购买 ${shares} 股需 ${cost.toLocaleString()} ${CURRENCY.symbol}，当前拥有 ${coins.toLocaleString()} ${CURRENCY.symbol}`);
      return;
    }

    setCoins((prev) => prev - cost);

    let updatedHoldings = [...holdings];
    const existingIndex = updatedHoldings.findIndex((h) => h.stockId === stock.id);
    if (existingIndex >= 0) {
      const existing = updatedHoldings[existingIndex];
      const newShares = existing.shares + shares;
      const newAvgCost = parseFloat(((existing.shares * existing.avgCost + cost) / newShares).toFixed(2));
      updatedHoldings[existingIndex] = {
        ...existing,
        shares: newShares,
        avgCost: newAvgCost,
      };
    } else {
      updatedHoldings.push({
        stockId: stock.id,
        shares: shares,
        avgCost: stock.price,
      });
    }

    const newLog: StockTradeLog = {
      id: Date.now().toString(),
      type: 'buy',
      stockName: stock.name,
      shares: shares,
      price: stock.price,
      total: cost,
      time: `交易日 #${tradingDay}`,
    };
    const updatedLogs = [newLog, ...tradeLogs];

    setHoldings(updatedHoldings);
    setTradeLogs(updatedLogs);
    saveAllData(stocks, updatedHoldings, updatedLogs, newsFeed, tradingDay);

    showToast(`🎉 成功买入【${stock.name}】${shares.toLocaleString()} 股！扣除 ${cost.toLocaleString()} ${CURRENCY.symbol}`);
  };

  // Sell Stock
  const handleSell = (stock: StockItem, shares: number) => {
    if (shares <= 0 || isNaN(shares)) {
      showToast('请输入有效的卖出股数！');
      return;
    }

    const existing = holdings.find((h) => h.stockId === stock.id);
    if (!existing || existing.shares < shares) {
      showToast(`❌ 持仓不足！你仅持有 ${existing ? existing.shares : 0} 股【${stock.name}】`);
      return;
    }

    const revenue = Math.round(shares * stock.price);
    setCoins((prev) => prev + revenue);

    let updatedHoldings = [...holdings];
    const existingIndex = updatedHoldings.findIndex((h) => h.stockId === stock.id);
    if (existing.shares === shares) {
      updatedHoldings.splice(existingIndex, 1);
    } else {
      updatedHoldings[existingIndex] = {
        ...existing,
        shares: existing.shares - shares,
      };
    }

    const newLog: StockTradeLog = {
      id: Date.now().toString(),
      type: 'sell',
      stockName: stock.name,
      shares: shares,
      price: stock.price,
      total: revenue,
      time: `交易日 #${tradingDay}`,
    };
    const updatedLogs = [newLog, ...tradeLogs];

    setHoldings(updatedHoldings);
    setTradeLogs(updatedLogs);
    saveAllData(stocks, updatedHoldings, updatedLogs, newsFeed, tradingDay);

    // 单笔盈亏达 1 万 ₽ 才记入人生日志
    const realized = Math.round(revenue - shares * existing.avgCost);
    if (Math.abs(realized) >= 10000) {
      addLifeLog('财富', realized > 0 ? `股票大赚：${stock.name}` : `股票重亏：${stock.name}`, `卖出 ${shares.toLocaleString()} 股，${realized > 0 ? '盈利' : '亏损'} ${Math.abs(realized).toLocaleString()} ${CURRENCY.symbol}。`);
    }
    showToast(`💰 成功平仓卖出【${stock.name}】${shares.toLocaleString()} 股！资金回收 +${revenue.toLocaleString()} ${CURRENCY.symbol}`);
  };

  const filteredStocks = useMemo(() => {
    return stocks.filter((s) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sector.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (sectorFilter === '⭐自选') {
        return favorites.includes(s.id);
      }
      if (sectorFilter === '全部') return true;
      return s.sector.includes(sectorFilter);
    });
  }, [stocks, sectorFilter, favorites, searchQuery]);

  const sortedStocksByGain = useMemo(() => {
    return [...stocks].sort((a, b) => {
      const pctA = ((a.price - a.prevPrice) / a.prevPrice) * 100;
      const pctB = ((b.price - b.prevPrice) / b.prevPrice) * 100;
      return pctB - pctA;
    });
  }, [stocks]);

  const top3Gainers = sortedStocksByGain.slice(0, 3);
  const top3Losers = [...sortedStocksByGain].reverse().slice(0, 3);

  // Selected Stock Holding
  const currentSelectedHolding = selectedStock ? holdings.find((h) => h.stockId === selectedStock.id) : null;
  const currentHoldingShares = currentSelectedHolding ? currentSelectedHolding.shares : 0;

  // Quick Max Shares Calculation
  const maxBuyShares = selectedStock ? Math.floor(coins / selectedStock.price) : 0;
  const maxSellShares = currentHoldingShares;

  const handleOpenAccount = () => {
    if (!financeBackground) return;
    try {
      localStorage.setItem(STOCK_KEYS.accountOpened, 'true');
    } catch (e) {}
    setAccountOpened(true);
    addLifeLog('财富', '开立证券账户', `开户资格：${financeBackground}。`);
    showToast('🎉 证券账户开立成功，欢迎入市！');
  };

  if (!accountOpened) {
    return (
      <div className="absolute inset-0 bg-[#0d0f18] text-gray-100 flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-200 overflow-hidden font-sans">
        <div className="relative w-full bg-[#141724] border-b-2 border-black px-3 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="h-9 px-2.5 bg-[#23273a] hover:bg-[#2e334a] border-2 border-black rounded-xl active:translate-y-0.5 shadow-[0_2px_0_#000] cursor-pointer text-white"
          >
            <ChevronLeft size={18} strokeWidth={3} />
          </button>
          <span className="text-amber-300 text-sm font-black tracking-wider">帝国证券交易所 · 开户柜台</span>
        </div>
        <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center justify-center gap-4 text-center">
          <FileText size={48} className="text-amber-400" />
          <h2 className="text-white font-black text-lg">开立证券账户</h2>
          <p className="text-gray-300 text-xs font-bold leading-relaxed max-w-xs">
            交易所只为具备金融背景的家族开立账户：家族中需有人读过金融学，或从事过金融相关工作（例如交易所代理经纪人、商行账房）。
          </p>
          {financeBackground ? (
            <>
              <div className="bg-emerald-950/80 border-2 border-emerald-500/70 text-emerald-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-2">
                <CheckCircle2 size={14} /> 符合条件：{financeBackground}
              </div>
              <button
                onClick={handleOpenAccount}
                className="bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black text-sm px-6 py-2.5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] cursor-pointer active:translate-y-0.5"
              >
                立即开户
              </button>
            </>
          ) : (
            <div className="bg-red-950/70 border-2 border-red-500/60 text-red-200 text-xs font-bold px-3 py-2 rounded-xl flex items-start gap-2 max-w-xs text-left">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>暂不符合开户条件。可在「就业招聘」应聘交易所代理经纪人，或与从事金融工作的人结婚后再来办理。</span>
            </div>
          )}
        </div>
        {toast && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-[#161928]/95 text-amber-300 border-2 border-amber-400/80 text-xs font-black px-4 py-2 rounded-xl">
            {toast}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-[#0d0f18] text-gray-100 flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-200 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-[#161928]/95 backdrop-blur-md text-amber-300 border-2 border-amber-400/80 text-xs font-black px-4 py-2 rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-2 duration-200 text-center max-w-[85%]">
          {toast}
        </div>
      )}

      {/* Header Bar */}
      <div className="relative w-full h-15 bg-[#141724] border-b-2 border-black shadow-[0_4px_12px_rgba(0,0,0,0.6)] z-20 flex items-center justify-between px-3 flex-shrink-0">
        <button
          onClick={selectedStock ? () => setSelectedStock(null) : onClose}
          className="h-9 px-2.5 bg-[#23273a] hover:bg-[#2e334a] border-2 border-black rounded-xl active:translate-y-0.5 shadow-[0_2px_0_#000] cursor-pointer text-white flex items-center gap-1 transition-all z-10"
        >
          <ChevronLeft size={18} className="text-white" strokeWidth={3} />
          {selectedStock && <span className="text-xs font-bold text-gray-200">返回</span>}
        </button>

        <div className="flex-1 flex flex-col items-center justify-center pointer-events-none px-2">
          <div className="bg-[#1b1f30] border border-amber-500/50 px-3 py-1 rounded-xl shadow-[0_2px_0_#000] flex items-center gap-2 max-w-[90%]">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-amber-300 text-xs sm:text-sm font-black tracking-wider truncate">
              {selectedStock ? `${selectedStock.name} · ${selectedStock.code}` : '帝国证券交易所'}
            </span>
            {!selectedStock && (
              <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">
                IMPERIAL EXCHANGE
              </span>
            )}
          </div>
        </div>

        <div className="z-10 text-right leading-tight">
          <div className="text-[9px] text-gray-400 font-bold">行情随月份推进</div>
          <div className="text-[10px] text-amber-300 font-black">每月 {TRADING_DAYS_PER_MONTH} 个交易日</div>
        </div>
      </div>

      {/* Global Stock Index Dashboard Bar */}
      {!selectedStock && (
        <div className="bg-[#121420] border-b-2 border-black px-3.5 py-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5">
                <span>帝国综指</span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-mono text-[9px]">
                  交易日 #{tradingDay}
                </span>
              </div>
              <div className="flex items-baseline gap-2 font-mono font-black mt-0.5">
                <span className="text-white text-base tracking-tight">{stockIndexValue.toLocaleString()} pt</span>
                <span
                  className={`text-xs font-bold flex items-center ${
                    avgPctChange >= 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {avgPctChange >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {avgPctChange >= 0 ? `+${avgPctChange.toFixed(2)}%` : `${avgPctChange.toFixed(2)}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Market Breadth Multi-Bar */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 text-[10px] font-mono">
              <span className="text-red-400 font-bold">涨 {gainersCount}</span>
              <span className="text-gray-400">平 {flatCount}</span>
              <span className="text-emerald-400 font-bold">跌 {losersCount}</span>
            </div>
            {/* Visual ratio indicator bar */}
            <div className="w-28 sm:w-36 h-1.5 bg-gray-800 rounded-full overflow-hidden flex mt-1 border border-black/80">
              <div
                className="bg-red-500 transition-all duration-300"
                style={{ width: `${(gainersCount / stocks.length) * 100}%` }}
              />
              <div
                className="bg-gray-500 transition-all duration-300"
                style={{ width: `${(flatCount / stocks.length) * 100}%` }}
              />
              <div
                className="bg-emerald-500 transition-all duration-300"
                style={{ width: `${(losersCount / stocks.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      {!selectedStock && (
        <div className="grid grid-cols-4 bg-[#141724] p-1.5 border-b-2 border-black gap-1 flex-shrink-0">
          <button
            onClick={() => setActiveTab('quotes')}
            className={`py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'quotes'
                ? 'bg-amber-400 text-black border-black shadow-[0_2px_0_#000]'
                : 'text-gray-400 border-transparent hover:text-white hover:bg-[#1f2334]'
            }`}
          >
            <BarChart2 size={13} />
            <span>行情看板</span>
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'portfolio'
                ? 'bg-amber-400 text-black border-black shadow-[0_2px_0_#000]'
                : 'text-gray-400 border-transparent hover:text-white hover:bg-[#1f2334]'
            }`}
          >
            <Wallet size={13} />
            <span>我的持仓 ({holdings.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'news'
                ? 'bg-amber-400 text-black border-black shadow-[0_2px_0_#000]'
                : 'text-gray-400 border-transparent hover:text-white hover:bg-[#1f2334]'
            }`}
          >
            <Newspaper size={13} />
            <span>盘面快讯</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-amber-400 text-black border-black shadow-[0_2px_0_#000]'
                : 'text-gray-400 border-transparent hover:text-white hover:bg-[#1f2334]'
            }`}
          >
            <History size={13} />
            <span>流水明细</span>
          </button>
        </div>
      )}

      {/* Main Scrollable Workspace */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {/* VIEW 1: Stock Inspector (Detailed Chart & Trade Console) */}
        {selectedStock ? (
          <div className="space-y-3 animate-in fade-in zoom-in-95 duration-150 max-w-2xl mx-auto">
            {/* Header Hero Card */}
            <div className="bg-[#181b2a] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-black text-lg tracking-wide">{selectedStock.name}</span>
                    <span className="bg-[#10121d] text-amber-400 text-[10px] font-mono font-black px-2 py-0.5 rounded border border-amber-500/40">
                      {selectedStock.code}
                    </span>
                    <span className="bg-purple-950/80 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-500/40">
                      {selectedStock.sector}板块
                    </span>
                    <span className="bg-[#121522] text-gray-400 text-[10px] font-mono px-1.5 py-0.5 rounded border border-black">
                      帝国主板 A-01
                    </span>
                  </div>
                  <p className="text-gray-300 text-xs font-medium leading-relaxed max-w-md">
                    {selectedStock.desc}
                  </p>
                </div>

                <button
                  onClick={(e) => toggleFavorite(e, selectedStock.id)}
                  className="p-2 bg-[#23273a] hover:bg-[#2e334a] border-2 border-black rounded-xl text-amber-400 flex items-center gap-1 cursor-pointer shadow-[0_2px_0_#000] active:translate-y-0.5 transition-all text-xs font-black flex-shrink-0"
                >
                  <Star size={15} fill={favorites.includes(selectedStock.id) ? '#f59e0b' : 'none'} />
                  <span>{favorites.includes(selectedStock.id) ? '已自选' : '关注'}</span>
                </button>
              </div>

              {/* Price & Metric Strip */}
              <div className="mt-3.5 pt-3 border-t border-gray-800 flex items-end justify-between">
                <div>
                  <span className="text-gray-400 text-[10px] font-bold block">现价 (RMB/{CURRENCY.symbol})</span>
                  <div className="text-amber-300 text-2xl sm:text-3xl font-black font-mono tracking-tight mt-0.5">
                    {selectedStock.price.toFixed(2)} {CURRENCY.symbol}
                  </div>
                </div>

                {(() => {
                  const change = selectedStock.price - selectedStock.prevPrice;
                  const pct = (change / selectedStock.prevPrice) * 100;
                  const isUp = change >= 0;
                  return (
                    <div className="text-right">
                      <span className="text-gray-400 text-[10px] font-bold block">日内涨跌幅</span>
                      <div
                        className={`text-base sm:text-lg font-black font-mono mt-0.5 flex items-center justify-end ${
                          isUp ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {isUp ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                        {isUp ? `+${change.toFixed(2)} (+${pct.toFixed(2)}%)` : `${change.toFixed(2)} (${pct.toFixed(2)}%)`}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* High / Low / Volume Stats Grid */}
              <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-800 text-center font-mono">
                <div className="bg-[#10121d] p-2 rounded-xl border border-black">
                  <div className="text-[9px] text-gray-400 font-bold font-sans">最高价</div>
                  <div className="text-red-400 font-black text-xs mt-0.5">{selectedStock.highPrice.toFixed(2)}</div>
                </div>
                <div className="bg-[#10121d] p-2 rounded-xl border border-black">
                  <div className="text-[9px] text-gray-400 font-bold font-sans">最低价</div>
                  <div className="text-emerald-400 font-black text-xs mt-0.5">{selectedStock.lowPrice.toFixed(2)}</div>
                </div>
                <div className="bg-[#10121d] p-2 rounded-xl border border-black">
                  <div className="text-[9px] text-gray-400 font-bold font-sans">昨收价</div>
                  <div className="text-gray-300 font-black text-xs mt-0.5">{selectedStock.prevPrice.toFixed(2)}</div>
                </div>
                <div className="bg-[#10121d] p-2 rounded-xl border border-black">
                  <div className="text-[9px] text-gray-400 font-bold font-sans">成交量</div>
                  <div className="text-amber-300 font-black text-xs mt-0.5">
                    {(selectedStock.volume / 10000).toFixed(0)}万
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Trend Chart Card */}
            <div className="bg-[#181b2a] border-2 border-black rounded-2xl p-3.5 shadow-[0_4px_0_#000] space-y-2">
              <div className="flex justify-between items-center text-xs font-black text-gray-300 border-b border-gray-800 pb-2">
                <div className="flex items-center gap-2">
                  <BarChart2 size={15} className="text-amber-400" />
                  <span>近10日交易走势 (推演行情)</span>
                </div>

                <div className="flex items-center gap-1 bg-[#10121d] p-0.5 rounded-lg border border-black">
                  <button
                    onClick={() => setChartMode('line')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      chartMode === 'line' ? 'bg-amber-400 text-black' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    分时走势
                  </button>
                  <button
                    onClick={() => setChartMode('candlestick')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      chartMode === 'candlestick' ? 'bg-amber-400 text-black' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    K线模拟
                  </button>
                </div>
              </div>

              {/* Chart Canvas Area */}
              <div className="h-44 w-full relative pt-2 pb-1 px-2 flex flex-col justify-end bg-[#10121d]/80 rounded-xl border border-black/80">
                {(() => {
                  const pts = selectedStock.history;
                  const min = Math.min(...pts) * 0.96;
                  const max = Math.max(...pts) * 1.04;
                  const range = max - min || 1;
                  const width = 380;
                  const height = 130;

                  const coords = pts.map((val, idx) => {
                    const x = (idx / (pts.length - 1)) * (width - 24) + 12;
                    const y = height - ((val - min) / range) * (height - 24) - 12;
                    return { x, y, val, day: idx + 1 };
                  });

                  const polylineStr = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
                  const areaStr = `12,${height} ${polylineStr} ${width - 12},${height}`;

                  return (
                    <div className="relative w-full h-full">
                      {/* Top / Bottom Price Guides */}
                      <div className="absolute top-1 right-2 text-[9px] font-mono text-gray-500">
                        最高: {max.toFixed(1)} {CURRENCY.symbol}
                      </div>
                      <div className="absolute bottom-1 right-2 text-[9px] font-mono text-gray-500">
                        最低: {min.toFixed(1)} {CURRENCY.symbol}
                      </div>

                      {hoveredDataPoint && (
                        <div className="absolute top-1 left-2 bg-[#23273a] text-amber-300 border border-amber-500/40 text-[10px] font-mono px-2 py-0.5 rounded shadow z-10">
                          第 {hoveredDataPoint.day} 日 · 价格: {hoveredDataPoint.price.toFixed(2)} {CURRENCY.symbol}
                        </div>
                      )}

                      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Subtle Horizontal grid lines */}
                        <line x1="12" y1={height * 0.25} x2={width - 12} y2={height * 0.25} stroke="#222738" strokeDasharray="3,3" />
                        <line x1="12" y1={height * 0.5} x2={width - 12} y2={height * 0.5} stroke="#222738" strokeDasharray="3,3" />
                        <line x1="12" y1={height * 0.75} x2={width - 12} y2={height * 0.75} stroke="#222738" strokeDasharray="3,3" />

                        {chartMode === 'line' ? (
                          <>
                            {/* Area fill */}
                            <polygon points={areaStr} fill="url(#chartGlow)" />

                            {/* Polyline */}
                            <polyline
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={polylineStr}
                            />

                            {/* Dots */}
                            {coords.map((c, idx) => {
                              const isLast = idx === coords.length - 1;
                              return (
                                <g
                                  key={idx}
                                  onMouseEnter={() => setHoveredDataPoint({ day: c.day, price: c.val })}
                                  onMouseLeave={() => setHoveredDataPoint(null)}
                                  className="cursor-pointer"
                                >
                                  <circle
                                    cx={c.x}
                                    cy={c.y}
                                    r={isLast ? '5' : '3.5'}
                                    className={isLast ? 'fill-red-400 stroke-black stroke-2' : 'fill-amber-400 hover:fill-white'}
                                  />
                                </g>
                              );
                            })}
                          </>
                        ) : (
                          /* Candlestick Simulator Mode */
                          coords.map((c, idx) => {
                            const prevVal = idx > 0 ? coords[idx - 1].val : c.val * 0.98;
                            const isBullish = c.val >= prevVal;
                            const candleColor = isBullish ? '#ef4444' : '#10b981';
                            const openY = height - ((prevVal - min) / range) * (height - 24) - 12;
                            const closeY = c.y;
                            const highY = Math.min(openY, closeY) - 5;
                            const lowY = Math.max(openY, closeY) + 5;
                            const barTop = Math.min(openY, closeY);
                            const barHeight = Math.max(4, Math.abs(closeY - openY));

                            return (
                              <g
                                key={`candle-${idx}`}
                                onMouseEnter={() => setHoveredDataPoint({ day: c.day, price: c.val })}
                                onMouseLeave={() => setHoveredDataPoint(null)}
                                className="cursor-pointer"
                              >
                                {/* Shadow wick */}
                                <line x1={c.x} y1={highY} x2={c.x} y2={lowY} stroke={candleColor} strokeWidth="1.5" />
                                {/* Real Body */}
                                <rect
                                  x={c.x - 6}
                                  y={barTop}
                                  width="12"
                                  height={barHeight}
                                  fill={candleColor}
                                  rx="1"
                                  className="hover:opacity-80"
                                />
                              </g>
                            );
                          })
                        )}
                      </svg>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Trading Order Terminal (买入/卖出 控制台) */}
            <div className="bg-[#181b2a] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-3.5">
              {/* Order Mode Switcher */}
              <div className="grid grid-cols-2 bg-[#10121d] p-1 rounded-xl border-2 border-black gap-1">
                <button
                  onClick={() => setOrderType('buy')}
                  className={`py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    orderType === 'buy'
                      ? 'bg-red-500 text-black shadow-[0_2px_0_#000]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <ArrowUpRight size={15} />
                  <span>买入 · 增持做多</span>
                </button>
                <button
                  onClick={() => setOrderType('sell')}
                  className={`py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    orderType === 'sell'
                      ? 'bg-emerald-500 text-black shadow-[0_2px_0_#000]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <ArrowDownRight size={15} />
                  <span>卖出 · 获利平仓</span>
                </button>
              </div>

              {/* Balance & Limits Information */}
              <div className="flex items-center justify-between text-xs bg-[#10121d] p-2.5 rounded-xl border border-black font-mono">
                <span className="text-gray-400">
                  {orderType === 'buy' ? '可用流动资金:' : '当前可用持仓:'}
                </span>
                <span className="text-amber-300 font-bold">
                  {orderType === 'buy' ? `${coins.toLocaleString()} ${CURRENCY.symbol}` : `${currentHoldingShares.toLocaleString()} 股`}
                </span>
              </div>

              {/* Shares Input & Step Presets */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-gray-300">
                  <span>委托股数：</span>
                  <span className="text-gray-400 text-[10px] font-mono">
                    最大可{orderType === 'buy' ? '买' : '卖'}:{' '}
                    <strong className="text-white">
                      {orderType === 'buy' ? maxBuyShares.toLocaleString() : maxSellShares.toLocaleString()} 股
                    </strong>
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    value={tradeSharesInput}
                    onChange={(e) => setTradeSharesInput(e.target.value)}
                    placeholder="输入股数"
                    className="w-36 bg-[#10121d] text-white font-black font-mono text-sm px-3 py-2 rounded-xl border-2 border-black focus:border-amber-400 focus:outline-none flex-shrink-0"
                  />
                  <div className="grid grid-cols-3 gap-1.5 flex-1">
                    {[100, 500, 1000].map((num) => (
                      <button
                        key={num}
                        onClick={() => {
                          const current = parseInt(tradeSharesInput, 10) || 0;
                          setTradeSharesInput((current + num).toString());
                        }}
                        className="bg-[#23273a] hover:bg-[#2f344e] text-amber-300 font-black text-xs py-2 rounded-xl border border-black shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer text-center transition-all"
                      >
                        +{num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Position Ratio Buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: '25% 仓', ratio: 0.25 },
                  { label: '50% 半仓', ratio: 0.5 },
                  { label: '75% 仓', ratio: 0.75 },
                  { label: '100% 全仓', ratio: 1.0 },
                ].map((pos) => (
                  <button
                    key={pos.label}
                    onClick={() => {
                      const maxBase = orderType === 'buy' ? maxBuyShares : maxSellShares;
                      const targetShares = Math.max(0, Math.floor(maxBase * pos.ratio));
                      setTradeSharesInput(targetShares.toString());
                    }}
                    className="bg-[#10121d] hover:bg-amber-400/20 hover:border-amber-400 text-amber-300 font-black text-xs py-1.5 rounded-xl border border-black shadow-[0_1px_0_#000] active:translate-y-0.5 cursor-pointer text-center transition-all"
                  >
                    {pos.label}
                  </button>
                ))}
              </div>

              {/* Execution Calculation Summary */}
              {(() => {
                const count = parseInt(tradeSharesInput, 10) || 0;
                const totalEstimated = Math.round(count * selectedStock.price);
                const canExecute =
                  orderType === 'buy'
                    ? count > 0 && coins >= totalEstimated
                    : count > 0 && currentHoldingShares >= count;

                return (
                  <div className="bg-[#10121d] p-3 rounded-xl border border-black space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-gray-300 font-bold font-sans">
                      <span>委托单价：</span>
                      <span className="text-white font-black">{selectedStock.price.toFixed(2)} {CURRENCY.symbol}</span>
                    </div>
                    <div className="flex justify-between text-gray-300 font-bold font-sans">
                      <span>预计{orderType === 'buy' ? '发生金额' : '回收现金'}：</span>
                      <span className="text-amber-400 font-black text-sm">{totalEstimated.toLocaleString()} {CURRENCY.symbol}</span>
                    </div>

                    <button
                      onClick={() => {
                        if (orderType === 'buy') {
                          handleBuy(selectedStock, count);
                        } else {
                          handleSell(selectedStock, count);
                        }
                      }}
                      disabled={!canExecute}
                      className={`w-full font-black text-xs py-3 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-2 ${
                        !canExecute
                          ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed opacity-60'
                          : orderType === 'buy'
                          ? 'bg-red-500 hover:bg-red-400 text-black'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                      }`}
                    >
                      {orderType === 'buy' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      <span>
                        确认{orderType === 'buy' ? '买入' : '平仓卖出'} (
                        {totalEstimated.toLocaleString()} {CURRENCY.symbol})
                      </span>
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : null}

        {/* VIEW 2: Quotes Market Tab (行情看板) */}
        {!selectedStock && activeTab === 'quotes' && (
          <div className="space-y-3 max-w-2xl mx-auto">
            {/* Top 3 Gainers & Top 3 Losers Deck */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 今日领涨 */}
              <div className="bg-[#181b2a] border-2 border-black rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-2">
                <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                      <TrendingUp size={13} />
                    </div>
                    <span className="text-white font-black text-xs tracking-wide">今日领涨 · 涨幅 TOP3</span>
                  </div>
                  <span className="text-red-400 font-mono font-bold text-[10px]">多头主攻</span>
                </div>

                <div className="space-y-1.5">
                  {top3Gainers.map((stk, idx) => {
                    const change = stk.price - stk.prevPrice;
                    const pct = (change / stk.prevPrice) * 100;
                    return (
                      <div
                        key={`gainer-${stk.id}`}
                        onClick={() => setSelectedStock(stk)}
                        className="bg-[#10121d] hover:bg-[#202436] border border-black rounded-xl p-2 flex items-center justify-between cursor-pointer transition-all active:translate-y-0.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded bg-red-500 text-black flex items-center justify-center font-black text-[10px] flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <div className="text-white font-black text-xs truncate">{stk.name}</div>
                            <div className="text-gray-400 text-[9px] font-mono">
                              {stk.code} · {stk.sector}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-white font-mono font-black text-xs">{stk.price.toFixed(2)} {CURRENCY.symbol}</div>
                          <div className="text-red-400 font-mono font-black text-[10px] flex items-center justify-end">
                            +{pct.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 今日领跌 */}
              <div className="bg-[#181b2a] border-2 border-black rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-2">
                <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400">
                      <TrendingDown size={13} />
                    </div>
                    <span className="text-white font-black text-xs tracking-wide">今日领跌 · 跌幅 TOP3</span>
                  </div>
                  <span className="text-emerald-400 font-mono font-bold text-[10px]">空头回调</span>
                </div>

                <div className="space-y-1.5">
                  {top3Losers.map((stk, idx) => {
                    const change = stk.price - stk.prevPrice;
                    const pct = (change / stk.prevPrice) * 100;
                    const isUp = pct >= 0;
                    return (
                      <div
                        key={`loser-${stk.id}`}
                        onClick={() => setSelectedStock(stk)}
                        className="bg-[#10121d] hover:bg-[#202436] border border-black rounded-xl p-2 flex items-center justify-between cursor-pointer transition-all active:translate-y-0.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded bg-emerald-500 text-black flex items-center justify-center font-black text-[10px] flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <div className="text-white font-black text-xs truncate">{stk.name}</div>
                            <div className="text-gray-400 text-[9px] font-mono">
                              {stk.code} · {stk.sector}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-white font-mono font-black text-xs">{stk.price.toFixed(2)} {CURRENCY.symbol}</div>
                          <div
                            className={`${
                              isUp ? 'text-red-400' : 'text-emerald-400'
                            } font-mono font-black text-[10px] flex items-center justify-end`}
                          >
                            {isUp ? `+${pct.toFixed(2)}%` : `${pct.toFixed(2)}%`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Search & Sector Filter Bar */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="搜索股票代码、名称或行业板块..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#141724] text-white placeholder-gray-500 text-xs rounded-xl border-2 border-black pl-8.5 pr-3 py-2 focus:outline-none focus:border-amber-400 shadow-[0_2px_0_#000]"
                />
              </div>

              {/* Sector selector pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {['全部', '⭐自选', '重工', '医药', '工坊', '物流', '矿业', '科技', '消费', '金融'].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setSectorFilter(sec)}
                    className={`px-3 py-1 rounded-xl text-xs font-black border transition-all flex-shrink-0 cursor-pointer flex items-center gap-1 ${
                      sectorFilter === sec
                        ? 'bg-amber-400 text-black border-black shadow-[0_2px_0_#000]'
                        : 'bg-[#181b2a] text-gray-400 border-black hover:text-white'
                    }`}
                  >
                    <span>{sec}</span>
                    {sec === '⭐自选' && <span className="text-[10px] opacity-80">({favorites.length})</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock List Table */}
            <div className="bg-[#181b2a] border-2 border-black rounded-2xl overflow-hidden shadow-[0_4px_0_#000] divide-y divide-black/60">
              {filteredStocks.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs font-bold space-y-1">
                  <div>⭐ 暂无匹配的股票</div>
                  <div className="text-[10px] text-gray-500 font-normal">可调整筛选标签或重置搜索词</div>
                </div>
              ) : (
                filteredStocks.map((stock) => {
                  const change = stock.price - stock.prevPrice;
                  const pct = (change / stock.prevPrice) * 100;
                  const isUp = change >= 0;
                  const holding = holdings.find((h) => h.stockId === stock.id);
                  const isFav = favorites.includes(stock.id);

                  // Mini Sparkline SVG
                  const pts = stock.history;
                  const min = Math.min(...pts);
                  const max = Math.max(...pts);
                  const range = max - min || 1;
                  const sparkCoords = pts
                    .map((val, idx) => {
                      const x = (idx / (pts.length - 1)) * 48;
                      const y = 20 - ((val - min) / range) * 18;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(' ');

                  return (
                    <div
                      key={stock.id}
                      onClick={() => setSelectedStock(stock)}
                      className="p-3 hover:bg-[#222638] active:bg-[#282d42] transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      {/* Left: Star + Name + Sector */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={(e) => toggleFavorite(e, stock.id)}
                          className="p-1 text-amber-400 hover:scale-110 active:scale-95 transition-transform cursor-pointer flex-shrink-0"
                          title={isFav ? '取消自选' : '加入自选'}
                        >
                          <Star size={16} fill={isFav ? '#f59e0b' : 'none'} />
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-black text-xs truncate group-hover:text-amber-300 transition-colors">
                              {stock.name}
                            </span>
                            {holding && holding.shares > 0 && (
                              <span className="bg-amber-400 text-black text-[9px] font-black px-1 rounded border border-black flex-shrink-0">
                                持仓 {holding.shares}
                              </span>
                            )}
                          </div>
                          <div className="text-gray-400 text-[10px] font-mono mt-0.5 truncate">
                            {stock.code} · {stock.sector}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Mini Sparkline */}
                      <div className="hidden sm:block w-14 h-6 flex-shrink-0">
                        <svg viewBox="0 0 48 20" className="w-full h-full overflow-visible">
                          <polyline
                            fill="none"
                            stroke={isUp ? '#ef4444' : '#10b981'}
                            strokeWidth="1.5"
                            points={sparkCoords}
                          />
                        </svg>
                      </div>

                      {/* Right: Price & Change badge */}
                      <div className="text-right flex items-center gap-3 flex-shrink-0">
                        <div>
                          <div className="text-white font-black text-xs font-mono">
                            {stock.price.toFixed(2)} {CURRENCY.symbol}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            昨 {stock.prevPrice.toFixed(2)}
                          </div>
                        </div>

                        <div
                          className={`min-w-[62px] text-center font-mono font-black text-[11px] px-2 py-1 rounded-lg border flex items-center justify-center gap-0.5 ${
                            isUp
                              ? 'bg-red-500/15 text-red-400 border-red-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {isUp ? '+' : ''}
                          {pct.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: Portfolio Tab (我的持仓) */}
        {!selectedStock && activeTab === 'portfolio' && (
          <div className="space-y-3 max-w-2xl mx-auto">
            {/* Total Assets Overview */}
            <div className="bg-[#181b2a] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] relative space-y-3">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-white font-black text-xs flex items-center gap-1.5">
                  <Wallet size={15} className="text-amber-400" />
                  <span>股票资产与浮动盈亏</span>
                </span>
                <span className="text-amber-300 font-mono text-xs font-bold">持仓标的: {holdings.length} 只</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-[#10121d] p-3 rounded-xl border border-black">
                  <div className="text-gray-400 text-[10px] font-bold">持仓股票总市值</div>
                  <div className="text-white text-lg font-black font-mono mt-0.5">
                    {totalMarketValue.toLocaleString()} {CURRENCY.symbol}
                  </div>
                </div>

                <div className="bg-[#10121d] p-3 rounded-xl border border-black">
                  <div className="text-gray-400 text-[10px] font-bold">累计浮动盈亏</div>
                  <div
                    className={`text-lg font-black font-mono mt-0.5 ${
                      totalFloatProfit >= 0 ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {totalFloatProfit >= 0 ? `+${totalFloatProfit.toLocaleString()}` : totalFloatProfit.toLocaleString()} {CURRENCY.symbol}
                    <span className="text-[10px] font-bold ml-1">
                      ({totalProfitPercent >= 0 ? '+' : ''}
                      {totalProfitPercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Holdings List */}
            {holdings.length === 0 ? (
              <div className="bg-[#181b2a] border-2 border-black rounded-2xl p-8 text-center text-gray-400 space-y-2">
                <BarChart2 size={32} className="mx-auto text-gray-600 mb-1" />
                <div className="text-xs font-bold text-gray-300">暂无任何股票持仓</div>
                <p className="text-[10px] text-gray-500">前往「行情看板」选购心仪的帝国实业与科技股票吧！</p>
              </div>
            ) : (
              <div className="bg-[#181b2a] border-2 border-black rounded-2xl overflow-hidden shadow-[0_4px_0_#000] divide-y divide-black/60">
                {holdings.map((h) => {
                  const stock = stocks.find((s) => s.id === h.stockId);
                  if (!stock) return null;
                  const currentMarketVal = h.shares * stock.price;
                  const floatProfit = currentMarketVal - h.shares * h.avgCost;
                  const floatPct = ((stock.price - h.avgCost) / h.avgCost) * 100;
                  const isUp = floatProfit >= 0;

                  return (
                    <div key={h.stockId} className="p-3.5 space-y-2.5 hover:bg-[#202436]/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-black text-xs">{stock.name}</span>
                            <span className="bg-[#10121d] text-amber-400 text-[9px] font-mono px-1 rounded border border-amber-500/40">
                              {stock.code}
                            </span>
                          </div>
                          <div className="text-gray-400 text-[10px] font-mono mt-0.5">
                            持仓: {h.shares.toLocaleString()} 股 · 成本: {h.avgCost.toFixed(2)} {CURRENCY.symbol}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-white font-black text-xs font-mono">
                            {currentMarketVal.toLocaleString()} {CURRENCY.symbol}
                          </div>
                          <div
                            className={`text-[10px] font-mono font-black mt-0.5 ${
                              isUp ? 'text-red-400' : 'text-emerald-400'
                            }`}
                          >
                            {isUp ? `+${floatProfit.toFixed(0)} ${CURRENCY.symbol}` : `${floatProfit.toFixed(0)} ${CURRENCY.symbol}`} (
                            {isUp ? '+' : ''}
                            {floatPct.toFixed(2)}%)
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedStock(stock)}
                          className="flex-1 bg-amber-400 hover:bg-amber-300 text-black text-[11px] font-black py-1.5 rounded-xl border border-black shadow-[0_1px_0_#000] cursor-pointer"
                        >
                          加仓 / 看盘
                        </button>
                        <button
                          onClick={() => handleSell(stock, h.shares)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black px-4 py-1.5 rounded-xl border border-black shadow-[0_1px_0_#000] cursor-pointer"
                        >
                          一键平仓
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: News Feed Tab (盘面快讯) */}
        {!selectedStock && activeTab === 'news' && (
          <div className="bg-[#181b2a] border-2 border-black rounded-2xl p-3.5 shadow-[0_4px_0_#000] space-y-3 max-w-2xl mx-auto">
            <div className="text-white font-black text-xs border-b border-gray-800 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Newspaper size={15} className="text-amber-400" />
                <span>帝国证券交易所 · 权威财经快讯</span>
              </span>
              <span className="text-gray-400 text-[10px] font-mono">第 {tradingDay} 交易日</span>
            </div>

            <div className="space-y-2">
              {newsFeed.map((news) => {
                const linkedStock = news.stockId ? stocks.find((s) => s.id === news.stockId) : null;

                return (
                  <div key={news.id} className="bg-[#10121d] border border-black rounded-xl p-3 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span
                        className={`font-black text-xs ${
                          news.type === 'up'
                            ? 'text-red-400'
                            : news.type === 'down'
                            ? 'text-emerald-400'
                            : 'text-amber-300'
                        }`}
                      >
                        {news.title}
                      </span>
                      <span className="text-[9px] font-mono text-gray-500">{news.time}</span>
                    </div>
                    <p className="text-gray-300 text-[11px] leading-relaxed">{news.desc}</p>

                    {linkedStock && (
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => setSelectedStock(linkedStock)}
                          className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>查看关联标的【{linkedStock.name}】</span>
                          <ArrowRight size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 5: History Logs Tab (流水明细) */}
        {!selectedStock && activeTab === 'history' && (
          <div className="bg-[#181b2a] border-2 border-black rounded-2xl p-3.5 shadow-[0_4px_0_#000] space-y-3 max-w-2xl mx-auto">
            <div className="text-white font-black text-xs border-b border-gray-800 pb-2 flex items-center justify-between">
              <span>股票买卖交易流水</span>
              <span className="text-gray-400 text-[10px] font-mono">共 {tradeLogs.length} 笔订单</span>
            </div>

            {tradeLogs.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-xs font-bold">暂无任何买卖交易记录</div>
            ) : (
              <div className="bg-[#10121d] border border-black rounded-xl divide-y divide-black/60">
                {tradeLogs.map((log) => (
                  <div key={log.id} className="p-2.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded border border-black ${
                            log.type === 'buy' ? 'bg-red-500 text-black' : 'bg-emerald-500 text-black'
                          }`}
                        >
                          {log.type === 'buy' ? '买入' : '平仓卖出'}
                        </span>
                        <span className="text-white font-black text-xs">{log.stockName}</span>
                      </div>
                      <div className="text-gray-400 text-[10px] font-mono mt-0.5">
                        {log.shares.toLocaleString()} 股 · 单价 {log.price.toFixed(2)} {CURRENCY.symbol} · {log.time}
                      </div>
                    </div>

                    <div
                      className={`font-black font-mono text-xs ${
                        log.type === 'buy' ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {log.type === 'buy' ? `-${log.total.toLocaleString()}` : `+${log.total.toLocaleString()}`} {CURRENCY.symbol}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
