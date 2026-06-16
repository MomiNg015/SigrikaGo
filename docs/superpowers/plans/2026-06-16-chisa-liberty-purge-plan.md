# Chisa Liberty Purge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Chisa and her `liberty-purge` skill with legal-move targeting, one-liberty group removal, overclock accounting, red-cross board markers, admin ownership, and system docs.

**Architecture:** Extend the existing shared skill system with a dedicated `liberty-purge` action. Keep legal move semantics close to `gameStoneActions`, keep board removal markers independent from `skillEffect`, and let server history drive preview/replay metadata.

**Tech Stack:** JavaScript ES modules, React, Vitest, shared front/back game modules, static CSS, Node docs renderer.

---

### Task 1: Shared Catalog And Character Tests

**Files:**
- Modify: `src/shared/skillEffectCatalog.test.js`
- Modify: `src/shared/gameSkills.test.js`
- Modify: `src/shared/characters.test.js`
- Modify: `server/userAssets.test.js`

- [ ] **Step 1: Write failing tests**

Add expectations that `liberty-purge` appears in catalog order with `targetRule: "legal-move-point"`, that `normalizeSkillConfig("chisa")` returns Chisa skill metadata, that fallback characters include `chisa`, and that admin-owned characters include `chisa`.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- src/shared/skillEffectCatalog.test.js src/shared/gameSkills.test.js src/shared/characters.test.js server/userAssets.test.js`
Expected: FAIL because `liberty-purge` and `chisa` do not exist.

- [ ] **Step 3: Implement minimal catalog and character data**

Update `src/shared/skillEffectCatalog.js`, `src/shared/gameSkills.js`, `src/shared/characterFallback.js`, and `server/userAssets.js`.

- [ ] **Step 4: Run tests to verify GREEN**

Run the same command and expect PASS.

### Task 2: Liberty Purge Rule Tests

**Files:**
- Modify: `src/shared/game.test.js`
- Modify: `src/shared/gameSkillActions.js`
- Modify: `src/shared/gameSkillHandlers.js`
- Modify: `src/shared/game.js`
- Modify: `src/shared/gameStoneActions.js` if helper extraction is needed

- [ ] **Step 1: Write failing tests**

Add tests for legal placement plus one-liberty snapshot removals, hidden-hand reveal without spending, protocol/ko/suicide rejection, neutral overclock behavior, friendly removal clamping, `skillRemovals`, `ko = null`, turn consumption, and ChangLi unlock history.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- src/shared/game.test.js src/shared/gameSkillHandlers.test.js src/shared/gameSkillRegistry.test.js`
Expected: FAIL because handler is not registered and behavior is absent.

- [ ] **Step 3: Implement minimal shared rules**

Add `libertyPurge` action, register it in handlers, add any normal-move placement helper needed to preserve legality without color illusion, and record detailed history.

- [ ] **Step 4: Run tests to verify GREEN**

Run the same command and expect PASS.

### Task 3: Preview, Replay, And Marker Metadata Tests

**Files:**
- Modify: `src/shared/boardView.test.js`
- Modify: `server/rooms.test.js`
- Modify: `server/roomSkillResolution.js`
- Modify: `src/room/roomView.js`

- [ ] **Step 1: Write failing tests**

Assert Chisa preview excludes occupied, protocol-banned, and ko points; pending preview includes removal marker ids; replay replays Chisa as a skill action.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- src/shared/boardView.test.js server/rooms.test.js`
Expected: FAIL before preview metadata and replay support exist.

- [ ] **Step 3: Implement metadata and replay support**

Extend pending skill preview with `removalMarkIds` or equivalent, and replay `liberty-purge` through `useSkill`.

- [ ] **Step 4: Run tests to verify GREEN**

Run the same command and expect PASS.

### Task 4: Board Red-Cross Rendering And Cleanup

**Files:**
- Modify: `src/room/Board.test.js`
- Modify: `src/room/Board.jsx`
- Modify: `src/styles/room/board.css`
- Modify: shared rule cleanup helpers where turn advancement clears marker state

- [ ] **Step 1: Write failing tests**

Assert board renders red-cross markers from independent marker state without removing protocol marks or other skill effects, and marker state clears after the opponent completes a real turn.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- src/room/Board.test.js src/shared/game.test.js`
Expected: FAIL before marker rendering/cleanup exists.

- [ ] **Step 3: Implement marker rendering and cleanup**

Add marker state to game snapshots and render a `.liberty-purge-removal-mark` child inside board points.

- [ ] **Step 4: Run tests to verify GREEN**

Run the same command and expect PASS.

### Task 5: Asset And System Docs

**Files:**
- Create: `public/assets/characters/chisa.png`
- Modify: `docs/system-design.md`
- Modify: relevant `docs/system-design/*.md`
- Generate: `docs/system-design.html`

- [ ] **Step 1: Copy asset**

Copy `C:/codex/image/?????/chikusa.png` to `public/assets/characters/chisa.png` without modifying the source.

- [ ] **Step 2: Update docs with Node UTF-8 writer**

Use Node or `scripts/write-utf8-doc.mjs`; do not use PowerShell `Set-Content` for Chinese Markdown.

- [ ] **Step 3: Regenerate docs**

Run: `npm run docs:system-design`.

### Task 6: Final Verification

**Files:**
- All touched files

- [ ] **Step 1: Run targeted tests**

Run: `npm test -- src/shared/game.test.js src/shared/gameSkills.test.js src/shared/skillEffectCatalog.test.js src/shared/characters.test.js src/shared/boardView.test.js src/room/Board.test.js server/userAssets.test.js server/rooms.test.js server/skillRegistry.test.js src/shared/gameSkillHandlers.test.js src/shared/gameSkillRegistry.test.js`.

- [ ] **Step 2: Run docs generation**

Run: `npm run docs:system-design` if not already run after final docs edits.

- [ ] **Step 3: Inspect dirty diff**

Run: `git status --porcelain` and `git diff --stat`; report only files touched for Chisa, and call out unrelated pre-existing dirty files.
