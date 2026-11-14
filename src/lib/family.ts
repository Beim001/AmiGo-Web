// 家族、婚姻与子嗣系统（纯函数，便于测试）
//
// - 瓦伦丁家族成员为固定设定，但年龄按「玩家年龄 + 年龄差」实时计算，长辈到寿命上限后显示为已故
// - 玩家年满 MARRIAGE_MIN_AGE 岁可在「结婚登记」缔结婚姻（配偶从随机候选人中选择）
// - 婚后每次推进月份有 BIRTH_CHANCE 的概率迎来子嗣（玩家与配偶均不超过 BIRTH_MAX_AGE 岁，最多 MAX_CHILDREN 人）
// - 每位在世成员每个游戏月可互动 1 次，好感度持久化

export type Gender = '男' | '女';
export type InteractionKind = 'spar' | 'consult' | 'gift';

export const MARRIAGE_MIN_AGE = 18;
export const MARRIAGE_FEE = 1000;
export const DIVORCE_FEE = 1000;
export const SPOUSE_CANDIDATE_COUNT = 10;
export const BIRTH_CHANCE = 0.06;
export const BIRTH_MAX_AGE = 45;
export const MAX_CHILDREN = 6;
export const GIFT_COST = 500;
export const CONSULT_REWARD_MIN = 200;
export const CONSULT_REWARD_MAX = 800;
export const SPAR_HEALTH_GAIN = 2;
export const AFFINITY_GAIN: Record<InteractionKind, number> = { spar: 2, consult: 1, gift: 5 };
export const SPOUSE_INITIAL_AFFINITY = 80;
export const CHILD_INITIAL_AFFINITY = 90;

export interface Spouse {
  name: string;
  gender: Gender;
  birthYear: number;
  occupation: string;
  marriedYear: number;
  marriedMonth: number;
}

export interface FormerSpouse extends Spouse {
  divorcedYear: number;
  divorcedMonth: number;
}

export interface Child {
  id: string;
  name: string;
  gender: Gender;
  birthYear: number;
  birthMonth: number;
  /** 另一位家长（出生时的配偶）；玩家本人是孩子的另一位家长。旧存档中可能缺失 */
  otherParentName?: string;
  otherParentGender?: Gender;
}

export interface FamilyEvent {
  year: number;
  month: number;
  title: string;
  desc: string;
}

export interface FamilyState {
  /** 成员 id → 好感度（未记录时用设定默认值） */
  affinity: Record<string, number>;
  /** 成员 id → 最近一次互动的游戏年月 'YYYY-MM' */
  lastInteraction: Record<string, string>;
  spouse: Spouse | null;
  /** 前任配偶（按离婚先后排列）；旧存档中没有此字段，读取时用 getFormerSpouses() */
  formerSpouses?: FormerSpouse[];
  children: Child[];
  events: FamilyEvent[];
}

export const INITIAL_FAMILY_STATE: FamilyState = {
  affinity: {},
  lastInteraction: {},
  spouse: null,
  formerSpouses: [],
  children: [],
  events: [],
};

export const getFormerSpouses = (state: FamilyState): FormerSpouse[] => state.formerSpouses ?? [];

// ---------- 固定的瓦伦丁家族成员 ----------

export interface FamilyMemberDef {
  id: string;
  name: string;
  relation: string;
  generation: string;
  /** 与玩家的年龄差（正数为年长） */
  ageOffset: number;
  /** 去世年龄；到达后显示为已故。祖父开局即已故 */
  lifespan: number;
  traveling?: boolean;
  /** 按年龄段的身份：[最小年龄, 身份]，取满足条件的最后一项 */
  occupationByAge: Array<[number, string]>;
  defaultAffinity: number;
  avatarBg: string;
  desc: string;
  traits: string[];
}

