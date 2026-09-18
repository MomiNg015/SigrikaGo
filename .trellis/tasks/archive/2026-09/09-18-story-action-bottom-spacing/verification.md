# Verification

Real StoryPlayerModal with a three-choice fixture matching the reported screenshot, full global styles and typewriter disabled for deterministic rendering.

- 1280x900 and 1000x600: final button bottom remains 33px above outer modal edge (24px internal padding plus border and option gutter).
- 390x844: 24px bottom gap with 16px modal padding.
- 360x640 with 8 options: list scrolls; final option retains 23px gap at maximum scroll.
- 1000x600 with 8 options: content remains within the reserved action track.
- 66 focused tests, production build and built CSS contracts passed.
- Screenshots and logs: `.codex-run/story-spacing-*`.
