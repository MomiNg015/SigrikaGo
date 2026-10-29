# Battle arcade control concepts

## Production integration

`tutorial.html` renders the real `TutorialBattleScreen` with ten local fixtures: manual dialogue, a single continue-only option, automatic dialogue, answer choices, board placement, skill, counting, resignation, pass and draw. The normal five-key pod remains visible unless answer choices replace it. Continuation temporarily changes the counting key to Continue with a Play icon; the other four keys stay disabled, and the original counting action returns afterward. Only the current guided action is enabled and highlighted. Skill-to-board targeting retains the pod with all keys locked. The focus mask follows the rendered cap/option corner arcs without exposed bright corners.

On portrait phones, story history is an icon-only header button immediately left of exit; the popup opens below it, clamps to the viewport, and dismisses by close, Escape or outside input. Desktop history remains beside the player. Answer choices use the full available width even at 320px.

`verify-tutorial.mjs` covers 30 state/viewport cases at 1440, 390 and 320px, all five guided actions, duplicate pass/continue submission, counting-slot continuation, skill targeting, reset, answer-to-move progression, and mobile history bounds/focus/dismissal. `tutorial-<state>-<width>.png` and `verification-tutorial.json` record the actual UI. Review toolbar corners use the documented 8px control radius. These fixtures make no network game mutations.

The selected pod is now integrated into normal Bright School `ActionBar`. Open `production.html` through Vite (port 5173). This page renders the real `RoomBattleStage`, its default action path, current player/derived-skill display plumbing and complete production styles; fixture callbacks stay local. It includes state controls for ready, waiting, spent, long names, gomoku, spectator and finished. The original static comparison remains a historical design artifact.

The production version adds recessed key seats, cap bevels, a mint case edge and vertical downstroke. Final normal-theme CSS excludes corrupted and duel surfaces. Desktop reserves viewport height for the pod; short portrait screens retain the existing scroll behavior and measured dock baseline. Existing counting copy remains 数子.

`verify-production.mjs` checks real component geometry and behavior; results are stored in `verification-production.json` and `production-*.png`. Unit/DOM tests verify callbacks, disabled modes, effective skill updates and cancellation lifecycle. Palette/radius warnings are intentional bounded exceptions documented in DESIGN.md and the battle-arcade-controls code spec. Old literal colors in unrelated contract tests are historical assertions, not new design choices.

Open `index.html` through a local HTTP server rooted at the repository. Current preview: <http://127.0.0.1:8765/docs/design-samples/battle-arcade-2026-10-29/index.html>.

## Selected pod revision

The user selected direction 3 and requested direct skill names, an IRIS-like counter window, rainbow while uses remain, gray at zero, and visible press feedback for all five actions. The preview now defaults to pod; original alternatives remain available for comparison.

- `pod-v2.css` is the selected sample's local style owner. Skill names replace the generic 技能 label, wrap on narrow screens, and suppress the decorative icon for the long-name stress case. The duplicate name/count line is hidden.
- The upper-right counter uses the exact IRIS window font stack (`Sigrika Accent Latin` then `IRIS Dotted Songti Circle`) and existing local font files. Deep navy, cyan border, green status dot and cut corners come from the existing IRIS palette. It moves with the cap.
- `data-uses="0"` owns the gray cap/counter state. Turn locking leaves a positive-use cap rainbow and disables interaction. This distinguishes remaining charges from temporary unavailability.
- Pointer/keyboard presses move caps down to 2px for every enabled action, with a 130ms release hold for quick taps. Pointer cancellation, focus loss and rerender clear transient presses. Selected skill remains depressed after release; disabled buttons never press. Reduced-motion removes transitions.
- Run `node docs/design-samples/battle-arcade-2026-10-29/verify-pod-v2.mjs`: 12 state/width cases verify actual name wrapping, counter geometry, loaded font, gradient versus zero-use gray, and 5 measured presses plus pointer cancellation, keyboard and touch.
- Rainbow palette findings are intentional per the explicit user request. IRIS colors/fonts are reused rather than new global tokens. No global design-hook suppression is added.
- This first revision covered the standalone preview; production integration is recorded above.

## Initial review findings

- Before this change, `src/room/ActionBar.jsx` rendered five actions with the dynamic skill name and remaining uses combined in one line.
- `src/styles/themes/bright-school/room/flat-controls.css` suppresses shadows on all battle actions. The portrait `dock-actions/action-grid.css` and `mobile-room-portrait/action-decision-controls.css` enforce equal columns and a 46px height. These explain the flat, undifferentiated control weights.
- The product identity is warm paper, dark brown ink, pastel pink/blue/mint, bundled LXGW Marker Gothic and short hard shadows. The samples reinterpret physical arcade controls within that identity.

## Directions

| Direction | Desktop | Portrait phone | Tradeoff |
| --- | --- | --- | --- |
| Round arcade | Large central pink skill cap; medium blue counting and clay-red resign caps; small cream auxiliary caps | Five-key arc with 44px minimum secondary targets; separate skill-name line | Strongest arcade recognition; the circular form needs more horizontal room |
| Stepped keys | Wide, tall skill key with medium and short flanking keys | Skill spans two rows on the left; medium keys above the two auxiliary keys | Compact and legible; closer to mechanical keycaps |
| Handheld pod | Auxiliary rail, two medium ovals and right-side skill paddle | Medium/auxiliary two-row group on the left, large skill key on the right | Strong grouping and right-thumb access; larger departure from current order |

## Original standalone sample boundaries

- These are standalone visual and interaction samples. No production imports, game mutations, network APIs, theme changes or gameplay changes.
- Surrounding board and players are static context, not a complete reconstruction of the production battle layout. Existing local chibi avatars and font are reused.
- Counting is labeled 数目 following the request; production currently says 数子. No global terminology change was made.
- The initial round/key variants keep the generic label and separate name line. The selected pod revision puts the name and counter directly on the key. Long-name, spent, waiting and selected cases are provided.
- Pass/resign use native modal confirmation. Requests and confirmations produce local feedback only. Reduced-motion preference removes transitions; native keyboard focus is visible.
- Numbered markers identify the three alternatives in review chrome; they are not proposed product UI. Additional shades are intentional physical cap/base/paper tones local to the sample. The font alias was corrected to `Sigrika Window Title`, which loads the existing LXGW font. Design-hook palette/number findings are contextual exceptions, not production design-system changes; no suppression configuration was added.
- The initial exploration established no production code-spec. The selected implementation now has `.trellis/spec/frontend/battle-arcade-controls.md`.

## Verification

Run `python -m http.server 8765 --bind 127.0.0.1` from the repository, then `node docs/design-samples/battle-arcade-2026-10-29/verify.mjs`. Uses installed Microsoft Edge through Playwright.

- Nine viewport/variant cases: 900px desktop component context, 390px and 320px portrait.
- Five visible controls; minimum 44×44 targets; no horizontal overflow; skill area greater than counting/resign, whose areas exceed auxiliary actions.
- All five action flows; modal cancel/confirm, Escape, focus restoration; selected skill toggling.
- Waiting/spent/long-name cases at every size; synchronized desktop/phone selectors, phone-width control and reset; keyboard Enter and reduced-motion.
- No page errors or failed resource requests in the tested cases. `verification.json` contains measured geometry. `preview-*.png` show complete paired previews; individual screenshots cover mobile/desktop and long names.
- Standalone JS syntax checks pass. This design-only task does not claim a full production regression run.
