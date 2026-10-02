# Replace Radio Coupon Image

## Goal

Use the provided artwork as runtime images for the recruitment and item assets: "招新贴报/招新海报", "先约电台广播券", and "彩虹豆豆跳跳糖".

## Requirements

- Convert `C:/codex/image/item/boardcast_ticket.png` to WebP.
- Store the runtime asset under `public/assets/items/`.
- Update the shared recruitment item configuration so "先约电台广播券" uses the new WebP image.
- Render the recruitment board watermark/background art from the same item image, not the old built-in radio SVG.
- Ensure shop and warehouse payloads normalize the built-in radio ticket image even when an existing database row still stores the old SVG.
- Update default shop seed data if it still points at the old SVG path.
- Update system design docs for the asset/resource fact and regenerate `docs/system-design.html`.
- Convert `C:/codex/image/item/rainbow-candy-cutout-full.png` to WebP.
- Replace "彩虹豆豆跳跳糖" runtime imagery in shop, warehouse/inventory, default snapshot, and player-facing gacha prize/reward payloads.
- Convert `C:/codex/image/item/Recruitment_paper.png` to WebP.
- Replace "招新贴报/招新海报" runtime imagery in shared recruitment config, shop, warehouse/inventory, and default snapshot.

## Acceptance Criteria

- [x] `public/assets/items/radio-recruitment-ticket.webp` exists and is a valid WebP image.
- [x] Runtime recruitment/shop/warehouse consumers receive `/assets/items/radio-recruitment-ticket.webp` for "先约电台广播券".
- [x] Recruitment board watermark/background art uses the WebP item image.
- [x] Shop and warehouse payloads normalize stale built-in radio-ticket image rows to the WebP path.
- [x] No unrelated existing worktree changes are reverted or folded into this task.
- [x] `npm run docs:system-design` completes.
- [x] `public/assets/items/rainbow-bean-candy.webp` exists and is a valid WebP image converted from `rainbow-candy-cutout-full.png`.
- [x] Runtime shop/warehouse/gacha consumers receive `/assets/items/rainbow-bean-candy.webp` for "彩虹豆豆跳跳糖" even when existing data still stores the old PNG path.
- [x] `public/assets/items/recruitment-poster.webp` exists and is a valid WebP image converted from `Recruitment_paper.png`.
- [x] Runtime recruitment/shop/warehouse consumers receive `/assets/items/recruitment-poster.webp` for "招新贴报/招新海报" even when existing data still stores the old SVG path.

## Definition of Done

- Focused source changes are implemented.
- Relevant tests or static checks are run.
- System design docs are synchronized because this changes a runtime item asset.

## Technical Approach

Keep the existing recruitment item single source of truth in `src/shared/recruitment.js`; update only the requested item image paths, their stale default path lists, and the default seed snapshot copies that expose the same shop image. Do not alter item pricing, candidates, text, modal layout, or unrelated promotional candidate images.

## Out of Scope

- Redesigning recruitment, shop, warehouse, or modal layouts.
- Removing existing SVG or promotional candidate files unless a later cleanup explicitly asks for it.

## Technical Notes

- Previous radio ticket runtime image path: `/assets/items/radio-recruitment-ticket.svg`.
- New radio ticket runtime image path: `/assets/items/radio-recruitment-ticket.webp`.
- Previous campus recruitment poster runtime image path: `/assets/items/recruitment-poster.svg`.
- New campus recruitment poster runtime image path: `/assets/items/recruitment-poster.webp`.
- Previous rainbow candy runtime image path in stale defaults: `/assets/items/rainbow-bean-candy.png`.
- New rainbow candy runtime image path: `/assets/items/rainbow-bean-candy.webp`.
- Current unconnected promotional candidates live under `public/assets/promotional/radio-coupon-v1..v3.png`.
- The new user-provided source file is `C:/codex/image/item/boardcast_ticket.png`.
- The new user-provided campus poster source file is `C:/codex/image/item/Recruitment_paper.png`.
