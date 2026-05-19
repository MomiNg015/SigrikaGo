# Technical Debt Reduction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the highest-impact technical debt without changing player-visible behavior.

**Architecture:** Keep each debt item in a separate commit so behavior changes and refactors stay reviewable. Start with low-risk React component extraction, then move toward room orchestration, persistence shape, and browser-level verification.

**Tech Stack:** React, Vite, Socket.IO, Express, Prisma, Vitest, CSS.

---

## File Structure

- Modify `src/main.jsx`: remove extracted screen/modal components while keeping app orchestration in place.
- Create `src/home/HomeScreen.jsx`: own the home screen layout and utility entry buttons.
- Modify `docs/system-design.md`: record each completed extraction or debt decision.
- Later tasks will add focused files under `src/room/`, `src/modals/`, and `server/rooms/` as they are tackled.

## Task 1: Commit Current Rank Work

- [x] **Step 1: Verify working tree contains only rank binding changes**

Run: `git status --short`

Expected: rank helper, user serialization, admin user editor, tests, and `docs/system-design.md`.

- [x] **Step 2: Commit rank work independently**

Run: `git add ... && git commit -m "Derive user rank from rating"`

Expected: one commit containing only rank binding changes.

## Task 2: Extract Home Screen

**Files:**
- Create: `src/home/HomeScreen.jsx`
- Modify: `src/main.jsx`
- Modify: `docs/system-design.md`

- [x] **Step 1: Move `HomeScreen` into its own module**

Create `src/home/HomeScreen.jsx` with the existing JSX and icon imports needed by the home screen.

- [x] **Step 2: Replace inline component in `src/main.jsx` with an import**

Import `HomeScreen` from `./home/HomeScreen.jsx` and delete the inline `HomeScreen` function.

- [x] **Step 3: Keep behavior unchanged**

The extracted component must keep the same props, classes, buttons, titles, user/rank display, selected-character portrait, admin-only backend button, settings button, and logout button.

- [x] **Step 4: Update system design**

Document that the home screen has moved from `src/main.jsx` to `src/home/HomeScreen.jsx`.

- [x] **Step 5: Verify**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected: all tests pass, production build succeeds, no whitespace errors.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/main.jsx src/home/HomeScreen.jsx docs/system-design.md docs/superpowers/plans/2026-05-19-technical-debt-reduction.md
git commit -m "Extract home screen component"
```

## Task 3: Next P0 Candidates

- [ ] Extract room socket lifecycle from `App` into a focused hook.
- [ ] Extract `RoomScreen` into `src/room/RoomScreen.jsx` after the hook boundary is stable.
- [ ] Split result, settings, shop, leaderboard, watch, and house modals into `src/modals/`.
- [ ] Add a small browser smoke-test path for login, home screen, and opening core modals.

## Task 4: Next P1/P2 Candidates

- [ ] Design Prisma relations for owned characters, decorations, and music tracks.
- [ ] Design DB/API-backed music and voice asset configuration.
- [ ] Decide whether generated `docs/system-design.html` and `docs/system-design.pdf` remain committed artifacts or become generated outputs.
