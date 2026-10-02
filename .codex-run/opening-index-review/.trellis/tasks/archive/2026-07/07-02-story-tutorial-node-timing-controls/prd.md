# Story Tutorial Node Timing Controls

## Goal

后台管理-剧情教学系统需要让编排者能精确控制每个对弈步骤从当前节点推进到下一主线节点或用户选项目标的时间间隔，减少自动对弈、NPC对白、玩家操作、回复选项之间的节奏不可控问题。

## What I Already Know

* 用户希望先用 grill-me 详尽梳理需求，不直接进入实现。
* 相关后台编辑器入口是 `src/admin/AdminOnboardingStory.jsx`。
* 相关播放链路包括 `src/modals/StoryPlayerModal.jsx`、`src/tutorial/TutorialSessionModal.jsx`、`src/tutorial/TutorialBattleScreen.jsx`、`src/tutorial/tutorialGameState.js` 和 `src/shared/tutorialNodeTypes.js`。
* 现有节点类型包括 `story`、`board-setup`、`npc-dialogue`、`player-choice`、`player-move`、`npc-move`、`player-skill`、`npc-skill`、`counting-start`、`mark-dead`、`mark-neutral`、`counting-confirm`、`resign`。
* 现有对弈节点已有 `actionStartDelaySeconds`、`replyDelaySeconds`、`autoContinueDelaySeconds` 等节点级字段，但后台表单主要只在 NPC 步骤里展示。
* `TutorialBattleScreen` 中，NPC 步骤会用 `actionStartDelaySeconds` 控制 NPC 开始操作前等待，用 `replyDelaySeconds` 控制动作后停顿，用 `autoContinueDelaySeconds` 控制部分无选项节点的自动进入下一主线节点。
* `player-choice` 节点当前进入后立即显示选项。
* 玩家落子、玩家技能、计数/认输等步骤完成后当前主要即时进入 `nextNodeId`。
* 剧情对白 `story` 选项已有每个选项的 `revealDelaySeconds`，控制选项何时出现；但点击选项后到目标节点的等待未见独立字段。
* 对弈内回复选项当前只有文案和目标，没有每个选项的出现延迟或点击后跳转延迟字段。
* 系统设计已记录剧情教学仍使用 `StoryScript` 的 `nodes` JSON，不引入新表或新 DSL；如果本需求改变节点数据事实，需要同步更新系统设计文档并生成 HTML。

## Assumptions (Temporary)

* 需求重点是教学播放推进控制，而不是改变流程图连线模型。
* 字段应继续保存在现有 `nodes` JSON 内，避免新增数据库表。
* 后台编辑体验需要同时覆盖桌面端和移动端播放行为；后台管理本身仍以桌面工作台为主，但播放端必须保持移动/桌面一致。
* 控制项应优先做成表单里的明确秒数字段，并通过校验防止负数或非法数字。

## Open Questions

* None. Requirements confirmed by the user.

## Requirements (Evolving)

