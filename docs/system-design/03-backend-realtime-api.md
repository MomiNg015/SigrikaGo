# 后端、HTTP API 与实时房间

opening 阶段房间快照增加 `openingServerNow`（发送时服务端毫秒时间），与原 `openingEndsAt` 共同表示剩余时长。`normalizeRoomSnapshot` 在接收时生成仅客户端使用的 `__openingEndsAt = receivedAt + max(0, openingEndsAt - openingServerNow)`；重复归一化保留已有本地期限。开局组件锁定首次期限，刷新快照不重启演出；playing 阶段不再投影该时间字段，并由原阶段切换卸载开局层。旧服务端未提供新字段时保留原截止时间兼容路径。

本文记录 Express、Socket.IO、房间生命周期、HTTP 路由边界和生产部署相关设计。新增 API、Socket 事件、房间生命周期模块或部署行为时优先更新本分篇。

## 当前结论

- 西格莉卡彩虹豆豆跳跳糖不再按 `NODE_ENV=production` 禁用；库存返回空 `disabledCharacterReasons`，合法使用仍在同一事务中扣除道具、应用效果并累计次数。仓库不再注入黑化测试跳转选项，正常第八次剧情与生产环境拒绝调试接口保持。

- `server/index.js` 负责 HTTP 与 Socket.IO 入口组合；启动数据与 schema 初始化顺序已收口到 `server/serverStartup.js`，具体 HTTP 领域逻辑已逐步拆到 `*Routes.js` 和领域模块，Socket 连接事件套件已由 `server/socketEvents.js` 统一装配，匹配、房间连接/恢复、对局/数子/求和/计分、聊天、约战和断线清理行为继续由对应 `server/socket*Events.js` 分组模块维护。
- `server/socketPracticeEvents.js` owns `practice:start`：参数为 `{ difficulty: "beginner" | "intermediate" | "advanced", playerColor: "black" | "white" | "random", engineVersion: "gnugo-3.8-v1", challenge?: "capture-challenge" }`，ack 为 `{ ok, roomCode?, error?, code? }`。前端先完成本地引擎初始化，服务端刷新认证用户、执行容量与活跃房检查，并校验版本；旧客户端返回 `local_practice_version`，三档新房均不探测服务器 GNU Go。创建 Spark / unrated / practice / recordPolicy=none 房间，持久化并安全投影 `practice.engineBackend="browser"`，保留难度、执色及提子阈值；虚拟准时宝已 ready、无正式角色／技能／socket／社交身份，内部 bot actor id 不投影。`practice:compute` 与 `practice:computed` 只接受房主当前连接，具体见本地陪练引擎。
- Realtime room behavior is composed in `server/rooms.js`; `server/roomMembershipIndex.js` maintains userId/socketId to roomCode indexes for active-room checks, `room:resume`, and `disconnect` cleanup so growing room counts do not force full scans.
- 普通对局秒级时钟走轻量 `room:clock`，关键状态变化仍走完整 `room:update`。两者都携带并推进 `clockSeq`，前端只接受新于当前房间快照的时钟 payload，防止网络乱序把读秒次数或剩余时间覆盖回旧值。
- 匹配或约战创建的房间先进入 `GAME_PHASES.preloading`，`server/roomPreparationLifecycle.js` 管理 60 秒资源准备截止时间、`room:preload-ready` 玩家 ready 上报、`room.update.preload.readyCount/requiredCount` 广播和超时中止；`server/socketRoomEvents.js` 的 `room:preload-ready` 是可重复调用的 ack 协议，服务端在校验房间码后返回 `{ ok, roomCode, phase, readyCount, requiredCount }`，客户端未收到 `{ ok: true }` 前可以安全重发；双方都 ready 后才切到 `opening` 并排原有开局倒计时。
- `room:resume` 的空 roomCode 只恢复仍可继续的玩家房间，不会自动拉起 finished room；finished 历史结果只有在客户端显式传入 roomCode 时才允许恢复。这样玩家关闭结果或退出 finished 房间后刷新，不会因为内存房间仍在 5 分钟 review window 内而再次弹出结果。
- `server/runtimeStabilityMetrics.js` 提供本进程启动以来的轻量稳定性计数，覆盖房间持久化错误、恢复坏快照、结果保存重试错误、预加载超时、恢复请求/成功/未命中，以及客户端标记为 `initial-connect`、`patch-gap` 或 `socket-connect` 的 `room:resume` 请求；这些计数通过后台概况的服务健康区展示，用于上线后快速定位恢复/预加载/持久化异常。
- 对局开发测试 action 在所有非生产服务环境默认可用，不依赖 `ENABLE_TEST_ACTIONS`；Vite 开发构建显示对应按钮，生产构建隐藏入口，而 `NODE_ENV=production` 的服务端即使收到伪造 action 或遗留开关也始终拒绝执行。
- `server/serverStartup.js` exports `SERVER_STARTUP_TASK_ORDER` as the auditable startup/schema/seed order and `SERVER_SCHEMA_TASK_ORDER` as its schema-only subset. `ensureServerSchema()` reuses the same injected guards without running any seed, while tests lock both orders so startup and deployment compatibility cannot drift through incidental function order.
- 管理员权限只以数据库 `User.role` 为准。公开注册、登录、refresh 和启动初始化都不会根据用户名或环境变量改变角色；首个管理员需先正常注册，再由服务器操作员执行 `npm run admin:promote -- <username>` 提升已存在账号。该命令对已有管理员幂等，未知用户名会失败且不会创建账号。
- `server/roomQueries.js` remains the room read boundary. Active-room lists and watch-room summaries can delegate to an injected `roomReadModel`, while the current single-process runtime continues to use in-memory rooms as the default fallback.

## API 与实时事件

### 服装目录、购买与装扮 API

- 登录玩家通过 `GET /api/costumes` 读取启用服装目录；每条 payload 同时包含当前用户是否拥有服装、是否拥有对应角色、是否正在装扮和折后价格。商店展示/批次随机由前端会话处理，服务端仍是可见性、可购买性与所有权的最终权威。
- `POST /api/costumes/:id/purchase` 在单个 Prisma 事务内校验服装启用/商店展示/可购买、对应角色所有权、重复购买与金币余额，以条件扣款避免并发超花，然后创建 `UserCostume` 和 `costume.purchase` 金币流水。路由沿用商城的购买次数成就计数和成就结算。
- `POST /api/costumes/equip` 接受 `{ characterSlug, costumeId }`；非默认服装必须启用、归属同一角色且由用户拥有。`costumeId="default"` 删除该角色唯一装备槽，恢复代码/角色目录的默认立绘。
- 管理接口为 `GET/POST/PATCH /api/admin/costumes`。保存前验证稳定 id、角色目标、资源 URL、价格/折扣和展示状态并写审计；停用服装或修改所属角色时删除引用该服装的 `UserCostumeEquipment`，但保留 `UserCostume`。
- `GET/POST/PATCH /api/admin/characters` 同时读写默认服装的可选 `illustName` / `illustUrl`；链接只接受 HTTP(S) 或站内根路径，填写链接时必须同时填写名称。公开角色 payload 透传字段，供客户端构建虚拟默认服装条目。
- `ensureCostumeSchema()` 必须在 `seedAdminDefaultConfig()` 前运行，使未执行 Prisma migration 的旧开发 SQLite 也能先建立服装目录、所有权、装备表和索引；生产仍以 migration deploy 为准。

## Production Deployment Hardening

