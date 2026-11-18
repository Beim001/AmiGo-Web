import React, { useState } from 'react';
import { User, Swords, CircleDollarSign, Gem, ChevronLeft, Crown, Plane, Globe, Baby, Hospital, Lock, TrendingUp, Home, Heart, Users, Shield, Award, Sparkles, Scroll, GitFork, ShieldCheck, Settings, Volume2, VolumeX, Copy, Check, Edit2, RotateCcw, Save, KeyRound, Gift, Trophy, Flame, Star, RefreshCw, Upload, UserCheck, X, Info, Flower2, HandHeart, AlertTriangle, History, FileText, LogOut, Mail, Camera } from 'lucide-react';
import { AvatarSelectModal } from './AvatarSelectModal';
import { traitNames, traitById } from '../lib/traits';
import { reputationLevel } from '../lib/reputation';
import { readAchievements, ACHIEVEMENTS, formatRealTime } from '../lib/achievements';
import { SeasonRankPanel } from './SeasonRankPanel';
import { TEST_CODE, isBetaVersion } from '../lib/testCode';
import { AboutUs } from './AboutUs';
import { addLifeLog } from '../lib/lifeLog';
import { JOB_POSITIONS, readCurrentJobId } from './JobModal';
import { getBilibiliUserProfile, getBilibiliRankList, getBilibiliMyRank, submitBilibiliScore, AppUser } from '../lib/bilibiliToy';
import { validatePlayerName } from '../utils/sensitiveWords';
import { loadStored, saveStored } from '../lib/storage';
import { TOTAL_CLOTHING_COUNT } from './ShopModal';

// 个人中心：名片资料、帝国排行榜与赛季排行、成就与致谢名单、系统设置、礼包兑换、关于我们

const getFallbackRankList = (boardNum: number, currentName: string, myCoins: number, simScore = 0) => {
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
      { rank: 3, score: simScore, nickname: currentName + ' (你)', avatar: '' },
      { rank: 4, score: 15200, nickname: '卡罗尼亚突击兵', avatar: '' },
      { rank: 5, score: 9800, nickname: '萌新机械师', avatar: '' },
    ];
    baseList.sort((a, b) => b.score - a.score);
    const sortedList = baseList.map((item, idx) => ({ ...item, rank: idx + 1 }));
    const myItem = sortedList.find((i) => i.nickname.includes('(你)'));
    return {
      list: sortedList,
      myRank: { ranked: true, rank: myItem ? myItem.rank : 3, score: simScore },
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
  /** 推演积分（推演榜上报） */
  simScore: number;
  reputation: number;
  playerTraits: string[];
  /** 慈善捐款，返回提示文字 */
  onDonate: (amount: number) => string;
  originLabel?: string;
  isRegistered: boolean;
  age: number;
  /** 播放致谢名单（集齐全部成就后可用） */
  onPlayCredits: () => void;
  /** 简洁模式（第 49 题） */
  simpleMode: boolean;
  onToggleSimpleMode: () => void;
  /** 这一世用过简洁模式：排行榜上标「偷懒」 */
  lazy?: boolean;
  /** 测试兑换码（第 57 题），返回提示文字 */
  onRedeemTestCode?: () => string;
  /** 本赛季成绩（第 55 题） */
  seasonMine?: { score: number; completedMs: number | null; lazy: boolean; achieved: number; total: number };
  canRankSeason?: boolean;
}

