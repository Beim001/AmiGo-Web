# AmiGO Lite · 阿米诺斯文明人生模拟器

> 基于 **React 19 + TypeScript + Vite + Tailwind CSS v4** 构建的 19 世纪架空工业帝国（卡罗尼亚帝国 / 阿米诺斯）人生模拟 Web 应用，集成 **Firebase Authentication** 账号体系、**Bilibili Toy SDK** 排行榜/资料同步能力以及本地多模块经济与公民身份模拟系统。

---

## 一、技术栈与环境配置

- **前端框架**：React 19、TypeScript 5.8、Vite 6
- **样式与动效**：Tailwind CSS v4 (`@tailwindcss/vite`)、`motion`、`lucide-react`
- **数据可视化**：`recharts`（个人资产全景饼图/占比分析）
- **身份认证**：Firebase Auth（邮箱密码登录/注册/验证/重置密码、Google OAuth、匿名登录）
- **平台扩展**：Bilibili Toy SDK (`//s1.hdslb.com/bfs/seed/toy/app/sdk/toy-sdk.js`) 与本地 Fallback 机制
- **本地运行**：
  ```bash
  npm install
  npm run dev      # 启动开发服务器（端口 3000）
  npm run lint     # TypeScript 类型检查 (tsc --noEmit)
  npm run build    # 构建生产包
  ```

---

## 二、项目结构

