import { useState } from 'react';
import { addLifeLog } from '../../lib/lifeLog';
import { getBilibiliUserProfile } from '../../lib/bilibiliToy';
import { validatePlayerName } from '../../utils/sensitiveWords';
import i18n from '../../i18n';

// 改名规则：每 30 天最多改名 2 次；名称含政治与合规敏感词时计违规，累计 3 次冻结改名 90 天，违规记录持久化。
// 「同步 B 站资料」也会改名，同样受冻结与敏感词规则约束，因此一并放在这里。状态由 ProfileModal 持有，切换标签页不会丢失。

// 30天毫秒数 (用于计算1个月内改名限制)
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
// 90天毫秒数 (用于政治与合规敏感词多次违规冻结3个月)
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

// 格式化解封日期显示函数
export const formatUnlockTime = (timestamp: number): string => {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const hours = d.getHours() < 10 ? '0' + d.getHours() : d.getHours();
  const minutes = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
  const seconds = d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds();
  return i18n.t('profile:nameChange.unlockTime', { year, month, date, hours, minutes, seconds });
};

// 获取过去30天内的改名时间戳
const getRecentNameChanges = (timestamps: number[]): number[] => {
  const now = Date.now();
  return timestamps.filter((t) => now - t < THIRTY_DAYS_MS);
};

