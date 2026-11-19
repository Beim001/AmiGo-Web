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
import { Trans, useTranslation } from 'react-i18next';

// 个人中心排行榜的「本赛季」「以往赛季」（第 55 题）：积分榜与全成就速通榜。
// 已验证账号可以举报其他玩家；ADMIN_EMAILS 中的管理员可以隐藏、恢复成绩或驳回举报。

export interface SeasonRankPanelProps {
  mode: 'current' | 'past';
  /** 本赛季的本地成绩（只在「本赛季」显示） */
  mine?: { score: number; completedMs: number | null; lazy: boolean; achieved: number; total: number; cheat?: boolean };
  /** 已验证的邮箱账号才能上榜 */
  canRank: boolean;
}

const LazyTag = () => {
  const { t } = useTranslation('season');
  return (
    <span className="text-[9px] font-black px-1 rounded border border-black bg-gray-500 text-white shrink-0" title={t('lazyHint')}>
      {t('lazy')}
    </span>
  );
};

export const SeasonRankPanel: React.FC<SeasonRankPanelProps> = ({ mode, mine, canRank }) => {
  const { t } = useTranslation('season');
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
            setNotice(t('readReportsFailed'));
          });
      })
      .catch(() => {
        setData(null);
        setError(t('serverUnavailable'));
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
        setNotice(t('reported'));
      })
      .catch((err) => setNotice(err instanceof AuthError && err.code === 'TOO_MANY_REQUESTS' ? t('reportTooFrequent') : t('reportFailed')));
  };

  const moderate = (uid: string, action: 'hide' | 'unhide' | 'dismiss') => {
    if (!season) return;
    moderateSeasonEntry(season.id, uid, action)
      .then(() => {
        setNotice(action === 'hide' ? t('hidden') : action === 'unhide' ? t('unhidden') : t('dismissed'));
        load();
      })
      .catch((err) => {
        console.warn('[赛季] 处理举报失败', action, uid, err);
        setNotice(t('actionFailed'));
      });
  };

  const smallBtn = 'text-[9px] font-black px-1.5 py-0.5 rounded border border-black cursor-pointer shrink-0';

  if (!season) {
    return (
      <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 text-center text-gray-400 text-xs font-bold shadow-[0_3px_0_#000]">
        {t('noPast')}
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
            <RefreshCw size={12} className={loading ? 'animate-spin text-yellow-400' : ''} /> {t('refresh')}
          </button>
        </div>
        <div className="text-[10px] text-gray-400 font-bold">
          {t('meta', { version: season.version, start: season.startAt.slice(0, 10), desc: season.desc })}
        </div>
      </div>

      {mode === 'current' && mine && (
        <div className="bg-gradient-to-r from-[#2a3852] to-[#1f283d] border-2 border-yellow-500/80 rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-1">
          <div className="flex items-center gap-1.5 text-white font-black text-xs">
            {t('mine')} {mine.lazy && <LazyTag />}
          </div>
          <div className="text-[11px] text-gray-200 font-bold">
            <Trans t={t} i18nKey="mineScore" values={{ score: mine.score.toLocaleString(), achieved: mine.achieved, total: mine.total }} components={{ s: <span className="text-yellow-300 font-black" /> }} />
          </div>
          <div className="text-[11px] text-gray-200 font-bold">
            {t('completion')}{mine.completedMs === null ? t('notCompleted') : <span className="text-emerald-300 font-black">{formatDuration(mine.completedMs)}</span>}
          </div>
          <div className="text-[9px] text-gray-400 font-bold">
            {t('formula', { achievementPoints: ACHIEVEMENT_POINTS, classMax: 6 * CLASS_POINTS })}
          </div>
          {mine.cheat ? (
            <div className="text-[10px] text-rose-300 font-bold">{t('cheatNotice')}</div>
          ) : (
            !canRank && <div className="text-[10px] text-amber-300 font-bold">{t('loginNotice')}</div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 bg-[#21232e] p-1 rounded-xl border-2 border-black gap-1 shadow-[0_2px_0_#000]">
        {([
          ['score', Trophy],
          ['speed', Timer],
        ] as const).map(([id, Icon]) => (
          <button
            key={id}
            onClick={() => setBoard(id)}
            className={`py-1.5 text-xs font-black rounded-lg border flex items-center justify-center gap-1 cursor-pointer ${
              board === id ? 'bg-yellow-400 text-black border-black shadow-[0_1px_0_#000]' : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <Icon size={13} /> {t(`boards.${id}`)}
          </button>
        ))}
      </div>

      {error && <div className="text-center text-gray-400 text-xs font-bold py-4">{error}</div>}
      {!error && data && data.list.length === 0 && (
        <div className="text-center text-gray-400 text-xs font-bold py-4">{board === 'speed' ? t('emptySpeed') : t('empty')}</div>
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
                  {r.isMe ? t('you') : ''}
                </span>
                {r.lazy && <LazyTag />}
              </span>
              <span className="text-yellow-400 font-black text-xs font-mono shrink-0">
                {board === 'speed' && r.completedMs !== null ? formatDuration(r.completedMs) : r.score.toLocaleString()}
              </span>
              {!r.isMe && data.admin && (
                <button onClick={() => moderate(r.uid, 'hide')} className={`${smallBtn} bg-rose-600 text-white`}>
                  {t('hide')}
                </button>
              )}
              {!r.isMe && !data.admin && canRank && (
                reported.includes(r.uid) ? (
                  <span className="text-[9px] text-gray-500 font-bold shrink-0">{t('alreadyReported')}</span>
                ) : confirmUid === r.uid ? (
                  <>
                    <button onClick={() => report(r.uid)} className={`${smallBtn} bg-rose-600 text-white`}>
                      {t('confirmReport')}
                    </button>
                    <button onClick={() => setConfirmUid(null)} className={`${smallBtn} bg-[#2d2f3d] text-gray-300`}>
                      {t('cancel')}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setConfirmUid(r.uid)} title={t('reportTitle', { reason: t(`reason.${board}`) })} className="text-gray-500 hover:text-rose-400 cursor-pointer shrink-0">
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
            ? t('excludedCheat')
            : data.me.excluded === 'hidden'
              ? t('excludedHidden')
              : t('myRank', { rank: data.me.rank ? t('rankValue', { rank: data.me.rank }) : board === 'speed' ? t('notCompletedAll') : t('unranked') })}
        </div>
      )}

      {!error && data?.admin && (
        <div className="bg-[#2d2f3d] border-2 border-rose-500/70 rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-1.5">
          <div className="flex items-center gap-1.5 text-white font-black text-xs">
            <ShieldAlert size={13} className="text-rose-400" /> {t('adminTitle')}
          </div>
          {reports === null ? (
            <div className="text-[10px] text-gray-400 font-bold">{t('loading')}</div>
          ) : reports.length === 0 ? (
            <div className="text-[10px] text-gray-400 font-bold">{t('noReports')}</div>
          ) : (
            reports.map((r) => (
              <div key={r.uid} className="bg-[#21232e] border border-black rounded-xl p-2 space-y-1">
                <div className="flex items-center gap-1 text-[11px] font-black text-white">
                  <span className="truncate flex-1 min-w-0">{r.name}</span>
                  {r.hidden && <span className="text-[9px] px-1 rounded bg-rose-700 text-white shrink-0">{t('hiddenTag')}</span>}
                  {r.cheat && <span className="text-[9px] px-1 rounded bg-gray-600 text-white shrink-0">{t('cheatTag')}</span>}
                  {r.lazy && <LazyTag />}
                </div>
                <div className="text-[10px] text-gray-300 font-bold">
                  {t('adminRow', { score: r.score.toLocaleString(), speed: r.completedMs === null ? t('adminNotCompleted') : formatDuration(r.completedMs) })}
                  {r.reports > 0 && t('adminReports', { count: r.reports, reasons: r.reasons.map((x) => t(`reason.${x}`)).join(t('listSeparator', { ns: 'common' })) })}
                </div>
                <div className="flex gap-1.5">
                  {r.hidden ? (
                    <button onClick={() => moderate(r.uid, 'unhide')} className={`${smallBtn} bg-emerald-600 text-white`}>
                      {t('unhide')}
                    </button>
                  ) : (
                    <button onClick={() => moderate(r.uid, 'hide')} className={`${smallBtn} bg-rose-600 text-white`}>
                      {t('hide')}
                    </button>
                  )}
                  {r.reports > 0 && (
                    <button onClick={() => moderate(r.uid, 'dismiss')} className={`${smallBtn} bg-[#2d2f3d] text-gray-300`}>
                      {t('dismiss')}
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
