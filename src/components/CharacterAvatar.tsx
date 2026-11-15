import React from 'react';
import { Appearance, SKIN_TONES, ageStage, hairColorAt, isBaldAt } from '../lib/appearance';
import { clothingById, ClothingItem } from '../data/clothing';

// 角色立绘（第 61 题）：按外貌（捏脸 7 项）、性别、年龄与服装绘制。
// 年龄：16 岁以下身形缩小；50 岁起头发渐灰；60 岁起头发花白、出现皱纹，部分老年男性谢顶。

export const DEFAULT_APPEARANCE: Appearance = { skin: 1, face: 0, hair: 0, hairColor: 0, eyes: 0, brows: 0, beard: 0 };

const DEFAULT_OUTFIT: ClothingItem = {
  id: 'default', name: '初始服装', effect: '', price: 0, rarity: 'advanced', style: 'tunic', color: '#4A7A9C', accent: '#3A5F7A', hat: 'none',
};

export interface CharacterAvatarProps {
  clothing: string;
  appearance?: Appearance | null;
  age?: number;
  gender?: string | null;
}

const darken = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.floor(v * 0.75));
  return `#${[f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

/** 身体与服装 */
const Outfit: React.FC<{ o: ClothingItem; skin: string }> = ({ o, skin }) => {
  const line = darken(o.color);
  const sleeves = (color = o.color) => (
    <>
      <rect x="18" y="54" width="12" height="22" rx="4" fill={color} stroke={darken(color)} strokeWidth="2" />
      <rect x="70" y="54" width="12" height="22" rx="4" fill={color} stroke={darken(color)} strokeWidth="2" />
    </>
  );
  switch (o.style) {
    case 'armor':
      return (
        <g>
          <rect x="30" y="52" width="40" height="34" rx="4" fill={o.color} stroke={o.accent} strokeWidth="2" />
          <path d="M 30 65 l 20 10 l 20 -10" fill="none" stroke={o.accent} strokeWidth="2" />
          {sleeves('#94a3b8')}
        </g>
      );
    case 'robe':
      return (
        <g>
          <path d="M 32 52 L 68 52 L 75 100 L 25 100 Z" fill={o.color} stroke={o.accent} strokeWidth="2" />
          <rect x="45" y="52" width="10" height="48" fill={darken(o.color)} />
          <rect x="16" y="54" width="16" height="20" rx="4" fill={darken(o.color)} stroke={o.accent} strokeWidth="2" />
          <rect x="68" y="54" width="16" height="20" rx="4" fill={darken(o.color)} stroke={o.accent} strokeWidth="2" />
        </g>
      );
    case 'hoodie':
      return (
        <g>
          <rect x="28" y="52" width="44" height="32" rx="6" fill={o.color} stroke={o.accent} strokeWidth="2" />
          <rect x="35" y="65" width="30" height="14" rx="4" fill="#fde047" stroke={o.accent} strokeWidth="2" />
          {sleeves()}
        </g>
      );
    case 'tunic':
      return (
        <g>
          <rect x="30" y="52" width="40" height="30" rx="6" fill={o.color} stroke={o.accent} strokeWidth="2" />
          <rect x="20" y="54" width="8" height="22" rx="4" fill={skin} stroke={darken(skin)} strokeWidth="2" />
          <rect x="18" y="52" width="12" height="12" rx="2" fill={o.color} stroke={o.accent} strokeWidth="2" />
          <rect x="72" y="54" width="8" height="22" rx="4" fill={skin} stroke={darken(skin)} strokeWidth="2" />
          <rect x="70" y="52" width="12" height="12" rx="2" fill={o.color} stroke={o.accent} strokeWidth="2" />
        </g>
      );
    case 'jacket':
      return (
        <g>
          <rect x="30" y="52" width="40" height="32" rx="4" fill={o.color} stroke={line} strokeWidth="2" />
          <path d="M 44 52 L 50 62 L 56 52" fill="#e5e7eb" stroke={line} strokeWidth="1.5" />
          <rect x="34" y="70" width="9" height="7" rx="1" fill="none" stroke={o.accent} strokeWidth="1.5" />
          <rect x="57" y="70" width="9" height="7" rx="1" fill="none" stroke={o.accent} strokeWidth="1.5" />
          {sleeves()}
        </g>
      );
    case 'vest':
      return (
        <g>
          <rect x="30" y="52" width="40" height="32" rx="4" fill="#f3f4f6" stroke="#9ca3af" strokeWidth="2" />
          <path d="M 30 56 L 44 56 L 50 84 L 30 84 Z M 70 56 L 56 56 L 50 84 L 70 84 Z" fill={o.color} stroke={line} strokeWidth="1.5" />
          <path d="M 38 70 Q 46 76 54 70" fill="none" stroke={o.accent} strokeWidth="1.5" />
          {sleeves('#f3f4f6')}
        </g>
      );
    case 'tailcoat':
      return (
        <g>
          <path d="M 32 82 L 26 104 L 36 104 L 40 82 Z M 68 82 L 74 104 L 64 104 L 60 82 Z" fill={o.color} stroke={line} strokeWidth="1.5" />
          <rect x="30" y="52" width="40" height="32" rx="4" fill={o.color} stroke={line} strokeWidth="2" />
          <path d="M 44 52 L 50 76 L 56 52 Z" fill={o.accent} />
          <path d="M 45 56 L 50 58 L 55 56 L 55 60 L 50 58 L 45 60 Z" fill="#111" />
          {sleeves()}
        </g>
      );
    case 'uniform':
      return (
        <g>
          <rect x="30" y="52" width="40" height="32" rx="4" fill={o.color} stroke={line} strokeWidth="2" />
          {[58, 64, 70, 76].map((y) => (
            <circle key={y} cx="50" cy={y} r="1.6" fill={o.accent} />
          ))}
          <rect x="30" y="78" width="40" height="4" fill="#3f2a14" />
          {o.hat === 'kepi' && (
            <>
              <rect x="27" y="51" width="10" height="4" rx="1" fill={o.accent} />
              <rect x="63" y="51" width="10" height="4" rx="1" fill={o.accent} />
            </>
          )}
          {sleeves()}
        </g>
      );
    case 'dress':
    case 'shawl':
    case 'apron':
      return (
        <g>
          <path d="M 34 72 L 66 72 L 76 104 L 24 104 Z" fill={o.style === 'apron' ? o.color : darken(o.color)} stroke={line} strokeWidth="2" />
          <rect x="32" y="52" width="36" height="24" rx="5" fill={o.color} stroke={line} strokeWidth="2" />
          {o.style === 'dress' && <path d="M 42 52 Q 50 58 58 52" fill="none" stroke={o.accent} strokeWidth="2.5" />}
          {o.style === 'apron' && <rect x="38" y="62" width="24" height="40" rx="2" fill={o.accent} stroke="#cbd5e1" strokeWidth="1.5" />}
          {o.style === 'shawl' && (
            <>
              <path d="M 28 54 L 72 54 L 50 80 Z" fill={o.accent} stroke={darken(o.accent)} strokeWidth="1.5" />
              {[40, 45, 50, 55, 60].map((x) => (
                <line key={x} x1={x} y1={70 + Math.abs(50 - x) * -0.6} x2={x} y2={74 + Math.abs(50 - x) * -0.6} stroke={darken(o.accent)} strokeWidth="1" />
              ))}
            </>
          )}
          {sleeves()}
        </g>
      );
    case 'gown':
      return (
        <g>
          <path d="M 31 52 L 69 52 L 72 98 L 28 98 Z" fill={o.color} stroke={line} strokeWidth="2" />
          {[36, 42, 58, 64].map((x) => (
            <line key={x} x1={x} y1="54" x2={x} y2="96" stroke={o.accent} strokeWidth="1.5" opacity="0.8" />
          ))}
          <rect x="31" y="70" width="38" height="4" fill={o.accent} />
          {sleeves()}
        </g>
      );
    case 'coat':
      return (
        <g>
          <path d="M 30 52 L 70 52 L 72 98 L 28 98 Z" fill={o.color} stroke={line} strokeWidth="2" />
          {[60, 70, 80].map((y) => (
            <g key={y}>
              <circle cx="44" cy={y} r="1.6" fill="#e5e7eb" />
              <circle cx="56" cy={y} r="1.6" fill="#e5e7eb" />
            </g>
          ))}
          <ellipse cx="50" cy="53" rx="20" ry="5" fill={o.accent} stroke="#9ca3af" strokeWidth="1" />
          {sleeves()}
        </g>
      );
    case 'padded':
      return (
        <g>
          <rect x="28" y="52" width="44" height="34" rx="8" fill={o.color} stroke={line} strokeWidth="2" />
          {[60, 68, 76].map((y) => (
            <line key={y} x1="30" y1={y} x2="70" y2={y} stroke={o.accent} strokeWidth="1.2" opacity="0.7" />
          ))}
          {sleeves()}
        </g>
      );
    default:
      return null;
  }
};

const Hat: React.FC<{ o: ClothingItem }> = ({ o }) => {
  switch (o.hat) {
    case 'helmet':
      return (
        <g>
          <path d="M 26 22 C 26 -2, 74 -2, 74 22 L 74 35 C 74 40, 26 40, 26 35 Z" fill={o.color} stroke={o.accent} strokeWidth="2" />
          <rect x="42" y="10" width="16" height="26" fill="#1e293b" />
        </g>
      );
    case 'wizard':
      return (
        <g>
          <path d="M 15 20 L 85 20 L 50 -15 Z" fill={o.accent} stroke="#581c87" strokeWidth="2" />
          <ellipse cx="50" cy="20" rx="38" ry="8" fill={o.color} stroke="#581c87" strokeWidth="2" />
        </g>
      );
    case 'hood':
      return (
        <g>
          <path d="M 28 30 C 28 0, 72 0, 72 30 L 72 35 C 72 35, 28 35, 28 35 Z" fill={o.color} stroke={o.accent} strokeWidth="2" opacity="0.95" />
          <path d="M 40 10 Q 50 20 60 10" fill="none" stroke={o.accent} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case 'cap':
      return (
        <g>
          <path d="M 29 16 Q 50 2 71 16 L 71 19 L 29 19 Z" fill={darken(o.color)} stroke="#111" strokeWidth="1.5" />
          <path d="M 29 19 L 78 19 L 74 23 L 29 22 Z" fill="#111" />
        </g>
      );
    case 'tophat':
      return (
        <g>
          <rect x="36" y="-6" width="28" height="20" rx="2" fill="#111" />
          <rect x="36" y="9" width="28" height="3" fill={o.accent === '#f9fafb' ? '#7f1d1d' : o.accent} />
          <ellipse cx="50" cy="14" rx="22" ry="4" fill="#111" />
        </g>
      );
    case 'kepi':
      return (
        <g>
          <rect x="34" y="2" width="32" height="14" rx="3" fill={o.color} stroke="#111" strokeWidth="1.5" />
          <rect x="34" y="12" width="32" height="3" fill={o.accent} />
          <path d="M 32 16 L 70 16 L 66 20 L 32 19 Z" fill="#111" />
        </g>
      );
    case 'bonnet':
      return <path d="M 25 26 C 22 2, 78 2, 75 26 C 66 14, 34 14, 25 26 Z" fill={o.accent} stroke={darken(o.accent)} strokeWidth="1.5" />;
    case 'crown':
      return <path d="M 34 12 L 38 0 L 44 8 L 50 -2 L 56 8 L 62 0 L 66 12 Z" fill="#facc15" stroke="#a16207" strokeWidth="1.5" />;
    case 'headscarf':
      return <path d="M 26 28 C 24 4, 76 4, 74 28 L 70 22 C 64 12, 36 12, 30 22 Z" fill={o.accent} stroke={darken(o.accent)} strokeWidth="1.5" />;
    default:
      return null;
  }
};

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({ clothing, appearance, age = 25, gender = null }) => {
  const a = appearance ?? DEFAULT_APPEARANCE;
  const o = clothingById(clothing) ?? DEFAULT_OUTFIT;
  const skin = SKIN_TONES[a.skin] ?? SKIN_TONES[1];
  const skinLine = darken(skin);
  const stage = ageStage(age);
  const hair = hairColorAt(a, age);
  const bald = isBaldAt(a, age, gender === '男' || gender === '女' ? gender : null);
  const male = gender === '男';
  const hidesHair = o.hat === 'helmet' || o.hat === 'hood' || o.hat === 'headscarf';

  // 脸型
  const head =
    a.face === 1 ? (
      <ellipse cx="50" cy="30" rx="20" ry="24" fill={skin} stroke={skinLine} strokeWidth="2" />
    ) : a.face === 2 ? (
      <rect x="29" y="9" width="42" height="42" rx="11" fill={skin} stroke={skinLine} strokeWidth="2" />
    ) : (
      <circle cx="50" cy="30" r="22" fill={skin} stroke={skinLine} strokeWidth="2" />
    );

  // 发型：后发（在头后面）与刘海（在头前面）
  const backHair = !bald && !hidesHair && (
    <>
      {(a.hair === 3 || a.hair === 7) && <path d={a.hair === 3 ? 'M 27 22 L 25 62 L 75 62 L 73 22 Z' : 'M 27 22 Q 20 42 27 60 L 73 60 Q 80 42 73 22 Z'} fill={hair} />}
      {a.hair === 4 && <circle cx="50" cy="6" r="9" fill={hair} />}
      {a.hair === 5 && (
        <g>
          <rect x="66" y="26" width="7" height="30" rx="3.5" fill={hair} />
          <circle cx="69.5" cy="58" r="3" fill={darken(hair)} />
        </g>
      )}
    </>
  );
  const fringe = !bald && !hidesHair && (
    <>
      {a.hair === 0 && <path d="M 28 24 C 28 4, 72 4, 72 24 C 64 14, 36 14, 28 24 Z" fill={hair} />}
      {a.hair === 1 && <path d="M 28 26 C 26 4, 74 4, 72 24 C 60 10, 44 22, 28 26 Z" fill={hair} />}
      {a.hair === 2 && [32, 40, 48, 56, 64, 68].map((x, i) => <circle key={i} cx={x} cy={i % 2 ? 12 : 10} r="7" fill={hair} />)}
      {(a.hair === 3 || a.hair === 4 || a.hair === 5 || a.hair === 7) && <path d="M 28 24 C 28 2, 72 2, 72 24 C 62 12, 50 18, 50 18 C 50 18, 38 12, 28 24 Z" fill={hair} />}
    </>
  );
  // 谢顶的老人只剩两鬓
  const sideHair = bald && a.hair !== 6 && (
    <>
      <path d="M 28 24 Q 26 34 30 38 L 32 26 Z" fill={hair} />
      <path d="M 72 24 Q 74 34 70 38 L 68 26 Z" fill={hair} />
    </>
  );

  const eyes = (() => {
    switch (a.eyes) {
      case 1:
        return (
          <>
            <circle cx="42" cy="27" r="4.5" fill="#fff" stroke="#2C2C2C" strokeWidth="1" />
            <circle cx="58" cy="27" r="4.5" fill="#fff" stroke="#2C2C2C" strokeWidth="1" />
            <circle cx="42.5" cy="27.5" r="2.4" fill="#2C2C2C" />
            <circle cx="58.5" cy="27.5" r="2.4" fill="#2C2C2C" />
          </>
        );
      case 2:
        return (
          <>
            <path d="M 37 27 Q 42 25 47 27" fill="none" stroke="#2C2C2C" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 53 27 Q 58 25 63 27" fill="none" stroke="#2C2C2C" strokeWidth="2.5" strokeLinecap="round" />
          </>
        );
      case 3:
        return (
          <>
            <path d="M 38 27 A 4 4 0 0 0 46 27 Z" fill="#2C2C2C" />
            <path d="M 54 27 A 4 4 0 0 0 62 27 Z" fill="#2C2C2C" />
          </>
        );
      default:
        return (
          <>
            <circle cx="42" cy="27" r="3.5" fill="#2C2C2C" />
            <circle cx="58" cy="27" r="3.5" fill="#2C2C2C" />
          </>
        );
    }
  })();
  const browColor = stage === 'elder' ? '#9ca3af' : darken(HAIR_FALLBACK(hair));
  const brows =
    a.brows === 1 ? (
      <>
        <path d="M 37 21 Q 42 17 47 20" fill="none" stroke={browColor} strokeWidth="2" strokeLinecap="round" />
        <path d="M 53 20 Q 58 17 63 21" fill="none" stroke={browColor} strokeWidth="2" strokeLinecap="round" />
      </>
    ) : (
      <>
        <line x1="37" y1="21" x2="47" y2="21" stroke={browColor} strokeWidth={a.brows === 2 ? 3.5 : 2} strokeLinecap="round" />
        <line x1="53" y1="21" x2="63" y2="21" stroke={browColor} strokeWidth={a.brows === 2 ? 3.5 : 2} strokeLinecap="round" />
      </>
    );
  const beardColor = hair;
  const beard =
    male && stage !== 'child' && a.beard > 0 ? (
      a.beard === 1 ? (
        <path d="M 42 35 Q 50 31 58 35 Q 50 34 42 35 Z" fill={beardColor} stroke={beardColor} strokeWidth="2" />
      ) : a.beard === 2 ? (
        <path d="M 46 40 Q 50 50 54 40 Z" fill={beardColor} />
      ) : (
        <path d="M 30 32 Q 32 52 50 54 Q 68 52 70 32 Q 66 44 50 44 Q 34 44 30 32 Z" fill={beardColor} />
      )
    ) : null;

  const figure = (
    <g>
      {/* 腿与鞋 */}
      <rect x="36" y="82" width="8" height="18" rx="3" fill="#2C3E50" stroke="#1A2A38" strokeWidth="2" />
      <rect x="56" y="82" width="8" height="18" rx="3" fill="#2C3E50" stroke="#1A2A38" strokeWidth="2" />
      <path d="M 32 98 h 16 v 6 h -16 z" fill="#111" />
      <path d="M 52 98 h 16 v 6 h -16 z" fill="#111" />
      <Outfit o={o} skin={skin} />
      {o.style !== 'tunic' && (
        <g>
          <circle cx="24" cy="78" r="5" fill={skin} stroke={skinLine} strokeWidth="2" />
          <circle cx="76" cy="78" r="5" fill={skin} stroke={skinLine} strokeWidth="2" />
        </g>
      )}
      {backHair}
      {head}
      {sideHair}
      {fringe}
      {brows}
      {eyes}
      {/* 腮红：孩子与年轻人 */}
      {(stage === 'child' || stage === 'youth') && (
        <>
          <circle cx="38" cy="33" r="3" fill="#ff7e7e" opacity="0.55" />
          <circle cx="62" cy="33" r="3" fill="#ff7e7e" opacity="0.55" />
        </>
      )}
      {/* 皱纹：50 岁起额头一道，60 岁起再加眼角 */}
      {age >= 50 && <path d="M 42 15 Q 50 13 58 15" fill="none" stroke={skinLine} strokeWidth="1.2" />}
      {stage === 'elder' && (
        <>
          <path d="M 40 18 Q 50 16 60 18" fill="none" stroke={skinLine} strokeWidth="1.2" />
          <path d="M 33 26 l -3 -2 M 33 28 l -3 1 M 67 26 l 3 -2 M 67 28 l 3 1" stroke={skinLine} strokeWidth="1" />
        </>
      )}
      <path d="M 44 37 Q 50 41 56 37" fill="none" stroke="#B8836A" strokeWidth="2.5" strokeLinecap="round" />
      {beard}
      <Hat o={o} />
    </g>
  );

  return (
    <svg viewBox="0 -16 100 136" className="w-full h-full drop-shadow-md z-10">
      {stage === 'child' ? <g transform="translate(12 24) scale(0.76)">{figure}</g> : figure}
    </svg>
  );
};

/** 眉毛颜色以发色为基础 */
const HAIR_FALLBACK = (hair: string) => (/^#[0-9a-f]{6}$/i.test(hair) ? hair : '#2b2b2b');
