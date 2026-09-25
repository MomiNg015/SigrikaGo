# Match mode expansion interaction sample

## Scope
The user approved the sample and authorized production integration. Preserve all existing colors and card interior styling. Keep Zhunshibao practice visible and clickable throughout the transition and expanded state.

## Known requirements
- Selecting Spark lifts its card beneath the window title.
- Standard and Gomoku slide left out of the window.
- Three child cards descend from beneath Spark: 常规匹配, 吃子挑战赛, 队际赛.
- Preserve Bright School identity and support portrait mobile.

## Approved behavior
- Children form one vertical column on desktop and mobile, preserving the current full-width entry layout.
- Spark preserves its original card and interior styling; clicking it or 返回 reverses the transition.
- Regular match retains the existing Spark queue. Capture challenge retains the current Zhunshibao challenge flow. Team competition is disabled with 敬请期待.
- Keep the Zhunshibao practice shortcut on the parent; its other difficulties remain accessible.
- Rules buttons stay independent from mode selection. Preserve the existing Spark queue count on the parent and show the same count on the regular child.
- Entrance overlaps: siblings leave in 220ms, parent rises in 300ms, child cards descend with 45ms stagger after 120ms. Reduced motion changes state immediately.
- Reopening starts on the first level. Escape returns one level before closing. Special corrupted-Sigrika flow is excluded from this sample and must retain precedence in production.

## User approval
Follow-up: remove the background English watermark from all three child cards; keep parent card watermarks. Remove the duplicate capture-challenge option from the practice difficulty dialog, retaining the dedicated Spark child as its entry.
The user approved the animation and requested that practice remain visible during and after switching. Existing colors and card interiors must not change. Vertical children and existing single-player capture challenge are retained.

## Acceptance
- Clickable isolated sample supports enter/back/close/reopen and disabled future mode.
- Phone-width preview and reduced-motion behavior are included.
- Sample clicks only show an explicit preview result and never submit real matchmaking.
- Production integration is authorized. Preserve ordinary practice, rules, queue counts and corrupted-story flow. Add regression coverage for expansion without matchmaking, actual child actions, retained practice and return.

## Source evidence
- src/home/HomeScreen.jsx: MatchModePicker, independent rules buttons and Zhunshibao practice entry.
- src/shared/gameModes.js: three existing queue IDs.
- src/styles/modals/replay-mode-resume/match-mode-tabs.css: vertical full-width cards and practice overhang.

## Deliverable
- sample.html, with relative references to existing public/assets artwork; usable directly from disk or via a local server.

## Preview verification
- Production integration: 106 targeted tests passed, including retained practice access, child queue/challenge payloads, focus return, reopen reset, corruption lockout and CSS contracts. Lint, production build and built CSS checks passed. Browser QA used the actual HomeScreen and complete stylesheet stack on desktop and 390x844 portrait; practice remained accessible in the expanded layer on both.
- The design hook's color findings in styleContract.test.js concern pre-existing assertion strings, not new styling; intentionally unchanged because this task preserves colors.
- Final broad check: 2632 tests passed, 4 failed across RoomScreen.test.js, HouseModal.test.js and ShopModal.test.js, outside this change's component/CSS owner. These pre-existing review-area failures remain; production build and built CSS validation were run separately and passed. Implementation is left uncommitted with unrelated working-tree edits preserved.
- Browser checked at 1280x850 and 390x844: expanded cards fit, disabled Team entry is exposed correctly, challenge click produces a sample-only notice.
- Return and Escape restore first-level entries; close exposes the reopen control.
- Hidden entries use inert to avoid keyboard activation; reduced motion has an instant-transition CSS fallback.
- Hook color findings were resolved by reusing DESIGN.md palette values; no suppression added.
- Sample simplifies production rules tooltips, online counts and special-story states; these must be preserved during eventual integration.
- `npm run docs:system-design` passed. Broad `npm run check`: lint passed; Vitest reported 371 files / 2628 tests passed and 3 files / 4 tests failed, including ShopModal.test.js:728 CSS expectation. The existing heavily modified working tree is not globally green; this preview does not edit application code or those tests. Build stages were not reached.
