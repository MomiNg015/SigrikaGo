# Tutorial Continue focus after dialogue

## Goal
Make Continue prominent using the existing contracting focus marker, shown only once NPC dialogue is fully rendered. This supersedes the weak halo after user review.

## Requirements
- Replace the previous halo with the shared four-corner contracting cue (1900ms repeat).
- Wait for actual TypewriterText completion for the current NPC bubble, including manual full reveal and reduced motion.
- Only show when Continue is enabled; absent/closing NPC dialogue does not block a standalone Continue.
- Hide during loading, history and exit overlays; preserve the original action/script timing and five-key layout.
- Reuse the existing measured keycap bounds, pointer transparency and reduced-motion static marker. No extra dimming.

## Acceptance Criteria
- [x] No marker during partial text, including an NPC move that finishes before long dialogue.
- [x] After full text, marker encloses Continue at desktop and portrait 390/320px.
- [x] Full reveal/reduced motion, identity changes, disabled/overlay states and real progression pass.
- [x] Focused unit/DOM suites, lint, build, built-CSS and docs checks pass.

## Technical Approach
Add an optional completion callback to TypewriterText and forward the bubble ID from NpcDialogue. Track the completed identity in TutorialBattleScreen and reuse TutorialInputFocus's measured marker-only continue mode. Remove the previous CSS halo and its CSS inventory changes. No new motion owner or dependency.

## Scope
Only Continue attention and text completion reporting. Existing action cues, normal battles, choices and unrelated WIP remain unchanged.

## Validation
- 198 unit/DOM/static tests across 12 files passed, including actual typewriter completion, reveal-all, reduced motion, unmount cancellation, new bubble identity and Continue action locks.
- Lint, production build, built-CSS contracts, generated-doc check and diff whitespace check passed. Existing public-asset placeholder/chunk-size build warnings remain.
- Headless Edge at 1440x900, 390x844 and 320x568 used actual TutorialBattleScreen/full CSS with an NPC move completing before a long line. Continue remained unmarked until the entire line rendered; cue used four correctly measured contracting corners without a dimmer. History hide/restore, Continue click, next-node same-text gating, reduced-motion static marker, standalone Continue and automatic-wait exclusion passed without page errors.
- Visuals inspected at 390px and 320px. Short 320x568 screens require scrolling existing content to bring the button into view; verification scrolls to the real target before checking its viewport-bounded marker.
- Browser evidence: .tmp/tutorial-continue-focus/verification.json and screenshots. Verification fixtures are temporary and make no account writes.
- The superseded CSS halo and its inventory additions were fully removed; production CSS has no delta from the task baseline.
