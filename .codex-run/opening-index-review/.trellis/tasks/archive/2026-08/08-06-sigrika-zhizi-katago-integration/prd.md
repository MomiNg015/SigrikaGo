# 接入智子云 KataGo 驱动黑化西格莉卡

## Goal

将智子云 VIP 共享 KataGo 作为黑化西格莉卡特殊决战的首选 NPC 引擎，同时在服务端秘密分析玩家有效落子与 KataGo 候选的吻合程度，为 35 手高吻合度暴走剧情提供可恢复、可测试的服务端触发信号。

触发信号同时驱动可恢复的对局内演出：黑化西格莉卡无语音、玩家卡技能恒为 `？？？ · ？`，第一次行动前展示开场台词与无效果“秘日六席”，作弊判定后依次展示三句台词与无效果“七宗罪”，演出结束后继续正常落子。

## What I already know

* 智子开放 API 使用 REST 登录/会话授权，再通过 Socket.IO v4 桥接 GTP/KataGo；不是单次 REST 落子接口。
* 账号以 `phone` + `password` 登录，智子会话固定使用 `--gpu-type vip-share`、`katago-TENSORRT`、`28bnbt`。
* 2026-08-06 已完成脱离项目代码的实机冒烟测试：账号登录、VIP 权益、`vip-share` 会话、Socket.IO `ready` 和 13 路 KataGo 分析均成功。
* 凭据和用户/Socket 令牌必须仅留在服务端，不进入源码、任务文档、浏览器负载、日志或回放。
* 项目已依赖 `socket.io-client` 4.x，已有 `server/practiceBotEngine.js` 与 `server/practiceRoomAutomation.js` 所形成的“引擎只建议、本地正式动作最终校验”边界。
* 特殊决战 `sigrika-corruption-duel` 是 13 路、无技能、无限时、私密 NPC 对局，适合通过重放纯围棋着手同步 KataGo。
* 当前黑化西格莉卡使用高级 GNU Go，远程引擎失败时应继续按高级 GNU Go → 中级 GNU Go → 入门启发式 AI 降级。
* 玩家 AI 吻合度仅用于一次性隐藏剧情，不用于封禁、判负或公开作弊结论。

## Requirements

### Configuration and security

* 只有服务端读取智子凭据；支持环境变量开关、手机号、密码和可控的固定引擎参数，不接受前端传入任意 `args`。
* 登录所得用户 token 只在内存中缓存；每次新建或重建引擎连接都获取新的 Socket.IO token。
* 日志只记录脱敏状态、错误类型、时延和降级原因，不记录账号、密码、Bearer token 或 Socket token。
* `vip-share` 权益不可用时不得静默切到可能产生额外费用的 `1x/3x/...`，直接进入本地引擎降级链。

### Zhizi/KataGo engine adapter

* 实现可单元测试的智子 REST 客户端、会话生命周期、Socket.IO/GTP 命令队列、分块文本解析、超时、停止和重连。
* 只在自定义 `ready` 后发送 GTP；跟踪 `=`/“`?`”响应；断线后获取新 token 并重放完整棋盘，不假设远程进程状态保留。
* 同步棋盘大小、KataGo 规则、KataGo 贴目和全部落子；服务端动作系统仍是合法性与结算的唯一权威。
* 解析候选着的 `move`、`order`、`visits`、`winrate`、`scoreLead`、`prior` 和 `pv`；字段缺失时按能力降级，不伪造数据。
* 特殊决战的 NPC 回合优先选用 KataGo Top-1 合法候选，仍通过现有正式 `playMove`/动作处理管线提交。
* 每次智子 KataGo 搜索默认且最多运行 5 秒：会话显式下发 `kata-set-param maxTime 5`，`kata-analyze` 到点发送 `stop`，并继续采用 5 秒内已流式返回的智子 Top-1；正常截止不视为本地引擎降级。
* 进程内起步仅保持一个远程共享会话槽；特殊决战进入时预热，空闲或无活跃决战时停止，避免无界并发和浪费 VIP 使用时长。
* 特殊决战房创建成功后立即非阻塞预热：完成登录、`vip-share` 会话申请、Socket.IO `ready` 与 `maxTime 5` 配置，但不启动局面分析；首手搜索与预热重叠时必须复用同一个连接过程。

