// 家族出身：阶层、起始资产、父母家条件与童工（undefined.md 第 18、19 题）

import { FamilyMemberDef, FamilyOrigin, Gender, Kin, VALENTINE_MEMBERS, pick, relationFor } from './family';
import { randomFullName } from './names';
import { familiesActiveIn } from '../data/fixedFamilies';

export type ClassId = 'beggar' | 'commoner' | 'modest' | 'middle' | 'merchant' | 'noble' | 'royal';

export interface SocialClass {
  id: ClassId;
  label: string;
  probability: number;
  startCash: number;
  startDeposit: number;
  /** 未满 18 岁、没有自己住处时父母家提供的舒适度；0 = 没有家 */
  parentHomeComfort: number;
  /** 未成年时医疗费是否由父母承担 */
  parentsPayMedical: boolean;
  /** 起始声望（第二批「声望」系统使用） */
  startReputation: number;
  /** 8–15 岁是否可以（需要）打童工 */
  childLabor: boolean;
  /** 患病概率倍数（营养与卫生条件） */
  diseaseMultiplier: number;
  surnames: string[];
  /** 父母的职业 [父, 母] 候选 */
  parentJobs: Array<[string, string]>;
  /** 兄弟姐妹成年后的职业候选 */
  adultJobs: string[];
  lifespanRange: [number, number];
}

export const SOCIAL_CLASSES: SocialClass[] = [
  {
    id: 'beggar', label: '乞丐', probability: 0.1, startCash: 0, startDeposit: 0,
    parentHomeComfort: 0, parentsPayMedical: false, startReputation: 0, childLabor: true, diseaseMultiplier: 1.5,
    surnames: ['伊体什', '察察沃', '达悉', '米尔'],
    parentJobs: [['街头乞讨', '街头乞讨'], ['码头零工', '拾荒'], ['流浪卖艺', '洗衣帮工']],
    adultJobs: ['码头零工', '拾荒', '流浪卖艺'],
    lifespanRange: [45, 65],
  },
  {
    id: 'commoner', label: '平民', probability: 0.35, startCash: 300, startDeposit: 0,
    parentHomeComfort: 2, parentsPayMedical: true, startReputation: 5, childLabor: true, diseaseMultiplier: 1.2,
    surnames: ['阿布灭', '诺座埃实', '奥克斯', '伊希纳', '朱厄奇作'],
    parentJobs: [['纺织厂工人', '纺织厂女工'], ['佃农', '农妇'], ['搬运工', '洗衣妇'], ['矿工', '帮佣']],
    adultJobs: ['纺织厂工人', '佃农', '搬运工', '铁路工人'],
    lifespanRange: [55, 72],
  },
  {
    id: 'modest', label: '小康', probability: 0.25, startCash: 3000, startDeposit: 10000,
    parentHomeComfort: 4, parentsPayMedical: true, startReputation: 10, childLabor: false, diseaseMultiplier: 1,
    surnames: ['阿加德斯', '伊济耶特', '克额图', '艾金'],
    parentJobs: [['杂货铺店主', '裁缝'], ['木匠师傅', '小学教员'], ['邮局书记员', '织布作坊主']],
    adultJobs: ['小店主', '工匠', '书记员', '教员'],
    lifespanRange: [60, 78],
  },
  {
    id: 'middle', label: '中产', probability: 0.18, startCash: 20000, startDeposit: 80000,
    parentHomeComfort: 5, parentsPayMedical: true, startReputation: 20, childLabor: false, diseaseMultiplier: 0.9,
    surnames: ['费佘', '斯罗尼', '维格', '那若格'],
    parentJobs: [['医生', '学堂教师'], ['工程师', '药剂师'], ['律政士', '商行账房']],
    adultJobs: ['医生', '工程师', '教师', '律政士'],
    lifespanRange: [62, 80],
  },
  {
    id: 'merchant', label: '富商', probability: 0.09, startCash: 100000, startDeposit: 500000,
    parentHomeComfort: 7, parentsPayMedical: true, startReputation: 30, childLabor: false, diseaseMultiplier: 0.8,
    surnames: ['扎哈罗夫', '彼得罗夫', '霍夫曼', '卡里莫夫'],
    parentJobs: [['商行东家', '商行女掌柜'], ['银行家', '慈善会董事'], ['船运公司老板', '珠宝店东家']],
    adultJobs: ['商行东家', '银行经理', '船运商'],
    lifespanRange: [64, 82],
  },
  {
    id: 'noble', label: '贵族', probability: 0.029, startCash: 500000, startDeposit: 2000000,
    parentHomeComfort: 9, parentsPayMedical: true, startReputation: 50, childLabor: false, diseaseMultiplier: 0.7,
    surnames: ['瓦伦丁', '伊马达', '洪图拉颜', '鄂登禾萨穆'],
    parentJobs: [['世袭男爵', '男爵夫人'], ['宫廷侍从官', '伯爵夫人'], ['将军', '贵族沙龙女主人']],
    adultJobs: ['宫廷官员', '军官', '庄园主'],
    lifespanRange: [65, 84],
  },
  {
    id: 'royal', label: '皇族', probability: 0.001, startCash: 3000000, startDeposit: 10000000,
    parentHomeComfort: 10, parentsPayMedical: true, startReputation: 80, childLabor: false, diseaseMultiplier: 0.6,
    surnames: ['纳海'],
    parentJobs: [['亲王（纳海王朝宗室）', '王妃']],
    adultJobs: ['亲王', '公主', '宗室大臣'],
    lifespanRange: [65, 85],
  },
];

