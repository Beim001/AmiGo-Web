/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Newspaper, CheckCircle, Store, BookOpen, Swords, Map as MapIcon, CircleDollarSign, Gem, MonitorPlay, Briefcase, Zap, ChevronLeft, Shirt, Crown, Car, Plane, Globe, Baby, Scale, Hospital, Lock, Receipt, Landmark, Wallet, Building2, HeartHandshake, Home, Heart, GraduationCap, Users, Megaphone, UserCog, Gamepad2 } from 'lucide-react';

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

const TopBar = ({ coins, gems }: { coins: number, gems: number }) => (
  <div className="flex justify-between items-center bg-[#252632] px-3 py-3 border-b-2 border-black z-20 shadow-md">
    <div className="flex items-center gap-2 bg-[#1b1c25] rounded-lg pl-1 pr-4 py-1.5 border-2 border-black w-36 relative mt-1">
      <div className="w-9 h-9 bg-yellow-500 border-2 border-black rounded flex items-center justify-center absolute -left-2 -top-2 shadow-[0_2px_0_#000]">
        <User size={22} className="text-black" strokeWidth={3} />
      </div>
      <span className="text-[11px] text-gray-400 ml-8 whitespace-nowrap font-bold">请输入文本</span>
    </div>

    <div className="flex gap-2">
      <div className="flex items-center bg-[#1b1c25] rounded-full pl-1 pr-3 py-1 border-2 border-black">
        <div className="w-5 h-5 bg-yellow-400 rounded-full border border-yellow-700 flex justify-center items-center mr-1">
          <CircleDollarSign size={14} className="text-yellow-700" strokeWidth={3} />
        </div>
        <span className="font-black text-white text-xs">{coins}</span>
      </div>
      <div className="flex items-center bg-[#1b1c25] rounded-full pl-1 pr-3 py-1 border-2 border-black">
        <Gem size={18} className="text-pink-400 mr-1" fill="#f472b6" />
        <span className="font-black text-white text-xs">{gems}</span>
      </div>
    </div>
  </div>
);

