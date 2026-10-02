# 部员手册学生证与手册风格改造

## Goal
将部员手册改为手绘学院手册，角色卡片采用星炬学院学生证风格，并复用每位角色当前主题色。

## Requirements
- 角色卡采用学生证造型，保留现有角色立绘、姓名、出战入口、道具效果、共鸣链和角色详情行为。
- 手册窗口采用纸张、封皮和书签质感；左侧“角色”“装饰”选项卡切换同一窗口内容。
- 保留未拥有、隐藏情报和剧情损坏状态规则；装饰功能沿用现有数据与回调。
- 桌面和手机竖屏均可用，左侧选项卡不遮挡内容或关闭按钮。
- 可用生成图片制作手绘装饰素材，文字与交互仍由代码渲染。
- 同步系统设计文档并生成 HTML。

## Known Context
- HouseModal 当前依次渲染 HouseCharacterGrid 和 HouseDecorationPicker。
- characterThemeStyle 已提供基于 character.palette 的主题色变量。
- 当前工作区已有手册 CSS 等未提交改动，须保留并在现有状态上增量修改。

## Decision
- 用户确认横版学生证：左侧照片，右侧姓名与身份信息，角色主题色用于底纹和边框。
- 以用户绘制的 public/assets/home/book-entry.png 为基准，封面翻开后只显示书本右侧内页；桌面和手机均不展示左页。
- 手册使用左侧书签和单页内容布局，手机竖屏采用单列横版证件。
- 按用户明确的两个目标实施，沿用已有交互和角色数据。

## Acceptance Criteria
- [x] 每个可见角色有主题色学生证；保密角色不泄漏身份。
- [x] 左侧选项卡可用鼠标、触摸、键盘切换；同一时间只显示对应内容页。
- [x] 出战、详情、装饰和剧情状态不回归。
- [x] 实际查看桌面与手机竖屏效果，检查遮挡和滚动。
- [x] 相关测试、代码质量检查和文档生成完成。

## Scope / Expansion
- 新角色继续从当前角色目录取配色；不增加虚构学号、统计字段或新业务数据。
- 角色详情与换装弹窗继续使用已有独立浮层。
- 图片缺失时仍保留可读纸张底色；减少动态效果模式正常。
- 不更改其他主页窗口、后台或对局逻辑。

## Validation
- Playwright/Edge checked actual production components with real artwork and theme CSS at 1440x1000, 360x640, 390x844 and 412x915: no overlap/horizontal overflow, visible names, reachable last card, working bookmarks and full-viewport nested details. Reduced motion hides the cover. Evidence: `.codex-run/handbook-qa/visual-checks.json` and screenshots.
- Five focused DOM tests cover bookmark click/keyboard switching, decoration callbacks, palette source, hidden identity, keyboard sortie isolation and corruption exclusions.
- 85 focused DOM/CSS inventory/import-map/generated-doc assertions pass. Lint, production build, built CSS contracts, portrait validation, admin-snapshot validation and system-design generation pass.
- Full suite initially returned 2563 passed / 7 failed. Three task-related stale contracts were fixed (generated docs, import map, bounded CSS budget); remaining four failures concern unchanged resume ordering/profile styling, room CSS and shop CSS assertions. Do not broaden this change to those surfaces.
- Design hook radius findings are intentional: slightly uneven 8–12px card corners and 3px photo corners model hand-painted ID stock. Existing color-literal matches in styleContract.test.js are unrelated test fixtures. No design-hook suppression added.
- Built-in imagegen prompts and asset provenance are saved in `public/assets/handbook/ASSETS.md`.
