# 移动端窗口滚动修复提交清单

## Proposed commit

`fix(ui): prevent mobile modal scroll-through`

- `src/app/App.jsx` — 仅应用壳 ref 和公共滚动 hook 接入。
- `src/app/useModalScrollLock.js`
- `src/app/useModalScrollLock.dom.test.jsx`
- `src/styles/mobile-adaptive/leaderboard-podium.css` — 仅为名单建立局部定位容器。
- `tests/e2e/fixtures/modal-scroll.html`
- `tests/e2e/fixtures/modal-scroll.jsx`
- `tests/e2e/modal-scroll.config.js`
- `tests/e2e/modal-scroll.spec.js`
- `.trellis/spec/frontend/hook-guidelines.md` — 移动端窗口滚动契约。
- `.trellis/spec/frontend/window-title-stickers.md` — 名单定位容器及固定区触摸回归契约。
- `docs/system-design/06-ui-theme-mobile.md` — 本次滚动隔离说明。
- `docs/system-design.md` — **仅**「2026-10-22 移动端窗口滚动隔离」及「2026-10-23 排行榜固定区上滑修复」新段落。
- `docs/system-design.html` — **仅**本次摘要和分篇对应生成内容。
- `eslint.config.js` — **仅**本次 hook / 测试的三条维护路径。
- `.trellis/tasks/10-22-mobile-window-scroll-lock/` — 当前任务 PRD、研究、验证和提交清单。

共享文件通过局部暂存保留其他工作；不整文件吸收既有 WIP。不推送远端。按当前项目流程在验证后提交。

## Unrecognized changes excluded

- `.trellis/spec/backend/profile-folder-contract.md`
- `.trellis/spec/frontend/css-architecture.md`
- `.trellis/spec/frontend/quality-guidelines.md`
- `docs/design-samples/aemeath-voyage-2026-10-19/index.html`
- `docs/system-design.md` / `docs/system-design.html` 的其它段落
- `eslint.config.js` 的其它维护路径
- `server/achievements.js`
- `server/achievements.test.js`
- `src/app/AppOverlays.dom.test.jsx`
- `src/app/AppOverlays.jsx`
- `src/app/useHomeUserRefresh.js`
- `src/app/useToastQueue.js`
- `src/app/profileFeatures.dom.test.jsx`
- `src/shared/profileFeatures.js`
- `src/modals/ProfilePlayRecords.dom.test.jsx`
- `src/modals/ProfilePlayRecords.jsx`
- `src/modals/ResumeModal.dom.test.jsx`
- `src/modals/ResumeModal.jsx`
- `src/styles/base/surfaces-forms-actions.css`
- `src/styles/mobile-adaptive/profile-folder-mobile.css`
- `src/styles/mobile-adaptive/profile-folder-summary.css`
- `src/styles/mobile-adaptive/profile-paper-cards.css`
- `src/styles/mobile-adaptive/profile-paper-mobile.css`
- `tests/e2e/profile-paper.spec.js`
- `.trellis/tasks/10-22-information-paper-samples/`
- `docs/design-samples/aemeath-live-board-2026-10-19/`
- `docs/design-samples/information-paper-2026-10-22/`
- `docs/design-samples/profile-surfaces-2026-10-20/`
- `docs/promo/`

其它会话后续新增的文件同样默认排除。
