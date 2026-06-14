# Fix House Manual Chain Badge Switching

## Goal

Fix the member manual bug where character chain badges can disappear after switching the selected character and only reappear after a later gacha-driven user refresh.

## What I Already Know

- Character duplicate rewards are represented by chain counts.
- The user reports the bug in the member manual character switching flow.
- Expected behavior: any portrait display for a chained character should show the chain count immediately and consistently.

## Requirements

- Preserve the existing gacha chain-count data model and badge presentation.
- Ensure the member manual uses the current user's chain-count map when switching selected characters.
- Add a regression test that fails if switching/selection rendering drops a known chain count.
- Update `docs/system-design.md` if the chain badge frontend data-flow contract needs clarification.

## Acceptance Criteria

- [ ] A House/member-manual test covers chain badge rendering for selected/switched character state.
- [ ] The fix does not require a new gacha draw or user refresh for existing chain counts to appear.
- [ ] Targeted tests pass.
- [ ] `docs/system-design.md` stays in sync.

## Definition of Done

- Tests added or updated.
- Targeted test command passes.
- Project check passes before handoff.
- Trellis task is archived and session journal recorded.

## Out of Scope

- Changing gacha draw settlement rules.
- Changing the visual design of chain badges.
- Adding new chain-count mechanics.

## Technical Notes

- Likely files: `src/modals/HouseModal.*`, `src/shared/CharacterChainBadge.*`, user payload helpers, and `docs/system-design.md`.
