## UI Asset Notes

- `public/assets/go-board-13-ui-1.png` through `public/assets/go-board-13-ui-4.png` are transparent PNG candidates for the home screen fantasy match button. They are generated as exact 13-line Go boards with five star points and no stones, with restrained hand-drawn tech doodle decoration around the board.
- `public/assets/go-board-13-clean-3d-1.png` through `public/assets/go-board-13-clean-3d-4.png` are cleaner transparent 13-line Go board candidates with straight grid lines, no gray construction strokes, five star points, no stones, and a simple 3D board thickness for the same home screen button.
- `public/assets/effects/denia-bubble-pop.gif` is a 256x256 transparent GIF preview for the planned Denia target-point skill effect. It runs for 2 seconds: 0.0-0.5s glass bubble generation, 0.5-1.2s black ink/energy fill, 1.2-1.5s crack and pressure buildup, and 1.5-2.0s burst into black shards, smoke particles, glass flecks, and a light shock ring.

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
    roomView.js                # 房间视图序列化，按玩家/观战者生成可见棋盘和计数信息
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
    main.jsx                   # React 单页应用入口、Socket 状态与页面级弹窗编排
    api/
      client.js                # 前端 HTTP JSON、后台 API、上传请求封装
    auth/
      AuthScreen.jsx           # 登录/注册界面
    admin/
      AdminConsole.jsx         # 后台管理界面与后台 CRUD 组件
    home/
      HomeScreen.jsx           # 大厅首页布局、匹配入口、棋舍入口和工具入口
    room/
      RoomScreen.jsx           # 对局页容器，编排棋盘、玩家信息、聊天、房间成员、行动区和房间级音效
    styles.css                 # CSS 入口文件，按域导入 styles/*.css
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
- `npm run dev` 同时启动 Vite 与后端服务；后端开发脚本使用 `node --watch-path=server --watch-path=src/shared server/index.js`，只监听源码目录，避免 SQLite `dev.db` 写入触发后端重启并造成对局中 socket 断开或 API `ECONNRESET`。
- 当前工作目录是 Git 仓库工作树，当前分支可通过 `git status` 检查。

## 2. 当前核心模块

### 前端

- `src/main.jsx`
  - React SPA 的集中入口。
  - 负责登录态、Socket.IO 生命周期、顶层页面切换、匹配/对局结果/商店/好友等页面级弹窗编排，并挂载后台管理入口。
  - 对局页已经下沉到 `src/room/RoomScreen.jsx`，`src/main.jsx` 不再直接持有房间 UI 子树。
  - 通过 `src/api/client.js` 调用 HTTP API，通过 `socket.io-client` 连接实时对局。

- `src/auth/AuthScreen.jsx`
  - 登录/注册展示组件。
  - 注册模式显示“确认密码”输入框；前端会先校验两次密码一致，再提交注册请求。
  - 调用 `src/api/client.js` 完成认证请求，并通过 `onAuth` 回写 token 与用户信息。

- `src/home/HomeScreen.jsx`
  - 大厅首页展示组件。
  - 负责大厅标题/副标题、匹配主入口、棋舍入口、观战/排行榜/商城/后台管理工具入口。

- `src/room/RoomScreen.jsx`
  - 对局页容器组件。
  - 编排玩家信息、棋盘、行动区、房间成员、操作提示、聊天、开局提示、技能横幅和房间级音效。
  - 导出 `roomGameInfoForPlayers` 等房间标题辅助逻辑，便于在不挂载完整对局页的情况下单测关键展示格式。

- `src/admin/AdminConsole.jsx`
  - 后台管理界面模块。
  - 包含概览、用户、角色、商城、装饰、系统设置、审计日志等后台组件。
  - 该模块已从 `src/main.jsx` 拆出，且顶部侧栏/标题外壳已下沉到 `src/admin/AdminShell.jsx`；内部 tab 内容仍可继续按业务域拆分。

- `src/admin/AdminShell.jsx`
  - 后台管理外壳组件。
  - 统一维护后台 tab 列表、tab 文案、侧栏切换、返回大厅按钮、当前管理员名和页面标题，供后续继续拆分后台 tab 时复用。

- `src/api/client.js`
  - 前端 HTTP 请求封装。
  - 提供普通 JSON API、后台 API 和角色立绘上传 helper。
  - 普通 JSON 请求和角色立绘上传在 access token 过期并收到 401 时，会通过统一 refresh handler 轮换 token 并重试一次；refresh 请求本身不会递归重试。

- `src/app/resumeSession.js`
  - 前端断线恢复/结果恢复的纯逻辑模块。
  - 集中维护最近玩家房间号的 localStorage key、恢复请求 payload，以及已结束房间恢复为结果弹窗时需要触发的状态变更。

- `src/app/roomUserSync.js`
  - 前端房间视图中的当前用户状态同步模块。
  - 当 `match:found`、`room:update` 或结果恢复携带房间玩家 payload 时，会把当前登录用户对应的 `player.user` 合并回全局 `user`，确保糖果效果、金币、出战角色等状态在结算广播后立即刷新。
  - 合并结果与当前用户内容一致时会保留原对象引用；主 Socket 连接只依赖 token 与用户 id，不会因为糖果效果、金币等资料刷新而重建连接，避免玩家房间 `socketId` 与前端当前连接脱节。
  - `room:resume` 返回的已结束结果快照只用于断线玩家补看结果弹窗，不会把快照中的旧金币、积分、段位或战绩合并回当前登录用户状态。

- `src/app/socketHandlers.js`
  - 前端 Socket.IO 事件处理器模块。
  - 集中安装并处理 `match:*`、`room:*`、`duel:*`、`error:toast` 和 `account:logged-out` 事件，把房间恢复、匹配过渡、轻量棋钟、约战提示和账号踢下线的状态变更从 `src/main.jsx` 中移出，便于单元测试和后续 hook 化。

- `src/app/gameSocket.js`
  - Centralizes Socket.IO client creation for the game connection and binds the installed socket handlers with the room resume request builder. `src/main.jsx` still owns the React lifecycle boundary, but no longer wires the low-level `io(...)` call directly.
- `src/app/AssetPreloadScreen.jsx`
  - Owns the login/startup asset preloading screen UI and progress-bar percentage formatting, keeping this transient screen out of `src/main.jsx` while preserving the same loading flow.
- `src/app/characterCatalog.js`
  - Loads the public character catalog through `/api/characters`, merges it with built-in fallback characters, and falls back to the local catalog on request failure. This keeps startup preloading and admin-triggered character refresh on the same path.
- `src/app/roomNavigation.js`
  - Centralizes the pure navigation decision for leaving the room screen: replay exits clear the replay snapshot without emitting `room:leave`, while spectator and finished-room review exits emit `room:leave` before returning home.
- `src/app/replayOpening.js`
  - Converts a replay record snapshot into the room-screen state used by normal house replays and admin replays: room snapshot, latest replay step, cleared pending skill, and `room` view.
- `src/app/siteSettingsCatalog.js`
  - Loads public site settings from `/api/site-settings`, merges them over shared defaults, and falls back to `DEFAULT_SITE_SETTINGS` when the request fails.
  - Shares the in-flight startup settings request. Login and refresh preloading wait for this loader before switching to `home`, so the first home render uses the configured title/subtitle instead of briefly showing the default `大厅` copy.
- `src/shared/game.js`
  - 共享的游戏规则引擎。
  - 负责棋盘状态、落子、提子、禁自杀、劫、弃手、认输、技能、隐藏手、死子标记、数子、回放重算等。
  - 该模块被前端回放逻辑与服务端房间逻辑共同使用。

- `src/shared/gameBoard.js`
  - 共享棋盘几何与点位访问模块。
  - 集中维护标准棋盘尺寸、点 id 解析/生成、棋盘点创建、快速点查找和有效邻居过滤。

- `src/shared/gameConstants.js`
  - 共享棋色常量与对手颜色推导。
  - `src/shared/game.js` 保持同名转导以兼容既有调用方。

- `src/shared/gameResults.js`
  - 共享对局结果与无效局判定模块。
  - 集中维护早期无效局阈值、认输/超时/和棋结果结构，以及给早期结果追加 invalid 标记的逻辑。

- `src/shared/gameSkills.js`
  - 共享技能配置归一化模块。
  - 将角色 id、内置角色技能和后台技能配置转换为规则引擎可执行的 skill config，并维护技能目标启动条件。

- `src/shared/stoneFormatting.js`
  - 共享子数格式化模块。
  - 用于数子结果、胜负差距和房间计分展示中的整数/分数子显示。

- `src/shared/systemVoices.js`
  - 定义系统语音事件 key 和默认 TTS 文本。
  - 当前预留 `game-start`、进入读秒、剩余读秒次数、读秒倒计时、超时、胜/负/和结果等事件，未来可由角色专属语音资源覆盖。

- `src/shared/characters.js` 与 `src/shared/characterFallback.js`
  - 定义内置角色 fallback。
  - 将后端 DB 角色与内置角色合并。

- `src/styles.css`
  - CSS 入口文件，当前按 `styles/base.css`、`admin.css`、`lobby.css`、`room.css`、`modals.css`、`commerce-settings.css`、`responsive.css` 分域导入。

### 后端

- `server/index.js`
  - Express HTTP API 与 Socket.IO 入口。
  - 初始化内置角色 seed、提升配置管理员。
  - 注册公开 API、登录/注册 API、用户 API、棋谱 API、排行榜 API，并挂载 `/api/admin`。
  - JSON body 解析错误会通过统一错误处理中间件返回 JSON，避免前端 API helper 因 Express 默认 HTML 错误页显示“接口返回格式不是 JSON”。

- `server/duelRequests.js`
  - 好友/社交对局申请状态机。
  - 管理待确认约战请求、20 秒过期定时器、同意/拒绝/断线过期事件，以及接受后创建直连房间；`server/index.js` 只负责把 Socket.IO 事件转发给该模块。

- `server/onlineSessions.js`
  - 在线 socket 与登录会话生命周期模块。
  - 管理用户到 socket id 的索引、登录后等待 socket 连接的短期清理 timer、强制登录踢下线、断开最后一个 socket 后清理 session，以及社交在线状态/首个在线 socket 查询。

- `server/httpErrors.js`
  - HTTP 错误响应中间件模块。
  - 当前负责把 JSON body 解析错误转换为 JSON 响应，避免 Express 默认 HTML 错误页穿透到前端 API helper。

- `server/rooms.js`
  - 内存态房间系统。
  - 管理匹配队列、房间成员、观战、Socket 广播、聊天、计时、读秒、和棋/数子流程、技能演出、结束后保存棋谱与触发结果结算。

- `server/roomView.js`
  - 房间视图序列化模块。
  - 根据 viewerId 判断玩家或观战者身份，生成对应颜色视角的棋盘、双视角观战数据、玩家提子/除子计数、计时、聊天和阶段 deadline。
  - 该模块把 `server/rooms.js` 中纯数据投影逻辑移出实时流程，降低房间广播和棋谱快照代码的耦合。

- `server/serverLifecycle.js`
  - HTTP server startup and shutdown guardrails.
  - Reports `EADDRINUSE` with a clear port-conflict message instead of leaving the Vite proxy to surface ambiguous `ECONNREFUSED` / non-JSON errors.
  - Handles `SIGINT` / `SIGTERM` by closing the HTTP server and disconnecting Prisma, reducing stale dev processes that keep port 3001 occupied during watch restarts.

- `server/roomItemEffects.js`
  - 房间结算时的道具效果处理模块。
  - 当前负责有效局结束后计算并应用彩虹豆豆跳跳糖清除效果；无效局不会清除糖果效果。

- `server/userAssets.js`
  - 集中封装用户资产 CSV/数组字段的解析、去空、去重、序列化，以及 owned character 的历史别名规范化。
  - 当前用于公开用户序列化、商城购买角色/装饰和后台用户资产编辑，作为后续迁移到结构化资产表之前的防扩散层。

- `server/roomRewards.js`
  - 房间结算时的内存用户奖励应用模块。
  - 将胜负积分、金币、战绩增量写回房间内存玩家，保证最终 `room:update` 能带上最新用户状态。

- `server/roomStatePersistence.js`
  - 房间内存状态与持久化快照之间的转换模块。
  - 负责清理 socket/timer 等运行时字段、生成 PersistedRoom snapshot、恢复房间运行时字段，以及按节流规则触发持久化写入。
  - 持久化房间快照写入 `snapshotVersion`，当前版本为 1；缺少版本的旧快照按 v1 读取，未来高于当前版本的快照会被拒绝恢复，避免不兼容状态进入实时房间。

