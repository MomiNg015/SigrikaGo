# Quality Guidelines

> Code quality standards for backend development.

---

## Overview

<!--
Document your project's quality standards here.

Questions to answer:
- What patterns are forbidden?
- What linting rules do you enforce?
- What are your testing requirements?
- What code review standards apply?
-->

(To be filled by the team)

---

## Forbidden Patterns

<!-- Patterns that should never be used and why -->

(To be filled by the team)

---

## Required Patterns

<!-- Patterns that must always be used -->

### Scenario: Story Script Presentation Fields

#### 1. Scope / Trigger
- Trigger: changing generic story script node fields, option fields, admin story editing, `StoryPlayerModal`, or story-script validation.
- Story scripts are stored as JSON in `StoryScript.draftNodesJson` and `StoryScript.publishedNodesJson`, so field additions must survive UI edit, API normalization, persistence, player playback, and legacy onboarding compatibility paths.

#### 2. Signatures
- Node fields: `{ id, speakerName, characterId, effect, text, nextNodeId, options }`, with battle tutorial progression fields `{ manualContinueEnabled, autoContinueEnabled, autoContinueDelaySeconds }` when present.
- Supported node effects come from `src/shared/storyPresentation.js`; empty string means no special effect.
- Option fields: `{ label, nextNodeId, revealDelaySeconds, transitionDelaySeconds }`.
- `revealDelaySeconds` is either blank or a non-negative finite number of seconds.
- `transitionDelaySeconds` is either blank or a non-negative finite number of seconds; blank means the option click transitions immediately.
- `manualContinueEnabled` and `autoContinueEnabled` remain the persisted compatibility fields for battle tutorial node progression. Current admin authoring treats them as one advance mode and writes a mutually exclusive pair; new nodes default to automatic progression. `autoContinueDelaySeconds` is blank or a non-negative finite number of seconds; blank means the product default for the active auto-progression path.
- Optional player-move fields are `targetHighlightEnabled` (default `true`), `wrongMovePointId`, `wrongMoveNextNodeId`, and `applyWrongMove` (default `false`). Optional board-setup fields are `boardSetupLoadingEnabled` (default `true`) and `boardSetup.lastMovePointId`.
- `nextNodeId: ""` on an option is a close-window action, not a validation failure.

#### 3. Contracts
- Keep story presentation constants in `src/shared/storyPresentation.js` when both frontend and backend need the same ids.
- `server/storyScripts.js` is the authoritative API normalization boundary for generic story scripts. It must preserve `effect`, per-option `revealDelaySeconds`, per-option `transitionDelaySeconds`, and battle tutorial progression fields when saving drafts, publishing, reading admin payloads, and returning player payloads.
- The legacy onboarding compatibility normalizer in `server/onboardingStory.js` must stay aligned enough to preserve the same node and option presentation fields when it parses legacy JSON.
- Admin editing should bind `effect` at node level and `revealDelaySeconds` at option level. Do not move reveal timing to the node unless the product contract changes.
- Player rendering should treat blank reveal delays as "after typewriter complete" and numeric delays as timers from current-node entry. Completing the typewriter immediately reveals all options.
- Player rendering should treat blank transition delays as 0 seconds. When an option has a positive transition delay, hide the options immediately, show the quiet "continuing" state, and enter the option target only after the timer completes. Admin preview may expose a preview-only skip-current-wait control; player playback must not expose per-wait skipping.
- Battle tutorial rendering should treat node progression as one selected advance mode: automatic progression uses `autoContinueEnabled` plus `autoContinueDelaySeconds`, while manual continuation shows a completed-node "continue" button and does not run an automatic timer. Current admin writes new nodes as automatic by default; older saved boolean combinations must still parse and preserve through the API boundary.
- Wrong-move targets are graph edges and must be checked at publish time like `nextNodeId` and option targets. All six optional tutorial fields must survive API normalization, draft/publish JSON, admin editing/preview, and v1 workbook round trips. A missing field or missing optional workbook column must use the documented default instead of failing an old script import.

#### 4. Validation & Error Matrix
- Unknown `effect` -> HTTP 400 story input error.
- Blank `effect` or missing `effect` -> normalize to no effect.
- Missing or blank `revealDelaySeconds` -> normalize to blank and wait for text completion.
- `revealDelaySeconds < 0`, `NaN`, or infinite -> HTTP 400 story input error.
- Missing or blank `transitionDelaySeconds` -> normalize to blank and transition immediately after click.
- `transitionDelaySeconds < 0`, `NaN`, or infinite -> HTTP 400 story input error.
- Missing `manualContinueEnabled` -> normalize to true.
- Missing `autoContinueEnabled` on `npc-dialogue` -> normalize to true; missing on other nodes -> normalize to false.
- Missing or blank `autoContinueDelaySeconds` -> normalize to blank and let the runtime apply the node-type default.
- Missing `targetHighlightEnabled` or `boardSetupLoadingEnabled` -> normalize to `true`; missing `applyWrongMove` -> normalize to `false`.
- Non-empty `wrongMoveNextNodeId` missing from the current script -> publish-time target error.
- Option `nextNodeId === ""` -> valid terminal close action.
- Non-empty option target missing from current script -> publish-time target error.

#### 5. Good/Base/Bad Cases
- Good: `{ effect: "long-text-compress-portrait" }` reaches the player and only that node switches story modal layout, with the default text region initial size, portrait compression after long typed content, and 1.5x typewriter speed.
- Good: one option with `revealDelaySeconds: 0.5` appears while the text is still typing, while a blank-delay sibling waits for text completion.
- Good: one option with `transitionDelaySeconds: 1.2` hides the option buttons on click, shows "continuing", then enters its target; a blank-delay sibling enters its target immediately.
- Good: a newly authored `npc-dialogue` node uses automatic progression and advances 1.5 seconds after typewriter completion when `autoContinueDelaySeconds` is blank.
- Base: older nodes with no `effect` or `revealDelaySeconds` continue playing with default behavior.
- Base: older options with no `transitionDelaySeconds` continue using immediate post-click navigation.
- Bad: adding an option timing field to the admin form but forgetting `normalizeOption()`, because the value will disappear on save.
- Bad: using a node-level options reveal delay after the option-level contract is established.

#### 6. Tests Required
- Backend story-script tests must assert effect normalization, invalid effect rejection, option reveal-delay preservation, option transition-delay preservation, battle progression flag defaults/preservation, blank compatibility, and invalid delay rejection.
- Tutorial story tests must also assert wrong-move target validation, optional-field defaults/preservation, display-only last-move preservation, and old v1 workbook compatibility.
- Player story tests must assert effect class/data hooks, option reveal timing before and after typewriter completion, and option transition-delay scheduling/pending feedback.
- Admin story tests must assert the effect control, option-level reveal and transition numeric timing inputs, and responsive option-row layout.
- CSS contract tests must keep default story layout unchanged, lock any special effect layout hooks, and prevent the long-text compression effect from starting with a smaller-than-default text region. Theme contract tests must also cover active mobile theme overrides, because Bright School mobile modal shell rules use `!important` and can otherwise revert effect nodes to the default onboarding story grid.

#### 7. Wrong vs Correct

Wrong:

```js
function normalizeOption(option = {}) {
  return {
    label: normalizeText(option.label),
    nextNodeId: normalizeText(option.nextNodeId)
  };
}
```

This silently drops option timing on save.

Correct:

```js
function normalizeOption(option = {}) {
  return {
    label: normalizeText(option.label),
    nextNodeId: normalizeText(option.nextNodeId),
    revealDelaySeconds: normalizeOptionRevealDelaySeconds(option.revealDelaySeconds),
    transitionDelaySeconds: normalizeOptionTransitionDelaySeconds(option.transitionDelaySeconds)
  };
}
```

### Scenario: Story Script Request Body Budget

#### 1. Scope / Trigger
- Trigger: changing global JSON parsing, `PATCH /api/admin/story-scripts/:key`, story draft save capacity, or HTTP 413 propagation.
- Story drafts grow with node, option, dialogue, and board-setup JSON, but unrelated API routes must retain the smaller denial-of-service boundary.

#### 2. Signatures
- `createJsonBodyParser()` selects one Express JSON parser per request.
- `isAdminStoryScriptWrite(req)` matches only `PATCH /api/admin/story-scripts/:key` with one non-empty key segment.
- Limits: `STORY_SCRIPT_JSON_BODY_LIMIT = "2mb"`; `DEFAULT_JSON_BODY_LIMIT = "64kb"`.
- Payload error response: HTTP 413 `{ error: string, code: "REQUEST_BODY_TOO_LARGE" }`.

#### 3. Contracts
- Keep the story-script budget route-scoped; do not raise the default parser to make one admin authoring surface work.
- Parser selection occurs before the shared JSON parser consumes the body, so the larger route cannot first fail at `64kb`.
- Story draft saves above `64kb` and at or below `2mb` must still enter the existing admin auth, validation, and persistence route unchanged.
- `requestBodyErrorHandler` converts parser 413 errors into JSON before route dispatch. Story-script errors name the `2mb` limit and recovery action; unrelated parser errors use a generic localized message.

#### 4. Validation & Error Matrix
- Story-script PATCH body between `64kb` and `2mb` -> parse and continue to the admin route.
- Story-script PATCH body above `2mb` -> HTTP 413 with the story-specific Chinese error and `REQUEST_BODY_TOO_LARGE`.
- Unrelated JSON body above `64kb` -> HTTP 413 with the generic Chinese error and the same code.
- Story-script GET, collection PATCH, or nested path -> use the default budget.
- Malformed JSON within budget -> continue to `jsonSyntaxErrorHandler` and return the existing HTTP 400 JSON.

#### 5. Good/Base/Bad Cases
- Good: a 200kb onboarding draft saves through `/api/admin/story-scripts/onboarding.default` while `/api/admin/site-settings` still rejects the same body.
- Base: ordinary API requests remain below `64kb` and behave exactly as before.
- Bad: `app.use(express.json({ limit: "2mb" }))`, because it expands every public and authenticated JSON endpoint for one admin-only need.

#### 6. Tests Required
- `server/jsonBody.test.js` must exercise real Express parsing for a story payload above `64kb`, an unrelated rejection at `64kb`, and a story rejection above `2mb`.
- `server/httpErrors.test.js` must assert both story-specific and generic localized 413 response shapes.
- Production build/config checks must prove the parser module is wired by `server/index.js` without changing downstream admin route semantics.

#### 7. Wrong vs Correct

Wrong:

```js
app.use(express.json({ limit: "2mb" }));
```

Correct:

```js
app.use(createJsonBodyParser());
app.use(requestBodyErrorHandler);
```

### Match Preload Room Boundary

### Scenario: Item-Character Story Trigger Identity

#### 1. Scope / Trigger
- Trigger: changing item-character story script authoring, `StoryScript.triggerParamsJson`, player item-use story lookup, shop item admin payloads, or publish-conflict logic.
- This is a cross-layer contract: admin selects a shop item, the story script stores trigger params, player inventory uses owned item ids, and the backend resolves the published story before falling back to item `effectText`.

#### 2. Signatures
- Trigger type: `item-character-use`.
- Trigger params: `{ itemId, characterId }`.
- `itemId` must be the stable `ShopItem.targetId` used by item ownership and item-use settlement, for example `rainbow-bean-candy`.
- `ShopItem.id` is only the database row id and must not be stored as the story trigger item id.

#### 3. Contracts
- `src/admin/AdminOnboardingStory.jsx` item trigger options must submit `item.targetId` while keeping the source row id available only for UI bookkeeping when needed.
- `server/storyScripts.js` remains the normalization and lookup boundary for `StoryScript.triggerParamsJson`.
- Player item-use story lookup must first try the exact normalized trigger params, then tolerate legacy item-character records whose stored `itemId` is a shop row id by mapping `ShopItem.id -> ShopItem.targetId`.
- Publish-conflict checks must use the same canonical item id mapping so an old row-id script and a new target-id script cannot both publish for the same character.
- If no published story is found after canonical lookup, the item-use response may continue to return the legacy item `effectText` fallback.

#### 4. Validation & Error Matrix
- Missing `itemId` or `characterId` -> story input error.
- Admin item option has no `targetId` -> do not expose it as a selectable item-character trigger.
- Stored legacy row id maps to a target id and character matches -> return that published story.
- Stored legacy row id maps to a target id and a new script tries to publish with that target id and character -> reject as trigger conflict.
- No exact or canonical story match -> return no story and let the caller use `effectText`.

#### 5. Good/Base/Bad Cases
- Good: using rainbow bean candy on Sigrika queries `{ itemId: "rainbow-bean-candy", characterId: "sigrika" }` and reaches the admin-published script even if an older saved row contains the shop row id.
- Base: a fresh admin save stores `rainbow-bean-candy` directly and exact lookup succeeds without legacy mapping.
- Bad: saving `triggerParamsJson.itemId = item.id`, because the player item-use path never sends that row id and will fall back to `effectText`.

#### 6. Tests Required
- Backend story-script tests assert legacy row-id records match target-id player lookup.
- Backend publish tests assert canonical row-id/target-id conflicts are rejected.
- Admin story editor tests assert item trigger options use `item.targetId` and not `item.id`.

#### 7. Wrong vs Correct

Wrong:

```jsx
{ id: item.id, name: item.name || item.id }
```

Correct:

```jsx
{ id: item.targetId, sourceId: item.id, name: item.name || item.targetId || item.id }
```

### Scenario: Rainbow Bean Candy Rejection Settlement And Story Branching

#### 1. Scope / Trigger
- Trigger: changing rainbow bean candy probability, `useInventoryItem()`, candy story nodes, temporary candy effects, Aemeath move feedback, Lynae voice remapping, the Denia candy achievement event, or warehouse item-use feedback.
- This is a cross-layer contract because one server-side random result controls transaction writes, API response fields, published-story entry, frontend toast/skip copy, achievement evaluation, Aemeath's room-board feedback, and Lynae's room/house/result voice routing.

#### 2. Signatures
- `useInventoryItem({ prisma, userId, itemId, characterId, random = Math.random })` returns `itemUseOutcome: "accepted" | "rejected"`.
- `RAINBOW_BEAN_CANDY_REJECTION_PROBABILITY = 0.35` and the stable story entries are `accepted-start` / `rejected-start` in `server/rainbowBeanCandyStory.js`.
- Candy narration nodes use `{ speakerName: "", characterId: "" }`; blank identity means the story window character region stays empty.
- Supported effect keys are `sigrikaCandyDisabled`, `deniaRainbowGlow`, `aemeathRainbowMove`, and `lynaeContraryVoice`.
- `src/shared/rainbowBeanCandy.js` is the shared frontend/backend registry for the candy item id, supported character ids, effect keys, and active-state labels. Warehouse target availability must consume this registry instead of maintaining a local character whitelist.
- `aemeathRainbowMoveEffectForRoom(room)` returns `{ pointId, key }` only when the latest history action is a move by an Aemeath player whose public user has `aemeathRainbowMove === true`; otherwise it returns `null`.
- `contraryLynaeVoiceEvent(event, { character, params })` remaps an event only when `canonicalCharacterId(character.id) === "lynae"` and `character.itemEffects.lynaeContraryVoice === true`.
- Finished room player payloads may expose `completedItemEffects: object | null`; this is a result-presentation snapshot, not the user's current persistent effect state.

