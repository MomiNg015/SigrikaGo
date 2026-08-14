# 优化部员手册未获得角色卡片

## Goal

提升 Bright School 部员手册中未获得角色与暂无情报占位卡的状态表达：修正未获得角色内容偏移，并用符合校园手帐主题的“资料损坏/数据缺失”视觉替代当前朴素灰卡。

## Requirements

* 未获得的真实角色卡隐藏出战按钮后，角色图与名称在卡片可用宽度内水平居中。
* 未获得角色卡增加可辨识的显示屏故障层：卡面在最初灰白版本上轻压一档明度且无彩色，静止时不铺网格或扫描线，仅用间歇水平同步撕裂、短促画面偏移与亮度跳变表达故障；不得使用粉、蓝或其他彩色故障光，不改角色名称与点击详情行为。
* `baconbits` 未获得时继续隐藏真实角色资料，只显示“暂无情报”。
* 暂无情报卡删除“暂不可获取”文案，并用独立的方形 `NO SIGNAL` 灰阶坏屏、问号核心和信号丢失横条增强视觉层次。
* 桌面与竖屏移动端均保持内容不溢出；移动端仍使用既有三列、88px 卡片布局。
* 所有新增动效只使用合成友好属性，并在 `prefers-reduced-motion: reduce` 下停止。
* 保持现有 Bright School 几何、轮廓和短硬阴影语言，但未获得状态本身必须去色；不引入黑绿终端、彩色霓虹或通用科幻 HUD 风格。

## Acceptance Criteria

* [ ] 未获得真实角色卡不再保留已隐藏出战按钮的右侧空位，图像与名称视觉居中。
* [ ] 未获得真实角色卡能明确传达“数据未获得/资料损坏”，且文本仍清晰可读。
* [ ] 暂无情报卡中不再渲染“暂不可获取”。
* [ ] 暂无情报卡与普通未获得角色视觉相关但层级更强，且不会泄露角色资料。
* [ ] 键盘点击详情、已获得角色、出战状态与道具徽章行为不回归。
* [ ] 桌面和 760px 以下竖屏布局通过截图检查，无裁切或横向溢出。
* [ ] 聚焦测试、样式合同、构建与系统设计文档生成通过。

## Definition of Done

* 组件结构、Bright School owner CSS 与聚焦测试已更新。
* `docs/system-design.md` 同步记录部员手册未获得状态视觉合同。
* `npm run docs:system-design` 已生成 `docs/system-design.html`。
* 聚焦测试、lint/build 或完整项目检查按风险完成并通过。

## Technical Approach

在 `HouseCharacterGrid.jsx` 中为两类未获得卡片提供语义明确、装饰性元素对辅助技术隐藏的内部结构；由 `handbook-unobtained.css`、`handbook-hidden-intel.css` 与 `handbook-signal-motion.css` 分别负责灰白卡面、无信号屏和共享故障关键帧。使用伪元素与小型装饰 span 构成间歇水平同步撕裂和画面错位，不新增网格/扫描线、图片资产或依赖。

## Decision (ADR-lite)

**Context**: 产品视觉要求“酷炫”，但 Bright School 设计系统明确禁止通用暗色科幻 HUD 渗透。

**Decision**: 采用“中浅灰显示屏信号损坏”表现：普通未获得角色在最初灰白版本上仅轻微压暗卡面与灰阶立绘并发生短促同步故障，静止卡面没有网格/扫描线；暂无情报卡使用层级更强的方形 `NO SIGNAL` 坏屏。故障状态不使用任何彩色强调。

**Consequences**: 视觉更有状态感且仍属于现有主题；CSS 装饰需要专门的移动端压缩与 reduced-motion 合同。

## Out of Scope

* 不修改角色获得逻辑、排序、详情权限或出战逻辑。
* 不重做已获得角色卡、装饰区或角色详情弹窗。
* 不为其他主题同步这套 Bright School 专属视觉。
* 不新增图片或字体资产。

## Technical Notes

* 组件：`src/modals/house/HouseCharacterGrid.jsx`
* 桌面主题 owner：`src/styles/themes/bright-school/modals/handbook-{unobtained,hidden-intel,signal-motion}.css`
* 竖屏 owner：`src/styles/themes/bright-school/mobile/house-profile/character-grid-cards.css`
* 通用基线：`src/styles/lobby/characters.css`
* 相关合同测试：`src/styles/styleContract.test.js`、`src/styles/themeContract.test.js`
* 当前工作区有与本任务无关的未提交修改，实施与验证必须保持窄范围。
