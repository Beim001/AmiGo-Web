# AmiGO Lite · 阿米诺斯文明人生模拟器

> 基于 **React 19 + TypeScript + Vite + Tailwind CSS v4** 构建的 19 世纪架空工业帝国（卡罗尼亚帝国 / 阿米诺斯）人生模拟 Web 应用，使用 **Cloudflare Workers + D1** 自建账号体系与云端存档（面向中国大陆玩家，不依赖 Firebase / Google 服务）、**Bilibili Toy SDK** 排行榜/资料同步能力以及本地多模块经济与公民身份模拟系统。

---

## 一、技术栈与环境配置

- **前端框架**：React 19、TypeScript 5.8、Vite 6
- **样式与动效**：Tailwind CSS v4 (`@tailwindcss/vite`)、`motion`、`lucide-react`
- **数据可视化**：`recharts`（个人资产全景饼图/占比分析）
- **账号与存档后端**：Cloudflare Workers（`worker/`，Hono 路由）+ D1 数据库；邮箱密码登录、验证邮件与找回密码（Resend 发信），已验证账号的进度同步到云端
- **字体**：`@fontsource` 自托管（Google Fonts 在中国大陆无法访问）
- **平台扩展**：Bilibili Toy SDK (`//s1.hdslb.com/bfs/seed/toy/app/sdk/toy-sdk.js`) 与本地 Fallback 机制
- **本地运行**：
  ```bash
  npm install
  cp .dev.vars.example .dev.vars   # 后端本地环境变量（开发模式下邮件链接只打印到控制台）
  npm run db:migrate:local         # 首次运行：在本地 D1 数据库建表
  npm run build                    # 后端托管 dist/，首次启动前需构建一次
  npm run worker:dev               # 终端 1：启动后端（端口 8787）
  npm run dev                      # 终端 2：启动前端（端口 3000，/api 自动转发到 8787）
  npm run lint                     # 类型检查（前端 + 后端）
  ```
  - 不想启动后端时，可在 `.env.local` 设置 `VITE_SKIP_AUTH=true` 跳过登录（仅开发模式生效）。
  - 部署到 Cloudflare 的步骤见 `wrangler.toml` 顶部注释（需要 Cloudflare 账号、自有域名与 Resend 发信密钥；`*.workers.dev` 在中国大陆无法访问）。

---

## 二、项目结构

