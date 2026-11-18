import { addLifeLog } from '../lib/lifeLog';
import React, { useState } from 'react';
import type { DiseaseInfo } from '../lib/disease';
import { MAINTENANCE_COST, MAINTENANCE_CHANCE } from '../lib/traits';
import { VACCINE_SUCCESS, RECOVERY_IMMUNITY, ANTIBODY_INHERIT } from '../lib/disease';
import {
  ChevronLeft,
  Hospital,
  Heart,
  Pill,
  Stethoscope,
  Zap,
  CheckCircle2,
  RussianRuble,
  History,
  Building2,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';

export interface HospitalModalProps {
  onClose: () => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  health: number;
  setHealth: React.Dispatch<React.SetStateAction<number>>;
  /** 未满 18 岁：医疗费用由父母承担（免费） */
  parentsPay?: boolean;
  /** 当前所患疾病 */
  disease?: DiseaseInfo | null;
  onCureDisease?: () => void;
  /** 保养（第 50 题）：返回提示文字 */
  onMaintenance?: (target: 'self' | 'spouse') => string;
  hasSpouse?: boolean;
  /** 生育年龄说明 */
  fertilityText?: string;
  /** 已问世的疫苗（第 53 题） */
  vaccines?: Array<{ id: string; name: string; cost: number; owned: boolean }>;
  antibodyText?: string;
  onVaccinate?: (diseaseId: string, target: 'self' | 'children') => string;
}

export interface HospitalInfo {
  id: string;
  name: string;
  type: string;
  tagline: string;
  badge: string;
  discount: number; // multiplier e.g. 0.8 for 20% discount
  bonusRecover: number; // bonus recovery points
  treatments: Array<{
    id: string;
    title: string;
    desc: string;
    baseCost: number;
    baseRecover: number;
    tag: string;
  }>;
}

const HOSPITALS: HospitalInfo[] = [
  {
    id: 'h1',
    name: '布津市立综合医院',
    type: '市立公立医院',
    tagline: '设备平实，全科门诊，适合市民日常体检与基础护理。',
    badge: '平民全科',
    discount: 1.0,
    bonusRecover: 0,
    treatments: [
      { id: 't1', title: '市立全科常规门诊', desc: '全科医师常规测量体征，开具基础调理处方。', baseCost: 400, baseRecover: 15, tag: '常规体检' },
      { id: 't2', title: '全能复苏营养吊针', desc: '输注高渗糖与电解质水溶液，舒缓全身疲劳。', baseCost: 1500, baseRecover: 30, tag: '输液理疗' },
      { id: 't3', title: '综合住院调养全套餐', desc: '标准单人病房留观调养，恢复身体基本机能。', baseCost: 6000, baseRecover: 80, tag: '住院调理' },
    ],
  },
  {
    id: 'h2',
    name: '布津第一传染病专科医院',
    type: '专科隔离医院',
    tagline: '拥有强力无菌隔离病房与特效抗体血清，免疫排毒首选。',
    badge: '免疫特效',
    discount: 0.9,
    bonusRecover: 5,
    treatments: [
      { id: 't1', title: '广谱抗体免疫血清针', desc: '注射多价免疫球蛋白，极大提升体质抵抗力。', baseCost: 1800, baseRecover: 40, tag: '特效抗体' },
      { id: 't2', title: '高压无菌氧舱净化', desc: '在高压纯氧环境中加速毒素代谢与受损细胞修复。', baseCost: 4500, baseRecover: 65, tag: '深层排毒' },
      { id: 't3', title: '全套生物免疫强化疗法', desc: '全面重塑免疫防线，排除潜在潜伏病灶。', baseCost: 12000, baseRecover: 95, tag: '免疫重塑' },
    ],
  },
  {
    id: 'h3',
    name: '布津第二烧伤医院',
    type: '创伤修复专科',
    tagline: '专攻皮肤再生、创伤快速愈合与高阶表皮细胞重构。',
    badge: '创伤速愈',
    discount: 0.95,
    bonusRecover: 10,
    treatments: [
      { id: 't1', title: '创面镇痛软膏涂抹', desc: '使用植物提取镇痛凉膏，迅速缓解烫伤与创伤苦楚。', baseCost: 600, baseRecover: 20, tag: '创伤镇痛' },
      { id: 't2', title: '生物胶原蛋白表皮敷贴', desc: '贴敷高活性胶原蛋白膜，促使肌肉组织加速再生。', baseCost: 2800, baseRecover: 50, tag: '组织再生' },
      { id: 't3', title: '干细胞皮肤重构全手术', desc: '顶级创伤修复手术，彻底焕发全身表皮与组织活力。', baseCost: 10000, baseRecover: 100, tag: '表皮焕新' },
    ],
  },
  {
    id: 'h4',
    name: '布津卡罗尼亚医院',
    type: '贵族私立医院',
    tagline: '典雅奢华的环境与帝国名医会诊，提供尊贵高品质医疗。',
    badge: '贵族尊享',
    discount: 1.3,
    bonusRecover: 15,
    treatments: [
      { id: 't1', title: '卡罗尼亚贵族私人体检', desc: '名医一对一 VIP 诊室，享受精致茶点与全套筛查。', baseCost: 1200, baseRecover: 25, tag: '尊贵私诊' },
      { id: 't2', title: '皇家级提神养心理疗', desc: '使用稀有草本精油与高能恢复试剂联合调养。', baseCost: 5000, baseRecover: 60, tag: '高级理疗' },
      { id: 't3', title: '卡罗尼亚名医联合大诊疗', desc: '由多位医学博士亲自操刀全套复苏方案，达至巅峰体魄。', baseCost: 18000, baseRecover: 100, tag: '巅峰满血' },
    ],
  },
  {
    id: 'h5',
    name: '伊巴什省立医院',
    type: '省级公立综合',
    tagline: '伊巴什省最高级别公立医院，医疗资源丰富且价格公道。',
    badge: '省立惠民',
    discount: 0.85,
    bonusRecover: 5,
    treatments: [
      { id: 't1', title: '省立门诊专家号', desc: '省知名专家接诊，制定科学合理的体质调理建议。', baseCost: 450, baseRecover: 18, tag: '专家门诊' },
      { id: 't2', title: '省立中草药复方熏蒸', desc: '传统名贵中草药蒸气熏蒸，疏通经络气血。', baseCost: 1800, baseRecover: 40, tag: '草本熏蒸' },
      { id: 't3', title: '省立重点学科全套复康', desc: '运用省立医学中心核心科技，全面巩固体能。', baseCost: 7500, baseRecover: 88, tag: '重点复康' },
    ],
  },
  {
    id: 'h6',
    name: '布津启明教会医院',
    type: '教会慈善医院',
    tagline: '信仰与医疗并行，接受圣水洗礼与修女温柔看护，诊费极为低廉。',
    badge: '慈善救济',
    discount: 0.6,
    bonusRecover: 0,
    treatments: [
      { id: 't1', title: '圣水洗礼与祈祷理疗', desc: '修女为您诵经祈福，并饮用经过祝圣的纯净圣水。', baseCost: 150, baseRecover: 15, tag: '圣水祈福' },
      { id: 't2', title: '教会修道院草药敷贴', desc: '采摘自圣山修道院的救济草药，温和驱散疾患。', baseCost: 800, baseRecover: 35, tag: '修道草药' },
      { id: 't3', title: '启明主教全能圣光复苏', desc: '主教亲临主持圣光祷告，神圣安抚身心与机能。', baseCost: 3500, baseRecover: 75, tag: '圣光复苏' },
    ],
  },
  {
    id: 'h7',
    name: '亚历山大三世皇帝陛下总医院',
    type: '皇家直属顶尖',
    tagline: '帝国最高医学殿堂，享有皇帝陛下御赐顶级医疗科技与国宝级药剂。',
    badge: '皇帝御赐',
    discount: 1.5,
    bonusRecover: 20,
    treatments: [
      { id: 't1', title: '皇帝御赐高能干细胞针', desc: '注入沙皇御用活化干细胞，瞬时激活全身体细胞。', baseCost: 3000, baseRecover: 45, tag: '御用干细胞' },
      { id: 't2', title: '皇家宫廷绝密长寿疗法', desc: '宫廷秘传绝密提振配方，彻底扫除累积沉疴。', baseCost: 12000, baseRecover: 80, tag: '宫廷秘方' },
      { id: 't3', title: '亚历山大皇帝神级再生理疗', desc: '启动帝国最顶尖国家医疗阵列，直接焕发全新青春。', baseCost: 30000, baseRecover: 100, tag: '神级满血' },
    ],
  },
  {
    id: 'h8',
    name: '布津俄国驻军与总督府直属医院',
    type: '军规总督直属',
    tagline: '军规级强效止痛、战术止血与军用高能兴奋剂，见效极快。',
    badge: '军规强效',
    discount: 1.1,
    bonusRecover: 12,
    treatments: [
      { id: 't1', title: '军用战术强效止痛针', desc: '打入俄军前线战术止痛剂，瞬间压制一切剧烈不适。', baseCost: 800, baseRecover: 25, tag: '战术止痛' },
      { id: 't2', title: '驻军高能合成肾上腺素', desc: '强力泵入高纯度肾上腺素，让心脏与肌肉爆发活力。', baseCost: 3200, baseRecover: 55, tag: '军用兴奋' },
      { id: 't3', title: '总督府特供军功全复原', desc: '享受沙皇驻军将军级别的全套军规医疗救治。', baseCost: 15000, baseRecover: 100, tag: '军规满血' },
    ],
  },
  {
    id: 'h9',
    name: '阿米诺斯圣潘捷莱蒙主保医院',
    type: '主保修道圣疗',
    tagline: '供奉医神圣潘捷莱蒙，传颂千年的古法主保疗愈与圣品冲剂。',
    badge: '圣者主保',
    discount: 0.8,
    bonusRecover: 8,
    treatments: [
      { id: 't1', title: '圣潘捷莱蒙圣油涂抹', desc: '涂抹经过主保圣人加持的橄榄圣油，平复经络痛楚。', baseCost: 350, baseRecover: 18, tag: '圣油涂抹' },
      { id: 't2', title: '阿米诺斯主保古法秘方浸泡', desc: '全身浸泡于千年中草药与圣泉汤池中，深层滋养。', baseCost: 2200, baseRecover: 45, tag: '古法圣泉' },
      { id: 't3', title: '主保大圣人全能医治大典', desc: '举行隆重主保医治仪式，祈得身心完满康愈。', baseCost: 8500, baseRecover: 90, tag: '圣人大愈' },
    ],
  },
];

interface MedicalLog {
  id: string;
  hospitalName: string;
  title: string;
  cost: number;
  healthAdded: number;
  time: string;
}

export const HospitalModal: React.FC<HospitalModalProps> = ({
  onClose,
  coins,
  setCoins,
  health,
  setHealth,
  parentsPay = false,
  disease = null,
  onCureDisease,
  onMaintenance,
  hasSpouse = false,
  fertilityText = '',
  vaccines = [],
  antibodyText = '暂无',
  onVaccinate,
}) => {
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('h1');
  const [isSelectingHospital, setIsSelectingHospital] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'treatments' | 'pharmacy' | 'history'>('treatments');
  const [toast, setToast] = useState<string | null>(null);

  const [logs, setLogs] = useState<MedicalLog[]>(() => {
    try {
      const saved = localStorage.getItem('amigo_hospital_logs');
      return saved ? JSON.parse(saved) : [
        { id: '1', hospitalName: '布津市立综合医院', title: '常规健康门诊检查', cost: 0, healthAdded: 0, time: '今日 09:00' }
      ];
    } catch (e) {
      return [];
    }
  });

  const currentHospital = HOSPITALS.find((h) => h.id === selectedHospitalId) || HOSPITALS[0];
  // 未满 18 岁由父母承担医疗费
  const costOf = (baseCost: number) => (parentsPay ? 0 : Math.round(baseCost * currentHospital.discount));

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleTreatment = (title: string, baseCost: number, baseRecover: number) => {
    const finalCost = costOf(baseCost);
    const finalRecover = Math.min(100, baseRecover + currentHospital.bonusRecover);

    if (coins < finalCost) {
      showToast(`❌ 金钱不足！需要 ${finalCost.toLocaleString()} ₽，拥有 ${coins.toLocaleString()} ₽`);
      return;
    }
    if (health >= 100 && finalRecover > 0) {
      showToast('💖 你的健康度已达 100% 满值，无需额外治疗！');
      return;
    }

    setCoins((prev) => prev - finalCost);
    setHealth((prev) => Math.min(100, prev + finalRecover));

    const newLog: MedicalLog = {
      id: Date.now().toString(),
      hospitalName: currentHospital.name,
      title,
      cost: finalCost,
      healthAdded: finalRecover,
      time: '刚才',
    };
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    try {
      localStorage.setItem('amigo_hospital_logs', JSON.stringify(updatedLogs));
    } catch (e) {}

    // 只记录从危急状态（健康 < 30）恢复的就诊
    if (health < 30) addLifeLog('健康', '转危为安', `在${currentHospital.name}接受「${title}」，健康 ${health} → ${Math.min(100, health + finalRecover)}。`);
    showToast(`🩺 在【${currentHospital.name}】成功进行【${title}】！健康度 +${finalRecover}%，${parentsPay ? '费用由父母承担' : `花费 ${finalCost.toLocaleString()} ₽`}`);
  };

  const getHealthStatus = (h: number) => {
    if (h >= 90) return { text: '体魄强健 · 状态极佳', color: 'text-emerald-400' };
    if (h >= 70) return { text: '精力充沛 · 稍需养护', color: 'text-sky-400' };
    if (h >= 40) return { text: '身体抱恙 · 亚健康', color: 'text-amber-400' };
    return { text: '重度疲劳 · 紧急治疗', color: 'text-rose-400' };
  };

  const status = getHealthStatus(health);

  const PHARMACY = [
    { id: 'p1', title: '复合维生素金丸', desc: '日常补充微量元素，调理免疫。', baseCost: 300, baseRecover: 8, icon: Pill },
    { id: 'p2', title: '深海鱼油凝胶', desc: '保护心脑血管，养护神经。', baseCost: 1200, baseRecover: 18, icon: Pill },
    { id: 'p3', title: '皇家鹿茸强体冲剂', desc: '帝国王室御用滋补秘方，补气养血。', baseCost: 3500, baseRecover: 35, icon: Pill },
    { id: 'p4', title: '极地晶石提神口服液', desc: '提取高纯度晶石精华，强效提神醒脑。', baseCost: 10000, baseRecover: 60, icon: Zap },
  ];

  return (
    <div className="absolute inset-0 bg-[#161822] flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-200 overflow-hidden font-sans text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-black/95 text-rose-300 border-2 border-rose-500 text-xs font-black px-4 py-2 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-2 duration-200 text-center max-w-[85%]">
          {toast}
        </div>
      )}

      {/* Clean Header Bar */}
      <div className="relative w-full h-16 bg-[#1f2230] border-b-2 border-black shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20 flex items-center justify-between px-3 flex-shrink-0">
        <button
          onClick={isSelectingHospital ? () => setIsSelectingHospital(false) : onClose}
          className="p-2 bg-[#2d3042] hover:bg-[#393d54] border-2 border-black rounded-xl active:translate-y-0.5 shadow-[0_2px_0_#000] cursor-pointer text-white flex items-center justify-center transition-all z-10"
        >
          <ChevronLeft size={20} className="text-white" strokeWidth={3} />
        </button>

        <div className="flex-1 flex items-center justify-center pointer-events-none px-2">
          <div className="bg-[#2a2d3e] border-2 border-rose-500/80 px-5 py-1.5 rounded-xl shadow-[0_3px_0_#000] flex items-center gap-2">
            <Heart size={18} className="text-rose-400 fill-rose-500/30 flex-shrink-0" />
            <span className="text-rose-300 text-sm font-black tracking-widest">
              {isSelectingHospital ? '选择诊治医院' : '健康'}
            </span>
          </div>
        </div>

        <div className="flex items-center bg-[#151722] rounded-full px-2.5 py-1 border border-black text-xs font-mono font-black z-10">
          <RussianRuble size={14} className="text-yellow-400 mr-1" />
          <span>{coins.toLocaleString()} ₽</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {parentsPay && (
          <div className="bg-emerald-950/80 border-2 border-emerald-500/60 text-emerald-200 text-xs font-black px-3 py-2 rounded-xl shadow-[0_2px_0_#000]">
            👪 未满 18 岁：所有诊疗与药品费用由父母承担
          </div>
        )}
        {disease && (
          <div className="bg-red-950/80 border-2 border-red-500/70 rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-red-200 font-black text-sm">🤒 当前疾病：{disease.name}</div>
                <div className="text-red-300/80 text-[11px] font-bold">
                  每月健康 -{disease.monthlyDamage}，{disease.selfHealMonths === null ? '不会自愈，必须就医' : `约 ${disease.selfHealMonths} 个月可自愈`}
                </div>
              </div>
              <button
                onClick={() => {
                  const cost = costOf(disease.cost);
                  if (coins < cost) {
                    showToast(`❌ 金钱不足！治疗${disease.name}需要 ${cost.toLocaleString()} ₽`);
                    return;
                  }
                  setCoins((prev) => prev - cost);
                  onCureDisease?.();
                  addLifeLog('健康', `治愈${disease.name}`, `在${currentHospital.name}就医痊愈。`);
                  showToast(`🩺 在【${currentHospital.name}】治愈了${disease.name}！${parentsPay ? '费用由父母承担' : `花费 ${cost.toLocaleString()} ₽`}`);
                }}
                className="bg-red-400 hover:bg-red-300 text-black text-xs font-black px-3 py-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer shrink-0"
              >
                治疗 {costOf(disease.cost).toLocaleString()} ₽
              </button>
            </div>
          </div>
        )}
        {onVaccinate && (
          <div className="bg-sky-950/70 border-2 border-sky-500/60 rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-2">
            <div className="text-sky-200 font-black text-sm">💉 疫苗接种</div>
            <p className="text-sky-200/80 text-[11px] font-bold leading-relaxed">
              接种成功率 {Math.round(VACCINE_SUCCESS * 100)}%，获得抗体后不会再患这种病；传染病痊愈后也有 {Math.round(RECOVERY_IMMUNITY * 100)}% 概率获得抗体。抗体会按 {Math.round(ANTIBODY_INHERIT * 100)}% 的概率遗传给孩子。你的抗体：{antibodyText}
            </p>
            {vaccines.length === 0 ? (
              <p className="text-sky-200/70 text-[11px] font-bold">这个年代还没有疫苗问世。</p>
            ) : (
              <div className="space-y-1.5">
                {vaccines.map((v) => (
                  <div key={v.id} className="flex items-center gap-2 bg-black/20 rounded-xl px-2 py-1.5">
                    <span className="text-white text-xs font-black flex-1">
                      {v.name}疫苗 <span className="text-sky-300/80 font-bold">{v.cost.toLocaleString()} ₽ / 人</span>
                    </span>
                    <button
                      onClick={() => showToast(onVaccinate(v.id, 'self'))}
                      disabled={v.owned}
                      className="bg-sky-400 hover:bg-sky-300 text-black text-[10px] font-black px-2 py-1 rounded-lg border-2 border-black cursor-pointer disabled:opacity-40"
                    >
                      {v.owned ? '已有抗体' : '自己接种'}
                    </button>
                    <button
                      onClick={() => showToast(onVaccinate(v.id, 'children'))}
                      className="bg-sky-400 hover:bg-sky-300 text-black text-[10px] font-black px-2 py-1 rounded-lg border-2 border-black cursor-pointer"
                    >
                      孩子们接种
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {onMaintenance && (
          <div className="bg-violet-950/70 border-2 border-violet-500/60 rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-2">
            <div className="text-violet-200 font-black text-sm">💆 保养调理（{MAINTENANCE_COST.toLocaleString()} ₽ / 次）</div>
            <p className="text-violet-200/80 text-[11px] font-bold leading-relaxed">
              每次有 {Math.round(MAINTENANCE_CHANCE * 100)}% 的概率获得「精力旺盛」或「富养」，生育年龄上限延长到女 50 岁、男 65 岁。{fertilityText}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => showToast(onMaintenance('self'))}
                className="bg-violet-400 hover:bg-violet-300 text-black text-xs font-black py-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer"
              >
                为自己保养
              </button>
              <button
                onClick={() => showToast(onMaintenance('spouse'))}
                disabled={!hasSpouse}
                className="bg-violet-400 hover:bg-violet-300 text-black text-xs font-black py-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer disabled:opacity-40"
              >
                为配偶保养
              </button>
            </div>
          </div>
        )}
        {/* Health Dashboard Card */}
        <div className="bg-[#232635] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-rose-500/20 rounded-xl border border-rose-500/50">
                <Heart size={22} className="text-rose-400 fill-rose-500/40" />
              </div>
              <div>
                <h3 className="text-white font-black text-sm">当前健康指数</h3>
                <span className={`text-[10px] font-bold ${status.color}`}>{status.text}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono text-rose-400">{health}</span>
              <span className="text-xs text-gray-400 font-bold ml-0.5">%</span>
            </div>
          </div>

          {/* Health Bar */}
          <div className="w-full h-4 bg-[#151722] rounded-full border-2 border-black overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400"
              style={{ width: `${Math.min(100, Math.max(0, health))}%` }}
            />
          </div>
        </div>

        {/* MODE A: HOSPITAL SELECTION UNIFIED DARK RETRO STYLE */}
        {isSelectingHospital ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="text-xs font-black text-gray-300 flex items-center gap-1.5">
                <Building2 size={15} className="text-rose-400" />
                <span>各大诊治医院与专科机构 (共 {HOSPITALS.length} 所)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {HOSPITALS.map((hosp) => {
                const isSelected = hosp.id === selectedHospitalId;

                return (
                  <div
                    key={hosp.id}
                    onClick={() => {
                      setSelectedHospitalId(hosp.id);
                      setIsSelectingHospital(false);
                      showToast(`🏥 已切换就诊医院至【${hosp.name}】`);
                    }}
                    className={`bg-[#232635] border-2 rounded-2xl p-3.5 shadow-[0_4px_0_#000] cursor-pointer transition-all hover:bg-[#2a2d3e] active:translate-y-0.5 relative overflow-hidden ${
                      isSelected
                        ? 'border-rose-500 bg-[#2b2736]'
                        : 'border-black'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Unified dark retro icon badge */}
                        <div
                          className={`p-2.5 rounded-xl border-2 flex-shrink-0 flex items-center justify-center ${
                            isSelected
                              ? 'bg-rose-500 text-white border-black shadow-[0_2px_0_#000]'
                              : 'bg-[#181a24] text-rose-400 border-rose-500/30'
                          }`}
                        >
                          <Hospital size={20} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-black text-sm">{hosp.name}</h3>
                            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-black px-1.5 py-0.2 rounded">
                              {hosp.badge}
                            </span>
                            <span className="bg-[#181a24] text-gray-400 border border-black text-[9px] font-bold px-1.5 py-0.2 rounded">
                              {hosp.type}
                            </span>
                          </div>
                          <p className="text-gray-400 text-[11px] font-bold mt-1 leading-relaxed">
                            {hosp.tagline}
                          </p>
                        </div>
                      </div>

                      <div className="flex-shrink-0 pt-0.5">
                        {isSelected ? (
                          <span className="bg-emerald-500 text-black font-black text-[10px] px-2.5 py-1 rounded-xl border-2 border-black shadow-[0_2px_0_#000] flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            就诊中
                          </span>
                        ) : (
                          <button className="bg-rose-500 hover:bg-rose-400 text-white font-black text-xs px-3 py-1.5 rounded-xl border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 flex items-center gap-1 transition-all">
                            <span>前往</span>
                            <ChevronRight size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-gray-700/60 flex items-center justify-between text-[10px] font-mono font-bold text-gray-400">
                      <span>诊费折扣: {(hosp.discount * 100).toFixed(0)}%</span>
                      {hosp.bonusRecover > 0 ? (
                        <span className="text-emerald-400">疗效加成: +{hosp.bonusRecover}% 健康</span>
                      ) : (
                        <span>常规诊疗</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* MODE B: SELECTED HOSPITAL SERVICES VIEW */
          <div className="space-y-4">
            {/* Selected Hospital Info Header Banner */}
            <div className="bg-[#232635] border-2 border-rose-500/80 rounded-2xl p-3.5 shadow-[0_4px_0_#000] flex justify-between items-center gap-3 relative">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2.5 bg-rose-500 text-white rounded-xl border-2 border-black shadow-[0_2px_0_#000] flex-shrink-0">
                  <Hospital size={22} />
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-300 font-bold block">当前就诊医院</span>
                    <span className="bg-rose-500/30 text-rose-200 border border-rose-400/40 text-[9px] font-black px-1.5 rounded">
                      {currentHospital.badge}
                    </span>
                  </div>
                  <h2 className="text-white font-black text-sm sm:text-base truncate mt-0.5">
                    {currentHospital.name}
                  </h2>
                  <p className="text-gray-400 text-[10px] font-bold truncate mt-0.5">
                    {currentHospital.tagline}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSelectingHospital(true)}
                className="bg-rose-500 hover:bg-rose-400 text-white text-xs font-black px-3 py-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer flex-shrink-0 flex items-center gap-1 transition-all"
              >
                <RefreshCw size={12} />
                <span>更换医院</span>
              </button>
            </div>

            {/* Sub Nav Tabs */}
            <div className="grid grid-cols-3 bg-[#1c1f2b] p-1.5 rounded-xl border-2 border-black gap-1 shadow-[0_2px_0_#000]">
              <button
                onClick={() => setActiveTab('treatments')}
                className={`py-2 text-xs font-black rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'treatments'
                    ? 'bg-rose-500 text-white border-black shadow-[0_2px_0_#000]'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                <Stethoscope size={14} />
                <span>诊疗项目</span>
              </button>
              <button
                onClick={() => setActiveTab('pharmacy')}
                className={`py-2 text-xs font-black rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'pharmacy'
                    ? 'bg-rose-500 text-white border-black shadow-[0_2px_0_#000]'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                <Pill size={14} />
                <span>处方药房</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 text-xs font-black rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-rose-500 text-white border-black shadow-[0_2px_0_#000]'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                <History size={14} />
                <span>就诊记录</span>
              </button>
            </div>

            {/* TAB 1: Treatments for current hospital */}
            {activeTab === 'treatments' && (
              <div className="space-y-3">
                {currentHospital.treatments.map((item) => {
                  const finalCost = costOf(item.baseCost);
                  const finalRecover = Math.min(100, item.baseRecover + currentHospital.bonusRecover);

                  return (
                    <div
                      key={item.id}
                      className="bg-[#232635] border-2 border-black rounded-2xl p-3.5 shadow-[0_4px_0_#000] flex flex-col gap-2 relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-rose-500/20 border border-rose-500/50 rounded-xl text-rose-400">
                            <Stethoscope size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-white font-black text-sm">{item.title}</span>
                              <span className="bg-rose-500/30 text-rose-300 text-[9px] font-black px-1.5 py-0.2 rounded border border-rose-500/50">
                                {item.tag}
                              </span>
                            </div>
                            <p className="text-gray-400 text-[11px] font-bold mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-700/80">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 text-xs font-black font-mono">
                            健康度 +{finalRecover}%
                          </span>
                          <span className="text-gray-500 text-[10px]">|</span>
                          <span className="text-yellow-400 font-mono font-black text-xs">
                            {finalCost.toLocaleString()} ₽
                          </span>
                        </div>

                        <button
                          onClick={() => handleTreatment(item.title, item.baseCost, item.baseRecover)}
                          className="bg-rose-500 hover:bg-rose-400 active:translate-y-0.5 text-white text-xs font-black px-3.5 py-1.5 rounded-xl border-2 border-black shadow-[0_2px_0_#000] cursor-pointer transition-all"
                        >
                          接受诊疗
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: Pharmacy for current hospital */}
            {activeTab === 'pharmacy' && (
              <div className="space-y-3">
                {PHARMACY.map((item) => {
                  const finalCost = costOf(item.baseCost);
                  const finalRecover = Math.min(100, item.baseRecover + currentHospital.bonusRecover);

                  return (
                    <div
                      key={item.id}
                      className="bg-[#232635] border-2 border-black rounded-2xl p-3.5 shadow-[0_4px_0_#000] flex justify-between items-center gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-amber-500/20 border border-amber-500/50 rounded-xl text-amber-400 flex-shrink-0">
                          <item.icon size={20} />
                        </div>
                        <div>
                          <h4 className="text-white font-black text-xs sm:text-sm">{item.title}</h4>
                          <p className="text-gray-400 text-[10px] font-bold mt-0.5">{item.desc}</p>
                          <div className="text-emerald-400 font-mono font-black text-[11px] mt-1">
                            效果：健康度 +{finalRecover}%
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleTreatment(`处方药品: ${item.title}`, item.baseCost, item.baseRecover)
                        }
                        className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-black px-3 py-1.5 rounded-xl border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer flex-shrink-0 whitespace-nowrap"
                      >
                        {finalCost.toLocaleString()} ₽
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: History Logs */}
            {activeTab === 'history' && (
              <div className="bg-[#232635] border-2 border-black rounded-2xl p-3.5 shadow-[0_4px_0_#000] space-y-3">
                <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                  <span className="text-white font-black text-xs">医院门诊与处方记录</span>
                  <span className="text-gray-400 text-[10px]">共 {logs.length} 条</span>
                </div>

                {logs.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-xs font-bold">暂无诊疗记录</div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-[#181a24] border border-black rounded-xl p-2.5 flex justify-between items-center"
                      >
                        <div>
                          <div className="text-white font-black text-xs flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                            <span>{log.title}</span>
                          </div>
                          <div className="text-rose-300/80 text-[10px] font-bold mt-0.5">
                            {log.hospitalName} · {log.time}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          {log.healthAdded > 0 && (
                            <div className="text-emerald-400 text-xs font-mono font-black">
                              +{log.healthAdded}% 健康
                            </div>
                          )}
                          <div className="text-gray-400 text-[10px] font-mono">
                            -{log.cost.toLocaleString()} ₽
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
