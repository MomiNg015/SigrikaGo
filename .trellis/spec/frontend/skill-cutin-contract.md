# Skill Cut-in Contract

## Scope
Ordinary `SkillBanner` in rooms, spectators and tutorial consumers. `SigrikaDuelPresentation` deliberately remains on its existing `skill-burst` markup and owners.

## Data and lifecycle
- Resolve `banner.character ?? banner.characterId` through `findCharacter`; keep snapshot character/skill labels.
- Resolve images through `characterPortraitImageProps` with `variant: full`, `itemEffects`, `equippedCostumes`, and `costumeSnapshot`. Never hardcode a builtin path in the production component. Frozen costumes, authored art, candy variants and their scale/translate keep precedence.
- `banner.id` keys the visual scene. Equivalent snapshots preserve animation progress and voice deduplication; a new ID restarts the visual scene and voice.
- CSS reads `--cutin-duration` from finite positive `bannerDurationMs`, defaulting to the shared character-specific `skillBannerDurationMs`. Ordinary casts remain 2000 ms; enabled Denia casts use 3200 ms. Server resolution and tutorial previews consume the same duration contract, retaining the board effect's relative resolution offset.

## Presentation
- `modals/skill-cutin.css` owns geometry and theme-specific ink/font/image-height corrections; `skill-cutin-motion.css` owns motion and its static reduced-motion alternative.
- The fixed scene reuses overlay depth 120 and stays pointer-transparent. Only the ribbon clips decoration; the full portrait overhang remains visible above and below it.
- Character name and skill title are the only text. No cast badge. Mobile keeps the transformed diagonal divider completely left of the text; long skill names wrap at a smaller size.
- Bright School global important font/ink resets require the scoped stronger owner. Broad image `height:auto` must not alter the full-body frame.
- Two-second entrance/hold/exit is separated across paper, art and copy. Portraits never use nonuniform scale. Reduced motion shows a static composition until parent unmount.

## Verification
SSR covers nine current full-body sprites, authored/costume/candy precedence, snapshot labels and timing fallback. DOM tests cover same-ID deduplication and new-ID remounting. Browser checks use actual production markup with all project styles at 1440px desktop and 320/360/390px portrait, long names, decoded art, safe text gaps and reduced motion. CSS inventory growth is limited to this owner's measured delta; do not absorb unrelated baseline drift.

## Denia transformation
- `deniaSkillForm.js` owns assets, times and visible-history derivation. At 1000 ms the paper swarm enters; at 1750 ms both banner and `BattleCharacterPortrait` switch to the supplied form; the swarm clears by 2500 ms and the banner exits at 3200 ms.
- The match-only `battleForm` option deliberately overrides Denia costumes/candy while active, using the same supplied full-body source in both surfaces. It never mutates user equipment or changes non-battle identity art.
- A successful skill in the caster's visible history preserves the form through resolution, reconnect, game end and replay. New history resets it. Team membership uses explicit round ranges in history, including live games that lack replay-only `game.teamRound`; hidden members never mount art. Pending form timers are keyed by cast ID and cleaned up on cancellation. Subsequent casts carry `battleFormBeforeCast` to prevent reversion.
- The swarm is one pointer-transparent Canvas 2D surface above the ribbon. A small repeated texture builds eight cached strips plus at most 64 independently tumbling foreground papers (at most 72 draw calls per frame). Clamp rendering extent to 1920x1200 and pixel ratio to 1.5; release resources with the cast. Do not restore per-paper DOM nodes or thousands of per-frame draw calls.
- Reduced motion creates no canvas renderer; disabled skill effects omit the canvas and retain the 2000 ms banner. Both paths preserve the form change. New assets belong to `RUNTIME_IMAGE_ASSETS.effects` for existing preload paths.
- Tests must cover synchronous reveal, snapshot rerenders, cancellation, persistence/reset, team history, replay reconstruction, authoritative timing and bounded draw calls. Browser performance results must distinguish CPU draw submission from frame pacing and actual mobile hardware.
