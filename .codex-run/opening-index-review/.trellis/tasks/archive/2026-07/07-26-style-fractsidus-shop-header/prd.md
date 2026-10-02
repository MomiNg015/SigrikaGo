# Style Fractsidus Shop Header

## Goal

将残星会 cosplay 商店的 header 从突兀的浅色纯底改成与深红蜡笔舞台主体一致的专属 header，同时保持标题、刷新按钮和关闭按钮清晰可用。

## What I Already Know

- `ShopModal` 已通过 `.shop-header[data-store={activeStore}]` 暴露 `zahira` / `costume` 状态。
- 扎希拉 header 已由 `background-crayon.css` 中的 `[data-store="zahira"]` owner 单独处理。
- 残星会主体已经使用桌面/移动两张深红粗蜡笔舞台背景。
- 当前通用 Bright School header 是浅奶油纯底，切到残星会时与主体断层。

## Requirements

- 只为 `.shop-header[data-store="costume"]` 增加残星会专属视觉，扎希拉 header 不变。
- header 使用深红、黑紫和旧金色，表现粗蜡笔帷幕、纸张颗粒与简化舞台装饰。
- 可复用残星会桌面背景顶部的帷幕区域作为纹理来源，但必须叠加低对比深红遮罩，不能让细节干扰标题。
- 标题改为浅象牙/暖金文字并保留清晰描边或硬阴影。
- 刷新、关闭按钮在残星会状态下使用象牙色按钮面、深红/黑紫边框和旧金硬阴影；disabled、hover、focus 仍可辨识。
- 桌面与移动端使用同一个语义 owner；移动端不得影响 44px 控件和单行标题合同。
- 不增加新的图片资产或持续动画。

## Acceptance Criteria

- [ ] 桌面 1440x900 切到残星会时，header 与深红蜡笔主体连续且标题/按钮清晰。
- [ ] 375x812 与 375x600 下标题保持单行，刷新/关闭按钮保持 44px，无横向溢出。
- [ ] 扎希拉 header 继续使用原有帐篷蜡笔背景与深色文字。
- [ ] CSS contract test 锁定 `[data-store="costume"]` owner、浅色标题与专属按钮状态。
- [ ] `docs/system-design.md` 与相关 UI 设计分篇同步。
- [ ] 聚焦测试和完整 `npm run check` 通过。

## Technical Approach

在 Bright School `background-crayon.css` 中增加 `.shop-header[data-store="costume"]`、其标题与按钮状态的明确 owner。背景复用 `--costume-shop-background-image` 的顶部帷幕裁片，并叠加深红蜡笔遮罩和旧金下沿；不改变 React 结构或商店切换逻辑。

## Decision (ADR-lite)

**Context**: 残星会和扎希拉共用一个 header DOM，但视觉主体完全不同。

**Decision**: 继续使用现有 `data-store` 状态做 CSS 主题分支，不增加组件 prop、额外 DOM 或新资源。

**Consequences**: 改动局部且可回归测试；两个商店的 header 视觉各自独立，后续替换背景资源时只需维护对应 owner。

## Out of Scope

- 不修改残星会主体背景、商品卡、娜波摩立绘、钱包或购买流程。
- 不修改扎希拉 header。
- 不新增 header 专用图片。

## Technical Notes

- Owner: `src/styles/themes/bright-school/commerce/shop/background-crayon.css`
- Shared header contract: `src/styles/themes/bright-school/commerce/shop/window-redesign.css`
- Final mobile sizing: `src/styles/mobile-adaptive/shop-window-redesign.css`
- Tests: `src/modals/ShopModal.test.js`
