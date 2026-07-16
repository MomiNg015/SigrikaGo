# 数据模型与领域系统

本文记录 Prisma 模型、核心领域数据、抽卡/商城/奖励/段位等跨前后端共享概念。新增模型、迁移、领域字段或兼容镜像字段时优先更新本分篇。

## 当前结论

- 账号资产正在从字符串字段逐步迁移到结构化关系表，旧字段仍承担兼容镜像职责；legacy 字段解析、结构化同步和公开资产合并边界集中在 `server/userAssets.js`。
- 模式化对局数据以 `mode` 串联房间、记录、排行榜、履历和用户模式统计。
- `gomoku` 是独立统计桶：既有用户通过迁移和 `ensureGameModeSchema()` 回填 `UserModeStats(mode=gomoku)`，默认 `rating=1000`、`rank=3段`、`recentResults=''`、胜负和棋全为 0；排行榜仍只展示该模式已有完成对局的用户。
- 抽卡是独立奖励子系统，和商城购买共享角色、装饰、音乐、道具等资源目录。

## 4. 数据模型与字段说明

数据源定义在 `prisma/schema.prisma`，数据库为 SQLite。

### Admin Deployment Defaults

Non-user admin deployment defaults live in `server/adminDefaultSnapshot.js`, generated from the local `prisma/dev.db` admin configuration with `npm run admin:snapshot`. `seedAdminDefaultConfig()` runs during startup after schema guards and before built-in seeders; it treats the committed snapshot as bootstrap defaults for missing non-user admin rows, so a fresh database receives the current site settings, skill-trait glossary, character/skill descriptions and system messages, character CV credits, decorations, shop items with illust credits, gacha pools/prizes, achievement rewards/achievements, music display names, story/tutorial scripts, announcement/changelog entries, the legacy onboarding singleton, and recruitment-related admin defaults. Existing rows are preserved so runtime edits made through the admin console remain durable across backend restarts. User accounts, user-owned assets, purchases, feedback, reports, audit logs, analytics events, announcement read-state, mailbox batches/messages, game records, and live-room state are intentionally outside this snapshot. `SiteSetting` and `MusicTrackSetting` use upsert create paths with empty update payloads; catalog/content seeders find rows by stable key/slug/id and skip existing rows instead of rewriting admin-managed fields. Default skill traits use committed stable IDs, so renaming a seeded term does not recreate its old name on the next startup. When an admin-console edit should become a durable project default instead of only a local SQLite value, regenerate the snapshot with `npm run admin:snapshot` and commit it.

### User

用户账号与资产/战绩。

- `id`: 主键 cuid。
- `username`: 唯一用户名。注册/用户搜索校验只允许中文、日文、韩文、半角英文、数字和下划线；按显示宽度限制为最多 8 个半角字符宽度，等价于最多 4 个中日韩字符或 8 个半角字符。 Legacy startup cleanup trims overlong existing usernames to the trailing 8 display-width units and adds a short numeric marker only when needed to preserve username uniqueness.
- `passwordHash`: bcrypt 哈希密码。
- `role`: 用户角色，当前代码使用 `player` / `admin`。
- `status`: 用户状态，当前代码使用 `active` / `banned`。
- `banReason`: 封禁原因，可空。
- `bannedAt`: 封禁时间，可空。
- `rank`: spark 兼容字段，schema 默认值为 `3段`；公开展示优先读取当前模式 `UserModeStats.rank`，spark 结算会同步该字段。
- `rating`: 积分，默认 1000，允许为负数。积分继续用于积分榜排序、奖励流水和积分解锁，但不再决定段位。
- `UserModeStats.rank`: 模式独立段位，新用户/新模式默认 `3段`，最高 `9段`，最低 `18级`。
- `UserModeStats.recentResults`: 模式独立升降级窗口，CSV 存储 `win/loss`，最多 10 个，从老到新；和棋不进入窗口，升降级触发后写回空字符串。
- `wins`: 胜局数，默认 0。
- `losses`: 负局数，默认 0。
- `coins`: 金币，默认 300。
- `selectedCharacter`: 出战角色 slug，默认 `sigrika`。
- `selectedStoneDecoration`: 当前应用的棋子装饰 slug，空字符串表示默认棋子样式。
- `ownedCharacters`: 逗号分隔的角色 slug 字符串，默认包含内置角色并使用 canonical `denia`。启动清理会把旧达妮娅 slug `danea`/`denea` 迁移到 `denia`。
- `ownedItems`: JSON 数量表字符串，例如 `{"dream-ticket":2}`；兼容旧逗号分隔字符串读取，API 对外返回 `{ itemId, quantity }` 数组。
- `itemPurchaseCounts`: JSON 数量表字符串，例如 `{"rainbow-bean-candy":3}`；记录每个用户已从商店购买道具的次数，用于计算用户独立的商店库存，不随道具使用而减少。
- `itemEffects`: JSON 状态字符串，当前支持 `sigrikaCandyDisabled` 与 `deniaRainbowGlow` 两个彩虹豆豆跳跳糖临时效果。
- `ownedDecorations`: 逗号分隔装饰 slug。
- `createdAt`, `updatedAt`: 创建和更新时间。

