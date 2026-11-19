import { useTranslation } from 'react-i18next';
import type { Game } from './useGameState';
import { INITIAL_FAMILY_STATE, FOUNDER_START_HEALTH } from '../lib/family';
import { randomTraits, withBirthPrivilege, traitNames } from '../lib/traits';
import { Appearance, randomAppearance, rollBeauty, applyBeauty } from '../lib/appearance';
import { rollClass, generateOrigin, CHILD_JOB_KEY, rollPlayerLifespan } from '../lib/lineage';
import { applySurname } from '../lib/names';
import { buildDefaultAccounts, saveAccounts as persistBankAccounts } from '../lib/bank';
import { addLifeLog, clearLifeLog } from '../lib/lifeLog';
import { unlockAchievement } from '../lib/achievements';
import { saveStored } from '../lib/storage';
import { CLOTHING_COUPON_KEY } from '../lib/clothingCoupon';
import { SETTINGS_KEY } from '../lib/settings';

// 重置人生时保留的存档键（账号级数据，不属于某一段人生）
// 赛季进度与成就一样跨人生保留（第 55 题）；服饰与服饰 7 折券属于账号、系统设置属于设备，重置人生不清空
const KEYS_KEPT_ON_RESET = new Set(['amigo_owned_clothes', 'amigo_equipped_clothing', CLOTHING_COUPON_KEY, SETTINGS_KEY, 'amigo_simple_mode', 'amigo_active_user', 'amigo_local_uid', 'amigo_redeemed_codes', 'amigo_achievements', 'amigo_credits_seen', 'amigo_credits_rank', 'amigo_gifts_given', 'amigo_season_id', 'amigo_season_joined_at', 'amigo_season_sim_points', 'amigo_season_lazy', 'amigo_season_cheat']);

/**
 * 一段人生的开始与结束：出生登记（随机家族出身、特质、外貌与寿命）和重置人生（清空本段人生的存档，保留账号级数据）。
 * 其他 hook 持有的、也要随重置清空的状态（头像、简洁模式记录等）由 onReset 负责。
 */
export const useLifeCycle = ({
  game,
  showToast,
  onRegistered,
  onReset,
}: {
  game: Game;
  showToast: (msg: string) => void;
  /** 出生登记完成后调用（例如简洁模式下关掉登记弹窗） */
  onRegistered: () => void;
  /** 重置人生时调用，清空其他 hook 持有的状态 */
  onReset: () => void;
}) => {
  const { t } = useTranslation('app');
  const { gameYear, gameMonth } = game.state;
  const {
    setIsRegistered,
    setGender,
    setBirthRegisteredYear,
    setPlayerName,
    setCoins,
    setHealth,
    setGameYear,
    setGameMonth,
    setFreeDrawUsed,
    setBankDeposit,
    setBankLoan,
    setFamily,
    setDisease,
    setPlayerTraits,
    setReputation,
    setGuardianship,
    setCharity,
    setSimEvents,
    setSimScore,
    setSimQuiet,
    setAppearance,
    setPlayerLifespan,
    setAntibodies,
    setGodMode,
  } = game.setters;

  const handleRegisterBirth = (name: string, preferredSurname = '', chosenAppearance?: Appearance) => {
    const generatedGender = Math.random() > 0.5 ? '男' : '女';
    // 随机家族出身（undefined.md 第 18 题）：决定起始资产、父母家条件与家族成员
    // 第 56 题：家族沿用玩家填写的姓，留空则随机；皇族只有纳海王朝
    const cls = rollClass();
    const origin = generateOrigin(cls, Math.random, gameYear, preferredSurname);
    setFamily({ ...INITIAL_FAMILY_STATE, origin, startHealth: FOUNDER_START_HEALTH });
    // 第 73 题：初代当家人起始健康 50，之后每传一代叠加
    setHealth(FOUNDER_START_HEALTH);
    setCoins(cls.startCash);
    const bankTotals = persistBankAccounts(buildDefaultAccounts(cls.startDeposit, 0));
    setBankDeposit(bankTotals.deposit);
    setBankLoan(bankTotals.loan);
    setDisease(null);
    try {
      localStorage.removeItem(CHILD_JOB_KEY);
    } catch (e) {}
    setIsRegistered(true);
    setGender(generatedGender);
    setBirthRegisteredYear(gameYear);
    // 登记后把名字里的姓换成出身家族的姓
    const finalName = applySurname(name, origin.surname);
    setPlayerName(finalName);
    try {
      localStorage.setItem('amigo_is_registered', 'true');
      localStorage.setItem('amigo_gender', generatedGender);
      localStorage.setItem('amigo_birth_registered_year', gameYear.toString());
      localStorage.setItem('amigo_player_name', finalName);
    } catch (e) {}
    clearLifeLog();
    setSimEvents([]);
    // 第 61 题：捏脸结果；天生「倾国倾城」时改用预设外貌
    const beauty = applyBeauty(withBirthPrivilege(cls.id, randomTraits()), rollBeauty(), chosenAppearance ?? randomAppearance(generatedGender as '男' | '女'), generatedGender as '男' | '女');
    const traits = beauty.traits;
    setAppearance(beauty.appearance);
    setPlayerTraits(traits);
    setPlayerLifespan(rollPlayerLifespan(cls.id, traits));
    setAntibodies([]);
    setReputation(cls.startReputation);
    setGuardianship(null);
    addLifeLog('成长', '出生登记', `出生于${cls.label}之家（${origin.surname}家族），性别${generatedGender}，特质：${traitNames(traits).join('、')}。`, { year: gameYear, month: gameMonth, age: 8 });
    unlockAchievement('born');
    onRegistered();
    showToast(t('toast.birthRegistered', { name: finalName, classLabel: cls.label, surname: origin.surname, gender: generatedGender }));
    return { gender: generatedGender, age: 8, classLabel: cls.label, surname: origin.surname, name: finalName };
  };

  const handleResetLife = () => {
    // 1. 重置出生登记与角色身份
    setIsRegistered(false);
    setGender(null);
    setBirthRegisteredYear(1870);
    setPlayerName(t('resetPlayerName'));

    // 2. 其他 hook 的状态（头像等；服饰跟随账号，保留已拥有与已穿戴的服饰）
    onReset();

    // 3. 重置属性与资产
    setCoins(10000);
    setHealth(100);
    setGameYear(1870);
    setGameMonth(1);
    setBankDeposit(500000);
    setBankLoan(0);
    setFreeDrawUsed(false);
    setFamily(INITIAL_FAMILY_STATE);
    setDisease(null);
    setSimEvents([]);
    setSimScore(0);
    setPlayerTraits([]);
    setPlayerLifespan(null);
    setAntibodies([]);
    setGodMode(false);
    setAppearance(null);
    setReputation(0);
    setGuardianship(null);
    setCharity(null);
    setSimQuiet(null);
    clearLifeLog();

    // 4. 清理本地存储中本段人生的全部存档（amigo_* / aminoac_* 前缀），保留账号级数据
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('amigo_') || key.startsWith('aminoac_')) && !KEYS_KEPT_ON_RESET.has(key) && !key.startsWith('amigo_cloud_') && !key.startsWith('amigo_achievements_archive_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (e) {}
    // 显式写入重置后的初始值：若数值本来就等于初始值，持久化 effect 不会再次触发
    saveStored('amigo_coins', 10000);
    saveStored('amigo_health', 100);
    saveStored('amigo_free_draw_used', false);
    saveStored('amigo_family', INITIAL_FAMILY_STATE);

    showToast(t('toast.lifeReset'));
  };

  return { handleRegisterBirth, handleResetLife };
};
