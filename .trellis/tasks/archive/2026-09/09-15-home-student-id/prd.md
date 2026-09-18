# Hanging student ID on the home screen

## Accepted requirements
- Replace the home player plaque with the supplied vertical student ID reference, including its silver hook.
- Use the user-approved ivory/sage/apricot geometric academy card with metal hardware, retaining the original refined ID style rather than cute cartoon stationery.
- Keep the reference's asymmetric composition: narrow portrait on the right and username directly underneath, decorative space on the left. Do not stretch either region across the card.
- Render the currently selected character portrait through the shared costume/effect-aware resolver. Show only the username; omit ranks, badges and other player metrics.
- Preserve the resume click, semantic button, disabled story state and dedicated click sound.
- Fit desktop and portrait mobile, preserve unrelated WIP and update system design docs.

## Implementation and QA
- Transparent generated PNG in public/assets/home; separate live image and username overlays.
- Dedicated badge classes avoid the retired horizontal plaque's sizing cascade. Final theme owner handles the stage's card/manual/match/utility placement.
- Check portrait switching, equipped costume, long username, keyboard/click/disabled behavior, and 360/390/412px portrait plus desktop screenshots. Run repository check gate.

## Image generation
Built-in imagegen. Final prompt: preserve silver hook, ring, clip, rivets and hard plastic card; retain the asymmetric right-side portrait/name geometry and technical academy insignia; redraw holographic background in restrained ivory/sage/apricot geometry with subtle paper grain, 75% original academy ID and 25% warm campus illustration; no stickers, tape, plants, cartoon stars, baked-in character, lettering or rank; transparent outside the complete object. Approved by user on September 16.
