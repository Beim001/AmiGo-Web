import React, { useEffect, useState } from 'react';
import { LIFE_LOG_EVENT, LOG_CATEGORIES, LifeLogEntry, LogCategory, readLifeLog } from '../lib/lifeLog';
import {
  Baby,
  GraduationCap,
  Crown,
  Building2,
  Briefcase,
  Heart,
  Wallet,
  Gem,
  Plane,
  HeartPulse,
  Landmark,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

// 日志分类的图标与颜色（undefined.md 第 15 题 A）
const CATEGORY_STYLE: Record<LogCategory, { icon: React.ElementType; color: string }> = {
  成长: { icon: Baby, color: '#d69e9e' },
  事业: { icon: Briefcase, color: '#9eaad6' },
  财富: { icon: Wallet, color: '#d6c99e' },
  出行: { icon: Plane, color: '#9ec2d6' },
  健康: { icon: HeartPulse, color: '#d6a59e' },
  大事: { icon: Landmark, color: '#b09ed6' },
};

const INITIAL_LOG_ENTRIES = [
  {
    id: '1',
    age: '0岁',
    year: '1870.01',
    title: '出生降临',
    category: '成长',
    desc: '你出生在卡罗尼亚帝国首都一个普通家庭，响亮而清脆的啼哭声划破了冷冽的清晨。',
    icon: Baby,
    color: '#d69e9e',
    tag: '幼年',
  },
  {
    id: '2',
    age: '6岁',
    year: '1876.09',
    title: '启蒙入学',
    category: '成长',
    desc: '父母将你送入社区公立小学。你展示出了对机械构件与算术逻辑的浓厚兴趣。',
    icon: GraduationCap,
    color: '#9eaad6',
    tag: '学业',
  },
  {
    id: '3',
    age: '12岁',
    year: '1882.04',
    title: '发明比赛获奖',
    category: '成就',
    desc: '利用废旧齿轮和发条制作了一个自动定时闹钟，获得青少年科技组二等奖。',
    icon: Crown,
    color: '#d6c99e',
    tag: '荣誉',
  },
  {
    id: '4',
    age: '18岁',
    year: '1888.06',
    title: '帝国理工学院录取',
    category: '转折',
    desc: '以优异成绩考入帝国理工学院工程系，正式踏上了独立探索人生与科学的道路。',
    icon: Building2,
    color: '#9ec2d6',
    tag: '转折',
  },
  {
    id: '5',
    age: '22岁',
    year: '1892.07',
    title: '开启首份工作',
    category: '事业',
    desc: '毕业后加入卡罗尼亚重工集团，成为一名助理机械工程师，获得了第一笔薪金。',
    icon: Briefcase,
    color: '#a3a9b3',
    tag: '就业',
  },
  {
    id: '6',
    age: '25岁',
    year: '1895.10',
    title: '缔结良缘',
    category: '成就',
    desc: '与相知相爱的心仪对象在首都大教堂举办了温馨婚礼，组建了美满的小家庭。',
    icon: Heart,
    color: '#d6a59e',
    tag: '婚姻',
  },
  {
    id: '7',
    age: '28岁',
    year: '1898.03',
    title: '创立机械研制所',
    category: '转折',
    desc: '拿出多年积蓄与挚友合伙创立“未来机械研制所”，正式开启自主创业征程。',
    icon: Wallet,
    color: '#d6c99e',
    tag: '创业',
  },
  {
    id: '8',
    age: '30岁',
    year: '1900.01',
    title: '新世纪资产大突破',
    category: '成就',
    desc: '研制的新型发条引擎获得皇室专利认证，工坊获得巨额订单，财富大幅提升！',
    icon: Gem,
    color: '#b09ed6',
    tag: '里程碑',
  },
];

export interface LogTabProps {
  /** 未办理出生登记时展示示例日志（第 16 题 B） */
  isRegistered: boolean;
}

interface LogView {
  id: string;
  age: string;
  year: string;
  title: string;
  category: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  tag: string;
}

const toView = (e: LifeLogEntry): LogView => ({
  id: e.id,
  age: i18n.t('log:age', { age: e.age }),
  year: `${e.year}.${e.month < 10 ? '0' + e.month : e.month}`,
  title: e.title,
  category: e.category,
  desc: e.desc,
  icon: CATEGORY_STYLE[e.category]?.icon ?? Gem,
  color: CATEGORY_STYLE[e.category]?.color ?? '#a3a9b3',
  tag: e.category,
});

// 筛选项“全部”的取值；其余取值是日志分类本身（存档中的数据，保持原文）
const ALL = 'all';

export const LogTab: React.FC<LogTabProps> = ({ isRegistered }) => {
  const { t } = useTranslation('log');
  const [filter, setFilter] = useState(ALL);
  const [entries, setEntries] = useState<LifeLogEntry[]>(readLifeLog);

  // 其他界面写入日志时刷新
  useEffect(() => {
    const refresh = () => setEntries(readLifeLog());
    window.addEventListener(LIFE_LOG_EVENT, refresh);
    return () => window.removeEventListener(LIFE_LOG_EVENT, refresh);
  }, []);

  const showingSamples = !isRegistered;
  const allLogs: LogView[] = showingSamples ? INITIAL_LOG_ENTRIES : [...entries].reverse().map(toView);
  const categories = showingSamples ? [ALL, '成长', '成就', '转折', '事业'] : [ALL, ...LOG_CATEGORIES];
  const filteredLogs = filter === ALL ? allLogs : allLogs.filter((item) => item.category === filter);

  return (
    <div className="flex-1 overflow-y-auto bg-[#252632] pb-6 flex flex-col relative">
      {/* Log Header Bar */}
      <div className="bg-[#4c3266] text-white text-center py-3 font-bold text-xl border-b-4 border-[#2d1e3e] relative z-20 shadow-lg flex-shrink-0">
        <div className="absolute inset-0 flex justify-center items-center opacity-30 pointer-events-none overflow-hidden">
          <div className="w-24 h-24 border-[6px] border-black rounded-full absolute -top-8 left-10"></div>
          <div className="w-32 h-32 border-[6px] border-black rounded-full absolute -bottom-16 right-0"></div>
        </div>
        <span className="relative z-10 drop-shadow-[0_2px_0_#000] font-black tracking-widest text-2xl">
          {t('title')}
        </span>
      </div>

      {/* Category Filter Pills */}
      <div className="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto no-scrollbar relative z-10 flex-shrink-0">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-black border-2 border-black whitespace-nowrap transition-all shadow-[0_2px_0_#000] active:translate-y-0.5 ${
              filter === cat
                ? 'bg-yellow-400 text-black'
                : 'bg-[#3b3c4d] text-gray-300 hover:bg-[#47485c]'
            }`}
          >
            {cat === ALL ? t('all') : cat}
          </button>
        ))}
      </div>

      {showingSamples && (
        <div className="mx-4 mt-2 bg-[#1b1c25] border-2 border-black rounded-xl px-3 py-2 text-[11px] font-bold text-gray-300">
          {t('sampleHint')}
        </div>
      )}
      {!showingSamples && filteredLogs.length === 0 && (
        <div className="mx-4 mt-6 text-center text-gray-400 text-xs font-bold">
          {entries.length === 0 ? t('emptyLife') : t('emptyCategory')}
        </div>
      )}

      {/* Life Timeline with Dotted Connection Line */}
      <div className="p-4 relative">
        {/* Vertical Dotted Path */}
        <div className="absolute left-9 top-8 bottom-8 w-0.5 border-l-[3px] border-dashed border-[#facc15]/80 pointer-events-none"></div>

        <div className="space-y-5 relative">
          {filteredLogs.map((item) => (
            <div key={item.id} className="flex items-start gap-3 relative z-10 group">
              {/* Dotted Node Circle */}
              <div
                className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[0_3px_0_#000] relative z-10 mt-1"
                style={{ backgroundColor: item.color }}
              >
                <item.icon
                  size={20}
                  className="text-white drop-shadow-[0_1.5px_0_#000]"
                  strokeWidth={2.5}
                />
                {/* Horizontal Dotted Connector */}
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-3 border-t-[2.5px] border-dashed border-[#facc15]"></div>
              </div>

              {/* Timeline Card */}
              <div className="flex-1 bg-[#2d2f3d] border-2 border-black rounded-xl p-3 shadow-[0_4px_0_#000] relative hover:translate-x-0.5 transition-transform">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-yellow-400 text-black font-black text-xs px-2 py-0.5 rounded border border-black shadow-[0_1px_0_#000]">
                      {item.age}
                    </span>
                    <span className="text-gray-400 text-[11px] font-bold">{item.year}</span>
                  </div>
                  <span className="text-[10px] font-black text-white bg-black/50 px-2 py-0.5 rounded border border-black">
                    {item.tag}
                  </span>
                </div>
                <h3 className="text-white font-black text-base mt-1 drop-shadow-[0_1px_0_#000]">
                  {item.title}
                </h3>
                <p className="text-gray-300 font-bold text-xs leading-relaxed mt-1">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
