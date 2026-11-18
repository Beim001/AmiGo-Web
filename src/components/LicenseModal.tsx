import React, { useState } from 'react';
import { ChevronLeft, Car, IdCard } from 'lucide-react';
import { CurrencyIcon } from './CurrencyIcon';
import { CURRENCY } from '../data/seasons';
import {
  VEHICLES,
  VehicleDef,
  VehicleId,
  LICENSE_MIN_AGE,
  VEHICLE_HEALTH_BONUS,
  licenseBlocked,
  purchaseBlocked,
  loadLicenses,
  loadVehicles,
  saveLicenses,
  saveVehicles,
  vehicleResale,
  vehicleUpkeep,
} from '../lib/vehicles';
import { addLifeLog } from '../lib/lifeLog';

// 驾照管理（第 67.4 题）：帝国时期为马车执照，1900 年后开设汽车执照；考执照、买车、卖车

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

export const LicenseModal: React.FC<LicenseModalProps> = ({ onClose, coins, setCoins, changeReputation, isRegistered, age, gameYear }) => {
  const [licenses, setLicenses] = useState<VehicleId[]>(loadLicenses);
  const [vehicles, setVehicles] = useState<VehicleId[]>(loadVehicles);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 2500);
  };

  const ctx = { isRegistered, age, year: gameYear, coins, licenses, vehicles };
  const money = (n: number) => `${n.toLocaleString()} ${CURRENCY.symbol}`;

  const takeExam = (def: VehicleDef) => {
    const blocked = licenseBlocked(def, ctx);
    if (blocked) return showToast(blocked);
    setCoins((prev) => prev - def.licenseFee);
    const next = [...licenses, def.id];
    setLicenses(next);
    saveLicenses(next);
    addLifeLog('事业', `考取${def.licenseName}`, `交考试费 ${money(def.licenseFee)}，取得${def.licenseName}。`);
    showToast(`🪪 考取${def.licenseName}`);
  };

  const buy = (def: VehicleDef) => {
    const blocked = purchaseBlocked(def, ctx);
    if (blocked) return showToast(blocked);
    setCoins((prev) => prev - def.price);
    changeReputation(def.reputation);
    const next = [...vehicles, def.id];
    setVehicles(next);
    saveVehicles(next);
    addLifeLog('财富', `购入${def.name}`, `花费 ${money(def.price)}，声望 +${def.reputation}。`);
    showToast(`🐎 购入${def.name}，声望 +${def.reputation}`);
  };

  const sell = (def: VehicleDef) => {
    const refund = vehicleResale(def);
    setCoins((prev) => prev + refund);
    const next = vehicles.filter((id) => id !== def.id);
    setVehicles(next);
    saveVehicles(next);
    addLifeLog('财富', `出售${def.name}`, `转卖到账 ${money(refund)}。`);
    showToast(`出售${def.name}，到账 +${money(refund)}`);
  };

  const btn =
    'bg-gradient-to-b from-[#ffe56c] to-[#f5b822] text-black text-xs font-black px-3 py-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed';

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

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-1.5">
          <div className="text-white font-black text-sm">交通署告示</div>
          <p className="text-[11px] text-gray-300 font-bold">
            年满 {LICENSE_MIN_AGE} 岁可报考执照，持照方可购车。车辆每月按车价 1% 付草料、马夫或燃油费；付得起保养、本人又持有执照时出行不必步行，每月健康恢复 +{VEHICLE_HEALTH_BONUS}。
          </p>
          <p className="text-[10px] text-gray-400 font-bold">车辆属于家族，传承后保留；执照是个人证件，继承人需重新报考。持马车执照可应聘「车夫」。</p>
        </div>

        <div className="text-xs font-black text-gray-300 flex items-center gap-1.5 pt-1">
          <IdCard size={14} /> 执照
        </div>
        {VEHICLES.map((def) => {
          const has = licenses.includes(def.id);
          const blocked = licenseBlocked(def, ctx);
          return (
            <div key={`lic_${def.id}`} className="bg-[#21232e] border-2 border-black rounded-xl p-3 flex items-center justify-between gap-2 shadow-[0_2px_0_#000]">
              <div className="min-w-0">
                <div className="text-white font-black text-xs">{def.licenseName}</div>
                <div className="text-[10px] text-gray-400 font-bold mt-0.5">
                  考试费 {money(def.licenseFee)}
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

        <div className="text-xs font-black text-gray-300 flex items-center gap-1.5 pt-1">
          <Car size={14} /> 家族车辆
        </div>
        {VEHICLES.map((def) => {
          const owned = vehicles.includes(def.id);
          const blocked = purchaseBlocked(def, ctx);
          return (
            <div key={`veh_${def.id}`} className="bg-[#21232e] border-2 border-black rounded-xl p-3 flex items-center justify-between gap-2 shadow-[0_2px_0_#000]">
              <div className="min-w-0">
                <div className="text-white font-black text-xs">{def.name}</div>
                <div className="text-[10px] text-gray-400 font-bold mt-0.5">{def.desc}</div>
                <div className="text-[11px] text-amber-300 font-black mt-1">
                  {owned ? `转卖价 ${money(vehicleResale(def))}` : `${money(def.price)} · 声望 +${def.reputation}`} · 每月保养 {money(vehicleUpkeep(def))}
                </div>
                {owned && !licenses.includes(def.id) && <div className="text-[10px] text-rose-300 font-bold mt-0.5">本人没有{def.licenseName}，不能驾驶</div>}
                {!owned && blocked && <div className="text-[10px] text-rose-300 font-bold mt-0.5">{blocked}</div>}
              </div>
              {owned ? (
                <button
                  onClick={() => sell(def)}
                  className="bg-[#2b2f42] hover:bg-[#363b53] text-gray-200 text-xs font-black px-3 py-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer shrink-0"
                >
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
    </div>
  );
};