#### 3. Contracts
- Resolve ownership, target validity, an already-active effect, and Sigrika fallback-character availability before rolling. Invalid use remains an HTTP error and never turns into a narrative rejection.
- For Sigrika, Denia, Aemeath, and Lynae, rolls `< 0.35` reject and rolls `>= 0.35` accept. Inject `random` in domain tests; production uses `Math.random`.
- Rejection performs no user/structured-asset write, does not decrement inventory, does not switch Sigrika, does not trigger the Denia candy achievement, and selects `rejected-start` in the returned published script.
- Acceptance consumes one candy, applies the character's temporary effect, selects `accepted-start`, and may trigger the Denia candy achievement. Sigrika acceptance does not award coins. Aemeath acceptance applies `aemeathRainbowMove` without changing stones, move legality, skills, scoring, or other game rules. Lynae acceptance applies `lynaeContraryVoice` without changing UI text, clock state, skill behavior, winner data, rewards, or result SFX.
- Aemeath's board marker is presentation-only: it is attached to the exact latest move point, is pointer-transparent, keeps the underlying black/white stone unchanged, and has a `prefers-reduced-motion` fallback. Its source must inherit the rendered stone's deterministic jitter offset so the two visual centers stay within 1 CSS pixel. Four traces follow the real horizontal/vertical axes to their corresponding board edges, fade from opaque at the source to transparent outward, and light each crossed intersection with distance-attenuated nodes. The Bright School portrait-mobile global `max-width` guard must be cleared only on owned trace elements so multi-cell rays are not capped to one point. Seven discrete frequency echoes replace a generic conic-gradient circle. Opponent moves, passes, skills, and inactive Aemeath users must not show it.
- A valid finished game clears `aemeathRainbowMove` only when that user played Aemeath; playing another character must preserve it for a later Aemeath game.
- Lynae voice remapping is fixed, not random: countdown `N` maps to `11-N`; period 2 ↔ period 1, game start ↔ byo-yomi start, sortie ↔ skill cast, and victory ↔ defeat. Draw, house detail, and timeout silence stay unchanged.
- A valid finished game clears `lynaeContraryVoice` only when that user played Lynae. Before mutating `player.user.itemEffects`, `prepareCandyEffectUpdates()` copies the pre-clear effects to `player.completedItemEffects`; `buildRoomView()` exposes that snapshot so `ResultModal` can still swap the current game's victory/defeat voice after persistent cleanup. No other next-game voice path may consume `completedItemEffects`.
- Warehouse feedback must not say “成功使用” on rejection, and rejection skip confirmation must state that the item was not consumed and the effect did not apply.
- Every server-supported candy target must be selectable in the warehouse while its effect is inactive and disabled as “效果中” while its registered effect key is active.

#### 4. Validation & Error Matrix
- Unsupported candy character -> existing HTTP 400 no-effect error, no random narrative branch.
- Candy effect already active -> existing HTTP 400 active-effect error, no consumption or random narrative branch.
- Sigrika is selected and no alternate owned character exists -> existing HTTP 400 fallback error before the roll.
- Rejected response with a published branch -> HTTP 200, unchanged user/items, blank `effectText`, `itemUseOutcome: "rejected"`, story `startNodeId: "rejected-start"`.
- Accepted response without a published script -> preserve the legacy `effectText` fallback.
- Latest action is not an Aemeath move with an active effect -> no rainbow board marker.
- Lynae effect is absent or the voice belongs to another character -> resolve the original event.
- Invalid or practice game -> do not clear `lynaeContraryVoice` and do not create a completion snapshot.
- Valid Lynae game -> persistent `itemEffects` no longer contains `lynaeContraryVoice`, while the finished room player exposes it in `completedItemEffects` for result voice only.

#### 5. Good/Base/Bad Cases
- Good: an injected `0.349999` rejects Denia, keeps the candy, leaves `deniaRainbowGlow` unset, and suppresses `denia-rainbow-bean-candy`.
- Good: an accepted Aemeath move renders one short, stone-centered rainbow grid pulse whose four rays fade toward the board edges while the ordinary stone remains present.
- Good: Lynae reaches 10 seconds and plays `lynae_countdown_1.ogg`; the timer still displays 10, then the final win UI/SFX remain a win while her result voice uses the loss line.
- Base: an injected `0.35` accepts, proving the exact 35% boundary without an off-by-one gap.
- Bad: decrementing inventory before the roll and trying to restore it on rejection, because structured sync and achievement side effects can already have escaped.
- Bad: setting narrator `speakerName: "旁白"`, because the player window must leave the character region blank.
- Bad: tinting or replacing every Aemeath stone, because the agreed effect is a transient move-contact ripple and not a stone decoration or game rule.
- Bad: reading cleared `currentPlayer.user.itemEffects` for Lynae's result voice, because result persistence removes the effect before the finished room is broadcast.

#### 6. Tests Required
- `server/rainbowBeanCandyStory.test.js` locks the probability boundary, stable start ids, Word-authored lines, and blank narrator identity.
- `server/items.test.js` asserts accepted writes and rejected zero-write behavior for all four characters.
- `server/roomItemEffects.test.js` asserts Aemeath and Lynae effects clear after a valid matching-character game, survive a valid game played as another character, and preserve Lynae's result-only completion snapshot.
- `server/commerceRoutes.test.js` asserts only accepted Denia use supplies the achievement trigger.
- `server/adminDefaultSnapshot.test.js` asserts draft/published snapshot parity, both branch entries, publish validation, and no `旁白` speaker.
- `src/modals/WarehouseModal.test.js` asserts rejection toast and skip copy do not claim success or consumption.
- `src/modals/WarehouseModal.test.js` also asserts all registered candy targets, including Lynae, remain selectable while inactive and become disabled only while their own effect is active.
- `src/room/roomView.test.js` asserts the latest-action/player/effect gate, and `src/room/Board.test.js` asserts one pointer-transparent marker, an unchanged stone, four directional traces, distance-attenuated intersection nodes, seven pixel echoes, stone-offset origin variables, portrait width-guard reset, memo-comparator coverage, bounded motion, absence of the old ring keyframes, and reduced-motion fallback.
- `src/shared/systemVoices.test.js` asserts every Lynae event pair, reverse countdown endpoints, unchanged draw behavior, and the no-effect baseline. Room, skill-banner, house-sortie, and result tests must assert that their voice character carries the correct active or completed effect object.

#### 7. Wrong vs Correct

Wrong:

```js
ownedItems[itemId] -= 1;
const rejected = Math.random() < 0.35;
```

Correct:

```js
const outcome = rollRainbowBeanCandyOutcome(characterId, random);
if (outcome === "rejected") {
  return {
    user: publicUser(user),
    items: await inventoryPayload(tx, user),
    itemUseOutcome: outcome
  };
}
ownedItems[itemId] -= 1;
```

Wrong:

```js
const CANDY_TARGET_RULES = {
  sigrika: { effectKey: "sigrikaCandyDisabled" },
  denia: { effectKey: "deniaRainbowGlow" }
};
```

Correct:

```js
import {
  RAINBOW_BEAN_CANDY_TARGET_RULES
} from "../../shared/rainbowBeanCandy.js";
```

Wrong:

```js
playSystemVoice(resultEvent, {
  character: { ...character, itemEffects: currentPlayer.user.itemEffects }
});
```

Correct:

```js
playSystemVoice(resultEvent, {
  character: {
    ...character,
    itemEffects: currentPlayer.completedItemEffects ?? currentPlayer.user.itemEffects ?? {}
  }
});
```

Wrong:

```js
const latestMove = [...room.game.history].reverse().find((entry) => entry.type === "move");
return latestMove ? { pointId: latestMove.id } : null;
```

Correct:

```js
const latestAction = room.game.history.at(-1);
const player = room.players.find((candidate) => candidate.color === latestAction?.color);
return latestAction?.type === "move"
  && canonicalCharacterId(player?.characterId) === "aemeath"
  && player?.user?.itemEffects?.aemeathRainbowMove
    ? { pointId: latestAction.id, key: `${latestAction.moveNumber}:${latestAction.color}:${latestAction.id}` }
    : null;
```

Matched and accepted-duel rooms must start in `GAME_PHASES.preloading` and use `server/roomPreparationLifecycle.js` as the only boundary for player resource readiness. Socket handlers may validate `room:preload-ready` and forward `{ roomCode, userId }`, but they must not mutate room phase directly. The lifecycle owns ready counts, the 90 second timeout, `match:preload-timeout`, transition into `opening`, and scheduling the existing game-start timer.

Tests touching this boundary should cover room creation, ready count broadcasts, both-ready opening transition, timeout abort, and socket event registration.

### Room Debug Test Tools Contract

#### 1. Scope / Trigger
- Trigger: changing room debug actions, development-only room test buttons, or production deployment checks that mention debug gameplay tools.
- This is a cross-layer test utility contract: frontend visibility, Socket.IO gameplay payloads, backend action handling, and production safety must stay aligned.

#### 2. Signatures
- Frontend visibility gate: `const SHOW_TEST_TOOLS = import.meta.env.DEV` in `src/room/RoomBattleStage.jsx`.
- Debug action payloads: `{ type: "test-random-layout" }`, `{ type: "test-restore-skill" }`, and `{ type: "test-enter-byo-yomi" }`.
- Backend action list: `ROOM_TEST_ACTION_TYPES` in `server/roomTestActions.js`.
- Backend safety gate: `canUseDebugTestActions(env)` returns true only when `env.NODE_ENV !== "production"`.

#### 3. Contracts
- Room test tools are visible by default in Vite development builds and hidden in production builds.
- Production must reject debug test actions even if legacy `ENABLE_TEST_ACTIONS` is set.
- `test-enter-byo-yomi` is a room-wide test shortcut: it sets every room player's `time.main` to `0`, calls `resetByoYomi()` for each timed player, returns `skipByoYomiReset: true`, and does not run normal move effects.
- The mobile room action dock must not hide `.test-tools`; development testers need the same shortcuts on phone layouts as on desktop.
- The shortcut is not a production gameplay feature and must not change ordinary clock timing or phase rules.

#### 4. Validation & Error Matrix
- `NODE_ENV === "production"` with any debug flag -> reject with the existing test-tool unavailable error.
- Non-production env -> allow room debug actions.
- Room phase not `playing` -> `test-enter-byo-yomi` rejects without mutating player timers.
- Missing or legacy player `time` object -> skip that player rather than crashing the debug action.

#### 5. Good/Base/Bad Cases
- Good: local `npm run dev` shows the Timer test button and one click puts both black and white timers into byo-yomi.
- Base: production builds do not render the test-tool group and server-side production validation still fails when `ENABLE_TEST_ACTIONS` is enabled.
- Bad: requiring both `VITE_ENABLE_TEST_TOOLS` and `ENABLE_TEST_ACTIONS` for local development, because it makes the temporary test button appear missing.
- Bad: forcing only the acting player's timer into byo-yomi when the test goal is to exercise both players' countdown behavior.

#### 6. Tests Required
- `server/roomTestActions.test.js` must assert the action list, production rejection, and both-player byo-yomi mutation.
- `server/security.test.js` must assert development-only debug action permission.
- `src/room/ActionBar.test.js` must assert the frontend gate remains dev-only and does not depend on `VITE_ENABLE_TEST_TOOLS`.
- `src/room/RoomScreen.test.js` must assert mobile room CSS keeps `.test-tools` visible in the action dock.

#### 7. Wrong vs Correct

Wrong:

```js
const SHOW_TEST_TOOLS = import.meta.env.DEV && import.meta.env.VITE_ENABLE_TEST_TOOLS === "true";
```

Correct:

```js
const SHOW_TEST_TOOLS = import.meta.env.DEV;
```

Wrong:

```js
player.time.main = 0;
resetByoYomi(player);
```

Correct:

```js
for (const roomPlayer of room.players ?? []) {
  if (!roomPlayer?.time) continue;
  roomPlayer.time.main = 0;
  resetByoYomi(roomPlayer);
}
```

### Auth HTTP Boundary Contract

`server/authRoutes.js` owns the `/api/auth/*` HTTP request handlers:

- `createAuthRouter(deps)` mounts register, login, refresh, and logout routes.
- `createAuthRouteHandlers(deps)` exposes the same handlers for focused unit tests without starting the full server.
- Registration validates username and password, hashes the password, syncs configured admin promotion, and returns the same login response shape as login.
- Login validates credentials, rejects banned users, returns the `already_logged_in` conflict response for active online sockets, and lets `forceLogin` evict the previous session through `onlineSessions.forceLogoutUser()`.
- Refresh reads the `sigrika_refresh` cookie through the login-session helpers, rotates valid refresh cookies, clears invalid/banned sessions, and signs the access-token response with the injected JWT secret.
- Logout clears the refresh token and best-effort clears the access-token session while still succeeding for malformed or expired access tokens.

`server/index.js` should create shared dependencies such as `loginSessions`, `onlineSessions`, `prisma`, and `JWT_SECRET`, then mount this router. It should not duplicate auth handler bodies, cookie parsing, active-account conflict responses, or logout token parsing.

`/api/auth` must be mounted before broad authenticated `/api` routers such as commerce, admin, player, and replay routes. If `app.use("/api", authHttp, ...)` appears before the auth router, login/register/refresh/logout requests will be intercepted by `authHttp` and return `请先登录` before the auth handlers run. `server/authRouteOrder.test.js` locks this ordering.

Wrong:

```js
app.post("/api/auth/login", async (req, res) => {
  // credential checks, cookie writes, session eviction
});
```

Correct:

```js
app.use("/api/auth", createAuthRouter({ prisma, jwtSecret, loginSessions, onlineSessions }));
```

Tests touching auth route status codes, cookie rotation/clearing, forced login, refresh-session recovery, or logout cleanup should update `server/authRoutes.test.js`; lower-level session storage behavior should stay in `server/loginSessions.test.js`.

### Commerce HTTP Boundary Contract

`server/commerceRoutes.js` owns authenticated commerce HTTP handlers:

- `POST /api/shop/:id/purchase`
- `GET /api/items/inventory`
- `POST /api/items/:itemId/use`

`server/index.js` should mount this router behind `authHttp`. It should not duplicate purchase, inventory, or item-use handler bodies, route-level user id binding, request param forwarding, or route error response shaping.

Wrong:

```js
app.post("/api/items/:itemId/use", authHttp, async (req, res) => {
  res.json(await useInventoryItem({ prisma, userId: req.user.id }));
});
```

Correct:

```js
app.use("/api", authHttp, createCommerceRouter({ prisma }));
```

Tests touching commerce route status codes, request param forwarding, or route error shaping should update `server/commerceRoutes.test.js`; purchase and item domain behavior should stay in `server/shop.test.js` and `server/items.test.js`.

### Player HTTP Boundary Contract

`server/playerRoutes.js` owns authenticated player self-service HTTP handlers:

- `GET /api/me`
- `GET /api/me/resume`
- `POST /api/me/character`
- `POST /api/me/decoration`
- `POST /api/me/music-selection`

It also owns `createCharacterSelectionData()` and `validateOptionalRoomCode()` so HTTP resume, Socket.IO resume, and Socket.IO auth share the same character availability and optional-room-code behavior.

`server/index.js` should create shared dependencies such as `prisma`, `findRoomForUser`, `roomView`, and the `characterSelectionData` closure, then mount this router. It should not duplicate player profile/history enrichment, character/decor ownership checks, blocked-character checks, music-selection error shaping, or optional room-code normalization.

Wrong:

```js
app.post("/api/me/character", authHttp, async (req, res) => {
  const characterId = String(req.body.characterId ?? "");
  // ...
});
```

Correct:

```js
const characterSelectionData = createCharacterSelectionData({ prisma });
app.use("/api", authHttp, createPlayerRouter({
  prisma,
  findRoomForUser,
  roomView,
  characterSelectionData
}));
```

Tests touching player self-service HTTP behavior should update `server/playerRoutes.test.js`; lower-level character resolution should stay in `server/characterSelection.test.js`, resume payload behavior in `server/resume.test.js`, and music selection rules in `server/musicSelection.test.js`.

### Scenario: Ordinary and Derived Skill Music Selection

#### 1. Scope / Trigger
- Trigger: changing `/api/me/music-selection`, `saveMusicSelection()`, `MUSIC_TRACKS.effectType`, `User.musicSelections` parsing/serialization, or pending/resolved skill BGM metadata.

#### 2. Signatures
- `POST /api/me/music-selection` accepts `{ category: "skill", characterId, trackId, effectType? }`.
- `saveMusicSelection({ prisma, user, category, characterId, trackId, effectType, tracks? })` returns the updated public user.
- Stored JSON uses `skill[characterId] = trackId` for ordinary skills and `derivedSkill[characterId][effectType] = trackId` for derived skills.
- Runtime pending/history metadata separates gameplay `effectType` from music-slot `musicEffectType`; empty `musicEffectType` is ordinary and a non-empty value is one derived slot.

