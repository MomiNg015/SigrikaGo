# Member Handbook Ensemble Puzzle

## Scope and signatures

`HouseCharacterGrid` owns the ordinary handbook puzzle; `LegacyHouseCharacterGrid` owns the existing corrupted presentation. `resolveHandbookPortrait(character, { itemEffects, user })` returns the effective source, costume style, dimensions and a fixed crop focal point. This is a handbook presentation adapter over `characterPortraitImageProps`, not a replacement for the shared portrait catalog.

## Rendering contracts

- Normal built-in portraits use nine lossless 832x1216 transparent WebP images under `/assets/characters/handbook-sprites/`. Baconbits uses the existing portrait. Equipped costumes, Denia candy, Sigrika corruption and custom URLs retain shared resolver priority and framing. Unknown aspect ratios use `contain`, never stretch.
- Desktop and portrait mobile use separate ten-piece convex partitions. Canonical character order is stable across ownership changes. More than ten characters paginate; missing characters produce non-interactive empty pieces.
- `insetHandbookPiece(piece, size, halfGap)` offsets edges in CSS pixels, inward for either vertex winding. Desktop half-gap is 1.5px; mobile is 1px. Do not add theme-color outlines. Owned pieces have theme gradients; unowned pieces have alpha-mask gray silhouettes and a question mark.
- The clipped native button owns the real hit area; its surrounding piece has `pointer-events: none`. Desktop fine-pointer hover uses the existing `translateY(-5px) rotate(-1deg) scale(1.02)` and an unclipped outer drop shadow. Reduced motion disables movement. Preserve scroll-end shadow gutters.
- Bright School resets button clip paths and image max widths with important declarations. The final bounded puzzle owner must explicitly restore its clip variable, borderless background and unconstrained image width. Put the image inside an art wrapper so direct button-child resets do not override it.
- Normal puzzle clicks open details and never select a sortie character. Mode selection is deferred by user request. The account's existing selected character remains authoritative.
- Unowned Baconbits opens an anonymous `ModalDialog`; it must not expose name, skill, wardrobe or voice. Other existing detail content remains available under the existing ownership rules.

## Detail carrier

Keep the existing skill, CV, description, music and wardrobe controls. Portal the detail overlay to `.app-shell` outside the handbook's scroll clipping. The full-body figure owns a fixed display frame independent of copy height, with visible paper overflow and viewport containment. Only the copy scrolls. Mobile keeps an upper figure reservation and reachable wardrobe/close buttons. Keep wardrobe layers above the detail overlay. `ModalDialog` owns Escape, keyboard containment and focus restoration.

## Validation

Geometry tests cover coverage, no overlaps, near-equal areas, safe focal regions, real-pixel gaps and reversed winding. House tests cover stable order, portrait precedence, anonymous details, no sortie selection, original detail actions and corrupted isolation. Browser-check 1440x1024, 1440x768, 390x844, 360x640 and 932x430: ten polygon hit targets, no horizontal overflow, scroll ends, hover/reduced-motion, full-body containment, wardrobe and focus return. Use `tests/e2e/fixtures/handbook-puzzle.html` to exercise production components without account writes.

Wrong: change the global 900x900 portrait catalog or clip the detail image inside the handbook.

Correct: use the local presentation adapter and portal the independent detail carrier.
