# Tailwind migration roadmap

## Goal

Create a durable, staged roadmap for moving SigrikaGo toward a Tailwind-first frontend styling model without changing current visuals, gameplay layout, Bright School theme behavior, Pixi skill presentation, or final mobile safety contracts.

## What I already know

- The user wants step 4 from the CSS cleanup plan: a phased long-term Tailwind migration plan before code changes.
- The plan must survive context compaction and future agent handoff.
- The current branch is `codex/css-tidy`.
- The working tree was clean before this task was created.
- Tailwind CSS v4 is already installed through `@tailwindcss/vite`.
- `src/styles/tailwind.css` imports Tailwind `theme.css`, project tokens from `src/styles/tailwind/tokens.css`, and Tailwind `utilities.css`; Tailwind imports keep `prefix(tw)`.
- Since Tailwind is imported as individual files to omit preflight, the `utilities.css` import keeps `source("../")` so `src/` JSX pilot classes generate actual `tw:` utility CSS.
- Tailwind preflight is deliberately omitted.
- `src/styles.css` imports `tailwind.css` after `hud-components.css` and before `themes.css`.
- `src/styles` currently contains about 580 CSS files.
- Current `tw:` usage is mostly documentation, CSS contract tests, the Tailwind entry/token scaffold, the admin table shell pilot, the first small Phase 3 primitives/wrappers, and the narrow Phase 4 modal action wrapper pilots. Business JSX has not started broad utility migration.
- Existing contracts say Tailwind should be a low-intrusion utility layer and not migrate Bright School, room, board, skill presentation, or final mobile CSS without a focused migration plan and visual checks.

## Assumptions (temporary)

- The target is "Tailwind-first" rather than deleting every CSS file. Some domain CSS should remain for theme scopes, Pixi hosts, board geometry, complex keyframes, and final safety layers.
- The first real planning pass should produce a multi-phase roadmap and identify which files should receive the durable plan text.
- The user has approved starting phased work for Phase 1-7. Phase 8+ high-risk board, Pixi, and skill-presentation migration remains out of scope until visual baselines are stronger.

## Open Questions

- None blocking. The current direction is to persist the roadmap in this PRD and sync durable rules into spec/docs as Phase 1 work.

## Requirements (evolving)

- Produce a full phased Tailwind migration roadmap.
- Preserve existing desktop and mobile visuals unless a specific polluted effect is intentionally removed.
- Keep `tw:` prefix and no-preflight posture until a later explicit decision changes it.
- Include protected-surface rules for board, room, skill, Pixi, Bright School final mobile, and mobile-adaptive layers.
- Include verification gates for each migration risk tier.
- Define where the approved plan should be persisted for future agents.
- Start with Phase 1-7 only; do not begin protected board, Pixi, or skill effect migration in this task.

## Durable Plan Artifact

- The full execution plan for future agents lives in `.trellis/tasks/07-01-tailwind-migration-roadmap/tailwind-full-migration-plan.md`.
- This PRD remains the task status and progress log. The plan file is the step-by-step migration handoff for Phase 1-9, including Phase 8+ protected-surface gates.
- Future sessions should read this PRD first, then the plan file, then `.trellis/spec/frontend/css-architecture.md`, `src/styles/README.md`, and `src/styles/cssLayerInventory.js`.

## Acceptance Criteria (evolving)

- [x] The roadmap has concrete phases from baseline/token work through high-risk gameplay surfaces.
- [x] The roadmap distinguishes low-risk, medium-risk, high-risk, and protected migration targets.
- [x] The roadmap states when old CSS can be deleted versus temporarily kept.
- [x] The roadmap includes desktop and mobile parity requirements.
- [x] The roadmap names required tests and visual checks per phase.
- [x] Durable Tailwind migration rules are synchronized into `.trellis/spec/frontend/css-architecture.md`, `src/styles/README.md`, and system-design docs.
- [x] Phase 1 adds only low-risk contracts/token scaffolding and does not migrate existing UI surfaces.
- [x] Phase 1 verification passes.
- [x] Phase 2 has a first isolated admin pilot that removes matching old wrapper CSS.
- [x] Phase 3 has started with a small primitive that centralizes the first pilot utility classes before any broad feature migration.
- [x] Phase 4 has started with one narrow shared modal action wrapper pilot before any broad modal/card/form migration.
- [x] Phase 5 has started with one narrow home-flow action wrapper pilot before any broad home/lobby/commerce migration.
- [x] Phase 6 has started with a contract-only Bright School token scaffold and does not move theme owner CSS rules.
- [x] Phase 7 has started with a contract-only final mobile guard inventory and does not move `mobile-adaptive.css` rules.
- [x] The full step-by-step Tailwind migration implementation plan is persisted in `tailwind-full-migration-plan.md`.