#### 3. Contracts
- Empty or missing `effectType` identifies the ordinary-skill slot; a normalized non-empty value identifies exactly one derived-skill slot.
- The chosen track must be owned or `defaultUnlocked`, have `category === "skill"`, match `characterId`, and match normalized `effectType` exactly.
- Updating one slot preserves every other ordinary and derived slot. Existing JSON without `derivedSkill` remains valid and needs no database migration.
- `server/playerRoutes.js` forwards `req.body.effectType`; validation and persistence stay in `server/musicSelection.js`.
- `server/roomSkillResolution.js` derives `musicEffectType` from whether the effective skill is a derived skill, writes it to pending previews, and preserves it on resolved derived-skill history. It must not classify skills from gameplay `effectType` alone.

#### 4. Validation & Error Matrix
- Missing character or track -> existing required-selection error.
- Track not owned -> ownership error; no write.
- Track character mismatch -> character mismatch error; no write.
- Ordinary track sent to derived slot, or derived track sent to ordinary/different derived slot -> slot mismatch error; no write.
- Ordinary skill with non-empty gameplay `effectType` -> empty runtime `musicEffectType` and ordinary selection lookup.
- Valid selection -> update only the addressed slot and return refreshed public user.

#### 5. Good/Base/Bad Cases
- Good: selecting Aemeath `voyage-star` writes `derivedSkill.aemeath["voyage-star"]` while keeping `skill.aemeath` unchanged.
- Base: old `{ "skill": { "aemeath": "..." } }` JSON gains `derivedSkill` lazily on the first derived selection.
- Bad: filtering skill tracks only by `characterId`, because ordinary and derived tracks then overwrite or appear in the wrong slot.
- Bad: treating any non-empty gameplay `effectType` as a derived music slot, because ordinary skills such as `flip-stone` and `liberty-purge` also use non-empty effect types.

#### 6. Tests Required
- `server/musicSelection.test.js` asserts independent persistence, exact `effectType` validation, ownership, old JSON compatibility, and sibling-slot preservation.
- `server/playerRoutes.test.js` asserts the route forwards `effectType` unchanged.
- `src/shared/musicLibrary.test.js` asserts parse/normalize/serialize and exact ordinary/derived resolution.
- `server/roomSkillResolution.test.js` asserts pending previews and resolved history carry the correct music-slot metadata for ordinary and derived skills.

#### 7. Wrong vs Correct

Wrong:

```js
nextSelections.skill[characterId] = trackId;
```

Correct:

```js
if (effectType) {
  nextSelections.derivedSkill[characterId][effectType] = trackId;
} else {
  nextSelections.skill[characterId] = trackId;
}
```

Wrong:

```js
const musicEffectType = resolvedSkillEffectType(result.state, skill);
```

Correct:

```js
const effectType = resolvedSkillEffectType(result.state, skill);
const musicEffectType = skill?.sourceEffectType ? effectType : "";
```

### Public/Lobby HTTP Boundary Contract

`server/publicRoutes.js` owns public catalog and lobby HTTP handlers:

- `GET /api/health`
- `GET /api/characters`
- `GET /api/shop`
- `GET /api/site-settings`
- `POST /api/feedback`
- `GET /api/leaderboard`
- `GET /api/rooms/watch`

The router accepts `authHttp` and mounts it only on authenticated lobby routes. `GET /api/health`, `GET /api/characters`, and `GET /api/site-settings` are public; shop catalog, feedback, leaderboard, and watch-list routes require the current user.

`server/index.js` should create shared dependencies such as `prisma`, `authHttp`, and `listWatchRooms`, then mount `createPublicRouter()`. It should not duplicate public character/site-setting response shapes, shop catalog user-id binding, feedback error shaping, leaderboard query projection, or watch-room mode filtering.

Wrong:

```js
app.get("/api/leaderboard", authHttp, async (req, res) => {
  const users = await prisma.user.findMany({ select: { id: true } });
});
```

Correct:

```js
app.use("/api", createPublicRouter({ prisma, authHttp, listWatchRooms }));
```

Tests touching public/lobby route status codes, auth/public route mounting, feedback route errors, leaderboard query shape, or watch-list filtering should update `server/publicRoutes.test.js`; lower-level leaderboard, feedback, shop, character, and site-settings behavior should stay in their domain tests.

### Personal Replay HTTP Boundary Contract

`server/replayRoutes.js` owns personal replay HTTP handlers:

- `GET /api/replays`
- `GET /api/replays/:id`

`server/replayPagination.js` owns the shared summary query for personal and public-profile replay lists. Both list endpoints accept `mode` plus an opaque optional `cursor`, order by `(createdAt DESC, id DESC)`, fetch 51 rows, return at most 50, and expose `{ records, nextCursor }`. Summary rows include player ids so renamed users still get correct outcome display. `server/replayRoutes.js` continues to own personal route mounting and snapshot JSON parsing. Tests should call handlers/shared pagination directly instead of matching route source text inside `server/index.js`.

`server/index.js` should mount the replay router with shared auth and `prisma`; it should not duplicate personal replay query projection or snapshot parsing.

Tests touching cursor encoding/decoding, page boundaries, stable tie ordering, or shared summary fields should update `server/replayPagination.test.js`; personal route status codes and snapshot parsing stay in `server/replayRoutes.test.js`.

### Social HTTP Boundary Contract

`server/socialRoutes.js` owns social and public-profile HTTP handlers:

- `GET /api/social`
- `POST /api/social/friends/:targetId`
- `DELETE /api/social/friends/:targetId`
- `POST /api/social/blacklist/:targetId`
- `DELETE /api/social/blacklist/:targetId`
- `GET /api/users/search/profile`
- `GET /api/users/:id/profile`
- `GET /api/users/:id/replays`

The router accepts `authHttp` and mounts it only on authenticated social/profile routes. `GET /api/users/:id/replays` is intentionally public and must remain a single-handler route unless the product requirement changes.

`server/index.js` should create shared dependencies such as `prisma`, `authHttp`, and `statusForUser`, then mount `createSocialRouter()`. It should not duplicate relationship mutation handlers, social-list refresh response shaping, username validation for profile search, mode normalization for profile/replay handlers, or public replay not-found responses.

Wrong:

```js
app.post("/api/social/friends/:targetId", authHttp, async (req, res) => {
  await setRelationship({ prisma, ownerUserId: req.user.id, targetUserId: req.params.targetId });
});
```

Correct:

```js
app.use("/api", createSocialRouter({ prisma, authHttp, statusForUser }));
```

Tests touching social route status codes, auth/public route mounting, relationship response refreshes, username validation, mode normalization, or user replay route responses should update `server/socialRoutes.test.js`; lower-level profile and relationship query behavior should stay in `server/social.test.js`.

### Admin User Management Boundary Contract

`server/adminUserManagement.js` owns admin-side user write operations:

- `sanitizeUserUpdate(body)` accepts only editable user fields and normalizes ratings, coins, owned characters, owned items, selected character, and role values.
- `requireUserUpdateData(data)` is the shared empty-update guard for user edit routes.
- `updateUserProfile()` owns profile updates, structured asset synchronization, progress ledger entries for admin rating/coin changes, last-active-admin protection, and `user.update` audit writes.
- `banUser()` and `unbanUser()` own status transitions, ban metadata, last-active-admin protection for bans, and corresponding audit writes.
- `resetUserPassword()` owns bcrypt hashing inside the same transaction as the `user.reset-password` audit write, without leaking password material into audit JSON.
- User-target audit JSON serialization and low-level `AdminAuditLog` writes live in `server/adminAudit.js`.

`server/adminRoutes.js` should validate route-only concerns such as path params and minimum password/reason length, then delegate user mutations to this boundary. It should not duplicate user-field sanitization, structured asset sync decisions, progress-ledger composition, password hashing, or last-admin checks.

Wrong:

```js
router.patch("/users/:id", async (req, res) => {
  await prisma.user.update({ where: { id: req.params.id }, data: req.body });
});
```

Correct:

```js
res.json(await updateUserProfile({ prisma, adminUser: req.user, userId: req.params.id, body: req.body }));
```

Tests touching admin user edit sanitization, ban/unban, password reset, asset sync, progress ledger writes, or admin user audit entries should update `server/adminRoutes.test.js` or a focused `server/adminUserManagement.test.js`; route wiring tests can remain in `server/adminRoutes.test.js`.

### User Asset Compatibility Boundary Contract

`server/userAssets.js` owns compatibility between legacy user asset fields and structured user asset relations:

- Legacy parsers and serializers for `ownedCharacters`, `ownedDecorations`, `ownedItems`, and `itemEffects` live in this module.
- `syncStructuredUserAssets()` and `structuredUserAssetSyncOperations()` replace-sync legacy asset fields into `UserCharacter`, `UserDecoration`, `UserItem`, and `UserItemEffect`.
- `structuredUserItemEffectSyncOperations()` is the narrow effect-only sync path for room result cleanup, where room public users may not carry complete character or inventory fields.
- `publicUserAssets(user)` is the public projection boundary for selected character, selected stone decoration, owned characters, owned decorations, owned item counts, character chain counts, and item effects. It merges legacy fields with loaded structured relations so `publicUser()` and route responses do not duplicate compatibility rules.
- Rating-based and built-in character unlocks are applied inside this asset projection so the public account payload has one ownership source of truth during the migration.

`server/db.js` should compose the public user payload and delegate asset compatibility to `publicUserAssets()`. It should not duplicate legacy item parsing, structured relation merging, chain-count projection, item-effect parsing, or built-in/rating unlock rules.

Wrong:

```js
const ownedCharacters = new Set(parseCharacterAssetList(user.ownedCharacters));
for (const entry of user.userCharacters ?? []) ownedCharacters.add(entry.characterSlug);
```

Correct:

```js
const payload = { ...baseUserFields, ...publicUserAssets(user) };
```

Tests touching user asset parsing, legacy-to-structured sync, public asset projection, item effect merge behavior, or character chain projection should update `server/userAssets.test.js`; top-level public user payload tests can remain in `server/db.test.js`.

### Admin Catalog Management Boundary Contract

`server/adminCatalogManagement.js` owns admin-side catalog write operations for decorations and shop items:

- `createDecoration()`, `updateDecoration()`, and `disableDecoration()` own decoration persistence and `decoration.*` audit writes.
- `createShopItem()`, `updateShopItem()`, and `disableShopItem()` own shop item persistence and `shop-item.*` audit writes.
- `assertShopTargetExists(prisma, item)` validates shop targets for character, decoration, and music catalog entries, including built-in stone decorations and music defaults.
- Shop item audit payloads should use `toShopItemPayload()` so route responses and audit JSON stay consistent.

`server/adminRoutes.js` should own HTTP concerns such as body validation and response shape, then delegate catalog mutations and target validation to this boundary. It should not duplicate decoration/shop item transactions, target-existence checks, or catalog audit writes.

Wrong:

```js
const item = await prisma.shopItem.update({ where: { id }, data: input });
await writeAudit(prisma, req.user, "shop-item.update", item.id, before, item, "shop-item");
```

Correct:

```js
await assertShopTargetExists(prisma, validated.value);
const item = await updateShopItem({ prisma, adminUser: req.user, itemId: req.params.id, input: validated.value });
```

Tests touching admin decoration/shop item create/update/disable, shop target validation, or catalog audit payloads should update `server/adminRoutes.test.js` or a focused `server/adminCatalogManagement.test.js`; player-facing purchase behavior should stay in `server/shop.test.js`.

### Scenario: Content-Only Admin Character Skill Updates

#### 1. Scope / Trigger
- Trigger: changing admin character forms, `PATCH /api/admin/characters/:id`, `CharacterSkill.paramsJson`, code-defined derived skills, or built-in character seeding.
- This is a cross-layer authority contract: code owns gameplay structure while admins own only player-facing skill copy and overclock content.

#### 2. Signatures
- `updateCharacter({ prisma, adminUser, characterId, body })` is the authoritative admin update boundary.
- Editable base-skill fields are `name`, `description`, and `costValue`.
- Editable fields for each existing `params.derivedSkills[]` entry are also `name`, `description`, and `costValue`.
- `cleanupLegacyDerivedSkillLeak(prisma)` runs once under marker `migration.cleanup-derived-skill-leak-v1` before `seedCharacters()`.

#### 3. Contracts
- Effect type, target rule, uses, free-turn behavior, cost type, system message, enabled state, non-derived params, music binding, and derived-skill identity/order/count are code-managed.
- The admin UI must not expose controls for code-managed fields or derived-skill add/remove actions.
- Hiding controls is not sufficient: `updateCharacter()` compares incoming logic with the stored `CharacterSkill` and rejects mutations before persistence.
- Derived definitions are explicit per base skill. Empty means empty; generic draft/normalization code must not inject a character-specific default.
- `seedCharacters()` may append code-defined derived definitions missing from an existing built-in skill, but must preserve existing definitions and their admin-edited content.
- Character audit payloads continue to use the shared character projection.

#### 4. Validation & Error Matrix
- Base-skill logic differs from stored value -> HTTP 400 with a field-specific code-managed error.
- Non-derived `paramsJson` data differs -> HTTP 400.
- Derived entry count differs -> HTTP 400; add/delete is forbidden.
- Derived identity/order or any logic field differs -> HTTP 400.
- Derived name is blank -> HTTP 400.
- Numeric derived overclock is non-numeric, or special overclock is blank -> HTTP 400.
- Only editable content differs -> validate the complete character payload, persist, and audit normally.

#### 5. Good/Base/Bad Cases
- Good: rename `voyage-star`, update its description and numeric overclock, while uses, target rule, free-turn behavior, and music id remain byte-for-byte authoritative.
- Base: update character CV metadata without sending skill fields; the skill remains unchanged.
- Bad: render no logic controls but accept a crafted request that changes `uses` or appends a derived skill.
- Bad: create a Voyage Star draft for every character and rely on a later renderer to hide it.

#### 6. Tests Required
- `server/adminRoutes.test.js` asserts editable legacy/nested content succeeds and logic/add/delete requests fail without writes.
- `src/shared/adminDrafts.test.js` asserts empty skills stay empty and derived content round-trips without logic changes.
- `src/shared/derivedSkills.test.js` asserts no implicit defaults and neutral normalization.
- `src/admin/AdminCharacters.test.jsx` asserts only the three content fields are exposed.
- `server/legacyDerivedSkillCleanup.test.js`, `server/serverStartup.test.js`, and `server/characters.test.js` assert one-time cleanup ordering and missing-only built-in definition backfill.

#### 7. Wrong vs Correct

Wrong:

```js
const skill = { ...storedSkill, ...req.body.skill };
```

Correct:

```js
const character = await updateCharacter({ prisma, adminUser: req.user, characterId: req.params.id, body: req.body });
res.json({ character: toAdminCharacterPayload(character) });
```

### Room Broadcast Boundary Contract

`server/roomBroadcasts.js` owns the Socket.IO delivery mechanics for room-level events:

- `broadcastRoom(io, room, { persistRoom })` emits viewer-specific `room:update` payloads and force-persists the room before delivery.
- `broadcastRoomClock(io, room, { persistRoom })` emits lightweight `room:clock` payloads and uses throttled persistence.
- `broadcastRoomPatch(io, room, patch, { persistRoom, forcePersist })` emits lightweight `room:patch` payloads with revision metadata; default patch persistence is forced, while explicitly non-critical chat/presence callers may pass `forcePersist: false` to use the shared throttled persistence path.
- `broadcastToast(io, room, text)` and `emitRoomClosed(io, room, payload)` emit only to connected room participants.
- `roomView(room, viewerId)` remains the compatibility wrapper for `buildRoomView()`.

`server/rooms.js` should decide **when** a lifecycle event needs broadcasting, but it should not duplicate participant iteration, event names, clock payload shape, or viewer-specific room view emission.

Wrong:

```js
for (const participant of [...room.players, ...room.spectators]) {
  io.to(participant.socketId).emit("room:update", buildRoomView(room, participant.user.id));
}
```

Correct:

```js
broadcastRoom(io, room);
```

Tests touching this boundary should update `server/roomBroadcasts.test.js` for payload shape, connected-participant filtering, and persistence timing.

### Room Runtime Boundary Contract

`server/roomRuntime.js` owns the runtime callback adapters shared by room lifecycle modules:

