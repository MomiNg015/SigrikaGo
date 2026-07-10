# 修复审查发现的稳定性与质量问题

## Goal

按代码审查优先级处理问题 2–7，消除测试数据污染、历史数据查询退化、API 错误格式不一致、会话刷新竞态、弹窗无障碍缺口和质量门禁盲区，同时保持“用户可读取其他用户完整棋谱”的现有产品能力。

## What I already know

- 用户明确要求问题 1 不做；跨用户读取完整棋谱是允许行为。
- 当前工作树包含用户已有 CSS、Trellis 和图像提示词 WIP，实施必须避开无关改动。
- `npm run check` 是仓库主质量门禁，当前包含 Vitest、生产构建、生产配置检查和系统设计文档生成。
- Playwright E2E 与稳定性服务器没有显式覆盖 `DATABASE_URL`，本地会继承 `.env` 的开发数据库。
- `GameRecord` 当前没有索引，排行榜、成就检查和个人棋谱存在历史记录扫描。
- API 只有 JSON 语法错误处理，没有所有 `/api` 路由共享的末端 JSON 错误处理器。
- `LoginSession.adopt()` 每次鉴权都会更新 `lastSeenAt`；refresh token 轮换不是 compare-and-swap。
- 顶层弹窗语义和焦点管理不一致，嵌套弹窗没有统一的 Escape/返回键栈。

## Requirements

1. 隔离 E2E 与稳定性测试数据库；本地测试不得写入 `prisma/dev.db`，临时数据库必须可重复初始化并在测试结束后安全清理。
2. 为 `GameRecord` 增加与现有查询匹配的索引，并同步 Prisma schema、迁移、运行期旧库 schema guard 与测试。
3. 减少排行榜、成就检查和个人棋谱热路径的无界扫描：优先复用 `UserModeStats`/已有计数，个人列表采用分页或明确上限，同时保持当前响应语义。
4. 增加统一 API JSON 错误处理中间件；已知 `status`/`code` 错误保持客户端可读，未知错误不在生产环境泄露内部细节。
5. 会话活跃时间写入节流；refresh token 轮换使用原子 compare-and-swap，解决多标签页并发刷新使新 token 立即失效的问题。
6. 建立共享弹窗基础能力并迁移主要玩家弹窗：统一 dialog 语义、可访问名称、首次聚焦、焦点锁定、关闭后焦点恢复，以及嵌套弹窗优先关闭最内层；桌面端 Escape 和移动端返回键遵循同一顺序。
7. 扩充质量门禁，至少覆盖 React Hooks、JSX 可访问性、未处理的基础代码质量问题与真实 DOM 交互测试；保留现有契约测试。
8. 涉及架构、运行行为、接口、数据模型和技术债的事实同步到 `docs/system-design.md` 或对应分篇，并生成 `docs/system-design.html`。
9. 本人“履历-战绩/角色战绩”与其他用户“详细信息”必须使用同一份服务端计分战绩统计，不得从当前已加载的棋谱页推导。
10. 本人和其他用户的棋谱均可读取完整历史；列表每次加载 50 盘，滚动到底后使用不重不漏的游标继续加载更早 50 盘。

## Acceptance Criteria

- [ ] E2E/稳定性测试启动时使用唯一临时 SQLite 数据库，测试前初始化 schema，测试后无开发数据污染。
- [ ] `GameRecord` 所有新增索引同时存在于 Prisma schema、迁移和旧库启动 guard。
- [ ] 排行榜、成就和棋谱查询有针对性的查询/分页回归测试，不再依赖无界历史加载。
- [ ] 所有未捕获 API 异常返回 JSON；400/404 等领域错误保持对应状态码。
- [ ] 并发使用同一 refresh token 时最多一个请求成功；普通鉴权不会每次都写 `lastSeenAt`。
- [ ] 主要弹窗具有 `role=dialog`、`aria-modal`、可访问名称和焦点管理；嵌套弹窗 Escape 只关闭内层。
- [ ] 新增 lint/DOM 测试门禁可由 `npm run check` 执行。
- [ ] `npm run check` 通过；相关 Playwright 测试在隔离数据库上通过。
- [ ] 系统设计 Markdown 与 HTML 同步。
- [ ] 同一用户、同一模式下，本人履历与公开详细信息的总战绩和角色战绩一致，并排除友谊局。
- [ ] 棋谱接口返回 `{ records, nextCursor }`，首屏 50 盘，触底可连续加载至 `nextCursor = null`，友谊局仍保留。

## Definition of Done

- 针对每个修复补充单元或集成回归测试。
- 运行 lint、DOM 交互测试、Vitest、构建、生产配置检查、系统设计生成和隔离后的 Playwright 套件。
- 不覆盖或提交用户已有无关 WIP。
- 数据库迁移和运行期 guard 都具备幂等性。

## Technical Approach

- 测试数据库：由 Playwright 启动脚本创建 `.tmp/` 下唯一 SQLite 文件，设置 `DATABASE_URL`，执行 Prisma schema 初始化；进程退出后清理。
- 历史数据：增加双方用户/时间和模式/计分状态索引；排行榜从 `UserModeStats` 读取胜负统计，常用角色等无法直接取得的指标采用受控聚合；列表使用 cursor/上限。
- 战绩与棋谱分离：战绩复用 `/api/users/:id/profile?mode=` 的全部计分局统计；棋谱复用共享的 `(createdAt, id)` 复合游标分页，固定每页 50 条并允许加载全部历史。
- API：在 API 路由之后、静态托管之前安装统一错误处理中间件。
- 会话：`lastSeenAt` 使用时间阈值条件更新；refresh 使用旧 token hash 作为更新条件。
- 弹窗：新增无样式或低样式侵入的共享 dialog hook/primitive，与现有 CSS 类兼容，再迁移高频及嵌套弹窗。
- 质量：优先采用 ESLint flat config、`eslint-plugin-react-hooks`、`eslint-plugin-jsx-a11y` 和 Testing Library/jsdom；先建立可通过的基线，再逐步扩大规则。

## Decision (ADR-lite)

**Context**: 六项问题横跨测试环境、数据库、HTTP、鉴权和前端交互，需要一次任务内按风险顺序落地并保持兼容。

**Decision**: 先处理数据安全与扩展性，再处理 API/会话正确性，最后建立弹窗基础设施和质量门禁。棋谱跨用户读取保持公开产品能力。

**Consequences**: 会新增数据库迁移、共享基础设施和质量工具配置；主门禁耗时会增加，但测试数据安全性和回归发现能力显著提高。

## Confirmed Decisions

- 允许新增 ESLint、React Hooks/JSX a11y 插件、Testing Library 和 jsdom 等开发依赖。

## Out of Scope

- 不限制或移除跨用户完整棋谱读取能力。
- 不重做视觉主题或改变现有弹窗外观。
- 不迁移出 SQLite，也不实施多实例部署。
- 不全面 TypeScript 化整个仓库。

## Technical Notes

- 任务目录：`.trellis/tasks/07-10-review-stability-quality-fixes/`
- 重点文件：`scripts/start-stability-server.mjs`、`playwright*.config.js`、`prisma/schema.prisma`、`server/db.js`、`server/publicRoutes.js`、`server/achievements.js`、`server/replayRoutes.js`、`server/index.js`、`server/loginSessions.js`、`src/app/modalDismissal.js`、`src/modals/*`、`package.json`。
- 主质量门禁：`npm run check`。
