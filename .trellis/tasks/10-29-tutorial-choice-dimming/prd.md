# 调整引导对白位置与选项背景压暗

## Goal
移动端 NPC 头像与对白整体靠近 header；普通回答出现时，选项保持原亮度，其下界面统一压暗 20%。此要求取代此前取消回答压暗的决定。

## Requirements
- 手机对白顶部由对弈区域内 58px 改为 8px，约上移 50px；保留 header 间隔和原棋盘布局。
- 在选项容器内部增加覆盖视口的 20% 黑色背景层，位于选项下方、常规界面上方；无需给每个选项挖孔。
- 选项退出后背景层同时卸载，单独“继续”仍走原流程；剧情记录和退出确认仍可打开。
- 桌面对白、选项阶梯、硬阴影、滚动兜底和答题流程保持原行为。

## Acceptance Criteria
- [x] 手机头像／对白与 header 间距约 14px，不遮 header；桌面位置不变。
- [x] 回答期间棋盘、NPC、header 等压暗 20%，选项保持原亮度；选择后恢复。
- [x] 既有 16 组布局与分支／重试／继续检查通过。

## Out of Scope
无关加载、音频、设置和素材 WIP。

## Verification
- 16 desktop/mobile scenarios passed, including actual backdrop opacity/viewport/layer order and mobile header spacing.
- History/Escape/focus and exit/cancel work while replies are dimming the room.
- Lint and 106 targeted tests passed; system design HTML regenerated.
