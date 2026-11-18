import React from 'react';
import { RussianRuble, ChevronLeft, Shirt, Crown, Gift } from 'lucide-react';
import { CharacterAvatar } from './CharacterAvatar';
import { CLOTHING } from '../data/clothing';
import { Appearance, BARBER_PARTS, BARBER_COST, APPEARANCE_PARTS } from '../lib/appearance';
import { GiftInventory, GIFT_QUALITY_STYLE, addGifts } from '../lib/gifts';
import { drawGacha, hitLimitedPity, GACHA_PITY_KEY, INITIAL_PITY, PITY_RARE, PITY_LIMITED, RARITY_LABEL, PityState, Rarity } from '../lib/gacha';
import { unlockAchievement } from '../lib/achievements';
import { loadStored, saveStored } from '../lib/storage';

// 商城：抽卡（含保底与开箱动画，奖品为卢布、家族礼物与服饰）、服饰购买与穿戴、理发店

/** 单抽与十连抽价格（首次单抽免费） */
const SINGLE_DRAW_COST = 8000;
const TEN_DRAW_COST = 72000;

const RESULT_BUTTON =
  'bg-gradient-to-b from-[#ffe56c] to-[#f5b822] text-black font-black px-6 py-3 rounded-full border-4 border-black active:scale-95 shadow-[0_6px_0_#000] text-lg transition-transform disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center gap-1';