- `server/roomClockTiming.js`
  - 房间棋钟纯计算模块。
  - 负责主时间扣减、读秒周期扣减，以及有效行动后的读秒重置，避免计时规则继续堆在实时房间流程里。

- `server/adminRoutes.js`
  - 后台管理路由。
  - 管理用户、封禁/解封、重置密码、角色、技能、装饰、商城商品、站点设置、上传、审计日志、任意用户棋谱查看。

- `server/siteSettings.js`
  - 站点公开配置读取和后台更新逻辑。
  - 当前管理大厅标题 `homeTitle`、大厅副标题 `homeSubtitle` 与设置关于页长文本 `aboutText`，并写入后台审计日志。

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
- 注册界面要求两次密码输入一致；确认密码只用于前端校验，不随 API payload 保存。
- 密码使用 `bcryptjs` 哈希存储。
- 登录态使用短期页面内存 access token + 持久化 refresh cookie：access token 仍只保存在 React 内存中，不写入 `localStorage`；浏览器保存 `HttpOnly` refresh cookie，页面刷新、浏览器重开或后端短暂重启后会先调用 `/api/auth/refresh` 自动恢复登录。
- `LoginSession` 数据库存储当前有效会话、refresh token 哈希、过期时间和撤销时间；Socket 断开只影响在线状态，不再直接撤销登录会话。
- 同一账号只允许一个实时在线连接；再次登录当前仍有在线 Socket 的账号时，登录接口返回 `already_logged_in` 冲突，前端确认后以 `forceLogin` 重试并踢下旧 socket、撤销旧 refresh session。数据库中仍有效但没有在线 Socket 的旧 refresh session 不会触发该提示，会被新登录替换，避免开发服务器重启或浏览器异常关闭后误报“该账号已登录”。
- 用户状态支持 `active` / `banned`。
- 管理员可配置、可在启动或登录时自动提升。
- 用户公开字段序列化会隐藏 `passwordHash`。

### 大厅与个人空间

- 登录页品牌标题显示为 `星炬学院围棋部`。
- 大厅入口：棋舍、空想对局、观战、排行榜、商城、后台管理（管理员可见）。
- 大厅首页布局 A：空想对局作为最大主行动面板；该区域使用 `/assets/home/fantasy-match-illustration.png` 透明 PNG 插图作为主体，插图顶部与左侧部员手册区域顶部对齐，不显示原先标题、说明文字、边框或卡片背景，只在插图下方保留较小的“开始匹配”按钮。棋舍作为带出战角色与用户段位/积分的次级入口；商店、排行榜、观战、好友以中等图标按钮呈现。顶部条显示站点标题、副标题“连罗伊人的都爱玩的智力游戏”、在线人数和右侧操作按钮；后台管理仅管理员可见，放在右上设置按钮下方，使用与大厅工具按钮一致的圆形尺寸并显示“后台管理”文字。
- 大厅主内容区尽量靠近窗口垂直中部；棋舍和工具按钮位于左侧，空想对局主面板位于右侧。空想对局上方显示横向用户铭牌：出战角色头像、用户名、段位和积分，铭牌背景使用出战角色代表色；在线人数作为独立浅色标签放在铭牌右侧，不放入铭牌内部。
- `public/hotspot-prototype.html` 是单页热点原型，用用户提供的 `/assets/prototypes/classroom-bg1.png` 作为 1672:941 舞台背景，并用百分比定位的蓝色热点按钮模拟排行榜、留言、游戏、登出、部员手册和匹配入口；当前仅用于验证手绘大厅背景上的可点击区域，点击后显示 toast，不接入正式大厅状态。
- 大厅顶部标题和副标题来自 `GET /api/site-settings`；未配置或接口失败时回退到 `大厅` / `SigrikaGo`。标题组居中显示，副标题和主标题轻微错位，右侧功能区固定在右上角。
- 大厅与对局页右上操作区共用同一个留言板入口。留言板当前为前端占位弹窗，输入框默认提示“Bug、问题反馈和意见都可以在这里提交哦”，包含提交按钮，提交暂不落库。
- 棋舍展示用户战绩、积分、拥有角色、出战角色。
- 棋舍标题右侧可查看个人对局回放；回放列表使用表格布局展示完整年份时间、黑方用户名与角色立绘、白方用户名与角色立绘、结果和手数，点击某行进入该局回放。装饰区标题显示为“装饰”，标题右侧可恢复初始装饰。战绩、积分、段位、金币统计项带对应小图标。
- 设置弹窗支持音量配置，并保存在 `localStorage`；关于页展示后台可编辑的站点长文本。

### 对局

- Socket.IO 两人匹配。
- 5 位房间号观战。
- 13 路棋盘。
- 中国数子规则，`KOMI_STONES = 2.75`。
- 基础规则：落子、提子、禁自杀、劫、弃手、认输。
- 对局聊天和系统消息；若聊天发送者是本局对局者，聊天名后追加 `[出战角色名字]`。
- 匹配成功后先显示 3 秒匹配成功弹窗；进入房间后处于 `opening` 开局展示阶段，玩家看到“本局你执黑/白”弹窗，服务端在该阶段暂停棋钟和落子/技能操作。
- 匹配成功弹窗倒计时期间仍会接收服务端 `room:update`。前端会同步刷新匹配过渡状态和一个最新房间 ref，倒计时完成时优先使用该 ref 进入房间，避免服务端已推进到 `playing` 但客户端仍拿旧 `opening` 快照，导致棋钟不动、不能落子或开局语音不触发。
- 收到匹配成功事件时，前端会自动关闭大厅上已打开的商店、棋舍、排行榜、观战、好友、设置和留言板弹窗，避免弹窗盖住后续对局切换。
- 开局展示结束后服务端切换到 `playing`，写入 `game-start` 系统消息，前端播放“对局开始”系统语音，并从该时刻开始推进棋钟。
- 计时与读秒：房间玩家包含 `mainTime`、`byoYomi`、`byoYomiPeriods` 等内存字段。
- 对局者刷新页面、关闭页面或短暂断线后，前端会保存最近玩家房间号并在 Socket 重连时请求 `room:resume`。如果内存房间仍存在且未结束，服务端会把该 socket 重新绑定到房间并广播当前房间视图；断线期间服务端棋钟继续按真实时间推进，不会暂停。如果房间已结束但仍在内存或可通过该房间号找到 `GameRecord.snapshot`，前端停留在大厅并恢复结果弹窗；关闭结果弹窗后清理最近房间号。正常在线收到终局 `room:update` 的对局者会立即清理最近玩家房间号，因此主界面结果弹窗只用于“对局中断线且终局时未能及时连回”的玩家恢复结果。如果服务重启导致内存房间丢失且没有可恢复棋谱，前端会清理最近房间号、回到大厅，并提示“房间已不存在，可能是服务器重启或房间已关闭”。
- 玩家信息区的段位和积分分列为棋子上下两枚标签；积分显示追加“分”，技能超频使用红色强调。除子与超频标签支持悬停说明：除子说明其会在数目时按 `+除子*1` 计入，超频说明其会在数目时按 `-超频*2` 扣减。
- 技能栏支持悬停/点击展开“挂画”式技能说明面板，说明随鼠标移出或再次点击收起。
- 对手信息区下方显示“房间成员”，固定最多 3 行高度并可滚动；回放模式不显示房间成员区域。对局者用黑/白棋图标标识执色且用户名为红色，观战者为黑色用户名。点击任一行会展开占位操作面板：详细信息、加好友/解除好友、加入黑名单/从黑名单解除、密谈。自己所在行的加好友和黑名单操作禁用；好友关系下加入黑名单按钮禁用。成员行按关系显示背景：自己为淡黄色，好友为浅绿色渐变，黑名单成员为灰色。加好友会自动从黑名单移除目标用户。
- 操作提示区在轮到当前用户处理落子、数子/和棋申请、死子确认或结果确认时切换为浅红色背景；普通等待状态保持常规提示背景。观战和回放模式不显示操作提示区。
- 超时判负。
- 双方连续弃手进入数子申请/确认流程。
- 数子流程：申请、接受/拒绝、标记死子、标记单官/中立点、确认死子、结果确认、拒绝后继续。
- 和棋申请，10 秒超时拒绝。
- 数子申请、和棋申请与数子结果确认的超时任务统一通过房间 `timeoutIds` 注册，房间关闭、断线清理和测试清理时会一起取消，避免旧 deadline 定时器在房间生命周期外继续运行。
- 结束后保存棋谱，并通过 `resultRewardDelta` 更新战绩、积分与金币：胜者积分 +20 / 金币 +50，败者积分 -20 / 金币 +20，和棋不更新用户奖励。
- 对局不超过 10 手结束均属于无效局：不会写入 `GameRecord`，不会出现在对局回放中，也不会增减积分、金币或战绩；服务端向双方发送顶部提示“对局不超过10手结束，对局无效”，前端不弹对局结果弹窗。
- 开发测试按钮：`test-random-layout` 会清空棋盘并生成符合基本气规则的 50 黑 50 白随机布局；`test-restore-skill` 会恢复当前玩家技能次数；`test-enter-byo-yomi` 会把点击方主时间直接置为 0 并进入读秒。该入口用于本地测试，后续应便于统一移除。

### 技能与角色

- 内置角色 fallback：`sigrika`、`denia`、`aemeath`、`baconbits`、`nabomo`。历史数据中可能仍存在旧别名 `danea`；公共角色列表、前端合并、用户公开资料和出战角色解析会将其规范化为 `denia`，避免部员手册中重复出现两个达妮娅。若数据库中同时存在启用的 canonical `denia` 和禁用的旧 `danea`，出战角色解析以启用的 `denia` 公开角色为准，不让旧禁用别名覆盖当前可用角色。
- DB 角色会覆盖/合并内置角色。
- 所有存在的角色都会出现在棋舍角色列表；未拥有角色以灰色状态展示，可查看信息但不可出战。
- 角色信息包含 `acquisitionMethod`/“获得途径”纯文本，可由后台维护。
- 娜波摩的获得途径为积分达到 1400 分自动获得；公开用户序列化时会根据 `User.rating` 自动补充 `nabomo` 到已拥有角色列表。
- 技能类型：
  - `erase-point`：抹除空交叉点，点位不可落子且不参与数子。
  - `flip-stone`：反转目标棋子颜色。
  - `hidden-hand`：隐藏手，未暴露前对对方隐藏。
  - `random-blast`：随机选择棋盘上非一路的已有棋子作为中心，并移除以该棋子为中心的固定 3x3 区域内棋子。
  - `color-illusion-passive`：娜波摩被动技“千变万化”。第一次轮到娜波摩玩家时自动进入技能演出，演出结束后该玩家后续落子有 80% 概率在对手视角中显示为对手颜色，真实棋盘规则仍按实际颜色计算；数子申请待确认时仍保持伪装，双方同意并进入死子确认/数子阶段、结果确认或对局结束后才显示真实棋盘。
- 达妮娅 `flip-stone` 作用于真实棋子；如果目标点带有娜波摩伪装，反色后会清除该点伪装。
- 技能演出流程：服务端先进入 `skill-preview` 并广播 `pendingSkill`，此时棋盘保持旧状态；中间横幅动画结束后才真正应用技能效果并再次广播。
- 达妮娅目标点泡泡炸裂特效已有预览资产 `public/assets/effects/denia-bubble-pop.gif`：透明玻璃泡泡生成并膨胀，随后被黑色能量/墨雾填满，短暂出现细密裂纹和蓄力压迫，最终爆散出黑色碎片、烟雾粒子和轻微冲击波并消散。该 GIF 当前仅作为视觉参考，尚未接入技能生效流程。
- 开局被动技能不会在 `opening` 阶段触发；正式进入 `playing` 后才按延迟规则触发，避免和执色提示/开局语音重叠。
- 依赖棋盘已有棋子的技能在场上没有棋子时不可启动：前端技能按钮会变灰，服务端也会在 `use-skill` action 中二次校验并拒绝。当前包括以棋子为目标的达妮娅 `flip-stone`，以及需要随机选择现有棋子为中心的猪小仙 `random-blast`。
- 无目标技能不显示落子/目标预览；猪小仙 `random-blast` 使用“确认式无目标”流程：点击技能后进入待释放状态，棋盘悬停不显示目标标记，点击任意棋盘点仅确认释放。真正爆炸中心仍由服务端随机选择棋盘上非一路的已有棋子，点击点不作为爆炸中心。技能生效后会在完整 3x3 区域留下较弱的交叉点高亮，施放者下一手落子后清除。爆炸残留区域使用独立视觉层展示，不遮挡普通落子点 hover 提示。
- 技能可配置：
  - 使用次数 `uses`
  - 是否不消耗回合 `freeTurn`
  - 是否启用 `enabled`
  - 目标规则 `targetRule`
  - 参数 JSON `paramsJson`
  - 超频类型 `costType`
  - 超频值 `costValue`
  - 系统消息模板 `systemMessage`
