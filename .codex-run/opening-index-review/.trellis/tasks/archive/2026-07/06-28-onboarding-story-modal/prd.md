# 新手引导剧情弹窗需求

## Goal

给刚注册并第一次登录的用户展示一个可后台配置的剧情演出式新手引导弹窗。弹窗内使用立绘、文字和选项组成“文字小剧场”，剧情由后台管理维护，用户在某些节点选择后会进入不同分支。

## What I Already Know

- 触发对象是“刚注册第一次登录”的用户。
- 新手引导以弹窗呈现，不是独立页面。
- 弹窗体验偏剧情演出：立绘 + 文字对话 + 可选分支。
- 剧情文本由项目维护者编写，但需要后台管理可编辑。
- 示例分支：询问“你会下围棋吗？”，用户选择“会 / 不会”，后续对话不同。
- AGENTS 要求：前端问题同时考虑移动端和桌面端；涉及架构、运行行为、接口、数据模型、资源体系、主题样式等更新时同步更新系统设计文档并生成 HTML。
- 用户同意使用 browser visual companion 来辅助对齐弹窗布局和视觉演出方向。
- 现有前端弹窗集中在 `src/app/AppOverlays.jsx` 与 `src/app/overlayRegistry.js` 管理；新手引导应作为同类 overlay 接入，避免和公告、邮箱、设置、对局结果等弹窗的关闭顺序冲突。
- 登录/注册成功路径在 `server/authRoutes.js` 与 `src/app/useAccountActions.js`；注册会直接返回登录态，前端随后进入 preload/home。
- 现有 `User` 模型没有 onboarding 完成字段或独立完成记录。
- 公告管理已有草稿、发布、取消发布、软删除、预览和审计模式，可作为后台可编辑运营内容的参考。
- 角色/立绘资源已通过角色目录和 `portraitUrl` 进入后台管理，第一版可优先选择已有角色立绘。

## Assumptions

- 这是一个跨前后端功能：需要前端弹窗播放器、后台编辑页、后端接口和持久化模型。
- 自动触达状态需要按用户记录，避免每次登录重复展示。
- 立绘资源应复用现有角色/资源体系，或通过后台选择已存在资源，而不是第一版就做完整资产上传流程。
- 剧情脚本应有“已发布版本”的概念，避免后台编辑草稿时影响正在给新用户展示的正式脚本。

## Open Questions

- None currently blocking. User confirmation of this PRD is required before implementation.

## Requirements (Evolving)

