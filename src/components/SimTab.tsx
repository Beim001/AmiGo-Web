import React, { useState } from 'react';
import {
  Briefcase,
  CircleDollarSign,
  BookOpen,
  ChevronLeft,
  CheckCircle,
  Sparkles,
  RotateCcw,
  Clock,
  Skull,
  Scroll,
} from 'lucide-react';

export interface SimTabProps {
  isRegistered?: boolean;
  health?: number;
  age?: number;
  playerName?: string;
  gameYear?: number;
  gameMonth?: number;
  onGoToBirthRegistration?: () => void;
  onResetLife?: () => void;
}

const INITIAL_EVENTS = [
  {
    id: 'career',
    title: '职业抉择',
    icon: Briefcase,
    headline: '海外分公司急需新领导！',
    date: '1871年10月',
    desc: '你面临一个重要的人生转折。经理向你提供了一个去海外分公司担任领导的机会。\n\n接受这个机会意味着你将获得更高的薪水和更大的权力，但你需要离开你熟悉的环境，并且工作压力会显著增加。\n\n你该如何抉择？',
    options: [
      { label: '接受外派 (+金币, -体力)', type: 'primary' },
      { label: '婉言拒绝 (维持现状)', type: 'secondary' },
    ],
  },
  {
    id: 'investment',
    title: '工商业投资',
    icon: CircleDollarSign,
    headline: '蒸汽工矿实业募资！是风口还是陷阱？',
    date: '1872年3月',
    desc: '商界伙伴向你引荐了一处新兴的蒸汽动力采矿实业项目。尽管前期勘探充满未知，但若勘探成功，预计将带来丰厚的股息分红与资产增值。\n\n你手里有一笔闲置资金，你决定冒险一试吗？',
    options: [
      { label: '投资 20,000 ₽ (高收益)', type: 'primary' },
      { label: '稳妥起见不投资', type: 'secondary' },
    ],
  },
  {
    id: 'education',
    title: '自我深造',
    icon: BookOpen,
    headline: '皇家科学院进修名额开放！',
    date: '1872年9月',
    desc: '你意识到当前的知识与技能储备在快速发展的时代显得不足。你可以选择花费一笔积蓄前往皇家工学院进修高阶学衔，或者继续在当前的岗位上按部就班。\n\n深造会消耗大量的时间和金钱，但能显著拓宽未来的职业与社会声望。',
    options: [
      { label: '报名深造 (-10,000 ₽)', type: 'primary' },
      { label: '继续工作积累经验', type: 'secondary' },
    ],
  },
];

