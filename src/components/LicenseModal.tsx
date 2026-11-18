import React, { useState } from 'react';
import { ChevronLeft, Car, IdCard, Store, UserRound } from 'lucide-react';
import { CurrencyIcon } from './CurrencyIcon';
import { CURRENCY } from '../data/seasons';
import {
  LICENSES,
  VEHICLES,
  VEHICLE_KIND_LABEL,
  LicenseDef,
  LicenseId,
  VehicleDef,
  VehicleId,
  VehicleKind,
  Coachman,
  LICENSE_MIN_AGE,
  VEHICLE_HEALTH_BONUS,
  HIRED_COACHMAN_WAGE,
  SLAVE_PRICE,
  SLAVE_FOOD,
  SLAVE_REPUTATION,
  FREE_SLAVE_REPUTATION,
  SLAVE_TRADE_ENDS,
  RANCH_PLAGUE_CHANCE,
  RANCH_VET_FEE,
  canTravel,
  licenseBlocked,
  purchaseBlocked,
  slaveBlocked,
  loadLicenses,
  loadVehicles,
  loadCoachman,
  saveLicenses,
  saveVehicles,
  saveCoachman,
  vehicleResale,
  vehicleUpkeep,
} from '../lib/vehicles';
import { randomGivenName } from '../lib/names';
import { addLifeLog } from '../lib/lifeLog';

// 驾照管理（第 67.4 题）：考执照；车马市场（马匹、车辆、游艇与特种、马场）；雇佣或买来车夫

export interface LicenseModalProps {
  onClose: () => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  /** 声望变化（自动限制在 0–100） */
  changeReputation: (delta: number) => void;
  isRegistered: boolean;
  age: number;
  gameYear: number;
}

type Tab = 'license' | 'market' | 'coachman';
const KIND_ORDER: VehicleKind[] = ['horse', 'vehicle', 'special', 'estate'];

