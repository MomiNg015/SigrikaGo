# Interface Audit Evidence

## Scope and baseline

Reviewed PRODUCT.md/DESIGN.md, actual player component screenshots at 1440x900, 390x844 and 360x640, interaction/style owners, and isolated full-application routes. The initial full Vitest baseline passed: 414 files and 2986 tests. Pre-existing working-tree modifications belong to unrelated character-selection and background-audio work and are preserved.

## Main findings

- Profile geometry and portrait presentation had independent owners: normalized square chibi images left the identity art small; swapping a URL alone cannot create a readable bust. Reuse existing standard sprite landmarks and a nested proportional compositor.
- Shared self/social profiles had three separate equal-weight blocks for rank, record and recent results. Make rank/record a coherent desktop summary and recent results a restrained full-width strip, with mobile retaining natural scroll and full-width summaries.
- Mobile plain usernames inherit padded name-tag styling which consumes the narrow identity track. Reduce plain-name padding locally, while leaving equipped nameplate scaling/asset effects intact.
- Hero art/costume framing was repeatedly neutralized by legacy direct-image normalization. Put proportional placement or costume scale on an inner artwork compositor and keep badges outside the clipping mask.
- Home's general max-width rule clamps nested artwork, defeating a larger bust crop. The new compositor requires a precisely scoped max-width override.
- Static table/data rows inherited sticker lift and tilt, implying clickability. Motion belongs to enabled controls and meaningful selection/feedback instead.
- Phone window transform keyframes can lose to final theme transform resets. Use the existing desktop individual translate/scale strategy and provide scoped reduced-motion equivalents.
- Modal/static content remains visible by default. Window entrance must not introduce JavaScript wait states or delay click handling.

## Evidence corrections

The first isolated social-profile fixture omitted its real caller's backdrop, producing artificial title clipping and x=0 geometry. After matching the production `.modal-backdrop.profile-modal-backdrop`, the 390px shell was x=64,y=46 with the sticker safely above it and no document overflow. No production fix was made for this fixture error.

First-pass screenshot capture decoded only the first bust, so the lower participant could be captured before its image loaded. Decode all relevant images when judging composition; exercise cold-loading separately. The actual lower player renders after decoding.

The disappearing replay during an early screenshot was isolated to Chrome's immediate full-page capture: its transient 1×1 viewport correctly triggered DesktopViewportGate and unmounted the window. Fixed-viewport captures or fully settled full-page captures preserve the dialog. This was independently reproduced; no production viewport-gate repair was warranted. Final verification uses stable sources and isolated test data.

## Later actual-state findings

- Bare and decorated equipped nameplates required the same separate mobile action row as ordinary names. The reviewer removed the unnecessary plain-only condition and added browser overlap/ratio coverage. A ~3px transparent box intersection with the portrait had no painted overlap and did not justify another geometry change.
- Admin styles load after route navigation and overwrite earlier global single-column rules. At390px the main pane was reduced to roughly100px. Restore responsiveness in the actual admin shell owner, use a native horizontal navigation rail and a remaining-height main scroller, and reset only that scroller on selected-page changes. All21 mobile management routes were exercised with isolated read data; checkbox width/alignment and inline-label interaction passed.
- The official costume fixture now uses actual percentage framing fields and checks inner scale1.1/translate4%-3%; ignored prototype property names were not a valid authored-framing test.

## Evidence locations

- `.tmp/interface-polish/before/`: initial component captures.
- `.tmp/interface-polish/round-one/`: first profile/portrait composition and per-character captures.
- `.tmp/interface-polish/live/`: broad player-window and admin screen captures from isolated data; refresh after stable implementation before relying on data completeness.
- Production-component fixture: `tests/e2e/fixtures/interface-polish.html`.
- Isolated real-application journey: `tests/e2e/interface-review-live.spec.js`.
