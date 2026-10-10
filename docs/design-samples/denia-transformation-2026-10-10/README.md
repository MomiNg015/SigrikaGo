# 达妮娅 · 纸影变身

运行项目后打开 `/docs/design-samples/denia-transformation-2026-10-10/index.html`。预览复用正式 RoomScreen、SkillBanner、PlayerInfo 和棋盘；点击“释放技能”重播，“重置本局”恢复原图。没有真实账号或对局写入。

## 当前时序
- 0 ms：正常全身横幅入场。
- 1000 ms：参考用户小人截图制作的 SVG 纸片由左向右飞入。
- 1750 ms：密集段内切换两处立绘；主体覆盖窗口约 300 ms。
- 2500 ms：纸片清空；继续展示新立绘横幅。
- 3200 ms：横幅结束；棋盘技能保持原相对时序。正式泡泡翻子在 4240 ms 结算。

手机纸片高度 34–56 px、桌面 44–76 px。全身 PNG 原样采用用户附件；SVG 根据用户参考重新绘制。网络检索仅辅助确认角色主题，造型以用户截图为准。

## 性能与验证
密集主体预绘成纹理，每帧移动 8 条缓存图层，最多另画 64 张前景纸片，单 Canvas，无逐纸片 DOM 节点。Canvas 渲染尺寸限制在 1920×1200，DPR 不超过 1.5。减少动态效果不创建绘制上下文。

本机 Chrome 1440×900 测得初始化约 3.7 ms，180 次绘制的 CPU 提交耗时 P95 约 0.1 ms。4 倍 CPU 降速热缓存重播中，动画期间未记录超过 25 ms 的帧间隔；点击触发阶段有约 54 ms 长帧。冷加载另观察到长帧，故这些数据不能证明所有手机均无掉帧，也不等同于 GPU 完成耗时。首屏现有资源预载包含两项新素材。

完整对局截图：`reveal-desktop.png`、`cover-mobile.png`、`reveal-mobile.png`。手机检查了两处图像完成解码、技能结束仍保持变身，以及重置本局恢复。测试覆盖历史恢复、回放、队伍轮次、外观覆盖、时序和取消清理。

设计钩子的 SkillBanner broken-image 提示为静态展开误报：两个 img 均通过共享 portrait props 提供真实 src，浏览器验证 naturalWidth > 0。预览早期棋盘占位颜色已移除，改用真实 Board/RoomScreen，不增加主题颜色。

本次 206 项相关测试、lint、构建和 check:built-css 通过。全局 CSS inventory 的两个原有失败保持不变：基线外 899 字节，以及 match-mode-title-layout.css 的未登记 360px 查询；此次只为新增 CSS 增加实测 253 字节配额。
