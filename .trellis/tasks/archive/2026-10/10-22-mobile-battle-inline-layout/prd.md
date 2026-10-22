# 移动端对弈单行布局与按钮阴影修正

## Goal
修复用户截图中普通移动端对弈的五项布局与交互问题，沿用现有校园主题和信息卡片轻阴影。

## Requirements
- 玩家身份卡的棋色、完整用户名和段位保持同行，段位靠右；沿用长用户名整体缩放。
- 页头信息和右侧工具、退出、选项按钮保持同一行，包含开发测试工具的状态。
- 右上按钮采用信息卡片级别的小硬阴影，按下时位移并压缩阴影。
- 底部功能按钮及容器减轻阴影，保留现有语义配色与按压反馈。
- 提子、除子、超频的标签和数值始终在一行。
- 同步已有系统设计事实并生成 HTML。

## Acceptance Criteria
- [x] 在 320、360、390、492px 竖屏检查真实组件和完整生产样式，身份、统计和 header 均符合单行要求。
- [x] 按钮默认、按下、禁用及减少动态效果表现正确，页面无横向溢出。
- [x] 桌面及特殊剧情布局保持原有行为。
- [x] 相关静态合同、浏览器检查和构建检查通过。

## Technical Approach
近期 readable-type-battle.css 把身份和统计拆成两行，并对含测试工具的 header 强制整行标题；修正这些最终 owner，避免继续叠加覆盖。阴影沿用信息卡片的 1px/2px 硬边及现有主题色。

## Edge Cases and Scope
检查长用户名、较长陪练段位、三位统计数字、开发工具显示与隐藏、观战/回放和窄屏。仅处理本次五项问题，不扩展功能、不改对局状态或其它未提交工作。

## Open Questions
无；用户已给出明确布局和阴影参照。

## Validation
- Production browser suite: 11 passing cases, including 1440/1024 desktop, 492/390/360/320 portrait, long full names, companion ranks, three-digit counters, pressed controls and reduced motion.
- `npm run verify:battle-fixes`: 443 tests plus 4 generated-document tests passed.
- PlayerInfo/header/style focused checks passed; CSS inventory was recalculated for the exact task delta and its 20 tests passed.
- `npm run lint`, final changed-file ESLint, `npm run build`, `npm run check:built-css`, `npm run docs:system-design` and `git diff --check` passed. Build retains the existing large-chunk warning.
- `npm run verify:stability -- --skip-build tests/stability/skill-effects.spec.js`: 4 desktop/mobile real-Pixi cases passed.
- Final visual evidence: `.codex-run/mobile-battle-inline/final-492.png` and `final-320.png`.
- At <=360px the optional development tool group scrolls in its own 32px lane; exit/menu remain directly visible. Statistics use 70% of the lower row to hold three-digit values without wrapping.
- Design-hook color finding for the pre-existing scoreboard `#171717` is intentional stone-turn inversion, not a new palette change; no suppression was added.
- Existing unrelated profile/server/artwork work remains untouched. The user approved the scoped commit on 2026-10-22; archive and journal follow the work commit.

## Follow-up: statistic card padding
User requested more space between the statistic text and card edges. Horizontal padding is now 5px (4px at <=360px), with content-sized minimum grid columns so three-digit values retain the padding and stay inline. Real browser checks pass at 320/360/390/492px; visual evidence is `padding-492.png` and `padding-320.png` under the task's `.codex-run` directory. No additional commit confirmation was requested while this visual iteration continues.

## Follow-up: compact utility menu and coordinate shortcut
- The portrait utility popup is 128px wide, with only message/settings buttons. Each icon and label is centered as one non-wrapping group.
- Coordinates are an icon-only toggle directly before exit, in a non-wrapping mobile quick-action group; desktop keeps its existing toolbar and flattens the wrapper with `display: contents`.
- Optional development tools scroll within a fluid 32–100px track. Scoreboard metadata and player tracks stay inside their title column, including at 320px. Moved coordinate controls retain ordinary/corrupted theme selectors.
- Final production browser suite: 12 passing cases, including 320/360/390/492 portrait and 1024/1440 desktop, coordinate toggling, popup sizing/centering, and long identity/statistics cases. Screenshots: `menu-final-320.png` and `menu-final-492.png` in the task's `.codex-run` directory.
- 167 focused component/style tests passed. Production build, built-CSS contracts and generated system-design HTML passed. Build retains existing chunk-size and public-asset warnings.
- Explicit maintained ESLint rules were applied to changed JSX/JS because RoomHeader is outside the current lint allowlist. Removed one existing unused test-source read encountered in the touched RoomScreen test file.
- Cumulative CSS delta: +2225 normalized bytes, +5 important declarations, +1 reduced-motion file; no new files, colors or breakpoint families.
- Design-hook findings were reviewed: scoreboard stone-turn literals are intentional; action-states-tools and shell-header-menu palette/radius findings are pre-existing unchanged rules; RoomScreen test literal findings are assertions, not new visual tokens. No suppression or unrelated palette edits were added.
- User approved committing the complete layout, padding and compact-menu iteration on 2026-10-22.

## Commit validation
- The 12 production browser cases, 167 focused component/style tests, explicit changed-file lint, production build and built-CSS contracts passed before the commit request.
- Commit-time broad lint passed. The full unit run completed with 451 passing files and 3307 passing tests; only two local development-proxy cases exceeded the default 5-second timeout. All four proxy cases passed when rerun with a 15-second limit, without source changes. The unmodified default `npm run check` therefore did not pass as one uninterrupted command; the relevant task gates passed and the unrelated limitations are retained here.
- Portrait normalization/bounds and production configuration checks passed. The separate admin snapshot check reports local `siteSettings` and `characters` differ from the committed snapshot; no snapshot or database updates are included in this UI commit.
- Shared system-design Markdown/HTML and CSS architecture documentation are staged from HEAD plus only this task's paragraph, preserving unrelated local documentation changes.
