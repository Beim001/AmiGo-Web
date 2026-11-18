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
import { inheritAntibodies } from './disease';
import { Appearance, randomAppearance, inheritAppearance, rollBeauty, applyBeauty, stableAppearance, seededRng } from './appearance';
import { OwnedHeirloom, VALENTINE_DEFAULT_HEIRLOOMS } from './heirlooms';
import { chainOfTitle, chainLevel, levelOfLabel, kinOfChain, relationTitle, generationLabel, childWord, parentWord, spouseWord, siblingWord, joinChain, isLineal } from './kinship';

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
  /** 抗体（第 53 题） */
  antibodies?: string[];
  /** 外貌（第 61 题） */
  appearance?: Appearance;
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
  /** 抗体（第 53 题）：出生时按概率遗传父母的抗体 */
  antibodies?: string[];
  /** 出生时的野心值 0–50（第 59 题）；旧存档缺失时按 id 稳定推算 */
  ambition?: number;
  /** 领养的孩子（第 60 题） */
  adopted?: boolean;
  /** 外貌（第 61 题）：出生时遗传父母 */
  appearance?: Appearance;
  /** 包办婚姻（第 73 题）：pending 磨合中，content 婚后和睦，estranged 受枕边风影响与家族生分 */
  arranged?: ArrangedStatus;
}

export type ArrangedStatus = 'pending' | 'content' | 'estranged';

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
  /** 外貌（第 61 题）：传承时沿用前任主角、配偶、子女的外貌；缺失时按 id 稳定生成 */
  appearance?: Appearance;
  /** 机制特质（第 62 题）：传承时沿用真实特质；缺失时按 id 稳定生成，用于向孙辈遗传 */
  traitIds?: string[];
  kin: Kin;
  /**
   * 相对当家人的关系链（「爸爸的哥哥的儿子」），称谓与辈分据此用 relationship.js 计算（见 kinship.ts）。
   * 旧存档没有此字段，按 relation 反推；继母等非血缘称谓反推不出时沿用 relation 与 generation。
   */
  chain?: string;
  /** 称谓；有关系链时只作为 relationship.js 算不出时的备用文字 */
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
  /** 子嗣 id → 野心高且对当家人不满的连续月数（第 59 题） */
  coupStreak?: Record<string, number>;
  /** 最近一次「同房」的月份（年 × 12 + 月），该月生育概率提高（第 60 题） */
  intimacyMonth?: number;
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
  /** 辈分层级：父辈 1、平辈 0、子辈 −1、孙辈 −2……（族谱按此排序与折叠） */
  level: number;
  /** 当家人的第几代后代（子女 1、孙辈 2……）；不是后代时缺省 */
  depth?: number;
  /** 后代是否已成家 */
  married?: boolean;
  /** 后代的包办婚姻状态 */
  arranged?: ArrangedStatus;
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
  /** 抗体（第 53 题）；只有子嗣、孙辈记录 */
  antibodies?: string[];
  /** 野心值（第 59 题）；只有子嗣有 */
  ambition?: number;
  /** 外貌（第 61 题）；配偶、子嗣、孙辈有 */
  appearance?: Appearance;
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

/** 族谱成员相对当家人的关系链：有记录用记录，旧存档按称谓反推；反推不出（继母等）返回 null */
export const chainOfDef = (def: FamilyMemberDef): string | null => def.chain ?? chainOfTitle(def.relation);

/** 在后代树中按 id 查找，返回从子女到目标的路径；找不到返回 null */
export const findDescendantPath = (children: Child[], id: string): Child[] | null => {
  for (const c of children) {
    if (c.id === id) return [c];
    const sub = findDescendantPath(c.kids ?? [], id);
    if (sub) return [c, ...sub];
  }
  return null;
};
export const findDescendant = (state: FamilyState, id: string): Child | undefined => findDescendantPath(state.children, id)?.at(-1);

