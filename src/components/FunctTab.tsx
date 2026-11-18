import React, { useState } from 'react';
import {
  TrendingUp,
  Wallet,
  Baby,
  Heart,
  Plane,
  Globe,
  UserCog,
  Home,
  Briefcase,
  Receipt,
  Landmark,
  Building2,
  Hospital,
  Car,
  GraduationCap,
  HeartHandshake,
  Scale,
  Lock,
  Users,
  Megaphone,
  Map as MapIcon,
  Gamepad2,
} from 'lucide-react';

const FUNC_BENTO = [
  // Block 1: 核心金融与商业 (Cols 1-4, Rows 1-2)
  { id: 'stock', label: '交易所', sub: '股票交易', icon: TrendingUp, color: '#1d4ed8', span: 'col-span-2 row-span-2' },
  { id: 'finance', label: '财务银行', sub: '资产与信用体系', icon: Wallet, color: '#a68245', span: 'col-span-2 row-span-2' },

  // Block 2: 公民身份与政务 (Cols 1-4, Rows 3-4)
  { id: 'birth', label: '出生登记', sub: '新生儿证明', icon: Baby, color: '#a85b6f', span: 'col-span-2' },
  { id: 'marriage', label: '结婚登记', sub: '婚姻关系', icon: Heart, color: '#b2586a', span: 'col-span-2' },
  { id: 'visa', label: '签证申办', sub: '出入境许可', icon: Plane, color: '#4d6b8c', span: 'col-span-1' },
  { id: 'immigrate', label: '移民居留', sub: '入籍申请', icon: Globe, color: '#6a518a', span: 'col-span-1' },
  { id: 'gender', label: '性别权利', sub: '身份信息更新', icon: UserCog, color: '#88508a', span: 'col-span-2' },

  // Block 3: 不动产、职场与税务 (Cols 1-4, Rows 5-6)
  { id: 'housing', label: '住房地产', sub: '不动产买卖', icon: Home, color: '#9e6743', span: 'col-span-2 row-span-2' },
  { id: 'job', label: '就业招聘', sub: '职场求职', icon: Briefcase, color: '#525a66', span: 'col-span-2' },
  { id: 'tax', label: '税单查询', sub: '个人所得税', icon: Receipt, color: '#3d7a63', span: 'col-span-1' },
  { id: 'cost', label: '物价补贴', sub: '生活成本', icon: Landmark, color: '#3d757a', span: 'col-span-1' },

  // Block 4: 企业与公共事务 (Cols 1-4, Rows 7-8)
  { id: 'company', label: '企业事务', sub: '公司登记', icon: Building2, color: '#3d6185', span: 'col-span-2' },
  { id: 'hospital', label: '医疗服务', sub: '医院诊疗', icon: Hospital, color: '#a64245', span: 'col-span-2' },
  { id: 'license', label: '驾照管理', sub: '车辆换证', icon: Car, color: '#5e6573', span: 'col-span-1' },
  { id: 'education', label: '教育学府', sub: '入学证明', icon: GraduationCap, color: '#4a5785', span: 'col-span-3' },

  // Block 5: 社会保障与司法 (Cols 1-4, Rows 9-10)
  { id: 'welfare', label: '社会福利', sub: '养老救济金', icon: HeartHandshake, color: '#a1476b', span: 'col-span-2 row-span-2' },
  { id: 'court', label: '法院诉讼', sub: '法庭调解', icon: Scale, color: '#8a6538', span: 'col-span-1' },
  { id: 'prison', label: '监狱服刑', sub: '前科记录', icon: Lock, color: '#42454d', span: 'col-span-1' },
  { id: 'org', label: '社团政党', sub: '组织管理', icon: Users, color: '#684a85', span: 'col-span-2' },

  // Block 6: 社区与文娱 (Cols 1-4, Rows 11-12)
  { id: 'movement', label: '公民运动', sub: '示威游行', icon: Megaphone, color: '#a84c38', span: 'col-span-2' },
  { id: 'map_srv', label: '社区地图', sub: '公共设施', icon: MapIcon, color: '#487a48', span: 'col-span-2' },
  { id: 'entertainment', label: '文娱休闲', sub: '剧院、赛马、斗鸡与摔跤', icon: Gamepad2, color: '#7a4285', span: 'col-span-4' },
];

