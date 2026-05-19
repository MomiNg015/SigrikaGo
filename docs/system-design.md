# SigrikaGo System Design

本文档基于当前代码库静态分析生成，目标是方便后续维护者和 AI 继续接手。未在代码中确认的内容会标注为“待确认”。

## 1. 项目目录结构说明

```text
SigrikaGo/
  .env.example                 # 本地环境变量模板
  index.html                   # Vite 入口 HTML
  package.json                 # npm 脚本与依赖
  vite.config.js               # Vite + React 配置，开发期代理 /api 与 /uploads 到后端
  docs/
    system-design.md           # 本文档
    superpowers/               # 既有设计/计划文档
  prisma/
    schema.prisma              # Prisma SQLite 数据模型
  public/
    assets/                    # 角色/其他静态图片资源
  server/
    index.js                   # Express + Socket.IO 服务入口
    rooms.js                   # 实时房间、匹配、对局流程、计时、棋谱保存
    auth.js                    # HTTP JWT 鉴权与管理员中间件
    socketAuth.js              # Socket.IO JWT 鉴权与角色解析
    adminConfig.js             # 管理员用户名配置与角色提升
    adminRoutes.js             # /api/admin 后台管理路由
    characters.js              # 角色/技能校验、序列化、内置角色种子
    characterSelection.js      # 用户出战角色解析与 fallback
    db.js                      # Prisma Client 与 publicUser 序列化
    shop.js                    # 商城/装饰校验、价格、购买逻辑
    leaderboard.js             # 排行榜统计逻辑
    siteSettings.js            # 站点公开配置与后台更新逻辑
    skillRegistry.js           # 角色技能 fallback 配置转换
    *.test.js                  # Vitest 单元测试
  src/
    main.jsx                   # React 单页应用入口与大厅/对局/弹窗组装
    api/
      client.js                # 前端 HTTP JSON、后台 API、上传请求封装
    admin/
      AdminConsole.jsx         # 后台管理界面与后台 CRUD 组件
    styles.css                 # 全局样式
    shared/
      game.js                  # 13 路围棋规则、技能、数子、回放核心逻辑
      boardView.js             # 棋盘展示辅助：最后落子/技能标记与技能预览判定
      characters.js            # 前端角色合并逻辑
      characterFallback.js     # 内置角色 fallback 配置
      siteSettings.js          # 前后端共用站点配置默认值
      *.test.js                # 共享逻辑测试
```

运行相关文件：

- `.env` 未纳入 Git，当前模板包含 `DATABASE_URL`、`JWT_SECRET`、`PORT`。
- `.gitignore` 排除了 `node_modules`、`dist`、`.env`、SQLite 数据库、开发日志等。
- 当前工作目录是 Git 仓库工作树，当前分支可通过 `git status` 检查。

## 2. 当前核心模块

### 前端

- `src/main.jsx`
  - React SPA 的集中入口。
  - 包含认证、大厅、对局、棋舍、商城、排行榜、设置等组件，并挂载后台管理入口。
  - 使用 `useState` / `useEffect` 做本地状态管理。
  - 通过 `src/api/client.js` 调用 HTTP API，通过 `socket.io-client` 连接实时对局。

- `src/admin/AdminConsole.jsx`
  - 后台管理界面模块。
  - 包含概览、用户、角色、商城、装饰、系统设置、审计日志等后台组件。
  - 该模块已从 `src/main.jsx` 拆出，但内部仍可继续按业务域拆分。

- `src/api/client.js`
  - 前端 HTTP 请求封装。
  - 提供普通 JSON API、后台 API 和角色立绘上传 helper。

- `src/shared/game.js`
  - 共享的游戏规则引擎。
  - 负责棋盘状态、落子、提子、禁自杀、劫、弃手、认输、技能、隐藏手、死子标记、数子、回放重算等。
  - 该模块被前端回放逻辑与服务端房间逻辑共同使用。

- `src/shared/systemVoices.js`
  - 定义系统语音事件 key 和默认 TTS 文本。
  - 当前预留 `game-start`、进入读秒、剩余读秒次数、读秒倒计时、超时、胜/负/和结果等事件，未来可由角色专属语音资源覆盖。

- `src/shared/characters.js` 与 `src/shared/characterFallback.js`
  - 定义内置角色 fallback。
  - 将后端 DB 角色与内置角色合并。

- `src/styles.css`
  - 单文件全局样式，覆盖全部页面、弹窗、棋盘、后台、商城等。

### 后端

- `server/index.js`
  - Express HTTP API 与 Socket.IO 入口。
  - 初始化内置角色 seed、提升配置管理员。
  - 注册公开 API、登录/注册 API、用户 API、棋谱 API、排行榜 API，并挂载 `/api/admin`。

- `server/rooms.js`
  - 内存态房间系统。
  - 管理匹配队列、房间成员、观战、Socket 广播、聊天、计时、读秒、和棋/数子流程、技能演出、结束后保存棋谱与更新胜负积分。

- `server/adminRoutes.js`
  - 后台管理路由。
  - 管理用户、封禁/解封、重置密码、角色、技能、装饰、商城商品、站点设置、上传、审计日志、任意用户棋谱查看。

- `server/siteSettings.js`
  - 站点公开配置读取和后台更新逻辑。
  - 当前管理大厅标题 `homeTitle` 与大厅副标题 `homeSubtitle`，并写入后台审计日志。

- `server/characters.js`
  - 角色输入校验、技能校验、公开 payload 转换、内置角色初始化。

- `server/shop.js`
  - 商城商品和装饰校验、折扣价格计算、购买事务。

- `server/leaderboard.js`
  - 从用户与棋谱记录中统计排行榜。

- `server/auth.js` / `server/socketAuth.js`
  - HTTP 与 Socket.IO 的 JWT 鉴权。

- `server/db.js`
  - Prisma Client 单例和用户公开字段序列化。

## 3. 已实现功能列表

### 账号与用户

