# 前端架构与状态边界

本文聚焦 React/Vite 前端、应用壳、路由、弹窗、状态同步、主题注册和前端模块拆分。新增前端入口、全局状态、主题注册或主要视图时优先更新本分篇。

## 当前结论

- `src/main.jsx` 只负责浏览器挂载；`src/app/App.jsx` 是应用组合根，状态通过 `src/app/*` hooks 逐步收口，应用级弹窗可见性由 `src/app/useOverlayState.js` 维护，房间/回放/结果弹窗会话状态由 `src/app/useRoomSessionState.js` 维护，匹配等待/成功过渡状态由 `src/app/useMatchSessionState.js` 维护，直连约战 incoming banner 状态由 `src/app/useIncomingDuelState.js` 维护。
- Direct-duel incoming banner state is isolated in `src/app/useIncomingDuelState.js`; `App.jsx` only wires `{ incomingDuel, setIncomingDuel }` into socket handlers and overlays so future lobby/social state does not add more transient state to the composition root.
- 玩家侧主题通过 `src/app/visualTheme.js` 和 `src/styles/themes.css` 维护注册与 CSS 入口。
- 公告中心作为应用级 overlay 注册在 `src/app/overlayRegistry.js`，入口位于大厅右上角工具栏和移动端折叠菜单；`src/app/useAnnouncementSummary.js` 在进入大厅、打开公告弹窗和详情标记已读后刷新未读摘要。
- 后台管理新增桌面端分析体验：`AdminOverview` 是默认“今日简报”，用可读总状态、原因、分级解读和下一步动作替代密集表格；`AdminOperations` 是运营分析页，先显示推荐解读，再用低密度 CSS 条形图和卡片展示活跃、注册、对局、分层、经济和模式表现。分析样式集中在 `src/styles/admin/analytics.css`，最终后台控件皮肤集中在 `src/styles/admin/polish.css`，用于统一浅色按钮、输入框、表格、tabs、危险操作和关闭按钮。
- 前端性能重点在启动预加载、房间快照结构共享、棋盘点位 memo、移动端布局合同。
- 首屏代码拆分从低频入口开始：`AppRoutes` 通过 `React.lazy`/`Suspense` 延迟加载后台管理台和剧情教学对弈路由，`AppOverlays` 延迟加载棋舍、履历、成就、个性化、仓库、排行榜、观战、好友、商店、招募、设置、公告、邮箱和留言板等业务 overlay；后台管理样式由 `src/admin/AdminConsole.jsx` 直接导入 `src/styles/admin.css`，剧情教学对弈样式由 `src/tutorial/TutorialBattleScreen.jsx` 直接导入 `src/styles/room/tutorial-battle-screen.css`，让这些低频 CSS 随 Vite async route chunk 加载；匹配等待/成功、结果、toast、约战 banner 和剧情播放器保持同步加载，以保护对局恢复、故事关闭和移动端返回路径。
- 应用根部由 `AppErrorBoundary` 包裹；`AppRoutes` 对 `view="room"` 但缺少 `room` 或 `user` 的瞬时恢复状态显示预加载恢复页，避免刷新/重连过程中空白渲染。`src/app/roomSnapshot.js` 在 socket full snapshot 进入 UI state 前补齐房间、棋局、聊天和观战者最小安全默认值，后续结构共享仍只比较同房间快照。

## 公共组件与状态管理

## 8. 公共组件与通用逻辑

### 前端公共组件

当前公共组件已从 `src/main.jsx` 按页面域逐步拆出，后台管理组件位于 `src/admin/AdminConsole.jsx`，对局页容器位于 `src/room/RoomScreen.jsx`：

- `AdminFieldLabel`: 带 title 提示的后台字段标签，位于 `src/admin/adminComponents.jsx`。
- `AdminSectionHeader`: 后台列表页标题、数量和主操作按钮，位于 `src/admin/adminComponents.jsx`。
- `AdminStatusPill`: 后台表格状态标签，位于 `src/admin/adminComponents.jsx`。
- `AdminOverview`: 后台默认概况页，呈现“今日简报”、四个答案卡片、`需要处理 / 值得关注 / 正常记录` 解读、在线名单、时长榜、分模式对局和服务健康摘要。
- `AdminOperations`: 后台运营分析页，支持日期范围 tab，优先显示推荐解读，再展示活跃、注册、对局趋势、玩家分层、经济摘要和模式表现。
- `Toast` / `ToastStack`: 自动消失提示队列，使用高对比渐变底色突出规则错误、非法操作等短提示；成功提示为绿色。金币、积分、段位变化不再走 toast 队列，避免回房间、回大厅或模式统计刷新时出现误导性数值提示。队列最多保留最新 5 条，避免高频操作造成页面卡顿。
- `ConfirmModal`: 通用确认弹窗。
- `WatchPad`: 观战房间号输入。
- `ReplayBar`: 回放进度控制。
- `PlayerInfo`: 对局双方信息。
- `Board`: 棋盘渲染与点击处理。
- `ChatBox`: 对局聊天浮动按钮与弹出面板。
- `SkillBanner`: 技能演出浮层。
- `ResultModal`: 对局结果弹窗；当前用户是房间玩家时展示本局积分与金币变化。结果弹窗在当前视口水平/垂直居中，桌面默认宽度为视口 50%、高度为视口 40%，避免覆盖整条棋盘区域。
- `TestTools`: 对局测试按钮组，当前包含随机布局和恢复技能，集中封装以便未来下线。

### 前端通用函数

