import React, { useState } from 'react';
import { ChevronLeft, Gamepad2 } from 'lucide-react';
import { CurrencyIcon } from './CurrencyIcon';
import { CURRENCY } from '../data/seasons';
import {
  LEISURES,
  LeisureDef,
  LeisureId,
  LeisureRecord,
  THEATER_COST,
  THEATER_HEALTH,
  MIN_BET,
  FIGHTING_COCK_PRICE,
  BET_MIN_AGE,
  betBlocked,
  compete,
  competeBlocked,
  contendersFor,
  loadFightingCock,
  loadLeisureRecord,
  maxBet,
  resolveBet,
  saveFightingCock,
  saveLeisureRecord,
  visitLeisure,
  visitedThisMonth,
  RACE_ENTRY_FEE,
  COCKFIGHT_ENTRY_FEE,
} from '../lib/leisure';
import { loadVehicles } from '../lib/vehicles';
import { addLifeLog } from '../lib/lifeLog';
import { isInPrison, PRISON_BLOCK_TEXT, RAID_CHANCE } from '../lib/prison';

// 文娱休闲（第 67.10 题）：剧院、赌场、赛马、斗鸡、斗牛、摔跤，每项每月一次；观赛下注或亲自上场

export interface LeisureModalProps {
  onClose: () => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  health: number;
  setHealth: React.Dispatch<React.SetStateAction<number>>;
  /** 声望变化（自动限制在 0–100） */
  changeReputation: (delta: number) => void;
  isRegistered: boolean;
  age: number;
  gameYear: number;
  gameMonth: number;
  /** 入狱（第 67.7 题），返回提示文字 */
  onJail: (crime: string, months: number) => string;
}

const TASTE_LABEL: Record<LeisureDef['taste'], [string, string]> = {
  elegant: ['上流雅事 · 声望 +1（每月合计最多 +1）', 'text-emerald-300'],
  vulgar: ['市井消遣 · 声望 -1', 'text-rose-300'],
  neutral: ['上场获胜可得声望', 'text-gray-400'],
};

/** 下注项目可亲自上场的说明 */
const COMPETE_HINT: Partial<Record<LeisureId, string>> = {
  horse_race: `报名费 ${RACE_ENTRY_FEE.toLocaleString()}，牵自家最好的马下场（名驹胜率远高于骑乘马）`,
  cockfight: `报名费 ${COCKFIGHT_ENTRY_FEE.toLocaleString()}，输了斗鸡会死`,
  bullfight: '胜率看健康，输了重伤',
  wrestling: '胜率看年龄与健康（20–30 岁最强），输了受伤',
};

