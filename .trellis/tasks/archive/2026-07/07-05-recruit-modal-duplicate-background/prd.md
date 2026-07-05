# Fix recruit modal duplicate background

## Goal

Fix the recruit modal visual regression where the item-selection and result stages show two overlapping background images. The modal should show only the recruit item/poster artwork intended for the recruit flow.

## What I Already Know

* The user reported the recruit window has an extra background image during the item-selection and result stages.
* The expected visual is a single recruit item image, with no additional overlapping backdrop inside the modal.
* This is a frontend visual bug in the SigrikaGo project and should preserve the existing visual contract outside the affected recruit stages.

## Requirements

* In the recruit modal item-selection stage, render only the intended recruit item/poster background.
* In the recruit modal result stage, render only the intended recruit item/poster background.
* Keep the existing recruit modal layout, copy, animation behavior, and interaction behavior unless directly required to remove the duplicate background.
* Preserve both desktop and mobile behavior for the recruit modal.

## Acceptance Criteria

* [ ] The item-selection stage no longer shows two overlapping background images.
* [ ] The result stage no longer shows two overlapping background images.
* [ ] Other recruit modal stages retain their current intended background behavior.
* [ ] Desktop and mobile styles are checked for the same duplicate-background failure mode.
* [ ] Targeted tests or contract checks cover the regression where practical.

## Definition of Done

* Root cause is traced through the actual component/style render path before editing.
* Tests/checks relevant to the changed files pass.
* `docs/system-design.md` or a corresponding `docs/system-design/` page is updated if the fix changes a documented design fact, and `npm run docs:system-design` is run when docs are updated.
* The change stays scoped to the recruit modal duplicate-background bug.

## Out of Scope

* Redesigning the recruit modal.
* Changing recruit mechanics, data models, rewards, or backend APIs.
* Broad CSS cleanup outside the affected recruit modal surface.

## Technical Notes

* Use systematic debugging: identify the exact duplicate background source before changing code.
* Prior SigrikaGo modal/style work suggests checking late theme and terminal-style overrides before adding stronger CSS.
* Root cause found: `.recruitment-selection-card`, `.recruitment-status-card`, and `.recruitment-result-card` composed `var(--recruitment-paper-background-image)` while the component also rendered the active recruitment item watermark/icon; Bright School reintroduced the same paper image with `!important`.
