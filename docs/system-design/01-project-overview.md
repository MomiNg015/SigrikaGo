# 项目总览与功能边界

本文记录 SigrikaGo 的整体目录、核心模块和已实现能力。入口文档只保留阅读导航；具体维护时优先更新本分篇或其它对应分篇。

## 维护要点

- 新增顶层目录、主要模块或玩家可见功能时，同步更新本分篇。
- 只涉及资源、主题、音频、移动端、实时性能等专项内容时，更新对应专项分篇即可。
- 保持中文描述为主；代码路径、事件名、模型名保留原文。

## 原始总览记录

本文档基于当前代码库静态分析生成，目标是方便后续维护者和 AI 继续接手。未在代码中确认的内容会标注为“待确认”。

## 1. 项目目录结构说明

```text
SigrikaGo/
  .agents/                    # Trellis project-scoped reusable AI workflow skills
  .codex/                     # Trellis Codex hook and subagent configuration
  .trellis/                   # Trellis workflow, task, workspace journal, and spec files
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
    authRoutes.js              # /api/auth HTTP route boundary
    commerceRoutes.js          # authenticated shop purchase and item inventory route boundary
    playerRoutes.js            # /api/me player HTTP route boundary
    publicRoutes.js            # public/lobby HTTP route boundary
    replayRoutes.js            # /api/replays player replay HTTP route boundary
    socialRoutes.js            # /api/social and public user profile HTTP route boundary
    socketAuth.js              # Socket.IO JWT 鉴权与角色解析
    socketChatEvents.js        # Socket.IO room chat event registration
    socketDisconnectEvents.js  # Socket.IO disconnect cleanup event registration
    socketDuelEvents.js        # Socket.IO direct-duel event registration
    socketGameEvents.js        # Socket.IO gameplay/counting/draw/scoring event registration
    socketGuards.js            # Socket.IO per-socket event guard
    socketMatchEvents.js       # Socket.IO matchmaking event registration
    socketRoomEvents.js        # Socket.IO room connection/resume event registration
    staticAssets.js            # production Vite asset hosting and SPA fallback
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
    main.jsx                   # React 浏览器挂载入口
    app/
      App.jsx                  # React 单页应用组合根、Socket 状态与页面级弹窗编排
      AppRoutes.jsx            # 顶层路由编排
      AppOverlays.jsx          # 顶层弹窗与 toast 编排
    api/
      client.js                # 前端 HTTP JSON、后台 API、上传请求封装
    auth/
      AuthScreen.jsx           # 登录/注册界面
    admin/
      AdminConsole.jsx         # 后台管理界面与后台 CRUD 组件
    home/
      HomeScreen.jsx           # 大厅首页布局、匹配入口、履历/部员手册入口和工具入口
    room/
      RoomScreen.jsx           # 对局页容器，编排棋盘、玩家信息、聊天、房间成员、行动区和房间级音效
    styles.css                 # CSS 入口文件，按域导入 styles/*.css
    shared/
      game.js                  # 13 路围棋规则、技能、数子、回放核心逻辑
      gameGroups.js            # 棋子连通块与气的遍历 helper
      gameScoring.js           # 数子状态、死子/空点标记与终局计分
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
  - React SPA 的浏览器挂载入口，只导入全局样式并把 `src/app/App.jsx` 渲染到 `#root`。

- `src/app/App.jsx`
  - 应用组合根。
  - 负责登录态、Socket.IO 生命周期、顶层页面切换、匹配/对局结果/商店/好友等页面级弹窗编排，并挂载后台管理入口。
  - 对局页已经下沉到 `src/room/RoomScreen.jsx`，`App.jsx` 不再直接持有房间 UI 子树。
  - 通过 `src/api/client.js` 调用 HTTP API，通过 `socket.io-client` 连接实时对局。

- `src/auth/AuthScreen.jsx`
  - 登录/注册展示组件。
  - 注册模式显示“确认密码”输入框；前端会先校验两次密码一致，再提交注册请求。用户名、密码和确认密码规范作为输入框 placeholder 展示，用户输入后隐藏；字段失焦或提交时才在对应输入框下方显示错误。
  - 调用 `src/api/client.js` 完成认证请求，并通过 `onAuth` 回写 token 与用户信息。

- `src/home/HomeScreen.jsx`
  - 大厅首页展示组件。
  - 负责渲染来自站点公开配置的大厅标题/副标题、匹配主入口、履历/部员手册入口、观战/排行榜/商城/后台管理工具入口，并把可配置 footer 作为 `main.home-screen` 后方的 HUD sibling 渲染。

- `src/room/RoomScreen.jsx`
  - 对局页容器组件。
  - 编排房间级派生状态、回放/观战视角、移动/桌面布局选择、确认弹窗、开局提示、技能横幅和房间级音效。
  - 导出 `roomGameInfoForPlayers` 等房间标题辅助逻辑，便于在不挂载完整对局页的情况下单测关键展示格式。
- `src/room/RoomBattleStage.jsx`
  - Owns the battle-stage JSX: opponent panel, board column, action bar, self panel, room member list, operation hint, and chat placement. This keeps `RoomScreen.jsx` from directly owning the full three-column battle tree.

- `src/admin/AdminConsole.jsx`
  - 后台管理界面模块。
  - 作为后台管理的数据路由容器，负责按 tab 拉取数据、维护选中用户编辑抽屉、转发保存/刷新回调和显示后台错误。
  - 具体 tab 已拆到 `src/admin/AdminOverview.jsx`、`AdminOperations.jsx`、`AdminUsers.jsx`、`AdminCharacters.jsx`、`AdminShopItems.jsx`、`AdminDecorations.jsx`、`AdminSiteSettings.jsx`、`AdminFeedback.jsx`、`AdminAudit.jsx`；共享后台展示零件和 helper 位于 `adminComponents.jsx`、`adminFormatters.js`、`adminUserDrafts.js`。
  - `AdminOverview` 是后台默认“今日简报”，强调可读状态、分级解读和下一步动作；`AdminOperations` 是桌面端运营分析页，使用轻量条形图、分层卡片和经济/玩法摘要支撑长期趋势判断，而不是把复杂 BI 表格放在第一屏。
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
  - 集中维护最近玩家房间号的 localStorage key、恢复请求 payload，以及已结束房间恢复为结果弹窗时需要触发的状态变更；如果同一房间结果已经被对局者关闭，后续 `room:resume` 必须保留 dismissed 状态，避免有效对局结果弹窗重复出现。

- `src/app/roomUserSync.js`
  - 前端房间视图中的当前用户状态同步模块。
  - 当 `match:found`、`room:update` 或结果恢复携带房间玩家 payload 时，会把当前登录用户对应的 `player.user` 合并回全局 `user`，确保糖果效果、金币、出战角色等状态在结算广播后立即刷新。
  - 合并结果与当前用户内容一致时会保留原对象引用；主 Socket 连接只依赖 token 与用户 id，不会因为糖果效果、金币等资料刷新而重建连接，避免玩家房间 `socketId` 与前端当前连接脱节。
  - `room:resume` 返回的已结束结果快照只用于断线玩家补看结果弹窗，不会把快照中的旧金币、积分、段位或战绩合并回当前登录用户状态。

- `src/app/socketHandlers.js`
  - 前端 Socket.IO 事件处理器模块。
  - 集中安装并处理 `match:*`、`room:*`、`duel:*`、`error:toast` 和 `account:logged-out` 事件，把房间恢复、匹配过渡、轻量棋钟、约战提示和账号踢下线的状态变更从 `src/main.jsx` 中移出，便于单元测试和后续 hook 化。

- `src/app/gameSocket.js`
  - Centralizes Socket.IO client creation for the game connection and binds the installed socket handlers with the room resume request builder. `src/app/App.jsx` still owns the React lifecycle boundary, but no longer wires the low-level `io(...)` call directly.
- `src/app/AssetPreloadScreen.jsx`
  - Owns the login/startup asset preloading screen UI and progress-bar percentage formatting, keeping this transient screen out of `src/main.jsx` while preserving the same loading flow.
- `src/app/AppRoutes.jsx`
  - Owns top-level route rendering for login, preload, home, admin fallback, admin console, and room screens. `src/app/App.jsx` still owns state and side effects, while route-specific JSX and room back-navigation wiring live here.
- `src/app/AppOverlays.jsx`
  - Owns global overlays and transient UI: toast stack, duel request banner, result/match lifecycle modals, house/shop/warehouse/leaderboard/watch/friends/settings/message-board modals. This keeps `src/app/App.jsx` focused on application state, socket/auth/preload effects, and cross-cutting action handlers.
- `src/app/useAppActions.js`
  - Composes app-level action hooks without owning behavior itself. Account, match/room, replay, and overlay actions live in `useAccountActions.js`, `useMatchActions.js`, `useReplayActions.js`, and `useOverlayActions.js`.
- `src/app/useCurrentUser.js`
  - Owns the current-user state updater. Current-user updates do not generate coins, rating, or rank-change toasts; game rewards stay visible in dedicated result UI and refreshed profile/plaque data.
