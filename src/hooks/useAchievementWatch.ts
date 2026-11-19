import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Game } from './useGameState';
import { unlockAchievement, ACHIEVEMENTS, earnsNeet, ACHIEVEMENT_EVENT } from '../lib/achievements';
import { LAST_WORK_MONTH_KEY } from '../lib/monthly';
import { loadStored } from '../lib/storage';
import { CLOTHING } from '../data/clothing';

/**
 * 成就的自动检查：解锁时弹出提示，集齐全部成就时自动播放一次致谢名单；
 * 状态类成就（资产、婚姻、子女、年龄、房产等）随数据变化自动检查。
 * 由某个操作直接触发的成就仍在对应操作里解锁。
 */
export const useAchievementWatch = ({
  game,
  currentAge,
  showToast,
  autoPlayCreditsIfComplete,
}: {
  game: Game;
  currentAge: number;
  showToast: (msg: string) => void;
  autoPlayCreditsIfComplete: () => void;
}) => {
  const { t } = useTranslation('app');
  const { isRegistered, coins, health, gameYear, gameMonth, ownedClothes, bankDeposit, family, simScore } = game.state;

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
};
