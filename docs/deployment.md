# SigrikaGo 部署指南

本文档面向单台云服务器部署。当前项目的实时房间、匹配队列和 Socket 在线状态仍以单 Node.js 进程内存为核心，因此生产环境应先使用单实例运行，不要使用 PM2 cluster、多进程负载均衡或多台机器横向扩容。

## 部署前检查

上线前在目标服务器执行：

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run check:production
npm test
```

`npm run check:production` 会检查生产环境中的 `JWT_SECRET`、站点 origin、调试开关和显式多实例配置。生产 origin 必须使用 HTTPS，不能启用测试工具 action；在房间状态和 Socket.IO 适配器改为共享之前，也不能配置 `WEB_CONCURRENCY`、`PM2_INSTANCES` 等多实例参数大于 1。

## 环境变量

生产 `.env` 示例：

```env
NODE_ENV=production
PORT=3001
DATABASE_URL="file:/var/lib/sigrikago/prod.db"
JWT_SECRET="replace-with-at-least-32-random-characters"
PUBLIC_ORIGIN="https://go.example.com"
ADMIN_USERNAMES="moming"
UPLOAD_DIR="/var/lib/sigrikago/uploads"
ENABLE_TEST_ACTIONS="false"
MAX_ONLINE_USERS="500"
MAX_ACTIVE_ROOMS="100"
MAX_SPECTATORS_PER_ROOM="20"
```

字段说明：

- `DATABASE_URL`: SQLite 数据库位置。生产环境建议放在 `/var/lib/sigrikago/prod.db`，不要放在仓库目录或 `dist/` 中。
- `JWT_SECRET`: 生产环境必须换成至少 32 位的随机字符串。
- `PUBLIC_ORIGIN`: 用户访问站点的 HTTPS 地址，例如 `https://go.example.com`。
- `ADMIN_USERNAMES`: 逗号分隔的管理员用户名。服务启动时会把这些用户名提升为管理员。
- `UPLOAD_DIR`: 用户上传资源的持久化根目录。角色立绘上传会保存到 `${UPLOAD_DIR}/characters`，并通过 `/uploads/characters/...` 对外访问。
- `ENABLE_TEST_ACTIONS`: 已不再需要用于本地开发；测试 action 在非生产环境默认可用。生产环境必须为 `false` 或不设置；`npm run check:production` 和服务端运行时都会拒绝生产环境测试 action。
- `MAX_ONLINE_USERS`: 新匹配/约战/观战接入的在线用户软上限，默认 500。不是容量承诺；目标机压测前可保守下调。
- `MAX_ACTIVE_ROOMS`: 新匹配/约战/观战接入的活跃房间软上限，默认 100。达到后已有对局和玩家恢复不受影响。
- `MAX_SPECTATORS_PER_ROOM`: 单个房间首次加入的观战者软上限，默认 20；已有观战者更换连接时仍可恢复。

开发环境若需要显示对局测试按钮，需要同时设置客户端与服务端开关：

```env
# 测试工具在非生产环境默认显示并可用；不要在生产环境开启 ENABLE_TEST_ACTIONS。
```

