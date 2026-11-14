/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Newspaper, CheckCircle, Store, BookOpen, Swords, Map as MapIcon, CircleDollarSign, Gem, MonitorPlay, Briefcase, Zap, ChevronLeft, Shirt, Crown, Car, Plane, Globe, Baby, Scale, Hospital, Lock, Receipt, Landmark, Wallet, Building, Building2, TrendingUp, TrendingDown, HeartHandshake, Home, Heart, GraduationCap, Users, Megaphone, UserCog, Gamepad2, Shield, Award, Sparkles, Scroll, GitFork, ShieldCheck, ChevronRight, Settings, Volume2, VolumeX, Copy, Check, Edit2, RotateCcw, Save, KeyRound, Gift, Trophy, Flame, Star, RefreshCw, Upload, Medal, UserCheck, X, Info, ShieldAlert, AlertTriangle, History, FileText, BarChart2, ArrowUpRight, ArrowDownRight, Percent, LogOut, Mail, Camera } from 'lucide-react';
import { RoleTab, CartoonCharacter } from './components/RoleTab';
import { CalendarModal } from './components/CalendarModal';
import { AvatarSelectModal, PRESET_AVATARS } from './components/AvatarSelectModal';
import { FunctTab as FuncTab } from './components/FunctTab';
import { SimTab } from './components/SimTab';
import { LogTab } from './components/LogTab';
import { FamilyTab } from './components/FamilyTab';
import { MarriageModal } from './components/MarriageModal';
import { FamilyState, INITIAL_FAMILY_STATE, tryHaveChild } from './lib/family';
import { HospitalModal } from './components/HospitalModal';
import { JobModal, JOB_POSITIONS, readCurrentJobId } from './components/JobModal';
import { BirthModal } from './components/BirthModal';
import { WealthChartModal } from './components/WealthChartModal';
import { GenderRightsModal } from './components/GenderRightsModal';
import { HousingModal } from './components/HousingModal';
import { VisaModal } from './components/VisaModal';
import { ImmigrationModal } from './components/ImmigrationModal';
import { StockModal } from './components/StockModal';
import { AuthModal } from './components/AuthModal';
import { AuthScreen } from './components/AuthScreen';
import { EmailVerificationScreen } from './components/EmailVerificationScreen';
import { DevToolsPanel } from './components/DevToolsPanel';
import { drawGacha, INITIAL_PITY, PITY_RARE, PITY_LIMITED, RARITY_LABEL, PityState, Rarity } from './lib/gacha';
import { getMe, logout as logoutRequest, cacheUser, readCachedUser, isPasswordUser } from './lib/authClient';
import { useCloudSave, clearLocalGameData } from './lib/cloudSave';
import {
  getBilibiliUserProfile,
  getBilibiliRankList,
  getBilibiliMyRank,
  submitBilibiliScore,
  isRealToySdkAvailable,
  AppUser,
} from './lib/bilibiliToy';
import { validatePlayerName, SENSITIVE_WORDS_CONFIG } from './utils/sensitiveWords';

// 本地测试开关：仅在 `npm run dev` 且 .env.local 设置 VITE_SKIP_AUTH=true 时生效，
// 跳过 Firebase 登录门禁，使用本地测试账号。生产构建 (npm run build) 中永远为 false。
const DEV_SKIP_AUTH = import.meta.env.DEV && import.meta.env.VITE_SKIP_AUTH === 'true';
const DEV_MOCK_USER: AppUser = {
  uid: 'dev-local-user',
  displayName: '本地测试玩家',
  photoURL: null,
  email: null,
  emailVerified: true,
  providerData: [{ providerId: 'dev' }],
  isMock: true,
};

// localStorage 读取工具（读取失败或无存档时返回默认值）
const loadStored = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved !== null ? (JSON.parse(saved) as T) : fallback;
  } catch (e) {
    return fallback;
  }
};
const saveStored = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
};

// 重置人生时保留的存档键（账号级数据，不属于某一段人生）
const KEYS_KEPT_ON_RESET = new Set(['amigo_active_user', 'amigo_local_uid', 'amigo_redeemed_codes']);



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

const TopBar = ({ 
  coins, 
  playerName, 
  onOpenProfile, 
  onOpenBank,
  onOpenWealthChart,
  avatarContent,
}: { 
  coins: number, 
  playerName: string, 
  onOpenProfile: () => void, 
  onOpenBank?: () => void,
  onOpenWealthChart?: () => void,
  onOpenAuth?: () => void,
  authUser?: AppUser | null,
  avatarContent?: React.ReactNode,
}) => (
  <div className="flex justify-between items-center bg-[#252632] px-3 py-2.5 border-b-2 border-black z-20 shadow-md">
    <div className="flex items-center gap-1.5 min-w-0">
      <div 
        onClick={onOpenProfile}
        className="flex items-center gap-2 bg-[#1b1c25] rounded-lg pl-1 pr-2 py-1.5 border-2 border-black relative cursor-pointer hover:border-yellow-400 transition-all active:scale-95 shadow-[0_2px_0_#000] shrink-0"
      >
        <div className="w-8 h-8 bg-[#181924] border-2 border-black rounded-lg flex items-center justify-center absolute -left-1.5 -top-1.5 shadow-[0_2px_0_#000] overflow-hidden">
          {avatarContent || <User size={18} className="text-white" strokeWidth={2.5} />}
        </div>
        <span className="text-[11px] text-white ml-6 font-black truncate max-w-[80px]">{playerName}</span>
        <span className="text-[9px] bg-yellow-400 text-black font-extrabold px-1 rounded border border-black ml-1 flex-shrink-0">
          我的
        </span>
      </div>
    </div>

    <div className="flex gap-1.5 items-center shrink-0">
      <div 
        onClick={onOpenWealthChart || onOpenBank}
        title="点击查看个人资产全景"
        className={`flex items-center bg-[#1b1c25] rounded-full pl-1 pr-2.5 py-1 border-2 border-black ${(onOpenWealthChart || onOpenBank) ? 'cursor-pointer hover:border-yellow-400 active:scale-95 transition-all' : ''}`}
      >
        <div className="w-5 h-5 bg-yellow-400 rounded-full border border-yellow-700 flex justify-center items-center mr-1">
          <CircleDollarSign size={13} className="text-yellow-700" strokeWidth={3} />
        </div>
        <span className="font-black text-white text-xs font-mono">{coins.toLocaleString()}</span>
      </div>
    </div>
  </div>
);

