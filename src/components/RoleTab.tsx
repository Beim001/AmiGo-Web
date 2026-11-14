import React from 'react';
import { Store, Calendar, Sparkles } from 'lucide-react';

const AgeIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" className="drop-shadow-sm">
    <path d="M6 4h12M6 20h12" stroke="black" strokeWidth="3" strokeLinecap="round"/>
    <path d="M7 4h10v4.5l-4 5 4 5V20H7v-1.5l4-5-4-5V4z" fill="#bae6fd" stroke="black" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M9 4v3.5l3 3.75 3-3.75V4H9z" fill="#fde047" />
    <path d="M9 20v-2.5l3-3.75 3 3.75V20H9z" fill="#fde047" />
    <circle cx="12" cy="15" r="1.5" fill="#fde047" />
  </svg>
);

const HealthIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" className="drop-shadow-sm">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#ef4444" stroke="black" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M6.5 8a2.5 2.5 0 0 1 2.5-2.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </svg>
);

const WealthIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" className="drop-shadow-sm">
    <circle cx="12" cy="13" r="9" fill="#d97706" stroke="black" strokeWidth="2"/>
    <circle cx="12" cy="11" r="9" fill="#fde047" stroke="black" strokeWidth="2"/>
    <path d="M12 6v10M10 8h3a2 2 0 0 1 0 4h-2a2 2 0 0 0 0 4h3" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const ChildIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" className="drop-shadow-sm">
    <circle cx="12" cy="9" r="6" fill="#fed7aa" stroke="black" strokeWidth="2"/>
    <path d="M6 15c0-2.5 2.5-4 6-4s6 1.5 6 4v5H6v-5z" fill="#bfdbfe" stroke="black" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M10 10q2 2 4 0" stroke="black" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <circle cx="9.5" cy="8" r="1.2" fill="black"/>
    <circle cx="14.5" cy="8" r="1.2" fill="black"/>
    <path d="M12 3v1" stroke="black" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const GenderIcon = ({ gender }: { gender?: string | null }) => {
  if (gender === '女') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" className="drop-shadow-sm">
        <circle cx="12" cy="9" r="5.5" fill="#f472b6" stroke="black" strokeWidth="2"/>
        <circle cx="10" cy="7.5" r="1.5" fill="white"/>
        <path d="M12 14.5v6.5M9 18h6" stroke="black" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M12 15v5.5M9.5 18h5" stroke="#fbcfe8" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    );
  }
  if (gender === '男') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" className="drop-shadow-sm">
        <circle cx="9.5" cy="14.5" r="5.5" fill="#60a5fa" stroke="black" strokeWidth="2"/>
        <circle cx="8" cy="13" r="1.5" fill="white"/>
        <path d="M14 10L20 4M15 4h5v5" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14.3 9.7L19.5 4.5M15.8 4.7h3.7v3.7" stroke="#bfdbfe" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" className="drop-shadow-sm">
      <circle cx="12" cy="8" r="5" fill="#e879f9" stroke="black" strokeWidth="2"/>
      <circle cx="10.5" cy="6.5" r="1.2" fill="white"/>
      <path d="M5 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5v1H5v-1z" fill="#c084fc" stroke="black" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M8.5 7a2 2 0 0 1 2-2" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
};

const StatCard = ({ title, value, unit, color, icon, onClick, className = '' }: { title: string, value: string, unit: string, color: string, icon: React.ReactNode, onClick?: () => void, className?: string }) => (
  <div 
    onClick={onClick}
    className={`${color} border-2 border-black rounded-xl p-3 flex items-center gap-2.5 shadow-[0_4px_0_#000] relative overflow-hidden ${onClick ? 'cursor-pointer active:scale-95 hover:brightness-110 transition-all' : ''} ${className}`}
  >
    <div className="absolute -right-2 -bottom-2 opacity-20 rotate-12 scale-[2.5] pointer-events-none">
      {icon}
    </div>
    <div className="flex items-center justify-center relative z-10 w-9 h-9">
      {icon}
    </div>
    <div className="flex flex-col relative z-10">
      <span className="text-white text-[11px] font-extrabold drop-shadow-[0_1px_0_#000]">{title}</span>
      <span className="text-white font-black text-xl leading-none mt-1 drop-shadow-[0_1.5px_0_#000]">{value}<span className="text-[11px] text-white/90 ml-0.5 font-bold drop-shadow-none">{unit}</span></span>
    </div>
  </div>
);