* 编排者能为每个对弈节点配置“节点推进”：推进方式（自动推进/手动继续二选一）和自动推进等待。
* 每个新建对弈节点默认自动推进，保存为 `manualContinueEnabled=false`、`autoContinueEnabled=true`；手动继续保存为 `manualContinueEnabled=true`、`autoContinueEnabled=false`。
* `npc-dialogue` 自动推进时，在 NPC 打字结束后再等 1.5 秒自动进入下一节点或选项；其它对弈节点自动推进等待为空时等同 0 秒。
* 编排者能控制用户选择后进入目标节点前的等待时间，范围同时覆盖普通剧情选项和对弈内回复选项。
* 选择后等待字段命名为 `transitionDelaySeconds`。
* `transitionDelaySeconds` 空值等同于 0 秒即时跳转，保证旧脚本保持当前点击后立即进入目标节点或结束剧情的行为。
* 采用“节点推进 + 选择后等待”的时序模型：节点完成后先按节点推进规则进入 `nextNodeId` 或显示用户选项；用户选择某个选项后，再按该选项的选择后等待进入目标节点。
* 复用现有 `autoContinueDelaySeconds` 作为自动推进等待字段，不新增 `completionDelaySeconds`。
* `autoContinueDelaySeconds` 只在自动推进开启时生效；无选项时等待后进入 `nextNodeId`，有选项时等待后显示用户选项。
* 节点推进只覆盖对弈节点；普通剧情对白节点保持手动阅读和手动继续，不使用 `autoContinueDelaySeconds` 自动或延迟推进。
* 普通剧情选项仍支持 `transitionDelaySeconds`，用于点击选项后的转场等待。
* 节点推进等待或选择后等待期间，播放器保留当前画面，不使用全屏加载过渡。
* 等待期间禁用相关继续/教学动作/选项按钮，避免重复触发落子、技能、结算、选项跳转等动作。
* 手动继续模式下等待状态展示“继续”按钮；自动推进模式下等待状态展示轻量状态文案“继续中...”，不显示剩余倒计时。
* 等待期间退出/跳过入口仍可用；关闭、跳过、切换节点或卸载组件时必须清理挂起定时器。
* 选项选择后等待期间，立即隐藏选项面板，只保留轻量等待状态文案。
* 后台表单默认展示“节点推进”区域，不放入折叠的高级设置。
* 对弈节点的“节点推进”区域展示“推进方式”（自动推进/手动继续二选一）和“自动推进等待”；NPC 节点额外展示单独的“NPC 表现节奏”，放置“NPC 操作前等待”和“动作后停顿”。
* 普通剧情选项和对弈内选项行都展示“选择后等待”，对应 `transitionDelaySeconds`。
* 后台字段空值提示采用兼容写法：NPC 对话的 `autoContinueDelaySeconds` 标注“默认 1.5”，其它自动推进等待和 `transitionDelaySeconds` 标注“留空 = 0 秒”；`actionStartDelaySeconds`、`replyDelaySeconds` 保留默认 1.5 秒 / 0.4 秒提示。
* 延迟秒数不设置最大值，只要求为空或非负数字。
* 前端问题面板和服务端发布校验都必须校验新增/扩展后的延迟字段，拒绝非法非负数字。
* 后台预览默认按配置真实等待。
* 后台预览等待状态旁提供“立即继续”调试按钮，方便作者跳过当前等待；该按钮只影响预览，不改变脚本配置，也不影响正式玩家播放。
* 正式玩家播放时不允许跳过单个节点等待或选项转场等待；只保留全局退出/跳过教学入口。

## Confirmed Summary

* 对弈节点使用“节点推进”：后台只允许选择自动推进或手动继续其中一种；底层沿用 `manualContinueEnabled` / `autoContinueEnabled` 两个布尔字段兼容旧脚本。
* 新建对弈节点默认 `manualContinueEnabled=false`、`autoContinueEnabled=true`，即自动推进。
* NPC 对话自动推进时，打字结束后默认 1.5 秒进入下一节点或选项；其它对弈节点自动推进等待为空时即时进入下一节点或选项。
* 普通剧情节点不使用节点级推进字段，仍保持手动阅读/继续。
* 普通剧情选项和对弈内选项都新增 `transitionDelaySeconds`，选择后等待再进入目标节点或结束剧情。
* `transitionDelaySeconds` 空值等同于 0 秒即时跳转。
* 选项选择后立即隐藏选项面板，只显示轻量等待状态。
* 等待状态不显示倒计时；节点等待会显示选项时，功能区不显示提示文案，手动继续模式只显示“继续”按钮。
* 正式玩家不能跳过单个等待，只能使用全局退出/跳过。
* 后台预览默认真实等待，但等待时提供“立即继续”调试按钮。
* 后台默认显示“节点推进”，不折叠；NPC 表现等待单独成组。
* 不设最大等待值，只要求空值或非负数字。
* 前端问题面板和服务端发布校验都要覆盖非法延迟字段。
* 字段文案：NPC 对话自动推进等待默认 1.5 秒；其它自动推进等待/选择后等待为空即 0 秒；NPC 操作前/动作后停顿为空使用既有默认 1.5/0.4 秒。
* 现有 `actionStartDelaySeconds`、`replyDelaySeconds`、`autoContinueDelaySeconds` 的数据兼容性必须保留，避免破坏已有脚本。
* 新字段需要在后台问题面板/发布校验中拒绝非法非负数字。
* 播放端需要清理定时器，避免快速跳过、切节点或关闭后仍触发旧节点跳转。

## Acceptance Criteria (Evolving)

