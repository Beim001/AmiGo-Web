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
import { Trans, useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('prison');
  const [prison, setPrison] = useState<PrisonState | null>(loadPrison);
  const [record, setRecord] = useState<CriminalRecord | null>(loadCriminalRecord);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 2500);
  };
  const money = (n: number) => `${n.toLocaleString()} ${CURRENCY.symbol}`;
  const recordActive = hasRecord(record, gameYear, gameMonth);
  const untilText = record ? t('date', { year: Math.floor((record.until - 1) / 12), month: ((record.until - 1) % 12) + 1 }) : '';

  /** 打点 months 个月；刑期打点完当即出狱 */
  const bribe = (months: number) => {
    if (!prison || months <= 0) return;
    const cost = months * BRIBE_PER_MONTH;
    if (coins < cost) return showToast(t('toast.noMoney', { cost: money(cost) }));
    setCoins((prev) => prev - cost);
    const left = prison.monthsLeft - months;
    if (left <= 0) {
      const r = recordOnRelease(prison.crime, gameYear, gameMonth);
      savePrison(null);
      saveCriminalRecord(r);
      setPrison(null);
      setRecord(r);
      addLifeLog('大事', '打点出狱', `花 ${money(cost)} 打点狱卒，提前出狱，留下前科（${CRIMINAL_RECORD_YEARS} 年）。`);
      showToast(t('toast.released', { cost: money(cost) }));
    } else {
      const next = { ...prison, monthsLeft: left };
      savePrison(next);
      setPrison(next);
      addLifeLog('大事', '打点狱卒', `花 ${money(cost)} 减刑 ${months} 个月。`);
      showToast(t('toast.reduced', { cost: money(cost), months }));
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
            <span className="text-gray-100 text-sm font-black tracking-widest">{t('title')}</span>
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
            <div className="text-rose-300 font-black text-sm">{t('serving')}</div>
            <div className="text-[11px] text-gray-200 font-bold">
              <Trans t={t} i18nKey="sentence" values={{ crime: prison.crime, sentence: prison.sentence, left: prison.monthsLeft }} components={{ r: <span className="text-rose-300" /> }} />
            </div>
            <p className="text-[10px] text-gray-400 font-bold">
              {t('restrictions', { health: PRISON_HEALTH_LOSS, affinity: PRISON_AFFINITY_LOSS })}
            </p>
            <div className="text-[11px] text-amber-300 font-black">{t('bribeRule', { cost: money(BRIBE_PER_MONTH) })}</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => bribe(1)}
                disabled={coins < BRIBE_PER_MONTH}
                className="bg-[#2b2f42] hover:bg-[#363b53] text-gray-200 text-xs font-black px-3 py-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('reduceOne', { cost: money(BRIBE_PER_MONTH) })}
              </button>
              <button
                onClick={() => bribe(allMonths)}
                disabled={coins < allMonths * BRIBE_PER_MONTH}
                className="bg-gradient-to-b from-[#ffe56c] to-[#f5b822] text-black text-xs font-black px-3 py-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('releaseNow', { cost: money(allMonths * BRIBE_PER_MONTH) })}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-1">
            <div className={`font-black text-sm ${recordActive ? 'text-amber-300' : 'text-emerald-300'}`}>
              {!isRegistered ? t('unregistered') : recordActive ? t('hasRecord') : t('clean')}
            </div>
            {recordActive && record && (
              <div className="text-[11px] text-gray-300 font-bold">
                {t('recordUntil', { crime: record.crime, until: untilText })}
              </div>
            )}
          </div>
        )}

        <div className="bg-[#21232e] border-2 border-black rounded-xl p-3 shadow-[0_2px_0_#000] space-y-1.5">
          <div className="text-white font-black text-xs">{t('lawTitle')}</div>
          <ul className="text-[10px] text-gray-400 font-bold space-y-1 list-disc pl-4">
            <li>{t('law1')}</li>
            <li>{t('law2')}</li>
            <li>{t('law3', { rep: JAIL_REPUTATION })}</li>
            <li>
              {t('law4', { years: CRIMINAL_RECORD_YEARS, category: BARRED_JOB_CATEGORY })}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