```text
.
├── index.html                        # HTML 入口，引入 Bilibili Toy SDK 脚本
├── metadata.json                     # AI Studio 应用元信息与能力声明
├── package.json                      # 依赖与脚本配置 (dev / build / preview / lint)
├── tsconfig.json                     # TypeScript 编译配置
├── vite.config.ts                    # Vite 配置（base: './'、React 与 Tailwind 插件）
├── .env.example                      # 前端环境变量模板
├── .dev.vars.example                 # 后端（wrangler dev）本地环境变量模板
├── wrangler.toml                     # Cloudflare Workers 部署配置（静态资源 + D1 绑定）
├── worker/                           # 后端：账号、邮箱验证、找回密码、云存档接口
│   ├── migrations/0001_init.sql      # D1 建表（用户、会话、邮件令牌、存档、限流）
│   └── src/
│       ├── index.ts                  # /api/* 路由（Hono），其余请求交给前端静态文件
│       └── crypto.ts                 # PBKDF2 密码哈希、随机令牌与 SHA-256
└── src/
    ├── main.tsx                      # React 根节点挂载入口
    ├── index.css                     # 全局样式与 Tailwind CSS 引入
    ├── App.tsx                       # 主应用壳、全局状态管理、顶部/底部导航、商城/个人中心/多银行系统
    ├── lib/
    │   ├── authClient.ts             # 账号服务客户端（注册/登录/验证/找回密码，错误中文提示）
    │   ├── cloudSave.ts              # 云端存档：本地快照、首次同步、冲突处理、定时自动保存
    │   └── bilibiliToy.ts            # Bilibili Toy SDK 封装与环境变量检测/本地兜底
    ├── utils/
    │   └── sensitiveWords.ts         # 多分类敏感词库配置与昵称合规校验工具
    └── components/
        ├── AuthScreen.tsx            # 强制登录门禁首屏（邮箱登录/注册/找回密码/设置新密码、B站登录）
        ├── AuthModal.tsx             # 游戏内账号管理中心弹窗（绑定/切换/重置密码/退出）
        ├── EmailVerificationScreen.tsx # 邮箱注册账号未验证时的拦截与轮询验证页
        ├── AvatarSelectModal.tsx     # 头像选择弹窗（卡通角色/社交头像/预设徽章头像）
        ├── RoleTab.tsx               # 「角色」主标签页（时代历法、角色状态碑/SVG 角色、五维属性卡）
        ├── FunctTab.tsx              # 「功能」标签页（22 个 Bento 网格政务与商业功能入口）
        ├── SimTab.tsx                # 「推演」标签页（人生快报报纸风格事件卡片与死亡/未建档引导）
        ├── LogTab.tsx                # 「日志」标签页（人生里程碑时间线与分类筛选）
        ├── FamilyTab.tsx             # 「家族」标签页（瓦伦丁家族世系族谱、传家宝、大事记）
        ├── BirthModal.tsx            # 「出生登记」界面（起名校验、随机身份生成、公民编号盖章）
        ├── GenderRightsModal.tsx     # 「性别权利」界面（公民法定性别变更与规费扣除）
        ├── CalendarModal.tsx         # 「卡罗尼亚帝国日历」弹窗（年份翻阅、节气事件与推进月份）
        ├── HospitalModal.tsx         # 「医疗服务」界面（多家专科医院诊疗、折扣与健康度恢复）
        ├── JobModal.tsx              # 「就业招聘」界面（行业岗位检索、入职/离职、打工结算）
        ├── HousingModal.tsx          # 「住房地产」界面（买房/卖房/放租/自住/装修升级/租房）
        ├── StockModal.tsx            # 「交易所」界面（多板块股票买卖、交易日推进与行情资讯）
        ├── WealthChartModal.tsx      # 「个人资产全景」界面（现金/存款/股票/房产/负债汇总与 Recharts 图表）
        ├── VisaModal.tsx             # 「签证申办」界面（护照办理、各国签证申请与出境旅行记录）
        ├── ImmigrationModal.tsx      # 「移民居留」界面（各国永居/入籍项目申请与宣誓归化）
        └── HistoricalFlag.tsx        # 19 世纪历史政权离线 SVG 国旗组件（GBR/PRU/FRA/USA 等）
```

---

## 三、核心模块与函数作用说明

### 1. 主应用与全局调度 (`src/App.tsx`)

| 组件 / 函数名 | 作用说明 |
| :--- | :--- |
| `App()` | 根组件，维护全局状态（`authUser`、认证加载态、角色注册态 `isRegistered`、性别 `gender`、金币 `coins`、健康度 `health`、游戏年月 `gameYear`/`gameMonth`、银行总存贷、当前标签页及 14 个子界面显隐开关）。 |
| `handleNextMonth()` | 推进游戏时间 1 个月（跨年自动进位），发放月度基本俸禄（1,500 ₽），读取 `localStorage` 中已购房产与租住合约自动结算租金收入/支出与舒适度健康加成，并触发 Toast 提示。 |
| `handleRegisterBirth(name)` | 办理首次出生登记：随机生成法定性别（男/女），将建档年份绑定当前 `gameYear`（初始年龄 8 岁），持久化写入 `localStorage` 并更新玩家姓名。 |
| `handleResetLife()` | 重置当前人生：还原注册态、性别、服装、资产（现金 10,000 ₽、存款 500,000 ₽）、时间（1870.01）与健康度（100），并清空 `localStorage` 中所有角色进度与违规冻结记录。 |
| `handleLogout()` | 邮箱账号：先把进度同步到云端（失败则不退出），再调用退出接口、清除本地存档并刷新页面；B 站账号：仅清除本地登录缓存。 |
| `renderAvatarContent()` | 根据 `avatarSource` 动态渲染顶部栏与个人中心的头像内容（社交平台头像 / 预设角色徽章 / 换装卡通角色 SVG）。 |
| `TopBar` / `BottomNav` | 顶部栏展示玩家头像名片与现金入口；底部 5 栏导航切换 `角色 / 功能 / 推演 / 日志 / 家族`。 |
| `ShopModal` / `ChestAnimation` | 服饰商城与限定宝箱抽奖界面，`handleDraw(times)` 实现单抽（含首抽免费）与十连抽逻辑及开箱动画。 |
| `ProfileModal` | 个人中心界面，包含：<br>• `handleSaveName()`：整合敏感词校验、每月最多改名 2 次限制、政治敏感词 3 次违规触发 90 天冻结及日志留档；<br>• `handleSyncBilibiliProfile()`：调用 B 站 SDK 同步昵称头像并执行敏感词校验；<br>• `refreshRankData()` / `handleSubmitScore()`：拉取与上报排行榜数据（含本地 Mock 兜底）；<br>• `handleRedeemCdkey()`：礼包码兑换金币（如 `GIFT2026`、`666666`、`VALENTINE`）。 |
| `BankModal` | 多银行金融系统（4 家银行开户、存取款、基金申购、信贷借还与账户流水），内部函数 `handleOpenAccount`、`handleDeposit`、`handleWithdraw`、`handleApplyLoan`、`handleRepayLoan` 和 `saveAccounts` 自动汇总各行总额同步至主界面与 `localStorage`。 |

