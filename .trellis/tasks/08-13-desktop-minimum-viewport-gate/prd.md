# Desktop minimum viewport gate

## Goal

Prevent the desktop layout from rendering below its supported viewport while preserving the existing mobile experience.

## Requirements

- Exempt only common phone-class devices whose physical screen's shorter CSS-pixel side is at most `480px` and which expose mobile/touch evidence through input media, touch points, User-Agent Client Hints, or a recognized mobile user agent. Use device-screen geometry rather than viewport width so rotation remains playable and narrowing a desktop browser cannot create an exemption.
- Treat a `481px+` screen short side as non-phone and apply the desktop gate to it. Explicit Android-tablet (Android without `Mobile`), iPad, Tablet, PlayBook, Silk, and Kindle identities are excluded even if their reported short side is at the phone boundary.
- On non-mobile desktop viewports, require at least `1440px` CSS-pixel width and `768px` CSS-pixel height.
- When either desktop dimension is below its minimum, replace the playable application surface with the exact visible message `请用更大尺寸窗口进行游玩`.
- Re-evaluate immediately after window resize or device-orientation change and restore the current application state when the threshold is met again.
- Apply the same gate to the isolated admin view because it is also a desktop surface; do not create route-specific exemptions.
- Keep classified-phone portrait and landscape behavior unchanged; tablet layouts are intentionally outside the mobile exemption.
- The blocking surface must be accessible (`role="alert"`, polite live update), theme-compatible, and must not add decorative motion.

## Acceptance criteria

- Desktop `1440 x 768`: application content renders.
- Desktop `1439 x 768`, `1440 x 767`, and `1366 x 768`: only the size notice renders.
- Common phones with `320/360/390/412/430/480px` screen short sides render without the desktop notice in portrait and landscape.
- Touch/mobile tablets with `600px` or `768px` screen short sides render the desktop size notice.
- Admin view below the threshold: the same desktop size notice renders.
- Tests cover pure threshold classification, resize reactivity, mobile exemption, boundary inclusion, and exact copy.
- `docs/system-design.md` and generated `docs/system-design.html` describe the runtime contract.

## Verification

- Focused viewport/app tests: 25 passed.
- Full unit/DOM suite: 349 files, 2481 tests passed.
- `npm run lint`, `npm run build`, `npm run check:built-css`, production-config validation, `npm run docs:system-design`, and `git diff --check` passed. The aggregate `npm run check` reached and passed lint, all tests, and portrait validation, then stopped at the pre-existing stale admin snapshot (`siteSettings`, `shopItems`, `storyScripts`); the task does not export or overwrite that unrelated snapshot state.
- Browser QA: `1366 x 768` and `1440 x 767` show the notice; `1440 x 768` restores the auth surface; all checked desktop states have zero horizontal overflow.
- Phone fallback and tablet exclusion are covered in DOM/unit tests because a desktop browser viewport controller changes dimensions without reproducing real device screen, touch, and UA signals.
