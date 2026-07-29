# SigrikaGo 部署指南

本文档面向单台云服务器部署。当前项目的实时房间、匹配队列和 Socket 在线状态仍以单 Node.js 进程内存为核心，因此生产环境应先使用单实例运行，不要使用 PM2 cluster、多进程负载均衡或多台机器横向扩容。

准时宝入门陪练使用 Node.js 进程内的本地启发式策略；中级与高级使用服务器本机的 GNU Go 3.8。两类策略都不访问外部围棋服务，也不需要 GPU。Ubuntu 24.04 可直接安装 GNU Go 官方仓库包：

```bash
sudo apt update
sudo apt install -y gnugo
/usr/games/gnugo --version
```

生产更新脚本会在备份、拉取和停服之前检查 `/usr/games/gnugo` 是否存在且能输出版本；检查失败时必须先修复系统依赖，否则中级与高级陪练不可用。GNU Go 档位运行失败时不会静默回退到入门启发式策略。

## 部署前检查

在准备发布的提交上先执行阶段 3 本地发布候选门禁：

```bash
npm ci
npm run verify:release-candidate
```

该命令按“Prisma Client 生成 → 迁移基线验证 → 生产配置检查 → 构建 → desktop/mobile 稳定性 → SQLite 备份恢复演练 → 容量 smoke”顺序执行，任一步失败即停止。迁移、稳定性、备份恢复与本地容量验证全部使用 `.tmp/` 一次性数据库，不会读取、迁移或重置 `prisma/dev.db`，也不能替代目标机 `target` 容量验收。

发布候选通过后，在目标服务器执行：

```bash
npm ci
npx prisma migrate deploy
npm run build
npm run check:production
npm test
```

`npm ci` 的 `postinstall` 会生成 Prisma Client，`prestart` 仍会在启动前再次校验生成。仓库的 Prisma 迁移历史从 `0_init` 完整基线开始。可单独执行 `npm run verify:migrations`：该命令只会在 `.tmp/migration-baseline/` 创建并清理一次性 SQLite 数据库，同时验证空库部署和现有库接管。

`npm run check:production` 会先按服务端相同规则加载当前工作目录的 `.env`，再检查生产环境中的 `JWT_SECRET`、站点 origin、调试开关和显式多实例配置。生产 origin 必须使用 HTTPS，不能启用测试工具 action；在房间状态和 Socket.IO 适配器改为共享之前，也不能配置 `WEB_CONCURRENCY`、`PM2_INSTANCES` 等多实例参数大于 1。

依赖安全基线（2026-07-20）：`npm audit --omit=dev` 不再包含 high/critical；Multer、Socket.IO/`ws`、Express/`qs` 已升级到修复版本。仍有 2 条 moderate 记录，实际是 ExcelJS 4.4.0 经 `uuid` 8.3.2 形成的同一条传递依赖告警。项目不直接调用 `uuid`，ExcelJS 只在管理员剧情脚本工作簿导入/导出时按需加载；当前 ExcelJS 最新版尚未升级该依赖，而审计建议的 ExcelJS 3.4.0 是功能倒退，因此暂不使用 `npm audit fix --force` 或强制跨主版本 override。升级 ExcelJS 后应重新执行工作簿测试与审计并移除此例外。

## 环境变量

生产 `.env` 示例：

```env
NODE_ENV=production
PORT=3001
DATABASE_URL="file:/var/lib/sigrikago/prod.db"
JWT_SECRET="replace-with-at-least-32-random-characters"
PUBLIC_ORIGIN="https://go.example.com"
UPLOAD_DIR="/var/lib/sigrikago/uploads"
PRACTICE_ENGINE_PATH="/usr/games/gnugo"
ENABLE_TEST_ACTIONS="false"
MAX_ONLINE_USERS="500"
MAX_ACTIVE_ROOMS="100"
MAX_SPECTATORS_PER_ROOM="20"
```

字段说明：

