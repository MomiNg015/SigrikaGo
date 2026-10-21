# Empty warehouse and team matchmaking polish

## Requirements
- An empty warehouse keeps its original layout and content, rather than replacing the entire body with one empty placeholder.
- The team lineup picker's bottom action reads 开始队际赛匹配. Clicking it validates the selected lineup using the existing rules and starts team matchmaking when valid.
- Ordinary match-success cards use a pale green background to make success clear.

## Boundaries
- Preserve inventory use rules and team eligibility rules. Reuse the existing matchmaking request and validation path.
- Preserve special corrupted-duel presentation and unrelated pending work.
- Check real desktop and portrait rendering; cover empty inventory and direct-start behavior with focused tests.
- Update system-design sources and generated HTML plus any existing contract affected by this change.

## Findings and validation
- Removed the warehouse's body-level empty return. Empty lists span the directory tracks and retain the normal inspector/action/paging geometry with disabled controls and zero counts.
- Team normalization reuses `teamLineupSlots` and `availableTeamCharacters`; the picker and mode card share HomeScreen's submit path and retain existing socket/server admission.
- Ordinary match-success paper uses the established success token and local paper variable, excluding the corrupted-duel class.
- Design-hook findings are pre-existing, contextually intentional values: Arial tabular inventory numerals are explicitly required by the warehouse contract; the existing match-success icon/body colors are unrelated to the requested background. No new literal colors or font choices were introduced; no suppressions added.
- Focused component checks: 76 passed; additional delivery/cancellation/HUD/empty-state checks: 52 passed (overlapping empty-state coverage).
- New real-browser checks: 9 passed at desktop/390/320px, covering retained layout, direct submit and ordinary/special match color distinction; final empty-copy recheck: 3 passed. Visually inspected desktop/mobile empty warehouse, mobile success and 320px team footer.
- Existing selection/card regression: 3 passed. Lineup/portrait regression: 3 passed after replacing its obsolete `.team-order-badge` assertion with the existing stamp asset contract. Updated the single-picker close step to match its current persistent-selection behavior.
- Battle gate: 442 passed plus 4 documentation tests. Pixi stability: 4 passed across desktop/mobile. Lint, production build and built-CSS contracts passed.
- System-design sources, generated HTML and the affected component/state contracts updated. Staging preserves unrelated profile/application changes and their documentation hunks.
