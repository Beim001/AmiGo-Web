// 推演系统（undefined.md 第 8–13、24 题）
// - 每月 50% 概率出现一张事件卡；没抽到时显示「本月无事发生」
// - 未处理的事件一直保留、不限数量
// - 稳妥选项结果固定；冒险选项按概率出现好坏结果，选项上只提示方向
// - 只结算金币与健康；推演积分：稳妥 +1、冒险成功 +3、冒险失败 +0
// 历史大事件将严格按维基编写，本文件暂只收录日常事件。

export const EVENT_CHANCE = 0.5;
export const SIM_EVENTS_KEY = 'amigo_sim_events';
export const SIM_SCORE_KEY = 'amigo_sim_score';
export const SIM_QUIET_KEY = 'amigo_sim_last_quiet';

export const SCORE_SAFE = 1;
export const SCORE_RISK_SUCCESS = 3;
export const SCORE_RISK_FAILURE = 0;

export interface SimContext {
  age: number;
  classId: string;
  employed: boolean;
  coins: number;
  hasChildren: boolean;
  /** 已拥有的传家宝（机遇事件不会重复给同一件） */
  ownedHeirlooms?: string[];
}

export interface Outcome {
  coins?: number;
  health?: number;
  text: string;
  /** 获得的传家宝（见 heirlooms.ts） */
  heirloom?: string;
}

export interface SimOption {
  label: string;
  /** 只提示方向，不写具体数字（冒险选项） */
  hint: string;
  kind: 'safe' | 'risky';
  /** 选择此项至少需要的现金 */
  requires?: number;
  /** 稳妥选项的固定结果 */
  result?: Outcome;
  /** 冒险选项：成功概率与两种结果 */
  chance?: number;
  success?: Outcome;
  failure?: Outcome;
}

export interface SimEventDef {
  id: string;
  title: string;
  headline: string;
  desc: string;
  icon: 'medal' | 'ring' | 'watch' | 'wallet' | 'snow' | 'herb' | 'alert' | 'water' | 'box' | 'bowl' | 'hand' | 'dice' | 'clock' | 'factory' | 'users' | 'bandage' | 'store' | 'pill' | 'baby';
  when: (ctx: SimContext) => boolean;
  options: [SimOption, SimOption];
}

