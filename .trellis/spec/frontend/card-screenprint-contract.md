# Functional card screenprints

## Scope and owners

The approved seven-print family is production Bright School paint. `src/styles/mobile-adaptive/card-screenprints.css` is the final owner, imported after the existing surface and typography owners. It is limited to `.app-shell.player-theme-enabled.theme-bright-school:not(.is-sigrika-corrupted)` and explicit window/card descendants. Other themes, corruption, IRIS, administration, inputs, controls and dedicated character artwork are outside this contract.

## Role map

| Role | Runtime SVG under `/assets/ui/card-prints/` | Cards |
| --- | --- | --- |
| Identity | identity.svg | Profile identity hero |
| Record | record.svg | Profile record, capture result, recent results and character-record container |
| Honor | honor.svg | Achievement content row; never the heading row |
| Rank | rank.svg | Primary rank summary only; exact horizontal mirror of honor, lower-left |
| Social | social.svg | Friend entry and companion detail |
| Inventory | inventory.svg | Warehouse item entry and inspector |
| Tactics | tactics.svg | Watch row backing and character skill body, including derived skills |
| Reading | reading.svg | Character introduction, announcement entry and reader, mailbox entry and body |

Rank and achievement share a motif but have separate assets/anchors. Rank must use `left -28px bottom -10px`; honor remains `right -18px bottom -16px`. Never flip the rank card with CSS transform: text, stars, buttons and layout must remain unchanged.

## Paint and state contracts

- Set `--card-print-image`, `--card-print-size` and `--card-print-position` by semantic owner, never by item index or arbitrary runtime randomness.
- Use background image/size/position/repeat/origin longhands only; repeat is `no-repeat`, origin is `padding-box`. Do not reset `background-color`, borders, shadows, motion, dimensions or scrolling.
- The existing profile paper owner has important background shorthand and high specificity. The final print selector includes the explicit profile window owner so its five important paint longhands win without a universal card selector.
- `.wl-row::before` owns the watch texture; do not paint the row/foreground again. Finished gray, active/hover colors and the backing translation remain owned by watch styles.
- Character detail portals normally mount to the existing `.app-shell`; retain skill-title Tacet Mark, introduction stones, faction emblem and portraits. A browser fixture must mount its themed shell before opening the portal, matching the real app lifecycle. Do not weaken the theme boundary to compensate for a body-mounted test fixture.
- At 768px and below, reduce large-profile, companion/inspector, skill, reading and watch print sizes according to the approved sample. Do not introduce a new breakpoint or motion for static decoration.
- Public SVGs are committed finite artwork. No external URLs, script, full-card tiling, generated runtime canvas or new preload work is required.

## Verification

`tests/e2e/card-screenprints.spec.js` compares the current approved sample and production-only preview at 1440/390/320px: text, semantic fills, background dimensions/anchors, correct asset, single drawing, geometry within 0.5px native table rounding, and no overflow. It also covers asset availability, corrupted/unthemed exclusion, historical pure-color sample isolation, selected/pressed entries and finished-watch hover/press paint. Production preview must load no sample texture CSS or sample root marker.

Keep the exact task-only CSS debt delta in `cssLayerInventory.js`; do not absorb unrelated checkout drift. Run production build and `check:built-css` to verify nested selectors and public resource delivery survive compilation.