- `api`: HTTP JSON 请求封装，位于 `src/api/client.js`，默认带请求超时和 AbortController 兜底，避免启动恢复、目录读取或站点设置请求在服务器重启期间永久 pending。
- `adminApi`: `/api/admin` 请求封装，位于 `src/api/client.js`。
- `uploadPortrait`: 上传角色立绘，位于 `src/api/client.js`。
- `findCharacter`: 从角色 map 或 fallback 中解析角色。
- `derivePlayerRecordStats` / `recordWinnerColor`: 位于 `src/shared/gameRecords.js`，前后端共用棋谱胜负与战绩推导逻辑，优先基于 `winnerColor` 结构化字段，旧记录回退到 `resultText` 文本前缀。
- `resultRewardDelta`: 位于 `src/shared/resultRewards.js`，集中维护结果奖励差值，供后端持久化与前端结果展示共用；积分胜 `+20`、负 `-20`、和 `0`，金币胜 `+50`、负 `+20`、和 `0`。
- `buildCharacterDraft` / `characterDraftToBody`: 位于 `src/shared/adminDrafts.js`，后台角色表单数据转换。
- `validateShopItemDraft` / `decorationDraftToBody`: 位于 `src/shared/adminDrafts.js`，后台商城/装饰表单校验。
- `DEFAULT_SITE_SETTINGS`: 位于 `src/shared/siteSettings.js`，前后端共用大厅标题、副标题、设置关于文本、首页 footer 文本、加载页提示语集合和角色加载台词集合默认值。
- `lastMarkedAction` / `canPreviewSkillTarget`: 位于 `src/shared/boardView.js`，用于统一棋盘最后落子/技能标记与技能预览判定；普通落子和反色技能会成为最新落子标记来源。千咲 `liberty-purge` 虽然会实际落子，但该落子使用专属 `liberty-purge-stone` 持续红光，不复用最新落子红圈。
- `SKILL_EFFECT_CATALOG` / `skillEffectTargetRule` / `skillEffectSoundCues`: 位于 `src/shared/skillEffectCatalog.js`，集中维护技能 `effectType` 的管理端标签、默认目标规则、主动/被动分类、棋盘演出标记和音效 cue。管理端角色表单、服务端角色校验、技能归一化、目标预览和技能音效都应从该 catalog 读取这些元数据。
- `flip-stone` 使用 `BoardSkillEffects` 的 Pixi 泡泡演出，但其 pending skill resolution delay 在 `src/shared/skillPresentation.js` 中单独设为 `3040ms`，早于默认 `4000ms`。这样服务端权威反色快照会在泡泡黑化并遮住目标棋子时广播，爆裂后露出的已经是反色后的棋子。
- `row-slash` 是主动技能类型，注册为短生命周期 Pixi `boardEffect` canvas，目标规则为 `any-point`。服务端 pending skill preview 会附带 `row`、整行 `affectedPointIds`，以及直接被移除棋子的 `removedStones`（id/color）；`BoardSkillEffects` 在技能横幅后播放仇远青白水墨刀光：两道竖向贯穿预兆刀光（第一道自上向下、第二道自下向上扫过，角度在 -30 到 30 度间确定性随机，扫完后留存到主刀光收势时一起淡出）、左侧墨锋起势、从左到右的 1.8 格高主刀和随 x 坐标推进的切子光屑。预兆和主刀都不再绘制浅蓝透明厚波纹，而是以白色直刃线为核心，先叠低透明青白渐变边光增加厚度，再叠加深青墨、灰蓝墨和飞白短段形成不规则水墨涂抹边缘。`BoardRowSlashOverlay` 仍然是持久刀痕的 DOM owner，并在主刀起势时让最终 `.board-row-slash` 以超出棋盘两侧的长度跟随 Pixi 主刀光从左向右裁切展开；casting 刀痕使用 `--row-slash-cast-delay` 和 `--row-slash-cast-duration`，分别来自当前 `boardEffectDurationMs` 的 0.19 和 0.22，使波浪形 DOM 刀痕与 Pixi 横劈同步从左到右出现；刀痕起点略向下偏移，使倾斜刀痕的视觉中点交合目标行中线；`Board` 同步给受影响行棋子添加 `row-slash-cut-pending` 和按棋盘宽度比例计算的 `--row-slash-cut-delay`，使棋子在主刀扫到时快速消失。持久标记来自结算后的 `game.rowEffects`，继续由同一 DOM/CSS overlay 渲染，并通过 `clearAfterColor` 在对手下一次行动后清除。Pixi canvas 和 DOM overlay 始终为 `pointer-events: none`，不改变棋盘点击区域。
- `BoardSkillEffects` 的技能演出合同是不降级的真实 Pixi canvas：严格 CSP 下 `src/room/pixiPrewarm.js` 先加载 `pixi.js/unsafe-eval` 再加载 `pixi.js`，`preparePixiEffect()` 在 Pixi app 初始化成功后立即把 `.board-effects-canvas` 挂到 overlay host，renderer asset preload 继续作为独立 promise 受监控，不能阻塞 canvas 挂载。`playRegisteredBoardSkillEffect()`、asset preload、ticker callback 或 renderer 输入校验失败时只标记 `data-effect-failed` / `data-effect-error` 并清理 overlay，保持 React 房间不白屏；没有 DOM/CSS 替代动画，准生产稳定性测试必须看到真实 `.board-effects-canvas` 才算技能演出通过。
- `COLORS` / `opponent`: 位于 `src/shared/gameConstants.js`，集中维护棋色常量与对手颜色推导；`src/shared/game.js` 保持同名转导以兼容既有调用方。
- `createPoints` / `getPoint` / `activeNeighbors`: 位于 `src/shared/gameBoard.js`，集中封装棋盘几何和点位访问；`src/shared/game.js` 保持同名转导以兼容既有调用方。
- `collectGroup`: 位于 `src/shared/gameGroups.js`，集中封装棋子连通块和气的遍历；`src/shared/game.js` 保持同名转导以兼容既有调用方。
- `createScoringState` / `prepareScoringState` / `markDeadGroup` / `toggleNeutralPoint` / `resetDeadMarks` / `scoreGame`: 位于 `src/shared/gameScoring.js`，集中封装数子阶段状态和终局计分；`src/shared/game.js` 保持同名转导以兼容既有调用方。
- `normalizeSkillConfig` / `skillRequiresExistingStone` / `skillUsesBoardConfirmation` / `skillUsesBoardSurfaceConfirmation`: 位于 `src/shared/gameSkills.js`，集中封装技能配置归一化、棋子依赖判定和确认式无目标技能判定；`src/shared/game.js` 保持同名转导以兼容既有调用方。
- `executeRegisteredSkill` / `skillConsumesTurn`: 位于 `src/shared/gameSkillRegistry.js`，集中封装主动技能 `effectType` 到执行 handler 的分发与回合消耗判定。
- `ACTIVE_SKILL_HANDLERS` / `executeActiveSkillHandler`: 位于 `src/shared/gameSkillHandlers.js`，集中维护当前具体主动技能 handler；`src/shared/game.js` 保留规则状态和兼容转导，新增主动技能应优先扩展 handler/registry 契约。
- `createResignResult` / `createTimeoutResult` / `createDrawResult` / `resultWithInvalidFlagForGame`: 位于 `src/shared/gameResults.js`，集中封装对局结果 payload 与早期无效局标记；`src/shared/game.js` 保持同名转导以兼容既有调用方。
- `formatStones`: 位于 `src/shared/stoneFormatting.js`，集中封装子数整数/分数显示；`src/shared/game.js` 保持同名转导以兼容既有调用方。
- `canStartSkill`: 位于 `src/shared/game.js`，前后端共用技能启动前置条件，用于判断棋子目标/棋子依赖技能在当前棋盘状态下是否可用。
- `rememberPlayerRoom` / `buildRoomResumeRequest` / `handleRoomResumePayload` / `rememberDismissedResultRoom` / `dismissedResultRoomAfterResume`: 位于 `src/app/resumeSession.js`，集中封装前端断线恢复 localStorage 与结果恢复状态编排；`src/app/useRoomMemory.js` 只记住未结束的 active player room，并在尚未进入 active room 的 `match-preloading` 阶段记住 pending match room code，使刷新后 socket `room:resume` 能找回仍在资源准备中的房间。有效 finished 房间不会写回 `sigrika-last-room-code`；玩家关闭结果弹窗或退出 finished 房间时会写入 `sigrika-dismissed-result-room-code` 并清除 last-room，已被用户关闭过的同房间有效结果在后续 `room:resume` 中保持 dismissed，不会重复打开结果弹窗。
- `useOverlayState` / `OVERLAY_STATE_KEYS`: 位于 `src/app/useOverlayState.js`，集中维护商店、抽卡、棋舍、仓库、履历、排行榜、好友、观战、设置、公告中心、邮箱、留言板和通用剧情播放器等应用级弹窗可见性，避免 `App.jsx` 继续堆叠成组 `useState(false)`。
- `modalDismissal`: lives in `src/app/modalDismissal.js` and owns the shared topmost-modal dismissal contract. Desktop Escape and browser/mobile history back close only the current top modal; app overlays, result/match-waiting modals, and the home match-mode picker should use this shared mechanism instead of local keydown/popstate listeners. When no modal is active, the mobile root-back guard intercepts phone/browser back on login, preload, home, admin, and room screens and shows the shared confirm modal with “确定要退出游戏吗？” before allowing the browser to leave the app.
- `modalDismissal` 的 root-back guard 只响应真实父级回退。功能窗口通过关闭按钮或取消按钮主动关闭时会清理对应 history 哨兵并压制同次 `popstate`，避免误弹退出确认；手机回退关闭功能窗口时同样只关闭最上层窗口。用户在退出确认中点“退出游戏”会先尝试跨过 guard/history 哨兵回退，若浏览器没有可回退页面则跳转到 `about:blank` 作为离开游戏页的兜底。
- `useRoomSessionState` / `roomSessionView`: 位于 `src/app/useRoomSessionState.js`，集中维护 `room`、`pendingSkill`、`replayStep`、`dismissedResultRoom` 和派生的 `resultModalOpen`，避免结果弹窗可见性在路由、覆盖层和背景音乐间重复计算；对局者关闭某一房间结果后，该房间号会作为去重哨兵阻止同一有效结果再次显示。
- `useMatchSessionState` / `matchSessionView`: 位于 `src/app/useMatchSessionState.js`，集中维护 `matchStart`、`matchSuccess` 和派生的匹配等待/过渡标记，避免匹配弹窗、socket 同步和背景音乐各自维护过渡状态。
- `replayRoomAt`: 用历史记录重放房间状态；观战实时回放另由 `replayGameAt` 只派生棋盘进程。Aemeath's `voyage-star` replay path restores erased points, the center crater marker, recorded removals, and skill cost directly from history metadata instead of rerunning live derived-skill availability checks.
- `lastMarkedAction()`: latest-action board rings include ordinary moves, flip-stone, Aemeath hidden-hand placement, and Voyage Star's source point. Voyage Star's erased source does not draw a stone ring, but it still becomes the latest action so the previous ordinary move is not highlighted after the skill resolves.
- 音频相关：`loadAudioSettings`、`playStoneSound`、`playSystemVoice` 路由、`preloadVoiceSound`、`playPreloadedVoiceSound`、`speakText`。