## Definition of Done

- A user-approved roadmap is persisted in this task PRD.
- Durable rules are synchronized to `.trellis/spec/frontend/css-architecture.md`, `src/styles/README.md`, and system-design docs.
- Phase 1 low-risk Tailwind contract/token scaffolding is implemented and verified.
- Phase 6 and Phase 7 contract-only pilots are recorded in inventory/tests before any visual CSS migration.
- The task is not considered complete for the thread goal until Phase 1-7 have been completed or the user narrows the goal.

## Out of Scope

- Migrating existing business UI or visual CSS to Tailwind during Phase 1 planning/scaffolding.
- Enabling Tailwind preflight.
- Removing the `tw:` prefix.
- Refactoring board, skill, Pixi, room, Bright School final mobile, or mobile-adaptive CSS before visual baselines and explicit approval.

## Phase 1-7 Roadmap

### Phase 1: Baseline, Contracts, And Token Scaffold

Goal: make Tailwind safe to use before migrating any UI.

Work:

- Persist this roadmap in the task PRD and summarize durable rules in `.trellis/spec/frontend/css-architecture.md`, `src/styles/README.md`, and system-design docs.
- Keep Tailwind v4 imported only through `src/styles/tailwind.css` with `prefix(tw)` and no preflight.
- Add a small semantic Tailwind token scaffold that references project CSS variables where possible instead of introducing a new visual palette.
- Add CSS contract tests that guard the no-preflight, prefix, layer order, roadmap phases, and protected-surface exclusions.
- Record current CSS inventory as the baseline for future stages.

Exit criteria:

- No JSX/business UI migration yet.
- No visual changes expected.
- Static CSS contracts and docs generation pass.

### Phase 2: Low-Risk Pilot Surfaces

Goal: prove the Tailwind workflow on isolated surfaces with minimal cascade risk.

Preferred targets:

- New admin/tooling UI.
- Admin-only empty states, filters, helper panels, or lightweight form rows.
- New low-risk surfaces that are route-lazy or isolated from player themes.

Rules:

- Use `tw:` classes through small local helpers or primitives, not long unreviewable class strings.
- Delete or shrink old CSS for the migrated slice in the same change.
- Keep desktop and mobile behavior together when the surface is responsive.

Verification:

- Static CSS contracts.
- Focused component tests for the migrated surface.
- `npm run build`.

Progress:

- `src/admin/AdminAudit.jsx` is the first Phase 2 pilot. The rendered audit table shell still outputs `tw:max-w-full` and `tw:overflow-x-auto`, and the old `.audit-table-wrap` CSS in `src/styles/admin/audit-feedback.css` has been removed. The table-specific `min-width: 680px` rule remains CSS-owned because it must override the shared `.admin-table` width contract without relying on route CSS injection order.
- After Phase 3 started, `AdminAudit` consumes `AdminTableScroll`, which wraps `src/ui/primitives/ScrollArea.jsx`, instead of owning raw `tw:` strings directly. This keeps the Phase 2 visual result while moving utility ownership into the primitive/wrapper layer.

### Phase 3: UI Primitive Layer

Goal: prevent Tailwind migration from scattering ad hoc class strings through feature components.

Work:

- Introduce or standardize React primitives for Button, IconButton, ModalShell, DialogHeader, DialogActions, Tabs, SegmentedControl, Input, Select, Textarea, Slider, Badge, ListRow, EmptyState, and Toast.
- Keep visual variants semantic: primary, secondary, danger, quiet, paper, HUD, disabled, selected.
- Keep state transitions transform/opacity/color based; avoid layout-shifting width, height, top, left, padding, and border-width animation.
- Preserve native semantics for disabled controls and form labels.

Exit criteria:

- New UI work can default to primitives.
- Existing CSS is not mass-replaced until each primitive has tests and desktop/mobile behavior.

Progress:

