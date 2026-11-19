import { useTranslation } from 'react-i18next';
import type { Game } from './useGameState';
import { addHeirloom } from '../lib/family';
import { clampReputation, CHARITY_UNIT, charityRemaining } from '../lib/reputation';
import { eventDef, resolveOption, optionBlocked } from '../lib/simEvents';
import { heirloomById } from '../lib/heirlooms';
import { addCase, appealCase, loadCases, saveCases, suitCase } from '../lib/court';
import { JAIL_REPUTATION, savePrison, sentenceTo, isInPrison } from '../lib/prison';
import { CHILD_JOB_KEY } from '../lib/lineage';
import { addLifeLog } from '../lib/lifeLog';
import { CURRENT_JOB_KEY } from '../components/JobModal';
import { CURRENCY } from '../data/seasons';

/**
 * 当家人的日常操作：声望变化、入狱、慈善捐款、处理推演事件。
 * 这些操作会同时改动多处游戏状态与存档，由多个界面共用。
 */
export const usePlayerActions = ({
  game,
  currentAge,
  showToast,
  setShowSuccession,
}: {
  game: Game;
  currentAge: number;
  showToast: (msg: string) => void;
  /** 处理推演事件后健康归零时打开传承界面 */
  setShowSuccession: (show: boolean) => void;
}) => {
  const { t } = useTranslation('app');
  const { isRegistered, playerName, coins, health, gameYear, gameMonth, charity, simEvents, godMode } = game.state;
  const { setCoins, setHealth, setFamily, setReputation, setCharity, setSimEvents, setSimScore } = game.setters;

  // 特质（第 27 题）、声望（第 22 题）
  const changeReputation = (delta: number) => setReputation((r) => clampReputation(r + delta));

  /** 入狱（第 67.7 题）：丢掉工作与童工，声望下降；返回提示文字 */
  const jailPlayer = (crime: string, months: number): string => {
    savePrison(sentenceTo(crime, months, gameYear, gameMonth));
    try {
      localStorage.setItem(CURRENT_JOB_KEY, '');
      localStorage.removeItem(CHILD_JOB_KEY);
    } catch (e) {}
    changeReputation(JAIL_REPUTATION);
    // 服刑期间可以到法院上诉（第 67.6 题）
    saveCases(addCase(loadCases(), appealCase(crime, gameYear, gameMonth)));
    addLifeLog('大事', `因${crime}入狱`, `被判入狱 ${months} 个月，丢掉了工作，声望 ${JAIL_REPUTATION}。可以到法院上诉。`);
    return t('jailed', { crime, months });
  };

  /** 慈善捐款：每 10,000 ₽ 声望 +1，每个游戏月最多 +5 */
  const handleDonate = (amount: number): string => {
    if (!isRegistered) return t('donate.notRegistered');
    if (coins < amount) return t('donate.noMoney', { amount: amount.toLocaleString(), symbol: CURRENCY.symbol });
    const monthKey = `${gameYear}-${gameMonth}`;
    const gain = Math.min(Math.floor(amount / CHARITY_UNIT), charityRemaining(charity, monthKey));
    setCoins((c) => c - amount);
    changeReputation(gain);
    setCharity({ month: monthKey, gained: (charity?.month === monthKey ? charity.gained : 0) + gain });
    if (amount >= 100000) addLifeLog('大事', '慷慨解囊', `向慈善会捐款 ${amount.toLocaleString()} ${CURRENCY.symbol}。`);
    return gain > 0 ? t('donate.thanks', { gain }) : t('donate.capped');
  };

  /** 处理推演事件的选项：结算现金与健康，以及入狱、起诉、传家宝等结果 */
  const handleSimResolve = (uid: string, optionIndex: number) => {
    const inst = simEvents.find((e) => e.uid === uid);
    const def = inst ? eventDef(inst) : undefined;
    const option = def?.options[optionIndex];
    if (!inst || !def || !option || optionBlocked(option, coins)) return null;
    // 狱中不能处理推演事件（第 67.7 题）
    if (isInPrison()) {
      showToast(t('toast.inPrison'));
      return null;
    }
    const result = resolveOption(option);
    const newHealth = godMode ? 100 : Math.max(0, Math.min(100, health + result.health));
    setCoins((prev) => Math.max(0, prev + result.coins));
    setHealth(newHealth);
    setSimScore((n) => n + result.score);
    setSimEvents((prev) => prev.filter((e) => e.uid !== uid));
    addLifeLog('大事', def.headline, `${option.label}：${result.text}`);
    if (result.jail) showToast(jailPlayer(result.jail.crime, result.jail.months));
    // 受害或挨打后可到法院起诉（第 67.6 题）
    if (result.lawsuit) saveCases(addCase(loadCases(), suitCase(result.lawsuit, gameYear, gameMonth, inst.uid)));
    if (result.heirloom) {
      const h = heirloomById(result.heirloom);
      const SOURCE: Record<string, string> = { army: '参军', rescue: '见义勇为', antique: '旧货摊' };
      setFamily((prev) => addHeirloom(prev, { id: result.heirloom!, source: SOURCE[def.id] ?? def.title, year: gameYear, month: gameMonth, keeper: '当家人' }));
      if (h) addLifeLog('大事', `获得传家宝：${h.name}`, h.desc);
    }
    if (isRegistered && newHealth <= 0) {
      addLifeLog('大事', '辞世', `${playerName} 离开了人世，享年 ${currentAge} 岁。`);
      setShowSuccession(true);
    }
    return result;
  };

  return { changeReputation, jailPlayer, handleDonate, handleSimResolve };
};
