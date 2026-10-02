# 爱弥斯文本证据与单版视觉语言

## Source access record

- Primary official entry: Kuro Wiki, `https://wiki.kurobbs.com/mc/item/1457744312692867072`.
- 2026-08-11 复核时官方条目仍在线，但公开抓取只返回动态页面壳；本任务复用 2026-07-17 已通过浏览器展开官方故事与语音条目后保存的完整文本研究：`.trellis/tasks/07-17-aemeath-achievement-nameplate-concepts/research/aemeath-dossier.md`。
- Repository cross-checks: `server/achievements.js`, `docs/system-design.md`, `public/assets/Aemeath_centered.webp`, and the current production nameplate.
- Portrait and current raster are used only for visible palette/silhouette corroboration and repeat avoidance, not for biography or personality inference.

## Mandatory text evidence matrix

| Category | Status | Paraphrased evidence | Source locator | Design relevance |
|---|---|---|---|---|
| Personality and contradictions | found | 她外表活泼、爱开玩笑、乐于社交，轻松语气下却藏着成为守护者的严肃愿望和承担重任的决心。 | Kuro Wiki `基础资料`; stories `年轻人们`; voices `心声2`, `心声5` | 画面应明快亲和，但需要稳定的向前方向，不能只做甜美装饰。 |
| Biography and formative events | found | 她在温暖的雪原家庭中成长，与家人游戏，后来进入星炬学院；共鸣阻止灾难时身体被毁，以电子幽灵状态继续存在。 | Kuro Wiki stories `在雪原上`, `唯不可见者可见`; `共鸣能力鉴定报告` | 冰雪柔光、纸质记忆、像素残影和半透明数据层都有文字依据。 |
| Goals, values, fears, and conflicts | found | 她希望成为守护世界的人、分担重要之人的责任，并把家人自由幸福地生活视作最核心的愿望。 | Kuro Wiki voices `心声3`–`心声5`, `抱负和理想` | 航迹应体现陪伴与保护，不使用炫耀排名的奖章结构。 |
| Relationships and social behavior | found | 她与学院朋友亲近，喜欢帮助不同社团；纸飞机最初由家人折给她，后来又从学院屋顶放飞。 | Kuro Wiki story `年轻人们`; `珍贵之物 > 纸飞机`; voice `闲趣1` | 纸飞机是最强的左侧识别物，既连接家庭也连接学院生活。 |
| Representative dialogue and speaking style | found | 她常用俏皮反问、拖长语气和技术玩笑；严肃时会直接表达守护和一起走向明天的承诺。 | Kuro Wiki voices `心声1`, `心声2`, `凝音1`, `自我介绍`, `心声5` | 形状可以活泼跳跃，但收尾必须清楚、坚定，不做冷酷军事 HUD。 |
| Major plot beats and character development | found | 她从用轻松承诺遮掩守护愿望，经历死亡、愤怒与真相冲击，最后主动承担只有自己能完成的任务，并选择朝希望前进。 | Kuro Wiki stories `年轻人们`, `唯不可见者可见`, `问我何所惧，问我何所忧`, `一切未曾说出的` | 纸飞机从被保护的记忆转为向前启航，支持“左侧起飞—右侧完成航迹”的叙事。 |
| Powers, abilities, and recurring actions | found | 她能进入数据系统，以电子幽灵形态活动，并与自研的隧穿者武装融合；技能命名反复出现长航、星辉、抵达、共鸣与飞行。 | Kuro Wiki `共鸣能力鉴定报告`, `技能说明`; voice `凝音1` | 使用轻量数据残影、纸折装甲切面、星点和航行轨迹，不用厚重机械壳。 |
| Meaningful objects, places, hobbies, and foods | found | 纸飞机、游戏卡带、隧穿者模型是珍贵物品；她喜欢游戏、社团、像素雪绒印章、音乐和流行食物，并以“飞行雪绒”参与校园虚拟演出。 | Kuro Wiki `珍贵之物`; stories `在雪原上`; voices `心声1`, `爱弥斯的喜好`, `喜欢的食物` | 只选纸飞机为主锚，电子雪绒/节奏脉冲为辅助，避免把所有爱好堆成贴纸。 |
| Achievement/reward meaning | found | 正式奖励代表玩家使用爱弥斯在星炬对弈中取得 100 胜。 | `server/achievements.js`; `docs/system-design.md` | 以持续航行和完成航迹表达积累，不画数字、奖杯、皇冠或桂冠。 |

## Evidence-to-design synthesis