`server/userAssets.js` 是账号资产兼容边界：`parseAssetList()` / `parseOwnedItemCounts()` 处理旧字符串和公开数组 payload，`syncStructuredUserAssets()` 将 legacy 字段替换式同步到 `UserCharacter`、`UserDecoration`、`UserItem` 和 `UserItemEffect`，`publicUserAssets()` 合并 legacy 字段与已加载结构化关系并补齐内置/积分解锁角色、角色羁绊次数和道具效果。`server/db.js` 的 `publicUser()` 只组合账号基础字段、模式战绩、音乐设置和该资产投影，不再重复资产兼容规则。

`User.musicSelections` 的技能选曲 JSON 保持向后兼容：普通技能使用 `skill[characterId] = trackId`，派生技使用 `derivedSkill[characterId][effectType] = trackId`。服务端音乐选择边界按角色与效果类型验证曲目归属和库存后只更新对应槽位，因此派生技选择不会覆盖普通技能选择，也不需要新增数据库列或迁移旧 JSON。

Character-target inventory item use loads structured `userCharacters` and validates ownership through `publicUserAssets()`. During the legacy-to-structured migration, structured ownership rows can satisfy character targeting even when the old `ownedCharacters` string mirror is stale.

仇远（`qiuyuan`）是内置剑客角色，立绘位于 `/assets/characters/qiuyuan.png`，获得方式文案为“部员招募获得”。莫宁（`mornye` / Mornye）是内置科学家角色，立绘位于 `/assets/characters/mornye.png`，获得方式文案为“招募获得”。部员招募尚未实装时，`server/userAssets.js` 将这类角色视为管理员限定资源：管理员公开资产会自动补齐 `qiuyuan` 和 `mornye`，普通玩家不会默认拥有或部署。

### LoginSession

持久化登录会话表，用于 refresh cookie、单账号单会话和服务重启后的登录恢复。

- `id`: session id，会写入 access token 的 `sid` claim。
- `userId`: 归属用户 id。
- `refreshTokenHash`: refresh token 的 SHA-256 哈希，数据库不保存明文 refresh token。
- `revokedAt`: 撤销时间；主动登出、强制登录或创建新 session 时写入。
- `expiresAt`: refresh session 过期时间。
- `lastSeenAt`: 最近一次 HTTP/Socket 鉴权或 refresh 时间。
- `createdAt`, `updatedAt`: 创建和更新时间。
- `createLoginSessionStore().replace(userId)` 在单实例进程内按 `userId` 串行执行；数据库路径在同一 Prisma 事务中撤销该用户全部 active rows 并创建新 row，两个重叠 replacement 最终只保留后完成的新 session。
- 后台“今日登录用户数”和时长榜第一版从该表估算：`createdAt` 落在 Asia/Shanghai 当日的 session 计入登录事件，`userId` 去重得到唯一登录用户，`lastSeenAt - createdAt` 暂作为会话时长估算。后续若接入前端活跃事件或 Socket 活跃心跳，应新增专门活动表或快照，不应把估算口径伪装成精确活跃时长。

### UserRelationship

用户关系表，用于好友与黑名单。

- `ownerUserId`: 关系拥有者。
- `targetUserId`: 关系目标用户。
- `type`: 当前使用 `friend` 或 `blacklist`。
- 同一个 `ownerUserId + targetUserId` 只有一条记录；好友和黑名单互斥，通过更新 `type` 覆盖。
- 关系写入使用 raw SQL upsert，并显式写入 `createdAt` / `updatedAt`，避免开发库通过 Prisma push 建表时 `updatedAt` 没有数据库默认值而触发 NOT NULL 约束错误。

### UserProfileLike

用户资料点赞明细表，用于收到的点赞总数和每日点赞限制。

- `likerUserId` / `targetUserId`: 点赞者与被点赞用户；自赞在领域层拒绝，黑名单关系不影响点赞。
- `dayKey`: 服务端按 Asia/Shanghai 自然日生成的 `YYYY-MM-DD`，与 `likerUserId + targetUserId` 组成唯一键，保证同一用户每天最多给同一目标点赞一次。
- 资料查询通过 raw SQL 统计 `targetUserId` 的总点赞数，并检查当前查看者当天是否已点赞。

### UserReport

用户资料举报表，用于后台只读查看用户提交的举报。

