# Structured Skill Description Contract

## Scenario: Persisted trait glossary and structured overclock presentation

### 1. Scope / Trigger

- Trigger: changing `SkillTrait`, skill-description text, base or derived overclock presentation, the admin character description editor, or any player surface that parses `【name】` tokens.
- This is a cross-layer content contract. Trait text may explain gameplay, but it must never become an input to skill availability, turns, uses, targeting, cost settlement, or effects.

### 2. Signatures

- Database: `SkillTrait { id, name @unique, definition, sortOrder, createdAt, updatedAt }`.
- Public API: `GET /api/skill-traits -> { traits: Array<{ id, name, definition, sortOrder }> }`.
- Admin API:
  - `GET /api/admin/skill-traits -> { traits: Array<Trait & { references }> }`
  - `POST /api/admin/skill-traits { name, definition, sortOrder } -> { trait }`
  - `PATCH /api/admin/skill-traits/:id { name, definition, sortOrder } -> { trait }`
  - `DELETE /api/admin/skill-traits/:id -> { trait }`
- Reference payload: `{ characterId, characterSlug, characterName, skillType: "base" | "derived", skillId, skillName }`.
- Description token: exact `【name】`, stored directly in `CharacterSkill.description` or `paramsJson.derivedSkills[].description`.
- Overclock display: `formatSkillOverclock(skill) -> "超频：" + (skill.costValue ?? skill.cost ?? 0)`.

### 3. Contracts

- `costType` / `costValue` are the only source for the fixed overclock label. Do not parse fixed costs from description prose. Dynamic skills such as `row-slash` and `liberty-purge` still display base `costValue = "0"`; their dynamic formulas stay in prose.
- Token order and position are author-owned. Tokens may be separated by ordinary text and are never sorted or inferred from `freeTurn`, `passive`, `effectType`, or other gameplay fields.
- Character create/update validates base and derived descriptions against the current glossary. Rename replaces exact old tokens in both locations inside the same database transaction as the glossary update.
- Referenced traits cannot be deleted. The `409` response includes `references` so the admin UI can show the blocking locations.
- The player catalog is loaded once per page lifetime. Missing catalog data or unknown historical tokens render as ordinary complete text; open player surfaces do not receive live glossary updates.
- Player trait rendering reads a stable module-level snapshot through `useSyncExternalStore`. The initial snapshot is `DEFAULT_SKILL_TRAITS`, so confirmed builtin tokens are interactive on the first render even when a mobile tooltip mounts conditionally; a successful public response atomically replaces the snapshot and notifies every mounted description.
- Only a successful `GET /api/skill-traits` result may become the cached request result. A rejected request retains the last successful snapshot or builtin fallback, clears the rejected promise, and schedules a deduplicated retry while at least one description subscribes; the last unsubscribe cancels pending retry work. Never convert a transport failure into a permanently cached empty glossary.
- Known tokens render as native inline buttons with underline, visible focus, `aria-expanded`, `aria-controls`, click/tap/Enter/Space activation, same-token toggle, other-token switch, outside-click dismissal, and Escape dismissal. Their visual contract is text-only: final theme layers must clear generic button backgrounds, borders, radii, shadows, filters, and transforms without removing button semantics. Under coarse pointers, keep the button itself at `min-height: 0` with the inherited text line height and expand only an absolutely positioned pseudo-element hit area, so touch reach never enlarges the surrounding line box.
- The fixed-position trait popover is viewport-clamped and arrowed to the activation point. In mobile room skill copy it is above the existing skill tooltip; clamp an injected finite room floating-layer base to at least `120` before the shared popover `+21` offset. Dismissing the trait layer must not dismiss the underlying skill tooltip.
- On phone-width character detail, `.character-details-modal` is the vertical scroll owner. It must use top alignment, horizontal clipping, vertical auto overflow, contained overscroll, and momentum scrolling; the final Bright School portrait layer repeats this ownership so earlier `overflow: hidden !important` rules cannot win.
- Live and replay `PlayerInfo` resolve base skill display copy from the current frontend character catalog by canonical character ID; embedded room/replay `characterConfig` is only a fallback when the catalog lacks that character. Active derived skills preserve runtime uses, source, and spent state while current catalog `params.derivedSkills[]` wins for matching `effectType` name, description, and fixed overclock display.
- Builtin description migration is idempotent and conservative: require both the builtin character slug and effect type, replace only listed exact fragments, and preserve unmatched admin prose.
- Bare numeric overclock fragments are removable only as a complete description suffix. Never substring-match a configured value inside another value; for example, migration value `3` must preserve custom prose containing `超频：30`.

### 4. Validation & Error Matrix

- Empty name -> `400 特性词名称不能为空`.
- Name longer than 8 Unicode code points -> `400 特性词名称最多 8 个字符`.
- Name contains `【` or `】` -> `400 特性词名称不能包含【或】`.
- Empty definition -> `400 特性词释义不能为空`.
- Duplicate trimmed name -> `409 特性词名称已存在`.
- Unknown `【name】` in a base or derived description -> character save returns `400` naming the skill and token.
- Duplicate token in one description -> character save returns `400` naming the skill and token.
- Delete with references -> `409` plus the full `references` array.
- Public glossary load failure or unknown historical token -> no thrown render error; keep the original bracketed text.
- Transient public glossary request failure -> keep confirmed builtin tokens interactive from the synchronous fallback, retain any last successful remote snapshot, and retry without a page reload.

### 5. Good / Base / Bad Cases

