export const CSS_DEBT_BASELINE = {
  date: "2026-07-14",
  scope: "All CSS files under src/styles after the import-only split work, including the shared and Bright School character-music-player subdomains, admin story node settings CSS and story workbook import feedback, frontend layout polish contracts including story-player padding, game-mode icon watermark/player-plaque/nameplate/utility image contracts, stable desktop utility-art tilt with direction-preserving hover rotation and scale compensation, tutorial reply-option overflow containment, mobile announcement badge anchoring, mobile utility-image feedback containment, the dedicated shared/theme/final-mobile Zahira shop window plus card-layout isolation, compact-height, badge, and crayon-background owner files, cloud-deployment mobile floating layer tokens, transform-surface compositor hints, semantic home/window title typography, and the shared skill-trait description popover, admin glossary, and mobile character-detail scrolling owner rules.",
  metrics: {
    totalFiles: 602,
    totalBytes: 1176175,
    importantCount: 7316,
    importantFiles: 287,
    hardcodedHexCount: 2291,
    mediaFiles: 225,
    reducedMotionFiles: 27,
    highZIndexFiles: 6
  },
  guidance:
    "Use this as a non-growth contract for staged CSS cleanup. The 2026-07-14 increase is limited to the focused shared skill-description popover, admin skill-trait glossary, exact Bright School text-link resets, and mobile character-detail scroll ownership; future cleanup should lower or explicitly justify these numbers while preserving existing visuals and avoiding visual drift."
};

export const CSS_Z_INDEX_CONTRACT = {
  highValueThreshold: 1000,
  layers: [
    { name: "base", range: [0, 9], use: "ordinary local stacking inside a component" },
    { name: "raised", range: [10, 49], use: "local cards, ribbons, and decorative overlays" },
    { name: "floating", range: [50, 199], use: "room popovers, tooltips, toasts, and anchored floating panels" },
    { name: "modal", range: [200, 999], use: "ordinary modal shells and app-level overlays" },
    { name: "system", range: [1000, 100300], use: "legacy tutorial, onboarding, admin workbench, and final mobile system overlays only" }
  ],
  legacyHighValues: [
    { file: "admin/story-workbench/overlays.css", value: 2600, owner: "admin story preview drawer" },
    { file: "admin/story-workbench/overlays.css", value: 3000, owner: "admin story preview modal" },
    { file: "admin/story-workbench/layout.css", value: 2700, owner: "admin story branch tools" },
    { file: "mobile-adaptive/phone-interactions.css", value: 99999, owner: "final mobile sheet/backdrop safety layer" },
    { file: "modals/onboarding-story/shell.css", value: 100100, owner: "onboarding story modal shell" },
    { file: "modals/tutorial-session.css", value: 100080, owner: "tutorial session backdrop" },
    { file: "modals/tutorial-session.css", value: 100200, owner: "tutorial session controls" },
    { file: "room/tutorial-battle-screen/loading-motion.css", value: 100200, owner: "tutorial battle route loading overlay" }
  ],
  guidance:
    "Prefer named local variables such as --room-floating-z before adding numeric z-index values. Any new value at or above 1000 must be registered here or moved onto an existing layer contract."
};

export const CSS_MOTION_CONTRACT = {
  tokenFiles: ["themes/shared/player-theme-tokens.css", "tailwind/tokens.css"],
  requiredTokenFragments: ["--theme-transition: 180ms ease", "--ease-sigrika-standard"],
  durationRangeMs: { micro: [100, 180], sheet: [180, 300] },
  reducedMotionFiles: [
    "admin/polish/forms-actions.css",
    "admin/story-workbench/layout.css",
    "base/asset-preload.css",
    "base/message-feedback.css",
    "commerce/recruitment/board/motion.css",
    "commerce/shop-settings/shop-shell-tabs.css",
    "mobile-adaptive/reduced-motion.css",
    "mobile-modals/reduced-motion.css",
    "mobile-room/reduced-motion.css",
    "themes/bright-school/effects/reduced-motion.css",
    "themes/bright-school/home/utility-toolbox/toolbox-interactions.css",
    "themes/bright-school/mobile/motion.css",
    "themes/bright-school/room/tutorial-choice-interactions.css",
    "themes/bright-school/surface-contracts/home-utility-tabs.css"
  ],
  guidance:
    "Motion cleanup should use tokenized duration/easing where practical, animate transform and opacity instead of layout properties, and keep prefers-reduced-motion coverage beside any motion-heavy family."
};

export const CSS_BREAKPOINT_CONTRACT = {
  allowedQueryFragments: [
    "(max-height: 520px) and (orientation: landscape)",
    "(max-height: 520px), (max-width: 760px)",
    "(max-width: 1100px)",
    "(max-width: 1180px)",
    "(max-width: 1260px)",
    "(max-width: 340px) and (orientation: portrait)",
    "(max-width: 360px) and (orientation: portrait)",
    "(max-width: 560px)",
    "(max-width: 620px)",
    "(max-width: 640px)",
    "(max-width: 700px)",
    "(max-width: 760px)",
    "(max-width: 760px) and (orientation: portrait)",
    "(max-width: 760px) and (orientation: portrait) and (prefers-reduced-motion: reduce)",
    "(max-width: 760px) and (orientation: portrait), (max-width: 420px)",
    "(max-width: 760px), (max-height: 520px)",
    "(max-width: 768px)",
    "(max-width: 768px) and (orientation: landscape)",
    "(max-width: 768px) and (orientation: portrait)",
    "(max-width: 768px) and (prefers-reduced-motion: reduce)",
    "(max-width: 800px)",
    "(max-width: 800px) and (orientation: landscape)",
    "(max-width: 860px)",
    "(max-width: 900px)",
    "(max-width: 900px) and (orientation: landscape)",
    "(max-width: 900px) and (orientation: landscape) and (max-height: 520px)",
    "(max-width: 900px) and (orientation: portrait)",
    "(max-width: 900px), (pointer: coarse)",
    "(max-width: 980px)",
    "(min-width: 1024px) and (max-height: 560px)",
    "(min-width: 1024px) and (max-width: 1180px)",
    "(min-width: 1024px) and (max-width: 1180px), (min-width: 701px) and (max-height: 640px)",
    "(min-width: 1181px) and (max-width: 1500px)",
    "(min-width: 1181px) and (min-height: 960px)",
    "(min-width: 701px)",
    "(min-width: 701px) and (max-height: 760px)",
    "(min-width: 701px) and (max-width: 1023px)",
    "(min-width: 701px) and (max-width: 1180px)",
    "(min-width: 701px) and (max-width: 1180px), (min-width: 701px) and (max-height: 959px)",
    "(min-width: 761px)",
    "(min-width: 769px)",
    "(min-width: 901px)",
    "(pointer: coarse)",
    "(prefers-reduced-motion: reduce)",
    "screen and (min-width: 769px)"
  ],
  viewportChecks: [
    "375px phone portrait",
    "small phone landscape",
    "narrow desktop",
    "regular desktop"
  ],
  guidance:
    "Add responsive rules through an existing desktop, mobile, portrait, landscape, narrow-desktop, pointer, or reduced-motion family. New breakpoint families need both desktop and mobile rationale plus contract-test registration."
};

