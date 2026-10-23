# Bug Analysis: personal-rank footer moves the entire leaderboard

## 1. Root cause category

- D (test coverage gap) and E (implicit assumption).
- The root scroll lock worked: document, body and app-shell scroll positions did not change. The leaderboard backdrop itself had a 3361px scroll height at a 700px viewport. A swipe from the personal-rank label moved its scrollTop to roughly 327px, moving the window from y=46 to y=-281.
- `.lp-scroll` already computed `overflow: auto`, but was not positioned. Absolutely positioned accessibility labels (`.lp-row .lp-rate small`) used an outer containing block and escaped the scrollport's overflow ownership. Giving the existing list `position: relative` confined these descendants and removed the outer scroll range without changing window geometry.

## 2. Why the first fix missed it

- The initial browser fixture covered Settings and Confirm, not a long leaderboard with a fixed footer.
- The swipe helper added half the swipe distance to its starting position, which could start outside a short label. The corrected helper clamps the start inside the target rectangle.
- Tests asserted background position but did not assert each modal's own bounding box or backdrop scroll range. Genuine over-height backdrop scrolling remained intentionally permitted.

## 3. Prevention mechanisms

| Priority | Mechanism | Action | Status |
| --- | --- | --- | --- |
| P0 | CSS ownership | Position `.lp-scroll` so absolute descendants cannot enlarge the backdrop | Done |
| P0 | Browser regression | 40 real leaderboard rows, footer-origin native touch, fixed window y, zero extra backdrop overflow and last-row reachability | Done |
| P1 | Touch fixture | Clamp native touch origins to short target bounds | Done |
| P1 | Spec | Capture containing-block and backdrop range assertions in window-title-stickers.md | Done |

## 4. Systematic expansion

Keep real oversized-dialog scrolling available. Do not replace a descendant overflow fix with blanket overflow clipping on sticker/bookmark shells: that would cut off exterior art. Similar scroll surfaces should verify both their clipped content and the containing blocks of absolute descendants.

## 5. Knowledge capture

- Updated frontend window-title-stickers spec and system-design entry/chapter.
- Existing 6px radii flagged by the design hook are unchanged, pre-existing leaderboard art and unrelated to scroll ownership; classified as out-of-scope false positives, not suppressed.
- No generated spec-template directory exists in this application repository; no template sync applies.
