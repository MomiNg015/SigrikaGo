# 修复桌面技能详情被聊天按钮遮挡

## Goal

让桌面端对局界面中，我方技能详情在第一次悬停时就显示在未交互的“对局聊天”按钮上方，并继续遵守房间浮层“最近交互者优先”的统一层级规则。

## Requirements

- 桌面端首次悬停我方技能时，技能详情不得被未点击的“对局聊天”按钮遮挡。
- 聊天、技能、属性和成员面板继续共用动态 `--room-floating-z`，最近悬停、聚焦或点击的浮层显示在前方。
- 动态房间浮层必须高于所有普通房间浮层的静态回退层级。
- 每次动态房间浮层提升都必须低于确认弹窗等模态遮罩层，不能随交互次数无限增长。
- 不改变技能详情、聊天按钮或其他房间浮层的尺寸、位置、配色与交互。
- 同步更新 `docs/system-design.md` 与对应前端架构分篇，并生成 `docs/system-design.html`。

## Acceptance Criteria

- [x] 第一次分配的动态房间浮层层级高于当前最高的普通房间回退层级 `140`。
- [x] 所有动态房间浮层提升都固定低于模态遮罩层基准 `160`。
- [x] 首次悬停我方技能时，技能详情位于未交互聊天按钮上方。
- [x] 点击聊天后再悬停技能，仍由最后交互的技能详情显示在前方。
- [x] 现有聊天、技能、属性和成员面板的动态层级接线保持不变。
- [x] 回归测试、系统设计生成和完整质量检查通过。

## Definition of Done

- 定向房间测试与完整 `npm run check` 通过。
- 桌面端实际页面验证首次技能悬停行为（环境可用时）。
- 不提交工作区现有无关改动。

## Technical Approach

将 `RoomBattleStage` 的动态房间浮层基准从低于聊天回退值的 `90` 提升至普通房间浮层回退值上界 `140`。每次交互只保留最新浮层的动态值 `141`，其余浮层回到各自静态回退值；这样既高于聊天 `120` 和成员面板 `140`，又始终低于模态遮罩 `160`。保留现有 `bringFloatingLayerToFront` API 和所有组件接线。

## Decision (ADR-lite)

**Context**: 动态层级计数器从 `90` 开始，首次技能悬停得到 `91`；未交互聊天按钮使用静态回退 `120`，因此第一次悬停被遮挡。点击聊天后，聊天改用动态 `91`，下一次技能悬停得到 `92`，才产生“点一次聊天后恢复”的表象。

**Decision**: 使用有界两级模型：普通浮层最高 `140`，最新交互浮层固定 `141`；每次交互替换当前激活层，而不是继续递增。

**Consequences**: 修复所有房间浮层首次交互的同类风险；不新增组件专用层级例外，不改变最近交互者优先的行为，也不会因长时间交互越过模态遮罩。

## Out of Scope

- 不重做技能详情或聊天界面视觉。
- 不改变移动端房间布局。
- 不修改确认弹窗、结果弹窗或服务端逻辑。

## Technical Notes

- 动态层级所有者：`src/room/RoomBattleStage.jsx`
- 技能交互接线：`src/room/PlayerInfo.jsx`
- 聊天回退层级：`src/styles/themes/bright-school/component-repairs/chat.css`
- 成员面板回退层级：`src/styles/room/people-floating-replay.css`
- 模态遮罩基准：`src/styles/modals/base-result-skill.css`
- 定向测试：`src/room/RoomScreen.test.js`
- 前端架构：`docs/system-design/02-frontend-architecture.md`
