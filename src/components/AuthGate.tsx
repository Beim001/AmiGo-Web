import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthScreen } from './AuthScreen';
import { EmailVerificationScreen } from './EmailVerificationScreen';
import { requiresEmailVerification } from '../hooks/useAuth';
import type { AppUser } from '../lib/bilibiliToy';

/**
 * 进入游戏前的关卡：确认登录中显示加载画面，未登录显示登录首屏，邮箱未验证显示验证拦截页；
 * 都通过后才渲染 children。这里只决定界面，账号身份与权限仍由 Worker 校验。
 */
export const AuthGate: React.FC<{
  authUser: AppUser | null;
  authLoading: boolean;
  onSignedIn: (user: AppUser) => void;
  onLogout: () => void;
  children: React.ReactNode;
}> = ({ authUser, authLoading, onSignedIn, onLogout, children }) => {
  const { t } = useTranslation('app');

  if (authLoading) {
    return (
      <div className="h-[100dvh] w-full bg-[#0d0e15] flex justify-center items-center text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={28} className="animate-spin text-amber-400" />
          <span className="text-xs font-black text-gray-300">{t('connecting')}</span>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <AuthScreen onLoginSuccess={onSignedIn} />;
  }

  if (requiresEmailVerification(authUser)) {
    return <EmailVerificationScreen user={authUser} onVerified={onSignedIn} onLogout={onLogout} />;
  }

  return <>{children}</>;
};