export const buildFamilyMembers = (state: FamilyState, params: FamilyViewParams): FamilyMemberView[] => {
  const { playerName, playerGender, playerAge, playerOccupation, gameYear, gameMonth } = params;
  const origin = getOrigin(state);
  const affinityOf = (id: string, fallback: number) => state.affinity[id] ?? fallback;
  const pg = playerGender === '男' || playerGender === '女' ? playerGender : null;

  const members: FamilyMemberView[] = origin.members.map((def) => {
    const rawAge = playerAge + def.ageOffset;
    const deceased = rawAge >= def.lifespan;
    const age = deceased ? def.lifespan : Math.max(0, rawAge);
    const chain = chainOfDef(def);
    const level = chain !== null ? chainLevel(chain) : levelOfLabel(def.generation);
    return {
      id: def.id,
      name: def.name,
      gender: def.gender,
      kin: chain !== null ? kinOfChain(chain) : def.kin,
      relation: chain !== null ? relationTitle(chain, pg, def.ageOffset > 0, def.relation) : def.relation,
      generation: chain !== null ? generationLabel(level) : def.generation,
      level,
      age,
      status: deceased ? '已故' : def.traveling ? '远游' : '在世',
      appearance: def.appearance ?? stableAppearance(`${def.id}_${def.name}`, def.gender),
      occupation: occupationFor(def.occupationByAge, age),
      affinity: affinityOf(def.id, def.defaultAffinity),
      avatarBg: def.avatarBg,
      desc: def.desc,
      traits: def.traits,
      traitIds: defTraitIds(def),
    };
  });

  members.push({
    id: PLAYER_MEMBER_ID,
    name: playerName,
    gender: pg,
    relation: '你自己',
    generation: '平辈',
    level: 0,
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
      level: 0,
      age: Math.max(0, gameYear - s.birthYear),
      status: '在世',
      occupation: s.occupation,
      affinity: affinityOf(SPOUSE_MEMBER_ID, SPOUSE_INITIAL_AFFINITY),
      avatarBg: '#b2586a',
      desc: `${s.marriedYear} 年 ${s.marriedMonth} 月与你缔结婚姻，携手经营${origin.surname}家族的新一代。`,
      traits: ['伴侣', '家庭支柱'],
      traitIds: s.traits,
      appearance: s.appearance ?? stableAppearance(`spouse_${s.name}_${s.birthYear}`, s.gender),
    });
  }

  // 后代：逐代列出（子女、孙辈、曾孙辈……），称谓按关系链计算（第 52 题起延续到任意代）
  let generationNow: Array<{ c: Child; chain: string; parent: Child | null }> = state.children.map((c) => ({ c, chain: childWord(c.gender), parent: null }));
  for (let depth = 1; generationNow.length > 0; depth++) {
    const next: typeof generationNow = [];
    for (const { c, chain, parent } of generationNow) {
      const rawAge = ageAt(c.birthYear, c.birthMonth, gameYear, gameMonth);
      const life = childLifespan(c);
      const dead = rawAge >= life;
      const age = dead ? life : rawAge;
      const kids = c.kids ?? [];
      const direct = depth === 1;
      members.push({
        id: c.id,
        name: c.name,
        gender: c.gender,
        ...(direct ? {} : { kin: 'grandchild' as Kin }),
        relation: direct
          ? c.adopted ? (c.gender === '女' ? '养女' : '养子') : c.illegitimate ? (c.gender === '女' ? '私生女' : '私生子') : c.gender === '女' ? '女儿' : '儿子'
          : relationTitle(chain, pg, false, generationLabel(-depth)),
        generation: generationLabel(-depth),
        level: -depth,
        depth,
        age,
        status: dead ? '已故' : '在世',
        occupation: c.spouse ? `已成家 · 配偶 ${c.spouse.name}` : occupationFor(CHILD_STAGES, age),
        married: !!c.spouse,
        ...(c.arranged ? { arranged: c.arranged } : {}),
        affinity: affinityOf(c.id, CHILD_INITIAL_AFFINITY),
        avatarBg: c.gender === '女' ? '#c06a8a' : '#4a7aa8',
        desc: direct
          ? `生于 ${c.birthYear} 年 ${c.birthMonth} 月，${origin.surname}家族的新一代。${c.spouse ? `${c.spouse.marriedYear} 年与 ${c.spouse.name} 成婚。` : ''}${kids.length ? `育有 ${kids.length} 个孩子。` : ''}`
          : `生于 ${c.birthYear} 年 ${c.birthMonth} 月，${parent!.name} 的孩子。${c.spouse ? `${c.spouse.marriedYear} 年与 ${c.spouse.name} 成婚。` : ''}${kids.length ? `育有 ${kids.length} 个孩子。` : ''}`,
        traits: ['家族新生代'],
        ...(direct ? { isChild: true } : {}),
        parents: direct
          ? describeParents(c, playerName, playerGender)
          : `${parent!.name}（${parent!.gender === '女' ? '母' : '父'}）${c.otherParentName ? `、${c.otherParentName}（${c.otherParentGender === '女' ? '母' : '父'}）` : ''}`,
        traitIds: c.traits,
        antibodies: c.antibodies,
        ...(direct ? { ambition: childAmbition(c, gameYear, gameMonth) } : {}),
        appearance: c.appearance ?? stableAppearance(c.id, c.gender),
      });
      kids.forEach((k) => next.push({ c: k, chain: joinChain(chain, childWord(k.gender)), parent: c }));
    }
    generationNow = next;
  }

  return members;
};

// ---------- 原有族谱成员的特质（第 62 题） ----------

/** 族谱成员的机制特质：有记录用记录，否则按 id 稳定生成 */
export const defTraitIds = (def: FamilyMemberDef): string[] => def.traitIds ?? randomTraits(seededRng(`traits_${def.id}_${def.name}`));

// ---------- 家人的寿命与成家（第 52 题，默认值；用户 2026-11-18 决定延续到任意代） ----------
// 子女、孙辈及以后各代、配偶都有寿命，到期显示已故（配偶去世则主角丧偶，可再婚）；
// 每一代成年后代每月有概率成家、生育，家族一直延续下去；子女继承时连同其配偶、后代一起继承。

export const KIN_LIFESPAN_MIN = 60;
export const KIN_LIFESPAN_MAX = 85;
/** 后代（子女、孙辈及以后各代）成家的年龄段（含下限、不含上限）与每月概率 */
export const CHILD_MARRY_MIN_AGE = 16;
export const CHILD_MARRY_MAX_AGE = 36;
export const CHILD_MARRY_CHANCE = 0.03;
/** 每对后代夫妻最多生几个孩子 */
export const MAX_GRANDCHILDREN_PER_CHILD = 4;
/** 只有子女、孙辈（第 1、2 代后代）的成家与生育写入月度提示与家族大事记，更远的后代只在族谱中体现，避免刷屏与存档膨胀 */
export const FAMILY_NOTE_MAX_DEPTH = 2;

export const rollKinLifespan = (rng: () => number = Math.random) => KIN_LIFESPAN_MIN + Math.floor(rng() * (KIN_LIFESPAN_MAX - KIN_LIFESPAN_MIN + 1));

