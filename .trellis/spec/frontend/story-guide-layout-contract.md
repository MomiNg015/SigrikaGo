# Story Guide Layout Contract

The dedicated `denia-rainbow-glow` candy identity uses the modern chibi stage, with native 832x1216 animation geometry instead of the square general-purpose portrait. Its source declares chibi presentation even though it is not a selectable default expression. A picture media source picks the same-size still under reduced motion; failed sources remove that source and fall back to the current default art. Verify actual animation frame changes and both eye/mouth origins at desktop and portrait phone dimensions; narration after the candy branch clears the actor.

## Scope and owners

Narration / character-free `StoryPlayerModal` nodes also use the modern stage (`standard-story-sprite story-narration`, chibi stage geometry). Hide the empty portrait, retain no speaker name, and remove portrait-reserved dialogue padding. Do not invent or retain the previous actor. Measure long-text content against stage usage rather than portrait existence. Check introduction -> character -> narration with unchanged stage element, empty portrait and reachable actions at desktop and portrait phone sizes.

Applies to valid standard appearances in `StoryPlayerModal`, `NpcDialogue` and `HomeOnboarding`. Asset selection, authored expressions and legacy/special-form precedence follow [Story Sprite Contract](../backend/story-sprite-contract.md). Do not alter plot text, node graph, typewriter timing, wait/skip behavior or room layout to accommodate artwork.

## Standard story stage

Chibi profiles use `data-story-presentation="chibi"` on the same stage. Desktop full-image height is `min(--story-sprite-crop, 550px)` with centered native proportions, avoiding the standard 1.72 upper-body zoom. On portrait phones, paper height is `clamp(210px, 38dvh, 290px)`; art fills the stage between the 62px top clearance and 120px bottom anchor, extending behind the dialogue paper. The paper can cover the lower body while the face remains readable. Keep expression geometry fixed. Authored long-text nodes retain content-driven paper growth, unchanged art scale, upward translation and internal text scrolling. Failed sources retain the existing fallback sizing instead of the chibi image rule.

- `standard-sprite.css` owns the classroom stage, portrait crop and bottom dialogue paper. Legacy `.onboarding-story-dialogue` uses `display: contents` so the original grid remains intact.
- Portrait and paper have independent absolute geometry. The fixed crop/image-height ratio is `1 / 1.72`, showing at most the upper thighs. Only viewport size changes the crop size; expressions and text never rescale it. Authored long-text effects may translate it on mobile as specified below.
- Desktop paper is 292px high with a 28px bottom anchor. Portrait mobile paper is 326px high with an 18px bottom anchor; these are minimum heights for authored long-text effects; body scrolls independently and options remain below it. More options scroll within their own bounded area.
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
- Home panel and detached avatar remain hidden until current-selector geometry and current-step panel measurements are ready. Measure in layout effects before paint; scope reveal state to the step ID. Never render a target-dependent line at the default position while waiting for a lazy window. Target-free narration intentionally uses its default position.
- Home highlights copy actual component paint above a flat dimmer, including narrated detail/resume windows. Every target/surface gets the shared A marker below NPC/dialogue. Copies are inert, aria-hidden and pointer-transparent, strip guide selectors and rewrite IDs/internal references; exclude them from focus cycling. Track entry opacity/transform, rebuild on content/size/load changes, and clean up observers, frames and generated styles.
- Snapshot performance: cache the browser's standard property names/initial values, iterate that JS collection instead of each live CSSStyleDeclaration, omit inherited custom properties, and assign only computed differences in one cssText write per element. Put the initial reset in a shared rule: inline `all:initial` plus overrides expands into hundreds of serialized longhands. Preserve exact paint through the complete real-window tour; the resume fixture snapshot must stay below 600,000 serialized characters. Profile copy duration/long tasks as well as visual correctness.
- Ignore the initial ResizeObserver notification when dimensions are unchanged. Root-only opacity/transform/translate/scale/rotate animation is synchronized live and must not cause another full snapshot on finish. Descendant/nontracked-property animations still refresh, with one finish subscription per animation; keep cancellation/unmount behavior covered.
- Avatar and copy share pale character-color paper gradients, colored borders and a restrained halo via `--tutorial-npc-color`. `NpcDialoguePortrait` sets the palette on its slot, including detached home decoration. Home reads `character.palette` first, then legacy `character.color`. Keep dark text and mix the name tint with ink for readability; never color-filter the artwork.

## Required checks

- DOM: speaker/text/expression synchronization, A-fails -> B -> A recovery, home detached avatar with fixed column after fallback, and input boundary regressions.
- Browser: 1280px/1440px desktop and 390x844 / 360x640 phones. Real typing must grow copy without changing avatar rectangle or relative crop. Same top alignment for short/long text, separate paper frame and no horizontal overflow.
- Complete home tours: target visibility/clearance, real windows unchanged, background input interception, reachable actions and completion. Test full art in story stages independently.

Bad: bottom-aligning the avatar frame to the changing dialogue height. Good: fixed square frame at the top beside a naturally growing text panel.


## Authored long-story exception (2026-10-03)

For `long-text-compress-portrait` standard story nodes, measure visible text/name/actions and grow bottom-anchored paper upward, capped at stage height minus 90px; excess text scrolls internally. Desktop portrait remains fixed; mobile (760px) translates upward by paper growth at unchanged scale, with stage clipping allowing the face to disappear but never drawing outside the window. Reduced motion disables transitions. Ordinary story and NPC avatar framing remain stable. Choices reserve 5/8/9/5px gutters and warm paper mixed with character palette in all interaction states.