export const SimTab: React.FC<SimTabProps> = ({
  isRegistered = false,
  health = 100,
  age = 8,
  playerName = '旅人',
  gameYear = 1870,
  gameMonth = 1,
  onGoToBirthRegistration,
  onResetLife,
}) => {
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [events, setEvents] = useState([...INITIAL_EVENTS]);
  const [confirmReset, setConfirmReset] = useState(false);

  const isDeceased = isRegistered && health <= 0;

  const handleOptionSelect = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setActiveEvent(null);
  };

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
            推演
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
                【人生推演未开启】
              </h3>
              <p className="text-gray-300 text-xs font-bold leading-relaxed">
                当前角色尚未办理出生登记，公民档案未入库。
              </p>
              <p className="text-gray-400 text-[11px] leading-snug">
                请先前往【功能】界面办理出生登记，开启属于你的人生历史篇章。
              </p>
            </div>

            {onGoToBirthRegistration && (
              <button
                type="button"
                onClick={onGoToBirthRegistration}
                className="w-full bg-[#fcd34d] hover:bg-[#fde047] text-black font-black text-xs py-3 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 transition-all mt-1"
              >
                <Sparkles size={16} className="text-amber-700 fill-amber-700" />
                <span>前往办理出生登记</span>
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
            推演
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
                【本世推演已谢幕】
              </h3>
              <p className="text-gray-300 text-xs font-bold leading-relaxed">
                {playerName} · 享年 {age} 岁
              </p>
              <p className="text-gray-400 text-[11px] leading-relaxed">
                生命体征已归零，所有时代风云与事件推演已封存。
              </p>
            </div>

            {/* Reset / Rebirth Action */}
            {onResetLife && (
              <div className="w-full pt-1">
                {confirmReset ? (
                  <div className="flex flex-col gap-2 bg-[#1b1c24] p-3 rounded-xl border-2 border-rose-500/60">
                    <span className="text-xs text-rose-300 font-black">
                      确定重置人生开启新轮回？
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
                        确认重置
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-black py-2 rounded-lg border border-black cursor-pointer"
                      >
                        取消
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
                    <span>重置人生 · 开启新生</span>
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
  if (activeEvent) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#252632] flex flex-col p-2 sm:p-4 relative custom-scrollbar">
        <div
          className="absolute top-2 sm:top-4 left-2 sm:left-4 z-20 cursor-pointer bg-black/40 p-1.5 sm:p-2 rounded-full border-2 border-black"
          onClick={() => setActiveEvent(null)}
        >
          <ChevronLeft className="text-white" size={24} />
        </div>

        <div className="flex-1 mt-10 sm:mt-12 bg-[#f4ebd0] border-[4px] border-black p-3 sm:p-5 relative shadow-[0_6px_0_#000] flex flex-col">
          <div className="border-b-[4px] border-black pb-2 sm:pb-3 mb-3 sm:mb-4 flex flex-col items-center">
            <h1
              className="font-serif text-3xl sm:text-4xl font-black text-black tracking-widest text-center"
              style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}
            >
              人生快报
            </h1>
            <div className="flex justify-between w-full text-xs sm:text-sm font-bold border-t-[3px] border-b-[3px] border-black py-1 mt-2 sm:mt-3">
              <span>{activeEvent.date}</span>
              <span>头版头条</span>
            </div>
          </div>

          <h2 className="text-black text-xl sm:text-2xl font-black text-center mb-4 sm:mb-6 leading-snug">
            {activeEvent.headline}
          </h2>

          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-black/5 border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0_#000] -rotate-3">
              <activeEvent.icon size={40} className="text-black sm:w-12 sm:h-12" />
            </div>
          </div>

          <div className="flex-1 text-black font-bold leading-relaxed overflow-y-auto text-[14px] sm:text-[16px] whitespace-pre-wrap px-1 sm:px-2 custom-scrollbar">
            {activeEvent.desc}
          </div>

          <div className="mt-4 sm:mt-8 flex flex-col gap-2 sm:gap-3">
            {activeEvent.options.map((opt: any, idx: number) => (
              <button
                key={idx}
                onClick={() => handleOptionSelect(activeEvent.id)}
                className={`py-2.5 sm:py-3.5 border-[3px] border-black font-black text-black text-[15px] sm:text-[17px] shadow-[4px_4px_0_#000] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all cursor-pointer ${
                  idx === 0 ? 'bg-[#ffeb3b]' : 'bg-[#e0e0e0]'
                }`}
              >
                {opt.label}
              </button>
            ))}
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
          推演
        </span>
      </div>

      {events.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="w-24 h-24 bg-[#3a3b46] rounded-full flex items-center justify-center mb-4 border-4 border-black shadow-[0_4px_0_#000]">
            <CheckCircle size={48} className="text-[#a1a1aa]" />
          </div>
          <h2
            className="text-white text-2xl font-black mb-2 tracking-widest"
            style={{ textShadow: '0 2px 0 #000' }}
          >
            本期风平浪静
          </h2>
          <p className="text-[#a1a1aa] font-bold">暂无突发的人生抉择事件，继续享受平稳的生活吧。</p>
        </div>
      ) : (
        <div className="flex-1 relative flex items-center justify-center p-6 mt-4 perspective-[1000px]">
          {events.map((event, index) => {
            const isTop = index === events.length - 1;
            const reverseIndex = events.length - 1 - index;

            const rotation =
              reverseIndex % 2 === 0 ? reverseIndex * 2 : -(reverseIndex * 2);
            const yOffset = reverseIndex * -12;
            const xOffset =
              reverseIndex % 2 === 0 ? reverseIndex * 4 : reverseIndex * -4;

            return (
              <div
                key={event.id}
                onClick={() => {
                  if (isTop) setActiveEvent(event);
                }}
                className={`absolute w-[85%] max-w-[320px] aspect-[3/4] h-auto max-h-[75vh] min-h-[360px] bg-[#f4ebd0] border-[3px] border-black p-3 sm:p-4 flex flex-col transition-all duration-300 ${
                  isTop
                    ? 'cursor-pointer hover:-translate-y-2 hover:shadow-[8px_12px_0_#000] shadow-[6px_8px_0_#000]'
                    : 'shadow-[2px_2px_0_#000]'
                }`}
                style={{
                  zIndex: index,
                  transform: `translate(${xOffset}px, ${yOffset}px) rotate(${rotation}deg) scale(${
                    1 - reverseIndex * 0.03
                  })`,
                  opacity: reverseIndex > 2 ? 0 : 1,
                }}
              >
                <div className="border-b-[3px] border-black pb-2 sm:pb-3 mb-2 sm:mb-3 flex flex-col items-center">
                  <h1
                    className="font-serif text-2xl sm:text-3xl font-black text-black tracking-widest text-center"
                    style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}
                  >
                    人生快报
                  </h1>
                  <div className="flex justify-between w-full text-[10px] sm:text-xs font-bold border-t-[2px] border-b-[2px] border-black py-1 mt-1 sm:mt-2">
                    <span>{event.date}</span>
                    <span>NO. {9824 + index}</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <h2 className="text-lg sm:text-xl font-black text-black leading-tight mb-2 sm:mb-4 text-center px-1 sm:px-2">
                    {event.headline}
                  </h2>

                  <div className="flex flex-col items-center gap-2 sm:gap-3 mb-2 sm:mb-3 flex-1 overflow-hidden">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black/5 border-[2px] border-black flex items-center justify-center flex-shrink-0 -rotate-2">
                      <event.icon size={28} className="text-black sm:w-9 sm:h-9" />
                    </div>
                    <p className="text-[11px] sm:text-[13px] font-bold text-gray-800 line-clamp-4 sm:line-clamp-6 leading-relaxed text-justify px-1 sm:px-2">
                      {event.desc}
                    </p>
                  </div>

                  {isTop && (
                    <div className="mt-auto flex justify-center pb-1 sm:pb-2">
                      <span className="bg-black text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold animate-pulse shadow-[2px_2px_0_#000] border-2 border-transparent">
                        点击阅读详情 &gt;
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