- `createRoomRuntime(deps)` returns `persistRoom(room, options)`, `broadcastRoom(io, room)`, and `broadcastToast(io, room, text)`.
- `persistRoom()` delegates to `persistRoomState({ prisma, room, force, throttleMs, onError })` and defaults `force` to false.
- `broadcastRoom()` delegates to `server/roomBroadcasts.js` with the runtime `persistRoom` callback so full room snapshots keep forced persistence behavior centralized.
- `broadcastRoomPatch(io, room, patch, { forcePersist })` forwards the persistence timing choice to `server/roomBroadcasts.js`, defaulting to forced persistence unless the socket boundary explicitly marks the patch as non-critical.
- `server/roomStatePersistence.js` serializes asynchronous snapshot upserts per room code, while allowing different room codes to persist independently; callers that need a global consistency point can await `flushRoomPersistence()`, and callers that need only one room can await `flushRoomPersistence(roomCode)` without blocking unrelated room writes.
- `broadcastToast()` forwards room toast delivery to the broadcast boundary without duplicating participant iteration.

`server/rooms.js` should compose this runtime once and inject the returned callbacks into lifecycles, but it should not duplicate persistence throttling options, broadcast persistence injection, or toast forwarding wrappers.

Wrong:

```js
function broadcastRoom(io, room) {
  broadcastRoomUpdate(io, room, { persistRoom });
}
```

Correct:

```js
const roomRuntime = createRoomRuntime(deps);
const { persistRoom, broadcastToast } = roomRuntime;
export const { broadcastRoom } = roomRuntime;
```

Tests touching persistence option wiring, default force behavior, per-room persistence ordering, full-room broadcast persistence injection, or toast forwarding should update `server/roomRuntime.test.js` or `server/roomStatePersistence.test.js`; payload-level broadcast tests should stay in `server/roomBroadcasts.test.js`.

### Room Timer Boundary Contract

`server/roomTimers.js` owns room timer bookkeeping:

- `scheduleRoomInterval(room, callback, delay)` assigns `room.timerId` and returns it.
- `clearRoomInterval(room)` clears the active interval without changing the stored id, preserving existing room snapshot shape.
- `scheduleRoomTimeout(room, callback, delay)` appends the timeout id to `room.timeoutIds` and removes it before invoking the callback.
- `clearRoomTimeout(room, id)` clears one tracked timeout and removes it from `room.timeoutIds`.
- `clearRoomTimers(room)` clears the room interval and every tracked timeout, then resets `room.timeoutIds` to `[]`.

`server/rooms.js` should decide **when** to schedule opening, skill preview, counting, draw, result-review, close, and empty-room deadlines, but it should not hand-edit `timeoutIds` or call raw timer APIs for room lifecycle timers.

Wrong:

```js
const id = setTimeout(callback, delay);
room.timeoutIds.push(id);
room.timeoutIds = room.timeoutIds.filter((candidate) => candidate !== id);
```

Correct:

```js
scheduleRoomTimeout(room, callback, delay);
```

Tests touching timer bookkeeping should update `server/roomTimers.test.js`; room lifecycle behavior can remain in `server/rooms.test.js`.

### Room Clock Lifecycle Boundary Contract

`server/roomClockLifecycle.js` owns the per-room game clock interval behavior:

- `createRoomClockLifecycle(deps)` returns `startGameClock(room, io)`.
- `startGameClock()` sets `room.lastTick`, registers the 1-second interval through `scheduleRoomInterval()`, and owns the interval callback.
- If a room has already left the in-memory room map, it clears the room interval.
- If the room is not in `playing` phase, it refreshes `lastTick` without ticking a player clock.
- If all players are disconnected, it refreshes `lastTick` and delegates to `scheduleEmptyActiveRoomClose()`.
- During active play, it deducts elapsed seconds from the active player via `tickPlayerClock()`.
- When the active player times out, it marks the game finished, computes the timeout winner, emits the invalid early-result toast when needed, appends the timeout system message, schedules room close, and broadcasts the full room.
- Otherwise it emits only `broadcastRoomClock()` so normal per-second ticks avoid full room snapshots.

`server/rooms.js` should decide **when** a room clock starts or resumes, but it should not own the interval callback, timeout finish mutation, or clock-vs-room broadcast decision.

Wrong:

```js
scheduleRoomInterval(room, () => {
  tickPlayerClock(active, elapsed);
  broadcastRoom(io, room);
}, 1000);
```

Correct:

```js
startGameClock(room, io);
```

Tests touching clock interval branching, timeout finish behavior, disconnected-player handoff, or clock broadcast choice should update `server/roomClockLifecycle.test.js`; end-to-end opening/restore behavior can remain in `server/rooms.test.js`.

### Room Presence Boundary Contract

`server/roomPresence.js` owns shared participant and connection-state queries:

- `roomParticipants(room)` returns players first, then spectators.
- `onlineParticipantCount(room)` counts connected players and spectators.
- `hasConnectedRoomParticipant(room)` returns whether any player or spectator is connected.
- `arePlayersDisconnected(room)` returns true only when the room has players and every player is disconnected; spectators do not keep an active game alive.
- `watchPlayerSummary(room, color)` builds the watch-list summary for a player color.

Room broadcasting, watch-room summaries, finished-room close extension, and empty-active-room closure should reuse these helpers instead of reimplementing players/spectators iteration.

Wrong:

```js
const online = room.players.filter((player) => player.socketId).length
  + room.spectators.filter((spectator) => spectator.socketId).length;
```

Correct:

```js
const online = onlineParticipantCount(room);
```

Tests touching participant-state rules should update `server/roomPresence.test.js`; workflow-specific behavior should stay in `server/rooms.test.js`.

### Room Connection Lifecycle Boundary Contract

`server/roomConnectionLifecycle.js` owns room socket connection-state mutation:

- `createRoomConnectionLifecycle(deps)` returns `attachSocketToRoom`, `detachSocket`, and `leaveRoom`.
- `attachSocketToRoom(roomCode, socket, user)` validates the room code, reconnects existing players, clears empty-room close state, appends reconnect notices for active disconnected players, adds first-time spectators, joins the socket room, updates the injected socket-room index callbacks, and force-persists changed room state.
- Spectator attach is idempotent by `user.id`; duplicate spectator joins should refresh the spectator socket id without appending duplicate spectators or duplicate join notices.
- `detachSocket(socketId, io)` removes the socket from matchmaking, reads candidate rooms through the injected socket-room lookup callback, disconnects matching players, timestamps `disconnectedAt`, appends disconnect notices only for unfinished rooms, removes matching spectators, unregisters socket mappings, schedules empty-room close when `io` is provided, force-persists changed rooms, and returns changed rooms.
- `leaveRoom(roomCode, userId, socketId)` handles explicit spectator leave and finished-player leave-as-spectator cleanup, unregisters socket mappings, appends `spectator-leave` notices, and force-persists changed room state.

`server/rooms.js` should decide which socket event calls this boundary, but it should not duplicate player/spectator socket mutation, reconnect/disconnect notice rules, or forced persistence after connection-state changes.

Wrong:

```js
player.socketId = null;
player.disconnectedAt = Date.now();
room.spectators = room.spectators.filter((spectator) => spectator.socketId !== socketId);
```

Correct:

```js
detachSocket(socketId, io);
```

Tests touching player reconnects, spectator joins/leaves, socket-index maintenance, socket disconnect cleanup, finished-player leave behavior, or connection-state persistence should update `server/roomConnectionLifecycle.test.js`; socket-event integration can remain in `server/rooms.test.js`.

### Room Matchmaking Queue Boundary Contract

`server/roomMatchmakingQueue.js` owns waiting-player queue state:

- `createRoomMatchmakingQueue()` returns an isolated queue instance.
- `join(player, { canPair })` normalizes `player.mode`, deduplicates by `user.id` and `socketId`, matches only same-mode compatible queued players, and removes the matched opponent from the queue.
- `list()`, `count()`, and `countsByMode()` expose read-only queue snapshots for API/status surfaces.
- `removeUser(userId)`, `removeSocket(socketId)`, and `clear()` own queue cleanup for leave, disconnect, and tests.

`server/rooms.js` should decide what happens after a match is found: room creation, persistence, clock startup, opening schedule, and `match:found` / `room:update` delivery. It should not hand-edit the waiting queue array.

Wrong:

```js
waitingPlayers = waitingPlayers.filter((candidate) => candidate.user.id !== player.user.id);
waitingPlayers.push({ ...player, mode });
```

Correct:

```js
const match = matchmakingQueue.join(player, { canPair });
```

Tests touching queue state, mode isolation, deduplication, or `canPair` behavior should update `server/roomMatchmakingQueue.test.js`; end-to-end room creation behavior should stay in `server/rooms.test.js`.

### Room Factory Boundary Contract

`server/roomFactory.js` owns initial room and room-player construction:

- `createRoom(first, second, { modeInput, isCodeTaken, now, random })` normalizes the mode, assigns black/white players, creates the opening game state, sets initial timers/deadlines, and generates a non-conflicting room code through `isCodeTaken`.
- `toRoomPlayer(player, color, mode)` builds room player state, including the initial clock and selected character config.
- `userForRoomMode(user, mode)` projects mode-specific rating/rank/win/loss values onto the in-room user snapshot.
- `modeStatsForUser(user, mode)` reads object or array `modeStats` and falls back to legacy spark values or shared non-spark defaults such as standard/gomoku defaults.
- `randomRoomCode({ isCodeTaken, random })` owns five-digit room code generation and collision retry.

`server/rooms.js` should decide **when** to create a room and what to do after creation, but it should not hand-build room object shape or duplicate mode-stat projection.

Wrong:

```js
const room = { code: randomRoomCode(), players, game, timerId: null };
```

Correct:

```js
const room = createRoom(first, second, { modeInput: mode, isCodeTaken });
```

Tests touching initial room shape, room-player shape, mode projection, or code collision behavior should update `server/roomFactory.test.js`.

### Room Creation Lifecycle Boundary Contract

`server/roomCreationLifecycle.js` owns post-match and direct-duel room creation orchestration:

- `createRoomCreationLifecycle(deps)` returns `joinMatchmaking(player, io, { canPair })` and `createDirectRoom(first, second, io, modeInput)`.
- `joinMatchmaking()` delegates waiting-player state to `matchmakingQueue.join()`, returns `null` when no match is available, and only creates a room when the queue returns a matched opponent/player pair.
- `createDirectRoom()` normalizes the requested mode, removes both users from matchmaking, creates the room, and shares the same post-creation registration path as matchmaking.
- The shared registration path stores the room in `rooms`, force-persists the initial snapshot, starts the game clock, schedules opening completion, emits `match:found` to both sockets with viewer-specific `roomView()` payloads, appends the creation system notice, and broadcasts the initial room snapshot.

`server/rooms.js` should route socket events and expose compatibility exports, but it should not duplicate matched-room registration, forced initial persistence, clock startup, opening scheduling, or `match:found` delivery.

Wrong:

```js
rooms.set(room.code, room);
persistRoom(room, { force: true });
startGameClock(room, io);
scheduleGameStart(room, io);
io.to(first.socketId).emit("match:found", roomView(room, first.user.id));
```

Correct:

```js
const roomCreationLifecycle = createRoomCreationLifecycle(deps);
export const { joinMatchmaking, createDirectRoom } = roomCreationLifecycle;
```

Tests touching matched matchmaking creation, direct duel creation, initial persistence, match-found payloads, or creation notices should update `server/roomCreationLifecycle.test.js`; socket-event routing can remain in `server/rooms.test.js`.

### Room Skill Message Boundary Contract

`server/roomSkillMessages.js` owns skill system-message formatting:

- `describeSkillUse(room, player, targetId)` builds the user-facing skill notice for active and passive skill previews.
- `renderSkillMessage(template, values)` replaces supported placeholders: `{player}`, `{character}`, `{skill}`, `{point}`, `{fromColor}`, `{toColor}`, `{targetColor}`, and `{color}`.
- `formatPointLabel(pointId)` formats board coordinates with the project coordinate labels.
- `stoneLabel(color)` formats `black`, `white`, or unknown stones for messages.

`server/rooms.js` should decide **when** to append a skill system message, but it should not own skill display strings, coordinate labels, or template replacement rules.

Wrong:

```js
appendSystem(room, `${player.user.username} used ${skill.name}`, { kind: "skill" });
```

Correct:

```js
appendSystem(room, describeSkillUse(room, player, targetId), { kind: "skill" });
```

Tests touching skill message text, placeholders, point labels, or stone labels should update `server/roomSkillMessages.test.js`; room flow tests can assert that a skill message was appended.

### Room Skill Resolution Boundary Contract

`server/roomSkillResolution.js` owns skill-preview lifecycle and pending skill resolution:

- `createRoomSkillLifecycle(deps)` returns `startActiveSkill`, `maybeStartPassiveSkill`, `schedulePendingSkillResolution`, and `completePendingSkillResolution`.
- `startActiveSkill({ room, player, action, io })` validates active skill availability, chooses board-confirmation targets, applies the shared `useSkill()` result, creates `room.pendingSkillResolution`, moves the room into `skillPreview`, appends the skill system message, and schedules preview completion.
- `maybeStartPassiveSkill(room, io)` owns color-illusion passive preview start and returns false when the current room state cannot start a passive preview.
- `schedulePendingSkillResolution(room, io)` owns restored pending-skill delay calculation and timer scheduling.
- `completePendingSkillResolution(roomCode, pendingSkillId, io)` owns replacing the preview state with the resolved game snapshot, clearing `pendingSkillResolution`, resetting byo-yomi for the acting player, appending notices, handing off finished games to room close scheduling, chaining passive skills, and broadcasting the resolved room.
- `buildPendingSkillPreview()` owns pending-skill payload fields consumed by the frontend animation layer: skill identity, target id, affected point ids, marked point ids, removed counts, item effects, and banner/board-effect durations.

`server/rooms.js` should decide **when** an action/opening/restore path reaches skill-preview logic, but it should not hand-build pending-skill payloads, directly mutate `pendingSkillResolution`, or duplicate preview completion behavior.

Wrong:

```js
room.pendingSkillResolution = { pendingSkillId, game: result.state };
room.game = { ...room.game, phase: GAME_PHASES.skillPreview, pendingSkill };
```

Correct:

```js
return startActiveSkill({ room, player, action, io });
```

Tests touching preview payload metadata, delay math, scheduling, or completion side effects should update `server/roomSkillResolution.test.js`; end-to-end active/passive skill flow should remain covered by `server/rooms.test.js`.

### Room System Message Boundary Contract

`server/roomSystemMessages.js` owns room chat-log mutation for generic system messages:

- `appendSystem(room, text, options)` appends the canonical system message object, including id, type, kind, current move number, text, and timestamp.
- `appendNotices(room, notices)` appends a list of system notices with the same object shape.
- `ensureRestoredDisconnectedNotices(room)` appends missing disconnect notices for persisted unfinished rooms without duplicating existing disconnect messages.

`server/rooms.js` and room flow helpers should decide **when** a notice is needed, but they should not duplicate the system message object shape or restored-disconnect deduplication rules.

Wrong:

```js
room.chat.push({ type: "system", text, createdAt: Date.now() });
```

Correct:

```js
appendSystem(room, text, { kind: "disconnect" });
```

Tests touching generic system-message shape, notice-list appends, or restored disconnect notices should update `server/roomSystemMessages.test.js`.

### Room Action Validation Boundary Contract

`server/roomActionValidation.js` owns room action point-target validation:

- `validateActionPoint(action, boardSize)` rejects missing/non-object actions as `"未知操作"`.
- Actions without `pointId` are allowed so non-point actions such as pass/resign can continue through their own handlers.
- Actions with `pointId` must delegate to `validatePointId()` from `server/security.js` and return its error text unchanged.

Room action handlers should call this boundary before mutating room/game state instead of importing point validators directly.

Wrong:

```js
const point = validatePointId(action.pointId, room.game.size);
if (!point.ok) return point.error;
```

Correct:

```js
const validationError = validateActionPoint(action, room.game.size);
if (validationError) return { error: validationError };
```

Tests touching room action point validation should update `server/roomActionValidation.test.js`; flow-specific action results can stay in `server/rooms.test.js`.

### Room Action Lifecycle Boundary Contract

`server/roomActionLifecycle.js` owns gameplay action entry routing:

- `createRoomActionLifecycle(deps)` returns `handleGameAction(roomCode, userId, action, io)`.
- `handleGameAction()` validates the room code, looks up the room, delegates point-target validation to `validateActionPoint(action, room.game.size)`, verifies the actor is a room player, and rejects new actions while `room.game.pendingSkill` is active.
- Test actions go through `isRoomTestAction()` / `handleRoomTestAction()`, append optional test system messages, apply returned game state, and append returned notices.
- Non-test gameplay actions must pass `validateRoomActionPhase(action, room.game.phase)` from `server/roomActionPhaseGuards.js` before skill or standard action delegation.
- Skill actions delegate to `startActiveSkill({ room, player, action, io })` only when the phase matrix allows `skill`.
- Standard move/pass/resign actions delegate to `applyStandardGameAction()` with the injected room lifecycle dependencies only when the phase matrix allows that action type. Move/pass/skill require `GAME_PHASES.playing`; resign is allowed in `playing`, `counting-requested`, and `draw-requested`, but not opening, skill-preview, marking-dead, result-review, or finished.

`server/rooms.js` should expose the action entry point for socket/API routing, but it should not duplicate action validation order, test-action state application, skill routing, or standard-action dependency wiring.

Wrong:

```js
const room = rooms.get(code);
if (action.type === "skill") return startActiveSkill({ room, player, action, io });
return applyStandardGameAction({ room, player, action, io, appendSystem });
```

Correct:

```js
const roomActionLifecycle = createRoomActionLifecycle(deps);
export const { handleGameAction } = roomActionLifecycle;
```

Tests touching gameplay action entry validation order, phase-matrix rejection, test-action dispatch, skill dispatch, or standard-action dependency wiring should update `server/roomActionLifecycle.test.js`; action-result rule behavior should stay in the focused rule modules.

### Room Chat Lifecycle Boundary Contract

`server/roomChatLifecycle.js` owns room chat entry mutation:

- `createRoomChatLifecycle(deps)` returns `addChat(roomCode, user, text)`.
- `addChat()` validates the room code before normalizing text, normalizes text through `normalizeChatText()`, looks up the room, appends the canonical chat message object, and returns the changed room.
- Chat message shape is `{ id, type: "chat", userId, username, moveNumber, text, createdAt }`.
- `moveNumber` is captured from `room.game.moveNumber` at send time; `id` and `createdAt` come from injectable `randomUUID` and `now` dependencies for deterministic tests.
- Invalid room codes, invalid text, and missing rooms return `null` without mutating chat.

`server/rooms.js` should expose the chat entry point for socket/API routing, but it should not duplicate text normalization order, chat payload shape, message id creation, or move-number capture.

Wrong:

```js
room.chat.push({ type: "chat", text, createdAt: Date.now() });
```

Correct:

```js
const roomChatLifecycle = createRoomChatLifecycle(deps);
export const { addChat } = roomChatLifecycle;
```

Tests touching chat entry validation order, message shape, move-number capture, id/timestamp injection, or no-op cases should update `server/roomChatLifecycle.test.js`; socket delivery behavior can remain in `server/rooms.test.js` or socket integration tests.

### Room Queries Boundary Contract

`server/roomQueries.js` owns room read-model projection and lookup helpers:

- `createRoomQueries({ rooms, onlineParticipantCount, watchPlayerSummary })` returns `listActiveRooms`, `listWatchRooms`, `isUserInActiveRoom`, and `findRoomForUser`.
- `listActiveRooms()` returns in-memory rooms whose `room.game.phase` is not `finished`.
- `listWatchRooms()` projects each room to `{ code, mode, onlineCount, moveNumber, status, closesAt, black, white }`, using `room.mode ?? room.game.mode ?? "spark"` and delegating participant counts/player summaries to `server/roomPresence.js`.
- `isUserInActiveRoom(userId)` must use active-room filtering so finished rooms do not block matchmaking or lobby actions.
- `findRoomForUser(userId, roomCode)` searches either a specific room code or all rooms and returns `null` when no player match exists.
- When `server/roomMembershipIndex.js` is injected, active membership checks and user-room lookup should use the user-to-room index instead of scanning every room. Socket disconnect cleanup should use the same index module's socket-to-room lookup through `server/roomConnectionLifecycle.js`.

`server/rooms.js` should keep the shared room map, but it should not duplicate watch-list projection shape, active-room filtering, online-count calculation, or user-room lookup behavior.

Wrong:

```js
const onlineCount = room.players.filter((player) => player.socketId).length;
return { code: room.code, onlineCount };
```

Correct:

```js
const roomQueries = createRoomQueries({ rooms });
export const { listWatchRooms } = roomQueries;
```

Tests touching active-room filtering, watch-room payload shape, mode fallback, participant summary delegation, or user-room lookup should update `server/roomQueries.test.js`; API/socket callers can keep integration tests around their event wiring.

### Room Request Lifecycle Boundary Contract

`server/roomRequestLifecycle.js` owns counting, draw, and scoring request entry validation:

- `createRoomRequestLifecycle(deps)` returns `requestCounting`, `respondCounting`, `requestDraw`, `respondDraw`, and `handleScoringAction`.
- Each entry point validates the room code through `validateRoomCode()`, looks up the room, verifies the actor is a player, checks phase preconditions, and then delegates mutation to `server/roomScoringFlow.js`.
- `handleScoringAction()` also delegates point-target validation to `validateActionPoint(action, room.game.size)` before scoring phase checks.
- Counting requests are allowed only from `playing`; counting responses are allowed only from `countingRequested`.
- Draw requests are allowed only from `playing`; draw responses are allowed only from `drawRequested`.
- Dead-stone marking actions require `markingDead`; result accept/reject actions require `resultReview`.

`server/rooms.js` should route socket/API events to these entry points, but it should not duplicate room/player lookup, phase checks, or scoring point validation for counting/draw/scoring flows.

Wrong:

```js
const room = rooms.get(roomCode);
if (room.game.phase !== GAME_PHASES.drawRequested) return { ok: false };
return applyDrawResponse({ room, player, accepted });
```

Correct:

```js
return respondDraw(roomCode, userId, accepted, io);
```

Tests touching counting/draw/scoring entry validation, phase preconditions, player lookup, or dispatch into scoring flow should update `server/roomRequestLifecycle.test.js`; full room flow regressions can remain in `server/rooms.test.js`.

### Room Close Lifecycle Boundary Contract

`server/roomCloseLifecycle.js` owns room close and empty-active-room lifecycle behavior:

- `createRoomCloseLifecycle(deps)` returns `scheduleRoomClose`, `closeRoom`, `scheduleEmptyActiveRoomClose`, and `clearEmptyRoomClose`.
- `scheduleRoomClose(roomCode, io)` schedules finished-room cleanup, triggers unsaved record persistence through injected callbacks, force-persists `closesAt`, extends valid finished rooms while participants remain connected, and closes with `{ reason: "finished-room-close", roomCode }`.
- `closeRoom(roomCode, io, options)` clears room timers, emits `room:closed`, removes the room from memory, and triggers persisted-room deletion. The `rooms.js` composition must wait for pending snapshot upserts for that room code before deleting the persisted row so a late upsert cannot recreate a closed room.
- `scheduleEmptyActiveRoomClose(room, io)` marks unfinished rooms invalid after all players are disconnected for five minutes, appends the invalid-room system message, persists the invalid state, and closes the room without creating a game record.
- `clearEmptyRoomClose(room)` cancels the tracked empty-room timeout and clears `emptySince` / `emptyTimerId`.

`server/rooms.js` should decide **when** a room reaches a close path, but it should not duplicate close payload shape, close-delay rules, persisted deletion, or empty-room invalidation state.

Wrong:

```js
room.game.winner = { invalid: true, reason: "empty-room" };
rooms.delete(room.code);
```

Correct:

```js
scheduleEmptyActiveRoomClose(room, io);
```

Tests touching close delays, close payloads, persisted deletion, empty-room invalidation, or empty-room timeout cancellation should update `server/roomCloseLifecycle.test.js`; end-to-end room flow tests can remain in `server/rooms.test.js`.

### Room Restore Lifecycle Boundary Contract

`server/roomRestoreLifecycle.js` owns restored-room timer resume decisions after persisted room hydration:

- `createRoomRestoreLifecycle(deps)` returns `resumeRoomTimers(room, io)`.
- Finished rooms with expired `closesAt` close immediately through `closeRoom(room.code, io, { reason: "finished-room-close" })` and return false so callers skip persistence.
- Finished rooms whose close window is still active delegate to `scheduleRoomClose(room.code, io)`.
- Opening rooms always start the game clock; if `openingEndsAt` has elapsed they call `completeRoomOpening(room, io)`, otherwise they delegate to `scheduleGameStart(room, io)`.
- Restored `skillPreview` rooms first call `schedulePendingSkillResolution(room, io)`. If the pending skill snapshot is no longer schedulable, the room falls back to `playing` and clears `game.pendingSkill`.
- Active rooms start the game clock, resume phase-specific deadlines through `schedulePendingRoomDeadlines(room, io)`, and schedule empty-room close handling.

`server/rooms.js` should hydrate and register persisted rooms, but it should not duplicate restore-time branching for finished/opening/skill-preview/active phases.

Wrong:

```js
if (room.game.phase === GAME_PHASES.skillPreview) {
  room.game.phase = GAME_PHASES.playing;
}
```

Correct:

```js
const restored = resumeRoomTimers(room, io);
```

Tests touching restore-time phase branching, expired close windows, opening deadline decisions, invalid pending-skill fallback, or active deadline scheduling should update `server/roomRestoreLifecycle.test.js`; persisted-room integration can remain in `server/rooms.test.js`.

### Room Persistence Restore Lifecycle Boundary Contract

`server/roomPersistenceRestoreLifecycle.js` owns persisted-room restore orchestration:

- `createRoomPersistenceRestoreLifecycle(deps)` returns `restorePersistedRooms(io)`.
- `restorePersistedRooms()` reads rows through injected `listPersistedRooms()`, parses each row snapshot, hydrates it through `hydratePersistedRoom()`, skips hydrated rows without a room `code`, appends restored disconnect notices, registers the room in `rooms`, invokes `resumeRoomTimers(room, io)`, and force-persists rooms whose resume result is not `false`.
- A row that throws during JSON parse, hydration, notice append, timer resume, or persistence should be logged through `onError(message, error)` and must not abort later rows.
- The returned array contains restored rooms that had a room code, including rooms that are immediately closed by restore-time timer decisions; skipped/failed rows are omitted.

`server/rooms.js` should provide dependencies and expose the compatibility entry point, but it should not duplicate persisted-row iteration, parse/hydrate/register sequencing, bad-row isolation, or force-persist-after-resume behavior.

Wrong:

```js
for (const row of await listPersistedRooms(prisma)) {
  const room = hydratePersistedRoom(JSON.parse(row.snapshot));
  rooms.set(room.code, room);
}
```

Correct:

```js
const restoreLifecycle = createRoomPersistenceRestoreLifecycle(deps);
export const { restorePersistedRooms } = restoreLifecycle;
```

Tests touching persisted-row iteration, bad snapshot isolation, no-code skips, registration, timer resume handoff, or post-resume force persistence should update `server/roomPersistenceRestoreLifecycle.test.js`; end-to-end restart behavior can remain in `server/rooms.test.js`.

### Room Opening Lifecycle Boundary Contract

`server/roomOpeningLifecycle.js` owns the room opening transition:

- `createRoomOpeningLifecycle(deps)` returns `completeRoomOpening(room, io)` and `startInitialPassiveSkillNow(room, io)`.
- `completeRoomOpening()` returns false unless the room is in `opening` phase.
- For opening rooms, it switches `room.game.phase` to `playing`, refreshes `room.lastTick`, appends the `game-start` system notice, broadcasts the full room, schedules the initial passive-skill attempt, and returns true.
- `startInitialPassiveSkillNow()` delegates to `maybeStartPassiveSkill(room, io)` so tests and restore paths can trigger the same passive-skill entry point.

`server/rooms.js` should expose compatibility wrappers for deadline/restore callers, but it should not duplicate opening phase mutation, game-start notice shape, last-tick refresh, broadcast timing, or initial passive-skill handoff.

Wrong:

```js
room.game.phase = GAME_PHASES.playing;
appendSystem(room, "game started");
broadcastRoom(io, room);
```

Correct:

```js
return roomOpeningLifecycle.completeRoomOpening(room, io);
```

Tests touching opening completion, non-opening no-ops, game-start notices, broadcast timing, last-tick refresh, or initial passive-skill handoff should update `server/roomOpeningLifecycle.test.js`; deadline/restore scheduling can remain in their focused lifecycle tests.

### Room Deadline Scheduler Boundary Contract

`server/roomDeadlineScheduler.js` owns room deadline timer scheduling and timeout transitions:

- `createRoomDeadlineScheduler(deps)` returns `scheduleGameStart`, `scheduleInitialPassiveSkill`, `scheduleCountingTimeout`, `scheduleDrawTimeout`, `scheduleResultReviewTimeout`, and `schedulePendingRoomDeadlines`.
- `scheduleGameStart(room, io)` schedules opening completion from `room.openingEndsAt`.
- `scheduleInitialPassiveSkill(room, io)` schedules the first passive-skill attempt after `INITIAL_PASSIVE_SKILL_DELAY_MS` and broadcasts only when a passive skill actually starts.
- `scheduleCountingTimeout(room, io)` restores suspended hidden hands, clears scoring/counting state, appends the counting-timeout system message, and broadcasts when the counting deadline expires.
- `scheduleDrawTimeout(room, io)` clears draw-request state, appends the draw-timeout system message, and broadcasts when the draw deadline expires.
- `scheduleResultReviewTimeout(roomOrCode, io)` clears result-review scoring state, appends the result-review timeout system message, and broadcasts when the result deadline expires.
- `schedulePendingRoomDeadlines(room, io)` resumes only the deadline timer matching the room's current phase.

`server/rooms.js` should decide **when** room state enters these phases, but it should not duplicate deadline delay math, timeout state-reset rules, or restored-room deadline scheduling.

Wrong:

```js
scheduleRoomTimeout(room, () => {
  room.game.phase = GAME_PHASES.playing;
  room.drawDeadline = null;
}, room.drawDeadline - Date.now());
```

Correct:

```js
scheduleDrawTimeout(room, io);
```

Tests touching opening delay, passive-skill delay, timeout state resets, timeout messages, or restored pending deadlines should update `server/roomDeadlineScheduler.test.js`; end-to-end phase behavior can remain in `server/rooms.test.js`.

### Room Result Persistence Boundary Contract

`server/roomResultPersistence.js` owns finished-room result persistence:

- `saveGameRecord({ prisma, room })` is the only room result persistence entry point.
- Invalid finished rooms set `room.recordSaved = true` and do not create `GameRecord`, mode-stat, reward, ledger, or item-effect operations.
- Valid draws create a `GameRecord`, increment both players' mode `draws`, update in-room mode stats, and do not apply rating/coin rewards.
- Decisive results create a `GameRecord`, apply room-user rewards, upsert winner/loser mode stats, update user rating/win/loss/coin fields where appropriate, create progress ledger entries, and include item-effect cleanup operations.
- `modeStatsUpsertOperation()`, `applyDrawResultToRoomUser()`, and `gameResultProgressEntries()` keep the operation-shape helpers testable outside the realtime room lifecycle.
- `server/roomCloseLifecycle.js` must not emit `room:closed`, unregister the room, delete it from memory, or delete the persisted row for a valid finished room until `room.recordSaved === true`. If `saveGameRecord()` fails or is still pending when the close timer fires, keep the room open and retry the save before scheduling another close check. Invalid finished rooms may skip record creation because `saveGameRecord()` marks them saved.

`server/rooms.js` should decide **when** a finished room needs saving, but it should not own `GameRecord` payload shape, mode-stat upsert shape, reward transaction composition, progress ledger payloads, or the close-before-record-saved retry policy.

Wrong:

```js
prisma.gameRecord.create({ data: { roomCode: room.code } });
```

Correct:

```js
await saveGameRecord({ prisma, room });
```

