# 统一角色与服装立绘裁边和视觉尺寸

## Goal

把当前所有可选角色默认立绘和服装立绘从“各自携带不同透明边距、再靠逐件缩放补偿”的状态，迁移为可重复执行、可验证的统一资源规范，使同一角色的默认服装与各套服装在衣柜、角色详情、主页、对局和回放等共用容器中具有稳定的视觉尺度。

## What I already know

- 当前默认角色目录包含 10 张运行时立绘，服装目录包含 5 张运行时立绘，另有 1 张达妮娅糖果替换立绘。
- 默认角色立绘主要是 640×640 画布，人物可见范围横向占画布约 66.6%–93.8%、纵向占约 76.4%–93.6%，透明边距不统一。
- 五张服装 WebP 已经裁到 alpha 边界，尺寸约为 711–848×900；现有衣柜通过逐服装 `portraitScalePercent`（83、88、94）补偿。
- 默认服装卡跳过逐服装 framing；非默认服装才应用 `portraitScalePercent/offset`，所以“资源留白差异”和“运行时补偿”同时存在。
- 现有 `scripts/pngTrim.mjs` 只支持 8-bit RGBA PNG，不支持仓库当前大量使用的 WebP，也不负责统一最长边、画布或视觉锚点。
- 角色和服装资源也会进入主页、角色详情、对局、结果和回放；不能只修衣柜 CSS。

## Assumptions (temporary)

- “所有角色立绘”指角色目录的默认立绘、服装立绘及以后配置到角色、服装或服装糖果特效字段中的本地静态立绘；商店看板娘、剧情专用构图、技能特效和普通 UI 插图不自动纳入。
- 处理流程为：读取 alpha → 裁掉四边无效透明像素 → 保留极小安全边 → 等比缩放到统一视觉规格 → 输出透明 WebP → 验证引用与尺寸。
- 归一化后现有五件服装的 framing 应回到 `100/0/0`，只保留 framing 作为未来艺术性微调的后备能力，不再用它修资源画布。

## Open Questions

- 无。

## Requirements (evolving)

- 批量处理当前 10 张默认角色立绘、5 张服装立绘和 1 张达妮娅糖果替换立绘。
- 以后配置为本地资源的服装糖果特效替换立绘也进入同一发现、处理与校验流程。
- 处理对象由角色与服装配置目录驱动；本地 `/assets/...` 资源必须归一化并通过自动校验。
- HTTP(S) 远程图片保持可配置，但脚本不下载、不改写，只给出信息性跳过结果。
- 每张图片先按 alpha 裁掉无效透明边，再把完整可见内容等比放入统一方形安全框，并在透明方形画布中底部居中；不按可见面积估算，也不设置角色分类规则。
- 所有输出必须保留透明通道、原始宽高比和完整非透明内容，不拉伸、不裁人物。
- 统一规则必须由仓库脚本表达，并有 dry-run/校验模式与回归测试，不能只提交手工处理后的图片。
- 提供完整的长期维护方案：自动发现配置中的本地目标资源、批量写入归一化结果、只读校验、幂等性测试、目录覆盖测试和系统设计文档。
- 资源引用、预加载、后台默认快照、房间与回放快照路径保持有效。
- 同一规范要覆盖桌面和竖屏共用的角色立绘消费者。

## Acceptance Criteria (evolving)

- [x] 当前目录中的每张目标立绘四边不存在超出统一安全边的任意透明留白。
- [x] 每张目标立绘使用相同方形画布、安全框和底部中心锚点，完整非透明内容均位于安全框内。
- [x] 处理后同一角色默认立绘与服装立绘在衣柜相同图片框中视觉尺度接近，不再依赖 83/88/94 这类补偿值。
- [x] 处理脚本可重复运行且第二次运行不再产生差异。
- [x] 新增的本地角色、服装或服装糖果特效立绘会被目录覆盖测试自动发现；遗漏归一化时仓库校验失败。
- [x] 校验脚本能拒绝缺少 alpha、空图、内容触边、尺寸超限或未归一化的目标资源。
- [x] HTTP(S) 远程图片不会触发网络请求、下载或写入，并被明确报告为跳过。
- [x] 所有资源引用和相关前端、服务端、快照及系统设计测试通过。
- [x] `npm run check` 通过。

## Definition of Done

- [x] Tests added/updated for trimming, normalization, idempotence and catalog coverage.
- [x] Repository commands expose separate write and check modes suitable for local maintenance and CI/release validation.
- [x] Lint, tests, build and admin snapshot check green.
- [x] `docs/system-design.md` and relevant system-design/spec sections updated.
- [x] Current assets migrated with a documented rollback path.

## Technical Approach

- 使用 `sharp` 对目标资源读取 alpha 边界，保持原始宽高比缩放到 `792×792` 安全框，再以底部居中方式放入 `900×900` 透明画布；底部安全边固定为 54 像素。
- 由 `src/shared/characterPortraitAssetCatalog.js` 维护内置规范路径和旧路径映射；`scripts/normalize-character-portraits.mjs` 从后台默认快照、角色回退数据、服装立绘与糖果替换字段发现处理对象。
- `npm run portraits:normalize` 写入资源，`npm run check:portraits` 只读校验；已符合规范的文件保持字节级不变。
- 新资源使用无损 WebP。旧资源继续保留，保证历史对局和回放快照仍可解析。
- 服务启动时只对仍精确匹配内置旧 URL、旧 framing 和旧默认值的角色与服装执行 compare-and-swap 迁移，不覆盖后台自定义记录，也不改动用户拥有关系、当前装扮或历史数据。
- 当前 16 张资源已经迁移到规范目录；五件服装的 `portraitScalePercent` 统一回到 100。

## Out of Scope (explicit)

- 重画角色或改变角色姿势、比例和绘画风格。
- 后台上传/导入时的自动归一化。
- 下载、缓存或自动处理远程 HTTP(S) 图片。
- 统一商店看板娘、剧情专用立绘、技能特效、头像、棋子或普通 UI 插图。

## Technical Notes

- Inventory and measurements: [`research/portrait-asset-inventory.md`](research/portrait-asset-inventory.md).
- Tooling and visual-normalization options: [`research/normalization-approaches.md`](research/normalization-approaches.md).
- Relevant runtime code: `src/shared/characterPortraits.js`, `src/shared/costumes.js`, `src/modals/house/CharacterCostumeDialog.jsx`.
- Current asset metadata source: `server/adminDefaultSnapshot.js`.
- Existing PNG-only primitive: `scripts/pngTrim.mjs`.

## Decision (ADR-lite)

**Context**: 单纯裁掉透明边仍会让不同长宽比的立绘在 `object-fit: contain` 容器里呈现不同尺寸；按 alpha 面积缩放又会被半透明特效、细长武器和发丝干扰。

**Decision**: 使用统一方形画布和统一安全框。每张本地目标资源先按 alpha 裁边，再保持宽高比缩放，使完整非透明内容进入安全框，最后以底部中心锚点扩展到统一透明画布。

**Consequences**: 同类消费者可以直接使用相同的 `object-fit: contain` 规则；现有服装 framing 可回到 `100/0/0`。带长武器或宽大构图的角色会因“完整内容必须入框”而显得人物主体略小，但不会发生裁切或逐图人工补偿。
