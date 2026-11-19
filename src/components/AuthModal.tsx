import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Sparkles,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { login, register, requestPasswordReset, translateAuthError, cacheUser } from '../lib/authClient';
import { getBilibiliUserProfile, AppUser } from '../lib/bilibiliToy';
import { useTranslation } from 'react-i18next';

export interface AuthModalProps {
  onClose: () => void;
  /** 当前登录用户（由 App 传入） */
  currentUser: AppUser | null;
  onUserChange?: (user: AppUser | null) => void;
  setPlayerName?: React.Dispatch<React.SetStateAction<string>>;
  /** 退出登录（由 App 负责同步存档、清理本地数据） */
  onLogout: () => Promise<void> | void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  currentUser,
  onUserChange,
  setPlayerName,
  onLogout,
}) => {
  const { t } = useTranslation('auth');
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const applyUser = (user: AppUser) => {
    cacheUser(user);
    onUserChange?.(user);
    if (setPlayerName && (user.displayName || user.email)) {
      setPlayerName(user.displayName || user.email?.split('@')[0] || t('modal.defaultPlayerName'));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg(t('modal.credentialsIncomplete'));
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      setSuccessMsg(t('modal.loginSuccess', { name: user.displayName || user.email }));
      applyUser(user);
      setTimeout(onClose, 1200);
    } catch (err) {
      setErrorMsg(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg(t('modal.credentialsRequired'));
      return;
    }
    if (password.length < 6) {
      setErrorMsg(t('validation.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t('validation.passwordMismatch'));
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const user = await register(email, password, displayName.trim() || email.split('@')[0]);
      setSuccessMsg(t('modal.registerSuccess'));
      applyUser(user);
      setTimeout(onClose, 1200);
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
      const nickname = profile.nickname || t('bilibili.defaultNickname');
      const avatar = profile.avatar || '';
      let localUid = 'unknown';
      try {
        localUid = localStorage.getItem('amigo_local_uid') || String(Math.floor(10000000 + Math.random() * 90000000));
        localStorage.setItem('amigo_local_uid', localUid);
        if (avatar) localStorage.setItem('amigo_avatar_source', 'social');
      } catch {}
      const appUser: AppUser = {
        uid: profile.toyOpenId || `bilibili_${localUid}`,
        displayName: nickname,
        photoURL: avatar,
        email: null,
        emailVerified: true,
        providerData: [{ providerId: 'bilibili' }],
        isBilibili: true,
        isMock,
      };
      applyUser(appUser);
      setSuccessMsg(isMock ? t('bilibili.mockSuccess', { nickname }) : t('bilibili.success', { nickname }));
      setTimeout(onClose, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || t('bilibili.failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg(t('validation.resetEmailRequired'));
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSuccessMsg(t('modal.resetMailSent'));
    } catch (err) {
      setErrorMsg(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await onLogout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-[#1e2330] border-2 border-black rounded-3xl w-full max-w-md overflow-hidden shadow-[0_8px_0_#000] relative text-white">
        {/* Header */}
        <div className="bg-[#252a3a] border-b-2 border-black p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-400 text-black rounded-xl border-2 border-black shadow-[0_2px_0_#000]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-black text-base text-white">{t('modal.title')}</h3>
              <p className="text-[10px] text-gray-400">{t('modal.subtitle')}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-[#12141c] hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl border-2 border-black cursor-pointer active:translate-y-0.5 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-4 bg-[#181a24]">
          {/* Current User Card if Logged In */}
          {currentUser ? (
            <div className="bg-[#232635] border-2 border-black rounded-2xl p-4 shadow-[0_3px_0_#000] space-y-3">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="Avatar"
                    className="w-12 h-12 rounded-xl border-2 border-black object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-amber-400 border-2 border-black flex items-center justify-center text-black font-black text-xl shadow-[0_2px_0_#000]">
                    {(currentUser.displayName || currentUser.email || 'A')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm text-white truncate">
                      {currentUser.displayName || t('modal.verifiedUser')}
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <CheckCircle2 size={10} />
                      <span>{t('modal.online')}</span>
                    </span>
                  </div>
                  <div className="text-gray-400 text-xs font-mono truncate mt-0.5">
                    {currentUser.email || t('modal.anonymousLogin')}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1 font-mono">
                    {t('modal.uid', { uid: currentUser.uid.slice(0, 12) })}
                  </div>
                </div>
              </div>

              {successMsg && (
                <div className="bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 p-2.5 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border-2 border-black font-black text-xs py-2.5 rounded-xl shadow-[0_2px_0_#000] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                <LogOut size={16} />
                <span>{t('modal.logout')}</span>
              </button>
            </div>
          ) : (
            <>
              {/* Mode Toggle Switch */}
              <div className="grid grid-cols-2 bg-[#12141c] p-1 rounded-2xl border-2 border-black shadow-[0_2px_0_#000]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === 'login'
                      ? 'bg-amber-400 text-black border-2 border-black shadow-[0_2px_0_#000]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <LogIn size={14} />
                  <span>{t('modal.loginTab')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === 'register'
                      ? 'bg-amber-400 text-black border-2 border-black shadow-[0_2px_0_#000]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <UserPlus size={14} />
                  <span>{t('modal.registerTab')}</span>
                </button>
              </div>

              {/* Error & Success Messages */}
              {errorMsg && (
                <div className="bg-red-950/80 border-2 border-red-500/80 text-red-200 p-3 rounded-xl text-xs flex items-start gap-2 shadow-[0_2px_0_#000] animate-in fade-in duration-200">
                  <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-950/80 border-2 border-emerald-500/80 text-emerald-200 p-3 rounded-xl text-xs flex items-start gap-2 shadow-[0_2px_0_#000] animate-in fade-in duration-200">
                  <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
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
                <span>{t('bilibili.signIn')}</span>
              </button>

              <div className="flex items-center gap-2 my-1">
                <div className="flex-1 h-[1px] bg-gray-700"></div>
                <span className="text-[10px] text-gray-500 font-bold uppercase">{t('modal.orEmail')}</span>
                <div className="flex-1 h-[1px] bg-gray-700"></div>
              </div>

              {/* Email / Password Form */}
              <form
                onSubmit={
                  mode === 'login'
                    ? handleLogin
                    : mode === 'register'
                    ? handleRegister
                    : handleResetPassword
                }
                className="space-y-3"
              >
                {/* Display Name Input (Register Only) */}
                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-300 block">{t('modal.displayNameLabel')}</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={t('modal.displayNamePlaceholder')}
                        className="w-full bg-[#12141c] text-white text-xs font-bold pl-9 pr-3 py-2.5 rounded-xl border-2 border-black focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Email Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-300 block">{t('modal.emailLabel')}</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full bg-[#12141c] text-white text-xs font-bold pl-9 pr-3 py-2.5 rounded-xl border-2 border-black focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password Input (Login & Register) */}
                {mode !== 'forgot' && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-gray-300">{t('modal.passwordLabel')}</label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot');
                            setErrorMsg(null);
                            setSuccessMsg(null);
                          }}
                          className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                        >
                          {t('forgotPassword')}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#12141c] text-white text-xs font-bold pl-9 pr-3 py-2.5 rounded-xl border-2 border-black focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Confirm Password (Register Only) */}
                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-300 block">{t('confirmPassword')}</label>
                    <div className="relative">
                      <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('modal.confirmPasswordPlaceholder')}
                        className="w-full bg-[#12141c] text-white text-xs font-bold pl-9 pr-3 py-2.5 rounded-xl border-2 border-black focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-black font-black text-xs py-3 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 transition-all mt-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>{t('modal.processing')}</span>
                    </>
                  ) : mode === 'login' ? (
                    <>
                      <LogIn size={16} />
                      <span>{t('modal.login')}</span>
                    </>
                  ) : mode === 'register' ? (
                    <>
                      <UserPlus size={16} />
                      <span>{t('modal.register')}</span>
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      <span>{t('sendResetMail')}</span>
                    </>
                  )}
                </button>

                {mode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full text-center text-xs text-gray-400 hover:text-white pt-1 cursor-pointer"
                  >
                    {t('modal.backToLogin')}
                  </button>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
