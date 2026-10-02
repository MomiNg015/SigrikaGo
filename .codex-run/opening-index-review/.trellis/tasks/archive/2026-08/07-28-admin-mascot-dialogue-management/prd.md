# 新增后台看板娘台词管理

## Goal

在后台提供一个统一、可持久化的看板娘台词编辑入口，让管理员能维护扎希拉商店的扎希拉、残星会商店的娜波摩和 IRIS 数据库的 IRIS 台词，并让玩家侧在保存后使用新台词。

## What I already know

- 扎希拉台词目前由前端常量提供，分为随机欢迎、随机刷新、加载中、空目录、加载失败和购买成功六类。
- 娜波摩台词目前由前端常量提供，分为随机欢迎、随机刷新、加载中、空目录、加载失败、购买成功和金币不足七类。
- IRIS 问候语已经通过 `SiteSetting.irisGreeting` 持久化，并在现有后台“IRIS 管理”中可编辑；本轮将其升级为可增删的随机池。
- 现有“IRIS 管理”还承担 IRIS 友情链接维护，不能在新增统一入口时丢失。
- 玩家侧站点设置已经通过 `/api/site-settings` 在应用层集中加载；商店窗口目前尚未接收 `siteSettings`。
- `SiteSetting` 是现有无需 Prisma 迁移的通用配置模型，部署默认值还会进入 `server/adminDefaultSnapshot.js`。

## Confirmed Decisions

- 保留现有台词的触发时机、随机逻辑、看板娘表情和商店交互，只把文案来源改为后台配置。
- 随机台词组允许添加、删除和编辑；固定状态台词使用单行编辑。
- 空的随机台词组或空的固定台词不会传到玩家侧，而是回退到代码内默认文案。
- 每条台词限制长度，随机池限制最大条数，服务端统一规范化不可信输入。
- 将现有“IRIS 管理”导航升级为“看板娘管理”，不新增重复入口。
- 统一页面按扎希拉、娜波摩、IRIS 分区；IRIS 友情链接编辑继续保留在 IRIS 分区。

## Requirements (evolving)

- 后台能按扎希拉、娜波摩、IRIS 三个分区查看和编辑全部现有台词类别。
- 扎希拉和娜波摩的随机欢迎/刷新台词支持增删；至少保留一条有效台词。
- 加载、空内容、失败、购买成功、金币不足等固定反馈可直接编辑。
- IRIS 问候语支持增删并在每次打开数据库时随机选择一条；旧的单条纯文本配置继续兼容，IRIS 友情链接编辑能力继续保留且不重复出现两个编辑源。
- 扎希拉商铺和残星会服装店的独立刷新冷却统一为 1 秒。
- IRIS 数据库入口使用用户提供并转换为 OGG 的专属打开音效，遵循现有 SFX 音量、静音和预加载合同，不与通用确认音叠放。
- 保存通过管理员鉴权接口持久化，并写入现有管理员审计日志。
- 玩家端统一使用规范化后的配置；缺失、空白、损坏或旧数据库数据自动回退到当前默认台词。
- 保存看板娘配置不能重置未提交的系统设置或其他 IRIS 数据。
- 部署默认快照与启动种子包含新增配置，使全新环境和本地默认行为一致。

## Acceptance Criteria (evolving)

- [x] 后台侧边栏存在一个清晰的“看板娘管理”入口。
- [x] 页面完整展示扎希拉、娜波摩和 IRIS 的可编辑台词。
- [x] 管理员保存并重新进入页面后，台词保持为保存值。
- [x] 玩家重新打开对应商店或 IRIS 数据库后使用保存值。
- [x] 扎希拉与娜波摩随机池仍按原有触发时机随机取值，固定状态仍按原有状态显示。
- [x] 无效或空配置不会让玩家侧出现空白气泡。
- [x] 保存看板娘台词不会覆盖首页标题、系统设置或 IRIS 友情链接。
- [x] 后端、管理页、玩家消费端和默认快照均有回归测试。
- [x] IRIS 问候语可增删，且每次打开数据库时从有效池中重新随机选择。
- [x] 两家商店的刷新按钮在 1 秒冷却结束后可再次使用。
- [x] 点击打开 IRIS 数据库时播放专属 OGG，关闭窗口不播放该音效。

## Definition of Done

- 相关单元/组件/路由测试补齐。
- `npm run check` 通过。
- `docs/system-design.md` 和对应系统设计分篇按项目要求更新，并重新生成 `docs/system-design.html`。
- 工作区变更按任务边界整理，提交前向用户给出文件与提交计划。

## Out of Scope (explicit)

- 不改变三位看板娘的立绘、表情、动画、气泡样式或现有触发时序。
- 不新增看板娘角色、语音播放、富文本、条件脚本或剧情编辑器。
- 不改造后台移动端布局；后台按项目约束仅考虑桌面端。

## Decision (ADR-lite)

**Context**：现有 IRIS 页面已经拥有 IRIS 问候语和友情链接的唯一编辑入口，而两家商店的看板娘台词仍由玩家前端常量管理。新增并行入口会造成 IRIS 台词重复或管理路径割裂。

**Decision**：把现有 `iris` 后台标签的展示名称和页面职责升级为“看板娘管理”，在同一页面维护扎希拉、娜波摩和 IRIS；保留 `iris` 内部标签 id 以避免无必要的路由兼容改动。

**Consequences**：管理员获得一个明确的统一入口；IRIS 友情链接不会丢失；玩家端台词触发状态机、立绘与动效保持不变。配置使用现有 `SiteSetting` 持久化和审计能力，不新增 Prisma 表。

## Technical Notes

- 扎希拉默认台词与选择器：`src/modals/shopModalHelpers.js`、`src/modals/shop/useShopCatalog.js`。
- 娜波摩默认台词与选择器：`src/modals/costumeShopHelpers.js`、`src/modals/shop/useCostumeCatalog.js`。
- IRIS 消费端与统一后台：`src/home/IrisDatabase.jsx`、`src/admin/AdminMascotSettings.jsx`。
- 后台导航与挂载：`src/admin/AdminShell.jsx`、`src/admin/AdminConsole.jsx`。
- 公开配置与持久化：`src/shared/siteSettings.js`、`server/siteSettings.js`、`server/adminRoutes.js`。
- 应用层数据传递：`src/app/App.jsx`、`src/app/AppOverlays.jsx`、`src/modals/ShopModal.jsx`。
- 默认配置与部署：`server/adminDefaultSnapshot.js`、`server/adminDefaultSeed.js`、`scripts/export-admin-default-snapshot.mjs`。
- 代码现状研究见 [`research/current-dialogue-data-flow.md`](research/current-dialogue-data-flow.md)。
