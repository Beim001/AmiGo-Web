import { describe, expect, it } from 'vitest';
import { requiresEmailVerification } from './useAuth';
import type { AppUser } from '../lib/bilibiliToy';

const user = (over: Partial<AppUser>): AppUser => ({
  uid: 'u1',
  displayName: '测试',
  photoURL: null,
  email: 'a@example.com',
  emailVerified: false,
  providerData: [{ providerId: 'password' }],
  ...over,
});

describe('邮箱验证关卡', () => {
  it('邮箱密码注册且未验证时拦截', () => {
    expect(requiresEmailVerification(user({}))).toBe(true);
  });

  it('已验证或不是邮箱密码账号时放行', () => {
    expect(requiresEmailVerification(user({ emailVerified: true }))).toBe(false);
    expect(requiresEmailVerification(user({ providerData: [{ providerId: 'bilibili' }] }))).toBe(false);
    expect(requiresEmailVerification(user({ email: null }))).toBe(false);
  });
});
