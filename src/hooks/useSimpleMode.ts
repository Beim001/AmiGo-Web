import React, { useState } from 'react';
import { childLifespan, ageAt, generateSpouseCandidates, marry, MARRIAGE_FEE, MARRIAGE_MIN_AGE, SPOUSE_MEMBER_ID, canInteract, applyInteraction, GIFT_COST, addHeirloom, buildFamilyMembers, listHeirs, Gender, FamilyMemberView } from '../lib/family';
import { affinityBonus, rollMaintenance, fertileMaxAge, MAINTENANCE_COST, FERTILITY_TRAITS, SIMPLE_MAINTENANCE_CHANCE, SIMPLE_MAINTENANCE_RESERVE, traitNames, traitById } from '../lib/traits';
import { REP } from '../lib/reputation';
import { unlockAchievement, recordGiftsGiven } from '../lib/achievements';
import { currentSeason, CURRENCY } from '../data/seasons';
import { VACCINE_SUCCESS, vaccinesAvailable } from '../lib/disease';
import { SimpleCard } from '../components/SimpleModeView';
import { autoOptionIndex, recommendJobs, recommendHome, shouldSuggestHome, buyRecommended, sellAll } from '../lib/simpleMode';
import { giftById, giftAffinityGain, removeGift } from '../lib/gifts';
import { classById, readChildJob, CHILD_JOB_KEY, CHILD_LABOR_MAX_AGE, CHILD_JOBS } from '../lib/lineage';
import { heirloomById } from '../lib/heirlooms';
import { diseaseInfo } from '../lib/disease';
import { eventDef, resolveOption } from '../lib/simEvents';
import { addLifeLog } from '../lib/lifeLog';
import { isMinor } from '../lib/monthly';
import { loadMarket, STOCK_KEYS, StockHolding, StockTradeLog } from '../lib/stockMarket';
import { JOB_POSITIONS, readCurrentJobId, readJobHistoryIds, CURRENT_JOB_KEY, JOB_HISTORY_KEY } from '../components/JobModal';
import { loadLicenses, meetsLicense } from '../lib/vehicles';
import { isInPrison, candidateCount, hasActiveRecord, barredByRecord } from '../lib/prison';
import { addCase, loadCases, saveCases, suitCase } from '../lib/court';
import { HOUSING_MARKET_PROPERTIES } from '../components/HousingModal';
import { loadStored, saveStored } from '../lib/storage';
import { seededRng } from '../lib/appearance';
import type { Game } from './useGameState';

// 简洁模式（第 49 题）：面向 7 岁儿童的一屏界面，与完整模式共用存档。
// 「过一个月」前自动治病、接种、处理推演、送礼与保养；人生节点弹出大卡片（打零工、求职、结婚、买房、传承）；一键炒股；
// 连续推进（过半年、一年、十年）。开发测试工具的「智能快进」也用这里的卡片与选择逻辑。

const SIMPLE_SNOOZE_KEY = 'amigo_simple_snooze';
const USED_SIMPLE_KEY = 'amigo_used_simple_mode';
const MAINTENANCE_LOG_KEY = 'amigo_maintenance_log';

