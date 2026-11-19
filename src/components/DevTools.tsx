import React from 'react';
import type { Game } from '../hooks/useGameState';
import type { Overlays } from '../hooks/useOverlays';
import type { useCloudSave } from '../lib/cloudSave';
import type { useSeason } from '../hooks/useSeason';
import type { SocialClass } from '../lib/lineage';
import { DevToolsPanel } from './DevToolsPanel';
import { addChildForTesting, buildFamilyMembers, getHeirlooms } from '../lib/family';
import { readAchievements, ACHIEVEMENTS, unlockAchievement, unlockAllForTesting, clearAchievementsForTesting, readGiftsGiven, recordGiftsGiven } from '../lib/achievements';
import { randomAppearance, applyBeauty, BEAUTY_TRAIT } from '../lib/appearance';
import { antibodyNames, DISEASES } from '../lib/disease';
import { addGifts, giftCount } from '../lib/gifts';
import { generateAuction, isInvited } from '../lib/heirlooms';
import { layoffAllForTesting } from '../lib/kinJobs';
import { familyAllowance } from '../lib/allowance';
import { submitSeasonScore } from '../lib/authClient';
import { saveStored } from '../lib/storage';
import { GACHA_PITY_KEY, PITY_LIMITED } from '../lib/gacha';
import { currentSeason, CURRENCY } from '../data/seasons';

/**
 * 开发测试工具的接线：把 DevToolsPanel 的各项测试操作接到游戏状态上。
 * 只在 npm run dev 下由 App 渲染，生产构建中整段移除；提示文字只给开发者看，不做多语言。
 */
export const DevTools: React.FC<{
  game: Game;
  overlays: Overlays;
  currentAge: number;
  playerOccupation: string;
  familyClass: SocialClass;
  simpleMode: boolean;
  setSimpleMode: React.Dispatch<React.SetStateAction<boolean>>;
  fastForwardRemaining: number;
  setFastForwardRemaining: React.Dispatch<React.SetStateAction<number>>;
  smartFastForward: boolean;
  setSmartFastForward: React.Dispatch<React.SetStateAction<boolean>>;
  showToast: (msg: string) => void;
  autoPlayCreditsIfComplete: () => void;
  setShowCredits: (show: boolean) => void;
  cloud: ReturnType<typeof useCloudSave>;
  seasonMine: ReturnType<typeof useSeason>;
}> = ({ game, overlays, currentAge, playerOccupation, familyClass, simpleMode, setSimpleMode, fastForwardRemaining, setFastForwardRemaining, smartFastForward, setSmartFastForward, showToast, autoPlayCreditsIfComplete, setShowCredits, cloud, seasonMine }) => {
  const { isRegistered, gender, playerName, coins, gameYear, gameMonth, family, playerTraits, reputation, giftInventory, antibodies } = game.state;
  const { setCoins, setBirthRegisteredYear, setFamily, setPlayerTraits, setAppearance, setAntibodies, setAuction, setGiftInventory } = game.setters;
  const membersParams = { playerName, playerGender: gender, playerAge: currentAge, playerOccupation, gameYear, gameMonth };

  return (
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
      onSetAge={(age) => {
        const regYear = gameYear - (age - 8);
        setBirthRegisteredYear(regYear);
        try {
          localStorage.setItem('amigo_birth_registered_year', String(regYear));
        } catch (e) {}
        showToast(`🛠️ 年龄已设为 ${age} 岁`);
      }}
      onAddChild={(twins) => {
        const birth = addChildForTesting(family, gameYear, gameMonth, twins, Math.random, playerTraits);
        if (twins) unlockAchievement('twins');
        setFamily(birth.state);
        showToast(`🛠️ 新增子嗣：${birth.children.map((c) => c.name).join('、')}`);
      }}
      onAddAdultChild={() => {
        const birth = addChildForTesting(family, gameYear - 30, gameMonth, false, Math.random, playerTraits);
        setFamily(birth.state);
        showToast(`🛠️ 新增 30 岁单身子女：${birth.children[0].name}`);
      }}
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
        // 父母给的零花（第 36 题）：按当前族谱中在世父母的职业收入、好感度计算
        const a = familyAllowance(family, membersParams, currentAge, familyClass.id);
        const detail = a.parts.map((p) => `${p.relation} ${p.reason ?? `+${p.amount.toLocaleString()}`}`).join('；');
        return `${a.total.toLocaleString()} ${CURRENCY.symbol}${detail ? `（${detail}）` : '（父母都已故）'}`;
      })()}
      onSetParentAffinity={(value) => {
        const parents = buildFamilyMembers(family, membersParams).filter((m) => m.kin === 'parent' && !m.isPlayer && m.status !== '已故');
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
  );
};
