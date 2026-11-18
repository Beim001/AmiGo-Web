import React, { useState } from 'react';
import { loadStored, saveStored } from '../lib/storage';
import { GOD_MODE_KEY, GOD_COINS } from '../lib/testCode';
import { markSeasonCheat, seasonScore, readSeasonSimPoints, isSeasonLazy } from '../lib/season';
import { submitSeasonScore } from '../lib/authClient';
import { currentSeason } from '../data/seasons';
import { readAchievements, unlockAllForTesting } from '../lib/achievements';
import type { ActiveDisease } from '../lib/disease';

// 测试兑换码（第 57 题）：无限金币、无限体力与寿命，立即解锁全部成就；本赛季成绩标记为作弊，由服务器排除

export const useGodMode = ({ coins, setCoins, health, setHealth, isRegistered, setDisease, cloud, familyClass, autoPlayCreditsIfComplete }: {
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  health: number;
  setHealth: React.Dispatch<React.SetStateAction<number>>;
  isRegistered: boolean;
  setDisease: React.Dispatch<React.SetStateAction<ActiveDisease | null>>;
  /** 已验证的邮箱账号才向服务器上报作弊标记 */
  cloud: { enabled: boolean };
  familyClass: { id: string };
  autoPlayCreditsIfComplete: () => void;
}) => {
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

  return { godMode, setGodMode, activateGodMode };
};
