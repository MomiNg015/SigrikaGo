# 用户名背景 V2：资产专属高能铭牌体系

## Goal

将共享 `UserIdentity` 升级为可由资产 ID 挂载专属结构与动效的用户名铭牌体系，并重做内置“点亮语义”用户名背景。新版沿用现有橙金、紫色语义魔法主题，采用参考图的左侧核心、横向名字条、右端能量收尾构图，在所有展示场景提供高能常驻动效，同时兼容普通纯图片铭牌和现有装备数据。

## Requirements

- `UserIdentity` 对外 props 与服务端接口保持不变。
- 已装备图片铭牌输出 `data-nameplate-id`，并包含一个 `aria-hidden`、不参与点击和布局的专属效果层。
- 铭牌 DOM 明确分为背景、效果、文字三层；独立徽章继续显示在铭牌左侧，称号与无铭牌样式保持现状。
- 普通图片铭牌继续使用默认 `96px x 25.6px`、`3.75:1` 固定槽位，不获得任何资产专属效果。
- 资产 `reward-sigrika-spark-100-wins-nameplate` 使用独立 CSS owner，运行时基础槽位为 `120px x 32px`；首页、compact、手机与移动对局继续通过现有 `--user-nameplate-scale` 等比例缩放。
- “点亮语义”视觉保持橙金与紫色语义魔法主题，构图包含左侧约 22% 的专属魔法核心、中段深紫名字条、橙金勾边与右侧星火能量收尾。不得复制参考图的 V 徽章、文字或品牌元素。
- 新资产继续使用 `/assets/achievements/semantic-nameplate.png`，输出为透明 `900 x 240` PNG；不烘焙用户名、字母或复杂持续粒子，用户名安全区约为横向 28%–90%。
- 专属动效在首页、个性化预览、对局、排行榜、好友、观战、资料卡和结算等所有共享展示点保持最高强度：约 1.6 秒外辉光呼吸、3.6 秒核心旋转、2.2 秒横向流光和多组错峰星点闪烁。
- 持续动画只改变 `transform` 与 `opacity`；效果层 `pointer-events: none`，不得改变布局尺寸。
- `prefers-reduced-motion: reduce` 停止全部持续动画，并保留清晰的静态橙紫高亮。
- 更新 CSS import/contract/inventory、系统设计 Markdown 与生成的 HTML。

## Acceptance Criteria

- [x] 专属铭牌在 DOM 中暴露稳定的资产 ID、背景层、效果层和文字层；效果层不可访问且不可点击。
- [x] 普通图片铭牌仍可显示，保持默认尺寸且不命中“点亮语义”专属选择器。
- [x] “点亮语义”基础尺寸为 `120 x 32`，现有场景缩放变量在 desktop、compact、phone 与 mobile room 中继续生效。
- [x] 最长合法 8 个半角字符、4 个中日韩字符、历史超长用户名均不覆盖独立徽章或相邻内容；历史超长名按既有 ellipsis 策略退化。
- [x] 独立称号、徽章与“点亮语义”铭牌可同时显示。
- [x] 新 PNG 为 `900 x 240` RGBA，四角透明，视觉安全区满足 DOM 用户名布局。
- [x] 默认情况下所有共享场景均显示完整高能常驻动效；reduced-motion 下无持续动画。
- [x] 相关组件、首页、个性化、预加载与 CSS 合同测试通过。
- [x] `npm run check` 通过，且 `docs/system-design.html` 与 Markdown 同步。
- [x] 浏览器 QA 覆盖 1440x900、1024x768、375x812，确认无布局抖动、横向溢出、点击遮挡或明显卡顿。

## Definition of Done

- 实现、资产、测试、CSS 合同和系统设计文档全部落盘。
- 完成 focused tests、构建和仓库完整检查。
- 对关键桌面/移动场景完成真实浏览器截图与交互检查。
- 工作区仅包含本任务相关变更，并按 Trellis 完成质量核验与收尾判断。

## Technical Approach

- 共享组件只提供稳定的分层 DOM、`data-nameplate-id` 和资产通用回退；每个专属资产由自己的 CSS 文件按资产 ID 匹配。
- “点亮语义”继续沿用既有资产 ID 与 URL，避免数据库迁移，也保证旧数据库已装备玩家自动得到新视觉。
- 底图负责形体、材质和静态边缘，CSS 伪元素/效果层负责呼吸、旋转、扫光和星点，避免把不可缩放的复杂动态烘焙进位图。
- CSS owner 置于共享 `hud-components/user-identity/` 域内，并在现有 core/context/phone 层之后导入，使资产专属变量可覆盖默认尺寸且仍被场景 scale 控制。

## Decision (ADR-lite)

**Context**: 现有铭牌只是固定比例单层背景图，缺乏层次和动效；未来铭牌又需要不同气质，统一预设会限制表现力。

**Decision**: 使用资产 ID 驱动的代码专属效果。共享组件不增加后端特效字段，不在后台提供预设选择器；当前“点亮语义”获得独立 CSS owner 和新版透明底图。

**Consequences**: 单个铭牌可以高度定制且不污染其他铭牌，但未来新增专属铭牌需要新增 CSS 并随版本发布。普通后台新增图片铭牌仍可直接使用通用静态回退。

## Out of Scope

- 不新增 Prisma 字段、API wire shape 或后台“铭牌特效”选择器。
- 不修改成就条件、装备权限或奖励发放逻辑。
- 不让独立徽章嵌入铭牌核心，也不隐藏徽章。
- 不重做称号、徽章或个性化弹窗的信息架构。
- 不为其他现有或未来铭牌预先制作视觉效果。

## Technical Notes

- 共享组件：`src/shared/UserIdentity.jsx`。
- 共享 CSS 入口：`src/styles/hud-components/user-identity.css` 与其子目录。
- 当前底图：`public/assets/achievements/semantic-nameplate.png`，现为 `900 x 240`。
- 内置资产 ID：`reward-sigrika-spark-100-wins-nameplate`。
- 现有预加载会从 `achievementEquipmentAssets` 自动收集所装备铭牌的 `imageUrl`。
- 参考图仅作为布局和层次参考；现有底图作为橙紫世界观与配色参考。