- `reporterUserId` / `reportedUserId`: 举报者与被举报者；自举报在领域层拒绝，黑名单关系不影响举报。
- `reporterUsername` / `reportedUsername`: 提交时用户名快照，避免后续改名影响历史举报可读性。
- `content`: 复用反馈内容校验，去掉控制字符、trim 后非空且最长 400 字。
- 后台当前只按 `createdAt desc` 展示最新 100 条；处理状态和通知用户等行为等待未来管理员邮件系统。
- 已在 `prisma/schema.prisma` 声明，并通过 `202605220001_add_user_relationship` migration 固化建表和索引；服务启动时仍保留 `ensureSocialSchema` 作为开发库兜底。

### GameRecord

结束对局记录。

- `id`: 主键 cuid。
- `roomCode`: 房间号。
- `blackUserId`, `whiteUserId`: 黑白双方用户 id。
- `blackName`, `whiteName`: 保存时的用户名快照。
- `blackCharacter`, `whiteCharacter`: 双方角色 slug 快照。
- `resultText`: 结果文本。
- `moveCount`: 手数。
- `snapshot`: JSON 字符串，保存 `roomView` 快照。
- `createdAt`: 创建时间。
- `mode`: 对局模式快照，当前支持 `spark`、`standard`、`gomoku`；排行榜、履历、公开资料和回放按该字段过滤。
- `rated`: whether the game affects rating, rank, public profile stats, leaderboard stats, and recent-results windows. Matchmaking games are rated; direct/private duel games are friendly and unrated.
- `matchSource`: source snapshot, currently `matchmaking` or `duel`, used by replay and result UI to mark friendly games.
- `blackRatingDelta`, `whiteRatingDelta`: settled rating audit deltas for both sides; friendly games store 0.
- `blackCoinsDelta`, `whiteCoinsDelta`: settled coin audit deltas for both sides; friendly games respect the server-day reward limit.
- `blackRankDelta`, `whiteRankDelta`: rank movement audit value, where promotion is 1, demotion is -1, and no movement is 0.
- 后台分析第一版使用 `createdAt`、`mode`、`moveCount`、`resultText` 和 `resultReason` 统计今日完成对局、分模式完成数、平均手数和粗略无效局。房间创建数、中断率、预加载超时、重连恢复等实时事件尚无完整持久化事件源时必须标为 `待接入`。

### Gomoku Domain

`gomoku` 五子棋模式使用 `src/shared/gomokuRules.js` 的共享规则：13 路棋盘，黑白轮流落子，精确五连立即获胜，满盘未分胜负为和棋。黑方禁手在落子前阻止并向行动方返回错误，覆盖长连、双四和有效双三；MVP 不做完整连珠递归禁手推演。五子棋不允许 pass，不进入数子/死子标记流程，也不允许主动或被动技能。 A decisive five-in-row result records the exact five point ids in `winner.winningLine`; live clients show the result modal immediately while the board keeps those stones highlighted, and replay views only render the same persistent highlight.

### Character

可配置角色。

- `id`: 主键 cuid。
- `slug`: 唯一角色标识，用于前端匹配、出战角色、拥有角色、棋谱角色字段。
- `name`: 角色名。
- `portraitUrl`: 立绘 URL 或静态路径。
- `portraitSource`: `url` 或 `upload`。
- `palette`: 代表色。
- `acquisitionMethod`: 获得途径纯文本，显示在棋舍角色详情中。
- `description`: 角色描述纯文本，显示在棋舍角色详情的获得途径下方，以紫色斜体正文展示且不额外显示字段标签，可由后台角色管理编辑；空值会回退到内置角色默认描述。
- `cvName`, `cvUrl`: 角色配音人员展示信息。后台角色管理可填写 CV 名称和可选链接；`cvUrl` 只接受 `http://`、`https://` 或站内 `/...` 路径，并且必须与非空 `cvName` 同时存在。公开角色 payload 会透传这两个字段，棋舍角色详情在空名称时隐藏标签。
- `enabled`: 是否启用。
- `sortOrder`: 排序。
- `skill`: 一对一 `CharacterSkill`。
- `createdAt`, `updatedAt`: 创建和更新时间。

### CharacterSkill

角色技能配置。

