# 剧情化对弈引导系统需求

## Goal

将现有新手引导弹窗抽象为可复用的剧情/教学系统，覆盖新手引导、道具或角色互动，以及未来的对弈界面内剧情化教学。当前阶段只做需求澄清和 MVP 设计，不进入实现。

## What I Already Know

* 现有新手引导体验是立绘区、打字机文字区、底部选项区，用户对这个体验满意，希望抽象为通用剧情播放器。
* 后台已经能维护新手引导的剧情节点、角色、正文、下一节点和分支选项。
* 用户希望“彩虹豆豆跳跳糖”等道具触发的角色互动弹窗也能复用剧情播放器。
* 用户希望未来支持对弈界面内的剧情化教学：预设棋盘局面、NPC 预设落子、提示用户落点、NPC 从左上角弹出对话，并可临时替换原对局功能区为选项区或教学操作区。
* 后台最好能编辑这些引导内容，但编辑器能力边界还未确定。

## Repo Facts

* `src/modals/OnboardingStoryModal.jsx` 已实现当前新手引导播放器：节点 Map、打字机、分支选项、继续/完成、跳过确认、角色立绘解析。
* `src/app/useOnboardingStory.js` 已实现玩家侧新手引导拉取、自动弹出、手动打开、自动展示标记。
* `server/onboardingStory.js` 和 `server/onboardingStoryRoutes.js` 已实现单例新手引导脚本、草稿/发布、发布校验、玩家接口和自动展示进度标记。
* `src/admin/AdminOnboardingStory.jsx` 已有后台节点编辑和播放器预览，但当前文案存在编码显示问题，需要实现阶段单独核查是否为文件编码或显示层问题。
* `prisma/schema.prisma` 已有 `OnboardingStoryScript` 以及用户 `onboardingRequired` / `onboardingAutoShownAt` 字段。
* `src/room/RoomBattleStage.jsx` 桌面端布局为对手栏、棋盘列、自方栏；移动端布局为棋盘和底部 `mobile-room-dock` tabs，ActionBar 已是可替换的明确区域。
* `server/items.js` 的 `useInventoryItem` 已支持使用道具后返回 `effectText`，前端 `src/modals/warehouse/useWarehouseInventory.js` 会把角色目标道具的 `effectText` 传给 `WarehouseTargetModal` 展示结果。
* 内置道具 `rainbow-bean-candy` 已有完整业务规则：对西格莉卡增加 30 金币并设置 `sigrikaCandyDisabled`，对达妮娅设置 `deniaRainbowGlow` 并触发 `denia-rainbow-bean-candy` 成就；有效对局结束后由现有房间逻辑清除对应状态。
* 第一阶段接入的新业务场景选择道具/角色互动，优先改造彩虹豆豆跳跳糖使用成功后的结果展示，不重写糖果效果、成就或状态清除规则。

## Open Questions

* MVP 应优先做“通用剧情播放器 + 道具互动”，还是直接纳入“对弈教学”？
* 通用剧情播放器是否只做文本/立绘/选项，还是第一版就支持动作事件、进度条件和上下文变量？
* 道具互动是一次性剧情、可重看剧情，还是与角色好感/资源变化联动？
* 对弈教学应是独立离线训练房间、真实房间特殊模式，还是复用回放/本地棋盘演示？
* 后台编辑器第一版应只支持表单节点，还是需要可视化流程图、棋盘局面编辑、事件编排？
* 用户进度按脚本、章节、节点还是教学步骤记录？
* 跳过、失败、重看、重置进度、版本更新后的重播策略尚未确定。

## Requirements (Evolving)