- 系统消息模板当前支持：`{player}`、`{character}`、`{skill}`、`{point}`、`{fromColor}`、`{toColor}`、`{targetColor}`，并保留 `{color}` 兼容旧配置。

### 棋谱与回放

- 对局结束后写入 `GameRecord`。
- 棋谱保存房间快照 `snapshot`；胜负局会先把积分、金币和战绩奖励应用到房间内存玩家，再生成 `GameRecord.snapshot`，避免断线后恢复结果时展示结算前的旧用户状态。
- 用户可看自己的全部棋谱摘要；部员手册会用这批完整记录派生总局、胜局、负局和和棋，保证与排行榜同源统计一致。
- 管理员可查看任意用户棋谱与任意棋谱详情。
- 前端回放通过 `replayRoomAt` 基于历史步骤重放共享规则逻辑。
- 观战者进入房间后默认使用黑方对局视角，包括双方信息区位置；黑白双方信息区立绘左侧提供眼睛图标，可切换黑方/白方视角；下方操作栏切换为图标式回放控制。
- 棋谱回放同样支持黑方/白方视角切换，回放棋盘会按所选视角重放隐藏手和娜波摩伪装效果。
- 观战回放只改变棋盘内容，不改变实时信息区内容（计时、读秒、提子、超频等保持实际对局进程）。
- 观战弹窗标题显示为“对局列表”。观战者停在最新手时会自动跟随实时进程；如果手动回退到旧手，则新进程不会强制跳回最新。

### 商城与装饰

- 商品支持 `character`、`item` 与 `decoration` 三类。
- 商品有原价、折扣、是否可购买、是否展示、排序、描述、图片；道具商品额外有目标类型和商店库存。
- 玩家商城大厅入口显示为“商店”。商店窗口分为左右两列：左侧窄列为扎希拉接待区，上方是独立聊天气泡，中间展示扎希拉 Q 版立绘，底部显示“你当前拥有”小字和金币图标加金额的金色标签；聊天气泡不再带下方圆点尾巴，金币标签与立绘保持约 15px 间距。右侧宽列直接从分类选项卡进入商品栏和页码，不再显示大标题。商品区每页仍固定 8 个槽位，但视觉网格会按可用宽高自适应列数，商品区内部独立滚动，页码固定保留在底部且当前页使用浅色高亮；商品网格内容在选项卡和页码之间使用安全居中：高度足够时尽量让第一行商品顶部与选项卡底部、第二行商品底部与页码按钮之间的留白接近，高度不足时回退到顶部对齐，保证滚动条可以覆盖完整商品栏。横屏小高度或窄窗口下会压缩扎希拉立绘、气泡、商品卡片和选项卡间距，避免商品栏和分类选项卡被挤出视口。商品数超过 8 个时自动增加页码，点击页码切换对应商品栏，切换分类会回到第 1 页且不改变槽位数量。空槽显示“暂未上架”，可购买槽使用简明浅色渐变，已拥有槽使用浅绿色渐变。扎希拉资源位于 `/assets/zahiya_shop.png`，打开商店时聊天气泡从“今天想买些什么？”“刚刚进了一批好货哟~”“欢迎来到扎希拉商店！”中随机展示一句。
- 商城商品卡片按商品图标、商品名、商品介绍、数量/售价、购买按钮自上而下排列；数量或限购信息左对齐，售价右对齐。折扣商品的原价显示在现价数字上方，使用更小的红色删除线并与现价保持紧凑间距；原价作为浮动标注对齐现价数字列，不改变现价和无折扣商品售价的行内位置。购买按钮与卡片底部保留留白。商品卡片使用固定图片区、名称区、介绍区、信息区和按钮区，避免窗口尺寸变化时内容被挤出商品栏。
- 购买会扣除用户金币，并写入 `ownedCharacters`、`ownedDecorations` 或 `ownedItems`；道具可重复购买并按数量累加。道具 `stockQuantity` 表示每个用户独立的商店库存上限，不共享全服库存；购买道具会写入用户侧 `itemPurchaseCounts`，用于计算该用户剩余商店库存。
- 商店选项卡包含“道具”，点击后切换到道具商品页；道具对当前用户的剩余商店库存为 0 时仍可展示，但“购买”按钮改为“已售罄”并禁用。
- 商店商品槽和仓库道具/角色目标列表会缓存当前分类、页码和拥有角色派生结果；弹窗中的道具图、角色图和使用结果图使用 lazy loading 与 async decoding，避免道具图片或动图增加后挤占对局/弹窗打开时的主线程预算。
- 大厅左下工具区新增“仓库”入口，玩家可查看已购道具、数量和说明。自己目标道具可直接使用；角色目标道具会弹出角色选择窗口，展示自己拥有的角色立绘，点击角色后按个消耗道具；若道具有已实现效果，窗口会只保留被选择角色立绘并在下方展示效果文本。使用道具只减少仓库道具数量，不恢复商店库存；短提示和错误统一走页面顶部 toast，不在仓库窗口内额外显示。
- 对角色使用道具成功后，页面顶部 toast 显示“对[角色名]成功使用了[道具名]”；使用结果窗口读取接口返回的最新 `user.itemEffects`，所以达妮娅吃下彩虹豆豆跳跳糖后，结果窗口中的达妮娅立绘会立即显示为彩色 GIF 状态。
- 商店购买、商店加载错误、后台管理保存/下架/上传/封禁等操作反馈统一走页面顶部 toast，不在对应弹窗、抽屉或后台编辑区内新增成功/失败文本框。
- 页面顶部 toast 使用队列堆叠展示，新提示插入顶部，先出现的提示会被挤压到下方；每条提示最长显示 3 秒后淡出。涉及金币、积分或段位变化的事件（包括对局结果、购买、道具效果、后台编辑当前用户等）会按变动项分别立即显示 toast；金币增加、积分增加、段位升高使用黄底 reward toast，例如 `金币+50`、`积分+20`、`段位2段 → 3段`，金币扣除、积分扣除、段位降低使用灰底 penalty toast，例如 `金币-10`、`积分-20`、`段位3段 → 2段`。
- 内置道具“彩虹豆豆跳跳糖”会 seed 为 `item` 商品，商店库存 10、价格 10、图片 `/assets/items/rainbow-bean-candy.png`，介绍为“产地不明的糖果，据说有神秘的效果”。该道具只能对角色使用，目前仅西格莉卡和达妮娅有实际效果，其它角色会返回“这个角色暂时没有糖果效果”且不消耗道具。
- 彩虹豆豆跳跳糖对西格莉卡使用后：消耗 1 个道具，用户获得 30 金币，`itemEffects.sigrikaCandyDisabled` 置为 true；西格莉卡棋舍出战按钮变灰，`/api/me/character` 与 socket 选角都会避开西格莉卡。如果当前出战是西格莉卡，后端自动随机切换到一名已拥有且可出战的其它角色；没有可替换角色时拒绝使用且不消耗道具。任意角色完成一盘有效对局后清除该状态。
- 彩虹豆豆跳跳糖对达妮娅使用后：消耗 1 个道具，`itemEffects.deniaRainbowGlow` 置为 true；除用户铭牌外，所有展示该用户达妮娅立绘的位置都会把原立绘替换为 `/assets/characters/denia_color.gif` 彩色动图，包括棋舍、仓库使用结果、对局信息区、技能横幅、排行榜/好友资料等可获得用户效果状态的界面。只有使用达妮娅完成一盘有效对局后清除该状态；服务端会在首个有效结算 `room:update` 广播前先更新房间内存玩家状态，前端再从房间视图同步当前用户状态，因此返回大厅/棋舍时立绘会恢复为角色原始立绘。
- 登录后的静态资源预加载会无条件加入达妮娅糖果动图 `/assets/characters/denia_color.gif`，让用户之后在棋舍、排行榜、好友资料或对局中首次看到彩色达妮娅时不再临时下载；对局回放数据仍保持按需加载。
- 糖果效果只在有效对局结束并保存棋谱的链路清除；不超过 10 手的无效对局不会清除糖果效果。
- 内置商品会 seed 猪小仙角色商品，价格 9999 金币；用户购买后才可出战该角色。
- 内置装饰商品会 seed 爪印棋子和“耙耙柑和水蜜桃”两套棋子装饰；爪印棋子价格 500 金币，“耙耙柑和水蜜桃”价格 1000 金币。
- `seedBuiltinShopItems` 只创建缺失的内置商城商品，不覆盖已经存在的 `ShopItem`。后台管理保存过的商品名、介绍、图片、售价、库存和上下架状态必须以数据库为准，服务重启或对局写库后不能被内置默认值改回。
- 爪印棋子使用 image-gen 生成图裁切出的透明 PNG 贴图：`paw-stone-black.png`、`paw-stone-white.png` 和 `paw-stone-preview.png`。“耙耙柑和水蜜桃”使用用户提供的 512x512 透明 PNG：`papagan-peach-stone-black.png` 为耙耙柑黑子，`papagan-peach-stone-white.png` 为水蜜桃白子，`papagan-peach-stone-preview.png` 为 1024x512 商店预览图。
- 后台保存装饰类商城商品时，`targetId` 校验同时认可数据库 `Decoration.slug` 与内置 `STONE_DECORATIONS` 配置，避免只修改内置装饰商品介绍时被误报为 `Shop decoration target does not exist`。
- 玩家购买棋子装饰后会进入棋舍装饰区，可点击应用；空选择表示继续使用默认棋子。
- 对局棋盘按棋子颜色找到对应玩家的 `selectedStoneDecoration`，黑白双方可分别显示各自设置的棋子样式；未设置时保持默认棋子。装饰棋子贴图直接替换默认棋子视觉，不附加默认圆形阴影，避免不规则透明 PNG 下方露出圆形光圈。

### 排行榜

- 入口在大厅。
- API 为 `GET /api/leaderboard`。
- 仅展示至少完成过一盘对局的用户。
- 按 `rating` 降序排序。
- 每行展示段位，段位由 `rankFromRating(rating)` 派生，和大厅/棋舍/对局信息保持一致。
- 从棋谱统计总对局数、胜局数、负局数、和棋数。
- 最后一列展示胜率，按 `胜局数 / 总对局数 * 100%` 计算并保留 1 位小数；所有列内容居中显示。用户名和常用角色名限制在各自列宽内，过长时使用省略号。
- “常用角色”按棋谱中该用户使用次数最多的角色计算。
- 棋舍中的积分显示使用 `User.rating` 持久化值；总局、胜负、和棋仍由棋谱统计，避免后台积分编辑或对局结算后与棋舍显示不同步。

### 后台管理

- 概览：用户数、封禁用户数、启用角色数、棋谱数、最近审计日志。
- 用户管理：列表、状态标签、右侧抽屉编辑角色、积分、金币、拥有角色、出战角色；段位由积分自动换算只读展示；支持封禁、解封、重置密码、查看用户棋谱。
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
- `rank`: 兼容旧数据的持久化字段，schema 默认值为 `2段`，与默认 `rating = 1000` 的段位派生结果保持一致；前端和 API 展示值不直接读取该字段，而是通过 `rating` 自动换算。
- `rating`: 积分，默认 1000，允许为负数。段位规则：`[900, 1000)` 为 1段，之后每 100 分升 1段，1700 分及以上封顶为 9段；`[800, 900)` 为 1级，之后每低 100 分级位加 1，`[0, 100)` 为 9级，小于 0 分为 10级。
- `wins`: 胜局数，默认 0。
- `losses`: 负局数，默认 0。
- `coins`: 金币，默认 300。
- `selectedCharacter`: 出战角色 slug，默认 `sigrika`。
- `selectedStoneDecoration`: 当前应用的棋子装饰 slug，空字符串表示默认棋子样式。
- `ownedCharacters`: 逗号分隔的角色 slug 字符串，默认包含内置角色。
- `ownedItems`: JSON 数量表字符串，例如 `{"dream-ticket":2}`；兼容旧逗号分隔字符串读取，API 对外返回 `{ itemId, quantity }` 数组。
- `itemPurchaseCounts`: JSON 数量表字符串，例如 `{"rainbow-bean-candy":3}`；记录每个用户已从商店购买道具的次数，用于计算用户独立的商店库存，不随道具使用而减少。
- `itemEffects`: JSON 状态字符串，当前支持 `sigrikaCandyDisabled` 与 `deniaRainbowGlow` 两个彩虹豆豆跳跳糖临时效果。
- `ownedDecorations`: 逗号分隔装饰 slug。
- `createdAt`, `updatedAt`: 创建和更新时间。