export const LicenseModal: React.FC<LicenseModalProps> = ({ onClose, coins, setCoins, changeReputation, isRegistered, age, gameYear }) => {
  const [tab, setTab] = useState<Tab>('license');
  const [licenses, setLicenses] = useState<LicenseId[]>(loadLicenses);
  const [vehicles, setVehicles] = useState<VehicleId[]>(loadVehicles);
  const [coachman, setCoachman] = useState<Coachman | null>(loadCoachman);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 2500);
  };

  const ctx = { isRegistered, age, year: gameYear, coins, licenses, vehicles };
  const money = (n: number) => `${n.toLocaleString()} ${CURRENCY.symbol}`;
  const updateVehicles = (next: VehicleId[]) => {
    setVehicles(next);
    saveVehicles(next);
  };
  const updateCoachman = (next: Coachman | null) => {
    setCoachman(next);
    saveCoachman(next);
  };

  const takeExam = (def: LicenseDef) => {
    const blocked = licenseBlocked(def, ctx);
    if (blocked) return showToast(blocked);
    setCoins((prev) => prev - def.fee);
    const next = [...licenses, def.id];
    setLicenses(next);
    saveLicenses(next);
    addLifeLog('事业', `考取${def.name}`, `交考试费 ${money(def.fee)}，取得${def.name}。`);
    showToast(`🪪 考取${def.name}`);
  };

  const buy = (def: VehicleDef) => {
    const blocked = purchaseBlocked(def, ctx);
    if (blocked) return showToast(blocked);
    setCoins((prev) => prev - def.price);
    if (def.reputation) changeReputation(def.reputation);
    updateVehicles([...vehicles, def.id]);
    addLifeLog('财富', `购入${def.name}`, `花费 ${money(def.price)}${def.reputation ? `，声望 +${def.reputation}` : ''}。`);
    showToast(`购入${def.name}${def.reputation ? `，声望 +${def.reputation}` : ''}`);
  };

  const sell = (def: VehicleDef) => {
    const refund = vehicleResale(def);
    setCoins((prev) => prev + refund);
    updateVehicles(vehicles.filter((id) => id !== def.id));
    addLifeLog('财富', `出售${def.name}`, `转卖到账 ${money(refund)}。`);
    showToast(`出售${def.name}，到账 +${money(refund)}`);
  };

  const hire = () => {
    if (!isRegistered) return showToast('请先完成出生登记');
    if (coachman) return showToast('家里已经有车夫');
    const next: Coachman = { kind: 'hired', name: randomGivenName('男') };
    updateCoachman(next);
    addLifeLog('财富', `雇佣车夫${next.name}`, `月薪 ${money(HIRED_COACHMAN_WAGE)}。`);
    showToast(`雇佣车夫${next.name}，月薪 ${money(HIRED_COACHMAN_WAGE)}`);
  };

  const buySlave = () => {
    const blocked = slaveBlocked({ isRegistered, year: gameYear, coins, coachman });
    if (blocked) return showToast(blocked);
    const next: Coachman = { kind: 'slave', name: randomGivenName('男') };
    setCoins((prev) => prev - SLAVE_PRICE);
    changeReputation(SLAVE_REPUTATION);
    updateCoachman(next);
    addLifeLog('财富', `买下车夫${next.name}`, `在奴隶市场花 ${money(SLAVE_PRICE)} 买下${next.name}赶车，声望 ${SLAVE_REPUTATION}。`);
    showToast(`买下车夫${next.name}，声望 ${SLAVE_REPUTATION}`);
  };

  const release = () => {
    if (!coachman) return;
    if (coachman.kind === 'slave') {
      changeReputation(FREE_SLAVE_REPUTATION);
      addLifeLog('财富', `释放车夫${coachman.name}`, `还${coachman.name}自由，声望 +${FREE_SLAVE_REPUTATION}。`);
      showToast(`还${coachman.name}自由，声望 +${FREE_SLAVE_REPUTATION}`);
    } else {
      addLifeLog('财富', `辞退车夫${coachman.name}`, '不再雇佣车夫。');
      showToast(`辞退车夫${coachman.name}`);
    }
    updateCoachman(null);
  };

  const btn =
    'bg-gradient-to-b from-[#ffe56c] to-[#f5b822] text-black text-xs font-black px-3 py-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed';
  const grayBtn =
    'bg-[#2b2f42] hover:bg-[#363b53] text-gray-200 text-xs font-black px-3 py-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer shrink-0';
  const card = 'bg-[#21232e] border-2 border-black rounded-xl p-3 flex items-center justify-between gap-2 shadow-[0_2px_0_#000]';
  const travelling = canTravel(vehicles, licenses, coachman);

  const TABS: Array<[Tab, string, React.ReactNode]> = [
    ['license', '执照', <IdCard size={14} key="i" />],
    ['market', '车马市场', <Store size={14} key="s" />],
    ['coachman', '车夫', <UserRound size={14} key="u" />],
  ];

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
          <div className="bg-[#2a2d3e] border-2 border-slate-400/80 px-5 py-1.5 rounded-xl shadow-[0_3px_0_#000] flex items-center gap-2">
            <Car size={18} className="text-slate-200 flex-shrink-0" />
            <span className="text-slate-100 text-sm font-black tracking-widest">驾照管理</span>
          </div>
        </div>
        <div className="flex items-center bg-[#151722] rounded-full px-2.5 py-1 border border-black text-xs font-mono font-black">
          <CurrencyIcon size={14} className="text-yellow-400 mr-1" />
          <span>{money(coins)}</span>
        </div>
      </div>

      <div className="flex gap-1.5 px-4 pt-3 flex-shrink-0">
        {TABS.map(([id, label, icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1 text-xs font-black py-2 rounded-xl border-2 border-black cursor-pointer ${
              tab === id ? 'bg-slate-200 text-black' : 'bg-[#2d2f3d] text-gray-300'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-1">
          <div className={`text-[11px] font-black ${travelling ? 'text-emerald-300' : 'text-gray-400'}`}>
            {travelling ? `🐎 出行有车马代步：付得起开销的月份健康恢复 +${VEHICLE_HEALTH_BONUS}` : '🚶 目前出行靠步行'}
          </div>
          <p className="text-[10px] text-gray-400 font-bold">
            马车要配挽马，由持照的本人或车夫驾驶；汽车需本人持汽车执照；骑乘马、名驹可直接骑。马匹车辆每月按价格 1% 付保养。车马与车夫属于家族，传承后保留；执照是个人证件，继承人需重新报考。
          </p>
        </div>

        {tab === 'license' && (
          <>
            <p className="text-[11px] text-gray-300 font-bold">年满 {LICENSE_MIN_AGE} 岁可报考。持马车执照可应聘「车夫」。</p>
            {LICENSES.map((def) => {
              const has = licenses.includes(def.id);
              const blocked = licenseBlocked(def, ctx);
              return (
                <div key={def.id} className={card}>
                  <div className="min-w-0">
                    <div className="text-white font-black text-xs">{def.name}</div>
                    <div className="text-[10px] text-gray-400 font-bold mt-0.5">
                      考试费 {money(def.fee)}
                      {def.fromYear > 0 && ` · ${def.fromYear} 年起开考`}
                    </div>
                    {!has && blocked && <div className="text-[10px] text-rose-300 font-bold mt-0.5">{blocked}</div>}
                  </div>
                  {has ? (
                    <span className="text-emerald-300 text-xs font-black shrink-0">✅ 已持有</span>
                  ) : (
                    <button onClick={() => takeExam(def)} disabled={!!blocked} className={btn}>
                      报考
                    </button>
                  )}
                </div>
              );
            })}
          </>
        )}

        {tab === 'market' &&
          KIND_ORDER.map((kind) => (
            <div key={kind} className="space-y-2">
              <div className="text-xs font-black text-gray-300 pt-1">{VEHICLE_KIND_LABEL[kind]}</div>
              {VEHICLES.filter((v) => v.kind === kind).map((def) => {
                const owned = vehicles.includes(def.id);
                const blocked = purchaseBlocked(def, ctx);
                const locked = gameYear < def.fromYear;
                return (
                  <div key={def.id} className={`${card} ${locked ? 'opacity-60' : ''}`}>
                    <div className="min-w-0">
                      <div className="text-white font-black text-xs">{def.name}</div>
                      <div className="text-[10px] text-gray-400 font-bold mt-0.5">{def.desc}</div>
                      <div className="text-[11px] text-amber-300 font-black mt-1">
                        {owned ? `转卖价 ${money(vehicleResale(def))}` : money(def.price)}
                        {!owned && def.reputation > 0 && ` · 声望 +${def.reputation}`}
                        {def.kind === 'estate'
                          ? ` · 每月繁育卖马分红，战乱年份 ×1.5；${Math.round(RANCH_PLAGUE_CHANCE * 100)}% 闹马瘟（兽医费 ${money(RANCH_VET_FEE)}）`
                          : ` · 每月保养 ${money(vehicleUpkeep(def))}`}
                      </div>
                      {locked && <div className="text-[10px] text-gray-400 font-bold mt-0.5">本时代未开放（{def.fromYear} 年起）</div>}
                      {!owned && !locked && blocked && <div className="text-[10px] text-rose-300 font-bold mt-0.5">{blocked}</div>}
                    </div>
                    {owned ? (
                      <button onClick={() => sell(def)} className={grayBtn}>
                        出售
                      </button>
                    ) : (
                      <button onClick={() => buy(def)} disabled={!!blocked} className={btn}>
                        购买
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

        {tab === 'coachman' && (
          <>
            <div className={card}>
              <div className="min-w-0">
                <div className="text-white font-black text-xs">
                  {coachman ? `${coachman.kind === 'hired' ? '雇来的' : '买来的'}车夫：${coachman.name}` : '家里还没有车夫'}
                </div>
                <div className="text-[10px] text-gray-400 font-bold mt-0.5">
                  {coachman
                    ? coachman.kind === 'hired'
                      ? `月薪 ${money(HIRED_COACHMAN_WAGE)}；付不起工钱会辞工`
                      : `每月口粮 ${money(SLAVE_FOOD)}；每月可能逃跑，动乱年份与断粮时更容易逃`
                    : '有车夫替你驾马车，本人没有马车执照也能出行'}
                </div>
              </div>
              {coachman && (
                <button onClick={release} className={grayBtn}>
                  {coachman.kind === 'slave' ? '还他自由' : '辞退'}
                </button>
              )}
            </div>
            {!coachman && (
              <>
                <div className={card}>
                  <div className="min-w-0">
                    <div className="text-white font-black text-xs">雇佣车夫</div>
                    <div className="text-[10px] text-gray-400 font-bold mt-0.5">从车马行雇一名熟手，月薪 {money(HIRED_COACHMAN_WAGE)}。</div>
                  </div>
                  <button onClick={hire} disabled={!isRegistered} className={btn}>
                    雇佣
                  </button>
                </div>
                <div className={card}>
                  <div className="min-w-0">
                    <div className="text-white font-black text-xs">奴隶市场</div>
                    <div className="text-[10px] text-gray-400 font-bold mt-0.5">
                      身价 {money(SLAVE_PRICE)}，每月口粮 {money(SLAVE_FOOD)}；声望 {SLAVE_REPUTATION}，可能逃跑；{SLAVE_TRADE_ENDS} 年帝国灭亡后废除。
                    </div>
                    {slaveBlocked({ isRegistered, year: gameYear, coins, coachman }) && (
                      <div className="text-[10px] text-rose-300 font-bold mt-0.5">{slaveBlocked({ isRegistered, year: gameYear, coins, coachman })}</div>
                    )}
                  </div>
                  <button onClick={buySlave} disabled={!!slaveBlocked({ isRegistered, year: gameYear, coins, coachman })} className={btn}>
                    买下
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
