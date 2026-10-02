# 美化邮件界面

## Goal

在保留 SigrikaGo 现有邮箱标题栏、邮件读取/领取/删除行为和共享信息中心响应式骨架的前提下，参考用户提供的两张游戏邮箱截图，重做玩家邮箱的列表与正文视觉层级：减少重复边框、状态色块和卡片感，改成更克制、通透、内容优先的精致布局，并让道具附件成为可查看详情的独立视觉对象。

## What I already know

- 当前工作分支为 `codex/mail-ui-polish`。
- 用户明确要求保留现有邮箱 header，不增加参考图左栏顶部的“全部邮件”筛选/计数行。
- 左侧列表中，完成处理的邮件需要整体变暗；其余邮件保持正常亮度。
- 右侧正文参考图采用“标题 → 发件人/时间 → 正文 → 底部分隔线 → 左侧附件图标 / 右侧主操作”的内容层级。
- 删除功能保持现有行为；领取按钮移动到参考图右下角删除按钮所在的主操作位置。
- 道具附件图标不再与领取按钮挤在同一行；点击道具图标可打开道具详情窗口。
- 同一道具数量大于 1 时，数量显示为图标右上角角标。
- 用户希望通过减少多余边框和多余颜色提升高级感，而不是照搬参考图的深色主题或新增复杂装饰。
- 当前 `MailboxModal` 已使用桌面双栏、移动端列表/详情切换的 `InformationCenterLayout`；桌面会自动打开第一封邮件，移动端保持列表优先。
- 当前邮件只支持一个附件记录，附件数量由 `attachment.quantity` 表示，因此“复数个道具”可以稳定映射为单个道具图标上的数量角标，不需要多附件数据模型。
- 当前列表通过 `state-new`、`state-claimable`、`state-done` 加彩色左边线、状态胶囊和卡片边框；正文则是带双层边界感的纸张卡片。这正是本次需要收敛的视觉噪声来源。
- 当前删除是正文标题区右上角 44px 图标按钮；未领取附件时不可删除，领取后可删除。
- 当前附件 API 已提供道具 id、玩家可见名称、图片和数量，但没有返回道具描述；若详情窗口需要展示完整描述，实施时应复用邮件列表查询已加载的道具目录并补充安全的玩家字段，而不是让前端猜测后台配置。
- 现有 `ShopItemDetailDialog` 已提供商店式图片、名称、说明和持有状态结构；用户选择让邮箱附件详情复用/适配这一详情语境，但不带入购买或使用动作。
- 项目约束要求玩家前端同步考虑桌面和竖屏移动端、44px 触控目标、键盘/焦点语义、无横向溢出和 reduced-motion。

## Design Direction

- 方向：Bright School 体系内的“克制编辑式信箱”，以留白、排版、细分隔线和明暗层级代替彩色卡片堆叠。
- 参考图只作为信息架构与密度参考；保留项目既有字体、主题令牌、关闭/返回控制和浅色纸张气质。
- 列表不增加额外可见状态标记；未处理与完成态通过字重和整体明暗共同表达，并在可访问名称中提供明确的文本状态。
- 动效只服务于选择、按压、领取完成和详情弹层进入/退出；优先 `transform`/`opacity`，约 150–300ms，并提供 reduced-motion。

## Decisions