export const CSS_LAYER_GROUPS = [
  {
    id: "reorganizable-shared-domains",
    label: "Round 3 reorganizable shared domains",
    risk: "low-to-medium",
    rootEntries: [
      "base.css",
      "lobby.css",
      "modals.css",
      "commerce-settings.css",
      "responsive.css",
      "mobile-home.css",
      "home-terminal.css",
      "mobile-modals.css",
      "hud-components.css",
      "tailwind.css"
    ],
    entries: [
      "base.css",
      "base/home-legacy-grid.css",
      "base/home-legacy-grid/layout.css",
      "base/home-legacy-grid/player-plaque.css",
      "base/home-legacy-grid/match-feature.css",
      "base/home-legacy-grid/entry-cards.css",
      "base/home-legacy-grid/utility-grid.css",
      "base/home-stage-artboard.css",
      "base/home-stage-artboard/screen.css",
      "base/home-stage-artboard/chrome.css",
      "base/home-stage-artboard/stage.css",
      "base/home-stage-artboard/player-zone.css",
      "base/home-stage-artboard/image-entries.css",
      "base/home-stage-artboard/responsive.css",
      "admin.css",
      "lobby.css",
      "modals.css",
      "modals/character-opening.css",
      "modals/character-opening/detail.css",
      "modals/character-opening/skill-copy.css",
      "modals/character-opening/replay-match.css",
      "modals/character-opening/opening-animation.css",
      "modals/character-opening/keyframes.css",
      "modals/character-music-player.css",
      "modals/character-music-player/shell-title.css",
      "modals/character-music-player/track-sheet.css",
      "modals/character-music-player/motion.css",
      "modals/mailbox.css",
      "modals/mailbox/layout.css",
      "modals/mailbox/list.css",
      "modals/mailbox/detail.css",
      "modals/mailbox/mobile.css",
      "commerce-settings.css",
      "commerce/warehouse-toast.css",
      "commerce/warehouse-toast/modal-list.css",
      "commerce/warehouse-toast/character-target.css",
      "commerce/warehouse-toast/toast-stack.css",
      "commerce/warehouse-toast/phone-layouts.css",
      "commerce/recruitment/board.css",
      "commerce/recruitment/board/surface.css",
      "commerce/recruitment/board/cards.css",
      "commerce/recruitment/board/motion.css",
      "responsive.css",
      "responsive/phone-portrait-room.css",
      "responsive/phone-portrait-room/shell-layout.css",
      "responsive/phone-portrait-room/player-panels.css",
      "responsive/phone-portrait-room/board-viewport.css",
      "responsive/phone-portrait-room/tabs-actions.css",
      "mobile-home.css",
      "home-terminal.css",
      "mobile-modals.css",
      "mobile-modals/phone-house-resume.css",
      "mobile-modals/phone-house-resume/shell-header.css",
      "mobile-modals/phone-house-resume/stats-records.css",
      "mobile-modals/phone-house-resume/character-list.css",
      "mobile-modals/phone-house-resume/decorations.css",
      "mobile-modals/phone-house-resume/achievement-personalization.css",
      "hud-components.css",
      "hud-components/pop-tech-terminal.css",
      "hud-components/pop-tech-terminal/tokens.css",
      "hud-components/pop-tech-terminal/modal-surfaces.css",
      "hud-components/pop-tech-terminal/interactive-motion.css",
      "hud-components/pop-tech-terminal/home-hologram.css",
      "hud-components/pop-tech-terminal/character-deploy.css",
      "hud-components/pop-tech-terminal/tabs-actions.css",
      "hud-components/pop-tech-terminal/keyframes.css",
      "hud-components/user-identity.css",
      "hud-components/user-identity/core.css",
      "hud-components/user-identity/context-surfaces.css",
      "hud-components/user-identity/phone-layouts.css",
      "tailwind.css",
      "tailwind/tokens.css"
    ],
    guidance: "Safe candidates for import-only splits, naming cleanup, and token documentation when feature tests own exact visual values."
  },
  {
    id: "high-risk-gameplay-room",
    label: "High-risk gameplay and room surfaces",
    risk: "high",
    rootEntries: ["room.css", "mobile-room.css", "room-terminal.css"],
    entries: [
      "room.css",
      "room/board.css",
      "room/players-timers-skills.css",
      "room/actions-requests.css",
      "room/actions-requests/toggles-action-bar.css",
      "room/actions-requests/decision-scoring.css",
      "room/actions-requests/request-toast.css",
      "room/actions-requests/action-states-tools.css",
      "room/actions-requests/replay-disabled.css",
      "mobile-room.css",
      "mobile-room/base-shell-dock.css",
      "mobile-room/portrait-room.css",
      "mobile-room/portrait-room/shell-viewport.css",
      "mobile-room/portrait-room/player-card-layout.css",
      "mobile-room/portrait-room/header-menu.css",
      "mobile-room/portrait-room/portrait-badges.css",
      "mobile-room/portrait-room/player-meta-timers.css",
      "mobile-room/portrait-room/skill-replay-popover.css",
      "mobile-room/portrait-room/board-dock-tabs.css",
      "mobile-room/portrait-room/decision-actions-hint.css",
      "room-terminal.css",
      "room-terminal/board-actions.css",
      "room-terminal/players-timers-skills.css",
      "room-terminal/players-timers-skills/player-panels.css",
      "room-terminal/players-timers-skills/identity-captures.css",
      "room-terminal/players-timers-skills/timers.css",
      "room-terminal/players-timers-skills/skill-chip-detail.css",
      "room-terminal/players-timers-skills/keyframes.css"
    ],
    guidance: "Treat room and board layout as behavior-facing CSS. Do not batch with generic button, panel, media, or mobile cleanup."
  },
  {
    id: "bright-school-theme-overrides",
    label: "Bright School theme-specific overlays",
    risk: "medium-to-high",
    rootEntries: ["themes.css"],
    entries: [
      "themes.css",
      "themes/shared.css",
      "themes/shared/player-theme-tokens.css",
      "themes/shared/theme-settings-panel.css",
      "themes/shared/player-theme-wiring.css",
      "themes/isolation.css",
      "themes/theme-components.css",
      "themes/theme-components/outcome-skill-states.css",
      "themes/theme-components/replay-outcome-win.css",
      "themes/theme-components/replay-outcome-loss.css",
      "themes/theme-components/replay-outcome-draw.css",
      "themes/bright-school.css",
      "themes/bright-school/base.css",
      "themes/bright-school/gallery-polish.css",
      "themes/bright-school/surface-contracts.css",
      "themes/bright-school/surface-contracts/root-shell.css",
      "themes/bright-school/surface-contracts/surfaces.css",
      "themes/bright-school/surface-contracts/controls.css",
      "themes/bright-school/surface-contracts/forms.css",
      "themes/bright-school/surface-contracts/cards-badges.css",
      "themes/bright-school/surface-contracts/notebook-details.css",
      "themes/bright-school/surface-contracts/meters-friend-scroll.css",
      "themes/bright-school/surface-contracts/home-utility-tabs.css",
      "themes/bright-school/surface-contracts/reset-known-hud-effects.css",
      "themes/bright-school/surface-contracts/panel-shells.css",
      "themes/bright-school/surface-contracts/forms-textareas.css",
      "themes/bright-school/surface-contracts/settings-panels.css",
      "themes/bright-school/surface-contracts/character-details.css",
      "themes/bright-school/surface-contracts/buttons.css",
      "themes/bright-school/surface-contracts/scrollbars.css",
      "themes/bright-school/surface-contracts/home-top-controls.css",
      "themes/bright-school/surface-contracts/home-utility-controls.css",
      "themes/bright-school/surface-contracts/profile-handbook-cleanup.css",
      "themes/bright-school/surface-contracts/character-detail-cleanup.css",
      "themes/bright-school/surface-contracts/commerce-social-cleanup.css",
      "themes/bright-school/surface-contracts/room-action-cleanup.css",
      "themes/bright-school/surface-contracts/final-root-surfaces.css",
      "themes/bright-school/surface-contracts/final-explicit-surfaces.css",
      "themes/bright-school/surface-contracts/final-explicit-pseudo-elements.css",
      "themes/bright-school/surface-contracts/final-controls-forms.css",
      "themes/bright-school/surface-contracts/final-semantic-badges.css",
      "themes/bright-school/surface-contracts/final-announcement-controls.css",
      "themes/bright-school/surface-contracts/final-typography.css",
      "themes/bright-school/component-repairs.css",
      "themes/bright-school/component-repairs/foundation-home.css",
      "themes/bright-school/component-repairs/foundation-home/scrollbar-auth.css",
      "themes/bright-school/component-repairs/foundation-home/home-brand-status.css",
      "themes/bright-school/component-repairs/foundation-home/home-image-entry.css",
      "themes/bright-school/component-repairs/character-music-player.css",
      "themes/bright-school/component-repairs/character-music-player/player-shell.css",
      "themes/bright-school/component-repairs/character-music-player/track-sheet.css",
      "themes/bright-school/component-repairs/warehouse-character.css",
      "themes/bright-school/component-repairs/warehouse-character/decoration-owned.css",
      "themes/bright-school/component-repairs/warehouse-character/character-detail.css",
      "themes/bright-school/component-repairs/warehouse-character/profile-character-badges.css",
      "themes/bright-school/component-repairs/warehouse-character/character-target-modal.css",
      "themes/bright-school/component-repairs/notebook-polish.css",
      "themes/bright-school/component-repairs/notebook-polish/tape-rings-stones.css",
      "themes/bright-school/component-repairs/notebook-polish/lobby-notebook-background.css",
      "themes/bright-school/component-repairs/notebook-polish/home-entry-badges.css",
      "themes/bright-school/qa-guard.css",
      "themes/bright-school/quality-base.css",
      "themes/bright-school/commerce.css",
      "themes/bright-school/home.css",
      "themes/bright-school/room.css",
      "themes/bright-school/modals.css",
      "themes/bright-school/mobile.css",
      "themes/bright-school/mobile/modal-shell.css",
      "themes/bright-school/mobile/modal-shell/shell-surfaces.css",
      "themes/bright-school/mobile/modal-shell/scroll-controls.css",
      "themes/bright-school/mobile/room.css",
      "themes/bright-school/mobile/room/shell-header-menu.css",
      "themes/bright-school/mobile/room/shell-header-menu/screen-shell.css",
      "themes/bright-school/mobile/room/shell-header-menu/header-title-tags.css",
      "themes/bright-school/mobile/room/shell-header-menu/menu-buttons.css",
      "themes/bright-school/mobile/room/shell-header-menu/menu-panel.css",
      "themes/bright-school/mobile/room/shell-header-menu/menu-panel-items.css",
      "themes/bright-school/mobile/room/viewport-player-strips.css",
      "themes/bright-school/mobile/room/viewport-player-strips/viewport-shell.css",
      "themes/bright-school/mobile/room/viewport-player-strips/player-card-grid.css",
      "themes/bright-school/mobile/room/viewport-player-strips/portrait-badge.css",
      "themes/bright-school/mobile/room/viewport-player-strips/player-meta-name.css",
      "themes/bright-school/mobile/room/viewport-player-strips/timer-captures-skill.css",
      "themes/bright-school/mobile/room/dock-actions.css",
      "themes/bright-school/mobile/room/dock-actions/dock-tabs-shell.css",
      "themes/bright-school/mobile/room/dock-actions/action-panel-hint.css",
      "themes/bright-school/mobile/room/dock-actions/action-grid.css",
      "themes/bright-school/mobile/room/dock-actions/decision-bar.css",
      "themes/bright-school/mobile/room/dock-actions/action-button-labels.css",
      "themes/bright-school/effects.css"
    ],
    guidance: "Bright School late repairs are intentional cascade boundaries. Use explicit surface contracts only; broad class-substring fallbacks and legacy cleanup layers are not public CSS contracts."
  },
  {
    id: "final-mobile-safety",
    label: "Final mobile and narrow-desktop safety layers",
    risk: "medium-to-high",
    rootEntries: [],
    entries: [
      "mobile-adaptive.css",
      "mobile-adaptive/phone-core.css",
      "mobile-adaptive/phone-core/match-mode.css",
      "mobile-adaptive/phone-core/global-shell-controls.css",
      "mobile-adaptive/phone-core/modal-tabs-shell.css",
      "mobile-adaptive/phone-core/scroll-detail-result.css",
      "mobile-adaptive/phone-gacha.css",
      "mobile-adaptive/phone-gacha/modal-tabs.css",
      "mobile-adaptive/phone-gacha/stage-machine.css",
      "mobile-adaptive/phone-gacha/controls-actions.css",
      "mobile-adaptive/phone-gacha/list-result-dialogs.css",
      "mobile-adaptive/home-utility-interactions.css",
      "mobile-adaptive/mobile-room-portrait.css",
      "mobile-adaptive/mobile-room-landscape.css",
      "mobile-adaptive/mobile-profile-records.css",
      "mobile-adaptive/mobile-profile-records/profile-shell-hero.css",
      "mobile-adaptive/mobile-profile-records/character-record-list.css",
      "mobile-adaptive/mobile-profile-records/footer-resume-stats.css",
      "mobile-adaptive/bright-school-overrides.css",
      "mobile-adaptive/bright-school-overrides/leaderboard-cards.css",
      "mobile-adaptive/bright-school-overrides/leaderboard-cards/modal-list-shell.css",
      "mobile-adaptive/bright-school-overrides/leaderboard-cards/player-identity.css",
      "mobile-adaptive/bright-school-overrides/leaderboard-cards/score-record.css",
      "mobile-adaptive/bright-school-overrides/leaderboard-cards/rank-current.css",
      "mobile-adaptive/home-narrow-desktop.css",
      "mobile-adaptive/bright-school-portrait.css",
      "mobile-adaptive/bright-school-portrait/resume-modal-layout.css",
      "mobile-adaptive/bright-school-portrait/resume-modal-layout/actions-stats-records.css",
      "mobile-adaptive/bright-school-portrait/resume-modal-layout/header-grid.css",
      "mobile-adaptive/bright-school-portrait/resume-modal-layout/achievement-personalization.css",
      "mobile-adaptive/bright-school-portrait/settings-tabs.css",
      "mobile-adaptive/bright-school-portrait/settings-tabs/shell-theme-grid.css",
      "mobile-adaptive/bright-school-portrait/settings-tabs/audio-volume-title.css",
      "mobile-adaptive/bright-school-portrait/settings-tabs/shared-active-tabs.css",
      "mobile-adaptive/information-center.css",
      "mobile-adaptive/semantic-accent-typography.css",
      "mobile-adaptive/reduced-motion.css"
    ],
    guidance: "This layer stays after themes.css imports. Move or split only with desktop and mobile verification."
  },
  {
    id: "skill-presentation-protected",
    label: "Character skill presentation protected surfaces",
    risk: "critical",
    rootEntries: [],
    entries: [
      "room/board/effects-canvas-motion.css",
      "room/board/row-slash.css",
      "room/board/row-slash-stone-effects.css",
      "room/board/stones-skill-effects.css",
      "room/board/stones-skill-effects/stone-base.css",
      "room/board/stones-skill-effects/hidden-flip-double.css",
      "room/board/stones-skill-effects/transient-markers.css",
      "room/board/stones-skill-effects/voyage-star-keyframes.css",
      "room/board/stones-skill-effects/protocol-ban.css",
      "room/board/stones-skill-effects/liberty-purge.css",
      "room/board/stones-skill-effects/stone-effect-keyframes.css",
      "room/board/spray-stone-effects.css",
      "room/board/liberty-purge-stone-effects.css",
      "room/board/ambient-fog.css",
      "themes/bright-school/effects.css",
      "themes/bright-school/effects/board-targeting.css",
      "themes/bright-school/effects/board-marks.css",
      "themes/bright-school/effects/keyframes.css",
      "themes/bright-school/effects/reduced-motion.css",
      "themes/bright-school/quality-base/refinement-board.css",
      "themes/bright-school/quality-base/refinement-board/board-surface-points.css",
      "themes/bright-school/quality-base/refinement-board/board-lines-layer.css",
      "themes/bright-school/quality-base/refinement-board/row-effects-shell.css",
      "themes/bright-school/quality-base/refinement-board/row-slash-art.css",
      "themes/bright-school/quality-base/refinement-board/board-lines-stroke.css",
      "themes/bright-school/quality-base/refinement-board/stone-position.css",
      "themes/bright-school/component-repairs/room-board.css",
      "themes/bright-school/mobile/room/touch-board-feedback.css"
    ],
    guidance: "Refactor only with board, skill banner, Pixi canvas, reduced-motion, and SFX timing checks."
  }
];