- `DATABASE_URL`: SQLite 数据库位置。生产环境建议放在 `/var/lib/sigrikago/prod.db`，不要放在仓库目录或 `dist/` 中。
- `JWT_SECRET`: 生产环境必须换成至少 32 位的随机字符串。
- `PUBLIC_ORIGIN`: 用户访问站点的 HTTPS 地址，例如 `https://go.example.com`。
- `UPLOAD_DIR`: 用户上传资源的持久化根目录。角色立绘上传会保存到 `${UPLOAD_DIR}/characters`，并通过 `/uploads/characters/...` 对外访问。
- `PRACTICE_ENGINE_PATH`: GNU Go 可执行文件的绝对路径。Ubuntu `gnugo` 包默认安装到 `/usr/games/gnugo`；Windows 本地开发可设置为自行安装的 `gnugo.exe` 绝对路径。
- `ENABLE_TEST_ACTIONS`: 仅保留为旧部署配置的生产安全检查项，本地开发无需设置；测试 action 在非生产环境默认可用。生产环境必须为 `false` 或不设置；`npm run check:production` 和服务端运行时都会拒绝生产环境测试 action。
- `MAX_ONLINE_USERS`: 新匹配/约战/观战接入的在线用户软上限，默认 500。不是容量承诺；目标机压测前可保守下调。
- `MAX_ACTIVE_ROOMS`: 新匹配/约战/观战接入的活跃房间软上限，默认 100。达到后已有对局和玩家恢复不受影响。
- `MAX_SPECTATORS_PER_ROOM`: 单个房间首次加入的观战者软上限，默认 20；已有观战者更换连接时仍可恢复。

本地运行 `npm run dev` 时，对局测试按钮会默认显示并可用，无需增加客户端或服务端环境变量。生产构建不会渲染这些按钮，生产服务端也会拒绝测试 action；不要把 `ENABLE_TEST_ACTIONS=true` 带到生产 `.env`。

## 服务器目录

推荐目录：

```bash
sudo mkdir -p /opt/sigrikago
sudo mkdir -p /var/lib/sigrikago/uploads/characters
sudo chown -R $USER:$USER /opt/sigrikago /var/lib/sigrikago
```

拉取代码：

```bash
git clone https://github.com/MomiNg015/SigrikaGo.git /opt/sigrikago
cd /opt/sigrikago
git checkout master
```

写入 `.env` 后执行构建和迁移：

```bash
npm ci
npx prisma migrate deploy
npm run build
npm run check:production
```

以上命令适用于尚未创建业务表的全新数据库。`npx prisma migrate deploy` 会从 `0_init` 建出 `prisma/schema.prisma` 的完整当前结构，并记录迁移历史；不要用 `prisma db push` 代替生产迁移。

### 一次性接管已有预上线数据库

如果数据库已经由旧版 `prisma db push` 或启动时 schema guard 建表，并且包含需要保留的数据，不能直接执行 `0_init`，也不能运行 `migrate reset`。只在该数据库从未应用过仓库旧迁移、当前结构与 `prisma/schema.prisma` 完全一致时，按以下顺序接管：

```bash
sudo systemctl stop sigrikago
mkdir -p /var/backups/sigrikago
npm run backup:sqlite -- \
  --source /var/lib/sigrikago/prod.db \
  --output /var/backups/sigrikago/pre-baseline.db

npx prisma migrate status
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --exit-code

npx prisma migrate resolve --applied 0_init
npx prisma migrate deploy
npx prisma migrate status
sudo systemctl start sigrikago
curl --fail http://127.0.0.1:3001/health/ready
```

接管前的 `migrate status` 应只显示 `0_init` 待应用；schema diff 必须以状态码 0 退出且不报告差异。如果 `_prisma_migrations` 已有其他记录、diff 返回 2、备份失败或数据库路径不明确，应立即停止并人工核对，不能继续 `resolve`。`migrate resolve` 只登记迁移历史，不执行 `0_init` SQL，因此它必须在结构已经匹配的旧库上使用；应用不会在启动时自动改写 `_prisma_migrations`。

### 初始化管理员

公开注册保持启用。先让管理员本人通过正常注册流程创建普通账号，再在服务器项目目录执行：

```bash
npm run admin:promote -- moming
```

该命令只提升数据库中已存在的精确用户名，不创建账号；找不到用户时返回非零退出码，已是管理员时成功退出且不重复写入。管理员身份以数据库 `User.role` 为准，注册、登录、刷新和服务启动都不会根据环境变量或用户名自动提权。提升完成后，让该账号重新登录或刷新访问令牌即可获得后台权限。

当前用户资产仍保留旧 CSV/JSON 字段作为运行时读写来源，但 schema 已准备结构化资产表和进度流水表。生产迁移时必须先执行 `npx prisma migrate deploy`，后续切换读写路径前再单独运行数据回填脚本，不要在业务进程启动期间临时迁移用户资产。

