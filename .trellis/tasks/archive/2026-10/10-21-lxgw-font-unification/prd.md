# Unify project typography with LXGW while preserving WuWa

## Request
Use the existing LXGW font throughout the project, except for all currently WuWa-rendered text, which must remain unchanged.
The user additionally excludes the entire IRIS window and its entry button; preserve both the Dotted Songti and mixed WuWa stacks, including current owner styling.

## Scope and acceptance
- Audit shared tokens, local CSS font families/shorthands, React inline styles and canvas/Pixi text before editing.
- Preserve existing WuWa faces, unicode ranges and semantic use sites; do not broaden or shrink where WuWa renders. Preserve every IRIS entry/window font and its original font variables.
- Use the bundled LXGW Marker Gothic asset for non-WuWa production UI, including player/admin, ordinary/special themes and canvas text where applicable.
- Keep sizing, weights, layout and behavior unchanged except where font metrics require a small overflow correction.
- Document any text baked into image assets or independent historical design samples rather than silently redrawing them.
- Verify actual rendered fonts and WuWa exceptions at desktop/portrait sizes, and update documentation/specs and relevant tests.

## Findings and validation
- Migrated 47 existing font owners, plus the initial HTML entry shell, to the bundled LXGW face. Preserved all 12 existing WuWa font declarations and all IRIS font tokens/faces.
- Real browser evidence found desktop IRIS RECORDS/STATUS labels inherit the generic UI stack; locally freeze the original fallback so the entire IRIS window stays unchanged.
- Registration was 5px taller after the font change (603px vs 598px): normal line-height increased each input/button by 1px. Explicit 1.25 line-height restores compact controls without changing font size, padding or gaps.
- Production text has no separate canvas/Pixi font assignment. Existing raster lettering and standalone historical prototypes remain unchanged.
- Design-hook findings: pre-existing legacy theme colors/radii and assertions are outside this font-only change; IRIS font exceptions and first-paint single-family typography are explicitly required by the user. Keep them unchanged; no suppression added. Updated DESIGN.md and its sidecar to the approved typography contract.
- Existing unrelated profile-feature, dossier, server, and sample work stays outside the commit. Mixed docs/specs are staged from HEAD plus only these documented substitutions.
- Validation in progress; focused styles/Home/IRIS 168 pass, battle gate 443 + docs 4 pass, production build and built-CSS pass. Full npm test encountered an unrelated devApiProxy timeout followed by ERR_IPC_CHANNEL_CLOSED; isolate the proxy test and report full-suite limitation rather than claiming complete success.

## Final verification
- Focused Home/styles/IRIS suite: 168 passed; after final guard/auth changes, 111 focused style/auth/IRIS tests passed.
- Battle verification: 443 tests plus 4 documentation tests passed. Skill-effects stability: 4 desktop/mobile Chromium tests passed.
- Browser: 24 window/auth/IRIS/battle typography cases passed across the initial run and focused fixes; all 5 new typography cases are green. Final actual-font/admin rerun passed with the real non-player admin wrapper. Six built first-entry cases passed.
- Screenshots reviewed: desktop and 320px registration, 390px warehouse, desktop IRIS and admin. No visible clipping introduced; registration remains below 600px desktop and 575px phone.
- Lint, production build, built-CSS checks, generated system-design docs and diff whitespace checks passed.
- Full npm test did not complete: existing development-proxy tests crossed their 5-second limit, then the worker channel closed. Isolated proxy rerun with a CLI-only 15-second timeout passed all 4; no proxy code or checked-in timeout was changed. This task does not claim a complete full-suite pass.
