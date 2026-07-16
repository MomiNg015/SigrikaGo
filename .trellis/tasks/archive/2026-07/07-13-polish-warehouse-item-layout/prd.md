# 美化双端仓库窗口与放大物品卡片

## Goal

在不改变仓库业务流程的前提下，重做 Bright School 桌面端与移动端仓库窗口、物品卡片的视觉层级，让物品插画成为卡片主视觉，并保持现有手帐/贴纸风格与合理的信息密度。

## What I already know

- 当前 Bright School 桌面物品图框为 72px，受 8px 内边距和边框影响，有效画面约 52px；移动端图框为 32px，有效画面约 25px。
- 当前桌面仓库为 760px 宽的单列横向条目；移动端为 88px 高的紧凑单列条目。
- 物品源图包含竖版海报、方形物品和带透明画布的票券，必须保留 `object-fit: contain`，不可统一裁切为 `cover`。
- 用户已认可上一轮美化建议，并明确手机端无需遵守 44px 触控尺寸，以布局美观优先。
- 现有仓库卡片业务 DOM 已包含图片、名称、描述、数量与使用按钮，业务接口和使用流程无需变化。

## Requirements

- 桌面端扩大仓库窗口内容宽度，在宽屏下使用双列收藏卡布局；中窄桌面回落为单列。
- 桌面物品图框目标约 104px，卡片目标高度约 176–184px，图片成为第一视觉层级。
- 移动端保持单列，但物品图框提升到约 72px；极窄屏可回落到 64px。
- 移动卡片同步提升名称、描述字号，避免图片放大后文字仍显得过小。
- 数量统一为 `×N` 贴纸式角标，并与物品图形成稳定关联。
- 保留 Bright School 奶油纸张、棕色描边、粉色操作按钮语言；不引入玻璃拟态、霓虹或新设计系统。
- 交互反馈仅服务于可操作元素；非点击卡片不应在移动端产生误导性的整体按压缩放。
- 手机按钮可以小于 44px，但必须视觉清楚、文字不裁切、与数量角标不重叠。
- 空状态、加载、物品使用和角色目标选择业务保持不变。

## Acceptance Criteria

- [x] 宽屏桌面仓库呈现双列物品卡，窗口与卡片比例协调，无横向溢出。
- [x] 中窄桌面和移动端稳定回落为单列布局。
- [x] Bright School 桌面物品图框约 104px，移动端约 72px，极窄屏约 64px。
- [x] 竖版与方形物品源图均完整显示，不被裁切或拉伸。
- [x] 数量角标在双端统一显示为 `×N`，位置不与名称、描述或按钮冲突。
- [x] 移动端名称与描述具有更清晰的字号层级，长文本可以自然换行。
- [x] 非交互卡片不再使用误导性的移动端 active 缩放；按钮仍有明确 hover/focus/press 反馈。
- [x] 现有仓库组件测试及 CSS 契约测试更新并通过。
- [x] `docs/system-design.md` 与对应系统设计分篇同步更新，`npm run docs:system-design` 成功生成 HTML。

## Definition of Done

- 相关 JSX、CSS、测试和系统设计文档同步完成。
- 定向测试、CSS 契约测试及仓库质量门禁按风险执行并通过。
- 不覆盖当前工作区中与本任务无关的未提交改动。

## Technical Approach

- 保持 `WarehouseItemGrid` 的业务结构，只为数量文本和可访问名称做必要的小幅 JSX 调整。
- Bright School 桌面布局由 `commerce/warehouse-profile/warehouse-item-card.css` 负责；移动布局由既有 Bright School mobile 文件负责，并同步最终 mobile-adaptive guard，避免级联回退到旧尺寸。
- 桌面仓库网格在足够宽的视口使用两列，卡片改为媒体区、信息区、操作区的稳定网格；移动端保持单列横卡。
- 使用固定媒体框尺寸、较小内边距和 `object-fit: contain` 提高有效物品画面占比。
- 继续复用现有 reduced-motion 机制，不新增装饰性入场动画。

## Decision (ADR-lite)

**Context**: 直接放大 `img` 会挤压现有文本和操作列，且手机端现有 32px 媒体列过窄。

**Decision**: 桌面端采用双列收藏卡、移动端采用大图单列横卡，同时统一数量角标位置；手机端以视觉比例优先，不强制 44px 按钮高度。

**Consequences**: 仓库窗口与卡片占用空间会增加，但桌面双列可抵消纵向增长；移动端单卡高度增加，需要继续使用内部滚动区域。

## Out of Scope

- 不改动物品购买、库存、使用或角色选择业务逻辑。
- 不增加分类筛选、排序或搜索。
- 不修改物品源图文件。
- 不重做仓库空状态或目标角色弹窗。
- 不调整商店卡片布局。

## Technical Notes

- `src/modals/WarehouseModal.jsx`
- `src/modals/warehouse/WarehouseItemGrid.jsx`
- `src/styles/commerce/warehouse-toast/modal-list.css`
- `src/styles/themes/bright-school/commerce/warehouse-profile/warehouse-item-card.css`
- `src/styles/themes/bright-school/commerce/warehouse-profile/warehouse-item-mobile.css`
- `src/styles/themes/bright-school/mobile/commerce-warehouse/warehouse-items.css`
- `src/styles/mobile-adaptive/phone-social-warehouse.css`
- `src/modals/WarehouseModal.test.js`
- `docs/system-design.md`
- `docs/system-design/05-assets-audio-preload.md`
