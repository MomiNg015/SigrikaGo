# 恢复西格莉卡黑化剧情分支

## Current decision (2026-10-27)

用户改为暂时关闭黑化剧情分支。统一共享开关默认关闭，隐藏测试入口，暂停第八次触发、异常剧情续播、特殊对局与旧房间恢复。正常糖果流程保留到七次，后续沿用普通剧情；账号对外投影为正常，数据库原进度与快照不删除或清零。之前的界面、负片和对局适配保留在工作区，关闭改动单独提交，不包含无关 WIP。

### Shutdown validation and commit

- Committed only shutdown logic, public projection, original App guards, tests and docs as `e509b6bc`; previous UI restoration and unrelated work remain unstaged. The working restored shortcut additionally consumes the same disabled switch.
- Targeted initial regression: 10 files / 109 tests passed; two additional item-use boundary cases also passed in the later items/disabled suite (46 tests). Disabled cases cover all persisted phases, direct mutations, stale sockets, owner/watcher joins, restore timers, and ordinary story selection.
- Full `npm run check`: lint passed; 3357/3360 tests passed. One obsolete handbook source assertion was corrected without reverting the prior UI work and passed its rerun. Two existing dev-proxy tests exceeded the 5000ms deadline; the diagnostic rerun with `--testTimeout=20000` passed all four, including one taking 5473ms. No proxy production code or permanent timeout was changed.
- Portrait checks, build, built-CSS contracts, production-config sample and docs generation passed. Existing `siteSettings` / `characters` admin-snapshot drift still blocks the broad snapshot gate; no snapshot export or live account mutation was performed.
- Scoped staging generated docs HTML from exactly the staged Markdown and kept unrelated mixed-file edits out. `git diff --cached --check` passed; index is empty after commit. Two abandoned empty index locks were moved into this task directory after process inspection; no active Git process was stopped.

## Goal

恢复开发环境黑化测试跳转入口，并按 2026-10-23 当前界面适配、美化黑化首页、手册及对局入口。将进入演出替换为用户指定的负片与对话流程。

## Follow-up requirements (2026-10-23)

- 点击黑化测试入口即刻全窗口负片，立即停止 BGM；等待两秒后显示唯一用户选项“......怎么回事？？”；点击后解除负片并呈现黑化首页。
- 使用原服务端跳转与高潮接口推进真实账号状态，防重入；失败解除遮挡并提示、允许重试，卸载清理定时器和音频暂停状态。
- 自然第八次剧情高潮使用同一负片进入演出；既有恢复结束流程保留。
- 视觉沿用当前首页学生证、布局、手册立绘结构和文字层级；黑化时手册的所有角色详情继续不可操作，首页保留手册和专属对弈入口。
- 保留灰败校园纸张与暗红异常强调，减少遮盖内容的装饰；兼顾桌面和 390/360/320px 竖屏。
- 使用正式组件制作本地预览并实测负片时序、交互锁定、手册和对局入口；更新相关测试、系统设计及 CSS 合同。

## Requirements

- 先查明当前代码、已发布剧情数据与历史版本的差异，使用已有内容与触发规则。
- 保留普通糖果剧情、黑化转场、专属决战、胜负恢复剧情的既有语义。
- 不覆盖工作区中已有的履历、成就、样式等无关改动。
- 更新系统设计文档并生成 HTML；执行与修改范围匹配的验证。
- 用户已确认：仅恢复测试跳转入口，不接入完整剧情正文。
- 在西格莉卡第 1 至 7 次普通吃糖剧情的起始节点追加原测试选项，并保留正常选项。
- 测试跳转使用现有 debug/jump-to-eight 和 climax 接口；本轮追加要求以全窗口负片与用户确认替代中间占位剧情，重复点击防重入，失败可重试。
- 生产构建无测试入口，生产服务端继续返回 404。

## Current Findings

- 共享篇章状态机与服务端第八次吃糖触发仍在。
- 黑化美术、音乐、特殊对局和恢复接口仍在。
- 仓库黑化调试跳转此前已移除；内置脚本黑化与结尾仍是占位节点，需继续核对本地发布数据和历史内容。
- 09-02 二审任务明确只交付 Word，没有实装；不能把它误认为已发布剧情。

## Acceptance Criteria

- [x] 查明缺失内容或不可达入口的根因：029e4079 移除了仓库注入选项及导航回调。
- [x] 开发环境测试选项通过服务端接口推进到第八次，打开不可跳过的黑化起点；高潮、决战和恢复沿用原实现。
- [x] 38 项针对性测试通过，系统设计 HTML 已生成。

## Out of Scope

- 新写或改写剧情；擅自替换为未实装的二审 Word。
- 改动用户账号进度、无关功能、公开部署或远端数据库。

## Definition of Done

恢复范围有历史证据，变更可审查，相关验证有结果，现有未提交工作保留。

## Decision

恢复 029e4079 父版本中的入口逻辑，并兼容当前仓库请求防重入。沿用已有脚本与服务端状态机，无需新增接口或数据迁移；不改用户账号数据。

## Validation

