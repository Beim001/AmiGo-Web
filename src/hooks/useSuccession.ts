import React, { useState } from 'react';
import { ageAt, buildFamilyMembers, succeed, findDescendant, findDescendantPath, heirStartHealth, HEIR_MAX_DEPTH, Gender, FamilyMemberView } from '../lib/family';
import { randomTraits } from '../lib/traits';
import { REP, clampReputation } from '../lib/reputation';
import { unlockAchievement } from '../lib/achievements';
import { randomAppearance } from '../lib/appearance';
import { takeCustody, ORPHANAGE_NAME, ADULT_AGE as GUARDIAN_ADULT_AGE } from '../lib/guardianship';
import { CHILD_JOB_KEY } from '../lib/lineage';
import { addLifeLog, readLifeLog, clearLifeLog } from '../lib/lifeLog';
import { LAST_WORK_MONTH_KEY } from '../lib/monthly';
import { LICENSES_KEY } from '../lib/vehicles';
import { PRISON_KEY, CRIMINAL_RECORD_KEY } from '../lib/prison';
import { COURT_CASES_KEY, COURT_HISTORY_KEY } from '../lib/court';
import { loadAccounts, saveAccounts as persistBankAccounts, currentRateEvent } from '../lib/bank';
import { CURRENT_JOB_KEY, JOB_HISTORY_KEY } from '../components/JobModal';
import type { Game } from './useGameState';
import { CURRENCY } from '../data/seasons';

// 家族传承：角色去世后由子嗣或兄弟姐妹继承（第 21 题），50 岁后主动传位（第 58 题），子嗣逼宫（第 59 题）。
// 未成年继承时一半家产交由监护人托管（第 25 题）。