* [ ] 后台表单能配置节点推进方式：自动推进/手动继续二选一，并在自动推进模式下配置自动推进等待。
* [ ] 对弈播放中，玩家步骤、NPC步骤、系统步骤完成后按节点推进配置进入下一主线节点或显示用户选项。
* [ ] 每个新建对弈节点默认自动推进。
* [ ] `npc-dialogue` 自动推进默认在打字结束后 1.5 秒进入下一节点或选项。
* [ ] 有选项的节点完成后，按节点推进规则显示选项。
* [ ] 普通剧情对白节点不因 `autoContinueDelaySeconds` 自动推进或延迟“继续”按钮跳转。
* [ ] 用户点击普通剧情选项后，按选择后等待时间再进入目标节点或结束剧情。
* [ ] 用户点击对弈内回复选项后，按选择后等待时间再进入目标节点或结束剧情。
* [ ] 未配置 `transitionDelaySeconds` 的既有选项继续即时跳转。
* [ ] 等待期间相关按钮/选项不可重复触发；手动推进显示“继续”，自动计时等待显示轻量“继续中...”状态。
* [ ] 节点等待将显示用户选项时，功能区不显示提示文案；手动推进只保留“继续”按钮。
* [ ] 等待状态不显示剩余倒计时。
* [ ] 等待期间退出/跳过仍可用，关闭或跳过后不会继续触发旧定时器。
* [ ] 用户选择选项后，选项面板立即隐藏，等待状态显示到跳转发生。
* [ ] 后台对弈节点表单默认可见“节点推进”区域。
* [ ] 普通剧情选项和对弈内选项行默认可见“选择后等待”输入。
* [ ] 后台字段文案清楚说明空值含义：NPC 对话自动推进等待默认 1.5 秒；其它自动推进等待/选择后等待为空即 0 秒，NPC 操作前/动作后停顿为空即使用既有默认值。
* [ ] 延迟字段允许空值或任意非负数字，不因超过固定上限而报错。
* [ ] 后台问题面板会提示非法 `transitionDelaySeconds`、`autoContinueDelaySeconds`、`actionStartDelaySeconds`、`replyDelaySeconds`。
* [ ] 服务端发布校验会拒绝非法选项/节点延迟字段，避免绕过前端保存坏脚本。
* [ ] 后台预览默认真实执行等待时间。
* [ ] 后台预览等待期间提供“立即继续”调试按钮，点击后只跳过当前等待并继续当前预览流程。
* [ ] 正式玩家播放等待期间不能跳过单个等待，但可以使用现有全局退出/跳过教学入口。
* [ ] 非法延迟值在后台问题面板中提示，不能发布为有效脚本。
* [ ] 桌面端和移动端教学对弈播放使用同一套时序语义。
* [ ] 相关系统设计文档同步更新并重新生成 `docs/system-design.html`。

## Definition of Done

* Tests added/updated for timing field validation and playback scheduling.
* Lint/typecheck/project checks run, or any known legacy failures are clearly separated from this change.
* System design docs updated if node data model or runtime behavior changes.
* Existing scripts keep the same persisted timing fields and continue to round-trip; new admin edits write the two progression booleans as a mutually exclusive pair.

## Out of Scope (Explicit)

* 不重做流程图布局。
* 不新增新的剧情脚本表、节点表或 DSL。
* 不改变围棋/五子棋规则、技能结算规则或真实房间对局时序。
* 不重新设计整套后台视觉风格，除非字段新增导致布局必须局部调整。

## Technical Notes

* Inspected `src/admin/AdminOnboardingStory.jsx`.
* Inspected `src/modals/StoryPlayerModal.jsx`.
* Inspected `src/tutorial/TutorialSessionModal.jsx`.
* Inspected `src/tutorial/TutorialBattleScreen.jsx`.
* Inspected `src/tutorial/tutorialGameState.js`.
* Inspected `src/shared/tutorialNodeTypes.js`.
* Relevant docs: `docs/system-design.md` lines around the story tutorial bullets already describe current timing fields and storage model.

## Decision Log

### Timing Model

**Context**: The user wants every battle tutorial node to control the interval to either the next node or user options.
**Decision**: Use the simplified model "node progression + option transition". Node progression is authored as one mode (automatic or manual) plus `autoContinueDelaySeconds`; option transition is controlled by `transitionDelaySeconds`.
**Consequences**: The authoring model has only two visible concepts: how a completed node progresses, and how a selected option transitions. Existing story option `revealDelaySeconds` remains a separate story-player behavior unless later explicitly unified.

### Node Progression Compatibility

**Context**: The code already stores `autoContinueDelaySeconds`, but its current UI label and runtime use mostly describe no-option auto-continue behavior.
**Decision**: Reuse `autoContinueDelaySeconds` as the automatic progression wait, and keep `manualContinueEnabled` / `autoContinueEnabled` as persisted compatibility flags. The admin writes them as a mutually exclusive pair.
**Consequences**: Existing scripts remain compatible at the JSON boundary, while the UI no longer presents simultaneous manual and automatic progression.

### Option Transition Scope

