import React, { useState } from 'react';
import { traitNames, affinityBonus, traitById } from '../lib/traits';
import type { RankedFamily } from '../lib/familyRank';
import { wealthScore } from '../lib/familyRank';
import type { Guardianship } from '../lib/guardianship';
import { reputationLevel } from '../lib/reputation';
import { OwnedHeirloom, heirloomById, QUALITY_STYLE, HeirloomDef } from '../lib/heirlooms';
import { Medal, Watch, Gem, BookOpen, Swords, ScrollText, Amphora, Map as MapIcon2, Gavel } from 'lucide-react';
import { nextPromotion, classById } from '../lib/lineage';
import { applySurname } from '../lib/names';
import { recordGiftsGiven } from '../lib/achievements';
import { GiftInventory, giftById, giftAffinityGain, removeGift, tasteOf, GIFT_QUALITY_STYLE, GIFT_TASTE_LABEL } from '../lib/gifts';
import { validatePlayerName } from '../utils/sensitiveWords';
import { ShieldCheck, GitFork, Crown, Building2, Shield, Sparkles, Heart, Baby } from 'lucide-react';
import {
  FamilyState,
  FamilyMemberView,
  InteractionKind,
  GENERATIONS,
  GIFT_COST,
  CONSULT_REWARD_MIN,
  CONSULT_REWARD_MAX,
  SPAR_HEALTH_GAIN,
  AFFINITY_GAIN,
  buildFamilyMembers,
  getOrigin,
  renameChild,
  DISCONTENT_THRESHOLD,
  SPLIT_AFTER_MONTHS,
  buildChronicles,
  canInteract,
  canDoInteraction,
  applyInteraction,
} from '../lib/family';


export interface FamilyTabProps {
  isRegistered: boolean;
  playerName: string;
  gender: string | null;
  age: number;
  playerOccupation: string;
  gameYear: number;
  gameMonth: number;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  setHealth: React.Dispatch<React.SetStateAction<number>>;
  family: FamilyState;
  setFamily: React.Dispatch<React.SetStateAction<FamilyState>>;
  onOpenMarriage: () => void;
  onGoToBirthRegistration: () => void;
  /** 当家人（玩家）的特质：「亲和」互动好感额外 +1 */
  playerTraits?: string[];
  reputation?: number;
  ranking?: RankedFamily[];
  cohesion?: number;
  wealth?: number;
  guardianship?: Guardianship | null;
  heirlooms?: OwnedHeirloom[];
  /** 本月有拍卖会 */
  auctionOpen?: boolean;
  onOpenAuction?: () => void;
  /** 抽奖得到的礼物背包 */
  giftInventory?: GiftInventory;
  setGiftInventory?: React.Dispatch<React.SetStateAction<GiftInventory>>;
}

