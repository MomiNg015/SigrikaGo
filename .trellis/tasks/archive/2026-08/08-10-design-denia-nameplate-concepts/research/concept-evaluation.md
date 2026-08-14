# 达妮娅用户名背景三版检查

## Shared checks

- 三张候选均由内置 ImageGen 独立生成；A 与 C 各做一次只针对错误左侧核心的精确编辑。
- 三张无文字候选均为 `1125 x 240`、RGBA、透明四角，并通过项目专用铭牌验证器。
- 三张均生成 `150 x 32` 无文字缩略图与代表用户名 `Moming` 预览。
- 用户名按现有达妮娅精确 owner 的真实内容区定位：运行时左 `40px`、右 `25px`，源画布等比换算为 `x=300..938`，文字中心 `x=619`。
- 候选均无烘焙文字、数字、罗马数字、徽章槽、称号槽、段位槽、围棋、机甲、玩偶、缝补、星辉符印或金色符文主语言。
- 正式达妮娅资源、CSS、奖励数据与通用 `UserIdentity` 均未修改。

| Direction | Candidate | Runtime username preview | Alpha bounds | Result |
|---|---|---|---|---|
| A 造梦泡鸣 | `concepts/candidates/a-dreammaker-bubble-wand-1125x240.png` | `concepts/runtime/a-dreammaker-bubble-wand-username-150x32.png` | `136,12..989,227` | pass |
| B 双态软幕 | `concepts/candidates/b-dual-form-soft-curtain-1125x240.png` | `concepts/runtime/b-dual-form-soft-curtain-username-150x32.png` | `172,12..953,227` | pass |
| C 虚质入梦 | `concepts/candidates/c-virtual-matter-dream-1125x240.png` | `concepts/runtime/c-virtual-matter-dream-username-150x32.png` | `108,12..1015,227` | pass |

## A — 造梦泡鸣

- 左侧：开放式泡泡棒圆口、短柄和一枚回音泡，能在 `32px` 高度辨认成物件而非罗马数字块。
- 中部：不规则粉色泡膜载体，深梅紫只压住下缘，动态用户名位置安静。
- 右侧：两枚泡泡加一个轻量相册纸角，校园记忆不与主物件争抢。
- 与现有正式版差异：单侧器具领衔，无同心泡泡门，也无双端同权大型装饰。

## B — 双态软幕

- 左侧：明粉与深梅紫两层保护泡核包住暖光心，表达布景/幻灭双态与真实心的冲突。
- 中部：上下错位的柔软帷幕而非矩形胶囊；深色层提供文字对比。
- 右侧：一处膜卷与三颗逐渐缩小的回声点，形成最长的轻盈收束。
- 与现有正式版差异：不使用相册堆叠，形态由上下软幕关系主导。

## C — 虚质入梦

- 左侧：可见三面的圆角深梅紫虚质方块被粉色泡膜完整包覆，柔软与几何形成最强对比。
- 中部：液态莓粉载体，深色只存在于被包覆核心和狭窄内影。
- 右侧：闭合回声结与两枚冰蓝折射点，轮廓最紧凑。
- 与现有正式版差异：没有泡泡门或相册页，虚质方块是唯一左侧角色锚点。

## Human gate

三版仅为任务内候选。用户明确选择 A/B/C 或提出修改前，不进行生产覆盖、CSS 动效或游戏内接入。

