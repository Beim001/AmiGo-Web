import React from 'react';
import { Gem, Crown, Plane, Globe, Baby, Hospital, TrendingUp, Home, Heart, Users, Award, Scroll, GitFork, Gift, Trophy, Star, Flower2, HandHeart, Frown, Shirt, Scissors, Soup, Sofa } from 'lucide-react';
import { CurrencyIcon } from '../CurrencyIcon';
import { readAchievements, ACHIEVEMENTS, formatRealTime } from '../../lib/achievements';
import type { ProfileModalProps } from '../ProfileModal';

// 「成就勋章」标签页：完成时间为现实时间，跨人生保留；集齐后可播放致谢名单

export const AchievementTab = ({ onPlayCredits }: Pick<ProfileModalProps, 'onPlayCredits'>) => {
  const record = readAchievements();
  const icons: Record<string, React.ElementType> = {
    baby: Baby, coins: CurrencyIcon, home: Home, heart: Heart, users: Users, gift: Gift, gem: Gem, crown: Crown,
    chart: TrendingUp, plane: Plane, globe: Globe, hospital: Hospital, cake: Star, tree: GitFork, trophy: Trophy, scroll: Scroll,
    handheart: HandHeart, flower: Flower2, frown: Frown, shirt: Shirt, scissors: Scissors, soup: Soup, sofa: Sofa,
  };
  const done = ACHIEVEMENTS.filter((a) => record[a.id]).length;
  return (
    <div className="space-y-3">
      <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3 shadow-[0_3px_0_#000] flex items-center justify-between">
        <span className="text-white font-black text-xs">已达成 {done} / {ACHIEVEMENTS.length}</span>
        {done === ACHIEVEMENTS.length ? (
          <button
            onClick={onPlayCredits}
            className="bg-yellow-400 hover:bg-yellow-300 text-black text-[10px] font-black px-2.5 py-1 rounded-lg border-2 border-black cursor-pointer"
          >
            🎬 播放致谢名单
          </button>
        ) : (
          <span className="text-[10px] text-gray-400 font-bold">集齐全部成就将解锁致谢名单</span>
        )}
      </div>
      {ACHIEVEMENTS.map((ach) => {
        const at = record[ach.id];
        const Icon = icons[ach.icon] ?? Award;
        return (
          <div
            key={ach.id}
            className={`border-2 border-black rounded-2xl p-3 flex items-center gap-3 shadow-[0_3px_0_#000] ${at ? 'bg-[#2d2f3d]' : 'bg-[#21232e] opacity-75'}`}
          >
            <div className={`w-11 h-11 rounded-xl border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[0_2px_0_#000] ${at ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-gray-400'}`}>
              <Icon size={22} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-black text-xs">{ach.title}</h4>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border border-black ${at ? 'bg-emerald-900/80 text-emerald-300' : 'bg-gray-800 text-gray-400'}`}>
                  {at ? '已解锁' : '未解锁'}
                </span>
              </div>
              <p className="text-gray-300 text-[11px] font-bold mt-0.5">{ach.desc}</p>
              <div className="text-[10px] text-gray-400 font-mono mt-1">{at ? `${formatRealTime(at)} 达成` : '尚未达成'}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
