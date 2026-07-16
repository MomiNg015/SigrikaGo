# 修复移动端对局回退行为

## Goal

让移动端系统回退键在对局界面复用房间内“离开房间”行为，而不是触发应用级“退出游戏”确认。

## Requirements

- 对局回放中按系统回退，直接返回主界面。
- 观战中按系统回退，离开观战房间并直接返回主界面。
- 未结束的玩家对局中按系统回退，触发现有“对局还没结束，是否认输并退出房间？”确认提示。
- 确认后沿用现有认输与离房流程；取消后留在当前对局。
- 房间之外的移动端系统回退继续使用现有应用退出确认。
- 顶层业务弹窗仍优先响应回退关闭，不被房间回退逻辑抢占。

## Acceptance Criteria

- [x] App 外层在 `view === "room"` 且房间已加载时，把系统回退转发给 `RoomScreen`。
- [x] `RoomScreen` 使用与离开按钮相同的 `requestExitConfirm` 处理转发事件。
- [x] 回放与观战直接执行既有 `onBack` 导航计划。
- [x] 活跃玩家对局显示既有认输退出确认。
- [x] 非房间页面仍显示应用级退出确认。
- [x] 回归测试覆盖事件转发与三类房间分支。
- [x] 系统设计文档与生成 HTML 同步。

## Definition of Done

- 定向测试和完整 `npm run check` 通过。
- 不改动桌面离开按钮行为。
- 不提交工作区现有无关改动。

## Technical Approach

在 App 外层的移动端根回退守卫中，为房间视图递增一次性请求编号，并传给 `AppRoutes` / `RoomScreen`。`RoomScreen` 仅在编号变化时调用现有 `requestExitConfirm`，因此系统回退与界面离开按钮共用同一分支和确认文案。

## Decision (ADR-lite)

**Context**: 当前 `useRootBackExitGuard` 对 `room` 视图也统一打开应用退出确认，而正确的回放、观战和活跃对局分支已经存在于 `RoomScreen.requestExitConfirm`。

**Decision**: 转发移动端回退意图，不复制房间退出判断或确认框。

**Consequences**: 房间行为继续只有一个所有者；未来修改离房提示时，界面按钮与系统回退会同步。

## Out of Scope

- 不改变桌面浏览器返回键行为。
- 不改变教学对局的退出流程。
- 不修改服务端认输或离房协议。

## Technical Notes

- 根回退守卫：`src/app/modalDismissal.js`
- 应用接线：`src/app/App.jsx`、`src/app/AppRoutes.jsx`
- 房间退出所有者：`src/room/RoomScreen.jsx`
- 导航计划：`src/app/roomNavigation.js`
