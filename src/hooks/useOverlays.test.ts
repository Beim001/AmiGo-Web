import { describe, expect, it } from 'vitest';
import { pushOverlay, removeOverlay } from './useOverlays';

describe('弹窗栈', () => {
  it('在银行里打开资产图表，关掉图表后回到银行', () => {
    const stack = pushOverlay(pushOverlay([], 'bank'), 'wealthChart');
    expect(stack).toEqual(['bank', 'wealthChart']);
    expect(removeOverlay(stack, 'wealthChart')).toEqual(['bank']);
  });

  it('再次打开已打开的弹窗时移到最上层，不重复', () => {
    expect(pushOverlay(['bank', 'wealthChart'], 'bank')).toEqual(['wealthChart', 'bank']);
  });

  it('关闭未打开的弹窗不影响其他弹窗', () => {
    expect(removeOverlay(['shop'], 'bank')).toEqual(['shop']);
  });
});