- 邮件列表的暗化条件采用“已处理完毕”语义：无附件邮件在已读后暗化；有附件邮件只有在已读且附件已领取后才暗化。仍有待领取附件的已读邮件必须保持正常亮度。
- 视觉改版同时覆盖桌面与竖屏移动端：桌面继续使用双栏主从阅读，移动端继续使用列表先行、点击进入正文、返回列表的单栏切换；两端共享同一套克制的列表、正文和附件视觉语言。
- 附件领取完成后，右下角继续保留原生禁用按钮并显示“已领取”；该按钮保持可识别的禁用语义，但视觉上使用灰色低强调样式，不再表现为可点击主操作。
- 左侧邮件列表采用纯文字极简布局，不增加附件缩略图、信封/礼物类型图标、未读圆点或可见状态胶囊。未处理与已完成的区别只由标题字重、文字对比和整行明暗层级承担；状态仍通过列表按钮的可访问名称提供给屏幕阅读器。
- 点击道具附件后打开商店式道具详情：只展示类别、图片、名称和道具说明；不显示玩家当前持有、本封附件数量、待领取/已领取状态，不提供购买或使用按钮，也不泄露内部道具 id。
- 右侧阅读区使用公告同款强度的线框，正文 article 本身保持透明；去掉纸纹、正文自身的外框、厚阴影和嵌套卡片感，标题、正文、附件与操作区都落在同一连续表面上。
- 道具附件领取后，在图标上覆盖参考图式的大型勾选；勾选层不拦截指针或键盘交互，已领取的道具图标仍可打开详情。数量角标固定在右上角并保持在勾选之上可读。
- 金币附件也使用正文底部的独立附件图标块，显示金币图形和数量，领取后覆盖同样的大型勾选；金币图标为非交互展示，不打开道具详情窗口。
- 左侧列表时间采用混合格式：不足 1 分钟显示“刚刚”，不足 1 小时显示整数分钟，未满 24 小时显示整数小时，未满 7 天显示整数天，7 天及以上显示本地日期 `YYYY/MM/DD`；右侧正文继续显示完整本地日期和时分。
- 当前选中的邮件使用一圈克制的中性色细边框明确定位，可辅以极弱表面明度变化；未完成行只使用纤细暖粉内侧线，不使用强主题填充，非选中行无卡片外框。键盘 `focus-visible` 使用与选中态可区分的独立焦点轮廓。
- MVP 只实现当前单附件模型和邮箱范围内的商店式详情适配，不提前搭建多附件列表/网格，也不重构商店或仓库详情；同时必须覆盖缺图、缺说明、长标题/正文、请求失败、窄屏溢出和嵌套弹层焦点恢复。

## Requirements (evolving)

### 视觉验收反馈（第一轮）

- 道具右上角数量角标必须使用深底浅字，并以 Bright School 高优先级规则锁定文字对比，不能再出现角标和数字同时发黑。
- 道具详情移除“当前持有 / 邮件附件 / 领取状态”三行，只保留道具类别、图片、名称和说明。
- 邮箱 header 与 main 之间增加与其他窗口一致的虚线分割；桌面列表和正文之间增加一条实线分割，移动单栏不显示纵向分割。
- 桌面切换邮件时，标题区、正文和附件区按从上到下顺序从右侧短距离滑入；移动端不叠加这组动效，reduced-motion 直接显示最终状态。
- 所有未读或仍有待领取附件的列表行保持正常纸面，仅用纤细暖粉内侧线提示；不再使用整行浅绿色背景。已完成行继续使用低强调明暗层级，选中态继续由独立中性边框表达。

### 视觉验收反馈（第二轮）

- 桌面正文分段入场放慢到肉眼可清楚追踪，并从标题、正文一直延续到附件/底部操作按钮。
- 已领取附件在图像上增加半透明暗灰遮罩，勾选标记固定为白色，数量角标继续位于最上层。
- 列表和正文阅读区各恢复一圈克制的细外框，但正文 article 不再嵌套第二层边框或厚阴影。
- 撤销未处理邮件的浅绿色整行填充，改用暖粉细侧线与已完成行的降亮形成区别，不新增状态图标、文字或附件提示。
- 列表和正文外框改为公告窗口同强度的 2px 实线框；正文 article 改为透明背景，不保留纸纹或额外填充。

### 视觉验收反馈（第三轮）

- 邮箱 header 的 44px 操作按钮与下方虚线保留明确净空，按钮本体和硬阴影都不能压住虚线。
- 公告窗口尽可能复用邮箱的 header 虚线净空、14px 双栏间距、2px 外框、透明正文、行分隔和低卡片感选中态；分类 tabs、置顶/未读标签、未读点与公告类型等领域语义保持不变。

