# SigrikaGo Tailwind Full Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move SigrikaGo toward a Tailwind-first styling model without visual drift, while preserving gameplay, Bright School, Pixi skill presentation, and final mobile safety contracts.

**Architecture:** Tailwind remains a prefixed, no-preflight utility layer imported by `src/styles/tailwind.css` between `hud-components.css` and `themes.css`. Migration proceeds through semantic tokens and React primitives first, then domain wrappers, then individual UI surfaces; CSS stays authoritative for board geometry, Pixi hosts, skill keyframes, complex theme art, and final mobile guard rules until each protected surface has visual regression evidence.

**Tech Stack:** React 19, Vite, Tailwind CSS v4 through `@tailwindcss/vite`, Vitest, existing CSS contract tests, Playwright stability and visual checks where required.

---

## Current Baseline

- Branch: `codex/css-tidy`.
- Trellis task: `.trellis/tasks/07-01-tailwind-migration-roadmap`.
- Tailwind entry: `src/styles/tailwind.css`.
- Token entry: `src/styles/tailwind/tokens.css`.
- Contract inventory: `src/styles/cssLayerInventory.js`.
- Tailwind posture: `tw:` prefix, no preflight, `source("../")` on utilities import.
- Current started slices:
  - Phase 1: contract and token scaffold.
  - Phase 2: admin audit table shell pilot through `AdminTableScroll`.
  - Phase 3: `ScrollArea`, `Badge`, `EmptyState`, `Button`, and local wrappers.
  - Phase 4: `ModalActionButton` narrow action wrapper pilot.
  - Phase 5: `HomeActionButton` narrow match-mode cancel pilot.
  - Phase 6: Bright School token bridge only.
  - Phase 7: final mobile guard inventory only.

## Non-Negotiable Invariants

- Keep `src/styles.css` import order: shared/domain entries, terminal/HUD entries, `hud-components.css`, `tailwind.css`, `themes.css`.
- Keep `themes.css` importing `mobile-adaptive.css` last.
- Keep Tailwind preflight disabled.
- Keep the `tw:` prefix unless a separate architecture decision and regression suite replaces it.
- Keep `source("../")` on `tailwindcss/utilities.css`.
- Do not create new global substring selectors such as `[class*="card"]`, `[class*="row"]`, `[class*="setting"]`, or `[class*="panel"]`.
- Do not migrate board geometry, board point buttons, `.board-lines`, `.board-effects-canvas`, skill DOM marks, Pixi canvas hosts, skill keyframes, Bright School final mobile safety, or mobile gameplay controls without the Phase 8 gate.
- Each responsive surface must migrate desktop and mobile behavior in the same task unless the task explicitly proves one viewport is unaffected.
- Old CSS can be deleted only when the new primitive or domain wrapper fully owns the same behavior and focused tests cover the replacement.

## File Responsibility Map

- `.trellis/tasks/07-01-tailwind-migration-roadmap/prd.md`: task scope, accepted phase boundaries, progress log.
- `.trellis/tasks/07-01-tailwind-migration-roadmap/tailwind-full-migration-plan.md`: this execution plan and future handoff artifact.
- `.trellis/spec/frontend/css-architecture.md`: durable CSS and Tailwind architecture rules for future agents.
- `.trellis/spec/frontend/component-guidelines.md`: primitive and wrapper usage rules.
- `src/styles/README.md`: developer-facing style entry and migration rules.
- `src/styles/tailwind.css`: the only Tailwind CSS entry.
- `src/styles/tailwind/tokens.css`: Tailwind semantic token bridge.
- `src/styles/cssLayerInventory.js`: machine-readable phase inventory, pilots, exclusions, and verification gates.
- `src/styles/cssLayerInventory.test.js`: phase, inventory, and exclusion contracts.
- `src/styles/styleContract.test.js`: import order, entry, file-size, and layer contracts.
- `src/styles/themeContract.test.js`: Bright School and theme token contracts.
- `docs/system-design.md`: system-design entry summary.
- `docs/system-design/06-ui-theme-mobile.md`: theme and mobile safety details.
- `docs/system-design/07-performance-tech-debt.md`: long-term CSS/Tailwind technical-debt route.

