# 阶段 3 稳定性与发布门禁差距分析

## 基线结果

- 干净工作树执行 `npm ci` 后，`npm run verify:stability` 首次因 Prisma Client 未生成而无法启动服务器；显式执行 `npm run prisma:generate` 后可进入完整套件。
- 完整稳定性基线为 11/14 通过：桌面 Aemeath 用例在选择角色时返回 403；移动 Sigrika 与 Aemeath 用例在注册时返回 429。
- 构建本身通过；本轮没有触碰 `prisma/dev.db`，Playwright 使用 `.tmp/playwright/` 下的隔离数据库。

## 根因

### Aemeath 403

`registerPlayer(..., { characterId: "aemeath" })` 注册新用户后立即调用 `/api/me/character`。产品默认只授予新用户 `sigrika,denia`，因此 403 是正确的生产权限行为，错误在测试前置数据而非角色选择接口。

修复原则：只在明确的 stability 测试环境提供夹具能力，授予当前测试用户指定角色；生产环境即使设置测试开关也必须拒绝。不得把 Aemeath 加回所有新用户默认资产。

### 跨项目 429

桌面和移动 Playwright 项目串行复用同一个服务器、数据库和代理 IP。认证限流器按 IP 使用固定窗口，桌面项目累积的注册/登录请求会占用移动项目额度。提高用户名唯一性不能解决 IP 桶共享。

修复原则：仅在 stability 环境允许由受控测试请求头提供限流 namespace；生产继续只按可信 IP 计数，客户端不能通过伪造请求头绕过限流。Playwright 每个项目使用独立 namespace。

### Prisma 生成前置

`prestart` 会生成 Prisma Client，但稳定性/容量脚本直接启动 Node 辅助服务器，不经过 `npm start`。发布候选门禁必须在调用数据库辅助脚本前显式生成 Prisma Client，且单项验证入口也应给出确定性前置。

## 已有能力与复用边界

- 复用 `verify:migrations`，不复制阶段 2 的基线验证逻辑。
- 复用 `verify:stability` 和 `verify:capacity -- --profile smoke`；统一门禁只负责顺序编排和失败即停。
- 复用 `/health/live`、`/health/ready` 与既有运行稳定性指标；阶段 3 只定义观察项、阈值和处置流程，不引入监控供应商。
- 复用容量验证器的隔离 SQLite 数据库和重启恢复报告；真实 `target` 压测仍在目标 2C2G 主机执行。

## 新增能力建议

1. 稳定性测试专用的受控夹具接口与限流 namespace，并覆盖“生产拒绝”测试。
2. `verify:backup-restore`：只创建和操作 `.tmp/` 一次性 SQLite，执行迁移、写入哨兵、备份、破坏源状态、恢复副本、`integrity_check` 与哨兵校验；拒绝源/目标重合及仓库真实开发库。
3. `verify:release-candidate`：Prisma generate → migrations → production config → build → stability（跳过重复 build）→ backup/restore → capacity smoke（跳过重复 build）。
4. 发布运行手册：fresh install、旧库首次 baseline adoption、普通发布、观察、回滚分别列出，避免把首次接管与日常升级混成一条危险路径。

## 风险与非目标

- 不修改生产授权和生产限流默认值。
- 不自动处理真实开发/生产数据库；备份演练只能使用一次性数据库。
- 不把本机 smoke 结果表述为目标机容量承诺。
- 不顺带处理既有 CSS 体积门禁或依赖审计升级。
