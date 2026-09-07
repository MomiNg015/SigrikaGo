# Campus home and handbook polish — first round

## Goal
Polish the home screen and member handbook as one campus club world, preserving the existing raster art, playful outlines, stickers, shadows and interaction flows.

## Accepted scope
- User approved the first round of the preceding review and requested a new branch.
- Branch: `codex/campus-home-handbook-polish`, created from the current checkout with unrelated WIP preserved.
- Home: refine composition and connect header controls to the stationery language without replacing illustrations or changing navigation.
- Handbook: reinforce notebook identity, page labels and deployed-character treatment without altering selection, detail dialogs, unavailable-character effects or special corrupted presentation.
- Desktop and portrait phone layouts must remain usable; existing 44px touch targets and motion preferences remain protected.
- Changes must be bounded and independently reversible.

## Out of scope
Other windows, gameplay, admin UI, character art regeneration, new features or pushes.

## Acceptance
- [x] Home and handbook receive visible, campus-specific refinements.
- [x] Existing art and functional controls remain intact.
- [x] Desktop and portrait rendering checked with a documented limitation if live browser cannot connect.
- [x] Relevant tests, lint, CSS budget and build checks pass.
- [x] System-design entry and generated HTML updated.

## Technical notes
Existing worktree is dirty. Do not revert or stage unrelated changes. Use focused theme owners and semantic component classes; preserve the final mobile safety layer.
Previous review browser attempts returned an empty page despite localhost HTTP 200; resolve or use an isolated render verification workflow before claiming visual success.

## Open questions
None blocking; direction and first-round scope were accepted in conversation.

## Second-round feedback (2026-09-07)
- Remove the activity-room label, ownership/member count and cramped sortie stamp. Restore the original flag presentation.
- Future beautification must not invent helper text, counters or decorative labels; record this rule in PRODUCT.md.
- Limit new design work to handbook content: center portraits above a separate name/action row, use responsive desktop columns and two portrait-phone columns, and tighten the decoration section.
- Check 320px, 390px, tablet and desktop rendering, plus character selection, separate detail opening/closing, decoration selection and dismissal. Keep corruption and item badge behavior intact.
- Verified at 1440x1000, 768x1024, 390x844 and 320x720 using the real components with synthetic account data. Names fit; portraits/actions do not overlap; roster scrolling and all listed controls work. Final previews: `.tmp/handbook-round2-1440.png` and `.tmp/handbook-round2-390.png`.
- `npm run check` passed all 351 test files / 2504 tests, lint, asset/snapshot checks, build, built CSS validation, production config and documentation generation. Three small CSS owners respect the 6000-byte file limit. The import-test hook's color findings concern unchanged test fixtures; no design waiver was added.
- Save only this task's changes in a local commit under the active workflow. Mixed documentation/spec files must be staged by owned content, preserving all unrelated WIP. Visual iteration can continue on this branch.

## Implementation review
- Two focused theme owners; no raster assets or gameplay changes.
- The asymmetric small-radius paper corners intentionally implement the accepted stationery direction; design-hook radius warnings are contextual false positives, not suppressed. Hook color warnings in the existing theme contract test concern pre-existing assertions rather than new palette choices.
- Local Chrome with `--no-proxy-server` resolves the earlier blank-preview issue. Screenshots use real components, bundled fallback characters and synthetic account data; they are not a live account walkthrough.
- Desktop 1440px and portrait 390px/320px rendered without horizontal document overflow. Existing phone roster density, hidden name labels and deployment hit-area geometry are preserved.
- Full check passed lint and 2503 tests, with only generated-doc freshness failing. After successful regeneration, all 3 documentation tests passed; portrait validation, admin snapshot validation, production build, built CSS validation and production configuration validation also passed.
- Final screenshots are in `.tmp/campus-home-after.png`, `.tmp/campus-house-after.png`, `.tmp/campus-home-mobile-after.png` and `.tmp/campus-house-mobile-after.png`.
- Implementation is ready for user visual feedback. No commit or push was made; task remains open for the requested trial round.
