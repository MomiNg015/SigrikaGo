# Replace Home Main Panel Background Assets

## Goal

Replace the Bright School home main panel background with the two provided panel images while preserving the current desktop and mobile home layout behavior.

## Requirements

- Use `desk_main_bg.webp` for desktop and narrow desktop home main panels.
- Use `mobi-main-bg.webp` for phone portrait/mobile home main panels.
- Keep the existing main panel content, responsive layout, and localized micro-desktop horizontal scrolling behavior intact.
- Store the new image assets with the existing home art assets so they are served from stable public asset paths.
- Update the relevant system-design documentation and regenerate `docs/system-design.html`.

## Acceptance Criteria

- [ ] `main.home-screen.home-terminal-screen > section.home-main-panel.home-terminal-main` renders the provided desktop background on desktop.
- [ ] The same element switches to the provided mobile background on portrait mobile.
- [ ] The background scales with the panel using CSS `background-size`/positioning rather than fixed dimensions.
- [ ] Existing home stage, player plaque, manual entry, match entry, utility buttons, and responsive breakpoints continue to use their current layout rules.
- [ ] Focused tests cover the new asset references and responsive CSS contract.
- [ ] `npm run docs:system-design` has been run after documentation updates.

## Definition of Done

- Focused home/style tests pass.
- `npm run docs:system-design` completes.
- The changed files are limited to assets, Bright School home CSS/tests, and system-design docs unless implementation inspection reveals a necessary adjacent update.

## Technical Approach

Copy the provided WebP files into `public/assets/home/`, then update `src/styles/themes/bright-school/home/main-panel-material.css` to use the desktop background as the main panel surface. Add a mobile portrait override in the Bright School mobile home shell CSS so phones use the taller mobile panel artwork. Keep existing pseudo-elements and content `z-index` behavior only if they do not obscure the supplied artwork.

## Decision (ADR-lite)

**Context**: The selected browser element is the Bright School home main panel, whose material layer currently paints gradients after `canvas-purge.css`.

**Decision**: Treat the supplied images as public home art assets and attach them to the main panel CSS, with a mobile media override rather than new React markup.

**Consequences**: This keeps the change in the theme style layer and avoids component churn. Future replacement artwork can use the same asset paths or CSS selectors.

## Out of Scope

- Redesigning the home grid, player plaque, manual entry, match entry, or utility buttons.
- Changing non-Bright-School themes.
- Adding new controls or animations.

## Technical Notes

- User supplied source assets:
  - `C:/codex/image/main/desk_main_bg.webp`
  - `C:/codex/image/main/mobi-main-bg.webp`
- Relevant style files inspected:
  - `src/styles/themes/bright-school/home.css`
  - `src/styles/themes/bright-school/home/main-panel-material.css`
  - `src/styles/themes/bright-school/home/canvas-purge.css`
  - `src/styles/themes/bright-school/mobile/home-shell/main-stage.css`
  - `src/styles/mobile-adaptive/home-narrow-desktop/*.css`
- Relevant tests inspected:
  - `src/home/HomeScreen.test.jsx`
  - `src/styles/themeContract.test.js`
  - `src/styles/hudComponents.test.js`
- Relevant specs read:
  - `.trellis/spec/frontend/index.md`
  - `.trellis/spec/frontend/component-guidelines.md`
  - `.trellis/spec/frontend/quality-guidelines.md`
  - `.trellis/spec/frontend/directory-structure.md`
  - `.trellis/spec/guides/index.md`
  - `.trellis/spec/guides/code-reuse-thinking-guide.md`
  - `.trellis/spec/guides/cross-layer-thinking-guide.md`
