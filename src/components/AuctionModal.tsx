import React, { useState } from 'react';
import { ChevronLeft, Gavel, Ticket, Mail } from 'lucide-react';
import { Auction, heirloomById, QUALITY_STYLE, TICKET_PRICE, INVITE_REPUTATION, normalizeLot, minNextBid } from '../lib/heirlooms';

export interface AuctionModalProps {
  auction: Auction;
  coins: number;
  onClose: () => void;
  onBuyTicket: () => string;
  /** 加价、一口价或放弃，返回提示文字 */
  onAction: (lotIndex: number, action: { type: 'raise'; amount: number } | { type: 'buyout' } | { type: 'pass' }) => string;
}

/** 拍卖会（undefined.md 第 33 题）：受邀或购票入场；每件拍品一次封闭式出价 */
export const AuctionModal: React.FC<AuctionModalProps> = ({ auction, coins, onClose, onBuyTicket, onAction }) => {
  const [bids, setBids] = useState<Record<number, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const show = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 2600);
  };

  return (
    <div className="absolute inset-0 bg-[#1a1410] flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-200 overflow-hidden">
      {toast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-yellow-300 border-2 border-yellow-500 text-xs font-black px-4 py-2 rounded-xl text-center max-w-[85%]">
          {toast}
        </div>
      )}
      <div className="bg-[#5a3d1e] border-b-4 border-black px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="p-1.5 bg-black/20 border-2 border-black rounded-xl active:scale-95 cursor-pointer">
          <ChevronLeft size={22} className="text-white" strokeWidth={3} />
        </button>
        <div className="flex items-center gap-2 text-amber-100">
          <Gavel size={20} />
          <span className="font-black text-xl tracking-widest">北城拍卖会</span>
        </div>
        <span className="ml-auto text-[11px] text-amber-200 font-black">{auction.year}.{auction.month < 10 ? `0${auction.month}` : auction.month}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="bg-[#2b2118] border-2 border-black rounded-2xl p-3 text-xs font-bold text-amber-100/90 space-y-1">
          <p>本场拍卖会只在本月举办。从起拍价开始叫价，每次至少加一档；其他竞买人会跟价，没人再跟就由你落槌拍得。也可以按一口价直接买下，或随时放弃。拍得时才付款。</p>
          <p className="text-amber-300/80">当前现金：{coins.toLocaleString()} ₽</p>
        </div>

        {!auction.admitted ? (
          <div className="bg-[#2b2118] border-2 border-amber-700 rounded-2xl p-4 text-center space-y-3">
            <Ticket size={36} className="mx-auto text-amber-400" />
            <p className="text-amber-100 text-sm font-black">你没有收到邀请函</p>
            <p className="text-amber-200/70 text-[11px] font-bold">贵族、皇族或声望达到 {INVITE_REPUTATION} 的人会受到邀请；其他人需购买门票入场。</p>
            <button
              onClick={() => show(onBuyTicket())}
              className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-black px-5 py-2 rounded-xl border-2 border-black shadow-[0_3px_0_#000] cursor-pointer"
            >
              购买门票 {TICKET_PRICE.toLocaleString()} ₽
            </button>
          </div>
        ) : (
          <>
            {auction.invited && (
              <div className="bg-amber-900/40 border border-amber-600 rounded-xl px-3 py-2 text-[11px] font-black text-amber-200 flex items-center gap-1.5">
                <Mail size={13} /> 你受邀出席本场拍卖会
              </div>
            )}
            {auction.lots.map((raw, i) => {
              const h = heirloomById(raw.heirloomId);
              if (!h) return null;
              const lot = normalizeLot(raw);
              const min = minNextBid(lot);
              return (
                <div key={lot.heirloomId} className="bg-[#2b2118] border-2 border-black rounded-2xl p-3 shadow-[0_3px_0_#000] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white font-black text-sm">{h.name}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${QUALITY_STYLE[h.quality]}`}>{h.quality}</span>
                  </div>
                  <p className="text-amber-100/80 text-[11px] font-bold leading-relaxed">{h.desc}</p>
                  <div className="text-[11px] font-bold text-amber-300">
                    估价 {h.value.toLocaleString()} ₽ · 起拍 {lot.startPrice.toLocaleString()} ₽ · 一口价 {lot.buyout.toLocaleString()} ₽
                  </div>
                  {lot.status === 'open' && (
                    <div className="text-[11px] font-black text-white">
                      当前价 {lot.currentPrice.toLocaleString()} ₽ ·{' '}
                      {lot.leader === null ? '还没有人出价' : lot.leader === 'player' ? '你领先' : <span className="text-rose-300">其他竞买人领先</span>}
                    </div>
                  )}
                  {lot.status === 'open' ? (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => show(onAction(i, { type: 'raise', amount: min }))}
                          className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-black py-1.5 rounded-lg border-2 border-black cursor-pointer"
                        >
                          {lot.leader === null ? '起拍' : '加价'} {min.toLocaleString()} ₽
                        </button>
                        <button
                          onClick={() => show(onAction(i, { type: 'buyout' }))}
                          className="bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black py-1.5 rounded-lg border-2 border-black cursor-pointer"
                        >
                          一口价 {lot.buyout.toLocaleString()} ₽
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          value={bids[i] ?? ''}
                          onChange={(e) => setBids((b) => ({ ...b, [i]: e.target.value }))}
                          inputMode="numeric"
                          placeholder={`自定义出价，至少 ${min.toLocaleString()}`}
                          className="flex-1 min-w-0 bg-[#1a1410] text-white text-xs font-mono px-2 py-1.5 rounded-lg border border-black focus:outline-none focus:border-amber-400"
                        />
                        <button
                          onClick={() => show(onAction(i, { type: 'raise', amount: Number((bids[i] ?? '').replace(/[,\s_]/g, '')) }))}
                          className="bg-amber-200 hover:bg-amber-100 text-black text-xs font-black px-3 rounded-lg border-2 border-black cursor-pointer shrink-0"
                        >
                          出价
                        </button>
                        <button
                          onClick={() => show(onAction(i, { type: 'pass' }))}
                          className="bg-gray-600 hover:bg-gray-500 text-white text-xs font-black px-3 rounded-lg border-2 border-black cursor-pointer shrink-0"
                        >
                          放弃
                        </button>
                      </div>
                    </div>
                  ) : lot.status === 'won' ? (
                    <div className="text-emerald-300 text-xs font-black">🎉 以 {lot.paid?.toLocaleString()} ₽ 拍得，已收入家族传家宝</div>
                  ) : (
                    <div className="text-gray-400 text-xs font-black">已结束：被其他竞买人以 {lot.currentPrice.toLocaleString()} ₽ 拍走</div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
