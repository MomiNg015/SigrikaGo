# Move candy cancellation to selection cards

Move the development candy-cancel action out of ordinary/legacy handbook and onto active-effect character cards in ordinary and team selection dialogs. Use a separate native icon button over the card, avoiding nested buttons or select/voice/close side effects. Preserve development/authentication/corruption checks and server endpoint. Block concurrent submissions, disable pending actions, update account state from the response and report errors without losing active effects. Keep candy-disabled Sigrika visible as an unselectable card so her effect can be cancelled; do not let this bypass match/team availability. Rainbow borders remain in handbook and selectors. Update documentation and verify mouse/keyboard, API/state, inactive actors, pending/error, desktop/portrait.

## Validation

- 73 focused tests passed across cancellation, HomeScreen, ordinary selection, fixed team lineup, handbook and HouseModal. Covers authenticated endpoint/state updates, duplicate submission blocking, failure retry with Enter/Space, no voice/selection/close side effects, production/no-auth gates, and Sigrika restoration.
- Browser verified ordinary/team selectors at 1440×900 and 390×844, four active cancellation icons, mouse and keyboard endpoint flow, preserved empty team slots, no nested buttons and removal of handbook actions. Reviewed screenshots: 28px icon plate, 44px accessible hit region, no portrait-face or selected-stamp overlap.
- Full ESLint, production build, built CSS contracts and system-design HTML generation passed. Earlier 6px radius was replaced with the documented 8px scale; no hook suppression was added.
