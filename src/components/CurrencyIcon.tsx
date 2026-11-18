import { PoundSterling, RussianRuble, type LucideProps } from 'lucide-react';
import { CURRENCY } from '../data/seasons';

/** 当前赛季货币的图标（第 75 题）：卢布赛季显示卢布图标，诺镑赛季显示英镑样式图标 */
export const CurrencyIcon = (props: LucideProps) => (CURRENCY.icon === 'pound' ? <PoundSterling {...props} /> : <RussianRuble {...props} />);
