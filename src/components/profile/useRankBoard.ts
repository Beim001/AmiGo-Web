import React, { useState } from 'react';
import { getBilibiliRankList, getBilibiliMyRank, submitBilibiliScore } from '../../lib/bilibiliToy';

// 排行榜数据：board 1 财富榜、3 推演榜走 B 站 Toy SDK（失败时用本地兜底榜单），10 / 11 为赛季排行（由 SeasonRankPanel 自行读取）。
// 状态由 ProfileModal 持有，切换标签页后仍保留所选榜单与周期；只在「排行榜」标签页打开时刷新。

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

export const useRankBoard = ({ subTab, coins, playerName, simScore, showToast }: {
  /** 当前标签页：只有在「排行榜」时才刷新 */
  subTab: string;
  coins: number;
  playerName: string;
  simScore: number;
  showToast: (msg: string) => void;
}) => {
  // Rank List States
  const [board, setBoard] = useState<number>(1); // 1: 财富榜, 2: 珍藏榜, 3: 推演榜
  const [period, setPeriod] = useState<'all' | 'month' | 'week' | 'day'>('week');
  const [rankList, setRankList] = useState<Array<{ rank: number; score: number; nickname: string; avatar: string }>>([]);
  const [myRank, setMyRank] = useState<{ ranked: boolean; rank: number; score: number }>({ ranked: false, rank: 0, score: 0 });
  const [isSdkLoading, setIsSdkLoading] = useState(false);

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

  return { board, setBoard, period, setPeriod, rankList, myRank, isSdkLoading, refreshRankData, handleSubmitScore };
};

export type RankBoard = ReturnType<typeof useRankBoard>;
