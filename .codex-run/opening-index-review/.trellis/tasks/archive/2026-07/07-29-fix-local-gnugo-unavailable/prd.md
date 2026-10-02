# 修复本地 GNU Go 引擎不可用

## Goal

让 Windows 本地开发环境可以使用与生产一致的成熟 GNU Go 3.8 引擎启动准时宝三档陪练，避免当前 `practice_engine_unavailable` 提示，同时继续禁止自研落子兜底。

## What I already know

- 截图中的错误来自 `practice:start` 对 `practiceBotEngine.ensureAvailable()` 的真实可用性探测。
- 当前 Windows 机器找不到 `gnugo.exe`，只有 `winget` 可用；`winget search gnugo` 没有结果。
- 当前 WSL 2 因 BIOS/UEFI 虚拟化未启用而不可用，不能借用 Ubuntu 的 `/usr/games/gnugo`。
- 生产仍应通过 Ubuntu 官方 `gnugo` 包和 `/usr/games/gnugo` 运行。
- GNU 官方下载页只提供 3.8 源码，并把 Windows 用户指向 Ben Lambrechts 的 Windows 编译包。
- 该 Windows ZIP 通过 HTTP 提供，包含 `gnugo.exe`、三个 Cygwin DLL、GPL `COPYING` 和 README；当前下载文件 SHA-256 为 `6E9EF11623CDD5D8D581F6433337D93B1BC60435EA4F04A1F58D6DF35308281E`。

## Confirmed Scope

- 修复当前这台 Windows 本地开发机，并让后端自动识别约定的用户目录。
- 用户自行扫描、解压 GNU 官方页面推荐的第三方 Windows 编译包；项目不提供下载或安装脚本。
- 不在 Git 中提交第三方可执行文件或 DLL。

## Requirements (evolving)

- Windows 本地安装不能改变生产 Linux 的 `/usr/games/gnugo` 默认路径与部署预检。
- 引擎仍使用 GNU Go 3.8、GTP、level 1/5/10 和现有合法点白名单。
- 不允许恢复自研启发式、UCT 或随机走法兜底。
- 不把引擎二进制提交到仓库。
- 安装由开发者显式手动完成，不能在 `npm install` 中静默下载并执行二进制。
- 约定的本地目录是 `%LOCALAPPDATA%\SigrikaGo\practice-engine\gnugo-3.8\gnugo.exe`。
- 本地引擎路径必须可通过 `PRACTICE_ENGINE_PATH` 覆盖。

## Acceptance Criteria (evolving)

- [x] 当前 Windows 环境手动安装后，GNU Go `--version` 成功。
- [x] 本地后端能解析并探测用户目录中的 GNU Go，三档练习可创建房间。
- [x] Linux 默认路径和生产更新脚本行为不变。
- [x] 测试覆盖 Windows 默认路径解析和环境变量优先级。
- [x] 文档说明 Windows 本地安装位置与覆盖方式。

## Definition of Done

- Tests added/updated for engine path resolution.
- Lint, focused tests, build, production-config checks, and system-design docs pass.
- `docs/system-design.md`、对应分篇和生成 HTML 同步。
- Unrelated IRIS/font work remains unstaged and uncommitted.

## Out of Scope (explicit)

- 把 GNU Go 二进制或 Cygwin DLL 提交到 Git。
- 自动执行不经确认的下载或安装。
- 改用 `gnugo.js`；该包装没有现有 GTP/`restricted_genmove`/三档 level 合同。
- 安装 Visual Studio/CMake 并从源码构建 GNU Go。
- 改变准时宝三档强度、提子阈值或界面。

## Decision (ADR-lite)

**Context**: Windows 本机没有 GNU Go，`winget` 无包，WSL 因虚拟化关闭不可用；从 GNU 官方源码构建需要额外安装大型编译工具链。

**Decision**: 用户自行扫描并解压 GNU 官方下载页推荐的 Windows 3.8 编译包到 `%LOCALAPPDATA%\SigrikaGo\practice-engine\gnugo-3.8`，项目不维护第三方下载器。服务端按“显式环境变量 → 约定用户目录 → 常见 Program Files → PATH”解析 Windows 引擎；Linux 继续使用 `/usr/games/gnugo`。

**Consequences**: 本地二进制与风险确认留在用户机器且不污染 Git；项目只维护可测试的路径解析合同，不承担 HTTP 下载、杀毒软件调用或第三方包分发。安装不会进入 `postinstall`。

## Technical Notes

- Runtime adapter: `server/practiceBotEngine.js`
- Practice contract: `.trellis/spec/backend/practice-room-contract.md`
- Local env: `.env` / `.env.example`
- Production: `deploy/update-production.sh`, `docs/deployment.md`
- Research: `research/windows-gnugo-runtime.md`
