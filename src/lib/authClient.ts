// AmiGO 账号服务客户端：调用同域名下的 Cloudflare Worker 接口（/api/auth/*）
// 取代原先的 Firebase Authentication（Firebase 在中国大陆不可用）

import type { AppUser } from './bilibiliToy';

export class AuthError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

interface ApiUser {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}

const REQUEST_TIMEOUT_MS = 8000;

const call = async <T = any>(path: string, init: RequestInit = {}): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      credentials: 'same-origin',
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
      signal: controller.signal,
    });
  } catch {
    throw new AuthError('NETWORK_ERROR', 0);
  } finally {
    clearTimeout(timer);
  }
  let data: any = {};
  try {
    data = await res.json();
  } catch {}
  if (!res.ok || data.ok === false) throw new AuthError(data.code || `HTTP_${res.status}`, res.status);
  // 本地开发模式下后端会返回邮件链接，方便不配置发信服务也能测试
  if (data.devLink) console.info('[开发模式] 邮件链接：', data.devLink);
  return data as T;
};

const post = <T = any>(path: string, body: unknown = {}) => call<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const toAppUser = (u: ApiUser): AppUser => ({
  uid: u.uid,
  displayName: u.displayName,
  photoURL: null,
  email: u.email,
  emailVerified: u.emailVerified,
  providerData: [{ providerId: 'password' }],
});

/** 是否为邮箱密码账号（只有这类账号使用云端存档） */
export const isPasswordUser = (user: AppUser | null | undefined): boolean =>
  !!user && Array.isArray(user.providerData) && user.providerData.some((p) => p?.providerId === 'password');

// ---------- 本地缓存的登录用户（离线时也能进入游戏） ----------

export const ACTIVE_USER_KEY = 'amigo_active_user';

export const cacheUser = (user: AppUser | null) => {
  try {
    if (user) localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(ACTIVE_USER_KEY);
  } catch {}
};

export const readCachedUser = (): AppUser | null => {
  try {
    const saved = localStorage.getItem(ACTIVE_USER_KEY);
    return saved ? (JSON.parse(saved) as AppUser) : null;
  } catch {
    return null;
  }
};

// ---------- 接口 ----------

export const register = async (email: string, password: string, displayName: string): Promise<AppUser> =>
  toAppUser((await post<{ user: ApiUser }>('/auth/register', { email, password, displayName })).user);

export const login = async (email: string, password: string): Promise<AppUser> =>
  toAppUser((await post<{ user: ApiUser }>('/auth/login', { email, password })).user);

export const logout = async (): Promise<void> => {
  await post('/auth/logout');
};

/** 当前登录用户；未登录返回 null；网络失败抛出 NETWORK_ERROR */
export const getMe = async (): Promise<AppUser | null> => {
  try {
    return toAppUser((await call<{ user: ApiUser }>('/auth/me')).user);
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) return null;
    throw err;
  }
};

export const resendVerification = async (): Promise<{ alreadyVerified?: boolean }> => post('/auth/resend-verification');

export const requestPasswordReset = async (email: string): Promise<void> => {
  await post('/auth/request-password-reset', { email });
};

export const resetPassword = async (token: string, password: string): Promise<void> => {
  await post('/auth/reset-password', { token, password });
};

// ---------- 全成就名次 ----------

/** 登记当前账号已集齐全部成就，返回名次（第几个集齐的玩家）；同一账号重复调用返回同一名次 */
export const claimCompletionRank = async (): Promise<number> => {
  const data = await post<{ rank: number | null }>('/achievements/complete');
  if (typeof data.rank !== 'number') throw new AuthError('NO_RANK', 500);
  return data.rank;
};

// ---------- 赛季排行（第 55 题） ----------

export type SeasonBoardId = 'score' | 'speed';

export interface SeasonRow {
  rank: number;
  uid: string;
  name: string;
  score: number;
  completedMs: number | null;
  lazy: boolean;
  isMe: boolean;
}

export interface SeasonBoard {
  list: SeasonRow[];
  /** excluded：cheat 用过测试兑换码，hidden 被管理员隐藏；两种情况都不参与排名 */
  me: { rank: number | null; score: number; completedMs: number | null; lazy: boolean; excluded: 'cheat' | 'hidden' | null } | null;
  /** 当前账号是否为赛季排行管理员 */
  admin: boolean;
}

/**
 * 上报本赛季成绩（仅已验证的邮箱账号）。cheat 表示本赛季用过测试兑换码，服务器会永久排除这条成绩。
 * 服务器会限制涨分速度、丢弃过短的速通用时，返回值是服务器实际记录的成绩。
 */
export const submitSeasonScore = (body: { season: string; score: number; completedMs: number | null; lazy: boolean; cheat: boolean }) =>
  call<{ score: number; completedMs: number | null }>('/season/score', { method: 'PUT', body: JSON.stringify(body) });

/** 读取赛季排行：score 积分榜，speed 全成就速通榜 */
export const fetchSeasonBoard = (season: string, board: SeasonBoardId) =>
  call<SeasonBoard>(`/season/leaderboard?season=${encodeURIComponent(season)}&board=${board}`);

/** 举报某位玩家的赛季成绩；reason 取举报时所在的榜单：score 积分异常，speed 速通用时异常 */
export const reportSeasonEntry = async (season: string, uid: string, reason: SeasonBoardId): Promise<void> => {
  await post('/season/report', { season, uid, reason });
};

export interface SeasonReportRow {
  uid: string;
  name: string;
  score: number;
  completedMs: number | null;
  lazy: boolean;
  cheat: boolean;
  hidden: boolean;
  /** 未处理的举报数 */
  reports: number;
  reasons: SeasonBoardId[];
}

/** 管理员：待处理举报与已隐藏的成绩 */
export const fetchSeasonReports = async (season: string): Promise<SeasonReportRow[]> =>
  (await call<{ list: SeasonReportRow[] }>(`/admin/season/reports?season=${encodeURIComponent(season)}`)).list;

/** 管理员：hide 隐藏成绩、unhide 恢复、dismiss 驳回举报 */
export const moderateSeasonEntry = async (season: string, uid: string, action: 'hide' | 'unhide' | 'dismiss'): Promise<void> => {
  await post('/admin/season/moderate', { season, uid, action });
};

// ---------- 错误文案 ----------

export const translateAuthError = (err: unknown): string => {
  const code = err instanceof AuthError ? err.code : '';
  switch (code) {
    case 'EMAIL_IN_USE':
      return '该电子邮箱已被注册，请直接登录或使用其他邮箱';
    case 'INVALID_EMAIL':
      return '请输入正确的电子邮箱格式';
    case 'WEAK_PASSWORD':
      return '密码长度需为 6–128 位';
    case 'INVALID_CREDENTIALS':
      return '账号或密码错误，请检查后再试';
    case 'TOO_MANY_REQUESTS':
      return '尝试次数过多，请稍后再试';
    case 'INVALID_TOKEN':
      return '链接无效或已过期，请重新申请';
    case 'UNAUTHORIZED':
      return '登录已失效，请重新登录';
    case 'NETWORK_ERROR':
      return '网络连接失败，请检查您的网络设置';
    default:
      return '操作失败，请重试';
  }
};
