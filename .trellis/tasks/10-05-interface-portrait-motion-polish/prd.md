# Interface, Profile, Portrait, and Motion Polish

## Goal

Review and repeatedly refine the player interface until 2026-10-05 12:00 Asia/Shanghai. Beautify the self resume and social detailed profile, implement real character bust/half-body presentation in the hanging student ID, profiles, and battle information area, and improve purposeful interactions while preserving the Bright School campus notebook identity and fluid gameplay.

## Requirements

- Preserve the established paper palette, ink silhouettes, artwork, concise UI content, window title stickers, and familiar controls.
- Share correct character/costume resolution across all three portrait surfaces. Prefer existing standard sprites, preserve custom costume framing, and retain a safe legacy fallback.
- Improve profile spacing, hierarchy, portrait composition, rank/record summaries, bookmark tabs, and readable character records on desktop and portrait phones.
- Audit home, player windows, handbook, commerce/settings/social, and room interactions. Use short state-related transform/opacity motion and immediate pressed feedback; respect reduced motion and coarse pointers.
- Keep gameplay, timers, board geometry, skill effects, and authored cinematics dependable.
- Preserve pre-existing uncommitted work and coordinate disjoint file ownership across agents.
- Update docs/system-design.md for changes; render its HTML after consolidation.

## Assumptions and Decisions

- The user is away and explicitly delegates design choices. Derive choices from PRODUCT.md, DESIGN.md, project specs, current implementation, and browser evidence without requiring further confirmation.
- Use existing assets and framework capabilities rather than adding a motion dependency or generating unrelated art.
- Keep current profile content and actions, including the replay restriction during battles and independent overlay lifecycle.
- Continue refinement and verification through noon; do not equate the first passing tests with completed visual review.

## Acceptance Criteria

- [x] Student ID, self/social profiles, and battle info show appropriate character busts or half-body sprites with costume precedence and stable sizing.
- [x] Profiles have coherent campus styling, readable summaries, and reachable last records/controls on 360/390/412px phones and desktop.
- [x] Long names, empty records, many records, mode switching, keyboard focus, portrait failures, and reduced-motion interactions work.
- [x] Motion is consistent, responsive, scoped away from the board/skill effect owners, and does not delay user actions.
- [x] Lint, applicable unit/DOM/style tests, production build, built CSS contracts, and browser regression evidence pass.
- [x] Interface audit, visual captures, system design updates, and session records document verified behavior and any limits.

## Out of Scope

- Publishing, production database mutations, changing game rules, wholesale theme replacement, and unrelated pre-existing tasks. Existing isolated test databases may be seeded for real application validation.

## Research References

- research/portraits.md
- research/profile.md
- research/motion.md

## Validation Plan

Use existing Playwright fixture infrastructure and real components/CSS for desktop/mobile captures. Exercise profiles, student ID and both solo/team battle panels with representative characters and costumes. Review the broad player surfaces, verify natural scrolling and quick interactions, and run the project quality gate once implementation stabilizes.
