import { beforeEach, describe, expect, it } from 'vitest';
import { currentSeason } from '../data/seasons';
import { ACHIEVEMENTS, ACHIEVEMENTS_KEY, AchievementRecord } from './achievements';
import {
  completionMs,
  ensureSeason,
  isSeasonCheat,
  isSeasonLazy,
  markSeasonCheat,
  markSeasonLazy,
  readSeasonSimPoints,
  addSeasonSimPoints,
  SEASON_ARCHIVE_PREFIX,
  SEASON_ID_KEY,
  seasonAchievements,
} from './season';

const START = Date.parse(currentSeason().startAt);
const HOUR = 60 * 60 * 1000;

/** 所有成就都在赛季开始后的某个时间解锁 */
const allUnlockedAt = (time: number): AchievementRecord => Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, time]));

beforeEach(() => localStorage.clear());

describe('本赛季成就', () => {
  it('赛季开始前解锁的成就不算本赛季', () => {
    const [before, after] = ACHIEVEMENTS;
    const ids = seasonAchievements({ [before.id]: START - 1, [after.id]: START });
    expect(ids).toEqual([after.id]);
  });
});

describe('全成就用时', () => {
  it('未集齐时为 null', () => {
    const record = allUnlockedAt(START + HOUR);
    delete record[ACHIEVEMENTS[0].id];
    expect(completionMs(record, START)).toBeNull();
  });

  it('从加入时间算到最后一项成就的解锁时间', () => {
    const record = allUnlockedAt(START + HOUR);
    record[ACHIEVEMENTS[0].id] = START + 3 * HOUR;
    expect(completionMs(record, START + HOUR)).toBe(2 * HOUR);
  });
});

describe('进入赛季', () => {
  it('首次记录赛季时，加入时间取最早一项本赛季成就的解锁时间', () => {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify({ [ACHIEVEMENTS[0].id]: START + 5 * HOUR, [ACHIEVEMENTS[1].id]: START + 2 * HOUR }));
    expect(ensureSeason(START + 10 * HOUR)).toBe(START + 2 * HOUR);
  });

  it('换赛季时归档上一赛季的成就，并清空本赛季的积分、偷懒与测试码标记', () => {
    const old = JSON.stringify(allUnlockedAt(START));
    localStorage.setItem(SEASON_ID_KEY, 'S0');
    localStorage.setItem(ACHIEVEMENTS_KEY, old);
    addSeasonSimPoints(50);
    markSeasonLazy();
    markSeasonCheat();

    ensureSeason(START + HOUR);

    expect(localStorage.getItem(SEASON_ARCHIVE_PREFIX + 'S0')).toBe(old);
    expect(localStorage.getItem(ACHIEVEMENTS_KEY)).toBeNull();
    expect(readSeasonSimPoints()).toBe(0);
    expect(isSeasonLazy()).toBe(false);
    expect(isSeasonCheat()).toBe(false);
    expect(localStorage.getItem(SEASON_ID_KEY)).toBe(currentSeason().id);
  });

  it('同一赛季内再次进入不会清空进度', () => {
    ensureSeason(START + HOUR);
    addSeasonSimPoints(30);
    markSeasonLazy();
    ensureSeason(START + 2 * HOUR);
    expect(readSeasonSimPoints()).toBe(30);
    expect(isSeasonLazy()).toBe(true);
  });
});
