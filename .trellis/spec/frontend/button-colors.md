# Bright School Button Colors

The ordinary player palette is owned by `quality-base/button-color-roles.css` and `quality-base/button-color-states.css`, loaded last in the Bright School QA entry. Roles use existing paper, ink, blue, pink, mint and danger tokens.

- Paper is secondary/back/close; light blue is navigation/tools; stronger blue is selected tabs; pink is primary confirmation; mint is affirmative state/actions; muted red is danger/logout/resign.
- Keep color owners limited to custom color properties, `background`, `color` and `border-color`. Layout, dimensions, borders, radii, typography, shadows, motion and content remain in their current owners.
- The visible result must change without adding hints, ownership counts, decorative labels or other content.
- Use explicit semantic button selectors. Never paint all buttons under the theme or target image/card classes through broad substring selectors.
- Exclude the corrupted app state, `sigrika-candy-duel-room`, special duel confirmations, skill actions and tutorial-choice actions. Keep image buttons, the original handbook sortie flag, dedicated profile/shop/recruitment/IRIS colors and admin styling intact.
- Apply special-scene exclusions to the control as well as the surface selector: the duel confirmation is nested inside the ordinary home screen, so excluding only its modal selector still matches the home ancestor.
- `logout-action` on both home variants and `draw-action` in ActionBar are color hooks only; handlers and disabled logic remain unchanged.
- Hover/focus follows the action's role. Native/ARIA disabled state keeps a muted palette on hover. Enabled text/icons must remain readable against the final rendered fill.
- Validate desktop and portrait mobile with the real ancestor chain. Compare dimensions, text, borders, shadows and motion before/after; inspect computed color winners rather than assuming a token wins.

`src/styles/themes/bright-school/buttonColors.test.js` enforces the color-only declaration boundary and protected selectors. Existing theme and component tests cover imports and behavior; browser QA verifies states, contrast and unchanged geometry.
