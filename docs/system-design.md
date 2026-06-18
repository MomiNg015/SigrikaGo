# SigrikaGo 系统设计

本文档是系统设计入口。详细设计已经按主题拆分到 `docs/system-design/`，修改架构、运行行为、资源体系、样式主题、部署方式或技术债时，应更新入口摘要或对应分篇，并运行 `npm run docs:system-design` 同步 HTML。

## 阅读顺序

1. [项目总览与功能边界](./system-design/01-project-overview.md)
2. [前端架构与状态边界](./system-design/02-frontend-architecture.md)
3. [后端、HTTP API 与实时房间](./system-design/03-backend-realtime-api.md)
4. [数据模型与领域系统](./system-design/04-data-model-and-domain.md)
5. [资源、音频与启动预加载](./system-design/05-assets-audio-preload.md)
6. [UI 主题、移动端与交互体验](./system-design/06-ui-theme-mobile.md)
7. [性能、技术债与扩展路线](./system-design/07-performance-tech-debt.md)
8. [工作流、文档规则与历史记录](./system-design/08-workflow-and-history.md)

## 当前架构摘要

- 前端使用 React 19、Vite 和 Socket.IO client；`src/main.jsx` 只负责浏览器挂载，应用组合根在 `src/app/App.jsx`，业务状态逐步下沉到 `src/app/*` hooks 和独立视图组件，应用级弹窗可见性集中在 `src/app/useOverlayState.js`，房间/回放/结果弹窗会话状态集中在 `src/app/useRoomSessionState.js`，已关闭结果不会因 `room:resume` 再弹，匹配等待/成功过渡状态集中在 `src/app/useMatchSessionState.js`；开发期 Vite `/socket.io` 代理会静默处理后端 watch 重启造成的预期 websocket 断连错误。
- 后端使用 Express、Socket.IO、Prisma 和 SQLite；`server/index.js` 负责 HTTP/Socket 入口组合，启动数据与 schema 初始化收口在 `server/serverStartup.js`，Socket 连接事件套件由 `server/socketEvents.js` 统一装配，速率保护与匹配、房间连接/恢复、对局/数子/求和/计分、聊天、约战、断线清理等行为继续分布在对应 `server/socket*Events.js` 模块，生产静态托管收口在 `server/staticAssets.js`，认证、商城、抽卡、社交、回放、房间生命周期等已拆为领域模块。
- 对局模式由 `src/shared/gameModes.js` 统一配置，前后端共享模式顺序、棋盘大小、贴目、技能开关和时间控制。
- 当前内置对局模式为 `spark`、`standard` 和 `gomoku`。五子棋沿用 13 路棋盘与星位、5 分钟 30 秒 3 次读秒、自动猜先和独立 `UserModeStats(mode=gomoku)` 段位/积分；需要出战角色但 `skillEnabled=false`，房间 UI 不显示弃手、数子、提子、除子、超频或技能信息。
- 站点公开配置通过 `SiteSetting` key/value 存储，并由 `src/shared/siteSettings.js` 定义前后端共享默认值；后台系统设置可编辑大厅标题/副标题、关于文本和首页 footer 长文本，footer 支持受限 Markdown 链接。
- 对局规则支持黑白棋子与命名中立棋子并存；中立棋子按同名阵营连接、阻断领地并参与气/提子判定，但不归属黑白除子。`src/shared/game.js` 保留共享对局 API 门面，阶段常量、动作结果、普通落子/隐藏手动作、主动技能动作和技能状态变更 helper 已拆到 `gamePhases.js`、`gameActionResult.js`、`gameStoneActions.js`、`gameSkillActions.js` 和 `gameSkillState.js`，降低新增技能继续膨胀核心状态机的风险。
- 星炬技能体系包含面向整行的 `row-slash` 主动技能和面向空交叉点的 `protocol-takeover` 主动技能；仇远（`qiuyuan`）通过“一斩足矣”指定任意有效交叉点，移除该横线所有棋子并按直接移除数增加超频，莫宁（`mornye`）通过“协议接管”把一个空点写入对手禁入协议，管理员在部员招募系统实装前默认拥有这两个部员招募角色；棋盘刀痕、协议禁入标记和长离连落棋子光效均由 DOM/CSS 专用层渲染，`protocol-takeover` 禁入点带蓝白持续光效，`row-slash` 刀痕通过 `clearAfterColor` 在对手下一次行动后清除，长离（`changli`）`double-move` 连续落下的棋子写入 `double-move-stone` 并显示红色火焰持续光效；`BoardSkillEffects` 不为这些 DOM-only 技能挂整棋盘覆盖层，棋盘点位按钮保持透明无按钮皮肤，`.board-lines` SVG 网格层也显式保持铺满棋盘和可见 stroke，避免全局/主题按钮或媒体规则盖住、压塌棋盘网格。
- 玩家资源包含角色、装饰、道具、音乐、抽卡奖励、蓝宝石和金币；结构化关系表与旧字符串字段仍处在兼容迁移期，legacy 解析、结构化同步和公开资产合并规则集中在 `server/userAssets.js`。
- 玩家 UI 当前默认 Bright School 主题；主题注册、CSS 入口和作用域合同保留未来扩展口，共享基础层已从单一 `base.css` 入口拆到 `src/styles/base/`，后台管理样式已从单一 `admin.css` 入口拆到 `src/styles/admin/`，共享大厅/小屋/观战列表样式已从单一 `lobby.css` 入口拆到 `src/styles/lobby/`，房间样式已从单一 `room.css` 入口拆到 `src/styles/room/`，Startorch 对局终端皮肤已从单一 `room-terminal.css` 入口拆到 `src/styles/room-terminal/`，共享弹窗样式已从单一 `modals.css` 入口拆到 `src/styles/modals/`，移动弹窗安全层已从单一 `mobile-modals.css` 入口拆到 `src/styles/mobile-modals/`，商业/社交/仓库样式已从单一 `commerce-settings.css` 入口拆到 `src/styles/commerce/` 领域分篇，其中商店/设置/移动商业补丁继续从 `src/styles/commerce/shop-settings.css` 拆到 `src/styles/commerce/shop-settings/`；共享响应式层已从单一 `responsive.css` 入口拆到 `src/styles/responsive/`，共享移动对局层已从单一 `mobile-room.css` 入口拆到 `src/styles/mobile-room/`，共享 HUD 兼容层已从单一 `hud-components.css` 入口拆到 `src/styles/hud-components/`，最终移动端安全层也从单一 `mobile-adaptive.css` 入口拆到 `src/styles/mobile-adaptive/`，其中 Bright School 最终移动兜底覆盖继续拆到 `src/styles/mobile-adaptive/bright-school-overrides/`；Bright School 对应早期可读性清理、商业覆盖、弹窗/设置/结果/房间浮层清理、动画/技能/棋盘效果、移动端覆盖、竖屏对局覆盖、组件修复覆盖、质量兜底层和防 HUD 串色 firewall 分别拆到 `src/styles/themes/bright-school/contrast-purge/`、`src/styles/themes/bright-school/commerce/`、`src/styles/themes/bright-school/modals/`、`src/styles/themes/bright-school/effects/`、`src/styles/themes/bright-school/mobile/`、`src/styles/themes/bright-school/mobile/room/`、`src/styles/themes/bright-school/component-repairs/`、`src/styles/themes/bright-school/quality-base/`、`src/styles/themes/bright-school/firewall/`。
- 启动预加载区分关键资源与延迟资源，并为单个资源加载设置超时兜底，避免服务器重启或缓存恢复时把玩家卡在资源准备页；房间运行期使用轻量 `room:clock` 与完整 `room:update` 分流，降低高频交互卡顿。移动端弱网下，启动预加载不订阅瞬时 Socket.IO 实例变化，对局 socket 连接使用明确重连和 6 秒握手超时，避免连接抖动把玩家反复留在资源准备页。

- Bright School 桌面首页新增四段响应式布局契约：wide desktop、compact desktop、micro desktop 和 mobile 分别处理；`1181px-1500px` 的中等桌面段会优先保证玩家铭牌完整显示，铭牌用户名不得跨列遮挡段位面板，micro desktop 使用受控 `960px` 横向舞台，核心入口保持正常 grid flow，低高度允许纵向滚动。

## 维护约定

- 入口文档只写总览、导航和跨主题规则；详细事实写入对应分篇。
- 分篇标题、说明和新增内容优先使用中文；代码标识、路径、事件名、模型名保留原文。
- 发现乱码时先确认源文件是否含 `Unicode replacement character` 或常见 mojibake 片段，再区分终端显示问题和文件内容损坏。
- 修改 Markdown 后运行 `npm run docs:system-design`；涉及脚本或编码规则时运行 `npm test -- docs/systemDesignHtml.test.js`。

## Board Effect Theme Guard


- App audio runtime state now lives in `src/app/useAudioRuntimeState.js`, keeping local audio settings persistence and socket-reconnect resume signaling out of the `src/app/App.jsx` composition root.

- Admin console styles now follow the import-only CSS domain pattern through `src/styles/admin.css` and `src/styles/admin/`, so character, audit, gacha, achievement, and responsive rules no longer live in the root stylesheet entry.

- Lobby, house manual, match entry, and watch-list styles now follow the same import-only pattern through `src/styles/lobby.css` and `src/styles/lobby/`, keeping profile, character, match, watch shell, and phone fallback rules out of the root stylesheet entry.

- Bright School modal cleanup now follows the import-only pattern through `src/styles/themes/bright-school/modals.css` and `src/styles/themes/bright-school/modals/`, keeping handbook, settings, selected-action, resume, result, popover, and stage-decoration repairs in focused files.
- Bright School effects now follow the import-only pattern through `src/styles/themes/bright-school/effects.css` and `src/styles/themes/bright-school/effects/`, keeping selected controls, skill action glow/disabled state, board targeting, board marks, keyframes, and reduced-motion rules in focused files.

- Admin-managed character `sortOrder` is persistent data, not a seed-owned builtin field. `seedCharacters` only assigns fallback order when creating missing builtin characters, public `/api/characters` includes `sortOrder`, and the member manual derives its character list through the shared catalog sorter so saved admin order survives server restarts and reaches player UI.

- ChangLi (`changli`) uses the `double-move` active skill. The server persists the public chained-action state in `game.extraTurn`; board confirmation is not tied to an intersection, and restoring during ChangLi skill preview resolves directly into the double-move state without replaying the banner, sound, or animation.
- Lynae (`lynae`) `spray-stone` records its resolved `randomTargetId` in skill history. Replay reconstruction must pass that recorded target back into the shared spray resolver instead of rerolling, so replay step changes cannot turn different historical stones into spray stones.
- Hidden-hand is an active skill history entry with `effectType: "hidden-hand"`, so ChangLi unlock checks treat Aemeath's resolved hidden-hand the same as other opponent active skills while still ignoring passive effects. Bright School's late skill-action layer also owns a disabled override for `.action-bar .skill-action:disabled`, keeping unavailable skills gray instead of inheriting active/normal gradients.
- Bright School board guards keep DOM-only board effect layers transparent and restore their pseudo-elements so broad theme firewall rules such as `[class*="row"]` cannot turn QiuYuan's slash overlay into a blank paper panel or a plain bar over the board; Mornye's protocol marker remains a pointer-events-none point child and never changes board hit testing. The playable board surface is shared through `--board-wood-texture`, currently `/assets/boards/go-board-background-reference-color-vertical-2048.webp`, a low-saturation vertical bamboo/wood WebP asset reused by the base room CSS and Bright School guard layers.
- Board move preview and mobile touch-confirmation markers are point-local visual effects centered by the `.point` grid alignment contract, so ChangLi's extra-turn ordinary placement hints stay on the same intersections as stones and SVG grid lines. Touch confirmation uses only the inner `.touch-confirm-marker`; `.point.touch-confirming::before` stays hidden and mobile confirmation does not scale the whole point button, preventing duplicate blue rings and apparent marker drift.
- Chisa's `.liberty-purge-removal-mark` is also a point-local DOM effect: its container stays centered with `left/top: 50%` and `translate(-50%, -50%)`, while the red cross bars rotate inside the marker. Bright School guards preserve saturated red `#ff1733`, pseudo-element bars, and pointer-events-none behavior so removal marks line up with board intersections without changing hit testing.

## Modal Layering Note

- Chisa (`chisa`) uses the `liberty-purge` active skill. The server resolves a normal legal move first, then removes all one-liberty groups from a board snapshot, records `removalMarkIds`, clamps negative overclock deltas to zero, clears ko, and keeps `.liberty-purge-removal-mark` red crosses until the opponent's next real turn ends. Because `liberty-purge` places a real stone, `lastMarkedAction` treats its `placedId`/`id` as the latest placed-stone marker on the board. Admin users own Chisa by default until recruitment is implemented.
- Shared `.modal-backdrop` stacks above room `--room-floating-z` surfaces so request and confirmation modals dim skill chips, chat controls, and room member popovers together. 房间内申请和棋、申请数子与确认数子结果的定时 toast 由流程响应、阶段变化或自动消失关闭，不提供手动关闭按钮。
- Character duplicate chain counts remain in user data for reward/progression logic, but player-facing desktop and mobile UI hides character-chain badges on portrait surfaces.
- Mobile character-detail dialogs keep the character name horizontal and single-line, place the compact BGM preview capsule at the top-right of the heading row, left-align skill and character-description copy, and omit the standalone skill-cost badge; Bright School theme layers and the final `mobile-adaptive` safety layer repeat these constraints so narrow phones cannot fall back to vertical names or centered body text.
- Bright School portrait phone polish that must outlive theme overrides is centralized in the final `src/styles/mobile-adaptive/bright-school-portrait.css` layer, while final mobile social/warehouse safeguards keep inventory item cards at a stable 88px minimum height for readable item details; the portrait polish includes home player plaque nameplate fitting, centered container-sized plaque mode stats, hidden character-chain portrait badges, the two-row resume header, resume character records that take remaining modal height and scroll internally on short phones, mobile room tabs that change selected background without press-offset motion, and shop wallet single-line/blue-gem capsule treatment. Login auth chrome keeps the brand and login/register segmented wrappers transparent on desktop and mobile, while the outer login card retains the Bright School lower-right hard shadow. Desktop and narrow-desktop home image entries also rely on the final `src/styles/mobile-adaptive/home-narrow-desktop.css` safety layer: entry buttons may keep visible labels/shadows outside their frame, but their actual `<img>` art must stay `border-box`, `max-height: 100%`, and `object-fit: contain` so the member manual and match artwork cannot spill out of the bottom of the card.
- Resume character records in the final Bright School mobile layers reuse the detailed user profile character-list rhythm: the outer section stays lightweight, while compact four-column rows carry avatar, name, record, and win rate without clipping. The embedded resume list keeps total games and win/loss/draw on one line, while separate nested record dialogs may still use their two-line compact record treatment.
- Mobile user profile stat cards center their label and value content inside each card; the record card keeps total games and win/loss/draw as compact centered lines sized to stay within the card.
- Mobile user profile footer actions reuse the resume replay button's green treatment for "对局回放"; relationship actions that are already effective, such as "已是好友" or "已在黑名单", keep their native disabled semantics and render as gray inactive controls in the final Bright School mobile layer.
- Mobile leaderboard rows use a compact card grid with no extra left list inset, smaller rank badges, larger character portraits, and a centered username/rank stack so the rank label shares the same vertical center axis as the username/nameplate. Compact leaderboard `UserIdentity` names provide a fit font-size token so legacy/generated usernames shrink before they would fall back to clipped ellipses. Leaderboard rows representing the current user, including the pinned "my ranking" row, use a light green surface on desktop and mobile so they remain visually distinct from ordinary leaderboard entries.
- Selected tab-like controls and selected option buttons share a pressed visual contract across desktop and mobile: active/aria-selected/aria-pressed states shorten the drop shadow, shift down slightly, and add an inset shadow so the selected control reads as physically pressed rather than merely highlighted.
- Achievement and personalization modal headers keep their close button in the same grid row as the title on desktop and mobile; the final Bright School mobile layer repeats this contract so global absolute close-button rules cannot push nested modal close controls onto the divider line.
- Room player info panels use `.active-turn` as the current-turn visual contract: the player whose turn it is turns yellow on both desktop and mobile, and late theme layers such as Bright School must preserve that yellow turn-state cue.
- Desktop resume headers reserve separate right-aligned grid columns for the coin/gem wallet group and close button, preventing the global absolute close-button rule from colliding with currency capsules.
- Mobile resume headers use a final high-specificity Bright School override so the close button stays in the first-row right slot and the wallet group stays inside a shrinkable second-row right slot; when width is tight, coin and blue-gem capsules wrap as whole controls instead of overflowing past the modal edge.
- Desktop resume modals keep the outer window fixed inside the viewport with hidden outer overflow; embedded character records own the vertical scroll region. Desktop user profile detail modals likewise give the character-record list a bounded scroll area, and character detail headers reserve right-side space so the compact BGM player cannot collide with the close button.
- Resume and user profile recent-result rows render a real `.recent-result-label` reading "最近十盘的战绩" above the marker chips inside `.profile-rank-results`; the label is small black text rather than a background watermark, and the chips/empty state remain the primary row content on desktop and mobile.
- Personalization sections now expose one "style picker" entry per equipment category. Each picker opens a nested modal containing default plus unlocked decorations, closes immediately after selection, and updates the local try-on preview while the existing save action remains the only persistence step.

## Music Management Note

- 角色技能 BGM 当前配置：达妮娅使用 canonical `denia-skill-default`（`bgm_*`），西格莉卡使用 `sigrika_intro_once.ogg` + `sigrika_loop.ogg`，爱弥斯使用 `lhl_*`，猪小仙使用 `matoya_*`，娜波摩使用 `busizhe_*`，千咲使用 `chisa_intro_once.ogg` + `chisa_loop.ogg`，长离使用 `changli_intro_once.ogg` + `changli_loop.ogg`，莫宁使用 `mornye_intro_once.ogg` + `mornye_loop.ogg`。旧达妮娅 slug 会在启动清理阶段迁移/删除，运行时 BGM resolver 只按 canonical `denia` 查找达妮娅技能 BGM。

- Settings > Audio persists optional per-channel mute flags under `audioSettings.muted`; clicking an audio row title toggles mute without changing the slider percentage, and moving the slider clears that channel's mute flag.

- 后台“音乐管理”只维护 `MUSIC_TRACKS` 静态曲目的显示名覆盖值；`MusicTrackSetting` 不改变轨道 id、类型、角色绑定或音频文件，玩家侧 `/api/music-tracks`、角色 BGM 选择、商城音乐展示和抽卡音乐奖项显示会使用合并后的曲目名称。
- 仇远（`qiuyuan`）的默认技能 BGM 是 `qiuyuan-skill-default`，使用两段式 `intro-loop` 播放：`/assets/music/qiuyuan_intro_once.ogg` 播放一次后接 `/assets/music/qiuyuan_loop.ogg` 循环；该曲目默认解锁并跟随角色 BGM 选择/技能预览解析逻辑。
- 琳奈（`lynae`）的默认技能 BGM 是 `lynae-skill-default`，使用两段式 `intro-loop` 播放：`/assets/music/lynae_intro_once.ogg` 播放一次后接 `/assets/music/lynae_loop.ogg` 循环；该曲目默认解锁并跟随角色 BGM 选择/技能预览解析逻辑。

- 千咲（`chisa`）的默认技能 BGM 是 `chisa-skill-default`，使用两段式 `intro-loop` 播放：`/assets/music/chisa_intro_once.ogg` 播放一次后接 `/assets/music/chisa_loop.ogg` 循环；该曲目默认解锁并跟随角色 BGM 选择/技能预览解析逻辑。

- 长离（`changli`）的默认技能 BGM 是 `changli-skill-default`，使用两段式 `intro-loop` 播放：`/assets/music/changli_intro_once.ogg` 播放一次后接 `/assets/music/changli_loop.ogg` 循环；该曲目默认解锁并跟随角色 BGM 选择/技能预览解析逻辑。

- 莫宁（`mornye`）的默认技能 BGM 是 `mornye-skill-default`，使用两段式 `intro-loop` 播放：`/assets/music/mornye_intro_once.ogg` 播放一次后接 `/assets/music/mornye_loop.ogg` 循环；该曲目默认解锁并跟随角色 BGM 选择/技能预览解析逻辑。

## Achievement And Personalization Note

- 用户名注册/搜索校验允许中文、日文、韩文、半角英文、数字和下划线；按显示宽度限制为最多 10 个半角字符宽度，等价于最多 5 个中日韩字符或 10 个半角字符。注册页把用户名、密码和确认密码规范放在输入框 placeholder 中，用户开始输入后自然隐藏；失焦或提交时才在对应字段下方显示错误。
- 成就系统以 `Achievement`、`AchievementRewardAsset`、`UserAchievement`、`AchievementCounter` 和 `UserAchievementEquipment` 为核心模型；启动时 `ensureAchievementSchema` 会先于角色/商店种子任务运行，为旧 SQLite 自动补表，并为 `Character`、`Decoration`、`ShopItem` 补 `source` 字段。玩家侧 `/api/achievements` 返回合并后的成就列表与本次新解锁成就，`/api/me/achievement-equipment` 读写称号、徽章和用户名背景装备；成就目标本体由代码/种子维护，后台 `/api/admin/achievements` 只允许修改成就名、成就内容、奖励资产和排序，`/api/admin/achievement-reward-assets` 继续管理奖励资产并写审计日志。
- `/api/me`、`GET/PATCH /api/me/achievement-equipment` 会同时返回 `achievementEquipment` 装备 id 与 `achievementEquipmentAssets` / `equipmentAssets` 奖励资产显示数据；socket 登录用户、排行榜和社交用户列表/资料也会批量附加 `achievementEquipmentAssets`。前端通过共享 `UserIdentity` 在对弈玩家名、房间成员、排行榜、好友/黑名单、资料卡、观战列表和结算赢家名等完整用户展示点渲染称号、徽章和用户名背景；好友/黑名单列表行只展示状态、常用角色、用户名和操作入口，不再展示段位或积分，详细资料仍保留完整统计。
- 用户名背景由 `UserIdentity` 的用户名标签承载：标签宽度随用户名内容和内边距自适应，默认无边框且背景透明，装备 nameplate 后只替换同一标签的背景图；父容器仍只负责标签整体居中或左对齐。桌面端和移动端分别设置最大宽度与内边距保护，避免旧长用户名撑破列表或对局布局。Bright School home player plaques reserve a middle column with `--home-plaque-name-column-min` with a 12ch plus nameplate-padding budget for 10 half-width characters, and late narrow-desktop safety layers must keep that variable so the stats panel cannot clip the username at large viewports. The username tag clips nameplate backgrounds with square corners through `--user-identity-name-tag-radius: 0`, so username borders/backgrounds do not render rounded corners, and keeps a taller `--user-identity-name-tag-min-height` plus tag-local line-height so high/descender letters such as g and j are not clipped by the nameplate mask. Bright School home plaque overrides keep the nameplate tag in `border-box` sizing and leave the inner `.user-identity-name` overflow visible, so glyph side bearings are not cut by the text span itself. nameplate PNG 应先用 `scripts/pngTrim.mjs` 按 alpha 边界裁掉透明空边，避免上传图的空画布造成视觉偏移。
- 内置成就“你给我吃了什么！？”由 `seedBuiltinAchievements` 在启动时按需创建，监听新增后的 `denia-rainbow-bean-candy` 道具使用事件；玩家请达妮娅吃彩虹豆豆跳跳糖后解锁并获得 100 金币，不回溯统计成就上线前发生过的使用记录。
- 新增内置成就“点亮语义！”使用 `mode_character_wins` 条件统计玩家使用西格莉卡在 `spark`（星炬对弈）模式的胜场，达到 100 胜后解锁 `/assets/achievements/semantic-nameplate.png` 用户名背景；`seedBuiltinAchievements` 会让管理员默认达成所有内置成就并标记奖励已发放。
- 启动初始化会在角色 seed 前运行 `cleanupLegacyDeniaCharacterData`：旧达妮娅 slug `danea`/`denea` 的用户选角和拥有权会迁移到 canonical `denia`，旧角色行会删除，引用旧 slug 的对局记录会删除，角色商品/抽卡/成就奖励目标会改写为 `denia`；公共角色列表会防御性忽略旧 slug，避免旧达妮娅再次出现在前台。
- 履历弹窗新增“成就”和“个性化”入口；入口按钮、模式 tab、回放入口和蓝宝石钱包使用不同柔和底色区分。成就窗口在桌面端用三列表格，在移动端用卡片列表，并按“未达成 / 已达成 / 全部”筛选；达成时间不占列表列宽，点击已达成成就行会从点击位置附近弹出固定定位时间浮窗，并受视口边界约束。商店蓝钻钱包复用履历蓝宝石钱包的渐变、边框和文字/图标色，桌面与移动主题层都显式保持一致。个性化窗口桌面端按称号、徽章、用户名背景三列装备，移动端改为竖向分区；预览区用共享 `UserIdentity` 展示保存前试穿效果，粉红按钮表示当前已保存生效，浅绿色按钮表示正在试穿但尚未保存。部员手册中当前出战角色的出战按钮也复用粉红选中视觉，角色卡本体继续使用浅绿色出战状态底色。商城购买、抽卡和仓库道具使用会消费后端返回的 `achievementUnlocks`，以 `achievement` tone 的醒目 toast 告知玩家达成的成就。