export const SIM_EVENTS: SimEventDef[] = [
  {
    id: 'wallet', title: '拾金', headline: '街头捡到一只鼓鼓的钱包！', icon: 'wallet',
    desc: '傍晚路过布津市集，你在石板路边捡到一只皮钱包，里面装着不少卢布，四下无人。',
    when: () => true,
    options: [
      { label: '交给巡捕房', hint: '稳妥', kind: 'safe', result: { coins: 100, text: '失主登门道谢，送上 100 ₽ 酬谢。' } },
      { label: '悄悄据为己有', hint: '高风险 · 可能大赚', kind: 'risky', chance: 0.7, success: { coins: 800, text: '没人发现，你多了 800 ₽。' }, failure: { coins: -300, text: '被巡捕抓个正着，罚款 300 ₽。' } },
    ],
  },
  {
    id: 'cold', title: '寒潮', headline: '西伯利亚寒潮南下，气温骤降！', icon: 'snow',
    desc: '报纸说今冬将是十年来最冷的一个冬天，街上已有人冻伤。你的旧棉衣已经很薄了。',
    when: () => true,
    options: [
      { label: '添置冬衣', hint: '花点钱', kind: 'safe', requires: 300, result: { coins: -300, health: 0, text: '新棉衣暖和又厚实，平安过冬。' } },
      { label: '硬扛过去', hint: '有风险 · 省钱', kind: 'risky', chance: 0.5, success: { text: '咬咬牙挺过去了，什么事也没有。' }, failure: { health: -8, text: '受了风寒，大病一场。' } },
    ],
  },
  {
    id: 'tonic', title: '集市', headline: '集市来了卖补品的商贩', icon: 'herb',
    desc: '摊位上摆满了人参、鹿茸和各色药酒，旁边还有个摊子卖来路不明的便宜偏方。',
    when: () => true,
    options: [
      { label: '买正经补品', hint: '花钱养身', kind: 'safe', requires: 800, result: { coins: -800, health: 5, text: '补品药效扎实，气色好了不少。' } },
      { label: '买便宜偏方', hint: '有风险 · 可能更补', kind: 'risky', chance: 0.5, success: { health: 8, text: '偏方居然很灵，精神百倍。' }, failure: { health: -5, text: '偏方吃坏了肚子，躺了好几天。' } },
    ],
  },
  {
    id: 'cholera_rumor', title: '流言', headline: '城中传言霍乱又要来了', icon: 'alert',
    desc: '有人说码头区已经倒下好几个人，药铺的石灰和醋被抢购一空。',
    when: () => true,
    options: [
      { label: '闭门不出一阵子', hint: '稳妥 · 少赚点', kind: 'safe', result: { coins: -500, text: '躲了半个月，少挣了些钱，但平平安安。' } },
      { label: '照常出门', hint: '有风险', kind: 'risky', chance: 0.7, success: { text: '只是虚惊一场。' }, failure: { health: -12, text: '不幸染上急症，上吐下泻。' } },
    ],
  },
  {
    id: 'swim', title: '童年', headline: '小伙伴约你去河边游泳', icon: 'water',
    desc: '夏日炎炎，几个孩子吆喝着要去北城外的河湾里扎猛子。',
    when: (c) => c.age >= 8 && c.age <= 15,
    options: [
      { label: '不去', hint: '稳妥', kind: 'safe', result: { text: '你留在家里，什么也没发生。' } },
      { label: '跟着去', hint: '有风险 · 可能强身', kind: 'risky', chance: 0.7, success: { health: 3, text: '玩得痛快，身体也结实了。' }, failure: { health: -10, text: '呛水溺水，被救上来时吓坏了。' } },
    ],
  },
  {
    id: 'delivery', title: '童年', headline: '邻居请你帮忙送一趟货', icon: 'box',
    desc: '杂货铺的老板腿脚不便，想请你把一筐货送到城东，说好给些跑腿钱。',
    when: (c) => c.age >= 8 && c.age <= 15,
    options: [
      { label: '推辞', hint: '稳妥', kind: 'safe', result: { text: '你婉言推辞了。' } },
      { label: '帮忙送货', hint: '有风险 · 能挣钱', kind: 'risky', chance: 0.6, success: { coins: 200, text: '货送到了，老板给了 200 ₽。' }, failure: { health: -5, text: '路上摔了一跤，膝盖磕破了。' } },
    ],
  },
  {
    id: 'soup', title: '生计', headline: '教会在码头边设了施粥棚', icon: 'bowl',
    desc: '队伍排得很长；另一边，码头的工头正在吆喝招人扛包。',
    when: (c) => c.classId === 'beggar',
    options: [
      { label: '排队领粥', hint: '稳妥 · 填饱肚子', kind: 'safe', result: { health: 3, text: '一碗热粥下肚，身上暖和多了。' } },
      { label: '去码头抢活', hint: '有风险 · 能挣钱', kind: 'risky', chance: 0.6, success: { coins: 300, text: '扛了一天包，挣到 300 ₽。' }, failure: { health: -5, text: '被货箱砸伤了肩膀。' } },
    ],
  },
  {
    id: 'lend', title: '人情', headline: '老朋友上门借钱', icon: 'hand',
    desc: '多年的朋友说生意周转不开，想借 5,000 ₽，承诺三个月后连本带利归还。',
    when: (c) => c.age >= 16,
    options: [
      { label: '婉言拒绝', hint: '稳妥', kind: 'safe', result: { text: '朋友有些失望地走了。' } },
      { label: '借给他', hint: '有风险 · 可能有利息', kind: 'risky', requires: 5000, chance: 0.6, success: { coins: 500, text: '朋友如约归还，还多给了 500 ₽ 利息。' }, failure: { coins: -5000, text: '朋友杳无音讯，5,000 ₽ 打了水漂。' } },
    ],
  },
  {
    id: 'gamble', title: '诱惑', headline: '有人邀你去地下赌局', icon: 'dice',
    desc: '酒馆后巷的赌坊灯火通明，听说昨天有人一夜翻了好几倍。',
    when: (c) => c.age >= 16,
    options: [
      { label: '不去', hint: '稳妥', kind: 'safe', result: { text: '你绕道回家了。' } },
      { label: '下注 2,000 ₽', hint: '高风险 · 可能翻倍', kind: 'risky', requires: 2000, chance: 0.45, success: { coins: 4000, text: '手气正旺，赢了 4,000 ₽！' }, failure: { coins: -2000, text: '输得精光，2,000 ₽ 没了。' } },
    ],
  },
  {
    id: 'overtime', title: '职场', headline: '工头要大家连夜加班赶工', icon: 'clock',
    desc: '一批急单必须在月底交货，加班有额外的工钱，但已经有人累倒了。',
    when: (c) => c.age >= 16 && c.employed,
    options: [
      { label: '准时下班', hint: '稳妥', kind: 'safe', result: { text: '你按时回家休息。' } },
      { label: '留下加班', hint: '有风险 · 多挣钱', kind: 'risky', chance: 0.7, success: { coins: 1500, text: '熬了几个通宵，多挣了 1,500 ₽。' }, failure: { coins: 1500, health: -6, text: '多挣了 1,500 ₽，但累倒在工位上。' } },
    ],
  },
  {
    id: 'mine_invest', title: '投资', headline: '蒸汽工矿实业公开募资！', icon: 'factory',
    desc: '商界伙伴引荐了一处新兴的蒸汽采矿项目，前期勘探充满未知，但若成功将带来丰厚分红。',
    when: (c) => c.age >= 18 && c.coins >= 20000,
    options: [
      { label: '不投', hint: '稳妥', kind: 'safe', result: { text: '你决定把钱留在手里。' } },
      { label: '投资 20,000 ₽', hint: '高风险 · 高回报', kind: 'risky', requires: 20000, chance: 0.55, success: { coins: 45000, text: '矿脉丰富，分红 45,000 ₽！' }, failure: { coins: -20000, text: '勘探失败，20,000 ₽ 血本无归。' } },
    ],
  },
  {
    id: 'relatives', title: '人情', headline: '远房亲戚登门拜访', icon: 'users',
    desc: '一位多年不见的远房表亲带着一家老小上门，说是路过来看看。',
    when: (c) => c.age >= 18,
    options: [
      { label: '设宴款待', hint: '花点钱', kind: 'safe', requires: 1000, result: { coins: -1000, text: '宾主尽欢，亲戚满意而归。' } },
      { label: '推说没空', hint: '有风险', kind: 'risky', chance: 0.6, success: { text: '亲戚识趣地走了。' }, failure: { coins: -2000, text: '亲戚赖着不走，临走还借走了 2,000 ₽。' } },
    ],
  },
  {
    id: 'old_injury', title: '健康', headline: '旧伤又隐隐作痛', icon: 'bandage',
    desc: '年轻时落下的旧伤，一到阴雨天就疼得厉害。',
    when: (c) => c.age >= 40,
    options: [
      { label: '找大夫看看', hint: '花钱养身', kind: 'safe', requires: 3000, result: { coins: -3000, health: 5, text: '大夫开了几副药，疼痛缓解了。' } },
      { label: '忍着', hint: '有风险 · 省钱', kind: 'risky', chance: 0.5, success: { text: '过几天自己就好了。' }, failure: { health: -10, text: '越拖越重，卧床半月。' } },
    ],
  },
  {
    id: 'partner_shop', title: '投资', headline: '老相识邀你合伙开铺子', icon: 'store',
    desc: '他看中了北城主街的一间铺面，想做皮货生意，还差 50,000 ₽ 本钱。',
    when: (c) => c.age >= 35 && c.coins >= 50000,
    options: [
      { label: '不参与', hint: '稳妥', kind: 'safe', result: { text: '你婉拒了合伙的邀请。' } },
      { label: '出资 50,000 ₽', hint: '高风险 · 高回报', kind: 'risky', requires: 50000, chance: 0.6, success: { coins: 90000, text: '生意兴隆，你分得 90,000 ₽。' }, failure: { coins: -50000, text: '铺子倒闭，50,000 ₽ 亏光。' } },
    ],
  },
  {
    id: 'elixir', title: '江湖', headline: '江湖郎中兜售「长寿丹」', icon: 'pill',
    desc: '一位白须郎中声称他的丹药能延年益寿，一颗要价 5,000 ₽。',
    when: (c) => c.age >= 60,
    options: [
      { label: '不买', hint: '稳妥', kind: 'safe', result: { text: '你摇摇头走开了。' } },
      { label: '买一颗', hint: '有风险 · 可能延寿', kind: 'risky', requires: 5000, chance: 0.3, success: { coins: -5000, health: 10, text: '居然真的精神矍铄起来。' }, failure: { coins: -5000, health: -5, text: '丹药里掺了铅粉，身体更差了。' } },
    ],
  },
  // ---------- 机遇：可能获得传家宝（第 34 题） ----------
  {
    id: 'army', title: '机遇', headline: '帝国军征兵告示贴满街头', icon: 'medal',
    desc: '南方边境局势紧张，帝国军正在招募志愿兵，服役期满者可获犒赏，作战英勇者更有勋章。',
    when: (c) => c.age >= 18 && c.age <= 35 && !c.ownedHeirlooms?.includes('army_medal'),
    options: [
      { label: '不报名', hint: '稳妥', kind: 'safe', result: { text: '你继续过着平静的日子。' } },
      { label: '应征入伍', hint: '高风险 · 可能获得勋章', kind: 'risky', chance: 0.6, success: { coins: 3000, heirloom: 'army_medal', text: '你在边境立下战功，荣获帝国军功勋章，退役时领到 3,000 ₽ 犒赏。' }, failure: { health: -20, text: '你在一次冲突中负伤，提前退役。' } },
    ],
  },
  {
    id: 'rescue', title: '机遇', headline: '有人在河边落水了！', icon: 'ring',
    desc: '一位衣着华贵的小姐失足落入湍急的河水，岸边围观的人群一阵惊呼。',
    when: (c) => c.age >= 16 && !c.ownedHeirlooms?.includes('rescue_ring'),
    options: [
      { label: '大声呼救', hint: '稳妥', kind: 'safe', result: { text: '巡捕赶来把人救了上来。' } },
      { label: '跳下去救人', hint: '有风险 · 可能结下贵人', kind: 'risky', chance: 0.5, success: { coins: 2000, heirloom: 'rescue_ring', text: '你把人救上了岸。她的家族登门道谢，赠予家徽戒指与 2,000 ₽。' }, failure: { health: -10, text: '水流太急，你被冲出好远才爬上岸，大病一场。' } },
    ],
  },
  {
    id: 'antique', title: '机遇', headline: '旧货摊上有一只蒙尘的怀表', icon: 'watch',
    desc: '摊主说这是从一位破落贵族家里收来的，要价 3,000 ₽，真假难辨。',
    when: (c) => c.age >= 16 && c.coins >= 3000 && !c.ownedHeirlooms?.includes('antique_watch'),
    options: [
      { label: '不买', hint: '稳妥', kind: 'safe', result: { text: '你摇摇头走开了。' } },
      { label: '花 3,000 ₽ 买下', hint: '有风险 · 可能是真古董', kind: 'risky', requires: 3000, chance: 0.4, success: { coins: -3000, heirloom: 'antique_watch', text: '经鉴定是真正的古董航海怀表！' }, failure: { coins: -3000, text: '拿去一验，原来是仿品。' } },
    ],
  },
  {
    id: 'grandkids', title: '天伦', headline: '孙辈们来看望你了', icon: 'baby',
    desc: '孩子们带着小孙子小孙女回家，一屋子热热闹闹。',
    when: (c) => c.age >= 60 && c.hasChildren,
    options: [
      { label: '发红包', hint: '花点钱 · 开心', kind: 'safe', requires: 1000, result: { coins: -1000, health: 3, text: '看着孩子们欢天喜地，你心情大好。' } },
      { label: '不发', hint: '无事', kind: 'risky', chance: 1, success: { text: '一家人吃了顿团圆饭。' }, failure: { text: '一家人吃了顿团圆饭。' } },
    ],
  },
];