export const CSS_LAZY_ROUTE_STYLE_ENTRIES = [
  {
    entry: "admin.css",
    owner: "src/admin/AdminConsole.jsx",
    importPath: "../styles/admin.css",
    reason: "AdminConsole is route-lazy loaded and owns its 60KB admin style tree outside the initial app stylesheet."
  },
  {
    entry: "room/tutorial-battle-screen.css",
    owner: "src/tutorial/TutorialBattleScreen.jsx",
    importPath: "../styles/room/tutorial-battle-screen.css",
    reason: "TutorialBattleScreen is route-lazy loaded and owns its tutorial battle overlay/action/loading CSS outside shared room.css."
  }
];

export const CSS_ROUND3_SHARED_SPLITS = [
  {
    entry: "base/home-legacy-grid.css",
    files: [
      "base/home-legacy-grid/layout.css",
      "base/home-legacy-grid/player-plaque.css",
      "base/home-legacy-grid/match-feature.css",
      "base/home-legacy-grid/entry-cards.css",
      "base/home-legacy-grid/utility-grid.css"
    ]
  },
  {
    entry: "base/home-stage-artboard.css",
    files: [
      "base/home-stage-artboard/screen.css",
      "base/home-stage-artboard/chrome.css",
      "base/home-stage-artboard/stage.css",
      "base/home-stage-artboard/player-zone.css",
      "base/home-stage-artboard/image-entries.css",
      "base/home-stage-artboard/responsive.css"
    ]
  },
  {
    entry: "mobile-modals/phone-house-resume.css",
    files: [
      "mobile-modals/phone-house-resume/shell-header.css",
      "mobile-modals/phone-house-resume/stats-records.css",
      "mobile-modals/phone-house-resume/character-list.css",
      "mobile-modals/phone-house-resume/decorations.css",
      "mobile-modals/phone-house-resume/achievement-personalization.css"
    ]
  },
  {
    entry: "hud-components/pop-tech-terminal.css",
    files: [
      "hud-components/pop-tech-terminal/tokens.css",
      "hud-components/pop-tech-terminal/modal-surfaces.css",
      "hud-components/pop-tech-terminal/interactive-motion.css",
      "hud-components/pop-tech-terminal/home-hologram.css",
      "hud-components/pop-tech-terminal/character-deploy.css",
      "hud-components/pop-tech-terminal/tabs-actions.css",
      "hud-components/pop-tech-terminal/keyframes.css"
    ]
  },
  {
    entry: "hud-components/user-identity.css",
    files: [
      "hud-components/user-identity/core.css",
      "hud-components/user-identity/context-surfaces.css",
      "hud-components/user-identity/phone-layouts.css"
    ]
  },
  {
    entry: "modals/character-opening.css",
    files: [
      "modals/character-opening/detail.css",
      "modals/character-opening/skill-copy.css",
      "modals/character-opening/replay-match.css",
      "modals/character-opening/opening-animation.css",
      "modals/character-opening/keyframes.css"
    ]
  },
  {
    entry: "modals/character-music-player.css",
    files: [
      "modals/character-music-player/shell-title.css",
      "modals/character-music-player/track-sheet.css",
      "modals/character-music-player/motion.css"
    ]
  },
  {
    entry: "responsive/phone-portrait-room.css",
    files: [
      "responsive/phone-portrait-room/shell-layout.css",
      "responsive/phone-portrait-room/player-panels.css",
      "responsive/phone-portrait-room/board-viewport.css",
      "responsive/phone-portrait-room/tabs-actions.css"
    ]
  },
  {
    entry: "modals/mailbox.css",
    files: [
      "modals/mailbox/layout.css",
      "modals/mailbox/list.css",
      "modals/mailbox/detail.css",
      "modals/mailbox/mobile.css"
    ]
  },
  {
    entry: "commerce/recruitment/board.css",
    files: [
      "commerce/recruitment/board/surface.css",
      "commerce/recruitment/board/cards.css",
      "commerce/recruitment/board/motion.css"
    ]
  },
  {
    entry: "commerce/warehouse-toast.css",
    files: [
      "commerce/warehouse-toast/modal-list.css",
      "commerce/warehouse-toast/character-target.css",
      "commerce/warehouse-toast/toast-stack.css",
      "commerce/warehouse-toast/phone-layouts.css"
    ]
  }
];

