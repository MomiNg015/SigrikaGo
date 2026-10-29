# Tutorial action controls

## Scope
Local TutorialBattleScreen only. Reuse normal ActionBar geometry and ActionKey press feedback; preserve network game rules and normal ActionBar defaults. Always retain the five-key region. Ordinary answers use an independent absolute overlay; no phase replaces or empties the region.

## Signatures
- `ActionBar({ tutorialAction })`: `undefined` preserves ordinary rules; `""` keeps all five keys disabled; `pass | counting | skill | draw | resign | continue` enables only that key, even during tutorial counting confirmation.
- `RoomBattleStage({ actionPanelOverride, tutorialAction, tutorialSkillName })`: override can be a node or `(defaultActionPanel) => node`. Skill name may come from the script; counts remain derived from the current local game.
- `activeTutorialAction({ node, phase, pendingWait, loading, choicesVisible, confirmExit })` is the common gate for render and callbacks. An open history popup is treated as a blocking overlay. `tutorialContinueForState` maps manual waits, phase continuation, preview skip and a single continue-only option to the counting slot. `tutorialContinueLabel` plus `onTutorialContinue` pass through RoomBattleStage to ActionBar; keep the other four keys disabled and never call the counting-request callback. A submission ref blocks repeated clicks within the same continuation state.
- `RoomHeader.beforeExitActions` inserts before exit. `ChatBox({ iconOnly, popupPlacement: "below", onOpenChange })` reuses portal history with accessible labeling and viewport clamping.

## Data and cross-layer contracts
Shared `TUTORIAL_NODE_TYPES.pass = "pass"` and `.draw = "draw"` are serialized unchanged. Authoring and workbook settlement groups expose `actor` (`player` or automatic/NPC); server validation uses the shared enum. Player pass/draw/resign/counting nodes require the matching normal button; player-skill always maps to skill. Pass calls shared `passMove`; draw produces local agreed-draw completion. Neither sends a network request or changes normal draw negotiation.

## States and errors
| State | Visible region | Allowed input |
| --- | --- | --- |
| Explicit answers | Five disabled keys plus independent floating replies | Current choice |
| Manual/phase/single-option continuation | Five keys; counting becomes Continue with Play icon | Continue only |
| Guided action | All five normal keys | Matching key only |
| Board targeting, waiting, automatic execution | All five normal keys | Only the applicable board/script input |
| Exit/history overlay, loading | All keys locked when visible | Overlay actions |
| Duplicate node/action callback | Existing region | Ignore duplicate |
| Invalid local action result | Existing region | Clear submission lock and use existing warning |

## Good and bad
Good: render the default ActionBar and mark a single `data-tutorial-target`, then independently validate callbacks. Bad: one-off skill/counting buttons or an empty nav during board selection. Good: use the actual keycap rect and four computed CSS radii for mask arcs. Bad: use a fixed 6px rectangle around an elliptical key or rounded option.

Tutorial action-key focus does not draw an external outline. Reply choices have inset keyboard focus and a flat 20% black backdrop beneath them, with no spotlight cutouts. Keep the spotlight and the existing hard shadow/press feedback; this is scoped to tutorial actions and its header history trigger. Ordinary game focus styles remain unchanged.

The Continue cap reuses the original guided-actions yellow gradient. In tutorials, `data-tutorial-inactive` reuses the existing spent palette for the skill cap/counter outside the active skill-button step; it must not change `data-skill-uses`. Ordinary battle palette behavior stays unchanged. `tutorialSkillButtonName` uses the same normalized `tutorialSkillConfig` as execution, including explicit derived skill objects. A player with no character gets the generic Skill label outside player-skill nodes; a scripted Denia step displays and executes Denia, then returns to the generic label without assigning a character.

