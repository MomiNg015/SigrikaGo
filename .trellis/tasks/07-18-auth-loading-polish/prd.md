# 修复注册密码按钮位移并美化加载条

## Goal

修复注册提交瞬间密码可见性按钮向下偏移的问题，并在不改变加载行为与进度语义的前提下，让共享资源加载页的加载条更生动、动态、可爱且符合 Bright School 视觉语言。

## What I already know

- 注册表单位于 `src/auth/AuthScreen.jsx`，密码与确认密码按钮都使用 `.auth-password-toggle`。
- 根因是 Bright School 的 `.auth-form button:disabled` 把按钮的 `transform` 重置为 `none`，覆盖了密码按钮用于绝对居中的 `translateY(-50%)`。
- 共享加载页位于 `src/app/AssetPreloadScreen.jsx`，登录预加载、路由 fallback 与战斗资源加载都会复用它。
- 当前加载条已有橙色吉祥物随真实进度移动/旋转、轻微进度时待机跳跃、进度条 ARIA 语义与 reduced-motion 降级。
- 现有主题要求玩家 UI 保持 Bright School 的纸张、校园、动画角色活力，同时标准控件必须稳定、熟悉、可读。

## Assumptions

- 保留现有橙色吉祥物及其与真实进度同步的行为，在此基础上增强轨道和反馈层，不更换主视觉资产。
- 加载条增强同时覆盖桌面与竖屏移动端，并保证窄屏不溢出。
- 不改变预加载流程、资源清单、进度计算、提示轮换或战斗 ready 上报。

## Requirements

- 注册提交进入 pending/disabled 状态时，两个密码可见性按钮都保持原位，不发生垂直位移。
- 密码按钮继续保留 44px 点击区、透明背景、无阴影、正确的可访问名称与焦点行为。
- 加载条继续准确反映 `--preload-progress`，吉祥物、填充和 ARIA 百分比保持一致。
- 加载条动效只使用 transform/opacity/background-position 等合成友好属性，并提供 `prefers-reduced-motion` 降级。
- 视觉增强必须复用现有 Bright School 色彩和橙色吉祥物，不引入通用科技感或与主题割裂的视觉语言。
- 加载条采用校园手账方向：粉彩轨道流动、轻量星点/纸屑反馈、小橘子随进度滚动并在停顿时原地跃动；装饰必须服从真实加载状态，不做高饱和庆典特效。

## Acceptance Criteria

- [ ] 点击“登记入部信息”进入真实异步提交态后，两个 `.auth-password-toggle` 的垂直居中 transform 不变。
- [ ] 密码可见性按钮的默认、hover、focus-visible、disabled 状态均无布局位移。
- [ ] 加载条在 0%、中间进度、100% 下填充与吉祥物位置正确，轨道无水平溢出。
- [ ] 进度移动与停顿时呈现不同但连续的状态反馈，且不会遮挡加载文案。
- [ ] reduced-motion 下移除持续位移/旋转等非必要动画，同时保留清晰静态进度。
- [ ] 相关 AuthScreen 与 AssetPreloadScreen 测试通过。
- [ ] 桌面与竖屏移动端完成视觉检查。

## Decision (ADR-lite)

**Context**: 现有加载条已具备橙色吉祥物随真实进度滚动与待机跳跃，但轨道层次和加载反馈偏平，用户希望更生动、动态、可爱。

**Decision**: 保留现有组件、资产和进度数据流，选择与 Bright School 一致的校园手账方向，通过 CSS/轻量语义装饰增强粉彩轨道、高光、纸屑/星点和状态节奏。

**Consequences**: 视觉表现会更丰富，但仍需保持可读性、移动端边界、合成性能与 reduced-motion 降级；不引入新图片资产或动画库。

## Implementation Plan

- 修复 Bright School 密码可见性按钮 disabled 状态的 transform 所有权，并补充 CSS/DOM 回归断言。
- 在共享加载组件中加入非语义装饰层，扩展基础加载条 CSS 的动态状态和 reduced-motion 合约。
- 核对 Bright School 后置主题覆盖，确保最终颜色和边框规则不抹掉新层次。
- 更新系统设计入口摘要、生成 HTML，运行相关测试和仓库质量门。

## Definition of Done

- Tests added/updated for the regression and loading visual contract.
- Lint, relevant tests, build, and repository checks pass.
- `docs/system-design.md` and affected system-design detail are synchronized as required by project instructions, then `docs/system-design.html` is regenerated.
- Existing unrelated working-tree changes remain untouched and are not included in this task's commit plan.

## Out of Scope (explicit)

- 修改注册 API、表单校验、密码规则或提交文案。
- 修改资源预加载算法、加载耗时或后端 ready 协议。
- 更换加载角色立绘、橙色吉祥物资产或全页布局。

## Technical Notes

- Auth owner: `src/styles/themes/bright-school/component-repairs/foundation-home/scrollbar-auth.css`.
- Loading component: `src/app/AssetPreloadScreen.jsx`.
- Loading base owner: `src/styles/base/asset-preload.css`.
- Bright School loading overrides currently span `base/preload-scrollbars.css`, `surface-contracts/final-semantic-badges.css`, `surface-contracts/meters-friend-scroll.css`, and shared player-theme wiring; final selector ownership must be checked before editing.
- Required tests include `src/auth/AuthScreen.test.js`, `src/auth/AuthScreen.dom.test.jsx`, `src/app/AssetPreloadScreen.test.jsx`, and `src/app/AssetPreloadScreen.dom.test.jsx`.
