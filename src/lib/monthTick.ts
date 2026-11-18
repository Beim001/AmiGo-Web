// 每月结算（纯函数）：输入本月开始时的状态快照，返回下个月的新状态与需要执行的副作用清单。
// 不读写 localStorage、不调用 React setter：App 负责采集输入（含从存档读出的房产、租住、岗位、股市等）并执行结果。
// 所有随机数都来自参数 rng，且调用顺序固定，测试时传入固定序列即可复现。
//
// 结算顺序：房租与租住 → 月薪与童工 → 俸禄或零花 → 银行利息 → 股市 → 疾病与健康（含寿终）
// → 家族（生育、情人、家人生老病死、好感衰减、逼宫、礼物喜好、分家、监护）→ 声望 → 阶层升降 → 推演事件 → 拍卖会 → 人生日志

import { classById, checkPromotion, checkDemotion, CHILD_LABOR_MAX_AGE, ChildJob } from './lineage';
import { BASE_STIPEND, monthlySalary, nextHealth, effectiveComfort } from './monthly';
import { familyAllowance } from './allowance';
import { BankAccounts, settleMonthlyInterest, currentRateEvent, RateEvent, totalsOf } from './bank';
import { advanceMarket, MarketState, TRADING_DAYS_PER_MONTH } from './stockMarket';
import { ActiveDisease, progressDisease, diseaseInfo, diseaseById, immunityAfterRecovery } from './disease';
import {
  FamilyState,
  tryHaveChild,
  tryIllegitimateChild,
  monthlyFamilyLife,
  buildFamilyMembers,
  monthlyFamilyDrift,
  checkCoup,
  getOrigin,
  getHeirlooms,
  promoteFamily,
  demoteFamily,
  INTIMACY_MULTIPLIER,
  LOVER_UPKEEP,
  SPLIT_CASH_SHARE,
} from './family';
import { salaryMultiplier, depositInterestMultiplier, diseaseTraitMultiplier, decayReduction } from './traits';
import { REP, HIGH_SALARY, clampReputation } from './reputation';
import { driftGiftTastes, GIFT_TASTE_LABEL, CHILD_AGE as GIFT_CHILD_AGE } from './gifts';
import { Guardianship, monthlyGuardianship, ORPHANAGE_NAME } from './guardianship';
import { familyNetWorth } from './familyRank';
import { monthlyKinJobs, kinIncomeTotal } from './kinJobs';
import { Auction, AUCTION_CHANCE, generateAuction, isInvited, heirloomsValue } from './heirlooms';
import { SimEventInstance, rollMonthlyEvent } from './simEvents';
import { LogCategory } from './lifeLog';
import type { Appearance } from './appearance';
import { CURRENCY } from '../data/seasons';
import { settleUpkeep, livesIn, REPOSSESS_AFTER_MONTHS } from './homeUpkeep';

/** 名下房产（只用到结算相关字段，其余字段原样保留） */
export interface OwnedProperty {
  isRentedOut?: boolean;
  rentPerMonth?: number;
  totalRentCollected?: number;
  isPrimaryResidence?: boolean;
  comfortBonus?: number;
  currentValue?: number;
  purchasePrice?: number;
  upkeepArrears?: number;
  upkeepArrearsMonths?: number;
  [key: string]: unknown;
}

