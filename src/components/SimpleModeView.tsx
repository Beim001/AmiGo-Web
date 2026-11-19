import React from 'react';
import { Heart, LogOut, TrendingUp, TrendingDown } from 'lucide-react';
import { CurrencyIcon } from './CurrencyIcon';
import { CURRENCY } from '../data/seasons';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('simple');
  const dead = p.isRegistered && p.health <= 0;
  const monthText = t('monthText', { year: p.year, month: p.month });

  return (
    <div className="flex-1 overflow-y-auto bg-[#fff7e6] text-[#3b2a1a] flex flex-col">
      {/* 顶部：返回完整模式 */}
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="text-sm font-black text-[#a16207]">{monthText}</span>
        <button
          onClick={p.onExit}
          className="flex items-center gap-1 text-xs font-black bg-white border-2 border-[#3b2a1a] rounded-full px-3 py-1.5 cursor-pointer active:scale-95"
        >
          <LogOut size={14} /> {t('fullMode')}
        </button>
      </div>

      {!p.isRegistered ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6 text-center">
          <div className="text-7xl">👶</div>
          <p className="text-2xl font-black">{t('notBorn')}</p>
          <button
            onClick={p.onRegister}
            className="w-full max-w-xs bg-[#facc15] border-4 border-[#3b2a1a] rounded-3xl py-5 text-2xl font-black shadow-[0_6px_0_#3b2a1a] active:translate-y-1 active:shadow-none cursor-pointer"
          >
            {t('beBorn')}
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
                  {t('ageFamily', { age: p.age, family: p.familyLabel })}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-lg font-black">
                <Heart size={22} className="text-rose-500 fill-rose-500" /> {t('health')}
                <div className="flex-1 h-4 bg-gray-200 rounded-full border-2 border-[#3b2a1a] overflow-hidden">
                  <div className={`h-full ${bar(p.health)}`} style={{ width: `${Math.max(0, Math.min(100, p.health))}%` }} />
                </div>
                <span className="w-10 text-right">{p.health}</span>
              </div>
              <div className="flex items-center gap-2 text-lg font-black">
                <CurrencyIcon size={22} className="text-amber-500" /> {t('money')}
                <span className="ml-auto">{p.coins.toLocaleString()} {CURRENCY.symbol}</span>
              </div>
              {p.deposit > 0 && (
                <div className="flex items-center gap-2 text-sm font-bold text-[#8a6d4b]">
                  {t('bankDeposit')} <span className="ml-auto">{p.deposit.toLocaleString()} {CURRENCY.symbol}</span>
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm font-black">
              {p.diseaseName && <span className="bg-rose-100 border-2 border-rose-400 rounded-full px-2 py-0.5">🤒 {p.diseaseName}</span>}
              <span className="bg-sky-100 border-2 border-sky-400 rounded-full px-2 py-0.5">💼 {p.jobTitle ?? t('noJob')}</span>
              <span className="bg-pink-100 border-2 border-pink-400 rounded-full px-2 py-0.5">💍 {p.spouseName ?? t('single')}</span>
              <span className="bg-lime-100 border-2 border-lime-500 rounded-full px-2 py-0.5">👶 {t('children', { count: p.childrenCount })}</span>
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
              {t('advanceMonth')}
            </button>
          )}
          {!dead && (
            <p className="text-center text-sm font-bold text-[#8a6d4b] -mt-2">{t('advanceMonthHint')}</p>
          )}

          {/* 连续推进：遇到需要你选择的事情会自动停下 */}
          {!dead &&
            (p.advanceRemaining > 0 ? (
              <button
                onClick={p.onStopAdvance}
                className="w-full bg-rose-400 text-white border-4 border-[#3b2a1a] rounded-2xl py-3 text-xl font-black shadow-[0_4px_0_#3b2a1a] active:translate-y-1 active:shadow-none cursor-pointer"
              >
                {t('stopAdvance', { count: p.advanceRemaining })}
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {([
                  [6, t('advanceHalfYear')],
                  [12, t('advanceYear')],
                  [120, t('advanceDecade')],
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
          {!dead && <p className="text-center text-xs font-bold text-[#8a6d4b] -mt-2">{t('autoStopHint')}</p>}

          {/* 一键炒股 */}
          {!dead && (
            <div className="bg-white border-4 border-[#3b2a1a] rounded-3xl p-4 shadow-[0_5px_0_#3b2a1a]">
              <div className="text-xl font-black mb-2">{t('stockTitle')}</div>
              {p.stockOpened ? (
                <>
                  <p className="text-sm font-bold text-[#8a6d4b] mb-3">
                    {t('stockValue', { value: p.stockValue.toLocaleString(), symbol: CURRENCY.symbol })}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={p.onBuyStocks}
                      className="flex items-center justify-center gap-1 bg-rose-400 text-white border-4 border-[#3b2a1a] rounded-2xl py-3 text-xl font-black shadow-[0_4px_0_#3b2a1a] active:translate-y-1 active:shadow-none cursor-pointer"
                    >
                      <TrendingUp size={22} /> {t('buy')}
                    </button>
                    <button
                      onClick={p.onSellStocks}
                      disabled={p.stockValue <= 0}
                      className="flex items-center justify-center gap-1 bg-sky-400 text-white border-4 border-[#3b2a1a] rounded-2xl py-3 text-xl font-black shadow-[0_4px_0_#3b2a1a] active:translate-y-1 active:shadow-none cursor-pointer disabled:opacity-40"
                    >
                      <TrendingDown size={22} /> {t('sellAll')}
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm font-bold text-[#8a6d4b]">{t('stockLocked')}</p>
              )}
            </div>
          )}

          {/* 保养身体 */}
          {!dead && (
            <div className="bg-white border-4 border-[#3b2a1a] rounded-3xl p-4 shadow-[0_5px_0_#3b2a1a]">
              <div className="text-xl font-black mb-1">{t('maintenanceTitle')}</div>
              <p className="text-sm font-bold text-[#8a6d4b] mb-1">{p.fertilityText}</p>
              <p className="text-xs font-bold text-[#8a6d4b] mb-3">{t('maintenanceHint')}</p>
              <button
                onClick={p.onMaintenance}
                className="w-full bg-violet-400 text-white border-4 border-[#3b2a1a] rounded-2xl py-3 text-xl font-black shadow-[0_4px_0_#3b2a1a] active:translate-y-1 active:shadow-none cursor-pointer"
              >
                {t('maintenanceOnce', { cost: p.maintenanceCost.toLocaleString(), symbol: CURRENCY.symbol })}
              </button>
            </div>
          )}

          {/* 上个月发生了什么 */}
          {p.lastSummary.length > 0 && (
            <div className="bg-white border-4 border-[#3b2a1a] rounded-3xl p-4 shadow-[0_5px_0_#3b2a1a]">
              <div className="text-xl font-black mb-2">{t('recentTitle')}</div>
              <ul className="space-y-1 text-base font-bold">
                {p.lastSummary.slice(0, 8).map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}

          {p.recent.length > 0 && (
            <div className="bg-white border-4 border-[#3b2a1a] rounded-3xl p-4 shadow-[0_5px_0_#3b2a1a]">
              <div className="text-xl font-black mb-2">{t('lifeTitle')}</div>
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