### 2. 工具库与平台适配 (`src/lib/` & `src/utils/` & `worker/`)

| 文件 | 函数 / 导出符号 | 作用说明 |
| :--- | :--- | :--- |
| `src/lib/authClient.ts` | `register`, `login`, `logout`, `getMe`, `resendVerification`, `requestPasswordReset`, `resetPassword`, `translateAuthError` | 调用同域名 `/api/auth/*` 接口（Cookie 会话），并把错误代码翻译为中文提示。 |
| `src/lib/cloudSave.ts` | `useCloudSave`, `collectSnapshot`, `applySnapshot`, `clearLocalGameData` | 已验证邮箱账号的云端存档：登录后首次同步、两边不一致时让玩家选择、每 30 秒及推进月份后自动上传。 |
| `worker/src/index.ts` | `/api/auth/*`, `/api/save` | 注册、登录、退出、邮箱验证、找回密码、存档读写（版本号防覆盖）与限流。 |
| `src/lib/bilibiliToy.ts` | `isRealToySdkAvailable()` | 检测当前运行环境是否挂载了 B 站 `window.toy` 原生 SDK。 |
| `src/lib/bilibiliToy.ts` | `getBilibiliUserProfile()` | 通过 Toy SDK 获取 B 站玩家头像与昵称，不在 B 站环境时抛出明确提示。 |
| `src/lib/bilibiliToy.ts` | `getBilibiliRankList()`, `getBilibiliMyRank()`, `submitBilibiliScore()` | 调用 Toy SDK 拉取榜单、查询个人排名与上报分数，不可用时返回默认结构供上层降级处理。 |
| `src/utils/sensitiveWords.ts` | `validatePlayerName(name)` | 校验角色昵称长度（2-10 字）、空格/不可见字符、纯符号拦截，并基于 `SENSITIVE_WORDS_CONFIG` 执行原串与去符号二次防绕过敏感词匹配，返回违规分类与触发词。 |

### 3. 标签页与功能业务模块 (`src/components/`)

