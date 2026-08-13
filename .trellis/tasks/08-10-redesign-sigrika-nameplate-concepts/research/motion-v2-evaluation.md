# 西格莉卡铭牌动效二次增强评估

> 状态：已被用户否决。尾部径向光晕和符核/尾部缩放呼吸在运行时读成“光蛋变大变小”，对应实现已从正式 CSS 中完整移除；本文件与 `nameplate-preview-motion-v2/` 只保留为过程证据。

## 诊断

- 首轮正式动效属于感知主光不足：持续轮廓光偏弱，符核和三条符文轨迹的幅度在 `150 x 32` 下不容易察觉。
- 右侧绘制尾部只有极小星点，没有独立的局部光晕或沿尾部方向运动的光，因此静态和动态阶段都显得断光。
- 正确修复层是精确资产 CSS owner；正式 PNG、通用 `UserIdentity` DOM、用户名位置和奖励数据无需改变。

## 实现

- 提高 Alpha 跟随金紫轮廓光的静态强度，确保任意动画相位仍有完整主光。
- 放大左侧符印呼吸、符核脉冲和三条符文轨迹的透明度/位移差，但继续只动画 `transform` 和 `opacity`。
- 使用 `.user-identity-nameplate-effect::before` 在右侧绘制金紫尾部呼吸光晕。
- 使用 `.user-identity-nameplate-effect::after` 绘制短程暖白—薄荷冷光方向轨迹；两层都只覆盖右侧约 `34px`，不形成全牌扫光。
- `prefers-reduced-motion: reduce` 下所有关键帧停止，尾部光晕与轨迹分别冻结在 `0.88 / 0.72` 的清晰静态态。

## 真实主题预览采样

使用任务内真实 `UserIdentity`、完整 `/src/styles.css` 和系统 Chrome，在同一桌面预览单元采样：

| 时刻 | 左符印 opacity | 符核 opacity | 符文轨迹 opacity | 尾部光晕 opacity | 尾部轨迹 opacity |
|---|---:|---:|---:|---:|---:|
| 160ms | 0.643 | 0.371 | 0.345 | 0.783 | 0.491 |
| 880ms | 0.794 | 0.921 | 0.572 | 0.884 | 0.960 |
| 1700ms | 0.972 | 0.340 | 0.879 | 0.597 | 0.586 |

减弱动效计算样式：左符印、尾部光晕和尾部轨迹的 `animation-name` 均为 `none`；尾部仍保持可见。

证据截图：

- `nameplate-preview-motion-v2/desktop-motion-160ms.png`
- `nameplate-preview-motion-v2/desktop-motion-880ms.png`
- `nameplate-preview-motion-v2/desktop-motion-1700ms.png`
- `nameplate-preview-motion-v2/phone-reduced.png`

## 验证

- 铭牌相关 6 个测试文件共 `137` 项通过。
- 全仓 lint 与 `348` 个测试文件、`2474` 项测试通过。
- 正式 `1125 x 240` RGBA 资产验证通过：Alpha 边界 `110 / 8 / 1013 / 231`，用户名安全区 `315..990`。
- 生产构建、构建后 CSS 合同和生产配置检查通过。
- 总 `npm run check` 只被既有后台默认快照漂移截断：`siteSettings`、`shopItems`、`storyScripts`；本任务未修改或重新导出这些后台内容。

## Impeccable 审计分类

- 精确角色 owner 中的暖金、深紫、薄荷冷光被通用 `DESIGN.md` 调色板检测器标为 advisory。它们是已写入角色铭牌规格、并与正式 PNG 对齐的资产私有表现色，不应替换为 Bright School 的通用交互语义色。
- `hudComponents.test.js` 中的其它颜色与 `Chakra Petch` 提示来自既有测试夹具，不属于本次铭牌改动。
- 未写入任何全局或值级忽略规则；等待用户实际视觉验收后再决定是否调整角色光色。
