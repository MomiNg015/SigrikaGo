# Boost Shop Card Motion and Costume Scale

## Goal

增强扎希拉商店与残星会商店商品卡片的持续浮动表现，尤其让竖屏移动端能明显感知卡片在舞台中悬浮；同时放大残星会商品的可见服装立绘与随附价格牌，使其在沿用同一 1–5 件布局拓扑时不再显得偏小。

## What I Already Know

- 两家商店都通过 `buildShopCardPresentation()` 生成固定批次内的旋转、浮动距离、周期与延迟。
- 当前基础浮动距离只有 4–6px，周期为 5–8 秒。
- 桌面 `.shop-card-float` 把基础距离乘以 2，呈现 8–12px 总行程；最终移动层把它重置为 4–6px，因此竖屏感知最弱。
- 两家商店共用 `layoutShopCards()`、`SHOP_CARD_BASE_SIZE` 和 `.shop-card-position > scale > rotation > float` 变换分层，数量拓扑为 5 件 2+3、4 件 2+2、3 件 2+1。
- 残星会服装商品使用透明裁边人物图，虽占用与扎希拉纸卡相同的布局盒，但实际可见像素面积更小；价格牌锚在 `.costume-shop-art` 内，应随人物一起放大。
- reduced-motion 已关闭持续浮动；悬停、聚焦、按下和购买状态会暂停浮动。

## Requirements

- 两家商店的基础浮动距离提高到 6–9px，周期缩短到约 4.2–6 秒。
- 桌面总行程为 12–18px；移动端使用 1.5 倍倍率，总行程为 9–13.5px，不能继续退回 4–6px。
- 保留 transform-only 动画、批次随机延迟、交互时暂停与 reduced-motion 关闭合同。
- 残星会桌面商品可见人物与价格牌整体放大约 14%，移动端放大约 18%，保持同一商品锚点。
- 增强的是现有纵向浮动节奏，不新增横向漂移、弹跳或复杂 JavaScript 动画。
- 残星会只放大可见人物与价格牌，不改变共享卡片碰撞算法、命中区或商品舞台区域。
- 不改变商店切换、刷新、购买、详情或卡片数量拓扑。

## Acceptance Criteria (Evolving)

- [x] 桌面两家商店卡片持续浮动肉眼可辨，但不越过商品舞台或互相碰撞。
- [x] 375x812 与 375x600 下两家商店卡片浮动明显强于当前 4–6px。
- [x] 残星会商品人物与价格牌在桌面、移动端均明显放大，五件商品仍无重叠和裁切。
- [x] hover/focus/active/purchasing 暂停浮动，reduced-motion 不运行持续动画。
- [x] `ShopModal.test.js` 锁定新的距离、周期、移动倍率和残星会视觉缩放 owner。
- [x] 系统设计与前端质量规范同步。

## Definition of Done

- 桌面 1440x900、移动 375x812 与 375x600 浏览器画面验证通过。
- 聚焦测试、CSS 合同、ESLint 与 `npm run check` 通过。
- 只提交本任务文件，不吸收换行符状态噪声或其他并行工作。

## Considered Approaches

### A. Balanced Boost (Selected)

- 基础浮动改为 6–9px，周期缩短到约 4.2–6 秒。
- 桌面总行程 12–18px，移动端总行程 9–13.5px。
- 残星会可见商品桌面约放大 14%，移动端约放大 18%。
- 优点：明显但仍像陈列悬浮，不会抢过背景和角色。

### B. Strong Stage Motion

- 桌面总行程约 16–24px，移动端约 12–18px。
- 残星会商品放大约 20–22%。
- 优点：非常醒目；缺点：五件商品时更容易碰撞或贴近舞台边缘。

### C. Conservative Polish

- 桌面总行程约 10–14px，移动端约 7–10px。
- 残星会商品放大约 10–12%。
- 优点：风险最低；缺点：移动端可能仍达不到用户期待的明显程度。

## Technical Approach

继续使用现有 `scale → rotation → float` 分层：在 `buildShopCardPresentation()` 中提高基础距离并缩短周期，通过最终移动 owner 设置明确倍率；残星会在 `.costume-shop-art` 上增加独立视觉缩放变量，使透明裁边人物和价格牌一起放大，而不改变布局盒、命中区或共享碰撞算法。

## Decision (ADR-lite)

**Context:** 当前 4–6px、5–8 秒的基础浮动在移动端缺乏可感知性，而残星会透明裁边服装图即使占用同一布局盒，可见像素仍明显小于扎希拉纸卡。

**Decision:** 采用 Balanced Boost：基础浮动 6–9px、周期 4.2–6 秒，桌面保持 2 倍行程、移动端使用 1.5 倍行程；残星会可见商品桌面放大约 14%、移动端约 18%。

**Consequences:** 两家商店的陈列会更有生命力，移动端能清楚感知浮动；残星会商品更接近扎希拉纸卡的视觉重量。由于布局盒和拓扑不变，需要通过三个目标视口确认五件商品没有视觉碰撞或裁切。

## Out of Scope

- 新增横向漂移、弹跳、弹性缓动、粒子或 JavaScript 动画库。
- 改变商品数量、刷新机制、背景、角色立绘、价格内容或购买流程。
- 重做扎希拉纸卡尺寸。

## Technical Notes

- Presentation values: `src/modals/shopModalHelpers.js`
- Shared motion owner: `src/styles/commerce/shop-settings/shop-window-redesign.css`
- Mobile multiplier: `src/styles/mobile-adaptive/shop-window-card-layout.css`
- Costume card/art owner: `src/styles/commerce/shop-settings/costume-store/cards.css`
- Costume mobile owner: `src/styles/mobile-adaptive/costume-store.css`
- Regression suite: `src/modals/ShopModal.test.js`