- 保留现有邮箱 header 和关闭/移动端返回能力。
- 不实现“全部邮件”筛选行、容量计数或参考图顶部的额外功能图标。
- 桌面继续使用左侧邮件列表、右侧正文的双栏结构；移动端继续使用列表先行、点击进入详情的既有结构。
- 桌面和移动端同步减少多余边框、颜色与卡片噪声；列表和正文各保留一圈克制外框，不保留一套“旧移动端外观”。
- 左侧列表移除不必要的彩色状态边线、成组状态胶囊、厚重卡片边框和夸张阴影，以排版、细分隔和克制选中态建立层级。
- 非选中邮件行以留白和行间细分隔建立节奏；只有当前选中行具有完整细边框，不给每一行套卡片框。
- 左侧列表只保留标题、发件人和时间，不渲染附件缩略图、类型图标、未读圆点或可见状态文案。
- 左侧列表标题下方将发件人和混合格式时间放在同一元信息行，时间右对齐并使用等宽数字，避免相对时间变化造成明显抖动。
- 正文移除重复外框感，保留可读的纸张/主题表面，但不再像一张嵌套在阅读区里的厚重卡片。
- 透明正文不得降低正文、元信息、附件或按钮对比度，也不得再叠加第二层有边框或填充的正文容器。
- 道具附件独立显示为可点击图标；数量大于 1 时在图标右上角显示数量角标。
- 金币附件与道具附件共享图标块尺寸、数量和已领取勾选语言，但金币附件不渲染为按钮，也不获得弹层交互。
- 已领取道具使用醒目的大型勾选覆盖表达完成状态；覆盖层必须为装饰性、不可交互，不能阻止附件按钮的 hover、focus、click 或 tap。
- 道具图标可通过鼠标、触控和键盘打开复用/适配后的商店式详情；详情弹层有明确标题、图片、道具说明与关闭路径，不显示当前持有数量、本封附件数量或领取状态，也不包含购买或使用动作。
- 领取动作与附件图标分区：附件位于正文底部左侧，领取按钮位于底部右侧主操作区。
- 未领取时右下角显示可用的“领取附件”主按钮；领取后同一位置稳定保留灰色禁用的“已领取”按钮，避免操作区发生布局跳动。
- 删除仍沿用现有 API、可删除条件、错误反馈和成功 toast，不引入批量删除或自动删除逻辑。
- 领取、已领取、删除不可用和网络忙碌状态必须保持语义清楚，且不能依赖颜色单独表达。
- 列表暗化按处理完成状态推导：无附件邮件为 `isRead`；有附件邮件为 `isRead && !claimable`。未读邮件和仍待领取附件的已读邮件保持正常亮度。
- 缺失道具图时显示项目现有道具占位图标；缺失说明时显示克制的“暂无道具说明”，长标题/发件人/正文不得撑破双栏或移动端视口。
- 打开道具详情后将焦点移入弹层；关闭、点击遮罩或按 Escape 后恢复到原附件图标。详情打开期间不得误触发邮箱关闭。
- 正文保持自身滚动，底部附件/领取区维持稳定位置；长正文不能把附件与领取按钮挤出可操作区域。

## Acceptance Criteria (evolving)

