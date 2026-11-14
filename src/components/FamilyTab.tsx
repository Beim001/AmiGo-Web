import React, { useState } from 'react';
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
  buildChronicles,
  canInteract,
  canDoInteraction,
  applyInteraction,
} from '../lib/family';

// 传家宝：目前仅为展示，不提供数值加成
const FAMILY_HEIRLOOMS = [
  {
    id: 'h1',
    name: '皇家工匠怀表',
    quality: '史诗',
    qualityTag: 'bg-purple-900/80 text-purple-300 border-purple-500',
    icon: Crown,
    desc: '祖父传承下来的金质双齿轮怀表，刻有皇家徽章。',
    meaning: '瓦伦丁匠艺传承的信物',
    owner: '维克多 (父亲)',
  },
  {
    id: 'h2',
    name: '瓦伦丁工坊地契',
    quality: '稀有',
    qualityTag: 'bg-blue-900/80 text-blue-300 border-blue-500',
    icon: Building2,
    desc: '首都中央大街7号机械工坊的地契与产权文书。',
    meaning: '家族产业的根基',
    owner: '家族共有',
  },
  {
    id: 'h3',
    name: '名流社交勋章',
    quality: '罕见',
    qualityTag: 'bg-amber-900/80 text-amber-300 border-amber-500',
    icon: Shield,
    desc: '帝国皇室授予瓦伦丁家族的勋章，象征名门荣誉。',
    meaning: '名门荣誉的象征',
    owner: '你 (玩家)',
  },
];

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
}) => {
  const [subTab, setSubTab] = useState<'tree' | 'heirlooms' | 'chronicles'>('tree');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    }

    setFamily((prev) => applyInteraction(prev, member, kind, gameYear, gameMonth));
    const newAffinity = Math.min(100, member.affinity + AFFINITY_GAIN[kind]);

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

  if (!isRegistered) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#252632] flex flex-col items-center justify-center p-6 text-center gap-3">
        <ShieldCheck size={48} className="text-yellow-400" />
        <p className="text-white font-black">尚未录入家族世系</p>
        <p className="text-gray-400 text-xs font-bold">完成出生登记后，你将作为瓦伦丁家族第三代被记入族谱。</p>
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
                <h2 className="text-white font-black text-lg drop-shadow-[0_1.5px_0_#000]">瓦伦丁家族</h2>
                <span className="text-[10px] font-black bg-yellow-400 text-black px-2 py-0.5 rounded border border-black shadow-[0_1px_0_#000]">
                  帝国名门望族
                </span>
              </div>
              <p className="text-gray-300 text-xs font-bold mt-1 italic">“坚忍如钢，智慧永存”</p>
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
                  {gen.startsWith('四世') ? <Baby size={16} className="text-yellow-400" /> : <GitFork size={16} className="text-yellow-400" />}
                  <span className="text-yellow-400 font-black text-xs tracking-wider">{gen}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {members
                    .filter((m) => m.generation === gen)
                    .map((member) => (
                      <div
                        key={member.id}
                        onClick={() => setSelectedId(member.id)}
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

        {/* Tab 2: 传家宝（仅展示） */}
        {subTab === 'heirlooms' && (
          <div className="space-y-3">
            {FAMILY_HEIRLOOMS.map((item) => (
              <div key={item.id} className="bg-[#2d2f3d] border-2 border-black rounded-xl p-3 shadow-[0_4px_0_#000] flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#3b3c4d] border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[0_2px_0_#000]">
                  <item.icon size={26} className="text-yellow-400 drop-shadow-[0_1px_0_#000]" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-black text-sm">{item.name}</h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${item.qualityTag}`}>{item.quality}</span>
                  </div>
                  <p className="text-gray-300 text-xs font-bold mt-1 leading-tight">{item.desc}</p>
                  <div className="mt-2 pt-2 border-t border-gray-700/70 flex items-center justify-between">
                    <span className="text-emerald-400 text-xs font-black flex items-center gap-1">
                      <Sparkles size={12} /> {item.meaning}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">保管: {item.owner}</span>
                  </div>
                </div>
              </div>
            ))}
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

            <div className="flex flex-wrap gap-1.5 mb-4">
              {selectedMember.traits.map((trait, idx) => (
                <span key={idx} className="bg-yellow-400/20 text-yellow-300 text-[10px] font-black px-2 py-0.5 rounded border border-yellow-500/50">
                  #{trait}
                </span>
              ))}
            </div>

            {!selectedMember.isPlayer && selectedMember.status !== '已故' && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {actionBtn('spar', '切磋交流', 'bg-yellow-400 hover:bg-yellow-300')}
                  {actionBtn('consult', '家族请教', 'bg-sky-400 hover:bg-sky-300')}
                  {actionBtn('gift', `赠礼 ${GIFT_COST}₽`, 'bg-rose-400 hover:bg-rose-300')}
                </div>
                <p className="text-[10px] text-gray-400 font-bold mt-2 text-center">
                  {blockedThisMonth || '每位家人每月可互动 1 次'}
                </p>
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
