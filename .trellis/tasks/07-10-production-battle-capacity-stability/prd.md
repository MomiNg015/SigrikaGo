# 提升生产对局稳定性与容量

## Goal

在不改变玩法、对局节奏和现有视觉体验的前提下，为 2 核 2G 单机部署建立可验证的生产稳定性边界：部署重启不丢失权威房间状态，关键对局动作可确认且可安全重试，过载时优先保护正在进行的对局，并逐步降低全量广播、观战和静态资源对源站的压力。

## What I already know

* 当前生产拓扑必须保持单 Node.js 实例，因为 `rooms`、匹配队列、在线 Socket 和部分运行态仍在进程内存中。
* 数据层是 Prisma 6.8.2 + SQLite；当前本地运行时实测 SQLite 3.46.0、`journal_mode=DELETE`、`busy_timeout=5000`、`synchronous=FULL`。
* 普通对局每房间每秒发送轻量 `room:clock`，关键状态变化发送 viewer-specific 全量 `room:update`。
* 房间状态以 5 秒节流写入 `PersistedRoom`，关键房间更新会强制持久化；SIGINT/SIGTERM 会等待 pending room persistence 后断开 Prisma。
* 当前 shutdown 只关闭底层 HTTP server，没有显式 drain 状态或 `io.close()`；现有 lifecycle 单元测试使用 mock server，稳定性用例覆盖页面 reload，但没有覆盖真实进程 SIGTERM/重启。
* `game:action` 当前没有 command/action id 或 ack；Socket.IO 默认只提供 at-most-once arrival guarantee。
* 当前客户端无限重连，初始延迟 500ms、最大 3000ms；每次连接/断开会向所有在线用户广播 lobby stats，服务重启时可能形成恢复风暴。
* 实测约 100 手、30 条聊天的房间：单玩家全量视图约 66KB、观战视图约 176KB、时钟 payload 约 261B、持久化快照约 65KB。观战响应当前重复序列化 black view。
* 当前 `public`/`dist` 资源约 162MB，登录与对局 preload 把多类图片、音乐和语音列为 critical；源站冷加载流量必须与实时对局流量隔离。
* 与本任务相关的 6 组 71 个 lifecycle、broadcast、persistence、socket handler 测试当前通过。

## Assumptions (temporary)

* 本任务按小批次实施和验证，先完成 P0 正确性，再做协议/负载优化，最后补部署与容量验证。
* MVP 继续使用单实例和 SQLite；不会在未升级并验证底层 SQLite 版本前直接启用 WAL。
* CDN/对象存储供应商配置属于外部基础设施，本仓库负责资源边界、缓存合同、示例配置和验证，不直接创建云资源。
* 对局进行中遇到短暂 drain 时，服务器宁可明确拒绝并 ack 当前动作，让客户端恢复后重试，也不能在 flush 后继续接受未持久化的状态变化。
* 所有改动保持旧房间快照可恢复，并为新增协议字段提供向后兼容默认值。

## Requirements (evolving)

### Phase 1 — P0 production reliability

* 增加显式 runtime drain/readiness 状态：停止新匹配和新约战，拒绝新的权威房间写操作，通知现有客户端即将重启。
* 重构 shutdown 顺序并设置硬超时：进入 drain、关闭 Socket.IO 客户端和 HTTP、flush 房间持久化、断开 Prisma；重复信号必须幂等。
* 为 `game:action` 增加客户端生成的稳定 `actionId`、服务端 ack、房间 revision 回传和按用户/房间的有限去重窗口；只有完成幂等后才允许有限重试。
* 保持现有 room patch/full snapshot 恢复路径为权威兜底；动作丢失或 ack 超时不得让客户端本地乐观状态冒充服务端状态。
* 增加真实进程级测试：活跃房间下 SIGTERM、进程退出、重新启动、玩家重连并恢复一致的棋盘/时钟/阶段。
* 增加健康与容量指标：event-loop delay、CPU/RSS/heap、Socket 数、房间/观战/匹配数、room update 字节与序列化耗时、持久化 backlog/错误、动作 ack 延迟、重连原因和恢复结果。
* 增加过载保护：达到软限制时拒绝新匹配和新观战，但不主动中断现有对局。

### Phase 2 — bounded realtime load

* [x] 消除 spectator payload 中重复的 black view，同时保持现有前端观战能力和隐藏信息语义。
* [x] 增加可配置的单房观战上限，默认值面向 2 核 2G 部署；拒绝时返回明确的用户提示。
* [x] 合并/去抖高频 lobby stats 广播，避免重连风暴形成 O(connections × reconnects) 扇出。
* [x] 审核匹配成功路径的重复 full snapshot 与重复强制持久化，在保持 preload/room transition 正确性的前提下去重。
* [x] 为后续 move/skill delta protocol 保留扩展边界；除非单独验证完整兼容性，本阶段不一次性重写全部房间协议。

### Phase 3 — deployment and capacity verification

* 把生产 Nginx 示例拆分为 `/socket.io/`、`/api/`、静态资源边界，显式配置 WebSocket timeout、buffering、缓存和上传路径。
* 更新 systemd 示例，加入合理的 `TimeoutStopSec`、文件描述符限制、退出/重启策略和 2GB 内存保护建议。
* 增加可重复的容量验证入口，覆盖 idle sockets、并发对局、观战、断线恢复、冷登录和 SIGTERM restart 场景。
* 同步 `docs/system-design.md`、相关分篇、`docs/deployment.md`，并生成 `docs/system-design.html`。

