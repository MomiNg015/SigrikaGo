# 前端架构与状态边界

本文聚焦 React/Vite 前端、应用壳、路由、弹窗、状态同步、主题注册和前端模块拆分。新增前端入口、全局状态、主题注册或主要视图时优先更新本分篇。

## 当前结论

- `src/main.jsx` 只负责浏览器挂载；`src/app/App.jsx` 是应用组合根，状态通过 `src/app/*` hooks 逐步收口，应用级弹窗可见性由 `src/app/useOverlayState.js` 维护，房间/回放/结果弹窗会话状态由 `src/app/useRoomSessionState.js` 维护，匹配等待/成功过渡状态由 `src/app/useMatchSessionState.js` 维护。
- 玩家侧主题通过 `src/app/visualTheme.js` 和 `src/styles/themes.css` 维护注册与 CSS 入口。
- 前端性能重点在启动预加载、房间快照结构共享、棋盘点位 memo、移动端布局合同。

## 公共组件与状态管理

## 8. 公共组件与通用逻辑

### 前端公共组件

当前公共组件已从 `src/main.jsx` 按页面域逐步拆出，后台管理组件位于 `src/admin/AdminConsole.jsx`，对局页容器位于 `src/room/RoomScreen.jsx`：

- `AdminFieldLabel`: 带 title 提示的后台字段标签，位于 `src/admin/adminComponents.jsx`。
- `AdminSectionHeader`: 后台列表页标题、数量和主操作按钮，位于 `src/admin/adminComponents.jsx`。
- `AdminStatusPill`: 后台表格状态标签，位于 `src/admin/adminComponents.jsx`。
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
- `DEFAULT_SITE_SETTINGS`: 位于 `src/shared/siteSettings.js`，前后端共用大厅标题、副标题、设置关于文本和首页 footer 文本默认值。
- `lastMarkedAction` / `canPreviewSkillTarget`: 位于 `src/shared/boardView.js`，用于统一棋盘最后落子/技能标记与技能预览判定；普通落子、反色技能和千咲 `liberty-purge` 这类实际落子的技能都会成为最新落子标记来源。
- `SKILL_EFFECT_CATALOG` / `skillEffectTargetRule` / `skillEffectSoundCues`: 位于 `src/shared/skillEffectCatalog.js`，集中维护技能 `effectType` 的管理端标签、默认目标规则、主动/被动分类、棋盘演出标记和音效 cue。管理端角色表单、服务端角色校验、技能归一化、目标预览和技能音效都应从该 catalog 读取这些元数据。
- `row-slash` 是主动技能类型但不挂 Pixi `boardEffect` canvas，目标规则为 `any-point`。服务端 pending skill preview 会附带 `row` 和整行 `affectedPointIds`，前端 `Board` 以 `BoardRowSlashOverlay` 渲染一条贯穿棋盘外缘的破碎横向刀痕，并由 CSS `row-slash-strike` 动画完成斩击展开；持久标记来自 `game.rowEffects`，通过 `clearAfterColor` 在对手下一次行动后清除。该 DOM overlay 为 `pointer-events: none`，且 `BoardSkillEffects` 对这类 DOM-only 预览直接返回 `null`，避免任何整棋盘效果层覆盖棋盘网格、星位和棋子。
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
- `rememberPlayerRoom` / `buildRoomResumeRequest` / `handleRoomResumePayload` / `dismissedResultRoomAfterResume`: 位于 `src/app/resumeSession.js`，集中封装前端断线恢复 localStorage 与结果恢复状态编排；已被用户关闭过的同房间有效结果在后续 `room:resume` 中保持 dismissed，不会重复打开结果弹窗。
- `useOverlayState` / `OVERLAY_STATE_KEYS`: 位于 `src/app/useOverlayState.js`，集中维护商店、抽卡、棋舍、仓库、履历、排行榜、好友、观战、设置和留言板等应用级弹窗可见性，避免 `App.jsx` 继续堆叠成组 `useState(false)`。
- `useRoomSessionState` / `roomSessionView`: 位于 `src/app/useRoomSessionState.js`，集中维护 `room`、`pendingSkill`、`replayStep`、`dismissedResultRoom` 和派生的 `resultModalOpen`，避免结果弹窗可见性在路由、覆盖层和背景音乐间重复计算；对局者关闭某一房间结果后，该房间号会作为去重哨兵阻止同一有效结果再次显示。
- `useMatchSessionState` / `matchSessionView`: 位于 `src/app/useMatchSessionState.js`，集中维护 `matchStart`、`matchSuccess` 和派生的匹配等待/过渡标记，避免匹配弹窗、socket 同步和背景音乐各自维护过渡状态。
- `replayRoomAt`: 用历史记录重放房间状态；观战实时回放另由 `replayGameAt` 只派生棋盘进程。
- 音频相关：`loadAudioSettings`、`playStoneSound`、`playSystemVoice` 路由、`preloadVoiceSound`、`playPreloadedVoiceSound`、`speakText`。

