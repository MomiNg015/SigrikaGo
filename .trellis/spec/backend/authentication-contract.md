# Authentication Form And Session Contract

## Scenario: Login, Registration, And Single-Session Replacement

### 1. Scope / Trigger

- Trigger: changes to `AuthScreen`, `/api/auth/*`, password rules, auth rate limits, refresh-cookie metadata, or `LoginSession` replacement.
- This is a cross-layer contract: the React form, API client, Express routes, bcrypt boundary, rate-limit middleware, and Prisma session store must agree on validation, error, cancellation, and concurrency behavior.

### 2. Signatures

- `POST /api/auth/register` accepts `{ username: string, password: string }`.
- `POST /api/auth/login` accepts `{ username: string, password: string, forceLogin?: boolean }`.
- Successful register/login returns `{ token, user }` and sets the `sigrika_refresh` HttpOnly cookie.
- Active online-account conflict returns HTTP 409 with `code: "already_logged_in"`.
- `api(path, { method, body, signal })` forwards the caller's `AbortSignal`; thrown API errors may expose `{ status, code, retryAfter }`.
- `createLoginSessionStore().replace(userId)` returns `{ sessionId, refreshToken, expiresAt }`.

### 3. Contracts

- Usernames use 2-8 half-width display units; CJK characters count as two units and input is never silently truncated.
- Existing accounts may log in with 6-64-character passwords. New registration requires 8-64 Unicode code points and at most 72 UTF-8 bytes.
- Missing-user and wrong-password login paths both perform one bcrypt compare and return the same generic 401 message; missing users compare against a fixed valid dummy hash.
- Only Prisma `P2002` from user creation maps to HTTP 409 “用户名已存在”. Other registration failures reach the shared API error handler.
- Credential rate limits cover register/login only. Refresh/logout use a separate, larger session bucket.
- `x-stability-scope` may namespace credential, session, and broad API limiters only when `NODE_ENV=stability`; production ignores the header and retains the IP-derived key.
- Authenticated HTTP verification fixtures are available only when `NODE_ENV` is `stability` or `capacity` and `ENABLE_TEST_ACTIONS` is explicitly enabled. They may prepare owned characters or promote the capacity metrics reader, but must never alter public registration defaults or production authorization.
- A form may have only one in-flight auth request. Mode changes keep the username, clear passwords, and invalidate stale work; unmount aborts the request. A late or aborted result must not call `onAuth` or overwrite current UI state, including under React Strict Mode effect rehearsal.
- Both modes place field feedback at the label's right edge, aligned with the field name's first text baseline (`align-items: baseline`, including the mobile owner). Top alignment makes the smaller note appear raised. Registration's username-width and `8-64 位` notes are replaced by errors after blur/submit and restored when valid. Use 10px form gaps, 30px username labels (two 12px/1.25 lines), and 24px password/confirmation labels. Wrapped feedback must stay clear of the input without changing card geometry. Preserve error IDs, `aria-describedby`, and first-invalid focus.
- Registration HTTP 409 `用户名已存在` belongs to the username field, not the form alert. Keep server field errors separate from local validation so blur cannot erase them; clear the corresponding server error only when that field changes, or reset them on submit/mode change. Editing credentials clears obsolete form-level feedback in both modes.
- Form-level feedback occupies bottom padding, never an extra grid row. Both cards reserve 48px below the button; the absolutely positioned 12px alert region uses bottom:4px and max-height:2.8em (two 1.4 line-height lines), leaving clearance for the submit shadow. Common long API fallback messages must fit fully at 320px. Longer server explanations remain intact in a named, keyboard-focusable scrolling region with a thin scrollbar. Never regress to a one-line, unfocusable clip or let feedback change card geometry.
- At widths <=900px, the auth scroll shell uses full available width with at least 6px safe-area-aware inline padding. The composition permits min-width:0. The full card border and 6px hard shadow must fit inside the scrollport, including at 320px; shrinking the inner card without checking the title is not sufficient.
- Reduced-motion auth button rules must beat the semantic button-color hover owner. Check the computed hover transform after scrolling a 390px-wide short viewport: a losing guard can oscillate by 1px when the pointer sits on the moved button edge.
- Bright School login/register cards have an opaque `--theme-bg` fill without a grid image. Keep the existing title/mascot composition and outer hard shadow; the rejected stone/cross-line corner decoration must stay removed.
- The login and registration submit buttons use `开门！` and `登记入部信息`; the segmented mode controls remain `登录` and `注册`. Bright School password visibility controls keep their 44px hit area, transparent hover background, and shadow-free owner rule so hover changes only the icon color instead of painting a filled square inside the input. Their component-owned disabled selector must load after the generic pending-button rule and preserve `translateY(-50%)`, so registration submission cannot move either absolutely centered visibility control.
- Active-session conflict uses the shared accessible `ConfirmModal`; do not call `window.confirm`.
- Session replacement is serialized per `userId` inside the single Node instance. Prisma-backed revoke + create runs in one transaction so overlapping replacements leave only the latest session active.
- `User.role` in the database is the only administrator authority. Registration, login, refresh, and server startup must never derive or mutate a role from a username or environment variable.
- Administrator bootstrap uses the local operator command `npm run admin:promote -- <username>`. It may promote only an existing user, must be idempotent for existing administrators, and must fail without creating an account when the username is unknown.

