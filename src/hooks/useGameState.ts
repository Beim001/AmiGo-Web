import React, { useEffect, useMemo, useReducer, useRef } from 'react';
import { loadStored, saveStored } from '../lib/storage';
import { readCachedUser } from '../lib/authClient';
import { FamilyState, INITIAL_FAMILY_STATE, getOrigin } from '../lib/family';
import { classById, PLAYER_LIFESPAN_KEY } from '../lib/lineage';
import { ActiveDisease, DISEASE_KEY, ANTIBODY_KEY } from '../lib/disease';
import { PLAYER_TRAITS_KEY } from '../lib/traits';
import { REPUTATION_KEY, CHARITY_KEY } from '../lib/reputation';
import { Guardianship, GUARDIANSHIP_KEY } from '../lib/guardianship';
import { SimEventInstance, SIM_EVENTS_KEY, SIM_SCORE_KEY, SIM_QUIET_KEY } from '../lib/simEvents';
import { Auction, AUCTION_KEY } from '../lib/heirlooms';
import { Appearance, APPEARANCE_KEY } from '../lib/appearance';
import { GiftInventory, GIFT_INVENTORY_KEY } from '../lib/gifts';
import { GOD_MODE_KEY } from '../lib/testCode';

// 统一的游戏状态：一局人生中需要存档的数据集中在一个 reducer 里。
// - 每个字段都有同名 setter（setCoins、setFamily…），接受新值或更新函数，语义与 useState 的 setter 相同，
//   因此可以原样传给子组件；值没有变化时不触发重渲染。
// - PERSISTED 中的字段在首次渲染和每次变化后自动写入 localStorage；
//   出生登记、游戏年月、银行汇总、角色名由各自的处理函数在修改时同步写入存档（之后的读取依赖写入的时机），不在这里自动保存。
// 界面开关、登录状态、简洁模式的设置等不属于游戏进度，仍由 App 各自持有。

export interface GameState {
  isRegistered: boolean;
  gender: string | null;
  birthRegisteredYear: number;
  playerName: string;
  coins: number;
  health: number;
  gameYear: number;
  gameMonth: number;
  equippedClothing: string;
  ownedClothes: string[];
  freeDrawUsed: boolean;
  bankDeposit: number;
  bankLoan: number;
  family: FamilyState;
  disease: ActiveDisease | null;
  antibodies: string[];
  playerTraits: string[];
  reputation: number;
  guardianship: Guardianship | null;
  charity: { month: string; gained: number } | null;
  simEvents: SimEventInstance[];
  simScore: number;
  simQuiet: string | null;
  auction: Auction | null;
  appearance: Appearance | null;
  playerLifespan: number | null;
  giftInventory: GiftInventory;
  godMode: boolean;
}

const PERSISTED: Partial<Record<keyof GameState, string>> = {
  coins: 'amigo_coins',
  health: 'amigo_health',
  equippedClothing: 'amigo_equipped_clothing',
  ownedClothes: 'amigo_owned_clothes',
  freeDrawUsed: 'amigo_free_draw_used',
  family: 'amigo_family',
  disease: DISEASE_KEY,
  antibodies: ANTIBODY_KEY,
  playerTraits: PLAYER_TRAITS_KEY,
  reputation: REPUTATION_KEY,
  guardianship: GUARDIANSHIP_KEY,
  charity: CHARITY_KEY,
  simEvents: SIM_EVENTS_KEY,
  simScore: SIM_SCORE_KEY,
  simQuiet: SIM_QUIET_KEY,
  auction: AUCTION_KEY,
  appearance: APPEARANCE_KEY,
  playerLifespan: PLAYER_LIFESPAN_KEY,
  giftInventory: GIFT_INVENTORY_KEY,
  godMode: GOD_MODE_KEY,
};

/** 已办理出生登记时存档中的角色名；未登记返回 null */
export const registeredName = (): string | null => {
  try {
    return localStorage.getItem('amigo_is_registered') === 'true' ? localStorage.getItem('amigo_player_name') : null;
  } catch (e) {
    return null;
  }
};

