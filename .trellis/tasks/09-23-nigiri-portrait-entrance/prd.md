# 猜先结果双方立绘对峙入退场演出

## Goal

在展示猜先结果时，以双方角色立绘的对峙演出强化对局开场仪式感。需求已通过 grill-me 逐项讨论并由用户确认定稿。

## Requirements (confirmed)

- 猜先结果展示时，双方立绘动画入场。
- 用户修订：自己固定右侧／下侧，对手固定左侧／上侧；底色仍按实际棋色。立绘下方展示用户名，黑方白字、白方黑字，单行完整显示，测量缩字防止裁切。
- 构图与动作要有争锋相对的感觉。
- 用户修订：采用两条高度全屏、宽度较窄的细长斜切条，底色按棋色，位置按本地玩家视角，保留周围与中央棋盘信息可见；不再用黑白背景各占半屏。
- 演出期间用独立黑色遮罩统一降低棋盘及全部底层信息区明度，随退场淡出，在开局时恢复；不压暗立绘条和结果文字。
- 左侧对手立绘从上向下入场，右侧自己立绘从下向上入场。
- 立绘采用大半身构图；资源基本为 Q 版，允许左右边缘少量裁切，优先保留脸部与主要姿态。
- 猜先结果融入对决画面：移除原窗口卡片外框，在斜切交界处直接展示“本局你执黑／白”和倒计时，以双方立绘为视觉主体。
- 退场采用左右拉幕：左侧对手立绘与黑色斜切背景一起向左退出，右侧自己立绘与白色斜切背景一起向右退出，中央文字同步淡出，露出棋盘。
- 手机竖屏按本地玩家视角排列，采用纵向错位构图：对手偏左上、自己偏右下，脸部避开中央提示；沿用斜切背景与已确认的入退场方向。
- 在开局倒计时最后约 0.4 秒启动退场，正式开局时立绘、黑白背景与中央提示已完全退完；沿用既有开局时点，不延长等待或遮挡第一手操作。
- 入场采用快速切入、轻微回弹：双方同时从各自上下方向入场，约 0.5 秒落位，略微越过停留位置后回稳。
- 覆盖所有有猜先倒计时且双方都有角色的对局，包括符合条件的人机对局；任一方无角色时保留原开局提示。
- 仅完整经历开场的对局玩家播放立绘演出；中途进入、断线重连和旁观均使用简洁倒计时，已经正式开局则不补播。
- 沿用现有开局声音，不新增入场或退场音效。
- 正式开始对局时，双方立绘与猜先窗口一起消失，并有出场动画。
- 一次讨论一个关键问题，确认后持续更新本 PRD。

## What I already know

- `src/modals/gameLifecycle/OpeningModal.jsx` 展示执棋颜色与开局倒计时，时间来自 `room.openingEndsAt`。
- `src/room/RoomScreen.jsx` 仅在 opening 阶段且非回放时挂载开局弹窗；现阶段结束会直接卸载，出场演出需要协调此生命周期。
- `src/shared/characterPortraits.js` 已提供角色立绘解析，包含时装快照、装备时装及特殊外观分支。
- 当前工作区有其他未提交改动，后续实现需保持任务范围独立。

## Review Status

- 用户已确认最终汇总，需求于 2026-09-23 定稿。
- 用户随后要求开始，已进入实现和验证阶段。

## Default Behavior (confirmed)

- 复用对局角色及其时装快照的现有立绘解析，不改变原图朝向。
- 任一方立绘加载失败或未及时准备好时，回退原开局提示，不等待资源而延迟对局。
- 保留练习等模式必要的开局规则提示。
- 尊重减少动态效果设置，使用简化过渡并保持相同开局时间。

## Acceptance Criteria

- [x] 双方客户端各自将本地玩家放右／下，对手放左／上，底色和姓名文字颜色按棋色。
- [x] 猜先结果出现时能看到立绘入场，对局开始时能看到立绘和窗口协调退场。
- [x] 桌面展示全高窄黑白斜切条、立绘与无卡片外框的中央提示；条外可见统一压暗的棋盘及信息区，正式开局恢复。
- [x] 手机竖屏为对手左上、自己右下的错位构图，保持脸部完整，左右仅允许少量裁切。
- [x] 双方约 0.5 秒同时完成上下相向入场并轻微回弹；最后约 0.4 秒向左右拉幕退场，中央文字同步淡出。
- [x] 正式开局时无演出遮挡，不延迟开局和第一手操作，不改变既有开局声音。
- [x] 符合条件的人机对局也播放；无角色、中途进入、重连和旁观保持简洁提示，不在开局后补播。
- [x] 验证立绘资源异常回退、时装快照、减少动态效果设置和必要规则提示。

## Validation Results

- Phone follow-up: identified and corrected a device-clock-offset failure that can hide even the simple opening countdown. Opening snapshots now carry server time, normalized into a fixed local deadline shared by text and artwork. This is a reproducible code defect; the user's physical iPhone has not been instrumented, so this is not yet confirmed as its sole cause.

- Follow-up: include Zhunshibao via its dedicated `botProfile.portraitUrl` despite null character identity; regression tests cover the bot playing either black or white.

- Focused regression suites: 150 tests passed across six files, including generated docs and CSS contracts.
- Production build, built CSS contracts, portrait normalization and admin snapshot checks passed; system-design HTML regenerated.
- Browser fixture uses the production component and full styles: inspected 1440x900, 390x844 and 360x640 screenshots with no horizontal overflow. Measured opposing entrance/exit transforms, zero overlays after deadline and disabled entrance animation under reduced motion.
- Full `npm run check` lint passed; full test run exposed four unrelated existing assertion failures in `HouseModal.test.js` (two), `ShopModal.test.js` and `RoomScreen.test.js`. The two task-related initial failures (import list and generated HTML) were fixed and reverified. No unrelated assertions or styles were changed to make those tests green.
- Supplemental strict JSX lint passes for new opening code; existing `RoomScreen.jsx` has five pre-existing unused imports outside the default maintained ESLint list.
- Scoped commit prepared; unrelated working changes remain intact. Task archiving is separate.

## Implementation Outline

- 复用现有开局弹窗入口与角色立绘解析，核对房间加入及重连生命周期，以可靠识别完整参与开场的玩家。
- 依据既有开局截止时间编排入场、停留和退场，不增加服务端等待时长。
- 实现桌面和竖屏构图、黑白背景拉幕及简洁提示回退。
- 验证生命周期和实际画面；同步系统设计文档并生成 HTML。

## Out of Scope

- 需求讨论阶段不修改对局代码。

## Definition of Done

- 完成需求确认，后续实现按确认范围执行。
- 实现阶段验证演出时序、资源回退和布局，并同步系统设计文档。

- Username/viewpoint follow-up: 39 focused tests passed; production build, built CSS and strict component lint passed. Browser inspection at 360px confirms long Chinese/Latin names remain single-line, fully fit within the 80px safe name region, and use white ink for black / black ink for white. Local black and local white positioning are covered by regression tests.

## Scoped Commit Verification

- Verified the exact staged snapshot independently of unrelated working files: 175 targeted tests passed, production build and built CSS contracts passed.
- Full staged suite: 2605 passed, 7 failed. All seven failures reproduce in the pre-change HEAD comparison (four existing layout assertions, two CRLF-sensitive assertions in the exported checkout, and the exported-checkout Prisma initialization failure).
- Staged Markdown and generated HTML exclude unrelated changes; the capture-challenge implementation and its specific opening-copy test remain unstaged.
