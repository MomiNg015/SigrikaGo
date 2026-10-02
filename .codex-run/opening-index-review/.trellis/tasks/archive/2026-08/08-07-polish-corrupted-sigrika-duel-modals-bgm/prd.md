# 优化黑化西格莉卡对弈弹窗与技能 BGM

## Goal

收紧黑化西格莉卡特殊对局的生命周期弹窗，并把专属对局 BGM 的起播时机从进入房间延后到西格莉卡第一次发动演出技能的同一阶段，使开局氛围更清楚、结算更轻量。

## Requirements

- 只调整黑化西格莉卡特殊对局；普通对局、练习局和普通结果弹窗保持现状。
- 特殊对局结果弹窗改为紧凑自适应尺寸，不再继承 Bright School 通用结果窗的 `50vw × 40vh` 固定大画布。
- 特殊对局猜先/开局弹窗顶部的双剑图标增大并获得明确的高对比承托层，保持现有红黑视觉语言。
- 专属对局 BGM 在进入特殊房、猜先和开场台词阶段保持静音；服务端进入第一次“西格莉卡？发动技能”的演出阶段时开始播放，并在该对局后续阶段持续播放。
- BGM 已起播状态必须能从服务端房间快照恢复，刷新或断线重连后不能重新回到静音。
- 同步更新相关测试和系统设计文档，并重新生成 `docs/system-design.html`。

## Acceptance Criteria

- [x] 特殊结果窗宽度不超过 360px（同时适配窄屏安全边距），高度由内容决定。
- [x] 特殊结果窗仍完整显示结果、结果说明和至少 44px 高的“继续”按钮。
- [x] 特殊开局弹窗的图标具有独立类名、至少 48px 的可视尺寸和红黑主题下的高对比边框/底色。
- [x] 特殊房进入、猜先和开场台词期间，背景音乐解析结果为 `null`。
- [x] 第一次特殊技能演出开始后，背景音乐解析为 `sigrika-corruption-duel`，演出结束后仍保持该音轨。
- [x] 服务端 `roomView` 只公开派生的 `musicStarted` 布尔值，不泄露内部演出阶段字段。
- [x] 定向测试、全量测试、构建、产物 CSS、生产配置、`verify:battle-fixes`、技能稳定性用例与 `npm run docs:system-design` 通过。
- [ ] `npm run check` 整体通过；当前仅被本地数据库相对提交快照的既有 `siteSettings / shopItems / storyScripts` 漂移阻断，本任务不擅自导出后台内容。

## Definition of Done

- 代码、测试和系统设计事实同步。
- 桌面及竖屏移动端的特殊弹窗保持可读、可操作且无横向溢出。
- 当前工作区的邮件界面与黑化转场 WIP 不被覆盖或纳入本次逻辑修改。

## Technical Approach

- 在特殊结果窗 owner CSS 中覆盖通用 Bright School 结果窗的固定宽高，而不改动共享结果窗合同。
- 为 `OpeningModal` 的特殊对局双剑图标添加语义类名，样式继续由 `sigrika-corruption/room-lifecycle.css` 独占。
- 由服务端根据持久化的 `openingPresentationStage` 派生公开 `sigrikaCandyDuel.musicStarted`；共享音乐解析器在特殊房分支中先抑制普通战斗音乐，仅在该标记为真时返回专属 BGM。

## Decision (ADR-lite)

**Context**: 仅监听客户端当前 `presentation.type === "skill"` 虽能起播，但演出清空或页面刷新后会丢失状态。

**Decision**: 复用服务端已持久化的开场演出阶段，向 `roomView` 暴露最小派生布尔值，由客户端音乐解析器消费。

**Consequences**: 增加一个安全的房间视图字段和对应跨层测试，但不新增数据库字段，也不公开内部演出阶段。

## Out of Scope

- 不改动 BGM 素材、音量、循环方式或首页黑化 BGM。
- 不重做普通结果弹窗、普通猜先弹窗或其他特殊房 UI。
- 不改动黑化剧情、技能名称、技能演出时长或 AI 行为。

## Technical Notes

- 弹窗入口：`src/modals/gameLifecycle/OpeningModal.jsx`、`src/modals/gameLifecycle/ResultModal.jsx`
- 特殊 owner CSS：`src/styles/mobile-adaptive/sigrika-corruption/room-lifecycle.css`、`room-replay.css`
- 音乐路径：`server/roomView.js` → `src/app/useBackgroundMusicTrack.js` → `src/shared/musicLibrary.js` → `BackgroundMusic`
- 持久状态：`sigrikaCandyDuel.openingPresentationStage` 已随活动房间快照保存。
