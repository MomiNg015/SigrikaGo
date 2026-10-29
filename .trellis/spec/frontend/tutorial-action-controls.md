# Tutorial action controls

## Scope
Local TutorialBattleScreen only. Reuse normal ActionBar geometry and ActionKey press feedback; preserve network game rules and normal ActionBar defaults. Answer/manual continue choices replace the region; no other phase may render an empty region.

## Signatures
- `ActionBar({ tutorialAction })`: `undefined` preserves ordinary rules; `""` keeps all five keys disabled; `pass | counting | skill | draw | resign` enables only that key, even during tutorial counting confirmation.
- `RoomBattleStage({ actionPanelOverride, tutorialAction, tutorialSkillName })`: override can be a node or `(defaultActionPanel) => node`. Skill name may come from the script; counts remain derived from the current local game.
- `activeTutorialAction({ node, phase, pendingWait, loading, choicesVisible, confirmExit })` is the common gate for render and callbacks. An open history popup is treated as a blocking overlay.
- `RoomHeader.beforeExitActions` inserts before exit. `ChatBox({ iconOnly, popupPlacement: "below", onOpenChange })` reuses portal history with accessible labeling and viewport clamping.

## Data and cross-layer contracts
Shared `TUTORIAL_NODE_TYPES.pass = "pass"` and `.draw = "draw"` are serialized unchanged. Authoring and workbook settlement groups expose `actor` (`player` or automatic/NPC); server validation uses the shared enum. Player pass/draw/resign/counting nodes require the matching normal button; player-skill always maps to skill. Pass calls shared `passMove`; draw produces local agreed-draw completion. Neither sends a network request or changes normal draw negotiation.

## States and errors
| State | Visible region | Allowed input |
| --- | --- | --- |
| Explicit answers/manual continuation | Option buttons | Current choice/continue |
| Guided action | All five normal keys | Matching key only |
| Board targeting, waiting, automatic execution | All five normal keys | Only the applicable board/script input |
| Exit/history overlay, loading | All keys locked when visible | Overlay actions |
| Duplicate node/action callback | Existing region | Ignore duplicate |
| Invalid local action result | Existing region | Clear submission lock and use existing warning |

## Good and bad
Good: render the default ActionBar and mark a single `data-tutorial-target`, then independently validate callbacks. Bad: one-off skill/counting buttons or an empty nav during board selection. Good: use the actual keycap rect and four computed CSS radii for mask arcs. Bad: use a fixed 6px rectangle around an elliptical key or rounded option.

## Tests
ActionBar DOM tests cover all five keys and dead-stone tutorial behavior. Tutorial action-state tests cover mappings, overlay/transition locks and SVG arc geometry. Local state/server/workbook tests cover pass/draw and immutable state. Existing ChatBox draft/dock tests remain alongside header-popup tests. Real preview verification covers nine states at 1440/390/320px, all action transitions, duplicate pass input, mobile popup bounds, Escape/focus and outside dismissal.

## Wrong / correct examples
Wrong: `return <nav className="tutorial-action-bar" />` while selecting a skill target. Correct: `return normalActions` with `tutorialAction=""`. Wrong: expose a text-and-count history tab at the mobile bottom. Correct: a 44px icon-only header trigger immediately before exit, with a labeled popup below it; desktop stays unchanged.
