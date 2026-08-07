# 修复西格莉卡特殊对局丢失后的恢复

## Goal

修复账号仍处于 `duel-active`、但对应特殊对局已从内存与 `PersistedRoom` 删除时无法继续黑化篇章的问题，使玩家可以重新进入一场有效的西格莉卡决战，而不会永久卡在“特殊对局数据暂时无法恢复”的 toast。

## What I already know

* `moming` 当前为 `sigrikaCandyUseCount=8`、`sigrikaCandyPhase=duel-active`、`sigrikaCandyRoomCode=67975`。
* 数据库中没有房间 `67975` 的 `PersistedRoom`，也没有该房间的 `GameRecord`。
* `server/socketSigrikaCandyEvents.js` 在 `duel-active` 找不到带 `sigrikaCandyDuel` 元数据的内存房间时只返回 `special_room_missing`，不会修复账号状态或重新创建房间。
* `server/roomCloseLifecycle.js` 会在未完成房间双方离线超过五分钟后以 `empty-room` 作废并删除房间，但不会同步回退账号级西格莉卡篇章状态。
* 已完成特殊对局通过 `server/roomResultPersistence.js` 在同一事务中写入 `GameRecord` 并推进到 `result-pending`；本修复不能破坏该结算边界。

## Assumptions

* 对于 `duel-active` 且权威运行时房间不存在的情况，旧的未完成特殊对局视为已失效。

## Open Questions

* 无。

## Requirements (evolving)

* `awaiting-duel` 仍按现有逻辑创建第一间特殊对局。
* `duel-active` 且有效特殊房间仍存在时，仍只恢复该房间，不创建重复房间。
* `duel-active` 且房间缺失或不再是对应特殊房间时，首次点击将账号回退到 `awaiting-duel`、清空旧房间号，并明确提示玩家旧房间已失效。
* 回退后不在同一次请求中创建新房间；玩家再次点击时再按现有 `awaiting-duel` 路径创建新决战。
* 已完成特殊对局、奖励/战绩隔离与恢复剧情状态机保持不变。
* 为正常创建、正常恢复、缺失房间重建与非法阶段补充服务端回归测试。
* 更新系统设计文档，明确特殊房间丢失时的恢复语义，并重新生成 `docs/system-design.html`。

## Acceptance Criteria (evolving)

* [ ] `moming` 这类 `duel-active + missing room` 状态首次点击后变为 `awaiting-duel`、旧房间号清空，并收到可理解的重试提示。
* [ ] 玩家再次点击即可进入新决战，账号房间号更新为新房间。
* [ ] 有效旧房间存在时不会创建第二间决战。
* [ ] 重建后的账号仍为 `duel-active`，且 `sigrikaCandyRoomCode` 指向新房间。
* [ ] `normal`、`corruption-story`、`result-pending`、`recovery-story` 等非法开始阶段仍被拒绝。
* [ ] 相关服务端测试通过。
* [ ] `npm run docs:system-design` 与项目质量门禁通过。

## Definition of Done

* Tests added/updated for the special-duel socket recovery paths.
* Relevant lint/typecheck/test gates pass.
* `docs/system-design.md`, the relevant split system-design chapter, and generated HTML stay synchronized.
* The existing unrelated worktree state is preserved.

## Out of Scope (explicit)

* 不恢复旧房间的棋盘进度；权威房间已不存在时从一盘新决战开始。
* 不改变特殊对局的规则、AI、结算、棋谱、奖励或剧情内容。
* 不改普通匹配、好友对局和练习房恢复策略。
* 不批量扫描或重写其他账号状态。

## Decision (ADR-lite)

**Context**: 缺失的旧房间无法恢复棋盘状态，但在一次点击中静默重建会让玩家误以为原局被续接。

**Decision**: 采用显式两步恢复。第一次点击只把 `duel-active` 回退到 `awaiting-duel` 并提示旧房间已失效；第二次点击才创建新决战。

**Consequences**: 玩家需要额外点击一次，但状态修复过程可见，不会把新局伪装成旧局续接；有效旧房间仍按原逻辑直接恢复。

## Technical Notes

* Primary handler: `server/socketSigrikaCandyEvents.js`.
* State transitions: `server/sigrikaCandyArc.js`, `src/shared/sigrikaCandyArc.js`.
* Regression tests: `server/socketSigrikaCandyEvents.test.js`.
* Empty-room cleanup source: `server/roomCloseLifecycle.js`.
* Design facts: `docs/system-design.md`, `docs/system-design/03-backend-realtime-api.md`, `docs/system-design/04-data-model-and-domain.md`.