const StatCard = ({ title, value, unit, color, icon, onClick }: { title: string, value: string, unit: string, color: string, icon: React.ReactNode, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={`${color} border-2 border-black rounded-xl p-3 flex items-center gap-2.5 shadow-[0_4px_0_#000] relative overflow-hidden ${onClick ? 'cursor-pointer active:scale-95 hover:brightness-110 transition-all' : ''}`}
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
                     {item.rarity && (
                       <div className={`absolute bottom-0 inset-x-0 text-center font-black ${result.length > 1 ? 'text-[7px]' : 'text-[10px]'} ${RARITY_STYLE[item.rarity as Rarity].badge}`}>
                         {RARITY_LABEL[item.rarity as Rarity]}{item.isPity ? '·保底' : ''}
                       </div>
                     )}
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
                         {item.amount.toLocaleString()}
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

// 品质显示样式（与宝箱文案配色一致：高级蓝、稀有紫、限定橙）
const RARITY_STYLE: Record<Rarity, { text: string; badge: string }> = {
  advanced: { text: 'text-blue-300', badge: 'bg-blue-600 text-white' },
  rare: { text: 'text-purple-300', badge: 'bg-purple-600 text-white' },
  limited: { text: 'text-orange-300', badge: 'bg-orange-500 text-black' },
};

// 商城服饰（不含初始服装 default）；品质暂按售价划分
const SHOP_ITEMS: Array<{ id: string; name: string; effect: string; currency: string; price: number; rarity: Rarity; icon: React.ReactNode; bg: string; iconBg: string }> = [
  { id: 'knight', name: '骑士盔甲', effect: '防御力+10', currency: 'coin', price: 2000, rarity: 'advanced', icon: <Shirt size={26} className="text-gray-700 absolute fill-gray-400" strokeWidth={2}/>, bg: 'bg-[#b4f0c0]', iconBg: 'bg-[#cbd5e1]' },
  { id: 'mage', name: '法师长袍', effect: '魔力+15', currency: 'coin', price: 50000, rarity: 'limited', icon: <Shirt size={26} className="text-purple-900 absolute fill-purple-700" strokeWidth={2}/>, bg: 'bg-[#c8e8ff]', iconBg: 'bg-[#93c5fd]' },
  { id: 'casual', name: '休闲卫衣', effect: '魅力+5', currency: 'coin', price: 8000, rarity: 'rare', icon: <Shirt size={26} className="text-orange-700 absolute fill-orange-400" strokeWidth={2}/>, bg: 'bg-[#b4f0c0]', iconBg: 'bg-[#fde047]' }
];

// 可拥有的服装总数 = 初始服装 + 商城服饰
const TOTAL_CLOTHING_COUNT = SHOP_ITEMS.length + 1;

const ShopModal = ({ 
  onClose,
  coins,
  setCoins,
  ownedClothes,
  setOwnedClothes,
  equippedClothing,
  setEquippedClothing,
  freeDrawUsed,
  setFreeDrawUsed
}: any) => {


  const [isDrawing, setIsDrawing] = React.useState(false);
  const [drawResult, setDrawResult] = React.useState<any | null>(null);
  const [shopToast, setShopToast] = React.useState<string | null>(null);
  const [pity, setPity] = React.useState<PityState>(() => loadStored('amigo_gacha_pity', INITIAL_PITY));
  React.useEffect(() => saveStored('amigo_gacha_pity', pity), [pity]);

  const showShopToast = (msg: string) => {
    setShopToast(msg);
    setTimeout(() => setShopToast((prev) => (prev === msg ? null : prev)), 2500);
  };

  const handleDraw = (times: number) => {
    let cost = 0;
    if (times === 1) {
      if (!freeDrawUsed) {
        cost = 0;
      } else {
        cost = 8000;
      }
    } else {
      cost = 72000;
    }

    if (coins < cost) {
      showShopToast(`金币不足！需要 ${cost.toLocaleString()} ₽`);
      return;
    }

    if (cost > 0) setCoins((prev: number) => prev - cost);
    if (times === 1 && !freeDrawUsed) setFreeDrawUsed(true);

    setIsDrawing(true);
    setDrawResult(null);

    // 在点击时按当前保底计数抽取结果；开箱动画结束后再发放奖励
    const { rewards, pity: nextPity } = drawGacha(times, SHOP_ITEMS, ownedClothes, pity);
    setPity(nextPity);

    setTimeout(() => {
      const newClothes = rewards.flatMap((r) => (r.type === 'clothing' ? [r.id] : []));
      if (newClothes.length > 0) {
        setOwnedClothes((prev: string[]) => [...prev, ...newClothes]);
      }

      const totalCoins = rewards.reduce((sum, r) => sum + (r.type === 'coin' ? r.amount : 0), 0);
      if (totalCoins > 0) {
        setCoins((prev: number) => prev + totalCoins);
      }

      setDrawResult(rewards);
    }, 1500);
  };

  return (
    <div className="absolute inset-0 bg-[#252632] flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-200">
      {shopToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-yellow-300 border-2 border-yellow-500 text-xs font-black px-4 py-2 rounded-xl shadow-[0_4px_0_#000] animate-in fade-in slide-in-from-top-2 duration-200 text-center max-w-[85%]">
          {shopToast}
        </div>
      )}
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
          <div className="absolute inset-0 pt-1 flex justify-center items-center pointer-events-none">
             <span className="text-white text-3xl font-black tracking-widest" style={{ textShadow: '-2px -2px 0 #072a66, 2px -2px 0 #072a66, -2px 2px 0 #072a66, 2px 2px 0 #072a66, 0 4px 6px rgba(0,0,0,0.6)' }}>
               商城
             </span>
          </div>
          {/* 右上角金钱余额 */}
          <div
            className="ml-auto relative flex items-center bg-[#1b1c25] rounded-full pl-1 pr-2.5 py-1 border-2 border-black shadow-[0_2px_0_#072a66]"
            title="当前现金余额"
          >
            <div className="w-5 h-5 bg-yellow-400 rounded-full border border-yellow-700 flex justify-center items-center mr-1">
              <CircleDollarSign size={13} className="text-yellow-700" strokeWidth={3} />
            </div>
            <span className="font-black text-white text-xs font-mono">{coins.toLocaleString()}</span>
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
                   每抽获得 1,000 金币，或<br/><span className="text-blue-300">高级</span>、<span className="text-purple-300">稀有</span>、<span className="text-orange-300">限定</span>服饰
                 </p>
                 <div className="flex flex-col items-end mt-2 gap-1.5">
                   <div className="bg-[#c85ce6] border-2 border-[#9438ad] text-white text-[10px] px-3 py-0.5 rounded-full font-bold shadow-sm">
                     9次内必得<span className="text-blue-300 ml-1">稀有</span>服饰
                     <span className="ml-1 text-yellow-200">· 还剩 {PITY_RARE - pity.sinceRare} 次</span>
                   </div>
                   <div className="bg-[#c85ce6] border-2 border-[#9438ad] text-white text-[10px] px-3 py-0.5 rounded-full font-bold shadow-sm">
                     99次内必得<span className="text-orange-300 ml-1">限定</span>服饰
                     <span className="ml-1 text-yellow-200">· 还剩 {PITY_LIMITED - pity.sinceLimited} 次</span>
                   </div>
                 </div>
               </div>
            </div>
            
            <div className="flex gap-3 mt-4 relative z-10">
              <button onClick={() => handleDraw(1)} className="flex-1 bg-gradient-to-b from-[#ffe56c] to-[#f5b822] border-2 border-black rounded-xl py-1.5 flex flex-col items-center shadow-[0_4px_0_#000] active:translate-y-1 active:shadow-none transition-all">
                 <span className="text-black font-black text-sm">抽1次</span>
                 <span className="text-[#a46914] font-bold text-[10px] flex items-center gap-1">
                    {!freeDrawUsed ? '首次免费' : <><CircleDollarSign size={10} className="text-[#a46914]"/> x8000</>}
                 </span>
              </button>
              <button onClick={() => handleDraw(10)} className="flex-1 bg-gradient-to-b from-[#ffe56c] to-[#f5b822] border-2 border-black rounded-xl py-1.5 flex flex-col items-center shadow-[0_4px_0_#000] active:translate-y-1 active:shadow-none transition-all">
                 <span className="text-black font-black text-sm">抽10次</span>
                 <span className="text-[#a46914] font-bold text-[10px] flex items-center gap-1">
                    <CircleDollarSign size={10} className="text-[#a46914]"/> x72000
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
                    setCoins((prev: number) => prev - item.price);
                    setOwnedClothes((prev: string[]) => [...prev, item.id]);
                    setEquippedClothing(item.id);
                  } else {
                    showShopToast(`余额不足！需要 ${item.price.toLocaleString()} ₽`);
                  }
                }
              };
              
              return (
                <div key={item.id} className={`${item.bg} border-2 border-black rounded-xl p-2 flex flex-col items-center shadow-[0_4px_0_#000] h-36`}>
                  <span className="text-[#1f5c2b] text-[10px] font-black whitespace-nowrap mb-0.5 flex items-center gap-1">
                    <span className={`${RARITY_STYLE[item.rarity].badge} text-[8px] px-1 rounded border border-black leading-tight`}>{RARITY_LABEL[item.rarity]}</span>
                    {item.name}
                  </span>
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
                         <CircleDollarSign size={12} className="text-yellow-700 mr-0.5 stroke-[3]"/>
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

const TABS = [
  { id: 'role', label: '角色', icon: User, badge: false },
  { id: 'bag', label: '功能', icon: Briefcase, badge: false },
  { id: 'combat', label: '推演', icon: Swords, badge: false },
  { id: 'log', label: '日志', icon: BookOpen, badge: true },
  { id: 'map', label: '家族', icon: MapIcon, badge: false },
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
            className={`flex flex-col justify-center items-center relative border-r-[3px] border-black last:border-r-0 cursor-pointer select-none transition-all duration-200 ease-out overflow-visible ${
              isActive 
                ? 'flex-[2.2] bg-[#fcd34d]' 
                : 'flex-1 bg-[#474854] hover:bg-[#535669]'
            }`}
          >
            {isActive && (
              <div className="absolute inset-0 opacity-40 pointer-events-none overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 2.5px, transparent 2.5px)', backgroundSize: '16px 16px', backgroundPosition: 'center' }}></div>
            )}
            
            <div className="relative flex flex-col items-center justify-center w-full h-full">
              {/* Icon Container - Lower z-index (z-10) and enlarged icon size */}
              <div className={`relative z-10 transition-all duration-200 ${isActive ? '-translate-y-2 scale-110' : 'translate-y-0 scale-100'}`}>
                <div className="relative">
                  <tab.icon 
                    size={isActive ? 38 : 32} 
                    className="drop-shadow-[0_2px_0_rgba(0,0,0,0.8)]" 
                    fill={isActive ? (tab.id === 'map' ? '#8bc6f4' : tab.id === 'role' ? '#ff6a6a' : tab.id === 'log' ? '#c084fc' : tab.id === 'combat' ? '#a3a3a3' : '#d97706') : '#94a3b8'}
                    stroke="black"
                    strokeWidth={2}
                  />
                  {tab.badge && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#ef4444] rounded-full border-[2px] border-black z-20"></div>
                  )}
                </div>
              </div>

              {/* Text Container - Only visible when active, higher z-index (z-20) overlapping bottom of icon */}
              {isActive && (
                <div className="absolute bottom-0.5 z-20 pointer-events-none transition-all duration-200">
                   <span 
                     className="text-white font-black text-[13px] sm:text-[14px] tracking-wider block whitespace-nowrap" 
                     style={{ textShadow: '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 0 3px 0 #000, 0 0 4px #000' }}
                   >
                     {tab.label}
                   </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const getFallbackRankList = (boardNum: number, currentName: string, myCoins: number) => {
  if (boardNum === 1) {
    const baseList = [
      { rank: 1, score: 9850000, nickname: '亚历山大·瓦伦丁', avatar: '' },
      { rank: 2, score: 5200000, nickname: '维克多·工匠大师', avatar: '' },
      { rank: 3, score: 3100000, nickname: '哔哩哔哩高级硬币官', avatar: '' },
      { rank: 4, score: myCoins, nickname: currentName + ' (你)', avatar: '' },
      { rank: 5, score: 890000, nickname: '罗兰船长', avatar: '' },
      { rank: 6, score: 650000, nickname: '卡罗尼亚女伯爵', avatar: '' },
      { rank: 7, score: 420000, nickname: '蒸汽机械师埃里克', avatar: '' },
    ];
    baseList.sort((a, b) => b.score - a.score);
    const sortedList = baseList.map((item, idx) => ({ ...item, rank: idx + 1 }));
    const myItem = sortedList.find((i) => i.nickname.includes('(你)'));
    return {
      list: sortedList,
      myRank: { ranked: true, rank: myItem ? myItem.rank : 4, score: myCoins },
    };
  } else {
    const baseList = [
      { rank: 1, score: 25800, nickname: '皇家竞技场常胜皇', avatar: '' },
      { rank: 2, score: 21000, nickname: '齿轮战术家', avatar: '' },
      { rank: 3, score: 18500, nickname: currentName + ' (你)', avatar: '' },
      { rank: 4, score: 15200, nickname: '卡罗尼亚突击兵', avatar: '' },
      { rank: 5, score: 9800, nickname: '萌新机械师', avatar: '' },
    ];
    baseList.sort((a, b) => b.score - a.score);
    const sortedList = baseList.map((item, idx) => ({ ...item, rank: idx + 1 }));
    const myItem = sortedList.find((i) => i.nickname.includes('(你)'));
    return {
      list: sortedList,
      myRank: { ranked: true, rank: myItem ? myItem.rank : 3, score: 18500 },
    };
  }
};

// 30天毫秒数 (用于计算1个月内改名限制)
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
// 90天毫秒数 (用于政治与合规敏感词多次违规冻结3个月)
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

// 格式化解封日期显示函数
const formatUnlockTime = (timestamp: number): string => {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const hours = d.getHours() < 10 ? '0' + d.getHours() : d.getHours();
  const minutes = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
  const seconds = d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds();
  return `${year}年${month}月${date}日 ${hours}:${minutes}:${seconds}`;
};

// 获取过去30天内的改名时间戳
const getRecentNameChanges = (timestamps: number[]): number[] => {
  const now = Date.now();
  return timestamps.filter((t) => now - t < THIRTY_DAYS_MS);
};

interface ProfileModalProps {
  onClose: () => void;
  playerName: string;
  setPlayerName: (name: string) => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  equippedClothing: string;
  onOpenAuth?: () => void;
  onLogout?: () => Promise<boolean>;
  onResetLife?: () => void;
  /** 云端存档：返回 true 表示已保存；undefined 表示当前账号不支持云存档 */
  onSaveProgress?: () => Promise<boolean>;
  authUser?: AppUser | null;
  avatarSource: string;
  setAvatarSource: (source: string) => void;
  bilibiliAvatar: string | null;
  setBilibiliAvatar: (avatar: string | null) => void;
  isAvatarModalOpen: boolean;
  setIsAvatarModalOpen: (open: boolean) => void;
  renderAvatarContent: () => React.ReactNode;
  ownedClothes: string[];
  isRegistered: boolean;
  age: number;
}

const ProfileModal = ({
  onClose,
  playerName,
  setPlayerName,
  coins,
  setCoins,
  equippedClothing,
  onOpenAuth,
  onLogout,
  onResetLife,
  onSaveProgress,
  authUser,
  avatarSource,
  setAvatarSource,
  bilibiliAvatar,
  setBilibiliAvatar,
  isAvatarModalOpen,
  setIsAvatarModalOpen,
  renderAvatarContent,
  ownedClothes,
  isRegistered,
  age,
}: ProfileModalProps) => {
  // 名片资料：读取真实游戏状态（岗位、房产、服装）
  const currentJob = (() => {
    const id = readCurrentJobId();
    return id ? JOB_POSITIONS.find((j) => j.id === id) || null : null;
  })();
  const propertySummary = (() => {
    try {
      const props = JSON.parse(localStorage.getItem('amigo_owned_properties') || '[]');
      if (Array.isArray(props) && props.length > 0) {
        const primary = props.find((p: any) => p.isPrimaryResidence) || props[0];
        return props.length > 1 ? `${primary.title} 等 ${props.length} 套` : primary.title;
      }
      const rental = JSON.parse(localStorage.getItem('amigo_current_rental') || 'null');
      if (rental?.title) return `租住：${rental.title}`;
    } catch (e) {}
    return null;
  })();
  const ownedClothingCount = new Set(ownedClothes).size;

  const [subTab, setSubTab] = useState<'info' | 'rank' | 'achievement' | 'settings' | 'cdkey'>('info');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(playerName);
  const [copiedUid, setCopiedUid] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Name Change Timestamps (localStorage persisted)
  const [nameChangeTimestamps, setNameChangeTimestamps] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('amigo_name_change_timestamps');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // 政治与合规敏感词违规尝试计数 (达到3次锁定3个月)
  const [politicalViolationCount, setPoliticalViolationCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('amigo_political_violation_count');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  });

  // 改名冻结截止时间戳
  const [nameFreezeUntil, setNameFreezeUntil] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('amigo_name_freeze_until');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  });

  // 敏感词违规与改名冻结警告弹窗控制状态
  const [freezeModalInfo, setFreezeModalInfo] = useState<{
    show: boolean;
    isFrozen: boolean;
    violationCount: number;
    matchedWord?: string;
  } | null>(null);

  // 政治与合规敏感词违规改名历史记录 (localStorage 持久化)
  const [politicalViolationLogs, setPoliticalViolationLogs] = useState<Array<{
    id: string;
    attemptedName: string;
    matchedWord: string;
    category: string;
    timestamp: number;
  }>>(() => {
    try {
      const saved = localStorage.getItem('amigo_political_violation_logs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // 弹窗内部当前视图: 'info' (合规说明) | 'history' (违规记录)
  const [modalTab, setModalTab] = useState<'info' | 'history'>('info');

  const addViolationLog = (attemptedName: string, matchedWord: string, category: string) => {
    const newLog = {
      id: Date.now().toString() + '_' + Math.floor(Math.random() * 1000),
      attemptedName,
      matchedWord,
      category,
      timestamp: Date.now(),
    };
    setPoliticalViolationLogs(prev => {
      const updated = [newLog, ...prev];
      try {
        localStorage.setItem('amigo_political_violation_logs', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const recentNameChanges = getRecentNameChanges(nameChangeTimestamps);
  const remainingQuota = Math.max(0, 2 - recentNameChanges.length);

  // Rank List States
  const [board, setBoard] = useState<number>(1); // 1: 财富榜, 2: 珍藏榜, 3: 推演榜
  const [period, setPeriod] = useState<'all' | 'month' | 'week' | 'day'>('week');
  const [rankList, setRankList] = useState<Array<{ rank: number; score: number; nickname: string; avatar: string }>>([]);
  const [myRank, setMyRank] = useState<{ ranked: boolean; rank: number; score: number }>({ ranked: false, rank: 0, score: 0 });
  const [isSdkLoading, setIsSdkLoading] = useState(false);

  // Settings States
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [highFps, setHighFps] = useState(true);
  
  // CDKey state
  const [cdkeyInput, setCdkeyInput] = useState('');
  const [redeemedCodes, setRedeemedCodes] = useState<string[]>(() => loadStored<string[]>('amigo_redeemed_codes', []));
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Sync Bilibili profile
  const handleSyncBilibiliProfile = async () => {
    if (nameFreezeUntil > Date.now()) {
      setFreezeModalInfo({
        show: true,
        isFrozen: true,
        violationCount: politicalViolationCount,
      });
      showToast('⚠️ 角色改名功能处于冻结状态，无法同步B站昵称');
      return;
    }

    let targetName = '';
    let avatarUrl = '';
    let isMockEnv = false;

    try {
      const { profile, isMock } = await getBilibiliUserProfile();
      if (profile && (profile.nickname || profile.avatar)) {
        targetName = profile.nickname || 'B站玩家';
        avatarUrl = profile.avatar || '';
        isMockEnv = isMock;
      }
    } catch (err: any) {
      console.warn('getBilibiliUserProfile error:', err);
      showToast('获取B站资料未授权或使用默认昵称');
      return;
    }

    if (!targetName) {
      targetName = '哔哩哔哩探险家_' + Math.floor(100 + Math.random() * 900);
      avatarUrl = 'https://i0.hdslb.com/bfs/face/member/noface.jpg';
    }

    if (targetName) {
      const validation = validatePlayerName(targetName);
      if (!validation.valid) {
        if (validation.category === '政治与合规敏感') {
          const newCount = politicalViolationCount + 1;
          setPoliticalViolationCount(newCount);
          try {
            localStorage.setItem('amigo_political_violation_count', newCount.toString());
          } catch (e) {}

          addViolationLog(targetName, validation.word || '违规词汇', validation.category || '政治与合规敏感');
          setModalTab('info');

          if (newCount >= 3) {
            const freezeUntilTime = Date.now() + NINETY_DAYS_MS;
            setNameFreezeUntil(freezeUntilTime);
            try {
              localStorage.setItem('amigo_name_freeze_until', freezeUntilTime.toString());
            } catch (e) {}

            setFreezeModalInfo({
              show: true,
              isFrozen: true,
              violationCount: newCount,
              matchedWord: validation.word,
            });
          } else {
            setFreezeModalInfo({
              show: true,
              isFrozen: false,
              violationCount: newCount,
              matchedWord: validation.word,
            });
          }
        }
        showToast(`⚠️ B站昵称无法同步：${validation.reason}`);
        if (avatarUrl) setBilibiliAvatar(avatarUrl);
        return;
      }

      setPlayerName(targetName);
      if (avatarUrl) {
        setBilibiliAvatar(avatarUrl);
        setAvatarSource('social');
      }
      showToast(`🎉 已成功同步B站资料: ${targetName} ${isMockEnv ? '(本地 Mock 模式)' : ''}`);
    }
  };

  // Refresh Rank Data from Toy SDK or Fallback
  const refreshRankData = async (targetBoard = board, targetPeriod = period) => {
    setIsSdkLoading(true);
    try {
      const list = await getBilibiliRankList(targetBoard, targetPeriod, 20);
      setRankList(list);
      const mine = await getBilibiliMyRank(targetBoard, targetPeriod, coins);
      if (mine) setMyRank(mine);
    } catch (err) {
      const fallback = getFallbackRankList(targetBoard, playerName, coins);
      setRankList(fallback.list);
      setMyRank(fallback.myRank);
    } finally {
      setIsSdkLoading(false);
    }
  };

  // Submit Score to Toy SDK
  const handleSubmitScore = async () => {
    let scoreToSubmit = coins;
    if (board === 3) scoreToSubmit = 18500;

    try {
      const res = await submitBilibiliScore(board, scoreToSubmit);
      showToast(`⚡ 成绩已成功上报并同步! 最高分: ${(res.score || scoreToSubmit).toLocaleString()} ${res.isMock ? '(Mock 模式)' : ''}`);
      refreshRankData(board, period);
    } catch (err) {
      showToast(`⚡ 分数提交成功！获得最新战报分: ${scoreToSubmit.toLocaleString()}`);
      refreshRankData(board, period);
    }
  };

  React.useEffect(() => {
    if (subTab === 'rank') {
      refreshRankData(board, period);
    }
  }, [subTab, board, period]);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed === playerName) {
      setIsEditingName(false);
      return;
    }

    const now = Date.now();

    // 0. 检查改名功能是否处于 3个月 冻结管制状态
    if (nameFreezeUntil > now) {
      setFreezeModalInfo({
        show: true,
        isFrozen: true,
        violationCount: politicalViolationCount,
      });
      showToast(`🚨 改名功能已封禁冻结！解封时间：${formatUnlockTime(nameFreezeUntil)}`);
      return;
    }

    // 1. 敏感词规则校验
    const validation = validatePlayerName(nameInput);
    if (!validation.valid) {
      if (validation.category === '政治与合规敏感') {
        const newCount = politicalViolationCount + 1;
        setPoliticalViolationCount(newCount);
        try {
          localStorage.setItem('amigo_political_violation_count', newCount.toString());
        } catch (e) {}

        addViolationLog(nameInput, validation.word || '违规词汇', validation.category || '政治与合规敏感');
        setModalTab('info');

        if (newCount >= 3) {
          // 连续3次违规尝试：冻结改名 3个月
          const freezeTime = now + NINETY_DAYS_MS;
          setNameFreezeUntil(freezeTime);
          try {
            localStorage.setItem('amigo_name_freeze_until', freezeTime.toString());
          } catch (e) {}

          setFreezeModalInfo({
            show: true,
            isFrozen: true,
            violationCount: newCount,
            matchedWord: validation.word,
          });
          showToast(`🚨 违规尝试已达 3 次！角色改名功能已被系统冻结 3 个月！`);
        } else {
          // 1次或2次尝试：显示弹窗预警
          setFreezeModalInfo({
            show: true,
            isFrozen: false,
            violationCount: newCount,
            matchedWord: validation.word,
          });
          showToast(`⚠️ 警告：检测到政治与合规敏感词！(已违规 ${newCount}/3 次)`);
        }
      } else {
        showToast(`❌ 改名失败：${validation.reason}`);
      }
      return;
    }

    // 2. 一个月改名频次校验 (≤ 2次)
    const recentChanges = getRecentNameChanges(nameChangeTimestamps);
    if (recentChanges.length >= 2) {
      const earliestChange = Math.min(...recentChanges);
      const unlockTime = new Date(earliestChange + THIRTY_DAYS_MS);
      const monthStr = unlockTime.getMonth() + 1;
      const dayStr = unlockTime.getDate();
      const hourStr = unlockTime.getHours();
      const minStr = unlockTime.getMinutes() < 10 ? '0' + unlockTime.getMinutes() : unlockTime.getMinutes();
      const dateStr = `${monthStr}月${dayStr}日 ${hourStr}:${minStr}`;
      
      showToast(`❌ 改名失败：1个月内修改不能超过2次！解封时间：${dateStr}`);
      return;
    }

    // 3. 记入修改历史并保存
    const updatedTimestamps = [...recentChanges, now];
    setNameChangeTimestamps(updatedTimestamps);
    try {
      localStorage.setItem('amigo_name_change_timestamps', JSON.stringify(updatedTimestamps));
    } catch (e) {}

    setPlayerName(trimmed);
    setIsEditingName(false);
    const remaining = 2 - updatedTimestamps.length;
    showToast(`🎉 昵称成功修改为 [${trimmed}]！(本月剩余改名次数: ${remaining}/2)`);
  };

  // Real UID calculation logic: Firebase UID or persistent local/bilibili UID
  const fullUid = authUser?.uid
    ? authUser.uid
    : (function() {
        try {
          let local = localStorage.getItem('amigo_local_uid');
          if (!local) {
            local = String(Math.floor(10000000 + Math.random() * 90000000));
            localStorage.setItem('amigo_local_uid', local);
          }
          return local;
        } catch (e) {
          return '88492015';
        }
      })();

  const displayUid = authUser?.uid
    ? (authUser.uid.length > 8 ? authUser.uid.substring(0, 8).toUpperCase() : authUser.uid)
    : fullUid;

  const handleCopyUid = () => {
    navigator.clipboard?.writeText(fullUid);
    setCopiedUid(true);
    showToast(`已复制真实完整 UID: ${fullUid}`);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleRedeemCdkey = () => {
    const code = cdkeyInput.trim().toUpperCase();
    if (!code) {
      showToast('请输入有效的礼包兑换码！');
      return;
    }
    if (redeemedCodes.includes(code)) {
      showToast('该兑换码已被使用过！');
      return;
    }

    if (code === 'VALENTINE' || code === '2026' || code === '666666' || code === 'GIFT2026') {
      setCoins(prev => prev + 50000);
      const updatedCodes = [...redeemedCodes, code];
      setRedeemedCodes(updatedCodes);
      saveStored('amigo_redeemed_codes', updatedCodes);
      setCdkeyInput('');
      showToast('🎉 兑换成功！获得 50,000金币！');
    } else {
      showToast('❌ 无效的兑换码，请输入 GIFT2026 或 666666 试用');
    }
  };

  return (
    <div className="absolute inset-0 bg-[#252632] flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-200 overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-yellow-300 border-2 border-yellow-500 text-xs font-black px-4 py-2 rounded-xl shadow-[0_4px_0_#000] animate-in fade-in slide-in-from-top-2 duration-200 text-center max-w-[85%]">
          {toast}
        </div>
      )}

      {/* Top Banner Curtain Bar */}
      <div className="relative w-full h-16 z-20 drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] flex-shrink-0">
        <div className="absolute inset-0 flex">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? 'bg-[#0f4b99]' : 'bg-[#1553a6]'} relative`}>
               <div className={`absolute -bottom-4 left-0 w-full h-8 rounded-b-full ${i % 2 === 0 ? 'bg-[#0f4b99]' : 'bg-[#1553a6]'}`}></div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center px-4 pt-1 z-30">
          <button onClick={onClose} className="p-1.5 bg-[#0f4b99] border-2 border-[#072a66] rounded-xl active:scale-95 shadow-[0_2px_0_#072a66] cursor-pointer">
            <ChevronLeft size={24} className="text-white drop-shadow-md" strokeWidth={3} />
          </button>
          <div className="flex-1 flex justify-center items-center -ml-10 pointer-events-none">
             <span className="text-white text-3xl font-black tracking-widest" style={{ textShadow: '-2px -2px 0 #072a66, 2px -2px 0 #072a66, -2px 2px 0 #072a66, 2px 2px 0 #072a66, 0 4px 6px rgba(0,0,0,0.6)' }}>
               个人中心
             </span>
          </div>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-28 pt-6 px-4 space-y-4">
        {/* User Identity Header Card */}
        <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] relative">
          <div className="flex items-center gap-4">
            {/* Interactive Avatar Frame */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                onClick={() => setIsAvatarModalOpen(true)}
                className="relative w-20 h-20 rounded-2xl bg-[#181924] border-2 border-black p-1 shadow-[0_4px_0_#000] flex items-center justify-center overflow-hidden cursor-pointer hover:scale-105 active:scale-95 transition-all group shrink-0"
                title="点击打开头像选择设置界面"
              >
                <div className="w-full h-full bg-[#1b1c25] rounded-xl flex items-center justify-center overflow-hidden relative">
                  {renderAvatarContent()}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-black/80 text-yellow-400 text-[8px] font-black py-0.5 text-center border-t border-black backdrop-blur-xs flex items-center justify-center gap-0.5 group-hover:bg-amber-400 group-hover:text-black transition-colors">
                  <Camera size={9} />
                  <span>更换</span>
                </div>
              </div>
            </div>

            {/* User Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex items-center gap-1.5 w-full">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        maxLength={10}
                        placeholder="2-10字非敏感名称"
                        className="bg-[#1b1c25] text-white font-black text-xs px-2 py-1 rounded border-2 border-yellow-400 focus:outline-none flex-1 min-w-0"
                      />
                      <button
                        onClick={handleSaveName}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black p-1.5 rounded border border-black shadow-[0_1px_0_#000] cursor-pointer flex-shrink-0"
                        title="保存昵称"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingName(false);
                          setNameInput(playerName);
                        }}
                        className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-black p-1.5 rounded border border-black cursor-pointer flex-shrink-0"
                        title="取消"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-yellow-300 font-bold bg-[#1b1c25] px-2 py-0.5 rounded border border-yellow-500/40">
                      <div className="flex items-center gap-1">
                        <Info size={10} className="text-yellow-400" />
                        <span>本月改名额度: <span className="font-mono text-white">{remainingQuota}/2</span></span>
                      </div>
                      {politicalViolationCount > 0 ? (
                        <span className="text-red-400 font-mono font-bold">敏感词警示: {politicalViolationCount}/3次</span>
                      ) : (
                        <span className="text-gray-400">禁敏感词/官方伪冒</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-white font-black text-base truncate">{playerName}</h2>
                    {nameFreezeUntil > Date.now() ? (
                      <button
                        onClick={() => {
                          setFreezeModalInfo({
                            show: true,
                            isFrozen: true,
                            violationCount: politicalViolationCount,
                          });
                        }}
                        className="text-red-400 hover:text-red-300 p-1 cursor-pointer flex items-center gap-1 text-[10px] font-bold bg-red-950/80 px-1.5 py-0.5 rounded border border-red-500/60"
                        title="改名功能已冻结，点击查看解封时间"
                      >
                        <Lock size={11} className="text-red-400" />
                        <span>已冻结 (查看)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (nameFreezeUntil > Date.now()) {
                            setFreezeModalInfo({
                              show: true,
                              isFrozen: true,
                              violationCount: politicalViolationCount,
                            });
                            return;
                          }
                          setNameInput(playerName);
                          setIsEditingName(true);
                        }}
                        className="text-yellow-400 hover:text-yellow-300 p-1 cursor-pointer flex items-center gap-1 text-[10px] font-bold bg-[#1b1c25] px-1.5 py-0.5 rounded border border-yellow-500/40"
                      >
                        <Edit2 size={12} />
                        <span>改名</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Title & UID */}
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded border border-black shadow-[0_1px_0_#000]">
                  {isRegistered ? `帝国公民 · ${age} 岁` : '未登记公民'}
                </span>
                <span className="bg-purple-900/80 text-purple-200 text-[10px] font-black px-2 py-0.5 rounded border border-purple-500">
                  {currentJob ? currentJob.title : '待业'}
                </span>
              </div>

              {/* Clean Single Email Box */}
              {authUser?.email && (
                <div
                  onClick={() => {
                    if (onOpenAuth) {
                      onOpenAuth();
                    }
                  }}
                  className="mt-1.5 text-[10px] text-amber-300 font-mono font-bold bg-[#1b1c25] hover:bg-[#232635] px-2 py-1 rounded-lg border border-yellow-500/30 flex items-center justify-between gap-1 cursor-pointer transition-all active:scale-98 shadow-[0_1px_0_#000]"
                  title="点击打开 AmiGo 账户中心（管理账号 / 退出登录）"
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <Mail size={11} className="text-yellow-400 shrink-0" />
                    <span className="truncate">{authUser.email}</span>
                  </div>
                  <div className="text-[9px] text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/50 px-1.5 py-0.5 rounded shrink-0 font-sans font-bold flex items-center gap-0.5 transition-all">
                    <ShieldCheck size={10} className="text-emerald-400" />
                    <span>已验证 (账户中心)</span>
                  </div>
                </div>
              )}

              {/* UID Row */}
              <div className="flex items-center justify-between gap-2 mt-2 text-gray-300 text-xs font-mono font-bold">
                <div className="flex items-center gap-2">
                  <span>
                    UID: <span className="text-yellow-300 font-bold">{displayUid}</span>
                    {authUser?.uid && <span className="text-[9px] text-gray-400 font-normal ml-1">(前8位)</span>}
                  </span>
                  <button
                    onClick={handleCopyUid}
                    className="text-gray-200 hover:text-white flex items-center gap-1 bg-[#1b1c25] hover:bg-[#252838] px-2 py-0.5 rounded border border-black cursor-pointer text-[10px] active:scale-95 transition-all shadow-[0_1px_0_#000]"
                    title={`完整 UID: ${fullUid} (点击复制全称)`}
                  >
                    {copiedUid ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                    <span>{copiedUid ? '已复制' : '复制完整UID'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stat Bar */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-700/80 text-center">
            <div className="bg-[#21232e] p-2 rounded-xl border border-black">
              <div className="text-[10px] text-gray-400 font-bold">声望等级</div>
              <div className="text-gray-500 font-black text-xs mt-0.5">暂未开放</div>
            </div>
            <div className="bg-[#21232e] p-2 rounded-xl border border-black">
              <div className="text-[10px] text-gray-400 font-bold">机械推演</div>
              <div className="text-gray-500 font-black text-xs mt-0.5">暂未开放</div>
            </div>
            <div className="bg-[#21232e] p-2 rounded-xl border border-black">
              <div className="text-[10px] text-gray-400 font-bold">拥有服装</div>
              <div className="text-emerald-400 font-black text-xs mt-0.5">{ownedClothingCount} / {TOTAL_CLOTHING_COUNT} 套</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-5 bg-[#21232e] p-1 rounded-xl border-2 border-black gap-1 shadow-[0_2px_0_#000]">
          <button
            onClick={() => setSubTab('info')}
            className={`py-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer truncate ${
              subTab === 'info'
                ? 'bg-yellow-400 text-black border-black shadow-[0_1px_0_#000]'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            名片资料
          </button>
          <button
            onClick={() => setSubTab('rank')}
            className={`py-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer truncate flex items-center justify-center gap-0.5 ${
              subTab === 'rank'
                ? 'bg-yellow-400 text-black border-black shadow-[0_1px_0_#000]'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <Trophy size={11} className={subTab === 'rank' ? 'text-black' : 'text-yellow-400'} />
            <span>排行榜</span>
          </button>
          <button
            onClick={() => setSubTab('achievement')}
            className={`py-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer truncate ${
              subTab === 'achievement'
                ? 'bg-yellow-400 text-black border-black shadow-[0_1px_0_#000]'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            成就勋章
          </button>
          <button
            onClick={() => setSubTab('settings')}
            className={`py-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer truncate ${
              subTab === 'settings'
                ? 'bg-yellow-400 text-black border-black shadow-[0_1px_0_#000]'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            系统设置
          </button>
          <button
            onClick={() => setSubTab('cdkey')}
            className={`py-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer truncate ${
              subTab === 'cdkey'
                ? 'bg-yellow-400 text-black border-black shadow-[0_1px_0_#000]'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            礼包兑换
          </button>
        </div>

        {/* Tab 1: 名片资料 (Profile Info) */}
        {subTab === 'info' && (
          <div className="space-y-3">
            <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000]">
              <h3 className="text-white font-black text-sm mb-3 flex items-center gap-2 border-b border-gray-700/80 pb-2">
                <Shield size={16} className="text-yellow-400" /> 身份履历与特权
              </h3>

              <div className="space-y-2.5 text-xs font-bold">
                <div className="flex justify-between items-center bg-[#21232e] p-2.5 rounded-xl border border-black">
                  <span className="text-gray-400">出身背景</span>
                  <span className="text-white font-black">卡罗尼亚帝国 · 瓦伦丁名门</span>
                </div>
                <div className="flex justify-between items-center bg-[#21232e] p-2.5 rounded-xl border border-black">
                  <span className="text-gray-400">毕业院校</span>
                  <span className="text-gray-500 font-black">暂无学历（教育学府即将开放）</span>
                </div>
                <div className="flex justify-between items-center bg-[#21232e] p-2.5 rounded-xl border border-black">
                  <span className="text-gray-400">当前主业</span>
                  <span className={currentJob ? 'text-sky-300 font-black' : 'text-gray-500 font-black'}>
                    {currentJob ? `${currentJob.department} · ${currentJob.title}` : '待业中'}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-[#21232e] p-2.5 rounded-xl border border-black">
                  <span className="text-gray-400">持有地产</span>
                  <span className={propertySummary ? 'text-emerald-400 font-black text-right' : 'text-gray-500 font-black'}>
                    {propertySummary || '暂无房产'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000]">
              <h3 className="text-white font-black text-sm mb-3 flex items-center gap-2 border-b border-gray-700/80 pb-2">
                <Award size={16} className="text-purple-400" /> 特权光环
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#21232e] p-2.5 rounded-xl border border-black flex items-center gap-2">
                  <Sparkles size={20} className="text-yellow-400 flex-shrink-0" />
                  <div>
                    <div className="text-white font-black text-xs">贵族礼遇</div>
                    <div className="text-gray-400 text-[10px]">购买服装享 9 折</div>
                  </div>
                </div>
                <div className="bg-[#21232e] p-2.5 rounded-xl border border-black flex items-center gap-2">
                  <Flame size={20} className="text-rose-400 flex-shrink-0" />
                  <div>
                    <div className="text-white font-black text-xs">天才推演</div>
                    <div className="text-gray-400 text-[10px]">战斗爆伤 +15%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 帝国排行榜 (Rank List with Toy SDK) */}
        {subTab === 'rank' && (
          <div className="space-y-3">
            {/* SDK Action Top Bar */}
            <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3 shadow-[0_4px_0_#000] space-y-2">
              <div className="flex items-center justify-between border-b border-gray-700/80 pb-2">
                <div className="flex items-center gap-1.5">
                  <Trophy size={18} className="text-yellow-400" />
                  <span className="text-white font-black text-xs">全服帝国荣耀榜</span>
                  <span className="text-[9px] bg-pink-500/20 text-pink-300 border border-pink-500/50 px-1.5 py-0.2 rounded font-bold">
                    Toy SDK 连通
                  </span>
                </div>
                <button
                  onClick={() => refreshRankData(board, period)}
                  disabled={isSdkLoading}
                  className="text-gray-300 hover:text-white flex items-center gap-1 bg-[#21232e] px-2 py-1 rounded-lg border border-black text-[10px] font-black cursor-pointer active:scale-95"
                >
                  <RefreshCw size={12} className={isSdkLoading ? 'animate-spin text-yellow-400' : ''} />
                  <span>{isSdkLoading ? '同步中...' : '刷新榜单'}</span>
                </button>
              </div>

              {/* Action Buttons: Sync Bilibili Profile & Submit Score */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleSyncBilibiliProfile}
                  className="bg-[#fb7299] hover:bg-[#e05d83] text-white text-[11px] font-black py-2 px-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] flex items-center justify-center gap-1 cursor-pointer active:translate-y-0.5"
                >
                  <UserCheck size={14} />
                  <span>同步B站资料</span>
                </button>
                <button
                  onClick={handleSubmitScore}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black py-2 px-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] flex items-center justify-center gap-1 cursor-pointer active:translate-y-0.5"
                >
                  <Upload size={14} />
                  <span>上报我的成绩</span>
                </button>
              </div>
            </div>

            {/* Board Selector (1: 财富榜, 3: 推演榜) */}
            <div className="grid grid-cols-2 bg-[#21232e] p-1 rounded-xl border-2 border-black gap-1 shadow-[0_2px_0_#000]">
              <button
                onClick={() => setBoard(1)}
                className={`py-1.5 text-xs font-black rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  board === 1
                    ? 'bg-amber-400 text-black border-black shadow-[0_1px_0_#000]'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                <CircleDollarSign size={13} />
                <span>帝国财富榜</span>
              </button>
              <button
                onClick={() => setBoard(3)}
                className={`py-1.5 text-xs font-black rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  board === 3
                    ? 'bg-sky-400 text-black border-black shadow-[0_1px_0_#000]'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                <Swords size={13} />
                <span>推演战绩榜</span>
              </button>
            </div>

            {/* Period Selector (week / month / all / day) */}
            <div className="flex items-center justify-between bg-[#21232e] px-2 py-1 rounded-xl border border-black text-xs font-bold">
              <span className="text-gray-400 text-[10px]">统计周期:</span>
              <div className="flex gap-1">
                {(
                  [
                    { id: 'week', label: '本周' },
                    { id: 'month', label: '本月' },
                    { id: 'all', label: '总榜' },
                    { id: 'day', label: '今日' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPeriod(p.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all cursor-pointer ${
                      period === p.id
                        ? 'bg-white text-black border-black shadow-[0_1px_0_#000]'
                        : 'text-gray-400 border-transparent hover:text-gray-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* My Current Rank Card */}
            <div className="bg-gradient-to-r from-[#2a3852] to-[#1f283d] border-2 border-yellow-500/80 rounded-2xl p-3 shadow-[0_3px_0_#000] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400 border-2 border-black flex items-center justify-center font-black text-black text-sm shadow-[0_2px_0_#000] flex-shrink-0">
                  {myRank.ranked ? `第${myRank.rank}名` : '未上榜'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-black text-xs">{playerName}</span>
                    <span className="bg-yellow-400 text-black text-[9px] font-black px-1.5 rounded border border-black">
                      我
                    </span>
                  </div>
                  <div className="text-gray-300 text-[10px] font-mono mt-0.5">
                    当前积分: <span className="text-yellow-300 font-bold">{myRank.score > 0 ? myRank.score.toLocaleString() : (board === 1 ? coins : 18500).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSubmitScore}
                className="bg-yellow-400 hover:bg-yellow-300 text-black text-[10px] font-black px-3 py-1.5 rounded-lg border border-black shadow-[0_1px_0_#000] cursor-pointer active:scale-95"
              >
                刷新名次
              </button>
            </div>

            {/* Rank List Items */}
            <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-2 shadow-[0_4px_0_#000] space-y-1.5">
              {rankList.map((item) => {
                const isMe = item.nickname.includes(playerName) || item.nickname.includes('(你)');
                return (
                  <div
                    key={item.rank}
                    className={`flex items-center justify-between p-2 rounded-xl border-2 transition-all ${
                      isMe
                        ? 'bg-[#3b3524] border-yellow-400 shadow-[0_2px_0_#000]'
                        : item.rank === 1
                        ? 'bg-[#3d321d] border-amber-500'
                        : item.rank === 2
                        ? 'bg-[#2a303a] border-slate-400'
                        : item.rank === 3
                        ? 'bg-[#332822] border-amber-700'
                        : 'bg-[#21232e] border-black'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Rank Crown/Badge */}
                      <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 font-black text-xs">
                        {item.rank === 1 ? (
                          <Crown size={20} className="text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" strokeWidth={2.5} />
                        ) : item.rank === 2 ? (
                          <Crown size={18} className="text-slate-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" strokeWidth={2.5} />
                        ) : item.rank === 3 ? (
                          <Crown size={18} className="text-amber-600 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" strokeWidth={2.5} />
                        ) : (
                          <span className="text-gray-400 font-mono font-black text-xs">#{item.rank}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-lg bg-[#1b1c25] border border-black flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                        {item.avatar || (isMe && bilibiliAvatar) ? (
                          <img src={item.avatar || (isMe && bilibiliAvatar) || ''} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User size={18} className="text-gray-400" />
                        )}
                      </div>

                      {/* Nickname & Label */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className={`text-xs font-black truncate max-w-[110px] ${isMe ? 'text-yellow-300' : 'text-white'}`}>
                            {item.nickname}
                          </span>
                          {isMe && (
                            <span className="bg-yellow-400 text-black text-[8px] font-black px-1 rounded border border-black flex-shrink-0">
                              你
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-gray-400 font-mono">
                          {board === 1 ? '金币资产' : '推演胜分'}
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0 pl-2">
                      <div className="text-yellow-400 font-black text-xs font-mono">
                        {item.score.toLocaleString()}
                      </div>
                      <div className="text-[9px] text-gray-500 font-bold">
                        {item.rank <= 3 ? '👑 殿堂级' : '排名有效'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center text-gray-500 text-[10px] font-bold">
              * 排行榜数据通过 B站 Toy SDK 实时接入 · 跨终端同步
            </div>
          </div>
        )}

        {/* Tab 2: 成就勋章 (Achievements) */}
        {subTab === 'achievement' && (
          <div className="space-y-3">
            {[
              { title: '科技先驱', desc: '在青少年时期发明定时闹钟获得二等奖', icon: Crown, unlocked: true, date: '1882.04' },
              { title: '学府霸主', desc: '考入帝国理工学院并获得全额奖学金', icon: GraduationCap, unlocked: true, date: '1888.06' },
              { title: '首次开箱', desc: '在欧皇宝箱中首次抽取稀有或限定道具', icon: Gift, unlocked: true, date: '1892.07' },
              { title: '富甲一方', desc: '拥有超过 1,000,000 帝国金币', icon: CircleDollarSign, unlocked: true, date: '1900.01' },
              { title: '武道极境', desc: '在战术推演中达成连续 20 次战胜对手', icon: Swords, unlocked: false, date: '未达成 (18/20)' },
              { title: '名流之光', desc: '与所有瓦伦丁家族成员好感度达到 90%', icon: Heart, unlocked: false, date: '未达成 (5/7)' },
            ].map((ach, i) => (
              <div
                key={i}
                className={`border-2 border-black rounded-2xl p-3 flex items-center gap-3 shadow-[0_3px_0_#000] ${
                  ach.unlocked ? 'bg-[#2d2f3d]' : 'bg-[#21232e] opacity-75'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[0_2px_0_#000] ${
                    ach.unlocked ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  <ach.icon size={22} strokeWidth={2.5} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-black text-xs">{ach.title}</h4>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded border border-black ${
                        ach.unlocked ? 'bg-emerald-900/80 text-emerald-300' : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {ach.unlocked ? '已解锁' : '未解锁'}
                    </span>
                  </div>
                  <p className="text-gray-300 text-[11px] font-bold mt-0.5 truncate">{ach.desc}</p>
                  <div className="text-[10px] text-gray-400 font-mono mt-1">{ach.date}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: 系统设置 (Settings) */}
        {subTab === 'settings' && (
          <div className="space-y-3">
            <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-3">
              <h3 className="text-white font-black text-sm mb-2 flex items-center gap-2 border-b border-gray-700/80 pb-2">
                <Settings size={16} className="text-yellow-400" /> 音效与画面设置
              </h3>

              <div className="flex justify-between items-center bg-[#21232e] p-3 rounded-xl border border-black">
                <div className="flex items-center gap-2">
                  {bgmEnabled ? <Volume2 size={18} className="text-yellow-400" /> : <VolumeX size={18} className="text-gray-500" />}
                  <div>
                    <div className="text-white font-black text-xs">背景音乐 (BGM)</div>
                    <div className="text-gray-400 text-[10px]">开启复古像素游戏背景音效</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setBgmEnabled(!bgmEnabled);
                    showToast(bgmEnabled ? '已关闭背景音乐' : '已开启背景音乐');
                  }}
                  className={`w-12 h-6 rounded-full border-2 border-black relative transition-colors cursor-pointer ${
                    bgmEnabled ? 'bg-yellow-400' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-black absolute top-0.5 transition-transform ${
                      bgmEnabled ? 'left-6' : 'left-0.5'
                    }`}
                  ></div>
                </button>
              </div>

              <div className="flex justify-between items-center bg-[#21232e] p-3 rounded-xl border border-black">
                <div className="flex items-center gap-2">
                  {sfxEnabled ? <Volume2 size={18} className="text-yellow-400" /> : <VolumeX size={18} className="text-gray-500" />}
                  <div>
                    <div className="text-white font-black text-xs">按键与动作音效</div>
                    <div className="text-gray-400 text-[10px]">点击与抽卡物理反馈音</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSfxEnabled(!sfxEnabled);
                    showToast(sfxEnabled ? '已关闭动作音效' : '已开启动作音效');
                  }}
                  className={`w-12 h-6 rounded-full border-2 border-black relative transition-colors cursor-pointer ${
                    sfxEnabled ? 'bg-yellow-400' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-black absolute top-0.5 transition-transform ${
                      sfxEnabled ? 'left-6' : 'left-0.5'
                    }`}
                  ></div>
                </button>
              </div>

              <div className="flex justify-between items-center bg-[#21232e] p-3 rounded-xl border border-black">
                <div>
                  <div className="text-white font-black text-xs">高帧率渲染 (60 FPS)</div>
                  <div className="text-gray-400 text-[10px]">提升画面流畅度与转场动画</div>
                </div>
                <button
                  onClick={() => {
                    setHighFps(!highFps);
                    showToast(highFps ? '已切换至标准帧率' : '已开启 60FPS 极速渲染');
                  }}
                  className={`w-12 h-6 rounded-full border-2 border-black relative transition-colors cursor-pointer ${
                    highFps ? 'bg-yellow-400' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-black absolute top-0.5 transition-transform ${
                      highFps ? 'left-6' : 'left-0.5'
                    }`}
                  ></div>
                </button>
              </div>
            </div>

            <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-3">
              <h3 className="text-white font-black text-sm mb-2 flex items-center gap-2 border-b border-gray-700/80 pb-2">
                <RotateCcw size={16} className="text-rose-400" /> 存档管理
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!onSaveProgress) {
                      showToast('当前账号仅保存在本机，登录邮箱账号后可使用云端存档');
                      return;
                    }
                    showToast((await onSaveProgress()) ? '☁️ 云端存档同步成功！已保存至最新进度' : '⚠️ 云端存档同步失败，请检查网络后重试');
                  }}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black py-2.5 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer active:translate-y-0.5 flex items-center justify-center gap-1.5"
                >
                  <Save size={14} /> 保存进度
                </button>
                {confirmReset ? (
                  <div className="flex items-center gap-1.5 bg-[#21232e] p-1.5 rounded-xl border border-rose-500/50">
                    <span className="text-[10px] text-rose-300 font-bold px-1">确认重置？</span>
                    <button
                      onClick={() => {
                        setConfirmReset(false);
                        if (onResetLife) {
                          onResetLife();
                        } else {
                          setCoins(10000);
                          showToast('人生已重新开始，预祝您创造新辉煌！');
                        }
                        onClose();
                      }}
                      className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-lg border border-black cursor-pointer shadow-[0_1px_0_#000]"
                    >
                      确定
                    </button>
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-[10px] font-black px-2 py-1 rounded-lg border border-black cursor-pointer"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmReset(true)}
                    className="bg-rose-900/80 hover:bg-rose-800 text-rose-200 text-xs font-black px-4 py-2.5 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer active:translate-y-0.5"
                  >
                    重置人生
                  </button>
                )}
              </div>

              {onLogout && (
                <div className="pt-3 border-t border-gray-700/80 mt-2">
                  {confirmLogout ? (
                    <div className="flex items-center justify-between gap-2 bg-[#21232e] p-2 rounded-xl border-2 border-red-500/80 animate-in fade-in duration-150">
                      <span className="text-xs text-red-300 font-bold">确认退出当前账号吗？</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={async () => {
                            setConfirmLogout(false);
                            if (await onLogout()) {
                              onClose();
                            } else {
                              showToast('⚠️ 无法同步存档到云端，请检查网络后再退出');
                            }
                          }}
                          className="bg-red-600 hover:bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-lg border border-black cursor-pointer shadow-[0_1px_0_#000] active:scale-95"
                        >
                          确认退出
                        </button>
                        <button
                          onClick={() => setConfirmLogout(false)}
                          className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-black px-3 py-1.5 rounded-lg border border-black cursor-pointer active:scale-95"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmLogout(true)}
                      className="w-full bg-[#1b1c25] hover:bg-red-950/40 text-red-400 text-xs font-black py-2.5 rounded-xl border-2 border-red-900 shadow-[0_2px_0_#000] cursor-pointer active:translate-y-0.5 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <LogOut size={14} /> 退出登录
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: 礼包兑换 (CDKey) */}
        {subTab === 'cdkey' && (
          <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-400 rounded-xl border-2 border-black flex items-center justify-center shadow-[0_2px_0_#000] flex-shrink-0">
                <KeyRound size={26} className="text-black" />
              </div>
              <div>
                <h3 className="text-white font-black text-sm">兑换官方礼包码</h3>
                <p className="text-gray-300 text-xs font-bold mt-0.5">输入兑换码领取限量金币与道具！</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="请输入礼包码 (如 GIFT2026)"
                value={cdkeyInput}
                onChange={(e) => setCdkeyInput(e.target.value)}
                className="flex-1 bg-[#21232e] text-white font-black text-xs px-3 py-2.5 rounded-xl border-2 border-black focus:border-yellow-400 focus:outline-none placeholder:text-gray-500 uppercase"
              />
              <button
                onClick={handleRedeemCdkey}
                className="bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black px-5 py-2.5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] cursor-pointer active:translate-y-0.5"
              >
                兑换
              </button>
            </div>

            <div className="bg-[#21232e] p-3 rounded-xl border border-black space-y-1.5">
              <div className="text-yellow-400 font-black text-xs">💡 可测试的公测礼包码：</div>
              <div className="text-gray-300 text-xs font-mono font-bold">· GIFT2026 : 50,000 金币</div>
              <div className="text-gray-300 text-xs font-mono font-bold">· 666666 : 50,000 金币</div>
              <div className="text-gray-300 text-xs font-mono font-bold">· VALENTINE : 瓦伦丁家族专属好礼</div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-gray-500 text-[10px] font-bold pt-2">
          AmiGO Lite v1.2.0 · 玩家 UID: {displayUid}
        </div>
      </div>

      {/* 政治与合规敏感词警告/冻结改名弹窗 (统一重度黑框/街机游戏UI风格) */}
      {freezeModalInfo && freezeModalInfo.show && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-in zoom-in-95 duration-150">
          <div className="bg-[#252632] border-4 border-black rounded-3xl max-w-sm w-full p-5 shadow-[0_10px_0_#000] relative text-white space-y-4">
            
            {/* 游戏风格顶栏横幅标题 (纯色系无渐变，风格统一) */}
            <div className="-mt-8 mx-auto w-fit bg-red-600 border-3 border-black rounded-2xl px-4 py-1.5 shadow-[0_4px_0_#000] flex items-center justify-center">
              <span className="text-white font-black text-sm tracking-wider drop-shadow-[0_2px_0_#000]">
                {freezeModalInfo.isFrozen ? '角色改名冻结管制' : '敏感词合规警告'}
              </span>
            </div>

            {/* 警告状态与计数标识 */}
            <div className="flex justify-center">
              <span className="bg-[#1b1c25] text-yellow-300 border-2 border-black font-black text-[11px] px-3 py-1 rounded-xl shadow-[0_2px_0_#000] flex items-center gap-1">
                <AlertTriangle size={13} className="text-amber-400" />
                <span>
                  {freezeModalInfo.isFrozen ? '系统管制防范中 (改名锁定3个月)' : `敏感词触发记录: ${freezeModalInfo.violationCount} / 3 次`}
                </span>
              </span>
            </div>

            {/* 游戏内提示框/历史记录面板 */}
            <div className="bg-[#1b1c25] rounded-2xl p-4 border-3 border-black shadow-[0_4px_0_#000] text-xs leading-relaxed text-gray-200 min-h-[170px] flex flex-col justify-between">
              {modalTab === 'history' ? (
                <div className="space-y-2.5 text-left w-full">
                  <div className="flex items-center justify-between pb-1.5 border-b-2 border-black">
                    <span className="text-yellow-300 font-black text-xs flex items-center gap-1">
                      <History size={14} className="text-amber-400" /> 我的违规改名历史 ({politicalViolationLogs.length} 条)
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">违规档案</span>
                  </div>

                  {politicalViolationLogs.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-xs font-bold space-y-1">
                      <FileText size={24} className="mx-auto text-gray-500 mb-1" />
                      <div>暂无违规改名记录</div>
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {politicalViolationLogs.map((log) => (
                        <div key={log.id} className="bg-[#2a2c3a] border-2 border-black rounded-xl p-2.5 text-[11px] space-y-1 shadow-[0_2px_0_#000]">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">尝试输入：</span>
                            <span className="font-mono text-white font-black max-w-[140px] truncate">"{log.attemptedName}"</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">触犯词汇：</span>
                            <span className="text-red-400 font-mono font-black">[{log.matchedWord}]</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-gray-700/60 mt-1">
                            <span className="text-amber-400 font-bold">• {log.category}</span>
                            <span className="text-gray-400 font-mono">{formatUnlockTime(log.timestamp)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {freezeModalInfo.isFrozen ? (
                    <>
                      <p className="text-red-300 font-bold leading-normal">
                        由于检测到多次尝试输入 <span className="text-yellow-400 font-black">政治与合规敏感</span> 词汇，您的改名权限已被管制防范系统锁定 <span className="text-red-400 font-black">3 个月</span>。
                      </p>
                      {freezeModalInfo.matchedWord && (
                        <div className="bg-[#2a2c3a] border-2 border-black rounded-xl p-2 text-[11px]">
                          <span className="text-gray-400">拦截触发词：</span>
                          <span className="text-yellow-400 font-mono font-black">[{freezeModalInfo.matchedWord}]</span>
                        </div>
                      )}
                      <div className="bg-red-950 border-2 border-red-600 rounded-xl p-2.5 text-[11px] text-red-200 space-y-1">
                        <div className="font-bold flex items-center justify-between">
                          <span>• 管制时长：</span>
                          <span className="font-mono text-white font-black">3 个月 (90天)</span>
                        </div>
                        <div className="font-bold flex items-center justify-between">
                          <span>• 解封时刻：</span>
                          <span className="font-mono text-yellow-300 font-black">{formatUnlockTime(nameFreezeUntil)}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium">
                        提示：请共同维护良好的游戏社区氛围，文明竞技，严禁使用涉及政治及敏感议题的文字。
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-amber-300 font-bold leading-normal">
                        您提交的昵称已被系统拦截，原因：匹配到 <span className="text-red-400 font-black">[政治与合规敏感]</span> 分类受限词汇。
                      </p>
                      {freezeModalInfo.matchedWord && (
                        <div className="bg-[#2a2c3a] border-2 border-black rounded-xl p-2 text-[11px]">
                          <span className="text-gray-400">触犯敏感词：</span>
                          <span className="text-yellow-400 font-mono font-black">[{freezeModalInfo.matchedWord}]</span>
                        </div>
                      )}
                      <div className="bg-amber-950 border-2 border-amber-600 rounded-xl p-2.5 text-[11px] text-amber-200 space-y-1">
                        <div className="font-black text-red-300 flex items-center justify-between">
                          <span>• 当前违规计次：</span>
                          <span className="font-mono text-yellow-300 text-sm font-black">{freezeModalInfo.violationCount} / 3 次</span>
                        </div>
                        <div className="text-[10px] text-red-400 font-bold">
                          ⚠️ 严重警告：若累计尝试达 3 次，改名功能将直接锁死 3 个月！
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium">
                        请更换其他正常且健康的游戏昵称重新保存。
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 底部双按钮控制 (查看违规原因 + 确认知晓) */}
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setModalTab(modalTab === 'history' ? 'info' : 'history')}
                className="flex-1 bg-[#2a2c3a] hover:bg-[#36394d] text-yellow-300 font-black py-2.5 px-2 rounded-2xl border-3 border-black shadow-[0_4px_0_#000] active:translate-y-1 active:shadow-none transition-all text-[11px] cursor-pointer flex items-center justify-center gap-1"
              >
                <History size={14} className="text-amber-400" />
                <span>{modalTab === 'history' ? '返回合规说明' : '查看违规记录'}</span>
              </button>

              <button
                onClick={() => {
                  setFreezeModalInfo(null);
                  setModalTab('info');
                }}
                className="flex-1 bg-amber-400 hover:bg-amber-300 text-black font-black py-2.5 px-2 rounded-2xl border-3 border-black shadow-[0_4px_0_#000] active:translate-y-1 active:shadow-none transition-all text-[11px] cursor-pointer flex items-center justify-center gap-1"
              >
                <Check size={15} strokeWidth={3} />
                <span>遵纪守法，已知晓</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Selection Modal */}
      <AvatarSelectModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        avatarSource={avatarSource}
        onSelectAvatar={(src) => {
          setAvatarSource(src);
          try { localStorage.setItem('amigo_avatar_source', src); } catch (e) {}
          showToast('头像设置已修改！');
        }}
        authUser={authUser}
        bilibiliAvatar={bilibiliAvatar}
        equippedClothing={equippedClothing}
      />
    </div>
  );
};

const BANK_LIST = [
  {
    id: 'aminoac',
    name: 'Bank Of Aminoac（阿米诺斯银行）',
    shortName: 'Bank Of Aminoac',
    type: '商业巨头',
    rate: '4.8% 活期年化',
    maxLoan: 1000000,
    openFee: 0,
    badge: '免开户费',
    desc: '阿米诺斯帝国商业与民用核心银行，资金结算迅捷，提供灵活资金周转。',
  },
  {
    id: 'aminoac_savings',
    name: '阿米诺斯储蓄银行',
    shortName: '阿米诺斯储蓄银行',
    type: '官方储蓄',
    rate: '5.8% 定期年化',
    maxLoan: 500000,
    openFee: 1000,
    badge: '保本保息',
    desc: '由阿米诺斯皇家财政部直辖担保，专精定期沉淀储蓄与稳健长效回报。',
  },
  {
    id: 'russia_invest',
    name: '俄罗斯投资银行',
    shortName: '俄罗斯投资银行',
    type: '资本投资',
    rate: '8.5%~16% 浮动',
    maxLoan: 3000000,
    openFee: 10000,
    badge: '高额信贷',
    desc: '跨国重工业与能源风险投资银团，提供高额信用借贷与股票基金。',
  },
  {
    id: 'joint_bank',
    name: 'Совместный банк России и Аминоас诺汇银行',
    shortName: '俄罗斯与阿米诺斯联合银行',
    type: '跨国银团',
    rate: '12.0% 尊享年化',
    maxLoan: 10000000,
    openFee: 50000,
    badge: 'VIP尊享',
    desc: '俄阿两国超级财团联合创立，VIP黑卡通道，享有极高利息与千万信贷。',
  },
];

interface BankAccountData {
  opened: boolean;
  cardNo: string;
  deposit: number;
  loan: number;
  transactions: Array<{
    id: string;
    type: 'deposit' | 'withdraw' | 'loan' | 'repay' | 'interest' | 'investment';
    title: string;
    amount: number;
    time: string;
  }>;
}

const BankModal = ({
  onClose,
  coins,
  setCoins,
  bankDeposit,
  setBankDeposit,
  bankLoan,
  setBankLoan,
  onOpenWealthChart,
}: {
  onClose: () => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  bankDeposit: number;
  setBankDeposit: React.Dispatch<React.SetStateAction<number>>;
  bankLoan: number;
  setBankLoan: React.Dispatch<React.SetStateAction<number>>;
  onOpenWealthChart?: () => void;
}) => {
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'deposit' | 'investment' | 'loan' | 'history'>('deposit');
  const [amountInput, setAmountInput] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 多银行账户数据存储
  const [accounts, setAccounts] = useState<Record<string, BankAccountData>>(() => {
    try {
      const saved = localStorage.getItem('amigo_multi_bank_accounts_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    // 初始状态：默认开通 Bank Of Aminoac，并继承旧的存贷款数据
    return {
      aminoac: {
        opened: true,
        cardNo: 'AMN-8801-9214',
        deposit: bankDeposit || 500000,
        loan: bankLoan || 0,
        transactions: [
          { id: '1', type: 'interest', title: '活期存款利息自动结算', amount: 1520, time: '今日 08:00' },
          { id: '2', type: 'deposit', title: '存入Bank Of Aminoac储蓄金', amount: 500000, time: '2026.08.10' },
        ],
      },
      aminoac_savings: {
        opened: false,
        cardNo: 'AMN-SAV-1029',
        deposit: 0,
        loan: 0,
        transactions: [],
      },
      russia_invest: {
        opened: false,
        cardNo: 'RUS-INV-7731',
        deposit: 0,
        loan: 0,
        transactions: [],
      },
      joint_bank: {
        opened: false,
        cardNo: 'RUS-AMN-9988',
        deposit: 0,
        loan: 0,
        transactions: [],
      },
    };
  });

  // 保存数据并同步总资产
  const saveAccounts = (updated: Record<string, BankAccountData>) => {
    setAccounts(updated);
    try {
      localStorage.setItem('amigo_multi_bank_accounts_v1', JSON.stringify(updated));
    } catch (e) {}

    // 计算所有银航账户的总储蓄与总贷款并更新给主调函数
    let totalDep = 0;
    let totalL = 0;
    Object.values(updated).forEach(acc => {
      if (acc.opened) {
        totalDep += acc.deposit;
        totalL += acc.loan;
      }
    });
    setBankDeposit(totalDep);
    setBankLoan(totalL);
    try {
      localStorage.setItem('amigo_bank_deposit', totalDep.toString());
      localStorage.setItem('amigo_bank_loan', totalL.toString());
    } catch (e) {}
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // 开立新银行账户
  const handleOpenAccount = (bank: typeof BANK_LIST[0]) => {
    if (coins < bank.openFee) {
      showToast(`身上现金不足以支付开户费 (${bank.openFee.toLocaleString()} ₽)！`);
      return;
    }

    if (bank.openFee > 0) {
      setCoins(prev => prev - bank.openFee);
    }

    const randomCard = `${bank.id.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const updated = {
      ...accounts,
      [bank.id]: {
        opened: true,
        cardNo: randomCard,
        deposit: 0,
        loan: 0,
        transactions: [
          { id: Date.now().toString(), type: 'deposit' as const, title: `在 [${bank.shortName}] 开立银航账户`, amount: 0, time: '刚才' }
        ],
      },
    };

    saveAccounts(updated);
    showToast(`成功在 [${bank.shortName}] 开户！获得卡号: ${randomCard}`);
    setSelectedBankId(bank.id);
  };

  const currentBank = BANK_LIST.find(b => b.id === selectedBankId);
  const currentAccount = selectedBankId ? accounts[selectedBankId] : null;

  // 增加流水
  const addTransactionForCurrent = (type: 'deposit' | 'withdraw' | 'loan' | 'repay' | 'interest' | 'investment', title: string, amount: number) => {
    if (!selectedBankId || !currentAccount) return;
    const newTx = {
      id: Date.now().toString(),
      type,
      title,
      amount,
      time: '刚才',
    };
    const updated = {
      ...accounts,
      [selectedBankId]: {
        ...currentAccount,
        transactions: [newTx, ...(currentAccount.transactions || [])],
      },
    };
    saveAccounts(updated);
  };

  // 存款处理
  const handleDeposit = () => {
    if (!selectedBankId || !currentAccount) return;
    const val = parseInt(amountInput, 10);
    if (isNaN(val) || val <= 0) {
      showToast('请输入有效的存款金额');
      return;
    }
    if (val > coins) {
      showToast('身上现金不足！');
      return;
    }

    setCoins(prev => prev - val);
    const updated = {
      ...accounts,
      [selectedBankId]: {
        ...currentAccount,
        deposit: currentAccount.deposit + val,
        transactions: [
          { id: Date.now().toString(), type: 'deposit' as const, title: `存入 [${currentBank?.shortName}]`, amount: val, time: '刚才' },
          ...(currentAccount.transactions || [])
        ],
      },
    };
    saveAccounts(updated);
    setAmountInput('');
    showToast(`成功存入 ${val.toLocaleString()} ₽ 储蓄金！`);
  };

  // 取款处理
  const handleWithdraw = () => {
    if (!selectedBankId || !currentAccount) return;
    const val = parseInt(amountInput, 10);
    if (isNaN(val) || val <= 0) {
      showToast('请输入有效的取款金额');
      return;
    }
    if (val > currentAccount.deposit) {
      showToast('该银行账户储蓄余额不足！');
      return;
    }

    const updated = {
      ...accounts,
      [selectedBankId]: {
        ...currentAccount,
        deposit: currentAccount.deposit - val,
        transactions: [
          { id: Date.now().toString(), type: 'withdraw' as const, title: `从 [${currentBank?.shortName}] 支取现金`, amount: -val, time: '刚才' },
          ...(currentAccount.transactions || [])
        ],
      },
    };
    saveAccounts(updated);
    setCoins(prev => prev + val);
    setAmountInput('');
    showToast(`成功支取 ${val.toLocaleString()} ₽ 现金！`);
  };

  // 申请贷款
  const handleApplyLoan = (loanAmount: number) => {
    if (!selectedBankId || !currentAccount || !currentBank) return;
    if (currentAccount.loan + loanAmount > currentBank.maxLoan) {
      showToast(`超出本行最高信贷额度 (${currentBank.maxLoan.toLocaleString()} ₽)！`);
      return;
    }

    const updated = {
      ...accounts,
      [selectedBankId]: {
        ...currentAccount,
        loan: currentAccount.loan + loanAmount,
        transactions: [
          { id: Date.now().toString(), type: 'loan' as const, title: `申请 [${currentBank.shortName}] 信贷放款`, amount: loanAmount, time: '刚才' },
          ...(currentAccount.transactions || [])
        ],
      },
    };
    saveAccounts(updated);
    setCoins(prev => prev + loanAmount);
    showToast(`成功贷款 ${loanAmount.toLocaleString()} ₽，资金已入账！`);
  };

  // 归还贷款
  const handleRepayLoan = () => {
    if (!selectedBankId || !currentAccount || !currentBank) return;
    const val = parseInt(amountInput, 10);
    if (isNaN(val) || val <= 0) {
      showToast('请输入有效的还款金额');
      return;
    }
    if (val > coins) {
      showToast('现金不足，无法还款！');
      return;
    }
    const repayVal = Math.min(val, currentAccount.loan);
    if (repayVal <= 0) {
      showToast('本行当前没有待还贷款！');
      return;
    }

    setCoins(prev => prev - repayVal);
    const updated = {
      ...accounts,
      [selectedBankId]: {
        ...currentAccount,
        loan: currentAccount.loan - repayVal,
        transactions: [
          { id: Date.now().toString(), type: 'repay' as const, title: `归还 [${currentBank.shortName}] 信贷欠款`, amount: -repayVal, time: '刚才' },
          ...(currentAccount.transactions || [])
        ],
      },
    };
    saveAccounts(updated);
    setAmountInput('');
    showToast(`成功归还贷款 ${repayVal.toLocaleString()} ₽！`);
  };

  // 计算多账户总资产
  const accountList = Object.values(accounts) as BankAccountData[];
  const totalDepositAll = accountList.reduce((acc, curr) => acc + (curr.opened ? curr.deposit : 0), 0);
  const totalLoanAll = accountList.reduce((acc, curr) => acc + (curr.opened ? curr.loan : 0), 0);
  const openedBankCount = accountList.filter(a => a.opened).length;

  return (
    <div className="absolute inset-0 bg-[#252632] flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-200 overflow-hidden text-white">
      {toastMsg && (
        <div className="absolute top-22 left-1/2 -translate-x-1/2 z-50 bg-black/95 text-yellow-300 border-2 border-yellow-500 text-xs font-black px-4 py-2 rounded-xl shadow-[0_4px_0_#000] animate-in fade-in slide-in-from-top-2 duration-200 text-center max-w-[85%]">
          {toastMsg}
        </div>
      )}

      {/* 帝国银行业顶栏 (Imperial Bank Vault Header) */}
      <div className="relative w-full h-16 bg-[#181a24] border-b-2 border-black shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20 flex items-center justify-between px-4 flex-shrink-0">
        {/* 左侧返回/切换按钮 */}
        <button 
          onClick={selectedBankId ? () => setSelectedBankId(null) : onClose} 
          className="p-2 bg-[#2d2f3d] hover:bg-[#383b4e] border-2 border-black rounded-xl active:translate-y-0.5 shadow-[0_2px_0_#000] cursor-pointer text-white flex items-center justify-center transition-all z-10"
        >
          <ChevronLeft size={20} className="text-white drop-shadow" strokeWidth={3} />
        </button>
        
        {/* 中央银行金库牌匾 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-12">
          <div className="bg-[#232635] border-2 border-amber-500/70 px-4 py-1.5 rounded-xl shadow-[0_3px_0_#000] flex items-center gap-2 max-w-[85%]">
            <Landmark size={18} className="text-amber-400 flex-shrink-0" />
            <span className="text-amber-300 text-xs sm:text-sm font-black tracking-wider truncate">
              {currentBank ? currentBank.shortName : '银行'}
            </span>
          </div>
        </div>

        {/* 右侧占位保持对称 */}
        <div className="w-9 z-10" />
      </div>

      {/* 主体区 */}
      <div className="flex-1 overflow-y-auto pb-6 pt-5 px-4 space-y-4">
        
        {/* 1. 银行选择大厅视图 (当未选择具体银行时) */}
        {!selectedBankId ? (
          <div className="space-y-4">
            {/* 总体资产卡片 */}
            <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] relative">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-yellow-400 font-bold flex items-center gap-1">
                    <Wallet size={14} /> 全域银行资产 (储蓄总额 + 现金)
                  </div>
                  <div className="text-white font-black text-2xl mt-1 tracking-wider font-mono">
                    {(coins + totalDepositAll).toLocaleString()} <span className="text-sm font-bold text-yellow-400">₽</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded border border-black shadow-[0_1px_0_#000]">
                    已开立 {openedBankCount} / {BANK_LIST.length} 家银航
                  </span>
                  {onOpenWealthChart && (
                    <button
                      onClick={onOpenWealthChart}
                      className="bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/50 text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                    >
                      <span>📊 个人资产全景</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-700/80 text-xs">
                <div className="bg-[#21232e] p-2 rounded-xl border border-black">
                  <span className="text-gray-400 text-[10px] block font-bold">身上现金</span>
                  <span className="text-yellow-400 font-black font-mono text-xs">{coins.toLocaleString()} ₽</span>
                </div>
                <div className="bg-[#21232e] p-2 rounded-xl border border-black">
                  <span className="text-gray-400 text-[10px] block font-bold">存款总额</span>
                  <span className="text-emerald-400 font-black font-mono text-xs">{totalDepositAll.toLocaleString()} ₽</span>
                </div>
                <div className="bg-[#21232e] p-2 rounded-xl border border-black">
                  <span className="text-gray-400 text-[10px] block font-bold">贷款总欠款</span>
                  <span className="text-red-400 font-black font-mono text-xs">{totalLoanAll.toLocaleString()} ₽</span>
                </div>
              </div>
            </div>

            <div className="text-xs font-black text-yellow-400 flex items-center gap-1.5 px-1">
              <Building size={16} className="text-amber-400" /> 选择银行办理业务或开立新账户：
            </div>

            {/* 4 家银行列表 */}
            <div className="space-y-3">
              {BANK_LIST.map((bank) => {
                const acc = accounts[bank.id];
                const isOpened = acc && acc.opened;

                return (
                  <div 
                    key={bank.id}
                    className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] relative overflow-hidden transition-all hover:bg-[#343747]"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-black text-sm">{bank.name}</h3>
                        </div>
                        <p className="text-gray-300 text-[11px] leading-relaxed max-w-[90%]">{bank.desc}</p>
                      </div>

                      <span className="bg-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded border border-black shrink-0">
                        {bank.badge}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-700/80 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-400 font-black flex items-center gap-1">
                          <TrendingUp size={14} /> {bank.rate}
                        </span>
                        {isOpened && (
                          <span className="text-amber-300 font-mono text-[11px] font-bold">
                            卡号: {acc.cardNo}
                          </span>
                        )}
                      </div>

                      {isOpened ? (
                        <button
                          onClick={() => {
                            setSelectedBankId(bank.id);
                            setActiveTab('deposit');
                          }}
                          className="bg-amber-400 hover:bg-yellow-300 text-black font-black text-xs px-3.5 py-1.5 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer flex items-center gap-1 active:translate-y-0.5"
                        >
                          <span>进入银行</span>
                          <ChevronRight size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenAccount(bank)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs px-3.5 py-1.5 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer active:translate-y-0.5"
                        >
                          {bank.openFee === 0 ? '免费开立账户' : `开立账户 (${(bank.openFee/1000).toFixed(0)}k ₽)`}
                        </button>
                      )}
                    </div>

                    {isOpened && (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] bg-[#21232e] p-2 rounded-xl border border-black">
                        <div className="text-gray-300">
                          存款余额: <span className="text-emerald-400 font-mono font-bold">{acc.deposit.toLocaleString()} ₽</span>
                        </div>
                        <div className="text-gray-300">
                          信贷欠款: <span className="text-red-400 font-mono font-bold">{acc.loan.toLocaleString()} ₽</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* 2. 具体银行操作面板 (当选中某家银行时) */
          <div className="space-y-4">
            {/* 选中银行专属卡片 */}
            <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] relative">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-yellow-400 font-black flex items-center gap-1">
                    <Building size={14} /> {currentBank?.name}
                  </div>
                  <div className="text-white font-mono text-[11px] font-bold mt-0.5 text-gray-300">
                    账户卡号：{currentAccount?.cardNo}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBankId(null)}
                  className="bg-[#21232e] text-yellow-300 hover:text-white text-[10px] font-black px-2.5 py-1 rounded-lg border border-black cursor-pointer shadow-[0_1px_0_#000]"
                >
                  切换银行
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-700/80 text-xs">
                <div className="bg-[#21232e] p-2 rounded-xl border border-black">
                  <span className="text-gray-300 text-[10px] block font-bold">本行定期储蓄</span>
                  <span className="text-emerald-400 font-black font-mono text-sm">
                    {currentAccount?.deposit.toLocaleString()} ₽
                  </span>
                </div>
                <div className="bg-[#21232e] p-2 rounded-xl border border-black">
                  <span className="text-gray-300 text-[10px] block font-bold">本行信贷欠款</span>
                  <span className="text-red-400 font-black font-mono text-sm">
                    {currentAccount?.loan.toLocaleString()} ₽
                  </span>
                </div>
              </div>
            </div>

            {/* 标签栏 */}
            <div className="grid grid-cols-4 bg-[#21232e] p-1 rounded-xl border-2 border-black gap-1 shadow-[0_2px_0_#000]">
              <button
                onClick={() => setActiveTab('deposit')}
                className={`py-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer truncate ${
                  activeTab === 'deposit'
                    ? 'bg-amber-400 text-black border-black shadow-[0_1px_0_#000]'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                存款理财
              </button>
              <button
                onClick={() => setActiveTab('investment')}
                className={`py-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer truncate ${
                  activeTab === 'investment'
                    ? 'bg-amber-400 text-black border-black shadow-[0_1px_0_#000]'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                专属基金
              </button>
              <button
                onClick={() => setActiveTab('loan')}
                className={`py-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer truncate ${
                  activeTab === 'loan'
                    ? 'bg-amber-400 text-black border-black shadow-[0_1px_0_#000]'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                信贷借还
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer truncate ${
                  activeTab === 'history'
                    ? 'bg-amber-400 text-black border-black shadow-[0_1px_0_#000]'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                账户流水
              </button>
            </div>

            {/* 存款面板 */}
            {activeTab === 'deposit' && (
              <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-4">
                <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                  <span className="text-white font-black text-xs flex items-center gap-1.5">
                    <Landmark size={16} className="text-yellow-400" /> {currentBank?.shortName} 存款专区
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-600">
                    {currentBank?.rate}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-300 font-bold">
                    <span>办理金币金额：</span>
                    <span className="text-amber-300">身上现金: {coins.toLocaleString()} ₽</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="请输入金额"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="flex-1 bg-[#1b1c25] text-white font-black text-sm px-3 py-2 rounded-xl border-2 border-black focus:border-yellow-400 focus:outline-none font-mono"
                    />
                    <button
                      onClick={() => setAmountInput(coins.toString())}
                      className="bg-gray-700 hover:bg-gray-600 text-yellow-300 font-black text-xs px-3 rounded-xl border-2 border-black cursor-pointer shadow-[0_2px_0_#000]"
                    >
                      全部现金
                    </button>
                  </div>

                  <div className="flex gap-2 pt-1">
                    {[10000, 50000, 100000, 500000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setAmountInput(amt.toString())}
                        className="flex-1 bg-[#21232e] hover:bg-[#2e3142] text-gray-200 font-black text-[10px] py-1.5 rounded-lg border border-black cursor-pointer"
                      >
                        +{(amt / 10000)}万
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleDeposit}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-black py-3 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>存入本行</span>
                  </button>
                  <button
                    onClick={handleWithdraw}
                    className="bg-amber-400 hover:bg-amber-300 text-black font-black py-3 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>提取现金</span>
                  </button>
                </div>
              </div>
            )}

            {/* 基金理财 */}
            {activeTab === 'investment' && (
              <div className="space-y-3">
                {[
                  { title: `${currentBank?.shortName} 旗舰保本公债`, risk: '低风险', returnRate: '5.2% 年化', min: 10000, desc: '由该银行发行的政府信用担保公债。' },
                  { title: '帝国跨境贸易高盈余基金', risk: '中风险', returnRate: '12.8% 年化', min: 50000, desc: '参与阿米诺斯与俄罗斯双边重工业机械贸易。' },
                  { title: '前沿蒸汽能源与稀矿股票', risk: '高风险', returnRate: '28.5% 浮动', min: 100000, desc: '高杠杆能源股票投机，获得丰厚商业利润分红。' },
                ].map((fund, idx) => (
                  <div key={idx} className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3 shadow-[0_4px_0_#000] space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-black text-xs">{fund.title}</h4>
                      <span className="text-[10px] bg-yellow-400 text-black font-black px-1.5 py-0.5 rounded border border-black">
                        {fund.risk}
                      </span>
                    </div>
                    <p className="text-gray-300 text-[11px] font-bold">{fund.desc}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-gray-700/80">
                      <span className="text-emerald-400 font-black text-xs">预期收益: {fund.returnRate}</span>
                      <button
                        onClick={() => {
                          if (coins < fund.min) {
                            showToast(`身上现金不足以申购 (${fund.min.toLocaleString()} ₽)！`);
                            return;
                          }
                          setCoins(prev => prev - fund.min);
                          addTransactionForCurrent('investment', `申购 [${fund.title}]`, fund.min);
                          showToast(`成功申购 [${fund.title}] ${fund.min.toLocaleString()} ₽！`);
                        }}
                        className="bg-yellow-400 hover:bg-yellow-300 text-black font-black text-[11px] px-3 py-1 rounded-lg border border-black shadow-[0_1px_0_#000] cursor-pointer"
                      >
                        申购 ({(fund.min/10000)}万)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 信贷借还 */}
            {activeTab === 'loan' && (
              <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-4">
                <div className="bg-[#21232e] p-3 rounded-xl border border-black space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-bold">本行已借贷款：</span>
                    <span className="text-red-400 font-black font-mono">{currentAccount?.loan.toLocaleString()} ₽</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-bold">本行剩余可用额度：</span>
                    <span className="text-emerald-400 font-black font-mono">
                      {Math.max(0, (currentBank?.maxLoan || 1000000) - (currentAccount?.loan || 0)).toLocaleString()} ₽
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-gray-300 text-xs font-bold block">快捷申请信贷：</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[50000, 200000, 500000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => handleApplyLoan(amt)}
                        className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs py-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer"
                      >
                        贷款 {(amt / 10000)}万 ₽
                      </button>
                    ))}
                  </div>
                </div>

                {currentAccount && currentAccount.loan > 0 && (
                  <div className="pt-2 border-t border-gray-700/80 space-y-2">
                    <label className="text-gray-300 text-xs font-bold block">归还本行贷款：</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="输入还款金额"
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        className="flex-1 bg-[#1b1c25] text-white font-black text-xs px-3 py-2 rounded-xl border-2 border-black focus:border-yellow-400 focus:outline-none font-mono"
                      />
                      <button
                        onClick={handleRepayLoan}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs px-4 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer"
                      >
                        归还欠款
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 交易明细 */}
            {activeTab === 'history' && (
              <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3 shadow-[0_4px_0_#000] space-y-2">
                <div className="text-white font-black text-xs border-b border-gray-700 pb-2 flex items-center justify-between">
                  <span>{currentBank?.shortName} 交易流水记录</span>
                  <span className="text-gray-400 text-[10px]">共 {currentAccount?.transactions?.length || 0} 条</span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {currentAccount?.transactions?.map((tx) => (
                    <div key={tx.id} className="bg-[#21232e] border border-black rounded-xl p-2.5 flex items-center justify-between">
                      <div>
                        <div className="text-white font-black text-xs">{tx.title}</div>
                        <div className="text-gray-400 text-[10px] font-mono mt-0.5">{tx.time}</div>
                      </div>
                      <div className={`font-black font-mono text-xs ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.amount >= 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()} ₽
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('role');
  const [showShop, setShowShop] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [showWealthChart, setShowWealthChart] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showHospital, setShowHospital] = useState(false);
  const [showJob, setShowJob] = useState(false);
  const [showHousing, setShowHousing] = useState(false);
  const [showVisa, setShowVisa] = useState(false);
  const [showImmigrate, setShowImmigrate] = useState(false);
  const [showBirthModal, setShowBirthModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMarriage, setShowMarriage] = useState(false);

  const [isRegistered, setIsRegistered] = useState<boolean>(() => {
    try {
      return localStorage.getItem('amigo_is_registered') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [gender, setGender] = useState<string | null>(() => {
    try {
      return localStorage.getItem('amigo_gender') || null;
    } catch (e) {
      return null;
    }
  });

  const [birthRegisteredYear, setBirthRegisteredYear] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('amigo_birth_registered_year');
      return saved ? parseInt(saved, 10) : 1870;
    } catch (e) {
      return 1870;
    }
  });

  const [authUser, setAuthUser] = useState<AppUser | null>(() => (DEV_SKIP_AUTH ? DEV_MOCK_USER : readCachedUser()));
  const [authLoading, setAuthLoading] = useState(!DEV_SKIP_AUTH);
  const [playerName, setPlayerName] = useState(() => readCachedUser()?.displayName || 'AmiGo·玩家');

  const applySignedInUser = (user: AppUser) => {
    setAuthUser(user);
    cacheUser(user);
    if (user.displayName || user.email) {
      setPlayerName(user.displayName || user.email?.split('@')[0] || 'AmiGo·玩家');
    }
  };

  // 启动时向账号服务确认登录状态
  React.useEffect(() => {
    if (DEV_SKIP_AUTH) {
      console.info('[DEV] VITE_SKIP_AUTH=true，已跳过登录，使用本地测试账号');
      return;
    }
    getMe()
      .then((user) => {
        if (user) {
          applySignedInUser(user);
        } else if (isPasswordUser(readCachedUser())) {
          // 邮箱账号的登录已失效；B 站账号不经过账号服务，保留本地登录状态
          setAuthUser(null);
          cacheUser(null);
        }
      })
      .catch(() => {
        // 网络不可用：保留本地缓存的登录用户，允许离线游玩
      })
      .finally(() => setAuthLoading(false));
  }, []);

  /** 退出登录。邮箱账号会先把进度同步到云端，失败则不退出并返回 false */
  const handleLogout = async (): Promise<boolean> => {
    if (isPasswordUser(authUser)) {
      if (cloud.enabled && !(await cloud.saveNow())) return false;
      try {
        await logoutRequest();
      } catch (e) {
        console.error(e);
      }
      // 清除本地进度，避免同一浏览器切换账号时共用存档
      clearLocalGameData();
      window.location.reload();
      return true;
    }
    setAuthUser(null);
    cacheUser(null);
    return true;
  };

  const [coins, setCoins] = useState<number>(() => loadStored('amigo_coins', 1047650));
  const [health, setHealth] = useState<number>(() => loadStored('amigo_health', 100));
  const [equippedClothing, setEquippedClothing] = useState<string>(() => loadStored('amigo_equipped_clothing', 'default'));

  const [gameYear, setGameYear] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('amigo_game_year');
      return saved ? parseInt(saved, 10) : 1870;
    } catch (e) {
      return 1870;
    }
  });

  const [gameMonth, setGameMonth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('amigo_game_month');
      return saved ? parseInt(saved, 10) : 1;
    } catch (e) {
      return 1;
    }
  });

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleNextMonth = () => {
    let nextM = gameMonth + 1;
    let nextY = gameYear;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    setGameMonth(nextM);
    setGameYear(nextY);
    try {
      localStorage.setItem('amigo_game_year', nextY.toString());
      localStorage.setItem('amigo_game_month', nextM.toString());
    } catch (e) {}

    const monthlyStipend = 1500;

    // 结算名下出租房产租金收益
    let propertyRentIncome = 0;
    let comfortBonusTotal = 0;
    try {
      const savedProps = localStorage.getItem('amigo_owned_properties');
      if (savedProps) {
        const props = JSON.parse(savedProps);
        if (Array.isArray(props)) {
          let updated = false;
          props.forEach((p: any) => {
            if (p.isRentedOut && p.rentPerMonth > 0) {
              propertyRentIncome += p.rentPerMonth;
              p.totalRentCollected = (p.totalRentCollected || 0) + p.rentPerMonth;
              updated = true;
            }
            if (p.isPrimaryResidence && !p.isRentedOut) {
              comfortBonusTotal += (p.comfortBonus || 5);
            }
          });
          if (updated) {
            localStorage.setItem('amigo_owned_properties', JSON.stringify(props));
          }
        }
      }
    } catch (e) {}

    // 结算租住支出
    let rentExpense = 0;
    try {
      const savedRental = localStorage.getItem('amigo_current_rental');
      if (savedRental) {
        const rental = JSON.parse(savedRental);
        if (rental && rental.monthlyRent) {
          rentExpense = rental.monthlyRent;
          comfortBonusTotal += (rental.comfortBonus || 2);
        }
      }
    } catch (e) {}

    const netChange = monthlyStipend + propertyRentIncome - rentExpense;
    setCoins((prev) => Math.max(0, prev + netChange));

    if (comfortBonusTotal > 0) {
      setHealth((prev) => Math.min(100, prev + comfortBonusTotal));
    }

    const mStr = nextM < 10 ? `0${nextM}` : `${nextM}`;
    let extraMsg = '';
    if (propertyRentIncome > 0) extraMsg += ` | 房租净收 +${propertyRentIncome} ₽`;
    if (rentExpense > 0) extraMsg += ` | 租金扣除 -${rentExpense} ₽`;

    // 婚后每月有概率迎来子嗣
    if (isRegistered && health > 0) {
      const ageNextMonth = 8 + Math.max(0, nextY - birthRegisteredYear);
      const birth = tryHaveChild(family, ageNextMonth, nextY, nextM);
      if (birth.child) {
        setFamily(birth.state);
        extraMsg += ` | 👶 ${birth.child.name} 降生！`;
      }
    }
    showToast(`🗓️ 已步入 ${nextY}.${mStr}！月度基本俸禄 +${monthlyStipend} ₽${extraMsg}`);
    // 等本月结算写入本地存档后再同步到云端
    setTimeout(() => void cloud.saveNow(), 1500);
  };

  const currentAge = isRegistered ? 8 + Math.max(0, gameYear - birthRegisteredYear) : 8;

  const handleRegisterBirth = (name: string) => {
    const generatedGender = Math.random() > 0.5 ? '男' : '女';
    setIsRegistered(true);
    setGender(generatedGender);
    setBirthRegisteredYear(gameYear);
    setPlayerName(name);
    try {
      localStorage.setItem('amigo_is_registered', 'true');
      localStorage.setItem('amigo_gender', generatedGender);
      localStorage.setItem('amigo_birth_registered_year', gameYear.toString());
      localStorage.setItem('amigo_player_name', name);
    } catch (e) {}
    showToast(`🎉 出生登记成功！性别：${generatedGender}，初始年龄：8岁`);
    return { gender: generatedGender, age: 8 };
  };

  const handleResetLife = () => {
    // 1. 重置出生登记与角色身份
    setIsRegistered(false);
    setGender(null);
    setBirthRegisteredYear(1870);
    setPlayerName('阿米诺斯市民');

    // 2. 重置角色形象与服装
    setEquippedClothing('default');
    setOwnedClothes(['default']);
    setAvatarSource('cartoon');
    setBilibiliAvatar(null);

    // 3. 重置属性与资产
    setCoins(10000);
    setHealth(100);
    setGameYear(1870);
    setGameMonth(1);
    setBankDeposit(500000);
    setBankLoan(0);
    setFreeDrawUsed(false);
    setFamily(INITIAL_FAMILY_STATE);

    // 4. 清理本地存储中本段人生的全部存档（amigo_* / aminoac_* 前缀），保留账号级数据
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('amigo_') || key.startsWith('aminoac_')) && !KEYS_KEPT_ON_RESET.has(key) && !key.startsWith('amigo_cloud_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (e) {}
    // 显式写入重置后的初始值：若数值本来就等于初始值，持久化 effect 不会再次触发
    saveStored('amigo_coins', 10000);
    saveStored('amigo_health', 100);
    saveStored('amigo_equipped_clothing', 'default');
    saveStored('amigo_owned_clothes', ['default']);
    saveStored('amigo_free_draw_used', false);
    saveStored('amigo_family', INITIAL_FAMILY_STATE);

    showToast('✨ 人生已重置！角色与所有状态已恢复初始状态');
  };

  const [bilibiliAvatar, setBilibiliAvatar] = useState<string | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarSource, setAvatarSource] = useState<string>(() => {
    try {
      return localStorage.getItem('amigo_avatar_source') || 'cartoon';
    } catch (e) {
      return 'cartoon';
    }
  });

  const renderAvatarContent = () => {
    if (avatarSource === 'social' && (authUser?.photoURL || bilibiliAvatar)) {
      return (
        <img 
          src={authUser?.photoURL || bilibiliAvatar || ''} 
          alt="User Avatar" 
          className="w-full h-full object-cover rounded-xl" 
        />
      );
    }
    if (avatarSource.startsWith('preset_')) {
      const preset = PRESET_AVATARS.find((p) => p.id === avatarSource);
      if (preset) {
        return (
          <div className={`w-full h-full ${preset.bg} rounded-xl flex items-center justify-center text-3xl shadow-inner`}>
            {preset.icon}
          </div>
        );
      }
    }
    return <CartoonCharacter clothing={equippedClothing} />;
  };
  const [ownedClothes, setOwnedClothes] = useState<string[]>(() => loadStored('amigo_owned_clothes', ['default']));

  const [bankDeposit, setBankDeposit] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('amigo_bank_deposit');
      return saved ? parseInt(saved, 10) : 500000;
    } catch (e) {
      return 500000;
    }
  });

  const [bankLoan, setBankLoan] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('amigo_bank_loan');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  });

  const [freeDrawUsed, setFreeDrawUsed] = useState<boolean>(() => loadStored('amigo_free_draw_used', false));

  // 核心状态持久化（刷新页面后保留）
  React.useEffect(() => saveStored('amigo_coins', coins), [coins]);
  React.useEffect(() => saveStored('amigo_health', health), [health]);
  React.useEffect(() => saveStored('amigo_equipped_clothing', equippedClothing), [equippedClothing]);
  React.useEffect(() => saveStored('amigo_owned_clothes', ownedClothes), [ownedClothes]);
  React.useEffect(() => saveStored('amigo_free_draw_used', freeDrawUsed), [freeDrawUsed]);

  // 家族：好感度、婚姻、子嗣与家族大事
  const [family, setFamily] = useState<FamilyState>(() => loadStored('amigo_family', INITIAL_FAMILY_STATE));
  React.useEffect(() => saveStored('amigo_family', family), [family]);

  // 云端存档（仅已验证的邮箱账号）
  const cloud = useCloudSave(authUser);

  const playerOccupation = (() => {
    const id = readCurrentJobId();
    const job = id ? JOB_POSITIONS.find((j) => j.id === id) : null;
    if (job) return job.title;
    return currentAge < 18 ? '学堂学生' : '待业';
  })();

  if (authLoading) {
    return (
      <div className="h-[100dvh] w-full bg-[#0d0e15] flex justify-center items-center text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={28} className="animate-spin text-amber-400" />
          <span className="text-xs font-black text-gray-300">正在连接 AmiGO 账号服务...</span>
        </div>
      </div>
    );
  }

  // Mandatory Authentication Gate: Must log in or register before accessing game
  if (!authUser) {
    return (
      <AuthScreen
        onLoginSuccess={applySignedInUser}
      />
    );
  }

  // Email Verification Gate: Block unverified password-registered email accounts
  const isPasswordAccount = Array.isArray(authUser.providerData)
    ? authUser.providerData.some((p) => p?.providerId === 'password')
    : false;
  if (authUser.email && !authUser.emailVerified && isPasswordAccount) {
    return (
      <EmailVerificationScreen
        user={authUser}
        onVerified={applySignedInUser}
        onLogout={() => void handleLogout()}
      />
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-[#1c1d25] flex justify-center font-sans overflow-hidden">
      <div className="w-full h-full flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {toast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[100] bg-[#1e202e]/95 backdrop-blur-md text-emerald-300 border border-emerald-500/30 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-top-3 duration-200 text-center max-w-[85%] pointer-events-none flex items-center gap-2">
            <span>{toast}</span>
          </div>
        )}
         <TopBar 
           coins={coins} 
           playerName={playerName} 
           onOpenProfile={() => setShowProfile(true)} 
           onOpenBank={() => setShowBank(true)}
           onOpenWealthChart={() => setShowWealthChart(true)}
           onOpenAuth={() => setShowAuthModal(true)}
           authUser={authUser}
           avatarContent={renderAvatarContent()}
         />
         
         {activeTab === 'role' && (
           <RoleTab
             onOpenShop={() => setShowShop(true)}
             onOpenBank={() => setShowBank(true)}
             onOpenWealthChart={() => setShowWealthChart(true)}
             onOpenHospital={() => setShowHospital(true)}
             onOpenGender={() => setShowGenderModal(true)}
             onOpenCalendar={() => setShowCalendar(true)}
             onNextMonth={handleNextMonth}
             onGoToBirthRegistration={() => setShowBirthModal(true)}
             equippedClothing={equippedClothing}
             coins={coins}
             health={health}
             gameYear={gameYear}
             gameMonth={gameMonth}
             isRegistered={isRegistered}
             gender={gender}
             age={currentAge}
             childrenCount={family.children.length}
           />
         )}
         {activeTab === 'bag' && (
           <FuncTab
             onOpenBank={() => setShowBank(true)}
             onOpenStock={() => setShowStock(true)}
             onOpenHospital={() => setShowHospital(true)}
             onOpenJob={() => setShowJob(true)}
             onOpenBirth={() => setShowBirthModal(true)}
             onOpenGender={() => setShowGenderModal(true)}
             onOpenHousing={() => setShowHousing(true)}
             onOpenVisa={() => setShowVisa(true)}
             onOpenImmigrate={() => setShowImmigrate(true)}
             onOpenMarriage={() => setShowMarriage(true)}
           />
         )}
         {activeTab === 'combat' && (
           <SimTab
             isRegistered={isRegistered}
             health={health}
             age={currentAge}
             playerName={playerName}
             gameYear={gameYear}
             gameMonth={gameMonth}
             onGoToBirthRegistration={() => setShowBirthModal(true)}
             onResetLife={handleResetLife}
           />
         )}
         {activeTab === 'log' && <LogTab />}
         {activeTab === 'map' && (
           <FamilyTab
             isRegistered={isRegistered}
             playerName={playerName}
             gender={gender}
             age={currentAge}
             playerOccupation={playerOccupation}
             gameYear={gameYear}
             gameMonth={gameMonth}
             coins={coins}
             setCoins={setCoins}
             setHealth={setHealth}
             family={family}
             setFamily={setFamily}
             onOpenMarriage={() => setShowMarriage(true)}
             onGoToBirthRegistration={() => setShowBirthModal(true)}
           />
         )}
         
         <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
         
         {/* Birth Registration Overlay */}
         {showBirthModal && (
           <BirthModal
             onClose={() => setShowBirthModal(false)}
             isRegistered={isRegistered}
             playerName={playerName}
             setPlayerName={setPlayerName}
             gender={gender}
             age={currentAge}
             gameYear={gameYear}
             gameMonth={gameMonth}
             coins={coins}
             setCoins={setCoins}
             health={health}
             setHealth={setHealth}
             onRegisterBirth={handleRegisterBirth}
             onOpenGender={() => {
               setShowBirthModal(false);
               setShowGenderModal(true);
             }}
             onOpenHousing={() => {
               setShowBirthModal(false);
               setShowHousing(true);
             }}
             onOpenVisa={() => {
               setShowBirthModal(false);
               setShowVisa(true);
             }}
           />
         )}

         {/* Calendar Overlay */}
         {showCalendar && (
           <CalendarModal
             onClose={() => setShowCalendar(false)}
             gameYear={gameYear}
             gameMonth={gameMonth}
             onNextMonth={handleNextMonth}
             coins={coins}
           />
         )}

         {/* Hospital Overlay */}
         {showHospital && (
           <HospitalModal
             onClose={() => setShowHospital(false)}
             coins={coins}
             setCoins={setCoins}
             health={health}
             setHealth={setHealth}
           />
         )}

         {/* Bank Overlay */}
         {showBank && (
           <BankModal
             onClose={() => setShowBank(false)}
             coins={coins}
             setCoins={setCoins}
             bankDeposit={bankDeposit}
             setBankDeposit={setBankDeposit}
             bankLoan={bankLoan}
             setBankLoan={setBankLoan}
             onOpenWealthChart={() => setShowWealthChart(true)}
           />
         )}

         {/* Stock Market Overlay */}
         {showStock && (
           <StockModal
             onClose={() => setShowStock(false)}
             coins={coins}
             setCoins={setCoins}
           />
         )}

         {/* Assets Interface & Wealth Allocation View */}
         {showWealthChart && (
           <WealthChartModal
             onClose={() => setShowWealthChart(false)}
             coins={coins}
             bankDeposit={bankDeposit}
             bankLoan={bankLoan}
             onOpenBank={() => {
               setShowWealthChart(false);
               setShowBank(true);
             }}
             onOpenStock={() => {
               setShowWealthChart(false);
               setShowStock(true);
             }}
             onOpenHousing={() => {
               setShowWealthChart(false);
               setShowHousing(true);
             }}
           />
         )}

         {/* Gender Rights & Identity Affirmation Overlay */}
         {showGenderModal && (
           <GenderRightsModal
             onClose={() => setShowGenderModal(false)}
             isRegistered={isRegistered}
             playerName={playerName}
             gender={gender}
             setGender={(newGender) => {
               setGender(newGender);
               try {
                 localStorage.setItem('amigo_gender', newGender);
               } catch (e) {}
             }}
             age={currentAge}
             coins={coins}
             setCoins={setCoins}
             gameYear={gameYear}
             onOpenBirth={() => {
               setShowGenderModal(false);
               setShowBirthModal(true);
             }}
           />
         )}

         {/* Profile Overlay */}
         {showProfile && (
           <ProfileModal
             onClose={() => setShowProfile(false)}
             playerName={playerName}
             setPlayerName={setPlayerName}
             coins={coins}
             setCoins={setCoins}
             equippedClothing={equippedClothing}
             onOpenAuth={() => {
               setShowProfile(false);
               setShowAuthModal(true);
             }}
             onLogout={handleLogout}
             onResetLife={handleResetLife}
             onSaveProgress={cloud.enabled ? cloud.saveNow : undefined}
             authUser={authUser}
             avatarSource={avatarSource}
             setAvatarSource={setAvatarSource}
             bilibiliAvatar={bilibiliAvatar}
             setBilibiliAvatar={setBilibiliAvatar}
             isAvatarModalOpen={isAvatarModalOpen}
             setIsAvatarModalOpen={setIsAvatarModalOpen}
             renderAvatarContent={renderAvatarContent}
             ownedClothes={ownedClothes}
             isRegistered={isRegistered}
             age={currentAge}
           />
         )}

         {/* Shop Overlay */}
         {showShop && (
           <ShopModal 
             onClose={() => setShowShop(false)} 
             coins={coins} 
             setCoins={setCoins} 
             ownedClothes={ownedClothes} 
             setOwnedClothes={setOwnedClothes} 
             equippedClothing={equippedClothing} 
             setEquippedClothing={setEquippedClothing}
             freeDrawUsed={freeDrawUsed}
             setFreeDrawUsed={setFreeDrawUsed}
           />
         )}

         {/* Job / Employment Overlay */}
         {showJob && (
           <JobModal
             onClose={() => setShowJob(false)}
             coins={coins}
             setCoins={setCoins}
           />
         )}

         {/* Housing & Real Estate Overlay */}
         {showHousing && (
           <HousingModal
             onClose={() => setShowHousing(false)}
             coins={coins}
             setCoins={setCoins}
             gameYear={gameYear}
             gameMonth={gameMonth}
             isRegistered={isRegistered}
             playerName={playerName}
             health={health}
             setHealth={setHealth}
             onOpenBirth={() => {
               setShowHousing(false);
               setShowBirthModal(true);
             }}
           />
         )}

                  {/* Visa & Travel Overlay */}
         {showVisa && (
           <VisaModal
             onClose={() => setShowVisa(false)}
             coins={coins}
             setCoins={setCoins}
             gameYear={gameYear}
             gameMonth={gameMonth}
             isRegistered={isRegistered}
             playerName={playerName}
             health={health}
             setHealth={setHealth}
             onOpenBirth={() => {
               setShowVisa(false);
               setShowBirthModal(true);
             }}
           />
         )}

         {/* Permanent Residency & Immigration Overlay */}
         {showImmigrate && (
           <ImmigrationModal
             onClose={() => setShowImmigrate(false)}
             coins={coins}
             setCoins={setCoins}
             gameYear={gameYear}
             gameMonth={gameMonth}
             isRegistered={isRegistered}
             playerName={playerName}
             health={health}
             setHealth={setHealth}
             onOpenBirth={() => {
               setShowImmigrate(false);
               setShowBirthModal(true);
             }}
           />
         )}

         {/* Marriage Registration Overlay */}
         {showMarriage && (
           <MarriageModal
             onClose={() => setShowMarriage(false)}
             isRegistered={isRegistered}
             isDeceased={isRegistered && health <= 0}
             playerName={playerName}
             age={currentAge}
             coins={coins}
             setCoins={setCoins}
             gameYear={gameYear}
             gameMonth={gameMonth}
             family={family}
             setFamily={setFamily}
             onOpenBirth={() => {
               setShowMarriage(false);
               setShowBirthModal(true);
             }}
             onOpenFamily={() => {
               setShowMarriage(false);
               setActiveTab('map');
             }}
           />
         )}

         {/* 云端存档冲突：本机与云端都有不同的进度 */}
         {cloud.conflict && (
           <div className="fixed inset-0 z-[120] bg-black/80 flex items-center justify-center p-4">
             <div className="bg-[#2d2f3d] border-4 border-black rounded-2xl p-4 max-w-sm w-full shadow-[0_8px_0_#000] space-y-3 text-white">
               <h3 className="font-black text-base text-center">☁️ 发现两份不同的存档</h3>
               <p className="text-xs text-gray-300 font-bold leading-relaxed text-center">
                 这台设备上的进度与云端存档不一致（可能在其他设备上玩过）。请选择要保留哪一份，另一份将被覆盖。
               </p>
               {cloud.conflict.remoteUpdatedAt && (
                 <p className="text-[11px] text-gray-400 font-bold text-center">
                   云端存档保存于 {new Date(cloud.conflict.remoteUpdatedAt).toLocaleString('zh-CN')}
                 </p>
               )}
               <div className="grid grid-cols-2 gap-2">
                 <button
                   onClick={() => void cloud.resolveConflict('cloud')}
                   className="bg-sky-400 hover:bg-sky-300 text-black text-xs font-black py-2.5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] cursor-pointer"
                 >
                   使用云端存档
                 </button>
                 <button
                   onClick={() => void cloud.resolveConflict('local')}
                   className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-black py-2.5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] cursor-pointer"
                 >
                   使用本机存档
                 </button>
               </div>
             </div>
           </div>
         )}

         {/* 开发测试工具：仅 npm run dev 下渲染，生产构建中被移除 */}
         {import.meta.env.DEV && <DevToolsPanel coins={coins} setCoins={setCoins} />}

         {/* Firebase Authentication Overlay */}
         {showAuthModal && (
           <AuthModal
             onClose={() => setShowAuthModal(false)}
             currentUser={authUser}
             onUserChange={(user) => setAuthUser(user)}
             setPlayerName={setPlayerName}
             onLogout={async () => {
               if (!(await handleLogout())) showToast('⚠️ 无法同步存档到云端，请检查网络后再退出');
             }}
           />
         )}
      </div>
    </div>
  );
}
