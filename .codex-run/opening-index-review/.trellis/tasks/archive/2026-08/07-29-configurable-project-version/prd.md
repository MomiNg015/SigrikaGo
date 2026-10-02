# Add configurable project version label

## Goal

在首页项目标题旁展示一个简洁的版本号，并允许管理员在后台“系统设置”中修改。标题区域不再展示“测试服”、服务器名称或其它副标题文案。

## Requirements

- 新增独立公开站点配置 `homeVersion`，默认值为 `v0.1.0`。
- 后台系统设置提供单行“项目版本号”输入框，并沿现有 SiteSetting 保存、清洗、审计与公开读取链路生效。
- 首页标题旁只显示 `homeVersion`，不再渲染 `homeSubtitle`。
- 旧 `homeSubtitle` 数据键保持读取兼容，避免破坏既有数据库与部署快照，但后台不再提供编辑入口。
- 版本号采用弱于主标题的小型等宽标签，桌面与手机竖屏均不得挤压标题或操作区。
- 更新相关测试、系统设计文档及生成的 `docs/system-design.html`。

## Acceptance Criteria

- [x] 管理员修改并保存项目版本号后，当前前端站点设置立即回写。
- [x] 重新加载后，公开站点设置仍返回持久化版本号。
- [x] 首页标题区域只出现标题与版本号，不出现 `homeSubtitle` 文案。
- [x] 默认版本号为 `v0.1.0`，服务端最长接受 24 个字符并清理首尾空白。
- [x] 相关单元测试、系统设计生成、生产构建和生产配置检查通过。

## Definition of Done

- Tests added or updated for defaults, persistence, admin editing, and home rendering.
- `npm run docs:system-design` and relevant project checks pass.
- Existing unrelated worktree changes remain untouched and are not staged or committed.

## Technical Approach

沿用 `DEFAULT_SITE_SETTINGS`、`server/siteSettings.js`、后台 PATCH 和 `useSiteSettingsState` 的既有配置数据链路。新增 `homeVersion` 而不复用 `homeSubtitle`，避免旧副标题数据被错误当作版本号。`HomeScreen` 将版本号传给 `HomeHeader`，标题组件使用独立语义类渲染紧邻主标题的低强调版本标签。

## Decision (ADR-lite)

**Context**: `homeSubtitle` 现有语义与持久化数据都是自由文案，直接改名或复用会造成旧数据误显示。

**Decision**: 新增 `homeVersion`，停止在首页与后台系统设置中消费 `homeSubtitle`，但保留旧键兼容。

**Consequences**: 数据库无需破坏性迁移；旧副标题数据暂时保留但不再可见。版本号成为独立、可继续扩展的产品元数据。

## Out of Scope

- 不显示“测试服”、环境名、构建日期或 Git 提交哈希。
- 不自动从发布流程同步版本号。
- 不删除数据库中的旧 `homeSubtitle` 行。

## Technical Notes

- 现有数据链路：`src/shared/siteSettings.js` → `server/siteSettings.js` → `/api/site-settings` / 后台 PATCH → `useSiteSettingsState` → `HomeScreen`。
- 后台表单归属：`src/admin/AdminSiteSettings.jsx`。
- 首页标题归属：`src/home/components/HomeHeader.jsx`。
- 当前 `package.json` 版本为 `0.1.0`，默认展示采用 `v0.1.0`。
- 工作区在任务开始前已有未提交改动，实施必须按文件与补丁范围保护现有 WIP。

## Verification

- Targeted tests: 7 files / 94 tests passed.
- Full test suite: 328 files / 2277 tests passed.
- `npm run build`, production configuration validation, and `npm run docs:system-design` passed.
- Desktop 1440×900 and portrait mobile 390×844 browser checks showed the version label with no horizontal overflow and no legacy subtitle.
- The aggregate `npm run check` reaches `check:admin-snapshot` and stops on pre-existing IRIS site-setting and costume snapshot drift; the new `homeVersion` row itself matches the local database and committed snapshot.
