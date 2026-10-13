# Mobile watch layout variants

Prototype-only review of the current mobile watch ledger. Deliver three working variants preserving the title artwork, shell and palette. Improve information grouping and readable names rather than simply shrinking row height. Show mode, room code, black/white players, moves, room occupants, status and a clear action. No left tabs. Names wrap in full; units and small labels remain at least 12px. Compare at 320/360/390/430px, short phones, long names and high counts. Keep actual account/room APIs isolated. Do not promote a variant before user selection.

## Results
Three isolated variants delivered. All 48 browser cases, comparison controls and scoped ESLint passed. Names are 14px and wrap fully, labels >=12px, action targets >=44px. At 390px ordinary first-row heights are 109/107/96px. Original and new screenshots inspected. Production unchanged, awaiting user choice. No production contract/spec change is introduced.
