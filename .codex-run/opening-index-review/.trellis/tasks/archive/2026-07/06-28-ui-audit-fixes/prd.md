# Fix mobile settings accessibility and design audit issues

## Goal

Fix the selected UI audit findings from items 2, 4, and 5: mobile settings modal containment, touch target and icon button accessibility, and the design anti-patterns reported by the impeccable detector.

## Requirements

- Make the settings modal behave as an accessible dialog on mobile and desktop, with clear dialog semantics, labelled close control, and scroll containment inside the modal.
- Ensure header icon buttons, mobile menu controls, and modal close actions expose explicit accessible labels and meet mobile touch target expectations.
- Remove the flagged design anti-patterns in app CSS where practical: side-tab accents, width-based transitions, bounce easing, and overused font declarations.
- Align the player announcement modal's internal controls with existing modal styling: header lockup, segmented tabs, list rows, status blocks, detail body, Bright School theme treatment, and mobile sizing should use the same visual vocabulary as other player windows.
- Keep changes scoped to the selected findings and avoid changing unrelated announcement/admin behavior from the previous worktree state.
- Update system design documentation and regenerate `docs/system-design.html` per project instruction.

## Acceptance Criteria

- [ ] `SettingsModal` has dialog semantics and no longer clips the lower content on mobile viewports.
- [ ] Header and modal icon buttons expose explicit `aria-label` values and mobile touch controls are at least 44px in their active axis.
- [ ] `node .agents/skills/impeccable/scripts/detect.mjs --json src` no longer reports the selected anti-patterns in changed production styles, or any remaining warnings are documented as intentional.
- [ ] Announcement modal tabs, rows, empty/error states, and detail body match the shared modal theme on desktop and mobile.
- [ ] Relevant tests pass.
- [ ] `npm run docs:system-design` completes after documentation updates.

## Definition of Done

- Code and CSS changes are scoped to the selected audit items.
- Mobile and desktop paths are both considered for modal and header controls.
- Docs are updated.
- Verification commands are run and results are recorded in the final response.

## Out of Scope

- Fixing the admin announcement input theming issue from audit item 1.
- Redesigning admin announcement composition or homepage visuals outside the selected detector cleanup.
- Changing backend routes, schemas, or announcement data behavior.

## Technical Notes

- The audit screenshots are under `.codex-temp/impeccable-audit/`.
- Likely touched modules: `src/modals/SettingsModal.jsx`, `src/home/components/HomeHeader.jsx`, mobile adaptive CSS, flagged CSS files under `src/styles/`, tests with style contract expectations, and `docs/system-design.md`.
