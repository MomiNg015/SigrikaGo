# Chisa Liberty Purge Design

## Goal

Add 千咲 / Chisa as a recruitable character with administrator access during the pre-recruitment period, and implement her active skill 虚湮解弦 without violating existing Go, neutral-stone, hidden-hand, protocol-ban, overclock, replay, or skill-preview behavior.

## Approved Design

Chisa uses slug `chisa` and portrait `/assets/characters/chisa.png`. Her public acquisition method remains 招募获得; admins receive her through the existing temporary admin-owned character list.

The skill uses `effectType: liberty-purge`. The target is a legal normal-move empty point, not a generic empty-point skill target. The server remains authoritative for self-capture, ko, protocol bans, hidden hands, and other legal-move checks. If Chisa targets an opponent hidden hand that only appears empty to her client, the hidden hand is revealed and the skill is not spent.

On success, the skill places a real black/white stone without Nabomo color illusion. Normal capture resolution happens first. Then the server takes a single post-move board snapshot and removes every group with exactly one liberty. This includes friendly, enemy, neutral spray, hidden-hand, and just-placed groups. Neutral spray stones count as non-friendly for Chisa overclock but do not belong to either player's `skillRemovals`.

Overclock uses the raw delta from snapshot removals: non-friendly removals add 1 each, friendly removals subtract 1 each. The actual added cost is clamped with `max(0, rawDelta)`, while history keeps both raw and clamped values. Base skill cost remains 0 and is still recorded. The skill consumes the turn, increments move number, clears passes, clears ko, and is recorded as a successful active skill so it unlocks ChangLi for the opponent.

Removed points get a temporary red-cross marker in an independent marker layer or field, not in the existing single `skillEffect` slot. The marker is cleared when the opponent's next turn actually ends; non-turn-consuming skills do not clear it early.

## Alternatives Considered

1. **Reuse ordinary move history plus a second skill history entry**: simpler locally, but replay and ChangLi unlock would become ambiguous.
2. **Treat Chisa as an `empty-point` skill**: fits current catalog, but misses suicide and ko validation and would over-highlight illegal targets.
3. **Store red crosses in `skillEffect`**: minimal schema work, but conflicts with erased points, blast markers, and protocol visuals.

The approved approach is a dedicated skill type with legal-move semantics and independent removal markers.

## Component Impact

* Shared rules: add the `liberty-purge` handler and any helper needed to validate/place a normal stone without applying color illusion.
* Skill catalog/config: register `liberty-purge` and normalize Chisa skill config.
* Character assets and ownership: add Chisa fallback data and admin availability.
* Board UI: preview legal empty targets conservatively and render red-cross removal markers independently.
* Skill preview/replay: preserve Chisa as a skill history entry with target, removals, overclock, and marker data.
* Docs: update system design and regenerate the HTML artifact.

## Test Strategy

Cover normal success, illegal targets, suicide, ko, protocol ban, hidden-hand reveal without spending, snapshot removals across friendly/enemy/neutral/hidden-hand groups, overclock clamping, `skillRemovals` ownership, turn consumption, ko clearing, ChangLi unlock, red-cross marker rendering, and marker cleanup after the opponent turn ends.

## Out of Scope

* Full recruitment system.
* Player-facing wording change for neutral stones.
* Broad active-skill pipeline rewrite beyond helper extraction needed for Chisa.
