# 重制黑化西格莉卡对局红黑界面与结算行为

## Goal

将黑化西格莉卡特殊对局从当前整页灰度、冗余故障文案的表现，调整为桌面端与竖屏移动端一致的红黑色危险氛围；同时恢复必要的围棋信息标签，明确禁用数子，并确保结算暂不播放角色结果语音或展示无关的战绩提示。

## Requirements

* 仅黑化西格莉卡特殊对局及其结果弹窗切换为红黑彩色视觉；主页、部员手册、匹配入口等其它黑化阶段表现不在本次改色范围。
* 黑化特殊对局必须取消房间根节点的灰度化，使用炭红灰、暗红、柔化危险红与少量暖色棋盘形成完整氛围；禁止用接近纯黑的大面积底层和高密度硬红边制造刺眼的极端明暗反差。
* 桌面端与竖屏移动端使用同一语义化配色合同，移动端保持现有布局和至少 44px 的主要触控目标，不产生横向溢出。
* NPC 对话复刻剧情对弈引导的头像、姓名、正文双列气泡结构和桌面/竖屏定位逻辑；整个气泡只使用一个连续炭红背景，立绘区与文本区不得拥有独立边框或底色。
* 假技能横幅使用一个统一的红黑三段渐变外壳，立绘与文本子区透明无边框，演出标签与技能名使用高对比度浅色文字，桌面与竖屏均不得越界。
* 特殊匹配成功窗口标题改为“正在踏入深渊。。。”，普通匹配成功窗口文案保持不变。
* 猜先执黑/白窗口与退出确认窗口使用特殊房的红黑氛围层，不得暴露 Bright School 米白纸面。
* 退出确认标题、正文、认输与取消按钮必须以高对比文字覆盖 Bright School 的深色文字赢家，任何交互状态下都不得出现暗字叠暗红底。
* 黑方与白方角色立绘槽继续使用深色/浅色底板区分执色，特殊房不得把两侧统一成黑底。
* 特殊房点击退出必须先展示确认；确认后按认输结算并留在房间等待结果窗口，取消时不改变对局。普通房退出流程保持原状。
* NPC 对话与假技能横幅提高红色饱和度和明度区分，同时维持正文与标签的可读对比。
* 保留当前倒计时面板的结构、尺寸、故障数字、颜色、进度轨和动效，本轮不得修改任何时间面板样式或组件。
* 高度不超过 820px 的桌面只收缩棋盘，使 1280×720 可同时看到房间头部、棋盘和行动栏；玩家卡和倒计时面板不参与压缩。
* 猜先窗口最大宽度约 460px、退出确认最大宽度约 420px，移动端按可用宽度收缩且不得出现内部滚动条。
* 弃手与认输分别使用 `pass-action` / `resign-action` 语义类；弃手保持中性，认输使用危险红，顶部工具、行动栏与系统记录图标使用高对比浅色 stroke，禁用数子图标使用禁用色。
* 双方时间面板只显示故障时间数字；移除可见的“时间数据损坏”和“本局不限时”字样，同时保留准确的无障碍读法。
* 双方信息区始终显示提子、除子、超频三个标签；特殊对局即使正式技能关闭，也不得隐藏除子和超频。
* 房间号标签恢复普通“房间号 + 值”结构，特殊对局的值固定显示为 `ERROR`，不得显示 `PRIVATE // DATA CORRUPTED`。
* 特殊对局保留数子按钮的位置和禁用视觉，但按钮必须不可操作；普通对局数子行为不变。
* 黑化特殊对局结果出现后不触发角色胜利、失败或和棋语音；普通对局结果语音不变。
* 黑化特殊对局结果弹窗移除“特殊对局 · 不计入任何成长、战绩或奖励”提示行，保留结果、胜负详情与唯一的“继续”操作。
* 特殊房系统记录不生成或显示“西格莉卡？正在思考。”；旧快照中的 `npc-thinking` 仅在该房间显示端过滤，其他系统记录和普通房不受影响。
* 用户回放列表中的特殊对局不得在时间前添加标题或标签；该行使用淡血红统一背景，左上角显示无文字 Boss 图标但不占用网格列，并按用户执色分别使用匿名玩家与官方黑化西格莉卡立绘。
* 普通好友对局的握手图标也应作为回放卡片左上角角标，不再占用时间行宽度，并保留“友谊对局”可访问名称。
* 竖屏移动端为角标外伸区域保留安全沟槽，好友与 Boss 角标都必须完整显示，不得被卡片、时间单元或滚动容器裁剪。
* 使用现有 React 组件、CSS 主题层和必要的前端状态逻辑完成，不引入新依赖或替换现有房间布局。

