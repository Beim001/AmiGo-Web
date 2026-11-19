import React, { useState } from 'react';
import { CartoonCharacter } from '../components/RoleTab';
import { PRESET_AVATARS } from '../components/AvatarSelectModal';
import type { AppUser } from '../lib/bilibiliToy';
import type { Appearance } from '../lib/appearance';

/**
 * 头像：来源可以是卡通形象（随服饰与外貌变化）、预设头像，或账号 / B 站头像。
 * renderAvatarContent 供顶部栏与个人中心显示当前头像。
 */
export const useAvatar = ({
  authUser,
  equippedClothing,
  appearance,
  age,
  gender,
}: {
  authUser: AppUser | null;
  equippedClothing: string;
  appearance: Appearance | null;
  /** 未登记时按 25 岁的形象显示 */
  age: number;
  gender: string | null;
}) => {
  const [bilibiliAvatar, setBilibiliAvatar] = useState<string | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarSource, setAvatarSource] = useState<string>(() => {
    try {
      return localStorage.getItem('amigo_avatar_source') || 'cartoon';
    } catch (e) {
      return 'cartoon';
    }
  });

  const renderAvatarContent = (): React.ReactNode => {
    if (avatarSource === 'social' && (authUser?.photoURL || bilibiliAvatar)) {
      return <img src={authUser?.photoURL || bilibiliAvatar || ''} alt="User Avatar" className="w-full h-full object-cover rounded-xl" />;
    }
    if (avatarSource.startsWith('preset_')) {
      const preset = PRESET_AVATARS.find((p) => p.id === avatarSource);
      if (preset) {
        return <div className={`w-full h-full ${preset.bg} rounded-xl flex items-center justify-center text-3xl shadow-inner`}>{preset.icon}</div>;
      }
    }
    return <CartoonCharacter clothing={equippedClothing} appearance={appearance} age={age} gender={gender} />;
  };

  return { avatarSource, setAvatarSource, bilibiliAvatar, setBilibiliAvatar, isAvatarModalOpen, setIsAvatarModalOpen, renderAvatarContent };
};