* 不在需求明确前开始实现。
* 需求澄清使用一问一答，每次只问一个关键问题，并提供推荐选项。
* 最终产出可执行 MVP 方案和分阶段实现计划。
* 用户已同意在布局/流程需要视觉比较时使用 browser visual companion；当前地址为 `http://localhost:55046`。
* MVP 第一阶段改为先做方向 1：把现有新手引导抽象成可复用剧情播放器。对弈教学作为后续阶段目标保留在设计中，但不进入第一阶段实现。
* 第一阶段使用一个真实道具/角色互动场景验证复用，优先目标是“彩虹豆豆跳跳糖”对角色使用后的剧情演出。
* 第一阶段剧情内容采用后台可编辑的通用剧情脚本，脚本可绑定到道具使用等触发点；道具效果仍由原业务逻辑执行，成功后返回可播放脚本。
* 第一阶段节点能力保持文本节点为核心：复用 `id / speakerName / characterId / text / nextNodeId / options`；脚本层新增通用元数据和触发绑定。对弈教学所需的棋盘动作节点留到后续阶段。
* 剧情脚本触发绑定采用枚举触发类型加结构化参数，例如 `triggerType = "onboarding" | "item-character-use"`，`triggerParams = { itemId, characterId }`；后台使用表单选择，服务端按结构化字段校验和查询。
* 新手引导迁移策略采用兼容层：通用剧情脚本成为事实来源；现有 `/api/onboarding-story`、自动弹出逻辑和后台新手引导入口短期继续可用，但内部读写 `triggerType=onboarding` 的通用脚本。
* 第一阶段用户进度不新增通用剧情进度表；仅保留现有新手引导 `onboardingRequired/onboardingAutoShownAt` 自动展示状态。糖果互动每次道具使用成功播放一次，不记录节点级进度或续播。
* 糖果剧情播放发生在后端道具效果成功应用之后；关闭或跳过剧情不会回滚道具消耗、金币奖励、角色状态或成就触发。第一阶段剧情选项不影响业务事务。
* 通用剧情播放器第一阶段保留现有视觉和交互能力：立绘、打字机、选项、继续/完成、跳过确认；将标题、aria 文案、跳过说明等新手引导硬编码改为脚本或场景可配置。不引入场景主题变体、节点音效、背景图或立绘动作。
* 后台第一阶段将现有新手引导编辑器升级为统一“剧情脚本管理”：支持脚本列表、新建/编辑、触发类型与参数配置、表单节点编辑和播放器预览；不做可视化流程图。
* 同一个触发点第一阶段最多允许一条已发布脚本；草稿可保存，但发布时必须校验触发冲突，避免道具使用等业务触发时出现多脚本歧义。
* 道具使用成功但缺少对应已发布剧情脚本时，前端回退到现有 `effectText` 结果展示；剧情配置缺失不得阻断道具消耗、奖励、角色状态或成就流程。
* 第一阶段只保留新手引导的手动重看入口；糖果互动剧情不提供玩家侧重看列表或角色详情重看入口，仅在道具使用成功后播放，后台可预览。
* 跳过/关闭行为按场景配置：新手引导保留跳过按钮和确认文案；糖果剧情不显示跳过确认，只提供关闭/完成，因为业务效果已在播放前生效且剧情较短。
* 默认剧情脚本启动时 seed：至少包含新手引导兼容脚本、彩虹豆豆跳跳糖对西格莉卡脚本、彩虹豆豆跳跳糖对达妮娅脚本；只在缺失时创建，不覆盖后台后续编辑。
* 对弈教学在第一阶段只做命名和触发类型预留，可在文档或枚举中保留未来 `battle-tutorial-start` / `battle-tutorial-step` 方向；不建立教程关卡表、棋盘步骤 schema 或教学运行时。
* 数据存储采用通用单表脚本模型，沿用现有草稿/发布 JSON 模式：脚本元数据加 `draftStartNodeId/draftNodesJson/isPublished/publishedStartNodeId/publishedNodesJson/publishedAt` 等字段；第一阶段不拆分节点表。
* 前端播放入口采用应用级 `StoryPlayerOverlay`：新手引导、仓库糖果使用等业务拿到 `storyScript` 后交给统一应用级状态播放，业务不各自嵌入播放器。
* 糖果剧情作为仓库操作的最上层结果演出：仓库弹窗保持打开，剧情 overlay 盖在最上层；关闭剧情后回到已刷新库存和角色效果的仓库。移动端返回键先关闭剧情，再回到底层仓库。
* 第一阶段支持少量白名单变量替换，例如 `{username}`、`{characterName}`、`{itemName}`；服务端在返回玩家脚本前替换，不支持条件表达式或任意脚本执行。
* 后台脚本触发参数按触发类型显示受限表单：`onboarding` 无参数；`item-character-use` 使用道具下拉和角色下拉，发布时校验对应 item/character 存在，不让管理员直接编辑 trigger JSON。
* 第二阶段对弈教学默认规划为独立教学对弈界面、本地脚本驱动、不进入真实 Socket.IO 房间；复用棋盘渲染和共享规则 helper，脚本驱动 NPC 对话、NPC 落子、用户目标落点，完成后上报进度。

## MVP Scope

第一阶段实现“通用剧情播放器 + 后台可编辑通用脚本 + 道具互动触发验证”，不实现对弈教学运行时。

Included:

* 泛化现有新手引导脚本为通用 `StoryScript` 模型。
* 保留现有新手引导玩家入口、自动弹出和手动重看兼容行为。
* 后台将新手引导编辑器升级为剧情脚本管理，支持表单节点编辑、触发绑定、发布和预览。
* 彩虹豆豆跳跳糖对西格莉卡/达妮娅使用成功后播放后台配置的剧情脚本。
* 缺少脚本时回退现有 `effectText` 结果展示。
* 应用级 `StoryPlayerOverlay` 统一播放剧情，糖果剧情盖在仓库最上层，关闭后回到仓库。
* 系统设计文档同步更新，并运行 `npm run docs:system-design`。

Excluded:

* 对弈教学界面、教程关卡表、棋盘步骤 schema、NPC 落子和用户目标落点校验。
* 通用剧情进度表、节点级续播、剧情回顾列表。
* 多类型节点、条件表达式、剧情动作节点、剧情选项影响业务事务。
* 流程图式后台编辑器、音效/背景图/立绘动作/主题变体。

## Technical Approach

* Add a generic story script service/model that mirrors the existing draft/published JSON pattern and owns trigger lookup, script validation, publishing, seeding, and variable interpolation.
* Migrate onboarding to the generic model through a compatibility layer so current onboarding routes and app flows keep working.
* Extend item use responses with an optional `storyScript` resolved from `triggerType=item-character-use` and `triggerParams={ itemId, characterId }`.
* Refactor `OnboardingStoryModal` into a generic story player component with configurable title, labels, skip mode, and skip copy.
* Add app-level story overlay state so onboarding and warehouse item use share the same player.
* Upgrade admin UI from a singleton onboarding editor into a script list/editor while retaining the current node form and preview pattern.

## Implementation Plan

1. **Data and service foundation**
   * Add `StoryScript` schema/migration/schema guard.
   * Implement validation, draft save, publish, trigger conflict checks, trigger lookup, variable interpolation, and non-overwriting seed defaults.
   * Add tests for publishing, conflict validation, fallback lookup, and seed behavior.

2. **Onboarding compatibility**
   * Route existing onboarding service calls through the generic story service.
   * Preserve `/api/onboarding-story`, `/api/onboarding-story/auto-shown`, auto show, and manual replay behavior.
   * Add migration/seed path from existing singleton onboarding data to the generic onboarding script.

3. **Generic player overlay**
   * Rename/refactor the player component into a generic story player without changing the existing visual contract.
   * Add configurable title/labels/skip behavior and app-level `StoryPlayerOverlay` state.
   * Verify desktop and mobile modal layering, focus labels, reduced-motion/typewriter behavior, and phone back dismissal order.

4. **Candy trigger integration**
   * Return optional `storyScript` from successful `rainbow-bean-candy` character item use.
   * Keep `effectText` fallback and all existing effect/achievement/state-clearing behavior unchanged.
   * Trigger the app-level story overlay from warehouse item use while keeping the warehouse open underneath.

5. **Admin script management**
   * Replace/expand the onboarding admin page into script list + script editor.
   * Add structured trigger forms for onboarding and item-character-use.
   * Keep node form editing, draft/publish actions, validation errors, and preview.

6. **Docs and verification**
   * Update `docs/system-design.md` and relevant `docs/system-design/` chapters.
   * Run targeted tests for server story service/routes, item use, onboarding compatibility, warehouse/player UI, admin UI, plus `npm run docs:system-design` and the project check command as appropriate.

## Acceptance Criteria (Evolving)

* [ ] 明确 MVP 包含哪些使用场景，以及哪些明确延期。
* [ ] 明确剧情播放器、道具互动、对弈教学、后台编辑、数据模型和用户进度的边界。
* [ ] 明确失败、跳过、重看、版本更新的用户体验规则。
* [ ] 形成可拆分实现计划，能按小步 PR 推进。
* [ ] 主验收路径：从仓库对达妮娅使用彩虹豆豆跳跳糖，后端正常消耗道具、应用 `deniaRainbowGlow`、触发既有成就，同时前端播放达妮娅剧情脚本；缺少脚本时回退现有 `effectText` 结果展示。
* [ ] 辅助验收路径：大厅手动/自动新手引导体验保持兼容；后台能创建、编辑、发布并预览脚本。

## Out of Scope (Temporary)

* 需求澄清阶段不写业务代码。
* 在用户确认设计方案前不进入实现。

## Technical Notes

* 项目要求涉及架构、运行行为、接口、数据模型、资源体系、主题样式、部署方式或技术债更新时，同步更新 `docs/system-design.md` 或 `docs/system-design/` 对应分篇，并运行 `npm run docs:system-design`。
* 前端问题按项目要求需要同时考虑移动端和桌面端。
