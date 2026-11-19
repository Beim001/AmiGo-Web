import React from 'react';
import { Baby, Settings, Volume2, VolumeX, Music, Sparkles, RotateCcw, Save, LogOut } from 'lucide-react';
import type { ProfileModalProps } from '../ProfileModal';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { TRACKS, TrackChoice } from '../../lib/settings';

// 「系统设置」标签页：简洁模式、背景音乐与音效（开关、音量、曲目）、减少动画、保存进度、重置人生、退出登录

type Toggle = React.Dispatch<React.SetStateAction<boolean>>;

interface SettingsTabProps
  extends Pick<ProfileModalProps, 'simpleMode' | 'onToggleSimpleMode' | 'onSaveProgress' | 'onResetLife' | 'setCoins' | 'onClose' | 'onLogout'> {
  showToast: (msg: string) => void;
  confirmReset: boolean;
  setConfirmReset: Toggle;
  confirmLogout: boolean;
  setConfirmLogout: Toggle;
}

export const SettingsTab = ({
  simpleMode,
  onToggleSimpleMode,
  onSaveProgress,
  onResetLife,
  setCoins,
  onClose,
  onLogout,
  showToast,
  confirmReset,
  setConfirmReset,
  confirmLogout,
  setConfirmLogout,
}: SettingsTabProps) => {
  const { t } = useTranslation('profile');
  const [settings, updateSettings] = useSettings();

  const renderSwitch = (on: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className={`w-12 h-6 rounded-full border-2 border-black relative transition-colors cursor-pointer shrink-0 ${on ? 'bg-yellow-400' : 'bg-gray-700'}`}
    >
      <div className={`w-4 h-4 rounded-full bg-black absolute top-0.5 transition-transform ${on ? 'left-6' : 'left-0.5'}`}></div>
    </button>
  );

  const renderVolume = (label: string, value: number, onChange: (v: number) => void) => (
    <label className="flex items-center gap-2 text-[11px] text-gray-300 font-bold">
      <span className="shrink-0 w-14">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="flex-1 accent-yellow-400 cursor-pointer"
      />
      <span className="w-9 text-right font-mono">{Math.round(value * 100)}%</span>
    </label>
  );
  return (
    <div className="space-y-3">
      <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-3">
        <h3 className="text-white font-black text-sm mb-2 flex items-center gap-2 border-b border-gray-700/80 pb-2">
          <Settings size={16} className="text-yellow-400" /> {t('settings.title')}
        </h3>

        <div className="flex justify-between items-center bg-[#21232e] p-3 rounded-xl border border-black">
          <div className="flex items-center gap-2">
            <Baby size={18} className={simpleMode ? 'text-yellow-400' : 'text-gray-500'} />
            <div>
              <div className="text-white font-black text-xs">{t('settings.simpleMode')}</div>
              <div className="text-gray-400 text-[10px]">{t('settings.simpleModeDesc')}</div>
            </div>
          </div>
          <button
            onClick={onToggleSimpleMode}
            className={`w-12 h-6 rounded-full border-2 border-black relative transition-colors cursor-pointer shrink-0 ${simpleMode ? 'bg-yellow-400' : 'bg-gray-700'}`}
            title={t('settings.simpleModeToggle')}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white border border-black transition-all ${simpleMode ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>

        <div className="bg-[#21232e] p-3 rounded-xl border border-black space-y-2.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {settings.bgm ? <Music size={18} className="text-yellow-400" /> : <VolumeX size={18} className="text-gray-500" />}
              <div>
                <div className="text-white font-black text-xs">{t('settings.bgm')}</div>
                <div className="text-gray-400 text-[10px]">{t('settings.bgmDesc')}</div>
              </div>
            </div>
            {renderSwitch(settings.bgm, () => {
              updateSettings({ bgm: !settings.bgm });
              showToast(settings.bgm ? t('settings.bgmOff') : t('settings.bgmOn'));
            })}
          </div>
          {settings.bgm && (
            <>
              {renderVolume(t('settings.bgmVolume'), settings.bgmVolume, (v) => updateSettings({ bgmVolume: v }))}
              <label className="flex items-center gap-2 text-[11px] text-gray-300 font-bold">
                <span className="shrink-0 w-14">{t('settings.track')}</span>
                <select
                  value={settings.track}
                  onChange={(e) => updateSettings({ track: e.target.value as TrackChoice })}
                  className="flex-1 min-w-0 bg-[#2d2f3d] text-white text-[11px] font-bold px-2 py-1.5 rounded-lg border border-black focus:outline-none focus:border-yellow-400"
                >
                  <option value="all">{t('settings.trackAll')}</option>
                  {TRACKS.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.name} · {track.author}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>

        <div className="bg-[#21232e] p-3 rounded-xl border border-black space-y-2.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {settings.sfx ? <Volume2 size={18} className="text-yellow-400" /> : <VolumeX size={18} className="text-gray-500" />}
              <div>
                <div className="text-white font-black text-xs">{t('settings.sfx')}</div>
                <div className="text-gray-400 text-[10px]">{t('settings.sfxDesc')}</div>
              </div>
            </div>
            {renderSwitch(settings.sfx, () => {
              updateSettings({ sfx: !settings.sfx });
              showToast(settings.sfx ? t('settings.sfxOff') : t('settings.sfxOn'));
            })}
          </div>
          {settings.sfx && renderVolume(t('settings.sfxVolume'), settings.sfxVolume, (v) => updateSettings({ sfxVolume: v }))}
        </div>

        <div className="flex justify-between items-center bg-[#21232e] p-3 rounded-xl border border-black">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className={settings.reduceMotion ? 'text-gray-500' : 'text-yellow-400'} />
            <div>
              <div className="text-white font-black text-xs">{t('settings.reduceMotion')}</div>
              <div className="text-gray-400 text-[10px]">{t('settings.reduceMotionDesc')}</div>
            </div>
          </div>
          {renderSwitch(settings.reduceMotion, () => {
            updateSettings({ reduceMotion: !settings.reduceMotion });
            showToast(settings.reduceMotion ? t('settings.reduceMotionOff') : t('settings.reduceMotionOn'));
          })}
        </div>
      </div>

      <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-3">
        <h3 className="text-white font-black text-sm mb-2 flex items-center gap-2 border-b border-gray-700/80 pb-2">
          <RotateCcw size={16} className="text-rose-400" /> {t('settings.saveTitle')}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              if (!onSaveProgress) {
                showToast(t('settings.localOnly'));
                return;
              }
              showToast((await onSaveProgress()) ? t('settings.saveOk') : t('settings.saveFailed'));
            }}
            className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black py-2.5 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer active:translate-y-0.5 flex items-center justify-center gap-1.5"
          >
            <Save size={14} /> {t('settings.save')}
          </button>
          {confirmReset ? (
            <div className="flex items-center gap-1.5 bg-[#21232e] p-1.5 rounded-xl border border-rose-500/50">
              <span className="text-[10px] text-rose-300 font-bold px-1">{t('settings.resetConfirm')}</span>
              <button
                onClick={() => {
                  setConfirmReset(false);
                  if (onResetLife) {
                    onResetLife();
                  } else {
                    setCoins(10000);
                    showToast(t('settings.resetDone'));
                  }
                  onClose();
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-lg border border-black cursor-pointer shadow-[0_1px_0_#000]"
              >
                {t('settings.confirm')}
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-[10px] font-black px-2 py-1 rounded-lg border border-black cursor-pointer"
              >
                {t('settings.cancel')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="bg-rose-900/80 hover:bg-rose-800 text-rose-200 text-xs font-black px-4 py-2.5 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer active:translate-y-0.5"
            >
              {t('settings.reset')}
            </button>
          )}
        </div>

        {onLogout && (
          <div className="pt-3 border-t border-gray-700/80 mt-2">
            {confirmLogout ? (
              <div className="flex items-center justify-between gap-2 bg-[#21232e] p-2 rounded-xl border-2 border-red-500/80 animate-in fade-in duration-150">
                <span className="text-xs text-red-300 font-bold">{t('settings.logoutConfirm')}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={async () => {
                      setConfirmLogout(false);
                      if (await onLogout()) {
                        onClose();
                      } else {
                        showToast(t('settings.logoutSyncFailed'));
                      }
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-lg border border-black cursor-pointer shadow-[0_1px_0_#000] active:scale-95"
                  >
                    {t('settings.logoutConfirmButton')}
                  </button>
                  <button
                    onClick={() => setConfirmLogout(false)}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-black px-3 py-1.5 rounded-lg border border-black cursor-pointer active:scale-95"
                  >
                    {t('settings.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmLogout(true)}
                className="w-full bg-[#1b1c25] hover:bg-red-950/40 text-red-400 text-xs font-black py-2.5 rounded-xl border-2 border-red-900 shadow-[0_2px_0_#000] cursor-pointer active:translate-y-0.5 flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut size={14} /> {t('settings.logout')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
