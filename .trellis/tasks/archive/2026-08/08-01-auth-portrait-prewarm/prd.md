# 登录页预热加载角色立绘

## Goal

在登录表单保持立即可见、立即可操作的前提下，利用用户填写和提交登录信息期间的空闲时间预热加载页所需的基础角色立绘，降低首次登录后加载页出现空白立绘或临时重新请求未计入清单角色立绘的概率。

## What I Already Know

- 当前登录页只有一张约 140 KiB 的登录吉祥物图片，不需要增加新的登录前加载页。
- `AssetPreloadScreen` 会从整个角色目录随机选择展示角色；被选中的未拥有角色立绘会由 `<img>` 自行请求，但不一定属于登录后的可访问资源进度清单。
- 当前内置基础角色立绘合计约 3.17 MiB，因此不得以高并发或阻塞方式一次性抢占登录接口带宽。
- 新用户初始拥有西格莉卡和丹雅；这两张立绘应作为登录页预热顺序的最高优先级。
- 用户已确认采用“登录页后台预热、登录不等待、加载页优先选择已就绪角色”的方案。

## Requirements

- 登录页挂载后立即开始基础角色立绘的后台预热。
- 预热顺序首先为西格莉卡、丹雅，随后才是其余可用于共享加载页展示的基础角色。
- 预热必须是非阻塞的：登录按钮、登录请求和成功回调不得等待全部或任一立绘完成。
- 预热使用有界低并发，避免同时请求全部约 3.17 MiB 的基础角色立绘。
- 预热完成状态应在登录页与后续 `AssetPreloadScreen` 之间共享，并按真实图片加载/解码完成记录，而不是只按请求已发出记录。
- `AssetPreloadScreen` 在存在已预热角色时，只从已就绪角色中随机选择展示立绘；没有已就绪角色时保留现有安全回退行为，不阻塞页面。
- 加载页的 10 秒角色轮换同样应优先限制在已就绪池，避免后续轮换重新引入空白立绘。
- 登录成功后的现有账号级资源清单、进度统计、失败跳过和后台重试逻辑保持不变。
- 登录页预热只覆盖基础角色展示立绘，不预热服装立绘、糖果特效立绘、角色音频、技能资源或商店资源。
- Baconbits 继续遵守共享加载页现有的展示排除规则。
- 资源预热行为变化需要同步更新 `docs/system-design.md` 与 `docs/system-design/05-assets-audio-preload.md`，并重新生成 `docs/system-design.html`。

## Acceptance Criteria

- [x] 打开登录页时，西格莉卡与丹雅的基础角色立绘最先开始预热，其他可展示角色随后以低并发预热。
- [x] 立绘预热不会禁用登录表单、延迟认证请求或延迟成功后的 `onAuth` 调用。
- [x] 已有至少一个预热完成角色时，登录后加载页首张及后续随机轮换不会选择未完成预热的角色。
- [x] 尚无任何预热完成角色时，共享加载页仍能使用现有角色/占位回退，不抛错、不阻塞登录。
- [x] 服装、糖果特效、音频及其他非基础角色立绘不进入登录页预热清单。
- [x] 现有登录后正式资源预加载和匹配后对局预加载行为不回归。
- [x] 新增或更新单元/DOM 测试覆盖优先级、低并发启动、就绪池过滤、失败回退和登录不等待。
- [x] 相关定向测试、lint、构建和系统设计文档生成通过。

## Validation

- 定向测试：6 个测试文件、66 项测试通过。
- 全量测试：331 个测试文件、2307 项测试通过。
- `npm run lint`、`npm run build`、`npm run check:built-css`、`npm run docs:system-design` 通过。
- `npm run check` 仅在与本任务无关的既有 `siteSettings` 后台快照过期检查处停止；本任务未修改后台默认快照来源，因此未生成或纳入该快照变更。

## Definition of Done

- 实现、测试与文档同步完成。
- `npm run docs:system-design` 生成最新 `docs/system-design.html`。
- 运行与风险相称的定向测试、lint 和构建；最终执行 Trellis 质量检查。
- 不纳入或覆盖与本任务无关的工作区改动。

## Technical Approach

- 新增一个小型、模块级的认证页角色立绘预热协调器，负责：候选排序、低并发图片加载/解码、就绪源记录、重复调用去重和只读快照查询。
- `AuthScreen` 在挂载 effect 中触发协调器，但不 `await` 其完成；卸载时不需要破坏浏览器已经进入缓存的请求结果。
- `AssetPreloadScreen` 的候选构造读取协调器的已就绪源快照：只要快照非空，就过滤到相应角色；快照为空时复用原有候选集合。
- 复用现有角色目录和 `resolveCharacterPortraitPresentation`/基础 portrait URL 约定，不引入新的资源类型或额外 UI。

## Decision (ADR-lite)

**Context**: 完整预热全部角色能够减少加载页立绘空白，但会在未认证用户阶段抢占约 3.17 MiB 带宽；只依赖加载页 `<img>` 又无法保证首张立绘已经解码完成。

**Decision**: 登录页采用西格莉卡、丹雅优先的低并发后台预热，并让加载页在已有就绪资源时只从就绪池选角。认证和界面切换不等待预热。

**Consequences**: 大多数真实登录路径会在认证完成前获得至少一张可立即显示的立绘；极快登录或弱网下仍可能走原有回退，但不会为了装饰资源延迟认证。其余角色会逐步进入就绪池，保留加载页的随机变化。

## Expansion Decisions

- Future evolution: 协调器保留按 catalog 生成候选的接口，后续可接入服务端新增角色，但本任务不新增远程预认证角色目录请求。
- Related scenarios: 共享 `AssetPreloadScreen` 的教程/匹配固定角色路径保持不变，本任务只影响无固定角色的随机展示。
- Failure/edge cases: 单张图片失败时继续预热其他候选；就绪池为空时保留原回退；重复挂载登录页不得重复创建同一批并发请求。

## Out of Scope

- 新增登录前加载页或启动动画。
- 修改登录页视觉、布局、文案或表单验证。
- 登录前加载服装、糖果特效、音频、技能、商店或对局资源。
- 修改登录后正式资源清单和匹配后对局资源清单。
- 为预热进度新增用户可见 UI。

## Technical Notes

- Primary files: `src/auth/AuthScreen.jsx`, `src/app/AssetPreloadScreen.jsx`, a new focused preload coordinator under `src/app/` or `src/shared/`, and their tests.
- Existing image loader: `src/shared/preloadAssets.js` exposes `preloadImageAssets`, but it reports only aggregate completion/skips; the new coordination layer needs per-source ready tracking and deduplication.
- Character sources: `src/shared/characters.js`, `src/shared/characterPortraitAssetCatalog.js`.
- Documentation contract: `docs/system-design.md`, `docs/system-design/05-assets-audio-preload.md`, generated `docs/system-design.html`.
