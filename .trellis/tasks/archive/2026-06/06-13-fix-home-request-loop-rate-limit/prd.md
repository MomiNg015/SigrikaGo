# 修复首页资源请求循环限流

## Goal

修复打开部员手册提示“请求过于频繁”、商店物品频繁回到加载中的问题，避免前端首页/弹窗 effect 循环请求导致后端 rate limit。

## What I Already Know

- 用户看到“请求过于频繁”说明后端 rate limit 已触发。
- 部员手册与商店都依赖登录后的首页状态和资源目录；近期改动新增了 `/api/me` 成就刷新、音乐目录合并、成就 toast 回调。
- 近期登录修复涉及 `useStartupPreload` 和 `useHomeUserRefresh`，需要重点检查 effect 依赖是否因不稳定函数或对象导致重复请求。
- 当前工作区只有 `.codex-temp/` 临时目录未提交，应继续排除。

## Requirements

- 复现或通过代码路径确认重复请求来源。
- 最小修复 effect 依赖/回调稳定性问题，避免无用户操作时反复请求 `/api/me`、`/api/shop`、`/api/music-tracks` 等接口。
- 保持成就达成 toast、音乐目录显示名、商店音乐名功能不变。
- 如新增或确认前端状态契约，更新 `.trellis/spec/`；如影响系统设计事实，更新系统设计文档。

## Acceptance Criteria

- [ ] 首页静止状态不会循环触发 `/api/me`。
- [ ] 打开部员手册不会因本地请求风暴触发“请求过于频繁”。
- [ ] 商店列表不会因为父组件回调/对象引用变化反复重载。
- [ ] 添加/更新回归测试覆盖相关 effect 依赖契约。
- [ ] `npm test` 通过。
- [ ] `npm run build` 通过。

## Definition of Done

- 根因明确，不做猜测式修复。
- 独立 `fix:` commit。
- Trellis 任务归档并记录 session。

## Out of Scope

- 不修改后端 rate limit 阈值。
- 不重做商店或部员手册 UI。
- 不处理无关的 `.codex-temp/` 临时目录。

## Technical Notes

- 重点检查 `src/app/App.jsx`、`src/app/useHomeUserRefresh.js`、`src/modals/shop/useShopCatalog.js`、`src/app/useReplayRecords.js`。
