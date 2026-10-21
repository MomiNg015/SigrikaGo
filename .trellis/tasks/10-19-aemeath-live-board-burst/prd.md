# 远航星：真实对弈棋盘与全屏爆发样板

## Goal

重新制作爱弥斯「远航星」演出样板，直接复用现有对弈界面与真实棋盘组件。剑插入当前棋盘后，以全屏能量爆发表现重量和冲击，不另画透视棋盘，不照搬参考视频的机位。

## Confirmed requirements

- 用户否定上一版的独立透视棋盘；演出必须能放在现有对弈界面里判断效果。
- 保留现有棋盘角度、布局和周围对局界面。参考视频的重点是感觉，尤其是剑插稳后冲满全屏的爆发。
- 剑继续采用抽象光剑，除非能够几乎完整复刻隧者原剑；不做半写实自创机械剑。
- 继续包含现有技能横幅、变身、施法语音和远航星 BGM，完整播放用于判断音乐卡点。
- 用户要求用 grill-me 完善需求：每次一个关键问题，推荐选项优先，能由代码确认的内容不问用户。
- 本轮仍交付样板；正式接入尚未纳入范围。
- 用户已选择爆发方案 A：剑插稳、短暂蓄力，能量从落点冲出棋盘；爆发峰值短暂吞没整个对弈界面，盖住棋盘和双方立绘，随后余波退去。
- 因选项 A 已包含动作顺序，落剑 → 插稳蓄力 → 全屏爆发不再重复询问；具体时长根据原 BGM 卡点在样板中调试。
- 用户已选择收尾方案 A：光剑随全屏爆发消散；强光退去后重新露出真实棋盘，仅留下短暂衰减的裂痕、碎屑和余波，随后恢复对局。

## Questions to resolve in order

No blocking questions remain. Proceed with the confirmed two-stage strike and burst, using the original music and actual RoomScreen. Concrete timing is adjustable in the sample.

## Repo findings

- `src/room/RoomScreen.jsx` 负责实际房间布局与现有 SkillBanner；真实场景应从这里的组件构成出发。
- `src/room/Board.jsx` 在 `.board` 内渲染真实线条、点位、棋子与 `BoardSkillEffects`。样板需复用该棋盘，不能用 Canvas 重绘另一张棋盘作为底景。
- `src/room/BoardSkillEffects.jsx` 当前按 host 尺寸初始化 Pixi，负责独立 cast 生命周期。全屏爆发要区分棋盘定位与视口覆盖两个坐标空间，不能只把棋盘内波纹放大。
- 旧样板 `docs/design-samples/aemeath-voyage-2026-10-19/` 可复用音频运输与调参思路，不能沿用其替代棋盘和透视镜头。
- 正式时序仍是 3200 ms 横幅、1800 ms 棋盘特效、4136 ms 权威结算。样板时序与正式集成边界应明确记录。

## Acceptance (evolving)

- [ ] 用真实对弈布局、棋盘、棋子、双方信息展示完整样板。
- [ ] 用户能明显看出剑插入棋盘后爆发冲到全屏，而非只有棋盘内粒子与圈纹。
- [ ] 完整播放含原横幅、变身、语音和 BGM，可复查卡点。
- [ ] 按确认的节奏、遮挡强度和残留方式完成演出。
- [ ] 桌面与手机竖屏、重播、取消、减少动态效果正常。
- [ ] 更新系统设计说明与 HTML，完成对应验证。

## Current phase

Visual revision required: user rejected the second sample as low quality after viewing it. Technical playback, correct board reuse and passing tests are not visual acceptance. The line cracks, flat polygon debris and radial-gradient flash remain below the requested game-cinematic quality. Do not commit or archive this iteration as complete.

Next: establish a high-quality impact target frame over the real battle screenshot before continuing motion implementation. Preserve confirmed staging (pinned lightblade → short charge → full-screen burst → blade disappears → brief aftermath). Improve volumetric energy, textured fracture/debris, pressure-front layering and near/far motion. A generated target frame is concept evidence, not a claim that the browser animation already achieves it.

Generated `docs/design-samples/aemeath-live-board-2026-10-19/impact-direction-v3.png` for concrete visual calibration; prompt and limitations are recorded alongside it. The frame has dimensional splintered debris, turbulent energy and close-lens motion. It generatively alters some UI/portrait details, which must not be carried into implementation. Await visual-direction feedback before another costly implementation pass.
