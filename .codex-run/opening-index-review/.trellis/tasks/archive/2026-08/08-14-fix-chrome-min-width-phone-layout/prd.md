# 修复 Chrome 最窄窗口手机布局判定

## Goal

让网页完全按当前视口尺寸选择完整桌面或紧凑布局，不再针对手机、平板或桌面设备身份；尺寸不适合时只显示“请用合适尺寸窗口进行游玩”。

## Requirements

- 保持桌面完整布局的最低尺寸 `1440 x 768` 不变。
- 保持既有可旋转紧凑范围：短边 `320–480px`、长边 `568–1024px`。
- 保持纵向窄窗扩展范围：宽度 `320–520px`、高度至少 `568px`。
- 用户提供的 `496 x 1047` Chrome 内容区必须进入紧凑布局。
- 不读取或判断 UA、触控点、pointer/hover、Client Hints、物理屏幕尺寸或任何设备身份；相同当前视口尺寸在手机、平板和桌面端结果完全一致。
- 拦截页删除“桌面端最低需要 1440 × 768 的可用窗口空间。”小字及对应无用样式，只保留图标与主提示。
- 不符合紧凑范围、又未达到完整桌面最低尺寸的视口显示新主提示“请用合适尺寸窗口进行游玩”。

## Acceptance Criteria

- [x] 任意设备视口 `496 x 1047` 时渲染紧凑应用内容，不渲染拦截提示。
- [x] 任意设备视口 `520 x 568` 放行，`521 x 1047` 与 `520 x 567` 拦截。
- [x] `390 x 844`、`932 x 430` 等既有横竖屏紧凑尺寸继续放行。
- [x] 不存在基于平板/手机/桌面身份的条件分支或监听。
- [x] `1366 x 768` 仍拦截，`1440 x 768` 仍放行。
- [x] 拦截面板 DOM 中不存在最低尺寸小字，只包含新主提示。
- [x] 相关单元/DOM 测试、lint、构建及系统设计 HTML 同步检查通过。

## Definition of Done

- 更新入口分类函数与回归测试。
- 更新前端质量规范中的视口契约。
- 更新 `docs/system-design.md` 并运行 `npm run docs:system-design`。
- 保留工作区中现有铭牌素材与样式改动，不纳入本任务提交。

## Technical Approach

`isCompactViewport({ width, height })` 只合并两套纯几何契约：可旋转紧凑范围与纵向窄窗范围。入口只消费 `window.innerWidth/innerHeight`，在 resize/orientationchange 后重新计算；所有设备识别正则、触控/媒体查询和物理屏幕兜底全部移除。

## Decision (ADR-lite)

**Context**: 先前尝试用设备身份区分桌面模拟、真实手机和平板，导致同一视口尺寸因 UA 或触控信息不同而产生不同结果。

**Decision**: 完全取消设备分类，只保留当前视口的两套紧凑几何范围与完整桌面最低范围。

**Consequences**: 手机、平板和桌面浏览器在相同尺寸下行为一致；普通 `768 x 1024` 等中间尺寸仍因不落入任何可用范围而显示提示。

## Out of Scope

- 不调整现有紧凑页面布局、断点、字号或触控交互。
- 不改变 `1440 x 768` 桌面完整布局门槛。
- 不改动铭牌资产、铭牌 CSS 或其他并行工作。

## Technical Notes

- 用户截图文件实测为 `496 x 1047`。
- 主要实现：`src/app/DesktopViewportGate.jsx`。
- 回归测试：`src/app/DesktopViewportGate.dom.test.jsx`。
- 提示样式：`src/styles/base/foundation.css`。
- 现有契约：`.trellis/spec/frontend/quality-guidelines.md` 的 Desktop Minimum Viewport Gate Contract。

## Verification

- Focused viewport/app tests: 2 files, 25 tests passed.
- Full suite with `--maxWorkers=2`: 349 files, 2481 tests passed. Two earlier default-worker runs were interrupted by Vitest `ERR_IPC_CHANNEL_CLOSED` without assertion failures; bounded reruns completed cleanly before and after the final device-agnostic requirement change.
- `npm run lint`, `npm run build`, `npm run check:built-css`, `npm run docs:system-design`, and `git diff --check` passed.
- Direct Chrome automation was unavailable because the local Chrome browser extension was not connected. The exact screenshot viewport is covered by DOM/unit regression tests; no claim of live Chrome QA is made.
