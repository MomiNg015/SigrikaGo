# Battle arcade controls

## Scope
Bright School player ActionBar, including tutorial reuse of the same five keys. The selected handheld pod replaces the five equal-weight controls. Exclude `.is-sigrika-corrupted`, `.sigrika-candy-duel-room`, spectator/replay, ordinary dead-stone decision bars and tutorial answer choices. Other themes keep `display: contents` keycap wrappers.

## Data and semantics
`RoomBattleStage` remains the source of `effectiveSkillDisplayForPlayer` and `effectiveSkillUsesForColor`. Render the current effective name directly on the skill key; `remainingUses` defaults/clamps to zero. `aria-label` includes the name and remaining count, `aria-pressed` reflects pending targeting. The visible zero-padded counter is aria-hidden to avoid repeating it. In ordinary battles a positive count remains rainbow while turn/preview availability disables the native button; only zero/no-skill is gray. Tutorials gray the cap and counter whenever Skill is not the current allowed action, without altering charges. Retain every control in unsupported modes using native disabled.

## Owners
`ActionKey` wraps the five native buttons, without changing callbacks or confirmation ownership. Its transient `data-pressed` moves only the cap; pointer cancellation/leave, element/window blur, disable and unmount clear it. A 120ms release hold makes quick clicks visible. Keyboard Enter/Space and touch share the same feedback. Never defer a game callback for animation.

`battle-arcade-layout.css`, `battle-arcade-keys.css`, and `battle-arcade-skill.css` load near the end of mobile-adaptive.css, before the tutorial-specific owner. Their explicit repeated-theme owner wins over ordinary button states and old mobile equal-column/flat resets. Local physical cap radii, pastel rainbow and IRIS counter colors are user-approved exceptions, not global tokens. The counter uses existing `--font-iris-mixed` (WuWa digits + Dotted Songti fallback), while names use shared UI typography.

Desktop has auxiliary left rail, two medium ovals and right skill paddle. Reserve the pod's height by bounding the square board column against desktop viewport height. Portrait keeps count/resign above pass/draw with a two-row skill paddle. The existing `useMobileDockBaseline` continues measuring actual action height; preserve its scrolling and board ratio. All native targets are at least 44px; long names wrap and omit the decorative skill icon. Center the visible icon and label together with symmetric vertical padding; the absolutely positioned count window must not push this group downward.

## Verification
`ActionBar.test.js` and `ActionBar.dom.test.jsx` cover mode locks, all callbacks, effective display updates, zero/turn distinction, press cleanup and alternate bars. `verify-production.mjs` runs real RoomBattleStage with the full theme cascade at 1440×768, 1920×1080, 390×844 and 320×568; check bounds, square board, names/counter, five measured downstrokes, touch, reduced-motion and protected-theme exclusions. Do not validate only the isolated sample CSS.

The sibling `tutorial.html` mounts real TutorialBattleScreen. The five-key bar stays present during board input, waiting and automatic phases; answer choices float independently and never replace it. Continuation uses the counting slot with the original yellow fill and a Play icon, preserving the five-key layout and original progression callbacks. Eleven states at 1440/390/320px exercise every guided key and the mobile header history. See `tutorial-action-controls.md` for action gating and script contracts.
