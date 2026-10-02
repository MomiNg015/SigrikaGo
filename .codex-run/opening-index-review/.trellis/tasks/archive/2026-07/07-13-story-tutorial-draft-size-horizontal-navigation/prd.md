# 修复剧情教学草稿容量与节点区横向导航

## Goal

让后台剧情教学编辑器在脚本节点持续增长后仍能可靠保存草稿，并让用户无需滚动到整个节点列表末尾即可左右浏览流程图。

## What I already know

- 编辑器通过 `PATCH /api/admin/story-scripts/:key` 整体提交当前剧情脚本草稿。
- 客户端会把草稿节点、分支选项与棋盘设置一起序列化为 JSON。
- 服务端当前在所有 API 路由前统一使用 `express.json({ limit: "64kb" })`；大型剧情草稿超过该阈值后会在进入后台路由前触发 HTTP 413，并暴露默认的 `request entity too large` 文案。
- 自动流程图由 `.admin-story-workbench-flow-canvas` 承担横向与纵向滚动，但其父级只有最小高度、没有确定的视口高度；节点增长时画布会随内容变高，原生横向滚动条因此落在所有节点之后。
- 现有编辑器采用自动主线与分支泳道，不允许拖拽节点，也不需要手动画线；本任务应保留这一交互模型和视觉体系。

## Confirmed Decisions

- 剧情脚本草稿使用一个受控的后台专属 JSON 请求上限，而不是提高所有公开 API 的上限。
- 自动流程图在桌面端使用视口约束高度和内部纵向滚动，使原生横向滚动条持续位于画布可见底边；窄屏继续避免难以操作的多层嵌套滚动。
- 用户已确认按上述推荐方案实施。

## Requirements (evolving)

- 大型剧情脚本能够保存草稿，不再因全局 64kb JSON 限制失败。
- 只为剧情脚本后台保存链路开放更高的 JSON 上限，其他 API 继续沿用 64kb 防护。
- 请求仍然超过剧情脚本专属上限时，返回清晰的中文 JSON 错误，而不是 Express 默认英文错误。
- 节点变多后，无需滚动到整个流程末尾即可使用横向滚动条。
- 保持现有自动流程图、节点卡片、分支泳道、浮动节点设置窗口和主题样式不变。
- 横向与纵向滚动仍支持鼠标、触控板和键盘，不引入依赖。

## Acceptance Criteria (evolving)

- [x] 超过 64kb、但处于剧情脚本专属上限内的 `PATCH /api/admin/story-scripts/:key` JSON 请求可被正常解析并进入路由。
- [x] 非剧情脚本 API 仍受 64kb JSON 请求体上限保护。
- [x] 超过专属上限时返回 HTTP 413 和可操作的中文 JSON 错误。
- [x] 桌面端流程画布高度受视口约束，节点在画布内部纵向滚动，横向滚动条始终停留在画布可见底边。
- [x] 窄屏布局不因固定高度产生内容遮挡或冲突滚动。
- [x] 后端请求体和剧情教学编辑器聚焦测试通过。
- [x] `npm run docs:system-design` 与独立 `npm run build` 通过。
- [ ] `npm run check` 全绿：当前仅被继承的非本任务棋子渐变 WIP 触发 CSS `hardcodedHexCount` 2269 > 2268 阻塞；本任务新增 CSS 不含十六进制色值。

## Definition of Done

- Tests added or updated for the scoped body parser, 413 response, desktop flow viewport, and narrow-screen fallback.
- Lint, type-check, tests, build, and project check pass.
- `docs/system-design.md` and the relevant `docs/system-design/` chapter describe the route-specific payload budget and flow-canvas scrolling contract.
- `docs/system-design.html` is regenerated.
- Rollback remains a local removal of the scoped parser and canvas-height rules.

## Out of Scope

- Redesigning the story graph data model or switching to incremental node persistence.
- Adding node drag-and-drop, zoom/pan, minimaps, or a new graph library.
- Raising the JSON request limit for unrelated public, player, or admin APIs.
- Restyling node cards, branch lanes, preview panels, or the floating node settings window.

## Technical Notes

- Save surface: `src/admin/AdminOnboardingStory.jsx` (`submit`, `toSubmitPayload`).
- Client serialization: `src/api/client.js`.
- Current global parser and route mounting: `server/index.js`.
- Backend route: `server/adminRoutes.js` (`PATCH /story-scripts/:key`).
- Error JSON handling: `server/httpErrors.js`.
- Flow surface: `src/styles/admin/story-workbench/flow/shell.css`.
- Existing UI regression anchor: `src/admin/AdminOnboardingStory.test.jsx`.
- Preserve the workbench-relative floating settings window and sticky internal editor header.

## Decision (ADR-lite)

**Context**: Large story drafts need more capacity, but globally relaxing body limits would unnecessarily expand the request surface. The graph needs persistent horizontal access without adding a fragile synchronized scrollbar.

**Decision**: Parse story-script admin JSON with a higher route-specific limit before the default 64kb parser, provide a localized 413 response, and constrain the desktop graph canvas to a viewport-relative height so its existing native scrollbar remains visible.

**Consequences**: Large story drafts remain a single atomic save and can grow substantially without weakening unrelated endpoints. Very large scripts still have a hard cap and a clear recovery message. The graph gains an internal vertical scroll region on desktop while narrow screens retain document flow.