const hashId = (id: string) => {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
};
/** 按 id 稳定推算寿命（旧存档没有记录寿命时使用） */
const stableLifespan = (id: string) => KIN_LIFESPAN_MIN + (hashId(id) % (KIN_LIFESPAN_MAX - KIN_LIFESPAN_MIN + 1));
export const childLifespan = (c: Child) => c.lifespan ?? stableLifespan(c.id);
export const spouseLifespan = (s: Spouse) => s.lifespan ?? stableLifespan(`spouse_${s.name}_${s.birthYear}`);

/** 后代树中所有人（含已故） */
export const allDescendants = (children: Child[]): Child[] => children.flatMap((c) => [c, ...allDescendants(c.kids ?? [])]);

/** 修改后代树中指定的人；没有变化时返回原数组 */
const updateDescendant = (children: Child[], id: string, fn: (c: Child) => Child): Child[] => {
  let changed = false;
  const next = children.map((c) => {
    let u = c;
    if (c.id === id) u = fn(c);
    else if (c.kids?.length) {
      const kids = updateDescendant(c.kids, id, fn);
      if (kids !== c.kids) u = { ...c, kids };
    }
    if (u !== c) changed = true;
    return u;
  });
  return changed ? next : children;
};

/** 从后代树中移除指定的人（连同其后代，例如分家独立） */
const removeDescendants = (children: Child[], ids: Set<string>): Child[] =>
  children.filter((c) => !ids.has(c.id)).map((c) => (c.kids?.length ? { ...c, kids: removeDescendants(c.kids, ids) } : c));

// ---------- 强制相亲与包办婚姻（第 73 题，默认值） ----------
// 家主可为 30 岁以上仍未婚的子女、孙辈包办婚事，当场成婚，被安排者对家主好感下降；
// 之后每月判定：婚后和睦（好感回升）、不满离婚（恢复单身，可再次安排）、或受枕边风影响与家族生分
// （生分后好感每月额外下降，好感长期过低时按分家规则带着自己这一支独立）。

export const MATCHMAKING_MIN_AGE = 30;
export const MATCHMAKING_MAX_DEPTH = 2;
export const MATCHMAKING_FEE = MARRIAGE_FEE;
export const MATCHMAKING_AFFINITY_PENALTY = 15;
export const ARRANGED_CONTENT_CHANCE = 0.03;
export const ARRANGED_DIVORCE_CHANCE = 0.02;
export const ARRANGED_ESTRANGE_CHANCE = 0.01;
export const ARRANGED_CONTENT_AFFINITY = 10;
export const ARRANGED_DIVORCE_AFFINITY = 10;
export const ESTRANGED_AFFINITY_DECAY = 3;

/** 能否为这位家人强制相亲；可以时返回 null */
export const canArrangeMarriage = (member: FamilyMemberView): string | null => {
  if (member.depth === undefined || member.depth > MATCHMAKING_MAX_DEPTH) return '只能为子女和孙辈安排相亲';
  if (member.status === '已故') return '这位家人已经过世';
  if (member.married) return '已经成家了';
  if (member.age < MATCHMAKING_MIN_AGE) return `${MATCHMAKING_MIN_AGE} 岁以上仍未婚才能强制相亲`;
  return null;
};

/** 为后代包办婚事：当场成婚，好感下降；对方不在后代中或没有合适人选时返回 null。费用由调用方扣除 */
export const arrangeMarriage = (
  state: FamilyState,
  memberId: string,
  year: number,
  month: number,
  rng: () => number = Math.random,
): { state: FamilyState; spouse: Spouse } | null => {
  const target = findDescendant(state, memberId);
  if (!target || target.spouse) return null;
  const age = ageAt(target.birthYear, target.birthMonth, year, month);
  const cand = generateSpouseCandidates(age, rng, 1, target.gender)[0];
  if (!cand) return null;
  const spouse: Spouse = { name: cand.name, gender: cand.gender, birthYear: year - cand.age, occupation: cand.occupation, marriedYear: year, marriedMonth: month, traits: cand.traits ?? [], lifespan: rollKinLifespan(rng), appearance: spouseAppearance(cand, rng) };
  const affinity = state.affinity[memberId] ?? CHILD_INITIAL_AFFINITY;
  return {
    spouse,
    state: {
      ...state,
      children: updateDescendant(state.children, memberId, (c) => ({ ...c, spouse, arranged: 'pending' })),
      affinity: { ...state.affinity, [memberId]: Math.max(0, affinity - MATCHMAKING_AFFINITY_PENALTY) },
      events: [...state.events, { year, month, title: `为${target.name}包办婚事`, desc: `${target.name}（${age} 岁）奉家主之命与 ${cand.name}（${cand.occupation}）成婚。` }],
    },
  };
};

export interface FamilyLifeResult {
  state: FamilyState;
  /** 本月家族里发生的事（用于提示与日志） */
  notes: Array<{ title: string; desc: string }>;
}

