# Identity Bust Portrait Contract

## Trigger and ownership

Read this contract before changing hanging student-ID art, self/social profile hero art, ordinary/team battle portraits, their preloads, or shared portrait resolution. `CharacterBustPortrait` is the shared presentation adapter; `resolveHandbookPortrait` owns standard sprite selection and landmarks, while `characterPortraitImageProps` remains the effective appearance resolver. Small profile-table avatars keep their existing direct, lazy image contract.

## Effective appearance

- Forward `user`, `itemEffects`, explicit `equippedCostumes`, and frozen `costumeSnapshot` to the effective resolver. Snapshot equipment wins over explicit equipment and account equipment. Do not reinterpret a frozen replay appearance from the current account.
- Only the nine registered builtin characters use `/assets/characters/handbook-sprites/{id}.webp`. Aliases resolve canonically. Custom art, authored costumes, candy/corrupted variants, Baconbits, bots, tutorial and special duel branches preserve their effective source and framing.
- A costume referencing a builtin URL is still authored equipment; do not silently replace it with a standard sprite.
- A failed standard image falls back once to the same character's effective legacy source. A source or standard/authored presentation-kind change resets that attempt, including authored equipment reusing the same URL. Custom/fallback failures must not loop or substitute an unrelated character.
- Hidden team entries render no portrait, even if stale metadata contains a character. Memoized battle info must invalidate when a frozen costume snapshot changes.

## Geometry and cascade

`CharacterBustPortrait` renders a clipping `.character-bust-portrait`, proportional inner `.character-bust-art`, and `.character-bust-image`. The existing student-ID, profile mask or team slot owns outer dimensions. Chain badges remain outside the mask.

Registered standard sprites retain their 832:1216 source ratio. Horizontal crop uses measured pupil X and head width; top anchoring preserves hair/headwear. Profile and battle use a .58 face fraction, student ID .64, team .46 with its existing diagonal mask and 8% top inset. These are visual crop parameters, never dimensions that stretch the source. Authored scale/offset belongs to the inner art wrapper so old direct-image normalization cannot erase it.

The bounded `mobile-adaptive/character-bust-portraits.css` loads last in the final safety entry. It overrides only the shared compositor classes, including the earlier home `max-width:100% !important` clamp. Do not broaden the guard to all images or reuse legacy hero `width:80%;height:80%` rules on standard busts.

Supported900px-and-smaller landscape battle rows need definite zero-minimum player tracks: identity, available art, and timer must fit above the action dock. The ordinary owner is `mobile-adaptive/mobile-room-landscape.css`; the special candy-duel owner is `mobile-adaptive/sigrika-corruption/room-secondary-surfaces.css`. Keep their theme scopes separate and preserve special sources, image fit, transforms and palette. Both branches retain square board/SVG alignment, coordinate gutters, all169 hit targets and complete44px bottom actions. A nonempty portrait alone does not prove its containment or the board's playability. Compare portrait/desktop before and after a landscape-only change.

## Loading and verification

Login preloads add only the selected effective bust to the existing critical resources. Battle preloads prefer the current display catalog before historical character metadata and add participants/revealed members using the same appearance options, preserving frozen costumes and bot/special-duel sources. Exclude hidden entries before resolving both image and character-audio assets. Do not put every full-body sprite or story expression in the login critical path.

Required checks: shared resolver/fallback DOM tests, snapshot and hidden-team tests, preload tests, student-ID/profile/player DOM tests, `interface-polish` browser suite, and team-match browser suite. Use full CSS and real ancestors; decode all relevant images before visual composition review. Cold-load and failed-image behavior are separate checks. Browser assertions verify loaded source, source-ratio preservation, pupil alignment, masks and zero page overflow; they must not require the retired image-cover/vertical-center geometry.

Self/social dossiers use a larger rank card and a shared record card side by side on desktop, with a slim full-width recent-results strip. Phone layouts retain natural record scrolling, 44px controls, full legal plain usernames, nonwrapping metrics and a single-line empty-results chip. Both plain and equipped self-profile identities reserve a separate grid row for achievement/personalization actions; include title/badge combinations in overlap checks. Equipped nameplates keep their established scale and slot geometry. Transparent image-box intersection alone is not evidence of visible paint overlap.
