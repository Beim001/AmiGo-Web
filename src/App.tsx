/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Newspaper, CheckCircle, Store, MonitorPlay, Zap, Car, Scale, Receipt, Building2, TrendingDown, HeartHandshake, GraduationCap, Megaphone, UserCog, Gamepad2, Medal, ShieldAlert, BarChart2, ArrowUpRight, ArrowDownRight, Percent } from 'lucide-react';
import { CartoonCharacter } from './components/RoleTab';
import { PRESET_AVATARS } from './components/AvatarSelectModal';
import { INITIAL_FAMILY_STATE, FOUNDER_START_HEALTH, getHeirlooms, addHeirloom, addChildForTesting, buildFamilyMembers, getOrigin, listHeirs } from './lib/family';
import { randomTraits, withBirthPrivilege, traitNames } from './lib/traits';
import { clampReputation, CHARITY_UNIT, charityRemaining } from './lib/reputation';
import { unlockAchievement, readAchievements, ACHIEVEMENTS, earnsNeet, ACHIEVEMENT_EVENT, unlockAllForTesting, clearAchievementsForTesting, readGiftsGiven, recordGiftsGiven } from './lib/achievements';
import { CreditsRoll } from './components/CreditsRoll';
import { Appearance, randomAppearance, rollBeauty, applyBeauty, BEAUTY_TRAIT } from './lib/appearance';
import { currentSeason, CURRENCY } from './data/seasons';
import { antibodyNames, DISEASES } from './lib/disease';
import { SIMPLE_MODE_KEY } from './lib/simpleMode';
import { addGifts, giftCount } from './lib/gifts';
import { submitSeasonScore } from './lib/authClient';
import { rankFamilies, familyNetWorth } from './lib/familyRank';
import { rollClass, generateOrigin, classById, CHILD_JOB_KEY, rollPlayerLifespan, idleOccupation } from './lib/lineage';
import { applySurname } from './lib/names';
import { generateAuction, isInvited, heirloomById, heirloomsValue } from './lib/heirlooms';
import { diseaseInfo } from './lib/disease';
import { SuccessionModal } from './components/SuccessionModal';
import { eventDef, resolveOption, optionBlocked } from './lib/simEvents';
import { addLifeLog, readLifeLog, clearLifeLog } from './lib/lifeLog';
import { LAST_WORK_MONTH_KEY } from './lib/monthly';
import { familyAllowance } from './lib/allowance';
import { kinIncomeTotal, layoffAllForTesting } from './lib/kinJobs';
import { useCredits } from './hooks/useCredits';
import { useAntibodies } from './hooks/useAntibodies';
import { useGodMode } from './hooks/useGodMode';
import { useSeason } from './hooks/useSeason';
import { useGameState, registeredName } from './hooks/useGameState';
import { useSuccession } from './hooks/useSuccession';
import { useSimpleMode } from './hooks/useSimpleMode';
import { useOverlays } from './hooks/useOverlays';
import { useAuth } from './hooks/useAuth';
import { AuthGate } from './components/AuthGate';
import { GameWorkspace } from './components/GameWorkspace';
import { useMonthAdvance } from './hooks/useMonthAdvance';
import { OverlayHost } from './components/OverlayHost';
import {
  buildDefaultAccounts,
  saveAccounts as persistBankAccounts,
} from './lib/bank';
import { CLOTHING_COUPON_KEY } from './lib/clothingCoupon';
import { addCase, appealCase, loadCases, saveCases, suitCase } from './lib/court';
import { JAIL_REPUTATION, savePrison, sentenceTo, isInPrison } from './lib/prison';
import { JOB_POSITIONS, readCurrentJobId, CURRENT_JOB_KEY } from './components/JobModal';
import { DevToolsPanel } from './components/DevToolsPanel';
import { loadStored, saveStored } from './lib/storage';
import { CLOTHING } from './data/clothing';
import { GACHA_PITY_KEY, PITY_LIMITED } from './lib/gacha';
import { useCloudSave } from './lib/cloudSave';
import {
  isRealToySdkAvailable,
} from './lib/bilibiliToy';
import { SENSITIVE_WORDS_CONFIG } from './utils/sensitiveWords';
import { useTranslation } from 'react-i18next';

