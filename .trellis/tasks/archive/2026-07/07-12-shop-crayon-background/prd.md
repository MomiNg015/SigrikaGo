# 商店背景蜡笔手绘风改造

## Goal

把扎希拉商铺当前规整的纯色色带背景改成有纸张纤维、蜡笔叠色和手绘边界感的 Bright School 校园手账背景，同时保持商品卡、扎希拉、钱包与台词的清晰层级。

## What I already know

- 用户认为上一轮“浅蓝陈列墙 + 薄荷接待墙 + 暖棕柜台”的纯色背景仍然难看，希望改成蜡笔手绘风。
- 当前背景 owner 是 `src/styles/themes/bright-school/commerce/shop/window-redesign.css` 的 `.shop-layout.shop-window-body`。
- 当前实现由三组规整的 `linear-gradient` 组成：墙面横线、浅蓝/薄荷分区和暖棕柜台，因此仍呈现数字化平涂感。
- 桌面背景按 68% 横向分区，移动端最终层按 56% 纵向分区；这两个边界与商品区布局合同相连，不能随意移动。
- 商品卡、扎希拉立绘、钱包和台词已有稳定布局，本轮不应改动其尺寸、位置或交互。
- Bright School 已有深棕墨线、浅蓝、薄荷、暖黄、粉色和纸张硬阴影语言，蜡笔化应沿用这套色彩，不引入脱离主题的新主色。

## Confirmed Decisions

- 优先用轻量 CSS 纹理和伪元素完成，不增加大尺寸背景位图或运行时绘图库。
- 蜡笔风主要体现在背景纸纹、低频颗粒叠色和略不规则的分区边缘，不让高频噪点穿过文字与商品内容。
- 保留静态背景，不增加持续动画，避免与商品卡浮动竞争注意力。
- 采用中等强度蜡笔质感：比克制纸笔风更明显，但不使用会和商品卡、立绘争抢注意力的强烈儿童画覆盖。

## Requirements (evolving)

- 保留现有校园商店三层空间语义，但把规整纯色色带改造成蜡笔手绘表达。
- 背景需要同时包含暖白纸底、可感知但不过密的纸纤维、低频蜡笔叠色和手画分区边界。
- 桌面继续保持 68% 商品区边界，移动端继续保持 56% 商品区边界。
- 纹理不能降低商品名、价格、角标、按钮、钱包金额与台词的对比度。
- 不改变商品布局、卡片尺寸、刷新/购买行为、扎希拉立绘、钱包资源或气泡位置。
- 不引入持续装饰动效；现有 reduced-motion 合同不受影响。
- 桌面与移动端使用同一视觉语言，并分别验证边界、裁切和安全区。
- 按项目要求同步 `docs/system-design.md`；如现有主题分篇事实改变，同步 `docs/system-design/06-ui-theme-mobile.md`，并生成 `docs/system-design.html`。

## Acceptance Criteria (evolving)

- [x] 1440×900 下背景第一眼呈现蜡笔/纸张手绘质感，而不是三块规整纯色色带。
- [x] 375×812 和 375×600 下纹理与手绘边界不切断卡片、气泡、钱包或立绘。
- [x] 商品卡和扎希拉仍然是视觉主角，背景纹理不会造成文字发花或对比下降。
- [x] 背景不新增持续动画、布局位移、内部滚动或横向溢出。
- [x] 商店聚焦测试、CSS 合同、系统设计文档生成和项目质量检查通过。

## Definition of Done

- 桌面和移动端真实页面完成视觉检查。
- CSS 合同测试覆盖背景 owner、纹理层和响应式分区变量。
- `docs/system-design.md`、相关主题分篇与生成的 HTML 同步。
- 与本任务无关的工作树改动保持原样。

## Out of Scope

- 商品接口、目录、批次、库存、购买、刷新或钱包逻辑。
- 商品卡内部布局、数量拓扑和浮动参数。
- 扎希拉立绘、钱包图片或商品图片替换。
- 全局 Bright School 主题纹理系统重做。
- 新增商店道具、贴纸、价签或持续装饰动效。

## Technical Notes

- Primary owner: `src/styles/themes/bright-school/commerce/shop/window-redesign.css`.
- Responsive owner: `src/styles/mobile-adaptive/shop-window-redesign.css`.
- Existing contract coverage: `src/modals/ShopModal.test.js`.
- Relevant specs: `.trellis/spec/frontend/css-architecture.md`, `.trellis/spec/frontend/quality-guidelines.md`.
- The `ui-ux-pro-max` skill's local `scripts` pointer resolves to a missing `C:\Users\Moming\src\ui-ux-pro-max\scripts` directory, so its database search helper is unavailable; its accessibility, responsive, contrast and motion guidance still applies.

## Candidate Directions

### A. 中等蜡笔质感（Recommended）

- 纸底保留呼吸感，墙面使用两到三层低透明度蜡笔斜纹/颗粒叠色。
- 分区边缘用略有起伏的手画线与局部色块越界，近看有质感、远看仍清楚。
- 最适合当前商品卡密度，风险最低。
- 用户已确认采用本方向。

### B. 克制纸笔质感

- 只加入纸纤维、少量蜡笔颗粒和手画边界。
- 可读性最稳，但可能仍会让人感觉变化不够大。

### C. 强烈儿童画质感

- 使用更明显的交叉蜡笔笔触、不均匀覆盖和夸张手绘轮廓。
- 个性最强，但容易和商品卡、立绘争抢注意力，小屏也更易显乱。

## Decision (ADR-lite)

**Context**: 当前空间分区已经正确，但规整纯色色带缺少 Bright School 应有的纸张与手作触感；单纯增加高频噪点又会伤害商品可读性。

**Decision**: 保留三层校园商店空间语义和既有分区比例，采用中等强度的静态 CSS 蜡笔纹理、纸纤维与不规则手画边界，不新增位图依赖或持续动效。

**Consequences**: 背景会明显脱离数字化平涂感，同时继续保持商品和扎希拉的视觉优先级；实现需要控制纹理频率、透明度和移动端裁切，并通过真实页面截图验证。
