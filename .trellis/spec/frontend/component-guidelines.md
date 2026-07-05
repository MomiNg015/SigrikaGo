# Component Guidelines

> How components are built in this project.

---

## Overview

<!--
Document your project's component conventions here.

Questions to answer:
- What component patterns do you use?
- How are props defined?
- How do you handle composition?
- What accessibility standards apply?
-->

(To be filled by the team)

---

## Component Structure

<!-- Standard structure of a component file -->

(To be filled by the team)

## UI Primitive Layer

Tailwind migration primitives live under `src/ui/primitives/`. They are the handoff layer between feature components and prefixed `tw:` utilities.

Required patterns:

- Keep primitive class composition centralized through `src/ui/classNames.js` unless the helper becomes insufficient enough to justify a dependency.
- Keep primitive variants semantic and small. A feature component should consume a primitive or local domain wrapper such as `AdminTableScroll` instead of owning repeated raw `tw:` utility strings.
- Preserve native element semantics. For example, a primitive that renders a button must still render a real `button`, and disabled states must use the native `disabled` attribute.
- Start primitives on low-risk admin/tooling or non-gameplay surfaces. Do not use the primitive layer as permission to migrate room board geometry, Pixi canvas hosts, skill presentation, Bright School final mobile safety, or mobile gameplay controls.
- Add focused tests for each primitive and for the first feature consumer that proves the feature consumes the primitive rather than retaining raw utility strings.

Current primitives:

- `src/ui/primitives/ScrollArea.jsx` centralizes `tw:max-w-full` and `tw:overflow-x-auto`; `src/admin/adminComponents.jsx` wraps it as `AdminTableScroll` so admin table shells keep the `.admin-table-wrap` visual contract while feature components stop owning overflow utilities or the raw wrapper class.
- `src/ui/primitives/Badge.jsx` centralizes `tw:inline-flex`, `tw:items-center`, and `tw:justify-center`; `src/admin/adminComponents.jsx` wraps it as `AdminStatusPill` while existing admin CSS still owns status badge colors, borders, spacing, and typography.
- `src/ui/primitives/EmptyState.jsx` centralizes `tw:text-center`, `tw:px-3`, and `tw:py-6`; `src/admin/adminComponents.jsx` wraps it as `AdminTableEmpty` for admin table cells while existing admin CSS still owns muted text color and the `.admin-table-empty` visual contract. Do not use this pilot as permission to migrate player-facing `quiet-text`, modal empty states, or Bright School repaired empty states.
- `src/ui/primitives/Button.jsx` centralizes only visually equivalent action alignment utilities: `tw:inline-flex`, `tw:items-center`, `tw:justify-center`, and `tw:gap-2`; `src/admin/adminComponents.jsx` wraps it as `AdminActionButton` so admin features use semantic `primary`, `secondary`, and `danger` variants while existing CSS still owns `.primary-action`, `.secondary-action`, `.danger-action` colors, borders, disabled states, shadows, padding, and typography. Do not use this pilot as permission to restyle player-facing buttons or gameplay controls.

Current Phase 4 domain wrappers:

- `src/modals/modalComponents.jsx` wraps `Button` as `ModalActionButton` for shared modal action rows. It maps semantic modal variants back to existing `.primary-action`, `.secondary-action`, and `.danger-action` visual classes while the primitive owns only alignment utilities. The first consumers are `ConfirmModal` in `src/modals/FeedbackModals.jsx`, the submit action in `src/modals/MessageBoardModal.jsx`, simple retry/load-more secondary actions in `src/modals/AnnouncementModal.jsx`, the save action in `src/modals/PersonalizationModal.jsx`, the mailbox attachment claim action in `src/modals/MailboxModal.jsx`, the duel-mode cancel action in `src/modals/friends/FriendsOverlays.jsx`, and the profile report submit action in `src/modals/UserProfileCard.jsx`. Do not use this pilot as permission to migrate story-player choices, announcement tabs/list rows, personalization picker option grids, mailbox list rows/delete controls, friends match-mode option buttons, profile confirm panels, profile social action buttons, commerce cards, recruitment board actions, gacha controls, Bright School repaired modal surfaces, or mobile gameplay controls without focused tests and visual checks.

Current Phase 5 domain wrappers:

- `src/home/homeComponents.jsx` wraps `Button` as `HomeActionButton` for home-flow action rows. It maps semantic home variants back to existing `.primary-action`, `.secondary-action`, and `.danger-action` visual classes while the primitive owns only alignment utilities. The first consumer is the match-mode picker cancel action in `src/home/HomeScreen.jsx`. Do not use this pilot as permission to migrate match-mode option buttons, home entry cards, home utility entries, player plaque art, shop/warehouse/recruitment cards, or gameplay controls without focused desktop/mobile tests and visual checks.

Current Phase 6/7 contracts:

- Phase 6 currently provides Tailwind semantic tokens for existing Bright School variables only. Primitives may consume those tokens later, but this does not authorize changing Bright School owner selectors, rule values, or theme import order.
- Phase 7 currently registers `mobile-adaptive.css` as a final-guard reduction candidate only. Component wrappers must own both desktop and mobile behavior before any final mobile rule is removed or migrated.

---

## Props Conventions

<!-- How props should be defined and typed -->

### Scenario: User Identity Nameplate Scaling Contract

#### 1. Scope / Trigger
- Trigger: any change to `UserIdentity`, username/nameplate CSS, achievement personalization previews, leaderboard names, room member names, or home player plaques.
- Username nameplates are a visual identity surface. Their size must be stable within each scene and must not depend on the username string length.

#### 2. Signatures
- `UserIdentity({ user, name, className, compact, showNameplate })` renders title, badge, and username nameplate cosmetics.
- Equipped nameplate data is read from `user.achievementEquipmentAssets.nameplate.imageUrl`.
- CSS scale is controlled by `--user-nameplate-scale`.
- The shared base nameplate is `--user-nameplate-base-width: 96px` and `--user-nameplate-base-height: 25.6px`, a `3.75:1` ratio.

#### 3. Contracts
- Do not emit inline font-size styles based on username length. The old `--user-identity-fit-font-size` behavior is forbidden.
- Without an equipped nameplate, the username stays ordinary natural-width text.
- With an equipped nameplate, `.user-identity.has-nameplate .user-identity-name-tag` uses the fixed `3.75:1` slot, centers the username, and reserves fixed scaled horizontal padding.
- Nameplate backgrounds may use the shared `--user-nameplate-font-size: calc(15px * var(--user-nameplate-scale))` so text and background scale together. Do not make that font size depend on username length.
- Scene and viewport adaptation belongs in CSS via `--user-nameplate-scale`; do not use `ResizeObserver`, string measurement, or per-name JavaScript sizing.
- Title and badge remain outside the nameplate background. The nameplate background wraps only the username.
- Nameplate artwork should be delivered at `3.75:1`; existing PNGs may be alpha-trimmed and resampled to that ratio before use.

#### 4. Validation & Error Matrix
- Two-character CJK username and eight half-width Latin username in the same scene -> same rendered username font size and same nameplate dimensions when equipped.
- Equipped usernames may render with the shared nameplate font size, while unequipped usernames keep the scene font size.
- Narrow mobile room/member surface -> reduce `--user-nameplate-scale`; do not shrink based on the actual username.
- Extreme or legacy overlong username -> keep the fixed slot and allow the text span to ellipsize as the final fallback.
- `showNameplate={false}` -> no nameplate background or fixed nameplate slot is applied.

#### 5. Good/Base/Bad Cases
- Good: `.home-player-plaque .user-identity { --user-nameplate-scale: 1.12; }`.
- Base: ordinary users without a nameplate render natural-width text.
- Bad: calculating display width in React and writing `style={{ "--user-identity-fit-font-size": "0.86em" }}`.
- Bad: defining per-surface arbitrary nameplate text sizes instead of the shared `--user-nameplate-font-size` contract.
- Bad: stretching the equipped nameplate tag to `width: 100%` of every parent container.
- Bad: reintroducing a left/center/right three-DOM-slice nameplate.

#### 6. Tests Required
- `src/shared/UserIdentity.test.jsx` asserts username length does not create inline font-size variables.
- `src/styles/hudComponents.test.js` asserts the shared fixed-ratio nameplate variables and scale hooks.
- Home, leaderboard, profile, or room CSS tests should assert scene-specific scale and high-specificity theme overrides when those surfaces are changed.

#### 7. Wrong vs Correct

Wrong:

```jsx
const fitFontSize = userIdentityFitFontSize(displayName);
return <span style={{ "--user-identity-fit-font-size": fitFontSize }} />;
```

Correct:

```css
.user-identity.has-nameplate .user-identity-name-tag {
  width: var(--user-nameplate-width);
  height: var(--user-nameplate-height);
}

.room-person-name .user-identity {
  --user-nameplate-scale: 0.76;
}
```

### Scenario: Player Accent Typography Contract

#### 1. Scope / Trigger
- Trigger: any player-facing change that displays chess clock numbers, rating values, short display labels, or site/home branding.
- The current accent font only covers Latin letters and digits, and is an art font. It must stay opt-in and must not become the default UI, form, chat, admin, or username font.

#### 2. Signatures
- Font asset: `public/assets/fonts/WuWa-Lahai-Roi-Regular.ttf`.
- CSS family alias: `"Sigrika Accent Latin"`.
- Semantic tokens: `--font-display-accent` for atmospheric labels and `--font-numeric-accent` for clock/rating values.
- Semantic classes: `.text-display-accent`, `.text-clock-value`, `.text-rating-value`.

#### 3. Contracts
- `@font-face` must use a Latin/digit `unicode-range` only: digits `U+0030-0039`, uppercase `U+0041-005A`, and lowercase `U+0061-007A`.
- Chess clock countdown digits must use `.text-clock-value` through `TimeBar`, covering desktop, mobile, spectator, replay, main-time, byo-yomi, and final byo-yomi surfaces.
- Player-visible rating values must use `.text-rating-value`, including room player cards, room member list, profile/resume stats, leaderboard rows, duel request challenger rating, and result rating deltas.
- `.text-display-accent` is allowed only for player-side atmosphere/brand/short display labels such as the login `SigrikaGo` brand subtitle, home brand title, match-mode watermark English labels, or locked placeholder chrome.
- Do not apply the accent classes to usernames, `UserIdentity`, admin screens, chat, announcements/body/rules copy, form inputs, coins/prices/stock/probability/game counts/win-loss stats/room codes/move counts/dates/timestamps, or leaderboard rank positions.
- The accent classes must use `text-transform: uppercase` so lowercase Latin text displays as the art font's uppercase letterforms while the source strings and data remain unchanged.
- Bright School main-time clock digits must stay dark `#1c171a`, not gray, while byo-yomi and final byo-yomi keep their warning colors.
- In mobile room player strips, the final post-theme guard must keep `.mobile-room-screen .timer .text-clock-value .timer-primary` compact at `min-width: 3.2ch` and `font-size: clamp(14px, 4vw, 16px)`, with `.timer-periods` at `font-size: clamp(9px, 2.8vw, 10px)`, so the timer track remains inside the strip after the accent font loads.

