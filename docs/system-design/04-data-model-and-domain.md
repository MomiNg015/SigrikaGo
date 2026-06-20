# 数据模型与领域系统

本文记录 Prisma 模型、核心领域数据、抽卡/商城/奖励/段位等跨前后端共享概念。新增模型、迁移、领域字段或兼容镜像字段时优先更新本分篇。

## 当前结论

- 账号资产正在从字符串字段逐步迁移到结构化关系表，旧字段仍承担兼容镜像职责；legacy 字段解析、结构化同步和公开资产合并边界集中在 `server/userAssets.js`。
- 模式化对局数据以 `mode` 串联房间、记录、排行榜、履历和用户模式统计。
- `gomoku` 是独立统计桶：既有用户通过迁移和 `ensureGameModeSchema()` 回填 `UserModeStats(mode=gomoku)`，默认 `rating=1000`、`rank=3段`、`recentResults=''`、胜负和棋全为 0；排行榜仍只展示该模式已有完成对局的用户。
- 抽卡是独立奖励子系统，和商城购买共享角色、装饰、音乐、道具等资源目录。

## 4. 数据模型与字段说明

数据源定义在 `prisma/schema.prisma`，数据库为 SQLite。

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
- `enabled`: 是否启用。
- `sortOrder`: 排序。
- `skill`: 一对一 `CharacterSkill`。
- `createdAt`, `updatedAt`: 创建和更新时间。

### CharacterSkill

角色技能配置。

- `id`: 主键 cuid。
- `characterId`: 关联 `Character.id`，唯一。
- `effectType`: Skill effect type; currently supports `erase-point`, `flip-stone`, `hidden-hand`, `protocol-takeover`, `random-blast`, `spray-stone`, `color-illusion-passive`, `row-slash`, `double-move`, and `liberty-purge`.
- `name`: 技能名。
- `description`: 技能描述。
- `uses`: 每局使用次数。
- `freeTurn`: 是否不消耗回合。
- `targetRule`: Targeting rule; currently validated as `empty-point`, `stone`, `any-point`, `legal-move-point`, or `none`. `random-blast` and `double-move` use `none`; Chisa `liberty-purge` uses `legal-move-point` so the target must pass ordinary move legality on the server.
- `paramsJson`: JSON 字符串，当前作为扩展参数保留。
- `costType`: `numeric` 或 `special`。
- `costValue`: 超频值；`numeric` 会参与数子扣分，`special` 当前仅展示。
- `systemMessage`: 技能系统消息模板。
- `enabled`: 是否启用；公开角色 payload 会过滤禁用技能，后台角色表单可独立控制角色启用与技能启用。
- `createdAt`, `updatedAt`: 创建和更新时间。

### Neutral Stones

`src/shared/gameConstants.js` 维护命名中立棋子类型，当前内置 `spray`，由琳奈 `spray-stone` 技能生成。中立棋子不是黑白任一方，但同名中立棋子属于同一阵营并按围棋气规则连接；不同阵营之间互相阻断气和领地。黑/白棋子转化为喷涂棋子时立即给对手 `skillRemovals +1`，中立棋子被提、被爆破、被死子标记或在技能后无气清理时不提供黑白除子。数子阶段中立棋子不计入黑白子数，可作为边界参与空点归属；被中立棋子或多阵营共同围住的空点保持中立。

### Row Slash Skill

`row-slash` 是仇远“一斩足矣”的主动棋盘技能。目标规则为 `any-point`，只能指定当前棋盘内仍有效的交叉点；空点和已有棋子均可指定，被抹除的无效点不可指定。技能横向处理目标所在行，直接移除该行所有黑棋、白棋、命名中立棋子、隐藏手棋子和幻色棋子，并清除劫状态。直接移除的黑白棋子按真实颜色给受益方增加 `skillRemovals`；中立棋子参与仇远超频增加但不提供黑白除子；隐藏手被直接移除时不产生发现提示；幻色棋子按真实颜色结算并清掉幻色状态。直接移除后会自动清理因此无气的棋串，后续清理仍计入 `skillRemovals`，但不再增加仇远超频。