不要把测试 action 开关带到生产 `.env`。

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
npx prisma generate
npx prisma migrate deploy
npm run build
npm run check:production
```

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

仓库中的完整模板位于 `deploy/nginx/sigrikago.conf`。它不会再把所有请求统一交给 Node，而是按职责拆分：

| 路径 | 处理方 | 生产合同 |
| --- | --- | --- |
| `/socket.io/` | Node/Socket.IO | WebSocket upgrade、关闭 buffering、读写超时 90 秒 |
| `/api/`、`/health/*` | Node/Express | 普通 HTTP 代理，允许响应 buffering |
| `/uploads/` | Nginx alias | 直接读取持久化上传目录，5 分钟可重新验证缓存 |
| Vite hash 资源 | Nginx/CDN | 一年 `immutable` |
| `/assets/**` 命名资源 | Nginx/CDN | 1 小时新鲜期、24 小时 `stale-while-revalidate` |
| `index.html`、SPA 路由 | Nginx | `no-cache`，每次发布可及时发现新入口 |

安装前按实际域名修改 `server_name`：

```bash
sudo cp deploy/nginx/sigrikago.conf /etc/nginx/sites-available/sigrikago
sudo sed -i 's/go.example.com/实际域名/' /etc/nginx/sites-available/sigrikago
```

模板使用 `/opt/sigrikago/dist` 作为前端根目录、`/var/lib/sigrikago/uploads` 作为上传目录。若实际目录不同，必须同步修改 `root` 和 `alias`。Nginx 原生支持音频 Range 请求；只对 HTML、CSS、JavaScript、JSON、XML 和 SVG 启用 gzip，不重复压缩 OGG、WebP、PNG 等已压缩媒体。

启用并申请证书：

```bash
sudo ln -s /etc/nginx/sites-available/sigrikago /etc/nginx/sites-enabled/sigrikago
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d go.example.com
```

### CDN 接入边界

第一阶段不需要修改前端 `/assets/...` URL。可以让 CDN 以 `https://go.example.com/assets/` 为同源加速路径，源站仍指向上述 Nginx；这样不会引入额外的 CORS、媒体权限和 CSP 风险。CDN 规则必须与 Nginx 缓存合同一致：hash 资源可长期缓存，普通命名图片/音乐/语音保持短缓存并允许发布时清理，`index.html` 不进入长期缓存。

后续如果把 `/assets/` 上传到对象存储，应先上传新资源并验证 HTTP 200、Range 和缓存头，最后再发布新的 `index.html`；回滚时保留前一版资源，不能先删除旧 hash 文件。CDN 只负责静态资源，不代理或缓存 `/socket.io/`、动态 `/api/` 和健康检查。

## 2核2G 容量验证

仓库提供隔离数据库、独立 Node 进程和 JSON 报告组成的容量入口。日常 smoke 验证：

```bash
npm run verify:capacity -- --profile smoke
```

smoke 默认覆盖 20 个 Socket、5 个活跃房间、观战、20% 周期重连、对局 action ack、冷静态入口和一次 SIGTERM 重启恢复。报告写入 `artifacts/capacity/`，该目录不提交到 Git。

在实际 2核2G 目标机上运行目标建议线：

```bash
npm run verify:capacity -- --profile target
```

target 默认覆盖 500 Socket、100 个活跃房间、每房 2 个观战连接、动作间隔 7.5 秒、20% 周期重连和整机恢复，持续 120 秒。压测使用独立临时 SQLite 数据库和 `NODE_ENV=capacity`，会创建大量临时账号并启用仅限非生产环境的测试 action，禁止对正式生产数据库或公网正式实例执行。

可用 `--sockets`、`--rooms`、`--spectators-per-room`、`--duration`、`--action-interval`、`--reconnect-ratio` 覆盖参数。报告同时输出冷登录、动作 ack、重连/恢复延迟、CPU、RSS、heap、event-loop delay、Socket/房间/观战数量、发送字节采样以及 SQLite/persistence 错误。建议门槛为 ack p95 `< 200ms`、p99 `< 500ms`、event-loop delay p95 `< 50ms`、RSS `< 1.2GB`、恢复成功率 `> 99%` 且无持久化/结果保存错误；只有目标机报告通过后，才能据此调整线上 soft limit。

## 备份

至少每天备份：

- `/var/lib/sigrikago/prod.db`
- `/var/lib/sigrikago/uploads`

示例：

```bash
mkdir -p /var/backups/sigrikago
sqlite3 /var/lib/sigrikago/prod.db ".backup '/var/backups/sigrikago/prod-$(date +%F).db'"
tar -czf "/var/backups/sigrikago/uploads-$(date +%F).tar.gz" -C /var/lib/sigrikago uploads
```

## 更新流程

```bash
cd /opt/sigrikago
git pull
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run check:production
sudo systemctl restart sigrikago
sudo systemctl status sigrikago
```

更新前建议先备份数据库和上传目录。