- Runtime security helpers live in `server/security.js`.
- `assertProductionDeployment` 在生产环境启动时执行部署配置体检：`JWT_SECRET` 至少 32 位且不能使用默认值，`PUBLIC_ORIGIN` / `SITE_ORIGIN` / `ALLOWED_ORIGINS` 至少配置一个生产域名，且所有生产 origin 必须使用 HTTPS。配置不合格时服务端会在启动阶段抛出明确错误，避免带着弱配置上线。
- `npm run check:production` 可在部署脚本或 CI 中单独运行同一套生产配置体检，不需要先启动完整服务器或连接数据库；它和服务端入口一样先通过 `dotenv/config` 加载当前工作目录的 `.env`，再由进程环境覆盖同名值，并默认按生产规则检查，因此一键更新脚本不会漏掉 systemd `EnvironmentFile` 中的真实配置，调用方忘记设置 `NODE_ENV=production` 时也不会按开发环境误通过。
- `npm run check` 是当前交付前的聚合质量入口，会顺序运行 ESLint、单元测试、资源/后台快照检查、Vite build、构建 CSS 合同检查、生产配置体检和系统设计 HTML 生成，减少改动后漏跑文档同步或部署配置检查的概率。
- `npm run production:schema-compat` 只调用 `ensureServerSchema()`：正式更新在停服并完成 `prisma migrate deploy` 后、任何 `admin:sync-defaults` 读取之前执行它，幂等补齐早期 SQLite 部署中已被迁移历史遗漏的兼容表、列和索引。它不会 seed 后台数据，也不会写 `_prisma_migrations`；未来模型变化仍必须提交新的 Prisma migration。
- 2026-07-20 依赖加固后，`npm audit --omit=dev` 已无 high/critical；Multer、Express/`qs`、Socket.IO/`ws` 与 Vite/Vitest/Babel 工具链使用当前主版本内的修复版本。保留的 ExcelJS/`uuid` moderate 传递告警仅位于管理员按需加载的剧情工作簿功能，项目不直接调用 `uuid`；上游 ExcelJS 尚无修复版，禁止用审计建议的降级或未经验证的跨主版本 override 替代回归验证。
- `.github/workflows/ci.yml` 是仓库级远端质量门：pull request 和 `master` push 会在 Ubuntu 上执行 `npm ci`、`npm test`、`npm run build`、示例生产配置检查和 `npm run docs:system-design`。工作流显式展开这些步骤而不是只调用聚合脚本，方便在 CI 日志中定位测试、构建、部署配置或文档生成失败。
- `npm run verify:stability` 是本地准生产稳定性入口。它先构建 `dist/`，再用 `playwright.stability.config.js` 启动 `scripts/start-stability-server.mjs`，该启动脚本强制 `NODE_ENV=stability`、`LOCAL_PROD_STATIC=1`、`ENABLE_TEST_ACTIONS=true` 和默认端口 `4173`（可由 `STABILITY_PORT` 或 `PORT` 覆盖），从而在本地跑构建后的 Express/Socket.IO 站点，同时避开生产 HTTPS origin 强校验并保留测试造房能力。
- Vite production build uses explicit manual chunks in `vite.config.js`: React runtime code goes to `react-vendor`, Socket.IO client runtime goes to `realtime-vendor`, and the skill-animation Pixi runtime goes to the lazy `pixi-vendor` chunk. The entry JS stays below the default warning target, while the larger Pixi chunk is an intentional lazy/prewarmed exception guarded by `scripts/viteBuildConfig.test.js`.
- Username input is normalized server-side and must be 2-8 half-width display units, limited to Chinese, Japanese, Korean, half-width English letters, numbers, and `_`.
- Login accepts existing 6-64-character passwords for compatibility. New registration requires 8-64 Unicode code points and at most 72 UTF-8 bytes so bcrypt cannot silently truncate input; registration returns the exact validation issue, while login keeps one generic username/password error for invalid credentials or invalid credential shapes.
- Chat text is normalized server-side by removing control characters, trimming whitespace, rejecting empty messages, and capping messages at 240 characters.
- Room codes accepted by Socket.IO room operations must be exactly five digits. Board point payloads must be `x,y` coordinates within the 13x13 board.
- Express now uses `helmet` security headers, a 64 KB JSON body limit, and general `/api` rate limiting. Credential attempts on `/api/auth/register` and `/api/auth/login` use their own 20-per-10-minute production bucket; `/api/auth/refresh` and `/api/auth/logout` use a separate 120-per-10-minute session bucket so normal recovery cannot consume credential-attempt capacity.
- HTTP CORS and Socket.IO CORS use the same origin allowlist. Production origins come from `PUBLIC_ORIGIN`, `SITE_ORIGIN`, and comma-separated `ALLOWED_ORIGINS`; development additionally allows localhost ports used by Vite and the local server.
- Socket.IO connections call `server/socketEvents.js` once after online presence and initial lobby emissions. That boundary installs the `server/socketGuards.js` per-socket event guard and registers the focused event groups. The guard rejects excessive event traffic within a 10-second window before business event handlers run, but uses a separate recovery bucket for `room:resume` and `room:preload-ready`; recovery storms may be acked/rejected without emitting the player-facing “操作频繁” toast, while high-frequency `game:action` and chat still use the visible user-action limit. `server/socketMatchEvents.js` owns `match:join` / `match:leave` registration, including refreshed user data, blacklist candidate filtering, waiting payloads, queue cleanup, and lobby-stat refreshes. `server/socketRoomEvents.js` owns `room:join` / `room:leave` / `room:resume` / `room:preload-ready`, including room-code validation, room attach/leave calls, match-preload ready reporting, viewer-specific updates, resume fallback payloads, and room broadcasts. `server/socketGameEvents.js` owns `game:action` plus counting/draw/scoring event registration, forwarding lifecycle results into error toasts or success-room broadcasts. `server/socketChatEvents.js` owns `chat:send`, delegating chat mutation to the room chat lifecycle and broadcasting only changed rooms. `server/socketDuelEvents.js` owns `duel:request` / `duel:respond`, including refresh-before-delegate behavior, payload coercion, auth-expired toast handling, and successful-response lobby stat refresh. `server/socketDisconnectEvents.js` owns `disconnect` cleanup, including online-session unregister, room detach, changed-room broadcasts, and lobby-stat refresh.
- Socket.IO connections remain stable while the frontend user object changes. Before `match:join`, `duel:request`, and accepted `duel:respond` create a room, the server refreshes `socket.user` from the latest database user so the actual room character matches the current selected sortie character rather than the snapshot from initial socket authentication.
- In production, `deploy/nginx/sigrikago.conf` owns the HTTPS/certificate entry and includes `deploy/nginx/sigrikago-routes.conf` as the traffic boundary: only `/socket.io/`, `/api/`, and `/health/*` reach Node; uploads and built assets are served by Nginx with gzip for text assets. Hashed Vite outputs receive one-year immutable caching, while stable-name `/assets/**` resources and `index.html` use `no-cache` conditional revalidation so a same-path image/audio replacement cannot remain visually stale after deployment. The SPA shell repeats the Helmet CSP contract, retaining `script-src 'self'` while granting `blob:` only to `worker-src` for Pixi image decoder workers. `server/staticAssets.js` retains the same cache contract as a Node fallback and for `LOCAL_PROD_STATIC=1` verification, with Express index serving disabled so the SPA fallback can set the HTML header explicitly.
- Production uploads use `server/uploadPaths.js` to resolve the persisted upload root. `UPLOAD_DIR` can point to an absolute directory such as `/var/lib/sigrikago/uploads`; when omitted, uploads continue to default to `public/uploads`. Character portrait uploads are stored under `${UPLOAD_DIR}/characters` and remain publicly available through `/uploads/characters/...`.
- The single-server deployment guide lives in `docs/deployment.md`. It documents required environment variables, SQLite and upload-directory persistence, systemd, Nginx WebSocket proxying, HTTPS, backups, and the update flow. The guide targets the merged `master` branch for production checkout.
- `deploy/systemd/sigrikago.service` starts Node directly so SIGTERM reaches the lifecycle drain, reserves 25 seconds for shutdown, raises `LimitNOFILE`, and constrains the process with `MemoryHigh=1400M` / `MemoryMax=1600M` on a 2 GB host. `npm run verify:capacity` starts an isolated `NODE_ENV=capacity` server and temporary SQLite database; only that verification environment raises API/auth setup limits and enables debug actions needed to generate repeatable room mutations. Production throttles and debug-action rejection stay unchanged.
- Authenticated administrators can read the lightweight `GET /api/admin/runtime-capacity` snapshot without running the database-heavy overview analytics query. It returns only the runtime stability counters/measurements and service-capacity/process snapshot used by capacity sampling; normal players cannot access the route because the entire admin router remains behind `authHttp` and `requireAdmin`.

## 2026-05-29 Account Session Update

- Login sessions are tracked in the `LoginSession` database table through `server/loginSessions.js`; online socket membership is coordinated separately by `server/onlineSessions.js`. JWTs include a `sid` claim and both HTTP auth and Socket.IO auth reject revoked or expired session ids.
- `/api/auth/login` and `/api/auth/register` create a database login session, return an access token, and set a `sigrika_refresh` `HttpOnly` cookie. In production the cookie also uses `Secure`.
- `/api/auth/refresh` reads the refresh cookie, validates and rotates the stored refresh token hash, and returns a fresh access token plus public user payload. `src/main.jsx` calls this on startup, and `src/api/client.js` retries one authenticated JSON request or character portrait upload after a successful refresh when an HTTP 401 is encountered.
- If `/api/auth/login` receives correct credentials for an account that currently has an online Socket, it returns HTTP 409 with `code: "already_logged_in"` and the message `当前账号已登录了，确定继续登录吗？`. Persisted refresh sessions without an online Socket do not trigger this prompt and are replaced by the new login.
- `src/auth/AuthScreen.jsx` detects that conflict, opens the shared accessible `ConfirmModal`, and retries login with `forceLogin: true` only after the player confirms “退出其他会话并继续”.
- Forced login revokes previous database sessions, emits `account:logged-out` to existing sockets for that user, disconnects them, and then creates a new session for the confirmed login. Every session replacement is serialized per user inside the single Node instance; Prisma-backed revoke + create runs in one transaction, so overlapping replacements leave only the latest session active.
- Login always performs one bcrypt comparison, using a fixed dummy bcrypt hash when the username does not exist, and exposes the same generic 401 response for missing-user and wrong-password cases. Registration maps only Prisma `P2002` to HTTP 409 “用户名已存在”; unexpected persistence failures continue to the shared API error handler.
- Authentication responses preserve the role already stored on the user. No authentication route or startup task performs username-based administrator synchronization.
- Socket disconnects only change online/offline presence and room disconnect state. They no longer revoke login sessions, so page refreshes, temporary backend restarts, or network hiccups do not force users back to the login screen as long as the refresh cookie remains valid.

