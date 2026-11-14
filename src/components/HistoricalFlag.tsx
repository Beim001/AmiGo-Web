import React from 'react';

interface HistoricalFlagProps {
  code: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  title?: string;
}

/**
 * 历史真实政权与列强国旗向量组件 (100% 离线高保真矢量渲染，无网络丢包风险)
 * 涵盖 19 世纪欧亚美各大帝国与历史政权真实国旗标准制式
 */
export const HistoricalFlag: React.FC<HistoricalFlagProps> = ({
  code,
  className = '',
  width = 24,
  height = 15,
  title,
}) => {
  const cleanCode = (code || '').toUpperCase().trim();
  const w = typeof width === 'number' ? `${width}px` : width;
  const h = typeof height === 'number' ? `${height}px` : height;

  const renderFlagContent = () => {
    switch (cleanCode) {
      // 1. 大英帝国 (GBR/UK) - 联合王国米字旗 (1801-)
      case 'GBR':
      case 'UK':
        return (
          <svg viewBox="0 0 60 36" className="w-full h-full" preserveAspectRatio="none">
            <rect width="60" height="36" fill="#012169" />
            {/* 白斜十字 */}
            <path d="M0,0 L60,36 M60,0 L0,36" stroke="#ffffff" strokeWidth="7" />
            {/* 红斜十字 (圣帕特里克) */}
            <path d="M0,0 L30,18" stroke="#C8102E" strokeWidth="2.5" />
            <path d="M60,36 L30,18" stroke="#C8102E" strokeWidth="2.5" />
            <path d="M60,0 L30,18" stroke="#C8102E" strokeWidth="2.5" />
            <path d="M0,36 L30,18" stroke="#C8102E" strokeWidth="2.5" />
            {/* 圣乔治白正十字 */}
            <path d="M30,0 v36 M0,18 h60" stroke="#ffffff" strokeWidth="11" />
            {/* 圣乔治红正十字 */}
            <path d="M30,0 v36 M0,18 h60" stroke="#C8102E" strokeWidth="6.5" />
          </svg>
        );

      // 2. 普鲁士王国 / 北德意志联邦 / 德意志帝国 (PRU/DEU/GER) - 历史黑白红三色旗 (1867-1918)
      case 'PRU':
      case 'DEU':
      case 'GER':
        return (
          <svg viewBox="0 0 60 36" className="w-full h-full" preserveAspectRatio="none">
            <rect y="0" width="60" height="12" fill="#000000" />
            <rect y="12" width="60" height="12" fill="#FFFFFF" />
            <rect y="24" width="60" height="12" fill="#DD0000" />
            {/* 普鲁士铁十字微缩暗纹 */}
            <g transform="translate(14, 18) scale(0.65)" opacity="0.9">
              <path
                d="M-7,-7 L-4,-4 L-7,-1 L-1,-1 L-1,-7 Z M7,-7 L4,-4 L7,-1 L1,-1 L1,-7 Z M-7,7 L-4,4 L-7,1 L-1,1 L-1,7 Z M7,7 L4,4 L7,1 L1,1 L1,7 Z"
                fill="#000000"
              />
              <circle cx="0" cy="0" r="2.5" fill="#000000" />
            </g>
          </svg>
        );

      // 3. 法兰西第三共和国 (FRA/FR) - 蓝白红三色旗
      case 'FRA':
      case 'FR':
        return (
          <svg viewBox="0 0 60 36" className="w-full h-full" preserveAspectRatio="none">
            <rect x="0" width="20" height="36" fill="#002395" />
            <rect x="20" width="20" height="36" fill="#FFFFFF" />
            <rect x="40" width="20" height="36" fill="#ED2939" />
          </svg>
        );

      // 4. 美利坚合众国 (USA/US) - 13条纹与星条旗
      case 'USA':
      case 'US':
        return (
          <svg viewBox="0 0 60 36" className="w-full h-full" preserveAspectRatio="none">
            {/* 13条红白相间 */}
            {Array.from({ length: 13 }).map((_, i) => (
              <rect
                key={i}
                y={(i * 36) / 13}
                width="60"
                height={36 / 13 + 0.2}
                fill={i % 2 === 0 ? '#B22234' : '#FFFFFF'}
              />
            ))}
            {/* 蓝色左上角 */}
            <rect width="25" height={(7 * 36) / 13} fill="#3C3B6E" />
            {/* 密集星点微缩群 */}
            <g fill="#FFFFFF" opacity="0.95">
              <circle cx="5" cy="4" r="1" />
              <circle cx="10" cy="4" r="1" />
              <circle cx="15" cy="4" r="1" />
              <circle cx="20" cy="4" r="1" />
              <circle cx="7.5" cy="7.5" r="1" />
              <circle cx="12.5" cy="7.5" r="1" />
              <circle cx="17.5" cy="7.5" r="1" />
              <circle cx="5" cy="11" r="1" />
              <circle cx="10" cy="11" r="1" />
              <circle cx="15" cy="11" r="1" />
              <circle cx="20" cy="11" r="1" />
              <circle cx="7.5" cy="14.5" r="1" />
              <circle cx="12.5" cy="14.5" r="1" />
              <circle cx="17.5" cy="14.5" r="1" />
            </g>
          </svg>
        );

      // 5. 俄罗斯帝国 (RUS/RU) - 罗曼诺夫黑黄白王朝国旗 (1858-1896)
      case 'RUS':
      case 'RU':
        return (
          <svg viewBox="0 0 60 36" className="w-full h-full" preserveAspectRatio="none">
            <rect y="0" width="60" height="12" fill="#000000" />
            <rect y="12" width="60" height="12" fill="#F4C430" />
            <rect y="24" width="60" height="12" fill="#FFFFFF" />
            {/* 罗曼诺夫双头鹰徽记微缩 */}
            <g transform="translate(30, 18) scale(0.6)" opacity="0.9">
              <path
                d="M-5,-4 L-2,-1 L-1,-4 L1,-4 L2,-1 L5,-4 L4,2 L-4,2 Z M-2,2 L-4,6 L4,6 L2,2 Z"
                fill="#000000"
              />
              <circle cx="-3" cy="-4" r="1" fill="#000000" />
              <circle cx="3" cy="-4" r="1" fill="#000000" />
            </g>
          </svg>
        );

      // 6. 大日本帝国 (JPN/JP) - 明治时期日之丸
      case 'JPN':
      case 'JP':
        return (
          <svg viewBox="0 0 60 36" className="w-full h-full" preserveAspectRatio="none">
            <rect width="60" height="36" fill="#FFFFFF" />
            <circle cx="30" cy="18" r="10.5" fill="#BC002D" />
          </svg>
        );

      // 7. 奥匈帝国 (AUT/AT) - 双元帝国红白红与红白绿联合旗 (1869-1918)
      case 'AUT':
      case 'AT':
        return (
          <svg viewBox="0 0 60 36" className="w-full h-full" preserveAspectRatio="none">
            {/* 上段统一红色 */}
            <rect y="0" width="60" height="12" fill="#C8102E" />
            {/* 中段统一白色 */}
            <rect y="12" width="60" height="12" fill="#FFFFFF" />
            {/* 下段：左奥地利红色，右匈牙利绿色 */}
            <rect x="0" y="24" width="30" height="12" fill="#C8102E" />
            <rect x="30" y="24" width="30" height="12" fill="#008751" />
            {/* 左侧奥地利皇冠盾徽 */}
            <g transform="translate(15, 18) scale(0.55)">
              <path d="M-6,-4 h12 v7 c0,5 -6,8 -6,8 c0,0 -6,-3 -6,-8 Z" fill="#C8102E" stroke="#000" strokeWidth="0.8" />
              <rect x="-6" y="-1" width="12" height="3" fill="#FFFFFF" />
              <circle cx="0" cy="-6" r="2" fill="#F4C430" />
            </g>
            {/* 右侧匈牙利圣史蒂芬盾徽 */}
            <g transform="translate(45, 18) scale(0.55)">
              <path d="M-6,-4 h12 v7 c0,5 -6,8 -6,8 c0,0 -6,-3 -6,-8 Z" fill="#008751" stroke="#000" strokeWidth="0.8" />
              <rect x="-6" y="-4" width="12" height="3.5" fill="#C8102E" />
              <rect x="-6" y="-0.5" width="12" height="3.5" fill="#FFFFFF" />
              <path d="M-1,-7 L1,-7 L1,-4 L-1,-4 Z" fill="#F4C430" />
            </g>
          </svg>
        );

      // 8. 大清帝国 (QNG/CHN/CN) - 大清黄底蓝龙戏珠黄龙旗 (1862/1889)
      case 'QNG':
      case 'CHN':
      case 'CN':
        return (
          <svg viewBox="0 0 60 36" className="w-full h-full" preserveAspectRatio="none">
            {/* 皇家明黄底色 */}
            <rect width="60" height="36" fill="#F9A825" />
            {/* 红色火珠 */}
            <circle cx="14" cy="11" r="3.5" fill="#D32F2F" />
            <circle cx="14" cy="11" r="4.5" fill="none" stroke="#D32F2F" strokeWidth="0.8" strokeDasharray="1,1" />
            {/* 苍青色飞龙神态 */}
            <path
              d="M17,14 Q23,10 28,15 T38,15 T46,12 Q48,15 44,18 Q36,23 30,19 Q25,23 20,18 Z"
              fill="#1565C0"
              stroke="#0D47A1"
              strokeWidth="0.8"
            />
            {/* 龙爪与背鳍 */}
            <path d="M22,17 L21,22 L24,20 Z M35,18 L36,23 L39,20 Z M43,15 L48,17 L46,14 Z" fill="#1565C0" />
            <path d="M20,13 L22,9 L24,13 L27,10 L29,14" stroke="#D32F2F" strokeWidth="0.8" fill="none" />
            {/* 底部江崖海水祥云微缩 */}
            <path d="M0,32 Q15,28 30,32 T60,32 L60,36 L0,36 Z" fill="#1976D2" opacity="0.8" />
            <path d="M0,34 Q10,31 20,34 T40,34 T60,34 L60,36 L0,36 Z" fill="#FFFFFF" opacity="0.9" />
          </svg>
        );

      // 9. 意大利王国 (ITA/IT) - 萨伏依王朝王冠十字盾三色旗 (1861-1946)
      case 'ITA':
      case 'IT':
        return (
          <svg viewBox="0 0 60 36" className="w-full h-full" preserveAspectRatio="none">
            <rect x="0" width="20" height="36" fill="#009246" />
            <rect x="20" width="20" height="36" fill="#FFFFFF" />
            <rect x="40" width="20" height="36" fill="#CE2B37" />
            {/* 中间萨伏依盾徽与王冠 */}
            <g transform="translate(30, 18) scale(0.65)">
              {/* 王冠 */}
              <path d="M-5,-7 L-4,-4 L0,-6 L4,-4 L5,-7 L4,-3 L-4,-3 Z" fill="#F4C430" />
              {/* 蓝边红底白十字盾 */}
              <path d="M-6,-2 h12 v7 c0,5 -6,8 -6,8 c0,0 -6,-3 -6,-8 Z" fill="#002395" />
              <path d="M-4.5,-1 h9 v5.5 c0,4 -4.5,6.5 -4.5,6.5 c0,0 -4.5,-2.5 -4.5,-6.5 Z" fill="#CE2B37" />
              {/* 白色十字 */}
              <path d="M0,-1 v10 M-4.5,3.5 h9" stroke="#FFFFFF" strokeWidth="2" />
            </g>
          </svg>
        );

      // 10. 西班牙王国 (ESP/ES) - 波旁复辟/历史皇室红黄红旗
      case 'ESP':
      case 'ES':
        return (
          <svg viewBox="0 0 60 36" className="w-full h-full" preserveAspectRatio="none">
            <rect y="0" width="60" height="9" fill="#AA151B" />
            <rect y="9" width="60" height="18" fill="#F1BF00" />
            <rect y="27" width="60" height="9" fill="#AA151B" />
            {/* 西班牙古典皇家盾徽微缩 */}
            <g transform="translate(18, 18) scale(0.6)">
              <circle cx="0" cy="-6" r="2.5" fill="#AA151B" stroke="#F1BF00" strokeWidth="0.8" />
              <path d="M-5,-2 h10 v6 c0,4 -5,7 -5,7 c0,0 -5,-3 -5,-7 Z" fill="#AA151B" stroke="#000" strokeWidth="0.8" />
              <rect x="-3" y="0" width="6" height="4" fill="#F1BF00" />
            </g>
          </svg>
        );

      // 11. 荷兰王国 (NLD/NL) - 经典红白蓝三色旗
      case 'NLD':
      case 'NL':
        return (
          <svg viewBox="0 0 60 36" className="w-full h-full" preserveAspectRatio="none">
            <rect y="0" width="60" height="12" fill="#AE1C28" />
            <rect y="12" width="60" height="12" fill="#FFFFFF" />
            <rect y="24" width="60" height="12" fill="#21468B" />
          </svg>
        );

      // 12. 瑞士联邦 (CHE/CH) - 红底白十字
      case 'CHE':
      case 'CH':
        return (
          <svg viewBox="0 0 60 36" className="w-full h-full" preserveAspectRatio="none">
            <rect width="60" height="36" fill="#D52B1E" />
            <path d="M30,8 v20 M18,18 h24" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="square" />
          </svg>
        );

      // 13. 瑞典-挪威联合王国 (SWE/SE) - 联合标记旗
      case 'SWE':
      case 'SE':
        return (
          <svg viewBox="0 0 60 36" className="w-full h-full" preserveAspectRatio="none">
            <rect width="60" height="36" fill="#005293" />
            <path d="M20,0 v36 M0,18 h60" stroke="#FECB00" strokeWidth="6" />
            {/* 左上角联合标志 (Sillsallaten) */}
            <g transform="scale(0.33)">
              <rect width="60" height="36" fill="#005293" />
              <path d="M0,0 L60,36 M60,0 L0,36" stroke="#BA0C2F" strokeWidth="8" />
              <path d="M30,0 v36 M0,18 h60" stroke="#FECB00" strokeWidth="8" />
            </g>
          </svg>
        );

      // 14. 奥斯曼帝国 (TUR/OTT/TR) - 经典星月红旗
      case 'TUR':
      case 'OTT':
      case 'TR':
        return (
          <svg viewBox="0 0 60 36" className="w-full h-full" preserveAspectRatio="none">
            <rect width="60" height="36" fill="#E30A17" />
            {/* 白色新月 */}
            <circle cx="24" cy="18" r="9" fill="#FFFFFF" />
            <circle cx="27" cy="18" r="7.5" fill="#E30A17" />
            {/* 五角星 */}
            <g transform="translate(36, 18) scale(0.6)">
              <polygon
                points="0,-6 1.8,-1.8 6.3,-1.8 2.7,0.9 4,5.4 0,2.7 -4,5.4 -2.7,0.9 -6.3,-1.8 -1.8,-1.8"
                fill="#FFFFFF"
              />
            </g>
          </svg>
        );

      // 15. 巴西帝国 (BRA/BR) - 佩德罗二世时期绿底金菱皇室徽章国旗
      case 'BRA':
      case 'BR':
        return (
          <svg viewBox="0 0 60 36" className="w-full h-full" preserveAspectRatio="none">
            <rect width="60" height="36" fill="#009B3A" />
            <polygon points="30,4 56,18 30,32 4,18" fill="#FEDF00" />
            {/* 帝国皇家十字盾徽 */}
            <circle cx="30" cy="18" r="6" fill="#002776" />
            <circle cx="30" cy="18" r="4.8" fill="#CC092F" />
            <path d="M30,14 v8 M26,18 h8" stroke="#FFFFFF" strokeWidth="1.2" />
            <circle cx="30" cy="10" r="1.5" fill="#FEDF00" />
          </svg>
        );

      default:
        return (
          <div className="w-full h-full bg-slate-800 text-slate-200 font-mono text-[9px] font-black flex items-center justify-center">
            {cleanCode.slice(0, 3)}
          </div>
        );
    }
  };

  return (
    <div
      style={{ width: w, height: h }}
      className={`relative inline-flex items-center justify-center rounded-[3px] overflow-hidden border border-black/70 shadow-sm flex-shrink-0 bg-[#0f1118] ${className}`}
      title={title || cleanCode}
    >
      {renderFlagContent()}
    </div>
  );
};