export const CartoonCharacter = ({ clothing }: { clothing: string }) => {
  return (
    <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md z-10">
      {/* Base Body - Legs */}
      <rect x="36" y="82" width="8" height="18" rx="3" fill="#2C3E50" stroke="#1A2A38" strokeWidth="2" />
      <rect x="56" y="82" width="8" height="18" rx="3" fill="#2C3E50" stroke="#1A2A38" strokeWidth="2" />
      
      {/* Shoes */}
      <path d="M 32 98 h 16 v 6 h -16 z" fill="#111" />
      <path d="M 52 98 h 16 v 6 h -16 z" fill="#111" />
      
      {/* Body / Clothes */}
      {clothing === 'knight' && (
        <g>
          <rect x="30" y="52" width="40" height="34" rx="4" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
          <path d="M 30 65 l 20 10 l 20 -10" fill="none" stroke="#475569" strokeWidth="2" />
          <rect x="18" y="54" width="12" height="22" rx="4" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
          <rect x="70" y="54" width="12" height="22" rx="4" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
        </g>
      )}
      
      {clothing === 'mage' && (
        <g>
          <path d="M 32 52 L 68 52 L 75 90 L 25 90 Z" fill="#c084fc" stroke="#7e22ce" strokeWidth="2" />
          <rect x="45" y="52" width="10" height="38" fill="#a855f7" />
          <rect x="16" y="54" width="16" height="20" rx="4" fill="#a855f7" stroke="#7e22ce" strokeWidth="2" />
          <rect x="68" y="54" width="16" height="20" rx="4" fill="#a855f7" stroke="#7e22ce" strokeWidth="2" />
        </g>
      )}
      
      {clothing === 'casual' && (
        <g>
          <rect x="28" y="52" width="44" height="32" rx="6" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
          <rect x="35" y="65" width="30" height="14" rx="4" fill="#fde047" stroke="#ca8a04" strokeWidth="2" />
          <rect x="18" y="54" width="12" height="24" rx="4" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
          <rect x="70" y="54" width="12" height="24" rx="4" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
        </g>
      )}

      {clothing === 'default' && (
        <g>
          <rect x="30" y="52" width="40" height="30" rx="6" fill="#4A7A9C" stroke="#3A5F7A" strokeWidth="2" />
          <rect x="20" y="54" width="8" height="22" rx="4" fill="#F5D0B8" stroke="#D4A88C" strokeWidth="2" />
          <rect x="18" y="52" width="12" height="12" rx="2" fill="#4A7A9C" stroke="#3A5F7A" strokeWidth="2" />
          <rect x="72" y="54" width="8" height="22" rx="4" fill="#F5D0B8" stroke="#D4A88C" strokeWidth="2" />
          <rect x="70" y="52" width="12" height="12" rx="2" fill="#4A7A9C" stroke="#3A5F7A" strokeWidth="2" />
        </g>
      )}
      
      {/* Hands */}
      {clothing !== 'default' && (
        <g>
           <circle cx="24" cy="78" r="5" fill="#F5D0B8" stroke="#D4A88C" strokeWidth="2" />
           <circle cx="76" cy="78" r="5" fill="#F5D0B8" stroke="#D4A88C" strokeWidth="2" />
        </g>
      )}
      
      {/* Head Base */}
      <circle cx="50" cy="30" r="22" fill="#F5D0B8" stroke="#D4A88C" strokeWidth="2" />
      
      {/* Eyes */}
      <circle cx="42" cy="27" r="3.5" fill="#2C2C2C" />
      <circle cx="58" cy="27" r="3.5" fill="#2C2C2C" />
      
      {/* Cheeks */}
      <circle cx="38" cy="32" r="3" fill="#ff7e7e" opacity="0.6" />
      <circle cx="62" cy="32" r="3" fill="#ff7e7e" opacity="0.6" />

      {/* Mouth */}
      <path d="M 44 35 Q 50 40 56 35" fill="none" stroke="#B8836A" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Headwear */}
      {clothing === 'knight' && (
        <g>
          <path d="M 26 22 C 26 -2, 74 -2, 74 22 L 74 35 C 74 40, 26 40, 26 35 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
          <rect x="42" y="10" width="16" height="26" fill="#1e293b" />
        </g>
      )}
      {clothing === 'mage' && (
        <g>
          <path d="M 15 20 L 85 20 L 50 -15 Z" fill="#7e22ce" stroke="#581c87" strokeWidth="2" />
          <ellipse cx="50" cy="20" rx="38" ry="8" fill="#a855f7" stroke="#581c87" strokeWidth="2" />
        </g>
      )}
      {clothing === 'casual' && (
        <g>
           <path d="M 28 30 C 28 0, 72 0, 72 30 L 72 35 C 72 35, 28 35, 28 35 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
           <path d="M 40 10 Q 50 20 60 10" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round"/>
        </g>
      )}
    </svg>
  );
};

