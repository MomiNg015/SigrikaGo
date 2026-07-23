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
