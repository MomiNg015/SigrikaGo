# 修复加载页提示前缀与移动端橘子末端挤压

## Goal

统一共享加载页进度条下方提示语的显示格式，并修复移动端进度到达末端时橘子图被响应式图片规则压缩的问题，同时保持现有滚动、呼吸、进度揭示和主题视觉不变。

## Requirements

* 所有由 `AssetPreloadScreen` 显示的随机加载提示，在画面上统一以 `Tip：` 开头。
* 后台配置与 `preloadTipList()` 继续保存和返回原始提示内容，不把展示前缀写回配置数据。
* `showTips={false}` 的教程/固定文案加载流程继续不显示随机提示。
* 移动端橘子图在 0% 到 100% 全程保持自然 1:1 比例和既有高度，尤其到达 100% 末端时不得被全局 `img { max-width: 100% }` 规则压缩。
* 保留现有两圈顺时针滚动、420ms 位移、600ms 后呼吸、mask 揭示和 reduced-motion 行为。
* 按项目要求同步加载页设计事实到 `docs/system-design.md` 及对应分篇，并重新生成 `docs/system-design.html`。
* 追加修复角色详情 Bright School 音乐播放器的播放/暂停按钮：播放图标使用亮蓝，暂停图标使用亮粉，保持既有 CSS 图形、44px 触控面积和音频状态逻辑。
* 播放按钮悬停、键盘聚焦或点击按下时，真实按钮与内圈伪元素的背景、边框和阴影保持透明，不再在手绘收音机圆键上叠加突兀的圆形底；键盘焦点轮廓和按下位移继续保留。
* 播放/暂停 CSS 图形必须显式继承按钮状态色，不能被后置的 Bright School 通用 `span` 文字颜色重新染回深色。

## Acceptance Criteria

* [x] 有提示时渲染文本为 `Tip：<原提示>`，且前缀只出现一次。
* [x] `showTips={false}` 时不渲染 `.preload-tip`。
* [x] 移动端 `.preload-progress-mascot` 保留 `width: auto`、固定 `--mascot-h` 高度并覆盖全局图片 `max-width` 上限，进度 100% 时不变形。
* [x] 橘子仍完整位于进度轨道末端，没有横向裁切或压扁。
* [x] 现有加载页单元/DOM 测试通过，并增加前缀和移动端尺寸所有权回归断言。
* [x] `npm run docs:system-design`、lint、全量测试、构建、产物 CSS 和生产配置检查通过；本机后台 `siteSettings` 与已提交快照的既有漂移单独记录，不属于本任务源代码变更。
* [x] Bright School 角色播放器空闲播放图标为亮蓝、播放中暂停图标为亮粉，且两种状态均可清楚识别。
* [x] 播放按钮 hover/focus/active 的真实按钮和内圈伪元素不绘制圆形背景、边框或阴影；focus outline 与 active 位移反馈仍存在。
* [x] 角色详情播放器聚焦测试、CSS 合同、构建和系统设计文档生成通过。

## Definition of Done

* 测试覆盖提示展示边界与橘子固定比例样式。
* 真实移动端视口核验 100% 端点宽高和视觉结果。
* 文档与生成的 HTML 同步。
* 不改后台提示配置格式，不改其他页面的全局图片规则。

## Technical Approach

在 `AssetPreloadScreen` 的展示边界添加固定 `Tip：` 前缀；在 `src/styles/base/asset-preload.css` 的组件所有者规则中保留橘子的自然宽度与固定高度，并用 `max-width: none` 使其不受后加载的移动端全局响应式图片上限影响。通过现有测试锁定 CSS 契约，并核验移动端加载页的组件所有权。

## Decision (ADR-lite)

**Context**: 提示前缀属于展示语义，橘子变形来自共享组件规则与移动端全局图片规则的级联交互。

**Decision**: 在共享加载组件内部处理前缀和橘子尺寸所有权，不修改后台配置内容，也不放宽全局移动端图片保护规则。

**Consequences**: 所有复用 `AssetPreloadScreen` 且开启提示的流程自动保持一致；固定提示被关闭的流程不受影响；橘子保持现有动画和端点路径。

## Out of Scope

* 不改加载提示后台编辑格式或默认提示内容。
* 不重做进度条纹理、尺寸、速度或运动曲线。
* 不调整加载页其他角色立绘和文案布局。
* 不改角色音乐播放、暂停、切歌、持久化或错误恢复逻辑，不改播放器收音机资源、尺寸和位置。

## Technical Notes

* 共享组件：`src/app/AssetPreloadScreen.jsx`
* 基础样式所有者：`src/styles/base/asset-preload.css`
* 后加载的移动端全局约束：`src/styles/mobile-adaptive/phone-core/global-shell-controls.css`
* 现有回归测试：`src/app/AssetPreloadScreen.test.jsx`、`src/app/AssetPreloadScreen.dom.test.jsx`
* 相关规范：`.trellis/spec/frontend/css-architecture.md`、`.trellis/spec/frontend/quality-guidelines.md`
* 角色播放器主题所有者：`src/styles/themes/bright-school/component-repairs/character-music-player/player-shell.css`
* 角色播放器样式合同：`src/modals/HouseModal.test.js`

## Verification

* 聚焦加载页、DOM、CSS inventory 与样式契约：93/93 通过。
* 聚焦播放器、加载页、DOM、CSS inventory、共享样式与主题合同：7 个文件、160 项测试通过。
* 全量 Vitest：331 个文件、2310 项测试全部通过。
* `npm run build`、`npm run check:built-css`、生产配置检查与 `npm run docs:system-design` 通过。
* `npm run check` 仅在 `check:admin-snapshot` 停止：本机数据库的 `siteSettings` 与提交快照不一致；`src/shared/siteSettings.js`、`server/adminDefaultSnapshot.js` 及快照脚本均无本次差异。
* 真实 Chromium 预览确认桌面播放图标为亮蓝、暂停条为亮粉；390×844 竖屏下播放器为 210×50、按钮为 44×44，按钮背景透明，图标计算色分别为 `rgb(154, 211, 222)` 与 `rgb(255, 158, 187)`。