export const CSS_FINAL_MOBILE_SAFETY_SPLITS = [
  {
    entry: "mobile-adaptive/phone-core.css",
    files: [
      "mobile-adaptive/phone-core/match-mode.css",
      "mobile-adaptive/phone-core/global-shell-controls.css",
      "mobile-adaptive/phone-core/modal-tabs-shell.css",
      "mobile-adaptive/phone-core/scroll-detail-result.css"
    ]
  },
  {
    entry: "mobile-adaptive/phone-gacha.css",
    files: [
      "mobile-adaptive/phone-gacha/modal-tabs.css",
      "mobile-adaptive/phone-gacha/stage-machine.css",
      "mobile-adaptive/phone-gacha/controls-actions.css",
      "mobile-adaptive/phone-gacha/list-result-dialogs.css"
    ]
  },
  {
    entry: "mobile-adaptive/bright-school-overrides/leaderboard-cards.css",
    files: [
      "mobile-adaptive/bright-school-overrides/leaderboard-cards/modal-list-shell.css",
      "mobile-adaptive/bright-school-overrides/leaderboard-cards/player-identity.css",
      "mobile-adaptive/bright-school-overrides/leaderboard-cards/score-record.css",
      "mobile-adaptive/bright-school-overrides/leaderboard-cards/rank-current.css"
    ]
  },
  {
    entry: "mobile-adaptive/bright-school-portrait/resume-modal-layout.css",
    files: [
      "mobile-adaptive/bright-school-portrait/resume-modal-layout/actions-stats-records.css",
      "mobile-adaptive/bright-school-portrait/resume-modal-layout/header-grid.css",
      "mobile-adaptive/bright-school-portrait/resume-modal-layout/achievement-personalization.css"
    ]
  },
  {
    entry: "mobile-adaptive/bright-school-portrait/settings-tabs.css",
    files: [
      "mobile-adaptive/bright-school-portrait/settings-tabs/shell-theme-grid.css",
      "mobile-adaptive/bright-school-portrait/settings-tabs/audio-volume-title.css",
      "mobile-adaptive/bright-school-portrait/settings-tabs/shared-active-tabs.css"
    ]
  },
  {
    entry: "mobile-adaptive/mobile-profile-records.css",
    files: [
      "mobile-adaptive/mobile-profile-records/profile-shell-hero.css",
      "mobile-adaptive/mobile-profile-records/character-record-list.css",
      "mobile-adaptive/mobile-profile-records/footer-resume-stats.css"
    ]
  }
];