- 用户注册与登录。
- 密码使用 `bcryptjs` 哈希存储。
- JWT 登录态，token 有效期为 14 天。
- 用户状态支持 `active` / `banned`。
- 管理员可配置、可在启动或登录时自动提升。
- 用户公开字段序列化会隐藏 `passwordHash`。

### 大厅与个人空间

- 大厅入口：棋舍、空想对局、观战、排行榜、商城、后台管理（管理员可见）。
- 大厅首页布局 A：空想对局作为最大主行动面板；棋舍作为带出战角色与用户段位/积分的次级入口；观战、排行榜、商城、后台管理以中等图标按钮呈现。
- 大厅顶部标题和副标题来自 `GET /api/site-settings`；未配置或接口失败时回退到 `大厅` / `SigrikaGo`。
- 棋舍展示用户战绩、积分、拥有角色、出战角色。
- 棋舍可查看个人对局回放。
- 设置弹窗支持音量配置，并保存在 `localStorage`。

### 对局

- Socket.IO 两人匹配。
- 5 位房间号观战。
- 13 路棋盘。
- 中国数子规则，`KOMI_STONES = 2.75`。
- 基础规则：落子、提子、禁自杀、劫、弃手、认输。
- 对局聊天和系统消息。
- 匹配成功后先显示 3 秒匹配成功弹窗；进入房间后处于 `opening` 开局展示阶段，玩家看到“本局你执黑/白”弹窗，服务端在该阶段暂停棋钟和落子/技能操作。
- 开局展示结束后服务端切换到 `playing`，写入 `game-start` 系统消息，前端播放“对局开始”系统语音，并从该时刻开始推进棋钟。
- 计时与读秒：房间玩家包含 `mainTime`、`byoYomi`、`byoYomiPeriods` 等内存字段。
- 超时判负。
- 双方连续弃手进入数子申请/确认流程。
- 数子流程：申请、接受/拒绝、标记死子、标记单官/中立点、确认死子、结果确认、拒绝后继续。
- 和棋申请，10 秒超时拒绝。
- 结束后保存棋谱，并通过 `resultRewardDelta` 更新战绩、积分与金币：胜者积分 +20 / 金币 +50，败者积分 -20 / 金币 +20，和棋不更新用户奖励。
- 开发测试按钮：`test-random-layout` 会清空棋盘并生成符合基本气规则的 50 黑 50 白随机布局；`test-restore-skill` 会恢复当前玩家技能次数。该入口用于本地测试，后续应便于统一移除。

### 技能与角色

- 内置角色 fallback：`sigrika`、`danea`、`aemeath`、`baconbits`、`nabomo`。
- DB 角色会覆盖/合并内置角色。
- 所有存在的角色都会出现在棋舍角色列表；未拥有角色以灰色状态展示，可查看信息但不可出战。
- 角色信息包含 `acquisitionMethod`/“获得途径”纯文本，可由后台维护。
- 娜波摩的获得途径为积分达到 1400 分自动获得；公开用户序列化时会根据 `User.rating` 自动补充 `nabomo` 到已拥有角色列表。
- 技能类型：
  - `erase-point`：抹除空交叉点，点位不可落子且不参与数子。
  - `flip-stone`：反转目标棋子颜色。
  - `hidden-hand`：隐藏手，未暴露前对对方隐藏。
  - `random-blast`：随机选择一个完整区域并移除其中棋子；猪小仙当前使用固定完整 3x3，中心点被限制在棋盘内部，避免边角裁剪。
  - `color-illusion-passive`：娜波摩被动技“千变万化”。第一次轮到娜波摩玩家时自动进入技能演出，演出结束后该玩家后续落子有 80% 概率在对手视角中显示为对手颜色，真实棋盘规则仍按实际颜色计算；进入数子、结果确认或对局结束后会显示真实棋盘。
  - 达妮娅 `flip-stone` 作用于真实棋子；如果目标点带有娜波摩伪装，反色后会清除该点伪装。
- 技能演出流程：服务端先进入 `skill-preview` 并广播 `pendingSkill`，此时棋盘保持旧状态；中间横幅动画结束后才真正应用技能效果并再次广播。
- 开局被动技能不会在 `opening` 阶段触发；正式进入 `playing` 后才按延迟规则触发，避免和执色提示/开局语音重叠。
- 无目标技能不显示落子/目标预览；猪小仙技能生效后会在完整 3x3 区域留下较弱的交叉点高亮，施放者下一手落子后清除。
- 技能可配置：
  - 使用次数 `uses`
  - 是否不消耗回合 `freeTurn`
  - 目标规则 `targetRule`
  - 参数 JSON `paramsJson`
  - 代价类型 `costType`
  - 代价值 `costValue`
  - 系统消息模板 `systemMessage`
- 系统消息模板当前支持：`{player}`、`{character}`、`{skill}`、`{point}`、`{fromColor}`、`{toColor}`、`{targetColor}`，并保留 `{color}` 兼容旧配置。

### 棋谱与回放

- 对局结束后写入 `GameRecord`。
- 棋谱保存房间快照 `snapshot`。
- 用户可看自己的最近 30 条棋谱。
- 管理员可查看任意用户棋谱与任意棋谱详情。
- 前端回放通过 `replayRoomAt` 基于历史步骤重放共享规则逻辑。
- 观战者进入房间后默认使用黑方对局视角，包括双方信息区位置；黑白双方信息区立绘左侧提供眼睛图标，可切换黑方/白方视角；下方操作栏切换为图标式回放控制。
- 棋谱回放同样支持黑方/白方视角切换，回放棋盘会按所选视角重放隐藏手和娜波摩伪装效果。
- 观战回放只改变棋盘内容，不改变实时信息区内容（计时、读秒、提子、代价等保持实际对局进程）。
- 观战者停在最新手时会自动跟随实时进程；如果手动回退到旧手，则新进程不会强制跳回最新。

### 商城与装饰

