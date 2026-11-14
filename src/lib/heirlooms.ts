// 传家宝（undefined.md 第 33、34 题，默认值）
// - 获得途径：拍卖会（随机开办，需门票或受邀）、「机遇」推演事件（如参军获得勋章）
// - 传家宝只作展示与收藏，不提供数值加成；估价计入家族资产（排行榜财力）
// - 传家宝属于家族：家族传承时保留

export type HeirloomQuality = '普通' | '稀有' | '史诗' | '传说';

export interface HeirloomDef {
  id: string;
  name: string;
  quality: HeirloomQuality;
  desc: string;
  /** 象征意义（展示用） */
  meaning: string;
  /** 估价（₽），计入家族资产 */
  value: number;
  icon: 'crown' | 'building' | 'shield' | 'medal' | 'watch' | 'ring' | 'book' | 'sword' | 'gem' | 'scroll' | 'vase' | 'map';
  /** 是否会出现在拍卖会上 */
  auctionable: boolean;
}

export const HEIRLOOMS: HeirloomDef[] = [
  // 瓦伦丁家族原有的三件
  { id: 'valentine_watch', name: '皇家工匠怀表', quality: '史诗', icon: 'watch', value: 800000, auctionable: false, desc: '祖父传承下来的金质双齿轮怀表，刻有皇家徽章。', meaning: '瓦伦丁匠艺传承的信物' },
  { id: 'valentine_deed', name: '瓦伦丁工坊地契', quality: '稀有', icon: 'building', value: 1500000, auctionable: false, desc: '首都中央大街7号机械工坊的地契与产权文书。', meaning: '家族产业的根基' },
  { id: 'valentine_badge', name: '名流社交勋章', quality: '稀有', icon: 'shield', value: 300000, auctionable: false, desc: '帝国皇室授予瓦伦丁家族的勋章，象征名门荣誉。', meaning: '名门荣誉的象征' },

  // 机遇事件
  { id: 'army_medal', name: '帝国军功勋章', quality: '稀有', icon: 'medal', value: 60000, auctionable: false, desc: '服役期间因作战英勇而获授的银质勋章。', meaning: '保家卫国的荣光' },
  { id: 'rescue_ring', name: '贵族谢恩戒指', quality: '稀有', icon: 'ring', value: 120000, auctionable: false, desc: '救下落水的贵族小姐后，对方家族赠予的家徽戒指。', meaning: '一段义举的见证' },
  { id: 'antique_watch', name: '古董航海怀表', quality: '普通', icon: 'watch', value: 30000, auctionable: true, desc: '旧货摊上淘来的航海怀表，表盖内刻着一艘帆船。', meaning: '慧眼识珠' },

  // 拍卖会
  { id: 'persian_vase', name: '波斯青金石花瓶', quality: '稀有', icon: 'vase', value: 200000, auctionable: true, desc: '据说出自第一次波阿战争后波斯宫廷流出的珍藏。', meaning: '异域珍宝' },
  { id: 'khan_sword', name: '汗国镶金弯刀', quality: '史诗', icon: 'sword', value: 900000, auctionable: true, desc: '达尔米莱克汗国旧物，刀柄镶有红宝石。', meaning: '草原的记忆' },
  { id: 'old_map', name: '圣阿米诺斯帝国古地图', quality: '史诗', icon: 'map', value: 1200000, auctionable: true, desc: '绘制于卡罗尼亚建国之前的羊皮古地图。', meaning: '故土的轮廓' },
  { id: 'epic_manuscript', name: '《伊巴什史诗》手抄本', quality: '传说', icon: 'book', value: 5000000, auctionable: true, desc: '流传数百年的伊巴什史诗古抄本，存世极少。', meaning: '民族记忆的传承' },
  { id: 'amber_necklace', name: '里海琥珀项链', quality: '普通', icon: 'gem', value: 50000, auctionable: true, desc: '里海沿岸出产的蜜蜡琥珀，色泽温润。', meaning: '家人的祝福' },
  { id: 'imperial_edict', name: '纳海王朝敕令卷轴', quality: '传说', icon: 'scroll', value: 8000000, auctionable: true, desc: '盖有帝皇玉玺的敕令原件，流落民间多年。', meaning: '王朝兴衰的见证' },
  { id: 'silver_tea_set', name: '俄式银质茶炊', quality: '普通', icon: 'vase', value: 40000, auctionable: true, desc: '图拉工匠打造的银质茶炊，配整套茶具。', meaning: '待客之道' },
  { id: 'royal_crown_jewel', name: '宝冠遗珠', quality: '传说', icon: 'crown', value: 12000000, auctionable: true, desc: '据传是某位汗王宝冠上脱落的明珠。', meaning: '无上的尊荣' },
];

