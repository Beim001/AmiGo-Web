import React, { useState } from 'react';
import { Wrench, X, FastForward, Baby, Cake, Square, Trophy, Gift } from 'lucide-react';
import { CurrencyIcon } from './CurrencyIcon';
import { GIFTS, GIFT_QUALITY_STYLE } from '../lib/gifts';
import { formatDuration } from '../lib/season';
import { propertyUpkeep, REPOSSESS_AFTER_MONTHS, UpkeepProperty } from '../lib/homeUpkeep';
import { CLOTHING_COUPON_CODE, saveCouponLeft } from '../lib/clothingCoupon';

// 开发测试工具：仅在 `npm run dev` 下由 App 渲染（import.meta.env.DEV），生产构建中不存在。
// 悬浮在所有界面之上：调整现金、一键快进月份、编辑年龄、新增子嗣、发放礼物、成就与赛季上报测试。
// 约定：新增需要手动测试的功能时，同步在这里加测试入口。

interface DevToolsPanelProps {
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  isRegistered: boolean;
  age: number;
  gameYear: number;
  gameMonth: number;
  /** 正在快进时剩余的月数（0 = 未在快进） */
  fastForwardRemaining: number;
  onFastForward: (months: number) => void;
  onStopFastForward: () => void;
  onSetAge: (age: number) => void;
  onAddChild: (twins: boolean) => void;
  /** 新增一位 30 岁、未婚的子女（测试强制相亲与包办婚姻，第 73 题） */
  onAddAdultChild: () => void;
  /** 所有在职家人立即失业（测试失业潮对零花与家族财力的影响，第 73 题） */
  onKinLayoff: () => void;
  /** 已解锁 / 全部成就数 */
  achievementProgress: [number, number];
  onUnlockAllAchievements: () => void;
  /** 立即在本月开办一场拍卖会 */
  onOpenAuctionNow: () => void;
  /** 简洁模式开关（第 49 题） */
  simpleMode: boolean;
  onToggleSimpleMode: () => void;
  /** 快进时智能安排（自动看病、推演、送礼与人生选择） */
  /** 外貌（第 61 题） */
  onRandomAppearance: () => void;
  onToggleBeauty: () => void;
  /** 抗体（第 53 题） */
  antibodyText: string;
  onGrantAllAntibodies: () => void;
  onClearAntibodies: () => void;
  smartFastForward: boolean;
  onToggleSmartFastForward: () => void;
  onClearAchievements: () => void;
  /** 把限定保底计数设为差一抽（测试成就「大非酋」） */
  onSetLimitedPity: () => void;
  /** 礼物背包件数 */
  giftTotal: number;
  /** 累计赠礼次数（成就「兄友弟恭」「手有余香」） */
  giftsGiven: number;
  onAddGifts: (ids: string[]) => void;
  onClearGifts: () => void;
  onAddGiftsGiven: (count: number) => void;
  /** 不在职时本月父母会给的零花（含明细） */
  allowancePreview: string;
  /** 把在世父母的好感度设为指定值（测试零花的 30% 门槛） */
  onSetParentAffinity: (value: number) => void;
  /** 向服务器上报一条指定的赛季成绩，返回服务器实际记录的值；未登录已验证邮箱账号时为 undefined */
  onTestSeasonSubmit?: (score: number, completedMs: number | null) => Promise<{ score: number; completedMs: number | null }>;
}

const QUICK_ADD = [10_000, 100_000, 1_000_000];
const QUICK_SET = [0, 9_999_999];
const QUICK_MONTHS: Array<[number, string]> = [[1, '+1 月'], [12, '+1 年'], [60, '+5 年'], [120, '+10 年']];
const MIN_AGE = 8;
const MAX_AGE = 120;
const MAX_FAST_FORWARD_MONTHS = 1200;
const FAKE_SEASON_SCORE = 9_999_999;
const FAKE_COMPLETION_MS = 1000;

const clampCoins = (value: number) => Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value)));

type Tab = 'money' | 'time' | 'age' | 'child' | 'gift' | 'achievement';

