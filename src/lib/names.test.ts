import { describe, expect, it } from 'vitest';
import { FEMALE_GIVEN_NAMES, LOCAL_FEMALE_NAMES, LOCAL_MALE_NAMES, LOCAL_NEUTRAL_NAMES, MALE_GIVEN_NAMES, randomFullName, randomGivenName } from './names';

/** 固定种子的伪随机数 */
const seeded = (seed = 1) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

describe('随机人名按性别抽取（第 71 题）', () => {
  const maleOnly = new Set([...LOCAL_MALE_NAMES, ...MALE_GIVEN_NAMES]);
  const femaleOnly = new Set([...LOCAL_FEMALE_NAMES, ...FEMALE_GIVEN_NAMES]);

  it('女性不会抽到男性名字，男性不会抽到女性名字', () => {
    const rng = seeded(7);
    for (let i = 0; i < 2000; i++) {
      expect(maleOnly.has(randomGivenName('女', rng))).toBe(false);
      expect(femaleOnly.has(randomGivenName('男', rng))).toBe(false);
    }
  });

  it('「穆拉特」只会是男性名字', () => {
    expect(LOCAL_MALE_NAMES).toContain('穆拉特');
    const rng = seeded(3);
    for (let i = 0; i < 2000; i++) expect(randomFullName('女', '米尔', rng)).not.toMatch(/^穆拉特·/);
  });

  it('三个本地名字库互不重复', () => {
    const all = [...LOCAL_MALE_NAMES, ...LOCAL_FEMALE_NAMES, ...LOCAL_NEUTRAL_NAMES];
    expect(new Set(all).size).toBe(all.length);
  });
});
