import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { SuccessionModal } from './SuccessionModal';
import type { HeirCandidate } from '../lib/family';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
afterEach(() => {
  act(() => root?.unmount());
  root = null;
});

const render = (heirs: HeirCandidate[]) => {
  const el = document.createElement('div');
  root = createRoot(el);
  act(() => root!.render(createElement(SuccessionModal, { deceasedName: '当家人', deceasedAge: 70, heirs, onChooseHeir: () => {}, onRestart: () => {}, onClose: () => {} })));
  return el.textContent ?? '';
};

describe('传承界面', () => {
  it('同时列出子女与孙辈继承人（可跳过子辈）', () => {
    const text = render([
      { id: 'c', name: '子女甲', gender: '男', age: 40, relation: '儿子', kind: 'child' },
      { id: 'g', name: '孙辈乙', gender: '女', age: 18, relation: '孙女', kind: 'grandchild' },
    ]);
    expect(text).toContain('子女甲');
    expect(text).toContain('孙辈乙');
  });
});
