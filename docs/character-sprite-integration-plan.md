# 标准立绘与表情接入方案

2026-10-02 · 分阶段方案，剧情引导已实装

2026-10-03 最新引导调整：教学 NPC 与首页导览采用用户指定的固定方形头像＋独立动态对白布局，使用现有256px表情头像。角色名立即显示，正文逐字出现；头像顶部对齐，裁切与尺寸不随框高变化。正文保留自然增高，首页头像独立于文本滚动层。剧情舞台仍使用完整图，下面的早期构图建议及胸像实施记录不覆盖这一新决定。

已确认按场景逐步替换：剧情和大展示使用标准立绘，小头像使用独立裁切，对局出框位先做半身样板。先保留现有 `portraitUrl` 作为兼容入口，新增带表情的资源集合与解析器。这样可以逐个场景调整，而不会一次换图影响整套界面。

前一轮已阅读三份 DELIVERY.md，检查表情预览和默认全身图，独立核对全部 27 张 PNG 的尺寸、RGBA 模式、Alpha 与原图一致性，以及 24 张新表情的 manifest 哈希。

样板阶段已提供[独立交互样板](./prototypes/character-sprites/index.html)：西格莉卡剧情、手机对局卡、队际头像和结算，随后补充部员手册、首页学生证与履历。手册支持三名角色的完整九种表情、桌面全身／手机膝上展示与完整立绘预览；学生证、履历使用默认微笑的专门头像裁切，并保持信息区和正文滚动。样板复制的 27 张原 PNG 保持 SHA-256 一致，介绍、CV 与技能来自默认快照离线数据。样板运行方式及验证范围见[样板说明](./prototypes/character-sprites/README.md)。

用户随后授权先实装剧情引导：正式剧情窗口、教学 NPC 气泡及固定首页导览已使用标准立绘／专用近景头像。现有 225 节点、169 段角色台词和 22 段首页导览台词保持原内容，并逐段配置表情；后台和旧版 Excel 均支持两项展示字段。原 PNG 与已发布数据库内容不改，通过完整原文匹配的配置在响应阶段接入。正式资源、优先级和预加载见[资产分篇](./system-design/05-assets-audio-preload.md#标准剧情立绘与表情)。其余场景仍处于样板阶段；下文分阶段目标以该实施状态及正式合同为准。

## 1. 角色映射与表情清单

| 角色 | 素材目录 / base_id | 项目角色 ID | 接入处理 |
| --- | --- | --- | --- |
| 西格莉卡 | `sigrika-sprite-expressions` / `sigrika` | `sigrika` | 直接关联 |
| 达妮娅 | `denia-sprite-expressions` / `denia` | `denia` | 直接关联 |
| 爱弥斯 | `amis-sprite-expressions` / `amis` | **`aemeath`** | 在素材导入映射中明确 `amis → aemeath`，保留项目角色 ID |

项目当前没有 `amis` 角色别名。不能直接把素材目录名写成剧情 `characterId`，也不需要重命名角色、音乐、技能或历史记录。

| 表情 key | 西格莉卡 | 达妮娅 | 爱弥斯 |
| --- | --- | --- | --- |
| `original` | 原图·开口笑 | 原图·开口笑 | 原图·柔和微笑 |
| `smile` | 微笑 | 温柔微笑 | 明快微笑 |
| `closed_smile` | 闭眼笑 | 闭眼浅笑 | 闭眼开心笑 |
| `thinking` | 思考 | 安静思考 | 专注思考 |
| `surprised` | 惊讶 | 轻微惊讶 | 好奇惊讶 |
| `serious` | 认真 | 清醒认真 | 坚定认真 |
| `worried` | 担忧 | — | — |
| `angry` | 生气 | — | — |
| `embarrassed` | 害羞 | — | — |
| `sleepy` | — | 慵懒困倦 | — |
| `playful` | — | 俏皮轻笑 | — |
| `annoyed` | — | 轻微不满 | 轻微不满 |
| `wink` | — | — | 俏皮眨眼 |
| `wry` | — | — | 无奈吐槽 |

`original` 是各包保留的原图，不在 manifest 的八种新增 expressions 内。西格莉卡文件名是 `sigrika-<key>.png`；另两包是 `<key>.png`。导入应读取 manifest 的实际路径，分别放在角色目录中，避免三个 `smile.png` 相互覆盖。

三套均为 **832×1216**，画布比例约 **0.684:1**。原 PNG 合计 **32.48 MiB**；若全部按 RGBA 解码，仅像素缓冲就约 **104.2 MiB**，尚未计入浏览器和 GPU 开销。

DELIVERY 与单独的 `qa/visual-review.json` 记录了助手检查，但三个 manifest 的 review 状态仍停留在 `needs_review/pending/internal_pending`。本次确实核对到文件齐全、表情哈希与 Alpha 一致；身体、鼻部保护及 PSD 合成精度仍引用交付 QA，没有重新执行整套制作流程或 Photoshop 往返检查。接入前还需按实际游戏尺寸确认裁切与表情辨识度。

## 2. 为什么需要按场景构图

现有内置头像有独立规格：900×900 WebP，可见主体最长边 792px、底部留白 54px，并水平居中。新完整立绘不符合这条资源合同，直接写进默认 `portraitUrl` 还会影响资源检查、默认值同步与预加载。

现有剧情图片桌面仅约 104–172px 高，手机约 118px 高；教学 NPC 气泡是 68×68px，手机 58×58px。新图全身缩到 118px 高时，面部编辑区的参考宽度仅约 17–20px，嘴与眉的细微变化会很难分辨。手机对局出框位也只有约 88px 图宽、94px 卡高。

三套素材身体和透明度相同，适合在固定构图下切表情。它们不会自动提供挥手、施法、受击等动作；演出应通过现有特效与表情配合，不能把面部差分当作动作差分。

建议资源集合提供三种用途：

| 用途 | 构图与交付 | 主要场景 |
| --- | --- | --- |
| `illustration` | 完整透明立绘；保留原画布和统一身体锚点 | 剧情舞台、手册详情、大展示 |
| `bust` | 经人工确认的胸像／半身窗口；同角色所有表情共用框与比例 | 玩家卡、技能横幅、结算、教学提示 |
| `avatar` | 正方形头肩裁切，保留头饰、下巴与适当留白；按显示尺寸输出小图 | 队际头像、好友、战绩、回放列表、小卡片 |

完整立绘可以保留一个源图，以用途元数据控制舞台裁切；高频小头像应导出小尺寸派生图，避免为一个 58px 气泡下载整张 PNG。头像建议先做 256px 输出，半身的导出尺寸再由实际最大显示尺寸与设备像素比决定。PNG 作为归档源，透明 WebP 作为运行资源候选，转换后单独核验 Alpha 和面部笔触。

`rig.crop` 是面部制作范围，不能直接作为 UI 头像框。它没有完整包含头饰、发型和肩部。也不能对每张表情按 Alpha 自动紧裁，否则同角色会换图跳动。默认不镜像整张立绘，服饰细节与装饰方向需要保留；双人对阵先通过站位形成对峙。

## 3. 各使用位置的处理方案

| 使用位置 | 当前风险 | 建议 |
| --- | --- | --- |
| 大厅学生证／主角色展示 | 学生证槽宽约证件的 38.1%、高 30.3%，内部裁切，标准全身会显得瘦小 | 学生证采用头像／胸像派生；独立大展示区可用全身。先做一名角色的桌面与竖屏样板 |
| 个人履历／他人详情的主立绘 | 当前图区桌面 164×152px、手机 108×96px，图只占 80%，主题还会强制重置时装缩放偏移 | 保留现有槽位时用标准胸像；若希望全身／膝上展示，需要另做竖向主立绘区域，不能只换源图 |
| 部员手册角色网格／选人卡 | 小格中完整全身的脸过小 | 使用胸像或头像，卡片只显示稳定默认表情；角色详情再展示完整立绘 |
| 部员手册详情／出战详情 | 当前图约 220×210px，标准全身仍会缩小；图区和详情滚动需要重新平衡 | 桌面改竖向全身／膝上展示加文字侧栏；手机用较大胸像与正文滚动。表情可随介绍展示，避免自动轮播八种表情分散阅读 |
| 剧情、新手引导、教学的剧情段 | 旧布局图片太小，长台词会挤压立绘，表情无字段 | 新增标准立绘舞台模式：桌面半身／膝上，手机上半身；作者逐节点指定表情 |
| 教学对弈 NPC 气泡 | 当前直接使用 `character.portrait`，绕过通用立绘解析 | 使用对应表情的头像／胸像派生图，不增加棋盘旁的全身占位 |
| 对局玩家信息卡／纸剧场出框位 | 卡片尺寸、主体锚点、手机两行信息布局均按 Q 版设计 | 单独试标准半身构图，脸与身份信息同时清楚，保证棋盘大小和点按区；样板不合适时先沿用 Q 版 |
| 队际赛三人斜切头像条 | 当前 `cover center` 会把标准图裁到躯干；三张宽发型可能互相遮挡 | 使用专用头像，按头肩锚点适配斜切框；候补也保持辨识，不用三张全身图叠放 |
| 开局双方对阵／自动猜先结果 | 开场图片当前方形 `contain`，全身缩小后缺少对峙感 | 使用双方胸像／半身构图；手机上下或紧凑斜切展示。现有实际组件是 `OpeningDuelPresentation`，无需另造猜先规则 |
| 技能横幅 | 当前图片与技能语音共用普通角色立绘，没有表情选择 | 在现有 `SkillBanner` 内展示技能对应半身表情，复用原时序；棋盘特效继续由现有效果系统负责 |
| 对局结果 | 已有胜负分类、语音、胜利跳跃与败北灰度雨云；标准图直接替换会失衡 | 放大半身表情，收益区独立；标准图的雨云按头部锚点定位，并检查灰度是否吞掉脸部层次 |
| 角色战绩、好友、回放和挑战榜等小图 | 细长列表容不下全身，图片比例变化会带动行高 | 保持列表尺寸，替换为默认表情头像；结果表情放在结算大展示，不必塞入每条历史记录 |
| 仓库道具目标、商店关联角色和时装 | 普通标准图可能使已装备时装失效，服装预览也不等于基础角色预览 | 小图用对应造型头像；服装详情保留真实服装立绘，没有该服装表情时显示服装默认图 |
| 登录／路线预加载角色展示 | 当前有角色跳跃和随机轮换，加载全部表情会增加等待 | 首期保留当前表现；需要统一画风时单独接标准图默认表情与构图，不把整套表情加入登录必载 |
| 爱弥斯招募、黑化西格莉卡决战等专属演出 | 固定素材与特殊语义绑定，未必经过普通 resolver | 分支单独审阅；本轮三套基础立绘不覆盖专属演出素材 |

## 4. 剧情接入：先做好单角色表情舞台

普通剧情、新手剧情与教学中的剧情段已经共用 `StoryPlayerModal`，因此可以复用同一套新展示模式。现有分支图、打字机、选项延时、教学节点与棋盘执行机制都可以继续使用。

推荐先新增单角色舞台模式。桌面以半身或膝上角色为视觉主体，对白与选项放在独立区域；竖屏以头部到腰部构图为主，底部对白可滚动，选项区域有界滚动。长文本不能继续把新立绘压到只剩一小块：旧 Q 版节点保留已有 `long-text-compress-portrait`，标准模式改为保住面部可见区并让文本滚动或由作者分段。

首期节点新增两个可选字段；以下是**拟议合同**：

```json
{
  "id": "aemeath-intro-03",
  "type": "story",
  "characterId": "aemeath",
  "appearanceId": "aemeath-standard-v1",
  "expressionId": "thinking",
  "text": "这里仍是现有对白。",
  "nextNodeId": "aemeath-intro-04"
}
```

`appearanceId` 选择固定的美术套组，`expressionId` 选择套组中的表情。构图先由播放器场景决定，不要求作者每句话输入缩放与偏移。未填新字段的旧节点保留原行为；作者指定标准套组时，剧情固定该造型，不再被玩家时装和糖果状态隐式替换。

表情按节点显式指定，留空使用该套组默认表情。不要依靠台词关键词自动判断，也不要让缺省节点隐式继承上一分支的情绪，否则同一节点会因进入路径不同显示不同表情。首期只支持节点开始时切换；一句话内变表情可先拆成连续节点。

同角色换表情保持身体锚点、缩放和裁切窗口，替换解码完成的图片；默认直接换图，必要时用很短的淡化，不使用人物离场再入场，也不让两张半透明脸长时间重叠。这个设计借鉴了视觉小说按角色标识替换图像、保留变换的做法；浏览器切图前完成 decode 可减少空白帧。参考：[Ren'Py 图像显示](https://www.renpy.org/doc/html/displaying_images.html)、[MDN Image.decode](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode)。这是本项目的拟议实现，不引入 Ren'Py 依赖。

后台只做桌面：在角色选择下新增套组与表情选项，表情随角色过滤，切角色清理不兼容值，旁边显示当前节点预览。图中节点卡可显示简短表情标签，未填的不增加额外标记。预览必须复用玩家播放器的资源解析和构图，避免后台看起来正确而手机实际裁错。

背景、左右双角色、说话者高亮和节点语音目前都没有完整节点合同。可以作为下一阶段的可选 `stage` 与音频字段，再设计分支跳转、逐节点预览与恢复规则；接入这三套表情不必先重写成完整视觉小说引擎。

## 5. 表情与对局事件的关系

以下是可讨论的起始映射，不是已确认的角色台词或演出要求：

| 事件 | 西格莉卡 | 达妮娅 | 爱弥斯 |
| --- | --- | --- | --- |
| 常态／开场 | `smile` 或保留 `original` | `smile` | `smile` |
| 一般技能施放 | `serious` | `serious` | `wink` 或 `serious` |
| 强力／派生技能演出 | `serious` | `serious` | `serious` |
| 胜利 | `closed_smile` | `closed_smile` 或 `playful` | `closed_smile` |
| 败北 | `worried` | `annoyed` 或 `serious` | `wry` |
| 平局 | `thinking` 或 `smile` | `smile` | `smile` |

三个角色的情绪范围不同，不能把达妮娅的 `annoyed` 当作西格莉卡的 `angry`，也不能因为爱弥斯没有悲伤表情而伪造 `sad` 文件。困倦、害羞、吐槽等优先由剧情作者选用。

技能演出有现成的 `banner.id`、角色、`effectType` 和施放语音入口。建议按已确认的施放事件选择表情，并由 `banner.id` 去重；点击技能按钮、预选目标或网络失败不应直接触发表情。首期只改变横幅中的表情，是否同时改变常驻玩家卡可以在样板后再定。

结算已有 `win/loss/draw/challenge/spectator` 分类，应复用结果判断，按被展示的玩家选择表情。观战者不能简单套用“我赢／我输”；吃子挑战也有“完成／未完成”的独立语义，不能拿无胜者当普通平局。黑化西格莉卡专属结算当前有特殊展示分支，应继续单独处理。

常驻玩家卡的临时表情若后续加入，应有明确的还原与优先级：剧情强制演出优先，随后结算／技能临时状态，结束恢复默认。断线恢复、组件重建和历史快进不重播旧技能。表情仅影响展示，不能延长权威落子、技能结算或棋钟。

## 6. 资源集合与兼容解析

先用仓库内的静态 manifest 管理三套素材，避免一开始改 `Character` 数据库模型。新增统一视觉解析器可包装现有 resolver，调用方传入角色、用途、套组、表情，以及当前外观或快照；返回资源 URL、构图信息和是否回退。

拟议资源结构：

```text
角色 canonical ID
  → 当前造型或剧情明确指定的套组
  → 套组版本与 expressionId
  → illustration / bust / avatar
  → URL + 画布/锚点/裁切配置
```

manifest 至少记录 canonical ID、来源 base_id、套组 ID 与版本、默认表情、支持表情、各用途文件／构图。建议运行目录类似 `assets/character-visuals/aemeath/standard-v1/`；节点引用资源 ID，不存本机路径或任意用户输入 URL。

必须先决定造型，再在造型内找表情。当前西格莉卡侵蚀状态、达妮娅彩虹光、已装备服装有既定优先级；新三套只覆盖默认外观。运行回退顺序为：当前造型指定表情 → 当前造型默认表情／旧图 → 既有安全占位。不能因该时装没有 `serious` 就突然换回默认衣服。

剧情固定套组是作者显式选择的另一路规则。旧剧情没有选择时继续原规则。已有 `denia-rainbow-glow` 伪角色 ID 先保留兼容；以后可以映射为达妮娅的特殊造型，不需要新增八个“表情角色”。彩虹达妮娅旧资源必须保留动画；黑化西格莉卡决战还存在角色为空、按特殊房间／机器人身份选图的路径，不能只改普通 catalog 就认为已覆盖。

如果未来需要后台上传完整套组，再新增可选资源集合引用，并同步 schema、公开 DTO、管理校验、保存、快照导出与 seed。首期后台的剧情表情选择器可以读取固定 manifest，不需要同时实现 PSD 上传、在线切层或完整资源管理平台。PSD、候选、QA 与浅色预览不进入运行资源包。

## 7. 保存、Excel、加载和发布的同步范围

| 链路 | 必须处理的地方 |
| --- | --- |
| 剧情 API | `server/storyScripts.js` 按白名单规范化节点，需要保留新字段并检查角色／套组／表情组合；只改前端会在保存后丢字段 |
| 新手旧数据兼容 | `server/onboardingStory.js` 仍有旧记录读取，需兼容保留新字段 |
| 后台草稿与预览 | 新建节点、复制、模板、校验、普通角色选择和教学 NPC 选择都要同步；同角色表情必须来自同一清单 |
| Excel 往返 | `storyScriptWorkbook.js` 从列白名单导出、再按列重建节点；新增可选套组／表情列，旧 v1 工作簿缺列使用默认值；原始 JSON 归档不会代替导入列 |
| 数据库 | 现有 `draftNodesJson/publishedNodesJson` 能保存新增节点字段，首期通常无需列迁移 |
| 教学气泡 | `TutorialBattleScreen` 构造 bubble、`NpcDialogue` 渲染与预加载一起接入；先按节点角色或当前 NPC 的既有回退解析有效角色，再选择该角色表情，不继承上一节点表情 |
| CSS | 舞台与头像分用途；同步基础样式和 Bright School 实际覆盖层，尤其手机 `!important` 网格规则 |
| 美术资源检查 | 新增 illustration 与派生图检查；继续保留旧 900×900 portrait 检查，不能为放行新图把旧检查整体放宽 |
| 运行目录发布 | 新 manifest 和实际 WebP／PNG 必须一起发布，检查每个引用存在；工作包目录留在素材归档中 |

加载建议分层：登录继续加载当前需要的小图和默认图；打开剧情时当前节点优先，预热直接下一节点和近处分支首节点，选定分支后再预热所选路径；进入对局时准备参赛角色开场、技能和结果所需资源。短脚本可以收集实际引用去重后一次预载，但不把三套全部原尺寸表情加入登录 critical。

图片加载与 decode 完成后再切换。当前节点资源失败时显示同造型默认图，让对白和教学继续；套组显式填写但组合无效时，后台发布应提示错误，而运行时仍需回退，兼容旧数据与发布遗漏。慢网络下的表情准备不能拖延对局结算。

生产当前 `/assets/**` 使用 `no-cache`，浏览器会重验证；新套组仍建议使用版本目录并保留历史文件。这样更新美术不会让旧节点或历史回放的同一 URL 换成另一张图。

正式配置了剧情表情后，应导出并提交默认快照，使新云数据库继承脚本配置。静态 manifest 本身随代码发布；若以后加 DB 集合引用，还需同步默认角色字段和补齐迁移。已有后台发布脚本不能未经明确策略直接覆盖，当前普通 seed 对已有记录有保留规则。

历史回放目前保存角色和时装快照，但没有标准套组与表情 cue。首期旧回放保持旧图；如果要求新回放精确复现新画面，新房间需要保存套组版本、造型引用与必要的演出 cue，服装和队际成员快照也要覆盖。回放列表可以使用当前默认头像，但列表预览与回放内容复现应作为两个不同的展示决定。快进、断线恢复不应把历史技能当作新事件播放。

## 8. 推荐实施顺序与验收

1. **资源与视觉样板**：三角色映射、静态 manifest、统一 resolver、派生图与资源检查。先验证西格莉卡的剧情舞台、手机玩家卡、队际头像与结算半身，再对另两角色确认裁切。保存每个角色统一锚点和表情窗口。
2. **剧情与教学**：新增可选字段，打通 API、草稿、后台预览、Excel、默认快照、剧情播放器和教学气泡。用短示例验证默认→思考→惊讶→闭眼笑及分支回跳，旧脚本继续可用。
3. **技能与结算**：对接现有权威事件和结果分类，验证语音同步、事件去重、同造型回退，以及观战／挑战／特殊剧情分支。检查标准立绘与旧跳跃、雨云的组合。
4. **常驻界面逐项替换**：大厅、履历、手册、选人、队际与列表按已通过样板的用途接入；其他角色和无表情服装继续旧图。背景、双角色舞台、语音字段另行设计。

实施时需要验证：

- 三角色与全部 key 解析正确，`amis` 不进入游戏角色 ID；缺表情、缺用途图、未知套组有可预测回退。
- 同角色切表情不跳位，透明边缘在浅色校园与深色场景均正常；默认、服装、糖果和侵蚀不互相串图。
- 手机竖屏至少查看 360／390／430px 宽和较矮视口：脸部可读，长对白及多个选项可操作，棋盘大小、时钟与技能按钮不受遮挡。
- 保存发布再读取、节点复制、Excel 导出再导入不丢字段，旧工作簿和旧脚本继续可用。
- 慢加载、decode 失败、连续快速切节点和分支跳转不出现上一角色残影，不阻塞教学或对局。
- 开局、技能、结算只消费正确事件；断线恢复、回放快进与观战显示正确。
- 新安装能获得默认资源与脚本，已有安装保留后台自定义；历史 URL 保持可用。
- 根据实际变更运行相应单测、`check:portraits`、快照检查、桌面／竖屏浏览器回归和项目质量门禁，并同步系统设计 HTML。

## 9. 已确认的接入范围

用户已选择“按场景逐步替换”：标准立绘进入大展示和剧情，小头像用派生图，对局出框位先试半身。其余角色和无对应标准图的服装保持兼容展示。独立样板已交付，裁切仍待用户审阅；正式运行代码尚未开始接入。

下一步先根据样板确认各场景的裁切与表情辨识度，再制作轻量派生图和用途配置，随后逐项接入正式组件。

## 源码与核验依据

以下均为本次读取的当前工作区，不是历史记忆结论：

- 角色与资源：`src/shared/characterFallback.js:7,25,42`、`characterAliases.js:1`、`characterPortraitAssetCatalog.js:2,10,72,78`、`characterPortraits.js:9-35`、`costumes.js:21`。
- 旧资源合同：`scripts/characterPortraitNormalization.mjs:4-7,248-290`、`scripts/normalize-character-portraits.mjs:24`。
- 剧情：`src/modals/StoryPlayerModal.jsx:58-97,338-370`、`OnboardingStoryModal.jsx:18`、`src/tutorial/TutorialSessionModal.jsx:153`、`TutorialBattleScreen.jsx:285,815`、`NpcDialogue.jsx:9`。
- 保存与编辑：`server/storyScripts.js:686-724`、`server/onboardingStory.js:225`、`src/admin/AdminOnboardingStory.jsx:1444,1548,2020,2231,2259`、`storyScriptWorkbook.js:33-90,260,355-376`。
- 对局演出：`src/modals/SkillBanner.jsx:7-35`、`src/modals/gameLifecycle/ResultModal.jsx:45,85`、`src/modals/OpeningDuelPresentation.jsx:19,84`。
- 常驻展示与列表：`src/home/components/PlayerPlaque.jsx:14`、`src/styles/mobile-adaptive/home-student-id-art.css:24`、`src/modals/ProfileResumeView.jsx:53,158`、`src/styles/modals/profile-hero-cleanup.css:56,76`、`src/styles/mobile-adaptive/mobile-profile-records/profile-shell-hero.css:118`、`src/modals/house/HouseCharacterGrid.jsx:164`、`HouseNestedDialogs.jsx:43,61`、`src/styles/modals/character-opening/detail.css:4,37`。
- 选人、社交与仓库：`src/home/TeamLineupPicker.jsx:41`、`src/modals/friends/FriendsList.jsx:37`、`leaderboard/LeaderboardRow.jsx:20`、`watch/WatchRoomRow.jsx:30`、`warehouse/WarehouseTargetModal.jsx:50,71`、`house/CharacterCostumeDialog.jsx:67,105`、`shop/CostumeCard.jsx:11`、`shop/CostumeDetailDialog.jsx:48`。
- 招募与加载展示：`src/modals/RecruitmentModal.jsx:266`、`src/shared/recruitment.js:59`、`src/app/AssetPreloadScreen.jsx:152,241`、`src/app/authPortraitPrewarm.js:26`。
- 手机和主题：`src/styles/modals/onboarding-story/portrait-text.css:31,104`、`mobile.css:15`、`src/styles/room/tutorial-battle-screen/overlay-choice.css:83,171`、`src/styles/mobile-adaptive/battle-paper-player-mobile.css:20`、`src/styles/room/team-portraits.css:29`、`src/styles/themes/bright-school/mobile/modal-shell/shell-surfaces.css:81`。
- 预加载与发布：`src/shared/preloadAssets.js:76,156,278`、`server/staticAssets.js:6`、`server/adminDefaultSeed.js:247,422,566`、`scripts/export-admin-default-snapshot.mjs:141,309`。
- 回放：`server/roomFactory.js:208,273`、`server/roomView.js:48`、`server/roomResultPersistence.js:168`、`server/replayPagination.js:89`、`src/modals/ReplayList.jsx:97`。
- 素材根目录：`C:/Users/Moming/.codex/visualizations/2026/10/02/01a0fb2f-41c4-7373-aade-6f8b09c8f56d`。各包 DELIVERY、manifest、rig、表情预览和 visual-review 记录已读取。
- 独立素材核验摘要：[asset-audit.json](../.trellis/tasks/10-02-standard-character-sprites-plan/research/asset-audit.json)。任务：[prd.md](../.trellis/tasks/10-02-standard-character-sprites-plan/prd.md)。
