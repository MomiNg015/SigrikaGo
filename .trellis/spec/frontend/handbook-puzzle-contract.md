# Member Handbook Diagonal Portrait Strips

## Scope and signatures

`HouseCharacterGrid` owns the ordinary handbook strips; `LegacyHouseCharacterGrid` owns the existing corrupted presentation. `resolveHandbookPortrait(character, { itemEffects, user })` returns the effective source, costume style, dimensions and a fixed crop focal point. This is a handbook presentation adapter over `characterPortraitImageProps`, not a replacement for the shared portrait catalog. The former polygon-puzzle contract is superseded by the user's ordered strip requirement; the filename remains a historical reference.

`handbookStripPage(characters, page)` preserves input order, clamps the page and returns `{ pages, currentPage, roster }` with at most ten characters. `handbookStripArtStyle(portrait, size, { mobile, expanded, count })` preserves the portrait aspect ratio, uses a face focal anchor at rest, and shows standard full-body art on desktop or a headwear-safe bust on mobile. Nonstandard expanded art uses a contained frame; Baconbits uses its existing alpha bounds for a compact mobile mascot.

## Rendering contracts

- Normal built-in portraits use nine lossless 832x1216 transparent WebP images under `/assets/characters/handbook-sprites/`. Baconbits uses the existing portrait. Equipped costumes, Denia candy, Sigrika corruption and custom URLs retain shared resolver priority and framing. Unknown aspect ratios use `contain`, never stretch.
- Preserve the received catalog order, including backend `sortOrder`; do not maintain a separate portrait order or reorder by ownership. More than ten characters paginate. Empty slots are not interactive.
- Desktop uses one left-to-right row; narrow viewports use one top-to-bottom column with slanted internal paper seams. Keep original artwork upright and proportional, with thin neutral gaps and muted paper/character-color backgrounds. Unowned strips use alpha-mask gray silhouettes and a question mark. Do not add colored borders or radial shine.
- Fine-pointer hover expands the current strip's width on desktop or height on narrow viewports. Keyboard focus previews the same composition. Mobile preserves usable neighboring row heights and allows natural board growth inside the existing handbook scroller. Expansion reveals a coherent bust or full-body portrait; it does not rotate/lift the slice. Reduced motion preserves the final expanded layout and disables animation.
- `.handbook-modal > .handbook-puzzle-panel` owns `min-height: 0` and vertical scrolling in the final theme layer. The mobile board is taller than its panel; do not allow the board to paint beyond the paper window. The project's global reduced-motion contract may compute a 1ms important duration even when the local owner sets `transition: none`; assert numeric effective durations at most 1ms, rather than exact string `0s`.
- Native clipped buttons own real hit areas. Verify first/last slices and neighbors rather than relying on bounding-box clicks. Bright School important button states must be explicitly overridden by the final bounded strip owner, including hover/focus/active backgrounds and transforms. Keep costume/image transforms inside an art wrapper so direct button-child resets cannot override them.
- Touch activation expands first and exposes an explicit detail action. Keyboard and programmatic activation must still open details; `HomeOnboarding.activateTarget` uses `element.click()` on `[data-home-guide="sigrika-card"]` and requires the detail dialog for the next step. Do not make that programmatic click stop at a preview. Preview focus must not cause the first touch click to accidentally open details.
- Details never select a sortie character. Mode selection is deferred by user request. The account's existing selected character remains authoritative. Keep effect cancellation controls separate from portrait activation and preserve page/orientation/roster reset behavior.
- Unowned Baconbits opens an anonymous `ModalDialog`; it must not expose name, skill, wardrobe or voice. Other existing detail content remains available under the existing ownership rules.

## Detail carrier

Keep the existing skill, CV, description, music and wardrobe controls. Portal the detail overlay to `.app-shell` outside the handbook's scroll clipping. The full-body figure owns a fixed display frame independent of copy height, with visible paper overflow and viewport containment. Only the copy scrolls. Mobile keeps an upper figure reservation and reachable wardrobe/close buttons. Keep wardrobe layers above the detail overlay. `ModalDialog` owns Escape, keyboard containment and focus restoration.

## Validation

Behavior tests cover input order, ownership-independent placement, preview dimensions, touch/programmatic activation, effect-button isolation and extra/missing roster handling. House tests cover portrait precedence, anonymous details, no sortie selection, original detail actions and corrupted isolation. Browser-check 1440x1024, 1440x768, 390x844 and 360x640: ten strip hit targets, no horizontal overflow, first/last expansion and scroll ends, hover/focus/reduced-motion, proportionate art, full-body details, wardrobe and focus return. Run the real home-onboarding fixture on desktop and mobile so its programmatic activation is covered. Use `tests/e2e/fixtures/handbook-puzzle.html` to exercise production components without account writes; its URL is retained for compatibility.

Wrong: change the global 900x900 portrait catalog or clip the detail image inside the handbook.

Correct: use the local presentation adapter and portal the independent detail carrier.
