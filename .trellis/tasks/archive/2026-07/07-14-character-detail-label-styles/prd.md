# 调整角色详情标签样式

## Goal

让棋舍角色详情中的“获得途径”和技能名标签更符合当前角色详情视觉层级：获得途径使用中性灰色直角标签，技能名使用对应角色主题色的浅色背景并保持黑色文字可读。

## Requirements

- “获得途径”标签使用灰色背景和方形角边框。
- 普通技能与派生技能的技能名标签使用当前角色 `palette` 对应的浅色背景。
- 技能名文字固定为黑色。
- 桌面和移动端沿用同一标签合同，不改变现有布局、技能说明、超频标签或交互。
- 同步更新 `docs/system-design.md` 并生成 `docs/system-design.html`。

## Acceptance Criteria

- [x] 角色详情根节点向 CSS 暴露角色 `palette`，缺失时使用现有角色默认色。
- [x] 普通技能和派生技能名都显示浅角色主题色背景与黑色文字。
- [x] “获得途径”标签显示灰色背景、可见边框和 `border-radius: 0`。
- [x] Bright School 后置样式不会把上述标签重新覆盖为透明背景。
- [x] 现有角色详情定向测试通过。
- [x] 系统设计入口和生成的 HTML 同步。

## Definition of Done

- 定向测试通过。
- 文档生成命令通过。
- 不包含工作区中已有的无关改动。

## Technical Approach

在 `CharacterDetailDialog` 根节点设置局部 `--character-theme-color`，使用角色已有的 `palette` 字段作为唯一主题色来源；由角色详情 CSS 所有者通过 `color-mix()` 与白色混合生成浅色技能标签背景。获得途径标签使用稳定中性灰色，不依赖角色主题色。

## Decision (ADR-lite)

**Context**: 角色主题色已经存在于角色数据中，但角色详情技能标签尚未消费该字段。

**Decision**: 复用 `character.palette`，通过局部 CSS 自定义属性传递，并在现有角色详情样式层生成浅色背景。

**Consequences**: 无需新增角色映射或主题数据；后台调整角色 palette 后，详情技能标签会自动跟随。

## Out of Scope

- 不调整技能超频标签、角色描述、CV、BGM 播放器或详情窗口布局。
- 不重做角色详情整体配色。
- 不触碰其他房间技能标签或角色卡片。

## Technical Notes

- 组件：`src/modals/house/HouseNestedDialogs.jsx`
- 共享标签样式：`src/styles/modals/character-opening/skill-copy.css`
- Bright School 最终所有者：`src/styles/themes/bright-school/quality-base/audit-profile-modals.css`
- `quality-base/refinement-foundation.css` 晚于组件修复层加载，不能再把技能名和获得途径纳入通用粉色标签组。
- 定向测试：`src/modals/HouseModal.test.js`
- 规范：`.trellis/spec/frontend/css-architecture.md`、`.trellis/spec/frontend/quality-guidelines.md`