export interface RoleTabProps {
  onOpenShop?: () => void;
  onOpenBank?: () => void;
  onOpenWealthChart?: () => void;
  onOpenHospital?: () => void;
  onOpenGender?: () => void;
  onOpenCalendar?: () => void;
  onNextMonth?: () => void;
  onGoToBirthRegistration?: () => void;
  equippedClothing: string;
  coins: number;
  health?: number;
  gameYear?: number;
  gameMonth?: number;
  isRegistered?: boolean;
  gender?: string | null;
  age?: number;
  childrenCount?: number;
  /** 当前所患疾病名称 */
  diseaseName?: string;
  /** 打开传承界面（角色去世后） */
  onOpenSuccession?: () => void;
}

export const RoleTab: React.FC<RoleTabProps> = ({
  onOpenShop,
  onOpenBank,
  onOpenWealthChart,
  onOpenHospital,
  onOpenGender,
  onOpenCalendar,
  onNextMonth,
  onGoToBirthRegistration,
  equippedClothing,
  coins,
  health = 100,
  gameYear = 1870,
  gameMonth = 1,
  isRegistered = false,
  gender,
  age = 8,
  childrenCount = 0,
  diseaseName,
  onOpenSuccession,
}) => {
  const formattedMonth = gameMonth < 10 ? `0${gameMonth}` : `${gameMonth}`;
  const isDeceased = isRegistered && health <= 0;

  return (
    <div className="flex-1 overflow-y-auto bg-[#252632] pb-6 flex flex-col relative">
      <div className="relative w-full h-16 z-20 mb-12 drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] flex-shrink-0">
        <div className="absolute inset-0 flex">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? 'bg-[#0f4b99]' : 'bg-[#1553a6]'} relative`}>
              <div className={`absolute -bottom-4 left-0 w-full h-8 rounded-b-full ${i % 2 === 0 ? 'bg-[#0f4b99]' : 'bg-[#1553a6]'}`}></div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center pt-2 z-10">
          <span
            className="text-white text-3xl font-black tracking-widest"
            style={{
              textShadow:
                '-2px -2px 0 #072a66, 2px -2px 0 #072a66, -2px 2px 0 #072a66, 2px 2px 0 #072a66, 0 4px 6px rgba(0,0,0,0.6)',
            }}
          >
            角色
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 mt-2">
        <div
          onClick={onOpenCalendar}
          className="bg-[#2d2f3d] border-2 border-black rounded-xl px-6 py-2 flex flex-col items-center shadow-[0_4px_0_#000] mb-6 w-4/5 relative z-10 cursor-pointer active:scale-95 transition-transform"
          title="点击进入卡罗尼亚帝国日历"
        >
          <span className="text-gray-400 text-xs font-bold mb-0.5">卡罗尼亚帝国</span>
          <span className="text-white text-xl font-black font-mono tracking-widest">
            {gameYear}.{formattedMonth}
          </span>
        </div>

        {/* Character Display OR Unregistered Stone OR Deceased Memorial */}
        {!isRegistered ? (
          <div className="w-full max-w-sm flex flex-col items-center my-3 select-none">
            {/* Dignified Citizen Archive Monument */}
            <div className="w-full bg-[#363844] border-4 border-black rounded-t-[48px] rounded-b-xl p-6 shadow-[0_6px_0_#000] flex flex-col items-center text-center space-y-3 relative overflow-hidden">
              <div className="absolute top-0 inset-x-10 h-1.5 bg-white/10 rounded-b-full pointer-events-none" />

              {/* Stone Emblem */}
              <div className="w-14 h-14 bg-[#23252e] border-2 border-black rounded-full flex items-center justify-center shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)]">
                <span className="text-2xl select-none opacity-85">📜</span>
              </div>

              {/* Dignified Inscription */}
              <div className="space-y-1 z-10 w-full px-2">
                <div className="text-gray-400 text-[11px] font-bold tracking-widest uppercase font-mono">
                  — CARONIA ARCHIVE —
                </div>
                <h3 className="text-gray-100 font-black text-base tracking-wider">
                  【公民档案未建档】
                </h3>
                <p className="text-gray-300 text-xs font-bold leading-relaxed pt-0.5">
                  尚未办理出生登记，暂无公民档案。
                </p>
                <p className="text-gray-400 text-[11px] leading-snug pt-0.5">
                  请前往【功能】界面办理出生登记，申领公民身份。
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={onGoToBirthRegistration}
                className="w-full bg-[#fcd34d] hover:bg-[#fde047] text-black font-black text-xs py-3 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 transition-all mt-1"
              >
                <Sparkles size={16} className="text-amber-700 fill-amber-700" />
                <span>前往【功能】办理出生登记</span>
              </button>
            </div>

            {/* Pedestal Base */}
            <div className="w-[104%] -mt-1.5 h-4 bg-[#252730] border-x-4 border-b-4 border-black rounded-b-xl shadow-[0_4px_0_#000] relative flex justify-center items-center">
              <div className="w-20 h-1 bg-black/40 rounded-full" />
            </div>
          </div>
        ) : isDeceased ? (
          <div className="w-full max-w-sm flex flex-col items-center my-3 select-none">
            {/* Solemn Deceased Memorial */}
            <div className="w-full bg-[#2c2e38] border-4 border-black rounded-t-[48px] rounded-b-xl p-6 shadow-[0_6px_0_#000] flex flex-col items-center text-center space-y-3 relative overflow-hidden">
              <div className="absolute top-0 inset-x-10 h-1.5 bg-white/10 rounded-b-full pointer-events-none" />

              <div className="w-14 h-14 bg-[#1e1f26] border-2 border-black rounded-full flex items-center justify-center shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)]">
                <span className="text-2xl select-none opacity-85">🪦</span>
              </div>

              <div className="space-y-1 z-10 w-full px-2">
                <div className="text-gray-400 font-mono text-[11px] font-bold tracking-widest uppercase">
                  — R . I . P —
                </div>
                <h3 className="text-gray-100 font-black text-base tracking-wider">
                  【公 民 纪 念 碑】
                </h3>
                <p className="text-gray-300 text-xs font-bold leading-relaxed pt-0.5">
                  享年 {age} 岁 · 愿逝者安息于卡罗尼亚大地
                </p>
                <p className="text-gray-400 text-[11px] leading-snug pt-0.5">
                  此生历程已谢幕，可由子嗣或兄弟姐妹继承家业，或重开人生。
                </p>
                {onOpenSuccession && (
                  <button
                    onClick={onOpenSuccession}
                    className="mt-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-black px-4 py-2 rounded-xl border-2 border-black shadow-[0_3px_0_#000] cursor-pointer"
                  >
                    🕯️ 传承家业
                  </button>
                )}
              </div>
            </div>
            <div className="w-[104%] -mt-1.5 h-4 bg-[#1e1f26] border-x-4 border-b-4 border-black rounded-b-xl shadow-[0_4px_0_#000] relative flex justify-center items-center">
              <div className="w-20 h-1 bg-black/40 rounded-full" />
            </div>
          </div>
        ) : (
          <div className="relative mt-2 flex flex-col items-center">
            <div
              className="w-48 h-56 relative z-10 flex justify-center items-end pb-8 cursor-pointer active:scale-95 transition-transform group"
              onClick={onOpenShop}
              title="点击人物进入装备与服饰商城"
            >
              <CartoonCharacter clothing={equippedClothing} />
            </div>

            <div className="absolute bottom-1 z-30 flex items-center gap-2.5">
              {onNextMonth && (
                <button
                  type="button"
                  onClick={onNextMonth}
                  className="bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs px-4 py-2 rounded-full border-2 border-black whitespace-nowrap shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer flex items-center gap-1.5 transition-all"
                  title="点击向前推进 1 个月，获得每月产业与存息结余"
                >
                  <Calendar size={14} /> 下个月
                </button>
              )}
              <button
                type="button"
                onClick={onOpenShop}
                className="bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs px-4 py-2 rounded-full border-2 border-black whitespace-nowrap shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Store size={14} /> 点击换装
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mt-8">
          <StatCard
            title="岁数"
            value={!isRegistered ? '未登记' : isDeceased ? `享年${age}` : age.toString()}
            unit={!isRegistered || isDeceased ? '' : '岁'}
            color={!isRegistered ? 'bg-[#373b47]' : isDeceased ? 'bg-[#40434f]' : 'bg-[#4d6b8c]'}
            icon={<AgeIcon />}
          />
          <StatCard
            title="性别"
            value={isRegistered ? (gender || '男') : '未登记'}
            unit=""
            color={!isRegistered ? 'bg-[#373b47]' : 'bg-[#88508a]'}
            icon={<GenderIcon gender={isRegistered ? gender : null} />}
            onClick={onOpenGender}
          />
          <StatCard
            title={diseaseName && isRegistered && !isDeceased ? `健康度 · 🤒${diseaseName}` : '健康度'}
            value={!isRegistered ? '未激活' : isDeceased ? '已故' : health.toString()}
            unit={!isRegistered || isDeceased ? '' : '%'}
            color={!isRegistered ? 'bg-[#373b47]' : isDeceased ? 'bg-[#4a3234]' : 'bg-[#a63d40]'}
            icon={<HealthIcon />}
            onClick={isRegistered && !isDeceased ? onOpenHospital : undefined}
          />
          <StatCard
            title="子嗣"
            value={!isRegistered ? '未激活' : String(childrenCount)}
            unit={!isRegistered ? '' : '人'}
            color={!isRegistered ? 'bg-[#373b47]' : 'bg-[#6b4c8a]'}
            icon={<ChildIcon />}
          />
          <StatCard
            title="资产"
            value={!isRegistered ? '未激活' : isDeceased ? `遗产 ${coins.toLocaleString()}` : coins.toLocaleString()}
            unit={!isRegistered ? '' : '₽'}
            color={!isRegistered ? 'bg-[#373b47]' : 'bg-[#ca8a04]'}
            icon={<WealthIcon />}
            onClick={isRegistered ? (onOpenWealthChart || onOpenBank) : undefined}
            className="col-span-2 sm:col-span-2 md:col-span-2 lg:col-span-2"
          />
        </div>
      </div>
    </div>
  );
};
