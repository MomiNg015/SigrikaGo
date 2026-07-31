# 首页移动端入口收紧与 Header 看板娘

## Goal

在不改变首页六个入口按钮素材、交互和桌面布局的前提下，收紧 Bright School 竖屏移动端 2×3 工具入口网格；同时移除首页 Header 在线人数，将用户提供的动态看板娘做成桌面/移动端共用、刚好趴在 Header 下边缘的响应式装饰。

## Requirements

- 仅调整 `max-width: 760px` 且竖屏条件下的 Bright School 首页工具入口布局。
- 保留 2×3 排列、现有按钮顺序、透明图片按钮形态、悬停/按下反馈和无障碍名称。
- 将网格间距收紧到 `2px`，并由按钮轨道显式控制三行高度，避免透明图片画布继续主导网格行高。
- 两列各使用 46% 宽度并居中；移动端图片 motion wrapper 扩到 132%，抵消列轨道收窄，保持可见按钮图尺寸基本不变。
- 保留移动端图片右侧/底部的投影安全留白，避免阴影被裁切。
- 保留每个入口至少 `52px` 的布局高度，不能缩小到低于项目的 44px 触控目标。
- 不修改六张 1500×600 素材，不通过裁图或拉伸制造紧凑效果。
- 不改变桌面端 3×2 工具箱及其他主题布局。
- 从 `HomeHeader` DOM 和调用参数中移除在线人数，不以 CSS 隐藏代替。
- 看板娘使用独立首页资源与空 `alt`、`aria-hidden`、非拖拽语义，不占用点击事件。
- 动图透明画布的五帧可见边界一致；样式按该边界校正布局盒，使可见角色而不是 800×800 透明画布参与定位。
- 桌面端将看板娘作为品牌与操作区之间的小尺寸元素，靠近版本号并让手臂越过 Header 下边缘。
- Bright School 竖屏移动端使用 `brand mascot actions` 三列布局，角色在标题/版本与菜单之间放大，菜单仍保留独立 44px 触控区域。
- 用户开启 reduced-motion 时显示同构静态首帧，不强制播放 GIF。

## Acceptance Criteria

- [x] 竖屏移动端仍为两列三行，六个入口顺序不变。
- [x] 网格使用居中的两列 46% 轨道、三行 `max(52px, 18vw)` 轨道和 2px 间距，按钮中心在横向和纵向都明显更靠拢。
- [x] `.utility-entry` 的 `min-height: 52px` 契约保留，按钮仍可聚焦、点击且不会互相遮挡。
- [x] 六张入口图保持 `object-fit: contain`、132% 移动端图片包装、透明按钮外观和原有交互动效，视觉尺寸没有因轨道收窄而明显变小。
- [x] 六入口的桌面端规则与六张资源文件不变。
- [x] HomeScreen 与 CSS 契约测试通过，系统设计文档同步并重新生成 HTML。
- [x] Header 不再渲染在线人数、对应图标或旧 `online` 网格区域。
- [x] 动态看板娘在桌面端位于版本号右侧附近，在竖屏移动端位于标题与菜单之间，两个视口下都以手臂越过底边的方式贴住 Header。
- [x] 看板娘不遮挡标题、版本号和菜单，不吞掉点击；reduced-motion 使用静态首帧。
- [x] 动图、静态首帧、DOM、桌面/移动端 CSS 与生产构建均有回归覆盖。
- [x] Header 动图五帧统一使用 170ms 延时，在不重编码画面的前提下把播放速度降低约 40%。

## Definition of Done

- 移动端 owner、回归测试和系统设计分篇完成同步。
- 运行针对性测试、Lint、生产构建和 CSS 构建契约检查。
- 最终视觉效果由用户在移动端视口验收。

## Technical Approach