- 商品支持 `character` 与 `decoration` 两类。
- 商品有原价、折扣、是否可购买、是否展示、排序、描述、图片。
- 购买会扣除用户金币，并写入 `ownedCharacters` 或 `ownedDecorations`。
- 内置商品会 seed 猪小仙角色商品，价格 9999 金币；用户购买后才可出战该角色。
- 装饰数据模型和后台管理已实现；玩家端装饰实际使用方式待确认。

### 排行榜

- 入口在大厅。
- API 为 `GET /api/leaderboard`。
- 仅展示至少完成过一盘对局的用户。
- 按 `rating` 降序排序。
- 从棋谱统计总对局数、胜局数、负局数、和棋数。
- “常用角色”按棋谱中该用户使用次数最多的角色计算。

### 后台管理

- 概览：用户数、封禁用户数、启用角色数、棋谱数、最近审计日志。
- 用户管理：列表、状态标签、右侧抽屉编辑角色/段位/积分/金币/拥有角色/出战角色、封禁、解封、重置密码、查看用户棋谱。
- 角色管理：左侧角色列表、右侧编辑面板，支持新增/编辑/禁用角色、配置技能系统。
- 角色立绘上传：支持 png/jpeg/webp/gif，大小限制 3MB。
- 商城管理：列表主视图，新增/编辑商品在右侧抽屉中完成，支持下架商品。
- 装饰管理：列表主视图，新增/编辑装饰在右侧抽屉中完成，支持停用装饰。
- 系统设置：可编辑大厅标题和大厅副标题；保存后通过 `SiteSetting` 持久化，并立即回写当前前端大厅状态。
- 审计日志：记录部分后台操作前后值。

## 4. 数据模型与字段说明

数据源定义在 `prisma/schema.prisma`，数据库为 SQLite。

### User

用户账号与资产/战绩。

- `id`: 主键 cuid。
- `username`: 唯一用户名。
- `passwordHash`: bcrypt 哈希密码。
- `role`: 用户角色，当前代码使用 `player` / `admin`。
- `status`: 用户状态，当前代码使用 `active` / `banned`。
- `banReason`: 封禁原因，可空。
- `bannedAt`: 封禁时间，可空。
- `rank`: 段位/等级文本。默认值在当前 schema 终端显示存在编码问题，语义待确认。
- `rating`: 积分，默认 1000。
- `wins`: 胜局数，默认 0。
- `losses`: 负局数，默认 0。
- `coins`: 金币，默认 300。
- `selectedCharacter`: 出战角色 slug，默认 `sigrika`。
- `ownedCharacters`: 逗号分隔的角色 slug 字符串，默认包含内置角色。
- `ownedItems`: 逗号分隔字符串；当前代码未看到具体购买/使用逻辑，待确认。
- `ownedDecorations`: 逗号分隔装饰 slug。
- `createdAt`, `updatedAt`: 创建和更新时间。

### GameRecord

结束对局记录。

- `id`: 主键 cuid。
- `roomCode`: 房间号。
- `blackUserId`, `whiteUserId`: 黑白双方用户 id。
- `blackName`, `whiteName`: 保存时的用户名快照。
- `blackCharacter`, `whiteCharacter`: 双方角色 slug 快照。
- `resultText`: 结果文本。
- `moveCount`: 手数。
- `snapshot`: JSON 字符串，保存 `roomView` 快照。
- `createdAt`: 创建时间。

### Character

可配置角色。

- `id`: 主键 cuid。
- `slug`: 唯一角色标识，用于前端匹配、出战角色、拥有角色、棋谱角色字段。
- `name`: 角色名。
- `portraitUrl`: 立绘 URL 或静态路径。
- `portraitSource`: `url` 或 `upload`。
- `palette`: 代表色。
- `acquisitionMethod`: 获得途径纯文本，显示在棋舍角色详情中。
- `enabled`: 是否启用。
- `sortOrder`: 排序。
- `skill`: 一对一 `CharacterSkill`。
- `createdAt`, `updatedAt`: 创建和更新时间。

### CharacterSkill

角色技能配置。

- `id`: 主键 cuid。
- `characterId`: 关联 `Character.id`，唯一。
- `effectType`: 技能实际效果类型，当前支持 `erase-point`、`flip-stone`、`hidden-hand`、`random-blast`、`color-illusion-passive`。
- `name`: 技能名。
- `description`: 技能描述。
- `uses`: 每局使用次数。
- `freeTurn`: 是否不消耗回合。
- `targetRule`: 目标规则，当前校验为 `empty-point`、`stone` 或 `any-point`。
- `paramsJson`: JSON 字符串，当前作为扩展参数保留。
- `costType`: `numeric` 或 `special`。
- `costValue`: 代价值；`numeric` 会参与数子扣分，`special` 当前仅展示。
- `systemMessage`: 技能系统消息模板。
- `enabled`: 是否启用；当前公开角色 payload 未看到按 skill.enabled 过滤，待确认。
- `createdAt`, `updatedAt`: 创建和更新时间。

### Decoration

装饰配置。

- `id`: 主键 cuid。
- `slug`: 唯一装饰标识。
- `name`: 装饰名。
- `description`: 描述。
- `imageUrl`: 图片地址。
- `enabled`: 是否启用。
- `sortOrder`: 排序。
- `createdAt`, `updatedAt`: 创建和更新时间。

### ShopItem

商城商品。

- `id`: 主键 cuid。
- `name`: 商品名。
- `category`: `character` 或 `decoration`。
- `targetId`: 商品对应角色 slug 或装饰 slug。
- `priceCoins`: 原价金币。
- `discountPercent`: 折扣百分比 0-100。
- `purchasable`: 是否可购买。
- `enabled`: 是否展示。
- `sortOrder`: 排序。
- `description`: 描述。
- `imageUrl`: 图片地址。
- `createdAt`, `updatedAt`: 创建和更新时间。

### AdminAuditLog

后台审计日志。

