import React, { useState } from 'react';
import { Wrench, X, CircleDollarSign, FastForward, Baby, Cake, Square } from 'lucide-react';

// 开发测试工具：仅在 `npm run dev` 下由 App 渲染（import.meta.env.DEV），生产构建中不存在。
// 悬浮在所有界面之上：调整现金、一键快进月份、编辑年龄、新增子嗣。

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
}

const QUICK_ADD = [10_000, 100_000, 1_000_000];
const QUICK_SET = [0, 9_999_999];
const QUICK_MONTHS: Array<[number, string]> = [[1, '+1 月'], [12, '+1 年'], [60, '+5 年'], [120, '+10 年']];
const MIN_AGE = 8;
const MAX_AGE = 120;
const MAX_FAST_FORWARD_MONTHS = 1200;

const clampCoins = (value: number) => Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value)));

type Tab = 'money' | 'time' | 'age' | 'child';

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
}) => {
  const [open, setOpen] = useState(false);
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

      <div className="grid grid-cols-4 gap-1 mb-2">
        {([
          ['money', '金钱', CircleDollarSign],
          ['time', '快进', FastForward],
          ['age', '年龄', Cake],
          ['child', '子嗣', Baby],
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
          <CircleDollarSign size={11} />
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
          <div className={label}>一键快进（逐月完整结算：工资、利息、股市、健康、疾病、生育）</div>
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
              <div className="text-[9px] text-gray-500 font-bold mt-1.5">角色去世时会自动停止。</div>
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
          <div className="text-[9px] text-gray-500 font-bold mt-1.5">测试用：忽略婚姻、年龄与 6 人上限。想测试传承，可新增后再快进 16 年以上。</div>
        </>
      )}

      {error && <div className="text-[10px] text-rose-400 font-bold mt-1">{error}</div>}
    </div>
  );
};
