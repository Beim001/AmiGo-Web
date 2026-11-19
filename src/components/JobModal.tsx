import {
  addLifeLog } from '../lib/lifeLog';
import { MIN_WORK_AGE,
  WORK_DAYS_PER_MONTH } from '../lib/monthly';
import { CHILD_JOBS,
  CHILD_JOB_KEY,
  readChildJob } from '../lib/lineage';
import React,
  { useState,
  useMemo } from 'react';
import {
  ChevronLeft,
  Briefcase,
  Search,
  CheckCircle2,
  Building2,
  Zap,
  Award,
  FileText,
  UserCheck,
  TrendingUp,
  Anchor,
  Compass,
  Scale,
  GraduationCap,
  Flame,
  Shield,
  Cpu,
  Sparkles,
  RefreshCw,
  LogOut,
  Clock,
  X,
  SlidersHorizontal,
  FileCheck,
  Crown,
  Check,
  Stamp,
  Medal,
  Layers,
} from 'lucide-react';
import { CurrencyIcon } from './CurrencyIcon';
import { CURRENCY } from '../data/seasons';
import { useTranslation } from 'react-i18next';
import { LicenseId, loadLicenses, meetsLicense, licenseById } from '../lib/vehicles';
import { isInPrison, PRISON_BLOCK_TEXT, barredByRecord, hasActiveRecord, BARRED_JOB_CATEGORY } from '../lib/prison';

export interface JobModalProps {
  onClose: () => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  /** 玩家年龄：未满 16 岁不能应聘、不发薪 */
  age: number;
  /** 家族阶层允许打童工（乞丐、平民家庭 8–15 岁） */
  childLaborAllowed?: boolean;
  /** 当前游戏年月（判断前科是否仍有效） */
  gameYear: number;
  gameMonth: number;
}

export interface JobPosition {
  id: string;
  title: string;
  category: string;
  department: string;
  dailySalary: number;
  reqSkill: string;
  iconName: string;
  badge: string;
  badgeColor: string;
  desc: string;
  responsibilities: string[];
  /** 需要持有的执照（第 67.4 题：车夫需马车执照） */
  requiresLicense?: LicenseId;
}

