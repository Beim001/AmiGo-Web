/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getHeirlooms, buildFamilyMembers, getOrigin, listHeirs } from './lib/family';
import { CreditsRoll } from './components/CreditsRoll';
import { randomAppearance, applyBeauty, BEAUTY_TRAIT } from './lib/appearance';
import { SIMPLE_MODE_KEY } from './lib/simpleMode';
import { rankFamilies, familyNetWorth, familyCohesion as familyCohesionOf } from './lib/familyRank';
import { classById, rollPlayerLifespan, idleOccupation } from './lib/lineage';
import { heirloomsValue } from './lib/heirlooms';
import { diseaseInfo } from './lib/disease';
import { SuccessionModal } from './components/SuccessionModal';
import { readLifeLog } from './lib/lifeLog';
import { kinIncomeTotal } from './lib/kinJobs';
import { useCredits } from './hooks/useCredits';
import { useAntibodies } from './hooks/useAntibodies';
import { useGodMode } from './hooks/useGodMode';
import { useSeason } from './hooks/useSeason';
import { useGameState, registeredName } from './hooks/useGameState';
import { useSuccession } from './hooks/useSuccession';
import { useSimpleMode } from './hooks/useSimpleMode';
import { useOverlays } from './hooks/useOverlays';
import { useAvatar } from './hooks/useAvatar';
import { useLifeCycle } from './hooks/useLifeCycle';
import { usePlayerActions } from './hooks/usePlayerActions';
import { useAchievementWatch } from './hooks/useAchievementWatch';
import { DevTools } from './components/DevTools';
import { CloudConflictDialog } from './components/CloudConflictDialog';
import { useAuth } from './hooks/useAuth';
import { AuthGate } from './components/AuthGate';
import { GameWorkspace } from './components/GameWorkspace';
import { useMonthAdvance } from './hooks/useMonthAdvance';
import { OverlayHost } from './components/OverlayHost';
import { JOB_POSITIONS, readCurrentJobId } from './components/JobModal';
import { loadStored, saveStored } from './lib/storage';
import { useCloudSave } from './lib/cloudSave';
import { useTranslation } from 'react-i18next';

export default function App() {
  const { t } = useTranslation('app');
  const [activeTab, setActiveTab] = useState('role');
  // 全屏弹窗按打开顺序叠放（见 useOverlays）
  const overlays = useOverlays();

  // 游戏进度状态统一由 useGameState 管理（初始化、自动存档）；setter 与 useState 的用法相同
  const game = useGameState();
  const { isRegistered, gender, birthRegisteredYear, playerName, coins, health, gameYear, gameMonth, equippedClothing, bankDeposit, bankLoan, family, disease, playerTraits, reputation, guardianship, simScore, appearance, playerLifespan, antibodies, godMode } = game.state;
  const { setPlayerName, setCoins, setHealth, setFamily, setDisease, setAppearance, setPlayerLifespan, setAntibodies, setGodMode } = game.setters;

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

  // 头像：卡通形象、预设头像或账号头像
  const avatar = useAvatar({ authUser, equippedClothing, appearance, age: isRegistered ? currentAge : 25, gender });
  const { setAvatarSource, setBilibiliAvatar, renderAvatarContent } = avatar;

  // 出生登记与重置人生；onReset 清空其他 hook 的状态（这些回调只在玩家操作时执行，届时下方的 hook 均已初始化）
  const { handleRegisterBirth, handleResetLife } = useLifeCycle({
    game,
    showToast,
    onRegistered: () => {
      if (simpleMode) overlays.close('birth');
    },
    onReset: () => {
      setAvatarSource('cartoon');
      setBilibiliAvatar(null);
      setShowSuccession(false);
      simple.setUsedSimpleMode(false);
      simple.setMaintenanceLog({});
    },
  });

  // 云端存档（仅已验证的邮箱账号）
  const cloud = useCloudSave(authUser);

  // 疾病（undefined.md 第 20 题）
  const currentDisease = diseaseInfo(disease);

  // 家族出身（旧存档为贵族 · 瓦伦丁家族）
  const familyOrigin = getOrigin(family);
  const familyClass = classById(familyOrigin.classId);
  const [showSuccession, setShowSuccession] = useState(false);

  // 声望变化、入狱、慈善捐款、处理推演事件
  const { changeReputation, jailPlayer, handleDonate, handleSimResolve } = usePlayerActions({ game, currentAge, showToast, setShowSuccession });

  // 开发测试工具：一键快进剩余的月数（逐月推进见 useMonthAdvance）
  const [fastForwardRemaining, setFastForwardRemaining] = useState(0);
  /** 快进时「智能安排」：自动看病、处理推演、送礼，并替你做求职、结婚、买房的选择 */
  const [smartFastForward, setSmartFastForward] = useState(false);

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
  const { usedSimpleMode, handleMaintenance, fertilityText } = simple;

  useAchievementWatch({ game, currentAge, showToast, autoPlayCreditsIfComplete });

  // 家族排行榜：凝聚力（在世成员对当家人的平均好感）、财力（家族资产净值）、影响力（声望）
  const familyMembersView = buildFamilyMembers(family, { playerName, playerGender: gender, playerAge: currentAge, playerOccupation, gameYear, gameMonth });
  const familyCohesion = familyCohesionOf(familyMembersView);
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
            avatar={avatar}
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
              heirs={listHeirs(familyMembersView)}
              onChooseHeir={handleSuccession}
              majorRecordCount={readLifeLog().filter((e) => e.category === '大事').length}
              onRestart={() => {
                handleResetLife();
                setShowSuccession(false);
              }}
              onClose={() => setShowSuccession(false)}
            />
          )}

          <CloudConflictDialog cloud={cloud} />

          {/* 开发测试工具：仅 npm run dev 下渲染，生产构建中被移除 */}
          {import.meta.env.DEV && (
            <DevTools
              game={game}
              overlays={overlays}
              currentAge={currentAge}
              playerOccupation={playerOccupation}
              familyClass={familyClass}
              simpleMode={simpleMode}
              setSimpleMode={setSimpleMode}
              fastForwardRemaining={fastForwardRemaining}
              setFastForwardRemaining={setFastForwardRemaining}
              smartFastForward={smartFastForward}
              setSmartFastForward={setSmartFastForward}
              showToast={showToast}
              autoPlayCreditsIfComplete={autoPlayCreditsIfComplete}
              setShowCredits={setShowCredits}
              cloud={cloud}
              seasonMine={seasonMine}
            />
          )}
        </div>
      </div>
    </AuthGate>
  );
}
