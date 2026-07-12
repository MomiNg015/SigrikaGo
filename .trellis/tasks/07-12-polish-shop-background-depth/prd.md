# 加强扎希拉商铺背景层次

## Goal

改善扎希拉商铺背景过浅、过空的问题，让商品区、接待区和扎希拉形成清晰的空间层次，同时保持 Bright School 校园手账风格与商品可读性。

## What I already know

- 用户认为当前商店背景过空、过浅，不够好看。
- 桌面与移动端 `.shop-window` 当前主要使用半透明白色覆盖、32px 横向纸张线和 `#fffaf0` 底色。
- `.shop-window-body` 与 `.shop-product-stage` 均完全透明；商品卡和扎希拉直接漂浮在同一张浅纸上，缺少中层承托。
- 桌面端左侧商品区与右下扎希拉之间存在大片同亮度空白；移动端上下两区之间也只有纸张线，没有明确空间转换。
- 现有品牌颜色为深棕墨色、粉色、浅蓝、薄荷绿和暖黄；背景应克制使用这些既有颜色，不新增无语义的高饱和色。

## Confirmed Decisions

- 采用“校园商店柜台”方向：商品区是低饱和浅蓝展示墙，接待区使用薄荷色墙面与暖棕柜台压边，建立背景、陈列区和前景三层。
- 使用 restrained 配色策略；粉色继续服务购买按钮与台词气泡，背景不新增高饱和主色。
- 优先通过 CSS 层次、色块和阴影完成，不立刻新增背景位图资源。
- 背景增强不改变商品布局、卡片尺寸、立绘、钱包、气泡、刷新或购买行为。
- 桌面和移动端使用同一视觉语言，但按各自横向/纵向构图调整分区比例。

## Open Questions

- None.

## Requirements (evolving)

- 为商品区和接待区建立可感知的前后层次，而不是只把整张背景统一加深。
- 商品区使用低饱和浅蓝展示墙；接待区使用更沉一点的薄荷色墙面，并通过暖棕柜台顶边形成明确前景。
- 分区边界按桌面横向构图和移动端纵向构图分别定位，不能机械共用一个百分比。
- 只做空间分层，不加入价签、票据、夹子、贴纸或其他固定小道具。
- 背景不得降低商品卡、角标、按钮、金币和台词的对比度。
- 不加入持续装饰动效，不与商品卡浮动竞争注意力。
- 桌面端与移动端都要保持无内部滚动、无裁切和安全区合同。

## Acceptance Criteria (evolving)

- [x] 1440×900 下商品区、接待区和窗口边界能一眼分层，不再像大片空白纸。
- [x] 375×812 与矮屏手机下背景分区不切断卡片、气泡、钱包或立绘。
- [x] 商品卡与扎希拉仍是视觉主角，背景装饰不穿过其主要内容。
- [x] 文字与控件对比度不低于当前版本。
- [x] reduced-motion、布局、购买和刷新逻辑完全不受影响。
- [x] 商店聚焦测试、CSS 契约、系统设计文档生成和 `npm run check` 通过。

## Definition of Done

- Focused desktop/mobile browser screenshots reviewed.
- CSS contracts cover the background owner and responsive split.
- `docs/system-design.md` and relevant UI/theme documentation are synchronized.
- Unrelated dirty worktree changes remain untouched.

## Out of Scope

- 商品接口、批次刷新、预加载、库存、购买或钱包逻辑。
- 商品卡内部布局、数量拓扑和浮动参数。
- 扎希拉立绘、钱包图片或商品图片替换。
- 全局 Bright School 背景系统重做。
- 任何新增背景道具、装饰性动效或可替换背景图接口。

## Technical Notes

- Current computed desktop background: translucent white overlay + 32px blue notebook lines + `#fffaf0`.
- Main owner: `src/styles/themes/bright-school/commerce/shop/window-redesign.css` and inherited modal surface contracts.
- Responsive owner: `src/styles/mobile-adaptive/shop-window-redesign.css` and `shop-window-compact.css`.
- Existing CSS contract tests: `src/modals/ShopModal.test.js`.
- Relevant specs: `.trellis/spec/frontend/css-architecture.md`, `.trellis/spec/frontend/quality-guidelines.md`.

## Decision (ADR-lite)

**Context**: 单纯加深整张纸会继续维持单平面，也容易降低卡片和角色对比度。

**Decision**: 使用“浅蓝陈列墙 + 薄荷接待墙 + 暖棕柜台压边”的三层构图，让颜色承担空间分区，而不是装饰性铺满。

**Consequences**: 背景更有店铺空间感，且继续沿用 Bright School 既有配色；需要为桌面和移动端分别校准分区位置，避免边界穿过卡片、气泡或钱包。
