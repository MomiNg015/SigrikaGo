# Open registration beta security and release checks

## Goal

Implement the first batch accepted by the user: room-chat authorization, relevant dependency security updates, abuse-resistant public account/password registration and login, and passing local release checks.

## Requirements

- Preserve free public registration and current single-session authentication semantics.
- Reject unauthorized room chat before any side effects; preserve intended spectator channels.
- Add a server-validated registration challenge, bounded rate limits, and login failure backoff.
- Upgrade vulnerable dependencies within compatible versions where possible; document any remaining exposure accurately.
- Fix release/config checks and regressions with meaningful behavioral tests.
- Preserve all unrelated working-tree changes. Update system design and applicable specs.

## Acceptance Criteria

- [x] Outsiders/stale sockets cannot inject chat; authorized players and spectators follow channel rules.
- [x] Registration requires a fresh valid challenge; replay, expiry and excessive requests are rejected.
- [x] Login throttling handles incorrect credentials without permanently locking a victim account.
- [x] Auth UI supports refresh, errors and mobile portrait use.
- [x] Dependency audit has no unaddressed exploitable high/critical runtime findings.
- [x] Project check and local stability/release checks pass, or concrete external limitations are recorded.

## Decisions and Scope

- The user approved batch one in the preceding proposal. No repeat scope confirmation is needed.
- No SMS integration, asset loading redesign, game-rule changes, cloud purchase or deployment.
- Prefer a self-contained registration challenge for this personal beta; investigate existing dependencies and deployment constraints before selecting implementation.
- Future distributed rate limiting and stronger managed bot detection remain extension points; this release remains single-process.

## Definition of Done

Targeted security tests, broad project checks, system-design HTML regeneration, scoped review and commit without unrelated WIP.
