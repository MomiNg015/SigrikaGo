# 验证记录

- 交互／履历／弹窗定向测试：4 文件、17 项通过。
- 完整 npm run check 的测试阶段：475 文件、3452 项；首次结果 3451 通过、1 失败。唯一失败是旧 CSS reducedMotionFiles 仍要求 message-feedback.css 含媒体查询，而动效与 reduced-motion 已迁至 unavailableFeedback.js。
- 修复上述清单后，CSS 清单、样式契约及 Board 回归：3 文件、135 项全部通过。没有重复运行整套 8 分钟测试；其余全量项此前已通过。
- 浏览器：5 项通过。真实 ResumeModal / ActionBar + 完整样式下验证 1440、390、320px；后台专用音效标记、键盘与触摸；减少动态效果不位移；预解码实际 AudioBuffer 音效每次按下一次，无普通确认音叠加；禁用业务回调均为 0。
- npm run lint：新增维护文件匹配后唯一测试夹具角色静态误判已通过组件变量修正，并定向 lint 通过。
- check:portraits、check:admin-snapshot -- --isolated、build、check:built-css、生产配置检查、docs:system-design 均通过。构建仍有既有大 chunk 警告。
- 提交前重跑交互／履历／弹窗定向测试：4 文件、17 项全部通过。当前工作区包含既有无关修改，按用户授权及 commit-plan.md 仅提交本轮片段。

浏览器复验命令：`npx playwright test --config tests/e2e/disabled-feedback.config.js`。
