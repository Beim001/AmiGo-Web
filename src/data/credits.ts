// 致谢名单内容（来源：list.md）。集齐全部成就后以片尾形式从下往上滚动播放。
// 世界观编写名单按阿米诺斯维基（fandom + miraheze 合并）编辑次数排序，统计见 wiki-contributors.md。

export interface CreditSection {
  title: string;
  names: string[];
}

/** 名次未知（未登录、网络失败）时用 null，显示不带名次的祝贺语 */
export const creditsHeadline = (rank: number | null) =>
  rank ? `恭喜你成为第 ${rank} 名获得本游戏全部成就的玩家` : '恭喜你获得本游戏全部成就';

export const CREDITS_INTRO = ['感谢游玩本游戏', '如果感兴趣，欢迎搜索阿米诺斯联邦共和国并加入我们'];

export const CREDIT_SECTIONS: CreditSection[] = [
  { title: '项目发起人', names: ['北洺'] },
  { title: '技术支持', names: ['温茶'] },
  {
    title: '世界观编写',
    names: [
      '北洺', 'Mengma', 'Yuanpi', '温茶', '云山神人226', 'WholesomeStork328', '一只迷茫的星', 'Emtich',
      'VoguishBooch169', 'SUSUAMOY', 'McrNtr1088', 'QINGCI811', '阿米诺斯维基图片传输员', 'Canhong', '39hyh',
      'Nnmmnmnm', 'TLogHalid', 'Etgnoygna·ubiahelete', 'Iabus Nux', 'FortuitousArmadillo453', 'Clare Venzeso',
      '临时3260580774', 'Shizhao', 'Ttummc', '珈百璃', '简体中文使用者', 'AirOTTO1334', 'Jisikuai', 'Dabao qian',
      'H6116G', 'Jackliya21', 'LemonAc1d', 'Undefined4044', 'Ericliu1912', 'Maibakh Hyde', 'TonyShen43',
      'Vicemoter', 'Hamish', 'Hydrogen Sulfide', 'LukasAxelsen', 'QuaintMole846', 'Sxlzr444', 'Wzhi', 'Xiplus',
      'Zzethld',
    ],
  },
];