/** 每月：配偶寿终则丧偶；每一代成年后代成家、生育下一代 */
export const monthlyFamilyLife = (
  state: FamilyState,
  year: number,
  month: number,
  rng: () => number = Math.random,
  /** 主角的特质：孙辈的祖父母特质（第 62 题） */
  playerTraits: string[] = [],
  /** 当家人性别：决定提示中的称谓（孙子 / 外孙等） */
  playerGender: string | null = null,
): FamilyLifeResult => {
  const notes: Array<{ title: string; desc: string; record: boolean }> = [];
  let next = state;
  const surname = getOrigin(state).surname;
  const pg = playerGender === '男' || playerGender === '女' ? playerGender : null;

  const s = state.spouse;
  if (s && year - s.birthYear >= spouseLifespan(s)) {
    next = {
      ...next,
      spouse: null,
      formerSpouses: [...getFormerSpouses(next), { ...s, divorcedYear: year, divorcedMonth: month, widowed: true }],
      events: [...next.events, { year, month, title: '丧偶', desc: `${s.name} 离开了人世，享年 ${year - s.birthYear} 岁。` }],
    };
    notes.push({ title: `${s.name} 离世`, desc: `配偶 ${s.name} 享年 ${year - s.birthYear} 岁。`, record: false });
  }

  const usedNames = new Set<string>(allDescendants(state.children).map((c) => c.name));
  const affinityDelta: Record<string, number> = {};
  const addAffinity = (id: string, delta: number) => (affinityDelta[id] = (affinityDelta[id] ?? 0) + delta);
  // parentTraits：c 的父母的特质（c 生下的孩子的祖父母特质）
  const live = (c: Child, depth: number, chain: string, parentTraits: string[]): Child => {
    const age = ageAt(c.birthYear, c.birthMonth, year, month);
    let child = c;
    if (age < childLifespan(c)) {
      if (!child.spouse && age >= CHILD_MARRY_MIN_AGE && age < CHILD_MARRY_MAX_AGE && rng() < CHILD_MARRY_CHANCE) {
        const cand = generateSpouseCandidates(age, rng, 1, child.gender)[0];
        if (cand) {
          child = {
            ...child,
            spouse: { name: cand.name, gender: cand.gender, birthYear: year - cand.age, occupation: cand.occupation, marriedYear: year, marriedMonth: month, traits: cand.traits ?? [], lifespan: rollKinLifespan(rng), appearance: spouseAppearance(cand, rng) },
          };
          notes.push({ title: `${c.name} 成家`, desc: `${c.name} 与 ${cand.name}（${cand.occupation}）结为夫妻。`, record: depth <= FAMILY_NOTE_MAX_DEPTH });
        }
      }
      // 包办婚姻：磨合中的每月判定结局；与家族生分的好感持续下降
      if (child.spouse && child.arranged === 'pending') {
        const r = rng();
        if (r < ARRANGED_CONTENT_CHANCE) {
          child = { ...child, arranged: 'content' };
          addAffinity(c.id, ARRANGED_CONTENT_AFFINITY);
          notes.push({ title: `${c.name} 婚后和睦`, desc: `${c.name} 与 ${child.spouse!.name} 日久生情，对这门亲事渐渐满意。`, record: true });
        } else if (r < ARRANGED_CONTENT_CHANCE + ARRANGED_DIVORCE_CHANCE) {
          notes.push({ title: `${c.name} 离婚`, desc: `${c.name} 始终不满家里包办的婚事，与 ${child.spouse!.name} 离婚。`, record: true });
          child = { ...child, spouse: undefined, arranged: undefined };
          addAffinity(c.id, -ARRANGED_DIVORCE_AFFINITY);
        } else if (r < ARRANGED_CONTENT_CHANCE + ARRANGED_DIVORCE_CHANCE + ARRANGED_ESTRANGE_CHANCE) {
          child = { ...child, arranged: 'estranged' };
          notes.push({ title: `${c.name} 与家族生分`, desc: `${child.spouse!.name} 常吹枕边风，${c.name} 对家族越来越疏远。`, record: true });
        }
      }
      if (child.spouse && child.arranged === 'estranged') addAffinity(c.id, -ESTRANGED_AFFINITY_DECAY);
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
            id: `gc_${year}_${month}_${hashId(child.id).toString(36)}_${kids.length + k + 1}`,
            name,
            gender,
            birthYear: year,
            birthMonth: month,
            otherParentName: sp.name,
            otherParentGender: sp.gender,
            lifespan: rollKinLifespan(rng),
            antibodies: inheritAntibodies(child.antibodies ?? [], sp.antibodies ?? [], rng),
            ...(() => {
              const b = applyBeauty(
                inheritTraits(child.traits ?? [], sp.traits ?? [], rng, parentTraits),
                rollBeauty(child.traits ?? [], sp.traits ?? [], rng),
                inheritAppearance(child.appearance, sp.appearance, gender, rng),
                gender,
                rng,
              );
              return { traits: b.traits, appearance: b.appearance };
            })(),
          });
        }
        child = { ...child, kids: [...kids, ...born] };
        notes.push({
          title: `${c.name} 喜得${twins ? '双胞胎' : born[0].gender === '女' ? '千金' : '麟儿'}`,
          desc: `${born.map((b) => b.name).join('、')} 降生，是你的${born.map((b) => relationTitle(joinChain(chain, childWord(b.gender)), pg, false, generationLabel(-depth - 1))).join('、')}。`,
          record: depth <= FAMILY_NOTE_MAX_DEPTH,
        });
      }
    }
    // 下一代：孩子的祖父母特质 = 这一代夫妻的特质
    const grand = [...(child.traits ?? []), ...(child.spouse?.traits ?? [])];
    const oldKids = child.kids ?? [];
    const newKids = oldKids.map((k) => (k.birthYear === year && k.birthMonth === month ? k : live(k, depth + 1, joinChain(chain, childWord(k.gender)), grand)));
    return newKids.some((k, i) => k !== oldKids[i]) ? { ...child, kids: newKids } : child;
  };

  // 子女的祖父母 = 主角与孩子的另一位家长（是现任配偶时）
  const children = next.children.map((c) =>
    live(c, 1, childWord(c.gender), [...playerTraits, ...(state.spouse && c.otherParentName === state.spouse.name ? state.spouse.traits ?? [] : [])]),
  );
  if (children.some((c, i) => c !== next.children[i])) {
    next = {
      ...next,
      children,
      events: [...next.events, ...notes.filter((n) => n.record).map((n) => ({ year, month, title: n.title, desc: n.desc }))],
    };
  }
  if (Object.keys(affinityDelta).length > 0) {
    const affinity = { ...next.affinity };
    for (const [id, d] of Object.entries(affinityDelta)) affinity[id] = Math.max(0, Math.min(100, (affinity[id] ?? CHILD_INITIAL_AFFINITY) + d));
    next = { ...next, affinity };
  }
  return { state: next, notes: notes.filter((n) => n.record || n.title.includes('离世')).map(({ title, desc }) => ({ title, desc })) };
};