### Hidden player/AI agreement audit

* 在每个可判定的玩家回合事前秘密保留 KataGo 候选快照；玩家落子后与该快照比较，不用落子后的新局面候选反推。
* 记录累计可判定手数、Top-1/Top-3 命中、平均胜率损失、平均目数损失、明显失误数、最长近优连续和 AI 难手命中数。
* 排除布局热身、强制应手、低搜索量、多个等价候选、停一手、认输和数子操作；胜率饱和区间优先参考目数损失。
* 常规两阶段怀疑条件：滚动 24 个有效落子中 Top-1 ≥ 75%、Top-3 ≥ 92%、平均目数损失 ≤ 0.8、大于 2.5 目的失误最多 1 次、AI 难手命中 ≥ 5；随后 6 个有效落子中至少 5 次 Top-3、平均目数损失 ≤ 1.0，且没有超过 3 目的失误。
* 极端吻合快捷条件：累计至少 35 个可判定玩家落子，Top-1 吻合率 ≥ 90%，且 AI 难手命中 ≥ 6。
* AI 难手默认定义为：玩家命中 `order = 0`，该着在先验概率排名中不高于第 4，且最优着与次优着的目数差至少 1.0；当智子输出不足以支持该判定时，不计难手。
* 审计原始快照和统计不向对局客户端广播；只向服务端剧情状态机提供幂等的一次性触发信号。

### Reliability and lifecycle

* 远程落子搜索超时、掉线、协议错误、无合法候选或权益错误均不直接形成剧情胜负；对当回合使用现有降级引擎。
* 落子决策必须具有 in-flight 锁和局面版本复验，避免重连、超时后迟到响应或重复事件造成重复落子。
* 对局刷新/重连后能根据服务端持久化数据恢复对局与已汇总的审计状态；不保存远程令牌。
* 应用退出、无活跃决战或引擎关闭时必须发送 `stop` 并断开 Socket.IO；异常终止由令牌过期和下次启动的全盘重放收敛。

### Corrupted Sigrika presentation

* 黑化西格莉卡不播放角色语音或 TTS；棋盘落子等普通 SFX 不受影响。
* 玩家卡不接入正式技能系统，技能名恒为 `？？？`、次数恒为 `？`。
* 第一次轮到 NPC 时，按“那么，让你看看才能的差距吧。”→视觉技能“秘日六席”→清场→正常落子的顺序推进。
* 作弊信号触发后，严格按用户给定的三句台词→视觉技能“七宗罪”→清场→正常落子的顺序推进。
* 两个技能都暂时无效果；演出阶段不得改变棋盘、回合、手数、提子、技能状态、胜负或奖励。
* 开场/作弊演出阶段和当前公开演出随房间快照恢复；客户端只收到当前台词/技能，不收到内部阶段和审计证据。

## Acceptance Criteria

* [x] 在凭据完整且 VIP 有效时，`sigrika-corruption-duel` 的 NPC 能通过智子 `vip-share` KataGo 落下合法棋子。
* [x] 智子 KataGo 每手搜索硬上限为 5 秒，到点存在候选时仍使用智子结果；没有候选时不再启动第二个完整 5 秒搜索。
* [x] 特殊决战创建时会后台预热完整智子会话，房间创建不等待远端；预热与首手搜索并发时只申请一个 VIP 共享会话，失败仍按原降级链继续。
* [x] 非特殊决战不会连接智子云，现有准时宝/普通房间行为不受影响。
* [x] 玩家每个可判定落子与事前 KataGo 候选比较，服务端能累积 Top-1/Top-3、损失和难手数据。
* [x] 测试证明常规两阶段条件和 35 个有效落子的极端条件会且只会触发一次隐藏剧情信号。
* [x] 强制应手、低搜索量、等价候选、停一手及结算操作不污染有效手计数。
* [x] 断线、超时、无 VIP、错误凭据和智子返回非法落子时，当回合可降级继续，不重复落子、不泄露密钥、不误判剧情胜负。
* [x] 刷新或服务端恢复后对局与已汇总审计状态保持一致，远程会话使用新 token 和全盘重放重建。
* [x] 单元/集成测试覆盖协议解析、候选选择、吻合度、降级、生命周期和敏感信息边界；智子真账号测试作为可显式开启的实机冒烟测试，不默认进入普通 CI。
* [x] 部署配置、运行时架构、故障降级和隐藏审计边界已同步到系统设计文档，并生成最新 `docs/system-design.html`。
* [x] 黑化西格莉卡玩家卡始终显示 `？？？ · ？`，特殊房不播放角色语音或 TTS。
* [x] 第一次 NPC 回合按指定开场台词、无效果“秘日六席”、正常落子顺序执行，且只执行一次。
* [x] 真实吻合度触发按三句指定台词、无效果“七宗罪”、正常对局顺序执行，不改变正式棋局状态。
* [x] 演出阶段和公开当前演出可跨房间恢复，内部阶段/审计证据不进入安全房间投影。