- `src/app/useSiteSettingsState.js`
  - Owns public site-settings state, the shared startup loader, and initial refresh. `src/app/App.jsx` receives only `siteSettings`, `setSiteSettings`, and `refreshSiteSettings`.
- `src/app/useSyncedRefs.js`
  - Keeps the latest `room`, `view`, `matchSuccess`, and `audioSettings` refs synchronized for socket callbacks and preload guards.
- `src/app/useToastQueue.js`
  - Owns toast id generation, queue limiting, and removal callbacks.
- `src/app/useAppShellTheme.js`
  - Owns visual theme/effect preferences and the app-shell class calculation for player/admin themes.
- `src/app/useBackgroundMusicTrack.js`
  - Owns background-music track selection from view, room phase, skill preview, result modal state, and user-owned music choices.
- `src/app/useGameSocketConnection.js`
  - Owns the React lifecycle boundary for Socket.IO connection creation, installed game socket handlers, room resume request wiring, and audio resume signal updates.
- `src/modals/useReplayPagination.js` / `src/app/useRoomMemory.js` / `src/app/useAudioSettingsPersistence.js`
  - Own cursor-paged replay loading for resume/profile dialogs, remembered player room state, and local audio settings.
- `src/app/useAuthSession.js`
  - Owns startup refresh-cookie session recovery and the shared HTTP auth-refresh retry hook from `src/api/client.js`. It keeps the refresh promise, login reset fallback, token update, and silent startup refresh outside `src/main.jsx`.
- `src/app/useStartupPreload.js`
  - Owns the post-token `/api/me` confirmation, public character catalog load, login asset preload, minimum preload duration, site-settings refresh, and home-screen finish guard. Replay data stays lazy-loaded.
  - The preload completion guard only blocks the home transition when an active room or pending match-success room has already been recovered. It does not depend on the previous view ref, so a fresh login cannot remain on the 100% preload screen because the ref still contains `login`.
- `src/app/characterCatalog.js`
  - Loads the public character catalog through `/api/characters`, merges it with built-in fallback characters, and falls back to the local catalog on request failure. This keeps startup preloading and admin-triggered character refresh on the same path. The public catalog carries admin-managed `sortOrder`, and App-level character list views must derive display order through `characterListFromCatalog` instead of raw object insertion order.
- `src/app/roomNavigation.js`
  - Centralizes the pure navigation decision for leaving the room screen: replay exits clear the replay snapshot without emitting `room:leave`, while spectator and finished-room review exits emit `room:leave` before returning home.
- `src/app/replayOpening.js`
  - Converts a replay record snapshot into the room-screen state used by normal house replays and admin replays: room snapshot, latest replay step, cleared pending skill, and `room` view.
- `src/app/siteSettingsCatalog.js`
  - Loads public site settings from `/api/site-settings`, merges them over shared defaults, and falls back to `DEFAULT_SITE_SETTINGS` when the request fails.
  - Shares the in-flight startup settings request. Login and refresh preloading wait for this loader before switching to `home`, so the preload screen and first home render use configured loading tips, title, and subtitle instead of briefly showing defaults.
- `src/shared/game.js`
  - 共享的游戏规则引擎。
  - 负责棋盘状态、落子、提子、禁自杀、劫、弃手、认输、主动技能执行函数、隐藏手、死子标记、数子、回放重算等。
  - 该模块被前端回放逻辑与服务端房间逻辑共同使用。

- `src/shared/gameBoard.js`
  - 共享棋盘几何与点位访问模块。
  - 集中维护标准棋盘尺寸、点 id 解析/生成、棋盘点创建、快速点查找和有效邻居过滤。

- `src/shared/gameGroups.js`
  - 共享棋子连通块遍历模块。
  - 集中维护 `collectGroup()`，供落子提子、禁自杀、数子死子标记和技能处理复用；`src/shared/game.js` 保持同名转导以兼容既有调用方。

- `src/shared/gameScoring.js`
  - 共享数子与终局计分模块。
  - 集中维护 `KOMI_STONES`、数子状态创建/准备、死子组标记、空点标记、死子重置、地盘计算和最终胜负文本；`src/shared/game.js` 保持同名转导以兼容既有调用方。

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
  - 当前预留 `game-start`、进入读秒、剩余读秒次数、读秒倒计时、超时、胜/负/和结果等事件；`timeout` 只保留为状态事件，不解析角色音频或默认 TTS，避免超时时额外播放系统音频。

- `src/shared/characters.js` 与 `src/shared/characterFallback.js`
  - 定义内置角色 fallback。
  - 将后端 DB 角色与内置角色合并。
  - `characterListFromCatalog` sorts display lists by public character `sortOrder`; fallback-only characters keep builtin order after explicitly sorted records, so the member manual does not lose admin order.

- `src/styles.css`
  - CSS 入口文件，当前按 `styles/base.css`、`admin.css`、`lobby.css`、`room.css`、`modals.css`、`commerce-settings.css`、`responsive.css` 分域导入；其中 `base.css` 是 import-only 入口，具体全局基础、预加载、控件、顶栏、主页和反馈规则拆到 `styles/base/`，`admin.css` 是 import-only 入口，具体后台壳层、共享表面、角色、审计/反馈、抽卡、成就和响应式规则拆到 `styles/admin/`，`lobby.css` 是 import-only 入口，具体面板/profile、角色卡、匹配/观战入口、观战列表和手机观战回退规则拆到 `styles/lobby/`，`room.css` 是 import-only 入口，具体房间布局、玩家计时、棋盘、操作、成员浮层和聊天规则拆到 `styles/room/`，`modals.css` 是 import-only 入口，具体共享弹窗、结果/技能、履历/回放、用户资料、角色详情、手机适配和终端视觉系统拆到 `styles/modals/`。

### 后端

- `server/index.js`
  - Express HTTP API 与 Socket.IO 入口。
  - 注册公开 API、用户 API、棋谱 API、排行榜 API，并挂载 `/api/auth` 与 `/api/admin`。
  - JSON body 解析错误会通过统一错误处理中间件返回 JSON，避免前端 API helper 因 Express 默认 HTML 错误页显示“接口返回格式不是 JSON”。
  - Owns shared startup composition for HTTP routers and Socket.IO managers; startup data/schema initialization, matchmaking event registration, player `/api/me*`, personal replay `/api/replays*`, auth, and admin handler bodies live in focused modules instead of the entry file.

- `server/serverStartup.js`
  - 后端启动数据与 schema 初始化边界。
  - 依次执行内置角色 seed、内置商城 seed、默认站点设置、社交/房间持久化/登录会话/模式/抽卡 schema guard，以及配置管理员提升。
  - Exports `SERVER_STARTUP_TASK_ORDER` so startup schema/seed sequencing is an explicit, tested contract.
  - `server/serverStartup.test.js` 锁定初始化顺序，后续新增启动期 seed 或 schema guard 应优先扩展该模块。

- `server/socketChatEvents.js`
  - Socket.IO 房间聊天事件注册边界。
  - `registerChatSocketEvents()` 注册 `chat:send`；负责把消息提交给 `addChat()`，并仅在返回变更房间时广播。
  - 聊天文本规范化、消息 shape 和无效输入静默规则仍由 `server/roomChatLifecycle.js` 负责，事件注册行为由 `server/socketChatEvents.test.js` 覆盖。

- `server/socketDisconnectEvents.js`
  - Socket.IO 断线清理事件注册边界。
  - `registerDisconnectSocketEvents()` 注册 `disconnect`；负责注销在线 socket、调用 `detachSocket()`、广播变更房间，并刷新大厅统计。
  - 玩家/观战者断线状态、匹配队列清理和房间持久化规则仍由 room connection lifecycle 负责，事件注册行为由 `server/socketDisconnectEvents.test.js` 覆盖。

- `server/socketDuelEvents.js`
  - Socket.IO 约战事件注册边界。
  - `registerDuelSocketEvents()` 注册 `duel:request` 与 `duel:respond`；负责刷新 socket 用户、模式/请求字段归一化、调用 `duelRequests`，并在响应成功后刷新大厅统计。
  - 约战请求生命周期和超时/拒绝/接受规则仍由 `server/duelRequests.js` 负责，事件注册行为由 `server/socketDuelEvents.test.js` 覆盖。

- `server/socketGameEvents.js`
  - Socket.IO 对局动作、数子、求和与计分事件注册边界。
  - `registerGameSocketEvents()` 注册 `game:action`、`counting:*`、`draw:*` 和 `scoring:action`；负责把生命周期结果转换为 `error:toast` 或成功后的房间广播。
  - 具体对局规则、数子/求和/计分校验仍留在 room lifecycle 和规则模块，事件注册行为由 `server/socketGameEvents.test.js` 覆盖。

- `server/socketGuards.js`
  - Socket.IO 连接级防护边界。
  - `installSocketRateGuard()` 为每个 socket 安装 10 秒窗口、120 次事件上限的中间件；超过上限时发送 `error:toast` 并阻止该事件继续进入业务 handler。
  - `server/index.js` 只负责在连接建立时调用该 guard，窗口计数、重置和拒绝逻辑由 `server/socketGuards.test.js` 覆盖。

