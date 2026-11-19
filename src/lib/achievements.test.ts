import { describe, expect, it } from 'vitest';
import { NEET_MIN_AGE, earnsNeet } from './achievements';

describe('成就「啃老族」', () => {
  it(`年满 ${NEET_MIN_AGE} 岁去世、这一世从没工作过才解锁`, () => {
    expect(earnsNeet(NEET_MIN_AGE, null, 0)).toBe(true);
    expect(earnsNeet(NEET_MIN_AGE - 1, null, 0)).toBe(false);
  });

  it('领过月薪或童工收入的不算（旧存档只有累计工作月数也能识别）', () => {
    expect(earnsNeet(80, 1900 * 12 + 1, 0)).toBe(false);
    expect(earnsNeet(80, null, 3)).toBe(false);
  });
});
