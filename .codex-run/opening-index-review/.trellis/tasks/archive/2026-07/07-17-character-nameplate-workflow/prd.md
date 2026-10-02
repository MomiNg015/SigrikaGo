# 角色专属用户名铭牌制作工作流

## Goal

把本轮西格莉卡铭牌从角色研究、视觉提案、透明资产加工、角色专属动效、项目接入、浏览器验收到测试与提交隔离的经验，沉淀为可重复执行的工作流，使后续只需输入角色、成就、档案来源和少量偏好即可稳定产出不同角色风格的用户名背景。

User confirmed the complete scope on 2026-07-17.

## What I Already Know

- SigrikaGo 已通过共享 `UserIdentity` 的 `data-nameplate-id`、背景/效果/文字三层结构支持资产专属铭牌。
- 普通图片铭牌必须继续使用通用静态回退；角色专属效果由独立资产 ID owner 隔离。
- 西格莉卡实践证明，角色信息不能直接堆成装饰元素，需要先提炼角色气质、代表物、禁用意象、颜色、材质和动作语言，再生成四个可比较方向。
- 资产需要同时检查画布比例、RGBA、四角透明、Alpha 实际边界、用户名安全区与最终运行尺寸；CSS `overflow` 无法修复已经在 PNG 边缘被裁掉的图形。
- 动效必须区分常驻主光、局部叙事动作和次级闪烁；只靠星点闪烁会被感知为“没有光效”。
- 项目验收需要覆盖共享消费场景、典型用户名、桌面/窄桌面/竖屏、reduced-motion、点击穿透、预加载、CSS 合同、库存基线、系统设计文档和 `npm run check`。
- 当前工作区的达妮娅 PNG 与对应系统设计段落属于既有未提交 WIP，必须继续隔离。

## Assumptions (Temporary)

- Skill 附带确定性校验脚本、参考合同与模板；纯文档不足以保证重复执行质量。
- Skill 只负责用户名铭牌工作流，不自动修改成就条件、数据库奖励或后台配置，除非后续请求明确包含这些工作。
- 图片生成仍使用宿主的图像生成能力；Skill 提供提示词结构、四版选择门槛和资产后处理规范，不绑定单一图像服务。

## Open Questions

- None.

## Requirements (Evolving)

- Skill 固定放在项目内 `.agents/skills/create-character-nameplate/`，随 SigrikaGo 仓库版本化，不安装为个人全局 Skill。
- Skill 同时支持 `new`（全新角色铭牌）与 `refine`（已有铭牌重设计/返修）两种模式；根据仓库中是否已有资产 ID、图片和 owner 自动判断，并允许用户明确覆盖。
- `refine` 模式必须先诊断问题属于位图内部裁切、祖先/CSS 裁切、文字安全区、动效层次、级联覆盖或消费场景差异，再选择修复路径。
- `refine` 模式若用户已明确锁定现有/附件画稿且只要求技术修复，可跳过四版探索；涉及视觉方向重做时仍必须走四版人工选择门。
- 默认范围是角色视觉、位图资产、专属动效和前端接入；只有用户请求明确包含新成就或新奖励时，Skill 才允许进入 seed、奖励资产元数据与数据层接线步骤。
- 输入至少包括角色标识、角色档案来源、成就/奖励语义、资产 ID 与目标图片 URL；缺失的仓库事实由工作流自行检查。
- 固定阶段为：现状审计 → 角色研究 → 视觉语言卡 → 四版构图探索 → 用户选择 → 透明成品加工 → Alpha/安全区校验 → 资产专属 CSS 动效 → 组件/预加载/合同接入 → 浏览器 QA → 全量检查与安全提交。
- 四版概念图之后设置强制人工选择门；未收到用户明确选版或修改意见时必须停止，不得自行挑选、加工正式资产或接入代码。
- 每个角色必须形成独立的视觉语言和动效语言，禁止复用同一套通用霓虹、扫光或粒子皮肤。
- 先在最终运行尺寸评估设计，再决定是否接入；未获用户选定的概念图不得进入正式资产路径。
- 必须保留常驻可见主光，闪烁仅作次级强调；持续动画只使用 `transform` 和 `opacity`，并提供 reduced-motion 静态降级。
- 提供确定性脚本检查 PNG 尺寸、色彩模式、Alpha 边界和安全边距，并输出机器可读结果供测试/验收使用。
- 提供可复制的专属 CSS owner、motion、测试断言、视觉 QA 清单和系统设计更新模板。
- 提供仅开发态使用的本地铭牌预览台；同一页并排展示合法英文名、4 个中日韩字符、历史超长名、称号＋独立徽章组合，以及 desktop、compact、phone 缩放。
- 预览台不得进入生产导航或业务路由；由 Skill 在当前 Trellis 任务目录生成临时 Vite harness，并可由 Playwright 截取正常动效与 reduced-motion 两组证据。
- 工作流必须先识别并隔离已有脏工作区内容，不得把其他角色 WIP 混入提交。

## Acceptance Criteria (Evolving)

