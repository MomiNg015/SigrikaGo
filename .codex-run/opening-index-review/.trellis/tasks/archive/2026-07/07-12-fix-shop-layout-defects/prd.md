# Fix remaining Zahira shop layout defects

## Goal

修复扎希拉商铺在真实移动端 CSS 级联下仍然存在的重复缩放、卡片碰撞、矮屏裁切和接待区重叠问题，并在不改变商品批次、购买、冷却或数据模型的前提下，扩大商品图片区、压缩卡片内部无效留白，让桌面与移动端卡片更紧凑、稳定且可读。

## Requirements

- 隔离 Bright School 竖屏通用 `max-width: 100%` 和旧商店卡片高度规则对新 `.shop-window` 卡片变换链的污染。
- `.shop-card-position` 继续表示布局算法计算出的真实外框；`.shop-card-scale`、旋转层、浮动层与 `.shop-item` 必须使用未缩放基础尺寸，且只由单一 `scale()` 统一缩放。
- 移动端 1–5 件商品在 375×812 下不得出现真实卡片边界碰撞、商品区裁切或气泡侵入；3/4 件保持接近 158px 的外框宽度，5 件保持 2+3 拓扑和约 4–5px 水平槽位间隔。
- 375×600 矮屏继续禁止商品区内部滚动，底排购买按钮必须完整可见；气泡、钱包和角色各自保持清晰的纵向区域。
- 钱包保持在移动端气泡右侧，但不得压住扎希拉可见头发或脸部；桌面钱包位置不变。
- 桌面 1–5 件数量拓扑、槽位内固定扰动、至少 28px 安全距离和角色构图保持不变；收紧商品区与接待区的显式安全边界，避免依赖不可见留白。
- 商品卡图片区在桌面和移动端都适当增大；同时缩小卡片 padding、内部 gap 和价格区无效高度，使图片、名称、价格、按钮形成更紧凑的纵向节奏。
- 分类与数量角标继续位于左右上角；长商品名在常规手机宽度下不得因重复缩放而异常省略，极端 5 件密度下保留可理解的截断与完整可访问名称。
- 卡片主体仍可点击/键盘打开详情，购买按钮仍直接购买且阻止冒泡；消除外层伪按钮包含内层按钮的嵌套按钮语义。
- 保留固定随机旋转、上下浮动、冷却、预备批次、空状态、reduced-motion 与角标逻辑。

## Acceptance Criteria

- [ ] 375×812 下 1–5 件商品的真实 `.shop-item` 边界均落在对应 `.shop-card-position` 旋转/浮动安全范围内，不发生上下排碰撞。
- [ ] 375×812 下 3/4 件卡片接近 158px 宽，5 件不再被二次缩窄到约 76–79px。
- [ ] 375×600 下 3/4/5 件商品按钮完整可见，商品区无内部滚动，卡片不侵入气泡或钱包。
- [ ] 移动端钱包与扎希拉可见头部不重叠；气泡箭头仍指向角色。
- [ ] 桌面 1440×900 下 3/4/5 件拓扑、间距与接待区构图无回退。
- [ ] 商品图片区相较当前实现明显增大，名称、价格、按钮之间无大片空白且无内容裁切。
- [ ] 卡片详情入口与购买按钮不再形成嵌套按钮语义，键盘焦点与点击行为保持不变。
- [ ] 测试覆盖有效 CSS 级联尺寸合同，而不只检查布局算法返回的槽位盒子。
- [ ] 商店聚焦测试、CSS 契约、`npm run docs:system-design` 和完整 `npm run check` 通过。

## Definition of Done

- Tests added/updated for layout, CSS cascade and interaction semantics.
- Desktop/mobile browser visual QA covers 1440×900, 375×812 and 375×600.
- Relevant system-design summary and frontend quality contract stay synchronized.
- Only shop-related files and Trellis task artifacts are committed; unrelated workspace changes remain untouched.

## Technical Approach

- 在最终移动商店样式层为缩放链显式解除通用 `max-width`，并以足够但局部的选择器重置旧卡片 `height/min-height/display/grid` 规则；不修改全局竖屏安全规则。
- 让基础卡片尺寸、布局槽位和可视卡片共享同一个尺寸合同；新增浏览器/DOM 可计算样式断言或等价 CSS 契约，覆盖最终级联。
- 重新分配卡片的固定高度预算：扩大图片行，压缩 padding、gap、名称/价格行，把购买按钮保留在稳定底行。
- 将卡片详情触发改为语义清晰的独立可聚焦区域或等价结构，购买按钮继续作为独立原生按钮。
- 通过移动端接待区百分比和 compact-height 覆盖调整钱包/角色锚点；桌面只收紧区域边界，不重做构图。

## Decision (ADR-lite)

**Context**: 布局算法与单元测试验证的是外层槽位，但 Bright School 通用移动规则改变了缩放子层和卡片本体的最终尺寸，因此测试通过而浏览器仍发生碰撞。

**Decision**: 新商店窗口拥有局部、最终级联的尺寸隔离合同；布局测试同时验证槽位算法，CSS/浏览器测试验证最终卡片盒子。图片区增长通过卡片内部高度预算重分配完成，不增加卡片总尺寸或内部滚动。

**Consequences**: 修复保持现有全局移动规则不变，降低对其他页面的风险；商店专属最终覆盖会更明确，但需要 CSS 契约防止旧规则再次污染。

## Out of Scope

- 商品接口、商品数据模型、购买事务、刷新批次或预加载策略调整。
- 更换扎希拉、钱包或商品图片资源。
- 重新设计商品详情窗口或后台商品管理界面。
- 改变已确认的数量拓扑与持续动效。

## Technical Notes

- Main component: `src/modals/ShopModal.jsx`, `src/modals/shop/ShopItemCard.jsx`, `src/modals/shop/ShopProductStage.jsx`.
- Layout algorithm: `src/modals/shop/shopLayout.js`.
- New shop CSS: `src/styles/commerce/shop-settings/shop-window-redesign.css`, `src/styles/mobile-adaptive/shop-window-redesign.css`, `src/styles/mobile-adaptive/shop-window-compact.css`.
- Conflicting legacy rules: `src/styles/themes/bright-school/mobile/home-shell/shell-base.css`, `src/styles/mobile-adaptive/bright-school-overrides/shop-cards.css`.
- Browser evidence: 375×812 five-item cards rendered at roughly 76–79px inside 110px slots; three/four-item cards rendered about 220–223px tall inside 188px slots; 375×600 bottom-row cards exceeded the product-stage clip boundary by about 15px.