#### 4. Validation & Error Matrix
- Missing accent font asset -> fail style contract tests before shipping.
- New clock numeric surface without `.text-clock-value` -> invalid; route through `TimeBar` or add the class explicitly.
- New player rating display without `.text-rating-value` -> invalid, unless the surface is admin-only.
- New coin/price/stock/count/rank-position display with `.text-rating-value` -> invalid because those numbers are not rating.
- Accent applied to `UserIdentity` or a username container -> invalid because usernames must keep the identity/nameplate font contract.
- Future font replacement -> update the token value and asset alias; do not rename the semantic classes to the font's display name.

#### 5. Good/Base/Bad Cases
- Good: `<div className="timer-digits text-clock-value">`.
- Good: `<b className="text-rating-value">{player.rating}</b>`.
- Good: `.text-rating-value { font-family: var(--font-numeric-accent), var(--font-ui-default); }`.
- Base: Chinese text inside an accented label falls back to `--font-ui-default` because the font only covers Latin/digits.
- Bad: setting `body { font-family: "Sigrika Accent Latin"; }`.
- Bad: adding `.text-rating-value` to coins or leaderboard `#1` rank labels.

#### 6. Tests Required
- `src/styles/styleContract.test.js` must assert the font asset, `@font-face`, unicode range, tokens, semantic classes, tabular numeric font variant, and uppercase visual transform in the base and final guard layers.
- `src/styles/styleContract.test.js` must assert the final Bright School main-time clock color is `#1c171a`, not a gray fallback.
- `src/room/TimeBar.test.js` or a room panel test must assert `timer-digits text-clock-value`.
- `src/room/RoomScreen.test.js` must assert the Bright School mobile strip compact art-font timer override so mobile digits cannot inherit desktop clock sizing.
- Player rating surfaces changed in this scenario need focused markup/source tests asserting `.text-rating-value`, including leaderboard, profile/resume, room member/player panels, duel request, and result modal reward values.
- Home/house display chrome tests should assert `.text-display-accent` only on allowed atmosphere labels such as mode picker watermark labels, not usernames or plaque ranks.

#### 7. Wrong vs Correct

Wrong:

```jsx
<body className="wuwa-font">
  <UserIdentity user={user} />
  <span>{user.coins}</span>
</body>
```

Correct:

```jsx
<b className="text-rating-value">{player.rating}分</b>
<span className="match-mode-watermark-label text-display-accent">STANDARD MODE</span>
<div className="timer-digits text-clock-value">{displayValue}</div>
```

### Scenario: Game Mode UI Contracts

#### 1. Scope / Trigger
- Trigger: any component that starts matchmaking, renders a room, shows leaderboard/watch/history data, or displays duel requests.
- Mode UI is a shared product contract across desktop and mobile, so components must not hard-code mode copy or ordering locally.

#### 2. Signatures
- Import mode facts from `src/shared/gameModes.js`.
- UI mode ids are `spark`, `standard`, and `gomoku`.
- Mode option order must use `modeOrderedEntries()` so `spark` appears before `standard`, then `gomoku` appears after the Go modes.
- Mode visual metadata must come from `src/shared/gameModes.js`: each mode owns `iconUrl` and `englishLabel` for decorative mode icons and WuWa-backed English labels.
- Room controls receive `game.skillEnabled !== false` or equivalent normalized mode state.
- Board components receive `game.size` and expose it as `--size` on the shared board wrapper so intersections, labels, star points, and click targets use one board-size source.

#### 3. Contracts
- Home match entry opens a mode picker before emitting `match:join`; it must render every mode returned by `modeOrderedEntries()`.
- Home match-mode picker buttons must keep the ordinary Chinese title, rules copy, and waiting-count chip in their existing content flow. Decorative mode icons and English labels belong in a centered, pointer-transparent watermark layer using `mode.iconUrl` plus `mode.englishLabel`, with the watermark at 50% desktop opacity and 20% mobile opacity so it cannot replace or obscure the actionable copy.
- Bright School final button-child reset layers must reassert `.match-mode-option > .match-mode-watermark { transform: translate(-50%, -50%) !important; }` after any `button > * { transform: none !important; }` rule, otherwise the absolute-positioned watermark starts at the button center and appears lower-right clipped.
- Duel requests open the same mode picker before emitting `duel:request`; incoming request UI must show the selected mode title and rules text.
- Mode tabs are required for leaderboard, watch list, profile/detail, and record/history views. These tabs must use each mode's `shortTitle`, stay in one non-wrapping row, and allocate the three current modes across one line.
- Home player plaques render compact three-column mode stat rows from `modeOrderedEntries()`: spark icon/rank first, standard icon/rank second, gomoku icon/rank third. Do not render rating points on the plaque, do not collapse the stats back into a single global rank/rating pair, and do not show recent-result markers on the plaque.
- No-skill room UI must omit skill action buttons, both player skill labels, skill names, removal labels, and overclock labels. Gomoku additionally hides Go-only pass/counting/dead-stone controls and capture/removal/overclock info chips.
- Standard scoring copy must omit overclock/skill-cost descriptions and use black komi `3.75`.
- Coordinate labels must grid with `repeat(var(--size), minmax(0, 1fr))`; do not leave coordinate rows or columns hard-coded to 13 tracks.

#### 4. Validation & Error Matrix
- Missing `game.mode` -> render as `spark`.
- Missing `game.skillEnabled` -> assume skills enabled for legacy rooms.
- `standard` or `gomoku` with accidental skill state -> UI must still hide skill controls when `skillEnabled === false`.
- Standard board actions on points such as `18,18` must be accepted by the backend because point validation uses the room game's size, not the legacy 13-line default.
- Mobile mode controls -> keep 44px-plus touch targets; mode tabs must not wrap Chinese labels, and tab surfaces should show `五子棋` instead of the longer Gomoku entry copy.

#### 5. Good/Base/Bad Cases
- Good: `ActionBar` receives `skillEnabled={displayRoom.game.skillEnabled !== false}` and conditionally renders the skill button.
- Base: old replay snapshots with no mode continue through spark defaults.
- Bad: checking only `mode === "standard"` in one component while another component uses a separate hard-coded board size or komi.
- Bad: rendering a 19-line board while `.coord-row` still uses `repeat(13, 1fr)`, which makes labels drift away from intersections.

#### 6. Tests Required
- Home mode picker renders every shared mode, per-mode waiting count, and the centered pointer-transparent icon plus English watermark without removing the Chinese title/rules/count content.
- Match/join socket payload includes selected mode.
- Standard room state renders 19-line board star points and no skill UI; gomoku room state renders the 13-line board with the spark star points, no skill UI, and no Go-only controls.
- Standard room accepts moves at the 19-line edge, gomoku rejects pass/skill actions, and Board CSS tests assert coordinate rows/columns use `var(--size)`.
- Gomoku decisive five-in-row results expose `game.winner.winningLine` with the five highlighted point ids. `Board` renders those stones with a persistent point-local `.gomoku-winning-line` gold effect in live rooms and replay snapshots; the effect stays pointer-transparent and includes a reduced-motion fallback.
- Leaderboard/watch/profile-detail/history fetches or filters by selected mode and render three one-line tabs with short labels.
- Home plaque tests assert `plaque-mode-stat-spark`, `plaque-mode-stat-standard`, and `plaque-mode-stat-gomoku` render shared mode icons plus stored ranks, while rating text is absent and recent result markers stay limited to profile/history detail surfaces.
- Friend duel request payload and incoming banner include mode.

#### 7. Wrong vs Correct

Wrong:

```jsx
<button onClick={startMatch}>开始匹配</button>
```

Correct:

```jsx
{modeOrderedEntries().map((mode) => (
  <button key={mode.id} className="match-mode-option" onClick={() => startMatch(mode.id)}>
    <span className="match-mode-watermark" aria-hidden="true">
      <img className="match-mode-watermark-icon" src={mode.iconUrl} alt="" />
      <span className="match-mode-watermark-label text-display-accent">{mode.englishLabel}</span>
    </span>
    <span>{mode.title}</span>
    <small>{mode.rulesText}</small>
  </button>
))}
```

### Scenario: Board Skill Presentation Contract

#### 1. Scope / Trigger
- Trigger: any change to active skill preview payloads, room board rendering, skill banners, or board animation layers.
- The board skill presentation spans backend room snapshots, shared timing constants, React board markup, PixiJS canvas effects, ambient board effects, and SFX timing.

