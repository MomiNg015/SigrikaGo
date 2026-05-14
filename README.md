# SigrikaGo

13路二次元技能围棋联网 MVP。当前版本包含 React/Vite 前端、Node/Express + Socket.IO 后端、Prisma + SQLite 数据模型、共享围棋规则引擎，以及西格莉卡/达妮娅两个角色。

## 本地运行

1. 复制环境变量：

```powershell
Copy-Item .env.example .env
```

2. 安装依赖并初始化数据库：

```powershell
npm install
npm run prisma:generate
npm run prisma:push
```

3. 启动前后端：

```powershell
npm run dev
```

前端默认运行在 Vite 输出的地址，后端默认是 `http://localhost:3001`。

## 已实现

- 用户名密码注册/登录，密码哈希存储。
- 棋舍、空想对局、观战、商城入口。
- 两人 Socket.IO 匹配、随机5位房间号、观战加入、房间聊天。
- 13路棋盘、提子、禁自杀、劫、连续弃手进入数子。
- 西格莉卡“星辰符文”：抹除空交叉点并断开邻接。
- 达妮娅“染秽”：指定棋子反色并重算局面。
- 中国数子规则，黑贴 2.75 子，结果显示为“黑/白胜X子”。
- 数子申请、30秒超时拒绝、死子/非目标记、双方确认结果。

## 验证

```powershell
npm test
```

当前规则测试覆盖提子、禁自杀、劫、连续弃手、技能和贴子结算。
