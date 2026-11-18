// 界面多语言：基于 i18next，各语言的文案按命名空间放在 locales/<语言代码>/ 下。
// 新增语言时在 locales 下建同名目录、在 resources 与 LANGUAGES 中登记即可，组件代码无需改动。
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { zhCN } from './locales/zh-CN';

/** 可选语言；label 用该语言自身的写法，切换到任何语言后玩家都能认出自己的语言 */
export const LANGUAGES = [{ code: 'zh-CN', label: '简体中文' }] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: LanguageCode = 'zh-CN';

// 键名不带 amigo_ 前缀：cloudSave 会把 amigo_ 开头的键当作游戏存档上传，并在退出登录时清空；语言是本机设置，需要跨账号保留
const LANGUAGE_KEY = 'ui_language';

const isLanguage = (value: unknown): value is LanguageCode => LANGUAGES.some((l) => l.code === value);

const readLanguage = (): LanguageCode => {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return isLanguage(saved) ? saved : DEFAULT_LANGUAGE;
  } catch (e) {
    console.warn('[i18n] 读取语言设置失败，使用默认语言', e);
    return DEFAULT_LANGUAGE;
  }
};

/** 切换界面语言并保存到本机 */
export const changeLanguage = async (code: LanguageCode) => {
  await i18n.changeLanguage(code);
  try {
    localStorage.setItem(LANGUAGE_KEY, code);
  } catch (e) {
    console.warn('[i18n] 保存语言设置失败，本次切换仅在当前页面有效', e);
  }
};

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

// 语言包随代码打包，initAsync: false 让首次渲染前就完成初始化，避免界面先显示翻译键
void i18n.use(initReactI18next).init({
  resources: { 'zh-CN': zhCN },
  lng: readLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: 'common',
  ns: Object.keys(zhCN),
  initAsync: false,
  // React 渲染时已转义文本，这里关闭 i18next 的转义，避免插值中的字符被重复转义
  interpolation: { escapeValue: false },
});

export default i18n;