- `id`: 主键 cuid。
- `characterId`: 关联 `Character.id`，唯一。
- `effectType`: Skill effect type; currently supports `erase-point`, `flip-stone`, `hidden-hand`, `voyage-star`, `protocol-takeover`, `random-blast`, `spray-stone`, `color-illusion-passive`, `row-slash`, `double-move`, and `liberty-purge`.
- `name`: 技能名。
- `description`: 技能描述。
- `uses`: 每局使用次数。
- `freeTurn`: 是否不消耗回合。
- `targetRule`: Targeting rule; currently validated as `empty-point`, `stone`, `any-point`, `legal-move-point`, or `none`. `random-blast` and `double-move` use `none`; Chisa `liberty-purge` uses `legal-move-point` so the target must pass ordinary move legality on the server.
- `paramsJson`: JSON 字符串，当前作为扩展参数保留。基础技能可在 `params.derivedSkills[]` 显式保存代码定义的派生技能；每条定义包含稳定 `id`/`effectType` 以及名称、描述、次数、回合行为、目标规则、超频和可选音乐标识。空数组严格表示没有派生技能，通用解析不得从其他角色注入默认定义。爱弥斯在自己的默认数据中显式配置 `voyage-star`，未来角色沿用同一结构而不需要 Prisma migration。
- `costType`: `numeric` 或 `special`。
- `costValue`: 超频值；`numeric` 会参与数子扣分，`special` 当前仅展示。
- `systemMessage`: 技能系统消息模板。
- `enabled`: 是否启用；公开角色 payload 会过滤禁用技能。技能启用状态属于代码/数据结构逻辑，后台角色表单不允许修改。
- `createdAt`, `updatedAt`: 创建和更新时间。

后台角色技能写入是内容覆盖而不是结构覆盖：`PATCH /api/admin/characters/:id` 只接受基础技能与既有派生技能的 `name`、`description`、`costValue` 变化。服务端以当前 `CharacterSkill` 和 `params.derivedSkills[]` 为权威，拒绝效果类型、目标规则、次数、回合行为、参数、超频类别、音乐、启用状态以及派生数组身份/数量/顺序变化。`seedCharacters()` 只补代码默认数据中新出现而数据库缺失的派生定义，不覆盖已有定义的后台内容字段。

### SkillTrait 与结构化技能说明

`SkillTrait` 是独立的运营文案模型，字段为稳定 `id`、唯一 `name`、必填 `definition`、`sortOrder` 与创建/更新时间。名称在服务端去除首尾空白后允许 1–8 个字符，只禁止 `【` / `】`；它不关联 `CharacterSkill` 外键，也不参与技能效果、发动资格、次数、回合行为或超频结算。首批稳定词条为 `疾走`、`禁先`、`被动`、`派生`。`ensureSkillTraitSchema()` 在默认配置和角色读取前为旧 SQLite 建表/建唯一索引，Prisma migration `202607130001_add_skill_traits` 固化同一结构。

技能描述继续是可编辑字符串，唯一结构化引用语法为精确 `【名称】`。基础技能和 `params.derivedSkills[]` 的描述保存前统一读取当前词典，拒绝未知名称和同一描述内的重复引用；合法词条可以位于任意位置、彼此不连续，展示层严格保留作者顺序，不从 `freeTurn`、`passive`、`effectType` 或其他玩法字段自动推导。已识别词条使用原生行内按钮提供点击和键盘语义，但视觉必须保持为下划线文本，Bright School 等最终主题层需要显式清除通用按钮的底板、边框、圆角、阴影和位移。粗指针环境不得用 `min-height` 扩大行内按钮盒；按钮保持 `min-height: 0` 和正文行高，额外触控范围由不参与布局的绝对定位伪元素提供。玩家端通过公开 `GET /api/skill-traits` 维护模块级共享快照；首帧同步使用 `DEFAULT_SKILL_TRAITS` 保障已确认内置词条可交互，成功响应后替换快照并通知所有 `SkillDescription`，请求失败时保留最近成功值或内置兜底、清除失败 Promise 并定时重试，不能把失败伪装成可永久缓存的空词典。服务端明确返回的合法词典仍是最终展示事实；历史描述中的未知标记保留完整 `【词】` 普通文本，不隐藏正文、不让页面报错。后台保存后刷新自身列表，已经打开的玩家页面不接收后台实时推送，重新加载/重新进入后再读取。

后台“特性词”是独立主导航，管理接口支持列表、新增、编辑和删除。列表同时扫描基础/派生描述并返回角色、技能类型和技能名引用位置；删除存在引用的词条返回 `409` 和 `references`，前端展示引用并禁用危险操作。重命名在单个数据库事务内用精确旧 token 替换全部基础技能描述和派生技能 JSON，再写入新名称和审计日志，避免词典与描述短暂失配。角色编辑页的基础/派生描述框使用同一词典选择器，在当前选区插入 `【名称】`、恢复焦点，并过滤已经引用的词条。