export const useNameChange = ({ playerName, setPlayerName, setBilibiliAvatar, setAvatarSource, showToast }: {
  playerName: string;
  setPlayerName: (name: string) => void;
  setBilibiliAvatar: (avatar: string | null) => void;
  setAvatarSource: (source: string) => void;
  showToast: (msg: string) => void;
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(playerName);
  // Name Change Timestamps (localStorage persisted)
  const [nameChangeTimestamps, setNameChangeTimestamps] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('amigo_name_change_timestamps');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // 政治与合规敏感词违规尝试计数 (达到3次锁定3个月)
  const [politicalViolationCount, setPoliticalViolationCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('amigo_political_violation_count');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  });

  // 改名冻结截止时间戳
  const [nameFreezeUntil, setNameFreezeUntil] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('amigo_name_freeze_until');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  });

  // 敏感词违规与改名冻结警告弹窗控制状态
  const [freezeModalInfo, setFreezeModalInfo] = useState<{
    show: boolean;
    isFrozen: boolean;
    violationCount: number;
    matchedWord?: string;
  } | null>(null);

  // 政治与合规敏感词违规改名历史记录 (localStorage 持久化)
  const [politicalViolationLogs, setPoliticalViolationLogs] = useState<Array<{
    id: string;
    attemptedName: string;
    matchedWord: string;
    category: string;
    timestamp: number;
  }>>(() => {
    try {
      const saved = localStorage.getItem('amigo_political_violation_logs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // 弹窗内部当前视图: 'info' (合规说明) | 'history' (违规记录)
  const [modalTab, setModalTab] = useState<'info' | 'history'>('info');

  const addViolationLog = (attemptedName: string, matchedWord: string, category: string) => {
    const newLog = {
      id: Date.now().toString() + '_' + Math.floor(Math.random() * 1000),
      attemptedName,
      matchedWord,
      category,
      timestamp: Date.now(),
    };
    setPoliticalViolationLogs(prev => {
      const updated = [newLog, ...prev];
      try {
        localStorage.setItem('amigo_political_violation_logs', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const recentNameChanges = getRecentNameChanges(nameChangeTimestamps);
  const remainingQuota = Math.max(0, 2 - recentNameChanges.length);

  // Sync Bilibili profile
  const handleSyncBilibiliProfile = async () => {
    if (nameFreezeUntil > Date.now()) {
      setFreezeModalInfo({
        show: true,
        isFrozen: true,
        violationCount: politicalViolationCount,
      });
      showToast(i18n.t('profile:nameChange.frozenNoSync'));
      return;
    }

    let targetName = '';
    let avatarUrl = '';
    let isMockEnv = false;

    try {
      const { profile, isMock } = await getBilibiliUserProfile();
      if (profile && (profile.nickname || profile.avatar)) {
        targetName = profile.nickname || i18n.t('profile:nameChange.bilibiliDefault');
        avatarUrl = profile.avatar || '';
        isMockEnv = isMock;
      }
    } catch (err: any) {
      console.warn('getBilibiliUserProfile error:', err);
      showToast(i18n.t('profile:nameChange.bilibiliUnauthorized'));
      return;
    }

    if (!targetName) {
      targetName = i18n.t('profile:nameChange.bilibiliRandom', { n: Math.floor(100 + Math.random() * 900) });
      avatarUrl = 'https://i0.hdslb.com/bfs/face/member/noface.jpg';
    }

    if (targetName) {
      const validation = validatePlayerName(targetName);
      if (!validation.valid) {
        if (validation.category === '政治与合规敏感') {
          const newCount = politicalViolationCount + 1;
          setPoliticalViolationCount(newCount);
          try {
            localStorage.setItem('amigo_political_violation_count', newCount.toString());
          } catch (e) {}

          addViolationLog(targetName, validation.word || i18n.t('profile:nameChange.violationWordFallback'), validation.category || '政治与合规敏感');
          setModalTab('info');

          if (newCount >= 3) {
            const freezeUntilTime = Date.now() + NINETY_DAYS_MS;
            setNameFreezeUntil(freezeUntilTime);
            try {
              localStorage.setItem('amigo_name_freeze_until', freezeUntilTime.toString());
            } catch (e) {}

            setFreezeModalInfo({
              show: true,
              isFrozen: true,
              violationCount: newCount,
              matchedWord: validation.word,
            });
          } else {
            setFreezeModalInfo({
              show: true,
              isFrozen: false,
              violationCount: newCount,
              matchedWord: validation.word,
            });
          }
        }
        showToast(i18n.t('profile:nameChange.bilibiliInvalid', { reason: validation.reason }));
        if (avatarUrl) setBilibiliAvatar(avatarUrl);
        return;
      }

      setPlayerName(targetName);
      if (avatarUrl) {
        setBilibiliAvatar(avatarUrl);
        setAvatarSource('social');
      }
      showToast(i18n.t('profile:nameChange.bilibiliSynced', { name: targetName, mock: isMockEnv ? i18n.t('profile:nameChange.mockMode') : '' }));
    }
  };

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed === playerName) {
      setIsEditingName(false);
      return;
    }

    const now = Date.now();

    // 0. 检查改名功能是否处于 3个月 冻结管制状态
    if (nameFreezeUntil > now) {
      setFreezeModalInfo({
        show: true,
        isFrozen: true,
        violationCount: politicalViolationCount,
      });
      showToast(i18n.t('profile:nameChange.frozen', { time: formatUnlockTime(nameFreezeUntil) }));
      return;
    }

    // 1. 敏感词规则校验
    const validation = validatePlayerName(nameInput);
    if (!validation.valid) {
      if (validation.category === '政治与合规敏感') {
        const newCount = politicalViolationCount + 1;
        setPoliticalViolationCount(newCount);
        try {
          localStorage.setItem('amigo_political_violation_count', newCount.toString());
        } catch (e) {}

        addViolationLog(nameInput, validation.word || i18n.t('profile:nameChange.violationWordFallback'), validation.category || '政治与合规敏感');
        setModalTab('info');

        if (newCount >= 3) {
          // 连续3次违规尝试：冻结改名 3个月
          const freezeTime = now + NINETY_DAYS_MS;
          setNameFreezeUntil(freezeTime);
          try {
            localStorage.setItem('amigo_name_freeze_until', freezeTime.toString());
          } catch (e) {}

          setFreezeModalInfo({
            show: true,
            isFrozen: true,
            violationCount: newCount,
            matchedWord: validation.word,
          });
          showToast(i18n.t('profile:nameChange.frozenNow'));
        } else {
          // 1次或2次尝试：显示弹窗预警
          setFreezeModalInfo({
            show: true,
            isFrozen: false,
            violationCount: newCount,
            matchedWord: validation.word,
          });
          showToast(i18n.t('profile:nameChange.warning', { count: newCount }));
        }
      } else {
        showToast(i18n.t('profile:nameChange.failed', { reason: validation.reason }));
      }
      return;
    }

    // 2. 一个月改名频次校验 (≤ 2次)
    const recentChanges = getRecentNameChanges(nameChangeTimestamps);
    if (recentChanges.length >= 2) {
      const earliestChange = Math.min(...recentChanges);
      const unlockTime = new Date(earliestChange + THIRTY_DAYS_MS);
      const monthStr = unlockTime.getMonth() + 1;
      const dayStr = unlockTime.getDate();
      const hourStr = unlockTime.getHours();
      const minStr = unlockTime.getMinutes() < 10 ? '0' + unlockTime.getMinutes() : unlockTime.getMinutes();
      const dateStr = i18n.t('profile:nameChange.quotaTime', { month: monthStr, day: dayStr, hour: hourStr, minute: minStr });

      showToast(i18n.t('profile:nameChange.quotaExceeded', { time: dateStr }));
      return;
    }

    // 3. 记入修改历史并保存
    const updatedTimestamps = [...recentChanges, now];
    setNameChangeTimestamps(updatedTimestamps);
    try {
      localStorage.setItem('amigo_name_change_timestamps', JSON.stringify(updatedTimestamps));
    } catch (e) {}

    setPlayerName(trimmed);
    setIsEditingName(false);
    const remaining = 2 - updatedTimestamps.length;
    addLifeLog('成长', '改名', `改名为「${trimmed}」。`);
    showToast(i18n.t('profile:nameChange.renamed', { name: trimmed, remaining }));
  };

  return {
    isEditingName,
    setIsEditingName,
    nameInput,
    setNameInput,
    politicalViolationCount,
    nameFreezeUntil,
    freezeModalInfo,
    setFreezeModalInfo,
    politicalViolationLogs,
    modalTab,
    setModalTab,
    remainingQuota,
    handleSaveName,
    handleSyncBilibiliProfile,
  };
};

export type NameChange = ReturnType<typeof useNameChange>;
