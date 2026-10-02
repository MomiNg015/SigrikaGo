# 西格莉卡铭牌 v4 开放细丝流光评估

## 用户否决与修正层

- v2 的符核/尾部缩放呼吸与径向椭圆尾光被否决为“光蛋变大变小”。
- v3 虽改为横向位移，但高密度多边形载体仍被否决为“实体光球从左边到右边”。
- v4 不再移动任何填满中心的光面；正确修复层仍是精确资产 CSS owner，正式 PNG、用户名位置、通用 `UserIdentity` DOM 与奖励数据保持不变。

## v4 动效结构

- 左侧四芒星只做不带缩放的点火明暗与极小横移。
- 横穿中央载体的主光拆为三条独立细丝，计算高度分别为 `1.2px / 1px / 0.9px`，长度、纵向位置与亮点不同，细丝之间完全透明。
- 上下绘制符文轮廓另有三条 `1.35px / 1.2px / 1.1px` 细流同步向右推进。
- 右尾只在主流光抵达后出现两条分叉方向线；不存在径向渐变、椭圆光晕或圆形移动主体。
- 所有连续关键帧只修改 `transform` 与 `opacity`，正式 motion 文件不包含 `scale(...)`。

## 真实主题预览采样

任务预览使用真实 `UserIdentity`、完整 `/src/styles.css` 与系统 Chrome。三个采样时刻的横向位移与透明度如下：

| 时刻 | 开放细丝 opacity / x | 轮廓流 opacity / x | 上尾线 opacity / x | 下尾线 opacity / x |
|---|---|---|---|---|
| 160ms | `0.306 / -3.32px` | `0.312 / -8.20px` | `0 / -8px` | `0 / -6.93px` |
| 880ms | `0.622 / 42.85px` | `0.844 / 5.58px` | `0 / -8px` | `0 / -6.93px` |
| 1700ms | `0.427 / 88.96px` | `0.569 / 20.05px` | `0.839 / 3.53px` | `0.779 / 0.85px` |

矩阵主轴始终为 `1`，没有放大缩小；尾线只在流光抵达右端的后半段出现。减弱动态效果下开放细丝与尾线 `animation-name` 均为 `none`，静态开放细丝 opacity 为 `0.34`。

## 证据截图

- `nameplate-preview-motion-v4-filaments/desktop-filaments-160ms.png`
- `nameplate-preview-motion-v4-filaments/desktop-filaments-880ms.png`
- `nameplate-preview-motion-v4-filaments/desktop-filaments-1700ms.png`
- `nameplate-preview-motion-v4-filaments/phone-reduced.png`

## 视觉检查

- 880ms 帧只显示沿载体/轮廓推进的细线亮点，没有可识别的实心移动光块。
- 1700ms 帧能看到右侧多条平行、分叉拖线，尾光具有明确方向，不读作局部光源。
- 合法英文名、四个中日韩字符、历史超长名与称号/独立徽章组合继续使用原用户名布局，没有因动效改动而移动。
