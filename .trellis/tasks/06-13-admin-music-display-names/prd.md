# 后台音乐管理显示名

## Goal

新增后台“音乐管理”页，让管理员修改音乐在游戏内显示的名字。音乐轨道 id、类型、角色绑定和音频文件仍以 `src/shared/musicLibrary.js` 的 `MUSIC_TRACKS` 为权威来源；数据库只保存显示名覆盖值。

## Requirements

- 新增 `MusicTrackSetting` 持久化模型，`id` 对应静态音乐 track id，保存 `displayName`、`createdAt`、`updatedAt`。
- 服务启动时创建或补齐旧 SQLite 开发库所需的音乐设置表。
- 新增音乐目录合并 helper，读取静态 `MUSIC_TRACKS` 并叠加数据库 `displayName`；空名或缺失记录回退静态 `track.name`。
- 新增 `GET /api/music-tracks`，登录用户可读合并后的音乐目录。
- 新增 `GET /api/admin/music-tracks` 与 `PATCH /api/admin/music-tracks/:id`，管理员可查看并修改已存在静态 track 的显示名，修改写入 `music-track.update` 审计日志。
- 后台新增 `music` tab，表格列出轨道 id、类型、角色、默认名、当前显示名，右侧抽屉只编辑显示名。
- 玩家侧把合并后的 `musicTracks` 放入 App 状态，并传给背景音乐 resolver、角色 BGM 预览/下拉、抽卡管理音乐奖项选项，以及需要从音乐目录派生名称的商城/抽卡展示入口。
- 更新系统设计文档并重新生成 `docs/system-design.html`。

## Acceptance Criteria

- [ ] 管理员可以在后台“音乐管理”看到所有静态音乐轨道，并保存新的显示名。
- [ ] 未知 track id 的后台更新请求返回 404 或 400，不创建孤儿配置。
- [ ] 玩家侧角色详情 BGM 名称、抽卡后台音乐奖项选项、音乐相关展示使用覆盖名。
- [ ] 音频播放配置、轨道 id、角色绑定不因改名变化。
- [ ] 启动 schema guard 可在旧 SQLite 库上幂等创建音乐设置表。
- [ ] 单元测试覆盖后端合并/更新、前端 helper 注入和后台 UI 基本渲染。
- [ ] `npm test`、`npm run build`、`npm run docs:system-design` 通过或记录明确阻塞。

## Definition of Done

- Tests added or updated for backend, shared helper, and admin/frontend display paths.
- Build succeeds.
- System design docs and generated HTML updated.
- Scope remains limited to display-name management.

## Technical Approach

Add a focused backend `musicTracks` domain module that owns static/database merge, validation, admin update, and public/admin payload projection. Add startup schema guard through `server/serverStartup.js`. Keep route bodies thin in `server/adminRoutes.js` and `server/playerRoutes.js` or public route boundary as appropriate.

Frontend will keep `MUSIC_TRACKS` as the default/fallback catalog, then store server-merged tracks in `App.jsx` state after login/preload and admin refreshes. Existing music resolver functions already accept injected `tracks`, so the implementation should route merged tracks through those existing arguments rather than duplicating selection logic.

## Decision (ADR-lite)

**Context**: Music names are static today, while music ownership, gacha prizes, shop items, and character BGM selection already reference static track ids.

**Decision**: Persist only display-name overrides keyed by static track id.

**Consequences**: The feature is small, safe, and consistent across UI surfaces, but it intentionally does not allow adding new music, uploading audio, or changing playback metadata.

## Out of Scope

- Uploading, replacing, deleting, or disabling music files.
- Creating new track ids from the admin UI.
- Changing track type, character binding, default unlock status, purchasability, playback mode, or audio source paths.
- Editing shop item names as a proxy for music display names.

## Technical Notes

- Current music catalog lives in `src/shared/musicLibrary.js`.
- Existing admin tabs live under `src/admin/AdminConsole.jsx` and `src/admin/AdminShell.jsx`.
- Existing admin catalog/gacha flows already validate music against static `MUSIC_TRACKS`.
- System-design updates are required by project instructions because this changes architecture, API, data model, resource behavior, and admin UI.