const readInt = (key: string, fallback: number): number => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? parseInt(saved, 10) : fallback;
  } catch (e) {
    return fallback;
  }
};

const createInitialState = (): GameState => {
  const isRegistered = (() => {
    try {
      return localStorage.getItem('amigo_is_registered') === 'true';
    } catch (e) {
      return false;
    }
  })();
  const family = loadStored('amigo_family', INITIAL_FAMILY_STATE);
  return {
    isRegistered,
    gender: (() => {
      try {
        return localStorage.getItem('amigo_gender') || null;
      } catch (e) {
        return null;
      }
    })(),
    birthRegisteredYear: readInt('amigo_birth_registered_year', 1870),
    playerName: registeredName() || readCachedUser()?.displayName || 'AmiGo·玩家',
    coins: loadStored('amigo_coins', 1047650),
    health: loadStored('amigo_health', 100),
    gameYear: readInt('amigo_game_year', 1870),
    gameMonth: readInt('amigo_game_month', 1),
    equippedClothing: loadStored('amigo_equipped_clothing', 'default'),
    ownedClothes: loadStored('amigo_owned_clothes', ['default']),
    freeDrawUsed: loadStored('amigo_free_draw_used', false),
    bankDeposit: readInt('amigo_bank_deposit', 500000),
    bankLoan: readInt('amigo_bank_loan', 0),
    family,
    disease: loadStored<ActiveDisease | null>(DISEASE_KEY, null),
    antibodies: loadStored<string[]>(ANTIBODY_KEY, []),
    playerTraits: loadStored<string[]>(PLAYER_TRAITS_KEY, []),
    // 旧存档没有声望时按家族阶层的起始声望
    reputation: loadStored(REPUTATION_KEY, isRegistered ? classById(getOrigin(family).classId).startReputation : 0),
    guardianship: loadStored<Guardianship | null>(GUARDIANSHIP_KEY, null),
    charity: loadStored(CHARITY_KEY, null),
    simEvents: loadStored<SimEventInstance[]>(SIM_EVENTS_KEY, []),
    simScore: loadStored(SIM_SCORE_KEY, 0),
    simQuiet: loadStored<string | null>(SIM_QUIET_KEY, null),
    auction: loadStored<Auction | null>(AUCTION_KEY, null),
    appearance: loadStored<Appearance | null>(APPEARANCE_KEY, null),
    playerLifespan: loadStored<number | null>(PLAYER_LIFESPAN_KEY, null),
    giftInventory: loadStored<GiftInventory>(GIFT_INVENTORY_KEY, {}),
    godMode: loadStored<boolean>(GOD_MODE_KEY, false),
  };
};

type SetAction = { [K in keyof GameState]: { type: 'set'; key: K; value: React.SetStateAction<GameState[K]> } }[keyof GameState];

const reducer = (state: GameState, action: SetAction): GameState => {
  const prev = state[action.key];
  const next = typeof action.value === 'function' ? (action.value as (p: typeof prev) => typeof prev)(prev) : action.value;
  return Object.is(prev, next) ? state : { ...state, [action.key]: next };
};

export type GameSetters = { [K in keyof GameState as `set${Capitalize<K>}`]: React.Dispatch<React.SetStateAction<GameState[K]>> };

export interface Game {
  state: GameState;
  setters: GameSetters;
}

export const useGameState = (): Game => {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  // setter 只依赖 dispatch（引用稳定），整个生命周期内保持同一个对象
  const setters = useMemo(() => {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(state) as Array<keyof GameState>) {
      out[`set${key[0].toUpperCase()}${key.slice(1)}`] = (value: React.SetStateAction<GameState[typeof key]>) =>
        dispatch({ type: 'set', key, value } as SetAction);
    }
    return out as GameSetters;
  }, []);

  const saved = useRef<Partial<GameState>>({});
  useEffect(() => {
    for (const [field, storageKey] of Object.entries(PERSISTED) as Array<[keyof GameState, string]>) {
      if (field in saved.current && Object.is(saved.current[field], state[field])) continue;
      saveStored(storageKey, state[field]);
      (saved.current as Record<string, unknown>)[field] = state[field];
    }
  }, [state]);

  return { state, setters };
};