export const JOB_POSITIONS: JobPosition[] = [
  {
    id: 'j1',
    title: '俄文通译',
    category: '金融文职',
    department: '帝国涉外洋务局',
    dailySalary: 1200,
    reqSkill: '俄语流利 · 学识≥30',
    iconName: 'Compass',
    badge: '外交文职',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
    desc: '负责对俄贸易提单、远东边境照会与商务合同的俄语同声翻译与文书校验。',
    responsibilities: ['同声笔译对外照会', '校验港口边贸提单', '接待涉外领事代表'],
  },
  {
    id: 'j2',
    title: '巡捕',
    category: '政法治安',
    department: '中央巡捕房',
    dailySalary: 1050,
    reqSkill: '格斗基础 · 体魄≥25',
    iconName: 'Shield',
    badge: '治安公职',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/50',
    desc: '负责租界与街道巡视、治安维护、查验盘问嫌疑人员及维护市容秩序。',
    responsibilities: ['街区例行治安巡逻', '盘查无证边境人员', '调解市井治安纠纷'],
  },
  {
    id: 'j3',
    title: '关税稽查员',
    category: '政法治安',
    department: '边境帝国关税局',
    dailySalary: 1500,
    reqSkill: '心细如发 · 学识≥35',
    iconName: 'FileText',
    badge: '海关财政',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    desc: '驻守边境海关与港口货栈，核验出入境货运清单、查验夹带税品与开具关税凭单。',
    responsibilities: ['登船抽查货柜清单', '征收违禁品关税', '核验关票与纳税印花'],
  },
  {
    id: 'j4',
    title: '交易所代理经纪人',
    category: '金融文职',
    department: '帝国证券交易所',
    dailySalary: 2200,
    reqSkill: '敏锐嗅觉 · 资本≥5万',
    iconName: 'TrendingUp',
    badge: '高薪金融',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    desc: '代理客户在证券交易所撮合股票买卖、盯盘跑单与出具每日大盘行情分析报告。',
    responsibilities: ['撮合买卖股票订单', '撰写每日盘面研报', '盯防股市多空爆仓'],
  },
  {
    id: 'j5',
    title: '铁路司炉工',
    category: '工程采掘',
    department: '远东铁路局总工务段',
    dailySalary: 950,
    reqSkill: '吃苦耐劳 · 体魄≥30',
    iconName: 'Flame',
    badge: '重工体力',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    desc: '负责远东蒸汽机车锅炉的高强度铲煤、加水与气压监测，确保列车准点发车。',
    responsibilities: ['连续铲煤维持锅炉气压', '检查蒸汽阀门密封性', '配合司机按时发车'],
  },
  {
    id: 'j6',
    title: '矿井工',
    category: '工程采掘',
    department: '阿穆尔重工采矿场',
    dailySalary: 1100,
    reqSkill: '耐受恶劣环境 · 体魄≥35',
    iconName: 'Cpu',
    badge: '硬核采掘',
    badgeColor: 'bg-stone-500/20 text-stone-300 border-stone-500/50',
    desc: '深入地下数百米矿道开凿矿石、安放支护木桩与运送矿车，体力消耗极大。',
    responsibilities: ['开采高纯度铁矿石', '加固地下支撑巷道', '清运重型运矿拖车'],
  },
  {
    id: 'j7',
    title: '伐木场巡林员',
    category: '工程采掘',
    department: '北方兴安林业局',
    dailySalary: 880,
    reqSkill: '野外生存 · 体魄≥20',
    iconName: 'Compass',
    badge: '林业巡视',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    desc: '巡查原始森林伐木场、防止非法盗伐、测算原木胸径与防范森林火灾。',
    responsibilities: ['巡视百里森林防火带', '标记可砍伐优质原木', '查抄私砍盗伐队'],
  },
  {
    id: 'j8',
    title: '医院/诊所医务助手',
    category: '教育医疗',
    department: '布津综合医院',
    dailySalary: 980,
    reqSkill: '护理常识 · 心细体贴',
    iconName: 'Zap',
    badge: '医疗卫生',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
    desc: '协助医师消毒手术器具、整理诊室病历、配置基础药剂与协助照顾留观病人。',
    responsibilities: ['配置基础调理针剂', '消毒手术室与医疗器械', '照顾留观急救病人'],
  },
  {
    id: 'j9',
    title: '水电厂机械技师',
    category: '工业制造',
    department: '松花江水力发电总厂',
    dailySalary: 1800,
    reqSkill: '机械工程 · 学识≥35',
    iconName: 'Cpu',
    badge: '电力技术',
    badgeColor: 'bg-blue-600/20 text-blue-300 border-blue-600/50',
    desc: '维护发电机组水轮机、油压调节器与管道阀门，保障城市电网与水力稳定。',
    responsibilities: ['检修水轮发电机转子', '调校高压变压器线路', '监控厂区实时发受电'],
  },
  {
    id: 'j10',
    title: '俄语同文馆教员',
    category: '教育医疗',
    department: '皇家同文翻译学堂',
    dailySalary: 1600,
    reqSkill: '俄语精通 · 名望≥20',
    iconName: 'GraduationCap',
    badge: '名门授业',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
    desc: '教授学员俄语语法、公文写作与远东民俗，为各行各业培养涉外语言人才。',
    responsibilities: ['讲解俄语公文写作', '批改涉外学员试卷', '编撰新版涉外教材'],
  },
  {
    id: 'j11',
    title: '排字工',
    category: '工业制造',
    department: '帝国远东日报社印刷厂',
    dailySalary: 850,
    reqSkill: '手速敏捷 · 识字无误',
    iconName: 'FileText',
    badge: '报纸出版',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
    desc: '在报社与印书馆按照手稿挑选铅字、反向排版、固定字盘与配合油墨压印。',
    responsibilities: ['挑选铅字反向组版', '调配快速干油墨', '校对头条新闻样张'],
  },
  {
    id: 'j12',
    title: '纺织厂工人',
    category: '工业制造',
    department: '第一纺织大工坊',
    dailySalary: 720,
    reqSkill: '眼疾手快 · 动作熟练',
    iconName: 'Building2',
    badge: '轻工流水',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
    desc: '操纵蒸汽织布机与细纱机，巡回接头、清理飞絮与检验布匹质量。',
    responsibilities: ['看管蒸汽飞梭织布机', '快速接断纱线头', '卷装棉布匹打捆'],
  },
  {
    id: 'j13',
    title: '远洋领航员',
    category: '交通海事',
    department: '海峡远洋航运工会',
    dailySalary: 2800,
    reqSkill: '航海观测 · 学识≥40',
    iconName: 'Anchor',
    badge: '高级航海',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/50',
    desc: '熟悉港口水深、暗礁与潮汐，手持海图引导万吨远洋轮船安全进出港湾。',
    responsibilities: ['测算港口水深与潮汐', '掌舵引导巨型货轮进港', '避开危险暗礁与沙洲'],
  },
  {
    id: 'j14',
    title: '律政士',
    category: '政法治安',
    department: '远东最高律政师公会',
    dailySalary: 2500,
    reqSkill: '精通法律 · 名望≥30',
    iconName: 'Scale',
    badge: '高端诉讼',
    badgeColor: 'bg-[#a68245]/20 text-[#eab308] border-[#a68245]/50',
    desc: '起草民商事诉状、代理法庭辩护与调解合同纠纷，熟悉大清律例与公约。',
    responsibilities: ['起草商业诉讼抗辩书', '出庭代理法庭辩护', '调解企业巨额合同纠纷'],
  },
  {
    id: 'j15',
    title: '缉私官',
    category: '政法治安',
    department: '帝国缉私总署',
    dailySalary: 1950,
    reqSkill: '武力强悍 · 体魄≥35',
    iconName: 'Shield',
    badge: '缉私特警',
    badgeColor: 'bg-red-600/20 text-red-400 border-red-600/50',
    desc: '带队登上 संदिग्ध船只与货运火车进行突击搜查，查扣走私鸦片与违禁物资。',
    responsibilities: ['深夜突袭走私货船', '清点违禁军火与鸦片', '逮捕走私团伙头头'],
  },
  {
    id: 'j16',
    title: '抄录员',
    category: '金融文职',
    department: '市政档案文书馆',
    dailySalary: 650,
    reqSkill: '字迹工整 · 耐性极佳',
    iconName: 'FileText',
    badge: '基础文员',
    badgeColor: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
    desc: '用钢笔与毛笔抄写政府案卷、商业账目与教会档案，要求字迹工整无误。',
    responsibilities: ['誊抄户籍与税务案卷', '整理过期商业契约', '抄录官方通告底稿'],
  },
  {
    id: 'j17',
    title: '教习',
    category: '教育医疗',
    department: '白山崇文书院',
    dailySalary: 1400,
    reqSkill: '经史通晓 · 学识≥25',
    iconName: 'GraduationCap',
    badge: '传统教头',
    badgeColor: 'bg-amber-600/20 text-amber-300 border-amber-600/50',
    desc: '在书院或新式学堂主持日常教学、督导学生经史子集与近代科学功课。',
    responsibilities: ['主持学堂晨诵与晚自习', '督导学生修习算术格物', '主持月度学业考评'],
  },
  {
    id: 'j18',
    title: '冠军',
    category: '体育文娱',
    department: '地下打斗黑擂台',
    dailySalary: 3200,
    reqSkill: '擂台战神 · 体魄≥50',
    iconName: 'Award',
    badge: '擂台传奇',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 font-black',
    desc: '参加打斗竞技场、拳击大擂台与力量表演，用硬实力赢取丰厚出场费与奖金。',
    responsibilities: ['登台对决守擂挑战者', '完成力量举重表演', '横扫竞技场无敌记录'],
  },
  {
    id: 'j19',
    title: '煤炭工人',
    category: '工程采掘',
    department: '远东黑金煤炭堆场',
    dailySalary: 1000,
    reqSkill: '不怕脏累 · 体力充沛',
    iconName: 'Flame',
    badge: '煤炭采矿',
    badgeColor: 'bg-[#42454d]/40 text-gray-200 border-gray-600',
    desc: '负责煤矿堆场分拣、装卸煤车与煤质筛选，工作环境充满煤尘但需求巨大。',
    responsibilities: ['挑选优质无烟煤块', '装载百吨煤炭货运车', '清理煤渣与风选精煤'],
  },
  {
    id: 'j20',
    title: '炼油厂工人',
    category: '工业制造',
    department: '皇家火油分馏炼制厂',
    dailySalary: 1250,
    reqSkill: '化工基础 · 谨慎小心',
    iconName: 'Building2',
    badge: '石油化工',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/50',
    desc: '监控分馏塔温度、取样测试煤油与润滑油纯度，操作高温高压管道设备。',
    responsibilities: ['观测煤油分馏塔温度', '灌装防爆铁桶煤油', '巡检高压蒸汽管线'],
  },
  {
    id: 'j21',
    title: '车夫',
    category: '交通海事',
    department: '北城车马行',
    dailySalary: 700,
    reqSkill: '持马车执照 · 识得街巷',
    iconName: 'Compass',
    badge: '需马车执照',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/50',
    desc: '替车马行赶车，接送往来北城各区的客人与货物，照料挽马与车具。',
    responsibilities: ['驾驭挽马接送客人', '照料马匹与车具', '熟记城中街巷捷径'],
    requiresLicense: 'carriage',
  },
  {
    id: 'j22',
    title: '马夫',
    category: '交通海事',
    department: '皇家御马场',
    dailySalary: 650,
    reqSkill: '吃苦耐劳 · 不怕脏累',
    iconName: 'Building2',
    badge: '马厩杂役',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    desc: '照料御马场的马匹：添草料、刷洗马身、清理马厩，跟着兽医学看马病。',
    responsibilities: ['按时添加草料与清水', '刷洗马匹打理鬃毛', '清扫马厩更换垫草'],
  },
  {
    id: 'j23',
    title: '驯马师',
    category: '体育文娱',
    department: '皇家御马场',
    dailySalary: 1100,
    reqSkill: '懂马性 · 骑术精湛',
    iconName: 'Award',
    badge: '驯养技艺',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    desc: '调教幼马上鞍拉车，为赛马会训练名驹，替权贵挑选良马。',
    responsibilities: ['调教幼马上鞍套车', '训练赛马冲刺耐力', '为买主相马估价'],
  },
];

