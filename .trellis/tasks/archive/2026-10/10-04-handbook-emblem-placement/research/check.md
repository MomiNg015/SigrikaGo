# Independent review: enlarged faction emblem placement

## Result

No blocking findings in the current diff or the five requested captured states.

## Review evidence

- Reviewed task PRD/check context, the bounded paper owner, inventory/spec diff and unchanged frame/label owners. Production changes are confined to absolute emblem placement, size and quiet decorative opacity. Character JSX, ownership guards, faction mappings, sources, inputs, portrait helper and label geometry are unchanged.
- Desktop expanded square frame is `clamp(260px, 32dvh, 340px)` at top/right -30px. The existing tile's `clip-path` and `overflow: hidden` contain the intended crop. No document or strip layout dimensions change.
- Mobile resting/expanded masks are 160px/190px, vertically centered on the matching name zones at 50%/30%. The final opposite-side selector mirrors left/right placement after expanded declarations. Names retain their transparent background, foreground position and readable dark ink.
- Original-alpha compensation is retained. Expanded effective decorative opacity is .12 at each source's strongest mask pixels; even Huanglong's pre-mask element opacity is only `.12 * 5 = .6`, below clamping. `mask-size: contain`, `pointer-events: none` and the local reduced-motion branch remain intact.
- Fresh local screenshots inspected: `1440-1024-changli-expanded.png`, `1440-768-denia-expanded.png`, `390-844-rest.png`, `390-844-expanded.png`, `360-640-rest.png`. Desktop large emblems occupy the upper-right background and remain inside the slice; phone emblems sit quietly behind names with the permitted compact vertical crop. No filled text badge or face-obscuring foreground decoration appears.
- Read the freshly captured `metrics.json`: all four viewports have 10 strips, loaded portraits and zero horizontal overflow. Their partial-ownership states report zero locked emblem/name nodes and no captured browser errors.

## CSS inventory check

Independently measured LF-normalized UTF-8 sources: paper owner 2,108 bytes, previous 1,950 bytes, delta +158; all `src/styles` CSS files total 1,595,138 bytes across 713 files. These match the updated inventory. No new CSS file, important declaration, palette literal, breakpoint or stacking family is introduced.

## Verification limits

No production edits, tests or browser sessions were run by this reviewer. Root reported 163 focused DOM/CSS checks and five browser cases passing; this pass independently inspected source, captured images and metrics. Final lint/build, built CSS and documentation render are root-owned completion checks.
