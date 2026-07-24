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
