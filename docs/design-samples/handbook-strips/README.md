# 部员手册斜切拼接

本目录保存当前正式 `HouseModal`／`HouseCharacterGrid` 的渲染截图，替代此前群像拼图的审阅结果。预览夹具仍为 `tests/e2e/fixtures/handbook-puzzle.html`，它直接使用生产组件与完整样式，不修改账号。

角色沿用目录显示顺序，包括后台排序。桌面从左到右，各人物的头部大小和眼线按原图逐一校准；悬停或键盘聚焦扩宽当前条带，人物尺寸与纵向裁切保持固定，只横向挪动，右下显示无底色大号姓名。默认桌面状态不显示姓名。

手机从上到下，立绘左、右交替，对侧显示无底色大号中文姓名；展开后仍保留站位，姓名靠近头像水平，减少与长发、身体的重叠。点按扩高显示胸像，再通过“查看详情”进入原详情。姓名中文采用现有霞鹜漫黑（LXGW Marker Gothic，手册标题同款），英数字保留项目霞鹭字体：后者实际没有中文字形。小纸缝与淡主题色背景保持，手机长列表由纸窗内滚动区承载。

| 状态 | 截图 |
| --- | --- |
| 桌面默认 | [desktop.png](./desktop.png) |
| 桌面展开 | [desktop-expanded.png](./desktop-expanded.png) |
| 手机默认 | [mobile.png](./mobile.png) |
| 手机展开 | [mobile-expanded.png](./mobile-expanded.png) |
| 360px 手机最后一位展开 | [mobile-last-expanded.png](./mobile-last-expanded.png) |
| 糖果造型展开 | [mobile-candy-expanded.png](./mobile-candy-expanded.png) |
| 未拥有角色展开 | [mobile-locked-expanded.png](./mobile-locked-expanded.png) |

原图保持比例，普通未拥有角色为灰色剪影与问号；未拥有的猪小仙没有图片、剪影或问号，使用灰阶断开数据框与“暂无情报”，保留匿名详情。服装、糖果、道具效果、目录分页和独立黑化手册沿用既有规则，出战选人仍按用户要求暂缓。旧拼图截图位于 `../handbook-puzzle/`，属于历史版本。

本轮浏览器回归12项通过，覆盖1440×1024、1440×768、390×844、360×640、桌面固定人物尺寸与校准标记、手机交错姓名、匿名无素材状态、详情与旋转后的焦点恢复。
