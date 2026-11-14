import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  Plane,
  Globe,
  Award,
  BookOpen,
  Stamp,
  ShieldCheck,
  CircleDollarSign,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Compass,
  ArrowRight,
  RefreshCw,
  Coins,
  MapPin,
  Luggage,
  Calendar,
  Building,
  Check,
  Info,
  ChevronRight,
  Flame,
  BadgeAlert,
  Ship,
  Landmark,
  Shield,
  FileText,
  Crown,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { HistoricalFlag } from './HistoricalFlag';

export interface VisaItem {
  id: string;
  country: string;
  countryCode: string;
  visaType: string;
  visaCode: string;
  category: 'tourism' | 'business' | 'study' | 'work' | 'investment';
  categoryLabel: string;
  cost: number;
  minAssets: number;
  durationMonths: number;
  expediteFee: number;
  requirements: string[];
  benefits: string[];
  description: string;
  color: string;
  accentBg: string;
}

export interface IssuedVisa {
  id: string;
  visaId: string;
  country: string;
  countryCode: string;
  visaType: string;
  visaCode: string;
  issueYear: number;
  issueMonth: number;
  expireYear: number;
  expireMonth: number;
  entriesRemaining: number;
  status: 'valid' | 'expired';
}

export interface TravelLog {
  id: string;
  country: string;
  countryCode: string;
  destination: string;
  year: number;
  month: number;
  eventType: string;
  story: string;
  rewardText: string;
  stampColor: string;
}

export interface PassportData {
  passportNumber: string;
  issued: boolean;
  issueYear: number;
  issueMonth: number;
  holderName: string;
  creditScore: number;
  tier: 'Standard' | 'Silver Diplomatic' | 'Golden VIP';
}

export interface CountryVisaGroup {
  country: string;
  countryCode: string;
  visas: VisaItem[];
}

