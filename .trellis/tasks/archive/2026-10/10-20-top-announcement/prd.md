# Ship the selected ink campus broadcast

## Confirmed request
Implement sample 3. Replace its left label with 校园播报. Full-width strip above the home header, one line, overflow-only scrolling, admin enable/disable and editable content. Keep LXGW typography and selected dark ink / mint treatment.

## Implementation
- Existing SiteSetting pipeline: topAnnouncementEnabled (boolean, false by default) and topAnnouncementText (plain single-line text, max 500 UTF-16 units, empty by default).
- Reuse admin authorization, transactional save/audit, public settings projection and create-only startup defaults. No database migration, no fabricated live notice, no user-dismiss or scheduling/maintenance-lock behavior.
- Render before HomeScreen main so existing home grid/direct-child geometry remains intact. Reserve 40px plus top safe area only while visible, with scoped owner CSS beating theme resets.
- Reuse selected sample scrolling at 36px/s with initial reading delay; pause button, hover/focus pause; reduced motion permits manual horizontal reading. Ignore blank/disabled values.
- Refresh public settings every 30 seconds while the home view is visible, on home entry and tab/window return. Preserve last valid settings on transient failure and avoid stale reads replacing a local admin save.
- Add focused persistence/admin/lifecycle tests and real-component desktop/390/320px browser checks; update system-design, generated HTML and relevant executable specs. Keep unrelated WIP and pre-existing character snapshot drift separate.

## Completion
The real component and backend/admin path work, label is 校园播报, restart/fresh defaults retain configured state, browser and scoped gates pass. Full npm check attempted; existing unrelated snapshot discrepancy reported if still present. Scoped commit and task journal.