const renderBentoContent = (item: any) => {
  if (item.span === 'col-span-2 row-span-2') {
    return (
      <>
        <div className="absolute -right-4 -bottom-4 opacity-20 rotate-12 scale-[3] pointer-events-none">
          <item.icon size={64} className="text-white" strokeWidth={2} />
        </div>
        <div className="flex flex-col items-center justify-center relative z-10 h-full p-4">
          <item.icon size={48} className="text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.8)] mb-2" stroke="black" strokeWidth={2} />
          <h2 className="text-white text-xl font-black tracking-widest mb-1 text-center" style={{ textShadow: '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 0 3px 0 #000' }}>{item.label}</h2>
          <div className="bg-black/60 text-white text-[9px] px-2 py-0.5 rounded border border-black font-extrabold shadow-[0_2px_0_#000] text-center">{item.sub}</div>
        </div>
      </>
    );
  }
  if (item.span === 'col-span-2' || item.span === 'col-span-4' || item.span === 'col-span-3') {
    return (
      <>
        <div className="absolute -right-2 -bottom-2 opacity-20 rotate-12 scale-[2.5] pointer-events-none">
          <item.icon size={48} className="text-white" strokeWidth={2} />
        </div>
        <div className="flex items-center justify-start relative z-10 h-full px-3.5 gap-3">
          <item.icon size={30} className="text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.8)] flex-shrink-0" stroke="black" strokeWidth={2.5} />
          <div className="flex flex-col min-w-0">
            <h2 className="text-white text-sm font-black tracking-widest mb-0.5 truncate" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 0 #000' }}>{item.label}</h2>
            <div className="bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded border border-black font-extrabold shadow-[0_1px_0_#000] w-max truncate">{item.sub}</div>
          </div>
        </div>
      </>
    );
  }
  if (item.span === 'col-span-1 row-span-2') {
    return (
      <>
        <div className="absolute -right-2 -bottom-2 opacity-20 rotate-12 scale-[2.5] pointer-events-none">
          <item.icon size={40} className="text-white" strokeWidth={2} />
        </div>
        <div className="flex flex-col items-center justify-center relative z-10 h-full p-2">
          <item.icon size={32} className="text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.8)] mb-1.5" stroke="black" strokeWidth={2.5} />
          <h2 className="text-white text-[13px] font-black tracking-widest mb-1 text-center leading-tight" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 0 #000' }}>{item.label}</h2>
          <div className="bg-black/60 text-white text-[8px] px-1 py-0.5 rounded border border-black font-extrabold shadow-[0_1px_0_#000] text-center truncate w-full">{item.sub}</div>
        </div>
      </>
    );
  }
  
  // col-span-1
  return (
    <>
      <div className="absolute -right-1 -bottom-1 opacity-20 rotate-12 scale-[2] pointer-events-none">
        <item.icon size={32} className="text-white" strokeWidth={2} />
      </div>
      <div className="flex flex-col items-center justify-center relative z-10 h-full p-1">
        <item.icon size={22} className="text-white drop-shadow-[0_1.5px_0_rgba(0,0,0,0.8)] mb-1" stroke="black" strokeWidth={2.5} />
        <h2 className="text-white text-[11px] font-black tracking-widest text-center leading-tight" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 1.5px 0 #000' }}>{item.label}</h2>
      </div>
    </>
  );
};

