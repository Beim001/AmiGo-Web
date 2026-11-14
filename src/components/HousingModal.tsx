import { addLifeLog } from '../lib/lifeLog';
import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Home,
  Building2,
  Key,
  CircleDollarSign,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MapPin,
  TrendingUp,
  Hammer,
  BadgePercent,
  Coins,
  FileCheck,
  ArrowRight,
  Maximize2,
  Trash2,
  Award,
  Crown,
  Heart,
  Landmark,
  Compass,
  Layers,
  ArrowUpDown,
  X,
  Info,
  Calendar,
  ShieldAlert,
  Percent,
} from 'lucide-react';

export interface PropertyItem {
  id: string;
  title: string;
  district: string;
  category: '住宅公寓' | '独栋公馆' | '商住洋楼' | '豪华庄园' | '地标商业';
  price: number;
  rentPerMonth: number;
  area: number; // 平米
  comfortBonus: number; // 每月健康/体魄恢复增益
  renovationTier: number; // 0: 毛坯/简装, 1: 舒适精装, 2: 典雅欧陆, 3: 豪华顶配
  layout: string; // 户型
  floor: string; // 楼层
  orientation: string; // 朝向
  unitType: string; // 户型简称
  tags: string[]; // 特色标签
  description: string;
  features: string[];
}

export interface OwnedProperty {
  id: string; // instance unique id
  propertyId: string; // template id
  title: string;
  district: string;
  category: string;
  purchasePrice: number;
  currentValue: number;
  rentPerMonth: number;
  renovationTier: number; // 0..3
  isRentedOut: boolean;
  isPrimaryResidence: boolean;
  purchaseYear: number;
  purchaseMonth: number;
  totalRentCollected: number;
}

export interface CurrentRental {
  propertyId: string;
  title: string;
  district: string;
  monthlyRent: number;
  depositPaid: number;
  startYear: number;
  startMonth: number;
  comfortBonus: number;
}

export const HOUSING_MARKET_PROPERTIES: PropertyItem[] = [
  {
    id: 'prop_worker_room',
    title: '工人新村红砖公寓',
    district: '工业区西街',
    category: '住宅公寓',
    price: 8500,
    rentPerMonth: 280,
    area: 36,
    comfortBonus: 2,
    renovationTier: 0,
    layout: '1室0厅1卫',
    floor: '3/5层',
    orientation: '南向',
    unitType: '一居单室',
    tags: ['低总价', '独立供暖', '近工务段', '采光充沛'],
    description: '工厂区附近的红砖单间公寓，煤气管道与供暖齐全，适合工薪阶层自住或租住。',
    features: ['独立水龙头', '煤炭壁炉采暖', '近火车站与车间'],
  },
  {
    id: 'prop_pushkin_apt',
    title: '林荫道双室公寓',
    district: '文化老城区',
    category: '住宅公寓',
    price: 32000,
    rentPerMonth: 950,
    area: 68,
    comfortBonus: 5,
    renovationTier: 1,
    layout: '2室1厅1卫',
    floor: '2/4层',
    orientation: '南北通透',
    unitType: '二居双室',
    tags: ['核心地段', '挑高3.6米', '双阳台', '近大剧院'],
    description: '老城区核心地段双室公寓，挑高3.6米，配备实木人字拼地板与独立盥洗室，生活便利。',
    features: ['实木地板', '独立临街阳台', '步行至大剧院与书店'],
  },
  {
    id: 'prop_neva_rowhouse',
    title: '河畔临水商住洋楼',
    district: '港务商贸区',
    category: '商住洋楼',
    price: 98000,
    rentPerMonth: 2800,
    area: 145,
    comfortBonus: 10,
    renovationTier: 1,
    layout: '3室2厅2卫',
    floor: '1-3层联排',
    orientation: '临河一线',
    unitType: '三层联排',
    tags: ['商住两用', '临街底商', '一线河景', '带储酒窖'],
    description: '三层砖石联排洋楼，一层可作商铺，二三层为宽敞居住区，推窗即可俯瞰河畔货船。',
    features: ['一层独立临街商铺', '河景露台', '地下储酒地窖'],
  },
  {
    id: 'prop_imperial_mansion',
    title: '林荫大道独栋公馆',
    district: '使馆林荫区',
    category: '独栋公馆',
    price: 360000,
    rentPerMonth: 9800,
    area: 320,
    comfortBonus: 18,
    renovationTier: 2,
    layout: '5室3厅4卫',
    floor: '独栋地上2层+地下1层',
    orientation: '全向采光',
    unitType: '独栋公馆',
    tags: ['私家花园', '大理石壁炉', '喷泉庭院', '仆人套房'],
    description: '新古典主义风格双层私家公馆，配备专属喷泉庭院、大理石壁炉及佣人套房。',
    features: ['私家马车喷泉庭院', '大理石旋转楼梯', '仆人与马夫套房'],
  },
  {
    id: 'prop_royal_estate',
    title: '近郊私家庄园',
    district: '近郊自然区',
    category: '豪华庄园',
    price: 950000,
    rentPerMonth: 26000,
    area: 880,
    comfortBonus: 30,
    renovationTier: 3,
    layout: '8室4厅6卫',
    floor: '独栋主楼+独立副楼',
    orientation: '全南向景',
    unitType: '传世庄园',
    tags: ['独立林场', '私家马厩', '温泉暖房', '私家猎场'],
    description: '拥有独立橡木林猎场与葡萄园的私家庄园，配有私家马厩、温泉暖房及全套银器餐厅。',
    features: ['独立猎场与葡萄园', '温泉暖房私家花园', '传世艺术品陈列厅'],
  },
  {
    id: 'prop_central_plaza',
    title: '第一中央商务大厦',
    district: '金融中心商务区',
    category: '地标商业',
    price: 2800000,
    rentPerMonth: 75000,
    area: 2100,
    comfortBonus: 50,
    renovationTier: 3,
    layout: '整栋商务写字楼',
    floor: '地上7层全框架',
    orientation: '四面全景',
    unitType: '地标商务',
    tags: ['地标建筑', '蒸汽电梯', '高租售比', '机构入驻'],
    description: '七层地标性钢构石材商业大厦，入驻各大银行与商行。',
    features: ['蒸汽电梯驱动系统', '顶层全景套房', '汇聚各大跨国洋行'],
  },
];

