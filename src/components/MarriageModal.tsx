import { addLifeLog } from '../lib/lifeLog';
import React, { useState } from 'react';
import { traitNames, traitById } from '../lib/traits';
import { REP } from '../lib/reputation';
import { ChevronLeft, Heart, RefreshCw, Users, Baby, Scroll } from 'lucide-react';
import {
  FamilyState,
  SpouseCandidate,
  generateSpouseCandidates,
  marry,
  canTakeLover,
  takeLover,
  endLover,
  LOVER_UPKEEP,
  ILLEGITIMATE_CHANCE,
  divorce,
  getFormerSpouses,
  DIVORCE_FEE,
  MARRIAGE_MIN_AGE,
  MARRIAGE_FEE,
  INTIMACY_MULTIPLIER,
  ADOPTION_FEE,
  ADOPTION_MARRIED_YEARS,
  adoptionBlocked,
  adoptChild,
  BIRTH_CHANCE,
  BIRTH_MAX_AGE,
  MAX_CHILDREN,
  SPOUSE_CANDIDATE_COUNT,
} from '../lib/family';
import { CURRENCY } from '../data/seasons';
import { isInPrison, PRISON_BLOCK_TEXT, candidateCount, hasActiveRecord } from '../lib/prison';
import { useTranslation } from 'react-i18next';

export interface MarriageModalProps {
  onClose: () => void;
  isRegistered: boolean;
  isDeceased: boolean;
  playerName: string;
  age: number;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  gameYear: number;
  gameMonth: number;
  family: FamilyState;
  setFamily: React.Dispatch<React.SetStateAction<FamilyState>>;
  onOpenBirth: () => void;
  onOpenFamily: () => void;
  /** 家族阶层：贵族、皇族已婚可结识情人 */
  classId?: string;
  /** 结婚 +3、离婚 -3 声望 */
  onReputationChange?: (delta: number) => void;
  /** 主角性别：结婚候选人只出现异性（第 48 题） */
  playerGender?: string | null;
}

/** 特质标签（悬停显示效果） */
const TraitTags: React.FC<{ ids?: string[]; dark?: boolean }> = ({ ids, dark }) =>
  ids && ids.length > 0 ? (
    <div className="flex flex-wrap gap-1 mt-1">
      {ids.map((id) => (
        <span
          key={id}
          title={traitById(id)?.desc}
          className={`text-[9px] font-black px-1.5 py-px rounded border ${dark ? 'bg-black/10 border-black/30 text-[#3b2a14]' : 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-200'}`}
        >
          ✦ {traitNames([id])[0]}
        </span>
      ))}
    </div>
  ) : null;

