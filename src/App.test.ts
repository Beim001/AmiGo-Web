import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cacheUser } from './lib/authClient';
import i18n from './i18n';
import type { AppUser } from './lib/bilibiliToy';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// B 站账号不经过账号服务；网络请求一律失败，模拟离线游玩
const bilibiliUser: AppUser = { uid: 'b1', displayName: '离线玩家', photoURL: null, email: null, emailVerified: false, providerData: [{ providerId: 'bilibili' }] };

/** 顶部栏的「我的」只在游戏主界面出现（登录首屏没有） */
const inGame = (text: string) => text.includes(i18n.t('mine', { ns: 'nav' }));

let root: ReturnType<typeof createRoot> | null = null;
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
  // 本机 .env.local 可能打开了跳过登录的开发开关；测试固定关闭，并重新加载模块使其生效
  vi.stubEnv('VITE_SKIP_AUTH', 'false');
  vi.resetModules();
});
afterEach(() => {
  act(() => root?.unmount());
  root = null;
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const renderApp = async () => {
  const { default: App } = await import('./App');
  const el = document.createElement('div');
  root = createRoot(el);
  await act(async () => root!.render(createElement(App)));
  return el.textContent ?? '';
};

describe('应用外壳', () => {
  it('已登录的 B 站账号离线时也能进入游戏主界面', async () => {
    cacheUser(bilibiliUser);
    expect(inGame(await renderApp())).toBe(true);
  });

  it('未登录时停在登录首屏，不渲染游戏主界面', async () => {
    expect(inGame(await renderApp())).toBe(false);
  });
});
