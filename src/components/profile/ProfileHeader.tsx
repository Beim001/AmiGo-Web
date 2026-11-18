import { Lock, ShieldCheck, Copy, Check, Edit2, X, Info, Mail, Camera } from 'lucide-react';
import { reputationLevel } from '../../lib/reputation';
import { TOTAL_CLOTHING_COUNT } from '../ShopModal';
import type { ProfileModalProps } from '../ProfileModal';
import type { NameChange } from './useNameChange';
import type { JobPosition } from './InfoTab';

// 个人中心顶部名片：头像、昵称与改名、身份标签、邮箱、UID，以及声望、推演积分、服装数

interface ProfileHeaderProps
  extends Pick<ProfileModalProps, 'playerName' | 'isRegistered' | 'age' | 'authUser' | 'onOpenAuth' | 'setIsAvatarModalOpen' | 'renderAvatarContent' | 'reputation' | 'simScore'> {
  nameChange: NameChange;
  currentJob: JobPosition | null;
  displayUid: string;
  fullUid: string;
  copiedUid: boolean;
  handleCopyUid: () => void;
  ownedClothingCount: number;
}

export const ProfileHeader = ({
  nameChange,
  playerName,
  isRegistered,
  age,
  authUser,
  onOpenAuth,
  setIsAvatarModalOpen,
  renderAvatarContent,
  reputation,
  simScore,
  currentJob,
  displayUid,
  fullUid,
  copiedUid,
  handleCopyUid,
  ownedClothingCount,
}: ProfileHeaderProps) => {
  const { isEditingName, setIsEditingName, nameInput, setNameInput, handleSaveName, remainingQuota, politicalViolationCount, nameFreezeUntil, setFreezeModalInfo } = nameChange;
  return (
    <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] relative">
      <div className="flex items-center gap-4">
        {/* Interactive Avatar Frame */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div
            onClick={() => setIsAvatarModalOpen(true)}
            className="relative w-20 h-20 rounded-2xl bg-[#181924] border-2 border-black p-1 shadow-[0_4px_0_#000] flex items-center justify-center overflow-hidden cursor-pointer hover:scale-105 active:scale-95 transition-all group shrink-0"
            title="点击打开头像选择设置界面"
          >
            <div className="w-full h-full bg-[#1b1c25] rounded-xl flex items-center justify-center overflow-hidden relative">
              {renderAvatarContent()}
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-black/80 text-yellow-400 text-[8px] font-black py-0.5 text-center border-t border-black backdrop-blur-xs flex items-center justify-center gap-0.5 group-hover:bg-amber-400 group-hover:text-black transition-colors">
              <Camera size={9} />
              <span>更换</span>
            </div>
          </div>
        </div>

        {/* User Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <div className="flex flex-col gap-1.5 w-full">
                <div className="flex items-center gap-1.5 w-full">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    maxLength={10}
                    placeholder="2-10字非敏感名称"
                    className="bg-[#1b1c25] text-white font-black text-xs px-2 py-1 rounded border-2 border-yellow-400 focus:outline-none flex-1 min-w-0"
                  />
                  <button
                    onClick={handleSaveName}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black p-1.5 rounded border border-black shadow-[0_1px_0_#000] cursor-pointer flex-shrink-0"
                    title="保存昵称"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false);
                      setNameInput(playerName);
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-black p-1.5 rounded border border-black cursor-pointer flex-shrink-0"
                    title="取消"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[9px] text-yellow-300 font-bold bg-[#1b1c25] px-2 py-0.5 rounded border border-yellow-500/40">
                  <div className="flex items-center gap-1">
                    <Info size={10} className="text-yellow-400" />
                    <span>本月改名额度: <span className="font-mono text-white">{remainingQuota}/2</span></span>
                  </div>
                  {politicalViolationCount > 0 ? (
                    <span className="text-red-400 font-mono font-bold">敏感词警示: {politicalViolationCount}/3次</span>
                  ) : (
                    <span className="text-gray-400">禁敏感词/官方伪冒</span>
                  )}
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-white font-black text-base truncate">{playerName}</h2>
                {nameFreezeUntil > Date.now() ? (
                  <button
                    onClick={() => {
                      setFreezeModalInfo({
                        show: true,
                        isFrozen: true,
                        violationCount: politicalViolationCount,
                      });
                    }}
                    className="text-red-400 hover:text-red-300 p-1 cursor-pointer flex items-center gap-1 text-[10px] font-bold bg-red-950/80 px-1.5 py-0.5 rounded border border-red-500/60"
                    title="改名功能已冻结，点击查看解封时间"
                  >
                    <Lock size={11} className="text-red-400" />
                    <span>已冻结 (查看)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (nameFreezeUntil > Date.now()) {
                        setFreezeModalInfo({
                          show: true,
                          isFrozen: true,
                          violationCount: politicalViolationCount,
                        });
                        return;
                      }
                      setNameInput(playerName);
                      setIsEditingName(true);
                    }}
                    className="text-yellow-400 hover:text-yellow-300 p-1 cursor-pointer flex items-center gap-1 text-[10px] font-bold bg-[#1b1c25] px-1.5 py-0.5 rounded border border-yellow-500/40"
                  >
                    <Edit2 size={12} />
                    <span>改名</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Title & UID */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded border border-black shadow-[0_1px_0_#000]">
              {isRegistered ? `帝国公民 · ${age} 岁` : '未登记公民'}
            </span>
            <span className="bg-purple-900/80 text-purple-200 text-[10px] font-black px-2 py-0.5 rounded border border-purple-500">
              {currentJob ? currentJob.title : '待业'}
            </span>
          </div>

          {/* Clean Single Email Box */}
          {authUser?.email && (
            <div
              onClick={() => {
                if (onOpenAuth) {
                  onOpenAuth();
                }
              }}
              className="mt-1.5 text-[10px] text-amber-300 font-mono font-bold bg-[#1b1c25] hover:bg-[#232635] px-2 py-1 rounded-lg border border-yellow-500/30 flex items-center justify-between gap-1 cursor-pointer transition-all active:scale-98 shadow-[0_1px_0_#000]"
              title="点击打开 AmiGo 账户中心（管理账号 / 退出登录）"
            >
              <div className="flex items-center gap-1 min-w-0">
                <Mail size={11} className="text-yellow-400 shrink-0" />
                <span className="truncate">{authUser.email}</span>
              </div>
              <div className="text-[9px] text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/50 px-1.5 py-0.5 rounded shrink-0 font-sans font-bold flex items-center gap-0.5 transition-all">
                <ShieldCheck size={10} className="text-emerald-400" />
                <span>已验证 (账户中心)</span>
              </div>
            </div>
          )}

          {/* UID Row */}
          <div className="flex items-center justify-between gap-2 mt-2 text-gray-300 text-xs font-mono font-bold">
            <div className="flex items-center gap-2">
              <span>
                UID: <span className="text-yellow-300 font-bold">{displayUid}</span>
                {authUser?.uid && <span className="text-[9px] text-gray-400 font-normal ml-1">(前8位)</span>}
              </span>
              <button
                onClick={handleCopyUid}
                className="text-gray-200 hover:text-white flex items-center gap-1 bg-[#1b1c25] hover:bg-[#252838] px-2 py-0.5 rounded border border-black cursor-pointer text-[10px] active:scale-95 transition-all shadow-[0_1px_0_#000]"
                title={`完整 UID: ${fullUid} (点击复制全称)`}
              >
                {copiedUid ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                <span>{copiedUid ? '已复制' : '复制完整UID'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stat Bar */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-700/80 text-center">
        <div className="bg-[#21232e] p-2 rounded-xl border border-black">
          <div className="text-[10px] text-gray-400 font-bold">声望等级</div>
          <div className="text-yellow-400 font-black text-xs mt-0.5">{reputationLevel(reputation)} ({reputation})</div>
        </div>
        <div className="bg-[#21232e] p-2 rounded-xl border border-black">
          <div className="text-[10px] text-gray-400 font-bold">推演积分</div>
          <div className="text-white font-black text-xs mt-0.5">{simScore} 分</div>
        </div>
        <div className="bg-[#21232e] p-2 rounded-xl border border-black">
          <div className="text-[10px] text-gray-400 font-bold">拥有服装</div>
          <div className="text-emerald-400 font-black text-xs mt-0.5">{ownedClothingCount} / {TOTAL_CLOTHING_COUNT} 套</div>
        </div>
      </div>
    </div>
  );
};
