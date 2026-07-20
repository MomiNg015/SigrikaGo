# 修复铭牌段位图标并更新履历积分说明

## Goal

修复首页铭牌段位信息区的五子棋模式图标偶发缺失问题，并把履历积分问号提示改为当前动态积分规则的准确说明。

## Requirements

- 首页铭牌的星炬、标准、五子棋三枚模式图标在首次渲染时都应稳定可见，不依赖鼠标悬停、聚焦或点击触发重绘。
- 履历积分问号提示文本精确改为：`对局中获得的积分会根据对手的实力动态增减。友谊赛不会增减积分。`
- 保持现有铭牌布局、尺寸、悬停动效、段位数字和模式图标资源不变。
- 不改变积分结算、段位结算或友谊赛逻辑。
- 对局界面的房间成员列表不渲染已装备的用户名背景/铭牌，避免桌面端固定成员列为铭牌槽预留宽度后无法完整显示合法用户名；用户名、称号和徽章继续显示，主玩家条与成员详细资料不受影响。

## Acceptance Criteria

- [x] 首页铭牌三枚模式图标使用适合首屏关键资源的稳定解码策略，五子棋图标不再依赖交互后出现。
- [x] 组件回归测试覆盖三枚图标的加载/解码契约。
- [x] 履历积分提示展示用户指定的新文案，且测试锁定该文案。
- [x] 相关前端测试通过。
- [x] `npm run docs:system-design` 成功，生成文档与 Markdown 同步。
- [x] 房间成员即使装备用户名背景，成员列表行也只显示普通用户名且不包含铭牌背景层。

## Definition of Done

- 实现和回归测试完成。
- lint、相关测试与项目文档生成通过。
- `docs/system-design.md` 记录当前首屏铭牌资源与履历说明契约。
- 不吸收或覆盖工作区中既有的无关改动。

## Technical Approach

首页铭牌的三个模式图标是首屏关键 UI：从共享 `gameModes.js` 元数据派生资源 URL，纳入 `RUNTIME_IMAGE_ASSETS.home` 的登录阻塞预加载集合，避免重复维护资源常量；同时在 `PlayerPlaque` 中改为同步解码提示并保持默认立即加载，避免第三枚图标在首屏挂载后仍延迟绘制。使用 `preloadAssets.test.js` 和 `HomeScreen.test.jsx` 分别锁定预加载与 DOM 解码契约。履历文案在 `HouseProfileStats.jsx` 中精确替换，并在 `ResumeModal.dom.test.jsx` 中通过 tooltip 可访问内容断言提示文本。

## Decision (ADR-lite)

**Context**: 五子棋图标是同组第三枚图片，当前三枚图片都声明 `decoding="async"`，且模式图标没有进入现有 `RUNTIME_IMAGE_ASSETS.home` 关键预加载集合；交互触发父卡片 transform 重绘后图标出现，指向关键首屏图像的延迟加载/解码/绘制问题。

**Decision**: 复用现有登录关键资源通道预加载共享模式图标，并对三枚铭牌模式图标统一使用 `decoding="sync"`；不引入额外状态、独立预加载器或 CSS 合成层。

**Consequences**: 三个 31–52 KB 的本地 PNG 会在进入首页前完成请求，并在首屏 DOM 中按同步解码提示绘制；实现复用现有资源体系、可回滚且不改变视觉。若浏览器仍复现，可在后续单独评估资源格式或合成层，但不在本次扩大范围。

## Out of Scope

- 修改模式图标素材、尺寸或排列。
- 重做铭牌样式、悬停动效或移动端布局。
- 修改积分/段位算法和后台配置。
- 顺带处理工作区中其他未提交内容。

## Technical Notes

- 图标组件：`src/home/components/PlayerPlaque.jsx`
- 模式资源映射：`src/shared/gameModes.js`
- 首屏资源注册：`src/shared/assetRegistry.js`
- 铭牌样式 owner：`src/styles/themes/bright-school/home/student-id-card/mode-stats.css`
- 履历提示：`src/modals/house/HouseProfileStats.jsx`
- 回归测试：`src/home/HomeScreen.test.jsx`、`src/modals/ResumeModal.dom.test.jsx`
- 系统设计事实：`docs/system-design.md`
