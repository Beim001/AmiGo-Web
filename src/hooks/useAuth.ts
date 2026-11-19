import React, { useState } from 'react';
import { getMe, logout as logoutRequest, cacheUser, readCachedUser, isPasswordUser } from '../lib/authClient';
import { clearLocalGameData } from '../lib/cloudSave';
import type { AppUser } from '../lib/bilibiliToy';

// 本地测试开关：仅在 `npm run dev` 且 .env.local 设置 VITE_SKIP_AUTH=true 时生效，
// 跳过 Firebase 登录门禁，使用本地测试账号。生产构建 (npm run build) 中永远为 false。
const DEV_SKIP_AUTH = import.meta.env.DEV && import.meta.env.VITE_SKIP_AUTH === 'true';
const DEV_MOCK_USER: AppUser = {
  uid: 'dev-local-user',
  displayName: '本地测试玩家',
  photoURL: null,
  email: null,
  emailVerified: true,
  providerData: [{ providerId: 'dev' }],
  isMock: true,
};

/** 用邮箱密码注册、尚未验证邮箱的账号要先完成验证才能进入游戏 */
export const requiresEmailVerification = (user: AppUser): boolean => {
  const isPasswordAccount = Array.isArray(user.providerData) ? user.providerData.some((p) => p?.providerId === 'password') : false;
  return !!user.email && !user.emailVerified && isPasswordAccount;
};

/**
 * 账号登录状态：启动时向账号服务确认登录，提供登录成功与退出登录的处理。
 * onSignedIn 在每次登录成功（含启动时确认）后调用，供 App 同步角色名等游戏状态。
 */
export const useAuth = (onSignedIn: (user: AppUser) => void) => {
  const [authUser, setAuthUser] = useState<AppUser | null>(() => (DEV_SKIP_AUTH ? DEV_MOCK_USER : readCachedUser()));
  const [authLoading, setAuthLoading] = useState(!DEV_SKIP_AUTH);

  const applySignedInUser = (user: AppUser) => {
    setAuthUser(user);
    cacheUser(user);
    onSignedIn(user);
  };

  // 启动时向账号服务确认登录状态
  React.useEffect(() => {
    if (DEV_SKIP_AUTH) {
      console.info('[DEV] VITE_SKIP_AUTH=true，已跳过登录，使用本地测试账号');
      return;
    }
    getMe()
      .then((user) => {
        if (user) {
          applySignedInUser(user);
        } else if (isPasswordUser(readCachedUser())) {
          // 邮箱账号的登录已失效；B 站账号不经过账号服务，保留本地登录状态
          setAuthUser(null);
          cacheUser(null);
        }
      })
      .catch(() => {
        // 网络不可用：保留本地缓存的登录用户，允许离线游玩
      })
      .finally(() => setAuthLoading(false));
  }, []);

  /**
   * 退出登录。邮箱账号先调用 saveFirst 把进度同步到云端（没有云存档时不传），失败则不退出并返回 false；
   * 退出后清除本地进度并刷新页面，避免同一浏览器切换账号时共用存档。
   */
  const logout = async (saveFirst?: () => Promise<boolean>): Promise<boolean> => {
    if (isPasswordUser(authUser)) {
      if (saveFirst && !(await saveFirst())) return false;
      try {
        await logoutRequest();
      } catch (e) {
        console.error(e);
      }
      clearLocalGameData();
      window.location.reload();
      return true;
    }
    setAuthUser(null);
    cacheUser(null);
    return true;
  };

  return { authUser, setAuthUser, authLoading, applySignedInUser, logout };
};