Tests touching result persistence helpers, invalid-result skipping, draw stat updates, or progress ledger payloads should update `server/roomResultPersistence.test.js`; tests touching close gating around failed or pending record saves should update `server/roomCloseLifecycle.test.js`; integrated winner/loser reward persistence should remain covered by `server/rooms.test.js`.

### Server Startup Data Boundary Contract

`server/serverStartup.js` owns startup data and schema initialization order:

- `initializeServerData({ prisma })` runs schema guards and snapshot seeds, then legacy character/derived-skill/username cleanup before built-in character seed, followed by remaining catalog/default seeds and configured-admin promotion. Derived-skill leak cleanup must precede `seedCharacters()` so code-defined definitions are restored only for their owning built-in skill after polluted copies are removed.
- `server/index.js` should call this boundary once after HTTP middleware and Socket.IO server creation are configured, but before route/socket handlers depend on seeded data or compatibility tables.
- New startup-time seeders or schema guards should be added to `initializeServerData()` and covered by `server/serverStartup.test.js` so ordering stays explicit.

Wrong:

```js
await seedCharacters(prisma);
await ensureGachaSchema(prisma);
await promoteConfiguredAdmins(prisma);
```

Correct:

```js
await initializeServerData({ prisma });
```

Tests touching startup initializer ordering should update `server/serverStartup.test.js`; schema behavior itself should remain in the focused schema/domain tests.

### Socket Guard Boundary Contract

`server/socketGuards.js` owns Socket.IO connection-level guard middleware:

- `installSocketRateGuard(socket)` initializes `socket.data.rateGuard` and installs a Socket.IO packet middleware with `socket.use()`.
- The guard allows up to 120 events inside a 10-second window, resets the count after the window elapses, and emits `error:toast` without calling `next()` after the limit is exceeded.
- `server/index.js` should call this boundary during `io.on("connection")`, but it should not duplicate rate-window constants, counter reset logic, or limit rejection behavior.

Wrong:

```js
socket.use((_packet, next) => {
  socket.data.count += 1;
  if (socket.data.count > 120) return;
  next();
});
```

Correct:

```js
installSocketRateGuard(socket);
```

Tests touching Socket.IO event rate limiting should update `server/socketGuards.test.js`; business socket event behavior should remain in route, room, or lifecycle tests.

### Socket Event Registration Boundary Contract

`server/socketEvents.js` owns the per-connection Socket.IO event registration suite:

- `registerSocketEvents(socket, deps)` installs the rate guard and registers matchmaking, room connection/resume, gameplay, chat, direct-duel, and disconnect event groups for one authenticated socket.
- The module is an orchestration boundary only; event-specific behavior must remain in `server/socketMatchEvents.js`, `server/socketRoomEvents.js`, `server/socketGameEvents.js`, `server/socketChatEvents.js`, `server/socketDuelEvents.js`, and `server/socketDisconnectEvents.js`.
- `server/index.js` should register online presence and initial `me` / `lobby:stats` emissions, then call this boundary once with shared dependencies. It should not import every socket event group or duplicate rate-guard installation.
- New Socket.IO event groups should be added to `registerSocketEvents()` with a focused `server/socket*Events.js` module and a matching focused test file.

Wrong:

```js
io.on("connection", (socket) => {
  installSocketRateGuard(socket);
  registerMatchSocketEvents(socket, deps);
  registerRoomSocketEvents(socket, deps);
});
```

Correct:

```js
io.on("connection", (socket) => {
  registerSocketEvents(socket, deps);
});
```

Tests touching the connection-level event registration suite should update `server/socketEvents.test.js`; event behavior tests should stay in the focused `server/socket*Events.test.js` files.

### Socket Match Event Boundary Contract

`server/socketMatchEvents.js` owns the Socket.IO matchmaking event registration:

- `registerMatchSocketEvents(socket, deps)` registers `match:join` and `match:leave` handlers for one authenticated socket.
- `match:join` normalizes the requested mode, refreshes `socket.user` before queueing, filters waiting candidates through `hasBlacklistBetween()`, delegates queue/room creation to `joinMatchmaking()`, emits `match:waiting` only when no room is created, and broadcasts lobby stats after the success path.
- `match:leave` delegates queue cleanup to `leaveMatchmaking()`, emits `match:left`, and broadcasts lobby stats.
- `server/index.js` should pass shared dependencies into this boundary during `io.on("connection")`, but it should not duplicate candidate blacklist filtering, match waiting payloads, or lobby-stat refresh timing.

Wrong:

```js
socket.on("match:join", async () => {
  const room = joinMatchmaking({ user: socket.user, socketId: socket.id }, io);
  if (!room) socket.emit("match:waiting", { startedAt: Date.now() });
});
```

Correct:

```js
registerMatchSocketEvents(socket, {
  io,
  prisma,
  refreshSocketUser,
  listWaitingPlayers,
  hasBlacklistBetween,
  joinMatchmaking,
  leaveMatchmaking,
  broadcastLobbyStats,
  normalizeGameModeId
});
```

Tests touching matchmaking Socket.IO event registration, auth refresh before queueing, blacklist candidate filtering, waiting payload timing, or leave-event lobby refresh should update `server/socketMatchEvents.test.js`; queue behavior should stay in `server/roomMatchmakingQueue.test.js` and matched-room creation behavior in `server/roomCreationLifecycle.test.js`.

### Socket Room Event Boundary Contract

`server/socketRoomEvents.js` owns Socket.IO room connection and resume event registration:

- `registerRoomSocketEvents(socket, deps)` registers `room:join`, `room:leave`, and `room:resume` handlers for one authenticated socket.
- `room:join` validates the room code, delegates room attachment to `attachSocketToRoom()`, emits the viewer-specific `room:update`, and broadcasts the changed room through `broadcastRoom()`. Missing or closed rooms emit the existing room-unavailable toast.
- `room:leave` delegates room mutation to `leaveRoom()`, leaves the Socket.IO room only when a room changed, emits `room:left`, and broadcasts the changed room.
- `room:resume` delegates resume payload selection to `resumePayloadForUser()`, uses `validateOptionalRoomCode()` for optional room-code normalization, reattaches resumable rooms through `attachSocketToRoom()`, and otherwise emits the original `room:resume` payload.
- `server/index.js` should pass shared dependencies into this boundary during `io.on("connection")`, but it should not duplicate room-code validation, room attachment, resume payload branching, Socket.IO room leave calls, or post-change broadcast timing.

Wrong:

```js
socket.on("room:join", ({ roomCode }) => {
  const room = attachSocketToRoom(roomCode, socket, socket.user);
  socket.emit("room:update", roomView(room, socket.user.id));
});
```

Correct:

```js
registerRoomSocketEvents(socket, {
  io,
  prisma,
  validateRoomCode,
  validateOptionalRoomCode,
  attachSocketToRoom,
  leaveRoom,
  findRoomForUser,
  resumePayloadForUser,
  roomView,
  broadcastRoom
});
```

Tests touching Socket.IO room join/leave/resume event registration, room-code error forwarding, attach failures, viewer-specific update emission, resume fallback payloads, or post-change broadcasts should update `server/socketRoomEvents.test.js`; room connection mutation behavior should stay in `server/roomConnectionLifecycle.test.js` and resume payload behavior in `server/resume.test.js`.

### Socket Game Event Boundary Contract

`server/socketGameEvents.js` owns Socket.IO gameplay, counting, draw, and scoring event registration:

- `registerGameSocketEvents(socket, deps)` registers `game:action`, `counting:request`, `counting:respond`, `draw:request`, `draw:respond`, and `scoring:action` handlers for one authenticated socket.
- Each handler forwards the current `socket.user.id`, room code, action/accepted payload, and `io` dependency to the matching room lifecycle entry point.
- Failed lifecycle results emit `error:toast` with `result.error`; successful lifecycle results broadcast the changed room through `broadcastRoom(io, result.room)`.
- `server/index.js` should pass shared lifecycle dependencies into this boundary during `io.on("connection")`, but it should not duplicate result error emission, success broadcast checks, or per-event lifecycle argument wiring.

Wrong:

```js
socket.on("game:action", (payload = {}) => {
  const result = handleGameAction(payload.roomCode, socket.user.id, payload.action, io);
  if (!result.ok) socket.emit("error:toast", result.error);
});
```

Correct:

```js
registerGameSocketEvents(socket, {
  io,
  handleGameAction,
  requestCounting,
  respondCounting,
  requestDraw,
  respondDraw,
  handleScoringAction,
  broadcastRoom
});
```

Tests touching Socket.IO game/counting/draw/scoring event registration, lifecycle argument wiring, result error toasts, or success-room broadcasts should update `server/socketGameEvents.test.js`; gameplay rules should stay in `server/roomActionLifecycle.test.js`, counting/draw/scoring entry validation in `server/roomRequestLifecycle.test.js`, and lower-level game rule modules.

### Socket Chat Event Boundary Contract

`server/socketChatEvents.js` owns Socket.IO room chat event registration:

- `registerChatSocketEvents(socket, deps)` registers `chat:send` for one authenticated socket.
- The handler forwards `roomCode`, current `socket.user`, and text to `addChat()`.
- When `addChat()` returns a changed room, the handler broadcasts it through `broadcastRoom(io, room)`; null results are intentionally silent because room-code, text, and missing-room rejection already live in `server/roomChatLifecycle.js`.
- `server/index.js` should pass shared chat and broadcast dependencies into this boundary during `io.on("connection")`, but it should not duplicate chat mutation calls or post-chat broadcast checks.

Wrong:

```js
socket.on("chat:send", ({ roomCode, text } = {}) => {
  const room = addChat(roomCode, socket.user, text);
  if (room) broadcastRoom(io, room);
});
```

Correct:

```js
registerChatSocketEvents(socket, {
  io,
  addChat,
  broadcastRoom
});
```

Tests touching Socket.IO chat event registration, chat payload forwarding, or post-chat broadcast behavior should update `server/socketChatEvents.test.js`; chat text normalization and chat message mutation rules should stay in `server/roomChatLifecycle.test.js`.

### Socket Duel Event Boundary Contract

`server/socketDuelEvents.js` owns Socket.IO direct-duel event registration:

- `registerDuelSocketEvents(socket, deps)` registers `duel:request` and `duel:respond` handlers for one authenticated socket.
- Both handlers refresh `socket.user` before delegating so direct-duel room creation uses the latest selected character and user state.
- `duel:request` string-normalizes `targetUserId`, normalizes the requested game mode through `normalizeGameModeId()`, and delegates to `duelRequests.handleRequest()`.
- `duel:respond` string-normalizes `requestId`, coerces `accepted` to boolean, delegates to `duelRequests.handleResponse()`, and broadcasts lobby stats after a successful response path.
- Refresh or duel-manager failures emit the existing auth-expired `error:toast`; failed responses do not broadcast lobby stats.
- `server/index.js` should pass shared duel, auth-refresh, mode-normalization, and lobby-stat dependencies into this boundary during `io.on("connection")`, but it should not duplicate direct-duel payload coercion, auth-refresh timing, failure toast handling, or lobby-stat refresh timing.

Wrong:

```js
socket.on("duel:request", async ({ targetUserId, mode }) => {
  await duelRequests.handleRequest(socket, targetUserId, mode);
});
```

Correct:

```js
registerDuelSocketEvents(socket, {
  refreshSocketUser,
  duelRequests,
  normalizeGameModeId,
  broadcastLobbyStats
});
```

Tests touching Socket.IO duel event registration, refresh-before-delegate behavior, payload coercion, auth-expired toasts, or successful response lobby refreshes should update `server/socketDuelEvents.test.js`; request lifecycle behavior should stay in `server/duelRequests.test.js`.

### Socket Disconnect Event Boundary Contract

`server/socketDisconnectEvents.js` owns Socket.IO disconnect cleanup registration:

- `registerDisconnectSocketEvents(socket, deps)` registers the `disconnect` handler for one authenticated socket.
- The handler unregisters the online socket, delegates room/matchmaking cleanup to `detachSocket(socket.id, io)`, broadcasts every changed room returned by `detachSocket()`, and refreshes lobby stats after cleanup.
- Lobby stats are refreshed even when no room changed so online-presence counts remain current.
- `server/index.js` should pass shared online-session, room-detach, room-broadcast, and lobby-stat dependencies into this boundary during `io.on("connection")`, but it should not duplicate disconnect cleanup order, detach result iteration, or lobby-stat refresh timing.

Wrong:

```js
socket.on("disconnect", () => {
  onlineSessions.unregisterOnlineSocket(socket);
  detachSocket(socket.id, io);
});
```

Correct:

```js
registerDisconnectSocketEvents(socket, {
  io,
  unregisterOnlineSocket,
  detachSocket,
  broadcastRoom,
  broadcastLobbyStats
});
```

Tests touching Socket.IO disconnect event registration, cleanup ordering, changed-room broadcasts, or lobby refresh behavior should update `server/socketDisconnectEvents.test.js`; room connection mutation behavior should stay in `server/roomConnectionLifecycle.test.js`.

### Scenario: Production Static Delivery and Capacity Verification

#### 1. Scope / Trigger
- Trigger: changing production static hosting, cache headers, Nginx/systemd templates, stability-server startup, runtime capacity telemetry, or the capacity verification command.
- This is an infrastructure and cross-layer contract: Nginx, Express fallback, browser preload, Socket.IO, systemd shutdown, admin authorization, and load-test reporting must agree.

#### 2. Signatures
- Express fallback: `installProductionStaticAssets(app, { distDir, env }) -> boolean`.
- Cache constants: `IMMUTABLE_ASSET_CACHE_CONTROL`, `RUNTIME_ASSET_CACHE_CONTROL`, and `HTML_CACHE_CONTROL` from `server/staticAssets.js`.
- Deployment templates: `deploy/nginx/sigrikago.conf` and `deploy/systemd/sigrikago.service`.
- Admin telemetry: `GET /api/admin/runtime-capacity -> { generatedAt, runtimeStability, capacity }` behind `authHttp` and `requireAdmin`.
- Capacity command: `npm run verify:capacity -- --profile smoke|target [--sockets N --rooms N --spectators-per-room N --duration seconds --action-interval seconds --reconnect-ratio ratio]`.
- Verification environments: `NODE_ENV=stability` for built-browser checks and `NODE_ENV=capacity` for the isolated load generator. Production remains `NODE_ENV=production`.

#### 3. Contracts
- Production Nginx sends only `/socket.io/`, `/api/`, and `/health/*` to Node. It serves `dist`, `/assets/**`, and `/uploads/**` directly; `/socket.io/` disables buffering and uses 90-second proxy read/write timeouts.
- Hashed Vite JS/CSS receives `public, max-age=31536000, immutable`; named runtime `/assets/**` receives `no-cache` so stable URLs revalidate after content replacement; `index.html` receives `no-cache`; uploads receive a short revalidating cache.
- Express fallback uses the same three cache values when Nginx is absent. `express.static` must use `index: false` so the SPA fallback owns the HTML header, and the fallback excludes `/api`, `/socket.io`, and `/uploads`.
- Nginx gzip covers text formats only. OGG/WebP/PNG and other precompressed media are not recompressed; Nginx static delivery keeps native HTTP Range support for audio.
- Same-origin CDN rollout keeps browser URLs under `/assets/**`. CDN rules mirror the Nginx cache contract and never cache/proxy Socket.IO, dynamic API, or health traffic.
- systemd starts `/usr/bin/node /opt/sigrikago/server/index.js` directly, sends SIGTERM, grants 25 seconds to drain, sets `LimitNOFILE=65535`, and uses `MemoryHigh=1400M` / `MemoryMax=1600M` on the 2 GB template.
- Capacity verification always creates an isolated temporary SQLite database, raises setup rate limits only in `NODE_ENV=capacity`, enables debug actions only outside production, samples the lightweight admin runtime endpoint, performs periodic reconnect plus optional managed restart, and writes ignored JSON reports under `artifacts/capacity/`.
- Capacity verification promotes its metrics reader through the authenticated verification fixture route after registration; it must not depend on username-based administrator promotion. The route is usable only in explicitly enabled `stability` or `capacity` environments and returns 404 elsewhere.
- Smoke uses a 150 ms event-loop p95 diagnostic line to verify the local 20-socket pipeline. Target retains the 50 ms event-loop p95 release line; smoke success is never a production capacity approval.
- `npm run verify:release-candidate` is the fail-fast local orchestration boundary: Prisma generate, migration verification, production configuration, one build, stability without a repeated build, disposable backup/restore verification, then capacity smoke without a repeated build.
- The target profile is a candidate release line, not a capacity promise: 500 sockets, 100 rooms, two spectators per room, 7.5-second action intervals, 20% reconnect, and one restart. Production soft limits may be raised only after this profile passes on the actual 2-core/2-GB host.

