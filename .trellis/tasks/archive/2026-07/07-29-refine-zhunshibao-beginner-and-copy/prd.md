# 调整准时宝陪练文案并恢复入门自制引擎

## Goal

降低入门陪练强度，让入门档恢复使用 GNU Go 接入前的本地自制启发式引擎；中级和高级继续使用成熟 GNU Go。同时按浏览器批注精简难度弹窗文案，使玩法与三档性格更直接。

## What I already know

- 当前三个公开档位全部通过 `server/practiceBotEngine.js` 调用 GNU Go。
- GNU Go 接入前的自制引擎实现仍可从提交 `8a221237` 的父提交恢复，核心入口是 `choosePracticeAction()`。
- 原入门参数是 `delayMs: [1200, 1800]`、`topChoices: 8`、`randomMoveChance: 0.25`。
- `practice:start` 当前无条件探测 GNU Go，因此改造后必须让入门档在 GNU Go 缺失时仍能创建。
- 新房三档的普通提子胜利阈值继续是 22，本任务不恢复旧入门房的 11 子新房规则。

## Requirements

- 入门档使用原自制启发式引擎和原入门选点参数。
- 中级、高级继续分别使用 GNU Go level 5 / 10，且 GNU Go 失败时不得回退自制走法。
- 只有需要 GNU Go 的档位在 `practice:start` 前执行可用性探测；入门档不依赖 GNU Go。
- 旧 `basic` 恢复别名保持现有 GNU Go 行为，不因公开入门档改造而改变。
- 难度弹窗移除顶部小字“准时宝陪练”。
- 弹窗标题从“选择难度”改为“准时宝陪练”。
- 说明改为两行：“随机猜先。”与“吃掉准时宝22颗子或数子胜即算胜利！”。
- 三档描述依次改为“沙包型准时宝”“一般型准时宝”“红温型准时宝”。
- 保持现有随机执色、选档即开始、返回/Escape/焦点恢复和移动端布局。

## Acceptance Criteria

- [x] 入门回合调用 `choosePracticeAction()`，不调用 GNU Go。
- [x] 入门在 GNU Go 不可用时仍能创建房间。
- [x] 中级和高级继续调用 GNU Go，缺失时仍返回 `practice_engine_unavailable`。
- [x] 中高级引擎运行失败仍按现有三次失败后明确结束策略处理，不生成自制兜底走法。
- [x] 弹窗只显示新的标题、两行规则说明和三条新描述，不再渲染顶部小字。
- [x] DOM、共享配置、Socket 和自动化测试覆盖新合同。
- [x] 393px 竖屏下弹窗内容完整、不横向溢出。

## Definition of Done

- 相关单元/DOM 测试、Lint 和构建通过。
- `docs/system-design.md`、后端分篇、代码规范和生成 HTML 同步。
- 仅提交本任务文件；现有 IRIS 字体与样式 WIP 保持未提交。

## Technical Approach

- 从 `8a221237^:server/practiceBotDecision.js` 恢复 `choosePracticeAction()` 及其私有评分辅助函数，同时保留当前数子阶段的 `obviousDeadBotGroups()`。
- 通过 difficulty 的 `strategy` 字段在自动化层显式分流：`beginner -> heuristic`，`intermediate/advanced/basic -> gnugo`。
- Socket 层依据已解析 difficulty 的 `strategy` 决定是否探测 GNU Go。
- UI 文案继续由 `PRACTICE_DIFFICULTY_OPTIONS` 与 `HomeScreen` 的难度弹窗消费，不新增第二套配置。

## Decision (ADR-lite)

**Context**: GNU Go level 1 对真正入门玩家仍偏强，但中高级需要成熟引擎提供明确强度差。

**Decision**: 只把公开 `beginner` 恢复为原启发式引擎；中级、高级及旧 `basic` 保持 GNU Go。引擎选择由显式 `strategy` 配置驱动。

**Consequences**: 入门更容易且无需本机 GNU Go；中高级继续保持成熟引擎质量。系统重新成为双引擎结构，因此测试和文档必须锁定“入门不是中高级失败兜底”。

## Out of Scope

- 不调整中级、高级 GNU Go 等级、缓存或超时。
- 不改变 22 子胜利阈值、数子流程、执色随机或房间持久化结构。
- 不重做弹窗视觉样式或新增难度。
- 不恢复任何中高级自制算法。

## Technical Notes

- `src/shared/practiceMode.js`
- `src/home/HomeScreen.jsx`
- `server/practiceBotDecision.js`
- `server/practiceRoomAutomation.js`
- `server/socketPracticeEvents.js`
- `.trellis/spec/backend/practice-room-contract.md`
- 研究记录：`research/beginner-engine-restoration.md`
