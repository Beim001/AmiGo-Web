// 货币（第 75 题）：每个赛季使用一种货币（见 seasons.ts 的 currency），界面上的金额符号、货币名称与图标都从这里读取。
// 依据阿米诺斯维基（2026-11-18 查阅）：
// - 卡罗尼亚帝国（1636–1920）：卢布。1846 年《阿北条约》后帝国沦为俄国保护国，通行俄国卢布。
// - 阿米诺斯苏维埃（阿苏）：1920–1924 阿米诺斯苏维埃人民共和国、1925–1991 阿米诺斯苏维埃社会主义共和国，信息框货币为「卢布」（未注明是否为苏联卢布）。
// - 阿米诺斯联邦共和国（1991 年《独立宪章》起）：诺镑（米诺斯镑，ISO 4217 代码 ANP），辅币米希因，1 诺镑 = 10 米希因，联邦国家银行发行，现行票样 1992 年。
//   维基没有给出诺镑的符号，界面暂用「£ₙ」（用户 2026-11-18 暂定）。

export type CurrencyId = 'imperial_ruble' | 'soviet_ruble' | 'nob_pound';

export interface CurrencyDef {
  id: CurrencyId;
  /** 界面上的货币名称，例如「1,000 卢布」 */
  name: string;
  /** 金额后的符号，例如「1,000 ₽」 */
  symbol: string;
  /** 图标样式：卢布图标或英镑图标 */
  icon: 'ruble' | 'pound';
  /** ISO 4217 代码（维基有记载时） */
  code?: string;
  /** 辅币：名称与 1 单位主币合多少辅币 */
  subunit?: { name: string; per: number };
  issuer: string;
  era: string;
  desc: string;
}

export const CURRENCIES: Record<CurrencyId, CurrencyDef> = {
  imperial_ruble: {
    id: 'imperial_ruble',
    name: '卢布',
    symbol: '₽',
    icon: 'ruble',
    issuer: '俄罗斯帝国（卡罗尼亚为其保护国）',
    era: '卡罗尼亚帝国（1636–1920）',
    desc: '1846 年《阿北条约》后帝国沦为俄国保护国，市面通行俄国卢布。',
  },
  soviet_ruble: {
    id: 'soviet_ruble',
    name: '卢布',
    symbol: '₽',
    icon: 'ruble',
    issuer: '苏维埃政权',
    era: '阿米诺斯苏维埃（1920–1991）',
    desc: '红军攻入卡罗尼亚帝国后建立苏维埃政权，沿用卢布。',
  },
  nob_pound: {
    id: 'nob_pound',
    name: '诺镑',
    symbol: '£ₙ',
    icon: 'pound',
    code: 'ANP',
    subunit: { name: '米希因', per: 10 },
    issuer: '阿米诺斯联邦共和国国家银行',
    era: '阿米诺斯联邦共和国（1991–）',
    desc: '1991 年《独立宪章》发布后，阿米诺斯联邦共和国取代苏维埃政权，以诺镑（米诺斯镑）为法定货币。',
  },
};
