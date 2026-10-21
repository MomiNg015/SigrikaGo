# Stable mobile IRIS entry

## Request
The home IRIS database button moves substantially when touched on mobile and is difficult to activate.

## Scope
- Reproduce with the real IRIS component, home ancestors and production styles in a touch browser.
- Keep the viewport anchor and touch target stable throughout touch down, release and reopening.
- Preserve desktop placement, visual identity, dialog behavior and audio.
- Update the existing system-design contract and run the relevant browser/CSS checks.

## Acceptance
- Portrait 320/390px touch interactions keep the button bounds stable and open the dialog on the first tap, including a tap near the upper edge.
- Both ordinary and reduced motion remain usable; desktop hover retains its intended feedback.
- Only this fix and its checks/docs are committed; unrelated work is preserved.

## Outcome and validation
- Reproduced a 41.34px downward jump: the later Bright School mobile `:active:not(:disabled)` rule replaced the IRIS centering transform with `translateY(1px) scale(0.985)` at equal specificity.
- The existing entry owner now preserves its center in all phone pseudo-states and beats the generic selector by targeting the native button. Desktop motion is unchanged.
- Consolidated identical owner declarations to keep the CSS debt baseline unchanged or lower.
- Design-hook palette findings are false positives for this scoped fix: these are the existing IRIS-exclusive blue/green colors, explicitly protected by the button-color and system-design contracts. No colors were introduced or changed; no suppression was added.
- Five browser checks passed: 320/390px, normal/reduced motion, every interaction pseudo-state, upper-edge tap, reopening, and desktop hover/open behavior.
- 123 targeted unit/DOM/CSS checks passed; changed JavaScript lint, production build, built CSS contracts and system-design rendering passed.
- Existing unrelated profile and documentation WIP remains outside this commit.
