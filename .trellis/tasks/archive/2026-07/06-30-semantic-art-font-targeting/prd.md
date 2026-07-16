# Semantic Art Font Targeting

## Goal

Introduce the provided Latin/digit art font as a semantic, opt-in typography layer instead of a global UI font. The font should add atmosphere to selected player-facing display surfaces while preserving readability and future font replacement flexibility.

## Requirements

- Bundle `C:/codex/wuwafont/WuWa Lahai-Roi Regular.ttf` under `public/assets/fonts/`.
- Register the font with `@font-face` for ASCII letters and digits only: `A-Z`, `a-z`, and `0-9`.
- Do not globally replace the app font.
- Add semantic font tokens, not font-name-specific tokens:
  - `--font-display-accent`
  - `--font-numeric-accent`
- Add semantic opt-in classes:
  - `.text-display-accent`
  - `.text-rating-value`
  - `.text-clock-value`
- Apply the art font to all chess clock digit displays across desktop, mobile, spectator, and replay room surfaces, including main time, byo-yomi, and final byo-yomi.
- Apply the art font to every player-visible `rating` value.
- Use the art font for player-side atmosphere titles and short English labels where the existing UI treats the text as display chrome.
- Preserve the font's own lowercase glyph behavior. Do not add broad `text-transform: uppercase`.
- Keep usernames, admin surfaces, chat, announcement/body copy, form inputs, long rule text, and ordinary data tables on the default UI font unless a specific semantic class opts in.
- Do not apply the font to coins, prices, stock, probability, game counts, win/loss/draw stats, room codes, move counts, dates, timestamps, or non-rating leaderboard positions.

## Acceptance Criteria

- [ ] The font asset is available from `public/assets/fonts/`.
- [ ] Base CSS exposes semantic font tokens and classes.
- [ ] Clock digit selectors use `.text-clock-value` or an equivalent semantic selector contract on desktop and mobile.
- [ ] Player-visible rating values use `.text-rating-value` or an equivalent semantic selector contract.
- [ ] Player-facing decorative short English/display text uses `.text-display-accent` where appropriate.
- [ ] Admin and username surfaces are not globally affected.
- [ ] Lowercase English remains lowercase in DOM/text content and only changes visually through the font glyphs.
- [ ] Tests cover the CSS font contract and representative clock/rating markup.
- [ ] `docs/system-design.md` and relevant system-design pages document the contract, and `npm run docs:system-design` is run.

## Definition of Done

- Focused tests for affected markup/CSS pass.
- `npm run check` passes.
- System-design documentation is updated and regenerated.
- The semantic contract is captured in `.trellis/spec/frontend/component-guidelines.md`.

## Technical Approach

Use a whitelist opt-in model. Register the font once in the base CSS, expose semantic CSS tokens/classes, and add semantic class names to existing JSX/CSS surfaces for clock digits, rating values, and selected display chrome. Avoid global inheritance and broad exclusion rules so future font replacement only requires changing the token/font-face definition.

## Decision (ADR-lite)

**Context**: The supplied font is an art/display font with only English and digit glyph coverage. A global font swap would degrade readability and require many exclusions.

**Decision**: Use semantic opt-in classes for display accent, rating values, and clock values. Keep the font-family token names independent from the current font file.

**Consequences**: Implementation touches several UI surfaces, but the contract is explicit and future font replacement is localized to tokens/font assets. Some decorative display surfaces may need incremental opt-in later if product direction expands.

## Out of Scope

- Replacing body text, form text, chat text, announcements, or admin fonts.
- Applying the art font to all numbers.
- Changing Chinese typography.
- Adding a runtime font picker.

## Technical Notes

- Requirement discovery completed with grill-me Q&A in this session.
- Relevant files likely include `src/styles/base/foundation.css`, room timer components/styles, home/player plaque components, profile/resume/leaderboard/watch/feedback rating surfaces, style contract tests, and system-design docs.
