# Guide composition prototype validation — 2026-10-02

Scope: `docs/prototypes/character-sprites/guide.html` and its offline authoring data. No production JSX/CSS, API, database, source character images, or authored expression assignments changed. This is 11 representative situations, not a replacement tutorial engine or a complete home tour.

## Verified

- Snapshot export: 225 original nodes, 24 home steps, nine engine-generated board states. Source `text`, `options`, `nextNodeId`, `pointId`, and `targetHighlightEnabled` match the published default snapshot exactly.
- The ko snapshot has `ko=10,3`; the Sigrika skill erases `5,10`; Denia flips `5,8` to white; the last move before `story-18` is `6,2`. Export uses existing pure tutorial engine functions and fails on invalid scripted operations.
- Scoped ESLint and JS syntax checks pass. Design detector reports no findings; initial corner radii were aligned with DESIGN.md instead of suppressing checks.
- `npm run docs:system-design` passes. `npm test -- docs/systemDesignHtml.test.js`: four tests pass.
- Codex in-app browser: desktop 1440×960, actual 390×844 and 360×640 viewports; zero page-level horizontal overflow after sizing the preview grid explicitly. Separate exact-width sample canvases are 390×760 and 360×640.
- Left sprite crosses the chat top by about 47px in the 390 canvas, and about 134px on desktop. Portrait/text bounds stay separated, and portrait/board bounds do not overlap. Narrow 360 controls remain inside the game canvas.
- Wrong answer `9` goes to the original Denia response, then back to the question. Wrong board click stays at `story-18`; the correct `7,3` moves to `story-24` with “再打吃！”. Auto mode also remains at operation nodes until input completes.
- Skill sample: Sigrika → Denia → player skill; click skill first, then target `5,8`, show the Denia banner and original next choice. No click-to-continue bypass for the target operation.
- Pure `doc-ko-user` shows the original long option and no character portrait. Independent `node-3` has the original three choices. `node-4-1` preserves the full 473-character rule text, scrolls independently, and leaves the `...` option in view.
- Home sample deliberately ends after opening the handbook and showing its original introduction; it resets instead of falling into the next unsupported home action.
- Exit confirmation and Escape focus restoration pass; final browser error log is empty.

Screenshots saved outside the repository under the current task visualization folder: `guide-prototype/battle-desktop.png`, `battle-phone-390.png`, `story-choices-desktop.png`, `story-long-phone-360.png`.

## Contract review

No production contract changes. Prototype composition remains a reviewable proposal; README records its generation command, source ownership, simulation boundaries, and representative scene list. Existing backend story-sprite contract is unchanged.

The full repository test suite was not repeated for this offline prototype. Production guide checks from the preceding implementation do not establish approval of this new composition.
