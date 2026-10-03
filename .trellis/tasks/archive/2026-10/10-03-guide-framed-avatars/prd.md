# Fixed guide avatar and dynamic dialogue

## Goal
Implement the user's selected reference: a fixed square speaker portrait on the left, speaker name and progressively typed text in a separate paper panel on the right. Apply to teaching and home onboarding.

## Requirements
- Portrait crop, scale and top alignment remain fixed while text grows.
- Preserve dynamic dialogue height, typewriter timing, authored expressions, skip/reveal and target actions.
- Use existing 256px expression avatars and matching preloads. Preserve legacy and special-form fallbacks.
- Home keeps a detached, fixed-size portrait outside its scroll panel.
- Desktop and 390/360px portrait phone verification; synchronize design and contracts.

## Acceptance Criteria (verified)
- [x] During real typing, text panel grows while avatar dimensions and its relative top position stay constant.
- [x] Name appears immediately above body text; no horizontal overflow or blocked targets.
- [x] Speaker/expression changes and image failure/retry still work.
- [x] Focused DOM and browser checks pass; source lint and production CSS checks pass.

## Out of Scope
Story-stage layout, plot, game rules, new artwork, other portrait surfaces.

## Technical Approach
Keep the existing NpcDialogue grid and guide position owners. Frame the portrait in a fixed square aligned to the grid top. Move paper treatment onto the text column. Use avatar variant in teaching and home resolvers/preload lists. Remove home dialogue-height coupling; measure the full panel only for target avoidance.