export const CSS_THEME_OVERLAY_SPLITS = [
  {
    entry: "themes/shared.css",
    files: [
      "themes/shared/player-theme-tokens.css",
      "themes/shared/theme-settings-panel.css",
      "themes/shared/player-theme-wiring.css"
    ]
  },
  {
    entry: "themes/theme-components.css",
    files: [
      "themes/theme-components/outcome-skill-states.css",
      "themes/theme-components/replay-outcome-win.css",
      "themes/theme-components/replay-outcome-loss.css",
      "themes/theme-components/replay-outcome-draw.css"
    ]
  },
  {
    entry: "themes/bright-school/surface-contracts.css",
    files: [
      "themes/bright-school/surface-contracts/root-shell.css",
      "themes/bright-school/surface-contracts/surfaces.css",
      "themes/bright-school/surface-contracts/controls.css",
      "themes/bright-school/surface-contracts/forms.css",
      "themes/bright-school/surface-contracts/cards-badges.css",
      "themes/bright-school/surface-contracts/notebook-details.css",
      "themes/bright-school/surface-contracts/meters-friend-scroll.css",
      "themes/bright-school/surface-contracts/home-utility-tabs.css",
      "themes/bright-school/surface-contracts/reset-known-hud-effects.css",
      "themes/bright-school/surface-contracts/panel-shells.css",
      "themes/bright-school/surface-contracts/forms-textareas.css",
      "themes/bright-school/surface-contracts/settings-panels.css",
      "themes/bright-school/surface-contracts/character-details.css",
      "themes/bright-school/surface-contracts/buttons.css",
      "themes/bright-school/surface-contracts/scrollbars.css",
      "themes/bright-school/surface-contracts/home-top-controls.css",
      "themes/bright-school/surface-contracts/home-utility-controls.css",
      "themes/bright-school/surface-contracts/profile-handbook-cleanup.css",
      "themes/bright-school/surface-contracts/character-detail-cleanup.css",
      "themes/bright-school/surface-contracts/commerce-social-cleanup.css",
      "themes/bright-school/surface-contracts/room-action-cleanup.css",
      "themes/bright-school/surface-contracts/final-root-surfaces.css",
      "themes/bright-school/surface-contracts/final-explicit-surfaces.css",
      "themes/bright-school/surface-contracts/final-explicit-pseudo-elements.css",
      "themes/bright-school/surface-contracts/final-controls-forms.css",
      "themes/bright-school/surface-contracts/final-semantic-badges.css",
      "themes/bright-school/surface-contracts/final-announcement-controls.css",
      "themes/bright-school/surface-contracts/final-typography.css"
    ]
  },
  {
    entry: "themes/bright-school/component-repairs/foundation-home.css",
    files: [
      "themes/bright-school/component-repairs/foundation-home/scrollbar-auth.css",
      "themes/bright-school/component-repairs/foundation-home/home-brand-status.css",
      "themes/bright-school/component-repairs/foundation-home/home-image-entry.css"
    ]
  },
  {
    entry: "themes/bright-school/component-repairs/character-music-player.css",
    files: [
      "themes/bright-school/component-repairs/character-music-player/player-shell.css",
      "themes/bright-school/component-repairs/character-music-player/track-sheet.css"
    ]
  },
  {
    entry: "themes/bright-school/component-repairs/notebook-polish.css",
    files: [
      "themes/bright-school/component-repairs/notebook-polish/tape-rings-stones.css",
      "themes/bright-school/component-repairs/notebook-polish/lobby-notebook-background.css",
      "themes/bright-school/component-repairs/notebook-polish/home-entry-badges.css"
    ]
  },
  {
    entry: "themes/bright-school/component-repairs/warehouse-character.css",
    files: [
      "themes/bright-school/component-repairs/warehouse-character/decoration-owned.css",
      "themes/bright-school/component-repairs/warehouse-character/character-detail.css",
      "themes/bright-school/component-repairs/warehouse-character/profile-character-badges.css",
      "themes/bright-school/component-repairs/warehouse-character/character-target-modal.css"
    ]
  },
  {
    entry: "themes/bright-school/mobile/modal-shell.css",
    files: [
      "themes/bright-school/mobile/modal-shell/shell-surfaces.css",
      "themes/bright-school/mobile/modal-shell/scroll-controls.css"
    ]
  },
  {
    entry: "themes/bright-school/mobile/room/dock-actions.css",
    files: [
      "themes/bright-school/mobile/room/dock-actions/dock-tabs-shell.css",
      "themes/bright-school/mobile/room/dock-actions/action-panel-hint.css",
      "themes/bright-school/mobile/room/dock-actions/action-grid.css",
      "themes/bright-school/mobile/room/dock-actions/decision-bar.css",
      "themes/bright-school/mobile/room/dock-actions/action-button-labels.css"
    ]
  },
  {
    entry: "themes/bright-school/mobile/room/shell-header-menu.css",
    files: [
      "themes/bright-school/mobile/room/shell-header-menu/screen-shell.css",
      "themes/bright-school/mobile/room/shell-header-menu/header-title-tags.css",
      "themes/bright-school/mobile/room/shell-header-menu/menu-buttons.css",
      "themes/bright-school/mobile/room/shell-header-menu/menu-panel.css",
      "themes/bright-school/mobile/room/shell-header-menu/menu-panel-items.css"
    ]
  },
  {
    entry: "themes/bright-school/mobile/room/viewport-player-strips.css",
    files: [
      "themes/bright-school/mobile/room/viewport-player-strips/viewport-shell.css",
      "themes/bright-school/mobile/room/viewport-player-strips/player-card-grid.css",
      "themes/bright-school/mobile/room/viewport-player-strips/portrait-badge.css",
      "themes/bright-school/mobile/room/viewport-player-strips/player-meta-name.css",
      "themes/bright-school/mobile/room/viewport-player-strips/timer-captures-skill.css"
    ]
  }
];

export const CSS_GAMEPLAY_ROOM_SPLITS = [
  {
    entry: "room/actions-requests.css",
    files: [
      "room/actions-requests/toggles-action-bar.css",
      "room/actions-requests/decision-scoring.css",
      "room/actions-requests/request-toast.css",
      "room/actions-requests/action-states-tools.css",
      "room/actions-requests/replay-disabled.css"
    ]
  },
  {
    entry: "mobile-room/portrait-room.css",
    files: [
      "mobile-room/portrait-room/shell-viewport.css",
      "mobile-room/portrait-room/player-card-layout.css",
      "mobile-room/portrait-room/header-menu.css",
      "mobile-room/portrait-room/portrait-badges.css",
      "mobile-room/portrait-room/player-meta-timers.css",
      "mobile-room/portrait-room/skill-replay-popover.css",
      "mobile-room/portrait-room/board-dock-tabs.css",
      "mobile-room/portrait-room/decision-actions-hint.css"
    ]
  },
  {
    entry: "room-terminal/players-timers-skills.css",
    files: [
      "room-terminal/players-timers-skills/player-panels.css",
      "room-terminal/players-timers-skills/identity-captures.css",
      "room-terminal/players-timers-skills/timers.css",
      "room-terminal/players-timers-skills/skill-chip-detail.css",
      "room-terminal/players-timers-skills/keyframes.css"
    ]
  }
];

