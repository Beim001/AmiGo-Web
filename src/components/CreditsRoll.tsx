import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { CREDIT_SECTIONS, CREDITS_INTRO, creditsHeadline } from '../data/credits';

export interface CreditsRollProps {
  /** 全成就名次；null 表示未知（显示不带名次的祝贺语） */
  rank: number | null;
  /** 正在向服务器查询名次 */
  loading?: boolean;
  onClose: () => void;
}

/** 滚动速度（像素/秒） */
const SPEED = 40;

/** 致谢名单：片尾式从下往上滚动；可跳过，播完后可重播 */
export const CreditsRoll: React.FC<CreditsRollProps> = ({ rank, loading, onClose }) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [finished, setFinished] = useState(false);
  const [round, setRound] = useState(0);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content || loading) return;
    setFinished(false);
    const from = viewport.clientHeight;
    const to = -content.scrollHeight;
    const reduceMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || typeof content.animate !== 'function') {
      // 不播放动画：直接显示全部内容，可手动滚动
      content.style.transform = 'none';
      setFinished(true);
      return;
    }
    const anim = content.animate([{ transform: `translateY(${from}px)` }, { transform: `translateY(${to}px)` }], {
      duration: ((from - to) / SPEED) * 1000,
      easing: 'linear',
      fill: 'forwards',
    });
    anim.onfinish = () => {
      // 播完后停在完整名单上，可手动滚动查看
      anim.cancel();
      content.style.transform = 'none';
      viewport.scrollTop = 0;
      setFinished(true);
    };
    return () => anim.cancel();
  }, [round, loading]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-[70] bg-black flex flex-col animate-in fade-in duration-500">
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        {finished && (
          <button
            onClick={() => setRound((r) => r + 1)}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-xs font-black px-3 py-1.5 rounded-xl border border-white/30 cursor-pointer"
          >
            <RotateCcw size={14} /> 重播
          </button>
        )}
        <button
          onClick={onClose}
          className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-xs font-black px-3 py-1.5 rounded-xl border border-white/30 cursor-pointer"
        >
          <X size={14} /> {finished ? '关闭' : '跳过'}
        </button>
      </div>

      <div ref={viewportRef} className={`flex-1 ${finished ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm font-bold">正在查询你的名次……</div>
        ) : (
          <div
            key={round}
            ref={contentRef}
            className="text-center px-6 py-16 space-y-12"
            style={{ transform: 'translateY(100vh)' }}
          >
            <div className="space-y-4">
              <p className="text-yellow-300 text-lg font-black leading-relaxed">{creditsHeadline(rank)}</p>
              {CREDITS_INTRO.map((line) => (
                <p key={line} className="text-white text-sm font-bold">
                  {line}
                </p>
              ))}
            </div>
            {CREDIT_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-3">
                <h3 className="text-amber-400 text-xs font-black tracking-widest">{section.title}</h3>
                {section.names.map((name, i) => (
                  <p key={`${name}-${i}`} className="text-white text-base font-black break-words">
                    {name}
                  </p>
                ))}
              </div>
            ))}
            <p className="text-gray-500 text-xs font-bold pt-8">AmiGO Lite</p>
          </div>
        )}
      </div>
    </div>
  );
};
