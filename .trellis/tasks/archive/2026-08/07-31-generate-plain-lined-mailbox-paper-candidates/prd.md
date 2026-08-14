# Generate Plain Lined Mailbox Paper Candidates

## Goal

Generate three selectable square mailbox letter-paper backgrounds that replace the current decorated collage with a plain, readable horizontal-rule paper surface.

## What I Already Know

- The current asset is `public/assets/mailbox/mail-body-paper.png`.
- It is a `1254x1254` RGB image used by `.mailbox-detail` with `background-size: cover`.
- The current asset contains paper scraps, tape, pins, leaves, and other decorations around all four sides.
- The user wants plain lined stationery and explicitly does not want any surrounding decoration.

## Requirements

- Produce three distinct but restrained visual directions.
- Keep every candidate square and suitable for `background-size: cover`.
- Fill the entire canvas with a flat, front-facing paper surface.
- Use uninterrupted horizontal writing rules as the only structural graphic.
- Keep contrast low enough for dark mailbox text to remain readable.
- Include no words, logos, watermarks, objects, borders, or visible sheet edges.
- Persist all three candidates in the task artifact folder for comparison.
- Use candidate 1, the classic warm-ivory paper with pale-blue rules and a faint muted-red left margin, as the selected production background.
- Replace the existing mailbox background at its current stable asset path so the consuming CSS does not need a URL change.
- Preserve the existing mailbox layout and interaction behavior.

## Candidate Directions

1. Classic warm ivory paper with pale blue rules and a faint muted-red left margin.
2. Natural cream paper with warm gray-brown rules and no margin line.
3. Fresh light ivory paper with desaturated mint-gray rules and a faint dusty-pink left margin.

## Acceptance Criteria

- [x] Three candidate images are generated and shown to the user.
- [x] Every image has a square composition and continuous horizontal rules.
- [x] No candidate contains corner or edge decorations, stationery objects, sheet outlines, shadows, text, or watermarks.
- [x] Paper grain remains subtle and does not compete with mailbox content.
- [x] Existing `mail-body-paper.png` and consuming CSS remain unchanged pending selection.
- [x] Candidate 1 replaces `public/assets/mailbox/mail-body-paper.png` at exactly `1254x1254`.
- [ ] The user completes final visual acceptance on desktop and portrait mobile; automated visual inspection was explicitly stopped at the user's request.
- [x] System design documentation and generated HTML are synchronized.

## Definition of Done

- The three image files and their prompts are saved.
- Candidate 1 is copied to the stable production mailbox asset path after user selection.
- Static asset validation, focused mailbox tests, lint, build, and documentation generation pass.
- Final visual acceptance is handed off to the user.

## Decision (ADR-lite)

**Context**: The production background is a square raster that is cropped with `background-size: cover`, while the user requested a simpler visual direction.

**Decision**: Generate three edge-to-edge, orthographic paper textures with no focal decoration, then adopt candidate 1 after user selection. Keep the production URL stable and replace only the raster contents.

**Consequences**: The existing CSS and preload behavior continue to work without a URL migration. The previous decorated raster is replaced but remains recoverable from Git history.

## Out of Scope

- Editing mailbox CSS or layout.
- Adding decorative objects or adapting other modal backgrounds.

## Technical Notes

- Current consumer: `src/styles/modals/mailbox/detail.css`.
- Current source asset: `public/assets/mailbox/mail-body-paper.png`.
- Generation mode: GPT Image 2 skill Mode B, using the host-native image generation tool.
- Prompt record: `garden-gpt-image-2/prompt/mailbox-lined-paper-options-20260731-102259.md`.
- All three generated candidates were `1254x1254` PNG images. Candidate 1 is the persisted production file; discarded task-local copies are not retained after selection.
- Validation:
  - `npm run lint`
  - `npm test -- src/modals/MailboxModal.test.jsx` (`7` tests)
  - `npm run build`
  - `npm run docs:system-design`
  - production and built mailbox assets match byte-for-byte and remain `1254x1254` RGB PNGs
- Trellis spec review: no code-spec update is needed because this changes no API, state, CSS ownership, reusable implementation pattern, or cross-layer contract. The durable visual fact is captured in `docs/system-design.md` and `docs/system-design/06-ui-theme-mobile.md`.
