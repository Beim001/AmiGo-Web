import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SimEventInstance,
  SimEventDef,
  eventDef,
  optionBlocked,
  Resolution } from '../lib/simEvents';
import {
  Briefcase,
  BookOpen,
  ChevronLeft,
  CheckCircle,
  Sparkles,
  RotateCcw,
  Clock,
  Skull,
  Scroll,
  Wallet,
  Snowflake,
  Leaf,
  AlertTriangle,
  Waves,
  Package,
  Soup,
  HandCoins,
  Dices,
  Factory,
  Users,
  Bandage,
  Store,
  Pill,
  Baby,
  Trophy,
  Medal,
  Gem,
  Watch,
  Gavel,
} from 'lucide-react';
import { CURRENCY } from '../data/seasons';

const EVENT_ICONS: Record<SimEventDef['icon'], React.ElementType> = {
  wallet: Wallet,
  snow: Snowflake,
  herb: Leaf,
  alert: AlertTriangle,
  water: Waves,
  box: Package,
  bowl: Soup,
  hand: HandCoins,
  dice: Dices,
  clock: Clock,
  factory: Factory,
  users: Users,
  bandage: Bandage,
  store: Store,
  pill: Pill,
  baby: Baby,
  medal: Medal,
  ring: Gem,
  watch: Watch,
};

export interface SimTabProps {
  isRegistered?: boolean;
  health?: number;
  age?: number;
  playerName?: string;
  gameYear?: number;
  gameMonth?: number;
  onGoToBirthRegistration?: () => void;
  onResetLife?: () => void;
  /** 打开传承界面（角色去世后） */
  onOpenSuccession?: () => void;
  /** 待处理的事件（按出现先后） */
  events?: SimEventInstance[];
  coins?: number;
  simScore?: number;
  /** 最近一次推进月份没有抽到事件时的提示，例如「1870.03 本月无事发生」 */
  quietMessage?: string | null;
  /** 选择选项，返回结算结果 */
  onResolve?: (uid: string, optionIndex: number) => Resolution | null;
  /** 本月有拍卖会 */
  auctionOpen?: boolean;
  onOpenAuction?: () => void;
}