export const LeisureModal: React.FC<LeisureModalProps> = ({ onClose, coins, setCoins, health, setHealth, changeReputation, isRegistered, age, gameYear, gameMonth, onJail }) => {
  const [record, setRecord] = useState<LeisureRecord>(loadLeisureRecord);
  const [hasCock, setHasCock] = useState(loadFightingCock);
  const [betInput, setBetInput] = useState(String(MIN_BET * 10));
  const [result, setResult] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 2500);
  };
  const money = (n: number) => `${n.toLocaleString()} ${CURRENCY.symbol}`;
  const amount = Math.floor(Number(betInput));
  const vehicles = loadVehicles();

  /** 记下本月已参加，并结算雅俗声望；返回声望变化的说明 */
  const markVisit = (id: LeisureId): string => {
    const v = visitLeisure(record, id, gameYear, gameMonth);
    setRecord(v.record);
    saveLeisureRecord(v.record);
    if (v.rep) changeReputation(v.rep);
    return v.rep ? `，声望 ${v.rep > 0 ? '+' : ''}${v.rep}` : '';
  };

  /** 狱中不能去文娱场所（第 67.7 题） */
  const jailed = () => {
    if (!isInPrison()) return false;
    showToast(`⛓️ ${PRISON_BLOCK_TEXT}`);
    return true;
  };

  /** 赌场、斗鸡场遇上巡捕查抄：赌注没收，拘留 1 个月（第 67.7 题） */
  const raided = (def: LeisureDef, stake: number) => {
    if ((def.id !== 'casino' && def.id !== 'cockfight') || Math.random() >= RAID_CHANCE) return false;
    if (stake > 0) setCoins((prev) => prev - stake);
    markVisit(def.id);
    const msg = onJail('聚众赌博', 1);
    finish(def, `巡捕突然查抄${def.venue}${stake > 0 ? `，${money(stake)} 赌注被没收` : ''}，${msg.replace('⛓️ ', '')}`, false);
    showToast(msg);
    return true;
  };

  const finish = (def: LeisureDef, text: string, log: boolean) => {
    setResult(`【${def.name}】${text}`);
    if (log) addLifeLog('财富', `${def.name}：${text.split('，')[0]}`, text);
  };

  const watchTheater = (def: LeisureDef) => {
    if (jailed()) return;
    if (!isRegistered) return showToast('请先完成出生登记');
    if (coins < THEATER_COST) return showToast(`现金不足：需要 ${money(THEATER_COST)}`);
    setCoins((prev) => prev - THEATER_COST);
    setHealth((h) => Math.min(100, h + THEATER_HEALTH));
    finish(def, `在${def.venue}看了一场戏，健康 +${THEATER_HEALTH}${markVisit(def.id)}`, false);
  };

  const bet = (def: LeisureDef, pick: number) => {
    if (jailed()) return;
    const blocked = betBlocked({ isRegistered, age, coins, amount });
    if (blocked) return showToast(blocked);
    if (raided(def, amount)) return;
    const contenders = contendersFor(def.id, gameYear, gameMonth);
    const r = resolveBet(contenders, pick, amount);
    setCoins((prev) => prev - amount + r.payout);
    const repText = markVisit(def.id);
    const outcome = r.payout > 0 ? `押中「${contenders[pick].name}」，赢回 ${money(r.payout)}` : `押「${contenders[pick].name}」，开出「${contenders[r.winner].name}」，输掉 ${money(amount)}`;
    finish(def, `${outcome}${repText}`, amount >= 10_000);
  };

  const enter = (def: LeisureDef) => {
    const ctx = { isRegistered, age, health, coins, vehicles, hasCock };
    if (jailed()) return;
    const blocked = competeBlocked(def.id, ctx);
    if (blocked) return showToast(blocked);
    if (raided(def, 0)) return;
    const r = compete(def.id, ctx);
    if (r.coins) setCoins((prev) => prev + r.coins);
    if (r.health) setHealth((h) => Math.max(0, Math.min(100, h + r.health)));
    if (r.rep) changeReputation(r.rep);
    if (r.lostCock) {
      setHasCock(false);
      saveFightingCock(false);
    }
    const repText = markVisit(def.id);
    const extra = [r.health ? `健康 ${r.health}` : '', r.rep ? `声望 +${r.rep}` : ''].filter(Boolean).join('，');
    finish(def, `${r.text}${extra ? `，${extra}` : ''}${repText}`, true);
  };

  const buyCock = () => {
    if (!isRegistered) return showToast('请先完成出生登记');
    if (coins < FIGHTING_COCK_PRICE) return showToast(`现金不足：需要 ${money(FIGHTING_COCK_PRICE)}`);
    setCoins((prev) => prev - FIGHTING_COCK_PRICE);
    setHasCock(true);
    saveFightingCock(true);
    showToast('🐓 买下一只斗鸡');
  };

  const btn =
    'bg-gradient-to-b from-[#ffe56c] to-[#f5b822] text-black text-xs font-black px-3 py-1.5 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
  const grayBtn =
    'bg-[#2b2f42] hover:bg-[#363b53] text-gray-200 text-xs font-black px-3 py-1.5 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="absolute inset-0 bg-[#161822] flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-200 overflow-hidden font-sans text-white">
      {toast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-black/95 text-amber-300 border-2 border-amber-500 text-xs font-black px-4 py-2 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.8)] text-center max-w-[85%]">
          {toast}
        </div>
      )}

      <div className="relative w-full h-16 bg-[#1f2230] border-b-2 border-black shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20 flex items-center justify-between px-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-2 bg-[#2d3042] hover:bg-[#393d54] border-2 border-black rounded-xl active:translate-y-0.5 shadow-[0_2px_0_#000] cursor-pointer text-white flex items-center justify-center"
        >
          <ChevronLeft size={20} className="text-white" strokeWidth={3} />
        </button>
        <div className="flex-1 flex items-center justify-center pointer-events-none px-2">
          <div className="bg-[#2a2d3e] border-2 border-purple-400/80 px-5 py-1.5 rounded-xl shadow-[0_3px_0_#000] flex items-center gap-2">
            <Gamepad2 size={18} className="text-purple-200 flex-shrink-0" />
            <span className="text-purple-100 text-sm font-black tracking-widest">文娱休闲</span>
          </div>
        </div>
        <div className="flex items-center bg-[#151722] rounded-full px-2.5 py-1 border border-black text-xs font-mono font-black">
          <CurrencyIcon size={14} className="text-yellow-400 mr-1" />
          <span>{money(coins)}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-2">
          <p className="text-[11px] text-gray-300 font-bold">
            每项活动每月只能去一次。下注由庄家抽一成水（长期必亏），每注 {MIN_BET.toLocaleString()} 起、最多为现金的一半；年满 {BET_MIN_AGE} 岁才能下注。
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400 font-bold shrink-0">每注金额</span>
            <input
              value={betInput}
              onChange={(e) => setBetInput(e.target.value.replace(/[^0-9]/g, ''))}
              inputMode="numeric"
              className="flex-1 min-w-0 bg-[#21232e] text-white font-black text-xs px-3 py-1.5 rounded-xl border-2 border-black focus:border-yellow-400 focus:outline-none"
            />
            <button onClick={() => setBetInput(String(maxBet(coins)))} className={grayBtn}>
              最多
            </button>
          </div>
          {result && <div className="text-[11px] font-black text-amber-300">{result}</div>}
        </div>

        {LEISURES.map((def) => {
          const visited = visitedThisMonth(record, def.id, gameYear, gameMonth);
          const [tasteText, tasteColor] = TASTE_LABEL[def.taste];
          const contenders = def.id === 'theater' ? [] : contendersFor(def.id, gameYear, gameMonth);
          const canCompete = def.id !== 'theater' && def.id !== 'casino';
          const competeReason = canCompete ? competeBlocked(def.id, { isRegistered, age, health, coins, vehicles, hasCock }) : null;
          return (
            <div key={def.id} className={`bg-[#21232e] border-2 border-black rounded-xl p-3 shadow-[0_2px_0_#000] space-y-2 ${visited ? 'opacity-60' : ''}`}>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-white font-black text-sm">
                    {def.name} <span className="text-[10px] text-gray-400 font-bold">· {def.venue}</span>
                  </div>
                  {visited && <span className="text-[10px] text-gray-300 font-black shrink-0">本月已去过</span>}
                </div>
                <div className="text-[10px] text-gray-400 font-bold mt-0.5">{def.desc}</div>
                <div className={`text-[10px] font-black mt-0.5 ${tasteColor}`}>{tasteText}</div>
              </div>

              {def.id === 'theater' ? (
                <button onClick={() => watchTheater(def)} disabled={visited} className={btn}>
                  看戏（{money(THEATER_COST)}，健康 +{THEATER_HEALTH}）
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {contenders.map((c, i) => (
                    <button key={c.name} onClick={() => bet(def, i)} disabled={visited} className={`${grayBtn} text-left`}>
                      押「{c.name}」<span className="text-amber-300 ml-1">×{c.odds.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}

              {canCompete && (
                <div className="border-t border-black/40 pt-2 space-y-1">
                  <div className="text-[10px] text-gray-400 font-bold">亲自上场：{COMPETE_HINT[def.id]}</div>
                  {competeReason && <div className="text-[10px] text-rose-300 font-bold">{competeReason}</div>}
                  <div className="flex gap-1.5">
                    <button onClick={() => enter(def)} disabled={visited || !!competeReason} className={btn}>
                      上场
                    </button>
                    {def.id === 'cockfight' && !hasCock && (
                      <button onClick={buyCock} className={grayBtn}>
                        买斗鸡（{money(FIGHTING_COCK_PRICE)}）
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