const RENOVATION_TIER_NAMES = ['毛坯简装', '舒适精装', '典雅欧陆', '豪华顶配'];
const RENOVATION_COST_RATIO = [0, 0.1, 0.25, 0.45]; // 占买入价比例
const RENOVATION_VALUE_BONUS = [1.0, 1.18, 1.45, 1.85]; // 增值倍数
const RENOVATION_RENT_BONUS = [1.0, 1.25, 1.6, 2.2]; // 租金倍数

export interface HousingModalProps {
  onClose: () => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  gameYear: number;
  gameMonth: number;
  isRegistered: boolean;
  playerName: string;
  health: number;
  setHealth: React.Dispatch<React.SetStateAction<number>>;
  onOpenBirth?: () => void;
}

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'yield_desc' | 'unit_price_asc';

export const HousingModal: React.FC<HousingModalProps> = ({
  onClose,
  coins,
  setCoins,
  gameYear,
  gameMonth,
  isRegistered,
  playerName,
  health,
  setHealth,
  onOpenBirth,
}) => {
  const [activeTab, setActiveTab] = useState<'market' | 'owned' | 'rent' | 'stats'>('market');
  const [categoryFilter, setCategoryFilter] = useState<string>('全部');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [selectedPropDetail, setSelectedPropDetail] = useState<PropertyItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 1. 持久化拥有的房产列表
  const [ownedProperties, setOwnedProperties] = useState<OwnedProperty[]>(() => {
    try {
      const saved = localStorage.getItem('amigo_owned_properties');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // 2. 当前租住信息（如未买房可租房住）
  const [currentRental, setCurrentRental] = useState<CurrentRental | null>(() => {
    try {
      const saved = localStorage.getItem('amigo_current_rental');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // 同步本地存储
  useEffect(() => {
    try {
      localStorage.setItem('amigo_owned_properties', JSON.stringify(ownedProperties));
    } catch {}
  }, [ownedProperties]);

  useEffect(() => {
    try {
      if (currentRental) {
        localStorage.setItem('amigo_current_rental', JSON.stringify(currentRental));
      } else {
        localStorage.removeItem('amigo_current_rental');
      }
    } catch {}
  }, [currentRental]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  // 统计数据
  const totalPropertyValue = ownedProperties.reduce((sum, p) => sum + p.currentValue, 0);
  const totalMonthlyRentalIncome = ownedProperties
    .filter((p) => p.isRentedOut)
    .reduce((sum, p) => sum + p.rentPerMonth, 0);
  const totalRentCollectedAllTime = ownedProperties.reduce(
    (sum, p) => sum + p.totalRentCollected,
    0
  );

  // 当前住址名称
  const primaryOwned = ownedProperties.find((p) => p.isPrimaryResidence);
  const currentResidenceName = primaryOwned
    ? `${primaryOwned.title} (${primaryOwned.district})`
    : currentRental
    ? `${currentRental.title} [租住]`
    : '暂无固定住所 (客栈/散居)';

  // 购买房产
  const handleBuyProperty = (item: PropertyItem) => {
    if (!isRegistered) {
      showToast('请先办理出生登记完成实名登记后再购置房产');
      return;
    }

    if (coins < item.price) {
      showToast(`资金不足：需 ${item.price.toLocaleString()} ₽，当前可用 ${coins.toLocaleString()} ₽`);
      return;
    }

    // 扣除现金
    setCoins((prev) => prev - item.price);

    const isFirst = ownedProperties.length === 0;
    const newOwned: OwnedProperty = {
      id: `owned_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      propertyId: item.id,
      title: item.title,
      district: item.district,
      category: item.category,
      purchasePrice: item.price,
      currentValue: item.price,
      rentPerMonth: item.rentPerMonth,
      renovationTier: item.renovationTier,
      isRentedOut: false,
      isPrimaryResidence: isFirst, // 第一次购房默认入住
      purchaseYear: gameYear,
      purchaseMonth: gameMonth,
      totalRentCollected: 0,
    };

    setOwnedProperties((prev) => [newOwned, ...prev]);

    // 如果之前有租房且设置为主居所，可自动退租
    if (isFirst && currentRental) {
      setCurrentRental(null);
    }

    addLifeLog('财富', `购入房产「${item.title}」`, `位于${item.district}，花费 ${item.price.toLocaleString()} ₽。`);
    showToast(`成功购入【${item.title}】，产权已录入系统`);
    setSelectedPropDetail(null);
    setActiveTab('owned');
  };

  // 出售房产
  const handleSellProperty = (owned: OwnedProperty) => {
    const refund = Math.floor(owned.currentValue * 0.96); // 扣除4%交易税费
    setCoins((prev) => prev + refund);
    setOwnedProperties((prev) => {
      const remaining = prev.filter((p) => p.id !== owned.id);
      // 如果卖掉的是主居所，迁入剩余房产中第一套未出租的住宅（返回新对象，不直接修改 state）
      if (!owned.isPrimaryResidence) return remaining;
      const nextPrimaryId = remaining.find((p) => !p.isRentedOut)?.id;
      return remaining.map((p) => (p.id === nextPrimaryId ? { ...p, isPrimaryResidence: true } : p));
    });

    addLifeLog('财富', `出售房产「${owned.title}」`, `扣除交易税费后到账 ${refund.toLocaleString()} ₽。`);
    showToast(`成功出售【${owned.title}】，扣除4%交易税费后到账 +${refund.toLocaleString()} ₽`);
  };

  // 切换出租状态
  const handleToggleRentOut = (owned: OwnedProperty) => {
    if (owned.isPrimaryResidence && !owned.isRentedOut) {
      showToast('该房产当前为您自住的主要居所，若要出租请先将主要居所切换至其他住宅');
      return;
    }

    setOwnedProperties((prev) =>
      prev.map((p) => {
        if (p.id === owned.id) {
          const nextState = !p.isRentedOut;
          return { ...p, isRentedOut: nextState };
        }
        return p;
      })
    );

    showToast(
      owned.isRentedOut
        ? `【${owned.title}】已收回自用，停止出租`
        : `【${owned.title}】已挂牌出租，预计每月租金 +${owned.rentPerMonth.toLocaleString()} ₽`
    );
  };

  // 设为主要居所
  const handleSetPrimary = (owned: OwnedProperty) => {
    if (owned.isRentedOut) {
      showToast('该房产正在出租中，无法直接设为自住居所，请先收回房屋');
      return;
    }

    setOwnedProperties((prev) =>
      prev.map((p) => ({
        ...p,
        isPrimaryResidence: p.id === owned.id,
      }))
    );

    // 清空租房状态
    if (currentRental) {
      setCurrentRental(null);
    }

    showToast(`已迁入【${owned.title}】并设为主要居所`);
  };

  // 翻新升级房产
  const handleUpgradeRenovation = (owned: OwnedProperty) => {
    if (owned.renovationTier >= 3) {
      showToast('该房产已达到最高装潢等级【豪华顶配】，无需继续翻新');
      return;
    }

    const nextTier = owned.renovationTier + 1;
    const cost = Math.floor(owned.purchasePrice * RENOVATION_COST_RATIO[nextTier]);

    if (coins < cost) {
      showToast(`装修资金不足：升级至【${RENOVATION_TIER_NAMES[nextTier]}】需 ${cost.toLocaleString()} ₽`);
      return;
    }

    setCoins((prev) => prev - cost);
    setOwnedProperties((prev) =>
      prev.map((p) => {
        if (p.id === owned.id) {
          const updatedValue = Math.floor(p.purchasePrice * RENOVATION_VALUE_BONUS[nextTier]);
          const updatedRent = Math.floor(
            (HOUSING_MARKET_PROPERTIES.find((item) => item.id === p.propertyId)?.rentPerMonth ||
              p.rentPerMonth) * RENOVATION_RENT_BONUS[nextTier]
          );
          return {
            ...p,
            renovationTier: nextTier,
            currentValue: updatedValue,
            rentPerMonth: updatedRent,
          };
        }
        return p;
      })
    );

    showToast(`装修完成：【${owned.title}】已升级至【${RENOVATION_TIER_NAMES[nextTier]}】`);
  };

  // 租赁签约
  const handleSignRentalLease = (item: PropertyItem) => {
    if (!isRegistered) {
      showToast('请先办理出生登记完成实名登记');
      return;
    }

    const deposit = item.rentPerMonth * 2; // 押二付一 (首次预付押金)
    if (coins < deposit) {
      showToast(`资金不足：签约需预付押金与租金共 ${deposit.toLocaleString()} ₽`);
      return;
    }

    setCoins((prev) => prev - deposit);
    setCurrentRental({
      propertyId: item.id,
      title: item.title,
      district: item.district,
      monthlyRent: item.rentPerMonth,
      depositPaid: deposit,
      startYear: gameYear,
      startMonth: gameMonth,
      comfortBonus: item.comfortBonus,
    });

    // 清除主居所自有标记
    setOwnedProperties((prev) =>
      prev.map((p) => ({
        ...p,
        isPrimaryResidence: false,
      }))
    );

    addLifeLog('财富', `租住「${item.title}」`, `位于${item.district}，月租 ${item.rentPerMonth.toLocaleString()} ₽。`);
    showToast(`已签约租住【${item.title}】，已支付押金与首期租金 ${deposit.toLocaleString()} ₽`);
    setActiveTab('rent');
  };

  // 终止租赁
  const handleTerminateLease = () => {
    if (!currentRental) return;
    const refund = Math.floor(currentRental.depositPaid * 0.5); // 退还一半押金
    setCoins((prev) => prev + refund);
    showToast(`已办理退租手续，退还租房押金 +${refund.toLocaleString()} ₽`);
    setCurrentRental(null);
  };

  // 筛选与排序
  const filteredAndSortedProperties = HOUSING_MARKET_PROPERTIES.filter((p) => {
    if (categoryFilter === '全部') return true;
    return p.category === categoryFilter;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'yield_desc') {
      const yieldA = (a.rentPerMonth * 12) / a.price;
      const yieldB = (b.rentPerMonth * 12) / b.price;
      return yieldB - yieldA;
    }
    if (sortBy === 'unit_price_asc') {
      return a.price / a.area - b.price / b.area;
    }
    return 0; // default
  });

  return (
    <div className="absolute inset-0 bg-[#12141c] flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-200 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-black font-black text-xs px-4 py-2 rounded-xl border-2 border-black shadow-[0_3px_0_#000] animate-in fade-in slide-in-from-top-2 duration-200 text-center max-w-[90%] truncate">
          {toastMsg}
        </div>
      )}

      {/* Top Header Bar */}
      <div className="relative w-full h-15 bg-[#1a1d28] border-b-2 border-black shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20 flex items-center justify-between px-4 flex-shrink-0">
        <button
          onClick={() => {
            if (selectedPropDetail) {
              setSelectedPropDetail(null);
            } else {
              onClose();
            }
          }}
          className="p-2 bg-[#262939] hover:bg-[#32364a] border-2 border-black rounded-xl active:translate-y-0.5 shadow-[0_2px_0_#000] cursor-pointer text-white flex items-center justify-center transition-all z-10 gap-1 text-xs font-bold"
        >
          <ChevronLeft size={20} className="text-white" strokeWidth={3} />
          {selectedPropDetail && <span className="hidden sm:inline">返回</span>}
        </button>

        <div className="flex-1 flex items-center justify-center pointer-events-none px-2">
          <div className="bg-[#242738] border-2 border-amber-500/80 px-4 py-1.5 rounded-xl shadow-[0_2px_0_#000] flex items-center gap-2 max-w-[220px]">
            <Building2 size={16} className="text-amber-400 flex-shrink-0" />
            <span className="text-amber-300 text-sm font-black tracking-wider truncate">
              {selectedPropDetail ? `${selectedPropDetail.title} · 房源详情` : '住房地产'}
            </span>
          </div>
        </div>

        <div className="flex items-center bg-[#141622] rounded-xl px-3.5 py-1.5 border-2 border-black text-xs font-mono font-black z-10 shadow-[0_2px_0_#000] gap-1.5">
          <CircleDollarSign size={15} className="text-yellow-400" />
          <span className="text-amber-300">{coins.toLocaleString()} ₽</span>
        </div>
      </div>

      {/* Category Navigation Tabs */}
      {!selectedPropDetail && (
        <div className="bg-[#181a24] border-b-2 border-black px-3.5 py-2.5 flex items-center justify-between gap-2 flex-shrink-0 overflow-x-auto no-scrollbar">
          {[
            { id: 'market', label: '房产市场', icon: Building2, count: HOUSING_MARKET_PROPERTIES.length },
            { id: 'owned', label: '我的房产', icon: Home, count: ownedProperties.length },
            { id: 'rent', label: '租房', icon: Key, count: currentRental ? 1 : 0 },
            { id: 'stats', label: '行情概况', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedPropDetail(null);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-400 text-black border-black font-black'
                    : 'bg-[#222533] text-gray-400 hover:text-white hover:bg-[#2a2e3f]'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-black' : 'text-gray-400'} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ml-0.5 ${
                      isActive ? 'bg-black text-amber-300' : 'bg-black/50 text-gray-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar bg-[#141620]">
        {selectedPropDetail ? (
          (() => {
            const isOwned = ownedProperties.some((p) => p.propertyId === selectedPropDetail.id);
            const unitPrice = Math.round(selectedPropDetail.price / selectedPropDetail.area);
            const annualYield = ((selectedPropDetail.rentPerMonth * 12 * 100) / selectedPropDetail.price).toFixed(1);
            const isCurrentRenting = currentRental && currentRental.propertyId === selectedPropDetail.id;

            return (
              <div className="space-y-4 max-w-2xl mx-auto pb-6">
                {/* Hero Header Card */}
                <div className="bg-[#202331] border-2 border-black rounded-2xl p-4 sm:p-5 shadow-[0_3px_0_#000] space-y-4">
                  <div className="flex items-start justify-between gap-3 border-b border-black/60 pb-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-md bg-[#2b2f42] text-gray-200 border border-black/40">
                          {selectedPropDetail.category}
                        </span>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {selectedPropDetail.district}
                        </span>
                        {isOwned ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            <span>名下已持有</span>
                          </span>
                        ) : isCurrentRenting ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-950/60 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                            <Key size={12} />
                            <span>当前正在承租</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                            在售中
                          </span>
                        )}
                      </div>
                      <h2 className="text-white font-black text-lg sm:text-xl tracking-wide">
                        {selectedPropDetail.title}
                      </h2>
                    </div>
                  </div>

                  {/* Pricing & Valuation Dashboard */}
                  <div className="bg-[#161823] p-4 rounded-2xl border border-black grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono shadow-inner">
                    <div className="space-y-0.5">
                      <div className="text-gray-400 text-[10px] font-sans">挂牌总价</div>
                      <div className="text-amber-300 font-black text-base sm:text-lg truncate">
                        {selectedPropDetail.price.toLocaleString()} ₽
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-gray-400 text-[10px] font-sans">参考单价</div>
                      <div className="text-gray-200 font-bold text-sm sm:text-base">
                        {unitPrice.toLocaleString()} ₽/㎡
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-gray-400 text-[10px] font-sans">基准月租预估</div>
                      <div className="text-emerald-400 font-bold text-sm sm:text-base">
                        {selectedPropDetail.rentPerMonth.toLocaleString()} ₽/月
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-gray-400 text-[10px] font-sans">年化租金回报</div>
                      <div className="text-purple-300 font-bold text-sm sm:text-base">
                        ~{annualYield}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Core Specifications Table */}
                <div className="bg-[#202331] border-2 border-black rounded-2xl p-4 sm:p-5 shadow-[0_3px_0_#000] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-white border-b border-black/60 pb-2.5">
                    <Building2 size={16} className="text-amber-400" />
                    <span>建筑参数与规格</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-sans">
                    <div className="bg-[#161823] p-2.5 rounded-xl border border-black space-y-0.5">
                      <span className="text-gray-400 text-[10px]">建筑面积：</span>
                      <div className="font-mono font-bold text-white text-sm">{selectedPropDetail.area} ㎡</div>
                    </div>
                    <div className="bg-[#161823] p-2.5 rounded-xl border border-black space-y-0.5">
                      <span className="text-gray-400 text-[10px]">房屋户型：</span>
                      <div className="font-bold text-white text-sm">{selectedPropDetail.layout}</div>
                    </div>
                    <div className="bg-[#161823] p-2.5 rounded-xl border border-black space-y-0.5">
                      <span className="text-gray-400 text-[10px]">房屋朝向：</span>
                      <div className="font-bold text-white text-sm">{selectedPropDetail.orientation}</div>
                    </div>
                    <div className="bg-[#161823] p-2.5 rounded-xl border border-black space-y-0.5">
                      <span className="text-gray-400 text-[10px]">所在楼层：</span>
                      <div className="font-bold text-white text-sm">{selectedPropDetail.floor}</div>
                    </div>
                    <div className="bg-[#161823] p-2.5 rounded-xl border border-black space-y-0.5">
                      <span className="text-gray-400 text-[10px]">居住健康加成：</span>
                      <div className="font-bold text-blue-300 text-sm">+{selectedPropDetail.comfortBonus} / 月</div>
                    </div>
                    <div className="bg-[#161823] p-2.5 rounded-xl border border-black space-y-0.5">
                      <span className="text-gray-400 text-[10px]">产权归属：</span>
                      <div className="font-bold text-amber-300 text-sm">永久产权 · 独立地契</div>
                    </div>
                  </div>
                </div>

                {/* Description & Narrative */}
                <div className="bg-[#202331] border-2 border-black rounded-2xl p-4 sm:p-5 shadow-[0_3px_0_#000] space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 font-black text-white border-b border-black/60 pb-2">
                    <FileCheck size={16} className="text-emerald-400" />
                    <span>房源描述与区位环境</span>
                  </div>
                  <p className="text-gray-300 bg-[#161823] p-3.5 rounded-2xl border border-black/60 leading-relaxed font-sans">
                    {selectedPropDetail.description}
                  </p>
                </div>

                {/* Features & Equipment Highlights */}
                <div className="bg-[#202331] border-2 border-black rounded-2xl p-4 sm:p-5 shadow-[0_3px_0_#000] space-y-3 text-xs">
                  <div className="flex items-center gap-2 font-black text-white border-b border-black/60 pb-2">
                    <Sparkles size={16} className="text-amber-400" />
                    <span>核心配套与特色</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedPropDetail.features.map((feat, i) => (
                      <div
                        key={i}
                        className="bg-[#161823] p-2.5 rounded-xl border border-black flex items-center gap-2 text-gray-200"
                      >
                        <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                        <span className="text-xs font-medium">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legal & Policy Notice */}
                <div className="bg-[#202331] border-2 border-black rounded-2xl p-4 sm:p-5 shadow-[0_3px_0_#000] space-y-2 text-xs">
                  <div className="text-gray-400 font-bold flex items-center gap-1.5">
                    <Info size={14} className="text-amber-400" />
                    <span>交易及权益说明</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-gray-300 leading-relaxed font-sans text-[11px]">
                    <li>购买成功后自动办理土地房屋地契登记，永久持有。</li>
                    <li>设为【主要居所】可享受每月体魄健康加成；挂牌出租则于跨月时结算月租。</li>
                    <li>挂牌出售房产由城市不动产交易中心统筹承接，扣除 4% 交易契税后即时到账。</li>
                  </ul>
                </div>

                {/* Bottom Sticky Action Bar */}
                <div className="bg-[#1a1d28] border-2 border-black rounded-2xl p-3.5 sm:p-4 shadow-[0_4px_0_#000] flex items-center justify-between gap-3 sticky bottom-2 z-30">
                  <button
                    type="button"
                    onClick={() => setSelectedPropDetail(null)}
                    className="px-4 py-2.5 bg-[#262939] hover:bg-[#32364a] text-gray-200 border-2 border-black rounded-xl text-xs font-black shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer transition-all"
                  >
                    返回列表
                  </button>

                  <div className="flex items-center gap-2 flex-1 justify-end">
                    {isOwned ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPropDetail(null);
                          setActiveTab('owned');
                        }}
                        className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black border-2 border-black rounded-xl text-xs font-black shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        <Home size={15} />
                        <span>前往【我的房产】管理</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSignRentalLease(selectedPropDetail)}
                          disabled={!isRegistered}
                          className={`py-2.5 px-3.5 rounded-xl border-2 border-black text-xs font-black shadow-[0_2px_0_#000] active:translate-y-0.5 transition-all flex items-center gap-1.5 ${
                            !isRegistered
                              ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed opacity-60'
                              : 'bg-[#2b2f42] hover:bg-[#363c55] text-white cursor-pointer'
                          }`}
                        >
                          <Key size={14} />
                          <span>签约租房 ({(selectedPropDetail.rentPerMonth * 3).toLocaleString()}₽)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleBuyProperty(selectedPropDetail)}
                          disabled={!isRegistered || coins < selectedPropDetail.price}
                          className={`py-2.5 px-4 rounded-xl border-2 border-black text-xs font-black shadow-[0_2px_0_#000] active:translate-y-0.5 transition-all flex items-center gap-1.5 ${
                            !isRegistered || coins < selectedPropDetail.price
                              ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed opacity-60'
                              : 'bg-amber-400 hover:bg-amber-300 text-black cursor-pointer'
                          }`}
                        >
                          <Coins size={14} />
                          <span>立即全款购买 ({selectedPropDetail.price.toLocaleString()} ₽)</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <>
            {/* Unregistered Citizen Notice */}
            {!isRegistered && (
              <div className="bg-[#222534] border-2 border-black rounded-2xl p-4 text-center space-y-2.5 shadow-[0_3px_0_#000]">
                <div className="flex items-center justify-center gap-1.5 text-amber-400 font-black text-xs">
                  <AlertCircle size={16} />
                  <span>尚未完成出生登记</span>
                </div>
                <p className="text-gray-300 text-xs leading-relaxed max-w-md mx-auto">
                  暂未取得公民身份编号，仅可浏览房产信息。完成登记后即可办理房产买卖与租赁。
                </p>
                {onOpenBirth && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenBirth();
                    }}
                    className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs py-2 px-4 rounded-xl border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer inline-flex items-center gap-1.5 mt-1"
                  >
                    <Sparkles size={14} />
                    <span>前往登记出生证明</span>
                  </button>
                )}
              </div>
            )}

        {/* TAB 1: 房产市场 */}
        {activeTab === 'market' && (
          <div className="space-y-3.5">
            {/* Filter and Sort Toolbar */}
            <div className="space-y-2.5">
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar text-xs font-bold">
                {['全部', '住宅公寓', '商住洋楼', '独栋公馆', '豪华庄园', '地标商业'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-xl border-2 border-black transition-all cursor-pointer whitespace-nowrap shadow-[0_2px_0_#000] active:translate-y-0.5 text-xs ${
                      categoryFilter === cat
                        ? 'bg-amber-400 text-black font-black'
                        : 'bg-[#222534] text-gray-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Sort Selector Bar */}
              <div className="flex items-center justify-between text-xs px-1 text-gray-400">
                <span className="font-mono text-xs">共 {filteredAndSortedProperties.length} 套在售房源</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">排序:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    aria-label="房源排序"
                    className="bg-[#222534] border border-black rounded-xl px-2.5 py-1 text-gray-200 text-xs font-medium cursor-pointer focus:outline-none focus:border-amber-400"
                  >
                    <option value="default">默认推荐</option>
                    <option value="price_asc">总价由低到高</option>
                    <option value="price_desc">总价由高到低</option>
                    <option value="yield_desc">年租金回报率高</option>
                    <option value="unit_price_asc">单价由低到高</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Property Cards List */}
            <div className="space-y-3.5">
              {filteredAndSortedProperties.map((item) => {
                const isOwned = ownedProperties.some((p) => p.propertyId === item.id);
                const unitPrice = Math.round(item.price / item.area);
                const annualYield = ((item.rentPerMonth * 12 * 100) / item.price).toFixed(1);

                return (
                  <div
                    key={item.id}
                    className="bg-[#202331] border-2 border-black rounded-2xl p-4 sm:p-4.5 shadow-[0_3px_0_#000] space-y-3.5 transition-all hover:border-amber-400/70"
                  >
                    {/* Header Row: Title & Price */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-white font-black text-sm sm:text-base tracking-wide truncate">
                            {item.title}
                          </h3>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#2b2f42] text-gray-300 border border-black/40">
                            {item.category}
                          </span>
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                            在售
                          </span>
                        </div>

                        {/* Specs row (Real Estate style) */}
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono mt-1.5 flex-wrap">
                          <span className="text-gray-200 font-bold">{item.layout}</span>
                          <span className="text-gray-500">|</span>
                          <span className="text-gray-200 font-bold">{item.area} ㎡</span>
                          <span className="text-gray-500">|</span>
                          <span>{item.orientation}</span>
                          <span className="text-gray-500">|</span>
                          <span>{item.district}</span>
                          <span className="text-gray-500">|</span>
                          <span>{item.floor}</span>
                        </div>
                      </div>

                      {/* Total & Unit Price */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-amber-300 font-mono font-black text-base sm:text-lg">
                          {item.price.toLocaleString()} ₽
                        </div>
                        <div className="text-gray-400 text-[10px] font-mono mt-0.5">
                          单价 {unitPrice.toLocaleString()} ₽/㎡
                        </div>
                      </div>
                    </div>

                    {/* Tags Row */}
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {item.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="bg-[#171924] text-gray-300 px-2.5 py-1 rounded-lg border border-black/60 font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                      <span className="bg-[#171924] text-emerald-300 px-2.5 py-1 rounded-lg border border-black/60 font-mono">
                        年租金回报 ~{annualYield}%
                      </span>
                    </div>

                    {/* Financial & Rental Summary Box */}
                    <div className="bg-[#161823] p-3 rounded-xl border border-black/60 grid grid-cols-2 gap-3 text-xs font-mono">
                      <div>
                        <span className="text-gray-400 text-[10px]">基准月租预估：</span>
                        <span className="text-emerald-400 font-bold ml-1">
                          {item.rentPerMonth.toLocaleString()} ₽/月
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px]">健康恢复增益：</span>
                        <span className="text-blue-300 font-bold ml-1">
                          +{item.comfortBonus}/月
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons Bar */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-black/40 gap-2.5">
                      <div className="text-xs text-gray-400 font-mono">
                        {isOwned ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                            <CheckCircle2 size={14} />
                            <span>已持有该房产</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">永久产权 · 独立地契</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPropDetail(item)}
                          className="px-3 py-1.5 rounded-xl border border-black bg-[#2c3044] hover:bg-[#383d57] text-gray-200 text-xs font-bold shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer"
                        >
                          详情
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSignRentalLease(item)}
                          disabled={!isRegistered || isOwned}
                          className={`px-3 py-1.5 rounded-xl border-2 border-black text-xs font-bold shadow-[0_2px_0_#000] active:translate-y-0.5 transition-all ${
                            !isRegistered || isOwned
                              ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed opacity-60'
                              : 'bg-[#2b2f42] hover:bg-[#363c55] text-white cursor-pointer'
                          }`}
                        >
                          租住 ({item.rentPerMonth}₽/月)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleBuyProperty(item)}
                          disabled={!isRegistered || coins < item.price}
                          className={`px-3.5 py-1.5 rounded-xl border-2 border-black text-xs font-black shadow-[0_2px_0_#000] active:translate-y-0.5 transition-all flex items-center gap-1 ${
                            !isRegistered || coins < item.price
                              ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed opacity-60'
                              : 'bg-amber-400 hover:bg-amber-300 text-black cursor-pointer'
                          }`}
                        >
                          <span>购买</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: 我的房产 */}
        {activeTab === 'owned' && (
          <div className="space-y-4">
            {/* Real Estate Portfolio Banner */}
            <div className="bg-[#202331] border-2 border-black rounded-2xl p-4 sm:p-5 shadow-[0_3px_0_#000] space-y-3.5">
              <div className="flex items-center justify-between border-b border-black/60 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-amber-400" />
                  <span className="text-white font-black text-sm sm:text-base">房产持仓总览</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                  持有 {ownedProperties.length} 套
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="bg-[#161823] p-3 rounded-xl border border-black shadow-inner space-y-0.5">
                  <div className="text-gray-400 text-[10px] font-sans">房产总估值</div>
                  <div className="text-amber-300 font-black text-base">
                    {totalPropertyValue.toLocaleString()} ₽
                  </div>
                </div>

                <div className="bg-[#161823] p-3 rounded-xl border border-black shadow-inner space-y-0.5">
                  <div className="text-gray-400 text-[10px] font-sans">每月租金收入</div>
                  <div className="text-emerald-400 font-black text-base">
                    +{totalMonthlyRentalIncome.toLocaleString()} ₽/月
                  </div>
                </div>
              </div>

              <div className="bg-[#161823] p-3 rounded-xl border border-black text-xs flex items-center justify-between font-sans shadow-inner">
                <span className="text-gray-400 font-bold">主要居所：</span>
                <span className="text-white font-bold truncate max-w-[220px]">
                  {currentResidenceName}
                </span>
              </div>
            </div>

            {/* List of Owned Properties */}
            {ownedProperties.length === 0 ? (
              <div className="bg-[#202331] border-2 border-black rounded-2xl p-8 sm:p-10 text-center space-y-3.5 shadow-[0_3px_0_#000]">
                <div className="w-12 h-12 rounded-2xl bg-[#161823] border border-black flex items-center justify-center mx-auto text-gray-500 shadow-inner">
                  <Home size={22} className="text-gray-500" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-white font-black text-sm sm:text-base">名下暂无房产</h3>
                  <p className="text-gray-400 text-xs leading-relaxed max-w-xs mx-auto">
                    您尚未购买任何房产。前往【房产市场】选购房屋或翻新住宅获取租金收益。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('market')}
                  className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs py-2 px-4 rounded-xl border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer inline-flex items-center gap-1.5 mt-1"
                >
                  <Building2 size={15} />
                  <span>前往选购房产</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {ownedProperties.map((owned) => {
                  const template = HOUSING_MARKET_PROPERTIES.find((t) => t.id === owned.propertyId);
                  const nextTier = owned.renovationTier + 1;
                  const canUpgrade = owned.renovationTier < 3;
                  const upgradeCost = canUpgrade
                    ? Math.floor(owned.purchasePrice * RENOVATION_COST_RATIO[nextTier])
                    : 0;

                  return (
                    <div
                      key={owned.id}
                      className="bg-[#202331] border-2 border-black rounded-2xl p-4 sm:p-4.5 shadow-[0_3px_0_#000] space-y-3.5"
                    >
                      {/* Property Header */}
                      <div className="flex items-start justify-between gap-3 border-b border-black/60 pb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-black text-sm sm:text-base">{owned.title}</span>
                            {owned.isPrimaryResidence && (
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Crown size={11} />
                                <span>主要居所</span>
                              </span>
                            )}
                            {owned.isRentedOut && (
                              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                出租中
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 font-mono mt-1">
                            {owned.district} · {template?.layout || '标准户型'} · {RENOVATION_TIER_NAMES[owned.renovationTier]}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-amber-300 font-mono font-black text-sm sm:text-base">
                            {owned.currentValue.toLocaleString()} ₽
                          </div>
                          <div className="text-gray-400 text-[10px] font-mono mt-0.5">
                            购入价: {owned.purchasePrice.toLocaleString()} ₽
                          </div>
                        </div>
                      </div>

                      {/* Property Metrics 3-Grid */}
                      <div className="grid grid-cols-3 gap-2.5 text-xs font-mono text-center">
                        <div className="bg-[#161823] p-2.5 rounded-xl border border-black shadow-inner space-y-0.5">
                          <div className="text-gray-400 text-[10px] font-sans">每月租金</div>
                          <div className="text-emerald-400 font-bold">
                            {owned.rentPerMonth.toLocaleString()} ₽
                          </div>
                        </div>
                        <div className="bg-[#161823] p-2.5 rounded-xl border border-black shadow-inner space-y-0.5">
                          <div className="text-gray-400 text-[10px] font-sans">装潢等级</div>
                          <div className="text-purple-300 font-bold">
                            {RENOVATION_TIER_NAMES[owned.renovationTier]}
                          </div>
                        </div>
                        <div className="bg-[#161823] p-2.5 rounded-xl border border-black shadow-inner space-y-0.5">
                          <div className="text-gray-400 text-[10px] font-sans">购入时间</div>
                          <div className="text-gray-300 font-bold">
                            {owned.purchaseYear}.{owned.purchaseMonth}
                          </div>
                        </div>
                      </div>

                      {/* Action Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-black/40">
                        <div className="flex items-center gap-2 flex-wrap">
                          {!owned.isPrimaryResidence && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(owned)}
                              className="px-3 py-1.5 bg-[#2b2f42] hover:bg-[#363b53] text-gray-200 rounded-xl border border-black text-xs font-bold shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer"
                            >
                              设为主居所
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleRentOut(owned)}
                            className={`px-3 py-1.5 rounded-xl border border-black text-xs font-bold shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer ${
                              owned.isRentedOut
                                ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
                                : 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                            }`}
                          >
                            {owned.isRentedOut ? '收回自用' : '挂牌出租'}
                          </button>

                          {canUpgrade && (
                            <button
                              type="button"
                              onClick={() => handleUpgradeRenovation(owned)}
                              className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/40 text-purple-300 rounded-xl border border-purple-500/50 text-xs font-bold shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
                            >
                              <Hammer size={13} />
                              <span>装修 ({upgradeCost.toLocaleString()}₽)</span>
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSellProperty(owned)}
                          className="px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded-xl border border-rose-500/50 text-xs font-bold shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer"
                        >
                          出售 (扣4%税)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: 租房中心 */}
        {activeTab === 'rent' && (
          <div className="space-y-4">
            {/* Current Lease Card */}
            {currentRental ? (
              <div className="bg-[#202331] border-2 border-black rounded-2xl p-4 sm:p-5 shadow-[0_3px_0_#000] space-y-3.5">
                <div className="flex items-start justify-between border-b border-black/60 pb-3">
                  <div>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      当前租约生效中
                    </span>
                    <h3 className="text-white font-black text-sm sm:text-base mt-1.5">
                      {currentRental.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1">
                      <MapPin size={13} className="text-amber-400" />
                      <span>{currentRental.district}</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-amber-300 font-mono font-black text-sm sm:text-base">
                      {currentRental.monthlyRent} ₽/月
                    </div>
                    <div className="text-gray-400 text-[10px] font-mono mt-0.5">
                      已托管押金: {currentRental.depositPaid} ₽
                    </div>
                  </div>
                </div>

                <div className="bg-[#161823] p-3 rounded-xl border border-black space-y-2 text-xs font-sans shadow-inner">
                  <div className="flex justify-between text-gray-300">
                    <span>签约时间：</span>
                    <span className="font-mono font-bold text-white">
                      {currentRental.startYear}年 {currentRental.startMonth}月
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>健康加成：</span>
                    <span className="text-emerald-400 font-bold">
                      每月恢复 +{currentRental.comfortBonus}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>租金结算：</span>
                    <span className="text-gray-400 font-mono">步入下月时自动扣缴</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTerminateLease}
                  className="w-full bg-rose-600/30 hover:bg-rose-600/40 text-rose-300 border-2 border-rose-500/50 py-2.5 rounded-xl font-bold text-xs shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer transition-all mt-1"
                >
                  办理退租 (退还50%押金)
                </button>
              </div>
            ) : (
              <div className="bg-[#202331] border-2 border-black rounded-2xl p-4 sm:p-5 text-center space-y-2 shadow-[0_3px_0_#000]">
                <div className="text-white font-black text-xs sm:text-sm">当前未租住任何房屋</div>
                <p className="text-gray-400 text-xs max-w-xs mx-auto leading-relaxed">
                  租房只需支付少量押金与月租，同样可享受月度健康恢复加成。
                </p>
              </div>
            )}

            {/* Rental Listings */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-gray-300 px-1">精选出租房源</div>
              {HOUSING_MARKET_PROPERTIES.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="bg-[#202331] border-2 border-black rounded-2xl p-3.5 sm:p-4 shadow-[0_2px_0_#000] flex items-center justify-between gap-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-xs sm:text-sm truncate">{item.title}</span>
                      <span className="text-[10px] text-gray-400 bg-[#161823] px-2 py-0.5 rounded border border-black/40">
                        {item.unitType}
                      </span>
                    </div>
                    <div className="text-gray-400 text-[10px] font-mono mt-1 truncate">
                      {item.district} · {item.area}㎡ · {item.orientation}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-amber-300 font-mono font-black text-xs sm:text-sm">
                        {item.rentPerMonth} ₽/月
                      </div>
                      <div className="text-gray-400 text-[9px] mt-0.5">押二付一</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSignRentalLease(item)}
                      disabled={!isRegistered || (currentRental && currentRental.propertyId === item.id)}
                      className={`px-3.5 py-1.5 rounded-xl border-2 border-black text-xs font-bold shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer ${
                        currentRental && currentRental.propertyId === item.id
                          ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed opacity-60'
                          : 'bg-amber-400 hover:bg-amber-300 text-black'
                      }`}
                    >
                      {currentRental && currentRental.propertyId === item.id ? '已在租' : '租住'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: 行情概况 */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            {/* Real Estate Index Card */}
            <div className="bg-[#202331] border-2 border-black rounded-2xl p-4 sm:p-5 shadow-[0_3px_0_#000] space-y-3.5">
              <div className="flex items-center justify-between border-b border-black/60 pb-3">
                <div className="flex items-center gap-2 text-sm font-black text-white">
                  <TrendingUp size={16} className="text-amber-400" />
                  <span>城市不动产行情</span>
                </div>
                <span className="text-emerald-400 text-[10px] font-mono font-bold bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                  +4.8% 年化景气度
                </span>
              </div>

              <p className="text-gray-300 text-xs leading-relaxed bg-[#161823] p-3.5 rounded-xl border border-black/80 shadow-inner font-sans">
                城市核心地段地价与租金稳步上扬。持有高品质房产可抵抗通胀并获取长期租金现金流。
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono text-center">
                <div className="bg-[#161823] p-3 rounded-xl border border-black shadow-inner space-y-0.5">
                  <div className="text-gray-400 text-[10px] font-sans">名下房屋套数</div>
                  <div className="text-white font-black text-base">
                    {ownedProperties.length} 套
                  </div>
                </div>
                <div className="bg-[#161823] p-3 rounded-xl border border-black shadow-inner space-y-0.5">
                  <div className="text-gray-400 text-[10px] font-sans">累计租金收益</div>
                  <div className="text-amber-300 font-black text-base">
                    {totalRentCollectedAllTime.toLocaleString()} ₽
                  </div>
                </div>
              </div>
            </div>

            {/* Trading Policy and Regulations */}
            <div className="bg-[#202331] border-2 border-black rounded-2xl p-4 sm:p-5 shadow-[0_3px_0_#000] space-y-3">
              <div className="text-xs font-black text-gray-200 flex items-center gap-1.5 border-b border-black/60 pb-2.5">
                <FileCheck size={16} className="text-purple-400" />
                <span>房产交易与租售说明</span>
              </div>

              <div className="space-y-2.5 text-xs text-gray-300 leading-relaxed font-sans">
                <div className="p-3 bg-[#161823] rounded-xl border border-black shadow-inner space-y-0.5">
                  <strong className="text-amber-300 block">1. 房产买卖与税费</strong>
                  购置后享有永久产权，挂牌出售时系统扣除 4% 交易税费。
                </div>
                <div className="p-3 bg-[#161823] rounded-xl border border-black shadow-inner space-y-0.5">
                  <strong className="text-emerald-300 block">2. 租金收益结算</strong>
                  挂牌出租的房产将于步入下月时自动结算租金并打入现金账户。
                </div>
                <div className="p-3 bg-[#161823] rounded-xl border border-black shadow-inner space-y-0.5">
                  <strong className="text-blue-300 block">3. 住宅装潢升级</strong>
                  升级装潢等级可提升房屋每月租金收益并成倍增加转售估值。
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* End Main Content Area */}
    </div>
  );
};

