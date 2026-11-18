import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  Bookmark,
} from 'lucide-react';
import { CurrencyIcon } from './CurrencyIcon';
import { CURRENCY } from '../data/seasons';
import { useTranslation } from 'react-i18next';

export interface CalendarModalProps {
  onClose: () => void;
  gameYear: number;
  gameMonth: number;
  onNextMonth: () => void;
  coins: number;
}

interface MonthEvent {
  title: string;
  desc: string;
  tag: string;
  season: string;
}

const MONTH_EVENTS: Record<number, MonthEvent> = {
  1: {
    title: '新春复苏与新程',
    desc: '新年开工贺词发布，各大工厂全面开工，市场呈现欣欣向荣之气。',
    tag: '新年开工',
    season: '凛冬腊月',
  },
  2: {
    title: '冬猎与保暖集市',
    desc: '商会举办冬猎大典，保暖服饰与皮革大畅销。',
    tag: '冬季集市',
    season: '凛冬尾声',
  },
  3: {
    title: '春耕开工与银行低息',
    desc: '远郊农庄春播开工，中央银行下调企业贷款基准利率，促进资金流动。',
    tag: '春耕复苏',
    season: '早春初醒',
  },
  4: {
    title: '蒸汽与工业博览盛会',
    desc: '展出前沿蒸汽机与新型发电机，各大重工业股票关注度大增。',
    tag: '工业盛会',
    season: '暖春盛景',
  },
  5: {
    title: '杰出企业授勋大典',
    desc: '财政部对纳税大户与杰出企业家颁发勋章，全城商业名望全面上升。',
    tag: '授勋大典',
    season: '初夏拂风',
  },
  6: {
    title: '年中结算与股份分红',
    desc: '各大企业发放年中股息，全城举行半年度商品集市，资金充沛。',
    tag: '年中分红',
    season: '仲夏高光',
  },
  7: {
    title: '海事联合演习',
    desc: '海事部门在港口举行演习，造船与重工业板块备受瞩目。',
    tag: '海事演习',
    season: '盛夏炽阳',
  },
  8: {
    title: '温泉疗养与健康避暑',
    desc: '社会各界赴温泉疗养院避暑，医药恢复液与健康服务需求爆棚。',
    tag: '温泉避暑',
    season: '晚夏避暑',
  },
  9: {
    title: '秋收丰收与贸易盛会',
    desc: '农副产品大量上市，跨境贸易高盈余基金收益创新高，全城庆祝丰收。',
    tag: '秋收丰收',
    season: '金秋丰硕',
  },
  10: {
    title: '歌剧艺术季盛典',
    desc: '歌剧院盛大开幕，高级定制服装与奢侈品热销，名流汇聚。',
    tag: '歌剧盛典',
    season: '深秋金叶',
  },
  11: {
    title: '冬储备战与采暖峰会',
    desc: '商会与市民提前筹备煤炭与采暖设备，大宗商品交易量大幅上升。',
    tag: '冬储备战',
    season: '立冬初寒',
  },
  12: {
    title: '年终结算与跨年狂欢',
    desc: '统计局公布全年 GDP 数据，银行发放全年利息，举行跨年盛宴。',
    tag: '跨年狂欢',
    season: '岁末隆冬',
  },
};

