import { describe, expect, it } from 'vitest';
import { DEFAULT_COHESION, familyCohesion } from './familyRank';

describe('家族凝聚力', () => {
  it('取在世亲属好感的平均值，不计当家人与已故家人', () => {
    expect(
      familyCohesion([
        { isPlayer: true, status: '在世', affinity: 100 },
        { status: '在世', affinity: 60 },
        { status: '在世', affinity: 75 },
        { status: '已故', affinity: 0 },
      ]),
    ).toBe(68);
  });

  it('没有在世亲属时按默认值', () => {
    expect(familyCohesion([{ isPlayer: true, status: '在世', affinity: 100 }])).toBe(DEFAULT_COHESION);
  });
});