- Good: `【禁先】【疾走】正文` renders two independently focusable tokens in authored order, while gameplay still reads the existing `double-move` fields.
- Good: a replay with stale `characterConfig` and derived-skill state renders current catalog trait tokens while preserving the replayed derived use/source state.
- Good: the first mobile skill-tooltip render after a transient glossary `503` exposes `【疾走】` as a button immediately, opens its fallback definition, and later adopts the recovered remote snapshot.
- Good: renaming `疾走` to `迅行` updates base descriptions, derived JSON descriptions, the glossary row, and the audit entry in one transaction.
- Base: `普通正文【疾走】后文` is valid even though the token is not first.
- Base: `【历史词】正文` stays readable when the glossary does not contain `历史词`.
- Bad: deriving `【疾走】` from `freeTurn`, because display content would then silently change with gameplay configuration.
- Bad: matching migration rows only by `effectType`, because an admin-created character may reuse a builtin effect with custom prose.
- Bad: removing `超频：3` with an unrestricted substring replacement, because it corrupts custom `超频：30` prose.
- Bad: closing both the trait popover and mobile skill tooltip from the same outside pointer event.
- Bad: passing an embedded room character object into `findCharacter()` for skill-copy display when a current catalog entry exists, because stale snapshots can hide newly migrated trait tokens.
- Bad: relying on early `all: unset` alone for trait buttons under Bright School, because later generic `button !important` rules can restore card-like chrome.
- Bad: giving an inline trait button `min-height: 44px` under coarse pointers, because that touch target participates in inline layout and expands every line containing a token.
- Bad: trusting the incoming room floating-layer value directly, because a value such as `91` leaves the portal popover below the mobile skill-detail shell at `120`.
- Bad: placing mobile character-detail scrolling only on inner copy, because the fixed modal shell can still clip the whole layout before the inner region becomes reachable.
- Bad: initializing each conditionally mounted mobile `SkillDescription` with `[]`, because the visible token is briefly ordinary text even when a shared request has already resolved.
- Bad: catching a glossary request error as `[]` before caching the promise, because one transient failure disables every token for the rest of the page lifetime.

### 6. Tests Required

- `server/skillTraits.test.js`: validation, base/derived reference scanning, transactional rename, protected delete, exact builtin migration including numeric-prefix preservation, and runtime schema guard.
- `server/schemaIntegrity.test.js`: Prisma model, migration table/index, and runtime guard.
- `server/adminDefaultSeed.test.js` and `scripts/export-admin-default-snapshot.test.js`: stable default IDs and snapshot round-trip.
- `server/publicRoutes.test.js` and admin route tests: public/admin route shapes and error detail propagation.
- `src/shared/SkillDescription.test.jsx`: known/unknown parsing, authored order, structured overclock first line, same-token toggle, token switching, keyboard activation, top-layer dismissal, and viewport placement.
- `src/room/PlayerInfo.test.js` and `src/shared/derivedSkills.test.js`: current catalog copy wins over stale live/replay base and derived snapshot copy while runtime derived state survives.
- Bright School CSS contract tests plus computed-style browser QA: trait tokens keep transparent background, zero border/radius/padding, no shadow/transform, visible underline, `min-height: 0`, and the same line height as adjacent text after the final theme layer.
- `src/room/PlayerInfo.dom.test.jsx`: opening a trait from the mobile skill tooltip leaves that tooltip mounted and clamps `--room-floating-z` to `120`; real-browser QA verifies computed popover z-index is above the tooltip and the popover wins hit testing.
- `src/app/skillTraitCatalog.test.js`: the snapshot starts with stable builtin traits, a rejected first request is not cached as success, retry is deduplicated and stops without subscribers, and a recovered response replaces the snapshot and notifies subscribers.
- `src/shared/SkillDescription.test.jsx` and `src/room/PlayerInfo.dom.test.jsx`: confirmed builtin tokens are buttons on the first render and can be activated immediately after opening the mobile skill tooltip without waiting for an async query.
- `src/modals/HouseModal.test.js` plus real-browser mobile QA: the character-detail shell reports `scrollHeight > clientHeight`, computed `overflow-y: auto`, and changes `scrollTop` after user scrolling.
- `src/admin/AdminCharacters.test.jsx`: cursor insertion and duplicate prevention for base/derived editors.
- `src/modals/HouseModal.test.js` and `src/room/PlayerInfo.test.js`: detail badges, battle overclock line, and room tooltip wiring.
- Run `npm run check`, `npm run verify:battle-fixes`, and targeted `verify:stability` when room skill presentation CSS changes.

### 7. Wrong vs Correct

Wrong:

```js
const traits = skill.freeTurn ? ["疾走"] : [];
const overclock = description.match(/超频：(\d+)/)?.[1];
```

Correct:

```js
const traits = extractSkillTraitReferences(skill.description);
const overclock = formatSkillOverclock(skill);
// Traits are content references; costValue remains the structured display authority.
```

Wrong:

```js
if (skill.effectType === "double-move") migrateDescription(skill.description);
```

Correct:

```js
if (character.slug === "changli" && skill.effectType === "double-move") {
  migrateOnlyKnownExactFragments(skill.description);
}
```

Wrong:

```js
const [traits, setTraits] = useState([]);
if (!cachedPromise) cachedPromise = loadCatalog().catch(() => []);
```

Correct:

```js
const traits = useSyncExternalStore(subscribeCatalog, getCatalogSnapshot);
// Start from DEFAULT_SKILL_TRAITS; cache only successful responses and retry failures.
```
