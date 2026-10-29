# Battle arcade control design samples

## Goal
Review the five battle actions and deliver three distinct interactive Bright School arcade button concepts for desktop and portrait mobile.

## Requirements
- Visual priority: skill first; counting and resign second; pass and draw third.
- Preserve warm paper, dark ink, campus pink, notebook blue, mint and bundled LXGW typography.
- Three independent shapes/layouts: round arcade caps, stepped key bank, handheld control pod.
- Isolated preview under docs/design-samples; no production gameplay changes.
- Demonstrate hover/press, skill selection, unavailable skill, long skill names, and resignation confirmation.
- Retain all five controls. At least 44px touch targets on 320px mobile.
- Provide desktop and phone context plus comparisons and captured evidence.

## Research
- ActionBar.jsx currently renders five controls with dynamic skill name/count. Production counting label is 数子; user calls it 数目; sample follows the requested 数目 wording only.
- Bright School flat-controls.css removes all action shadows; portrait action-grid and action-decision-controls enforce five equal columns and 46px height, suppressing hierarchy.
- PRODUCT.md / DESIGN.md define paper-campus identity; preserve production semantics and separate sample chrome from proposed UI.

## Acceptance
- [x] All three variants render in desktop and 320/390px portrait widths without horizontal overflow.
- [x] Skill geometry and color dominate; counting/resign exceed pass/draw emphasis.
- [x] Buttons, state switcher, reset and confirmation dialog work with keyboard/touch.
- [x] Screenshots and browser results retained; system-design summary regenerated.

## Delivery
See docs/design-samples/battle-arcade-2026-10-29/README.md and verification.json. Three design directions and the selected pod refinement are reviewable. Production integration is outside this delivery.

## Selected direction revision
- User selected pod (3); replace generic skill text with character skill name.
- Right-top IRIS data window uses the actual IRIS mixed font stack.
- Positive charges remain rainbow even when turn-locked; zero charges are gray.
- All five enabled buttons have visible pointer/touch/keyboard press feedback.
- Verified 900/390/320px with long names, loaded fonts, count geometry, 5 measured downstrokes, pointer cancellation and touch. Results: verification-pod-v2.json.
- This continuation refines the isolated preview. No production components were edited.

## Scope boundary
This task ends at reviewable design samples. Integration is a later user choice. Existing unrelated working tree changes are preserved.
