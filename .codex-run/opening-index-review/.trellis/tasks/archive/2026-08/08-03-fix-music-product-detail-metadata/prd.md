# 修复音乐商品详情标签与持有状态

## Goal

修复扎希拉商店音乐类商品详情弹窗的类别与所有权文案，使详情展示与现有音乐商品及用户所有权数据契约一致。

## Requirements

* 音乐类商品详情的类别标签显示“音乐”，不再回退为“商品”。
* 音乐类商品通过用户的 `ownedMusicIds` 与商品 `targetId` 判断持有状态。
* 已拥有的音乐显示“已持有”；未拥有的音乐显示“尚未拥有该音乐”。
* 用户没有 `ownedMusicIds` 数据时按未拥有处理，不再显示“状态未知”。
* 后台商品列表与编辑下拉把持久化值 `music` 显示为“音乐”，不再显示乱码或 `???`。
* 后台编辑音乐商品并保存时继续提交 `category: "music"`，与服务端白名单、数据库和默认快照一致。
* 后台列表和下拉复用同一类别标签映射，避免显示文案再次漂移。
* 保持现有弹窗视觉、购买流程、其他商品类别文案与状态行为不变。
* 为音乐类别的详情标签及已拥有/未拥有状态补充回归测试。
* 按项目要求同步更新 `docs/system-design.md`，并重新生成 `docs/system-design.html`。

## Acceptance Criteria

* [x] `category: "music"` 的详情弹窗包含类别标签“音乐”。
* [x] 当 `ownedMusicIds` 包含音乐商品的 `targetId` 时，详情显示“已持有”。
* [x] 当 `ownedMusicIds` 不包含 `targetId` 或字段缺失时，详情显示“尚未拥有该音乐”。
* [x] 音乐详情不再出现“商品”类别标签或“状态未知”。
* [x] 后台商品列表显示“音乐”，编辑下拉存在并选中值为 `music` 的“音乐”选项。
* [x] 后台保存音乐商品时请求体保持 `category: "music"`。
* [x] 本地数据库与提交的后台默认快照均确认该商品类别为 `music`，无需改写数据。
* [x] 现有商品详情测试、lint、完整测试集、构建及产物检查通过；完整 `npm run check` 仅被与本任务无关的后台默认快照漂移拦截。
* [x] 系统设计文档入口与生成后的 HTML 保持同步。

## Definition of Done

* 代码修复保持在现有详情数据映射层内。
* 自动化回归测试覆盖音乐类别标签和两种持有状态。
* 相关测试、lint、类型检查及文档生成门禁通过。
* 不吸收工作区内与本任务无关的已有改动。

## Technical Approach

扩展 `src/modals/shop/shopItemDetail.js` 中详情专用的类别、持有布尔值和持有文案映射：复用现有 `isShopItemOwned()`，由其读取 `user.ownedMusicIds`。后台使用 `ADMIN_SHOP_CATEGORY_LABELS` 作为列表和编辑下拉的共同中文映射，`music` 固定显示为“音乐”并原值提交。在玩家详情测试之外，增加后台真实表单交互测试，验证列表、选项和保存请求体。

## Decision (ADR-lite)

**Context**: 通用商店帮助函数已经支持音乐类别与 `ownedMusicIds`，缺陷仅发生在详情专用映射遗漏 `music` 分支。

**Decision**: 在详情映射层补齐 `music`，不引入新数据结构，也不重构其他类别的既有展示命名。

**Consequences**: 修复范围小且与服务器现有用户数据兼容；未来新增商品类别时仍需显式补齐详情映射与测试。

## Out of Scope

* 商店详情弹窗视觉重设计或移动端布局调整。
* 音乐购买、解锁、播放或后台管理逻辑变更。
* 统一重命名角色、装饰等其他商品类别标签。
* 对全部商品类别映射进行架构级重构。

## Technical Notes

* 缺陷位置：`src/modals/shop/shopItemDetail.js` 的详情映射只处理 `item`、`character` 与 `decoration`。
* 现有契约：`src/modals/shopModalHelpers.js` 已将 `music` 映射为“音乐”，并通过 `ownedMusicIds.includes(targetId)` 判断所有权。
* 数据核验：本地 `prisma/dev.db` 中“肘我”的 `ShopItem.category` 为 `music`；`server/adminDefaultSnapshot.js` 对应记录同样为 `music`。
* 后台缺陷位置：`src/shared/adminDrafts.js` 的音乐标签是损坏的中文文本，`src/admin/AdminShopItems.jsx` 的音乐选项显示文本为 `???`；服务端 `validateShopItemInput()` 已允许 `music`。
* 详情渲染入口：`src/modals/shop/ShopItemDetailDialog.jsx`。
* 现有回归测试入口：`src/modals/ShopModal.test.js`。
* 用户截图显示音乐商品“肘我”被渲染为“商品 / 状态未知”。
