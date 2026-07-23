# 统一准时宝与主页工具按钮阴影

## Goal

将对局模式选择中的“准时宝陪练”图片按钮阴影改成与主界面左下六个图片按钮一致的硬边手绘投影，消除当前柔和虚影造成的视觉不统一。

## Requirements

- Bright School 常态、悬停和键盘聚焦下，准时宝图片使用主页工具按钮的 `drop-shadow(6px 8px 0 rgba(61, 43, 37, 0.42))`。
- 按下状态使用主页工具按钮的 `drop-shadow(4px 5px 0 rgba(61, 43, 37, 0.34))`。
- 阴影规则归属现有最终效果层 `home-image-entry-buttons.css`，使用足以击败较早共享柔影的主题限定选择器。
- 不改变准时宝按钮尺寸、位置、7 度顺时针悬停旋转、可访问名称或快速开局行为。
- 桌面与移动端共用同一阴影合同。
- 同步系统设计文档并重新生成 HTML。

## Acceptance Criteria

- [x] 准时宝常态/悬停/聚焦的最终阴影参数与主页左下六个按钮完全一致。
- [x] 准时宝按下态的最终阴影参数与主页左下六个按钮完全一致。
- [x] 现有按钮级旋转合成规则仍保留，不把 transform 重新放回子图片。
- [x] CSS 合约测试和仓库质量门通过。
- [x] 与本任务无关的四个现有工作区改动不被覆盖或提交。

## Definition of Done

- 样式、测试、规范和系统设计文档同步完成。
- `npm run check` 通过。
- 本任务单独提交并归档。

## Technical Approach

- 在 Bright School 的最终图片入口效果层，把 `.practice-entry-button img` 纳入常态硬边阴影，并为 hover/focus/active 写出对应状态规则。
- 保留共享模态样式中的跨主题柔影作为非 Bright School 后备，不扩大主题影响范围。
- 扩展 HomeScreen/CSS 合约断言，防止后续主题层回退为模糊阴影。

## Decision (ADR-lite)

**Context**: 准时宝当前共享样式使用带模糊半径的柔影，而主页工具图片按钮在 Bright School 最终层使用零模糊硬边阴影。

**Decision**: 在同一个 Bright School 最终图片入口 owner 中为准时宝复用工具按钮的状态阴影参数，不修改共享跨主题基础样式。

**Consequences**: 当前主题获得一致视觉语言；未来主题仍可通过各自最终 owner 定义不同阴影。

## Out of Scope

- 不修改准时宝图片资源、大小、位置或旋转角度。
- 不调整主页六个工具按钮现有阴影。
- 不改变其他主题或其他模态图片按钮。

## Technical Notes

- 目标文件：`src/styles/themes/bright-school/effects/home-image-entry-buttons.css`。
- 现有共享后备：`src/styles/modals/replay-mode-resume/match-mode-tabs.css`。
- 现有视觉合约测试：`src/home/HomeScreen.test.jsx`、`src/styles/hudComponents.test.js`。
- 相关规范：`.trellis/spec/backend/practice-room-contract.md`、`.trellis/spec/frontend/css-architecture.md`。
