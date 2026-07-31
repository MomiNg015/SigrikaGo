# Journal - Moming (Part 2)

> Continuation from `journal-1.md` (archived at ~2000 lines)
> Started: 2026-07-23

---



## Session 61: Polish replay practice watch and shop UI

**Date**: 2026-07-23
**Task**: Polish replay practice watch and shop UI
**Branch**: `codex/human-vs-ai`

### Summary

Removed terminal replay/result copy, expanded Zhunshibao entry, fixed its hover transform at the final theme owner, added watch-mode room counts and tab typography, renamed the practice rank, enlarged Zahira dialogue, updated specs/docs, and passed npm run check.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `39f48a7b` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 62: Align Zhunshibao practice entry shadow

**Date**: 2026-07-23
**Task**: Align Zhunshibao practice entry shadow
**Branch**: `codex/human-vs-ai`

### Summary

Matched the Zhunshibao practice badge to the Bright School home utility hard-shadow contract for rest, hover, focus, and active states; added regression coverage, updated CSS debt baseline, specs, and system design, and passed npm run check.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `f2e37c98` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 63: 桌面端主界面零视觉性能优化与登录后资源预载

**Date**: 2026-07-23
**Task**: 桌面端主界面零视觉性能优化与登录后资源预载
**Branch**: `codex/human-vs-ai`

### Summary

保留现有视觉和动效，拆分主界面位移与滤镜合成层并稳定路由；登录后加载页以 6 并发预载当前账号可访问的大部分图片、音乐与角色音声，保留单资源超时和房间/回放资源按需加载；npm run check 全量通过。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `58e3001f` | (see git log) |
| `78110ec0` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 64: 修复首页模式与准时宝陪练启动无响应

**Date**: 2026-07-23
**Task**: 修复首页模式与准时宝陪练启动无响应
**Branch**: `codex/fix-practice-start`

### Summary

修复 HomeRoute memo 边界对 onStartMatch、onStartPractice、onLogout、onSelectCharacter 的属性命名断链；新增三种匹配、准时宝陪练、退出与角色选择的回调透传回归测试，保留首页渲染稳定化，并通过 2148 项测试和完整质量门禁。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `15e951c0` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 65: Add Lynae rainbow candy story and voice effect

**Date**: 2026-07-23
**Task**: Add Lynae rainbow candy story and voice effect
**Branch**: `master`

### Summary

Added Lynae accepted/rejected rainbow candy story, 35 percent rejection handling, persistent contrary-voice effect with deterministic event swaps, valid-game cleanup and result snapshot, deployment snapshot, tests, and system design documentation.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `439df835` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 66: Allow Rainbow Candy On Lynae

**Date**: 2026-07-23
**Task**: Allow Rainbow Candy On Lynae
**Branch**: `master`

### Summary

Fixed the warehouse candy target whitelist drift by sharing supported target rules across frontend and backend, added Lynae target regression coverage, synchronized the candy contract and system-design docs, and passed the full project check.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `da66d4ae` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 67: Costume portrait calibration and dynamic shop stage

**Date**: 2026-07-24
**Task**: Costume portrait calibration and dynamic shop stage
**Branch**: `master`

### Summary

Added persisted costume portrait framing across admin, rooms, results and replays; replaced the costume shop fixed slots with Zahira's measured count-aware layout and whole-card rotation/float motion; updated tests, specs, and system design docs.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `72702e97` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 68: Normalize character portrait assets

**Date**: 2026-07-24
**Task**: Normalize character portrait assets
**Branch**: `codex/normalize-character-portraits`

### Summary

Added catalog-driven 900x900 portrait normalization, migrated built-in character and costume URLs safely, and added validation, tests, and system-design documentation.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `89b899d4ceb7b4d748ab80b8ae935bf5981239ef` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 69: Preserve Denia candy portrait animation

**Date**: 2026-07-24
**Task**: Preserve Denia candy portrait animation
**Branch**: `codex/normalize-character-portraits`

### Summary

Restored the 16-frame Denia candy WebP and made portrait normalization preserve animated frame geometry, timing, loops, and required-animation validation.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `9114100d` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 70: Polish costume shop purchase flow

**Date**: 2026-07-24
**Task**: Polish costume shop purchase flow
**Branch**: `codex/frontend-chores`

### Summary

Unified Residual Star costume details with Zahira's structure, added success-only equip confirmation, preserved both shop mascots' feedback until explicit actions, brightened price tags, and validated desktop/mobile behavior.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `a86b83e6` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 71: 修正服装详情与后台保存