## systemd 服务

仓库中的生产模板位于 `deploy/systemd/sigrikago.service`。先把模板中的 `YOUR_LINUX_USER` 改为实际运行用户，再安装：

```bash
sudo cp deploy/systemd/sigrikago.service /etc/systemd/system/sigrikago.service
sudo sed -i 's/YOUR_LINUX_USER/实际用户名/' /etc/systemd/system/sigrikago.service
```

模板的核心配置如下：

```ini
[Unit]
Description=SigrikaGo
After=network-online.target
Wants=network-online.target
StartLimitIntervalSec=60
StartLimitBurst=5

[Service]
Type=simple
WorkingDirectory=/opt/sigrikago
EnvironmentFile=/opt/sigrikago/.env
Environment=NODE_OPTIONS=--max-old-space-size=1152
ExecStart=/usr/bin/node /opt/sigrikago/server/index.js
Restart=on-failure
RestartSec=5
TimeoutStopSec=25
KillSignal=SIGTERM
KillMode=control-group
LimitNOFILE=65535
TasksMax=512
MemoryHigh=1400M
MemoryMax=1600M
OOMPolicy=stop
User=YOUR_LINUX_USER

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now sigrikago
sudo systemctl status sigrikago
```

查看日志：

```bash
sudo journalctl -u sigrikago -f
```

`TimeoutStopSec` 必须大于应用内部 15 秒 shutdown deadline。systemd 发出 SIGTERM 后，服务会先把 readiness 切到 503，停止新写操作并通知客户端，然后关闭 Socket.IO/HTTP、刷新 pending 房间状态并断开数据库；不要使用 `KillSignal=SIGKILL` 跳过该过程。直接启动 Node 而不是通过 npm 作为常驻父进程，可以让 SIGTERM 明确到达游戏进程。`MemoryHigh=1400M` 是软压力线，`MemoryMax=1600M` 为 Node 留出硬边界并给 2GB 主机上的内核、Nginx 和 SQLite 保留空间；若目标机还有其他常驻服务，应继续下调。

健康检查：

```bash
curl --fail http://127.0.0.1:3001/health/live
curl --fail http://127.0.0.1:3001/health/ready
```

`live` 用于判断进程是否存活；`ready` 用于判断能否继续接收新流量，排空期间会返回 HTTP 503。部署脚本应等待 `ready` 返回 200 后再认为重启完成。

## Nginx 与 HTTPS

仓库中的 HTTPS 站点模板位于 `deploy/nginx/sigrikago.conf`，共用路由片段位于 `deploy/nginx/sigrikago-routes.conf`。站点模板固定当前正式域名 `sigrikago.com` / `www.sigrikago.com` 和 Let's Encrypt 默认证书路径；路由片段负责 gzip、缓存、SPA CSP 以及 Node/静态资源分流。它不会再把所有请求统一交给 Node，而是按职责拆分：

| 路径 | 处理方 | 生产合同 |
| --- | --- | --- |
| `/socket.io/` | Node/Socket.IO | WebSocket upgrade、关闭 buffering、读写超时 90 秒 |
| `/api/`、`/health/*` | Node/Express | 普通 HTTP 代理，允许响应 buffering |
| `/uploads/` | Nginx alias | 直接读取持久化上传目录，5 分钟可重新验证缓存 |
| Vite hash 资源 | Nginx/CDN | 一年 `immutable` |
| `/assets/**` 命名资源 | Nginx/CDN | `no-cache` 条件请求；同名图片/音频替换后立即重新验证 |
| `index.html`、SPA 路由 | Nginx | `no-cache`，每次发布可及时发现新入口 |

已有 HTTPS 证书的服务器更新配置前，先确认模板引用的证书文件存在并备份当前站点配置：

```bash
sudo test -f /etc/letsencrypt/live/sigrikago.com/fullchain.pem
sudo test -f /etc/letsencrypt/live/sigrikago.com/privkey.pem
sudo cp /etc/nginx/sites-available/sigrikago \
  "/etc/nginx/sites-available/sigrikago.bak-$(date +%F-%H%M%S)"
sudo cp deploy/nginx/sigrikago-routes.conf /etc/nginx/snippets/sigrikago-routes.conf
sudo cp deploy/nginx/sigrikago.conf /etc/nginx/sites-available/sigrikago
sudo ln -sfn /etc/nginx/sites-available/sigrikago /etc/nginx/sites-enabled/sigrikago
sudo nginx -t
sudo systemctl reload nginx
```

