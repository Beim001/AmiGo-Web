import { KeyRound } from 'lucide-react';
import type { Cdkey } from './useCdkey';
import { CURRENCY } from '../../data/seasons';
import { CLOTHING_COUPON_USES } from '../../lib/clothingCoupon';
import { useTranslation } from 'react-i18next';

// 「礼包兑换」标签页



export const CdkeyTab = ({ cdkey }: { cdkey: Cdkey }) => {
  const { t } = useTranslation('profile');
  const { cdkeyInput, setCdkeyInput, handleRedeemCdkey } = cdkey;
  return (
    <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-yellow-400 rounded-xl border-2 border-black flex items-center justify-center shadow-[0_2px_0_#000] flex-shrink-0">
          <KeyRound size={26} className="text-black" />
        </div>
        <div>
          <h3 className="text-white font-black text-sm">{t('cdkey.title')}</h3>
          <p className="text-gray-300 text-xs font-bold mt-0.5">{t('cdkey.desc', { currency: CURRENCY.name })}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder={t('cdkey.placeholder')}
          value={cdkeyInput}
          onChange={(e) => setCdkeyInput(e.target.value)}
          className="flex-1 bg-[#21232e] text-white font-black text-xs px-3 py-2.5 rounded-xl border-2 border-black focus:border-yellow-400 focus:outline-none placeholder:text-gray-500 uppercase"
        />
        <button
          onClick={handleRedeemCdkey}
          className="bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black px-5 py-2.5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] cursor-pointer active:translate-y-0.5"
        >
          {t('cdkey.redeem')}
        </button>
      </div>

      <div className="bg-[#21232e] p-3 rounded-xl border border-black space-y-1.5">
        <div className="text-yellow-400 font-black text-xs">{t('cdkey.testCodes')}</div>
        <div className="text-gray-300 text-xs font-mono font-bold">· GIFT2026 : 50,000 {CURRENCY.name}</div>
        <div className="text-gray-300 text-xs font-mono font-bold">· 666666 : 50,000 {CURRENCY.name}</div>
        <div className="text-gray-300 text-xs font-mono font-bold">{t('cdkey.valentine')}</div>
        <div className="text-gray-300 text-xs font-mono font-bold">{t('cdkey.aminoac', { uses: CLOTHING_COUPON_USES })}</div>
      </div>
    </div>
  );
};