// 重置人生时保留的存档键（账号级数据，不属于某一段人生）
// 赛季进度与成就一样跨人生保留（第 55 题）；服饰与服饰 7 折券属于账号，重置人生不清空
const KEYS_KEPT_ON_RESET = new Set(['amigo_owned_clothes', 'amigo_equipped_clothing', CLOTHING_COUPON_KEY, 'amigo_simple_mode', 'amigo_active_user', 'amigo_local_uid', 'amigo_redeemed_codes', 'amigo_achievements', 'amigo_credits_seen', 'amigo_credits_rank', 'amigo_gifts_given', 'amigo_season_id', 'amigo_season_joined_at', 'amigo_season_sim_points', 'amigo_season_lazy', 'amigo_season_cheat']);

export default function App() {
  const { t, i18n } = useTranslation('app');
  const [activeTab, setActiveTab] = useState('role');
  // 全屏弹窗按打开顺序叠放（见 useOverlays）
  const overlays = useOverlays();

  // 游戏进度状态统一由 useGameState 管理（初始化、自动存档）；setter 与 useState 的用法相同
  const game = useGameState();
  const { isRegistered, gender, birthRegisteredYear, playerName, coins, health, gameYear, gameMonth, equippedClothing, ownedClothes, bankDeposit, bankLoan, family, disease, playerTraits, reputation, guardianship, charity, simEvents, simScore, appearance, playerLifespan, giftInventory, antibodies, godMode } = game.state;
  const { setIsRegistered, setGender, setBirthRegisteredYear, setPlayerName, setCoins, setHealth, setGameYear, setGameMonth, setFreeDrawUsed, setBankDeposit, setBankLoan, setFamily, setDisease, setPlayerTraits, setReputation, setGuardianship, setCharity, setSimEvents, setSimScore, setSimQuiet, setAuction, setAppearance, setPlayerLifespan, setGiftInventory, setAntibodies, setGodMode } = game.setters;

  // 礼物背包：宝箱抽得，在家族页送给家人（第 35 题）

  const { showCredits, setShowCredits, creditsLoading, creditsRank, playCredits, autoPlayCreditsIfComplete } = useCredits();




  const { authUser, setAuthUser, authLoading, applySignedInUser, logout } = useAuth((user) => {
    // 已办理出生登记的角色名以存档为准，不被账号昵称覆盖
    if (!registeredName() && (user.displayName || user.email)) {
      setPlayerName(user.displayName || user.email?.split('@')[0] || t('defaultPlayerName'));
    }
  });

  /** 退出登录。邮箱账号会先把进度同步到云端，失败则不退出并返回 false */
  const handleLogout = (): Promise<boolean> => logout(cloud.enabled ? cloud.saveNow : undefined);

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
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
    if (simpleMode) overlays.close('birth');
    showToast(t('toast.birthRegistered', { name: finalName, classLabel: cls.label, surname: origin.surname, gender: generatedGender }));
    return { gender: generatedGender, age: 8, classLabel: cls.label, surname: origin.surname, name: finalName };
  };


  const handleResetLife = () => {
    // 1. 重置出生登记与角色身份
    setIsRegistered(false);
    setGender(null);
    setBirthRegisteredYear(1870);
    setPlayerName(t('resetPlayerName'));

    // 2. 重置角色形象（服饰跟随账号，保留已拥有与已穿戴的服饰）
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
    saveStored('amigo_free_draw_used', false);
    saveStored('amigo_family', INITIAL_FAMILY_STATE);

    showToast(t('toast.lifeReset'));
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

  /** 入狱（第 67.7 题）：丢掉工作与童工，声望下降；返回提示文字 */
  const jailPlayer = (crime: string, months: number): string => {
    savePrison(sentenceTo(crime, months, gameYear, gameMonth));
    try {
      localStorage.setItem(CURRENT_JOB_KEY, '');
      localStorage.removeItem(CHILD_JOB_KEY);
    } catch (e) {}
    changeReputation(JAIL_REPUTATION);
    // 服刑期间可以到法院上诉（第 67.6 题）
    saveCases(addCase(loadCases(), appealCase(crime, gameYear, gameMonth)));
    addLifeLog('大事', `因${crime}入狱`, `被判入狱 ${months} 个月，丢掉了工作，声望 ${JAIL_REPUTATION}。可以到法院上诉。`);
    return t('jailed', { crime, months });
  };

  /** 慈善捐款：每 10,000 ₽ 声望 +1，每个游戏月最多 +5 */
  const handleDonate = (amount: number): string => {
    if (!isRegistered) return t('donate.notRegistered');
    if (coins < amount) return t('donate.noMoney', { amount: amount.toLocaleString(), symbol: CURRENCY.symbol });
    const monthKey = `${gameYear}-${gameMonth}`;
    const gain = Math.min(Math.floor(amount / CHARITY_UNIT), charityRemaining(charity, monthKey));
    setCoins((c) => c - amount);
    changeReputation(gain);
    setCharity({ month: monthKey, gained: (charity?.month === monthKey ? charity.gained : 0) + gain });
    if (amount >= 100000) addLifeLog('大事', '慷慨解囊', `向慈善会捐款 ${amount.toLocaleString()} ${CURRENCY.symbol}。`);
    return gain > 0 ? t('donate.thanks', { gain }) : t('donate.capped');
  };


  // 推演：待处理事件、推演积分、最近一次「本月无事发生」提示

  // 拍卖会（每月随机开办，只在开办当月有效）

  /** 处理推演事件的选项（只结算金币与健康） */
  const handleSimResolve = (uid: string, optionIndex: number) => {
    const inst = simEvents.find((e) => e.uid === uid);
    const def = inst ? eventDef(inst) : undefined;
    const option = def?.options[optionIndex];
    if (!inst || !def || !option || optionBlocked(option, coins)) return null;
    // 狱中不能处理推演事件（第 67.7 题）
    if (isInPrison()) {
      showToast(t('toast.inPrison'));
      return null;
    }
    const result = resolveOption(option);
    const newHealth = godMode ? 100 : Math.max(0, Math.min(100, health + result.health));
    setCoins((prev) => Math.max(0, prev + result.coins));
    setHealth(newHealth);
    setSimScore((n) => n + result.score);
    setSimEvents((prev) => prev.filter((e) => e.uid !== uid));
    addLifeLog('大事', def.headline, `${option.label}：${result.text}`);
    if (result.jail) showToast(jailPlayer(result.jail.crime, result.jail.months));
    // 受害或挨打后可到法院起诉（第 67.6 题）
    if (result.lawsuit) saveCases(addCase(loadCases(), suitCase(result.lawsuit, gameYear, gameMonth, inst.uid)));
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

  // 开发测试工具：一键快进剩余的月数（逐月推进见 useMonthAdvance）
  const [fastForwardRemaining, setFastForwardRemaining] = useState(0);
  /** 快进时「智能安排」：自动看病、处理推演、送礼，并替你做求职、结婚、买房的选择 */
  const [smartFastForward, setSmartFastForward] = useState(false);

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
    return idleOccupation(familyClass.id, currentAge);
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

  const antibodyActions = useAntibodies({ antibodies, setAntibodies, coins, setCoins, gameYear, gameMonth, family, setFamily });
  const { gainRecoveryImmunity } = antibodyActions;

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
  const { handleNextMonth } = useMonthAdvance({
    game,
    currentAge,
    playerOccupation,
    changeReputation,
    setPendingCoup,
    setShowSuccession,
    showToast,
    cloud,
    fastForwardRemaining,
    setFastForwardRemaining,
    smartFastForward,
  });
  const simple = useSimpleMode({
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
  const { usedSimpleMode, setUsedSimpleMode, setMaintenanceLog, handleMaintenance, fertilityText } = simple;

  // 成就「啃老族」：去世时年满 NEET_MIN_AGE 岁，且这一世从没领过月薪或童工收入
  React.useEffect(() => {
    if (isRegistered && health <= 0 && earnsNeet(currentAge, loadStored<number | null>(LAST_WORK_MONTH_KEY, null), Number(localStorage.getItem('amigo_job_months_worked') || 0))) {
      unlockAchievement('neet');
    }
  }, [isRegistered, health, currentAge]);

  // 成就「时装秀」：集齐商城内的全部服饰（抽卡或购买得到）
  React.useEffect(() => {
    if (CLOTHING.every((c) => ownedClothes.includes(c.id))) unlockAchievement('fashion_show');
  }, [ownedClothes]);

  // 成就：解锁时弹出提示；集齐全部成就时自动播放一次致谢名单；状态类成就随数据变化自动检查
  React.useEffect(() => {
    const onUnlock = (e: Event) => {
      const def = ACHIEVEMENTS.find((a) => a.id === (e as CustomEvent).detail);
      if (def) showToast(t('toast.achievement', { title: def.title, desc: def.desc }));
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

  return (
    <AuthGate authUser={authUser} authLoading={authLoading} onSignedIn={applySignedInUser} onLogout={() => void handleLogout()}>
    <div className="h-[100dvh] w-full bg-[#1c1d25] flex justify-center font-sans overflow-hidden">
      <div className="w-full h-full flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {toast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[100] bg-[#1e202e]/95 backdrop-blur-md text-emerald-300 border border-emerald-500/30 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-top-3 duration-200 text-center max-w-[85%] pointer-events-none flex items-center gap-2">
            <span>{toast}</span>
          </div>
        )}
         <GameWorkspace
           game={game}
           overlays={overlays}
           simple={simple}
           simpleMode={simpleMode}
           setSimpleMode={setSimpleMode}
           activeTab={activeTab}
           setActiveTab={setActiveTab}
           authUser={authUser}
           avatarContent={renderAvatarContent()}
           currentAge={currentAge}
           playerOccupation={playerOccupation}
           familyClass={familyClass}
           familyOrigin={familyOrigin}
           currentDisease={currentDisease}
           familyRanking={familyRanking}
           familyCohesion={familyCohesion}
           familyWealth={familyWealth}
           showToast={showToast}
           onOpenSuccession={() => setShowSuccession(true)}
           handleNextMonth={handleNextMonth}
           handleResetLife={handleResetLife}
           handleSimResolve={handleSimResolve}
           handleRetire={handleRetire}
         />
         
         <OverlayHost
           overlays={overlays}
           game={game}
           authUser={authUser}
           setAuthUser={setAuthUser}
           cloud={cloud}
           seasonMine={seasonMine}
           antibodyActions={antibodyActions}
           currentAge={currentAge}
           playerOccupation={playerOccupation}
           familyClass={familyClass}
           familyOrigin={familyOrigin}
           currentDisease={currentDisease}
           simpleMode={simpleMode}
           setSimpleMode={setSimpleMode}
           usedSimpleMode={usedSimpleMode}
           fertilityText={fertilityText}
           handleMaintenance={handleMaintenance}
           avatarSource={avatarSource}
           setAvatarSource={setAvatarSource}
           bilibiliAvatar={bilibiliAvatar}
           setBilibiliAvatar={setBilibiliAvatar}
           isAvatarModalOpen={isAvatarModalOpen}
           setIsAvatarModalOpen={setIsAvatarModalOpen}
           renderAvatarContent={renderAvatarContent}
           showToast={showToast}
           setActiveTab={setActiveTab}
           changeReputation={changeReputation}
           jailPlayer={jailPlayer}
           playCredits={playCredits}
           activateGodMode={activateGodMode}
           handleNextMonth={handleNextMonth}
           handleRegisterBirth={handleRegisterBirth}
           handleResetLife={handleResetLife}
           handleLogout={handleLogout}
           handleDonate={handleDonate}
         />

         {/* 致谢名单：集齐全部成就后播放 */}
         {showCredits && <CreditsRoll rank={creditsRank} loading={creditsLoading} onClose={() => setShowCredits(false)} />}

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
               <h3 className="font-black text-base text-center">{t('cloudConflict.title')}</h3>
               <p className="text-xs text-gray-300 font-bold leading-relaxed text-center">
                 {t('cloudConflict.desc')}
               </p>
               {cloud.conflict.remoteUpdatedAt && (
                 <p className="text-[11px] text-gray-400 font-bold text-center">
                   {t('cloudConflict.remoteSavedAt', { time: new Date(cloud.conflict.remoteUpdatedAt).toLocaleString(i18n.language) })}
                 </p>
               )}
               <div className="grid grid-cols-2 gap-2">
                 <button
                   onClick={() => void cloud.resolveConflict('cloud')}
                   className="bg-sky-400 hover:bg-sky-300 text-black text-xs font-black py-2.5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] cursor-pointer"
                 >
                   {t('cloudConflict.useCloud')}
                 </button>
                 <button
                   onClick={() => void cloud.resolveConflict('local')}
                   className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-black py-2.5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] cursor-pointer"
                 >
                   {t('cloudConflict.useLocal')}
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
               overlays.open('auction');
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
               overlays.close('shop');
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

      </div>
    </div>
    </AuthGate>
  );
}
