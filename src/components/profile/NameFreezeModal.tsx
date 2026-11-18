import { Check, AlertTriangle, History, FileText } from 'lucide-react';
import { formatUnlockTime, NameChange } from './useNameChange';
import { Trans, useTranslation } from 'react-i18next';

// 敏感词警告 / 改名冻结弹窗：显示违规计次、解封时间与违规改名记录

export const NameFreezeModal = ({ nameChange }: { nameChange: NameChange }) => {
  const { t } = useTranslation('profile');
  const { freezeModalInfo, setFreezeModalInfo, modalTab, setModalTab, politicalViolationLogs, nameFreezeUntil } = nameChange;
  if (!freezeModalInfo || !freezeModalInfo.show) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-in zoom-in-95 duration-150">
      <div className="bg-[#252632] border-4 border-black rounded-3xl max-w-sm w-full p-5 shadow-[0_10px_0_#000] relative text-white space-y-4">

        {/* 游戏风格顶栏横幅标题 (纯色系无渐变，风格统一) */}
        <div className="-mt-8 mx-auto w-fit bg-red-600 border-3 border-black rounded-2xl px-4 py-1.5 shadow-[0_4px_0_#000] flex items-center justify-center">
          <span className="text-white font-black text-sm tracking-wider drop-shadow-[0_2px_0_#000]">
            {freezeModalInfo.isFrozen ? t('freeze.frozenTitle') : t('freeze.warningTitle')}
          </span>
        </div>

        {/* 警告状态与计数标识 */}
        <div className="flex justify-center">
          <span className="bg-[#1b1c25] text-yellow-300 border-2 border-black font-black text-[11px] px-3 py-1 rounded-xl shadow-[0_2px_0_#000] flex items-center gap-1">
            <AlertTriangle size={13} className="text-amber-400" />
            <span>
              {freezeModalInfo.isFrozen ? t('freeze.frozenSubtitle') : t('freeze.warningSubtitle', { count: freezeModalInfo.violationCount })}
            </span>
          </span>
        </div>

        {/* 游戏内提示框/历史记录面板 */}
        <div className="bg-[#1b1c25] rounded-2xl p-4 border-3 border-black shadow-[0_4px_0_#000] text-xs leading-relaxed text-gray-200 min-h-[170px] flex flex-col justify-between">
          {modalTab === 'history' ? (
            <div className="space-y-2.5 text-left w-full">
              <div className="flex items-center justify-between pb-1.5 border-b-2 border-black">
                <span className="text-yellow-300 font-black text-xs flex items-center gap-1">
                  <History size={14} className="text-amber-400" /> {t('freeze.historyTitle', { count: politicalViolationLogs.length })}
                </span>
                <span className="text-[10px] text-gray-400 font-bold">{t('freeze.archive')}</span>
              </div>

              {politicalViolationLogs.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs font-bold space-y-1">
                  <FileText size={24} className="mx-auto text-gray-500 mb-1" />
                  <div>{t('freeze.noHistory')}</div>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {politicalViolationLogs.map((log) => (
                    <div key={log.id} className="bg-[#2a2c3a] border-2 border-black rounded-xl p-2.5 text-[11px] space-y-1 shadow-[0_2px_0_#000]">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">{t('freeze.attempted')}</span>
                        <span className="font-mono text-white font-black max-w-[140px] truncate">"{log.attemptedName}"</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">{t('freeze.matched')}</span>
                        <span className="text-red-400 font-mono font-black">[{log.matchedWord}]</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-gray-700/60 mt-1">
                        <span className="text-amber-400 font-bold">• {log.category}</span>
                        <span className="text-gray-400 font-mono">{formatUnlockTime(log.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {freezeModalInfo.isFrozen ? (
                <>
                  <p className="text-red-300 font-bold leading-normal">
                    <Trans t={t} i18nKey="freeze.frozenDesc" components={{ y: <span className="text-yellow-400 font-black" />, r: <span className="text-red-400 font-black" /> }} />
                  </p>
                  {freezeModalInfo.matchedWord && (
                    <div className="bg-[#2a2c3a] border-2 border-black rounded-xl p-2 text-[11px]">
                      <span className="text-gray-400">{t('freeze.blockedWord')}</span>
                      <span className="text-yellow-400 font-mono font-black">[{freezeModalInfo.matchedWord}]</span>
                    </div>
                  )}
                  <div className="bg-red-950 border-2 border-red-600 rounded-xl p-2.5 text-[11px] text-red-200 space-y-1">
                    <div className="font-bold flex items-center justify-between">
                      <span>{t('freeze.duration')}</span>
                      <span className="font-mono text-white font-black">{t('freeze.durationValue')}</span>
                    </div>
                    <div className="font-bold flex items-center justify-between">
                      <span>{t('freeze.unlockAt')}</span>
                      <span className="font-mono text-yellow-300 font-black">{formatUnlockTime(nameFreezeUntil)}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium">
                    {t('freeze.frozenTip')}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-amber-300 font-bold leading-normal">
                    <Trans t={t} i18nKey="freeze.warningDesc" components={{ r: <span className="text-red-400 font-black" /> }} />
                  </p>
                  {freezeModalInfo.matchedWord && (
                    <div className="bg-[#2a2c3a] border-2 border-black rounded-xl p-2 text-[11px]">
                      <span className="text-gray-400">{t('freeze.matchedWord')}</span>
                      <span className="text-yellow-400 font-mono font-black">[{freezeModalInfo.matchedWord}]</span>
                    </div>
                  )}
                  <div className="bg-amber-950 border-2 border-amber-600 rounded-xl p-2.5 text-[11px] text-amber-200 space-y-1">
                    <div className="font-black text-red-300 flex items-center justify-between">
                      <span>{t('freeze.violationCount')}</span>
                      <span className="font-mono text-yellow-300 text-sm font-black">{t('freeze.violationCountValue', { count: freezeModalInfo.violationCount })}</span>
                    </div>
                    <div className="text-[10px] text-red-400 font-bold">
                      {t('freeze.severeWarning')}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium">
                    {t('freeze.changeName')}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* 底部双按钮控制 (查看违规原因 + 确认知晓) */}
        <div className="flex gap-2.5 pt-1">
          <button
            onClick={() => setModalTab(modalTab === 'history' ? 'info' : 'history')}
            className="flex-1 bg-[#2a2c3a] hover:bg-[#36394d] text-yellow-300 font-black py-2.5 px-2 rounded-2xl border-3 border-black shadow-[0_4px_0_#000] active:translate-y-1 active:shadow-none transition-all text-[11px] cursor-pointer flex items-center justify-center gap-1"
          >
            <History size={14} className="text-amber-400" />
            <span>{modalTab === 'history' ? t('freeze.backToRules') : t('freeze.viewHistory')}</span>
          </button>

          <button
            onClick={() => {
              setFreezeModalInfo(null);
              setModalTab('info');
            }}
            className="flex-1 bg-amber-400 hover:bg-amber-300 text-black font-black py-2.5 px-2 rounded-2xl border-3 border-black shadow-[0_4px_0_#000] active:translate-y-1 active:shadow-none transition-all text-[11px] cursor-pointer flex items-center justify-center gap-1"
          >
            <Check size={15} strokeWidth={3} />
            <span>{t('freeze.acknowledge')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
