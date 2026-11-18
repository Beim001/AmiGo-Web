// 家人的工作（第 73 题，默认值）：成年家人按家族阶层从职业表中得到工作，每月可能换工作、失业、再就业，60 岁退休。
// 历史大事件期间（与银行利率上浮的事件相同）为失业潮：失业概率提高、再就业概率降低。
// 家人的收入只计入家族资产净值（阶层升降、家族排行），不进当家人的现金；父母的零花按父母当前的实际收入计算。

import { FamilyMemberView, FamilyState, KinJob, SPOUSE_MEMBER_ID, getOrigin, kinJobOf } from './family';
import { classById } from './lineage';
import { PARENT_INCOME, parentIncome } from './allowance';
import { currentRateEvent } from './bank';

export const KIN_WORK_AGE = 18;
export const KIN_RETIRE_AGE = 60;
export const KIN_JOB_CHANGE_CHANCE = 0.005;
export const KIN_LAYOFF_CHANCE = 0.003;
export const KIN_REHIRE_CHANCE = 0.08;
export const WAVE_LAYOFF_MULTIPLIER = 5;
export const WAVE_REHIRE_MULTIPLIER = 0.4;
/** 族谱里这些身份视为已退休（前任当家人传位后退居幕后） */
const RETIRED_OCCUPATIONS = ['退居幕后'];

/** 本年是否处于失业潮（历史大事件期间）；返回事件或 null */
export const unemploymentWave = (year: number) => currentRateEvent(year);

/** 配偶、父母与子女、孙辈的工作变动写入月度提示，其余家人只在族谱中体现 */
const noteworthy = (m: FamilyMemberView) => m.id === SPOUSE_MEMBER_ID || m.kin === 'parent' || (m.depth !== undefined && m.depth <= 2);

const pickJob = (classId: string, rng: () => number, except?: string): string => {
  const all = classById(classId).adultJobs;
  const pool = all.length > 1 && except ? all.filter((j) => j !== except) : all;
  return pool[Math.floor(rng() * pool.length)];
};
const employed = (name: string, title: string, classId: string): KinJob => ({ name, status: 'employed', title, income: parentIncome(title, classId) });

/**
 * 每月结算家人的工作。members 为本月的族谱（含年龄、在世状态）；
 * 没有工作记录的成年家人立即分配工作（原有正式职业的保留原职业），不产生提示。
 * 只保留在世成年家人的记录，离开族谱的人（分家、去世）的记录随之清除。
 */
export const monthlyKinJobs = (
  state: FamilyState,
  members: FamilyMemberView[],
  year: number,
  rng: () => number = Math.random,
): { state: FamilyState; notes: string[] } => {
  const classId = getOrigin(state).classId;
  const wave = unemploymentWave(year);
  const layoff = KIN_LAYOFF_CHANCE * (wave ? WAVE_LAYOFF_MULTIPLIER : 1);
  const rehire = KIN_REHIRE_CHANCE * (wave ? WAVE_REHIRE_MULTIPLIER : 1);
  const jobs: Record<string, KinJob> = {};
  const notes: string[] = [];

  for (const m of members) {
    if (m.isPlayer || m.status === '已故' || m.age < KIN_WORK_AGE) continue;
    const prev = kinJobOf(state, m.id, m.name);
    const who = `${m.relation} ${m.name}`;
    let next: KinJob;
    let note: string | null = null;
    if (!prev) {
      const title = PARENT_INCOME[m.occupation] !== undefined ? m.occupation : pickJob(classId, rng);
      const job = employed(m.name, title, classId);
      next = m.age >= KIN_RETIRE_AGE || RETIRED_OCCUPATIONS.includes(m.occupation) ? { ...job, status: 'retired' } : job;
    } else if (prev.status === 'retired') {
      next = prev;
    } else if (m.age >= KIN_RETIRE_AGE) {
      next = { ...prev, status: 'retired' };
      note = `${who} 退休了`;
    } else if (prev.status === 'employed') {
      const r = rng();
      if (r < layoff) {
        next = { ...prev, status: 'unemployed' };
        note = wave ? `📉 失业潮：${who} 丢了「${prev.title}」的工作` : `${who} 失业了`;
      } else if (r < layoff + KIN_JOB_CHANGE_CHANCE) {
        next = employed(m.name, pickJob(classId, rng, prev.title), classId);
        note = `${who} 改行做了${next.title}`;
      } else {
        next = prev;
      }
    } else if (rng() < rehire) {
      next = employed(m.name, pickJob(classId, rng), classId);
      note = `${who} 重新找到工作：${next.title}`;
    } else {
      next = prev;
    }
    jobs[m.id] = next;
    if (note && noteworthy(m)) notes.push(note);
  }
  return { state: { ...state, jobs }, notes };
};

/** 在世家人的月收入合计（计入家族资产净值） */
export const kinIncomeTotal = (members: FamilyMemberView[]): number =>
  members.reduce((sum, m) => sum + (!m.isPlayer && m.status !== '已故' ? m.income ?? 0 : 0), 0);

/** 开发测试工具：所有在职家人立即失业（测试失业潮、零花与家族财力的联动） */
export const layoffAllForTesting = (state: FamilyState): FamilyState => ({
  ...state,
  jobs: Object.fromEntries(Object.entries(state.jobs ?? {}).map(([id, j]) => [id, j.status === 'employed' ? { ...j, status: 'unemployed' as const } : j])),
});
