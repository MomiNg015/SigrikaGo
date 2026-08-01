# 重制角色详情音乐播放器收音机样式

## Goal

参考用户提供的三张“星炬学院收音机”截图，用 GPT Image 2 生成一张可直接用于游戏 UI 的手绘长条收音机素材，并把角色详情页现有紧凑音乐播放器改造成同一视觉语言，同时保留现有播放、暂停、加载、错误重试、选曲和无障碍交互。

## What I Already Know

- 参考物是横向长条、圆角浅色机壳，主体为深墨绿色面板，左侧有圆形扬声器/控制区，中部和右侧有浅绿色波形显示窗。
- 用户明确要求使用 `gpt-image-2` 生成手绘风素材，并用于修改现有“角色详情—音乐播放器”样式。
- 用户否决第一版候选：材质、光影和细小网孔过于写实；正式素材需要更明确的二维手绘游戏道具感。
- 用户要求本次同时解决播放/暂停键状态切换和播放器内标题滚动问题，而不是只替换静态皮肤。
- 当前播放器由 `src/audio/CharacterMusicPreview.jsx` 渲染；共享回退仍为桌面约 `188 × 46px`、手机竖屏约 `164 × 46px`，Bright School 最终收音机 owner 使用桌面 `230 × 50px`、手机 `min(210px, 58vw) × 50px`。
- Bright School 当前只给播放器一个透明外壳、32px 内嵌硬件键和一条 Rough.js 标题下划线；本任务将替换这套既有视觉合同。
- 新素材应只负责外壳、材质和显示窗，不在位图中烘焙曲名、播放图标或必须可读的文字；交互信息继续由 HTML/CSS 叠加，以支持动态曲名和状态。
- 生成环境为 `gpt-image-2` Mode B：使用宿主原生图像生成工具。
- 用户视觉验收发现初版运行时资产被后处理从原始约 `5.6:1` 强制压到约 `4.1:1`，并且边缘缺少安全留白；最终 `920 × 200` PNG 保持机身原始比例、四周透明留白并通过 `contain` 渲染。
- 用户要求撤回后续 `280 × 61px` 放大版本；最终高度固定回 `50px`，但继续保留透明背景和播放键对圆圈的定位修复。
- 用户截图确认中央曲名裁切边界曾进入右侧波形窗；最终桌面右侧保留 `62px`、竖屏保留 `58px`，文字与滚动动画不得进入波形区域。

## Confirmed Scope

- 收音机皮肤只应用于 Bright School 玩家主题；其他主题继续使用共享播放器外观。
- 本次重做闭合播放器，不重画打开后的曲目选择纸页。
- 保留现有紧凑布局和至少 44px 播放触控目标，避免角色详情标题区重新排版。

## Requirements (Evolving)

- 根据三张参考图生成独立原创的手绘长条收音机 PNG，保留识别特征但不复制背景、人物或截图噪点。
- 风格采用简化结构、平涂色块、可见笔触和略不规整的手绘描边；禁止产品摄影式高光、金属写实材质、密集扬声器网孔和 3D 渲染质感。
- 素材采用透明背景、正面平视、横向构图，并为左侧播放键和中右部动态曲名显示保留明确可用区域。
- 生成结果需要落入 `public/assets/` 下的稳定运行时路径，不从临时目录或提示词目录加载。
- Bright School 闭合播放器使用该素材作为主要外壳，DOM 播放键、曲名和展开箭头保持真实可交互元素。
- 播放、暂停、加载、错误、禁用、hover、focus-visible、active 状态必须可辨认且不引起布局位移。
- 播放键按 `播放 → 加载 → 暂停 → 播放` 正确切换；各图标共用同一固定几何中心，不得在切换时跳动或落出左侧圆形控制区。
- 长曲名只在中央浅绿显示窗的裁切区域内滚动，不得覆盖右侧波形窗或溢出机壳；短标题静止，减少动态偏好继续禁用自动滚动并保留手动横向访问。
- 桌面与手机竖屏同时适配；手机触控目标不得小于 44px。
- 曲目选择纸页、音频调度、保存与重试逻辑不回归。
- 同步更新 `docs/system-design.md`、相关系统设计分篇、生成后的 `docs/system-design.html`，并更新现有播放器视觉合同测试/规范。