export interface CompanyInfo {
  name: string;
  type: string;
  established: string;
  scale: string;
  location: string;
  registeredCapital: string;
  desc: string;
  benefits: string[];
}

export const COMPANY_DATA: Record<string, CompanyInfo> = {
  '帝国涉外洋务局': {
    name: '帝国涉外洋务局',
    type: '国有特许行政机关',
    established: '1862年',
    scale: '800 - 1500人',
    location: '首都布津外务大街18号领事馆区',
    registeredCapital: `1,800万 ${CURRENCY.symbol}`,
    desc: '阿米诺斯帝国专理涉外通商、外交领事事务及对俄边境贸易提单核验的核心行政机关。下设领事司、通商司与涉外同文翻译处，掌控远东多国边境贸易准入权。',
    benefits: ['享帝国公职津贴', '包午餐膳食', '年度出境考察', '配发官定制服'],
  },
  '中央巡捕房': {
    name: '中央巡捕房',
    type: '执法治安司法机构',
    established: '1875年',
    scale: '2000 - 5000人',
    location: '首都布津中央大街1号法政大楼',
    registeredCapital: `2,500万 ${CURRENCY.symbol}`,
    desc: '负责首都布津及各商埠租界治安秩序维持、突发治安事件处置与市容盘查的核心警察执法部门，配备骑警队、突击巡捕队与治安侦缉科。',
    benefits: ['高额执勤风险补贴', '医疗全额报销', '住房官邸分配', '勋章绩效奖励'],
  },
  '边境帝国关税局': {
    name: '边境帝国关税局',
    type: '海关财政征稽机关',
    established: '1880年',
    scale: '1000 - 3000人',
    location: '阿穆尔口岸海关大楼',
    registeredCapital: `3,000万 ${CURRENCY.symbol}`,
    desc: '掌控帝国远东边境口岸与海港货物进出口关税征收、验放凭单签发与缉私抽检，是帝国财政收入的重要支柱部门。',
    benefits: ['关口绩效高额奖金', '包吃住宿营', '退伍优先提拔', '专业关务培训'],
  },
  '帝国证券交易所': {
    name: '帝国证券交易所',
    type: '特许股份制金融机构',
    established: '1892年',
    scale: '300 - 800人',
    location: '金融街金融大厦交易大厅',
    registeredCapital: `8,000万 ${CURRENCY.symbol}`,
    desc: '帝国规模最大、交易最活跃的证券集中交易场所，涵盖铁路、矿业、航运与银行等数百家上市公司的股票与债券搓合交易。',
    benefits: ['行业顶尖薪资分红', '午间高档自助', '内幕研报优先获取', '年终巨额奖金'],
  },
  '远东铁路局总工务段': {
    name: '远东铁路局总工务段',
    type: '皇家重工国有企业',
    established: '1888年',
    scale: '10000+人',
    location: '远东铁路枢纽总站工务大楼',
    registeredCapital: `1.2亿 ${CURRENCY.symbol}`,
    desc: '横跨远东大平原的蒸汽机车与铁路线路运营维护总枢纽，下辖机务段、车辆段、电务段与调度中心，保障交通动脉畅通。',
    benefits: ['铁路职工免费乘车', '高温寒暑专项补贴', '家属医疗保障', '退休养老金待遇'],
  },
  '阿穆尔重工采矿场': {
    name: '阿穆尔重工采矿场',
    type: '特许重工业采掘企业',
    established: '1885年',
    scale: '3000 - 8000人',
    location: '阿穆尔黑山矿区1号采场',
    registeredCapital: `5,000万 ${CURRENCY.symbol}`,
    desc: '阿米诺斯帝国远东最大的铁矿石与稀有金属采掘基业，拥有深井开采设备与重型拖车运输队，为帝国军工与铁路提供原材料。',
    benefits: ['硬核采矿高日薪', '井下特别津贴', '免费高热量膳食', '工伤全额保险'],
  },
  '布津综合医院': {
    name: '布津综合医院',
    type: '公立高等医疗卫生机构',
    established: '1890年',
    scale: '500 - 1200人',
    location: '公卫路99号医疗园区',
    registeredCapital: `1,500万 ${CURRENCY.symbol}`,
    desc: '拥有现代西医外科、急诊科与药剂研究室的综合性三级医院，承担首都布津医疗救治、公卫防疫与医药教学重任。',
    benefits: ['医疗专家指导', '家属就医折扣', '舒适工作环境', '定期体检津贴'],
  },
  '松花江水力发电总厂': {
    name: '松花江水力发电总厂',
    type: '国家电力基础设施企业',
    established: '1898年',
    scale: '600 - 1500人',
    location: '松花江水利枢纽大坝区',
    registeredCapital: `4,500万 ${CURRENCY.symbol}`,
    desc: '利用松花江丰沛水力资源建立的巨型水电枢纽，拥有大口径水轮发电机组，为周边工业区与居民区提供稳定电力。',
    benefits: ['电力员工优惠用电', '高技术岗位津贴', '包宿包餐', '职业技能提升补助'],
  },
  '皇家同文翻译学堂': {
    name: '皇家同文翻译学堂',
    type: '高等名门语言教育学堂',
    established: '1870年',
    scale: '200 - 500人',
    location: '文化区同文路88号',
    registeredCapital: `1,000万 ${CURRENCY.symbol}`,
    desc: '帝国专门培养外交、通商、边政与公文翻译人才的皇家名校，拥有数十名俄语、德语与法文教习大师。',
    benefits: ['学术名望加成', '寒暑假带薪休假', '藏书馆免费借阅', '名门社会地位'],
  },
  '北城车马行': {
    name: '北城车马行',
    type: '民营客货运输车行',
    established: '1858年',
    scale: '100 - 300人',
    location: '北城驿道口车马驿站',
    registeredCapital: `120万 ${CURRENCY.symbol}`,
    desc: '城中最大的出租马车行，经营客运马车与货运大车，承接婚丧嫁娶、商号送货与驿站接驳。车夫须持交通署核发的马车执照。',
    benefits: ['供应午间干粮', '马厩值夜津贴', '车资分成', '冬季配发皮袄'],
  },
  '皇家御马场': {
    name: '皇家御马场',
    type: '皇室直属养马场',
    established: '1830年',
    scale: '300 - 800人',
    location: '北城西郊草场',
    registeredCapital: `600万 ${CURRENCY.symbol}`,
    desc: '为宫廷与骑兵繁育挽马、战马与名驹的皇家马场，每年春季举办赛马会，也向民间出售退役马匹。',
    benefits: ['包食宿', '赛马会观礼席位', '马匹折价认购', '年节赏银'],
  },
};