**Date**: 2026-07-24
**Task**: 修正服装详情与后台保存
**Branch**: `codex/frontend-chores`

### Summary

统一残星会服装详情标签、价格布局和深红金色配色；修复后台服装编辑器误用角色 slug 字段导致保存失败，并补充交互、服务端测试与系统设计文档。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `b58054a9` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 72: Zahira shop crayon backgrounds

**Date**: 2026-07-25
**Task**: Zahira shop crayon backgrounds
**Branch**: `codex/frontend-chores`

### Summary

Added independent desktop and portrait mobile crayon backgrounds for Zahira shop, a Zahira-only header treatment, runtime preload registration, responsive CSS contracts, browser QA, tests, and system-design documentation.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `d4185bd7` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 73: Fractsidus costume shop crayon backgrounds

**Date**: 2026-07-26
**Task**: Fractsidus costume shop crayon backgrounds
**Branch**: `codex/frontend-chores`

### Summary

Researched Fractsidus visual language, generated and integrated independent desktop/mobile deep-red crayon stage backgrounds, registered preload assets, fixed Bright School mobile background specificity, and verified 1440x900, 375x812, and 375x600 layouts plus the full repository check.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `234ccc54` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 74: Style Fractsidus shop header

**Date**: 2026-07-26
**Task**: Style Fractsidus shop header
**Branch**: `codex/frontend-chores`

### Summary

Added a deep-red crayon curtain header for the Fractsidus costume shop, preserved 44px mobile controls, added CSS contracts, synced system design docs, and visually verified desktop plus portrait layouts.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `20b232c1` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 75: Simplify Zahira shop header and align mobile controls

**Date**: 2026-07-26
**Task**: Simplify Zahira shop header and align mobile controls
**Branch**: `codex/frontend-chores`

### Summary

Replaced Zahira's scene-like header crop with a simple blue-gray to muted-purple color band, fixed the portrait close button to share the refresh button grid center, added CSS contracts, synchronized system-design docs, and verified desktop plus 375x812/375x600 layouts.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `d3074297` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 76: Fill shop side gutters

**Date**: 2026-07-26
**Task**: Fill shop side gutters
**Branch**: `codex/frontend-chores`

### Summary

Removed inherited stable both-edge scrollbar gutters from the fixed shop shell, added regression contracts, verified both stores on desktop and portrait mobile, and synchronized system design docs.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `1ee943db` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 77: 商店切换路标按钮

**Date**: 2026-07-26
**Task**: 商店切换路标按钮
**Branch**: `codex/frontend-chores`

### Summary

将扎希拉与残星会商店切换按钮改为左右镜像的蜡笔木制路标，精简店名文案，补齐移动端触控尺寸、主题与 CSS 契约测试，并同步系统设计文档。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `cf2e3a04` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 78: 统一角色语音响度并修复准时宝 TTS

**Date**: 2026-07-26
**Task**: 统一角色语音响度并修复准时宝 TTS
**Branch**: `codex/audio-work`

### Summary

批量校准 187 条角色语音，补齐仇远静态系统语音，移除运行时 RMS 修正，并让无角色的准时宝读秒保持独立 zh-CN TTS 身份而不回退到西格莉卡。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `00d579c2` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 79: Use GNU Go for Zhunshibao difficulty tiers

**Date**: 2026-07-29
**Task**: Use GNU Go for Zhunshibao difficulty tiers
**Branch**: `codex/zhunshibao-ai`

### Summary

Replaced custom practice move selection with a local single-slot GNU Go GTP adapter, retained beginner/intermediate/advanced UI tiers at engine levels 1/5/10, added readiness and deployment checks, documented the runtime contract, and covered engine failures without a homemade fallback.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `8a221237` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 80: 修复 Windows 本地 GNU Go 发现

**Date**: 2026-07-29
**Task**: 修复 Windows 本地 GNU Go 发现
**Branch**: `codex/zhunshibao-ai`

### Summary

Windows 后端现按环境变量、用户目录、Program Files 和 PATH 发现 GNU Go；本机 GNU Go 3.8、GTP 落子、适配器测试、构建和生产配置均已验证。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `a0ff470b` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 81: Restore beginner Zhunshibao practice heuristic

**Date**: 2026-07-29
**Task**: Restore beginner Zhunshibao practice heuristic
**Branch**: `codex/zhunshibao-ai`

