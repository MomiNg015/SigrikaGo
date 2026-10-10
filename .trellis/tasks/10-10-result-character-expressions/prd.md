# Result character expressions

Select character-specific victory and defeat reactions from the existing default expression packages; draws use surprised. Apply to the local result character (spectators see the winner reaction); completed/incomplete capture challenges use victory/defeat. Keep special corrupted-duel result without portrait. Use the same-character effective frozen/costume/candy portrait as a one-time error fallback; do not change gameplay appearances. Preload three result reactions only for visible room characters, retaining hidden-team privacy. Baconbits has no expression package and currently retains its portrait, pending the user's optional choice about creating new assets.

Validate expression availability, actual result rendering/outcomes, failure/reset behavior, visible-only preloads, desktop/portrait fit and existing lifecycle tests. Sync system design and its HTML.

## Completed validation

- Nine actor mappings use existing authored full-body sprites; all three result reactions per actor exist on disk. Unsupported actors retain their effective source.
- 82 focused tests passed: all nine actors in the actual result modal across win/loss/draw, spectator victory, same-actor frozen-image recovery/reset, hidden-team preload privacy, capture challenge and lifecycle behavior.
- Browser decoded and contained all 27 reactions on desktop 1440×900 and portrait 390×844 (54 cases); inspected victory/defeat/draw screenshots.
- Full ESLint, production build, built CSS contracts and regenerated system-design HTML passed. Updated the existing login candy-art assertion to the native handbook animation selected by the earlier Denia sizing fix.