#### 4. Validation & Error Matrix
- Hashed Vite JS/CSS -> one-year immutable cache in both Nginx and Express fallback.
- Named image/audio/voice asset -> conditional revalidation through `no-cache`; never immutable or stale-while-revalidate by filename description alone.
- SPA shell or client route -> serve `index.html` with `no-cache`.
- `/socket.io/` -> WebSocket proxy with buffering/cache disabled; never SPA fallback.
- `/api/`, `/health/*`, or `/uploads/*` -> retain their dedicated backend/static boundary; never return SPA HTML.
- Capacity profile with fewer than two sockets per requested room -> fail before starting load.
- Runtime metrics unavailable or persistence/result error observed in any sample -> threshold report fails.
- Production `NODE_ENV` with debug actions -> continue to reject through the production security contract.
- `STABILITY_PORT` set while a generic `PORT` is inherited -> `STABILITY_PORT` wins so Playwright base URL and child listener stay aligned.

#### 5. Good/Base/Bad Cases
- Good: Nginx serves a 5 MB OGG with Range support while Node continues processing action acks without static-file syscalls.
- Good: a deployment publishes assets first and `index.html` last; an old client can still request the prior hashed chunk during rollback.
- Good: capacity smoke reports client ack/reconnect/resume percentiles plus peak RSS/event-loop metrics before and after a managed restart.
- Base: local `LOCAL_PROD_STATIC=1` serves the same production build through Express for Playwright without enabling production guards.
- Bad: proxying all `/` traffic with WebSocket upgrade headers, because large music/image transfers compete with realtime work.
- Bad: reading database-heavy overview analytics every load-test interval instead of `/api/admin/runtime-capacity`.
- Bad: running the capacity profile against the production database or public production instance.

#### 6. Tests Required
- `server/staticAssets.test.js` asserts mount conditions, `index: false`, SPA exclusions, hashed names including dash characters, runtime cache, and no-cache HTML.
- `tests/stability/production-static.spec.js` asserts the effective desktop/mobile HTTP cache headers from a built server.
- `scripts/deploymentConfig.test.js` asserts Nginx route separation/cache values and systemd shutdown/memory/file-limit values.
- `server/adminRoutes.test.js` asserts the lightweight runtime capacity payload without database analytics.
- `scripts/capacityVerification.test.js` asserts profile validation, target topology, percentile summaries, isolated server wiring, and restart/report command wiring.
- `scripts/stabilityVerification.test.js` asserts direct Node spawning and `STABILITY_PORT` precedence. Run capacity smoke plus `npm run check` before handoff.
- `scripts/releaseCandidateVerification.test.js` asserts the stage order, production-only configuration environment, and build reuse flags. `server/verificationFixtureRoutes.test.js` asserts fixture environment denial and exact database mutations.

#### 7. Wrong vs Correct

Wrong:

```nginx
location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Upgrade $http_upgrade;
}
```

Correct:

```nginx
location ^~ /socket.io/ { proxy_pass http://sigrikago_node; proxy_buffering off; }
location ^~ /api/ { proxy_pass http://sigrikago_node; proxy_buffering on; }
location /assets/ { try_files $uri =404; }
location / { try_files $uri $uri/ /index.html; }
```

Wrong:

```ini
ExecStart=/usr/bin/npm start
Restart=always
```

Correct:

```ini
ExecStart=/usr/bin/node /opt/sigrikago/server/index.js
Restart=on-failure
TimeoutStopSec=25
```

### Leaderboard API Contract

`GET /api/leaderboard` returns users who have at least one completed game. Each player row must include:

- `id`, `username`, `rating`, `rank`, `itemEffects`
- `totalGames`, `wins`, `losses`, `draws`
- `commonCharacter`

`draws` is a first-class response field, not a frontend-only derived value. `buildLeaderboard()` increments it when `recordWinnerColor(record)` returns no winner, and tests should assert draw counts alongside wins and losses.

Wrong:

```js
return { totalGames: row.totalGames, wins: row.wins, losses: row.losses };
```

Correct:

```js
return { totalGames: row.totalGames, wins: row.wins, losses: row.losses, draws: row.draws };
```

### Scenario: Production Realtime Drain and Idempotent Game Actions

#### 1. Scope / Trigger
- Trigger: changing Socket.IO gameplay delivery, room persistence snapshots, runtime admission limits, process shutdown, readiness, or player reconnect behavior.
- This is a cross-layer and infrastructure contract. The browser, Socket.IO event boundary, authoritative room state, SQLite snapshot, health endpoints, and process manager must remain aligned.

#### 2. Signatures
- Client command: `game:action`, payload `{ roomCode, action, actionId }`, acknowledgement `{ ok, actionId, roomCode, revision, error?, code? }`.
- Admission: `runtimeServiceState.admission(kind)` where `kind` is `match` or `spectator` and the result is `{ ok: true }` or `{ ok: false, code, error }`.
- Runtime lifecycle: `beginDrain(reason)`, `isDraining()`, `readiness()`, and `snapshot()`.
- Health endpoints: `GET /health/live` and `GET /health/ready`.
- Environment keys: optional positive integers `MAX_ONLINE_USERS` (default 500) and `MAX_ACTIVE_ROOMS` (default 100).

#### 3. Contracts
- A client retry for one user intent must reuse the same non-empty `actionId`; it may retry only after ack timeout and must never apply a local optimistic board mutation.
- The server stores the bounded per-user action receipt before the successful full-room broadcast. `actionReceipts` must remain in persisted room snapshots and hydrate with backward-compatible defaults.
- Duplicate action ids return the stored acknowledgement without running the room action lifecycle or broadcasting the mutation again.
- Drain rejects new authoritative mutations and new match/duel admission, emits a readable notice, and returns `code: "server_draining"` to acknowledged events. `room:resume` remains available until realtime shutdown.
- Soft capacity rejects new matchmaking, accepted duel creation, and new spectators. Existing players identified by `findRoomForUser(userId, roomCode)` bypass spectator admission so reconnect remains available.
- Graceful shutdown order is drain notification, Socket.IO close, HTTP close, forced room-persistence flush, runtime-metric close, then Prisma disconnect. The internal deadline is 15 seconds.

#### 4. Validation & Error Matrix
- Missing action id for a legacy client -> execute without deduplication and keep the optional ack backward compatible.
- Invalid/non-string/overlong action id -> reject with `invalid_action_id`; do not enter gameplay logic.
- Duplicate valid action id -> return the original receipt and increment duplicate-ack metrics.
- Ack timeout after all retries -> request `room:resume` and show a warning; do not assume success or failure locally.
- Draining mutation -> reject with `server_draining`; preserve `actionId` and `roomCode` in a game-action ack.
- Online or room soft limit reached -> reject only new match/duel/spectator admission with the matching capacity code and message.
- Existing player reconnect at a soft limit -> allow room attachment/resume.
- Readiness during drain -> HTTP 503; liveness remains HTTP 200.

#### 5. Good/Base/Bad Cases
- Good: the server executes a move, the ack is lost, the browser retries the same id, and the server returns the stored receipt without a second move.
- Good: a process drains, closes mutations, flushes the acknowledged move, restarts on the same SQLite file, and the player resumes the same board.
- Base: an older snapshot without `actionReceipts` hydrates with an empty receipt map.
- Bad: generating a new id for every retry, because an ack loss can become a duplicate move.
- Bad: applying `MAX_ACTIVE_ROOMS` to `room:resume`, because overload protection would disconnect the games it is meant to protect.

#### 6. Tests Required
- `server/socketGameEvents.test.js` asserts success/failure ack fields, invalid ids, duplicate receipts, and exactly-once lifecycle/broadcast behavior.
- `src/app/gameActionDelivery.test.js` asserts same-payload retries, matching-ack settlement, stale-ack rejection, retry exhaustion, and cancellation.
- Persistence tests assert receipt snapshot/hydration compatibility and bounded storage.
- Socket guard/admission tests assert drain mutation rejection, resume allowance, capacity rejection, and existing-player bypass.
- Lifecycle/health tests assert shutdown ordering, idempotency, deadline failure, liveness, and draining readiness.
- `server/serverProcessRestart.test.js` must start a real child process, acknowledge a move, perform managed graceful shutdown, restart on the same temporary SQLite database, and assert the restored point and move number.

#### 7. Wrong vs Correct

Wrong:

```js
setTimeout(() => socket.emit("game:action", { roomCode, action, actionId: randomUUID() }), 4000);
```

Correct:

```js
const payload = { roomCode, action, actionId: randomUUID() };
socket.emit("game:action", payload, acknowledge);
setTimeout(() => socket.emit("game:action", payload, acknowledge), 4000);
```

Wrong:

```js
if (runtimeServiceState.admission("spectator").ok) attachSocketToRoom(roomCode, socket, user);
```

Correct:

```js
const existingPlayer = findRoomForUser(user.id, roomCode);
if (existingPlayer || runtimeServiceState.admission("spectator").ok) {
  attachSocketToRoom(roomCode, socket, user);
}
```

### Scenario: Bounded Spectator and Lobby Realtime Load

#### 1. Scope / Trigger
- Trigger: changing spectator room views, live perspective switching, spectator admission, lobby-stat broadcasts, or initial room-creation delivery.
- This is a backend/frontend realtime contract: payload shape and hidden-information projections must stay compatible while fan-out and serialized bytes remain bounded.

#### 2. Signatures
- Spectator room view: `{ role: "spectator", game: blackView, gameViews: { white: whiteView } }`.
- Per-room admission: `roomSpectatorAdmission(room, userId, limits)` and `runtimeServiceState.admission("spectator", { room, userId })`.
- Environment key: optional positive integer `MAX_SPECTATORS_PER_ROOM`, default `20`.
- Lobby broadcaster: `createLobbyStatsBroadcaster({ io, getStats, delayMs, metrics }) -> { schedule, flush, close }`.
- Creation delivery: one `match:found` per matched player after creation notices and initial persistence; no immediate duplicate `room:update`.

#### 3. Contracts
- `game` is the canonical black spectator projection. Never serialize the same black projection again as `gameViews.black`; `gameViews.white` is the only alternate live projection.
- `useRoomBoardView` must use `room.game` for black and `room.gameViews.white` for white, while replay/history reconstruction continues through the shared game-view helpers.
- First-time spectators are rejected when the room reaches the configured limit. Existing spectators may replace their socket and reconnect even when per-room or global soft limits are currently reached.
- The socket boundary provides the readable rejection before side effects, and `roomConnectionLifecycle` applies the same shared rule as a defense-in-depth authority check.
- Lobby-stat requests use one trailing 100ms timer and emit only the latest state. A payload equal to the last emitted payload is skipped; drain closes the broadcaster and cancels its timer.
- Creation notices are appended before the initial forced snapshot. The resulting `match:found` is authoritative until preload/opening events produce a later full snapshot.

#### 4. Validation & Error Matrix
- New spectator at `spectators.length >= MAX_SPECTATORS_PER_ROOM` -> reject with `room_spectator_capacity` and `当前房间观战席已满，请稍后再试`.
- Existing spectator at any soft limit -> allow socket replacement without adding a second spectator row or join notice.
- Missing room during socket precheck -> continue to the normal attach boundary and return the existing room-unavailable result.
- Repeated lobby-stat triggers inside 100ms -> one latest-state emission.
- Scheduled lobby payload equals the last emitted payload -> no emission.
- Drain before the timer fires -> cancel without emitting.
- Legacy spectator payload with no alternate white view -> keep a safe frontend fallback; new servers must always send `gameViews.white`.

#### 5. Good/Base/Bad Cases
- Good: a 20-seat room rejects watcher 21, while watcher 5 can reconnect from a new socket.
- Good: 100 reconnect/disconnect triggers in one debounce window produce one global lobby update.
- Good: room creation persists notices and sends two viewer-specific `match:found` payloads without a follow-up duplicate full snapshot.
- Base: player room views still contain only the viewer's own `game` and `gameViews: null`.
- Bad: `{ game: blackView, gameViews: { black: blackView, white: whiteView } }`, because JSON serialization duplicates the largest subtree.
- Bad: enforcing the spectator limit only after `attachSocketToRoom()` has added membership and emitted a join notice.

#### 6. Tests Required
- `server/roomView.test.js` asserts the compact spectator shape and both hidden-information perspectives.
- `src/room/view/useRoomBoardView.test.js` asserts black uses `game`, white uses `gameViews.white`, and compatibility fallback does not crash.
- `server/runtimeServiceState.test.js`, `server/socketRoomEvents.test.js`, and `server/roomConnectionLifecycle.test.js` assert first-time rejection plus existing-spectator reconnect.
- `server/lobbyStatsBroadcaster.test.js` asserts burst coalescing, equal-payload suppression, metrics, and drain cancellation.
- `server/roomCreationLifecycle.test.js` asserts notices precede persistence and only `match:found` is emitted during creation.
- Room/preload/socket transition tests must remain green so removing the duplicate initial full snapshot cannot strand a player before `room:preload-ready`.

#### 7. Wrong vs Correct

Wrong:

```js
return { game: views.black, gameViews: views };
```

Correct:

```js
return { game: blackView, gameViews: { white: whiteView } };
```

Wrong:

```js
function broadcastLobbyStats() {
  io.emit("lobby:stats", lobbyStats());
}
```

Correct:

```js
const lobbyStatsBroadcaster = createLobbyStatsBroadcaster({ io, getStats: lobbyStats });
function broadcastLobbyStats() {
  lobbyStatsBroadcaster.schedule();
}
```

---

## Testing Requirements

<!-- What level of testing is expected -->

- Leaderboard changes should update `server/leaderboard.test.js` with base win/loss/draw cases, including at least one draw record.

---

## Code Review Checklist

<!-- What reviewers should check -->

(To be filled by the team)

### Scenario: API, Session, Record Query, and Playwright Reliability

#### 1. Scope / Trigger
- Trigger: changing `/api` error propagation, refresh/login-session persistence, `GameRecord` list or aggregate queries, Playwright server startup, or SQLite test database wiring.

#### 2. Signatures
- API fallback: `apiErrorHandler(error, request, response, next)` mounted at `/api` after API routers and before static serving.
- Refresh rotation: `loginSessions.refresh(refreshToken)` performs a compare-and-swap update against the old token hash and returns the next token only to the winner.
- Activity adoption: `loginSessions.adopt(accessToken)` updates `lastSeenAt` only after `SESSION_LAST_SEEN_WRITE_INTERVAL_MS` (5 minutes).
- Profile statistics: `GET /api/users/:id/profile?mode=<mode>` returns `recordStats: { totalGames, wins, losses, draws }` plus per-character `total`, `wins`, `losses`, and `draws`, calculated from the selected mode's complete rated history.
- Replay pagination: `GET /api/replays?mode=<mode>&cursor=<opaque>` and public `GET /api/users/:id/replays?mode=<mode>&cursor=<opaque>` both return `{ records, nextCursor }`; `listReplaySummaryPage({ prisma, userId, mode, cursor })` is their shared query boundary.
- Playwright database: `preparePlaywrightTestDatabase({ label, port }) -> { databasePath, databaseUrl, cleanup }`.
- Playwright E2E URL: `E2E_CLIENT_PORT` must drive both `use.baseURL`/`webServer.url` in `playwright.config.js` and the Vite port in `start-e2e-environment.mjs`.
- `GameRecord` indexes: `(blackUserId, createdAt)`, `(whiteUserId, createdAt)`, and `(mode, rated, createdAt)`.

