import React, { useState } from 'react';
import { Mail, CheckCircle2, RefreshCw, LogOut, Send, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getMe, resendVerification, AuthError } from '../lib/authClient';
import type { AppUser } from '../lib/bilibiliToy';

interface Props {
  user: AppUser;
  onVerified: (user: AppUser) => void;
  onLogout: () => void;
}

export const EmailVerificationScreen: React.FC<Props> = ({ user, onVerified, onLogout }) => {
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleCheckStatus = async () => {
    setChecking(true);
    setMsg(null);
    try {
      const latest = await getMe();
      if (!latest) {
        setMsg({ type: 'error', text: '登录已失效，请重新登录' });
      } else if (latest.emailVerified) {
        setMsg({ type: 'success', text: '🎉 邮箱已成功验证！正在进入游戏...' });
        setTimeout(() => onVerified(latest), 800);
      } else {
        setMsg({ type: 'error', text: '❌ 尚未检测到邮箱验证记录。请确认您已在接收到的邮件中点击了验证链接。' });
      }
    } catch {
      setMsg({ type: 'error', text: '检查状态失败，请检查网络后重试' });
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    setMsg(null);
    try {
      const res = await resendVerification();
      if (res.alreadyVerified) {
        setMsg({ type: 'success', text: '该邮箱已经验证过了，请点击「我已完成验证」进入游戏。' });
      } else {
        setMsg({ type: 'info', text: '✉️ 新的验证邮件已成功发送，请查收您的邮箱（含垃圾邮件箱）。' });
      }
    } catch (err) {
      if (err instanceof AuthError && err.code === 'TOO_MANY_REQUESTS') {
        setMsg({ type: 'error', text: '⚠️ 发送请求过于频繁，请稍等几分钟后再试。' });
      } else {
        setMsg({ type: 'error', text: '发送验证邮件失败，请检查网络后重试' });
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#13141c] flex items-center justify-center p-4 relative font-sans select-none overflow-y-auto">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="w-full max-w-md bg-[#1f212d] border-4 border-black rounded-3xl p-6 md:p-8 shadow-[0_12px_0_#000] relative z-10 space-y-6">
        
        {/* Header Badge & Icon */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-amber-400 border-4 border-black rounded-2xl mx-auto flex items-center justify-center shadow-[0_4px_0_#000] relative">
            <Mail size={40} className="text-black drop-shadow-md animate-pulse" />
            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-1 border-2 border-black">
              <ShieldCheck size={16} />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white tracking-wider drop-shadow-[0_2px_0_#000]">
            请验证您的电子邮箱
          </h2>
          <p className="text-xs text-gray-300 font-bold leading-relaxed px-2">
            为了保障您的资产与账号安全，需要验证邮箱后方可激活账号并进入游戏主页。
          </p>
        </div>

        {/* Email Highlight Box */}
        <div className="bg-[#15161f] border-2 border-yellow-500/50 rounded-2xl p-4 text-center space-y-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block">
            验证链接已发送至邮箱
          </span>
          <span className="text-yellow-400 font-mono font-black text-base break-all flex items-center justify-center gap-1.5">
            <Mail size={16} className="text-yellow-400 shrink-0" />
            {user.email || '您的注册邮箱'}
          </span>
        </div>

        {/* Feedback Message */}
        {msg && (
          <div className={`p-3.5 rounded-2xl border-2 font-bold text-xs flex items-start gap-2 shadow-[0_3px_0_#000] ${
            msg.type === 'success' 
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' 
              : msg.type === 'error'
              ? 'bg-rose-950/80 border-rose-500 text-rose-300'
              : 'bg-sky-950/80 border-sky-500 text-sky-300'
          }`}>
            {msg.type === 'success' && <CheckCircle2 size={18} className="shrink-0 text-emerald-400 mt-0.5" />}
            {msg.type === 'error' && <AlertTriangle size={18} className="shrink-0 text-rose-400 mt-0.5" />}
            {msg.type === 'info' && <Send size={18} className="shrink-0 text-sky-400 mt-0.5" />}
            <span className="leading-tight">{msg.text}</span>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-[#181924] border-2 border-black rounded-2xl p-3.5 text-xs text-gray-300 font-bold space-y-2">
          <div className="text-yellow-400 font-black text-xs flex items-center gap-1">
            <span>💡 简单验证步骤：</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-gray-400 text-[11px] leading-snug font-medium">
            <li>进入您上面的电子邮箱收件箱；</li>
            <li>找到来自 <span className="text-white font-bold">AmiGo</span> 的验证邮件；</li>
            <li>点击邮件中的官方验证链接；</li>
            <li>返回本页面，点击下方 <span className="text-yellow-300 font-bold">【我已完成邮箱验证】</span> 即可立即进入主页！</li>
          </ol>
        </div>

        {/* Control Buttons */}
        <div className="space-y-3 pt-1">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-sm py-3.5 rounded-2xl border-3 border-black shadow-[0_4px_0_#000] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw size={18} className={checking ? 'animate-spin' : ''} />
            <span>{checking ? '正在核对验证状态...' : '我已完成邮箱验证，进入主页'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleResendEmail}
              disabled={resending}
              className="bg-[#2a2c3a] hover:bg-[#34374a] text-yellow-300 font-black text-xs py-2.5 rounded-xl border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send size={14} className={resending ? 'animate-bounce' : ''} />
              <span>{resending ? '发送中...' : '重新发送邮件'}</span>
            </button>

            <button
              onClick={onLogout}
              className="bg-[#2a2c3a] hover:bg-rose-950 text-rose-300 font-black text-xs py-2.5 rounded-xl border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut size={14} />
              <span>更换/退出账号</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