export const FamilyTab: React.FC<FamilyTabProps> = ({
  isRegistered,
  playerName,
  gender,
  age,
  playerOccupation,
  gameYear,
  gameMonth,
  coins,
  setCoins,
  setHealth,
  family,
  setFamily,
  onOpenMarriage,
  onGoToBirthRegistration,
  playerTraits = [],
  reputation = 0,
  ranking = [],
  cohesion = 0,
  wealth = 0,
  guardianship = null,
  heirlooms = [],
  auctionOpen = false,
  onOpenAuction,
  giftInventory = {},
  setGiftInventory,
}) => {
  const [subTab, setSubTab] = useState<'tree' | 'ranking' | 'heirlooms' | 'chronicles'>('tree');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((prev) => (prev === msg ? null : prev)), 3000);
  };

  const members = buildFamilyMembers(family, {
    playerName,
    playerGender: gender,
    playerAge: age,
    playerOccupation,
    gameYear,
    gameMonth,
  });
  const chronicles = buildChronicles(family, gameYear, gameMonth);
  const origin = getOrigin(family);
  const selectedMember = members.find((m) => m.id === selectedId) || null;

  const livingCount = members.filter((m) => m.status !== '已故').length;
  const generationCount = family.children.length > 0 ? 4 : 3;
  const visibleGenerations = GENERATIONS.filter((g) => members.some((m) => m.generation === g));

  const handleInteraction = (member: FamilyMemberView, kind: InteractionKind) => {
    const blocked = canInteract(family, member, gameYear, gameMonth) || canDoInteraction(member, kind, age);
    if (blocked) {
      showToast(blocked);
      return;
    }

    if (kind === 'gift') {
      if (coins < GIFT_COST) {
        showToast(`现金不足！准备礼物需要 ${GIFT_COST.toLocaleString()} ₽`);
        return;
      }
      setCoins((prev) => prev - GIFT_COST);
      recordGiftsGiven(1);
    }

    setFamily((prev) => applyInteraction(prev, member, kind, gameYear, gameMonth, affinityBonus(playerTraits)));
    const newAffinity = Math.min(100, member.affinity + AFFINITY_GAIN[kind] + affinityBonus(playerTraits));

    if (kind === 'spar') {
      setHealth((prev) => Math.min(100, prev + SPAR_HEALTH_GAIN));
      showToast(`你与 ${member.name} 切磋交流，健康 +${SPAR_HEALTH_GAIN}，好感度 ${newAffinity}%`);
    } else if (kind === 'consult') {
      const reward = CONSULT_REWARD_MIN + Math.floor(Math.random() * (CONSULT_REWARD_MAX - CONSULT_REWARD_MIN + 1));
      setCoins((prev) => prev + reward);
      showToast(`向 ${member.name} 请教，获得资助 +${reward.toLocaleString()} ₽，好感度 ${newAffinity}%`);
    } else {
      showToast(`送给 ${member.name} 一份礼物（-${GIFT_COST.toLocaleString()} ₽），好感度 ${newAffinity}%`);
    }
    setSelectedId(null);
  };

  // 送出背包里的礼物（第 35 题）：按品质与喜好增加好感，算作本月互动
  const handleGiveGift = (member: FamilyMemberView, giftId: string) => {
    const blocked = canInteract(family, member, gameYear, gameMonth);
    if (blocked) {
      showToast(blocked);
      return;
    }
    const gift = giftById(giftId);
    const remaining = removeGift(giftInventory, giftId);
    if (!gift || !remaining || !setGiftInventory) {
      showToast('背包里没有这件礼物');
      return;
    }
    const gain = giftAffinityGain(gift, member, family.giftTastes);
    const bonus = affinityBonus(playerTraits);
    setGiftInventory(remaining);
    recordGiftsGiven(1);
    setFamily((prev) => applyInteraction(prev, member, 'gift', gameYear, gameMonth, bonus, gain));
    const newAffinity = Math.min(100, member.affinity + gain + bonus);
    const liked = tasteOf(member, family.giftTastes) === gift.taste;
    showToast(`送给 ${member.name}「${gift.name}」${liked ? '，对方非常喜欢！' : '，'}好感 +${gain + bonus}（${newAffinity}%）`);
    setSelectedId(null);
  };

  if (!isRegistered) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#252632] flex flex-col items-center justify-center p-6 text-center gap-3">
        <ShieldCheck size={48} className="text-yellow-400" />
        <p className="text-white font-black">尚未录入家族世系</p>
        <p className="text-gray-400 text-xs font-bold">完成出生登记后，会随机决定你出身的家族（从乞丐到皇族），并记入族谱。</p>
        <button
          onClick={onGoToBirthRegistration}
          className="bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black py-2 px-4 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer"
        >
          前往出生登记
        </button>
      </div>
    );
  }

  const blockedThisMonth = selectedMember ? canInteract(family, selectedMember, gameYear, gameMonth) : null;
  const actionBtn = (kind: InteractionKind, label: string, color: string) => {
    const reason = selectedMember ? blockedThisMonth || canDoInteraction(selectedMember, kind, age) : null;
    return (
      <button
        onClick={() => selectedMember && handleInteraction(selectedMember, kind)}
        title={reason || undefined}
        className={`${reason ? 'bg-gray-600 text-gray-300' : `${color} text-black`} text-xs font-black py-2 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#252632] pb-6 flex flex-col relative">
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-black/90 text-yellow-300 border-2 border-yellow-500 text-xs font-black px-4 py-2 rounded-xl shadow-[0_4px_0_#000] animate-in fade-in slide-in-from-top-2 duration-200 text-center max-w-[85%] pointer-events-none">
          {toastMessage}
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-[#a62a2a] text-white text-center py-3 font-bold text-xl border-b-4 border-[#6e1d1d] relative z-10 shadow-lg flex-shrink-0">
        <div className="absolute inset-0 flex justify-center items-center opacity-30 pointer-events-none overflow-hidden">
          <div className="w-24 h-24 border-[6px] border-black rounded-full absolute -top-8 left-10"></div>
          <div className="w-32 h-32 border-[6px] border-black rounded-full absolute -bottom-16 right-0"></div>
        </div>
        <span className="relative z-10 drop-shadow-[0_2px_0_#000] font-black tracking-widest text-2xl">家族世系</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Family Crest & Overview Card */}
        <div className="bg-[#2d2f3d] border-2 border-black rounded-xl p-3.5 shadow-[0_4px_0_#000] relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-[#8a6538] border-2 border-black flex items-center justify-center shadow-[0_2px_0_#000] flex-shrink-0">
              <ShieldCheck size={32} className="text-yellow-300 drop-shadow-[0_2px_0_#000]" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-black text-lg drop-shadow-[0_1.5px_0_#000]">{origin.surname}家族</h2>
                <span className="text-[10px] font-black bg-yellow-400 text-black px-2 py-0.5 rounded border border-black shadow-[0_1px_0_#000]">
                  {origin.classLabel}
                </span>
              </div>
              <p className="text-gray-300 text-xs font-bold mt-1 italic">{origin.isValentine ? '“坚忍如钢，智慧永存”' : `${origin.classLabel}出身 · 卡罗尼亚帝国`}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-700/80 text-center">
            <div className="bg-[#21232e] p-1.5 rounded-lg border border-black">
              <div className="text-[10px] text-gray-400 font-bold">传承</div>
              <div className="text-yellow-400 font-black text-sm">{generationCount} 代</div>
            </div>
            <div className="bg-[#21232e] p-1.5 rounded-lg border border-black">
              <div className="text-[10px] text-gray-400 font-bold">在世族员</div>
              <div className="text-white font-black text-sm">{livingCount} 人</div>
            </div>
            <div className="bg-[#21232e] p-1.5 rounded-lg border border-black">
              <div className="text-[10px] text-gray-400 font-bold">婚姻</div>
              <div className={`font-black text-xs mt-0.5 truncate ${family.spouse ? 'text-rose-300' : 'text-gray-400'}`}>
                {family.spouse ? '已婚' : '未婚'}
              </div>
            </div>
            <div className="bg-[#21232e] p-1.5 rounded-lg border border-black">
              <div className="text-[10px] text-gray-400 font-bold">子嗣</div>
              <div className="text-amber-300 font-black text-sm">{family.children.length} 人</div>
            </div>
          </div>

          {guardianship && (
            <div className="mt-3 bg-sky-950/70 border-2 border-sky-500/60 rounded-xl p-2.5 text-[11px] font-bold text-sky-100">
              {guardianship.phase === 'holding'
                ? `👪 监护托管：${guardianship.guardianName}代管一半家产 ${guardianship.held.toLocaleString()} ₽，你年满 18 岁时返还。`
                : `🙏 赡养${guardianship.guardianName}：每月上缴 ${guardianship.supportPerMonth.toLocaleString()} ₽，还剩 ${guardianship.supportMonthsLeft} 个月。`}
            </div>
          )}
          {(() => {
            const unhappy = members.filter((m) => !m.isPlayer && m.status !== '已故' && m.age >= 18 && (family.discontent?.[m.id] ?? 0) > 0);
            return unhappy.length > 0 ? (
              <div className="mt-3 bg-red-950/70 border-2 border-red-500/60 rounded-xl p-2.5 text-[11px] font-bold text-red-100 space-y-0.5">
                <div className="text-red-300 font-black">⚠️ 族人不满（好感低于 {DISCONTENT_THRESHOLD}% 连续 {SPLIT_AFTER_MONTHS} 个月的旁系会分家）</div>
                {unhappy.map((m) => (
                  <div key={m.id}>
                    {m.relation} {m.name}：好感 {m.affinity}%，已不满 {family.discontent?.[m.id]} 个月
                  </div>
                ))}
              </div>
            ) : null;
          })()}

          {!family.spouse && (
            <button
              onClick={onOpenMarriage}
              className="mt-3 w-full bg-rose-400 hover:bg-rose-300 text-black text-xs font-black py-2 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Heart size={14} /> 前往结婚登记
            </button>
          )}
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex bg-[#21232e] p-1 rounded-xl border-2 border-black gap-1 shadow-[0_2px_0_#000]">
          {([
            ['tree', '世系族谱'],
            ['ranking', '家族排行'],
            ['heirlooms', '传家宝'],
            ['chronicles', '家族大事记'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSubTab(id)}
              className={`flex-1 py-1.5 text-xs font-black rounded-lg border transition-all ${
                subTab === id ? 'bg-yellow-400 text-black border-black shadow-[0_1px_0_#000]' : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab 1: 世系族谱 */}
        {subTab === 'tree' && (
          <div className="space-y-4">
            {visibleGenerations.map((gen) => (
              <div key={gen} className="bg-[#2d2f3d] border-2 border-black rounded-xl p-3 shadow-[0_4px_0_#000]">
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-700">
                  {gen === '子辈' ? <Baby size={16} className="text-yellow-400" /> : <GitFork size={16} className="text-yellow-400" />}
                  <span className="text-yellow-400 font-black text-xs tracking-wider">{gen}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {members
                    .filter((m) => m.generation === gen)
                    .map((member) => (
                      <div
                        key={member.id}
                        onClick={() => {
                          setSelectedId(member.id);
                          setNameDraft('');
                        }}
                        className={`bg-[#21232e] border-2 rounded-lg p-2.5 flex items-center justify-between cursor-pointer hover:border-yellow-400 transition-all shadow-[0_2px_0_#000] active:translate-y-0.5 ${member.isPlayer ? 'border-yellow-500/70' : 'border-black'}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-9 h-9 rounded-full border-2 border-black flex items-center justify-center font-black text-white text-xs shadow-[0_1px_0_#000] flex-shrink-0"
                            style={{ backgroundColor: member.avatarBg }}
                          >
                            {member.name[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-white font-black text-xs truncate">{member.name}</span>
                              <span className="text-[10px] text-gray-400 font-bold shrink-0">({member.relation})</span>
                            </div>
                            <div className="text-[10px] text-gray-300 font-bold mt-0.5 truncate max-w-[160px]">
                              {member.status === '已故' ? `享年 ${member.age} 岁` : `${member.age} 岁`} · {member.occupation}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded border border-black ${
                              member.status === '在世'
                                ? 'bg-emerald-900/80 text-emerald-300'
                                : member.status === '已故'
                                ? 'bg-gray-800 text-gray-400'
                                : 'bg-amber-900/80 text-amber-300'
                            }`}
                          >
                            {member.status}
                          </span>
                          {!member.isPlayer && <span className="text-[10px] text-yellow-400 font-bold">好感 {member.affinity}%</span>}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 家族排行：凝聚力 30% + 财力 40% + 影响力 30% */}
        {subTab === 'ranking' && (
          <div className="space-y-3">
            {(() => {
              const promo = nextPromotion(origin.classId);
              if (!promo) {
                return (
                  <div className="bg-[#2d2f3d] border-2 border-black rounded-xl p-3 shadow-[0_4px_0_#000] text-xs font-bold text-gray-300">
                    🎖️ {origin.classLabel}已是可晋升的最高阶层{origin.classId === 'noble' ? '（皇族无法通过晋升获得）' : ''}。
                  </div>
                );
              }
              const toLabel = classById(promo.to).label;
              const wealthOk = wealth >= promo.minNetWorth;
              const repOk = reputation >= promo.minReputation;
              return (
                <div className="bg-[#2d2f3d] border-2 border-black rounded-xl p-3 shadow-[0_4px_0_#000] space-y-1.5 text-xs font-bold">
                  <div className="text-white font-black">🎖️ 晋升为{toLabel}的条件（每月推进时自动检查）</div>
                  <div className={wealthOk ? 'text-emerald-300' : 'text-gray-400'}>
                    {wealthOk ? '✔' : '✘'} 家族资产 ≥ {promo.minNetWorth.toLocaleString()} ₽（当前 {wealth.toLocaleString()} ₽）
                  </div>
                  <div className={repOk ? 'text-emerald-300' : 'text-gray-400'}>
                    {repOk ? '✔' : '✘'} 当家人声望 ≥ {promo.minReputation}（当前 {reputation}）
                  </div>
                </div>
              );
            })()}
            <div className="bg-[#2d2f3d] border-2 border-black rounded-xl p-3 shadow-[0_4px_0_#000] grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#21232e] rounded-lg border border-black p-1.5">
                <div className="text-[10px] text-gray-400 font-bold">凝聚力</div>
                <div className="text-rose-300 font-black text-sm">{cohesion}</div>
                <div className="text-[9px] text-gray-500 font-bold">族人平均好感</div>
              </div>
              <div className="bg-[#21232e] rounded-lg border border-black p-1.5">
                <div className="text-[10px] text-gray-400 font-bold">财力</div>
                <div className="text-amber-300 font-black text-sm">{Math.round(wealthScore(wealth))}</div>
                <div className="text-[9px] text-gray-500 font-bold truncate">{wealth.toLocaleString()} ₽</div>
              </div>
              <div className="bg-[#21232e] rounded-lg border border-black p-1.5">
                <div className="text-[10px] text-gray-400 font-bold">影响力</div>
                <div className="text-sky-300 font-black text-sm">{reputation}</div>
                <div className="text-[9px] text-gray-500 font-bold">{reputationLevel(reputation)}</div>
              </div>
            </div>
            <div className="bg-[#2d2f3d] border-2 border-black rounded-xl p-2 shadow-[0_4px_0_#000] space-y-1.5">
              {ranking.map((f) => (
                <div
                  key={f.surname}
                  className={`flex items-center justify-between gap-2 p-2 rounded-lg border-2 ${f.isPlayer ? 'bg-[#3b3524] border-yellow-400' : 'bg-[#21232e] border-black'}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-6 text-center font-black text-xs ${f.rank <= 3 ? 'text-yellow-400' : 'text-gray-400'}`}>#{f.rank}</span>
                    <div className="min-w-0">
                      <div className={`font-black text-xs truncate ${f.isPlayer ? 'text-yellow-300' : 'text-white'}`}>
                        {f.surname}家族{f.isPlayer ? '（你）' : ''}
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold">
                        {f.classLabel} · 凝聚 {Math.round(f.cohesion)} · 财力 {Math.round(wealthScore(f.wealth))} · 影响 {Math.round(f.influence)}
                      </div>
                    </div>
                  </div>
                  <span className="text-amber-300 font-black font-mono text-sm shrink-0">{f.score}</span>
                </div>
              ))}
            </div>
            {(family.splitBranches?.length ?? 0) > 0 && (
              <div className="bg-[#2d2f3d] border-2 border-black rounded-xl p-3 shadow-[0_4px_0_#000] text-[11px] font-bold text-gray-300 space-y-0.5">
                <div className="text-white font-black text-xs mb-1">分家出去的支系</div>
                {family.splitBranches!.map((b, i) => (
                  <div key={i}>{b.year}.{b.month} · {b.relation} {b.name}</div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-gray-500 font-bold text-center">综合分 = 凝聚力 × 30% + 财力 × 40% + 影响力 × 30%</p>
          </div>
        )}

        {/* Tab 2: 传家宝（仅展示） */}
        {subTab === 'heirlooms' && (
          <div className="space-y-3">
            {auctionOpen && onOpenAuction && (
              <button
                onClick={onOpenAuction}
                className="w-full bg-amber-700 hover:bg-amber-600 text-amber-50 text-xs font-black py-2.5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Gavel size={14} /> 本月北城拍卖会开幕，前往竞拍
              </button>
            )}
            <p className="text-[10px] text-gray-500 font-bold text-center">传家宝可在拍卖会拍得，也可能在「机遇」推演事件中获得（如参军获授勋章）。估价计入家族财力。</p>
            {heirlooms.length === 0 && (
              <div className="bg-[#2d2f3d] border-2 border-black rounded-xl p-4 shadow-[0_4px_0_#000] text-center text-gray-400 text-xs font-bold">
                {origin.surname}家族尚无传家之宝。
              </div>
            )}
            {heirlooms.map((owned) => {
              const item = heirloomById(owned.id);
              if (!item) return null;
              const ICONS: Record<HeirloomDef['icon'], React.ElementType> = {
                crown: Crown, building: Building2, shield: Shield, medal: Medal, watch: Watch, ring: Gem, book: BookOpen,
                sword: Swords, gem: Gem, scroll: ScrollText, vase: Amphora, map: MapIcon2,
              };
              const Icon = ICONS[item.icon] ?? Sparkles;
              return (
                <div key={owned.id} className="bg-[#2d2f3d] border-2 border-black rounded-xl p-3 shadow-[0_4px_0_#000] flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#3b3c4d] border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[0_2px_0_#000]">
                    <Icon size={26} className="text-yellow-400 drop-shadow-[0_1px_0_#000]" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-white font-black text-sm">{item.name}</h3>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${QUALITY_STYLE[item.quality]}`}>{item.quality}</span>
                    </div>
                    <p className="text-gray-300 text-xs font-bold mt-1 leading-tight">{item.desc}</p>
                    <div className="mt-2 pt-2 border-t border-gray-700/70 flex items-center justify-between gap-2">
                      <span className="text-emerald-400 text-xs font-black flex items-center gap-1">
                        <Sparkles size={12} /> {item.meaning}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold text-right">
                        {owned.source} · {owned.year} 年 · 估价 {item.value.toLocaleString()} ₽
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: 家族大事记 */}
        {subTab === 'chronicles' && (
          <div className="bg-[#2d2f3d] border-2 border-black rounded-xl p-4 shadow-[0_4px_0_#000] space-y-4">
            {chronicles.map((c, i) => (
              <div key={`${c.year}_${c.month}_${i}`} className="flex gap-3 relative">
                <div className="flex flex-col items-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 border-2 border-black shadow-[0_1px_0_#000] z-10 mt-1"></div>
                  {i < chronicles.length - 1 && <div className="w-0.5 flex-1 bg-yellow-400/50 my-1"></div>}
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-yellow-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded border border-black">{c.year}年</span>
                    <h4 className="text-white font-black text-sm">{c.title}</h4>
                  </div>
                  <p className="text-gray-300 text-xs font-bold mt-1 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#2d2f3d] border-4 border-black rounded-2xl p-4 max-w-sm w-full shadow-[0_8px_0_#000] relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedId(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white font-black text-lg bg-black/40 px-2 py-0.5 rounded border border-black"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center text-white font-black text-lg shadow-[0_2px_0_#000]"
                style={{ backgroundColor: selectedMember.avatarBg }}
              >
                {selectedMember.name[0]}
              </div>
              <div>
                <h3 className="text-white font-black text-base">{selectedMember.name}</h3>
                <div className="text-xs text-yellow-400 font-bold">
                  {selectedMember.relation} · {selectedMember.status === '已故' ? `享年 ${selectedMember.age} 岁` : `${selectedMember.age} 岁`}
                </div>
              </div>
            </div>

            <div className="bg-[#21232e] p-2.5 rounded-xl border-2 border-black space-y-1.5 text-xs font-bold mb-3">
              <div className="flex justify-between text-gray-300">
                <span>身份职业:</span>
                <span className="text-white font-black">{selectedMember.occupation}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>家族辈分:</span>
                <span className="text-white font-black">{selectedMember.generation}</span>
              </div>
              {selectedMember.parents && (
                <div className="flex justify-between gap-3 text-gray-300">
                  <span className="shrink-0">父母:</span>
                  <span className="text-white font-black text-right">{selectedMember.parents}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-300">
                <span>生存状态:</span>
                <span className="text-emerald-400 font-black">{selectedMember.status}</span>
              </div>
              {!selectedMember.isPlayer && (
                <div className="flex justify-between text-gray-300">
                  <span>好感度:</span>
                  <span className="text-yellow-400 font-black">{selectedMember.affinity}%</span>
                </div>
              )}
            </div>

            <p className="text-gray-300 text-xs font-bold leading-relaxed mb-3">{selectedMember.desc}</p>

            {(selectedMember.isPlayer ? playerTraits : selectedMember.traitIds ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(selectedMember.isPlayer ? playerTraits : selectedMember.traitIds ?? []).map((id) => (
                  <span key={id} title={traitById(id)?.desc} className="bg-fuchsia-500/20 text-fuchsia-200 text-[10px] font-black px-2 py-0.5 rounded border border-fuchsia-500/50">
                    ✦ {traitNames([id])[0]}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {selectedMember.traits.map((trait, idx) => (
                <span key={idx} className="bg-yellow-400/20 text-yellow-300 text-[10px] font-black px-2 py-0.5 rounded border border-yellow-500/50">
                  #{trait}
                </span>
              ))}
            </div>

            {selectedMember.isChild && (
              <div className="bg-[#21232e] border-2 border-black rounded-xl p-2.5 mb-3 space-y-1.5">
                <div className="text-[11px] text-gray-300 font-bold">为孩子取名（只填名字即可，会自动加上家族姓「{origin.surname}」）</div>
                <div className="flex gap-1.5">
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    placeholder={selectedMember.name.split('·')[0]}
                    maxLength={10}
                    className="flex-1 min-w-0 bg-[#181a24] text-white text-xs font-bold px-2 py-1.5 rounded-lg border border-black focus:outline-none focus:border-yellow-400"
                  />
                  <button
                    onClick={() => {
                      const full = applySurname(nameDraft, origin.surname);
                      const check = validatePlayerName(full);
                      if (!nameDraft.trim() || !check.valid) {
                        showToast(`❌ ${check.reason || '请输入名字'}`);
                        return;
                      }
                      if (members.some((m) => m.name === full && m.id !== selectedMember.id)) {
                        showToast('❌ 家族里已经有人叫这个名字了');
                        return;
                      }
                      setFamily((prev) => renameChild(prev, selectedMember.id, full));
                      showToast(`👶 孩子从此名叫 ${full}`);
                      setNameDraft('');
                    }}
                    className="bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black px-3 rounded-lg border-2 border-black cursor-pointer shrink-0"
                  >
                    取名
                  </button>
                </div>
              </div>
            )}

            {!selectedMember.isPlayer && selectedMember.status !== '已故' && (
              <>
                <div className="text-[11px] text-gray-300 font-bold mb-2">
                  礼物喜好：<span className="text-rose-300 font-black">{GIFT_TASTE_LABEL[tasteOf(selectedMember, family.giftTastes) ?? 'toy']}</span>
                  <span className="text-gray-500">（送对喜好好感翻倍）</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {actionBtn('spar', '切磋交流', 'bg-yellow-400 hover:bg-yellow-300')}
                  {actionBtn('consult', '家族请教', 'bg-sky-400 hover:bg-sky-300')}
                  {actionBtn('gift', `赠礼 ${GIFT_COST}₽`, 'bg-rose-400 hover:bg-rose-300')}
                </div>
                <p className="text-[10px] text-gray-400 font-bold mt-2 text-center">
                  {blockedThisMonth || '每位家人每月可互动 1 次'}
                </p>
                {Object.keys(giftInventory).length > 0 && (
                  <div className="mt-3 border-t border-gray-700 pt-2">
                    <div className="text-[10px] text-gray-400 font-black mb-1.5">背包礼物（宝箱抽得，点击赠送）</div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(giftInventory).map(([id, count]) => {
                        const gift = giftById(id);
                        if (!gift) return null;
                        const liked = tasteOf(selectedMember, family.giftTastes) === gift.taste;
                        return (
                          <button
                            key={id}
                            onClick={() => handleGiveGift(selectedMember, id)}
                            disabled={!!blockedThisMonth}
                            title={`${gift.desc}（${GIFT_TASTE_LABEL[gift.taste]}）`}
                            className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg border border-black ${blockedThisMonth ? 'bg-gray-700 text-gray-400' : 'bg-[#21232e] text-white hover:bg-[#2d2f3d] cursor-pointer'}`}
                          >
                            <span className={`px-1 rounded ${GIFT_QUALITY_STYLE[gift.quality]}`}>{gift.quality}</span>
                            {gift.name} ×{count}
                            <span className={liked ? 'text-rose-300' : 'text-gray-400'}>
                              {liked ? '♥' : ''}+{giftAffinityGain(gift, selectedMember, family.giftTastes)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Aliases for compatibility
export const MapTab = FamilyTab;
