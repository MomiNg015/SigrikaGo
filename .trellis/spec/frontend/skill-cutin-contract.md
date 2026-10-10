# Skill Cut-in Contract

## Scope
Ordinary `SkillBanner` in rooms, spectators and tutorial consumers. `SigrikaDuelPresentation` deliberately remains on its existing `skill-burst` markup and owners.

## Data and lifecycle
- Resolve `banner.character ?? banner.characterId` through `findCharacter`; keep snapshot character/skill labels.
- Resolve images through `characterPortraitImageProps` with `variant: full`, `itemEffects`, `equippedCostumes`, and `costumeSnapshot`. Never hardcode a builtin path in the production component. Frozen costumes, authored art, candy variants and their scale/translate keep precedence.
- `banner.id` keys the visual scene. Equivalent snapshots preserve animation progress and voice deduplication; a new ID restarts the visual scene and voice.
- CSS reads `--cutin-duration` from finite positive `bannerDurationMs`, defaulting to `SKILL_BANNER_DURATION_MS`. Do not delay game resolution or change the parent pending-skill lifecycle.

## Presentation
- `modals/skill-cutin.css` owns geometry and theme-specific ink/font/image-height corrections; `skill-cutin-motion.css` owns motion and its static reduced-motion alternative.
- The fixed scene reuses overlay depth 120 and stays pointer-transparent. Only the ribbon clips decoration; the full portrait overhang remains visible above and below it.
- Character name and skill title are the only text. No cast badge. Mobile keeps the transformed diagonal divider completely left of the text; long skill names wrap at a smaller size.
- Bright School global important font/ink resets require the scoped stronger owner. Broad image `height:auto` must not alter the full-body frame.
- Two-second entrance/hold/exit is separated across paper, art and copy. Portraits never use nonuniform scale. Reduced motion shows a static composition until parent unmount.

## Verification
SSR covers nine current full-body sprites, authored/costume/candy precedence, snapshot labels and timing fallback. DOM tests cover same-ID deduplication and new-ID remounting. Browser checks use actual production markup with all project styles at 1440px desktop and 320/360/390px portrait, long names, decoded art, safe text gaps and reduced motion. CSS inventory growth is limited to this owner's measured delta; do not absorb unrelated baseline drift.
