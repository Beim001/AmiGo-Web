import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Game } from '../hooks/useGameState';
import type { OverlayId, Overlays } from '../hooks/useOverlays';
import type { useCloudSave } from '../lib/cloudSave';
import type { useSeason } from '../hooks/useSeason';
import type { useAntibodies } from '../hooks/useAntibodies';
import type { useAvatar } from '../hooks/useAvatar';
import type { AppUser } from '../lib/bilibiliToy';
import type { SocialClass } from '../lib/lineage';
import type { FamilyOrigin } from '../lib/family';
import type { DiseaseInfo } from '../lib/disease';
import type { Appearance } from '../lib/appearance';
import { addHeirloom, buildFamilyMembers } from '../lib/family';
import { antibodyNames } from '../lib/disease';
import { unlockAchievement } from '../lib/achievements';
import { isMinor } from '../lib/monthly';
import { findFinanceBackground } from '../lib/stockMarket';
import { TICKET_PRICE, raiseBid, buyoutLot, passLot, normalizeLot, heirloomById } from '../lib/heirlooms';
import { addLifeLog } from '../lib/lifeLog';
import { CURRENCY } from '../data/seasons';
import { BirthModal } from './BirthModal';
import { CalendarModal } from './CalendarModal';
import { HospitalModal } from './HospitalModal';
import { LeisureModal } from './LeisureModal';
import { CourtModal } from './CourtModal';
import { PrisonModal } from './PrisonModal';
import { LicenseModal } from './LicenseModal';
import { WelfareModal } from './WelfareModal';
import { BankModal } from './BankModal';
import { StockModal } from './StockModal';
import { WealthChartModal } from './WealthChartModal';
import { GenderRightsModal } from './GenderRightsModal';
import { ProfileModal } from './ProfileModal';
import { ShopModal } from './ShopModal';
import { JobModal, JOB_POSITIONS, readJobHistoryIds } from './JobModal';
import { HousingModal } from './HousingModal';
import { VisaModal } from './VisaModal';
import { ImmigrationModal } from './ImmigrationModal';
import { MarriageModal } from './MarriageModal';
import { AuctionModal } from './AuctionModal';
import { AuthModal } from './AuthModal';

/**
 * 渲染当前打开的全屏弹窗（见 useOverlays），按打开顺序叠放。
 * 弹窗所需的游戏状态从 game 读取；跨弹窗或会改动多处状态的操作由 App 以回调传入。
 */
export interface OverlayHostProps {
  overlays: Overlays;
  game: Game;
  authUser: AppUser | null;
  setAuthUser: (user: AppUser | null) => void;
  cloud: ReturnType<typeof useCloudSave>;
  seasonMine: ReturnType<typeof useSeason>;
  antibodyActions: ReturnType<typeof useAntibodies>;
  currentAge: number;
  playerOccupation: string;
  familyClass: SocialClass;
  familyOrigin: FamilyOrigin;
  currentDisease: DiseaseInfo | null;
  simpleMode: boolean;
  setSimpleMode: React.Dispatch<React.SetStateAction<boolean>>;
  usedSimpleMode: boolean;
  fertilityText: string;
  handleMaintenance: (target: 'self' | 'spouse') => string;
  avatar: ReturnType<typeof useAvatar>;
  showToast: (msg: string) => void;
  setActiveTab: (tab: string) => void;
  changeReputation: (delta: number) => void;
  jailPlayer: (crime: string, months: number) => string;
  playCredits: () => void;
  activateGodMode: () => string;
  handleNextMonth: () => void;
  handleRegisterBirth: (name: string, preferredSurname?: string, appearance?: Appearance) => { gender: string; age: number; classLabel?: string; surname?: string; name?: string };
  handleResetLife: () => void;
  handleLogout: () => Promise<boolean>;
  handleDonate: (amount: number) => string;
}

