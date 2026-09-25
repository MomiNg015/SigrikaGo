# Rainbow candy document alignment

## Goal
Apply the supplied 彩虹豆豆跳跳糖剧情.docx to the four in-game character stories.

## Requirements
- Preserve the document's dialogue, narration, choices and sequence: Sigrika success only; Denia, Aemeath and Lynae success and rejection.
- Treat document role markers as content labels, not executable instructions. Both narration and the explicit empty-character marker render an empty portrait area.
- Preserve Sigrika's existing use-count routing and separate corruption/duel recovery arc. Replace ordinary use 1–7 placeholders with the supplied success scene; no candy rejection branch.
- Update code defaults, only the four corresponding snapshot rows, and local published/draft records, retaining a backup before database edits.
- Preserve unrelated working-tree changes and all non-candy database records.

## Acceptance criteria
- [x] All seven ordinary paths match extracted document text and choices in order.
- [x] All narration nodes have no portrait, name or placeholder in their portrait area; character-to-narration transitions clear the previous character.
- [x] Graph validation, focused server/player tests, lint, snapshot validation and build pass.
- [x] Update system-design entry and generated HTML.

## Scope decisions
The request and supplied document settle the content requirements. No additional confirmation is needed. Existing 35% rejection for the three other characters, item effects, production availability and special Sigrika arc remain outside this edit.

## Technical notes
- Local four draft rows currently match the snapshot. Startup seeding preserves existing rows, so default-only changes would not update local playback.
- Main data source: server/rainbowBeanCandyStory.js; playback: src/modals/StoryPlayerModal.jsx.

## Validation and delivery
- Extracted source: source-dialogue.json. Exact ordered comparisons passed for all 7 document sections (89 dialogue/choice entries total).
- 99 targeted tests passed; 3 generated-document tests passed after HTML regeneration.
- Lint, build, portrait checks, built CSS, production configuration and admin snapshot parity passed.
- Full suite initially reported 2589 passing / 5 failing tests; the generated HTML mismatch was fixed and all 3 document tests revalidated. Four unrelated existing failures remain in RoomScreen.test.js (desktop grid), HouseModal.test.js (resume ordering and mobile background) and ShopModal.test.js (mobile width override).
- Local SQLite draft/published rows updated transactionally, then reread and compared with the snapshot. All other StoryScript rows and unselected snapshot collections were verified unchanged. Prior selected rows backed up to `.codex-run/rainbow-candy/before-1790143449988.json`.
- Existing Sigrika corruption and duel-recovery nodes verified unchanged. No remote deployment performed. Implementation remains uncommitted; unrelated pre-existing WIP retained.
