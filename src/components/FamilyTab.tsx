import React, { useState } from 'react';
import { ShieldCheck, GitFork, Crown, Building2, Shield, Sparkles } from 'lucide-react';

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  generation: string;
  age: number;
  status: '在世' | '已故' | '远游';
  occupation: string;
  affinity: number;
  avatarBg: string;
  desc: string;
  traits: string[];
}

const FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'm1',
    name: '亚历山大·瓦伦丁',
    relation: '祖父',
    generation: '一世 (祖辈)',
    age: 78,
    status: '已故',
    occupation: '帝国前皇家首席工匠',
    affinity: 100,
    avatarBg: '#525a66',
    desc: '曾主持设计卡罗尼亚大铁桥，奠定了瓦伦丁家族的社会地位与技术基业。',
    traits: ['皇家勋章', '匠人精神', '遗产继承'],
  },
  {
    id: 'm2',
    name: '维克多·瓦伦丁',
    relation: '父亲',
    generation: '二世 (父辈)',
    age: 52,
    status: '在世',
    occupation: '高级机械总工程师',
    affinity: 92,
    avatarBg: '#3d6185',
    desc: '现任家族族长，对你寄予厚望，常在机械设计与职场规划上给予悉心指点。',
    traits: ['现任族长', '严肃严谨', '工坊主理'],
  },
  {
    id: 'm3',
    name: '艾琳娜·瓦伦丁',
    relation: '母亲',
    generation: '二世 (父辈)',
    age: 49,
    status: '在世',
    occupation: '帝国医学院讲师',
    affinity: 98,
    avatarBg: '#a64245',
    desc: '温柔体贴，精通草药与医学，时刻关怀你的健康与身心状态。',
    traits: ['关怀备至', '医疗背景', '理财高手'],
  },
  {
    id: 'm4',
    name: '罗兰·瓦伦丁',
    relation: '叔叔',
    generation: '二世 (父辈)',
    age: 45,
    status: '远游',
    occupation: '远洋商队船长',
    affinity: 78,
    avatarBg: '#8a6538',
    desc: '性格豪爽不羁，常年穿梭于各大洲贸易港口，时不时寄回稀奇古怪的海外珍品。',
    traits: ['海外商旅', '神秘礼物', '见多识广'],
  },
  {
    id: 'm5',
    name: '你 (玩家)',
    relation: '你自己',
    generation: '三世 (平辈)',
    age: 22,
    status: '在世',
    occupation: '助理工程师',
    affinity: 100,
    avatarBg: '#a68245',
    desc: '瓦伦丁家族第三代长子，毕业于帝国理工学院，承载着家族复兴的希望。',
    traits: ['家族继承人', '理工高材生', '潜力无限'],
  },
  {
    id: 'm6',
    name: '莉莉安·瓦伦丁',
    relation: '妹妹',
    generation: '三世 (平辈)',
    age: 18,
    status: '在世',
    occupation: '皇家艺术学院学生',
    affinity: 95,
    avatarBg: '#a1476b',
    desc: '活泼开朗，充满艺术天赋，擅长油画与音乐，是家里的开心果。',
    traits: ['艺术天才', '灵感充沛', '家族团宠'],
  },
  {
    id: 'm7',
    name: '埃里克·瓦伦丁',
    relation: '堂弟',
    generation: '三世 (平辈)',
    age: 15,
    status: '在世',
    occupation: '市立中学学生',
    affinity: 85,
    avatarBg: '#3d7a63',
    desc: '罗兰叔叔的儿子，极具发明头脑，常常偷偷拆装家里的齿轮钟表。',
    traits: ['鬼马发明家', '好奇心强', '崇拜你'],
  },
];

const FAMILY_HEIRLOOMS = [
  {
    id: 'h1',
    name: '皇家工匠怀表',
    quality: '史诗',
    qualityTag: 'bg-purple-900/80 text-purple-300 border-purple-500',
    icon: Crown,
    desc: '祖父传承下来的金质双齿轮怀表，刻有皇家徽章。',
    buff: '推演与研究效率 +15%',
    owner: '维克多 (父亲)',
  },
  {
    id: 'h2',
    name: '瓦伦丁工坊地契',
    quality: '稀有',
    qualityTag: 'bg-blue-900/80 text-blue-300 border-blue-500',
    icon: Building2,
    desc: '首都中央大街7号机械工坊的地契与产权文书。',
    buff: '每月自动注入 ￥2,500 家族基金',
    owner: '家族共有',
  },
  {
    id: 'h3',
    name: '名流社交勋章',
    quality: '罕见',
    qualityTag: 'bg-amber-900/80 text-amber-300 border-amber-500',
    icon: Shield,
    desc: '帝国皇室授予瓦伦丁家族的勋章，象征名门荣誉。',
    buff: '官员与名流交涉成功率 +20%',
    owner: '你 (玩家)',
  },
];