// ---------- 同房与领养（第 60 题，默认值） ----------
// 同房：已婚即可，每月一次，当月生育概率 × INTIMACY_MULTIPLIER（仍受生育年龄、同性、不孕等限制）。
// 领养：与现任配偶结婚满 ADOPTION_MARRIED_YEARS 年，且与这位配偶没有生育过孩子，可花 ADOPTION_FEE 领养 0–10 岁的孩子。

export const INTIMACY_MULTIPLIER = 3;
export const ADOPTION_MARRIED_YEARS = 20;
export const ADOPTION_FEE = 5000;

export const marriedYears = (state: FamilyState, year: number, month: number) =>
  state.spouse ? (year * 12 + month - (state.spouse.marriedYear * 12 + state.spouse.marriedMonth)) / 12 : 0;

/** 是否可以领养；不可以时返回原因 */
export const adoptionBlocked = (state: FamilyState, year: number, month: number): string | null => {
  const s = state.spouse;
  if (!s) return '已婚才能领养';
  if (state.children.length >= MAX_CHILDREN) return `子嗣已达 ${MAX_CHILDREN} 人上限`;
  if (state.children.some((c) => !c.adopted && c.otherParentName === s.name)) return `你和 ${s.name} 已有亲生子女`;
  const y = marriedYears(state, year, month);
  if (y < ADOPTION_MARRIED_YEARS) return `婚后满 ${ADOPTION_MARRIED_YEARS} 年仍没有孩子才能领养（还需 ${Math.ceil(ADOPTION_MARRIED_YEARS - y)} 年）`;
  return null;
};

/** 领养一个 0–10 岁的孩子（冠家族姓，随机特质） */
export const adoptChild = (state: FamilyState, year: number, month: number, rng: () => number = Math.random): { state: FamilyState; child: Child } => {
  const surname = getOrigin(state).surname;
  const gender: Gender = rng() < 0.5 ? '男' : '女';
  const age = Math.floor(rng() * 11);
  const usedNames = new Set(state.children.map((c) => c.name));
  const child: Child = {
    id: `adopt_${year}_${month}_${state.children.length + 1}`,
    name: randomFullName(gender, surname, rng, usedNames),
    gender,
    birthYear: year - age,
    birthMonth: month,
    ...(state.spouse ? { otherParentName: state.spouse.name, otherParentGender: state.spouse.gender } : {}),
    ...(() => {
      const b = applyBeauty(randomTraits(rng), rollBeauty([], [], rng), randomAppearance(gender, rng), gender, rng);
      return { traits: b.traits, appearance: b.appearance };
    })(),
    lifespan: rollKinLifespan(rng),
    ambition: Math.floor(rng() * (AMBITION_BASE_MAX + 1)),
    adopted: true,
  };
  return {
    child,
    state: {
      ...state,
      children: [...state.children, child],
      events: [...state.events, { year, month, title: '领养子嗣', desc: `领养了 ${age} 岁的${gender === '女' ? '女孩' : '男孩'} ${child.name}，${surname}家族又添一员。` }],
    },
  };
};

// ---------- 野心与逼宫（第 59 题，默认值） ----------
// 子嗣出生时野心 0–50；带「野心勃勃」特质的成年后每年 +4。
// 富商、贵族家族中，成年子嗣野心 ≥ 80 且对当家人的好感 ≤ 30，连续 6 个月就会逼宫，强迫当家人退位。
// 皇族按维基设定，不随机发生逼宫。

export const AMBITION_BASE_MAX = 50;
export const AMBITION_GROWTH_PER_YEAR = 4;
export const COUP_AMBITION = 80;
export const COUP_AFFINITY = 30;
export const COUP_MONTHS = 6;
export const COUP_CLASSES = ['merchant', 'noble'];

const stableAmbition = (id: string) => {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return (h >>> 0) % (AMBITION_BASE_MAX + 1);
};

export const childAmbition = (c: Child, year: number, month: number): number => {
  const base = c.ambition ?? stableAmbition(c.id);
  const age = ageAt(c.birthYear, c.birthMonth, year, month);
  const growth = (c.traits ?? []).includes('ambitious') && age > 18 ? (age - 18) * AMBITION_GROWTH_PER_YEAR : 0;
  return Math.min(100, base + growth);
};

export interface CoupCheck {
  state: FamilyState;
  /** 发动逼宫的子嗣 id */
  coupBy: string | null;
  /** 不满开始累积或即将逼宫时的提醒 */
  warnings: string[];
}

