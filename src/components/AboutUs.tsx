import React from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { APP_VERSION } from '../version';
import { useTranslation } from 'react-i18next';
import { siFandom, siMiraheze, siDiscord, siReddit, siQq, siBilibili, type SimpleIcon } from 'simple-icons';

interface CommunityLink {
  id: 'fandom' | 'miraheze' | 'discord' | 'reddit' | 'qq' | 'bilibili';
  url: string;
  icon: SimpleIcon;
  /** 图标颜色，默认白色；品牌底色太亮时改用深色 */
  iconColor?: string;
}

// 已去掉分享链接中的追踪参数；QQ 群链接中的 authKey 等参数是加群所必需的，保持原样
const LINKS: CommunityLink[] = [
  { id: 'fandom', url: 'https://aminoac.fandom.com/zh/wiki/', icon: siFandom },
  { id: 'miraheze', url: 'https://aminoacwiki.miraheze.org/wiki/', icon: siMiraheze, iconColor: '#000' },
  { id: 'discord', url: 'https://discord.com/invite/B7bqnGGfUm', icon: siDiscord },
  { id: 'reddit', url: 'https://www.reddit.com/r/Aminoac/', icon: siReddit },
  {
    id: 'qq',
    url: 'https://qun.qq.com/universal-share/share?ac=1&authKey=BDKsnLpxj1cttTvq73PQfaUg6wcjw0KolB5%2B%2BsgkxkUFHtwl7GGndWZqAmPnVNZF&busi_data=eyJncm91cENvZGUiOiIxMDU0MzU3OTM3IiwidG9rZW4iOiJRTTJCc3duS2ZoZkF5STV2aEh2M1ZFUWVuZzhuMDNGTURkd3BrN0xJcngwZ1hLTGU0clpJTkRJRE9Sc2pxQjNIIiwidWluIjoiMzgzMTYxNjIxNCJ9&data=-bzHmdHYyzkd9NuZe8cW2qCyD7PXLkjeeUxZuSoeThNDt26UzzUf0vKS-u3p-RFFAFfLdAh_BykGYIo-m8gbeZlL2cnxVri2fJ1T3OFligw&svctype=5&tempid=h5_group_info',
    icon: siQq,
  },
  { id: 'bilibili', url: 'https://space.bilibili.com/1522815623', icon: siBilibili },
];

const BrandIcon: React.FC<{ icon: SimpleIcon; color?: string }> = ({ icon, color = '#fff' }) => (
  <svg role="img" aria-label={icon.title} viewBox="0 0 24 24" width={24} height={24} fill={color}>
    <path d={icon.path} />
  </svg>
);

/** 个人中心「关于我们」：社区与官方账号链接 */
export const AboutUs: React.FC = () => {
  const { t } = useTranslation('profile');
  return (
  <div className="space-y-3">
    <div className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-4 shadow-[0_4px_0_#000]">
      <h3 className="text-white font-black text-sm flex items-center gap-2 border-b border-gray-700/80 pb-2 mb-2">
        <Info size={16} className="text-yellow-400" /> {t('about.title')}
      </h3>
      <p className="text-gray-300 text-xs font-bold leading-relaxed">
        {t('about.intro')}
      </p>
    </div>
    {LINKS.map((link) => (
      <a
        key={link.id}
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-[#2d2f3d] border-2 border-black rounded-2xl p-3 shadow-[0_3px_0_#000] flex items-center gap-3 hover:bg-[#363949] active:translate-y-px transition-colors"
      >
        <div
          className="w-11 h-11 rounded-xl border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[0_2px_0_#000]"
          style={{ backgroundColor: `#${link.icon.hex}` }}
        >
          <BrandIcon icon={link.icon} color={link.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-black text-xs">{t(`about.links.${link.id}.name`)}</div>
          <div className="text-gray-400 text-[11px] font-bold mt-0.5 truncate">{t(`about.links.${link.id}.desc`)}</div>
        </div>
        <ExternalLink size={16} className="text-gray-400 flex-shrink-0" />
      </a>
    ))}
    <p className="text-center text-gray-500 text-[10px] font-bold font-mono pt-1">{t('about.version', { version: APP_VERSION })}</p>
  </div>
  );
};