## Tests
ActionBar DOM tests cover all five keys and dead-stone tutorial behavior. Tutorial action-state tests cover mappings, overlay/transition locks and SVG arc geometry. Local state/server/workbook tests cover pass/draw and immutable state. Existing ChatBox draft/dock tests remain alongside header-popup tests. Real preview verification covers eleven states at 1440/390/320px, all action transitions, duplicate pass input, mobile popup bounds, Escape/focus and outside dismissal.

## Wrong / correct examples
Wrong: `return <nav className="tutorial-action-bar" />` while selecting a skill target. Correct: `return normalActions` with `tutorialAction=""`. Wrong: expose a text-and-count history tab at the mobile bottom. Correct: a 44px icon-only header trigger immediately before exit, with a labeled popup below it; desktop uses the same header trigger and popup. Both triggers share geometry, border, hard shadow and press feedback with Exit, differing only in color and icon.

## Floating reply contract

- `TutorialChoiceActions({ node, onChoice, onRevealText, disabled })` is keyed by node and unmounts between attempts. Keep its synchronous submission ref and native disabled state. Opening history/exit locks the group with `inert`; closing history must not steal the restored header focus.
- `useTutorialChoicePlacement(groupRef, count)` measures only the current root's board frame and self info. Mobile starts below the entire frame; desktop remains to its right near the self panel's bottom. ResizeObserver, viewport and scroll updates must never resize the board or action bar. Cleanup all listeners/frames.
- Transparent absolute overlay, equal-width rows, descending rightward staircase; rows slide 210ms with total stagger below 90ms. Reduced motion disables entry and press movement. Opaque pale green, 3px ink outline and hard shadow are the approved reply style, reusing existing tutorial state colors.
- Compact width/height/font/gap before internal scrolling. Mobile 12px text and 27px minimum row are local short-screen exceptions; preserve full wrapped text, gaps and reachable final choice. A viewport-sized pointer-transparent backdrop sits below replies and above normal room content; history and exit overlays remain above it. Unmount the backdrop with replies. Single Continue/Continue Now stays in the original native control slot; ordinary single replies float.
- Validate the complete theme cascade in the real component preview at desktop and 390/360/320px portrait widths; check choice removal does not shift the board, correct/wrong branches, duplicate input, history focus, keyboard and reduced motion.

- Scrollport paint bounds: reserve 6px on both horizontal sides for the 4px right shadow and 5px left hover extent. Derive row width from the actual content box minus the staircase span, not a fixed pixel width that ignores scrollbar occupancy. Browser verification must compare painted shadow extents with clientWidth, including a reserved scrollbar gutter.

- Mobile dialogue sits 8px below the battle stage top (about 14px below header), moving portrait and copy together. Scope to the tutorial battle root; preserve desktop and home-guide positioning.

## Action-cue design samples (pending selection)

`docs/design-samples/tutorial-action-cues-2026-10-29/` compares focus corners, expanding halos and a pointing-hand icon over the real tutorial. This is not a production contract change. Keep experimental decoration pointer-transparent above the existing spotlight, track the actual keycap/point, and unmount it on completion. Include static reduced-motion markers. Verify entire animated paint bounds near viewport edges, not just the target rect; short-screen previews may scroll the existing room to reveal a new target, but must not shrink the board to make a sample fit. Production adoption requires the user's selected direction.

The user selected A (focus corners); the sample now also includes real home onboarding. Home highlighting must follow actual component paint, including transparent art, corner radii and shadows, rather than a rectangular scrim cutout. Every highlighted target/surface must stay fully bright with A focus markers, including narrated member-details and resume windows; only target-free steps remove the markers. Keep markers below NPC/dialogue. The experimental inert paint copy is sample-only, strips source selectors/IDs and leaves input on the original guide proxy. A captured entry-animation opacity of zero must not freeze the copy: track source root opacity/transform and refresh descendants when finite entry animations finish. Install local API fixtures before importing app modules, since catalog imports can fetch immediately; verify no API traffic, every highlighted step in complete desktop/phone tours, action progression and phone menu targets before delivery.