| 组件文件 | 核心函数 / 逻辑说明 |
| :--- | :--- |
| `AuthScreen.tsx` / `AuthModal.tsx` | `handleLogin`、`handleRegister`、`handleBilibiliSignIn`、`handleRequestReset`、`handleSetNewPassword`、`handleLogout`：邮箱登录注册、找回与重置密码、B 站登录。 |
| `EmailVerificationScreen.tsx` | `handleCheckStatus`（刷新 `user.reload()` 检测邮箱是否已激活）、`handleResendEmail`（重发验证邮件并控制冷却）。 |
| `AvatarSelectModal.tsx` | 展示并切换卡通换装人物、社交头像及 4 种预设职业头像（`PRESET_AVATARS`）。 |
| `RoleTab.tsx` | `CartoonCharacter` 根据装备绘制矢量角色；依据 `isRegistered` 与 `health <= 0` 分别展示「公民档案未建档碑」「角色互动主台」或「公民纪念碑」。 |
| `FunctTab.tsx` | `renderBentoContent` 渲染 22 个不同跨度的 Bento 功能砖块，点击分发至对应业务模态框。 |
| `SimTab.tsx` | `handleOptionSelect` 处理「人生快报」堆叠事件卡点击抉择；未建档或角色死亡时展示对应引导页。 |
| `LogTab.tsx` | 展示带有时间虚线轴的人生里程碑卡片，支持按 `全部 / 成长 / 成就 / 转折 / 事业` 过滤。 |
| `FamilyTab.tsx` | 展示瓦伦丁家族三代成员图谱、传家宝加成及大事记，点击成员打开详情卡片进行切磋/请教/送礼互动。 |
| `BirthModal.tsx` | `handleRandomName`（随机姓名）、`handleCopyCitizenId`（复制身份编号）、`handleStamp`（盖章动效）、`handleSubmit`（敏感词校验后完成建档）。 |
| `GenderRightsModal.tsx` | `handleApplyGenderChange`：校验已登记身份与余额（500 ₽ 规费），更新法定性别并持久化。 |
| `CalendarModal.tsx` | 展示 1870 年起的历史月份网格与月度节气事件（`MONTH_EVENTS`），支持直接触发 `onNextMonth` 推进时间。 |
| `HospitalModal.tsx` | `handleTreatment`：按选择医院的折扣与加成计算费用和恢复点数，更新角色金币与健康度。 |
| `JobModal.tsx` | `handleApply`（求职入职）、`handleResign`（离职）、`handleWorkShift`（执行工时打卡获取薪酬）。 |
| `HousingModal.tsx` | `handleBuyProperty`、`handleSellProperty`、`handleToggleRentOut`、`handleSetPrimary`、`handleUpgradeRenovation`、`handleSignRentalLease`、`handleTerminateLease`：支持列表浏览与**独立全屏房源详情视图**，管理名下多套房产与租约。 |
| `StockModal.tsx` | `handleNextTradingDay`（驱动行情波动与新闻事件）、`handleBuy`（买入建仓/摊薄成本）、`handleSell`（卖出平仓计算盈亏）。 |
| `WealthChartModal.tsx` | 聚合现金、多银行存款/贷款、`localStorage` 中的股票持仓市值与房产估值，使用 Recharts 绘制资产配置饼图与现金流分析。 |
| `VisaModal.tsx` | `handleApplyPassport`（申领护照）、`handleApplyVisa`（普通/加急签证办理）、`handleDepartTravel`（出境旅行并记录足迹）。 |
| `ImmigrationModal.tsx` | `handleApplyResidency`（校验资金与健康门槛申请居留权）、`handlePerformOath`（宣誓完成正式入籍）。 |
| `HistoricalFlag.tsx` | 根据国家三字码离线绘制 19 世纪各国矢量国旗，避免外部图床加载失败。 |

---

## 四、项目工作流 (Workflow)

```text
[1. 启动与认证门禁]
  App 加载 -> 调用 /api/auth/me 检测登录状态（网络失败时使用本地缓存的登录用户，可离线游玩）
    ├─ 未登录 ──> AuthScreen (邮箱 / B站 Toy SDK)
    ├─ 密码注册未验证邮箱 ──> EmailVerificationScreen (轮询/手动刷新验证状态)
    └─ 验证通过 ──> 进入游戏主界面 (TopBar + Tab 内容区 + BottomNav)

[2. 公民生命周期流]
  初始未建档 (isRegistered = false)
    └─ RoleTab / SimTab 提示前往「出生登记」 -> BirthModal 校验姓名 & 盖章建档
         └─ 激活公民身份 (随机性别、年龄 8 岁起、解锁角色/推演/不动产/签证等核心交互)
              └─ 点击「下个月」或 CalendarModal 推进时间
                   ├─ 年月 +1、年龄随年份增长
                   ├─ 发放基本俸禄 (+1500 ₽)
                   ├─ 结算名下出租房收益 & 租住租金支出
                   ├─ 结算居住舒适度健康恢复
                   └─ 若健康度 <= 0 -> 进入已故纪念碑状态 -> 可在设置/推演中触发「重置人生」

[3. 经济与社会系统交互流]
  FunctTab 功能中心 / RoleTab 快捷入口
    ├─ 财务与投资：BankModal (4 行开户存贷流水) + StockModal (行情交易) + HousingModal (买房/租房/放租)
    │     └─ 实时汇总至 WealthChartModal 资产全景面板
    ├─ 职场与生活：JobModal (求职/打工赚薪) + HospitalModal (专科诊疗恢复健康) + ShopModal (抽箱/换装)
    └─ 政务与跨国：GenderRightsModal (变更性别) + VisaModal (申办护照签证与出游) + ImmigrationModal (永居入籍)

[4. 个人中心与合规风控流]
  点击 TopBar 头像名片 -> ProfileModal
    ├─ 改名风控：validatePlayerName() 校验 -> 30 天内限改 2 次
    │     └─ 触发「政治与合规敏感」词库 -> 写入违规档案日志 -> 累计 3 次冻结改名功能 90 天
    ├─ 榜单同步：B 站 Toy SDK 上报分数与拉取榜单（非 B 站环境降级为本地模拟榜）
    └─ 账号操作：切换头像、兑换 CDKey、重置人生、打开 AuthModal 或退出登录
```

