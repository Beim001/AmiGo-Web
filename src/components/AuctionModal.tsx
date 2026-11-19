import React, { useState } from 'react';
import { ChevronLeft, Gavel, Ticket, Mail } from 'lucide-react';
import { Auction, heirloomById, QUALITY_STYLE, TICKET_PRICE, INVITE_REPUTATION, normalizeLot, minNextBid } from '../lib/heirlooms';
import { CURRENCY } from '../data/seasons';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('auction');
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
          <span className="font-black text-xl tracking-widest">{t('title')}</span>
        </div>
        <span className="ml-auto text-[11px] text-amber-200 font-black">{auction.year}.{auction.month < 10 ? `0${auction.month}` : auction.month}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="bg-[#2b2118] border-2 border-black rounded-2xl p-3 text-xs font-bold text-amber-100/90 space-y-1">
          <p>{t('rules')}</p>
          <p className="text-amber-300/80">{t('cash', { coins: coins.toLocaleString(), symbol: CURRENCY.symbol })}</p>
        </div>

        {!auction.admitted ? (
          <div className="bg-[#2b2118] border-2 border-amber-700 rounded-2xl p-4 text-center space-y-3">
            <Ticket size={36} className="mx-auto text-amber-400" />
            <p className="text-amber-100 text-sm font-black">{t('noInvite')}</p>
            <p className="text-amber-200/70 text-[11px] font-bold">{t('inviteRule', { reputation: INVITE_REPUTATION })}</p>
            <button
              onClick={() => show(onBuyTicket())}
              className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-black px-5 py-2 rounded-xl border-2 border-black shadow-[0_3px_0_#000] cursor-pointer"
            >
              {t('buyTicket', { price: TICKET_PRICE.toLocaleString(), symbol: CURRENCY.symbol })}
            </button>
          </div>
        ) : (
          <>
            {auction.invited && (
              <div className="bg-amber-900/40 border border-amber-600 rounded-xl px-3 py-2 text-[11px] font-black text-amber-200 flex items-center gap-1.5">
                <Mail size={13} /> {t('invited')}
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
                    {t('lotPrices', { value: h.value.toLocaleString(), start: lot.startPrice.toLocaleString(), buyout: lot.buyout.toLocaleString(), symbol: CURRENCY.symbol })}
                  </div>
                  {lot.status === 'open' && (
                    <div className="text-[11px] font-black text-white">
                      {t('currentPrice', { price: lot.currentPrice.toLocaleString(), symbol: CURRENCY.symbol })}{' '}
                      {lot.leader === null ? t('noBid') : lot.leader === 'player' ? t('youLead') : <span className="text-rose-300">{t('othersLead')}</span>}
                    </div>
                  )}
                  {lot.status === 'open' ? (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => show(onAction(i, { type: 'raise', amount: min }))}
                          className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-black py-1.5 rounded-lg border-2 border-black cursor-pointer"
                        >
                          {t(lot.leader === null ? 'openBid' : 'raise', { amount: min.toLocaleString(), symbol: CURRENCY.symbol })}
                        </button>
                        <button
                          onClick={() => show(onAction(i, { type: 'buyout' }))}
                          className="bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black py-1.5 rounded-lg border-2 border-black cursor-pointer"
                        >
                          {t('buyout', { amount: lot.buyout.toLocaleString(), symbol: CURRENCY.symbol })}
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          value={bids[i] ?? ''}
                          onChange={(e) => setBids((b) => ({ ...b, [i]: e.target.value }))}
                          inputMode="numeric"
                          placeholder={t('customBid', { min: min.toLocaleString() })}
                          className="flex-1 min-w-0 bg-[#1a1410] text-white text-xs font-mono px-2 py-1.5 rounded-lg border border-black focus:outline-none focus:border-amber-400"
                        />
                        <button
                          onClick={() => show(onAction(i, { type: 'raise', amount: Number((bids[i] ?? '').replace(/[,\s_]/g, '')) }))}
                          className="bg-amber-200 hover:bg-amber-100 text-black text-xs font-black px-3 rounded-lg border-2 border-black cursor-pointer shrink-0"
                        >
                          {t('bid')}
                        </button>
                        <button
                          onClick={() => show(onAction(i, { type: 'pass' }))}
                          className="bg-gray-600 hover:bg-gray-500 text-white text-xs font-black px-3 rounded-lg border-2 border-black cursor-pointer shrink-0"
                        >
                          {t('pass')}
                        </button>
                      </div>
                    </div>
                  ) : lot.status === 'won' ? (
                    <div className="text-emerald-300 text-xs font-black">{t('won', { paid: lot.paid?.toLocaleString(), symbol: CURRENCY.symbol })}</div>
                  ) : (
                    <div className="text-gray-400 text-xs font-black">{t('lost', { price: lot.currentPrice.toLocaleString(), symbol: CURRENCY.symbol })}</div>
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