/** 每月判定：members 为本月推进前的族谱（含好感度） */
export const checkCoup = (state: FamilyState, members: FamilyMemberView[], classId: string): CoupCheck => {
  if (!COUP_CLASSES.includes(classId)) return { state: state.coupStreak && Object.keys(state.coupStreak).length ? { ...state, coupStreak: {} } : state, coupBy: null, warnings: [] };
  const prev = state.coupStreak ?? {};
  const streak: Record<string, number> = {};
  const warnings: string[] = [];
  let coupBy: string | null = null;
  for (const m of members) {
    if (!m.isChild || m.status === '已故' || m.age < 18) continue;
    const ambition = m.ambition ?? 0;
    if (ambition >= COUP_AMBITION && m.affinity <= COUP_AFFINITY) {
      const n = (prev[m.id] ?? 0) + 1;
      streak[m.id] = n;
      if (n === 1) warnings.push(`⚠️ ${m.relation} ${m.name} 野心勃勃，对你心怀不满`);
      if (n === COUP_MONTHS - 1) warnings.push(`⚠️ ${m.relation} ${m.name} 正在联络族人，再不安抚就要逼宫了`);
      if (n >= COUP_MONTHS && !coupBy) coupBy = m.id;
    }
  }
  return { state: { ...state, coupStreak: coupBy ? {} : streak }, coupBy, warnings };
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
    const traits = randomTraits(rng);
    candidates.push({ name, gender, age, occupation: pick(SPOUSE_OCCUPATIONS, rng), traits: rollBeauty([], [], rng) ? [...traits, 'beauty'] : traits });
  }
  return candidates;
};

/** 配偶外貌：有「倾国倾城」用预设外貌，否则随机 */
export const spouseAppearance = (c: { gender: Gender; traits?: string[] }, rng: () => number = Math.random): Appearance =>
  applyBeauty(c.traits ?? [], (c.traits ?? []).includes('beauty'), randomAppearance(c.gender, rng), c.gender, rng).appearance;