export const useSuccession = ({ game, currentAge, playerOccupation, setShowSuccession, setFastForwardRemaining, showToast }: {
  game: Game;
  currentAge: number;
  playerOccupation: string;
  setShowSuccession: React.Dispatch<React.SetStateAction<boolean>>;
  setFastForwardRemaining: React.Dispatch<React.SetStateAction<number>>;
  showToast: (msg: string) => void;
}) => {
  const { isRegistered, gender, playerName, coins, health, gameYear, gameMonth, bankDeposit, bankLoan, family, playerTraits, appearance, playerLifespan } = game.state;
  const { setGender, setBirthRegisteredYear, setPlayerName, setCoins, setHealth, setBankDeposit, setBankLoan, setFamily, setDisease, setPlayerTraits, setReputation, setGuardianship, setSimEvents, setAppearance, setPlayerLifespan, setAntibodies } = game.setters;
  /** 由子嗣或兄弟姐妹继承：资产保留，身份、年龄、家族世系换成继承人（undefined.md 第 21 题） */
  /** 主动传位（第 58 题）：主角年满 RETIRE_MIN_AGE 岁，可把家业传给年满 18 岁的在世子女或孙辈（第 73 题） */
  const RETIRE_MIN_AGE = 50;
  const handleSuccession = (heirId: string, keepRecords: boolean, retire = false, coup = false) => {
    const members = buildFamilyMembers(family, {
      playerName,
      playerGender: gender,
      playerAge: currentAge,
      playerOccupation,
      gameYear,
      gameMonth,
    });
    const { state: nextFamily, heir } = succeed(
      family,
      members,
      heirId,
      { name: playerName, gender: (gender === '女' ? '女' : '男') as Gender, age: currentAge, occupation: playerOccupation, appearance: appearance ?? undefined, traits: playerTraits },
      gameYear,
      gameMonth,
      retire ? { lifespan: playerLifespan ?? currentAge + 20, coup } : undefined,
    );
    const newRegYear = gameYear - (heir.age - 8);
    // 第 53 题：子女、孙辈继承时带着自己的抗体；兄弟姐妹没有记录抗体
    const heirSource = findDescendant(family, heirId);
    // 起始健康按代数叠加；继承人出生在历史大事件期间的这一代少加
    const generations = heir.kind === 'sibling' ? 0 : findDescendantPath(family.children, heirId)?.length ?? 1;
    const startHealth = heirStartHealth(family.startHealth, generations, currentRateEvent(heirSource?.birthYear ?? gameYear - heir.age) !== null);
    setAntibodies(heirSource?.antibodies ?? []);
    setAppearance(heirSource?.appearance ?? randomAppearance(heir.gender));
    // 第 17 题：玩家可选择把前任主角的人生大事写入族谱
    const records = keepRecords
      ? readLifeLog()
          .filter((e) => e.category === '大事')
          .map((e) => ({ year: e.year, month: e.month, title: `${playerName}：${e.title}`, desc: e.desc }))
      : [];
    setFamily({ ...nextFamily, startHealth, events: [...nextFamily.events.slice(0, -1), ...records, ...nextFamily.events.slice(-1)] });
    setSimEvents([]);
    setPlayerName(heir.name);
    setGender(heir.gender);
    setBirthRegisteredYear(newRegYear);
    setHealth(startHealth);
    setDisease(null);
    try {
      localStorage.setItem('amigo_player_name', heir.name);
      localStorage.setItem('amigo_gender', heir.gender);
      localStorage.setItem('amigo_birth_registered_year', String(newRegYear));
      // 继承人的职业生涯从头开始
      localStorage.setItem(CURRENT_JOB_KEY, '');
      localStorage.setItem(JOB_HISTORY_KEY, '[]');
      localStorage.removeItem(CHILD_JOB_KEY);
      localStorage.removeItem('amigo_job_months_worked');
      localStorage.removeItem(LAST_WORK_MONTH_KEY);
      // 执照是个人证件，继承人要重新考；车辆属于家族，保留（第 67.4 题）
      localStorage.removeItem(LICENSES_KEY);
      // 服刑与前科是个人的，继承人不受影响（第 67.7 题）
      localStorage.removeItem(PRISON_KEY);
      localStorage.removeItem(CRIMINAL_RECORD_KEY);
      localStorage.removeItem(COURT_CASES_KEY);
      localStorage.removeItem(COURT_HISTORY_KEY);
    } catch (e) {}
    setShowSuccession(false);
    setPlayerTraits(heir.traits && heir.traits.length > 0 ? heir.traits : randomTraits());
    setPlayerLifespan(null);
    setReputation((r) => clampReputation(r * REP.heirShare));
    unlockAchievement('succession');

    // 未成年继承（第 25 题）：现金与存款的一半交由监护人托管，成年后返还
    if (heir.age < GUARDIAN_ADULT_AGE) {
      const newMembers: FamilyMemberView[] = buildFamilyMembers(nextFamily, {
        playerName: heir.name,
        playerGender: heir.gender,
        playerAge: heir.age,
        playerOccupation: '',
        gameYear,
        gameMonth,
      });
      const spouseAlive = family.spouse ? newMembers.find((m) => m.name === family.spouse!.name && m.status !== '已故') : undefined;
      const eldest = newMembers
        .filter((m) => !m.isPlayer && m.status !== '已故' && m.age >= GUARDIAN_ADULT_AGE && ['parent', 'grandparent', 'uncle', 'granduncle', 'sibling'].includes(m.kin ?? ''))
        .sort((a, b) => b.age - a.age)[0];
      const guardianName = spouseAlive?.name ?? eldest?.name ?? ORPHANAGE_NAME;
      const custody = takeCustody(coins, loadAccounts(bankDeposit, bankLoan));
      setCoins(custody.cashLeft);
      const totals = persistBankAccounts(custody.accounts);
      setBankDeposit(totals.deposit);
      setBankLoan(totals.loan);
      setGuardianship({ guardianName, held: custody.held, phase: 'holding', supportPerMonth: 0, supportMonthsLeft: 0 });
      addLifeLog('财富', '监护托管', `${guardianName}代为管理一半家产 ${custody.held.toLocaleString()} ${CURRENCY.symbol}，成年后返还。`, { year: gameYear, month: gameMonth, age: heir.age });
    } else {
      setGuardianship(null);
    }
    // 继承人开始新的人生日志
    clearLifeLog();
    addLifeLog(
      '大事',
      '继承家业',
      coup ? `联合族人逼宫，迫使 ${playerName} 退位，接过了家业。` : retire ? `${playerName} 退居幕后，作为${heir.relation}接过了家业。` : `${playerName} 辞世后，作为${heir.relation}继承了家业。`,
      { year: gameYear, month: gameMonth, age: heir.age },
    );
    showToast((coup ? `⚔️ ${heir.relation} ${heir.name} 逼宫！${playerName} 被迫退位，由 ${heir.name}（${heir.age} 岁）当家` : retire ? `👑 ${playerName} 退居幕后，${heir.relation} ${heir.name}（${heir.age} 岁）接过家业` : `🕯️ ${heir.relation} ${heir.name}（${heir.age} 岁）继承了家业`) + `（起始健康 ${startHealth}）`);
  };
  const [pendingCoup, setPendingCoup] = useState<string | null>(null);
  React.useEffect(() => {
    if (!pendingCoup) return;
    const id = pendingCoup;
    setPendingCoup(null);
    if (isRegistered && health > 0 && family.children.some((c) => c.id === id)) {
      setFastForwardRemaining(0);
      handleSuccession(id, true, true, true);
    }
  }, [pendingCoup]);
  const handleRetire = (heirId: string): string | null => {
    if (!isRegistered || health <= 0) return '角色已故，请使用传承';
    if (currentAge < RETIRE_MIN_AGE) return `年满 ${RETIRE_MIN_AGE} 岁才能传位`;
    // 第 73 题：可以跳过子辈，直接传给孙辈
    const path = findDescendantPath(family.children, heirId);
    if (!path || path.length > HEIR_MAX_DEPTH) return '只能传位给自己的子女或孙辈';
    const heir = path[path.length - 1];
    if (ageAt(heir.birthYear, heir.birthMonth, gameYear, gameMonth) < 18) return `${path.length === 1 ? '子女' : '孙辈'}年满 18 岁才能接班`;
    handleSuccession(heirId, true, true);
    return null;
  };

  return { handleSuccession, setPendingCoup, handleRetire };
};
