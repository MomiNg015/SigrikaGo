# Practice window follow-up (2026-10-27)

User requested a square close button and desktop-like mobile Sigrika bust framing with no crown clipping. The corruption branch remains closed.

- Browser evidence from actual HomeScreen and complete styles: shared sticker control won height 36px while local flex basis forced width 44px. Removing the local fixed basis restores the shared 36px square.
- A late typography layer reduced the mobile mask to 138px; the global image max-width clamped the nominal 148px image to 138px. The unchanged -14px top inset cut into visible crown pixels, and the 158px mask exposed the body instead of a bust.
- The dialogue owner now retains desktop 240:218 mask geometry and a proportional image/top inset. Phone widths scale 154–240px; source alpha bounds leave headroom, bubble/tail stay left of the portrait and short screens scroll. Removed the competing portrait geometry from the typography owner. No added CSS files, important declarations or colors.
- Impeccable hook review: the unchanged 12px mode-tool radius belongs to the existing approved practice window, outside this corrective scope. The flagged 2px top/right borders are the rotated speech-bubble tail, not a card side stripe. Both retained intentionally; no suppressions added.
- Initial browser assertions failed on subpixel transition values. Final geometry checks use reduced-motion rendering and a 0.1px comparison tolerance, without modifying production animation.
- Lint passed. Six targeted suites / 145 tests passed. Production build, built-CSS checks and system-design HTML generation passed. Browser regression covers 1440, 768, 390, 360 and 320px; all three mode states, alpha-bound crown, bust ratio, bottom edge, no text overlap, scrolling and click/Escape close.
- Other active work appeared during verification in App/HomeScreen/onboarding/shop files. It is preserved and excluded from this fix's staging.
- Final browser rerun: 5/5 passed, including full portrait visibility after short-screen scrolling. Scoped commit `726803e1` contains only this fix, its browser coverage and documentation; mixed system-design entries were staged separately and HTML regenerated from the exact staged source set.
