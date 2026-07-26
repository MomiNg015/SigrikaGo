# Fill Shop Side Gutters

## Goal

让扎希拉商店与残星会 cosplay 商店的 header、主体背景直接贴合商店边框内缘，消除桌面端和移动端左右两侧的空白槽。

## What I Already Know

- 实际桌面画面中 `.shop-window` 外框宽 1120px、边框各 3px，但内部 `clientWidth` 只有 1094px。
- header、viewport 和当前商店页面都从外框左侧向内缩进 13px，右侧也留下 13px；扣除 3px 边框后，两侧各有约 10px 空槽。
- `.shop-window` 自身已经 `overflow: hidden`，不负责内容滚动。
- 通用 Bright School modal 质量层对 `.shop-modal` 强制设置了 `overflow: hidden auto` 和 `scrollbar-gutter: stable both-edges`，因此无滚动需求的商店也保留了双侧滚动条槽。

## Requirements

- 仅在商店窗口 owner 中取消 `.shop-modal` 继承到的双侧稳定滚动条槽。
- 商店外框继续裁切 header、切换轨道和主体背景，不新增负边距或宽度补偿。
- 扎希拉与残星会共用修复，桌面与竖屏移动端共用同一几何合同。
- 保留现有边框、圆角、阴影、header 配色、背景图比例与商店切换动效。
- 不改变真正需要滚动的商品详情弹窗或其他 modal 的滚动行为。

## Acceptance Criteria

- [x] 桌面 1440x900 下，header、viewport、当前页面和主体背景的左右边界都与 `.shop-window` 的 padding box 对齐。
- [x] 375x812 与 375x600 下不再出现左右空白槽，且页面没有横向溢出。
- [x] 扎希拉与残星会切换前后均保持满宽填充。
- [x] 修复不使用负边距、`calc(100% + ...)` 或绝对宽度补偿。
- [x] CSS contract test 锁定商店窗口的 `overflow: hidden` 与 `scrollbar-gutter: auto` owner。
- [x] `docs/system-design.md`、相关 UI/theme 分篇与生成的 HTML 同步。

## Definition of Done

- 聚焦测试通过。
- 桌面与两档竖屏浏览器几何/截图验证通过。
- 完整 `npm run check` 通过。
- 仅提交本任务文件，排除并行服装/音乐 hover 性能工作。

## Technical Approach

在 Bright School 商店窗口最终 owner `src/styles/themes/bright-school/commerce/shop/window-redesign.css` 中明确恢复 `overflow: hidden !important` 与 `scrollbar-gutter: auto !important`。这会让现有 `width: 100%` 的 header、viewport、track 和页面自然占满边框内侧，无需改 React 结构或背景图。

## Decision (ADR-lite)

**Context:** 通用 modal 防抖动规则适合可滚动列表弹窗，但商店窗口自身是固定裁切容器，滚动发生在内部专用区域；给它保留双侧滚动条槽会制造可见空白。

**Decision:** 由商店窗口语义 owner 覆盖通用 modal 的滚动槽策略。

**Consequences:** 修复只影响商店外壳，其他需要稳定滚动条槽的 modal 不变；商店 header 和主体可直接使用既有百分比布局填满内部区域。

## Out of Scope

- 重绘或重新裁切商店背景。
- 修改商品、立绘、钱包、按钮位置或购买流程。
- 修改其他 modal 的滚动条槽策略。
- 编辑并行中的服装/音乐 hover 性能任务。
