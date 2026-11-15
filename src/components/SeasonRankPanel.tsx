import React, { useEffect, useState } from 'react';
import { Timer, Trophy, RefreshCw } from 'lucide-react';
import { currentSeason, pastSeasons, SeasonDef } from '../data/seasons';
import { fetchSeasonBoard, SeasonBoard } from '../lib/authClient';
import { formatDuration, ACHIEVEMENT_POINTS, CLASS_POINTS } from '../lib/season';

// 个人中心排行榜的「本赛季」「以往赛季」（第 55 题）：积分榜与全成就速通榜

export interface SeasonRankPanelProps {
  mode: 'current' | 'past';
  /** 本赛季的本地成绩（只在「本赛季」显示） */
  mine?: { score: number; completedMs: number | null; lazy: boolean; achieved: number; total: number; cheat?: boolean };
  /** 已验证的邮箱账号才能上榜 */
  canRank: boolean;
}

const LazyTag = () => (
  <span className="text-[9px] font-black px-1 rounded border border-black bg-gray-500 text-white shrink-0" title="本赛季用过简洁模式">
    偷懒
  </span>
);

export const SeasonRankPanel: React.FC<SeasonRankPanelProps> = ({ mode, mine, canRank }) => {
  const past = pastSeasons();
  const [season, setSeason] = useState<SeasonDef | null>(mode === 'current' ? currentSeason() : past[0] ?? null);
  const [board, setBoard] = useState<'score' | 'speed'>('score');
  const [data, setData] = useState<SeasonBoard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    if (!season) return;
    setLoading(true);
    setError(null);
    fetchSeasonBoard(season.id, board)
      .then((d) => setData(d))
      .catch(() => {
        setData(null);
        setError('暂时无法连接赛季排行服务器');
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, [season?.id, board]);

  if (!season) {
    return (
      <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 text-center text-gray-400 text-xs font-bold shadow-[0_3px_0_#000]">
        暂无以往赛季。赛季会在大版本更新（更改底层规则、新增玩法、过渡到阿苏 / 新联邦时代）时更换。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-1">
        <div className="flex items-center justify-between">
          {mode === 'past' && past.length > 1 ? (
            <select
              value={season.id}
              onChange={(e) => setSeason(past.find((s) => s.id === e.target.value) ?? null)}
              className="bg-[#21232e] text-white text-xs font-black rounded-lg border border-black px-2 py-1"
            >
              {past.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-white font-black text-sm">{season.name}</span>
          )}
          <button onClick={load} className="text-gray-300 hover:text-white flex items-center gap-1 text-[10px] font-black cursor-pointer">
            <RefreshCw size={12} className={loading ? 'animate-spin text-yellow-400' : ''} /> 刷新
          </button>
        </div>
        <div className="text-[10px] text-gray-400 font-bold">
          版本 {season.version} · {season.startAt.slice(0, 10)} 开始 · {season.desc}
        </div>
      </div>

      {mode === 'current' && mine && (
        <div className="bg-gradient-to-r from-[#2a3852] to-[#1f283d] border-2 border-yellow-500/80 rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-1">
          <div className="flex items-center gap-1.5 text-white font-black text-xs">
            我的本赛季成绩 {mine.lazy && <LazyTag />}
          </div>
          <div className="text-[11px] text-gray-200 font-bold">
            赛季积分 <span className="text-yellow-300 font-black">{mine.score.toLocaleString()}</span> · 成就 {mine.achieved} / {mine.total}
          </div>
          <div className="text-[11px] text-gray-200 font-bold">
            全成就用时 {mine.completedMs === null ? '尚未集齐' : <span className="text-emerald-300 font-black">{formatDuration(mine.completedMs)}</span>}
          </div>
          <div className="text-[9px] text-gray-400 font-bold">
            赛季积分 = 本赛季成就 × {ACHIEVEMENT_POINTS} + 本赛季推演积分 + 家族阶层（乞丐 0 至皇族 {6 * CLASS_POINTS}）
          </div>
          {mine.cheat ? (
            <div className="text-[10px] text-rose-300 font-bold">本赛季使用过测试兑换码，成绩不计入赛季排行。</div>
          ) : (
            !canRank && <div className="text-[10px] text-amber-300 font-bold">登录并验证邮箱账号后，成绩才会进入全服赛季排行。</div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 bg-[#21232e] p-1 rounded-xl border-2 border-black gap-1 shadow-[0_2px_0_#000]">
        {([
          ['score', '积分榜', Trophy],
          ['speed', '全成就速通榜', Timer],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setBoard(id)}
            className={`py-1.5 text-xs font-black rounded-lg border flex items-center justify-center gap-1 cursor-pointer ${
              board === id ? 'bg-yellow-400 text-black border-black shadow-[0_1px_0_#000]' : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {error && <div className="text-center text-gray-400 text-xs font-bold py-4">{error}</div>}
      {!error && data && data.list.length === 0 && (
        <div className="text-center text-gray-400 text-xs font-bold py-4">{board === 'speed' ? '还没有人集齐本赛季的全部成就' : '还没有人上榜'}</div>
      )}
      {!error && data && data.list.length > 0 && (
        <div className="space-y-1.5">
          {data.list.map((r) => (
            <div
              key={`${r.rank}_${r.name}`}
              className={`flex items-center gap-2 p-2 rounded-xl border-2 ${r.isMe ? 'bg-[#3b3524] border-yellow-400' : 'bg-[#21232e] border-black'}`}
            >
              <span className={`w-7 text-center font-black text-xs ${r.rank <= 3 ? 'text-yellow-400' : 'text-gray-400'}`}>#{r.rank}</span>
              <span className="flex-1 min-w-0 flex items-center gap-1">
                <span className={`font-black text-xs truncate ${r.isMe ? 'text-yellow-300' : 'text-white'}`}>
                  {r.name}
                  {r.isMe ? '（你）' : ''}
                </span>
                {r.lazy && <LazyTag />}
              </span>
              <span className="text-yellow-400 font-black text-xs font-mono shrink-0">
                {board === 'speed' && r.completedMs !== null ? formatDuration(r.completedMs) : r.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
      {!error && data?.me && (
        <div className="text-center text-[11px] text-gray-300 font-bold">
          我的名次：{data.me.rank ? `第 ${data.me.rank} 名` : board === 'speed' ? '尚未集齐全成就' : '未上榜'}
        </div>
      )}
    </div>
  );
};
