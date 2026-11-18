import 'i18next';
import type { zhCN } from './locales/zh-CN';

// 以简体中文语言包为基准声明翻译键的类型，t() 传入不存在的键时 npm run lint 会报错
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: typeof zhCN;
  }
}
