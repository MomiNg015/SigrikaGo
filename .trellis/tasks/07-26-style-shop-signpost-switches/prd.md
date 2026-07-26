# Style Shop Signpost Switches

## Goal

把扎希拉商店与残星会 cosplay 商店之间的两个切换按钮，从普通黄色胶囊改成与蜡笔手绘商店一致的木制路标，让切换方向更直观，同时保持按钮清晰、可靠且不遮挡商品或看板娘。

## What I Already Know

- 两个按钮共用 `.shop-switch-button`，分别由 `.zahira-to-costume` 与 `.costume-to-zahira` 决定左右锚点。
- 当前按钮是圆角胶囊、浅黄底、3px 深色边框和硬阴影；桌面最小高度 44px，移动端压缩到 40px。
- 扎希拉页按钮位于左下方并指向残星会，残星会页按钮位于右下方并指向扎希拉。
- 两家商店主体都是粗蜡笔手绘风，因此路标应使用简化木板、粗轮廓和少量不规则感，不能做成精致写实木纹。

## Requirements

- 两个切换按钮使用同一套木制路标组件语言，但箭头尖端方向与页面切换方向一致。
- 将按钮文案统一为“残星会”和“扎希拉商店”，不再依赖“前往”或文本箭头表达方向。
- 使用 CSS 形状、渐变与伪元素完成木牌效果，不新增图片或 SVG 资产。
- 木牌使用暖棕色板面、深褐粗边、可辨识的内侧亮边和两枚简化钉点；避免精致木纹与持续动画。
- hover/focus 仅做快速抬起和亮度变化，active 做轻微下压；保留清晰键盘焦点，reduced-motion 下取消位移。
- 桌面端保持至少 48px 高；移动端保持至少 44px 触控高度，并缩短文案/内边距以避免横向溢出。
- 保持现有左右锚点与切换逻辑，不改变商品、钱包、气泡、立绘和背景构图。

## Acceptance Criteria

- [x] 扎希拉页显示向左指的“残星会”木制路标。
- [x] 残星会页显示向右指的“扎希拉商店”木制路标。
- [x] 默认、hover、focus-visible、active 和 reduced-motion 状态均有明确合同。
- [x] 桌面 1440x900 下两个路标不遮挡商品、钱包、看板娘或窗口边框。
- [x] 375x812 与 375x600 下两个路标保持至少 44px 高、文案可读且无横向溢出；短屏路标不遮挡商品、钱包或看板娘面部。
- [x] `ShopModal.test.js` 锁定新文案、方向 owner、路标造型和移动端尺寸。
- [x] `docs/system-design.md`、相关 UI/theme 分篇与生成 HTML 同步。

## Definition of Done

- 聚焦测试与完整 `npm run check` 通过。
- 桌面与两档竖屏浏览器截图、几何和交互状态验证通过。
- 仅提交本任务文件，排除现有服装/立绘并行工作。

## Technical Approach

保留现有按钮 DOM 与语义，只更新文案。共享基础 CSS 继续负责定位、镜像 polygon 和触控尺寸；Bright School `signpost-switch.css` 让按钮本体承担带方向尖端的深色外轮廓，`::before` 形成木牌内层，`::after` 放置两枚简化钉点。移动层只调整尺寸和 padding，不复制视觉规则。

## Decision (ADR-lite)

**Context:** 当前胶囊按钮与蜡笔商店场景缺少视觉关联，但商店切换仍需保持标准按钮语义和清晰点击区域。

**Decision:** 使用原生按钮加 CSS 路标皮肤，不引入图片、额外 DOM 或 JavaScript 动画。

**Consequences:** 两个入口方向更直观，资源与运行成本不增加；未来新增商店时可以复用同一按钮 owner，只需指定方向和文案。

## Out of Scope

- 新增店铺、切换音效或过场动画。
- 重绘商店背景、header、商品卡或角色立绘。
- 改动商店切换状态管理、目录请求或刷新逻辑。

## Technical Notes

- Shared owner: `src/styles/commerce/shop-settings/costume-store/storefront.css`
- Bright School owner: `src/styles/themes/bright-school/commerce/shop/signpost-switch.css`
- Final mobile owner: `src/styles/mobile-adaptive/costume-store.css`
- Markup: `src/modals/ShopModal.jsx`, `src/modals/shop/CostumeStorePanel.jsx`
- Regression hook: `src/modals/ShopModal.test.js`
