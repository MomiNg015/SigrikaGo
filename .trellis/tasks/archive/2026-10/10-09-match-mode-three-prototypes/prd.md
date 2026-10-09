# Three match mode prototypes

## Goal
Deliver three distinct interactive desktop and portrait-mobile designs for the match mode selection window. The user will choose before production integration.

## Requirements
- 星炬对弈: 13-line skill Go, containing 常规匹配, 吃子挑战赛, 队际赛.
- 标准对弈: 19-line Go without skills, containing 常规匹配.
- 玩些别的: other rules, containing 来下五子棋吗？.
- Clicking a category slides its child choices into view, including categories with one child.
- Preserve conceptual access to character selection and rules; demonstrate selection locally without starting real matches.
- Three axes: inline folding cards; persistent category bookmarks and detail pane; tickets with sequential page navigation.
- Native campus paper, brown ink, mint/pink/blue palette; shared existing artwork.
- Isolated static HTML under docs/design-samples, served by Vite without app imports.

## Acceptance
- All categories, all children, back/close/reopen, character previews and local continue feedback work.
- Verify 1440×900, 390×844 and 320×568; no horizontal overflow; reduced-motion support.
- Capture each desktop/mobile direction and update system-design summary and generated HTML.

## Out of scope
Production window replacement, APIs, gameplay, persisted selections and real matchmaking. No unresolved blocking questions; visual choice happens after delivery.

## Selected direction and implementation scope
User selected direction 3 and requested minimal changes to the existing window. Promote sequential category → child page navigation using existing cards, title sticker, watermark, practice entry, character slots and match callbacks. Preserve separate cached selection keys (regular/standard/gomoku/capture/team), rules popovers, corrupted-story lockout and nested-dialog Escape handling. Do not copy prototype decoration or demo callbacks. Production implementation is now in scope; API/gameplay changes remain out of scope.
