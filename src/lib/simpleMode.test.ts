import { describe, expect, it } from 'vitest';
import { recommendJobs } from './simpleMode';
import { seededRng } from './appearance';

const JOBS = Array.from({ length: 18 }, (_, i) => ({ id: `j${i}`, dailySalary: (i + 1) * 100 }));
const salaries = (classId: string, seed = 'm') => recommendJobs(JOBS, classId, seededRng(seed)).map((j) => j.dailySalary);

describe('简洁模式推荐工作', () => {
  it('按家族阶层从对应的薪资档位推荐：穷人家低薪、中产中等、富贵人家高薪', () => {
    expect(Math.max(...salaries('beggar'))).toBeLessThanOrEqual(600);
    expect(Math.max(...salaries('commoner'))).toBeLessThanOrEqual(600);
    expect(salaries('middle').every((s) => s > 600 && s <= 1200)).toBe(true);
    expect(Math.min(...salaries('noble'))).toBeGreaterThan(1200);
  });

  it('每次推荐 3 个不同的岗位，按工资从高到低排列', () => {
    const list = salaries('modest');
    expect(new Set(list).size).toBe(3);
    expect([...list].sort((a, b) => b - a)).toEqual(list);
  });

  it('同一个种子（同一个月）推荐结果不变', () => {
    expect(salaries('commoner', '1880_5')).toEqual(salaries('commoner', '1880_5'));
  });
});
