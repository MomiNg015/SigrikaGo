# 本次黑化界面提交计划

待一次确认，暂未暂存或提交。

1. `feat: adapt Sigrika corruption UI and negative entry sequence`

本提交包含恢复开发测试入口、即时全窗口负片与静音、两秒用户选项、当前首页/手册/实际对局适配、相关回归和文档。

## 完整纳入的文件

- `.trellis/spec/frontend/handbook-puzzle-contract.md`
- `.trellis/spec/frontend/warehouse-paper-contract.md`
- `docs/system-design/03-backend-realtime-api.md`
- `docs/system-design/06-ui-theme-mobile.md`
- `scripts/check-built-css-contracts.mjs`
- `scripts/checkBuiltCssContracts.test.js`
- `src/app/App.jsx`
- `src/app/App.test.js`
- `src/app/SigrikaCorruptionTransition.jsx`
- `src/app/SigrikaCorruptionTransition.dom.test.jsx`
- `src/app/useSigrikaCorruptionTransition.js`
- `src/app/useSigrikaCorruptionTransition.dom.test.jsx`
- `src/audio/backgroundMusic.jsx`
- `src/audio/backgroundMusic.dom.test.jsx`
- `src/home/components/HomeImageEntries.jsx`
- `src/modals/HouseModal.jsx`
- `src/modals/HouseModal.test.js`
- `src/modals/WarehouseModal.jsx`
- `src/modals/house/HouseCharacterGrid.jsx`
- `src/modals/house/HouseCharacterGrid.dom.test.jsx`
- `src/modals/house/HouseHandbook.dom.test.jsx`
- `src/modals/warehouse/useWarehouseInventory.js`
- `src/modals/warehouse/useWarehouseInventory.dom.test.jsx`
- `src/styles/cssLayerInventory.js`
- `src/styles/styleContract.test.js`
- `src/styles/mobile-adaptive/handbook-strip-frame.css`
- `src/styles/mobile-adaptive/sigrika-corruption.css`
- `src/styles/mobile-adaptive/sigrika-corruption/negative-entry.css`
- `src/styles/mobile-adaptive/sigrika-corruption/home-duel-entry.css`
- `src/styles/mobile-adaptive/sigrika-corruption/handbook-cards.css`
- `src/styles/mobile-adaptive/sigrika-corruption/handbook-contamination.css`
- `src/styles/mobile-adaptive/sigrika-corruption/handbook-mobile.css`
- `src/styles/mobile-adaptive/sigrika-corruption/home-contamination.css`
- `src/styles/mobile-adaptive/sigrika-corruption/room-replay.css`
- `src/styles/mobile-adaptive/sigrika-corruption/transition.css`

- `docs/design-samples/sigrika-corruption-2026-10-23/`（正式组件预览及最终截图）
- 本任务 PRD 和提交清单（运行日志与初始截图留在本地）

## 2026-10-24 补充的实际对局文件

- `src/room/PlayerInfo.jsx`、对应测试、`RoomScreen.jsx`、`header/RoomHeader.jsx` 及 DOM 测试、`layout/RoomLayouts.jsx`
- `src/styles/mobile-adaptive/battle-paper-*.css`、`readable-type-battle.css`
- `src/styles/mobile-adaptive/sigrika-corruption/room-panels.css`、`room-timers.css`、`room-controls.css`、`room-secondary-surfaces.css`、`room-system-log.css`
- `tests/e2e/interface-polish.spec.js`
- 预览新增实际对局匿名夹具、入口和复查截图/说明

## 仅选择本次补丁的共享文件

- `.trellis/spec/frontend/quality-guidelines.md`：只纳入黑化共享布局、顶栏、短屏与 Portal 图标契约，不纳入原有档案工作。
- `src/app/AppOverlays.jsx`：只加入黑化入口回调的解构和传递，不纳入既有个性化开关改动。
- `docs/system-design.md`：只纳入黑化入口摘要与对应剧情/转场段落。
- `docs/system-design.html`：从本次待提交 Markdown 和分篇组合生成暂存版本，工作区保留现有其它文档变更。

## 本次不提交的已有修改

- `.trellis/spec/backend/profile-folder-contract.md`
- `.trellis/spec/frontend/css-architecture.md`
- `docs/design-samples/aemeath-voyage-2026-10-19/index.html`
- `eslint.config.js`
- `server/achievements.js`
- `server/achievements.test.js`
- `src/app/AppOverlays.dom.test.jsx`
- `src/app/useHomeUserRefresh.js`
- `src/app/useToastQueue.js`
- `src/modals/ProfilePlayRecords.dom.test.jsx`
- `src/modals/ProfilePlayRecords.jsx`
- `src/modals/ResumeModal.dom.test.jsx`
- `src/modals/ResumeModal.jsx`
- `src/styles/mobile-adaptive/profile-folder-mobile.css`
- `src/styles/mobile-adaptive/profile-folder-summary.css`
- `src/styles/mobile-adaptive/profile-paper-cards.css`
- `src/styles/mobile-adaptive/profile-paper-mobile.css`
- `tests/e2e/profile-paper.spec.js`

其他不相关未跟踪文件（profileFeatures、其它设计样板和 promo）保持原状。只提交本地，不推送。
