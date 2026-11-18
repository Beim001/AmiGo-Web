import { describe, expect, it } from 'vitest';
import { BEGGAR_CHILD_TITLE, BEGGAR_CHILD_UNTIL, idleOccupation } from './lineage';

describe('没有正式工作时的职业显示（第 71 题）', () => {
  it('乞丐家庭的孩子与兄弟姐妹一样显示「流浪孩童」，成年后为待业', () => {
    expect(idleOccupation('beggar', 8)).toBe(BEGGAR_CHILD_TITLE);
    expect(idleOccupation('beggar', BEGGAR_CHILD_UNTIL - 1)).toBe(BEGGAR_CHILD_TITLE);
    expect(idleOccupation('beggar', BEGGAR_CHILD_UNTIL)).toBe('待业');
  });

  it('其他阶层未满 18 岁为学堂学生', () => {
    expect(idleOccupation('commoner', 12)).toBe('学堂学生');
    expect(idleOccupation('commoner', 18)).toBe('待业');
  });
});
