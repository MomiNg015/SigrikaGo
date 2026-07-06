# Static shop mascot layout prototype

## Goal

Create a standalone static HTML prototype for the shop layout so the enlarged bottom-right shop receptionist composition can be reviewed before changing the production React modal or CSS contracts.

## Requirements

* Add `prototypes/shop-mascot-layout-static.html` as a self-contained static page with inline CSS.
* Use the existing `/assets/zahira_shop_default.webp` mascot image.
* Show desktop and mobile mockups on the same page.
* Desktop mock should place the product grid on the left and a larger receptionist stage on the bottom-right.
* Mobile mock should keep tabs and products primary while placing the mascot as a bottom-right stage with reserved product-list bottom space.
* Include static sample cards for `杂物`, `装饰`, and `音乐`.
* Do not change production React, API, backend, tests, or production CSS.
* Do not update system design docs for this disposable prototype.

## Acceptance Criteria

* [ ] The prototype file exists at `prototypes/shop-mascot-layout-static.html`.
* [ ] Opening the HTML directly or through a static server displays both desktop and mobile shop mockups.
* [ ] The desktop mascot is visibly larger and anchored bottom-right without covering the greeting or coin capsule.
* [ ] The mobile mascot is bottom-right with visible reserved space so product buttons remain readable.
* [ ] The prototype references existing project assets only.

## Definition of Done

* Prototype file is created.
* The HTML is inspected for the required asset reference and responsive mockup structure.
* No production implementation files are changed.

## Technical Approach

Use plain HTML and CSS. Keep the page independent from Vite/React so it can be opened directly. Use fixed mock device frames to compare desktop and mobile variants side by side on wide screens and stacked on narrow screens.

## Out of Scope

* Production `ShopModal` layout changes.
* New assets.
* API integration.
* System design documentation updates.
* Automated browser regression tests.

## Technical Notes

* Prior mobile shop work had overlap issues, so this prototype must reserve space around the mobile bottom-right mascot instead of placing controls underneath it.
* Existing mascot asset: `public/assets/zahira_shop_default.webp`, browser path `/assets/zahira_shop_default.webp`.
