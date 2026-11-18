import { beforeEach, describe, expect, it } from 'vitest';
import { buildFamilyMembers, Child, FamilyMemberDef, FamilyState, INITIAL_FAMILY_STATE, KinJob } from './family';
import { classById } from './lineage';
import { KIN_LAYOFF_CHANCE, KIN_REHIRE_CHANCE, KIN_RETIRE_AGE, WAVE_LAYOFF_MULTIPLIER, kinIncomeTotal, monthlyKinJobs } from './kinJobs';
import { familyAllowance } from './allowance';
import { familyNetWorth, KIN_INCOME_MONTHS } from './familyRank';
import { currentRateEvent } from './bank';

const QUIET_YEAR = 1870;
/** 银行利率上浮的历史大事件年份，视为失业潮 */
const WAVE_YEAR = 1880;
const CLASS = 'middle';

const parent = (id: string, ageOffset: number, job: string): FamilyMemberDef => ({
  id,
  name: `长辈${id}`,
  gender: id === 'f' ? '男' : '女',
  kin: 'parent',
  relation: id === 'f' ? '父亲' : '母亲',
  generation: '父辈',
  ageOffset,
  lifespan: 90,
  occupationByAge: [[0, job]],
  defaultAffinity: 90,
  avatarBg: '#000',
  desc: '',
  traits: [],
});
const kid = (id: string, age: number, year: number): Child => ({ id, name: `后代${id}`, gender: '男', birthYear: year - age, birthMonth: 1, lifespan: 85 });

const family = (year = QUIET_YEAR, jobs?: Record<string, KinJob>): FamilyState => ({
  ...INITIAL_FAMILY_STATE,
  origin: { classId: CLASS, classLabel: '中产', surname: '测试', members: [parent('f', 15, '医生'), parent('m', 25, '教师')] },
  children: [kid('adult', 25, year), kid('minor', 10, year)],
  ...(jobs ? { jobs } : {}),
});
const view = (state: FamilyState, year = QUIET_YEAR, playerAge = 40) =>
  buildFamilyMembers(state, { playerName: '当家人', playerGender: '男', playerAge, playerOccupation: '待业', gameYear: year, gameMonth: 6 });
const run = (state: FamilyState, year: number, rng: () => number) => monthlyKinJobs(state, view(state, year), year, rng);

beforeEach(() => localStorage.clear());

describe('分配工作', () => {
  it('成年家人按阶层得到工作；原有正式职业保留；60 岁以上为退休；未成年人没有工作', () => {
    const { state } = run(family(), QUIET_YEAR, () => 0.99);
    expect(state.jobs!.f).toMatchObject({ status: 'employed', title: '医生' });
    expect(classById(CLASS).adultJobs).toContain(state.jobs!.adult.title);
    expect(state.jobs!.m.status).toBe('retired');
    expect(state.jobs!.minor).toBeUndefined();
  });

  it('族谱显示当前职业与收入', () => {
    const { state } = run(family(), QUIET_YEAR, () => 0.99);
    const f = view(state).find((m) => m.id === 'f')!;
    expect(f.occupation).toBe('医生');
    expect(f.income).toBe(state.jobs!.f.income);
  });
});

describe('工作变动', () => {
  const employedAll = () => run(family(), QUIET_YEAR, () => 0.99).state.jobs!;

  it('失业潮期间更容易失业', () => {
    expect(currentRateEvent(WAVE_YEAR)).not.toBeNull();
    const r = (KIN_LAYOFF_CHANCE + KIN_LAYOFF_CHANCE * WAVE_LAYOFF_MULTIPLIER) / 2;
    const quiet = run(family(QUIET_YEAR, employedAll()), QUIET_YEAR, () => r).state;
    const wave = run(family(WAVE_YEAR, employedAll()), WAVE_YEAR, () => r).state;
    expect(quiet.jobs!.adult.status).toBe('employed');
    expect(wave.jobs!.adult.status).toBe('unemployed');
  });

  it('失业的家人会重新找到工作', () => {
    const jobs = employedAll();
    jobs.adult = { ...jobs.adult, status: 'unemployed' };
    const r = run(family(QUIET_YEAR, jobs), QUIET_YEAR, () => KIN_REHIRE_CHANCE / 2).state;
    expect(r.jobs!.adult.status).toBe('employed');
  });

  it(`年满 ${KIN_RETIRE_AGE} 岁退休，并提示`, () => {
    const jobs = employedAll();
    const { state, notes } = run(family(QUIET_YEAR, jobs), QUIET_YEAR + 0, () => 0.99);
    expect(state.jobs!.f.status).toBe('employed');
    const old = { ...family(QUIET_YEAR, jobs) };
    const later = monthlyKinJobs(old, view(old, QUIET_YEAR, KIN_RETIRE_AGE - 15), QUIET_YEAR, () => 0.99);
    expect(later.state.jobs!.f.status).toBe('retired');
    expect(later.notes.some((n) => n.includes('退休'))).toBe(true);
    expect(notes).toEqual([]);
  });
});

describe('与零花、家族财力联动', () => {
  it('父母失业时不给零花', () => {
    const jobs = run(family(), QUIET_YEAR, () => 0.99).state.jobs!;
    const viewParams = { playerName: '当家人', playerGender: '男', playerAge: 12, playerOccupation: '学生', gameYear: QUIET_YEAR, gameMonth: 6 };
    const working = familyAllowance(family(QUIET_YEAR, jobs), viewParams, 12, CLASS);
    const laidOff = familyAllowance(family(QUIET_YEAR, { ...jobs, f: { ...jobs.f, status: 'unemployed' } }), viewParams, 12, CLASS);
    expect(working.parts.find((p) => p.name === '长辈f')!.amount).toBeGreaterThan(0);
    expect(laidOff.parts.find((p) => p.name === '长辈f')!.amount).toBe(0);
  });

  it('在世家人的收入按一年计入家族资产净值', () => {
    const state = run(family(), QUIET_YEAR, () => 0.99).state;
    const income = kinIncomeTotal(view(state));
    expect(income).toBeGreaterThan(0);
    expect(familyNetWorth(0, 0, 0, 0, 0, income)).toBe(income * KIN_INCOME_MONTHS);
  });
});
