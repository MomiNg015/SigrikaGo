# Improve LXGW body text readability

## Accepted scope
The user approved reducing artificial boldness in ordinary prose, adding subtle 0.02-0.04em tracking and 1.6-1.7 line height to long descriptions. Preserve the current LXGW font, existing WuWa typography and all IRIS entry/window styles. Keep compact controls and layouts stable.

## Approach
Audit actual long-text owners and browser-computed styles. Apply regular weight and disable synthetic bold only to ordinary reading content, with targeted typography tokens. Do not blanket-reset headings, numeric displays, buttons, WuWa classes or IRIS. Verify dense Chinese glyphs and multiline wrapping early with production components before broad checks.

## Acceptance
- Long prose and complex Chinese glyphs render clearly at desktop and portrait sizes without artificial bold.
- Useful line/letter spacing wins over existing theme resets; labels/buttons do not become loose.
- Skill trait buttons and inline emphasis remain legible and interactive.
- No clipping or horizontal page overflow in representative 320/390px and desktop windows.
- Computed WuWa and IRIS typography unchanged before/after.
- Update design docs/specs, generated system-design HTML and relevant browser checks. Preserve unrelated WIP.

## Decisions
No further question needed: the preceding recommendation and explicit approval settle font/exception/scope decisions. Trellis inline mode; no subagents.

## Implementation and verification
- Added one final prose owner plus tracking/leading tokens; inline theme resets now inherit prose typography. Headings and compact controls retain their previous metrics.
- Real character-detail prose measured 700 -> 400 weight and 0.16px -> 0.4px tracking at 16px; mobile and desktop visual inspection confirms clearer glyphs. Full direct-text snapshots of IRIS and existing WuWa typography match their pre-change values.
- Three browser cases at 1440/390/320px pass: trait button/popover interaction, dense item text with independently scrollable details and reachable action, Markdown paragraphs/emphasis/list text and reachable last paragraph. Screenshots visually inspected.
- Focused style/theme/trait checks: 121 passed. Battle verification: 443 tests plus 4 document renderer tests passed. Lint, build and built-CSS contract passed.
- Skill-effect stability: all 4 desktop/mobile cases passed against the production build. Final inventory-only recheck: 20 passed.
- CSS budget uses the scoped commit's 1,730,763 normalized bytes (the working tree has 76 fewer bytes from unrelated dossier edits), 749 files and 403 important-bearing files. This task adds exactly 1,814 bytes and 7 important declarations; no colors/media/motion added.
- Design hook warnings in foundation tokens and palette test assertions are unchanged legacy color declarations; the new prose owner adds no design-rule violation. No suppressions or unrelated palette changes.
- System-design entry/chapter, generated HTML, DESIGN.md, design sidecar and frontend CSS contract synchronized. Unrelated dossier, feature flags, toast, design samples and their docs remain outside the scoped commit.