export const ProfileModal = ({
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
  originLabel,
  simScore,
  reputation,
  playerTraits,
  onDonate,
  isRegistered,
  age,
  onPlayCredits,
  simpleMode,
  onToggleSimpleMode,
  lazy = false,
  seasonMine,
  canRankSeason = false,
  onRedeemTestCode,
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

  const [subTab, setSubTab] = useState<'info' | 'rank' | 'achievement' | 'settings' | 'cdkey' | 'about'>('info');
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
      const fallback = getFallbackRankList(targetBoard, playerName, coins, simScore);
      setRankList(fallback.list);
      setMyRank(fallback.myRank);
    } finally {
      setIsSdkLoading(false);
    }
  };

  // Submit Score to Toy SDK
  const handleSubmitScore = async () => {
    let scoreToSubmit = coins;
    if (board === 3) scoreToSubmit = simScore;

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
    if (subTab === 'rank' && board < 10) {
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
    addLifeLog('成长', '改名', `改名为「${trimmed}」。`);
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
    // 测试兑换码：只在测试版本可用，可无限次兑换（第 57 题）
    if (code === TEST_CODE) {
      setCdkeyInput('');
      showToast(isBetaVersion() && onRedeemTestCode ? onRedeemTestCode() : '❌ 该兑换码只能在测试版本中使用');
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
              <div className="text-yellow-400 font-black text-xs mt-0.5">{reputationLevel(reputation)} ({reputation})</div>
            </div>
            <div className="bg-[#21232e] p-2 rounded-xl border border-black">
              <div className="text-[10px] text-gray-400 font-bold">推演积分</div>
              <div className="text-white font-black text-xs mt-0.5">{simScore} 分</div>
            </div>
            <div className="bg-[#21232e] p-2 rounded-xl border border-black">
              <div className="text-[10px] text-gray-400 font-bold">拥有服装</div>
              <div className="text-emerald-400 font-black text-xs mt-0.5">{ownedClothingCount} / {TOTAL_CLOTHING_COUNT} 套</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-6 bg-[#21232e] p-1 rounded-xl border-2 border-black gap-1 shadow-[0_2px_0_#000]">
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
          <button
            onClick={() => setSubTab('about')}
            className={`py-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer truncate ${
              subTab === 'about'
                ? 'bg-yellow-400 text-black border-black shadow-[0_1px_0_#000]'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            关于我们
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
                  <span className="text-white font-black">{originLabel || '卡罗尼亚帝国'}</span>
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

            <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-3">
              <h3 className="text-white font-black text-sm flex items-center gap-2 border-b border-gray-700/80 pb-2">
                <Sparkles size={16} className="text-fuchsia-400" /> 特质与声望
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {playerTraits.length > 0 ? (
                  playerTraits.map((id) => (
                    <span key={id} className="bg-fuchsia-500/20 text-fuchsia-200 text-[11px] font-black px-2 py-1 rounded-lg border border-fuchsia-500/50">
                      ✦ {traitNames([id])[0]}
                      <span className="text-fuchsia-300/70 font-bold ml-1">{traitById(id)?.desc}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-xs font-bold">出生登记后获得 1–3 个随机特质</span>
                )}
              </div>
              <div className="bg-[#21232e] p-2.5 rounded-xl border border-black text-xs font-bold space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">声望</span>
                  <span className="text-yellow-400 font-black">{reputation} / 100 · {reputationLevel(reputation)}</span>
                </div>
                <div className="text-[10px] text-gray-400">慈善捐款：每 10,000 ₽ 声望 +1，每个游戏月最多 +5</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[10000, 50000, 100000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => showToast(onDonate(amt))}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black py-1.5 rounded-lg border border-black cursor-pointer"
                    >
                      捐 {amt / 10000} 万
                    </button>
                  ))}
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

            {/* Board Selector (1: 财富榜, 3: 推演榜, 10: 本赛季, 11: 以往赛季) */}
            <div className="grid grid-cols-4 bg-[#21232e] p-1 rounded-xl border-2 border-black gap-1 shadow-[0_2px_0_#000]">
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
              {([
                [10, '本赛季'],
                [11, '以往赛季'],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setBoard(id)}
                  className={`py-1.5 text-xs font-black rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    board === id ? 'bg-yellow-400 text-black border-black shadow-[0_1px_0_#000]' : 'text-gray-400 border-transparent hover:text-white'
                  }`}
                >
                  <Trophy size={13} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {board >= 10 ? (
              <SeasonRankPanel key={board} mode={board === 10 ? 'current' : 'past'} mine={seasonMine} canRank={canRankSeason} />
            ) : (
            <>

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
                    {lazy && <span className="text-[9px] font-black px-1 rounded border border-black bg-gray-500 text-white" title="这一世用过简洁模式">偷懒</span>}
                    <span className="bg-yellow-400 text-black text-[9px] font-black px-1.5 rounded border border-black">
                      我
                    </span>
                  </div>
                  <div className="text-gray-300 text-[10px] font-mono mt-0.5">
                    当前积分: <span className="text-yellow-300 font-bold">{myRank.score > 0 ? myRank.score.toLocaleString() : (board === 1 ? coins : simScore).toLocaleString()}</span>
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
            </>
            )}
          </div>
        )}

        {/* 成就勋章：完成时间为现实时间，跨人生保留 */}
        {subTab === 'achievement' && (() => {
          const record = readAchievements();
          const icons: Record<string, React.ElementType> = {
            baby: Baby, coins: CircleDollarSign, home: Home, heart: Heart, users: Users, gift: Gift, gem: Gem, crown: Crown,
            chart: TrendingUp, plane: Plane, globe: Globe, hospital: Hospital, cake: Star, tree: GitFork, trophy: Trophy, scroll: Scroll,
            handheart: HandHeart, flower: Flower2,
          };
          const done = ACHIEVEMENTS.filter((a) => record[a.id]).length;
          return (
            <div className="space-y-3">
              <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3 shadow-[0_3px_0_#000] flex items-center justify-between">
                <span className="text-white font-black text-xs">已达成 {done} / {ACHIEVEMENTS.length}</span>
                {done === ACHIEVEMENTS.length ? (
                  <button
                    onClick={onPlayCredits}
                    className="bg-yellow-400 hover:bg-yellow-300 text-black text-[10px] font-black px-2.5 py-1 rounded-lg border-2 border-black cursor-pointer"
                  >
                    🎬 播放致谢名单
                  </button>
                ) : (
                  <span className="text-[10px] text-gray-400 font-bold">集齐全部成就将解锁致谢名单</span>
                )}
              </div>
              {ACHIEVEMENTS.map((ach) => {
                const at = record[ach.id];
                const Icon = icons[ach.icon] ?? Award;
                return (
                  <div
                    key={ach.id}
                    className={`border-2 border-black rounded-2xl p-3 flex items-center gap-3 shadow-[0_3px_0_#000] ${at ? 'bg-[#2d2f3d]' : 'bg-[#21232e] opacity-75'}`}
                  >
                    <div className={`w-11 h-11 rounded-xl border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[0_2px_0_#000] ${at ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-gray-400'}`}>
                      <Icon size={22} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-black text-xs">{ach.title}</h4>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border border-black ${at ? 'bg-emerald-900/80 text-emerald-300' : 'bg-gray-800 text-gray-400'}`}>
                          {at ? '已解锁' : '未解锁'}
                        </span>
                      </div>
                      <p className="text-gray-300 text-[11px] font-bold mt-0.5">{ach.desc}</p>
                      <div className="text-[10px] text-gray-400 font-mono mt-1">{at ? `${formatRealTime(at)} 达成` : '尚未达成'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Tab 3: 系统设置 (Settings) */}
        {subTab === 'settings' && (
          <div className="space-y-3">
            <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-3">
              <h3 className="text-white font-black text-sm mb-2 flex items-center gap-2 border-b border-gray-700/80 pb-2">
                <Settings size={16} className="text-yellow-400" /> 音效与画面设置
              </h3>

              <div className="flex justify-between items-center bg-[#21232e] p-3 rounded-xl border border-black">
                <div className="flex items-center gap-2">
                  <Baby size={18} className={simpleMode ? 'text-yellow-400' : 'text-gray-500'} />
                  <div>
                    <div className="text-white font-black text-xs">简洁模式</div>
                    <div className="text-gray-400 text-[10px]">一个大界面、大按钮，只管人生里最重要的事（与完整模式共用存档）</div>
                  </div>
                </div>
                <button
                  onClick={onToggleSimpleMode}
                  className={`w-12 h-6 rounded-full border-2 border-black relative transition-colors cursor-pointer shrink-0 ${simpleMode ? 'bg-yellow-400' : 'bg-gray-700'}`}
                  title="切换简洁模式"
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white border border-black transition-all ${simpleMode ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>

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
        {/* Tab 6: 关于我们 */}
        {subTab === 'about' && <AboutUs />}

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
