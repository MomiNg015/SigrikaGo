# Home guide highlighting performance regression

## Goal
Identify and remove guide-entry stalls while retaining actual component paint, full-bright narrated windows, A markers and positioned-before-visible dialogue.

## Evidence
- Current snapshot writes every computed property (546 including 137 custom properties) for every element and pseudo-element. Resume snapshot: 2,561,899 serialized characters / 139 nodes.
- Normal desktop resume entry shows repeated 328 ms and 301 ms long tasks. Steady targets also poll each display frame (~144 Hz here).
- Existing verification checked appearance and interaction, not snapshot cost or repeated invalidation.

## Plan
- Measure the same authored checkpoints before and after, including startup and steady state.
- Reduce snapshot work without changing computed appearance; avoid redundant entry/resize rebuilds and needless idle synchronization.
- Preserve input ownership, IDs, pseudo paint, dynamic content, source entry opacity, cleanup and first-frame positioning.
- Add meaningful snapshot/invalidation regression coverage; run complete home appearance checks and focused existing tests.
- Preserve unrelated WIP; update design/spec documentation and commit scoped changes.

## Acceptance
- [x] Explain cause using before/after browser evidence.
- [x] Remove repeated long snapshot work and substantially reduce snapshot size/cost.
- [x] All home checkpoints and 50 tour highlights retain appearance and behavior.
- [x] No NPC positioning regression; cleanup and invalidation tests pass.
- [x] Lint, focused tests, build and documentation pass.

## Root cause and prevention
- Coverage gap / implicit assumption: a pixel-correct computed-style copy was assumed cheap. Each node enumerated a live CSSStyleDeclaration and copied defaults plus inherited variables. No startup-copy budget was checked.
- First compression attempt placed all:initial inline; CSSOM expanded it back into hundreds of default longhands when properties were overridden. Keep the reset in one shared rule and iterate cached names.
- Root entry animation and initial ResizeObserver callbacks added redundant rebuilds; keep real content/size changes and descendant animation completion.
- Browser evidence: same settled resume, three runs each; original 275/288/296ms versus 66/58/57ms, serialized snapshot approximately 2.56m to 0.27m characters. CPU profiling identified live style enumeration/value reads as the hotspot. Performance is local, not an FPS promise for all devices.
- Verification: 15 DOM assertions; 15 checkpoint cases and 50 full-tour highlights; 3 normal-animation first-frame/retained-marker browser tests; lint, production build, built CSS checks and docs generation passed. A 600,000-character resume snapshot budget now guards against megabyte-sized regression.
