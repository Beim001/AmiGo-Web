// 赛季排名（第 55 题）：积分榜 + 全成就速通榜。
// - 赛季积分 = 本赛季解锁的成就数 × 10 + 本赛季获得的推演积分 + 家族阶层分（阶层序号 × 10，乞丐 0 … 皇族 60）
// - 全成就用时：从「赛季开始」与「首次进入本赛季」中较晚的时间，到本赛季集齐全部成就的现实时间
// - 换赛季时，上一赛季的成就记录归档，本赛季重新开始；用过简洁模式的玩家标「偷懒」

import { currentSeason } from '../data/seasons';
import { ACHIEVEMENTS, ACHIEVEMENTS_KEY, CREDITS_SEEN_KEY, GIFTS_GIVEN_KEY, AchievementRecord } from './achievements';
import { classRank } from './lineage';
import i18n from '../i18n';

export const SEASON_ID_KEY = 'amigo_season_id';
export const SEASON_JOINED_KEY = 'amigo_season_joined_at';
export const SEASON_SIM_KEY = 'amigo_season_sim_points';
export const SEASON_LAZY_KEY = 'amigo_season_lazy';
export const SEASON_ARCHIVE_PREFIX = 'amigo_achievements_archive_';
/** 本赛季用过测试兑换码（第 57 题）：不上传赛季成绩 */
export const SEASON_CHEAT_KEY = 'amigo_season_cheat';

export const ACHIEVEMENT_POINTS = 10;
export const CLASS_POINTS = 10;

const readNum = (key: string, fallback: number) => {
  const n = Number(localStorage.getItem(key));
  return Number.isFinite(n) && localStorage.getItem(key) !== null ? n : fallback;
};

/**
 * 进入游戏时调用：
 * - 第一次记录赛季：沿用已有成就；加入时间取「赛季开始」与「最早一项本赛季成就 / 现在」中较晚者
 * - 赛季已更换：归档上一赛季的成就，清空成就、致谢播放记录、赠礼计数、赛季积分与偷懒标记
 * 返回本赛季的加入时间（毫秒）
 */
export const ensureSeason = (now: number = Date.now()): number => {
  const season = currentSeason();
  const start = Date.parse(season.startAt);
  const stored = localStorage.getItem(SEASON_ID_KEY);
  if (stored === season.id) return readNum(SEASON_JOINED_KEY, Math.max(start, now));

  if (stored) {
    const old = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (old) localStorage.setItem(SEASON_ARCHIVE_PREFIX + stored, old);
    localStorage.removeItem(ACHIEVEMENTS_KEY);
    localStorage.removeItem(CREDITS_SEEN_KEY);
    localStorage.removeItem(GIFTS_GIVEN_KEY);
    localStorage.setItem(SEASON_JOINED_KEY, String(Math.max(start, now)));
  } else {
    let record: AchievementRecord = {};
    try {
      record = JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '{}');
    } catch {}
    const inSeason = Object.values(record).filter((t) => t >= start);
    const earliest = inSeason.length ? Math.min(...inSeason) : now;
    localStorage.setItem(SEASON_JOINED_KEY, String(Math.max(start, Math.min(earliest, now))));
  }
  localStorage.setItem(SEASON_ID_KEY, season.id);
  localStorage.setItem(SEASON_SIM_KEY, '0');
  localStorage.removeItem(SEASON_LAZY_KEY);
  localStorage.removeItem(SEASON_CHEAT_KEY);
  return readNum(SEASON_JOINED_KEY, Math.max(start, now));
};

export const markSeasonCheat = () => localStorage.setItem(SEASON_CHEAT_KEY, 'true');
export const isSeasonCheat = () => localStorage.getItem(SEASON_CHEAT_KEY) === 'true';

/** 本赛季解锁的成就（解锁时间不早于赛季开始） */
export const seasonAchievements = (record: AchievementRecord): string[] => {
  const start = Date.parse(currentSeason().startAt);
  return ACHIEVEMENTS.filter((a) => (record[a.id] ?? 0) >= start).map((a) => a.id);
};

export const addSeasonSimPoints = (delta: number) => {
  if (delta <= 0) return;
  localStorage.setItem(SEASON_SIM_KEY, String(readNum(SEASON_SIM_KEY, 0) + delta));
};
export const readSeasonSimPoints = () => readNum(SEASON_SIM_KEY, 0);

export const markSeasonLazy = () => localStorage.setItem(SEASON_LAZY_KEY, 'true');
export const isSeasonLazy = () => localStorage.getItem(SEASON_LAZY_KEY) === 'true';

export const seasonScore = (record: AchievementRecord, simPoints: number, classId: string): number =>
  seasonAchievements(record).length * ACHIEVEMENT_POINTS + simPoints + Math.max(0, classRank(classId)) * CLASS_POINTS;

/** 全成就用时（毫秒）；本赛季还没集齐时为 null */
export const completionMs = (record: AchievementRecord, joinedAt: number): number | null => {
  const ids = seasonAchievements(record);
  if (ids.length < ACHIEVEMENTS.length) return null;
  return Math.max(0, Math.max(...ids.map((id) => record[id])) - joinedAt);
};

/** 用时显示为「X 天 X 小时 X 分」 */
export const formatDuration = (ms: number): string => {
  const min = Math.floor(ms / 60000);
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  return [d ? i18n.t('common:duration.day', { count: d }) : '', h ? i18n.t('common:duration.hour', { count: h }) : '', i18n.t('common:duration.minute', { count: m })].filter(Boolean).join(' ');
};