export const CSS_SKILL_PRESENTATION_SPLITS = [
  {
    entry: "room/board/stones-skill-effects.css",
    files: [
      "room/board/stones-skill-effects/stone-base.css",
      "room/board/stones-skill-effects/hidden-flip-double.css",
      "room/board/stones-skill-effects/transient-markers.css",
      "room/board/stones-skill-effects/voyage-star-keyframes.css",
      "room/board/stones-skill-effects/protocol-ban.css",
      "room/board/stones-skill-effects/liberty-purge.css",
      "room/board/stones-skill-effects/stone-effect-keyframes.css"
    ]
  },
  {
    entry: "themes/bright-school/quality-base/refinement-board.css",
    files: [
      "themes/bright-school/quality-base/refinement-board/board-surface-points.css",
      "themes/bright-school/quality-base/refinement-board/board-lines-layer.css",
      "themes/bright-school/quality-base/refinement-board/row-effects-shell.css",
      "themes/bright-school/quality-base/refinement-board/row-slash-art.css",
      "themes/bright-school/quality-base/refinement-board/board-lines-stroke.css",
      "themes/bright-school/quality-base/refinement-board/stone-position.css"
    ]
  }
];

export const CSS_PROTECTED_SURFACES = [
  {
    id: "board-point-buttons",
    category: "gameplay-protected",
    files: [
      "room/board/points-preview.css",
      "themes/bright-school/quality-base/refinement-board.css",
      "themes/bright-school/quality-base/refinement-board/board-surface-points.css",
      "themes/bright-school/component-repairs/room-board.css"
    ],
    requiredFragments: [
      ".board .point",
      "appearance: none",
      "background: transparent",
      "background-image: none",
      "border: 0",
      "box-shadow: none",
      "min-width: 0",
      "min-height: 0",
      "touch-action: none"
    ]
  },
  {
    id: "board-grid-svg",
    category: "gameplay-protected",
    files: [
      "room/board/grid-scoring.css",
      "themes/bright-school/quality-base/refinement-board.css",
      "themes/bright-school/quality-base/refinement-board/board-lines-layer.css",
      "themes/bright-school/quality-base/refinement-board/board-lines-stroke.css",
      "themes/bright-school/component-repairs/room-board.css"
    ],
    requiredFragments: [
      ".board-lines",
      "display: block",
      "width: 100%",
      "height: 100%",
      "max-width: none",
      "max-height: none",
      "pointer-events: none",
      "vector-effect: non-scaling-stroke"
    ]
  },
  {
    id: "pixi-effects-canvas",
    category: "skill-presentation",
    files: ["room/board/effects-canvas-motion.css"],
    requiredFragments: [
      ".board-effects-canvas",
      "width: 100%",
      "height: 100%",
      "display: block",
      "pointer-events: none",
      "prefers-reduced-motion: reduce"
    ]
  },
  {
    id: "row-slash-dom-owner",
    category: "skill-presentation",
    files: [
      "room/board/row-slash.css",
      "room/board/row-slash-stone-effects.css",
      "themes/bright-school/quality-base/refinement-board.css",
      "themes/bright-school/quality-base/refinement-board/row-effects-shell.css",
      "themes/bright-school/quality-base/refinement-board/row-slash-art.css"
    ],
    requiredFragments: [
      ".board-row-effects",
      ".board-row-slash",
      "--row-slash-cast-delay",
      "--row-slash-cast-duration",
      "row-slash-strike",
      "pointer-events: none"
    ]
  },
  {
    id: "persistent-skill-point-marks",
    category: "skill-presentation",
    files: [
      "room/board/stones-skill-effects.css",
      "room/board/stones-skill-effects/hidden-flip-double.css",
      "room/board/stones-skill-effects/protocol-ban.css",
      "room/board/stones-skill-effects/stone-effect-keyframes.css",
      "themes/bright-school/effects/board-marks.css"
    ],
    requiredFragments: [
      ".protocol-ban-mark",
      ".double-move-stone .stone",
      "pointer-events: none",
      "protocol-ban-bluewhite-glow",
      "double-move-stone-glow"
    ]
  },
  {
    id: "mobile-room-touch-board",
    category: "mobile-safety",
    files: [
      "mobile-adaptive/mobile-room-portrait/board-viewport.css",
      "mobile-adaptive/reduced-motion.css",
      "mobile-room/reduced-motion.css",
      "themes/bright-school/mobile/room/touch-board-feedback.css"
    ],
    requiredFragments: [
      ".mobile-room-screen",
      ".point.previewable:active",
      ".point.touch-confirming",
      "touch-action: none",
      "prefers-reduced-motion: reduce"
    ]
  }
];

export const CSS_REFACTOR_ROUNDS = [
  {
    round: 2,
    focus: "Inventory and contract guardrails",
    allowedWork: ["classify CSS layers", "add static contract tests", "document protected surfaces"]
  },
  {
    round: 3,
    focus: "Low-risk structure cleanup",
    allowedWork: ["split import-only shared domains", "remove duplicate theme metadata", "prepare future theme entries"]
  },
  {
    round: 4,
    focus: "Visual and skill regression",
    allowedWork: ["desktop screenshots", "mobile screenshots", "board skill presentation verification"]
  }
];

export const CSS_TAILWIND_MIGRATION_PHASES = [
  {
    phase: 1,
    focus: "Baseline, contracts, and token scaffold",
    risk: "low",
    allowedWork: [
      "record phased roadmap",
      "add semantic Tailwind token scaffold",
      "guard tw prefix, no-preflight, and import order with tests",
      "sync architecture docs"
    ],
    verification: [
      "npm test -- src/styles/cssLayerInventory.test.js src/styles/styleContract.test.js src/styles/themeContract.test.js src/styles/hudComponents.test.js",
      "npm run docs:system-design"
    ]
  },
  {
    phase: 2,
    focus: "Low-risk pilot surfaces",
    risk: "low",
    allowedWork: [
      "new admin or tooling surfaces",
      "route-lazy or isolated empty states",
      "delete matching old CSS for each migrated slice"
    ],
    verification: ["focused component tests", "npm run build"]
  },
  {
    phase: 3,
    focus: "UI primitive layer",
    risk: "low-to-medium",
    allowedWork: [
      "Button, IconButton, ModalShell, Tabs, form controls, Badge, ListRow, EmptyState, Toast",
      "semantic variants instead of long ad hoc class strings",
      "native disabled and form semantics"
    ],
    verification: ["primitive unit tests", "desktop and mobile contract checks"]
  },
  {
    phase: 4,
    focus: "Shared modal, list, card, and form migration",
    risk: "medium",
    allowedWork: [
      "settings, friends, leaderboard, announcement, mailbox, achievement, warehouse, shop, recruitment internals",
      "desktop and mobile migration together",
      "remove replaced modals, commerce, mobile-modals, and focused theme repair CSS"
    ],
    verification: ["focused modal tests", "static CSS contracts", "npm run check for larger handoffs"]
  },
  {
    phase: 5,
    focus: "Home, lobby, and commerce main flow",
    risk: "medium-to-high",
    allowedWork: [
      "non-gameplay player-facing layouts",
      "layout and state affordances before decorative art migration",
      "preserve Bright School scrapbook/campus identity"
    ],
    verification: ["desktop and mobile visual checks", "static CSS contracts", "npm run build"]
  },
  {
    phase: 6,
    focus: "Bright School theme tokenization",
    risk: "medium-to-high",
    allowedWork: [
      "paper, ink, accent, border, shadow, selected, and disabled semantic variables",
      "shrink surface-contracts to explicit owner selectors",
      "future themes remain imported through themes.css until visually verified"
    ],
    verification: ["theme contract tests", "desktop and mobile theme visual checks"]
  },
  {
    phase: 7,
    focus: "Mobile safety layer reduction",
    risk: "medium-to-high",
    allowedWork: [
      "mobile modal shells, tabs, lists, form controls, and non-gameplay action rows",
      "move stable mobile behavior into component or primitive ownership",
      "keep mobile-adaptive as final guard until replacement coverage exists"
    ],
    verification: [
      "375px phone portrait check",
      "small phone landscape check",
      "narrow desktop check",
      "npm run verify:battle-fixes for broad mobile changes"
    ]
  }
];

