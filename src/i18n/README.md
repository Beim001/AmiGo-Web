# 界面多语言（i18n）

界面文案已全部抽取到 `locales/zh-CN/` 的语言包中，目前只提供简体中文。下列内容仍以中文硬编码在源码里，切换到其他语言后会继续显示中文。

## 使用方式

- 组件内用 `useTranslation('<命名空间>')` 取得 `t`；组件外（hooks 的返回值、`lib/` 中的格式化函数）用 `import i18n from '../i18n'` 后调用 `i18n.t('<命名空间>:<键>')`。
- 翻译键参与 TypeScript 类型检查（`i18next.d.ts`），键名或插值参数写错时 `npm run lint` 会报错。新增文案必须先写进 `locales/zh-CN/<命名空间>.json`，再在代码中引用。
- 命名空间在 `locales/zh-CN/index.ts` 中登记，与组件或功能一一对应，例如 `bank` 对应 `BankModal`。
- 新增语言：复制 `locales/zh-CN/` 为新的语言目录并翻译，然后在 `index.ts` 的 `resources` 与 `LANGUAGES` 中各加一项，登录界面的语言选择会自动出现该选项。

## 未翻译的内容

### 1. 仅开发环境可见的内容

| 位置 | 内容 |
| --- | --- |
| `components/DevToolsPanel.tsx` | 开发测试面板全部文案 |
| `App.tsx` 中传给 `DevToolsPanel` 的回调 | 以 🛠️ 开头的提示、`allowancePreview`、测试用 `antibodyText` |
| `App.tsx` | `DEV_MOCK_USER` 的昵称、`VITE_SKIP_AUTH` 的控制台提示 |
| 各处 `console.warn` / `console.info` | 调试日志 |

原因：这些内容只在 `npm run dev` 下出现，生产构建会把 `DevToolsPanel` 整段删除，玩家看不到。

### 2. 写入存档的文本

| 内容 | 位置 |
| --- | --- |
| 人生日志的标题与正文（`addLifeLog` 的参数） | 各组件与 hooks |
| 银行流水标题与 `'刚才'` 时间标记 | `BankModal.tsx` |
| 股票成交记录的 `交易日 #N` | `StockModal.tsx` |
| 判决记录的结果文字 | `CourtModal.tsx` |
| 文娱活动结果叙述（同时写入日志） | `LeisureModal.tsx` |
| 出境游历故事、收益描述、`destination` | `VisaModal.tsx` |
| 就诊记录标题与时间 | `HospitalModal.tsx` |
| 护照持有人默认名 `'帝国公民'` | `VisaModal.tsx` |
| 传家宝来源（`'参军'`、`'拍卖会'` 等）与保管人 `'当家人'` | `App.tsx`、`hooks/useSimpleMode.ts` |

原因：这些文本以字符串形式保存在 localStorage 和云存档中，翻译后只影响新写入的记录，旧记录仍是中文，同一份存档会混杂多种语言。要让它们随语言切换，需要改为保存翻译键和参数，并迁移已有存档，这已超出界面文案的范围。

### 3. 参与程序判断的数据值

| 数据值 | 用途 |
| --- | --- |
| 性别 `'男'` / `'女'` | 存档字段，决定外貌、生育、称谓等逻辑 |
| 家族成员状态 `'在世'` / `'已故'`、辈分 `'子辈'` 等 | `lib/family` 生成，组件据此筛选和配色 |
| 日志分类 `'大事'`、`'成长'` 等 | 日志筛选与统计 |
| 敏感词分类 `'政治与合规敏感'` | `utils/sensitiveWords` 返回，用于改名冻结判断 |
| 股票板块（重工、医药…）、房产类型（住宅公寓…）、岗位分类（政法治安…） | 与行情、房源、岗位数据的字段比较 |
| 模拟排行榜的 `'(你)'` 标记 | `useRankBoard` 用它识别玩家自己那一行 |

原因：这些字符串既是显示文字，也是程序比较的值，并且部分已写入存档。直接替换显示文字会让比较失效。界面上能单独翻译的部分已经处理：筛选项中的“全部”“自选”改为内部常量 `all` / `favorites`，性别显示改为“法定性别：男/女”等翻译键；数据值本身保持原样。

### 4. 游戏内容与世界观数据

| 内容 | 位置 |
| --- | --- |
| 推演事件、疾病、特质、人名、传家宝、礼物、成就、致谢名单 | `lib/`、`data/` |
| 银行名称与时局事件、股票名称与财经快讯、车马与执照、抽卡稀有度标签、外貌部位名称 | `lib/` |
| 岗位与企业资料（`JOB_POSITIONS`、`COMPANY_DATA`） | `JobModal.tsx` |
| 房源资料（`HOUSING_MARKET_PROPERTIES`） | `HousingModal.tsx` |
| 签证方案（`HISTORICAL_VISAS`） | `VisaModal.tsx` |
| 各国永久居留法案 | `ImmigrationModal.tsx` |
| 医院、诊疗项目与处方药品 | `HospitalModal.tsx` |
| 日历月份事件 | `CalendarModal.tsx` |
| 未登记时的示例日志 | `LogTab.tsx` |
| 瓦伦丁家族格言 | `FamilyTab.tsx` |
| 模拟排行榜的假昵称 | `profile/useRankBoard.ts` |
| 服装名称 | `data/clothing.ts`、`CharacterAvatar.tsx` |

原因：这些是阿米诺斯世界观的设定文本，翻译需要统一专有名词（地名、机构、人名、货币）的译法，属于内容本地化。它们大多以数据表形式定义，部分字段还参与第 3 类的程序判断，需要先为数据表设计多语言结构再翻译。

### 5. `lib/` 返回给界面的提示

例如 `canArrangeMarriage`、`canInteract` 的拦截原因，`PRISON_BLOCK_TEXT`，车马、文娱、福利等模块返回的不可操作原因。

原因：这些文字和规则判断写在同一个函数里，返回值直接显示在界面上。本次抽取范围限定在组件和 hooks，`lib/` 只改了纯格式化的 `formatDuration`。翻译这些提示需要把规则函数改为返回原因代码，由界面层负责翻译，会改动规则库的函数签名和对应单元测试。

## 对界面的影响

切换到其他语言后，按钮、标题、表单、提示框等界面元素都会显示新语言。以下几处仍是中文：

- 人生日志、各类流水和记录。
- 家族成员的状态和辈分、日志分类、各类筛选项里的分类名。
- 岗位、房源、签证、医院等数据卡片的标题和描述。
- 由 `lib/` 规则判断返回的拦截提示。
