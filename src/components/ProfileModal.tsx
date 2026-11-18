import React, { useState } from 'react';
import { ChevronLeft, Trophy } from 'lucide-react';
import { AvatarSelectModal } from './AvatarSelectModal';
import { AboutUs } from './AboutUs';
import { JOB_POSITIONS, readCurrentJobId } from './JobModal';
import { AppUser } from '../lib/bilibiliToy';
import { ProfileHeader } from './profile/ProfileHeader';
import { InfoTab } from './profile/InfoTab';
import { RankTab } from './profile/RankTab';
import { AchievementTab } from './profile/AchievementTab';
import { SettingsTab } from './profile/SettingsTab';
import { CdkeyTab } from './profile/CdkeyTab';
import { NameFreezeModal } from './profile/NameFreezeModal';
import { useNameChange } from './profile/useNameChange';
import { useRankBoard } from './profile/useRankBoard';
import { useCdkey } from './profile/useCdkey';

// 个人中心：名片资料、帝国排行榜与赛季排行、成就与致谢名单、系统设置、礼包兑换、关于我们。
// 各标签页的界面在 profile/ 目录下；需要跨标签页保留的状态由这里持有（改名、排行榜、礼包兑换的状态逻辑见 profile/use*.ts）。

export interface ProfileModalProps {
  onClose: () => void;
  playerName: string;
  setPlayerName: (name: string) => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  equippedClothing: string;
  onOpenAuth?: () => void;
  onLogout?: () => Promise<boolean>;
  onResetLife?: () => void;
  /** 云端存档：返回 true 表示已保存；undefined 表示当前账号不支持云存档 */
  onSaveProgress?: () => Promise<boolean>;
  authUser?: AppUser | null;
  avatarSource: string;
  setAvatarSource: (source: string) => void;
  bilibiliAvatar: string | null;
  setBilibiliAvatar: (avatar: string | null) => void;
  isAvatarModalOpen: boolean;
  setIsAvatarModalOpen: (open: boolean) => void;
  renderAvatarContent: () => React.ReactNode;
  ownedClothes: string[];
  /** 推演积分（推演榜上报） */
  simScore: number;
  reputation: number;
  playerTraits: string[];
  /** 慈善捐款，返回提示文字 */
  onDonate: (amount: number) => string;
  originLabel?: string;
  isRegistered: boolean;
  age: number;
  /** 播放致谢名单（集齐全部成就后可用） */
  onPlayCredits: () => void;
  /** 简洁模式（第 49 题） */
  simpleMode: boolean;
  onToggleSimpleMode: () => void;
  /** 这一世用过简洁模式：排行榜上标「偷懒」 */
  lazy?: boolean;
  /** 测试兑换码（第 57 题），返回提示文字 */
  onRedeemTestCode?: () => string;
  /** 本赛季成绩（第 55 题） */
  seasonMine?: { score: number; completedMs: number | null; lazy: boolean; achieved: number; total: number };
  canRankSeason?: boolean;
}

