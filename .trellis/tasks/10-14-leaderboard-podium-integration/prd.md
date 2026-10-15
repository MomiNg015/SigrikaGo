# Production leaderboard podium

## Goal and accepted design
Integrate the approved sixth podium sample into the real leaderboard. User explicitly authorized implementation. Desktop keeps centered first place, side second/third and full records. Mobile top-three show their own wins/rate; lower rows and pinned current player group placement with avatar, name with compact rank, and prominent rate with secondary wins. No selected-first-place detail strip.

## Requirements
- Retain API, stale-response guard, mode tabs, accessible dialog, loading/error/empty handling and server-provided ranking.
- Use unique service order, cap the podium at gold/silver/bronze, and tolerate fewer than three players without inventing placements.
- Preserve character resolver, avatar variant, item effects, equipped costumes and capture record costume snapshot; share UserIdentity and rank normalization.
- Capture mode keeps record character and captures; zero games remains 0.0%; current player missing shows unranked without invented data.
- Preserve unrelated dirty changes, including pending avatar variant change in the legacy row.
- Add focused behavior tests and real-component desktop/portrait browser preview. Update design docs and generated HTML plus bounded CSS inventory delta.

## Acceptance
- [x] Production component matches approved layout at 1440 and 320/360/390 portrait.
- [x] Ties, sparse/empty results, current/top/unranked, loading/error and mode races work.
- [x] Shared identity, portrait and rank contracts retained.
- [x] Targeted tests, lint/build/CSS checks and documentation generation completed; pre-existing inventory failures documented below.

## Verification
- 88 focused tests passed (leaderboard behavior, capture entry flow, legacy contracts and CSS import/size contracts). The full run exposed a stale capture-row selector; it was updated and the related suite rerun successfully.
- 40 actual-component browser cases passed at 1440/390/360/320, including equipped nameplates; four intermediate widths 761/800/900/1024 also have no horizontal overflow. Compact layout extends through the existing 900px family to accommodate the real window's bookmark gutter.
- ESLint, Vite build, built-CSS contracts, diff whitespace check and system-design HTML generation passed.
- CSS inventory retains two pre-existing failures: 889 bytes over baseline even after excluding the exact leaderboard delta, and unregistered `(max-width: 360px)` in `match-mode-title-layout.css`. Only this feature's measured 10803-byte delta was added; unrelated debt was not silently absorbed.
- Preserve unrelated work and keep the feature commit scoped. Existing global gate failures are disclosed above.
- Full npm test also found an unchanged CharacterDetailDialog candy-portrait assertion failure and a missing dependency in an archived task's copied ReplayList suite. Full log is `.codex-run/leaderboard-full-tests.log`; final focused log is `.codex-run/leaderboard-final-tests.log`. No whole-repo pass claimed.

## Scope
The user subsequently requested unique ranks and first-achieved precedence. Scope now includes server ordinary/capture ordering, durable arrival timestamps, additive migrations, profile/settlement agreement and a hard three-player podium limit. Preserve score criteria, appearance and unrelated work.

## Follow-up acceptance: unique ranking
- [x] Ordinary: rank, progress, wins and exact win rate retain priority; equal standings sort by arrival, then stable ID only at identical timestamps.
- [x] Persist per-mode arrival only when the compared standing changes (or first becomes eligible); capture repeats preserve the first best time and costume.
- [x] Capture list, current profile and settlement use the same unique ranking; durable historical receipts remain unchanged on retry.
- [x] Migrate legacy ordinary timestamps from mode updatedAt and capture times from earliest equal-score result; repeated startup is idempotent. Unknown capture history falls back to epoch and stable ID.
- [x] Render at most three gold/silver/bronze slots regardless of legacy tied payloads; remaining users continue from fourth.

Follow-up verification: 139 targeted tests plus 13 startup/team/migration-contract tests passed; 40 real-component browser cases passed, including five identical-score players with exactly three podium slots. ESLint, build, built CSS and Prisma schema validation passed. The stock migration verification command cannot replace the Windows engine DLL held by the active service (EPERM); disposable SQLite migration/startup tests and separate deploy/schema-diff validation cover the change without stopping the user's service.
