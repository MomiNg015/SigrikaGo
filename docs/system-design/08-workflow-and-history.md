# 工作流、文档规则与历史记录

`npm test` 默认使用 `--maxWorkers=1`，`npm run check` 顺序执行验证环节。需要提高并发时必须结合用户当前本机使用情况显式调整，避免测试、构建、浏览器和容量验证同时争抢资源。

本文记录 Trellis 工作流、系统设计文档维护方式、编码安全和较难归类的历史更新。修改 Trellis 规则、文档生成方式、AI 协作约定或历史追踪方式时优先更新本分篇。

## 当前文档维护规则

- `docs/system-design.md` 是入口和目录，不再承载所有详细设计。
- 详细设计按主题写入 `docs/system-design/*.md`。
- 修改入口或分篇后运行 `npm run docs:system-design` 生成 `docs/system-design.html`。
- `npm run verify:battle-fixes` runs the focused regression suite for battle-board fixes, then regenerates and validates system-design HTML. Use it before handoff when changing board erase styling, skill targeting/release confirmation, ordinary capture counting, chat wrapping, or character skill seed/config behavior.
- `npm test` excludes local Codex scratch folders such as `.codex-run/` in addition to worktrees, e2e tests, and stability tests, so temporary staged snapshots cannot be collected as Vitest suites during handoff.
- 中文内容应使用 `apply_patch`、Node UTF-8 脚本或其它明确 UTF-8 的工具写入，避免 PowerShell 默认编码链路造成显示混乱。

## Lobby Stats And Blacklist Match Blocking

- The home header receives live lobby stats from `lobby:stats` and shows online presence as a transparent icon-plus-number tag; mode-specific matchmaking counts are shown inside the click-open match-mode picker as icon-plus-number chips.
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
- Impeccable is installed as a project-scoped skill under `.agents/skills/impeccable`. Its detector hook is controlled by `.impeccable/config.json`, local consent is stored in `.impeccable/config.local.json`, Codex runs the PostToolUse manifest from `.codex/hooks.json`, and live-mode injection is preconfigured through `.impeccable/live/config.json` for the Vite `index.html` shell. Codex 0.142 parses `.codex/hooks.json` with a strict schema, so the shared manifest keeps only the top-level `hooks` object and stores descriptive notes in system-design docs instead of the JSON file.
- Use `py -3 ./.trellis/scripts/get_context.py` to inspect current Trellis state. Use `py -3 ./.trellis/scripts/task.py create "<title>" --slug <slug>` to create tracked tasks before multi-step work.
- The initialized Trellis context uses developer `Moming`, single-repo mode, and `backend` / `frontend` spec layers. A bootstrap guidelines task exists under `.trellis/tasks/00-bootstrap-guidelines/`.


## 系统设计 HTML 生成的安全替换

生成器先将完整 HTML 写入同目录临时文件，再以 rename 替换目标并清理临时文件，避免 Windows 预览/文件句柄影响原位覆盖，以及中途失败留下截断页面。重复生成回归测试覆盖已有文件替换。

## 全项目测试入口与隔离

`npm run test:e2e:all` 先构建主应用，再顺序执行完整应用、站点入口、主界面引导、队际赛界面和浏览器陪练五套配置，所有套件为单 worker。支持指定一个或多个套件名称（`application`、`site-entry`、`home-onboarding`、`team-match`、`local-practice`）；已构建当前代码时可加 `--skip-build`。各阶段单独保留 `.tmp/e2e-all/<时间>/<套件>/` 产物，一个阶段失败仍测试其余阶段，最终汇总失败并返回非零。

完整应用默认前端 5317、服务端 3317，API、上传、Socket 代理全部指向本次服务，端口冲突明确失败。数据库按端口和运行 UUID 创建在 `.tmp/playwright/`，测试辅助函数检查身份后才允许种入测试资产。上传同样进入本次运行目录。专用页面的构建输出置于 `.tmp/playwright-builds/`，避免改写仓库已经跟踪的历史 `.codex-run` 产物。Vite 缓存位于独立 `node_modules/.vite-e2e-<端口>`，预构建只扫描当前入口，避免扫描临时工作树或共享开发缓存。自动测试按单用例设置 `x-stability-scope`，其隔离仅在既有 stability 环境启用，不放宽生产限流。

陪练分别验证开发与构建页面，入门不下载引擎，中级/高级使用真实浏览器 Worker 与 WASM；吃子挑战实际完成 100 手并验证排行榜、零普通回放与零金币奖励。两项目串行，ready 经 API 健康检查确认数据库初始化完成。fixture 显式禁用智子云并隔离上传；启动失败、后端提前退出和正常信号统一先关服务再清数据库。Windows 的进程树强杀另由总入口按精确 runId 清理本次数据库。

真实应用测试覆盖匿名/玩家/管理员权限、21 页后台加载及设置写入、商店额度竞争、扭蛋余额竞争、招募加速与领奖、邮件越权与重复领取、公告已读、社交约战/黑名单/点赞/举报、强制登录/密码重置/封禁、普通/五子棋/队际赛匹配结算与回放、数子双方确认与和棋拒绝/同意、观战权限、ACK 重试幂等、重连、两端窗口及注册引导。剧情 Excel 实际下载八张工作表、原样导入与改标题导入、显式保存草稿并核对发布版不变。上传检查权限、内容类型、伪文件和 3 MiB 边界；构建静态资源检查 MIME 与字节范围。

专用引导/队际赛页面仍包含组件 fixture 与 API mock，报告中须与真实 HTTP/Socket 流程区分。`npm run check`、稳定性、迁移、备份恢复、WASM parity 和容量 smoke 是独立门禁；全项目浏览器验证不替代这些门禁，也不代表目标云的 Nginx/systemd/HTTPS、容量 target 或所有技能组合均完成真人验收。

测试 fixture 的静态预览显式禁用开发代理；陪练 API、上传、Socket 均指向独立后端。创建数据库和启动后台前先探测 API 端口，已有监听时拒绝启动；完整应用等待 /api/health 后开始验证。自管子进程最多等待 18 秒优雅退出，再强杀并等待 5 秒确认，确认失败保留数据库；清理入口同时核查本次 API PID，拒绝删除仍在使用的库。

测试 Vite 子进程单独设置 CI=true，禁用 Vite 默认 stdin EOF 退出路径；不改变 Playwright 的重试配置和生产服务环境。真实子进程回归关闭 stdin 后仍要求首页可访问。

稳定性入口默认 4173，仅接受 STABILITY_PORT；忽略继承的开发 PORT、DATABASE_URL、origin 和上传目录。每轮强制新测试库，启动前探测端口，等待 health/ready 后才开始浏览器流程；真实重启回归单独复用已创建的测试库。