export const useSimpleMode = ({
  game,
  simpleMode,
  toast,
  showToast,
  handleNextMonth,
  currentAge,
  playerOccupation,
  currentDisease,
  familyClass,
  changeReputation,
  gainRecoveryImmunity,
  handleSuccession,
  handleResetLife,
  smartFastForward,
  fastForwardRemaining,
  setFastForwardRemaining,
}: {
  game: Game;
  /** 简洁模式开关（设置项，由 App 持有） */
  simpleMode: boolean;
  /** 当前提示条文字：从中取出最近一次月度结算的明细 */
  toast: string | null;
  showToast: (msg: string) => void;
  handleNextMonth: () => void;
  currentAge: number;
  playerOccupation: string;
  currentDisease: ReturnType<typeof diseaseInfo>;
  familyClass: ReturnType<typeof classById>;
  changeReputation: (delta: number) => void;
  gainRecoveryImmunity: (diseaseId: string) => boolean;
  handleSuccession: (heirId: string, keepRecords: boolean, retire?: boolean, coup?: boolean) => void;
  handleResetLife: () => void;
  /** 开发测试工具：快进时智能安排 */
  smartFastForward: boolean;
  fastForwardRemaining: number;
  setFastForwardRemaining: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const { isRegistered, gender, playerName, coins, health, gameYear, gameMonth, family, playerTraits, simEvents, giftInventory, antibodies, godMode } = game.state;
  const { setCoins, setHealth, setFamily, setDisease, setPlayerTraits, setSimEvents, setSimScore, setGiftInventory, setAntibodies } = game.setters;
  /** 这一世用过简洁模式：排行榜上标「偷懒」，重开人生后清除 */
  const [usedSimpleMode, setUsedSimpleMode] = useState<boolean>(() => loadStored<boolean>(USED_SIMPLE_KEY, false));
  React.useEffect(() => saveStored(USED_SIMPLE_KEY, usedSimpleMode), [usedSimpleMode]);
  React.useEffect(() => {
    if (simpleMode && isRegistered && !usedSimpleMode) setUsedSimpleMode(true);
  }, [simpleMode, isRegistered, usedSimpleMode]);
  /** 保养记录：对象（self / spouse / 子嗣 id）→ 最近一次保养的月份（年 × 12 + 月），每人每月最多一次 */
  const [maintenanceLog, setMaintenanceLog] = useState<Record<string, number>>(() => loadStored<Record<string, number>>(MAINTENANCE_LOG_KEY, {}));
  React.useEffect(() => saveStored(MAINTENANCE_LOG_KEY, maintenanceLog), [maintenanceLog]);
  /** 人生节点卡片「以后再说」：卡片类型 → 到哪个月（年 × 12 + 月）之前不再弹出 */
  const [simpleSnooze, setSimpleSnooze] = useState<Record<string, number>>(() => loadStored<Record<string, number>>(SIMPLE_SNOOZE_KEY, {}));
  React.useEffect(() => saveStored(SIMPLE_SNOOZE_KEY, simpleSnooze), [simpleSnooze]);
  const [simpleAutoNotes, setSimpleAutoNotes] = useState<string[]>([]);
  /** 最近一次月度结算的提示（渲染时从提示文字中取，避免在副作用里连锁更新状态） */
  const simpleMonthNotesRef = React.useRef<string[]>([]);
  if (toast && (toast.startsWith('🗓️') || toast.startsWith('⚠️ 时局剧变'))) simpleMonthNotesRef.current = toast.split('｜').map((t) => t.trim()).filter(Boolean);
  const simpleMonthNotes = simpleMonthNotesRef.current;
  const [simpleAdvancePending, setSimpleAdvancePending] = useState(false);
  const simpleMonthIndex = gameYear * 12 + gameMonth;

  // 自动处理完当月事务、界面用新状态重新渲染后，再推进月份（避免月度结算用到旧的健康、现金）
  React.useEffect(() => {
    if (!simpleAdvancePending) return;
    // 放到下一个宏任务执行，打断副作用里的同步连锁更新（连续推进时会触发 React 的嵌套更新上限警告）
    const timer = setTimeout(() => {
      setSimpleAdvancePending(false);
      handleNextMonth();
    }, 0);
    return () => clearTimeout(timer);
  }, [simpleAdvancePending]);

  /** 「过一个月」前自动处理：治病、补健康、推演事件（选稳妥）、给父母和配偶送礼 */
  const simpleAutoHandle = (): string[] => {
    const out: string[] = [];
    let cash = coins;
    let hp = health;
    const parentsPay = isMinor(currentAge) && familyClass.parentsPayMedical;
    if (currentDisease) {
      const cost = parentsPay ? 0 : currentDisease.cost;
      if (cash >= cost) {
        cash -= cost;
        setDisease(null);
        unlockAchievement('cured');
        addLifeLog('健康', `治愈${currentDisease.name}`, '简洁模式自动就医。');
        if (gainRecoveryImmunity(currentDisease.id)) out.push(`🛡️ 获得${currentDisease.name}抗体`);
        out.push(`🩺 治好了${currentDisease.name}${cost > 0 ? `（-${cost.toLocaleString()} ${CURRENCY.symbol}）` : '（爸妈付钱）'}`);
      } else {
        out.push(`🤒 钱不够，治不了${currentDisease.name}（要 ${cost.toLocaleString()} ${CURRENCY.symbol}）`);
      }
    }
    // 每月自动给自己接种一种还没有抗体的疫苗（钱够时）
    const nextVaccine = vaccinesAvailable(gameYear).find((d) => !antibodies.includes(d.id) && cash >= (d.vaccineCost ?? 0) + 5000);
    if (nextVaccine) {
      cash -= nextVaccine.vaccineCost ?? 0;
      if (Math.random() < VACCINE_SUCCESS) {
        setAntibodies((prev) => (prev.includes(nextVaccine.id) ? prev : [...prev, nextVaccine.id]));
        addLifeLog('健康', `接种${nextVaccine.name}疫苗`, '简洁模式自动接种，获得了抗体。');
        out.push(`💉 接种${nextVaccine.name}疫苗，获得抗体`);
      } else {
        out.push(`💉 接种了${nextVaccine.name}疫苗，这次没有产生抗体`);
      }
    }
    if (hp < 40) {
      const cost = parentsPay ? 0 : 1500;
      if (cash >= cost) {
        cash -= cost;
        hp = Math.min(100, hp + 30);
        out.push('💊 去医院打了营养针，健康 +30');
      }
    }
    let fam = family;
    let score = 0;
    const resolved: string[] = [];
    // 狱中不能处理推演事件（第 67.7 题）
    for (const inst of isInPrison() ? [] : simEvents) {
      const def = eventDef(inst);
      if (!def) continue;
      const idx = autoOptionIndex(def, cash);
      if (idx === null) continue;
      const option = def.options[idx];
      const result = resolveOption(option);
      cash = Math.max(0, cash + result.coins);
      hp = godMode ? 100 : Math.max(0, Math.min(100, hp + result.health));
      score += result.score;
      resolved.push(inst.uid);
      addLifeLog('大事', def.headline, `${option.label}：${result.text}`);
      out.push(`📰 ${def.headline} → ${result.text}`);
      // 受害后可到法院起诉（第 67.6 题）
      if (result.lawsuit) saveCases(addCase(loadCases(), suitCase(result.lawsuit, gameYear, gameMonth, inst.uid)));
      if (result.heirloom) {
        const h = heirloomById(result.heirloom);
        fam = addHeirloom(fam, { id: result.heirloom, source: def.title, year: gameYear, month: gameMonth, keeper: '当家人' });
        if (h) addLifeLog('大事', `获得传家宝：${h.name}`, h.desc);
      }
    }
    if (resolved.length > 0) {
      setSimEvents((prev) => prev.filter((e) => !resolved.includes(e.uid)));
      setSimScore((n) => n + score);
    }
    let inv = giftInventory;
    let given = 0;
    const members = buildFamilyMembers(fam, { playerName, playerGender: gender, playerAge: currentAge, playerOccupation, gameYear, gameMonth });
    const close = (m: FamilyMemberView) => m.kin === 'parent' || m.id === SPOUSE_MEMBER_ID;
    const targets = members
      .filter((m) => !m.isPlayer && m.status !== '已故')
      .sort((a, b) => Number(close(b)) - Number(close(a)) || a.affinity - b.affinity);
    for (const m of targets) {
      if (canInteract(fam, m, gameYear, gameMonth)) continue;
      const best = Object.keys(inv)
        .map((id) => giftById(id))
        .filter((g): g is NonNullable<typeof g> => !!g)
        .sort((a, b) => giftAffinityGain(b, m, fam.giftTastes) - giftAffinityGain(a, m, fam.giftTastes))[0];
      if (best) {
        inv = removeGift(inv, best.id) ?? inv;
        fam = applyInteraction(fam, m, 'gift', gameYear, gameMonth, affinityBonus(playerTraits), giftAffinityGain(best, m, fam.giftTastes));
        out.push(`🎁 送给${m.relation}「${best.name}」`);
      } else if (cash >= GIFT_COST + 2000) {
        cash -= GIFT_COST;
        fam = applyInteraction(fam, m, 'gift', gameYear, gameMonth, affinityBonus(playerTraits));
        out.push(`🎁 给${m.relation}买了礼物（-${GIFT_COST} ${CURRENCY.symbol}）`);
      } else continue;
      given++;
    }
    if (given > 0) {
      setGiftInventory(inv);
      recordGiftsGiven(given);
    }

    // 自动保养：自己、配偶、16 岁以上的子女与孙辈，每人每月一次，概率低于手动保养；至少保留一笔现金
    const monthKey = gameYear * 12 + gameMonth;
    const maintained: Record<string, number> = {};
    let maintainCount = 0;
    const canMaintain = (key: string, traits: string[]) =>
      (maintenanceLog[key] ?? 0) !== monthKey && FERTILITY_TRAITS.some((id) => !traits.includes(id)) && cash >= MAINTENANCE_COST + SIMPLE_MAINTENANCE_RESERVE;
    const doMaintain = (key: string, traits: string[], who: string): string[] => {
      cash -= MAINTENANCE_COST;
      maintained[key] = monthKey;
      maintainCount++;
      const r = rollMaintenance(traits, Math.random, SIMPLE_MAINTENANCE_CHANCE);
      if (r.gained) {
        const name = traitById(r.gained)?.name ?? r.gained;
        out.push(`✨ ${who}保养后获得了「${name}」`);
        addLifeLog('健康', `${who}保养获得「${name}」`, '简洁模式自动保养。');
      }
      return r.traits;
    };
    if (canMaintain('self', playerTraits)) {
      const t = doMaintain('self', playerTraits, '你');
      if (t !== playerTraits) setPlayerTraits(t);
    }
    if (fam.spouse && canMaintain('spouse', fam.spouse.traits ?? [])) {
      const t = doMaintain('spouse', fam.spouse.traits ?? [], fam.spouse.name);
      fam = { ...fam, spouse: { ...fam.spouse, traits: t } };
    }
    const aliveAdult = (c: Parameters<typeof childLifespan>[0]) => {
      const age = ageAt(c.birthYear, c.birthMonth, gameYear, gameMonth);
      return age >= 16 && age < childLifespan(c);
    };
    fam = {
      ...fam,
      children: fam.children.map((c) => {
        let child = c;
        if (aliveAdult(c) && canMaintain(c.id, c.traits ?? [])) child = { ...child, traits: doMaintain(c.id, c.traits ?? [], c.name) };
        const kids = (child.kids ?? []).map((k) => (aliveAdult(k) && canMaintain(k.id, k.traits ?? []) ? { ...k, traits: doMaintain(k.id, k.traits ?? [], k.name) } : k));
        return kids.some((k, i) => k !== (child.kids ?? [])[i]) ? { ...child, kids } : child;
      }),
    };
    if (maintainCount > 0) {
      out.push(`💆 为 ${maintainCount} 位家人做了保养（-${(maintainCount * MAINTENANCE_COST).toLocaleString()} ${CURRENCY.symbol}）`);
      setMaintenanceLog((prev) => ({ ...prev, ...maintained }));
    }
    if (fam !== family) setFamily(fam);
    setCoins(cash);
    setHealth(hp);
    if (hp <= 0) addLifeLog('大事', '辞世', `${playerName} 离开了人世，享年 ${currentAge} 岁。`);
    return out;
  };

  /** 已到本赛季的最后一个月（第 58 题） */
  const atSeasonEnd = currentSeason().endGameYear !== undefined && gameYear >= currentSeason().endGameYear! && gameMonth === 12;
  const handleSimpleNextMonth = () => {
    if (!isRegistered) return;
    if (atSeasonEnd) {
      setSimpleRemaining(0);
      handleNextMonth();
      return;
    }
    const notes = simpleAutoHandle();
    setSimpleAutoNotes(notes);
    simpleMonthNotesRef.current = [];
    setSimpleAdvancePending(true);
  };

  const simpleSpouseCandidates = React.useMemo(
    () => generateSpouseCandidates(currentAge, Math.random, candidateCount(3, hasActiveRecord(gameYear, gameMonth)), gender === '男' || gender === '女' ? (gender as Gender) : null),
    [gameYear, family.spouse?.name, gender],
  );

  const simpleCard = ((): SimpleCard | null => {
    if (!isRegistered) return null;
    const snoozed = (k: string) => (simpleSnooze[k] ?? 0) > simpleMonthIndex;
    if (health <= 0) {
      const heirs = listHeirs(buildFamilyMembers(family, { playerName, playerGender: gender, playerAge: currentAge, playerOccupation, gameYear, gameMonth }));
      return {
        kind: 'heir',
        emoji: '🕯️',
        question: `${playerName} 离开了我们`,
        hint: heirs.length > 0 ? '选一位家人继续这个家族的故事' : '家里没有可以继承的人了',
        choices: [
          ...heirs.map((h) => ({ id: h.id, title: `由 ${h.name} 继承`, detail: `${h.relation} · ${h.age} 岁` })),
          { id: 'restart', title: '重新出生', detail: '从头开始新的人生' },
        ],
      };
    }
    // 狱中不弹出求职、结婚、买房等人生节点（第 67.7 题）
    if (isInPrison()) return null;
    const hasJob = !!readCurrentJobId();
    const childJob = readChildJob();
    if (currentAge >= 16 && !hasJob && !childJob && !snoozed('job')) {
      return {
        kind: 'job',
        emoji: '💼',
        question: '要去工作吗？',
        hint: '有工作才能领俸禄，还能拿到月薪',
        laterLabel: '以后再说',
        // 需要执照的职业只推荐给已持照的人（第 67.4 题）
        choices: recommendJobs(JOB_POSITIONS.filter((j) => meetsLicense(j, loadLicenses()) && !barredByRecord(j, hasActiveRecord(gameYear, gameMonth))), familyClass.id, seededRng(`simple_jobs_${gameYear}_${gameMonth}`)).map((j) => ({ id: j.id, title: j.title, detail: `${j.department} · 每月约 ${(j.dailySalary * 22).toLocaleString()} ${CURRENCY.symbol}` })),
      };
    }
    if (currentAge >= 8 && currentAge <= CHILD_LABOR_MAX_AGE && familyClass.childLabor && !childJob && !snoozed('child')) {
      return {
        kind: 'job',
        emoji: '🧹',
        question: '家里穷，要去打零工吗？',
        hint: '每月有工钱，但会累坏身体',
        laterLabel: '先不去',
        choices: [...CHILD_JOBS].sort((a, b) => a.healthCost - b.healthCost || b.salary - a.salary).slice(0, 3).map((j) => ({ id: `child:${j.id}`, title: j.title, detail: `每月 ${j.salary} ${CURRENCY.symbol} · 健康 -${j.healthCost}` })),
      };
    }
    if (currentAge >= MARRIAGE_MIN_AGE && currentAge < 45 && !family.spouse && !snoozed('marriage')) {
      return {
        kind: 'marriage',
        emoji: '💍',
        question: '想结婚吗？',
        hint: `结婚要交 ${MARRIAGE_FEE.toLocaleString()} ${CURRENCY.symbol} 登记费`,
        laterLabel: '以后再说',
        choices: simpleSpouseCandidates.map((c, i) => ({ id: String(i), title: c.name, detail: `${c.age} 岁 · ${c.occupation}${c.traits?.length ? ` · ${traitNames(c.traits).join('、')}` : ''}` })),
      };
    }
    const owned = (() => {
      try {
        const v = JSON.parse(localStorage.getItem('amigo_owned_properties') || '[]');
        return Array.isArray(v) ? v.length : 0;
      } catch {
        return 0;
      }
    })();
    const cheapest = Math.min(...HOUSING_MARKET_PROPERTIES.map((h) => h.price));
    if (shouldSuggestHome(currentAge, owned > 0, coins, cheapest) && !snoozed('home')) {
      const home = recommendHome(HOUSING_MARKET_PROPERTIES, coins);
      if (home) {
        return {
          kind: 'home',
          emoji: '🏠',
          question: '买一套自己的房子吗？',
          hint: '住得舒服，每个月都能恢复健康',
          laterLabel: '以后再说',
          choices: [{ id: home.id, title: home.title, detail: `${home.price.toLocaleString()} ${CURRENCY.symbol} · 每月健康 +${home.comfortBonus}` }],
        };
      }
    }
    return null;
  })();

  const handleSimpleChoose = (card: SimpleCard, choiceId: string) => {
    if (card.kind === 'heir') {
      if (choiceId === 'restart') handleResetLife();
      else handleSuccession(choiceId, true);
      return;
    }
    if (card.kind === 'job') {
      if (choiceId.startsWith('child:')) {
        const j = CHILD_JOBS.find((x) => `child:${x.id}` === choiceId);
        if (!j) return;
        try {
          localStorage.setItem(CHILD_JOB_KEY, j.id);
        } catch (e) {}
        addLifeLog('事业', `开始做童工「${j.title}」`, j.desc);
        showToast(`🧹 开始做「${j.title}」，每月 ${j.salary} ${CURRENCY.symbol}`);
        setSimpleSnooze((s) => ({ ...s }));
        return;
      }
      const job = JOB_POSITIONS.find((x) => x.id === choiceId);
      if (!job) return;
      try {
        localStorage.setItem(CURRENT_JOB_KEY, job.id);
        const history = readJobHistoryIds();
        if (!history.includes(job.id)) localStorage.setItem(JOB_HISTORY_KEY, JSON.stringify([job.id, ...history]));
      } catch (e) {}
      addLifeLog('事业', `入职「${job.title}」`, `进入${job.department}任职，日薪 ${job.dailySalary} ${CURRENCY.symbol}。`);
      showToast(`💼 开始在「${job.department}」做${job.title}`);
      setSimpleSnooze((s) => ({ ...s }));
      return;
    }
    if (card.kind === 'marriage') {
      const c = simpleSpouseCandidates[Number(choiceId)];
      if (!c) return;
      if (coins < MARRIAGE_FEE) {
        showToast(`钱不够，结婚登记要 ${MARRIAGE_FEE.toLocaleString()} ${CURRENCY.symbol}`);
        return;
      }
      setCoins((prev) => prev - MARRIAGE_FEE);
      setFamily((prev) => marry(prev, c, gameYear, gameMonth));
      changeReputation(REP.marriage);
      addLifeLog('大事', `与 ${c.name} 结婚`, `${c.gender} · ${c.age} 岁 · ${c.occupation}，在帝国民政署登记结婚。`);
      showToast(`💍 你和 ${c.name} 结婚啦！`);
      return;
    }
    if (card.kind === 'home') {
      const home = HOUSING_MARKET_PROPERTIES.find((h) => h.id === choiceId);
      if (!home || coins < home.price) return;
      try {
        const props = JSON.parse(localStorage.getItem('amigo_owned_properties') || '[]');
        const list = Array.isArray(props) ? props : [];
        const item = {
          id: `owned_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          propertyId: home.id,
          title: home.title,
          district: home.district,
          category: home.category,
          purchasePrice: home.price,
          currentValue: home.price,
          rentPerMonth: home.rentPerMonth,
          renovationTier: home.renovationTier,
          isRentedOut: false,
          isPrimaryResidence: list.length === 0,
          purchaseYear: gameYear,
          purchaseMonth: gameMonth,
          totalRentCollected: 0,
        };
        localStorage.setItem('amigo_owned_properties', JSON.stringify([item, ...list]));
        if (list.length === 0) localStorage.removeItem('amigo_current_rental');
      } catch (e) {}
      setCoins((prev) => prev - home.price);
      addLifeLog('财富', `购入房产「${home.title}」`, `位于${home.district}，花费 ${home.price.toLocaleString()} ${CURRENCY.symbol}。`);
      unlockAchievement('home');
      showToast(`🏠 买下了「${home.title}」`);
    }
  };

  // 简洁模式连续推进（过半年、一年、十年）：遇到需要选择的卡片或角色去世时停下
  const [simpleRemaining, setSimpleRemaining] = useState(0);
  React.useEffect(() => {
    if (simpleRemaining <= 0 || simpleAdvancePending) return;
    if (!isRegistered || health <= 0 || simpleCard || atSeasonEnd) {
      setSimpleRemaining(0);
      return;
    }
    const timer = setTimeout(() => {
      handleSimpleNextMonth();
      setSimpleRemaining((n) => Math.max(0, n - 1));
    }, 0);
    return () => clearTimeout(timer);
  }, [simpleRemaining, simpleAdvancePending, gameYear, gameMonth, health]);

  // 开发测试工具：快进的「智能安排」。每一步要么替玩家做一个选择，要么推进一个月（避免同一步内状态互相覆盖）
  const [smartTick, setSmartTick] = useState(0);
  React.useEffect(() => {
    if (!smartFastForward || fastForwardRemaining <= 0 || simpleAdvancePending) return;
    if (!isRegistered || health <= 0) {
      setFastForwardRemaining(0);
      return;
    }
    const timer = setTimeout(() => {
      const card = simpleCard;
      if (card && card.kind !== 'heir') {
        let choice: string | undefined = card.choices[0]?.id;
        if (card.kind === 'marriage') {
          const idx = simpleSpouseCandidates.findIndex((c) => !(c.traits ?? []).includes('infertile'));
          choice = idx >= 0 ? String(idx) : undefined;
        }
        if (choice !== undefined && !(card.kind === 'marriage' && coins < MARRIAGE_FEE)) handleSimpleChoose(card, choice);
        else handleSimpleLater(card);
        setSmartTick((t) => t + 1);
        return;
      }
      handleSimpleNextMonth();
      setFastForwardRemaining((n) => Math.max(0, n - 1));
    }, 0);
    return () => clearTimeout(timer);
  }, [smartFastForward, fastForwardRemaining, simpleAdvancePending, smartTick, gameYear, gameMonth, health]);

  /** 保养（第 50 题）：有概率获得「精力旺盛」或「富养」，延长生育年龄 */
  const handleMaintenance = (target: 'self' | 'spouse'): string => {
    if (!isRegistered) return '请先完成出生登记';
    const spouse = family.spouse;
    if (target === 'spouse' && !spouse) return '还没有配偶';
    const current = target === 'self' ? playerTraits : spouse?.traits ?? [];
    if (FERTILITY_TRAITS.every((id) => current.includes(id))) return '已经同时拥有「精力旺盛」和「富养」，不需要再保养';
    if ((maintenanceLog[target] ?? 0) === gameYear * 12 + gameMonth) return `${target === 'self' ? '你' : spouse!.name}这个月已经保养过了，下个月再来吧`;
    if (coins < MAINTENANCE_COST) return `钱不够，保养一次要 ${MAINTENANCE_COST.toLocaleString()} ${CURRENCY.symbol}`;
    setCoins((prev) => prev - MAINTENANCE_COST);
    setMaintenanceLog((prev) => ({ ...prev, [target]: gameYear * 12 + gameMonth }));
    const who = target === 'self' ? '你' : spouse!.name;
    const r = rollMaintenance(current);
    if (!r.gained) {
      addLifeLog('健康', '保养调理', `为${who}做了一次保养，这次没有明显效果。`);
      return `💆 为${who}做了保养（-${MAINTENANCE_COST.toLocaleString()} ${CURRENCY.symbol}），这次没有明显效果`;
    }
    if (target === 'self') setPlayerTraits(r.traits);
    else setFamily((prev) => (prev.spouse ? { ...prev, spouse: { ...prev.spouse, traits: r.traits } } : prev));
    const name = traitById(r.gained)?.name ?? r.gained;
    addLifeLog('健康', `保养获得「${name}」`, `${who}通过保养获得了「${name}」，生育年龄上限延长。`);
    return `✨ ${who}获得了「${name}」！生育年龄上限延长`;
  };
  const fertilityText = isRegistered
    ? `你可以生孩子到 ${fertileMaxAge(gender, playerTraits)} 岁${family.spouse ? `，${family.spouse.name} 到 ${fertileMaxAge(family.spouse.gender, family.spouse.traits)} 岁` : ''}。保养有机会获得「精力旺盛」或「富养」，让这个年龄变大。`
    : '';

  const handleSimpleLater = (card: SimpleCard) => {
    const key = card.kind === 'job' && card.emoji === '🧹' ? 'child' : card.kind;
    setSimpleSnooze((s) => ({ ...s, [key]: simpleMonthIndex + 12 }));
  };

  const stockOpenedNow = localStorage.getItem(STOCK_KEYS.accountOpened) === 'true';
  const simpleStock = (() => {
    const market = loadMarket();
    const holdings = loadStored<StockHolding[]>(STOCK_KEYS.holdings, []);
    const value = holdings.reduce((sum, h) => sum + Math.round(h.shares * (market.stocks.find((x) => x.id === h.stockId)?.price ?? 0)), 0);
    return { market, holdings, value };
  })();
  const saveTrade = (holdings: StockHolding[], logs: StockTradeLog[]) => {
    try {
      localStorage.setItem(STOCK_KEYS.holdings, JSON.stringify(holdings));
      const prev = JSON.parse(localStorage.getItem(STOCK_KEYS.tradeLogs) || '[]');
      localStorage.setItem(STOCK_KEYS.tradeLogs, JSON.stringify([...logs, ...(Array.isArray(prev) ? prev : [])]));
    } catch (e) {}
  };
  const handleSimpleBuyStocks = () => {
    const r = buyRecommended(simpleStock.market.stocks, simpleStock.holdings, Math.floor(coins * 0.3), simpleStock.market.tradingDay);
    if (r.cashDelta === 0) {
      showToast('钱太少，一股也买不起');
      return;
    }
    saveTrade(r.holdings, r.logs);
    setCoins((prev) => prev + r.cashDelta);
    addLifeLog('财富', '一键买入股票', `${r.summary.join('、')}，共 ${(-r.cashDelta).toLocaleString()} ${CURRENCY.symbol}。`);
    showToast(`📈 买入 ${r.summary.join('、')}`);
  };
  const handleSimpleSellStocks = () => {
    const r = sellAll(simpleStock.market.stocks, simpleStock.holdings, simpleStock.market.tradingDay);
    if (r.cashDelta === 0) return;
    saveTrade(r.holdings, r.logs);
    setCoins((prev) => prev + r.cashDelta);
    addLifeLog('财富', '一键卖出全部股票', `收回 ${r.cashDelta.toLocaleString()} ${CURRENCY.symbol}，${r.profit >= 0 ? '赚了' : '亏了'} ${Math.abs(r.profit).toLocaleString()} ${CURRENCY.symbol}。`);
    showToast(`📉 全部卖出，${r.profit >= 0 ? '赚了' : '亏了'} ${Math.abs(r.profit).toLocaleString()} ${CURRENCY.symbol}`);
  };

  return {
    usedSimpleMode,
    setUsedSimpleMode,
    setMaintenanceLog,
    simpleAutoNotes,
    simpleMonthNotes,
    handleSimpleNextMonth,
    simpleCard,
    handleSimpleChoose,
    simpleRemaining,
    setSimpleRemaining,
    handleMaintenance,
    fertilityText,
    handleSimpleLater,
    stockOpenedNow,
    simpleStock,
    handleSimpleBuyStocks,
    handleSimpleSellStocks,
  };
};
