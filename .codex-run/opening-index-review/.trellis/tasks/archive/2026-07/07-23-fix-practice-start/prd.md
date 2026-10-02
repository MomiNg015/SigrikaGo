# 修复首页模式启动无响应

## Goal

修复 `HomeRoute` 性能边界引入的首页动作回调断链，使星炬、标准、五子棋匹配以及准时宝陪练恢复正常启动，同时保留首页不被房间/回放无关状态反复重渲染的性能收益。

## What I already know

- 生产环境与本地环境均可复现。
- 点击任一模式后，模式选择窗口会正常关闭，但不会进入匹配或陪练流程。
- `HomeScreen` 内部按钮行为正常，既有组件级准时宝测试也能通过。
- 根因位于 `AppRoutes -> HomeRoute` 边界：调用端传入 `onStartMatch`、`onStartPractice`、`onLogout`、`onSelectCharacter`，而 `HomeRoute` 错误读取 `startMatch`、`startPractice`、`logout`、`selectCharacter`，导致四个动作回调静默变成 `undefined`。

## Requirements

- 统一 `AppRoutes` 与 `HomeRoute` 的动作属性命名，不允许在 memo 边界发生隐式重命名漂移。
- 恢复星炬、标准、五子棋三种匹配模式的启动回调。
- 恢复准时宝陪练启动回调。
- 同时恢复同一断链影响的退出登录与角色选择回调。
- 保留 `HomeRoute` memo 渲染边界及现有视觉、交互、音效和预载行为。
- 在系统设计与前端质量规范中记录 memo 边界的回调透传契约。

## Acceptance Criteria

- [x] 从首页模式选择窗口点击星炬、标准或五子棋时，正确调用 `startMatch(mode)`。
- [x] 点击准时宝陪练时，先关闭模式窗口并正确调用 `startPractice(options)`。
- [x] `logout` 与 `selectCharacter` 仍被准确透传给 `HomeScreen`。
- [x] 房间/回放无关属性变化仍不会使 `HomeScreen` 重渲染。
- [x] 回归测试能在修复前复现回调为 `undefined`，并在修复后通过。
- [x] `npm run check` 通过，系统设计 HTML 已重新生成。

## Definition of Done

- 修复代码与回归测试已提交。
- 前端质量规范和系统设计同步更新。
- 全量 lint、测试、管理快照、生产构建和部署配置检查通过。
- 任务完成后归档并记录开发日志。

## Technical Approach

沿用 `HomeScreen` 既有公开属性名，在 `HomeRoute` 自身也使用 `onLogout`、`onSelectCharacter`、`onStartMatch`、`onStartPractice`，避免边界两侧使用不同词汇。测试直接检查 `HomeRoute` 最终传给 `HomeScreen` 的动作回调身份与可调用性，同时保留现有渲染次数断言。

## Decision (ADR-lite)

**Context**: `HomeRoute` 是为性能新增的薄 memo 包装层，不应重新定义业务回调接口。

**Decision**: memo 边界与被包装组件保持同名动作属性，并用边界测试覆盖关键回调。

**Consequences**: 修复范围小且不改变视觉或业务协议；以后新增首页动作时，需要同步验证真实回调透传，而不能只测试渲染次数。

## Out of Scope

- 修改匹配、陪练或房间创建的服务端协议。
- 改变登录后资源预载策略。
- 重做模式选择窗口视觉或交互。
- 处理与本缺陷无关的首页或房间功能。

## Technical Notes

- 主要代码：`src/app/AppRoutes.jsx`
- 主要回归测试：`src/app/AppRoutes.dom.test.jsx`
- 相关设计：`docs/system-design.md`、`docs/system-design/02-frontend-architecture.md`
- 相关规范：`.trellis/spec/frontend/quality-guidelines.md`