- Result rewards:
  - Random matchmaking rooms are rated only when their initial mode ranks are at most two adjacent rank steps apart; direct/private duels and wider-rank matchmaking are friendly matches. The queue chooses the closest eligible mode rank and expands after both participants wait 15 seconds, with a server-owned retry that revalidates admission and blacklists. Friendly matches do not update stars, points, rank windows, leaderboard/profile stats, or recent ten-game results, but still persist replays with `rated=false` and their original `matchSource` (`duel` or `matchmaking`). The room flag is frozen at creation and drives opening/header labels and settlement.
  - Rated progression uses `src/shared/rankProgression.js`: 4/6/8-star capacities below ninth dan; ninth dan enters at 1000 points and changes by +200/-250 with a zero floor. No Elo, rank-gap or repeat-opponent multiplier applies. `SiteSetting.ratingRules` retains friendly coin settings only.
  - A full-star win promotes and a zero-star loss demotes; reaching the boundary itself does not move rank. New rank receives half its capacity. Ninth dan at zero demotes to eighth dan/four stars on the next loss. Draws preserve progression. Recent ten decisive results are display history, not a rank trigger.
  - Coin rewards for rated games remain uncapped by day. Friendly matches use configurable win/loss/draw coin values and grant coins only for the first configured number of friendly games per user per server day, default 3 days counted by Asia/Shanghai.
  - The result modal displays settled rank with stars/ninth-dan points and coin deltas from `room.game.resultRewards[userId]`; friendly results show that the game does not count toward rating/rank, and show the daily friendly-reward limit state when reached.
- Home layout:
  - The home screen prioritizes "星炬对弈" as the largest primary action.
  - "棋舍" is a secondary profile/character entry with the selected portrait vertically centered beside player info.
  - 大厅标题与副标题独立于右上角操作区，居中显示在中上方；副标题和标题保持错位排版并使用更大的字号填充顶部视觉空间。
  - "商店", "排行榜", "观战", and "好友" are compact circular utility icon buttons anchored under the house card; each button shows only icon plus title. Admin management is available only to admins and appears as a labeled circular button below the top-right settings button, right-aligned with the logout/settings action stack.
  - Narrow utility overflow is contained inside the utility grid instead of expanding the whole page.
  - The friend button opens a social modal backed by `/api/social` with "好友" and "黑名单" tabs. Each list row shows online state, common character portrait, username, rank, rating, and a gear action button. Friend actions are "详细信息", "对局申请", and "解除好友"; blacklist actions are "详细信息" and "从黑名单解除". The unimplemented "密谈" entry is not rendered. Clicking a gear action expands a small horizontal action row directly below that user row; its remaining buttons share the row width equally, and clicking the same gear again collapses the row. The tab bar also includes a username search box plus search icon button; usernames use the shared registration/search validator, allowing Chinese, Japanese, Korean, half-width English, numbers, and underscores up to 8 half-width display units. On desktop, the toolbar reserves a right-side close-button safe area so the search submit button cannot collide with the modal close control. A successful search opens the shared profile modal, while missing-user and relationship-action messages use the page-level top toast.
  - "详细信息" uses a shared independent modal with common character portrait, username, received-like count, record, rating, rank, per-character record rows, a "对局回放" button, and bottom-right relationship actions "加为好友" and "加入黑名单". The portrait/username hero card also owns bottom-right icon-only like and report actions: self profiles disable both, users can like another user once per server-side Asia/Shanghai day, already-liked buttons render gray disabled, and blacklist state does not block liking or reporting. Reporting opens a content dialog, trims/validates the report with the feedback content rules, and stores reporter, reported user, timestamp, and content for admins. Relationship actions close the profile modal after success, switch the social list to the corresponding tab, and show a page-level top toast. The profile payload exposes structured `recordStats` and structured per-character totals from all rated records in the selected mode; the current user's resume modal consumes this same endpoint. Replay rows remain separate and include friendly games: `GET /api/replays` and `GET /api/users/:id/replays` return 50 newest-first summaries plus an opaque `nextCursor`, and the dialog requests the cursor only after its scroll owner reaches the bottom. The same profile card is reused by the room member popover, but room/observer profile cards disable "对局回放" to avoid jumping into replay while inside a live room.
  - Profile replay dialogs include the viewed user's username in the title. The dialog shell keeps the title and close button fixed while only the replay list scrolls.
  - "解除好友" and "从黑名单解除" use a shared confirmation panel and persist through `UserRelationship`. Adding a friend automatically removes/overwrites blacklist state for that target, and adding to blacklist overwrites friend state.
  - Admin HTTP adds `/api/admin/user-reports` for the "用户举报" tab. It returns the latest 100 user reports in reverse chronological order and is read-only until a future one-way admin mail system defines report handling/status feedback.
  - "对局申请" is enabled only for online users who are not currently playing. The server tracks connected sockets and active room players; `duel:request` first checks whether the target has blacklisted the requester, silently suppressing `duel:incoming` for that target and sending the requester a normal delayed rejection. Otherwise it delivers `duel:incoming`, `duel:respond` accepts/rejects the request, and acceptance creates a direct room through the same match-found/opening flow as normal matchmaking. Timeout or rejection emits a red danger notice to the requester.
  - Profile rank help explains the star ladder and ninth-dan points; rating is no longer a separate field.
- Character voice categories:
  - Character voice events are explicit: `game-start`, `skill-cast`, `sortie`, `byo-yomi-start`, `byo-yomi-period-2`, `byo-yomi-period-1`, `countdown-10` through `countdown-1`, `timeout`, `result-victory`, `result-defeat`, `result-draw`, and `house-detail`.
  - Recommended upload naming for full character voice packs uses one folder per character, for example `C:/codex/musicsour/cVoice/denia/`. Prefer OGG files with stable English scene keys: `match_start.ogg`, `skill_cast.ogg`, `sortie.ogg`, `byoyomi_start.ogg`, `byoyomi_remaining_2.ogg`, `byoyomi_remaining_1.ogg`, `countdown_10.ogg` through `countdown_01.ogg`, `result_win.ogg`, `result_loss.ogg`, `result_draw.ogg`, and `house_detail.ogg`. Avoid Chinese characters, spaces, and punctuation in filenames so Windows paths, frontend asset references, and build tooling stay predictable; `timeout.ogg` is no longer part of the expected pack because timeout has no standalone audio.
  - Denia now has a full AI voice pack under `public/assets/voice/denia_*.ogg`, converted from `C:/codex/musicsour/cVoice/denia/*.wav`. The pack covers `game-start`, `skill-cast`, `sortie`, `byo-yomi-start`, `byo-yomi-period-2`, `byo-yomi-period-1`, `countdown-10` through `countdown-1`, `result-victory`, `result-defeat`, and `result-draw`; `skill_cast.wav` is exported as `denia_skill_cast.ogg`, and `sortie.wav` is exported as `denia_sortie.ogg`.
  - Denia countdown voice assets `denia_countdown_10.ogg` through `denia_countdown_1.ogg` keep the stable countdown event filenames used by the byo-yomi resolver, so refreshed voice packs can replace the existing OGG files without changing event wiring.
  - Sigrika now has role voice assets under `public/assets/voice/sigrika_*.ogg`, converted from `C:/codex/musicsour/cVoice/sigrika/*.wav`. The pack covers `game-start`, `skill-cast`, `sortie`, `byo-yomi-start`, `byo-yomi-period-2`, `byo-yomi-period-1`, `countdown-10` through `countdown-1`, `result-victory`, `result-defeat`, and `result-draw`; `skill_cast.wav` is exported as `sigrika_skill_cast.ogg`, `sortie.wav` is exported as `sigrika_sortie.ogg`, while `byoyomi_start.wav` and `byoyomi_remaining_1.wav` refresh `sigrika_byoyomi_start.ogg` and `sigrika_byoyomi_remaining_1.ogg`.
  - Aemeath now has role voice assets under `public/assets/voice/aemeath_*.ogg`, converted from `C:/codex/musicsour/cVoice/aemeath/*.wav`. The pack covers `game-start`, `skill-cast`, `sortie`, `byo-yomi-start`, `byo-yomi-period-2`, `byo-yomi-period-1`, `countdown-10` through `countdown-1`, `result-victory`, `result-defeat`, and `result-draw`; `skill_cast.wav` is exported as `aemeath_skill_cast.ogg`.
  - Nabomo now has role voice assets under `public/assets/voice/nabomo_*.ogg`, converted from `C:/codex/musicsour/cVoice/nabomo/*.wav`. The pack covers `game-start`, `skill-cast`, `sortie`, `byo-yomi-start`, `byo-yomi-period-2`, `byo-yomi-period-1`, `countdown-10` through `countdown-1`, `result-victory`, `result-defeat`, and `result-draw`; `skill_cast.wav` is exported as `nabomo_skill_cast.ogg`.
  - Built-in skill voice assets are bridged into each character's `systemVoices.skill-cast` map at runtime, so skill banners use the same `resolveSystemVoice` route as other role voices.
  - Baconbits now has role voice assets for `game-start`, `skill-cast`, `sortie`, `byo-yomi-start`, `byo-yomi-period-2`, `byo-yomi-period-1`, `result-victory`, `result-defeat`, and `timeout`; `skill_cast.wav` is exported as `baconbits_skill_cast.ogg`, `sortie.ogg` is exported as `baconbits_sortie.ogg`, `result_win.ogg` is exported as `baconbits_result_win.ogg`, `result_loss.wav` is exported as `baconbits_result_loss.ogg`, and the period 2 and period 1 events reuse `baconbits_byo_yomi_periods.ogg`.
  - Character detail clicks in the house route through `house-detail`; missing assets stay silent until a character-specific detail voice is configured.
  - Countdown voice uses 10 second-specific events, with invalid countdown event names rejected before character audio override.
  - Missing character voice assets fall back to generic voice/TTS according to `resolveSystemVoice`.
