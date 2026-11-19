import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Game } from './useGameState';
import type { useCloudSave } from '../lib/cloudSave';
import { currentSeason } from '../data/seasons';
import { advanceMonth, OwnedProperty } from '../lib/monthTick';
import { loadStored, saveStored } from '../lib/storage';
import { readSimRecent, recordSimRecent } from '../lib/simEvents';
import { loadAccounts, saveAccounts as persistBankAccounts, formatRate } from '../lib/bank';
import { loadMarket, saveMarket } from '../lib/stockMarket';
import { loadLicenses, loadVehicles, loadCoachman, saveCoachman } from '../lib/vehicles';
import { loadPrison, savePrison, saveCriminalRecord } from '../lib/prison';
import { readChildJob, CHILD_JOB_KEY } from '../lib/lineage';
import { LAST_WORK_MONTH_KEY } from '../lib/monthly';
import { addLifeLog } from '../lib/lifeLog';
import { unlockAchievement } from '../lib/achievements';
import { JOB_POSITIONS, readCurrentJobId } from '../components/JobModal';

/**
 * 推进游戏月份：读取存档中的输入，调用纯函数 advanceMonth（lib/monthTick.ts）完成月度结算，
 * 再把结果写回游戏状态、本地存档与云端；并在开发测试工具「一键快进」时逐月自动推进。
 * 结算规则都在 monthTick.ts，这里只负责读写与界面提示。
 */