- 第一次登录用户自动看到新手引导剧情弹窗。
- 剧情由多个节点组成，节点支持对话文本、说话人、立绘展示和下一步跳转。
- 节点可配置选项，选项会跳转到不同后续节点。
- 后台管理可以编辑剧情内容。
- 需要同时适配移动端和桌面端。
- 引导弹窗应接入现有 overlay 关闭/返回键体系。
- 后台剧情内容应支持草稿与发布，发布版本供玩家端读取。
- 剧情弹窗 MVP 采用经典视觉小说式基准，但不使用左右分栏；整体从上到下分布，并以文字阅读区为主体：顶部只保留小尺寸立绘/说话人氛围区，中部大面积对话文本区，底部继续/选项操作区。
- 对话正文使用打字机效果逐字显示。用户点击文字区时，如果当前节点文字仍在播放，则立即中断打字机效果并显示该节点全部文字。
- 有选项的节点只在当前节点文字完整显示后再展示选项；点击文字区补全文字后，选项才出现。
- 用户可以跳过整个新手引导，但需要二次确认；由于首次自动展示已经记录为已触达，确认跳过后只关闭弹窗，后续登录不再自动弹出。
- 用户完成或跳过后仍可手动回看新手引导：在大厅右上工具栏按钮组新增“引导”按钮；移动端同步加入当前首页折叠菜单。
- 首次自动弹出的时机是注册/登录成功、资源预加载完成并进入大厅后；不在预加载前弹出。
- 后台剧情编辑器第一版采用节点表单编辑器，不要求管理员直接编辑 JSON。
- 每个剧情节点第一版只支持基础字段：节点 ID、说话人、立绘角色、正文、下一节点、选项列表；暂不做表情状态或复杂演出指令。
- 用户选择只影响当前剧情播放会话的分支跳转；第一版不把选项写入长期用户画像，也不保存完整选择路径。
- 自动触达状态按用户一次性记录：新注册用户首次自动弹窗成功展示后，即视为已触达，后续登录不再自动弹出；后台发布新版引导也不自动重置老用户触达状态。看完、跳过、刷新或关闭浏览器后，都只能通过大厅右上“引导”按钮手动回看。
- 首次自动新手引导在大厅弹窗中拥有最高优先级，应优先显示，而不是因为公告、邮箱、设置等其它大厅弹窗状态存在就静默跳过。
- 首次自动引导打开前关闭其它大厅 overlay，确保新手引导独占显示；关闭后用户可重新打开公告、邮箱等功能。
- 如果后台没有已发布的新手引导脚本，新注册/未完成用户进入大厅时不弹窗、不标记完成；以后发布脚本后，仍未完成的用户可看到。
- 后台脚本管理第一版只支持全站一个新手引导脚本；不做多脚本、多版本列表或条件触发。
- 后台编辑页需要提供内嵌预览播放，复用玩家端剧情播放器体验；预览不写用户完成状态。
- MVP 纳入发布前脚本结构校验：起始节点存在、节点 ID 唯一、`nextNodeId` 和选项目标节点存在、至少有一个结束节点。
- 自动弹出只针对该功能上线后新注册的用户；既有老用户默认不自动弹出，但仍可通过大厅右上“引导”按钮手动回看。

## Decisions

- 视觉形态选择 A：经典视觉小说式，改为上中下纵向布局，且文字区最大、立绘偏小。理由：功能目标更接近可读的新手剧情引导，不是角色展示页面；移动端可读性优先，同时保留角色存在感。
- 文本播放方式选择打字机效果；点击文字区会跳过当前打字动画并补全当前节点全文。
- 选项显示时机：节点文字完整显示后才出现，避免用户没读完就误选。
- 跳过策略：允许跳过但二次确认；跳过和正常看完都写入完成状态。
- 回看入口：在大厅右上工具栏按钮组放置“引导”按钮，而不是放在设置内；移动端放入 `HomeHeader` 的 mobile menu。
- 自动触发时机：进入大厅后弹出，背景为大厅界面。
- 后台编辑方式：节点表单编辑器。管理员通过字段维护节点 ID、说话人、立绘、正文、下一节点与选项。
- 节点字段范围：MVP 只做基础字段，不做角色表情、镜头、音效或时间轴配置。
- 选择记录策略：选项只驱动本次剧情分支，不持久化选择内容。
- 自动触达状态粒度：按用户记录一次“已自动展示”，不按脚本版本重复触发，也不要求用户必须看完才停止自动弹出。
- 自动弹窗优先级：首次自动引导优先于其它大厅 overlay。
- 独占显示策略：自动打开引导前调用现有 overlay 关闭逻辑清理其它大厅弹窗，避免遮罩/返回键堆叠。
- 空配置行为：没有发布脚本时静默不弹窗，不使用代码内置默认剧情。
- 脚本数量：全站单一脚本，后台维护一个草稿/发布状态。
- 后台预览：编辑草稿后可在后台内嵌播放器预览打字机、继续和选项分支，预览过程不影响真实玩家完成状态。
- MVP 边界校验：只要求发布前阻止明显坏脚本；不要求第一版做复杂错误定位或玩家端上报。
- 自动触发人群：新注册用户进入大厅后如仍处于待引导状态且存在已发布脚本，则自动弹出；老用户默认不进入待引导状态。