export const marry = (state: FamilyState, candidate: SpouseCandidate, year: number, month: number): FamilyState => ({
  ...state,
  spouse: {
    appearance: spouseAppearance(candidate),
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
  antibodies?: string[];
  appearance?: Appearance;
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
  playerAntibodies: string[] = [],
  playerAppearance?: Appearance,
): BirthResult => {
  const surname = getOrigin(state).surname;
  const usedNames = new Set(state.children.map((c) => c.name));
  // 第 62 题：主角父母（孩子的祖父母）的特质也会遗传
  const grandparentTraits = getOrigin(state).members.filter((d) => d.kin === 'parent').flatMap(defTraitIds);
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
      ...(illegitimate ? { illegitimate: true } : {}),
      lifespan: rollKinLifespan(rng),
      antibodies: inheritAntibodies(playerAntibodies, other?.antibodies ?? [], rng),
      ambition: Math.floor(rng() * (AMBITION_BASE_MAX + 1)),
      ...(() => {
        const b = applyBeauty(
          inheritTraits(playerTraits, other?.traits ?? [], rng, grandparentTraits),
          rollBeauty(playerTraits, other?.traits ?? [], rng),
          inheritAppearance(playerAppearance, other?.appearance, gender, rng),
          gender,
          rng,
        );
        return { traits: b.traits, appearance: b.appearance };
      })(),
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
  playerAntibodies: string[] = [],
  /** 本月生育概率倍数（同房时为 INTIMACY_MULTIPLIER） */
  chanceMultiplier = 1,
  playerAppearance?: Appearance,
): BirthResult => {
  const none = { state, child: null, children: [] };
  const s = state.spouse;
  if (!s) return none;
  // 第 48 题：同性伴侣不生育（旧存档中已有的同性婚姻保留，但不再生育）
  if (playerGender && s.gender === playerGender) return none;
  const spouseAge = year - s.birthYear;
  // 第 50 题：过了生育年龄（按性别与「精力旺盛」「富养」特质）不再生育
  if (playerAge > fertileMaxAge(playerGender, playerTraits) || spouseAge > fertileMaxAge(s.gender, s.traits) || state.children.length >= MAX_CHILDREN) return none;
  if (rng() >= BIRTH_CHANCE * fertilityMultiplier(playerTraits, s.traits) * chanceMultiplier) return none;
  const twins = rng() < twinChanceFor(TWIN_CHANCE, playerTraits, s.traits) && state.children.length + 2 <= MAX_CHILDREN;
  return giveBirth(state, year, month, twins ? 2 : 1, rng, s, playerTraits, false, playerAntibodies, playerAppearance);
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
  playerAntibodies: string[] = [],
  playerAppearance?: Appearance,
): BirthResult => {
  const none = { state, child: null, children: [] };
  const l = state.lover;
  // 第 48 题：贵族、皇族可以有同性情人，但同性情人不会生下私生子女
  if (l && playerGender && l.gender === playerGender) return none;
  if (!l || playerAge > fertileMaxAge(playerGender, playerTraits) || year - l.birthYear > fertileMaxAge(l.gender, l.traits) || state.children.length >= MAX_CHILDREN) return none;
  if (rng() >= ILLEGITIMATE_CHANCE * fertilityMultiplier(playerTraits, l.traits)) return none;
  return giveBirth(state, year, month, 1, rng, l, playerTraits, true, playerAntibodies, playerAppearance);
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
    const splittable = m.isChild || m.arranged === 'estranged' || (m.kin !== undefined && SPLITTABLE_KINS.includes(m.kin));
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
      children: removeDescendants(state.children, splitIds),
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
  /** child：子女；grandchild：孙辈（可跳过子辈直接继承），或没有在世子女、孙辈时最近一代的在世后代；sibling：兄弟姐妹 */
  kind: 'child' | 'grandchild' | 'sibling';
  traits?: string[];
}

/** 子女与孙辈随时可以继承（可跳过子辈直接由孙辈继承）；更远的后代只在没有在世子女、孙辈时继承 */
export const HEIR_MAX_DEPTH = 2;

/**
 * 可继承的人选：所有在世子女与孙辈（不限年龄），以及年满 HEIR_MIN_AGE 岁的兄弟姐妹；
 * 没有在世子女、孙辈时，由最近一代的在世后代继承（第 52 题，延续到任意代）。
 */
export const listHeirs = (members: FamilyMemberView[]): HeirCandidate[] => {
  const alive = members.filter((m) => !m.isPlayer && m.status !== '已故' && m.gender);
  const depths = alive.filter((m) => m.depth !== undefined).map((m) => m.depth!);
  const reach = depths.length === 0 ? 0 : Math.max(HEIR_MAX_DEPTH, Math.min(...depths));
  const descendants = alive.filter((m) => m.depth !== undefined && m.depth <= reach);
  const siblings = alive.filter((m) => m.kin === 'sibling' && m.age >= HEIR_MIN_AGE);
  return [...descendants, ...siblings].map((m) => ({
    id: m.id,
    name: m.name,
    gender: m.gender as Gender,
    age: m.age,
    relation: m.relation,
    kind: m.depth === 1 ? 'child' : m.depth !== undefined ? 'grandchild' : 'sibling',
    traits: m.traitIds,
  }));
};

export interface Predecessor {
  name: string;
  gender: Gender;
  age: number;
  occupation: string;
  appearance?: Appearance;
  traits?: string[];
}

/** 传承时清理：已故、非直系、且与新当家人相差两代以上的旁支亲属不再保留（直系祖先与在世的人都保留） */
export const PRUNE_LEVEL_DISTANCE = 2;

/**
 * 以继承人为新主角重排家族。资产等不在家族状态中，由调用方保留。
 * 每位亲属的关系链改为相对继承人：后代之间按家谱树经共同祖先计算（避免「爸爸的儿子」这类歧义），
 * 前任原有的族谱成员接在「继承人 → 前任」之后，最后统一按称谓归一化。返回新的家族状态与继承人信息。
 */
export const succeed = (
  state: FamilyState,
  members: FamilyMemberView[],
  heirId: string,
  predecessor: Predecessor,
  year: number,
  month: number,
  /** 主动传位（第 58 题）或被逼宫（第 59 题）：前任在世、退居幕后，按自己的寿命继续出现在族谱中 */
  retire?: { lifespan: number; coup?: boolean },
): { state: FamilyState; heir: HeirCandidate } => {
  const heir = listHeirs(members).find((h) => h.id === heirId);
  if (!heir) throw new Error('继承人不符合条件');
  const origin = getOrigin(state);
  const H = heir.age;
  // 原成员相对新主角的年龄差 = 原年龄差 + shift
  const shift = predecessor.age - H;
  const ageOf = (c: Child) => ageAt(c.birthYear, c.birthMonth, year, month);
  const defs: FamilyMemberDef[] = [];

  const chainDef = (base: Omit<FamilyMemberDef, 'kin' | 'relation' | 'generation' | 'chain'>, chain: string): FamilyMemberDef => {
    const label = generationLabel(chainLevel(chain));
    return { ...base, chain, kin: kinOfChain(chain), relation: label, generation: label };
  };
  const descendantDef = (c: Child, chain: string): FamilyMemberDef =>
    chainDef(
      {
        id: c.id,
        name: c.name,
        gender: c.gender,
        ageOffset: ageOf(c) - H,
        appearance: c.appearance,
        traitIds: c.traits,
        lifespan: childLifespan(c),
        occupationByAge: CHILD_STAGES,
        defaultAffinity: CHILD_INITIAL_AFFINITY,
        avatarBg: c.gender === '女' ? '#c06a8a' : '#4a7aa8',
        desc: `生于 ${c.birthYear} 年 ${c.birthMonth} 月。`,
        traits: ['家族成员'],
      },
      chain,
    );
  const spouseDef = (sp: Spouse, chain: string, desc: string): FamilyMemberDef =>
    chainDef(
      {
        id: `sp_${sp.name}_${sp.birthYear}`,
        name: sp.name,
        gender: sp.gender,
        appearance: sp.appearance,
        traitIds: sp.traits,
        ageOffset: year - sp.birthYear - H,
        lifespan: spouseLifespan(sp),
        occupationByAge: [[0, sp.occupation]],
        defaultAffinity: SPOUSE_INITIAL_AFFINITY,
        avatarBg: '#b2586a',
        desc,
        traits: ['长辈'],
      },
      chain,
    );
  // 去世的前任主角：寿命 = 去世年龄，因此始终显示为已故
  const predecessorDef = (chain: string): FamilyMemberDef =>
    chainDef(
      {
        id: `late_${year}_${month}`,
        name: predecessor.name,
        gender: predecessor.gender,
        ageOffset: shift,
        appearance: predecessor.appearance,
        traitIds: predecessor.traits,
        lifespan: retire ? Math.max(retire.lifespan, predecessor.age + 1) : predecessor.age,
        occupationByAge: [[0, retire ? '退居幕后' : predecessor.occupation]],
        defaultAffinity: 100,
        avatarBg: '#525a66',
        desc: retire ? `上一代当家人，${year} 年 ${month} 月传位后退居幕后。` : `上一代当家人，${year} 年 ${month} 月辞世，享年 ${predecessor.age} 岁。`,
        traits: ['先代当家'],
      },
      chain,
    );
  /** 某个人及其全部后代：chain 为此人相对继承人的关系链 */
  const branch = (c: Child, chain: string) => {
    defs.push(descendantDef(c, chain));
    (c.kids ?? []).forEach((k) => branch(k, joinChain(chain, childWord(k.gender))));
  };
  /** 前任原有的族谱成员：关系链接在「继承人 → 前任」之后；反推不出关系链的（继母等）保留原称谓并注明是谁的亲属 */
  const fromPredecessor = (toPred: string) =>
    origin.members
      .filter((d) => d.id !== heir.id)
      .forEach((d) => {
        const old = chainOfDef(d);
        const ageOffset = d.ageOffset + shift;
        if (old === null) {
          defs.push({ ...d, ageOffset, relation: `${predecessor.name}的${d.relation}`, generation: generationLabel(levelOfLabel(d.generation) + chainLevel(toPred)), kin: 'other' });
        } else {
          defs.push(chainDef({ ...d, ageOffset }, joinChain(toPred, old)));
        }
      });

  let nextChildren: Child[] = [];
  let nextSpouse: Spouse | null = null;
  let heirIllegitimate = false;
  if (heir.kind === 'sibling') {
    // 兄弟姐妹继承：前任成为继承人的兄弟姐妹，前任的后代成为侄辈；前任配偶不再计入族谱
    const toPred = siblingWord(predecessor.gender, predecessor.age > H);
    fromPredecessor(toPred);
    defs.push(predecessorDef(toPred));
    state.children.forEach((c) => branch(c, joinChain(toPred, childWord(c.gender))));
  } else {
    // 后代继承：path[0] 是前任的子女，path 末尾是继承人；up[i] 为继承人到 path[i] 的关系链
    const path = findDescendantPath(state.children, heir.id);
    if (!path) throw new Error('继承人不在后代中');
    const last = path.length - 1;
    const up: string[] = [];
    up[last] = '';
    for (let i = last - 1; i >= 0; i--) up[i] = joinChain(up[i + 1], parentWord(path[i].gender));
    const toPred = joinChain(up[0], parentWord(predecessor.gender));
    fromPredecessor(toPred);
    defs.push(predecessorDef(toPred));
    // 前任的配偶：是 path[0] 的另一位家长时就是继承人的直系长辈，否则是前任的配偶（继承人直接继承时显示继母 / 继父）
    const ps = state.spouse;
    if (ps) {
      if (path[0].otherParentName === ps.name) defs.push(spouseDef(ps, joinChain(up[0], parentWord(ps.gender)), `${predecessor.name} 的配偶。`));
      else if (last === 0) defs.push({ ...spouseDef(ps, '', `${predecessor.name} 的配偶。`), chain: undefined, kin: 'parent', relation: ps.gender === '女' ? '继母' : '继父', generation: generationLabel(1) });
      else defs.push(spouseDef(ps, joinChain(toPred, spouseWord(ps.gender)), `${predecessor.name} 的配偶。`));
    }
    // 前任的其他子女及其后代
    state.children.filter((c) => c.id !== path[0].id).forEach((c) => branch(c, joinChain(up[0], siblingWord(c.gender, ageOf(c) > ageOf(path[0])))));
    // 路径上的长辈（继承人的父母、祖父母……）、他们的配偶，以及他们的其他子女与后代
    for (let i = 0; i < last; i++) {
      const p = path[i];
      defs.push(descendantDef(p, up[i]));
      if (p.spouse) {
        const bio = path[i + 1].otherParentName === p.spouse.name;
        defs.push(spouseDef(p.spouse, bio ? joinChain(up[i + 1], parentWord(p.spouse.gender)) : joinChain(up[i], spouseWord(p.spouse.gender)), `${p.name} 的配偶。`));
      }
      (p.kids ?? []).filter((k) => k.id !== path[i + 1].id).forEach((k) => branch(k, joinChain(up[i + 1], siblingWord(k.gender, ageOf(k) > ageOf(path[i + 1])))));
    }
    // 继承人自己的配偶与后代：成为新当家人的配偶与子女
    const self = path[last];
    heirIllegitimate = last === 0 && !!self.illegitimate;
    nextSpouse = self.spouse && year - self.spouse.birthYear < spouseLifespan(self.spouse) ? self.spouse : null;
    nextChildren = (self.kids ?? []).map((k) => ({ ...k, otherParentName: self.spouse?.name ?? k.otherParentName, otherParentGender: self.spouse?.gender ?? k.otherParentGender }));
  }

  // 统一按称谓归一化关系链（避免一代代越接越长），并清理已故的远房旁支
  const kept = defs
    .map((d) => {
      if (!d.chain) return d;
      const title = relationTitle(d.chain, heir.gender, d.ageOffset > 0, '');
      const chain = (title && chainOfTitle(title)) || d.chain;
      return { ...d, chain, relation: title || d.relation };
    })
    .filter((d) => {
      const alive = H + d.ageOffset < d.lifespan;
      const level = d.chain ? chainLevel(d.chain) : levelOfLabel(d.generation);
      return alive || (d.chain !== undefined && isLineal(d.chain)) || Math.abs(level) <= PRUNE_LEVEL_DISTANCE;
    });

  return {
    heir,
    state: {
      playerIllegitimate: heirIllegitimate,
      baseClassId: state.baseClassId,
      affinity: {},
      lastInteraction: {},
      spouse: nextSpouse,
      formerSpouses: [],
      children: nextChildren,
      lover: null,
      discontent: {},
      splitBranches: state.splitBranches ?? [],
      heirlooms: getHeirlooms(state),
      origin: { ...origin, members: kept },
      events: [
        ...state.events,
        retire?.coup
          ? { year, month, title: '逼宫', desc: `${heir.relation} ${heir.name} 野心勃勃，联合族人逼宫，${predecessor.name}（${predecessor.age} 岁）被迫退位。` }
          : retire
          ? { year, month, title: '传位', desc: `${predecessor.name}（${predecessor.age} 岁）退居幕后，把家业传给${heir.relation} ${heir.name}。` }
          : { year, month, title: '传承家业', desc: `${predecessor.name} 辞世，享年 ${predecessor.age} 岁。${heir.relation} ${heir.name} 继承家业，成为新一代当家人。` },
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
