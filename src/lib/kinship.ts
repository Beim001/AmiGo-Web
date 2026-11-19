// 亲属称谓：每位亲属记录相对当家人的关系链（「爸爸的哥哥的儿子」），称谓交给 relationship.js 计算。
// relationship.js 每次计算约 7 毫秒，族谱每次渲染要算几十上百次，因此按「关系链 + 当家人性别」缓存。
// 关系链只用下列基本称呼：上一代 爸爸 / 妈妈，下一代 儿子 / 女儿，同辈 哥哥 / 弟弟 / 姐姐 / 妹妹（反推结果里还会出现 兄弟 / 姐妹），配偶 老公 / 老婆。

import relationship from 'relationship.js';
import type { Kin } from './family';

type Gender = '男' | '女';

const UP = ['爸爸', '妈妈'];
const DOWN = ['儿子', '女儿'];
const SIBLING = ['哥哥', '弟弟', '姐姐', '妹妹', '兄弟', '姐妹'];
const SPOUSE = ['老公', '老婆'];

export const parentWord = (gender: Gender) => (gender === '女' ? '妈妈' : '爸爸');
export const childWord = (gender: Gender) => (gender === '女' ? '女儿' : '儿子');
export const spouseWord = (gender: Gender) => (gender === '女' ? '老婆' : '老公');
/** older：对方比自己年长 */
export const siblingWord = (gender: Gender, older: boolean) => (gender === '女' ? (older ? '姐姐' : '妹妹') : older ? '哥哥' : '弟弟');

export const chainSteps = (chain: string): string[] => chain.split('的').filter(Boolean);
export const joinChain = (...parts: string[]) => parts.filter(Boolean).join('的');

/** 辈分层级：上一代 +1，下一代 −1；同辈与配偶不改变层级 */
export const chainLevel = (chain: string): number =>
  chainSteps(chain).reduce((lv, s) => lv + (UP.includes(s) ? 1 : DOWN.includes(s) ? -1 : 0), 0);

/** 直系：只往上（祖先）或只往下（后代），中间不经过兄弟姐妹与配偶 */
export const isLineal = (chain: string): boolean => {
  const steps = chainSteps(chain);
  return steps.length > 0 && (steps.every((s) => UP.includes(s)) || steps.every((s) => DOWN.includes(s)));
};

const GENERATION_LABEL: Record<number, string> = {
  4: '高祖辈',
  3: '曾祖辈',
  2: '祖辈',
  1: '父辈',
  0: '平辈',
  [-1]: '子辈',
  [-2]: '孙辈',
  [-3]: '曾孙辈',
  [-4]: '玄孙辈',
};

/** 辈分名称：高祖以上统称远祖辈，玄孙以下按代数称「第 N 代孙辈」 */
export const generationLabel = (level: number): string =>
  GENERATION_LABEL[level] ?? (level > 0 ? '远祖辈' : `第 ${-level} 代孙辈`);

/** 旧存档只记录了辈分名称时，反推层级 */
export const levelOfLabel = (label: string): number => {
  const hit = Object.entries(GENERATION_LABEL).find(([, v]) => v === label);
  if (hit) return Number(hit[0]);
  if (label === '远祖辈') return 5;
  const m = label.match(/^第 (\d+) 代孙辈$/);
  return m ? -Number(m[1]) : 0;
};

const titleCache = new Map<string, string[]>();
const chainCache = new Map<string, string | null>();

const titles = (chain: string, playerGender: Gender | null): string[] => {
  const key = `${chain}|${playerGender ?? ''}`;
  let hit = titleCache.get(key);
  if (!hit) {
    hit = relationship({ text: chain, sex: playerGender === '女' ? 0 : 1 }).filter((t) => t !== '自己');
    titleCache.set(key, hit);
  }
  return hit;
};

/**
 * 关系链对应的称谓。同一条链有多个候选时（「爸爸的兄弟的儿子」→ 堂哥 / 堂弟），按对方是否比当家人年长挑选；
 * relationship.js 算不出时返回 fallback。
 */
export const relationTitle = (chain: string, playerGender: Gender | null, olderThanPlayer: boolean, fallback = '亲属'): string => {
  const list = titles(chain, playerGender);
  if (list.length === 0) return fallback;
  if (list.length === 1) return list[0];
  const elder = /[哥姐兄伯]/;
  const younger = /[弟妹叔]/;
  return list.find((t) => (olderThanPlayer ? elder.test(t) && !younger.test(t) : younger.test(t) && !elder.test(t))) ?? list[0];
};

/** 由称谓反推关系链（旧存档的成员只有称谓）；非血缘称谓（继母等）反推不出，返回 null */
export const chainOfTitle = (title: string): string | null => {
  if (!chainCache.has(title)) chainCache.set(title, relationship({ text: title, type: 'chain' })[0] ?? null);
  return chainCache.get(title) ?? null;
};

/** 由关系链得出现有规则使用的亲属类型（零花只给父母、只有兄弟姐妹可继承、旁系可能分家等） */
export const kinOfChain = (chain: string): Kin => {
  const steps = chainSteps(chain);
  const level = chainLevel(chain);
  if (steps.length === 0) return 'other';
  if (steps.every((s) => UP.includes(s))) return steps.length === 1 ? 'parent' : steps.length === 2 ? 'grandparent' : 'ancestor';
  // 父母的配偶（继父母）视为父母
  if (steps.length === 2 && UP.includes(steps[0]) && SPOUSE.includes(steps[1])) return 'parent';
  if (steps.length === 1 && SIBLING.includes(steps[0])) return 'sibling';
  if (steps.every((s) => DOWN.includes(s))) return 'grandchild';
  if (level >= 2) return 'granduncle';
  if (level === 1) return 'uncle';
  if (level === 0) return 'cousin';
  if (level === -1) return 'nephew';
  return 'other';
};