固定超频展示只读取基础或派生技能的 `costValue`：棋舍角色详情在技能名后绘制红字、浅红底、细边框 `超频：X` 徽标；房间/剧情教学的技能说明把红色 `超频：X` 作为正文前独立首行。手机角色详情的弹窗壳是长内容滚动所有者，使用纵向自动滚动、横向裁切和顶部对齐，最终 Bright School portrait 层必须重复该所有权，不能让较早的 `overflow: hidden !important` 截断技能说明。对局和回放的 `PlayerInfo` 按 `characterId` 优先从当前前端角色目录解析基础技能展示文案，避免房间创建时缓存的旧 `characterConfig` 覆盖新特性词；目录没有该角色时才退回房间快照。当前生效的派生技能继续从对局/回放状态读取次数、来源点和已消耗状态，但名称、描述与固定超频用当前基础技能 `params.derivedSkills[]` 的同 `effectType` 定义覆盖，从而让基础/派生文案在角色详情、对局和回放保持一致。移动房间词条解释层通过 portal 挂到 `document.body`，并把收到的房间浮层基准至少钳到 `120` 后再使用共享 `+21` 层级，保证它高于技能详情壳且打开解释时不关闭下层详情。仇远 `row-slash` 与千咲 `liberty-purge` 的基础 `costValue` 均为 `0`，所以标题显示 `超频：0`，按移除棋子动态增减的公式仍是普通正文。启动任务 `migrateBuiltinSkillDescriptions()` 在角色 seed 后执行幂等精确迁移，只移除已知内置文案中的固定超频片段和已由 `疾走` / `禁先` / `被动` / `派生` 替代的原句；无法精确匹配的管理员自定义描述保持不变。

### Neutral Stones

`src/shared/gameConstants.js` 维护命名中立棋子类型，当前内置 `spray`，由琳奈 `spray-stone` 技能生成。中立棋子不是黑白任一方，但同名中立棋子属于同一阵营并按围棋气规则连接；不同阵营之间互相阻断气和领地。黑/白棋子转化为喷涂棋子时立即给对手 `skillRemovals +1`，中立棋子被提、被爆破、被死子标记或在技能后无气清理时不提供黑白除子。数子阶段中立棋子不计入黑白子数，可作为边界参与空点归属；被中立棋子或多阵营共同围住的空点保持中立。

### Capture Rules

普通落子和先落子再按普通规则提子的技能入口共用 `collectNeighborCaptures()` 收集相邻无气棋串。该 helper 先按棋串去重，再写入本手 `history.captures` 和 `game.captures[color]`，因此同一被吃棋串即使从多个相邻方向贴着新落子点，也只按棋串真实棋子数计一次提子。命名中立棋子仍可被普通提走并从棋盘清除，但不会给黑/白任一方增加提子数。

### Row Slash Skill

`row-slash` 是仇远“一斩足矣”的主动棋盘技能。目标规则为 `any-point`，只能指定当前棋盘内仍有效的交叉点；空点和已有棋子均可指定，被抹除的无效点不可指定。技能横向处理目标所在行，直接移除该行所有黑棋、白棋、命名中立棋子、隐藏手棋子和幻色棋子，并清除劫状态。直接移除的黑白棋子按真实颜色给受益方增加 `skillRemovals`；中立棋子参与仇远超频增加但不提供黑白除子；隐藏手被直接移除时不产生发现提示；幻色棋子按真实颜色结算并清掉幻色状态。直接移除后会自动清理因此无气的棋串，后续清理仍计入 `skillRemovals`，但不再增加仇远超频。

该技能基础超频消耗为 `0`，然后按直接移除棋子数追加超频，每枚直接移除棋子 `+1`；空行可以发动并消耗技能/回合，但追加超频为 `0`。发动后消耗本回合，重置连续虚手，`moveNumber +1`，并在 `rowEffects` 中记录一条公开横斩视觉标记。该标记只影响显示，不改变交叉点有效性，记录 `clearAfterColor: opponent(owner)`，并在对手下一次行动（普通落子、弃手或消耗回合技能）后清除。

`protocol-takeover` 是莫宁“协议接管”的主动棋盘技能。目标规则为 `empty-point`，只能指定当前棋盘内有效、空置、未被协议标记的交叉点。技能在点位上写入 `protocolBan = { owner, bannedColor, effect: "protocol-takeover" }`，其中 `owner` 是施放方，`bannedColor` 是对手。协议标记是公开点位状态，会随房间广播、观战和回放同步；被禁方不能在该空点普通落子，也不能把该空点作为空点/任意点指定类技能目标。若该点后来存在棋子，石子目标技能仍可指定该棋子，普通提子、翻转、横斩、随机爆破和喷涂等非抹除效果不会清除协议标记；只有 `erase-point` 抹除交叉点时会同步删除 `protocolBan`。数子时协议空点对 `bannedColor` 保持中立，不计入被禁方领地，但区域遍历仍把该点当作空区域的一部分，所以不会把同一块领地拆开或污染其它空点归属。莫宁技能超频为 `2`，`freeTurn: true`，发动后不消耗本回合。

### Decoration

装饰配置。

