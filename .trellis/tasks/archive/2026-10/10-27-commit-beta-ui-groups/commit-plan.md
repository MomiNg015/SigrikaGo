# Approved commit split

Only categories 1, 2 and 3 were authorized. Related source, tests and contracts follow each feature; samples, PV and older task artifacts remain outside the commits.

## 1. Dormant Sigrika UI

- .trellis/spec/frontend/handbook-puzzle-contract.md
- .trellis/spec/frontend/quality-guidelines.md
- .trellis/spec/frontend/warehouse-paper-contract.md
- docs/system-design.md
- docs/system-design/03-backend-realtime-api.md
- docs/system-design/06-ui-theme-mobile.md
- scripts/check-built-css-contracts.mjs
- scripts/checkBuiltCssContracts.test.js
- src/app/App.jsx
- src/app/App.test.js
- src/app/AppOverlays.jsx
- src/app/SigrikaCorruptionTransition.dom.test.jsx
- src/app/SigrikaCorruptionTransition.jsx
- src/app/useSigrikaCorruptionTransition.dom.test.jsx
- src/app/useSigrikaCorruptionTransition.js
- src/audio/backgroundMusic.dom.test.jsx
- src/audio/backgroundMusic.jsx
- src/home/components/HomeImageEntries.jsx
- src/modals/HouseModal.jsx
- src/modals/HouseModal.test.js
- src/modals/WarehouseModal.jsx
- src/modals/house/HouseCharacterGrid.dom.test.jsx
- src/modals/house/HouseCharacterGrid.jsx
- src/modals/house/HouseHandbook.dom.test.jsx
- src/modals/warehouse/useWarehouseInventory.dom.test.jsx
- src/modals/warehouse/useWarehouseInventory.js
- src/room/PlayerInfo.jsx
- src/room/PlayerInfo.test.js
- src/room/RoomScreen.jsx
- src/room/header/RoomHeader.dom.test.jsx
- src/room/header/RoomHeader.jsx
- src/room/layout/RoomLayouts.jsx
- src/shared/CharacterChainBadge.test.jsx
- src/styles/cssLayerInventory.js
- src/styles/mobile-adaptive/battle-paper-nameplate-mobile.css
- src/styles/mobile-adaptive/battle-paper-panels-mobile.css
- src/styles/mobile-adaptive/battle-paper-panels.css
- src/styles/mobile-adaptive/battle-paper-player-mobile.css
- src/styles/mobile-adaptive/battle-paper-portrait.css
- src/styles/mobile-adaptive/battle-paper-skill-mobile.css
- src/styles/mobile-adaptive/handbook-strip-frame.css
- src/styles/mobile-adaptive/readable-type-battle.css
- src/styles/mobile-adaptive/sigrika-corruption.css
- src/styles/mobile-adaptive/sigrika-corruption/handbook-cards.css
- src/styles/mobile-adaptive/sigrika-corruption/handbook-contamination.css
- src/styles/mobile-adaptive/sigrika-corruption/handbook-mobile.css
- src/styles/mobile-adaptive/sigrika-corruption/home-contamination.css
- src/styles/mobile-adaptive/sigrika-corruption/home-duel-entry.css
- src/styles/mobile-adaptive/sigrika-corruption/negative-entry.css
- src/styles/mobile-adaptive/sigrika-corruption/room-controls.css
- src/styles/mobile-adaptive/sigrika-corruption/room-panels.css
- src/styles/mobile-adaptive/sigrika-corruption/room-replay.css
- src/styles/mobile-adaptive/sigrika-corruption/room-secondary-surfaces.css
- src/styles/mobile-adaptive/sigrika-corruption/room-system-log.css
- src/styles/mobile-adaptive/sigrika-corruption/room-timers.css
- src/styles/mobile-adaptive/sigrika-corruption/transition.css
- src/styles/styleContract.test.js
- tests/e2e/interface-polish.spec.js
- docs/system-design.html (generated from the staged Markdown for this commit)

## 2. Beta achievement availability

- .trellis/spec/backend/profile-folder-contract.md
- docs/system-design.md
- server/achievements.js
- server/achievements.test.js
- src/app/AppOverlays.dom.test.jsx
- src/app/AppOverlays.jsx
- src/app/profileFeatures.dom.test.jsx
- src/app/useHomeUserRefresh.js
- src/app/useToastQueue.js
- src/modals/ResumeModal.dom.test.jsx
- src/modals/ResumeModal.jsx
- src/shared/profileFeatures.js
- docs/system-design.html (generated from the staged Markdown for this commit)

## 3. Profile layout and record states

- .trellis/spec/backend/profile-folder-contract.md
- .trellis/spec/frontend/css-architecture.md
- .trellis/spec/frontend/quality-guidelines.md
- docs/system-design.md
- docs/system-design/06-ui-theme-mobile.md
- src/modals/ProfilePlayRecords.dom.test.jsx
- src/modals/ProfilePlayRecords.jsx
- src/styles/cssLayerInventory.js
- src/styles/mobile-adaptive/profile-folder-mobile.css
- src/styles/mobile-adaptive/profile-folder-summary.css
- src/styles/mobile-adaptive/profile-paper-cards.css
- src/styles/mobile-adaptive/profile-paper-mobile.css
- tests/e2e/profile-paper.spec.js
- docs/system-design.html (generated from the staged Markdown for this commit)

## Shared-file rules

- AppOverlays separates the corruption callback from customization guards.
- Profile-folder contract separates availability from geometry and record-state design.
- Quality guidelines separate corrupted room rules from ordinary profile result alignment.
- System-design entry excludes design-sample/PV paragraphs and unrelated whitespace edits.
- CSS inventory keeps its existing non-growth allowances and measures each intermediate file set; group 1 needs a 20-byte higher bridge before group 3 restores the current final ceiling. No extra CSS implementation is introduced.
- Generated HTML is staged from the staged Markdown set, while the complete working HTML is preserved.
