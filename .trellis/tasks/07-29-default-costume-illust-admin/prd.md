# 为角色默认服装添加可管理立绘署名

## Goal

让每个角色的默认服装拥有与普通服装一致的可选 `illust` 名称和链接，并允许管理员在角色管理中维护；数据需要经数据库、接口、默认快照和玩家衣柜详情完整持久化。

## What I already know

- 默认服装是由角色数据生成的虚拟条目，不创建 `Costume` 数据库行。
- 虚拟默认服装卡已经读取 `character.illustName` 与 `character.illustUrl`。
- 衣柜服装详情已经能显示 `illust：名称`，并在有安全链接时提供跳转。
- 当前缺口是 `Character` 模型、接口和后台表单尚未提供这两个字段。
- 普通服装已有可复用的 illust 名称/链接约束与展示约定。

## Requirements

- 字段语义与普通服装一致：名称可单独填写，链接可选；填写链接时必须同时填写名称。
- 链接只接受 `http://`、`https://` 或以 `/` 开头的站内路径。
- 本任务只改变默认服装详情中的署名信息，不额外改变角色主详情页的信息布局。
- 在角色数据上新增可选 `illustName` 和 `illustUrl`。
- 后台角色管理允许编辑并保存这两个字段。
- 默认服装详情读取并显示角色上的 illust 信息。
- 衣柜服装详情复用商店商品详情模板的立绘框、分类胶囊、标题与说明框；illust 位于服装名下方并左对齐，不显示持有状态区域。
- 字段参与公开/后台 payload、默认快照导出与部署同步，避免重新播种或部署后丢失。
- 保持默认服装为虚拟条目，不创建或购买默认 `Costume`。

## Acceptance Criteria

- [x] 管理员可在角色编辑表单填写、保存、刷新后重新看到默认服装 illust 名称与链接。
- [x] 只填名称时默认服装详情显示纯文本 `illust：名称`。
- [x] 名称和安全链接同时存在时，默认服装详情显示可点击署名链接。
- [x] 只填链接或填写不安全链接时保存被拒绝并显示明确提示。
- [x] 空字段保持兼容，未配置角色不显示 illust 标签。
- [x] 桌面与竖屏下，衣柜服装详情使用商店商品详情结构，illust 位于服装名下方并左对齐，且没有持有状态区域。
- [x] 衣柜服装详情立绘不显示投影，商店商品详情立绘阴影保持不变。
- [x] 默认快照导出、创建式播种和显式同步覆盖新增字段；普通启动不会覆盖已有后台值。

## Definition of Done

- Tests added or updated for validation, persistence, payload, snapshot, and UI consumption.
- Relevant lint, type-check, focused tests, and broad project check pass.
- `docs/system-design.md` and the relevant system-design chapters are updated.
- `npm run docs:system-design` regenerates `docs/system-design.html`.

## Out of Scope (explicit)

- 将默认服装改造成持久化 `Costume` 行。
- 改变服装购买、所有权或装备逻辑。
- 重做后台角色管理布局。
- 为后台管理适配移动端。
- 在角色主详情页重复展示 illust 信息。

## Decision (ADR-lite)

**Context**：默认服装由角色数据虚拟生成，衣柜详情已有统一 illust 展示能力；角色主详情是另一信息表面。

**Decision**：将 illust 元数据持久化在 `Character`，由虚拟默认服装卡透传给衣柜详情；不在角色主详情页新增重复标签。

**Consequences**：保持默认服装无需独立数据库行，并复用普通服装详情的展示约定；所有角色持久化、公开 payload、后台编辑和默认快照链路都必须同步新增字段。

## Technical Notes

- Research: `research/repo-data-flow.md`
- Existing virtual-card consumer: `src/shared/costumes.js`
- Existing wardrobe detail consumer: `src/modals/house/CharacterCostumeDialog.jsx`
- Likely persistence path: `prisma/schema.prisma`, `server/characters.js`, `server/adminCharacterManagement.js`, `server/adminDefaultSeed.js`
- Likely admin path: `src/shared/adminDrafts.js`, `src/admin/AdminCharacters.jsx`
- Implemented storage path: Prisma `Character` fields, initial schema, and legacy SQLite guard.
- Verification: lint passed; 328 test files / 2281 tests passed before the final focused DOM addition; focused default-costume DOM and seed tests passed afterward; production build and production config checks passed.
- Repository-wide `npm run check` remains stopped only by pre-existing local database drift in unrelated `siteSettings` and non-default `costumes`, which was deliberately excluded from this task's committed snapshot.
