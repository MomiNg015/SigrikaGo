# SigrikaGo Admin Console Design

## Goal

Build an extensible visual admin console inside the existing SigrikaGo app. Admin users can view and manage all users, and can create, read, update, and disable/delete character records including portrait, name, skill name, skill description, and configurable skill parameters.

## Decisions

- Use `User.role` for authorization. Default users are `player`; administrators are `admin`.
- First admin accounts are promoted from an environment variable such as `ADMIN_USERNAMES=alice,bob`.
- Character portraits support both uploaded images and manually entered URLs or existing paths such as `/assets/sigrika_centered.png`.
- User management includes viewing all users, editing base fields, banning/unbanning, resetting passwords, and adjusting owned/selected characters.
- Skill configuration is data-driven for supported effect types. The admin can edit skill name, description, use count, whether it consumes a turn, target rules, and parameter JSON.
- Admin UI uses the in-app operational console layout: sidebar navigation, top identity area, and dense management views.

## Architecture

The admin console is part of the existing React/Vite frontend. Normal players continue to use the current login, lobby, room, house, and shop flows. Users with `role === "admin"` see an admin entry from the lobby and can navigate to the admin view. The frontend route or view is a convenience only; backend authorization is enforced on every admin API request.

The Express server adds an admin API namespace under `/api/admin/*`. These routes use the existing JWT authentication and then pass through a new `requireAdmin` guard. Unauthorized requests return `401`; authenticated non-admin requests return `403`.

The server synchronizes admin users from `ADMIN_USERNAMES` during startup or login. If a configured username exists, that user is promoted to `admin`. This avoids public admin registration while keeping local setup simple.

## Data Model

Extend `User`:

- `role`: string enum-style value, default `player`, allowed values `player` and `admin`.
- `status`: string enum-style value, default `active`, allowed values `active` and `banned`.
- `banReason`: optional string.
- `bannedAt`: optional datetime.

Existing fields such as `rank`, `rating`, `coins`, `ownedCharacters`, and `selectedCharacter` remain in place for the first version. This keeps migration small and avoids turning the user inventory system into a separate project.

Add `Character`:

- `id`
- `slug`
- `name`
- `portraitUrl`
- `portraitSource`: `upload` or `url`
- `palette`
- `enabled`
- `sortOrder`
- `createdAt`
- `updatedAt`

Add `CharacterSkill`:

- `id`
- `characterId`
- `effectType`
- `name`
- `description`
- `uses`
- `freeTurn`
- `targetRule`
- `paramsJson`
- `enabled`
- `createdAt`
- `updatedAt`

Supported initial `effectType` values are `erase-point` and `flip-stone`. Supported initial `targetRule` values are `empty-point` and `stone`. Future skills extend the effect registry and parameter validator.

Add `AdminAuditLog`:

- `id`
- `adminUserId`
- `action`
- `targetType`
- `targetId`
- `beforeJson`
- `afterJson`
- `createdAt`

Startup seed logic copies the current built-in character definitions into the database when missing. Public game views then read character data from `GET /api/characters`, while the game rules call a skill registry keyed by `effectType`.

## Admin UI

### Overview

The overview page is read-only. It shows total users, banned users, enabled characters, total game records, and recent admin actions.

### User Management

The users page shows a searchable table with username, role, status, rank, rating, coins, wins, losses, selected character, and creation date. A detail drawer supports:

- Editing role, rank, rating, coins, owned characters, and selected character.
- Banning and unbanning a user with a required reason for bans.
- Resetting a password through a confirmed admin action.

Dangerous actions use confirmation dialogs.

### Character Management

The characters page shows the current roster and supports creating, editing, and disabling/deleting characters. The editor includes:

- Name, slug, palette, sort order, and enabled state.
- Portrait upload.
- Manual portrait URL or path.
- Skill effect type.
- Skill name and description.
- Skill uses.
- Whether skill use consumes a turn.
- Target rule.
- Parameter JSON.

Default removal behavior is disable/soft delete. Hard deletion is only allowed when no users own the character and no game records reference it.

### System And Audit

The system area shows recent `AdminAuditLog` entries and the current environment-configured admin usernames as read-only operational context.

## API Design

Admin APIs:

- `GET /api/admin/summary`
- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `PATCH /api/admin/users/:id`
- `POST /api/admin/users/:id/ban`
- `POST /api/admin/users/:id/unban`
- `POST /api/admin/users/:id/reset-password`
- `GET /api/admin/characters`
- `POST /api/admin/characters`
- `PATCH /api/admin/characters/:id`
- `DELETE /api/admin/characters/:id`
- `POST /api/admin/uploads/character-portrait`
- `GET /api/admin/audit-logs`

Public APIs:

- `GET /api/characters`

The public character API returns only enabled character data needed by the lobby, house, room, replay, and skill display surfaces. Admin APIs return disabled records and operational metadata.

## Validation And Errors

- Missing or invalid JWT returns `401`.
- Valid player account accessing admin routes returns `403`.
- Banned users are prevented from normal login/session use and receive a clear banned-account error.
- Character form validation runs on frontend and backend.
- Backend validates `effectType`, `targetRule`, `uses`, required text fields, and skill parameter JSON.
- Upload validation allows common image MIME types only and enforces a size limit.
- Uploaded files receive generated safe filenames and are served from a stable public uploads path.

## Testing

Development should follow TDD for backend behavior and shared rule changes.

Backend tests should cover:

- Admin role authorization.
- Player rejection from admin APIs.
- Admin promotion from `ADMIN_USERNAMES`.
- User list, edit, ban, unban, and password reset.
- Character create, update, disable/delete, and validation failures.
- Portrait upload validation.
- Audit log creation for admin mutations.

Shared game tests should cover:

- Database-backed `erase-point` configuration still erases empty intersections and preserves free-turn behavior.
- Database-backed `flip-stone` configuration still flips a target stone and consumes a turn.
- Invalid effect type or target rule is rejected before mutating game state.

Frontend verification should include:

- `npm run build`.
- Manual browser pass for admin entry, user management, character management, and unauthorized player access.

## Extension Points

The admin feature should be organized by module:

- API service functions for admin requests.
- Admin pages for overview, users, characters, and audit.
- Form schema or validation helpers for reusable field definitions.
- Skill registry for `effectType` execution and parameter validation.

Adding a new skill later should require adding a registry entry and parameter validator, not rewriting the admin console. If the admin frontend is later split into a separate app, the `/api/admin/*` boundary and role-based data model already support that move.
