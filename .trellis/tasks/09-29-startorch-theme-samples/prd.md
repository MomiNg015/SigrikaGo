# Startorch technology theme samples

## Goal
Explore a second player-facing theme inspired by Startorch Academy. The user explicitly requested samples first; production integration follows their visual selection.

## Revision selected by user
The first round was rejected for looking like a tool website rather than a game. The user selected a science-fiction command chamber. Deliver one stronger lobby first: generated environmental art, central holographic table, mechanical architecture, tactical menus, portrait layout. Keep previous files for comparison. Entry: docs/design-samples/command-center.html. Generated asset and prompt remain within the sample directory. Mode, character, appearance and local room form flows were checked with Edge at four viewport sizes; no production changes.

## Scope
- Three distinct directions: daylight academy, deep-space terminal, orbital observatory.
- Each includes lobby, 13-line battle and character handbook previews, plus an appearance-settings preview with campus first and technology second.
- Desktop and portrait mobile. Existing local character artwork. Local demo interactions only.
- Preserve all unrelated working-tree changes; no admin or production theme changes.

## Acceptance
- All directions and pages can be switched in a standalone browser preview.
- Character selection, mode selection, board placement/reset and appearance preview work locally.
- Verify desktop and 390px portrait rendering, images, overflow and browser errors.
- Update system-design entry and regenerate HTML.

## Research
- Official geography: https://www.taptap.cn/moment/750669356542725016
- Official academy website announcement: https://www.taptap.cn/moment/748580829894018223
- Visual interpretation: white architecture, green wayfinding, circular structures and a research-campus atmosphere. These inspire original UI geometry; no external image dependency.
- Existing docs/design-samples/campus-refresh.html establishes standalone sample convention and local artwork paths.

## Pending decision
User chooses the visual direction after reviewing concrete samples. Integrating the chosen design into the second runtime theme is outside this preview delivery.

## Delivery and checks
- Delivered docs/design-samples/startorch.html with isolated CSS/JS and startorch-notes.md.
- Playwright using installed Edge: 24 screenshots across three directions, four pages and two viewports; no image failures, horizontal overflow or page errors. Placement/reset, character selection and Escape dismissal passed.
- Reviewed desktop daylight/deep-space/orbit and mobile orbit screenshots; reduced mobile art clipping and added a visible black-stone edge on the dark board.
- node --check and npm run docs:system-design passed. Runtime files and unrelated WIP unchanged.
- New palette/font and dark-stone edge colors are intentional for this separately requested technology-theme exploration; Bright School hook palette findings do not apply to the prototype. No suppressions added.
