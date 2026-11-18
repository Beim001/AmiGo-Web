import { User, Swords, RussianRuble, Crown, Trophy, RefreshCw, Upload, UserCheck } from 'lucide-react';
import { SeasonRankPanel } from '../SeasonRankPanel';
import type { ProfileModalProps } from '../ProfileModal';
import type { RankBoard } from './useRankBoard';

// 「排行榜」标签页：B 站 Toy SDK 财富榜与推演榜（周期切换、上报成绩、同步 B 站资料），以及本赛季 / 以往赛季排行

interface RankTabProps extends Pick<ProfileModalProps, 'playerName' | 'lazy' | 'coins' | 'simScore' | 'bilibiliAvatar' | 'seasonMine' | 'canRankSeason'> {
  rank: RankBoard;
  handleSyncBilibiliProfile: () => void;
}

export const RankTab = ({ rank, handleSyncBilibiliProfile, playerName, lazy, coins, simScore, bilibiliAvatar, seasonMine, canRankSeason }: RankTabProps) => {
  const { board, setBoard, period, setPeriod, rankList, myRank, isSdkLoading, refreshRankData, handleSubmitScore } = rank;
  return (
    <div className="space-y-3">
      {/* SDK Action Top Bar */}
      <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3 shadow-[0_4px_0_#000] space-y-2">
        <div className="flex items-center justify-between border-b border-gray-700/80 pb-2">
          <div className="flex items-center gap-1.5">
            <Trophy size={18} className="text-yellow-400" />
            <span className="text-white font-black text-xs">全服帝国荣耀榜</span>
            <span className="text-[9px] bg-pink-500/20 text-pink-300 border border-pink-500/50 px-1.5 py-0.2 rounded font-bold">
              Toy SDK 连通
            </span>
          </div>
          <button
            onClick={() => refreshRankData(board, period)}
            disabled={isSdkLoading}
            className="text-gray-300 hover:text-white flex items-center gap-1 bg-[#21232e] px-2 py-1 rounded-lg border border-black text-[10px] font-black cursor-pointer active:scale-95"
          >
            <RefreshCw size={12} className={isSdkLoading ? 'animate-spin text-yellow-400' : ''} />
            <span>{isSdkLoading ? '同步中...' : '刷新榜单'}</span>
          </button>
        </div>

        {/* Action Buttons: Sync Bilibili Profile & Submit Score */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleSyncBilibiliProfile}
            className="bg-[#fb7299] hover:bg-[#e05d83] text-white text-[11px] font-black py-2 px-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] flex items-center justify-center gap-1 cursor-pointer active:translate-y-0.5"
          >
            <UserCheck size={14} />
            <span>同步B站资料</span>
          </button>
          <button
            onClick={handleSubmitScore}
            className="bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black py-2 px-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] flex items-center justify-center gap-1 cursor-pointer active:translate-y-0.5"
          >
            <Upload size={14} />
            <span>上报我的成绩</span>
          </button>
        </div>
      </div>

      {/* Board Selector (1: 财富榜, 3: 推演榜, 10: 本赛季, 11: 以往赛季) */}
      <div className="grid grid-cols-4 bg-[#21232e] p-1 rounded-xl border-2 border-black gap-1 shadow-[0_2px_0_#000]">
        <button
          onClick={() => setBoard(1)}
          className={`py-1.5 text-xs font-black rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
            board === 1
              ? 'bg-amber-400 text-black border-black shadow-[0_1px_0_#000]'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <RussianRuble size={13} />
          <span>帝国财富榜</span>
        </button>
        <button
          onClick={() => setBoard(3)}
          className={`py-1.5 text-xs font-black rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
            board === 3
              ? 'bg-sky-400 text-black border-black shadow-[0_1px_0_#000]'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <Swords size={13} />
          <span>推演战绩榜</span>
        </button>
        {([
          [10, '本赛季'],
          [11, '以往赛季'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setBoard(id)}
            className={`py-1.5 text-xs font-black rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
              board === id ? 'bg-yellow-400 text-black border-black shadow-[0_1px_0_#000]' : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <Trophy size={13} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {board >= 10 ? (
        <SeasonRankPanel key={board} mode={board === 10 ? 'current' : 'past'} mine={seasonMine} canRank={canRankSeason} />
      ) : (
      <>

      {/* Period Selector (week / month / all / day) */}
      <div className="flex items-center justify-between bg-[#21232e] px-2 py-1 rounded-xl border border-black text-xs font-bold">
        <span className="text-gray-400 text-[10px]">统计周期:</span>
        <div className="flex gap-1">
          {(
            [
              { id: 'week', label: '本周' },
              { id: 'month', label: '本月' },
              { id: 'all', label: '总榜' },
              { id: 'day', label: '今日' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all cursor-pointer ${
                period === p.id
                  ? 'bg-white text-black border-black shadow-[0_1px_0_#000]'
                  : 'text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* My Current Rank Card */}
      <div className="bg-gradient-to-r from-[#2a3852] to-[#1f283d] border-2 border-yellow-500/80 rounded-2xl p-3 shadow-[0_3px_0_#000] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-400 border-2 border-black flex items-center justify-center font-black text-black text-sm shadow-[0_2px_0_#000] flex-shrink-0">
            {myRank.ranked ? `第${myRank.rank}名` : '未上榜'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-black text-xs">{playerName}</span>
              {lazy && <span className="text-[9px] font-black px-1 rounded border border-black bg-gray-500 text-white" title="这一世用过简洁模式">偷懒</span>}
              <span className="bg-yellow-400 text-black text-[9px] font-black px-1.5 rounded border border-black">
                我
              </span>
            </div>
            <div className="text-gray-300 text-[10px] font-mono mt-0.5">
              当前积分: <span className="text-yellow-300 font-bold">{myRank.score > 0 ? myRank.score.toLocaleString() : (board === 1 ? coins : simScore).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleSubmitScore}
          className="bg-yellow-400 hover:bg-yellow-300 text-black text-[10px] font-black px-3 py-1.5 rounded-lg border border-black shadow-[0_1px_0_#000] cursor-pointer active:scale-95"
        >
          刷新名次
        </button>
      </div>

      {/* Rank List Items */}
      <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-2 shadow-[0_4px_0_#000] space-y-1.5">
        {rankList.map((item) => {
          const isMe = item.nickname.includes(playerName) || item.nickname.includes('(你)');
          return (
            <div
              key={item.rank}
              className={`flex items-center justify-between p-2 rounded-xl border-2 transition-all ${
                isMe
                  ? 'bg-[#3b3524] border-yellow-400 shadow-[0_2px_0_#000]'
                  : item.rank === 1
                  ? 'bg-[#3d321d] border-amber-500'
                  : item.rank === 2
                  ? 'bg-[#2a303a] border-slate-400'
                  : item.rank === 3
                  ? 'bg-[#332822] border-amber-700'
                  : 'bg-[#21232e] border-black'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Rank Crown/Badge */}
                <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 font-black text-xs">
                  {item.rank === 1 ? (
                    <Crown size={20} className="text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" strokeWidth={2.5} />
                  ) : item.rank === 2 ? (
                    <Crown size={18} className="text-slate-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" strokeWidth={2.5} />
                  ) : item.rank === 3 ? (
                    <Crown size={18} className="text-amber-600 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" strokeWidth={2.5} />
                  ) : (
                    <span className="text-gray-400 font-mono font-black text-xs">#{item.rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-8 h-8 rounded-lg bg-[#1b1c25] border border-black flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                  {item.avatar || (isMe && bilibiliAvatar) ? (
                    <img src={item.avatar || (isMe && bilibiliAvatar) || ''} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={18} className="text-gray-400" />
                  )}
                </div>

                {/* Nickname & Label */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-black truncate max-w-[110px] ${isMe ? 'text-yellow-300' : 'text-white'}`}>
                      {item.nickname}
                    </span>
                    {isMe && (
                      <span className="bg-yellow-400 text-black text-[8px] font-black px-1 rounded border border-black flex-shrink-0">
                        你
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-gray-400 font-mono">
                    {board === 1 ? '现金资产' : '推演胜分'}
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className="text-right flex-shrink-0 pl-2">
                <div className="text-yellow-400 font-black text-xs font-mono">
                  {item.score.toLocaleString()}
                </div>
                <div className="text-[9px] text-gray-500 font-bold">
                  {item.rank <= 3 ? '👑 殿堂级' : '排名有效'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-gray-500 text-[10px] font-bold">
        * 排行榜数据通过 B站 Toy SDK 实时接入 · 跨终端同步
      </div>
      </>
      )}
    </div>
  );
};