### 后端通用逻辑

- `publicUser`: 用户公开字段白名单，并返回模式级 `modeStats.{spark,standard,gomoku}`，其中包含 `rating/rank/recentResults/wins/losses/draws`。
- `applyRankProgression`: 位于 `src/shared/rankProgression.js`，前后端共用的段位升降级规则。胜负局会更新当前模式窗口，胜 7 盘升段/级、负 8 盘降段/级，并在触发后清空窗口。
- `makeAuth`: HTTP 鉴权与管理员中间件。
- `validateCharacterInput`: 角色/技能输入校验。
- `toCharacterPayload`: 角色公开 payload。
- `validateShopItemInput` / `validateDecorationInput`: 商城与装饰校验。
- `getPublicSiteSettings` / `updateSiteSettings`: 站点配置读取、清洗、持久化和审计写入；当前公开配置包含 `homeTitle`、`homeSubtitle`、`aboutText` 与 `footerText`。
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
  - `TimeBar.jsx` owns the player timer/digital display panel. It exposes `main-time`, `warning-byo-yomi`, and `final-byo-yomi` state classes so all themes can share the same timer-track color contract: main time is blue, byo-yomi with 3 or 2 periods left is red, and the final remaining period is multicolor.
  - `ChatBox.jsx` owns the room chat anchor button, optional trailing room-side action, left/up popover, scroll-to-bottom behavior, outside-click/Escape collapse behavior, and chat submission UI. The collapsed chat badge counts only player chat messages (`type === "chat"`) so system notices, skill notices, disconnect notices, and other non-player messages do not inflate the visible count. The desktop room keeps chat as a compact side-column tool group with the room exit button immediately to the chat button's right so the board action bar only contains game actions; opening chat renders the history/input panel from the tool group's bottom-right anchor. Mobile dock chat uses the same component and lets the popover overflow the dock instead of increasing the board layout height.
  - `PlayerInfo.jsx` owns player portrait, rank/rating tags, timer, captures/cost display, result badge, desktop skill detail popover, and mobile tap explanations for removal/overclock/skill labels. The mobile tap tooltip is anchored near the tap point, uses a fixed viewport-contained width with normal wrapping and emergency word breaks, clamps horizontally by its maximum width, flips below the tap near the top edge, and caps height with internal scrolling so explanation content cannot leave the viewport. The overclock/cost counter uses `cost-stat` and is forced to red text across themes, including broad theme reset layers. Skill detail panels and stat hover/click tooltips consume the desktop room floating-layer z-index variable, so the most recently hovered, focused, or clicked player tip can rise above chat and member popovers instead of relying on a fixed z-index.
  - `RoomPeopleList.jsx` owns the fixed-height room member list and member action popover. Clicking a member records the click coordinates and opens a fixed-position action panel from that point toward the upper right, matching the room chat popover behavior instead of expanding inside the scrollable member list. The popover uses the shared room floating-layer z-index variable in both base CSS and Bright School theme overrides, so whichever of chat, skill tips, stat tips, or member actions was opened/interacted with last renders in front. It uses a light theme-matched paper/backdrop panel behind the action buttons, while unavailable actions, including self-targeted social actions and the currently unimplemented private-chat action, must be real disabled buttons and render as gray across themes.
  - `ActionBar.jsx` owns spectator replay controls, normal player actions, test tool buttons, and phase-aware decision bars. It is memoized with `areActionBarPropsEqual()` so close-countdown or room-clock-only parent renders do not repaint the action controls; the comparator tracks rendered action state such as phase, turn ownership, skill uses, locks, opponent connectivity, scoring reference, replay step, and callback identity instead of full player timer objects or unused request deadlines.
  - `ScoringBreakdown.jsx` owns the formatted counting formula/result breakdown used by hints and result-review controls.
  - `Board.jsx` owns board grid rendering, coordinate labels, stones, move numbers, scoring marks, skill effect markers, decorated stone images, the latest-move red stone outline, and board point events. The latest-move outline is centered on the stone as an independent square/circular marker so decorated stone art cannot stretch it into an oval.
  - `Board.jsx` renders intersections through memoized point buttons. `arePointButtonPropsEqual()` compares only visible point state, point identity, pointer-handler refs, and interaction capability flags; event functions are read through a stable `handlersRef`. The board-level comparator intentionally re-renders when handler identities change so `handlersRef.current` is refreshed, while the point buttons keep the same ref object and do not all re-render. `useRoomPointActions()` returns `useCallback`-stable point handlers and depends on the current player color instead of the full player object, so ordinary clock ticks do not churn board click handlers. `RoomBattleStage` also passes named stable callbacks into `Board`, `ActionBar`, and memoized room widgets, avoiding inline handler churn on parent renders. `RoomScreen` keeps pass/resign/exit confirmation handlers and coordinate/move toggles `useCallback`-stable, and the finished-room close countdown timer lives inside `RoomHeader` so header countdown ticks do not re-run the full room screen or recreate action-control props. Timed draw/counting/result request toasts depend on `timedRoomRequestEffectKey()` instead of the whole room object, avoiding request-toast effect work on clock-only player time updates. Because those intersections are real `button` elements layered above the SVG grid, shared board CSS and Bright School board guards must explicitly reset them to transparent, no appearance, no border/shadow, zero min-size, and `touch-action: none`; otherwise global button skins can cover the grid and make the board look blank.
  - `Board.jsx` renders board grid strokes from `buildBoardLines()`, which emits continuous row/column runs instead of one segment per cell. This avoids uneven internal stroke joins and keeps first-line corners connected; invalid intersections still split only the affected row/column run. The `.board-lines` SVG is a gameplay layer rather than ordinary media, so shared CSS and Bright School guard layers pin it to `display: block`, full width/height, no max-size cap, visible stroke, and visible opacity to survive global `svg` media resets.
  - `Board.jsx` marks first-line board grid runs with `edge-line`; CSS keeps every non-edge grid run at one uniform stroke width and renders every first-line run exactly 2.5x that width in the Bright School theme.
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
- Board grid strokes use continuous SVG row/column runs with square line caps and geometric precision rendering so internal lines do not appear as uneven stitched segments, and first-line corners stay visually connected. The fixed contrast rule remains shared across themes: all ordinary grid runs share one stroke width, and first-line grid runs render at exactly 2.5x that width. Skill targeting highlights use a gradient glow instead of a solid outline. Stones affected by skill states use darker, higher-opacity green/purple halo rings so the effect reads clearly against the wooden board.
- Latest room/home refinements:
  - Desktop home footer text is rendered as a `main.home-screen` sibling HUD element and protected by the final theme safety layer as viewport-fixed at the lower-right corner, so it stays at the bottom of the desktop window while the lobby stage scrolls on shorter heights. The mobile Bright School footer remains part of normal document flow below the lobby content.
  - Desktop room headers keep the message/settings/move/coordinate controls in a right-aligned control group before the room-exit button, rather than floating around the middle of the header. Room exit buttons use a shared light-blue treatment on desktop and mobile; in the Bright School desktop header, the exit button keeps the same dark outline shadow as the adjacent room control buttons. Duplicate exit buttons beside desktop chat and inside the replay bar are removed so the header remains the single desktop room-leave entry. Replay step counters center their `current/max` text, desktop chat popovers, skill detail panels, stat hover/click tips, and room member action popovers share a dynamic room floating-layer stack where the latest interaction renders in front, and the capture/removal/overclock chips share a stable height.
  - The home player plaque rank/rating chip uses a light background with dark text again, while the admin-only management button remains a green circular icon-plus-title control aligned with the home user plaque.
  - The home screen uses a compact anime game-menu layout: the top strip contains a larger site title, the fixed subtitle `连罗伊人的都爱玩的智力游戏`, the gray-white online-count pill, and settings/message/logout/admin actions; the footer strip reads from configurable `footerText`, whose default lines are the site title, `Copyright ©KURO GAMES. ALL RIGHTS RESERVED.`, and `浙ICP备2026035038号`. The middle stage is an unframed fixed-ratio coordinate surface (`1480 / 620`) that scales as one piece instead of letting the two large image buttons fight the page flow. Desktop keeps the original wide-stage rule with a `1200px` minimum, `503px` minimum height, and `1920px` maximum width; phone landscape uses a smaller `960px` by `402px` minimum stage. The home app shell uses `/assets/home/multipurpose-classroom-bg.webp` as a fixed full-viewport background, then layers blur, saturation, translucent gradients, and glassy top/footer strips over it for a frosted classroom feel. The player plaque, `部员手册`, `星炬对弈`, and circular utility dock are absolute-positioned by percentage inside that stage; the player plaque is slightly larger with wider internal spacing, shows rank and rating on one line, shares the utility dock's left edge, `部员手册` is offset slightly right/down from the dock edge, and `星炬对弈` is nudged up by a few pixels while remaining the dominant right-side entry. The manual and match buttons use their source image aspect ratios as full-size clickable boxes so the visible artwork stays inside the hover/click target. The match entry no longer renders a hover/focus text popup; mode titles, rule copy, and current matchmaking counts live in the click-open mode picker. Phone portrait shows a dedicated `请横屏使用` guard instead of the home stage. Image-entry hover moves and rotates only the image child layer with small transform values, while a masked `::before` layer uses the same PNG alpha channel to show a solid aqua shadow translated down and right; this avoids large transparent-PNG filter/drop-shadow repaint costs while keeping the requested shadow look. The match-entry PNG has transparent borders after low-alpha background cleanup, avoiding faint square-edge artifacts on wide desktop browsers. All non-image controls share a hover/focus cue of slight upward movement, a blue outline ring, and a subtle brightness/saturation lift so users can clearly see the target they are about to choose. Utility dock buttons still do not carry a persistent shadow, and when the home stage compresses below the utility-label comfort threshold, utility buttons hide their visible text and keep only the icon inside the circular target.
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
- Login/preload recovery now preserves an unfinished `room:resume` result. If the socket recovers an active room while assets are still preloading, the preload completion guard does not force the user back to the home screen.

