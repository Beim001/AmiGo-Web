// 密码哈希与令牌工具（Web Crypto，可在 Cloudflare Workers 与 Node 18+ 中运行）

// Cloudflare Workers 对 PBKDF2 的迭代次数上限为 100,000
export const PBKDF2_ITERATIONS = 100_000;
const HASH_BYTES = 32;
const SALT_BYTES = 16;
const TOKEN_BYTES = 32;

const encoder = new TextEncoder();

export const toHex = (bytes: ArrayBuffer | Uint8Array): string =>
  Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const fromHex = (hex: string): Uint8Array => {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
};

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export const randomBytes = (n: number): Uint8Array => crypto.getRandomValues(new Uint8Array(n));

/** 等长字符串的常量时间比较，避免时序攻击 */
export const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

const pbkdf2 = async (password: string, salt: Uint8Array, iterations: number): Promise<string> => {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, HASH_BYTES * 8);
  return toHex(bits);
};

export const hashPassword = async (
  password: string,
  iterations = PBKDF2_ITERATIONS,
): Promise<{ hash: string; salt: string }> => {
  const salt = randomBytes(SALT_BYTES);
  return { hash: await pbkdf2(password, salt, iterations), salt: toHex(salt) };
};

export const verifyPassword = async (
  password: string,
  hash: string,
  salt: string,
  iterations = PBKDF2_ITERATIONS,
): Promise<boolean> => timingSafeEqual(await pbkdf2(password, fromHex(salt), iterations), hash);

/** 生成随机令牌（发给客户端/写进邮件链接），数据库只保存 sha256Hex(令牌) */
export const generateToken = (): string => toBase64Url(randomBytes(TOKEN_BYTES));

export const sha256Hex = async (text: string): Promise<string> =>
  toHex(await crypto.subtle.digest('SHA-256', encoder.encode(text)));
