# 提交清单（仅本地提交，不推送）

一个功能提交：`feat: 准时宝和吃子挑战赛改用浏览器本地引擎`，包含开发模式静态模块加载修复及双模式浏览器回归。

## 本次代码与验证文件

```text
.gitattributes
deploy/nginx/sigrikago-routes.conf
eslint.config.js
package.json
public/engines/gnugo-3.8/
scripts/build-practice-wasm.py
scripts/verify-practice-wasm.mjs
scripts/deploymentConfig.test.js
server/index.js
server/localPracticeEngine.js
server/localPracticeEngine.test.js
server/practiceBotDecision.js
server/practiceBotEngine.js
server/practiceRoomAutomation.js
server/practiceRoomAutomation.test.js
server/roomClockLifecycle.js
server/roomClockLifecycle.test.js
server/roomFactory.js
server/roomView.js
server/roomView.test.js
server/rooms.js
server/securityHeaders.js
server/securityHeaders.test.js
server/socketEvents.js
server/socketEvents.test.js
server/socketGuards.js
server/socketPracticeEvents.js
server/socketPracticeEvents.test.js
src/app/useGameSocketConnection.js
src/app/useMatchActions.js
src/app/useMatchActions.test.js
src/practice/
src/shared/localPractice.js
src/shared/practiceBotDecision.js
src/shared/practiceBotPosition.js
tests/e2e/local-practice.config.js
tests/e2e/local-practice.spec.js
tests/e2e/fixtures/local-practice.html
tests/e2e/fixtures/local-practice.js
tests/e2e/fixtures/local-practice-server.mjs
.trellis/spec/backend/index.md
.trellis/spec/backend/practice-room-contract.md
.trellis/spec/backend/local-practice-engine-contract.md
.trellis/tasks/09-26-practice-local-engine/
```

## 同文件混合改动，必须按本次内容暂存

- `docs/system-design.md`：只取新增本地陪练摘要。
- `docs/system-design/03-backend-realtime-api.md`：只取本地引擎协议及生命周期段落。
- `docs/system-design.html`：用“上述已暂存文档 + HEAD 的其他分篇”单独生成暂存版本，保持未提交文档工作区完整，不能整文件吞入其它工作。

## 排除的原有工作

```text
.trellis/spec/frontend/css-architecture.md
.trellis/spec/frontend/quality-guidelines.md
.trellis/tasks/09-25-profile-empty-rainbow-candy/
docs/system-design/06-ui-theme-mobile.md
server/items.js
server/items.test.js
src/modals/ProfileMobileLayout.test.js
src/modals/ProfileResumeView.dom.test.jsx
src/modals/ProfileResumeView.jsx
src/modals/WarehouseModal.test.js
src/modals/warehouse/useWarehouseInventory.js
src/modals/warehouse/useWarehouseInventory.dom.test.jsx
src/styles/mobile-adaptive/window-bookmark-mobile.css
src/styles/mobile-adaptive/window-sticker-resume-header.css
.codex-run/
```

全量检查尚有 8 项范围外失败，详见 `research/validation.md`；本次 125 项针对性测试通过。提交前重新检查工作树和暂存 diff；不自动部署或推送。
