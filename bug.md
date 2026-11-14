# 已知 Bug 清单

> 来源：2026-11-14 通读代码时发现。按严重程度排序。未完成功能（TODO）见 [README.md](README.md) 第五节。
>
> **修复进度（2026-11-14）**：已修复 #1 #2 #4 #5 #8 #9 #11 #12，#6 部分修复；#3 #7 #10 待定（需要玩法/架构决定）。
> 已修复项通过 `npm run lint`（0 错误）与 `npm run build` 验证，#6 有单元用例验证；**尚未在浏览器中手动回归测试**。
> 下方的行号是发现时的位置，修复后可能已偏移。

---

## 🔴 严重

### 1. 商城抽卡扣费被覆盖，抽卡不花钱还能赚钱
- **状态**：✅ 已修复：扣费、奖励、服饰购买都改为函数式更新。
- **位置**：[src/App.tsx:281](src/App.tsx#L281)、[src/App.tsx:309](src/App.tsx#L309)（`ShopModal.handleDraw`）
- **原因**：先 `setCoins(coins - cost)` 扣费，1.5 秒后在 `setTimeout` 里用闭包中旧的 `coins` 执行 `setCoins(coins + totalCoins)`，前面的扣费被覆盖。
- **复现**：十连抽（72,000 ₽）→ 开箱结束后金币 = 抽卡前金币 + 奖励金币。
- **修复思路**：两处都改为函数式更新 `setCoins(prev => prev - cost)` / `setCoins(prev => prev + totalCoins)`。服饰购买（[src/App.tsx:403](src/App.tsx#L403)）同样建议改为函数式更新。

### 2. 金币、健康、服装不持久化，刷新即还原
- **状态**：✅ 已修复：`coins`、`health`、`equippedClothing`、`ownedClothes`、`freeDrawUsed` 从 `localStorage` 读取初始值并在变化时写回（键 `amigo_coins` / `amigo_health` / `amigo_equipped_clothing` / `amigo_owned_clothes` / `amigo_free_draw_used`）。
- **位置**：[src/App.tsx:2771-2773](src/App.tsx#L2771-L2773)、[src/App.tsx:2968](src/App.tsx#L2968)、[src/App.tsx:2988](src/App.tsx#L2988)
- **原因**：`coins`（初始 1,047,650）、`health`、`equippedClothing`、`ownedClothes`、`freeDrawUsed` 都是普通 `useState`，从不写入 `localStorage`。
- **影响**：
  - 刷新页面后，所有花费和收入都会丢失（房产、股票等其他存档却还在，导致资产对不上）。
  - "重置人生"把金币设成 10,000，并删除 `amigo_coins`，但这个键从未写入过，刷新后金币又回到 1,047,650。
  - 首抽免费可通过刷新无限使用。

### 3. 健康值永远不会下降，死亡流程走不到
- **状态**：⏸ 待定：需要确定健康下降规则（如每月自然衰减、按年龄加速、事件扣减）后再实现。
- **位置**：全项目没有任何减少 `health` 的代码（只有 [HospitalModal](src/components/HospitalModal.tsx#L225)、[handleNextMonth](src/App.tsx#L2859)、[VisaModal](src/components/VisaModal.tsx#L838) 增加健康）。
- **影响**：`RoleTab` / `SimTab` 中 `health <= 0` 的"公民纪念碑"和死亡后重置流程永远不会触发。

---

## 🟠 中等

### 4. "重置人生"清理不完整
- **状态**：✅ 已修复：重置时删除所有 `amigo_*` / `aminoac_*` 键，只保留账号级数据（`amigo_active_user`、`amigo_local_uid`、`amigo_redeemed_codes`），并显式写入重置后的初始值。
- **位置**：[src/App.tsx:2887-2934](src/App.tsx#L2887-L2934)（`handleResetLife`）
- **原因**：只清理了部分 `localStorage` 键，以下数据在重置后仍然保留：
  - 股票：`amigo_stocks`、`amigo_stock_holdings`、`amigo_stock_tradelogs`、`amigo_stock_news`、`amigo_stock_tradingday`、`amigo_stock_favorites`
  - 工作：`amigo_current_job_id`、`amigo_job_history`、`amigo_job_shifts_count`、`amigo_job_earned_coins`
  - 医院：`amigo_hospital_logs`
  - 签证/护照：`aminoac_passport_info`、`aminoac_issued_visas`、`aminoac_travel_history`（及旧的 `amigo_*` 同名键）
- **修复思路**：把所有存档键集中定义成常量列表，重置时统一遍历删除。

### 5. B 站登录在匿名 Firebase 登录失败时卡在登录页
- **状态**：✅ 已修复：`onLoginSuccess` 中直接 `setAuthUser(user)`。
- **位置**：[src/components/AuthScreen.tsx:148-207](src/components/AuthScreen.tsx#L148-L207)、[src/App.tsx:3005-3009](src/App.tsx#L3005-L3009)
- **原因**：`onLoginSuccess` 只设置了 `playerName`，没有调用 `setAuthUser`，进入游戏依赖 `onAuthStateChanged` 触发。匿名登录失败时这个回调不会触发，`authUser` 一直是 `null`。
- **复现**：网络无法访问 Firebase 时用 B 站登录 → 提示成功但停留在登录页，需手动刷新（刷新后从 `amigo_active_user` 读取才进入）。
- **修复思路**：`onLoginSuccess` 中同时 `setAuthUser(user)`。

### 6. 敏感词误判，可能误冻结改名 90 天
- **状态**：🟡 部分修复：含拉丁字母的词改为整词匹配（`Augustus`、`Russell` 不再误判，`US`、`我是US`、`U.S.` 仍拦截）。`帝国`、`皇帝`、`皇上`、`人民` 仍在政治词库中，是否移出需词库维护者决定。
- **位置**：[src/utils/sensitiveWords.ts:36-44](src/utils/sensitiveWords.ts#L36-L44)、匹配逻辑 [src/utils/sensitiveWords.ts:131-152](src/utils/sensitiveWords.ts#L131-L152)
- **原因**：
  - 匹配方式是转大写后做子串包含，短英文词 `US`、`SS`、`NC`、`CN`、`TW`、`HK`、`JP`、`TG`、`SB` 会命中大量正常名字。例如 `Augustus`、`Lucius` 含 `US`，`Russell` 含 `SS`。
  - `帝国`、`皇帝`、`皇上`、`人民` 在"政治与合规敏感"词库中，而游戏世界观本身就是"卡罗尼亚帝国"。
- **影响**：命中"政治与合规敏感"类别会累计违规次数，3 次后冻结改名 90 天（[src/App.tsx:863-897](src/App.tsx#L863-L897)）。玩家可能因正常名字被封。
- **修复思路**：短英文词改为整词匹配（或只匹配完整名字），把世界观用词移出政治词库。

### 7. 存档未按账号隔离
- **状态**：⏸ 待定：需按 `uid` 给所有存档键加前缀，并处理已有存档迁移，改动面较大。
- **位置**：所有 `localStorage` 键（`amigo_*`、`aminoac_*`）
- **原因**：键名不含 `authUser.uid`。
- **影响**：同一浏览器切换账号后，新账号会看到上一个账号的房产、银行、股票、签证等存档。

---

## 🟡 轻微

### 8. 卖房时直接修改 state 对象
- **状态**：✅ 已修复：在 `setOwnedProperties(prev => ...)` 内生成新对象；新主居所选第一套**未出租**的房产（原逻辑可能选中出租中的房产）。
- **位置**：[src/components/HousingModal.tsx:342-347](src/components/HousingModal.tsx#L342-L347)（`handleSellProperty`）
- **原因**：`remaining[0].isPrimaryResidence = true` 直接改了现有 state 中的对象，没有通过 `setOwnedProperties` 生成新对象。目前能生效，只是因为数组元素恰好是同一引用，属于脆弱写法。
- **修复思路**：在 `setOwnedProperties(prev => ...)` 内部过滤后，返回新对象并设置主居所。

### 9. 公民身份编号写死
- **状态**：✅ 已修复：首次打开出生登记时随机生成 `AMN-{年份}-{8位数}` 并存入 `amigo_citizen_id`，重置人生后重新生成。
- **位置**：[src/components/BirthModal.tsx:73](src/components/BirthModal.tsx#L73)
- **原因**：`citizenId = 'AMN-1870-88204910'`，所有玩家的编号都一样。

### 10. 个人中心多处数据写死
- **状态**：🟡 部分修复（README P1）：头衔、岗位、地产、服装数改为读取真实状态，无对应系统的字段显示「暂未开放」，移除 Lv.22。「特权光环」与「成就勋章」仍为写死内容。
- **位置**：[src/App.tsx:1124-1129](src/App.tsx#L1124-L1129)、[src/App.tsx:1174-1187](src/App.tsx#L1174-L1187)、[src/App.tsx:1253-1270](src/App.tsx#L1253-L1270)
- **现象**：头衔、"Lv.22"、"18 胜 / 0 败"、"4 / 4 套"服装、毕业院校、主业、地产都是固定文本，和真实游戏状态无关（例如实际拥有服装数与显示不符）。

### 11. 礼包码兑换记录不持久化
- **状态**：✅ 已修复：已兑换列表存入 `amigo_redeemed_codes`，重置人生也不会清除。
- **位置**：[src/App.tsx:711](src/App.tsx#L711)
- **原因**：`redeemedCodes` 只存在内存中，关闭个人中心再打开即可重复兑换同一礼包码（每次 +50,000 ₽）。

### 12. 余额不足仍使用原生 `alert()`
- **状态**：✅ 已修复：商城内改用应用内 Toast 提示。
- **位置**：[src/App.tsx:277](src/App.tsx#L277)、[src/App.tsx:407](src/App.tsx#L407)
- **影响**：在 iframe（AI Studio / B 站内嵌）中可能被拦截或体验不一致，应改用应用内 Toast。

---

## 修复过程中顺带修复

### 13. TypeScript 类型错误（`npm run lint` 失败）
- **状态**：✅ 已修复。`TopBar`、`AvatarSelectModal`、`EmailVerificationScreen` 的用户参数类型放宽为 `FirebaseUser | AppUser`。

### 14. 签证公证书有效期显示 "undefined 个月"
- **位置**：[src/components/VisaModal.tsx](src/components/VisaModal.tsx)（签证公证书弹窗）
- **原因**：读取了 `IssuedVisa` 上不存在的 `durationMonths` 字段。
- **状态**：✅ 已修复，改为读取 `visa.durationMonths`。

## 新发现（未修复）

### 15. "重置人生"可绕过改名冻结
- **原因**：重置会清除 `amigo_political_violation_count`、`amigo_name_freeze_until` 等违规记录（原代码就是如此，本次保留了这一行为）。玩家被冻结改名 90 天后，可通过重置人生立即解封。
- **待定**：是否把违规记录也归为账号级数据、重置时保留，需要产品决定。

### 16. B 站登录用户的 UID 不稳定，会被 Firebase 匿名用户覆盖
- **位置**：[src/App.tsx:2800-2803](src/App.tsx#L2800-L2803)（`onAuthStateChanged` 回调）、[src/components/AuthScreen.tsx:178](src/components/AuthScreen.tsx#L178)、[src/components/AuthModal.tsx:208](src/components/AuthModal.tsx#L208)、[src/App.tsx:3400](src/App.tsx#L3400)（`AuthModal` 的 `onUserChange`）
- **原因**：B 站登录时会先匿名登录 Firebase，再组装 `AppUser`（`uid` 取 B 站 `toyOpenId`，`providerData` 标记为 `bilibili`）写入 `authUser` 和 `amigo_active_user`。但只要匿名登录成功，`onAuthStateChanged` 随后会用 Firebase 匿名用户覆盖 `authUser`；刷新页面时同样先读到 `AppUser`，又被 Firebase 回调覆盖。
- **影响**：
  - 同一个 B 站玩家的 UID 会在 `toyOpenId` 与 Firebase 匿名 UID 之间变化，个人中心显示的 UID 不一致；
  - 覆盖后 `providerData` 变为匿名用户，丢失"B 站登录"标记（`isBilibili`）；
  - 匿名登录失败且 SDK 未返回 `toyOpenId` 时，`uid` 退化为 `bilibili_${Date.now()}`，每次登录都不同；
  - 将来按账号隔离存档（#7）时，同一玩家可能对应多份存档。
- **备注**：原代码就存在，与 #5 的修复无关。#5 修复只保证匿名登录失败时也能进入游戏，未在真实 B 站环境测试（本地没有 Toy SDK）。
- **修复思路**：以 `toyOpenId` 作为 B 站玩家的唯一身份；`onAuthStateChanged` 收到匿名用户时，若当前 `authUser` 是 B 站用户则保留 `AppUser`（只记录对应的 Firebase UID），不直接覆盖。

### 17. 银行理财基金申购后钱凭空消失
- **位置**：[src/App.tsx:2603-2632](src/App.tsx#L2603-L2632)（`BankModal` 的「投资理财」页）
- **原因**：申购按钮只执行 `setCoins(prev => prev - fund.min)` 并记一条流水，没有保存任何持仓数据，也没有收益结算或赎回入口。
- **复现**：银行 → 投资理财 → 申购任意基金（1 万 / 5 万 / 10 万 ₽）→ 现金减少，但资产全景、银行存款中都看不到这笔钱，之后也不会产生收益。
- **影响**：页面标注的 5.2% / 12.8% / 28.5% 年化收益永远不会兑现，玩家申购即损失全部本金；资产全景（`WealthChartModal`）也不统计这部分资产。
- **待定**：补全基金系统（持仓、每月收益、赎回），还是先下架申购按钮。已列入 [undefined.md](undefined.md) 第 7 题。

### 18. 推演战绩榜上报的是固定分数 18,500
- **位置**：[src/App.tsx:875](src/App.tsx#L875)（`handleSubmitScore`）、[src/App.tsx:1461](src/App.tsx#L1461)（我的积分显示）、[src/App.tsx:587-599](src/App.tsx#L587-L599)（本地兜底榜单）
- **原因**：`if (board === 3) scoreToSubmit = 18500;`，推演系统没有任何计分逻辑，分数是写死的。
- **影响**：在 B 站环境中点「上报我的成绩」会把这个假分数提交到**真实的 B 站排行榜**（`window.toy.submitScore`），所有玩家的推演分都一样。
- **待定**：推演积分怎么算，或是否暂时下架推演榜，见 [undefined.md](undefined.md) 第 13 题。在决定之前，建议至少先禁止上报推演榜分数。

### 19. 推演事件日期写死、文案与玩家年龄不符
- **位置**：[src/components/SimTab.tsx:26-63](src/components/SimTab.tsx#L26-L63)（`INITIAL_EVENTS`）
- **原因**：3 张事件卡的日期固定为 1871年10月、1872年3月、1872年9月，不随游戏时间变化；文案默认玩家是成年在职者（"经理向你提供外派机会""你手里有一笔闲置资金"）。
- **影响**：
  - 游戏推进到 1890 年时，推演页仍显示 1871–1872 年的"新闻"；
  - 出生登记后玩家只有 8 岁，却收到外派、投资、深造的事件；
  - 选项文案写"-体力"，但游戏中不存在体力属性。
- **备注**：属于推演系统整体重做的一部分（README P0-2），相关设计见 [undefined.md](undefined.md) 第 8–12 题。

### 20. 人生日志示例内容与出生登记机制冲突
- **位置**：[src/components/LogTab.tsx:13-102](src/components/LogTab.tsx#L13-L102)（`INITIAL_LOG_ENTRIES`）
- **原因**：日志页对所有玩家显示同样的 8 条写死记录，从"0 岁 · 1870.01 出生降临"到"30 岁 · 1900.01 资产大突破"。
- **影响**：
  - 出生登记时玩家已经 8 岁，登记年份也不一定是 1870 年，与"0 岁出生"矛盾；
  - 未登记、刚登记的玩家也会看到"考入帝国理工""缔结良缘""创立研制所"等从未发生的经历；
  - 示例中的"卡罗尼亚重工 · 助理机械工程师"等内容与个人中心写死的资料（#10）一致，但都与真实游戏状态无关。
- **备注**：属于人生日志联动（README P0-3），处理方式见 [undefined.md](undefined.md) 第 16 题。

### 21. 离职后重新打开就业界面，又自动在职「俄文通译」
- **位置**：[src/components/JobModal.tsx](src/components/JobModal.tsx)（`handleResign` 与 `currentJobId` 初始值）
- **原因**：离职时删除了 `amigo_current_job_id`，而初始化逻辑把"没有这个键"当作新存档，默认入职 `'j1'`（俄文通译）。
- **复现**：就业招聘 → 离职 → 关闭界面 → 重新打开，显示仍在职俄文通译。
- **状态**：✅ 已修复。离职时写入空字符串表示待业；新增 `readCurrentJobId()`，就业界面与个人中心共用同一读取逻辑。新存档默认在职 `'j1'` 的行为保持不变（是否改为待业见 [undefined.md](undefined.md) 第 3 题）。
