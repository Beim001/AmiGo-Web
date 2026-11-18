import { useState } from 'react';

/**
 * 全屏弹窗的开关状态。
 * 弹窗按打开顺序排成一个栈：后打开的盖在上面，关闭时只移除对应的那一个，下面的弹窗保持打开
 * （例如在银行里打开资产图表，关掉图表后回到银行）。
 * 传承、致谢名单、云存档冲突等由各自规则决定何时出现的界面不在这里管理。
 */
export type OverlayId =
  | 'shop'
  | 'profile'
  | 'bank'
  | 'stock'
  | 'wealthChart'
  | 'gender'
  | 'hospital'
  | 'welfare'
  | 'license'
  | 'leisure'
  | 'prison'
  | 'court'
  | 'job'
  | 'housing'
  | 'visa'
  | 'immigrate'
  | 'birth'
  | 'calendar'
  | 'auth'
  | 'marriage'
  | 'auction';

/** 打开弹窗：已打开的移到最上层 */
export const pushOverlay = (stack: OverlayId[], id: OverlayId): OverlayId[] => [...stack.filter((x) => x !== id), id];

export const removeOverlay = (stack: OverlayId[], id: OverlayId): OverlayId[] => stack.filter((x) => x !== id);

export interface Overlays {
  /** 当前打开的弹窗，按打开顺序排列 */
  stack: OverlayId[];
  isOpen: (id: OverlayId) => boolean;
  open: (id: OverlayId) => void;
  close: (id: OverlayId) => void;
  /** 关掉 from 再打开 to（从一个弹窗跳转到另一个） */
  swap: (from: OverlayId, to: OverlayId) => void;
}

export const useOverlays = (): Overlays => {
  const [stack, setStack] = useState<OverlayId[]>([]);
  return {
    stack,
    isOpen: (id) => stack.includes(id),
    open: (id) => setStack((s) => pushOverlay(s, id)),
    close: (id) => setStack((s) => removeOverlay(s, id)),
    swap: (from, to) => setStack((s) => pushOverlay(removeOverlay(s, from), to)),
  };
};
