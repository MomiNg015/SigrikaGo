# 商店看板娘立绘与购买反馈改造

## Goal

只改商店信息区的看板娘展示、金币/问候语位置和购买成功反馈。桌面端覆盖左侧信息区，移动端覆盖上侧信息区；保持现有 Bright School 视觉风格，不改后端 API、数据模型或购买结算逻辑。

## Requirements

- 将用户提供的 `C:/codex/image/zahila/zahira_default.png` 和 `C:/codex/image/zahila/zahira_laugh.png` 转为保留透明通道的 WebP，加入 `public/assets/`，文件名分别为 `zahira_shop_default.webp` 和 `zahira_shop_laugh.webp`；同目录保留 PNG 源图。旧 `zahiya_shop.*` 不删除，但商店不再引用。
- 更新 `RUNTIME_IMAGE_ASSETS.shop`，用两张新立绘替换 `/assets/zahiya_shop.webp`，保证启动预加载覆盖商店看板娘资源。
- 在 `useShopCatalog` 中保留初始随机问候语，并新增临时看板娘反馈状态：购买成功后切换笑脸立绘与 `谢谢惠顾！`，5 秒后恢复默认立绘和初始随机问候语。
- 失败购买不触发看板娘切换。连续成功购买刷新 5 秒计时。组件卸载时清理 timer。
- `ShopSidebar` 根据状态选择图片，问候语继续用 `aria-live="polite"`，立绘只允许等比缩放。
- 桌面端金币钱包放在信息区从上到下约 30% 的位置；问候语放在立绘上方并与立绘保留约 5% 信息区高度间距；立绘放在信息区底部，宽度等于信息区宽度，图片下边缘贴合信息区下边缘。
- 移动端金币位置保持当前左下区域；问候语保持当前大致位置但不得和立绘重叠；立绘放在信息区右下，宽度为信息区宽度的 45%，只等比缩放。
- `ShopSidebar` 同时渲染默认与购买成功两张立绘，通过透明度图层切换，避免成功购买反馈时白色闪烁。
- CSS 改动落在现有 owner 层：共享商店 shell/mobile 规则、Bright School commerce shop 规则、Bright School portrait commerce 规则，以及必要的最终 mobile safety 规则。
- 更新 `docs/system-design.md`、`docs/system-design/05-assets-audio-preload.md`、`docs/system-design/06-ui-theme-mobile.md`，并重新生成 `docs/system-design.html`。

## Acceptance Criteria

- [ ] 桌面 1280x720：金币在左侧信息区竖向约 30% 位置，问候语位于立绘上方约 5% 信息区高度处，默认立绘宽度等于信息区宽度，下边缘与信息区下边缘贴合。
- [ ] 移动 375x667：立绘位于信息区右下，宽度约为信息区 45%，不遮挡问候语或金币，无横向滚动。
- [ ] 成功购买后立绘切到笑脸图，问候语变为 `谢谢惠顾！`；5 秒后恢复默认图和原始随机问候语。
- [ ] 立绘切换使用双图层透明度切换，不通过单个 `<img>` 换 `src` 造成白色闪烁。
- [ ] 购买失败不切换立绘或问候语。
- [ ] 连续购买成功会刷新 5 秒恢复计时，卸载清理 timer。
- [ ] `RUNTIME_IMAGE_ASSETS.shop` 包含两张新 WebP 立绘，不再包含旧商店看板娘 WebP。
- [ ] 测试覆盖 ShopSidebar 图片/问候语、预加载资产、桌面/移动 CSS 合同、useShopCatalog 成功/失败/timer 行为。

## Definition of Done

- 更新或新增聚焦测试，覆盖上述验收标准。
- 运行：
  - `npm test -- src/modals/ShopModal.test.js src/shared/preloadAssets.test.js src/styles/themeContract.test.js src/styles/hudComponents.test.js src/styles/styleContract.test.js src/styles/cssLayerInventory.test.js`
  - `npm run build`
  - `npm run docs:system-design`
- 如 CSS 指标合理增长，同步更新 `src/styles/cssLayerInventory.js` 并重跑 CSS 合同测试。

## Technical Approach

- 复用现有 `ShopSidebar`、`useShopCatalog` 和商店 CSS 层，不新增后端接口。
- 将购买成功反馈作为商店 hook 的本地 UI 状态，避免污染账户状态或购买 API 行为。
- WebP 作为运行时引用资源，PNG 作为源图保留在 public assets 中。
- CSS 通过已有 class 和 owner selector 收束到商店信息区，避免广泛主题重置。

## Out of Scope

- 不删除旧 `zahiya_shop.*` 资源。
- 不改变商品列表、分类、购买结算、后端 API 或数据模型。
- 不重设计商店整体风格、颜色体系、商品卡片或其它 modal。
- 不引入新的前端框架、动画库或全局状态层。

## Technical Notes

- 相关组件和 hook：`src/modals/shop/ShopSidebar.jsx`、`src/modals/shop/useShopCatalog.js`、`src/modals/ShopModal.jsx`。
- 相关资源预加载：`src/shared/assetRegistry.js`、`src/shared/preloadAssets.js`、`src/shared/preloadAssets.test.js`。
- 相关 CSS：`src/styles/commerce/shop-settings/shop-shell-tabs.css`、`src/styles/commerce/shop-settings/phone-layouts.css`、`src/styles/mobile-adaptive/phone-shop.css`、`src/styles/themes/bright-school/commerce/shop/sidebar-wallet.css`、`src/styles/themes/bright-school/commerce/shop/responsive.css`、`src/styles/themes/bright-school/mobile/commerce-warehouse/shop-layout.css`、`src/styles/mobile-adaptive/bright-school-portrait/shop-wallet.css`，以及后置 Bright School/quality/final mobile 层的有效覆盖。
- 相关规范：`.trellis/spec/frontend/css-architecture.md`、`.trellis/spec/frontend/quality-guidelines.md`、`.trellis/spec/guides/code-reuse-thinking-guide.md`、`.trellis/spec/guides/cross-layer-thinking-guide.md`。
