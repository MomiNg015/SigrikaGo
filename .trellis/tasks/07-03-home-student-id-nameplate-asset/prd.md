# Home Student ID Nameplate Asset

## Goal

Create a GPT Image 2 generated, hand-drawn student-ID-style nameplate shell for the existing Bright School home player plaque, then make it directly usable in the app without baking dynamic text into the image.

## Requirements

- Generate a finished raster asset for the existing home player plaque.
- Preserve the existing plaque content model:
  - left character portrait area,
  - middle `UserIdentity` username/nameplate area,
  - right match-mode rank/rating stats area.
- The image must have a clear hand-drawn border and a student-ID / campus-card feel.
- The image must leave clean, low-noise interior safe zones for the current DOM-rendered avatar, username, mode names, ranks, and ratings.
- Apply the asset on both desktop and mobile Bright School home plaque layouts.
- Keep existing content dynamic, accessible, and test-covered.
- Update system design documentation and regenerate `docs/system-design.html`.

## Acceptance Criteria

- [ ] A reusable image asset exists under `public/assets/home/`.
- [ ] The generated prompt is saved for traceability.
- [ ] Bright School home plaque CSS uses the new asset without removing the existing content layout.
- [ ] Desktop and mobile plaque layouts still reserve distinct avatar, name, and stats regions.
- [ ] Static CSS/markup tests cover the asset hook and import contract.
- [ ] `docs/system-design.md` records the new home plaque asset contract.
- [ ] `npm run docs:system-design` completes.

## Definition of Done

- Focused tests for home/theme CSS pass.
- The generated asset can be referenced directly by the app.
- The final implementation avoids unrelated home layout, gameplay, or broad theme refactors.

## Technical Approach

- Use `gpt-image-2` prompt engineering and the local generation script, with the model output converted/cropped only if needed for the wide plaque ratio.
- Integrate the result as a Bright School plaque background image on `.home-player-plaque.tactical-id-card`.
- Keep CSS grid columns and current DOM text unchanged so dynamic user content remains readable.
- Prefer a WebP runtime asset for performance, with a PNG source retained if needed.

## Decision (ADR-lite)

**Context**: The user asked for a student-ID-style hand-drawn plaque based on the current home plaque content, with space reserved for existing content and a result that can be used directly.

**Decision**: Treat the image as a card-shell background asset, not as a text-composited screenshot. Existing React markup continues to render avatar, username, ranks, and ratings.

**Consequences**: The image can be reused across real users and responsive states, while the CSS must protect text readability over the decorative asset.

## Out of Scope

- Replacing `UserIdentity` reward username nameplates.
- Changing lobby data, ranks, ratings, game modes, or user profile behavior.
- Redesigning home stage layout, match entries, utility toolbox, or room UI.

## Technical Notes

- `src/home/components/PlayerPlaque.jsx` renders `.home-player-plaque.tactical-id-card` with the avatar, `UserIdentity`, and `.plaque-stats`.
- Bright School plaque CSS currently lives under `src/styles/themes/bright-school/home/student-id-card/`.
- Desktop plaque width is constrained by `.home-player-zone` at `clamp(390px, 36vw, 470px)`.
- Mobile portrait keeps the same content regions through `themes/bright-school/mobile/home-shell/player-plaque.css` and `mobile-adaptive/bright-school-portrait/home-player-plaque.css`.
- Relevant specs read: `.trellis/spec/frontend/css-architecture.md`, `.trellis/spec/frontend/quality-guidelines.md`, `.trellis/spec/guides/index.md`.
