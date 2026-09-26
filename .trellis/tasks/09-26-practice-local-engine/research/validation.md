# 本地陪练引擎验证记录

日期：2026-09-26。工作目录：`C:\codex\SigrikaGo`。

## 开发模式加载回归修复

用户反馈在开局前出现 Vite `ERR_LOAD_PUBLIC_URL`。新增 development 项目后已复现原错误：`@vite-ignore` 只跳过分析警告，Vite 仍给根路径动态 import 注入 `?import`，使预编译的 public JS 被送入转换流程。

`practiceEngine.worker.js` 现将地址构造为以 `self.location.origin` 为基准的同源绝对 URL，使浏览器直接请求静态模块；保留版本参数、错误提示和 CSP，不关闭错误浮层。此前测试仅覆盖 production preview，是漏检原因。浏览器套件现同时启动 development 和 production 服务，各使用独立端口／测试数据库；开发夹具限定依赖扫描入口并隔离缓存，避免扫描临时工具链目录或影响用户的开发服务器。

修复后的针对性单测 31 项通过；最终双模式浏览器测试 **8 项全部通过（1.1 分钟）**，生产构建与开发模式均验证三档出招、刷新恢复、下载失败和重试。冷启动测试曾受临时工具链目录监听和加载影响；夹具已排除 `.codex-run`／`.tmp`／`.worktrees` 监听，并按正式连接生命周期在重连时恢复房间。后续新增 public 动态模块加载必须同时覆盖两种模式。

## 已实现

- 新建准时宝入门、中级、高级以及吃子挑战赛均在浏览器 Worker 搜索。
- 普通服务端机器人调度不再搜索这些新房；服务器保留规则校验、数子和挑战赛成绩／排名。
- 新房 admission 先完成真实引擎初始化；下载失败可重新开始；无隐式云端或弱档回退。
- 租约绑定当前连接和完整局面；迟到／重复／非法结果不会多落一手。切后台和断线中止计算，恢复重新派工。
- 黑化西格莉卡和历史 server 后端房保留原路径。无需数据库迁移。

## 验证结果

- 针对性 Vitest：17 文件、125 测试通过。包含真实规则链第 100 手挑战结算、重连／重启、隐藏信息投影、去重、Worker 超时与恢复。
- 生产 Vite bundle 的 Chrome 集成：**4 项全部通过**。入门、中级和高级挑战赛实际出招至第 5 手，期间刷新并续接原房成功；入门不下载 WASM；严格 CSP 下加载通过；下载失败不创建房间，解除故障后重新开始成功。
- `npm run lint`、`npm run build`、`npm run check:built-css`、`npm run check:portraits`、`npm run check:admin-snapshot`、测试值生产配置预检、`npm run docs:system-design`、设计 HTML 一致性测试和 `git diff --check` 通过。
- `npm run check` 在全量单测环节未全绿。修正本次协议／CSP断言并重新生成文档后，全量为 **2683 通过、8 失败（6 文件）**。后续 gate 的构建／资源／配置检查已单独执行。

范围外失败（未修改相关实现或扩大修复范围）：

| 文件 | 失败数 | 内容 |
|---|---:|---|
| `server/social.test.js` | 2 | 用户资料回放摘要与友谊局摘要 |
| `src/modals/HouseModal.test.js` | 2 | 履历布局顺序与移动手册背景 CSS |
| `src/modals/ShopModal.test.js` | 1 | 旧移动宽度 CSS 断言 |
| `src/room/RoomScreen.test.js` | 1 | 桌面对弈 header 网格 CSS |
| `src/styles/cssLayerInventory.test.js` | 1 | CSS 总字节数超过既有基线 |
| `src/styles/themeContract.test.js` | 1 | 资料／好友纸色规则字符串 |

当前仓库原有未提交的履历、仓库道具和移动样式修改均保留。上述失败不能表述为整仓 gate 通过。

## WASM 实测

GNU Go 3.8，Emscripten 4.0.10。最终 WASM SHA-256：
`e23463539237087ad1e84aba36db3ebec79725e02124795d72600e6f1a26bbc4`。

WASM 文件 6,343,132 字节；gzip 1,075,806 字节。下表为本机 Node WASM 的单次搜索时间，不含浏览器下载、编译或人为出手间隔；不能当成手机耗时保证。

| 局面 | level 5 | level 10 | 与本机原生 GNU Go 出招比较 |
|---|---:|---:|---|
| 空棋盘 | 31 ms | 10 ms | 两档均相同 |
| 确定性生成 20 手 | 613 ms | 1653 ms | 两档均相同 |
| 确定性生成 70 手 | 711 ms | 2373 ms | 两档均相同 |

6 组结果均合法且相同；这属于有限回归验证，不证明所有局面／平台完全相同。
没有真实 Android／iPhone 性能或目标云环境测试，也没有执行线上部署。

## 重现

```sh
python scripts/build-practice-wasm.py --emsdk /path/to/emsdk
npm run verify:practice-wasm
npm run test:e2e:practice
npm run check
```

Emscripten 必须为 4.0.10；构建脚本会检查版本及源包摘要。第三方源码、GPL 许可证、最小补丁和构建脚本随 `/engines/gnugo-3.8/` 分发。
浏览器测试使用独立端口及临时 SQLite，未使用玩家数据库。原始日志保存在 `.codex-run/practice-local/`。