export const useMonthAdvance = ({
  game,
  currentAge,
  playerOccupation,
  changeReputation,
  setPendingCoup,
  setShowSuccession,
  showToast,
  cloud,
  fastForwardRemaining,
  setFastForwardRemaining,
  smartFastForward,
}: {
  game: Game;
  currentAge: number;
  playerOccupation: string;
  changeReputation: (delta: number) => void;
  /** 本月有子嗣逼宫时交给传承流程处理 */
  setPendingCoup: (heirId: string) => void;
  setShowSuccession: (show: boolean) => void;
  showToast: (msg: string) => void;
  cloud: ReturnType<typeof useCloudSave>;
  /** 一键快进剩余的月数（0 = 未在快进） */
  fastForwardRemaining: number;
  setFastForwardRemaining: React.Dispatch<React.SetStateAction<number>>;
  /** 智能快进由简洁模式的 hook 逐月推进，这里不处理 */
  smartFastForward: boolean;
}) => {
  const { t } = useTranslation('app');
  const { isRegistered, gender, birthRegisteredYear, playerName, coins, health, gameYear, gameMonth, bankDeposit, bankLoan, family, disease, playerTraits, reputation, guardianship, simEvents, auction, appearance, playerLifespan, antibodies, godMode } = game.state;
  const { setCoins, setHealth, setGameYear, setGameMonth, setBankDeposit, setBankLoan, setFamily, setDisease, setGuardianship, setSimEvents, setSimQuiet, setAuction, setAntibodies } = game.setters;

  const handleNextMonth = () => {
    // 角色已故：不能继续推进时间（undefined.md 第 1 题）
    if (isRegistered && health <= 0) {
      showToast(t('toast.deceasedCannotAdvance'));
      return;
    }

    let nextM = gameMonth + 1;
    let nextY = gameYear;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    // 第 58 题：本赛季只推演到卡罗尼亚帝国结束（1920 年）
    const seasonEnd = currentSeason().endGameYear;
    if (seasonEnd !== undefined && nextY > seasonEnd) {
      showToast(t('toast.seasonEnded', { year: seasonEnd, event: currentSeason().endEvent ?? t('toast.seasonEndedDefault') }));
      setFastForwardRemaining(0);
      return;
    }
    setGameMonth(nextM);
    setGameYear(nextY);
    try {
      localStorage.setItem('amigo_game_year', nextY.toString());
      localStorage.setItem('amigo_game_month', nextM.toString());
    } catch (e) {}

    // 结算本身是纯函数（lib/monthTick.ts）；这里读取存档中的输入，再把结果写回状态与存档
    const savedProps = loadStored<unknown>('amigo_owned_properties', null);
    const currentJobId = readCurrentJobId();
    const r = advanceMonth({
      year: gameYear,
      month: gameMonth,
      nextYear: nextY,
      nextMonth: nextM,
      isRegistered,
      birthRegisteredYear,
      currentAge,
      playerName,
      gender,
      playerOccupation,
      playerTraits,
      appearance,
      godMode,
      playerLifespan,
      coins,
      health,
      reputation,
      family,
      disease,
      antibodies,
      guardianship,
      hasAuction: !!auction,
      pendingSimEventIds: simEvents.map((e) => e.defId),
      simRecent: readSimRecent(),
      bankAccounts: loadAccounts(bankDeposit, bankLoan),
      market: loadMarket(),
      properties: Array.isArray(savedProps) ? (savedProps as OwnedProperty[]) : null,
      rental: loadStored<{ monthlyRent?: number; comfortBonus?: number } | null>('amigo_current_rental', null),
      vehicles: loadVehicles(),
      licenses: loadLicenses(),
      coachman: loadCoachman(),
      prison: loadPrison(),
      job: (currentJobId ? JOB_POSITIONS.find((j) => j.id === currentJobId) : null) ?? null,
      childJob: readChildJob(),
    });

    r.logs.forEach((entry) => addLifeLog(...entry));
    if (r.properties) {
      try {
        localStorage.setItem('amigo_owned_properties', JSON.stringify(r.properties));
      } catch (e) {}
    }
    if (r.coachman !== undefined) saveCoachman(r.coachman);
    if (r.prison !== undefined) savePrison(r.prison);
    if (r.criminalRecord) saveCriminalRecord(r.criminalRecord);
    if (r.childJobEnded) {
      try {
        localStorage.removeItem(CHILD_JOB_KEY);
      } catch (e) {}
    }
    if (r.salary > 0) {
      try {
        const earned = Number(localStorage.getItem('amigo_job_earned_coins') || 0) + r.salary;
        const months = Number(localStorage.getItem('amigo_job_months_worked') || 0) + 1;
        localStorage.setItem('amigo_job_earned_coins', String(earned));
        localStorage.setItem('amigo_job_months_worked', String(months));
      } catch (e) {}
      saveStored(LAST_WORK_MONTH_KEY, nextY * 12 + nextM);
    }
    const bankTotals = persistBankAccounts(r.bankAccounts);
    setBankDeposit(bankTotals.deposit);
    setBankLoan(bankTotals.loan);
    setCoins((prev) => Math.max(0, prev + r.netChange));
    saveMarket(r.market);
    if (isRegistered) setDisease(r.disease);
    const newAntibody = r.newAntibody;
    if (newAntibody) setAntibodies((prev) => (prev.includes(newAntibody) ? prev : [...prev, newAntibody]));
    setHealth(r.health);
    if (r.pendingCoup) setPendingCoup(r.pendingCoup);
    if (r.guardianship !== undefined) setGuardianship(r.guardianship);
    if (r.family !== family) setFamily(r.family);
    if (r.familyCash !== 0) setCoins((prev) => Math.max(0, prev + r.familyCash));
    if (r.repDelta !== 0) changeReputation(r.repDelta);
    r.achievements.forEach((id) => unlockAchievement(id));
    const simEvent = r.simEvent;
    if (simEvent) {
      recordSimRecent(simEvent.defId, nextY, nextM);
      setSimEvents((prev) => [...prev, simEvent]);
      setSimQuiet(null);
    } else if (r.simQuiet) {
      setSimQuiet(r.simQuiet);
    }
    if (r.auction.action === 'open') setAuction(r.auction.next);
    else if (r.auction.action === 'close') setAuction(null);

    const mStr = nextM < 10 ? `0${nextM}` : `${nextM}`;
    const { notes, enteredEvent, ageNextMonth } = r;
    if (r.died) {
      setShowSuccession(true);
      showToast(t('toast.died', { date: `${nextY}.${mStr}`, name: playerName, age: ageNextMonth }));
    } else if (enteredEvent) {
      showToast(t('toast.crisis', { title: enteredEvent.title, rate: formatRate(enteredEvent.loanRateDelta), notes: notes.join('｜') }));
    } else {
      showToast(t('toast.newMonth', { date: `${nextY}.${mStr}`, notes: notes.join('｜') }));
    }
    // 等本月结算写入本地存档后再同步到云端
    setTimeout(() => void cloud.saveNow(), 1500);
  };

  // 开发测试工具：一键快进。每次只推进一个月，等界面用新状态重新渲染后再推进下一个月，
  // 保证每个月都按最新的现金、健康、家族等状态完整结算；角色去世时自动停止。
  React.useEffect(() => {
    if (fastForwardRemaining <= 0 || smartFastForward) return;
    if (isRegistered && health <= 0) {
      setFastForwardRemaining(0);
      return;
    }
    const timer = setTimeout(() => {
      handleNextMonth();
      setFastForwardRemaining((n) => Math.max(0, n - 1));
    }, 0);
    return () => clearTimeout(timer);
  }, [fastForwardRemaining, gameYear, gameMonth, health, smartFastForward]);

  return { handleNextMonth };
};
