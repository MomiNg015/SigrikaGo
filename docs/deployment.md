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

`npm run check:production` 会检查生产环境中的 `JWT_SECRET` 和站点 origin。生产 origin 必须使用 HTTPS。

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
```

字段说明：

- `DATABASE_URL`: SQLite 数据库位置。生产环境建议放在 `/var/lib/sigrikago/prod.db`，不要放在仓库目录或 `dist/` 中。
- `JWT_SECRET`: 生产环境必须换成至少 32 位的随机字符串。
- `PUBLIC_ORIGIN`: 用户访问站点的 HTTPS 地址，例如 `https://go.example.com`。
- `ADMIN_USERNAMES`: 逗号分隔的管理员用户名。服务启动时会把这些用户名提升为管理员。
- `UPLOAD_DIR`: 用户上传资源的持久化根目录。角色立绘上传会保存到 `${UPLOAD_DIR}/characters`，并通过 `/uploads/characters/...` 对外访问。

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
git checkout codex/denia-bubble-gif
```

写入 `.env` 后执行构建和迁移：

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run check:production
```

## systemd 服务

创建 `/etc/systemd/system/sigrikago.service`：

```ini
[Unit]
Description=SigrikaGo
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/sigrikago
EnvironmentFile=/opt/sigrikago/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
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

## Nginx 与 HTTPS

Nginx 需要代理 HTTP 与 Socket.IO WebSocket：

```nginx
server {
    listen 80;
    server_name go.example.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

启用并申请证书：

```bash
sudo ln -s /etc/nginx/sites-available/sigrikago /etc/nginx/sites-enabled/sigrikago
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d go.example.com
```

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
