# Fix Story Player Overlay Dismissal Layering

## Goal

Fix the generic story player so item-triggered stories render above the warehouse modal and can be closed/skipped reliably.

## Requirements

* Story player backdrop must sit above the normal app modal backdrop and warehouse modal.
* Skip confirmation and finish/close actions must remain clickable when the story was opened from warehouse item use.
* Warehouse should remain open underneath after the story closes.
* Keep existing StoryPlayer/Onboarding visual layout unchanged except for stacking behavior.

## Acceptance Criteria

* [x] Story player CSS z-index is higher than the generic `.modal-backdrop` layer.
* [x] Existing story player, onboarding, overlay, and modal dismissal tests pass.
* [x] Build still passes.

## Verification

* `npm test -- src/modals/OnboardingStoryModal.test.jsx src/admin/AdminOnboardingStory.test.jsx src/modals/StoryPlayerModal.test.jsx src/app/AppOverlays.test.jsx src/app/modalDismissal.test.js` passed.
* `npm run docs:system-design` passed.
* `npm run build` passed.
* `npm test` still has one unrelated existing failure in `src/styles/themeContract.test.js` for the Bright School effects import list expecting 7 imports while current WIP includes `./effects/home-image-entry-buttons.css`.
* Follow-up verification: `npm test -- src/app/AppOverlays.test.jsx src/app/modalDismissal.test.js src/modals/OnboardingStoryModal.test.jsx src/modals/StoryPlayerModal.test.jsx src/modals/WarehouseModal.test.js` passed after centralizing story overlay dismissal.
* Follow-up verification: `npm run docs:system-design` passed.
* Follow-up verification: `npm run build` passed.

## Definition of Done

* Tests added or updated for the regression.
* Relevant docs updated if behavior facts change.
* No unrelated CSS/theme contract churn.

## Technical Notes

* Root cause 1: `.modal-backdrop` uses `z-index: 160`, while `.onboarding-story-backdrop` used `z-index: 34`, so item-triggered story UI could render under warehouse and receive no clicks.
* Root cause 2: the app still had both legacy `onboardingStory` and generic `storyPlayer` overlay flags. Closing only one story surface could reveal the other story instance or leave active script state around, making the player feel like the story window would not close.
