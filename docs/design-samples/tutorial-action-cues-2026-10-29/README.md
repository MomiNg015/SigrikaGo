# 操作引导：三套动效样板

运行开发服务后打开 [对照页](./index.html)，切换 A / B / C，在真实按钮和棋盘上点击试用。此目录是独立设计样板，没有向正式引导接入新动效。

| 方案 | 提示方式 | 节奏 |
| --- | --- | --- |
| A 收拢聚焦 | 四个墨色角标，两次向内收拢 | 1.9 秒，聚焦后停顿 |
| B 扩散光圈 | 暖黄双圈向外扩散，目标边缘常亮 | 2.1 秒，错峰扩散 |
| C 手绘点按 | 纸白色手指反复靠近目标，触点短线反馈 | 1.9 秒，两次轻点后停顿 |

三套沿用 `TutorialBattleScreen` 的真实布局、按钮、棋盘和 20% 聚焦遮罩。样板装饰位于遮罩之上，完全穿透鼠标与触摸；点击技能后跟随到棋盘落点，操作完成即卸载。按钮和原布局均不缩放。只在样板隐藏旧棋盘脉冲，便于对比新方向。

对照页可切换技能、落子和数子，提供 390×844、320×568、1440×900 视口，以及暂停、重试和原尺寸打开。320×568 下正式房间内容需要滚动，样板在新目标出现时自动把目标滚入视口；保持真实棋盘尺寸，不反复抢回手动滚动。光圈扩散根据边缘余量限制，手指按目标位置调整方向，避开按钮文字。减少动态效果模式保留静态标识。

## 文件与验证

- `index.html` / `review.*`：独立对照控件。
- `scene.jsx`：本地脚本驱动正式教学组件，无账号、后台写入或网络对局。
- `ActionCue.jsx` / `scene.css`：仅供预览的定位和装饰。
- `verify.mjs`：浏览器覆盖三种视口 × 三种目标 × 三种方案，以及实际点击、阶段推进、切换、暂停、重试和减少动态效果；结果保存至 `verification.json`。
- `preview-*.png`：手机、桌面与对照页截图；动效以页面为准。

复现：`node docs/design-samples/tutorial-action-cues-2026-10-29/verify.mjs`（开发服务运行于 5173）。

2026-10-29 验证：27 组浏览器组合、切换／暂停／重试／步骤推进／减少动态效果全部通过，无页面脚本错误；样板 ESLint 和系统设计 HTML 的 4 项测试通过。

设计检查：复用项目的 LXGW 字体并使用正式字体名称，控制圆角已统一为 8px／4px。选择按钮保留墨色边框和硬阴影，以延续用户选定的手绘语言；设备页签的底线属于选中标识，并非圆角卡片装饰。重复运动是本次要求的操作提示，提供暂停与减少动态效果，不添加规则忽略。

## 手指图标来源

`hand.svg` 为参考项目已有 Lucide Pointer 轮廓重新绘制的 UI 图标，使用暖纸填色、双线和粉色袖口。

ISC License

Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
