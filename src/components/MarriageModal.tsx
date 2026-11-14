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
  BIRTH_CHANCE,
  BIRTH_MAX_AGE,
  MAX_CHILDREN,
} from '../lib/family';

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
}) => {
  const [loverCandidates, setLoverCandidates] = useState<SpouseCandidate[]>(() => generateSpouseCandidates(age).slice(0, 5));
  const [confirmLover, setConfirmLover] = useState<SpouseCandidate | null>(null);
  const [candidates, setCandidates] = useState<SpouseCandidate[]>(() => generateSpouseCandidates(age));
  const [confirming, setConfirming] = useState<SpouseCandidate | null>(null);
  const [confirmDivorce, setConfirmDivorce] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 2600);
  };

  const handleMarry = (c: SpouseCandidate) => {
    if (coins < MARRIAGE_FEE) {
      showToast(`现金不足！结婚登记规费需 ${MARRIAGE_FEE.toLocaleString()} ₽`);
      setConfirming(null);
      return;
    }
    setCoins((prev) => prev - MARRIAGE_FEE);
    setFamily((prev) => marry(prev, c, gameYear, gameMonth));
    onReputationChange?.(REP.marriage);
    setConfirming(null);
    addLifeLog('大事', `与 ${c.name} 结婚`, `${c.gender} · ${c.age} 岁 · ${c.occupation}，在帝国民政署登记结婚。`);
    showToast(`💍 恭喜！你与 ${c.name} 正式结为夫妻`);
  };

  const handleDivorce = () => {
    const formerName = family.spouse?.name;
    if (coins < DIVORCE_FEE) {
      showToast(`现金不足！离婚手续费需 ${DIVORCE_FEE.toLocaleString()} ₽`);
      setConfirmDivorce(false);
      return;
    }
    setCoins((prev) => prev - DIVORCE_FEE);
    setFamily((prev) => divorce(prev, gameYear, gameMonth));
    onReputationChange?.(REP.divorce);
    setConfirmDivorce(false);
    setCandidates(generateSpouseCandidates(age));
    addLifeLog('大事', `与 ${formerName} 离婚`, '在帝国民政署办理了离婚手续。');
    showToast(`已与 ${formerName} 解除婚姻关系`);
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
        <p className="text-gray-300 text-sm font-bold">你尚未办理出生登记，无法在民政署登记婚姻。</p>
        <button onClick={onOpenBirth} className={primaryBtn}>前往出生登记</button>
      </div>
    );
  } else if (isDeceased) {
    body = <div className={`${card} text-center text-gray-400 text-sm font-bold`}>角色已故，无法办理婚姻登记。</div>;
  } else if (spouse) {
    body = (
      <div className="space-y-3">
        <div className="bg-gradient-to-b from-[#f7e7c6] to-[#e9d3a4] border-4 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] text-[#3b2a14]">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Scroll size={18} />
            <span className="font-black tracking-widest">婚 姻 证 书</span>
          </div>
          <div className="text-center font-black text-lg">{playerName} <Heart size={16} className="inline text-rose-600 fill-rose-600 mx-1" /> {spouse.name}</div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold">
            <div className="bg-white/50 rounded-lg p-2 border border-black/30">配偶性别：{spouse.gender}</div>
            <div className="bg-white/50 rounded-lg p-2 border border-black/30">配偶年龄：{gameYear - spouse.birthYear} 岁</div>
            <div className="bg-white/50 rounded-lg p-2 border border-black/30 col-span-2">
              配偶职业：{spouse.occupation}
              <TraitTags ids={spouse.traits} dark />
            </div>
            <div className="bg-white/50 rounded-lg p-2 border border-black/30 col-span-2">
              登记日期：{spouse.marriedYear} 年 {spouse.marriedMonth} 月 · 帝国民政署
            </div>
          </div>
        </div>

        <div className={`${card} space-y-2`}>
          <div className="flex items-center gap-2 text-white font-black text-sm">
            <Baby size={16} className="text-yellow-400" /> 子嗣 {family.children.length} / {MAX_CHILDREN} 人
          </div>
          <p className="text-gray-400 text-[11px] font-bold leading-relaxed">
            婚后每推进一个月，有 {Math.round(BIRTH_CHANCE * 100)}% 的概率迎来新的家庭成员（你与配偶都不超过 {BIRTH_MAX_AGE} 岁时）。
          </p>
          <button onClick={onOpenFamily} className={`${primaryBtn} w-full flex items-center justify-center gap-1`}>
            <Users size={14} /> 查看家族世系
          </button>
        </div>

        {canTakeLover(classId, true, age) && (
          <div className={`${card} space-y-2`}>
            <div className="text-white font-black text-sm">🌹 {family.lover ? (family.lover.gender === '女' ? '情妇' : '情夫') : '结识情人'}</div>
            <p className="text-gray-400 text-[11px] font-bold leading-relaxed">
              贵族圈的隐秘往来：每月供养 {(LOVER_UPKEEP[classId] ?? LOVER_UPKEEP.noble).toLocaleString()} ₽，有 {Math.round(ILLEGITIMATE_CHANCE * 100)}% 概率生下私生子女。同时最多 1 位，现金不足时关系自动结束。
            </p>
            {family.lover ? (
              <div className="bg-[#21232e] border border-black rounded-xl p-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-white font-black text-xs">{family.lover.name}</div>
                  <div className="text-gray-400 text-[10px] font-bold">
                    {family.lover.gender} · {gameYear - family.lover.birthYear} 岁 · {family.lover.occupation} · 自 {family.lover.sinceYear}.{family.lover.sinceMonth}
                  </div>
                  <TraitTags ids={family.lover.traits} />
                </div>
                <button
                  onClick={() => {
                    setFamily((prev) => endLover(prev));
                    showToast(`已与 ${family.lover!.name} 断绝往来`);
                  }}
                  className="bg-gray-600 hover:bg-gray-500 text-white text-[10px] font-black px-2 py-1 rounded-lg border border-black cursor-pointer shrink-0"
                >
                  断绝往来
                </button>
              </div>
            ) : (
              <>
                {loverCandidates.map((c, i) => (
                  <div key={`${c.name}_${i}`} className="bg-[#21232e] border border-black rounded-xl p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-white font-black text-xs">{c.name}</div>
                      <div className="text-gray-400 text-[10px] font-bold">{c.gender} · {c.age} 岁 · {c.occupation}</div>
                      <TraitTags ids={c.traits} />
                    </div>
                    <button onClick={() => setConfirmLover(c)} className="bg-rose-400 text-black text-[10px] font-black px-2 py-1 rounded-lg border border-black cursor-pointer shrink-0">
                      结识
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setLoverCandidates(generateSpouseCandidates(age).slice(0, 5))}
                  className="w-full text-gray-300 text-[11px] font-black bg-[#21232e] py-1.5 rounded-lg border border-black cursor-pointer"
                >
                  换一批
                </button>
              </>
            )}
          </div>
        )}

        <button
          onClick={() => setConfirmDivorce(true)}
          className="w-full bg-[#21232e] hover:bg-[#2b2e3c] text-gray-300 text-xs font-black py-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer"
        >
          办理离婚（手续费 {DIVORCE_FEE.toLocaleString()} ₽）
        </button>
      </div>
    );
  } else if (yearsToWait > 0) {
    body = (
      <div className={`${card} text-center space-y-1`}>
        <p className="text-white font-black text-sm">未达法定婚龄</p>
        <p className="text-gray-400 text-xs font-bold">帝国法定婚龄为 {MARRIAGE_MIN_AGE} 岁，你现在 {age} 岁，还需等待 {yearsToWait} 年。</p>
      </div>
    );
  } else {
    body = (
      <div className="space-y-3">
        <div className={`${card} flex items-center justify-between`}>
          <div>
            <div className="text-white font-black text-sm">适婚对象</div>
            <div className="text-gray-400 text-[11px] font-bold">登记规费 {MARRIAGE_FEE.toLocaleString()} ₽ · 当前现金 {coins.toLocaleString()} ₽</div>
          </div>
          <button
            onClick={() => setCandidates(generateSpouseCandidates(age))}
            className="text-gray-200 hover:text-white flex items-center gap-1 bg-[#21232e] px-2 py-1 rounded-lg border border-black text-[11px] font-black cursor-pointer active:scale-95"
          >
            <RefreshCw size={12} /> 换一批
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
                <div className="text-gray-400 text-[11px] font-bold">{c.gender} · {c.age} 岁 · {c.occupation}</div>
                <TraitTags ids={c.traits} />
              </div>
            </div>
            <button onClick={() => setConfirming(c)} className={`${primaryBtn} shrink-0`}>求婚</button>
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
          <span className="text-white font-black text-sm">前任配偶</span>
          <span className="text-gray-400 text-[11px] font-bold">共 {formerSpouses.length} 位</span>
        </div>
        {formerSpouses.map((f, i) => {
          const months = (f.divorcedYear - f.marriedYear) * 12 + (f.divorcedMonth - f.marriedMonth);
          const childCount = family.children.filter((c) => c.otherParentName === f.name).length;
          const duration = months >= 12 ? `${Math.floor(months / 12)} 年${months % 12 ? ` ${months % 12} 个月` : ''}` : `${Math.max(months, 0)} 个月`;
          return (
            <div key={`${f.name}_${f.divorcedYear}_${i}`} className="bg-[#21232e] border border-black rounded-xl p-2.5 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full border-2 border-black flex items-center justify-center text-white font-black text-xs shrink-0 opacity-80 ${f.gender === '女' ? 'bg-[#c06a8a]' : 'bg-[#4a7aa8]'}`}>
                {f.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-black text-xs truncate">{f.name}</span>
                  <span className="text-[9px] font-black px-1 rounded border border-black bg-gray-700 text-gray-200 shrink-0">
                    {f.gender === '女' ? '前妻' : '前夫'}
                  </span>
                </div>
                <div className="text-gray-400 text-[10px] font-bold mt-0.5">
                  {f.occupation} · {f.marriedYear}.{f.marriedMonth} 结婚 → {f.divorcedYear}.{f.divorcedMonth} 离婚（{duration}）
                </div>
                {childCount > 0 && <div className="text-amber-300 text-[10px] font-bold mt-0.5">共育有 {childCount} 个孩子</div>}
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
          <span className="font-black text-xl tracking-widest">结婚登记</span>
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
              确定与 {confirming.name} 登记结婚吗？
            </p>
            <p className="text-gray-400 text-xs font-bold text-center">将支付登记规费 {MARRIAGE_FEE.toLocaleString()} ₽。</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setConfirming(null)} className="bg-gray-600 hover:bg-gray-500 text-white text-xs font-black py-2 rounded-xl border-2 border-black cursor-pointer">
                再想想
              </button>
              <button onClick={() => handleMarry(confirming)} className={primaryBtn}>确定登记</button>
            </div>
          </div>
        </div>
      )}

      {confirmLover && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]">
          <div className={`${card} max-w-sm w-full space-y-3`}>
            <p className="text-white font-black text-sm text-center">确定与 {confirmLover.name} 发展秘密关系吗？</p>
            <p className="text-gray-400 text-xs font-bold text-center">每月供养 {(LOVER_UPKEEP[classId] ?? LOVER_UPKEEP.noble).toLocaleString()} ₽。</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmLover(null)} className="bg-gray-600 hover:bg-gray-500 text-white text-xs font-black py-2 rounded-xl border-2 border-black cursor-pointer">
                再想想
              </button>
              <button
                onClick={() => {
                  setFamily((prev) => takeLover(prev, confirmLover, gameYear, gameMonth));
                  showToast(`🌹 你与 ${confirmLover.name} 开始了秘密往来`);
                  setConfirmLover(null);
                }}
                className={primaryBtn}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDivorce && spouse && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]">
          <div className={`${card} max-w-sm w-full space-y-3`}>
            <p className="text-white font-black text-sm text-center">确定与 {spouse.name} 离婚吗？</p>
            <p className="text-gray-400 text-xs font-bold text-center leading-relaxed">
              将支付手续费 {DIVORCE_FEE.toLocaleString()} ₽。{spouse.name} 将移出家族族谱，子嗣留在瓦伦丁家族；之后可以重新登记结婚。
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmDivorce(false)} className="bg-gray-600 hover:bg-gray-500 text-white text-xs font-black py-2 rounded-xl border-2 border-black cursor-pointer">
                再想想
              </button>
              <button onClick={handleDivorce} className="bg-gray-300 hover:bg-white text-black text-xs font-black py-2 rounded-xl border-2 border-black shadow-[0_3px_0_#000] cursor-pointer">
                确定离婚
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
