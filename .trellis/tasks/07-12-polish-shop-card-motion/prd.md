# 修正商店卡片购买区对齐与桌面浮动反馈

## Goal

统一移动端商品卡片购买按钮与售价的横向对齐，并增强桌面端商品卡片可感知但不干扰操作的上下浮动。

## Confirmed Decisions

- 移动端所有商品卡片的购买按钮占满卡片内容宽度，不能因文案、商品类型或旧主题规则出现宽度差异。
- 移动端售价元素本身水平居中，不只依赖其父级居中。
- 桌面端仅增大上下浮动位移，保留当前 5–8 秒节奏、批次内固定随机旋转、悬停/聚焦/按下/购买时暂停。
- 移动端维持当前较轻的浮动幅度；`prefers-reduced-motion` 继续关闭持续浮动。
- 动效仅使用 `transform`，不改变卡片槽位、数量拓扑、接口或购买逻辑。

## Requirements

- 最终移动端覆盖层必须压过 Bright School 旧商品分类卡片的价格右对齐规则。
- 购买按钮使用统一的可收缩全宽盒模型，不被旧的 `max-width`、外边距或自对齐规则影响。
- 桌面端浮动总行程提升至约 8–12px，并继续位于既有安全槽位内。
- 同步更新 CSS 契约测试和系统设计文档事实。

## Acceptance Criteria

- [x] 375px 宽移动端中，不同分类、不同价格长度的购买按钮等宽。
- [x] 移动端普通价与折扣价均在卡片内水平居中。
- [x] 1440×900 桌面端可清楚观察到卡片上下浮动，且不碰撞、不裁切。
- [x] 移动端浮动幅度不被桌面增强规则放大。
- [x] reduced-motion、交互暂停和固定旋转契约保持有效。
- [x] 商店聚焦测试、系统设计文档生成和 `npm run check` 通过。

## Definition of Done

- Tests added or updated for touched CSS contracts.
- Relevant browser sizes are visually checked.
- `docs/system-design.md` and the affected UI/theme section are synchronized, then `npm run docs:system-design` regenerates HTML.
- Unrelated dirty worktree changes remain untouched.

## Out of Scope

- 商品接口、刷新批次、预加载、库存、购买或钱包逻辑。
- 商品卡片尺寸、数量拓扑、角色/气泡/钱包构图。
- 动效节奏或旋转随机算法重做。

## Technical Notes

- Desktop motion: `src/styles/commerce/shop-settings/shop-window-redesign.css`
- Final mobile isolation: `src/styles/mobile-adaptive/shop-window-card-layout.css`
- Legacy conflicting rules: `src/styles/mobile-adaptive/bright-school-overrides/shop-cards.css`
- Contract tests: `src/modals/ShopModal.test.js`
- Relevant spec: `.trellis/spec/frontend/quality-guidelines.md`
