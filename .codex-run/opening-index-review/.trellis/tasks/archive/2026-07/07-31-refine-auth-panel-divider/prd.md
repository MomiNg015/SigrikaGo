# 优化登录面板标题与表单分隔层次

## Goal

在不改变登录、注册与校验行为的前提下，将用户提供的新看板娘替换为登录页专用资源，并把看板娘、面板和延伸分割线整合成一个响应式组合：分割线从面板内延伸到左侧，刚好承托角色下沿，整组在桌面与竖屏界面中统一居中、自适应缩放。

## Requirements

- 保留 `.auth-panel-header` / `.brand-lockup` 的标题语义与表单顺序，将看板娘换成图 2 并保持空 `alt`、`aria-hidden="true"` 和指针透明。
- 新增 `.auth-composition`，让面板宽度、角色横向外伸、顶部留白和竖屏收缩由同一个布局 owner 管理，而不是按面板单独居中。
- 在 header 底部保留具有前后层次的硬边双层分割线：深色主线负责结构，浅蓝纸张强调线负责主题识别；两条线延伸出面板并位于角色下沿，不使用模糊阴影、动画或新的交互状态。
- 分割线不接收指针事件，不进入无障碍树，也不占用会挤压标题或表单的独立交互空间。
- 桌面与竖屏移动端均保留清晰的 header/form 间距，不造成标题换行、角色遮字、横向溢出或短屏滚动退化。
- 复用当前 Bright School token 与既有 auth owner 样式，不新建第二套卡片或表单视觉。
- 同步更新覆盖该 DOM/CSS 契约的测试、CSS debt 基线以及系统设计文档。

## Acceptance Criteria

- [x] 登录和注册模式都渲染 `.auth-composition` 与语义化 `.auth-panel-header`，新看板娘可见且仍是无障碍树外的装饰图片。
- [x] Bright School 主题下 header 与表单之间显示深色主线和浅蓝强调线，线条延伸到面板左侧并与角色下沿对齐。
- [x] 分割线声明 `pointer-events: none`，不会改变键盘、提交、模式切换或密码可见性行为。
- [x] 900px 以下的手机与窄屏样式保持标题单行、角色不遮住标题、页面无横向溢出，表单间距和短屏滚动稳定。
- [x] AuthScreen 与样式契约测试通过；CSS inventory 不出现未登记增长。
- [x] `docs/system-design.md` 与相关 UI/theme 分篇同步，`docs/system-design.html` 重新生成。

## Definition of Done

- 代码、样式、针对性测试和文档均更新。
- 运行 AuthScreen、样式 inventory/contract 与系统设计 HTML 测试。
- 运行 `npm run docs:system-design`，并进行桌面和竖屏移动端视觉检查。
- 不提交或改动无关工作。

## Technical Approach

在 `AuthScreen.jsx` 中用 `.auth-composition` 包裹现有面板，并让 `.auth-panel-header` 继续承载 `.brand-lockup`。基础层通过共享 CSS 变量记录 440px 面板、桌面横向外伸、顶部留白、面板内边距和看板娘尺寸；角色下沿与 header 主分割线共享同一组底部间距变量。Bright School repair owner 用 header 伪元素绘制延伸双线，900px 移动布局 owner 将横向预留归零并以 `clamp()` 同步缩小角色与标题留白。

## Decision (ADR-lite)

**Context**: 现有标题区和表单仅靠 `margin-top` 分开，纸张网格背景会削弱区域边界；同时 auth 样式已有明确主题 owner 与移动端 owner。

**Decision**: 采用组合容器 + 语义 header + 双层硬边伪元素分割线；组合容器决定整体居中范围，主线表达结构并承托角色，偏移的主题色副线表达纸张层次。

**Consequences**: 增加一个稳定布局 hook 和共享尺寸变量；登录整体的中心从“卡片中心”变为“角色 + 卡片中心”，移动端则收回桌面外伸量以保护有效表单宽度。

## Out of Scope

- 不重设计输入框、切换按钮、提交按钮或标题字体。
- 不修改认证 API、校验、会话冲突或加载行为。
- 不修改登录页背景、认证行为或其他角色肖像资源。
- 不为后台管理界面新增对应样式。

## Technical Notes

- 主要实现：`src/auth/AuthScreen.jsx`、`src/styles/themes/bright-school/component-repairs/foundation-home/scrollbar-auth.css`。
- 现有移动端 title/mascot owner：`src/styles/mobile-adaptive/bright-school-overrides/auth-login-lockup.css`。
- 契约验证：`src/auth/AuthScreen.test.js`、`src/styles/cssLayerInventory.js`、`src/styles/cssLayerInventory.test.js`。
- 文档入口：`docs/system-design.md`、`docs/system-design/06-ui-theme-mobile.md`、生成的 `docs/system-design.html`。
- 登录标题契约保持 `.text-window-title` 与 `/assets/login-sigrika-mascot.webp` URL 不变；PNG/WebP 更新为清理底部导出残线后的图 2，并统一规范到透明 640x640 画布。可见 alpha 下方固定保留 8 行透明缓冲，在桌面 252px 显示尺寸下约等于 3px 黑色结构线厚度，使角色贴住线条上沿但不遮线。

## Validation Results

- 真实页面初检：1280×720 桌面、390×844 与 320×568 竖屏；登录和注册模式均无水平溢出，标题保持单行，短屏注册表单由 `.auth-screen` 垂直滚动。最终视觉验收由用户完成。
- 桌面组合宽 558px，包含 118px 左侧角色外伸；竖屏将外伸预留归零，并使用 148–164px 角色尺寸与 36–50px 顶部预留。
- `AuthScreen.test.js`、CSS inventory/style/theme contract 共 4 个文件、127 项测试通过；资源回归项锁定 PNG/WebP 可见 alpha 下方恰好保留 8 行透明缓冲。
- `npm run lint`、`npm run build`、`npm run check:built-css` 与 `npm run docs:system-design` 通过；构建仅保留仓库既有的大 chunk / 公共资源运行时解析警告。
- Impeccable 对本轮新增布局规则未报告新问题；其 27 项提示均来自所触及共享 CSS 中既有的非 DESIGN.md 色值/圆角，本轮未改色、未扩展或静默豁免。
