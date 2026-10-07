# Final portrait visual and appearance review

Read-only production review, 2026-10-05. Only temporary review scripts/fixtures and this note were written. Production JSX, CSS, imports, shared fixtures and data were left unchanged during this pass.

## Verified matrix

Used the existing Vite server at port 5305, the complete production stylesheet entry, and the real `HomeScreen` / `RoomScreen` components. The temporary fixture is `.tmp/interface-polish/portrait-art-review.{html,jsx}`. It uses actual committed art, recognized costume framing fields, ordinary room participants, and replay-mode room players with start-time costume snapshots. These are deterministic component fixtures, not a claim that an existing database replay was loaded.

`portrait-final-review.mjs` produced **126 art captures** under `.tmp/interface-polish/portrait-final/`:

- 54 standard cases: all nine humanoid characters, student ID and ordinary battle, at 1440×900 / 390×844 / 320×568.
- 30 shipped costume cases: Sigrika costume 01, Denia costumes 01/02, Nabomo costumes 01/02, both surfaces at all three widths.
- 42 special/authored cases: Denia default candy, explicitly configured costume-candy URL/framing, frozen replay snapshot, a non-square custom portrait, a non-square custom costume with authored scale/translation, corruption and Baconbits, both surfaces at all three widths.

All 126 selected images decoded successfully; no page errors or document-level horizontal overflow occurred. Every standard focal point remained inside its crop. Standard face width ranges from approximately 51.6% to 64.0% of the mask, with the consistent 64% student-ID target and the existing character crop metadata for battle. Full-body source proportions remain intact; only the fixed inner crop hides lower body.

## Visual assessment

Reviewed the three standard contact sheets, covering every character/viewport/surface: `gallery-standard-0.png`, `gallery-standard-3.png`, `gallery-standard-6.png`. Faces and shoulders are meaningful on desktop and 320/390 phones. Sigrika ears, Denia hair loop/headband, Mornye halo, Qiuyuan hair ornament and Nabomo cap remain visible. There are no neck-only crops, empty standard masks, stretched bodies or excessively tight faces. Different authored hair/head volumes retain their intended silhouettes. No standard crop change is recommended.

Reviewed all authored/special contact sheets: `gallery-special-0.png`, `gallery-special-4.png`, `gallery-special-8.png`. The five shipped costumes remain their existing chibi compositions rather than being forced into the humanoid sprite crop. Custom 832×1216 art remains proportional inside contain framing; the authored 115% / −4% / +3% variant retains those settings and shows the expected lower-body crop. This deliberate custom-source behavior should not be replaced with an inferred face landmark.

The replay fixture visibly uses Denia costume 02 at 112% / −3% / +4%, while the same account's student ID still uses current costume 01. The replay viewpoint indicator remains outside the image mask. Configured candy framing computes 105% / −2% / +1%; default candy has no inherited costume framing. The actual candy WebP still has **16 frames, 70ms each, infinite loop**.

The corruption follow-up includes the real `.is-sigrika-corrupted` app-shell state, all three widths, and both surfaces. Its source remains `sigrika-corrupted.webp`, decoded and visible. Home retains the existing disabled/dimmed card contract and desaturated corruption owner. One earlier crop capture coincided with HMR/painting and appeared empty; fresh full-page and six isolated follow-up captures confirmed the portrait itself is present. This is not a source or crop defect. Follow-up source/animation metadata is in `special-followup.json`.

## Cold-loading evidence

Fresh browser contexts delayed handbook sprite requests by 2.5 seconds, measuring before native image dimensions became available and again after `decode()`:

| Surface at 390×844 | Before / after x,y | Before / after width,height | Result |
| --- | --- | --- | --- |
| Student ID | 105.671875, 195.90625 | 56.453125, 82.375 | Exactly unchanged |
| Self battle | 9, 549 | 62.390625, 88 | Exactly unchanged |

Both were unloaded before and loaded after. No image-driven geometry jump occurred. `metrics.json` records every source, compositor scale/translation, crop size, load state, overflow and both cold-load measurements.

## Recommendation before edits

**Optional narrow-screen label refinement:** at 320px, the four-character `西格莉卡` paper label wraps into two lines, while shorter names fit. Measured label has `white-space: normal`, 10px type, approximately 44px client width, and a rotated visual box about 48.8×37.9px. The artwork remains correct, and the label stays outside the crop; however, two lines consume more shoulder space and look heavier beside shorter labels. If the root elects to refine it, use the existing battle typography/name-label owner to preserve a single line and adjust its safe offset/padding as necessary. Do not shrink the board or move the identity/clock geometry. Evidence: `room-320-full.png`.

No production art, crop, source-precedence or loading fix is recommended from this review. The prior DOM fallback/source-transition tests and team compositor geometry suite were intentionally not duplicated.

## Authorized label follow-up

The root requested the verified narrow-label repair after reviewing the recommendation. Only `src/styles/mobile-adaptive/battle-paper-player-mobile.css` was changed: the mobile paper label now uses `white-space: nowrap` and a 2px left anchor. Type remains 10px, portrait height remains 88px, and shared bust CSS was not touched.

Before/after browser measurements cover all nine characters at 320 and 390px. All **18 cases** render one text line, have no intersection with username, timer, capture or skill boxes, and reserve at least **4.655px** of horizontal clearance after accounting for the label's −5° rotation and transformed hard shadow. No label or document overflow occurred. Board and portrait x/y/width/height are exactly unchanged. Evidence is `label-{before,after}.json` and `label-<character>-<width>.png` in the same artifact directory.

The owner intro comment was shortened to retain the existing 6,000-byte concrete CSS limit. Canonical LF bytes: **5,980 → 5,999 (+19)**; physical disk bytes: **6,062 → 6,080 (+18)** because the edited first line's newline normalized. `!important` count stays **102 (delta 0)**, with no new file, media, color or z-index family. Root owns documentation and CSS inventory integration.

`npm test -- src/room/PlayerInfo.test.js src/styles/styleContract.test.js src/styles/themeContract.test.js` passes: **3 files / 119 tests**. The stylesheet and review scripts are stable for the root's subsequent consolidation check.
