import React from 'react';
import { RussianRuble, Heart, LogOut, TrendingUp, TrendingDown } from 'lucide-react';

// 简洁模式：把用户当成 7 岁儿童来设计的一屏界面。
// 只保留影响人生模拟的事：一个「过一个月」大按钮（自动治病、处理推演、给家人送礼），
// 一键炒股，以及到了人生节点时弹出的大卡片（找工作、结婚、买房、传承）。

export interface SimpleChoice {
  id: string;
  title: string;
  detail: string;
}

export interface SimpleCard {
  kind: 'job' | 'marriage' | 'home' | 'heir';
  emoji: string;
  question: string;
  hint?: string;
  choices: SimpleChoice[];
  /** 「以后再说」按钮的文字；没有则不显示 */
  laterLabel?: string;
}

export interface SimpleModeViewProps {
  isRegistered: boolean;
  name: string;
  age: number;
  health: number;
  coins: number;
  deposit: number;
  year: number;
  month: number;
  familyLabel: string;
  diseaseName: string | null;
  jobTitle: string | null;
  spouseName: string | null;
  childrenCount: number;
  /** 最近发生的事（最新在前） */
  recent: Array<{ title: string; detail?: string }>;
  /** 上次「过一个月」的结果 */
  lastSummary: string[];
  card: SimpleCard | null;
  onChoose: (card: SimpleCard, choiceId: string) => void;
  onLater: (card: SimpleCard) => void;
  onNextMonth: () => void;
  stockOpened: boolean;
  stockValue: number;
  onBuyStocks: () => void;
  onSellStocks: () => void;
  onRegister: () => void;
  onExit: () => void;
  /** 连续推进：剩余月数（0 = 没有在连续推进） */
  advanceRemaining: number;
  onAdvance: (months: number) => void;
  onStopAdvance: () => void;
  /** 保养身体（可获得「精力旺盛」「富养」，延长生育年龄） */
  maintenanceCost: number;
  fertilityText: string;
  onMaintenance: () => void;
}

const bar = (value: number) => (value >= 60 ? 'bg-emerald-400' : value >= 30 ? 'bg-amber-400' : 'bg-rose-500');