#### 2. Signatures
- `game.pendingSkill`: `{ id, characterId, skillName, effectType, targetId, affectedPointIds, markedPointIds, removed, removedByColor, resolvesAt, bannerDurationMs, boardEffectDurationMs }`.
- `SKILL_EFFECT_CATALOG`: shared `effectType` metadata in `src/shared/skillEffectCatalog.js`, including admin labels, default target rules, active/passive classification, board-effect availability, and sound cue timing.
- `skillEffectPresentation(effectType, options)` and `skillEffectTimeline(pendingSkill, options)` live in `src/shared/skillPresentation.js`; this is the shared presentation configuration entry for timeline, Pixi/DOM/SFX layer capability, and the future all-effects-off switch.
- `BoardSkillEffects`: receives `boardSize={game.size}`, `pendingSkill={game.pendingSkill}`, and optional `audioSettings`.
- `SkillBanner`: receives the same pending-skill preview shape and must pass `banner.effectType` as `params.effectType` when resolving or playing `SYSTEM_VOICE_EVENTS.skillCast`.
- `SYSTEM_VOICE_SKILL_EVENTS`: shared effect-specific voice event keys such as `skill-cast:voyage-star`.
- `scripts/export-skill-gifs.mjs`: local-only skill preview exporter; CLI surface stays `--character`, `--effect`, `--output-name`, `--size`, `--fps`, `--target`, and `--theme black|board`.
- `schedulePixiPrewarm({ enabled })` and `loadPixiModule()` live in `src/room/pixiPrewarm.js`; both prewarm and live board effects must share the same Pixi import promise.
- `preparePixiEffect()` lives in `BoardSkillEffects.jsx`; it starts the live Pixi app initialization and per-renderer asset preload during the skill banner window, before the board-effect timer fires.
- `BOARD_SKILL_EFFECT_RENDERERS`, `boardSkillEffectAssetUrls()`, and `playRegisteredBoardSkillEffect()` live in `src/room/boardSkillEffectRegistry.js`; concrete Pixi board animations and their preloadable image assets must register by `effectType` there instead of growing `BoardSkillEffects.jsx`.
- Board visuals that need only persistent DOM/CSS markers may keep `SKILL_EFFECT_CATALOG[effectType].boardEffect === false`; `BoardSkillEffects` then returns `null` for those active previews so no full-board overlay layer or Pixi canvas can cover the grid. QiuYuan `row-slash` is the exception: it uses a short full-board Pixi cast for transient white/teal ink-blade motion, while `BoardRowSlashOverlay` and the `row-slash` keyframes still own the persistent row scar.
- `game.rowEffects`: DOM/CSS row markers shaped as `{ effectType: "row-slash", owner, clearAfterColor, y, id }`; `clearAfterColor` is the color whose next action clears the marker.
- Lynae `spray-stone` history entries carry `randomTargetId`, `transformed`, `immediateRemovals`, and `cleanupRemovals`; replay reconstruction must use the recorded random target instead of calling the live random selection path again.
- ChangLi `double-move` has two presentation layers: the cast phase is a full-board Pixi effect registered as `BOARD_SKILL_EFFECT_RENDERERS["double-move"]`, while the resolved placements persist on board points as `point.skillEffect = "double-move-stone"` plus `point.skillEffectOwner = color`; `Board` renders the class on the point so the stone can carry a persistent DOM/CSS flame halo after the Pixi overlay is gone.
- `--board-wood-texture`: shared `.board-wrap` surface background; late theme guard layers must reference the variable instead of duplicating independent board texture stacks.
- `boardPointCenter()` and `pointCenterForHost()` live in `src/room/boardSkillEffectGeometry.js` so component tests and animation renderers share one board-size-aware coordinate contract.
- `BoardAmbientEffects`: receives derived passive state such as active Nabomo color illusion and renders non-interactive ongoing board ambience.
- `scheduleBoardSkillEffectSounds({ pendingSkill, durationMs, reducedMotion, audioSettings })` and `clearBoardSkillEffectSoundTimers(timerIds)` live in `src/room/boardSkillEffectSoundScheduler.js`; the React host should call these helpers instead of manually mapping cue timers.
- `playSkillEffectSound(effectType, cue, audioSettings)`: presentation-only SFX helper for `start` and `impact` animation cues.
- `boardPointCenter(pointId, { boardSize, width, height })`: maps a board point id to a pixel center in the current board viewport.

#### 3. Contracts
- `Board` keeps DOM/SVG as the interaction source of truth; PixiJS is presentation-only.
- The effects canvas and ambient layers must use `pointer-events: none` and must not replace point buttons, scoring marks, move numbers, coordinates, or skill targeting classes.
- Board effects start after `bannerDurationMs`, not when the banner first appears. Pixi module loading, app initialization, and renderer image asset loading should begin during the banner window so the first visible board-effect frame appears immediately after the banner ends.
- Skill banner voices must resolve effect-specific `skill-cast:<effectType>` assets before falling back to the character's generic `skill-cast` voice. Derived skills such as Aemeath `voyage-star` can therefore have a dedicated voice while the base character skill keeps its ordinary voice.
- Skill GIF capture must use Playwright virtual time for frame sampling. The exporter may use an internal prep-only `bannerDurationMs` to let the real Board/BoardSkillEffects path load Pixi or DOM layers before the cast starts, but screenshots must advance `page.clock` by one frame per capture; do not schedule screenshots from `Date.now()` or wall-clock waits because slow screenshot I/O compresses the real animation into a faster GIF.
- `BoardSkillEffects` must ask `src/shared/skillPresentation.js` whether presentation is enabled before scheduling Pixi prewarm, rendering the overlay host, mounting a Pixi app, or scheduling board-effect SFX.
- Skill-enabled boards may schedule idle Pixi prewarm after the board mounts, but this prewarm must not block board rendering, preload screens, room entry, or standard no-skill rooms.
- If a live Pixi effect is still preparing when the board-effect phase begins, `BoardSkillEffects` may expose the existing `data-effect-fallback="true"` pulse briefly, then replace it with the real Pixi renderer as soon as preparation completes. Do not leave a visually empty post-banner gap.
- Aemeath `hidden-hand` is a full-board effect: green electronic data streams move from the board edge toward the center, flash with white light, then dissipate outward/away without depending on a point-local impact.
- Nabomo `color-illusion-passive` has ongoing gray/white board ambience while any color illusion passive is active; render it through `BoardAmbientEffects` as a pointer-transparent center-out CSS activation wave and through `.board-wrap.color-illusion-board-surface::before` as a center-out transition into `/assets/boards/nabomo-color-illusion-board.webp`, keep that background visible until the passive ends, avoid Pixi/ticker-based persistent ambience for this passive, and keep stones/intersections readable.
- Board SFX must be scheduled from the same board effect timeline, use the existing `sfx` volume channel, and clean up timers with the Pixi overlay.
- Board SFX timer mapping and cleanup belong in `boardSkillEffectSoundScheduler.js`; `BoardSkillEffects.jsx` should not duplicate cue math or timer iteration.
- The backend must derive animation metadata from the already-resolved skill action, not by recomputing skill rules.
- Replay reconstruction is rules execution for historical display, not a new live action. Any skill whose live resolution depends on randomness or pre-resolved metadata, including Lynae `spray-stone` and Baconbits `random-blast`, must replay from the history entry's recorded target ids.
- Admin character options, backend character validation, skill normalization, board target preview, active skill type lists, server fallback skill config, and board skill SFX cue timing must read shared effect metadata from `src/shared/skillEffectCatalog.js` instead of each keeping a local `effectType -> targetRule/label/cue` table.
- Every catalog entry with `boardEffect: true` must have a matching `BOARD_SKILL_EFFECT_RENDERERS` entry; unknown effect types should no-op without touching the Pixi stage.
- Effects that draw their persistent visual through React DOM/CSS generally should not be registered as Pixi `boardEffect` entries unless the Pixi renderer is strictly transient, pointer-transparent, and tested to leave the persistent DOM owner intact. A full-size Pixi canvas can become an opaque overlay in some browser/runtime paths and hide the board grid, star points, and stones if the renderer draws persistent visuals or opaque backgrounds.
- Persistent point-local visuals such as Mornye `protocol-takeover` and ChangLi `double-move-stone` belong on the existing point/stone DOM nodes. They must remain pointer-transparent and respect reduced motion. A transient cast-phase animation may still be a `BoardSkillEffects` Pixi renderer when the catalog marks that skill with `boardEffect: true`, as Mornye `protocol-takeover` and ChangLi `double-move` do.
- QiuYuan `row-slash` is visible only until the opponent's next action. Store `clearAfterColor: opponent(owner)` and clear expired row effects from ordinary moves, passes, and turn-consuming skill resolution by action color, not by the row effect owner.
- Board point buttons sit above the SVG grid; shared board CSS and theme guard layers must explicitly keep `.board .point` transparent with no appearance, no border/shadow/background image, zero min-size, and `touch-action: none` so broad button rules cannot cover the grid.
- Board point buttons must be anchored by explicit center variables, not implicit grid-cell placement. `Board` writes `--board-point-center-x` and `--board-point-center-y` from `((point.x + 0.5) / boardSize) * 100%`; `.point` is absolutely positioned at those variables with `transform: translate(-50%, -50%)`, `.board .point` repeats that transform with `!important` so broad button hover/active transforms cannot replace the centering offset, and `.point::before` centers itself with its own `left/top: 50%` transform. This keeps hover/touch hints, stones, and SVG grid intersections sharing the same coordinate source. Mobile point feedback must compose scale with this centering transform, for example `translate(-50%, -50%) scale(...)`, and reduced-motion or confirming states must still keep `translate(-50%, -50%)` instead of `none`. Do not reintroduce `gridColumn/gridRow` as the visual point placement contract.
- Tutorial boards call `Board` with `stoneJitter={false}` so scripted teaching positions are exact. Ordinary live boards may keep deterministic small stone offsets for hand-placed feel, but tutorial hints, initial stones, and clicked result stones must remain centered on intersections for clarity.
- Admin visual initial-board editors must also reuse `Board` with a temporary `createGameState()` board and `stoneJitter={false}`. Do not create admin-only SVG grids, custom point buttons, custom star-point tables, or separate `--point-x/y` geometry; those drift from the real battle board and break setup accuracy on desktop and mobile.
- The board grid SVG must be treated as a gameplay layer, not ordinary media. `.board-lines` must explicitly keep `display: block`, `width/height: 100%`, `max-width/max-height: none`, and theme guard stroke/opacity rules so global `img/svg/canvas` media resets such as `height: auto` cannot collapse or wash out the grid.
- Board surface styling belongs on `.board-wrap` through `--board-wood-texture`. Bright School and other late theme repair layers may force `background: var(--board-wood-texture) !important`, but must not fork a separate board texture because those late layers override the base room surface.
- `prefers-reduced-motion: reduce` must use a short static hit effect without fly-in, scale bursts, explosions, board shake, or explosive SFX.