- [x] 下一次给出另一角色、档案链接、成就语义和资产 ID 时，Codex 能自动触发并按阶段执行该工作流。
- [x] 工作流在正式接入前固定产出四个明显不同且符合角色的视觉方向供选择。
- [x] 校验脚本能拒绝错误尺寸、无 Alpha、主体贴边和安全区不足的资产，并对合格资产返回成功。
- [x] 模板覆盖资产专属 CSS 隔离、常驻光/局部动作/次级闪烁、reduced-motion 和 pointer-events 合同。
- [x] 验收清单覆盖用户名组合、共享消费场景和 `1440x900`、`1024x768`、`375x812`。
- [x] 本地预览台能够在不登录、不修改生产路由的情况下渲染指定资产，并生成正常动效与 reduced-motion 证据截图。
- [x] Skill 通过官方 skill validator；脚本具备自动测试并在代表性素材上实跑通过。
- [x] 项目文档与 `docs/system-design.html` 同步，`npm run check` 通过。

## Definition of Done

- Skill、脚本、参考合同、模板和测试全部落盘并可被后续任务直接调用。
- 完成至少一次不修改正式资产的干跑/前向验证，证明工作流能对新角色产出完整计划和校验结果。
- 更新相关 Trellis 规范和系统设计；安全提交时排除达妮娅既有 WIP。

## Out of Scope

- 本任务不制作或接入新的正式角色铭牌。
- 不新增数据库特效字段、通用特效预设编辑器或后台可视化动效编辑器。
- 不改变现有西格莉卡铭牌视觉。
- 不自动发布、推送或修改生产数据。

## Technical Notes

- 共享结构：`src/shared/UserIdentity.jsx`。
- 资产 owner 示例：`src/styles/hud-components/user-identity/semantic-ignition-nameplate.css`。
- motion 示例：`src/styles/hud-components/user-identity/semantic-ignition-motion.css`。
- 图片裁切工具：`scripts/pngTrim.mjs`；新工作流校验应补足 Alpha 四边与用户名安全区合同。
- 经验来源：`.trellis/tasks/archive/2026-07/07-16-username-background-v2/`、`07-16-widen-semantic-nameplate/`、`07-17-refine-sigrika-nameplate-motion/`。
- 仓库已有开发期 Vite harness 先例：`scripts/export-skill-gifs.mjs` 从 Trellis 任务目录挂载真实组件并用 Playwright 捕获，不需要把工具页接入生产 `AppRoutes`。

## Technical Approach

- 用官方 `skill-creator` 初始化 `.agents/skills/create-character-nameplate/`，包含精简 `SKILL.md`、`agents/openai.yaml`、`scripts/`、`references/` 和 `assets/preview-harness/`。
- `SKILL.md` 负责编排阶段、输入合同、两种模式、人工作业门和调用边界；详细角色视觉卡、提示词模板、CSS owner/motion 合同、QA 矩阵放进一级 references，避免每次触发加载全部内容。
- 确定性图片校验脚本读取 PNG 元数据与 Alpha 通道，验证目标尺寸/比例、RGBA、四角透明、四边最小安全边距和用户名安全区；脚本返回非零退出码并输出 JSON 诊断。
- 预览 harness 复用真实 `UserIdentity` 和 CSS 入口，在任务目录内生成，不注册生产路由；Playwright 负责固定视口、动画阶段和 reduced-motion 证据。
- 截图脚本优先使用 Playwright Chromium；未安装其浏览器包时回退到本机 Chrome/Edge，避免把额外浏览器下载变成每次工作流的前置条件。
- 模板通过占位符约束资产 ID、CSS owner、关键帧前缀、运行时尺寸、文本 padding、代表物坐标和用户名安全区，避免复制西格莉卡语义或选择器。
- 项目合同测试验证 Skill 结构、validator、脚本正反例、预览 harness 不进入生产路由，以及系统设计/规范同步。

## Decision (ADR-lite, Evolving)

**Context**: 工作流依赖 SigrikaGo 的组件结构、CSS 层级、资产 ID、测试和文档合同，跨项目复用价值低于随仓库同步的可靠性。

**Decision**: 创建项目内 `.agents/skills/create-character-nameplate/` Skill，并把确定性校验与模板资源一并纳入版本控制。

**Consequences**: 在本项目内可自动发现并保持规则同步；其他仓库若需要类似能力，应基于自身结构单独适配，而不是直接依赖本 Skill。

**Human gate**: 四版概念探索属于必须人工确认的阶段边界；Codex 不得以自动评分替代用户选择。

**Supported modes**: 同一 Skill 同时覆盖全新制作和已有铭牌返修，避免把本轮验证过的诊断经验丢在一次性任务中。

**Data boundary**: 发奖逻辑是显式可选层，不由视觉工作流默认推断或改写。

**Preview boundary**: 预览能力通过任务目录下的开发 harness 提供，不新增线上入口；真实消费场景复核仍保留为最终验收步骤。

## Research References

- [`research/workflow-architecture.md`](research/workflow-architecture.md) — 将本轮迭代经验映射为 Skill、确定性校验、模板和开发态预览 harness。
