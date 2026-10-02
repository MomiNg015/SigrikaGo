# Admin Labels, Replays, And Skill Costs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Chinese admin labels with hover help, admin user replay access, configurable skill cost metadata, editable skill system messages, and admin-driven shop/decoration management.

**Architecture:** Extend `CharacterSkill` with cost metadata and a system message template, carry it through validation and public/admin payloads, and make the shared game engine apply numeric configured costs. Add admin-only replay endpoints and connect them to the existing replay screen. Add `Decoration` and `ShopItem` records, public shop listing/purchase endpoints, and admin CRUD-style management routes. Keep UI changes inside `src/main.jsx` with small helpers to match the current single-file frontend pattern.

**Tech Stack:** React/Vite frontend, Express admin API, Prisma SQLite schema, Vitest tests.

---

### Task 1: Backend Cost Contract

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `server/characters.js`
- Modify: `server/adminRoutes.js`
- Modify: `src/shared/game.js`
- Test: `server/characters.test.js`
- Test: `src/shared/game.test.js`

- [ ] Add failing tests for `costType` and `costValue` validation and payload serialization.
- [ ] Run focused tests and verify they fail on missing fields.
- [ ] Add Prisma fields and backend validation/payload mapping.
- [ ] Update shared game skill cost application to use configured numeric costs.
- [ ] Run focused tests and verify they pass.

### Task 2: Admin Replay Access

**Files:**
- Modify: `server/adminRoutes.js`
- Test: `server/adminRoutes.test.js`

- [ ] Add failing route tests for listing a user's records and reading any replay snapshot.
- [ ] Implement `GET /api/admin/users/:id/replays` and `GET /api/admin/replays/:id`.
- [ ] Run focused tests and verify they pass.

### Task 3: Admin UI

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/styles.css`

- [ ] Add reusable Chinese admin label helper with tooltip support.
- [ ] Replace admin form labels with Chinese labels and explanatory titles.
- [ ] Add cost type/select and cost value input behavior.
- [ ] Add user replay drawer/list and open selected replay through existing replay state.

### Task 4: Verification

**Files:**
- Modify as needed based on test/build feedback.

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Run `$env:DATABASE_URL='file:./dev.db'; npx prisma validate`.
- [ ] Run `$env:DATABASE_URL='file:./dev.db'; npm run prisma:push`.

### Task 5: Shop, Decorations, And Skill Messages

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `server/shop.js`
- Modify: `server/index.js`
- Modify: `server/adminRoutes.js`
- Modify: `server/rooms.js`
- Modify: `src/main.jsx`
- Modify: `src/styles.css`
- Test: `server/shop.test.js`
- Test: `server/adminRoutes.test.js`
- Test: `server/rooms.test.js`

- [ ] Add `systemMessage` to skill data and render it in skill-use system notices.
- [ ] Add decoration and shop item schema/routes/validation.
- [ ] Add player shop listing and purchase flow with coin deduction and ownership updates.
- [ ] Add admin shop and decoration management UI.
- [ ] Show save success feedback without leaving the current editor.