- `id`: 主键 cuid。
- `slug`: 唯一装饰标识。
- `name`: 装饰名。
- `description`: 描述。
- `imageUrl`: 图片地址。
- `enabled`: 是否启用。
- `sortOrder`: 排序。
- `createdAt`, `updatedAt`: 创建和更新时间。

### ShopItem

商城商品。

- `id`: 主键 cuid。
- `name`: 商品名。
- `category`: `character`、`item`、`decoration` 或 `music`。
- `targetId`: 商品对应角色 slug、道具 slug 或装饰 slug。
- `itemTargetType`: 道具目标类型，`self` 表示用户自己，`character` 表示需要选择拥有角色；非道具商品忽略。
- `stockQuantity`: 道具商店库存上限，`-1` 表示不限量，`0` 表示对每个用户均售罄，正整数表示每个用户可购买次数；非道具商品忽略。
- `priceCoins`: 原价金币。
- `discountPercent`: 折扣百分比 0-100。
- `purchasable`: 是否可购买。
- `enabled`: 是否展示。
- `sortOrder`: 排序。
- `description`: 描述。
- `imageUrl`: 图片地址。
- `illustName`, `illustUrl`: 商品图插画署名。后台商品管理可填写 illust 名称和可选链接；`illustUrl` 只接受 `http://`、`https://` 或站内 `/...` 路径，并且必须与非空 `illustName` 同时存在。公开商城 payload 会透传这两个字段，商品详情在空名称时隐藏标签。
- `createdAt`, `updatedAt`: 创建和更新时间。

### AdminAuditLog

后台审计日志。

- `id`: 主键 cuid。
- `adminUserId`: 操作管理员用户 id。
- `action`: 操作类型，如 `user.update`、`character.update`。
- `targetType`: 目标类型，如 `user`、`character`。
- `targetId`: 目标 id 或 slug。
- `beforeJson`: 操作前 JSON，可空。
- `afterJson`: 操作后 JSON，可空。
- `createdAt`: 创建时间。

### SiteSetting

站点级公开配置，以 key/value 形式存储，方便后续扩展更多大厅文案或全局展示配置。

- `key`: 主键。当前使用 `homeTitle`、`homeSubtitle`、`aboutText`、`footerText` 与 `preloadTips`；`preloadTips` 以换行文本存储加载页提示语集合。
- `ratingRules`: JSON SiteSetting value for dynamic rating, rank-gap scaling, optional anti-boosting, rank-change rating delta, and friendly-match coin limits.
- `value`: 配置值字符串。
- `createdAt`, `updatedAt`: 创建和更新时间。

### AnnouncementEntry

后台维护的公告与更新日志内容表。

- `kind`: `announcement` 或 `changelog`。公告可置顶；更新日志不使用置顶。
- `title`: 标题，服务端限制 80 字符。
- `body`: Markdown-lite 正文，服务端限制 10000 字符；草稿可为空，发布时必须非空。
- `isPublished`: 是否对玩家可见。
- `pinned`: 公告置顶标记；玩家公告列表按置顶优先，再按首次发布时间倒序。
- `firstPublishedAt`: 首次发布时间。第一次发布时写入，后续编辑、取消发布、再发布都不重置；玩家列表排序和未读资格都以该字段为准。
- `deletedAt`: 软删除时间。后台普通列表和玩家列表都隐藏软删除条目，当前不提供恢复入口。
- `createdAt`, `updatedAt`: 创建和更新时间。

### AnnouncementRead

玩家公告/更新日志已读表。

- `userId`: 玩家 id，关联 `User`。
- `announcementId`: 内容 id，关联 `AnnouncementEntry`。
- `readAt`: 最近一次打开详情并写入已读的时间。
- `(userId, announcementId)` 唯一。未读摘要不预先给所有用户落行，而是按“已发布且 `firstPublishedAt > User.createdAt` 且没有已读行”即时计算，因此账号创建前首次发布的历史内容可见但不算未读。

公告 schema 由 migration `202606280001_add_announcements` 固化，并由启动兼容 guard `ensureAnnouncementSchema()` 兜底老本地 SQLite；`server/schemaIntegrity.test.js` 检查 Prisma model 与 migration 同步。

## Achievement Domain

