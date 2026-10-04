# 正式群像拼图核验 · 2026-10-04

本次修改已接入真实 `HouseModal`，独立样板仅保留为历史资料。角色详情使用真实技能、描述、CV、语音、BGM及服装组件。按用户确认，本次移除普通手册出战旗帜，暂不实现新的选人入口。

- 素材：九张832×1216透明PNG导出为无损WebP；全部alpha和alpha>0区域RGB逐像素相同，源SHA256不变。总大小10,535,038 → 5,364,650 bytes。猪小仙引用原肖像。默认手册专用图不改变全局900×900规范，服装、糖果、黑化与自定义源仍走共享优先级。
- 几何：横向与纵向画板各十块凸多边形，完整覆盖且无重叠；最大／最小面积比约1.003／1.001。830×498下每边向内1.5px，330×504下向内1px，构成3px／2px拼缝；逆序顶点也向内收缩。背景使用主题渐变，常态没有边框。
- 浏览器：1440×1024、1440×768、390×844、360×640、932×430分别逐一打开十名角色详情，共50次。文档水平溢出均为0，低桌面与横屏可滚动到末端。桌面悬停有原版位移旋转，减少动态偏好关闭位移；未拥有剪影、匿名详情、Escape及返回焦点核验成功。五种尺寸的详情全身显示、正文滚动、服装打开／关闭和详情返回均成功。
- 自动化：拼图Playwright 4/4通过；真实主界面引导及头像稳定Playwright 6/6通过。最终相关Vitest 11文件180/180通过，包含几何、共享来源／服装优先级、匿名窗、原详情操作、旧黑化分支、CSS来源和文档。全量命令已运行，发现三项旧的静态断言（最后CSS import、选项主题fallback及旧出战确认标记），已按现有真实行为更新并在最终相关集合中全部通过；其余405个测试文件通过。
- 工程：lint、production build、built CSS contracts、18个既有肖像规范及后台默认快照检查通过；系统设计Markdown与HTML已同步。无API／数据库改动。

复现拼图自动化：`node node_modules/@playwright/test/cli.js test --config tests/e2e/handbook-puzzle.config.js`。主界面引导自动化：同一命令使用 `tests/e2e/home-onboarding.config.js`。

[桌面](./production-desktop.png) · [悬停](./production-hover.png) · [手机](./production-mobile.png) · [短屏](./production-mobile-short.png) · [未拥有](./production-partial.png) · [桌面详情](./production-detail-desktop.png) · [手机详情](./production-detail-mobile.png)
