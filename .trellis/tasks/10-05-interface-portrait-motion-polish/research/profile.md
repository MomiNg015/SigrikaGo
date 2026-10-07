# Shared profile dossier research

Scope: read-only source research, 2026-10-05. Existing WIP preserved. The profile polish implementer should own **CSS only**; portrait implementer owns hero markup and shared portrait resolver changes.

## Components and semantics

- `src/modals/ProfileResumeView.jsx` is the shared self/social composition. Hero: `.profile-resume-hero > .profile-hero-portrait > .profile-portrait-mask > img`, sibling chain badge, `.profile-identity-block` containing `h3 > UserIdentity`, optional `.profile-identity-actions`. No extra visible dossier headings.
- `ResumeModal.jsx` owns self fetching, mode retry/replay, wallet, close and self actions. Self actions are accessible icon-only achievement and personalization buttons. `UserProfileCard.jsx` owns social data/retry, like/friend/blacklist/report and nested confirmations. Both pass data to the same view.
- Record panel keeps status, overview, characters and footer areas. Overview has rank + five-column aggregate record, replay icon in record header, recent-ten markers. Preserve values above labels, separator before win rate, title typography parity.
- Character records are a semantic six-column table (`th[scope=row]` identity + five `td`s), sorted descending games. A separate visual `.profile-character-table-head` duplicates column labels while real `thead` is visually hidden in Bright School. One character always stays one row, including mobile.
- Empty records retain the **framed** `.profile-character-section.profile-character-empty` and compact `WindowEmptyState` inside. Copy is exactly `暂无角色战绩`; no helper descriptions. Do not collapse residual empty space.
- `WindowBookmarkTabs.jsx` relocates mode tabs to an exterior vertical rail for Bright School opt-in. Preserve spark / standard / gomoku order, native ARIA selection/pending state, and rail keyboard behavior.

## Current cascade and ownership

Global: `src/styles.css` -> domain CSS -> HUD compatibility -> `themes.css` -> Bright School -> **mobile-adaptive.css last**. Edit bounded existing owners; no broad reset or another ad hoc late override stack. `cssLayerInventory.js`, `styleContract.test.js`, `npm run check:built-css` guard styles/import inventory.

Suitable CSS-only profile ownership:

| Responsibility | Existing owners |
| --- | --- |
| Shared geometry / hero | `src/styles/modals/profile-hero-cleanup.css` |
| Overview / metrics / tooltip | `src/styles/modals/profile-overview.css` |
| Table / identity rows | `src/styles/modals/profile-character-records.css` |
| Final Bright School hero/shell | `src/styles/themes/bright-school/quality-base/profile-dossier/surfaces-portraits.css` |
| Final paper cards / depth | `src/styles/themes/bright-school/quality-base/profile-dossier/card-surfaces.css` |
| Icon geometry | `src/styles/themes/bright-school/quality-base/profile-dossier/action-controls.css` |
| Row paint removing HUD bleed | `src/styles/themes/bright-school/quality-base/audit-profile-modals.css` |
| Final mobile hero/summary/table | `src/styles/mobile-adaptive/mobile-profile-records/{profile-shell-hero,profile-summary-results,character-record-list,character-record-cards}.css` |
| Final exterior title/header/recent alignment | `src/styles/mobile-adaptive/window-sticker-resume-header.css` |

Portrait framing currently has repeated `width/height:80% !important`, `object-fit:contain !important`, `scale:1 !important`, `translate:0 0 !important` in base hero/table, Bright School `surfaces-portraits.css`, mobile hero and mobile rows. These must be coordinated with the portrait implementer's new presentation contract, otherwise framing metadata is silently neutralized. Hero image backgrounds/borders/filters remain transparent/none. Inner mask owns cropping; chain badge stays outside.

Final bookmark CSS is **later** than mobile profile files: `window-bookmark-content.css`, `window-bookmark-mobile.css`. At <=360px it wins hero grid `72px minmax(0,1fr)`, portrait `70x76`, social actions 2x2. At <=1100px **or** <=700px height it switches both dossier bodies to natural-height flex column scrolling, leaving rail fixed. Do not fight that with taller hero or residual grid rules.

## Sizing and scrolling contracts

