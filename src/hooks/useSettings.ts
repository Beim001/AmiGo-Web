import React, { useSyncExternalStore } from 'react';
import { getSettings, subscribeSettings, updateSettings } from '../lib/settings';
import { playSfx, syncMusic } from '../lib/audio';

/** 读取系统设置，设置变化时重新渲染；返回 [设置, 更新函数] */
export const useSettings = () => [useSyncExternalStore(subscribeSettings, getSettings), updateSettings] as const;

/**
 * 让系统设置生效（由 App 调用一次）：按设置播放或停止背景音乐；点击任意按钮时播放点击音效；
 * 打开「减少动画」时给根元素加上 reduce-motion 类（样式见 index.css）。
 */
export const useSettingsEffects = () => {
  const [settings] = useSettings();

  React.useEffect(() => syncMusic(), [settings.bgm, settings.bgmVolume, settings.track]);

  React.useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion);
  }, [settings.reduceMotion]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest('button')) playSfx('click');
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
};