export const OverlayHost: React.FC<OverlayHostProps> = (props) => {
  const { t } = useTranslation('app');
  const {
    overlays,
    game,
    authUser,
    setAuthUser,
    cloud,
    seasonMine,
    antibodyActions,
    currentAge,
    playerOccupation,
    familyClass,
    familyOrigin,
    currentDisease,
    simpleMode,
    setSimpleMode,
    usedSimpleMode,
    fertilityText,
    handleMaintenance,
    showToast,
    setActiveTab,
    changeReputation,
    jailPlayer,
    handleNextMonth,
    handleLogout,
  } = props;
  const { isRegistered, gender, playerName, coins, health, gameYear, gameMonth, equippedClothing, ownedClothes, freeDrawUsed, bankDeposit, bankLoan, family, playerTraits, reputation, simScore, auction, appearance, antibodies } = game.state;
  const { setGender, setPlayerName, setCoins, setHealth, setEquippedClothing, setOwnedClothes, setFreeDrawUsed, setBankDeposit, setBankLoan, setFamily, setDisease, setAuction, setAppearance, setGiftInventory } = game.setters;
  const { open, close, swap } = overlays;

  const render = (id: OverlayId): React.ReactNode => {
    switch (id) {
      case 'birth':
        return (
          <BirthModal
            onClose={() => close('birth')}
            isRegistered={isRegistered}
            playerName={playerName}
            setPlayerName={setPlayerName}
            gender={gender}
            age={currentAge}
            gameYear={gameYear}
            gameMonth={gameMonth}
            coins={coins}
            setCoins={setCoins}
            health={health}
            setHealth={setHealth}
            onRegisterBirth={props.handleRegisterBirth}
            onOpenGender={() => swap('birth', 'gender')}
            onOpenHousing={() => swap('birth', 'housing')}
            onOpenVisa={() => swap('birth', 'visa')}
          />
        );
      case 'calendar':
        return <CalendarModal onClose={() => close('calendar')} gameYear={gameYear} gameMonth={gameMonth} onNextMonth={handleNextMonth} coins={coins} />;
      case 'hospital':
        return (
          <HospitalModal
            onClose={() => close('hospital')}
            coins={coins}
            setCoins={setCoins}
            health={health}
            setHealth={setHealth}
            parentsPay={isRegistered && isMinor(currentAge) && familyClass.parentsPayMedical}
            disease={currentDisease}
            onCureDisease={() => {
              if (currentDisease && antibodyActions.gainRecoveryImmunity(currentDisease.id)) showToast(t('toast.immunity', { disease: currentDisease.name }));
              setDisease(null);
              unlockAchievement('cured');
            }}
            vaccines={antibodyActions.vaccineList}
            antibodyText={antibodies.length ? antibodyNames(antibodies).join(t('listSeparator', { ns: 'common' })) : t('noAntibodies')}
            onVaccinate={antibodyActions.handleVaccinate}
            onMaintenance={handleMaintenance}
            hasSpouse={!!family.spouse}
            fertilityText={fertilityText}
          />
        );
      case 'leisure':
        return (
          <LeisureModal
            onClose={() => close('leisure')}
            coins={coins}
            setCoins={setCoins}
            health={health}
            setHealth={setHealth}
            changeReputation={changeReputation}
            isRegistered={isRegistered}
            age={currentAge}
            gameYear={gameYear}
            gameMonth={gameMonth}
            onJail={jailPlayer}
          />
        );
      case 'court':
        return (
          <CourtModal
            onClose={() => close('court')}
            coins={coins}
            setCoins={setCoins}
            reputation={reputation}
            isRegistered={isRegistered}
            gameYear={gameYear}
            gameMonth={gameMonth}
          />
        );
      case 'prison':
        return <PrisonModal onClose={() => close('prison')} coins={coins} setCoins={setCoins} isRegistered={isRegistered} gameYear={gameYear} gameMonth={gameMonth} />;
      case 'license':
        return (
          <LicenseModal
            onClose={() => close('license')}
            coins={coins}
            setCoins={setCoins}
            changeReputation={changeReputation}
            isRegistered={isRegistered}
            age={currentAge}
            gameYear={gameYear}
          />
        );
      case 'welfare':
        return (
          <WelfareModal
            onClose={() => close('welfare')}
            coins={coins}
            setCoins={setCoins}
            health={health}
            setHealth={setHealth}
            bankDeposit={bankDeposit}
            isRegistered={isRegistered}
            gameYear={gameYear}
            gameMonth={gameMonth}
          />
        );
      case 'bank':
        return (
          <BankModal
            onClose={() => close('bank')}
            coins={coins}
            setCoins={setCoins}
            bankDeposit={bankDeposit}
            setBankDeposit={setBankDeposit}
            bankLoan={bankLoan}
            setBankLoan={setBankLoan}
            onOpenWealthChart={() => open('wealthChart')}
            gameYear={gameYear}
          />
        );
      case 'stock':
        return (
          <StockModal
            onClose={() => close('stock')}
            coins={coins}
            setCoins={setCoins}
            financeBackground={findFinanceBackground(
              {
                jobIds: readJobHistoryIds(),
                playerName,
                familyMembers: buildFamilyMembers(family, {
                  playerName,
                  playerGender: gender,
                  playerAge: currentAge,
                  playerOccupation,
                  gameYear,
                  gameMonth,
                }).filter((m) => !m.isPlayer && m.status !== '已故'),
              },
              (jobId) => JOB_POSITIONS.find((j) => j.id === jobId)?.title,
            )}
          />
        );
      case 'wealthChart':
        return (
          <WealthChartModal
            onClose={() => close('wealthChart')}
            coins={coins}
            bankDeposit={bankDeposit}
            bankLoan={bankLoan}
            onOpenBank={() => swap('wealthChart', 'bank')}
            onOpenStock={() => swap('wealthChart', 'stock')}
            onOpenHousing={() => swap('wealthChart', 'housing')}
          />
        );
      case 'gender':
        return (
          <GenderRightsModal
            onClose={() => close('gender')}
            isRegistered={isRegistered}
            playerName={playerName}
            gender={gender}
            setGender={(newGender) => {
              setGender(newGender);
              try {
                localStorage.setItem('amigo_gender', newGender);
              } catch (e) {}
            }}
            age={currentAge}
            coins={coins}
            setCoins={setCoins}
            gameYear={gameYear}
            onOpenBirth={() => swap('gender', 'birth')}
          />
        );
      case 'profile':
        return (
          <ProfileModal
            onClose={() => close('profile')}
            playerName={playerName}
            setPlayerName={setPlayerName}
            coins={coins}
            setCoins={setCoins}
            equippedClothing={equippedClothing}
            onOpenAuth={() => swap('profile', 'auth')}
            onLogout={handleLogout}
            onResetLife={props.handleResetLife}
            onSaveProgress={cloud.enabled ? cloud.saveNow : undefined}
            authUser={authUser}
            avatarSource={props.avatar.avatarSource}
            setAvatarSource={props.avatar.setAvatarSource}
            bilibiliAvatar={props.avatar.bilibiliAvatar}
            setBilibiliAvatar={props.avatar.setBilibiliAvatar}
            isAvatarModalOpen={props.avatar.isAvatarModalOpen}
            setIsAvatarModalOpen={props.avatar.setIsAvatarModalOpen}
            renderAvatarContent={props.avatar.renderAvatarContent}
            ownedClothes={ownedClothes}
            isRegistered={isRegistered}
            age={currentAge}
            originLabel={isRegistered ? t('originLabel', { classLabel: familyOrigin.classLabel, surname: familyOrigin.surname }) : t('notRegistered')}
            simScore={simScore}
            reputation={reputation}
            playerTraits={playerTraits}
            onDonate={props.handleDonate}
            onPlayCredits={() => props.playCredits()}
            simpleMode={simpleMode}
            onToggleSimpleMode={() => {
              setSimpleMode((v) => !v);
              close('profile');
            }}
            lazy={usedSimpleMode}
            seasonMine={seasonMine}
            canRankSeason={cloud.enabled && !seasonMine.cheat}
            onRedeemTestCode={props.activateGodMode}
          />
        );
      case 'shop':
        return (
          <ShopModal
            onClose={() => close('shop')}
            coins={coins}
            setCoins={setCoins}
            ownedClothes={ownedClothes}
            setOwnedClothes={setOwnedClothes}
            equippedClothing={equippedClothing}
            setEquippedClothing={setEquippedClothing}
            freeDrawUsed={freeDrawUsed}
            setFreeDrawUsed={setFreeDrawUsed}
            setGiftInventory={setGiftInventory}
            appearance={appearance}
            setAppearance={setAppearance}
            playerAge={currentAge}
            playerGender={gender}
            isRegistered={isRegistered}
          />
        );
      case 'job':
        return (
          <JobModal
            onClose={() => close('job')}
            coins={coins}
            setCoins={setCoins}
            age={currentAge}
            childLaborAllowed={isRegistered && familyClass.childLabor}
            gameYear={gameYear}
            gameMonth={gameMonth}
          />
        );
      case 'housing':
        return (
          <HousingModal
            onClose={() => close('housing')}
            coins={coins}
            setCoins={setCoins}
            gameYear={gameYear}
            gameMonth={gameMonth}
            isRegistered={isRegistered}
            playerName={playerName}
            health={health}
            setHealth={setHealth}
            onOpenBirth={() => swap('housing', 'birth')}
          />
        );
      case 'visa':
        return (
          <VisaModal
            onClose={() => close('visa')}
            coins={coins}
            setCoins={setCoins}
            gameYear={gameYear}
            gameMonth={gameMonth}
            isRegistered={isRegistered}
            playerName={playerName}
            health={health}
            setHealth={setHealth}
            onOpenBirth={() => swap('visa', 'birth')}
          />
        );
      case 'immigrate':
        return (
          <ImmigrationModal
            onClose={() => close('immigrate')}
            coins={coins}
            setCoins={setCoins}
            gameYear={gameYear}
            gameMonth={gameMonth}
            isRegistered={isRegistered}
            playerName={playerName}
            health={health}
            setHealth={setHealth}
            onOpenBirth={() => swap('immigrate', 'birth')}
          />
        );
      case 'marriage':
        return (
          <MarriageModal
            onClose={() => close('marriage')}
            isRegistered={isRegistered}
            isDeceased={isRegistered && health <= 0}
            playerName={playerName}
            age={currentAge}
            playerGender={gender}
            coins={coins}
            setCoins={setCoins}
            gameYear={gameYear}
            gameMonth={gameMonth}
            family={family}
            setFamily={setFamily}
            onOpenBirth={() => swap('marriage', 'birth')}
            onOpenFamily={() => {
              close('marriage');
              setActiveTab('map');
            }}
            classId={familyClass.id}
            onReputationChange={changeReputation}
          />
        );
      case 'auction':
        if (!auction) return null;
        return (
          <AuctionModal
            auction={auction}
            coins={coins}
            onClose={() => close('auction')}
            onBuyTicket={() => {
              if (auction.admitted) return t('auction.alreadyAdmitted');
              if (coins < TICKET_PRICE) return t('auction.ticketNoMoney', { price: TICKET_PRICE.toLocaleString(), symbol: CURRENCY.symbol });
              setCoins((c) => c - TICKET_PRICE);
              setAuction({ ...auction, admitted: true });
              return t('auction.ticketBought', { price: TICKET_PRICE.toLocaleString(), symbol: CURRENCY.symbol });
            }}
            onAction={(i, action) => {
              const lot = auction.lots[i];
              if (!lot) return t('auction.lotMissing');
              const h = heirloomById(lot.heirloomId);
              const update = (next: typeof lot) => setAuction({ ...auction, lots: auction.lots.map((l, idx) => (idx === i ? next : l)) });
              if (action.type === 'pass') {
                update(passLot(lot));
                return t('auction.passed', { name: h?.name ?? t('auction.lotFallbackName') });
              }
              const want = action.type === 'buyout' ? normalizeLot(lot).buyout : action.amount;
              if (!Number.isFinite(want) || want <= 0) return t('auction.bidRequired');
              if (want > coins) return t('auction.bidNoMoney', { want: want.toLocaleString(), coins: coins.toLocaleString(), symbol: CURRENCY.symbol });
              const res = action.type === 'buyout' ? buyoutLot(lot) : raiseBid(lot, want);
              if (res.outcome === 'error') return res.error ?? t('auction.bidInvalid');
              update(res.lot);
              if (res.outcome === 'outbid') return t('auction.outbid', { price: (res.lot.currentPrice ?? 0).toLocaleString(), symbol: CURRENCY.symbol });
              const paid = res.lot.paid ?? want;
              setCoins((c) => c - paid);
              setFamily((prev) => addHeirloom(prev, { id: lot.heirloomId, source: '拍卖会', year: gameYear, month: gameMonth, keeper: '当家人' }));
              addLifeLog('财富', `拍得传家宝：${h?.name ?? ''}`, `在北城拍卖会以 ${paid.toLocaleString()} ${CURRENCY.symbol} ${action.type === 'buyout' ? '一口价买下' : '落槌拍得'}。`);
              return t(action.type === 'buyout' ? 'auction.wonBuyout' : 'auction.wonHammer', { paid: paid.toLocaleString(), symbol: CURRENCY.symbol, name: h?.name ?? '' });
            }}
          />
        );
      case 'auth':
        return (
          <AuthModal
            onClose={() => close('auth')}
            currentUser={authUser}
            onUserChange={(user) => setAuthUser(user)}
            setPlayerName={setPlayerName}
            onLogout={async () => {
              if (!(await handleLogout())) showToast(t('toast.logoutSyncFailed'));
            }}
          />
        );
    }
  };

  return (
    <>
      {overlays.stack.map((id) => (
        <React.Fragment key={id}>{render(id)}</React.Fragment>
      ))}
    </>
  );
};
