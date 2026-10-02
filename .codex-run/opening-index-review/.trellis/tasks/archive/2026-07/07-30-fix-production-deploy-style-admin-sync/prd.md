# 修复生产部署样式与后台同步

## Goal

修复本地开发与云端生产部署之间的行为偏差，使 Bright School 主界面所有顶层窗口在生产构建后使用暗色非模糊遮罩，并确保旧生产 SQLite 在后台默认配置同步前完成幂等结构兼容，最终将本地非用户后台配置可靠同步到云端。

## Requirements

- 修复生产 CSS 转换后 `backdrop-filter: none !important` 被移除的问题。
- 审计相关 `backdrop-filter` / `-webkit-backdrop-filter` 成对声明，保证生产构建保留标准属性。
- 增加生产构建产物门禁，不能只检查源码。
- 在 `admin:sync-defaults` 读取数据库之前运行幂等 schema 兼容入口。
- 当前生产旧库缺失 `Character.illustName` 等兼容字段时，不清库、不重置迁移历史。
- 从本地 `prisma/dev.db` 重新导出并提交非用户后台默认快照。
- 云端用户、用户资产、购买、历史记录和运行时数据不进入默认快照同步范围。
- 更新部署与系统设计文档。

## Acceptance Criteria

- [x] 生产构建 CSS 中 Bright School `.modal-backdrop` 保留 `backdrop-filter: none !important`。
- [x] 生产构建产物检查会在该声明丢失时失败。
- [x] 部署脚本顺序为：备份 → 构建/验证 → 停服 → Prisma migrate → schema 兼容 → 默认配置预览/应用 → 前端切换 → 启动/健康检查。
- [x] schema 兼容命令可重复执行，并在同步前补齐当前旧库所需字段。
- [x] `npm run check:admin-snapshot` 通过，`siteSettings`、`characters`、`costumes` 不再报告陈旧。
- [x] 相关单元测试、部署配置测试、生产构建和仓库质量门禁通过。
- [x] `docs/system-design.md`、对应分篇和 `docs/system-design.html` 同步更新。

## Definition of Done

- 代码、测试、快照、部署脚本和文档形成同一可提交变更。
- 不执行 `prisma migrate reset` 或生产 `prisma db push`。
- 不直接连接或修改用户的云服务器。
- 输出可复制执行的云服务器部署与验证步骤。

## Technical Approach

1. 将兼容声明按前缀在前、标准属性在后的顺序书写，适配当前 Lightning CSS 的声明归并行为。
2. 在构建后读取实际 `dist/assets/*.css`，验证关键生产样式契约。
3. 提供独立、幂等的生产 schema 兼容命令，只运行结构 guard，不运行用户数据重置。
4. 部署脚本在 `prisma migrate deploy` 后、默认快照同步前调用该命令。
5. 运行本地快照导出，并通过现有范围过滤保护用户/历史/运行时域。

## Decision (ADR-lite)

**Context**: 本地 Vite 开发模式保留两条 backdrop 声明，但生产 Lightning CSS 会把同一属性组合归并为最后一条；同时单一 `0_init` 已在生产库标记为完成，后续直接改写基线不能升级旧库。

**Decision**: 使用兼容声明顺序和生产产物断言解决样式偏差；冻结既有迁移基线，通过部署前幂等 schema guard 修复当前旧库，并要求未来结构变化使用新增迁移。

**Consequences**: 部署多一个明确的结构兼容步骤和产物门禁，但失败会在默认数据同步及前端切换前暴露，避免再次出现半更新状态。

## Out of Scope

- 不迁移、覆盖或删除任何用户拥有数据与历史记录。
- 不重设计窗口视觉或改变暗色遮罩透明度。
- 不在本任务中直接登录云服务器执行命令。
- 不重写全部 Prisma 迁移历史。

## Technical Notes

- 样式源码：`src/styles/themes/bright-school/surface-contracts/root-shell.css`
- 基础模糊：`src/styles/modals/base-result-skill.css`
- 部署入口：`deploy/update-production.sh`
- 启动结构 guard：`server/serverStartup.js`
- 默认快照：`server/adminDefaultSnapshot.js`
- 诊断记录：`research/production-deployment-diagnosis.md`