- `src/ui/classNames.js` is the first local class composition helper. It avoids adding a dependency while giving primitives one shared way to compose strings, arrays, and conditional class objects.
- `src/ui/primitives/ScrollArea.jsx` is the first Phase 3 primitive. It centralizes `tw:max-w-full` and `tw:overflow-x-auto`, and its first consumer is the admin-only audit table shell from Phase 2.
- `src/admin/adminComponents.jsx` now exposes `AdminTableScroll`, a local admin wrapper around `ScrollArea`. All current admin `.admin-table-wrap` shells use it, and `src/styles/admin/shared-surfaces.css` keeps only the visual shell rules for margin, border, radius, and background.
- `src/ui/primitives/Badge.jsx` is the second Phase 3 primitive. It centralizes visually equivalent `tw:inline-flex`, `tw:items-center`, and `tw:justify-center` layout utilities for status badges while existing admin CSS still owns colors, borders, spacing, and typography. `AdminStatusPill` consumes it, and `AdminAchievements` no longer writes raw `.admin-status-pill` class strings directly.
- `src/ui/primitives/EmptyState.jsx` is the third Phase 3 primitive. It centralizes `tw:text-center`, `tw:px-3`, and `tw:py-6` for empty-state alignment and spacing. `AdminTableEmpty` wraps it for admin table cells, and the first consumers are admin-only table empty rows in users, shop items, music tracks, decorations, and gacha pools. Non-table `quiet-text`, player modal empty states, and Bright School repaired empty states are not part of this pilot.
- `src/ui/primitives/Button.jsx` is the fourth Phase 3 primitive. It centralizes only visually equivalent action alignment utilities: `tw:inline-flex`, `tw:items-center`, `tw:justify-center`, and `tw:gap-2`. `AdminActionButton` maps semantic admin variants back to existing `.primary-action`, `.secondary-action`, and `.danger-action` visual classes, so colors, borders, disabled states, shadows, padding, and typography remain CSS-owned.
- These primitives are intentionally limited to low-risk admin/tooling layout and action affordances. They do not authorize player-facing button restyling, modal, card, room, board, skill, Pixi, player-facing empty state, or mobile gameplay migration.

### Phase 4: Shared Modal, List, Card, And Form Migration

Goal: migrate repeated medium-risk surfaces after primitives exist.

Preferred targets:

- Settings, friends, leaderboard, announcement, mailbox, achievements, warehouse, shop, and recruitment modal internals.
- Common tabs, rows, cards, badges, dialog actions, and form controls.

Rules:

- Migrate one modal or domain at a time.
- Replace matching old CSS in `modals/**`, `commerce/**`, `mobile-modals/**`, and focused Bright School repair files only when the new primitive fully owns the surface.
- Mirror desktop and mobile contracts in the same PR/task.
- Avoid changing product copy, data flow, or modal behavior while migrating styles.

Verification:

- Focused modal/component tests.
- Static CSS contracts.
- `npm run check` at each larger handoff.

Progress:

- `src/modals/modalComponents.jsx` exposes `ModalActionButton`, the first Phase 4 domain wrapper around `src/ui/primitives/Button.jsx`. It maps semantic modal variants back to existing `.primary-action`, `.secondary-action`, and `.danger-action` visual classes while `Button` owns only the low-risk `tw:inline-flex`, `tw:items-center`, `tw:justify-center`, and `tw:gap-2` alignment utilities.
- `ConfirmModal` in `src/modals/FeedbackModals.jsx`, the submit action in `src/modals/MessageBoardModal.jsx`, the simple retry/load-more secondary actions in `src/modals/AnnouncementModal.jsx`, the save action in `src/modals/PersonalizationModal.jsx`, the mailbox attachment claim action in `src/modals/MailboxModal.jsx`, the duel-mode cancel action in `src/modals/friends/FriendsOverlays.jsx`, and the profile report submit action in `src/modals/UserProfileCard.jsx` are the first consumers. They no longer write raw `.danger-action`, `.secondary-action`, or `.primary-action` class strings directly for those action rows, but the existing modal/action CSS still owns colors, spacing, borders, shadows, typography, disabled states, placement, and theme/mobile overrides. No shared modal CSS was deleted in these slices because the wrapper does not yet own a full modal surface.
- This pilot does not authorize migration of story player choices, shop/warehouse cards, recruitment board actions, gacha controls, Bright School repaired modal surfaces, or mobile gameplay controls without separate focused tests and visual checks.

### Phase 5: Home, Lobby, And Commerce Main Flow

Goal: migrate larger player-facing non-gameplay layouts after common primitives are stable.

Preferred targets:

- Home utility entries, player identity chrome, lobby/watch list surfaces, shop/warehouse/recruitment main layouts.

Rules:

- Preserve Bright School scrapbook/campus visual identity and existing responsive artboard behavior.
- Keep image assets, hand-drawn decoration, and complex art positioning CSS-owned until tokenized safely.
- Migrate layout and state affordances before migrating decorative background art.

Verification:

- Desktop and mobile screenshots for home/lobby/commerce.
- Static CSS contracts and `npm run build`.

Progress:

