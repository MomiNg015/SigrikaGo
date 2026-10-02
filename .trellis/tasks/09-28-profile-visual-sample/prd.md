# Profile visual sample

## Goal
Create a reviewable standalone redesign. Latest approved scope expands to a cohesive home, profile, friends and inventory sample suite. Keep the user's hand-drawn home assets. Do not use impeccable. Production components remain unchanged.

## Approved expansion: coherent redesign suite
Entry: docs/design-samples/campus-refresh.html. Unlike previous iterations constrained to old modal geometry, this is an explicitly authorized new shared visual system: warm paper, restrained pencil edges, sage and peach notes, fewer nested cards, clear content hierarchy. Home retains the original hanging student ID, match illustration, handbook, mascot, practice art and all six utility illustrations. No home frame/background is copied into windows. Profile, friends and inventory share the new paper window chrome and navigation. Mock interactions include window navigation, mode tabs, friend filter/search/profile, item category/selection and explicit demo feedback for nonimplemented actions. No network/API calls or real game mutations.

### Suite validation
- Desktop 1440x1000 and portrait 390x844 inspected for all four scenes.
- Search no-results, online filter (3 entries), recruitment category (3 items), selected detail, window switches and close tested.
- Browser checks found no visible broken images or horizontal document/dialog overflow.
- Node syntax check, project lint and system-design generation passed.
- Screenshots: refresh-home.png, refresh-profile.png, refresh-friends.png, refresh-inventory.png.
- All four scenes use real local artwork; fixture copy and quantities are explicitly illustrative.

## Direction
Cream paper, forest-green editorial typography, restrained vermilion accents, a large existing character portrait, and a coherent two-column dossier. Alternate directions considered: modern minimal and portrait-first showcase. Default to the campus dossier unless the user steers otherwise.

## Confirmed visual direction
User selected campus paper dossier, then required ALL elements to be hand drawn. Latest correction: do NOT reuse the home background/frame, and stay consistent with other windows. The revised sample follows panels-modals.css and window-title-stickers.css: cream paper, dark-brown outline, compact rounded corners, hard offset shadow, external title sticker, pink close button. Seeded Rough.js strokes keep controls and separators hand drawn. No impeccable skill or global design-system changes.

## Requirements
- Reuse local character art and fonts; no remote dependencies.
- Preserve the concepts of identity, three game modes, rank, rating, total games, win rate, recent results and per-character records.
- Include self/social preview switches and portrait mobile layout.
- Label fictional statistics as sample data; actions only demonstrate local feedback.
- Keep all sample styling and behavior isolated in docs/prototypes/profile-dossier.html.

## Acceptance
- Desktop and 390px portrait screenshots inspected.
- Mode/context switches, empty state and close/reopen work.
- No horizontal page overflow or broken image loads.
- System-design entry documents the sample and HTML is regenerated.

## Scope boundaries
No API calls, production UI replacement, game logic, or unrelated WIP changes. Existing src/modals/ProfileResumeView.jsx has pre-existing edits and must be preserved.

## Spec review
This standalone visual exploration introduces no production contract. Existing specs remain unchanged.

## Whole-window comparison, latest revision
Rendered current Friends, Settings, Leaderboard, Warehouse and Resume components through the existing local fixture with the full production stylesheet chain. Fixture data is synthetic; Warehouse was checked in empty state. Observed actual winners: left pastel bookmark tabs, cream rounded-square close control, graph-paper shell, dashed header separator, dark outlined cards with hard shadows, Microsoft YaHei body/number font and handwriting only for decorative headings/tabs. Earlier pink close-button and all-handwriting assumptions were wrong because they were based on an intermediate CSS layer.

Sample now follows those complete window conventions and uses a horizontal identity card. It still uses no home background/frame assets and remains separate from runtime components. Existing bookmark SVG geometry is reused for consistency; no global design hooks are changed. Palette and font warnings for these runtime-derived choices are contextual false positives.

## Validation
- Browser inspected at 1440x1000 and 390x844: no horizontal overflow; all character images loaded.
- Self/social switch, mode switch, empty/populated state and close/reopen verified in browser.
- `npm run lint`, `node --check docs/prototypes/profile-dossier-sketch.js`, `npm run docs:system-design` passed.
- Screenshot: desktop-preview.png. Preview: http://127.0.0.1:8767/docs/prototypes/profile-dossier.html.
- Automated palette/font/radius warnings are contextual false positives for this sample: the dark-brown ink and close-button pink come from existing modal CSS, the handwriting alias points to the existing local font, and slight corner asymmetry is intentional hand-drawn geometry. No hook settings were changed.


## Latest sample revision: restrained copy and portrait layout
- Removed invented dialogue, slogans, decorative notes and item descriptions from docs/design-samples/campus-refresh.*. Preserved original home illustrations.
- Portrait layout stacks identity/handbook, match art and two-column utility entries. Dialog header stays fixed while its body scrolls; mobile inventory uses two columns and top detail.
- Browser checked home at 390x844 and 1440x1000; profile, friends and inventory at 360x640. Short-screen profile scroll reached 198px with header still at 24px, close control visible, and 360px document width without overflow. No broken images observed.
- Screenshots: refresh-mobile-home-v2.png and refresh-mobile-profile-v2.png.
- JavaScript syntax check and system-design HTML generation passed.

## Profile-only density revision
- Scope: only profile sample layout; no additional copy, runtime changes or new production spec.
- 850px desktop sheet, larger portrait, continuous metrics strip and compact record rows.
- Verified 360x640 body has no horizontal overflow and last row reaches viewport at scrollTop 51; header remains fixed. Screenshots: profile-compact-desktop.png and profile-compact-mobile.png.
