import { addLifeLog } from '../lib/lifeLog';
import React, { useState } from 'react';
import {
  ChevronLeft,
  UserCog,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CircleDollarSign,
  BadgeCheck,
  RefreshCw,
  User,
} from 'lucide-react';

export interface GenderRightsModalProps {
  onClose: () => void;
  isRegistered: boolean;
  playerName: string;
  gender: string | null;
  setGender: (newGender: string) => void;
  age: number;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  gameYear?: number;
  onOpenBirth?: () => void;
}

export const GenderRightsModal: React.FC<GenderRightsModalProps> = ({
  onClose,
  isRegistered,
  playerName,
  gender,
  setGender,
  age,
  coins,
  setCoins,
  onOpenBirth,
}) => {
  const currentGender = gender === '女' ? '女' : '男';
  const [selectedGender, setSelectedGender] = useState<'男' | '女'>(currentGender);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const CHANGE_FEE = 500;

  // Handle Gender Change Application
  const handleApplyGenderChange = () => {
    if (!isRegistered) {
      showToast('❌ 请先办理出生登记申领公民身份');
      return;
    }

    if (selectedGender === currentGender) {
      showToast(`当前法定性别已是【${currentGender}】，无需重复更正`);
      return;
    }

    if (coins < CHANGE_FEE) {
      showToast(`❌ 现金不足！更正规费需 ${CHANGE_FEE} ₽，当前拥有 ${coins.toLocaleString()} ₽`);
      return;
    }

    // Deduct fee and update gender
    setCoins((prev) => prev - CHANGE_FEE);
    setGender(selectedGender);
    try {
      localStorage.setItem('amigo_gender', selectedGender);
    } catch {}

    addLifeLog('成长', '变更法定性别', `法定性别由「${currentGender}」更正为「${selectedGender}」。`);
    showToast(`法定性别已更正为【${selectedGender}】！扣除规费 ${CHANGE_FEE} ₽`);
  };

  return (
    <div className="absolute inset-0 bg-[#12141c] flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-200 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#2d3042] text-white border-2 border-black font-bold text-xs px-4 py-2 rounded-xl shadow-[0_4px_0_#000] animate-in fade-in slide-in-from-top-2 duration-200 text-center max-w-[90%] truncate">
          {toastMsg}
        </div>
      )}

      {/* Top Header Bar */}
      <div className="relative w-full h-16 bg-[#1f2230] border-b-2 border-black shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20 flex items-center justify-between px-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-2 bg-[#2d3042] hover:bg-[#393d54] border-2 border-black rounded-xl active:translate-y-0.5 shadow-[0_2px_0_#000] cursor-pointer text-white flex items-center justify-center transition-all z-10"
        >
          <ChevronLeft size={20} className="text-white" strokeWidth={3} />
        </button>

        <div className="flex-1 flex items-center justify-center pointer-events-none px-2">
          <div className="bg-[#2a2d3e] border-2 border-purple-500/80 px-5 py-1.5 rounded-xl shadow-[0_3px_0_#000] flex items-center gap-2">
            <UserCog size={18} className="text-purple-400 flex-shrink-0" />
            <span className="text-purple-300 text-sm font-black tracking-wider">
              性别权利
            </span>
          </div>
        </div>

        <div className="flex items-center bg-[#151722] rounded-full px-2.5 py-1 border border-black text-xs font-mono font-black z-10 shadow-[0_2px_0_#000]">
          <CircleDollarSign size={14} className="text-yellow-400 mr-1" />
          <span className="text-amber-300">{coins.toLocaleString()} ₽</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 custom-scrollbar bg-[#181a24]">
        {!isRegistered ? (
          /* Unregistered Notice Card */
          <div className="bg-[#232635] border-2 border-black rounded-2xl p-5 text-center space-y-3.5 shadow-[0_4px_0_#000] max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-white font-black text-base">尚未办理出生登记</h3>
              <p className="text-gray-400 text-xs leading-relaxed max-w-sm mx-auto">
                你尚未登记公民身份。请先前往办理出生登记后，再行申办法定性别更正。
              </p>
            </div>
            {onOpenBirth && (
              <button
                onClick={() => {
                  onClose();
                  onOpenBirth();
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2.5 px-5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer transition-all inline-flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>前往办理出生登记</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 max-w-lg mx-auto">
            {/* Citizen Identity Overview Card */}
            <div className="bg-[#232635] border-2 border-black rounded-2xl p-4 sm:p-5 shadow-[0_4px_0_#000] space-y-4">
              {/* Header: Name & Gender Badge */}
              <div className="flex justify-between items-center pb-3 border-b border-black/40">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold mb-1">
                    <BadgeCheck size={14} className="text-emerald-400" />
                    <span>合法公民身份</span>
                  </div>
                  <div className="text-white font-black text-xl tracking-wide flex items-center gap-2">
                    <span>{playerName}</span>
                    <span className="text-xs text-gray-400 font-mono font-normal">
                      ({age} 岁)
                    </span>
                  </div>
                </div>

                <div
                  className={`px-3 py-1.5 rounded-xl border-2 border-black font-black text-xs flex items-center gap-1.5 shadow-[0_2px_0_#000] ${
                    currentGender === '女'
                      ? 'bg-pink-500/20 text-pink-300 border-pink-500/60'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/60'
                  }`}
                >
                  <span className="text-sm font-bold">
                    {currentGender === '女' ? '♀' : '♂'}
                  </span>
                  <span>{currentGender === '女' ? '法定性别：女' : '法定性别：男'}</span>
                </div>
              </div>

              {/* Status Row */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#181a24] border border-black rounded-xl p-3 flex items-center justify-between">
                  <span className="text-gray-400 font-bold">公民状态</span>
                  <span className="text-emerald-400 font-black flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>正式生效</span>
                  </span>
                </div>

                <div className="bg-[#181a24] border border-black rounded-xl p-3 flex items-center justify-between">
                  <span className="text-gray-400 font-bold">更正规费</span>
                  <span className="text-amber-300 font-mono font-bold">{CHANGE_FEE} ₽</span>
                </div>
              </div>
            </div>

            {/* Gender Affirmation Form Card */}
            <div className="bg-[#232635] border-2 border-black rounded-2xl p-4 sm:p-5 shadow-[0_4px_0_#000] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-white">
                  <RefreshCw size={15} className="text-purple-400" />
                  <span>法定性别更正</span>
                </div>
                <span className="text-[11px] text-gray-400">
                  确认后即时生效
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Male Option */}
                <button
                  type="button"
                  onClick={() => setSelectedGender('男')}
                  className={`p-4 rounded-2xl border-2 border-black flex flex-col items-center gap-2 transition-all cursor-pointer active:translate-y-0.5 ${
                    selectedGender === '男'
                      ? 'bg-blue-600/30 border-blue-400 shadow-[0_3px_0_#1e3a8a]'
                      : 'bg-[#181a24] text-gray-400 hover:bg-[#1f2230]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 text-3xl font-black">
                    ♂
                  </div>
                  <span className="text-sm font-black text-blue-200">认同为男性</span>
                  {currentGender === '男' && (
                    <span className="text-[10px] bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded border border-blue-500/40 font-bold">
                      当前性别
                    </span>
                  )}
                </button>

                {/* Female Option */}
                <button
                  type="button"
                  onClick={() => setSelectedGender('女')}
                  className={`p-4 rounded-2xl border-2 border-black flex flex-col items-center gap-2 transition-all cursor-pointer active:translate-y-0.5 ${
                    selectedGender === '女'
                      ? 'bg-pink-600/30 border-pink-400 shadow-[0_3px_0_#831843]'
                      : 'bg-[#181a24] text-gray-400 hover:bg-[#1f2230]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 text-3xl font-black">
                    ♀
                  </div>
                  <span className="text-sm font-black text-pink-200">认同为女性</span>
                  {currentGender === '女' && (
                    <span className="text-[10px] bg-pink-900/60 text-pink-300 px-2 py-0.5 rounded border border-pink-500/40 font-bold">
                      当前性别
                    </span>
                  )}
                </button>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleApplyGenderChange}
                disabled={selectedGender === currentGender}
                className={`w-full font-black text-xs py-3.5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 ${
                  selectedGender === currentGender
                    ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed opacity-70'
                    : 'bg-[#88508a] hover:bg-[#9d5e9f] text-white cursor-pointer'
                }`}
              >
                <BadgeCheck size={16} />
                <span>
                  {selectedGender === currentGender
                    ? `当前法定性别已是【${currentGender}】`
                    : `确认更正为【${selectedGender}】 (支付 ${CHANGE_FEE} ₽)`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