#### 4. Validation & Error Matrix
- Missing `pendingSkill` -> render no effect but keep the board usable.
- `game.skillEnabled === false` -> keep the board usable and pass `prewarm={false}` so standard boards do not load Pixi early.
- Skill presentation effects disabled globally -> render no board effect overlay, do not prewarm Pixi for skill effects, and do not schedule board-effect SFX.
- Missing `targetId` -> skip the Pixi effect safely.
- Unknown `effectType` -> keep the overlay inert and preserve the normal skill preview/result flow.
- `boardEffect === false` for a known effect -> render any DOM/CSS overlay separately through its dedicated component; do not render `BoardSkillEffects` markup and do not create a canvas.
- `rowEffects` contains `{ owner: "black", clearAfterColor: "white" }` and white makes any valid action -> remove that row marker from the next game snapshot.
- Muted `sfx` channel -> do not create WebAudio contexts or play board skill SFX.
- Unmounted board / route change during a skill effect -> clear scheduled SFX timers before they fire.
- Active Nabomo passive gray board background -> board clicks, touch confirmation, score marking, coordinates, and move numbers remain available because the ambience is presentation-only.
- Visible square fog boundary or persistent smoke layer -> invalid; the ambient layer should use the lightweight center-out desaturation wave and then rely on the persistent low-saturation board state.
- Standard mode with no skills -> no pending skill effect should appear.
- Restored room with `resolvesAt` in the past -> backend resolves immediately through existing pending-skill scheduling.

#### 5. Good/Base/Bad Cases
- Good: Sigrika erase, Danea flip, Aemeath hidden-hand, and Baconbits blast all route from `effectType` supplied by the room snapshot.
- Good: a skill-enabled room prewarms Pixi during browser idle time, and the first actual skill effect reuses that module promise instead of issuing a second dynamic import.
- Good: when a pending skill with a Pixi board effect appears, `BoardSkillEffects` prepares the transparent Pixi canvas and any renderer image assets during the banner window; the `setTimeout` at `bannerDurationMs` only starts playback and SFX.
- Good: adding a new effect starts by extending `SKILL_EFFECT_CATALOG`, then wiring concrete rule handlers, server preview metadata, board animation, and tests.
- Good: adding a new board animation updates `BOARD_SKILL_EFFECT_RENDERERS` and its registry test, while `BoardSkillEffects.jsx` remains the lifecycle host.
- Good: changing presentation timing, per-effect Pixi/DOM layer capability, or the global effects-enabled state is done through `src/shared/skillPresentation.js` and covered by `src/shared/skillPresentation.test.js`.
- Good: QiuYuan `row-slash` registers a full-board Pixi cast for two full-board vertical ink-brush omen slashes with deterministic -30 to 30 degree angles: the first sweeps top-to-bottom, the second bottom-to-top, both remain visible until the main slash fades out; it then plays a 1.8-cell-tall main white blade line with a low-alpha cyan-white gradient edge glow, dark teal / gray-blue ink smears, and transient cut sparks, while `BoardRowSlashOverlay` remains the DOM owner of the persistent `.board-row-slash` scar. The casting scar should overrun both board edges and reveal left-to-right with the main Pixi brush by deriving CSS `--row-slash-cast-delay` from `boardEffectDurationMs * 0.19` and `--row-slash-cast-duration` from `boardEffectDurationMs * 0.22`; while a pending casting scar exists, filter same-row `game.rowEffects` so the resolved full-length wave-shaped DOM scar cannot appear before the horizontal slash reaches it. Do not draw broad translucent light-blue bands for the omen or main slash; use layered edge-glow strokes plus irregular short Graphics strokes and dry-brush fragments for the ink-wash edge.
- Good: Mornye `protocol-takeover` plays a lavender-and-ice-blue data-light Pixi beam from the top of the board into the target point after the banner, with distinct procedural start and target-lock SFX, then the resolved point keeps the `.protocol-ban-mark` DOM/CSS marker. Good: ChangLi `double-move` plays a transparent-SVG red phoenix and irregular full-board fire Pixi cast after the banner, then normal placements set `double-move-stone` on both extra-turn stones and `Board` applies the red flame CSS class directly to each affected stone.
- Good: Danea flip visually reads as transparent bubble formation, purple-black corruption, then pop/flash before the final stone color appears.
- Good: Nabomo gray board background is driven by active passive state and continues after the passive activation banner/effect has resolved.
- Base: legacy replay skill entries without new visual metadata still replay through the rules layer.
- Bad: using `canPreviewSkillTarget` as the random-blast click eligibility gate; no-target skills must keep preview false while board confirmation remains allowed.
- Bad: calculating the random-blast center on the frontend instead of using backend `pendingSkill.targetId`.
- Bad: setting `boardEffect: true` for a DOM-only row/marker effect just to indicate that it appears on the board; this can mount a blank full-board canvas over the playable board.

#### 6. Tests Required
- Backend tests assert `pendingSkill` metadata for erase-point, flip-stone, and random-blast.
- Shared rules tests assert `erase-point` history includes `effectType`.
- Board tests assert the effects layer renders without removing point buttons.
- Effects tests assert coordinate mapping for 13-line and 19-line boards and reduced-motion timing.
- Registry tests assert every catalog `boardEffect` type has a renderer and unknown effect types no-op safely.
- Component tests assert DOM-only skill visuals render no `board-effects-layer` and do not require a Pixi renderer.
- `BoardSkillEffects` tests assert live Pixi preparation initializes the app and preloads renderer assets during the banner window, before playback begins.
- `scripts/exportSkillGifs.test.js` asserts the GIF exporter installs Playwright clock control, advances by `frameDelayMs`, and does not use a `Date.now()` screenshot pacing loop.
- Shared game tests assert QiuYuan row slash records `clearAfterColor` and clears on the opponent's next ordinary move.
- Board/CSS contract tests assert `.board .point` cannot inherit visible button chrome, `.board-lines` cannot inherit ordinary media sizing, and `row-slash` keeps a dedicated CSS animation.
- Board/CSS contract tests assert protocol-ban and double-move-stone persistent point effects have their expected glow keyframes, while shared game tests assert ChangLi's two extra-turn placements retain `double-move-stone`.
- Board/CSS contract tests assert `.board-wrap` defines `--board-wood-texture` and late Bright School guards reuse that variable.
- Replay tests assert Lynae `spray-stone` uses the history entry's `randomTargetId` so stepping through a replay cannot reroll which ordinary stone became spray.
- Pixi prewarm tests assert disabled mode does not schedule loading, cancellation prevents idle imports, and prewarm/live effect loading share one promise.
- Ambient tests assert active color illusion board background transition is pointer-transparent, avoids Pixi/fog DOM, uses the dedicated WebP background, and renders without removing board buttons.
- SFX tests assert stable cue points and muted settings avoiding AudioContext creation.
- Scheduler tests assert catalog cue timing, reduced-motion suppression, and timer cleanup.
- Catalog tests assert effect type order, admin options, default target rules, active effect lists, and SFX cues.

#### 7. Wrong vs Correct

Wrong:

```jsx
<canvas className="board" onClick={handlePoint} />
```

Correct:

```jsx
<div className="board">
  <BoardSkillEffects boardSize={game.size} pendingSkill={game.pendingSkill} audioSettings={audioSettings} />
  {game.points.map((point) => <button key={point.id} className="point" />)}
</div>
```

---

### Scenario: User Profile Social Actions

#### 1. Scope / Trigger
- Trigger: any change to `UserProfileCard`, friend/room profile overlays, profile hero layout, like/report buttons, or report dialogs.
- The profile card is reused from friends/search and room member/observer flows, so behavior and layout must stay consistent on desktop and mobile.

#### 2. Signatures
- `UserProfileCard({ user, characters, token, onOpenReplay, replayDisabled, onAddFriend, onAddBlacklist, onNotice })`.
- Profile payload fields used by the component: `id`, `relation`, `likeCount`, `likedToday`, `characterId`, `itemEffects`, `record`, `rating`, `rank`, `characterStats`, `recentResults`.
- Like mutation: `POST /api/users/${profileUser.id}/like`.
- Report mutation: `POST /api/users/${profileUser.id}/report` with `{ content }`.

#### 3. Contracts
- The portrait/username hero card owns the like/report controls. Do not move them into the footer relation-action area.
- Like is an icon button with `ThumbsUp` plus a numeric count. Report is an icon-only `CircleAlert` button. Buttons must not include text labels inside the button.
- Self profiles disable both like and report. Profiles already liked today disable only like. Blacklist relation must not disable either action unless it is also self/already-liked.
- Successful report submission closes the dialog, clears the textarea, and emits `onNotice("举报已提交", "success")` when provided.
- If no `onNotice` prop exists, local success text should not use the danger/error class.
- Mobile and desktop hero content is left-aligned with portrait in the first column, identity in the second column, and social actions anchored bottom-right.

#### 4. Validation & Error Matrix
- Missing token -> mutation handlers should no-op or rely on auth route rejection; do not optimistically change local state without a response.
- Like request fails -> keep current count/state and show error via notice/local error.
- Report request fails -> keep dialog content and show error.
- Report content empty after trim -> disable submit.
- `relation === "self"` -> disable like and report controls in markup.

#### 5. Good/Base/Bad Cases
- Good: a friends-profile success notice appears in the top toast through `onNotice`.
- Good: a room-profile report success falls back to a local success notice instead of a red error line.
- Base: profile cards without like fields render count `0` and enabled state from relation.
- Bad: rendering text such as "举报" inside the report icon button.
- Bad: centering mobile hero content, because it no longer matches the desktop profile card contract.

#### 6. Tests Required
- Static markup tests assert `profile-social-actions`, `profile-like-button`, `profile-report-button`, count rendering, and disabled states.
- Source or component tests assert like/report API paths.
- CSS contract tests assert desktop/mobile left-aligned hero grid and bottom-right social action selectors.

#### 7. Wrong vs Correct

Wrong:

```jsx
<button>举报</button>
```

Correct:

```jsx
<button className="profile-report-button" title="举报" aria-label="举报用户">
  <CircleAlert size={18} />
</button>
```

---

### Scenario: Gacha Admin Featured Prizes Contract

#### 1. Scope / Trigger
- Trigger: any change to gacha admin prize editing, gacha pool draft serialization, admin gacha API payloads, or player/admin gacha pool payload projection.
- Featured prizes are cross-layer display hints, not required prize rules. Draw odds and reward settlement must not depend on any featured prize existing.

