# 手机棋盘比例与队际赛头像

## Confirmed requirements
- 修复移动端棋盘随断点或容器压缩出现非正方形的问题。保持坐标、交互和棋盘特效一致。
- 用户确认队际赛采用当前角色大头像 + 底部三枚出场顺序头像；当前高亮，已退场灰显，未揭晓问号。
- 不改队际赛角色揭晓/结算/技能规则，不增加隐藏角色数据；桌面与手机共用布局语义。

## Evidence and approach
- Production CSS reproduced a 430x390 board-wrap and 370x330 board at 768x1024; mobile width guards end at different 760/768/900 breakpoints and explicit height overrides survive width changes.
- Set portrait stage width from available space, derive height by aspect-ratio; frame fills the stage width with matching coordinate tracks.
- Replace three skewed portrait slices with the active portrait and an independent compact lineup strip; preserve costume image helpers and hidden entry boundaries.

## Acceptance
- 320/360/390/412/768/900 portrait and constrained parent widths keep stage/frame/grid square.
- Team portraits keep the active member readable and all three round positions stable without mobile clipping.
- Focused tests, browser geometry, lint/build, docs update and CSS inventory.

## Verification
- 105 targeted tests passed; lint, production build and built CSS contracts passed.
- Production CSS checked in headless Edge at 320/360/390/412/768/900 portrait widths and 280px constrained parent. Stage/frame/grid are square and non-collapsed. Geometry evidence: .codex-run/mobile-board-team/geometry.json.
- Desktop/mobile team portrait screenshots inspected, including finished/active/hidden slots.
- Broader RoomScreen has two pre-existing desktop-style assertions failing; broad styleContract has an untouched player-status.css oversized-file failure. No unrelated styling altered.

## User correction
Use the existing single portrait area divided into three equal-area diagonal slices, in fixed first/second/third lineup order. Supersedes main portrait plus thumbnails; preserve mobile board geometry.

## Selected design
User selected B (staggered paper strips). Replace shared single-portrait backing with independent pastel paper slices; mobile team portrait 88–108 by 96px.

## Selected mobile information design
User selected staggered C with live countdown progress bar. Apply to ordinary portrait battle, keeping time, captures, removals, overclock and skill prominent.

## Final compact A selection
User selected compact A with separate identity/clock/statistic/skill cards, stone-colored identity, active yellow clock, pink overclock, and character-accent skill gradient. Restore width-led board sizing.

## Two-row application
User requested applying the two-row sample with 40/60 identity/timer widths, inline stats and centered narrower skill card. Preserve full-height left avatar and width-led square board.