---

## 五、未完成的功能清单 (TODO / 待完善项)

> 按优先级排列：**P0** 让游戏核心循环真正可玩；**P1** 成本低、体验收益明显的修补；**P2** 独立的新系统或依赖外部条件的工作。

### P0：核心游戏循环（优先完成，按顺序）
1. - [ ] **月度核心循环全链路联动 + 健康消耗**：目前 `handleNextMonth` 仅结算固定 1,500 ₽ 俸禄与房产租金，尚未自动联动：在职岗位月薪发放（`JobModal`）、银行存款利息与贷款扣息（`BankModal`）、股票交易日推进（`StockModal`）、自然衰老与健康消耗机制。健康值目前没有任何下降途径，`health <= 0` 的死亡流程无法触发（见 bug.md #3）。
   - 开工前需确定数值：健康衰减速度、年龄影响、存贷利率、月薪计算方式。
2. - [ ] **推演系统 (`SimTab`)**：目前仅内置 3 个静态示例事件（`INITIAL_EVENTS`），点击选项仅关闭/移除卡片，**尚未实装选项对金币、健康度、声望、日志与胜负战绩的数值结算，也未按月度推进自动生成随机事件**。
3. - [ ] **人生日志 (`LogTab`)**：目前使用硬编码的 `INITIAL_LOG_ENTRIES`（8 条静态记录），**尚未与出生、求职、购房、就医、出国旅行、股票盈亏等真实游玩行为联动自动记录**。在 P0 第 1、2 项完成后，只需在各业务处理函数中写入日志即可。

### P1：体验修补（成本低，可穿插完成）
- [x] **功能中心空入口无反馈**：已完成。13 个未实现的入口显示「即将开放」角标并降低饱和度，点击时提示「即将开放，敬请期待」。
- [x] **个人中心名片资料写死**：已完成。头衔改为显示公民身份/年龄与当前岗位；「当前主业」「持有地产」「拥有服装」读取真实状态；「毕业院校」「声望等级」「机械推演」暂无对应系统，显示「暂未开放」；移除写死的 Lv.22 角标。「特权光环」卡片（服装 9 折、推演爆伤）仍为写死展示，折扣并未生效。

### P2：后续规划
#### 存档与账号
- [x] **多账号存档隔离**：已完成（邮箱账号）。邮箱账号退出登录时会先同步云端再清除本地存档，同一浏览器切换账号不再共用进度；B 站账号仍为本地存档。
- [x] **云端数据库存档**：已完成（Cloudflare Workers + D1，`worker/`、`src/lib/cloudSave.ts`）。已验证的邮箱账号登录后自动同步，两边进度不一致时让玩家选择保留哪份；每 30 秒及推进月份后自动保存。B 站账号暂未接入（Toy SDK 的身份无法在服务端校验）。
- [x] **个人中心「保存进度」按钮**：已完成，点击即上传到云端；非邮箱账号会提示仅本机保存。
- [ ] **上线部署**：需确定域名并在 Cloudflare 绑定；创建远程 D1 数据库并执行迁移；配置 Resend 发信域名（SPF/DKIM），实测 QQ/163 等国内邮箱能否收到验证邮件。

