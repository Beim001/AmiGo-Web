// 背景音乐与界面音效的播放（Howler.js），按 lib/settings.ts 的设置开关与调节音量。
// 浏览器要求用户先与页面交互才能出声：背景音乐在首次点击前播放失败时，等 Howler 解锁音频后自动重试。

import { Howl } from 'howler';
import { TRACKS, TrackId, getSettings, nextTrack } from './settings';

const BASE = `${import.meta.env.BASE_URL}audio/`;

export type SfxId = 'click' | 'month' | 'reward' | 'achievement';

let music: { id: TrackId; howl: Howl } | null = null;

const playTrack = (id: TrackId) => {
  music?.howl.unload();
  const track = TRACKS.find((t) => t.id === id)!;
  const s = getSettings();
  const howl = new Howl({
    src: [`${BASE}bgm/${track.file}`],
    // 长音乐边下边播，不必整首解码进内存
    html5: true,
    volume: s.bgmVolume,
    loop: s.track !== 'all',
    onend: () => {
      const latest = getSettings();
      if (latest.bgm && latest.track === 'all') playTrack(nextTrack(id, 'all'));
    },
    onplayerror: () => {
      howl.once('unlock', () => howl.play());
    },
    onloaderror: (_soundId, err) => console.warn(`[音频] 背景音乐 ${track.file} 加载失败`, err),
  });
  music = { id, howl };
  howl.play();
};

/** 按当前设置开始、切换、停止背景音乐或调整音量 */
export const syncMusic = () => {
  const s = getSettings();
  if (!s.bgm) {
    music?.howl.unload();
    music = null;
    return;
  }
  // 轮播时保持正在播的曲目；选了单曲则切到那一首
  const want = s.track === 'all' ? (music?.id ?? nextTrack(null, 'all')) : s.track;
  if (!music || music.id !== want) {
    playTrack(want);
    return;
  }
  music.howl.volume(s.bgmVolume);
  music.howl.loop(s.track !== 'all');
};

const sfxCache = new Map<SfxId, Howl>();

/** 播放一次界面音效（音效关闭时不出声） */
export const playSfx = (id: SfxId) => {
  const s = getSettings();
  if (!s.sfx || s.sfxVolume <= 0) return;
  let howl = sfxCache.get(id);
  if (!howl) {
    howl = new Howl({ src: [`${BASE}sfx/${id}.ogg`], onloaderror: (_soundId, err) => console.warn(`[音频] 音效 ${id} 加载失败`, err) });
    sfxCache.set(id, howl);
  }
  howl.volume(s.sfxVolume);
  howl.play();
};
