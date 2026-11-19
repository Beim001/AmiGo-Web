import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Game } from '../hooks/useGameState';
import type { Overlays } from '../hooks/useOverlays';
import type { useSimpleMode } from '../hooks/useSimpleMode';
import type { AppUser } from '../lib/bilibiliToy';
import type { SocialClass } from '../lib/lineage';
import type { FamilyOrigin } from '../lib/family';
import type { DiseaseInfo } from '../lib/disease';
import type { Resolution } from '../lib/simEvents';
import type { rankFamilies } from '../lib/familyRank';
import { getHeirlooms } from '../lib/family';
import { readChildJob } from '../lib/lineage';
import { readLifeLog } from '../lib/lifeLog';
import { MAINTENANCE_COST } from '../lib/traits';
import { JOB_POSITIONS, readCurrentJobId } from './JobModal';
import { SimpleModeView } from './SimpleModeView';
import { TopBar } from './TopBar';
import { RoleTab } from './RoleTab';
import { FunctTab } from './FunctTab';
import { SimTab } from './SimTab';
import { LogTab } from './LogTab';
import { FamilyTab } from './FamilyTab';
import { BottomNav } from './BottomNav';

/**
 * 游戏主界面：简洁模式下是一屏视图，完整模式下是顶部栏、当前标签页与底部导航。
 * 打开弹窗都经由 overlays；推进月份、处理推演、传位等会改动多处状态的操作由 App 以回调传入。
 */
export interface GameWorkspaceProps {
  game: Game;
  overlays: Overlays;
  simple: ReturnType<typeof useSimpleMode>;
  simpleMode: boolean;
  setSimpleMode: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  authUser: AppUser | null;
  avatarContent: React.ReactNode;
  currentAge: number;
  playerOccupation: string;
  familyClass: SocialClass;
  familyOrigin: FamilyOrigin;
  currentDisease: DiseaseInfo | null;
  familyRanking: ReturnType<typeof rankFamilies>;
  familyCohesion: number;
  familyWealth: number;
  showToast: (msg: string) => void;
  onOpenSuccession: () => void;
  handleNextMonth: () => void;
  handleResetLife: () => void;
  handleSimResolve: (uid: string, optionIndex: number) => Resolution | null;
  handleRetire: (heirId: string) => string | null;
}

