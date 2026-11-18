import React, { useState } from 'react';
import { ChevronLeft, HeartHandshake, Lock } from 'lucide-react';
import { CurrencyIcon } from './CurrencyIcon';
import { CURRENCY } from '../data/seasons';
import {
  RELIEFS,
  RELIEF_KEY,
  RELIEF_WEALTH_LIMIT,
  RELIEF_HEALTH_LIMIT,
  FUTURE_WELFARE,
  ReliefDef,
  ReliefRecord,
  applyRelief,
  earnsBeggarKing,
  nextReliefRecord,
  parseReliefRecord,
  reliefBlocked,
} from '../lib/welfare';
import { loadStored, saveStored } from '../lib/storage';
import { addLifeLog } from '../lib/lifeLog';
import { LAST_WORK_MONTH_KEY } from '../lib/monthly';
import { unlockAchievement } from '../lib/achievements';

// 社会福利（第 67.5 题）：帝国时期只有教会救济，每季度可领一次；失业救济、养老金标注联邦时代开放

export interface WelfareModalProps {
  onClose: () => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  health: number;
  setHealth: React.Dispatch<React.SetStateAction<number>>;
  bankDeposit: number;
  isRegistered: boolean;
  gameYear: number;
  gameMonth: number;
}

export const WelfareModal: React.FC<WelfareModalProps> = ({ onClose, coins, setCoins, health, setHealth, bankDeposit, isRegistered, gameYear, gameMonth }) => {
  const [record, setRecord] = useState<ReliefRecord | null>(() => parseReliefRecord(loadStored<unknown>(RELIEF_KEY, null)));
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 2500);
  };

  const wealth = coins + bankDeposit;
  const blocked = reliefBlocked({ isRegistered, wealth, health, year: gameYear, month: gameMonth, record });

  const claim = (relief: ReliefDef) => {
    if (blocked) {
      showToast(blocked);
      return;
    }
    const r = applyRelief(relief, health);
    if (r.coins) setCoins((prev) => prev + r.coins);
    if (r.health !== health) setHealth(r.health);
    const next = nextReliefRecord(record, gameYear, gameMonth);
    setRecord(next);
    saveStored(RELIEF_KEY, next);
    if (earnsBeggarKing(next, loadStored<number | null>(LAST_WORK_MONTH_KEY, null))) unlockAchievement('beggar_king');
    const gain = r.coins ? `+${r.coins.toLocaleString()} ${CURRENCY.symbol}` : `健康 +${r.health - health}`;
    addLifeLog('财富', `领取${relief.name}`, `家境困难，领到${relief.name}（${gain}）。`);
    showToast(`🙏 领到${relief.name}（${gain}）`);
  };

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
          <div className="bg-[#2a2d3e] border-2 border-pink-500/80 px-5 py-1.5 rounded-xl shadow-[0_3px_0_#000] flex items-center gap-2">
            <HeartHandshake size={18} className="text-pink-300 flex-shrink-0" />
            <span className="text-pink-200 text-sm font-black tracking-widest">社会福利</span>
          </div>
        </div>
        <div className="flex items-center bg-[#151722] rounded-full px-2.5 py-1 border border-black text-xs font-mono font-black">
          <CurrencyIcon size={14} className="text-yellow-400 mr-1" />
          <span>{coins.toLocaleString()} {CURRENCY.symbol}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-1.5">
          <div className="text-white font-black text-sm">教会救济</div>
          <p className="text-[11px] text-gray-300 font-bold">
            帝国时期没有官方的社会福利，贫苦人家只能求助于宗教机构。家里现金加存款不足 {RELIEF_WEALTH_LIMIT.toLocaleString()} {CURRENCY.symbol}，或健康低于{' '}
            {RELIEF_HEALTH_LIMIT} 时，每个季度可以领一次救济（两种任选其一）。
          </p>
          <div className="text-[11px] font-bold text-gray-400">
            现在：现金 + 存款 {wealth.toLocaleString()} {CURRENCY.symbol} · 健康 {health}
          </div>
          <div className={`text-[11px] font-black ${blocked ? 'text-rose-300' : 'text-emerald-300'}`}>{blocked ?? '✅ 本季度可以领取'}</div>
          {record && record.streak > 1 && <div className="text-[10px] text-gray-400 font-bold">已连续 {record.streak} 个季度领取救济</div>}
        </div>

        {RELIEFS.map((r) => (
          <div key={r.id} className="bg-[#21232e] border-2 border-black rounded-xl p-3 flex items-center justify-between gap-2 shadow-[0_2px_0_#000]">
            <div className="min-w-0">
              <div className="text-white font-black text-xs">{r.name}</div>
              <div className="text-[10px] text-gray-400 font-bold mt-0.5">{r.desc}</div>
              <div className="text-[11px] text-amber-300 font-black mt-1">
                {r.coins ? `+${r.coins.toLocaleString()} ${CURRENCY.symbol}` : `健康 +${r.health}`}
              </div>
            </div>
            <button
              onClick={() => claim(r)}
              disabled={!!blocked}
              className="bg-gradient-to-b from-[#ffe56c] to-[#f5b822] text-black text-xs font-black px-4 py-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              领取
            </button>
          </div>
        ))}

        <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-2">
          <div className="text-white font-black text-sm">其他福利</div>
          {FUTURE_WELFARE.map((w) => (
            <div key={w.name} className="flex items-start gap-2 text-[11px] font-bold">
              <Lock size={13} className="text-gray-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-gray-300">{w.name}</span>
                <span className="text-gray-500">：联邦时代开放（{w.note}）</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
