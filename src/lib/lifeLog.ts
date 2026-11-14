// 人生日志（undefined.md 第 14–17 题）
// - 只记录人生里程碑；分类：成长、事业、财富、出行、健康、大事
// - 不设上限；重置人生时随 amigo_* 存档一起清空
// - 各功能模块直接调用 addLifeLog，日期与年龄从存档读取，无需额外传参

export type LogCategory = '成长' | '事业' | '财富' | '出行' | '健康' | '大事';
export const LOG_CATEGORIES: LogCategory[] = ['成长', '事业', '财富', '出行', '健康', '大事'];

export const LIFE_LOG_KEY = 'amigo_life_log';
/** 日志更新时派发的浏览器事件，日志页据此刷新 */
export const LIFE_LOG_EVENT = 'amigo-life-log';

export interface LifeLogEntry {
  id: string;
  year: number;
  month: number;
  age: number;
  category: LogCategory;
  title: string;
  desc: string;
}

export const readLifeLog = (): LifeLogEntry[] => {
  try {
    const saved = JSON.parse(localStorage.getItem(LIFE_LOG_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const readNumber = (key: string, fallback: number) => {
  try {
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) && v > 0 ? v : fallback;
  } catch {
    return fallback;
  }
};

/** 写入一条日志（仅在已办理出生登记时记录） */
export const addLifeLog = (category: LogCategory, title: string, desc: string, when?: { year: number; month: number; age?: number }) => {
  try {
    if (localStorage.getItem('amigo_is_registered') !== 'true') return;
    const year = when?.year ?? readNumber('amigo_game_year', 1870);
    const month = when?.month ?? readNumber('amigo_game_month', 1);
    const age = when?.age ?? 8 + (year - readNumber('amigo_birth_registered_year', year));
    const entry: LifeLogEntry = {
      id: `${year}_${month}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      year,
      month,
      age,
      category,
      title,
      desc,
    };
    localStorage.setItem(LIFE_LOG_KEY, JSON.stringify([...readLifeLog(), entry]));
    window.dispatchEvent(new Event(LIFE_LOG_EVENT));
  } catch {}
};

export const clearLifeLog = () => {
  try {
    localStorage.removeItem(LIFE_LOG_KEY);
    window.dispatchEvent(new Event(LIFE_LOG_EVENT));
  } catch {}
};