## Acceptance Criteria (Evolving)

- [ ] 新注册用户首次登录进入大厅后会看到剧情引导弹窗。
- [ ] 新注册用户首次自动引导弹窗成功展示后，再次登录不会自动弹出，即使用户未看完。
- [ ] 已触达、看完或跳过引导的用户仍可通过大厅右上“引导”按钮手动回看。
- [ ] 剧情节点可按后台配置展示文字、立绘和选项。
- [ ] 用户选择不同选项会进入不同分支。
- [ ] 后台编辑后的已发布剧情能被前端读取。
- [ ] 后台可通过节点表单编辑草稿、预览、发布；发布前校验起始节点、节点 ID、跳转目标和结束节点。
- [ ] 移动端和桌面端布局均可读、可操作，不遮挡关键控件。
- [ ] 系统设计文档同步记录运行行为、接口、数据模型和主题/资源约束，并生成 `docs/system-design.html`。

## Definition of Done

- Tests added/updated where appropriate.
- Lint/typecheck/build pass through project checks relevant to this task.
- System design docs updated and `npm run docs:system-design` executed.
- Rollout/rollback for published onboarding script considered.

## Technical Approach

- Data model: add a singleton onboarding script/config model for draft/published JSON nodes, plus a per-user automatic-touch state or equivalent user field so only new accounts created after the feature enters the flow are auto-targeted.
- Backend: add authenticated player endpoints to fetch the published onboarding script and mark automatic touch; add admin endpoints to read/update/preview/publish the singleton script with structural validation.
- Frontend player: add an `OnboardingStoryModal` overlay registered with the existing overlay registry and dismissal order; add a `useOnboardingStory`-style hook to fetch eligibility after the home view is active, close other home overlays, mark automatic touch when shown, and open the modal.
- Frontend admin: add an admin tab for onboarding script editing with node form rows, option editing, publish validation, and an embedded preview that reuses the player story renderer without writing user state.
- UI/styling: add desktop and mobile styles for the vertical text-first modal, with small portrait/speaker area, large text area, bottom actions/options, typewriter skip-on-text-click, reduced-motion handling, and Bright School-compatible theme coverage.
- Docs: update `docs/system-design.md` or the relevant `docs/system-design/` chapters for runtime behavior, data model, admin workflow, overlay priority, and theme/mobile constraints; run `npm run docs:system-design`.

## Out of Scope (Evolving)

- 第一版暂不假设需要可视化拖拽剧情编辑器。
- 第一版暂不假设需要多语言剧情。
- 第一版暂不假设需要复杂动画时间轴编辑器。
- 第一版不做立绘表情/状态配置。
- 第一版不做节点级镜头、抖动、音效等演出指令。
- 第一版不做用户选项画像、路径分析或后台选择统计。
- 第一版不做多个新手引导脚本或按用户条件触发。
- 第一版不做复杂后台错误定位或玩家端脚本错误上报；发布前结构校验是主要防线。

## Technical Notes

- Current task directory: `.trellis/tasks/06-28-onboarding-story-modal`.
- Project uses React/Vite on the client, Express/Prisma on the server, and existing modal/admin styling domains.
- Repository has many unrelated dirty files at session start; this task should avoid touching unrelated work.
- Relevant frontend files inspected: `src/app/App.jsx`, `src/app/AppRoutes.jsx`, `src/app/AppOverlays.jsx`, `src/app/overlayRegistry.js`, `src/app/useOverlayState.js`, `src/app/useAccountActions.js`, `src/admin/AdminConsole.jsx`, `src/admin/AdminShell.jsx`, `src/admin/AdminAnnouncements.jsx`, `src/api/client.js`.
- Relevant backend/data files inspected: `server/index.js`, `server/authRoutes.js`, `server/auth.js`, `server/announcementRoutes.js`, `server/announcements.js`, `prisma/schema.prisma`.
