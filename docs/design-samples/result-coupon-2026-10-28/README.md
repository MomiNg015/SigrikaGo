# 对局结算星炬券

使用真实 `ResultModal`、完整生产 CSS 和现有结算样板的模拟数据展示。图片为浏览器直接截图。

- [桌面胜利 +50](./result-win-desktop.png)
- [手机胜利 +50](./result-win-mobile.png)
- [手机失败 +20](./result-loss-mobile.png)
- [检查数据](./verification.json)

修复：原先 `.result-rewards span` 把卡片边框及内边距施加到券图内部容器，使 28px 图标实际只剩约 6px；现在三个相关选择器仅匹配直接子项。没有修改图片、奖励规则或服务端数值。

`verify.mjs` 导出 `verifyResultCoupon(page, base)`，供已有 Playwright page 执行尺寸、胜负、320px 窄屏及返回／退出验证并刷新截图。零奖励由 ResultModal DOM 回归覆盖。

验证通过：7 个测试文件共 164 项测试、lint、生产构建与构建 CSS 检查。浏览器 4 组尺寸／状态检查及两种退出操作通过，无页面错误。原图在全部场景中显示为 28×25.25px，内部容器无边框和内边距。

设计钩子报告的 58 个颜色项均为这三个旧样式文件原有配色；本次 diff 只修改选择器，不添加颜色。按本次范围归为既有主题的误报，保留原色，不添加忽略配置。