- `id`: 主键 cuid。
- `adminUserId`: 操作管理员用户 id。
- `action`: 操作类型，如 `user.update`、`character.update`。
- `targetType`: 目标类型，如 `user`、`character`。
- `targetId`: 目标 id 或 slug。
- `beforeJson`: 操作前 JSON，可空。
- `afterJson`: 操作后 JSON，可空。
- `createdAt`: 创建时间。

### SiteSetting

站点级公开配置，以 key/value 形式存储，方便后续扩展更多大厅文案或全局展示配置。

- `key`: 主键。当前使用 `homeTitle` 与 `homeSubtitle`。
- `value`: 配置值字符串。
- `createdAt`, `updatedAt`: 创建和更新时间。

## 5. 数据之间的关系

- `Character` 与 `CharacterSkill` 是一对一关系：
  - `CharacterSkill.characterId` 唯一并引用 `Character.id`。
  - 删除角色会级联删除技能。

- `User` 与 `GameRecord` 没有 Prisma relation 声明，但通过字符串字段形成逻辑关系：
  - `GameRecord.blackUserId` / `whiteUserId` 对应 `User.id`。
  - `GameRecord.blackName` / `whiteName` 是用户名快照。

- `Character` 与 `GameRecord` 没有 Prisma relation 声明：
  - `GameRecord.blackCharacter` / `whiteCharacter` 保存角色 slug 快照。
  - 前端展示时通过 `findCharacter` 在当前角色集合中解析。

- `User` 与角色/装饰拥有关系没有 join table：
  - `User.ownedCharacters`、`ownedDecorations` 使用逗号分隔字符串。
  - `User.selectedCharacter` 保存单个角色 slug。

- `ShopItem.targetId` 与角色/装饰没有数据库外键：
  - `category = character` 时逻辑上指向 `Character.slug`。
  - `category = decoration` 时逻辑上指向 `Decoration.slug`。

- 实时 `Room`、`Player`、`GameState` 不是数据库模型：
  - 保存在 `server/rooms.js` 的内存 `Map`。
  - 对局结束后才以 `GameRecord.snapshot` 形式落库。

## 6. API 路由与接口用途

### 公开/普通用户 HTTP API

- `GET /api/health`
  - 健康检查。

- `GET /api/characters`
  - 返回启用角色列表和停用 slug 列表。
  - 不要求登录。

- `GET /api/site-settings`
  - 返回公开站点配置。
  - 当前包含大厅标题 `homeTitle` 与大厅副标题 `homeSubtitle`。
  - 不要求登录；前端接口失败时使用 `src/shared/siteSettings.js` 中的默认值。

- `POST /api/auth/register`
  - 注册账号。
  - 用户名至少 2 位，密码至少 4 位。

- `POST /api/auth/login`
  - 登录并返回 JWT 与公开用户信息。
  - 被封禁用户返回 403。

- `GET /api/me`
  - 登录用户信息。
  - 会返回公开用户字段；`rating` 以持久化 `User.rating` 为权威值，`totalGames`、`wins`、`losses`、`draws` 从棋谱派生。

- `POST /api/me/character`
  - 修改当前出战角色。
  - 会校验角色存在且未停用；逻辑同时考虑 DB 角色和 fallback 角色。

- `GET /api/shop`
  - 登录后获取启用商城商品。

- `POST /api/shop/:id/purchase`
  - 登录后购买商品。
  - 扣金币并更新拥有角色/装饰。

- `GET /api/leaderboard`
  - 登录后获取排行榜。
  - 基于所有用户和所有棋谱统计。

- `GET /api/replays`
  - 获取当前用户最近 30 条棋谱。

- `GET /api/replays/:id`
  - 获取当前用户参与的指定棋谱详情与快照。

### 后台 HTTP API

所有 `/api/admin/*` 路由都经过 `authHttp` 和 `requireAdmin`。

- `GET /api/admin/summary`
  - 后台概览数据和最近 8 条审计日志。

- `GET /api/admin/audit-logs`
  - 最近 100 条审计日志。

- `GET /api/admin/site-settings`
  - 读取后台可编辑的站点配置。

- `PATCH /api/admin/site-settings`
  - 更新大厅标题和大厅副标题。
  - `homeTitle` 会 trim 并限制到 24 字符；`homeSubtitle` 会 trim 并限制到 80 字符。
  - 写入 `AdminAuditLog`，action 为 `site-settings.update`。

- `GET /api/admin/users`
  - 最多 200 个用户。

- `GET /api/admin/users/:id`
  - 单个用户详情。

- `GET /api/admin/users/:id/replays`
  - 任意用户最多 100 条棋谱。

- `GET /api/admin/replays/:id`
  - 任意棋谱详情。

- `PATCH /api/admin/users/:id`
  - 编辑用户 role、rank、rating、coins、ownedCharacters、selectedCharacter。
  - 管理员保存后前端会同步当前登录用户信息，避免后台金币/角色等资产更新后棋舍和商城仍显示旧数据。

- `POST /api/admin/users/:id/ban`
  - 封禁用户。

- `POST /api/admin/users/:id/unban`
  - 解封用户。

- `POST /api/admin/users/:id/reset-password`
  - 重置用户密码。

- `GET /api/admin/characters`
  - 后台角色列表，包含停用角色与技能 `paramsJson`。

- `POST /api/admin/characters`
  - 新增角色与技能。

- `PATCH /api/admin/characters/:id`
  - 按 DB id 或 slug 更新角色与技能。

- `DELETE /api/admin/characters/:id`
  - 将角色 `enabled` 设为 false。

- `POST /api/admin/uploads/character-portrait`
  - 上传角色立绘。
  - 需要 multipart 字段 `portrait`。

- `GET /api/admin/decorations`
  - 装饰列表。

- `POST /api/admin/decorations`
  - 新增装饰。

- `PATCH /api/admin/decorations/:id`
  - 更新装饰。

- `DELETE /api/admin/decorations/:id`
  - 将装饰 `enabled` 设为 false。

- `GET /api/admin/shop-items`
  - 商城商品列表。

- `POST /api/admin/shop-items`
  - 新增商品。

