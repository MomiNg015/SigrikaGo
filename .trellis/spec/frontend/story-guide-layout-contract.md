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

## NPC chest portraits and dialogue anchoring

```jsx
<NpcDialogue bubble={bubble} revealAll={revealed} portraitDetached={standardHomePortrait} />
// bubble carries portrait, fallbackPortrait, standardPortrait, appearanceId, expressionId.
```

- `NpcDialoguePortrait({ bubble })` keeps legacy 68x68 desktop / 58x58 mobile slots. Valid standard art reserves 140px desktop / 130px mobile width and adds `.standard-npc-slot` with `position: static`, so its absolute frame's `bottom: 0` belongs to the whole positioned dialogue. Keep outer position, width, padding, minimum height and board layout; text wraps naturally within the new reservation. Use 20px / 18px column gaps. Detached home placeholders carry the same standard class.
- `npc-sprite.css` owns only portrait and home decorative sibling. Use chest-up crops, fixed image heights 350px desktop / 320px mobile, visible height at most 112px / 102px, and frame widths 180px / 166px. Crop only the bottom: `overflow: visible; clip-path: inset(0 -100% 0 -100%)` retains the complete head and side contours. Frame ends at least 15px before text. Bottom follows bubble bottom; short bubbles allow bounded top protrusion (12px desktop, 32px mobile), while tall bubbles reduce it. Decorative images never intercept pointer input.
- Home's scroll panel retains its original `panelRef`, `ResizeObserver` and target-relative placement. Measure internal `.tutorial-battle-dialogue` separately as `dialogueHeight`; expose `--npc-dialogue-height` in the same `panelStyle` used by the decorative sibling. Its height follows the actual bubble, excluding preparation status and panel scroll limits. Observe both panel and dialogue. The sibling stays outside the clipping scroll panel and outside measured panel height; choice-only nodes have no portrait layer.
- Home caps top protrusion at 12px to clear the original 16px target gap. Its three-class selector must beat the later two-class mobile portrait selector; test the rendered winner on portrait phones.
- Missing/invalid/special appearance uses the original portrait slot and art. Image failure exits the standard crop. Switching sources must reset a previous failure, including A-fails -> B -> A.
- A detached home image failure restores the legacy image geometry while keeping its standard placeholder column, so the text and target-relative panel do not jump.
- Preload the actual full illustration URLs with four workers, not derived avatars enlarged in CSS.

## Required checks

- Unit/DOM: text/graph equivalence, same-body expression image identity, A-fails -> B -> A recovery, NPC expression/speaker synchronization and original home target interception/position tests.
- Browser: desktop and portrait 390x844 / 360x640; crop/image rectangles unchanged for short/long/options nodes, stage scrollTop stays zero after option focus or body scroll; final choices remain reachable.
- Browser: NPC crop bottom equals bubble bottom within its 1px border, chest crop is no more than 33% of full image height, frame-to-text clearance is at least 15px, and scale stays fixed across short/long lines. Horizontal crop must remain expanded, and the head must remain inside viewport (the desktop frame may extend 3px into empty alpha). Wait for entrance transform before rectangle comparisons. Hiding decorative art must not change bubble/body rectangle or board bounds; home target proxies remain usable. Keep legacy/special-form regressions.

Bad: putting a tall portrait in grid flow or adding portrait space to the home measured panel. Good: fixed grid reservation plus an independent decorative crop layer.
