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
- A form may have only one in-flight auth request. Mode changes keep the username, clear passwords, and invalidate stale work; unmount aborts the request. A late or aborted result must not call `onAuth` or overwrite current UI state, including under React Strict Mode effect rehearsal.
- Default form copy stays terse. Registration may show only the username-width and `8-64 位` label notes; detailed causes appear beside invalid fields after blur or submit. Server/network/429 messages use the single form-level alert.
- The login and registration submit buttons use `开门！` and `登记入部信息`; the segmented mode controls remain `登录` and `注册`. Bright School password visibility controls keep their 44px hit area, transparent hover background, and shadow-free owner rule so hover changes only the icon color instead of painting a filled square inside the input. Their component-owned disabled selector must load after the generic pending-button rule and preserve `translateY(-50%)`, so registration submission cannot move either absolutely centered visibility control.
- Active-session conflict uses the shared accessible `ConfirmModal`; do not call `window.confirm`.
- Session replacement is serialized per `userId` inside the single Node instance. Prisma-backed revoke + create runs in one transaction so overlapping replacements leave only the latest session active.

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

### 6. Tests Required

- `src/auth/AuthScreen.test.js` covers validation parity, terse copy, submit labels, semantic markup, and the transparent/position-stable password-toggle hover and disabled owners.
- `src/auth/AuthScreen.dom.test.jsx` covers first-invalid focus, mode switching, password visibility, both registration toggles during the pending submit lock, synchronous submit lock, unmount abort, Strict Mode, conflict confirmation, and 429 recovery copy.
- `src/api/client.test.js` covers caller abort/timeout distinction and `Retry-After` metadata.
- `server/security.test.js` covers legacy login compatibility, new-password limits, byte limits, and both rate-limit buckets.
- `server/authRoutes.test.js` covers dummy compare, generic login errors, `P2002`, unexpected failure propagation, and force-login flow.
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