export const DevToolsPanel: React.FC<DevToolsPanelProps> = ({
  coins,
  setCoins,
  isRegistered,
  age,
  gameYear,
  gameMonth,
  fastForwardRemaining,
  onFastForward,
  onStopFastForward,
  onSetAge,
  onAddChild,
  onAddAdultChild,
  onKinLayoff,
  achievementProgress,
  onUnlockAllAchievements,
  onOpenAuctionNow,
  simpleMode,
  onToggleSimpleMode,
  smartFastForward,
  onToggleSmartFastForward,
  antibodyText,
  onGrantAllAntibodies,
  onRandomAppearance,
  onToggleBeauty,
  onClearAntibodies,
  onClearAchievements,
  onSetLimitedPity,
  giftTotal,
  giftsGiven,
  onAddGifts,
  onClearGifts,
  onAddGiftsGiven,
  allowancePreview,
  onSetParentAffinity,
  onTestSeasonSubmit,
}) => {
  const [open, setOpen] = useState(false);
  const [seasonTestResult, setSeasonTestResult] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('money');
  const [amountInput, setAmountInput] = useState('');
  const [monthsInput, setMonthsInput] = useState('');
  const [ageInput, setAgeInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const parseNumber = (text: string, min: number, max: number, label: string): number | null => {
    const value = Number(text.replace(/[,\s_]/g, ''));
    if (!text.trim() || !Number.isFinite(value) || value < min || value > max) {
      setError(`${label}需在 ${min.toLocaleString()}–${max.toLocaleString()} 之间`);
      return null;
    }
    setError(null);
    return Math.floor(value);
  };

  const addCoins = (amount: number) => setCoins((prev) => clampCoins(prev + amount));
  const setExact = (amount: number) => setCoins(clampCoins(amount));

  const btn =
    'bg-[#2d2f3d] hover:bg-[#3a3d4f] text-white text-[11px] font-black py-1.5 rounded-lg border border-black shadow-[0_1px_0_#000] active:translate-y-px cursor-pointer font-mono disabled:opacity-40 disabled:cursor-not-allowed';
  const input =
    'w-full bg-[#21232e] text-white text-xs font-mono px-2 py-1.5 rounded-lg border border-black focus:outline-none focus:border-fuchsia-500 mb-1.5';
  const label = 'text-[10px] text-gray-400 font-bold mb-1';
  const needRegistered = !isRegistered && <div className="text-[10px] text-amber-300 font-bold">请先完成出生登记</div>;
  const busy = fastForwardRemaining > 0;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="开发测试工具（仅开发模式）"
        className="absolute right-2 bottom-[84px] z-[90] w-9 h-9 rounded-full bg-fuchsia-600 hover:bg-fuchsia-500 border-2 border-black shadow-[0_2px_0_#000] flex items-center justify-center text-white opacity-80 hover:opacity-100 active:scale-95 cursor-pointer"
      >
        {busy ? <FastForward size={16} className="animate-pulse" /> : <Wrench size={16} strokeWidth={2.5} />}
      </button>
    );
  }

  return (
    <div className="absolute right-2 bottom-[84px] z-[90] w-64 bg-[#1b1c25] border-2 border-fuchsia-500 rounded-2xl shadow-[0_4px_0_#000] p-3 text-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Wrench size={14} className="text-fuchsia-400" />
          <span className="text-xs font-black">开发测试工具</span>
          <span className="text-[9px] bg-fuchsia-900/80 text-fuchsia-200 border border-fuchsia-500/60 px-1 rounded font-bold">DEV</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white cursor-pointer" title="收起">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-6 gap-1 mb-2">
        {([
          ['money', '金钱', CurrencyIcon],
          ['time', '快进', FastForward],
          ['age', '年龄', Cake],
          ['child', '家人', Baby],
          ['gift', '礼物', Gift],
          ['achievement', '成就', Trophy],
        ] as const).map(([id, text, Icon]) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              setError(null);
            }}
            className={`flex flex-col items-center gap-0.5 py-1 rounded-lg border text-[10px] font-black cursor-pointer ${
              tab === id ? 'bg-fuchsia-600 border-black text-white' : 'bg-[#21232e] border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Icon size={12} />
            {text}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between bg-[#21232e] rounded-lg border border-black px-2 py-1.5 mb-2 text-[10px] font-bold">
        <span className="text-gray-400">
          {gameYear}.{gameMonth < 10 ? `0${gameMonth}` : gameMonth} · {isRegistered ? `${age} 岁` : '未登记'}
        </span>
        <span className="flex items-center gap-1 text-yellow-300 font-black font-mono">
          <CurrencyIcon size={11} />
          {coins.toLocaleString()}
        </span>
      </div>

      {tab === 'money' && (
        <>
          <div className={label}>快速增加</div>
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            {QUICK_ADD.map((amount) => (
              <button key={amount} onClick={() => addCoins(amount)} className={btn}>
                +{amount >= 1_000_000 ? `${amount / 1_000_000}M` : `${amount / 1_000}K`}
              </button>
            ))}
          </div>
          <div className={label}>快速设置</div>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {QUICK_SET.map((amount) => (
              <button key={amount} onClick={() => setExact(amount)} className={btn}>
                = {amount.toLocaleString()}
              </button>
            ))}
          </div>
          <div className={label}>自定义金额</div>
          <input value={amountInput} onChange={(e) => setAmountInput(e.target.value)} inputMode="numeric" placeholder="例如 250000" className={input} />
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                const v = parseNumber(amountInput, 0, Number.MAX_SAFE_INTEGER, '金额');
                if (v !== null) addCoins(v);
              }}
              className={btn}
            >
              增加
            </button>
            <button
              onClick={() => {
                const v = parseNumber(amountInput, 0, Number.MAX_SAFE_INTEGER, '金额');
                if (v !== null) setExact(v);
              }}
              className={btn}
            >
              设为
            </button>
          </div>
        </>
      )}

      {tab === 'time' && (
        <>
          <div className={label}>一键快进（逐月完整结算：工资、居家开销、利息、股市、健康、疾病、生育）</div>
          {busy ? (
            <div className="space-y-1.5">
              <div className="text-xs font-black text-fuchsia-300 text-center">快进中… 剩余 {fastForwardRemaining} 个月</div>
              <button onClick={onStopFastForward} className={`${btn} w-full flex items-center justify-center gap-1`}>
                <Square size={11} /> 停止
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {QUICK_MONTHS.map(([months, text]) => (
                  <button key={months} onClick={() => onFastForward(months)} className={btn}>
                    {text}
                  </button>
                ))}
              </div>
              <div className={label}>自定义月数</div>
              <input value={monthsInput} onChange={(e) => setMonthsInput(e.target.value)} inputMode="numeric" placeholder="例如 36" className={input} />
              <button
                onClick={() => {
                  const v = parseNumber(monthsInput, 1, MAX_FAST_FORWARD_MONTHS, '月数');
                  if (v !== null) onFastForward(v);
                }}
                className={`${btn} w-full`}
              >
                快进
              </button>
              <label className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-gray-300 cursor-pointer select-none">
                <input type="checkbox" checked={smartFastForward} onChange={onToggleSmartFastForward} className="accent-fuchsia-500" />
                智能安排：自动看病、处理推演（选稳妥）、给父母配偶送礼，并替你求职、结婚、买房
              </label>
              <div className="text-[9px] text-gray-500 font-bold mt-1.5">角色去世时会自动停止。</div>
              <button disabled={!isRegistered} onClick={onOpenAuctionNow} className={`${btn} w-full mt-2`}>
                立即开办本月拍卖会
              </button>
              <button
                onClick={() => {
                  // 测试第 76 题：名下房产全部设为已拖欠 6 个月，现金不足时再推进一个月就会被收回
                  try {
                    const list = JSON.parse(localStorage.getItem('amigo_owned_properties') || '[]') as UpkeepProperty[];
                    if (!Array.isArray(list) || list.length === 0) {
                      setError('名下没有房产');
                      return;
                    }
                    const next = list.map((h) => ({
                      ...h,
                      upkeepArrears: Math.max(h.upkeepArrears || 0, propertyUpkeep(h, gameYear) * REPOSSESS_AFTER_MONTHS),
                      upkeepArrearsMonths: REPOSSESS_AFTER_MONTHS,
                    }));
                    localStorage.setItem('amigo_owned_properties', JSON.stringify(next));
                    setError(null);
                  } catch (e) {
                    setError('房产存档读取失败');
                  }
                }}
                className={`${btn} w-full mt-1.5`}
              >
                名下房产设为欠费 {REPOSSESS_AFTER_MONTHS} 个月（测试收回房产）
              </button>
              <div className="text-[9px] text-gray-500 font-bold mt-1">再把现金设为 0 并快进 1 个月：付不清欠费的房产会被收回。</div>
              <button onClick={onToggleSimpleMode} className={`${btn} w-full mt-1.5`}>
                {simpleMode ? '切回完整模式' : '切到简洁模式'}
              </button>
            </>
          )}
        </>
      )}

      {tab === 'age' && (
        <>
          {needRegistered}
          <div className={label}>设置年龄（{MIN_AGE}–{MAX_AGE} 岁，按当前年份倒推出生登记年份）</div>
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {[16, 18, 50, 65].map((a) => (
              <button key={a} disabled={!isRegistered} onClick={() => onSetAge(a)} className={btn}>
                {a} 岁
              </button>
            ))}
          </div>
          <input value={ageInput} onChange={(e) => setAgeInput(e.target.value)} inputMode="numeric" placeholder="例如 30" className={input} />
          <button
            disabled={!isRegistered}
            onClick={() => {
              const v = parseNumber(ageInput, MIN_AGE, MAX_AGE, '年龄');
              if (v !== null) onSetAge(v);
            }}
            className={`${btn} w-full`}
          >
            设为该年龄
          </button>
        </>
      )}

      {tab === 'child' && (
        <>
          {needRegistered}
          <div className={label}>立即新增子嗣（出生于当前年月，另一位家长为现任配偶）</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button disabled={!isRegistered} onClick={() => onAddChild(false)} className={btn}>
              +1 个孩子
            </button>
            <button disabled={!isRegistered} onClick={() => onAddChild(true)} className={btn}>
              +双胞胎
            </button>
          </div>
          <button disabled={!isRegistered} onClick={onAddAdultChild} className={`${btn} w-full mt-1.5`}>
            +30 岁单身子女（测试强制相亲）
          </button>
          <button disabled={!isRegistered} onClick={onKinLayoff} className={`${btn} w-full mt-1.5`}>
            所有在职家人失业（测试家人职业）
          </button>
          <div className="text-[9px] text-gray-500 font-bold mt-1.5">测试用：忽略婚姻、年龄与 6 人上限。想测试传承，可新增后再快进 16 年以上；在家族页点开 30 岁单身子女可强制相亲，再快进观察包办婚姻的结局。</div>
          <div className={`${label} mt-2`}>零花（不在职的月份由父母给）：{allowancePreview}</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button disabled={!isRegistered} onClick={() => onSetParentAffinity(20)} className={btn}>
              父母好感 20%
            </button>
            <button disabled={!isRegistered} onClick={() => onSetParentAffinity(100)} className={btn}>
              父母好感 100%
            </button>
          </div>
          <div className="text-[9px] text-gray-500 font-bold mt-1.5">好感 ≤30% 的父母不给零花；在职（含童工）时改发俸禄。</div>
          <div className={`${label} mt-2`}>外貌</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button disabled={!isRegistered} onClick={onRandomAppearance} className={btn}>
              随机外貌
            </button>
            <button disabled={!isRegistered} onClick={onToggleBeauty} className={btn}>
              切换倾国倾城
            </button>
          </div>
          <div className={`${label} mt-2`}>抗体：{antibodyText}</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button disabled={!isRegistered} onClick={onGrantAllAntibodies} className={btn}>
              获得全部抗体
            </button>
            <button disabled={!isRegistered} onClick={onClearAntibodies} className={btn}>
              清空抗体
            </button>
          </div>
        </>
      )}

      {tab === 'gift' && (
        <>
          <div className={label}>背包 {giftTotal} 件 · 点击添加 1 件（宝箱每抽 30% 出礼物）</div>
          <div className="grid grid-cols-3 gap-1">
            {GIFTS.map((g) => (
              <button key={g.id} onClick={() => onAddGifts([g.id])} title={`${g.name}（${g.quality}）`} className={`${btn} truncate px-1`}>
                <span className={`px-0.5 rounded mr-0.5 ${GIFT_QUALITY_STYLE[g.quality]}`}>{g.quality[0]}</span>
                {g.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-1.5">
            <button onClick={() => onAddGifts(GIFTS.flatMap((g) => Array(5).fill(g.id)))} className={btn}>
              每种各 +5
            </button>
            <button disabled={giftTotal === 0} onClick={onClearGifts} className={btn}>
              清空背包
            </button>
          </div>
          <div className={`${label} mt-2`}>累计赠礼 {giftsGiven} 次（10 次「兄友弟恭」、100 次「手有余香」）</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={() => onAddGiftsGiven(9)} className={btn}>
              赠礼次数 +9
            </button>
            <button onClick={() => onAddGiftsGiven(90)} className={btn}>
              赠礼次数 +90
            </button>
          </div>
          <div className="text-[9px] text-gray-500 font-bold mt-1.5">在家族页点开家人即可赠送礼物；清空全部成就时赠礼次数也会归零。</div>
        </>
      )}

      {tab === 'achievement' && (
        <>
          <div className={label}>
            已解锁 {achievementProgress[0]} / {achievementProgress[1]} 项（成就跨人生保留，解锁时间记为当前现实时间）
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={onUnlockAllAchievements} className={btn}>
              一键解锁全部
            </button>
            <button onClick={onClearAchievements} className={btn}>
              清空全部成就
            </button>
          </div>
          <button onClick={onSetLimitedPity} className={`${btn} w-full mt-1.5`}>
            限定保底差一抽（测试「大非酋」）
          </button>
          <button
            onClick={() => {
              // 测试服饰 7 折券：清空剩余次数，并允许再次兑换 Aminoac2026（需重新打开个人中心）
              try {
                const codes = JSON.parse(localStorage.getItem('amigo_redeemed_codes') || '[]');
                localStorage.setItem('amigo_redeemed_codes', JSON.stringify(Array.isArray(codes) ? codes.filter((c) => c !== CLOTHING_COUPON_CODE) : []));
                saveCouponLeft(0);
                setError(null);
              } catch (e) {
                setError('兑换记录读取失败');
              }
            }}
            className={`${btn} w-full mt-1.5`}
          >
            重置 Aminoac2026（可再次兑换 7 折券）
          </button>
          <div className="text-[9px] text-gray-500 font-bold mt-1.5">可用于测试「集齐全部成就」后的致谢名单。「大非酋」：点按钮后打开商城单抽一次；「变装」：去理发店理一次发；「时装秀」：集齐商城全部服饰。</div>

          <div className={`${label} mt-3`}>赛季排行防作弊</div>
          <button
            disabled={!onTestSeasonSubmit}
            onClick={() => {
              if (!onTestSeasonSubmit) return;
              setSeasonTestResult('上报中…');
              onTestSeasonSubmit(FAKE_SEASON_SCORE, FAKE_COMPLETION_MS)
                .then((r) =>
                  setSeasonTestResult(
                    `上报积分 ${FAKE_SEASON_SCORE.toLocaleString()}、用时 1 秒 → 服务器记录积分 ${r.score.toLocaleString()}，速通用时 ${r.completedMs === null ? '未计入' : formatDuration(r.completedMs)}`,
                  ),
                )
                .catch((err) => setSeasonTestResult(`上报失败：${err instanceof Error ? err.message : String(err)}`));
            }}
            className={`${btn} w-full`}
          >
            上报伪造成绩（{FAKE_SEASON_SCORE.toLocaleString()} 分、1 秒速通）
          </button>
          <div className="text-[9px] text-gray-500 font-bold mt-1.5">
            {onTestSeasonSubmit ? seasonTestResult ?? '服务器应把积分截到每小时 3000 分以内，并丢弃短于 30 分钟的速通用时。' : '需要登录已验证的邮箱账号。'}
          </div>
        </>
      )}

      {error && <div className="text-[10px] text-rose-400 font-bold mt-1">{error}</div>}
    </div>
  );
};