## Phase Gate Matrix

| Phase | Scope | Can change JSX | Can delete CSS | Required evidence |
|---|---|---:|---:|---|
| 1 | Contracts and tokens | No | No | CSS contracts, docs generation |
| 2 | Isolated admin/tooling pilots | Yes | Yes, for matching pilot slice | Focused admin tests, CSS contracts, build |
| 3 | UI primitives and local wrappers | Yes | Only CSS made redundant by wrapper ownership | Primitive tests, consumer tests, CSS contracts |
| 4 | Shared modal/list/card/form internals | Yes | One domain slice at a time | Focused modal tests, desktop/mobile checks, CSS contracts |
| 5 | Home/lobby/commerce non-gameplay | Yes | One surface at a time | Desktop/mobile screenshots or Playwright checks, build |
| 6 | Bright School tokens | Limited | Only duplicate values after variable ownership is proven | Theme contracts, desktop/mobile visual checks |
| 7 | Final mobile guard reduction | Yes | Yes, only after component ownership exists | Phone portrait, landscape, narrow desktop, regular desktop checks |
| 8 | Room, board, Pixi, skill, gameplay controls | Yes, gated | Yes, gated | `verify:battle-fixes`, skill stability, visual regression baseline |
| 9 | Final cleanup and policy reevaluation | Limited | Yes | Full check, inventory audit, explicit architecture decision |

---

### Task 1: Keep Phase 1 As The Contract Baseline

**Files:**
- Modify: `src/styles/tailwind.css`
- Modify: `src/styles/tailwind/tokens.css`
- Modify: `src/styles/cssLayerInventory.js`
- Modify: `src/styles/cssLayerInventory.test.js`
- Modify: `src/styles/styleContract.test.js`
- Modify: `src/styles/themeContract.test.js`
- Modify: `.trellis/spec/frontend/css-architecture.md`
- Modify: `src/styles/README.md`
- Modify: `docs/system-design.md`
- Modify: `docs/system-design/07-performance-tech-debt.md`

- [ ] **Step 1: Verify the current Tailwind entry contract**

Run:

```powershell
npm test -- src/styles/cssLayerInventory.test.js src/styles/styleContract.test.js src/styles/themeContract.test.js
```

Expected: all CSS contract tests pass. If a failure mentions preflight, prefix, `source("../")`, or import order, fix the contract before migrating any UI.

- [ ] **Step 2: Add failing contracts before any new Tailwind phase**

When adding a phase or pilot, first extend `CSS_UTILITY_LAYER_DECISION` and `cssLayerInventory.test.js` with the exact new phase or pilot name. The expected first run is a focused failure proving the test sees the missing or incomplete phase metadata.

Run:

```powershell
npm test -- src/styles/cssLayerInventory.test.js
```

Expected before implementation: a failure naming the missing phase, pilot, guidance string, or exclusion.

- [ ] **Step 3: Implement only contract or token metadata**

Allowed implementation in Phase 1:

```css
@theme inline {
  --color-sigrika-paper: var(--bright-paper, #fffbf2);
  --shadow-sigrika-paper: var(--bright-shadow, 4px 4px 0 #3d2b25);
}
```

Do not add JSX `tw:` usage in Phase 1. Do not delete visual CSS in Phase 1.

- [ ] **Step 4: Regenerate docs for architecture changes**

Run:

```powershell
npm run docs:system-design
npm test -- docs/systemDesignHtml.test.js
```

Expected: generated HTML is up to date and the docs test passes.

### Task 2: Finish Low-Risk Admin And Tooling Migration Slices