export interface VisaModalProps {
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

// 历史真实签证全集目录
const HISTORICAL_VISAS: VisaItem[] = [
  {
    id: 'gbr_london',
    country: '大英帝国',
    countryCode: 'GBR',
    visaType: '伦敦金融城与皇家学会深造签',
    visaCode: 'Type V-1',
    category: 'study',
    categoryLabel: '学术深造',
    cost: 1200,
    minAssets: 4000,
    durationMonths: 36,
    expediteFee: 500,
    requirements: ['持有效帝国护照', '个人流动资金 ≥ 4,000 ₽', '无外交豁免阻却事由'],
    benefits: ['前往伦敦金融城、牛津大学与皇家学会交流', '游历归来大幅增加学术声誉与阅历见闻', '有机会获得日不落帝国工业专利授权'],
    description: '日不落帝国官方公文签证，准许通行伦敦金融城、泰晤士河各大港口与皇家科学院。',
    color: '#8b5cf6',
    accentBg: 'rgba(139, 92, 246, 0.15)',
  },
  {
    id: 'pru_berlin',
    country: '普鲁士王国',
    countryCode: 'PRU',
    visaType: '柏林工坊与克虏伯重工派遣签',
    visaCode: 'Type K-3',
    category: 'work',
    categoryLabel: '重工派遣',
    cost: 1000,
    minAssets: 2000,
    durationMonths: 24,
    expediteFee: 400,
    requirements: ['持有效帝国护照', '个人资金储备 ≥ 2,000 ₽', '体魄状态良好健康'],
    benefits: ['派驻柏林机械厂与鲁尔重工业冶金基地', '每次出境技术派遣可斩获高额技师津贴 +2,800 ~ 5,200 ₽', '获取德意志先进车床采买配额'],
    description: '北德意志联邦与普鲁士重工招募准入文书，技术工程师与机械工匠的海外发展通道。',
    color: '#06b6d4',
    accentBg: 'rgba(6, 182, 212, 0.15)',
  },
  {
    id: 'fra_paris',
    country: '法兰西帝国',
    countryCode: 'FRA',
    visaType: '巴黎文旅与枫丹白露沙龙漫游签',
    visaCode: 'Type F-1',
    category: 'tourism',
    categoryLabel: '文旅漫游',
    cost: 600,
    minAssets: 1200,
    durationMonths: 12,
    expediteFee: 200,
    requirements: ['持有效帝国护照', '基础差旅资金 ≥ 1,200 ₽'],
    benefits: ['漫步香榭丽舍大街、卢浮宫与左岸艺术沙龙', '极速恢复体魄与精力（健康度 +30）', '收集欧陆古典印象派油画与精致奢侈藏品'],
    description: '欧陆艺术与时尚之都旅游准证，畅游塞纳河畔、巴黎歌剧院与名流沙龙。',
    color: '#ec4899',
    accentBg: 'rgba(236, 72, 153, 0.15)',
  },
  {
    id: 'usa_ny',
    country: '美利坚合众国',
    countryCode: 'USA',
    visaType: '华尔街淘金与太平洋铁路投资签',
    visaCode: 'Type US-9',
    category: 'investment',
    categoryLabel: '黄金投资',
    cost: 8000,
    minAssets: 20000,
    durationMonths: 60,
    expediteFee: 2000,
    requirements: ['持有效帝国护照', '验资净资产 ≥ 20,000 ₽', '认购美洲铁路建设公债'],
    benefits: ['获得纽约与旧金山长期居留特权与无限次出入境', '出境游历可参与华尔街铁路证券与西海岸黄金对冲大赚', '专属领事级绿色快速通关通道'],
    description: '镀金时代资本通行证，太平洋铁路连通后的淘金与工商业投资热土。',
    color: '#eab308',
    accentBg: 'rgba(234, 179, 8, 0.15)',
  },
  {
    id: 'rus_petersburg',
    country: '俄罗斯帝国',
    countryCode: 'RUS',
    visaType: '圣彼得堡冬宫商贸考察签',
    visaCode: 'Type R-2',
    category: 'business',
    categoryLabel: '商贸考察',
    cost: 800,
    minAssets: 2500,
    durationMonths: 24,
    expediteFee: 300,
    requirements: ['持有效帝国护照', '个人流动资金 ≥ 2,500 ₽', '无通缉或未结案记录'],
    benefits: ['前往圣彼得堡与莫斯科进行跨国大宗贸易', '每次考察可斩获 2,000 ~ 4,500 ₽ 毛皮与贵金属订单', '提升沙皇宫廷贵族商贸声誉'],
    description: '罗曼诺夫王朝官方商签，连接欧亚大陆的珍贵皮草、木材与大宗商贸干线。',
    color: '#3b82f6',
    accentBg: 'rgba(59, 130, 246, 0.15)',
  },
  {
    id: 'jpn_tokyo',
    country: '大日本帝国',
    countryCode: 'JPN',
    visaType: '明治维新通商与古刹研习签',
    visaCode: 'Type M-7',
    category: 'tourism',
    categoryLabel: '文旅漫游',
    cost: 1500,
    minAssets: 5000,
    durationMonths: 24,
    expediteFee: 600,
    requirements: ['持有效帝国护照', '个人流动资金 ≥ 5,000 ₽'],
    benefits: ['前往开埠之横滨港、东京与京都探秘', '极高几率发掘传世浮世绘、古名刀与东洋珍宝', '在箱根温泉中大幅洗涤体魄（健康度 +35）'],
    description: '明治维新文明开化时期的涉外通商许可，古老幕府余韵与近代浪潮交汇之地。',
    color: '#f43f5e',
    accentBg: 'rgba(244, 63, 94, 0.15)',
  },
  {
    id: 'aut_vienna',
    country: '奥匈帝国',
    countryCode: 'AUT',
    visaType: '维也纳皇家音乐与多瑙河商贸签',
    visaCode: 'Type AH-4',
    category: 'business',
    categoryLabel: '商贸考察',
    cost: 900,
    minAssets: 3000,
    durationMonths: 24,
    expediteFee: 350,
    requirements: ['持有效帝国护照', '个人流动资金 ≥ 3,000 ₽'],
    benefits: ['进驻维也纳金色大厅聆听圆舞曲与宫廷歌剧', '签订中欧多瑙河流域粮食与工芸品贸易契约（收益 +2,500 ~ 4,200 ₽）', '获得哈布斯堡王朝宫廷赞誉'],
    description: '哈布斯堡双元帝国皇家通关文牒，古典艺术、歌剧与中欧多瑙河航运枢纽。',
    color: '#10b981',
    accentBg: 'rgba(16, 185, 129, 0.15)',
  },
  {
    id: 'qng_shanghai',
    country: '大清帝国',
    countryCode: 'QNG',
    visaType: '同治洋务通商口岸贸易考察签',
    visaCode: 'Type TY-8',
    category: 'business',
    categoryLabel: '商贸考察',
    cost: 1000,
    minAssets: 3500,
    durationMonths: 24,
    expediteFee: 400,
    requirements: ['持有效帝国护照', '个人流动资金 ≥ 3,500 ₽'],
    benefits: ['考察上海公共租界江海关与广州十三行外贸口岸', '采购优质生丝、名贵瓷器与武夷贡茶销往欧陆（收益 +3,000 ~ 6,000 ₽）', '获清廷总理各国事务衙门通商关防'],
    description: '洋务运动蓬勃兴起时期的通商准照，开埠口岸与东方大宗丝茶贸易黄金通道。',
    color: '#d97706',
    accentBg: 'rgba(217, 119, 6, 0.15)',
  },
  {
    id: 'ita_rome',
    country: '意大利王国',
    countryCode: 'ITA',
    visaType: '亚平宁半岛统一通商与古罗马文保签',
    visaCode: 'Type IT-5',
    category: 'tourism',
    categoryLabel: '文旅漫游',
    cost: 850,
    minAssets: 2800,
    durationMonths: 24,
    expediteFee: 300,
    requirements: ['持有效帝国护照', '个人流动资金 ≥ 2,800 ₽'],
    benefits: ['游历罗马斗兽场、威尼斯水城与佛罗伦萨文艺复兴殿堂', '采购托斯卡纳顶级橄榄油与古典大理石雕塑（收益 +2,400 ~ 4,000 ₽）', '健康度 +25'],
    description: '意大利王国收复罗马完成统一时期的涉外文牒，地中海贸易枢纽与艺术复兴重镇。',
    color: '#059669',
    accentBg: 'rgba(5, 150, 105, 0.15)',
  },
  {
    id: 'esp_madrid',
    country: '西班牙王国',
    countryCode: 'ESP',
    visaType: '马德里皇家商会与大西洋航运考察签',
    visaCode: 'Type ES-3',
    category: 'business',
    categoryLabel: '商贸考察',
    cost: 750,
    minAssets: 2200,
    durationMonths: 18,
    expediteFee: 250,
    requirements: ['持有效帝国护照', '个人流动资金 ≥ 2,200 ₽'],
    benefits: ['涉足直布罗陀海峡与加的斯跨洋海运干线', '签订伊比利亚半岛软木、柑橘与雪莉酒贸易契约（收益 +2,200 ~ 3,800 ₽）'],
    description: '伊比利亚半岛通商公文，连结地中海与大西洋贸易的古老航海大国。',
    color: '#ea580c',
    accentBg: 'rgba(234, 88, 12, 0.15)',
  },
  {
    id: 'nld_amsterdam',
    country: '荷兰王国',
    countryCode: 'NLD',
    visaType: '阿姆斯特丹证券与东印度香料商埠签',
    visaCode: 'Type NL-2',
    category: 'business',
    categoryLabel: '商贸考察',
    cost: 1100,
    minAssets: 3800,
    durationMonths: 24,
    expediteFee: 450,
    requirements: ['持有效帝国护照', '个人流动资金 ≥ 3,800 ₽'],
    benefits: ['深入鹿特丹港口与阿姆斯特丹钻石交易所', '承接远东肉豆蔻、丁香与郁金香大宗期货清算（收益 +3,200 ~ 5,500 ₽）'],
    description: '低地国家老牌金融商贸签，全球航运保险与远洋香料集散核心。',
    color: '#2563eb',
    accentBg: 'rgba(37, 99, 235, 0.15)',
  },
  {
    id: 'che_geneva',
    country: '瑞士联邦',
    countryCode: 'CHE',
    visaType: '阿尔卑斯疗养与日内瓦钟表公会签',
    visaCode: 'Type CH-7',
    category: 'study',
    categoryLabel: '学术深造',
    cost: 1300,
    minAssets: 4500,
    durationMonths: 36,
    expediteFee: 500,
    requirements: ['持有效帝国护照', '个人流动资金 ≥ 4,500 ₽'],
    benefits: ['在阿尔卑斯雪山圣地静修，体魄与健康度极速回满 (+40)', '获得日内瓦独立制表大师专属机芯制造配额（收益 +3,500 ~ 6,000 ₽）'],
    description: '中立国专属通行函，精密机械工坊、永久中立金融与高山疗养胜地。',
    color: '#dc2626',
    accentBg: 'rgba(220, 38, 38, 0.15)',
  },
  {
    id: 'swe_stockholm',
    country: '瑞典-挪威联合王国',
    countryCode: 'SWE',
    visaType: '斯堪的纳维亚林业与诺贝尔火药研习签',
    visaCode: 'Type SE-4',
    category: 'work',
    categoryLabel: '重工派遣',
    cost: 950,
    minAssets: 2600,
    durationMonths: 24,
    expediteFee: 350,
    requirements: ['持有效帝国护照', '个人资金储备 ≥ 2,600 ₽'],
    benefits: ['考察基律纳特级优质铁矿与波罗的海造船木料', '与阿尔弗雷德·诺贝尔火药工坊合作获取安全炸药专利授权（收益 +2,900 ~ 4,800 ₽）'],
    description: '北欧联合王国工矿准照，优质铁矿石、耐寒木材与近代工程化学前沿。',
    color: '#0284c7',
    accentBg: 'rgba(2, 132, 199, 0.15)',
  },
  {
    id: 'tur_istanbul',
    country: '奥斯曼帝国',
    countryCode: 'TUR',
    visaType: '伊斯坦布尔金角湾大巴扎丝路商贸签',
    visaCode: 'Type OTT-6',
    category: 'business',
    categoryLabel: '商贸考察',
    cost: 850,
    minAssets: 2600,
    durationMonths: 24,
    expediteFee: 320,
    requirements: ['持有效帝国护照', '个人流动资金 ≥ 2,600 ₽'],
    benefits: ['横跨欧亚博斯普鲁斯海峡，掌控近东商道', '采购大马士革名刀、波斯织毯与叙利亚香精（收益 +2,600 ~ 4,600 ₽）'],
    description: '坦志麦特改革时期的崇高门商照，连结欧亚非三大洲的大巴扎枢纽。',
    color: '#b91c1c',
    accentBg: 'rgba(185, 28, 28, 0.15)',
  },
  {
    id: 'bra_rio',
    country: '巴西帝国',
    countryCode: 'BRA',
    visaType: '里约热内卢咖啡庄园与热带橡胶投资签',
    visaCode: 'Type BR-1',
    category: 'investment',
    categoryLabel: '黄金投资',
    cost: 4500,
    minAssets: 12000,
    durationMonths: 48,
    expediteFee: 1200,
    requirements: ['持有效帝国护照', '个人流动资金 ≥ 12,000 ₽'],
    benefits: ['入股圣保罗咖啡种植园与亚马逊野生天然橡胶贸易', '每次出境可获得南美大宗热带经济作物分红 +5,500 ~ 9,000 ₽'],
    description: '佩德罗二世统治下的南美帝国，热带咖啡、蔗糖与热带雨林宝藏的投资乐园。',
    color: '#15803d',
    accentBg: 'rgba(21, 128, 61, 0.15)',
  },
];

export const VisaModal: React.FC<VisaModalProps> = ({
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
  const [activeTab, setActiveTab] = useState<'hall' | 'my_visas' | 'passport' | 'travel' | 'customs'>('hall');
  
  // 申办大厅筛选与搜索状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'cost_asc' | 'cost_desc' | 'duration'>('default');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list'); // 列表模式优先更清晰，支持切换
  const [selectedVisaDetail, setSelectedVisaDetail] = useState<VisaItem | null>(null);
  const [selectedCountryGroup, setSelectedCountryGroup] = useState<CountryVisaGroup | null>(null);

  // Passport Data - Using Aminoac naming standard
  const [passport, setPassport] = useState<PassportData>(() => {
    try {
      const saved = localStorage.getItem('aminoac_passport_info') || localStorage.getItem('amigo_passport_info');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      passportNumber: `AAC-${Math.floor(10000 + Math.random() * 90000)}-${gameYear}`,
      issued: false,
      issueYear: gameYear,
      issueMonth: gameMonth,
      holderName: playerName || '帝国公民',
      creditScore: 880,
      tier: 'Standard',
    };
  });

  const [issuedVisas, setIssuedVisas] = useState<IssuedVisa[]>(() => {
    try {
      const saved = localStorage.getItem('aminoac_issued_visas') || localStorage.getItem('amigo_issued_visas');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [travelLogs, setTravelLogs] = useState<TravelLog[]>(() => {
    try {
      const saved = localStorage.getItem('aminoac_travel_history') || localStorage.getItem('amigo_travel_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [isApplying, setIsApplying] = useState(false);
  const [applyingStep, setApplyingStep] = useState<number>(0);
  const [applyingVisaInfo, setApplyingVisaInfo] = useState<{ visa: VisaItem; isExpedited: boolean } | null>(null);
  const [awardedVisaCertificate, setAwardedVisaCertificate] = useState<{ visa: VisaItem; issuedVisa: IssuedVisa } | null>(null);
  const [isTravelling, setIsTravelling] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [travelResultModal, setTravelResultModal] = useState<TravelLog | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 2800);
  };

  // Sync to LocalStorage with Aminoac standard
  useEffect(() => {
    try {
      localStorage.setItem('aminoac_passport_info', JSON.stringify(passport));
    } catch (e) {}
  }, [passport]);

  useEffect(() => {
    try {
      localStorage.setItem('aminoac_issued_visas', JSON.stringify(issuedVisas));
    } catch (e) {}
  }, [issuedVisas]);

  useEffect(() => {
    try {
      localStorage.setItem('aminoac_travel_history', JSON.stringify(travelLogs));
    } catch (e) {}
  }, [travelLogs]);

  // Update passport holder name if changed
  useEffect(() => {
    if (playerName && passport.holderName !== playerName) {
      setPassport((prev) => ({ ...prev, holderName: playerName }));
    }
  }, [playerName]);

  // 按国家分组的所有签证目录
  const countryVisaGroups = useMemo<CountryVisaGroup[]>(() => {
    const map = new Map<string, CountryVisaGroup>();
    HISTORICAL_VISAS.forEach((v) => {
      if (!map.has(v.countryCode)) {
        map.set(v.countryCode, {
          country: v.country,
          countryCode: v.countryCode,
          visas: [],
        });
      }
      map.get(v.countryCode)!.visas.push(v);
    });
    return Array.from(map.values());
  }, []);

  // 过滤后的国家列表
  const filteredCountryGroups = useMemo(() => {
    return countryVisaGroups.filter((group) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        group.country.toLowerCase().includes(q) ||
        group.countryCode.toLowerCase().includes(q) ||
        group.visas.some(
          (v) =>
            v.visaType.toLowerCase().includes(q) ||
            v.description.toLowerCase().includes(q) ||
            v.categoryLabel.toLowerCase().includes(q)
        )
      );
    });
  }, [countryVisaGroups, searchQuery]);

  // 当处于某个国家详情内时，该国家的过滤后签证列表
  const currentGroupVisas = useMemo(() => {
    if (!selectedCountryGroup) return [];
    return selectedCountryGroup.visas
      .filter((v) => {
        if (selectedCategory !== 'all' && v.category !== selectedCategory) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'cost_asc') return a.cost - b.cost;
        if (sortBy === 'cost_desc') return b.cost - a.cost;
        if (sortBy === 'duration') return b.durationMonths - a.durationMonths;
        return 0;
      });
  }, [selectedCountryGroup, selectedCategory, sortBy]);

  // 1. 办理/申领护照
  const handleApplyPassport = () => {
    if (!isRegistered) {
      showToast('请先前往出生登记处申领帝国公民身份', 'error');
      return;
    }
    const PASSPORT_FEE = 300;
    if (coins < PASSPORT_FEE) {
      showToast(`金币不足！办理帝国出入境护照需 ${PASSPORT_FEE} ₽ 工本费`, 'error');
      return;
    }

    setCoins((prev) => prev - PASSPORT_FEE);
    const newPassport: PassportData = {
      passportNumber: `AAC-${Math.floor(10000 + Math.random() * 90000)}-${gameYear}`,
      issued: true,
      issueYear: gameYear,
      issueMonth: gameMonth,
      holderName: playerName,
      creditScore: 890,
      tier: 'Standard',
    };
    setPassport(newPassport);
    showToast('阿米诺斯帝国出入境护照签发成功！已加盖皇家出入境公署防伪钢印', 'success');
  };

  // 2. 申办签证 (包含多阶段交互动画与公证书颁发)
  const handleApplyVisa = (visa: VisaItem, isExpedited: boolean = false) => {
    if (!passport.issued) {
      showToast('无法申办！请先在【护照证件】页面申领帝国公民护照', 'error');
      setActiveTab('passport');
      return;
    }

    // 检查是否已持有同国家有效签证
    const existing = issuedVisas.find((v) => v.visaId === visa.id && v.status === 'valid');
    if (existing) {
      showToast(`您已持有【${visa.country}】有效签证（剩余 ${existing.entriesRemaining} 次入境），无需重复申请`, 'info');
      return;
    }

    const totalCost = visa.cost + (isExpedited ? visa.expediteFee : 0);
    if (coins < totalCost) {
      showToast(`资金不足！申办该签证共需 ${totalCost} ₽（工本规费 ${visa.cost} ₽ + 领事加急 ${isExpedited ? visa.expediteFee : 0} ₽）`, 'error');
      return;
    }

    if (coins < visa.minAssets) {
      showToast(`验资未通过！该签证要求个人资产达到 ${visa.minAssets.toLocaleString()} ₽`, 'error');
      return;
    }

    // 扣除规费并开启申办提交动画
    setCoins((prev) => prev - totalCost);
    setIsApplying(true);
    setApplyingVisaInfo({ visa, isExpedited });
    setApplyingStep(1);

    // 步骤1 -> 步骤2: 700ms 验资与信用评估
    setTimeout(() => {
      setApplyingStep(2);
    }, 700);

    // 步骤2 -> 步骤3: 1400ms 领事官签署与加盖防伪红印章
    setTimeout(() => {
      setApplyingStep(3);
    }, 1400);

    // 步骤3 -> 完成: 2200ms 准许签发并展示官方签证公证书 Modal
    setTimeout(() => {
      const expireY = gameYear + Math.floor((gameMonth + visa.durationMonths) / 12);
      const expireM = ((gameMonth + visa.durationMonths - 1) % 12) + 1;

      const newVisa: IssuedVisa = {
        id: `visa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        visaId: visa.id,
        country: visa.country,
        countryCode: visa.countryCode,
        visaType: visa.visaType,
        visaCode: visa.visaCode,
        issueYear: gameYear,
        issueMonth: gameMonth,
        expireYear: expireY,
        expireMonth: expireM,
        entriesRemaining: visa.category === 'investment' ? 99 : 5,
        status: 'valid',
      };

      setIssuedVisas((prev) => [newVisa, ...prev]);
      setIsApplying(false);
      setApplyingStep(0);
      setApplyingVisaInfo(null);

      if (selectedVisaDetail?.id === visa.id) {
        setSelectedVisaDetail(null);
      }

      // 打开仪式感签证公证书弹窗
      setAwardedVisaCertificate({ visa, issuedVisa: newVisa });
      showToast(`【${visa.country} · ${visa.visaType}】审核通过！已获得官方领事签证准许公证书`, 'success');
    }, 2200);
  };

  // 3. 发起海外出境游历 / 商务考察
  const handleDepartTravel = (issued: IssuedVisa) => {
    if (issued.status !== 'valid' || issued.entriesRemaining <= 0) {
      showToast('该签证已失效或入境次数已耗尽，请重新申办', 'error');
      return;
    }

    const TRAVEL_EXPENSE = 400; // 远洋客轮差旅基础开销
    if (coins < TRAVEL_EXPENSE) {
      showToast(`差旅费不足！出境登船需支付 ${TRAVEL_EXPENSE} ₽ 跨洋远洋客轮头等舱票`, 'error');
      return;
    }

    setIsTravelling(true);
    setTimeout(() => {
      setCoins((prev) => prev - TRAVEL_EXPENSE);

      // 扣除入境次数
      setIssuedVisas((prev) =>
        prev.map((v) => {
          if (v.id === issued.id) {
            const nextEntries = v.entriesRemaining - 1;
            return {
              ...v,
              entriesRemaining: nextEntries,
              status: nextEntries <= 0 ? 'expired' : 'valid',
            };
          }
          return v;
        })
      );

      // 1870年历史真实旅行奇遇生成
      let story = '';
      let rewardText = '';
      let gainCoins = 0;
      let gainHealth = 0;

      if (issued.countryCode === 'GBR') {
        const outcomes = [
          { s: '在伦敦证券交易所与巴林银行代表共进下午茶，签下大宗高精蒸汽精密机件出口大单。', c: 3200, h: 10 },
          { s: '受邀前往剑桥大学三一学院讲学，获得英国皇家学会颁发之维多利亚银质荣誉奖章与津贴。', c: 2600, h: 15 },
          { s: '漫步泰晤士河畔雾都码头，购入一批优质威尔士无烟煤与精密怀表，转手获利丰厚。', c: 2900, h: 10 },
        ];
        const res = outcomes[Math.floor(Math.random() * outcomes.length)];
        story = res.s;
        gainCoins = res.c;
        gainHealth = res.h;
        rewardText = `贸易与学术酬金 +${gainCoins} ₽，见闻广博，体魄 +${gainHealth}`;
      } else if (issued.countryCode === 'PRU') {
        const outcomes = [
          { s: '在埃森克虏伯重工铸造厂指导蒸汽钻机调试，矿业督察官签发了丰厚的特别技术酬劳。', c: 3800, h: 10 },
          { s: '考察柏林皇家机械制造局，成功引进了德意志高精度齿轮车床图纸并获得顾问费。', c: 3400, h: 15 },
        ];
        const res = outcomes[Math.floor(Math.random() * outcomes.length)];
        story = res.s;
        gainCoins = res.c;
        gainHealth = res.h;
        rewardText = `重工技术津贴 +${gainCoins} ₽，体魄 +${gainHealth}`;
      } else if (issued.countryCode === 'FRA') {
        const outcomes = [
          { s: '漫步巴黎香榭丽舍大街与杜乐丽花园，品尝波尔多名庄红酒，结识贵族艺术家，身心得到充分调养。', c: 600, h: 30 },
          { s: '在蒙马特高地画廊偶得一幅古典大师油画原作，转手被巴黎藏家以高价竞得。', c: 3500, h: 25 },
        ];
        const res = outcomes[Math.floor(Math.random() * outcomes.length)];
        story = res.s;
        gainCoins = res.c;
        gainHealth = res.h;
        rewardText = `度假圆满，体魄大满 +${gainHealth}，艺术收益 +${gainCoins} ₽`;
      } else if (issued.countryCode === 'USA') {
        const outcomes = [
          { s: '在纽约华尔街联合交易所参与联合太平洋铁路股票发行，斩获巨额资本红利。', c: 7500, h: 15 },
          { s: '考察加利福尼亚旧金山淘金矿区，与西海岸矿业公司达成大宗黄金提炼合作。', c: 6200, h: 10 },
        ];
        const res = outcomes[Math.floor(Math.random() * outcomes.length)];
        story = res.s;
        gainCoins = res.c;
        gainHealth = res.h;
        rewardText = `美洲资本红利 +${gainCoins} ₽，体魄 +${gainHealth}`;
      } else if (issued.countryCode === 'RUS') {
        const outcomes = [
          { s: '在圣彼得堡涅瓦大街与皇室供货商达成西伯利亚顶级紫貂皮草采购契约，获利颇丰。', c: 3600, h: 10 },
          { s: '赴莫斯科参加全俄工商业展览会，获得沙皇财政部颁发的荣誉通商奖金。', c: 3100, h: 15 },
        ];
        const res = outcomes[Math.floor(Math.random() * outcomes.length)];
        story = res.s;
        gainCoins = res.c;
        gainHealth = res.h;
        rewardText = `欧亚贸易收益 +${gainCoins} ₽，体魄 +${gainHealth}`;
      } else if (issued.countryCode === 'JPN') {
        const outcomes = [
          { s: '在横滨开埠口岸与商行达成生丝贸易契约，并在箱根温泉中洗尽铅华，身心全面焕发。', c: 2200, h: 35 },
          { s: '在京都古刹密林深处淘得一把传世古名刀与稀世漆器，获赠海量古金币。', c: 4500, h: 20 },
        ];
        const res = outcomes[Math.floor(Math.random() * outcomes.length)];
        story = res.s;
        gainCoins = res.c;
        gainHealth = res.h;
        rewardText = `体魄大涨 +${gainHealth}，东洋奇珍收益 +${gainCoins} ₽`;
      } else if (issued.countryCode === 'AUT') {
        const outcomes = [
          { s: '在维也纳金色大厅聆听施特劳斯圆舞曲，与哈布斯堡贵族敲定多瑙河航运谷物期货合同。', c: 3300, h: 15 },
          { s: '受聘为维也纳工艺美术学院客座讲师，获得皇家文化基金会丰厚津贴。', c: 2800, h: 20 },
        ];
        const res = outcomes[Math.floor(Math.random() * outcomes.length)];
        story = res.s;
        gainCoins = res.c;
        gainHealth = res.h;
        rewardText = `多瑙河商贸收益 +${gainCoins} ₽，体魄 +${gainHealth}`;
      } else if (issued.countryCode === 'ITA') {
        const outcomes = [
          { s: '漫步罗马斗兽场与万神殿，并与佛罗伦萨商行达成大理石雕塑采购订单。', c: 3400, h: 25 },
          { s: '在威尼斯大运河畔与造船工坊洽谈地中海海运协议，斩获丰厚佣金。', c: 3000, h: 20 },
        ];
        const res = outcomes[Math.floor(Math.random() * outcomes.length)];
        story = res.s;
        gainCoins = res.c;
        gainHealth = res.h;
        rewardText = `地中海贸易收益 +${gainCoins} ₽，体魄 +${gainHealth}`;
      } else if (issued.countryCode === 'ESP') {
        const outcomes = [
          { s: '在马德里皇家商会签订安达卢西亚特产雪莉酒与橄榄油采购总约，销路极佳。', c: 3100, h: 15 },
          { s: '探访加的斯古港口，获得大西洋越洋货轮的优先配载权。', c: 2800, h: 20 },
        ];
        const res = outcomes[Math.floor(Math.random() * outcomes.length)];
        story = res.s;
        gainCoins = res.c;
        gainHealth = res.h;
        rewardText = `西班牙商贸收益 +${gainCoins} ₽，体魄 +${gainHealth}`;
      } else if (issued.countryCode === 'NLD') {
        const outcomes = [
          { s: '在阿姆斯特丹证券交易所精准交割东印度香料期票，斩获巨额投机收益。', c: 4600, h: 15 },
          { s: '考察鹿特丹世界港口船坞，与荷兰皇家航运公会建立深厚互信合作。', c: 3800, h: 15 },
        ];
        const res = outcomes[Math.floor(Math.random() * outcomes.length)];
        story = res.s;
        gainCoins = res.c;
        gainHealth = res.h;
        rewardText = `低地金融收益 +${gainCoins} ₽，体魄 +${gainHealth}`;
      } else if (issued.countryCode === 'CHE') {
        const outcomes = [
          { s: '在日内瓦钟表大师工坊订购专属陀飞轮天文台怀表，并于阿尔卑斯峰峦间尽情呼吸，体魄焕新。', c: 4200, h: 40 },
          { s: '结识瑞士私人银行合伙人，获得跨国贵金属保密托存优先权。', c: 3600, h: 35 },
        ];
        const res = outcomes[Math.floor(Math.random() * outcomes.length)];
        story = res.s;
        gainCoins = res.c;
        gainHealth = res.h;
        rewardText = `瑞士钟表与银行收益 +${gainCoins} ₽，体魄暴增 +${gainHealth}`;
      } else if (issued.countryCode === 'SWE') {
        const outcomes = [
          { s: '在斯德哥尔摩与诺贝尔实验室工程师共同改进安全雷管，获得技术转让分红。', c: 4100, h: 15 },
          { s: '签订大批基律纳特级高品位铁矿石长期供销合同。', c: 3500, h: 20 },
        ];
        const res = outcomes[Math.floor(Math.random() * outcomes.length)];
        story = res.s;
        gainCoins = res.c;
        gainHealth = res.h;
        rewardText = `北欧工矿分红 +${gainCoins} ₽，体魄 +${gainHealth}`;
      } else if (issued.countryCode === 'TUR') {
        const outcomes = [
          { s: '穿行于伊斯坦布尔大巴扎，采购名贵波斯毛毯与大马士革手工刀剑，返程大获全胜。', c: 3700, h: 20 },
          { s: '在博斯普鲁斯海峡与奥斯曼帝国海关总监达成丝路关税减免协定。', c: 3200, h: 15 },
        ];
        const res = outcomes[Math.floor(Math.random() * outcomes.length)];
        story = res.s;
        gainCoins = res.c;
        gainHealth = res.h;
        rewardText = `近东丝路大单 +${gainCoins} ₽，体魄 +${gainHealth}`;
      } else if (issued.countryCode === 'BRA') {
        const outcomes = [
          { s: '在里约热内卢港口交割整船优质热带咖啡豆与橡胶原料，赚取丰厚外汇。', c: 7200, h: 20 },
          { s: '获得佩德罗二世皇帝赐予的帝国开拓者勋章及皇室特许经营权。', c: 6000, h: 25 },
        ];
        const res = outcomes[Math.floor(Math.random() * outcomes.length)];
        story = res.s;
        gainCoins = res.c;
        gainHealth = res.h;
        rewardText = `南美热带大宗分红 +${gainCoins} ₽，体魄 +${gainHealth}`;
      } else {
        const outcomes = [
          { s: '在上海公共租界江海关采购优质湖丝与景德镇青花瓷，转运返航大受追捧，获利丰厚。', c: 4800, h: 15 },
          { s: '考察广州十三行洋行街，同治洋务通商大臣颁发通商奖赏与整箱名贵贡茶。', c: 3900, h: 20 },
        ];
        const res = outcomes[Math.floor(Math.random() * outcomes.length)];
        story = res.s;
        gainCoins = res.c;
        gainHealth = res.h;
        rewardText = `洋务丝茶贸易收益 +${gainCoins} ₽，体魄 +${gainHealth}`;
      }

      if (gainCoins > 0) setCoins((prev) => prev + gainCoins);
      if (gainHealth > 0) setHealth((prev) => Math.min(100, prev + gainHealth));

      const newLog: TravelLog = {
        id: `log_${Date.now()}`,
        country: issued.country,
        countryCode: issued.countryCode,
        destination: `${issued.country} · 出境游历考察`,
        year: gameYear,
        month: gameMonth,
        eventType: issued.visaType,
        story,
        rewardText,
        stampColor:
          issued.countryCode === 'GBR'
            ? '#8b5cf6'
            : issued.countryCode === 'USA'
            ? '#eab308'
            : issued.countryCode === 'QNG'
            ? '#d97706'
            : issued.countryCode === 'FRA'
            ? '#ec4899'
            : '#3b82f6',
      };

      setTravelLogs((prev) => [newLog, ...prev]);
      setIsTravelling(false);
      setTravelResultModal(newLog);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#14161f] flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="relative w-full h-16 bg-[#1b1e2a] border-b-2 border-black shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20 flex items-center justify-between px-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-2 bg-[#282c3c] hover:bg-[#34394e] border-2 border-black rounded-xl active:translate-y-0.5 shadow-[0_2px_0_#000] cursor-pointer text-white flex items-center justify-center transition-all z-10"
        >
          <ChevronLeft size={20} className="text-white" strokeWidth={3} />
        </button>

        <div className="flex-1 flex items-center justify-center pointer-events-none px-2">
          <div className="bg-[#242839] border-2 border-sky-500/80 px-4 py-1.5 rounded-xl shadow-[0_3px_0_#000] flex items-center gap-2">
            <Plane size={17} className="text-sky-400 flex-shrink-0" />
            <span className="text-sky-300 text-sm font-black tracking-wider">
              签证申办
            </span>
          </div>
        </div>

        <div className="flex items-center bg-[#11131c] rounded-full px-2.5 py-1 border border-black text-xs font-mono font-black z-10 shadow-[0_2px_0_#000]">
          <CircleDollarSign size={14} className="text-yellow-400 mr-1" />
          <span className="text-amber-300">{coins.toLocaleString()} ₽</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-[#181a24] border-b-2 border-black px-2 py-2 flex items-center justify-between gap-1.5 flex-shrink-0 overflow-x-auto no-scrollbar">
        {[
          { id: 'hall', label: '申办大厅', icon: Globe },
          { id: 'my_visas', label: `已持签证 (${issuedVisas.filter((v) => v.status === 'valid').length})`, icon: Stamp },
          { id: 'travel', label: '出境游历', icon: Compass },
          { id: 'passport', label: '护照证件', icon: BookOpen },
          { id: 'customs', label: '戳印海关', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'hall') {
                  setSelectedCountryGroup(null);
                }
              }}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-sky-500 text-black border-black font-black'
                  : 'bg-[#222534] text-gray-400 hover:text-white hover:bg-[#2c3042]'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-black' : 'text-gray-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 custom-scrollbar bg-[#14161f]">
        {/* Banner Alert if Passport not issued */}
        {!passport.issued && (
          <div className="bg-[#241c14] border-2 border-amber-500/80 rounded-2xl p-3.5 shadow-[0_3px_0_#000] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 flex-shrink-0">
                <BadgeAlert size={22} />
              </div>
              <div>
                <div className="text-white font-black text-xs">您尚未申领帝国出入境护照</div>
                <div className="text-gray-300 text-[11px] mt-0.5">
                  申办各国签证及登船出境通关前，需先在护照署登记并申领有效护照本。
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('passport')}
              className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black py-1.5 px-3 rounded-xl border-2 border-black active:translate-y-0.5 cursor-pointer flex-shrink-0 shadow-[0_2px_0_#000] flex items-center gap-1"
            >
              <span>前往申领</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* 1. VISA APPLICATION HALL (申办大厅 - 国家列表与选择) */}
        {activeTab === 'hall' && (
          <div className="space-y-3.5 max-w-2xl mx-auto">
            {!selectedCountryGroup ? (
              /* 视图 1：国家列表卡片（类似移民界面风格） */
              <div className="space-y-3.5">
                {/* 搜索框 */}
                <div className="relative flex items-center">
                  <Search size={15} className="absolute left-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索国家名称、三字代码 (GBR/USA/PRU) 或签证关键字..."
                    className="w-full bg-[#11131c] border-2 border-black/90 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-sky-400 transition-colors shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 p-0.5 text-gray-400 hover:text-white cursor-pointer rounded-full hover:bg-white/10 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* 国家列表 */}
                <div className="bg-[#1b1e2b] border-2 border-black rounded-2xl overflow-hidden shadow-[0_4px_0_#000] divide-y divide-black/60">
                  {filteredCountryGroups.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <div className="text-gray-400 text-xs font-bold">未找到符合搜索条件的国家或签证</div>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-sky-400 text-xs underline font-bold cursor-pointer"
                      >
                        清空搜索框
                      </button>
                    </div>
                  ) : (
                    filteredCountryGroups.map((countryGroup) => {
                      const hasValidVisa = issuedVisas.some(
                        (v) => v.countryCode === countryGroup.countryCode && v.status === 'valid'
                      );

                      return (
                        <div
                          key={countryGroup.countryCode}
                          onClick={() => {
                            setSelectedCountryGroup(countryGroup);
                            setSelectedCategory('all');
                          }}
                          className="p-3.5 hover:bg-[#222636] active:bg-[#282c40] transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          {/* 左侧：国旗与国家名称 */}
                          <div className="flex items-center gap-3.5 min-w-0">
                            <HistoricalFlag
                              code={countryGroup.countryCode}
                              width={38}
                              height={24}
                              className="shadow-sm rounded-sm flex-shrink-0"
                            />
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-white font-black text-sm tracking-wide group-hover:text-sky-300 transition-colors">
                                {countryGroup.country}
                              </span>
                              {hasValidVisa && (
                                <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                                  <CheckCircle2 size={11} />
                                  <span>已获签证</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 右侧：签证数量与箭头 */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[11px] text-gray-400 font-mono font-bold bg-[#12141e] px-2.5 py-1 rounded-lg border border-black">
                              {countryGroup.visas.length} 款签证
                            </span>
                            <ChevronRight size={16} className="text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* 视图 2：点开具体国家后的签证列表（包含顶栏、筛选与列表/网格模式） */
              <div className="space-y-3">
                {/* 顶栏返回块 */}
                <div className="bg-[#1b1e2b] border-2 border-black rounded-2xl p-3 shadow-[0_3px_0_#000] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <HistoricalFlag
                      code={selectedCountryGroup.countryCode}
                      width={34}
                      height={22}
                      className="shadow-sm"
                    />
                    <div>
                      <span className="text-white font-black text-sm block">
                        {selectedCountryGroup.country} 领事馆与签证处
                      </span>
                      <span className="text-gray-400 text-[10px] font-mono">
                        共 {selectedCountryGroup.visas.length} 款可申办官方签证方案
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCountryGroup(null)}
                    className="bg-[#2a2d3e] hover:bg-[#363a50] text-xs text-gray-200 font-bold px-3 py-1.5 rounded-xl border border-black cursor-pointer active:translate-y-0.5 transition-all flex items-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    <span>返回国家列表</span>
                  </button>
                </div>

                {/* 类别与排序筛选栏 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#1b1e2b] border-2 border-black rounded-2xl shadow-[0_3px_0_#000]">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Category Dropdown */}
                    <div className="relative flex-1 sm:w-44">
                      <SlidersHorizontal size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sky-400 pointer-events-none z-10" />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full appearance-none bg-[#131622] border border-black/90 hover:border-sky-400/60 rounded-xl pl-8 pr-7 py-1.5 text-xs text-sky-200 font-bold focus:outline-none focus:border-sky-400 cursor-pointer transition-colors shadow-inner"
                      >
                        <option value="all">全部类型</option>
                        <option value="business">商贸考察</option>
                        <option value="tourism">文旅漫游</option>
                        <option value="study">学术深造</option>
                        <option value="investment">黄金投资</option>
                        <option value="work">重工派遣</option>
                      </select>
                      <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative flex-1 sm:w-44">
                      <TrendingUp size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none z-10" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full appearance-none bg-[#131622] border border-black/90 hover:border-sky-400/60 rounded-xl pl-8 pr-7 py-1.5 text-xs text-gray-200 font-bold focus:outline-none focus:border-sky-400 cursor-pointer transition-colors shadow-inner"
                      >
                        <option value="default">默认推荐排序</option>
                        <option value="cost_asc">规费从低到高</option>
                        <option value="cost_desc">规费从高到低</option>
                        <option value="duration">有效期从长到短</option>
                      </select>
                      <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* View Mode Switcher */}
                  <div className="flex items-center justify-end flex-shrink-0">
                    <div className="flex items-center bg-[#131622] border border-black/90 rounded-xl p-0.5 shadow-inner">
                      <button
                        onClick={() => setViewMode('list')}
                        title="列表视图"
                        className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                          viewMode === 'list' ? 'bg-sky-400 text-black font-bold' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Layers size={14} />
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        title="卡片视图"
                        className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                          viewMode === 'grid' ? 'bg-sky-400 text-black font-bold' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <SlidersHorizontal size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 签证列表 / 网格展现 */}
                {currentGroupVisas.length === 0 ? (
                  <div className="bg-[#1b1e2b] border-2 border-black rounded-2xl p-8 text-center space-y-2 shadow-[0_3px_0_#000]">
                    <div className="text-white font-bold text-xs">该类型下暂无对应签证</div>
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="bg-sky-500 hover:bg-sky-400 text-black text-xs font-black py-1.5 px-4 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer"
                    >
                      查看全部类型
                    </button>
                  </div>
                ) : viewMode === 'list' ? (
                  /* 列表模式 */
                  <div className="bg-[#1b1e2b] border-2 border-black rounded-2xl overflow-hidden shadow-[0_4px_0_#000] divide-y divide-black/60">
                    {currentGroupVisas.map((visa) => {
                      const isHeld = issuedVisas.some((v) => v.visaId === visa.id && v.status === 'valid');

                      return (
                        <div
                          key={visa.id}
                          className="p-3 sm:p-4 hover:bg-[#222636] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          {/* 左边：代码与信息 */}
                          <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.2 rounded border"
                                  style={{
                                    backgroundColor: `${visa.color}20`,
                                    color: visa.color,
                                    borderColor: `${visa.color}50`,
                                  }}
                                >
                                  {visa.categoryLabel}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono bg-[#14161f] px-1.5 py-0.2 rounded border border-black/60">
                                  {visa.visaCode}
                                </span>
                                {isHeld && (
                                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-1.5 py-0.2 rounded font-bold">
                                    已获批持有
                                  </span>
                                )}
                              </div>

                              <div className="text-sky-300 font-black text-xs sm:text-sm mt-0.5 truncate">
                                {visa.visaType}
                              </div>

                              <div className="text-gray-400 text-[11px] mt-1 line-clamp-1">
                                {visa.description}
                              </div>
                            </div>
                          </div>

                          {/* 右边：费用、验资与操作 */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/40">
                            <div className="text-left sm:text-right">
                              <div className="text-amber-300 font-mono font-black text-xs sm:text-sm">
                                {visa.cost.toLocaleString()} ₽
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                有效 {visa.durationMonths}月 · 需验资 {visa.minAssets.toLocaleString()} ₽
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setSelectedVisaDetail(visa)}
                                className="bg-[#2a2e40] hover:bg-[#353a50] text-gray-200 hover:text-white px-2.5 py-1.5 rounded-xl border border-black text-xs font-bold active:translate-y-0.5 cursor-pointer shadow-[0_2px_0_#000]"
                              >
                                详情
                              </button>

                              <button
                                onClick={() => handleApplyVisa(visa, false)}
                                disabled={isApplying || isHeld}
                                className={`py-1.5 px-3 rounded-xl font-black text-xs border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer flex items-center gap-1 transition-all ${
                                  isHeld
                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600'
                                    : 'bg-sky-500 hover:bg-sky-400 text-black'
                                }`}
                              >
                                <Stamp size={13} />
                                <span>{isHeld ? '已持有' : '申办'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* 网格卡片模式 */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {currentGroupVisas.map((visa) => {
                      const isHeld = issuedVisas.some((v) => v.visaId === visa.id && v.status === 'valid');
                      return (
                        <div
                          key={visa.id}
                          className="bg-[#1e212f] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-sky-500/60 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border"
                                  style={{
                                    backgroundColor: `${visa.color}20`,
                                    color: visa.color,
                                    borderColor: `${visa.color}50`,
                                  }}
                                >
                                  {visa.visaCode}
                                </span>
                                <span className="text-[10px] bg-[#14161f] text-gray-300 px-1.5 py-0.2 rounded border border-black">
                                  {visa.categoryLabel}
                                </span>
                                {isHeld && (
                                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-1.5 py-0.2 rounded font-bold">
                                    已持有效
                                  </span>
                                )}
                              </div>
                              <div className="text-sky-300 text-sm font-black mt-1">{visa.visaType}</div>
                            </div>

                            <div className="text-right">
                              <div className="text-amber-300 font-mono font-black text-sm">
                                {visa.cost.toLocaleString()} ₽
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                有效期 {visa.durationMonths} 个月
                              </div>
                            </div>
                          </div>

                          <p className="text-gray-300 text-[11px] leading-relaxed bg-[#151722] p-2.5 rounded-xl border border-black/60">
                            {visa.description}
                          </p>

                          <div className="space-y-2 text-[11px]">
                            <div className="text-gray-400 font-bold flex items-center gap-1.5">
                              <ShieldCheck size={13} className="text-sky-400" />
                              <span>申请门槛与条件：</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {visa.requirements.map((req, i) => (
                                <span
                                  key={i}
                                  className="bg-[#151722] text-gray-300 px-2 py-0.5 rounded-md border border-black/40 text-[10px]"
                                >
                                  • {req}
                                </span>
                              ))}
                            </div>

                            <div className="text-gray-400 font-bold flex items-center gap-1.5 pt-1">
                              <Sparkles size={13} className="text-amber-400" />
                              <span>签证权益与特权：</span>
                            </div>
                            <div className="text-amber-300/90 text-[10px] space-y-1">
                              {visa.benefits.slice(0, 2).map((b, i) => (
                                <div key={i} className="flex items-start gap-1.5">
                                  <Check size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
                                  <span className="truncate">{b}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-black/60 flex items-center gap-2">
                            <button
                              onClick={() => setSelectedVisaDetail(visa)}
                              className="bg-[#2a2e40] hover:bg-[#353a50] text-gray-200 hover:text-white px-3 py-2 rounded-xl border border-black text-xs font-bold active:translate-y-0.5 cursor-pointer shadow-[0_2px_0_#000]"
                            >
                              详情
                            </button>
                            <button
                              onClick={() => handleApplyVisa(visa, false)}
                              disabled={isApplying || isHeld}
                              className={`flex-1 py-2 px-3 rounded-xl font-black text-xs border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                                isHeld
                                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600'
                                  : 'bg-sky-500 hover:bg-sky-400 text-black'
                              }`}
                            >
                              <Stamp size={14} />
                              <span>{isHeld ? '已持有效签证' : '立即申办'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. MY ISSUED VISAS (已持签证) */}
        {activeTab === 'my_visas' && (
          <div className="space-y-4">
            <div className="bg-[#1e212f] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-3">
              <div className="flex items-center justify-between border-b border-black/60 pb-2">
                <div className="flex items-center gap-2">
                  <Stamp size={16} className="text-sky-400" />
                  <span className="text-white font-black text-xs">名下有效出入境签证批文</span>
                </div>
                <span className="text-[11px] font-mono text-gray-400">
                  有效签证: {issuedVisas.filter((v) => v.status === 'valid').length} 本
                </span>
              </div>

              {issuedVisas.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#14161f] border border-black/80 flex items-center justify-center text-gray-500 mx-auto">
                    <Plane size={24} />
                  </div>
                  <div className="text-gray-400 text-xs font-bold">暂无任何签发的有效签证</div>
                  <p className="text-gray-500 text-[11px]">
                    前往【申办大厅】搜索与提交各国签证申请，获批后即可登船开启出境游历与商贸考察。
                  </p>
                  <button
                    onClick={() => setActiveTab('hall')}
                    className="bg-sky-500 hover:bg-sky-400 text-black text-xs font-black py-1.5 px-4 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer mt-2"
                  >
                    前往选办签证 →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {issuedVisas.map((visa) => {
                    const isValid = visa.status === 'valid';
                    return (
                      <div
                        key={visa.id}
                        className={`p-3.5 rounded-2xl border-2 border-black shadow-[0_3px_0_#000] relative overflow-hidden ${
                          isValid ? 'bg-[#181d2a]' : 'bg-[#151722] opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="pt-0.5">
                              <HistoricalFlag code={visa.countryCode} width={38} height={24} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-black text-sm">{visa.country}</span>
                                <span className="text-[10px] bg-sky-500/20 text-sky-300 font-mono px-1.5 py-0.2 rounded border border-sky-500/40">
                                  {visa.visaCode}
                                </span>
                              </div>
                              <div className="text-gray-300 text-xs font-bold mt-0.5">{visa.visaType}</div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                                isValid
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-gray-700 text-gray-400 border-gray-600'
                              }`}
                            >
                              {isValid ? '有效签注中' : '已失效'}
                            </span>
                            <div className="text-[10px] text-gray-400 font-mono mt-1">
                              剩余入境: <strong className="text-amber-300">{visa.entriesRemaining} 次</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2.5 mt-2.5 border-t border-black/40">
                          <div>
                            签发: {visa.issueYear}.{visa.issueMonth} 至 {visa.expireYear}.{visa.expireMonth}
                          </div>
                          {isValid && (
                            <button
                              onClick={() => {
                                setActiveTab('travel');
                              }}
                              className="text-sky-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                            >
                              <span>前往登船出境</span>
                              <ChevronRight size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. OVERSEAS EXPEDITIONS (出境游历) */}
        {activeTab === 'travel' && (
          <div className="space-y-4">
            <div className="bg-[#1e212f] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-3">
              <div className="flex items-center justify-between border-b border-black/60 pb-2">
                <div className="flex items-center gap-2">
                  <Compass size={16} className="text-sky-400" />
                  <span className="text-white font-black text-xs">帝国远洋客轮港口口岸 (Departures)</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">客舱票: 400 ₽ / 次</span>
              </div>

              <div className="bg-[#14161f] p-3 rounded-xl border border-black/60 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/50 flex items-center justify-center text-sky-300 flex-shrink-0">
                  <Ship size={20} />
                </div>
                <div className="text-xs">
                  <div className="text-white font-bold">远洋跨国航行须知</div>
                  <div className="text-gray-400 text-[11px] mt-0.5 leading-relaxed">
                    持有任一国家有效签证即可搭乘远洋客轮出境。出境可斩获海外外贸大单、学术见识增长、收集异国海关戳印并全面恢复体魄健康。
                  </div>
                </div>
              </div>

              {/* Ready to Depart Destinations */}
              <div className="space-y-2.5 pt-1">
                <div className="text-xs font-black text-gray-300">可通关目的地港口列表：</div>
                {issuedVisas.filter((v) => v.status === 'valid').length === 0 ? (
                  <div className="p-4 bg-[#14161f] border border-black/60 rounded-xl text-center space-y-2">
                    <div className="text-amber-300 text-xs font-bold">暂无有效签证可供登船</div>
                    <p className="text-gray-400 text-[11px]">
                      您名下暂无有效签注。请前往【申办大厅】申领目的地签证。
                    </p>
                    <button
                      onClick={() => setActiveTab('hall')}
                      className="bg-sky-500 text-black text-xs font-black py-1.5 px-3 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer"
                    >
                      前往办理签证 →
                    </button>
                  </div>
                ) : (
                  issuedVisas
                    .filter((v) => v.status === 'valid')
                    .map((visa) => (
                      <div
                        key={visa.id}
                        className="bg-[#181d2a] border-2 border-black rounded-2xl p-3.5 shadow-[0_3px_0_#000] flex items-center justify-between gap-3 group hover:border-sky-400 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <HistoricalFlag code={visa.countryCode} width={38} height={24} />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-white font-black text-xs">{visa.country}</span>
                              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded font-mono border border-sky-500/40">
                                {visa.visaCode}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-400 mt-0.5">
                              {visa.visaType} · 剩余 {visa.entriesRemaining} 次出境
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDepartTravel(visa)}
                          disabled={isTravelling}
                          className="bg-sky-500 hover:bg-sky-400 text-black text-xs font-black py-2 px-3.5 rounded-xl border-2 border-black active:translate-y-0.5 cursor-pointer shadow-[0_2px_0_#000] flex items-center gap-1.5 flex-shrink-0"
                        >
                          <Ship size={14} />
                          <span>即刻登船 (400 ₽)</span>
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. PASSPORT & TRAVEL DOCUMENT (护照证件 - AMINOAC) */}
        {activeTab === 'passport' && (
          <div className="space-y-4">
            {/* Vintage Passport Book Card */}
            <div className="bg-gradient-to-b from-[#2a1e17] via-[#221711] to-[#1a110d] border-4 border-[#8c6d3d] rounded-3xl p-5 shadow-[0_8px_20px_rgba(0,0,0,0.8)] relative overflow-hidden space-y-4">
              <div className="absolute top-2 right-2 text-[#8c6d3d]/15 text-8xl font-black select-none pointer-events-none font-serif">
                {gameYear}
              </div>

              {/* Passport Header Emblem */}
              <div className="flex items-center justify-between border-b-2 border-[#8c6d3d]/40 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#8c6d3d]/20 border-2 border-[#8c6d3d] flex items-center justify-center text-amber-300 font-bold shadow-inner">
                    <Landmark size={20} className="text-amber-300" />
                  </div>
                  <div>
                    <div className="text-amber-200 text-xs font-black tracking-widest uppercase">
                      阿米诺斯帝国出入境管理局
                    </div>
                    <div className="text-[#a88a54] text-[10px] font-mono font-bold tracking-wider">
                      IMPERIAL EMPIRE OF AMINOAC · {gameYear}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                      passport.issued
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-red-500/20 text-red-300 border-red-500/40'
                    }`}
                  >
                    {passport.issued ? '有效证件 (Valid)' : '未申领 (Unissued)'}
                  </span>
                </div>
              </div>

              {/* Passport Details Fields */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#140c08]/80 p-2.5 rounded-xl border border-[#8c6d3d]/30 space-y-0.5">
                  <div className="text-[#a88a54] text-[10px] font-bold">护照号码 / Passport No.</div>
                  <div className="text-amber-200 font-mono font-black text-sm">
                    {passport.issued ? passport.passportNumber : '--------'}
                  </div>
                </div>

                <div className="bg-[#140c08]/80 p-2.5 rounded-xl border border-[#8c6d3d]/30 space-y-0.5">
                  <div className="text-[#a88a54] text-[10px] font-bold">持照人姓名 / Full Name</div>
                  <div className="text-amber-200 font-black text-sm">{playerName || '帝国公民'}</div>
                </div>

                <div className="bg-[#140c08]/80 p-2.5 rounded-xl border border-[#8c6d3d]/30 space-y-0.5">
                  <div className="text-[#a88a54] text-[10px] font-bold">国籍 / Nationality</div>
                  <div className="text-amber-200 font-bold">阿米诺斯帝国 (Aminoac)</div>
                </div>

                <div className="bg-[#140c08]/80 p-2.5 rounded-xl border border-[#8c6d3d]/30 space-y-0.5">
                  <div className="text-[#a88a54] text-[10px] font-bold">出入境信用评级 / Rating</div>
                  <div className="text-emerald-400 font-mono font-black">{passport.creditScore} (AAA 卓越)</div>
                </div>
              </div>

              {/* Passport Issue / Renewal Action */}
              <div className="pt-2 border-t border-[#8c6d3d]/40 flex items-center justify-between">
                <div className="text-[11px] text-[#a88a54]">
                  {passport.issued
                    ? `签发日期: ${passport.issueYear}.${passport.issueMonth} · 防伪钢印已激活`
                    : '申领需缴纳工本费 300 ₽'}
                </div>

                {!passport.issued ? (
                  <button
                    onClick={handleApplyPassport}
                    className="bg-[#d4a359] hover:bg-[#e6b56b] text-black text-xs font-black py-2 px-4 rounded-xl border-2 border-black active:translate-y-0.5 cursor-pointer shadow-[0_2px_0_#000] flex items-center gap-1.5"
                  >
                    <BookOpen size={14} />
                    <span>即刻申领护照 (300 ₽)</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 size={15} />
                    <span>已随身携带护照本</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. CUSTOMS STAMPS & TRAVEL LOGS (戳印海关) */}
        {activeTab === 'customs' && (
          <div className="space-y-4">
            <div className="bg-[#1e212f] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-3">
              <div className="flex items-center justify-between border-b border-black/60 pb-2">
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-amber-400" />
                  <span className="text-white font-black text-xs">出入境海关戳印收集册 (Customs Record)</span>
                </div>
                <span className="text-[11px] font-mono text-amber-300">
                  累计章戳: {travelLogs.length} 枚
                </span>
              </div>

              {travelLogs.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#14161f] border border-black/80 flex items-center justify-center text-gray-500 mx-auto">
                    <Stamp size={24} />
                  </div>
                  <div className="text-gray-400 text-xs font-bold">暂无海关通关戳印记录</div>
                  <p className="text-gray-500 text-[11px]">
                    使用签证完成出境游历或商务考察后，海关边检公署将在此加盖通关印章。
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {travelLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-[#14161f] border-2 border-black rounded-2xl p-3.5 space-y-2 shadow-[0_2px_0_#000] relative overflow-hidden"
                    >
                      {/* Stamp Seal Graphic */}
                      <div
                        className="absolute right-3 top-2 border-2 border-dashed rounded-full px-2.5 py-1 rotate-12 opacity-80 pointer-events-none text-[10px] font-mono font-black uppercase tracking-wider"
                        style={{ color: log.stampColor, borderColor: log.stampColor }}
                      >
                        PASSED · {log.year}
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <HistoricalFlag code={log.countryCode} width={24} height={15} />
                        <span className="text-white font-black">{log.destination}</span>
                        <span className="text-gray-500 font-mono text-[10px]">
                          {log.year}.{log.month < 10 ? '0' + log.month : log.month}
                        </span>
                      </div>

                      <p className="text-gray-300 text-[11px] leading-relaxed pr-16">{log.story}</p>

                      <div className="text-emerald-300 font-bold text-[10px] bg-emerald-950/30 border border-emerald-500/30 px-2 py-1 rounded-lg flex items-center gap-1">
                        <Sparkles size={12} className="text-emerald-400" />
                        <span>{log.rewardText}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Visa Detail Modal (点击列表中的签证弹出公文详情) */}
      {selectedVisaDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#1e212f] border-4 border-black rounded-3xl p-5 max-w-md w-full space-y-4 shadow-[0_10px_30px_rgba(0,0,0,0.9)] relative overflow-hidden">
            <button
              onClick={() => setSelectedVisaDetail(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg bg-[#14161f] border border-black cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Header with 1870 Flag */}
            <div className="flex items-center gap-3">
              <HistoricalFlag code={selectedVisaDetail.countryCode} width={50} height={32} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-black text-base">{selectedVisaDetail.country}</span>
                  <span
                    className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border"
                    style={{
                      backgroundColor: `${selectedVisaDetail.color}20`,
                      color: selectedVisaDetail.color,
                      borderColor: `${selectedVisaDetail.color}50`,
                    }}
                  >
                    {selectedVisaDetail.visaCode}
                  </span>
                </div>
                <div className="text-sky-300 text-xs font-bold mt-0.5">{selectedVisaDetail.visaType}</div>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-200 text-xs leading-relaxed bg-[#14161f] p-3 rounded-xl border border-black/80">
              {selectedVisaDetail.description}
            </p>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#14161f] p-2.5 rounded-xl border border-black/60">
                <span className="text-gray-400 text-[10px]">官方规费：</span>
                <div className="text-amber-300 font-mono font-black">{selectedVisaDetail.cost.toLocaleString()} ₽</div>
              </div>
              <div className="bg-[#14161f] p-2.5 rounded-xl border border-black/60">
                <span className="text-gray-400 text-[10px]">有效期限：</span>
                <div className="text-sky-300 font-mono font-bold">{selectedVisaDetail.durationMonths} 个月</div>
              </div>
              <div className="bg-[#14161f] p-2.5 rounded-xl border border-black/60">
                <span className="text-gray-400 text-[10px]">验资门槛：</span>
                <div className="text-emerald-400 font-mono font-bold">≥ {selectedVisaDetail.minAssets.toLocaleString()} ₽</div>
              </div>
              <div className="bg-[#14161f] p-2.5 rounded-xl border border-black/60">
                <span className="text-gray-400 text-[10px]">领事特急费：</span>
                <div className="text-amber-400 font-mono font-bold">+{selectedVisaDetail.expediteFee} ₽</div>
              </div>
            </div>

            {/* Benefits & Requirements */}
            <div className="space-y-2 text-xs bg-[#14161f] p-3 rounded-xl border border-black/80">
              <div className="text-gray-400 text-[11px] font-bold">签证核心权益与待遇：</div>
              <div className="text-amber-300/90 text-[11px] space-y-1">
                {selectedVisaDetail.benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <Check size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            {(() => {
              const isHeld = issuedVisas.some((v) => v.visaId === selectedVisaDetail.id && v.status === 'valid');
              return (
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleApplyVisa(selectedVisaDetail, false)}
                    disabled={isApplying || isHeld}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 ${
                      isHeld
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600'
                        : 'bg-sky-500 hover:bg-sky-400 text-black'
                    }`}
                  >
                    <Stamp size={14} />
                    <span>{isHeld ? '名下已持有此签证' : `常规申办 (${selectedVisaDetail.cost} ₽)`}</span>
                  </button>

                  {!isHeld && (
                    <button
                      onClick={() => handleApplyVisa(selectedVisaDetail, true)}
                      disabled={isApplying}
                      className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-2 border-amber-500/60 py-2.5 px-3 rounded-xl font-bold text-xs active:translate-y-0.5 cursor-pointer flex items-center gap-1 shadow-[0_2px_0_#000]"
                    >
                      <Flame size={14} className="text-amber-400" />
                      <span>加急 (+{selectedVisaDetail.expediteFee} ₽)</span>
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 1. 申办提交过程交互动画 Overlay */}
      {isApplying && applyingVisaInfo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#1b1e2c] border-4 border-black rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-[0_12px_40px_rgba(0,0,0,0.9)] text-center relative overflow-hidden">
            {/* 领事馆徽记与国旗 */}
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="relative">
                <HistoricalFlag code={applyingVisaInfo.visa.countryCode} width={56} height={36} className="shadow-md rounded border border-black" />
                {applyingVisaInfo.isExpedited && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full border border-black flex items-center gap-0.5 animate-pulse">
                    <Flame size={10} /> 加急
                  </span>
                )}
              </div>
              <div className="mt-1">
                <div className="text-amber-400 text-[11px] font-mono font-bold tracking-widest uppercase">
                  {applyingVisaInfo.visa.country} 驻帝国总领事馆 · 签证审查处
                </div>
                <h3 className="text-white text-base font-black mt-0.5">
                  正在核验 {applyingVisaInfo.visa.visaType}
                </h3>
              </div>
            </div>

            {/* 动态图章盖印与审查动画区域 */}
            <div className="bg-[#12141f] border-2 border-black rounded-2xl p-5 relative overflow-hidden flex flex-col items-center justify-center min-h-[140px]">
              {/* 背景扫描纹理 */}
              <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 via-transparent to-transparent animate-pulse pointer-events-none" />

              {applyingStep === 1 && (
                <div className="space-y-3 flex flex-col items-center animate-in fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border-2 border-sky-400/40 flex items-center justify-center text-sky-400 animate-spin">
                    <RefreshCw size={24} />
                  </div>
                  <div className="text-sky-200 text-xs font-bold">① 递交出入境申请履历与资产证明...</div>
                </div>
              )}

              {applyingStep === 2 && (
                <div className="space-y-3 flex flex-col items-center animate-in fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border-2 border-amber-400/40 flex items-center justify-center text-amber-400">
                    <ShieldCheck size={26} className="animate-pulse" />
                  </div>
                  <div className="text-amber-200 text-xs font-bold">② 领事官审核资信额度 (≥ {applyingVisaInfo.visa.minAssets.toLocaleString()} ₽)...</div>
                </div>
              )}

              {applyingStep === 3 && (
                <div className="space-y-2 flex flex-col items-center animate-in zoom-in-75 duration-200">
                  {/* 盖章轰鸣效果 */}
                  <div className="w-16 h-16 rounded-full bg-red-950/80 border-4 border-red-500 flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)] rotate-[-12deg] transform scale-110 transition-transform">
                    <div className="text-center font-black leading-tight text-[10px] text-red-200 uppercase tracking-tighter">
                      <div>APPROVED</div>
                      <Stamp size={18} className="mx-auto my-0.5 text-red-400" />
                      <div>官方核准</div>
                    </div>
                  </div>
                  <div className="text-emerald-300 text-xs font-black pt-1">③ 签发加盖帝国领事公署防伪红印章！</div>
                </div>
              )}
            </div>

            {/* 步骤进度指示器 */}
            <div className="space-y-1.5 text-left text-[11px]">
              <div className="flex items-center justify-between text-gray-400 font-bold">
                <span>领事审查进度</span>
                <span className="font-mono text-sky-400">
                  {applyingStep === 1 ? '35%' : applyingStep === 2 ? '70%' : '100%'}
                </span>
              </div>
              <div className="w-full bg-[#12141f] h-2 rounded-full overflow-hidden border border-black/80">
                <div
                  className="bg-gradient-to-r from-sky-400 via-amber-400 to-emerald-400 h-full transition-all duration-500"
                  style={{ width: `${applyingStep === 1 ? 35 : applyingStep === 2 ? 70 : 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. 官方签证准许公证书 Modal (Award Certificate Popup) */}
      {awardedVisaCertificate && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
          <div className="bg-[#181a27] border-4 border-amber-600/80 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-[0_0_50px_rgba(217,119,6,0.3)] relative overflow-hidden space-y-4">
            {/* 证书顶部金边装饰条 */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600" />

            {/* 背景水纹徽章 */}
            <div className="absolute right-4 bottom-12 opacity-5 pointer-events-none text-amber-300">
              <Landmark size={180} />
            </div>

            {/* 顶部标题区 */}
            <div className="text-center space-y-1 border-b border-amber-500/30 pb-3">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-full text-[11px] font-bold">
                <Crown size={14} className="text-amber-400" />
                <span>阿米诺斯帝国出入境公署 · 领事准许公证书</span>
              </div>
              <h2 className="text-white text-lg sm:text-xl font-black tracking-wide pt-1">
                {awardedVisaCertificate.visa.country} 官方签证核发凭证
              </h2>
              <p className="text-gray-400 text-[10px] font-mono">
                OFFICIAL CONSULAR VISA CERTIFICATE — ISSUED IN {gameYear}
              </p>
            </div>

            {/* 证书主体网格 */}
            <div className="bg-[#11131d] border-2 border-black rounded-2xl p-4 space-y-3 relative">
              {/* 右下角红印章 Seal */}
              <div className="absolute right-3 bottom-3 w-24 h-24 rounded-full border-4 border-red-500/80 bg-red-950/40 flex flex-col items-center justify-center text-red-400 rotate-[-15deg] shadow-lg pointer-events-none select-none backdrop-blur-xs">
                <div className="text-[9px] font-black uppercase tracking-tighter text-red-300">CONSULATE</div>
                <Stamp size={20} className="my-0.5 text-red-400" />
                <div className="text-[9px] font-black text-red-200">【领事特批印】</div>
                <div className="text-[7px] font-mono text-red-400 opacity-80">{awardedVisaCertificate.visa.countryCode}-1870</div>
              </div>

              {/* 国旗与签证编码 */}
              <div className="flex items-center justify-between border-b border-black/60 pb-2.5">
                <div className="flex items-center gap-3">
                  <HistoricalFlag code={awardedVisaCertificate.visa.countryCode} width={42} height={26} className="shadow-md rounded border border-black" />
                  <div>
                    <div className="text-white font-black text-sm">{awardedVisaCertificate.visa.country}</div>
                    <div className="text-sky-300 font-bold text-xs">{awardedVisaCertificate.visa.visaType}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-amber-300 bg-amber-950/60 border border-amber-500/50 font-mono font-black text-xs px-2 py-0.5 rounded">
                    {awardedVisaCertificate.visa.visaCode}
                  </span>
                  <div className="text-gray-400 text-[10px] font-mono mt-0.5">
                    类别: {awardedVisaCertificate.visa.categoryLabel}
                  </div>
                </div>
              </div>

              {/* 凭证信息表 */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#181a26] p-2 rounded-xl border border-black/50">
                  <span className="text-gray-400 text-[10px] block font-bold">持证公民名称</span>
                  <span className="text-white font-black">{passport.holderName}</span>
                </div>
                <div className="bg-[#181a26] p-2 rounded-xl border border-black/50">
                  <span className="text-gray-400 text-[10px] block font-bold">绑定帝国护照</span>
                  <span className="text-sky-300 font-mono font-bold">{passport.passportNumber}</span>
                </div>
                <div className="bg-[#181a26] p-2 rounded-xl border border-black/50">
                  <span className="text-gray-400 text-[10px] block font-bold">有效期限与签发</span>
                  <span className="text-emerald-300 font-mono font-bold">
                    {awardedVisaCertificate.visa.durationMonths} 个月 (至 {awardedVisaCertificate.issuedVisa.expireYear}.{awardedVisaCertificate.issuedVisa.expireMonth < 10 ? '0' + awardedVisaCertificate.issuedVisa.expireMonth : awardedVisaCertificate.issuedVisa.expireMonth})
                  </span>
                </div>
                <div className="bg-[#181a26] p-2 rounded-xl border border-black/50">
                  <span className="text-gray-400 text-[10px] block font-bold">准许入境次数</span>
                  <span className="text-amber-300 font-bold">
                    {awardedVisaCertificate.issuedVisa.entriesRemaining} 次入境许可
                  </span>
                </div>
              </div>

              {/* 权益罗列 */}
              <div className="bg-[#181a26] p-2.5 rounded-xl border border-black/50 space-y-1">
                <div className="text-amber-400 text-[11px] font-bold flex items-center gap-1">
                  <Sparkles size={12} />
                  <span>享有的官方特权待遇：</span>
                </div>
                <div className="space-y-0.5 text-[11px] text-gray-200">
                  {awardedVisaCertificate.visa.benefits.slice(0, 3).map((b, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <Check size={12} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                onClick={() => setAwardedVisaCertificate(null)}
                className="w-full sm:flex-1 bg-[#25283a] hover:bg-[#31354d] text-gray-200 font-bold py-2.5 rounded-xl border border-black text-xs cursor-pointer active:translate-y-0.5 transition-colors shadow-[0_2px_0_#000]"
              >
                收下证书并存入背包
              </button>
              <button
                onClick={() => {
                  setAwardedVisaCertificate(null);
                  setActiveTab('travel');
                }}
                className="w-full sm:flex-1 bg-sky-500 hover:bg-sky-400 text-black font-black py-2.5 rounded-xl border-2 border-black text-xs cursor-pointer active:translate-y-0.5 transition-all shadow-[0_2px_0_#000] flex items-center justify-center gap-1.5"
              >
                <Ship size={15} />
                <span>前往【出境游历】启航</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Travel Expedition Result Modal Popup */}
      {travelResultModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#1e212f] border-4 border-black rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-[0_10px_30px_rgba(0,0,0,0.9)] text-center relative overflow-hidden">
            <div className="flex items-center justify-center">
              <HistoricalFlag code={travelResultModal.countryCode} width={64} height={40} />
            </div>

            <div>
              <div className="text-amber-400 font-bold text-xs">出境游历圆满归航</div>
              <h2 className="text-white text-base font-black mt-0.5">{travelResultModal.destination}</h2>
            </div>

            <p className="text-gray-200 text-xs leading-relaxed bg-[#14161f] p-3 rounded-2xl border border-black/80 text-left">
              {travelResultModal.story}
            </p>

            <div className="bg-emerald-950/40 border border-emerald-500/50 p-2.5 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
              <Sparkles size={14} className="text-emerald-400 flex-shrink-0" />
              <span>{travelResultModal.rewardText}</span>
            </div>

            <button
              onClick={() => setTravelResultModal(null)}
              className="w-full bg-sky-500 hover:bg-sky-400 text-black font-black py-2.5 rounded-xl border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer text-xs"
            >
              收下战果并收录海关印章
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-16 left-1/2 -translate-x-1/2 z-50 text-xs px-4 py-2.5 rounded-xl border-2 border-black shadow-[0_4px_12px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2 font-bold pointer-events-none ${
            toastMsg.type === 'error'
              ? 'bg-red-950 text-red-200 border-red-500'
              : toastMsg.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-500'
              : 'bg-[#181d2a] text-sky-200 border-sky-500'
          }`}
        >
          {toastMsg.type === 'error' ? (
            <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
          ) : toastMsg.type === 'success' ? (
            <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
          ) : (
            <Info size={15} className="text-sky-400 flex-shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}
    </div>
  );
};
