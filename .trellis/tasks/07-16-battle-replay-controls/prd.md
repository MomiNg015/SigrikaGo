# 调整对局回放头部与步进控件

## Goal

精简对局界面的视角/模式提示与回放控制区，让回放手数更清晰，并补齐一次前后跳转五手的快捷操作。

## What I already know

- `src/room/header/RoomHeader.jsx` 当前通过 `.room-view-status` 渲染“棋谱回放 / 实时观战 / 观战回看 · 黑白方视角”的小字行。
- `src/room/actionBar/ReplayActionBar.jsx` 同时服务棋谱回放与实时观战回看，已有首手、上一手、下一手、末手控制，所有跳转均通过 `onReplayStep`。
- 当前手数 `.replay-step-indicator` 带 `MonitorPlay` 图标；移动端已有隐藏该图标的补丁，但桌面端仍显示。
- 末手按钮在观战回看时额外渲染可见文本“回到实时”，同时已有 `title` / `aria-label`。
- 前后五手可以复用现有步数回调，并在 `0..replayMax` 内截断，无需新增房间协议或服务端状态。

## Assumptions

- “去掉关于视角、实战/回放那一行的小字提示”指完全移除 header 中的 `.room-view-status` 行，而不是只删部分词语。
- 五手按钮采用纯图标按钮，保留明确的 `title` 与 `aria-label`，顺序为：首手、后退五手、上一手、手数、下一手、前进五手、末手。
- 跳转不足五手时截断到第 0 手或最后一手；到达边界后对应方向按钮禁用。

## Requirements

- 对局 header 不再显示视角与实时/回放状态的小字行。
- 回放功能区的手数指示器不再显示回放图标，手数文本在其区域内水平、垂直居中。
- 末手按钮保持图标和无障碍名称，但不再显示“回到实时”文字。
- 新增后退五手、前进五手纯图标按钮，跳转结果限制在合法手数范围内。
- 前后五手按钮同时用于棋谱回放和观战回看。
- 桌面与竖屏移动端均保持控件可用、不溢出。

## Acceptance Criteria

- [x] 对局 header DOM 中不再渲染 `.room-view-status` 及对应文案。
- [x] 棋谱回放/观战回看工具栏的手数区域不含 `MonitorPlay` 图标，手数垂直居中。
- [x] 末手按钮不渲染“回到实时”可见文本，但仍有正确的 `title` 和 `aria-label`。
- [x] 后退五手从第 3 手到第 0 手、从第 8 手到第 3 手；前进五手从倒数 3 手到末手、从第 3 手到第 8 手。
- [x] 到达首手或末手时，相应方向按钮正确禁用。
- [x] 相关组件测试、CSS/布局契约测试通过。
- [x] `docs/system-design.md` 与相关前端/UI 分篇同步记录新行为，并重新生成 `docs/system-design.html`。

## Definition of Done

- 实现与测试更新完成。
- `npm run check` 及相关对局稳定性验证通过。
- `npm run docs:system-design` 生成文档成功。
- 不混入当前工作区中与本任务无关的既有修改。

## Out of Scope (explicit)

- 不修改棋谱数据格式、服务端房间协议或回放生成逻辑。
- 不重做对局底部功能区的整体视觉风格。
- 不改变玩家头像点击切换视角的现有交互与无障碍文案。

## Technical Notes

- 主要实现入口：`src/room/header/RoomHeader.jsx`、`src/room/actionBar/ReplayActionBar.jsx`。
- 主要测试入口：`src/room/ActionBar.test.js`、`src/room/RoomScreen.test.js`。
- 相关样式入口：`src/styles/room/actions-requests/replay-disabled.css` 及移动端回放工具栏所有者文件。
- 项目 CSS 采用分层 owner 规则；改动应使用最小范围选择器并保持 Bright School 最终移动端安全层兼容。

## Decision (ADR-lite)

**Context**：棋谱回放和观战回看共用 `ReplayActionBar`，如果只在一种模式提供五手跳转，会造成相同控件结构下的行为不一致。

**Decision**：在两种模式中都提供后退五手和前进五手按钮，共用合法范围截断规则。

**Consequences**：不新增模式分支或服务端协议；移动端工具栏由五列扩展为七列，需要针对窄屏验证按钮密度与手数居中。

## Validation

- `npm run check`：通过（ESLint、281 个测试文件 / 1988 项测试、生产构建、生产配置、系统设计生成）。
- `npm run verify:battle-fixes`：通过（22 个测试文件 / 413 项测试及系统设计生成物检查）。
- `$env:STABILITY_PORT='4181'; npm run verify:stability -- tests/stability/skill-effects.spec.js`：通过（桌面/移动端 4 项真实浏览器用例）。