export interface FunctTabProps {
  onOpenBank?: () => void;
  onOpenStock?: () => void;
  onOpenHospital?: () => void;
  onOpenJob?: () => void;
  /** 社会福利（帝国时期为教会救济，第 67.5 题） */
  onOpenWelfare?: () => void;
  /** 驾照管理（马车 / 汽车执照，第 67.4 题） */
  onOpenLicense?: () => void;
  /** 文娱休闲（剧院、赌场、赛马、斗鸡、斗牛、摔跤，第 67.10 题） */
  onOpenLeisure?: () => void;
  /** 监狱服刑（第 67.7 题） */
  onOpenPrison?: () => void;
  onOpenBirth?: () => void;
  onOpenGender?: () => void;
  onOpenHousing?: () => void;
  onOpenVisa?: () => void;
  onOpenImmigrate?: () => void;
  onOpenMarriage?: () => void;
}

export const FunctTab: React.FC<FunctTabProps> = ({
  onOpenBank,
  onOpenStock,
  onOpenHospital,
  onOpenJob,
  onOpenWelfare,
  onOpenLicense,
  onOpenLeisure,
  onOpenPrison,
  onOpenBirth,
  onOpenGender,
  onOpenHousing,
  onOpenVisa,
  onOpenImmigrate,
  onOpenMarriage,
}) => {
  const [toast, setToast] = useState<string | null>(null);

  // 已实现的功能入口；不在此表中的入口显示「即将开放」
  const handlers: Record<string, (() => void) | undefined> = {
    stock: onOpenStock,
    finance: onOpenBank,
    birth: onOpenBirth,
    visa: onOpenVisa,
    immigrate: onOpenImmigrate,
    marriage: onOpenMarriage,
    gender: onOpenGender,
    housing: onOpenHousing,
    job: onOpenJob,
    hospital: onOpenHospital,
    welfare: onOpenWelfare,
    license: onOpenLicense,
    entertainment: onOpenLeisure,
    prison: onOpenPrison,
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 2200);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#252632] pb-8 flex flex-col custom-scrollbar">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-black/90 text-yellow-300 border-2 border-yellow-500 text-xs font-black px-4 py-2 rounded-xl shadow-[0_4px_0_#000] animate-in fade-in slide-in-from-top-2 duration-200 text-center max-w-[85%] pointer-events-none">
          {toast}
        </div>
      )}

      <div className="bg-[#1e3a8a] text-white text-center py-3 font-bold text-xl border-b-4 border-[#172554] relative z-10 shadow-lg flex-shrink-0">
        <div className="absolute inset-0 flex justify-center items-center opacity-30 pointer-events-none overflow-hidden">
           <div className="w-24 h-24 border-[6px] border-black rounded-full absolute -top-8"></div>
           <div className="w-32 h-32 border-[6px] border-black rounded-full absolute -bottom-16"></div>
        </div>
        <span className="relative z-10 drop-shadow-[0_2px_0_#000] font-black tracking-widest text-2xl">功能</span>
      </div>

      <div className="p-3.5 space-y-4">
        <div className="grid grid-cols-4 gap-2.5 auto-rows-[76px]">
          {FUNC_BENTO.map((item) => {
            const open = handlers[item.id];
            const available = !!open;
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (open) open();
                  else showToast(`「${item.label}」即将开放，敬请期待`);
                }}
                className={`
                  ${item.span}
                  rounded-xl border-2 border-black relative overflow-hidden shadow-[0_4px_0_#000]
                  cursor-pointer active:translate-y-[4px] active:shadow-none transition-all
                  ${available ? 'hover:brightness-110' : 'grayscale-[55%] opacity-75'}
                `}
                style={{ backgroundColor: item.color }}
                title={available ? item.label : `${item.label}（即将开放）`}
              >
                {renderBentoContent(item)}
                {!available && (
                  <div className="absolute top-1 right-1 z-20 bg-black/80 text-yellow-300 text-[8px] font-black px-1 py-px rounded border border-yellow-500/60 leading-tight pointer-events-none">
                    即将开放
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Alias FuncTab for backward compatibility
export const FuncTab = FunctTab;