#### 3. Contracts
- Every error reaching the `/api` fallback returns JSON with `error`; valid status/code metadata is preserved, while unexpected production 500 details are hidden.
- A refresh token is single-use under concurrency: the database update must include the old hash, active state, and expiry in its predicate.
- Replay list responses are newest-first and bounded to 50 rows per request, but `nextCursor` allows reading the complete history. Leaderboard and achievement record scans are newest-first and bounded to 10,000 rows; leaderboard scans request rated records only. Profile record statistics intentionally use all rated records for the selected user/mode and must not be derived from a replay page.
- Playwright must never write `prisma/dev.db`. It creates a unique SQLite file under `.tmp/playwright`, initializes a valid empty SQLite header before Prisma `db push`, passes the URL to both services, and removes database sidecars on exit.

#### 4. Validation & Error Matrix
- Known API error with status/code -> same status and `{ error, code }` JSON.
- Unexpected production error -> HTTP 500 with generic JSON message; no stack/internal message.
- Two concurrent refreshes using one token -> exactly one succeeds; the other returns no session.
- Access-token adoption inside 5 minutes -> no database write; adoption after the threshold -> one `lastSeenAt` update.
- Replay cursor absent -> return the newest page of at most 50 rows.
- Replay cursor valid with older rows -> append the next page and return another cursor only when more rows exist.
- Replay cursor malformed or structurally invalid -> HTTP 400 with `{ error: "棋谱分页参数无效" }`.
- Friendly replay present -> include it in replay history, but exclude it from profile `recordStats` and character statistics.
- Same user opened through Resume and detailed profile -> both surfaces receive the same profile statistics for the same mode.
- Prisma initialization failure -> remove the temporary database and fail Playwright startup.
- Missing/invalid `GameRecord` query boundary -> reject in focused route/domain tests before E2E.

#### 5. Good/Base/Bad Cases
- Good: E2E creates `e2e-5173-<pid>.db`, runs the browser tests, then leaves `.tmp/playwright` without that database or WAL files.
- Good: a 121-record history loads as 50, 50, and 21 rows through opaque cursors without duplicate or missing rows, while the profile total remains the complete rated total.
- Base: a normal API domain error retains its current client-visible status and message.
- Base: a history of 50 or fewer rows returns `nextCursor: null`.
- Bad: calling `findMany()` without `take` for replay list pages, leaderboard, or achievement history; profile statistics are the separate full-rated-history contract.
- Bad: deriving Resume totals or character statistics from the currently loaded replay page, because pagination and friendly records make that subset non-authoritative.
- Bad: refreshing by session id alone, because two callers can both rotate the same old token.

#### 6. Tests Required
- `server/httpErrors.test.js` asserts known and unexpected error response shapes.
- `server/loginSessions.test.js` asserts throttled adoption and one-winner concurrent refresh rotation.
- `server/replayPagination.test.js` asserts the 50-row boundary, composite `(createdAt, id)` tie cursor, terminal cursor, and malformed-cursor error; replay/social route tests assert the common `{ records, nextCursor }` response.
- `server/social.test.js` asserts that profile `recordStats` and character statistics use complete rated history; `src/modals/ResumeModal.dom.test.jsx` asserts Resume renders the profile response instead of local replay-derived totals.
- Public/achievement/schema tests assert filters, ordering, limits, and indexes.
- `scripts/playwrightTestDatabase.test.js` asserts the database path is temporary and cleanup removes it; `npm run test:e2e` and `npm run test:stability` must pass against isolated databases.

#### 7. Wrong vs Correct

Wrong:

```js
await prisma.loginSession.update({ where: { id: session.id }, data: nextSession });
```

Correct:

```js
await prisma.loginSession.updateMany({
  where: { id: session.id, refreshTokenHash: oldHash, revokedAt: null, expiresAt: { gt: now } },
  data: nextSession
});
```

Wrong:

```js
const recordStats = summarizeReplayRows(await fetch("/api/replays"));
```

Correct:

```js
const profile = await fetch(`/api/users/${userId}/profile?mode=${mode}`);
const replayPage = await fetch(`/api/replays?mode=${mode}&cursor=${nextCursor}`);
// Profile owns complete rated statistics; replay pages only own history presentation.
```

### Scenario: Pixi Blob Worker CSP And HTTPS Static Delivery

#### 1. Scope / Trigger
- Trigger: changing Helmet CSP, Pixi texture-backed effects, the production Nginx site, or static cache/compression behavior.
- Pixi may create Blob workers while decoding animated WebP textures; allowing page scripts and allowing workers are separate security decisions.

#### 2. Signatures
- `CONTENT_SECURITY_POLICY_DIRECTIVES.workerSrc = ["'self'", "blob:"]`.
- `CONTENT_SECURITY_POLICY_DIRECTIVES.scriptSrc = ["'self'"]`.
- `/etc/nginx/sites-available/sigrikago` includes `/etc/nginx/snippets/sigrikago-routes.conf` inside the HTTPS server.
- `deploy/nginx/sigrikago-routes.conf` owns gzip, cache locations, SPA shell CSP, and Node proxy boundaries.

#### 3. Contracts
- Never add `blob:` or `'unsafe-eval'` to `script-src` to fix a worker error. Grant Blob URLs only through `worker-src`.
- Helmet and the Nginx-served SPA shell must carry equivalent CSP directives, because direct Nginx HTML bypasses Node middleware.
- Nginx serves built/uploaded files directly; only `/socket.io/`, `/api/`, and `/health/*` reach Node.
- Compress CSS, JavaScript, HTML, JSON, XML, and SVG; do not recompress WebP, PNG, OGG, or other already-compressed media.
- Hashed CSS/JS remains one-year immutable, named assets and HTML revalidate with no-cache, and only content-addressed filenames may be immutable.

#### 4. Validation & Error Matrix
- Animated texture creates `blob:` worker under strict fallback `script-src` -> blocked effect; add the explicit worker directive.
- `blob:` appears in `script-src` -> fail the security contract test.
- Nginx serves `index.html` without worker CSP -> effect remains broken even if Helmet is correct.
- `nginx -t` fails -> do not reload; restore/review the backed-up site configuration.
- Text asset response lacks `Content-Encoding: gzip` after deployment -> verify the HTTPS server includes the shared routes snippet.

#### 5. Good/Base/Bad Cases
- Good: Danea animated WebP, Baconbits WebP, Changli SVG sprites, and Voyage Star WebP load under `worker-src 'self' blob:` while page scripts remain same-origin only.
- Base: procedural effects require no texture worker and continue through the same renderer registry.
- Bad: proxy every static request through Node, omit gzip, and rely on Helmet for HTML that Nginx actually serves.
- Bad: loosen `script-src` globally because one Pixi decoder worker was blocked.

#### 6. Tests Required
- Server header tests assert exact `workerSrc`, strict `scriptSrc`, and Helmet wiring.
- Deployment template tests assert HTTPS domain/include, gzip types, cache contracts, and the strict script/Blob-worker CSP split.
- Board effect asset/registry/component tests cover every registered texture-backed effect, preload behavior, and runtime error containment.
- Run `npm run check`; run `sudo nginx -t` on the target host before reload and verify a built CSS response with `curl --compressed -I`.

#### 7. Wrong vs Correct

Wrong:

```js
scriptSrc: ["'self'", "blob:", "'unsafe-eval'"]
```

Correct:

```js
scriptSrc: ["'self'"],
workerSrc: ["'self'", "blob:"]
```

### Scenario: Safe Single-Host Production Update

#### 1. Scope / Trigger
- Trigger: changing the production update command, Git deployment flow, database migration order, frontend bundle activation, Nginx templates, onboarding bootstrap synchronization, or service health verification.
- The production host is a single-node deployment where Nginx serves `dist/`, Node runs under systemd, and SQLite lives outside the Git worktree. An update must therefore coordinate source, static files, database state, proxy configuration, and process lifecycle as one fail-fast operation.

#### 2. Signatures
- Update command: `sudo ./deploy/update-production.sh`.
- Required defaults: project directory inferred from the script, service `sigrikago`, branch `master`, database `/var/lib/sigrikago/prod.db`, backup directory `/var/backups/sigrikago`, and readiness URL `http://127.0.0.1:3001/health/ready`.
- Supported overrides: `SIGRIKAGO_PROJECT_DIR`, `SIGRIKAGO_SERVICE_NAME`, `SIGRIKAGO_DATABASE_PATH`, `SIGRIKAGO_BACKUP_DIR`, `SIGRIKAGO_NGINX_SITE_PATH`, `SIGRIKAGO_NGINX_SITE_LINK`, `SIGRIKAGO_NGINX_ROUTES_PATH`, and `SIGRIKAGO_HEALTH_URL`. Production updates remain pinned to `master`.

#### 3. Contracts
- Refuse to update from a non-root process, a non-Git directory, a missing `.env`, a missing live `dist/`, a branch other than `master`, or a worktree with tracked/staged changes. After locating `.env`, use `set -a`, source the trusted root-owned project file, and restore `set +a` so every deployment subprocess inherits the same configuration as systemd `EnvironmentFile`. Untracked files are preserved so a legacy root-level `update.sh` does not block the maintained script.
- Fetch first and require the current local commit to be an ancestor of `origin/<branch>`; update source only through `git pull --ff-only` and never reset or discard local history.
- Create and verify a SQLite backup through `npm run backup:sqlite` before pulling or migrating. Use private `umask 077` for the backup, then restore `umask 022` before dependency installation and build so Nginx can traverse and read the activated static bundle. The database and upload data remain outside the Git worktree.
- Run `npm ci --include=dev`, build to a unique `.tmp/production-update-*/dist` directory, and pass `npm run check:production` before stopping the service. `--include=dev` is mandatory because sourcing the production `.env` sets `NODE_ENV=production`, while Vite and its plugins are devDependencies required to compile the bundle. The production checker must import `dotenv/config` so the command reads the same current-working-directory `.env` that systemd supplies through `EnvironmentFile`; explicit process environment values retain dotenv's normal precedence. Never clear or partially overwrite the live `dist/` during compilation.
- Back up the active Nginx files, install the repository templates, and pass `nginx -t` before reloading. If validation fails, restore the prior Nginx files and keep the running service untouched.
- Only after build and proxy validation: stop the service, run `prisma migrate deploy`, preview and apply `admin:sync-defaults`, atomically replace `dist/`, reload Nginx, start the service, and require readiness within the bounded retry window. The sync updates/creates committed non-user admin rows but preserves cloud-only and user/history/runtime rows.
- Failure after service stop must attempt to restore the previous frontend bundle and restart the service. It must not roll back Git or SQLite automatically; retain the verified database backup for explicit recovery.

#### 4. Validation & Error Matrix
- Local branch contains commits not in the remote branch, or histories diverge -> abort before backup/pull and require manual review.
- Tracked or staged worktree changes -> abort without modifying Git, database, Nginx, or the service.
- Backup creation or verification fails -> abort before source update and migration.
- Dependency install, staged build, production check, or `nginx -t` fails -> abort while the existing service and live frontend remain active.
- Production `NODE_ENV` causes npm to omit devDependencies and `vite` is unavailable -> the maintained script's explicit `npm ci --include=dev` installs the locked build toolchain before compilation.
- `.env` contains valid `JWT_SECRET` and production origin but the invoking shell did not export them -> `npm run check:production` loads them from `.env` and continues.
- Migration, onboarding sync, bundle activation, Nginx reload, service start, or readiness fails -> run the best-effort frontend/service recovery trap, keep the database backup, and exit non-zero.
- Readiness does not return success within 60 seconds -> fail the deployment even if systemd reports the process as started.

#### 5. Good/Base/Bad Cases
- Good: remote `master` is ahead, the database is backed up, the new bundle builds in `.tmp`, all preflight checks pass, downtime covers only migrate/sync/swap/start, and readiness succeeds.
- Base: remote and local commits are identical; the same command still verifies and rebuilds safely without rewriting history.
- Bad: `git reset --hard origin/master`, because it destroys local commits and hides deployment drift.
- Bad: `npm run build` directly into the live `dist/`, because Vite clears the directory before the replacement bundle is complete.
- Bad: stopping systemd before dependency install and build, because avoidable build time becomes user-visible downtime.

#### 6. Tests Required
- `scripts/deploymentConfig.test.js` must assert fail-fast shell mode, `.env` export before any environment-dependent subprocess, explicit devDependency inclusion before build, tracked/staged worktree guards, private-backup/readable-build umask ordering, verified backup, fast-forward-only Git update, staged `dist` output, Nginx validation, full non-user admin snapshot preview/apply, readiness polling, and the ordering boundaries around stop/migrate/sync/swap/start.
- Validate the script with `bash -n deploy/update-production.sh`.
- Exercise the exact staged build form with `npm run build -- --outDir <temporary-dist>` so the Vite CLI override and output location are proven.
- Run `npm run check`; on the target host, the script itself must pass `nginx -t` and the readiness request before reporting success.

#### 7. Wrong vs Correct

Wrong:

```bash
git pull
npm run build
npx prisma migrate deploy
systemctl restart sigrikago
```

Correct:

```bash
sudo ./deploy/update-production.sh
```

The maintained command preserves the operation order, verified backup, staged bundle activation, configuration validation, recovery attempt, and readiness gate that the ad-hoc sequence omits.

### Scenario: Public Site Identity Metadata

#### 1. Scope / Trigger
- Trigger: adding, renaming, removing, or changing validation for a public `SiteSetting` identity field consumed by the home header or edited in admin system settings.
- Site identity settings cross shared defaults, server persistence, public/admin APIs, admin drafts, home props, deployment snapshots, and generated system-design documentation.

#### 2. Signatures
- Shared defaults: `DEFAULT_SITE_SETTINGS.homeTitle`, `homeVersion`, and legacy `homeSubtitle`.
- Admin write: `PATCH /api/admin/site-settings` with `homeVersion: string`.
- Public read: `GET /api/site-settings` returns `homeVersion: string`.
- UI boundary: `HomeScreen` passes `siteSettings.homeVersion` to `HomeHeader` as `siteVersion`.

#### 3. Contracts
- `homeVersion` is an independent setting with default `v0.1.0`; do not derive it from or alias it to `homeSubtitle`.
- Server sanitization trims `homeVersion`, limits it to 24 characters, and falls back to the shared default when input is blank.
- Admin system settings expose one single-line “项目版本号” field and remove legacy `homeSubtitle` from the editable draft.
- The home header renders only `homeTitle` plus `homeVersion`; stored `homeSubtitle` values remain readable for database and deployment compatibility but are not displayed.
- The committed admin default snapshot must include `homeVersion` so production default synchronization creates it.

#### 4. Validation & Error Matrix
- Missing stored `homeVersion` -> public reads merge the shared `v0.1.0` default.
- Blank admin `homeVersion` -> store the shared default rather than an empty visible label.
- More than 24 characters -> trim after whitespace normalization.
- Legacy database contains “测试服” in `homeSubtitle` -> preserve the row but never render or expose it in the admin system-settings draft.
- Partial PATCH changes another site field -> merge over persisted settings before sanitizing so the configured version survives.

#### 5. Good/Base/Bad Cases
- Good: an admin saves `v2.4.1`, the PATCH response updates current client settings, reload returns the persisted value, and the home header shows only `v2.4.1`.
- Base: a deployment without a stored version receives `v0.1.0` from shared defaults and default seeding.
- Bad: renaming `homeSubtitle` to `homeVersion`, because stored server or campaign copy would become a fake version label.
- Bad: hard-coding a version in `HomeHeader`, because the admin setting and public API would no longer be authoritative.

#### 6. Tests Required
- `server/siteSettings.test.js` asserts the shared default, default upsert, trim/length limit, and partial PATCH preservation.
- `server/adminRoutes.test.js` asserts the configured version survives an admin write/read round trip.
- `src/admin/AdminSiteSettings.test.jsx` asserts legacy subtitle data is absent from the editable draft while `homeVersion` remains.
- `src/home/HomeScreen.test.jsx` asserts the configured version renders and legacy subtitle copy does not.
- `server/adminDefaultSeed.test.js` asserts the deployment snapshot includes `homeVersion`.
- Run `npm run docs:system-design`, targeted tests, browser checks for desktop and portrait mobile, and `npm run check` when unrelated snapshot drift does not block it.

#### 7. Wrong vs Correct

Wrong:

```jsx
<span>{siteSettings.homeSubtitle || "测试服"}</span>
```

Correct:

```jsx
<HomeHeader siteTitle={siteSettings.homeTitle} siteVersion={siteSettings.homeVersion} />
```
