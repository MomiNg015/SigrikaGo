# 工作流、文档规则与历史记录

本文记录 Trellis 工作流、系统设计文档维护方式、编码安全和较难归类的历史更新。修改 Trellis 规则、文档生成方式、AI 协作约定或历史追踪方式时优先更新本分篇。

## 当前文档维护规则

- `docs/system-design.md` 是入口和目录，不再承载所有详细设计。
- 详细设计按主题写入 `docs/system-design/*.md`。
- 修改入口或分篇后运行 `npm run docs:system-design` 生成 `docs/system-design.html`。
- `npm run verify:battle-fixes` runs the focused regression suite for battle-board fixes, then regenerates and validates system-design HTML. Use it before handoff when changing board erase styling, skill targeting/release confirmation, ordinary capture counting, chat wrapping, or character skill seed/config behavior.
- `npm test` excludes local Codex scratch folders such as `.codex-run/` in addition to worktrees, e2e tests, and stability tests, so temporary staged snapshots cannot be collected as Vitest suites during handoff.
- 中文内容应使用 `apply_patch`、Node UTF-8 脚本或其它明确 UTF-8 的工具写入，避免 PowerShell 默认编码链路造成显示混乱。

## Lobby Stats And Blacklist Match Blocking

- The home user plaque receives live lobby stats from `lobby:stats` and shows `在线人数：[count]`; the main match button shows `匹配中人数：[count]` below its label.
- The backend matchmaking wait state is now a queue instead of a single `waitingPlayer`. `match:join` checks both users' blacklist relationships before pairing, skips incompatible candidates, and keeps all skipped candidates waiting for later compatible players.
- Direct duel requests also consult the target user's blacklist. If the target has blacklisted the requester, the target receives no incoming request; the requester receives the normal rejection event after a 3-second delay, matching an ordinary refusal without revealing blacklist state.
- Socket disconnects use a session cleanup grace window. When the last socket for a user disconnects, the account is marked offline and room disconnect handling runs immediately, but the login session is cleared only after 30 minutes unless a new socket for the same session reconnects first. This prevents browser backgrounding, network sleep, and Socket.IO transient reconnects during a game from turning into silent authentication failures and frozen room UI.
- Login conflict checks use the active online-socket index rather than the mere presence of an unexpired grace-window session. A refreshed or closed page loses its in-memory token and must log in again, but if the old socket is already gone the new login is allowed instead of showing a stale "already logged in" conflict.
- If the Node watch server restarts while a page still has a valid JWT in memory, HTTP and Socket.IO auth can adopt that token's `sid` when no active in-memory session exists for the user. Sessions that were explicitly cleared by logout, forced login, pending-login expiry, or the disconnect grace timer are revoked and cannot be adopted again.
- Restored unfinished rooms mark every persisted player without a live socket as disconnected and append missing `disconnect` system notices before room timers resume. This keeps reconnect recovery, the centered portrait `断线中` badge, chat history, and watch-list online counts consistent after server restarts.
- The frontend listens for Socket.IO `connect_error`. Authentication failures (`unauthorized` / `forbidden`) now clear local room/match state, return to the login screen, and show `登录已失效，请重新登录` instead of leaving the player on a stale board snapshot.

## Trellis Workflow Notes

- Trellis is installed in this repository with project workflow files under `.trellis/`, project-scoped AI skills under `.agents/skills/`, and Codex hook/subagent configuration under `.codex/`.
- `AGENTS.md` keeps the Trellis assistant instructions plus the project rule that every update must keep `docs/system-design.md` synchronized.
- Use `py -3 ./.trellis/scripts/get_context.py` to inspect current Trellis state. Use `py -3 ./.trellis/scripts/task.py create "<title>" --slug <slug>` to create tracked tasks before multi-step work.
- The initialized Trellis context uses developer `Moming`, single-repo mode, and `backend` / `frontend` spec layers. A bootstrap guidelines task exists under `.trellis/tasks/00-bootstrap-guidelines/`.