const StatCard = ({ title, value, unit, color, icon }: { title: string, value: string, unit: string, color: string, icon: React.ReactNode }) => (
  <div className={`${color} border-2 border-black rounded-xl p-3 flex items-center gap-2.5 shadow-[0_4px_0_#000] relative overflow-hidden`}>
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

const CartoonCharacter = ({ clothing }: { clothing: string }) => {
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
          {/* Armor body */}
          <rect x="30" y="52" width="40" height="34" rx="4" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
          <path d="M 30 65 l 20 10 l 20 -10" fill="none" stroke="#475569" strokeWidth="2" />
          {/* Left Arm Armor */}
          <rect x="18" y="54" width="12" height="22" rx="4" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
          {/* Right Arm Armor */}
          <rect x="70" y="54" width="12" height="22" rx="4" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
        </g>
      )}
      
      {clothing === 'mage' && (
        <g>
          {/* Robe body */}
          <path d="M 32 52 L 68 52 L 75 90 L 25 90 Z" fill="#c084fc" stroke="#7e22ce" strokeWidth="2" />
          <rect x="45" y="52" width="10" height="38" fill="#a855f7" />
          {/* Left Arm Robe */}
          <rect x="16" y="54" width="16" height="20" rx="4" fill="#a855f7" stroke="#7e22ce" strokeWidth="2" />
          {/* Right Arm Robe */}
          <rect x="68" y="54" width="16" height="20" rx="4" fill="#a855f7" stroke="#7e22ce" strokeWidth="2" />
        </g>
      )}
      
      {clothing === 'casual' && (
        <g>
          {/* Hoodie body */}
          <rect x="28" y="52" width="44" height="32" rx="6" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
          <rect x="35" y="65" width="30" height="14" rx="4" fill="#fde047" stroke="#ca8a04" strokeWidth="2" />
          {/* Left Arm Hoodie */}
          <rect x="18" y="54" width="12" height="24" rx="4" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
          {/* Right Arm Hoodie */}
          <rect x="70" y="54" width="12" height="24" rx="4" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
        </g>
      )}

      {clothing === 'default' && (
        <g>
          {/* Default shirt body */}
          <rect x="30" y="52" width="40" height="30" rx="6" fill="#4A7A9C" stroke="#3A5F7A" strokeWidth="2" />
          {/* Left Arm Default */}
          <rect x="20" y="54" width="8" height="22" rx="4" fill="#F5D0B8" stroke="#D4A88C" strokeWidth="2" />
          <rect x="18" y="52" width="12" height="12" rx="2" fill="#4A7A9C" stroke="#3A5F7A" strokeWidth="2" />
          {/* Right Arm Default */}
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

const RoleTab = ({ onOpenShop, equippedClothing, coins }: { onOpenShop: () => void, equippedClothing: string, coins: number }) => (
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
         <span className="text-white text-3xl font-black tracking-widest" style={{ textShadow: '-2px -2px 0 #072a66, 2px -2px 0 #072a66, -2px 2px 0 #072a66, 2px 2px 0 #072a66, 0 4px 6px rgba(0,0,0,0.6)' }}>
           角色
         </span>
      </div>
    </div>

    <div className="flex-1 flex flex-col items-center px-4 mt-2">
      <div className="bg-[#2d2f3d] border-2 border-black rounded-xl px-6 py-2 flex flex-col items-center shadow-[0_4px_0_#000] mb-6 w-4/5 relative z-10">
        <span className="text-gray-400 text-xs font-bold mb-0.5">卡罗尼亚帝国</span>
        <span className="text-white text-xl font-black font-mono tracking-widest">1870.01</span>
      </div>

      <div 
        className="relative cursor-pointer active:scale-95 transition-transform group mt-2 flex flex-col items-center"
        onClick={onOpenShop}
      >
        <div className="w-48 h-56 relative z-10 flex justify-center items-end pb-6">
          <CartoonCharacter clothing={equippedClothing} />
        </div>
        <div className="absolute bottom-2 bg-yellow-400 text-black font-black text-xs px-5 py-2 rounded-full border-2 border-black whitespace-nowrap shadow-[0_2px_0_#000] z-30 flex items-center gap-1">
          <Store size={14} /> 点击换装
        </div>
      </div>

      <div className="w-full grid grid-cols-2 gap-4 mt-10">
        <StatCard title="岁数" value="0" unit="岁" color="bg-[#4d6b8c]" icon={<AgeIcon />} />
        <StatCard title="健康度" value="100" unit="%" color="bg-[#a63d40]" icon={<HealthIcon />} />
        <StatCard title="财富" value={coins.toString()} unit="₽" color="bg-[#ca8a04]" icon={<WealthIcon />} />
        <StatCard title="子嗣" value="0" unit="人" color="bg-[#6b4c8a]" icon={<ChildIcon />} />
      </div>
    </div>
  </div>
);

const ChestAnimation = ({ isDrawing, result, onComplete }: any) => {
  const [phase, setPhase] = React.useState<'closed' | 'opening' | 'rewards'>('closed');

  React.useEffect(() => {
    if (isDrawing && !result) {
      setPhase('closed');
    } else if (isDrawing && result) {
      setPhase('opening');
      const timer = setTimeout(() => {
        setPhase('rewards');
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setPhase('closed');
    }
  }, [isDrawing, result]);

  if (!isDrawing && !result) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center animate-in fade-in duration-300">
       {phase === 'closed' && (
          <div className="flex flex-col items-center justify-center animate-bounce">
             <div className="relative w-32 h-32">
                <div className="absolute inset-x-2 bottom-0 h-16 bg-[#b45309] rounded-b-xl border-4 border-black shadow-[0_4px_0_#000]"></div>
                <div className="absolute inset-x-0 top-6 h-12 bg-[#d97706] rounded-t-2xl border-4 border-black origin-bottom"></div>
                <div className="absolute left-1/2 top-14 -translate-x-1/2 w-6 h-8 bg-gray-300 border-2 border-black rounded-sm"></div>
             </div>
             <div className="text-yellow-400 mt-8 font-black tracking-widest text-2xl animate-pulse drop-shadow-[0_2px_0_#000]">开启宝箱中...</div>
          </div>
       )}

       {phase === 'opening' && (
          <div className="flex flex-col items-center justify-center fixed inset-0 z-50">
             <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-0 bg-yellow-100 animate-[pulse_1s_ease-in-out_infinite] opacity-50 z-10"></div>
                <div className="absolute bg-white rounded-full w-4 h-4 animate-[ping_1.5s_ease-out_forwards] z-20 scale-[150] opacity-100 mix-blend-screen"></div>
                <div className="w-[2500px] h-[2500px] flex-shrink-0 bg-[conic-gradient(from_0deg,transparent_0deg,#fde047_20deg,transparent_40deg,#fde047_60deg,transparent_80deg,#fde047_100deg,transparent_120deg,#fde047_140deg,transparent_160deg,#fde047_180deg,transparent_200deg,#fde047_220deg,transparent_240deg,#fde047_260deg,transparent_280deg,#fde047_300deg,transparent_320deg,#fde047_340deg,transparent_360deg)] animate-[spin_2s_linear_infinite] origin-center opacity-100 z-30"></div>
             </div>
             <div className="relative w-40 h-40 z-50 animate-in zoom-in duration-300">
                <div className="absolute inset-x-2 bottom-0 h-20 bg-[#b45309] rounded-b-xl border-4 border-black shadow-[0_4px_0_#000]"></div>
                <div className="absolute inset-x-0 top-0 h-16 bg-[#d97706] rounded-t-2xl border-4 border-black -rotate-12 origin-bottom-right -translate-y-8 translate-x-4"></div>
                <div className="absolute inset-0 flex items-center justify-center bottom-10">
                   <div className="w-64 h-64 bg-white rounded-full blur-[40px] animate-pulse opacity-100"></div>
                </div>
             </div>
             <div className="absolute bottom-32 text-white font-black tracking-widest text-4xl drop-shadow-[0_0_20px_#facc15] z-50">金色传说！</div>
          </div>
       )}

       {phase === 'rewards' && result && (
          <div className="flex flex-col items-center w-full max-w-md px-4 animate-in zoom-in duration-500 z-50">
             <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none opacity-50 z-0">
                <div className="w-[2500px] h-[2500px] flex-shrink-0 bg-[conic-gradient(from_0deg,transparent_0deg,#fde047_20deg,transparent_40deg,#fde047_60deg,transparent_80deg,#fde047_100deg,transparent_120deg,#fde047_140deg,transparent_160deg,#fde047_180deg,transparent_200deg,#fde047_220deg,transparent_240deg,#fde047_260deg,transparent_280deg,#fde047_300deg,transparent_320deg,#fde047_340deg,transparent_360deg)] animate-[spin_10s_linear_infinite] origin-center"></div>
                <div className="absolute inset-0 bg-yellow-300/30 blur-2xl"></div>
             </div>
             
             <div className="text-yellow-300 font-black text-4xl mb-8 tracking-wider drop-shadow-[0_4px_0_#000] z-10">获得奖励</div>
             
             <div className={`grid ${result.length > 1 ? 'grid-cols-5 gap-3' : 'grid-cols-1 gap-6'} w-full z-10`}>
                {result.map((item: any, idx: number) => (
                  <div key={idx} className="flex flex-col items-center animate-in slide-in-from-bottom-8 fade-in" style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}>
                     <div className={`${result.length > 1 ? 'w-14 h-14 border-2' : 'w-24 h-24 border-4'} bg-gradient-to-b from-yellow-100 to-yellow-400 rounded-xl flex items-center justify-center border-white shadow-[0_0_15px_#fde047] relative overflow-hidden`}>
                        {item.type === 'coin' ? (
                          <CircleDollarSign size={result.length > 1 ? 32 : 50} className="text-yellow-600 drop-shadow-md" strokeWidth={2.5} />
                        ) : (
                          <Shirt size={result.length > 1 ? 32 : 50} className="text-purple-600 drop-shadow-md" strokeWidth={2.5} />
                        )}
                        {item.type !== 'coin' && <div className="absolute -top-1 -right-1 text-xs">✨</div>}
                     </div>
                     {result.length === 1 && (
                       <div className="text-white font-bold text-lg mt-3 text-center bg-black/50 px-3 py-1 rounded-full border border-gray-600">
                         {item.name}
                       </div>
                     )}
                     {result.length > 1 && item.type !== 'coin' && (
                       <div className="text-white font-bold text-[9px] mt-1 text-center bg-purple-600/80 px-1 py-0.5 rounded shadow-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                         {item.name}
                       </div>
                     )}
                     {result.length > 1 && item.type === 'coin' && (
                       <div className="text-yellow-300 font-bold text-[10px] mt-1 text-center shadow-sm">
                         1000
                       </div>
                     )}
                  </div>
                ))}
             </div>
             
             <button 
               onClick={onComplete}
               className="mt-12 bg-gradient-to-b from-[#ffe56c] to-[#f5b822] text-black font-black px-12 py-3 rounded-full border-4 border-black active:scale-95 shadow-[0_6px_0_#000] text-xl transition-transform z-10"
             >
               收下奖励
             </button>
          </div>
       )}
    </div>
  );
};

const ShopModal = ({ 
  onClose,
  coins,
  gems,
  setCoins,
  setGems,
  ownedClothes,
  setOwnedClothes,
  equippedClothing,
  setEquippedClothing,
  freeDrawUsed,
  setFreeDrawUsed
}: any) => {

  const SHOP_ITEMS = [
    { id: 'knight', name: '骑士盔甲', effect: '防御力+10', currency: 'coin', price: 2000, icon: <Shirt size={26} className="text-gray-700 absolute fill-gray-400" strokeWidth={2}/>, bg: 'bg-[#b4f0c0]', iconBg: 'bg-[#cbd5e1]' },
    { id: 'mage', name: '法师长袍', effect: '魔力+15', currency: 'gem', price: 500, icon: <Shirt size={26} className="text-purple-900 absolute fill-purple-700" strokeWidth={2}/>, bg: 'bg-[#c8e8ff]', iconBg: 'bg-[#93c5fd]' },
    { id: 'casual', name: '休闲卫衣', effect: '魅力+5', currency: 'coin', price: 800, icon: <Shirt size={26} className="text-orange-700 absolute fill-orange-400" strokeWidth={2}/>, bg: 'bg-[#b4f0c0]', iconBg: 'bg-[#fde047]' }
  ];

  const [isDrawing, setIsDrawing] = React.useState(false);
  const [drawResult, setDrawResult] = React.useState<any | null>(null);

  const handleDraw = (times: number) => {
    let cost = 0;
    if (times === 1) {
      if (!freeDrawUsed) {
        cost = 0;
      } else {
        cost = 80;
      }
    } else {
      cost = 720;
    }

    if (gems < cost) {
      alert("钻石不足！");
      return;
    }

    if (cost > 0) setGems(gems - cost);
    if (times === 1 && !freeDrawUsed) setFreeDrawUsed(true);

    setIsDrawing(true);
    setDrawResult(null);

    setTimeout(() => {
      const results = [];
      for (let i = 0; i < times; i++) {
        // Find items the user doesn't own yet, and haven't already won in this multi-pull
        const unownedItems = SHOP_ITEMS.filter(item => !ownedClothes.includes(item.id) && !results.find(r => r.id === item.id));
        
        // 20% chance to get a clothing item if any are unowned
        if (unownedItems.length > 0 && Math.random() > 0.8) {
          const resultItem = unownedItems[Math.floor(Math.random() * unownedItems.length)];
          results.push(resultItem);
        } else {
          results.push({ type: 'coin', amount: 1000, name: '1000 金币' });
        }
      }
      
      const newClothes = results.filter(r => r.type !== 'coin').map(r => r.id);
      if (newClothes.length > 0) {
        setOwnedClothes([...ownedClothes, ...newClothes]);
      }
      
      const totalCoins = results.filter(r => r.type === 'coin').reduce((sum, r) => sum + r.amount, 0);
      if (totalCoins > 0) {
        setCoins(coins + totalCoins);
      }
      
      setDrawResult(results);
    }, 1500);
  };

  return (
    <div className="absolute inset-0 bg-[#252632] flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-200">
      <div className="relative w-full h-16 z-20 drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] flex-shrink-0">
        <div className="absolute inset-0 flex">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? 'bg-[#0f4b99]' : 'bg-[#1553a6]'} relative`}>
               <div className={`absolute -bottom-4 left-0 w-full h-8 rounded-b-full ${i % 2 === 0 ? 'bg-[#0f4b99]' : 'bg-[#1553a6]'}`}></div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center px-4 pt-1 z-30">
          <button onClick={onClose} className="p-1.5 bg-[#0f4b99] border-2 border-[#072a66] rounded-xl active:scale-95 shadow-[0_2px_0_#072a66]">
            <ChevronLeft size={24} className="text-white drop-shadow-md" strokeWidth={3} />
          </button>
          <div className="flex-1 flex justify-center items-center -ml-10 pointer-events-none">
             <span className="text-white text-3xl font-black tracking-widest" style={{ textShadow: '-2px -2px 0 #072a66, 2px -2px 0 #072a66, -2px 2px 0 #072a66, 2px 2px 0 #072a66, 0 4px 6px rgba(0,0,0,0.6)' }}>
               商城
             </span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pb-6 pt-8">
        <div className="px-4">
          <div className="flex justify-center">
            <div className="bg-[#2d2f3d] text-center text-gray-300 py-1 px-12 rounded-full text-sm font-bold border-2 border-black shadow-[0_2px_0_#000]">
              限定宝箱
            </div>
          </div>
          
          <div className="bg-gradient-to-b from-[#b86df5] to-[#f48cfb] p-3 rounded-2xl border-4 border-black shadow-[0_4px_0_#000] relative mt-4">
            <div className="flex gap-2 relative z-10">
               <div className="w-24 h-24 relative flex-shrink-0">
                 <div className="absolute inset-0 bg-[#8c33de] border-4 border-[#6920ad] rotate-12 rounded-xl opacity-80 shadow-lg"></div>
                 <div className="absolute inset-0 bg-[#a64ff2] border-4 border-white -rotate-6 rounded-xl flex items-center justify-center z-10 shadow-lg">
                   <Crown size={36} className="text-white fill-white drop-shadow-md" />
                 </div>
               </div>
               <div className="flex-1 pt-1 z-10">
                 <h3 className="text-white text-3xl font-black drop-shadow-[0_2px_0_#000] leading-none mb-2 text-right tracking-wider">限定宝箱</h3>
                 <p className="text-white text-[10px] text-right font-extrabold drop-shadow-[0_1px_0_#000] leading-tight mt-1">
                   获得10金币，赠送<span className="text-blue-300">高级</span>、<br/><span className="text-purple-300">稀有</span>、<span className="text-orange-300">限定</span>的服饰与皮肤
                 </p>
                 <div className="flex flex-col items-end mt-2 gap-1.5">
                   <div className="bg-[#c85ce6] border-2 border-[#9438ad] text-white text-[10px] px-3 py-0.5 rounded-full font-bold shadow-sm">
                     9次内必得<span className="text-blue-300 ml-1">稀有</span>服饰
                   </div>
                   <div className="bg-[#c85ce6] border-2 border-[#9438ad] text-white text-[10px] px-3 py-0.5 rounded-full font-bold shadow-sm">
                     99次内必得<span className="text-orange-300 ml-1">限定</span>皮肤
                   </div>
                 </div>
               </div>
            </div>
            
            <div className="flex gap-3 mt-4 relative z-10">
              <button onClick={() => handleDraw(1)} className="flex-1 bg-gradient-to-b from-[#ffe56c] to-[#f5b822] border-2 border-black rounded-xl py-1.5 flex flex-col items-center shadow-[0_4px_0_#000] active:translate-y-1 active:shadow-none transition-all">
                 <span className="text-black font-black text-sm">抽1次</span>
                 <span className="text-[#a46914] font-bold text-[10px] flex items-center gap-1">
                    {!freeDrawUsed ? '首次免费' : <><Gem size={10} className="text-pink-600 fill-pink-500"/> x80</>}
                 </span>
              </button>
              <button onClick={() => handleDraw(10)} className="flex-1 bg-gradient-to-b from-[#ffe56c] to-[#f5b822] border-2 border-black rounded-xl py-1.5 flex flex-col items-center shadow-[0_4px_0_#000] active:translate-y-1 active:shadow-none transition-all">
                 <span className="text-black font-black text-sm">抽10次</span>
                 <span className="text-[#a46914] font-bold text-[10px] flex items-center gap-1">
                    <Gem size={10} className="text-pink-600 fill-pink-500"/> x720
                 </span>
              </button>
            </div>
          </div>
  
          <div className="flex justify-center mt-6">
            <div className="bg-[#2d2f3d] text-center text-gray-300 py-1 px-12 rounded-full text-sm font-bold border-2 border-black shadow-[0_2px_0_#000]">
              服饰商城
            </div>
          </div>
  
          <div className="grid grid-cols-3 gap-3 mt-4">
            {SHOP_ITEMS.map(item => {
              const isOwned = ownedClothes.includes(item.id);
              const isEquipped = equippedClothing === item.id;
              
              const handleAction = () => {
                if (isEquipped) return;
                if (isOwned) {
                  setEquippedClothing(item.id);
                } else {
                  if (item.currency === 'coin' && coins >= item.price) {
                    setCoins(coins - item.price);
                    setOwnedClothes([...ownedClothes, item.id]);
                    setEquippedClothing(item.id);
                  } else if (item.currency === 'gem' && gems >= item.price) {
                    setGems(gems - item.price);
                    setOwnedClothes([...ownedClothes, item.id]);
                    setEquippedClothing(item.id);
                  } else {
                    alert('余额不足');
                  }
                }
              };
              
              return (
                <div key={item.id} className={`${item.bg} border-2 border-black rounded-xl p-2 flex flex-col items-center shadow-[0_4px_0_#000] h-36`}>
                  <span className="text-[#1f5c2b] text-[10px] font-black whitespace-nowrap mb-1">{item.name}</span>
                  <div className="w-14 h-14 bg-[#5eb46d] rounded-lg border-2 border-black my-1 flex justify-center items-center relative overflow-hidden shrink-0">
                     <div className={`absolute inset-0 ${item.iconBg}`}></div>
                     {item.icon}
                  </div>
                  <span className="text-black text-[10px] font-bold mb-1">{item.effect}</span>
                  <button 
                    onClick={handleAction}
                    className={`w-full mt-auto bg-gradient-to-b ${isEquipped ? 'from-[#a1a1aa] to-[#71717a] text-white' : 'from-[#ffe56c] to-[#f5b822] text-black'} border-2 border-black font-black text-[11px] py-1 rounded-lg shadow-[0_2px_0_#000] active:translate-y-1 active:shadow-none flex justify-center items-center`}
                  >
                     {isEquipped ? '已穿戴' : isOwned ? '穿戴' : (
                       <>
                         {item.currency === 'coin' ? <CircleDollarSign size={12} className="text-yellow-700 mr-0.5 stroke-[3]"/> : <Gem size={10} className="text-pink-600 fill-pink-500 mr-0.5"/>}
                         {item.price}
                       </>
                     )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {(isDrawing || drawResult) && (
        <ChestAnimation 
          isDrawing={isDrawing} 
          result={drawResult} 
          onComplete={() => {
            setIsDrawing(false);
            setDrawResult(null);
          }} 
        />
      )}
    </div>
  );
};

const FUNC_BENTO = [
  // row 1-2
  { id: 'birth', label: '出生登记', sub: '新生儿', icon: Baby, colors: ['#d69e9e', '#c48989'], span: 'col-span-2 row-span-2', styleId: 0 },
  { id: 'marriage', label: '结婚', sub: '婚姻关系', icon: Heart, colors: ['#d6a59e', '#c49389'], span: 'col-span-2', styleId: 1 },
  { id: 'visa', label: '签证', sub: '出入境', icon: Plane, colors: ['#9eb4d6', '#89a2c4'], span: 'col-span-1', styleId: 2 },
  { id: 'immigrate', label: '移民', sub: '居留入籍', icon: Globe, colors: ['#bca4d6', '#a990c4'], span: 'col-span-1', styleId: 3 },
  
  // row 3-4
  { id: 'finance', label: '财务', sub: '资产信用', icon: Wallet, colors: ['#d6c99e', '#c4b689'], span: 'col-span-2 row-span-2', styleId: 0 },
  { id: 'gender', label: '性别权利', sub: '转化性别', icon: UserCog, colors: ['#d6b79e', '#c4a589'], span: 'col-span-2', styleId: 1 },
  { id: 'tax', label: '税单', sub: '缴税查询', icon: Receipt, colors: ['#9ed6ba', '#89c4a6'], span: 'col-span-1', styleId: 2 },
  { id: 'cost', label: '生活成本', sub: '物价补贴', icon: Landmark, colors: ['#9ed6d6', '#89c4c4'], span: 'col-span-1', styleId: 3 },

  // row 5
  { id: 'housing', label: '住房', sub: '房产交易', icon: Home, colors: ['#d6b09e', '#c49e89'], span: 'col-span-2', styleId: 0 },
  { id: 'job', label: '就业', sub: '找工作', icon: Briefcase, colors: ['#a3a9b3', '#9298a3'], span: 'col-span-2', styleId: 1 },
  
  // row 6-7
  { id: 'company', label: '公司', sub: '企业事务', icon: Building2, colors: ['#9ec2d6', '#89b0c4'], span: 'col-span-1 row-span-2', styleId: 2 },
  { id: 'license', label: '驾照', sub: '申领换证', icon: Car, colors: ['#b3b3b3', '#a3a3a3'], span: 'col-span-1 row-span-2', styleId: 3 },
  { id: 'education', label: '教育', sub: '入学证明', icon: GraduationCap, colors: ['#9eaad6', '#8997c4'], span: 'col-span-2', styleId: 0 },
  { id: 'hospital', label: '医院', sub: '医疗服务', icon: Hospital, colors: ['#d69ea8', '#c48995'], span: 'col-span-2', styleId: 1 },
  
  // row 8-9
  { id: 'welfare', label: '社会福利', sub: '养老救济', icon: HeartHandshake, colors: ['#d69eb4', '#c489a2'], span: 'col-span-2 row-span-2', styleId: 0 },
  { id: 'court', label: '法院', sub: '诉讼文书', icon: Scale, colors: ['#b8b8b3', '#a6a6a1'], span: 'col-span-1', styleId: 2 },
  { id: 'prison', label: '监狱', sub: '服刑查询', icon: Lock, colors: ['#a1a1a6', '#8f8f94'], span: 'col-span-1', styleId: 3 },
  { id: 'org', label: '组织', sub: '党派管理', icon: Users, colors: ['#b09ed6', '#9c89c4'], span: 'col-span-2', styleId: 1 },

  // row 10
  { id: 'movement', label: '运动', sub: '罢工游行', icon: Megaphone, colors: ['#d69ec2', '#c489b0'], span: 'col-span-2', styleId: 0 },
  { id: 'map_srv', label: '地图', sub: '社区服务', icon: MapIcon, colors: ['#9cd6a5', '#88c492'], span: 'col-span-2', styleId: 1 },

  // row 11
  { id: 'entertainment', label: '娱乐', sub: '旅行/合法娱乐/上瘾类', icon: Gamepad2, colors: ['#c49ed6', '#b089c4'], span: 'col-span-4', styleId: 2 },
];

const renderBentoContent = (item: any) => {
  if (item.span === 'col-span-2 row-span-2') {
    return (
      <>
        <div className="absolute -right-4 -bottom-4 opacity-20 rotate-12 scale-[3] pointer-events-none">
          <item.icon size={64} className="text-white" strokeWidth={2} />
        </div>
        <div className="flex flex-col items-center justify-center relative z-10 h-full p-4">
          <item.icon size={48} className="text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.8)] mb-3" stroke="black" strokeWidth={2} />
          <h2 className="text-white text-xl font-black tracking-widest mb-1" style={{ textShadow: '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 0 3px 0 #000' }}>{item.label}</h2>
          <div className="bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded border border-black font-extrabold shadow-[0_2px_0_#000]">{item.sub}</div>
        </div>
      </>
    );
  }
  if (item.span === 'col-span-2' || item.span === 'col-span-4') {
    return (
      <>
        <div className="absolute -right-2 -bottom-2 opacity-20 rotate-12 scale-[2.5] pointer-events-none">
          <item.icon size={48} className="text-white" strokeWidth={2} />
        </div>
        <div className="flex items-center justify-start relative z-10 h-full px-4 gap-3">
          <item.icon size={32} className="text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.8)]" stroke="black" strokeWidth={2.5} />
          <div className="flex flex-col">
            <h2 className="text-white text-base font-black tracking-widest mb-0.5" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 0 #000' }}>{item.label}</h2>
            <div className="bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded border border-black font-extrabold shadow-[0_1px_0_#000] w-max">{item.sub}</div>
          </div>
        </div>
      </>
    );
  }
  if (item.span === 'col-span-1 row-span-2') {
    return (
      <>
        <div className="absolute -right-2 -bottom-2 opacity-20 rotate-12 scale-[2.5] pointer-events-none">
          <item.icon size={40} className="text-white" strokeWidth={2} />
        </div>
        <div className="flex flex-col items-center justify-center relative z-10 h-full p-2">
          <item.icon size={32} className="text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.8)] mb-1.5" stroke="black" strokeWidth={2.5} />
          <h2 className="text-white text-[13px] font-black tracking-widest mb-1 text-center leading-tight" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 0 #000' }}>{item.label}</h2>
          <div className="bg-black/60 text-white text-[8px] px-1 py-0.5 rounded border border-black font-extrabold shadow-[0_1px_0_#000] text-center truncate w-full">{item.sub}</div>
        </div>
      </>
    );
  }
  
  // col-span-1
  return (
    <>
      <div className="absolute -right-1 -bottom-1 opacity-20 rotate-12 scale-[2] pointer-events-none">
        <item.icon size={32} className="text-white" strokeWidth={2} />
      </div>
      <div className="flex flex-col items-center justify-center relative z-10 h-full p-1">
        <item.icon size={24} className="text-white drop-shadow-[0_1.5px_0_rgba(0,0,0,0.8)] mb-1" stroke="black" strokeWidth={2.5} />
        <h2 className="text-white text-[11px] font-black tracking-widest text-center leading-tight" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 1.5px 0 #000' }}>{item.label}</h2>
      </div>
    </>
  );
};

const FuncTab = () => (
  <div className="flex-1 overflow-y-auto bg-[#252632] pb-6 flex flex-col">
    <div className="bg-[#1e3a8a] text-white text-center py-3 font-bold text-xl border-b-4 border-[#172554] relative z-10 shadow-lg flex-shrink-0">
      <div className="absolute inset-0 flex justify-center items-center opacity-30 pointer-events-none overflow-hidden">
         <div className="w-24 h-24 border-[6px] border-black rounded-full absolute -top-8"></div>
         <div className="w-32 h-32 border-[6px] border-black rounded-full absolute -bottom-16"></div>
      </div>
      <span className="relative z-10 drop-shadow-[0_2px_0_#000] font-black tracking-widest text-2xl">功能</span>
    </div>

    <div className="p-4 mt-2">
      <div className="grid grid-cols-4 gap-3 auto-rows-[76px]">
        {FUNC_BENTO.map((item) => (
          <div 
            key={item.id} 
            className={`
              ${item.span} 
              rounded-xl border-2 border-black relative overflow-hidden shadow-[0_4px_0_#000] 
              cursor-pointer active:translate-y-[4px] active:shadow-none transition-all
            `}
            style={{ background: `linear-gradient(to right, ${item.colors[0]}, ${item.colors[1]})` }}
          >
            {renderBentoContent(item)}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const INITIAL_EVENTS = [
  { 
    id: 'career', 
    title: '职业抉择', 
    icon: Briefcase,
    headline: '震惊！海外分公司急需新领导！',
    date: '2025年10月',
    desc: '你面临一个重要的人生转折。你的经理向你提供了一个去海外分公司担任领导的机会。\n\n接受这个机会意味着你将获得更高的薪水和更大的权力，但你需要离开你熟悉的环境，并且工作压力会显著增加。\n\n你该如何抉择？',
    options: [
      { label: '接受外派 (+金币, -体力)', type: 'primary' },
      { label: '婉言拒绝 (维持现状)', type: 'secondary' }
    ]
  },
  { 
    id: 'investment', 
    title: '风险投资', 
    icon: CircleDollarSign, 
    headline: '神秘加密货币暴涨？是风口还是陷阱！',
    date: '2026年3月',
    desc: '你的朋友向你推荐了一个看起来非常有潜力的加密货币项目。虽然风险很高，但如果成功，可能会带来10倍甚至更高的回报。\n\n你手里有一笔闲置资金，你决定冒险一试吗？',
    options: [
      { label: '投资 50000 金币 (高风险)', type: 'primary' },
      { label: '稳妥起见不投资', type: 'secondary' }
    ]
  },
  { 
    id: 'education', 
    title: '自我提升', 
    icon: BookOpen, 
    headline: '终身学习时代来临！名校开放进修名额',
    date: '2026年9月',
    desc: '你意识到当前的知识储备已经不足以应对未来的挑战。你可以选择花费一笔积蓄去进修一个高级学位，或者继续在当前的岗位上摸爬滚打。\n\n深造会消耗大量的时间和金钱，但可能会极大地提升你未来的上限。',
    options: [
      { label: '报名深造 (-20000 金币)', type: 'primary' },
      { label: '继续工作', type: 'secondary' }
    ]
  },
];

const SimTab = () => {
  const [activeEvent, setActiveEvent] = React.useState<any>(null);
  const [events, setEvents] = React.useState([...INITIAL_EVENTS]);

  const handleOptionSelect = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    setActiveEvent(null);
  };

  if (activeEvent) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#252632] flex flex-col p-4 relative">
        <div className="absolute top-4 left-4 z-20 cursor-pointer bg-black/40 p-2 rounded-full border-2 border-black" onClick={() => setActiveEvent(null)}>
          <ChevronLeft className="text-white" size={24} />
        </div>
        
        <div className="flex-1 mt-12 bg-[#f4ebd0] border-[4px] border-black p-5 relative shadow-[0_6px_0_#000] flex flex-col">
           <div className="border-b-[4px] border-black pb-3 mb-4 flex flex-col items-center">
             <h1 className="font-serif text-4xl font-black text-black tracking-widest text-center" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>人生快报</h1>
             <div className="flex justify-between w-full text-sm font-bold border-t-[3px] border-b-[3px] border-black py-1 mt-3">
               <span>{activeEvent.date}</span>
               <span>头版头条</span>
             </div>
           </div>
           
           <h2 className="text-black text-2xl font-black text-center mb-6 leading-snug">{activeEvent.headline}</h2>
           
           <div className="flex justify-center mb-6">
             <div className="w-24 h-24 bg-black/5 border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0_#000] -rotate-3">
               <activeEvent.icon size={48} className="text-black" />
             </div>
           </div>
           
           <div className="flex-1 text-black font-bold leading-relaxed overflow-y-auto text-[16px] whitespace-pre-wrap px-2">
             {activeEvent.desc}
           </div>
           
           <div className="mt-8 flex flex-col gap-3">
             {activeEvent.options.map((opt: any, idx: number) => (
               <button 
                 key={idx} 
                 onClick={() => handleOptionSelect(activeEvent.id)}
                 className={`py-3.5 border-[3px] border-black font-black text-black text-[17px] shadow-[4px_4px_0_#000] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all ${idx === 0 ? 'bg-[#ffeb3b]' : 'bg-[#e0e0e0]'}`}
               >
                 {opt.label}
               </button>
             ))}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#252632] pb-6 flex flex-col relative overflow-hidden">
      <div className="bg-[#1e293b] text-white text-center py-3 font-bold text-xl border-b-4 border-[#0f172a] relative z-20 shadow-lg flex-shrink-0">
        <div className="absolute inset-0 flex justify-center items-center opacity-30 pointer-events-none overflow-hidden">
           <div className="w-24 h-24 border-[6px] border-black rounded-full absolute -top-8 left-10"></div>
           <div className="w-32 h-32 border-[6px] border-black rounded-full absolute -bottom-16 right-0"></div>
        </div>
        <span className="relative z-10 drop-shadow-[0_2px_0_#000] font-black tracking-widest text-2xl">推演</span>
      </div>

      {events.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="w-24 h-24 bg-[#3a3b46] rounded-full flex items-center justify-center mb-4 border-4 border-black shadow-[0_4px_0_#000]">
            <CheckCircle size={48} className="text-[#a1a1aa]" />
          </div>
          <h2 className="text-white text-2xl font-black mb-2 tracking-widest" style={{ textShadow: '0 2px 0 #000' }}>今年风平浪静</h2>
          <p className="text-[#a1a1aa] font-bold">没有发生什么大事件，享受平静的生活吧。</p>
        </div>
      ) : (
        <div className="flex-1 relative flex items-center justify-center p-6 mt-4 perspective-[1000px]">
          {events.map((event, index) => {
            const isTop = index === events.length - 1;
            const reverseIndex = events.length - 1 - index;
            
            const rotation = reverseIndex % 2 === 0 ? (reverseIndex * 2) : -(reverseIndex * 2);
            const yOffset = reverseIndex * -12;
            const xOffset = reverseIndex % 2 === 0 ? reverseIndex * 4 : reverseIndex * -4;

            return (
              <div 
                key={event.id}
                onClick={() => {
                  if (isTop) setActiveEvent(event);
                }}
                className={`absolute w-full max-w-[320px] h-[460px] bg-[#f4ebd0] border-[3px] border-black p-4 flex flex-col transition-all duration-300 ${isTop ? 'cursor-pointer hover:-translate-y-2 hover:shadow-[8px_12px_0_#000] shadow-[6px_8px_0_#000]' : 'shadow-[2px_2px_0_#000]'}`}
                style={{ 
                  zIndex: index,
                  transform: `translate(${xOffset}px, ${yOffset}px) rotate(${rotation}deg) scale(${1 - reverseIndex * 0.03})`,
                  opacity: reverseIndex > 2 ? 0 : 1 
                }}
              >
                <div className="border-b-[3px] border-black pb-3 mb-3 flex flex-col items-center">
                  <h1 className="font-serif text-3xl font-black text-black tracking-widest text-center" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>人生快报</h1>
                  <div className="flex justify-between w-full text-xs font-bold border-t-[2px] border-b-[2px] border-black py-1 mt-2">
                    <span>{event.date}</span>
                    <span>NO. {9824 + index}</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <h2 className="text-xl font-black text-black leading-tight mb-4 text-center px-2">{event.headline}</h2>
                  
                  <div className="flex flex-col items-center gap-3 mb-3 flex-1">
                    <div className="w-20 h-20 bg-black/5 border-[2px] border-black flex items-center justify-center flex-shrink-0 -rotate-2">
                      <event.icon size={36} className="text-black" />
                    </div>
                    <p className="text-[13px] font-bold text-gray-800 line-clamp-6 leading-relaxed text-justify px-2">
                      {event.desc}
                    </p>
                  </div>
                  
                  {isTop && (
                    <div className="mt-auto flex justify-center pb-2">
                      <span className="bg-black text-white px-4 py-2 text-sm font-bold animate-pulse shadow-[2px_2px_0_#000] border-2 border-transparent">
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

const MapTab = () => (
  <div className="flex-1 overflow-y-auto bg-[#252632] pb-6 flex flex-col">
    <div className="bg-[#a62a2a] text-white text-center py-3 font-bold text-xl border-b-4 border-[#6e1d1d] relative z-10 shadow-lg">
      <div className="absolute inset-0 flex justify-center items-center opacity-30 pointer-events-none overflow-hidden">
         <div className="w-24 h-24 border-[6px] border-black rounded-full absolute -top-8"></div>
         <div className="w-32 h-32 border-[6px] border-black rounded-full absolute -bottom-16"></div>
      </div>
      <span className="relative z-10 drop-shadow-[0_2px_0_#000] font-black tracking-widest text-2xl">地图</span>
    </div>
    
    <div className="p-4 space-y-4">
      <div className="h-32 bg-gradient-to-r from-[#cd8d32] to-[#f1c356] rounded-xl border-4 border-black relative overflow-hidden shadow-[0_4px_0_#000]">
        <div className="absolute -left-4 -bottom-4 w-28 h-28 bg-[#b47a28] rounded-full opacity-70 border-[6px] border-[#91621f]"></div>
        <div className="absolute top-4 left-16 w-14 h-14 bg-[#facc15] rotate-12 border-4 border-[#ca8a04] opacity-80 rounded shadow-inner"></div>
        <div className="absolute bottom-4 left-1/3 w-8 h-8 bg-[#fcd34d] rotate-45 border-2 border-[#d97706] opacity-90 rounded"></div>
        
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end z-10">
          <h2 className="text-[#ffe066] text-[28px] font-black tracking-widest mb-1" style={{ textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 4px 0 #000' }}>
            金币矿洞
          </h2>
          <div className="bg-[#4d3215] text-[#ffe066] text-xs px-2 py-0.5 rounded border border-black font-extrabold shadow-[0_2px_0_#000]">
            第1层
          </div>
        </div>
      </div>

      <div className="h-32 bg-gradient-to-r from-[#9853eb] to-[#da87f5] rounded-xl border-4 border-black relative overflow-hidden shadow-[0_4px_0_#000]">
        <div className="absolute -left-2 top-0 w-32 h-full bg-[#7a3cc2] skew-x-12 opacity-50 border-r-4 border-black"></div>
        <div className="absolute left-6 -bottom-6 w-24 h-32 bg-[#c084fc] rotate-[30deg] border-[6px] border-[#a855f7] opacity-80 rounded-xl shadow-lg"></div>
        <div className="absolute left-28 top-2 w-12 h-16 bg-[#e879f9] -rotate-12 border-[3px] border-[#c026d3] opacity-80 rounded-lg"></div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end z-10">
          <h2 className="text-[#ffb3f0] text-[28px] font-black tracking-widest mb-1" style={{ textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 4px 0 #000' }}>
            水晶山谷
          </h2>
          <div className="bg-[#3c1d57] text-[#ffb3f0] text-xs px-2 py-0.5 rounded border border-black font-extrabold shadow-[0_2px_0_#000]">
            第1层
          </div>
        </div>
      </div>

      <div className="h-32 bg-gradient-to-r from-[#504085] to-[#8869b2] rounded-xl border-4 border-black relative overflow-hidden shadow-[0_4px_0_#000]">
        <div className="absolute left-16 top-1/2 -translate-y-1/2 w-28 h-28 bg-[#392e62] rounded-full flex items-center justify-center border-[6px] border-[#251e44] shadow-inner">
          <div className="w-14 h-14 bg-[#8c33de] rounded-full blur-md"></div>
          <div className="absolute w-6 h-6 bg-white rotate-45"></div>
        </div>
        <div className="absolute -right-4 -top-8 w-40 h-40 bg-[#423371] rotate-12 opacity-60 border-l-[6px] border-[#251e44]"></div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end z-10">
          <h2 className="text-[#ff6a6a] text-[28px] font-black tracking-widest mb-1" style={{ textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 4px 0 #000' }}>
            无尽深渊
          </h2>
          <div className="bg-[#31254d] text-white text-xs px-2 py-0.5 rounded border border-black font-extrabold shadow-[0_2px_0_#000]">
            今日剩余2次
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TABS = [
  { id: 'role', label: '角色', icon: User, badge: false },
  { id: 'bag', label: '功能', icon: Briefcase, badge: false },
  { id: 'combat', label: '推演', icon: Swords, badge: false },
  { id: 'log', label: '日志', icon: BookOpen, badge: true },
  { id: 'map', label: '地图', icon: MapIcon, badge: false },
];

const BottomNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (id: string) => void }) => {
  return (
    <div className="h-[75px] bg-[#3a3b46] flex relative mt-auto border-t-[3px] border-black z-20">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <div 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col justify-center items-center relative border-r-[3px] border-black last:border-r-0 cursor-pointer select-none transition-all duration-300 ease-out overflow-hidden ${
              isActive 
                ? 'flex-[2.2] bg-[#fcd34d]' 
                : 'flex-1 bg-[#474854] hover:bg-[#535669]'
            }`}
          >
            {isActive && (
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 2.5px, transparent 2.5px)', backgroundSize: '16px 16px', backgroundPosition: 'center' }}></div>
            )}
            
            <div className={`relative flex flex-col items-center justify-center z-10 w-full h-full`}>
              <div className={`transition-all duration-300 ease-out ${isActive ? '-translate-y-2.5 scale-[1.35]' : 'translate-y-0 scale-100'}`}>
                <div className="relative">
                  <tab.icon 
                    size={28} 
                    className="drop-shadow-[0_2px_0_rgba(0,0,0,1)]" 
                    fill={isActive ? (tab.id === 'map' ? '#8bc6f4' : tab.id === 'role' ? '#ff6a6a' : tab.id === 'log' ? '#c084fc' : tab.id === 'combat' ? '#a3a3a3' : '#d97706') : '#858796'}
                    stroke="black"
                    strokeWidth={isActive ? 2 : 2.5}
                  />
                  {tab.badge && (
                    <div className={`absolute ${isActive ? '-top-0.5 -right-0.5' : '-top-1 -right-1.5'} w-3.5 h-3.5 bg-[#ef4444] rounded-full border-[2px] border-black z-20`}></div>
                  )}
                </div>
              </div>
              <div className={`absolute bottom-1 transition-all duration-300 ease-out ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                 <span className="text-white font-black text-[15px] tracking-widest" style={{ textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 0 #000' }}>{tab.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('role');
  const [showShop, setShowShop] = useState(false);
  const [coins, setCoins] = useState(1047650);
  const [gems, setGems] = useState(20420);
  const [equippedClothing, setEquippedClothing] = useState('default');
  const [ownedClothes, setOwnedClothes] = useState(['default']);

  const [freeDrawUsed, setFreeDrawUsed] = useState(false);

  return (
    <div className="h-[100dvh] w-full bg-black flex justify-center font-sans overflow-hidden">
      <div className="w-full max-w-[480px] h-full bg-[#1c1d25] flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
         <TopBar coins={coins} gems={gems} />
         
         {activeTab === 'role' && <RoleTab onOpenShop={() => setShowShop(true)} equippedClothing={equippedClothing} coins={coins} />}
         {activeTab === 'bag' && <FuncTab />}
         {activeTab === 'combat' && <SimTab />}
         {activeTab === 'map' && <MapTab />}
         {activeTab !== 'role' && activeTab !== 'map' && activeTab !== 'bag' && activeTab !== 'combat' && (
           <div className="flex-1 overflow-y-auto bg-[#252632] pb-6 flex flex-col">
             <div className="bg-[#3a3b46] text-white text-center pt-3 pb-2 font-bold text-xl border-b-2 border-black">
               {TABS.find(t => t.id === activeTab)?.label}
             </div>
             <div className="flex-1 flex justify-center items-center text-gray-500 font-bold flex-col gap-4">
                <Store size={48} className="opacity-20" />
                <span>该页面正在建设中...</span>
             </div>
           </div>
         )}
         
         <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
         
         {/* Shop Overlay */}
         {showShop && (
           <ShopModal 
             onClose={() => setShowShop(false)} 
             coins={coins} 
             gems={gems} 
             setCoins={setCoins} 
             setGems={setGems} 
             ownedClothes={ownedClothes} 
             setOwnedClothes={setOwnedClothes} 
             equippedClothing={equippedClothing} 
             setEquippedClothing={setEquippedClothing}
             freeDrawUsed={freeDrawUsed}
             setFreeDrawUsed={setFreeDrawUsed}
           />
         )}
      </div>
    </div>
  );
}
