# Hand-drawn loading page prototype

## Goal
Create a reviewable loading-screen prototype in the existing SigrikaGo design sample directory, using the user's approved blinking character sprite and completed expression. Retain the existing loading tip text format and default configuration.

## Requirements
- Center the character and table; remove existing title, status copy, orange mascot and conventional progress bar from the sample.
- Place a large hand-drawn cloud above and to the character's left, connected to the head by separate progressively smaller cloud bubbles.
- Keep a clear image slot inside the thought bubble for future Go life-and-death problem images. Leave it empty by default rather than inventing a puzzle.
- Place a large hand-drawn bulb to the right of the head. Its interior is transparent at zero, fills with a yellow gradient from bottom left toward top right, and displays the supplied reference's chunky glow marks only at completion.
- Switch the animated character to the completed static sprite at 100 percent and hold the whole scene still for 2000 ms; tip rotation also stops during completion.
- Place only the existing Tip text below the table. Support desktop and portrait mobile without clipping the main art or text.
- Provide an independent preview using the established docs/design-samples convention, including replay and manual progress controls outside the loading composition.

## Technical notes
- Existing component: src/app/AssetPreloadScreen.jsx; tip source: DEFAULT_SITE_SETTINGS.preloadTips in src/shared/siteSettings.js.
- Existing sample convention is independent HTML in docs/design-samples; production startup, battle and tutorial preload are not replaced by this sample.
- Generated assets use the built-in imagegen tool; copy them into the project. Approved character assets originated in D:/codex/loading-sprite/deliverables.
- Update docs/system-design.md as required by AGENTS.md and generate its HTML companion.
- No server, database, authentication or gameplay changes.

## Acceptance
- Inspect generated asset alpha, including a real transparent bulb chamber.
- Browser-check 0, 50 and 100 percent states, diagonal fill, rays, static completed sprite, 2-second completion event and replay.
- Browser-check 1440x900, 390x844 and short mobile layouts for overflow and readable tips.
- Validate local asset paths and JavaScript syntax, run applicable project checks, capture screenshots and deliver the preview URL/files.
