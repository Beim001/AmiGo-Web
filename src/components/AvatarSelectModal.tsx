import React from 'react';
import { X, Check, Camera, User, Sparkles } from 'lucide-react';
import type { AppUser } from '../lib/bilibiliToy';
import { CartoonCharacter } from './RoleTab';
import { useTranslation } from 'react-i18next';

interface AvatarSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatarSource: string; // 'cartoon' | 'social' | 'preset_knight' | 'preset_mage' | 'preset_ranger' | 'preset_artisan'
  onSelectAvatar: (source: string) => void;
  authUser: AppUser | null;
  bilibiliAvatar: string | null;
  equippedClothing: string;
}

export const PRESET_AVATARS = [
  {
    id: 'preset_knight',
    bg: 'bg-gradient-to-br from-blue-600 to-amber-500',
    borderColor: 'border-yellow-400',
    icon: '🛡️',
  },
  {
    id: 'preset_mage',
    bg: 'bg-gradient-to-br from-purple-700 to-indigo-900',
    borderColor: 'border-purple-400',
    icon: '🔮',
  },
  {
    id: 'preset_ranger',
    bg: 'bg-gradient-to-br from-emerald-600 to-teal-800',
    borderColor: 'border-emerald-400',
    icon: '🏹',
  },
  {
    id: 'preset_artisan',
    bg: 'bg-gradient-to-br from-amber-600 to-orange-700',
    borderColor: 'border-amber-400',
    icon: '⚙️',
  },
] as const;

export const AvatarSelectModal: React.FC<AvatarSelectModalProps> = ({
  isOpen,
  onClose,
  avatarSource,
  onSelectAvatar,
  authUser,
  bilibiliAvatar,
  equippedClothing,
}) => {
  const { t } = useTranslation('profile');
  if (!isOpen) return null;

  const socialPhoto = authUser?.photoURL || bilibiliAvatar || null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-[#1e2330] border-2 border-black rounded-3xl w-full max-w-md overflow-hidden shadow-[0_8px_0_#000] relative text-white">
        {/* Header */}
        <div className="bg-[#252a3a] border-b-2 border-black p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-400 text-black rounded-xl border-2 border-black shadow-[0_2px_0_#000]">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="font-black text-base text-white">{t('avatar.title')}</h3>
              <p className="text-[10px] text-gray-400">{t('avatar.subtitle')}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-[#12141c] hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl border-2 border-black cursor-pointer active:translate-y-0.5 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto bg-[#181a24]">
          
          {/* Option 1: Cartoon Character */}
          <div
            onClick={() => onSelectAvatar('cartoon')}
            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 relative ${
              avatarSource === 'cartoon'
                ? 'bg-[#282d3e] border-yellow-400 shadow-[0_3px_0_#000]'
                : 'bg-[#202330] border-black hover:border-gray-600'
            }`}
          >
            <div className="w-14 h-14 rounded-xl bg-[#1b1c25] border-2 border-black flex items-center justify-center overflow-hidden shrink-0 relative">
              <CartoonCharacter clothing={equippedClothing} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white">{t('avatar.cartoon')}</span>
                <span className="text-[9px] bg-yellow-400 text-black font-extrabold px-1.5 py-0.2 rounded border border-black">
                  {t('avatar.cartoonTag')}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{t('avatar.cartoonDesc')}</p>
            </div>
            {avatarSource === 'cartoon' && (
              <div className="w-6 h-6 rounded-full bg-yellow-400 text-black border-2 border-black flex items-center justify-center font-black">
                <Check size={14} strokeWidth={3} />
              </div>
            )}
          </div>

          {/* Option 2: Social / Third-Party Photo */}
          <div
            onClick={() => {
              if (socialPhoto) {
                onSelectAvatar('social');
              }
            }}
            className={`p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 relative ${
              socialPhoto ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
            } ${
              avatarSource === 'social' && socialPhoto
                ? 'bg-[#282d3e] border-yellow-400 shadow-[0_3px_0_#000]'
                : 'bg-[#202330] border-black hover:border-gray-600'
            }`}
          >
            <div className="w-14 h-14 rounded-xl bg-gray-800 border-2 border-black flex items-center justify-center overflow-hidden shrink-0">
              {socialPhoto ? (
                <img src={socialPhoto} alt="Social Photo" className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-gray-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white">{t('avatar.social')}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {socialPhoto ? t('avatar.socialLinked') : t('avatar.socialNone')}
              </p>
            </div>
            {avatarSource === 'social' && socialPhoto && (
              <div className="w-6 h-6 rounded-full bg-yellow-400 text-black border-2 border-black flex items-center justify-center font-black">
                <Check size={14} strokeWidth={3} />
              </div>
            )}
          </div>

          {/* Option 3: Presets Grid */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-black text-yellow-400 flex items-center gap-1">
              <Sparkles size={14} />
              <span>{t('avatar.presets')}</span>
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = avatarSource === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => onSelectAvatar(preset.id)}
                    className={`p-2.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2.5 relative ${
                      isSelected
                        ? 'bg-[#282d3e] border-yellow-400 shadow-[0_3px_0_#000]'
                        : 'bg-[#202330] border-black hover:border-gray-600'
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl ${preset.bg} border-2 border-black flex items-center justify-center text-xl shadow-sm shrink-0`}>
                      {preset.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-black text-xs text-white truncate">{t(`avatar.presetNames.${preset.id}`)}</div>
                      <div className="text-[9px] text-gray-400 font-bold">{t('avatar.presetTag')}</div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-yellow-400 text-black border-2 border-black flex items-center justify-center font-black shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#252a3a] border-t-2 border-black p-3.5 flex justify-end">
          <button
            onClick={onClose}
            className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs px-5 py-2 rounded-xl border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 transition-all cursor-pointer"
          >
            {t('avatar.done')}
          </button>
        </div>
      </div>
    </div>
  );
};