该技能基础超频消耗为 `0`，然后按直接移除棋子数追加超频，每枚直接移除棋子 `+2`；空行可以发动并消耗技能/回合，但追加超频为 `0`。发动后消耗本回合，重置连续虚手，`moveNumber +1`，并在 `rowEffects` 中记录一条公开横斩视觉标记。该标记只影响显示，不改变交叉点有效性，记录 `clearAfterColor: opponent(owner)`，并在对手下一次行动（普通落子、弃手或消耗回合技能）后清除。

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
- `category`: `character`、`item` 或 `decoration`。
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

## Achievement Domain

- `AchievementRewardAsset` 定义成就奖励资产，字段包括 `type`、`name`、`description`、`imageUrl`、`text`、`targetType`、`targetId`、`amount`、`enabled`、`deletedAt` 和 `sortOrder`。奖励类型支持 `currency`、`title`、`badge`、`nameplate`、`character`、`decoration`、`item`、`music`；称号、徽章和用户名背景只作为个性化装备资产，角色/装饰/道具奖励必须指向 `source = "achievement"` 的限定资源。
- `Achievement` 定义成就目标，使用唯一 `key`、显示 `name`、`content`、`conditionType` 和 JSON 字符串 `conditionParams` 描述判定规则，并可关联一个 `AchievementRewardAsset`。`key`、`conditionType`、`conditionParams`、`enabled` 和 `deletedAt` 属于代码/种子维护的目标逻辑，后台只允许修改 `name`、`content`、`rewardAssetId` 和 `sortOrder`；历史 `UserAchievement` 不删除。
- `seedBuiltinAchievements` 在 `ensureAchievementSchema` 之后运行，只在缺失时创建内置成就与奖励资产，避免启动时覆盖后台后续对成就名、描述、奖励和排序的编辑；当前内置事件成就 `denia-rainbow-bean-candy` 仅在新增后收到对应触发事件时解锁，奖励 100 金币。
- 内置成就还包括 `sigrika-spark-100-wins`，通过 `mode_character_wins` 条件统计指定模式与角色的胜场，当前配置为西格莉卡在 `spark` 模式 100 胜，奖励 `/assets/achievements/semantic-nameplate.png` 用户名背景；启动 seed 会为管理员补齐所有内置成就的 `UserAchievement`，并设置 `rewardGrantedAt`，保证管理员默认可装备新增奖励。
- `UserAchievement` 记录用户已达成状态，包含 `achievedAt` 与 `rewardGrantedAt`，并以 `userId + achievementId` 保证幂等。`AchievementCounter` 保存上线后计数型指标，如购买次数、抽卡次数、登录天数或触发事件累计；可从历史数据回溯的对局、胜场、角色胜率、拥有资产数量等由 `server/achievements.js` 实时聚合。
- `UserAchievementEquipment` 保存用户当前装备的 `titleAssetId`、`badgeAssetId` 和 `nameplateAssetId`。更新装备时只允许选择该用户已达成成就解锁的对应类型奖励资产。
- 用户资料与装备接口除返回 `achievementEquipment` id 外，还会返回当前槽位对应的 `achievementEquipmentAssets` / `equipmentAssets`，让前端无需再次查表即可渲染称号、徽章和用户名背景图片。`attachAchievementEquipmentAssetsToUsers` 用于批量装饰用户列表，socket 登录用户、排行榜用户和社交用户列表/资料都走这条路径，确保任何拿到完整用户对象的用户名展示点具备同一套个性化资产。
- `ensureAchievementSchema` 是旧 SQLite 兼容入口，负责创建成就相关表和索引，并为 `Character`、`Decoration`、`ShopItem` 添加 `source` 字段；`server/serverStartup.js` 会在角色与商店种子任务之前执行该 guard，避免 Prisma 在旧库缺少 `source` 列时先读取这些模型。
