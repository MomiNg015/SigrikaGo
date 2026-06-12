# PRD: Gacha Multiple Featured Prizes

## Goal

Allow a gacha pool to mark multiple prizes as featured prizes instead of forcing a single grand-prize selection.

## Requirements

- Admins can toggle any number of prize rows as featured.
- Admins can clear all featured prizes.
- Existing pools that only have `featuredPrizeId` continue to load as one featured prize.
- Admin save payload sends `featuredPrizeIndexes: number[]`; legacy `featuredPrizeIndex` remains compatible while the backend and frontend migrate.
- Backend validation accepts an empty array and rejects only indexes outside the current prize list.
- Stored gacha pool payloads expose `featuredPrizes` as an array and keep `featuredPrize` as the first featured prize for older display surfaces.
- Player gacha display must continue working with open-pool filtering and existing draw behavior.
- `docs/system-design.md` must be updated with the new contract.

## Acceptance

- Draft helpers default to `featuredPrizeIndexes: []`.
- Loaded drafts derive multiple featured indexes from `featuredPrizeIds` or `featuredPrizes`, falling back to legacy `featuredPrizeId`.
- Admin row buttons toggle membership independently.
- Create/update persists every selected featured prize id and clears the stored featured list when none are selected.
- Gacha payload projection returns `featuredPrizes` and does not invent a featured prize when none is stored.
- Targeted tests and the project check gate pass.
