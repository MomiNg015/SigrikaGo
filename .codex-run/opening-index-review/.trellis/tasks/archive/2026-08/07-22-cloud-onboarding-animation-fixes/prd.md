# Cloud onboarding and animation fixes

## Goal

Make the cloud deployment reproduce the latest locally published onboarding story, restore reliable skill presentations under the production CSP, and restore the repository's intended compressed static-delivery path so production interactions do not suffer avoidable loading and parsing pressure.

## What I already know

* The locally published `onboarding.default` row is newer than the committed snapshot: local DB published at `2026-07-21T13:24:41.917Z` with 225 nodes, while the snapshot was published at `2026-07-21T12:54:14.597Z` with 224 nodes.
* A fresh cloud database seeds non-user admin defaults from `server/adminDefaultSnapshot.js`; existing seeded rows are intentionally preserved.
* Production blocks Pixi's Blob Worker because Helmet has no explicit `worker-src`; Danea's 50-frame animated WebP reproduces the failure.
* Procedural Sigrika effects work. Texture-backed effects include Danea `flip-stone`, Changli `double-move`, Baconbits `random-blast`, and Aemeath's derived `voyage-star`.
* Live hashed CSS/JS responses are immutable but are currently transferred without gzip. The live CSS is about 893 KB and the Pixi chunk about 870 KB uncompressed.

## Requirements

* Export the current local non-user admin defaults so the latest published onboarding story becomes durable committed bootstrap data.
* Preserve user/runtime data exclusions from the snapshot exporter.
* Add a narrowly scoped CSP `worker-src 'self' blob:` directive while keeping `script-src 'self'` strict.
* Add regression coverage proving the production CSP permits Pixi Blob Workers without loosening script execution policy.
* Keep all existing skill presentation timing and visuals unchanged.
* Keep the Nginx static-delivery contract aligned with the live HTTPS deployment and ensure compressible JS/CSS/SVG responses can be gzip encoded.
* Document the one-time cloud reconciliation needed because startup seeding preserves existing onboarding rows.
* Provide one root-operated production update script that preserves untracked files, rejects tracked worktree edits and non-fast-forward Git histories, creates a verified SQLite backup, validates the build and Nginx configuration before downtime, applies migrations plus the targeted onboarding reconciliation while stopped, restarts the service, and waits for readiness.
* Update system-design documentation and regenerate `docs/system-design.html`.

## Acceptance Criteria

* [ ] `server/adminDefaultSnapshot.js` matches the current local published `onboarding.default` graph (225 nodes and matching content hash).
* [ ] Production CSP contains `worker-src 'self' blob:` and still contains strict `script-src 'self'` without `blob:` or `unsafe-eval`.
* [ ] Texture-backed skill effects are covered by a CSP/asset contract test, including Danea, Changli, Baconbits, and Aemeath `voyage-star`.
* [ ] Nginx configuration syntax is valid and its HTTPS/static path applies gzip plus the intended cache headers.
* [ ] Deployment docs provide safe commands to pull/build, reconcile the onboarding row, restart, and verify response headers/health.
* [ ] `deploy/update-production.sh` provides the documented one-command update path and has regression coverage for its safety gates and operation ordering.
* [ ] Targeted tests and full `npm run check` pass.

## Definition of Done

* Tests added or updated for snapshot durability, CSP, skill assets, and production static delivery.
* Lint, tests, production build/config validation, and system-design generation are green.
* Rollout steps are idempotent or explicitly one-time, with rollback from the existing DB backup documented.

## Technical Approach

1. Run the existing `npm run admin:snapshot` exporter against `prisma/dev.db` and review the generated diff.
2. Add Helmet `workerSrc: ["'self'", "blob:"]` and assert the emitted header contract.
3. Audit all board skill effect asset types and add a regression contract around texture-backed effects.
4. Align the deploy Nginx templates and documentation for HTTP/HTTPS static serving, gzip, immutable hashed assets, and no-cache HTML.
5. Provide a targeted onboarding-row reconciliation step for the already-created cloud DB instead of resetting user data again.
6. Compose the existing Git, SQLite backup, Prisma, build, Nginx, systemd, story-sync, and readiness commands in a fail-fast deployment script without reimplementing their domain logic.

## Decision (ADR-lite)

**Context**: Pixi creates Blob Workers for image bitmap and texture processing. The current CSP falls back to `script-src 'self'` and blocks those workers.

**Decision**: Allow `blob:` only in `worker-src`, not in `script-src`, and retain the existing CSP-compatible Pixi import.

**Consequences**: Pixi texture decoding works in production while the main script policy remains strict. Future worker-backed texture formats are covered by the same narrow directive.

## Out of Scope

* Redesigning animation timing, easing, layout, or visual effects.
* Replacing PixiJS or changing skill rules.
* Copying users, game records, mailbox history, feedback, audit logs, or other runtime data into deployment snapshots.
* Broad CSS redesign or debt cleanup unrelated to measured production delivery/performance.

## Technical Notes

* Relevant code: `server/index.js`, `src/room/pixiPrewarm.js`, `src/room/boardSkillEffectAssets.js`, `scripts/export-admin-default-snapshot.mjs`, `server/adminDefaultSeed.js`, `deploy/nginx/sigrikago.conf`, `docs/deployment.md`.
* Research: [`research/csp-static-delivery.md`](research/csp-static-delivery.md).