- Room time display:
  - Player timers render a digital/nixie-style label, primary time/seconds, and smaller leading-zero byo-yomi period counter.
  - The timer panel uses a light background with subtle state accents instead of a dark display block.
  - Timer progress bars use shared state variables across themes: blue during main time, red when byo-yomi has 3 or 2 periods left, and a multicolor fill on the final byo-yomi period.
  - The compact `30s × 3` style is no longer used in the player info timer.
- Room action area:
  - 五子棋房间的普通操作区只保留和棋与认输；弃手、数子/死子标记、结果复核、技能按钮和技能预览入口均由模式配置或 `gameModeFamily(mode)` 隐藏/拒绝。房间创建系统消息按当前模式生成，五子棋会追加自动猜先的执黑提示。
  - Normal play shows regular action buttons below the board.
  - Draw requests, counting requests, dead-stone marking, and result review render in the main board action area through phase-aware `DecisionBar` controls.
  - Mobile dead-stone confirmation keeps `decision-bar` separate from the normal action-button grid: the copy column shows the title plus a two-line clamped hint, and `decision-actions` uses two equal-width confirm/reset buttons. `mobile-room.css`, `mobile-adaptive.css`, and Bright School mobile overrides must preserve this special layout so 375px/393px portrait docks do not stack the confirmation buttons awkwardly.
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

## 2026-05-27 Room Persistence Update

- Active and finished rooms are now snapshotted to the SQLite `PersistedRoom` table. Snapshot version 2 stores game state, players, clocks, chat, deadlines, close time, candy-effect settlement state, `unlimitedTime`, `privateOwnerUserId`, and optional `sigrikaCandyDuel` metadata, but does not persist live Socket.IO socket ids or spectators. Older snapshots hydrate those new fields with safe defaults. `server/roomStatePersistence.js` serializes asynchronous snapshot upserts per room code so a slower old write cannot overwrite a newer room state; `flushRoomPersistence(roomCode)` can wait for one room without blocking unrelated room writes, and `rooms.js` waits for that room's pending upserts before deleting its `PersistedRoom` row during close cleanup.
- Server startup calls `restorePersistedRooms(io)` after the socket layer is installed. Restored rooms restart their clock/opening/deadline/close timers, and players can reconnect through the existing `room:resume` flow.
- When a player socket disconnects, the room clears that player's `socketId` and records `disconnectedAt`. If both players are absent from an unfinished room for 5 minutes, the server marks the game as `invalid` with reason `empty-room`, skips `GameRecord` creation, deletes the persisted room, and removes the room from memory.
- Finished rooms keep the existing 5-minute review window. When the timer fires while any player or spectator socket is still attached, the server extends `closesAt` instead of closing the room. Only empty finished rooms are deleted.
- Valid finished rooms are also gated on result persistence: if `saveGameRecord()` fails or is still pending when the close timer fires, `server/roomCloseLifecycle.js` keeps the room in memory/persistence, retries the save after a short delay, and only emits `room:closed` / deletes `PersistedRoom` once `recordSaved` is true. Invalid finished rooms such as empty-room invalidations continue to skip record creation and may close through the shorter invalid close path.
- `src/main.jsx` handles `room:closed` payloads, clears the remembered room code, resets room UI state, and displays the payload message when present. Finished-room cleanup payloads carry `reason: "finished-room-close"` plus `roomCode`; player clients mark that result as dismissed and stay silent so the result modal does not reopen during cleanup.

## Mailbox API

- Player mailbox routes are authenticated under `/api`: `GET /mailbox/summary`, `GET /mailbox`, `POST /mailbox/:id/read`, `POST /mailbox/:id/claim`, and `DELETE /mailbox/:id`.
- Admin mailbox routes are authenticated and admin-only under `/api/admin`: `GET /mailbox/users`, `GET /mailbox/batches`, and `POST /mailbox/batches`.
- `server/mailbox.js` owns domain behavior. Admin sends create a `MailboxBatch`, deliver `MailboxMessage` rows to eligible users, and write an audit event with action `mailbox.send`.
- Player claims are manual. Coin claims write a `UserProgressLedger` row with reason `mailbox.claim`; item claims update the legacy owned item projection and the structured `UserItem` mirror through existing inventory helpers. `GET /mailbox` joins unique item attachment ids to the `ShopItem` catalog and returns `itemName` plus normalized `imageUrl`, with built-in recruitment metadata as fallback, so player UI never needs to expose an internal item id as the label.
- Global batches can target current users only or current plus future users. Future-eligible batches are materialized for a user when mailbox list or summary is read.
- `DELETE /mailbox/:id` soft-deletes by setting `MailboxMessage.deletedAt`. Player list, summary, capacity, read, and claim flows treat deleted rows as hidden, while future-batch materialization still uses them as delivery history to prevent deleted global mail from being recreated.
- `initializeServerData()` runs `ensureMailboxSchema()` during server startup so older local SQLite databases get the mailbox tables before the player or admin mailbox routes query them.
- `/api/auth/register` creates the new `User` and the single Aemeath welcome `MailboxMessage` in one Prisma transaction. The message has no admin batch, uses the fixed fan-club sender/title/body contract, and attaches one `aemeath-flight-snow-memorial-ticket`; a mail write failure rolls back account creation.

## Recruitment API

- `POST /api/recruitment/start` recognizes `aemeath-flight-snow-memorial-ticket` as an owned-only, player-shop-hidden fixed-result item. It checks merged legacy/structured Aemeath ownership before consuming the ticket, returns `好像已经没有可以用该道具招募的角色了` when no candidate remains, otherwise decides Aemeath immediately and creates the normal single active `RecruitmentTask` with an 11.25-second `readyAt`.
- `GET/PATCH /api/admin/recruitment-config` reads and persists the complete normalized recruitment configuration. Fixed-result copy lives at `fixedItemTexts[itemType] = { scopeLabel, resultText }`; blank or unknown-shaped values fall back to shared built-in copy. Player `GET /api/recruitment/status` continues to receive only the public timing/probability config plus each item's effective `scopeLabel`, while configured fixed-result `resultText` stays server-only until `POST /api/recruitment/start` snapshots it into the new task's `responseText`.
- The recruitment payload exposes stable cinematic metadata (`id`, theatrical countdown, sprite image, optional sprite sheet, flight sound, flash sound) without moving claim authority to the client. Normal client-side presentation completion does not call the interruption route and the task keeps its original server `readyAt`. A freshly created presentation anchors a separate display deadline to client response receipt so mobile request latency cannot shorten the authored five-second tail; reaching that display deadline changes only the client view to ready, while `/api/recruitment/claim` still rejects before server `readyAt`. `POST /api/recruitment/interrupt-cinematic` is authenticated and only accepts an active cinematic task; it shortens that task to the request time so refresh, tab hiding, page exit, or disconnection can skip directly to the ready state without replaying presentation. The claim route remains the only grant boundary and writes Aemeath through the existing legacy-plus-structured asset sync.
- `GET /api/recruitment` separates starter `items` from auxiliary `utilities`; `magic-clock` is always projected in `utilities`, including quantity zero. `POST /api/recruitment/fast-forward` accepts `{ itemType: "magic-clock" }` and is a production player action rather than a development shortcut. Its transaction rejects cinematic tasks, repeated use, missing inventory, and tasks with no more than the six-second authored presentation window remaining. An atomic `updateMany` on `fastForwardedAt: null` and the previous long `readyAt` lets only one concurrent request win; only that winner decrements inventory, mirrors structured assets, and receives `{ user, task, utilities }`.