### LoginSession

持久化登录会话表，用于 refresh cookie、单账号单会话和服务重启后的登录恢复。

- `id`: session id，会写入 access token 的 `sid` claim。
- `userId`: 归属用户 id。
- `refreshTokenHash`: refresh token 的 SHA-256 哈希，数据库不保存明文 refresh token。
- `revokedAt`: 撤销时间；主动登出、强制登录或创建新 session 时写入。
- `expiresAt`: refresh session 过期时间。
- `lastSeenAt`: 最近一次 HTTP/Socket 鉴权或 refresh 时间。
- `createdAt`, `updatedAt`: 创建和更新时间。

### UserRelationship

用户关系表，用于好友与黑名单。

- `ownerUserId`: 关系拥有者。
- `targetUserId`: 关系目标用户。
- `type`: 当前使用 `friend` 或 `blacklist`。
- 同一个 `ownerUserId + targetUserId` 只有一条记录；好友和黑名单互斥，通过更新 `type` 覆盖。
- 关系写入使用 raw SQL upsert，并显式写入 `createdAt` / `updatedAt`，避免开发库通过 Prisma push 建表时 `updatedAt` 没有数据库默认值而触发 NOT NULL 约束错误。
- 已在 `prisma/schema.prisma` 声明，并通过 `202605220001_add_user_relationship` migration 固化建表和索引；服务启动时仍保留 `ensureSocialSchema` 作为开发库兜底。

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
- `targetRule`: 目标规则，当前校验为 `empty-point`、`stone`、`any-point` 或 `none`；猪小仙 `random-blast` 为 `none`，但仍进入待释放确认状态，点击棋盘任意点后才释放。
- `paramsJson`: JSON 字符串，当前作为扩展参数保留。
- `costType`: `numeric` 或 `special`。
- `costValue`: 超频值；`numeric` 会参与数子扣分，`special` 当前仅展示。
- `systemMessage`: 技能系统消息模板。
- `enabled`: 是否启用；公开角色 payload 会过滤禁用技能，后台角色表单可独立控制角色启用与技能启用。
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
- `category`: `character`、`item` 或 `decoration`。
- `targetId`: 商品对应角色 slug、道具 slug 或装饰 slug。
- `itemTargetType`: 道具目标类型，`self` 表示用户自己，`character` 表示需要选择拥有角色；非道具商品忽略。
- `stockQuantity`: 道具商店库存上限，`-1` 表示不限量，`0` 表示对每个用户均售罄，正整数表示每个用户可购买次数；非道具商品忽略。
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

- `key`: 主键。当前使用 `homeTitle`、`homeSubtitle` 与 `aboutText`。
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
  - 当前包含大厅标题 `homeTitle`、大厅副标题 `homeSubtitle` 与设置关于页长文本 `aboutText`。
  - 不要求登录；前端接口失败时使用 `src/shared/siteSettings.js` 中的默认值。

- `POST /api/auth/register`
  - 注册账号。
  - 用户名至少 2 位，密码 6-14 位；前端注册表单要求确认密码与密码一致。
  - 成功后创建 `LoginSession`、设置 refresh cookie，并返回 access token 与公开用户信息。

- `POST /api/auth/login`
  - 登录并返回 JWT 与公开用户信息。
  - 被封禁用户返回 403。
  - 已有有效登录会话时返回 `already_logged_in` 冲突；`forceLogin` 会撤销旧 session 并踢下旧 socket。

- `POST /api/auth/refresh`
  - 读取 `sigrika_refresh` `HttpOnly` cookie，校验并轮换 `LoginSession.refreshTokenHash`，返回新的 access token 与公开用户信息。
  - refresh 无效、过期或已撤销时清除 cookie 并返回 401。

- `POST /api/auth/logout`
  - 撤销当前 refresh session 和可识别的 access-token session，并清除 refresh cookie。

- `GET /api/me`
  - 登录用户信息。
  - 会返回公开用户字段；`rating` 以持久化 `User.rating` 为权威值，`totalGames`、`wins`、`losses`、`draws` 从棋谱派生。

- `POST /api/me/character`
  - 修改当前出战角色。
  - 会校验角色存在且未停用；逻辑同时考虑 DB 角色和 fallback 角色。

- `POST /api/me/decoration`
  - 应用或清空当前棋子装饰。
  - 非空 `decorationId` 必须是已知棋子装饰且用户已拥有。

- `GET /api/shop`
  - 登录后获取启用商城商品。

- `POST /api/shop/:id/purchase`
  - 登录后购买商品。
  - 扣金币并更新拥有角色、装饰或道具库存；道具对当前用户的剩余商店库存为 0 时不可购买。

- `GET /api/items/inventory`
  - 登录后获取当前用户仓库道具列表。
  - 返回道具商城信息、目标类型和当前拥有数量。

- `POST /api/items/:itemId/use`
  - 登录后按个使用仓库道具。
  - `self` 道具不需要对象；`character` 道具需要提交已拥有角色 `characterId`。后端会在校验拥有角色时规范化历史别名，例如旧 `danea` 会按 canonical `denia` 识别。
  - 彩虹豆豆跳跳糖会返回 `effectText` 和最新 `user`，并写入对应 `itemEffects`；同一角色效果未结束时禁止重复使用且不消耗道具。

- `GET /api/leaderboard`
  - 登录后获取排行榜。
  - 基于所有用户和所有棋谱统计。

- `GET /api/social`
  - 登录后获取当前用户的好友列表和黑名单列表；每个成员包含用户名、段位、积分、常用角色和在线状态。

- `POST /api/social/friends/:targetId`
  - 将目标用户设为好友；同一目标此前若在黑名单中，会被覆盖为好友关系。

- `DELETE /api/social/friends/:targetId`
  - 解除好友关系。

- `POST /api/social/blacklist/:targetId`
  - 将目标用户加入黑名单；同一目标此前若是好友，会被覆盖为黑名单关系。

- `DELETE /api/social/blacklist/:targetId`
  - 从黑名单移除目标用户。

- `GET /api/users/:id/profile`
  - 获取用户资料卡：用户名、战绩、积分、段位、角色战绩和查看者与目标的关系；不随资料卡预取对局回放。
  - 资料卡中的总战绩和角色战绩从目标用户全部棋谱派生，不受公开回放列表 30 条限制影响；胜负识别与排行榜一样优先使用 `winnerColor`，旧棋谱回退解析 `resultText`。

- `GET /api/users/:id/replays`
  - 按需获取目标用户最近 30 条棋谱摘要；资料卡中的“对局回放”按钮点击后调用该接口并弹出回放列表。

- `GET /api/replays`
  - 获取当前用户全部棋谱摘要；摘要包含黑白双方 user id、用户名、使用角色、胜负结果和手数，供部员手册统计和回放列表显示角色立绘。

- `GET /api/replays/:id`
  - 获取指定棋谱详情与快照；用于个人棋舍回放，也用于他人资料卡中的公开回放入口。

### 后台 HTTP API

所有 `/api/admin/*` 路由都经过 `authHttp` 和 `requireAdmin`。

- `GET /api/admin/summary`
  - 后台概览数据和最近 8 条审计日志。

- `GET /api/admin/audit-logs`
  - 最近 100 条审计日志。

- `GET /api/admin/site-settings`
  - 读取后台可编辑的站点配置。

- `PATCH /api/admin/site-settings`
  - 更新大厅标题、大厅副标题和设置关于页长文本。
  - `homeTitle` 会 trim 并限制到 24 字符；`homeSubtitle` 会 trim 并限制到 80 字符；`aboutText` 会 trim 并限制到 3000 字符。
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
  - 编辑用户 role、rating、coins、ownedCharacters、ownedItems、selectedCharacter；rank 由 rating 自动派生，不允许单独编辑。
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

- 后台“道具管理”
  - 复用 `ShopItem.category = item` 的商城商品数据，可管理道具名、slug、图标、介绍、目标类型、商店库存、售价、折扣、展示与购买状态；商店库存为每个用户独立的购买次数上限。
  - “用户管理”抽屉展示“拥有道具”文本区，一行一个 `道具slug:数量`，可通过新增行、改数量或删除行完成用户道具增删改查。

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
  - `roomView` 中包含 `players`、`spectators` 和 `spectatorCount`；`spectators` 为观战用户列表，供房间成员列表实时展示。

- `game:action`
  - 对局动作：`move`、`pass`、`resign`、`skill`。
  - 本地测试动作：`test-random-layout`、`test-restore-skill`、`test-enter-byo-yomi`。这些动作当前走同一 Socket 入口，但命名集中为 `test-*`，便于后续移除。

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
  - 清理匹配队列 socket 和观战列表；若观战列表变化，会重新广播房间状态。

服务端发出：

- `match:waiting`
- `match:found`
- `room:update`
- `room:closed`
- `error:toast`
- `me`

## 7. 权限系统现状

- 登录态使用 JWT：
  - `withToken` 签发 `{ sub: user.id, sid }`，有效期 14 天。
  - HTTP 请求通过 `Authorization: Bearer <token>`。
  - Socket.IO 通过 `handshake.auth.token`。
  - `/api/auth/refresh` 读取 `HttpOnly` refresh cookie，校验 `LoginSession` 后轮换 refresh token 并返回新的 access token。
  - `/api/auth/logout` 会撤销 refresh session 并清除 cookie。

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

当前公共组件已从 `src/main.jsx` 按页面域逐步拆出，后台管理组件位于 `src/admin/AdminConsole.jsx`，对局页容器位于 `src/room/RoomScreen.jsx`：

- `AdminFieldLabel`: 带 title 提示的后台字段标签，位于 `src/admin/AdminConsole.jsx`。
- `AdminSectionHeader`: 后台列表页标题、数量和主操作按钮，位于 `src/admin/AdminConsole.jsx`。
- `AdminStatusPill`: 后台表格状态标签，位于 `src/admin/AdminConsole.jsx`。
- `Toast` / `ToastStack`: 自动消失提示队列，使用高对比渐变底色突出规则错误、非法操作等短提示；成功提示为绿色，金币、积分、段位变动提示为黄底 reward 样式，并由 `buildStatChangeToasts` 拆成每项一条。队列最多保留最新 5 条，避免高频操作造成页面卡顿。
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
- `DEFAULT_SITE_SETTINGS`: 位于 `src/shared/siteSettings.js`，前后端共用大厅标题、副标题和设置关于文本默认值。
- `lastMarkedAction` / `canPreviewSkillTarget`: 位于 `src/shared/boardView.js`，用于统一棋盘最后落子/技能标记与技能预览判定。
- `COLORS` / `opponent`: 位于 `src/shared/gameConstants.js`，集中维护棋色常量与对手颜色推导；`src/shared/game.js` 保持同名转导以兼容既有调用方。
- `createPoints` / `getPoint` / `activeNeighbors`: 位于 `src/shared/gameBoard.js`，集中封装棋盘几何和点位访问；`src/shared/game.js` 保持同名转导以兼容既有调用方。
- `normalizeSkillConfig` / `skillRequiresExistingStone`: 位于 `src/shared/gameSkills.js`，集中封装技能配置归一化和棋子依赖判定；`src/shared/game.js` 保持同名转导以兼容既有调用方。
- `createResignResult` / `createTimeoutResult` / `createDrawResult` / `resultWithInvalidFlagForGame`: 位于 `src/shared/gameResults.js`，集中封装对局结果 payload 与早期无效局标记；`src/shared/game.js` 保持同名转导以兼容既有调用方。
- `formatStones`: 位于 `src/shared/stoneFormatting.js`，集中封装子数整数/分数显示；`src/shared/game.js` 保持同名转导以兼容既有调用方。
- `canStartSkill`: 位于 `src/shared/game.js`，前后端共用技能启动前置条件，用于判断棋子目标/棋子依赖技能在当前棋盘状态下是否可用。
- `rememberPlayerRoom` / `buildRoomResumeRequest` / `handleRoomResumePayload`: 位于 `src/app/resumeSession.js`，集中封装前端断线恢复 localStorage 与结果恢复状态编排。
- `replayRoomAt`: 用历史记录重放房间状态；观战实时回放另由 `replayGameAt` 只派生棋盘进程。
- 音频相关：`loadAudioSettings`、`playStoneSound`、`playSystemVoice` 路由、`preloadVoiceSound`、`playPreloadedVoiceSound`、`speakText`。

### 后端通用逻辑

