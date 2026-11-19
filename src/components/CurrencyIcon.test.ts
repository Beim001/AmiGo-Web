import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { CURRENCIES } from '../data/currencies';

// 模拟进入联邦赛季：当前货币为诺镑
vi.mock('../data/seasons', async (importOriginal) => ({ ...(await importOriginal<object>()), CURRENCY: CURRENCIES.nob_pound }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('切换到诺镑赛季', () => {
  it('货币图标换成英镑样式', async () => {
    const { CurrencyIcon } = await import('./CurrencyIcon');
    const el = document.createElement('div');
    const root = createRoot(el);
    act(() => root.render(createElement(CurrencyIcon, { size: 12 })));
    expect(el.querySelector('svg')?.getAttribute('class')).toContain('pound-sterling');
    act(() => root.unmount());
  });

  it('抽卡的现金奖励以诺镑命名', async () => {
    const { drawGacha, INITIAL_PITY } = await import('../lib/gacha');
    const { rewards } = drawGacha(1, [], [], INITIAL_PITY, () => 0.99);
    expect(rewards[0].name).toContain('诺镑');
  });
});
