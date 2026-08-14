# Default costume illust data-flow research

## Existing contract

- `src/shared/costumes.js` already builds the virtual default-costume card from the selected character and already reads `character.illustName` / `character.illustUrl`.
- `src/modals/house/CharacterCostumeDialog.jsx` already renders the illust label and optional link for every costume detail, including the virtual default card.
- Persisted non-default costumes already have `illustName` / `illustUrl`, backend validation, admin form controls, public payload fields, snapshot export, and tests.

## Missing link

- `prisma/schema.prisma` does not currently define `illustName` / `illustUrl` on `Character`.
- Character validation, persistence, public/admin payloads, admin drafts, and `AdminCharacters.jsx` currently carry CV metadata but not illust metadata.
- As a result, the virtual default-costume card's existing reads always fall back to empty strings for database-backed characters.

## Recommended implementation

Add optional `illustName` and `illustUrl` fields to `Character` and carry them through the same durable cross-layer path used by `cvName` / `cvUrl`:

1. Prisma schema, initial migration, and legacy SQLite compatibility guard.
2. Character validation and create/update persistence.
3. Public/admin character payloads and built-in fallback merge.
4. Admin character draft and editor inputs.
5. Admin default snapshot export/sync preservation.
6. Focused tests covering validation, persistence, payloads, snapshot durability, and default-costume detail rendering.

The existing default-costume virtual card and wardrobe detail UI can then consume the fields without introducing a persisted default `Costume` row.
