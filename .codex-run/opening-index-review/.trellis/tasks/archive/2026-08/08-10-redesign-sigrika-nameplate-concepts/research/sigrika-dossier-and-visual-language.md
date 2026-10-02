# 西格莉卡角色证据与用户名背景视觉语言

## Source scope

- 项目角色与技能默认数据：`server/adminDefaultSnapshot.js`。
- 项目已发布入门剧情：`server/adminDefaultSnapshot.js` 中 `StoryScript` 发布节点，尤其是 `doc-*` 与 `story-*` 节点。
- 现有成就/奖励：`achievement-sigrika-spark-100-wins` 与 `reward-sigrika-spark-100-wins-nameplate`。
- 可见造型校准：`public/assets/characters/portraits/sigrika.webp`、`public/assets/sigrika_centered.webp`；只用于服装轮廓和配色佐证。
- 用户提供的九张截图：全部作为横向游戏铭牌结构参考，不作为角色设定证据或编辑目标。

## Mandatory text evidence matrix

| Category | Status | Paraphrased evidence | Source locator | Design relevance |
|---|---|---|---|---|
| Personality and contradictions | found | 西格莉卡活泼亲和，教学时爱用“哼哼”“嗯嗯”“啦/哟/呢”；她自信展示技能，但输棋后会直白抱怨“不甘心”，随后复盘更好的下法。 | `server/adminDefaultSnapshot.js` story nodes `doc-story-143..194`, `story-54`, `story-62`, `story-64` | 视觉应明亮、灵动、略带好胜的爆发感，而不是冷酷或沉重。
| Biography and formative events | found | 她是星炬学院围棋部部长，也是玩家初始获得的角色；已发布文本没有更早成长经历。 | `server/adminDefaultSnapshot.js:111-122`; story node `doc-story-194` | 角色身份支持亲和、可靠和引导感，但用户明确禁止把围棋身份转画为棋盘或棋子。
| Goals, values, fears, and conflicts | found | 她希望玩家理解围棋并常来围棋部练习，重视基本规则、礼仪和技能代价；同时好胜，失败后会复盘。文本没有明确恐惧。 | story nodes `doc-opening-etiquette`, `doc-story-191..193`, `doc-story-183..187`, `story-35..36` | 用受控、清晰而非铺满画面的符文秩序表现她的精确性；不采用围棋图形或无代价的万能魔法意象。
| Relationships and social behavior | found | 她亲切称达妮娅为“娅娅”，邀请她配合演示；会吐槽其技能过强，也会维护她给围棋部提供棋盘。她主动邀请玩家认识其他部员。 | story nodes `doc-story-149`, `doc-skill-174`, `doc-story-180`, `doc-story-188..190`, `story-42`, `story-47..49` | 整体气质应是团队型、校园型、友好而非孤绝；不使用王冠、统治或孤狼符号。
| Representative dialogue and speaking style | found | 语气轻快、口语化，常用感叹、拟声和撒娇式抱怨；讲规则时又能连续、清晰地拆解概念。 | story nodes `doc-territory-*`, `doc-skill-167..174`, `doc-story-180..194` | 使用轻快、柔和、有节奏的符文光线，不做肃穆古典牌匾或硬质竞技机框。
| Major plot beats and character development | found | 入门剧情中她从规则教师转为实战演示者，展示星辉符文、解释超频代价，输给达妮娅后复盘，并把玩家引向围棋部长期学习。 | story nodes `doc-skill-159..180`, `doc-story-183..194`; parallel nodes `story-27..45` | 三方向分别强调符文徽记、符文织带和完整星辉术式，避免机械化与泛用装饰。
| Powers, abilities, and recurring actions | found | 技能“星辉符文”带【疾走】，指定并抹除一个棋盘交叉点；一局一次、超频 3 子。系统文案描述力量从天而降摧毁交叉点。 | `server/adminDefaultSnapshot.js` character `sigrika.skill`; story nodes `doc-skill-167..173`; skill display entry `:955-956` | 只提炼“星辉符文”“疾走”“从天而降”的魔法语言；用户明确禁止把作用对象转画为棋盘、棋子或交叉点。
| Meaningful objects, places, hobbies, and foods | found | 围棋部活动空间、13/19 路棋盘、棋子、IRIS 图书馆资料与五子棋是明确对象/地点/活动；已发布资料没有专属食物。 | story nodes `doc-story-147`, `doc-story-191..193`, `doc-opening-*` | 这些事实保留在角色档案中，但用户明确禁止本轮使用任何围棋相关视觉，不进入提示词。
| Achievement/reward meaning | found | “点亮语义！”要求在星炬对弈中使用西格莉卡获得 100 胜，奖励为用户名背景。 | `server/adminDefaultSnapshot.js:813-824`, `:869-876` | 用逐步点亮、汇聚或完整展开的符文层表达积累，不直接写 `100`，也不使用落子、奖杯、奖牌或桂冠。

## User-reference structure analysis

九张参考的共同结构：

- 左侧约占整体 `18%–28%`，用高对比的大型核心承担第一眼识别；参考中的罗马数字/段位章在本任务中必须替换为角色物件。
- 中央是连续、安静、较高对比的用户名载体，不再把称号和徽章拆成第二层或上下层。
- 右端只借鉴“短促收束”这一节奏；喷口、机械尾和独立数字章/统计章均不采用。
- 参考图的硬框、装甲层和机甲感不适合西格莉卡。新版只保留紧凑比例，轮廓改由符文光流和柔和魔法材质形成。

## Evidence-to-design synthesis

| Textual evidence | Interpretation | Visual decision | Confidence/source |
|---|---|---|---|
| 技能名称是“星辉符文” | “符文”本身应成为角色第一识别语言 | 使用手绘星辉符印、短弧咒纹和点亮的抽象符号，不画通用等级数字 | high; character skill data |
| 系统文案写力量从天而降摧毁目标点 | 技能动作带有落星般的方向感 | 允许一版让金白符文光从左上汇入核心，但不画冲击棋点或机械武器 | high; character skill system message |
| 围棋部部长、规则教师与长期练习邀请 | 她既有秩序感又有亲和力 | 用清晰但柔和的符文间距和连续用户名载体表达可靠感；不使用围棋图形或威权王冠 | high; tutorial story + explicit user exclusion |
| 技能有一次使用与超频代价 | 强力动作应受控、精确，而非铺满全屏 | 发光集中在左锚和边缘，中央用户名区保持低细节 | high; skill data + tutorial |
| 使用西格莉卡取得 100 胜 | 成就是多次积累后完整点亮 | 边缘用逐渐点亮的小型符文与星点汇聚，不写数字、不画奖杯 | high; achievement seed |
| 角色项目主色为 `#ff9b4d` | 暖橙是最稳定的角色主色 | 暖橙作为符文主光，深紫作柔和光幕底，白金作为少量符印描线 | high; character data |
| 可见立绘有白金星形头饰、深紫衣片与薄荷青眼色 | 角色造型支持星形符印与柔和布料/光幕配色，但不支持机甲外框 | 左侧借用头饰的星形符印轮廓；白色只作魔法描边，薄荷青仅作少量冷色点亮 | medium; visible costume corroboration |
| 用户要求去掉徽章/称号预留并替换罗马数字块 | 用户名背景要成为唯一完整主角 | 三版均使用单一连续载体；删除独立右章、上下称号层和空白占位 | explicit user direction |
| 用户明确拒绝围棋要素和机甲硬框，并要求增加符文 | 首轮的棋盘模块与装甲边框偏离角色 | 所有新版禁用围棋与机械结构，以符文织带、魔法墨迹和星辉术式成形 | explicit user direction, 2026-08-10 |

## Visual-language card

# 西格莉卡用户名背景视觉语言

## Emotional target

- Three adjectives: 元气、神秘、轻盈。
- Energy level: 中高，但通过符文逐步点亮和柔和光流表达，不淹没用户名。
- What the nameplate should make the player feel: 像一段被完整展开的星辉术式，温暖、聪明、有魔法亲和力。

## Narrative anchors

- Primary anchor: 开放式星辉符印 / 符文结 / 半展开星辉术式，按方向各选其一。
- Supporting motif family: 手绘金色咒纹、星点、短弧符文、深紫魔法墨迹与少量薄荷青灵光。
- Tail/closure language: 符文织带自然变细、魔法墨迹淡出或星辉术式弧线闭合；不使用硬切角、喷口或独立数字章。

## Palette and material

- Base/carrier: 深紫至柔和葡萄紫 `#2b163f–#5a2d78` 的半透明魔法光幕或水彩织带。
- Primary light: 角色暖橙 `#ff9b4d` 与暖金白 `#fff6d8`。
- Secondary accent: 金色 `#e8b94e`，极少量薄荷青 `#b8f8dc`。
- Hand-painted/material treatment: 柔和的水粉、魔法墨水、透明水彩晕染与细金笔符文；轮廓清晰但没有金属装甲、机械连接或硬电竞框。

## Motion verbs

- Persistent light: 左侧符印内敛呼吸与符文线常亮。
- Local narrative motion: 咒纹依次点亮、符文织带轻微流动、星辉术式短弧闭合。
- Secondary accent: 少量星点和薄荷青灵光闪烁；不能承担主要照明。

## Exclusions

- User-rejected motifs: 旧版为称号/徽章预留的区域、罗马数字块、右侧数字章、分离式称号栏；任何围棋盘、棋子、棋格、交叉点和落子轨迹；任何机甲、装甲、机械夹具、金属底盘和硬质电竞框。
- Misleading character signals: 王冠、奖杯、奖牌、桂冠、通用军衔、通用火焰、通用电竞字母徽标、科幻 HUD 和机械符号。
- Generic visual shortcuts to avoid: 大面积霓虹雾、旋转机械环、全宽高光扫过、复制参考品牌 UI、人物头像或脸、只在硬框上贴几枚符文。
- Raster text exclusions: 用户名、角色名、字母、数字、`100`、Logo、水印、UI 标签。

## Geometry

- Delivery canvas: `1125 x 240` (`4.6875:1`)。
- Runtime slot: `150 x 32`。
- Username safe area: `x=315..990`，约 `28%–88%`；中心保持低细节和稳定对比。
- Minimum Alpha margins for later production: left/right `>=40px`，top/bottom `>=8px`；候选阶段先保持相同构图安全意识。

## Three direction plan

1. **辉星符印**：开放式四向星辉符印替代等级章，深紫魔法墨迹形成安静载体，强调单一符文徽记。
2. **暖明符文织带**：多条橙金咒纹在左侧编成符文结，随后化为柔软的紫色光带，强调流动和亲和感。
3. **星辉术式**：左侧半展开的手绘术式圆弧与核心星符共同成形，载体由弧形符文光幕闭合，强调完整魔法仪式感。

## User correction — 2026-08-10

- V1 的棋盘、棋子和交叉点方向被明确否决。
- V1 的白色装甲片、机械夹具和硬边框被明确判定为机甲风，不符合西格莉卡。
- V2 必须让符文成为主体结构，而不是装饰性点缀；三版都要柔和、轻盈、魔法化。