export const MarriageModal: React.FC<MarriageModalProps> = ({
  onClose,
  isRegistered,
  isDeceased,
  playerName,
  age,
  coins,
  setCoins,
  gameYear,
  gameMonth,
  family,
  setFamily,
  onOpenBirth,
  onOpenFamily,
  classId = '',
  onReputationChange,
  playerGender = null,
}) => {
  const { t } = useTranslation('marriage');
  const opposite = playerGender === '男' || playerGender === '女' ? (playerGender as '男' | '女') : null;
  const [loverCandidates, setLoverCandidates] = useState<SpouseCandidate[]>(() => generateSpouseCandidates(age).slice(0, 5));
  const [confirmLover, setConfirmLover] = useState<SpouseCandidate | null>(null);
  // 有前科时结婚候选人减半（第 67.7 题）
  const spouseCount = candidateCount(SPOUSE_CANDIDATE_COUNT, hasActiveRecord(gameYear, gameMonth));
  const [candidates, setCandidates] = useState<SpouseCandidate[]>(() => generateSpouseCandidates(age, Math.random, spouseCount, opposite));
  const [confirming, setConfirming] = useState<SpouseCandidate | null>(null);
  const [confirmDivorce, setConfirmDivorce] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 2600);
  };

  const handleMarry = (c: SpouseCandidate) => {
    // 狱中不能结婚（第 67.7 题）
    if (isInPrison()) {
      showToast(`⛓️ ${PRISON_BLOCK_TEXT}`);
      setConfirming(null);
      return;
    }
    if (coins < MARRIAGE_FEE) {
      showToast(t('toast.marryNoMoney', { fee: MARRIAGE_FEE.toLocaleString(), symbol: CURRENCY.symbol }));
      setConfirming(null);
      return;
    }
    setCoins((prev) => prev - MARRIAGE_FEE);
    setFamily((prev) => marry(prev, c, gameYear, gameMonth));
    onReputationChange?.(REP.marriage);
    setConfirming(null);
    addLifeLog('大事', `与 ${c.name} 结婚`, `${c.gender} · ${c.age} 岁 · ${c.occupation}，在帝国民政署登记结婚。`);
    showToast(t('toast.married', { name: c.name }));
  };

  const handleDivorce = () => {
    const formerName = family.spouse?.name;
    if (coins < DIVORCE_FEE) {
      showToast(t('toast.divorceNoMoney', { fee: DIVORCE_FEE.toLocaleString(), symbol: CURRENCY.symbol }));
      setConfirmDivorce(false);
      return;
    }
    setCoins((prev) => prev - DIVORCE_FEE);
    setFamily((prev) => divorce(prev, gameYear, gameMonth));
    onReputationChange?.(REP.divorce);
    setConfirmDivorce(false);
    setCandidates(generateSpouseCandidates(age, Math.random, spouseCount, opposite));
    addLifeLog('大事', `与 ${formerName} 离婚`, '在帝国民政署办理了离婚手续。');
    showToast(t('toast.divorced', { name: formerName }));
  };

  const spouse = family.spouse;
  const yearsToWait = MARRIAGE_MIN_AGE - age;

  const card = 'bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000]';
  const primaryBtn =
    'bg-rose-400 hover:bg-rose-300 text-black text-xs font-black py-2 px-3 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer';

  let body: React.ReactNode;
  if (!isRegistered) {
    body = (
      <div className={`${card} text-center space-y-3`}>
        <p className="text-gray-300 text-sm font-bold">{t('notRegistered')}</p>
        <button onClick={onOpenBirth} className={primaryBtn}>{t('goRegister')}</button>
      </div>
    );
  } else if (isDeceased) {
    body = <div className={`${card} text-center text-gray-400 text-sm font-bold`}>{t('deceased')}</div>;
  } else if (spouse) {
    body = (
      <div className="space-y-3">
        <div className="bg-gradient-to-b from-[#f7e7c6] to-[#e9d3a4] border-4 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] text-[#3b2a14]">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Scroll size={18} />
            <span className="font-black tracking-widest">{t('certificate')}</span>
          </div>
          <div className="text-center font-black text-lg">{playerName} <Heart size={16} className="inline text-rose-600 fill-rose-600 mx-1" /> {spouse.name}</div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold">
            <div className="bg-white/50 rounded-lg p-2 border border-black/30">{t('spouseGender', { gender: spouse.gender })}</div>
            <div className="bg-white/50 rounded-lg p-2 border border-black/30">{t('spouseAge', { age: gameYear - spouse.birthYear })}</div>
            <div className="bg-white/50 rounded-lg p-2 border border-black/30 col-span-2">
              {t('spouseJob', { job: spouse.occupation })}
              <TraitTags ids={spouse.traits} dark />
            </div>
            <div className="bg-white/50 rounded-lg p-2 border border-black/30 col-span-2">
              {t('marriedAt', { year: spouse.marriedYear, month: spouse.marriedMonth })}
            </div>
          </div>
        </div>

        <div className={`${card} space-y-2`}>
          <div className="flex items-center gap-2 text-white font-black text-sm">
            <Baby size={16} className="text-yellow-400" /> {t('children', { count: family.children.length, max: MAX_CHILDREN })}
          </div>
          <p className="text-gray-400 text-[11px] font-bold leading-relaxed">
            {t('birthRule', { pct: Math.round(BIRTH_CHANCE * 100) })}
          </p>
          {(() => {
            const monthKey = gameYear * 12 + gameMonth;
            const intimateNow = family.intimacyMonth === monthKey;
            const adoptReason = adoptionBlocked(family, gameYear, gameMonth);
            return (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (intimateNow) {
                      showToast(t('toast.alreadyIntimate'));
                      return;
                    }
                    setFamily((prev) => ({ ...prev, intimacyMonth: monthKey }));
                    showToast(t('toast.intimate', { name: spouse.name, multiplier: INTIMACY_MULTIPLIER }));
                  }}
                  disabled={intimateNow}
                  className="bg-rose-400 hover:bg-rose-300 text-black text-xs font-black py-2 rounded-xl border-2 border-black shadow-[0_3px_0_#000] cursor-pointer disabled:opacity-50"
                >
                  {intimateNow ? t('intimateDone') : t('intimate', { multiplier: INTIMACY_MULTIPLIER })}
                </button>
                <button
                  onClick={() => {
                    if (adoptReason) {
                      showToast(adoptReason);
                      return;
                    }
                    if (coins < ADOPTION_FEE) {
                      showToast(t('toast.adoptNoMoney', { fee: ADOPTION_FEE.toLocaleString(), symbol: CURRENCY.symbol }));
                      return;
                    }
                    const r = adoptChild(family, gameYear, gameMonth);
                    setCoins((prev) => prev - ADOPTION_FEE);
                    setFamily(r.state);
                    addLifeLog('大事', `领养 ${r.child.name}`, `与 ${spouse.name} 婚后多年无子，领养了 ${gameYear - r.child.birthYear} 岁的${r.child.gender === '女' ? '女孩' : '男孩'}。`);
                    showToast(t('toast.adopted', { name: r.child.name, age: gameYear - r.child.birthYear }));
                  }}
                  title={adoptReason ?? t('adoptFee', { fee: ADOPTION_FEE.toLocaleString(), symbol: CURRENCY.symbol })}
                  className={`${adoptReason ? 'bg-gray-600 text-gray-300' : 'bg-sky-400 hover:bg-sky-300 text-black'} text-xs font-black py-2 rounded-xl border-2 border-black shadow-[0_3px_0_#000] cursor-pointer`}
                >
                  {t('adopt', { fee: ADOPTION_FEE.toLocaleString(), symbol: CURRENCY.symbol })}
                </button>
                <p className="col-span-2 text-[10px] text-gray-400 font-bold">
                  {adoptReason ? t('adoptBlocked', { reason: adoptReason }) : t('adoptHint', { years: ADOPTION_MARRIED_YEARS })}
                </p>
              </div>
            );
          })()}
          <button onClick={onOpenFamily} className={`${primaryBtn} w-full flex items-center justify-center gap-1`}>
            <Users size={14} /> {t('viewFamily')}
          </button>
        </div>

        {canTakeLover(classId, true, age) && (
          <div className={`${card} space-y-2`}>
            <div className="text-white font-black text-sm">🌹 {family.lover ? (family.lover.gender === '女' ? t('lover.mistress') : t('lover.lover')) : t('lover.meet')}</div>
            <p className="text-gray-400 text-[11px] font-bold leading-relaxed">
              {t('lover.rules', { upkeep: (LOVER_UPKEEP[classId] ?? LOVER_UPKEEP.noble).toLocaleString(), pct: Math.round(ILLEGITIMATE_CHANCE * 100), symbol: CURRENCY.symbol })}
            </p>
            {family.lover ? (
              <div className="bg-[#21232e] border border-black rounded-xl p-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-white font-black text-xs">{family.lover.name}</div>
                  <div className="text-gray-400 text-[10px] font-bold">
                    {t('lover.meta', { gender: family.lover.gender, age: gameYear - family.lover.birthYear, job: family.lover.occupation, since: `${family.lover.sinceYear}.${family.lover.sinceMonth}` })}
                  </div>
                  <TraitTags ids={family.lover.traits} />
                </div>
                <button
                  onClick={() => {
                    setFamily((prev) => endLover(prev));
                    showToast(t('toast.loverEnded', { name: family.lover!.name }));
                  }}
                  className="bg-gray-600 hover:bg-gray-500 text-white text-[10px] font-black px-2 py-1 rounded-lg border border-black cursor-pointer shrink-0"
                >
                  {t('lover.end')}
                </button>
              </div>
            ) : (
              <>
                {loverCandidates.map((c, i) => (
                  <div key={`${c.name}_${i}`} className="bg-[#21232e] border border-black rounded-xl p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-white font-black text-xs">{c.name}</div>
                      <div className="text-gray-400 text-[10px] font-bold">{t('candidateMeta', { gender: c.gender, age: c.age, job: c.occupation })}</div>
                      <TraitTags ids={c.traits} />
                    </div>
                    <button onClick={() => setConfirmLover(c)} className="bg-rose-400 text-black text-[10px] font-black px-2 py-1 rounded-lg border border-black cursor-pointer shrink-0">
                      {t('lover.meetButton')}
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setLoverCandidates(generateSpouseCandidates(age).slice(0, 5))}
                  className="w-full text-gray-300 text-[11px] font-black bg-[#21232e] py-1.5 rounded-lg border border-black cursor-pointer"
                >
                  {t('refresh')}
                </button>
              </>
            )}
          </div>
        )}

        <button
          onClick={() => setConfirmDivorce(true)}
          className="w-full bg-[#21232e] hover:bg-[#2b2e3c] text-gray-300 text-xs font-black py-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer"
        >
          {t('divorce', { fee: DIVORCE_FEE.toLocaleString(), symbol: CURRENCY.symbol })}
        </button>
      </div>
    );
  } else if (yearsToWait > 0) {
    body = (
      <div className={`${card} text-center space-y-1`}>
        <p className="text-white font-black text-sm">{t('tooYoung')}</p>
        <p className="text-gray-400 text-xs font-bold">{t('tooYoungDesc', { min: MARRIAGE_MIN_AGE, age, years: yearsToWait })}</p>
      </div>
    );
  } else {
    body = (
      <div className="space-y-3">
        <div className={`${card} flex items-center justify-between`}>
          <div>
            <div className="text-white font-black text-sm">{t('candidates')}</div>
            <div className="text-gray-400 text-[11px] font-bold">{t('candidatesFee', { fee: MARRIAGE_FEE.toLocaleString(), coins: coins.toLocaleString(), symbol: CURRENCY.symbol })}</div>
          </div>
          <button
            onClick={() => setCandidates(generateSpouseCandidates(age, Math.random, spouseCount, opposite))}
            className="text-gray-200 hover:text-white flex items-center gap-1 bg-[#21232e] px-2 py-1 rounded-lg border border-black text-[11px] font-black cursor-pointer active:scale-95"
          >
            <RefreshCw size={12} /> {t('refresh')}
          </button>
        </div>

        {candidates.map((c, i) => (
          <div key={`${c.name}_${i}`} className={`${card} flex items-center justify-between gap-3`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-full border-2 border-black flex items-center justify-center text-white font-black shrink-0 ${c.gender === '女' ? 'bg-[#c06a8a]' : 'bg-[#4a7aa8]'}`}>
                {c.name[0]}
              </div>
              <div className="min-w-0">
                <div className="text-white font-black text-sm truncate">{c.name}</div>
                <div className="text-gray-400 text-[11px] font-bold">{t('candidateMeta', { gender: c.gender, age: c.age, job: c.occupation })}</div>
                <TraitTags ids={c.traits} />
              </div>
            </div>
            <button onClick={() => setConfirming(c)} className={`${primaryBtn} shrink-0`}>{t('propose')}</button>
          </div>
        ))}
      </div>
    );
  }

  // 前任配偶列表（最近离婚的排在最前）
  const formerSpouses = [...getFormerSpouses(family)].reverse();
  const formerList =
    isRegistered && formerSpouses.length > 0 ? (
      <div className={`${card} mt-3 space-y-2`}>
        <div className="flex items-center justify-between">
          <span className="text-white font-black text-sm">{t('former.title')}</span>
          <span className="text-gray-400 text-[11px] font-bold">{t('former.count', { count: formerSpouses.length })}</span>
        </div>
        {formerSpouses.map((f, i) => {
          const months = (f.divorcedYear - f.marriedYear) * 12 + (f.divorcedMonth - f.marriedMonth);
          const childCount = family.children.filter((c) => c.otherParentName === f.name).length;
          const duration = months >= 12 ? (months % 12 ? t('former.yearsMonths', { years: Math.floor(months / 12), months: months % 12 }) : t('former.years', { years: Math.floor(months / 12) })) : t('former.months', { months: Math.max(months, 0) });
          return (
            <div key={`${f.name}_${f.divorcedYear}_${i}`} className="bg-[#21232e] border border-black rounded-xl p-2.5 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full border-2 border-black flex items-center justify-center text-white font-black text-xs shrink-0 opacity-80 ${f.gender === '女' ? 'bg-[#c06a8a]' : 'bg-[#4a7aa8]'}`}>
                {f.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-black text-xs truncate">{f.name}</span>
                  <span className="text-[9px] font-black px-1 rounded border border-black bg-gray-700 text-gray-200 shrink-0">
                    {f.widowed ? (f.gender === '女' ? t('former.lateWife') : t('former.lateHusband')) : f.gender === '女' ? t('former.exWife') : t('former.exHusband')}
                  </span>
                </div>
                <div className="text-gray-400 text-[10px] font-bold mt-0.5">
                  {t(f.widowed ? 'former.periodWidowed' : 'former.periodDivorced', { job: f.occupation, from: `${f.marriedYear}.${f.marriedMonth}`, to: `${f.divorcedYear}.${f.divorcedMonth}`, duration })}
                </div>
                {childCount > 0 && <div className="text-amber-300 text-[10px] font-bold mt-0.5">{t('former.children', { count: childCount })}</div>}
              </div>
            </div>
          );
        })}
      </div>
    ) : null;

  return (
    <div className="absolute inset-0 bg-[#12141c] flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-200 overflow-hidden">
      {toast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-yellow-300 border-2 border-yellow-500 text-xs font-black px-4 py-2 rounded-xl shadow-[0_4px_0_#000] text-center max-w-[85%]">
          {toast}
        </div>
      )}

      <div className="bg-[#b2586a] border-b-4 border-black px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="p-1.5 bg-black/20 border-2 border-black rounded-xl active:scale-95 cursor-pointer">
          <ChevronLeft size={22} className="text-white" strokeWidth={3} />
        </button>
        <div className="flex items-center gap-2 text-white">
          <Heart size={20} className="fill-white" />
          <span className="font-black text-xl tracking-widest">{t('title')}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {body}
        {formerList}
      </div>

      {confirming && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]">
          <div className={`${card} max-w-sm w-full space-y-3`}>
            <p className="text-white font-black text-sm text-center">
              {t('confirmMarry', { name: confirming.name })}
            </p>
            <p className="text-gray-400 text-xs font-bold text-center">{t('confirmMarryFee', { fee: MARRIAGE_FEE.toLocaleString(), symbol: CURRENCY.symbol })}</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setConfirming(null)} className="bg-gray-600 hover:bg-gray-500 text-white text-xs font-black py-2 rounded-xl border-2 border-black cursor-pointer">
                {t('cancel')}
              </button>
              <button onClick={() => handleMarry(confirming)} className={primaryBtn}>{t('confirmMarryButton')}</button>
            </div>
          </div>
        </div>
      )}

      {confirmLover && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]">
          <div className={`${card} max-w-sm w-full space-y-3`}>
            <p className="text-white font-black text-sm text-center">{t('lover.confirm', { name: confirmLover.name })}</p>
            <p className="text-gray-400 text-xs font-bold text-center">{t('lover.confirmUpkeep', { upkeep: (LOVER_UPKEEP[classId] ?? LOVER_UPKEEP.noble).toLocaleString(), symbol: CURRENCY.symbol })}</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmLover(null)} className="bg-gray-600 hover:bg-gray-500 text-white text-xs font-black py-2 rounded-xl border-2 border-black cursor-pointer">
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  setFamily((prev) => takeLover(prev, confirmLover, gameYear, gameMonth));
                  showToast(t('toast.loverStarted', { name: confirmLover.name }));
                  setConfirmLover(null);
                }}
                className={primaryBtn}
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDivorce && spouse && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]">
          <div className={`${card} max-w-sm w-full space-y-3`}>
            <p className="text-white font-black text-sm text-center">{t('confirmDivorce', { name: spouse.name })}</p>
            <p className="text-gray-400 text-xs font-bold text-center leading-relaxed">
              {t('confirmDivorceDesc', { fee: DIVORCE_FEE.toLocaleString(), name: spouse.name, symbol: CURRENCY.symbol })}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmDivorce(false)} className="bg-gray-600 hover:bg-gray-500 text-white text-xs font-black py-2 rounded-xl border-2 border-black cursor-pointer">
                {t('cancel')}
              </button>
              <button onClick={handleDivorce} className="bg-gray-300 hover:bg-white text-black text-xs font-black py-2 rounded-xl border-2 border-black shadow-[0_3px_0_#000] cursor-pointer">
                {t('confirmDivorceButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