### 后端通用逻辑

- `publicUser`: 用户公开字段白名单，并返回模式级 `modeStats.{spark,standard,gomoku}`，其中包含 `rating/rank/recentResults/wins/losses/draws`。
- `applyRankProgression`: 位于 `src/shared/rankProgression.js`，前后端共用的段位升降级规则。胜负局会更新当前模式窗口，胜 7 盘升段/级、负 8 盘降段/级，并在触发后清空窗口。
- `makeAuth`: HTTP 鉴权与管理员中间件。
- `validateCharacterInput`: 角色/技能输入校验。
- `toCharacterPayload`: 角色公开 payload。
- `validateShopItemInput` / `validateDecorationInput`: 商城与装饰校验。
- `getPublicSiteSettings` / `updateSiteSettings`: 站点配置读取、清洗、持久化和审计写入；当前公开配置包含 `homeTitle`、`homeSubtitle`、`aboutText`、`footerText`、`preloadTips`、`characterLoadingLines` 与技能特效开关。
- `buildLeaderboard`: 排行榜统计。
- `ratingDeltaForResult`: 根据 `winnerColor` 计算玩家积分变化；胜方 +20、负方 -20、和棋 0。
- `safeUploadFilename`: 上传文件名清洗。
- `writeAudit`: 后台审计日志写入。
- `DEFAULT_SKILL_SYSTEM_MESSAGE` / `SKILL_MESSAGE_TOKENS`: 前后端共用的技能系统消息默认模板与占位符列表。
- `gameResultMetadata` / `recordWinnerColor`: 后端通过 `server/gameRecords.js` re-export 共享棋谱结构化结果逻辑。
- `prepareCandyEffectUpdates` / `candyEffectData`: 位于 `server/roomItemEffects.js`，集中封装有效局后的糖果道具效果清理和持久化更新数据。
- `applyResultRewardsToRoomUsers` / `applyUserReward`: 位于 `server/roomRewards.js`，集中封装对局结果奖励写回房间内存用户的逻辑。
- `persistRoomState` / `roomPersistenceSnapshot` / `hydratePersistedRoom`: 位于 `server/roomStatePersistence.js`，集中封装房间快照生成、恢复、快照版本保护和节流持久化。
- `createPendingSkillResolution` / `pendingSkillResolutionDelay`: 位于 `server/roomSkillResolution.js`，集中封装技能预览延迟结算快照和恢复后剩余延迟计算。
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
- 登录 access token 只存在 React 内存状态中；`src/app/sessionState.js` 初始进入 `preloading`，由 `src/app/App.jsx` 调用 `/api/auth/refresh` 尝试从 `HttpOnly` refresh cookie 恢复登录。恢复失败或刷新请求超时才进入登录页，避免服务器重启期间把玩家永久停在资源准备页。
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
  - 结束房间保留 5 分钟复盘窗口；如果关闭计时到期时仍有玩家或观战者 socket 留在房间，服务端会顺延关闭时间，避免在线查看结果的人被踢回大厅。
  - 结束房间真正无人连接后才关闭并从内存删除；`room:closed` 会携带 `reason: "finished-room-close"` 和 `roomCode`，前端据此把该房间结果标记为已处理，避免结果弹窗再次打开。

## 相关详细记录

## Frontend Module Extraction Update


- App audio runtime state now lives in `src/app/useAudioRuntimeState.js`; it owns local audio settings, persistence, and the socket-reconnect audio resume signal so `src/app/App.jsx` keeps less playback-specific state wiring.

This update reduces the highest-payoff frontend coupling without changing user-facing behavior.

- Character display helpers now live in `src/shared/characterDisplay.js`.
  - `findCharacter` centralizes DB character plus built-in fallback merging.
  - `withCharacterSystemVoices` centralizes the runtime bridge from skill voice assets into character `systemVoices`.
- System voice playback now lives in `src/audio/systemVoicePlayback.js`.
  - `playSystemVoice` resolves role/system voice events, plays preloaded audio when available, and falls back to TTS text.
  - `src/main.jsx` no longer owns the system voice resolver/playback wrapper.