**Files:**
- Modify: `src/admin/adminComponents.jsx`
- Modify: `src/admin/*.jsx` only for selected admin-only consumers
- Modify: `src/styles/admin/shared-surfaces.css`
- Modify: `src/styles/admin/*.css` only when the exact migrated slice becomes redundant
- Test: `src/admin/AdminTableScroll.test.jsx`
- Test: `src/admin/AdminTableEmpty.test.jsx`
- Test: selected admin component tests for the touched consumer

- [ ] **Step 1: Pick one isolated admin slice**

Allowed examples:

- Table overflow shell already using `.admin-table-wrap`.
- Empty table row copy.
- Small badge/status pill alignment.
- Admin action button alignment.

Disallowed examples:

- Player-facing modals.
- Room controls.
- Board or skill display.
- Bright School theme repairs.

- [ ] **Step 2: Write or extend the focused test**

For table scroll wrappers, assert the consumer renders the domain wrapper instead of owning raw overflow classes:

```jsx
expect(screen.getByTestId("admin-table-scroll")).toHaveClass("tw:max-w-full");
expect(screen.getByTestId("admin-table-scroll")).toHaveClass("tw:overflow-x-auto");
```

Run:

```powershell
npm test -- src/admin/AdminTableScroll.test.jsx
```

Expected before implementation: fail when the wrapper or expected `tw:` utility is absent.

- [ ] **Step 3: Move the utility into a primitive or admin wrapper**

Keep raw utility strings out of feature components when the pattern repeats. Use `src/ui/primitives/*` for generic behavior and `src/admin/adminComponents.jsx` for admin semantics.

Allowed shape:

```jsx
<AdminTableScroll>
  <table className="admin-table">...</table>
</AdminTableScroll>
```

Disallowed shape:

```jsx
<div className="tw:max-w-full tw:overflow-x-auto admin-table-wrap">
```

- [ ] **Step 4: Delete only the old CSS rule that is now redundant**

Delete admin CSS only when the wrapper owns the exact property. Keep visual shell rules such as border, radius, margin, background, table min-width, and typography unless the new component owns those values and tests cover them.

- [ ] **Step 5: Verify the slice**

Run:

```powershell
npm test -- src/admin/AdminTableScroll.test.jsx src/admin/AdminTableEmpty.test.jsx
npm test -- src/styles/cssLayerInventory.test.js src/styles/styleContract.test.js src/styles/themeContract.test.js
npm run build
```

Expected: focused tests, CSS contracts, and build pass.

### Task 3: Expand The Primitive Layer Before Broad UI Migration

**Files:**
- Modify: `src/ui/classNames.js`
- Modify/Create: `src/ui/primitives/Button.jsx`
- Modify/Create: `src/ui/primitives/IconButton.jsx`
- Modify/Create: `src/ui/primitives/ModalShell.jsx`
- Modify/Create: `src/ui/primitives/DialogActions.jsx`
- Modify/Create: `src/ui/primitives/Tabs.jsx`
- Modify/Create: `src/ui/primitives/FormField.jsx`
- Modify/Create: `src/ui/primitives/Input.jsx`
- Modify/Create: `src/ui/primitives/Select.jsx`
- Modify/Create: `src/ui/primitives/Textarea.jsx`
- Modify/Create: `src/ui/primitives/ListRow.jsx`
- Modify/Create: `src/ui/primitives/CardSurface.jsx`
- Test: matching `*.test.jsx` files beside each primitive
- Modify: `.trellis/spec/frontend/component-guidelines.md`

- [ ] **Step 1: Add one primitive at a time**

Preferred order:

1. `IconButton`
2. `DialogActions`
3. `FormField`
4. `Input`
5. `Select`
6. `Textarea`
7. `Tabs`
8. `ListRow`
9. `CardSurface`
10. `ModalShell`

- [ ] **Step 2: Write the primitive contract test first**

For `IconButton`, assert semantic behavior and stable hit target utility classes:

