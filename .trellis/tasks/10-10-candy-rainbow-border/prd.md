# Candy effect rainbow borders

Remove circular candy markers from ordinary/legacy handbook character cards. Show the active candy state with a continuous rainbow perimeter on handbook diagonal strips and match/team selection ID cards. Use the existing four candy-effect identities, only for owned/available cards, with no effect-state mutation.

Keep cancellation as a separate labelled development control, not a round icon. Preserve click/focus/touch/selection behavior. Borders follow card/strip geometry and are pointer transparent; reduced motion uses a static rainbow rim. Share the effect registry while preserving houseStats exports. Update system design and verify desktop/portrait, active/inactive, isolated cancellation and selected stamps.

## Validation

- Completed the shared registry and perimeter component; removed ordinary and legacy round markers, retained independent development cancellation, and integrated regular/team ID cards.
- 103 focused Vitest tests passed. Two Playwright desktop/portrait hollow-perimeter and reduced-motion regressions passed. Manual browser inspection covered both card and handbook surfaces, all four active effects, inactive cards, moving gradients, and selection stamps.
- Full ESLint, production build, built CSS contracts, and system-design HTML generation passed.
- The broader style contract has 56 passing assertions and one failure in the pre-existing `modals/onboarding-story/standard-sprite.css` size guard (6184 bytes). Current-task CSS owners stay below 6000 bytes. No unrelated CSS debt/baseline was changed.
