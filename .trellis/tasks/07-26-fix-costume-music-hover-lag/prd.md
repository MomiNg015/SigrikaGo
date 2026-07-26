# 修复服装与音乐按钮悬停卡顿

## Goal

消除部员手册中服装卡片“装扮”按钮和角色 BGM 播放按钮接近一秒才出现悬停反馈的问题，同时保持现有颜色、位移、按压反馈和交互行为不变。

## Requirements

- 保留两个按钮现有的悬停位移、配色、阴影和按压视觉。
- 阻止全局终端按钮规则在非 Bright School 环境为这两个局部控件额外施加昂贵的悬停 `filter`。
- 为服装装扮按钮补充与现有播放按钮一致的、仅针对 `transform` 的合成提示。
- 在 Bright School 下把音乐播放键的绿色悬停键面预绘到局部伪元素，并仅以 `opacity` 显示；服装装扮按钮通过局部绘制隔离限制背景与阴影重绘范围。
- 不改动服装装备请求、音乐播放逻辑、弹窗层级或背景模糊视觉。
- 增加样式契约测试，防止全局 `filter` 再次污染这两个按钮。

## Acceptance Criteria

- [x] 装扮按钮悬停仍保持原视觉反馈，但计算样式不再进入亮度/饱和度滤镜过渡。
- [x] 播放按钮悬停仍保持 `translateY(-1px)` 反馈，但不再进入全局滤镜过渡。
- [x] 装扮按钮声明 `will-change: transform`，不预声明不需要的属性。
- [x] 两个按钮的点击、禁用和按压行为不变。
- [x] 相关样式测试通过，项目 lint 通过。
- [x] 若现有系统设计分篇记录了悬停性能约定，则同步更新并重新生成 `docs/system-design.html`。

## Definition of Done

- 只修改相关样式、契约测试和必要文档。
- 不覆盖或提交工作区中已有的其他未提交内容。
- 完成目标测试、lint 和适当范围的构建/文档验证。

## Technical Approach

在两个语义所有者选择器上显式设置 `filter: none`，隔离非 Bright School 环境的全局终端滤镜；保留局部 `transform` 规则。Bright School 已通过最终按钮层固定 `filter: none !important`，因此播放键预绘绿色悬停键面并以 `opacity` 合成显示，同时保持原有位移、颜色和阴影。`.character-costume-equip-button` 使用 `contain: paint` 限制重绘范围，并增加 `will-change: transform` 避免首次悬停临时提升图层。通过样式契约测试锁定该边界，不扩大到所有弹窗按钮。

## Decision (ADR-lite)

**Context**: 全局按钮动效将 `filter` 应用于所有按钮；两个目标控件又位于全屏 `backdrop-filter` 弹窗合成环境中，导致小范围悬停触发昂贵合成。

**Decision**: 对两个已确认卡顿的语义控件做局部滤镜隔离；Bright School 播放键将绿色悬停键面改为预绘后的 opacity 合成，装扮按钮则使用 paint containment 和 transform 合成提示。

**Consequences**: 动效外观保持不变，修改范围小；其他尚未报告的弹窗按钮不在本次任务中一并重构。

## Out of Scope

- 重构全局按钮动效系统。
- 移除或改变全屏弹窗背景模糊。
- 调整服装、音乐业务逻辑。
- 处理其他未确认卡顿的按钮。

## Technical Notes

- 全局污染来源：`src/styles/hud-components/pop-tech-terminal/interactive-motion.css`
- 服装按钮所有者：`src/styles/modals/character-opening/costume-wardrobe.css`
- 播放按钮所有者：`src/styles/modals/character-music-player/shell-title.css`
- 全屏模糊层：`src/styles/modals/terminal-system/replay-profile-surfaces.css`
- 运行时确认两个按钮均继承全局 180ms 过渡属性列表；Bright School 的最终按钮层已将实际 `filter` 值固定为 `none !important`，但悬停键面仍直接改变背景/阴影。播放按钮已有 `will-change: transform`，装扮按钮没有。