如果任一证书检查或 `nginx -t` 失败，不要 reload，恢复刚才的 `.bak-*` 配置后再核对。模板使用 `/opt/sigrikago/dist` 作为前端根目录、`/var/lib/sigrikago/uploads` 作为上传目录。若实际目录不同，必须同步修改路由片段中的 `root` 和 `alias`。Nginx 原生支持音频 Range 请求；只对 HTML、CSS、JavaScript、JSON、XML 和 SVG 启用 gzip，不重复压缩 OGG、WebP、PNG 等已压缩媒体。浏览器入口的 CSP 与 Node 保持一致：页面脚本仍只允许同源，Pixi 图像解码所需的 `blob:` 只放在 `worker-src`。

全新服务器尚无证书时，不能直接启用引用证书文件的正式模板。先保证 80 端口未被占用，用 Certbot standalone 首次签发，再安装上面的正式模板：

```bash
sudo systemctl stop nginx
sudo certbot certonly --standalone \
  -d sigrikago.com \
  -d www.sigrikago.com
sudo systemctl start nginx
```

首次签发后再执行“已有 HTTPS 证书”的复制、`nginx -t` 和 reload 命令。Certbot 的自动续期继续使用 `/etc/letsencrypt/live/sigrikago.com/` 下的稳定链接。

### CDN 接入边界

第一阶段不需要修改前端 `/assets/...` URL。可以让 CDN 以 `https://sigrikago.com/assets/` 为同源加速路径，源站仍指向上述 Nginx；这样不会引入额外的 CORS、媒体权限和 CSP 风险。CDN 规则必须与 Nginx 缓存合同一致：hash 资源可长期缓存，普通命名图片/音乐/语音保持短缓存并允许发布时清理，`index.html` 不进入长期缓存。

后续如果把 `/assets/` 上传到对象存储，应先上传新资源并验证 HTTP 200、Range 和缓存头，最后再发布新的 `index.html`；回滚时保留前一版资源，不能先删除旧 hash 文件。CDN 只负责静态资源，不代理或缓存 `/socket.io/`、动态 `/api/` 和健康检查。

## 2核2G 容量验证

仓库提供隔离数据库、独立 Node 进程和 JSON 报告组成的容量入口。日常 smoke 验证：

```bash
npm run verify:capacity -- --profile smoke
```

smoke 默认覆盖 20 个 Socket、5 个活跃房间、观战、20% 周期重连、对局 action ack、冷静态入口和一次 SIGTERM 重启恢复。它使用 event-loop delay p95 `< 150ms` 的本地诊断线验证采样工具链，报告写入 `artifacts/capacity/`，该目录不提交到 Git；smoke 通过不表示线上容量已经获批。

在实际 2核2G 目标机上运行目标建议线：

```bash
npm run verify:capacity -- --profile target
```

target 默认覆盖 500 Socket、100 个活跃房间、每房 2 个观战连接、动作间隔 7.5 秒、20% 周期重连和整机恢复，持续 120 秒。压测使用独立临时 SQLite 数据库和 `NODE_ENV=capacity`，会创建大量临时账号并启用仅限非生产环境的测试 action，禁止对正式生产数据库或公网正式实例执行。

可用 `--sockets`、`--rooms`、`--spectators-per-room`、`--duration`、`--action-interval`、`--reconnect-ratio` 覆盖参数。报告同时输出冷登录、动作 ack、重连/恢复延迟、CPU、RSS、heap、event-loop delay、Socket/房间/观战数量、发送字节采样以及 SQLite/persistence 错误。target 建议门槛为 ack p95 `< 200ms`、p99 `< 500ms`、event-loop delay p95 `< 50ms`、RSS `< 1.2GB`、恢复成功率 `> 99%` 且无持久化/结果保存错误；只有实际 2 核 2G 目标机报告通过后，才能据此调整线上 soft limit。

## 备份

至少每天备份：

- `/var/lib/sigrikago/prod.db`
- `/var/lib/sigrikago/uploads`