```jsx
render(<IconButton aria-label="Close" icon={<span aria-hidden="true">x</span>} />);
expect(screen.getByRole("button", { name: "Close" })).toHaveClass("tw:inline-flex");
expect(screen.getByRole("button", { name: "Close" })).toHaveClass("tw:items-center");
expect(screen.getByRole("button", { name: "Close" })).toHaveClass("tw:justify-center");
```

Run:

```powershell
npm test -- src/ui/primitives/IconButton.test.jsx
```

Expected before implementation: fail because the primitive does not exist or lacks required semantics.

- [ ] **Step 3: Implement the primitive with minimal visual ownership**

Each primitive may own low-risk layout utilities, accessibility attributes, and semantic variant composition. Existing CSS keeps color, shadow, border, typography, complex spacing, and theme art until a domain migration explicitly transfers ownership.

- [ ] **Step 4: Add a domain wrapper before migrating feature consumers**

Examples:

- Admin uses `AdminActionButton`.
- Modals use `ModalActionButton`.
- Home uses `HomeActionButton`.
- Commerce can use `CommerceActionButton`.

Feature components should consume wrappers, not generic primitives directly, when the existing visual contract is domain-specific.

- [ ] **Step 5: Verify primitive and consumer coverage**

Run:

```powershell
npm test -- src/ui/classNames.test.js src/ui/primitives/Button.test.jsx src/ui/primitives/ScrollArea.test.jsx src/ui/primitives/Badge.test.jsx src/ui/primitives/EmptyState.test.jsx
npm test -- src/styles/cssLayerInventory.test.js
```

Expected: primitive tests and inventory contracts pass.

### Task 4: Migrate Shared Modal, List, Card, And Form Internals Domain By Domain

**Files:**
- Modify: `src/modals/modalComponents.jsx`
- Modify: selected files under `src/modals/**`
- Modify: selected files under `src/styles/modals/**`
- Modify: selected files under `src/styles/mobile-modals/**`
- Modify: selected files under `src/styles/commerce/**`
- Modify: focused Bright School repair files only when the selected modal surface is covered
- Test: focused modal tests for the touched component

- [ ] **Step 1: Choose one modal or one repeated internal pattern**

Recommended order:

1. Dialog action rows.
2. Modal headers.
3. Segmented tabs.
4. Empty states.
5. Simple list rows.
6. Form fields.
7. Card surfaces.
8. Full modal shells.

- [ ] **Step 2: Capture the current class and CSS owner**

Before editing, identify:

- JSX component path.
- Existing CSS files that style the surface.
- Desktop behavior.
- Mobile behavior.
- Bright School override files that affect the same surface.

Record the finding in the Trellis PRD progress section when the slice lands.

- [ ] **Step 3: Write focused tests for the wrapper or component**

For an action row wrapper:

```jsx
expect(screen.getByRole("button", { name: "保存" })).toHaveClass("primary-action");
expect(screen.getByRole("button", { name: "保存" })).toHaveClass("tw:inline-flex");
```

Expected: the visual class remains present while the primitive owns the low-risk layout utility.

- [ ] **Step 4: Migrate the selected surface**

Use domain wrappers such as `ModalActionButton`, `ModalListRow`, or `ModalEmptyState`. Do not move unrelated modal logic, copy, or data flow in the same slice.

- [ ] **Step 5: Delete CSS only after ownership is complete**

Do not delete shared `.primary-action`, `.secondary-action`, `.danger-action`, modal shell, row, card, or form CSS while wrappers only own alignment utilities. Delete a CSS block only when every selector in that block maps to the migrated component and tests cover desktop and mobile behavior.

- [ ] **Step 6: Verify the modal slice**

Run:

```powershell
npm test -- src/modals/ModalActionButton.test.jsx
npm test -- src/styles/cssLayerInventory.test.js src/styles/styleContract.test.js src/styles/themeContract.test.js
npm run build
```

Expected: modal tests, CSS contracts, and build pass.

### Task 5: Migrate Home, Lobby, And Commerce Non-Gameplay Flows

