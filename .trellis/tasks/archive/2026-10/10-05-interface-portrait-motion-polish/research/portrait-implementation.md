# Shared identity bust implementation

Implemented by the portrait owner, 2026-10-05. Existing unrelated changes retained; no asset pixels, catalog URLs or board geometry were changed.

## Changes

- `src/shared/handbookPortraits.js` now accepts `equippedCostumes` and `costumeSnapshot`, forwarding both into the shared effective portrait owner. The gate checks the same winning costume (`snapshot ?? explicit equipment ?? account equipment`), including a costume referencing a builtin default URL. Standard results also expose the effective legacy `fallbackSrc`.
- `src/shared/CharacterBustPortrait.jsx` is a shared identity presentation adapter. Nine registered standard sprites use their existing pupil X coordinate, headWidth and intrinsic 832×1216 ratio in an inner art compositor. Standard profile/battle crops preserve headwear at source Y=0; student IDs target a consistent 64% face width for a half-body photograph. Team crops use a smaller face fraction inside existing staggered diagonal slots. Custom/costume/candy/corruption/mascot art keeps proportional contain and original framing.
- A failed standard sprite switches once to its effective legacy portrait. A changed source remounts only the image compositor and retries normally. A failed custom or fallback image does not create a fallback loop or substitute another character.
- `PlayerPlaque` uses the student-ID variant inside its existing narrow photo mask. Username, nameplate, guide hook, keyboard/disabled action and painted card geometry are unchanged.
- The shared `ProfileResumeView` self/social hero uses the profile variant inside its existing `.profile-portrait-mask`. Compact record avatars remain direct, lazy images. Chain-badge component stays outside the mask.
- `PlayerInfo` ordinary/visible-team art uses battle/team variants while preserving participant/entry snapshots. Explicit hidden entries never resolve an image, even if historical metadata carries character information. Bots, null characters, tutorial defaults, corruption-duel branches, result badges and viewpoint controls keep their original branches. Snapshot identity joins the memo comparison so a changed snapshot cannot leave old art cached.

## Styles and coordination

`src/styles/mobile-adaptive/character-bust-portraits.css` is imported last by `mobile-adaptive.css`. It targets only `.character-bust-portrait`, `.character-bust-art`, `.character-bust-image`; it reserves the crop on the inner owner and retains exterior badge/label overflow. Existing image reset stacks require explicit final reset ownership. A measured home bug came from the earlier `.home-screen :where(*) { max-width:100% !important }`, which clamped the larger art compositor to the photo width; the new-class wrapper guard clears that clamp without changing home geometry.

CSS addition: **one file, 1,992 bytes, 22 `!important`, zero hardcoded hex values, media queries, reduced-motion or high-z-index families**. There are no added transitions or animations. Root owns CSS inventory/debt aggregation and system-design documentation.

Profile CSS owner has the exact class names and keeps mask sizes authoritative. The prior 70%/80% portrait contract remains only for compact table images; it must no longer describe standard hero busts or compositor costume framing. Root has extended selected-login and visible-battle preloads using the same resolver.

## Verification

- `npm test -- src/shared/handbookPortraits.test.js src/shared/CharacterBustPortrait.dom.test.jsx src/shared/characterPortraits.test.js src/home/components/PlayerPlaque.dom.test.jsx src/modals/ProfileResumeView.dom.test.jsx src/modals/ResumeModal.dom.test.jsx src/modals/UserProfileCard.dom.test.jsx src/room/PlayerInfo.dom.test.jsx src/room/PlayerInfo.test.js`: **9 files / 103 tests passed**.
- Explicit ESLint against all modified JS/JSX with project rules expanded temporarily: passed. Existing focusable profile scroll/help nodes retain their established `no-noninteractive-tabindex` allowance; the permanent ESLint maintained-file catalog is owned elsewhere and otherwise ignores most existing profile/player JSX.
- Reviewed all nine standard profile crops plus Baconbits from `.tmp/interface-polish/round-one/portrait-*.png`: face/hair/headwear and chest/shoulder proportions coherent.
- Measured actual home/profile/mobile-room wrappers at 390×844 with all portrait images decoded; corrected the home max-width clamp and confirmed both room players appear. Latest evidence `.tmp/interface-polish/portrait-verified-{home,profile,room}.png`. Root captures should await every bust's `decode()`, since decoding only the first room image produced an erroneous blank second-player capture.

## Remaining review

Root owns comprehensive desktop/360/390/412 captures, actual team composition, reduced-motion/keyboard flow, full check/build/built-CSS contracts, and system-design update. No implementation blocker remains; any further crop adjustments should be driven by these rendered comparisons.
