import React from 'react';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, changeLanguage, type LanguageCode } from '../i18n';

export const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();
  return (
    <label className="flex items-center gap-1.5 bg-[#12141c] text-gray-300 text-[11px] font-black px-2.5 py-1.5 rounded-xl border-2 border-black shadow-[0_2px_0_#000]">
      <Languages size={14} className="text-amber-400" />
      <select
        value={i18n.resolvedLanguage}
        onChange={(e) => void changeLanguage(e.target.value as LanguageCode)}
        aria-label={t('language')}
        className="bg-transparent text-white font-black focus:outline-none cursor-pointer"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} className="bg-[#12141c]">
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
};