- `publicUser`: 用户公开字段白名单，并通过 `rankFromRating` 将积分转换为段位/级位。
- `rankFromRating`: 位于 `src/shared/ratingRank.js`，前后端共用的积分到段位/级位换算逻辑。
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
- `prepareCandyEffectUpdates` / `candyEffectData`: 位于 `server/roomItemEffects.js`，集中封装有效局后的糖果道具效果清理和持久化更新数据。
- `applyResultRewardsToRoomUsers` / `applyUserReward`: 位于 `server/roomRewards.js`，集中封装对局结果奖励写回房间内存用户的逻辑。
- `persistRoomState` / `roomPersistenceSnapshot` / `hydratePersistedRoom`: 位于 `server/roomStatePersistence.js`，集中封装房间快照生成、恢复、快照版本保护和节流持久化。
- `tickPlayerClock` / `resetByoYomi`: 位于 `server/roomClockTiming.js`，集中封装主时间与读秒周期推进、有效行动后的读秒重置。
- `resumePayloadForUser`: 位于 `server/resume.js`，封装断线恢复查询顺序：优先查内存未结束房间，其次查仍在内存的已结束房间，最后按最近房间号查持久化棋谱快照。
  - 如果历史 `GameRecord.snapshot` 损坏无法解析，恢复流程会返回 `type: "none"`，避免单条坏数据导致重连请求崩溃。

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
- 登录 access token 只存在 React 内存状态中；`src/app/sessionState.js` 初始进入 `preloading`，由 `src/main.jsx` 调用 `/api/auth/refresh` 尝试从 `HttpOnly` refresh cookie 恢复登录。恢复失败才进入登录页。
- 音频设置存在 `localStorage` 的 `sigrika-audio-settings`。
- 房间状态由服务端 Socket 广播覆盖到前端 `room`。
- 对局页 `RoomScreen` 需要从顶层 `App` 接收当前 `token`，再传给房间成员列表等需要调用社交接口的子组件；匹配成功倒计时完成后由同一份房间快照切换到对局页。
- 回放状态通过 `replayStep` 和 `replayRoomAt` 从快照历史中派生。

### 后端状态

- 数据库持久化：
  - 用户、角色、技能、装饰、商城、棋谱、审计日志、站点设置。

- 内存状态：
  - `server/rooms.js` 的 `rooms = new Map()`。
  - `waitingPlayers` 匹配队列，按黑名单关系跳过不兼容候选并保留等待。
  - 房间计时器、读秒、观战者、聊天、当前棋局状态。

- 对局结束持久化：
  - `scheduleRoomClose` 调用 `saveGameRecord`。
  - 房间 5 分钟后关闭并从内存删除。

## 10. 已知技术债

以下只列代码中能观察到的事项；本轮静态扫描时间为 2026-05-29。当前测试数量较充足，但债务主要集中在实时房间、数据模型规范化、前端大型模块、音频生命周期和缺少浏览器端回归测试。

### P0 / 部署前优先处理

- 实时房间仍以内存 `Map` 为核心状态，虽然已增加房间持久化快照和断线恢复兜底，但服务重启、多进程或多实例部署时仍存在风险：
  - 未结束房间的实时状态、技能演出定时器、读秒计时器和 Socket.IO 房间成员关系不能跨进程共享。
  - 技能演出仍依赖 `setTimeout` 延迟落子/变更效果，进程重启或实例迁移时需要额外的状态恢复/调度设计。
  - 若部署到云服务器并需要横向扩展，应优先引入共享房间状态、Socket.IO adapter、定时任务恢复策略和房间快照版本校验。

- 认证与会话已经从纯内存 token 发展到 `LoginSession` + refresh cookie，服务端也已增加生产启动配置体检：
  - refresh session 已可撤销，生产环境会拒绝过短或默认 `JWT_SECRET`，并要求显式 HTTPS origin；部署手册仍需要写清强随机密钥、可信 CORS origin、HTTPS 证书和 cookie `Secure` 的实际配置方式。
  - 当前没有面向登录/刷新/登出全链路的浏览器端回归测试，容易在自动登录、Socket 重连和强制下线交界处回归。

- 测试用对局按钮已集中在 `TestTools` 和 `test-*` action，并已增加环境保护：
  - 前端仅在 Vite 开发环境显示按钮。
  - 服务端在 `NODE_ENV=production` 时拒绝 `test-*` action。
  - 对外部署前仍建议把测试入口移到显式调试面板或管理员开发开关，避免未来新增测试 action 时绕过统一保护。

### P1 / 近期高价值重构

- 数据模型仍有多处字符串化资产字段：
  - 用户拥有角色/装饰使用 CSV 字符串字段，查询和约束能力弱，容易产生重复或无效 slug。
  - `ownedItems` 与 `itemEffects` 使用 JSON 字符串字段，已兼容旧逗号分隔读取，但数据库层无法约束 item id、数量和效果 schema。
  - 商城后台新增/修改时会校验 `targetId` 对应角色或装饰存在，购买时仍依赖字符串拥有列表；数据库层没有外键约束。
  - `server/userAssets.js` 已集中角色/装饰资产字段的解析、去重和序列化，降低重复逻辑扩散；这只是迁表前的防护层，不替代结构化表。
  - 后续建议逐步迁移到 `UserCharacter`、`UserDecoration`、`UserItem`、`UserItemEffect` 等结构化表，并保留一次性数据迁移脚本。

- `GameRecord` 与 `User`、`Character` 没有数据库外键关系，依赖字符串逻辑关联。胜负判断已使用 `winnerColor` 结构化字段，但仍保留旧 `resultText` 回退逻辑以兼容历史棋谱；后续应补历史记录迁移和快照版本字段。

- 当前用户资产与战绩存在多处来源：
  - `User.rating` 会被对局结果和后台编辑直接更新，`/api/me` 已直接返回该持久化积分。
  - 棋舍/排行榜的总局、胜负、和棋等统计仍从 `GameRecord` 派生。
  - 金币、积分、段位 toast 已依赖前端比较前后状态；后续如继续扩展赛季、排行榜、金币流水或补偿发放，需要增加结构化积分/金币变更记录，避免只靠即时响应推断。

- 核心源码体量仍偏集中。本轮扫描中，超过 300 行的主要业务文件包括 `server/rooms.js`、`src/admin/AdminConsole.jsx`、`src/shared/game.js`、`server/adminRoutes.js`、`server/index.js`、`src/main.jsx`、`src/audio/playback.jsx`、`src/room/RoomScreen.jsx`：
  - `server/rooms.js` 已拆出 room view、奖励、持久化和计时 helper，但仍承载实时生命周期、动作分发、Socket 广播、数子/和棋、断线与关闭逻辑。
  - `src/admin/AdminConsole.jsx` 已拆出 `AdminShell`，tab body 仍适合继续按用户、角色、商品、装饰、站点设置拆分。
  - `src/main.jsx` 已拆出 API、socket handlers、socket creation helper、character catalog loader、site settings loader、preload screen、room navigation helper、replay opening helper、session helpers，但仍聚合全局弹窗、音频、登录恢复、房间切换和 toast 协调。
  - `src/shared/game.js` 仍混合规则执行、技能执行、数子和历史兼容转导，继续拆成规则状态机与技能插件会降低新增角色风险。

- 全局样式入口已拆为多个 `src/styles/*.css` 分域文件，但 `room.css`、`commerce-settings.css`、`modals.css` 仍很大；继续按组件边界细分，或引入明确的 CSS module/组件样式约定，可以降低 UI 微调互相影响的概率。

### P2 / 稳定性和测试覆盖

- 观战回放、棋谱回放和实时房间共享大量视图组件，但状态来源不同：
  - 观战回放由实时房间快照和历史重放派生，信息区保持实时、棋盘可回退。
  - 棋谱回放应禁止结果弹窗、结果语音和对局开始语音，退出后还要清理回放房间快照。
  - 该“双状态/三入口”模型需要更多自动化测试覆盖，尤其是进入/退出回放、观战加入已结束房间、房间关闭倒计时和 BGM 恢复。
  - 房间持久化快照已加入版本号护栏，但后续如果变更房间结构，仍需要同步补快照迁移/兼容测试。

- 音频播放逻辑仍集中在 `src/audio/playback.jsx`，同时管理 BGM、棋盘音效、结果音效、技能语音、系统语音、缓存和 Web Audio autoplay 恢复。后续可拆为 BGM、effect、voice、audio cache 四类模块，并补浏览器自动播放策略下的集成测试。

- 技能扩展当前由 `effectType` 分支实现，`paramsJson` 已保留但核心规则尚未通用化；`random-blast` 的完整 3x3、演出延迟、回放重放、棋盘高亮清理等逻辑分散在共享规则、服务端房间和前端棋盘中。后续新增角色时应优先抽技能契约，避免继续堆分支。

- 社交、约战、黑名单、在线状态已有较多单元测试，但仍缺少端到端 UI 测试覆盖好友弹窗、对局申请横幅、资料卡回放弹窗、观战列表和后台管理关键编辑流。

- 后台审计已覆盖用户、角色、装饰、商城商品和站点设置的主要增改/禁用操作；后续可继续细化到登录、刷新、登出、购买、道具使用、上传等事件，方便线上排查“谁改了什么”。

### P3 / 维护性清理

- Prisma migrations 目录已开始建立，`SiteSetting`、`selectedStoneDecoration`、`UserRelationship`、`LoginSession` 等结构已有迁移；后续跨机器协作时需要坚持使用 migration 管理结构变更，避免继续依赖临时 `db push`。

- `prisma db push` 已可同步当前开发库 schema，但 Windows 上 Prisma Client generate 可能因运行中的 Node 后端占用 `query_engine-windows.dll.node` 而出现 EPERM rename；遇到时需要先停止后端进程再重新运行 `npm run prisma:generate` 或 `npm run prisma:push`。

- Prisma schema 的中文默认值已增加 `server/schemaIntegrity.test.js` 防回归检查；`docs/system-design.html` 已改为由 `npm run docs:system-design` 从 Markdown 确定性生成，后续如发现乱码应优先确认终端/浏览器编码和源文件 UTF-8 状态。

- 角色立绘上传先按 MIME 生成安全文件名，落盘后读取文件签名确认 PNG/JPEG/WebP/GIF 内容与 MIME 匹配；不匹配或未知签名会删除该单个上传文件并返回 JSON 错误。后续可继续补上传大小、尺寸、透明通道和动图帧数限制。

- `docs/system-design.html` 是生成产物；修改本文档后运行 `npm run docs:system-design` 同步 HTML，避免 Markdown 与交付版漂移。

## 11. 后续扩展建议

- 建立 Prisma migration 流程：
  - 引入 `prisma migrate dev` / `migrate deploy`。
  - 后续新增结构变更继续优先生成 migration，避免只依赖 `prisma db push`。

- 将核心统计结构化：
  - `GameRecord` 已增加 `winnerColor`、`resultReason`；后续可继续补双方最终积分变化等字段。
  - 排行榜、棋舍战绩、用户统计目前仍从棋谱派生；若引入赛季，需要明确结构化统计来源。

- 拆分前端模块：
  - 已完成：`src/admin/AdminConsole.jsx`
  - 已完成：`src/api/client.js`
  - 已完成：`src/modals/HouseModal.jsx`
  - 已完成：`src/modals/ShopModal.jsx`
  - 已完成：`src/modals/GameLifecycleModals.jsx`
  - 已完成：`src/modals/FeedbackModals.jsx`
  - 已完成：`src/modals/SkillBanner.jsx`
  - 后续：`pages/HomeScreen.jsx`
  - 后续：`pages/RoomScreen.jsx`
  - 后续：继续拆分 `admin/*`
  - 后续：`modals/*`
  - `audio/*`
  - `replay/*`

