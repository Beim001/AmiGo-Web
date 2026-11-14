// 家族、婚姻、子嗣与传承系统（纯函数，便于测试）
//
// - 家族出身（阶层、姓氏、长辈与兄弟姐妹）在出生登记时随机生成（见 lineage.ts）；旧存档沿用「贵族 · 瓦伦丁家族」
// - 成员年龄按「主角年龄 + 年龄差」实时计算，到寿命上限后显示为已故
// - 玩家年满 MARRIAGE_MIN_AGE 岁可在「结婚登记」缔结婚姻（配偶从随机候选人中选择）
// - 婚后每次推进月份有 BIRTH_CHANCE 的概率迎来子嗣（玩家与配偶均不超过 BIRTH_MAX_AGE 岁，最多 MAX_CHILDREN 人）
// - 每位在世成员每个游戏月可互动 1 次，好感度持久化
// - 主角去世后可由年满 HEIR_MIN_AGE 岁的子嗣或兄弟姐妹继承，家族世系以继承人为「你」重新排列

import { randomTraits, inheritTraits, fertilityMultiplier, twinChanceFor, fertileMaxAge } from './traits';
import { randomFullName, MALE_GIVEN_NAMES, FEMALE_GIVEN_NAMES } from './names';
import { OwnedHeirloom, VALENTINE_DEFAULT_HEIRLOOMS } from './heirlooms';

export type Gender = '男' | '女';
export type InteractionKind = 'spar' | 'consult' | 'gift';

export const MARRIAGE_MIN_AGE = 18;
export const MARRIAGE_FEE = 1000;
export const DIVORCE_FEE = 1000;
export const SPOUSE_CANDIDATE_COUNT = 10;
export const BIRTH_CHANCE = 0.06;
export const BIRTH_MAX_AGE = 45;
export const MAX_CHILDREN = 6;
/** 每次生育为双胞胎的概率（剩余名额不足 2 人时只生一个） */
export const TWIN_CHANCE = 0.02;
export const GIFT_COST = 500;
export const CONSULT_REWARD_MIN = 200;
export const CONSULT_REWARD_MAX = 800;
export const SPAR_HEALTH_GAIN = 2;
export const AFFINITY_GAIN: Record<InteractionKind, number> = { spar: 2, consult: 1, gift: 5 };
export const SPOUSE_INITIAL_AFFINITY = 80;
export const CHILD_INITIAL_AFFINITY = 90;
/** 兄弟姐妹继承的最低年龄；子嗣继承不限年龄（未成年时由监护人托管一半财产） */
export const HEIR_MIN_AGE = 16;
/** 贵族情人：每月 3% 概率生下私生子 */
export const ILLEGITIMATE_CHANCE = 0.03;
export const LOVER_UPKEEP: Record<string, number> = { noble: 5000, royal: 20000 };
/** 好感度：每月未互动的成年家人 -1；低于阈值连续若干个月的支系会分家 */
export const AFFINITY_DECAY_PER_MONTH = 1;
export const DISCONTENT_THRESHOLD = 40;
export const SPLIT_AFTER_MONTHS = 12;
/** 分家时带走当家人现金的比例 */
export const SPLIT_CASH_SHARE = 0.1;
const DEFAULT_LIFESPAN = 72;

export interface Spouse {
  name: string;
  gender: Gender;
  birthYear: number;
  occupation: string;
  marriedYear: number;
  marriedMonth: number;
  traits?: string[];
  /** 寿命（第 52 题）；旧存档缺失时按 id 稳定推算 */
  lifespan?: number;
}

/** 情人（贵族、皇族已婚者可结识） */
export interface Lover {
  name: string;
  gender: Gender;
  birthYear: number;
  occupation: string;
  traits?: string[];
  sinceYear: number;
  sinceMonth: number;
}

/** 分家出去的支系 */
export interface SplitBranch {
  name: string;
  relation: string;
  year: number;
  month: number;
}

export interface FormerSpouse extends Spouse {
  divorcedYear: number;
  divorcedMonth: number;
  /** 配偶去世（丧偶）而非离婚 */
  widowed?: boolean;
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
  traits?: string[];
  /** 私生子女（与情人所生） */
  illegitimate?: boolean;
  /** 寿命（第 52 题）；旧存档缺失时按 id 稳定推算 */
  lifespan?: number;
  /** 成年后自己成家（第 52 题） */
  spouse?: Spouse;
  /** 自己的孩子（主角的孙辈） */
  kids?: Child[];
}

export interface FamilyEvent {
  year: number;
  month: number;
  title: string;
  desc: string;
}

/** 亲属类型（相对于当前主角），决定称谓与辈分 */
export type Kin = 'ancestor' | 'grandparent' | 'granduncle' | 'parent' | 'uncle' | 'sibling' | 'cousin' | 'nephew' | 'grandchild' | 'other';

export interface FamilyMemberDef {
  id: string;
  name: string;
  gender: Gender;
  kin: Kin;
  /** 称谓；kin 为 sibling / cousin / nephew 等时会按年龄、性别自动生成 */
  relation: string;
  generation: string;
  /** 与主角的年龄差（正数为年长） */
  ageOffset: number;
  /** 去世年龄；到达后显示为已故 */
  lifespan: number;
  traveling?: boolean;
  /** 按年龄段的身份：[最小年龄, 身份]，取满足条件的最后一项 */
  occupationByAge: Array<[number, string]>;
  defaultAffinity: number;
  avatarBg: string;
  desc: string;
  traits: string[];
}