export const SimTab: React.FC<SimTabProps> = ({
  isRegistered = false,
  health = 100,
  age = 8,
  playerName,
  gameYear = 1870,
  gameMonth = 1,
  onGoToBirthRegistration,
  onResetLife,
  onOpenSuccession,
  events = [],
  coins = 0,
  simScore = 0,
  quietMessage = null,
  onResolve,
  auctionOpen = false,
  onOpenAuction,
}) => {
  const { t } = useTranslation('sim');
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ title: string; result: Resolution } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const isDeceased = isRegistered && health <= 0;


  // 1. 未出生状态引导界面
  if (!isRegistered) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#252632] pb-6 flex flex-col relative overflow-hidden select-none">
        {/* Top Header */}
        <div className="bg-[#1e293b] text-white text-center py-3 font-bold text-xl border-b-4 border-[#0f172a] relative z-20 shadow-lg flex-shrink-0">
          <div className="absolute inset-0 flex justify-center items-center opacity-30 pointer-events-none overflow-hidden">
            <div className="w-24 h-24 border-[6px] border-black rounded-full absolute -top-8 left-10" />
            <div className="w-32 h-32 border-[6px] border-black rounded-full absolute -bottom-16 right-0" />
          </div>
          <span className="relative z-10 drop-shadow-[0_2px_0_#000] font-black tracking-widest text-2xl">
            {t('title')}
          </span>
        </div>

        {/* Unborn State Placeholder */}
        <div className="flex-1 flex flex-col items-center justify-center p-5 text-center z-10 max-w-sm mx-auto w-full">
          <div className="w-full bg-[#333644] border-4 border-black rounded-t-[44px] rounded-b-2xl p-6 shadow-[0_6px_0_#000] flex flex-col items-center text-center space-y-3.5 relative overflow-hidden">
            <div className="w-16 h-16 bg-[#21232d] border-2 border-black rounded-full flex items-center justify-center shadow-inner">
              <Scroll size={30} className="text-amber-400 opacity-90" />
            </div>

            <div className="space-y-1.5 w-full">
              <div className="text-gray-400 text-[10px] font-mono font-bold tracking-widest uppercase">
                — SIMULATION PAUSED —
              </div>
              <h3 className="text-white font-black text-lg tracking-wide">
                {t('notStartedTitle')}
              </h3>
              <p className="text-gray-300 text-xs font-bold leading-relaxed">
                {t('notStartedDesc')}
              </p>
              <p className="text-gray-400 text-[11px] leading-snug">
                {t('notStartedHint')}
              </p>
            </div>

            {onGoToBirthRegistration && (
              <button
                type="button"
                onClick={onGoToBirthRegistration}
                className="w-full bg-[#fcd34d] hover:bg-[#fde047] text-black font-black text-xs py-3 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 transition-all mt-1"
              >
                <Sparkles size={16} className="text-amber-700 fill-amber-700" />
                <span>{t('goRegister')}</span>
              </button>
            )}
          </div>

          <div className="w-[96%] -mt-1 h-3.5 bg-[#20222a] border-x-4 border-b-4 border-black rounded-b-xl shadow-[0_4px_0_#000]" />
        </div>
      </div>
    );
  }

  // 2. 角色死亡/已故状态引导界面
  if (isDeceased) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#252632] pb-6 flex flex-col relative overflow-hidden select-none">
        {/* Top Header */}
        <div className="bg-[#1e293b] text-white text-center py-3 font-bold text-xl border-b-4 border-[#0f172a] relative z-20 shadow-lg flex-shrink-0">
          <div className="absolute inset-0 flex justify-center items-center opacity-30 pointer-events-none overflow-hidden">
            <div className="w-24 h-24 border-[6px] border-black rounded-full absolute -top-8 left-10" />
            <div className="w-32 h-32 border-[6px] border-black rounded-full absolute -bottom-16 right-0" />
          </div>
          <span className="relative z-10 drop-shadow-[0_2px_0_#000] font-black tracking-widest text-2xl">
            {t('title')}
          </span>
        </div>

        {/* Deceased Memorial State */}
        <div className="flex-1 flex flex-col items-center justify-center p-5 text-center z-10 max-w-sm mx-auto w-full">
          <div className="w-full bg-[#2a2c37] border-4 border-black rounded-t-[44px] rounded-b-2xl p-6 shadow-[0_6px_0_#000] flex flex-col items-center text-center space-y-3.5 relative overflow-hidden">
            <div className="w-16 h-16 bg-[#1a1b22] border-2 border-black rounded-full flex items-center justify-center shadow-inner">
              <span className="text-3xl select-none">🪦</span>
            </div>

            <div className="space-y-1.5 w-full">
              <div className="text-rose-400 font-mono text-[10px] font-bold tracking-widest uppercase">
                — R . I . P —
              </div>
              <h3 className="text-gray-100 font-black text-lg tracking-wide">
                {t('endedTitle')}
              </h3>
              <p className="text-gray-300 text-xs font-bold leading-relaxed">
                {t('endedAge', { name: playerName ?? t('defaultPlayerName'), age })}
              </p>
              <p className="text-gray-400 text-[11px] leading-relaxed">
                {t('endedDesc')}
              </p>
            </div>

            {/* 传承家业：由子嗣或兄弟姐妹继承 */}
            {onOpenSuccession && (
              <button
                onClick={onOpenSuccession}
                className="w-full bg-amber-400 hover:bg-amber-300 text-black text-xs font-black py-2.5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] cursor-pointer"
              >
                {t('inherit')}
              </button>
            )}

            {/* Reset / Rebirth Action */}
            {onResetLife && (
              <div className="w-full pt-1">
                {confirmReset ? (
                  <div className="flex flex-col gap-2 bg-[#1b1c24] p-3 rounded-xl border-2 border-rose-500/60">
                    <span className="text-xs text-rose-300 font-black">
                      {t('resetConfirm')}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmReset(false);
                          onResetLife();
                        }}
                        className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black py-2 rounded-lg border border-black cursor-pointer shadow-[0_2px_0_#000]"
                      >
                        {t('resetConfirmButton')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-black py-2 rounded-lg border border-black cursor-pointer"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="w-full bg-[#fcd34d] hover:bg-[#fde047] text-black font-black text-xs py-3 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RotateCcw size={15} />
                    <span>{t('reset')}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="w-[96%] -mt-1 h-3.5 bg-[#1a1b22] border-x-4 border-b-4 border-black rounded-b-xl shadow-[0_4px_0_#000]" />
        </div>
      </div>
    );
  }

  // 3. 详情事件弹窗（存活状态下）
  const activeInst = events.find((e) => e.uid === activeUid) || null;
  const activeDef = activeInst ? eventDef(activeInst) : undefined;
  const dateOf = (e: SimEventInstance) => t('eventDate', { year: e.year, month: e.month });

  if (activeInst && activeDef) {
    const Icon = EVENT_ICONS[activeDef.icon] || Scroll;
    return (
      <div className="flex-1 overflow-y-auto bg-[#252632] flex flex-col p-2 sm:p-4 relative custom-scrollbar">
        <div
          className="absolute top-2 sm:top-4 left-2 sm:left-4 z-20 cursor-pointer bg-black/40 p-1.5 sm:p-2 rounded-full border-2 border-black"
          onClick={() => setActiveUid(null)}
        >
          <ChevronLeft className="text-white" size={24} />
        </div>

        <div className="flex-1 mt-10 sm:mt-12 bg-[#f4ebd0] border-[4px] border-black p-3 sm:p-5 relative shadow-[0_6px_0_#000] flex flex-col">
          <div className="border-b-[4px] border-black pb-2 sm:pb-3 mb-3 sm:mb-4 flex flex-col items-center">
            <h1
              className="font-serif text-3xl sm:text-4xl font-black text-black tracking-widest text-center"
              style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}
            >
              {t('newspaper')}
            </h1>
            <div className="flex justify-between w-full text-xs sm:text-sm font-bold border-t-[3px] border-b-[3px] border-black py-1 mt-2 sm:mt-3">
              <span>{dateOf(activeInst)}</span>
              <span>{activeDef.title}</span>
            </div>
          </div>

          <h2 className="text-black text-xl sm:text-2xl font-black text-center mb-4 sm:mb-6 leading-snug">{activeDef.headline}</h2>

          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-black/5 border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0_#000] -rotate-3">
              <Icon size={40} className="text-black sm:w-12 sm:h-12" />
            </div>
          </div>

          <div className="flex-1 text-black font-bold leading-relaxed overflow-y-auto text-[14px] sm:text-[16px] whitespace-pre-wrap px-1 sm:px-2 custom-scrollbar">
            {activeDef.desc}
          </div>

          <div className="mt-4 sm:mt-8 flex flex-col gap-2 sm:gap-3">
            {activeDef.options.map((opt, idx) => {
              const blocked = optionBlocked(opt, coins);
              return (
                <button
                  key={idx}
                  disabled={!!blocked}
                  onClick={() => {
                    const result = onResolve?.(activeInst.uid, idx);
                    if (result) setLastResult({ title: activeDef.headline, result });
                    setActiveUid(null);
                  }}
                  className={`py-2.5 sm:py-3 border-[3px] border-black font-black text-black text-[15px] sm:text-[16px] shadow-[4px_4px_0_#000] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center ${
                    idx === 0 ? 'bg-[#ffeb3b]' : 'bg-[#e0e0e0]'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="text-[11px] font-bold text-black/60">{blocked || opt.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 4. 正常存活状态下的人生快报推演卡片叠放
  return (
    <div className="flex-1 overflow-y-auto bg-[#252632] pb-6 flex flex-col relative overflow-hidden">
      <div className="bg-[#1e293b] text-white text-center py-3 font-bold text-xl border-b-4 border-[#0f172a] relative z-20 shadow-lg flex-shrink-0">
        <div className="absolute inset-0 flex justify-center items-center opacity-30 pointer-events-none overflow-hidden">
          <div className="w-24 h-24 border-[6px] border-black rounded-full absolute -top-8 left-10" />
          <div className="w-32 h-32 border-[6px] border-black rounded-full absolute -bottom-16 right-0" />
        </div>
        <span className="relative z-10 drop-shadow-[0_2px_0_#000] font-black tracking-widest text-2xl">
          {t('title')}
        </span>
      </div>

      <div className="flex items-center justify-between px-4 pt-3 z-10 text-xs font-black">
        <span className="flex items-center gap-1.5 bg-[#1b1c25] text-amber-300 px-3 py-1 rounded-full border-2 border-black">
          <Trophy size={13} /> {t('score', { score: simScore })}
        </span>
        <span className="text-gray-400">{t('pending', { count: events.length })}</span>
      </div>
      {auctionOpen && onOpenAuction && (
        <button
          onClick={onOpenAuction}
          className="mx-4 mt-2 z-10 bg-amber-700 hover:bg-amber-600 border-2 border-black rounded-xl px-3 py-2 text-xs font-black text-amber-50 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Gavel size={14} /> {t('auctionOpen')}
        </button>
      )}
      {quietMessage && (
        <div className="mx-4 mt-2 z-10 bg-[#1b1c25] border-2 border-black rounded-xl px-3 py-2 text-xs font-bold text-gray-300 text-center">
          🍃 {quietMessage}
        </div>
      )}

      {events.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="w-24 h-24 bg-[#3a3b46] rounded-full flex items-center justify-center mb-4 border-4 border-black shadow-[0_4px_0_#000]">
            <CheckCircle size={48} className="text-[#a1a1aa]" />
          </div>
          <h2 className="text-white text-2xl font-black mb-2 tracking-widest" style={{ textShadow: '0 2px 0 #000' }}>
            {t('quietTitle')}
          </h2>
          <p className="text-[#a1a1aa] font-bold">{t('quietDesc')}</p>
        </div>
      ) : (
        <div className="flex-1 relative flex items-center justify-center p-6 mt-4 perspective-[1000px]">
          {events.map((inst, index) => {
            const def = eventDef(inst);
            if (!def) return null;
            const Icon = EVENT_ICONS[def.icon] || Scroll;
            const isTop = index === events.length - 1;
            const reverseIndex = events.length - 1 - index;
            const rotation = reverseIndex % 2 === 0 ? reverseIndex * 2 : -(reverseIndex * 2);
            const yOffset = reverseIndex * -12;
            const xOffset = reverseIndex % 2 === 0 ? reverseIndex * 4 : reverseIndex * -4;

            return (
              <div
                key={inst.uid}
                onClick={() => {
                  if (isTop) setActiveUid(inst.uid);
                }}
                className={`absolute w-[85%] max-w-[320px] aspect-[3/4] h-auto max-h-[75vh] min-h-[360px] bg-[#f4ebd0] border-[3px] border-black p-3 sm:p-4 flex flex-col transition-all duration-300 ${
                  isTop ? 'cursor-pointer hover:-translate-y-2 hover:shadow-[8px_12px_0_#000] shadow-[6px_8px_0_#000]' : 'shadow-[2px_2px_0_#000]'
                }`}
                style={{
                  zIndex: index,
                  transform: `translate(${xOffset}px, ${yOffset}px) rotate(${rotation}deg) scale(${1 - Math.min(reverseIndex, 3) * 0.03})`,
                  opacity: reverseIndex > 2 ? 0 : 1,
                }}
              >
                <div className="border-b-[3px] border-black pb-2 sm:pb-3 mb-2 sm:mb-3 flex flex-col items-center">
                  <h1 className="font-serif text-2xl sm:text-3xl font-black text-black tracking-widest text-center" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>
                    {t('newspaper')}
                  </h1>
                  <div className="flex justify-between w-full text-[10px] sm:text-xs font-bold border-t-[2px] border-b-[2px] border-black py-1 mt-1 sm:mt-2">
                    <span>{dateOf(inst)}</span>
                    <span>{def.title}</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <h2 className="text-lg sm:text-xl font-black text-black leading-tight mb-2 sm:mb-4 text-center px-1 sm:px-2">{def.headline}</h2>
                  <div className="flex flex-col items-center gap-2 sm:gap-3 mb-2 sm:mb-3 flex-1 overflow-hidden">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black/5 border-[2px] border-black flex items-center justify-center flex-shrink-0 -rotate-2">
                      <Icon size={28} className="text-black sm:w-9 sm:h-9" />
                    </div>
                    <p className="text-[11px] sm:text-[13px] font-bold text-gray-800 line-clamp-4 sm:line-clamp-6 leading-relaxed text-justify px-1 sm:px-2">
                      {def.desc}
                    </p>
                  </div>
                  {isTop && (
                    <div className="mt-auto flex justify-center pb-1 sm:pb-2">
                      <span className="bg-black text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold animate-pulse shadow-[2px_2px_0_#000] border-2 border-transparent">
                        {t('readMore')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {lastResult && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setLastResult(null)}>
          <div className="bg-[#f4ebd0] border-[4px] border-black p-4 max-w-xs w-full shadow-[6px_6px_0_#000] text-black space-y-2">
            <div className="text-xs font-black border-b-2 border-black pb-1">{lastResult.title}</div>
            <p className="font-bold text-sm leading-relaxed">{lastResult.result.text}</p>
            <div className="text-xs font-black flex flex-wrap gap-2">
              {lastResult.result.coins !== 0 && (
                <span className={lastResult.result.coins > 0 ? 'text-emerald-700' : 'text-red-700'}>
                  {lastResult.result.coins > 0 ? '+' : ''}{lastResult.result.coins.toLocaleString()} {CURRENCY.symbol}
                </span>
              )}
              {lastResult.result.health !== 0 && (
                <span className={lastResult.result.health > 0 ? 'text-emerald-700' : 'text-red-700'}>
                  {t('resultHealth', { delta: `${lastResult.result.health > 0 ? '+' : ''}${lastResult.result.health}` })}
                </span>
              )}
              <span className="text-amber-800">{t('resultScore', { score: lastResult.result.score })}</span>
            </div>
            <div className="text-[10px] text-black/50 font-bold text-center pt-1">{t('tapToClose')}</div>
          </div>
        </div>
      )}
    </div>
  );
};
