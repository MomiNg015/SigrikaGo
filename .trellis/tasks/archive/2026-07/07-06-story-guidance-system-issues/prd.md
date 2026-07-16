# brainstorm: 处理剧情引导系统问题

## Goal

定位并修复剧情引导系统当前存在的问题，优先保持现有剧情播放器、对弈教学运行时、后台剧情教学编辑器和 Bright School 视觉合同稳定。若修复影响运行行为、接口、数据模型、主题样式或系统事实，同步更新系统设计文档并重新生成 `docs/system-design.html`。

## What I Already Know

* 用户要求先新建分支再处理剧情引导系统问题。
* 用户刚报告的具体症状：后台修改并发布“西格莉卡的彩虹豆豆跳跳糖”剧情后，回主界面对西格莉卡使用彩虹豆豆跳跳糖，弹出的不是新发布版本，而像最原始 seed 版本；同时弹窗样式被污染。
* 当前工作分支已切到 `codex/story-guidance-system-issues`。
* 创建任务前工作区已有未提交内容：`src/styles/themes/bright-school/commerce/warehouse-profile/warehouse-item-card.css`、两个未跟踪 Trellis 任务目录，以及几份 `garden-gpt-image-2/prompt/` 文件；这些不是本任务已确认范围。
* 项目要求前端问题同时考虑桌面端和移动端，除非明确只改某一端。
* 项目要求剧情/教学这类运行行为或数据事实变更需要更新 `docs/system-design.md` 或 `docs/system-design/` 对应分篇，并运行 `npm run docs:system-design`。
* 既有记忆显示，剧情/教学相关工作要保留桌面和移动端一致性；对弈教学动作功能区不能渲染解释性文本，只能显示具体按钮或保持空白。

## Repo Facts

* 通用剧情播放器入口是 `src/modals/StoryPlayerModal.jsx`，`src/modals/OnboardingStoryModal.jsx` 是新手引导包装。
* 对弈教学运行时入口是 `src/tutorial/TutorialSessionModal.jsx`、`src/tutorial/TutorialBattleScreen.jsx` 和 `src/tutorial/tutorialGameState.js`。
* 后台剧情教学编辑器入口是 `src/admin/AdminOnboardingStory.jsx`。
* 共享节点类型定义在 `src/shared/tutorialNodeTypes.js`。
* 既有 PRD `.trellis/tasks/06-28-story-battle-guidance/prd.md` 记录了通用剧情脚本、道具互动和未来对弈教学的阶段边界。
* 既有 PRD `.trellis/tasks/07-02-story-tutorial-node-timing-controls/prd.md` 已确认对弈教学节点推进、`transitionDelaySeconds`、等待状态、后台预览“立即继续”等时序规则。
* `docs/system-design.md` 和 `docs/system-design/06-ui-theme-mobile.md` 已记录剧情教学使用 `StoryScript` 的 nodes JSON，不引入新 DSL；故事选项与对弈内选项可使用 `transitionDelaySeconds`；对弈教学动作栏只显示具体教学按钮或为空。
* 当前代码中 `AdminOnboardingStory.jsx` 已有普通剧情选项和对弈内选项的“选择后等待”输入，也会在问题面板校验 `transitionDelaySeconds`。
* 当前代码中 `TutorialBattleScreen.jsx` 有 `pendingWait`、定时器清理、手动继续按钮和预览专用“立即继续”按钮；正式玩家自动等待时动作栏不显示自由文本。
* 当前代码中 `StoryPlayerModal.jsx` 对普通剧情选项的 `transitionDelaySeconds` 会显示 `继续中...` 状态，后台预览可点“立即继续”。

## Assumptions (Temporary)

* “剧情引导系统的问题”可能落在三类之一：后台编辑器 authoring、玩家侧普通剧情播放器、玩家侧对弈教学运行时。
* 如果是用户刚观察到的具体 bug，应先复现和定位该 bug，再扩展检查同类链路。
* 如果是延续节点时序工作，应以既有 `07-02-story-tutorial-node-timing-controls` PRD 和系统设计事实为准，不重新设计整套系统。

## Open Questions

* 暂无。先按用户报告的西格莉卡彩虹豆豆跳跳糖剧情发布/播放不一致问题定位。

## Requirements (Evolving)

* 保留已有未提交 WIP，不把无关文件混入本任务。
* 修复前先走完整渲染/运行链路：后台配置、脚本数据、播放器/教学运行时、桌面和移动端样式。
* 对弈教学动作功能区继续遵守“只显示具体按钮选项或为空”的合同。
* 不做无关重设计，不改变现有视觉合同，除非问题本身就是视觉/交互缺陷。
* 优先修复：后台发布的西格莉卡糖果剧情必须成为玩家侧道具使用后播放的版本；不得回退到原始 seed 版本，除非确实没有已发布脚本。
* 同时定位并修复玩家侧糖果剧情弹窗样式污染，保持 `StoryPlayerModal` 既有视觉合同。

## Acceptance Criteria (Evolving)

* [x] 具体问题被明确记录到本 PRD。
* [x] 能说明问题影响后台编辑器、普通剧情播放器、对弈教学运行时中的哪一段。
* [x] 后台发布西格莉卡糖果剧情后，玩家侧对西格莉卡使用彩虹豆豆跳跳糖会播放刚发布的脚本。
* [x] 若没有对应已发布脚本，玩家侧仍可回退到现有道具 `effectText`，但不能错误播放 seed 旧剧情。
* [x] 糖果剧情弹窗使用未污染的通用 `StoryPlayerModal` 样式，桌面端和移动端都符合现有剧情播放器合同。
* [x] 修复覆盖桌面端和移动端，或明确说明为什么本次只涉及单端。
* [x] 若影响系统设计事实，更新系统设计文档并运行 `npm run docs:system-design`。
* [x] 添加或更新对应回归测试。

## Definition of Done

* Tests added/updated for the fixed behavior.
* Relevant lint/typecheck/test/docs commands run, with failures clearly separated if they are unrelated pre-existing failures.
* Work changes are scoped away from pre-existing dirty files.

## Out of Scope (Temporary)

* 不清理当前已有无关 WIP。
* 不重做剧情系统架构，除非具体问题需要架构级修复并经确认。
* 不重新设计后台工作台或玩家剧情视觉风格。

## Technical Notes

* Relevant files inspected: `src/admin/AdminOnboardingStory.jsx`, `src/modals/StoryPlayerModal.jsx`, `src/tutorial/TutorialSessionModal.jsx`, `src/tutorial/TutorialBattleScreen.jsx`, `src/tutorial/tutorialGameState.js`, `src/shared/tutorialNodeTypes.js`.
* Relevant docs inspected: `docs/system-design.md`, `docs/system-design/02-frontend-architecture.md`, `docs/system-design/03-backend-realtime-api.md`, `docs/system-design/04-data-model-and-domain.md`, `docs/system-design/06-ui-theme-mobile.md`.
* Relevant existing task docs inspected: `.trellis/tasks/06-28-story-battle-guidance/prd.md`, `.trellis/tasks/07-02-story-tutorial-node-timing-controls/prd.md`.
* Root cause: admin item-character story trigger options saved the shop row id in `triggerParams.itemId`, while player item-use queried by stable owned item id / `ShopItem.targetId`. The player lookup missed the published story and the UI fell back to legacy warehouse `effectText`, which looked like a polluted old result window rather than `StoryPlayerModal`.
* Fix: admin now writes `item.targetId`; backend player lookup and publish-conflict checks canonicalize legacy `ShopItem.id` trigger values to `ShopItem.targetId`; regression tests cover both lookup and conflict behavior.
