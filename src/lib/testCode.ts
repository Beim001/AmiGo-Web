// 测试兑换码（第 57 题）：只在测试版本（版本号以 dev-beta 或 beta-dev 开头）可用，可无限次兑换。
// 兑换后：现金保持在 GOD_COINS 以上、健康始终 100、不会因病或寿命去世、立即解锁全部成就。
// 用过测试兑换码的赛季不上传赛季成绩，集齐成就也不去服务器领取名次。

import { APP_VERSION } from '../version';

export const TEST_CODE = 'ZWZ666';
export const GOD_MODE_KEY = 'amigo_god_mode';
export const GOD_COINS = 1_000_000_000;

export const isBetaVersion = (version: string = APP_VERSION) => /^(dev-beta|beta-dev)-/i.test(version);
