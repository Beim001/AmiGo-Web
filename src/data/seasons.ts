// 赛季（第 55 题）：大版本更新（更改底层逻辑、新增玩法、过渡到阿苏 / 新联邦版本）时在末尾新增一个赛季。
// 新增赛季后，上一赛季自动变为「以往赛季」；玩家本赛季的成就、积分、速通计时从头开始。
// 每个赛季指定一种货币（第 75 题，见 currencies.ts）：帝国赛季用卢布，阿苏赛季用苏维埃卢布，联邦赛季用诺镑。

import { CURRENCIES, CurrencyDef, CurrencyId } from './currencies';

export interface SeasonDef {
  id: string;
  name: string;
  /** 对应的游戏版本号（src/version.ts） */
  version: string;
  /** 开始时间（ISO 字符串，现实时间） */
  startAt: string;
  desc: string;
  /** 本赛季推演到游戏内的哪一年（含）为止；之后要等下一赛季开放 */
  endGameYear?: number;
  /** 截止年份发生的历史事件（提示用） */
  endEvent?: string;
  /** 本赛季使用的货币 */
  currency: CurrencyId;
}

export const SEASONS: SeasonDef[] = [
  {
    id: 'S1',
    name: '第一赛季 · 卡罗尼亚帝国',
    version: 'dev-beta-2208',
    startAt: '2026-11-15T00:00:00+08:00',
    desc: '1870 年起的卡罗尼亚帝国时代。',
    currency: 'imperial_ruble',
    // 维基：卡罗尼亚帝国存在于 1636—1920 年，1920 年红色革命后灭亡。
    // 用户 2026-11-15 决定：第一赛季若截止在 1920 年，「寿比南山」无法完成，因此不设截止年份（第 58 题）。
  },
];

/** 当前赛季：列表最后一个 */
export const currentSeason = (): SeasonDef => SEASONS[SEASONS.length - 1];

/** 当前赛季的货币：界面上的金额符号、货币名称与图标都从这里读取 */
export const CURRENCY: CurrencyDef = CURRENCIES[currentSeason().currency];

/** 以往赛季：除当前赛季外，按时间倒序 */
export const pastSeasons = (): SeasonDef[] => SEASONS.slice(0, -1).reverse();
