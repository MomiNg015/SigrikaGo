# Match card character selection

## Requirements
- Remove queue population displays from match cards.
- Standard and Gomoku each have one selection square. Spark regular and capture each have one; team has three.
- Empty squares are transparent with an outlined plus. Clicking opens owned, available character bust cards; selecting a single character closes the picker and fills the square with their avatar.
- Persist per account and entry in localStorage; reject stale/unavailable selections without choosing defaults.
- Reuse the team picker with bust art and save-only confirmation; matching starts from the match card after three distinct members are selected.
- Missing selection displays exactly `尚未选择角色，无法匹配` and keeps the mode window open.
- Send selected identity to the server and validate ownership/availability before room creation, without modifying account default.

## Acceptance criteria
- Selection persists across closing/reopening and refresh; account selections remain isolated.
- Match and challenge requests use the shown character; team sends the shown ordered lineup.
- Existing practice and corrupted story behavior remain intact.
- Desktop/mobile buttons remain usable, separate from card actions, with no overflow.
- Relevant tests, lint and build pass; docs/system-design.md is updated.

## Scope
Existing mode structure and game rules remain unchanged. Subsequent user requests explicitly authorize refining the original hand-painted student-ID artwork into the character-picker frame.


## Validation
- 225 targeted tests passed before the final delivery-payload regression was added; final full-suite run includes that regression.
- Browser component regressions passed at 1440x900, 390x844 and 360x800: empty-slot transparency, 44px geometry, owned bust sizes, reload persistence, selected payload and ordered team reuse.
- Lint, production build, built CSS contracts, portrait normalization, admin snapshot, production configuration and system-design rendering passed.
- Full-suite environment limitation: four existing `scripts/devApiProxy.integration.test.js` cases cannot listen on 127.0.0.1:5173 (EACCES). No production proxy configuration or unrelated test fixture was changed to conceal that restriction.
- Full run: 2977 tests passed; four existing proxy cases failed on EACCES and one new style-import contract failed. The style contract was corrected, then all 132 focused tests (including the full theme/style/inventory contracts) passed.
- Changes remain uncommitted; the full quality gate is limited by the unrelated proxy test environment.

## Mobile spacing follow-up
- At widths up to 768px, mode cards share an 88px height and character slots reserve 16px right clearance plus 20px or more vertically.
- All rule controls except the Spark parent sit at the upper-right of their titles; all primary and child labels use the same 28px large type. Controls follow measured text width after resizing or font loading.
- Browser geometry assertions and screenshots passed at 360x800, 390x844 and 1440x900. All 155 focused tests, lint, production build, built CSS contracts and documentation rendering passed.

## Student-ID picker follow-up
- Single and team roster cards use an edited original painted student-ID asset with hanging hardware removed, transparent photo window, live bust/name, per-character palette tint and actual faction emblems. Shared faction mapping remains identical to the handbook; unavailable faction identities are not invented.
- Source, generated frame and generation prompt note are preserved. Runtime screenshot: docs/design-samples/match-character-selection/student-id-picker-mobile.png.
- Browser asset/selection checks passed at 360x800, 390x844 and 1440x900. All 145 focused tests, lint, build, built CSS contracts and documentation rendering passed.

## Whole-window composition repair
- Active painted frame is character-selection-id-v2.png: centered dominant bust, restrained perimeter geometry, unboxed 20px name footer and subtle palette tint. Original faction artwork uses alpha calibration to stay legible.
- Single/team windows stay within 600px; mobile lists retain two columns. Team phase/name/portrait summary stays outside the list scroller, with natural-height card grid rows to prevent overlapping touch targets on short screens.
- Final desktop, 390px picker and 360x640 team screenshots were inspected and saved in docs/design-samples/match-character-selection/. Six browser tests passed, including viewport width, two-column layout, summary stability, actual image loading, selection persistence and team ordering. Focused 145 tests, lint, build, built CSS contracts and documentation rendering passed.

## Clean student-ID and shadow review — 2026-10-05
- Active frame is character-selection-id-v3.png, edited with the built-in image tool: fresh white paper and thin graphite contours replace antique edging, rivets and angular industrial decorations. Live theme colors tint the header, photo backing and name band; original faction logos and 20px names remain.
- Desktop has five cards per row, mobile three. Random rotation is now within 1.5 degrees per mount and remains stable during selection. A lower-right shadow on the frame layer follows the card rotation without casting extra shadows from portrait or text.
- Card visuals are extracted into the sibling match-character-cards.css owner; grid and scroll gutters reserve shadow clearance. Both owners remain below 6000 bytes and preserve final-layer import ordering.
- All 128 focused component/style tests and nine browser regressions passed. Browser checks include actual shadow presence, rotated neighbor clearance, first/last scroll edge clearance, image loading, name fit, cached identity, team selection and ordering. Lint, production build, built CSS checks and system-design rendering passed.
- Actual desktop, 390px/360px complete rosters and 360x640 team screenshots were visually reviewed by both the implementer and a second reviewer, then saved under docs/design-samples/match-character-selection/. Work remains available in the working tree.

## Header removal and LXGW names — 2026-10-05
- The v4 frame removes the complete badge/header band and expands the photo window upward to a 4% top margin. Faction SVG markup is removed from the selection cards; shared handbook factions remain intact.
- Names retain 20px and now explicitly use the bundled LXGW Marker Gothic font against generic theme button overrides. Browser checks confirm the loaded face and actual computed font family.
- Framed portrait SVGs use the taller window ratio to keep their width framing rather than zooming when the opening grows. Desktop five-column/mobile three-column geometry, lower-right shadows and stable tilt continue unchanged.
- Updated desktop, mobile and short-screen team captures were inspected and saved. All 128 focused component/style checks and nine browser regressions passed; the two component suites also passed after the final portrait-framing adjustment. Lint, build, built CSS and documentation rendering passed. V4 asset and built-in generation prompt are retained in public/assets/home/.

## Stronger shadow and selector depth — 2026-10-05
- Card cast-shadow ink strength increases from 28% to 45%, retaining existing offsets and scroll clearance.
- Transparent 44px selection squares gain a subtle upper highlight and right/bottom hard shadow. Fine-pointer hover lifts 2px and extends the shadow; press moves down 2px and compresses the shadow. Keyboard focus remains visible, touch avoids sticky hover, and reduced motion suppresses movement.
- Browser checks cover empty and selected squares, default/hover/press depth, keyboard focus, cached selection, reduced motion and touch; six desktop interaction captures were inspected. Stronger card shadows also pass existing rotation/neighbor/scroll-edge checks at desktop and both phone widths.
- All 156 focused component/style/HUD checks and ten browser regressions passed. Lint, production build, built CSS contracts and system-design rendering passed. Updated snapshots and default/hover/pressed mode controls are saved in docs/design-samples/match-character-selection/.
