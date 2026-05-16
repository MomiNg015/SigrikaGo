# Admin Labels, Replays, And Skill Costs Design

## Goal

Make the admin console clearer for Chinese-speaking administrators, allow admins to replay any user's game records, and make character skill costs configurable through numeric or special cost metadata.

## Admin Console Labels

Admin form labels should use Chinese text wherever practical. Each editable field label should expose a tooltip through `title` so hovering explains what the field controls. Labels should stay compact and reusable through a small helper component instead of repeating tooltip markup.

## User Replay Management

The admin API should expose user-scoped game records and a record detail endpoint for admins. Unlike the player replay API, admin replay access is not limited to the logged-in user's own records. The frontend user management table should let admins open a selected user's records and replay a selected game using the existing replay screen.

## Character Skill Cost Metadata

Character skills gain two fields:

- `costType`: `numeric` or `special`
- `costValue`: string value shown in character detail cost UI

For `numeric`, `costValue` must be a numeric string. When the skill is used, that number is added to the player's accumulated skill cost and subtracted during final scoring. For `special`, `costValue` is free text for display only and has no scoring effect for now.

Existing static characters map their current numeric `skill.cost` values into `numeric` costs. Missing cost data defaults to `numeric` with `0`.

## Character Skill System Messages

Character skills also gain an admin-editable `systemMessage` template. The room system message renderer replaces `{color}`, `{player}`, `{character}`, `{skill}`, and `{point}` when the skill is used, while existing hard-coded text remains the fallback for legacy data.

## Shop And Decoration Management

Admins can manage decorations and shop items from new admin tabs. Decorations are reusable unlockable records identified by slug. Shop items map to either a character slug or decoration slug and include original coin price, discount percentage, purchasable state, display state, sort order, optional image, and description.

The player shop reads enabled shop items from the server, computes the final price server-side, and purchases through an authenticated endpoint. Successful purchases deduct coins and append the target character or decoration to the user's owned lists. Owned decorations are visible from the House screen.

## Testing

Add tests for character input validation, payload serialization, seeded/default cost metadata, dynamic skill cost scoring, admin replay access, shop item listing, and purchase ownership updates. Run the full test suite, production build, Prisma validation, and database push before completion.