/** onDrawAgain(times)：按本次的抽数再抽一次；drawCost(times)：该抽数的费用；coins：当前现金 */
const ChestAnimation = ({ isDrawing, result, onComplete, onDrawAgain, drawCost, coins }: any) => {
  const [phase, setPhase] = React.useState<'closed' | 'opening' | 'rewards'>('closed');

  React.useEffect(() => {
    if (isDrawing && !result) {
      setPhase('closed');
    } else if (isDrawing && result) {
      setPhase('opening');
      const timer = setTimeout(() => {
        setPhase('rewards');
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setPhase('closed');
    }
  }, [isDrawing, result]);

  if (!isDrawing && !result) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center animate-in fade-in duration-300">
       {phase === 'closed' && (
          <div className="flex flex-col items-center justify-center animate-bounce">
             <div className="relative w-32 h-32">
                <div className="absolute inset-x-2 bottom-0 h-16 bg-[#b45309] rounded-b-xl border-4 border-black shadow-[0_4px_0_#000]"></div>
                <div className="absolute inset-x-0 top-6 h-12 bg-[#d97706] rounded-t-2xl border-4 border-black origin-bottom"></div>
                <div className="absolute left-1/2 top-14 -translate-x-1/2 w-6 h-8 bg-gray-300 border-2 border-black rounded-sm"></div>
             </div>
             <div className="text-yellow-400 mt-8 font-black tracking-widest text-2xl animate-pulse drop-shadow-[0_2px_0_#000]">开启宝箱中...</div>
          </div>
       )}

       {phase === 'opening' && (
          <div className="flex flex-col items-center justify-center fixed inset-0 z-50">
             <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-0 bg-yellow-100 animate-[pulse_1s_ease-in-out_infinite] opacity-50 z-10"></div>
                <div className="absolute bg-white rounded-full w-4 h-4 animate-[ping_1.5s_ease-out_forwards] z-20 scale-[150] opacity-100 mix-blend-screen"></div>
                <div className="w-[2500px] h-[2500px] flex-shrink-0 bg-[conic-gradient(from_0deg,transparent_0deg,#fde047_20deg,transparent_40deg,#fde047_60deg,transparent_80deg,#fde047_100deg,transparent_120deg,#fde047_140deg,transparent_160deg,#fde047_180deg,transparent_200deg,#fde047_220deg,transparent_240deg,#fde047_260deg,transparent_280deg,#fde047_300deg,transparent_320deg,#fde047_340deg,transparent_360deg)] animate-[spin_2s_linear_infinite] origin-center opacity-100 z-30"></div>
             </div>
             <div className="relative w-40 h-40 z-50 animate-in zoom-in duration-300">
                <div className="absolute inset-x-2 bottom-0 h-20 bg-[#b45309] rounded-b-xl border-4 border-black shadow-[0_4px_0_#000]"></div>
                <div className="absolute inset-x-0 top-0 h-16 bg-[#d97706] rounded-t-2xl border-4 border-black -rotate-12 origin-bottom-right -translate-y-8 translate-x-4"></div>
                <div className="absolute inset-0 flex items-center justify-center bottom-10">
                   <div className="w-64 h-64 bg-white rounded-full blur-[40px] animate-pulse opacity-100"></div>
                </div>
             </div>
             <div className="absolute bottom-32 text-white font-black tracking-widest text-4xl drop-shadow-[0_0_20px_#facc15] z-50">金色传说！</div>
          </div>
       )}

       {phase === 'rewards' && result && (
          <div className="flex flex-col items-center w-full max-w-md px-4 animate-in zoom-in duration-500 z-50">
             <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none opacity-50 z-0">
                <div className="w-[2500px] h-[2500px] flex-shrink-0 bg-[conic-gradient(from_0deg,transparent_0deg,#fde047_20deg,transparent_40deg,#fde047_60deg,transparent_80deg,#fde047_100deg,transparent_120deg,#fde047_140deg,transparent_160deg,#fde047_180deg,transparent_200deg,#fde047_220deg,transparent_240deg,#fde047_260deg,transparent_280deg,#fde047_300deg,transparent_320deg,#fde047_340deg,transparent_360deg)] animate-[spin_10s_linear_infinite] origin-center"></div>
                <div className="absolute inset-0 bg-yellow-300/30 blur-2xl"></div>
             </div>

             <div className="text-yellow-300 font-black text-4xl mb-8 tracking-wider drop-shadow-[0_4px_0_#000] z-10">获得奖励</div>

             <div className={`grid ${result.length > 1 ? 'grid-cols-5 gap-3' : 'grid-cols-1 gap-6'} w-full z-10`}>
                {result.map((item: any, idx: number) => (
                  <div key={idx} className="flex flex-col items-center animate-in slide-in-from-bottom-8 fade-in" style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}>
                     <div className={`${result.length > 1 ? 'w-14 h-14 border-2' : 'w-24 h-24 border-4'} bg-gradient-to-b from-yellow-100 to-yellow-400 rounded-xl flex items-center justify-center border-white shadow-[0_0_15px_#fde047] relative overflow-hidden`}>
                        {item.type === 'coin' ? (
                          <RussianRuble size={result.length > 1 ? 32 : 50} className="text-yellow-600 drop-shadow-md" strokeWidth={2.5} />
                        ) : item.type === 'gift' ? (
                          <Gift size={result.length > 1 ? 32 : 50} className="text-rose-600 drop-shadow-md" strokeWidth={2.5} />
                        ) : (
                          <Shirt size={result.length > 1 ? 32 : 50} className="text-purple-600 drop-shadow-md" strokeWidth={2.5} />
                        )}
                        {item.type !== 'coin' && <div className="absolute -top-1 -right-1 text-xs">✨</div>}
                     {item.type === 'gift' && (
                       <div className={`absolute bottom-0 inset-x-0 text-center font-black ${result.length > 1 ? 'text-[7px]' : 'text-[10px]'} ${GIFT_QUALITY_STYLE[item.quality as keyof typeof GIFT_QUALITY_STYLE]}`}>
                         礼物·{item.quality}
                       </div>
                     )}
                     {item.rarity && (
                       <div className={`absolute bottom-0 inset-x-0 text-center font-black ${result.length > 1 ? 'text-[7px]' : 'text-[10px]'} ${RARITY_STYLE[item.rarity as Rarity].badge}`}>
                         {RARITY_LABEL[item.rarity as Rarity]}{item.isPity ? '·保底' : ''}
                       </div>
                     )}
                     </div>
                     {result.length === 1 && (
                       <div className="text-white font-bold text-lg mt-3 text-center bg-black/50 px-3 py-1 rounded-full border border-gray-600">
                         {item.name}
                       </div>
                     )}
                     {result.length > 1 && item.type !== 'coin' && (
                       <div className={`text-white font-bold text-[9px] mt-1 text-center ${item.type === 'gift' ? 'bg-rose-600/80' : 'bg-purple-600/80'} px-1 py-0.5 rounded shadow-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-full`}>
                         {item.name}
                       </div>
                     )}
                     {result.length > 1 && item.type === 'coin' && (
                       <div className="text-yellow-300 font-bold text-[10px] mt-1 text-center shadow-sm">
                         {item.amount.toLocaleString()}
                       </div>
                     )}
                  </div>
                ))}
             </div>

             {(() => {
               const times = result.length > 1 ? 10 : 1;
               const cost: number = drawCost(times);
               const label = times === 10 ? '再来十连' : '再来一次';
               return (
                 <div className="mt-12 flex items-stretch justify-center gap-3 z-10">
                   <button onClick={onComplete} className={RESULT_BUTTON}>
                     收下奖励
                   </button>
                   <button onClick={() => onDrawAgain(times)} disabled={coins < cost} className={RESULT_BUTTON}>
                     {label}
                     {cost > 0 && (
                       <span className="text-[11px] flex items-center gap-0.5">
                         <RussianRuble size={12} />
                         {cost.toLocaleString()}
                       </span>
                     )}
                   </button>
                 </div>
               );
             })()}
          </div>
       )}
    </div>
  );
};