- `PATCH /api/admin/shop-items/:id`
  - 更新商品。

- `DELETE /api/admin/shop-items/:id`
  - 将商品 `enabled` 设为 false。

### Socket.IO 事件

鉴权：

- `io.use`
  - 使用 JWT 鉴权。
  - 校验用户存在、未封禁，并解析出战角色。

服务端监听：

- `match:join`
  - 加入匹配队列；匹配成功后创建房间并广播。

- `match:leave`
  - 离开匹配队列。

- `room:join`
  - 根据 5 位房间号加入观战或重连玩家。

- `game:action`
  - 对局动作：`move`、`pass`、`resign`、`skill`。
  - 本地测试动作：`test-random-layout`、`test-restore-skill`。这两个动作当前走同一 Socket 入口，但命名集中为 `test-*`，便于后续移除。

- `counting:request`
  - 申请数子。

- `counting:respond`
  - 接受/拒绝数子。

- `draw:request`
  - 申请和棋。

- `draw:respond`
  - 接受/拒绝和棋。

- `scoring:action`
  - 数子阶段动作：标记死子、中立点、重置、确认、接受/拒绝结果。

- `chat:send`
  - 房间聊天。

- `disconnect`
  - 清理匹配队列 socket 和观战列表。

服务端发出：

- `match:waiting`
- `match:found`
- `room:update`
- `room:closed`
- `error:toast`
- `me`

## 7. 权限系统现状

- 登录态使用 JWT：
  - `withToken` 签发 `{ sub: user.id }`，有效期 14 天。
  - HTTP 请求通过 `Authorization: Bearer <token>`。
  - Socket.IO 通过 `handshake.auth.token`。

- 用户角色：
  - `player`
  - `admin`

- 用户状态：
  - `active`
  - `banned`

- 管理员来源：
  - `.env` 中 `ADMIN_USERNAMES` 逗号分隔。
  - 服务启动时 `promoteConfiguredAdmins` 会批量提升已存在用户。
  - 登录/注册时 `syncConfiguredAdmin` 会提升匹配用户名。

- 后台权限：
  - `/api/admin` 路由挂载前统一使用 `authHttp` 和 `requireAdmin`。
  - 前端只对 `user.role === "admin"` 显示后台入口，但真正权限以后端为准。

- 封禁效果：
  - HTTP 鉴权发现 `status === banned` 返回 403。
  - Socket 鉴权发现封禁抛出 `forbidden`。
  - 登录时封禁用户也返回 403。

- 当前未看到：
  - CSRF 防护。
  - 登录/注册限流。
  - JWT refresh / 主动失效机制。
  - 操作级细粒度权限。

## 8. 公共组件与通用逻辑

### 前端公共组件

当前公共组件仍以 `src/main.jsx` 为主，后台管理组件已拆到 `src/admin/AdminConsole.jsx`：

- `Panel`: 面板标题与图标容器。
- `Stat`: 小统计卡片。
- `AdminFieldLabel`: 带 title 提示的后台字段标签，位于 `src/admin/AdminConsole.jsx`。
- `AdminSectionHeader`: 后台列表页标题、数量和主操作按钮，位于 `src/admin/AdminConsole.jsx`。
- `AdminStatusPill`: 后台表格状态标签，位于 `src/admin/AdminConsole.jsx`。
- `Toast`: 自动消失提示。
- `ConfirmModal`: 通用确认弹窗。
- `WatchPad`: 观战房间号输入。
- `ReplayBar`: 回放进度控制。
- `PlayerInfo`: 对局双方信息。
- `Board`: 棋盘渲染与点击处理。
- `ChatBox`: 聊天面板。
- `SkillBanner`: 技能演出浮层。
- `ResultModal`: 对局结果弹窗；当前用户是房间玩家时展示本局积分与金币变化。
- `TestTools`: 对局测试按钮组，当前包含随机布局和恢复技能，集中封装以便未来下线。

### 前端通用函数

- `api`: HTTP JSON 请求封装，位于 `src/api/client.js`。
- `adminApi`: `/api/admin` 请求封装，位于 `src/api/client.js`。
- `uploadPortrait`: 上传角色立绘，位于 `src/api/client.js`。
- `findCharacter`: 从角色 map 或 fallback 中解析角色。
- `derivePlayerRecordStats` / `recordWinnerColor`: 位于 `src/shared/gameRecords.js`，前后端共用棋谱胜负与战绩推导逻辑，优先基于 `winnerColor` 结构化字段，旧记录回退到 `resultText` 文本前缀。
- `resultRewardDelta`: 位于 `src/shared/resultRewards.js`，集中维护结果奖励差值，供后端持久化与前端结果展示共用；积分胜 `+20`、负 `-20`、和 `0`，金币胜 `+50`、负 `+20`、和 `0`。
- `buildCharacterDraft` / `characterDraftToBody`: 位于 `src/shared/adminDrafts.js`，后台角色表单数据转换。
- `validateShopItemDraft` / `decorationDraftToBody`: 位于 `src/shared/adminDrafts.js`，后台商城/装饰表单校验。
- `DEFAULT_SITE_SETTINGS`: 位于 `src/shared/siteSettings.js`，前后端共用大厅标题/副标题默认值。
- `lastMarkedAction` / `canPreviewSkillTarget`: 位于 `src/shared/boardView.js`，用于统一棋盘最后落子/技能标记与技能预览判定。
- `replayRoomAt`: 用历史记录重放房间状态；观战实时回放另由 `replayGameAt` 只派生棋盘进程。
- 音频相关：`loadAudioSettings`、`playStoneSound`、`playSystemVoice` 路由、`preloadVoiceSound`、`playPreloadedVoiceSound`、`speakText`。

### 后端通用逻辑