## Aemeath Derived Skill Frontend Contract

- Aemeath hidden-hand derived skills are centralized in `src/shared/derivedSkills.js`. Room UI reads `effectiveSkillConfigForPlayer`, `effectiveSkillDisplayForPlayer`, and `effectiveSkillUsesForColor` so the action bar, player skill chip, board target preview, and character detail surfaces can swap from the base hidden-hand skill to the active derived skill without copying skill-state logic into React components.
- `voyage-star` is treated as a no-target board-surface confirmation skill. `skillUsesBoardSurfaceConfirmation()` keeps its action flow aligned with ChangLi `double-move`: the skill button can stay visible but disabled while the source hidden hand is missing, exposed, or no longer owned by the caster.
- Admin character drafts keep derived skill text and overclock in the base skill `params.derivedSkills` JSON through `buildCharacterDraft` and `characterDraftToBody`. The hidden-hand editor exposes two derived fields for Aemeath now, while the JSON shape is a list so future character derived skills can reuse the same draft and validation path.
- Low-coupling modal components have been extracted from `src/main.jsx` into `src/modals/`.
  - `MessageBoardModal.jsx`
  - `SettingsModal.jsx`
- `WatchModal.jsx`
- `LeaderboardModal.jsx`
- `HouseModal.jsx` owns the player manual/profile modal, owned character grid, decoration application controls, personal replay dialog, and per-character record dialog.
- `ShopModal.jsx` owns the 扎希拉商店 modal, category tabs, fixed 8-slot item grid, purchase flow, item ownership state, and shop mascot/item preview rendering.
  - Its non-component constants and pure helpers live in `src/modals/shopModalHelpers.js`, so the component module keeps a Fast Refresh-compatible export shape.
- `GameLifecycleModals.jsx` owns the matching, match-success countdown, opening color prompt, and result/reward modals. `AppOverlays` keeps the match-success countdown visible on the current screen first; only `matchSuccess.countdownComplete` may move a still-`preloading` match into the battle preload route, so resource readiness cannot skip the countdown. It also exposes pure countdown, color-label, and signed-delta helpers covered by `GameLifecycleModals.test.js`.
  - `FeedbackModals.jsx` owns the generic confirm modal, toast stack, and direct-duel request banner. Its duel countdown/progress helpers and toast queue limiting are covered by `FeedbackModals.test.js`.
  - `SkillBanner.jsx` owns the skill burst overlay and skill-cast voice trigger. The helper that prevents duplicate or empty voice playback is covered by `SkillBanner.test.js`.
  - `StoneDecorationPreview.jsx` owns reusable black/white decoration previews for house and shop surfaces.
- Room view helpers now live in `src/room/roomView.js`.
  - The module owns replay view reconstruction, room member list shaping, coordinate labels, board line geometry, preview eligibility helpers, scoring term text, and timer/message formatting helpers.
  - These helpers are covered by `src/room/roomView.test.js` so runtime-only room view dependencies are easier to catch.
- Low-coupling room UI components have started moving from `src/main.jsx` into `src/room/`.
  - `RoomScreen.jsx` owns room-level derived state, replay/spectator projection, room header game info, per-room sound effects, skill/opening modals, and layout composition for the full battle screen.
  - `src/room/roomView.js` owns `replayRoomAt()` reconstruction. Skill histories that record `removedByColor` by removed-stone color are converted through shared `captureCreditOwner()` before accumulating replay `game.skillRemovals`, and neutral colors are ignored, so replay skill-removal counters display the credited black/white owner once instead of inflating with raw stone colors.
  - `TimeBar.jsx` owns the player timer/digital display panel. It exposes `main-time`, `warning-byo-yomi`, and `final-byo-yomi` state classes so all themes can share the same timer-track color contract: main time is blue, byo-yomi with 3 or 2 periods left is red, and the final remaining period is multicolor. The timer keeps the existing room layout and track sizing; tutorial/no-character work must not add centering overrides to `.digital-timer`, `.timer-digits`, or `.timer-track`.
  - `ChatBox.jsx` owns the room chat anchor button, optional trailing room-side action, left/up popover, scroll-to-bottom behavior, outside-click/Escape collapse behavior, and chat submission UI. The collapsed chat badge counts only player chat messages (`type === "chat"`) so system notices, skill notices, disconnect notices, and other non-player messages do not inflate the visible count. The desktop room keeps chat as a compact side-column tool group with the room exit button immediately to the chat button's right so the board action bar only contains game actions; opening chat renders the history/input panel from the tool group's bottom-right anchor. Mobile dock chat uses the same component and lets the popover overflow the dock instead of increasing the board layout height. Chat names and message bodies keep `pre-wrap` plus emergency word breaks so long text, URLs, and unspaced input wrap inside the popover on desktop and mobile.
  - `PlayerInfo.jsx` owns player portrait, rank/rating tags, timer, captures/cost display, result badge, desktop skill detail popover, and mobile tap explanations for removal/overclock/skill labels. The mobile tap tooltip is anchored near the tap point, uses a fixed viewport-contained width with normal wrapping and emergency word breaks, clamps horizontally by its maximum width, flips below the tap near the top edge, and caps height with internal scrolling so explanation content cannot leave the viewport. The overclock/cost counter uses `cost-stat` and is forced to red text across themes, including broad theme reset layers. Skill detail panels and stat hover/click tooltips consume the desktop room floating-layer z-index variable, so the most recently hovered, focused, or clicked player tip can rise above chat and member popovers instead of relying on a fixed z-index.
  - `RoomPeopleList.jsx` owns the fixed-height room member list and member action popover. Clicking a member records the click coordinates and opens a fixed-position action panel from that point toward the upper right, matching the room chat popover behavior instead of expanding inside the scrollable member list. The popover uses the shared room floating-layer z-index variable in both base CSS and Bright School theme overrides, so whichever of chat, skill tips, stat tips, or member actions was opened/interacted with last renders in front. It uses a light theme-matched paper/backdrop panel behind the action buttons, while unavailable actions, including self-targeted social actions and the currently unimplemented private-chat action, must be real disabled buttons and render as gray across themes.
  - `ActionBar.jsx` owns spectator replay controls, normal player actions, test tool buttons, and phase-aware decision bars. It is memoized with `areActionBarPropsEqual()` so close-countdown or room-clock-only parent renders do not repaint the action controls; the comparator tracks rendered action state such as phase, turn ownership, skill uses, locks, opponent connectivity, scoring reference, replay step, and callback identity instead of full player timer objects or unused request deadlines.
  - `ScoringBreakdown.jsx` owns the formatted counting formula/result breakdown used by hints and result-review controls.
  - `Board.jsx` owns board grid rendering, coordinate labels, stones, move numbers, scoring marks, skill effect markers, decorated stone images, the latest-move red stone outline, and board point events. The latest-move outline is centered on the stone as an independent square/circular marker so decorated stone art cannot stretch it into an oval.
  - `Board.jsx` renders intersections through memoized point buttons. `arePointButtonPropsEqual()` compares only visible point state, point identity, pointer-handler refs, and interaction capability flags; event functions are read through a stable `handlersRef`. The board-level comparator intentionally re-renders when handler identities change so `handlersRef.current` is refreshed, while the point buttons keep the same ref object and do not all re-render. `useRoomPointActions()` returns `useCallback`-stable point handlers and depends on the current player color instead of the full player object, so ordinary clock ticks do not churn board click handlers. `RoomBattleStage` also passes named stable callbacks into `Board`, `ActionBar`, and memoized room widgets, avoiding inline handler churn on parent renders. `RoomScreen` keeps pass/resign/exit confirmation handlers and coordinate/move toggles `useCallback`-stable, and the finished-room close countdown timer lives inside `RoomHeader` so header countdown ticks do not re-run the full room screen or recreate action-control props. Timed draw/counting/result request toasts depend on `timedRoomRequestEffectKey()` instead of the whole room object, avoiding request-toast effect work on clock-only player time updates. Because those intersections are real `button` elements layered above the SVG grid, shared board CSS and Bright School board guards must explicitly reset them to transparent, no appearance, no border/shadow, zero min-size, and `touch-action: none`; otherwise global button skins can cover the grid and make the board look blank.
  - `Board.jsx` renders board grid strokes from `buildBoardLines()`, which emits continuous row/column runs instead of one segment per cell. This avoids uneven internal stroke joins and keeps first-line corners connected; invalid intersections still split only the affected row/column run. The `.board-lines` SVG is a gameplay layer rather than ordinary media, so shared CSS and Bright School guard layers pin it to `display: block`, full width/height, no max-size cap, visible stroke, and visible opacity to survive global `svg` media resets.
  - `Board.jsx` marks first-line board grid runs with `edge-line`; CSS keeps every non-edge grid run at one uniform stroke width and renders every first-line run exactly 2.5x that width in the Bright School theme.
  - `Board.jsx` derives `erasedBoundaryGeometry()` from invalid intersections and renders a pointer-transparent `.erased-boundary-layer` above the SVG grid but below point buttons. Each erased point first shades the surrounding in-bounds board cells gray; the geometry then merges those gray cells and draws only the outer outline with the same stroke weight as first-line grid runs, so shared edges inside the gray area do not receive thick boundary strokes. Shared board CSS and Bright School repairs keep the desktop and mobile presentation aligned.
  - Board stones use deterministic visual jitter for a more physical game feel: each stone gets stable `--stone-offset-x/y` values in one random direction from the intersection. Spark mode keeps a maximum 1px offset; standard mode uses a maximum 0.5px offset on both desktop and mobile because 19-line stones are smaller. The underlying `.point` button, game logic, scoring marks, and target previews remain centered on the original intersection.
  - `OperationHint.jsx` owns phase-aware text hints and compact scoring breakdown display under the opponent-side panel.
