# Authentication Form And Session Contract

## Scenario: Login, Registration, And Single-Session Replacement

### 1. Scope / Trigger

- Trigger: changes to `AuthScreen`, `/api/auth/*`, password rules, auth rate limits, refresh-cookie metadata, or `LoginSession` replacement.
- This is a cross-layer contract: the React form, API client, Express routes, bcrypt boundary, rate-limit middleware, and Prisma session store must agree on validation, error, cancellation, and concurrency behavior.

### 2. Signatures

- `GET /api/auth/challenge?purpose=register|login` returns `{ id, image, expiresAt }` with `Cache-Control: no-store`; image is raster PNG only.
- `POST /api/auth/register` accepts `{ username: string, password: string, challenge: { id: string, answer: string } }`.
- `POST /api/auth/login` accepts `{ username: string, password: string, forceLogin?: boolean, challenge?: { id: string, answer: string } }`; `captcha_required` requires a fresh login-purpose proof.
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
- Registration validates its five-minute, IP/purpose-bound, one-attempt challenge before bcrypt or database writes. Wrong answers consume the challenge. Store only an answer digest; never expose the answer as text, SVG, or metadata. Render with the shipped font so cloud hosts do not depend on installed fonts.
- Challenge issuance is bounded before async image rendering: 10/IP/minute, 120/process/minute, 2,000 live entries. Registration adds 10 successful requests/IP/hour; failures remain subject to the existing credential-attempt limit. Capacity exhaustion fails closed with 503; throttling returns 429 and Retry-After.
- Login reserves an in-flight slot per account/IP before awaiting bcrypt. Five failures start 2-second exponential backoff, capped at 300 seconds. Ten cumulative account failures/in-flight attempts require a challenge across source IPs, never an account-wide hard lock. Successful credentials reset counters; exceptions release the slot without adding a credential failure. The 15-minute store is bounded to 10,000 entries.
- Only explicit stability/capacity verification fixtures may omit registration proof or use the exported fixed image answer; production, development, and ordinary test environments never bypass proof, even with client fixture headers or ENABLE_TEST_ACTIONS alone.
- Express trusts only loopback proxies for client-IP derivation. Changing proxy topology requires explicit trusted addresses and an anti-spoofing check. These process-local protections must move to shared storage before multi-process deployment.
- Logout must verify the access token signature and HS256 algorithm before revoking its sub/sid. Invalid tokens must not affect other sessions; a legitimate refresh cookie can still revoke its own session independently.
- `x-stability-scope` may namespace credential, session, and broad API limiters only when `NODE_ENV=stability`; production ignores the header and retains the IP-derived key.
- Authenticated HTTP verification fixtures are available only when `NODE_ENV` is `stability` or `capacity` and `ENABLE_TEST_ACTIONS` is explicitly enabled. They may prepare owned characters or promote the capacity metrics reader, but must never alter public registration defaults or production authorization.
- A form may have only one in-flight auth request. Mode changes keep the username, clear passwords, and invalidate stale work; unmount aborts the request. A late or aborted result must not call `onAuth` or overwrite current UI state, including under React Strict Mode effect rehearsal.
- Registration always shows the image challenge; login shows it only after captcha_required. Refresh/error/expiry invalidates the previous proof and clears its answer; mode changes and unmount cancel image fetches. Image loading failure must remain retryable. Preserve keyboard focus, field errors, and 320px portrait geometry.
- Both modes place field feedback at the label's right edge, aligned with the field name's first text baseline (`align-items: baseline`, including the mobile owner). Top alignment makes the smaller note appear raised. Registration's username-width and `8-64 位` notes are replaced by errors after blur/submit and restored when valid. Use 8px form gaps, 38px username labels (two 14px/1.25 lines), and 24px password/confirmation labels. Remove the mobile 68% hint-width cap and use a 4px username label gap so long validation messages fit at 320px. Wrapped feedback must stay clear of the input without changing card geometry. Preserve error IDs, `aria-describedby`, and first-invalid focus.
- Registration HTTP 409 `用户名已存在` belongs to the username field, not the form alert. Keep server field errors separate from local validation so blur cannot erase them; clear the corresponding server error only when that field changes, or reset them on submit/mode change. Editing credentials clears obsolete form-level feedback in both modes.
- Form-level feedback occupies bottom padding, never an extra grid row. Both cards reserve 48px below the button; the absolutely positioned 14px alert region uses bottom:4px and max-height:35px (two 1.25 line-height lines), leaving clearance for the submit shadow. Common long API fallback messages must fit fully at 320px. Longer server explanations remain intact in a named, keyboard-focusable scrolling region with a thin scrollbar. Never regress to a one-line, unfocusable clip or let feedback change card geometry.
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
- Missing/wrong/expired/replayed registration proof -> HTTP 400 captcha_invalid before hashing or creation. Distributed login failures without proof -> HTTP 400 captcha_required. Pair backoff -> HTTP 429 login_backoff.
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
- `server/authChallenges.test.js` and `server/loginAbuseGuard.test.js` cover IP/purpose binding, expiry/replay, bounded stores/issuance, production bypass rejection, backoff, distributed attacks and concurrent reservations. `server/authSecurity.integration.test.js` exercises real Express routing, challenges and registration quotas before credential/session operations.
- `src/auth/useAuthChallenge.dom.test.jsx` covers refresh, expiry, stale/aborted responses and load-error recovery. `tests/e2e/auth-session.spec.js` covers actual raster images, wrong-answer refresh and successful registration at 1440/390/320px, in addition to cookie sessions.
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