- `server/socketMatchEvents.js`
  - Socket.IO 匹配事件注册边界。
  - `registerMatchSocketEvents()` 注册 `match:join` 与 `match:leave`；进入匹配前刷新 `socket.user`，按黑名单过滤候选，等待时发送 `match:waiting`，离开时清理队列并刷新大厅统计。
  - `server/index.js` 只负责传入 `io`、`prisma`、匹配队列、黑名单、模式归一化和大厅统计依赖，事件行为由 `server/socketMatchEvents.test.js` 覆盖。

- `server/socketRoomEvents.js`
  - Socket.IO 房间连接/恢复事件注册边界。
  - `registerRoomSocketEvents()` 注册 `room:join`、`room:leave` 与 `room:resume`；负责房间号校验、连接/离开房间、恢复 payload 分支、viewer-specific `room:update` 和变更后的房间广播。
  - `server/index.js` 只负责传入房间生命周期、resume、校验和广播依赖，事件行为由 `server/socketRoomEvents.test.js` 覆盖。

- `server/staticAssets.js`
  - 生产静态资源托管边界。
  - `installProductionStaticAssets()` 只在 `NODE_ENV=production` 且 `dist/` 存在时挂载 Vite 构建产物和 SPA fallback；`/api`、`/socket.io`、`/uploads` 仍交给后端路由。
  - Vite hash 产物使用一年 immutable 缓存，普通资源保持 `1h` 缓存；`server/staticAssets.test.js` 覆盖挂载条件、fallback 和 hash 缓存规则。

  - Current stability-verification contract: `installProductionStaticAssets()` also mounts the same built Vite app when `LOCAL_PROD_STATIC=1` and `dist/` exists, allowing `npm run verify:stability` to serve production build artifacts locally without enabling production security guards. Vite hash outputs stay immutable; public runtime `/assets/**` resources keep short cache/ETag behavior.