- Current remaining frontend debt:
  - `src/app/App.jsx` now owns App-level state assembly and passes props into extracted routes, overlays, action hooks, socket hooks, preload hooks, theme/audio hooks, and persistence hooks; `src/main.jsx` is now a thin mount entry.
  - `src/room/RoomScreen.jsx` now delegates the three-column battle tree to `src/room/RoomBattleStage.jsx`; future room work can focus on replay/spectator projection helpers and smaller room-state hooks rather than moving raw JSX.
  - Server room view serialization now lives in `server/roomView.js`, socket broadcast delivery lives in `server/roomBroadcasts.js`, room runtime persistence/broadcast adapters live in `server/roomRuntime.js`, participant/online-state queries live in `server/roomPresence.js`, matchmaking queue state lives in `server/roomMatchmakingQueue.js`, room initial-state creation and user mode projection live in `server/roomFactory.js`, skill system-message formatting lives in `server/roomSkillMessages.js`, generic system message mutation lives in `server/roomSystemMessages.js`, room action point validation lives in `server/roomActionValidation.js`, room close/empty-room lifecycle lives in `server/roomCloseLifecycle.js`, room deadline scheduling lives in `server/roomDeadlineScheduler.js`, room result persistence lives in `server/roomResultPersistence.js`, room timer bookkeeping lives in `server/roomTimers.js`, item effect cleanup lives in `server/roomItemEffects.js`, room-user reward application lives in `server/roomRewards.js`, room snapshot persistence lives in `server/roomStatePersistence.js`, persisted-room restore orchestration lives in `server/roomPersistenceRestoreLifecycle.js`, room opening transition lives in `server/roomOpeningLifecycle.js`, skill preview lifecycle and pending skill resolution live in `server/roomSkillResolution.js`, per-room clock tick lifecycle lives in `server/roomClockLifecycle.js`, restored-room timer resume decisions live in `server/roomRestoreLifecycle.js`, room socket connection lifecycle lives in `server/roomConnectionLifecycle.js`, counting/draw/scoring request entry validation lives in `server/roomRequestLifecycle.js`, room creation orchestration lives in `server/roomCreationLifecycle.js`, gameplay action entry routing lives in `server/roomActionLifecycle.js`, chat entry mutation lives in `server/roomChatLifecycle.js`, room read-model projection lives in `server/roomQueries.js`, clock timing calculation lives in `server/roomClockTiming.js`, standard move/pass/resign side effects live in `server/roomGameActions.js`, and counting/draw/scoring room mutations live in `server/roomScoringFlow.js`, so `server/rooms.js` can focus more narrowly on real-time room lifecycle, action routing, and persistence triggers.
  - `src/admin/AdminConsole.jsx` has split its shell and major tab bodies; high-value follow-up targets are now the remaining skill contract/replay compatibility wrappers inside `src/shared/game.js`, the real-time lifecycle/broadcast boundary inside `server/rooms.js`, and the remaining voice/cache subdomains in `src/audio/playback.jsx`.

## Recent Home, Shop, And Board UI Adjustments

