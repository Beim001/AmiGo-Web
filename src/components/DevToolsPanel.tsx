import React, { useState } from 'react';
import { Wrench, X, CircleDollarSign } from 'lucide-react';

// 开发测试工具：仅在 `npm run dev` 下由 App 渲染（import.meta.env.DEV），生产构建中不存在。
// 悬浮在所有界面之上，方便在商城、购房、移民等弹窗中直接调整现金余额。

interface DevToolsPanelProps {
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
}

const QUICK_ADD = [10_000, 100_000, 1_000_000];
const QUICK_SET = [0, 9_999_999];

const clampCoins = (value: number) => Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value)));

export const DevToolsPanel: React.FC<DevToolsPanelProps> = ({ coins, setCoins }) => {
  const [open, setOpen] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const parseAmount = (): number | null => {
    const value = Number(amountInput.replace(/[,\s_]/g, ''));
    if (!amountInput.trim() || !Number.isFinite(value) || value < 0) {
      setError('请输入非负数字');
      return null;
    }
    setError(null);
    return value;
  };

  const addCoins = (amount: number) => setCoins((prev) => clampCoins(prev + amount));
  const setExact = (amount: number) => setCoins(clampCoins(amount));

  const btn =
    'bg-[#2d2f3d] hover:bg-[#3a3d4f] text-white text-[11px] font-black py-1.5 rounded-lg border border-black shadow-[0_1px_0_#000] active:translate-y-px cursor-pointer font-mono';

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="开发测试工具（仅开发模式）"
        className="absolute right-2 bottom-[84px] z-[90] w-9 h-9 rounded-full bg-fuchsia-600 hover:bg-fuchsia-500 border-2 border-black shadow-[0_2px_0_#000] flex items-center justify-center text-white opacity-80 hover:opacity-100 active:scale-95 cursor-pointer"
      >
        <Wrench size={16} strokeWidth={2.5} />
      </button>
    );
  }

  return (
    <div className="absolute right-2 bottom-[84px] z-[90] w-60 bg-[#1b1c25] border-2 border-fuchsia-500 rounded-2xl shadow-[0_4px_0_#000] p-3 text-white">
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

      <div className="flex items-center justify-between bg-[#21232e] rounded-lg border border-black px-2 py-1.5 mb-2">
        <span className="text-[10px] text-gray-400 font-bold">当前现金</span>
        <span className="flex items-center gap-1 text-yellow-300 font-black text-xs font-mono">
          <CircleDollarSign size={12} />
          {coins.toLocaleString()}
        </span>
      </div>

      <div className="text-[10px] text-gray-400 font-bold mb-1">快速增加</div>
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        {QUICK_ADD.map((amount) => (
          <button key={amount} onClick={() => addCoins(amount)} className={btn}>
            +{amount >= 1_000_000 ? `${amount / 1_000_000}M` : `${amount / 1_000}K`}
          </button>
        ))}
      </div>

      <div className="text-[10px] text-gray-400 font-bold mb-1">快速设置</div>
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        {QUICK_SET.map((amount) => (
          <button key={amount} onClick={() => setExact(amount)} className={btn}>
            = {amount.toLocaleString()}
          </button>
        ))}
      </div>

      <div className="text-[10px] text-gray-400 font-bold mb-1">自定义金额</div>
      <input
        value={amountInput}
        onChange={(e) => {
          setAmountInput(e.target.value);
          setError(null);
        }}
        inputMode="numeric"
        placeholder="例如 250000"
        className="w-full bg-[#21232e] text-white text-xs font-mono px-2 py-1.5 rounded-lg border border-black focus:outline-none focus:border-fuchsia-500 mb-1.5"
      />
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => {
            const v = parseAmount();
            if (v !== null) addCoins(v);
          }}
          className={btn}
        >
          增加
        </button>
        <button
          onClick={() => {
            const v = parseAmount();
            if (v !== null) setExact(v);
          }}
          className={btn}
        >
          设为
        </button>
      </div>
      {error && <div className="text-[10px] text-rose-400 font-bold mt-1">{error}</div>}
    </div>
  );
};
