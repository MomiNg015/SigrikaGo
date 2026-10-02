# 制作黑化西格莉卡 BGM 试听变体

## Goal

为西格莉卡黑化阶段制作保留原旋律辨识度、但明显诡异阴森的 BGM 变体，先通过短试听确定污染强度，再将选定方向制作成可无缝循环并接入现有音乐系统的正式 OGG 资源。

## Decision (ADR-lite)

**Context**：西格莉卡黑化状态同时覆盖主页与特殊决战，两处母曲的叙事作用不同，且用户需要先听到实际效果再确定正式方向。

**Decision**：本轮分别以 `main_bgm.ogg` 和 `sigrika_loop.ogg` 为母曲，各制作轻度、推荐、重度三档约 30 秒试听，共六份；本轮不接入运行时。

**Consequences**：用户可以分别选择主页和决战的污染强度，不必接受同一档位；正式循环、intro/loop 衔接和代码接入延后到试听选择之后。

### 2026-08-07 试听反馈

* 黑化主页选择第一轮 `home-corruption-light.ogg`，后续正式主页资源沿用其核心参数：`pitch=0.917004`（-150 cents）、`tempo=0.97` 与克制的暗化空间处理。
* 第一轮三份 `sigrika_loop.ogg` 决战试听均被判定为不够诡异，暂不采用。
* 第二轮改用 `sigrika_intro_once.ogg` 的完整旋律素材，新增三份以变调为主要差异的决战试听。
* 第二轮决战选择 B：`sigrika-once-corruption-b-detuned-shadow.ogg`，正式资源沿用 `pitch=0.865537`（-250 cents）、`tempo=0.94` 与约 +35 cents 延迟影声。
* 选择完成后进入正式制作与运行时接入：黑化主页使用 light 完整循环；特殊决战使用 B 参数处理后的 `once → loop`，恢复正常状态后回到原有音乐解析。

## What I already know

* 用户已认可先制作三种约 30 秒的试听方向：轻度诡异、推荐强度、重度黑化。
* 当前黑化覆盖层挂载时调用 `requestBackgroundMusicPause()`，黑化阶段实际上会暂停现有 BGM。
* 项目音乐目录已有西格莉卡主题的 intro/loop 对：`sigrika_intro_once.ogg`（约 25.9 秒）与 `sigrika_loop.ogg`（约 73.0 秒）。
* `MUSIC_TRACKS` 与 `useBackgroundMusicTrack()` 是现有 BGM 资源和运行时选择入口。
* 本机 FFmpeg 构建包含 `librubberband`，可独立控制音高和速度，并具备低通、回声、颤音、失真、bit-crush 与响度归一化滤镜。

## Assumptions (temporary)

* 正式接入时保留原始正常阶段音乐，只在服务端持久化的黑化状态生效。

## Open Questions

* 无；正式接入范围留到用户完成试听选择后的后续任务确认。

## Requirements (evolving)

* 保留母曲的旋律与角色辨识度，避免变成与西格莉卡无关的通用恐怖氛围音乐。
* 三个试听方向需要有清晰可辨的污染强度梯度。
* 第一轮同时制作两组试听：西格莉卡角色主题三档、主页默认主题三档，共六份；两首母曲分别处理，不混音到同一文件。
* 本轮只生成评审用试听文件，不改动运行时 BGM 路由，不覆盖原音频，也不提前选择正式版本。
* 第二轮决战试听使用 `sigrika_intro_once.ogg`，分别探索 -150 cents 纯失准、-250 cents 加错位影声、以及以三全音关系叠加鬼影声部三种方向。
* 正式主页和决战资源必须保留循环连续性；循环段通过连续多周期处理、稳定中段截取和短等功率边界交叉淡化生成。
* 黑化专曲属于剧情内部资源，不进入可购买、抽卡、成就奖励或用户音乐选择目录。
* 黑化主页的专曲优先于主页随机曲池；`SIGRIKA_CANDY_DUEL.matchSource` 的专曲优先于普通对局/技能曲解析。
* 登录预加载只为已黑化用户加入主页专曲；特殊决战预加载必须加入决战 once/loop，即使房间技能关闭或用户态尚未恢复完整。
* 不修改或覆盖现有正常 BGM 文件。
* 音频处理采用离线资源生成，不把持续实时 DSP 负担放到浏览器或移动端。

## Acceptance Criteria (evolving)

* [x] 产出六份可直接试听的 OGG 或 WAV 评审文件，两组文件均能区分轻度、推荐、重度方向。
* [x] 六份试听均保留各自母曲旋律，用户已据此选定主页 light 与第二轮决战 B。
* [x] 试听文件的自动检查未发现削波或异常静音；主观音色由用户试听验收。
* [x] 六份试听均以清晰的绝对路径交付，用户可以逐份播放并分别选择主页和决战方向。
* [x] 本轮运行时代码、现有音乐资源和黑化静音行为保持不变。
* [x] 产出三份基于 `sigrika_intro_once.ogg` 的第二轮决战试听，变调差异清晰且比第一轮更突出。
* [x] 第二轮三份试听通过编码、峰值和异常静音检查。
* [x] 正式生成黑化主页 loop、决战 once 和决战 loop 三份 OGG，循环/衔接无明显跳变且无削波或异常静音。
* [x] 黑化主页与特殊决战分别解析到选定专曲，普通主页、普通房间、匹配成功和结果阶段行为保持不变。
* [x] 登录与特殊决战预加载覆盖新增资源，相关单元/DOM 测试通过。
* [x] 系统设计与现有黑化 BGM 质量合同更新，`npm run docs:system-design` 已通过；全量门禁仅保留既有后台默认快照陈旧阻塞。

## Definition of Done

* 试听资产已生成并提供可点击试听路径。
* 音频产物经过时长、编码、峰值与静音检测。
* 因本轮不改变架构或运行行为，不改动系统设计文档；正式接入时再同步文档并运行项目质量检查。

## Out of Scope (explicit)

* 第一轮试听不重写原曲编曲或加入新录制的人声。
* 第一轮试听不覆盖现有正常阶段资源。
* 不把黑化专曲暴露为商城、抽卡、成就或玩家可选择音乐。
* 不改变普通角色音乐预览的共享暂停/恢复机制。

## Technical Notes

* 当前静音入口：`src/app/SigrikaCorruptionOverlay.jsx`。
* 曲目目录与解析：`src/shared/musicLibrary.js`、`src/app/useBackgroundMusicTrack.js`。
* 候选母曲：`public/assets/music/sigrika_intro_once.ogg`、`public/assets/music/sigrika_loop.ogg`、`public/assets/music/main_bgm.ogg`。
* 第一轮以 `sigrika_loop.ogg` 为西格莉卡组母曲，以 `main_bgm.ogg` 为主页组母曲。
* 第二轮决战母曲改为 `public/assets/music/sigrika_intro_once.ogg`。
* 正式决战 loop 同步使用 B 参数处理 `public/assets/music/sigrika_loop.ogg`；主页正式 loop 使用 light 参数处理完整 `public/assets/music/main_bgm.ogg`。
* 技术研究：[`research/audio-processing.md`](research/audio-processing.md)。
