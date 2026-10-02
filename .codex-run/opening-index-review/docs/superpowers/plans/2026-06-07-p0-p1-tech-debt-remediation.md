# P0/P1 Tech Debt Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the highest-risk UI, room-action, and skill-extension technical debt without changing user-facing gameplay behavior.

**Architecture:** Add a browser E2E foundation for the UI regressions that unit tests cannot observe, strengthen CSS layer contracts, isolate development-only room test actions, and move concrete shared skill handlers behind a registry-facing module. Runtime APIs stay stable.

**Tech Stack:** React, Vite, Vitest, Playwright, Socket.IO, shared ES modules, CSS import contracts.

---

### Task 1: Browser Regression Foundation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `playwright.config.js`
- Create: `tests/e2e/ui-regressions.spec.js`

- [ ] Add `@playwright/test` as a development dependency.
- [ ] Add `test:e2e` and `test:e2e:ui` scripts.
- [ ] Configure Playwright to start `npm run dev` and test `http://127.0.0.1:5173`.
- [ ] Add a deterministic smoke test that loads the app shell and checks the generated CSS bundle contains semantic guards for replay outcomes, skill targeting effects, and scoring markers.
- [ ] Run `npm run test:e2e`.

### Task 2: CSS Contract Guard

**Files:**
- Modify: `src/styles/themeContract.test.js`

- [ ] Add a contract test that reads the full theme CSS tree and verifies final semantic rules exist for replay outcome hover/focus colors, result badge colors, skill spent colors, Bright School targeting animations, and centered scoring/dead-stone marks.
- [ ] Run `npm test -- src/styles/themeContract.test.js`.

### Task 3: Dev Test Action Isolation

**Files:**
- Create: `server/roomTestActions.js`
- Create: `server/roomTestActions.test.js`
- Modify: `server/rooms.js`

- [ ] Move test action identification and execution to `server/roomTestActions.js`.
- [ ] Keep production gating through `canUseDebugTestActions(process.env)`.
- [ ] Preserve existing user-facing messages and byo-yomi reset behavior.
- [ ] Run `npm test -- server/roomTestActions.test.js server/rooms.test.js`.

### Task 4: Shared Skill Handler Extraction

**Files:**
- Create: `src/shared/gameSkillHandlers.js`
- Create: `src/shared/gameSkillHandlers.test.js`
- Modify: `src/shared/game.js`

- [ ] Move concrete active skill handler map from `game.js` into `gameSkillHandlers.js`.
- [ ] Export a focused `executeActiveSkillHandler()` that delegates through `executeRegisteredSkill`.
- [ ] Keep `useSkill()` external behavior unchanged.
- [ ] Run `npm test -- src/shared/gameSkillHandlers.test.js src/shared/game.test.js src/shared/gameSkillRegistry.test.js`.

### Task 5: Documentation And Verification

**Files:**
- Modify: `docs/system-design.md`
- Modify: `docs/system-design.html`

- [ ] Document the E2E foundation, CSS semantic contract, isolated room test actions, and shared skill handler extraction.
- [ ] Run `npm run docs:system-design`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Run `npm run test:e2e`.