**Files:**
- Modify: `src/home/homeComponents.jsx`
- Modify: `src/home/HomeScreen.jsx`
- Modify: selected lobby, shop, warehouse, recruitment, friends, leaderboard, and watch-list components
- Modify: selected files under `src/styles/base/**`, `src/styles/lobby/**`, `src/styles/commerce/**`, `src/styles/mobile-home/**`, and Bright School home/commerce repair layers
- Test: focused component tests for each touched consumer

- [ ] **Step 1: Start with controls, lists, and simple layout shells**

Recommended order:

1. Home and lobby action buttons.
2. Watch-list and friend-list rows.
3. Shop/warehouse empty states.
4. Shop/warehouse list shells.
5. Recruitment non-board controls.
6. Home utility controls.

Do not start with image-art cards, player plaque art, match-mode option cards, decorative backgrounds, or commerce product cards.

- [ ] **Step 2: Preserve current Bright School visual ownership**

Artboard behavior, image assets, hand-drawn decoration, paper textures, hard shadows, and responsive background positioning remain CSS-owned until tokenization and visual checks prove replacement safety.

- [ ] **Step 3: Write focused tests around the migrated wrapper**

For `HomeActionButton`, keep the visual class and the utility class:

```jsx
expect(screen.getByRole("button", { name: "取消" })).toHaveClass("secondary-action");
expect(screen.getByRole("button", { name: "取消" })).toHaveClass("tw:inline-flex");
```

- [ ] **Step 4: Run desktop and mobile checks for each player-facing slice**

At minimum inspect:

- Desktop home.
- 375px phone portrait home.
- Narrow desktop home.
- The exact modal or flow touched by the slice.

Use Playwright or the existing local browser workflow. Save notes in the PRD progress section.

- [ ] **Step 5: Verify the slice**

Run:

```powershell
npm test -- src/home/HomeActionButton.test.jsx
npm test -- src/styles/cssLayerInventory.test.js src/styles/styleContract.test.js src/styles/themeContract.test.js
npm run build
```

Expected: focused tests, CSS contracts, and build pass.

### Task 6: Tokenize Bright School Without Moving Theme Owner Rules Prematurely

**Files:**
- Modify: `src/styles/tailwind/tokens.css`
- Modify: `src/styles/themes/bright-school/surface-contracts/final-root-surfaces.css`
- Modify: `src/styles/themes/bright-school/quality-base/refinement-foundation.css`
- Modify: selected Bright School owner files only after token ownership is proven
- Modify: `src/styles/themeContract.test.js`
- Modify: `.trellis/spec/frontend/css-architecture.md`
- Modify: `src/styles/README.md`

- [ ] **Step 1: Add token contract tests first**

For every token family, assert both sides:

- Bright School still defines the source CSS variable.
- Tailwind token maps to that variable.

Run:

```powershell
npm test -- src/styles/themeContract.test.js
```

Expected before token implementation: fail with a missing variable or missing Tailwind mapping.

- [ ] **Step 2: Map values through `@theme inline`**

Allowed token pattern:

```css
@theme inline {
  --color-sigrika-accent: var(--bright-pink, #ff9ebb);
}
```

Disallowed token pattern:

```css
@theme inline {
  --color-sigrika-accent: #ff00ff;
}
```

unless the hard-coded value is already the stable project token and no Bright School variable exists.

- [ ] **Step 3: Keep owner selectors in Bright School CSS**

Token mapping does not authorize moving selectors out of Bright School CSS. Move a selector only when the consumer primitive uses the token and visual checks prove no desktop or mobile drift.

- [ ] **Step 4: Migrate duplicate values in small groups**

Recommended groups:

1. Paper and sheet surfaces.
2. Ink and muted text.
3. Borders and hard shadows.
4. Pink, blue, mint, success, danger, and disabled states.
5. Focus rings and selected states.

- [ ] **Step 5: Verify Bright School**

Run:

```powershell
npm test -- src/styles/themeContract.test.js src/styles/styleContract.test.js
npm run build
```