## Login Asset Preloading

- Frontend deployment helpers live in `src/shared/preloadAssets.js`.
- Socket.IO now connects to `window.location.origin`, so the deployed site can run behind `https://sigrika.fun` without a hard-coded localhost socket endpoint.
- `src/app/gameSocket.js` sets explicit mobile-friendly recovery options for the game socket: reconnect indefinitely, retry quickly, cap reconnect delay at 3 seconds, and fail the initial handshake after 6 seconds so a weak mobile network can recover instead of waiting on the default long timeout.
- Vite development proxy forwards `/socket.io` websocket traffic to the local backend, keeping the same-origin socket path usable in development and production.
- Vite development proxy also handles expected `/socket.io` websocket disconnect errors such as `ECONNRESET` and `ECONNREFUSED` quietly. These are normal when `dev:server` restarts the backend with `node --watch`; unexpected proxy errors still emit a concise warning.
- After a valid token is confirmed, the app enters a `preloading` view before the home screen.
- Fresh login enters `preloading` before the home screen, preventing the home screen from flashing before assets begin loading. Stored-token startup is intentionally disabled so refresh and browser restart return to the login screen.
- The preload step fetches non-replay runtime assets after login, but it is now split by startup criticality. Critical preload waits for current character portraits, home entry/background imagery, and common board/UI effect sounds before the app can leave the preload screen. Shop imagery, candy/effect previews, stone decoration images, result/match sounds, configured BGM tracks, character skill voices, and system voices stay in the same asset manifest but load as deferred background work with a concurrency cap so first entry to the home screen is not blocked by the full music/voice library. Replay lists and replay details remain lazy data requests so opening the app does not prefetch historical game records.
- Preload failures are non-blocking: failed or hanging asset loaders are ignored after a bounded per-task timeout so users are not trapped on the loading screen if a single critical or optional resource stalls during reconnect, server restart, or cache recovery.
- Startup preload is independent from transient Socket.IO client instances. `useStartupPreload()` must not receive `socket` or include a socket object in its dependency list; token/session state cleanup will tear down the socket through the socket lifecycle hook, while preload continues exactly once for the confirmed token.
- The preload screen includes a compact spinner and progress bar, with a short minimum display duration to avoid a visual flash on cached loads.