#### 2. Signatures
- `emptyGachaPoolDraft().featuredPrizeIndexes`: `number[]`, default `[]`.
- `emptyGachaPoolDraft().featuredPrizeIndex`: `null | number`, legacy first-featured compatibility field.
- `buildGachaPoolDraft(pool).featuredPrizeIndexes`: indexes of `pool.featuredPrizeIds` / `pool.featuredPrizes` in `pool.prizes`, falling back to legacy `pool.featuredPrizeId`.
- `gachaPoolDraftToBody(draft).featuredPrizeIndexes`: `number[]`; `featuredPrizeIndex` remains `indexes[0] ?? null`.
- Admin API input `featuredPrizeIndexes`: `number[]`; empty array means clear or keep no featured prizes. `featuredPrizeIndex` is accepted only as a legacy single-value fallback.
- Gacha pool payload `featuredPrizes`: `GachaPrizePayload[]`; `featuredPrize` remains the first item or `null` for older display surfaces.

#### 3. Contracts
- The admin "大奖" control is an independent toggle per prize row, not a required radio group: clicking a selected prize removes only that prize from the featured list.
- New drafts must not silently preselect prize index `0`.
- Draft serialization sends `featuredPrizeIndexes: []` when no featured prize is selected.
- Backend validation must accept an empty array and must reject only indexes outside the prize array.
- Create/update persistence must store all selected prize ids in `featuredPrizeIds` JSON and mirror the first selected id in legacy `featuredPrizeId`; when the array is empty both fields are `null`.
- Player/admin pool payload projection must not invent the first prize as `featuredPrize` or `featuredPrizes[0]` when no featured id is stored.

#### 4. Validation & Error Matrix
- `featuredPrizeIndexes === []` -> valid, no featured prizes.
- `featuredPrizeIndexes` omitted and `featuredPrizeIndex === null` -> normalize to `[]`.
- Any featured index `< 0` -> invalid.
- Any featured index `>= prizes.length` -> invalid.
- Duplicate featured indexes -> normalize to one instance, preserving order.
- `featuredPrizeIds` missing from loaded pool but `featuredPrizeId` exists -> edit draft shows that one legacy featured prize selected.
- Stored featured ids missing from loaded prizes -> ignore missing ids without selecting another prize.

#### 5. Good/Base/Bad Cases
- Good: an admin toggles two "大奖" buttons, saves, and subsequent payloads expose both prize payloads in `featuredPrizes` while `featuredPrize` points to the first selected prize.
- Good: an admin clicks all selected "大奖" buttons again, saves, and subsequent payloads expose `featuredPrizeIds: []`, `featuredPrizeId: null`, `featuredPrizes: []`, and `featuredPrize: null`.
- Base: an existing pool with only a valid `featuredPrizeId` still shows that prize selected in the editor.
- Bad: using `featuredPrizeIndex ?? 0`, `Math.max(0, findIndex(...))`, or `prizes[0]` fallback for featured prize display.
- Bad: treating the "大奖" button as radio semantics where selecting one prize clears every other selected featured prize.

#### 6. Tests Required
- Draft helper tests assert empty and loaded no-featured pools keep `featuredPrizeIndexes: []`.
- Draft helper tests assert multiple stored featured ids serialize as multiple indexes and preserve `featuredPrizeIndex` as the first index.
- Admin component/source tests assert the featured control toggles membership rather than replacing the selected prize.
- Admin management tests assert `featuredPrizeIndexes: []` and multiple indexes validate.
- Gacha payload tests assert `featuredPrizes` returns every stored featured prize and remains empty when no featured id is stored.
- Schema tests assert `GachaPool.featuredPrizeIds` exists in Prisma schema, migration SQL, and startup schema guard.

#### 7. Wrong vs Correct

Wrong:

```js
const featuredPrizeIndex = parseIntValue(input.featuredPrizeIndex ?? 0);
const nextFeaturedPrizeIndexes = [clickedIndex];
const featuredPrize = prizes.find((prize) => prize.id === pool.featuredPrizeId) ?? prizes[0] ?? null;
```

Correct:

```js
const featuredPrizeIndexes = Array.isArray(input.featuredPrizeIndexes) ? input.featuredPrizeIndexes : [];
const nextFeaturedPrizeIndexes = currentIndexes.includes(clickedIndex)
  ? currentIndexes.filter((index) => index !== clickedIndex)
  : [...currentIndexes, clickedIndex];
const featuredPrizes = featuredPrizeIds.map((id) => prizes.find((prize) => prize.id === id)).filter(Boolean);
```

### Scenario: Gacha Result Reward Display Contract

#### 1. Scope / Trigger
- Trigger: any change to gacha draw response payloads, `GachaResultDialog`, gacha reward label helpers, or reward result CSS.
- The draw result is a cross-layer display contract: backend settlement chooses a `GachaPrize`, the immediate response carries display metadata, and the frontend result dialog renders the visual card.

#### 2. Signatures
- Immediate draw reward payload: `{ prizeId, type, targetId, quantity, unlockedQuantity, duplicateQuantity, blueGemsAdded, chainAdded, coinsAdded, name, imageUrl }`.
- `buildGachaRewardDisplay(reward)`: returns `{ name, imageUrl, fallback, detail }`.
- `GACHA_COIN_BAG_IMAGE`: local image path used for coin rewards.
- `GachaResultDialog({ result, onClose })`: adds `.ten-pull` to `.gacha-result-grid` when `result.rewards.length === 10`.

#### 3. Contracts
- Backend draw settlement must copy `prize.name` and `prize.imageUrl` into immediate reward responses; the frontend should not infer player-facing names from `targetId`.
- Coin rewards ignore empty prize images and always render `GACHA_COIN_BAG_IMAGE`.
- Non-coin rewards prefer `reward.name`; when no name exists, fall back to `gachaPrizeTypeLabel(type)`, not raw target ids.
- Reward details preserve quantities and conversions: coins show `<n> 金币`, item stacks show `x<n>`, character duplicates show `角色链 +<n>`, and decoration/music duplicates show `转换 <n> 蓝宝石`.
- Desktop ten-pull result grids use five columns so ten rewards produce two rows; smaller viewports may keep adaptive columns.

#### 4. Validation & Error Matrix
- Missing `name` on a non-coin reward -> show the localized type label.
- Missing `imageUrl` on a non-coin reward -> show the type fallback glyph.
- Coin reward with empty `imageUrl` -> still show the coin-bag image.
- Ten rewards -> add `.ten-pull`; any other count -> keep adaptive grid.

#### 5. Good/Base/Bad Cases
- Good: a reward for `rainbow-bean-candy` with `name: "彩虹豆豆跳跳糖"` renders that name and `x3`.
- Base: a legacy reward with no image renders a compact localized fallback instead of breaking layout.
- Bad: rendering `${targetId} x${quantity}` in result cards, because it leaks internal ids such as `rainbow-bean-candy`.
- Bad: using a generic orb for every reward image after `imageUrl` is available.

#### 6. Tests Required
- Gacha helper tests assert coin-bag image selection, player-facing names, details, and no target-id-first labels.
- `GachaResultDialog` markup tests assert `.ten-pull`, reward images, names, and details.
- CSS contract tests assert `.gacha-result-grid.ten-pull` uses five columns on desktop.
- Backend gacha draw tests assert immediate rewards include copied `name` and `imageUrl`.

#### 7. Wrong vs Correct

Wrong:

```jsx
<span className="gacha-result-orb" />
<strong>{reward.targetId} x{reward.quantity}</strong>
```

Correct:

```jsx
const display = buildGachaRewardDisplay(reward);
<img src={display.imageUrl} alt={display.name} />
<strong>{display.name}</strong>
{display.detail && <small>{display.detail}</small>}
```

### Scenario: Player Gacha Modal Responsive Layout Contract

#### 1. Scope / Trigger
- Trigger: any change to player-facing `GachaModal` markup or CSS, including pool tabs, featured stage, wallet/action controls, nested prize/history dialogs, result grids, or Bright School theme overrides.
- This contract does not cover the admin gacha pool editor.

#### 2. Signatures
- `GachaModal` keeps the existing class surface: `.gacha-modal`, `.gacha-pool-tabs`, `.gacha-ticket-tab`, `.gacha-main`, `.gacha-featured-stage`, `.gacha-control-panel`, `.gacha-wallet`, `.gacha-round-actions`, `.gacha-draw-actions`.
- Base layout lives in `src/styles/commerce-settings.css`.
- Bright School polish lives in `src/styles/themes/bright-school/commerce.css`.
- Final phone/tablet survival rules live in `src/styles/mobile-adaptive.css`, which is imported after theme files.

#### 3. Contracts
- Desktop gacha UI is a capsule-counter composition: pool tickets in a compact rail, machine/featured prize as the primary stage, and wallet/prize/history/draw controls in a separate action panel.
- Mobile gacha UI must use one modal column inside the safe-area viewport, with pool tickets as a horizontal top scroller and draw controls reachable without horizontal scrolling.
- Mobile `.gacha-main` must collapse to one column; do not leave desktop side-panel columns active below 768px.
- Nested prize/history/result dialogs must scroll internally on mobile.
- Desktop ten-pull result grids stay five columns; mobile ten-pull result grids may collapse to compact two-column cards.
- Bright School `!important` overrides must be paired with equal-or-later mobile rules in `mobile-adaptive.css` when they affect gacha layout.

#### 4. Validation & Error Matrix
- No open pools -> the modal may show empty/loading text, but the pool rail and main area must not create horizontal overflow.
- 393px portrait viewport -> `documentElement.scrollWidth` should not exceed `clientWidth`.
- Ten rewards -> desktop `.gacha-result-grid.ten-pull` uses five columns; mobile uses the final mobile override.
- Bright School active -> themed borders/shadows may change, but mobile column layout, touch target sizes, and internal scrolling remain intact.

#### 5. Good/Base/Bad Cases
- Good: mobile gacha rules in `mobile-adaptive.css` use `.gacha-modal`, `.gacha-pool-tabs`, `.gacha-main`, and `.gacha-draw-actions` so the final layer owns small-screen survival.
- Good: Bright School theme reduces heavy gacha shadows on mobile while the final mobile layer controls sizing and grid structure.
- Base: an empty gacha pool list still renders a bounded modal with no horizontal page scroll.
- Bad: only editing `themes/bright-school/commerce.css` for mobile layout; the later `mobile-adaptive.css` layer can still override or drift.
- Bad: keeping `grid-template-columns: minmax(0, 1fr) minmax(242px, 310px)` active on phone widths.

#### 6. Tests Required
- `GachaModal.test.js` should assert the gacha CSS hooks, desktop ten-pull five-column rule, final mobile gacha selectors, and Bright School mobile gacha marker.
- Run `npm test -- src/modals/GachaModal.test.js src/styles/styleContract.test.js src/styles/themeContract.test.js` after changing gacha modal CSS.
- Run `npm run check` before handoff when system docs or broad CSS layers changed.

