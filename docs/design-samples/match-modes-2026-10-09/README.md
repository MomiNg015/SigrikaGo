# 对弈模式分层改版

已按用户选定的第三种逐页交互接入现有窗口。保留标题贴纸、卡片、水印、陪练、选角及规则说明。

- 星炬对弈：常规匹配、吃子挑战赛、队际赛。
- 标准对弈：常规匹配。
- 玩些别的：来下五子棋吗？。

点击大模式只展开子模式；选择角色后点击子模式发起原有匹配。返回和 Escape 回到对应大模式并恢复焦点。标准和五子棋保留各自选角缓存；侵蚀剧情仍锁定普通模式。

桌面及390px、320px竖屏均验证全部入口、选角要求、真实回调参数、返回焦点和减少动态设置，见 [results.json](./production/results.json)。小屏五子棋标题为单行缩放，标准匹配规则按钮在上方留出主卡片点击区域。

| 尺寸 | 大模式 | 星炬对弈 | 标准对弈 | 玩些别的 |
| --- | --- | --- | --- | --- |
| 桌面 | [截图](./production/1440-categories.png) | [截图](./production/1440-spark.png) | [截图](./production/1440-standard.png) | [截图](./production/1440-gomoku.png) |
| 手机 | [截图](./production/390-categories.png) | [截图](./production/390-spark.png) | [截图](./production/390-standard.png) | [截图](./production/390-gomoku.png) |
| 小屏 | [截图](./production/320-categories.png) | [截图](./production/320-spark.png) | [截图](./production/320-standard.png) | [截图](./production/320-gomoku.png) |

静态探索页面已撤下，原三方向截图保留为历史设计记录。正式代码不导入样板脚本或样板CSS。

验证：70项相关组件测试、57项样式契约测试、项目lint与生产构建通过。手机全名单选角的姓名适配／阴影断言在已有工作区中失败；本次未修改选角卡片的姓名或阴影实现。模式导航、独立缓存、选角和匹配参数通过专项浏览器验证。

设计检查对 HomeScreen.test.jsx 的旧HUD颜色字面量属于既有主题断言的上下文误报；本次未新增主题颜色或检查豁免。