/**
 * 阶层提升（undefined.md 第 32 题，默认值）：家族资产净值与当家人声望同时达到门槛时，每月最多晋升一级。
 * 皇族不能通过晋升获得；贵族需要「受封爵位」，门槛最高。
 */
export interface Promotion {
  from: ClassId;
  to: ClassId;
  minNetWorth: number;
  minReputation: number;
  reason: string;
}

export const PROMOTIONS: Promotion[] = [
  { from: 'beggar', to: 'commoner', minNetWorth: 5_000, minReputation: 0, reason: '告别流浪，有了安身之所。' },
  { from: 'commoner', to: 'modest', minNetWorth: 50_000, minReputation: 10, reason: '家境日渐殷实。' },
  { from: 'modest', to: 'middle', minNetWorth: 500_000, minReputation: 20, reason: '置下体面产业，跻身城中中产。' },
  { from: 'middle', to: 'merchant', minNetWorth: 5_000_000, minReputation: 30, reason: '生意兴隆，成为一方富商。' },
  { from: 'merchant', to: 'noble', minNetWorth: 100_000_000, minReputation: 60, reason: '家财万贯、声名远扬，蒙帝皇恩准受封爵位。' },
];

export const nextPromotion = (classId: string): Promotion | undefined => PROMOTIONS.find((p) => p.from === classId);

/** 满足门槛时返回晋升信息，否则 undefined */
export const checkPromotion = (classId: string, netWorth: number, reputation: number): Promotion | undefined => {
  const p = nextPromotion(classId);
  return p && netWorth >= p.minNetWorth && reputation >= p.minReputation ? p : undefined;
};

// ---------- 主角寿命（第 51 题，默认值） ----------
// 出生时按阶层决定寿命：比同阶层家人的寿命范围多 PLAYER_LIFESPAN_BONUS 岁（主角会就医保养），「长寿」特质再加 10 岁。
// 到达寿命即寿终正寝，医院只能延缓健康衰减，不能阻止。

export const PLAYER_LIFESPAN_KEY = 'amigo_player_lifespan';
export const PLAYER_LIFESPAN_BONUS = 15;
export const LONGEVITY_LIFESPAN_BONUS = 10;

export const rollPlayerLifespan = (classId: string, traits: string[] = [], rng: () => number = Math.random): number => {
  const [lo, hi] = classById(classId).lifespanRange;
  return lo + PLAYER_LIFESPAN_BONUS + Math.floor(rng() * (hi - lo + 1)) + (traits.includes('longevity') ? LONGEVITY_LIFESPAN_BONUS : 0);
};