#### 7. Wrong vs Correct

Wrong:

```css
@media (max-width: 768px) {
  .theme-bright-school .gacha-main {
    grid-template-columns: 1fr !important;
  }
}
```

This keeps mobile survival in the theme layer only.

Correct:

```css
@media (max-width: 768px) {
  .gacha-main {
    grid-template-columns: minmax(0, 1fr) !important;
  }
}
```

Place the final mobile contract in `mobile-adaptive.css`, then let theme CSS adjust only visual treatment such as borders and shadows.

---

### Scenario: Warehouse Inventory And Target Card Presentation

#### 1. Scope / Trigger
- Trigger: any change to `WarehouseModal`, `WarehouseItemGrid`, `WarehouseTargetModal`, warehouse item CSS, or Bright School/mobile warehouse overrides.

#### 2. Signatures
- `WarehouseItemGrid({ items, usingItemId, onSelectTargetItem, onUseItem })` renders `.warehouse-grid` and `.warehouse-item`.
- `WarehouseTargetModal(...)` renders `.warehouse-character-grid` and disabled `.warehouse-target-disabled` buttons.
- `warehouseCharacterTargetAvailability({ character, item, itemEffects })` may return `reason` for logic and tests, but the target card UI must not display that reason.

#### 3. Contracts
- Desktop `.warehouse-grid` is single-column and each `.warehouse-item` is a row: icon, text, action in one horizontal entry.
- Mobile warehouse inventory keeps compact single-column row cards through final mobile overrides.
- Mobile warehouse item rows place the quantity chip in the right action column above the use button; keep the chip right-aligned and the button directly below it.
- Warehouse use buttons that are unavailable for direct use, including recruitment-only items, must stay native `disabled` controls and render as gray disabled buttons on desktop and mobile.
- Character-target unavailable cards use native `disabled`, `.warehouse-target-disabled`, gray/low-saturation styling, and no reason badge or reason text.
- Do not put availability reason in `<small>` or `title`; title should stay the character name.
- The disabled visual rule applies to desktop, Bright School, and mobile theme layers.

#### 4. Validation & Error Matrix
- `item.targetType === "character"` opens the target modal.
- `targetAvailability.disabled === true` renders a disabled gray card with no click behavior and no reason copy.
- Already affected characters and no-effect characters are both disabled visually without distinguishing labels.
- Mobile viewport follows the same no-reason target card contract.
- `item.usable === false` -> disabled gray use button, not an active-looking primary button.
- Mobile viewport -> quantity chip is above the use button in the same right-aligned action column.

#### 5. Good / Base / Bad Cases
- Good: disabled target button has class `warehouse-target-disabled`, a disabled attribute, and a character-name-only title.
- Good: disabled warehouse use button has `disabled`, `cursor: not-allowed`, and gray base plus Bright School theme styles.
- Base: helper still returns `reason` for logic, but UI does not show it.
- Bad: mobile quantity and use button sit side by side in separate action columns.
- Bad: `请去招募` uses pink primary styling while disabled.
- Bad: `<small>{targetAvailability.reason}</small>` or `title={targetAvailability.reason}` in target cards.
- Bad: desktop inventory returns to a multi-column card grid.

#### 6. Tests Required
- `src/modals/WarehouseModal.test.js` asserts desktop row layout, mobile quantity-above-button overrides, disabled warehouse use buttons, disabled target cards, and absence of reason labels/title.
- Theme/style contract tests should run after moving warehouse CSS import boundaries.

#### 7. Wrong vs Correct

Wrong:

```jsx
<button disabled={targetAvailability.disabled} title={targetAvailability.reason || character.name}>
  <span>{character.name}</span>
  {targetAvailability.reason && <small>{targetAvailability.reason}</small>}
</button>
```

Correct:

```jsx
<button disabled={targetAvailability.disabled} title={character.name}>
  <span>{character.name}</span>
</button>
```

### Scenario: Recruitment Modal Bulletin Board Background

#### 1. Scope / Trigger
- Trigger: any change to `RecruitmentModal`, `.recruitment-board`, recruitment commerce CSS, Bright School recruitment overrides, or recruitment visual assets.
- The recruitment modal's second row is the main bulletin-board stage. Theme layers must preserve its scene background instead of flattening it to a plain color.

#### 2. Signatures
- `RecruitmentModal` renders `<main className="recruitment-board">` for idle, pending, ready, and result states.
- Base CSS lives in `src/styles/commerce/recruitment/board.css`.
- Bright School polish lives in `src/styles/themes/bright-school/commerce/recruitment.css`.
- The board background image is `/assets/recruitment/notice-board-flat-candidate.webp`.
- The shared CSS hook is `--recruitment-board-background-image`.

#### 3. Contracts
- `.recruitment-board` must define `--recruitment-board-background-image: url("/assets/recruitment/notice-board-flat-candidate.webp")`.
- The board must compose the image through `background-image`, not through extra JSX or an `<img>` element that can interfere with board state content.
- Use `background-size: cover` and `background-position: center center` so the image scales proportionally, never stretches, and crops from the vertically centered portion of the artwork.
- Bright School recruitment overrides may change border, shadow, and overlay tint, but must keep `var(--recruitment-board-background-image)` in `.recruitment-board`.
- State cards inside the board own text readability; do not bake text or state UI into the background asset.
- State cards that already render an active recruitment item watermark or result artwork must not also include `var(--recruitment-paper-background-image)`. The stationery paper image is allowed for the empty no-item prompt only, so item-backed selection, ready, and result surfaces do not show two overlapping background images.
- The recruitment header should stay compact and use the single visible title `部员招募栏`; do not reintroduce a separate kicker/subtitle paragraph on mobile because it competes with the board stage.
- Pending recruitment should not show a helper label to the left of the time. Render only the remaining time digits through `.recruitment-countdown-row` as CRT-style green glowing tabular text without adding a screen background, border, or scanlines; keep the dev-only fast-forward icon as a small plain adjacent control.
- Selected-item confidence copy is a secondary cue and should stay visually distinct from the item name/scope, currently through `.recruitment-selection-card p` red text.
- Mobile item buttons may collapse to icon plus quantity only. If item names cannot fit in the one-line action row, hide the label span rather than showing clipped text.
- Unavailable recruitment confirmation must be a native disabled button and render as a gray disabled control in base CSS, Bright School, and final mobile overrides.

#### 4. Validation & Error Matrix
- Idle with no selected item -> empty board copy appears over the bulletin background.
- Selected, pending, ready, and result states -> the same board background remains behind the state card.
- Bright School active -> `.recruitment-board` still includes `var(--recruitment-board-background-image)` and does not collapse to a flat `background: #...`.
- Mobile viewport -> the board keeps stable dimensions from `phone-recruitment.css`; the background may crop but must scale proportionally and must not introduce horizontal overflow.
- 393px portrait viewport -> item buttons show complete icon-plus-quantity controls without half-clipped item names, and the use button visibly changes to gray disabled state when unavailable.

#### 5. Good / Base / Bad Cases
- Good: base CSS defines the image variable and Bright School uses `background-image: ..., var(--recruitment-board-background-image) !important`.
- Good: mobile `.recruitment-item-button span` is hidden while the icon and `x<n>` quantity remain visible.
- Good: `.recruitment-use-button:disabled` exists in the shared action CSS and Bright School override.
- Base: empty no-item cards may use the stationery paper prompt, while item-backed cards are semi-opaque image-free surfaces layered above the board image.
- Bad: adding an absolutely positioned `<img>` inside `RecruitmentModal` behind content.
- Bad: a theme override that uses `background: #fff3d5 !important` and drops the image.
- Bad: a selection, ready, or result card that combines `var(--recruitment-paper-background-image)` with `.recruitment-item-watermark`.

#### 6. Tests Required
- `src/styles/styleContract.test.js` asserts the base recruitment board image variable and `var(...)` usage, and asserts item-backed state-card selectors do not include `var(--recruitment-paper-background-image)`.
- `src/styles/themeContract.test.js` asserts Bright School recruitment CSS preserves the board image variable, sizing, disabled use-button override, and does not reintroduce the paper image variable into item-backed state cards.
- Run `npm test -- src/styles/styleContract.test.js src/styles/themeContract.test.js src/modals/RecruitmentModal.test.js` after recruitment board CSS changes.

#### 7. Wrong vs Correct

Wrong:

```css
.theme-bright-school .recruitment-board {
  background: #fff3d5 !important;
}
```

Correct:

```css
.theme-bright-school .recruitment-board {
  background-image:
    linear-gradient(180deg, rgba(255, 253, 239, 0.1), rgba(242, 249, 246, 0.14)),
    var(--recruitment-board-background-image) !important;
}
```

### Scenario: Shop Purchase Disabled Action Contract

#### 1. Scope / Trigger
- Trigger: any change to `ShopItemCard`, shop purchase availability helpers, `src/styles/commerce/shop-settings/`, Bright School shop commerce rules, or final mobile shop card overrides.

#### 2. Signatures
- `ShopItemCard(...)` renders the product-card purchase button as `.shop-item .primary-action`.
- Unavailable purchase states include already owned, sold out, `purchasable === false`, pending purchase, and insufficient coins.
- State marker classes may still include `.shop-action-owned` and `.shop-action-sold-out`, but the disabled visual contract is controlled by `.shop-item .primary-action:disabled`.

#### 3. Contracts
- Every unavailable purchase action must be a native disabled button, not just a changed label.
- All disabled shop purchase buttons render as one gray inactive treatment across base CSS, Bright School shop polish, and final mobile overrides.
- Do not make already-owned buttons green or sold-out buttons category-specific when the button is disabled; those states can be communicated by label while the affordance stays unavailable.
- Disabled shop purchase buttons must keep `cursor: not-allowed`, no active transform, and no action-looking primary shadow.

#### 4. Validation & Error Matrix
- Already-owned character or decoration -> disabled gray purchase button with the owned label.
- Sold-out item -> disabled gray purchase button with the sold-out label.
- Insufficient coins -> disabled gray purchase button with the insufficient-coins label.
- Bright School active on mobile portrait -> final mobile shop card overrides preserve the gray disabled treatment.