## Acceptance Criteria (Evolving)

- [x] 生成并接入一张透明背景的手绘星炬学院收音机运行时素材。
- [ ] Bright School 角色详情闭合播放器明显呈现参考图的浅色圆角机壳、深绿面板、左侧圆形控制区和浅绿波形窗语言。
- [ ] 动态曲名、播放/暂停/加载/错误状态不依赖位图文字，且清晰可读。
- [x] 播放、加载、暂停、恢复播放的图标和可访问标签按真实状态同步切换，视觉中心不移动。
- [x] 超长标题在中央显示窗内滚动且被正确裁切，短标题不滚动，右侧波形窗始终不被文字覆盖。
- [ ] 播放器在桌面与手机竖屏中不挤压角色名、不越界，播放按钮仍满足 44px 触控目标。
- [ ] 曲目单打开、切槽、选曲、保存回滚、Escape 与键盘导航保持现状。
- [ ] 相关组件、样式合同、主题合同、构建及系统设计文档生成通过。

## Definition of Done

- GPT Image 2 素材生成、筛选、裁切/透明度验证和运行时接入完成。
- 组件/CSS、测试、Trellis 规范与系统设计文档同步完成。
- 用户在实际角色详情页完成视觉验收；Codex 不重复运行浏览器视觉检查。
- 运行定向测试、lint、构建与 `npm run check:built-css`。

## Technical Approach

- 以参考图为结构依据，生成“纯素材而非 UI 截图”：单个正面长条收音机、透明背景、无人物/场景/可读品牌文字。
- 位图提供手绘机壳、面板、扬声器和波形窗；CSS 通过稳定背景图路径与定位变量让真实播放键、曲名和展开箭头落在对应区域。
- 优先复用现有 DOM 与交互状态，只在必要时新增装饰性、`aria-hidden` 的结构钩子；不改音频与选曲数据流。
- Bright School owner CSS 同时定义桌面和手机尺寸，保留共享组件作为其他主题的回退。

## Decision (ADR-lite)

**Context**: 将曲名和播放图标直接画进图片会与动态曲目、加载/错误状态和无障碍交互冲突；完全用 CSS 重画又无法达到用户要求的手绘资产质感。

**Decision**: 使用 GPT Image 2 生成无文字的手绘收音机外壳，把动态信息与交互控件继续作为 DOM/CSS 叠加。

**Consequences**: 视觉能贴近参考物，同时保持播放器逻辑、可访问性和主题回退；接入时需要精确校准素材透明边界与控件热点。

## Expansion Sweep

- Future evolution: 为皮肤路径和布局区域保留明确 CSS 变量，后续可替换更高分辨率版本，但本次不建设通用播放器皮肤系统。
- Related scenarios: 曲目选择纸页继续沿用现有 Bright School 纸张语言；其他主题不自动继承星炬学院收音机。
- Failure/edge cases: 素材加载失败时现有真实控件仍可操作；超长曲名使用测量式跑马灯，并在距离不大于 1px 时拒绝启动动画；减少动态偏好继续禁用自动滚动/旋转。

## Out of Scope

- 修改音频播放调度、对局预加载、技能音乐槽位或服务端选曲接口；仅把新收音机图片加入现有登录关键图片清单。
- 重做曲目选择纸页、角色详情其余区域或非 Bright School 主题。
- 在位图中加入真实曲名、播放/暂停图标或可点击热点。
- 建设可由后台配置的播放器皮肤系统。

## Technical Notes

- Component: `src/audio/CharacterMusicPreview.jsx`
- Shared shell: `src/styles/modals/character-music-player/shell-title.css`
- Bright School owner: `src/styles/themes/bright-school/component-repairs/character-music-player/player-shell.css`
- Portrait mobile owner: `src/styles/themes/bright-school/mobile/house-profile/character-detail-music.css`
- Tests/contracts: `src/audio/CharacterMusicPreview*.test.jsx`, `src/modals/HouseModal.test.js`, `src/styles/styleContract.test.js`, `src/styles/themeContract.test.js`
- Current project contract: `.trellis/spec/frontend/quality-guidelines.md` “Character Detail BGM Preview Interaction Contract”
