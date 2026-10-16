# Repair existing handbook detail and wardrobe layouts

## Request
The user rejected the redesign directions and requests a review and fixes for clipped buttons, broken layouts and related issues in the existing character detail and wardrobe windows. Preserve the current game presentation.

## Scope
- Reproduce with the actual HouseModal flow and complete production CSS; include character detail, wardrobe, costume detail and music picker layering.
- Inspect desktop 1440x768 and portrait 320x568, 360x640, 390x844.
- Fix demonstrated clipping, overlap, unusable scrolling or incorrect stacking in their existing CSS/interaction owners.
- Preserve character artwork, layout intent, colors, existing controls, account behavior and audio ownership.
- Keep previous exploratory samples separate; do not promote them.
- Add focused browser regression coverage, update affected design facts, regenerate system-design HTML.

## Acceptance
- Controls and their owned shadows fit their clipping containers in resting and hover states.
- Long names/content do not overlap adjacent controls; final content/actions remain reachable on short phones.
- The latest dialog receives pointer and keyboard input and closing returns to its parent.
- Relevant tests, lint and CSS/build contracts pass; screenshot evidence retained.
