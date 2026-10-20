# Top announcement samples

Open [the interactive comparison](http://127.0.0.1:5173/docs/design-samples/top-announcement-2026-10-20/?compare) with the existing Vite dev server. The page can show all three directions or one larger preview, with actual desktop / 390px / 320px iframe viewports.

## Three directions

| Variant | Treatment | Best fit / tradeoff |
| --- | --- | --- |
| Mint broadcast | 38px pale mint strip, small bell, thin label separator | Recommended for a quiet match with the selected paper toast; softer emphasis |
| Yellow notice ribbon | 40px warm paper strip, darker angled label, megaphone | Campus noticeboard character; the fixed label uses slightly more horizontal room |
| Ink maintenance bar | 40px dark ink strip, mint status dot and bottom rule | Strongest maintenance emphasis; attracts more attention than ordinary notices |

Every sample is full width above the real `HomeHeader`, with one text row. The existing mobile header keeps its original 10px outer gutter. The existing classroom artwork is supporting context, not a newly implemented home screen. The dates and messages are fictional examples.

## Behavior and admin demonstration

- The mock admin switch applies immediately; text is applied with the save button. Changes are local and reset on reload. Both disabled and whitespace-only content remove the announcement completely.
- Plain text is normalized to one line. The mock editor caps input at 500 characters; this is a prototype assumption for later review, not a new server contract.
- `ResizeObserver` measures the actual loaded font and available space. Text that fits stays still, with no pause control. Overflow scrolls left at 36px/s after an initial 1.6s reading interval, using a second visual copy for a continuous loop.
- Hover or keyboard focus pauses the motion. The persistent pause button keeps it paused after leaving the strip. After resuming, moving pointer/focus outside the strip lets motion continue.
- With reduced motion enabled, the text does not animate and the region supports touch/trackpad/keyboard horizontal scrolling. The focusable scroll region has a narrowly documented accessibility-lint exception; native arrow-key reading was verified.
- Screen readers receive one copy of the complete message. The visual loop copies are hidden from accessibility APIs. Editor text is rendered as text, including angle brackets.
- Preview communication checks the sender and same origin. There are no account requests, backend writes, local storage changes or production imports of these samples.

## Assets and design review

- The notice and studio use the existing `LXGWMarkerGothic-Regular.ttf` as `Sigrika Window Title`.
- Header markup comes directly from `src/home/components/HomeHeader.jsx`, with the full production stylesheet. Background: `/assets/home/multipurpose-classroom-bg.webp`.
- The local neutral studio shades and mint / amber / ink variants intentionally explore tonal treatments of the existing campus palette. Design-hook color warnings are classified as intentional prototype exploration, not new global tokens; no hook is disabled. Reconcile the selected direction with shared tokens when integrating production.
- The dark color swatch has square corners so its colored bottom rule does not clash with rounded card corners. Any remaining border-accent warning is a false positive on this small rectangular selector swatch, not a decorated content card.
- Variants 1/2/3 are selection identifiers. They are not decorative section numbering.

## Verification

85 headless Microsoft Edge checks passed: three variants at 1344 / 390 / 320px; full-width single-row geometry; real header placement; loaded LXGW font; overflow-only movement; hover and persistent pause/resume; enable/disable; empty content; plain-text normalization; editor apply; comparison and viewport selection; reduced-motion keyboard reading; no page/resource errors or API requests. The studio itself fits native 390px and 320px widths.

Visual inspection covered `comparison.png`, the actual mobile frame and the dark 320px variant. The screenshot set includes each variant at all three widths and `editor.png` for the local editor. `verification.json` records the browser result. Scoped ESLint, `npm run docs:system-design`, the four generated-document tests and whitespace checks passed. No production behavior changed, so the full application suite was not rerun for this sample delivery.

## Later integration

The user requested design samples first. Production `HomeScreen`, `AdminSiteSettings`, site-setting defaults, API validation, storage and committed admin defaults remain unchanged. Once a direction is selected, implement the saved enable/content settings and propagation through the existing site-settings path, decide refresh semantics, and verify fresh deployment persistence. Do not infer a maintenance lock, scheduled activation or player dismiss action from this visual task.