- `npm test -- src/modals/warehouse/useWarehouseInventory.dom.test.jsx src/modals/WarehouseModal.test.js server/sigrikaCandyArc.test.js server/commerceRoutes.test.js`: 4 files / 38 tests passed.
- `npm run check`: lint passed; full test run passed 3330/3331 tests. One unrelated proxy-startup test hit its 5000 ms limit. The isolated `npm test -- scripts/devApiProxy.integration.test.js` rerun passed all 4 tests without code changes.
- `npm run check:portraits`: passed.
- `npm run check:admin-snapshot`: existing local `siteSettings` and `characters` differ from the committed snapshot. These domains and the local database were not modified by this task; no broad snapshot export was performed.
- `npm run docs:system-design`: passed.
- `npm run build`, `npm run check:built-css` and the production configuration check: passed; existing large-chunk warnings remain.
- `git diff --check`: passed.
- Initial direct `npx vitest` invocation also scanned ignored historical worktrees; those results were discarded and the actual validation uses the repository `npm test` exclusions.
- Initial restoration was left uncommitted; the follow-up will use scoped staging to preserve unrelated existing changes.

## Follow-up implementation and evidence

- `App` forwards the entry callback through overlays and warehouse; transition hook gates commit behind 2000ms and user confirmation. Character preview closes and background pause cancels pending decode plus fading tracks. The body Portal keeps the whole viewport inverted and root inert until confirmation.
- Current homepage/student card and portrait layout are reused. Corrupted handbook uses current strip geometry, with all details locked; removed old grid-only styling and whole-content grayscale that concealed current portraits and labels. Entry uses the existing corrupted portrait and a readable dark-red paper tag.
- Impeccable review: literal charcoal/gray/crimson/warm-white colors are intentional narrative-state exceptions, not ordinary campus palette drift. Existing strip-frame palette findings are unchanged shared artwork geometry. The new option radius was corrected from 2px to the 4px scale. No ignores or suppressions were added.
- Targeted regression: 14 files, 161 tests passed. Desktop 1440 and portrait 390/320 screenshots have no horizontal overflow. Browser clock checks verified immediate invert(1), silence and inert root; no choice at 1999ms, one choice at 2000ms, Escape cannot bypass, confirmation releases film and pause.
- Browser evidence is in `docs/design-samples/sigrika-corruption-2026-10-23/`. Preview uses real components and mock API data, and does not mutate the local account/database.

- Expanded regression initially passed 715/718 across 105 files; the three failures were obsolete assertions for the previous transition signature and legacy handbook DOM. Updated them to verify confirmation wiring, current strip geometry and disabled accessible character controls, with scoped rerun recorded in `regression-fixes.log`.
- Audio-specific follow-up: 25/25 tests passed, including cancellation of pending decoder work and both active/fading sources.
- Design audit: 13 color advisories only, all classified as intentional corruption-state palette. No suppression configured. Existing normal strip palette is unchanged. Desktop Sigrika gets a stable wider strip and centered readable name; final screenshot verifies the name stays inside its clipped tile.

- Final scoped rerun: 5 files / 78 tests passed; covers all three updated legacy assertions, CSS budget and built-CSS syntax equivalents. Lint, final production build and built-CSS checks passed; existing large-chunk warning remains. `git diff --check` passed.
- Additional hook finding in `HouseModal.test.js` is an unchanged assertion for the existing character-description purple, not a new palette declaration. Retained as a test fixture false positive.
- Implementation is complete and reviewable. Scoped commit plan is saved in `commit-plan.md`; no staging/commit until the one-shot confirmation required by workflow Phase 3.4. Existing unrelated WIP is preserved.

## 2026-10-24 用户纠正：补齐实际对局

上一轮只验证首页、手册和对弈入口，实际 RoomScreen 被旧 `:not(.sigrika-candy-duel-room)` 分支排除在当前纸卡布局之外。本轮范围明确包含实际棋盘、双方身份/专属立绘、计时/统计/未知技能、顶栏、操作区、系统记录与确认弹窗，并验证桌面、矮桌面、手机竖屏及已有横屏支持。沿用现有剧情与交互规则，不改账号数据。共同布局使用显式 data 属性，黑化 owner 只补充配色和必要尺寸适配。验证记录见 room-review/。

### 实际对局复查结果

- 47 files / 495 tests passed (room, CSS, transition, background music); final CSS rerun 7 files / 156 tests passed.
- Final Playwright: 7/7 passed at desktop, short desktop, portrait and landscape sizes. All 169 points hit correctly; dispatch checked; disabled counting/hidden skill respected; names/turn and timer fit verified; portaled log SVG path color and modal cancel checked.
- Normal desktop and portrait snapshots are pixel-identical under matching motion preferences. Corrupted screenshots and real-component preview now include actual RoomScreen.
- Lint/build passed; existing large bundle advisory unchanged. Docs regenerated. No real account/database mutation or live multiplayer session.
- A root-only SVG stroke check missed descendant currentColor inheritance. Final regression now checks actual path strokes and screenshot confirms visible close/send icons.
- CSS correction uses existing owners and media families, removes legacy duplication, and records only task-owned debt changes. Existing unrelated WIP remains unmodified.