- `publicUser`: 用户公开字段白名单。
- `makeAuth`: HTTP 鉴权与管理员中间件。
- `validateCharacterInput`: 角色/技能输入校验。
- `toCharacterPayload`: 角色公开 payload。
- `validateShopItemInput` / `validateDecorationInput`: 商城与装饰校验。
- `getPublicSiteSettings` / `updateSiteSettings`: 站点配置读取、清洗、持久化和审计写入。
- `buildLeaderboard`: 排行榜统计。
- `ratingDeltaForResult`: 根据 `winnerColor` 计算玩家积分变化；胜方 +20、负方 -20、和棋 0。
- `safeUploadFilename`: 上传文件名清洗。
- `writeAudit`: 后台审计日志写入。
- `DEFAULT_SKILL_SYSTEM_MESSAGE` / `SKILL_MESSAGE_TOKENS`: 前后端共用的技能系统消息默认模板与占位符列表。
- `gameResultMetadata` / `recordWinnerColor`: 后端通过 `server/gameRecords.js` re-export 共享棋谱结构化结果逻辑。

## 9. 状态管理方式

### 前端状态

- 使用 React 本地状态，没有 Redux/Zustand 等全局状态库。
- 顶层 `App` 管理：
  - `token`
  - `user`
  - `view`
  - `room`
  - `socket`
  - 各类弹窗开关
  - `characters`
  - `replayRecords`
  - `replayStep`
  - 音频配置
- 登录 token 存在 `localStorage` 的 `sigrika-token`。
- 音频设置存在 `localStorage` 的 `sigrika-audio-settings`。
- 房间状态由服务端 Socket 广播覆盖到前端 `room`。
- 回放状态通过 `replayStep` 和 `replayRoomAt` 从快照历史中派生。

### 后端状态

- 数据库持久化：
  - 用户、角色、技能、装饰、商城、棋谱、审计日志、站点设置。

- 内存状态：
  - `server/rooms.js` 的 `rooms = new Map()`。
  - `waitingPlayer` 匹配队列。
  - 房间计时器、读秒、观战者、聊天、当前棋局状态。

- 对局结束持久化：
  - `scheduleRoomClose` 调用 `saveGameRecord`。
  - 房间 5 分钟后关闭并从内存删除。

## 10. 已知技术债

以下只列代码中能观察到的事项：

- 部分源码、schema、README 中的中文在当前终端显示为乱码。运行时页面部分中文可能正常，但文件编码状态需要统一确认。

- Prisma migrations 目录已开始建立，`SiteSetting` 已有结构迁移；后续跨机器协作时需要坚持使用 migration 管理结构变更，避免继续依赖临时 `db push`。

- `prisma db push` 已可同步当前开发库 schema，但 Windows 上 Prisma Client generate 可能因运行中的 Node 后端占用 `query_engine-windows.dll.node` 而出现 EPERM rename；遇到时需要先停止后端进程再重新运行 `npm run prisma:generate` 或 `npm run prisma:push`。

- 实时房间在内存中：
  - 服务重启会丢失未结束房间。
  - 不支持多进程/多实例横向扩展。
  - 技能演出依赖 `setTimeout` 延迟落子/变更效果；进程重启或未来多实例部署时需要额外的状态恢复/调度设计。

- 胜负判断已开始使用 `winnerColor` 结构化字段，但仍需要保留旧 `resultText` 回退逻辑以兼容历史棋谱。后续应考虑补迁移历史数据。

- `GameRecord` 与 `User`、`Character` 没有数据库外键关系，依赖字符串逻辑关联。

- 用户拥有角色/装饰使用 CSV 字符串字段：
  - 查询和约束能力弱。
  - 容易产生重复或无效 slug。

- 商城后台新增/修改时会校验 `targetId` 对应角色或装饰存在；数据库层仍没有外键约束，购买时仍依赖字符串拥有列表。

- 当前用户资产与战绩存在多处来源：
  - `User.rating` 会被对局结果和后台编辑直接更新，`/api/me` 已改为直接返回该持久化积分。
  - 棋舍/排行榜的总局、胜负、和棋等统计仍从 `GameRecord` 派生。
  - 后续如继续扩展赛季/积分流水，需要决定是否增加结构化积分变更记录。

- 前端 `src/main.jsx` 已先拆出后台管理模块和 API helper，但仍然偏大，仍包含大厅、对局、棋舍、商城、排行榜、设置、回放、音频等组件；后台管理目前集中在 `src/admin/AdminConsole.jsx`，后续可继续按用户/角色/商城/装饰拆分。

- 全局样式集中在 `src/styles.css`，规模较大，组件样式边界不清。

- 技能扩展当前由 `effectType` 分支实现，`paramsJson` 已保留但核心规则尚未通用化；`random-blast` 的完整 3x3、演出延迟、回放重放、棋盘高亮清理等逻辑分散在共享规则、服务端房间和前端棋盘中。

- 观战回放目前在前端由实时房间快照和历史重放派生，信息区保持实时、棋盘可回退；该“双状态”模型需要更多自动化测试覆盖，避免未来房间字段变更时出现棋盘/信息区不同步。

- 测试用对局按钮已集中在 `TestTools` 和 `test-*` action，并已增加环境保护：
  - 前端仅在 Vite 开发环境显示按钮。
  - 服务端在 `NODE_ENV=production` 时拒绝 `test-*` action。

- 后台审计已覆盖用户、角色、装饰、商城商品和站点设置的主要增改/禁用操作；后续可继续细化到登录、购买、上传等事件。

- `CharacterSkill.enabled` 字段存在，但当前公开角色序列化没有明确按该字段过滤技能，语义待确认。

- 认证安全能力较基础：
  - 无限流。
  - JWT 无服务端失效表。
  - 生产环境已拒绝默认 `JWT_SECRET`，部署时仍需在环境变量中提供强随机密钥。

- 上传文件只按 MIME 类型和扩展生成文件名，未看到图片内容解码校验，待确认是否足够。

- 当前测试覆盖较多规则和后台 helper，但前端交互没有专门的自动化测试。

- `docs/system-design.html` 是旧的生成产物，当前更新只维护 Markdown 源文件；若该 HTML 仍作为交付文档使用，需要建立可重复生成流程或从版本管理中移除生成物。