export const getCompanyInfo = (deptName: string): CompanyInfo => {
  if (COMPANY_DATA[deptName]) {
    return COMPANY_DATA[deptName];
  }
  return {
    name: deptName,
    type: '帝国特许行业重点企事业单位',
    established: '1885年',
    scale: '500 - 2000人',
    location: '阿米诺斯首都布津 · 行业产业园区',
    registeredCapital: `2,000万 ${CURRENCY.symbol}`,
    desc: `${deptName}是阿米诺斯帝国在该行业领头设立的核心企事业单位，承担着帝国经济建设、社会保障与产业运营的重要职责。`,
    benefits: ['行业标准薪酬待遇', '包午餐与工作服', '定期工效奖金', '职业晋升通道'],
  };
};

// 读取当前在职岗位 ID：未存档或存为空字符串 → 待业
// （undefined.md 第 3 题 A：新存档默认待业，年满 16 岁才能就业）
export const CURRENT_JOB_KEY = 'amigo_current_job_id';
export const JOB_HISTORY_KEY = 'amigo_job_history';
export const readCurrentJobId = (): string | null => {
  try {
    return localStorage.getItem(CURRENT_JOB_KEY) || null;
  } catch (e) {
    return null;
  }
};

/** 玩家做过的所有岗位（就业记录 + 当前岗位） */
export const readJobHistoryIds = (): string[] => {
  try {
    const history = JSON.parse(localStorage.getItem(JOB_HISTORY_KEY) || '[]');
    const current = readCurrentJobId();
    const ids: string[] = Array.isArray(history) ? history : [];
    return current && !ids.includes(current) ? [current, ...ids] : ids;
  } catch (e) {
    return [];
  }
};

// 岗位分类筛选中“全部”的取值；其余取值是岗位数据里的分类名（保持原文）
const CATEGORY_ALL = 'all';