### Summary

Restored the original local heuristic for public beginner practice while keeping GNU Go for intermediate and advanced, updated the difficulty dialog copy, added strategy-specific coverage, and synchronized system and deployment documentation.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `2e523317` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 82: 修复生产部署样式与后台同步

**Date**: 2026-07-30
**Task**: 修复生产部署样式与后台同步
**Branch**: `master`

### Summary

修复生产构建弹窗遮罩模糊，增加构建 CSS 合同检查；在后台默认快照同步前执行幂等 SQLite schema 兼容；刷新角色 illust 与服装后台默认快照，并更新部署文档和系统设计。完整 npm run check 通过。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `0fac40ff` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 83: Loading and spectator polish

**Date**: 2026-07-30
**Task**: Loading and spectator polish
**Branch**: `master`

### Summary

Fixed tutorial loading progress initialization, removed Baconbits from shared loading screens, and corrected spectator mode count spacing and badge shape.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `c3ff926e` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 84: Polish spectator tabs and leaderboard ranks

**Date**: 2026-07-31
**Task**: Polish spectator tabs and leaderboard ranks
**Branch**: `codex/frontend-work`

### Summary

Made the watch-list mode wrapper transparent, centered tab contents, removed leaderboard rank-number fills across Bright School desktop/mobile winners, and added tests, browser QA, specs, and system-design updates.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `2013d1df` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 85: Fix pending skill state leaking across rooms

**Date**: 2026-07-31
**Task**: Fix pending skill state leaking across rooms
**Branch**: `codex/frontend-work`

### Summary

Scoped the client pending-skill targeting draft to room code and role, cleared it before resign actions, added hook and resignation regressions, and synchronized the state-management spec and system design.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `50f44288` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 86: Simplify utility window headers

**Date**: 2026-07-31
**Task**: Simplify utility window headers
**Branch**: `codex/frontend-work`

### Summary

Removed warehouse and leaderboard header icon/subtitle chrome, added the Social System friends header, made the friends tab wrapper transparent and borderless, and updated responsive CSS, regression tests, and system-design contracts.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `09e40462` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 87: Tint Bright School social and record cards

**Date**: 2026-07-31
**Task**: Tint Bright School social and record cards
**Branch**: `codex/frontend-work`

### Summary

Applied distinct mist-blue and wheat Bright School card surfaces for social users and character records, darkened positive record text for WCAG AA contrast, added theme contract coverage, and synchronized system design docs. Lint, 2298 tests, CSS inventory, portrait checks, build, built CSS contracts, and production config passed; the broad gate remains blocked only by an unrelated stale siteSettings admin snapshot.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `6976a8b5` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 88: 统一履历与用户详情面板配色

**Date**: 2026-07-31
**Task**: 统一履历与用户详情面板配色
**Branch**: `codex/frontend-work`

### Summary

Bright School 履历与用户详细信息共用统计卡配色，并统一两处角色战绩卡的浅麦黄与正向数值色；补充主题合同、前端规范和系统设计文档。自动化测试、lint、构建、产物 CSS 与生产配置通过；总门禁仅被既有 siteSettings 后台快照漂移截断。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `aec73d4d` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 89: 角色主题色战绩卡

**Date**: 2026-07-31
**Task**: 角色主题色战绩卡
**Branch**: `codex/frontend-work`

### Summary

履历与用户详情的角色战绩卡统一读取当前角色目录 palette，以 18% 混白生成浅色卡面；补齐数组角色目录查找、可读性颜色、主题契约测试及系统设计文档。lint、构建、2299 项测试、构建 CSS 合同和生产配置检查均通过；完整门禁仅被既有 siteSettings 管理快照漂移中断，未改动该无关快照。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `9f8934c5` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 90: 修复积分说明气泡文字溢出

**Date**: 2026-07-31
**Task**: 修复积分说明气泡文字溢出
**Branch**: `codex/frontend-work`

### Summary

修复履历积分与段位问号气泡继承统计卡 word-break: keep-all 后中文整句越界的问题；气泡显式恢复正常换行并保留极端长串应急断行，补充同规则块回归断言、前端规范及系统设计。135 项聚焦测试和完整 2299 项测试通过，lint、生产构建、构建 CSS 合同、生产配置与文档生成通过；完整门禁仅被既有 siteSettings 管理快照漂移中断，未改动该无关快照。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `e4f3e847` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete
