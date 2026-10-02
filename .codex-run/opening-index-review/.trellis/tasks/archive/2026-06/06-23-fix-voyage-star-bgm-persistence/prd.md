# Fix Voyage Star BGM Persistence

## Problem

After Aemeath uses the Voyage Star skill, the Voyage Star BGM starts correctly during the pending skill presentation, but once the animation progresses and the pending skill is cleared, background music falls back to the Little Aie default skill BGM.

## Root Cause

The pending skill payload carries derived-skill music metadata such as `musicTrackId` and `effectType`. After the pending skill is resolved, the room BGM resolver only receives the latest skill character id from room history, so derived-skill metadata is lost and the resolver falls back to the character's selected/default skill BGM.

## Requirements

- The latest resolved skill in room history must preserve enough metadata for BGM resolution: character id, effect type, and explicit music track id when present.
- Voyage Star must continue using `aemeath-voyage-star-default` after the pending skill preview clears.
- Existing character-level skill BGM fallback must continue working for skills without a specific `musicTrackId`.
- Update system design documentation for the resolved-skill BGM behavior.

## Verification

- Add or update unit tests covering latest resolved skill metadata and Voyage Star BGM persistence.
- Run targeted music-library tests.
- Regenerate system design HTML after documentation changes.