**Context**: Story options and in-battle reply options are both user choices that route to another node or end the script.
**Decision**: The option transition wait applies to both normal story options and in-battle reply options.
**Consequences**: Admin forms should present one shared option timing concept instead of making story and battle choices behave differently. Existing `revealDelaySeconds` remains the story option appearance timing field, while the new option delay controls the post-click transition.

### Option Transition Field

**Context**: The option delay needs a stable JSON field name and a compatible default for existing scripts.
**Decision**: Use `transitionDelaySeconds`; an empty or missing value means 0 seconds.
**Consequences**: Existing story and battle options keep immediate navigation until authors explicitly configure a delay. The field name describes the transition into the option target rather than the click itself.

### Story Node Completion Scope

**Context**: The original request targets battle tutorial steps, while normal story nodes have an established manual reading and continue interaction.
**Decision**: Node progression fields apply only to battle tutorial nodes. Normal story nodes do not use `autoContinueDelaySeconds` for automatic or delayed continue behavior.
**Consequences**: The implementation avoids changing core story reading behavior. Normal story options still receive the shared `transitionDelaySeconds` post-click delay.

### Node Progression Feedback

**Context**: Delays longer than a very short pause need visible feedback, but full-screen loading would interrupt the teaching flow.
**Decision**: Keep the current screen visible, disable duplicate action or option controls, show a "continue" button when manual progression is enabled, and show a lightweight "continuing" state only for timer-only waits. Exit and skip remain available.
**Consequences**: Desktop and mobile playback stay continuous while preventing duplicate actions. Timer cleanup becomes part of the runtime contract.

### Admin Form Placement

**Context**: Timing is a primary part of authoring this feature, not an occasional advanced tweak.
**Decision**: Show a default-visible "node progression" area in battle node forms. Keep NPC performance timing in a separate "NPC 表现节奏" group, and show "选择后等待" directly on normal story and in-battle option rows.
**Consequences**: Authors can tune pacing without opening advanced panels, and NPC action timing no longer looks like the same concept as node progression.

### Delay Value Bounds

**Context**: Very long delays can look like a stuck tutorial, but authors may intentionally need long pauses.
**Decision**: Do not enforce a maximum delay value. Delay fields accept empty values or any non-negative number.
**Consequences**: Validation remains simple and flexible. The lightweight waiting state is important because very long configured waits are allowed.

### Validation Scope

**Context**: Timing fields become part of the script data contract and can be submitted outside the current admin form.
**Decision**: Validate delay fields in both the admin issue panel and server-side publish validation.
**Consequences**: The UI gives immediate authoring feedback, while the backend prevents invalid script data from being published through stale clients or manual requests.

### Admin Preview Timing

**Context**: Authors need to verify real pacing, but unlimited delay values can make previewing slow.
**Decision**: Admin preview uses real configured waits by default and exposes a preview-only "continue now" control while a wait is pending.
**Consequences**: Preview can validate timing accurately while remaining efficient for long waits. The debug control must not persist changes to the script or appear in player-facing playback.

### Player Wait Skipping

**Context**: Player-facing playback should respect the author's scripted pacing, while still preserving an escape route.
**Decision**: Do not expose a generic skip-current-wait debug control to players. Node-level manual continuation is allowed only when `manualContinueEnabled` is true; otherwise keep only the existing global exit/skip affordance.
**Consequences**: Script timing remains authoritative in player playback, while the default node-completion state still gives players a clear "continue" action.

### Option Pending Feedback

**Context**: After clicking an option, the user needs feedback while waiting for the configured transition delay.
**Decision**: Hide the option panel immediately and show only the lightweight waiting state until navigation occurs.
**Consequences**: The transition is visually clean, but the waiting state must be clear enough to avoid looking like the option disappeared without response.

### Waiting Status Text

**Context**: A countdown would make long waits explicit, but would add visual noise to the player-facing teaching surface.
**Decision**: Show generic "continuing" status text without a remaining-second countdown.
**Consequences**: The status remains visually quiet. Because unlimited waits are allowed, authoring and preview need clear field labels so long delays are intentional.

### Admin Field Help Text

**Context**: Existing NPC delay fields already have implicit defaults, while transition fields need a zero-delay default for compatibility.
**Decision**: Label NPC dialogue `autoContinueDelaySeconds` as default 1.5 seconds after typewriter completion; label other automatic progression waits and `transitionDelaySeconds` as empty equals 0 seconds. Keep `actionStartDelaySeconds` and `replyDelaySeconds` helper text aligned with their existing default 1.5s / 0.4s behavior.
**Consequences**: Existing NPC pacing remains compatible, and authors can tell which fields use a default versus immediate behavior.
