# 修复登录后回退登录页

## Goal

修复玩家登录后页面短暂加载又回到登录界面、且没有错误反馈的问题，保证登录成功后的当前用户刷新链路稳定，并在失败时给出可见错误。

## What I Already Know

- 问题出现在成就系统与个性化装备改动之后。
- 新增 `/api/me` 响应里包含 `achievementStats`、`achievementEquipment` 和 `achievementUnlocks`，登录后首页刷新会调用该接口。
- 用户观察到页面“加载一下又退回登录界面”，说明登录请求可能成功，但后续身份校验或 `/api/me` 处理失败导致前端清空会话。
- 当前工作区只有 `.codex-temp/` 临时目录未提交，应继续排除。

## Requirements

- 复现登录后的接口/前端链路，定位具体失败接口和根因。
- 最小修复导致登录后回退的代码。
- 如果后端发生 500，前端不能静默吞掉导致用户无反馈。
- 保持成就系统功能意图不变。

## Acceptance Criteria

- [ ] 登录成功后不再自动回到登录页。
- [ ] `/api/me` 对已有用户返回成功，或在真实未授权时返回明确 401。
- [ ] 添加/更新回归测试覆盖登录后用户刷新链路。
- [ ] `npm test` 通过。
- [ ] `npm run build` 通过。
- [ ] 如修改系统设计事实，更新系统设计文档并运行 `npm run docs:system-design`。

## Definition of Done

- 根因已记录，避免猜测式修复。
- 独立 `fix:` commit。
- Trellis 任务归档并记录 session。

## Out of Scope

- 不改登录 UI 视觉设计。
- 不新增认证机制。
- 不处理无关的 `.codex-temp/` 临时目录。

## Technical Notes

- 优先检查 `server/playerRoutes.js`、`server/achievements.js`、`src/app/useHomeUserRefresh.js`、认证/session API client。
- 用接口级请求确认 `/api/login` 与 `/api/me` 的状态码和响应体。
