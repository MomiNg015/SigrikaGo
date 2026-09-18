# 履历窗口布局精简与按钮调整

## Goal
按用户四项要求精简自己的履历窗口，保留现有校园主题与资料功能。

## Requirements
- 个性化移至页头成就与金币之间，匹配紧凑按钮尺寸；页头适度增高，关闭按钮保持方形。
- 回放改为总对局卡片右侧图标按钮，保留可访问名称与提示。
- 去掉最近十盘小标题；桌面卡片撑满所在行，与左侧统计卡片组等高，竖屏保持紧凑高度。
- 最近十盘的胜负标记整体水平居中，少于十盘与暂无状态也居中；竖屏保持单行。
- 去掉角色战绩标题，保留六列表头对齐与独立滚动。
- 仅 self context 变动；social context 保持原布局。桌面及竖屏均适配。

## Acceptance
- 上述布局在桌面与 360/390/412px 竖屏无溢出；原有按钮回调、模式切换正常。
- 更新既有测试、系统设计并生成 HTML；保留其他未提交工作。

## Technical Notes
使用 ResumeModal、ProfileResumeView 及最终 window-sticker-resume-header.css owner。无新依赖或数据行为变化，无阻塞问题。

## Validation
- 105 related tests passed (ResumeModal, UserProfileCard, HouseModal, WindowTitleSticker, styleContract).
- Full lint, production build and built CSS contracts passed. Build reports asset-placeholder and chunk-size warnings outside this layout scope.
- Real ResumeModal with fixture profile data and production CSS checked in headless Chromium at 1440x1000, 360x800, 390x844 and 412x915: no document overflow; close control 44x44; replay inside total-games card; recent card 52px on portrait; character scroller retains 129px at 360x800.
- Own-profile portrait columns use 44/12/8/8/8/20 percent with 8px card side padding. Social profile unchanged.
- Implementation remains uncommitted alongside existing unrelated work.