## 11. 后续扩展建议

- 建立 Prisma migration 流程：
  - 引入 `prisma migrate dev` / `migrate deploy`。
  - 将现有 SQLite schema 固化为首个迁移。

- 将核心统计结构化：
  - 在 `GameRecord` 增加 `winnerColor`、`resultReason`、双方最终积分变化等字段。
  - 排行榜、棋舍战绩、用户统计改用结构化字段。

- 拆分前端模块：
  - 已完成：`src/admin/AdminConsole.jsx`
  - 已完成：`src/api/client.js`
  - 后续：`pages/HomeScreen.jsx`
  - 后续：`pages/RoomScreen.jsx`
  - 后续：继续拆分 `admin/*`
  - 后续：`modals/*`
  - `audio/*`
  - `replay/*`

- 拆分样式：
  - 按页面/组件拆 CSS，或引入明确的 CSS module/组件样式约定。

- 重构拥有关系：
  - 将 `ownedCharacters`、`ownedDecorations` 从 CSV 改为关系表。
  - 为商城购买添加唯一约束，避免重复购买。

- 强化权限和安全：
  - 登录/注册限流。
  - 更严格的上传校验。
  - 管理员操作二次确认/审计扩展。
  - JWT secret 检查，生产环境禁止默认值。

- 实时服务可扩展化：
  - 若需要多实例，需引入共享房间状态或 Socket.IO adapter。
  - 对局状态可考虑周期性持久化，避免服务重启丢局。

- 技能系统演进：
  - 将技能效果从硬编码分支迁移到 registry。
  - 明确定义 `paramsJson` schema。
  - 将系统消息占位符列表集中维护并在后台显示。
  - 将技能目标规则、预览规则、演出时序、回放重放参数纳入同一个技能契约，减少前后端重复判断。

- 测试工具治理：
  - 已完成基础开发/生产保护。
  - 后续可进一步将测试工具移动到单独调试面板，或通过管理员/开发者权限显式开启。

- 排行榜扩展：
  - 支持分页和赛季。
  - 支持按胜率、总局数、近期积分等维度排序。
  - 后端返回常用角色次数，前端可展示“使用 N 次”。

- 角色/装饰资源管理：
  - 为上传文件建立记录表，便于清理无引用文件。
  - 装饰在玩家端的实际展示/装备逻辑需要补齐或明确。

- 测试扩展：
  - 增加 API 路由集成测试。
  - 增加前端关键流程测试：登录、匹配、后台角色保存、排行榜弹窗。
  - 增加回放快照兼容性测试。

## Audio System Notes

当前音频系统主要由 `src/shared/musicLibrary.js`、`src/shared/audioScheduling.js`、`src/shared/boardAudio.js`、`src/shared/voiceEffects.js` 与 `src/audio/playback.jsx` 中的播放运行时组成。

### Background Music

- BGM 资源配置集中在 `MUSIC_TRACKS`，按 `home`、`battle`、`skill` 三类管理。
- 主界面默认 BGM 使用 `hidamari_intro_once.ogg` + `hidamari_loop.ogg`。
- 对弈常规 BGM 使用 `shanjifu_intro_once.ogg` + `shanjifu_loop.ogg`。
- 角色技能 BGM 当前配置：达妮娅使用 `bgm_*`，西格莉卡使用 `koimoon_132_micro_*`，爱弥斯使用 `lhl_*`，猪小仙使用 `matoya_*`，娜波摩使用 `busizhe_*`。
- BGM 优先级为：角色技能 BGM > 对弈常规 BGM > 主界面 BGM。
- 角色释放技能后，后续 BGM 保持为该角色专属 BGM，直到对局结束；后触发的角色技能 BGM 会覆盖先触发的角色技能 BGM。
- 匹配成功倒计时、对局结果弹窗、对局结束阶段会停止 BGM。
- `BackgroundMusic` 使用 Web Audio 播放，预解码 intro/loop buffer，并在同一 `AudioContext` 时间线上调度 intro 到 loop，避免 HTMLAudio 切文件造成明显卡顿。
- 音量变化只调节 gain，不改变播放 identity；因此主音量或 BGM 音量调到 0 后再恢复，不会导致 BGM 从头播放。
- 默认音频设置为 `master: 80`、`bgm: 50`、`sfx: 80`、`voice: 80`，保存于 `localStorage` 的 `sigrika-audio-settings`。

### Effects And Replay Audio

- 匹配成功播放 `match-success.mp3`，同时停止 BGM。
- 对局结果弹窗出现时停止 BGM；胜方播放 `result-victory.mp3`，负方播放 `result-defeat.mp3`，和棋不播放结果音效。
- 普通落子播放 `godown_clear.ogg`。
- 提子动作播放 `go_capture_clear.ogg`。
- `boardAudio.js` 根据历史记录中的当前棋盘动作判断落子音或提子音；回放界面点击“下一手”时也会按该步历史播放对应音效，弃手不会重复播放上一手棋盘音效。
- 落子、提子、匹配成功和结果音效均走 `sfx` 音量通道。
- 读秒 10 到 1 秒倒计时通过 `playSystemVoice(countdown-N)` 播放角色语音或 TTS，超时时语音播报“超时”，不会播报“还剩0次读秒”。

### Skill Voice

- 角色技能语音配置集中在 `CHARACTER_SKILL_VOICES`。
- 当前已配置：西格莉卡 `sigrika_skill.ogg`，爱弥斯 `aemeath_skill.ogg`，猪小仙 `baconbits_skill.ogg`。
- `characterVoiceMapForSkill` 可将现有技能语音桥接为角色 `systemVoices` 的 `skill-cast` 事件映射。
- `SkillBanner` 出现时同步触发技能语音，同一个 banner id 只播放一次。
- 技能语音走 `voice` 音量通道。
- `playVoiceSound` 使用 Web Audio 播放链：source -> dry/wet reverb mix -> voice gain -> destination。
- `voiceEffects.js` 当前预设为轻量空灵混响：`boost: 1.35`、`wet: 0.28`、`dry: 0.9`、`reverbSeconds: 1.6`、`reverbDecay: 2.2`、`preDelaySeconds: 0.035`。
- 如果 Web Audio 或资源加载失败，技能语音会回退到普通 `Audio` 播放，仍应用 1.35 倍 voice 增益上限。

