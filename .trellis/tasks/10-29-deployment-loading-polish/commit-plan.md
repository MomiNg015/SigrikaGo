# Proposed scoped commit

`fix: gate playable resources and focus tutorial actions`

- .trellis/spec/frontend/quality-guidelines.md
- docs/system-design.html
- docs/system-design.md
- docs/system-design/01-project-overview.md
- src/app/App.test.js
- src/app/BattleAssetPreloadScreen.dom.test.jsx
- src/app/BattleAssetPreloadScreen.jsx
- src/app/homeReadyPreload.js
- src/app/homeReadyPreload.test.js
- src/app/playableReadyPreload.js
- src/app/startupNetwork.dom.test.jsx
- src/app/useStartupPreload.js
- src/audio/audioRuntime.js
- src/audio/audioRuntime.test.js
- src/audio/effectPlayback.js
- src/audio/playback.jsx
- src/modals/SettingsModal.test.jsx
- src/shared/assetRegistry.js
- src/shared/preloadAssets.js
- src/shared/preloadReadiness.test.js
- src/styles/base/asset-preload.css
- src/styles/commerce/shop-settings/settings-panel.css
- src/styles/cssLayerInventory.js
- src/styles/mobile-adaptive/bright-school-portrait/settings-tabs/shell-theme-grid.css
- src/styles/room/tutorial-battle-screen.css
- src/styles/room/tutorial-battle-screen/input-focus.css
- src/styles/styleContract.test.js
- src/styles/themes/shared/theme-settings-panel.css
- src/tutorial/TutorialBattleScreen.jsx
- src/tutorial/TutorialBattleScreen.test.jsx
- src/tutorial/TutorialInputFocus.jsx
- src/tutorial/TutorialInputFocus.test.js
- tests/e2e/deployment-loading.config.js
- tests/e2e/deployment-loading.spec.js
- tests/e2e/fixtures/interface-polish.jsx

## Existing work to preserve

Only the new deployment-readiness section in docs/system-design.md and its corresponding generated HTML changes belong to this task; other existing design-sample notes must remain unstaged. Exclude existing eslint.config.js and design-sample edits, style status noise, prior task logs, generated design images and promo files. Task metadata/research and verification records can be committed separately during finish-work; screenshots/logs are evidence, not runtime files.