入口网格继续由 `entries-utility-footer.css` 的显式轨道与 132% 图片包装控制。Header 侧在 `HomeHeader` 中新增语义化装饰 `<picture>`，普通模式使用 GIF、reduced-motion 使用透明静态首帧；共享样式把透明画布映射到统一的 514×521 可见边界，Bright School 桌面 owner 负责品牌旁定位，portrait owner 负责 `brand mascot actions` 三列和更大的移动端尺寸。在线人数 JSX、prop 和各层遗留选择器一并删除。

## Decision (ADR-lite)

**Context**: 首次仅把 `gap` 从 8px 改为 2px，理论上只减少约 12px 总高度；1500×600 图片包装仍按列宽参与 auto row sizing，画布内部透明区继续主导视觉距离，因此用户几乎感觉不到变化。

**Decision**: 将点击轨道与装饰图片尺寸解耦：显式轨道决定紧凑度，增大的图片包装补偿收窄列宽；不改图片展示补白、素材、触控下限或单个入口顺序。

**Consequences**: 六个入口会更像一个连续工具组；素材安全区仍能避免相邻绘画内容碰撞，桌面与交互状态保持原样。

## Out of Scope

- 不重新绘制、裁剪或替换六张入口素材。
- 不修改首页主面板、对局入口、部员手册或玩家铭牌布局。
- 不改变桌面端排列、按钮动效或功能行为。
- 不处理后台管理界面。

## Technical Notes

- DOM owner：`src/home/components/HomeUtilityDock.jsx`。
- 桌面 owner：`src/styles/themes/bright-school/home/utility-toolbox/toolbox-grid.css`。
- 移动端最终 owner：`src/styles/themes/bright-school/mobile/home-shell/entries-utility-footer.css`。
- 现有素材均为 1500×600（2.5:1），可见 alpha 四周已有约 7%–11% 的透明安全区。
- 回归测试：`src/home/HomeScreen.test.jsx`。
- 文档：`docs/system-design.md`、`docs/system-design/06-ui-theme-mobile.md`、生成的 `docs/system-design.html`。
- Header DOM owner：`src/home/components/HomeHeader.jsx`；共享几何 owner：`src/styles/home-terminal/top-strip.css`；Bright School 桌面与竖屏 owner 分别为 `home-brand-status.css` 和 `mobile/home-shell/top-strip-menu.css`。
- 用户 GIF 五帧均为 800×800，非零 alpha 联合边界为 `(150, 184)–(663, 704)`，即 514×521；CSS 布局盒按这一可见边界校正，避免透明留白造成“看起来没贴住”。

## Validation Results

- 第一版只改 `gap` 虽通过 131 项测试，但用户视觉反馈确认效果不足；第二版改为显式轨道与图片尺寸解耦后，`HomeScreen.test.jsx` 与 CSS inventory/style/theme contracts 共 4 个文件、131 项测试重新通过。
- 第二版 `npm run lint`、`npm run build`、`npm run check:built-css`、`npm run docs:system-design` 与 `git diff --check` 通过；生产构建仅保留仓库既有的公共资源运行时解析和大 chunk 警告。
- 浏览器以 390×844 竖屏确认本地应用可加载，但该隔离浏览器没有登录态，首页最终视觉紧凑度留给用户在已有登录态的移动端页面验收。
- Impeccable 对 `HomeScreen.test.jsx` 的颜色提示来自该文件既有断言，本次未新增或修改颜色，不作无关设计改动或静默豁免。
- Header 新范围追加 132 项聚焦测试、Lint、系统设计生成、生产构建和构建后 CSS 契约检查。使用系统 Edge 对生产 CSS 做独立 Header 快照：桌面 1364px、竖屏 390×844 与窄屏 320×693 都没有横向溢出。最终校正将角色较上一版上提 2px，保留完整深色底边；竖屏 Header 使用 12px 列间距把看板娘向左收离菜单，移动菜单保持独立 44px 点击区，展开面板以紧凑 148px 宽度从右侧对齐。
- reduced-motion 浏览器上下文确认 `<picture>` 的 `currentSrc` 从 GIF 切换为透明 WebP 静态首帧；普通上下文仍使用原 GIF。最终视觉仍由用户在实际登录首页验收。