## Announcement API

- 公告 API 只有登录后路径，没有未登录访客接口。玩家路由挂在 `/api`：`GET /announcements/summary` 返回全局与分 tab 未读摘要，`GET /announcements?kind=announcement|changelog&offset=&limit=` 返回已发布列表，`GET /announcements/:id` 返回详情，`POST /announcements/:id/read` 在打开详情后写入已读并返回新的未读摘要。
- 后台管理路由挂在 `/api/admin` 且走 `authHttp + requireAdmin`：`GET /announcements?kind=&status=all|published|draft`、`POST /announcements`、`PATCH /announcements/:id` 和 `DELETE /announcements/:id`。删除是软删除，普通后台/玩家列表均隐藏，没有恢复 UI。
- `server/announcements.js` 负责类型、状态、标题 80 字、正文 10000 字、发布正文非空、置顶只对公告生效、首次发布时间不可因编辑重置、审计日志和未读计算。编辑已发布内容不会重新触发未读；取消发布再发布保留首次发布时间。
- `initializeServerData()` runs `ensureAnnouncementSchema()` during startup so older local SQLite databases get `AnnouncementEntry` and `AnnouncementRead` before announcement routes query them.

## Story Script API

- Generic story script behavior lives in `server/storyScripts.js`. It validates the shared node graph shape (`startNodeId`, optional `initialBoard`, nodes, node `type`, node `effect`, `nextNodeId`, branch options, per-option `revealDelaySeconds` and `transitionDelaySeconds`), structured trigger fields, publish-time reachability basics, and trigger conflicts. Draft saves may be incomplete, but story/tutorial presentation fields are still normalized at the API boundary: node effects must be known values, option reveal delays and option transition delays must be blank or non-negative finite seconds, point-based tutorial nodes carry normalized `pointId`, `board-setup` nodes carry normalized node-local `boardSetup` plus scene fields (`playerColor`, `playerCharacterId`, `npcCharacterId`, `npcName`, `entryText`), and `skillId`/`skillCharacterId` are preserved for skill tutorial nodes. The same node JSON also preserves in-battle teaching fields such as `actor`, `actionStartDelaySeconds`, `replyDelaySeconds`, `manualContinueEnabled`, `autoContinueEnabled`, and `autoContinueDelaySeconds` for `npc-dialogue`, NPC action, player choice, and settlement nodes. Current admin authoring treats those booleans as one advance mode and writes automatic progression by default (`manualContinueEnabled: false`, `autoContinueEnabled: true`), or manual continuation as the inverse pair. The API keeps older boolean combinations round-trippable, while the player runtime resolves them to one active mode before deciding whether to show "continue" or run a timer. Blank `autoContinueDelaySeconds` means the NPC-dialogue product default of 1.5 seconds after typewriter completion in automatic mode, and 0 seconds for other automatic battle nodes. Publish requires non-empty nodes, a valid start node, unique node ids, story-node text, valid targets, resolvable skill ids for `player-skill`/`npc-skill` nodes, and at least one terminal node. Non-story tutorial nodes may omit dialogue text and use `prompt`, `color`, `pointId`, `skillId`, and `nextNodeId` as action metadata.
- Player onboarding routes remain under `/api` for compatibility. `GET /api/onboarding-story` now reads the published generic `StoryScript` with trigger `onboarding` and returns it with `autoEligible`; `POST /api/onboarding-story/auto-shown` records that the automatic presentation was shown, while `POST /api/onboarding-story/completed` records actual completion separately. `POST /api/onboarding-story/exited` atomically records the one-time welcome-mail toast marker only when the matching system-created mail exists. Closing or skipping a tutorial can clear future auto prompts without marking the tutorial complete, while close, completion, and skip all flow through the exit callback for the mail notice.
- Admin routes include the legacy onboarding compatibility endpoints plus generic story management under `/api/admin/story-scripts`. `GET /api/admin/story-scripts` lists draft/published script payloads, `GET /api/admin/story-scripts/:key` reads one script, and `PATCH /api/admin/story-scripts/:key` saves or publishes using `action: "save-draft" | "publish"`. The API accepts controlled `triggerType` and `triggerParams` fields; raw `triggerParamsJson` is rejected.
- Admin Excel export/import for story scripts is a browser-local authoring interchange layer over the existing admin payload. It does not add a workbook upload/parse endpoint; after a validated import changes the editor draft, persistence still happens only through the existing `PATCH /api/admin/story-scripts/:key` save or publish actions and their server-side validation.
- JSON parsing keeps the default `64kb` body budget for unrelated API traffic, while only `PATCH /api/admin/story-scripts/:key` receives a scoped `2mb` budget for growing draft graphs. `server/jsonBody.js` owns the route selection and parser limits. Requests beyond the selected budget return HTTP 413 JSON with `code: "REQUEST_BODY_TOO_LARGE"`; story-script failures use a localized message that names the `2mb` ceiling and recovery options instead of exposing Express's `request entity too large` text.
- `useInventoryItem()` applies the item business effect first. For character-target item use it then looks up a published `item-character-use` story with exact `{ itemId, characterId }` trigger params, interpolates whitelisted `{username}`, `{characterName}`, and `{itemName}` variables, and returns `storyScript` alongside the existing `effectText`. Missing scripts keep the legacy effect-text fallback.
- `initializeServerData()` runs `ensureStoryScriptSchema()`, then the onboarding compatibility schema guard, then `seedDefaultStoryScripts()`. The seed creates default onboarding plus rainbow-bean-candy scripts for Sigrika, Denia, Aemeath, and Lynae only when missing, and migrates an existing published legacy `OnboardingStoryScript` into `onboarding.default` when that generic key does not exist.
- 西格莉卡糖果篇章的恢复/续播 HTTP 边界也归 `server/commerceRoutes.js`：读取当前阶段脚本、确认黑化高潮、启动恢复剧情、完成恢复与开发环境取消普通糖果效果均在 `/api/items/rainbow-bean-candy/...` 下。服务器依据持久化 phase 选择第 1–8 次或胜负恢复起点，并使重复高潮/恢复请求幂等；客户端不能自行复位账号状态。

## Admin Analytics API

- 后台分析 API 挂载在 `/api/admin/analytics/*`，仍走现有 `authHttp + requireAdmin` 管线。
- `GET /api/admin/analytics/overview` 返回后台默认“今日简报”数据：总状态、2-5 条原因、`需要处理 / 值得关注 / 正常记录` 解读、今日登录/注册/对局、在线名单、时长榜、待处理反馈/举报、服务健康和最近审计日志。第一版优先从 `User`、`LoginSession`、`GameRecord`、`FeedbackMessage`、`UserReport`、`AdminAuditLog`、实时在线/房间/匹配队列和 `runtimeStabilityMetrics` 聚合；深度 IP/设备/历史异常事件仍不伪造。
- `GET /api/admin/analytics/operations?range=today|yesterday|7d|30d` 返回运营分析数据：日期范围、可读解读、活跃/注册/对局趋势、模式完成数、玩家粗分层、金币净变化、抽卡和招募任务数量。深度留存、经济来源拆分、完整异常事件和导出仍是后续扩展。
- `server/adminAnalytics.js` 是聚合边界；`server/adminRoutes.js` 只负责挂路由和注入 `onlineSessions`、`listActiveRooms`、`matchmakingCount`、`matchmakingCountsByMode` 等运行时读模型。

## Realtime Broadcast Stability