- `server/authRoutes.js`
  - Auth HTTP route boundary.
  - Owns `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, and `/api/auth/logout` request handlers, including credential validation, refresh-cookie rotation/clearing, active-account conflict response, force-login session eviction, and malformed-token-tolerant logout cleanup.
  - `server/index.js` creates the shared login/session managers and mounts `/api/auth` after `onlineSessions` is available; tests touching auth route status codes, cookie behavior, forced login, refresh-session recovery, or logout cleanup should update `server/authRoutes.test.js`.
  - `/api/auth` must be mounted before broad authenticated `/api` routers. Otherwise login/register/refresh/logout can be intercepted by `authHttp` and return `请先登录` before the auth handlers run.

- `server/commerceRoutes.js`
  - Authenticated commerce HTTP route boundary for `/api/shop/:id/purchase`, `/api/items/inventory`, and `/api/items/:itemId/use`.
  - Owns route-level user id binding, item id/character id forwarding, and purchase/inventory/use error response shaping.
  - Domain behavior remains in `server/shop.js` and `server/items.js`; `server/index.js` mounts this router behind `authHttp`.

- `server/playerRoutes.js`
  - Player HTTP route boundary for `/api/me`, `/api/me/resume`, `/api/me/character`, `/api/me/decoration`, and `/api/me/music-selection`.
  - Owns player profile/history enrichment, resume room-code normalization, character/decor selection validation, and skill-music selection error shaping.
  - Exports `createCharacterSelectionData()` and `validateOptionalRoomCode()` so Socket.IO auth/resume can share the same character availability and optional-room-code contracts without duplicating helper logic in `server/index.js`.

- `server/publicRoutes.js`
  - Public/lobby HTTP route boundary for `/api/health`, `/api/characters`, `/api/shop`, `/api/site-settings`, `/api/feedback`, `/api/leaderboard`, and `/api/rooms/watch`.
  - Owns the mixed public/authenticated route mounting contract: health, characters, and site settings are public; shop catalog, feedback, leaderboard, and watch-list routes are authenticated.
  - Keeps leaderboard query projection, feedback error shaping, shop catalog user id binding, and watch-room mode filtering outside `server/index.js`.

- `server/replayRoutes.js`
  - Personal replay HTTP route boundary for `/api/replays` and `/api/replays/:id`.
  - Owns personal replay query shape, legacy mode fallback, player id response fields, and replay snapshot JSON parsing. Tests touching this route should update `server/replayRoutes.test.js` instead of matching route text inside `server/index.js`.

- `server/socialRoutes.js`
  - Social/profile HTTP route boundary for `/api/social`, friend/blacklist mutations, `/api/users/search/profile`, `/api/users/:id/profile`, and public `/api/users/:id/replays`.
  - Owns relationship route error shaping, social list refresh responses, username validation before profile search, profile mode normalization, and the public replay-list handler that intentionally stays outside auth middleware.
  - `server/index.js` mounts the router with `authHttp` and shared `statusForUser`; Socket.IO duel blocking still imports blacklist helpers directly from `server/social.js`.

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

- `server/roomGameActions.js`
  - 标准对局动作副作用模块。
  - 集中维护落子、弃手、认输成功后的房间状态写回、系统消息、读秒重置、隐藏手公开、无效局 toast、房间关闭调度和被动技能启动；`server/rooms.js` 只保留 Socket/action 入口与技能动作分发。

- `server/roomScoringFlow.js`
  - 数子、和棋与死子确认流程模块。
  - 集中维护数子申请/响应、和棋申请/响应、确认死子阶段的标记/重置/确认，以及对应系统消息、toast、结果复核计时和房间关闭调度。

- `server/roomView.js`
  - 房间视图序列化模块。
  - 根据 viewerId 判断玩家或观战者身份，生成对应颜色视角的棋盘、双视角观战数据、玩家提子/除子计数、计时、聊天和阶段 deadline。
  - 该模块把 `server/rooms.js` 中纯数据投影逻辑移出实时流程，降低房间广播和棋谱快照代码的耦合。

- `server/roomBroadcasts.js`
  - 房间 Socket 广播边界模块。
  - 集中维护 `room:update`、`room:clock`、`error:toast`、`room:closed` 的参与者遍历、viewer-specific room view 分发、轻量棋钟 payload 和持久化回调时机；`server/rooms.js` 保留“何时广播”的生命周期判断。
  - 后续如果把完整 `room:update` 迁移为 patch/reducer 事件，应优先在该模块收敛协议分发，而不是把 Socket emit 逻辑重新散回房间生命周期代码。

- `server/roomRuntime.js`
  - Room runtime adapter boundary.
  - Owns the shared runtime callbacks that wire room state persistence into room broadcasts: throttled/forced `persistRoom`, full room snapshot broadcast, and room toast forwarding.

- `server/roomPresence.js`
  - 房间参与者和在线状态边界模块。
  - 集中维护 players/spectators 合并顺序、在线人数、是否还有连接参与者、双方玩家是否全断线、观战列表玩家摘要；广播、观战列表、完成房间延迟关闭和空房关闭调度共用这些判断。
  - 后续如果扩展观战权限、重连状态、房间 patch 推送或多席位参与者，应优先扩展该模块，避免各流程重复理解参与者结构。

- `server/roomMatchmakingQueue.js`
  - 房间匹配队列边界模块。
  - 集中维护等待队列状态、按用户/Socket 去重、按模式计数、离队清理、断线清理和 `canPair` 自定义配对筛选；`server/rooms.js` 保留匹配成功后的房间创建、计时器启动和 Socket 广播。
  - 后续如果扩展段位匹配、好友黑名单、等待超时或多模式队列，应优先扩展该模块，而不是让 `server/rooms.js` 直接操作等待数组。

- `server/roomFactory.js`
  - 房间初始结构和玩家模式投影工厂。
  - 集中维护随机房号生成、黑白方随机分配、开局阶段初始状态、初始棋钟、开局倒计时字段、房间玩家结构，以及按模式把 `UserModeStats` 投影到对局内用户字段。
  - 后续如果扩展房间初始字段、更多模式、初始时间规则或房号生成策略，应优先扩展该模块，避免 `server/rooms.js` 重新承担房间对象组装细节。

- `server/roomSkillMessages.js`
  - 房间技能系统消息边界模块。
  - 集中维护技能使用文案、模板占位符替换、棋盘坐标格式化和棋子颜色标签；`server/rooms.js` 只在技能进入预览或被动技能触发时追加系统消息。
  - 后续如果扩展角色技能文案、国际化、回放显示或技能消息模板，应优先扩展该模块，避免把展示文案重新散入实时房间流程。

- `server/roomTimers.js`
  - 房间计时器账本模块。
  - 集中维护 `timerId`、`timeoutIds` 的 interval/timeout 注册、自动移除和主动清理，供开局倒计时、技能预览结算、数子/和棋/结果确认 deadline、房间关闭和空房关闭调度复用。
  - `server/rooms.js` 保留“何时调度”的业务判断，避免后续新增延迟流程时重复手写 `setTimeout` / `clearTimeout` / `timeoutIds` 清理逻辑。

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
  - `parseOwnedItemCounts()`、`normalizeOwnedItemCounts()` 和 `serializeOwnedItemCounts()` 统一处理道具库存 JSON、旧逗号分隔字符串和前端公开数组 payload；`server/items.js` 保留旧函数名 re-export 兼容既有调用方，商城购买和道具使用都复用同一套库存解析。
  - `syncStructuredUserAssets()` 会把 legacy 字段替换式同步到 `UserCharacter`、`UserDecoration`、`UserItem` 和 `UserItemEffect` 结构化表：删除 legacy 中已不存在的旧结构化行，再 upsert 当前行。商城购买、后台用户资产编辑和道具使用/消耗都会在更新 legacy 字段后调用该同步入口；对局结算清理糖果效果时使用 `structuredUserItemEffectSyncOperations()` 只同步 `UserItemEffect`，避免误碰房间 public user 中不完整的角色/库存字段。公开用户序列化合并 legacy 字段与已加载的结构化资产关系，防止结构化回填滞后时部员手册和出战接口对角色拥有状态得出不同结果。

- `server/roomRewards.js`
  - 房间结算时的内存用户奖励应用模块。
  - 将胜负积分、金币、战绩增量写回房间内存玩家，保证最终 `room:update` 能带上最新用户状态。

- `server/roomStatePersistence.js`
  - 房间内存状态与持久化快照之间的转换模块。
  - 负责清理 socket/timer 等运行时字段、生成 PersistedRoom snapshot、恢复房间运行时字段，以及按节流规则触发持久化写入。
  - 持久化房间快照写入 `snapshotVersion`，当前版本为 1；缺少版本的旧快照按 v1 读取，未来高于当前版本的快照会被拒绝恢复，避免不兼容状态进入实时房间。

- `server/roomSkillResolution.js`
  - Room skill preview lifecycle boundary.
  - Owns active-skill preview start, passive-skill preview start, `pendingSkillResolution` snapshot creation, restored delay calculation, pending-resolution scheduling, preview payload metadata, and completion after the preview delay. `server/rooms.js` decides when room actions/opening/restore paths call this boundary, while skill preview mutation, notice append, byo-yomi reset, finished-room close handoff, and broadcast-after-resolution stay centralized here. Skill preview timing and presentation gating come from `src/shared/skillPresentation.js`, covering the banner window, board effect window, per-effect Pixi/DOM layer capabilities, and the global all-effects-off switch before any room host prewarms, prepares, or plays Pixi. `SiteSetting.skillEffectsEnabled` is read from the cached public site settings when a pending skill preview is created; when disabled, the backend keeps the skill banner window and resolves immediately after it instead of waiting for the board-effect phase.

- `server/roomClockLifecycle.js`
  - Room clock tick lifecycle boundary.
  - Owns the per-room interval callback for playing-phase clocks: clearing intervals for rooms no longer in memory, pausing ticks outside playing phase, handing fully disconnected games to empty-room close scheduling, deducting active-player time, finishing timeout games, and choosing lightweight `room:clock` versus full `room:update` broadcasts.

- `server/roomRestoreLifecycle.js`
  - Restored room timer lifecycle boundary.
  - Owns post-hydration timer resume decisions for finished rooms, opening rooms, pending skill previews, active room deadlines, and empty-room close scheduling. `server/rooms.js` hydrates and registers persisted rooms, then delegates restore-time scheduling to this boundary.

- `server/roomPersistenceRestoreLifecycle.js`
  - Persisted room restore orchestration boundary.
  - Owns loading persisted room rows, parsing snapshots, hydrating rooms, appending restored disconnect notices, registering restored rooms in memory, invoking restored timer resume decisions, force-persisting resumable rooms, and logging bad persisted rows without aborting later rows.

- `server/roomOpeningLifecycle.js`
  - Room opening transition lifecycle boundary.
  - Owns opening-to-playing transition, game-start system notice, last-tick refresh, first full-room broadcast after opening, and initial passive-skill trigger handoff.

- `server/roomConnectionLifecycle.js`
  - Room socket connection lifecycle boundary.
  - Owns attaching player sockets, spectator joins, player disconnect state, spectator socket cleanup, explicit spectator leave, finished-player leave-as-spectator handling, reconnect notices, disconnect notices, empty-room close handoff, and forced room persistence after connection-state changes.

- `server/roomRequestLifecycle.js`
  - Room request/action entry lifecycle boundary.
  - Owns room-code validation, room lookup, player lookup, phase precondition checks, point-target validation for scoring actions, and delegation into `server/roomScoringFlow.js` for counting, draw, and scoring mutations.

- `server/roomCreationLifecycle.js`
  - Room creation lifecycle boundary.
  - Owns matched-matchmaking room creation and direct-duel room creation orchestration: direct-room mode normalization, matchmaking cleanup, room registration, forced initial persistence, game clock startup, opening schedule, `match:found` delivery, creation system notices, and initial room broadcast.

- `server/roomActionLifecycle.js`
  - Room gameplay action entry lifecycle boundary.
  - Owns game-action room-code validation, room lookup, point-target validation, player lookup, pending-skill guard, test-action dispatch, skill-action dispatch, and standard move/pass/resign delegation.

- `server/roomChatLifecycle.js`
  - Room chat entry lifecycle boundary.
  - Owns chat room-code validation, text normalization, room lookup, chat message shape, message ids, move-number capture, and message timestamps.

- `server/roomQueries.js`
  - Room read-model/query boundary.
  - Owns active-room filtering, watch-room projection, user active-room membership checks, and user-to-room lookup while reusing `server/roomPresence.js` for online counts and watch player summaries.
  - Active-room and watch-room list projection can delegate to an injected `roomReadModel`, with the current in-memory room scan kept as the single-process fallback.

- `server/roomClockTiming.js`
  - 房间棋钟纯计算模块。
  - 负责主时间扣减、读秒周期扣减，以及有效行动后的读秒重置，避免计时规则继续堆在实时房间流程里。

- `server/adminRoutes.js`
  - 后台管理路由。
  - 管理站点设置、上传、审计日志、任意用户棋谱查看，并把用户管理写操作委托给 `server/adminUserManagement.js`，把装饰/商城商品写操作委托给 `server/adminCatalogManagement.js`，把角色/技能写操作委托给 `server/adminCharacterManagement.js`。

- `server/adminCharacterManagement.js`
  - Admin character mutation boundary.
  - Owns admin-side character create/update/disable, content-only skill update enforcement, character skill upsert payload construction, legacy top-level editable skill-field compatibility, admin character response payload projection, and character-target audit entries. Existing skill and derived-skill structure is authoritative; only name, description, and overclock may change through admin updates.

- `server/adminUserManagement.js`
  - Admin user-management mutation boundary.
  - Owns admin-side user update sanitization, required-update validation, profile edits, ban/unban, password reset, structured asset sync, progress ledger writes, last-active-admin protection, and user-target audit entries.

- `server/adminCatalogManagement.js`
  - Admin catalog mutation boundary.
  - Owns admin-side decoration create/update/disable, shop item create/update/disable, shop target existence validation for character/decoration/music items, and decoration/shop-item audit entries.

- `server/adminAudit.js` / `server/adminRouteErrors.js`
  - Shared admin route support modules.
  - `adminAudit.js` owns audit JSON serialization and `AdminAuditLog` writes; `adminRouteErrors.js` owns route error object creation shared by admin routes and user-management mutations.

- `server/siteSettings.js`
  - 站点公开配置读取和后台更新逻辑。
  - 当前管理大厅标题 `homeTitle`、大厅副标题 `homeSubtitle`、设置关于页长文本 `aboutText` 与首页 footer 长文本 `footerText`，并写入后台审计日志。

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
- 注册界面要求两次密码输入一致；确认密码只用于前端校验，不随 API payload 保存。注册输入规范作为 placeholder 展示，字段错误仍在对应输入框下方反馈。
- 密码使用 `bcryptjs` 哈希存储。
- 登录态使用短期页面内存 access token + 持久化 refresh cookie：access token 仍只保存在 React 内存中，不写入 `localStorage`；浏览器保存 `HttpOnly` refresh cookie，页面刷新、浏览器重开或后端短暂重启后会先调用 `/api/auth/refresh` 自动恢复登录。
- `LoginSession` 数据库存储当前有效会话、refresh token 哈希、过期时间和撤销时间；Socket 断开只影响在线状态，不再直接撤销登录会话。
- 同一账号只允许一个实时在线连接；再次登录当前仍有在线 Socket 的账号时，登录接口返回 `already_logged_in` 冲突，前端确认后以 `forceLogin` 重试并踢下旧 socket、撤销旧 refresh session。数据库中仍有效但没有在线 Socket 的旧 refresh session 不会触发该提示，会被新登录替换，避免开发服务器重启或浏览器异常关闭后误报“该账号已登录”。
- 用户状态支持 `active` / `banned`。
- 管理员可配置、可在启动或登录时自动提升。
- 用户公开字段序列化会隐藏 `passwordHash`。

### 大厅与个人空间

- 登录页品牌标题显示为 `星炬学院围棋部`。
- 大厅入口：履历、部员手册、星炬对弈、观战、排行榜、商城、后台管理（管理员可见）。
- 大厅首页布局 A：星炬对弈作为最大主行动面板；该区域使用 `/assets/home/fantasy-match-illustration.webp` 透明 PNG 插图作为主体，插图顶部与左侧部员手册区域顶部对齐，不显示原先标题、说明文字、边框或卡片背景，只在插图下方保留较小的“开始匹配”按钮。当前用户铭牌作为履历入口展示出战角色、用户名，以及按星炬、标准、五子棋三列排列的模式图标和段位数字，不直接显示积分；部员手册作为角色/装饰入口；商店、排行榜、观战、好友以中等图标按钮呈现。顶部条显示来自站点配置的标题和副标题，副标题中的拉丁/数字走 WuWa 艺术字体；在线人数是透明图标+数字标签，右侧是操作按钮；后台管理仅管理员可见，放在右上设置按钮下方，使用与大厅工具按钮一致的圆形尺寸并显示“后台管理”文字。
- 大厅主内容区尽量靠近窗口垂直中部；履历铭牌、部员手册和工具按钮位于左侧，星炬对弈主面板位于右侧。星炬对弈上方显示横向用户铭牌：出战角色头像、用户名，以及按模式排列的图标和段位数字，铭牌不直接显示积分；在线人数作为独立透明 HUD 标签放在顶部条，不放入铭牌内部。
- 首页匹配入口和好友约战入口共用对弈模式选择弹窗；模式按钮始终按星炬对弈、标准对弈、来下五子棋吗？排序，左侧保留中文标题和规则，两行规则稳定显示，右侧人数胶囊固定贴到按钮最右侧，按钮中央以指针透明的水印层显示模式图标加 WuWa 英文标签，桌面透明度为 50%，移动端透明度为 20%；取消按钮必须与模式选项组保持明确垂直间距，桌面端和移动端都不能贴近最后一个模式按钮。
- `public/hotspot-prototype.html` 是单页热点原型，用用户提供的 `/assets/prototypes/classroom-bg1.webp` 作为 1672:941 舞台背景，并用百分比定位的蓝色热点按钮模拟排行榜、留言、游戏、登出、部员手册和匹配入口；当前仅用于验证手绘大厅背景上的可点击区域，点击后显示 toast，不接入正式大厅状态。
- 大厅顶部标题和副标题都来自 `GET /api/site-settings`；未配置或接口失败时回退到共享默认值。标题组居中显示，右侧功能区固定在右上角。
- 首页 footer 文本来自 `footerText` 站点配置，后台以长文本维护；渲染时支持受限 Markdown 链接 `[文字](https://example.com)`，只把 `http/https` 链接转为锚点，其余内容作为普通文本显示。桌面端 footer 是 `main.home-screen` 后方的 HUD sibling 并固定在视口右下角，避免被大厅主舞台滚动容器带动；移动端仍在普通文档流中显示。
- 大厅与对局页右上操作区共用同一个留言板入口。留言板当前为前端占位弹窗，输入框默认提示“Bug、问题反馈和意见都可以在这里提交哦”，包含提交按钮，提交暂不落库。
- ???????????????????????????????????????????????????/??/????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
- 部员手册只保留角色选择、角色详情和装饰选择，不再承载战绩、段位、金币或对局回放。角色卡会在桌面端和移动端通用展示当前角色正在承受的道具效果图标；例如西格莉卡的糖果禁用效果和达妮娅的彩虹糖果效果都会在对应角色卡左上角显示彩虹豆豆跳跳糖图标。装饰区标题显示为“装饰”，标题右侧可恢复初始装饰。
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
- 收到匹配成功事件时，前端会自动关闭大厅上已打开的商店、部员手册、履历、排行榜、观战、好友、设置和留言板弹窗，避免弹窗盖住后续对局切换。
- 开局展示结束后服务端切换到 `playing`，写入 `game-start` 系统消息，前端播放“对局开始”系统语音，并从该时刻开始推进棋钟。
- 计时与读秒：房间玩家包含 `mainTime`、`byoYomi`、`byoYomiPeriods` 等内存字段。
- 对局者刷新页面、关闭页面或短暂断线后，前端会保存最近玩家房间号并在 Socket 重连时请求 `room:resume`。如果内存房间仍存在且未结束，服务端会把该 socket 重新绑定到房间并广播当前房间视图；断线期间服务端棋钟继续按真实时间推进，不会暂停。如果房间已结束但仍在内存或可通过该房间号找到 `GameRecord.snapshot`，前端停留在大厅并恢复结果弹窗；关闭结果弹窗后清理最近房间号。正常在线收到终局 `room:update` 的对局者会立即清理最近玩家房间号，因此主界面结果弹窗只用于“对局中断线且终局时未能及时连回”的玩家恢复结果。同一个有效对局结果被对局者关闭后，即使后续 WebSocket 重连再次收到该房间的 `room:resume` 结果 payload，也必须保持已关闭状态，不能再次弹出结果弹窗。如果服务重启导致内存房间丢失且没有可恢复棋谱，前端会清理最近房间号、回到大厅，并提示“房间已不存在，可能是服务器重启或房间已关闭”。
- 玩家信息区的段位和积分分列为棋子上下两枚标签；积分显示追加“分”，技能超频使用红色强调。除子与超频标签支持桌面悬停说明和移动端点按说明：除子说明其会在数目时按 `+除子*1` 计入，超频说明其会在数目时按 `-超频*2` 扣减。移动端的除子、超频、技能说明从点击位置生成浮层，但浮层使用固定的视口内宽度和强制换行，定位会按浮层最大宽度和视口边距夹取，顶部空间不足时改为向下展开，并用最大高度和内部滚动保证内容不溢出画面外。
- Room player info panels use `.active-turn` as the current-turn visual contract: the player whose turn it is turns yellow on both desktop and mobile, and late theme layers such as Bright School must preserve that yellow turn-state cue.
- 对局结束后，玩家信息区立绘右下角显示通用结果角标：胜为红字、负为黑字、和为绿字。该颜色规则定义在共享房间样式层，对所有主题界面通用。Bright School 房间内的角色头像框还会按执棋色着底：黑方为 `#2b2b2b`，白方为纯白，且房间角色立绘图片不再带投影，避免胜负角标、头像底色和图片阴影互相混淆。
- 棋谱回放打开时会把 `GameRecord` 的 `winnerColor/resultText` 回填到回放房间快照的 `game.winner`，即使旧快照缺少该字段，回放信息区立绘右下也能显示对应胜/负/和角标。
- 回放棋局每一步由 `replayRoomAt()` 重算棋盘，但会保留原始回放房间的 `finished` phase 和 `winner` 元数据，避免回放视图因为重算过程丢失结果角标；技能历史里的 `removedByColor` 按被移除棋子颜色记录，回放重算展示除子/提子时必须先通过 `captureCreditOwner()` 转成黑白受益方并忽略中立颜色，避免原始颜色计数被当作归属方重复累加。
- 玩家信息区技能按钮从角色 `palette` 注入 `--skill-chip-accent`，按钮背景和边框渐变跟随角色主题色；可用技能使用更饱和的角色色渐变，技能次数为 0 时进入 `spent` 灰色状态。`theme-components.css` 会在隔离层之后再次声明 `.player-info .skill-chip` 与 `.skill-chip.spent`，防止 `room-terminal.css` 或 Bright School 后置层把语义颜色覆盖掉。
- 技能栏支持悬停/点击展开“挂画”式技能说明面板，说明随鼠标移出或再次点击收起。
- 对手信息区下方显示“房间成员”，固定最多 3 行高度并可滚动；回放模式不显示房间成员区域。对局者用黑/白棋图标标识执色且用户名为红色，观战者为黑色用户名。点击任一行会展开占位操作面板：详细信息、加好友/解除好友、加入黑名单/从黑名单解除、密谈。自己所在行的加好友和黑名单操作禁用；好友关系下加入黑名单按钮禁用。成员行按关系显示背景：自己为淡黄色，好友为浅绿色渐变，黑名单成员为灰色。加好友会自动从黑名单移除目标用户。
- 操作提示区在轮到当前用户处理落子、数子/和棋申请、死子确认或结果确认时切换为浅红色背景；普通等待状态保持常规提示背景。观战和回放模式不显示操作提示区。
- 超时判负。
- 弃手属于普通对局动作，前端点击后必须先弹出“是否弃一手”确认窗口，确认后才发送 `pass` 动作；双方连续弃手只记录弃手次数并交换手番，不会自动进入数子申请/确认流程，数子必须通过“数子”按钮发起申请。
- 数子流程：申请、接受/拒绝、标记死子、标记单官/中立点、确认死子、结果确认、拒绝后继续。
- 和棋申请，10 秒超时拒绝。
- 数子申请、和棋申请与数子结果确认的超时任务统一通过房间 `timeoutIds` 注册，房间关闭、断线清理和测试清理时会一起取消，避免旧 deadline 定时器在房间生命周期外继续运行。
- 结束后保存棋谱，并通过 `resultRewardDelta` 更新战绩、积分与金币：胜者积分 +20 / 金币 +50，败者积分 -20 / 金币 +20，和棋不更新用户奖励。段位不再由积分派生；每个模式独立统计当前 rank-cycle 最近最多 10 盘胜负，胜 7 盘升段/级、负 8 盘降段/级，最高 9段、最低 18级，升降级触发后清空该模式的最近胜负窗口重新记录。
- 对局不超过 10 手结束均属于无效局：不会写入 `GameRecord`，不会出现在对局回放中，也不会增减积分、金币或战绩；服务端向双方发送顶部提示“对局不超过10手结束，对局无效”，前端不弹对局结果弹窗。无效局结束后 `closesAt` 固定为 30 秒内，倒计时到点即使双方仍在线也发送 `room:closed` 并关闭房间；有效结束局仍保留 5 分钟复盘窗口，并在仍有人连接时顺延。
- 开发测试按钮：`test-random-layout` 会清空棋盘并生成符合基本气规则的 50 黑 50 白随机布局；`test-restore-skill` 会恢复当前玩家技能次数；`test-enter-byo-yomi` 会把点击方主时间直接置为 0 并进入读秒。该入口用于本地测试，后续应便于统一移除。
- 房间测试动作入口已经下沉到 `server/roomTestActions.js`：`server/rooms.js` 只识别 `isRoomTestAction()` 并应用返回结果，具体动作、系统消息和非生产环境开关校验集中在该模块，避免测试工具继续散落在实时房间主流程里。

### 技能与角色

- 内置角色 fallback：`sigrika`、`denia`、`aemeath`、`baconbits`、`nabomo`、`lynae`、`qiuyuan`、`mornye`、`changli`、`chisa`。达妮娅 fallback 技能名必须保持为当前默认“泡影幻梦”，供教程/房间技能横幅在缺少 API 角色技能配置时使用。旧达妮娅 slug `danea`/`denea` 不再作为兼容别名参与前端合并、用户公开资料或出战角色解析；启动时 `cleanupLegacyDeniaCharacterData` 会在角色 seed 前把用户选角/拥有权迁移到 canonical `denia`，删除旧角色行，删除引用旧 slug 的对局记录，并把角色商品、抽卡奖项和成就奖励目标改写为 `denia`。公共角色列表会防御性忽略旧 slug，避免旧达妮娅再次出现在部员手册。
- DB 角色会覆盖/合并内置角色。
- Character `sortOrder` is admin-managed persistent order. `seedCharacters` only assigns builtin default order when creating missing rows, and must not overwrite existing character order on server restart.
- 所有存在的角色都会出现在棋舍角色列表；未拥有角色以灰色状态展示，可查看信息但不可出战。
- 角色信息包含 `acquisitionMethod`/“获得途径”和 `description` 纯文本，可由后台维护；棋舍角色详情会在获得途径下方直接以斜体展示角色描述正文，数据库为空时前端回退到内置角色默认描述。
- 角色技能逻辑由代码管理：后台仅编辑基础技能和已有派生技能的名称、描述、超频，不能修改效果、目标、次数、回合行为、参数、启用状态或增删技能。派生技由各基础技能自己的 `params.derivedSkills[]` 显式声明；启动任务 `cleanupLegacyDerivedSkillLeak` 通过一次性 marker 清理旧后台草稿误注入到非爱弥斯角色的默认“远航星”，随后 `seedCharacters` 可补齐代码中新增加但数据库缺失的派生定义而不覆盖已有内容。
- 娜波摩的获得途径为积分达到 1400 分自动获得；公开用户序列化时会根据 `User.rating` 自动补充 `nabomo` 到已拥有角色列表。琳奈的获得途径为星炬模式首次升上 5 段自动获得；公开用户序列化时会根据星炬 `modeStats.rank`（缺省时回退 `User.rank`）自动补充 `lynae`，管理员用户不受段位限制直接拥有。
- 技能类型：
  - `erase-point`：抹除空交叉点，点位不可落子且不参与数子。 结算后的无效点使用 `/assets/effects/sigrika-erased-field-marker.webp` 作为 point-local 透明 WebP 坑洞标记，并由棋盘的 `erased-boundary-layer` 灰显周围格子、用一路线同粗细外边界线标出边界。
  - `flip-stone`：达妮娅主动技“泡影幻梦”，反转目标棋子颜色。
  - `hidden-hand`：隐藏手，未暴露前对对方隐藏。
  - `protocol-takeover`：莫宁主动技“协议接管”。指定一个有效、空置、未被协议标记的交叉点，写入对手禁入协议；该空点阻止被禁方普通落子和空点/任意点指定类技能目标，不阻止该点已有棋子被石子目标技能指定，也不改变气、提子、劫或棋子归属。协议点为空时不计入被禁方领地，但仍作为空区域连通的一部分，避免污染同一区域内其它空点归属；协议标记会随棋子翻转、横斩移除、随机爆破和普通提子保留，只有交叉点被抹除时清除。
  - `row-slash`：仇远主动技“一斩足矣”。指定任意有效交叉点，移除其所在行所有棋子；每直接移除一枚棋子追加 `+1` 超频，技能后的无气清理仍计入除子但不再增加仇远超频。
  - `random-blast`：随机选择棋盘上非一路的已有棋子作为中心，并移除以该棋子为中心的固定 3x3 区域内棋子。
  - `spray-stone`：琳奈主动技“流光溢彩”。指定一枚非喷涂、非隐藏手棋子，并同时从棋盘上另一枚非喷涂、非隐藏手棋子中随机选一枚，转化为命名中立阵营“喷涂棋子”；如果没有随机候选，只转化指定棋子。黑/白棋转化为喷涂棋子时按来源颜色立即给对方 `skillRemovals +1`，其它中立棋子转化不给黑白除子；转化后按气规则反复清理无气棋群直到稳定，清理黑白棋群按正常归属计除子，清理中立棋群不计除子。
  - `color-illusion-passive`：娜波摩被动技“千变万化”。第一次轮到娜波摩玩家时自动进入技能演出，演出结束后该玩家后续落子有 80% 概率在对手视角中显示为对手颜色，真实棋盘规则仍按实际颜色计算；数子申请待确认时仍保持伪装，双方同意并进入死子确认/数子阶段、结果确认或对局结束后才显示真实棋盘。
  - `liberty-purge`: Chisa active skill "????". The target rule is `legal-move-point`: the server first applies a normal legal move, including ko, protocol ban, and suicide checks, then removes every group with exactly one liberty from a single board snapshot. Removed non-friendly stones add overclock, removed friendly stones subtract overclock, and the final extra overclock is clamped at zero. Removed points are recorded in `libertyPurgeMarks` / `removalMarkIds` and rendered as red crosses until the opponent's next real turn ends. Targeting an opponent unexposed hidden hand only reveals it and does not spend the skill, switch turns, or enter skill preview.
- 中立棋子由 `src/shared/gameConstants.js` 统一命名；同名中立棋子互相连接，不属于黑白双方，可被普通落子、猪小仙 `random-blast` 和死子标记移除，但中立棋子被移除不提供黑白除子。数子时中立棋子不计黑白子数，会作为边界参与空点归属判定；被喷涂棋子或多阵营共同围住的空点保持中立。
- 达妮娅 `flip-stone` 作用于真实黑/白棋子，不能反色喷涂棋子或其它中立棋子；如果目标点带有娜波摩伪装，反色后会清除该点伪装。
- 技能演出流程：服务端先进入 `skill-preview` 并广播 `pendingSkill`，此时棋盘保持旧状态；默认在技能横幅和棋盘特效演出后应用技能效果并再次广播。后台 `skillEffectsEnabled` 关闭时，服务端只保留技能横幅阶段，横幅结束后直接应用技能效果；前端通过 `src/shared/skillPresentation.js` 解析每个 `effectType` 的演出时间线、Pixi 棋盘层、DOM-only 层、音效层和关闭特效状态，`BoardSkillEffects` prepares the transparent canvas, Pixi app, and renderer assets during the skill banner window, then starts playback and SFX at banner end to avoid a post-banner blank gap; it 只负责按该配置预热/挂载表现层，不再自行散落判断。
- 技能目标确认态由前端 `pendingSkill` 驱动：`ActionBar` 给技能按钮添加 `.active`，`Board` 给棋盘容器添加 `.board-wrap.targeting` 并给可用目标点添加 `.previewable`。Bright School 的最后 CSS 层必须保留技能按钮与棋盘外圈的彩色动画发光，并让星位点使用独立 `::after` 居中显示；旧的星位 `::before` 必须显式关闭，避免和目标预览光圈使用的 `::before` 冲突并产生虚假星位。
- 数目/死子确认阶段的棋盘标记由 `territory-mark`、`dead-mark`、`neutral-mark` 挂在对应 `.point` 内。`territory-mark.black/white` 用对应颜色的 `×` 表示黑/白领地，`dead-mark.black/white` 只用对应颜色的圆圈表示白/黑死子归属，不能继承领地 `×` 的伪元素。Bright School 的通用 `button > * { transform: none !important; }` 会影响棋盘点按钮的直接子元素，因此最终层必须为这些标记恢复 `left/top: 50%` 与 `transform: translate(-50%, -50%) !important`，确保 X 点和死子圈始终落在交叉点中心。
- Bright School 棋盘相关的最终补丁要优先降低 CSS 熵：技能按钮/棋盘外圈发光的关键帧使用局部 CSS 变量复用三段视觉状态，静态兜底阴影留在元素本体，动态彩色光晕放到透明 `::after` 层，避免与旧主题里的 `box-shadow !important` 覆盖链互相抵消；数目/死子标记使用单个 `:is(.territory-mark, .dead-mark, .neutral-mark)` 选择器共享交叉点居中规则。后续新增棋盘修复应先扩展这些局部令牌或共享选择器，避免在文件尾部继续堆叠等价的散装覆盖。
- 技能释放横幅由 `SkillBanner` + `.skill-burst` 渲染为房间级 fixed 浮层；它的可见性必须由 `pendingSkill` 挂载状态保证，浏览器 `prefers-reduced-motion` 只关闭动效，不应把横幅压到透明终点。
- 达妮娅目标点泡泡炸裂特效已有预览资产 `public/assets/effects/denia-bubble-pop.webp`：透明玻璃泡泡生成并膨胀，随后被黑色能量/墨雾填满，短暂出现细密裂纹和蓄力压迫，最终爆散出黑色碎片、烟雾粒子和轻微冲击波并消散。该 GIF 当前仅作为视觉参考，尚未接入技能生效流程。
- 开局被动技能不会在 `opening` 阶段触发；正式进入 `playing` 后才按延迟规则触发，避免和执色提示/开局语音重叠。
- 依赖棋盘已有棋子的技能在场上没有可用目标时不可启动：前端技能按钮会变灰，服务端也会在 `use-skill` action 中二次校验并拒绝。当前包括以黑白棋子为目标的达妮娅 `flip-stone`、需要随机选择现有棋子为中心的猪小仙 `random-blast`，以及以非喷涂、非隐藏手棋子为目标的琳奈 `spray-stone`。
- 无目标技能不显示落子/目标预览；猪小仙 `random-blast` 使用“确认式无目标”流程：点击技能后进入待释放状态，棋盘悬停不显示目标标记，点击任意棋盘点仅确认释放。前端必须把 `canPreviewSkillTarget` 的目标预览判定和 `skillUsesBoardConfirmation` 的棋盘确认判定分开：前者保持 `false`，后者允许合法棋盘点触发 `use-skill`。真正爆炸中心仍由服务端随机选择棋盘上非一路的已有棋子，点击点不作为爆炸中心。技能生效后会在完整 3x3 区域留下较弱的交叉点高亮，施放者下一手落子后清除。爆炸残留区域使用独立视觉层展示，不遮挡普通落子点 hover 提示。
- ChangLi (`changli`) `double-move`: server resolution writes public `game.extraTurn` state. Each successful ordinary move decrements the remaining opportunity, pass follows the normal pass flow and clears `extraTurn`, counting/draw requests are blocked while `extraTurn` is active, and restored ChangLi skill previews resolve directly into the double-move state without replaying presentation.
- 除子可以为负，并在数目时按 `+除子*1` 计入总分。琳奈 `spray-stone` 和仇远 `row-slash` 技能生效后发动方除子额外 `-1`；长离 `double-move` 若成功落下第 2 步，发动方除子 `+1`。
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
- 用户可看自己的全部棋谱摘要；履历会用这批完整记录派生总局、胜局、负局和和棋，保证与排行榜同源统计一致。
- 管理员可查看任意用户棋谱与任意棋谱详情。
- 前端回放通过 `replayRoomAt` 基于历史步骤重放共享规则逻辑。
- `replayRoomAt` 会容忍旧版或不完整 `GameRecord.snapshot` 缺少 `chat` 数组；缺失时按空聊天记录处理，避免点击回放详情后因渲染期异常导致白屏。
- `RoomScreen` 的回放房间会以观战角色渲染，并继续把 `activePlayer` 等派生状态传给房间音频 hook；该入口有 SSR 回归测试覆盖，避免点击对局信息进入观战视角时因缺失派生字段白屏。
- 观战者进入房间后默认使用黑方对局视角，包括双方信息区位置；黑白双方信息区立绘左侧提供眼睛图标，可切换黑方/白方视角；下方操作栏切换为图标式回放控制。
- 棋谱回放同样支持黑方/白方视角切换，回放棋盘会按所选视角重放隐藏手和娜波摩伪装效果。
- 观战回放只改变棋盘内容，不改变实时信息区内容（计时、读秒、提子、超频等保持实际对局进程）。
- 观战弹窗标题显示为“对局列表”。模式切换使用共享模式顺序并以一行三列短标题分段控件呈现：星炬、标准、五子棋；房间列表区域独立伸缩/滚动，避免桌面短高度或移动端下把模式切换撑成大面板。观战者停在最新手时会自动跟随实时进程；如果手动回退到旧手，则新进程不会强制跳回最新。

### 商城与装饰

- 商品支持 `character`、`item` 与 `decoration` 三类。
- 商品有原价、折扣、是否可购买、是否展示、排序、描述、图片；道具商品额外有目标类型和商店库存。
- 玩家商城大厅入口显示为“商店”。商店窗口分为左右两列：左侧窄列为扎希拉接待区；桌面端金币钱包固定在接待区从上到下约 30% 的位置，问候气泡与底部等宽立绘之间保留约 5% 信息区高度间距，默认立绘 `/assets/zahira_shop_default.webp` 等宽贴在接待区底部，商店看板娘 WebP 由保留的 PNG 源图无损编码并保持 1448x1054 源尺寸。移动端接待区位于商店上方，金币钱包保持左下区域，问候气泡保持左侧主列，立绘位于右下并占接待区宽度的 50%，所有立绘只按比例缩放。购买成功后看板娘临时切换到 `/assets/zahira_shop_laugh.webp`，问候语切换为“谢谢惠顾！”，5 秒后恢复默认立绘和打开商店时抽到的初始问候语；购买失败不触发该状态，连续成功会刷新恢复计时。`ShopSidebar` 同时挂载默认和感谢两张立绘，并用透明度图层切换避免购买反馈时出现白色闪烁。右侧宽列直接从分类选项卡进入商品栏和页码，不再显示大标题。商品区每页仍固定 8 个槽位，但视觉网格会按可用宽高自适应列数，商品区内部独立滚动，页码固定保留在底部且当前页使用浅色高亮；商品网格内容在选项卡和页码之间使用安全居中：高度足够时尽量让第一行商品顶部与选项卡底部、第二行商品底部与页码按钮之间的留白接近，高度不足时回退到顶部对齐，保证滚动条可以覆盖完整商品栏。横屏小高度或窄窗口下会压缩扎希拉立绘、气泡、商品卡片和选项卡间距，避免商品栏和分类选项卡被挤出视口。商品数超过 8 个时自动增加页码，点击页码切换对应商品栏，切换分类会回到第 1 页且不改变槽位数量。空槽显示“暂未上架”，可购买槽使用简明浅色渐变，已拥有槽使用浅绿色渐变。
- 商城商品卡片按商品图标、商品名、商品介绍、数量/售价、购买按钮自上而下排列；数量或限购信息左对齐，售价右对齐。折扣商品的原价显示在现价数字上方，使用更小的红色删除线并与现价保持紧凑间距；原价作为浮动标注对齐现价数字列，不改变现价和无折扣商品售价的行内位置。购买按钮与卡片底部保留留白。商品卡片使用固定图片区、名称区、介绍区、信息区和按钮区，避免窗口尺寸变化时内容被挤出商品栏。
- 购买会扣除用户金币，并写入 `ownedCharacters`、`ownedDecorations` 或 `ownedItems`；道具可重复购买并按数量累加。道具 `stockQuantity` 表示每个用户独立的商店库存上限，不共享全服库存；购买道具会写入用户侧 `itemPurchaseCounts`，用于计算该用户剩余商店库存。
- 商店选项卡包含“道具”，点击后切换到道具商品页；道具对当前用户的剩余商店库存为 0 时仍可展示，但“购买”按钮改为“已售罄”并禁用。
- 商店商品槽和仓库道具/角色目标列表会缓存当前分类、页码和拥有角色派生结果；弹窗中的道具图、角色图和使用结果图使用 lazy loading 与 async decoding，避免道具图片或动图增加后挤占对局/弹窗打开时的主线程预算。
- Home lower-left tools include Warehouse for purchased items, quantities, and descriptions. Desktop warehouse inventory items render as single-row entries, while mobile keeps compact single-column row cards with the quantity chip right-aligned above the use button. Self-target items can be used directly. Recruitment-only or otherwise unavailable warehouse use buttons render as gray native disabled controls on desktop and mobile. Character-target items open a character picker with owned character portraits; characters that are already affected or have no effect for that item are disabled and grayed out on desktop and mobile without reason badges or reason text, while usable characters consume one item on click. Implemented item effects then show only the chosen character portrait and effect copy. Item use only reduces warehouse quantity, does not restore shop stock, and success/error feedback stays in the top toast instead of inline warehouse notices.
- New accounts start with Sigrika and Denia, not Aemeath. Registration atomically creates the account and one system mailbox message from `飞行雪绒歌友会` with a single `aemeath-flight-snow-memorial-ticket` attachment. Closing, finishing, or skipping the first onboarding run calls the one-time exit-notice endpoint and may show `你有收到新的邮件！`; the mail remains discoverable through the normal mailbox badge even if that informational request fails. Claiming the attachment makes the memorial ticket visible in Warehouse with a disabled `请去招募` action. It never enters the player shop catalog, while the existing admin mailbox item selector can still attach it by stable item id.
- Owning the memorial ticket inserts its holographic five-color button with a light, high-contrast inner surface between the two normal recruitment items. Starting it consumes one ticket only after the server verifies that Aemeath is not already owned, creates an 11.25-second fixed-success task, and runs the 7.05-second locked arrival presentation. The displayed 999-minute countdown and gradual dimming both start on the first presentation frame; the current Pink Cyber Angel sprite atlas loops its eight-frame right-flight row during entry, switches to one four-frame wave at the countdown anchor, then changes behind the full-white frame to the server countdown near five seconds. Normal presentation completion records the task as locally presented and waits for the authoritative countdown to reach zero before showing ready; only hidden/offline/page-exit interruption skips directly to a ready task without replay. The player still explicitly claims and opens the ordinary result view, whose decided character is always Aemeath.
- 对角色使用道具成功后，页面顶部 toast 显示“对[角色名]成功使用了[道具名]”；使用结果窗口读取接口返回的最新 `user.itemEffects`，所以达妮娅吃下彩虹豆豆跳跳糖后，结果窗口中的达妮娅立绘会立即显示为彩色 GIF 状态。
- 商店购买、商店加载错误、后台管理保存/下架/上传/封禁等操作反馈统一走页面顶部 toast，不在对应弹窗、抽屉或后台编辑区内新增成功/失败文本框。
- 页面顶部 toast 使用队列堆叠展示，新提示插入顶部，先出现的提示会被挤压到下方；每条提示最长显示 3 秒后淡出。toast 只用于普通错误、操作反馈和成功提示，不再自动弹出金币、积分或段位增减；对局收益继续在结果弹窗中展示，回到大厅后由 `/api/me` 刷新的铭牌统计体现最新段位积分。
- 内置道具“彩虹豆豆跳跳糖”会 seed 为 `item` 商品，商店库存 10、价格 10、图片 `/assets/items/rainbow-bean-candy.webp`，介绍为“产地不明的糖果，据说有神秘的效果”。服务端会把商品、仓库和玩家侧抽卡奖项/结果中的内置糖果旧 PNG 图路径归一为当前 WebP，默认快照里的糖果商品和卡池奖励也使用同一路径。该道具只能对角色使用，目前仅西格莉卡和达妮娅有实际效果，其它角色会返回“这个角色暂时没有糖果效果”且不消耗道具。
- 彩虹豆豆跳跳糖对西格莉卡使用后：消耗 1 个道具，用户获得 30 金币，`itemEffects.sigrikaCandyDisabled` 置为 true；西格莉卡棋舍出战按钮变灰，`/api/me/character` 与 socket 选角都会避开西格莉卡。如果当前出战是西格莉卡，后端自动随机切换到一名已拥有且可出战的其它角色；没有可替换角色时拒绝使用且不消耗道具。任意角色完成一盘有效对局后清除该状态。
- 彩虹豆豆跳跳糖对达妮娅使用后：消耗 1 个道具，`itemEffects.deniaRainbowGlow` 置为 true；除用户铭牌外，所有展示该用户达妮娅立绘的位置都会把原立绘替换为 `/assets/characters/denia_color.webp` 彩色动图，包括棋舍、仓库使用结果、对局信息区、技能横幅、排行榜/好友资料等可获得用户效果状态的界面。只有使用达妮娅完成一盘有效对局后清除该状态；服务端会在首个有效结算 `room:update` 广播前先更新房间内存玩家状态，前端再从房间视图同步当前用户状态，因此返回大厅/棋舍时立绘会恢复为角色原始立绘。
- 登录后的静态资源预加载会无条件加入达妮娅糖果动图 `/assets/characters/denia_color.webp`，让用户之后在棋舍、排行榜、好友资料或对局中首次看到彩色达妮娅时不再临时下载；对局回放数据仍保持按需加载。
- 糖果效果只在有效对局结束并保存棋谱的链路清除；不超过 10 手的无效对局不会清除糖果效果。
- 内置商品会 seed 猪小仙角色商品，价格 9999 金币；用户购买后才可出战该角色。
- 内置装饰商品会 seed 爪印棋子和“耙耙柑和水蜜桃”两套棋子装饰；爪印棋子价格 500 金币，“耙耙柑和水蜜桃”价格 1000 金币。
- `seedBuiltinShopItems` 只创建缺失的内置商城商品，不覆盖已经存在的 `ShopItem`。后台管理保存过的商品名、介绍、图片、售价、库存和上下架状态必须以数据库为准，服务重启或对局写库后不能被内置默认值改回。部署快照里的商城默认项按 `(category, targetId)` 同步到既有商品，同一目标不能重复；“耙耙柑和水蜜桃”只保留 `papagan-peach-stone` 这一条可展示的 1000 金币装饰商品。
- 爪印棋子使用 image-gen 生成图裁切出的透明 PNG 贴图：`paw-stone-black.webp`、`paw-stone-white.webp` 和 `paw-stone-preview.webp`。“耙耙柑和水蜜桃”使用用户提供的 512x512 透明 PNG：`papagan-peach-stone-black.webp` 为耙耙柑黑子，`papagan-peach-stone-white.webp` 为水蜜桃白子，`papagan-peach-stone-preview.webp` 为 1024x512 商店预览图。
- 后台保存装饰类商城商品时，`targetId` 校验同时认可数据库 `Decoration.slug` 与内置 `STONE_DECORATIONS` 配置，避免只修改内置装饰商品介绍时被误报为 `Shop decoration target does not exist`。
- 玩家购买棋子装饰后会进入棋舍装饰区，可点击应用；空选择表示继续使用默认棋子。
- 对局棋盘按棋子颜色找到对应玩家的 `selectedStoneDecoration`，黑白双方可分别显示各自设置的棋子样式；未设置时保持默认棋子。装饰棋子贴图直接替换默认棋子视觉，不附加默认圆形阴影，避免不规则透明 PNG 下方露出圆形光圈。

### 排行榜

- 入口在大厅。
- API 为 `GET /api/leaderboard`。
- 仅展示至少完成过一盘对局的用户。
- 按 `rating` 降序排序。
- 每行展示 `UserModeStats.rank` 中存储的模式段位；排行榜仍按当前模式 `rating` 降序排序，但段位不再由积分实时派生。
- 从棋谱统计总对局数、胜局数、负局数、和棋数。
- 最后一列展示胜率，按 `胜局数 / 总对局数 * 100%` 计算并保留 1 位小数；所有列内容居中显示。用户名和常用角色名限制在各自列宽内，过长时使用省略号。
- “常用角色”按棋谱中该用户使用次数最多的角色计算。
- 履历中的积分显示使用当前模式持久化 `rating`；总局、胜负、和棋仍由棋谱统计，避免后台积分编辑或对局结算后与履历显示不同步。最近胜负标记读取当前模式 `recentResults`，从左到右表示从老到新的胜负，绿色为胜、红色为负；该区域使用与当前界面一致的纸张描边背景，而不在首页铭牌上展示。移动端履历中 `.profile-grid.top-stats-bar` 外层固定为单列，让最近胜负标记始终位于战绩/积分/段位统计卡下方；内层 `.profile-resume-stats` 在桌面端和移动端都保持战绩/积分/段位三卡同一行，只有战绩卡内部在移动端把总局数和胜负和拆成上下两行；移动端 `.resume-character-records` 固定标题并让 `.character-record-list` 接管剩余高度滚动，避免短屏手机把角色战绩压出履历窗口。

### 后台管理

- 概览：用户数、封禁用户数、启用角色数、棋谱数、最近审计日志。
- 用户管理：列表、状态标签、右侧抽屉编辑角色、积分、金币、拥有角色、出战角色；段位按存储值只读展示，不再由积分自动换算；支持封禁、解封、重置密码、查看用户棋谱。
- 角色管理：左侧角色列表、右侧编辑面板，支持新增/编辑/禁用角色、配置技能系统。
- 角色立绘上传：支持 png/jpeg/webp/gif，大小限制 3MB。
- 商城管理：列表主视图，新增/编辑商品在右侧抽屉中完成，支持下架商品。
- 装饰管理：列表主视图，新增/编辑装饰在右侧抽屉中完成，支持停用装饰。
- 系统设置：可编辑大厅标题、大厅副标题、关于文本、首页 footer 长文本和加载页提示语集合；保存后通过 `SiteSetting` 持久化，并立即回写当前前端大厅/加载页状态。
- 审计日志：记录部分后台操作前后值。