#### 5. Tests Required
- `src/modals/ShopModal.test.js` asserts owned, sold-out, and insufficient-coin card actions render native disabled buttons.
- Shop style tests or source assertions must cover base shop CSS, Bright School shop CSS, and final mobile shop overrides for `.shop-item .primary-action:disabled`.

---

### Scenario: Player Currency Visibility In Resume And Shop

#### 1. Scope / Trigger
- Trigger: any change to `ResumeModal`, `ShopSidebar`, shop wallet markup, resume header wallet markup, or player-facing currency display in shop/resume surfaces.

#### 2. Signatures
- `ResumeModal({ user, ... })` receives `user.coins` and may still receive `user.blueGems`.
- `ShopSidebar({ mascotLine, user })` receives `user.coins` and may still receive `user.blueGems`.
- Visible wallet markup uses `.shop-wallet`; the hidden blue-gem capsule previously used `.blue-gem-wallet`.

#### 3. Contracts
- Resume and shop must render only the coin wallet capsule.
- Do not render `.blue-gem-wallet`, `Gem`, `user.blueGems`, or blue-gem balance text in `ResumeModal` or `ShopSidebar`.
- Keep backend/user payload `blueGems` compatibility intact; this contract hides the player-facing shop/resume surfaces only.
- Legacy gacha internals may still carry `blueGems` and duplicate-conversion data unless product scope explicitly removes that system.

#### 4. Validation & Error Matrix
- `user.blueGems > 0` in resume -> no blue-gem wallet element, title, icon, or balance appears.
- `user.blueGems > 0` in shop -> no blue-gem wallet element, title, icon, or balance appears.
- Missing `user.coins` -> existing coin fallback rules still apply; do not reintroduce blue-gem fallback UI.

#### 5. Good / Base / Bad Cases
- Good: `<p className="shop-wallet"><CircleDollarSign />{user.coins}</p>`.
- Base: tests may pass `blueGems` in user fixtures to prove the UI ignores it.
- Bad: `<p className="shop-wallet blue-gem-wallet"><Gem />{user.blueGems}</p>`.

#### 6. Tests Required
- `src/modals/HouseModal.test.js` asserts resume markup does not include `blue-gem-wallet`.
- `src/modals/ShopModal.test.js` asserts shop markup keeps the coin wallet and does not include `blue-gem-wallet` or the passed blue-gem balance.

#### 7. Wrong vs Correct

Wrong:

```jsx
<p className="shop-wallet blue-gem-wallet">
  <Gem size={18} />
  {user.blueGems ?? 0}
</p>
```

Correct:

```jsx
<p className="shop-wallet">
  <CircleDollarSign size={18} />
  {user.coins ?? 0}
</p>
```

## Styling Patterns

<!-- How styles are applied (CSS modules, styled-components, Tailwind, etc.) -->

### Scenario: Admin Console Fullscreen Boundary

#### 1. Scope / Trigger
- Trigger: any change to `AdminShell`, `.admin-screen`, `admin.css`, `mobile-adaptive.css`, HUD/theme shell backgrounds, or admin-only tool layouts such as the story tutorial workbench.
- The admin console is a production tool surface and must not inherit player-facing lobby, room, HUD, or theme composition constraints.

#### 2. Signatures
- `AdminShell` renders `<main className="admin-screen">`.
- Base admin layout lives in `src/styles/admin/shell-layout.css`.
- Final post-theme admin shell protection lives in `src/styles/mobile-adaptive/admin-fullscreen.css`, imported near the start of `src/styles/mobile-adaptive.css`.

#### 3. Contracts
- `.admin-screen` must override the shared 1280px page-width cap and use viewport-width layout on desktop so dense admin tools do not become narrow centered panels.
- `.admin-sidebar` and `.admin-main` should own bounded internal scrolling with `max-height: calc(100dvh - padding)` so the full-screen shell stays stable.
- `.app-shell:has(.admin-screen)` must be reset after HUD/theme layers to a light admin background and must suppress player-facing pseudo-backgrounds.
- Do not fix admin width by editing shared `.auth-screen, .home-screen, .room-screen, .admin-screen` base rules unless the same change is intended for every app shell.
- Admin fullscreen safety rules belong in the final safety layer because HUD hardening and active themes can use later `!important` app-shell backgrounds.

#### 4. Validation & Error Matrix
- Wide desktop viewport -> the admin console spans the viewport instead of staying at 1280px with side gutters.
- Bright School or HUD theme active -> admin background remains light and does not show terminal black/green chrome.
- Narrow desktop or phone -> responsive admin rules may collapse columns, but must not create horizontal overflow.
- Story tutorial editor -> the flow graph, step editor, and preview gain the available width instead of compressing into a narrow centered work area.

#### 5. Tests Required
- `src/styles/styleContract.test.js` should assert the final `mobile-adaptive/admin-fullscreen.css` import and effective `.app-shell:has(.admin-screen)` / `.admin-screen` fullscreen rules.
- Run `npm test -- src/styles/styleContract.test.js` and `npm run build` after changing this boundary.

### Scenario: Story Tutorial Flow Graph Reachability

#### 1. Scope / Trigger
- Trigger: any change to `src/admin/AdminOnboardingStory.jsx` flow graph logic, StoryScript node navigation fields, or editor labels for connected/orphaned steps.
- The editor visualizes existing StoryScript data; it must not invent a stricter graph model than the runtime player uses.

#### 2. Signatures
- `buildFlow(draft)` derives `{ main, branches, connectedExtras, orphans }`.
- `scriptForCurrentPreview(draft, selectedNodeId)` derives a preview script whose `initialBoard` is the silently replayed board state immediately before `selectedNodeId`.
- Runtime graph edges are `node.nextNodeId` and each non-empty `option.nextNodeId`.
- Empty option targets still mean "end story" and should render as the virtual end card.
- `TUTORIAL_NODE_TYPES.boardSetup` stores a node-local `boardSetup` snapshot and switches the local tutorial board without changing the script-level default `initialBoard`.

#### 3. Contracts
- Reachability must start from `draft.startNodeId` or the first node fallback and traverse both `nextNodeId` and option targets recursively.
- The main vertical chain may still follow `nextNodeId` only, but orphan detection must use full graph reachability.
- Branch targets should show their linear `nextNodeId` continuation where practical; reachable nodes that do not fit that branch chain can be grouped as connected branch follow-up, not "unconnected".
- Only nodes unreachable from the start through runtime edges may appear under "unconnected steps".
- Current-step preview must find a reachable path through both `nextNodeId` and option targets, then silently replay board setup, move, skill, and resign nodes on that path. Do not replay only the main chain.
- Board setup editing belongs in the current-step form and should reuse the shared board picker/modal; do not expose raw `boardSetup` JSON or add a separate graph model.

#### 4. Tests Required
- `src/admin/AdminOnboardingStory.test.jsx` should cover an option target with a following `nextNodeId` chain and a deeper option target, asserting only a truly unreachable node remains in `orphans`.
- `src/admin/AdminOnboardingStory.test.jsx` should cover current-step preview for a branch target after a `board-setup` node, asserting the preview `initialBoard` comes from the branch setup snapshot.

### Scenario: Story Tutorial Node Settings Window

#### 1. Scope / Trigger
- Trigger: any change to `src/admin/AdminOnboardingStory.jsx`, `src/styles/admin/story-workbench/overlays.css`, or node settings window tests that affects the graph-opened settings window.
- The settings window is a workbench editing surface, not a global app modal. It should keep the selected node, graph, issues, and preview context visible and should stay reachable while the admin scrolls.

#### 2. Signatures
- `AdminOnboardingStory` owns `nodeSettingsWindow` state and renders `.admin-story-workbench-node-settings-window`.
- `positionNodeSettingsWindow(event)` derives coordinates from the workbench root, not from persistent viewport anchoring.
- `StepEditor` supplies the window header, help action, close action, and insert-step action.

#### 3. Contracts
- Desktop node settings windows are positioned inside `.admin-story-workbench` with workbench-relative coordinates, so they move with the admin scroll container instead of staying fixed to the viewport.
- Opening the window must reserve enough bottom scroll space on the workbench for the window's lower controls to become reachable.
- The window owns its own vertical scrolling; the `StepEditor` header and action cluster remain sticky at the top of that internal scroll region.
- Narrow screens may render the same window as a fixed bottom sheet, but the sheet must keep the same sticky header and reachable close/insert actions.
- The window reuses `StepEditor`; do not fork a second node form or duplicate node mutation behavior.

#### 4. Tests Required
- `src/admin/AdminOnboardingStory.test.jsx` should assert the workbench-relative positioning hooks, bottom scroll reserve, base absolute positioning, narrow-screen fixed bottom-sheet override, internal overflow, sticky header, and insert/close actions.
- `src/styles/cssLayerInventory.test.js` should be updated when the scoped CSS growth changes the current inventory baseline.

### Scenario: Story Player Node Handoff Stability

#### 1. Scope / Trigger
- Trigger: any change to `StoryPlayerModal`, `OnboardingStoryModal`, or `TutorialSessionModal` story-node playback handoff logic.
- Ordinary story continuation should feel like one stable window whose content changes, not a modal close/reopen or empty-state flash.

#### 2. Contracts
- Keep the story modal backdrop and shell mounted across `nextNodeId` transitions.
- Reset typewriter counters before the browser paints the next node, so the user never sees a frame of old text, full new text, or blank text before typing restarts.
- When a parent component swaps the temporary script window to `{ startNodeId: nextStoryNodeId, nodes: [nextNode] }`, render `startNodeId` immediately if the previous internal node id no longer exists; do not show the "no script" empty state for one frame.

#### 3. Tests Required
- `src/modals/StoryPlayerModal.test.jsx` should cover the render-node fallback used when the parent script window changes between story nodes.

### Scenario: Story Tutorial Battle Runtime

#### 1. Scope / Trigger
- Trigger: any change to `TutorialBattleScreen`, tutorial node type constants, admin battle-step forms, `RoomBattleStage` tutorial props, or StoryScript node normalization for tutorial fields.
- Battle tutorials must run inside the real battle room presentation, not a simplified board preview, because the teaching state depends on player/NPC panels, the action bar, chat history, skills, and board interaction affordances.