export const SimpleModeView: React.FC<SimpleModeViewProps> = (p) => {
  const dead = p.isRegistered && p.health <= 0;
  const monthText = `${p.year} 年 ${p.month} 月`;

  return (
    <div className="flex-1 overflow-y-auto bg-[#fff7e6] text-[#3b2a1a] flex flex-col">
      {/* 顶部：返回完整模式 */}
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="text-sm font-black text-[#a16207]">{monthText}</span>
        <button
          onClick={p.onExit}
          className="flex items-center gap-1 text-xs font-black bg-white border-2 border-[#3b2a1a] rounded-full px-3 py-1.5 cursor-pointer active:scale-95"
        >
          <LogOut size={14} /> 完整模式
        </button>
      </div>

      {!p.isRegistered ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6 text-center">
          <div className="text-7xl">👶</div>
          <p className="text-2xl font-black">你还没有出生哦</p>
          <button
            onClick={p.onRegister}
            className="w-full max-w-xs bg-[#facc15] border-4 border-[#3b2a1a] rounded-3xl py-5 text-2xl font-black shadow-[0_6px_0_#3b2a1a] active:translate-y-1 active:shadow-none cursor-pointer"
          >
            出生！
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 p-4">
          {/* 我是谁 */}
          <div className="bg-white border-4 border-[#3b2a1a] rounded-3xl p-4 shadow-[0_5px_0_#3b2a1a]">
            <div className="flex items-center gap-3">
              <div className="text-5xl">{dead ? '🕯️' : p.age < 16 ? '🧒' : p.age < 60 ? '🧑' : '🧓'}</div>
              <div className="min-w-0">
                <div className="text-2xl font-black truncate">{p.name}</div>
                <div className="text-base font-bold text-[#8a6d4b]">
                  {p.age} 岁 · {p.familyLabel}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-lg font-black">
                <Heart size={22} className="text-rose-500 fill-rose-500" /> 健康
                <div className="flex-1 h-4 bg-gray-200 rounded-full border-2 border-[#3b2a1a] overflow-hidden">
                  <div className={`h-full ${bar(p.health)}`} style={{ width: `${Math.max(0, Math.min(100, p.health))}%` }} />
                </div>
                <span className="w-10 text-right">{p.health}</span>
              </div>
              <div className="flex items-center gap-2 text-lg font-black">
                <RussianRuble size={22} className="text-amber-500" /> 钱
                <span className="ml-auto">{p.coins.toLocaleString()} ₽</span>
              </div>
              {p.deposit > 0 && (
                <div className="flex items-center gap-2 text-sm font-bold text-[#8a6d4b]">
                  🏦 银行里还有 <span className="ml-auto">{p.deposit.toLocaleString()} ₽</span>
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm font-black">
              {p.diseaseName && <span className="bg-rose-100 border-2 border-rose-400 rounded-full px-2 py-0.5">🤒 {p.diseaseName}</span>}
              <span className="bg-sky-100 border-2 border-sky-400 rounded-full px-2 py-0.5">💼 {p.jobTitle ?? '没有工作'}</span>
              <span className="bg-pink-100 border-2 border-pink-400 rounded-full px-2 py-0.5">💍 {p.spouseName ?? '单身'}</span>
              <span className="bg-lime-100 border-2 border-lime-500 rounded-full px-2 py-0.5">👶 {p.childrenCount} 个孩子</span>
            </div>
          </div>

          {/* 人生节点的大卡片 */}
          {p.card && (
            <div className="bg-[#fde68a] border-4 border-[#3b2a1a] rounded-3xl p-4 shadow-[0_5px_0_#3b2a1a] space-y-3">
              <div className="text-center">
                <div className="text-5xl">{p.card.emoji}</div>
                <p className="text-2xl font-black mt-1">{p.card.question}</p>
                {p.card.hint && <p className="text-sm font-bold text-[#8a6d4b] mt-1">{p.card.hint}</p>}
              </div>
              {p.card.choices.map((c) => (
                <button
                  key={c.id}
                  onClick={() => p.onChoose(p.card!, c.id)}
                  className="w-full bg-white border-4 border-[#3b2a1a] rounded-2xl p-3 text-left shadow-[0_4px_0_#3b2a1a] active:translate-y-1 active:shadow-none cursor-pointer"
                >
                  <div className="text-xl font-black">{c.title}</div>
                  <div className="text-sm font-bold text-[#8a6d4b]">{c.detail}</div>
                </button>
              ))}
              {p.card.laterLabel && (
                <button onClick={() => p.onLater(p.card!)} className="w-full text-base font-black text-[#8a6d4b] py-2 cursor-pointer">
                  {p.card.laterLabel}
                </button>
              )}
            </div>
          )}

          {/* 过一个月 */}
          {!dead && (
            <button
              onClick={p.onNextMonth}
              disabled={!!p.card && p.card.kind === 'heir'}
              className="w-full bg-[#22c55e] text-white border-4 border-[#3b2a1a] rounded-3xl py-6 text-3xl font-black shadow-[0_7px_0_#3b2a1a] active:translate-y-1 active:shadow-none cursor-pointer disabled:opacity-50"
            >
              ⏩ 过一个月
            </button>
          )}
          {!dead && (
            <p className="text-center text-sm font-bold text-[#8a6d4b] -mt-2">会自动看病、处理生活小事、给爸爸妈妈和爱人送礼物</p>
          )}

          {/* 连续推进：遇到需要你选择的事情会自动停下 */}
          {!dead &&
            (p.advanceRemaining > 0 ? (
              <button
                onClick={p.onStopAdvance}
                className="w-full bg-rose-400 text-white border-4 border-[#3b2a1a] rounded-2xl py-3 text-xl font-black shadow-[0_4px_0_#3b2a1a] active:translate-y-1 active:shadow-none cursor-pointer"
              >
                ⏸ 停下来（还剩 {p.advanceRemaining} 个月）
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {([
                  [6, '过半年'],
                  [12, '过一年'],
                  [120, '过十年'],
                ] as const).map(([n, label]) => (
                  <button
                    key={n}
                    onClick={() => p.onAdvance(n)}
                    disabled={!!p.card}
                    className="bg-[#38bdf8] text-white border-4 border-[#3b2a1a] rounded-2xl py-3 text-lg font-black shadow-[0_4px_0_#3b2a1a] active:translate-y-1 active:shadow-none cursor-pointer disabled:opacity-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
            ))}
          {!dead && <p className="text-center text-xs font-bold text-[#8a6d4b] -mt-2">遇到要你做决定的事会自动停下来</p>}

          {/* 一键炒股 */}
          {!dead && (
            <div className="bg-white border-4 border-[#3b2a1a] rounded-3xl p-4 shadow-[0_5px_0_#3b2a1a]">
              <div className="text-xl font-black mb-2">📈 炒股</div>
              {p.stockOpened ? (
                <>
                  <p className="text-sm font-bold text-[#8a6d4b] mb-3">
                    手里的股票值 {p.stockValue.toLocaleString()} ₽。买入会用三成现金买最近涨得好的股票。
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={p.onBuyStocks}
                      className="flex items-center justify-center gap-1 bg-rose-400 text-white border-4 border-[#3b2a1a] rounded-2xl py-3 text-xl font-black shadow-[0_4px_0_#3b2a1a] active:translate-y-1 active:shadow-none cursor-pointer"
                    >
                      <TrendingUp size={22} /> 买入
                    </button>
                    <button
                      onClick={p.onSellStocks}
                      disabled={p.stockValue <= 0}
                      className="flex items-center justify-center gap-1 bg-sky-400 text-white border-4 border-[#3b2a1a] rounded-2xl py-3 text-xl font-black shadow-[0_4px_0_#3b2a1a] active:translate-y-1 active:shadow-none cursor-pointer disabled:opacity-40"
                    >
                      <TrendingDown size={22} /> 全卖
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm font-bold text-[#8a6d4b]">家里要有人做过金融工作（比如交易所经纪人、账房）才能炒股。</p>
              )}
            </div>
          )}

          {/* 保养身体 */}
          {!dead && (
            <div className="bg-white border-4 border-[#3b2a1a] rounded-3xl p-4 shadow-[0_5px_0_#3b2a1a]">
              <div className="text-xl font-black mb-1">💆 保养身体</div>
              <p className="text-sm font-bold text-[#8a6d4b] mb-1">{p.fertilityText}</p>
              <p className="text-xs font-bold text-[#8a6d4b] mb-3">每个月会自动给你、爱人和长大的孩子保养（每人每月一次，钱够才做，自动保养效果比手动差一些）。</p>
              <button
                onClick={p.onMaintenance}
                className="w-full bg-violet-400 text-white border-4 border-[#3b2a1a] rounded-2xl py-3 text-xl font-black shadow-[0_4px_0_#3b2a1a] active:translate-y-1 active:shadow-none cursor-pointer"
              >
                保养一次（{p.maintenanceCost.toLocaleString()} ₽）
              </button>
            </div>
          )}

          {/* 上个月发生了什么 */}
          {p.lastSummary.length > 0 && (
            <div className="bg-white border-4 border-[#3b2a1a] rounded-3xl p-4 shadow-[0_5px_0_#3b2a1a]">
              <div className="text-xl font-black mb-2">📰 刚刚发生</div>
              <ul className="space-y-1 text-base font-bold">
                {p.lastSummary.slice(0, 8).map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}

          {p.recent.length > 0 && (
            <div className="bg-white border-4 border-[#3b2a1a] rounded-3xl p-4 shadow-[0_5px_0_#3b2a1a]">
              <div className="text-xl font-black mb-2">📖 我的人生</div>
              <ul className="space-y-1.5">
                {p.recent.slice(0, 6).map((r, i) => (
                  <li key={i} className="text-base font-bold">
                    {r.title}
                    {r.detail && <span className="block text-xs text-[#8a6d4b] font-bold">{r.detail}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
