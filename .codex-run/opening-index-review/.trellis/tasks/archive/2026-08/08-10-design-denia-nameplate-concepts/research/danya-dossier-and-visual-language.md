# 达妮娅档案证据与铭牌视觉语言

## Sources inspected

- 官方库街区当前条目：`https://wiki.kurobbs.com/mc/item/1488852222116831232`。本轮于 `2026-08-10` 通过动态页面正文读取，页面标示更新于 `2026-05-21`；核对到基础资料、战斗形态、共鸣链、共鸣能力鉴定、珍贵之物与角色故事入口。
- 同一官方条目的前次完整客户端正文摘录：`.trellis/tasks/07-17-danya-achievement-nameplate-concepts/research/danya-dossier.md`，覆盖角色故事、珍贵之物和角色语音分篇。本轮仅复用其释义与定位，不复制长段原文。
- 项目事实：`src/shared/characterFallback.js`、`src/styles/hud-components/user-identity/denia-echo-nameplate.css`、`docs/system-design.md`、`public/assets/characters/portraits/denia.webp`、`public/assets/achievements/denia-spark-100-wins-nameplate.png`。

## Mandatory text evidence matrix

| Category | Status | Paraphrased evidence | Source locator | Design relevance |
|---|---|---|---|---|
| Personality and contradictions | found | 她表面懒散、爱打瞌睡、常带温柔笑意和轻巧谎言，深层却警觉、害怕孤独，也会为了保护他人变得坚定。 | 官方 `基础资料`；前次全文 `角色语音 > 心声1-5`、`角色故事 > 明昼` | 造型应柔软、慵懒但有被保护的深色核心，不能只做甜美可爱。 |
| Biography and formative events | found | 她曾被残星会作为资产与容器培养，接受虚空力量并怀疑名字与记忆是否属于自己，后来在人群与学院生活中逐渐形成自己的心和选择。 | 官方 `角色故事 > 礼物/荒芜`；本轮动态正文已核对 `礼物` | 粉色人性与深梅紫虚质需要共存，构图从包覆/隔绝走向温暖连续。 |
| Goals, values, fears, and conflicts | found | 她向往睡眠、美食和朋友相伴，害怕孤独与虚无，拒绝只作为样本或筹码，最终选择未来与他人的幸福。 | 前次全文 `角色语音 > 抱负和理想/突破5`；`角色故事 > 群魔/谎言` | 成就感来自长期选择与守护，不使用奖杯、王冠或胜利数字。 |
| Relationships and social behavior | found | 她珍惜西格莉卡、绯雪、弗洛洛、娜斯塔霞、莫宁与漂泊者带来的关怀，也重视学院合照与共同生活。 | 前次全文 `角色语音 > 关于…`；`珍贵之物 > 星炬纪念相册` | 相册/照片页只作为轻量校园记忆标点，不抢占泡影主语言。 |
| Representative dialogue and speaking style | found | 语气常慵懒、调侃、略带逃避；谈到虚无、信任、孤独与幸福时则转为亲密、直接且有哲思。 | 前次全文 `角色语音 > 心声1-5/闲趣1-3/突破4-5` | 手绘边缘可松弛漂浮，左侧核心与收尾要有一次清晰的情绪聚焦。 |
| Major plot beats and character development | found | 她从被定义为空容器、被虚无牵引，走到承认自己微小而真实的心，并选择属于自己的道路。 | 官方 `角色故事 > 荒芜/明昼/群魔/谎言` | 三版都表现“深色被柔软泡影包覆，而非吞噬粉色载体”。 |
| Powers, abilities, and recurring actions | found | “泡影视阈”释放含回音能量的泡泡，能够防护、战斗支援、爆破和虚质隔绝；战斗有“布景之形/幻灭之形”双态，也有把虚质塑成方块的记录。 | 官方 `角色档案 > 共鸣能力鉴定报告`、`技能说明`、`共鸣链` | 泡泡装置、保护膜、双态帷幕与被泡影包覆的虚质方块均为高置信左侧核心。 |
| Meaningful objects, places, hobbies, and foods | found | 她拥有“造梦者”泡泡装置、星炬纪念相册，喜欢借难课入睡、热甜食、生日蛋糕和甜果酱；破旧玩偶虽存在，但已被用户明确否决用于铭牌。 | 官方 `珍贵之物`、`特殊料理`；前次全文 `角色语音 > 喜好/喜欢的食物` | A 可使用造梦器具；相册仅作辅助；暖奶油与果酱粉可进入光色；玩偶/缝补完全禁用。 |
| Achievement/reward meaning | found | “百次回响”记录在星炬模式使用达妮娅取得 100 胜，是对长期熟练使用与反复依赖其保护/逆转能力的纪念。 | `docs/system-design.md:253`；`server/achievements.js` | 通过重复回声、闭合保护与稳定载体表达积累，不绘制 `100`、段位或奖章。 |

## Evidence-to-design synthesis

| Textual evidence | Interpretation | Visual decision | Confidence/source |
|---|---|---|---|
| “造梦者”是她用来释放泡泡的装置。 | 这是比通用等级圆章更直接的角色物件。 | A 左侧使用柔软玩具感的泡泡吹口/手柄剪影，泡膜自然延展为用户名载体。 | high，官方 `珍贵之物/共鸣能力鉴定报告` |
| 泡泡可防护、隔绝虚质，也能一次性释放能量爆破。 | 她的泡影不是纯装饰，而是带张力的保护边界。 | B 左侧用一大一小保护泡核，中央是两层错位的粉色/深梅紫帷幕，右侧以薄膜回卷收束。 | high，官方 `共鸣能力鉴定报告` |
| 她有布景与幻灭双态，并能将虚质塑成方块。 | 柔软泡膜与几何深色核心构成独特反差。 | C 左侧用圆角深梅紫虚质方块被半透明粉泡包覆，载体为被拉开的液态泡影，尾部凝成小回声结。 | high，官方 `技能说明/共鸣能力鉴定报告` |
| 她珍惜星炬相册与朋友，选择未来与幸福。 | 记忆是支撑，而不是另一套主视觉。 | 每版最多使用一个小照片角/纸页压痕，且只在边缘作辅助；中心保持连续。 | high，官方 `星炬纪念相册/角色故事` |
| 角色基础色粉、淡紫、白，项目色为 `#f2a4d8`，虚质与严肃情绪对应深梅紫。 | 色彩要明亮梦幻，但必须有深色层次与文字对比。 | 主色草莓粉、玫瑰石英、淡紫和暖白；深梅紫仅作核心、下缘或阴影，不支配整板。 | high，项目角色数据 + 官方可见设计 |
| 百胜意味着持续熟练与反复守护。 | 应表达重复回响和闭合，而非胜利奖牌。 | 用 2–4 个不同尺度的回声点、膜层或闭合尾结暗示积累，禁止数字、奖杯、桂冠。 | high，成就合同 |

# 达妮娅用户名背景视觉语言卡

## Emotional target

- Three adjectives: 梦幻、慵懒、被温柔守护。
- Energy level: 静态以缓慢漂浮为主，左侧核心保留一处内聚张力。
- Player feeling: 熟悉她轻松笑意之下的虚质深度与真实选择。

## Narrative anchors

- Primary anchor: A 造梦者泡泡装置；B 保护性双态泡核；C 泡膜包覆的虚质方块。
- Supporting motif family: 回音折射、薄膜回卷、极少量相册纸角。
- Tail/closure language: 泡膜尖尾、柔软帷幕回卷或闭合回声结。

## Palette and material

- Base/carrier: 草莓粉、覆盆子粉、玫瑰石英、淡紫。
- Primary light: 暖白、奶油桃、珠光粉。
- Secondary accent: 深梅紫虚质、少量冰蓝与金色首饰点色。
- Hand-painted/material treatment: 不规则水粉笔触、半透明水彩泡膜、颜料晕染与柔软纸边；避免抛光矢量和金属硬壳。

## Motion verbs for later integration

- Persistent light: 泡核/膜边持续微亮。
- Local narrative motion: 慢漂、呼吸、折射回弹或双态错位。
- Secondary accent: 稀疏回声点与一两次柔光脉冲。

## Exclusions

- User-rejected motifs: 围棋要素、机甲/硬质电竞框、玩偶、布料、缝补、补丁、针线、拼布。
- Misleading character signals: 王冠、奖杯、桂冠、段位章、罗马数字、字母徽标、残星会正面徽记。
- Cross-character leakage: 西格莉卡星辉符印、金色符文主语言、星形主核与魔法墨尾。
- Existing-asset repetition: 双端同权同心泡泡门、大量相册页堆叠、厚重矩形粉色胶囊框。

## Geometry

- Delivery canvas: `1125 x 240` (`4.6875:1`).
- Runtime slot: `150 x 32`.
- Username content area: runtime left `40px`, right `25px`; canvas equivalent约 `x=300..937.5`。
- Quiet safe zone: generation target `x=315..930`，低细节、高对比。
- Candidate-stage safety: 所有关键轮廓远离四边，后续选中版再做正式 Alpha 数值验证。

## Rejected v1 concept directions

- A「造梦泡鸣」：左侧造梦者泡泡器具形成开放圆口，粉色泡膜直接拉成长载体，右侧以两颗小回音泡和一个轻纸角结束。
- B「双态软幕」：左侧两枚相扣的保护泡核分别表现布景/幻灭，中央由上下错位的粉色软幕包住深梅紫底层，右侧像帷幕回卷般收束。
- C「虚质入梦」：左侧圆角深梅紫虚质方块被半透明粉色泡膜包覆，中央是液态泡影载体，右侧凝成一个闭合回声结和少量冰蓝折射点。

## User correction after v1

- v1 的粉色/糖果色整体被否决。
- 泡泡不应作为达妮娅用户名背景的主体；达妮娅与虚空物质、虚质、黯核、熵变和幻灭的关系才是第一身份层。
- v2 只允许泡泡作为几乎不可见的能力余迹；主体轮廓、材质和色彩必须由虚质决定。
- v2 色板改为近黑靛紫、烟灰紫、石墨灰、冷白，最多加入少量暗红或冷品红作为危险能量缝隙，不再使用大面积草莓粉、珠光粉或糖果折射。

## Revised v2 visual sentence

“被压缩的虚质在黑紫空间中形成一枚不稳定核心，冷白裂隙和克制的暗红回声证明其中仍存在意志；用户名载体是被撕开的虚质场，而不是泡膜、相册或甜美装饰。”

## Revised v2 concept directions

- A「黯核容器」：左侧一枚不规则黯核悬在破裂的虚质壳中，中央为哑光烟紫压缩场，右侧收成三片逐渐消散的虚质碎屑。
- B「虚质折域」：左侧清晰三面的黑紫虚质方块发生错层折叠，中央由数层深灰紫空间切片交叠成安静载体，右侧以薄片折返闭合。
- C「幻灭蚀域」：左侧一道非圆形空间撕口吞没冷白光，中央像被风拉开的黑紫蚀域帷幕，右侧化为灰烬、黯核微粒与一条暗红余裂。

## Revised v2 exclusions

- No bubble-led silhouette, soap-film gloss, candy pink, pearl-pink refraction, hearts, cute toy device, album/photo pages, or glitter.
- No mechanical casing, sci-fi panel, armor, hard esports border, circuitry, bolts, rails, rank ring, or metallic chassis.
- No Go elements, Sigrika runes/stars/gold magical ink, dolls, fabric, stitching, or text.

## User correction after v2

- v2 overcorrected the previous feedback: it removed Danya's pink-purple identity together with the bubble-led full-plaque treatment.
- Correct interpretation: pink-purple remains the dominant palette, and one bubble may be the primary element on the left. The bubble should not become the entire carrier or repeat as an equally weighted element on the right.
- The earliest supplied references remain the layout authority: a strong left identity element replaces the rank numeral, the username occupies one continuous horizontal carrier, and the right end resolves as part of that carrier rather than a detached badge/title slot.
- Virtual matter should enrich the bubble core and energy tail through a dark core, an impossible cube, entropy seams, refracted fragments or spatial offsets. It should not turn the whole nameplate into a black horror banner.

## Revised v3 visual sentence

达妮娅的单枚粉紫梦泡在左侧包裹不同形态的虚质核心，向右舒展为柔软明亮、可完整承载用户名的连续能量带，再以轻盈的虚质折光或熵变碎屑收束。

## Revised v3 concept directions

- A「黯核梦泡」：左侧粉紫泡泡内悬一枚不规则黯核与冷白裂隙，中部为偏深莓紫的柔光载体，右端收成一束短小虚质尾焰。
- B「虚质方泡」：左侧主泡泡内包裹错位的半透明虚质方块，中部由三层粉紫折光带叠成连续载体，右端以薄片折返收束。
- C「熵变回响」：左侧泡泡内是旋开的熵变涡心与少量碎片，中部为玫紫到紫罗兰的柔雾能量带，右端化为三枚微小回响碎屑。
