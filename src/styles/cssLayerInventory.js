export const CSS_LAYER_GROUPS = [
  {
    id: "reorganizable-shared-domains",
    label: "Round 3 reorganizable shared domains",
    risk: "low-to-medium",
    rootEntries: [
      "base.css",
      "admin.css",
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
      "modals/mailbox.css",
      "modals/mailbox/layout.css",
      "modals/mailbox/list.css",
      "modals/mailbox/detail.css",
      "modals/mailbox/mobile.css",
      "commerce-settings.css",
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
      "tailwind.css"
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
      "themes/bright-school/contrast-purge.css",
      "themes/bright-school/gallery-polish.css",
      "themes/bright-school/specificity-overrides.css",
      "themes/bright-school/radical-purge.css",
      "themes/bright-school/firewall.css",
      "themes/bright-school/component-repairs.css",
      "themes/bright-school/component-repairs/foundation-home.css",
      "themes/bright-school/component-repairs/foundation-home/scrollbar-auth.css",
      "themes/bright-school/component-repairs/foundation-home/home-brand-status.css",
      "themes/bright-school/component-repairs/foundation-home/home-image-entry.css",
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
    guidance: "Bright School late repairs are intentional cascade boundaries. Keep high-specificity repairs unless a visual test proves they are obsolete."
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
      "mobile-adaptive/announcement-detail.css",
      "mobile-adaptive/announcement-detail/window.css",
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
    entry: "mobile-adaptive/announcement-detail.css",
    files: ["mobile-adaptive/announcement-detail/window.css"]
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
    entry: "themes/bright-school/component-repairs/foundation-home.css",
    files: [
      "themes/bright-school/component-repairs/foundation-home/scrollbar-auth.css",
      "themes/bright-school/component-repairs/foundation-home/home-brand-status.css",
      "themes/bright-school/component-repairs/foundation-home/home-image-entry.css"
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

export const CSS_UTILITY_LAYER_DECISION = {
  id: "tailwind-prefixed-utility-layer",
  entry: "tailwind.css",
  vitePlugin: "@tailwindcss/vite",
  imports: [
    { source: "tailwindcss/theme.css", layer: "theme", prefix: "tw" },
    { source: "tailwindcss/utilities.css", layer: "utilities", prefix: "tw" }
  ],
  omittedImports: ["tailwindcss/preflight.css"],
  rootOrder: { after: "hud-components.css", before: "themes.css" },
  guidance: [
    "Use only tw: prefixed utility classes for new low-risk surfaces.",
    "Do not migrate existing Bright School, board, skill, room, or final mobile CSS without a focused visual migration.",
    "Keep future player themes CSS-entry based through themes.css until imported, scoped, and visually verified."
  ]
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