export interface MonthInput {
  /** 推进前的游戏年月 */
  year: number;
  month: number;
  /** 推进后的游戏年月（由调用方算好，并已检查过赛季截止年份） */
  nextYear: number;
  nextMonth: number;
  isRegistered: boolean;
  birthRegisteredYear: number;
  /** 推进前的年龄（家人视图、零花按当前年龄计算） */
  currentAge: number;
  playerName: string;
  gender: string | null;
  playerOccupation: string;
  playerTraits: string[];
  appearance: Appearance | null;
  /** 测试兑换码：健康保持 100、不会寿终 */
  godMode: boolean;
  playerLifespan: number | null;
  coins: number;
  health: number;
  reputation: number;
  family: FamilyState;
  disease: ActiveDisease | null;
  antibodies: string[];
  guardianship: Guardianship | null;
  /** 当前是否有拍卖会（有且本月不开新的则结束） */
  hasAuction: boolean;
  /** 还没处理的推演事件 */
  pendingSimEventIds: string[];
  /** 各推演事件最近一次出现的时间（冷却用） */
  simRecent: Record<string, number>;
  bankAccounts: BankAccounts;
  market: MarketState;
  properties: OwnedProperty[] | null;
  rental: { monthlyRent?: number; comfortBonus?: number } | null;
  job: { dailySalary?: number | null } | null;
  childJob: ChildJob | null;
}

/** 人生日志条目；when 缺省时按存档中的当前游戏年月记录 */
export type LogEntry = [category: LogCategory, title: string, desc: string, when?: { year: number; month: number; age?: number }];

export interface MonthResult {
  ageNextMonth: number;
  /** 本月提示（拼接进提示条） */
  notes: string[];
  /** 依次执行：先 Math.max(0, coins + netChange)，再 Math.max(0, … + familyCash)，两次各自截断为 0 */
  netChange: number;
  familyCash: number;
  repDelta: number;
  health: number;
  disease: ActiveDisease | null;
  /** 本月痊愈并获得的抗体 */
  newAntibody: string | null;
  /** 家族状态没有变化时与输入为同一对象 */
  family: FamilyState;
  /** undefined 表示不更新监护状态 */
  guardianship: Guardianship | null | undefined;
  pendingCoup: string | null;
  /** 有房租入账、欠费变化或房产被收回时需要写回的房产列表 */
  properties: OwnedProperty[] | null;
  /** 童工因年满 16 岁或阶层不再允许而结束 */
  childJobEnded: boolean;
  /** 月薪与童工收入合计（大于 0 时累计打工统计） */
  salary: number;
  bankAccounts: BankAccounts;
  market: MarketState;
  /** 新出现的推演事件；没有时给出「本月无事发生」文案（未登记时两者都为 null） */
  simEvent: SimEventInstance | null;
  simQuiet: string | null;
  /** open：开办（generateAuction 也可能返回 null）；close：上个月的拍卖会结束；none：不变 */
  auction: { action: 'open'; next: Auction | null; invited: boolean } | { action: 'close' } | { action: 'none' };
  /** 本月刚进入的历史大事件（利率上浮） */
  enteredEvent: RateEvent | null;
  died: boolean;
  logs: LogEntry[];
  achievements: string[];
}

