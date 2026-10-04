# Portrait strip review plan

This is a read-only integration review prepared before the replacement implementation is ready. The items below are regression boundaries, not findings against unfinished code.

## Highest-priority integration boundary

`HomeOnboarding.activateTarget` calls `element.click()` on `[data-home-guide="sigrika-card"]`, immediately advances, and then waits for `.character-details-modal`. A mobile strip that only expands on this activation leaves the guide waiting forever. Preserve an explicit direct-detail guide path and exercise the real onboarding/handbook combination at a narrow viewport. The existing generic target-button DOM test alone does not cover this interaction.

## State and interaction review

- Preserve the supplied `characterListView` order, which is already sorted by the shared catalog owner. Remove the puzzle's fixed `PORTRAIT_ORDER`; do not sort by ownership or mutate the input.
- Cover catalog lengths 0, 1, 10 and 11, plus a later catalog shrink while on page 2. Clear stale expansion when changing pages. Keep pagination controls reachable after the last expanded mobile strip.
- A touch gesture produces focus before click. Avoid expanding in `onFocus` and then interpreting the same gesture as a second activation that opens details. Touch expansion and the explicit detail control must remain separate.
- Fine-pointer hover and keyboard focus should reveal equivalent preview geometry. All real strip/detail controls need native keyboard semantics and accessible names; hidden controls must not remain in the tab sequence.
- The full-body detail carrier uses `ModalDialog` to return focus to its opening element. Do not unmount that trigger on hover-leave while the dialog is open. Mobile expansion should remain stable while its detail is visible.
- Keep cancellation badges outside the portrait clip and isolated from expansion/detail activation. Enter/Space on the cancellation control must never also activate the parent strip.

## Rendering and ownership review

- Reuse `resolveHandbookPortrait`: equipped costume, Denia candy, custom portrait URL and Sigrika corruption have higher priority than handbook defaults. Preserve costume `scale`/`translate`; custom aspect ratios remain contained.
- Unowned portraits retain alpha-mask silhouettes and question marks. Unowned Baconbits must not expose its name in visible text, accessible names, tooltips, detail copy, wardrobe controls or voice playback. Its anonymous dialog closes back to the strip trigger.
- The normal character panel remains a direct `HouseModal` child. Decorations, bookmark keys, the corrupted archive and detail copy/music/voice/wardrobe operations remain unchanged. Normal strip actions never select an account character.
- Mobile uses the existing handbook scroll owner with shadow clearance and no document overflow. Check first and last expanded strips at 390x844 and 360x640.
- Verify the final Bright School cascade: important clip-path and image max-width resets previously suppressed native clipping. New strip owners must beat those exact rules without broad theme resets.
- Reduced motion keeps the expanded state and explicit detail action while disabling width/height/portrait transitions.

## Final evidence requested from the root verification pass

- Focused handbook, portrait adapter, candy cancellation, full-body detail and onboarding tests.
- Production lint/build/stylesheet contracts, including the normalized CSS debt delta and import map.
- Actual desktop and mobile screenshots showing resting/expanded first and last strips, a locked character, and the preserved full-body detail transition.

No heavy tests, builds or browser sessions are run by this review agent until the root explicitly requests them. The root owns documentation/spec updates and final verification.

## Implementation review result

The final source preserves incoming catalog order, ten-per-page pagination, anonymous Baconbits, the corrupted branch, shared portrait precedence, candy cancellation, and the independent full-body detail carrier. Obsolete polygon helpers have no remaining runtime/script/test references.

The implementer addressed the review findings: programmatic guide activation opens details directly; old pointer-type state cannot suppress later keyboard preview; pointer leave preserves a focused preview; mobile expansion retains complete headwear; nonstandard expansion uses containment while the closed view anchors the face; and mobile detail actions transfer focus to a stable primary trigger before opening the dialog so rotation does not break focus restoration. The real handbook order assertions and mobile detail-focus integration coverage were updated.

No blocking code defect remains from this read-only review. The implementer reports 81 focused tests passing; the root owns independent final test/build/stylesheet/onboarding/browser evidence. Desktop and mobile snapshots captured by the root were visually inspected and match the ordered strip composition and coherent expanded bust treatment.
