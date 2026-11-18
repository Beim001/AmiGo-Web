/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Newspaper, CheckCircle, Store, MonitorPlay, Zap, Car, Scale, Receipt, Building2, TrendingDown, HeartHandshake, GraduationCap, Megaphone, UserCog, Gamepad2, RefreshCw, Medal, ShieldAlert, BarChart2, ArrowUpRight, ArrowDownRight, Percent } from 'lucide-react';
import { RoleTab, CartoonCharacter } from './components/RoleTab';
import { CalendarModal } from './components/CalendarModal';
import { PRESET_AVATARS } from './components/AvatarSelectModal';
import { FunctTab as FuncTab } from './components/FunctTab';
import { SimTab } from './components/SimTab';
import { LogTab } from './components/LogTab';
import { FamilyTab } from './components/FamilyTab';
import { MarriageModal } from './components/MarriageModal';
import { INITIAL_FAMILY_STATE, FOUNDER_START_HEALTH, getHeirlooms, addHeirloom, addChildForTesting, buildFamilyMembers, getOrigin, listHeirs } from './lib/family';
import { randomTraits, withBirthPrivilege, MAINTENANCE_COST, traitNames } from './lib/traits';
import { clampReputation, CHARITY_UNIT, charityRemaining } from './lib/reputation';
import { unlockAchievement, readAchievements, ACHIEVEMENTS, ACHIEVEMENT_EVENT, unlockAllForTesting, clearAchievementsForTesting, readGiftsGiven, recordGiftsGiven } from './lib/achievements';
import { CreditsRoll } from './components/CreditsRoll';
import { Appearance, randomAppearance, rollBeauty, applyBeauty, BEAUTY_TRAIT } from './lib/appearance';
import { currentSeason, CURRENCY } from './data/seasons';
import { antibodyNames, DISEASES } from './lib/disease';
import { SimpleModeView } from './components/SimpleModeView';
import { SIMPLE_MODE_KEY } from './lib/simpleMode';
import { addGifts, giftCount } from './lib/gifts';
import { submitSeasonScore } from './lib/authClient';
import { rankFamilies, familyNetWorth } from './lib/familyRank';
import { rollClass, generateOrigin, classById, readChildJob, CHILD_JOB_KEY, rollPlayerLifespan } from './lib/lineage';
import { applySurname } from './lib/names';
import { TICKET_PRICE, generateAuction, raiseBid, buyoutLot, passLot, normalizeLot, isInvited, heirloomById, heirloomsValue } from './lib/heirlooms';
import { AuctionModal } from './components/AuctionModal';
import { diseaseInfo } from './lib/disease';
import { SuccessionModal } from './components/SuccessionModal';
import { eventDef, resolveOption, optionBlocked, readSimRecent, recordSimRecent } from './lib/simEvents';
import { addLifeLog, readLifeLog, clearLifeLog } from './lib/lifeLog';
import { isMinor } from './lib/monthly';
import { familyAllowance } from './lib/allowance';
import { advanceMonth, OwnedProperty } from './lib/monthTick';
import { kinIncomeTotal, layoffAllForTesting } from './lib/kinJobs';
import { useCredits } from './hooks/useCredits';
import { useAntibodies } from './hooks/useAntibodies';
import { useGodMode } from './hooks/useGodMode';
import { useSeason } from './hooks/useSeason';
import { useGameState, registeredName } from './hooks/useGameState';
import { useSuccession } from './hooks/useSuccession';
import { useSimpleMode } from './hooks/useSimpleMode';
import {
  buildDefaultAccounts,
  loadAccounts,
  saveAccounts as persistBankAccounts,
  formatRate,
} from './lib/bank';
import { loadMarket, saveMarket, findFinanceBackground } from './lib/stockMarket';
import { HospitalModal } from './components/HospitalModal';
import { WelfareModal } from './components/WelfareModal';
import { JobModal, JOB_POSITIONS, readCurrentJobId, readJobHistoryIds } from './components/JobModal';
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
import { TopBar } from './components/TopBar';
import { ShopModal } from './components/ShopModal';
import { BottomNav } from './components/BottomNav';
import { ProfileModal } from './components/ProfileModal';
import { BankModal } from './components/BankModal';
import { loadStored, saveStored } from './lib/storage';
import { CLOTHING } from './data/clothing';
import { GACHA_PITY_KEY, PITY_LIMITED } from './lib/gacha';
import { getMe, logout as logoutRequest, cacheUser, readCachedUser, isPasswordUser } from './lib/authClient';
import { useCloudSave, clearLocalGameData } from './lib/cloudSave';
import {
  isRealToySdkAvailable,
  AppUser,
} from './lib/bilibiliToy';
import { SENSITIVE_WORDS_CONFIG } from './utils/sensitiveWords';

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

// 重置人生时保留的存档键（账号级数据，不属于某一段人生）
// 赛季进度与成就一样跨人生保留（第 55 题）
const KEYS_KEPT_ON_RESET = new Set(['amigo_simple_mode', 'amigo_active_user', 'amigo_local_uid', 'amigo_redeemed_codes', 'amigo_achievements', 'amigo_credits_seen', 'amigo_credits_rank', 'amigo_gifts_given', 'amigo_season_id', 'amigo_season_joined_at', 'amigo_season_sim_points', 'amigo_season_lazy', 'amigo_season_cheat']);

