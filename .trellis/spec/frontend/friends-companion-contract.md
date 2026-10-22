# Friends Companion Window

## Scope and ownership
`FriendsModal` uses `FriendsCompanionView` for the approved companion layout. Keep `FriendsToolbar` and `WindowBookmarkTabs`: ordinary Bright School Friends/Blacklist tabs remain outside the left edge at desktop and portrait widths. Other themes retain their existing tab fallback. The legacy `FriendsList` is retained for historical design comparisons and portrait fixtures, not used by the production modal.

## State and data contracts
- Keep selected user IDs per tab. Derive the current row from the latest `friends`/`blacklist` arrays, falling back to the first available row. Empty lists show the shared empty state and no companion panel.
- Both panes use `UserIdentity` and `characterPortraitImageProps` with the row's `itemEffects` and `user` properties. List portraits request `avatar`, the companion requests `full`. Preserve equipped costumes, candy states, titles, badges and nameplates.
- Search remains normalized global username lookup through `/api/users/search/profile?username=...`.
- Duel requests retain `duel:request` with `{ targetUserId, mode }` and real `modeOrderedEntries()` options. Only online friends may request a duel. Blacklist has no duel button.
- Relationship mutations retain `/api/social/friends/:id` or `/api/social/blacklist/:id`. Destructive actions use existing confirmations, pending guards and failure/retry behavior.
- Capture the focused invoking control before every nested operation. Key the companion panel by selected ID so deleting its user removes the old action nodes; close-control focus is the fallback when the opener disappears.

## Layout and feedback
Final owners are `friends-companion.css`, `friends-companion-mobile.css`, `friends-companion-feedback.css` and `friends-companion-search.css`, imported after ordinary window-paper ownership. Do not reposition or restyle the exterior bookmark rail.

The search form uses one paper frame and hard shadow, a decorative leading icon, an unboxed input and a labelled tool-color submit button separated by an ink rule. Keep the input's 16px font, the submit target's 44px height, a visible focus-within ring and full-width portrait layout. Hover and press preserve the shared tool palette; reduced motion removes transitions. The form still submits on Enter and looks up a global username, never filters the current roster.

Desktop uses a scrolling list beside a companion panel. At 768px and below stack the list above the action panel. The list owns scrolling; both list ends reserve room for hard shadows. Short phones may scroll the companion panel internally, but every action stays reachable. At 360px and below hide only the decorative duel icon to preserve its text width.

Friend cards and the companion panel use opaque paper, ink borders and hard shadows. Resting rows use 3px/4px shadows; fine-pointer hover translates -1px/-2px and uses 4px/6px shadows; press translates 2px/3px and reduces shadows to 1px/1px. Disabled actions never lift. Reduced motion removes transition properties while preserving instantaneous feedback. Avoid overriding the shared title sticker, ordinary-window grid or semantic action palette.

## Verification
`FriendsModal.dom.test.jsx` covers nested focus, real duel payload, per-tab selection, removal fallback, disabled availability, repeated mutation guards and retry. Static tests cover shared appearance and nameplate propagation. `tests/e2e/friends-companion.spec.js` covers desktop, 800px, 390/360/320px, short portrait, left bookmark placement/keyboard navigation, last-row shadow clearance, selection and removal, and hover/press/reduced-motion behavior.