数据库备份优先使用仓库命令；它要求显式源/目标路径、拒绝覆盖已有目标，并通过 SQLite `VACUUM INTO` 生成一致性副本后执行 `integrity_check`：

```bash
mkdir -p /var/backups/sigrikago
npm run backup:sqlite -- \
  --source /var/lib/sigrikago/prod.db \
  --output "/var/backups/sigrikago/prod-$(date +%F-%H%M%S).db"
tar -czf "/var/backups/sigrikago/uploads-$(date +%F).tar.gz" -C /var/lib/sigrikago uploads
```

上线前应另跑一次 `npm run verify:backup-restore`。该演练只操作 `.tmp/backup-restore/` 一次性数据库，会验证迁移、哨兵数据、一致性备份、恢复副本和完整性，不会拿生产库做恢复实验。若确实要手工备份仓库的开发库，必须额外提供 `--allow-dev-database`；自动化演练永远拒绝它。

生产恢复必须先停服，并保留故障现场：

```bash
sudo systemctl stop sigrikago
cp /var/lib/sigrikago/prod.db "/var/backups/sigrikago/failed-$(date +%F-%H%M%S).db"
cp /var/backups/sigrikago/已验证备份.db /var/lib/sigrikago/prod.db
sqlite3 /var/lib/sigrikago/prod.db "PRAGMA integrity_check;"
npx prisma migrate deploy
sudo systemctl start sigrikago
curl --fail http://127.0.0.1:3001/health/ready
```

只有 `integrity_check` 输出 `ok` 且迁移成功才能重新启动；恢复会丢弃备份时间点之后的数据，必须记录时间范围并通知内测用户。

## 小范围内测发布与观察

### 发布前

1. 固定待发布 commit，保存 `npm run verify:release-candidate` 结果；在实际 2 核 2G 主机用隔离库完成 `verify:capacity -- --profile target`，未通过时下调软上限或停止发布。
2. 确认生产 `.env`、单实例 systemd、Nginx、HTTPS、持久化上传目录和磁盘余量；`ENABLE_TEST_ACTIONS` 必须关闭。
3. 停止服务后完成数据库与上传目录备份。旧库首次接管还必须完成 schema diff，再执行一次性的 `migrate resolve --applied 0_init`；普通升级不得重复接管。
4. 记录上一版 commit、备份文件、数据库迁移状态和回滚负责人。

### 发布中

1. 执行 `npm ci`、`npx prisma migrate deploy`、`npm run build`、`npm run check:production`。
2. 重启单个 Node 实例，等待 `/health/live` 与 `/health/ready` 都为 200，再开放内测流量。
3. 用两个普通账号完成注册/登录、匹配、落子 ack、重连、结算和刷新恢复；用管理员账号检查运行容量面板。

### 发布后观察

- 前 30 分钟持续观察，随后至少观察 24 小时再扩大人数。每 5 分钟记录在线数、活跃房间、RSS、CPU、event-loop delay p95、ack p95/p99、恢复成功/失败、持久化 backlog 和三类数据库错误。
- 任一时刻 `/health/ready` 非预期 503、持久化/恢复/结果保存错误大于 0、ack p95 连续 5 分钟高于 200ms、event-loop delay p95 连续 5 分钟高于 50ms、RSS 高于 1.2GB 或恢复成功率不高于 99%，立即停止扩大内测并进入回滚判断。
- 软上限拒绝应记录当前在线/房间数；它是保护机制，不应通过临时提高上限掩盖容量不足。

### 回滚

1. 停止新用户进入并 `systemctl stop`，保留当前数据库与日志快照。
2. 若数据库迁移与上一版向后兼容，切回上一版 commit，重新 `npm ci && npm run build && npm run check:production` 后启动并检查 ready。
3. 若迁移不向后兼容，不得擅自执行 down migration；评估停服修复或恢复发布前数据库。选择恢复备份时必须接受并记录发布后的数据损失。
4. 回滚后重复普通账号冒烟，并继续观察至少 30 分钟。

## 更新流程

