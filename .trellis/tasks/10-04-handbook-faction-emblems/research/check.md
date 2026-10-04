# Independent review: official handbook faction emblems

## Result

No blocking findings in the reviewed production implementation.

## Scope and evidence

Reviewed task PRD, `check.jsonl`, frontend CSS architecture and handbook strip contracts, the diff for `HouseCharacterGrid.jsx`, its DOM tests and `handbook-strip-paper.css`, the production faction manifest and files, and removal of the former garment assets and extraction script.

- Exact user mapping is present: Sigrika → Roya; Denia, Aemeath, Lynae, Mornye, Chisa, Nabomo → Startorch; Changli, Qiuyuan → Huanglong. Baconbits and new catalog IDs receive no inferred emblem.
- Faction resolution is guarded by ownership. Unowned and missing-intel branches render no paper/emblem span or faction URL. Existing generic disabled labels and ownership guards remain unchanged.
- Paper and emblem spans are `aria-hidden` and pointer-transparent. Each owned portrait tile retains its single foreground `img`; item-effect controls remain outside the tile. Decorative absolute placement cannot alter native button geometry.
- The diff does not change input events, detail activation, focus restoration, source priority, portrait helper geometry, strip order or pagination.
- Three former garment PNGs, their manifest and `scripts/extract-handbook-ornaments.mjs` are removed. No old ornament references remain in production source, scripts or active frontend specs.
- All new URLs are local runtime URLs. Manifest source URLs point to the current official Kuro website, with attribution and original-byte processing explicitly stated.

## Asset verification

Read actual production image bytes with Sharp and SHA-256, independently comparing them with `manifest.json`:

| Asset | Native size | Bytes | Alpha range | Hash match | Compensation |
| --- | --- | ---: | --- | --- | --- |
| Roya | 422 × 344 RGBA | 26,642 | 0–106 | Yes | 255 / 106 |
| Startorch | 422 × 344 RGBA | 15,032 | 0–106 | Yes | 255 / 106 |
| Huanglong | 422 × 344 RGBA | 18,906 | 0–51 | Yes | 5 |

All metadata and hashes match. Locally inspected official Startorch art against the user's DNA/triangle reference during research, and inspected the production Roya and Huanglong assets beside the respective wheel/rays and dragon references during this review. Symbols match. Official Roya/Startorch originals retain their textured pale treatment; no pixels are redrawn or resampled.

`mask-size: contain` preserves the 422:344 source proportions inside independent square frames. CSS state opacity multiplies the native-alpha compensation; the largest opacity is `.18 * 5 = .9`, so it remains below the opacity clamp. Owner changes are limited to paper decoration and retain reduced-motion coverage. Final mobile geometry reviewed: compact 38px frame at bottom 3px; expanded 94px at top 40%, opposite the portrait.

## Verification performed

- `HouseCharacterGrid.dom.test.jsx`: 17 current production tests pass.
- `src/styles/handbookStrips.test.js`: 3 tests pass.
- The focused Vitest command also matched two existing historical `.codex-run/opening-index-review` DOM tests; both pass. Those are not counted as current implementation coverage.
- `git diff --check`: passes, with only existing line-ending notices.
- Inspected root's fresh screenshots: `390-844-denia-expanded.png`, `360-640-rest.png`, `1440-768-sigrika-expanded.png`. Expanded emblems fit the opposite blank area and do not cover the visible names; compact emblems remain subtle paper marks.

## Practical limits and remaining root checks

This independent pass did not launch a browser, mutate production files, or rerun full lint/build/browser suites. Native touch hit testing, final CSS inventory, built CSS, full browser regression and final documentation/render sync remain the root agent's checks. Screenshot inspection confirms only the captured states and viewport sizes; it is not a replacement for those interaction checks.
