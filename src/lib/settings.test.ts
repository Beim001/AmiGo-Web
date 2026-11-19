import { describe, expect, it } from 'vitest';
import { TRACKS, defaultSettings, nextTrack, parseSettings } from './settings';

describe('系统设置的读取', () => {
  it('没有存档时用默认值，减少动画跟随系统设置', () => {
    expect(parseSettings(null, false)).toEqual(defaultSettings(false));
    expect(parseSettings(null, true).reduceMotion).toBe(true);
  });

  it('已保存的减少动画以玩家选择为准，不再跟随系统', () => {
    expect(parseSettings({ reduceMotion: false }, true).reduceMotion).toBe(false);
  });

  it('音量限制在 0–1，无效的字段与曲目回到默认值', () => {
    const s = parseSettings({ bgmVolume: 3, sfxVolume: -1, bgm: 'yes', track: 'no-such-track' }, false);
    expect(s.bgmVolume).toBe(1);
    expect(s.sfxVolume).toBe(0);
    expect(s.bgm).toBe(defaultSettings(false).bgm);
    expect(s.track).toBe('all');
  });
});

describe('背景音乐轮播', () => {
  it('全部轮播时按顺序播放，最后一首后回到第一首', () => {
    expect(nextTrack(null, 'all')).toBe(TRACKS[0].id);
    expect(nextTrack(TRACKS[0].id, 'all')).toBe(TRACKS[1].id);
    expect(nextTrack(TRACKS[TRACKS.length - 1].id, 'all')).toBe(TRACKS[0].id);
  });

  it('选了单曲时一直循环这一首', () => {
    expect(nextTrack('bazaar', 'bazaar')).toBe('bazaar');
    expect(nextTrack(null, 'oriental')).toBe('oriental');
  });
});