export const CalendarModal: React.FC<CalendarModalProps> = ({
  onClose,
  gameYear,
  gameMonth,
  onNextMonth,
  coins,
}) => {
  const { t } = useTranslation('calendar');
  const [viewYear, setViewYear] = useState(gameYear);
  const [selectedMonth, setSelectedMonth] = useState(gameMonth);

  const activeEvent = MONTH_EVENTS[selectedMonth] || MONTH_EVENTS[1];
  const isCurrentGameMonth = viewYear === gameYear && selectedMonth === gameMonth;

  // 30 days grid
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);
  const weekDays = [t('weekdays.d0'), t('weekdays.d1'), t('weekdays.d2'), t('weekdays.d3'), t('weekdays.d4'), t('weekdays.d5'), t('weekdays.d6')];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex justify-center items-center p-3 font-sans text-white">
      {/* Calendar Card Container with Classic Desk Calendar Top Binder Header */}
      <div className="bg-[#1c1d25] border-2 border-black rounded-2xl w-full max-w-md h-[92vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative">
        
        {/* Desk Calendar Top Binder Header with Metal Ring Holders */}
        <div className="relative w-full bg-[#8f1d1d] border-b-2 border-black px-3 pt-4 pb-3 shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20 flex-shrink-0">
          {/* Calendar Ring Binder Hooks */}
          <div className="absolute -top-3 left-0 right-0 flex justify-around pointer-events-none px-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-3.5 h-5 bg-[#2d3042] border-2 border-black rounded-sm shadow-[0_2px_0_#000]"
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="p-2 bg-[#2d3042] hover:bg-[#393d54] border-2 border-black rounded-xl active:translate-y-0.5 shadow-[0_2px_0_#000] cursor-pointer text-white flex items-center justify-center transition-all z-10"
            >
              <ChevronLeft size={20} className="text-white" strokeWidth={3} />
            </button>

            <div className="flex-1 flex items-center justify-center pointer-events-none px-2">
              <div className="bg-[#1c1d25] border-2 border-black px-6 py-1.5 rounded-xl shadow-[0_2px_0_#000] flex items-center justify-center">
                <span className="text-white text-base font-black tracking-widest">
                  {t('title')}
                </span>
              </div>
            </div>

            <div className="flex items-center bg-[#1c1d25] rounded-xl px-2.5 py-1 border-2 border-black text-xs font-mono font-black shadow-[0_2px_0_#000] z-10">
              <CurrencyIcon size={14} className="text-yellow-400 mr-1" />
              <span>{coins.toLocaleString()} {CURRENCY.symbol}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Year Navigator */}
          <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3 shadow-[0_4px_0_#000] flex items-center justify-between">
            <button
              onClick={() => setViewYear((prev) => Math.max(1870, prev - 1))}
              disabled={viewYear <= 1870}
              className="p-2 rounded-xl bg-[#21232e] hover:bg-[#323546] border-2 border-black text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:translate-y-0.5 shadow-[0_2px_0_#000] transition-all"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="text-center">
              <span className="text-[10px] text-gray-400 font-bold tracking-wider">
                {t('year')}
              </span>
              <div className="flex items-center gap-2 justify-center">
                <span className="text-xl font-black font-mono tracking-widest text-white">
                  {t('yearValue', { year: viewYear })}
                </span>
                {viewYear === gameYear && (
                  <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {t('current')}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setViewYear((prev) => prev + 1)}
              className="p-2 rounded-xl bg-[#21232e] hover:bg-[#323546] border-2 border-black text-gray-200 cursor-pointer active:translate-y-0.5 shadow-[0_2px_0_#000] transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Month Grid */}
          <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3 shadow-[0_4px_0_#000]">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Clock size={14} className="text-amber-400" /> {t('chooseMonth')}
              </span>
              <span className="text-[11px] font-mono text-gray-400">
                {viewYear}.{selectedMonth < 10 ? `0${selectedMonth}` : selectedMonth}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const isSelected = selectedMonth === m;
                const isCurrentGame = viewYear === gameYear && gameMonth === m;

                return (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    className={`py-2 px-1 rounded-xl border-2 text-xs font-black transition-all cursor-pointer flex flex-col items-center relative ${
                      isSelected
                        ? 'bg-amber-400 text-black border-black shadow-[0_2px_0_#000]'
                        : isCurrentGame
                        ? 'bg-[#1a382b] text-emerald-300 border-emerald-500 shadow-[0_2px_0_#000]'
                        : 'bg-[#21232e] text-gray-300 border-black shadow-[0_2px_0_#000] hover:bg-[#323546]'
                    }`}
                  >
                    <span>{t('month', { month: m })}</span>
                    <span className="text-[9px] font-normal opacity-80 mt-0.5">
                      {MONTH_EVENTS[m]?.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Month Event Card */}
          <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3.5 shadow-[0_4px_0_#000] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-white">{activeEvent.title}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#21232e] border border-black text-gray-300">
                {activeEvent.season}
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {activeEvent.desc}
            </p>
          </div>

          {/* Days Grid */}
          <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3.5 shadow-[0_4px_0_#000] space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Bookmark size={14} className="text-amber-400" /> {t('board', { month: selectedMonth })}
              </span>
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 border-b border-black pb-1.5">
              {weekDays.map((d, idx) => (
                <div key={idx}>{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {daysInMonth.map((day) => {
                const isToday = isCurrentGameMonth && day === 15;
                const isPayday = day === 1;

                return (
                  <div
                    key={day}
                    className={`h-9 rounded-xl border-2 border-black flex flex-col items-center justify-center relative text-xs font-mono font-bold transition-all shadow-[0_2px_0_#000] ${
                      isToday
                        ? 'bg-amber-400 text-black'
                        : isPayday
                        ? 'bg-[#2a271d] text-amber-300'
                        : 'bg-[#21232e] text-gray-300'
                    }`}
                  >
                    <span>{day}</span>
                    {isPayday && (
                      <span className="text-[8px] text-amber-300 -mt-1 font-sans">
                        {t('salary')}
                      </span>
                    )}
                    {isToday && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black px-1 rounded-full border border-black">
                        {t('today')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-[0_4px_0_#000]">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-gray-300 font-bold flex items-center gap-1.5">
                <CurrencyIcon size={14} className="text-amber-400" />
                {t('monthlyIncome')}<span className="font-mono text-emerald-400 font-bold">+1,500 {CURRENCY.symbol}</span>
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                {t('cash', { coins: coins.toLocaleString(), symbol: CURRENCY.symbol })}
              </span>
            </div>

            <button
              onClick={() => {
                onNextMonth();
                let nextM = gameMonth + 1;
                let nextY = gameYear;
                if (nextM > 12) {
                  nextM = 1;
                  nextY += 1;
                }
                setViewYear(nextY);
                setSelectedMonth(nextM);
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm py-3 rounded-xl border-2 border-black shadow-[0_3px_0_#000] cursor-pointer active:translate-y-0.5 flex items-center justify-center gap-2 transition-transform"
            >
              <Sparkles size={16} /> {t('advance', { symbol: CURRENCY.symbol })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