export const VALENTINE_MEMBERS: FamilyMemberDef[] = [
  {
    id: 'm1', name: '亚历山大·瓦伦丁', relation: '祖父', generation: '一世 (祖辈)',
    ageOffset: 999, lifespan: 78, occupationByAge: [[0, '帝国前皇家首席工匠']],
    defaultAffinity: 100, avatarBg: '#525a66',
    desc: '曾主持设计卡罗尼亚大铁桥，奠定了瓦伦丁家族的社会地位与技术基业。',
    traits: ['皇家勋章', '匠人精神', '遗产继承'],
  },
  {
    id: 'm2', name: '维克多·瓦伦丁', relation: '父亲', generation: '二世 (父辈)',
    ageOffset: 30, lifespan: 74, occupationByAge: [[0, '高级机械总工程师']],
    defaultAffinity: 92, avatarBg: '#3d6185',
    desc: '现任家族族长，对你寄予厚望，常在机械设计与人生规划上给予悉心指点。',
    traits: ['现任族长', '严肃严谨', '工坊主理'],
  },
  {
    id: 'm3', name: '艾琳娜·瓦伦丁', relation: '母亲', generation: '二世 (父辈)',
    ageOffset: 27, lifespan: 79, occupationByAge: [[0, '帝国医学院讲师']],
    defaultAffinity: 98, avatarBg: '#a64245',
    desc: '温柔体贴，精通草药与医学，时刻关怀你的健康与身心状态。',
    traits: ['关怀备至', '医疗背景', '理财高手'],
  },
  {
    id: 'm4', name: '罗兰·瓦伦丁', relation: '叔叔', generation: '二世 (父辈)',
    ageOffset: 23, lifespan: 72, traveling: true, occupationByAge: [[0, '远洋商队船长']],
    defaultAffinity: 78, avatarBg: '#8a6538',
    desc: '性格豪爽不羁，常年穿梭于各大洲贸易港口，时不时寄回稀奇古怪的海外珍品。',
    traits: ['海外商旅', '神秘礼物', '见多识广'],
  },
  {
    id: 'm6', name: '莉莉安·瓦伦丁', relation: '妹妹', generation: '三世 (平辈)',
    ageOffset: -4, lifespan: 81,
    occupationByAge: [[0, '学龄前'], [6, '市立学堂学生'], [14, '皇家艺术学院学生'], [20, '油画家与音乐家']],
    defaultAffinity: 95, avatarBg: '#a1476b',
    desc: '活泼开朗，充满艺术天赋，擅长油画与音乐，是家里的开心果。',
    traits: ['艺术天才', '灵感充沛', '家族团宠'],
  },
  {
    id: 'm7', name: '埃里克·瓦伦丁', relation: '堂弟', generation: '三世 (平辈)',
    ageOffset: -7, lifespan: 76,
    occupationByAge: [[0, '学龄前'], [6, '市立学堂学生'], [18, '独立发明家']],
    defaultAffinity: 85, avatarBg: '#3d7a63',
    desc: '罗兰叔叔的儿子，极具发明头脑，常常偷偷拆装家里的齿轮钟表。',
    traits: ['鬼马发明家', '好奇心强', '崇拜你'],
  },
];

export const PLAYER_MEMBER_ID = 'm5';
export const SPOUSE_MEMBER_ID = 'spouse';

export const GENERATIONS = ['一世 (祖辈)', '二世 (父辈)', '三世 (平辈)', '四世 (子辈)'];

export interface FamilyMemberView {
  id: string;
  name: string;
  relation: string;
  generation: string;
  age: number;
  status: '在世' | '已故' | '远游';
  occupation: string;
  affinity: number;
  avatarBg: string;
  desc: string;
  traits: string[];
  isPlayer?: boolean;
  /** 子嗣的父母，例如「张三（父）、安娜·杜邦（母）」 */
  parents?: string;
}

const parentLabel = (gender: string | null | undefined) => (gender === '女' ? '母' : gender === '男' ? '父' : '家长');

export const describeParents = (child: Child, playerName: string, playerGender: string | null): string =>
  `${playerName}（${parentLabel(playerGender)}）、` +
  (child.otherParentName ? `${child.otherParentName}（${parentLabel(child.otherParentGender)}）` : '另一位家长不详');

const occupationFor = (stages: Array<[number, string]>, age: number) =>
  stages.filter(([min]) => age >= min).pop()?.[1] ?? stages[0][1];

const CHILD_STAGES: Array<[number, string]> = [[0, '襁褓婴儿'], [3, '学龄前'], [6, '市立学堂学生'], [18, '自立门户']];

export const yearMonthKey = (year: number, month: number) => `${year}-${month < 10 ? '0' + month : month}`;

export const ageAt = (birthYear: number, birthMonth: number, year: number, month: number) =>
  Math.max(0, year - birthYear - (month < birthMonth ? 1 : 0));

