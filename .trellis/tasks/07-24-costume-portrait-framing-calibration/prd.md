# Costume Portrait Framing Calibration

## Goal

Keep an equipped costume's perceived character size aligned with that character's default portrait without restoring transparent image borders or breaking the costume shop's price-to-art anchoring.

## Requirements

- Add per-costume framing fields:
  - `portraitScalePercent`
  - `portraitOffsetXPercent`
  - `portraitOffsetYPercent`
- Admin costume management can edit all three values.
- Validation accepts scale from 50 through 150 and offsets from -50 through 50.
- Existing or omitted values fall back to scale 100 and offsets 0/0.
- Seed the current five costumes with:
  - Sigrika 01: 83%, 0/0
  - Denia 01 and 02: 88%, 0/0
  - Nabomo 01 and 02: 94%, 0/0
- The wardrobe card applies framing to non-default costume portraits; the virtual default card remains 100% with no offset.
- Character portraits that represent the player's equipped appearance apply the same framing in handbook details, profile/social surfaces, battle UI, result UI, and replay UI.
- Match creation snapshots the effective costume framing. Result persistence and replay use the snapshot so later admin edits do not visually rewrite an existing or historical match.
- The costume shop product art, admin thumbnail, and costume-detail artwork deliberately render the alpha-trimmed asset at its original framing and do not apply costume scale/offset.
- Candy-effect artwork uses the equipped costume's framing values when that costume provides its own candy portrait; the base candy fallback keeps the base presentation.

## Acceptance Criteria

- [ ] In Sigrika's wardrobe, costume 01 no longer appears substantially larger than the default portrait.
- [ ] Denia and Nabomo costume cards use their configured 88% and 94% scales.
- [ ] Editing scale or offsets in admin round-trips through create/update/list/player equipment payloads.
- [ ] Invalid scale or offset input is rejected by frontend draft validation and server validation.
- [ ] Equipping a costume updates ordinary character portraits with scale/offset while the shop and costume detail remain unchanged.
- [ ] A room player receives a complete costume snapshot including scale/offset.
- [ ] GameRecord and replay projections preserve scale/offset from match start.
- [ ] Legacy databases receive additive columns with safe defaults and existing users/costume ownership are preserved.
- [ ] System design and the costume contract describe the framing boundary.
- [ ] Focused tests and `npm run check` pass.

## Definition of Done

- Schema, legacy schema guards, admin defaults, API payloads, room/replay snapshots, UI consumers, tests, and docs are synchronized.
- No user ownership, equipment, or account data is reset.
- No source costume image is padded or replaced.
- No change is made to the costume shop product-art geometry.

## Technical Approach

Use bounded integer percentages instead of floats for stable JSON, SQLite, admin forms, and CSS custom properties. `resolveCharacterPortraitPresentation()` returns the URL plus normalized framing, while the existing `resolveCharacterPortrait()` remains as a compatibility URL-only wrapper. A shared portrait presentation helper supplies CSS variables/styles to semantic portrait owners. Room and GameRecord snapshots copy framing values at match creation.

## Decision (ADR-lite)

**Context**: Alpha-trimmed costume WebPs fill an `object-fit: contain` slot more completely than padded default portraits. Re-padding images would fix one surface but would break the shop price badge's visible-art anchor.

**Decision**: Keep tight WebPs and store presentation metadata separately per costume. Apply it only where the image represents the equipped character, not where the user is inspecting or purchasing the artwork.

**Consequences**: Future costumes can be tuned without image re-export. Snapshot fields add schema/API surface, but historical match rendering stays deterministic.

## Out of Scope

- Automatic computer-vision framing at runtime.
- Re-exporting or padding the five costume assets.
- Applying framing to shop product art, costume detail art, or admin thumbnails.
- Separate per-surface scale values.

## Technical Notes

- Default portrait visible alpha-height occupancy measured from committed assets:
  - Sigrika: 83.4%
  - Denia: 87.8%
  - Nabomo: 93.6%
- Current costume WebPs occupy 100% of their tightly cropped canvas height.
- Applicable project specs: backend costume contract, database guidelines, frontend CSS architecture.
