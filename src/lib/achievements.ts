// 成就（undefined.md 第 26 题）：完成时间记录现实时间；跨人生保留（重置人生不清除）

export const ACHIEVEMENTS_KEY = 'amigo_achievements';
/** 解锁新成就时派发的浏览器事件（detail 为成就 id），App 据此弹出提示 */
export const ACHIEVEMENT_EVENT = 'amigo-achievement';

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  icon: 'baby' | 'coins' | 'home' | 'heart' | 'users' | 'gift' | 'gem' | 'crown' | 'chart' | 'plane' | 'globe' | 'hospital' | 'cake' | 'tree' | 'trophy' | 'scroll';
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'born', title: '呱呱坠地', desc: '完成出生登记', icon: 'baby' },
  { id: 'first_salary', title: '自食其力', desc: '第一次领到月薪或童工薪水', icon: 'coins' },
  { id: 'home', title: '安家立业', desc: '购入第一套房产', icon: 'home' },
  { id: 'married', title: '喜结连理', desc: '结婚', icon: 'heart' },
  { id: 'big_family', title: '儿孙满堂', desc: '子嗣达到 4 人', icon: 'users' },
  { id: 'twins', title: '双喜临门', desc: '生下双胞胎', icon: 'gift' },
  { id: 'rich', title: '腰缠万贯', desc: '现金 + 存款 ≥ 1,000,000 ₽', icon: 'gem' },
  { id: 'tycoon', title: '富可敌国', desc: '现金 + 存款 ≥ 100,000,000 ₽', icon: 'crown' },
  { id: 'stock', title: '证券入市', desc: '开立证券账户', icon: 'chart' },
  { id: 'traveler', title: '周游列国', desc: '完成 3 次出国旅行', icon: 'plane' },
  { id: 'resident', title: '落地生根', desc: '获得一项海外永久居留', icon: 'globe' },
  { id: 'cured', title: '妙手回春', desc: '在医院治愈一次疾病', icon: 'hospital' },
  { id: 'eighty', title: '寿比南山', desc: '活到 80 岁', icon: 'cake' },
  { id: 'succession', title: '薪火相传', desc: '完成一次家族传承', icon: 'tree' },
  { id: 'sim_master', title: '推演大师', desc: '推演积分达到 100', icon: 'trophy' },
  { id: 'witness', title: '时代见证者', desc: '经历一次历史大事件年份（如 1878 格纳提斯运动）', icon: 'scroll' },
];

/** 成就 id → 解锁时的现实时间（毫秒） */
export type AchievementRecord = Record<string, number>;

export const readAchievements = (): AchievementRecord => {
  try {
    const saved = JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '{}');
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
};

/** 解锁成就；已解锁则忽略。返回是否为新解锁。 */
export const unlockAchievement = (id: string, now: number = Date.now()): boolean => {
  if (!ACHIEVEMENTS.some((a) => a.id === id)) return false;
  try {
    const record = readAchievements();
    if (record[id]) return false;
    record[id] = now;
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(record));
    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent(ACHIEVEMENT_EVENT, { detail: id }));
    }
    return true;
  } catch {
    return false;
  }
};

export const formatRealTime = (ms: number) => {
  const d = new Date(ms);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 开发测试工具：一次解锁全部成就（不逐条弹提示），返回本次新解锁的数量 */
export const unlockAllForTesting = (now: number = Date.now()): number => {
  try {
    const record = readAchievements();
    let added = 0;
    for (const a of ACHIEVEMENTS) {
      if (!record[a.id]) {
        record[a.id] = now;
        added++;
      }
    }
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(record));
    return added;
  } catch {
    return 0;
  }
};

/** 开发测试工具：清空全部成就 */
export const clearAchievementsForTesting = () => {
  try {
    localStorage.removeItem(ACHIEVEMENTS_KEY);
    localStorage.removeItem(CREDITS_SEEN_KEY);
  } catch {}
};

// ---------- 致谢名单 ----------

/** 是否已自动播放过致谢名单（只自动播放一次，之后在成就页重播） */
export const CREDITS_SEEN_KEY = 'amigo_credits_seen';
/** 服务器返回的全成就名次缓存 */
export const CREDITS_RANK_KEY = 'amigo_credits_rank';

export const hasAllAchievements = (record: AchievementRecord = readAchievements()) => ACHIEVEMENTS.every((a) => !!record[a.id]);
