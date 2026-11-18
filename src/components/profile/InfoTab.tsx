import { Shield, Award, Sparkles, Ticket } from 'lucide-react';
import { traitNames, traitById } from '../../lib/traits';
import { reputationLevel } from '../../lib/reputation';
import { JOB_POSITIONS } from '../JobModal';
import type { ProfileModalProps } from '../ProfileModal';
import { CURRENCY } from '../../data/seasons';
import { CLOTHING_COUPON_USES } from '../../lib/clothingCoupon';

// 「名片资料」标签页：身份履历、特质与声望（含慈善捐款）、特权光环
// 特权光环只列出实际生效的特权（原先写死的「贵族礼遇 9 折」「天才推演 战斗爆伤」都没有实际效果，已移除）

export type JobPosition = (typeof JOB_POSITIONS)[number];

interface InfoTabProps extends Pick<ProfileModalProps, 'originLabel' | 'playerTraits' | 'reputation' | 'onDonate'> {
  currentJob: JobPosition | null;
  propertySummary: string | null;
  showToast: (msg: string) => void;
  /** Aminoac2026 服饰 7 折剩余次数 */
  couponLeft: number;
  couponRedeemed: boolean;
}

export const InfoTab = ({ originLabel, currentJob, propertySummary, playerTraits, reputation, onDonate, showToast, couponLeft, couponRedeemed }: InfoTabProps) => {
  return (
    <div className="space-y-3">
      <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000]">
        <h3 className="text-white font-black text-sm mb-3 flex items-center gap-2 border-b border-gray-700/80 pb-2">
          <Shield size={16} className="text-yellow-400" /> 身份履历与特权
        </h3>

        <div className="space-y-2.5 text-xs font-bold">
          <div className="flex justify-between items-center bg-[#21232e] p-2.5 rounded-xl border border-black">
            <span className="text-gray-400">出身背景</span>
            <span className="text-white font-black">{originLabel || '卡罗尼亚帝国'}</span>
          </div>
          <div className="flex justify-between items-center bg-[#21232e] p-2.5 rounded-xl border border-black">
            <span className="text-gray-400">毕业院校</span>
            <span className="text-gray-500 font-black">暂无学历（教育学府即将开放）</span>
          </div>
          <div className="flex justify-between items-center bg-[#21232e] p-2.5 rounded-xl border border-black">
            <span className="text-gray-400">当前主业</span>
            <span className={currentJob ? 'text-sky-300 font-black' : 'text-gray-500 font-black'}>
              {currentJob ? `${currentJob.department} · ${currentJob.title}` : '待业中'}
            </span>
          </div>
          <div className="flex justify-between items-center bg-[#21232e] p-2.5 rounded-xl border border-black">
            <span className="text-gray-400">持有地产</span>
            <span className={propertySummary ? 'text-emerald-400 font-black text-right' : 'text-gray-500 font-black'}>
              {propertySummary || '暂无房产'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000] space-y-3">
        <h3 className="text-white font-black text-sm flex items-center gap-2 border-b border-gray-700/80 pb-2">
          <Sparkles size={16} className="text-fuchsia-400" /> 特质与声望
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {playerTraits.length > 0 ? (
            playerTraits.map((id) => (
              <span key={id} className="bg-fuchsia-500/20 text-fuchsia-200 text-[11px] font-black px-2 py-1 rounded-lg border border-fuchsia-500/50">
                ✦ {traitNames([id])[0]}
                <span className="text-fuchsia-300/70 font-bold ml-1">{traitById(id)?.desc}</span>
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-xs font-bold">出生登记后获得 1–3 个随机特质</span>
          )}
        </div>
        <div className="bg-[#21232e] p-2.5 rounded-xl border border-black text-xs font-bold space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">声望</span>
            <span className="text-yellow-400 font-black">{reputation} / 100 · {reputationLevel(reputation)}</span>
          </div>
          <div className="text-[10px] text-gray-400">慈善捐款：每 10,000 {CURRENCY.symbol} 声望 +1，每个游戏月最多 +5</div>
          <div className="grid grid-cols-3 gap-1.5">
            {[10000, 50000, 100000].map((amt) => (
              <button
                key={amt}
                onClick={() => showToast(onDonate(amt))}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black py-1.5 rounded-lg border border-black cursor-pointer"
              >
                捐 {amt / 10000} 万
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000]">
        <h3 className="text-white font-black text-sm mb-3 flex items-center gap-2 border-b border-gray-700/80 pb-2">
          <Award size={16} className="text-purple-400" /> 特权光环
        </h3>
        {couponRedeemed || couponLeft > 0 ? (
          <div className="bg-[#21232e] p-2.5 rounded-xl border border-black flex items-center gap-2">
            <Ticket size={20} className={`${couponLeft > 0 ? 'text-yellow-400' : 'text-gray-600'} flex-shrink-0`} />
            <div>
              <div className={`${couponLeft > 0 ? 'text-white' : 'text-gray-500'} font-black text-xs`}>Aminoac2026 服饰礼遇</div>
              <div className="text-gray-400 text-[10px]">
                {couponLeft > 0 ? `购买服饰享 7 折 · 还剩 ${couponLeft} / ${CLOTHING_COUPON_USES} 次` : `${CLOTHING_COUPON_USES} 次 7 折已用完`}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-xs font-bold">暂无特权，可在「礼包兑换」输入礼包码获得</div>
        )}
      </div>
    </div>
  );
};
