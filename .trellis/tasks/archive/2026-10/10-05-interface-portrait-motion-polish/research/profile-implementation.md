# Shared profile implementation

CSS-only owner pass, 2026-10-05. Existing uncommitted work was preserved. Portrait component/resolver and global documentation are owned by the parent/portrait agents.

## Resulting composition

- Self resume and social details share a campus identity sheet. The desktop hero uses the existing 164×152 portrait stage with 12px vertical padding and a 20px identity gap; no new visible copy is introduced.
- Rank and aggregate record use explicit `1fr / 1.5fr` desktop tracks. The overview itself has one column, placing recent-ten results in a full-width 46px paper strip below those cards. Mobile retains full-width rank and record rows.
- Rank/record headings share dark ink and 700 weight. Aggregate numbers and percentages explicitly remain on one line. The recent strip uses a quiet 1px line and no shadow, while identity/table frames keep the stronger paper silhouette and summary cards use a shorter 2px/3px shadow.
- Character rows remain native six-column table rows with 7–8px spacing, 7% character tint and one continuous cell-painted card. Their ink outline drops from 74% to 38%, and the 2px shadow opacity drops from .42 to .18, calming repeated records without flattening their readable grouping.
- Plain mobile identities use zero inner/vertical gutters, slight -.01em tracking and 24px text (22px on the existing ≤360px portrait family). Ordinary eight ASCII characters fit on one line even at320px; wider names may occupy at most two lines. `overflow-wrap: anywhere` makes legal wide ASCII names readable. Equipped-nameplate geometry/scales and single-line text remain on their shared owner. Long legacy names clamp at two lines.
- In self phone profiles with plain names, portrait spans the identity and action tracks, and the two 44px icon controls participate in the action track. This reserves their space instead of overlaying the second name line. Normal profiles remain compact; wide names may add a bounded amount of hero height while the shell retains its fixed height and original body scroll.
- Empty recent-ten text uses its intrinsic width and stays on one line; actual empty recent results are covered separately from empty character records.
- Phone self identity/replay targets use 44px; desktop icons remain 36px. Bookmark rail, coin, close, social action order, native focus and native body/table scrolling remain intact.
- Mobile help tooltips are sized to `min(250px, 100%)` of their own summary card, with zero side inset. This repairs the old 320px overflow while preserving keyboard focus and top stacking.
- Removed the obsolete direct hero `mask > img` phone normalization. `CharacterBustPortrait` now introduces a compositor wrapper and owns the bust framing; record thumbnails retain their legacy 80% contained image rules and badge siblings.

## Actual shell evidence

The first parent social screenshot omitted the caller's `.modal-backdrop.profile-modal-backdrop`. After the fixture matched the real Friends/Room caller, the 390px social shell measured x=64, y=46, width=314 and its full sticker began at y=11.34. No production backdrop/shell repair was needed, and the title/rail safe gutters were retained.

## Changed files

- `src/styles/modals/profile-hero-cleanup.css`
- `src/styles/modals/profile-overview.css`
- `src/styles/themes/bright-school/quality-base/profile-dossier/{surfaces-portraits,card-surfaces,action-controls}.css`
- `src/styles/themes/bright-school/quality-base/audit-profile-modals.css` (profile row selectors only)
- `src/styles/mobile-adaptive/mobile-profile-records/{profile-shell-hero,profile-summary-results,character-record-cards}.css`
- `src/styles/mobile-adaptive/window-sticker-resume-header.css`
- `src/modals/{ProfileMobileLayout.test.js,HouseModal.test.js}` (intended grid/row contracts)

## Validation

- Browser matrix uses actual ResumeModal/UserProfileCard and full CSS at 1440×900, 390×844, 412×915, 360×640 and 320×568; each has normal four-CJK, eight ASCII (`fx2eee94`), wide eight ASCII (`WWWWWWWW`), overlong legacy-name and truly empty recent/character-record cases (50 cases).
- Checks: zero document horizontal overflow, full external-title bounds, one-line numbers/percentages and empty recent text, mobile 44px targets, complete legal names at ≥22px and ≤2 lines, zero geometric name/action intersection, bounded self hero growth, viewport-bounded keyboard help, framed empty records and fully reachable last table row.
- Visual captures: `.tmp/interface-polish/profile-before/`, `profile-pass-1/`, `profile-pass-2/` and `profile-qa/`. Pass 2's 390px social screenshot confirms the complete four-CJK identity and single-line percentage; QA captures include maximum-scroll and empty-frame evidence.
- Relevant DOM suites initially passed all 25 tests; profile layout and HouseModal assertions were updated only for the intended two-column/row-shadow change. Final focused run is reported to parent separately.
- All owned concrete CSS files stay below 6000 bytes. No CSS baselines/import inventories were edited by this agent. Parent consolidates the new portrait import, global debt metrics, system-design source and rendered HTML.

## Second visual pass

The real live-account review caught two gaps in the first fixture matrix: its empty-record branch still supplied ten recent markers, and its ordinary name covered only four CJK characters. The fixture now supplies genuinely empty recents plus ordinary/wide legal ASCII names. Dedicated hero captures also caught the absolute self actions overlapping the second name line; the final matrix checks actual name/button intersections instead of relying on shell size alone.

Scoped CSS delta from HEAD after this pass: +556 normalized bytes, +3 `!important`, zero hex additions and zero new CSS files. Concrete owner sizes are hero 3854, overview 5202, portrait surface 2601, card surface 4142, action controls 3452, profile audit 4921, mobile hero 5547, mobile summary 5156, record cards 2985 and sticker header 5843 bytes. The final version passed all50 browser cases including explicit name/action intersections, single-line ordinary names and unchanged shell bounds across populated name variants. Wide/legacy self names add18.63px at320/360 and12.63px at390/412; ordinary names add none, and all social hero heights stay stable. Both updated style suites pass33 tests. Scoped `git diff --check` passes.

## Follow-up boundaries

Retain the existing narrow/short-window whole-body scroller and desktop residual table scroller. The old frontend quality text still describes four summaries and direct 80% hero images; parent documentation should reflect the approved rank/record and bust contracts. Browser emulation verifies layout/interaction behavior but does not measure physical-phone GPU performance.
