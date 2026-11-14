/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 仅开发模式生效：'true' 时跳过 Firebase 登录，使用本地测试账号 */
  readonly VITE_SKIP_AUTH?: string;
}