## Board Effect Theme Guard

- Bright School board guards keep `.board-row-effects` transparent and overflow-visible, and keep `.board-row-slash` plus its `::before`/`::after` highlights as the only painted slash elements. This protects the DOM-only `row-slash` overlay from the theme firewall's generic `[class*="row"]` paper surface and pseudo-element rules, which otherwise can cover the grid and stones with a blank panel or flatten the slash into a plain bar.
- Chisa's `.liberty-purge-removal-mark` is centered on each point button with `left/top: 50%` and `translate(-50%, -50%)`; its `::before` and `::after` bars own the rotation. Shared board CSS and the Bright School guard both keep the mark saturated red `#ff1733`, visible above stones, and pointer-events-none so it remains a purely visual removal history marker.

## Achievement And Personalization Frontend

- `src/app/useOverlayState.js` 将 `achievements` 和 `personalization` 纳入应用级弹窗契约；`AppOverlays` 在履历弹窗之外挂载 `AchievementModal` 与 `PersonalizationModal`，并把履历标题区的“成就”“个性化”按钮作为入口。
- `AchievementModal` 通过 `/api/achievements` 读取玩家成就列表，按“未达成 / 已达成 / 全部”三种 tab 过滤。桌面端使用三列表格语义呈现成就名、内容和奖励；移动端 CSS 将同一行降级为单列卡片，未达成使用灰底，已达成使用浅黄底。达成时间不作为常驻列展示，玩家点击已达成的成就行时，前端在点击位置显示达成时间浮窗。
- `PersonalizationModal` 通过 `/api/me/achievement-equipment` 读取可装备的成就奖励资产，并允许装备称号、徽章和用户名背景。桌面端为三列装备区，移动端改为竖向分区；保存后回写当前 `user.achievementEquipment`。弹窗内预览区使用共享 `UserIdentity` 组合草稿装备，作为保存前试穿效果；装备按钮用粉红色标出当前已保存生效项，用浅绿色标出草稿中正在试穿但尚未保存的项。
- 商城、抽卡、仓库使用道具和首页 `/api/me` 刷新都会消费响应里的 `achievementUnlocks`，逐条触发 `achievement` tone toast；toast 样式仍由现有 `ToastStack` 队列统一管理。
- 后台 `AdminConsole` 新增 `achievements` tab，`AdminAchievements` 使用“成就列表 / 奖励资产”双视图；成就列表只编辑既有成就的成就名、成就内容、奖励资产和排序，不提供新增或下线成就入口，奖励资产视图继续管理 `/api/admin/achievement-reward-assets`。
