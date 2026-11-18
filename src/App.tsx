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
import { FamilyState, INITIAL_FAMILY_STATE, childLifespan, ageAt, generateSpouseCandidates, marry, MARRIAGE_FEE, MARRIAGE_MIN_AGE, SPOUSE_MEMBER_ID, canInteract, applyInteraction, GIFT_COST, getHeirlooms, addHeirloom, addChildForTesting, buildFamilyMembers, getOrigin, listHeirs, succeed, Gender, FamilyMemberView } from './lib/family';
import { randomTraits, affinityBonus, withBirthPrivilege, rollMaintenance, fertileMaxAge, MAINTENANCE_COST, FERTILITY_TRAITS, SIMPLE_MAINTENANCE_CHANCE, SIMPLE_MAINTENANCE_RESERVE, PLAYER_TRAITS_KEY, traitNames, traitById } from './lib/traits';
import { REPUTATION_KEY, REP, clampReputation, CHARITY_KEY, CHARITY_UNIT, charityRemaining } from './lib/reputation';
import { unlockAchievement, readAchievements, ACHIEVEMENTS, ACHIEVEMENT_EVENT, unlockAllForTesting, clearAchievementsForTesting, hasAllAchievements, CREDITS_SEEN_KEY, CREDITS_RANK_KEY, readGiftsGiven, recordGiftsGiven } from './lib/achievements';
import { CreditsRoll } from './components/CreditsRoll';
import { Appearance, APPEARANCE_KEY, randomAppearance, rollBeauty, applyBeauty, BEAUTY_TRAIT } from './lib/appearance';
import { currentSeason } from './data/seasons';
import { ensureSeason, seasonScore, completionMs, seasonAchievements, readSeasonSimPoints, addSeasonSimPoints, markSeasonLazy, isSeasonLazy, markSeasonCheat, isSeasonCheat } from './lib/season';
import { GOD_MODE_KEY, GOD_COINS } from './lib/testCode';
import { ANTIBODY_KEY, VACCINE_SUCCESS, vaccinesAvailable, immunityAfterRecovery, antibodyNames, diseaseById, DISEASES } from './lib/disease';
import { SimpleModeView, SimpleCard } from './components/SimpleModeView';
import { SIMPLE_MODE_KEY, autoOptionIndex, recommendJobs, recommendHome, shouldSuggestHome, buyRecommended, sellAll } from './lib/simpleMode';
import { GiftInventory, GIFT_INVENTORY_KEY, addGifts, giftCount, giftById, giftAffinityGain, removeGift } from './lib/gifts';
import { claimCompletionRank, submitSeasonScore } from './lib/authClient';
import { GUARDIANSHIP_KEY, Guardianship, takeCustody, ORPHANAGE_NAME, ADULT_AGE as GUARDIAN_ADULT_AGE } from './lib/guardianship';
import { rankFamilies, familyNetWorth } from './lib/familyRank';
import { rollClass, generateOrigin, classById, readChildJob, CHILD_JOB_KEY, CHILD_LABOR_MAX_AGE, CHILD_JOBS, PLAYER_LIFESPAN_KEY, rollPlayerLifespan } from './lib/lineage';
import { applySurname } from './lib/names';
import { Auction, AUCTION_KEY, TICKET_PRICE, generateAuction, raiseBid, buyoutLot, passLot, normalizeLot, isInvited, heirloomById, heirloomsValue } from './lib/heirlooms';
import { AuctionModal } from './components/AuctionModal';
import { diseaseInfo, DISEASE_KEY, ActiveDisease } from './lib/disease';
import { SuccessionModal } from './components/SuccessionModal';
import { SimEventInstance, eventDef, resolveOption, optionBlocked, SIM_EVENTS_KEY, SIM_SCORE_KEY, SIM_QUIET_KEY, readSimRecent, recordSimRecent } from './lib/simEvents';
import { addLifeLog, readLifeLog, clearLifeLog } from './lib/lifeLog';
import { isMinor } from './lib/monthly';
import { familyAllowance } from './lib/allowance';
import { advanceMonth, OwnedProperty } from './lib/monthTick';
import {
  buildDefaultAccounts,
  loadAccounts,
  saveAccounts as persistBankAccounts,
  formatRate,
} from './lib/bank';
import { loadMarket, saveMarket, findFinanceBackground, STOCK_KEYS, StockHolding, StockTradeLog } from './lib/stockMarket';
import { HospitalModal } from './components/HospitalModal';
import { JobModal, JOB_POSITIONS, readCurrentJobId, readJobHistoryIds, CURRENT_JOB_KEY, JOB_HISTORY_KEY } from './components/JobModal';
import { BirthModal } from './components/BirthModal';
import { WealthChartModal } from './components/WealthChartModal';
import { GenderRightsModal } from './components/GenderRightsModal';
import { HousingModal, HOUSING_MARKET_PROPERTIES } from './components/HousingModal';
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
const SIMPLE_SNOOZE_KEY = 'amigo_simple_snooze';
const USED_SIMPLE_KEY = 'amigo_used_simple_mode';
const MAINTENANCE_LOG_KEY = 'amigo_maintenance_log';
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
  const [showJob, setShowJob] = useState(false);
  const [showHousing, setShowHousing] = useState(false);
  const [showVisa, setShowVisa] = useState(false);
  const [showImmigrate, setShowImmigrate] = useState(false);
  const [showBirthModal, setShowBirthModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMarriage, setShowMarriage] = useState(false);
  const [showAuction, setShowAuction] = useState(false);

  // 礼物背包：宝箱抽得，在家族页送给家人（第 35 题）
  const [giftInventory, setGiftInventory] = useState<GiftInventory>(() => loadStored<GiftInventory>(GIFT_INVENTORY_KEY, {}));
  React.useEffect(() => saveStored(GIFT_INVENTORY_KEY, giftInventory), [giftInventory]);

  // 致谢名单：名次来自服务器（第几个集齐全部成就的账号）；未登录或请求失败时显示不带名次的祝贺语
  const [showCredits, setShowCredits] = useState(false);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [creditsRank, setCreditsRank] = useState<number | null>(() => {
    const n = Number(localStorage.getItem(CREDITS_RANK_KEY));
    return Number.isInteger(n) && n > 0 ? n : null;
  });
  const playCredits = () => {
    setShowCredits(true);
    try {
      localStorage.setItem(CREDITS_SEEN_KEY, 'true');
    } catch {}
    const cached = Number(localStorage.getItem(CREDITS_RANK_KEY));
    if (Number.isInteger(cached) && cached > 0) {
      setCreditsRank(cached);
      return;
    }
    if (isSeasonCheat()) {
      setCreditsRank(null);
      return;
    }
    setCreditsLoading(true);
    claimCompletionRank()
      .then((rank) => {
        setCreditsRank(rank);
        try {
          localStorage.setItem(CREDITS_RANK_KEY, String(rank));
        } catch {}
      })
      .catch(() => setCreditsRank(null))
      .finally(() => setCreditsLoading(false));
  };
  const autoPlayCreditsIfComplete = () => {
    if (hasAllAchievements() && localStorage.getItem(CREDITS_SEEN_KEY) !== 'true') playCredits();
  };

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
  const registeredName = (): string | null => {
    try {
      return localStorage.getItem('amigo_is_registered') === 'true' ? localStorage.getItem('amigo_player_name') : null;
    } catch (e) {
      return null;
    }
  };
  const [playerName, setPlayerName] = useState(() => registeredName() || readCachedUser()?.displayName || 'AmiGo·玩家');

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
    setFamily({ ...INITIAL_FAMILY_STATE, origin });
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

  /** 由子嗣或兄弟姐妹继承：资产保留，身份、年龄、家族世系换成继承人（undefined.md 第 21 题） */
  /** 主动传位（第 58 题）：主角年满 RETIRE_MIN_AGE 岁，可把家业传给年满 18 岁的在世子女 */
  const RETIRE_MIN_AGE = 50;
  const handleSuccession = (heirId: string, keepRecords: boolean, retire = false, coup = false) => {
    const members = buildFamilyMembers(family, {
      playerName,
      playerGender: gender,
      playerAge: currentAge,
      playerOccupation,
      gameYear,
      gameMonth,
    });
    const { state: nextFamily, heir } = succeed(
      family,
      members,
      heirId,
      { name: playerName, gender: (gender === '女' ? '女' : '男') as Gender, age: currentAge, occupation: playerOccupation, appearance: appearance ?? undefined, traits: playerTraits },
      gameYear,
      gameMonth,
      retire ? { lifespan: playerLifespan ?? currentAge + 20, coup } : undefined,
    );
    const newRegYear = gameYear - (heir.age - 8);
    // 第 53 题：子女、孙辈继承时带着自己的抗体；兄弟姐妹没有记录抗体
    const heirSource = family.children.find((c) => c.id === heirId) ?? family.children.flatMap((c) => c.kids ?? []).find((k) => k.id === heirId);
    setAntibodies(heirSource?.antibodies ?? []);
    setAppearance(heirSource?.appearance ?? randomAppearance(heir.gender));
    // 第 17 题：玩家可选择把前任主角的人生大事写入族谱
    const records = keepRecords
      ? readLifeLog()
          .filter((e) => e.category === '大事')
          .map((e) => ({ year: e.year, month: e.month, title: `${playerName}：${e.title}`, desc: e.desc }))
      : [];
    setFamily({ ...nextFamily, events: [...nextFamily.events.slice(0, -1), ...records, ...nextFamily.events.slice(-1)] });
    setSimEvents([]);
    setPlayerName(heir.name);
    setGender(heir.gender);
    setBirthRegisteredYear(newRegYear);
    setHealth(100);
    setDisease(null);
    try {
      localStorage.setItem('amigo_player_name', heir.name);
      localStorage.setItem('amigo_gender', heir.gender);
      localStorage.setItem('amigo_birth_registered_year', String(newRegYear));
      // 继承人的职业生涯从头开始
      localStorage.setItem(CURRENT_JOB_KEY, '');
      localStorage.setItem(JOB_HISTORY_KEY, '[]');
      localStorage.removeItem(CHILD_JOB_KEY);
      localStorage.removeItem('amigo_job_months_worked');
    } catch (e) {}
    setShowSuccession(false);
    setPlayerTraits(heir.traits && heir.traits.length > 0 ? heir.traits : randomTraits());
    setPlayerLifespan(null);
    setReputation((r) => clampReputation(r * REP.heirShare));
    unlockAchievement('succession');

    // 未成年继承（第 25 题）：现金与存款的一半交由监护人托管，成年后返还
    if (heir.age < GUARDIAN_ADULT_AGE) {
      const newMembers: FamilyMemberView[] = buildFamilyMembers(nextFamily, {
        playerName: heir.name,
        playerGender: heir.gender,
        playerAge: heir.age,
        playerOccupation: '',
        gameYear,
        gameMonth,
      });
      const spouseAlive = family.spouse ? newMembers.find((m) => m.name === family.spouse!.name && m.status !== '已故') : undefined;
      const eldest = newMembers
        .filter((m) => !m.isPlayer && m.status !== '已故' && m.age >= GUARDIAN_ADULT_AGE && ['parent', 'grandparent', 'uncle', 'granduncle', 'sibling'].includes(m.kin ?? ''))
        .sort((a, b) => b.age - a.age)[0];
      const guardianName = spouseAlive?.name ?? eldest?.name ?? ORPHANAGE_NAME;
      const custody = takeCustody(coins, loadAccounts(bankDeposit, bankLoan));
      setCoins(custody.cashLeft);
      const totals = persistBankAccounts(custody.accounts);
      setBankDeposit(totals.deposit);
      setBankLoan(totals.loan);
      setGuardianship({ guardianName, held: custody.held, phase: 'holding', supportPerMonth: 0, supportMonthsLeft: 0 });
      addLifeLog('财富', '监护托管', `${guardianName}代为管理一半家产 ${custody.held.toLocaleString()} ₽，成年后返还。`, { year: gameYear, month: gameMonth, age: heir.age });
    } else {
      setGuardianship(null);
    }
    // 继承人开始新的人生日志
    clearLifeLog();
    addLifeLog(
      '大事',
      '继承家业',
      coup ? `联合族人逼宫，迫使 ${playerName} 退位，接过了家业。` : retire ? `${playerName} 退居幕后，作为${heir.relation}接过了家业。` : `${playerName} 辞世后，作为${heir.relation}继承了家业。`,
      { year: gameYear, month: gameMonth, age: heir.age },
    );
    showToast(coup ? `⚔️ ${heir.relation} ${heir.name} 逼宫！${playerName} 被迫退位，由 ${heir.name}（${heir.age} 岁）当家` : retire ? `👑 ${playerName} 退居幕后，${heir.relation} ${heir.name}（${heir.age} 岁）接过家业` : `🕯️ ${heir.relation} ${heir.name}（${heir.age} 岁）继承了家业`);
  };
  const [pendingCoup, setPendingCoup] = useState<string | null>(null);
  React.useEffect(() => {
    if (!pendingCoup) return;
    const id = pendingCoup;
    setPendingCoup(null);
    if (isRegistered && health > 0 && family.children.some((c) => c.id === id)) {
      setFastForwardRemaining(0);
      handleSuccession(id, true, true, true);
    }
  }, [pendingCoup]);
  const handleRetire = (heirId: string): string | null => {
    if (!isRegistered || health <= 0) return '角色已故，请使用传承';
    if (currentAge < RETIRE_MIN_AGE) return `年满 ${RETIRE_MIN_AGE} 岁才能传位`;
    const child = family.children.find((c) => c.id === heirId);
    if (!child) return '只能传位给自己的子女';
    if (ageAt(child.birthYear, child.birthMonth, gameYear, gameMonth) < 18) return '子女年满 18 岁才能接班';
    handleSuccession(heirId, true, true);
    return null;
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

  // 疾病（undefined.md 第 20 题）
  const [disease, setDisease] = useState<ActiveDisease | null>(() => loadStored<ActiveDisease | null>(DISEASE_KEY, null));
  React.useEffect(() => saveStored(DISEASE_KEY, disease), [disease]);
  const currentDisease = diseaseInfo(disease);

  // 家族出身（旧存档为贵族 · 瓦伦丁家族）
  const familyOrigin = getOrigin(family);
  const familyClass = classById(familyOrigin.classId);
  const [showSuccession, setShowSuccession] = useState(false);

  // 特质（第 27 题）、声望（第 22 题）、未成年继承的监护（第 25 题）
  const [playerTraits, setPlayerTraits] = useState<string[]>(() => loadStored<string[]>(PLAYER_TRAITS_KEY, []));
  const [reputation, setReputation] = useState<number>(() => loadStored(REPUTATION_KEY, isRegistered ? familyClass.startReputation : 0));
  const [guardianship, setGuardianship] = useState<Guardianship | null>(() => loadStored<Guardianship | null>(GUARDIANSHIP_KEY, null));
  const [charity, setCharity] = useState<{ month: string; gained: number } | null>(() => loadStored(CHARITY_KEY, null));
  React.useEffect(() => saveStored(PLAYER_TRAITS_KEY, playerTraits), [playerTraits]);
  React.useEffect(() => saveStored(REPUTATION_KEY, reputation), [reputation]);
  React.useEffect(() => saveStored(GUARDIANSHIP_KEY, guardianship), [guardianship]);
  React.useEffect(() => saveStored(CHARITY_KEY, charity), [charity]);
  const changeReputation = (delta: number) => setReputation((r) => clampReputation(r + delta));

  /** 慈善捐款：每 10,000 ₽ 声望 +1，每个游戏月最多 +5 */
  const handleDonate = (amount: number): string => {
    if (!isRegistered) return '请先完成出生登记';
    if (coins < amount) return `现金不足（需 ${amount.toLocaleString()} ₽）`;
    const monthKey = `${gameYear}-${gameMonth}`;
    const gain = Math.min(Math.floor(amount / CHARITY_UNIT), charityRemaining(charity, monthKey));
    setCoins((c) => c - amount);
    changeReputation(gain);
    setCharity({ month: monthKey, gained: (charity?.month === monthKey ? charity.gained : 0) + gain });
    if (amount >= 100000) addLifeLog('大事', '慷慨解囊', `向慈善会捐款 ${amount.toLocaleString()} ₽。`);
    return gain > 0 ? `感谢你的善举！声望 +${gain}` : '已捐款（本月因慈善获得的声望已达上限）';
  };


  // 推演：待处理事件、推演积分、最近一次「本月无事发生」提示
  const [simEvents, setSimEvents] = useState<SimEventInstance[]>(() => loadStored<SimEventInstance[]>(SIM_EVENTS_KEY, []));
  const [simScore, setSimScore] = useState<number>(() => loadStored(SIM_SCORE_KEY, 0));
  const [simQuiet, setSimQuiet] = useState<string | null>(() => loadStored<string | null>(SIM_QUIET_KEY, null));
  React.useEffect(() => saveStored(SIM_EVENTS_KEY, simEvents), [simEvents]);
  React.useEffect(() => saveStored(SIM_SCORE_KEY, simScore), [simScore]);
  React.useEffect(() => saveStored(SIM_QUIET_KEY, simQuiet), [simQuiet]);

  // 拍卖会（每月随机开办，只在开办当月有效）
  const [auction, setAuction] = useState<Auction | null>(() => loadStored<Auction | null>(AUCTION_KEY, null));
  React.useEffect(() => saveStored(AUCTION_KEY, auction), [auction]);

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
  const [appearance, setAppearance] = useState<Appearance | null>(() => loadStored<Appearance | null>(APPEARANCE_KEY, null));
  React.useEffect(() => saveStored(APPEARANCE_KEY, appearance), [appearance]);
  React.useEffect(() => {
    if (isRegistered && !appearance) {
      const g = gender === '男' || gender === '女' ? gender : null;
      setAppearance(g && playerTraits.includes(BEAUTY_TRAIT) ? applyBeauty(playerTraits, true, randomAppearance(g), g).appearance : randomAppearance(g));
    }
  }, [isRegistered, appearance]);

  // 抗体（第 53 题）：接种疫苗或传染病痊愈后按概率获得，有抗体的病不会再患
  const [antibodies, setAntibodies] = useState<string[]>(() => loadStored<string[]>(ANTIBODY_KEY, []));
  React.useEffect(() => saveStored(ANTIBODY_KEY, antibodies), [antibodies]);
  /** 传染病痊愈后按概率获得抗体；返回是否获得 */
  const gainRecoveryImmunity = (diseaseId: string): boolean => {
    if (antibodies.includes(diseaseId) || !immunityAfterRecovery(diseaseId)) return false;
    setAntibodies((prev) => (prev.includes(diseaseId) ? prev : [...prev, diseaseId]));
    addLifeLog('健康', `获得${diseaseById(diseaseId)?.name ?? diseaseId}抗体`, '痊愈后身体产生了抗体，不会再患这种病。');
    return true;
  };
  /** 接种疫苗：给自己，或给所有在世、还没有抗体的子女；返回提示文字 */
  const handleVaccinate = (diseaseId: string, target: 'self' | 'children'): string => {
    const d = diseaseById(diseaseId);
    if (!d || d.vaccineYear === undefined || gameYear < d.vaccineYear) return '这种疫苗还没有问世';
    const cost = d.vaccineCost ?? 0;
    if (target === 'self') {
      if (antibodies.includes(d.id)) return `你已经有${d.name}抗体了`;
      if (coins < cost) return `钱不够，接种要 ${cost.toLocaleString()} ₽`;
      setCoins((prev) => prev - cost);
      if (Math.random() < VACCINE_SUCCESS) {
        setAntibodies((prev) => [...prev, d.id]);
        addLifeLog('健康', `接种${d.name}疫苗`, '接种成功，获得了抗体。');
        return `💉 接种${d.name}疫苗成功，获得抗体（-${cost.toLocaleString()} ₽）`;
      }
      addLifeLog('健康', `接种${d.name}疫苗`, '这次接种没有产生抗体。');
      return `💉 接种了${d.name}疫苗（-${cost.toLocaleString()} ₽），可惜没有产生抗体`;
    }
    const kids = family.children.filter((c) => ageAt(c.birthYear, c.birthMonth, gameYear, gameMonth) < childLifespan(c) && !(c.antibodies ?? []).includes(d.id));
    if (kids.length === 0) return `孩子们都已经有${d.name}抗体（或还没有孩子）`;
    const total = cost * kids.length;
    if (coins < total) return `钱不够，给 ${kids.length} 个孩子接种要 ${total.toLocaleString()} ₽`;
    setCoins((prev) => prev - total);
    let ok = 0;
    const ids = new Set(kids.map((k) => k.id));
    setFamily((prev) => ({
      ...prev,
      children: prev.children.map((c) => {
        if (!ids.has(c.id) || Math.random() >= VACCINE_SUCCESS) return c;
        ok++;
        return { ...c, antibodies: [...(c.antibodies ?? []), d.id] };
      }),
    }));
    addLifeLog('健康', `孩子们接种${d.name}疫苗`, `为 ${kids.length} 个孩子接种，花费 ${total.toLocaleString()} ₽。`);
    return `💉 为 ${kids.length} 个孩子接种了${d.name}疫苗（-${total.toLocaleString()} ₽）`;
  };
  const vaccineList = vaccinesAvailable(gameYear).map((d) => ({ id: d.id, name: d.name, cost: d.vaccineCost ?? 0, owned: antibodies.includes(d.id) }));

  // 主角寿命（第 51 题）：旧存档或传承后没有寿命时，按当前阶层与特质补抽
  const [playerLifespan, setPlayerLifespan] = useState<number | null>(() => loadStored<number | null>(PLAYER_LIFESPAN_KEY, null));
  React.useEffect(() => saveStored(PLAYER_LIFESPAN_KEY, playerLifespan), [playerLifespan]);
  React.useEffect(() => {
    if (isRegistered && playerLifespan === null) setPlayerLifespan(rollPlayerLifespan(familyClass.id, playerTraits));
  }, [isRegistered, playerLifespan, familyClass.id]);

  // ---------- 简洁模式（第 49 题）：面向 7 岁儿童的一屏界面，与完整模式共用存档 ----------
  const [simpleMode, setSimpleMode] = useState<boolean>(() => loadStored<boolean>(SIMPLE_MODE_KEY, false));
  React.useEffect(() => saveStored(SIMPLE_MODE_KEY, simpleMode), [simpleMode]);
  // ---------- 测试兑换码（第 57 题） ----------
  const [godMode, setGodMode] = useState<boolean>(() => loadStored<boolean>(GOD_MODE_KEY, false));
  React.useEffect(() => saveStored(GOD_MODE_KEY, godMode), [godMode]);
  // 无限金币、无限体力：低于上限就补满
  React.useEffect(() => {
    if (!godMode) return;
    if (coins < GOD_COINS) setCoins(GOD_COINS);
    if (isRegistered && health < 100) setHealth(100);
  }, [godMode, coins, health, isRegistered]);
  const activateGodMode = (): string => {
    setGodMode(true);
    setCoins((c) => Math.max(c, GOD_COINS));
    setHealth(100);
    setDisease(null);
    markSeasonCheat();
    // 立即告知服务器，否则玩家删掉本地的作弊标记后成绩仍会上榜
    if (cloud.enabled) {
      submitSeasonScore({ season: currentSeason().id, score: seasonScore(readAchievements(), readSeasonSimPoints(), familyClass.id), completedMs: null, lazy: isSeasonLazy(), cheat: true }).catch((err) =>
        console.warn('[赛季] 上报测试兑换码标记失败', err),
      );
    }
    const added = unlockAllForTesting();
    autoPlayCreditsIfComplete();
    return `🛠️ 测试兑换码生效：无限金币、无限体力、无限寿命，已解锁全部成就（新增 ${added} 项）。本赛季成绩不计入排行。`;
  };

  // ---------- 赛季（第 55 题） ----------
  const [seasonJoinedAt] = useState<number>(() => ensureSeason());
  const prevSimScoreRef = React.useRef(simScore);
  React.useEffect(() => {
    if (simScore > prevSimScoreRef.current) addSeasonSimPoints(simScore - prevSimScoreRef.current);
    prevSimScoreRef.current = simScore;
  }, [simScore]);
  React.useEffect(() => {
    if (simpleMode && isRegistered) markSeasonLazy();
  }, [simpleMode, isRegistered]);
  const seasonRecord = readAchievements();
  const seasonMine = {
    score: seasonScore(seasonRecord, readSeasonSimPoints(), familyClass.id),
    completedMs: completionMs(seasonRecord, seasonJoinedAt),
    lazy: isSeasonLazy(),
    cheat: isSeasonCheat(),
    achieved: seasonAchievements(seasonRecord).length,
    total: ACHIEVEMENTS.length,
  };
  // 已验证的邮箱账号：每次推进月份或成绩变化后上报（延迟 3 秒合并）；用过测试兑换码也照常上报并带上标记，由服务器排除
  React.useEffect(() => {
    if (!cloud.enabled || !isRegistered) return;
    const timer = setTimeout(() => {
      submitSeasonScore({ season: currentSeason().id, score: seasonMine.score, completedMs: seasonMine.completedMs, lazy: seasonMine.lazy, cheat: seasonMine.cheat }).catch((err) =>
        console.warn('[赛季] 上报成绩失败', err),
      );
    }, 3000);
    return () => clearTimeout(timer);
  }, [cloud.enabled, isRegistered, seasonMine.score, seasonMine.completedMs, seasonMine.lazy, seasonMine.cheat]);

  /** 这一世用过简洁模式：排行榜上标「偷懒」，重开人生后清除 */
  const [usedSimpleMode, setUsedSimpleMode] = useState<boolean>(() => loadStored<boolean>(USED_SIMPLE_KEY, false));
  React.useEffect(() => saveStored(USED_SIMPLE_KEY, usedSimpleMode), [usedSimpleMode]);
  React.useEffect(() => {
    if (simpleMode && isRegistered && !usedSimpleMode) setUsedSimpleMode(true);
  }, [simpleMode, isRegistered, usedSimpleMode]);
  /** 保养记录：对象（self / spouse / 子嗣 id）→ 最近一次保养的月份（年 × 12 + 月），每人每月最多一次 */
  const [maintenanceLog, setMaintenanceLog] = useState<Record<string, number>>(() => loadStored<Record<string, number>>(MAINTENANCE_LOG_KEY, {}));
  React.useEffect(() => saveStored(MAINTENANCE_LOG_KEY, maintenanceLog), [maintenanceLog]);
  /** 人生节点卡片「以后再说」：卡片类型 → 到哪个月（年 × 12 + 月）之前不再弹出 */
  const [simpleSnooze, setSimpleSnooze] = useState<Record<string, number>>(() => loadStored<Record<string, number>>(SIMPLE_SNOOZE_KEY, {}));
  React.useEffect(() => saveStored(SIMPLE_SNOOZE_KEY, simpleSnooze), [simpleSnooze]);
  const [simpleAutoNotes, setSimpleAutoNotes] = useState<string[]>([]);
  /** 最近一次月度结算的提示（渲染时从提示文字中取，避免在副作用里连锁更新状态） */
  const simpleMonthNotesRef = React.useRef<string[]>([]);
  if (toast && (toast.startsWith('🗓️') || toast.startsWith('⚠️ 时局剧变'))) simpleMonthNotesRef.current = toast.split('｜').map((t) => t.trim()).filter(Boolean);
  const simpleMonthNotes = simpleMonthNotesRef.current;
  const [simpleAdvancePending, setSimpleAdvancePending] = useState(false);
  const simpleMonthIndex = gameYear * 12 + gameMonth;

  // 自动处理完当月事务、界面用新状态重新渲染后，再推进月份（避免月度结算用到旧的健康、现金）
  React.useEffect(() => {
    if (!simpleAdvancePending) return;
    // 放到下一个宏任务执行，打断副作用里的同步连锁更新（连续推进时会触发 React 的嵌套更新上限警告）
    const timer = setTimeout(() => {
      setSimpleAdvancePending(false);
      handleNextMonth();
    }, 0);
    return () => clearTimeout(timer);
  }, [simpleAdvancePending]);

  /** 「过一个月」前自动处理：治病、补健康、推演事件（选稳妥）、给父母和配偶送礼 */
  const simpleAutoHandle = (): string[] => {
    const out: string[] = [];
    let cash = coins;
    let hp = health;
    const parentsPay = isMinor(currentAge) && familyClass.parentsPayMedical;
    if (currentDisease) {
      const cost = parentsPay ? 0 : currentDisease.cost;
      if (cash >= cost) {
        cash -= cost;
        setDisease(null);
        unlockAchievement('cured');
        addLifeLog('健康', `治愈${currentDisease.name}`, '简洁模式自动就医。');
        if (gainRecoveryImmunity(currentDisease.id)) out.push(`🛡️ 获得${currentDisease.name}抗体`);
        out.push(`🩺 治好了${currentDisease.name}${cost > 0 ? `（-${cost.toLocaleString()} ₽）` : '（爸妈付钱）'}`);
      } else {
        out.push(`🤒 钱不够，治不了${currentDisease.name}（要 ${cost.toLocaleString()} ₽）`);
      }
    }
    // 每月自动给自己接种一种还没有抗体的疫苗（钱够时）
    const nextVaccine = vaccinesAvailable(gameYear).find((d) => !antibodies.includes(d.id) && cash >= (d.vaccineCost ?? 0) + 5000);
    if (nextVaccine) {
      cash -= nextVaccine.vaccineCost ?? 0;
      if (Math.random() < VACCINE_SUCCESS) {
        setAntibodies((prev) => (prev.includes(nextVaccine.id) ? prev : [...prev, nextVaccine.id]));
        addLifeLog('健康', `接种${nextVaccine.name}疫苗`, '简洁模式自动接种，获得了抗体。');
        out.push(`💉 接种${nextVaccine.name}疫苗，获得抗体`);
      } else {
        out.push(`💉 接种了${nextVaccine.name}疫苗，这次没有产生抗体`);
      }
    }
    if (hp < 40) {
      const cost = parentsPay ? 0 : 1500;
      if (cash >= cost) {
        cash -= cost;
        hp = Math.min(100, hp + 30);
        out.push('💊 去医院打了营养针，健康 +30');
      }
    }
    let fam = family;
    let score = 0;
    const resolved: string[] = [];
    for (const inst of simEvents) {
      const def = eventDef(inst);
      if (!def) continue;
      const idx = autoOptionIndex(def, cash);
      if (idx === null) continue;
      const option = def.options[idx];
      const result = resolveOption(option);
      cash = Math.max(0, cash + result.coins);
      hp = godMode ? 100 : Math.max(0, Math.min(100, hp + result.health));
      score += result.score;
      resolved.push(inst.uid);
      addLifeLog('大事', def.headline, `${option.label}：${result.text}`);
      out.push(`📰 ${def.headline} → ${result.text}`);
      if (result.heirloom) {
        const h = heirloomById(result.heirloom);
        fam = addHeirloom(fam, { id: result.heirloom, source: def.title, year: gameYear, month: gameMonth, keeper: '当家人' });
        if (h) addLifeLog('大事', `获得传家宝：${h.name}`, h.desc);
      }
    }
    if (resolved.length > 0) {
      setSimEvents((prev) => prev.filter((e) => !resolved.includes(e.uid)));
      setSimScore((n) => n + score);
    }
    let inv = giftInventory;
    let given = 0;
    const members = buildFamilyMembers(fam, { playerName, playerGender: gender, playerAge: currentAge, playerOccupation, gameYear, gameMonth });
    const close = (m: FamilyMemberView) => m.kin === 'parent' || m.id === SPOUSE_MEMBER_ID;
    const targets = members
      .filter((m) => !m.isPlayer && m.status !== '已故')
      .sort((a, b) => Number(close(b)) - Number(close(a)) || a.affinity - b.affinity);
    for (const m of targets) {
      if (canInteract(fam, m, gameYear, gameMonth)) continue;
      const best = Object.keys(inv)
        .map((id) => giftById(id))
        .filter((g): g is NonNullable<typeof g> => !!g)
        .sort((a, b) => giftAffinityGain(b, m, fam.giftTastes) - giftAffinityGain(a, m, fam.giftTastes))[0];
      if (best) {
        inv = removeGift(inv, best.id) ?? inv;
        fam = applyInteraction(fam, m, 'gift', gameYear, gameMonth, affinityBonus(playerTraits), giftAffinityGain(best, m, fam.giftTastes));
        out.push(`🎁 送给${m.relation}「${best.name}」`);
      } else if (cash >= GIFT_COST + 2000) {
        cash -= GIFT_COST;
        fam = applyInteraction(fam, m, 'gift', gameYear, gameMonth, affinityBonus(playerTraits));
        out.push(`🎁 给${m.relation}买了礼物（-${GIFT_COST} ₽）`);
      } else continue;
      given++;
    }
    if (given > 0) {
      setGiftInventory(inv);
      recordGiftsGiven(given);
    }

    // 自动保养：自己、配偶、16 岁以上的子女与孙辈，每人每月一次，概率低于手动保养；至少保留一笔现金
    const monthKey = gameYear * 12 + gameMonth;
    const maintained: Record<string, number> = {};
    let maintainCount = 0;
    const canMaintain = (key: string, traits: string[]) =>
      (maintenanceLog[key] ?? 0) !== monthKey && FERTILITY_TRAITS.some((id) => !traits.includes(id)) && cash >= MAINTENANCE_COST + SIMPLE_MAINTENANCE_RESERVE;
    const doMaintain = (key: string, traits: string[], who: string): string[] => {
      cash -= MAINTENANCE_COST;
      maintained[key] = monthKey;
      maintainCount++;
      const r = rollMaintenance(traits, Math.random, SIMPLE_MAINTENANCE_CHANCE);
      if (r.gained) {
        const name = traitById(r.gained)?.name ?? r.gained;
        out.push(`✨ ${who}保养后获得了「${name}」`);
        addLifeLog('健康', `${who}保养获得「${name}」`, '简洁模式自动保养。');
      }
      return r.traits;
    };
    if (canMaintain('self', playerTraits)) {
      const t = doMaintain('self', playerTraits, '你');
      if (t !== playerTraits) setPlayerTraits(t);
    }
    if (fam.spouse && canMaintain('spouse', fam.spouse.traits ?? [])) {
      const t = doMaintain('spouse', fam.spouse.traits ?? [], fam.spouse.name);
      fam = { ...fam, spouse: { ...fam.spouse, traits: t } };
    }
    const aliveAdult = (c: Parameters<typeof childLifespan>[0]) => {
      const age = ageAt(c.birthYear, c.birthMonth, gameYear, gameMonth);
      return age >= 16 && age < childLifespan(c);
    };
    fam = {
      ...fam,
      children: fam.children.map((c) => {
        let child = c;
        if (aliveAdult(c) && canMaintain(c.id, c.traits ?? [])) child = { ...child, traits: doMaintain(c.id, c.traits ?? [], c.name) };
        const kids = (child.kids ?? []).map((k) => (aliveAdult(k) && canMaintain(k.id, k.traits ?? []) ? { ...k, traits: doMaintain(k.id, k.traits ?? [], k.name) } : k));
        return kids.some((k, i) => k !== (child.kids ?? [])[i]) ? { ...child, kids } : child;
      }),
    };
    if (maintainCount > 0) {
      out.push(`💆 为 ${maintainCount} 位家人做了保养（-${(maintainCount * MAINTENANCE_COST).toLocaleString()} ₽）`);
      setMaintenanceLog((prev) => ({ ...prev, ...maintained }));
    }
    if (fam !== family) setFamily(fam);
    setCoins(cash);
    setHealth(hp);
    if (hp <= 0) addLifeLog('大事', '辞世', `${playerName} 离开了人世，享年 ${currentAge} 岁。`);
    return out;
  };

  /** 已到本赛季的最后一个月（第 58 题） */
  const atSeasonEnd = currentSeason().endGameYear !== undefined && gameYear >= currentSeason().endGameYear! && gameMonth === 12;
  const handleSimpleNextMonth = () => {
    if (!isRegistered) return;
    if (atSeasonEnd) {
      setSimpleRemaining(0);
      handleNextMonth();
      return;
    }
    const notes = simpleAutoHandle();
    setSimpleAutoNotes(notes);
    simpleMonthNotesRef.current = [];
    setSimpleAdvancePending(true);
  };

  const simpleSpouseCandidates = React.useMemo(
    () => generateSpouseCandidates(currentAge, Math.random, 3, gender === '男' || gender === '女' ? (gender as Gender) : null),
    [gameYear, family.spouse?.name, gender],
  );

  const simpleCard = ((): SimpleCard | null => {
    if (!isRegistered) return null;
    const snoozed = (k: string) => (simpleSnooze[k] ?? 0) > simpleMonthIndex;
    if (health <= 0) {
      const heirs = listHeirs(buildFamilyMembers(family, { playerName, playerGender: gender, playerAge: currentAge, playerOccupation, gameYear, gameMonth }));
      return {
        kind: 'heir',
        emoji: '🕯️',
        question: `${playerName} 离开了我们`,
        hint: heirs.length > 0 ? '选一位家人继续这个家族的故事' : '家里没有可以继承的人了',
        choices: [
          ...heirs.map((h) => ({ id: h.id, title: `由 ${h.name} 继承`, detail: `${h.relation} · ${h.age} 岁` })),
          { id: 'restart', title: '重新出生', detail: '从头开始新的人生' },
        ],
      };
    }
    const hasJob = !!readCurrentJobId();
    const childJob = readChildJob();
    if (currentAge >= 16 && !hasJob && !childJob && !snoozed('job')) {
      return {
        kind: 'job',
        emoji: '💼',
        question: '要去工作吗？',
        hint: '有工作才能领俸禄，还能拿到月薪',
        laterLabel: '以后再说',
        choices: recommendJobs(JOB_POSITIONS, 3).map((j) => ({ id: j.id, title: j.title, detail: `${j.department} · 每月约 ${(j.dailySalary * 22).toLocaleString()} ₽` })),
      };
    }
    if (currentAge >= 8 && currentAge <= CHILD_LABOR_MAX_AGE && familyClass.childLabor && !childJob && !snoozed('child')) {
      return {
        kind: 'job',
        emoji: '🧹',
        question: '家里穷，要去打零工吗？',
        hint: '每月有工钱，但会累坏身体',
        laterLabel: '先不去',
        choices: [...CHILD_JOBS].sort((a, b) => a.healthCost - b.healthCost || b.salary - a.salary).slice(0, 3).map((j) => ({ id: `child:${j.id}`, title: j.title, detail: `每月 ${j.salary} ₽ · 健康 -${j.healthCost}` })),
      };
    }
    if (currentAge >= MARRIAGE_MIN_AGE && currentAge < 45 && !family.spouse && !snoozed('marriage')) {
      return {
        kind: 'marriage',
        emoji: '💍',
        question: '想结婚吗？',
        hint: `结婚要交 ${MARRIAGE_FEE.toLocaleString()} ₽ 登记费`,
        laterLabel: '以后再说',
        choices: simpleSpouseCandidates.map((c, i) => ({ id: String(i), title: c.name, detail: `${c.age} 岁 · ${c.occupation}${c.traits?.length ? ` · ${traitNames(c.traits).join('、')}` : ''}` })),
      };
    }
    const owned = (() => {
      try {
        const v = JSON.parse(localStorage.getItem('amigo_owned_properties') || '[]');
        return Array.isArray(v) ? v.length : 0;
      } catch {
        return 0;
      }
    })();
    const cheapest = Math.min(...HOUSING_MARKET_PROPERTIES.map((h) => h.price));
    if (shouldSuggestHome(currentAge, owned > 0, coins, cheapest) && !snoozed('home')) {
      const home = recommendHome(HOUSING_MARKET_PROPERTIES, coins);
      if (home) {
        return {
          kind: 'home',
          emoji: '🏠',
          question: '买一套自己的房子吗？',
          hint: '住得舒服，每个月都能恢复健康',
          laterLabel: '以后再说',
          choices: [{ id: home.id, title: home.title, detail: `${home.price.toLocaleString()} ₽ · 每月健康 +${home.comfortBonus}` }],
        };
      }
    }
    return null;
  })();

  const handleSimpleChoose = (card: SimpleCard, choiceId: string) => {
    if (card.kind === 'heir') {
      if (choiceId === 'restart') handleResetLife();
      else handleSuccession(choiceId, true);
      return;
    }
    if (card.kind === 'job') {
      if (choiceId.startsWith('child:')) {
        const j = CHILD_JOBS.find((x) => `child:${x.id}` === choiceId);
        if (!j) return;
        try {
          localStorage.setItem(CHILD_JOB_KEY, j.id);
        } catch (e) {}
        addLifeLog('事业', `开始做童工「${j.title}」`, j.desc);
        showToast(`🧹 开始做「${j.title}」，每月 ${j.salary} ₽`);
        setSimpleSnooze((s) => ({ ...s }));
        return;
      }
      const job = JOB_POSITIONS.find((x) => x.id === choiceId);
      if (!job) return;
      try {
        localStorage.setItem(CURRENT_JOB_KEY, job.id);
        const history = readJobHistoryIds();
        if (!history.includes(job.id)) localStorage.setItem(JOB_HISTORY_KEY, JSON.stringify([job.id, ...history]));
      } catch (e) {}
      addLifeLog('事业', `入职「${job.title}」`, `进入${job.department}任职，日薪 ${job.dailySalary} ₽。`);
      showToast(`💼 开始在「${job.department}」做${job.title}`);
      setSimpleSnooze((s) => ({ ...s }));
      return;
    }
    if (card.kind === 'marriage') {
      const c = simpleSpouseCandidates[Number(choiceId)];
      if (!c) return;
      if (coins < MARRIAGE_FEE) {
        showToast(`钱不够，结婚登记要 ${MARRIAGE_FEE.toLocaleString()} ₽`);
        return;
      }
      setCoins((prev) => prev - MARRIAGE_FEE);
      setFamily((prev) => marry(prev, c, gameYear, gameMonth));
      changeReputation(REP.marriage);
      addLifeLog('大事', `与 ${c.name} 结婚`, `${c.gender} · ${c.age} 岁 · ${c.occupation}，在帝国民政署登记结婚。`);
      showToast(`💍 你和 ${c.name} 结婚啦！`);
      return;
    }
    if (card.kind === 'home') {
      const home = HOUSING_MARKET_PROPERTIES.find((h) => h.id === choiceId);
      if (!home || coins < home.price) return;
      try {
        const props = JSON.parse(localStorage.getItem('amigo_owned_properties') || '[]');
        const list = Array.isArray(props) ? props : [];
        const item = {
          id: `owned_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          propertyId: home.id,
          title: home.title,
          district: home.district,
          category: home.category,
          purchasePrice: home.price,
          currentValue: home.price,
          rentPerMonth: home.rentPerMonth,
          renovationTier: home.renovationTier,
          isRentedOut: false,
          isPrimaryResidence: list.length === 0,
          purchaseYear: gameYear,
          purchaseMonth: gameMonth,
          totalRentCollected: 0,
        };
        localStorage.setItem('amigo_owned_properties', JSON.stringify([item, ...list]));
        if (list.length === 0) localStorage.removeItem('amigo_current_rental');
      } catch (e) {}
      setCoins((prev) => prev - home.price);
      addLifeLog('财富', `购入房产「${home.title}」`, `位于${home.district}，花费 ${home.price.toLocaleString()} ₽。`);
      unlockAchievement('home');
      showToast(`🏠 买下了「${home.title}」`);
    }
  };

  // 简洁模式连续推进（过半年、一年、十年）：遇到需要选择的卡片或角色去世时停下
  const [simpleRemaining, setSimpleRemaining] = useState(0);
  React.useEffect(() => {
    if (simpleRemaining <= 0 || simpleAdvancePending) return;
    if (!isRegistered || health <= 0 || simpleCard || atSeasonEnd) {
      setSimpleRemaining(0);
      return;
    }
    const timer = setTimeout(() => {
      handleSimpleNextMonth();
      setSimpleRemaining((n) => Math.max(0, n - 1));
    }, 0);
    return () => clearTimeout(timer);
  }, [simpleRemaining, simpleAdvancePending, gameYear, gameMonth, health]);

  // 开发测试工具：快进的「智能安排」。每一步要么替玩家做一个选择，要么推进一个月（避免同一步内状态互相覆盖）
  const [smartTick, setSmartTick] = useState(0);
  React.useEffect(() => {
    if (!smartFastForward || fastForwardRemaining <= 0 || simpleAdvancePending) return;
    if (!isRegistered || health <= 0) {
      setFastForwardRemaining(0);
      return;
    }
    const timer = setTimeout(() => {
      const card = simpleCard;
      if (card && card.kind !== 'heir') {
        let choice = card.choices[0]?.id;
        if (card.kind === 'marriage') {
          const idx = simpleSpouseCandidates.findIndex((c) => !(c.traits ?? []).includes('infertile'));
          choice = idx >= 0 ? String(idx) : undefined;
        }
        if (choice !== undefined && !(card.kind === 'marriage' && coins < MARRIAGE_FEE)) handleSimpleChoose(card, choice);
        else handleSimpleLater(card);
        setSmartTick((t) => t + 1);
        return;
      }
      handleSimpleNextMonth();
      setFastForwardRemaining((n) => Math.max(0, n - 1));
    }, 0);
    return () => clearTimeout(timer);
  }, [smartFastForward, fastForwardRemaining, simpleAdvancePending, smartTick, gameYear, gameMonth, health]);

  /** 保养（第 50 题）：有概率获得「精力旺盛」或「富养」，延长生育年龄 */
  const handleMaintenance = (target: 'self' | 'spouse'): string => {
    if (!isRegistered) return '请先完成出生登记';
    const spouse = family.spouse;
    if (target === 'spouse' && !spouse) return '还没有配偶';
    const current = target === 'self' ? playerTraits : spouse?.traits ?? [];
    if (FERTILITY_TRAITS.every((id) => current.includes(id))) return '已经同时拥有「精力旺盛」和「富养」，不需要再保养';
    if ((maintenanceLog[target] ?? 0) === gameYear * 12 + gameMonth) return `${target === 'self' ? '你' : spouse!.name}这个月已经保养过了，下个月再来吧`;
    if (coins < MAINTENANCE_COST) return `钱不够，保养一次要 ${MAINTENANCE_COST.toLocaleString()} ₽`;
    setCoins((prev) => prev - MAINTENANCE_COST);
    setMaintenanceLog((prev) => ({ ...prev, [target]: gameYear * 12 + gameMonth }));
    const who = target === 'self' ? '你' : spouse!.name;
    const r = rollMaintenance(current);
    if (!r.gained) {
      addLifeLog('健康', '保养调理', `为${who}做了一次保养，这次没有明显效果。`);
      return `💆 为${who}做了保养（-${MAINTENANCE_COST.toLocaleString()} ₽），这次没有明显效果`;
    }
    if (target === 'self') setPlayerTraits(r.traits);
    else setFamily((prev) => (prev.spouse ? { ...prev, spouse: { ...prev.spouse, traits: r.traits } } : prev));
    const name = traitById(r.gained)?.name ?? r.gained;
    addLifeLog('健康', `保养获得「${name}」`, `${who}通过保养获得了「${name}」，生育年龄上限延长。`);
    return `✨ ${who}获得了「${name}」！生育年龄上限延长`;
  };
  const fertilityText = isRegistered
    ? `你可以生孩子到 ${fertileMaxAge(gender, playerTraits)} 岁${family.spouse ? `，${family.spouse.name} 到 ${fertileMaxAge(family.spouse.gender, family.spouse.traits)} 岁` : ''}。保养有机会获得「精力旺盛」或「富养」，让这个年龄变大。`
    : '';

  const handleSimpleLater = (card: SimpleCard) => {
    const key = card.kind === 'job' && card.emoji === '🧹' ? 'child' : card.kind;
    setSimpleSnooze((s) => ({ ...s, [key]: simpleMonthIndex + 12 }));
  };

  const stockOpenedNow = localStorage.getItem(STOCK_KEYS.accountOpened) === 'true';
  const simpleStock = (() => {
    const market = loadMarket();
    const holdings = loadStored<StockHolding[]>(STOCK_KEYS.holdings, []);
    const value = holdings.reduce((sum, h) => sum + Math.round(h.shares * (market.stocks.find((x) => x.id === h.stockId)?.price ?? 0)), 0);
    return { market, holdings, value };
  })();
  const saveTrade = (holdings: StockHolding[], logs: StockTradeLog[]) => {
    try {
      localStorage.setItem(STOCK_KEYS.holdings, JSON.stringify(holdings));
      const prev = JSON.parse(localStorage.getItem(STOCK_KEYS.tradeLogs) || '[]');
      localStorage.setItem(STOCK_KEYS.tradeLogs, JSON.stringify([...logs, ...(Array.isArray(prev) ? prev : [])]));
    } catch (e) {}
  };
  const handleSimpleBuyStocks = () => {
    const r = buyRecommended(simpleStock.market.stocks, simpleStock.holdings, Math.floor(coins * 0.3), simpleStock.market.tradingDay);
    if (r.cashDelta === 0) {
      showToast('钱太少，一股也买不起');
      return;
    }
    saveTrade(r.holdings, r.logs);
    setCoins((prev) => prev + r.cashDelta);
    addLifeLog('财富', '一键买入股票', `${r.summary.join('、')}，共 ${(-r.cashDelta).toLocaleString()} ₽。`);
    showToast(`📈 买入 ${r.summary.join('、')}`);
  };
  const handleSimpleSellStocks = () => {
    const r = sellAll(simpleStock.market.stocks, simpleStock.holdings, simpleStock.market.tradingDay);
    if (r.cashDelta === 0) return;
    saveTrade(r.holdings, r.logs);
    setCoins((prev) => prev + r.cashDelta);
    addLifeLog('财富', '一键卖出全部股票', `收回 ${r.cashDelta.toLocaleString()} ₽，${r.profit >= 0 ? '赚了' : '亏了'} ${Math.abs(r.profit).toLocaleString()} ₽。`);
    showToast(`📉 全部卖出，${r.profit >= 0 ? '赚了' : '亏了'} ${Math.abs(r.profit).toLocaleString()} ₽`);
  };

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
  const familyWealth = familyNetWorth(coins, bankDeposit, bankLoan, guardianship?.held ?? 0, heirloomsValue(getHeirlooms(family)));
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
               if (coins < TICKET_PRICE) return `现金不足，门票需要 ${TICKET_PRICE.toLocaleString()} ₽`;
               setCoins((c) => c - TICKET_PRICE);
               setAuction({ ...auction, admitted: true });
               return `🎟️ 已购买门票（-${TICKET_PRICE.toLocaleString()} ₽），欢迎入场`;
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
               if (want > coins) return `现金不足（需要 ${want.toLocaleString()} ₽，现金 ${coins.toLocaleString()} ₽）`;
               const res = action.type === 'buyout' ? buyoutLot(lot) : raiseBid(lot, want);
               if (res.outcome === 'error') return res.error ?? '出价无效';
               update(res.lot);
               if (res.outcome === 'outbid') return `其他竞买人跟价到 ${(res.lot.currentPrice ?? 0).toLocaleString()} ₽，要继续加价吗？`;
               const paid = res.lot.paid ?? want;
               setCoins((c) => c - paid);
               setFamily((prev) => addHeirloom(prev, { id: lot.heirloomId, source: '拍卖会', year: gameYear, month: gameMonth, keeper: '当家人' }));
               addLifeLog('财富', `拍得传家宝：${h?.name ?? ''}`, `在北城拍卖会以 ${paid.toLocaleString()} ₽ ${action.type === 'buyout' ? '一口价买下' : '落槌拍得'}。`);
               return `🎉 ${action.type === 'buyout' ? '一口价' : '落槌！'}以 ${paid.toLocaleString()} ₽ 拍得「${h?.name ?? ''}」`;
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
               return `${a.total.toLocaleString()} ₽${detail ? `（${detail}）` : '（父母都已故）'}`;
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
