import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Game, useGameState } from './useGameState';
import { classById } from '../lib/lineage';
import { getOrigin, INITIAL_FAMILY_STATE } from '../lib/family';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let latest: Game;
let root: ReturnType<typeof createRoot> | null = null;
const Probe = () => {
  latest = useGameState();
  return null;
};
const mount = () => {
  root = createRoot(document.createElement('div'));
  act(() => root!.render(createElement(Probe)));
};

beforeEach(() => localStorage.clear());
afterEach(() => {
  act(() => root?.unmount());
  root = null;
});

describe('初始化', () => {
  it('从存档读取数值与对象', () => {
    localStorage.setItem('amigo_coins', '123');
    localStorage.setItem('amigo_game_year', '1899');
    localStorage.setItem('amigo_family', JSON.stringify({ ...INITIAL_FAMILY_STATE, affinity: { m1: 40 } }));
    mount();
    expect(latest.state.coins).toBe(123);
    expect(latest.state.gameYear).toBe(1899);
    expect(latest.state.family.affinity).toEqual({ m1: 40 });
  });

  it('已出生登记但存档没有声望时，按家族阶层的起始声望', () => {
    localStorage.setItem('amigo_is_registered', 'true');
    mount();
    expect(latest.state.reputation).toBe(classById(getOrigin(INITIAL_FAMILY_STATE).classId).startReputation);
  });
});

describe('setter', () => {
  it('支持更新函数，同一次事件里的多次更新按顺序累积', () => {
    mount();
    const start = latest.state.coins;
    act(() => {
      latest.setters.setCoins((c) => c + 1);
      latest.setters.setCoins((c) => c * 10);
    });
    expect(latest.state.coins).toBe((start + 1) * 10);
  });

  it('setter 在重新渲染后保持同一个引用（可安全放进依赖数组或传给子组件）', () => {
    mount();
    const before = latest.setters.setHealth;
    act(() => latest.setters.setHealth(50));
    expect(latest.setters.setHealth).toBe(before);
  });
});

describe('自动存档', () => {
  it('首次渲染写入存档，之后在值变化时更新', () => {
    mount();
    expect(localStorage.getItem('amigo_health')).toBe('100');
    act(() => latest.setters.setHealth(42));
    expect(localStorage.getItem('amigo_health')).toBe('42');
  });

  it('由处理函数手动写存档的字段（游戏年月等）不会被自动写入', () => {
    mount();
    act(() => latest.setters.setGameYear(1900));
    expect(latest.state.gameYear).toBe(1900);
    expect(localStorage.getItem('amigo_game_year')).toBeNull();
  });
});
