import React, { useState } from 'react';
import {
  ChevronLeft,
  Globe,
  Award,
  ShieldCheck,
  CircleDollarSign,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Check,
  ChevronRight,
  Stamp,
  Crown,
  FileText,
  BadgeCheck,
  Search,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { HistoricalFlag } from './HistoricalFlag';

export interface ResidencyProgram {
  id: string;
  country: string;
  countryCode: string;
  title: string;
  cardName: string;
  cardCode: string;
  category: 'investment' | 'talent' | 'pioneer' | 'neutrality';
  categoryLabel: string;
  cost: number;
  minAssets: number;
  minHealth: number;
  processingMonths: number;
  requirements: string[];
  benefits: string[];
  perkDescription: string;
  lore: string;
  color: string;
  accentBg: string;
  sealColor: string;
}

export interface CountryImmigrationGroup {
  country: string;
  countryCode: string;
  tagline?: string;
  overview?: string;
  programs: ResidencyProgram[];
}

export interface OwnedResidency {
  id: string;
  programId: string;
  country: string;
  countryCode: string;
  cardName: string;
  cardCode: string;
  cardNumber: string;
  issueYear: number;
  issueMonth: number;
  categoryLabel: string;
  isNaturalized?: boolean;
  naturalizedYear?: number;
  naturalizedMonth?: number;
}

export interface ImmigrationModalProps {
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

// 历史真实各国移民居留项目分组
const IMMIGRATION_COUNTRIES: CountryImmigrationGroup[] = [
  {
    country: '大英帝国',
    countryCode: 'GBR',
    programs: [
      {
        id: 'gbr_pr',
        country: '大英帝国',
        countryCode: 'GBR',
        title: '皇家臣民无限期居留公证书 (ILR)',
        cardName: '大英帝国永久居留公证文书',
        cardCode: 'ILR-GB-1870',
        category: 'investment',
        categoryLabel: '帝国公债投资',
        cost: 5000,
        minAssets: 15000,
        minHealth: 50,
        processingMonths: 1,
        requirements: [
          '持有阿米诺斯合法公民身份',
          '认购英国国家统合国债 ≥ 15,000 ₽',
          '无皇家海事法庭通缉罪责',
        ],
        benefits: [
          '享有大英帝国全境及海外自治领永久居留与通商权',
          '享受伦敦金融城与皇家属地自由通商特权',
          '享受伦敦劳埃德保险社商业信贷极速审批特权',
        ],
        perkDescription: '获得日不落帝国全球属地通行与商业居留权，自由在英联邦全境置业经商。',
        lore: '维多利亚时代大英帝国的核心移民法令，面向跨国资本家开放无限期居留特许，允许在全球领土自由经商购置资产。',
        color: '#012169',
        accentBg: 'rgba(1, 33, 105, 0.2)',
        sealColor: '#C8102E',
      },
    ],
  },
  {
    country: '美利坚合众国',
    countryCode: 'USA',
    programs: [
      {
        id: 'usa_pr',
        country: '美利坚合众国',
        countryCode: 'USA',
        title: '新大陆自由开拓者永久绿卡 (PR Card)',
        cardName: '美利坚合众国永久居留证 (PR Card)',
        cardCode: 'USA-PR-1776',
        category: 'pioneer',
        categoryLabel: '自由开拓定居',
        cost: 3200,
        minAssets: 8000,
        minHealth: 60,
        processingMonths: 1,
        requirements: [
          '持有阿米诺斯合法公民身份',
          '个人流动或银行储蓄 ≥ 8,000 ₽',
          '体魄健康度 ≥ 60 点（适应新大陆开拓环境）',
        ],
        benefits: [
          '享有《宅地法》西部农场与矿山优先开发购买权',
          '华尔街铁路与重工投资免除跨国双重征税',
          '美洲全境永久定居与工商业自由开设特权',
        ],
        perkDescription: '获得美利坚大陆永久定居与自由经商权，享西部拓荒与免关税投资。',
        lore: '南北战争重建时期与西进运动中的经典移民法案，向全球具备开拓进取精神的移民发放永久绿卡与土地特许。',
        color: '#3C3B6E',
        accentBg: 'rgba(60, 59, 110, 0.2)',
        sealColor: '#B22234',
      },
    ],
  },
  {
    country: '法兰西第三共和国',
    countryCode: 'FRA',
    programs: [
      {
        id: 'fra_pr',
        country: '法兰西第三共和国',
        countryCode: 'FRA',
        title: '巴黎左岸艺术与工商业永久居留卡',
        cardName: 'Carte de Séjour Permanent - Paris',
        cardCode: 'FRA-CSP-75',
        category: 'talent',
        categoryLabel: '文化杰出人才',
        cost: 4000,
        minAssets: 12000,
        minHealth: 50,
        processingMonths: 1,
        requirements: [
          '持有阿米诺斯合法公民身份',
          '个人储备资产 ≥ 12,000 ₽',
          '认可法兰西民法典之契约自由原则',
        ],
        benefits: [
          '免签定居巴黎、里昂与法兰西蔚蓝海岸',
          '获得法兰西公立医疗救济与高级疗养院长期减免',
          '享有法兰西全境终身无阻居留与沙龙艺术特权',
        ],
        perkDescription: '获得法兰西本土永久居留资格，尊享欧洲大陆优雅生活与医疗福利保障。',
        lore: '法兰西共和国民政部颁发的终身外国人居留特许，深受各国艺术家、银行家与启蒙思想家的青睐。',
        color: '#002395',
        accentBg: 'rgba(0, 35, 149, 0.2)',
        sealColor: '#ED2939',
      },
    ],
  },
  {
    country: '瑞士联邦',
    countryCode: 'CHE',
    programs: [
      {
        id: 'che_pr',
        country: '瑞士联邦',
        countryCode: 'CHE',
        title: '永久中立国庇护与终身定居令 (C证)',
        cardName: 'Permis d’établissement Suisse (C证)',
        cardCode: 'CHE-C-1848',
        category: 'neutrality',
        categoryLabel: '中立避风港',
        cost: 8000,
        minAssets: 30000,
        minHealth: 50,
        processingMonths: 1,
        requirements: [
          '持有阿米诺斯合法公民身份',
          '在瑞士联合银行或苏黎世储备资产 ≥ 30,000 ₽',
          '无交战国军役履职与违法前科记录',
        ],
        benefits: [
          '获得瑞士联邦26州永久居留与避难豁免权',
          '名下所有秘密银行账户免受战争没收与国际冻结',
          '享有苏黎世私行最高等级保密与资产法律安全庇护',
        ],
        perkDescription: '全球最顶级的永久中立国居留庇护，名下财产受严格保密法案保护。',
        lore: '阿尔卑斯山麓的永久中立国度，为全球名门望族提供绝对安全的中立庇护与至高私人财产法律保护。',
        color: '#D52B1E',
        accentBg: 'rgba(213, 43, 30, 0.2)',
        sealColor: '#FFFFFF',
      },
    ],
  },
  {
    country: '德意志帝国',
    countryCode: 'PRU',
    programs: [
      {
        id: 'pru_pr',
        country: '德意志帝国',
        countryCode: 'PRU',
        title: '鲁尔工矿与机械专家特许居留令',
        cardName: 'Kaiserliche Niederlassungserlaubnis',
        cardCode: 'PRU-KNE-1871',
        category: 'talent',
        categoryLabel: '工业技术领军',
        cost: 3800,
        minAssets: 10000,
        minHealth: 70,
        processingMonths: 1,
        requirements: [
          '持有阿米诺斯合法公民身份',
          '个人流动储备 ≥ 10,000 ₽',
          '体魄健康度 ≥ 70 点（符合重工业制造体检标准）',
        ],
        benefits: [
          '获得柏林机械制造工坊与克虏伯重工工程师特许居留权',
          '享有帝国技工退休金公署统筹保险待遇',
          '享有北德意志帝国全境工业发明与专利优先行使特权',
        ],
        perkDescription: '北德意志联邦工业技术移民通道，获取帝国技师公会优待与专利保护。',
        lore: '普鲁士与德意志帝国为了吸收高尖技术工匠与机械工程师设立的最高级别技术永居法令。',
        color: '#1a1a1a',
        accentBg: 'rgba(221, 0, 0, 0.15)',
        sealColor: '#DD0000',
      },
    ],
  },
  {
    country: '俄罗斯帝国',
    countryCode: 'RUS',
    programs: [
      {
        id: 'rus_pr',
        country: '俄罗斯帝国',
        countryCode: 'RUS',
        title: '圣彼得堡第一公会客商永居特许状',
        cardName: '俄罗斯帝国第一公会永居特许状',
        cardCode: 'RUS-GUILD-1',
        category: 'investment',
        categoryLabel: '皇室特许客商',
        cost: 4500,
        minAssets: 18000,
        minHealth: 50,
        processingMonths: 1,
        requirements: [
          '持有阿米诺斯合法公民身份',
          '全额缴纳圣彼得堡皇家公会入会保证金 ≥ 18,000 ₽',
          '恪守帝国冬宫商业法度与关税公约',
        ],
        benefits: [
          '享有波罗的海至西伯利亚跨欧亚大陆贸易专营权',
          '佩戴沙皇第一商业公会金质勋章，享有地方行政免审权',
          '受冬宫保护之跨帝国欧亚商贸通商特权',
        ],
        perkDescription: '沙俄皇家商业行会顶级永居特许状，享有崇高商贸地位与免审权。',
        lore: '沙皇俄国面向外邦巨商富贾开放的特许入籍通道，持证人享有等同于帝国一等商业贵族的崇高商贸地位。',
        color: '#B8860B',
        accentBg: 'rgba(184, 134, 11, 0.2)',
        sealColor: '#F4C430',
      },
    ],
  },
];

export const ImmigrationModal: React.FC<ImmigrationModalProps> = ({
  onClose,
  coins,
  setCoins,
  gameYear,
  gameMonth,
  isRegistered,
  playerName,
  health,
  setHealth: _setHealth,
  onOpenBirth,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'countries' | 'dossier' | 'naturalize'>('countries');
  const [searchFilter, setSearchFilter] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Selected Country to View its Immigration Pathways
  const [selectedCountryGroup, setSelectedCountryGroup] = useState<CountryImmigrationGroup | null>(null);

  // Selected Program for Detail Modal / Application
  const [selectedProgram, setSelectedProgram] = useState<ResidencyProgram | null>(null);
  const [oathProgram, setOathProgram] = useState<OwnedResidency | null>(null);

  // 持久化玩家拥有的永久居留列表
  const [ownedResidencies, setOwnedResidencies] = useState<OwnedResidency[]>(() => {
    try {
      const saved = localStorage.getItem('amigo_permanent_residencies');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const saveResidencies = (list: OwnedResidency[]) => {
    setOwnedResidencies(list);
    try {
      localStorage.setItem('amigo_permanent_residencies', JSON.stringify(list));
    } catch {}
  };

  // 申请永久居留
  const handleApplyResidency = (prog: ResidencyProgram) => {
    if (!isRegistered) {
      showToast('❌ 请先完成出生登记，取得合法公民身份后方可申办海外居留');
      return;
    }

    const alreadyOwned = ownedResidencies.some((r) => r.programId === prog.id);
    if (alreadyOwned) {
      showToast(`⚠️ 你已持有【${prog.country}】永久居留身份，无需重复申领`);
      return;
    }

    if (coins < prog.cost) {
      showToast(`❌ 申请规费不足！需要 ${prog.cost.toLocaleString()} ₽，当前拥有 ${coins.toLocaleString()} ₽`);
      return;
    }

    if (coins < prog.minAssets) {
      showToast(`❌ 资产储备不达标！【${prog.country}】要求个人储备资金 ≥ ${prog.minAssets.toLocaleString()} ₽`);
      return;
    }

    if (health < prog.minHealth) {
      showToast(`❌ 健康体魄不达标！体检要求体魄 ≥ ${prog.minHealth} 点（当前：${health}）`);
      return;
    }

    // Deduct cost
    setCoins((prev) => prev - prog.cost);

    // Create New PR Card
    const randomCardNo = `${prog.countryCode}-${gameYear}${gameMonth < 10 ? '0' + gameMonth : gameMonth}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newResidency: OwnedResidency = {
      id: `pr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      programId: prog.id,
      country: prog.country,
      countryCode: prog.countryCode,
      cardName: prog.cardName,
      cardCode: prog.cardCode,
      cardNumber: randomCardNo,
      issueYear: gameYear,
      issueMonth: gameMonth,
      categoryLabel: prog.categoryLabel,
      isNaturalized: false,
    };

    const updated = [newResidency, ...ownedResidencies];
    saveResidencies(updated);

    setSelectedProgram(null);
    showToast(`🎉 恭喜！已获发【${prog.country}】永久居留绿卡！扣除规费 ${prog.cost.toLocaleString()} ₽`);
    setActiveSubTab('dossier');
  };

  // 归化入籍宣誓仪式
  const handlePerformOath = (res: OwnedResidency) => {
    const NATURALIZE_FEE = 3000;
    if (coins < NATURALIZE_FEE) {
      showToast(`❌ 归化入籍国籍公证书规费需 ${NATURALIZE_FEE.toLocaleString()} ₽`);
      return;
    }

    setCoins((prev) => prev - NATURALIZE_FEE);
    const updated = ownedResidencies.map((item) => {
      if (item.id === res.id) {
        return {
          ...item,
          isNaturalized: true,
          naturalizedYear: gameYear,
          naturalizedMonth: gameMonth,
        };
      }
      return item;
    });

    saveResidencies(updated);
    setOathProgram(null);
    showToast(`👑 宣誓完成！正式加入【${res.country}】国籍，尊享全套主权国民政治与经济特权！`);
  };

  const filteredCountries = IMMIGRATION_COUNTRIES.filter((c) => {
    return c.country.includes(searchFilter);
  });

  return (
    <div className="absolute inset-0 bg-[#12141c] flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-200 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#2d3042] text-white border-2 border-black font-bold text-xs px-4 py-2.5 rounded-xl shadow-[0_4px_0_#000] animate-in fade-in slide-in-from-top-2 duration-200 text-center max-w-[90%] truncate">
          {toastMsg}
        </div>
      )}

      {/* Top Header Bar */}
      <div className="relative w-full h-16 bg-[#1f2230] border-b-2 border-black shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20 flex items-center justify-between px-3 flex-shrink-0">
        <button
          onClick={() => {
            if (selectedCountryGroup) {
              setSelectedCountryGroup(null);
            } else {
              onClose();
            }
          }}
          className="p-2 bg-[#2d3042] hover:bg-[#393d54] border-2 border-black rounded-xl active:translate-y-0.5 shadow-[0_2px_0_#000] cursor-pointer text-white flex items-center justify-center transition-all z-10"
        >
          <ChevronLeft size={20} className="text-white" strokeWidth={3} />
        </button>

        <div className="flex-1 flex items-center justify-center pointer-events-none px-2">
          <div className="bg-[#2a2d3e] border-2 border-purple-500/80 px-4 sm:px-5 py-1.5 rounded-xl shadow-[0_3px_0_#000] flex items-center gap-2">
            <Globe size={18} className="text-purple-400 flex-shrink-0" />
            <span className="text-purple-200 text-sm font-black tracking-wider">
              {selectedCountryGroup ? `${selectedCountryGroup.country} · 移民居留` : '移民居留'}
            </span>
          </div>
        </div>

        <div className="flex items-center bg-[#151722] rounded-full px-2.5 py-1 border border-black text-xs font-mono font-black z-10 shadow-[0_2px_0_#000]">
          <CircleDollarSign size={14} className="text-yellow-400 mr-1" />
          <span className="text-amber-300">{coins.toLocaleString()} ₽</span>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="bg-[#181a24] border-b-2 border-black p-2 flex items-center justify-between gap-1.5 flex-shrink-0">
        <button
          onClick={() => {
            setSelectedCountryGroup(null);
            setActiveSubTab('countries');
          }}
          className={`flex-1 py-2 px-1 text-center font-black text-xs rounded-xl border-2 border-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'countries'
              ? 'bg-[#6a518a] text-white shadow-[0_3px_0_#000]'
              : 'bg-[#232635] text-gray-400 hover:text-white'
          }`}
        >
          <Globe size={14} />
          <span>各国移民署</span>
        </button>

        <button
          onClick={() => {
            setSelectedCountryGroup(null);
            setActiveSubTab('dossier');
          }}
          className={`flex-1 py-2 px-1 text-center font-black text-xs rounded-xl border-2 border-black transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
            activeSubTab === 'dossier'
              ? 'bg-[#6a518a] text-white shadow-[0_3px_0_#000]'
              : 'bg-[#232635] text-gray-400 hover:text-white'
          }`}
        >
          <BadgeCheck size={14} />
          <span>居留权</span>
          {ownedResidencies.length > 0 && (
            <span className="bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full border border-black">
              {ownedResidencies.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setSelectedCountryGroup(null);
            setActiveSubTab('naturalize');
          }}
          className={`flex-1 py-2 px-1 text-center font-black text-xs rounded-xl border-2 border-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'naturalize'
              ? 'bg-[#6a518a] text-white shadow-[0_3px_0_#000]'
              : 'bg-[#232635] text-gray-400 hover:text-white'
          }`}
        >
          <Crown size={14} />
          <span>归化入籍盟约</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 custom-scrollbar bg-[#12141c]">
        {!isRegistered ? (
          /* Unregistered Notice Card */
          <div className="bg-[#232635] border-2 border-black rounded-2xl p-5 text-center space-y-3.5 shadow-[0_4px_0_#000] max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-white font-black text-base">尚未登记合法公民身份</h3>
              <p className="text-gray-400 text-xs leading-relaxed max-w-sm mx-auto">
                你尚未办理出生登记。各国移民公署要求申请人必须具备合法的本国公民身份，方可受理跨国居留与归化审理。
              </p>
            </div>
            {onOpenBirth && (
              <button
                onClick={() => {
                  onClose();
                  onOpenBirth();
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2.5 px-5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer transition-all inline-flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>前往办理出生登记</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* TAB 1: 各国移民公署与具体项目 */}
            {activeSubTab === 'countries' && (
              <div className="space-y-3.5 max-w-xl mx-auto">
                {/* 视图 1：如果未点开国家，则展示国家列表卡片 */}
                {!selectedCountryGroup ? (
                  <>
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="搜索国家..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="w-full bg-[#1e202e] text-white placeholder-gray-500 text-xs rounded-xl border-2 border-black pl-9 pr-3 py-2.5 focus:outline-none focus:border-purple-400 shadow-[0_2px_0_#000]"
                      />
                    </div>

                    {/* Country List (Table/List Style) */}
                    <div className="bg-[#1a1c28] border-2 border-black rounded-2xl overflow-hidden shadow-[0_4px_0_#000] divide-y divide-black/60">
                      {filteredCountries.map((countryGroup) => {
                        const hasPR = ownedResidencies.some(
                          (r) => r.countryCode === countryGroup.countryCode
                        );

                        return (
                          <div
                            key={countryGroup.countryCode}
                            onClick={() => setSelectedCountryGroup(countryGroup)}
                            className="p-3 sm:p-3.5 hover:bg-[#232638] active:bg-[#282c40] transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                          >
                            {/* Left: Flag & Country Name */}
                            <div className="flex items-center gap-3 min-w-0">
                              <HistoricalFlag
                                code={countryGroup.countryCode}
                                width={38}
                                height={24}
                                className="shadow-sm rounded-sm flex-shrink-0"
                              />
                              <div className="flex items-center gap-2 truncate">
                                <span className="text-white font-black text-sm tracking-wide group-hover:text-purple-300 transition-colors">
                                  {countryGroup.country}
                                </span>
                                {hasPR && (
                                  <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                                    <CheckCircle2 size={11} />
                                    <span>已获居留</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Right: Program count & Arrow */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[11px] text-gray-400 font-mono font-bold bg-[#12141e] px-2.5 py-1 rounded-lg border border-black">
                                {countryGroup.programs.length} 项法案
                              </span>
                              <ChevronRight size={16} className="text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  /* 视图 2：点开具体国家后的居留方式详情（列表风格） */
                  <div className="space-y-3">
                    {/* Back Banner */}
                    <div className="bg-[#1a1c28] border-2 border-black rounded-2xl p-3 shadow-[0_3px_0_#000] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <HistoricalFlag
                          code={selectedCountryGroup.countryCode}
                          width={34}
                          height={22}
                          className="shadow-sm"
                        />
                        <span className="text-white font-black text-sm">
                          {selectedCountryGroup.country} 移民署
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedCountryGroup(null)}
                        className="bg-[#2a2d3e] hover:bg-[#363a50] text-xs text-gray-200 font-bold px-3 py-1.5 rounded-xl border border-black cursor-pointer active:translate-y-0.5 transition-all flex items-center gap-1"
                      >
                        <ChevronLeft size={14} />
                        <span>返回列表</span>
                      </button>
                    </div>

                    {/* Programs in This Country (List Items) */}
                    <div className="bg-[#1a1c28] border-2 border-black rounded-2xl overflow-hidden shadow-[0_4px_0_#000] divide-y divide-black/60">
                      {selectedCountryGroup.programs.map((prog) => {
                        const isOwned = ownedResidencies.some((r) => r.programId === prog.id);
                        const canAfford = coins >= prog.cost && coins >= prog.minAssets;

                        return (
                          <div
                            key={prog.id}
                            className="p-3.5 space-y-3 hover:bg-[#202334]/50 transition-colors"
                          >
                            {/* Row Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] bg-black/60 text-purple-300 font-bold px-2 py-0.5 rounded border border-purple-500/30">
                                    {prog.categoryLabel}
                                  </span>
                                  <span className="text-white font-black text-sm">{prog.title}</span>
                                </div>
                                <span className="text-gray-400 text-xs font-mono block">
                                  {prog.cardName}
                                </span>
                              </div>

                              {isOwned ? (
                                <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 text-[11px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-sm flex-shrink-0">
                                  <CheckCircle2 size={13} />
                                  <span>已获居留</span>
                                </span>
                              ) : (
                                <div className="text-right flex-shrink-0">
                                  <span className="text-[10px] text-gray-400 block font-bold">规费</span>
                                  <span className="text-amber-300 font-mono font-black text-sm">
                                    {prog.cost.toLocaleString()} ₽
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Requirements inline badge row */}
                            <div className="flex items-center gap-2 text-[11px] font-mono text-gray-300 bg-[#12141e] p-2 rounded-xl border border-black/80 flex-wrap">
                              <div className="flex items-center gap-1">
                                <span className="text-gray-400">资产要求:</span>
                                <span className={coins >= prog.minAssets ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                  ≥{prog.minAssets.toLocaleString()} ₽
                                </span>
                              </div>
                              <span className="text-gray-600">|</span>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-400">体魄要求:</span>
                                <span className={health >= prog.minHealth ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                  ≥{prog.minHealth}点
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-0.5">
                              <button
                                onClick={() => setSelectedProgram(prog)}
                                className="bg-[#282b3d] hover:bg-[#32364c] text-gray-200 text-xs font-bold py-2 px-3 rounded-xl border border-black flex items-center gap-1 cursor-pointer transition-all active:translate-y-0.5 flex-shrink-0"
                              >
                                <FileText size={13} />
                                <span>法案规程</span>
                              </button>

                              {!isOwned && (
                                <button
                                  onClick={() => handleApplyResidency(prog)}
                                  disabled={!canAfford || health < prog.minHealth}
                                  className={`flex-1 font-black text-xs py-2 px-3 rounded-xl border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    !canAfford || health < prog.minHealth
                                      ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed opacity-75'
                                      : 'bg-purple-700 hover:bg-purple-600 text-white'
                                  }`}
                                >
                                  <Award size={14} />
                                  <span>申领居留 ({prog.cost.toLocaleString()} ₽)</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: 居留权 (列表模式) */}
            {activeSubTab === 'dossier' && (
              <div className="space-y-3.5 max-w-xl mx-auto">
                {ownedResidencies.length === 0 ? (
                  <div className="bg-[#1a1c28] border-2 border-black rounded-2xl p-8 text-center space-y-3 shadow-[0_4px_0_#000]">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 border-2 border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                      <Globe size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-white font-black text-sm">暂无已获居留权</h4>
                      <p className="text-gray-400 text-xs max-w-xs mx-auto">
                        你当前仅持有阿米诺斯本土公民身份。可前往「各国移民署」申办居留。
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveSubTab('countries')}
                      className="bg-purple-700 hover:bg-purple-600 text-white font-black text-xs py-2.5 px-4 rounded-xl border-2 border-black shadow-[0_3px_0_#000] cursor-pointer transition-all inline-flex items-center gap-1.5"
                    >
                      <Globe size={14} />
                      <span>浏览各国移民署法案</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-gray-400 font-bold px-1">
                      <span>已持有名录 ({ownedResidencies.length})</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <ShieldCheck size={14} />
                        <span>公署认证</span>
                      </span>
                    </div>

                    {/* Dossier List Mode */}
                    <div className="bg-[#1a1c28] border-2 border-black rounded-2xl overflow-hidden shadow-[0_4px_0_#000] divide-y divide-black/60">
                      {ownedResidencies.map((res) => (
                        <div
                          key={res.id}
                          className="p-3.5 space-y-2.5 hover:bg-[#222538]/50 transition-colors"
                        >
                          {/* Row Header */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <HistoricalFlag code={res.countryCode} width={38} height={24} className="shadow-sm rounded-sm flex-shrink-0" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-black text-sm">
                                    {res.country}
                                  </span>
                                  <span className="text-[10px] bg-purple-950/80 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-bold">
                                    {res.categoryLabel}
                                  </span>
                                </div>
                                <span className="text-[11px] text-gray-400 font-mono block">
                                  {res.cardName}
                                </span>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              {res.isNaturalized ? (
                                <span className="bg-amber-400 text-black border border-black font-black text-[10px] px-2 py-0.5 rounded shadow-sm inline-flex items-center gap-1">
                                  <Crown size={11} />
                                  <span>已归化</span>
                                </span>
                              ) : (
                                <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold text-[10px] px-2 py-0.5 rounded">
                                  居留生效中
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Details strip */}
                          <div className="flex items-center justify-between text-[11px] font-mono bg-[#12141e] px-3 py-1.5 rounded-xl border border-black/80 text-gray-300">
                            <span>持证: <strong className="text-white">{playerName}</strong></span>
                            <span>编号: <strong className="text-amber-300">{res.cardNumber}</strong></span>
                            <span>签发: {res.issueYear}.{res.issueMonth < 10 ? `0${res.issueMonth}` : res.issueMonth}</span>
                          </div>

                          {/* Action if not naturalized */}
                          {!res.isNaturalized && (
                            <button
                              onClick={() => setOathProgram(res)}
                              className="w-full bg-[#352549] hover:bg-[#45315f] text-purple-200 font-bold text-xs py-1.5 rounded-xl border border-black flex items-center justify-center gap-1 cursor-pointer transition-all active:translate-y-0.5"
                            >
                              <Crown size={13} className="text-amber-400" />
                              <span>申请归化【{res.country}】国籍</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: 归化入籍盟约 */}
            {activeSubTab === 'naturalize' && (
              <div className="space-y-4 max-w-xl mx-auto">
                <div className="bg-[#1f2230] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-3">
                  <div className="flex items-center gap-2 text-white font-black text-sm pb-2 border-b border-black/50">
                    <Crown size={18} className="text-amber-400" />
                    <span>主权国归化入籍法案 (Naturalization Law)</span>
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    在持有该国永久居留证件的基础上，外国居民可向其内政公署提出《归化入籍宣言》，签署忠诚盟约，正式取得双重国籍与主权国民全部政治与外交保护权。
                  </p>
                </div>

                {ownedResidencies.length === 0 ? (
                  <div className="bg-[#232635] border-2 border-black rounded-2xl p-6 text-center space-y-3 shadow-[0_4px_0_#000]">
                    <AlertCircle size={28} className="text-amber-400 mx-auto" />
                    <h4 className="text-white font-black text-sm">尚无可供归化的永居身份</h4>
                    <p className="text-gray-400 text-xs max-w-xs mx-auto">
                      请先前往办理海外永久居留绿卡，满足移民公署居住资质后方可进行入籍宣誓。
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ownedResidencies.map((res) => (
                      <div
                        key={res.id}
                        className="bg-[#232635] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <HistoricalFlag code={res.countryCode} width={36} height={22} className="shadow" />
                          <div>
                            <span className="text-white font-black text-sm block">{res.country}</span>
                            <span className="text-gray-400 text-xs">
                              {res.isNaturalized
                                ? `于 ${res.naturalizedYear}.${res.naturalizedMonth} 完成归化`
                                : '已满足永居前置条件，可申请归化'}
                            </span>
                          </div>
                        </div>

                        {res.isNaturalized ? (
                          <div className="bg-amber-400 text-black font-black text-xs px-3 py-1.5 rounded-xl border border-black shadow-sm flex items-center gap-1">
                            <Crown size={14} />
                            <span>正统公民</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setOathProgram(res)}
                            className="bg-purple-700 hover:bg-purple-600 text-white font-black text-xs py-2 px-3.5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer transition-all flex items-center gap-1"
                          >
                            <Stamp size={14} />
                            <span>入籍宣誓</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL: Program Details & Law Articles */}
      {selectedProgram && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#1f2230] border-3 border-black rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-[0_8px_0_#000] animate-in zoom-in-95 duration-150 overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="bg-[#282c3f] p-4 border-b-2 border-black flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <HistoricalFlag code={selectedProgram.countryCode} width={34} height={21} />
                <div>
                  <h3 className="text-white font-black text-sm">{selectedProgram.country}移民署</h3>
                  <span className="text-[11px] text-purple-300 font-bold">{selectedProgram.cardName}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProgram(null)}
                className="p-1.5 bg-[#181a24] hover:bg-[#232635] text-gray-300 rounded-lg border border-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs custom-scrollbar">
              <div className="space-y-1.5">
                <span className="text-purple-300 font-black text-xs flex items-center gap-1">
                  <BookOpen size={14} />
                  <span>历史法案背景</span>
                </span>
                <p className="text-gray-300 bg-[#151722] p-3 rounded-xl border border-black/60 leading-relaxed text-[11px]">
                  {selectedProgram.lore}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-white font-black text-xs flex items-center gap-1">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>公署资格审查标准</span>
                </span>
                <div className="space-y-1.5">
                  {selectedProgram.requirements.map((req, idx) => (
                    <div
                      key={idx}
                      className="bg-[#151722] p-2.5 rounded-lg border border-black/60 flex items-center gap-2 text-gray-300"
                    >
                      <Check size={13} className="text-emerald-400 flex-shrink-0" />
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-white font-black text-xs flex items-center gap-1">
                  <Sparkles size={14} />
                  <span>持卡人专属法权与常驻收益</span>
                </span>
                <div className="space-y-1.5">
                  {selectedProgram.benefits.map((b, idx) => (
                    <div
                      key={idx}
                      className="bg-[#151722] p-2.5 rounded-lg border border-black/60 flex items-start gap-2 text-purple-200"
                    >
                      <Crown size={13} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span className="leading-tight">{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#181a24] border-t-2 border-black flex gap-2 flex-shrink-0">
              <button
                onClick={() => setSelectedProgram(null)}
                className="px-4 py-2.5 bg-[#2a2d3e] text-gray-300 font-bold rounded-xl border border-black cursor-pointer text-xs"
              >
                返回
              </button>
              <button
                onClick={() => handleApplyResidency(selectedProgram)}
                className="flex-1 bg-purple-700 hover:bg-purple-600 text-white font-black text-xs py-2.5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Award size={14} />
                <span>立即递交居留申请 ({selectedProgram.cost.toLocaleString()} ₽)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Oath & Naturalization Ceremony */}
      {oathProgram && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#1f2230] border-3 border-black rounded-2xl w-full max-w-md flex flex-col shadow-[0_10px_0_#000] animate-in zoom-in-95 duration-150 overflow-hidden font-sans">
            <div className="bg-gradient-to-r from-[#493166] to-[#2d1f40] p-4 border-b-2 border-black flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Crown size={18} className="text-yellow-400" />
                <span className="font-black text-sm">【{oathProgram.country}】归化入籍盟约仪式</span>
              </div>
              <button
                onClick={() => setOathProgram(null)}
                className="text-gray-300 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="text-center space-y-2">
                <HistoricalFlag code={oathProgram.countryCode} width={50} height={30} className="mx-auto shadow-md" />
                <h4 className="text-white font-black text-base">签署归化忠诚誓言</h4>
                <p className="text-gray-300 text-[11px] leading-relaxed max-w-xs mx-auto">
                  我谨以【{playerName}】之名宣誓：恪守【{oathProgram.country}】宪章与主权法度，自愿履行主权国民之神圣义务，受帝国法律庇佑。
                </p>
              </div>

              <div className="bg-[#151722] p-3.5 rounded-xl border border-black space-y-2 text-[11px]">
                <div className="flex justify-between text-gray-300">
                  <span>宣誓人：</span>
                  <span className="text-white font-bold">{playerName}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>居留凭证编号：</span>
                  <span className="text-amber-300 font-mono">{oathProgram.cardNumber}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>国籍公证规费：</span>
                  <span className="text-amber-300 font-mono font-bold">3,000 ₽</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#181a24] border-t-2 border-black flex gap-2">
              <button
                onClick={() => setOathProgram(null)}
                className="px-4 py-2.5 bg-[#2a2d3e] text-gray-300 font-bold rounded-xl border border-black cursor-pointer text-xs"
              >
                取消
              </button>
              <button
                onClick={() => handlePerformOath(oathProgram)}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs py-2.5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Stamp size={15} />
                <span>签署盟誓并盖印归化 (支付 3,000 ₽)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