- The former home/house entry is now split into a clickable player plaque that opens “履历” for profile stats/replays and a “部员手册” entry for character and decoration management.
- The home match description is “13路，数子规则，黑贴2又3/4子，用时5分钟30秒3次”.
- The home player plaque uses a light rank/rating tag with dark text. Admin management uses the same circular icon-plus-title layout and sizing pattern as the home utility buttons.
- The shop keeps fixed 8-item pages, but its visual grid now adapts to available width and height; the item area scrolls inside the modal while tabs and pagination stay visible, with a compact landscape layout for short viewports.
- Friend list action buttons expand as a full-width horizontal action row with evenly aligned button columns.
- The resume stats for rating and coins use the same help-tip pattern as rank: rating explains +20/-20/0 changes; coins explain +50/+20/0 rewards.
- Counting request is disabled while the board has no stones.
- Main-time timer digits use a gray display color, while byo-yomi states keep their warning colors.
- Board grid strokes use continuous SVG row/column runs with square line caps and geometric precision rendering so internal lines do not appear as uneven stitched segments, and first-line corners stay visually connected. The fixed contrast rule remains shared across themes: all ordinary grid runs share one stroke width, first-line grid runs render at exactly 2.5x that width, and erased-point boundary lines reuse that first-line weight while gray cell fills show the removed intersection's affected area. Skill targeting highlights use a gradient glow instead of a solid outline. Stones affected by skill states use darker, higher-opacity green/purple halo rings so the effect reads clearly against the wooden board.
- Latest room/home refinements:
  - Desktop home footer text is rendered as a `main.home-screen` sibling HUD element and protected by the final theme safety layer as viewport-fixed at the lower-right corner, so it stays at the bottom of the desktop window while the lobby stage scrolls on shorter heights. The mobile Bright School footer remains part of normal document flow below the lobby content.
  - Desktop room headers keep the message/settings/move/coordinate controls in a right-aligned control group before the room-exit button, rather than floating around the middle of the header. Room exit buttons use a shared light-blue treatment on desktop and mobile; in the Bright School desktop header, the exit button keeps the same dark outline shadow as the adjacent room control buttons. Duplicate exit buttons beside desktop chat and inside the replay bar are removed so the header remains the single desktop room-leave entry. Replay step counters center their `current/max` text, desktop chat popovers, skill detail panels, stat hover/click tips, and room member action popovers share a dynamic room floating-layer stack where the latest interaction renders in front, and the capture/removal/overclock chips share a stable height.
  - The home player plaque rank/rating chip uses a light background with dark text again, while the admin-only management button remains a green circular icon-plus-title control aligned with the home user plaque.
  - The home screen uses a compact anime game-menu layout: the top strip contains a larger site title, the fixed subtitle `连罗伊人的都爱玩的智力游戏`, the gray-white online-count pill, and settings/message/logout/admin actions; the footer strip reads from configurable `footerText`, whose default lines are the site title, `Copyright ©KURO GAMES. ALL RIGHTS RESERVED.`, and `浙ICP备2026035038号`. The middle stage is an unframed fixed-ratio coordinate surface (`1480 / 620`) that scales as one piece instead of letting the two large image buttons fight the page flow. Desktop keeps the original wide-stage rule with a `1200px` minimum, `503px` minimum height, and `1920px` maximum width; phone landscape uses a smaller `960px` by `402px` minimum stage, while phone portrait renders the home stage as a single-column scrollable flow instead of an orientation guard. The home app shell uses `/assets/home/multipurpose-classroom-bg.webp` as a fixed full-viewport background, then layers blur, saturation, translucent gradients, and glassy top/footer strips over it for a frosted classroom feel. The player plaque, `部员手册`, `星炬对弈`, and 3x2 utility toolbox are absolute-positioned by percentage inside the desktop stage; the player plaque is slightly larger with wider internal spacing, shows rank and rating on one line, shares the utility toolbox's left edge, `部员手册` is offset slightly right/down from the toolbox edge, and `星炬对弈` remains the dominant right-side entry. The manual and match buttons use their source image aspect ratios as full-size clickable boxes so the visible artwork stays inside the hover/click target. The match entry no longer renders a hover/focus text popup or mode tickets below the artwork; full mode titles, rule copy, current matchmaking counts from `lobbyStats.matchmakingCounts`, and confirmation live in the click-open mode picker. Image-entry hover moves and rotates only the image child layer with small transform values, while a masked `::before` layer uses the same PNG alpha channel to show a solid aqua shadow translated down and right; this avoids large transparent-PNG filter/drop-shadow repaint costs while keeping the requested shadow look. The match-entry PNG has transparent borders after low-alpha background cleanup, avoiding faint square-edge artifacts on wide desktop browsers. All non-image controls share a hover/focus cue of slight upward movement, a blue outline ring, and a subtle brightness/saturation lift so users can clearly see the target they are about to choose. Utility toolbox buttons contain only an icon and main title, preserving the same target size on compact desktop and phone portrait layouts.
  - Desktop Bright School home polish removes the former `LOBBY_ROOM` debug/status pill from the top strip, keeps the current-user plaque on an explicit avatar/name/stats grid so the username cannot run into the portrait at wide sizes, and overrides the `部员手册` sticker label back to the rounded UI font stack with nowrap text for consistency with the rest of the interface.
  - The home current-user plaque now opens the cross-device `履历` modal. `履历` owns personal record, rank, coins, embedded selected-mode character records, recent ten-game results, and replay access, while `部员手册` is reduced to character deployment/details plus stone decoration selection on both desktop and mobile.
  - Incoming direct duel requests play a short synthesized doorbell SFX on the effects channel before showing the request banner; duplicate `requestId` payloads are filtered in the socket handler so reconnect/retry delivery does not replay the banner or sound.
- The house/player manual record stat is clickable and opens a per-character record list for owned characters. Personal manual stats use the full current-user replay summary set, including black/white user ids, while leaderboard stats also use all `GameRecord` rows, so win/loss totals stay aligned even after a player has more than 30 records or changes username. On mobile, the per-character record list is a viewport-contained nested dialog with a scrollable list; each record row keeps the total/win/loss/draw text on one line.
  - The house/player manual decoration picker renders owned decorations as icon-plus-status buttons with accessible labels and hover titles: decoration names stay out of the visible chip, while `应用` / `应用中` / `使用中` remains visible.
  - Player info now separates captures, skill removals ("除子"), and skill cost. Skill removals count opponent stones removed or converted by skills for the side that benefits from the removal/conversion.
  - Skill follow-up cleanup counts stones removed by skill-created no-liberty states as skill removals instead of normal captures, so "提子" remains only ordinary capture count.
