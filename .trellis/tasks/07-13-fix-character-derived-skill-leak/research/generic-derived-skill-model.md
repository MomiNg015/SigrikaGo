# Generic derived skill model research

## Existing architecture

The project already has the right persistence envelope: a base skill owns `params.derivedSkills[]`, while `effectType` selects executable gameplay behavior from `skillEffectCatalog`. No Prisma schema change is needed.

The current coupling comes from implementation defaults rather than storage:

* `adminDrafts.js` creates a Voyage Star draft for every character.
* `derivedSkills.js` spreads the Voyage Star definition as the normalization base for every derived skill.
* `AdminCharacters.jsx` exposes derived fields only for `hidden-hand` and assumes one fixed item.
* `server/characters.js` validates only that `paramsJson` parses, not the derived-skill contract inside it.

## Model boundary

A derived skill definition is content/configuration. It may declare:

* stable id and registered effect type;
* display name and description;
* uses, turn-consumption behavior, target rule, and cost;
* optional music track association.

The effect implementation is executable domain logic. A new board rule still requires a registered `effectType`, handler, tests, replay behavior, and presentation assets where applicable. Treating arbitrary JSON as executable gameplay would create an unsafe and hard-to-test rule engine.

## Recommended approach

Use explicit ownership plus a registry:

1. A base skill's `params.derivedSkills` is the only source for its derived definitions.
2. Empty means empty; no character-specific defaults enter generic constructors or normalizers.
3. Shared normalization uses neutral defaults and the effect catalog.
4. Client serialization and server validation enforce the same structural contract.
5. Gameplay handlers query a definition by effect type from the current base skill.
6. Built-in character defaults explicitly persist their own definitions.

This supports future characters without character-specific branches while preserving an authoritative, testable boundary for new gameplay effects.

## Legacy migration

The shipped bug may already have copied the exact built-in Voyage Star object into unrelated character records. A permanent rule such as "Voyage Star only belongs to Aemeath" would undermine future reuse. Instead, use a narrowly scoped legacy sanitizer that matches the known buggy signature on affected non-owner records and removes only that historical artifact. New explicit configurations remain valid.

## UX and authority implications

The admin editor is a content editor, not a rule designer:

* the base skill and every code-defined derived skill are fixed form groups;
* each group exposes only name, description, and overclock content;
* effect type, target behavior, uses, turn behavior, parameters, music association, and enabled state are not editable;
* no add or remove action exists;
* the server preserves the stored structure and rejects requests that try to alter it, so this is an authority rule rather than a cosmetic hiding rule;
* no new animation or visual system is required.