#### 功能中心（`FunctTab`）尚未实现的入口（共 13 项）
目前在 `src/components/FunctTab.tsx` 的 `FUNC_BENTO` 网格中已展示入口卡片，但点击尚无对应弹窗或业务处理器。**教育学府**可与现有求职系统联动，建议最先实现：
- [ ] **教育学府 (`education`)**：小学/中学/帝国理工等学历进修、入学证明与职位学历门槛联动
- [x] **结婚登记 (`marriage`)**：已完成简易版（`src/components/MarriageModal.tsx`）。年满 18 岁可从 10 位随机候选人中选择配偶并登记（规费 1,000 ₽），婚后显示婚姻证书；可办理离婚（手续费 1,000 ₽，子嗣留在家族，前配偶移出族谱，之后可再婚）。
- [ ] **税单查询 (`tax`)**：个人所得税计算、月度/年度税务申报与减免
- [ ] **物价补贴 (`cost`)**：帝国物价指数、生活成本开支与政府补贴申领
- [ ] **企业事务 (`company`)**：自主创立公司、企业登记与经营分红
- [ ] **驾照管理 (`license`)**：马车/早期蒸汽机动车驾照考取与车辆换证
- [ ] **社会福利 (`welfare`)**：养老金、失业救济金与贫困补助申领
- [ ] **法院诉讼 (`court`)**：民事/商业纠纷起诉、法庭调解与判决结果
- [ ] **监狱服刑 (`prison`)**：违法犯罪入狱服刑机制与公民前科记录档案
- [ ] **社团政党 (`org`)**：加入或管理社会组织、商会、学术社团与政党
- [ ] **公民运动 (`movement`)**：社会议题响应、游行示威与法案投票事件
- [ ] **社区地图 (`map_srv`)**：城市公共设施导航与地点交互
- [ ] **文娱休闲 (`entertainment`)**：剧院观演、博彩娱乐与社交圈互动

#### 其他静态模块与锦上添花
- [x] **家族与子嗣系统 (`FamilyTab` & `RoleTab`)**：已完成（`src/lib/family.ts`）。瓦伦丁家族成员年龄随玩家年龄计算，长辈到寿命上限后显示已故；玩家条目显示真实姓名与身份；婚后每月 6% 概率迎来子嗣（双方 ≤45 岁，最多 6 人），子嗣随时间长大并进入「四世」；好感度持久化，每位家人每月可互动 1 次（切磋：健康 +2；请教长辈：获得 200–800 ₽；赠礼：-500 ₽、好感 +5）；家族大事记按游戏时间显示并记录结婚、子嗣出生；RoleTab「子嗣」显示真实人数；传家宝改为纯展示（无数值加成）。
- [ ] **抽奖获得礼物（待定）**：在限定宝箱的奖池中加入「礼物」道具，抽到后存入背包，用于家族「赠礼」互动（替代或补充现在直接花 500 ₽ 的赠礼）。需确定：礼物种类与品质、对不同家人的好感加成、是否保留现金赠礼。
- [ ] **成就勋章**：个人中心 6 项成就为静态列表，尚未接入条件监听与自动解锁。
- [x] **抽卡保底**：已完成（`src/lib/gacha.ts`）。品质暂按售价划分：骑士盔甲=高级、休闲卫衣=稀有、法师长袍=限定；单抽概率限定 1% / 稀有 6% / 高级 13% / 金币 80%；连续 9 抽未出稀有或以上则第 9 抽必出稀有，连续 99 抽未出限定则第 99 抽必出限定；保底计数存档（`amigo_gacha_pity`），宝箱上显示剩余次数；抽到已拥有的服饰返还售价 50% 的金币。
- [ ] **系统设置生效**：「系统设置」中的 BGM、按键音效、60FPS 开关仅控制 UI 开关状态，尚未接入真实音频播放与渲染/动画控制。

### 已完成
- [x] **商城状态持久化**：已购服饰 `ownedClothes`、穿戴状态 `equippedClothing` 与首抽状态 `freeDrawUsed` 已持久化至 `localStorage`（见 bug.md #2）。
- [x] **商城提示**：余额不足时的原生 `alert()` 已替换为应用内 Toast 提示（见 bug.md #12）。
- [x] **开发模式加钱按钮**（`src/components/DevToolsPanel.tsx`）：仅在 `npm run dev` 下显示右下角紫色扳手按钮，可快速增加（+10K / +100K / +1M）、设为 0 或 9,999,999、或输入自定义金额增加/设定；生产构建中不包含该组件。