- Room headers include live game context after the room number using separate chips: black player/rank, white player/rank, and current move count.
- The room number itself is rendered as a light-gray rounded chip so it reads as part of the same header metadata system.
- The first-line board grid stroke is locked to exactly 2.5x the ordinary grid stroke, theme overrides preserve the same ratio, and the grid is generated as long horizontal/vertical runs rather than per-cell pieces.
- Finished rooms with `closesAt` now show a red header chip countdown such as `关闭倒计时 4:59`; the actual closure still comes from the server `room:closed` event.
- The watch entry now opens `WatchModal`, a refreshable current-room list backed by `GET /api/rooms/watch`, instead of asking the user to type a room code. Rows include room code, online participant count, black/white character portrait plus username, move count, and playing/finished status, and clicking a row joins that room as a spectator.
- The watch modal is sized for the full room list table without horizontal scrolling on desktop and keeps enough vertical space for five room rows even when the list is empty. Watch table headings and row cells are centered.
- Spectators leaving a room use the explicit `room:leave` socket event. The server removes that socket from `room.spectators`, leaves the Socket.IO room, appends a spectator-leave system message, and broadcasts the updated room so room members and the watch list no longer count that spectator.
- The leaderboard modal keeps the title area and column heading outside the scrolling region. The player rows scroll independently, and a bottom pinned row mirrors the current user's own ranking when that user appears in the leaderboard. The heading and row cells share one CSS grid template on desktop, while the heading and pinned row reserve the same end gutter as the scrollable list so Windows scrollbars do not shift the data columns away from their labels. On phone-width layouts the heading is hidden and each row becomes a compact card with rank/avatar/player/score lanes; the rank badge and portrait stay small, the username/rank block is left-aligned, rating is the dominant right-side value, and the right metrics lane shows both win rate and explicit win/loss/draw chips. The pinned current-user row uses the same compact card contract as list rows, and the phone table grid reserves only an auto-height row for that pinned block.
- `roomView.players[]` now carries `connected` and `disconnectedAt`. Player disconnects add a system notice and show a centered `断线中` badge on that player's portrait until the player reconnects or the game finishes; reconnecting appends a reconnect system notice and clears the badge. Disconnect, reconnect, spectator join/resume, and room leave broadcasts use lightweight `presence:update` patches for existing participants; the socket that just joined or resumed still receives an authoritative `room:update` first, then the continuous patch advances its revision.
- While an opponent is disconnected, player action controls that require opponent confirmation, currently counting and draw requests, are disabled on the client.
- Once a game is finished, room players use the same spectator role as observers in both server room views and frontend effective role handling: the action bar switches to replay/spectator controls, player-only hints/actions are hidden, and leaving the finished room clears the former player's live `socketId` from the room so watch-list online counts drop correctly.
- The game-start system voice is only played for active player views in `playing` phase. Spectators and finished-room viewers do not replay historical `game-start` messages when joining through the watch list. Socket reconnects mark the next live player room snapshot with `__audioResumeBaseline`, and duplicate reconnect snapshots with the same room/history/chat key keep that marker so the server's immediate authoritative `room:update` plus following `presence:update` patch cannot overwrite the baseline before `RoomScreen` mounts and accidentally replay old `game-start` chat.
- User profile cards keep the hero, aggregate stats, "角色战绩" title, and footer actions fixed inside the modal; only the character record rows scroll.
- Login/preload recovery now preserves an unfinished `room:resume` result. If the socket recovers an active room while assets are still preloading, startup preload does not cover the recovered room with the generic `preloading` route and the preload completion guard does not force the user back to the home screen. If the recovered player room is still in `GAME_PHASES.preloading`, the socket handler rebuilds a countdown-complete pending match and routes to `match-preloading` so the battle preload screen can load room assets and emit `room:preload-ready` again after a refresh.

## Login Asset Preloading

- Frontend deployment helpers live in `src/shared/preloadAssets.js`.
- Socket.IO now connects to `window.location.origin`, so the deployed site can run behind `https://sigrika.fun` without a hard-coded localhost socket endpoint.
- `src/app/gameSocket.js` sets explicit mobile-friendly recovery options for the game socket: reconnect indefinitely, retry quickly, cap reconnect delay at 3 seconds, and fail the initial handshake after 6 seconds so a weak mobile network can recover instead of waiting on the default long timeout. It creates Socket.IO clients with `autoConnect: false`, installs all resume/reconnect handlers first, then calls `socket.connect()` and immediately queues one idempotent `room:resume`; this prevents a fast production same-origin connection from firing `connect` before handlers are registered and prevents mobile transport timing from making refresh recovery depend on one `connect` callback.
- Vite development proxy forwards `/socket.io` websocket traffic to the local backend, keeping the same-origin socket path usable in development and production.
- Vite development proxy also handles expected `/socket.io` websocket disconnect errors such as `ECONNRESET` and `ECONNREFUSED` quietly. These are normal when `dev:server` restarts the backend with `node --watch`; unexpected proxy errors still emit a concise warning.
- After a valid token is confirmed, the app enters a `preloading` view before the home screen.
- Fresh login enters `preloading` before the home screen, preventing the home screen from flashing before assets begin loading. Stored-token startup is intentionally disabled so refresh and browser restart return to the login screen.
- The preload step fetches non-replay runtime assets after login, but it is now split by startup criticality. Critical preload waits for current character portraits, home entry/background imagery, and common board/UI effect sounds before the app can leave the preload screen. Shop imagery, candy/effect previews, stone decoration images, result/match sounds, configured BGM tracks, character skill voices, and system voices stay in the same asset manifest but load as deferred background work with a concurrency cap so first entry to the home screen is not blocked by the full music/voice library. Replay lists and replay details remain lazy data requests so opening the app does not prefetch historical game records.
- Preload failures are non-blocking: failed or hanging asset loaders are ignored after a bounded per-task timeout so users are not trapped on the loading screen if a single critical or optional resource stalls during reconnect, server restart, or cache recovery.
- Startup preload is independent from transient Socket.IO client instances. `useStartupPreload()` must not receive `socket` or include a socket object in its dependency list; token/session state cleanup will tear down the socket through the socket lifecycle hook, while preload continues exactly once for the confirmed token.
- The preload screen uses a character portrait hop plus progress bar, with a short minimum display duration to avoid a visual flash on cached loads. `AssetPreloadScreen` reads `siteSettings.characterLoadingLines` as `characterId=line` rows for the main loading line, uses a random catalog character for post-login preload, and uses the current player character for battle preload; the spinner remains only as an image-missing fallback. It also reads `siteSettings.preloadTips`, parses one non-empty tip per line, shows one random tip below the progress bar, and on the post-login preload view rotates the random character portrait, character loading line, and tip together every 10 seconds while the view remains open; fixed-character battle preload keeps the player character stable and only rotates tips. `showTips={false}` is reserved for flows that must reuse the same loading template but suppress random hints, such as tutorial-battle entry and exit transitions with fixed copy. The loading panel itself stays borderless and transparent in both the base layer and the final Bright School safety layer, uses full-viewport centering, and lets the character line plus tip text wrap inside the shared preload width so mobile and desktop keep the same no-frame loading treatment without adding a solid middle panel background.

## Board Effect Theme Guard

- Bright School board guards keep `.board-row-effects` transparent and overflow-visible, and keep `.board-row-slash` plus its `::before`/`::after` highlights as the only painted slash elements. This protects the DOM-only `row-slash` overlay from the theme firewall's generic `[class*="row"]` paper surface and pseudo-element rules, which otherwise can cover the grid and stones with a blank panel or flatten the slash into a plain bar.
- Chisa's `.liberty-purge-removal-mark` is centered on each point button with `left/top: 50%` and `translate(-50%, -50%)`; its `::before` and `::after` bars own the rotation. Shared board CSS and the Bright School guard both keep the mark saturated red `#ff1733`, visible above stones, and pointer-events-none so it remains a purely visual removal history marker.
- No-target active skills that confirm through the board surface use the same one-click contract on desktop and mobile. `skillUsesBoardSurfaceConfirmation()` covers Baconbits `random-blast`, ChangLi `double-move`, and Aemeath `voyage-star`; `useRoomPointActions` routes point-button clicks for those skills to `{ type: "skill" }` without a `pointId`, clears local targeting, and skips mobile double-tap confirmation. `canPreviewSkillTarget()` still returns false for `targetRule: "none"`, so these release confirmations never paint hover target or ordinary placement preview markers.

