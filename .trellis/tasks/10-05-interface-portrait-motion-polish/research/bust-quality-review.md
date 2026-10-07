# Independent identity bust and preload review

Reviewed 2026-10-05 against the task PRD, portrait research/implementation notes, frontend index and identity-bust contract, relevant CSS/component/quality contracts, story-sprite and costume precedence contracts.

## Findings fixed

1. **Hidden team metadata was still eligible for preloading.** `battlePreloadAssets` previously filtered lineup entries only by `characterId`, while `PlayerInfo` explicitly rejects `status: "hidden"`. An old entry carrying a character ID could therefore reveal its catalog/costume URL and character-specific audio through requests. Added the same hidden-status guard before flattening, preserving the existing visible-member handling. The regression covers stale character metadata, costume URLs, skill audio and system audio. It failed before the fix.
2. **Battle preload selected stale character art before the current display catalog.** `PlayerInfo.playerCharacterForDisplay` intentionally prefers the current catalog for known characters, but the new effective bust preload preferred `player.character`. It could load a standard sprite while the visible card used current custom art. Preload now uses current catalog, builtin fallback, then historical custom character, and still forwards the frozen costume snapshot. The regression verifies current custom art and snapshot precedence and failed before the fix.
3. **A failed standard image state could erase authored art reusing its URL.** The inner image was keyed only by URL. After a standard failure, switching to authored/costume art with that same URL retained `failed: true`, but the authored result had no `fallbackSrc`; `img.src` became empty. The key now includes the standard/authored presentation kind. A DOM regression fails on the previous code and proves both authored framing and the return to standard presentation retry correctly.

Files changed in this review: `src/shared/preloadAssets.js`, `preloadAssets.test.js`, `CharacterBustPortrait.jsx`, `CharacterBustPortrait.dom.test.jsx`. Added three parameterized login checks for custom catalog art, equipped art and active Denia candy. No CSS, inventory, import, docs, catalog assets or PlayerInfo behavior was changed by this reviewer; root owns documentation/spec consolidation.

## Other paths verified

- Shared resolver forwards snapshot, explicit/account equipment and item effects; builtin-URL costumes keep authored framing. Candy and corruption retain their existing source priorities.
- Standard failure makes one same-character legacy attempt; custom/fallback failures do not loop. Source/presentation changes reset independently of other profile content.
- PlayerInfo preserves bots, tutorial/no-character and corrupted-duel branches, rejects hidden metadata, forwards participant/member snapshots and invalidates memoization on snapshot identity.
- Registered source dimensions remain 832:1216; crop composition uses head-width and horizontal pupils, top anchoring and existing mask dimensions. Authored framing lives on the art wrapper, outside legacy direct-image resets.
- Reviewed full-CSS screenshots `round-two/home-390.png`, `room-390.png`, and `resume-1440.png`. Standard student-ID/battle/profile crops have proportional faces and visible headwear; existing outer geometry and control placement remain intact. The root observations file records loaded images and zero page overflow. Team geometry and production browser regression remain in root's gate.
- Login adds only the selected effective bust. The new custom/costume/candy cases preserve the effective source without requesting a default standard sprite.

## Verification

- Confirmed red-to-green for both preload findings and the same-URL DOM finding.
- Shared surface integration: **10 suites / 131 tests passed** after the three fixes, before adding the three login parameter cases.
- Latest focused run: **4 suites / 96 tests passed**, including all new cases (`PlayerInfo.test.js`, `preloadAssets.test.js`, `handbookPortraits.test.js`, `CharacterBustPortrait.dom.test.jsx`).
- `npm run lint`: passed.
- Explicit expanded ESLint against all eight owned JS/JSX source/test files: passed; temporary runner `.tmp/interface-polish/bust-review-lint.mjs` preserves project rules and covers files omitted from the maintained-file catalog.
- Type-check: no standalone TypeScript/type-check command exists in this JavaScript project. JSX compilation/build and full browser gates are owned by root.
- No remaining confirmed bust/preload defect; no stylesheet budget change or commit.
