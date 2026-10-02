# 导出爱弥斯技能黑幕GIF

## Goal

导出爱弥斯一段技能“小爱出击”（`hidden-hand`）和二段派生技能“远航星”（`voyage-star`）的黑幕 GIF，方便不进对局也能预览技能演出动画。

## What I Already Know

* 用户需要两个 GIF：爱弥斯一段技能演出动画、二段技能演出动画。
* “黑幕 GIF”理解为黑色背景，只呈现技能演出本身，避免棋盘、房间 UI、玩家信息干扰。
* 一段技能使用 `effectType: "hidden-hand"`，演出由 `src/room/boardSkillEffectRegistry.js` 中的 `playDataStreamHiddenHand` 渲染。
* 二段技能使用 `effectType: "voyage-star"`，演出由 `playVoyageStar` 渲染。
* `src/shared/skillPresentation.js` 规定了时间线：`hidden-hand` 棋盘特效为 1500ms，默认棋盘特效为 1800ms。
* 当前项目已有 Playwright/Vite/Pixi 依赖，可以通过浏览器实际渲染并录制帧，而不是重写动画。

## Requirements

* 输出两个可直接查看的 GIF 文件。
* GIF 背景为黑色，不包含对局 UI。
* 动画必须复用项目现有技能演出渲染代码和时间线，保持与实战表现一致；不得复制一份相似但独立的动画逻辑。
* 二段 `voyage-star` 需要提供代表性的目标点和移除点数据，保证白剑、白屏和粒子演出可见。
* 输出路径应放在 `outputs/` 下，避免混入应用静态资源和生产构建。

## Acceptance Criteria

* [ ] 生成 `hidden-hand` 黑幕 GIF。
* [ ] 生成 `voyage-star` 黑幕 GIF。
* [ ] 两个 GIF 均能在本机打开并看到非空动画帧。
* [ ] 录制入口直接挂载实战使用的 `BoardSkillEffects` 路径或其现有 renderer，不使用手写替代动画。
* [ ] 导出过程不需要进入真实对局。
* [ ] 不破坏现有项目测试和构建配置。

## Definition of Done

* GIF 文件已生成并位于明确输出目录。
* 如新增可复用导出脚本或临时预览入口，代码通过相应验证。
* 若改动了架构、运行行为或资源体系，同步更新 `docs/system-design.md` 并运行 `npm run docs:system-design`；若仅生成一次性输出且不改系统设计，则不强行扩写系统设计。

## Out of Scope

* 不调整技能演出视觉设计。
* 不调整技能音效或 BGM。
* 不新增对局内 UI 功能。
* 不把 GIF 纳入生产资源预加载。

## Technical Approach

推荐方案：创建一个本地导出 harness 或脚本，通过 Vite/Playwright 在黑色画布中挂载现有 Pixi renderer，录制两段技能动画帧并编码为 GIF。这样输出接近实战效果，同时不会依赖真实房间状态。

## Technical Notes

* 相关文件：`src/room/boardSkillEffectRegistry.js`
* 相关文件：`src/room/BoardSkillEffects.jsx`
* 相关文件：`src/shared/skillPresentation.js`
* 相关文件：`package.json`
* 当前工作树已有大量未提交改动，实施时应只触碰本任务相关文件和输出。