- `AchievementRewardAsset` 定义成就奖励资产，字段包括 `type`、`name`、`description`、`imageUrl`、`text`、`targetType`、`targetId`、`amount`、`enabled`、`deletedAt` 和 `sortOrder`。奖励类型支持 `currency`、`title`、`badge`、`nameplate`、`character`、`decoration`、`item`、`music`；称号、徽章和用户名背景只作为个性化装备资产，角色/装饰/道具奖励必须指向 `source = "achievement"` 的限定资源。
- `Achievement` 定义成就目标，使用唯一 `key`、显示 `name`、`content`、`conditionType` 和 JSON 字符串 `conditionParams` 描述判定规则，并可关联一个 `AchievementRewardAsset`。`key`、`conditionType`、`conditionParams`、`enabled` 和 `deletedAt` 属于代码/种子维护的目标逻辑，后台只允许修改 `name`、`content`、`rewardAssetId` 和 `sortOrder`；历史 `UserAchievement` 不删除。
- `seedBuiltinAchievements` 在 `ensureAchievementSchema` 之后运行，只在缺失时创建内置成就与奖励资产，避免启动时覆盖后台后续对成就名、描述、奖励和排序的编辑；当前内置事件成就 `denia-rainbow-bean-candy` 仅在新增后收到对应触发事件时解锁，奖励 100 金币。
- 内置成就还包括 `sigrika-spark-100-wins`，通过 `mode_character_wins` 条件统计指定模式与角色的胜场，当前配置为西格莉卡在 `spark` 模式 100 胜，奖励 `/assets/achievements/semantic-nameplate.png` 用户名背景；启动 seed 会为管理员补齐所有内置成就的 `UserAchievement`，并设置 `rewardGrantedAt`，保证管理员默认可装备新增奖励。
- `UserAchievement` 记录用户已达成状态，包含 `achievedAt` 与 `rewardGrantedAt`，并以 `userId + achievementId` 保证幂等。`AchievementCounter` 保存上线后计数型指标，如购买次数、抽卡次数、登录天数或触发事件累计；可从历史数据回溯的对局、胜场、角色胜率、拥有资产数量等由 `server/achievements.js` 实时聚合。
- `UserAchievementEquipment` 保存用户当前装备的 `titleAssetId`、`badgeAssetId` 和 `nameplateAssetId`。更新装备时只允许选择该用户已达成成就解锁的对应类型奖励资产。
- 用户资料与装备接口除返回 `achievementEquipment` id 外，还会返回当前槽位对应的 `achievementEquipmentAssets` / `equipmentAssets`，让前端无需再次查表即可渲染称号、徽章和用户名背景图片。`attachAchievementEquipmentAssetsToUsers` 用于批量装饰用户列表，socket 登录用户、排行榜用户和社交用户列表/资料都走这条路径，确保任何拿到完整用户对象的用户名展示点具备同一套个性化资产。
- `ensureAchievementSchema` 是旧 SQLite 兼容入口，负责创建成就相关表和索引，并为 `Character` 添加 `source`、`cvName`、`cvUrl` 字段，为 `Decoration` 添加 `source` 字段，为 `ShopItem` 添加 `source`、`illustName`、`illustUrl` 字段；`server/serverStartup.js` 会在角色与商店种子任务之前执行该 guard，避免 Prisma 在旧库缺少这些列时先读取这些模型。

## Mailbox Data Model

- `MailboxBatch` records one admin send operation: admin user id, target mode, optional selected recipient id, title/body, serialized attachment payload, future-user eligibility, delivered/skipped counts, and creation time.
- `MailboxMessage` records one delivered user-visible message: recipient user id, optional batch id, title/body, serialized attachment payload, read/claim/delete timestamps, and creation time. `deletedAt` is a soft-delete marker so future-eligible global batches cannot be redelivered after a player removes a visible message.
- Each user mailbox is capped at 20 visible non-deleted messages. Before delivery, the domain soft-deletes the oldest safe messages that are already read and have no unclaimed attachment. If no safe space exists, delivery is skipped instead of deleting claimable rewards.
- A message with an unclaimed attachment is not deletable. Claiming is idempotent at the domain level by checking `claimedAt` and the attachment type before mutating coins or inventory.
- The schema is backed by migrations `202606220001_add_mailbox_system` and `202606220002_soft_delete_mailbox_messages`, plus the startup compatibility guard `ensureMailboxSchema()` for older local SQLite databases; `server/schemaIntegrity.test.js` checks that migrations and the Prisma model stay in sync.

## Story Script Data Model

