# Story Guide Layout Contract

## Scope and owners

Applies to valid standard appearances in `StoryPlayerModal`, `NpcDialogue` and `HomeOnboarding`. Asset selection, authored expressions and legacy/special-form precedence follow [Story Sprite Contract](../backend/story-sprite-contract.md). Do not alter plot text, node graph, typewriter timing, wait/skip behavior or room layout to accommodate artwork.

## Standard story stage

- `standard-sprite.css` owns the classroom stage, portrait crop and bottom dialogue paper. Legacy `.onboarding-story-dialogue` uses `display: contents` so the original grid remains intact.
- Portrait and paper have independent absolute geometry. The fixed crop/image-height ratio is `1 / 1.72`, showing at most the upper thighs. Only viewport size changes this geometry; long-text effects, text length, options and expressions must not resize it.
- Desktop paper is 292px high with a 28px bottom anchor. Portrait mobile paper is 326px high with an 18px bottom anchor; body scrolls independently and options remain below it. More options scroll within their own bounded area.
- Keep one image DOM instance for the same character/appearance. A failed expression uses the legacy source and exits full-image cropping; a source change clears that failure so revisiting an expression retries it.
- Use `overflow: clip` on the stage, including the final Bright School mobile owner. `overflow: hidden` permits focus to scroll the stage when a full image extends beyond its crop, moving the entire composition.
- `.story-character-sprite` excludes full artwork from the global Bright School `max-width: 100%` clamp. Standard story actions exclude the old guided gold-button owner. Preserve those owners for other surfaces.

## Framed NPC avatars and dynamic dialogue

- `NpcDialogue` uses a fixed square portrait column and `.tutorial-npc-copy`, a separate paper frame containing the immediate speaker name followed by typed body text.
- `npc-sprite.css` owns 88px desktop / 76px phone square portrait frames, 12px / 10px column gaps and top alignment. Portraits must not read bubble height, anchor to its bottom, or vary crop with text length. Standard art uses the existing fixed 256x256 expression avatars; legacy/special art uses contain in the same square frame.
- Teaching bubble and home guide resolvers and preloads both request `variant: "avatar"`. Story stages continue using full illustrations. Source failure retains frame geometry, resolves legacy art, and retries after expression-source changes.
- Body text retains the existing TypewriterText implementation and timing. Paper height grows with visible text; do not reserve hidden full-text height or fix all dialogue heights. Minimum paper height matches the portrait.
- Home uses a detached avatar sibling with the same panel top/left/width and fixed square height. Its slot placeholder reserves the same width inside the scroll panel. Do not measure dialogue height or use `--npc-dialogue-height`; only panel height participates in existing target avoidance. Portrait decoration does not intercept input or scroll with long text.
- Preserve original guide progression, click-to-reveal, choices, target proxies, skip and game geometry.
- Avatar and copy share pale character-color paper gradients, colored borders and a restrained halo via `--tutorial-npc-color`. `NpcDialoguePortrait` sets the palette on its slot, including detached home decoration. Home reads `character.palette` first, then legacy `character.color`. Keep dark text and mix the name tint with ink for readability; never color-filter the artwork.

## Required checks

- DOM: speaker/text/expression synchronization, A-fails -> B -> A recovery, home detached avatar with fixed column after fallback, and input boundary regressions.
- Browser: 1280px/1440px desktop and 390x844 / 360x640 phones. Real typing must grow copy without changing avatar rectangle or relative crop. Same top alignment for short/long text, separate paper frame and no horizontal overflow.
- Complete home tours: target visibility/clearance, real windows unchanged, background input interception, reachable actions and completion. Test full art in story stages independently.

Bad: bottom-aligning the avatar frame to the changing dialogue height. Good: fixed square frame at the top beside a naturally growing text panel.