// ---------- 阶层降级（第 46 题） ----------
// 家族资产净值连续 DEMOTION_MONTHS 个月低于「晋升到当前阶层所需资产」的 DEMOTION_RATIO，就降一级。
// 只会降回晋升前的阶层：出生时所在的阶层不会因资产低而被降级（否则小康、中产出身的角色一开始就会被降级）；贵族、皇族不降。

export const DEMOTION_MONTHS = 12;
export const DEMOTION_RATIO = 0.5;

const CLASS_ORDER: ClassId[] = ['beggar', 'commoner', 'modest', 'middle', 'merchant', 'noble', 'royal'];
export const classRank = (id: string) => CLASS_ORDER.indexOf(id as ClassId);

export interface DemotionCheck {
  /** 连续低于门槛的月数 */
  streak: number;
  /** 需要降级时：从哪一级降回哪一级 */
  demote?: { from: ClassId; to: ClassId };
}

export const checkDemotion = (classId: string, netWorth: number, streak: number, baseClassId: string | undefined): DemotionCheck => {
  if (classId === 'noble' || classId === 'royal' || !baseClassId || classRank(classId) <= classRank(baseClassId)) return { streak: 0 };
  const p = PROMOTIONS.find((x) => x.to === classId);
  if (!p || netWorth >= p.minNetWorth * DEMOTION_RATIO) return { streak: 0 };
  const next = streak + 1;
  return next >= DEMOTION_MONTHS ? { streak: 0, demote: { from: p.to, to: p.from } } : { streak: next };
};

export const classById = (id: string | undefined): SocialClass =>
  SOCIAL_CLASSES.find((c) => c.id === id) ?? SOCIAL_CLASSES.find((c) => c.id === 'noble')!;

export const rollClass = (rng: () => number = Math.random): SocialClass => {
  let r = rng();
  for (const c of SOCIAL_CLASSES) {
    if (r < c.probability) return c;
    r -= c.probability;
  }
  return SOCIAL_CLASSES[1];
};

const between = (min: number, max: number, rng: () => number) => min + Math.floor(rng() * (max - min + 1));

const AVATAR_COLORS = ['#525a66', '#3d6185', '#a64245', '#8a6538', '#a1476b', '#3d7a63', '#684a85'];

/** 生成出生登记时的家族：祖父母、父母、0–3 个兄弟姐妹（年龄差相对于 8 岁登记的主角） */
/**
 * 本阶层可出生的姓氏：固定家族列表（src/data/fixedFamilies.ts）中当年存在、可出生的同阶层家族；
 * 皇族与贵族只从固定家族中抽取，其余阶层再加上本阶层的普通姓氏。
 */
export const surnamePoolFor = (cls: SocialClass, year: number): string[] => {
  const fixed = familiesActiveIn(year)
    .filter((f) => f.classId === cls.id && f.playable !== false)
    .map((f) => f.surname);
  if ((cls.id === 'royal' || cls.id === 'noble') && fixed.length > 0) return fixed;
  return [...new Set([...fixed, ...cls.surnames])];
};

/**
 * 生成家族出身。preferredSurname：玩家在出生登记时填写的姓（第 56 题），家族沿用这个姓；
 * 留空则按阶层随机。皇族只有纳海王朝，填写的姓不生效。
 */
