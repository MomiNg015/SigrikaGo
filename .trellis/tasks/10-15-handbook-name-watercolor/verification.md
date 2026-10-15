# Verification

## Final scope correction

User rejected the footer. Removed the 64px height and portrait-stage subtraction. Four-character-or-longer names now align right within the original lower-right region. Regression checks assert the original board height and actual long-name/portrait clearance at four desktop sizes. Previous footer results below are historical, not the final implementation. Existing marker geometry is retained; design-hook radius warnings remain intentional artwork geometry.

## Overlap correction (supersedes initial layout findings below)

The prior inset assertion tested the requested CSS arithmetic, not actual clearance. It missed long-name/feet overlap and lower clothing/weapon silhouettes. Desktop now adds a shared 64px name footer while subtracting that height from portrait framing, retaining the original art size. Names center in the right-bottom text zone; mobile is unchanged. The inner text explicitly inherits the real LXGW font past the theme reset.

`handbook-name-clearance.spec.js` samples each loaded portrait's actual alpha pixels in the text/marker rectangle plus an 8px clearance. All ten names pass at 1440x1024, 1280x960, 1024x768 and 769x1024. Seven browser regressions pass including original portrait geometry and both mobile widths. 115 focused unit/DOM/style checks pass; lint, production build and built-CSS contracts pass. The screenshot script independently confirms actual LXGW font loading and captures the corrected Sigrika and Chisa cards.

Additional design-hook findings on the frame refer only to untouched mobile expansion animation and existing locked-portrait colors. The requested marker's custom rounded ends remain intentional artwork geometry. No suppression added.

## Implemented scope

- Existing desktop name owner only; actual LXGW Marker Gothic verified through Chrome `CSS.getPlatformFontsForNode`, not just computed font-family.
- 45px / 700 on a 1440px desktop; 36px minimum on narrower desktop. Theme-color marker underline is CSS only.
- All ten catalog names checked at 1440, 1024 and 769px. Narrow-desktop inset tapers to avoid the long Sigrika name overlapping her feet; final screenshots inspected.
- 390px and 360px mobile retain weight 400, original typography and the 24px / 1px ink underline. The pre-existing mobile expanded `top: 85%` WIP was preserved.
- Keyboard preview and reduced motion checked. No document overflow or page errors across these viewports.

## Evidence

Reproducible local QA script: `.codex-run/handbook-name-watercolor/verify.mjs`.
Results and screenshots: `.codex-run/handbook-name-watercolor/report.json`, `1440-desktop.png`, `1440-8-card.png`, `769-0-card.png`, `390-mobile.png`, `360-mobile.png`.

## Checks

- Lint passed.
- 184 checks passed across handbook components and style/theme contracts; three unrelated CSS inventory checks failed: existing important count 9934 exceeds 9930, `base/login-asset-preload.css` lacks registered reduced-motion coverage, and `match-mode-title-layout.css` has an unregistered 360px query. This change adds no important declarations, literal colors, new stylesheet, or unregistered breakpoint.
- Production build and built-CSS contracts passed. Build still reports two unresolved public-asset placeholders and the existing large-chunk advisory.
- System design HTML regenerated; scoped diff whitespace check passed.

## Design-hook review

The three color warnings refer to pre-existing missing-data styling, untouched by this task. The four custom radius values intentionally describe the user's rounded, slightly uneven watercolor marker ends; these are artwork geometry, not component corner tokens. They are contextual false positives. No hook suppression or ignore configuration was added.

## Working tree

Unrelated changes existed before this work, including the mobile name position, docs, specs and many assets. No commit, staging or rollback was performed.