- `server/roomBroadcasts.js` declares `ROOM_BROADCAST_PERSISTENCE` as the code-level policy for persistence expectations: full room updates and default room patches force persistence, while clock and presence-patch categories remain lightweight/throttled.
- The policy is guarded by `server/roomBroadcasts.test.js` so future realtime changes can adjust room protocol shape without accidentally turning high-frequency clock or presence traffic into forced snapshot writes, or weakening forced persistence for authoritative lifecycle updates.
- `server/roomActionPhaseGuards.js` declares the gameplay action phase matrix before lifecycle dispatch: move/pass/skill require `playing`, resign is limited to `playing`, `counting-requested`, and `draw-requested`, and opening, skill-preview, marking-dead, result-review, or finished phases reject generic board actions before they can mutate state.
- Graceful shutdown uses `runtimeServiceState` and `installServerLifecycle()`: it enters drain, cancels pending lobby broadcasts, closes Socket.IO and HTTP, waits for queued room snapshots, stops process metrics, then disconnects Prisma under a 15-second deadline.

## Aemeath Derived Skill Realtime Contract

- `server/roomSkillResolution.js` resolves active skill requests through `effectiveSkillConfigForColor()` before calling shared game rules. This lets Aemeath's active slot become `voyage-star` after hidden-hand resolution while preserving the same socket action (`room:skill`) and pending-skill lifecycle.
- `voyage-star` pending previews include `effectType`, `targetId`, `affectedPointIds`, `erasedPointIds`, `secondaryRemovalIds`, `removedStones`, and fixed `musicTrackId`. The server has already executed the rule mutation before broadcasting the preview, so the Pixi layer uses these ids only for presentation and never recalculates removal legality.
- System skill messages accept the effective skill config for the resolved action. A derived Aemeath cast therefore uses the derived name/message instead of the original hidden-hand message, while replay reconstruction uses history metadata to keep the same erased points and removals deterministic.
# API Error And Session Reliability

- After all `/api` routers, `apiErrorHandler` converts uncaught domain failures into JSON with the original valid 4xx/5xx status and optional code. Unexpected production 500 responses use a generic message instead of exposing internal details.
- Authenticated requests still validate the persisted login session, but `lastSeenAt` is written at most once per five minutes per active session to avoid SQLite write amplification.
- Refresh token rotation is an atomic compare-and-swap on the old refresh-token hash. Concurrent refreshes with the same token can produce at most one successor token. Login/registration session replacement is independently serialized by `userId`, and its revoke + create sequence uses one Prisma transaction.
# 生产排空、动作交付与恢复

生产入口通过 `runtimeServiceState` 维护 `ready / draining` 状态。排空开始后，Socket 包级 guard 拒绝新的匹配、约战、聊天和权威对局写操作，但继续允许 `room:resume`，避免已在对局中的玩家被容量保护挡在恢复路径之外。新匹配和新观战还会受 `MAX_ONLINE_USERS`、`MAX_ACTIVE_ROOMS` 软上限约束；这些限制只控制接入，不主动关闭现有房间。

`game:action` 的可靠交付合同如下：

1. 客户端为一次用户操作生成稳定 `actionId`，在 4 秒未收到确认时以同一 payload 最多重试两次。
2. 服务端按房间和用户保存最近 64 个回执。首次执行后先把回执写入房间状态，再广播并返回 `{ ok, actionId, roomCode, revision }`。
3. 重复 `actionId` 不再次进入游戏状态机，只返回原回执；回执窗口进入持久化快照，因此进程重启后仍可去重。
4. 客户端不做本地乐观落子。确认耗尽时提示用户并请求 `room:resume`，最终始终以服务端完整快照和 revision 为准。

停机顺序是：进入 drain 并广播 `server:draining`、关闭 Socket.IO、关闭仍在监听的 HTTP server、停止智子云 GTP 会话、刷新所有 pending 房间快照、停止运行指标采样、断开 Prisma。15 秒仍未结束则以失败状态退出，让进程管理器记录并重启。`/health/live` 只表示进程存活；`/health/ready` 在 drain 时返回 503，供反向代理或编排系统停止发送新流量。

`server/serverProcessRestart.test.js` 使用独立临时 SQLite 和两个真实 Socket.IO 客户端，验证匹配、确认落子、受管优雅停机、同库重启和玩家房间恢复，不再只用页面刷新代替进程重启。

# 有界观战与大厅广播

单房首次观战接入受 `MAX_SPECTATORS_PER_ROOM` 控制，默认 20。`server/socketRoomEvents.js` 在产生加入副作用前返回明确“观战席已满”提示，`server/roomConnectionLifecycle.js` 在权威连接边界再次执行同一共享规则；已有观战者更换 Socket 重连不会占用新名额，也不会被全局软上限挡住。

`server/lobbyStatsBroadcaster.js` 把连接、断开、匹配加入/退出和约战完成触发的全局 `lobby:stats` 合并为 100ms trailing broadcast，并在 payload 与上次完全相同时跳过发送。新连接仍立即收到自己的初始统计；同一重连突发只产生有限的全局扇出。运行指标分别记录请求次数和实际发送次数，便于后台观察合并率。

房间创建先写入创建/模式系统通知，再完成一次初始强制持久化，最后只向两名玩家分别发送 `match:found`。后续资源 ready、opening/playing 转换继续通过已有权威房间更新传播；不再为刚创建且没有观战者的房间立刻发送第二份等价 `room:update`。

练习房继续使用同一 `match:found`、资源 ready、opening、权威 action ack、技能演出、数子和 `room:resume` 通路。新房的搜索在玩家设备运行，`practiceRoomAutomation` 跳过其 `play` 调度，仍处理提满阈值认输、求和、数子、死子确认和结果复核。三档新普通房都显式持久化普通提子阈值 22；旧 `beginner` 快照缺字段时保持 11，旧 `basic` 缺字段时为 22，`skillRemovals` 从不计入。吃子挑战赛使用自己的 100 手边界。

### 本地陪练引擎

`src/practice/` 负责模块 Worker、WASM 调用与对局控制器。入门复用 `src/shared/practiceBotDecision.js`；中级和高级／吃子挑战赛执行 GNU Go 3.8 level 5／10。浏览器先初始化再申请房间；中高级按需加载 `/engines/gnugo-3.8/gnugo.js` 与 `gnugo.wasm`，每手使用新实例但复用已编译模块，保持原生每手新进程的状态隔离。引擎 cache 8 MB，WASM 初始内存 64 MB、上限 256 MB；主线程看门狗在初始化 60 秒或单次搜索 30 秒后终止 Worker。计算异常重建后再试一次，仍失败则提示暂停／刷新；不降低难度、不自动转云端，也不通过机器人认输制造挑战成绩。入门最低出手间隔 1200 ms，中高级 650 ms，服务端同时检查。

`server/localPracticeEngine.js` 发放 60 秒计算租约：绑定用户、当前 socket、房间、随机 jobId 和完整 `game` 状态哈希，不能只依赖手数。服务端用 `practiceBotView(game, botColor)` 去除颜色伪装，再按原暗手可见性生成 SGF 与正式 `playMove` 合法点白名单；入门另发机器人视角规则状态。SGF 保持 `SZ[13]`、`KM[2.75]`、`RU[Chinese]`，中高级经 `restricted_genmove` 出招；无合法点直接 pass。娜波摩色彩幻象不改变机器人计算中的真实棋色；隐藏手、中立点和技能禁入按原投影／合法性契约处理。旧服务端准时宝使用相同视角，黑化西格莉卡仍走原专属投影。客户端只回 `{ jobId, positionVersion, action }`，服务器拒绝旧连接、旧局面、错误阶段、非法动作，以自身 bot 身份调用 `handleGameAction` 并广播。已接受 job 的重复回包只补成功 ACK，不再落子；客户端丢 ACK 时重发同一结果，不重新搜索。客户端成绩、计分或 bot 身份不可信；不做引擎防篡改或服务器重新搜索，这是本项目当前明确接受的取舍。

控制器前台联网时每 1.5 秒请求／续报当前状态。隐藏页主动报告 `active:false` 并终止 Worker，服务器撤销任务、暂停棋钟；心跳失联 10 秒也暂停，浏览器恢复后按当前状态重新计算。机器人思考不消耗棋钟；人类正常前台回合仍计时。连接尚在但连续 15 分钟未恢复时中性结束，不产生挑战赛成绩；断线房继续受原有空房回收约束。后台状态、租约和成功回执只存运行时；持久化仅保留执行后端，刷新、重新连接或服务重启均重新派工。