// 品质显示样式（与宝箱文案配色一致：高级蓝、稀有紫、限定橙）
const RARITY_STYLE: Record<Rarity, { text: string; badge: string }> = {
  advanced: { text: 'text-blue-300', badge: 'bg-blue-600 text-white' },
  rare: { text: 'text-purple-300', badge: 'bg-purple-600 text-white' },
  limited: { text: 'text-orange-300', badge: 'bg-orange-500 text-black' },
};

// 商城服饰（不含初始服装 default）；品质暂按售价划分
// 商城服饰：来自服装目录（第 61 题，19 世纪风格），卡片图标为穿着该服装的角色缩略图
const RARITY_BG: Record<Rarity, { bg: string; iconBg: string }> = {
  advanced: { bg: 'bg-[#b4f0c0]', iconBg: 'bg-[#e2e8f0]' },
  rare: { bg: 'bg-[#c8e8ff]', iconBg: 'bg-[#dbeafe]' },
  limited: { bg: 'bg-[#fde68a]', iconBg: 'bg-[#fef3c7]' },
};
const SHOP_ITEMS: Array<{ id: string; name: string; effect: string; currency: string; price: number; rarity: Rarity; icon: React.ReactNode; bg: string; iconBg: string }> = CLOTHING.map((c) => ({
  id: c.id,
  name: c.name,
  effect: c.effect,
  currency: 'coin',
  price: c.price,
  rarity: c.rarity,
  icon: (
    <div className="absolute inset-0">
      <CharacterAvatar clothing={c.id} />
    </div>
  ),
  ...RARITY_BG[c.rarity],
}));

// 可拥有的服装总数 = 初始服装 + 商城服饰
export const TOTAL_CLOTHING_COUNT = SHOP_ITEMS.length + 1;

