# 调整回放、陪练与观战界面

## Goal

以窄范围修改完善回放、准时宝陪练、观战列表和对局结果界面，减少无价值提示、增强陪练入口辨识度，并让玩家在切换观战模式前看到各模式当前可观战房间数量。

## Requirements

- 对局回放分页列表加载到末尾时，不再渲染“已加载全部棋谱”。
- 对局模式选择中的“准时宝陪练”图片按钮在桌面和竖屏移动端各放大一档。
- “准时宝陪练”悬停时保持短时、顺时针旋转反馈；旋转轴锚在左侧角色主体附近，使右侧牌面产生清晰摆动。
- Bright School 最终主题层必须通过同一个按钮级 `transform` 合成定位、抬升和旋转，不能让通用按钮子元素重置覆盖图片动效；减少动态效果偏好只取消过渡，仍保留即时悬停状态。
- 观战对局列表上方三个模式选项卡在桌面和移动端均等分铺满整行。
- 每个观战模式选项卡显示对应模式当前开设的可观战房间数量；刷新和切换模式时统计一起更新。
- 观战模式选项卡文字与履历模式选项卡同为 16px，模式标题与房间数之间保留 `1em` 间距。
- 商店扎希拉气泡台词稍微放大：桌面 15px，移动端在 13–16px 之间响应式变化。
- 准时宝在房间玩家信息中的展示段位从“基础陪练”改为“入门陪练”，但内部 `basic` 难度、22 子胜利规则和快速开始配置保持不变。
- 准时宝对局结果不再显示“人机练习 · 不计成长 · 不保存棋谱”；友谊对局说明保持不变。
- 同步更新 `docs/system-design.md` 并生成 `docs/system-design.html`。

## Acceptance Criteria

- [x] 有棋谱且分页结束时，DOM 中不存在“已加载全部棋谱”；加载中、空列表和错误提示仍正常。
- [x] 陪练入口桌面宽度大于原 132px、移动端宽度大于原 126px；最终胜出层使用按钮级 CSS 变量合成定位与悬停旋转，顺时针 7 度且不受通用 `button > *` 重置影响，reduced-motion 下取消过渡但保留即时状态。
- [x] 观战选项卡为三列等宽且占满可用宽度，并显示星炬、标准、五子棋各自房间数。
- [x] 观战选项卡按钮字号为 16px，标题与房间数间距为 1em。
- [x] 扎希拉台词桌面字号为 15px，最终移动安全层字号下限不低于 13px。
- [x] 观战接口仅调用一次即可同时获得当前模式列表和全模式数量，练习房继续不进入统计。
- [x] `basic` 准时宝房间中的机器人段位为“入门陪练”，难度 id 和胜利阈值不变。
- [x] 准时宝结果弹窗中不存在人机练习说明，普通友谊对局仍显示原说明。
- [x] 相关前后端、组件和 CSS 合约测试通过，仓库质量门通过。

## Definition of Done

- 生产代码、定向测试和文档同步完成。
- `npm run docs:system-design` 成功生成系统设计 HTML。
- 运行与风险相称的定向测试并运行 `npm run check`。
- 不覆盖当前工作区中与本任务无关的未提交改动。

## Technical Approach

- 从 `PaginatedReplayList` 删除仅用于终态提示的分支。
- 在观战 HTTP 响应中基于一次 `listWatchRooms()` 快照构造每个规范模式的数量，并继续按查询模式返回列表；客户端保存数量映射并传给选项卡。
- 调整观战专属样式所有者 `src/styles/lobby/watch-list.css`，移除桌面 `max-content` 收窄覆盖；数量作为按钮正文的一部分，保留原生 tab 语义。
- 调整现有陪练入口 CSS 尺寸；用按钮级变量合成居中、抬升和 7 度悬停/键盘聚焦旋转，并让 Bright School 最终控件层复用同一合成式。子图片只保留滤镜反馈，避免通用 `button > *` 重置覆盖；reduced-motion 只取消过渡。
- 观战专属按钮显式对齐履历使用的 16px 默认字号，并用 `1em` 作为标题与数量的语义间距。
- 在商店气泡基础所有者和最终移动安全层同步增大台词字号。
- 在房间工厂中将准时宝的展示段位固定为“入门陪练”，不修改共享难度标签。
- 结果弹窗仅保留非练习、非计分友谊对局的说明分支。

## Decision (ADR-lite)

**Context**: 观战选项卡需要同时展示三个模式的房间数，而现有接口只返回当前模式列表。

**Decision**: 扩展同一个观战接口响应，返回当前模式 `rooms` 与一次快照计算出的 `roomCounts`，避免客户端为三个数字并发发起三次请求。

**Consequences**: 响应新增向后兼容字段；房间数随刷新或模式切换更新，不引入额外轮询或实时推送。

## Out of Scope

- 不更改准时宝 AI 强度、`basic` / `beginner` 内部难度 id 或胜利阈值。
- 不新增观战列表实时推送、轮询频率或新模式。
- 不整体重设计回放、观战、模式选择或结果弹窗。
- 不清理与本任务无关的结果说明 CSS。

## Technical Notes

- 前端组件：`src/modals/ReplayList.jsx`、`src/home/HomeScreen.jsx`、`src/modals/WatchModal.jsx`、`src/modals/gameLifecycle/ResultModal.jsx`。
- 样式所有者：`src/styles/modals/replay-mode-resume/match-mode-tabs.css`、`src/styles/mobile-adaptive/phone-core/match-mode.css`、`src/styles/lobby/watch-list.css`。
- 服务端路径：`server/publicRoutes.js`、`server/roomFactory.js`。
- 遵循 `.trellis/spec/frontend/css-architecture.md` 和 `.trellis/spec/frontend/quality-guidelines.md`，保持 Bright School 现有视觉语言与 44px 触控目标。