export const ProfileModal = ({
  onClose,
  playerName,
  setPlayerName,
  coins,
  setCoins,
  equippedClothing,
  onOpenAuth,
  onLogout,
  onResetLife,
  onSaveProgress,
  authUser,
  avatarSource,
  setAvatarSource,
  bilibiliAvatar,
  setBilibiliAvatar,
  isAvatarModalOpen,
  setIsAvatarModalOpen,
  renderAvatarContent,
  ownedClothes,
  originLabel,
  simScore,
  reputation,
  playerTraits,
  onDonate,
  isRegistered,
  age,
  onPlayCredits,
  simpleMode,
  onToggleSimpleMode,
  lazy = false,
  seasonMine,
  canRankSeason = false,
  onRedeemTestCode,
}: ProfileModalProps) => {
  // 名片资料：读取真实游戏状态（岗位、房产、服装）
  const currentJob = (() => {
    const id = readCurrentJobId();
    return id ? JOB_POSITIONS.find((j) => j.id === id) || null : null;
  })();
  const propertySummary = (() => {
    try {
      const props = JSON.parse(localStorage.getItem('amigo_owned_properties') || '[]');
      if (Array.isArray(props) && props.length > 0) {
        const primary = props.find((p: any) => p.isPrimaryResidence) || props[0];
        return props.length > 1 ? `${primary.title} 等 ${props.length} 套` : primary.title;
      }
      const rental = JSON.parse(localStorage.getItem('amigo_current_rental') || 'null');
      if (rental?.title) return `租住：${rental.title}`;
    } catch (e) {}
    return null;
  })();
  const ownedClothingCount = new Set(ownedClothes).size;

  const [subTab, setSubTab] = useState<'info' | 'rank' | 'achievement' | 'settings' | 'cdkey' | 'about'>('info');
  const [copiedUid, setCopiedUid] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Settings States
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [highFps, setHighFps] = useState(true);

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const nameChange = useNameChange({ playerName, setPlayerName, setBilibiliAvatar, setAvatarSource, showToast });
  const rank = useRankBoard({ subTab, coins, playerName, simScore, showToast });
  const cdkey = useCdkey({ setCoins, showToast, onRedeemTestCode });

  // Real UID calculation logic: Firebase UID or persistent local/bilibili UID
  const fullUid = authUser?.uid
    ? authUser.uid
    : (function() {
        try {
          let local = localStorage.getItem('amigo_local_uid');
          if (!local) {
            local = String(Math.floor(10000000 + Math.random() * 90000000));
            localStorage.setItem('amigo_local_uid', local);
          }
          return local;
        } catch (e) {
          return '88492015';
        }
      })();

  const displayUid = authUser?.uid
    ? (authUser.uid.length > 8 ? authUser.uid.substring(0, 8).toUpperCase() : authUser.uid)
    : fullUid;

  const handleCopyUid = () => {
    navigator.clipboard?.writeText(fullUid);
    setCopiedUid(true);
    showToast(`已复制真实完整 UID: ${fullUid}`);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  return (
    <div className="absolute inset-0 bg-[#252632] flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-200 overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-yellow-300 border-2 border-yellow-500 text-xs font-black px-4 py-2 rounded-xl shadow-[0_4px_0_#000] animate-in fade-in slide-in-from-top-2 duration-200 text-center max-w-[85%]">
          {toast}
        </div>
      )}

      {/* Top Banner Curtain Bar */}
      <div className="relative w-full h-16 z-20 drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] flex-shrink-0">
        <div className="absolute inset-0 flex">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? 'bg-[#0f4b99]' : 'bg-[#1553a6]'} relative`}>
               <div className={`absolute -bottom-4 left-0 w-full h-8 rounded-b-full ${i % 2 === 0 ? 'bg-[#0f4b99]' : 'bg-[#1553a6]'}`}></div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center px-4 pt-1 z-30">
          <button onClick={onClose} className="p-1.5 bg-[#0f4b99] border-2 border-[#072a66] rounded-xl active:scale-95 shadow-[0_2px_0_#072a66] cursor-pointer">
            <ChevronLeft size={24} className="text-white drop-shadow-md" strokeWidth={3} />
          </button>
          <div className="flex-1 flex justify-center items-center -ml-10 pointer-events-none">
             <span className="text-white text-3xl font-black tracking-widest" style={{ textShadow: '-2px -2px 0 #072a66, 2px -2px 0 #072a66, -2px 2px 0 #072a66, 2px 2px 0 #072a66, 0 4px 6px rgba(0,0,0,0.6)' }}>
               个人中心
             </span>
          </div>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-28 pt-6 px-4 space-y-4">
        {/* User Identity Header Card */}
        <ProfileHeader
          nameChange={nameChange}
          playerName={playerName}
          isRegistered={isRegistered}
          age={age}
          authUser={authUser}
          onOpenAuth={onOpenAuth}
          setIsAvatarModalOpen={setIsAvatarModalOpen}
          renderAvatarContent={renderAvatarContent}
          reputation={reputation}
          simScore={simScore}
          currentJob={currentJob}
          displayUid={displayUid}
          fullUid={fullUid}
          copiedUid={copiedUid}
          handleCopyUid={handleCopyUid}
          ownedClothingCount={ownedClothingCount}
        />

        {/* Navigation Tabs */}
        <div className="grid grid-cols-6 bg-[#21232e] p-1 rounded-xl border-2 border-black gap-1 shadow-[0_2px_0_#000]">
          <button
            onClick={() => setSubTab('info')}
            className={`py-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer truncate ${
              subTab === 'info'
                ? 'bg-yellow-400 text-black border-black shadow-[0_1px_0_#000]'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            名片资料
          </button>
          <button
            onClick={() => setSubTab('rank')}
            className={`py-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer truncate flex items-center justify-center gap-0.5 ${
              subTab === 'rank'
                ? 'bg-yellow-400 text-black border-black shadow-[0_1px_0_#000]'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <Trophy size={11} className={subTab === 'rank' ? 'text-black' : 'text-yellow-400'} />
            <span>排行榜</span>
          </button>
          <button
            onClick={() => setSubTab('achievement')}
            className={`py-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer truncate ${
              subTab === 'achievement'
                ? 'bg-yellow-400 text-black border-black shadow-[0_1px_0_#000]'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            成就勋章
          </button>
          <button
            onClick={() => setSubTab('settings')}
            className={`py-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer truncate ${
              subTab === 'settings'
                ? 'bg-yellow-400 text-black border-black shadow-[0_1px_0_#000]'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            系统设置
          </button>
          <button
            onClick={() => setSubTab('cdkey')}
            className={`py-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer truncate ${
              subTab === 'cdkey'
                ? 'bg-yellow-400 text-black border-black shadow-[0_1px_0_#000]'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            礼包兑换
          </button>
          <button
            onClick={() => setSubTab('about')}
            className={`py-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer truncate ${
              subTab === 'about'
                ? 'bg-yellow-400 text-black border-black shadow-[0_1px_0_#000]'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            关于我们
          </button>
        </div>

        {/* Tab 1: 名片资料 (Profile Info) */}
        {subTab === 'info' && (
          <InfoTab
            originLabel={originLabel}
            currentJob={currentJob}
            propertySummary={propertySummary}
            playerTraits={playerTraits}
            reputation={reputation}
            onDonate={onDonate}
            showToast={showToast}
            couponLeft={cdkey.couponLeft}
            couponRedeemed={cdkey.couponRedeemed}
          />
        )}

        {/* Tab 2: 帝国排行榜 (Rank List with Toy SDK) */}
        {subTab === 'rank' && (
          <RankTab
            rank={rank}
            handleSyncBilibiliProfile={nameChange.handleSyncBilibiliProfile}
            playerName={playerName}
            lazy={lazy}
            coins={coins}
            simScore={simScore}
            bilibiliAvatar={bilibiliAvatar}
            seasonMine={seasonMine}
            canRankSeason={canRankSeason}
          />
        )}

        {/* 成就勋章：完成时间为现实时间，跨人生保留 */}
        {subTab === 'achievement' && <AchievementTab onPlayCredits={onPlayCredits} />}

        {/* Tab 3: 系统设置 (Settings) */}
        {subTab === 'settings' && (
          <SettingsTab
            simpleMode={simpleMode}
            onToggleSimpleMode={onToggleSimpleMode}
            onSaveProgress={onSaveProgress}
            onResetLife={onResetLife}
            setCoins={setCoins}
            onClose={onClose}
            onLogout={onLogout}
            showToast={showToast}
            bgmEnabled={bgmEnabled}
            setBgmEnabled={setBgmEnabled}
            sfxEnabled={sfxEnabled}
            setSfxEnabled={setSfxEnabled}
            highFps={highFps}
            setHighFps={setHighFps}
            confirmReset={confirmReset}
            setConfirmReset={setConfirmReset}
            confirmLogout={confirmLogout}
            setConfirmLogout={setConfirmLogout}
          />
        )}

        {/* Tab 4: 礼包兑换 (CDKey) */}
        {/* Tab 6: 关于我们 */}
        {subTab === 'about' && <AboutUs />}

        {subTab === 'cdkey' && <CdkeyTab cdkey={cdkey} />}

        {/* Footer info */}
        <div className="text-center text-gray-500 text-[10px] font-bold pt-2">
          AmiGO Lite v1.2.0 · 玩家 UID: {displayUid}
        </div>
      </div>

      {/* 政治与合规敏感词警告/冻结改名弹窗 (统一重度黑框/街机游戏UI风格) */}
      <NameFreezeModal nameChange={nameChange} />

      {/* Avatar Selection Modal */}
      <AvatarSelectModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        avatarSource={avatarSource}
        onSelectAvatar={(src) => {
          setAvatarSource(src);
          try { localStorage.setItem('amigo_avatar_source', src); } catch (e) {}
          showToast('头像设置已修改！');
        }}
        authUser={authUser}
        bilibiliAvatar={bilibiliAvatar}
        equippedClothing={equippedClothing}
      />
    </div>
  );
};
