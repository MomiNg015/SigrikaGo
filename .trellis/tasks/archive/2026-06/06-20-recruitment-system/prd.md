# Recruitment System

## Goal

Replace the player-facing gacha flow with a recruitment system that feels like a Go club recruitment activity. Players buy recruitment supplies from the shop, keep them in the warehouse, start one timed recruitment action from the recruitment modal, and return later to reveal the response.

## Requirements

### Player-Facing Concept

- Fully replace player-facing gacha terminology and interaction.
- Do not show gacha, prize pool, ten-pull, probability list, or old gacha history in the player UI.
- Use the product term Recruitment / ?? for the entry and modal.
- Keep old gacha data available for backend/history safety, but do not expose it as player recruitment history.

### Shop And Warehouse

- Rename the shop category currently used for characters to Misc / ??.
- Characters are no longer directly purchasable from the shop.
- Remove Baconbits / ??? from shop sale.
- Sell two misc items:
  - Campus poster / ????: can recruit people inside the academy.
  - Radio broadcast ticket / ???????: can recruit people outside the academy.
- Purchased recruitment items enter the warehouse.
- Warehouse item cards show name, quantity, description, and an unavailable state.
- Warehouse must not offer Use or Go to Recruitment for these items.
- Recruitment items can only be used from the recruitment modal.

### Candidate Pools

- MVP candidate pools are code-fixed, not admin-editable.
- Campus poster candidates: Lynae, Mornye, Chisa.
- Radio broadcast ticket candidates: QiuYuan, ChangLi.
- Player UI does not reveal exact candidate names for each item; it only shows the recruitment scope text.
- Starting recruitment filters out already-owned characters.
- If the filtered candidate list is empty, do not consume the item and do not create a task. Show: ???????????????????????
- If recruitment succeeds, choose one unowned candidate from the filtered list with equal probability.

### Recruitment Task Lifecycle

- A player can have at most one active recruitment task at a time.
- States:
  - idle: no task; player can select a recruitment item and start.
  - pending: recruitment is running; show the item and countdown.
  - ready: countdown ended; result is ready to reveal; home Recruitment entry shows a red dot.
  - claimed: result has been claimed and the player can start a new task.
- pending does not show a home red dot.
- ready shows the home red dot until claimed.
- pending and ready both block starting another recruitment.
- pending cannot be cancelled.
- Recruitment task state must be backend-persisted and survive refresh, reconnect, login, and device changes.

### Result Generation And Claiming

- Start time behavior:
  - Validate no pending/ready task exists.
  - Validate item quantity.
  - Validate there are unowned candidates for that item type.
  - Consume exactly one item.
  - Decide the result immediately on the server.
  - Persist startedAt, readyAt, selected item, result type, and result character if any.
- Countdown completion behavior:
  - Do not automatically grant character or refund item.
  - The task becomes ready when readyAt <= now.
- Claim behavior:
  - Player clicks View Result / ???? in the recruitment modal.
  - Backend atomically grants the character on success or refunds the item on no-response.
  - Mark task claimed and return display payload.
  - The modal then shows the result and a single confirmation button.

### Success Rates And Pity

- Success rates are admin-configurable with defaults:
  - normal: 50
  - boosted: 75
  - guaranteed: 100
- Validate rates are in 0-100 and non-decreasing.
- Player UI does not show numeric percentages.
- Player UI shows admin-editable response-confidence copy instead.
- Track consecutive no-response count by item type:
  - campus_poster has its own miss streak.
  - radio_ticket has its own miss streak.
- No response increments only that item type streak.
- Success resets only that item type streak.

### Admin Configuration MVP

Admin configuration supports:

- Recruitment duration seconds, default 300, suggested bounds 10-86400.
- Three global success rates, default 50/75/100.
- Three response-confidence copy strings per recruitment item type.
- One success copy string per recruitable character.
- Two to three no-response copy strings per recruitment item type.

Admin MVP does not support:

- Candidate pool editing.
- Character weights.
- Per-character rates.
- Per-item independent rate ladders.
- Multi-branch character story scripting.

### Recruitment Modal UX

Use the approved three-row layout from prototypes/recruitment-three-row-demo.html.

Rows:

1. Header row: title, concise explanation, close control.
2. Main row: current recruitment content.
3. Action row: item selection and use/claim confirmation.

Idle initial state:

- Main row shows only a public notice board background and a prompt.
- Action row shows both recruitment item buttons and the Use button.
- Use is disabled until the player selects an item.

Idle selected-item state:

- Main row shows item icon, item name, recruitment scope, and response-confidence copy.
- Action row still shows both item buttons and Use.

Pending state:

- Main row shows only item icon, item name, and countdown.
- Action row is hidden.

Ready state:

- Main row shows item icon, item name, and View Result button.
- Action row is hidden.
- Home Recruitment entry has a red dot.

Result state:

- Success: main row shows character portrait/art and success copy; action row has only Welcome New Member / ??????.
- No response: main row shows no-response copy; action row has only Retrieve Item / ????.
- Clicking the single confirmation returns to idle.

Responsive requirements:

- Desktop and mobile both use a large modal, not a standalone full-screen route.
- The third row must stay on one line on desktop and mobile: both item buttons plus the Use button must not wrap to another row.
- Mobile adapts by reducing item button icon size, text size, gaps, and button width while preserving touch target height.
- No horizontal page scroll.
- State transitions should not cause the modal shell to jump.
- Respect reduced motion.

### Home Entry

- Replace the old gacha entry with Recruitment / ??.
- pending: no red dot.
- ready: red dot.
- claimed/idle: no red dot.

### Baconbits / ??? Visibility

- Baconbits is removed from shop sale and is temporarily unobtainable.
- If the player does not own Baconbits:
  - Show a placeholder character card with ????.
  - Do not show real portrait, art, skill, intro, voice, or BGM details.
  - The card cannot be opened for details.
  - The character cannot be selected for battle.
- If the player owns Baconbits:
  - Keep full display, details, battle selection, and information access.
- This hidden-intel rule applies only to Baconbits, not all unowned characters.

## Technical Approach

- Add a new Recruitment domain instead of reusing Gacha naming for new player behavior.
- Keep old Gacha tables/routes only where needed for compatibility or admin/history safety.
- Add backend routes:
  - GET /api/recruitment/status
  - POST /api/recruitment/start
  - POST /api/recruitment/claim
  - Admin recruitment config routes as needed.
- Persist recruitment tasks and per-user per-item miss streaks.
- Update item/shop seeding so recruitment supplies are misc items and direct character sale is disabled.
- Update player assets and warehouse behavior so recruitment items are visible but not warehouse-usable.
- Add RecruitmentModal and hook(s), wire app overlay state and home entry red dot.
- Replace GachaModal player entry with RecruitmentModal.
- Update docs/system-design.md and the relevant docs/system-design split files; run npm run docs:system-design.

## Acceptance Criteria

- [ ] Shop shows Misc / ?? instead of direct player character sale.
- [ ] Recruitment supplies can be purchased and appear in warehouse.
- [ ] Warehouse cannot directly use or jump from recruitment supplies.
- [ ] Player gacha UI is no longer reachable as gacha.
- [ ] Recruitment modal follows the three-row layout on desktop and mobile.
- [ ] Third-row buttons remain in one line on 390px-wide mobile viewport without horizontal scroll.
- [ ] A player cannot start more than one recruitment task at a time.
- [ ] Starting recruitment consumes one item and persists a task with a hidden result.
- [ ] pending survives refresh/login and shows a countdown.
- [ ] ready shows a home red dot and blocks new recruitment until claimed.
- [ ] Claiming success grants exactly one unowned candidate.
- [ ] Claiming no-response refunds the consumed item.
- [ ] Full-owned candidate pool blocks start without item consumption.
- [ ] Success rates and response copy are admin-configurable.
- [ ] Miss streak is tracked separately per item type.
- [ ] Baconbits hidden-intel behavior applies only to unowned Baconbits.
- [ ] Old gacha history is not shown as recruitment history.
- [ ] System design docs are updated and generated.

## Definition Of Done

- Focused unit/integration tests cover backend recruitment lifecycle, item inventory changes, config validation, candidate filtering, and Baconbits visibility.
- Frontend tests cover modal states, red-dot state, warehouse non-use state, and responsive one-line third row selectors.
- Relevant CSS contract tests are updated for any new stylesheet entries.
- npm run docs:system-design is run after docs updates.
- Run the project quality gate required by Trellis before commit.

## Out Of Scope

- Candidate pool admin editing.
- Character-specific weights or probability UI.
- Recruitment history UI.
- Migrating old gacha draw records into recruitment records.
- New Baconbits acquisition path.
- Multi-step character story events.

## Technical Notes

- Current code has Prisma GachaPool/GachaPrize/GachaDraw models and player GachaModal; new work should avoid leaking these labels into the new player UI.
- Current Bright School visual language uses light paper surfaces, thick borders, hard shadows, pink/blue/yellow accent blocks, and explicit mobile survival layers.
- Approved prototype: prototypes/recruitment-three-row-demo.html.
- Chinese Markdown/docs must be written through Node UTF-8 writer or scripts/write-utf8-doc.mjs, not PowerShell Set-Content.
