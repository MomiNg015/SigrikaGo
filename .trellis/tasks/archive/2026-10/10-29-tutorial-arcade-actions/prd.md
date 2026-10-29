# Unified tutorial battle actions

## Goal
Reuse the normal five-key arcade controls throughout tutorial play, replace them only for explicit continuation/answer choices, and move mobile story history into the header.

## Requirements
- Fix bright corner artifacts by matching the input-focus cutout to each rendered control's actual rounded shape.
- On mobile, put a 44px icon-only story-history trigger immediately left of exit. Remove its old full-width dock entry. Keep desktop history behavior and accessible naming, popup bounds, dismissal and content.
- Never leave the action region empty. Waiting, board-input, NPC and automatic phases retain all five normal keys; tutorial gating disables out-of-step actions. Continue/answer choices replace the region.
- Guide pass, counting, skill, draw and resign using the matching normal key, with a single highlighted target. Skill selection keeps the normal bar while targeting the board. Effective/selected skill names and real count display must stay coherent.
- Add missing pass/draw tutorial node support through shared types, editor/workbook and local execution without changing network game rules or existing scripts.
- Preserve the prior preload/tutorial WIP; only dependencies necessary for these requested behaviors join this change.

## Acceptance
- [x] Current tutorial previews demonstrate all five guided actions, waiting/board phases and replacement options on desktop/320/390 portrait.
- [x] Target-only callbacks, transition locks, duplicate input safety and original normal-battle semantics pass regression tests.
- [x] Focus geometry matches capsule/ellipse/rounded choices with no exposed white corners; moving/pressed targets remain aligned.
- [x] Mobile history opens below the header, stays inside the viewport, and closes via button, Escape and outside input.
- [x] Docs/spec, CSS inventory and generated HTML are synchronized; scoped commit preserves unrelated work.

## Decisions
The requirements are explicit; no blocking preference questions. The normal controls remain visible but only the current tutorial operation is enabled. Desktop history stays beside the player. Existing manual continuation remains an explicit choice.
