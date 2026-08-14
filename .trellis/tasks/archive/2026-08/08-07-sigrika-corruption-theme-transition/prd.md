# 新增正常与黑化界面双向全屏转场

## Goal

为正常 Bright School 界面与西格莉卡黑化界面之间的真实状态切换增加与现有视觉语言一致的双向全屏转场，消除根级主题类、剧情浮层、持续故障场、角色表现和背景音乐瞬间切换造成的僵硬感，同时保证桌面和竖屏移动端流畅、可靠且不会因接口失败被永久遮挡。

## Requirements

* 进入黑化采用“故障吞噬”演出：当前画面先出现短促横向错位与危险红断层，再由炭红数据层覆盖全屏；遮挡峰值提交黑化用户状态并切换背景音乐，随后以断层撕开方式露出已挂载持续故障场的黑化界面。
* 恢复正常采用“纸面复原”演出：持续故障切片收束，暖白纸面层覆盖全屏；遮挡峰值提交正常用户状态并卸载持续故障场，随后退开纸面层露出正常 Bright School 界面。
* 进入转场只由 `corruption-climax` 的持久化高潮请求触发；恢复转场只由恢复剧情结束请求触发。刷新、重新登录或预加载后已经处于黑化状态的账号不得重复播放转场。
* 转场状态机采用 `covering -> covered -> revealing`，遮挡动画与服务端请求并行：最短遮挡完成后等待请求结果，成功才在全屏遮挡下提交用户状态；失败时揭回原状态并继续使用现有错误 Toast。
* 同一时刻只能运行一次状态转场，重复高潮或恢复请求继续服从现有请求锁；组件卸载和动画取消不得留下全屏交互遮罩。
* 全屏转场必须盖住现有 `z-index: 100100` 的剧情播放浮层，并作为 `.app-shell` 直属语义层从根级黑化灰度/亮度过滤器中排除，避免转场自身被去色。
* 转场进行期间只短暂拦截指针输入，不渲染可访问文本或抢夺焦点；根容器使用准确的忙碌状态，转场结束或失败后恢复交互。
* 桌面进入转场目标总时长约 500ms，恢复约 400ms；接口较慢时只延长完全遮挡的 `covered` 阶段，不延长入场或揭露动画。
* 移动端不动画布局属性或全屏 `backdrop-filter`，主要使用 `transform`、`opacity` 和有界切片层；仅在转场活跃期间声明必要的合成提示，不让持续页面长期持有新的 `will-change`。
* `prefers-reduced-motion: reduce` 下改为短促、无错位切片和无闪烁的炭红/暖白覆盖淡变，仍保持“先遮挡、再提交状态、后揭露”的功能顺序。
* 复用现有黑化炭红、危险红、暖白纸面和离散数据断层语言，不修改持续故障场、黑化主页、黑化手册、特殊匹配或特殊房的既有视觉合同。
* 不新增第三方动效依赖，不使用浏览器 View Transition 快照替换现有 React/Portal/Pixi 渲染路径。

## Acceptance Criteria

* [ ] 剧情进入 `corruption-climax` 后先出现全屏故障吞噬转场，黑化根级类、黑化角色表现和持续故障场只在完全遮挡阶段提交并在揭露后可见。
* [ ] 恢复剧情结束后先出现全屏纸面复原转场，正常根级类和普通界面只在完全遮挡阶段提交并在揭露后可见。
* [ ] 高潮或恢复接口失败时揭回原界面、显示现有错误提示且不存在残留的全屏遮罩或交互锁。
* [ ] 已处于黑化状态的刷新、登录和普通用户资料同步不会误触发全屏转场。
* [ ] 转场层计算层级高于剧情播放器，黑化根级过滤器不会给转场层添加灰度、对比度或亮度滤镜。
* [ ] 360x800、390x844、412x915 竖屏以及 1280x720、1440x900 桌面均无横向溢出、布局位移或明显掉帧。
* [ ] reduced-motion 下不播放横向错位、离散撕裂或高对比闪烁，但状态仍在遮挡峰值切换。
* [ ] 聚焦状态机、App 边界、DOM 结构、CSS 合同和失败路径测试通过。
* [ ] `npm run build`、相关聚焦测试、`npm run docs:system-design` 与可归因的仓库质量门通过。

## Definition of Done

* 新增或更新状态机、App 集成、DOM/CSS 合同及失败恢复测试。
* 使用真实本地页面验证进入和退出方向的桌面与竖屏表现，并检查 reduced-motion。
* 同步更新 `docs/system-design.md` 与相关前端/UI 分篇，运行 `npm run docs:system-design` 重新生成 HTML。
* 不改动或回退与本任务无关的现有任务、视觉资产和功能行为。

## Technical Approach

新增独立的一次性 `SigrikaCorruptionTransition` 呈现层和小型转场控制器。控制器接收方向与异步状态准备函数，立即进入 covering 并并行等待接口；CSS covering 动画结束与接口成功都满足后进入 covered，在该阶段执行唯一一次 `updateUser`，下一帧进入 revealing。revealing 动画结束后彻底卸载转场层并清理锁。失败路径不执行用户提交，而是从完全遮挡态揭回原方向并转交现有错误处理。

转场层作为 `.app-shell` 直属节点使用语义层级变量，明确高于 onboarding story backdrop。进入方向使用有限数量的水平断层、炭红实体覆盖与低成本红色扫描；退出方向使用收束故障层与暖白纸面覆盖。持续 `SigrikaCorruptionOverlay` 仍只由已提交用户状态控制，因此会在进入遮挡下挂载、退出遮挡下卸载，完成无缝交接。

## Decision (ADR-lite)

**Context**: 当前 `updateUser` 会立即改变根级 `is-sigrika-corrupted`，而持续故障场只在黑化后挂载且层级低于剧情窗口；对整页做普通透明度补间无法可靠覆盖 Portal、剧情浮层和 Pixi/棋盘内容，也不能协调异步失败。

**Decision**: 在两个持久化边界显式运行“异步准备 + 全屏遮挡 + 遮挡峰值提交 + 揭露”的一次性状态机，使用独立 DOM/CSS 层而不是修改持续故障场或引入 View Transition API。

**Consequences**: 状态切换时序变得显式且可测试，接口慢时可以在安全遮挡态等待；需要为两个 App 边界增加小量编排逻辑，并为高层转场维护一个新的语义 z-index 合同。

## Out of Scope

* 重设计持续黑化故障场、黑化主页、部员手册、匹配窗口、特殊房或结果窗口。
* 修改西格莉卡糖果剧情节点、服务端阶段模型、接口语义、恢复规则或持久化结构。
* 新增转场音效、替换现有黑化 BGM，或调整现有背景音乐解析优先级。
* 为普通路由切换、主题选择或其它角色状态建立通用页面转场框架。
* 调整 admin 移动端行为。

## Technical Notes

* 根级状态与两个更新边界位于 `src/app/App.jsx`。
* 持续视觉层为 `src/app/SigrikaCorruptionOverlay.jsx` 与 `src/styles/mobile-adaptive/sigrika-corruption/damage-field.css`。
* 根级黑化过滤与层级合同位于 `src/styles/mobile-adaptive/sigrika-corruption/shell.css`。
* 剧情播放器层级位于 `src/styles/modals/onboarding-story/shell.css`，当前为 `100100`。
* 黑化样式通过最终 `src/styles/mobile-adaptive/sigrika-corruption.css` 汇总，新增转场 owner 应保持在该边界内并由 CSS inventory/contract 测试约束。
