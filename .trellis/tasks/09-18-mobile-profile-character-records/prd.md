# Restore mobile detailed-profile character records

## Goal
Fix the portrait-phone detailed user profile where the character record list is not visible.

## Scope and acceptance
- Reproduce using UserProfileCard and complete production styles, with real-shaped character stats.
- Restore a visible, scrollable character record list at 360x800, 390x844, and 412x915, including short screens and home title stickers.
- Preserve desktop layout, data flow, record columns, and unrelated WIP.
- Add a relevant regression contract and update system design documentation.

## Initial hypothesis
The shared dossier stacks fixed-size identity and summary rows above a minmax(0,1fr) character list inside an overflow-hidden fixed-height modal; inspect actual computed dimensions before changing styles.

## Confirmed cause and fix
The fixed-height social dossier exhausted the remaining character-list row on short phones. Make its body the single scroller and use natural block heights for the social record panel, character section and table wrapper. Keep self-resume and desktop unchanged.

## Browser verification
- 360x800, 390x844, 412x915, and 360x640: both ordinary and sticker headers.
- All eight variants passed last-row visibility after body scroll and no document horizontal overflow; table has a nonzero natural height.
- Desktop 1440x900 verified; screenshots and logs under .codex-run/profile-fixed-*.

## Shared-profile parity follow-up
- User reported previous resume polish absent in detailed profiles: character-record/recent-ten headings, replay placement and related layout.
- Removed self-only rendering branches in ProfileResumeView; replay action is attached to total games for both contexts. UserProfileCard supplies an accessible icon-only action.
- Shared summary spacing, recent results, table heading and mobile column widths now target both contexts. Social identity actions and the mobile body scroller remain specific.