`scripts/build-practice-wasm.py --emsdk <path>` 固定 Emscripten 4.0.10 与 GNU Go 源码 SHA-256，从上游完整模式库构建，修正旧源码的重复 tentative definitions 及空数组排序指针下溢；不修改搜索算法。`public/engines/gnugo-3.8/` 随站点发布二进制、GPL 许可证、对应源码、构建脚本和摘要 manifest。Nginx 为引擎路径返回真实 404、正确 WASM MIME、gzip 和缓存再验证；CSP 增加 `wasm-unsafe-eval`，构建禁用动态 JS 求值。引擎变更须同步重建产物并提升 `LOCAL_PRACTICE_VERSION`。`npm run verify:practice-wasm` 校验产物并运行代表局面，`npm run test:e2e:practice` 验证生产 Worker／CSP、真实服务端落子、刷新恢复与下载失败。

历史快照缺少 `engineBackend` 时继续按 `server` 恢复：入门服务器启发式，GNU Go level 5／10／旧 basic level 1 仍有全局一个子进程、8 MB cache、3.5／5／2 秒超时与 busy 重试；连续三次非 busy 失败仍走旧局的明确认输策略。这些限制不再约束新本地房。原生 GNU Go 与生产路径预检仍为旧房恢复和黑化西格莉卡后备引擎保留。

西格莉卡黑化决战以 `sigrika-candy:duel-start` 从 `awaiting-duel` 创建或从 `duel-active` 续接唯一房间。若账号仍为 `duel-active`，但其房间号已无法解析为当前权威特殊房间，服务端不会把新局伪装成旧局续接：第一次请求只把账号条件回退到 `awaiting-duel`、清空旧房间号，并通过 `special_room_reset` ack 把新篇章状态同步给客户端；玩家再次点击后才创建新决战。当前单进程服务通过内存房间表保证全服最多一盘未结束特殊房，最终占用检查与同步注册之间不得 `await`；预加载、开场、正式对局、断线恢复和启动恢复后的 `PersistedRoom` 都继续占位。`sigrika-candy:duel-status` 只向黑化篇章用户返回 `available/owned/occupied`，`sigrika-candy:duel-watch` 只允许同类用户进入当前安全观战投影；普通观战列表与房间码加入路径继续隐藏特殊房。它复用练习房权威对局管线，但以 `matchSource="sigrika-corruption-duel"`、`rated=false`、`recordPolicy="replay-only"` 和 `sigrikaCandyDuel` 元数据单独识别：13 路、贴 2.75 目、随机执色、双方无正式技能、`unlimitedTime=false`，真人与西格莉卡？分别持有 `{ main: 1800, mainTotal: 1800, byoYomi: 0, periods: 0 }`，任一方归零按普通超时结算；求和、提子自动认输、聊天输入和测试工具保持禁用。该专属房是普通陪练“GNU Go 失败不降级”的唯一例外，`server/sigrikaDuelEngine.js` 在同一 NPC 回合优先调用智子云 KataGo，随后依次尝试 GNU Go level 10、level 5，再用正式合法性边界约束的入门启发式并最终安全 pass。结果持久化只创建一次可回放 `GameRecord` 并把账号推进到 `result-pending`，不调用普通奖励、段位、统计、任务或成就结算；恢复剧情完成后才统一复位账号篇章和糖果效果。

`server/zhiziKataGoEngine.js` 已实现该专属房的智子云优先路径：服务端使用 `ZHIZI_ACCOUNT_PHONE` 或 `ZHIZI_ACCOUNT_EMAIL` 加密码登录，固定申请 `--gpu-type vip-share --kata-name katago-TENSORRT --kata-weight 28bnbt`，以 Socket.IO v4 `/socket.io.v4` 的自定义 `ready` 事件进入串行 GTP。`roomCreationLifecycle` 在特殊房注册、持久化后立即非阻塞调用 `ensureAvailable()`；该预热完整覆盖登录、一次性 Socket token 申请、连接 `ready` 和 `kata-set-param maxTime`，但不重放棋盘或启动分析，也不延迟 `match:found`。引擎以单一 in-flight opening Promise 去重：第一手搜索若与预热并发，会等待同一个已配置会话，再同步当下权威局面，不会重复申请 VIP 共享实例；预热失败只由正常首手搜索重试/降级，未使用会话沿用 `ZHIZI_IDLE_TIMEOUT_MS`（默认 90 秒）回收。新会话按 `ZHIZI_SEARCH_TIMEOUT_MS` 下发 `kata-set-param maxTime`；该值默认且硬上限为 5000ms。每次搜索先发 `boardsize 13`、Chinese rules、`komi 5.5`、`clear_board` 并按完整 `move`/`pass` history 重放；内部贴目 2.75 是半目单位，转换为 KataGo 的 5.5。分析输出允许一条物理行包含多个 `info move`，候选解析并保留 visits、winrate、scoreLead、prior、order 与 pv。持续 `kata-analyze` 到时由客户端发送 `stop`，已流式返回的候选作为 `partial=true` 的成功智子结果继续选 Top-1；正常 5 秒截止不触发本机降级。整个窗口没有候选时不会再启动第二个完整搜索。全进程只保持一个远端会话和一个活动请求；连接失败仍可关闭旧会话、重新获取一次性 Socket token 并完整重放一次，最终无候选、断线或结果非法时，同一 NPC 回合才继续 GNU Go level 10、level 5、入门启发式和安全 pass。普通准时宝房完全不调用智子云。

同一适配器在玩家回合开始前做隐藏吻合度分析。开局前 20 个总手数不取样，随后只比较快照的下一次对应玩家普通落子；pass、至多两个合法点的强制局面、访问量不足、Top-2 目差与胜率近似等价、失效/错位快照都排除。普通信号要求最近 24 个有效落子满足 Top-1 ≥75%、Top-3 ≥92%、平均目损 ≤0.8、大失误至多 1 次和困难 AI 手至少 5 次，再由独立 6 手满足 5 次 Top-3、平均目损 ≤1.0 且单手不超过 3.0；极端信号严格按累计 35 个有效落子、Top-1 ≥90% 和困难 AI 手至少 6 次触发。困难 AI 手定义为 Top-1、policy prior 排名至少第 4 且相对 Top-2 领先至少 1.0 目。`sigrikaCandyDuel.aiAgreementAudit` 和待比较候选随 `PersistedRoom` 保存，`roomView` 只投影 `aiAgreementTriggered` / `aiAgreementEventSeq` 与当前净化后的 `presentation`，不发送比率、候选、胜率、目差、触发原因或内部演出阶段；触发仅作为剧情事件，禁止据此封禁或公开指控。

特殊决战的剧情由 `practiceRoomAutomation` 的持久化演出阶段串行驱动，并且优先于该回合的 NPC 落子：首次轮到黑化西格莉卡时显示“那么，让你看看才能的差距吧。”和无效果“秘日六席”；真实吻合度信号触发时依次显示“为什么你所展示的力量，和那个禁忌的来源这么像...”“我懂了......我懂了！那么你也是恶啊！”“行吧，那就用恶的方式来结束这令人失望的一局吧。”和无效果“七宗罪”。每一步只更新 `sigrikaCandyDuel.presentation`、单调序号、内部阶段和必要的剧情/技能系统记录，经完整房间广播持久化；普通 NPC 计算阶段不再追加“西格莉卡？正在思考。”的 `npc-thinking` 记录，清场后才进入原 NPC 决策链。它从不写 `game.pendingSkill`、skillUses/costs/removals、棋盘、回合、手数或胜负，因此两项技能目前完全没有游戏效果。恢复旧快照会从下一阶段继续，不重复已完成台词或额外落子。

Windows 本地运行按 `PRACTICE_ENGINE_PATH`、`%LOCALAPPDATA%\SigrikaGo\practice-engine\gnugo-3.8\gnugo.exe`、常见 `Program Files\GNUGo\bin\gnugo.exe`、系统 `PATH` 的优先级解析 GNU Go；开发者自行扫描和安装 Windows 二进制，仓库不提供自动下载器，也不在 `postinstall` 执行第三方程序。Linux 和生产仍固定以 `/usr/games/gnugo` 为默认值。

普通练习配置随 `PersistedRoom` JSON 快照保存；吃子挑战赛另有独立成绩表。`roomResultPersistence` 先处理吃子挑战赛的独立成绩，再对普通 `recordPolicy="none"` 直接把 `recordSaved` 置真且不创建 `GameRecord`、奖励或成长事务；`listWatchRooms()` 同时在内存和可选 read-model 路径过滤 `matchSource="practice"`。练习房仍计入 `listActiveRooms()`，因此受 `MAX_ACTIVE_ROOMS` 容量上限约束。


### 吃子挑战赛