仓库提供 `deploy/update-production.sh` 作为正式服务器的一键更新入口。它要求以 root 在 `master` 分支运行，但只拒绝已跟踪或已暂存的改动；服务器上现有的未跟踪根目录 `update.sh` 不会被删除，也不会与新脚本冲突。脚本会先用 `set -a` 加载并导出项目 `.env`，保证生产检查、Prisma 和其他子命令拿到与 systemd 相同的配置，然后依次执行：远端历史检查、SQLite 一致性备份、仅快进拉取、通过 `npm ci --include=dev` 安装锁定依赖（即使 `NODE_ENV=production` 也保留 Vite 等构建工具）、暂存目录构建与生产配置检查、Nginx 备份和语法验证、停服、迁移、完整非用户后台快照预览与应用、切换已完成的前端产物、Nginx reload、服务启动和 60 秒 readiness 等待。数据库备份保持私有权限，构建产物恢复为 Nginx 可读权限；构建不会提前清空正在服务的 `dist`。Nginx 或构建检查失败时不会进入停服阶段，停服后的步骤失败时会尝试恢复上一份前端产物、重新启动服务并保留数据库备份。

第一次使用时，服务器上的旧版本还没有该脚本，先手动拉取一次，然后运行：

```bash
cd /opt/sigrikago
git switch master
git pull --ff-only origin master
sudo ./deploy/update-production.sh
```

以后更新只需：

```bash
cd /opt/sigrikago
sudo ./deploy/update-production.sh
```

默认路径适配当前服务器：项目 `/opt/sigrikago`、数据库 `/var/lib/sigrikago/prod.db`、备份 `/var/backups/sigrikago`、服务 `sigrikago`。只有迁移到不同目录时才通过 `SIGRIKAGO_PROJECT_DIR`、`SIGRIKAGO_DATABASE_PATH`、`SIGRIKAGO_BACKUP_DIR` 或 `SIGRIKAGO_SERVICE_NAME` 临时覆盖；不要把这些变量写进前端配置。

### 非用户后台配置同步

本地后台管理保存到忽略提交的 `prisma/dev.db`，所以正式发布前必须先在本地运行 `npm run admin:snapshot` 并提交生成的 `server/adminDefaultSnapshot.js`；`npm run check:admin-snapshot` 会阻止遗漏。服务器普通启动仍只补缺，不覆盖已有值；正式更新脚本会在数据库备份和迁移后显式同步已提交快照，覆盖同名的系统设置、招募配置、角色/技能、商店/抽卡/成就、音乐名称、公告和故事等非用户后台内容，并保留用户、用户资产、购买/抽卡历史、反馈/举报、审计、邮箱、对局和房间数据。云端额外存在但本地快照没有的行也不会被自动删除。

```bash
cd /opt/sigrikago
sudo systemctl stop sigrikago
mkdir -p /var/backups/sigrikago
npm run backup:sqlite -- \
  --source /var/lib/sigrikago/prod.db \
  --output "/var/backups/sigrikago/pre-onboarding-sync-$(date +%F-%H%M%S).db"

npm run admin:sync-defaults
npm run admin:sync-defaults -- --apply

sudo systemctl start sigrikago
curl --fail http://127.0.0.1:3001/health/ready
```

第一条同步命令只显示各类数据的 create/update/unchanged/cloud-only 数量，第二条才会应用。正式部署以已提交快照为准，因此会覆盖云端同名后台配置；运行前的 SQLite 备份是回退边界。应用成功后不需要重复运行。

### 手工更新（脚本不可用时）

```bash
cd /opt/sigrikago
git pull --ff-only
npm ci
npx prisma migrate deploy
npm run build
npm run check:production

sudo cp /etc/nginx/sites-available/sigrikago \
  "/etc/nginx/sites-available/sigrikago.bak-$(date +%F-%H%M%S)"
sudo cp deploy/nginx/sigrikago-routes.conf /etc/nginx/snippets/sigrikago-routes.conf
sudo cp deploy/nginx/sigrikago.conf /etc/nginx/sites-available/sigrikago
sudo nginx -t
sudo systemctl reload nginx

sudo systemctl restart sigrikago
sudo systemctl status sigrikago
curl --fail http://127.0.0.1:3001/health/ready
curl --compressed -I https://sigrikago.com/assets/$(find dist/assets -maxdepth 1 -name '*.css' -printf '%f\n' | head -n 1)
```

更新前建议先备份数据库和上传目录。最后一条命令应看到 `Content-Encoding: gzip`；若 `nginx -t` 失败，不要 reload 或重启应用，先恢复 Nginx 备份。

已经完成 `0_init` 接管的数据库，后续更新只需按正常流程执行新增迁移；不要重复执行基线接管步骤。