## Definition of Done

* 实现代码与配置校验完成，不将真实凭据写入工作树。
* 针对性测试、广泛项目检查和智子 VIP 实机冒烟测试通过。
* 系统设计与部署说明更新，`npm run docs:system-design` 通过。
* 现有非相关工作树改动未被覆盖、重置或纳入本任务。

## Technical Approach

* 新增智子云传输/协议适配层，把 REST、Socket.IO 和 GTP 解析隔离在可注入、可测试的服务端模块中。
* 在现有练习/NPC 自动化边界上增加引擎路由；只对 `sigrika-corruption-duel` 选智子 KataGo，引擎输出继续走本地权威动作处理。
* 将“落子建议”与“玩家事前分析快照”作为同一 KataGo 会话上的串行任务，使用会话世代/局面版本丢弃迟到结果。
* 审计策略保持为纯函数域模块，快照与汇总由特殊决战服务端状态持有，结果只写入一次性剧情信号。
* 默认只开一个远程会话，串行处理当前决战；后续如需并发再在会话管理边界扩展池化。

## Decision (ADR-lite)

**Context**：黑化西格莉卡需要比本地 GNU Go 更强的对局引擎，同时需要多候选、胜率和目数数据来实现隐藏吻合度剧情。

**Decision**：使用服务端托管的智子云 VIP 共享 KataGo，对特殊决战优先提供 NPC 落子与玩家事前候选快照；本地动作管线保持权威，GNU Go 链保持为免费降级路径。

**Consequences**：需要处理远程会话、时延、掉线、权益和敏感凭据；但剧情、房间、落子合法性与结算不依赖智子云持续可用。

## Out of Scope

* 不将 KataGo 开放给普通准时宝、PVP、教程或浏览器直连。
* 不向玩家展示实时胜率、候选着、“作弊分数”或审计原始数据。
* 不根据吻合度自动封禁、判负、扣分或对外宣称玩家作弊。
* 不实现多智子账号轮询、多 GPU 付费档位自动切换、前端自定义引擎参数或通用 KataGo 管理后台。
* 不为暴走剧情制作新美术、语音或真实技能效果；本任务只实现用户指定的文字与视觉技能名演出。

## Technical Notes

* Research reference: [`research/zhizi-katago-integration.md`](research/zhizi-katago-integration.md) documents the public protocol, live capability probe, repository integration boundary, and the internal-komi-to-GTP conversion.
* 智子开放 API：`https://github.com/kinfkong/zhizi-open-api`。
* 公开登录合同：`POST https://www.zhizigo.com/api/cluster/account/login`，请求体使用 `phone` 或 `email` 之一与 `password`。
* 会话参数：`--platform all --engine-type go --gpu-type vip-share --kata-name katago-TENSORRT --kata-weight 28bnbt`。
* Socket.IO path 为 `/socket.io.v4`，query 为 `zz-socketio-token`，必须等待自定义 `ready`。
* 空盘实机测试已确认智子输出至少包含 `move`、`visits`、`winrate`、`scoreLead`、`order`。
* 需在实现前核对 `src/shared/gameScoring.js` 的内部贴目单位与 GTP/KataGo `komi` 单位；特殊决战配置的内部 `2.75` 可能对应 KataGo 的 `5.5`，必须由现有结算测试确认，不可盲目复制。
