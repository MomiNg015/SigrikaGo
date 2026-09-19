# Journal - Moming (Part 3)

> Continuation from `journal-2.md` (archived at ~2000 lines)
> Started: 2026-09-19

---



## Session 121: Home grid and mobile match focus

**Date**: 2026-09-19
**Task**: Home grid and mobile match focus
**Branch**: `codex/campus-home-handbook-polish`

### Summary

Added a quiet hand-drawn grid and enlarged portrait match entry; compacted header and utility rows, preserved desktop geometry and bottom clearance. 168 focused tests, lint, build and built CSS passed; 360/390/412 browser overflow, scroll and click checks passed. Preserved unrelated bookmark task and local preview files.

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `4eed174e` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 122: 履历左侧书签选项卡

**Date**: 2026-09-19
**Task**: 履历左侧书签选项卡
**Branch**: `codex/campus-home-handbook-polish`

### Summary

仅履历接入左侧手绘模式书签，使用霞鹜字体并保留其他窗口原布局。验证桌面、窄桌面及320/390竖屏模式切换与末条战绩可达性。116项专项测试、lint、构建、资源和配置检查通过；全量2532项通过，1项已有商店测试误匹配首页CSS失败。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `226b906f` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 123: 履历书签接缝修整

**Date**: 2026-09-19
**Task**: 履历书签接缝修整
**Branch**: `codex/campus-home-handbook-polish`

### Summary

书签列右沿对齐窗口外边框，未选中尾端增加轻微暗部；桌面和390px竖屏视觉验证及切换通过，88项相关测试和定向lint通过。同步系统设计文档及HTML。保留未跟踪的.codex-run预览文件。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `00d0fbce` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 124: 履历手机窗口与书签比例

**Date**: 2026-09-19
**Task**: 履历手机窗口与书签比例
**Branch**: `codex/campus-home-handbook-polish`

### Summary

手机履历取消固定满屏高度，保留视口上限和正文滚动；书签加宽到58px，最小高度72px，间距8px。四条记录的476x1052预览收掉多余留白；320x568长列表末项可达，390x844边界和桌面横排正常。88项测试及定向lint通过，同步系统设计与HTML。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `d5d7fb7a` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 125: 履历书签轮廓加粗

**Date**: 2026-09-19
**Task**: 履历书签轮廓加粗
**Branch**: `codex/campus-home-handbook-polish`

### Summary

外轮廓从1.7改为2.5px并设置non-scaling-stroke，手机窄幅SVG保持清晰边线；内线与布局不变。桌面和390px竖屏预览通过，80项样式文档测试及定向lint通过，同步系统设计与HTML。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `145545ab` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 126: 修复懒加载子窗口导致履历闪隐

**Date**: 2026-09-19
**Task**: 修复懒加载子窗口导致履历闪隐
**Branch**: `codex/campus-home-handbook-polish`

### Summary

AppOverlays共用Suspense导致新窗口首次加载时隐藏履历；拆为每窗口独立边界。延迟模块解析的成就与个性化DOM回归测试先失败后通过，验证可见性、节点状态与layout effect保留；真实组件预览验证两种窗口打开关闭。63项相关测试、npm run lint、生产构建通过。同步架构文档及组件规范。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `244b2516` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 127: 玩家窗口手绘书签推广

**Date**: 2026-09-19
**Task**: 玩家窗口手绘书签推广
**Branch**: `codex/campus-home-handbook-polish`

### Summary

设置、成就、排行榜、观战、好友、首页详细资料、公告、招募接入共享左侧手绘书签。保留数量和未读点，手机招募长标签换列，排行榜统计换行并保证姓名列，详细资料窄屏操作两行。125项相关检查、lint、生产构建和构建后CSS通过；全量测试保留既有ShopModal CSS断言失败。已同步文档/规范并保留.codex-run本地预览。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `d4f3cde4` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete
