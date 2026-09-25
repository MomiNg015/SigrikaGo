# 赛事进场动画与说明选角完善

## Goal
完成用户列出的五项要求，并验证工作区已有实现的真实渲染。

## Requirements
- 吃子挑战赛首次匹配播放双方进场对决；尊重开局截止时间、失败回退及重连不重播。
- 吃子挑战赛说明：100手内尽可能吃掉准时宝的棋子吧！吃得越多排名越高！
- 队际赛说明：挑选3位部员，进行一盘棋接力3个阶段的紧张刺激的队际赛！
- 两张子卡桌面悬停、移动端右侧角标点击显示说明，点击角标不进入匹配。
- Round 下一行显示 (0-40手)、(41-80手)、(81手-终局)。
- 队际赛选人窗口复用现有便签标题图片及文本回退。

## Findings and scope
工作区已有对应实现及标题素材；沿用并验证，不覆盖其他未提交工作。复用既有浮窗、立绘预加载和便签组件，不改规则或计分。不需要新增需求决策。

## Acceptance
- [x] 定向 DOM 与 socket 测试通过。
- [x] 浏览器验证桌面及 390/360 竖屏浮窗、标题与阶段区间。
- [x] 浏览器验证真实准时宝图片进场及截止退出。
- [x] 同步系统设计摘要并生成 HTML。

## Outcome
沿用已有五项功能实现，修正手机 tooltip 的 legacy nowrap 覆盖、队际赛便签定位基准，以及背景网格 min-content 宽度造成的 2px 横向滚动。保留现有序号徽章配色，设计钩子的两项色值提示属于既有设计，不增加豁免配置。

## Validation
- npm run lint passed.
- Seven targeted Vitest files: 154 tests passed (opening/socket/home/preload/style contracts).
- Six production-built browser component checks passed at 1280x900, 390x844 and 360x640; screenshots inspected.
- docs:system-design regenerated HTML. Browser fixtures do not exercise authenticated live server matchmaking.
- No commit; pre-existing unrelated work preserved.