- `StoryScript` is the generic剧情脚本 and local tutorial script table. It is keyed by stable `key`, stores a display `title`, a controlled `triggerType`, structured trigger params serialized in `triggerParamsJson`, draft graph JSON (`draftStartNodeId`, `draftInitialBoardJson`, `draftNodesJson`), optional published graph JSON (`publishedStartNodeId`, `publishedInitialBoardJson`, `publishedNodesJson`), publish timestamps, and normal create/update timestamps. `initialBoard` is structured as `{ mode, stones[] }`, where each stone has `pointId` and `color`; tutorial nodes use `type` values such as `story`, `board-setup`, `npc-dialogue`, `player-choice`, `player-move`, `npc-move`, `player-skill`, `npc-skill`, counting markers, and `resign`. `board-setup` stays inside node JSON and may carry a node-local `boardSetup` snapshot plus local battle scene fields (`playerColor`, optional `playerCharacterId`, `npcCharacterId`, `npcName`, `entryText`); this supports multiple branch-specific starting positions without a new table or DSL. Teaching battle timing and interaction metadata is also node JSON: NPC nodes may preserve `actionStartDelaySeconds`, `replyDelaySeconds`, `manualContinueEnabled`, `autoContinueEnabled`, `autoContinueDelaySeconds`, `actor`, `skillCharacterId`, dialogue text, and ordinary `options` targets. Current authoring uses those two progression booleans as a single advance mode: automatic progression is the new default and stores `manualContinueEnabled: false` plus `autoContinueEnabled: true`, while manual continuation stores the inverse pair and exposes the completed-node continue button without an automatic timer. Existing scripts keep the same JSON fields for compatibility. In automatic mode, `npc-dialogue` uses blank `autoContinueDelaySeconds` as 1.5 seconds after typewriter completion, while other battle nodes treat blank as 0 seconds. All story and battle options may preserve `transitionDelaySeconds` for the post-selection delay into their target, with blank or missing values treated as 0 seconds. This is still the existing nodes/nextNodeId/options graph contract, not a new DSL.
- Story nodes are still stored as normalized JSON because each script is a small ordered dialogue graph rather than a query-heavy entity. The service layer validates node ids, speaker/character metadata, text, default next-node links, option labels, and option target ids before publishing.
- The admin `.xlsx` workbook is an authoring and archive format for the same draft/published JSON graph, not a separate data model. Import may update the current script title and draft graph in the editor, but `key`, `triggerType`, and normalized `triggerParams` are identity fields that must match the current script and cannot be changed by workbook import.
- Supported MVP trigger types are `onboarding` and `item-character-use`; `battle-tutorial-start` is reserved as a future naming boundary for local teaching battle scenes. `item-character-use` trigger params require exact `{ itemId, characterId }`, where `itemId` is the stable `ShopItem.targetId` consumed by player inventory/item-use flows rather than the mutable shop row primary key. The player lookup and publish-conflict guard canonicalize legacy story records that accidentally stored a shop row id back to the matching `targetId`, so an already-published admin edit remains reachable after the player uses the item. `onboarding` and the reserved battle trigger currently require no params.
- At publish time the server permits only one published script for the same trigger type and normalized trigger params. This keeps item-character interactions deterministic: using rainbow bean candy on Denia can resolve to at most one published script.
- `OnboardingStoryScript` remains in the schema as a legacy singleton compatibility source keyed by `id = "singleton"`. `seedDefaultStoryScripts()` migrates a valid published legacy onboarding script into `StoryScript(key="onboarding.default")` only when the generic key is missing; it does not overwrite admin edits.
- `User.onboardingRequired` defaults to `false` for historical users and is set to `true` when a new user registers after the feature is available. `User.onboardingAutoShownAt` is null until the automatic story/tutorial modal is opened successfully from the home view. Recording auto-shown sets `onboardingRequired = false` and writes `onboardingAutoShownAt` once; `User.onboardingCompletedAt` is written only by the explicit completion endpoint. Closing, skipping, browser refresh, or later manual replay do not count as completion and do not reopen the automatic story once auto-shown has been recorded.
- The generic schema is backed by migration `202606280003_add_story_scripts`, the tutorial initial-board migration `202606290001_add_story_tutorial_initial_board`, and startup guard `ensureStoryScriptSchema()`. The onboarding touch/completion fields and legacy table are backed by `202606280002_add_onboarding_story`, `202606290002_add_onboarding_completed_at`, and `ensureOnboardingStorySchema()`.

## Source-Scoped Asset Sync

- `server/userAssets.js` treats compatibility string fields as a legacy mirror. Rows projected from those fields use `source = "legacy"`.
- Structured sync cleanup is source-scoped: it deletes only absent rows whose source is `legacy`. Rows written by achievements, gacha, mailbox, recruitment, or future feature domains stay owned by those flows and are merged by `publicUserAssets()` instead of being removed by legacy refresh.
# Game Record Query Boundaries

- `GameRecord` owns composite indexes for `(blackUserId, createdAt)`, `(whiteUserId, createdAt)`, and `(mode, rated, createdAt)`. Prisma schema, migration SQL, and the startup compatibility guard must stay synchronized.
- Personal and public-profile replay lists use newest-first keyset pagination ordered by `(createdAt DESC, id DESC)`. Each response contains at most 50 summaries and an opaque `nextCursor`; clients may continue until the cursor is null, so old games remain readable without materializing the full history at once. Leaderboard and achievement compatibility aggregation still scan at most the newest 10,000 relevant records.
