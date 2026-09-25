# Capture challenge validation

## Passed

- 270 tests across 23 affected suites: authoritative actions, skills, bot automation, socket validation, routes, SQLite persistence, snapshot restore, room close/save, normal practice regression, picker/leaderboard/result UI, CSS contracts, migration history and generated docs.
- ESLint; production build; built CSS contracts; 18 portrait assets; admin default snapshot consistency; generated system-design HTML.
- Actual SQLite persistence tests use disposable temporary databases; no user data is modified by test fixtures.
- Fresh migration deployment and existing baseline adoption both passed the repository migration verifier. The running local service locks the normal generated Prisma engine DLL, so generation was redirected to an isolated output directory for this verification; migration SQL and schema checks use the real project files. The standard `npm run verify:migrations` invocation hits that Windows EPERM lock.
- Headless Chrome rendering at 1440x900 and 390x844 for the real picker, leaderboard and result components. No document horizontal overflow. Server fixture ranks show 1, 2, 2, 4; the pinned row uses the record character. Result text and red breakthrough notice remain visible on portrait mobile.
- Visual artifacts: `.codex-run/capture-challenge/{desktop,phone}-{entry,leaderboard,result}.png`. These use fixture leaderboard responses, not a live 100-move GNU Go session.

## Existing full-suite failures preserved

`npm run check` initially reported 9 failures / 2610 tests. The 5 feature-related generated-doc/schema/projection/control/CSS expectations were corrected and rechecked. Four unrelated UI assertions remain in three files:

- `src/modals/HouseModal.test.js`: resume action order and mobile handbook background assertion.
- `src/modals/ShopModal.test.js`: broad mobile CSS negative-width assertion.
- `src/room/RoomScreen.test.js`: desktop header grid assertion.

Their implementation/test WIP predates this task and was not changed to make the broad gate green. After fixes, rerunning the nine previously failing suites produced 201 passes and only these four failures. Full-check remaining build/asset/doc gates were run separately.

## Design-hook review

The scanner flagged existing literal colors across shared result/leaderboard files and existing test fixtures. Those are outside this feature and were preserved. New breakthrough text uses the explicit DESIGN.md danger palette (`#c0182d`), checked in the browser as rgb(192, 24, 45). No suppression rules or design-sidecar updates were added. The small CSS delta is registered in the inventory; the 6000-byte owner-file limit still passes.

## Delivery state

Implemented on the existing `codex/mobile-battle-polish` checkout. Unrelated WIP is preserved. No deployment, user database reset, or commit has been performed. See `commit-plan.md` for the proposed scoped commit.

## 追加四项调整验证

- 首次成功挑战（含零提子）记录 breakthrough=true；之后仍按历史最好名次严格提升判断。和棋按钮禁用且服务端申请/响应均拒绝。
- 7 个相关测试文件共 117 项通过，包含 SQLite 首次/重复/并列名次、和棋边界和 CSS 合约。
- npm run lint、npm run build、npm run check:built-css 通过；系统设计 HTML 已重新生成。
- 浏览器实际渲染验证：1440×900、390×844、360×640，空榜/单条榜四书签无裁切，印章及 reduced-motion 通过。坐标开启前后均 rgb(255,251,242)，位移 (2px,2px)，阴影从 3px 降到 1px。
- 已目视复核手机空榜和印章截图；代码仍保留工作区，未提交。