export default function App() {
  const [activeTab, setActiveTab] = useState('role');
  const [showShop, setShowShop] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [showWealthChart, setShowWealthChart] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showHospital, setShowHospital] = useState(false);
  const [showWelfare, setShowWelfare] = useState(false);
  const [showJob, setShowJob] = useState(false);
  const [showHousing, setShowHousing] = useState(false);
  const [showVisa, setShowVisa] = useState(false);
  const [showImmigrate, setShowImmigrate] = useState(false);
  const [showBirthModal, setShowBirthModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMarriage, setShowMarriage] = useState(false);
  const [showAuction, setShowAuction] = useState(false);

  // 游戏进度状态统一由 useGameState 管理（初始化、自动存档）；setter 与 useState 的用法相同
  const game = useGameState();
  const { isRegistered, gender, birthRegisteredYear, playerName, coins, health, gameYear, gameMonth, equippedClothing, ownedClothes, freeDrawUsed, bankDeposit, bankLoan, family, disease, playerTraits, reputation, guardianship, charity, simEvents, simScore, simQuiet, auction, appearance, playerLifespan, giftInventory, antibodies, godMode } = game.state;
  const { setIsRegistered, setGender, setBirthRegisteredYear, setPlayerName, setCoins, setHealth, setGameYear, setGameMonth, setEquippedClothing, setOwnedClothes, setFreeDrawUsed, setBankDeposit, setBankLoan, setFamily, setDisease, setPlayerTraits, setReputation, setGuardianship, setCharity, setSimEvents, setSimScore, setSimQuiet, setAuction, setAppearance, setPlayerLifespan, setGiftInventory, setAntibodies, setGodMode } = game.setters;

  // 礼物背包：宝箱抽得，在家族页送给家人（第 35 题）

  const { showCredits, setShowCredits, creditsLoading, creditsRank, playCredits, autoPlayCreditsIfComplete } = useCredits();




  const [authUser, setAuthUser] = useState<AppUser | null>(() => (DEV_SKIP_AUTH ? DEV_MOCK_USER : readCachedUser()));
  const [authLoading, setAuthLoading] = useState(!DEV_SKIP_AUTH);

  const applySignedInUser = (user: AppUser) => {
    setAuthUser(user);
    cacheUser(user);
    // 已办理出生登记的角色名以存档为准，不被账号昵称覆盖
    if (!registeredName() && (user.displayName || user.email)) {
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




  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleNextMonth = () => {
    // 角色已故：不能继续推进时间（undefined.md 第 1 题）
    if (isRegistered && health <= 0) {
      showToast('💀 角色已故，无法继续推进时间。可在「推演」或个人中心「重置人生」');
      return;
    }

    let nextM = gameMonth + 1;
    let nextY = gameYear;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    // 第 58 题：本赛季只推演到卡罗尼亚帝国结束（1920 年）
    const seasonEnd = currentSeason().endGameYear;
    if (seasonEnd !== undefined && nextY > seasonEnd) {
      showToast(`📜 ${seasonEnd} 年，${currentSeason().endEvent ?? '本赛季结束'}。本赛季推演到此为止，下一赛季开放后继续。`);
      setFastForwardRemaining(0);
      return;
    }
    setGameMonth(nextM);
    setGameYear(nextY);
    try {
      localStorage.setItem('amigo_game_year', nextY.toString());
      localStorage.setItem('amigo_game_month', nextM.toString());
    } catch (e) {}

    // 结算本身是纯函数（lib/monthTick.ts）；这里读取存档中的输入，再把结果写回状态与存档
    const savedProps = loadStored<unknown>('amigo_owned_properties', null);
    const currentJobId = readCurrentJobId();
    const r = advanceMonth({
      year: gameYear,
      month: gameMonth,
      nextYear: nextY,
      nextMonth: nextM,
      isRegistered,
      birthRegisteredYear,
      currentAge,
      playerName,
      gender,
      playerOccupation,
      playerTraits,
      appearance,
      godMode,
      playerLifespan,
      coins,
      health,
      reputation,
      family,
      disease,
      antibodies,
      guardianship,
      hasAuction: !!auction,
      pendingSimEventIds: simEvents.map((e) => e.defId),
      simRecent: readSimRecent(),
      bankAccounts: loadAccounts(bankDeposit, bankLoan),
      market: loadMarket(),
      properties: Array.isArray(savedProps) ? (savedProps as OwnedProperty[]) : null,
      rental: loadStored<{ monthlyRent?: number; comfortBonus?: number } | null>('amigo_current_rental', null),
      job: (currentJobId ? JOB_POSITIONS.find((j) => j.id === currentJobId) : null) ?? null,
      childJob: readChildJob(),
    });

    r.logs.forEach((entry) => addLifeLog(...entry));
    if (r.properties) {
      try {
        localStorage.setItem('amigo_owned_properties', JSON.stringify(r.properties));
      } catch (e) {}
    }
    if (r.childJobEnded) {
      try {
        localStorage.removeItem(CHILD_JOB_KEY);
      } catch (e) {}
    }
    if (r.salary > 0) {
      try {
        const earned = Number(localStorage.getItem('amigo_job_earned_coins') || 0) + r.salary;
        const months = Number(localStorage.getItem('amigo_job_months_worked') || 0) + 1;
        localStorage.setItem('amigo_job_earned_coins', String(earned));
        localStorage.setItem('amigo_job_months_worked', String(months));
      } catch (e) {}
    }
    const bankTotals = persistBankAccounts(r.bankAccounts);
    setBankDeposit(bankTotals.deposit);
    setBankLoan(bankTotals.loan);
    setCoins((prev) => Math.max(0, prev + r.netChange));
    saveMarket(r.market);
    if (isRegistered) setDisease(r.disease);
    const newAntibody = r.newAntibody;
    if (newAntibody) setAntibodies((prev) => (prev.includes(newAntibody) ? prev : [...prev, newAntibody]));
    setHealth(r.health);
    if (r.pendingCoup) setPendingCoup(r.pendingCoup);
    if (r.guardianship !== undefined) setGuardianship(r.guardianship);
    if (r.family !== family) setFamily(r.family);
    if (r.familyCash !== 0) setCoins((prev) => Math.max(0, prev + r.familyCash));
    if (r.repDelta !== 0) changeReputation(r.repDelta);
    r.achievements.forEach((id) => unlockAchievement(id));
    const simEvent = r.simEvent;
    if (simEvent) {
      recordSimRecent(simEvent.defId, nextY, nextM);
      setSimEvents((prev) => [...prev, simEvent]);
      setSimQuiet(null);
    } else if (r.simQuiet) {
      setSimQuiet(r.simQuiet);
    }
    if (r.auction.action === 'open') setAuction(r.auction.next);
    else if (r.auction.action === 'close') setAuction(null);

    const mStr = nextM < 10 ? `0${nextM}` : `${nextM}`;
    const { notes, enteredEvent, ageNextMonth } = r;
    if (r.died) {
      setShowSuccession(true);
      showToast(`💀 ${nextY}.${mStr}：${playerName} 因健康耗尽离世，享年 ${ageNextMonth} 岁`);
    } else if (enteredEvent) {
      showToast(`⚠️ 时局剧变：${enteredEvent.title}！贷款利率上浮 ${formatRate(enteredEvent.loanRateDelta)}｜${notes.join('｜')}`);
    } else {
      showToast(`🗓️ 已步入 ${nextY}.${mStr}｜${notes.join('｜')}`);
    }
    // 等本月结算写入本地存档后再同步到云端
    setTimeout(() => void cloud.saveNow(), 1500);
  };

  // 年龄可小于 8 岁（年幼的子嗣继承家业时）
  const currentAge = isRegistered ? Math.max(0, 8 + gameYear - birthRegisteredYear) : 8;

  const handleRegisterBirth = (name: string, preferredSurname = '', chosenAppearance?: Appearance) => {
    const generatedGender = Math.random() > 0.5 ? '男' : '女';
    // 随机家族出身（undefined.md 第 18 题）：决定起始资产、父母家条件与家族成员
    // 第 56 题：家族沿用玩家填写的姓，留空则随机；皇族只有纳海王朝
    const cls = rollClass();
    const origin = generateOrigin(cls, Math.random, gameYear, preferredSurname);
    setFamily({ ...INITIAL_FAMILY_STATE, origin, startHealth: FOUNDER_START_HEALTH });
    // 第 73 题：初代当家人起始健康 50，之后每传一代叠加
    setHealth(FOUNDER_START_HEALTH);
    setCoins(cls.startCash);
    const bankTotals = persistBankAccounts(buildDefaultAccounts(cls.startDeposit, 0));
    setBankDeposit(bankTotals.deposit);
    setBankLoan(bankTotals.loan);
    setDisease(null);
    try {
      localStorage.removeItem(CHILD_JOB_KEY);
    } catch (e) {}
    setIsRegistered(true);
    setGender(generatedGender);
    setBirthRegisteredYear(gameYear);
    // 登记后把名字里的姓换成出身家族的姓
    const finalName = applySurname(name, origin.surname);
    setPlayerName(finalName);
    try {
      localStorage.setItem('amigo_is_registered', 'true');
      localStorage.setItem('amigo_gender', generatedGender);
      localStorage.setItem('amigo_birth_registered_year', gameYear.toString());
      localStorage.setItem('amigo_player_name', finalName);
    } catch (e) {}
    clearLifeLog();
    setSimEvents([]);
    // 第 61 题：捏脸结果；天生「倾国倾城」时改用预设外貌
    const beauty = applyBeauty(withBirthPrivilege(cls.id, randomTraits()), rollBeauty(), chosenAppearance ?? randomAppearance(generatedGender as '男' | '女'), generatedGender as '男' | '女');
    const traits = beauty.traits;
    setAppearance(beauty.appearance);
    setPlayerTraits(traits);
    setPlayerLifespan(rollPlayerLifespan(cls.id, traits));
    setAntibodies([]);
    setReputation(cls.startReputation);
    setGuardianship(null);
    addLifeLog('成长', '出生登记', `出生于${cls.label}之家（${origin.surname}家族），性别${generatedGender}，特质：${traitNames(traits).join('、')}。`, { year: gameYear, month: gameMonth, age: 8 });
    unlockAchievement('born');
    if (simpleMode) setShowBirthModal(false);
    showToast(`🎉 出生登记成功！${finalName}，出生在${cls.label}之家（${origin.surname}家族），性别：${generatedGender}，初始年龄：8岁`);
    return { gender: generatedGender, age: 8, classLabel: cls.label, surname: origin.surname, name: finalName };
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
    setDisease(null);
    setShowSuccession(false);
    setSimEvents([]);
    setSimScore(0);
    setPlayerTraits([]);
    setPlayerLifespan(null);
    setUsedSimpleMode(false);
    setMaintenanceLog({});
    setAntibodies([]);
    setGodMode(false);
    setAppearance(null);
    setReputation(0);
    setGuardianship(null);
    setCharity(null);
    setSimQuiet(null);
    clearLifeLog();

    // 4. 清理本地存储中本段人生的全部存档（amigo_* / aminoac_* 前缀），保留账号级数据
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('amigo_') || key.startsWith('aminoac_')) && !KEYS_KEPT_ON_RESET.has(key) && !key.startsWith('amigo_cloud_') && !key.startsWith('amigo_achievements_archive_')) {
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
    return <CartoonCharacter clothing={equippedClothing} appearance={appearance} age={isRegistered ? currentAge : 25} gender={gender} />;
  };




  // 核心状态持久化（刷新页面后保留）

  // 家族：好感度、婚姻、子嗣与家族大事

  // 云端存档（仅已验证的邮箱账号）
  const cloud = useCloudSave(authUser);

  // 疾病（undefined.md 第 20 题）
  const currentDisease = diseaseInfo(disease);

  // 家族出身（旧存档为贵族 · 瓦伦丁家族）
  const familyOrigin = getOrigin(family);
  const familyClass = classById(familyOrigin.classId);
  const [showSuccession, setShowSuccession] = useState(false);

  // 特质（第 27 题）、声望（第 22 题）、未成年继承的监护（第 25 题）
  const changeReputation = (delta: number) => setReputation((r) => clampReputation(r + delta));

  /** 慈善捐款：每 10,000 ₽ 声望 +1，每个游戏月最多 +5 */
  const handleDonate = (amount: number): string => {
    if (!isRegistered) return '请先完成出生登记';
    if (coins < amount) return `现金不足（需 ${amount.toLocaleString()} ${CURRENCY.symbol}）`;
    const monthKey = `${gameYear}-${gameMonth}`;
    const gain = Math.min(Math.floor(amount / CHARITY_UNIT), charityRemaining(charity, monthKey));
    setCoins((c) => c - amount);
    changeReputation(gain);
    setCharity({ month: monthKey, gained: (charity?.month === monthKey ? charity.gained : 0) + gain });
    if (amount >= 100000) addLifeLog('大事', '慷慨解囊', `向慈善会捐款 ${amount.toLocaleString()} ${CURRENCY.symbol}。`);
    return gain > 0 ? `感谢你的善举！声望 +${gain}` : '已捐款（本月因慈善获得的声望已达上限）';
  };


  // 推演：待处理事件、推演积分、最近一次「本月无事发生」提示

  // 拍卖会（每月随机开办，只在开办当月有效）

  /** 处理推演事件的选项（只结算金币与健康） */
  const handleSimResolve = (uid: string, optionIndex: number) => {
    const inst = simEvents.find((e) => e.uid === uid);
    const def = inst ? eventDef(inst) : undefined;
    const option = def?.options[optionIndex];
    if (!inst || !def || !option || optionBlocked(option, coins)) return null;
    const result = resolveOption(option);
    const newHealth = godMode ? 100 : Math.max(0, Math.min(100, health + result.health));
    setCoins((prev) => Math.max(0, prev + result.coins));
    setHealth(newHealth);
    setSimScore((n) => n + result.score);
    setSimEvents((prev) => prev.filter((e) => e.uid !== uid));
    addLifeLog('大事', def.headline, `${option.label}：${result.text}`);
    if (result.heirloom) {
      const h = heirloomById(result.heirloom);
      const SOURCE: Record<string, string> = { army: '参军', rescue: '见义勇为', antique: '旧货摊' };
      setFamily((prev) => addHeirloom(prev, { id: result.heirloom!, source: SOURCE[def.id] ?? def.title, year: gameYear, month: gameMonth, keeper: '当家人' }));
      if (h) addLifeLog('大事', `获得传家宝：${h.name}`, h.desc);
    }
    if (isRegistered && newHealth <= 0) {
      addLifeLog('大事', '辞世', `${playerName} 离开了人世，享年 ${currentAge} 岁。`);
      setShowSuccession(true);
    }
    return result;
  };

  // 开发测试工具：一键快进。每次只推进一个月，等界面用新状态重新渲染后再推进下一个月，
  // 保证每个月都按最新的现金、健康、家族等状态完整结算；角色去世时自动停止。
  const [fastForwardRemaining, setFastForwardRemaining] = useState(0);
  /** 快进时「智能安排」：自动看病、处理推演、送礼，并替你做求职、结婚、买房的选择 */
  const [smartFastForward, setSmartFastForward] = useState(false);
  React.useEffect(() => {
    if (fastForwardRemaining <= 0 || smartFastForward) return;
    if (isRegistered && health <= 0) {
      setFastForwardRemaining(0);
      return;
    }
    const timer = setTimeout(() => {
      handleNextMonth();
      setFastForwardRemaining((n) => Math.max(0, n - 1));
    }, 0);
    return () => clearTimeout(timer);
  }, [fastForwardRemaining, gameYear, gameMonth, health, smartFastForward]);

  const handleDevSetAge = (age: number) => {
    const regYear = gameYear - (age - 8);
    setBirthRegisteredYear(regYear);
    try {
      localStorage.setItem('amigo_birth_registered_year', String(regYear));
    } catch (e) {}
    showToast(`🛠️ 年龄已设为 ${age} 岁`);
  };

  const handleDevAddChild = (twins: boolean) => {
    const birth = addChildForTesting(family, gameYear, gameMonth, twins, Math.random, playerTraits);
    if (twins) unlockAchievement('twins');
    setFamily(birth.state);
    showToast(`🛠️ 新增子嗣：${birth.children.map((c) => c.name).join('、')}`);
  };
  const handleDevAddAdultChild = () => {
    const birth = addChildForTesting(family, gameYear - 30, gameMonth, false, Math.random, playerTraits);
    setFamily(birth.state);
    showToast(`🛠️ 新增 30 岁单身子女：${birth.children[0].name}`);
  };

  // 角色名持久化（改名、继承后刷新页面仍保留）
  React.useEffect(() => {
    if (isRegistered) {
      try {
        localStorage.setItem('amigo_player_name', playerName);
      } catch (e) {}
    }
  }, [isRegistered, playerName]);

  const playerOccupation = (() => {
    const id = readCurrentJobId();
    const job = id ? JOB_POSITIONS.find((j) => j.id === id) : null;
    if (job) return job.title;
    return currentAge < 18 ? '学堂学生' : '待业';
  })();

  // 父母给的零花（第 36 题）：按当前族谱中在世父母的职业收入、好感度计算
  const allowanceFor = (age: number) =>
    familyAllowance(family, { playerName, playerGender: gender, playerAge: currentAge, playerOccupation, gameYear, gameMonth }, age, familyClass.id);

  // 外貌（第 61 题）：出生登记时捏脸；旧存档没有外貌时随机生成
  React.useEffect(() => {
    if (isRegistered && !appearance) {
      const g = gender === '男' || gender === '女' ? gender : null;
      setAppearance(g && playerTraits.includes(BEAUTY_TRAIT) ? applyBeauty(playerTraits, true, randomAppearance(g), g).appearance : randomAppearance(g));
    }
  }, [isRegistered, appearance]);

  const { gainRecoveryImmunity, handleVaccinate, vaccineList } = useAntibodies({ antibodies, setAntibodies, coins, setCoins, gameYear, gameMonth, family, setFamily });

  // 主角寿命（第 51 题）：旧存档或传承后没有寿命时，按当前阶层与特质补抽
  React.useEffect(() => {
    if (isRegistered && playerLifespan === null) setPlayerLifespan(rollPlayerLifespan(familyClass.id, playerTraits));
  }, [isRegistered, playerLifespan, familyClass.id]);

  // ---------- 简洁模式（第 49 题）：面向 7 岁儿童的一屏界面，与完整模式共用存档 ----------
  const [simpleMode, setSimpleMode] = useState<boolean>(() => loadStored<boolean>(SIMPLE_MODE_KEY, false));
  React.useEffect(() => saveStored(SIMPLE_MODE_KEY, simpleMode), [simpleMode]);
  const { activateGodMode } = useGodMode({ godMode, setGodMode, coins, setCoins, health, setHealth, isRegistered, setDisease, cloud, familyClass, autoPlayCreditsIfComplete });

  const seasonMine = useSeason({ simScore, simpleMode, isRegistered, cloud, familyClass });

  const { handleSuccession, setPendingCoup, handleRetire } = useSuccession({ game, currentAge, playerOccupation, setShowSuccession, setFastForwardRemaining, showToast });
  const {
    usedSimpleMode,
    setUsedSimpleMode,
    setMaintenanceLog,
    simpleAutoNotes,
    simpleMonthNotes,
    handleSimpleNextMonth,
    simpleCard,
    handleSimpleChoose,
    simpleRemaining,
    setSimpleRemaining,
    handleMaintenance,
    fertilityText,
    handleSimpleLater,
    stockOpenedNow,
    simpleStock,
    handleSimpleBuyStocks,
    handleSimpleSellStocks,
  } = useSimpleMode({
    game,
    simpleMode,
    toast,
    showToast,
    handleNextMonth,
    currentAge,
    playerOccupation,
    currentDisease,
    familyClass,
    changeReputation,
    gainRecoveryImmunity,
    handleSuccession,
    handleResetLife,
    smartFastForward,
    fastForwardRemaining,
    setFastForwardRemaining,
  });

  // 成就「时装秀」：集齐商城内的全部服饰（抽卡或购买得到）
  React.useEffect(() => {
    if (CLOTHING.every((c) => ownedClothes.includes(c.id))) unlockAchievement('fashion_show');
  }, [ownedClothes]);

  // 成就：解锁时弹出提示；集齐全部成就时自动播放一次致谢名单；状态类成就随数据变化自动检查
  React.useEffect(() => {
    const onUnlock = (e: Event) => {
      const def = ACHIEVEMENTS.find((a) => a.id === (e as CustomEvent).detail);
      if (def) showToast(`🏆 成就达成：${def.title} —— ${def.desc}`);
      autoPlayCreditsIfComplete();
    };
    autoPlayCreditsIfComplete();
    window.addEventListener(ACHIEVEMENT_EVENT, onUnlock);
    return () => window.removeEventListener(ACHIEVEMENT_EVENT, onUnlock);
  }, []);
  React.useEffect(() => {
    if (!isRegistered) return;
    const lsArray = (key: string) => {
      try {
        const v = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(v) ? v : [];
      } catch (e) {
        return [];
      }
    };
    unlockAchievement('born');
    if (coins + bankDeposit >= 1_000_000) unlockAchievement('rich');
    if (coins + bankDeposit >= 100_000_000) unlockAchievement('tycoon');
    if (family.spouse) unlockAchievement('married');
    if (family.children.length >= 4) unlockAchievement('big_family');
    if (currentAge >= 80 && health > 0) unlockAchievement('eighty');
    if (simScore >= 100) unlockAchievement('sim_master');
    if (lsArray('amigo_owned_properties').length > 0) unlockAchievement('home');
    if (lsArray('amigo_permanent_residencies').length > 0) unlockAchievement('resident');
    if (lsArray('aminoac_travel_history').length >= 3) unlockAchievement('traveler');
    try {
      if (localStorage.getItem('amigo_stock_account_opened') === 'true') unlockAchievement('stock');
    } catch (e) {}
  }, [isRegistered, coins, bankDeposit, family, currentAge, health, simScore, gameYear, gameMonth]);

  // 家族排行榜：凝聚力（在世成员对当家人的平均好感）、财力（家族资产净值）、影响力（声望）
  const familyMembersView = buildFamilyMembers(family, { playerName, playerGender: gender, playerAge: currentAge, playerOccupation, gameYear, gameMonth });
  const livingRelatives = familyMembersView.filter((m) => !m.isPlayer && m.status !== '已故');
  const familyCohesion = livingRelatives.length > 0 ? Math.round(livingRelatives.reduce((sum, m) => sum + m.affinity, 0) / livingRelatives.length) : 50;
  const familyWealth = familyNetWorth(coins, bankDeposit, bankLoan, guardianship?.held ?? 0, heirloomsValue(getHeirlooms(family)), kinIncomeTotal(familyMembersView));
  const familyRanking = rankFamilies({
    surname: familyOrigin.surname,
    classLabel: familyOrigin.classLabel,
    cohesion: familyCohesion,
    wealth: familyWealth,
    influence: reputation,
  }, gameYear);

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
         {simpleMode ? (
           <SimpleModeView
             isRegistered={isRegistered}
             name={playerName}
             age={currentAge}
             health={health}
             coins={coins}
             deposit={bankDeposit}
             year={gameYear}
             month={gameMonth}
             familyLabel={isRegistered ? `${familyOrigin.surname}家 · ${familyClass.label}` : ''}
             diseaseName={currentDisease?.name ?? null}
             jobTitle={(() => {
               const id = readCurrentJobId();
               const j = id ? JOB_POSITIONS.find((x) => x.id === id) : null;
               return j ? j.title : readChildJob()?.title ?? null;
             })()}
             spouseName={family.spouse?.name ?? null}
             childrenCount={family.children.length}
             recent={readLifeLog().slice(-6).reverse().map((e) => ({ title: `${e.year}.${e.month} ${e.title}`, detail: e.desc }))}
             lastSummary={[...simpleAutoNotes, ...simpleMonthNotes]}
             card={simpleCard}
             onChoose={handleSimpleChoose}
             onLater={handleSimpleLater}
             onNextMonth={handleSimpleNextMonth}
             stockOpened={stockOpenedNow}
             stockValue={simpleStock.value}
             onBuyStocks={handleSimpleBuyStocks}
             onSellStocks={handleSimpleSellStocks}
             onRegister={() => setShowBirthModal(true)}
             onExit={() => {
               setSimpleRemaining(0);
               setSimpleMode(false);
             }}
             advanceRemaining={simpleRemaining}
             onAdvance={(n) => setSimpleRemaining(n)}
             onStopAdvance={() => setSimpleRemaining(0)}
             maintenanceCost={MAINTENANCE_COST}
             fertilityText={fertilityText}
             onMaintenance={() => showToast(handleMaintenance('self'))}
           />
         ) : (
         <>
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
             appearance={appearance}
             childrenCount={family.children.length}
             diseaseName={currentDisease?.name}
             onOpenSuccession={() => setShowSuccession(true)}
           />
         )}
         {activeTab === 'bag' && (
           <FuncTab
             onOpenBank={() => setShowBank(true)}
             onOpenStock={() => setShowStock(true)}
             onOpenHospital={() => setShowHospital(true)}
             onOpenJob={() => setShowJob(true)}
             onOpenWelfare={() => setShowWelfare(true)}
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
             onOpenSuccession={() => setShowSuccession(true)}
             events={simEvents}
             coins={coins}
             simScore={simScore}
             quietMessage={simQuiet}
             onResolve={handleSimResolve}
             auctionOpen={!!auction && auction.year === gameYear && auction.month === gameMonth}
             onOpenAuction={() => setShowAuction(true)}
           />
         )}
         {activeTab === 'log' && <LogTab isRegistered={isRegistered} />}
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
             playerTraits={playerTraits}
             reputation={reputation}
             ranking={familyRanking}
             cohesion={familyCohesion}
             wealth={familyWealth}
             guardianship={guardianship}
             heirlooms={getHeirlooms(family)}
             giftInventory={giftInventory}
             lazy={usedSimpleMode}
             playerAntibodies={antibodies}
             onRetireTo={handleRetire}
             playerAppearance={appearance}
             equippedClothing={equippedClothing}
             setGiftInventory={setGiftInventory}
             auctionOpen={!!auction && auction.year === gameYear && auction.month === gameMonth}
             onOpenAuction={() => setShowAuction(true)}
           />
         )}
         
         <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
         </>
         )}
         
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
             parentsPay={isRegistered && isMinor(currentAge) && familyClass.parentsPayMedical}
             disease={currentDisease}
             onCureDisease={() => {
               if (currentDisease && gainRecoveryImmunity(currentDisease.id)) showToast(`🛡️ 痊愈后获得了${currentDisease.name}抗体`);
               setDisease(null);
               unlockAchievement('cured');
             }}
             vaccines={vaccineList}
             antibodyText={antibodies.length ? antibodyNames(antibodies).join('、') : '暂无'}
             onVaccinate={handleVaccinate}
             onMaintenance={handleMaintenance}
             hasSpouse={!!family.spouse}
             fertilityText={fertilityText}
           />
         )}

         {/* 社会福利（教会救济） */}
         {showWelfare && (
           <WelfareModal
             onClose={() => setShowWelfare(false)}
             coins={coins}
             setCoins={setCoins}
             health={health}
             setHealth={setHealth}
             bankDeposit={bankDeposit}
             isRegistered={isRegistered}
             gameYear={gameYear}
             gameMonth={gameMonth}
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
             gameYear={gameYear}
           />
         )}

         {/* Stock Market Overlay */}
         {showStock && (
           <StockModal
             onClose={() => setShowStock(false)}
             coins={coins}
             setCoins={setCoins}
             financeBackground={findFinanceBackground(
               {
                 jobIds: readJobHistoryIds(),
                 playerName,
                 familyMembers: buildFamilyMembers(family, {
                   playerName,
                   playerGender: gender,
                   playerAge: currentAge,
                   playerOccupation,
                   gameYear,
                   gameMonth,
                 }).filter((m) => !m.isPlayer && m.status !== '已故'),
               },
               (id) => JOB_POSITIONS.find((j) => j.id === id)?.title,
             )}
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
             originLabel={isRegistered ? `${familyOrigin.classLabel} · ${familyOrigin.surname}家族` : '尚未出生登记'}
             simScore={simScore}
             reputation={reputation}
             playerTraits={playerTraits}
             onDonate={handleDonate}
             onPlayCredits={() => playCredits()}
             simpleMode={simpleMode}
             onToggleSimpleMode={() => {
               setSimpleMode((v) => !v);
               setShowProfile(false);
             }}
             lazy={usedSimpleMode}
             seasonMine={seasonMine}
             canRankSeason={cloud.enabled && !seasonMine.cheat}
             onRedeemTestCode={activateGodMode}
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
             setGiftInventory={setGiftInventory}
             appearance={appearance}
             setAppearance={setAppearance}
             playerAge={currentAge}
             playerGender={gender}
             isRegistered={isRegistered}
           />
         )}

         {/* Job / Employment Overlay */}
         {showJob && (
           <JobModal
             onClose={() => setShowJob(false)}
             coins={coins}
             setCoins={setCoins}
             age={currentAge}
             childLaborAllowed={isRegistered && familyClass.childLabor}
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
             playerGender={gender}
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
             classId={familyClass.id}
             onReputationChange={changeReputation}
           />
         )}

         {/* 致谢名单：集齐全部成就后播放 */}
         {showCredits && <CreditsRoll rank={creditsRank} loading={creditsLoading} onClose={() => setShowCredits(false)} />}

         {/* 拍卖会 */}
         {showAuction && auction && (
           <AuctionModal
             auction={auction}
             coins={coins}
             onClose={() => setShowAuction(false)}
             onBuyTicket={() => {
               if (auction.admitted) return '你已经可以入场了';
               if (coins < TICKET_PRICE) return `现金不足，门票需要 ${TICKET_PRICE.toLocaleString()} ${CURRENCY.symbol}`;
               setCoins((c) => c - TICKET_PRICE);
               setAuction({ ...auction, admitted: true });
               return `🎟️ 已购买门票（-${TICKET_PRICE.toLocaleString()} ${CURRENCY.symbol}），欢迎入场`;
             }}
             onAction={(i, action) => {
               const lot = auction.lots[i];
               if (!lot) return '拍品不存在';
               const h = heirloomById(lot.heirloomId);
               const update = (next: typeof lot) => setAuction({ ...auction, lots: auction.lots.map((l, idx) => (idx === i ? next : l)) });
               if (action.type === 'pass') {
                 update(passLot(lot));
                 return `你放弃了「${h?.name ?? '拍品'}」`;
               }
               const want = action.type === 'buyout' ? normalizeLot(lot).buyout : action.amount;
               if (!Number.isFinite(want) || want <= 0) return '请输入出价';
               if (want > coins) return `现金不足（需要 ${want.toLocaleString()} ${CURRENCY.symbol}，现金 ${coins.toLocaleString()} ${CURRENCY.symbol}）`;
               const res = action.type === 'buyout' ? buyoutLot(lot) : raiseBid(lot, want);
               if (res.outcome === 'error') return res.error ?? '出价无效';
               update(res.lot);
               if (res.outcome === 'outbid') return `其他竞买人跟价到 ${(res.lot.currentPrice ?? 0).toLocaleString()} ${CURRENCY.symbol}，要继续加价吗？`;
               const paid = res.lot.paid ?? want;
               setCoins((c) => c - paid);
               setFamily((prev) => addHeirloom(prev, { id: lot.heirloomId, source: '拍卖会', year: gameYear, month: gameMonth, keeper: '当家人' }));
               addLifeLog('财富', `拍得传家宝：${h?.name ?? ''}`, `在北城拍卖会以 ${paid.toLocaleString()} ${CURRENCY.symbol} ${action.type === 'buyout' ? '一口价买下' : '落槌拍得'}。`);
               return `🎉 ${action.type === 'buyout' ? '一口价' : '落槌！'}以 ${paid.toLocaleString()} ${CURRENCY.symbol} 拍得「${h?.name ?? ''}」`;
             }}
           />
         )}

         {/* 传承：角色去世后由子嗣/兄弟姐妹继承或重开 */}
         {showSuccession && isRegistered && health <= 0 && (
           <SuccessionModal
             deceasedName={playerName}
             deceasedAge={currentAge}
             heirs={listHeirs(
               buildFamilyMembers(family, {
                 playerName,
                 playerGender: gender,
                 playerAge: currentAge,
                 playerOccupation,
                 gameYear,
                 gameMonth,
               }),
             )}
             onChooseHeir={handleSuccession}
             majorRecordCount={readLifeLog().filter((e) => e.category === '大事').length}
             onRestart={() => {
               handleResetLife();
               setShowSuccession(false);
             }}
             onClose={() => setShowSuccession(false)}
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
         {import.meta.env.DEV && (
           <DevToolsPanel
             coins={coins}
             setCoins={setCoins}
             isRegistered={isRegistered}
             age={currentAge}
             gameYear={gameYear}
             gameMonth={gameMonth}
             fastForwardRemaining={fastForwardRemaining}
             onFastForward={(months) => setFastForwardRemaining(months)}
             onStopFastForward={() => setFastForwardRemaining(0)}
             onSetAge={handleDevSetAge}
             onAddChild={handleDevAddChild}
             onAddAdultChild={handleDevAddAdultChild}
             onKinLayoff={() => {
               setFamily((prev) => layoffAllForTesting(prev));
               showToast('🛠️ 所有在职家人都失业了');
             }}
             achievementProgress={[ACHIEVEMENTS.filter((a) => readAchievements()[a.id]).length, ACHIEVEMENTS.length]}
             onUnlockAllAchievements={() => {
               const added = unlockAllForTesting();
               showToast(`🛠️ 已解锁全部 ${ACHIEVEMENTS.length} 项成就（新增 ${added} 项）`);
               autoPlayCreditsIfComplete();
             }}
             simpleMode={simpleMode}
             onToggleSimpleMode={() => setSimpleMode((v) => !v)}
             antibodyText={antibodies.length ? antibodyNames(antibodies).join('、') : '暂无'}
             onRandomAppearance={() => {
               const g = gender === '男' || gender === '女' ? gender : null;
               setAppearance(randomAppearance(g));
               showToast('🛠️ 已随机外貌');
             }}
             onToggleBeauty={() => {
               const g = gender === '男' || gender === '女' ? gender : '女';
               const has = playerTraits.includes(BEAUTY_TRAIT);
               const r = applyBeauty(playerTraits, !has, randomAppearance(g), g);
               setPlayerTraits(r.traits);
               setAppearance(r.appearance);
               showToast(has ? '🛠️ 已去掉「倾国倾城」' : '🛠️ 已获得「倾国倾城」');
             }}
             onGrantAllAntibodies={() => {
               setAntibodies(DISEASES.filter((d) => d.infectious).map((d) => d.id));
               showToast('🛠️ 已获得全部传染病抗体');
             }}
             onClearAntibodies={() => {
               setAntibodies([]);
               showToast('🛠️ 已清空抗体');
             }}
             smartFastForward={smartFastForward}
             onToggleSmartFastForward={() => setSmartFastForward((v) => !v)}
             onOpenAuctionNow={() => {
               const next = generateAuction(gameYear, gameMonth, getHeirlooms(family).map((h) => h.id), isInvited(familyClass.id, reputation));
               if (!next) {
                 showToast('🛠️ 已拥有全部可拍卖的传家宝');
                 return;
               }
               setAuction(next);
               setShowAuction(true);
             }}
             giftTotal={giftCount(giftInventory)}
             giftsGiven={readGiftsGiven()}
             onAddGifts={(ids) => {
               setGiftInventory((prev) => addGifts(prev, ids));
               showToast(`🛠️ 已添加 ${ids.length} 件礼物`);
             }}
             onClearGifts={() => {
               setGiftInventory({});
               showToast('🛠️ 已清空礼物背包');
             }}
             onAddGiftsGiven={(n) => {
               const total = recordGiftsGiven(n);
               showToast(`🛠️ 累计赠礼次数：${total}`);
             }}
             allowancePreview={(() => {
               if (!isRegistered) return '未登记';
               const a = allowanceFor(currentAge);
               const detail = a.parts.map((p) => `${p.relation} ${p.reason ?? `+${p.amount.toLocaleString()}`}`).join('；');
               return `${a.total.toLocaleString()} ${CURRENCY.symbol}${detail ? `（${detail}）` : '（父母都已故）'}`;
             })()}
             onSetParentAffinity={(value) => {
               const parents = buildFamilyMembers(family, { playerName, playerGender: gender, playerAge: currentAge, playerOccupation, gameYear, gameMonth }).filter(
                 (m) => m.kin === 'parent' && !m.isPlayer && m.status !== '已故',
               );
               if (parents.length === 0) {
                 showToast('🛠️ 父母都已故');
                 return;
               }
               setFamily((prev) => ({ ...prev, affinity: { ...prev.affinity, ...Object.fromEntries(parents.map((m) => [m.id, value])) } }));
               showToast(`🛠️ 已把 ${parents.length} 位父母的好感设为 ${value}%`);
             }}
             onSetLimitedPity={() => {
               saveStored(GACHA_PITY_KEY, { sinceRare: 0, sinceLimited: PITY_LIMITED - 1 });
               setShowShop(false);
               showToast(`🛠️ 限定保底计数已设为 ${PITY_LIMITED - 1}，打开商城后下一抽必出限定`);
             }}
             onClearAchievements={() => {
               clearAchievementsForTesting();
               setShowCredits(false);
               showToast('🛠️ 已清空全部成就');
             }}
             onTestSeasonSubmit={
               cloud.enabled
                 ? (score, completedMs) => submitSeasonScore({ season: currentSeason().id, score, completedMs, lazy: seasonMine.lazy, cheat: seasonMine.cheat })
                 : undefined
             }
           />
         )}

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
