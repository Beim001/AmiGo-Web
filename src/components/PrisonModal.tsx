import React, { useState } from 'react';
import { ChevronLeft, Lock } from 'lucide-react';
import { CurrencyIcon } from './CurrencyIcon';
import { CURRENCY } from '../data/seasons';
import {
  BRIBE_PER_MONTH,
  CRIMINAL_RECORD_YEARS,
  PRISON_HEALTH_LOSS,
  PRISON_AFFINITY_LOSS,
  JAIL_REPUTATION,
  BARRED_JOB_CATEGORY,
  PrisonState,
  CriminalRecord,
  bribeMonths,
  hasRecord,
  loadCriminalRecord,
  loadPrison,
  recordOnRelease,
  saveCriminalRecord,
  savePrison,
} from '../lib/prison';
import { addLifeLog } from '../lib/lifeLog';

// 监狱服刑（第 67.7 题）：查看刑期与前科，花钱打点减刑

export interface PrisonModalProps {
  onClose: () => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  isRegistered: boolean;
  gameYear: number;
  gameMonth: number;
}

export const PrisonModal: React.FC<PrisonModalProps> = ({ onClose, coins, setCoins, isRegistered, gameYear, gameMonth }) => {
  const [prison, setPrison] = useState<PrisonState | null>(loadPrison);
  const [record, setRecord] = useState<CriminalRecord | null>(loadCriminalRecord);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 2500);
  };
  const money = (n: number) => `${n.toLocaleString()} ${CURRENCY.symbol}`;
  const recordActive = hasRecord(record, gameYear, gameMonth);
  const untilText = record ? `${Math.floor((record.until - 1) / 12)} 年 ${((record.until - 1) % 12) + 1} 月` : '';

  /** 打点 months 个月；刑期打点完当即出狱 */
  const bribe = (months: number) => {
    if (!prison || months <= 0) return;
    const cost = months * BRIBE_PER_MONTH;
    if (coins < cost) return showToast(`现金不足：需要 ${money(cost)}`);
    setCoins((prev) => prev - cost);
    const left = prison.monthsLeft - months;
    if (left <= 0) {
      const r = recordOnRelease(prison.crime, gameYear, gameMonth);
      savePrison(null);
      saveCriminalRecord(r);
      setPrison(null);
      setRecord(r);
      addLifeLog('大事', '打点出狱', `花 ${money(cost)} 打点狱卒，提前出狱，留下前科（${CRIMINAL_RECORD_YEARS} 年）。`);
      showToast(`🔓 打点 ${money(cost)}，提前出狱`);
    } else {
      const next = { ...prison, monthsLeft: left };
      savePrison(next);
      setPrison(next);
      addLifeLog('大事', '打点狱卒', `花 ${money(cost)} 减刑 ${months} 个月。`);
      showToast(`打点 ${money(cost)}，减刑 ${months} 个月`);
    }
  };

  const allMonths = prison ? bribeMonths(prison, Number.MAX_SAFE_INTEGER) : 0;

  return (
    <div className="absolute inset-0 bg-[#161822] flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-200 overflow-hidden font-sans text-white">
      {toast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-black/95 text-amber-300 border-2 border-amber-500 text-xs font-black px-4 py-2 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.8)] text-center max-w-[85%]">
          {toast}
        </div>
      )}

      <div className="relative w-full h-16 bg-[#1f2230] border-b-2 border-black shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20 flex items-center justify-between px-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-2 bg-[#2d3042] hover:bg-[#393d54] border-2 border-black rounded-xl active:translate-y-0.5 shadow-[0_2px_0_#000] cursor-pointer text-white flex items-center justify-center"
        >
          <ChevronLeft size={20} className="text-white" strokeWidth={3} />
        </button>
        <div className="flex-1 flex items-center justify-center pointer-events-none px-2">
          <div className="bg-[#2a2d3e] border-2 border-gray-400/80 px-5 py-1.5 rounded-xl shadow-[0_3px_0_#000] flex items-center gap-2">
            <Lock size={18} className="text-gray-200 flex-shrink-0" />
            <span className="text-gray-100 text-sm font-black tracking-widest">监狱服刑</span>
          </div>
        </div>
        <div className="flex items-center bg-[#151722] rounded-full px-2.5 py-1 border border-black text-xs font-mono font-black">
          <CurrencyIcon size={14} className="text-yellow-400 mr-1" />
          <span>{money(coins)}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {prison ? (
          <div className="bg-[#2d2f3d] border-2 border-rose-500/60 rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-2">
            <div className="text-rose-300 font-black text-sm">⛓️ 正在服刑</div>
            <div className="text-[11px] text-gray-200 font-bold">
              罪名：{prison.crime} · 刑期 {prison.sentence} 个月 · 还剩 <span className="text-rose-300">{prison.monthsLeft}</span> 个月
            </div>
            <p className="text-[10px] text-gray-400 font-bold">
              狱中不能求职、处理推演事件、去文娱场所、结婚、出国旅行，也没有零花；每月健康 -{PRISON_HEALTH_LOSS}、在世家人好感 -{PRISON_AFFINITY_LOSS}。
            </p>
            <div className="text-[11px] text-amber-300 font-black">打点狱卒：每 {money(BRIBE_PER_MONTH)} 减刑 1 个月</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => bribe(1)}
                disabled={coins < BRIBE_PER_MONTH}
                className="bg-[#2b2f42] hover:bg-[#363b53] text-gray-200 text-xs font-black px-3 py-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                减刑 1 个月（{money(BRIBE_PER_MONTH)}）
              </button>
              <button
                onClick={() => bribe(allMonths)}
                disabled={coins < allMonths * BRIBE_PER_MONTH}
                className="bg-gradient-to-b from-[#ffe56c] to-[#f5b822] text-black text-xs font-black px-3 py-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                立即出狱（{money(allMonths * BRIBE_PER_MONTH)}）
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-1">
            <div className={`font-black text-sm ${recordActive ? 'text-amber-300' : 'text-emerald-300'}`}>
              {!isRegistered ? '尚未出生登记' : recordActive ? '⚠️ 有前科在身' : '✅ 清白之身'}
            </div>
            {recordActive && record && (
              <div className="text-[11px] text-gray-300 font-bold">
                罪名：{record.crime} · 前科记录到 {untilText} 为止
              </div>
            )}
          </div>
        )}

        <div className="bg-[#21232e] border-2 border-black rounded-xl p-3 shadow-[0_2px_0_#000] space-y-1.5">
          <div className="text-white font-black text-xs">帝国刑律</div>
          <ul className="text-[10px] text-gray-400 font-bold space-y-1 list-disc pl-4">
            <li>走私、偷窃、斗殴、伪造票据等冒险失败会入狱 3–12 个月；平民、乞丐冲撞贵族也会被押进大牢。</li>
            <li>私藏失物、地下赌局被抓，或在赌场、斗鸡场遇上巡捕查抄，会被拘留 1 个月。</li>
            <li>入狱时丢掉工作，声望 {JAIL_REPUTATION}。</li>
            <li>
              出狱后留前科 {CRIMINAL_RECORD_YEARS} 年：{BARRED_JOB_CATEGORY}类岗位不录用，结婚候选人减半。服刑与前科只跟着本人，传承后继承人不受影响。
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
