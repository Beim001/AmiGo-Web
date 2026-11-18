import React from 'react';
import { User } from 'lucide-react';
import { CurrencyIcon } from './CurrencyIcon';
import { AppUser } from '../lib/bilibiliToy';

// 顶部栏：玩家头像、昵称、现金（卢布）余额与个人中心入口

export const TopBar = ({
  coins,
  playerName,
  onOpenProfile,
  onOpenBank,
  onOpenWealthChart,
  avatarContent,
}: {
  coins: number,
  playerName: string,
  onOpenProfile: () => void,
  onOpenBank?: () => void,
  onOpenWealthChart?: () => void,
  onOpenAuth?: () => void,
  authUser?: AppUser | null,
  avatarContent?: React.ReactNode,
}) => (
  <div className="flex justify-between items-center bg-[#252632] px-3 py-2.5 border-b-2 border-black z-20 shadow-md">
    <div className="flex items-center gap-1.5 min-w-0">
      <div
        onClick={onOpenProfile}
        className="flex items-center gap-2 bg-[#1b1c25] rounded-lg pl-1 pr-2 py-1.5 border-2 border-black relative cursor-pointer hover:border-yellow-400 transition-all active:scale-95 shadow-[0_2px_0_#000] shrink-0"
      >
        <div className="w-8 h-8 bg-[#181924] border-2 border-black rounded-lg flex items-center justify-center absolute -left-1.5 -top-1.5 shadow-[0_2px_0_#000] overflow-hidden">
          {avatarContent || <User size={18} className="text-white" strokeWidth={2.5} />}
        </div>
        <span className="text-[11px] text-white ml-6 font-black truncate max-w-[80px]">{playerName}</span>
        <span className="text-[9px] bg-yellow-400 text-black font-extrabold px-1 rounded border border-black ml-1 flex-shrink-0">
          我的
        </span>
      </div>
    </div>

    <div className="flex gap-1.5 items-center shrink-0">
      <div
        onClick={onOpenWealthChart || onOpenBank}
        title="点击查看个人资产全景"
        className={`flex items-center bg-[#1b1c25] rounded-full pl-1 pr-2.5 py-1 border-2 border-black ${(onOpenWealthChart || onOpenBank) ? 'cursor-pointer hover:border-yellow-400 active:scale-95 transition-all' : ''}`}
      >
        <div className="w-5 h-5 bg-yellow-400 rounded-full border border-yellow-700 flex justify-center items-center mr-1">
          <CurrencyIcon size={13} className="text-yellow-700" strokeWidth={3} />
        </div>
        <span className="font-black text-white text-xs font-mono">{coins.toLocaleString()}</span>
      </div>
    </div>
  </div>
);
