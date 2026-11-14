import React, { useState } from 'react';
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
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  signInAnonymously,
  FirebaseUser,
} from '../firebase';

import { getBilibiliUserProfile, AppUser } from '../lib/bilibiliToy';

export interface AuthScreenProps {
  onLoginSuccess: (user: FirebaseUser | AppUser | null) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const translateFirebaseError = (err: any): string => {
    const code = err?.code || String(err);
    switch (code) {
      case 'auth/email-already-in-use':
        return '该电子邮箱已被注册，请直接登录或使用其他邮箱';
      case 'auth/invalid-email':
        return '请输入正确的电子邮箱格式';
      case 'auth/weak-password':
        return '密码强度太弱，请至少设置 6 位以上的字符';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return '账号或密码错误，请检查后再试';
      case 'auth/too-many-requests':
        return '尝试次数过多，请稍后再试';
      case 'auth/popup-closed-by-user':
        return '已取消 Google 登录窗口';
      case 'auth/network-request-failed':
        return '网络连接失败，请检查您的网络设置';
      default:
        return err?.message || '操作失败，请重试';
    }
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
      const res = await signInWithEmailAndPassword(auth, email, password);
      setSuccessMsg(`验证通过，欢迎回来！`);
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 600);
    } catch (err: any) {
      setErrorMsg(translateFirebaseError(err));
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
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const nameToSet = displayName.trim() || email.split('@')[0];
      await updateProfile(res.user, { displayName: nameToSet });
      try {
        await sendEmailVerification(res.user);
      } catch (vErr) {
        console.warn('发送验证邮件失败:', vErr);
      }
      setSuccessMsg('账号注册成功！验证邮件已发送至您的邮箱，请去邮箱点击链接完成验证');
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 600);
    } catch (err: any) {
      setErrorMsg(translateFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await signInWithPopup(auth, googleProvider);
      setSuccessMsg(`Google 登录成功，欢迎 ${res.user.displayName || '玩家'}！`);
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 600);
    } catch (err: any) {
      setErrorMsg(translateFirebaseError(err));
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

      let firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        try {
          const res = await signInAnonymously(auth);
          firebaseUser = res.user;
        } catch (fErr) {
          console.warn('Firebase 隐式网络链接不可用/跳过:', fErr);
        }
      }

      if (firebaseUser) {
        try {
          await updateProfile(firebaseUser, {
            displayName: nickname,
            photoURL: avatar,
          });
        } catch (e) {}
      }

      const appUser: AppUser = {
        uid: profile.toyOpenId || (firebaseUser ? firebaseUser.uid : `bilibili_${Date.now()}`),
        displayName: nickname,
        photoURL: avatar,
        email: firebaseUser?.email || null,
        emailVerified: true,
        providerData: [{ providerId: 'bilibili' }],
        isBilibili: true,
        isMock: isMock,
      };

      try {
        localStorage.setItem('amigo_active_user', JSON.stringify(appUser));
        if (avatar) localStorage.setItem('amigo_avatar_source', 'social');
      } catch (e) {}

      if (isMock) {
        setSuccessMsg(`🎉 已一键接入哔哩哔哩体验账号：${nickname} (本地 Mock 模式)`);
      } else {
        setSuccessMsg(`🎉 哔哩哔哩 SDK 授权成功，欢迎 ${nickname}！`);
      }

      setTimeout(() => {
        onLoginSuccess(appUser);
      }, 600);
    } catch (err: any) {
      setErrorMsg(err?.message || '哔哩哔哩登录授权失败');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('请输入注册时使用的电子邮箱');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg('重置密码邮件已发送，请检查收件箱');
    } catch (err: any) {
      setErrorMsg(translateFirebaseError(err));
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
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
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
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
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

          {/* Google Sign In Quick Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-[#252a3a] hover:bg-[#2e3346] text-white font-black text-xs py-2.5 rounded-xl border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 transition-all mb-2"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.5 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google 账号一键登录</span>
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
                : handleResetPassword
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

            {/* Email Input */}
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

            {/* Password Input */}
            {mode !== 'forgot' && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-gray-300">密码：</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
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
            {mode === 'register' && (
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
              ) : (
                <>
                  <Mail size={15} />
                  <span>发送重置密码邮件</span>
                </>
              )}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => setMode('login')}
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