- 拆分样式：
  - 已完成基础分域 CSS；后续继续细分较大的房间、弹窗、商店/设置样式，或引入明确的 CSS module/组件样式约定。

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
- 主界面默认 BGM 使用已可无缝循环的单文件曲目 `main_bgm.ogg`。
- 对弈常规 BGM 使用 `shanjifu_intro_once.ogg` + `shanjifu_loop.ogg`。
- 角色技能 BGM 当前配置：达妮娅使用 canonical `denia-skill-default`（`bgm_*`），西格莉卡使用 `koimoon_132_intro_no_fadein_2p5s.ogg` + `koimoon_132_micro_loop.ogg`，爱弥斯使用 `lhl_*`，猪小仙使用 `matoya_*`，娜波摩使用 `busizhe_*`。BGM resolver 会先把历史 `danea` 规范化为 `denia`，再查找角色技能 BGM。
- BGM 优先级为：角色技能 BGM > 对弈常规 BGM > 主界面 BGM。
- 角色释放技能后，后续 BGM 保持为该角色专属 BGM，直到对局结束；后触发的角色技能 BGM 会覆盖先触发的角色技能 BGM。
- 匹配成功倒计时、对局结果弹窗、对局房间的结束阶段会停止 BGM；如果用户从已结束棋谱回放退出到大厅，前端会清空回放房间快照，BGM resolver 以当前 `view = home` 为准恢复主界面 BGM。在线玩家从已结束房间主动退出回大厅时，前端也会把该房间号记为已处理结果，防止房间 5 分钟回收前的残留终局快照继续触发结果弹窗状态并压住大厅 BGM。
- 持久登录自动进入大厅时可能没有用户手势，浏览器会继续挂起 `AudioContext`；`BackgroundMusic` 会在 resume 后检查上下文状态，如果仍为 suspended，就注册 pointerdown / keydown / touchstart 一次性重试，保证首次点击、按键或触摸后恢复大厅 BGM。
- `BackgroundMusic` 使用 Web Audio 播放，预解码 intro/loop buffer，并在同一 `AudioContext` 时间线上调度 intro 到 loop，避免 HTMLAudio 切文件造成明显卡顿。
- 音量变化只调节 gain，不改变播放 identity；因此主音量或 BGM 音量调到 0 后再恢复，不会导致 BGM 从头播放。
- 默认音频设置为 `master: 80`、`bgm: 50`、`sfx: 80`、`voice: 80`，保存于 `localStorage` 的 `sigrika-audio-settings`。

### Effects And Replay Audio

- 匹配成功播放 `match-success.mp3`，同时停止 BGM。
- 对局结果弹窗出现时停止 BGM；胜方播放 `result-victory.mp3`，负方播放 `result-defeat.mp3`，和棋不播放结果音效。房间玩家还会按当前用户本局结果触发出战角色的 `result-victory`、`result-defeat` 或 `result-draw` 系统语音；无效局不弹结果弹窗，因此不触发结果音效或结果角色语音。棋谱回放模式不会弹结果弹窗，也不会触发结果音效或结果角色语音。
- 普通落子播放 `godown_clear.ogg`。
- 提子动作播放 `go_capture_clear.ogg`。
- 隐藏手暴露播放 `hidden_hand_reveal.ogg`；回放下一步遇到带有隐藏手暴露标记的历史动作时也会播放该音效。
- `boardAudio.js` 根据历史记录中的当前棋盘动作判断落子音或提子音；回放界面点击“下一手”时也会按该步历史播放对应音效，弃手不会重复播放上一手棋盘音效。
- 落子、提子、隐藏手暴露、匹配成功和结果音效均走 `sfx` 音量通道。
- 读秒 10 到 1 秒倒计时通过 `playSystemVoice(countdown-N)` 播放角色语音或 TTS，超时时语音播报“超时”，不会播报“还剩0次读秒”。

### Skill Voice

- 角色技能语音配置集中在 `CHARACTER_SKILL_VOICES`。
- 当前已配置：西格莉卡技能发动使用 `sigrika_skill_cast.ogg`，爱弥斯使用 `aemeath_skill.ogg`，猪小仙使用 `baconbits_skill.ogg`。
- `characterVoiceMapForSkill` 可将现有技能语音桥接为角色 `systemVoices` 的 `skill-cast` 事件映射。
- 角色出战按钮会触发 `sortie` 角色语音事件；当前达妮娅和西格莉卡预留路径分别为 `denia_sortie.ogg` 与 `sigrika_sortie.ogg`。
- `SkillBanner` 出现时同步触发技能语音，同一个 banner id 只播放一次。
- 技能语音走 `voice` 音量通道。
- `playVoiceSound` 使用 Web Audio 播放链：source -> RMS normalization gain -> dry/wet reverb mix -> voice gain -> destination。
- 语音播放开始时会通知 BGM ducking 状态，背景音乐临时压到基础 BGM 音量的 35%；语音结束后约 180ms 平滑恢复，避免角色语音被角色 BGM 盖住。
- `voiceEffects.js` 当前预设为轻量空灵混响：`boost: 1.35`、`wet: 0.28`、`dry: 0.9`、`reverbSeconds: 1.6`、`reverbDecay: 2.2`、`preDelaySeconds: 0.035`，并以 `targetRms: 0.12`、`minNormalizationGain: 0.4`、`maxNormalizationGain: 2.4` 做运行时语音响度一致化。
- 如果 Web Audio 或资源加载失败，技能语音会回退到普通 `Audio` 播放，仍应用 1.35 倍 voice 增益上限。

### System Voice

- 系统语音事件集中在 `src/shared/systemVoices.js`，通过 `resolveSystemVoice` 解析。
- 当前默认走 TTS 文本；如果角色配置了 `systemVoices[event]`，则优先播放对应音频。
- 已预留事件：`game-start`、`skill-cast`、`sortie`、`byo-yomi-start`、`byo-yomi-periods`、`byo-yomi-period-2`、`byo-yomi-period-1`、`byo-yomi-countdown`、`countdown-N`、`timeout`、`result-victory`、`result-defeat`、`result-draw`、`house-detail`。
- 对局正式开始时，服务端写入 kind 为 `game-start` 的系统消息，前端据此播放“对局开始”语音。
- 进入读秒、剩余读秒次数和超时播报已经接入事件化 resolver；剩余 2/1 次读秒使用显式 `byo-yomi-period-2`、`byo-yomi-period-1` 事件，10 到 1 秒倒计时使用 `countdown-10` 到 `countdown-1` 角色语音事件。

### Static Audio Assets

- BGM 和效果音位于 `public/assets/music/`。
- 技能语音位于 `public/assets/voice/`。
- 转码用临时工具目录 `.tmp/` 已加入 `.gitignore`，不应提交。

### Audio Technical Debt

- Runtime audio playback now lives in `src/audio/playback.jsx`, but that module still owns several playback concerns (`BackgroundMusic`, board effects, result sounds, skill voice effects, system voice/TTS). Future cleanup can split it by BGM/effects/voice if the feature set grows.
- Voice playback uses a shared module-level Web Audio context when available; regular voice playback, cached playback, and preload decoding all reuse that context. Future tuning may still need more explicit lifecycle cleanup and browser autoplay handling.
- Background music ducking is runtime-only and follows active voice playback count; it is covered by deterministic helper tests, but not by a browser-level audio graph test.
- Runtime voice loudness normalization uses decoded `AudioBuffer` RMS statistics and clamps correction gain between 0.4 and 2.4, so authored assets can remain unchanged while character voices play at a closer perceived level.
- Voice reverb now uses a deterministic generated impulse. If authored reverb tails become important, replace it with a static impulse asset.
- BGM assets are committed directly under `public/assets/music/` and increase repository size. If the soundtrack grows, consider Git LFS, an asset CDN, or a manifest-driven asset pipeline.
- Music ownership, purchase availability, and player selection are represented in configuration shape but not yet backed by persisted music inventory/settings UI.
- Character skill voice configuration is static in `CHARACTER_SKILL_VOICES`; future admin-configurable voices would need schema/API/upload support and cache invalidation rules.
- No browser-level automated test currently verifies actual audio playback, Web Audio graph routing, or autoplay fallback behavior; existing coverage focuses on deterministic helper logic.
- Countdown character voice assets are opportunistically preloaded and decoded into a module-level Web Audio buffer cache while the active player is in byo-yomi. Cached playback reuses the same dry/wet reverb voice chain as regular voice playback, and failures fall back to the existing voice path without blocking timers.

## Result Rewards And Room UI

This implementation follows `docs/superpowers/specs/2026-05-19-result-home-voice-room-design.md` and `docs/superpowers/plans/2026-05-19-result-home-voice-room.md`.

## 2026-05-27 Room Persistence Update

- Active and finished rooms are now snapshotted to the SQLite `PersistedRoom` table. The snapshot stores game state, players, clocks, chat, deadlines, close time, and candy-effect settlement state, but does not persist live Socket.IO socket ids or spectators.
- Server startup calls `restorePersistedRooms(io)` after the socket layer is installed. Restored rooms restart their clock/opening/deadline/close timers, and players can reconnect through the existing `room:resume` flow.
- When a player socket disconnects, the room clears that player's `socketId` and records `disconnectedAt`. If both players are absent from an unfinished room for 5 minutes, the server marks the game as `invalid` with reason `empty-room`, skips `GameRecord` creation, deletes the persisted room, and removes the room from memory.
- Finished rooms keep the existing 5-minute review window. When that timer closes the room, the server emits `room:closed` with `message: "房间因空置5分钟以上而被关闭"` so the frontend can show the required top toast before returning to the lobby.
- `src/main.jsx` handles `room:closed` payloads, clears the remembered room code, resets room UI state, and displays the payload message when present.

## 2026-05-29 Account Session Update

- Login sessions are tracked in the `LoginSession` database table through `server/loginSessions.js`; online socket membership is coordinated separately by `server/onlineSessions.js`. JWTs include a `sid` claim and both HTTP auth and Socket.IO auth reject revoked or expired session ids.
- `/api/auth/login` and `/api/auth/register` create a database login session, return an access token, and set a `sigrika_refresh` `HttpOnly` cookie. In production the cookie also uses `Secure`.
- `/api/auth/refresh` reads the refresh cookie, validates and rotates the stored refresh token hash, and returns a fresh access token plus public user payload. `src/main.jsx` calls this on startup, and `src/api/client.js` retries one authenticated JSON request or character portrait upload after a successful refresh when an HTTP 401 is encountered.
- If `/api/auth/login` receives correct credentials for an account that currently has an online Socket, it returns HTTP 409 with `code: "already_logged_in"` and the message `当前账号已登录了，确定继续登录吗？`. Persisted refresh sessions without an online Socket do not trigger this prompt and are replaced by the new login.
- `src/auth/AuthScreen.jsx` detects that conflict, shows the browser confirmation dialog, and retries login with `forceLogin: true` only after confirmation.
- Forced login revokes previous database sessions, emits `account:logged-out` to existing sockets for that user, disconnects them, and then creates a new session for the confirmed login.
- Socket disconnects only change online/offline presence and room disconnect state. They no longer revoke login sessions, so page refreshes, temporary backend restarts, or network hiccups do not force users back to the login screen as long as the refresh cookie remains valid.

- Result rewards:
  - The result modal displays the current player's rating and coin deltas.
  - Rating deltas are win `+20`, loss `-20`, draw `0`.
  - Coin deltas are win `+50`, loss `+20`, draw `0`.
  - Decisive game persistence uses `resultRewardDelta`; winner records gain coins and rating, loser records gain consolation coins and lose rating. Draws remain record-only for rewards.
- Home layout:
  - The home screen prioritizes "空想对局" as the largest primary action.
  - "棋舍" is a secondary profile/character entry with the selected portrait vertically centered beside player info.
  - 大厅标题与副标题独立于右上角操作区，居中显示在中上方；副标题和标题保持错位排版并使用更大的字号填充顶部视觉空间。
  - "商店", "排行榜", "观战", and "好友" are compact circular utility icon buttons anchored under the house card; each button shows only icon plus title. Admin management is available only to admins and appears as a labeled circular button below the top-right settings button, right-aligned with the logout/settings action stack.
  - Narrow utility overflow is contained inside the utility grid instead of expanding the whole page.
  - The friend button opens a social modal backed by `/api/social` with "好友" and "黑名单" tabs. Each list row shows online state, common character portrait, username, rank, rating, and a gear action button. Friend actions are "详细信息", "密谈", "对局申请", and "解除好友"; blacklist actions are "详细信息" and "从黑名单解除". Clicking a gear action expands a small horizontal action row directly below that user row; clicking the same gear again collapses the row. The tab bar also includes a username search box plus search icon button; usernames are limited to Chinese, English, numbers, and underscores up to 16 characters. A successful search opens the shared profile modal, while missing-user and relationship-action messages use the page-level top toast.
  - "详细信息" uses a shared independent modal with common character portrait, username, record, rating, rank, per-character record rows, a "对局回放" button, and bottom-right relationship actions "加为好友" and "加入黑名单". Relationship actions close the profile modal after success, switch the social list to the corresponding tab, and show a page-level top toast. Replay rows are loaded lazily only after that button is clicked, displayed in a fixed-height scrollable dialog, and each row can open an individual public replay. The same profile card is reused by the room member popover, but room/observer profile cards disable "对局回放" to avoid jumping into replay while inside a live room.
  - Profile replay dialogs include the viewed user's username in the title. The dialog shell keeps the title and close button fixed while only the replay list scrolls.
  - "解除好友" and "从黑名单解除" use a shared confirmation panel and persist through `UserRelationship`. Adding a friend automatically removes/overwrites blacklist state for that target, and adding to blacklist overwrites friend state.
  - "对局申请" is enabled only for online users who are not currently playing. The server tracks connected sockets and active room players; `duel:request` first checks whether the target has blacklisted the requester, silently suppressing `duel:incoming` for that target and sending the requester a normal delayed rejection. Otherwise it delivers `duel:incoming`, `duel:respond` accepts/rejects the request, and acceptance creates a direct room through the same match-found/opening flow as normal matchmaking. Timeout or rejection emits a red danger notice to the requester.
  - The house rank stat includes a hover help icon explaining that rank is derived from rating, 1000 points is 1-dan, each 100 points changes one rank, and 9-dan is the maximum.