export interface SimEventInstance {
  uid: string;
  defId: string;
  year: number;
  month: number;
}

export const eventDef = (inst: SimEventInstance): SimEventDef | undefined => SIM_EVENTS.find((e) => e.id === inst.defId);

/** 每月抽取：50% 概率从符合条件的事件中随机抽一张，否则返回 null（本月无事发生） */
// 同一事件的冷却：12 个月内不再出现，正在等待处理的事件也不会再抽到（避免一年内多条一模一样的日志）
export const EVENT_COOLDOWN_MONTHS = 12;
export const SIM_RECENT_KEY = 'amigo_sim_recent';

/** 事件 id → 最近一次出现的月份（年 × 12 + 月） */
export const readSimRecent = (): Record<string, number> => {
  try {
    const v = JSON.parse(localStorage.getItem(SIM_RECENT_KEY) || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
};

export const recordSimRecent = (defId: string, year: number, month: number) => {
  try {
    localStorage.setItem(SIM_RECENT_KEY, JSON.stringify({ ...readSimRecent(), [defId]: year * 12 + month }));
  } catch {}
};

export const rollMonthlyEvent = (
  ctx: SimContext,
  year: number,
  month: number,
  rng: () => number = Math.random,
  recent: Record<string, number> = {},
  pendingDefIds: string[] = [],
): SimEventInstance | null => {
  if (rng() >= EVENT_CHANCE) return null;
  const now = year * 12 + month;
  const pool = SIM_EVENTS.filter(
    (e) => e.when(ctx) && !pendingDefIds.includes(e.id) && !(recent[e.id] !== undefined && now - recent[e.id] < EVENT_COOLDOWN_MONTHS),
  );
  if (pool.length === 0) return null;
  const def = pool[Math.floor(rng() * pool.length)];
  return { uid: `${def.id}_${year}_${month}_${Math.floor(rng() * 1e6)}`, defId: def.id, year, month };
};

export interface Resolution {
  coins: number;
  health: number;
  score: number;
  text: string;
  /** 冒险选项是否成功（稳妥选项为 null） */
  succeeded: boolean | null;
  heirloom?: string;
}

export const resolveOption = (option: SimOption, rng: () => number = Math.random): Resolution => {
  if (option.kind === 'safe') {
    const r = option.result ?? { text: '' };
    return { coins: r.coins ?? 0, health: r.health ?? 0, score: SCORE_SAFE, text: r.text, succeeded: null, heirloom: r.heirloom };
  }
  const ok = rng() < (option.chance ?? 0.5);
  const r = (ok ? option.success : option.failure) ?? { text: '' };
  return { coins: r.coins ?? 0, health: r.health ?? 0, score: ok ? SCORE_RISK_SUCCESS : SCORE_RISK_FAILURE, text: r.text, succeeded: ok, heirloom: r.heirloom };
};

/** 选项是否因现金不足而不可选 */
export const optionBlocked = (option: SimOption, coins: number): string | null =>
  option.requires && coins < option.requires ? `现金不足（需 ${option.requires.toLocaleString()} ₽）` : null;