```text
.
├── index.html                        # HTML 入口，引入 Google Fonts 与 Bilibili Toy SDK 脚本
├── metadata.json                     # AI Studio 应用元信息与能力声明
├── package.json                      # 依赖与脚本配置 (dev / build / preview / lint)
├── tsconfig.json                     # TypeScript 编译配置
├── vite.config.ts                    # Vite 配置（base: './'、React 与 Tailwind 插件）
├── .env.example                      # 环境变量模板
└── src/
    ├── main.tsx                      # React 根节点挂载入口
    ├── index.css                     # 全局样式与 Tailwind CSS 引入
    ├── firebase.ts                   # Firebase 初始化、Auth 实例与认证 API 导出
    ├── App.tsx                       # 主应用壳、全局状态管理、顶部/底部导航、商城/个人中心/多银行系统
    ├── lib/
    │   └── bilibiliToy.ts            # Bilibili Toy SDK 封装与环境变量检测/本地兜底
    ├── utils/
    │   └── sensitiveWords.ts         # 多分类敏感词库配置与昵称合规校验工具
    └── components/
        ├── AuthScreen.tsx            # 强制登录门禁首屏（邮箱/Google/B站/游客登录与注册）
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
| `handleLogout()` | 调用 Firebase `signOut` 退出登录并清除本地 `amigo_active_user` 缓存，返回认证门禁页。 |
| `renderAvatarContent()` | 根据 `avatarSource` 动态渲染顶部栏与个人中心的头像内容（社交平台头像 / 预设角色徽章 / 换装卡通角色 SVG）。 |
| `TopBar` / `BottomNav` | 顶部栏展示玩家头像名片与现金入口；底部 5 栏导航切换 `角色 / 功能 / 推演 / 日志 / 家族`。 |
| `ShopModal` / `ChestAnimation` | 服饰商城与限定宝箱抽奖界面，`handleDraw(times)` 实现单抽（含首抽免费）与十连抽逻辑及开箱动画。 |
| `ProfileModal` | 个人中心界面，包含：<br>• `handleSaveName()`：整合敏感词校验、每月最多改名 2 次限制、政治敏感词 3 次违规触发 90 天冻结及日志留档；<br>• `handleSyncBilibiliProfile()`：调用 B 站 SDK 同步昵称头像并执行敏感词校验；<br>• `refreshRankData()` / `handleSubmitScore()`：拉取与上报排行榜数据（含本地 Mock 兜底）；<br>• `handleRedeemCdkey()`：礼包码兑换金币（如 `GIFT2026`、`666666`、`VALENTINE`）。 |
| `BankModal` | 多银行金融系统（4 家银行开户、存取款、基金申购、信贷借还与账户流水），内部函数 `handleOpenAccount`、`handleDeposit`、`handleWithdraw`、`handleApplyLoan`、`handleRepayLoan` 和 `saveAccounts` 自动汇总各行总额同步至主界面与 `localStorage`。 |

### 2. 工具库与平台适配 (`src/lib/` & `src/utils/` & `src/firebase.ts`)

| 文件 | 函数 / 导出符号 | 作用说明 |
| :--- | :--- | :--- |
| `src/firebase.ts` | `auth`, `googleProvider`, `analytics` | 初始化 Firebase 实例并导出邮箱登录、注册、验证、重置密码、Google 弹窗登录及匿名登录方法。 |
| `src/lib/bilibiliToy.ts` | `isRealToySdkAvailable()` | 检测当前运行环境是否挂载了 B 站 `window.toy` 原生 SDK。 |
| `src/lib/bilibiliToy.ts` | `getBilibiliUserProfile()` | 通过 Toy SDK 获取 B 站玩家头像与昵称，不在 B 站环境时抛出明确提示。 |
| `src/lib/bilibiliToy.ts` | `getBilibiliRankList()`, `getBilibiliMyRank()`, `submitBilibiliScore()` | 调用 Toy SDK 拉取榜单、查询个人排名与上报分数，不可用时返回默认结构供上层降级处理。 |
| `src/utils/sensitiveWords.ts` | `validatePlayerName(name)` | 校验角色昵称长度（2-10 字）、空格/不可见字符、纯符号拦截，并基于 `SENSITIVE_WORDS_CONFIG` 执行原串与去符号二次防绕过敏感词匹配，返回违规分类与触发词。 |

### 3. 标签页与功能业务模块 (`src/components/`)

| 组件文件 | 核心函数 / 逻辑说明 |
| :--- | :--- |
| `AuthScreen.tsx` / `AuthModal.tsx` | `handleLogin`、`handleRegister`、`handleGoogleSignIn`、`handleBilibiliSignIn`、`handleResetPassword`、`handleLogout`：提供完整的登录、注册、第三方授权及游客体验入口。 |
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
  App 加载 -> Firebase onAuthStateChanged 检测 (含 2.5s 网络超时保护)
    ├─ 未登录 ──> AuthScreen (邮箱 / Google / B站 Toy SDK / 游客)
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

### 1. 功能中心（`FunctTab`）中尚未实现具体页面的入口（共 13 项）
目前在 `src/components/FunctTab.tsx` 的 `FUNC_BENTO` 网格中已展示入口卡片，但点击尚无对应弹窗或业务处理器：
- [ ] **结婚登记 (`marriage`)**：婚姻关系缔结、配偶系统与婚后家庭联动
- [ ] **税单查询 (`tax`)**：个人所得税计算、月度/年度税务申报与减免
- [ ] **物价补贴 (`cost`)**：帝国物价指数、生活成本开支与政府补贴申领
- [ ] **企业事务 (`company`)**：自主创立公司、企业登记与经营分红
- [ ] **驾照管理 (`license`)**：马车/早期蒸汽机动车驾照考取与车辆换证
- [ ] **教育学府 (`education`)**：小学/中学/帝国理工等学历进修、入学证明与职位学历门槛联动
- [ ] **社会福利 (`welfare`)**：养老金、失业救济金与贫困补助申领
- [ ] **法院诉讼 (`court`)**：民事/商业纠纷起诉、法庭调解与判决结果
- [ ] **监狱服刑 (`prison`)**：违法犯罪入狱服刑机制与公民前科记录档案
- [ ] **社团政党 (`org`)**：加入或管理社会组织、商会、学术社团与政党
- [ ] **公民运动 (`movement`)**：社会议题响应、游行示威与法案投票事件
- [ ] **社区地图 (`map_srv`)**：城市公共设施导航与地点交互
- [ ] **文娱休闲 (`entertainment`)**：剧院观演、博彩娱乐与社交圈互动

### 2. 已有界面但仍为静态演示或未完全打通联动的模块
- [ ] **推演系统 (`SimTab`)**：目前仅内置 3 个静态示例事件（`INITIAL_EVENTS`），点击选项仅关闭/移除卡片，**尚未实装选项对金币、健康度、声望、日志与胜负战绩的数值结算，也未按月度推进自动生成随机事件**。
- [ ] **人生日志 (`LogTab`)**：目前使用硬编码的 `INITIAL_LOG_ENTRIES`（8 条静态记录），**尚未与出生、求职、购房、就医、出国旅行、股票盈亏等真实游玩行为联动自动记录**。
- [ ] **家族与子嗣系统 (`FamilyTab` & `RoleTab`)**：家族成员列表、传家宝 Buff 与大事记目前为静态展示；家族成员「切磋交流 / 家族请教 / 赠送礼物」仅弹 Toast 提示，未持久化好感度变化；`RoleTab` 中「子嗣」卡片目前固定显示 `0 人`。
- [ ] **个人中心 (`ProfileModal`) 动态数据与设置生效**：
  - [ ] 「名片资料」中的毕业院校、当前主业、持有地产、声望等级及「18胜/0败」「4/4套服装」目前为静态写死文本，未读取真实游戏状态；
  - [ ] 「成就勋章」6 项成就为静态列表，尚未接入条件监听与自动解锁；
  - [ ] 「系统设置」中的 BGM、按键音效、60FPS 开关仅控制 UI 开关状态，尚未接入真实音频播放与渲染/动画控制；
  - [ ] 「保存进度」按钮目前仅提示成功，尚未真正接入云端存档接口。
- [ ] **商城与宝箱 (`ShopModal`)**：
  - [ ] 宝箱文案提示的「9 次内必得稀有、99 次内必得限定」尚未实现真实抽卡保底计数器；
  - [x] ~~已购服饰 `ownedClothes`、穿戴状态 `equippedClothing` 与首抽状态 `freeDrawUsed` 仅保存在内存 `useState` 中，刷新页面后会丢失~~（已持久化至 `localStorage`，见 bug.md #2）；
  - [x] ~~余额不足时仍使用原生 `alert()`~~（已替换为应用内 Toast 提示，见 bug.md #12）。

### 3. 全局持久化、月度结算联动与账号隔离
- [ ] **云端数据库存档**：项目目前仅使用 Firebase Authentication，尚未配置 Firestore / 云存储或 B 站 `setCloudStorage` 来跨设备保存玩家人生档案。
- [ ] **多账号存档隔离**：游戏状态存储在全局 `localStorage` Key（如 `amigo_owned_properties`、`amigo_multi_bank_accounts_v1` 等），未按 `authUser.uid` 隔离，同一浏览器切换账号会共享同一份本地存档。
- [ ] **月度核心循环全链路联动**：目前 `handleNextMonth` 仅结算固定 1,500 ₽ 俸禄与房产租金，尚未自动联动：在职岗位月薪发放（`JobModal`）、银行存款利息与贷款扣息（`BankModal`）、股票交易日推进（`StockModal`）、自然衰老与健康消耗机制。

### 4. 开发与测试工具
- [ ] **开发模式加钱按钮**：仅在 `npm run dev` 下显示（与 `VITE_SKIP_AUTH` 一样不进入生产构建），一键增加或设置现金余额，方便测试商城、购房、移民等高额消费功能与大额数字的界面显示。目前需在浏览器控制台手动执行 `localStorage.setItem('amigo_coins', '9999999'); location.reload();`。
