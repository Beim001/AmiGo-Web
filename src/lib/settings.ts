// 系统设置（issue #36）：背景音乐、界面音效（开关与音量）、背景音乐曲目、减少动画。
// 设置只属于这台设备：存在本机，重置人生时保留，不随云存档同步。

/** 背景音乐曲目（素材来源见 public/audio/CREDITS.md，全部为 CC0） */
export const TRACKS = [
  { id: 'home-town', name: 'Home Town', author: 'Juhani Junkala', file: 'home-town.ogg' },
  { id: 'where-time-stands-still', name: 'Where Time Stands Still', author: 'Juhani Junkala', file: 'where-time-stands-still.ogg' },
  { id: 'sunshine-coast', name: 'Sunshine Coast', author: 'Juhani Junkala', file: 'sunshine-coast.ogg' },
  { id: 'bazaar', name: 'Bazaar', author: 'Juhani Junkala', file: 'bazaar.ogg' },
  { id: 'oriental', name: 'Oriental', author: 'shadowfire452', file: 'oriental.mp3' },
  { id: 'old-tower-inn', name: 'The Old Tower Inn', author: 'RandomMind', file: 'old-tower-inn.mp3' },
] as const;

export type TrackId = (typeof TRACKS)[number]['id'];
/** all：按顺序轮播全部曲目；否则单曲循环 */
export type TrackChoice = 'all' | TrackId;

export interface Settings {
  bgm: boolean;
  sfx: boolean;
  /** 0–1 */
  bgmVolume: number;
  /** 0–1 */
  sfxVolume: number;
  track: TrackChoice;
  /** 减少动画：关掉弹窗滑入、开箱等动效 */
  reduceMotion: boolean;
}

export const SETTINGS_KEY = 'amigo_settings';

/** 默认设置；减少动画默认跟随系统的「减少动态效果」 */
export const defaultSettings = (systemReducedMotion: boolean): Settings => ({
  bgm: true,
  sfx: true,
  bgmVolume: 0.5,
  sfxVolume: 0.7,
  track: 'all',
  reduceMotion: systemReducedMotion,
});

const clampVolume = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback);
const isTrackChoice = (v: unknown): v is TrackChoice => v === 'all' || TRACKS.some((t) => t.id === v);

/** 读取存档中的设置；缺失或损坏的字段用默认值 */
export const parseSettings = (raw: unknown, systemReducedMotion: boolean): Settings => {
  const d = defaultSettings(systemReducedMotion);
  if (!raw || typeof raw !== 'object') return d;
  const s = raw as Partial<Record<keyof Settings, unknown>>;
  return {
    bgm: typeof s.bgm === 'boolean' ? s.bgm : d.bgm,
    sfx: typeof s.sfx === 'boolean' ? s.sfx : d.sfx,
    bgmVolume: clampVolume(s.bgmVolume, d.bgmVolume),
    sfxVolume: clampVolume(s.sfxVolume, d.sfxVolume),
    track: isTrackChoice(s.track) ? s.track : d.track,
    reduceMotion: typeof s.reduceMotion === 'boolean' ? s.reduceMotion : d.reduceMotion,
  };
};

/** 当前曲目播完后的下一首：轮播时按顺序循环；单曲时一直是这一首 */
export const nextTrack = (current: TrackId | null, choice: TrackChoice): TrackId => {
  if (choice !== 'all') return choice;
  const i = current ? TRACKS.findIndex((t) => t.id === current) : -1;
  return TRACKS[(i + 1) % TRACKS.length].id;
};

// ---------- 全局设置（多个组件共用，变化时通知订阅者） ----------

const systemReducedMotion = () => {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  } catch (e) {
    return false;
  }
};

const read = (): Settings => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return parseSettings(saved ? JSON.parse(saved) : null, systemReducedMotion());
  } catch (e) {
    return defaultSettings(systemReducedMotion());
  }
};

let current: Settings | null = null;
const listeners = new Set<() => void>();

export const getSettings = (): Settings => (current ??= read());

export const updateSettings = (patch: Partial<Settings>) => {
  current = { ...getSettings(), ...patch };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('[设置] 保存失败', e);
  }
  listeners.forEach((l) => l());
};

export const subscribeSettings = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