## Acceptance Criteria (evolving)

* [x] SIGTERM 后不再接受新匹配或新的权威对局动作，pending room snapshots 在 Prisma disconnect 前完成或明确超时失败。
* [x] Socket.IO 客户端收到计划重启通知并断开；服务恢复后通过现有 resume 路径返回权威房间快照。
* [x] 同一 `actionId` 被发送多次时最多执行一次，所有尝试获得一致 ack；正常动作 ack 包含最新 revision。
* [x] 真实进程重启测试验证棋盘、回合、时钟、房间阶段和持久化记录一致。
* [x] 达到软容量上限时，已有对局继续运行，新匹配/观战得到明确拒绝，不出现进程崩溃或静默超时。
* [x] spectator full payload 不再重复序列化同一 black view，前端观战和视角切换测试通过。
* [ ] 容量测试能输出 CPU、RSS、event-loop delay、ack/resume 延迟、发送字节、SQLite/persistence 错误和成功率。
* [ ] 目标压测建议线：500 sockets、100 active rooms、动作间隔 5–10 秒、20% 周期性重连；ack p95 < 200ms、p99 < 500ms，event-loop delay p95 < 50ms，RSS < 1.2GB，恢复成功率 > 99%，无持久化/结果保存错误。
* [ ] 相关单元、集成、稳定性测试与 `npm run check` 通过。
* [ ] 系统设计 Markdown、HTML 和部署说明同步。

## Definition of Done

* 每个阶段均有小范围回归测试，且关键失败路径有明确日志/指标。
* 运行 lint、Vitest、生产 build、生产配置检查、系统设计生成和相关 Playwright 稳定性用例。
* 不覆盖或提交当前工作树中的角色技能动效、CSS、图像提示词及其他无关 WIP。
* 风险改动具备配置开关、兼容默认值或清晰 rollback 路径。
* 在最终放宽线上容量前，必须在实际 2 核 2G 目标机运行容量验证；未经验证的数字只作为 soft limit。

## Research References

* [`research/realtime-reliability-and-sqlite.md`](research/realtime-reliability-and-sqlite.md) — Socket.IO delivery/shutdown/multi-node 约束、SQLite WAL 风险及其在当前仓库中的落地建议。

## Technical Approach

采用三阶段、兼容优先的演进方式。第一阶段先建立 drain 状态机、幂等命令 ack 和真实重启验证；第二阶段只做有明确收益且可单独验证的负载收敛，不整体重写房间协议；第三阶段把部署模板、容量测试和运行指标变成可重复执行的发布门禁。所有房间权威状态仍由服务端维护，客户端重连后以 full snapshot/revision 为准。

## Decision (ADR-lite)

**Context**: 2 核 2G 单实例的主要风险不是空闲 Socket 数量，而是部署重启竞态、at-most-once 动作丢失、SQLite 快照写入、全量快照和观战扇出。

**Decision**: 保持单实例与 SQLite 的 MVP 拓扑，先修复正确性和可观测性，再降低广播/观战成本；不通过直接开 PM2 cluster、盲目启用 WAL 或一次性重写协议来追求名义容量。

**Consequences**: 首轮会增加运行状态、协议 ack 与进程级测试；容量提升是渐进的，但每一步都有独立回滚边界。多实例、Redis Streams adapter、共享房间状态和 PostgreSQL 迁移留待独立架构任务。

## Confirmed Decisions

* 首轮只实施 Phase 1 P0 production reliability：drain/shutdown、`game:action` 幂等 ack、真实进程重启验证、容量与稳定性指标、已有对局优先的软过载保护。
* Phase 2 观战/广播瘦身与 Phase 3 部署/CDN/完整容量工具在 P0 通过质量门禁后再继续，不与首轮代码混为一个不可回滚批次。

## Out of Scope

* 本任务不直接采购或创建 CDN、对象存储、负载均衡器和云监控资源。
* 不在当前 SQLite 3.46.0 上直接切换 WAL。
* 不启用 PM2 cluster、多 Node worker 或多台应用服务器。
* 不迁移 PostgreSQL，不实现 Redis 共享房间/匹配/在线状态。
* 不改变棋局规则、计时规则、技能效果、奖励和玩家可见视觉设计。
* 不在 Phase 2 未单独确认前重写完整 room protocol。

## Technical Notes

* 任务目录：`.trellis/tasks/07-10-production-battle-capacity-stability/`
* 核心服务端边界：`server/index.js`、`server/serverLifecycle.js`、`server/socketEvents.js`、`server/socketGameEvents.js`、`server/roomRuntime.js`、`server/roomBroadcasts.js`、`server/roomStatePersistence.js`、`server/roomView.js`、`server/runtimeStabilityMetrics.js`。
* 核心客户端边界：`src/app/gameSocket.js`、`src/app/socketHandlers.js`、`src/app/roomPatch.js`、`src/app/resumeSession.js`。
* 部署/验证边界：`docs/deployment.md`、`scripts/start-stability-server.mjs`、`tests/stability/`、`playwright.stability.config.js`。
* 当前脏工作树属于用户，实施必须逐文件作用域化，不能 broad stage 或覆盖无关文件。