Manual or Playwright checks must include settings, home, shop/warehouse, leaderboard/friends, and representative modals on desktop and phone portrait.

### Task 7: Reduce `mobile-adaptive.css` Only After Component Ownership Exists

**Files:**
- Modify: `src/styles/mobile-adaptive.css`
- Modify: selected files under `src/styles/mobile-adaptive/**`
- Modify: component or primitive files that will own the replacement behavior
- Modify: `src/styles/cssLayerInventory.js`
- Modify: `src/styles/styleContract.test.js`
- Test: focused component tests for the replacement owner

- [ ] **Step 1: Classify the mobile rule before moving it**

Allowed Phase 7 candidates:

- Modal shell sizing after desktop modal shell is primitive-owned.
- Modal tabs after desktop tabs are primitive-owned.
- Simple list row layout after desktop list rows are primitive-owned.
- Form controls after desktop form controls are primitive-owned.
- Non-gameplay action rows after desktop action rows are primitive-owned.

Disallowed Phase 7 candidates:

- Room board viewport.
- Board point buttons.
- Skill controls.
- Pixi hosts.
- Mobile gameplay dock controls.
- Bright School final portrait battle-room safety.

- [ ] **Step 2: Prove the replacement owner**

Write a component or primitive test showing the replacement class, role, and responsive state exist before deleting the mobile guard rule.

- [ ] **Step 3: Move or delete only the matching final-guard rule**

Delete a `mobile-adaptive` rule only when:

- The new owner covers the same selector behavior.
- The selector is not part of gameplay, board, Pixi, or skill surfaces.
- Phone portrait, small landscape, narrow desktop, and regular desktop checks pass.

- [ ] **Step 4: Verify final mobile safety**

Run:

```powershell
npm test -- src/styles/cssLayerInventory.test.js src/styles/styleContract.test.js src/styles/themeContract.test.js
npm run verify:battle-fixes
```

Expected: CSS contracts and battle/mobile safety checks pass.

### Task 8: Establish The Protected Gameplay And Skill Visual Baseline Before Migration

**Files:**
- Modify/Create: visual baseline test or capture artifacts under the existing test structure selected for this project
- Modify: `src/styles/cssLayerInventory.js`
- Modify: `src/styles/cssLayerInventory.test.js`
- Modify: `docs/system-design/06-ui-theme-mobile.md`
- Modify: `docs/system-design/07-performance-tech-debt.md`

- [ ] **Step 1: Create a protected-surface baseline checklist**

Required scenes:

- Desktop room board with normal placement.
- Mobile room portrait board with point confirmation.
- Mobile room landscape board.
- At least one Pixi skill cast.
- At least one DOM skill mark after resolution.
- Result modal after a skill-enabled room.
- Reduced-motion skill surface.

- [ ] **Step 2: Run existing protected checks before touching CSS**

Run:

```powershell
npm run verify:battle-fixes
npm run verify:stability -- tests/stability/skill-effects.spec.js
```

Expected: checks pass before any protected migration begins. If they fail, fix or record the unrelated failure before migrating protected CSS.

- [ ] **Step 3: Keep protected migration opt-in**

Each protected migration requires a separate task or PRD section naming the exact surface, visual baseline, rollback path, and commands. Do not bundle protected migration with admin, modal, home, or token work.

### Task 9: Execute Protected Gameplay Migration Only With Visual Regression Evidence

**Files:**
- Modify: selected files under `src/styles/room/**`
- Modify: selected files under `src/styles/mobile-room/**`
- Modify: selected files under `src/styles/themes/bright-school/effects/**`
- Modify: selected files under `src/styles/themes/bright-school/quality-base/refinement-board/**`
- Modify: selected board, skill, or Pixi host React files only when the selected protected surface requires component ownership
- Test: existing board, skill, and stability tests plus new focused tests for the selected surface

- [ ] **Step 1: Choose one protected surface**

Allowed protected slices:

- A non-interactive board frame wrapper.
- A non-Pixi skill status chip.
- A gameplay action row after mobile and desktop owners exist.
- A skill mark only after its Pixi/DOM timing is baselined.

Do not start with point positioning, grid SVG sizing, Pixi canvas stacking, skill keyframes, or row-slash timing.

- [ ] **Step 2: Add a focused regression test before moving styles**

The test must fail if the selected surface loses geometry, stacking, timing, or interaction semantics.

- [ ] **Step 3: Move only low-risk utilities**

Permitted Tailwind ownership:

- Wrapper display mode.
- Non-geometric flex alignment.
- Text alignment for non-board labels.
- Overflow containment for non-canvas panels.

CSS remains owner for:

- Absolute board point coordinates.
- SVG grid dimensions.
- Canvas stacking and z-index.
- Transform composition for point centering.
- Skill animation keyframes.
- Effect timing variables.

- [ ] **Step 4: Verify protected migration**

Run:

```powershell
npm run verify:battle-fixes
npm run verify:stability -- tests/stability/skill-effects.spec.js
npm run check
```

Expected: battle, skill stability, and full check pass.

### Task 10: Final Cleanup, Metrics, And Policy Reevaluation

**Files:**
- Modify: `src/styles/cssLayerInventory.js`
- Modify: `src/styles/cssLayerInventory.test.js`
- Modify: `src/styles/README.md`
- Modify: `.trellis/spec/frontend/css-architecture.md`
- Modify: `docs/system-design.md`
- Modify: `docs/system-design/07-performance-tech-debt.md`

- [ ] **Step 1: Audit remaining raw `tw:` usage**

Run:

```powershell
rg -n "tw:" src
```

Expected: repeated utility strings live in primitives or domain wrappers. One-off usage is allowed only for isolated low-risk surfaces with a documented reason.

- [ ] **Step 2: Audit remaining high-risk CSS debt**

Run:

```powershell
rg -n "!important|\\[class\\*=" src/styles
```

Expected: remaining matches are either protected by explicit contracts or scheduled as named cleanup candidates in `cssLayerInventory.js`.

- [ ] **Step 3: Reevaluate `tw:` prefix and preflight only as a separate architecture decision**

Default decision stays:

- Keep `tw:`.
- Keep preflight disabled.

Changing either requires:

- A written architecture note.
- Static contract updates.
- Desktop and mobile screenshots for all migrated route families.
- `npm run check`.

- [ ] **Step 4: Final verification**

Run:

```powershell
npm test -- src/styles/cssLayerInventory.test.js src/styles/styleContract.test.js src/styles/themeContract.test.js
npm run verify:battle-fixes
npm run verify:stability -- tests/stability/skill-effects.spec.js
npm run docs:system-design
npm test -- docs/systemDesignHtml.test.js
npm run check
```

Expected: all checks pass. Record any unrelated pre-existing failure separately from the Tailwind migration result.

## Commit And Handoff Rules

- Commit after each coherent phase slice, not after every file.
- Include tests and docs in the same commit as the migrated slice.
- Do not mix protected gameplay migration with ordinary admin/modal/home migration commits.
- PRD progress entries must name the moved owner, the deleted CSS if any, and the verification commands.
- Future agents should start by reading:
  - `.trellis/tasks/07-01-tailwind-migration-roadmap/prd.md`
  - `.trellis/tasks/07-01-tailwind-migration-roadmap/tailwind-full-migration-plan.md`
  - `.trellis/spec/frontend/css-architecture.md`
  - `src/styles/README.md`
  - `src/styles/cssLayerInventory.js`

## Self-Review

- Spec coverage: this plan covers the requested full staged Tailwind route, current Phase 1-7 work, protected Phase 8+ gates, old CSS deletion rules, desktop/mobile parity, and verification commands.
- Placeholder scan: this plan contains no placeholder task slots; each task names files, allowed scope, commands, and expected outcomes.
- Type consistency: primitive, wrapper, phase, file, and command names match the current repository contracts.
