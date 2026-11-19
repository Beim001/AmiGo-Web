import React from 'react';
import { useTranslation } from 'react-i18next';
import type { useCloudSave } from '../lib/cloudSave';

/** 云端存档冲突：本机与云端都有不同的进度时，让玩家选择保留哪一份；没有冲突时不渲染 */
export const CloudConflictDialog: React.FC<{ cloud: ReturnType<typeof useCloudSave> }> = ({ cloud }) => {
  const { t, i18n } = useTranslation('app');
  if (!cloud.conflict) return null;
  return (
    <div className="fixed inset-0 z-[120] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#2d2f3d] border-4 border-black rounded-2xl p-4 max-w-sm w-full shadow-[0_8px_0_#000] space-y-3 text-white">
        <h3 className="font-black text-base text-center">{t('cloudConflict.title')}</h3>
        <p className="text-xs text-gray-300 font-bold leading-relaxed text-center">{t('cloudConflict.desc')}</p>
        {cloud.conflict.remoteUpdatedAt && (
          <p className="text-[11px] text-gray-400 font-bold text-center">
            {t('cloudConflict.remoteSavedAt', { time: new Date(cloud.conflict.remoteUpdatedAt).toLocaleString(i18n.language) })}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => void cloud.resolveConflict('cloud')}
            className="bg-sky-400 hover:bg-sky-300 text-black text-xs font-black py-2.5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] cursor-pointer"
          >
            {t('cloudConflict.useCloud')}
          </button>
          <button
            onClick={() => void cloud.resolveConflict('local')}
            className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-black py-2.5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] cursor-pointer"
          >
            {t('cloudConflict.useLocal')}
          </button>
        </div>
      </div>
    </div>
  );
};
