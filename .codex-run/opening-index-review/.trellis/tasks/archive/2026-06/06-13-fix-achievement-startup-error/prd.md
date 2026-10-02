# 修复成就系统启动报错

## Goal

修复成就系统与个性化装备改动后导致的项目启动报错，保证开发启动链路、后端启动 schema guard、前端构建入口都能正常运行。

## What I Already Know

- 报错发生在刚完成的成就系统与个性化装备任务之后。
- 最近提交新增了 Prisma 成就模型、`server/achievements.js`、启动 schema guard、玩家/后台成就 API、前端成就与个性化弹窗。
- 当前工作区除本修复任务外只有 `.codex-temp/` 临时目录未提交，应继续排除。

## Requirements

- 复现启动报错并记录根因。
- 只修复导致启动失败的最小范围问题。
- 如涉及架构、接口、数据模型或系统设计事实变化，同步更新系统设计文档并运行 `npm run docs:system-design`。
- 保持刚完成的成就系统功能意图不变。

## Acceptance Criteria

- [ ] `npm run dev` 或等价启动检查不再因该问题失败。
- [ ] 相关单元/集成测试覆盖修复点。
- [ ] `npm test` 通过，或说明无法运行的原因。
- [ ] `npm run build` 通过，或说明无法运行的原因。
- [ ] 如果修改系统设计文档，`npm run docs:system-design` 通过。

## Definition of Done

- Root cause 已定位，不做猜测式修复。
- 修复提交为独立 `fix:` commit。
- Trellis 任务归档并记录 session。

## Out of Scope

- 不新增新的成就功能。
- 不重构成就系统整体设计。
- 不处理与启动报错无关的 `.codex-temp/` 临时目录。

## Technical Notes

- 优先检查启动堆栈、最近提交 `92be79e` 涉及的启动链路、Prisma delegate/schema guard、前端模块导入。
- 相关规范：`.trellis/spec/backend/database-guidelines.md`、`.trellis/spec/frontend/state-management.md`。
