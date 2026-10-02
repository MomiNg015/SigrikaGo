# Desktop minimum viewport gate

## Goal

Prevent the desktop layout from rendering below its supported viewport while preserving the existing mobile experience.

## Requirements

- Exempt a current window when its shorter viewport side is inclusively `320–480px` and its longer side is inclusively `568–1024px`; this intentionally lets a desktop browser emulate the phone layout by narrowing into a common phone size, in portrait or landscape.
- Explicit Android-tablet (Android without `Mobile`), iPad, iPadOS desktop-mode (`Macintosh` with multiple touch points), Tablet, PlayBook, Silk, and Kindle identities remain excluded even if their current viewport is narrowed into that range. Real phone evidence may preserve the phone layout when a soft keyboard or browser chrome compresses the current viewport, but only while the device screen itself remains in the common-phone range.
- On non-mobile desktop viewports, require at least `1440px` CSS-pixel width and `768px` CSS-pixel height.
- When either desktop dimension is below its minimum, replace the playable application surface with the exact visible message `请用更大尺寸窗口进行游玩`.
- Re-evaluate immediately after window resize or device-orientation change and restore the current application state when the threshold is met again.
- Apply the same gate to the isolated admin view because it is also a desktop surface; do not create route-specific exemptions.
- Keep phone-range portrait and landscape behavior unchanged; tablet layouts are intentionally outside the mobile exemption.
- The blocking surface must be accessible (`role="alert"`, polite live update), theme-compatible, and must not add decorative motion.

## Acceptance criteria

- Desktop `1440 x 768`: application content renders.
- Desktop `1439 x 768`, `1440 x 767`, and `1366 x 768`: only the size notice renders.
- Common `320 x 568` through `480 x 1024` phone-shaped viewports render without the desktop notice in portrait and landscape, including a desktop browser with no touch/mobile signals.
- Touch/mobile tablets with `600px` or `768px` screen short sides render the desktop size notice.
- Admin view below the threshold: the same desktop size notice renders.
- Tests cover pure threshold classification, resize reactivity, mobile exemption, boundary inclusion, and exact copy.
- `docs/system-design.md` and generated `docs/system-design.html` describe the runtime contract.

## Verification

- Focused viewport/app tests: 25 passed.
- Full unit/DOM suite: 349 files, 2481 tests passed.
- `npm run lint`, `npm run build`, `npm run check:built-css`, production-config validation, `npm run docs:system-design`, and `git diff --check` passed. The aggregate `npm run check` reached and passed lint, all tests, and portrait validation, then stopped at the pre-existing stale admin snapshot (`siteSettings`, `shopItems`, `storyScripts`); the task does not export or overwrite that unrelated snapshot state.
- Browser QA: `1366 x 768` and `1440 x 767` show the notice; `1440 x 768` restores the auth surface; all checked desktop states have zero horizontal overflow.
- DOM/unit regression coverage confirms that a Windows desktop browser narrowed to `390 x 844` enters the phone layout without touch or mobile-UA signals, while iPad, iPadOS desktop mode, and ordinary tablet identities remain blocked; real-phone screen fallback is also covered for soft-keyboard compression.
