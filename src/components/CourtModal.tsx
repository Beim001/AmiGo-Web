import React, { useState } from 'react';
import { ChevronLeft, Scale } from 'lucide-react';
import { CurrencyIcon } from './CurrencyIcon';
import { CURRENCY } from '../data/seasons';
import {
  COURT_FEE,
  LAWYER_FEE,
  LAWYER_BONUS,
  APPEAL_LOSS_EXTRA_MONTHS,
  SUIT_EXPIRE_MONTHS,
  CourtCase,
  CaseVerdict,
  activeCases,
  caseCost,
  loadCases,
  loadHistory,
  pushHistory,
  saveCases,
  tryCase,
  winChance,
} from '../lib/court';
import { loadPrison, savePrison } from '../lib/prison';
import { addLifeLog } from '../lib/lifeLog';
import { useTranslation } from 'react-i18next';

// 法院诉讼（第 67.6 题）：上诉与起诉；每个案件只能开庭一次，可加请律政士

export interface CourtModalProps {
  onClose: () => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  reputation: number;
  isRegistered: boolean;
  gameYear: number;
  gameMonth: number;
}

export const CourtModal: React.FC<CourtModalProps> = ({ onClose, coins, setCoins, reputation, isRegistered, gameYear, gameMonth }) => {
  const { t } = useTranslation('court');
  const prisonCrime = () => loadPrison()?.crime ?? null;
  const [cases, setCases] = useState<CourtCase[]>(() => activeCases(loadCases(), prisonCrime(), gameYear, gameMonth));
  const [history, setHistory] = useState<CaseVerdict[]>(loadHistory);
  const [lawyer, setLawyer] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 2600);
  };
  const money = (n: number) => `${n.toLocaleString()} ${CURRENCY.symbol}`;

  const hearCase = (c: CourtCase) => {
    if (!isRegistered) return showToast(t('toast.notRegistered'));
    const withLawyer = !!lawyer[c.id];
    const cost = caseCost(withLawyer);
    if (coins < cost) return showToast(t('toast.noMoney', { cost: money(cost) }));
    const won = tryCase(c, reputation, withLawyer);
    let text: string;
    if (c.kind === 'appeal') {
      const prison = loadPrison();
      if (won) {
        // 上诉胜诉：当即出狱，不留前科
        savePrison(null);
        text = `上诉胜诉，当庭释放，不留前科${c.claim > 0 ? `，${c.defendant}赔偿 ${money(c.claim)}` : ''}`;
      } else {
        if (prison) savePrison({ ...prison, sentence: prison.sentence + APPEAL_LOSS_EXTRA_MONTHS, monthsLeft: prison.monthsLeft + APPEAL_LOSS_EXTRA_MONTHS });
        text = `上诉被驳回，刑期加 ${APPEAL_LOSS_EXTRA_MONTHS} 个月`;
      }
    } else {
      text = won ? `胜诉，${c.defendant}赔偿 ${money(c.claim)}` : '败诉，白花了诉讼费';
    }
    setCoins((prev) => prev - cost + (won ? c.claim : 0));
    const remaining = loadCases().filter((x) => x.id !== c.id);
    saveCases(remaining);
    setCases(activeCases(remaining, prisonCrime(), gameYear, gameMonth));
    const verdict: CaseVerdict = { id: c.id, title: c.title, won, text, year: gameYear, month: gameMonth };
    pushHistory(verdict);
    setHistory(loadHistory());
    addLifeLog('大事', `${c.title}${won ? '胜诉' : '败诉'}`, `${text}（花费 ${money(cost)}${withLawyer ? '，请了律政士' : ''}）。`);
    showToast(`⚖️ ${text}`);
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
          <div className="bg-[#2a2d3e] border-2 border-amber-600/80 px-5 py-1.5 rounded-xl shadow-[0_3px_0_#000] flex items-center gap-2">
            <Scale size={18} className="text-amber-300 flex-shrink-0" />
            <span className="text-amber-100 text-sm font-black tracking-widest">{t('title')}</span>
          </div>
        </div>
        <div className="flex items-center bg-[#151722] rounded-full px-2.5 py-1 border border-black text-xs font-mono font-black">
          <CurrencyIcon size={14} className="text-yellow-400 mr-1" />
          <span>{money(coins)}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-1">
          <div className="text-white font-black text-sm">{t('noticeTitle')}</div>
          <p className="text-[10px] text-gray-400 font-bold">
            {t('notice', { fee: money(COURT_FEE), lawyerFee: money(LAWYER_FEE), lawyerBonus: Math.round(LAWYER_BONUS * 100), extra: APPEAL_LOSS_EXTRA_MONTHS, expire: SUIT_EXPIRE_MONTHS })}
          </p>
        </div>

        {cases.length === 0 ? (
          <div className="text-xs text-gray-400 font-bold text-center py-4">{t('noCases')}</div>
        ) : (
          cases.map((c) => {
            const withLawyer = !!lawyer[c.id];
            const chance = winChance(c, reputation, withLawyer);
            return (
              <div key={c.id} className="bg-[#21232e] border-2 border-black rounded-xl p-3 shadow-[0_2px_0_#000] space-y-2">
                <div>
                  <div className="text-white font-black text-xs">{c.title}</div>
                  <div className="text-[10px] text-gray-400 font-bold mt-0.5">
                    {t('defendant', { name: c.defendant })}
                    {c.noble && t('noble')} · {t('date', { year: c.year, month: c.month })}
                    {c.claim > 0 && t('claim', { amount: money(c.claim) })}
                    {c.kind === 'appeal' && t('appealHint')}
                  </div>
                </div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-300 cursor-pointer select-none">
                  <input type="checkbox" checked={withLawyer} onChange={() => setLawyer((l) => ({ ...l, [c.id]: !l[c.id] }))} className="accent-amber-500" />
                  {t('hireLawyer', { fee: money(LAWYER_FEE) })}
                </label>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black text-amber-300">{t('chance', { pct: Math.round(chance * 100) })}</span>
                  <button
                    onClick={() => hearCase(c)}
                    disabled={coins < caseCost(withLawyer)}
                    className="bg-gradient-to-b from-[#ffe56c] to-[#f5b822] text-black text-xs font-black px-3 py-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {t('trial', { cost: money(caseCost(withLawyer)) })}
                  </button>
                </div>
              </div>
            );
          })
        )}

        {history.length > 0 && (
          <div className="bg-[#21232e] border-2 border-black rounded-xl p-3 shadow-[0_2px_0_#000] space-y-1">
            <div className="text-white font-black text-xs">{t('history')}</div>
            {history.map((v) => (
              <div key={`${v.id}_${v.year}_${v.month}`} className="text-[10px] font-bold">
                <span className={v.won ? 'text-emerald-300' : 'text-rose-300'}>{v.won ? t('won') : t('lost')}</span>
                <span className="text-gray-400">
                  {' '}
                  · {v.year}.{v.month} · {v.title}：{v.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