/** 家族出身：阶层、姓氏与成员设定 */
export interface FamilyOrigin {
  classId: string;
  classLabel: string;
  surname: string;
  members: FamilyMemberDef[];
  /** 瓦伦丁家族（有传家宝与家族大事记设定） */
  isValentine?: boolean;
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
  /** 家族出身；旧存档没有此字段，视为贵族瓦伦丁家族 */
  origin?: FamilyOrigin;
  lover?: Lover | null;
  /** 成员 id → 好感度连续低于阈值的月数 */
  discontent?: Record<string, number>;
  splitBranches?: SplitBranch[];
  /** 成年家人改变后的礼物喜好（未记录时用出生喜好，见 gifts.ts） */
  giftTastes?: Record<string, 'toy' | 'jewelry' | 'antique'>;
  /** 当家人是继承上来的私生子女（父母给的零花减半，见 allowance.ts） */
  playerIllegitimate?: boolean;
  /** 晋升前（出生时）的阶层：降级最多降回这里（第 46 题） */
  baseClassId?: string;
  /** 资产连续低于降级门槛的月数 */
  demotionStreak?: number;
  /** 家族传家宝；旧存档没有此字段时，瓦伦丁家族默认持有三件祖传宝物 */
  heirlooms?: OwnedHeirloom[];
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

// ---------- 称谓与辈分 ----------

export const GENERATIONS = ['曾祖辈', '祖辈', '父辈', '平辈', '子辈', '孙辈'];

const KIN_GENERATION: Record<Kin, string> = {
  ancestor: '曾祖辈',
  grandparent: '祖辈',
  granduncle: '祖辈',
  parent: '父辈',
  uncle: '父辈',
  sibling: '平辈',
  cousin: '平辈',
  nephew: '子辈',
  grandchild: '孙辈',
  other: '父辈',
};

/** 按亲属类型、性别和与主角的年龄差生成称谓 */
export const relationFor = (kin: Kin, gender: Gender, ageOffset: number, fallback = '亲属'): string => {
  const f = gender === '女';
  switch (kin) {
    case 'ancestor': return f ? '曾祖母' : '曾祖父';
    case 'grandparent': return f ? '祖母' : '祖父';
    case 'granduncle': return f ? '姑祖母' : '叔祖父';
    case 'parent': return f ? '母亲' : '父亲';
    case 'uncle': return f ? '姑姑' : '叔叔';
    case 'sibling': return ageOffset > 0 ? (f ? '姐姐' : '哥哥') : (f ? '妹妹' : '弟弟');
    case 'grandchild': return f ? '孙女' : '孙子';
    case 'cousin': return ageOffset > 0 ? (f ? '堂姐' : '堂兄') : (f ? '堂妹' : '堂弟');
    case 'nephew': return f ? '侄女' : '侄子';
    default: return fallback;
  }
};

const withKin = (def: FamilyMemberDef, kin: Kin, ageOffset: number, relation?: string): FamilyMemberDef => ({
  ...def,
  kin,
  ageOffset,
  generation: KIN_GENERATION[kin],
  relation: relation ?? relationFor(kin, def.gender, ageOffset, def.relation),
});

// ---------- 旧存档默认：贵族 · 瓦伦丁家族 ----------

export const VALENTINE_MEMBERS: FamilyMemberDef[] = [
  {
    id: 'm1', name: '亚历山大·瓦伦丁', gender: '男', kin: 'grandparent', relation: '祖父', generation: '祖辈',
    ageOffset: 999, lifespan: 78, occupationByAge: [[0, '帝国前皇家首席工匠']],
    defaultAffinity: 100, avatarBg: '#525a66',
    desc: '曾主持设计卡罗尼亚大铁桥，奠定了瓦伦丁家族的社会地位与技术基业。',
    traits: ['皇家勋章', '匠人精神', '遗产继承'],
  },
  {
    id: 'm2', name: '维克多·瓦伦丁', gender: '男', kin: 'parent', relation: '父亲', generation: '父辈',
    ageOffset: 30, lifespan: 74, occupationByAge: [[0, '高级机械总工程师']],
    defaultAffinity: 92, avatarBg: '#3d6185',
    desc: '现任家族族长，对你寄予厚望，常在机械设计与人生规划上给予悉心指点。',
    traits: ['现任族长', '严肃严谨', '工坊主理'],
  },
  {
    id: 'm3', name: '艾琳娜·瓦伦丁', gender: '女', kin: 'parent', relation: '母亲', generation: '父辈',
    ageOffset: 27, lifespan: 79, occupationByAge: [[0, '帝国医学院讲师']],
    defaultAffinity: 98, avatarBg: '#a64245',
    desc: '温柔体贴，精通草药与医学，时刻关怀你的健康与身心状态。',
    traits: ['关怀备至', '医疗背景', '理财高手'],
  },
  {
    id: 'm4', name: '罗兰·瓦伦丁', gender: '男', kin: 'uncle', relation: '叔叔', generation: '父辈',
    ageOffset: 23, lifespan: 72, traveling: true, occupationByAge: [[0, '远洋商队船长']],
    defaultAffinity: 78, avatarBg: '#8a6538',
    desc: '性格豪爽不羁，常年穿梭于各大洲贸易港口，时不时寄回稀奇古怪的海外珍品。',
    traits: ['海外商旅', '神秘礼物', '见多识广'],
  },
  {
    id: 'm6', name: '莉莉安·瓦伦丁', gender: '女', kin: 'sibling', relation: '妹妹', generation: '平辈',
    ageOffset: -4, lifespan: 81,
    occupationByAge: [[0, '学龄前'], [6, '市立学堂学生'], [14, '皇家艺术学院学生'], [20, '油画家与音乐家']],
    defaultAffinity: 95, avatarBg: '#a1476b',
    desc: '活泼开朗，充满艺术天赋，擅长油画与音乐，是家里的开心果。',
    traits: ['艺术天才', '灵感充沛', '家族团宠'],
  },
  {
    id: 'm7', name: '埃里克·瓦伦丁', gender: '男', kin: 'cousin', relation: '堂弟', generation: '平辈',
    ageOffset: -7, lifespan: 76,
    occupationByAge: [[0, '学龄前'], [6, '市立学堂学生'], [18, '独立发明家']],
    defaultAffinity: 85, avatarBg: '#3d7a63',
    desc: '罗兰叔叔的儿子，极具发明头脑，常常偷偷拆装家里的齿轮钟表。',
    traits: ['鬼马发明家', '好奇心强', '崇拜你'],
  },
];

export const LEGACY_ORIGIN: FamilyOrigin = {
  classId: 'noble',
  classLabel: '贵族',
  surname: '瓦伦丁',
  members: VALENTINE_MEMBERS,
  isValentine: true,
};

export const getOrigin = (state: FamilyState): FamilyOrigin => state.origin ?? LEGACY_ORIGIN;

export const PLAYER_MEMBER_ID = 'm5';
export const SPOUSE_MEMBER_ID = 'spouse';

export interface FamilyMemberView {
  id: string;
  name: string;
  gender: Gender | null;
  kin?: Kin;
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
  /** 主角的子嗣 */
  isChild?: boolean;
  /** 子嗣的父母，例如「张三（父）、安娜·杜邦（母）」 */
  parents?: string;
  /** 机制特质（见 traits.ts）；只有配偶与子嗣有 */
  traitIds?: string[];
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

export interface FamilyViewParams {
  playerName: string;
  playerGender: string | null;
  playerAge: number;
  playerOccupation: string;
  gameYear: number;
  gameMonth: number;
}

export const buildFamilyMembers = (state: FamilyState, params: FamilyViewParams): FamilyMemberView[] => {
  const { playerName, playerGender, playerAge, playerOccupation, gameYear, gameMonth } = params;
  const origin = getOrigin(state);
  const affinityOf = (id: string, fallback: number) => state.affinity[id] ?? fallback;

  const members: FamilyMemberView[] = origin.members.map((def) => {
    const rawAge = playerAge + def.ageOffset;
    const deceased = rawAge >= def.lifespan;
    const age = deceased ? def.lifespan : Math.max(0, rawAge);
    return {
      id: def.id,
      name: def.name,
      gender: def.gender,
      kin: def.kin,
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

  members.push({
    id: PLAYER_MEMBER_ID,
    name: playerName,
    gender: playerGender === '男' || playerGender === '女' ? playerGender : null,
    relation: '你自己',
    generation: '平辈',
    age: playerAge,
    status: '在世',
    occupation: playerOccupation,
    affinity: 100,
    avatarBg: '#a68245',
    desc: `出身${origin.classLabel}之家的${origin.surname}家族${playerGender === '女' ? '女儿' : playerGender === '男' ? '儿子' : '子嗣'}。`,
    traits: ['当家人'],
    isPlayer: true,
  });

  if (state.spouse) {
    const s = state.spouse;
    members.push({
      id: SPOUSE_MEMBER_ID,
      name: s.name,
      gender: s.gender,
      relation: s.gender === '女' ? '妻子' : '丈夫',
      generation: '平辈',
      age: Math.max(0, gameYear - s.birthYear),
      status: '在世',
      occupation: s.occupation,
      affinity: affinityOf(SPOUSE_MEMBER_ID, SPOUSE_INITIAL_AFFINITY),
      avatarBg: '#b2586a',
      desc: `${s.marriedYear} 年 ${s.marriedMonth} 月与你缔结婚姻，携手经营${origin.surname}家族的新一代。`,
      traits: ['伴侣', '家庭支柱'],
      traitIds: s.traits,
    });
  }

  state.children.forEach((c) => {
    const rawAge = ageAt(c.birthYear, c.birthMonth, gameYear, gameMonth);
    const life = childLifespan(c);
    const dead = rawAge >= life;
    const age = dead ? life : rawAge;
    const kids = c.kids ?? [];
    members.push({
      id: c.id,
      name: c.name,
      gender: c.gender,
      relation: c.illegitimate ? (c.gender === '女' ? '私生女' : '私生子') : c.gender === '女' ? '女儿' : '儿子',
      generation: '子辈',
      age,
      status: dead ? '已故' : '在世',
      occupation: c.spouse ? `已成家 · 配偶 ${c.spouse.name}` : occupationFor(CHILD_STAGES, age),
      affinity: affinityOf(c.id, CHILD_INITIAL_AFFINITY),
      avatarBg: c.gender === '女' ? '#c06a8a' : '#4a7aa8',
      desc: `生于 ${c.birthYear} 年 ${c.birthMonth} 月，${origin.surname}家族的新一代。${c.spouse ? `${c.spouse.marriedYear} 年与 ${c.spouse.name} 成婚。` : ''}${kids.length ? `育有 ${kids.length} 个孩子。` : ''}`,
      traits: ['家族新生代'],
      isChild: true,
      parents: describeParents(c, playerName, playerGender),
      traitIds: c.traits,
    });
  });

  // 孙辈：子女成家后所生（第 52 题）
  state.children.forEach((c) => {
    (c.kids ?? []).forEach((k) => {
      const rawAge = ageAt(k.birthYear, k.birthMonth, gameYear, gameMonth);
      const life = childLifespan(k);
      const dead = rawAge >= life;
      const age = dead ? life : rawAge;
      members.push({
        id: k.id,
        name: k.name,
        gender: k.gender,
        kin: 'grandchild',
        relation: k.gender === '女' ? '孙女' : '孙子',
        generation: '孙辈',
        age,
        status: dead ? '已故' : '在世',
        occupation: occupationFor(CHILD_STAGES, age),
        affinity: affinityOf(k.id, CHILD_INITIAL_AFFINITY),
        avatarBg: k.gender === '女' ? '#c06a8a' : '#4a7aa8',
        desc: `生于 ${k.birthYear} 年 ${k.birthMonth} 月，${c.name} 的孩子。`,
        traits: ['家族新生代'],
        parents: `${c.name}（${c.gender === '女' ? '母' : '父'}）${k.otherParentName ? `、${k.otherParentName}（${k.otherParentGender === '女' ? '母' : '父'}）` : ''}`,
        traitIds: k.traits,
      });
    });
  });

  return members;
};

// ---------- 家人的寿命与成家（第 52 题，默认值） ----------
// 子女、孙辈、配偶都有寿命，到期显示已故（配偶去世则主角丧偶，可再婚）；
// 成年子女每月有概率成家、生育，孩子成为主角的孙辈；子女继承时连同其配偶、孩子一起继承。

export const KIN_LIFESPAN_MIN = 60;
export const KIN_LIFESPAN_MAX = 85;
/** 子女成家的年龄段与每月概率 */
export const CHILD_MARRY_MIN_AGE = 20;
export const CHILD_MARRY_MAX_AGE = 40;
export const CHILD_MARRY_CHANCE = 0.02;
/** 每对子女夫妻最多生几个孩子 */
export const MAX_GRANDCHILDREN_PER_CHILD = 4;

export const rollKinLifespan = (rng: () => number = Math.random) => KIN_LIFESPAN_MIN + Math.floor(rng() * (KIN_LIFESPAN_MAX - KIN_LIFESPAN_MIN + 1));

/** 按 id 稳定推算寿命（旧存档没有记录寿命时使用） */
const stableLifespan = (id: string) => {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return KIN_LIFESPAN_MIN + ((h >>> 0) % (KIN_LIFESPAN_MAX - KIN_LIFESPAN_MIN + 1));
};
export const childLifespan = (c: Child) => c.lifespan ?? stableLifespan(c.id);
export const spouseLifespan = (s: Spouse) => s.lifespan ?? stableLifespan(`spouse_${s.name}_${s.birthYear}`);

export interface FamilyLifeResult {
  state: FamilyState;
  /** 本月家族里发生的事（用于提示与日志） */
  notes: Array<{ title: string; desc: string }>;
}

/** 每月：配偶寿终则丧偶；成年子女成家、生育孙辈 */
export const monthlyFamilyLife = (state: FamilyState, year: number, month: number, rng: () => number = Math.random): FamilyLifeResult => {
  const notes: Array<{ title: string; desc: string }> = [];
  let next = state;
  const surname = getOrigin(state).surname;

  const s = state.spouse;
  if (s && year - s.birthYear >= spouseLifespan(s)) {
    next = {
      ...next,
      spouse: null,
      formerSpouses: [...getFormerSpouses(next), { ...s, divorcedYear: year, divorcedMonth: month, widowed: true }],
      events: [...next.events, { year, month, title: '丧偶', desc: `${s.name} 离开了人世，享年 ${year - s.birthYear} 岁。` }],
    };
    notes.push({ title: `${s.name} 离世`, desc: `配偶 ${s.name} 享年 ${year - s.birthYear} 岁。` });
  }

  let changed = false;
  const usedNames = new Set<string>(state.children.flatMap((c) => [c.name, ...(c.kids ?? []).map((k) => k.name)]));
  const children = next.children.map((c) => {
    const age = ageAt(c.birthYear, c.birthMonth, year, month);
    if (age >= childLifespan(c)) return c;
    let child = c;
    if (!child.spouse && age >= CHILD_MARRY_MIN_AGE && age < CHILD_MARRY_MAX_AGE && rng() < CHILD_MARRY_CHANCE) {
      const cand = generateSpouseCandidates(age, rng, 1, child.gender)[0];
      if (cand) {
        child = {
          ...child,
          spouse: { name: cand.name, gender: cand.gender, birthYear: year - cand.age, occupation: cand.occupation, marriedYear: year, marriedMonth: month, traits: cand.traits ?? [], lifespan: rollKinLifespan(rng) },
        };
        notes.push({ title: `${c.name} 成家`, desc: `${c.name} 与 ${cand.name}（${cand.occupation}）结为夫妻。` });
      }
    }
    const sp = child.spouse;
    const kids = child.kids ?? [];
    if (
      sp &&
      kids.length < MAX_GRANDCHILDREN_PER_CHILD &&
      age <= fertileMaxAge(child.gender, child.traits) &&
      year - sp.birthYear <= fertileMaxAge(sp.gender, sp.traits) &&
      year - sp.birthYear < spouseLifespan(sp) &&
      rng() < BIRTH_CHANCE * fertilityMultiplier(child.traits, sp.traits)
    ) {
      const twins = rng() < twinChanceFor(TWIN_CHANCE, child.traits, sp.traits) && kids.length + 2 <= MAX_GRANDCHILDREN_PER_CHILD;
      const born: Child[] = [];
      for (let k = 0; k < (twins ? 2 : 1); k++) {
        const gender: Gender = rng() < 0.5 ? '男' : '女';
        const name = randomFullName(gender, surname, rng, usedNames);
        usedNames.add(name);
        born.push({
          id: `gc_${child.id}_${year}_${month}_${kids.length + k + 1}`,
          name,
          gender,
          birthYear: year,
          birthMonth: month,
          otherParentName: sp.name,
          otherParentGender: sp.gender,
          traits: inheritTraits(child.traits ?? [], sp.traits ?? [], rng),
          lifespan: rollKinLifespan(rng),
        });
      }
      child = { ...child, kids: [...kids, ...born] };
      notes.push({ title: `${c.name} 喜得${twins ? '双胞胎' : born[0].gender === '女' ? '千金' : '麟儿'}`, desc: `${born.map((b) => b.name).join('、')} 降生，是你的${born.map((b) => (b.gender === '女' ? '孙女' : '孙子')).join('、')}。` });
    }
    if (child !== c) changed = true;
    return child;
  });
  if (changed) {
    next = {
      ...next,
      children,
      events: [...next.events, ...notes.filter((n) => !n.title.includes('离世')).map((n) => ({ year, month, title: n.title, desc: n.desc }))],
    };
  }
  return { state: next, notes };
};

// ---------- 结婚 ----------

/** 兼容旧引用：名字池已统一到 names.ts */
export const MALE_NAMES = MALE_GIVEN_NAMES;
export const FEMALE_NAMES = FEMALE_GIVEN_NAMES;
const SPOUSE_SURNAMES = ['彼得罗夫', '卡里莫夫', '霍夫曼', '杜邦', '罗西', '诺维科夫', '施密特', '拉希多夫'];
const SPOUSE_OCCUPATIONS = ['学堂教师', '裁缝铺店主', '医院护理员', '商行账房', '邮局书记员', '钟表匠', '画师', '药剂师', '纺织厂工头', '报社编辑'];

export const pick = <T,>(list: T[], rng: () => number) => list[Math.floor(rng() * list.length)];

export interface SpouseCandidate {
  name: string;
  gender: Gender;
  age: number;
  occupation: string;
  traits?: string[];
}

/**
 * 生成结婚（或情人）候选人。
 * 传入主角性别时只生成异性（第 48 题：同性不可结婚）；情人候选人不传，男女都可能出现。
 */
export const generateSpouseCandidates = (
  playerAge: number,
  rng: () => number = Math.random,
  count = SPOUSE_CANDIDATE_COUNT,
  oppositeOf: Gender | null = null,
): SpouseCandidate[] => {
  const candidates: SpouseCandidate[] = [];
  const usedNames = new Set<string>();
  // 名字组合共 (10+10)×8 = 160 种；限制尝试次数，防止极端随机数下死循环
  for (let attempt = 0; candidates.length < count && attempt < count * 20; attempt++) {
    const gender: Gender = oppositeOf ? (oppositeOf === '男' ? '女' : '男') : rng() < 0.5 ? '男' : '女';
    const name = randomFullName(gender, pick(SPOUSE_SURNAMES, rng), rng, usedNames);
    if (usedNames.has(name)) continue;
    usedNames.add(name);
    const age = Math.max(MARRIAGE_MIN_AGE, playerAge + Math.floor(rng() * 11) - 5);
    candidates.push({ name, gender, age, occupation: pick(SPOUSE_OCCUPATIONS, rng), traits: randomTraits(rng) });
  }
  return candidates;
};

export const marry = (state: FamilyState, candidate: SpouseCandidate, year: number, month: number): FamilyState => ({
  ...state,
  spouse: {
    lifespan: candidate.age + 30 + Math.floor(Math.random() * 30) > KIN_LIFESPAN_MAX ? KIN_LIFESPAN_MAX : Math.max(KIN_LIFESPAN_MIN, candidate.age + 30 + Math.floor(Math.random() * 30)),
    name: candidate.name,
    gender: candidate.gender,
    birthYear: year - candidate.age,
    occupation: candidate.occupation,
    marriedYear: year,
    marriedMonth: month,
    traits: candidate.traits ?? [],
  },
  events: [...state.events, { year, month, title: '缔结婚姻', desc: `你与 ${candidate.name} 在帝国民政署登记结婚，${getOrigin(state).surname}家族迎来新成员。` }],
});

// ---------- 离婚 ----------
// 子嗣留在家族；前配偶移出族谱并记入前任配偶列表，其好感度与互动记录清除（下一任配偶重新计算）

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

export interface BirthResult {
  state: FamilyState;
  /** 本次出生的第一个孩子（没有出生为 null，兼容旧调用） */
  child: Child | null;
  /** 本次出生的所有孩子（双胞胎时为 2 个） */
  children: Child[];
}

interface OtherParent {
  name: string;
  gender: Gender;
  traits?: string[];
}

/** 生下 count 个孩子（同年同月，双胞胎时 count = 2） */
const giveBirth = (
  state: FamilyState,
  year: number,
  month: number,
  count: number,
  rng: () => number,
  other: OtherParent | null,
  playerTraits: string[] = [],
  illegitimate = false,
): BirthResult => {
  const surname = getOrigin(state).surname;
  const usedNames = new Set(state.children.map((c) => c.name));
  const born: Child[] = [];
  for (let k = 0; k < count; k++) {
    const gender: Gender = rng() < 0.5 ? '男' : '女';
    const index = state.children.length + born.length + 1;
    const name = randomFullName(gender, surname, rng, usedNames);
    usedNames.add(name);
    born.push({
      id: `child_${year}_${month}_${index}`,
      name,
      gender,
      birthYear: year,
      birthMonth: month,
      ...(other ? { otherParentName: other.name, otherParentGender: other.gender } : {}),
      traits: inheritTraits(playerTraits, other?.traits ?? [], rng),
      ...(illegitimate ? { illegitimate: true } : {}),
      lifespan: rollKinLifespan(rng),
    });
  }
  const title = illegitimate ? '私生子女降生' : count === 2 ? '喜得双胞胎' : `喜得${born[0].gender === '女' ? '千金' : '麟儿'}`;
  return {
    child: born[0],
    children: born,
    state: {
      ...state,
      children: [...state.children, ...born],
      events: illegitimate
        ? state.events
        : [...state.events, { year, month, title, desc: `${born.map((c) => c.name).join('、')} 降生，${surname}家族又添${count === 2 ? '两' : '一'}员。` }],
    },
  };
};

export const tryHaveChild = (
  state: FamilyState,
  playerAge: number,
  year: number,
  month: number,
  rng: () => number = Math.random,
  playerTraits: string[] = [],
  playerGender: string | null = null,
): BirthResult => {
  const none = { state, child: null, children: [] };
  const s = state.spouse;
  if (!s) return none;
  // 第 48 题：同性伴侣不生育（旧存档中已有的同性婚姻保留，但不再生育）
  if (playerGender && s.gender === playerGender) return none;
  const spouseAge = year - s.birthYear;
  // 第 50 题：过了生育年龄（按性别与「精力旺盛」「富养」特质）不再生育
  if (playerAge > fertileMaxAge(playerGender, playerTraits) || spouseAge > fertileMaxAge(s.gender, s.traits) || state.children.length >= MAX_CHILDREN) return none;
  if (rng() >= BIRTH_CHANCE * fertilityMultiplier(playerTraits, s.traits)) return none;
  const twins = rng() < twinChanceFor(TWIN_CHANCE, playerTraits, s.traits) && state.children.length + 2 <= MAX_CHILDREN;
  return giveBirth(state, year, month, twins ? 2 : 1, rng, s, playerTraits);
};

/** 开发测试工具：立即新增子嗣（忽略婚姻、年龄与人数上限） */
export const addChildForTesting = (
  state: FamilyState,
  year: number,
  month: number,
  twins = false,
  rng: () => number = Math.random,
  playerTraits: string[] = [],
): BirthResult => giveBirth(state, year, month, twins ? 2 : 1, rng, state.spouse, playerTraits);

// ---------- 贵族情人（undefined.md 第 28 题） ----------

export const canTakeLover = (classId: string, married: boolean, age: number) =>
  (classId === 'noble' || classId === 'royal') && married && age >= MARRIAGE_MIN_AGE;

export const takeLover = (state: FamilyState, c: SpouseCandidate, year: number, month: number): FamilyState => ({
  ...state,
  lover: { name: c.name, gender: c.gender, birthYear: year - c.age, occupation: c.occupation, traits: c.traits ?? [], sinceYear: year, sinceMonth: month },
});

export const endLover = (state: FamilyState): FamilyState => ({ ...state, lover: null });

/** 每月：与情人有 3% 概率生下私生子女（受不孕/易孕影响，与婚生子女共享 6 人上限） */
export const tryIllegitimateChild = (
  state: FamilyState,
  playerAge: number,
  year: number,
  month: number,
  rng: () => number = Math.random,
  playerTraits: string[] = [],
  playerGender: string | null = null,
): BirthResult => {
  const none = { state, child: null, children: [] };
  const l = state.lover;
  // 第 48 题：贵族、皇族可以有同性情人，但同性情人不会生下私生子女
  if (l && playerGender && l.gender === playerGender) return none;
  if (!l || playerAge > fertileMaxAge(playerGender, playerTraits) || year - l.birthYear > fertileMaxAge(l.gender, l.traits) || state.children.length >= MAX_CHILDREN) return none;
  if (rng() >= ILLEGITIMATE_CHANCE * fertilityMultiplier(playerTraits, l.traits)) return none;
  return giveBirth(state, year, month, 1, rng, l, playerTraits, true);
};

// ---------- 传家宝 ----------

export const getHeirlooms = (state: FamilyState): OwnedHeirloom[] =>
  state.heirlooms ?? (getOrigin(state).isValentine ? VALENTINE_DEFAULT_HEIRLOOMS : []);

/** 获得传家宝（同一件不会重复获得） */
export const addHeirloom = (state: FamilyState, item: OwnedHeirloom): FamilyState => {
  const current = getHeirlooms(state);
  if (current.some((h) => h.id === item.id)) return state;
  return { ...state, heirlooms: [...current, item] };
};

// ---------- 子嗣取名 ----------

export const renameChild = (state: FamilyState, childId: string, name: string): FamilyState => ({
  ...state,
  children: state.children.map((c) => (c.id === childId ? { ...c, name } : c)),
});

// ---------- 阶层提升 ----------

export const promoteFamily = (state: FamilyState, classId: string, classLabel: string, year: number, month: number, reason: string): FamilyState => {
  const origin = getOrigin(state);
  return {
    ...state,
    baseClassId: state.baseClassId ?? origin.classId,
    demotionStreak: 0,
    origin: { ...origin, classId, classLabel },
    events: [...state.events, { year, month, title: `跻身${classLabel}`, desc: `${origin.surname}家族由${origin.classLabel}晋升为${classLabel}。${reason}` }],
  };
};

/** 家道中落：降回较低的阶层（第 46 题） */
export const demoteFamily = (state: FamilyState, classId: string, classLabel: string, year: number, month: number): FamilyState => {
  const origin = getOrigin(state);
  return {
    ...state,
    demotionStreak: 0,
    origin: { ...origin, classId, classLabel },
    events: [...state.events, { year, month, title: '家道中落', desc: `${origin.surname}家族资产长期缩水，由${origin.classLabel}跌回${classLabel}。` }],
  };
};

// ---------- 好感度衰减与分家 ----------

const SPLITTABLE_KINS: Kin[] = ['sibling', 'uncle', 'granduncle', 'cousin', 'nephew', 'other'];

export interface DriftResult {
  state: FamilyState;
  /** 本月分家出去的支系 */
  splits: SplitBranch[];
}

/**
 * 每月结算（在推进月份时调用，传入推进前的年月）：
 * - 本月没有互动过的成年在世家人好感度 -1
 * - 好感度低于阈值的月数累计；旁系（兄弟姐妹、叔伯、堂亲、侄辈）或成年子嗣连续 12 个月不满则分家
 */
export const monthlyFamilyDrift = (state: FamilyState, members: FamilyMemberView[], year: number, month: number): DriftResult => {
  const key = yearMonthKey(year, month);
  const affinity = { ...state.affinity };
  const discontent = { ...(state.discontent ?? {}) };
  const splitIds = new Set<string>();
  const splits: SplitBranch[] = [];

  for (const m of members) {
    if (m.isPlayer || m.status === '已故' || m.age < 18) continue;
    let value = m.affinity;
    if (state.lastInteraction[m.id] !== key) {
      value = Math.max(0, value - AFFINITY_DECAY_PER_MONTH);
      affinity[m.id] = value;
    }
    discontent[m.id] = value < DISCONTENT_THRESHOLD ? (discontent[m.id] ?? 0) + 1 : 0;
    const splittable = m.isChild || (m.kin !== undefined && SPLITTABLE_KINS.includes(m.kin));
    if (splittable && discontent[m.id] >= SPLIT_AFTER_MONTHS) {
      splitIds.add(m.id);
      splits.push({ name: m.name, relation: m.relation, year, month });
    }
  }

  if (splits.length === 0) return { state: { ...state, affinity, discontent }, splits };
  const origin = getOrigin(state);
  splitIds.forEach((id) => {
    delete affinity[id];
    delete discontent[id];
  });
  return {
    splits,
    state: {
      ...state,
      affinity,
      discontent,
      origin: { ...origin, members: origin.members.filter((d) => !splitIds.has(d.id)) },
      children: state.children.filter((c) => !splitIds.has(c.id)),
      splitBranches: [...(state.splitBranches ?? []), ...splits],
      events: [
        ...state.events,
        ...splits.map((b) => ({ year, month, title: '分家', desc: `${b.relation} ${b.name} 长期对当家人不满，携一支族人分家出走。` })),
      ],
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
  bonus = 0,
  /** 本次互动的基础好感增加；默认按互动类型（送礼物时按礼物品质与喜好计算） */
  gain: number = AFFINITY_GAIN[kind],
): FamilyState => ({
  ...state,
  affinity: { ...state.affinity, [member.id]: Math.min(100, member.affinity + gain + bonus) },
  lastInteraction: { ...state.lastInteraction, [member.id]: yearMonthKey(year, month) },
});

// ---------- 传承：主角去世后由子嗣或兄弟姐妹继承 ----------

export interface HeirCandidate {
  id: string;
  name: string;
  gender: Gender;
  age: number;
  relation: string;
  /** 子嗣、孙辈（无在世子嗣时）或兄弟姐妹继承 */
  kind: 'child' | 'grandchild' | 'sibling';
  traits?: string[];
}

/**
 * 可继承的人选：所有在世子嗣（不限年龄），以及年满 HEIR_MIN_AGE 岁的兄弟姐妹；
 * 没有在世子嗣时，在世的孙辈也可以继承（第 52 题）。
 */
export const listHeirs = (members: FamilyMemberView[]): HeirCandidate[] => {
  const alive = members.filter((m) => !m.isPlayer && m.status !== '已故' && m.gender);
  const children = alive.filter((m) => m.isChild);
  const siblings = alive.filter((m) => m.kin === 'sibling' && m.age >= HEIR_MIN_AGE);
  const grandchildren = children.length === 0 ? alive.filter((m) => m.kin === 'grandchild') : [];
  return [...children, ...grandchildren, ...siblings].map((m) => ({
    id: m.id,
    name: m.name,
    gender: m.gender as Gender,
    age: m.age,
    relation: m.relation,
    kind: m.isChild ? 'child' : m.kin === 'grandchild' ? 'grandchild' : 'sibling',
    traits: m.traitIds,
  }));
};

export interface Predecessor {
  name: string;
  gender: Gender;
  age: number;
  occupation: string;
}

/** 由子嗣继承时，原有成员的亲属类型如何变化（辈分整体上移一代） */
const CHILD_SUCCESSION_KIN: Record<Kin, Kin> = {
  ancestor: 'ancestor',
  grandparent: 'ancestor',
  granduncle: 'ancestor',
  parent: 'grandparent',
  uncle: 'granduncle',
  sibling: 'uncle',
  cousin: 'other',
  nephew: 'cousin',
  grandchild: 'nephew',
  other: 'other',
};

const childToDef = (c: Child, ageNow: number, heirAge: number, kin: Kin): FamilyMemberDef => {
  const ageOffset = ageNow - heirAge;
  return {
    id: c.id,
    name: c.name,
    gender: c.gender,
    kin,
    relation: relationFor(kin, c.gender, ageOffset),
    generation: KIN_GENERATION[kin],
    ageOffset,
    lifespan: childLifespan(c),
    occupationByAge: CHILD_STAGES,
    defaultAffinity: CHILD_INITIAL_AFFINITY,
    avatarBg: c.gender === '女' ? '#c06a8a' : '#4a7aa8',
    desc: `生于 ${c.birthYear} 年 ${c.birthMonth} 月。`,
    traits: ['家族成员'],
  };
};

/**
 * 以继承人为新主角重排家族。资产等不在家族状态中，由调用方保留。
 * 返回新的家族状态，以及继承人的姓名、性别、年龄。
 */
export const succeed = (
  state: FamilyState,
  members: FamilyMemberView[],
  heirId: string,
  predecessor: Predecessor,
  year: number,
  month: number,
): { state: FamilyState; heir: HeirCandidate } => {
  const heir = listHeirs(members).find((h) => h.id === heirId);
  if (!heir) throw new Error('继承人不符合条件');
  const origin = getOrigin(state);
  const H = heir.age;
  const shift = predecessor.age - H; // 原成员相对新主角的年龄差 = 原年龄差 + shift
  const ageOf = (c: Child) => ageAt(c.birthYear, c.birthMonth, year, month);

  // 去世的前任主角：寿命 = 去世年龄，因此始终显示为已故
  const predecessorDef = (kin: Kin): FamilyMemberDef => {
    const ageOffset = predecessor.age - H;
    return {
      id: `late_${year}_${month}`,
      name: predecessor.name,
      gender: predecessor.gender,
      kin,
      relation: relationFor(kin, predecessor.gender, ageOffset),
      generation: KIN_GENERATION[kin],
      ageOffset,
      lifespan: predecessor.age,
      occupationByAge: [[0, predecessor.occupation]],
      defaultAffinity: 100,
      avatarBg: '#525a66',
      desc: `上一代当家人，${year} 年 ${month} 月辞世，享年 ${predecessor.age} 岁。`,
      traits: ['先代当家'],
    };
  };

  let members2: FamilyMemberDef[];
  if (heir.kind === 'child') {
    const shifted = origin.members.map((d) => {
      const kin = CHILD_SUCCESSION_KIN[d.kin];
      const ageOffset = d.ageOffset + shift;
      const relation =
        d.kin === 'cousin' ? (d.gender === '女' ? '堂姑' : '堂叔') : d.kin === 'other' ? d.relation : undefined;
      return withKin(d, kin, ageOffset, relation);
    });
    const spouse = state.spouse;
    const heirChild = state.children.find((c) => c.id === heir.id);
    const spouseDefs: FamilyMemberDef[] = spouse
      ? [
          {
            id: SPOUSE_MEMBER_ID + `_${year}`,
            name: spouse.name,
            gender: spouse.gender,
            kin: 'parent',
            relation:
              heirChild?.otherParentName === spouse.name
                ? relationFor('parent', spouse.gender, 1)
                : spouse.gender === '女' ? '继母' : '继父',
            generation: '父辈',
            ageOffset: year - spouse.birthYear - H,
            lifespan: DEFAULT_LIFESPAN + 3,
            occupationByAge: [[0, spouse.occupation]],
            defaultAffinity: SPOUSE_INITIAL_AFFINITY,
            avatarBg: '#b2586a',
            desc: `${predecessor.name} 的配偶。`,
            traits: ['长辈'],
          },
        ]
      : [];
    const otherChildren = state.children.filter((c) => c.id !== heir.id);
    const siblings = otherChildren.map((c) => childToDef(c, ageOf(c), H, 'sibling'));
    const nephews = otherChildren.flatMap((c) => (c.kids ?? []).map((k) => childToDef(k, ageOf(k), H, 'nephew')));
    members2 = [...shifted, predecessorDef('parent'), ...spouseDefs, ...siblings, ...nephews];
  } else if (heir.kind === 'grandchild') {
    // 孙辈继承：已故的子女成为父母；其他子女成为叔伯姑姑，他们的孩子成为堂亲
    const parentChild = state.children.find((c) => (c.kids ?? []).some((k) => k.id === heir.id));
    const twice = (k: Kin) => CHILD_SUCCESSION_KIN[CHILD_SUCCESSION_KIN[k]];
    const shifted = origin.members.map((d) => withKin(d, twice(d.kin), d.ageOffset + shift, twice(d.kin) === 'other' ? d.relation : undefined));
    const spouseDef = (sp: Spouse, kin: Kin, relation: string, desc: string): FamilyMemberDef => ({
      id: `sp_${sp.name}_${sp.birthYear}`,
      name: sp.name,
      gender: sp.gender,
      kin,
      relation,
      generation: KIN_GENERATION[kin],
      ageOffset: year - sp.birthYear - H,
      lifespan: spouseLifespan(sp),
      occupationByAge: [[0, sp.occupation]],
      defaultAffinity: SPOUSE_INITIAL_AFFINITY,
      avatarBg: '#b2586a',
      desc,
      traits: ['长辈'],
    });
    const grandSpouse = state.spouse ? [spouseDef(state.spouse, 'grandparent', state.spouse.gender === '女' ? '祖母' : '祖父', `${predecessor.name} 的配偶。`)] : [];
    const parents = parentChild
      ? [
          childToDef(parentChild, ageOf(parentChild), H, 'parent'),
          ...(parentChild.spouse ? [spouseDef(parentChild.spouse, 'parent', parentChild.spouse.gender === '女' ? '母亲' : '父亲', `${parentChild.name} 的配偶。`)] : []),
        ]
      : [];
    const others = state.children.filter((c) => c.id !== parentChild?.id);
    const uncles = others.map((c) => childToDef(c, ageOf(c), H, 'uncle'));
    const cousins = others.flatMap((c) => (c.kids ?? []).map((k) => childToDef(k, ageOf(k), H, 'cousin')));
    const siblings = (parentChild?.kids ?? []).filter((k) => k.id !== heir.id).map((k) => childToDef(k, ageOf(k), H, 'sibling'));
    members2 = [...shifted, predecessorDef('grandparent'), ...grandSpouse, ...parents, ...uncles, ...cousins, ...siblings];
  } else {
    // 兄弟姐妹继承：辈分不变，只重算称谓；前任主角的子嗣成为侄子/侄女；前任配偶不再计入族谱
    const others = origin.members
      .filter((d) => d.id !== heir.id)
      .map((d) => withKin(d, d.kin, d.ageOffset + shift, d.kin === 'other' ? d.relation : undefined));
    const nephews = state.children.map((c) => childToDef(c, ageOf(c), H, 'nephew'));
    const grandNephews = state.children.flatMap((c) =>
      (c.kids ?? []).map((k) => ({ ...childToDef(k, ageOf(k), H, 'other'), generation: '孙辈', relation: k.gender === '女' ? '侄孙女' : '侄孙' })),
    );
    members2 = [...others, predecessorDef('sibling'), ...nephews, ...grandNephews];
  }

  // 子女继承：继承人自己的配偶与孩子随之成为新当家人的配偶与子嗣
  const heirChild = heir.kind === 'child' ? state.children.find((c) => c.id === heir.id) : undefined;
  const heirSpouse = heirChild?.spouse && year - heirChild.spouse.birthYear < spouseLifespan(heirChild.spouse) ? heirChild.spouse : null;
  const heirKids = (heirChild?.kids ?? []).map((k) => ({ ...k, otherParentName: heirChild?.spouse?.name ?? k.otherParentName, otherParentGender: heirChild?.spouse?.gender ?? k.otherParentGender }));
  return {
    heir,
    state: {
      playerIllegitimate: heir.kind === 'child' && !!heirChild?.illegitimate,
      baseClassId: state.baseClassId,
      affinity: {},
      lastInteraction: {},
      spouse: heirSpouse,
      formerSpouses: [],
      children: heirKids,
      lover: null,
      discontent: {},
      splitBranches: state.splitBranches ?? [],
      heirlooms: getHeirlooms(state),
      origin: { ...origin, members: members2 },
      events: [
        ...state.events,
        { year, month, title: '传承家业', desc: `${predecessor.name} 辞世，享年 ${predecessor.age} 岁。${heir.relation} ${heir.name} 继承家业，成为新一代当家人。` },
      ],
    },
  };
};

// ---------- 大事记 ----------

export const ANCESTRAL_CHRONICLES: FamilyEvent[] = [
  { year: 1860, month: 1, title: '皇家工匠勋章', desc: '祖父亚历山大主持大铁桥项目，获得皇室颁发的首席工匠金质勋章。' },
  { year: 1888, month: 1, title: '主导首都给排水改造', desc: '维克多主导首都给排水机械化改建工程，家族社会威望大幅上升。' },
  { year: 1898, month: 1, title: '创立瓦伦丁科技基金', desc: '家族设立专项科技助学基金，资助十余名贫困理工学子。' },
];

export const buildChronicles = (state: FamilyState, gameYear: number, gameMonth: number): FamilyEvent[] =>
  [...(getOrigin(state).isValentine ? ANCESTRAL_CHRONICLES : []), ...state.events]
    .filter((e) => e.year < gameYear || (e.year === gameYear && e.month <= gameMonth))
    .sort((a, b) => a.year - b.year || a.month - b.month);
