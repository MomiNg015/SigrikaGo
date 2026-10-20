# Top-left toast exploration

The user selected the clean paper drawer and LXGW Marker Gothic for all toast copy. This direction is now integrated into production. Open `production.html` through the dev server to inspect the actual component with the complete application stylesheet; the original three-direction comparison remains as design history.

Open `http://127.0.0.1:5173/docs/design-samples/toast-top-left-2026-10-20/` while `npm run dev:client` is running. Optional `?variant=drawer`, `?variant=memo` and `?variant=character` select a direction directly.

## Three directions

| Direction | Visual purpose | Tradeoff |
| --- | --- | --- |
| Clean paper drawer | Compact everyday feedback, quiet outlined icon and left-aligned copy | Least distinctive |
| Club memo | Layered paper, tape, rules and a status stamp fit the campus stationery theme | More vertical space |
| Character message | Current Sigrika avatar accompanies a small paper message | More attention and art dependency; best for mail/rewards |

All three use the same sample text and background. The classroom is existing project artwork; the game shell is representative context, not a production screen. State examples are local sample content. The page makes no account requests, stores no data, and is not imported by production.

## Interaction

- Default hold mode supports uninterrupted visual comparison. Play clears hold and demonstrates 280ms entry, 3800ms dwell (6400ms for long copy), and 220ms withdrawal to the left.
- Both directions use transform and opacity; text does not scale. Reduced motion replaces translation with a 100ms fade and follows the system preference.
- Hover and keyboard focus pause the lifetime. The bottom line shows remaining time. A visible close button and an all-dismiss action are available.
- Preview stack is capped at three. Desktop, 390px and 320px previews use the same actual-size card, with wrapping instead of scaling. The complete page also adapts to native portrait widths.
- Keys 1 / 2 / 3 select variants; Space replays when focus is outside interactive controls.
- The comparison retains its exploration timing. Production now uses the selected upper-left drawer with LXGW title/body, 2600ms hold and 400ms withdrawal, a five-message newest-first queue, manual close and hover/focus pause. Its public message API is unchanged.

## Assets and design review

- Title font: existing `LXGWMarkerGothic-Regular.ttf`, under the production `Sigrika Window Title` name. Body text uses the documented Microsoft YaHei UI fallback family.
- Existing classroom: `/assets/home/multipurpose-classroom-bg.webp`.
- Existing complete-head portrait: `/assets/characters/handbook-chibi-sprites/sigrika-avatar.webp`.
- Design-hook review: the temporary `School` font alias was replaced by the documented family and the pill radius aligned to 999px. Variant numbers are deliberate comparison/keyboard identifiers, not section decoration. Remaining local paper shades, semantic tints and differing paper corner shapes are intentional sample exploration; they do not add global design tokens or suppress audit rules. These should be reconciled with production tokens if a direction is selected.

## Initial exploration verification (before selection)

- Headless Microsoft Edge / Playwright: 57 checks passed across three variants, all message types, close/all-dismiss, automatic withdrawal, hover/focus pause and resume, system reduced motion, asset loading, desktop and 390/320px native portrait layouts.
- No page errors or failed resources. Long copy fits the card and the page has no horizontal overflow at the tested portrait widths.
- Visual review: desktop variants and 320/390px long-copy screenshots retained here. `comparison.png` is a static comparison; the index page demonstrates motion.
- JavaScript syntax check, scoped ESLint, system-design generation and `git diff --check` passed. No production source changed, so the full application suite was not rerun for this sample-only delivery.

## Production verification

`FeedbackModals.dom.test.jsx` covers Strict Mode, original lifetime, callback replacement, combined hover/focus pause, manual dismissal and unmount cleanup. The production preview loads the full theme to verify actual font selection, semantic colors, close-button chrome and portrait wrapping. The exact CSS growth is recorded in `cssLayerInventory.js`; no new global stylesheet or font asset is introduced.

Browser checks passed at 1440px desktop and native 390/320px portrait: the loaded title/body font is `Sigrika Window Title` (LXGW asset), the close control is transparent and borderless, long copy wraps, and both side gutters remain within the viewport. Desktop and portrait reduced-motion checks preserve the 2.6s pausable progress line without translation. Manual exit moves left and removes the node; an untouched notification removes itself after three seconds. Full-theme screenshots use the `production-` prefix.

The full test run completed with 3287 passing tests and one generated-document mismatch; regeneration and the 35-test focused rerun passed. Lint, portrait checks, production build, built-CSS checks and production config validation passed. The aggregate gate cannot be marked green because `check:admin-snapshot` reports pre-existing local `characters` configuration drift; the snapshot/exporter/catalog were not changed or regenerated by this task.
