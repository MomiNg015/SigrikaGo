# Existing profile layout: three palette and texture studies

## User request
Stop changing the layout. Use the current production resume/detail layout, retain all content, bookmarks, artwork and responsive geometry, and create three samples that extract the reference color relationships and blend them with the project's school style. Flat backgrounds should gain restrained card/window texture.

## Implementation boundary
- Directly render current ResumeModal and UserProfileCard with production CSS. Do not borrow V3's restructured markup or sample CSS.
- New isolated docs/design-samples/profile-surfaces-2026-10-20. No production edits.
- A baseline mode and texture toggle make the scope reviewable. Variant CSS can change paint only: colors, background images, border colors and shadow colors; no sizing, spacing, grid, typography or ordering changes.
- Three directions: blue-ink dark shell/light grid cards; fog-paper light shell/dark dotted identity; night-school dark cross-weave surfaces. Pink stays selection, blue/mint retain existing meanings; original social action colors remain.
- Static CSS patterns only, no filter/canvas/animated texture or new character art.
- Use actual production fields and current portrait resolver. Local fixture API interceptor never sends account requests; no storage writes.

## Acceptance
- [x] Three distinct color/material combinations on identical production geometry.
- [x] Self/social and desktop/portrait mobile visible, including 320px.
- [x] Texture remains discernible without compromising text contrast.
- [x] Geometry snapshots equal baseline across variants; original bookmarks and all existing fields retained.
- [x] Real component interactions work with local fixtures; no API network or retired artwork requests.
- [x] Comparison, screenshots, documentation and scoped checks complete.

## Reference interpretation
Arknights: near-black layers, bright neutral text, a limited blue accent and quiet geometric texture. Endfield: sharply separated dark/light masses, neutral structured surfaces, sparse bright accents and low-contrast relief/dot patterns. Translate these into school ink/paper, notebook blue/pink/mint and stationery textures; do not copy game-specific fields or industrial imagery.
