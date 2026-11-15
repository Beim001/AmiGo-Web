import { randomPlayerName } from '../lib/names';
import React, { useState } from 'react';
import {
  ChevronLeft,
  Baby,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CircleDollarSign,
  User,
  RefreshCw,
  Edit3,
  Copy,
  Check,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { validatePlayerName } from '../utils/sensitiveWords';
import { CharacterAvatar } from './CharacterAvatar';
import { Appearance, APPEARANCE_PARTS, randomAppearance } from '../lib/appearance';

export interface BirthModalProps {
  onClose: () => void;
  isRegistered: boolean;
  playerName: string;
  setPlayerName: (name: string) => void;
  gender: string | null;
  age: number;
  gameYear?: number;
  gameMonth?: number;
  coins?: number;
  setCoins?: React.Dispatch<React.SetStateAction<number>>;
  health?: number;
  setHealth?: React.Dispatch<React.SetStateAction<number>>;
  /** 出生登记：name 为「名·姓」或只有名；preferredSurname 为玩家填写的姓（留空则随机家族姓） */
  onRegisterBirth: (name: string, preferredSurname?: string, appearance?: Appearance) => { gender: string; age: number; classLabel?: string; surname?: string; name?: string };
  onOpenGender?: () => void;
  onOpenHousing?: () => void;
  onOpenVisa?: () => void;
}

// 推荐备选姓名

export const BirthModal: React.FC<BirthModalProps> = ({
  onClose,
  isRegistered,
  playerName,
  setPlayerName,
  gender,
  age,
  gameYear = 1870,
  coins = 0,
  onRegisterBirth,
  onOpenGender,
}) => {
  const [isEditing, setIsEditing] = useState(!isRegistered);
  // 姓名分「名」「姓」两栏（第 56 题）：名·姓
  const initialName = playerName && playerName !== '阿米诺斯市民' ? playerName : '';
  const splitName = (full: string) => {
    const dot = full.lastIndexOf('·');
    return dot >= 0 ? { given: full.slice(0, dot), surname: full.slice(dot + 1) } : { given: full, surname: '' };
  };
  const [inputName, setInputName] = useState(splitName(initialName).given);
  const [inputSurname, setInputSurname] = useState(isRegistered ? splitName(initialName).surname : '');
  const fullNameOf = (given: string, surname: string) => (surname ? `${given}·${surname}` : given);
  // 捏脸（第 61 题）：出生登记时自由选择；性别登记时才随机决定，胡子只对男性显示
  const [face, setFace] = useState<Appearance>(() => randomAppearance(null));
  const cycle = (key: keyof Appearance, n: number, dir: number) => setFace((f) => ({ ...f, [key]: (((f[key] as number) ?? 0) + dir + n) % n }));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [stampedEffect, setStampedEffect] = useState(false);

  // 公民身份认证编号：每位玩家首次生成后持久化（重置人生时随 amigo_* 存档一起清除）
  const [citizenId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('amigo_citizen_id');
      if (saved) return saved;
      const generated = `AMN-${gameYear}-${Math.floor(10000000 + Math.random() * 90000000)}`;
      localStorage.setItem('amigo_citizen_id', generated);
      return generated;
    } catch (e) {
      return `AMN-${gameYear}-${Math.floor(10000000 + Math.random() * 90000000)}`;
    }
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  // 随机只换「名」，保留已填写的姓
  const handleRandomName = () => {
    setInputName(splitName(randomPlayerName()).given);
    setErrorMsg(null);
  };

  const handleCopyCitizenId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(citizenId);
    }
    setIsCopied(true);
    showToast('已复制公民身份编号');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleStamp = () => {
    setStampedEffect(true);
    showToast('已加盖出生登记公章');
    setTimeout(() => setStampedEffect(false), 1000);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const given = inputName.trim().replace(/·/g, '');
    const surname = inputSurname.trim().replace(/·/g, '');
    if (!given) {
      setErrorMsg('请输入名字');
      return;
    }
    const trimmed = fullNameOf(given, surname);

    const validation = validatePlayerName(trimmed);
    if (!validation.valid) {
      setErrorMsg(validation.reason || '姓名不合规，请修改后重试');
      return;
    }

    setErrorMsg(null);
    setPlayerName(trimmed);

    // 首次登记完全随机确定性别
    if (!isRegistered) {
      const regRes = onRegisterBirth(trimmed, surname, face);
      if (regRes.name) {
        const parts = splitName(regRes.name);
        setInputName(parts.given);
        setInputSurname(parts.surname);
      }
      if (surname && regRes.surname && regRes.surname !== surname) {
        showToast(`你出生在皇族纳海王朝，家族姓只能是「${regRes.surname}」`);
        setIsEditing(false);
        return;
      }
      showToast(`已完成出生登记：${regRes.name ?? trimmed}，${regRes.classLabel ?? ''}之家 · ${regRes.surname ?? ''}家族，性别【${regRes.gender}】`);
    } else {
      showToast(`已更新公民姓名【${trimmed}】`);
    }

    setIsEditing(false);
  };

  return (
    <div className="absolute inset-0 bg-[#12141c] flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-200 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#2d3042] text-white border-2 border-black font-bold text-xs px-4 py-2 rounded-xl shadow-[0_4px_0_#000] animate-in fade-in slide-in-from-top-2 duration-200 text-center max-w-[90%] truncate">
          {toastMsg}
        </div>
      )}

      {/* Top Header Bar */}
      <div className="relative w-full h-16 bg-[#1f2230] border-b-2 border-black shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20 flex items-center justify-between px-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-2 bg-[#2d3042] hover:bg-[#393d54] border-2 border-black rounded-xl active:translate-y-0.5 shadow-[0_2px_0_#000] cursor-pointer text-white flex items-center justify-center transition-all z-10"
        >
          <ChevronLeft size={20} className="text-white" strokeWidth={3} />
        </button>

        <div className="flex-1 flex items-center justify-center pointer-events-none px-2">
          <div className="bg-[#2a2d3e] border-2 border-rose-500/80 px-5 py-1.5 rounded-xl shadow-[0_3px_0_#000] flex items-center gap-2">
            <Baby size={18} className="text-rose-400 flex-shrink-0" />
            <span className="text-rose-300 text-sm font-black tracking-wider">
              出生登记
            </span>
          </div>
        </div>

        <div className="flex items-center bg-[#151722] rounded-full px-2.5 py-1 border border-black text-xs font-mono font-black z-10 shadow-[0_2px_0_#000]">
          <CircleDollarSign size={14} className="text-yellow-400 mr-1" />
          <span className="text-amber-300">{coins.toLocaleString()} ₽</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 custom-scrollbar bg-[#181a24]">
        <div className="space-y-4 max-w-lg mx-auto">
          {/* Registered Overview Card (When registered and not in edit mode) */}
          {isRegistered && !isEditing ? (
            <>
              {/* Official Citizen Certificate Card */}
              <div className="bg-[#232635] border-2 border-black rounded-2xl p-4 sm:p-5 shadow-[0_4px_0_#000] space-y-4">
                {/* Header: Name, Age & Gender */}
                <div className="flex justify-between items-center pb-3 border-b border-black/40">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold mb-1">
                      <BadgeCheck size={14} className="text-emerald-400" />
                      <span>合法公民身份</span>
                    </div>
                    <div className="text-white font-black text-xl tracking-wide flex items-center gap-2">
                      <span>{playerName}</span>
                      <span className="text-xs text-gray-400 font-mono font-normal">
                        ({age} 岁)
                      </span>
                    </div>
                  </div>

                  <div
                    className={`px-3 py-1.5 rounded-xl border-2 border-black font-black text-xs flex items-center gap-1.5 shadow-[0_2px_0_#000] ${
                      gender === '女'
                        ? 'bg-pink-500/20 text-pink-300 border-pink-500/60'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/60'
                    }`}
                  >
                    <span className="text-sm font-bold">{gender === '女' ? '♀' : '♂'}</span>
                    <span>{gender === '女' ? '法定性别：女' : '法定性别：男'}</span>
                  </div>
                </div>

                {/* Details List */}
                <div className="space-y-2 text-xs">
                  {/* Citizen ID Row */}
                  <div className="bg-[#181a24] border border-black rounded-xl p-3 flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1.5 font-bold">
                      <FileText size={14} className="text-sky-400" />
                      <span>公民身份编号</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCitizenId}
                      className="flex items-center gap-1.5 text-sky-200 hover:text-white font-mono font-bold bg-[#232635] hover:bg-[#2e3247] border border-black px-2.5 py-1 rounded-lg cursor-pointer transition-colors active:translate-y-0.5"
                      title="点击复制"
                    >
                      <span>{citizenId}</span>
                      {isCopied ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} className="text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* Status and Initial Age */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#181a24] border border-black rounded-xl p-3 flex items-center justify-between">
                      <span className="text-gray-400 font-bold">公民状态</span>
                      <span className="text-emerald-400 font-black flex items-center gap-1">
                        <CheckCircle2 size={13} />
                        <span>正式生效</span>
                      </span>
                    </div>

                    <div className="bg-[#181a24] border border-black rounded-xl p-3 flex items-center justify-between">
                      <span className="text-gray-400 font-bold">初始年龄</span>
                      <span className="text-gray-200 font-mono font-bold">8 岁</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Verification Section with Stamp */}
                <div className="pt-3 border-t border-black/40 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-gray-400 space-y-0.5">
                    <div className="font-bold text-gray-300">签发机构：阿米诺斯民政公署</div>
                    <div>登记纪元：公历 {gameYear} 年</div>
                  </div>

                  {/* Official Stamp */}
                  <button
                    type="button"
                    onClick={handleStamp}
                    className={`border-2 border-red-500 text-red-400 bg-red-950/20 hover:bg-red-950/40 rounded-xl px-2.5 py-1.5 text-center rotate-[-3deg] shadow-sm select-none cursor-pointer transition-all active:scale-95 flex-shrink-0 ${
                      stampedEffect ? 'scale-105 bg-red-950/50' : ''
                    }`}
                    title="点击加盖公章"
                  >
                    <div className="text-[9px] font-black tracking-wider">阿米诺斯民政署</div>
                    <div className="text-[11px] font-black tracking-widest leading-tight">【出生登记章】</div>
                    <div className="text-[8px] font-mono text-red-300/80">VERIFIED · 1870</div>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="bg-[#2d3042] hover:bg-[#393d54] text-white font-black text-xs py-3.5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <Edit3 size={15} />
                  <span>修改姓名</span>
                </button>

                {onOpenGender && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenGender();
                    }}
                    className="bg-[#88508a] hover:bg-[#9d5e9f] text-white font-black text-xs py-3.5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ShieldCheck size={15} />
                    <span>性别权利</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Registration / Edit Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Input Card */}
              <div className="bg-[#232635] border-2 border-black rounded-2xl p-4 sm:p-5 shadow-[0_4px_0_#000] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-white flex items-center gap-1.5">
                    <User size={15} className="text-rose-400" />
                    <span>公民姓名（名 · 姓，合计 2–10 字）</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleRandomName}
                    className="text-[11px] bg-[#181a24] hover:bg-[#2b2e40] text-gray-300 font-bold px-2.5 py-1 rounded-lg border border-black cursor-pointer active:translate-y-0.5 flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw size={12} />
                    <span>随机姓名</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold mb-1">名</div>
                    <input
                      type="text"
                      value={inputName}
                      onChange={(e) => {
                        setInputName(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="例如 阿德弟吉"
                      maxLength={9}
                      className="w-full bg-[#181a24] border-2 border-black focus:border-rose-400 rounded-xl p-3 text-sm font-bold text-white focus:outline-none shadow-inner"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold mb-1">姓（家族姓）</div>
                    <input
                      type="text"
                      value={inputSurname}
                      onChange={(e) => {
                        setInputSurname(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      disabled={isRegistered}
                      placeholder={isRegistered ? '' : '留空则随机'}
                      maxLength={8}
                      title={isRegistered ? '家族姓在出生登记时确定，不能修改' : '家族会沿用这个姓；留空则随机'}
                      className="w-full bg-[#181a24] border-2 border-black focus:border-rose-400 rounded-xl p-3 text-sm font-bold text-white focus:outline-none shadow-inner disabled:opacity-60"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 font-bold text-right font-mono">
                  {fullNameOf(inputName.trim(), inputSurname.trim()).length}/10 · 预览：{fullNameOf(inputName.trim(), inputSurname.trim()) || '—'}
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-500/40 rounded-xl p-2.5">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              {!isRegistered && (
                <div className="bg-[#232635] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-white">捏脸</span>
                    <button
                      type="button"
                      onClick={() => setFace(randomAppearance(null))}
                      className="text-[11px] bg-[#181a24] hover:bg-[#2b2e40] text-gray-300 font-bold px-2.5 py-1 rounded-lg border border-black cursor-pointer"
                    >
                      随机
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-24 h-28 bg-[#181a24] rounded-xl border border-black relative shrink-0">
                      <CharacterAvatar clothing="default" appearance={face} age={20} gender={face.beard > 0 ? '男' : null} />
                    </div>
                    <div className="flex-1 space-y-1">
                      {APPEARANCE_PARTS.map((p) => (
                        <div key={p.key} className="flex items-center gap-1 text-[11px] font-black text-white">
                          <span className="w-8 text-gray-400">{p.label}</span>
                          <button type="button" onClick={() => cycle(p.key, p.options.length, -1)} className="px-1.5 bg-[#181a24] rounded border border-black cursor-pointer">
                            ◀
                          </button>
                          <span className="flex-1 text-center">{p.options[face[p.key] ?? 0]}</span>
                          <button type="button" onClick={() => cycle(p.key, p.options.length, 1)} className="px-1.5 bg-[#181a24] rounded border border-black cursor-pointer">
                            ▶
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold mt-2">预览为成年后的样子。五官与肤色出生后不能再改，发型、发色、胡子可以在商城的理发店修改。胡子只有男性显示；少数人天生「倾国倾城」，会使用特殊外貌。</p>
                </div>
              )}

              {/* Notice Card */}
              <div className="bg-[#232635] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] text-xs text-gray-300 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-rose-400" />
                  <span>登记说明</span>
                </div>
                <div className="text-gray-400 leading-relaxed text-[11px] space-y-1">
                  <p>• 生理性别将在登记时由系统完全随机确定（登记完成后可在「性别权利」中更正）。</p>
                  <p>• 登记成功后将确立合法公民身份，生成公民身份编号并加盖登记公章，初始年龄确立为 8 岁。</p>
                  <p>• 家族会沿用你填写的姓；留空则按出身随机。家族阶层仍随机决定，若出生在皇族，家族姓固定为纳海。</p>
                </div>
              </div>

              {/* Submit & Cancel Buttons */}
              <div className="flex gap-2">
                {isRegistered && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-[#2d3042] hover:bg-[#393d54] text-white font-black text-xs py-3.5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer transition-all"
                  >
                    取消
                  </button>
                )}

                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3.5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={16} />
                  <span>{isRegistered ? '保存修改' : '完成出生登记'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
