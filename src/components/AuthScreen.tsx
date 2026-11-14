import React, { useEffect, useState } from 'react';
import {
  Mail,
  Lock,
  User,
  LogIn,
  UserPlus,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { login, register, requestPasswordReset, resetPassword, translateAuthError, cacheUser } from '../lib/authClient';
import { getBilibiliUserProfile, AppUser } from '../lib/bilibiliToy';

export interface AuthScreenProps {
  onLoginSuccess: (user: AppUser) => void;
}

// 本机持久编号：B 站 SDK 未返回 toyOpenId 时，用它生成稳定的 B 站玩家 UID
const getLocalUid = (): string => {
  try {
    let local = localStorage.getItem('amigo_local_uid');
    if (!local) {
      local = String(Math.floor(10000000 + Math.random() * 90000000));
      localStorage.setItem('amigo_local_uid', local);
    }
    return local;
  } catch {
    return 'unknown';
  }
};

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 处理邮件链接带回来的参数：?reset_token=…（重置密码）、?verified=1 / ?verify_error=1（邮箱验证结果）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset_token');
    if (token) {
      setResetToken(token);
      setMode('reset');
    } else if (params.get('verified') === '1') {
      setSuccessMsg('🎉 邮箱验证成功！请登录进入游戏');
    } else if (params.get('verify_error') === '1') {
      setErrorMsg('验证链接无效或已过期，请登录后重新发送验证邮件');
    }
    if (token || params.has('verified') || params.has('verify_error')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const switchMode = (next: 'login' | 'register' | 'forgot') => {
    setMode(next);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('请填写电子邮箱与密码');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      setSuccessMsg('验证通过，欢迎回来！');
      setTimeout(() => onLoginSuccess(user), 600);
    } catch (err) {
      setErrorMsg(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('请填写电子邮箱与密码');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('密码长度不能少于 6 位');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('两次输入的密码不一致');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const user = await register(email, password, displayName.trim() || email.split('@')[0]);
      setSuccessMsg('账号注册成功！验证邮件已发送至您的邮箱，请去邮箱点击链接完成验证');
      setTimeout(() => onLoginSuccess(user), 600);
    } catch (err) {
      setErrorMsg(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBilibiliSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const { profile, isMock } = await getBilibiliUserProfile();
      const nickname = profile.nickname || 'B站玩家';
      const avatar = profile.avatar || '';
      // 以 toyOpenId 作为 B 站玩家的唯一身份；缺失时用本机持久编号，保证每次登录 UID 一致
      const appUser: AppUser = {
        uid: profile.toyOpenId || `bilibili_${getLocalUid()}`,
        displayName: nickname,
        photoURL: avatar,
        email: null,
        emailVerified: true,
        providerData: [{ providerId: 'bilibili' }],
        isBilibili: true,
        isMock,
      };
      cacheUser(appUser);
      try {
        if (avatar) localStorage.setItem('amigo_avatar_source', 'social');
      } catch {}
      setSuccessMsg(isMock ? `🎉 已接入哔哩哔哩体验账号：${nickname} (本地 Mock 模式)` : `🎉 哔哩哔哩授权成功，欢迎 ${nickname}！`);
      setTimeout(() => onLoginSuccess(appUser), 600);
    } catch (err: any) {
      setErrorMsg(err?.message || '哔哩哔哩登录授权失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('请输入注册时使用的电子邮箱');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSuccessMsg('如果该邮箱已注册，重置密码邮件已发送，请检查收件箱（含垃圾邮件箱）');
    } catch (err) {
      setErrorMsg(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) return;
    if (password.length < 6) {
      setErrorMsg('密码长度不能少于 6 位');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('两次输入的密码不一致');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      await resetPassword(resetToken, password);
      setResetToken(null);
      setPassword('');
      setConfirmPassword('');
      setMode('login');
      setSuccessMsg('密码已更新，请使用新密码登录');
    } catch (err) {
      setErrorMsg(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#1c1d25] flex justify-center font-sans overflow-hidden">
      {/* Container aligned with main game shell */}
      <div className="w-full h-full flex flex-col justify-center items-center relative shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-y-auto custom-scrollbar px-6 py-8">
        
        {/* Main Content Box styled to fill mobile viewport harmoniously */}
        <div className="w-full max-w-[380px] my-auto flex flex-col items-center py-2">
          
          {/* Title Header: AmiGo Lite in Red Handwritten Cursive Calligraphy Font */}
          <div className="text-center -mt-3 mb-4 sm:mb-5 select-none">
            <h1
              className={`font-amigo-title text-[#dc2626] font-bold tracking-normal leading-none filter drop-shadow-[0_5px_15px_rgba(220,38,38,0.4)] transition-all ${
                mode === 'register' ? 'text-5xl sm:text-6xl' : 'text-6xl sm:text-7xl'
              }`}
              style={{ fontStyle: 'normal' }}
            >
              AmiGo Lite
            </h1>
          </div>

          {/* Mode Switch Tabs (Game Arcade Style) */}
          <div className="w-full grid grid-cols-2 bg-[#12141c] p-1.5 rounded-2xl border-2 border-black shadow-[0_4px_0_#000] mb-5">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-amber-400 text-black border-2 border-black shadow-[0_2px_0_#000]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LogIn size={15} />
              <span>账号登录</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-amber-400 text-black border-2 border-black shadow-[0_2px_0_#000]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <UserPlus size={15} />
              <span>注册账号</span>
            </button>
          </div>

          {/* Error and Success Notifications */}
          {errorMsg && (
            <div className="w-full bg-red-950/90 border-2 border-red-500/80 text-red-200 p-2.5 rounded-xl text-xs font-bold flex items-start gap-2 mb-3 shadow-[0_2px_0_#000] animate-in fade-in duration-200">
              <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="w-full bg-emerald-950/90 border-2 border-emerald-500/80 text-emerald-200 p-2.5 rounded-xl text-xs font-bold flex items-start gap-2 mb-3 shadow-[0_2px_0_#000] animate-in fade-in duration-200">
              <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Bilibili Sign In Button */}
          <button
            type="button"
            onClick={handleBilibiliSignIn}
            disabled={loading}
            className="w-full bg-[#fb7299] hover:bg-[#ff85ad] text-white font-black text-xs py-2.5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 transition-all mb-2"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 1024 1024" fill="currentColor">
              <path d="M302.2 138.8c11.7-11.8 11.6-30.8-.2-42.5-11.8-11.7-30.8-11.6-42.5.2l-94.2 95.3c-11.7 11.8-11.6 30.8.2 42.5 11.8 11.7 30.8 11.6 42.5-.2l94.2-95.3zM722 138.8l94.2 95.3c11.8 11.8 30.8 11.9 42.5.2 11.8-11.7 11.9-30.7.2-42.5l-94.2-95.3c-11.7-11.8-30.7-11.9-42.5-.2-11.8 11.7-11.9 30.7-.2 42.5zM852 284H172c-55.2 0-100 44.8-100 100v412c0 55.2 44.8 100 100 100h680c55.2 0 100-44.8 100-100V384c0-55.2-44.8-100-100-100zM340 680c-33.1 0-60-26.9-60-60s26.9-60 60-60 60 26.9 60 60-26.9 60-60 60zm340 0c-33.1 0-60-26.9-60-60s26.9-60 60-60 60 26.9 60 60-26.9 60-60 60z" />
            </svg>
            <span>哔哩哔哩账号一键登录</span>
          </button>

          <div className="w-full flex items-center gap-3 my-1.5">
            <div className="flex-1 h-[2px] bg-gray-800"></div>
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">或</span>
            <div className="flex-1 h-[2px] bg-gray-800"></div>
          </div>

          {/* Main Input Form */}
          <form
            onSubmit={
              mode === 'login'
                ? handleLogin
                : mode === 'register'
                ? handleRegister
                : mode === 'forgot'
                ? handleRequestReset
                : handleSetNewPassword
            }
            className="w-full space-y-2.5 mt-1"
          >
            {/* Display Name Input (Register Mode Only) */}
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-[11px] font-black text-gray-300 block">玩家角色名：</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="请输入昵称"
                    className="w-full bg-[#12141c] text-white text-xs font-bold pl-9 pr-3 py-2.5 rounded-xl border-2 border-black focus:border-amber-400 focus:outline-none transition-all shadow-[0_2px_0_#000]"
                  />
                </div>
              </div>
            )}

            {mode === 'reset' && (
              <div className="text-xs font-black text-amber-300 text-center pb-1">设置新密码</div>
            )}

            {/* Email Input */}
            {mode !== 'reset' && (
            <div className="space-y-1">
              <label className="text-[11px] font-black text-gray-300 block">电子邮箱：</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-[#12141c] text-white text-xs font-bold pl-9 pr-3 py-2.5 rounded-xl border-2 border-black focus:border-amber-400 focus:outline-none transition-all shadow-[0_2px_0_#000]"
                />
              </div>
            </div>
            )}

            {/* Password Input */}
            {mode !== 'forgot' && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-gray-300">{mode === 'reset' ? '新密码：' : '密码：'}</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-[10px] text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      忘记密码？
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#12141c] text-white text-xs font-bold pl-9 pr-3 py-2.5 rounded-xl border-2 border-black focus:border-amber-400 focus:outline-none transition-all shadow-[0_2px_0_#000]"
                  />
                </div>
              </div>
            )}

            {/* Confirm Password (Register Mode Only) */}
            {(mode === 'register' || mode === 'reset') && (
              <div className="space-y-1">
                <label className="text-[11px] font-black text-gray-300 block">确认密码：</label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次确认密码"
                    className="w-full bg-[#12141c] text-white text-xs font-bold pl-9 pr-3 py-2.5 rounded-xl border-2 border-black focus:border-amber-400 focus:outline-none transition-all shadow-[0_2px_0_#000]"
                  />
                </div>
              </div>
            )}

            {/* Main Action Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-300 text-black font-black text-xs py-3 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 transition-all mt-3"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>处理中...</span>
                </>
              ) : mode === 'login' ? (
                <>
                  <LogIn size={15} />
                  <span>登录</span>
                </>
              ) : mode === 'register' ? (
                <>
                  <UserPlus size={15} />
                  <span>创建新账号</span>
                </>
              ) : mode === 'forgot' ? (
                <>
                  <Mail size={15} />
                  <span>发送重置密码邮件</span>
                </>
              ) : (
                <>
                  <KeyRound size={15} />
                  <span>保存新密码</span>
                </>
              )}
            </button>

            {(mode === 'forgot' || mode === 'reset') && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full text-center text-xs text-gray-400 font-bold hover:text-white pt-1.5 cursor-pointer block"
              >
                返回登录界面
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