- `practice:start` 在原参数上可加 `challenge: "capture-challenge"`，只接受高级难度。房间保持 Spark / practice / unrated / recordPolicy=none，另存随机唯一 `practice.challengeId`；该 ID 仅服务端使用。普通陪练与特殊决战不受影响。
- 挑战使用现有 `moveNumber`：双方落子、停一手、消耗手数的技能及额外落子均计数。普通动作和技能演出落地后，满 100 手立即结束，先完成该手提子再统计，不触发下一回合被动。连下剩余回合清空。数子在前端禁用并在服务端拒绝；开发测试工具同样拒绝。原 22 子认输不适用于挑战。
- 和棋申请及响应由客户端与服务端禁用；认输、超时、引擎异常等提前结束不上榜；可恢复断线沿用原手数。有效结束仅保存玩家 `captures`，不叠加 `skillRemovals`，不创建普通战绩、奖励、积分或段位变化。
- 结算在 SQLite 事务中保存幂等回执及个人纪录，名次 = 1 + 其他玩家最高提子数严格高于本次的数量。个人最高纪录仅在严格更高时更新角色与服装快照；打平保留首次纪录角色。历史最好名次取历次有效结算名次的最小值，首次成功完成即标记 breakthrough；后续仅严格超越历史最好名次才标记 breakthrough。结果提示使用红色双线印章和 280ms 盖章入场，减少动态效果设置下直接显示。
- 事务成功后才标记 `recordSaved` 并广播结果；失败沿用房间保存重试，过期但未保存的挑战房恢复时仍重试。回执固定首次计算的名次与突破标志，避免重连或重复保存重算。
- `GET /api/leaderboard?mode=capture-challenge` 返回每人一行最高成绩：`id`、`username`、当前星炬 `rank`、并列名次 `ranking`、`captures`、`recordCharacter` 和 `costumeSnapshot`。按提子数降序，用户名和段位不参与名次；同分以用户 ID 稳定展示，排名采用 1、2、2、4。无赛季，0 提子有效完成也入榜。
- 对局 header 展示当前手数 / 100 和提子；开局提示挑战规则。结算不判胜负、不播胜负／平局语音，显示“你这次提了x个子，位列总排名中的第x位，可喜可贺！”，突破时以主题红字显示“突破个人最高排名！”。榜单固定本人行仍展示最高提子纪录的当前名次。


## 队际赛协议与阶段生命周期

- `match:join({ mode: "team", lineup: [characterId, characterId, characterId] }, ack)`：服务端刷新身份，校验拥有、启用、糖果禁用与三个 ID 不重复；不足三名可用部员返回「需要至少拥有3名部员才能参加」。候选配对时再次核对在线候选阵容；模式使用独立 FIFO 队列，不开放好友约战。
- `team` 为独立可解析模式，棋盘、贴子、用时沿用星炬；不加入常规段位 `GAME_MODE_IDS`，避免创建队际赛段位与排行榜。观战和个人棋谱提供队际赛入口。
- 服务端 `player.teamLineup` 保存三个角色与服装快照，`room.team` 保存当前 `round` 和实际 `rounds[].startMove`。持久化包含完整阵容；网络投影只给本人完整阵容，对手及观战者只见已登场成员。未公开成员不包含角色 ID、配置或服装。终局统一公开。
- `advanceTeamRound()` 在正常落子／技能最终结算后、下一个被动开始前运行，广播前亦检查恢复后的阶段边界。全局 `moveNumber` 阈值固定为 40、80，不因前一轮连下顺延；存在 `extraTurn`、待结算技能或终局时不换人。双方同步换人，写入 `team-round` 棋谱事件，复用 `opening` 阶段及服务端 `openingEndsAt` 暂停棋钟五秒。
- 新角色从自身完整技能次数与未触发被动状态开始；清空旧派生技能；`teamRoundStartHistoryIndex` 限定禁先只扫描本轮主动技能。已有棋盘效果、累计超频、棋子、提子、轮次执棋方及双方剩余棋钟不重置。退场被动停止产生新效果，已有棋盘标记按原生命周期保留。
- Round 1 与猜先合并；每轮通过既有 `OpeningDuelPresentation` 展示双方当前角色与 Round 名。重连仅恢复剩余演出时间。参赛者本地播放当前己方角色的 `sortie` 出战语音，每轮去重，不叠加普通 `gameStart` 语音，不为观战或棋谱播放出战语音。
- `room.recordPolicy = "replay-only"`，结算保存 `mode/matchSource = "team"` 的完整终局快照，无用户奖励、积分、段位及角色战绩写入；个人统计和成就记录扫描排除队际赛。棋谱回放按 `team-round` 重建对应角色技能，避免用终局角色重放整局。
- 选人按照点击顺序入队，再次点击已选卡片取消，重新选择排到末位；浏览器按账号 ID 保存上次选择，重新进入过滤失效角色。匹配中由匹配遮罩阻止修改，取消后返回原阵容。立绘从左到右三等分，当前彩色，己方非当前灰色，对手候场问号；终局结算列出完整阵容与顺序。
- 入队校验期间收到取消请求时，该次异步入队作废；候场阵容重新校验失败则发出 `match:left`，客户端退出匹配遮罩。观战列表的用户角色信息同样只投影当前出场角色。
- 提前结束及双方离开五分钟的队际赛仍保存棋谱；保存失败时先重试再删除房间。重连演出沿用剩余期限，当前轮出战语音不补播，下轮正常播放。
- `npx playwright test --config tests/e2e/team-match.config.js` 构建实际组件及样式的独立测试入口，无需测试账号或数据库，检查桌面、390px、360px 竖屏的选人排序、三格立绘、灰度、保密占位及溢出。

- 队际赛换轮不切换 BGM：最新技能音乐按该技能发生阶段的阵容角色解析，不按换人后的当前角色解析；直到实际触发下一次技能或终局才沿用现有切换规则，重连同样从历史恢复。桌面三格立绘按容器高度放大、垂直居中、左右裁切并以略斜边界分隔，移动端维持原紧凑尺寸。选中卡片保留原有深色边框，取消外投影并使用浅绿色按下态；空阵容位不显示“选择部员”文字；右上角 1/2/3 实心圆采用细黑边、淡黄底、深黑数字。

- 回放列表不设模式切换页签：打开时锁定所属模式；`listReplaySummaryPage` 的星炬查询使用 `mode in [spark, team]`，共享时间/ID 游标排序，其他模式仍精确过滤。队际赛只用左上角旗子角标标识，不额外占用时间栏文字；回放列表内边距为外伸角标保留空间。

## Rank progression persistence

- `UserModeStats.stars` persists each mode independently; `User.stars/rank/rating` mirror spark. `rating` is zero below ninth dan. Room/user/profile/leaderboard projections preserve stars.
- `20260930090000_rank_stars` is an incremental migration, not a rewrite of deployed history. `migrateRankStars` runs after schema tasks, stores pre-reset user stats, legacy rating achievements and active room snapshots in a private SiteSetting receipt, preserves Nabomo ownership, then resets all three modes to third dan/two stars. Historical games, coins and earned achievements remain.
- Legacy rating-achievement conditions migrate to numeric rank thresholds using the former rating-to-rank mapping; new conditions use `rank`. Nabomo is permanently persisted on first spark sixth-dan settlement.
- Result saving shares concurrent requests for a room and restores in-memory user progression after transaction failure so a retry cannot award stars twice. Star/rank/point state writes atomically with the game record. Result payload includes `rankAfter`, `starsAfter`, `ratingAfter` and star delta; match history remains independent.

- 普通排行榜返回 `ranking`：段位、星数/九段积分、未舍入胜率、胜场数依次降序，四项相等采用竞争排名（1、1、3），用户名与 ID 仅稳定并列条目的展示顺序，不影响名次。


### 匹配等待计时

`match:waiting` 返回 `{ startedAt, serverNow, mode }`。两项时间均来自服务端，客户端接收时以 `receivedAt - max(0, serverNow - startedAt)` 生成本地开始时间，避免设备时钟偏差污染秒数及 15 秒放宽提示。自动重试保留原排队起点，新一轮匹配使用新起点；旧服务端缺少 `serverNow` 时兼容原时间字段。服务器队列和放宽定时器仍是权威。


### 无效对局与回放可见性

`saveGameRecord` 在所有模式分支之前检查 `game.winner.invalid`，无效结束仅标记结算已处理并清空结果奖励，不写入回放或成长记录。历史记录由 `replayValidity.isInvalidReplay` 解析保存快照中的同一标记，兼容旧的“对局无效”结果文本；不按手数或 `rated=false` 推断无效。个人与他人共用回放分页每批最多读取 51 条，读取快照仅用于有效性判断；跳过无效项后继续以原 createdAt/id 游标扫描，最多返回 50 条有效摘要和有效末项游标，响应不包含快照。管理员列表同样过滤，个人／管理员详情直接访问无效记录均返回 404。保留历史原始数据，不执行数据库删除或迁移。
