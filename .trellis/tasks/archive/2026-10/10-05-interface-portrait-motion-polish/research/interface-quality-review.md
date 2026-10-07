# Independent profile and motion quality review

Reviewed 2026-10-05 against the active PRD, curated check context, frontend CSS/component/quality contracts, identity-bust contract, and implementation notes. This review preserves the pre-existing character-selection/BGM work and trusts the separate bust/preload review rather than duplicating it.

## Findings fixed

### Equipped self identities overlapped their actions on phones

- File: `src/styles/themes/bright-school/quality-base/profile-dossier/action-controls.css`.
- Issue: The new flow-layout action row applied only to plain names. An equipped nameplate, especially with title/badge, retained absolute achievement/personalization buttons. Actual full-CSS capture measured approximately 571 square pixels of nameplate/control intersection per button at 320/360px and 219 at 390px.
- Fix: Apply the same self-profile mobile identity/action grid to equipped identities. The change removes only the plain-identity selector condition; no nameplate ratio, scale, portrait dimension, header, social layout or control hit area changes.
- Exact review CSS delta: **-40 normalized bytes**, zero new files, important declarations, colors or media families.
- Regression: `interface-polish.spec.js` covers 36 real self/social cases at 320/390/1440px, normal/four-CJK and legal wide Latin names, plain/equipped identities, with/without title and badge. It asserts action clearance and the existing 3.75:1 equipped slot ratio. All three matrix tests pass.

The first stronger portrait-box assertion was rejected after visual inspection: the semantic nameplate contains wide transparent margins whose box overlaps a portrait by about 3px at 320px, while the painted image/text remains separated. That is not a visual defect and did not justify changing the established crop or nameplate geometry. See `quality-review/self-320-bare.png`.

### Quick nested social actions moved with the parent's entrance

- Files: `src/modals/UserProfileCard.jsx`, `UserProfileCard.dom.test.jsx`, `tests/e2e/interface-polish.spec.js`.
- Issue: Report and blacklist confirmation backdrops were DOM descendants of the entering profile. Its independent translate/scale components created a fixed containing block until entry ended. A real warm mount followed by a click at about 65ms reproduced the problem even though the profile was already 88–90% opaque. The desktop backdrop began at x131/y57 with width1288 rather than1440; the phone backdrop began at x67/y49 with width308 rather than390. The nested window jumped into viewport coordinates when the parent settled. Settled-only checks missed this failure.
- Fix: Portal both nested backdrops to the existing app-shell/body target, matching other ordinary nested dialogs. Preserve immediate input, theme ancestry, callback guards, local Escape, parent lifetime and trigger-focus restoration. No timing delay or new stylesheet was added.
- DOM regression: Both nested actions, with a theme shell and with body fallback, render outside the animated parent; Escape retains the parent and restores its trigger without invoking the parent close callback.
- Browser regression: Verify normal/reduced motion on desktop and 390px; pause the actual parent entrance at65ms to hold its containing-block state, open each nested action, and assert a full viewport backdrop, retained theme ancestry and local Escape/focus behavior. Separate unpaused checks verify released transform components, viewport positioning and Tab/Shift+Tab wrapping after entry.
- Actual before/after evidence: `quality-review/fast-nested-before.json` and `fast-nested-after.json`. After the repair the early backdrop is x0/y0 with exact viewport dimensions while the parent is still scaled at109–115ms.

## Other contracts checked

- Ordinary lift selectors target enabled actions under fine hover; static dossier/leaderboard/friend rows and artwork stages are absent from the new blanket owner. Native disabled, ARIA-disabled and busy states have explicit guards. Independent translate preserves authored artwork rotation.
- Paint/selected geometry remains separate from hover movement in the late theme guard. Bookmark/room-tab, gameplay, cinematic and corrupted-scene owners retain their explicit boundaries.
- Ordinary desktop/mobile entries use individual translate/scale and backwards fill, with local reduced-motion bypasses. The real settled profile computed translate/scale `none`; nested report retains its authored positional centering matrix.
- Full-CSS plain/equipped real-component captures at 1440/320/360/390/412px have no document overflow or name/action clipping. The new action row preserves the original nameplate geometry. Existing profile-agent evidence covers all50 normal/ASCII/wide/legacy/empty record cases, tooltip bounds and last-row reachability; this review does not duplicate that matrix.
- Existing modal DOM tests verify initial focus, trapping and opener restoration. Real report/blacklist browser checks verify forward/backward wrapping, Escape affecting only the nested dialog and restoration to the actual action button.
- Shared portrait geometry and failure/preload semantics are delegated to the already completed independent bust review. No resolver, asset, preload, import map or inventory changes were made here.
- Source style contracts enforce final import order, concrete-file6000-byte limits, selected-state boundaries and absence of broad resets. No generated template/update touch point exists for these component-level changes.

## Verification

- `npm run lint`: passed after portal/test changes and parent registration of UserProfileCard source/DOM files in the maintained lint boundary.
- Profile/modal DOM checks after portal repair: **2 suites /20 tests passed**, including all17 UserProfileCard tests.
- Browser equipment/action clearance: **3 tests /36 cases passed**.
- Browser settled and early/reduced nested behavior: **2 tests passed** (both desktop and phone, both actions; early test also reduced motion).
- Broader focused profile/style gate: **154/155 tests passed** at10:39 after portal regressions were added. The only failure was the aggregate CSS byte registry while concurrent social/motion work was still being consolidated (actual1,610,835 versus registered1,610,461). Parent owns exact metrics; this review does not raise that budget independently. Import order, breakpoint/high-z/reduced-motion registry,6000-byte guard and all other focused contracts passed. A final registry-only rerun is pending the shared CSS freeze.
- TypeCheck: no standalone TypeScript/type-check command exists in this JavaScript project; parent owns production compilation and built-CSS verification.

One first browser rerun was interrupted by a Vite HMR navigation after the source edit; the unchanged rerun passed. The permanent early-motion regression does not depend on lucky wall-clock navigation timing.

## Documentation handoff

Root owns synchronous system-design/spec updates and aggregate inventory. Document that mobile self actions reserve a separate row for both plain and equipped identities, and that nested social windows use an app-shell/body portal so quick actions cannot inherit the parent entrance's fixed containing block. Preserve immediate input and independent focus/dismissal contracts. Total review CSS change is -40 bytes; the portal/tests add no CSS metrics.

No additional confirmed production issue remains in this review scope. Final aggregate CSS registry/build/browser gates remain with the parent integration.