- Desktop shell max 1440px, content max 1160px, shell height min(900px, viewport - 32px). Hero currently 172px column / 164x152 portrait / 28px gap, username 2.3625rem and independent equipped-nameplate scale 1.4.
- Mobile hero currently 108px portrait column / 108x96 portrait / 12px horizontal gap, two rows with social actions below. Name 1.75rem, equipped-nameplate scale 1.288. This is further compacted by final bookmark narrow-phone rules.
- Ordinary mobile **social** `.profile-resume-view-social` owns vertical scrolling; its panel/character section/table scroller become natural-height with visible overflow. Self desktop keeps residual table scrolling. Bookmark short/narrow windows switch **both** to whole-body scrolling. Preserve all three contracts; verify last row reachable at 320x568 and 360x640.
- Exterior sticker title floats outside layout. Self header final owner keeps 8px shell inset, 56px header, wallet/close 44px; actual achievement/personalization icons are currently absolutely located inside hero lower-right (not the header despite an older spec sentence). Preserve current DOM and accessibility.
- Tooltip stays keyboard-focusable, above record cards, bounded to viewport. Nested confirmation backdrops remain fixed, and broad child-positioning rules must not capture them. Replay opens standalone through existing portal.

## Two recommended visual layout options

1. **Preferred: campus identity sheet.** Preserve the current three-column desktop hero and mobile portrait/name composition. Give hero a subtle blue-paper tint only in the portrait frame, clean cream identity field, current dark brown 2px ink edges and hard-shadow depth. Make rank/record side-by-side with a clear 1:1.5 ratio, recent markers a slim full-width strip directly below; mobile rank and record each span a full row. This removes underfilled four-column summary slots and makes typography/number rhythm coherent. Use one clean cream table surface with softly character-tinted rows; reduce repeated card visual weight while preserving frame and shadow gutters. A larger visible bust can occupy existing portrait box without growing shell height.
2. **Alternative: compact student file.** Desktop hero becomes a slightly wider portrait column alongside identity and compact icon actions, with hero/overview aligned to a common 16–20px inset; keep rank/record as two paper blocks and recent marker strip inline below. Mobile use same portrait/name row, self actions stay at lower-right inside available identity space, social actions below. This provides a stronger featured identity but costs vertical space; only use if actual loaded username/nameplate and long records fit short screens without shrinking touch targets.

Both options should retain existing cream/brown/pastel campus palette, native paper borders, one restrained depth hierarchy and rounded hand-painted feel. Do not add decorative English headings, repeated section labels, terminal grids, heavy gradients or motion on static data rows. For hover feedback, act only on real controls; static cards should not imply clickability.

## Browser and test handoff

- New combined fixture already exists from parent work: `tests/e2e/fixtures/interface-polish.{html,jsx}` and `tests/e2e/interface-polish.config.js`. Coordinate fixture ownership with parent.
- Existing full browser path: `tests/stability/profile-resume.spec.js`. Registers self Sigrika and social Aemeath, routes deterministic profile/replay data, verifies both surfaces at desktop 1440x768 /1600x900 /1920x1080 and mobile 360x800 /390x844 /412x915, keyboard mode changes, loaded portraits, last row reachable, tooltip bounds, no overflow, standalone replay placement. Portrait-fit expectation currently says contain; update only with the intended new portrait contract.
- Focused DOM tests: `src/modals/ResumeModal.dom.test.jsx`, `UserProfileCard.dom.test.jsx`, `WindowBookmarkTabs.dom.test.jsx`, `WindowBookmarkWindows.dom.test.jsx`. Layout/CSS contracts: `ProfileMobileLayout.test.js`, `HouseModal.test.js`, `src/styles/styleContract.test.js`.
- Existing `ProfileMobileLayout.test.js` asserts literal CSS values including hero sizes/nameplate scales and card-shadow variables. Change those assertions only when the tested requirement truly changes; retain semantic scrollers/masks/table contract.
- Source specs to load: `.trellis/spec/frontend/css-architecture.md` (Portrait social-profile records, mobile modal gutters, mask ownership); `window-title-stickers.md`; relevant quality-guidelines profile section; costume-system contract for framing. Update `docs/system-design.md` synchronously with implementation.

## Risks to watch

Parent's real-browser baseline is `.tmp/interface-polish/before/resume-1440.png` and `profile-390.png`. **Priority defect:** mobile social detail title sticker is cropped at the top and modal reaches x=0. Fix the actual title/backdrop/shell owner while reserving rail footprint and top sticker bleed. Desktop shows excessive hero whitespace, tiny chibi art and visually equal boxed sections; preferred campus identity sheet should use new bust presentation within current height and give the identity greater emphasis while calming record/summary depth. Verify browser scroll reachability after every geometry pass.

The strongest current problem is cascading old layout geometry, rather than missing visuals: base summary grid defines four columns although markup has only rank + record; final desktop header owner reintroduces repeat(4,1fr), while later theme mode-tabs declares the intended 1:1.5. Inspect computed winner and patch actual owner. Portrait normalization embeds whitespace and square full-body art; changing only `object-fit` cannot guarantee a chest-up crop, so use the new shared presentation contract. Keep explicit specificity matching Bright School duplicated class selectors where `!important` is already involved.
