# SigrikaGo 系统设计

本文档是系统设计入口。详细设计已经按主题拆分到 `docs/system-design/`，修改架构、运行行为、资源体系、样式主题、部署方式或技术债时，应更新入口摘要或对应分篇，并运行 `npm run docs:system-design` 同步 HTML。

## 阅读顺序

1. [项目总览与功能边界](./system-design/01-project-overview.md)
2. [前端架构与状态边界](./system-design/02-frontend-architecture.md)
3. [后端、HTTP API 与实时房间](./system-design/03-backend-realtime-api.md)
4. [数据模型与领域系统](./system-design/04-data-model-and-domain.md)
5. [资源、音频与启动预加载](./system-design/05-assets-audio-preload.md)
6. [UI 主题、移动端与交互体验](./system-design/06-ui-theme-mobile.md)
7. [性能、技术债与扩展路线](./system-design/07-performance-tech-debt.md)
8. [工作流、文档规则与历史记录](./system-design/08-workflow-and-history.md)

## 当前架构摘要

- 前端使用 React 19、Vite 和 Socket.IO client；`src/main.jsx` 只负责浏览器挂载，应用组合根在 `src/app/App.jsx`，业务状态逐步下沉到 `src/app/*` hooks 和独立视图组件，应用级弹窗可见性集中在 `src/app/useOverlayState.js`，房间/回放/结果弹窗会话状态集中在 `src/app/useRoomSessionState.js`，匹配等待/成功过渡状态集中在 `src/app/useMatchSessionState.js`。
- 后端使用 Express、Socket.IO、Prisma 和 SQLite；`server/index.js` 负责 HTTP/Socket 入口组合，启动数据与 schema 初始化收口在 `server/serverStartup.js`，Socket 连接事件套件由 `server/socketEvents.js` 统一装配，速率保护与匹配、房间连接/恢复、对局/数子/求和/计分、聊天、约战、断线清理等行为继续分布在对应 `server/socket*Events.js` 模块，生产静态托管收口在 `server/staticAssets.js`，认证、商城、抽卡、社交、回放、房间生命周期等已拆为领域模块。
- 对局模式由 `src/shared/gameModes.js` 统一配置，前后端共享模式顺序、棋盘大小、贴目、技能开关和时间控制。
- 玩家资源包含角色、装饰、道具、音乐、抽卡奖励、蓝宝石和金币；结构化关系表与旧字符串字段仍处在兼容迁移期，legacy 解析、结构化同步和公开资产合并规则集中在 `server/userAssets.js`。
- 玩家 UI 当前默认 Bright School 主题；主题注册、CSS 入口和作用域合同保留未来扩展口，共享基础层已从单一 `base.css` 入口拆到 `src/styles/base/`，房间样式已从单一 `room.css` 入口拆到 `src/styles/room/`，Startorch 对局终端皮肤已从单一 `room-terminal.css` 入口拆到 `src/styles/room-terminal/`，共享弹窗样式已从单一 `modals.css` 入口拆到 `src/styles/modals/`，移动弹窗安全层已从单一 `mobile-modals.css` 入口拆到 `src/styles/mobile-modals/`，商业/社交/仓库样式已从单一 `commerce-settings.css` 入口拆到 `src/styles/commerce/` 领域分篇，其中商店/设置/移动商业补丁继续从 `src/styles/commerce/shop-settings.css` 拆到 `src/styles/commerce/shop-settings/`；共享响应式层已从单一 `responsive.css` 入口拆到 `src/styles/responsive/`，共享移动对局层已从单一 `mobile-room.css` 入口拆到 `src/styles/mobile-room/`，共享 HUD 兼容层已从单一 `hud-components.css` 入口拆到 `src/styles/hud-components/`，最终移动端安全层也从单一 `mobile-adaptive.css` 入口拆到 `src/styles/mobile-adaptive/`，其中 Bright School 最终移动兜底覆盖继续拆到 `src/styles/mobile-adaptive/bright-school-overrides/`；Bright School 对应早期可读性清理、商业覆盖、移动端覆盖、竖屏对局覆盖、组件修复覆盖、质量兜底层和防 HUD 串色 firewall 分别拆到 `src/styles/themes/bright-school/contrast-purge/`、`src/styles/themes/bright-school/commerce/`、`src/styles/themes/bright-school/mobile/`、`src/styles/themes/bright-school/mobile/room/`、`src/styles/themes/bright-school/component-repairs/`、`src/styles/themes/bright-school/quality-base/`、`src/styles/themes/bright-school/firewall/`。
- 启动预加载区分关键资源与延迟资源，房间运行期使用轻量 `room:clock` 与完整 `room:update` 分流，降低高频交互卡顿。

## 维护约定

- 入口文档只写总览、导航和跨主题规则；详细事实写入对应分篇。
- 分篇标题、说明和新增内容优先使用中文；代码标识、路径、事件名、模型名保留原文。
- 发现乱码时先确认源文件是否含 `Unicode replacement character` 或常见 mojibake 片段，再区分终端显示问题和文件内容损坏。
- 修改 Markdown 后运行 `npm run docs:system-design`；涉及脚本或编码规则时运行 `npm test -- docs/systemDesignHtml.test.js`。

## Music Management Note

- 后台“音乐管理”只维护 `MUSIC_TRACKS` 静态曲目的显示名覆盖值；`MusicTrackSetting` 不改变轨道 id、类型、角色绑定或音频文件，玩家侧 `/api/music-tracks`、角色 BGM 选择、商城音乐展示和抽卡音乐奖项显示会使用合并后的曲目名称。

## Achievement And Personalization Note

- 成就系统以 `Achievement`、`AchievementRewardAsset`、`UserAchievement`、`AchievementCounter` 和 `UserAchievementEquipment` 为核心模型；启动时 `ensureAchievementSchema` 会先于角色/商店种子任务运行，为旧 SQLite 自动补表，并为 `Character`、`Decoration`、`ShopItem` 补 `source` 字段。玩家侧 `/api/achievements` 返回合并后的成就列表与本次新解锁成就，`/api/me/achievement-equipment` 读写称号、徽章和用户名背景装备；后台 `/api/admin/achievements` 和 `/api/admin/achievement-reward-assets` 管理成就与奖励资产并写审计日志。
- 履历弹窗新增“成就”和“个性化”入口；成就窗口在桌面端用表格，在移动端用卡片列表，并按“未达成 / 已达成 / 全部”筛选；个性化窗口桌面端按称号、徽章、用户名背景三列装备，移动端改为竖向分区。商城购买、抽卡和仓库道具使用会消费后端返回的 `achievementUnlocks`，以 `achievement` tone 的醒目 toast 告知玩家达成的成就。
