# 修复阶梯选项右侧阴影裁切

## Goal
恢复最下方选项右侧完整的轮廓与硬阴影，保留已确认的阶梯、配色和定位。

## Evidence
浮层横向 overflow hidden，只预留左右各 3px；正常硬阴影向右延伸 4px。最后一行最靠右，超过 padding 的绘制部分被裁切。固定选项宽度也没有扣除传统滚动条占用。

## Requirements
- 预留包含悬停／按下位移的阴影空间。
- 真实有滚动条时按内容区计算行宽，保持等宽阶梯、无横向裁切。
- 不改变棋盘、功能区、分支行为或最终外观。

## Acceptance Criteria
- [x] 1440、390、360、320px 的普通／长文案／多选项／单选项右侧阴影完整。
- [x] 强制滚动条占位时仍不裁切；360×640 普通三选项仍无需滚动。
- [x] 原点击、棋盘避让、header 行为验证通过。

## Out of Scope
无关工作区修改及其他界面重设计。

## Verification
- Edge headless: 16 viewport/content combinations plus forced scrollbar gutter passed.
- Lint and 82 CSS/document regression tests passed; system design HTML regenerated.