export const generateOrigin = (cls: SocialClass, rng: () => number = Math.random, year = 1870, preferredSurname = ''): FamilyOrigin => {
  const wanted = preferredSurname.trim();
  const surname = wanted && cls.id !== 'royal' ? wanted : pick(surnamePoolFor(cls, year), rng);
  // 瓦伦丁家族沿用原有成员设定、传家宝与大事记（只在贵族中出现）
  if (surname === '瓦伦丁' && (cls.id === 'noble' || !wanted)) {
    return { classId: cls.id, classLabel: cls.label, surname, members: VALENTINE_MEMBERS, isValentine: true };
  }

  const [fatherJob, motherJob] = pick(cls.parentJobs, rng);
  const lifespan = () => between(cls.lifespanRange[0], cls.lifespanRange[1], rng);
  const usedNames = new Set<string>();
  const nameFor = (gender: Gender) => {
    const n = randomFullName(gender, surname, rng, usedNames);
    usedNames.add(n);
    return n;
  };
  let seq = 0;
  const member = (kin: Kin, gender: Gender, ageOffset: number, stages: Array<[number, string]>, desc: string): FamilyMemberDef => ({
    id: `o${++seq}`,
    name: nameFor(gender),
    gender,
    kin,
    relation: relationFor(kin, gender, ageOffset),
    generation: kin === 'grandparent' ? '祖辈' : kin === 'parent' ? '父辈' : '平辈',
    ageOffset,
    lifespan: lifespan(),
    occupationByAge: stages,
    defaultAffinity: kin === 'parent' ? 90 : 80,
    avatarBg: AVATAR_COLORS[seq % AVATAR_COLORS.length],
    desc,
    traits: [cls.label],
  });

  const fatherOffset = between(24, 34, rng);
  const motherOffset = between(20, 30, rng);
  const members: FamilyMemberDef[] = [
    member('grandparent', '男', fatherOffset + between(22, 30, rng), [[0, pick(cls.adultJobs, rng)]], '家族的长辈。'),
    member('grandparent', '女', fatherOffset + between(20, 28, rng), [[0, pick(cls.adultJobs, rng)]], '家族的长辈。'),
    member('parent', '男', fatherOffset, [[0, fatherJob]], cls.id === 'beggar' ? '和你一起流落街头，靠零工与乞讨度日。' : '你的父亲。'),
    member('parent', '女', motherOffset, [[0, motherJob]], cls.id === 'beggar' ? '为了让孩子们吃上饭，四处帮工。' : '你的母亲。'),
  ];

  const siblingCount = between(0, 3, rng);
  const childStages: Array<[number, string]> = cls.id === 'beggar'
    ? [[0, '流浪孩童'], [16, pick(cls.adultJobs, rng)]]
    : [[0, '学龄前'], [6, cls.childLabor ? '学童 / 帮工' : '学堂学生'], [18, pick(cls.adultJobs, rng)]];
  for (let i = 0; i < siblingCount; i++) {
    let offset = 0;
    while (offset === 0) offset = between(-6, 8, rng);
    // 兄弟姐妹年龄差不能让其早于父母出生
    offset = Math.min(offset, motherOffset - 16);
    const gender: Gender = rng() < 0.5 ? '男' : '女';
    members.push(member('sibling', gender, offset, childStages, '你的手足。'));
  }

  return { classId: cls.id, classLabel: cls.label, surname, members };
};

// ---------- 童工（第 19 题 A：乞丐、平民家庭 8–15 岁） ----------

export const CHILD_LABOR_MAX_AGE = 15;
export const CHILD_JOB_KEY = 'amigo_child_job_id';

export interface ChildJob {
  id: string;
  title: string;
  salary: number;
  healthCost: number;
  desc: string;
}

export const CHILD_JOBS: ChildJob[] = [
  { id: 'cj1', title: '擦鞋童', salary: 300, healthCost: 1, desc: '在北城车站前替旅客擦皮鞋。' },
  { id: 'cj2', title: '报童', salary: 400, healthCost: 1, desc: '清晨沿街叫卖《帝国远东日报》。' },
  { id: 'cj3', title: '作坊学徒', salary: 500, healthCost: 1, desc: '在铁匠或木匠作坊打下手，学一门手艺。' },
  { id: 'cj4', title: '纺织厂童工', salary: 700, healthCost: 2, desc: '在纺纱机间穿梭接线头，一站就是十几个小时。' },
  { id: 'cj5', title: '矿场拣煤童', salary: 900, healthCost: 3, desc: '在煤堆里分拣煤块，满身煤灰，咳嗽不止。' },
];

export const readChildJob = (): ChildJob | null => {
  try {
    const id = localStorage.getItem(CHILD_JOB_KEY);
    return CHILD_JOBS.find((j) => j.id === id) ?? null;
  } catch {
    return null;
  }
};
