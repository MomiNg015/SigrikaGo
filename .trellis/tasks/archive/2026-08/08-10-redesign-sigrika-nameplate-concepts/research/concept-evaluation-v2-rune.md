# 西格莉卡第二轮符文三版候选检查

## Correction audit

- 三版均未使用棋盘、棋子、棋格、交叉点、落子轨迹或其它围棋图形。
- 三版均未使用装甲片、机械夹具、底盘、喷口、螺栓、段位章或金属电竞外框。
- 三版都由符文、星辉、魔法墨迹或极光织带直接形成连续铭牌载体，不再预留徽章、称号、等级或统计区域。
- 源候选均不含用户名、角色名、字母、数字或 UI 标签；`Moming` 只存在于派生检查图中。

## Mechanical delivery

| Direction | Candidate | Runtime | Username preview | Result |
|---|---|---|---|---|
| A 辉星符印 | `concepts/v2-rune/candidates/a-open-starlight-sigil-1125x240.png` | `concepts/v2-rune/runtime/a-open-starlight-sigil-150x32.png` | `concepts/v2-rune/previews/a-open-starlight-sigil-username-1125x240.png` | pass |
| B 暖明符文织带 | `concepts/v2-rune/candidates/b-warm-light-rune-weave-1125x240.png` | `concepts/v2-rune/runtime/b-warm-light-rune-weave-150x32.png` | `concepts/v2-rune/previews/b-warm-light-rune-weave-username-1125x240.png` | pass |
| C 星辉术式 | `concepts/v2-rune/candidates/c-unfolding-starlight-rite-1125x240.png` | `concepts/v2-rune/runtime/c-unfolding-starlight-rite-150x32.png` | `concepts/v2-rune/previews/c-unfolding-starlight-rite-username-1125x240.png` | pass |

三张候选画布均为 `1125 x 240`；三张无文字运行时缩略图与三张用户名运行时检查图均为 `150 x 32`。

## Runtime-size review

### A 辉星符印

- 左侧开放四芒星符印在 `150 x 32` 下保持最直接的单体轮廓，不读作圆形等级章。
- 金色咒纹以手绘曲线自然勾勒紫色魔法墨迹，边缘没有机械壳体或硬质连接件。
- 中央暗紫区域对比稳定，右侧卷曲符文与薄荷色星点形成短收束。
- 用户选中 A 后修正了派生预览的用户名位置：按现有精确资产 owner 的运行时几何，`150 x 32` 内扣除左侧 `39px`、右侧 `18px`，用户名在 `x=39..132` 的内容区居中；换算到 `1125 x 240` 概念稿，文字中心为 `x=641.25`。源候选仍不含文字。

### B 暖明符文织带

- 左侧由多条橙金发光符文带交织成结，角色识别物与用户名载体属于同一条连续结构。
- 三版中边界最柔软、流动感最强；缩小后仍能读出“暖光符文结 + 紫色光幕”。
- 中央低细节区域完整，右侧仅用散开的星屑与符文碎片结束，不形成额外徽章槽。

### C 星辉术式

- 左侧破环法阵、中心四芒星符核与外围小型符印构成完整术式，但保持手绘光墨质感，不读作机械圆环。
- 紫色极光载体最克制，右侧由残缺金色术式弧线和薄荷色光点闭合。
- 在 `150 x 32` 下，法阵核心、中央用户名区和右侧弧线仍能形成清晰三段节奏。

## Human selection gate

- 用户已选择 A「辉星符印」并授权应用到游戏，人工选择门已通过。
- 正式透明资产、精确 ID CSS 与符文动效的接入记录见 `research/production-integration.md`；奖励数据和通用身份组件保持不变。
