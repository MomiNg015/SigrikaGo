# 修复三批交互动效问题

## Goal

在不改变现有界面功能和整体视觉语言的前提下，完成三批交互动效改良：先修复减少动态效果、触摸悬停和高成本渲染问题，再让浮层开合更连贯、按压反馈更轻量，并为少量关键内容变化补充克制的入场提示。

## Requirements

* 顶部错误、成功、邮件和成就提示在 `prefers-reduced-motion: reduce` 下仍保持完整的 3 秒可见生命周期，只去除位移，保留末段透明度淡出。
* 对局房间顶部限时请求窗口的蓝色倒计时条改用 `transform: scaleX()`，不再逐帧修改 `width`，视觉方向仍为从左向右收缩。
* 移动端首页六个图片功能入口的悬停抬升、旋转和滤镜只在 `hover: hover` 且 `pointer: fine` 的设备上生效；键盘焦点和触摸按压反馈继续独立可用。
* Bright School 对局房间的技能选点棋盘外框保留当前粉、青、黄循环节奏与轮廓提示，但不再逐帧插值大面积多层 `box-shadow`。
* 基础主题中复用 `target-rainbow` 的棋盘、主动技能按钮和技能条也不得继续通过动画修改大面积 `box-shadow`。
* 所有新增或改写动效均包含减少动态效果处理，不安装新的动画库。
* 对局聊天/教程剧情记录浮窗使用可反向打断的 160ms 透明度与缩放过渡，关闭时不再瞬间卸载。
* 技能描述特性浮层的变换原点对齐箭头；向上/向下放置时从对应锚点方向进入。
* 手机端通用按压反馈不再统一过渡或修改 `filter`、`box-shadow`，只保留变换和必要的颜色反馈。
* 剧情回复选项、成就提示、结算积分/金币卡片、设置页签内容区获得短促且有明确层级提示作用的入场动画。

## Acceptance Criteria

* [x] 开启系统“减少动态效果”后，顶部提示不会在约 1ms 后变透明，约 3 秒后才淡出并卸载。
* [x] 限时请求倒计时条的关键帧只修改 `transform`，设置左侧变换原点，并保持线性计时。
* [x] 触摸设备不会因模拟 `:hover` 导致首页图片入口停留在抬升或旋转状态。
* [x] 鼠标设备上的首页入口仍有悬停反馈，键盘 `:focus-visible` 与触摸 `:active` 仍可辨识。
* [x] 技能选点状态仍清楚显示在棋盘外框、主动技能按钮和技能条上，Bright School 颜色循环及约 1.15 秒节奏保持不变。
* [x] 棋盘选点光效动画不逐帧修改多层大半径 `box-shadow`。
* [x] 相关 CSS 合约/单元测试通过，`npm run check` 通过。
* [x] 与本次主题动效事实相关的系统设计文档同步，并重新生成 `docs/system-design.html`。
* [x] 聊天/剧情记录浮窗可平滑打开和关闭，关闭态不可聚焦、不可点击，快速反向切换不会重播突兀关键帧。
* [x] 技能特性浮层的上下放置方向与箭头锚点一致。
* [x] 手机端通用按压合约不包含 `filter` 或 `box-shadow` 的全局过渡和按压滤镜。
* [x] 剧情回复最多以 40ms 间隔错峰出现，第四项后不继续增长延迟。
* [x] 成就提示比普通提示稍有强调，但普通提示与三秒生命周期不受影响。
* [x] 结算窗口只让积分、金币两张收益卡错峰进入，不滚动数字、不移动整个窗口。
* [x] 设置窗口只让新页签内容区轻微淡入上移，不移动整个设置窗口。
* [x] 第二、三批动效在减少动态效果模式下去除位移与错峰，只保留极短淡入或直接呈现。

## Definition of Done

* Tests added or updated for the affected CSS contracts.
* Lint, type-check, and repository checks pass.
* Documentation reflects the new motion and accessibility behavior.
* Changes stay isolated on `codex/animation-polish-audit-fixes`.

## Technical Approach

* 使用现有 CSS 动画与伪元素，不引入第三方依赖。
* 进入/退出与生命周期提示只使用透明度和变换；连续进度使用 `linear`。
* 将多层发光阴影固化为静态伪元素图层，通过透明度交叉淡化表达颜色变化；棋盘主体不参与逐帧绘制阴影。
* 用精细指针媒体查询隔离悬停专属反馈，保留 `:focus-visible` 和 `:active` 的可访问反馈。

## Decision (ADR-lite)

**Context**: 审查发现现有动效同时存在可访问性、触摸交互、渲染性能和层级变化缺少反馈的问题。

**Decision**: 在首批修复基础上继续完成用户确认的第二、三批；所有新增动画只服务于浮层来源、内容揭示或结果层级，不增加纯装饰循环。

**Consequences**: 改动覆盖多个界面，但每项均由具体组件类名独立持有，能够逐界面验证，并保留减少动态效果降级路径。

## Out of Scope

* 全仓库统一缓动 token。
* 改变技能选点的颜色、周期、功能状态或对局逻辑。
* 棋子、坐标、领地标记、首页分组、成就筛选列表、登录错误抖动或拖拽手势动画。

## Technical Notes

* 顶部提示：`src/styles/commerce/warehouse-toast/toast-stack.css`、`src/styles/themes/bright-school/effects/reduced-motion.css`。
* 房间倒计时：`src/styles/room/chat-responsive.css`、`src/styles/room/actions-requests/request-toast.css`。
* 移动端首页入口：`src/styles/mobile-adaptive/home-utility-interactions.css`。
* 技能选点光效：`src/styles/room/board/frame-coordinates.css`、`src/styles/room/actions-requests/action-states-tools.css`、`src/styles/room/players-timers-skills/skill-chips.css`、`src/styles/themes/bright-school/effects/board-targeting.css`、`src/styles/themes/bright-school/effects/keyframes.css`。
* Motion purpose: accessibility-preserving state indication and feedback; frequency ranges from occasional to tens of times per day.
* 第二批位置：`src/room/ChatBox.jsx`、`src/styles/room/chat-responsive.css`、`src/styles/base/skill-description.css`、`src/styles/mobile-adaptive/phone-interactions.css`。
* 第三批位置：`src/styles/modals/onboarding-story/actions-skip.css`、`src/styles/commerce/warehouse-toast/toast-stack.css`、`src/styles/modals/result-modal.css`、`src/styles/commerce/shop-settings/settings-panel.css`。
