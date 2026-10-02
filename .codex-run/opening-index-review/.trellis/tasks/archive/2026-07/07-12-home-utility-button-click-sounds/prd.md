# 为首页功能按钮添加专属点击音效

## Goal

将用户提供的五个 MP3 音效转换为 OGG，并分别用于首页铭牌（履历）、仓库、观战、好友、排行入口，让这些入口拥有与功能语义对应的即时听觉反馈。

## Requirements

- `lvli.mp3` 转换后用于点击首页铭牌并打开履历。
- `cangku.mp3` 转换后用于点击仓库入口。
- `guanzhan.mp3` 转换后用于点击观战入口。
- `haoyou.mp3` 转换后用于点击好友入口。
- `paihang.mp3` 转换后用于点击排行入口。
- OGG 文件放入现有 `public/assets/music/` 音效目录并使用稳定的 UI 资源命名。
- 播放必须复用现有 `sfx` 通道，遵循用户音效音量与静音设置。
- 专属音效入口继续使用 `data-ui-sound="none"`，避免与全局通用确认音叠放。
- 将新音效加入现有预加载资源表，避免首次点击才开始解码造成明显延迟。
- 保留现有按钮结构、视觉样式、点击范围和导航行为不变。
- 后续需求：将用户提供的 `LXGWMarkerGothic-Regular.ttf` 内置到项目，仅用于首页主标题和各窗口标题。
- 标题字体必须通过独立语义 token 应用，不改变副标题、正文、按钮和数据字体，并在 Bright School 后置字体重置后仍然生效。

## Acceptance Criteria

- [x] 五个源 MP3 均生成可识别的 OGG 文件。
- [x] 点击铭牌、仓库、观战、好友、排行时各播放对应 OGG，且原有弹窗/页面仍正常打开。
- [x] 音效受现有 `sfx` 音量和静音控制。
- [x] 新资源进入首页启动预加载集合。
- [x] 自动化测试覆盖资源路径、播放路由与专属入口的防重复播放契约。
- [x] `docs/system-design.md`、相关音频分篇（若有）和生成的 `docs/system-design.html` 同步。
- [x] 首页主标题和窗口标题使用霞鹜漫黑，其他文本字体保持不变。
- [x] 字体资源、语义 token、Bright School 最终覆盖和系统设计文档均有自动化契约覆盖。

## Definition of Done

- 相关单元测试通过。
- lint、类型检查或项目等价质量门通过。
- `npm run docs:system-design` 成功生成文档。
- 不包含工作区中既有的无关改动。

## Technical Approach

在 `src/shared/audioAssets.js` 登记五个稳定资源常量，在 `src/audio/effectPlayback.js` 提供对应播放函数并由 `src/audio/playback.jsx` 统一导出。`AppRoutes` 在打开各入口前调用专属播放函数；铭牌保持既有回调链，通过 `onOpenResume` 获得履历音效。资源登记到 `src/shared/assetRegistry.js`，由现有启动预加载流程加载。

## Decision (ADR-lite)

**Context**: 项目已经有统一的 WebAudio/HTMLAudio 回退播放层和全局交互音效抑制标记。

**Decision**: 扩展现有 UI SFX 资产与播放函数，不在按钮组件内新建 `Audio` 实例，也不增加视觉或动画变化。

**Consequences**: 音效继续继承统一音量、缓存、回退与预加载行为；新增入口需在音频资源表与测试中保持映射一致。

## Out of Scope

- 不替换招募、商店、部员手册或匹配按钮的现有专属音效。
- 不调整按钮样式、布局、动效或导航结构。
- 不编辑源 MP3 文件。

## Technical Notes

- 首页入口：`src/home/components/PlayerPlaque.jsx`、`src/home/components/HomeUtilityDock.jsx`。
- 路由打开回调：`src/app/AppRoutes.jsx`。
- 现有音频层：`src/shared/audioAssets.js`、`src/audio/effectPlayback.js`、`src/audio/playback.jsx`。
- 预加载入口：`src/shared/assetRegistry.js`、`src/shared/preloadAssets.js`。
- `ui-ux-pro-max` 的搜索脚本在本机安装中是指向缺失相对目录的占位文件，因此本次按该技能的交互与性能清单执行，不生成新的设计系统文件。