export const CSS_TAILWIND_MIGRATION_EXCLUSIONS = [
  "room board geometry",
  "board point buttons",
  "Pixi canvas hosts",
  "skill presentation keyframes and DOM marks",
  "Bright School final mobile safety",
  "mobile gameplay controls",
  "Tailwind preflight",
  "removing the tw prefix"
];

export const CSS_UTILITY_LAYER_DECISION = {
  id: "tailwind-prefixed-utility-layer",
  entry: "tailwind.css",
  vitePlugin: "@tailwindcss/vite",
  imports: [
    { source: "tailwindcss/theme.css", layer: "theme", prefix: "tw" },
    { source: "tailwindcss/utilities.css", layer: "utilities", prefix: "tw", scanSource: "../" }
  ],
  localImports: [
    {
      source: "./tailwind/tokens.css",
      entry: "tailwind/tokens.css",
      reason: "Phase 1 semantic token scaffold used by future tw: utilities without migrating existing UI."
    }
  ],
  phase2Pilots: [
    {
      surface: "AdminAudit table shell",
      file: "src/admin/AdminAudit.jsx",
      utilities: ["tw:max-w-full", "tw:overflow-x-auto"],
      replacedCss: "src/styles/admin/audit-feedback.css .audit-table-wrap",
      reason: "Admin-only audit table wrapper has no player theme, board, skill, Pixi, or mobile gameplay dependency."
    }
  ],
  phase3Primitives: [
    {
      primitive: "ScrollArea",
      file: "src/ui/primitives/ScrollArea.jsx",
      utilities: ["tw:max-w-full", "tw:overflow-x-auto"],
      firstConsumer: "src/admin/AdminAudit.jsx",
      reason:
        "Phase 3 starts by centralizing the Phase 2 admin overflow shell utility classes in a shared primitive instead of keeping raw tw: strings in feature components."
    },
    {
      primitive: "AdminTableScroll",
      file: "src/admin/adminComponents.jsx",
      utilities: ["tw:max-w-full", "tw:overflow-x-auto"],
      firstConsumer: "src/admin/AdminAudit.jsx",
      reason:
        "The admin table wrapper consumes ScrollArea so admin feature components keep the existing admin-table-wrap visual shell while primitive-owned Tailwind utilities own horizontal overflow."
    },
    {
      primitive: "Badge",
      file: "src/ui/primitives/Badge.jsx",
      utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center"],
      firstConsumer: "src/admin/adminComponents.jsx",
      reason:
        "The badge primitive centralizes visually equivalent low-risk inline layout utilities while existing admin CSS continues to own status colors, borders, padding, and typography."
    },
    {
      primitive: "EmptyState",
      file: "src/ui/primitives/EmptyState.jsx",
      utilities: ["tw:text-center", "tw:px-3", "tw:py-6"],
      firstConsumer: "src/admin/adminComponents.jsx",
      reason:
        "The empty-state primitive centralizes admin table empty-cell alignment and spacing utilities while existing admin CSS continues to own muted text color and the admin-table-empty visual contract."
    },
    {
      primitive: "Button",
      file: "src/ui/primitives/Button.jsx",
      utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center", "tw:gap-2"],
      firstConsumer: "src/admin/adminComponents.jsx",
      reason:
        "The button primitive centralizes only visually equivalent action alignment utilities while domain CSS continues to own colors, borders, disabled states, shadows, padding, and typography."
    },
    {
      primitive: "AdminActionButton",
      file: "src/admin/adminComponents.jsx",
      utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center", "tw:gap-2"],
      firstConsumer: "src/admin/AdminSiteSettings.jsx",
      reason:
        "The admin action wrapper maps semantic admin variants back to primary-action, secondary-action, and danger-action visual classes so feature files stop owning repeated raw action class strings."
    }
  ],
  phase4Pilots: [
    {
      surface: "ConfirmModal action buttons",
      file: "src/modals/FeedbackModals.jsx",
      wrapper: "src/modals/modalComponents.jsx ModalActionButton",
      utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center", "tw:gap-2"],
      preservedVisualClasses: ["danger-action", "secondary-action"],
      reason:
        "The first Phase 4 modal slice moves repeated confirm action alignment through a modal wrapper while existing CSS still owns modal colors, spacing, disabled states, shadows, and typography."
    },
    {
      surface: "MessageBoardModal submit action",
      file: "src/modals/MessageBoardModal.jsx",
      wrapper: "src/modals/modalComponents.jsx ModalActionButton",
      utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center", "tw:gap-2"],
      preservedVisualClasses: ["primary-action"],
      reason:
        "The second Phase 4 modal slice proves the modal action wrapper is reusable on a simple form submit action while existing message-board CSS still owns the primary action placement and visual treatment."
    },
    {
      surface: "AnnouncementModal simple secondary actions",
      file: "src/modals/AnnouncementModal.jsx",
      wrapper: "src/modals/modalComponents.jsx ModalActionButton",
      utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center", "tw:gap-2"],
      preservedVisualClasses: ["secondary-action"],
      reason:
        "The third Phase 4 modal slice routes announcement retry and load-more actions through the modal wrapper while existing announcement modal CSS still owns tabs, list rows, spacing, disabled state, and themed visual treatment."
    },
    {
      surface: "PersonalizationModal save action",
      file: "src/modals/PersonalizationModal.jsx",
      wrapper: "src/modals/modalComponents.jsx ModalActionButton",
      utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center", "tw:gap-2"],
      preservedVisualClasses: ["primary-action"],
      reason:
        "The fourth Phase 4 modal slice routes the personalization save action through the modal wrapper while existing personalization CSS still owns preview, picker option grids, equipment states, disabled state, and themed visual treatment."
    },
    {
      surface: "MailboxModal attachment claim action",
      file: "src/modals/MailboxModal.jsx",
      wrapper: "src/modals/modalComponents.jsx ModalActionButton",
      utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center", "tw:gap-2"],
      preservedVisualClasses: ["primary-action"],
      reason:
        "The fifth Phase 4 modal slice routes the mailbox attachment claim action through the modal wrapper while existing mailbox CSS still owns list/detail layout, attachment states, disabled state, paper background, and mobile treatment."
    },
    {
      surface: "FriendsOverlays duel-mode cancel action",
      file: "src/modals/friends/FriendsOverlays.jsx",
      wrapper: "src/modals/modalComponents.jsx ModalActionButton",
      utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center", "tw:gap-2"],
      preservedVisualClasses: ["secondary-action"],
      reason:
        "The sixth Phase 4 modal slice routes only the friends duel-mode cancel action through the modal wrapper while existing friends/profile CSS still owns match-mode options, profile overlays, confirm panels, spacing, and mobile treatment."
    },
    {
      surface: "UserProfileCard report submit action",
      file: "src/modals/UserProfileCard.jsx",
      wrapper: "src/modals/modalComponents.jsx ModalActionButton",
      utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center", "tw:gap-2"],
      preservedVisualClasses: ["danger-action"],
      reason:
        "The seventh Phase 4 modal slice routes only the profile report submit action through the modal wrapper while existing profile CSS still owns the report dialog form, confirm panels, social actions, spacing, and mobile treatment."
    }
  ],
  phase5Pilots: [
    {
      surface: "Home match-mode cancel action",
      file: "src/home/HomeScreen.jsx",
      wrapper: "src/home/homeComponents.jsx HomeActionButton",
      utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center", "tw:gap-2"],
      preservedVisualClasses: ["secondary-action"],
      reason:
        "The first Phase 5 home-flow slice routes only the match-mode picker cancel action through a home wrapper while existing home/modal/mobile CSS still owns match-mode layout, option buttons, spacing, artboard behavior, and visual treatment."
    }
  ],
  phase6Pilots: [
    {
      surface: "Bright School token scaffold",
      files: [
        "src/styles/tailwind/tokens.css",
        "src/styles/themes/bright-school/surface-contracts/final-root-surfaces.css",
        "src/styles/themes/bright-school/quality-base/refinement-foundation.css"
      ],
      contract: "Tailwind tokens map to Bright School paper, ink, accent, border, and shadow variables",
      reason:
        "Phase 6 starts as a no-visual-change token contract: Tailwind exposes the existing Bright School paper, clean surface, border, accent, and shadow scale without moving owner CSS rules."
    }
  ],
  phase7Pilots: [
    {
      surface: "mobile-adaptive final guard inventory",
      files: ["src/styles/mobile-adaptive.css", "src/styles/cssLayerInventory.js"],
      contract: "Only register mobile safety reduction candidates; do not move final guard rules yet",
      reason:
        "Phase 7 starts by keeping mobile-adaptive as the final post-theme guard while documenting that future reductions require matching desktop/mobile component ownership and visual checks."
    }
  ],
  omittedImports: ["tailwindcss/preflight.css"],
  semanticTokens: [
    "--font-sigrika-ui",
    "--font-sigrika-display",
    "--font-sigrika-numeric",
    "--color-sigrika-paper",
    "--color-sigrika-surface",
    "--color-sigrika-surface-clean",
    "--color-sigrika-ink",
    "--color-sigrika-muted",
    "--color-sigrika-border",
    "--color-sigrika-accent",
    "--color-sigrika-accent-soft",
    "--color-sigrika-info",
    "--color-sigrika-success",
    "--spacing-sigrika-page",
    "--spacing-sigrika-gap",
    "--spacing-sigrika-control-x",
    "--spacing-sigrika-control-y",
    "--radius-sigrika-control",
    "--radius-sigrika-card",
    "--shadow-sigrika-paper",
    "--shadow-sigrika-paper-soft",
    "--shadow-sigrika-paper-lift",
    "--ease-sigrika-standard"
  ],
  rootOrder: { after: "hud-components.css", before: "themes.css" },
  guidance: [
    "Use only tw: prefixed utility classes for new low-risk surfaces.",
    "Keep Tailwind as a staged long-term target: phase 1 establishes semantic tokens and contracts, phase 2 pilots new or admin surfaces, phase 3 creates primitives, phases 4-7 migrate shared UI, player non-gameplay flows, theme tokens, and mobile safety in order.",
    "Phase 3 tw: utility strings should live in small primitives or local wrappers such as ScrollArea, AdminTableScroll, Badge, EmptyState, Button, and AdminActionButton before broad modal/list/card/form migration.",
    "Phase 4 modal migration starts with narrow domain wrappers such as ModalActionButton; keep .primary-action, .secondary-action, and .danger-action visual ownership in CSS until a full modal surface is safely migrated.",
    "Phase 5 home migration starts with narrow domain wrappers such as HomeActionButton; keep home layout, match-mode option buttons, decorative art, and responsive safety CSS-owned until a full surface has focused desktop/mobile checks.",
    "Phase 6 starts with Bright School tokens mapped into the Tailwind semantic scaffold; do not move theme owner rules until token consumers have focused theme contract and visual checks.",
    "Phase 7 starts with a mobile-adaptive final guard inventory only; do not shrink final mobile safety rules until replacement component ownership is proven on phone portrait, landscape, narrow desktop, and regular desktop.",
    "Because Tailwind files are imported individually to omit preflight, keep source(\"../\") on the utilities import so src/ JSX pilots generate real tw: utilities.",
    "Do not migrate existing Bright School, board, skill, room, Pixi, or final mobile CSS without a focused visual migration.",
    "Keep future player themes CSS-entry based through themes.css until imported, scoped, and visually verified."
  ]
};

