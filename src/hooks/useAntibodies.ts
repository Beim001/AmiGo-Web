import type React from 'react';
import { VACCINE_SUCCESS, immunityAfterRecovery, diseaseById, vaccinesAvailable } from '../lib/disease';
import { addLifeLog } from '../lib/lifeLog';
import { FamilyState, ageAt, childLifespan } from '../lib/family';
import { CURRENCY } from '../data/seasons';
import i18n from '../i18n';

// 抗体（第 53 题）：接种疫苗或传染病痊愈后按概率获得，有抗体的病不会再患。抗体列表本身存放在统一游戏状态中

export const useAntibodies = ({ antibodies, setAntibodies, coins, setCoins, gameYear, gameMonth, family, setFamily }: {
  antibodies: string[];
  setAntibodies: React.Dispatch<React.SetStateAction<string[]>>;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  gameYear: number;
  gameMonth: number;
  family: FamilyState;
  setFamily: React.Dispatch<React.SetStateAction<FamilyState>>;
}) => {
  /** 传染病痊愈后按概率获得抗体；返回是否获得 */
  const gainRecoveryImmunity = (diseaseId: string): boolean => {
    if (antibodies.includes(diseaseId) || !immunityAfterRecovery(diseaseId)) return false;
    setAntibodies((prev) => (prev.includes(diseaseId) ? prev : [...prev, diseaseId]));
    addLifeLog('健康', `获得${diseaseById(diseaseId)?.name ?? diseaseId}抗体`, '痊愈后身体产生了抗体，不会再患这种病。');
    return true;
  };
  /** 接种疫苗：给自己，或给所有在世、还没有抗体的子女；返回提示文字 */
  const handleVaccinate = (diseaseId: string, target: 'self' | 'children'): string => {
    const d = diseaseById(diseaseId);
    if (!d || d.vaccineYear === undefined || gameYear < d.vaccineYear) return i18n.t('game:vaccine.notAvailable');
    const cost = d.vaccineCost ?? 0;
    if (target === 'self') {
      if (antibodies.includes(d.id)) return i18n.t('game:vaccine.alreadyHas', { disease: d.name });
      if (coins < cost) return i18n.t('game:vaccine.noMoney', { cost: cost.toLocaleString(), symbol: CURRENCY.symbol });
      setCoins((prev) => prev - cost);
      if (Math.random() < VACCINE_SUCCESS) {
        setAntibodies((prev) => [...prev, d.id]);
        addLifeLog('健康', `接种${d.name}疫苗`, '接种成功，获得了抗体。');
        return i18n.t('game:vaccine.success', { disease: d.name, cost: cost.toLocaleString(), symbol: CURRENCY.symbol });
      }
      addLifeLog('健康', `接种${d.name}疫苗`, '这次接种没有产生抗体。');
      return i18n.t('game:vaccine.failed', { disease: d.name, cost: cost.toLocaleString(), symbol: CURRENCY.symbol });
    }
    const kids = family.children.filter((c) => ageAt(c.birthYear, c.birthMonth, gameYear, gameMonth) < childLifespan(c) && !(c.antibodies ?? []).includes(d.id));
    if (kids.length === 0) return i18n.t('game:vaccine.kidsAllHave', { disease: d.name });
    const total = cost * kids.length;
    if (coins < total) return i18n.t('game:vaccine.kidsNoMoney', { count: kids.length, total: total.toLocaleString(), symbol: CURRENCY.symbol });
    setCoins((prev) => prev - total);
    let ok = 0;
    const ids = new Set(kids.map((k) => k.id));
    setFamily((prev) => ({
      ...prev,
      children: prev.children.map((c) => {
        if (!ids.has(c.id) || Math.random() >= VACCINE_SUCCESS) return c;
        ok++;
        return { ...c, antibodies: [...(c.antibodies ?? []), d.id] };
      }),
    }));
    addLifeLog('健康', `孩子们接种${d.name}疫苗`, `为 ${kids.length} 个孩子接种，花费 ${total.toLocaleString()} ${CURRENCY.symbol}。`);
    return i18n.t('game:vaccine.kidsDone', { count: kids.length, disease: d.name, total: total.toLocaleString(), symbol: CURRENCY.symbol });
  };
  const vaccineList = vaccinesAvailable(gameYear).map((d) => ({ id: d.id, name: d.name, cost: d.vaccineCost ?? 0, owned: antibodies.includes(d.id) }));

  return { gainRecoveryImmunity, handleVaccinate, vaccineList };
};
