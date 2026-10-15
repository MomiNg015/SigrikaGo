# 浅灰工业终端 · 第二主题样板

独立的主界面、对弈界面与部员手册视觉样板。原校园主题与正式业务代码不变。

## Preview

从仓库根目录运行 `py -3 -m http.server 8774 --bind 127.0.0.1`，打开：

- `http://127.0.0.1:8774/docs/design-samples/industrial-terminal/index.html#home`
- `http://127.0.0.1:8774/docs/design-samples/industrial-terminal/index.html#battle`
- `http://127.0.0.1:8774/docs/design-samples/industrial-terminal/index.html#members`

## Interaction boundary

- 三页切换；九角色搜索、技能/档案页签、出战选择同步到大厅与对弈。
- 模式与陪练入口展示选择窗，进入同一个 13 路视觉棋盘；标准与五子棋仅展示说明。
- 棋盘提供黑白交替放置、占位反馈、弃手、撤回、重置、坐标切换。没有合法性、提子、AI、超时或胜负引擎。
- 技能仅展示文案与发动反馈；数子仅统计当前画面棋子；和棋与认输是本地确认流程。
- 二级入口展示通用窗口外壳，不对服务器或账号产生写入。
- 人名与战绩为样板数据；角色文案抽取自 `server/adminDefaultSnapshot.js` 已保存配置，不声称等于在线实时配置。
- 大立绘复用 `public/assets/characters/handbook-sprites/`；小头像使用现有 Q 版头像。不复制或修改原图。

## Design

用户选择的浅灰工业终端方向：灰白面、深色功能模块、少量黄绿强调、细线、明确字级、完整角色立绘。参考《明日方舟》《终末地》的信息组织，不复刻品牌资产。手机按竖屏重排。

样板使用独立色板与 Bahnschrift/Consolas 数字字体，属于用户授权的第二主题探索；设计 hook 对现有 Bright School DESIGN.md 的字体/颜色差异在这里属于预期，不修改生产设计系统，不添加 suppression。圆形角色舞台和棋子边缘的细线是图形本身的结构，不是卡片彩色粗边装饰。

## QA inventory

- 桌面 1440×1000、1280×800；竖屏 390×844、360×800、320×640：三页图像加载、横向溢出、截图。
- 逐个角色切换，技能与档案、搜索无结果与恢复、选择同步。
- 黑白落子、已占位拒绝、撤回、弃手、重置、坐标开关、技能反馈、和棋/认输取消与确认。
- 对话框 Escape 和焦点回归；页签方向键；减少动态效果。
- 状态与视图由纯本地数据驱动；不访问账号/对局接口。

验证结果与截图保存在 `review/`。