export const buildFamilyMembers = (
  state: FamilyState,
  params: { playerName: string; playerGender: string | null; playerAge: number; playerOccupation: string; gameYear: number; gameMonth: number },
): FamilyMemberView[] => {
  const { playerName, playerGender, playerAge, playerOccupation, gameYear, gameMonth } = params;
  const affinityOf = (id: string, fallback: number) => state.affinity[id] ?? fallback;

  const members: FamilyMemberView[] = VALENTINE_MEMBERS.map((def) => {
    const rawAge = playerAge + def.ageOffset;
    const deceased = rawAge >= def.lifespan;
    const age = deceased ? def.lifespan : rawAge;
    return {
      id: def.id,
      name: def.name,
      relation: def.relation,
      generation: def.generation,
      age,
      status: deceased ? '已故' : def.traveling ? '远游' : '在世',
      occupation: occupationFor(def.occupationByAge, age),
      affinity: affinityOf(def.id, def.defaultAffinity),
      avatarBg: def.avatarBg,
      desc: def.desc,
      traits: def.traits,
    };
  });

  members.splice(4, 0, {
    id: PLAYER_MEMBER_ID,
    name: playerName,
    relation: '你自己',
    generation: '三世 (平辈)',
    age: playerAge,
    status: '在世',
    occupation: playerOccupation,
    affinity: 100,
    avatarBg: '#a68245',
    desc: `瓦伦丁家族第三代${playerGender === '女' ? '长女' : playerGender === '男' ? '长子' : '子嗣'}，承载着家族复兴的希望。`,
    traits: ['家族继承人'],
    isPlayer: true,
  });

  if (state.spouse) {
    const s = state.spouse;
    members.push({
      id: SPOUSE_MEMBER_ID,
      name: s.name,
      relation: s.gender === '女' ? '妻子' : '丈夫',
      generation: '三世 (平辈)',
      age: Math.max(0, gameYear - s.birthYear),
      status: '在世',
      occupation: s.occupation,
      affinity: affinityOf(SPOUSE_MEMBER_ID, SPOUSE_INITIAL_AFFINITY),
      avatarBg: '#b2586a',
      desc: `${s.marriedYear} 年 ${s.marriedMonth} 月与你缔结婚姻，携手经营瓦伦丁家族的新一代。`,
      traits: ['伴侣', '家庭支柱'],
    });
  }

  state.children.forEach((c) => {
    const age = ageAt(c.birthYear, c.birthMonth, gameYear, gameMonth);
    members.push({
      id: c.id,
      name: c.name,
      relation: c.gender === '女' ? '女儿' : '儿子',
      generation: '四世 (子辈)',
      age,
      status: '在世',
      occupation: occupationFor(CHILD_STAGES, age),
      affinity: affinityOf(c.id, CHILD_INITIAL_AFFINITY),
      avatarBg: c.gender === '女' ? '#c06a8a' : '#4a7aa8',
      desc: `生于 ${c.birthYear} 年 ${c.birthMonth} 月，瓦伦丁家族第四代。`,
      traits: ['家族新生代'],
      parents: describeParents(c, playerName, playerGender),
    });
  });

  return members;
};

// ---------- 结婚 ----------

const MALE_NAMES = ['亚瑟', '卢卡斯', '奥斯卡', '塞巴斯蒂安', '尼古拉', '费利克斯', '雷昂', '马克西姆', '伊万', '阿列克谢'];
const FEMALE_NAMES = ['索菲亚', '伊莎贝拉', '克拉拉', '安娜', '艾米莉亚', '奥尔加', '薇拉', '娜塔莎', '玛丽娜', '叶莲娜'];
const SPOUSE_SURNAMES = ['彼得罗夫', '卡里莫夫', '霍夫曼', '杜邦', '罗西', '诺维科夫', '施密特', '拉希多夫'];
const SPOUSE_OCCUPATIONS = ['学堂教师', '裁缝铺店主', '医院护理员', '商行账房', '邮局书记员', '钟表匠', '画师', '药剂师', '纺织厂工头', '报社编辑'];

const pick = <T,>(list: T[], rng: () => number) => list[Math.floor(rng() * list.length)];

export interface SpouseCandidate {
  name: string;
  gender: Gender;
  age: number;
  occupation: string;
}

export const generateSpouseCandidates = (
  playerAge: number,
  rng: () => number = Math.random,
  count = SPOUSE_CANDIDATE_COUNT,
): SpouseCandidate[] => {
  const candidates: SpouseCandidate[] = [];
  const usedNames = new Set<string>();
  // 名字组合共 (10+10)×8 = 160 种；限制尝试次数，防止极端随机数下死循环
  for (let attempt = 0; candidates.length < count && attempt < count * 20; attempt++) {
    const gender: Gender = rng() < 0.5 ? '男' : '女';
    const name = `${pick(gender === '男' ? MALE_NAMES : FEMALE_NAMES, rng)}·${pick(SPOUSE_SURNAMES, rng)}`;
    if (usedNames.has(name)) continue;
    usedNames.add(name);
    const age = Math.max(MARRIAGE_MIN_AGE, playerAge + Math.floor(rng() * 11) - 5);
    candidates.push({ name, gender, age, occupation: pick(SPOUSE_OCCUPATIONS, rng) });
  }
  return candidates;
};

export const marry = (state: FamilyState, candidate: SpouseCandidate, year: number, month: number): FamilyState => ({
  ...state,
  spouse: {
    name: candidate.name,
    gender: candidate.gender,
    birthYear: year - candidate.age,
    occupation: candidate.occupation,
    marriedYear: year,
    marriedMonth: month,
  },
  events: [...state.events, { year, month, title: '缔结婚姻', desc: `你与 ${candidate.name} 在帝国民政署登记结婚，瓦伦丁家族迎来新成员。` }],
});

