# Verification

- Six new unit tests pass: complete portrait manifest, public settings/catalog fallback, font and image timeouts, successful-only ready cache, application/resource completion ordering, and module failure reload.
- Related catalog, login, App wiring, portrait prewarm and asset loader suites pass.
- Six production-browser checks pass: 1440x900, 390x844, 360x844; script-delayed HTML first paint; image failure; session cookie preservation and delayed auth refresh. Screenshots under `.codex-run/site-entry/`; phone loading and login surfaces visually reviewed with no horizontal overflow. The existing viewport gate requires desktop width >=1440.
- ESLint, production build, built CSS contracts, system-design generation and diff whitespace checks pass. Critical inline progress styling uses the existing paper/ink/blue palette and 8px control radius, with reduced motion.
- Full `npm run check` stops at the same seven pre-existing tests: two social replay fixture assertions, two HouseModal layout assertions, one ShopModal width assertion, one RoomScreen grid assertion, and CSS totalBytes baseline (1537658 vs 1536378). Current result: 2659 passed, 7 failed, 380 files. No new full-suite failures and no CSS baseline increase.
- Main code waits for public resources without touching auth cookies, tokens or room recovery. Explicitly excludes account music/voices and gameplay/shop media from the entry resource list.
- Previous uncommitted Mornye card-voice change, its documentation paragraph, Q-art images and local artifacts are excluded from this work commit.
