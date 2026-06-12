# Gacha UI and Interaction Design

## Direction

The gacha surface should feel like a "school-club capsule machine": playful, tactile, collectible, and slightly ceremonial, while still belonging to SigrikaGo's Bright School lobby. Avoid casino styling, generic neon, heavy purple gradients, or a separate visual universe.

Use existing modal grammar: close button placement, wallet pills, tabs, internal scrolling, compact mobile rules, and admin table/drawer density. The unique memorable element is the central capsule machine: featured prize art sits inside a round display window, with a coin-slot/button strip below and a small capsule reveal animation on draw.

## Player Gacha Window

* Layout:
  * Modal with left vertical pool tabs and right selected-pool content on desktop.
  * Mobile collapses tabs into a horizontal scroll strip above the pool content.
  * Tabs are stable-size rows/cards and never resize from longer pool names or dates.
* Pool tab content:
  * featured prize thumbnail in a fixed square/round frame;
  * pool name with two-line clamp;
  * `YYYY/MM/DD-YYYY/MM/DD` date range or `永久开放`.
* Selected pool content:
  * large featured-prize display window at the top/center;
  * remaining open time near the featured art using tabular numbers;
  * two circular icon buttons: prize list and draw history;
  * coin and blue-gem wallet pills;
  * single and ten draw buttons showing configured prices.
* Empty state:
  * If no pools are currently open, show one concise closed-state panel with a return/close action and no inactive pool tabs.

## Modals

* Prize-list modal:
  * accessible dialog layered above the gacha modal;
  * list/grid rows show prize image/icon, type label, name, quantity, and probability;
  * probabilities use numeric text, not color alone.
* Draw-history modal:
  * newest records first;
  * shows pool name, draw count, total coin cost, timestamp, and compact reward summary;
  * uses internal scroll and a clear empty state.
* Result modal:
  * opens only after the draw animation finishes;
  * groups rewards by draw order for ten-draw, but keeps visual density manageable;
  * duplicate conversions are explicit, for example `已拥有，转换为蓝色宝石 +1` or `角色链数 +1`.

## Animation

* Trigger sequence:
  * button press gives immediate pressed feedback within 100ms;
  * coin/capsule machine animates for about 900-1400ms;
  * result modal appears after the animation promise/state completes.
* Animation language:
  * coin slot pulse -> capsule chamber rotate/shuffle -> capsule pop/reveal flash;
  * use transform and opacity only;
  * no layout-shifting width/height/top/left animation.
* Reduced motion:
  * skip shuffle/rotation;
  * use a short fade/scale reveal under 250ms;
  * do not play long looping motion.
* Async behavior:
  * draw buttons are disabled while request or reveal is in progress;
  * errors stop the animation and show toast/error state;
  * animation state must clean up timers on modal close/unmount.

## Admin Gacha Management

* Add `gacha` to admin tabs as `扭蛋管理`.
* Main table columns:
  * pool name, open window, single/ten prices, featured prize, prize count, probability sum, enabled state, actions.
* Drawer fields:
  * pool name, description, enabled, sort order;
  * permanent-open toggle;
  * startsAt/endAt date-time fields when not permanent;
  * single draw price, ten draw price;
  * featured prize selector;
  * prize editor section.
* Prize editor:
  * type segmented control/select;
  * target selector/input with validation;
  * quantity number input;
  * probability percent input;
  * enabled toggle;
  * inline total probability indicator that turns valid only at 100%.
* Admin remains work-focused: no big ceremony animation, just clear validation, saving, and audit feedback.

## Accessibility and Responsive Contracts

* All icon-only round buttons have `aria-label`, `title`, visible focus states, and 44px minimum hit area.
* Buttons disabled during draw use semantic `disabled`, reduced emphasis, and no click handler.
* Date ranges and countdowns are text, not image-only.
* Prize images include meaningful alt text.
* Player and admin modals must remain inside `100dvh` on mobile with internal scroll regions.
* No horizontal page scroll on 375px mobile.
* Motion respects `prefers-reduced-motion`.

## Visual Tokens to Reuse or Extend

* Reuse current modal, wallet, tab, close-button, and admin drawer patterns.
* Add gacha-specific classes rather than broad global button or modal overrides.
* Use a varied palette rooted in the existing project: warm paper surfaces, mint/green success accents, gold coin accents, blue-gem cyan accents, and a limited cherry/red capsule accent.
* Keep dominant purple/blue-gradient, dark-slate, beige-only, and brown/orange-only palettes out of the final design.