// ---------- 离婚 ----------
// 子嗣留在瓦伦丁家族；前配偶移出族谱并记入前任配偶列表，其好感度与互动记录清除（下一任配偶重新计算）

export const divorce = (state: FamilyState, year: number, month: number): FamilyState => {
  if (!state.spouse) return state;
  const { [SPOUSE_MEMBER_ID]: _a, ...affinity } = state.affinity;
  const { [SPOUSE_MEMBER_ID]: _l, ...lastInteraction } = state.lastInteraction;
  return {
    ...state,
    spouse: null,
    formerSpouses: [...getFormerSpouses(state), { ...state.spouse, divorcedYear: year, divorcedMonth: month }],
    affinity,
    lastInteraction,
    events: [...state.events, { year, month, title: '解除婚姻', desc: `你与 ${state.spouse.name} 在帝国民政署办理了离婚手续。` }],
  };
};

// ---------- 子嗣（每月推进时调用） ----------

export const tryHaveChild = (
  state: FamilyState,
  playerAge: number,
  year: number,
  month: number,
  rng: () => number = Math.random,
): { state: FamilyState; child: Child | null } => {
  const s = state.spouse;
  if (!s) return { state, child: null };
  const spouseAge = year - s.birthYear;
  if (playerAge > BIRTH_MAX_AGE || spouseAge > BIRTH_MAX_AGE || state.children.length >= MAX_CHILDREN) {
    return { state, child: null };
  }
  if (rng() >= BIRTH_CHANCE) return { state, child: null };

  const gender: Gender = rng() < 0.5 ? '男' : '女';
  const usedNames = new Set(state.children.map((c) => c.name));
  const pool = (gender === '男' ? MALE_NAMES : FEMALE_NAMES).map((n) => `${n}·瓦伦丁`).filter((n) => !usedNames.has(n));
  const name = pool.length > 0 ? pick(pool, rng) : `${pick(gender === '男' ? MALE_NAMES : FEMALE_NAMES, rng)}·瓦伦丁 ${state.children.length + 1} 世`;
  const child: Child = {
    id: `child_${year}_${month}_${state.children.length + 1}`,
    name,
    gender,
    birthYear: year,
    birthMonth: month,
    otherParentName: s.name,
    otherParentGender: s.gender,
  };

  return {
    child,
    state: {
      ...state,
      children: [...state.children, child],
      events: [...state.events, { year, month, title: `喜得${gender === '女' ? '千金' : '麟儿'}`, desc: `${child.name} 降生，瓦伦丁家族第四代又添一员。` }],
    },
  };
};

// ---------- 互动 ----------

export const canInteract = (state: FamilyState, member: FamilyMemberView, year: number, month: number): string | null => {
  if (member.isPlayer) return '无法与自己互动';
  if (member.status === '已故') return `${member.name} 已经故去`;
  if (state.lastInteraction[member.id] === yearMonthKey(year, month)) return `本月已与 ${member.name} 互动过，下个月再来吧`;
  return null;
};

export const canDoInteraction = (member: FamilyMemberView, kind: InteractionKind, playerAge: number): string | null => {
  if (kind === 'spar' && member.status === '远游') return `${member.name} 正在远游，无法当面切磋`;
  if (kind === 'consult' && member.age <= playerAge) return '只能向比你年长的家人请教';
  return null;
};

export const applyInteraction = (
  state: FamilyState,
  member: FamilyMemberView,
  kind: InteractionKind,
  year: number,
  month: number,
): FamilyState => ({
  ...state,
  affinity: { ...state.affinity, [member.id]: Math.min(100, member.affinity + AFFINITY_GAIN[kind]) },
  lastInteraction: { ...state.lastInteraction, [member.id]: yearMonthKey(year, month) },
});

// ---------- 大事记 ----------

export const ANCESTRAL_CHRONICLES: FamilyEvent[] = [
  { year: 1860, month: 1, title: '皇家工匠勋章', desc: '祖父亚历山大主持大铁桥项目，获得皇室颁发的首席工匠金质勋章。' },
  { year: 1888, month: 1, title: '主导首都给排水改造', desc: '父亲维克多主导首都给排水机械化改建工程，家族社会威望大幅上升。' },
  { year: 1898, month: 1, title: '创立瓦伦丁科技基金', desc: '家族设立专项科技助学基金，资助十余名贫困理工学子。' },
];

export const buildChronicles = (state: FamilyState, gameYear: number, gameMonth: number): FamilyEvent[] =>
  [...ANCESTRAL_CHRONICLES, ...state.events]
    .filter((e) => e.year < gameYear || (e.year === gameYear && e.month <= gameMonth))
    .sort((a, b) => a.year - b.year || a.month - b.month);
