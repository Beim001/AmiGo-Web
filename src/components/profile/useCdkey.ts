import { useState } from 'react';
import type React from 'react';
import { TEST_CODE, isBetaVersion } from '../../lib/testCode';
import { loadStored, saveStored } from '../../lib/storage';
import { CURRENCY } from '../../data/seasons';
import { CLOTHING_COUPON_CODE, CLOTHING_COUPON_USES, loadCouponLeft, saveCouponLeft } from '../../lib/clothingCoupon';

// 礼包码兑换：已兑换列表持久化；测试兑换码只在测试版本可用，可无限次兑换（第 57 题）
// Aminoac2026：前 3 次购买服饰享 7 折，剩余次数显示在「特权光环」

export const useCdkey = ({ setCoins, showToast, onRedeemTestCode }: {
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  showToast: (msg: string) => void;
  onRedeemTestCode?: () => string;
}) => {
  const [cdkeyInput, setCdkeyInput] = useState('');
  const [redeemedCodes, setRedeemedCodes] = useState<string[]>(() => loadStored<string[]>('amigo_redeemed_codes', []));
  const [couponLeft, setCouponLeft] = useState(loadCouponLeft);

  const markRedeemed = (code: string) => {
    const updatedCodes = [...redeemedCodes, code];
    setRedeemedCodes(updatedCodes);
    saveStored('amigo_redeemed_codes', updatedCodes);
    setCdkeyInput('');
  };

  const handleRedeemCdkey = () => {
    const code = cdkeyInput.trim().toUpperCase();
    if (!code) {
      showToast('请输入有效的礼包兑换码！');
      return;
    }
    // 测试兑换码：只在测试版本可用，可无限次兑换（第 57 题）
    if (code === TEST_CODE) {
      setCdkeyInput('');
      showToast(isBetaVersion() && onRedeemTestCode ? onRedeemTestCode() : '❌ 该兑换码只能在测试版本中使用');
      return;
    }
    if (redeemedCodes.includes(code)) {
      showToast('该兑换码已被使用过！');
      return;
    }

    if (code === CLOTHING_COUPON_CODE) {
      const left = loadCouponLeft() + CLOTHING_COUPON_USES;
      saveCouponLeft(left);
      setCouponLeft(left);
      markRedeemed(code);
      showToast(`🎟️ 兑换成功！接下来 ${CLOTHING_COUPON_USES} 次购买服饰享 7 折`);
    } else if (code === 'VALENTINE' || code === '2026' || code === '666666' || code === 'GIFT2026') {
      setCoins(prev => prev + 50000);
      markRedeemed(code);
      showToast(`🎉 兑换成功！获得 50,000 ${CURRENCY.name}！`);
    } else {
      showToast('❌ 无效的兑换码，请输入 GIFT2026 或 666666 试用');
    }
  };

  return { cdkeyInput, setCdkeyInput, handleRedeemCdkey, couponLeft, couponRedeemed: redeemedCodes.includes(CLOTHING_COUPON_CODE) };
};

export type Cdkey = ReturnType<typeof useCdkey>;