const FAMILY_CHRONICLES = [
  { year: '1860年', title: '皇家工匠勋章', desc: '祖父亚历山大主持大铁桥项目，获得皇室颁发的首席工匠金质勋章。' },
  { year: '1888年', title: '主导首都给排水改造', desc: '父亲维克多主导首都给排水机械化改建工程，家族社会威望大幅上升。' },
  { year: '1898年', title: '创立瓦伦丁科技基金', desc: '家族设立专项科技助学基金，资助十余名贫困理工学子。' },
  { year: '1900年', title: '第三代继承人破局', desc: '【你】以优异成绩考入帝国理工学院并完成首次机械推演，家族迎来新篇章。' },
];

export const FamilyTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'tree' | 'heirlooms' | 'chronicles'>('tree');
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const generations = ['一世 (祖辈)', '二世 (父辈)', '三世 (平辈)'];

  return (
    <div className="flex-1 overflow-y-auto bg-[#252632] pb-6 flex flex-col relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-yellow-300 border-2 border-yellow-500 text-xs font-black px-4 py-2 rounded-xl shadow-[0_4px_0_#000] animate-in fade-in slide-in-from-top-2 duration-200 text-center max-w-[85%]">
          {toastMessage}
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-[#a62a2a] text-white text-center py-3 font-bold text-xl border-b-4 border-[#6e1d1d] relative z-10 shadow-lg flex-shrink-0">
        <div className="absolute inset-0 flex justify-center items-center opacity-30 pointer-events-none overflow-hidden">
          <div className="w-24 h-24 border-[6px] border-black rounded-full absolute -top-8 left-10"></div>
          <div className="w-32 h-32 border-[6px] border-black rounded-full absolute -bottom-16 right-0"></div>
        </div>
        <span className="relative z-10 drop-shadow-[0_2px_0_#000] font-black tracking-widest text-2xl">
          家族世系
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Family Crest & Overview Card */}
        <div className="bg-[#2d2f3d] border-2 border-black rounded-xl p-3.5 shadow-[0_4px_0_#000] relative overflow-hidden">
          <div className="flex items-center gap-3">
            {/* Crest Badge */}
            <div className="w-14 h-14 rounded-xl bg-[#8a6538] border-2 border-black flex items-center justify-center shadow-[0_2px_0_#000] flex-shrink-0 relative">
              <ShieldCheck size={32} className="text-yellow-300 drop-shadow-[0_2px_0_#000]" strokeWidth={2} />
              <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[9px] font-black px-1 rounded border border-black">
                Lv.4
              </div>
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

          {/* Stat Grid */}
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-700/80 text-center">
            <div className="bg-[#21232e] p-1.5 rounded-lg border border-black">
              <div className="text-[10px] text-gray-400 font-bold">传承</div>
              <div className="text-yellow-400 font-black text-sm">3 代</div>
            </div>
            <div className="bg-[#21232e] p-1.5 rounded-lg border border-black">
              <div className="text-[10px] text-gray-400 font-bold">族员</div>
              <div className="text-white font-black text-sm">7 人</div>
            </div>
            <div className="bg-[#21232e] p-1.5 rounded-lg border border-black">
              <div className="text-[10px] text-gray-400 font-bold">信托基金</div>
              <div className="text-emerald-400 font-black text-xs mt-0.5">￥28.5w</div>
            </div>
            <div className="bg-[#21232e] p-1.5 rounded-lg border border-black">
              <div className="text-[10px] text-gray-400 font-bold">月度收益</div>
              <div className="text-amber-300 font-black text-xs mt-0.5">+￥6800</div>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex bg-[#21232e] p-1 rounded-xl border-2 border-black gap-1 shadow-[0_2px_0_#000]">
          <button
            onClick={() => setSubTab('tree')}
            className={`flex-1 py-1.5 text-xs font-black rounded-lg border transition-all ${
              subTab === 'tree'
                ? 'bg-yellow-400 text-black border-black shadow-[0_1px_0_#000]'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            世系族谱
          </button>
          <button
            onClick={() => setSubTab('heirlooms')}
            className={`flex-1 py-1.5 text-xs font-black rounded-lg border transition-all ${
              subTab === 'heirlooms'
                ? 'bg-yellow-400 text-black border-black shadow-[0_1px_0_#000]'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            传家宝 & 特权
          </button>
          <button
            onClick={() => setSubTab('chronicles')}
            className={`flex-1 py-1.5 text-xs font-black rounded-lg border transition-all ${
              subTab === 'chronicles'
                ? 'bg-yellow-400 text-black border-black shadow-[0_1px_0_#000]'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            家族大事记
          </button>
        </div>

        {/* Tab 1: 世系族谱 (Family Tree) */}
        {subTab === 'tree' && (
          <div className="space-y-4">
            {generations.map((gen) => {
              const membersInGen = FAMILY_MEMBERS.filter((m) => m.generation === gen);
              return (
                <div key={gen} className="bg-[#2d2f3d] border-2 border-black rounded-xl p-3 shadow-[0_4px_0_#000]">
                  <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-700">
                    <GitFork size={16} className="text-yellow-400" />
                    <span className="text-yellow-400 font-black text-xs tracking-wider">{gen}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {membersInGen.map((member) => (
                      <div
                        key={member.id}
                        onClick={() => setSelectedMember(member)}
                        className="bg-[#21232e] border-2 border-black rounded-lg p-2.5 flex items-center justify-between cursor-pointer hover:border-yellow-400 transition-all shadow-[0_2px_0_#000] active:translate-y-0.5"
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Avatar Circle */}
                          <div
                            className="w-9 h-9 rounded-full border-2 border-black flex items-center justify-center font-black text-white text-xs shadow-[0_1px_0_#000] flex-shrink-0"
                            style={{ backgroundColor: member.avatarBg }}
                          >
                            {member.name[0]}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-white font-black text-xs">{member.name}</span>
                              <span className="text-[10px] text-gray-400 font-bold">({member.relation})</span>
                            </div>
                            <div className="text-[10px] text-gray-300 font-bold mt-0.5 truncate max-w-[140px]">
                              {member.occupation}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
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
                          <span className="text-[10px] text-yellow-400 font-bold">好感 {member.affinity}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: 传家宝 & 特权 (Heirlooms) */}
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
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${item.qualityTag}`}>
                      {item.quality}
                    </span>
                  </div>
                  <p className="text-gray-300 text-xs font-bold mt-1 leading-tight">{item.desc}</p>

                  <div className="mt-2 pt-2 border-t border-gray-700/70 flex items-center justify-between">
                    <span className="text-emerald-400 text-xs font-black flex items-center gap-1">
                      <Sparkles size={12} /> {item.buff}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">保管: {item.owner}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: 家族大事记 (Chronicles) */}
        {subTab === 'chronicles' && (
          <div className="bg-[#2d2f3d] border-2 border-black rounded-xl p-4 shadow-[0_4px_0_#000] space-y-4">
            {FAMILY_CHRONICLES.map((c, i) => (
              <div key={i} className="flex gap-3 relative">
                <div className="flex flex-col items-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 border-2 border-black shadow-[0_1px_0_#000] z-10 mt-1"></div>
                  {i < FAMILY_CHRONICLES.length - 1 && (
                    <div className="w-0.5 flex-1 bg-yellow-400/50 my-1"></div>
                  )}
                </div>

                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-yellow-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded border border-black">
                      {c.year}
                    </span>
                    <h4 className="text-white font-black text-sm">{c.title}</h4>
                  </div>
                  <p className="text-gray-300 text-xs font-bold mt-1 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Member Details Inspector Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#2d2f3d] border-4 border-black rounded-2xl p-4 max-w-sm w-full shadow-[0_8px_0_#000] relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedMember(null)}
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
                  {selectedMember.relation} · {selectedMember.age}岁
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
              <div className="flex justify-between text-gray-300">
                <span>生存状态:</span>
                <span className="text-emerald-400 font-black">{selectedMember.status}</span>
              </div>
            </div>

            <p className="text-gray-300 text-xs font-bold leading-relaxed mb-3">
              {selectedMember.desc}
            </p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {selectedMember.traits.map((trait, idx) => (
                <span
                  key={idx}
                  className="bg-yellow-400/20 text-yellow-300 text-[10px] font-black px-2 py-0.5 rounded border border-yellow-500/50"
                >
                  #{trait}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  showToast(`你与 ${selectedMember.name} 交流了机械与人生心得，获得经验 +50！`);
                  setSelectedMember(null);
                }}
                className="bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black py-2 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5"
              >
                切磋交流
              </button>
              <button
                onClick={() => {
                  showToast(`向 ${selectedMember.name} 请教了家族经验，获得指导加成！`);
                  setSelectedMember(null);
                }}
                className="bg-sky-400 hover:bg-sky-300 text-black text-xs font-black py-2 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5"
              >
                家族请教
              </button>
              <button
                onClick={() => {
                  showToast(
                    `给 ${selectedMember.name} 准备了礼物，好感度升至 ${Math.min(
                      100,
                      selectedMember.affinity + 2
                    )}%！`
                  );
                  setSelectedMember(null);
                }}
                className="bg-rose-400 hover:bg-rose-300 text-black text-xs font-black py-2 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5"
              >
                赠送礼物
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Aliases for compatibility
export const MapTab = FamilyTab;
