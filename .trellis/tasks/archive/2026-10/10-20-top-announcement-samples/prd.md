# Top announcement design samples

## Goal
Deliver three interactive visual samples for a full-width announcement above the existing home header. The user wants one line maximum, horizontal scrolling only when text overflows, and an admin enable/disable switch and editable content.

## Accepted scope and decisions
- Samples only; no production setting, backend route, persistence or rollout yet.
- Use existing LXGW Marker Gothic and campus colors; render the real HomeHeader with the full stylesheet in a preview iframe.
- Three distinct directions: quiet mint broadcast, warm yellow notice ribbon, dark ink maintenance strip.
- Local mock admin switch and editor apply to all samples. Empty/disabled notices collapse completely. Plain text, normalized to one line.
- Long text loops at a readable constant speed; pause control, hover/focus pause, reduced-motion manual reading. Short text stays still.
- Compare desktop and native portrait widths (390/320px), including text overflow, asset loading and no horizontal page overflow.
- Update the system-design entry and generated HTML. Preserve unrelated working files.

## Completion
Interactive comparison and focused preview work locally. Save desktop comparison and portrait screenshots, document tradeoffs and scope, run scoped lint/browser/document checks, then make a scoped commit. Real admin integration remains a follow-up after selection.

## Research
HomeHeader is in src/home/components/HomeHeader.jsx; HomeScreen currently renders it first. AdminSiteSettings edits the existing /site-settings endpoint and shared defaults live in src/shared/siteSettings.js. Those sources are read-only for this sample task. Current font is Sigrika Window Title, backed by public/assets/fonts/LXGWMarkerGothic-Regular.ttf. Prototype artifacts belong in docs/design-samples/.
