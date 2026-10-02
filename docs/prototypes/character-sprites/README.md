# 标准立绘交互样板

入口：`docs/prototypes/character-sprites/index.html`。在项目根启动静态服务：

```powershell
py -3 -m http.server 8768 --bind 127.0.0.1
```

打开 http://127.0.0.1:8768/docs/prototypes/character-sprites/index.html 。

- 七场景：部员手册、首页学生证、履历，以及剧情舞台、对局与技能、队际头像、结算。链接可用 `#handbook`、`#student`、`#resume` 直接打开对应场景。
- 支持西格莉卡九张图（八种差分加原图）、半身／膝上／全身对比、桌面／手机竖屏、长对白、技能、试下与胜负切换。
- 手册提供三名角色的九种表情、全身查看、Esc／按钮关闭及本地出战切换。列表为桌面五列、竖屏三列，竖屏卡高 88px；其余六名角色使用当前 Q 版图作对照，详情仅实现三名有新立绘的角色。
- 首页学生证沿用现有挂卡及照片框比例，点击打开履历；履历身份头像为桌面 164×152px、手机 108×96px，角色切换、模式切换与空状态均为本地演示，头像固定微笑。
- 来源 `amis` 目录映射为项目 `aemeath`。27 张 PNG 原样复制到本样板 assets，合计 34,061,305 bytes；复制后 SHA-256 核对一致。没有修改图像或生成正式头像派生图，当前构图通过 CSS 完成。
- `catalog-data.js` 只提取正式默认快照 `server/adminDefaultSnapshot.js` 中的九名角色必要展示字段，包含三名角色的真实介绍、CV、获得途径和技能描述；不访问数据库，不加载整个后台配置或剧情。账号与战绩为示例数据。
- 字体与教室背景引用仓库已有 public 资源，需保留项目相对目录结构。页面不调用真实 API、不修改账号或游戏数据。

样板确定裁切后，再将用途配置与轻量派生图接入正式资源集合。

已在浏览器检查 1400×920 桌面、900×900 中等窗口、390×844 和 360×800 手机竖屏：九种表情加载、剧情推进及返回、三种构图、长对白滚动、落子禁用、技能横幅、角色切换和胜负切换通过；页面与场景均无横向溢出，控制台无错误。窄屏棋钟与技能按钮分别保留空间。三个脚本的 `node --check` 通过。

新增三场景另在 1440×960、900×900、390×844、360×800 检查：三角色表情切换、头像与完整立绘、详情滚动、Esc 返回、学生证进入履历、模式／空状态及原技能还原流程通过。窄屏自动采用竖屏，桌面按钮禁用；宽窗口仍可主动查看手机构图。浏览器图片需要加载和绘制完成后再评审截图。

维护命令（项目根目录执行）：

```powershell
node docs/prototypes/character-sprites/sync-catalog.mjs
node node_modules/eslint/bin/eslint.js --config docs/prototypes/character-sprites/lint.config.mjs docs/prototypes/character-sprites/*.js docs/prototypes/character-sprites/*.mjs
```

更新默认文案时重新生成离线数据，缺少角色时生成器报错；不要将样板的 CSS 构图、示例战绩、服装占位和本地出战状态当成正式运行合同。

验证记录：`.trellis/tasks/10-02-standard-character-sprites-plan/research/prototype-verification.json`。这是独立样板验证，不能替代正式对局、剧情系统及真实奖励流程的回归测试。
