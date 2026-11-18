import React, { useState } from 'react';
import { Crown, RotateCcw, Users } from 'lucide-react';
import { HeirCandidate, HEIR_MIN_AGE } from '../lib/family';
import { useTranslation } from 'react-i18next';

export interface SuccessionModalProps {
  /** 去世的主角 */
  deceasedName: string;
  deceasedAge: number;
  heirs: HeirCandidate[];
  /** keepRecords：是否把前任主角的人生大事写入族谱 */
  onChooseHeir: (heirId: string, keepRecords: boolean) => void;
  /** 前任主角人生日志中「大事」的条数 */
  majorRecordCount?: number;
  onRestart: () => void;
  onClose: () => void;
}

/** 角色去世后的「传承」界面：由子嗣、孙辈（第 73 题）或兄弟姐妹继承，或重开人生（undefined.md 第 21 题） */
export const SuccessionModal: React.FC<SuccessionModalProps> = ({ deceasedName, deceasedAge, heirs, onChooseHeir, onRestart, onClose, majorRecordCount = 0 }) => {
  const { t } = useTranslation('succession');
  const [confirm, setConfirm] = useState<HeirCandidate | 'restart' | null>(null);
  const [keepRecords, setKeepRecords] = useState(true);
  const children = heirs.filter((h) => h.kind === 'child');
  const descendants = heirs.filter((h) => h.kind === 'grandchild');
  const siblings = heirs.filter((h) => h.kind === 'sibling');

  const list = (title: string, items: HeirCandidate[]) =>
    items.length > 0 && (
      <div className="space-y-2">
        <div className="text-xs font-black text-yellow-400">{title}</div>
        {items.map((h) => (
          <div key={h.id} className="bg-[#21232e] border-2 border-black rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-[0_2px_0_#000]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-9 h-9 rounded-full border-2 border-black flex items-center justify-center text-white font-black text-xs shrink-0 ${h.gender === '女' ? 'bg-[#c06a8a]' : 'bg-[#4a7aa8]'}`}>
                {h.name[0]}
              </div>
              <div className="min-w-0">
                <div className="text-white font-black text-xs truncate">{h.name}</div>
                <div className="text-gray-400 text-[10px] font-bold">{t('heirMeta', { relation: h.relation, gender: h.gender, age: h.age })}</div>
              </div>
            </div>
            <button
              onClick={() => setConfirm(h)}
              className="bg-amber-400 hover:bg-amber-300 text-black text-[11px] font-black px-3 py-1.5 rounded-lg border-2 border-black shadow-[0_2px_0_#000] cursor-pointer shrink-0"
            >
              {t('choose')}
            </button>
          </div>
        ))}
      </div>
    );

  return (
    <div className="fixed inset-0 z-[110] bg-black/85 flex items-center justify-center p-4">
      <div className="bg-[#2d2f3d] border-4 border-black rounded-2xl p-4 max-w-sm w-full shadow-[0_8px_0_#000] space-y-4 text-white max-h-[90dvh] overflow-y-auto">
        <div className="text-center space-y-1">
          <div className="text-3xl">🕯️</div>
          <h3 className="font-black text-base">{t('title')}</h3>
          <p className="text-xs text-gray-300 font-bold">
            {t('intro', { name: deceasedName, age: deceasedAge })}
          </p>
          <p className="text-[10px] text-gray-400 font-bold">{t('rules')}</p>
        </div>

        {heirs.length > 0 && (
          <label className="flex items-start gap-2 bg-[#21232e] border border-black rounded-xl p-2.5 text-[11px] font-bold text-gray-300 cursor-pointer">
            <input type="checkbox" checked={keepRecords} onChange={(e) => setKeepRecords(e.target.checked)} className="mt-0.5 accent-amber-400" />
            <span>
              {t('keepRecords', { name: deceasedName, count: majorRecordCount })}
            </span>
          </label>
        )}

        {list(t('children'), children)}
        {list(t('descendants'), descendants)}
        {list(t('siblings'), siblings)}
        {heirs.length === 0 && (
          <div className="bg-[#21232e] border border-black rounded-xl p-3 text-xs text-gray-400 font-bold flex items-center gap-2">
            <Users size={14} /> {t('noHeirs', { age: HEIR_MIN_AGE })}
          </div>
        )}

        <button
          onClick={() => setConfirm('restart')}
          className="w-full bg-rose-900/80 hover:bg-rose-800 text-rose-100 text-xs font-black py-2.5 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer flex items-center justify-center gap-1.5"
        >
          <RotateCcw size={14} /> {t('restart')}
        </button>
        <button onClick={onClose} className="w-full text-center text-[11px] text-gray-400 font-bold hover:text-white cursor-pointer">
          {t('later')}
        </button>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-[120] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#2d2f3d] border-4 border-black rounded-2xl p-4 max-w-xs w-full space-y-3 text-white">
            <p className="text-sm font-black text-center">
              {confirm === 'restart' ? t('confirmRestart') : t('confirmHeir', { relation: confirm.relation, name: confirm.name })}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setConfirm(null)} className="bg-gray-600 hover:bg-gray-500 text-white text-xs font-black py-2 rounded-xl border-2 border-black cursor-pointer">
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  if (confirm === 'restart') onRestart();
                  else onChooseHeir(confirm.id, keepRecords);
                  setConfirm(null);
                }}
                className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-black py-2 rounded-xl border-2 border-black shadow-[0_3px_0_#000] cursor-pointer flex items-center justify-center gap-1"
              >
                {confirm === 'restart' ? <RotateCcw size={12} /> : <Crown size={12} />} {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
