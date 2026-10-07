# Independent interface visual review

Reviewed actual player/admin screenshots under `.tmp/interface-polish/live` across the original and refreshed capture sets: 32 player captures (1440 and 390px) and 21 admin pages (1440px). Additional computed checks use the actual RecruitmentModal, AdminShell, AdminCharacters and AdminAnnouncements components with the complete production CSS, read-only local API fulfillment and existing assets. No generated design mocks were substituted.

## Verified issues and disposition

| Finding | Evidence and cause | Disposition |
| --- | --- | --- |
| Legal ordinary ASCII names could truncate in phone profiles. | Original `resume-390.png` displayed `fx2eee…`; profile name columns reserve 120px at390 and100px at320, and the tag's extra gutters reduced usable text width. | Profile owner removes plain-name gutters and allows at most two lines at24px/22px. `fx2eee94` and `WWWWWWWW` join the matrix. Equipped nameplates retain their own single-line sizing. |
| Two-line self names intersected the absolutely positioned achievement/personalization controls at320px. | Dedicated `profile-qa/resume-320-wide-name-hero.png` exposed a second line beneath the icon buttons. Geometry/scroll-only tests did not detect this. | Profile owner uses identity/action grid tracks only for plain self identities. The portrait spans both tracks; actions remain44px and native body scrolling absorbs bounded hero growth. Matrix now checks name/button intersection. |
| Empty recent-result copy wrapped into two lines. | Original live390 self resume; `.profile-rank-results .recent-result-empty` had width56px for `暂无最近十盘`. | Existing mobile summary owner now uses intrinsic width,8px side padding and nowrap. Empty recent data is tested separately from empty character records. |
| Admin quiet text inherited pale terminal cyan on white. | Admin04/05/12/17 screenshots; global `modal-chrome.css:116` sets `.quiet-text` to `--terminal-muted`, `rgba(185,233,228,.72)`. Its composited contrast on white is1.22:1. The admin token selector list omitted `.quiet-text`. | Root corrected the admin owner. Actual AdminCharacters now computes `rgb(100,116,139)` at16px on white:4.76:1. Updated admin04 screenshot is legible. |
| Announcement pin checkbox consumed the input width and squeezed its label vertically. | Original admin13 screenshot; `.admin-announcement-edit-pane input` applied width100% and text-input padding to `type=checkbox`, defeating the shared toggle's18px control. | Root excludes checkbox from the text-input rule. Actual checkbox is18×18, label text64×20 inside a357.75×46px flex row. Updated admin13 screenshot is correct. |

## Loading and capture limits

- An earlier recruitment live390 capture showed a blank stage and quantity-only buttons after an image-decode pass. Independent actual-component screenshots showed all three existing item icons and selection copy/watermark. All icons report `complete=true`, natural widths1668/512/512, `display:grid`, `visibility:visible`, `opacity:1`, phone boxes28×28, `object-fit:contain`, and no clip/filter. Desktop icons are34px wide. Sources: `RecruitmentModal.jsx:170,276`, shared `RECRUITMENT_ITEMS` and `server/recruitment.js:316`; mobile CSS hides the item-name span intentionally, leaving icon+quantity. Root's corrected live capture now waits for the actual selection card and all three images, and the updated390 screenshot shows the icons/text correctly. Image-decode alone could not wait for future API-mounted content. No recruitment production CSS change was necessary.
- The original phone shop lacked Zahira because the lazy image was not yet decoded. Updated `shop-390.png` includes the full mascot, speech bubble and products; this observation was cleared without a layout change.
- Earlier replay screenshots captured the underlying resume/loading transition. The refreshed390 replay screenshot shows its own empty dialog and close control. Desktop replay and phone mailbox captures still contain loading copy; they validate the shell/loading state, not populated content layout.
- The original admin capture loop sometimes photographed zero records or loading copy immediately after a successful response. Refreshed admin04 contains actual character rows and a settled single active sidebar tab. No data-loss or duplicate-active-state bug was inferred from transitional screenshots.
- Rank, watch, friend, report and audit fixtures mostly contain empty isolated data. Their visible empty states are readable and contained; populated density, very long user content and complex administrative editor states remain separate checks.

## Consistency and usable composition

- Home preserves the illustrated campus board, student ID, handbook and familiar illustrated actions. IRIS remains its authored terminal widget; it was not repainted as a paper card.
- Shared player dialogs maintain paper surfaces, dark ink, short hard shadows, exterior title stickers/bookmarks and compact close controls. Settings, announcements/mail and message-board screenshots show readable content and reachable controls at390px.
- Handbook's alternating portrait strips and locked silhouettes are authored content states. Warehouse rows remain readable. The decoded shop keeps its distinct tent scene while its buttons/text remain legible.
- Profile rank/record hierarchy and the quiet recent strip now match the notebook vocabulary. Native table records and the original short-phone body scroller remain intact; populated profile reachability is tested with all character records.

## Evidence

- Broad captures: `.tmp/interface-polish/live/`.
- Profile matrix and dedicated name shots: `.tmp/interface-polish/profile-qa/`; script `.tmp/profile-polish-qa.mjs` uses real fixture components and meaningful geometric assertions.
- Read-only computed/art checks: `.tmp/interface-polish/computed-review/`; temporary actual-component harness `.tmp/interface-source-review.{html,jsx,mjs}`.
- Scope: this reviewer changed only its previously assigned profile CSS/tests and research notes. Root owns admin fixes, global documentation, CSS inventories and consolidated quality gates.
