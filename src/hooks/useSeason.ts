import React, { useState } from 'react';
import { ensureSeason, addSeasonSimPoints, markSeasonLazy, seasonScore, readSeasonSimPoints, completionMs, isSeasonLazy, isSeasonCheat, seasonAchievements } from '../lib/season';
import { readAchievements, ACHIEVEMENTS } from '../lib/achievements';
import { submitSeasonScore } from '../lib/authClient';
import { currentSeason } from '../data/seasons';

// 赛季（第 55 题）：首次进入时记录赛季、累计本赛季推演积分、用过简洁模式标「偷懒」，
// 并计算本赛季成绩；已验证的邮箱账号每次成绩变化后上报（延迟 3 秒合并），用过测试兑换码也照常上报并带上标记，由服务器排除

export const useSeason = ({ simScore, simpleMode, isRegistered, cloud, familyClass }: {
  simScore: number;
  simpleMode: boolean;
  isRegistered: boolean;
  /** 已验证的邮箱账号才上报成绩 */
  cloud: { enabled: boolean };
  familyClass: { id: string };
}) => {
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

  return seasonMine;
};
