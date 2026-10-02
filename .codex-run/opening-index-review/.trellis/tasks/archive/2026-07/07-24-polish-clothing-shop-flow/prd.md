# 统一残星会服装商店布局与购买交互

## Goal

让残星会服装详情与扎希拉商品详情使用一致的信息结构和操作节奏，同时保留残星会自己的深红金色主题；修正服装购买后的窗口流转，并移除扎希拉与娜波摩看板娘反馈状态的自动计时回切。

## What I already know

- 当前工作分支为 `codex/frontend-chores`，开始任务时工作区干净。
- 扎希拉详情由 `ShopItemDetailDialog.jsx` 和 Bright School 的 `detail-dialog.css` 维护，结构为左侧商品图、右侧分类/标题/画师/说明/底部状态。
- 服装详情由 `CostumeDetailDialog.jsx` 和 `costume-store/detail.css` 维护，当前使用另一套内部结构，并在详情窗口内部显示“购买成功，是否立即装扮”。
- 服装购买接口 `POST /api/costumes/:id/purchase` 已返回成功服装和最新用户；失败由 `useCostumeCatalog.purchaseCostume()` 返回 `null` 并显示错误 toast。
- 扎希拉购买成功后由 `scheduleShopMascotThanks()` 设置感谢立绘与台词，并在 `SHOP_MASCOT_THANKS_DURATION_MS = 5000` 后恢复默认状态。
- 项目规则要求本次运行行为更新同步到系统设计文档，并生成 `docs/system-design.html`。

## Confirmed Decisions

- 扎希拉购买成功仍切换为感谢台词和感谢立绘，但不再自动恢复；保持到商店关闭或刷新商品等明确操作改变状态。
- 娜波摩的购买成功或失败反馈同样不再自动恢复；保持到商店关闭或刷新商品等明确操作改变状态。
- 服装成功后的装扮询问由独立居中确认弹窗承担。
- “持有状态改为购买按钮”是指服装详情复用扎希拉详情的底部信息槽，但在该位置放购买按钮；已拥有或不可购买时保留原生 disabled 状态，不恢复“持有状态”文字块。

## Open Questions

- 无。

## Requirements

- 残星会服装详情复用扎希拉商品详情的内部布局骨架、间距、信息层级和移动端折叠方式。
- 服装详情保留残星会自己的深红、金色等主题配色，不强制复制扎希拉的浅色纸张配色。
- 服装详情底部用“购买服装”按钮替代扎希拉详情的“持有状态”区域；按钮覆盖购买中、未拥有对应角色、不可购买、已拥有等语义状态。
- 残星会商品售价牌背景调整为比当前 `#e5b7aa` 更明亮、仍符合深红主题且保证文字对比度的颜色。
- 点击服装详情中的购买按钮后，无论请求成功或失败，都关闭服装详情窗口。
- 购买成功时，在商店中央打开独立确认弹窗，询问是否立即装扮；提供“立即装扮”和“暂不装扮”操作。
- 购买失败时只保留现有错误反馈，不打开装扮确认弹窗。
- 扎希拉与娜波摩的购买反馈台词、立绘不再经过计时器自动恢复，只由商店关闭、刷新商品等显式操作改变。

## Acceptance Criteria

- [x] 服装详情在桌面和竖屏移动端与扎希拉详情保持同一左右/上下结构和信息顺序。
- [x] 服装详情仍明显属于残星会配色，而不是复制扎希拉浅色主题。
- [x] 服装详情不显示“持有状态”信息块，底部显示语义正确的购买按钮。
- [x] 残星会售价牌背景肉眼可见地更亮，深色价格文字仍满足可读性。
- [x] 购买成功和购买失败都会关闭服装详情。
- [x] 仅购买成功会出现居中的立即装扮确认弹窗。
- [x] 确认“立即装扮”调用现有装扮接口，“暂不装扮”只关闭确认弹窗。
- [x] 扎希拉和娜波摩的购买反馈状态均不注册自动恢复定时器。
- [x] 更新相关组件/DOM/样式合同测试。
- [x] `npm run docs:system-design` 成功，相关定向测试与项目检查通过。

## Definition of Done

- 实现、测试、系统设计文档和生成的 HTML 同步完成。
- 购买成功、购买失败、立即装扮和暂不装扮路径均有回归覆盖。
- 桌面与竖屏移动端完成视觉核验，无横向溢出或弹窗层级错误。

## Technical Approach

- 让 `CostumeDetailDialog` 采用扎希拉详情的共享语义类和 DOM 骨架，再加服装专属修饰类覆盖主题颜色，避免复制两套尺寸与响应式布局。
- 将购买后的装扮确认状态提升到 `ShopModal`：详情组件只负责发起购买，并在结果返回后立即关闭；成功时由父层打开独立居中确认覆盖层。
- 保留 `useCostumeCatalog` 作为购买/装扮数据与错误反馈边界，不修改服务端接口。
- 移除扎希拉五秒恢复调度和娜波摩反馈恢复调度及其已无必要的常量/测试合同，让反馈状态保持到商店生命周期结束或显式状态变化。

## Decision (ADR-lite)

**Context**: 两套商品详情结构已产生视觉和交互漂移，且购买成功确认嵌在详情内部，无法满足先关闭详情再居中确认的流程。

**Decision**: 共享扎希拉详情的结构合同，在父级商店窗口管理购买后确认弹窗；主题差异仅由服装修饰类表达。

**Consequences**: 详情布局以后可以同步演进，购买确认层级更清晰；服装主题 CSS 需要从独立几何规则收敛为共享结构上的颜色覆盖。

## Out of Scope

- 不修改服装购买、金币扣除或装扮 API。
- 不重做两家商店的商品陈列舞台、刷新批次或钱包布局。
- 不改变看板娘资源文件。
- 不扩展到部员手册衣柜详情。

## Technical Notes

- 主要文件：`src/modals/ShopModal.jsx`、`src/modals/shop/CostumeDetailDialog.jsx`、`src/modals/shop/useShopCatalog.js`、`src/shared/shopMascotAssets.js`。
- 样式入口：`src/styles/themes/bright-school/commerce/shop/detail-dialog.css`、`src/styles/themes/bright-school/commerce/shop/costume-store.css`、`src/styles/commerce/shop-settings/costume-store/detail.css`、`src/styles/mobile-adaptive/costume-store.css`。
- 测试入口：`src/modals/shop/CostumeDetailDialog.dom.test.jsx`、`src/modals/ShopModal.test.js`。
- 文档入口：`docs/system-design.md`、`docs/system-design/02-frontend-architecture.md`、必要时 `docs/system-design/05-assets-audio-preload.md`。