### System Voice

- 系统语音事件集中在 `src/shared/systemVoices.js`，通过 `resolveSystemVoice` 解析。
- 当前默认走 TTS 文本；如果角色配置了 `systemVoices[event]`，则优先播放对应音频。
- 已预留事件：`game-start`、`skill-cast`、`byo-yomi-start`、`byo-yomi-periods`、`byo-yomi-period-2`、`byo-yomi-period-1`、`byo-yomi-countdown`、`countdown-N`、`timeout`、`result-victory`、`result-defeat`、`result-draw`、`house-detail`。
- 对局正式开始时，服务端写入 kind 为 `game-start` 的系统消息，前端据此播放“对局开始”语音。
- 进入读秒、剩余读秒次数和超时播报已经接入事件化 resolver；剩余 2/1 次读秒使用显式 `byo-yomi-period-2`、`byo-yomi-period-1` 事件，10 到 1 秒倒计时使用 `countdown-10` 到 `countdown-1` 角色语音事件。

### Static Audio Assets

- BGM 和效果音位于 `public/assets/music/`。
- 技能语音位于 `public/assets/voice/`。
- 转码用临时工具目录 `.tmp/` 已加入 `.gitignore`，不应提交。

### Audio Technical Debt

- Runtime audio playback now lives in `src/audio/playback.jsx`, but that module still owns several playback concerns (`BackgroundMusic`, board effects, result sounds, skill voice effects, system voice/TTS). Future cleanup can split it by BGM/effects/voice if the feature set grows.
- Voice playback uses a shared module-level Web Audio context when available; regular voice playback, cached playback, and preload decoding all reuse that context. Future tuning may still need more explicit lifecycle cleanup and browser autoplay handling.
- Voice reverb now uses a deterministic generated impulse. If authored reverb tails become important, replace it with a static impulse asset.
- BGM assets are committed directly under `public/assets/music/` and increase repository size. If the soundtrack grows, consider Git LFS, an asset CDN, or a manifest-driven asset pipeline.
- Music ownership, purchase availability, and player selection are represented in configuration shape but not yet backed by persisted music inventory/settings UI.
- Character skill voice configuration is static in `CHARACTER_SKILL_VOICES`; future admin-configurable voices would need schema/API/upload support and cache invalidation rules.
- No browser-level automated test currently verifies actual audio playback, Web Audio graph routing, or autoplay fallback behavior; existing coverage focuses on deterministic helper logic.
- Countdown character voice assets are opportunistically preloaded and decoded into a module-level Web Audio buffer cache while the active player is in byo-yomi. Cached playback reuses the same dry/wet reverb voice chain as regular voice playback, and failures fall back to the existing voice path without blocking timers.

## Result Rewards And Room UI

This implementation follows `docs/superpowers/specs/2026-05-19-result-home-voice-room-design.md` and `docs/superpowers/plans/2026-05-19-result-home-voice-room.md`.

- Result rewards:
  - The result modal displays the current player's rating and coin deltas.
  - Rating deltas are win `+20`, loss `-20`, draw `0`.
  - Coin deltas are win `+50`, loss `+20`, draw `0`.
  - Decisive game persistence uses `resultRewardDelta`; winner records gain coins and rating, loser records gain consolation coins and lose rating. Draws remain record-only for rewards.
- Home layout:
  - The home screen prioritizes "空想对局" as the largest primary action.
  - "棋舍" is a secondary profile/character entry with the selected portrait and player info.
  - "商城", "观战", "排行榜", and admin management are compact circular utility icon buttons anchored to the lower-right area; each button shows only icon plus title.
  - Narrow utility overflow is contained inside the utility grid instead of expanding the whole page.
- Character voice categories:
  - Character voice events are explicit: `game-start`, `skill-cast`, `byo-yomi-start`, `byo-yomi-period-2`, `byo-yomi-period-1`, `countdown-10` through `countdown-1`, `timeout`, `result-victory`, `result-defeat`, `result-draw`, and `house-detail`.
  - Built-in skill voice assets are bridged into each character's `systemVoices.skill-cast` map at runtime, so skill banners use the same `resolveSystemVoice` route as other role voices.
  - Character detail clicks in the house route through `house-detail`; missing assets stay silent until a character-specific detail voice is configured.
  - Countdown voice uses 10 second-specific events, with invalid countdown event names rejected before character audio override.
  - Missing character voice assets fall back to generic voice/TTS according to `resolveSystemVoice`.
- Room time display:
  - Player timers render a digital/nixie-style label, primary time/seconds, and smaller leading-zero byo-yomi period counter.
  - The timer panel uses a light background with subtle state accents instead of a dark display block.
  - The compact `30s × 3` style is no longer used in the player info timer.
- Room action area:
  - Normal play shows regular action buttons below the board.
  - Draw requests, counting requests, dead-stone marking, and result review render in the main board action area through phase-aware `DecisionBar` controls.
  - Decision controls are participant-safe: missing/non-player local state sees an informational waiting state instead of active buttons.
  - Request and result-review decision bars include countdown/progress visuals.
  - The board status slot renders text-only operation hints.
- Finished-game portrait badges:
  - Decisive finished games show a red circular "胜" badge on the winner portrait and a black circular "负" badge on the loser portrait.
  - Draw results show no win/loss portrait badge.
- Responsive direction:
  - The room player/board/side layout keeps its three-column structure across desktop and tablet widths.
  - Narrow room screens use practical column minimums and controlled horizontal scrolling instead of switching to a stacked layout.
  - Tablet/mobile overrides do not reshape room player cards, preserving the vertical portrait, digital timer, and action hierarchy inside the fixed three-column room layout.