### 4. Validation & Error Matrix

- Empty/invalid username -> field-level validation; no request.
- Login password shorter than 6 or longer than 64 -> generic password-shape field error; server does not reveal credential existence.
- New password shorter than 8, longer than 64, over 72 UTF-8 bytes, or containing control characters -> HTTP 400 with the registration validation issue.
- Unknown username or wrong password -> HTTP 401 with the same public error; one bcrypt compare in either case.
- Online account without `forceLogin` -> HTTP 409 `already_logged_in`; confirmation may retry once with `forceLogin: true`.
- Prisma `P2002` on register -> HTTP 409 “用户名已存在”; any other database error -> shared API error path.
- HTTP 429 with `Retry-After` -> one concise wait message; absent/invalid header -> generic “稍后再试”.
- Component unmount or caller abort -> request signal aborts; no error banner and no `onAuth` call.

### 5. Good/Base/Bad Cases

- Good: ten synchronous submits create one request, disable the form, and resolve once.
- Good: two simultaneous `replace(userId)` calls finish with only the second session active.
- Base: a legacy seven-character password still logs in, while the same value is rejected for new registration.
- Bad: truncating a pasted username, sharing the 20-attempt credential bucket with refresh, mapping every create failure to “用户名已存在”, or replacing sessions with separate non-transactional revoke/create calls.
- Bad: leaving tutorial paragraphs, password rule checklists, or security education visible in the idle form.
- Bad: granting administrator access because a public registrant chose a configured username, or reapplying administrator roles during login/startup.

### 6. Tests Required

- `src/auth/AuthScreen.test.js` covers validation parity, terse copy, submit labels, semantic markup, and the transparent/position-stable password-toggle hover and disabled owners.
- `src/auth/AuthScreen.dom.test.jsx` covers first-invalid focus, label feedback in both modes, duplicate-username placement/persistence/clearing, stale form-error clearing, mode switching, password visibility, both registration toggles during the pending submit lock, synchronous submit lock, unmount abort, Strict Mode, conflict confirmation, and 429 recovery copy.
- `tests/e2e/entry-surfaces.spec.js` verifies opaque cards, absence of the rejected corner decoration, compact submit spacing, right-aligned field feedback, stable login/register geometry through local and server errors, fully visible common two-line feedback, keyboard scrolling for unusually long server explanations, unclipped card shadows, and centered entry-loading tips/first-load note at 1440/390/360/320px.
- `src/api/client.test.js` covers caller abort/timeout distinction and `Retry-After` metadata.
- `server/security.test.js` covers legacy login compatibility, new-password limits, byte limits, and both rate-limit buckets.
- Stability tests cover per-context limiter namespaces and verification fixtures; fixture route tests must assert production, development, and ordinary test environments return 404 without database writes.
- `server/authRoutes.test.js` covers dummy compare, generic login errors, `P2002`, unexpected failure propagation, force-login flow, and database-authoritative roles across register/login/refresh.
- `server/adminConfig.test.js` covers successful, idempotent, and unknown-user administrator promotion.
- `server/loginSessions.test.js` covers one-winner refresh rotation and latest-winner session replacement.
- `server/authRouteOrder.test.js` asserts the two middleware path buckets are mounted before the broad API limiter.

### 7. Wrong vs Correct

Wrong:

```js
await prisma.loginSession.updateMany({ where: { userId }, data: { revokedAt: now } });
return prisma.loginSession.create({ data: nextSession });
```

Correct:

```js
return serializeByUser(replaceOperations, userId, () =>
  prisma.$transaction(async (tx) => {
    await tx.loginSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } });
    return tx.loginSession.create({ data: nextSession });
  })
);
```

Wrong:

```jsx
<p>密码必须包含……</p>
```

Correct:

```jsx
<label htmlFor="auth-password">
  <span>密码</span>
  {mode === "register" && <small>8-64 位</small>}
</label>
```

## Administrative ban live-connection boundary

- POST `/api/admin/users/:id/ban` commits `banUser` and its audit before calling `onlineSessions.disconnectUser(userId, message)`. Never disconnect on transaction failure, invalid input, or last-admin rejection.
- Disconnect all sockets through the existing session manager; do not broaden all game events into asynchronous authentication reads. HTTP and new connections continue to reject database status `banned`.
- Cover committed and failed bans at the real router boundary; E2E verifies an existing socket is disconnected, banned HTTP/login are denied, and unban allows login.
