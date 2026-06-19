# Revert username nameplate three-segment DOM

## Goal

撤回上一轮“三段 DOM 名牌贴纸”方案的实施，让当前项目不再携带这套 nameplate 配置、数据库字段、后台 preset 表单和三段 DOM/CSS 合同。

## Requirements

* 移除 UserIdentity 的三段 nameplate DOM，恢复为装备用户名背景时由用户名 tag 直接承载背景图的简单渲染。
* 移除共享 nameplateConfig、新增 CSS 子文件、Prisma nameplate preset 字段、迁移、后端 payload/validation 中的三段方案字段。
* 移除后台奖励资产里专为该方案添加的 nameplate 安全 preset 控件。
* 回滚本方案写入的系统设计文档和 Trellis spec 说明。
* 更新测试断言回到非三段 DOM 合同。
* 不触碰无关本地改动，尤其是当前工作区里的 inline confirm dialog 相关文件。

## Acceptance Criteria

* [ ] UserIdentity 不再渲染 .user-identity-nameplate-left/center/right。
* [ ] 代码库不再包含 nameplateConfig.js 或 user-nameplate.css。
* [ ] Prisma schema、migration、server achievement payload 不再包含 nameplateSlicePreset 等字段。
* [ ] 全量 npm test 通过。
* [ ] npm run build 通过。

## Definition of Done

* Tests updated and passing.
* Build passing.
* Docs regenerated if system-design source changes.
* Unrelated local changes are preserved.

## Out of Scope

* 重新设计用户名背景的新方案。
* 回退或修改 inline confirm dialog 相关改动。

## Technical Notes

Likely affected files are the files changed by the previous nameplate implementation: src/shared/UserIdentity.jsx, src/styles/hud-components/user-identity.css, achievement reward asset schema/server/admin files, related tests, docs/system-design files, and Trellis spec additions.
