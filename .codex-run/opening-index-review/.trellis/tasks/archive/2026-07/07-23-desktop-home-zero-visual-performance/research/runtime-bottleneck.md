# Desktop home runtime bottleneck research

## Repository evidence

- `src/styles/themes/bright-school/home/utility-toolbox/toolbox-grid.css` puts `drop-shadow`, `will-change`, and transform/filter transitions on `.utility-entry-art`; desktop hover transforms that same filtered image.
- `src/styles/themes/bright-school/effects/home-image-entry-buttons.css` keeps large featured-entry shadows on the image while parent/child transforms participate in hover and active states.
- `src/styles.css` imports lobby, room, modal, commerce, mobile, HUD, Tailwind, and theme entries into the main CSS bundle. Full route splitting is valuable but too broad for a zero-visual-change first pass.
- `src/app/App.jsx` rebuilds route props on overlay state updates, while `src/app/AppRoutes.jsx` recreates home action callbacks and `HomeScreen` lacks a memo boundary.
- `src/shared/preloadAssets.js` already separates critical home resources from deferred resources. Its image loader waits for `load`, sets `decoding = "async"`, but does not call `decode()`.

## Chosen first-pass boundary

- Keep the exact visual contract and move transforms to semantic wrappers around static filtered images.
- Await decode only for critical blocking image loads; retain deferred secondary-surface loading.
- Stop overlay-only updates from descending into the home tree.
- Measure and consider global CSS route splitting as a later task after this lower-risk pass.

## Replacement and rollback constraints

- Do not pre-bake shadows; replacement images remain plain transparent WebP/PNG resources.
- Wrapper markup and CSS can be reverted independently without changing asset files.
- Existing mobile-specific interaction rules must continue to target the semantic wrapper or explicitly preserve their current no-motion behavior.
