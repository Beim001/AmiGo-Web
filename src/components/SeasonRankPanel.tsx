import React, { useEffect, useState } from 'react';
import { Timer, Trophy, RefreshCw, Flag, ShieldAlert } from 'lucide-react';
import { currentSeason, pastSeasons, SeasonDef } from '../data/seasons';
import {
  AuthError,
  fetchSeasonBoard,
  fetchSeasonReports,
  moderateSeasonEntry,
  reportSeasonEntry,
  SeasonBoard,
  SeasonBoardId,
  SeasonReportRow,
} from '../lib/authClient';
import { formatDuration, ACHIEVEMENT_POINTS, CLASS_POINTS } from '../lib/season';

// 个人中心排行榜的「本赛季」「以往赛季」（第 55 题）：积分榜与全成就速通榜。
// 已验证账号可以举报其他玩家；ADMIN_EMAILS 中的管理员可以隐藏、恢复成绩或驳回举报。

const REASON_LABEL: Record<SeasonBoardId, string> = { score: '积分异常', speed: '用时异常' };

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
  const [board, setBoard] = useState<SeasonBoardId>('score');
  const [data, setData] = useState<SeasonBoard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<SeasonReportRow[] | null>(null);
  const [confirmUid, setConfirmUid] = useState<string | null>(null);
  const [reported, setReported] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const load = () => {
    if (!season) return;
    setLoading(true);
    setError(null);
    fetchSeasonBoard(season.id, board)
      .then((d) => {
        setData(d);
        if (!d.admin) return;
        fetchSeasonReports(season.id)
          .then(setReports)
          .catch((err) => {
            console.warn('[赛季] 读取举报列表失败', err);
            setNotice('读取举报列表失败');
          });
      })
      .catch(() => {
        setData(null);
        setError('暂时无法连接赛季排行服务器');
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, [season?.id, board]);

  const report = (uid: string) => {
    if (!season) return;
    setConfirmUid(null);
    reportSeasonEntry(season.id, uid, board)
      .then(() => {
        setReported((prev) => [...prev, uid]);
        setNotice('已举报，管理员会核查这条成绩');
      })
      .catch((err) => setNotice(err instanceof AuthError && err.code === 'TOO_MANY_REQUESTS' ? '举报太频繁，请稍后再试' : '举报失败，请稍后重试'));
  };

  const moderate = (uid: string, action: 'hide' | 'unhide' | 'dismiss') => {
    if (!season) return;
    moderateSeasonEntry(season.id, uid, action)
      .then(() => {
        setNotice(action === 'hide' ? '已隐藏该成绩' : action === 'unhide' ? '已恢复该成绩' : '已驳回举报');
        load();
      })
      .catch((err) => {
        console.warn('[赛季] 处理举报失败', action, uid, err);
        setNotice('操作失败，请稍后重试');
      });
  };

  const smallBtn = 'text-[9px] font-black px-1.5 py-0.5 rounded border border-black cursor-pointer shrink-0';

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
              key={r.uid}
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
              {!r.isMe && data.admin && (
                <button onClick={() => moderate(r.uid, 'hide')} className={`${smallBtn} bg-rose-600 text-white`}>
                  隐藏
                </button>
              )}
              {!r.isMe && !data.admin && canRank && (
                reported.includes(r.uid) ? (
                  <span className="text-[9px] text-gray-500 font-bold shrink-0">已举报</span>
                ) : confirmUid === r.uid ? (
                  <>
                    <button onClick={() => report(r.uid)} className={`${smallBtn} bg-rose-600 text-white`}>
                      确认举报
                    </button>
                    <button onClick={() => setConfirmUid(null)} className={`${smallBtn} bg-[#2d2f3d] text-gray-300`}>
                      取消
                    </button>
                  </>
                ) : (
                  <button onClick={() => setConfirmUid(r.uid)} title={`举报：${REASON_LABEL[board]}`} className="text-gray-500 hover:text-rose-400 cursor-pointer shrink-0">
                    <Flag size={12} />
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}
      {notice && <div className="text-center text-[10px] text-amber-300 font-bold">{notice}</div>}
      {!error && data?.me && (
        <div className="text-center text-[11px] text-gray-300 font-bold">
          {data.me.excluded === 'cheat'
            ? '本赛季用过测试兑换码，成绩不参与排名'
            : data.me.excluded === 'hidden'
              ? '你的本赛季成绩经核查已被管理员隐藏'
              : `我的名次：${data.me.rank ? `第 ${data.me.rank} 名` : board === 'speed' ? '尚未集齐全成就' : '未上榜'}`}
        </div>
      )}

      {!error && data?.admin && (
        <div className="bg-[#2d2f3d] border-2 border-rose-500/70 rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-1.5">
          <div className="flex items-center gap-1.5 text-white font-black text-xs">
            <ShieldAlert size={13} className="text-rose-400" /> 排行管理：待处理举报与已隐藏成绩
          </div>
          {reports === null ? (
            <div className="text-[10px] text-gray-400 font-bold">读取中…</div>
          ) : reports.length === 0 ? (
            <div className="text-[10px] text-gray-400 font-bold">暂无待处理的举报</div>
          ) : (
            reports.map((r) => (
              <div key={r.uid} className="bg-[#21232e] border border-black rounded-xl p-2 space-y-1">
                <div className="flex items-center gap-1 text-[11px] font-black text-white">
                  <span className="truncate flex-1 min-w-0">{r.name}</span>
                  {r.hidden && <span className="text-[9px] px-1 rounded bg-rose-700 text-white shrink-0">已隐藏</span>}
                  {r.cheat && <span className="text-[9px] px-1 rounded bg-gray-600 text-white shrink-0">测试码</span>}
                  {r.lazy && <LazyTag />}
                </div>
                <div className="text-[10px] text-gray-300 font-bold">
                  积分 {r.score.toLocaleString()} · 速通 {r.completedMs === null ? '未集齐' : formatDuration(r.completedMs)}
                  {r.reports > 0 && ` · 举报 ${r.reports} 次（${r.reasons.map((x) => REASON_LABEL[x] ?? x).join('、')}）`}
                </div>
                <div className="flex gap-1.5">
                  {r.hidden ? (
                    <button onClick={() => moderate(r.uid, 'unhide')} className={`${smallBtn} bg-emerald-600 text-white`}>
                      恢复
                    </button>
                  ) : (
                    <button onClick={() => moderate(r.uid, 'hide')} className={`${smallBtn} bg-rose-600 text-white`}>
                      隐藏
                    </button>
                  )}
                  {r.reports > 0 && (
                    <button onClick={() => moderate(r.uid, 'dismiss')} className={`${smallBtn} bg-[#2d2f3d] text-gray-300`}>
                      驳回举报
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
