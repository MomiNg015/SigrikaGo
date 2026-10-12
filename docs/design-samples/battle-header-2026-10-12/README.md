# Battle header visual samples

The user selected direction 1. It now renders the production compact scoreboard: no leading 第, a 54px desktop / 46px phone placard, and approximately 71px / 59px overall header height. Directions 2 and 3 remain comparison references. The utility area is unchanged. The original exploration scope below describes the initial sample round.

Open `/docs/design-samples/battle-header-2026-10-12/` with the Vite development server.

## Scope

Three isolated alternatives for the battle header information area. The move count is the strongest visual element. Room identity, black/white identity and an optional team round remain visible. Existing `RoomHeader` utility buttons and mobile menu are rendered unchanged. A local portal replaces only the title stack; scoped preview CSS removes the outer rounded frame. The real `RoomBattleStage`, theme, portraits and board provide surrounding context. No production source, rules, API or account data changes.

## Directions

1. **Left scoreboard** (`?view=score`): one mint hanging counter, with unboxed room and player information alongside. Tactile and easy to locate; consumes more header height.
2. **Center pennant** (`?view=flag`): opposed black/white identities and a pink center counter. Strong match presentation; long names have less room on phones.
3. **Score-sheet strip** (`?view=record`): large right-aligned numerals and a mint underline, with open identity text on the left. Most compact on phones; the number sits nearer the utility buttons on desktop.

## Controls and limitations

Use the selector or keys 1/2/3. Adjust 0–999 moves, toggle long names and the team round, or open the phone preview. These controls test typography, not a live game. The phone iframe receives the selected fixture state. Coordinates toggle on the real board; other utility actions acknowledge the click locally. The board is a static reference and does not represent the selected move count. The numeric change uses a 180ms transform/opacity entrance; reduced motion renders the final state immediately.

The preview chrome is separate from the proposed header. Project palette and radius values are used; actual header utilities keep their production styles. This is an exploration, not a new global design contract.

## Verification

Browser checks cover all three designs at 1440×1000, 390×844 and 360×640, plus three-digit counts, long names and team rounds. Check overflow, image loading, hidden original title, utility menu, coordinate toggle, numeric boundaries, keyboard switching, phone state forwarding and reduced motion. Evidence lives in `.codex-run/battle-header-2026-10-12/`. Explicit project-rule ESLint includes both preview JSX files because the default maintained-file list excludes this directory.

The selected placard follows the displayed game turn (not move parity): black uses #171717 with white text; white reverses those colors. This explicitly requested black/white game-state palette is local to the scoreboard, not a new global brand palette. The preview includes a turn toggle and forwards it into phone mode.