- [ ] 邮箱 header 的标题、关闭按钮和移动端返回行为保持现状。
- [ ] 桌面不出现“全部邮件”筛选/容量行。
- [ ] 桌面与竖屏移动端使用统一的改版视觉语言；桌面仍为双栏，移动端仍为列表/正文切换且返回焦点行为不退化。
- [ ] 邮件列表不再显示当前彩色左边线、状态胶囊、未读圆点、附件图标或缩略图，只显示标题、发件人和时间。
- [ ] 未处理和完成邮件通过字重与整行明暗区分；屏幕阅读器仍能从列表按钮的可访问名称获知未读、待领取或已完成状态。
- [ ] 当前选中邮件显示中性色细边框，非选中邮件无外框；键盘焦点轮廓与选中态可明确区分。
- [ ] 列表时间按“刚刚 / N分钟前 / N小时前 / N天前 / YYYY/MM/DD”的固定阈值显示，正文仍提供完整日期和时分；无效日期值安全回退为原始文本。
- [ ] 无附件邮件已读后整体降级显示；有附件邮件仅在已读且已领取后整体降级显示；仍待领取的已读邮件保持正常亮度。
- [ ] 正文标题、发件人、时间、正文、附件和操作区的顺序与参考图的信息层级一致。
- [ ] 列表与阅读区各有一圈公告同款强度的 2px 实线外框且无厚阴影；正文 article 透明、无纸纹/填充，不形成第二层嵌套卡片。
- [ ] 道具数量为 1 时不显示角标；数量大于 1 时显示在图标右上角且不遮住主要图形。
- [ ] 已领取道具显示半透明暗灰遮罩和白色大型勾选；右上角数量角标仍清晰可读，覆盖层不影响附件图标打开详情。
- [ ] 金币附件使用相同尺寸的独立图标块并显示数量；它不可点击、不进入 Tab 顺序，领取后显示大型勾选覆盖。
- [ ] 道具附件图标可以点击、触摸和键盘激活，并打开邮箱语境的道具详情弹层。
- [ ] 附件详情沿用商店式详情的信息层级，只显示类别、图片、名称和说明；不显示当前持有、本封数量、领取状态或内部 `itemId`，也不会出现购买/使用类操作。
- [ ] 领取和删除操作沿用现有接口、忙碌锁、成功 toast 和失败反馈。
- [ ] 领取成功后右下角按钮原位切换为灰色禁用“已领取”，尺寸不跳动且不会响应点击、悬停或键盘激活。
- [ ] 桌面、375px 竖屏、768px 边界视口均无横向溢出，交互目标不小于 44px。
- [ ] 动效在正常模式下简短且具有状态含义，在 `prefers-reduced-motion` 下可安全降级。
- [ ] 聚焦测试覆盖完成态推导、数量角标、附件详情开关/焦点、领取/删除回归和移动端列表/详情语义。
- [ ] 缺图、缺说明、无效日期、长标题、长正文和请求失败都有稳定回退，不造成内容溢出或丢失关闭/返回路径。
- [ ] 道具详情关闭后焦点恢复到附件图标，Escape 与遮罩关闭只关闭最内层详情，不误关邮箱。
- [ ] `npm run check` 通过；若接口/设计事实改变，同步更新系统设计文档并运行 `npm run docs:system-design`。

## Open Questions

- 无待决产品问题；等待用户最终确认后进入实施。

## Technical Approach

- 保留 `InformationCenterLayout` 作为桌面双栏和移动端列表/详情切换骨架，不修改公告界面或共享 header 行为。
- 在 `MailboxModal` 内重新组织列表行、正文头部、滚动正文和底部附件/动作区；删除继续使用现有右上角按钮和 API。
- 为邮件推导明确的 `unhandled` / `done` 展示状态：无附件以已读为完成，有附件以已读且不可领取为完成；可访问名称补充状态文本，DOM 中不渲染可见状态胶囊。
- 增加独立的相对时间格式函数并保持正文完整时间格式；使用可测试的当前时间输入，避免脆弱的时区/计时测试。
- 将道具附件渲染为 44px 以上的原生按钮，金币附件渲染为同尺寸非交互图标块；数量角标、大型领取勾选均为不拦截交互的装饰层。
- 邮箱道具详情采用商店式布局，但保持目录展示语义，不读取持有数量，也不呈现本封数量/领取状态，不启动跨商店/仓库的组件重构。
- `AppOverlays` 不向邮箱详情传入实时 `user`；领取接口返回的新用户数据仍继续通过 `onUserChange` 更新其他既有用户态。
- `server/mailbox.js` 在现有附件 payload 中补充玩家安全的道具说明，并使用已加载的 `ShopItem` 目录及内置招募道具说明作为回退；不新增接口、不修改 Prisma 模型。
- 样式继续由 mailbox 领域 CSS 所有，并同步更新最终 Bright School 竖屏安全层；仅使用项目语义令牌、克制分隔与 transform/opacity 动效。

