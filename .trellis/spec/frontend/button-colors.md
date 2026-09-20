# Bright School Button Colors

The ordinary player palette and interaction states are owned by `quality-base/button-color-roles.css` and `quality-base/button-color-states.css`, loaded last in the Bright School QA entry. Roles use existing paper, ink, blue, pink, mint and danger tokens.

- Paper is secondary/back/close; light blue is navigation/tools; stronger blue is selected tabs; pink is primary confirmation; mint is affirmative state/actions; muted red is danger/logout/resign.
- Keep `button-color-roles.css` limited to color variables. `button-color-states.css` owns ordinary fill, ink, border color, hard shadow, focus outline, transform, transition and disabled feedback. Layout, dimensions, border width/radius, typography and content stay with components. Do not restore ordinary icon/action selectors to `refinement-controls.css`.
- The visible result must change without adding hints, ownership counts, decorative labels or other content.
- Use explicit semantic button selectors. Never paint all buttons under the theme or target image/card classes through broad substring selectors.
- Exclude the corrupted app state, `sigrika-candy-duel-room`, special duel confirmations, skill actions and tutorial-choice actions. Keep image buttons, the original handbook sortie flag, dedicated profile/shop/recruitment/IRIS colors and admin styling intact.
- Apply special-scene exclusions to the control as well as the surface selector: the duel confirmation is nested inside the ordinary home screen, so excluding only its modal selector still matches the home ancestor.
- `logout-action` on both home variants and `draw-action` in ActionBar are color hooks only; handlers and disabled logic remain unchanged.
- Hover is limited to fine pointers with hover capability. Pressed fill stays in the same role hue; pressed shadow shortens. Focus has a separate ink outline. Native disabled, ARIA disabled and busy states suppress movement; reduced-motion keeps color feedback without movement. `data-button-role` explicitly classifies otherwise unstyled ordinary controls as primary/secondary/tool/success/danger. Bookmark tabs and guided actions are excluded from the ordinary state owner.
- Hover/focus follows the action's role. Native/ARIA disabled state keeps a muted palette on hover. Enabled text/icons must remain readable against the final rendered fill.
- Validate desktop and portrait mobile with the real ancestor chain. Compare dimensions, text, borders, shadows and motion before/after; inspect computed color winners rather than assuming a token wins.

`src/styles/themes/bright-school/buttonColors.test.js` enforces the role-only color boundary, layout-free state owner, input states and protected selectors. Existing theme and component tests cover imports and behavior; browser QA verifies states, contrast and unchanged geometry.
