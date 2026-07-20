# 上线前阶段 3：稳定性与发布演练

## Goal

在阶段 0/1 安全加固和阶段 2 数据库迁移基线之上，把已有稳定性、容量、备份、监控和部署能力收敛为一套可重复的小范围内测发布门禁，并修复当前已知的不稳定测试夹具；不改变玩法、公开注册策略或单实例 SQLite 拓扑。

## What I already know

- 本任务从干净的 `codex/prelaunch-phase2` 创建 `codex/prelaunch-phase3`，主工作区的 UI、CSS、音频和资源 WIP 不在本任务范围。
- 项目已有 `verify:stability`、`verify:capacity -- --profile smoke|target`、独立 Playwright/容量临时数据库、进程重启恢复测试、健康检查、Nginx/systemd 模板和基础备份说明。
- 之前的完整稳定性运行出现过两类夹具问题：Aemeath 对局账号缺少当前所有权导致 403，以及移动项目偶发注册 429；单独重跑相关用例可通过，说明应先修复夹具隔离和前置数据，而不是修改产品授权或放宽生产限流。
- 阶段 2 已提供 `verify:migrations` 和新库/旧库接管文档；阶段 3 可以把迁移验证纳入发布演练，但不会实际迁移或重置真实 `prisma/dev.db`。
- 真实 2 核 2G 容量结论必须来自目标机的 `target` 报告；本机只执行 smoke 和验证工具链，不能据此提高线上软上限。

## Requirements

- 让生产式 Playwright 稳定性套件在桌面和移动项目之间拥有确定性的数据库、账号、限流和角色所有权前置条件。
- 修复已知 Aemeath 403 与跨项目/重复运行的注册 429 夹具问题，不改变生产权限判断和生产限流默认值。
- 增加一条阶段 3 本地发布候选门禁，按安全顺序组合迁移验证、生产配置检查、构建、稳定性套件和容量 smoke，并在任一步失败时停止。
- 为 SQLite 数据库提供可审计的备份与恢复验证入口；自动化测试只能使用一次性数据库，生产命令必须显式指定源和目标且拒绝覆盖源库。
- 明确内测发布、健康观察、回滚和旧数据库首次接管的操作清单；迁移接管失败时不得启动新版本。
- 为已有健康/运行指标给出最小监控项、告警观察线和发布后观察窗口，不引入外部监控供应商。
- 保持单 Node.js 实例、SQLite、公开注册和现有容量软上限不变。

## Acceptance Criteria

- [x] `npm run verify:stability` 在 desktop/mobile Chromium 项目中稳定通过，Aemeath 与认证限流夹具不再产生顺序依赖。
- [x] 容量 smoke 使用隔离数据库通过并输出 ack、重连、重启恢复、CPU/RSS/event-loop、持久化错误与阈值结果。
- [x] 发布候选门禁可一次执行阶段 2 迁移验证、生产配置、build、稳定性和容量 smoke，失败立即非零退出。
- [x] 一次性数据库的备份、完整性检查、恢复和哨兵数据校验自动化通过；路径保护拒绝真实开发库和源/目标重合。
- [x] 部署文档包含小范围内测的发布前、发布中、发布后、回滚和旧库首次接管步骤。
- [x] 系统设计 Markdown 与 HTML 同步。
- [x] lint、相关单元/集成测试、生产构建和可执行 smoke 门禁通过；既有无关 CSS 债务单独报告。

## Definition of Done

- 阶段 3 代码、测试、脚本、部署文档和系统设计提交到独立分支。
- 所有自动化数据库操作只落在明确的一次性目录；真实开发/生产库没有在实现验证期间被迁移、重置或覆盖。
- 目标机 `target` 压测仍作为上线前人工门禁记录，不把本机结果写成容量承诺。
- Trellis 任务归档、开发日志记录、工作树干净。

## Technical Approach

- 先运行现有稳定性和容量 smoke 得到阶段 2 基线，再针对失败根因做最小修复。
- 复用现有 Playwright 临时数据库和容量验证器，通过 run/project namespace、限流键或测试账号准备接口消除夹具串扰。
- 发布候选脚本只编排现有门禁，避免复制每个验证器的实现；提供跳过昂贵步骤的显式开发参数时，默认仍执行完整集合。
- SQLite 备份/恢复工具使用显式路径保护、SQLite 原生一致性机制和恢复后 `integrity_check`/哨兵校验；测试不接受仓库 `prisma/dev.db`。
- 文档把 fresh install、已有库首次 baseline adoption、普通版本更新和 rollback 分为四条路径。

## Decision (ADR-lite)

**Context**: 项目已经有较完整的实时稳定性与容量工具，但上线前仍缺少一条统一发布候选门禁、确定性稳定性夹具和可执行的备份恢复演练。

**Decision**: 阶段 3 以“修复夹具 + 编排现有门禁 + 补备份恢复演练 + 写发布运行手册”为主，不重做实时协议或引入新基础设施。

**Consequences**: 小范围内测前可以在本地和目标机复用同一验证入口；真实容量仍需要目标机报告，外部告警平台和自动部署留待后续运维接入。

## Out of Scope

- 不关闭公开注册，不增加邀请码或后台预创建账号。
- 不修改玩法、奖励、UI、主题样式、角色资源或音频。
- 不启用多实例、PM2 cluster、Redis、PostgreSQL 或 SQLite WAL。
- 不采购或配置 CDN、云监控、短信/邮件告警和 CI/CD 平台。
- 不修复与阶段 3 无关的既有 CSS 体积债务。
- 不在本机宣称完成真实 2 核 2G `target` 容量验收。

## Technical Notes

- Existing verification: `scripts/verify-stability.mjs`, `scripts/run-playwright-suite.mjs`, `scripts/playwrightTestDatabase.mjs`, `scripts/verify-capacity.mjs`, `scripts/capacityVerification.mjs`.
- Stability suite: `playwright.stability.config.js`, `tests/stability/`.
- Runtime/deployment: `server/runtimeServiceState.js`, `server/runtimeStabilityMetrics.js`, `deploy/`, `docs/deployment.md`.
- Phase 2 migration gate: `scripts/verify-migration-baseline.mjs`, `prisma/migrations/0_init/`.

## Validation Results

- `npm run verify:release-candidate`: passed end to end in 156 seconds; migrations, production config, build, 14/14 stability tests, backup/restore, and capacity smoke all passed.
- Capacity smoke: 20 sockets, 5 active rooms, 20 action acks, 4 reconnects, 20/20 restart resumes, 0 client/persistence/result errors; ack p95 91.47 ms, RSS peak 222,736,384 bytes, event-loop p95 102.24 ms under the 150 ms smoke diagnostic line.
- `npm run lint`: passed.
- Focused Phase 3 unit tests: 33/33 passed.
- Full suite excluding inherited `src/styles/cssLayerInventory.test.js`: 289 files / 2037 tests passed.
- The only broad-suite failure remains the pre-existing CSS total-bytes baseline (`1,217,982 > 1,215,814`); Phase 3 changes no CSS and does not update that baseline.
- `npm run docs:system-design`: passed and regenerated `docs/system-design.html`.
