# 公告与邮箱 · 阴影纸卡样板

[打开交互比较页](./index.html) · [公告单独预览](./preview.html?window=announcement) · [邮箱单独预览](./preview.html?window=mailbox)

2026-10-23 已按确认样板实装，比较页默认展示正式效果。原始样板保留供对照。复用正式 `AnnouncementModal`、`MailboxModal` 和 `InformationCenterLayout`，加载完整生产主题，再通过样板根节点限定的 CSS 展示新设计。可以直接点击列表、切换日志、查看附件、领取、删除、返回和关闭；所有接口在本页内存中模拟，刷新恢复，不操作真实账号。

## 视觉方案

- **公告：布告纸卡。** 保留左侧公告／日志书签、标题贴纸和方格纸。列表为白纸加墨色硬阴影，选中卡与阅读题头使用浅粉色；置顶和未读改为普通文字标记。详情外框下叠一层错位底纸，沿用现有阅读丝印。
- **邮箱：信件纸卡。** 使用同一套边框和厚阴影，选中信件与信头采用浅薄荷色；待领取、未读和已完成有明确文字提示，已完成卡变浅灰。信头、正文、附件托盘分开，附件保留查看详情和原领取操作，数量移到附件右下。
- **手机：单列列表与独立详情。** 保留滑入／滑出和返回按钮；修正样板中外置书签导致的公告高度压缩。列表按容器高度分配整数行并使用原生滚动吸附，停靠和末行均保留完整卡片与阴影余量。列表标题最多两行；短竖屏的极长详情标题最多三行，避免挤没正文和附件。

## 保留的动效

公告继续使用 `announcement-detail-enter`；邮箱正文继续使用 `mailbox-detail-content-enter`，420ms、0/100/200ms 分段进入。手机列表和详情保留原 260ms 平移／透明度切换。纸卡补充 150ms 悬停轻抬、按下下沉与阴影缩短，附件图块同样有反馈；原关闭、返回、书签、领取按钮沿用生产交互。新增过渡遵守减少动态效果设置。

## 检查与截图

运行 Vite 后执行 `node docs/design-samples/information-paper-2026-10-22/verify.mjs`。浏览器使用已安装的 Edge，不连接游戏账号。

- **19 组检查通过**：两窗口 × 桌面1440×960／390×844／320×568 × 正常／长内容／空数据，共18组，另1组验证悬停、按下、邮箱动效时序、减少动态效果及比较页切换。
- 检查包含无横向溢出、完整行高、末行阴影空间、正文可读区域、附件未被裁切、公告分类、手机返回、附件详情、领取完成态和删除。浏览器无未捕获异常，未发出真实 API 网络请求。结果见 [verification.json](./verification.json)。
- 样板 JS/JSX 通过 ESLint 的推荐 JS、React、Hooks 与 a11y 规则。仓库默认维护白名单未包含本目录，因此检查使用临时专属配置，没有修改项目 lint 配置。
- 设计检查中发现的外壳背景与提示圆角已改为主题混色和现有8px尺度；没有添加忽略规则。模板没有新增生产资源或主题入口，因此不改生产 CSS 债务基线，也不为尚未批准的方案建立生产规范。

| 窗口 | 桌面 | 手机列表 | 手机详情 |
| --- | --- | --- | --- |
| 公告 | [截图](./announcement-desktop.png) | [截图](./announcement-mobile.png) | [截图](./announcement-mobile-detail.png) |
| 邮箱 | [截图](./mailbox-desktop.png) | [截图](./mailbox-mobile.png) | [截图](./mailbox-mobile-detail.png) |

窄屏边界：[公告长标题](./announcement-narrow-long.png)、[邮箱长标题与9999附件](./mailbox-narrow-long.png)。

## 正式接入与边界

`paper.css` 继续作为隔离样板覆盖。正式样式已经整合到原有 `mobile-adaptive/information-center.css` 入口的五个有界子文件；阅读丝印归属原 `card-screenprints.css`。生产列表使用 `useInformationListRows(items)` 和实际 `<ul>` ref，取代样板的 `fit-paper-lists.js` 适配器。`fixtures.js`、比较页和假数据不能进入生产包；真实邮件读／领／删及公告未读摘要继续由现有 API 管理。读取丝印复用已提交资源，不做远程请求。

## 正式界面验证（2026-10-23）

[正式公告](./production.html?window=announcement) · [正式邮箱](./production.html?window=mailbox)。此入口只加载应用 CSS，不加载样板覆盖与样板尺寸适配器。

手机公告的返回和关闭按钮使用同一网格行、相同 36px 尺寸并垂直居中。390×844 详情截图中两者顶部均为 y=58px，高度均为 36px。

`npx playwright test --config tests/e2e/information-paper.config.js` 覆盖 19 组正式界面检查：1440／800／390／360／320px 宽度及短竖屏、完整行滚动、返回焦点、长内容与空数据、公告分类已读、邮件附件详情／领取／删除／关闭和保留动效。共享 hook 的 DOM 测试覆盖异步挂载、重排、清理及主题排除。

| 正式效果 | 桌面 | 手机列表 | 手机详情 |
| --- | --- | --- | --- |
| 公告 | [截图](./production-announcement-desktop.png) | [截图](./production-announcement-mobile-list.png) | [截图](./production-announcement-mobile.png) |
| 邮箱 | [截图](./production-mailbox-desktop.png) | [截图](./production-mailbox-mobile-list.png) | [截图](./production-mailbox-mobile.png) |

按钮对齐实测、预览异常和真实 API／样板尺寸脚本请求检查记录在 [production-verification.json](./production-verification.json)。浏览器回归同时验证未读、选中与普通卡片都保留厚阴影，防止旧公告状态样式盖掉纸卡表面。