export const ShopModal = ({
  onClose,
  coins,
  setCoins,
  ownedClothes,
  setOwnedClothes,
  equippedClothing,
  setEquippedClothing,
  freeDrawUsed,
  setFreeDrawUsed,
  setGiftInventory,
  appearance,
  setAppearance,
  playerAge,
  playerGender,
  isRegistered,
}: any) => {
  // 理发店（第 61 题）：只能改发型、发色、胡子
  const [barberDraft, setBarberDraft] = React.useState<Appearance | null>(appearance ?? null);
  const barberChanged = !!(appearance && barberDraft && BARBER_PARTS.some((k) => barberDraft[k] !== appearance[k]));



  const [isDrawing, setIsDrawing] = React.useState(false);
  const [drawResult, setDrawResult] = React.useState<any | null>(null);
  const [shopToast, setShopToast] = React.useState<string | null>(null);
  const [pity, setPity] = React.useState<PityState>(() => loadStored(GACHA_PITY_KEY, INITIAL_PITY));
  React.useEffect(() => saveStored(GACHA_PITY_KEY, pity), [pity]);

  const showShopToast = (msg: string) => {
    setShopToast(msg);
    setTimeout(() => setShopToast((prev) => (prev === msg ? null : prev)), 2500);
  };

  const drawCost = (times: number) => (times === 1 ? (freeDrawUsed ? SINGLE_DRAW_COST : 0) : TEN_DRAW_COST);

  const handleDraw = (times: number) => {
    const cost = drawCost(times);

    if (coins < cost) {
      showShopToast(`现金不足！需要 ${cost.toLocaleString()} ₽`);
      return;
    }

    if (cost > 0) setCoins((prev: number) => prev - cost);
    if (times === 1 && !freeDrawUsed) setFreeDrawUsed(true);

    setIsDrawing(true);
    setDrawResult(null);

    // 在点击时按当前保底计数抽取结果；开箱动画结束后再发放奖励
    const { rewards, pity: nextPity } = drawGacha(times, SHOP_ITEMS, ownedClothes, pity);
    setPity(nextPity);

    setTimeout(() => {
      const newClothes = rewards.flatMap((r) => (r.type === 'clothing' ? [r.id] : []));
      if (newClothes.length > 0) {
        setOwnedClothes((prev: string[]) => [...prev, ...newClothes]);
      }

      const newGifts = rewards.flatMap((r) => (r.type === 'gift' ? [r.id] : []));
      if (newGifts.length > 0) {
        setGiftInventory((prev: GiftInventory) => addGifts(prev, newGifts));
      }

      const totalCoins = rewards.reduce((sum, r) => sum + (r.type === 'coin' ? r.amount : 0), 0);
      if (totalCoins > 0) {
        setCoins((prev: number) => prev + totalCoins);
      }

      setDrawResult(rewards);
      if (hitLimitedPity(rewards)) unlockAchievement('pity_limited');
    }, 1500);
  };

  return (
    <div className="absolute inset-0 bg-[#252632] flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-200">
      {shopToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-yellow-300 border-2 border-yellow-500 text-xs font-black px-4 py-2 rounded-xl shadow-[0_4px_0_#000] animate-in fade-in slide-in-from-top-2 duration-200 text-center max-w-[85%]">
          {shopToast}
        </div>
      )}
      <div className="relative w-full h-16 z-20 drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] flex-shrink-0">
        <div className="absolute inset-0 flex">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? 'bg-[#0f4b99]' : 'bg-[#1553a6]'} relative`}>
               <div className={`absolute -bottom-4 left-0 w-full h-8 rounded-b-full ${i % 2 === 0 ? 'bg-[#0f4b99]' : 'bg-[#1553a6]'}`}></div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center px-4 pt-1 z-30">
          <button onClick={onClose} className="p-1.5 bg-[#0f4b99] border-2 border-[#072a66] rounded-xl active:scale-95 shadow-[0_2px_0_#072a66]">
            <ChevronLeft size={24} className="text-white drop-shadow-md" strokeWidth={3} />
          </button>
          <div className="absolute inset-0 pt-1 flex justify-center items-center pointer-events-none">
             <span className="text-white text-3xl font-black tracking-widest" style={{ textShadow: '-2px -2px 0 #072a66, 2px -2px 0 #072a66, -2px 2px 0 #072a66, 2px 2px 0 #072a66, 0 4px 6px rgba(0,0,0,0.6)' }}>
               商城
             </span>
          </div>
          {/* 右上角金钱余额 */}
          <div
            className="ml-auto relative flex items-center bg-[#1b1c25] rounded-full pl-1 pr-2.5 py-1 border-2 border-black shadow-[0_2px_0_#072a66]"
            title="当前现金余额"
          >
            <div className="w-5 h-5 bg-yellow-400 rounded-full border border-yellow-700 flex justify-center items-center mr-1">
              <RussianRuble size={13} className="text-yellow-700" strokeWidth={3} />
            </div>
            <span className="font-black text-white text-xs font-mono">{coins.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6 pt-8">
        <div className="px-4">
          <div className="flex justify-center">
            <div className="bg-[#2d2f3d] text-center text-gray-300 py-1 px-12 rounded-full text-sm font-bold border-2 border-black shadow-[0_2px_0_#000]">
              限定宝箱
            </div>
          </div>

          <div className="bg-gradient-to-b from-[#b86df5] to-[#f48cfb] p-3 rounded-2xl border-4 border-black shadow-[0_4px_0_#000] relative mt-4">
            <div className="flex gap-2 relative z-10">
               <div className="w-24 h-24 relative flex-shrink-0">
                 <div className="absolute inset-0 bg-[#8c33de] border-4 border-[#6920ad] rotate-12 rounded-xl opacity-80 shadow-lg"></div>
                 <div className="absolute inset-0 bg-[#a64ff2] border-4 border-white -rotate-6 rounded-xl flex items-center justify-center z-10 shadow-lg">
                   <Crown size={36} className="text-white fill-white drop-shadow-md" />
                 </div>
               </div>
               <div className="flex-1 pt-1 z-10">
                 <h3 className="text-white text-3xl font-black drop-shadow-[0_2px_0_#000] leading-none mb-2 text-right tracking-wider">限定宝箱</h3>
                 <p className="text-white text-[10px] text-right font-extrabold drop-shadow-[0_1px_0_#000] leading-tight mt-1">
                   每抽获得 1,000 卢布、<span className="text-rose-200">家族礼物</span>，或<br/><span className="text-blue-300">高级</span>、<span className="text-purple-300">稀有</span>、<span className="text-orange-300">限定</span>服饰
                 </p>
                 <div className="flex flex-col items-end mt-2 gap-1.5">
                   <div className="bg-[#c85ce6] border-2 border-[#9438ad] text-white text-[10px] px-3 py-0.5 rounded-full font-bold shadow-sm">
                     9次内必得<span className="text-blue-300 ml-1">稀有</span>服饰
                     <span className="ml-1 text-yellow-200">· 还剩 {PITY_RARE - pity.sinceRare} 次</span>
                   </div>
                   <div className="bg-[#c85ce6] border-2 border-[#9438ad] text-white text-[10px] px-3 py-0.5 rounded-full font-bold shadow-sm">
                     99次内必得<span className="text-orange-300 ml-1">限定</span>服饰
                     <span className="ml-1 text-yellow-200">· 还剩 {PITY_LIMITED - pity.sinceLimited} 次</span>
                   </div>
                 </div>
               </div>
            </div>

            <div className="flex gap-3 mt-4 relative z-10">
              <button onClick={() => handleDraw(1)} className="flex-1 bg-gradient-to-b from-[#ffe56c] to-[#f5b822] border-2 border-black rounded-xl py-1.5 flex flex-col items-center shadow-[0_4px_0_#000] active:translate-y-1 active:shadow-none transition-all">
                 <span className="text-black font-black text-sm">抽1次</span>
                 <span className="text-[#a46914] font-bold text-[10px] flex items-center gap-1">
                    {!freeDrawUsed ? '首次免费' : <><RussianRuble size={10} className="text-[#a46914]"/> x{SINGLE_DRAW_COST}</>}
                 </span>
              </button>
              <button onClick={() => handleDraw(10)} className="flex-1 bg-gradient-to-b from-[#ffe56c] to-[#f5b822] border-2 border-black rounded-xl py-1.5 flex flex-col items-center shadow-[0_4px_0_#000] active:translate-y-1 active:shadow-none transition-all">
                 <span className="text-black font-black text-sm">抽10次</span>
                 <span className="text-[#a46914] font-bold text-[10px] flex items-center gap-1">
                    <RussianRuble size={10} className="text-[#a46914]"/> x{TEN_DRAW_COST}
                 </span>
              </button>
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <div className="bg-[#2d2f3d] text-center text-gray-300 py-1 px-12 rounded-full text-sm font-bold border-2 border-black shadow-[0_2px_0_#000]">
              服饰商城
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            {SHOP_ITEMS.map(item => {
              const isOwned = ownedClothes.includes(item.id);
              const isEquipped = equippedClothing === item.id;

              const handleAction = () => {
                if (isEquipped) return;
                if (isOwned) {
                  setEquippedClothing(item.id);
                } else {
                  if (item.currency === 'coin' && coins >= item.price) {
                    setCoins((prev: number) => prev - item.price);
                    setOwnedClothes((prev: string[]) => [...prev, item.id]);
                    setEquippedClothing(item.id);
                  } else {
                    showShopToast(`余额不足！需要 ${item.price.toLocaleString()} ₽`);
                  }
                }
              };

              return (
                <div key={item.id} className={`${item.bg} border-2 border-black rounded-xl p-2 flex flex-col items-center shadow-[0_4px_0_#000] h-36`}>
                  <span className="text-[#1f5c2b] text-[10px] font-black whitespace-nowrap mb-0.5 flex items-center gap-1">
                    <span className={`${RARITY_STYLE[item.rarity].badge} text-[8px] px-1 rounded border border-black leading-tight`}>{RARITY_LABEL[item.rarity]}</span>
                    {item.name}
                  </span>
                  <div className="w-14 h-14 bg-[#5eb46d] rounded-lg border-2 border-black my-1 flex justify-center items-center relative overflow-hidden shrink-0">
                     <div className={`absolute inset-0 ${item.iconBg}`}></div>
                     {item.icon}
                  </div>
                  <span className="text-black text-[10px] font-bold mb-1">{item.effect}</span>
                  <button
                    onClick={handleAction}
                    className={`w-full mt-auto bg-gradient-to-b ${isEquipped ? 'from-[#a1a1aa] to-[#71717a] text-white' : 'from-[#ffe56c] to-[#f5b822] text-black'} border-2 border-black font-black text-[11px] py-1 rounded-lg shadow-[0_2px_0_#000] active:translate-y-1 active:shadow-none flex justify-center items-center`}
                  >
                     {isEquipped ? '已穿戴' : isOwned ? '穿戴' : (
                       <>
                         <RussianRuble size={12} className="text-yellow-700 mr-0.5 stroke-[3]"/>
                         {item.price}
                       </>
                     )}
                  </button>
                </div>
              );
            })}
          </div>
          {isRegistered && appearance && barberDraft && (
            <>
              <div className="flex justify-center mt-6">
                <div className="bg-[#2d2f3d] text-center text-gray-300 py-1 px-12 rounded-full text-sm font-bold border-2 border-black shadow-[0_2px_0_#000]">
                  理发店
                </div>
              </div>
              <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3 mt-4 shadow-[0_4px_0_#000] flex gap-3">
                <div className="w-24 h-28 bg-[#21232e] rounded-xl border border-black relative shrink-0">
                  <CharacterAvatar clothing={equippedClothing} appearance={barberDraft} age={playerAge} gender={playerGender} />
                </div>
                <div className="flex-1 space-y-1.5">
                  {APPEARANCE_PARTS.filter((p) => BARBER_PARTS.includes(p.key) && (p.key !== 'beard' || playerGender === '男')).map((p) => (
                    <div key={p.key} className="flex items-center gap-1 text-xs font-black text-white">
                      <span className="w-8 text-gray-400">{p.label}</span>
                      <button
                        onClick={() => setBarberDraft((d) => (d ? { ...d, [p.key]: (d[p.key] - 1 + p.options.length) % p.options.length } : d))}
                        className="px-2 bg-[#21232e] rounded border border-black cursor-pointer"
                      >
                        ◀
                      </button>
                      <span className="flex-1 text-center">{p.options[barberDraft[p.key]]}</span>
                      <button
                        onClick={() => setBarberDraft((d) => (d ? { ...d, [p.key]: (d[p.key] + 1) % p.options.length } : d))}
                        className="px-2 bg-[#21232e] rounded border border-black cursor-pointer"
                      >
                        ▶
                      </button>
                    </div>
                  ))}
                  <button
                    disabled={!barberChanged}
                    onClick={() => {
                      if (coins < BARBER_COST) {
                        showShopToast(`余额不足！理发需要 ${BARBER_COST} ₽`);
                        return;
                      }
                      setCoins((prev: number) => prev - BARBER_COST);
                      setAppearance({ ...appearance, hair: barberDraft.hair, hairColor: barberDraft.hairColor, beard: barberDraft.beard, preset: undefined });
                      showShopToast(`💇 理发完成（-${BARBER_COST} ₽）`);
                      unlockAchievement('makeover');
                    }}
                    className="w-full bg-gradient-to-b from-[#ffe56c] to-[#f5b822] text-black text-xs font-black py-1.5 rounded-lg border-2 border-black shadow-[0_2px_0_#000] disabled:opacity-40 cursor-pointer"
                  >
                    理发 {BARBER_COST} ₽
                  </button>
                  <div className="text-[9px] text-gray-400 font-bold">五官与肤色是天生的，只能改发型、发色和胡子。</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {(isDrawing || drawResult) && (
        <ChestAnimation
          isDrawing={isDrawing}
          result={drawResult}
          onComplete={() => {
            setIsDrawing(false);
            setDrawResult(null);
          }}
          drawCost={drawCost}
          coins={coins}
          onDrawAgain={(times: number) => {
            // 奖励已在开箱动画结束时发放，可以直接按同样的抽数再抽一次
            setDrawResult(null);
            handleDraw(times);
          }}
        />
      )}
    </div>
  );
};