- Character voice categories:
  - Character voice events are explicit: `game-start`, `skill-cast`, `sortie`, `byo-yomi-start`, `byo-yomi-period-2`, `byo-yomi-period-1`, `countdown-10` through `countdown-1`, `timeout`, `result-victory`, `result-defeat`, `result-draw`, and `house-detail`.
  - Recommended upload naming for full character voice packs uses one folder per character, for example `C:/codex/musicsour/cVoice/denia/`. Prefer OGG files with stable English scene keys: `match_start.ogg`, `skill_cast.ogg`, `sortie.ogg`, `byoyomi_start.ogg`, `byoyomi_remaining_2.ogg`, `byoyomi_remaining_1.ogg`, `countdown_10.ogg` through `countdown_01.ogg`, `timeout.ogg`, `result_win.ogg`, `result_loss.ogg`, `result_draw.ogg`, and `house_detail.ogg`. Avoid Chinese characters, spaces, and punctuation in filenames so Windows paths, frontend asset references, and build tooling stay predictable.
  - Denia now has a full AI voice pack under `public/assets/voice/denia_*.ogg`, converted from `C:/codex/musicsour/cVoice/denia/*.wav`. The pack covers `game-start`, `skill-cast`, `byo-yomi-start`, `byo-yomi-period-2`, `byo-yomi-period-1`, `countdown-10` through `countdown-1`, `result-victory`, `result-defeat`, and `result-draw`; `skill_cast.wav` is exported as `denia_skill_cast.ogg`. The sortie voice slot is reserved as `denia_sortie.ogg`.
  - Denia countdown voice assets `denia_countdown_10.ogg` through `denia_countdown_1.ogg` keep the stable countdown event filenames used by the byo-yomi resolver, so refreshed voice packs can replace the existing OGG files without changing event wiring.
  - Sigrika now has role voice assets under `public/assets/voice/sigrika_*.ogg`, converted from `C:/codex/musicsour/cVoice/sigrika/*.wav`. The pack covers `game-start`, `skill-cast`, `byo-yomi-start`, `byo-yomi-period-2`, `byo-yomi-period-1`, `countdown-10` through `countdown-1`, `result-victory`, `result-defeat`, and `result-draw`; `skill_cast.wav` is exported as `sigrika_skill_cast.ogg`, while `byoyomi_start.wav` and `byoyomi_remaining_1.wav` refresh `sigrika_byoyomi_start.ogg` and `sigrika_byoyomi_remaining_1.ogg`. The sortie voice slot is reserved as `sigrika_sortie.ogg`.
  - Built-in skill voice assets are bridged into each character's `systemVoices.skill-cast` map at runtime, so skill banners use the same `resolveSystemVoice` route as other role voices.
  - Baconbits now has role voice assets for `game-start`, `byo-yomi-start`, `byo-yomi-period-2`, `byo-yomi-period-1`, and `timeout`; the period 2 and period 1 events reuse `baconbits_byo_yomi_periods.ogg`.
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
  - Text-only operation hints render below the opponent info area, to the left of the main board action area.
  - Scoring result review shows a formatted calculation breakdown. Black result is `black stones + territory - komi - own skill cost + opponent skill cost`; white result is `white stones + territory + komi - own skill cost + opponent skill cost`. The raw difference is `black result - white result`; the displayed winning margin is `abs(raw difference) / 2`, formatted as whole/fraction stones.
- Finished-game portrait badges:
  - Decisive finished games show transparent outline badges overlapping the portrait lower-right: red text/red ring for "胜", black text/black ring for "负".
  - Draw results show no win/loss portrait badge.
  - Invalid results show no win/loss portrait badge even when a winner color is present in the result payload.
- Responsive direction:
  - The room player/board/side layout keeps its three-column structure across desktop and tablet widths; opponent and self info columns use the same width.
  - Narrow room screens use practical column minimums and controlled horizontal scrolling instead of switching to a stacked layout.
  - Tablet/mobile overrides do not reshape room player cards, preserving the vertical portrait, digital timer, and action hierarchy inside the fixed three-column room layout.

## Frontend Module Extraction Update

This update reduces the highest-payoff frontend coupling without changing user-facing behavior.

- Character display helpers now live in `src/shared/characterDisplay.js`.
  - `findCharacter` centralizes DB character plus built-in fallback merging.
  - `withCharacterSystemVoices` centralizes the runtime bridge from skill voice assets into character `systemVoices`.
- System voice playback now lives in `src/audio/systemVoicePlayback.js`.
  - `playSystemVoice` resolves role/system voice events, plays preloaded audio when available, and falls back to TTS text.
  - `src/main.jsx` no longer owns the system voice resolver/playback wrapper.
- Low-coupling modal components have been extracted from `src/main.jsx` into `src/modals/`.
  - `MessageBoardModal.jsx`
  - `SettingsModal.jsx`
- `WatchModal.jsx`
- `LeaderboardModal.jsx`
- `HouseModal.jsx` owns the player manual/profile modal, owned character grid, decoration application controls, personal replay dialog, and per-character record dialog.
- `ShopModal.jsx` owns the 扎希拉商店 modal, category tabs, fixed 8-slot item grid, purchase flow, item ownership state, and shop mascot/item preview rendering.
  - Its non-component constants and pure helpers live in `src/modals/shopModalHelpers.js`, so the component module keeps a Fast Refresh-compatible export shape.
- `GameLifecycleModals.jsx` owns the matching, match-success countdown, opening color prompt, and result/reward modals. It also exposes pure countdown, color-label, and signed-delta helpers covered by `GameLifecycleModals.test.js`.
  - `FeedbackModals.jsx` owns the generic confirm modal, toast stack, and direct-duel request banner. Its duel countdown/progress helpers and toast queue limiting are covered by `FeedbackModals.test.js`.
  - `SkillBanner.jsx` owns the skill burst overlay and skill-cast voice trigger. The helper that prevents duplicate or empty voice playback is covered by `SkillBanner.test.js`.
  - `StoneDecorationPreview.jsx` owns reusable black/white decoration previews for house and shop surfaces.
- Room view helpers now live in `src/room/roomView.js`.
  - The module owns replay view reconstruction, room member list shaping, coordinate labels, board line geometry, preview eligibility helpers, scoring term text, and timer/message formatting helpers.
  - These helpers are covered by `src/room/roomView.test.js` so runtime-only room view dependencies are easier to catch.
- Low-coupling room UI components have started moving from `src/main.jsx` into `src/room/`.
  - `RoomScreen.jsx` owns room-level derived state, replay/spectator projection, room header game info, per-room sound effects, skill/opening modals, and layout composition for the full battle screen.
  - `TimeBar.jsx` owns the player timer/digital display panel.
  - `ChatBox.jsx` owns room chat rendering, scroll-to-bottom behavior, and chat submission UI.
  - `PlayerInfo.jsx` owns player portrait, rank/rating tags, timer, captures/cost display, result badge, and skill detail popover.
  - `RoomPeopleList.jsx` owns the fixed-height room member list and placeholder member action popover.
  - `ActionBar.jsx` owns spectator replay controls, normal player actions, test tool buttons, and phase-aware decision bars.
  - `ScoringBreakdown.jsx` owns the formatted counting formula/result breakdown used by hints and result-review controls.
  - `Board.jsx` owns board grid rendering, coordinate labels, stones, move numbers, scoring marks, skill effect markers, decorated stone images, and board point events.
  - `Board.jsx` marks first-line board grid segments so the visual "一路" can render bolder than internal lines. Board grid strokes are intentionally heavier for readability, with both normal and first-line strokes scaled up together.
  - `OperationHint.jsx` owns phase-aware text hints and compact scoring breakdown display under the opponent-side panel.
- Current remaining frontend debt:
  - `src/main.jsx` now mainly owns App-level auth, Socket.IO connection creation, page routing, and modal orchestration. It is still sizable but no longer owns the room UI tree; frontend socket event handlers live in `src/app/socketHandlers.js`, and duel request state lives server-side in `server/duelRequests.js`.
  - `src/room/RoomScreen.jsx` is a better-contained but still dense room container; future extractions can split room sound/effect hooks, replay/spectator projection helpers, and room action handlers.
  - Server room view serialization now lives in `server/roomView.js`, item effect cleanup lives in `server/roomItemEffects.js`, room-user reward application lives in `server/roomRewards.js`, room snapshot persistence lives in `server/roomStatePersistence.js`, and clock timing calculation lives in `server/roomClockTiming.js`, so `server/rooms.js` can focus more narrowly on real-time room lifecycle, actions, broadcasts, and persistence triggers.
  - `src/admin/AdminConsole.jsx` has started splitting its shell into `src/admin/AdminShell.jsx`; its tab bodies remain a high-value follow-up target alongside `src/shared/game.js` 中尚未拆出的规则执行/技能执行/数子段落, the remaining action/scoring flow inside `server/rooms.js`, and large style files.

## Recent Home, Shop, And Board UI Adjustments

- The former home/house entry is now presented to players as “部员手册”; the underlying profile, character, decoration, and personal replay functions are unchanged.
- The home match description is “13路，数子规则，黑贴2又3/4子，用时5分钟30秒3次”.
- The home player plaque uses a light rank/rating tag with dark text. Admin management uses the same circular icon-plus-title layout and sizing pattern as the home utility buttons.
- The shop keeps fixed 8-item pages, but its visual grid now adapts to available width and height; the item area scrolls inside the modal while tabs and pagination stay visible, with a compact landscape layout for short viewports.
- Friend list action buttons expand as a full-width horizontal action row with evenly aligned button columns.
- The house stats for rating and coins use the same help-tip pattern as rank: rating explains +20/-20/0 changes; coins explain +50/+20/0 rewards.
- Counting request is disabled while the board has no stones.
- Main-time timer digits use a gray display color, while byo-yomi states keep their warning colors.
- Board grid strokes are heavier overall; first-line grid segments are marked separately and rendered much thicker than internal lines. Skill targeting highlights use a gradient glow instead of a solid outline. Stones affected by skill states use darker, higher-opacity green/purple halo rings so the effect reads clearly against the wooden board.
- Latest room/home refinements:
  - The home player plaque rank/rating chip uses a light background with dark text again, while the admin-only management button remains a green circular icon-plus-title control aligned with the home user plaque.
  - The home screen uses a compact anime game-menu layout: the top strip contains a larger site title, the fixed subtitle `连罗伊人的都爱玩的智力游戏`, the gray-white online-count pill, and settings/message/logout/admin actions; the footer strip shows the site title, `Copyright ©KURO GAMES. ALL RIGHTS RESERVED.`, and `浙ICP备2026035038号` as evenly spaced items. The middle stage is an unframed fixed-ratio coordinate surface (`1480 / 620`) that scales as one piece instead of letting the two large image buttons fight the page flow. Desktop keeps the original wide-stage rule with a `1200px` minimum, `503px` minimum height, and `1920px` maximum width; phone landscape uses a smaller `960px` by `402px` minimum stage. The home app shell uses `/assets/home/multipurpose-classroom-bg.jpg` as a fixed full-viewport background, then layers blur, saturation, translucent gradients, and glassy top/footer strips over it for a frosted classroom feel. The player plaque, `部员手册`, `空想对局`, and circular utility dock are absolute-positioned by percentage inside that stage; the player plaque is slightly larger with wider internal spacing, shows rank and rating on one line, shares the utility dock's left edge, `部员手册` is offset slightly right/down from the dock edge, and `空想对局` is nudged up by a few pixels while remaining the dominant right-side entry. The manual and match buttons use their source image aspect ratios as full-size clickable boxes so the visible artwork stays inside the hover/click target. The match entry's hover/focus popup in the top-right carries both the current matchmaking count and one rule item per line: `路数：13路`, `用时：5分钟30秒3次`, and `规则：黑贴2又3/4子，中国数子规则`, so new users can understand the match format without a persistent lower-left label or another modal. Phone portrait shows a dedicated `请横屏使用` guard instead of the home stage. Image-entry hover moves and rotates only the image child layer with small transform values, while a masked `::before` layer uses the same PNG alpha channel to show a solid aqua shadow translated down and right; this avoids large transparent-PNG filter/drop-shadow repaint costs while keeping the requested shadow look. The match-entry PNG has transparent borders after low-alpha background cleanup, avoiding faint square-edge artifacts on wide desktop browsers. All non-image controls share a hover/focus cue of slight upward movement, a blue outline ring, and a subtle brightness/saturation lift so users can clearly see the target they are about to choose. Utility dock buttons still do not carry a persistent shadow.
  - Incoming direct duel requests play a short synthesized doorbell SFX on the effects channel before showing the request banner.
  - The house/player manual record stat is clickable and opens a per-character record list for owned characters. Personal manual stats use the full current-user replay summary set, including black/white user ids, while leaderboard stats also use all `GameRecord` rows, so win/loss totals stay aligned even after a player has more than 30 records or changes username.
  - The house/player manual decoration picker renders owned decorations as icon-plus-status buttons with accessible labels and hover titles: decoration names stay out of the visible chip, while `应用` / `应用中` / `使用中` remains visible.
  - Player info now separates captures, skill removals ("除子"), and skill cost. Skill removals count opponent stones removed or converted by skills for the side that benefits from the removal/conversion.
  - Skill follow-up cleanup counts stones removed by skill-created no-liberty states as skill removals instead of normal captures, so "提子" remains only ordinary capture count.
