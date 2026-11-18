// 随机人名：所有新生成的人物（出生登记、家族成员、配偶与情人候选人、子嗣）共用
// 名字池参考阿米诺斯维基中人物的命名风格，搭配一部分欧式名字（卡罗尼亚为俄国保护国）。
// 名字格式为「名·姓」，总长度不超过 MAX_NAME_LENGTH（昵称校验上限为 10 个字符）。

import type { Gender } from './family';

export const MAX_NAME_LENGTH = 10;

// 阿米诺斯本地名字按维基人物条目的性别分库（2026-11-18 查阅，第 71 题）：
// 条目用「他」「男孩」等指代的归男性，写明「女」「皇后」或用「她」的归女性；条目没有写明性别的归通用，男女都可抽到。
// 「穆拉特」条目未写性别，按现实中的男性名（Murat）归男性。

/** 阿米诺斯本地男性名字 */
export const LOCAL_MALE_NAMES = [
  '伊其陆特', '俄达姆', '哈基米', '哈比布', '塞马吉', '尼尔吉思', '欧衮斯', '沃米萨', '艾克木', '艾达得',
  '赫思那', '阿布隆', '阿米尔', '堡安', '彬武超', '艾觉兹', '穆拉特',
];
/** 阿米诺斯本地女性名字 */
export const LOCAL_FEMALE_NAMES = ['安德娜炽', '耶文妮'];
/** 阿米诺斯本地名字中维基没有写明性别的（男女通用） */
export const LOCAL_NEUTRAL_NAMES = ['乌勒格瞿', '兰卡', '努克夏克', '奥格奈伊', '热吉夏', '纳卜奈勒', '那沙', '阿德弟吉', '格讷希奈勒', '盎普傅那', '伊那乌'];

/** 某一性别可用的本地名字（本性别 + 通用） */
export const localGivenNames = (gender: Gender): string[] => [...(gender === '女' ? LOCAL_FEMALE_NAMES : LOCAL_MALE_NAMES), ...LOCAL_NEUTRAL_NAMES];

export const MALE_GIVEN_NAMES = ['亚瑟', '卢卡斯', '奥斯卡', '塞巴斯蒂安', '尼古拉', '费利克斯', '雷昂', '马克西姆', '伊万', '阿列克谢', '维克托', '康斯坦丁', '彼得', '米哈伊尔', '帕维尔'];
export const FEMALE_GIVEN_NAMES = ['索菲亚', '伊莎贝拉', '克拉拉', '安娜', '艾米莉亚', '奥尔加', '薇拉', '娜塔莎', '玛丽娜', '叶莲娜', '塔季扬娜', '柳德米拉', '伊琳娜', '达莉娅', '瓦莲京娜'];

/** 出生登记随机姓名时使用的姓氏（家族出身随机后，家族姓氏以出身为准） */
export const COMMON_SURNAMES = [
  '伊体什', '察察沃', '达悉', '米尔', '阿布灭', '诺座埃实', '奥克斯', '伊希纳', '阿加德斯', '伊济耶特',
  '克额图', '艾金', '费佘', '斯罗尼', '维格', '那若格', '奥马比', '么列乌', '阿图奇', '伊卜拉欣',
  '彼得罗夫', '卡里莫夫', '扎哈罗夫', '诺维科夫', '拉希多夫',
];

const pick = <T,>(list: T[], rng: () => number) => list[Math.floor(rng() * list.length)];

/** 随机名字（不含姓）：本地名与欧式名约各占一半，都按性别抽取 */
export const randomGivenName = (gender: Gender, rng: () => number = Math.random): string =>
  rng() < 0.5 ? pick(localGivenNames(gender), rng) : pick(gender === '女' ? FEMALE_GIVEN_NAMES : MALE_GIVEN_NAMES, rng);

/**
 * 随机「名·姓」，保证长度不超过 MAX_NAME_LENGTH，并避开 used 中已有的名字。
 * 姓氏过长时会多次尝试更短的名字；实在无法满足时只返回名字本身。
 */
export const randomFullName = (
  gender: Gender,
  surname: string,
  rng: () => number = Math.random,
  used: Set<string> = new Set(),
): string => {
  for (let attempt = 0; attempt < 40; attempt++) {
    const name = `${randomGivenName(gender, rng)}·${surname}`;
    if (name.length <= MAX_NAME_LENGTH && !used.has(name)) return name;
  }
  // 随机多次仍撞名（例如名字池快用完）：按顺序找一个未使用、长度合适的组合
  const pools = [...(gender === '女' ? FEMALE_GIVEN_NAMES : MALE_GIVEN_NAMES), ...localGivenNames(gender)];
  for (const given of pools) {
    const name = `${given}·${surname}`;
    if (name.length <= MAX_NAME_LENGTH && !used.has(name)) return name;
  }
  for (const given of pools) {
    if (!used.has(given)) return given;
  }
  return `${randomGivenName(gender, rng)}·${surname}`;
};

/** 出生登记用：随机性别风格的完整姓名（姓氏随机） */
export const randomPlayerName = (rng: () => number = Math.random): string =>
  randomFullName(rng() < 0.5 ? '男' : '女', pick(COMMON_SURNAMES, rng), rng);

/**
 * 把名字里的姓换成指定姓氏：「名·旧姓」→「名·新姓」；只有名字（不含「·」）时补上姓氏。
 * 结果超过 MAX_NAME_LENGTH 时退回只用名字（名字本身至少 2 个字），仍不合适则保持原样。
 */
export const applySurname = (name: string, surname: string): string => {
  const trimmed = name.trim();
  const dot = trimmed.lastIndexOf('·');
  const given = dot >= 0 ? trimmed.slice(0, dot) : trimmed;
  const full = `${given}·${surname}`;
  if (given && full.length <= MAX_NAME_LENGTH) return full;
  if (given.length >= 2 && given.length <= MAX_NAME_LENGTH) return given;
  return trimmed;
};