export const advanceMonth = (input: MonthInput, rng: () => number = Math.random): MonthResult => {
  const {
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
  } = input;
  const familyClass = classById(getOrigin(family).classId);
  const logs: LogEntry[] = [];
  const achievements: string[] = [];
  const addLifeLog = (...entry: LogEntry) => logs.push(entry);

  const ageNextMonth = isRegistered ? Math.max(0, 8 + nextY - birthRegisteredYear) : 8;
  const notes: string[] = [];

  // 1. 名下出租房产租金收益、自住舒适度与居家开销（第 76 题）
  let propertyRentIncome = 0;
  let comfortBonusTotal = 0;
  let primaryComfort = 0;
  let props: OwnedProperty[] | null = null;
  let propsUpdated = false;
  if (input.properties) {
    props = input.properties.map((p) => ({ ...p }));
    props.forEach((p) => {
      if (p.isRentedOut && (p.rentPerMonth ?? 0) > 0) {
        propertyRentIncome += p.rentPerMonth!;
        p.totalRentCollected = (p.totalRentCollected || 0) + p.rentPerMonth!;
        propsUpdated = true;
      }
      if (livesIn(p)) primaryComfort += p.comfortBonus || 5;
    });
    comfortBonusTotal += primaryComfort;
  }

  // 2. 租住支出
  let rentExpense = 0;
  if (input.rental && input.rental.monthlyRent) {
    rentExpense = input.rental.monthlyRent;
    comfortBonusTotal += input.rental.comfortBonus || 2;
  }
  if (propertyRentIncome > 0) notes.push(`房租 +${propertyRentIncome.toLocaleString()}`);
  if (rentExpense > 0) notes.push(`租金 -${rentExpense.toLocaleString()}`);

  // 3. 在职月薪（第 2、3 题：日薪 × 22，年满 16 岁才发）；「勤勉」特质月薪 +10%
  const job = input.job;
  let salary = isRegistered ? Math.round(monthlySalary(job?.dailySalary, ageNextMonth) * salaryMultiplier(playerTraits)) : 0;

  // 3b. 童工（第 19 题：乞丐、平民家庭 8–15 岁）；年满 16 岁自动结束
  let childLaborDamage = 0;
  let childJobEnded = false;
  const childJob = isRegistered ? input.childJob : null;
  if (childJob) {
    if (ageNextMonth > CHILD_LABOR_MAX_AGE || !familyClass.childLabor) {
      childJobEnded = true;
      notes.push(`童工「${childJob.title}」结束，可正式求职`);
      addLifeLog('事业', `结束童工生涯`, `不再做「${childJob.title}」，可以正式求职了。`, { year: nextY, month: nextM, age: ageNextMonth });
    } else {
      salary += childJob.salary;
      childLaborDamage = childJob.healthCost;
      notes.push(`童工 +${childJob.salary.toLocaleString()}`);
    }
  }
  if (salary > 0) notes.push(`月薪 +${salary.toLocaleString()}`);

  // 3c. 俸禄与零花（第 36 题）：在职（正式工作或童工）的月份发俸禄，否则由父母按收入、年龄与好感度给零花
  let baseIncome = 0;
  if (isRegistered && salary > 0) {
    baseIncome = BASE_STIPEND;
    notes.unshift(`俸禄 +${BASE_STIPEND.toLocaleString()}`);
  } else if (isRegistered) {
    const allowance = familyAllowance(family, { playerName, playerGender: gender, playerAge: currentAge, playerOccupation, gameYear, gameMonth }, ageNextMonth, familyClass.id);
    baseIncome = allowance.total;
    notes.unshift(allowance.total > 0 ? `零花 +${allowance.total.toLocaleString()}` : '没有零花（父母已故或好感度不足 30%）');
  }

  // 3d. 居家开销（第 76 题）：付不起的部分记为欠费，拖欠超过半年收回房产；自住房没付上时没有取暖照明，舒适度加成作废
  let upkeepPaid = 0;
  if (props) {
    const upkeep = settleUpkeep(props, coins + baseIncome + propertyRentIncome - rentExpense + salary, nextY);
    upkeepPaid = upkeep.paid;
    props = upkeep.properties;
    if (upkeep.changed) propsUpdated = true;
    if (upkeep.paid > 0) notes.push(`居家开销 -${upkeep.paid.toLocaleString()}`);
    if (upkeep.newArrears > 0) notes.push(`⚠️ 欠下居家开销 ${upkeep.newArrears.toLocaleString()}（累计 ${upkeep.totalArrears.toLocaleString()}）`);
    if (upkeep.homeUnpaid) {
      comfortBonusTotal -= primaryComfort;
      notes.push('⚠️ 交不起居家开销，住处没有取暖照明');
    }
    upkeep.repossessed.forEach((p) => {
      const title = typeof p.title === 'string' ? p.title : '房产';
      notes.push(`⚠️ 「${title}」欠费超过 ${REPOSSESS_AFTER_MONTHS} 个月，已被收回`);
      addLifeLog('财富', `房产「${title}」被收回`, `拖欠居家开销超过 ${REPOSSESS_AFTER_MONTHS} 个月（共 ${(p.upkeepArrears || 0).toLocaleString()} ${CURRENCY.symbol}），房产被收回抵债。`, { year: nextY, month: nextM, age: ageNextMonth });
    });
  }
  const properties = propsUpdated ? props : null;

  // 4. 银行存贷款利息（第 5 题：贷款利率随历史大事件上浮）
  const cashBeforeInterest = Math.max(0, coins + baseIncome + propertyRentIncome - rentExpense + salary - upkeepPaid);
  const interest = settleMonthlyInterest(input.bankAccounts, cashBeforeInterest, nextY, nextM, rng, depositInterestMultiplier(playerTraits));
  if (interest.depositInterest > 0) notes.push(`存款利息 +${interest.depositInterest.toLocaleString()}`);
  if (interest.loanInterest > 0) notes.push(`贷款利息 -${interest.loanInterest.toLocaleString()}`);
  if (interest.capitalized > 0) notes.push(`⚠️ ${interest.capitalized.toLocaleString()} ${CURRENCY.symbol} 利息计入本金`);
  const bankTotals = totalsOf(interest.accounts);

  const netChange = baseIncome + propertyRentIncome - rentExpense + salary - upkeepPaid - interest.cashPaid;

  // 5. 股市推进（第 4 题：每月 20 个交易日）
  const market = advanceMarket(input.market, TRADING_DAYS_PER_MONTH, rng);

  // 6. 健康：住房舒适度恢复 − 年龄自然衰减（第 1 题：A）
  //    未满 18 岁没有自己的住处时住在父母家；老年住房加成打折
  //    父母家的条件由家族阶层决定（乞丐家庭没有家）；疾病与童工额外损耗健康
  const comfort = isRegistered ? effectiveComfort(comfortBonusTotal, ageNextMonth, familyClass.parentHomeComfort) : comfortBonusTotal;
  let diseaseDamage = 0;
  let nextDisease = disease;
  let newAntibody: string | null = null;
  if (isRegistered) {
    const currentDisease = diseaseInfo(disease);
    const sick = progressDisease(disease, ageNextMonth, familyClass.diseaseMultiplier * diseaseTraitMultiplier(playerTraits), rng, antibodies);
    nextDisease = sick.active;
    diseaseDamage = sick.damage;
    const when = { year: nextY, month: nextM, age: ageNextMonth };
    if (sick.contracted) {
      notes.push(`🤒 患上${sick.contracted.name}`);
      addLifeLog('健康', `患上${sick.contracted.name}`, sick.contracted.selfHealMonths === null ? '这种病不会自愈，须尽快就医。' : `约 ${sick.contracted.selfHealMonths} 个月可自愈。`, when);
    }
    if (sick.recovered) {
      notes.push(`${sick.recovered.name}已痊愈`);
      addLifeLog('健康', `${sick.recovered.name}痊愈`, '熬过病痛，身体逐渐康复。', when);
      // 传染病痊愈后按概率获得抗体
      if (!antibodies.includes(sick.recovered.id) && immunityAfterRecovery(sick.recovered.id, rng)) {
        newAntibody = sick.recovered.id;
        addLifeLog('健康', `获得${diseaseById(sick.recovered.id)?.name ?? sick.recovered.id}抗体`, '痊愈后身体产生了抗体，不会再患这种病。');
        notes.push(`🛡️ 获得${sick.recovered.name}抗体`);
      }
    } else if (sick.damage > 0 && currentDisease) notes.push(`${currentDisease.name} -${sick.damage}`);
  }
  // 第 51 题：到达寿命即寿终正寝，医疗只能延缓衰减
  const reachedLifespan = !godMode && isRegistered && playerLifespan !== null && ageNextMonth >= playerLifespan;
  if (reachedLifespan) notes.push('🕯️ 寿终正寝');
  const newHealth =
    godMode && isRegistered
      ? 100
      : reachedLifespan
        ? 0
        : isRegistered
          ? nextHealth(health, comfort, ageNextMonth, diseaseDamage + childLaborDamage - decayReduction(playerTraits, ageNextMonth))
          : Math.min(100, health + comfort);
  if (isRegistered) {
    const delta = newHealth - health;
    if (delta !== 0) notes.push(`健康 ${delta > 0 ? '+' : ''}${delta}`);
  }

  // 7. 家族：生育（含特质）、情人、好感衰减与分家、监护托管
  const logWhenFamily = { year: nextY, month: nextM, age: ageNextMonth };
  let fam = family;
  // 本月家族相关的现金变动
  let familyCash = 0;
  let repDelta = 0;
  let nextGuardianship: Guardianship | null | undefined = undefined;
  let pendingCoup: string | null = null;
  if (isRegistered && newHealth > 0) {
    // 第 60 题：本月同房时生育概率提高
    const birth = tryHaveChild(fam, ageNextMonth, nextY, nextM, rng, playerTraits, gender, antibodies, fam.intimacyMonth === gameYear * 12 + gameMonth ? INTIMACY_MULTIPLIER : 1, appearance ?? undefined);
    if (birth.child) {
      fam = birth.state;
      repDelta += REP.child * birth.children.length;
      notes.push(
        birth.children.length === 2
          ? `👶👶 双胞胎 ${birth.children.map((c) => c.name).join('、')} 降生（可在家族页取名）`
          : `👶 ${birth.child.name} 降生（可在家族页取名）`,
      );
      addLifeLog(
        '大事',
        birth.children.length === 2 ? '喜得双胞胎' : `喜得${birth.child.gender === '女' ? '千金' : '麟儿'}`,
        `${birth.children.map((c) => c.name).join('、')} 降生。`,
        logWhenFamily,
      );
      if (birth.children.length === 2) achievements.push('twins');
    }

    // 贵族情人：每月供养；3% 概率生下私生子女
    if (fam.lover) {
      const upkeep = LOVER_UPKEEP[familyClass.id] ?? LOVER_UPKEEP.noble;
      if (coins + netChange < upkeep) {
        notes.push(`无力供养，与 ${fam.lover.name} 断绝往来`);
        fam = { ...fam, lover: null };
      } else {
        familyCash -= upkeep;
        notes.push(`供养情人 -${upkeep.toLocaleString()}`);
        const secret = tryIllegitimateChild(fam, ageNextMonth, nextY, nextM, rng, playerTraits, gender, antibodies, appearance ?? undefined);
        if (secret.child) {
          fam = secret.state;
          notes.push(`🤫 私生${secret.child.gender === '女' ? '女' : '子'} ${secret.child.name} 降生`);
          addLifeLog('大事', `私生${secret.child.gender === '女' ? '女' : '子'}降生`, `与 ${secret.child.otherParentName} 所生的 ${secret.child.name} 降生。`, logWhenFamily);
        }
      }
    }

    // 家人的生老病死与成家（第 52 题）：配偶寿终则丧偶；成年子女成家、生育孙辈
    const life = monthlyFamilyLife(fam, nextY, nextM, rng, playerTraits, gender);
    fam = life.state;
    life.notes.forEach((n) => {
      notes.push(`👪 ${n.title}`);
      addLifeLog('大事', n.title, n.desc, logWhenFamily);
    });

    // 好感度衰减与分家（按推进前的月份判断本月是否互动过）
    const membersNow = buildFamilyMembers(fam, { playerName, playerGender: gender, playerAge: currentAge, playerOccupation, gameYear, gameMonth });
    const drift = monthlyFamilyDrift(fam, membersNow, gameYear, gameMonth);
    fam = drift.state;

    // 逼宫（第 59 题）：富商、贵族家族中野心高且不满的成年子嗣
    const coup = checkCoup(fam, membersNow, getOrigin(fam).classId);
    fam = coup.state;
    coup.warnings.forEach((w) => notes.push(w));
    if (coup.coupBy) pendingCoup = coup.coupBy;

    // 礼物喜好：成年家人每月有小概率改变喜好（第 35 题）
    const tasteDrift = driftGiftTastes(
      fam.giftTastes ?? {},
      membersNow.filter((m) => !m.isPlayer && m.status !== '已故' && m.age >= GIFT_CHILD_AGE),
      rng,
    );
    if (tasteDrift.changed.length > 0) {
      fam = { ...fam, giftTastes: tasteDrift.tastes };
      tasteDrift.changed.forEach((c) => {
        const m = membersNow.find((x) => x.id === c.id);
        if (m) notes.push(`💝 ${m.relation} ${m.name} 的喜好从${GIFT_TASTE_LABEL[c.from]}变成了${GIFT_TASTE_LABEL[c.to]}`);
      });
    }
    drift.splits.forEach((b) => {
      const share = Math.round(Math.max(0, coins + netChange + familyCash) * SPLIT_CASH_SHARE);
      familyCash -= share;
      notes.push(`⚠️ ${b.relation} ${b.name} 分家，分走 ${share.toLocaleString()} ${CURRENCY.symbol}`);
      addLifeLog('大事', `${b.relation} ${b.name} 分家`, `长期对当家人不满，携一支族人分家出走，分走 ${share.toLocaleString()} ${CURRENCY.symbol}。`, logWhenFamily);
    });

    // 未成年继承的监护：成年返还托管资产，之后赡养监护人
    if (guardianship) {
      const guardianAlive =
        guardianship.guardianName === ORPHANAGE_NAME || membersNow.some((m) => m.name === guardianship.guardianName && m.status !== '已故');
      const step = monthlyGuardianship(guardianship, ageNextMonth, guardianAlive, coins + netChange + familyCash);
      nextGuardianship = step.guardianship;
      familyCash += step.returned - step.support;
      if (step.note) {
        notes.push(step.note);
        addLifeLog('财富', step.returned > 0 ? '领回托管资产' : '赡养义务结束', step.note, logWhenFamily);
      }
      if (step.support > 0) notes.push(`赡养${guardianship.guardianName} -${step.support.toLocaleString()}`);
    }

    // 声望：高薪岗位每年 +1
    if (nextM === 1 && salary >= HIGH_SALARY) repDelta += REP.highSalaryYearly;

    // 家人的工作（第 73 题）：换工作、失业、再就业、退休；历史大事件期间为失业潮
    const work = monthlyKinJobs(fam, buildFamilyMembers(fam, { playerName, playerGender: gender, playerAge: currentAge, playerOccupation, gameYear, gameMonth }), nextY, rng);
    fam = work.state;
    work.notes.forEach((n) => notes.push(`💼 ${n}`));
  }
  // 阶层提升（第 32 题）：家族资产净值与声望达到门槛时晋升一级；家人的收入计入家族财力
  if (isRegistered && newHealth > 0) {
    const netWorthNow = familyNetWorth(
      Math.max(0, coins + netChange + familyCash),
      bankTotals.deposit,
      bankTotals.loan,
      guardianship?.held ?? 0,
      heirloomsValue(getHeirlooms(fam)),
      kinIncomeTotal(buildFamilyMembers(fam, { playerName, playerGender: gender, playerAge: currentAge, playerOccupation, gameYear, gameMonth })),
    );
    const promo = checkPromotion(getOrigin(fam).classId, netWorthNow, clampReputation(reputation + repDelta));
    if (promo) {
      const toCls = classById(promo.to);
      fam = promoteFamily(fam, toCls.id, toCls.label, nextY, nextM, promo.reason);
      notes.push(`🎖️ 家族晋升为${toCls.label}`);
      addLifeLog('大事', `家族跻身${toCls.label}`, promo.reason, logWhenFamily);
    } else {
      // 阶层降级（第 46 题）：晋升上来的阶层，资产连续 12 个月低于门槛一半则降一级
      const dem = checkDemotion(getOrigin(fam).classId, netWorthNow, fam.demotionStreak ?? 0, fam.baseClassId);
      if (dem.demote) {
        const toCls = classById(dem.demote.to);
        fam = demoteFamily(fam, toCls.id, toCls.label, nextY, nextM);
        notes.push(`📉 家道中落，家族跌回${toCls.label}`);
        addLifeLog('大事', `家道中落，跌回${toCls.label}`, '家族资产长期缩水。', logWhenFamily);
      } else if ((fam.demotionStreak ?? 0) !== dem.streak) {
        fam = { ...fam, demotionStreak: dem.streak };
      }
    }
  }
  if (salary > 0) achievements.push('first_salary');
  if (interest.event) achievements.push('witness');

  const mStr = nextM < 10 ? `0${nextM}` : `${nextM}`;
  const enteredEvent = interest.event && interest.event !== currentRateEvent(gameYear) ? interest.event : null;
  const logWhen = { year: nextY, month: nextM, age: ageNextMonth };

  // 8. 推演事件：每月 50% 概率出现一张（第 8 题 A）
  let simEvent: SimEventInstance | null = null;
  let simQuiet: string | null = null;
  if (isRegistered && newHealth > 0) {
    simEvent = rollMonthlyEvent(
      { age: ageNextMonth, classId: familyClass.id, employed: !!job, coins, hasChildren: fam.children.length > 0, ownedHeirlooms: getHeirlooms(fam).map((h) => h.id) },
      nextY,
      nextM,
      rng,
      input.simRecent,
      input.pendingSimEventIds,
    );
    if (simEvent) {
      notes.push('📰 新的人生事件');
    } else {
      simQuiet = `${nextY}.${mStr} 本月无事发生`;
      notes.push('本月无事发生');
    }
  }

  // 8b. 拍卖会：每月随机开办（第 33 题）；上个月的拍卖会到期结束
  let auction: MonthResult['auction'] = { action: 'none' };
  if (isRegistered && newHealth > 0 && rng() < AUCTION_CHANCE) {
    const invited = isInvited(getOrigin(fam).classId, reputation);
    const next = generateAuction(nextY, nextM, getHeirlooms(fam).map((h) => h.id), invited, rng);
    auction = { action: 'open', next, invited };
    if (next) notes.push(invited ? '📜 收到拍卖会邀请函' : '📜 北城拍卖会开幕（需购票入场）');
  } else if (input.hasAuction) {
    auction = { action: 'close' };
  }

  // 9. 人生日志：整十岁生日、健康告急、时局剧变、辞世
  if (isRegistered) {
    if (nextM === 1 && ageNextMonth > 0 && ageNextMonth % 10 === 0) addLifeLog('成长', `${ageNextMonth} 岁`, `迎来 ${ageNextMonth} 岁生日。`, logWhen);
    if (health >= 30 && newHealth > 0 && newHealth < 30) addLifeLog('健康', '健康告急', `健康跌至 ${newHealth}，需要尽快休养或就医。`, logWhen);
    if (enteredEvent) addLifeLog('大事', `时局：${enteredEvent.title}`, enteredEvent.desc, logWhen);
    if (newHealth <= 0) addLifeLog('大事', '辞世', `${playerName} 离开了人世，享年 ${ageNextMonth} 岁。`, logWhen);
  }

  return {
    ageNextMonth,
    notes,
    netChange,
    familyCash,
    repDelta,
    health: newHealth,
    disease: nextDisease,
    newAntibody,
    family: fam,
    guardianship: nextGuardianship,
    pendingCoup,
    properties,
    childJobEnded,
    salary,
    bankAccounts: interest.accounts,
    market,
    simEvent,
    simQuiet,
    auction,
    enteredEvent,
    died: isRegistered && newHealth <= 0,
    logs,
    achievements,
  };
};
