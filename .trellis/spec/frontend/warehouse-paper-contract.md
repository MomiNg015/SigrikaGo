# Warehouse paper layout

## Ownership and approved presentation
`WarehouseItemGrid` owns selectable single-column item cards, the inspector and its action. `warehouse-field-guide.css`, `warehouse-field-guide-detail.css` and `warehouse-field-guide-mobile.css` are the existing final style owners. Keep import order and the unrelated target-dialog declarations in those files. Do not add a second override layer.

Use aligned `持有` plus a numeral in the directory and beside the action; keep inventory numbers off the artwork. No category tabs, category text, kind counters or detail paging controls. The inspector keeps its circular backdrop, dashed ring and -7 degree artwork rotation. Paper cards have 3px/4px hard shadows, fine-pointer hover lift and press sink. Disabled actions cannot move; reduced motion disables transitions.

Portrait layout has one item per row above a compact 196–226px inspector with side-by-side art/text and a full-width action row. Only directory and necessary detail prose scroll. Preserve original title sticker/shell dimensions, shadow gutters and body-safe heights. Desktop keeps two columns and large detail artwork.

## Selection and behavior
Selection stores item ID and fallback index. Resolve data from the latest `items` prop on every render, preserving selection across reorders and quantity updates. On removal choose the next item at that position, clamped to the final item. Empty inventory keeps directory/inspector and disables use, without stale content.

Keep `usingItemId`, zero-stock, missing recruitment callback and `actionVisible` guards. `usable === false` routes to recruitment; `targetType === "character"` opens the existing target picker; other usable items invoke existing use. Selection never consumes an item. `useWarehouseInventory` retains server data, request serialization, refresh, errors, stories and notices. Never copy template fixture state or confirmation behavior into production.

## Whole-card scrolling
`useWarehouseListRows(enabled = true)` returns the list ref. CSS defines `--warehouse-row-min`; the hook measures content height, row gap and padding, then writes `--warehouse-row-height` for an integer number of visible rows. Native `scroll-snap-type: y mandatory` with card start alignment and matching scroll padding keeps both viewport edges complete after settling. Snap alone cannot guarantee the trailing edge.

Observe the list and viewport resizing; disconnect observer and listener when disabled or unmounted. Ignore zero/non-layout geometry and allow environments without ResizeObserver. Empty, refreshed and many-item lists use the same container. Do not add wheel/touch event interception or continuous animation-frame polling. The standalone sample reuses this hook.

## Verification
`WarehouseItemGrid.dom.test.jsx` covers selection/refresh/removal and action guards. `useWarehouseInventory.dom.test.jsx` covers API serialization, rejection/retry and target/story flow. `useWarehouseListRows.dom.test.jsx` covers non-layout mounting, remeasurement and cleanup. `warehouse-paper.spec.js` runs actual WarehouseModal at desktop/800px and 390/360/320px portrait plus short screens, including native wheel/touch, endpoints, resizing, use/removal, target picker, recruitment, long text and 9999 quantities. Existing empty-warehouse E2E must assert absent classification/paging. Check loaded images and real computed geometry after font/entrance settling; document screenshots in the sample directory.