export const QUALITY_STYLE: Record<HeirloomQuality, string> = {
  普通: 'bg-gray-800/80 text-gray-300 border-gray-500',
  稀有: 'bg-blue-900/80 text-blue-300 border-blue-500',
  史诗: 'bg-purple-900/80 text-purple-300 border-purple-500',
  传说: 'bg-amber-900/80 text-amber-300 border-amber-500',
};

export const heirloomById = (id: string) => HEIRLOOMS.find((h) => h.id === id);

export interface OwnedHeirloom {
  id: string;
  /** 获得途径，例如「拍卖会」「参军」「祖传」 */
  source: string;
  year: number;
  month: number;
  /** 保管人（展示用） */
  keeper?: string;
}

export const VALENTINE_DEFAULT_HEIRLOOMS: OwnedHeirloom[] = [
  { id: 'valentine_watch', source: '祖传', year: 1860, month: 1, keeper: '维克多 (父亲)' },
  { id: 'valentine_deed', source: '祖传', year: 1860, month: 1, keeper: '家族共有' },
  { id: 'valentine_badge', source: '祖传', year: 1860, month: 1, keeper: '当家人' },
];

export const heirloomsValue = (owned: OwnedHeirloom[]) => owned.reduce((s, o) => s + (heirloomById(o.id)?.value ?? 0), 0);

// ---------- 拍卖会 ----------

/** 每月开办拍卖会的概率 */
export const AUCTION_CHANCE = 0.12;
export const TICKET_PRICE = 2000;
/** 受邀条件：贵族、皇族，或声望 ≥ 40 */
export const INVITE_REPUTATION = 40;
export const LOTS_PER_AUCTION = 3;

export interface AuctionLot {
  heirloomId: string;
  startPrice: number;
  /** 其他竞买人的最高出价（不公开） */
  rivalMax: number;
  /** 'open' 未出价 / 'won' 拍得 / 'lost' 落败 */
  status: 'open' | 'won' | 'lost';
  paid?: number;
}

export interface Auction {
  year: number;
  month: number;
  invited: boolean;
  /** 是否已取得入场资格（受邀或已买门票） */
  admitted: boolean;
  lots: AuctionLot[];
}

export const AUCTION_KEY = 'amigo_auction';

export const isInvited = (classId: string, reputation: number) =>
  classId === 'noble' || classId === 'royal' || reputation >= INVITE_REPUTATION;

/** 生成一场拍卖会：从未拥有、可拍卖的传家宝中抽取 3 件 */
export const generateAuction = (
  year: number,
  month: number,
  ownedIds: string[],
  invited: boolean,
  rng: () => number = Math.random,
): Auction | null => {
  const pool = HEIRLOOMS.filter((h) => h.auctionable && !ownedIds.includes(h.id));
  if (pool.length === 0) return null;
  const picked: HeirloomDef[] = [];
  const candidates = [...pool];
  while (picked.length < LOTS_PER_AUCTION && candidates.length > 0) {
    picked.push(candidates.splice(Math.floor(rng() * candidates.length), 1)[0]);
  }
  return {
    year,
    month,
    invited,
    admitted: invited,
    lots: picked.map((h) => ({
      heirloomId: h.id,
      startPrice: Math.round(h.value * 0.6),
      rivalMax: Math.round(h.value * (0.8 + rng() * 0.7)),
      status: 'open',
    })),
  };
};

/** 封闭式出价：出价不低于起拍价；不低于其他竞买人的最高出价即拍得 */
export const placeBid = (lot: AuctionLot, bid: number): { lot: AuctionLot; won: boolean; error?: string } => {
  if (lot.status !== 'open') return { lot, won: false, error: '这件拍品已经结束竞拍' };
  if (!Number.isFinite(bid) || bid < lot.startPrice) return { lot, won: false, error: `出价不能低于起拍价 ${lot.startPrice.toLocaleString()} ₽` };
  const won = bid >= lot.rivalMax;
  return { lot: { ...lot, status: won ? 'won' : 'lost', paid: won ? bid : undefined }, won };
};
