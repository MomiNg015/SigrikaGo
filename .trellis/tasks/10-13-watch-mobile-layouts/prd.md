# Mobile watch layout variants

Prototype-only review of the current mobile watch ledger. Deliver three working variants preserving the title artwork, shell and palette. Improve information grouping and readable names rather than simply shrinking row height. Show mode, room code, black/white players, moves, room occupants, status and a clear action. No left tabs. Names wrap in full; units and small labels remain at least 12px. Compare at 320/360/390/430px, short phones, long names and high counts. Keep actual account/room APIs isolated. Do not promote a variant before user selection.

## Results
Three isolated variants delivered. All 48 browser cases, comparison controls and scoped ESLint passed. Names are 14px and wrap fully, labels >=12px, action targets >=44px. At 390px ordinary first-row heights are 109/107/96px. Original and new screenshots inspected. Production unchanged, awaiting user choice. No production contract/spec change is introduced.

## Whole-row activation revision
Removed all standalone watch buttons and freed their layout tracks. A native transparent button covers each whole row; Enter/Space and pointer activation close the sample list without live room access. All 48 browser cases and scoped lint pass. At 390px ordinary heights are now 103/84/79px.

## Scoreboard visual revision
User rejected the dry text layout. All three previews now use real header move-placard styling, Users icon/count, portraits and side-stone marks. Variants are right-hand ledger placard, central duel placard, and perforated score ticket. Counts remain neutral without turn data. Three/four digits fit their placards; ordinary identity padding is removed without touching equipped nameplate padding. Whole-row activation and the original shell remain. Production unchanged.

## 房间信息与状态配色修订

三版人数图标与数字移到房间号旁，手数牌保持独立。对局中绿色、已结束中性灰色，同时更新正式观战列表桌面及手机状态样式；不提前接入尚未选定的手机布局。

## 方案 1 正式接入

用户选定计分牌名册。手机采用类型／房间与人数／状态、左侧上下玩家与右侧手数牌；桌面保留名册列。两端整行点击进入观战并关闭窗口，移除独立观战按钮。交付正式组件的桌面与手机截图，验证键盘、长昵称、大数值及空／多对局。

桌面跟进：人数列移动到类型列之后，手数共用手机版纸质计分牌。手机布局保持一致。
