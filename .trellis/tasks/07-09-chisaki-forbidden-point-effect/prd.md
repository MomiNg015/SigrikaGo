# Add Chisa Forbidden Point Effect

## Goal

Chisa's `liberty-purge` skill should make the red-cross removal points functionally forbidden for the opponent's next turn. While the existing `.liberty-purge-removal-mark` crosses remain visible, the marked opponent must not be able to place a normal stone on those intersections.

## Requirements

* Keep Chisa's current skill flow: resolve a legal placement, remove one-liberty groups from the resulting board snapshot, record `removalMarkIds`, and render the existing red-cross DOM marks.
* Treat active `game.libertyPurgeMarks` as temporary forbidden points for `clearAfterColor`.
* Reject ordinary moves by the forbidden color on those marked empty intersections with the same user-facing forbidden-point wording used by protocol bans.
* Reject targeted skills that require an ordinary legal-move point, including Chisa targeting a still-active opponent red-cross point.
* Keep non-turn-consuming skills from clearing the marks or bypassing the restriction; clear the marks after the marked opponent's real turn ends as today.
* Keep both desktop and mobile board previews/click confirmation aligned with the server/shared rule.
* Do not add new visual effects; reuse the existing red-cross visual as the player-facing signal.

## Acceptance Criteria

* [ ] After Chisa removes a stone and creates a red cross, the opponent cannot ordinary-move on that red-cross intersection before their turn ends.
* [ ] The Chisa player can still use the same point later after the opponent's real turn clears the red cross.
* [ ] Non-turn-consuming skills do not clear the red-cross ban and cannot use it as a legal-move target for the banned color.
* [ ] Board target preview and point confirmation do not advertise/click-confirm a banned red-cross point for the banned color on desktop or mobile.
* [ ] Existing Chisa visual behavior and red-cross centering remain unchanged.
* [ ] System-design docs describe the new behavior and generated HTML is refreshed.

## Definition of Done

* Focused unit tests cover the shared rule, target preview, and point confirmation paths.
* Relevant tests pass.
* `docs/system-design.md` and `docs/system-design.html` are updated because gameplay behavior changed.

## Technical Approach

Add a small shared helper around `game.libertyPurgeMarks` that answers whether a point is currently forbidden for a color. Use it from:

* `src/shared/gameStoneActions.js` for ordinary move rejection.
* `src/shared/gameSkillActions.js` for Chisa's legal-move skill placement rejection.
* `src/shared/boardView.js` for skill target preview.
* `src/room/roomView.js` and `src/room/actions/useRoomPointActions.js` for ordinary move preview/click confirmation.

The source of truth stays in `game.libertyPurgeMarks`; point objects do not need a new persisted field because the red-cross state already has owner, `clearAfterColor`, and `pointIds`.

## Decision

Context: The existing red-cross state already persists for exactly the desired lifetime and identifies the opponent via `clearAfterColor`.

Decision: Reuse `libertyPurgeMarks` as the temporary forbidden-point contract instead of introducing another point-local marker or protocol-ban variant.

Consequences: The behavior follows the existing cleanup timing automatically and avoids visual churn, but all consumers that only receive a point need either the game object or a precomputed flag.

## Out of Scope

* Changing the red-cross visual design, timing, animation, or color.
* Changing Morneye `protocol-takeover` long-term protocol-ban behavior.
* Adding admin configuration for Chisa's skill.

## Technical Notes

* Current Chisa rules live in `src/shared/gameSkillActions.js`.
* Ordinary moves are resolved in `src/shared/gameStoneActions.js`.
* Red-cross cleanup is centralized in `src/shared/gameSkillState.js`.
* Board preview uses `src/shared/boardView.js` and `src/room/roomView.js`.
* Click confirmation uses `src/room/actions/useRoomPointActions.js`.
* Existing design docs mention Chisa at `docs/system-design.md`.
