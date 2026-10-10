# Team profile verification — 2026-10-10

## Delivered
- Independent team rank: terminal replay + both mode stats commit atomically; duplicate recovery restores the existing receipt; invalid games are excluded and no coins/Spark progression change.
- Team totals, last ten including draws, and actual stage-based character appearances. Historical unrated team records are included without retroactive star awards. Malformed legacy snapshots fall back to the known active member; duplicates count once.
- Both profile contexts share team request/loading/retry and team-only replay browsing. Character total label is 出场次数; account totals remain 总对局.
- Compact horizontal identity header, rank associated with the selected play, larger portraits/type, labeled replay control, quiet secondary social actions and ten fixed mobile result cells.

## Verification
- Full npm test: 430 files / 3164 tests; 3160 passed, 4 failed. One newly stale HouseModal table-header expectation was updated from 对局 to 出场次数 and included in the final scoped rerun.
- Remaining pre-existing failures: CSS totalBytes exceeds its recorded baseline by 899 bytes; match-mode-title-layout.css has an unregistered max-width:360px query; CharacterDetailDialog candy portrait expects the former is-standard-figure classification.
- Final scoped rerun: 15 files / 158 tests passed, including the updated HouseModal expectation. Lint, Vite production build, built-CSS contracts and system-design generation pass. No second full-suite run was needed for a test-expectation-only correction.
- Browser: actual components/full theme with mocked API, self/social × 1440/800/390/360/320. Verified regular/capture/team navigation, no horizontal overflow, no identity/action overlap and last record reachability. Additional long-name 8段/9段 checks at 1440/390/320 pass.
- Screenshots and user-facing notes: docs/design-samples/profile-folder-polish-2026-10-10/.
- Impeccable deterministic scan reports no findings. The replay button uses the existing 8px radius scale; no animation or global theme changes.
- CSS delta across the four existing profile owners: +717 normalized bytes, +39 important declarations, -2 hex literals; no new owner or breakpoint. Only this delta adjusts the inventory, retaining the existing 899-byte mismatch.

## Scope safety
Before/after snapshots are under .codex-run/team-profile-before. A three-way application of this task's delta to HEAD excludes unrelated portrait, home selection, docs and CSS WIP from the commit. The generated committed HTML uses committed document inputs; the working HTML still includes unrelated working documents.