- `src/home/homeComponents.jsx` exposes `HomeActionButton`, the first Phase 5 home-flow wrapper around `src/ui/primitives/Button.jsx`. It maps semantic home action variants back to existing `.primary-action`, `.secondary-action`, and `.danger-action` visual classes while `Button` owns only the low-risk `tw:inline-flex`, `tw:items-center`, `tw:justify-center`, and `tw:gap-2` alignment utilities.
- `MatchModePicker` in `src/home/HomeScreen.jsx` uses `HomeActionButton` only for the match-mode cancel action. The existing modal/home/mobile CSS still owns match-mode layout, option buttons, spacing, artboard behavior, decorative imagery, colors, borders, shadows, typography, and responsive safety. This pilot does not authorize migration of home entry cards, home utility entries, player plaque art, match-mode option buttons, shop/warehouse/recruitment cards, or gameplay controls without separate focused desktop/mobile tests and visual checks.

### Phase 6: Bright School Theme Tokenization

Goal: turn Bright School from high-specificity override CSS into a token-driven theme layer.

Work:

- Convert repeated paper, ink, accent, shadow, border, and selected/disabled state values into semantic CSS variables consumed by Tailwind token utilities and primitives.
- Continue shrinking `surface-contracts/` to explicit owner selectors only.
- Keep future player themes CSS-entry based through `themes.css` until each theme is imported, scoped, and visually verified.

Rules:

- Do not reintroduce broad `[class*="..."]` fallbacks or theme-scoped `*` resets.
- Theme-specific utilities should consume variables, not hard-code a second palette.

Verification:

- Theme contract tests.
- Desktop and mobile visual checks for settings, home, shop/warehouse, leaderboard/friends, and representative modals.

Progress:

- Phase 6 has started as a no-visual-change contract slice. `src/styles/tailwind/tokens.css` now exposes Bright School paper, clean surface, ink, border, accent, and paper shadow scale variables as prefixed Tailwind semantic tokens, while `src/styles/themes/bright-school/surface-contracts/final-root-surfaces.css` and `src/styles/themes/bright-school/quality-base/refinement-foundation.css` remain the Bright School value owners. `src/styles/themeContract.test.js` guards the Bright School token availability and Tailwind mappings.
- No Bright School owner selectors, rule values, import order, board/effect CSS, or final mobile CSS moved in this slice.

### Phase 7: Mobile Safety Layer Reduction

Goal: move stable mobile behavior back into component/primitive ownership so `mobile-adaptive.css` becomes a small final guard instead of a large patch layer.

Work:

- Migrate mobile modal shells, tabs, simple lists, form controls, and non-gameplay action rows after their desktop equivalents are stable.
- Keep final mobile safety rules for phone portrait, landscape, narrow desktop, and Bright School portrait until replacement coverage exists.
- Do not migrate mobile room board, skill, Pixi, or final gameplay controls in this phase.

Verification:

- 375px phone portrait, small phone landscape, narrow desktop, and regular desktop checks for each migrated surface.
- Static CSS contracts.
- `npm run verify:battle-fixes` when mobile room or broad mobile CSS is touched.

Progress:

- Phase 7 has started as a no-visual-change inventory slice. `src/styles/cssLayerInventory.js` records the `mobile-adaptive` final guard reduction candidate and explicitly says not to move final guard rules yet.
- `mobile-adaptive.css` remains the last post-theme safety layer. Future reductions must prove matching desktop/mobile component ownership and must keep phone portrait, small landscape, narrow desktop, and regular desktop checks in scope.

## Later Phases Not Started Here

- Phase 8: Room, board shell, gameplay controls, board geometry, skill presentation, and Pixi canvas. This requires stronger visual regression and stability baselines.
- Phase 9: final cleanup, optional `tw:` prefix reevaluation, and possible preflight reevaluation. Current default is to keep the prefix and keep preflight disabled.

## Technical Notes

- Relevant existing contract: `.trellis/spec/frontend/css-architecture.md`.
- Relevant style entry docs: `src/styles/README.md`.
- Relevant root entry: `src/styles.css`.
- Relevant Tailwind entry: `src/styles/tailwind.css`.
- Relevant CSS inventory and contract tests: `src/styles/cssLayerInventory.js`, `src/styles/cssLayerInventory.test.js`, `src/styles/styleContract.test.js`, `src/styles/themeContract.test.js`, `src/styles/hudComponents.test.js`.
- Relevant system docs: `docs/system-design.md`, `docs/system-design/06-ui-theme-mobile.md`, `docs/system-design/07-performance-tech-debt.md`.