## Acceptance Criteria

* [x] 桌面黑化特殊房不再呈现整页灰度，页面背景、房间头部、玩家卡、时间板、数据标签、棋盘框、操作区、系统记录与结果弹窗形成可辨识的红黑彩色体系。
* [x] 360×800、390×844、412×915 竖屏下布局无横向溢出，红黑视觉与桌面语义一致。
* [x] 时间板 DOM 不含可见的“时间数据损坏”或“本局不限时”，仍具备“本局不限时”的可访问名称，并继续显示故障数字。
* [x] 特殊对局双方信息区均渲染“提子 / 除子 / 超频”，值可为 0。
* [x] 特殊对局头部显示“房间号ERROR”，普通房仍显示真实房间号。
* [x] 特殊对局数子按钮为原生 disabled，点击不会触发数子请求；普通房行为不变。
* [x] 特殊对局结果语音解析返回空，普通胜/负/和结果仍返回原事件。
* [x] 特殊对局结果弹窗不含任何“不计入成长、战绩或奖励”提示，且仍只提供“继续”。
* [x] 聚焦组件测试、CSS 合同测试、生产构建和系统设计文档生成通过。
* [x] 页面背景、面板、时间板、功能标记与禁用状态使用分层炭红表面，不再由接近纯黑底层吞没文字；正文、横幅与禁用文字均达到其字号要求的对比度。
* [x] 特殊局 NPC 对话渲染官方黑化立绘、姓名与正文双列气泡，视觉结构对齐剧情对弈引导；390×844 下气泡完整位于视口内。
* [x] 特殊局技能横幅计算样式为炭红到血红再回深炭的渐变，标签与技能名保持浅色高对比度，桌面与 390×844 下完整位于视口内。
* [x] 对话窗与技能横幅作为 `.app-shell` 直属 Portal 节点时均计算为 `filter: none`，不会被根级黑化灰度规则再次去色。
* [x] 特殊房猜先窗口和退出确认均包含红黑实体氛围层，普通窗口不受影响。
* [x] 黑白双方立绘槽由特殊 owner 显式区分：黑方使用炭黑红，白方使用浅血粉白，不再被统一暗色表面覆盖。
* [x] 特殊房退出确认提交 `resign` 后不调用返回导航，finished 快照可在原房间触发结果；普通房仍认输后返回。
* [x] NPC 对话和技能横幅使用更鲜明的危险红混色，浅色正文与技能名合同保持不变。
* [x] 1280×720 的房间头部、棋盘与行动栏同时进入首屏；短屏媒体查询只改 `--board-size`，倒计时面板合同保持不变。
* [x] 退出确认计算宽度为 420px、移动端为可用宽度且 `overflow: hidden`；猜先窗口由同一合同限制为 460px。
* [x] 黑方立绘为炭黑红、白方立绘为浅血粉白，NPC 技能槽计算背景不再包含 Bright School 米白渐变。
* [x] 弃手、数子、认输和顶部工具按钮具有清晰且互不混淆的中性、禁用、危险与选中状态。
* [x] 特殊匹配成功窗口显示“正在踏入深渊。。。”，普通匹配成功窗口仍显示“匹配成功”。
* [x] 顶部工具、行动栏与系统记录 Lucide 图标具有高对比 stroke，禁用数子图标保持可辨识的禁用色，棋盘 SVG 不受影响。
* [x] NPC 对话与技能横幅各自只保留一个统一外层背景；其立绘区和文本区均无独立边框或背景色。
* [x] 退出确认的标题、正文、认输与取消文字在默认、悬停和键盘聚焦状态下均保持浅色高对比。
* [x] 新对局不再写入 `npc-thinking` 系统消息，恢复的旧特殊房记录也不会显示该行。
* [x] 特殊回放行不再显示时间前缀文案，使用淡血红背景、无文字 Boss 图标及正确的 NPC/玩家专属立绘，且图标不改变五列网格布局。
* [x] 好友回放握手图标位于卡片左上角，时间戳不发生位移，桌面与移动端仍保持原五列/卡片结构。
* [x] 竖屏好友/Boss 回放角标在嵌套回放窗口与用户资料回放列表中均完整显示。

## Definition of Done

* Tests added or updated for room header, timer, player stats, disabled scoring, result copy and result voice suppression.
* Desktop and portrait-mobile visual state is verified against the real room structure.
* `docs/system-design.md` and the relevant frontend system-design chapter reflect the changed special-duel presentation and behavior.
* `npm run docs:system-design` regenerates `docs/system-design.html`.
* Existing unrelated working-tree changes are preserved and excluded from this task's edits.

## Technical Approach

Keep the ordinary room component structure. Add narrowly scoped semantic props for special-duel stat visibility and scoring availability, semantic action classes, and late special-room winners for the affected Bright School surfaces. Preserve the current time-panel implementation unchanged. The late `mobile-adaptive/sigrika-corruption/room-atmosphere.css` owner removes corrupted-root grayscale from both the room root and the direct-child presentation Portal before focused owners apply brighter red-black tokens. `room-icons.css` isolates interaction-glyph stroke winners from board SVGs, while `room-presentation.css` keeps one outer background per presentation without nested portrait/copy surfaces. `room-secondary-surfaces.css` owns explicit confirmation text/surface winners. The automation no longer writes transient thinking records and `ChatBox` filters the legacy kind only for special rooms. `ReplayList` keeps its top-level five-column child order by nesting the absolute Boss badge inside the timestamp cell, resolves canonical portraits before ordinary fallbacks, and delegates the pale blood-red surface to the replay owner. A short-height desktop query changes only `--board-size`; the natural-color board, stones, player cards and timer geometry remain owned by their existing components.

## Decision (ADR-lite)

**Context**: The current global corruption contract intentionally turns all corrupted surfaces monochrome, but the requested duel must become colored without changing other corruption screens or duplicating the room layout.

**Decision**: Treat the special duel as a scoped exception under `.app-shell.is-sigrika-corrupted:has(.room-screen)`. Reuse the normal room DOM and override only explicit room/result owners in the final corruption stylesheet. Keep the board readable and use layered charcoal-red framing, panels, controls, ambient vignettes and fault accents rather than near-black fills or a generic sci-fi replacement HUD. Reuse the tutorial battle dialogue composition for special NPC lines, while the fake-skill banner owns its separate red-black gradient hierarchy.

**Consequences**: The duel remains structurally compatible with desktop/mobile room code and ordinary matches stay isolated. The late owner needs CSS/static regression tests because it must beat Bright School `!important` surface rules.

## Out of Scope

* Recoloring the corrupted home, handbook, match picker, story player or loading screen.
* Changing server scoring rules, room persistence, replay policy, rewards, KataGo/GNU Go behavior or recovery-story sequencing.
* Adding new voice assets or replacing the result modal layout.
* Redesigning ordinary rooms, ordinary result modals, board geometry or stone rendering.

## Technical Notes

* Relevant components: `src/room/TimeBar.jsx`, `src/room/header/RoomHeader.jsx`, `src/room/PlayerInfo.jsx`, `src/room/ActionBar.jsx`, `src/room/RoomBattleStage.jsx`, `src/modals/gameLifecycle/ResultModal.jsx`, `src/modals/gameLifecycle/lifecycleHelpers.js`.
* Relevant presentation owners: `src/styles/mobile-adaptive/sigrika-corruption/room-atmosphere.css` for Portal grayscale isolation, `room-secondary-surfaces.css` for portrait/mobile-tab surfaces, `room-lifecycle.css` for opening/confirmation surfaces, and `room-presentation.css` for dialogue/banner appearance, all imported after Bright School and ordinary mobile layers.
* Current independent room-audio suppression in `src/room/audio/useRoomAudioEffects.js` already blocks in-room system voices, but result voice is independently triggered by `ResultModal` and must be stopped at `resultVoiceEventForRoom`.
* Existing uncommitted Sigrika duel and portrait work belongs to adjacent tasks and must not be reverted.

## Verification

* Chromium live visual QA passed at 1280×720、1440×900、390×844 和 412×915。桌面短屏的房间头部、棋盘与行动栏同时进入首屏，四组尺寸均无文档级横向溢出；移动端页签和操作区完整位于可用宽度内。
* 退出确认桌面计算宽度为 420px，390px 视口下按可用宽度收缩为 368px，均为 `overflow: hidden` 且无内部滚动条；确认认输后结果窗口只保留“继续”，不显示战绩提示。NPC 技能槽计算背景已从 Bright School 米白纸面恢复为暗红表面。
* Focused suite: 9 files / 155 tests passed. CSS inventory and action contract follow-up: 3 files / 92 tests passed. Battle regression suite: 22 files / 430 tests passed. Desktop/mobile exit/reconnect and Pixi skill-effect stability suite: 8 / 8 passed.
* `npm run lint`, `npm run build`, `npm run check:built-css`, `npm run verify:battle-fixes`, `npm run verify:stability -- --skip-build tests/stability/room-exit-and-reconnect.spec.js tests/stability/skill-effects.spec.js` 和 `npm run docs:system-design` 均通过。
* 2026-08-07 follow-up: 5 files / 110 focused tests passed for abyss matching copy, icon contrast, presentation markup and action states. Live Chromium confirmed the special matching title is exactly “正在踏入深渊。。。”；room utility/action/system-record icons resolve to `rgb(255, 248, 247)` with `2.4px` strokes, while disabled counting resolves to `rgb(190, 169, 173)`.
* 2026-08-07 presentation QA: the live NPC dialogue resolves to one outer red-black gradient while `.sigrika-duel-dialogue-copy` is transparent and borderless; static/component contracts apply the same invariant to the skill portrait and copy regions. 390×844 and 412×915 both report document width equal to viewport width, with the action bar fully contained. The focused skill-effect stability suite passed 4 / 4 on desktop and mobile Chromium using `STABILITY_PORT=4179`; the alternate port avoids the unrelated already-running service on 3001.
* 2026-08-07 replay/contrast follow-up: live Chromium measured the 420px resignation confirmation with hidden overflow and pale labels at 8.66:1 (danger) / 10.76:1 (secondary) contrast. A completed QA special replay rendered exactly five top-level grid cells, no title/tag prefix, a 22px icon-only Boss badge nested inside the timestamp cell, the canonical anonymous-player/NPC WebPs, and a pale blood-red computed gradient. Focused follow-up suites passed 113 tests, battle regression passed 432 tests, and desktop/mobile stability passed 8 / 8. The full repository suite passed 2438 tests and all 18 portrait checks before the pre-existing stale admin-default snapshot gate (`siteSettings`, `shopItems`, `storyScripts`) stopped `npm run check`; production build, built CSS, deployment config, lint, and generated system-design HTML passed independently.
* 2026-08-07 friendly replay badge follow-up: ordinary unrated replays now keep the accessible `Handshake` inside the timestamp cell but position it as the same 22px top-left corner badge geometry used by the Boss marker. Shared `replay-corner-icon` rules removed duplicated positioning CSS, so the CSS non-growth baseline passes without being raised. Focused replay/style/inventory suites passed 87 tests, battle regression passed 432 tests, and lint, production build, generated system-design HTML, built CSS contracts, and `git diff --check` all passed.
* 2026-08-07 mobile replay badge clipping follow-up: portrait replay tables now reserve a 7px inner gutter for the `-7px` corner-badge bleed. The nested replay card and timestamp cell use visible overflow while the modal shell and outer list retain their original clipping/scroll ownership, so both the friendly `Handshake` and special `Crown` remain fully visible. Focused replay/style/inventory suites passed 87 tests, battle regression passed 432 tests, and lint, production build, generated system-design HTML, built CSS contracts, and `git diff --check` passed without raising the CSS debt baseline.