export const GameWorkspace: React.FC<GameWorkspaceProps> = (props) => {
  const { t } = useTranslation('app');
  const { game, overlays, simple, currentAge, familyClass, familyOrigin, currentDisease, showToast, onOpenSuccession, handleNextMonth } = props;
  const { isRegistered, gender, playerName, coins, health, gameYear, gameMonth, equippedClothing, bankDeposit, family, playerTraits, reputation, guardianship, simEvents, simScore, simQuiet, auction, appearance, giftInventory, antibodies } = game.state;
  const { setCoins, setHealth, setFamily, setGiftInventory } = game.setters;
  const { open } = overlays;
  const auctionOpen = !!auction && auction.year === gameYear && auction.month === gameMonth;

  if (props.simpleMode) {
    return (
      <SimpleModeView
        isRegistered={isRegistered}
        name={playerName}
        age={currentAge}
        health={health}
        coins={coins}
        deposit={bankDeposit}
        year={gameYear}
        month={gameMonth}
        familyLabel={isRegistered ? t('familyLabel', { surname: familyOrigin.surname, classLabel: familyClass.label }) : ''}
        diseaseName={currentDisease?.name ?? null}
        jobTitle={(() => {
          const id = readCurrentJobId();
          const j = id ? JOB_POSITIONS.find((x) => x.id === id) : null;
          return j ? j.title : readChildJob()?.title ?? null;
        })()}
        spouseName={family.spouse?.name ?? null}
        childrenCount={family.children.length}
        recent={readLifeLog().slice(-6).reverse().map((e) => ({ title: `${e.year}.${e.month} ${e.title}`, detail: e.desc }))}
        lastSummary={[...simple.simpleAutoNotes, ...simple.simpleMonthNotes]}
        card={simple.simpleCard}
        onChoose={simple.handleSimpleChoose}
        onLater={simple.handleSimpleLater}
        onNextMonth={simple.handleSimpleNextMonth}
        stockOpened={simple.stockOpenedNow}
        stockValue={simple.simpleStock.value}
        onBuyStocks={simple.handleSimpleBuyStocks}
        onSellStocks={simple.handleSimpleSellStocks}
        onRegister={() => open('birth')}
        onExit={() => {
          simple.setSimpleRemaining(0);
          props.setSimpleMode(false);
        }}
        advanceRemaining={simple.simpleRemaining}
        onAdvance={(n) => simple.setSimpleRemaining(n)}
        onStopAdvance={() => simple.setSimpleRemaining(0)}
        maintenanceCost={MAINTENANCE_COST}
        fertilityText={simple.fertilityText}
        onMaintenance={() => showToast(simple.handleMaintenance('self'))}
      />
    );
  }

  return (
    <>
      <TopBar
        coins={coins}
        playerName={playerName}
        onOpenProfile={() => open('profile')}
        onOpenBank={() => open('bank')}
        onOpenWealthChart={() => open('wealthChart')}
        onOpenAuth={() => open('auth')}
        authUser={props.authUser}
        avatarContent={props.avatarContent}
      />

      {props.activeTab === 'role' && (
        <RoleTab
          onOpenShop={() => open('shop')}
          onOpenBank={() => open('bank')}
          onOpenWealthChart={() => open('wealthChart')}
          onOpenHospital={() => open('hospital')}
          onOpenGender={() => open('gender')}
          onOpenCalendar={() => open('calendar')}
          onNextMonth={handleNextMonth}
          onGoToBirthRegistration={() => open('birth')}
          equippedClothing={equippedClothing}
          coins={coins}
          health={health}
          gameYear={gameYear}
          gameMonth={gameMonth}
          isRegistered={isRegistered}
          gender={gender}
          age={currentAge}
          appearance={appearance}
          childrenCount={family.children.length}
          diseaseName={currentDisease?.name}
          onOpenSuccession={onOpenSuccession}
        />
      )}
      {props.activeTab === 'bag' && (
        <FunctTab
          onOpenBank={() => open('bank')}
          onOpenStock={() => open('stock')}
          onOpenHospital={() => open('hospital')}
          onOpenJob={() => open('job')}
          onOpenWelfare={() => open('welfare')}
          onOpenLicense={() => open('license')}
          onOpenLeisure={() => open('leisure')}
          onOpenPrison={() => open('prison')}
          onOpenCourt={() => open('court')}
          onOpenBirth={() => open('birth')}
          onOpenGender={() => open('gender')}
          onOpenHousing={() => open('housing')}
          onOpenVisa={() => open('visa')}
          onOpenImmigrate={() => open('immigrate')}
          onOpenMarriage={() => open('marriage')}
        />
      )}
      {props.activeTab === 'combat' && (
        <SimTab
          isRegistered={isRegistered}
          health={health}
          age={currentAge}
          playerName={playerName}
          gameYear={gameYear}
          gameMonth={gameMonth}
          onGoToBirthRegistration={() => open('birth')}
          onResetLife={props.handleResetLife}
          onOpenSuccession={onOpenSuccession}
          events={simEvents}
          coins={coins}
          simScore={simScore}
          quietMessage={simQuiet}
          onResolve={props.handleSimResolve}
          auctionOpen={auctionOpen}
          onOpenAuction={() => open('auction')}
        />
      )}
      {props.activeTab === 'log' && <LogTab isRegistered={isRegistered} />}
      {props.activeTab === 'map' && (
        <FamilyTab
          isRegistered={isRegistered}
          playerName={playerName}
          gender={gender}
          age={currentAge}
          playerOccupation={props.playerOccupation}
          gameYear={gameYear}
          gameMonth={gameMonth}
          coins={coins}
          setCoins={setCoins}
          setHealth={setHealth}
          family={family}
          setFamily={setFamily}
          onOpenMarriage={() => open('marriage')}
          onGoToBirthRegistration={() => open('birth')}
          playerTraits={playerTraits}
          reputation={reputation}
          ranking={props.familyRanking}
          cohesion={props.familyCohesion}
          wealth={props.familyWealth}
          guardianship={guardianship}
          heirlooms={getHeirlooms(family)}
          giftInventory={giftInventory}
          lazy={simple.usedSimpleMode}
          playerAntibodies={antibodies}
          onRetireTo={props.handleRetire}
          playerAppearance={appearance}
          equippedClothing={equippedClothing}
          setGiftInventory={setGiftInventory}
          auctionOpen={auctionOpen}
          onOpenAuction={() => open('auction')}
        />
      )}

      <BottomNav activeTab={props.activeTab} setActiveTab={props.setActiveTab} />
    </>
  );
};