## Achievement And Personalization Frontend

- `src/app/useOverlayState.js` 将 `achievements` 和 `personalization` 纳入应用级弹窗契约；`AppOverlays` 在履历弹窗之外挂载 `AchievementModal` 与 `PersonalizationModal`，并把履历标题区的“成就”“个性化”按钮作为入口。
- `AchievementModal` 通过 `/api/achievements` 读取玩家成就列表，按“未达成 / 已达成 / 全部”三种 tab 过滤。桌面端使用三列表格语义呈现成就名、内容和奖励；移动端 CSS 将同一行降级为单列卡片，未达成使用灰底，已达成使用浅黄底。达成时间不作为常驻列展示，玩家点击已达成的成就行时，前端在点击位置显示达成时间浮窗。
- `PersonalizationModal` 通过 `/api/me/achievement-equipment` 读取可装备的成就奖励资产，并允许装备称号、徽章和用户名背景。桌面端为三列装备区，移动端改为竖向分区；保存后回写当前 `user.achievementEquipment`。弹窗内预览区使用共享 `UserIdentity` 组合草稿装备，作为保存前试穿效果；装备按钮用粉红色标出当前已保存生效项，用浅绿色标出草稿中正在试穿但尚未保存的项。
- 商城、抽卡、仓库使用道具和首页 `/api/me` 刷新都会消费响应里的 `achievementUnlocks`，逐条触发 `achievement` tone toast；toast 样式仍由现有 `ToastStack` 队列统一管理。
- 后台 `AdminConsole` 新增 `achievements` tab，`AdminAchievements` 使用“成就列表 / 奖励资产”双视图；成就列表只编辑既有成就的成就名、成就内容、奖励资产和排序，不提供新增或下线成就入口，奖励资产视图继续管理 `/api/admin/achievement-reward-assets`。

## Mailbox UI

- The player mailbox is mounted as an app-level overlay through `src/app/useOverlayState.js`, `src/app/modalDismissal.js`, `src/app/AppOverlays.jsx`, and `src/modals/MailboxModal.jsx`.
- `src/app/useMailboxSummary.js` polls `GET /api/mailbox/summary` while a user session is active and refreshes again when the mailbox opens. `src/app/useRecruitmentReadyState.js` owns recruitment ready polling plus the readyAt timeout refresh. The app composition root consumes both hooks instead of hosting feature-specific polling loops.
- `MailboxModal` owns list/detail selection, marks a message read when selected, and calls the player mailbox APIs for manual claim and delete. It reports successful coin or item claims through the existing toast and user-refresh paths.
- Admin mailbox management is a first-class admin tab. `AdminConsole` loads recent batches and item options, `AdminShell` owns the tab label, and `AdminMailbox` provides user search, target mode selection, one optional attachment, send submission, and recent batch history.
- Any new app-level overlay must be added to `src/app/overlayRegistry.js`. `useOverlayState`, `modalDismissal`, `useOverlayActions`, and `App.jsx` derive visibility props, setter props, close-all behavior, and topmost-modal dismissal from that registry. The shared `closeAllOverlays()` callback is invoked by socket lifecycle paths such as `match:found` before recording the match-success transition, so overlay registration is a matchmaking stability contract on both desktop Escape and mobile/browser back paths.

## Story Player Frontend

- `src/modals/StoryPlayerModal.jsx` is the reusable player-side story renderer for onboarding, item-character interactions, and future teaching scenes. `OnboardingStoryModal.jsx` is now a compatibility wrapper that passes onboarding labels into the same player.
- `src/app/overlayRegistry.js` registers `storyPlayer` as the generic application-level overlay. It is ordered above warehouse, so Escape and mobile/browser back close the story first and keep the underlying warehouse open. Legacy `onboardingStory` remains registered for compatibility, but new story playback uses `storyPlayer`.
- `src/app/useOnboardingStory.js` owns the onboarding lifecycle. Auto display waits for an authenticated user on the `home` view, fetches `/api/onboarding-story`, closes other overlays before opening the generic story player, and posts `auto-shown` once. Manual replay uses the same fetch path through `openOnboardingStory()` but does not mutate the auto flag.
- `useWarehouseInventory()` treats a returned `storyScript` from item use as the preferred success presentation: the item effect has already been applied and inventory/user state updated, then the generic story player opens above the warehouse. If no script is returned, the warehouse keeps the legacy `effectText` result panel.
- `src/modals/OnboardingStoryModal.jsx` is the shared story player for auto, manual, and admin preview. It renders the active node with a vertical stage layout, a centered portrait/speaker block without a separate title/subtitle header, a large text region, typewriter reveal, text-click skip-to-end, delayed options, next/finish navigation, and a secondary skip confirmation dialog. The right-top pure-icon fast-forward button opens the skip confirmation and replaces the ordinary close button in playable stories. Character lookup accepts admin-stored character ids or display names and reads `portraitUrl`, `portrait`, or `imageUrl` so draft scripts still show portraits when content editors select or paste a character name. During node handoff, the player keeps the modal shell mounted and resolves a parent-swapped `startNodeId` before paint, so unified tutorial story segments do not briefly render the empty-state modal between ordinary story nodes.
- `HomeHeader` exposes the manual “引导” action in both the desktop top-right toolbar group and the compact mobile menu. `HomeScreen` and `AppRoutes` pass that callback from the app composition root rather than letting the header fetch feature data directly.
- `AdminOnboardingStory` adds a top-level admin tab for the singleton script. The editor is form-based rather than raw JSON, covering start node, node ids, speaker/character, text, next-node links, and branch options, with an embedded preview rendered through the same `OnboardingStoryModal` component.

## Announcement Center UI

- `AnnouncementModal` 挂载在 `AppOverlays`，玩家只通过已登录会话访问 `/api/announcements*`。父弹窗固定默认打开“公告”tab，内部列表每次加载 20 条并用“加载更多”追加；切换 tab 不清除已读状态。
- 公告和更新日志都使用新闻式列表行：标题、首次发布时间、未读红点，公告额外显示置顶标签。点击列表行会在父公告窗口内部挂载 `nested-modal-backdrop` 二级详情弹窗，详情遮罩绝对定位到父窗口边界内，保持父窗口列表仍在背后挂载而不是被详情内容替换或被全屏遮罩覆盖；只有详情打开并成功调用 `POST /api/announcements/:id/read` 后才清除本条和全局未读摘要。
- `MarkdownLiteContent` 是公告正文的安全 Markdown-lite 渲染边界，只支持段落、保留换行、无序列表、加粗和 `http/https` 链接，不使用 raw HTML。
- 后台“公告管理”由 `AdminAnnouncements` 提供一个顶级 admin tab，内部再分“公告 / 更新日志”子 tab 和 `全部 / 已发布 / 草稿` 状态筛选。编辑区桌面显示编辑+预览双栏，移动端通过“编辑 / 预览”切换同一内容；发布、保存草稿、保存修改、取消发布和软删除都是显式按钮。
