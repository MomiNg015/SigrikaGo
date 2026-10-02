# 调整桌面首页工具按钮布局与悬停

## Goal

让 Bright School 桌面端主界面左下角六个图片工具按钮呈现自然、随手贴在背景板上的排列，同时复用部员手册与匹配入口的旋转反馈，并消除悬停导致主背景板高度细微变化的问题。

## Requirements

- 六个按钮使用稳定、各不相同的顺/逆时针小角度旋转；视觉随机但每次渲染保持一致，不引入运行时随机数。
- 桌面端 hover/focus 继续使用图片层旋转反馈，但角度提高到约 `3.8deg` 至 `4.4deg`，并沿每张图原有的顺/逆时针方向继续旋转，避免跨过零度造成视觉缩小。
- hover/focus 统一使用轻微 `scale(1.015)` 维持六张长条图片一致的视觉体积。
- 仅变换 `.utility-entry-art` 图片层；原生按钮容器、网格行高和命中区域保持固定。
- 桌面工具网格使用稳定行高，悬停前后主面板和背景板高度不得变化。
- 六张工具图稍微放大，并缩小水平/垂直间距；不得造成不可控遮挡或裁切。
- 保留现有点击行为、图片、可访问名称、focus outline、active、disabled、招募提示和 reduced-motion 处理。
- 本次只调整桌面端；移动端 2x3 布局、尺寸与触控行为保持不变。

## Acceptance Criteria

- [ ] 六个按钮默认角度有正有负且互不完全相同。
- [ ] hover/focus 最终角度约为 `3.8deg` 至 `4.4deg`，保持各自原旋转方向且过渡自然。
- [ ] 六张图 hover/focus 均轻微放大，不出现“招募”“观战”视觉缩小。
- [ ] hover/focus/active 时 `.utility-entry` 容器保持 `transform: none`，变换只发生在图片层。
- [ ] 桌面主面板高度、工具网格高度和按钮命中框在悬停前后不变。
- [ ] 工具图相较当前略大，按钮之间视觉间距更紧。
- [ ] 聚焦测试、构建和完整质量门通过。
- [ ] 1440×1000、1280×768、compact desktop 视觉检查无裁切或布局跳动。

## Technical Approach

在现有 `utility-toolbox` CSS 域中继续使用 tone 类变量，确定性偏移与旋转保持在 `.utility-entry-art`。桌面媒体层固定网格行高；每个 tone 同时定义同方向的 `--utility-hover-tilt`，hover/focus 平滑转至约 `3.8deg` 至 `4.4deg` 并轻微放大，按钮容器只负责稳定命中框和局部层级。

## Out of Scope

- 不修改玩家铭牌、部员手册、匹配入口本身。
- 不修改 React props、事件、资源路径、文案或音效。
- 不修改手机/平板布局与触控交互。

## Technical Notes

- 主要文件：`src/styles/themes/bright-school/home/utility-toolbox/toolbox-grid.css`、`toolbox-interactions.css`。
- 回归入口：`src/home/HomeScreen.test.jsx`、`src/styles/hudComponents.test.js`、CSS contract tests。
- 需同步 `docs/system-design.md` 与 `docs/system-design/06-ui-theme-mobile.md`，并运行 `npm run docs:system-design`。
