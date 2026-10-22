# 功能丝印卡片样板

## Goal
The user liked option C but rejected applying the same decoration everywhere. Expand the selected visual language into multiple distinct finite geometric prints and assign each by card function. Continue the design sample; production integration was not requested in this iteration.

## Decisions
- Keep the accepted solid-shape / localized halftone visual language and current game palette.
- Seven families: identity, records, social connection, inventory packaging, tactics, reading, and honors/progression.
- Assign by card semantics inside each window, rather than giving every card in a window the same motif. Profile combines identity, honor, and record motifs; character details combine tactics and reading motifs.
- Keep original A/B/C comparison for reference and link to a new functional-C page. Reuse the existing eight real-window harness with a separate screenprint-roles variant.
- Decorative backgrounds must not change card geometry, text, semantic states, dedicated character art, or controls. Large panels and compact lists use different scales.
- No unresolved blocking questions: the user explicitly selected a direction and asked us to design the distribution.

## Acceptance
- [x] Seven visually different patterns visible in a material swatch board.
- [x] Eight real windows show semantic pattern assignment, including mixed roles inside profile and handbook windows.
- [x] Single-corner, finite shapes; no full-surface tiling or thin decorative line system.
- [x] Desktop and portrait verification, baseline rectangle comparison, controls and long content checked.
- [x] Pattern-to-role map, screenshots, source generator and system-design docs saved.
- [x] Scoped commit preserves all pre-existing WIP.

## Technical scope
Only docs/design-samples/academy-card-materials-2026-10-22, this task, and this task's system-design entry. Existing materials.css handles background drawing; new role stylesheet owns per-role images, scale and corner. sample.jsx enables the new variant; original C remains unchanged.

## Outcome and spec decision
Seven finite textures assigned to eight windows. 24 normal viewport cases with baseline text/rectangle equality, correct texture and no-repeat assertions; 16 empty/long cases and six gallery controls checked. 390/320px gallery overflow checks passed. Scoped lint passed. No production spec change: all role mapping lives in the isolated sample and its documented owner list, pending a later integration request. Existing CSS specs and other WIP were preserved.