| Textual evidence | Interpretation | Visual decision | Confidence/source |
|---|---|---|---|
| 家人折给她、又从学院屋顶放飞的纸飞机 | 同时承载家庭温度、学院生活与向前航行 | 左侧用一架清晰的大折纸飞机作为唯一主锚，折线在 32px 高度仍可见 | high — official `珍贵之物 > 纸飞机`, `闲趣1` |
| 电子幽灵能进入数据系统 | 她的存在轻盈、间断、数字化但不恐怖 | 飞机周围使用不封闭的青色数据残影、断续像素和半透明电子雪绒轮廓 | high — official report, `自我介绍` |
| “飞行雪绒”校园虚拟演出与像素印章 | 活泼、社交和节奏感是角色身份的一部分 | 中段边缘加入少量粉色节奏脉冲；右侧以稀疏像素雪绒收尾，不画圆脸徽章 | high — official `心声1`, hobbies |
| 自研武装、长航与星辉技能语言 | 机械是她能力的延伸，但主题核心仍是飞行和希望 | 载体只用薄纸折装甲切面和细数据航线，拒绝厚重机械框 | high — official report and skill names |
| 守护家人与共同走向明天 | 明亮外表需要一个稳定、温暖的内核 | 以冰白/天青为主、暖粉穿插、极少星金点亮航迹终点 | high — official `心声3`–`心声5` |
| 100 胜是持续使用角色完成的积累 | 奖励强调同行和反复出击，不是段位等级 | 用多段短残影汇聚成一条完整航迹，不出现数字或奖章 | high — repository achievement contract |

# Aemeath three-direction visual language

## Emotional target

- Three adjectives: 轻盈、明快、坚定。
- Energy level: 中高能量，中央保持安静。
- Intended feeling: 一封来自雪原与家人的纸信化作电子航迹，仍陪玩家继续向前。

## Narrative anchors

- Primary anchor: 左侧大折纸飞机，外包不闭合的电子雪绒/数据残影。
- Supporting motif family: 冰青数据丝带、暖粉节奏短线、少量纸折装甲切面和像素雪粒。
- Tail/closure language: 右侧短航迹逐渐解构成稀疏方形残影，在一颗暖金星点处结束。

## Palette and material

- Base/carrier: 浅天青到冰蓝，中心略深一档以承载用户名。
- Primary light: 冰白与高亮青。
- Secondary accent: 暖粉/珊瑚粉以窄带穿插，不铺满载体。
- Tiny accent: 仅一至两处暖星金。
- Material: 手绘折纸、柔和半透明数据层、少量干刷像素边；不做玻璃泡泡、硬质电竞框或厚重装甲。

## Motion verbs (future integration only)

- Persistent light: 顺着纸飞机折线和载体外缘的稳定青白微光。
- Local narrative motion: 数据残影沿航迹平移少许，像纸飞机刚刚穿过。
- Secondary accent: 右侧一颗星点和少量粉色像素轻闪。

## Exclusions

- Roman numerals, rank badge, detached title/badge slot, portrait, name, username, logo, `100`.
- Go stones, boards, grids, move traces, trophy, crown, laurel.
- Current production composition: stage fan, round-face snowfluff badge, two equal paper-plane endpoints, full-width sharp speed panel.
- Danya pearlescent bubble; Sigrika gold rune/star core; generic esports neon, magic circle, black hole, full-width glossy sweep.

## Geometry

- Delivery canvas: `1125 x 240` (`4.6875:1`).
- Runtime slot: `150 x 32`.
- Quiet username safe area: approximately `x=315..975`.
- Runtime owner padding reference: left `42px`, right `20px`.
- Minimum planned alpha margins: left/right `40px`, top/bottom `8px`.

## Single concept: Paper Signal Departure / 纸信启航

- Left: 一架朝右上方启航的大折纸飞机，从不闭合的青白电子雪绒残影中穿出；轮廓不是圆徽章。
- Center: 一条柔和收窄的天青数据丝带，中心低细节，边缘只有少量粉色节奏短线和纸折切面。
- Right: 航迹快速变细并解构成稀疏方形残影，在一颗小暖金星点后结束，不再增加第二端头。
- Difference from production: 不使用舞台纸扇、像素圆脸、双飞机或整条锐角装甲横幅。

## Added concept B: Snowfluff Reply / 雪绒回信

- Palette: 粉色和天蓝色近乎同权，粉色面积明显增大；冰白只用于折纸高光。
- Left: 不规则、开放式的像素雪绒翼片向外展开，中间穿出一架较小的粉白纸飞机；不是圆脸、徽章或同心环。
- Center: 天蓝与暖粉两层柔软波形丝带上下交叠，中央保留稳定的偏深青蓝用户名带。
- Right: 波形逐渐回卷成一个短折纸信角，再散出少量蓝粉像素，不放星形第二端头。
- Structural difference: 比 A 更柔软、更有虚拟演出的节奏感；主飞机缩小，雪绒翼片与双色波形成为主要轮廓。

## Added concept C: Dual-Frequency Voyage / 双频长航

- Palette: 高饱和天蓝与玫粉双主色，少量深青勾边，整体比 A 更鲜明。
- Left: 两层错位的半透明纸飞机残影交叉成轻薄 V 形启航标，不使用圆形底座。
- Center: 一蓝一粉两条细长数据航线在用户名带上下交错穿行，中部本体更窄、更轻。
- Right: 两条航线汇合为一个向前的折纸箭尖，随后只留下三到五个方形残影。
- Structural difference: 比 A/B 更速度化、更修长；以“双线程/长航”的交错航线叙事，不使用宽面纸片载体或柔软回卷。