#### 2. Signatures
- Node types live in `src/shared/tutorialNodeTypes.js`.
- Battle-only node types include `npc-dialogue` and `player-choice` in addition to board setup, move, skill, counting, and resign tutorial nodes.
- `story` nodes reached while `TutorialBattleScreen` is active mean "exit the battle room and resume the normal story window at this node".
- NPC timing fields are `actionStartDelaySeconds`, `actionDelaySeconds`, `replyDelaySeconds`, and `autoContinueDelaySeconds`, with a product default of `1.5` seconds where an NPC action-start delay is omitted and `0.4` seconds where an NPC reply delay is omitted.
- Node progression is authored as one advance mode: `auto` or `manual`. The storage fields remain `manualContinueEnabled`, `autoContinueEnabled`, and `autoContinueDelaySeconds` for existing script compatibility, but new admin edits must write them as a mutually exclusive pair. New battle nodes default to `auto`.
- `autoContinueDelaySeconds` is the automatic progression wait. In `auto` mode, blank means 1.5 seconds after typewriter completion for `npc-dialogue`, and 0 seconds for other battle nodes. In `manual` mode, the value is preserved but does not start a timer.
- Option timing field: `transitionDelaySeconds` on both ordinary story options and in-battle reply options. In admin copy this is "选择后等待"; blank means 0 seconds after selection.
- `RoomBattleStage` accepts tutorial overrides such as `actionPanelOverride`, `chatReadonly`, `chatDisabledInputMessage`, `chatCompactMessages`, `showPeoplePanel`, `tutorialTargetPointId`, and `tutorialAnyBoardTarget`.
- `RoomHeader` accepts `exitLabel` and `showUtilityControls` so tutorial battles can keep only the exit/skip affordance without rendering room utility buttons.
- `AssetPreloadScreen` accepts `showTips` for fixed-copy loading transitions that still need the shared preload template.

#### 3. Contracts
- `TutorialBattleScreen` must compose the existing full battle room stage, including both player information areas. Do not render battle teaching as an admin preview card or custom mini-board.
- Tutorial battles must route desktop and mobile through the same layout shells as real rooms (`DesktopRoomLayout`, `MobileRoomLayout`, `useMobileRoomLayout`) instead of a desktop-only wrapper.
- Tutorial battles must restore normal room audio by using `useRoomAudioEffects` for move/effect sounds and `BackgroundMusic`/`resolveBackgroundMusic` for battle and skill BGM.
- NPC move and skill nodes execute automatically after their configured delays. Do not require a player-facing "let NPC act" button.
- Battle nodes with options must still run through the selected advance mode before options appear. This includes `player-choice`; do not special-case it to reveal options immediately when manual continuation is selected.
- Option clicks must hide the option panel immediately, show a quiet pending state, and enter the target only after `transitionDelaySeconds`.
- Pending waits must block repeated point/game/continue/choice actions, clear timers on node changes, close/skip, and unmount, and keep the global exit/skip affordance available.
- The node initialization effect must be keyed by the current node id. Resolving a pending progression wait changes `pendingWait`, but must not reinitialize the same node, because reinitialization clears `choicesVisible` and can make just-revealed reply options flash and disappear.
- Admin preview should use the real configured waits by default and may expose a preview-only "立即继续" control for timer-only waits. Player-facing playback must not expose per-wait skipping, but node-level manual continuation is a script-controlled player action.
- NPC dialogue nodes may show dialogue with no board action, or board action nodes may show dialogue while also moving/casting. The NPC bubble remains visible while player reply options are shown and is replaced only when the next NPC node begins.
- `player-choice` nodes show centered reply options without changing the board. Chosen NPC and player replies are written to the read-only chat history.
- `story` nodes reached from battle show the shared `AssetPreloadScreen` exit loading page for at least three seconds with "正在收拾棋盘..." before returning to the normal story modal.
- Entering a board setup shows the shared `AssetPreloadScreen` entry loading page for at least three seconds with "正在激烈对局中..." and the participating NPC portraits.
- Story-to-battle, battle-to-story, and in-battle board-setup handoffs must put the shared loading screen in place before the browser can paint the next route/node. Use initial state, navigation-handler state, or layout effects for the handoff boundary; do not rely only on a post-paint effect that briefly renders the battle room, home screen, or setup placeholder.
- The teaching action panel replaces ordinary free-battle actions. Continue and reply controls belong under the board, not in a separate free-battle button group.
- Player move targets must highlight the exact point with a gold ring rendered as a real child element inside the board point; do not use a `::after` point pseudo-element because theme guards also own point pseudo-elements. The ring must preserve `transform: translate(-50%, -50%)` after Bright School `button > *` reset layers and should animate as a visible gold glow. Clicking another point or the board surface shows "请在提示区域落子".
- Player skill targets use the normal skill selection flow. If a skill has no concrete target point, the second phase still requires a board click and shows "点击棋盘区域任意位置即可".
- Player button targets highlight the required action button. Clicking unrelated disabled/free actions should do nothing unless the node explicitly defines an error toast.
- Player reply options should render above a full-screen scrim that focuses the choice area while keeping the current NPC bubble visible above the scrim. The choice container must not own horizontal or vertical scrolling; keep option labels inside the available width through shrinkable button text spans and wrapping. Choice and teaching action buttons use a left/right distributed row layout so the affordance does not collapse into centered free-battle controls. The action panel must never render free-text hints; it may show only concrete teaching buttons such as "继续", skill, counting, or resign, otherwise it remains empty while board highlights, reply options, NPC bubbles, chat, and toast feedback carry instructional text.
- In Bright School, `.tutorial-battle-choice button:hover:not(:disabled)` and `:focus-visible:not(:disabled)` reuse the home utility card hover motion: `7px 8px 0 #3d2b25` hard shadow, `0 12px 24px rgba(255, 158, 187, 0.2)` lift shadow, `saturate(1.04) brightness(1.01)`, and `translateY(-4px) rotate(calc(var(--utility-tilt, 0deg) - 0.45deg)) scale(1.018)`. Keep this in `src/styles/themes/bright-school/room/tutorial-choice-interactions.css` so the already-large `player-status.css` does not grow.
- Reply options should render as the buttons themselves, without a visible choice-panel title, extra close affordance, or framed card background. The scrim and NPC bubble provide the spatial context.
- Teaching action buttons should stretch evenly across the action area with a small inset and a light-green target affordance on both desktop and mobile.
- NPC dialogue bubbles should derive their low-saturation background, border, or glow accent from the active NPC character palette while preserving readable text contrast.
- NPC dialogue bubble body text should type in progressively while the speaker name is shown immediately, and the animation must respect `prefers-reduced-motion`.
- A player with no selected role keeps the same panel footprint as a character player, but the portrait and skill list are empty, placeholder slots preserve the side panel symmetry, and the rank is hidden.
- Timer digit groups should stay centered inside their timer card in desktop room panels and mobile player strips; mobile strips must keep compact art-font overrides so the timer track is not squeezed out of the player strip.
- Chat is read-only during battle tutorials; the input is disabled and can still display a disabled placeholder message. Tutorial chat messages must be compact, without hand number, timestamp, or `[使用角色]` suffixes.
- Exit/skip uses the room header exit affordance, asks for confirmation, and ends the script like the normal story close/skip path.
- Bubble slide-in/out motion should respect `prefers-reduced-motion`; keep the static visible state when motion is reduced.

#### 4. Validation & Error Matrix
- NPC action node with no options -> run the action, wait the continuation delay, then advance through `nextNodeId`.
- NPC dialogue/action node with options -> keep the bubble visible while centered reply options are displayed.
- Node with options and `auto` advance mode -> keep the current battle surface visible with no action-panel text, then reveal the options after the configured automatic wait.
- Node with options and `manual` advance mode -> keep the current battle surface visible and show only "继续" before revealing the options.
- `npc-dialogue` created with current admin defaults -> after typewriter completion, auto-advance or reveal options 1.5 seconds later without showing a player continue button.
- Reply option with `transitionDelaySeconds: 1` -> hide choices immediately, show the pending state, then route to `nextNodeId` or finish.
- Pending node progression wait resolves into reply options -> options remain visible until the user chooses one, and the same node is not initialized again.
- Closing/skipping during a pending wait -> clear the timer and do not route to the old node afterwards.
- Player move click on the wrong point -> reject the action and keep the node active.
- Player no-target skill -> second-phase board click anywhere confirms the scripted skill action.
- `story` node reached from battle -> never render it as an in-battle bubble; exit to the normal story player.
- Missing player character -> render an empty-but-stable player panel and no skill options.
- Story-to-battle handoff -> the entry loading page is the first visible battle route frame, not a one-frame room shell or setup placeholder.
- Battle-to-story handoff -> keep exit loading mounted until the parent route/story modal handoff unmounts the battle screen.
- Exit/skipping/return-to-story loading -> disable the local `TutorialBattleScreen` `BackgroundMusic` before the full-screen shared loading transition, pause global background music during the transition, and never reactivate battle BGM after the pause is released unless a new battle setup/session starts.
- Close/skip confirmation accepted -> end the script; cancelled -> remain in the battle tutorial.

#### 5. Tests Required
- `src/tutorial/tutorialBattleRoom.test.js` should cover room construction invariants needed by `TutorialBattleScreen`.
- `src/room/Board.test.js` should cover tutorial point and any-board targeting hooks.
- `src/room/RoomScreen.test.js` should cover action-panel override, read-only chat wiring, and room header exit label behavior.
- `src/app/AppOverlays.test.jsx` / app route tests should cover battle-to-story resume wiring.
- `src/admin/AdminOnboardingStory.test.jsx` should cover admin form validation for `npc-dialogue`, `player-choice`, delay fields, actor fields, and story-exit previews where practical.
- `src/tutorial/TutorialBattleScreen.test.jsx` should assert Bright School reply-choice hover imports and utility-card-equivalent hover motion.
- `src/tutorial/TutorialBattleScreen.test.jsx` should assert battle-node progression waits, option transition waits, pending feedback, preview-only skip-current-wait controls, and timer cleanup.
- `src/tutorial/TutorialBattleScreen.test.jsx` should assert same-node initialization is guarded so pending-wait resolution cannot hide newly visible reply options.
- `src/modals/StoryPlayerModal.test.jsx` should assert ordinary story option `transitionDelaySeconds` scheduling and the pending feedback path.

---

## Accessibility

<!-- A11y requirements and patterns -->

(To be filled by the team)

---

## Common Mistakes

<!-- Component-related mistakes your team has made -->

(To be filled by the team)
