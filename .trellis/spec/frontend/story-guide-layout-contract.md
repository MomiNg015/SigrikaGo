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

## Original NPC geometry with protruding artwork

```jsx
<NpcDialogue bubble={bubble} revealAll={revealed} portraitDetached={standardHomePortrait} />
// bubble carries portrait, fallbackPortrait, standardPortrait, appearanceId, expressionId.
```

- `NpcDialoguePortrait({ bubble })` draws full-source bust artwork inside an absolute frame, reserving the original 68x68 desktop / 58x58 mobile grid slot. Do not change the outer dialogue position, width, padding, minimum height or director/board layout.
- `npc-sprite.css` owns only the portrait and the home decorative sibling. Its crop is fixed per viewport and excludes knees/legs; decorative images never intercept pointer input.
- Home's scroll panel retains its original `panelRef`, `ResizeObserver` and target-relative `panelStyle`. The decorative sibling uses that same style; it is outside the clipping scroll panel and excluded from measured panel height. Choice-only nodes have no portrait layer.
- Missing/invalid/special appearance uses the original portrait slot and art. Image failure exits the standard crop. Switching sources must reset a previous failure, including A-fails -> B -> A.
- Preload the actual full illustration URLs with four workers, not derived avatars enlarged in CSS.

## Required checks

- Unit/DOM: text/graph equivalence, same-body expression image identity, A-fails -> B -> A recovery, NPC expression/speaker synchronization and original home target interception/position tests.
- Browser: desktop and portrait 390x844 / 360x640; crop/image rectangles unchanged for short/long/options nodes, stage scrollTop stays zero after option focus or body scroll; final choices remain reachable.
- Browser: NPC art protrudes without changing the bubble/body rectangle or board bounds; home target proxies remain usable throughout the original tour. Keep legacy/special-form regression tests.

Bad: putting a tall portrait in grid flow or adding portrait space to the home measured panel. Good: fixed grid reservation plus an independent decorative crop layer.
