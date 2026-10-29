# Battle arcade controls

## Scope
Normal Bright School player ActionBar only. The selected handheld pod replaces the five equal-weight controls. Exclude `.is-sigrika-corrupted`, `.sigrika-candy-duel-room`, spectator/replay, dead-stone decision bars and tutorial action overrides. Other themes keep `display: contents` keycap wrappers.

## Data and semantics
`RoomBattleStage` remains the source of `effectiveSkillDisplayForPlayer` and `effectiveSkillUsesForColor`. Render the current effective name directly on the skill key; `remainingUses` defaults/clamps to zero. `aria-label` includes the name and remaining count, `aria-pressed` reflects pending targeting. The visible zero-padded counter is aria-hidden to avoid repeating it. A positive count remains rainbow while turn/preview availability disables the native button; only zero/no-skill is gray. Retain every control in unsupported modes using native disabled.

## Owners
`ActionKey` wraps the five native buttons, without changing callbacks or confirmation ownership. Its transient `data-pressed` moves only the cap; pointer cancellation/leave, element/window blur, disable and unmount clear it. A 120ms release hold makes quick clicks visible. Keyboard Enter/Space and touch share the same feedback. Never defer a game callback for animation.

`battle-arcade-layout.css`, `battle-arcade-keys.css`, and `battle-arcade-skill.css` load last in mobile-adaptive.css. Their explicit repeated-theme owner wins over ordinary button states and old mobile equal-column/flat resets. Local physical cap radii, pastel rainbow and IRIS counter colors are user-approved exceptions, not global tokens. The counter uses existing `--font-iris-mixed` (WuWa digits + Dotted Songti fallback), while names use shared UI typography.

Desktop has auxiliary left rail, two medium ovals and right skill paddle. Reserve the pod's height by bounding the square board column against desktop viewport height. Portrait keeps count/resign above pass/draw with a two-row skill paddle. The existing `useMobileDockBaseline` continues measuring actual action height; preserve its scrolling and board ratio. All native targets are at least 44px; long names wrap and omit the decorative skill icon.

## Verification
`ActionBar.test.js` and `ActionBar.dom.test.jsx` cover mode locks, all callbacks, effective display updates, zero/turn distinction, press cleanup and alternate bars. `verify-production.mjs` runs real RoomBattleStage with the full theme cascade at 1440×768, 1920×1080, 390×844 and 320×568; check bounds, square board, names/counter, five measured downstrokes, touch, reduced-motion and protected-theme exclusions. Do not validate only the isolated sample CSS.

The sibling `tutorial.html` illustrates the current override with real TutorialBattleScreen. It is deliberately a step-specific single action or answer list, with no arcade class or charge window. `verify-tutorial.mjs` covers six states at 1440/390/320px and real input transitions; do not use this illustration as evidence that the arcade pod was integrated into tutorial controls.