## Decision (ADR-lite)

**Context**: 当前邮箱已有可靠的读取、领取、删除和主从响应式行为，但卡片边框、状态色条、胶囊与嵌套纸张框造成视觉噪声；参考图提供了更清晰的标题、正文、附件和主操作层级。

**Decision**: 保留共享信息中心骨架和业务接口，仅重构邮箱领域的呈现与附件交互。采用“克制编辑式信箱”视觉，单附件图标块、右下角领取动作、商店式道具详情和明确的完成态暗化；不扩展多附件或跨领域组件架构。

**Consequences**: 改动集中、回归面可控，并能显著降低视觉噪声；未来若引入多附件或统一道具详情，仍需要单独任务设计数据与共享组件边界。

## Implementation Plan

1. 补齐邮件附件的玩家安全说明字段和纯函数测试。
2. 重构邮箱列表、正文结构、附件图标块、领取/删除状态与商店式道具详情交互。
3. 重写邮箱领域桌面/移动样式，更新主题与 CSS 合约测试并进行可访问性/动效兜底。
4. 更新受影响的系统设计分篇和入口摘要，生成 `docs/system-design.html`。
5. 运行聚焦测试、视觉检查与 `npm run check`，只提交本任务文件。

## Definition of Done

- Tests added/updated for behavior, DOM semantics, CSS contracts and responsive states.
- Focused validation and repository quality gate pass.
- Desktop and portrait-mobile screenshots are visually checked against the approved direction.
- System design documentation and generated HTML are updated when the final implementation changes documented UI/API facts.
- Unrelated pre-existing worktree changes remain untouched and are excluded from this task's eventual commit.

## Out of Scope

- 新增邮箱分类、搜索、筛选、容量上限或“全部领取/删除已读”等参考图功能。
- 修改后台邮件发送界面。
- 修改邮件数据为多附件模型。
- 为未来多附件提前增加列表/网格结构。
- 重构商店、仓库或其他界面的共享道具详情组件。
- 修改邮件领取/删除的核心业务规则，除非后续需求确认确有必要。
- 照搬参考图的品牌图标、深色主题、背景或美术资产。

## Technical Notes

- Primary component: `src/modals/MailboxModal.jsx`
- Focused tests: `src/modals/MailboxModal.test.jsx`
- Mailbox styles: `src/styles/modals/mailbox/{layout,list,detail,detail-actions,mobile}.css`
- Shared layout: `src/modals/InformationCenterLayout.jsx` and `src/styles/modals/information-center.css`
- Final mobile safety: `src/styles/mobile-adaptive/information-center.css` and `src/styles/mobile-adaptive/bright-school-portrait/mailbox-modal.css`
- Server payload: `server/mailbox.js`; attachment catalog currently supplies name/image but not description.
- Existing item descriptions: `ShopItem.description` via `server/items.js`, with built-in recruitment fallback data in `src/shared/recruitment.js`.
- Existing nested detail reference: `src/modals/shop/ShopItemDetailDialog.jsx`; reuse or extract its presentation so mailbox gets the same item-detail hierarchy while excluding purchase/use actions.
- `AppOverlays` already owns the live `user` value but does not currently pass it into `MailboxModal`; implementation should pass the current user so shop-detail ownership helpers can display the latest held quantity, including the post-claim update returned through `onUserChange`.
- Frontend trio applied: `frontend-design`, `ui-ux-pro-max`, and `interaction-design`.
- `ui-ux-pro-max`'s optional local `scripts` entry is a pointer file rather than an executable directory in this installation, so its loaded hierarchy, accessibility, responsive, contrast and motion guidance is applied directly.
- Requirement discovery uses `grill-me` plus `trellis-brainstorm`, one preference question per round, with accepted decisions written back here immediately.