export const JobModal: React.FC<JobModalProps> = ({ onClose, coins, setCoins, age, childLaborAllowed = false, gameYear, gameMonth }) => {
  const { t } = useTranslation('job');
  const [childJobId, setChildJobId] = useState<string | null>(() => readChildJob()?.id ?? null);
  const setChildJob = (id: string | null) => {
    setChildJobId(id);
    try {
      if (id) localStorage.setItem(CHILD_JOB_KEY, id);
      else localStorage.removeItem(CHILD_JOB_KEY);
    } catch (e) {}
  };
  const [activeTab, setActiveTab] = useState<'hall' | 'resume'>('hall');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_ALL);
  const [sortBy, setSortBy] = useState<'default' | 'salary_desc' | 'salary_asc'>('default');
  const [toast, setToast] = useState<string | null>(null);

  // Screen View Detail Navigation State
  const [selectedJobDetail, setSelectedJobDetail] = useState<JobPosition | null>(null);
  const [selectedCompanyDetail, setSelectedCompanyDetail] = useState<CompanyInfo | null>(null);

  // Saved Job State
  const [currentJobId, setCurrentJobId] = useState<string | null>(readCurrentJobId);

  const [jobHistoryIds, setJobHistoryIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(JOB_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const historyJobs = useMemo(() => {
    return jobHistoryIds
      .map((id) => JOB_POSITIONS.find((j) => j.id === id))
      .filter((j): j is JobPosition => j !== undefined);
  }, [jobHistoryIds]);


  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const currentJob = JOB_POSITIONS.find((j) => j.id === currentJobId) || null;

  const categories = [CATEGORY_ALL, '政法治安', '工程采掘', '金融文职', '教育医疗', '交通海事', '工业制造', '体育文娱'];

  const filteredJobs = useMemo(() => {
    return JOB_POSITIONS.filter((job) => {
      const matchCat = selectedCategory === CATEGORY_ALL || job.category === selectedCategory;
      const matchSearch =
        search.trim() === '' ||
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.department.toLowerCase().includes(search.toLowerCase()) ||
        job.desc.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    }).sort((a, b) => {
      if (sortBy === 'salary_desc') return b.dailySalary - a.dailySalary;
      if (sortBy === 'salary_asc') return a.dailySalary - b.dailySalary;
      return 0;
    });
  }, [selectedCategory, search, sortBy]);

  const getJobIcon = (iconName: string) => {
    switch (iconName) {
      case 'Compass': return <Compass size={18} />;
      case 'Shield': return <Shield size={18} />;
      case 'FileText': return <FileText size={18} />;
      case 'TrendingUp': return <TrendingUp size={18} />;
      case 'Flame': return <Flame size={18} />;
      case 'Cpu': return <Cpu size={18} />;
      case 'Zap': return <Zap size={18} />;
      case 'GraduationCap': return <GraduationCap size={18} />;
      case 'Building2': return <Building2 size={18} />;
      case 'Anchor': return <Anchor size={18} />;
      case 'Scale': return <Scale size={18} />;
      case 'Award': return <Award size={18} />;
      default: return <Briefcase size={18} />;
    }
  };

  const handleApply = (job: JobPosition) => {
    if (age < MIN_WORK_AGE) {
      showToast(t('toast.tooYoung', { min: MIN_WORK_AGE, age }));
      return;
    }
    if (currentJobId === job.id) {
      showToast(t('toast.alreadyIn', { job: job.title }));
      return;
    }
    // 狱中不能应聘；有前科时政法治安类岗位不录用（第 67.7 题）
    if (isInPrison()) {
      showToast(`⛓️ ${PRISON_BLOCK_TEXT}`);
      return;
    }
    if (barredByRecord(job, hasActiveRecord(gameYear, gameMonth))) {
      showToast(t('toast.barred', { category: BARRED_JOB_CATEGORY }));
      return;
    }
    if (!meetsLicense(job, loadLicenses())) {
      showToast(t('toast.needLicense', { job: job.title, license: licenseById(job.requiresLicense!)?.name ?? t('license') }));
      return;
    }
    setCurrentJobId(job.id);
    try {
      localStorage.setItem(CURRENT_JOB_KEY, job.id);
    } catch (e) {}

    // Record to history
    setJobHistoryIds((prev) => {
      const updated = prev.includes(job.id) ? prev : [job.id, ...prev];
      try {
        localStorage.setItem(JOB_HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setSelectedJobDetail(null);
    addLifeLog('事业', `入职「${job.title}」`, `进入${job.department}任职，日薪 ${job.dailySalary} ${CURRENCY.symbol}。`);
    showToast(t('toast.hired', { department: job.department, job: job.title }));
  };

  const handleResign = () => {
    if (!currentJob) return;
    setCurrentJobId(null);
    try {
      // 写入空字符串表示待业；若直接删除键，下次打开会被当成新存档而默认入职 'j1'
      localStorage.setItem(CURRENT_JOB_KEY, '');
    } catch (e) {}
    addLifeLog('事业', `辞去「${currentJob.title}」`, `离开${currentJob.department}，暂时待业。`);
    showToast(t('toast.resigned'));
  };


  return (
    <div className="absolute inset-0 bg-[#12141c] flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-200 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-black font-black text-xs px-4 py-2 rounded-xl border-2 border-black shadow-[0_4px_0_#000] animate-in fade-in slide-in-from-top-2 duration-200 text-center max-w-[90%] truncate">
          {toast}
        </div>
      )}

      {/* Top Header */}
      <div className="bg-[#1e2330] border-b-2 border-black p-3 flex items-center justify-between shadow-md flex-shrink-0">
        <button
          onClick={() => {
            if (selectedCompanyDetail) {
              setSelectedCompanyDetail(null);
            } else if (selectedJobDetail) {
              setSelectedJobDetail(null);
            } else {
              onClose();
            }
          }}
          className="bg-[#2a2e3f] hover:bg-[#353a4e] text-white p-1.5 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer active:translate-y-0.5 transition-all flex items-center gap-1 text-xs font-bold"
        >
          <ChevronLeft size={20} />
          {(selectedJobDetail || selectedCompanyDetail) && <span className="hidden sm:inline">{t('back')}</span>}
        </button>

        <div className="flex items-center gap-2 min-w-0 px-2">
          <div className="p-1.5 bg-blue-500/20 border-2 border-blue-500/50 rounded-xl text-blue-400 flex-shrink-0">
            {selectedCompanyDetail ? (
              <Building2 size={18} />
            ) : selectedJobDetail ? (
              getJobIcon(selectedJobDetail.iconName)
            ) : (
              <Briefcase size={18} />
            )}
          </div>
          <span className="text-white font-black text-sm sm:text-base tracking-wider drop-shadow-[0_1px_0_#000] truncate">
            {selectedCompanyDetail
              ? t('companyTitle', { name: selectedCompanyDetail.name })
              : selectedJobDetail
              ? t('jobTitle', { title: selectedJobDetail.title })
              : t('title')}
          </span>
        </div>

        <div className="bg-[#12141c] border-2 border-black px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-[0_2px_0_#000] flex-shrink-0">
          <CurrencyIcon size={14} className="text-amber-400" />
          <span className="text-amber-300 font-mono font-black text-xs">
            {coins.toLocaleString()} {CURRENCY.symbol}
          </span>
        </div>
      </div>

      {/* Primary Sub-Navigation Tabs (Only shown when not in full detail view) */}
      {!selectedJobDetail && !selectedCompanyDetail && (
        <div className="bg-[#181a26] border-b border-black/80 px-3 py-2 flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setActiveTab('hall')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer ${
              activeTab === 'hall'
                ? 'bg-blue-500 text-white font-black'
                : 'bg-[#212433] text-gray-400 hover:text-white'
            }`}
          >
            <Briefcase size={14} />
            <span>{t('hall')}</span>
          </button>
          <button
            onClick={() => setActiveTab('resume')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer ${
              activeTab === 'resume'
                ? 'bg-blue-500 text-white font-black'
                : 'bg-[#212433] text-gray-400 hover:text-white'
            }`}
          >
            <Medal size={14} />
            <span>{t('history')}</span>
          </button>
        </div>
      )}

      {/* Content Body Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-[#181a24]">
        {/* VIEW 1: COMPANY DETAIL SCREEN (招人单位/企业详细界面) */}
        {selectedCompanyDetail ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Navigation Path Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
              <button
                onClick={() => {
                  setSelectedCompanyDetail(null);
                  setSelectedJobDetail(null);
                }}
                className="hover:text-blue-300 underline cursor-pointer"
              >
                {t('hall')}
              </button>
              <span>/</span>
              <span className="text-white font-bold">{selectedCompanyDetail.name}</span>
            </div>

            {/* Company Main Header Card with Metallic Imperial Badge */}
            <div className="bg-gradient-to-b from-[#25293c] to-[#1c1f2d] border-2 border-black rounded-3xl p-5 shadow-[0_6px_0_#000] space-y-4 relative overflow-hidden">
              {/* Background Watermark Seal */}
              <div className="absolute -right-4 -bottom-4 w-32 h-32 rounded-full border-4 border-blue-500/10 bg-blue-500/5 flex flex-col items-center justify-center text-blue-400/20 rotate-[-12deg] pointer-events-none select-none">
                <Building2 size={48} />
                <span className="text-[9px] font-black tracking-widest mt-1">{t('company.registered')}</span>
              </div>

              <div className="flex items-start justify-between gap-3 border-b border-black/60 pb-4 relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border-2 border-blue-500/40 flex items-center justify-center text-blue-400 flex-shrink-0 shadow-[0_4px_12px_rgba(59,130,246,0.2)]">
                    <Building2 size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-white font-black text-lg sm:text-xl tracking-wide">
                        {selectedCompanyDetail.name}
                      </h2>
                      <span className="bg-blue-500/20 text-blue-300 border border-blue-500/50 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <Award size={11} />
                        <span>{selectedCompanyDetail.type}</span>
                      </span>
                    </div>
                    <div className="text-gray-400 text-xs font-mono mt-1 flex items-center gap-1">
                      <Compass size={13} className="text-blue-400 flex-shrink-0" />
                      <span>{t('company.address', { location: selectedCompanyDetail.location })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3-Column Metric Dashboard */}
              <div className="grid grid-cols-3 gap-2 bg-[#131520] p-3 rounded-2xl border-2 border-black font-mono text-center relative z-10 shadow-inner">
                <div className="p-1">
                  <div className="text-[10px] text-gray-400 font-sans font-bold">{t('company.established')}</div>
                  <div className="text-white font-black text-sm sm:text-base mt-0.5">{selectedCompanyDetail.established}</div>
                </div>
                <div className="p-1 border-x border-black/80">
                  <div className="text-[10px] text-gray-400 font-sans font-bold">{t('company.scale')}</div>
                  <div className="text-sky-300 font-black text-sm sm:text-base mt-0.5">{selectedCompanyDetail.scale}</div>
                </div>
                <div className="p-1">
                  <div className="text-[10px] text-gray-400 font-sans font-bold">{t('company.capital')}</div>
                  <div className="text-amber-400 font-black text-sm sm:text-base mt-0.5">{selectedCompanyDetail.registeredCapital}</div>
                </div>
              </div>
            </div>

            {/* Company Background Description */}
            <div className="bg-[#232635] border-2 border-black rounded-2xl p-4 shadow-[0_3px_0_#000] space-y-2.5">
              <div className="text-amber-400 font-black text-xs flex items-center gap-1.5">
                <FileText size={16} />
                <span>{t('company.background')}</span>
              </div>
              <p className="text-gray-200 text-xs sm:text-sm leading-relaxed font-sans bg-[#181a24] p-3.5 rounded-xl border border-black/60 shadow-inner">
                {selectedCompanyDetail.desc}
              </p>
            </div>

            {/* Benefits & Perks Showcase */}
            <div className="bg-[#232635] border-2 border-black rounded-2xl p-4 shadow-[0_3px_0_#000] space-y-2.5">
              <div className="text-emerald-400 font-black text-xs flex items-center gap-1.5">
                <Crown size={16} />
                <span>{t('company.benefits')}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedCompanyDetail.benefits.map((b, i) => (
                  <span
                    key={i}
                    className="bg-emerald-950/40 text-emerald-300 text-xs px-3 py-1.5 rounded-xl border border-emerald-500/50 font-bold flex items-center gap-1.5 shadow-[0_2px_0_#000]"
                  >
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>{b}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Company Job Openings List */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs font-black text-gray-300 px-1">
                <span className="flex items-center gap-1.5">
                  <Briefcase size={16} className="text-blue-400" />
                  <span>{t('company.openings', { name: selectedCompanyDetail.name })}</span>
                </span>
                <span className="text-[11px] font-mono text-blue-300 font-bold bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-500/40">
                  {t('company.openingCount', { count: JOB_POSITIONS.filter((j) => j.department === selectedCompanyDetail.name).length })}
                </span>
              </div>

              <div className="space-y-2.5">
                {JOB_POSITIONS.filter((j) => j.department === selectedCompanyDetail.name).map((job) => {
                  const isCurrent = currentJobId === job.id;
                  return (
                    <div
                      key={job.id}
                      onClick={() => {
                        setSelectedJobDetail(job);
                        setSelectedCompanyDetail(null);
                      }}
                      className="bg-[#232635] border-2 border-black rounded-2xl p-3.5 shadow-[0_3px_0_#000] flex items-center justify-between gap-3 hover:bg-[#282c3e] hover:border-blue-400/80 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#181a24] border border-black flex items-center justify-center text-blue-400 flex-shrink-0 shadow-inner">
                          {getJobIcon(job.iconName)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-black text-sm sm:text-base truncate">{job.title}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${job.badgeColor}`}>
                              {job.badge}
                            </span>
                          </div>
                          <div className="text-gray-400 text-[10px] font-mono mt-0.5">
                            {t('threshold')}<span className="text-blue-300 font-bold">{job.reqSkill}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-amber-400 font-mono font-black text-base">{job.dailySalary} {CURRENCY.symbol}</div>
                          <div className="text-gray-400 text-[9px] font-mono">{t('monthlyFormula')}</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApply(job);
                          }}
                          disabled={isCurrent}
                          className={`px-3 py-1.5 rounded-xl border-2 border-black font-black text-xs cursor-pointer shadow-[0_2px_0_#000] active:translate-y-0.5 ${
                            isCurrent
                              ? 'bg-gray-700 text-gray-400 border-black cursor-default'
                              : 'bg-blue-600 hover:bg-blue-500 text-white'
                          }`}
                        >
                          {isCurrent ? t('working') : t('apply')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : selectedJobDetail ? (
          /* VIEW 2: JOB DETAIL SCREEN (岗位详细界面) */
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
              <button onClick={() => setSelectedJobDetail(null)} className="hover:text-blue-300 underline cursor-pointer">
                {t('hall')}
              </button>
              <span>/</span>
              <span className="text-white font-bold">{t('detail.title', { title: selectedJobDetail.title })}</span>
            </div>

            {/* Job Header Hero Card */}
            <div className="bg-[#232635] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-3 relative overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border-2 border-blue-500/40 flex items-center justify-center text-blue-400 flex-shrink-0 shadow-inner">
                    {getJobIcon(selectedJobDetail.iconName)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-white font-black text-base sm:text-lg">{selectedJobDetail.title}</h2>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${selectedJobDetail.badgeColor}`}>
                        {selectedJobDetail.badge}
                      </span>
                    </div>
                    <div className="text-gray-400 text-xs font-mono mt-0.5">
                      {t('detail.meta', { category: selectedJobDetail.category, skill: selectedJobDetail.reqSkill })}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-amber-400 font-mono font-black text-lg">
                    {selectedJobDetail.dailySalary.toLocaleString()} {CURRENCY.symbol}
                  </div>
                  <div className="text-gray-400 text-[10px] font-mono">{t('detail.dailySalary')}</div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-1 border-t border-black/60 flex items-center justify-between gap-3">
                <span className="text-gray-400 text-xs">{currentJobId === selectedJobDetail.id ? t('detail.statusWorking') : t('detail.statusOpen')}</span>
                <button
                  onClick={() => handleApply(selectedJobDetail)}
                  disabled={currentJobId === selectedJobDetail.id}
                  className={`px-5 py-2 rounded-xl border-2 border-black font-black text-xs shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer transition-all ${
                    currentJobId === selectedJobDetail.id
                      ? 'bg-gray-700 text-gray-400 border-black cursor-default shadow-none'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {currentJobId === selectedJobDetail.id ? t('detail.working') : t('detail.sign')}
                </button>
              </div>
            </div>

            {/* Hiring Employer / Company Card (Clickable to jump to Company Detail!) */}
            <div
              onClick={() => setSelectedCompanyDetail(getCompanyInfo(selectedJobDetail.department))}
              className="bg-[#232635] hover:bg-[#2a2d3e] border-2 border-black rounded-2xl p-4 shadow-[0_3px_0_#000] flex items-center justify-between gap-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Building2 size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-gray-400 text-[10px] font-mono">{t('detail.employer')}</div>
                  <div className="text-white font-black text-sm sm:text-base group-hover:text-blue-300 transition-colors flex items-center gap-1.5">
                    <span>{selectedJobDetail.department}</span>
                    <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/40 px-1.5 py-0.2 rounded font-normal">
                      {t('detail.certified')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-blue-400 font-bold text-xs flex-shrink-0 group-hover:translate-x-1 transition-transform">
                <span>{t('detail.company')}</span>
                <ChevronLeft size={16} className="rotate-180" />
              </div>
            </div>

            {/* Job Description & Responsibilities */}
            <div className="bg-[#232635] border-2 border-black rounded-2xl p-4 shadow-[0_3px_0_#000] space-y-3">
              <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                <FileText size={15} />
                <span>{t('detail.duties')}</span>
              </div>

              <p className="text-gray-200 text-xs leading-relaxed font-sans bg-[#181a24] p-3 rounded-xl border border-black/60">
                {selectedJobDetail.desc}
              </p>

              <div className="space-y-1.5 pt-1">
                <div className="text-gray-400 font-bold text-xs">{t('detail.dutyList')}</div>
                <div className="space-y-1 text-xs text-gray-200">
                  {selectedJobDetail.responsibilities.map((resp, i) => (
                    <div key={i} className="flex items-center gap-2 bg-[#181a24] p-2 rounded-xl border border-black/60">
                      <Check size={14} className="text-emerald-400 flex-shrink-0" />
                      <span>{resp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Official Employment Contract Certification (聘用公证书) */}
            <div className="bg-[#191c28] border-2 border-black rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-[0_3px_0_#000]">
              <div className="absolute right-3 bottom-2 w-20 h-20 rounded-full border-4 border-red-500/30 bg-red-950/20 flex flex-col items-center justify-center text-red-400/50 rotate-[-15deg] pointer-events-none select-none">
                <div className="text-[8px] font-black">{t('detail.stampOffice')}</div>
                <Stamp size={18} className="my-0.5" />
                <div className="text-[8px] font-black">{t('detail.stampApproved')}</div>
              </div>

              <div className="flex items-center gap-2 text-blue-300 font-bold text-xs border-b border-black/60 pb-2">
                <Stamp size={15} />
                <span>{t('detail.memoTitle')}</span>
              </div>

              <div className="text-gray-300 text-xs leading-relaxed space-y-1">
                <div>{t('detail.memo1')}</div>
                <div>{t('detail.memo2')}</div>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 3: MAIN LIST VIEW (JOB HALL / RESUME TABS) */
          <>
            {/* TAB 1: 招募岗位大厅 */}
            {activeTab === 'hall' && (
              <div className="space-y-3">
                {/* 童工（未满 16 岁） */}
                {age < MIN_WORK_AGE && (
                  <div className="bg-[#2a2219] border-2 border-amber-700/70 rounded-2xl p-3 shadow-[0_2px_0_#000] space-y-2">
                    <div className="text-amber-300 font-black text-xs">{t('child.title', { age })}</div>
                    {childLaborAllowed ? (
                      <>
                        <p className="text-amber-100/80 text-[11px] font-bold leading-relaxed">
                          {t('child.desc', { min: MIN_WORK_AGE })}
                        </p>
                        {CHILD_JOBS.map((j) => {
                          const active = childJobId === j.id;
                          return (
                            <div key={j.id} className={`flex items-center justify-between gap-2 p-2 rounded-xl border ${active ? 'bg-amber-900/50 border-amber-400' : 'bg-[#1f1a14] border-black'}`}>
                              <div className="min-w-0">
                                <div className="text-white font-black text-xs">{j.title}</div>
                                <div className="text-gray-400 text-[10px] font-bold truncate">{j.desc}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-amber-300 font-mono font-black text-[11px]">{t('child.salary', { salary: j.salary, symbol: CURRENCY.symbol })}</div>
                                <div className="text-red-400 text-[10px] font-bold">{t('child.health', { cost: j.healthCost })}</div>
                              </div>
                              <button
                                onClick={() => {
                                  setChildJob(active ? null : j.id);
                                  if (!active) addLifeLog('事业', `开始做童工：${j.title}`, j.desc);
                                  showToast(active ? t('child.quit', { job: j.title }) : t('child.started', { job: j.title, salary: j.salary, symbol: CURRENCY.symbol }));
                                }}
                                className={`text-[10px] font-black px-2 py-1 rounded-lg border border-black shrink-0 cursor-pointer ${active ? 'bg-gray-600 text-white' : 'bg-amber-400 text-black'}`}
                              >
                                {active ? t('child.quitButton') : t('child.work')}
                              </button>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <p className="text-amber-100/80 text-[11px] font-bold">{t('child.notNeeded', { min: MIN_WORK_AGE })}</p>
                    )}
                  </div>
                )}
                {/* Compact Current Job Quick Status Bar */}
                {currentJob && (
                  <div className="bg-[#1f2231] border-2 border-black rounded-2xl px-3 py-2 shadow-[0_2px_0_#000] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
                      <span className="text-gray-300 font-bold text-xs truncate">
                        {t('current')}<span className="text-white font-black">{currentJob.title}</span>
                      </span>
                      <span className="text-amber-400 font-mono font-bold text-xs flex-shrink-0">
                        {t('perDay', { salary: currentJob.dailySalary, symbol: CURRENCY.symbol })}
                      </span>
                    </div>

                    <span className="text-[10px] font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/50 px-2 py-1 rounded-lg flex-shrink-0">
                      {age >= MIN_WORK_AGE
                        ? t('monthly', { salary: (currentJob.dailySalary * WORK_DAYS_PER_MONTH).toLocaleString(), symbol: CURRENCY.symbol })
                        : t('notPaid', { min: MIN_WORK_AGE })}
                    </span>
                  </div>
                )}

                {/* Search, Filter & Sort Controls */}
                <div className="bg-[#1f2231] border-2 border-black rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-2.5">
                  {/* Search Bar */}
                  <div className="relative flex items-center">
                    <Search size={15} className="absolute left-3 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t('search')}
                      className="w-full bg-[#131520] text-white text-xs font-bold pl-9 pr-8 py-2 rounded-xl border-2 border-black focus:border-blue-400 focus:outline-none transition-colors"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        className="absolute right-2.5 p-0.5 text-gray-400 hover:text-white cursor-pointer rounded-full hover:bg-white/10"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Category Pills & Sort Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    {/* Sector / Category Filter */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-1 min-w-0">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex-shrink-0 cursor-pointer whitespace-nowrap shadow-[0_2px_0_#000] active:translate-y-0.5 ${
                            selectedCategory === cat
                              ? 'bg-blue-500 text-white border-black font-black'
                              : 'bg-[#131520] text-gray-400 border-black hover:text-white'
                          }`}
                        >
                          {cat === CATEGORY_ALL ? t('all') : cat}
                        </button>
                      ))}
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 justify-end">
                      <SlidersHorizontal size={13} className="text-gray-400" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-[#131520] text-xs font-bold text-gray-200 border border-black rounded-xl px-2.5 py-1 focus:outline-none focus:border-blue-400 cursor-pointer"
                      >
                        <option value="default">{t('sorts.default')}</option>
                        <option value="salary_desc">{t('sorts.salary_desc')}</option>
                        <option value="salary_asc">{t('sorts.salary_asc')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Job Cards List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-black text-gray-400 px-1">
                    <span>{t('listTitle', { count: filteredJobs.length })}</span>
                    <span className="text-[10px] font-mono text-gray-500">{t('listHint')}</span>
                  </div>

                  {filteredJobs.length === 0 ? (
                    <div className="bg-[#232635] border-2 border-black rounded-2xl p-8 text-center text-gray-400 text-xs font-bold space-y-2">
                      <Search size={24} className="mx-auto text-gray-500" />
                      <div>{t('noMatch', { search })}</div>
                      <button
                        onClick={() => {
                          setSearch('');
                          setSelectedCategory(CATEGORY_ALL);
                        }}
                        className="text-blue-400 text-xs font-bold underline cursor-pointer"
                      >
                        {t('resetSearch')}
                      </button>
                    </div>
                  ) : (
                    filteredJobs.map((job) => {
                      const isCurrent = currentJobId === job.id;

                      return (
                        <div
                          key={job.id}
                          onClick={() => setSelectedJobDetail(job)}
                          className={`bg-[#232635] border-2 border-black rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-2 transition-all cursor-pointer hover:bg-[#282c3e] ${
                            isCurrent ? 'ring-2 ring-amber-400 border-amber-400/80' : 'hover:border-blue-400/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Dynamic Job Icon Container */}
                              <div className="w-9 h-9 rounded-xl bg-[#181a24] border border-black flex items-center justify-center text-blue-400 flex-shrink-0 shadow-inner">
                                {getJobIcon(job.iconName)}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-white font-black text-sm truncate">{job.title}</span>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${job.badgeColor}`}>
                                    {job.badge}
                                  </span>
                                  {isCurrent && (
                                    <span className="bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.2 rounded border border-black flex items-center gap-0.5">
                                      <CheckCircle2 size={10} />
                                      <span>{t('working')}</span>
                                    </span>
                                  )}
                                </div>
                                <div className="text-gray-400 text-[10px] font-mono mt-0.5 flex items-center gap-1 truncate">
                                  {/* Clickable Employer Name */}
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCompanyDetail(getCompanyInfo(job.department));
                                    }}
                                    className="text-blue-300 hover:text-blue-200 underline cursor-pointer font-bold"
                                  >
                                    {job.department}
                                  </span>
                                  <span>·</span>
                                  <span>{job.category}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <div className="text-amber-400 font-mono font-black text-sm sm:text-base">
                                {job.dailySalary.toLocaleString()} {CURRENCY.symbol}
                              </div>
                              <div className="text-gray-400 text-[9px] font-mono">{t('monthlyFormula')}</div>
                            </div>
                          </div>

                          {/* Bottom Quick Specs & Action Bar */}
                          <div className="flex items-center justify-between border-t border-black/40 pt-2 text-xs gap-2">
                            <span className="text-gray-400 text-[10px] font-mono truncate">
                              {t('threshold')}<span className="text-blue-300 font-bold">{job.reqSkill}</span>
                            </span>

                            <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setSelectedJobDetail(job)}
                                className="bg-[#181a24] hover:bg-[#2b2f42] text-gray-200 text-xs font-bold px-2 py-1 rounded-xl border border-black shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer flex items-center gap-1"
                              >
                                <FileCheck size={12} />
                                <span>{t('jobDetail')}</span>
                              </button>

                              <button
                                onClick={() => handleApply(job)}
                                disabled={isCurrent}
                                className={`px-3 py-1 rounded-xl border-2 border-black font-black text-xs shadow-[0_2px_0_#000] cursor-pointer active:translate-y-0.5 transition-all ${
                                  isCurrent
                                    ? 'bg-gray-700 text-gray-400 border-black cursor-default shadow-none'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                                }`}
                              >
                                {isCurrent ? t('working') : t('apply')}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: 我的职场 (履职记录列表 - 只保留干过的岗位) */}
            {activeTab === 'resume' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                {/* Header Summary Banner */}
                <div className="bg-[#232635] border-2 border-black rounded-2xl p-4 shadow-[0_3px_0_#000] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 flex-shrink-0">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h3 className="text-white font-black text-base">{t('historyTitle')}</h3>
                      <p className="text-gray-400 text-xs font-mono">{t('historyCount', { count: historyJobs.length })}</p>
                    </div>
                  </div>

                  {currentJob ? (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                      <UserCheck size={14} />
                      <span>{t('onDuty', { job: currentJob.title })}</span>
                    </span>
                  ) : (
                    <span className="bg-gray-700 text-gray-300 text-xs font-bold px-3 py-1 rounded-full">
                      {t('unemployed')}
                    </span>
                  )}
                </div>

                {/* History List of Worked Jobs */}
                <div className="space-y-2.5">
                  {historyJobs.length > 0 ? (
                    historyJobs.map((job) => {
                      const isCurrent = currentJobId === job.id;
                      return (
                        <div
                          key={job.id}
                          className={`border-2 border-black rounded-2xl p-4 shadow-[0_3px_0_#000] space-y-3 transition-all ${
                            isCurrent
                              ? 'bg-gradient-to-r from-[#21273a] to-[#262c42] border-blue-500/70'
                              : 'bg-[#232635]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 border-b border-black/50 pb-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-11 h-11 rounded-xl border-2 border-black flex items-center justify-center flex-shrink-0 shadow-inner ${
                                isCurrent ? 'bg-blue-500/20 text-blue-300' : 'bg-[#181a24] text-gray-400'
                              }`}>
                                {getJobIcon(job.iconName)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-white font-black text-base truncate">{job.title}</h4>
                                  {isCurrent ? (
                                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <UserCheck size={11} />
                                      <span>{t('currentTag')}</span>
                                    </span>
                                  ) : (
                                    <span className="bg-gray-700/60 text-gray-400 border border-gray-600/50 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                      {t('formerTag')}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => setSelectedCompanyDetail(getCompanyInfo(job.department))}
                                  className="text-blue-400 hover:text-blue-300 text-xs font-mono mt-0.5 hover:underline text-left block truncate"
                                >
                                  {t('department', { department: job.department })}
                                </button>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <div className="text-amber-400 font-mono font-black text-base">{job.dailySalary} {CURRENCY.symbol}</div>
                              <div className="text-gray-400 text-[9px] font-mono">{t('dailySalary')}</div>
                            </div>
                          </div>

                          {/* Controls Footer */}
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <div className="text-xs text-gray-400 font-mono">
                              {t('skill')}<span className="text-gray-200">{job.reqSkill}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedJobDetail(job)}
                                className="bg-[#181a24] hover:bg-[#1f2230] text-gray-200 border border-black/80 px-3 py-1.5 rounded-xl font-bold text-xs shadow-[0_2px_0_#000] cursor-pointer"
                              >
                                {t('detailButton')}
                              </button>
                              {isCurrent ? (
                                <button
                                  onClick={handleResign}
                                  className="bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/50 px-3 py-1.5 rounded-xl font-bold text-xs shadow-[0_2px_0_#000] cursor-pointer flex items-center gap-1"
                                >
                                  <LogOut size={13} />
                                  <span>{t('resign')}</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleApply(job)}
                                  className="bg-blue-600 hover:bg-blue-500 text-white border border-black px-3 py-1.5 rounded-xl font-black text-xs shadow-[0_2px_0_#000] cursor-pointer"
                                >
                                  {t('rejoin')}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-[#232635] border-2 border-black rounded-2xl p-8 text-center text-gray-400 space-y-2">
                      <Briefcase size={32} className="mx-auto text-gray-500" />
                      <div className="text-white font-bold text-sm">{t('noHistory')}</div>
                      <p className="text-xs text-gray-400 font-mono">
                        {t('noHistoryHint')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