- Room headers include live game context after the room number using separate chips: black player/rank, white player/rank, and current move count.
- The room number itself is rendered as a light-gray rounded chip so it reads as part of the same header metadata system.
- The first-line board grid stroke was reduced from the heaviest iteration while remaining bolder than internal lines.
- Finished rooms with `closesAt` now show a red header chip countdown such as `关闭倒计时 4:59`; the actual closure still comes from the server `room:closed` event.
- The watch entry now opens `WatchModal`, a refreshable current-room list backed by `GET /api/rooms/watch`, instead of asking the user to type a room code. Rows include room code, online participant count, black/white character portrait plus username, move count, and playing/finished status, and clicking a row joins that room as a spectator.
- The watch modal is sized for the full room list table without horizontal scrolling on desktop and keeps enough vertical space for five room rows even when the list is empty. Watch table headings and row cells are centered.
- Spectators leaving a room use the explicit `room:leave` socket event. The server removes that socket from `room.spectators`, leaves the Socket.IO room, appends a spectator-leave system message, and broadcasts the updated room so room members and the watch list no longer count that spectator.
- The leaderboard modal keeps the title area and column heading outside the scrolling region. The player rows scroll independently, and a bottom pinned row mirrors the current user's own ranking when that user appears in the leaderboard. The heading and row cells share one CSS grid template, while the heading and pinned row reserve the same end gutter as the scrollable list so Windows scrollbars do not shift the data columns away from their labels.
- `roomView.players[]` now carries `connected` and `disconnectedAt`. Player disconnects add a system notice and show a centered `断线中` badge on that player's portrait until the player reconnects or the game finishes; reconnecting appends a reconnect system notice and clears the badge.
- While an opponent is disconnected, player action controls that require opponent confirmation, currently counting and draw requests, are disabled on the client.
- Once a game is finished, room players use the same spectator role as observers in both server room views and frontend effective role handling: the action bar switches to replay/spectator controls, player-only hints/actions are hidden, and leaving the finished room clears the former player's live `socketId` from the room so watch-list online counts drop correctly.
- The game-start system voice is only played for active player views in `playing` phase. Spectators and finished-room viewers do not replay historical `game-start` messages when joining through the watch list.
- User profile cards keep the hero, aggregate stats, "角色战绩" title, and footer actions fixed inside the modal; only the character record rows scroll.
- Login/preload recovery now preserves an unfinished `room:resume` result. If the socket recovers an active room while assets are still preloading, the preload completion guard does not force the user back to the home screen.

## Lobby Stats And Blacklist Match Blocking

- The home user plaque receives live lobby stats from `lobby:stats` and shows `在线人数：[count]`; the main match button shows `匹配中人数：[count]` below its label.
- The backend matchmaking wait state is now a queue instead of a single `waitingPlayer`. `match:join` checks both users' blacklist relationships before pairing, skips incompatible candidates, and keeps all skipped candidates waiting for later compatible players.
- Direct duel requests also consult the target user's blacklist. If the target has blacklisted the requester, the target receives no incoming request; the requester receives the normal rejection event after a 3-second delay, matching an ordinary refusal without revealing blacklist state.
- Socket disconnects use a session cleanup grace window. When the last socket for a user disconnects, the account is marked offline and room disconnect handling runs immediately, but the login session is cleared only after 30 minutes unless a new socket for the same session reconnects first. This prevents browser backgrounding, network sleep, and Socket.IO transient reconnects during a game from turning into silent authentication failures and frozen room UI.
- Login conflict checks use the active online-socket index rather than the mere presence of an unexpired grace-window session. A refreshed or closed page loses its in-memory token and must log in again, but if the old socket is already gone the new login is allowed instead of showing a stale "already logged in" conflict.
- If the Node watch server restarts while a page still has a valid JWT in memory, HTTP and Socket.IO auth can adopt that token's `sid` when no active in-memory session exists for the user. Sessions that were explicitly cleared by logout, forced login, pending-login expiry, or the disconnect grace timer are revoked and cannot be adopted again.
- Restored unfinished rooms mark every persisted player without a live socket as disconnected and append missing `disconnect` system notices before room timers resume. This keeps reconnect recovery, the centered portrait `断线中` badge, chat history, and watch-list online counts consistent after server restarts.
- The frontend listens for Socket.IO `connect_error`. Authentication failures (`unauthorized` / `forbidden`) now clear local room/match state, return to the login screen, and show `登录已失效，请重新登录` instead of leaving the player on a stale board snapshot.

## Production Deployment Hardening

- Runtime security helpers live in `server/security.js`.
- `assertProductionDeployment` 在生产环境启动时执行部署配置体检：`JWT_SECRET` 至少 32 位且不能使用默认值，`PUBLIC_ORIGIN` / `SITE_ORIGIN` / `ALLOWED_ORIGINS` 至少配置一个生产域名，且所有生产 origin 必须使用 HTTPS。配置不合格时服务端会在启动阶段抛出明确错误，避免带着弱配置上线。
- `npm run check:production` 可在部署脚本或 CI 中单独运行同一套生产配置体检，不需要先启动完整服务器或连接数据库；该脚本默认按生产规则检查，即使调用方忘记设置 `NODE_ENV=production` 也不会按开发环境误通过。
- Username input is normalized server-side and must be 2-16 characters, limited to Chinese characters, English letters, numbers, and `_`.
- Password input is enforced server-side as 6-14 characters. Registration returns the exact validation issue; login returns a generic username/password error for invalid credentials or invalid credential shapes.
- Chat text is normalized server-side by removing control characters, trimming whitespace, rejecting empty messages, and capping messages at 240 characters.
- Room codes accepted by Socket.IO room operations must be exactly five digits. Board point payloads must be `x,y` coordinates within the 13x13 board.
- Express now uses `helmet` security headers, a 64 KB JSON body limit, auth-specific rate limiting, and general `/api` rate limiting.
- HTTP CORS and Socket.IO CORS use the same origin allowlist. Production origins come from `PUBLIC_ORIGIN`, `SITE_ORIGIN`, and comma-separated `ALLOWED_ORIGINS`; development additionally allows localhost ports used by Vite and the local server.
- Socket.IO connections install a per-socket event guard that rejects excessive event traffic within a short window.
- Socket.IO connections remain stable while the frontend user object changes. Before `match:join`, `duel:request`, and accepted `duel:respond` create a room, the server refreshes `socket.user` from the latest database user so the actual room character matches the current selected sortie character rather than the snapshot from initial socket authentication.
- In production, if `dist/` exists, the Node server can serve the built Vite app and SPA fallback while still keeping `/api`, `/socket.io`, and `/uploads` routed to backend behavior.
- Production uploads use `server/uploadPaths.js` to resolve the persisted upload root. `UPLOAD_DIR` can point to an absolute directory such as `/var/lib/sigrikago/uploads`; when omitted, uploads continue to default to `public/uploads`. Character portrait uploads are stored under `${UPLOAD_DIR}/characters` and remain publicly available through `/uploads/characters/...`.
- The single-server deployment guide lives in `docs/deployment.md`. It documents required environment variables, SQLite and upload-directory persistence, systemd, Nginx WebSocket proxying, HTTPS, backups, and the update flow. The guide targets the merged `master` branch for production checkout.

## Login Asset Preloading

- Frontend deployment helpers live in `src/shared/preloadAssets.js`.
- Socket.IO now connects to `window.location.origin`, so the deployed site can run behind `https://sigrika.fun` without a hard-coded localhost socket endpoint.
- Vite development proxy forwards `/socket.io` websocket traffic to the local backend, keeping the same-origin socket path usable in development and production.
- After a valid token is confirmed, the app enters a `preloading` view before the home screen.
- Fresh login enters `preloading` before the home screen, preventing the home screen from flashing before assets begin loading. Stored-token startup is intentionally disabled so refresh and browser restart return to the login screen.
- The preload step fetches non-replay runtime assets after login: all current character portraits, home and shop imagery including `/assets/home/multipurpose-classroom-bg.jpg`, Denia candy GIF portrait, stone decoration images, the Denia bubble-effect preview, common board/result/match sound effects, every configured BGM track, every configured character skill voice, and every configured character system voice. Replay lists and replay details remain lazy data requests so opening the app does not prefetch historical game records.
- Preload failures are non-blocking: failed assets are ignored so users are not trapped on the loading screen if a single optional resource fails.
- The preload screen includes a compact spinner and progress bar, with a short minimum display duration to avoid a visual flash on cached loads.

## Feedback Messages

- Player feedback is persisted in the `FeedbackMessage` Prisma model, backed by the `202605250001_add_feedback_message` migration.
- Logged-in users submit feedback through `POST /api/feedback`; the server stores `userId`, current `username`, normalized `content`, and `createdAt`.
- Feedback content strips control characters, trims whitespace, rejects empty submissions, and caps content at 400 characters.
- The home and room message-board modal calls the feedback API. On success it closes the modal and shows a green top toast: `感谢您的反馈！`.
- The message-board textarea uses the same 400-character limit and displays the remaining character count below the input.
- Admins can view the latest 100 feedback messages through `GET /api/admin/feedback`.
- The admin console includes a `留言反馈` tab that displays submit time, username, and full feedback content with wrapping for longer text.
## Realtime Performance Notes

- Room clock ticks no longer use the full `room:update` payload during normal play. `server/rooms.js` emits a lightweight `room:clock` event once per second with `roomCode`, `activeColor`, `serverNow`, and each player's current `time`.
- Full `room:update` remains the authoritative synchronization path for match found, room join/resume, moves, skills, chat, phase changes, scoring, draw/counting flows, and timeout transitions.
- `server/roomView.js` builds only the needed board projection for player viewers. Spectators still receive both black and white projections through `gameViews`, but players receive only their own visible board state.
- `server/serverLifecycle.js` guards local development startup/shutdown: occupied port 3001 now gets an explicit `EADDRINUSE` message, and `SIGINT` / `SIGTERM` close the HTTP server plus Prisma before process exit.
- The frontend merges `room:clock` through `src/app/roomClock.js`, updating only changed player timer objects while preserving the existing `room.game` object reference.
- `src/room/Board.jsx` is memoized with a board-specific prop comparison so timer-only updates can refresh player clocks without re-rendering the 13x13 board.
- `src/room/PlayerInfo.jsx` is memoized with a player/game-slice comparison so room clock ticks only re-render the player panel whose timer or relevant game slice changed, which is especially important when item effects swap portraits to animated assets.
- `src/app/roomUserSync.js` merges the current user from room payloads by comparing only fields present in the room user payload, rather than stringifying the whole current user. This keeps item/effect synchronization cheap as the local user state gains more client-only fields.
- `src/shared/gameBoard.js` resolves standard board point ids by direct row-major index before falling back to id search. This keeps capture, liberty, territory, skill, and replay logic from repeatedly scanning the full point array on normal 13x13 states; `src/shared/game.js` re-exports the helper for existing callers.
- `collectGroup` uses a cursor-based breadth-first queue instead of `Array.shift()`, avoiding repeated array reindexing during liberty/capture checks.
- Dead-stone expansion and territory flood-fill use the same cursor-based queue pattern, reducing extra array churn during scoring and result review.