export const CSS_FORBIDDEN_BROAD_FALLBACKS = {
  id: "bright-school-no-broad-fallbacks",
  files: [
    "hud-components/pop-tech-terminal/character-deploy.css",
    "hud-components/hud-hardening/inputs-settings-auth.css",
    "hud-components/hud-hardening/inventory-state-tags.css",
    "themes/bright-school.css",
    "themes/bright-school/surface-contracts.css"
  ],
  forbiddenFragments: [
    '[class*="panel"]',
    '[class*="card"]',
    '[class*="item"]',
    '[class*="row"]',
    '[class*="dock"]',
    '[class*="setting"]',
    '[class*="about"]',
    '[class*="volume-row"]',
    '[class*="enter-btn"]',
    '[class*="submit-btn"]',
    '[class*="lock"]',
    '[class*="decor"]',
    '[class*="owned"]',
    "contrast-purge",
    "radical-purge",
    "specificity-overrides",
    "anti-tech-bleed",
    "generic-surfaces",
    "generic-pseudo-elements",
    ".app-shell.player-theme-enabled.theme-bright-school * {\n  text-shadow: none !important;\n  box-shadow: none;"
  ],
  guidance:
    "Bright School and HUD cleanup must use explicit owner selectors. Do not add global theme substring fallbacks or all-element shadow resets."
};

export const CSS_ROUND4_REGRESSION_CHECKS = [
  {
    id: "static-css-contracts",
    command: "npm test -- src/styles/cssLayerInventory.test.js src/styles/styleContract.test.js src/styles/themeContract.test.js",
    coverage: [
      "root import order",
      "import-only split boundaries",
      "protected board and skill CSS fragments",
      "Bright School theme contract"
    ]
  },
  {
    id: "battle-skill-focused-units",
    command: "npm run verify:battle-fixes",
    coverage: [
      "board rendering contracts",
      "mobile room layout contracts",
      "skill targeting and presentation",
      "Pixi effect host lifecycle",
      "skill SFX scheduling"
    ]
  },
  {
    id: "desktop-mobile-skill-visual-stability",
    command: "npm run verify:stability -- tests/stability/skill-effects.spec.js",
    coverage: [
      "desktop Chromium real Pixi canvas",
      "mobile Chromium real Pixi canvas",
      "page error boundary absence",
      "room recovery before skill playback"
    ]
  }
];

export const CSS_FULL_REPO_CLEANUP_VERIFICATION_GATES = [
  {
    id: "css-contracts",
    command: "npm test -- src/styles/cssLayerInventory.test.js src/styles/styleContract.test.js src/styles/themeContract.test.js",
    requiredFor: ["every CSS cleanup stage"],
    coverage: ["root import order", "import-only entries", "oversized CSS guard", "protected surface fragments"]
  },
  {
    id: "battle-fixes",
    command: "npm run verify:battle-fixes",
    requiredFor: ["room", "board", "skill", "mobile", "broad CSS changes"],
    coverage: ["Board", "BoardSkillEffects", "skill SFX scheduling", "mobile point confirmation"]
  },
  {
    id: "desktop-mobile-skill-stability",
    command: "npm run verify:stability -- tests/stability/skill-effects.spec.js",
    requiredFor: ["skill presentation", "Pixi canvas", "protected board effects"],
    coverage: ["desktop Chromium", "mobile Chromium", "real Pixi canvas", "app error boundary absence"]
  },
  {
    id: "final-repo-check",
    command: "npm run check",
    requiredFor: ["final handoff"],
    coverage: ["full unit suite", "production build", "production config", "system design HTML"]
  }
];

export function inventoryFilesForGroup(groupId) {
  return CSS_LAYER_GROUPS.find((group) => group.id === groupId)?.entries ?? [];
}
