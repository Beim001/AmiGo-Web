import { useState } from 'react';
import { claimCompletionRank } from '../lib/authClient';
import { isSeasonCheat } from '../lib/season';
import { hasAllAchievements, CREDITS_SEEN_KEY, CREDITS_RANK_KEY } from '../lib/achievements';

// 致谢名单（集齐全部成就后播放）：名次来自服务器（第几个集齐全部成就的账号）；未登录或请求失败时显示不带名次的祝贺语

export const useCredits = () => {
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

  return { showCredits, setShowCredits, creditsLoading, creditsRank, playCredits, autoPlayCreditsIfComplete };
};
