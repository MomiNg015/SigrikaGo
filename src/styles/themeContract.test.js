import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  VISUAL_THEME_OPTIONS,
  VISUAL_THEME_IDS,
  visualThemeCssImportPath,
  visualThemeScopeSelector
} from "../app/visualTheme.js";

function readThemeEntry(themeId) {
  return readFileSync(new URL(visualThemeCssImportPath(themeId), import.meta.url), "utf8");
}

function readThemeCssTree(themeId) {
  return readCssWithImports(new URL(visualThemeCssImportPath(themeId), import.meta.url));
}

describe("player theme CSS contract", () => {
  it("imports every registered player theme entry from themes.css", () => {
    const themeEntry = readFileSync(new URL("./themes.css", import.meta.url), "utf8");

    for (const themeId of VISUAL_THEME_IDS) {
      expect(themeEntry).toContain(`@import "${visualThemeCssImportPath(themeId)}";`);
    }
  });

  it("keeps future theme options out of the active CSS import contract", () => {
    const themeEntry = readFileSync(new URL("./themes.css", import.meta.url), "utf8");

    expect(VISUAL_THEME_OPTIONS.map((theme) => theme.id)).toEqual([
      "bright-school",
      "club-standard",
      "motari-luxury"
    ]);
    expect(VISUAL_THEME_OPTIONS.filter((theme) => theme.available).map((theme) => theme.id)).toEqual(VISUAL_THEME_IDS);

    for (const theme of VISUAL_THEME_OPTIONS.filter((themeOption) => !themeOption.available)) {
      expect(themeEntry).not.toContain(`@import "./themes/${theme.id}.css";`);
    }
  });

  it("keeps each registered theme scoped to the player app shell", () => {
    for (const themeId of VISUAL_THEME_IDS) {
      const themeCss = readThemeCssTree(themeId);
      expect(themeCss).toContain(visualThemeScopeSelector(themeId));
    }
  });

  it("keeps theme entries import-oriented for future extension", () => {
    const themeEntry = readFileSync(new URL("./themes.css", import.meta.url), "utf8");
    const brightSchoolEntry = readFileSync(new URL("./themes/bright-school.css", import.meta.url), "utf8");
    const qaGuardEntry = readFileSync(new URL("./themes/bright-school/qa-guard.css", import.meta.url), "utf8");

    expect(cssImports(themeEntry)).toEqual([
      "./themes/shared.css",
      "./themes/isolation.css",
      "./themes/theme-components.css",
      "./themes/bright-school.css",
      "./mobile-adaptive.css"
    ]);
    expect(cssImports(brightSchoolEntry)).toContain("./bright-school/qa-guard.css");
    expect(cssImports(qaGuardEntry)).toEqual([
      "./quality-base.css",
      "./commerce.css",
      "./home.css",
      "./room.css",
      "./modals.css",
      "./mobile.css",
      "./effects.css"
    ]);
    expect(themeEntry).not.toContain(".app-shell.player-theme-enabled .result-badge");
    expect(qaGuardEntry).not.toContain(".app-shell.player-theme-enabled.theme-bright-school");
  });

  it("keeps Bright School commerce as an import-only domain entry", () => {
    const commerceEntry = readFileSync(new URL("./themes/bright-school/commerce.css", import.meta.url), "utf8");
    const recruitmentPolish = readFileSync(new URL("./themes/bright-school/commerce/recruitment.css", import.meta.url), "utf8");

    expect(cssImports(commerceEntry)).toEqual([
      "./commerce/gacha.css",
      "./commerce/recruitment.css",
      "./commerce/shop.css",
      "./commerce/warehouse-profile.css"
    ]);
    expect(commerceEntry).not.toContain(".gacha-modal {");
    expect(commerceEntry).not.toContain(".shop-layout {");
    expect(commerceEntry).not.toContain(".warehouse-grid {");
    expect(recruitmentPolish).toContain("var(--recruitment-board-background-image)");
    expect(recruitmentPolish).toContain("var(--recruitment-paper-background-image)");
    expect(recruitmentPolish).toContain("background-position: center center !important;");
    expect(recruitmentPolish).toContain("background-size: cover !important;");
    expect(recruitmentPolish).toContain(".recruitment-use-button:disabled");
    expect(recruitmentPolish).toContain("cursor: not-allowed !important;");
    expect(recruitmentPolish).toContain(".recruitment-fast-forward-button");
    expect(recruitmentPolish).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school :is(");
    expect(recruitmentPolish).toContain(
      ".recruitment-pending-panel.recruitment-pending-panel.recruitment-pending-panel"
    );
    expect(recruitmentPolish).toContain(
      ".recruitment-countdown-row.recruitment-countdown-row.recruitment-countdown-row"
    );
    expect(recruitmentPolish).toContain("background-color: transparent !important;");
    expect(recruitmentPolish).toContain("background-image: none !important;");
    expect(recruitmentPolish).toContain("border-radius: 0 !important;");
    expect(recruitmentPolish).toContain(".recruitment-selection-card p");
    expect(recruitmentPolish).toContain("color: #b53434 !important;");
    expect(recruitmentPolish).toContain(".recruitment-result-actions .recruitment-use-button");
    expect(recruitmentPolish).toContain("background: #fffdf6 !important;");
    expect(recruitmentPolish).toContain(".recruitment-result-actions .recruitment-use-button:active:not(:disabled)");
  });

  it("keeps Bright School commerce shop as an import-only modal polish entry", () => {
    const shopEntry = readFileSync(new URL("./themes/bright-school/commerce/shop.css", import.meta.url), "utf8");

    expect(cssImports(shopEntry)).toEqual([
      "./shop/sidebar-wallet.css",
      "./shop/product-grid.css",
      "./shop/detail-dialog.css",
      "./shop/detail-credits.css",
      "./shop/responsive.css"
    ]);
    expect(shopEntry).not.toContain(".shop-layout {");
    expect(shopEntry).not.toContain(".shop-item {");
    expect(shopEntry).not.toContain(".shop-item-detail-modal");
    expect(shopEntry).not.toContain("@media (max-width: 860px)");
  });

  it("keeps Bright School commerce warehouse and profile as an import-only polish entry", () => {
    const warehouseProfileEntry = readFileSync(
      new URL("./themes/bright-school/commerce/warehouse-profile.css", import.meta.url),
      "utf8"
    );

    expect(cssImports(warehouseProfileEntry)).toEqual([
      "./warehouse-profile/typography-numbers.css",
      "./warehouse-profile/profile-stats.css",
      "./warehouse-profile/warehouse-header.css",
      "./warehouse-profile/warehouse-empty.css",
      "./warehouse-profile/warehouse-item-card.css",
      "./warehouse-profile/warehouse-item-mobile.css"
    ]);
    expect(warehouseProfileEntry).not.toContain(".profile-resume-stats");
    expect(warehouseProfileEntry).not.toContain(".warehouse-grid");
    expect(warehouseProfileEntry).not.toContain(".warehouse-item");
    expect(warehouseProfileEntry).not.toContain("@media (max-width");
  });

  it("keeps Bright School base as an import-only foundation entry", () => {
    const brightBaseEntry = readFileSync(new URL("./themes/bright-school/base.css", import.meta.url), "utf8");

    expect(cssImports(brightBaseEntry)).toEqual([
      "./base/paper-root.css",
      "./base/panels-modals.css",
      "./base/home-identity.css",
      "./base/home-gallery.css",
      "./base/pseudo-cleanup.css",
      "./base/room-chat-board.css",
      "./base/forms-content-cards.css",
      "./base/preload-scrollbars.css"
    ]);
    expect(brightBaseEntry).not.toContain(".app-shell.player-theme-enabled.theme-bright-school {");
    expect(brightBaseEntry).not.toContain(".home-image-entry {");
    expect(brightBaseEntry).not.toContain(".board-stage {");
  });

  it("keeps Bright School contrast purge as an import-only readability entry", () => {
    const contrastPurgeEntry = readFileSync(new URL("./themes/bright-school/contrast-purge.css", import.meta.url), "utf8");

    expect(cssImports(contrastPurgeEntry)).toEqual([
      "./contrast-purge/root-shell.css",
      "./contrast-purge/surfaces.css",
      "./contrast-purge/controls.css",
      "./contrast-purge/forms.css",
      "./contrast-purge/cards-badges.css",
      "./contrast-purge/notebook-details.css",
      "./contrast-purge/meters-friend-scroll.css",
      "./contrast-purge/home-utility-tabs.css"
    ]);
    expect(contrastPurgeEntry).not.toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school,");
    expect(contrastPurgeEntry).not.toContain(".timer-track");
    expect(contrastPurgeEntry).not.toContain(".home-grid-featured > .home-utility-grid .utility-entry");
  });

  it("keeps Bright School radical purge as an import-only emergency cleanup entry", () => {
    const radicalPurgeEntry = readFileSync(new URL("./themes/bright-school/radical-purge.css", import.meta.url), "utf8");

    expect(cssImports(radicalPurgeEntry)).toEqual([
      "./radical-purge/home-top-controls.css",
      "./radical-purge/home-utility-controls.css",
      "./radical-purge/profile-handbook-cleanup.css",
      "./radical-purge/character-detail-cleanup.css",
      "./radical-purge/commerce-social-cleanup.css",
      "./radical-purge/room-action-cleanup.css"
    ]);
    expect(radicalPurgeEntry).not.toContain(".home-top-strip .icon-button");
    expect(radicalPurgeEntry).not.toContain(".friends-row");
    expect(radicalPurgeEntry).not.toContain(".timer-track");
  });

  it("keeps Bright School specificity overrides as an import-only anti-bleed entry", () => {
    const specificityEntry = readFileSync(new URL("./themes/bright-school/specificity-overrides.css", import.meta.url), "utf8");

    expect(cssImports(specificityEntry)).toEqual([
      "./specificity-overrides/global-reset.css",
      "./specificity-overrides/panel-shells.css",
      "./specificity-overrides/forms-textareas.css",
      "./specificity-overrides/settings-panels.css",
      "./specificity-overrides/character-details.css",
      "./specificity-overrides/buttons.css",
      "./specificity-overrides/scrollbars.css",
      "./specificity-overrides/anti-tech-bleed-addendum.css"
    ]);
    expect(specificityEntry).not.toContain(".auth-panel");
    expect(specificityEntry).not.toContain("input:not([type=\"checkbox\"]");
    expect(specificityEntry).not.toContain("*::-webkit-scrollbar");
  });

  it("keeps Bright School home as an import-only lobby entry", () => {
    const brightHomeEntry = readFileSync(new URL("./themes/bright-school/home.css", import.meta.url), "utf8");

    expect(cssImports(brightHomeEntry)).toEqual([
      "./home/canvas-purge.css",
      "./home/main-panel-material.css",
      "./home/player-zone-clips.css",
      "./home/student-id-card.css",
      "./home/manual-entry-label.css",
      "./home/short-height.css",
      "./home/narrow-desktop.css",
      "./home/mobile-compact.css",
      "./home/utility-toolbox.css"
    ]);
    expect(brightHomeEntry).not.toContain(".home-player-plaque.tactical-id-card {");
    expect(brightHomeEntry).not.toContain(".home-main-panel.home-terminal-main");
    expect(brightHomeEntry).not.toContain("@media (min-width: 701px)");
  });

  it("keeps Bright School home utility toolbox as an import-only sub-entry", () => {
    const utilityToolboxEntry = readFileSync(
      new URL("./themes/bright-school/home/utility-toolbox.css", import.meta.url),
      "utf8"
    );

    expect(cssImports(utilityToolboxEntry)).toEqual([
      "./utility-toolbox/toolbox-grid.css",
      "./utility-toolbox/toolbox-interactions.css"
    ]);
    expect(utilityToolboxEntry).not.toContain(".home-match-mode-tickets {");
    expect(utilityToolboxEntry).not.toContain(".utility-entry {");
    expect(utilityToolboxEntry).not.toContain("@media");
  });

  it("keeps Bright School home student-id-card as an import-only sub-entry", () => {
    const studentIdEntry = readFileSync(new URL("./themes/bright-school/home/student-id-card.css", import.meta.url), "utf8");

    expect(cssImports(studentIdEntry)).toEqual([
      "./student-id-card/card-shell-avatar.css",
      "./student-id-card/identity-name.css",
      "./student-id-card/user-identity-tag.css",
      "./student-id-card/mode-stats.css"
    ]);
    expect(studentIdEntry).not.toContain(".home-player-plaque.tactical-id-card {");
    expect(studentIdEntry).not.toContain(".plaque-avatar");
    expect(studentIdEntry).not.toContain(".user-identity-name-tag");
    expect(studentIdEntry).not.toContain(".plaque-mode-stat");
  });

  it("keeps Bright School gallery polish as an import-only static gallery parity entry", () => {
    const galleryPolishEntry = readFileSync(new URL("./themes/bright-school/gallery-polish.css", import.meta.url), "utf8");

    expect(cssImports(galleryPolishEntry)).toEqual([
      "./gallery-polish/theme-tokens.css",
      "./gallery-polish/home-image-entry.css",
      "./gallery-polish/home-image-art.css",
      "./gallery-polish/paper-surfaces.css",
      "./gallery-polish/chat-paper-grid.css",
      "./gallery-polish/home-image-interaction.css",
      "./gallery-polish/theme-addendum.css"
    ]);
    expect(galleryPolishEntry).not.toContain("--theme-text");
    expect(galleryPolishEntry).not.toContain(".home-image-entry");
    expect(galleryPolishEntry).not.toContain(".chat-box");
  });

  it("keeps Bright School mobile as an import-only domain entry", () => {
    const mobileEntry = readFileSync(new URL("./themes/bright-school/mobile.css", import.meta.url), "utf8");

    expect(cssImports(mobileEntry)).toEqual([
      "./mobile/home-shell.css",
      "./mobile/modal-shell.css",
      "./mobile/commerce-warehouse.css",
      "./mobile/house-profile.css",
      "./mobile/lists-settings.css",
      "./mobile/room.css",
      "./mobile/motion.css",
      "./mobile/final-fixes.css"
    ]);
    expect(mobileEntry).not.toContain(".home-screen {");
    expect(mobileEntry).not.toContain(".mobile-room-screen {");
    expect(mobileEntry).not.toContain("@keyframes bright-mobile-sheet-in");
  });

  it("keeps Bright School mobile home shell as an import-only portrait home entry", () => {
    const mobileHomeShellEntry = readFileSync(
      new URL("./themes/bright-school/mobile/home-shell.css", import.meta.url),
      "utf8"
    );

    expect(cssImports(mobileHomeShellEntry)).toEqual([
      "./home-shell/shell-base.css",
      "./home-shell/top-strip-menu.css",
      "./home-shell/main-stage.css",
      "./home-shell/player-plaque.css",
      "./home-shell/entries-utility-footer.css"
    ]);
    expect(mobileHomeShellEntry).not.toContain(".home-screen {");
    expect(mobileHomeShellEntry).not.toContain(".home-mobile-menu");
    expect(mobileHomeShellEntry).not.toContain(".home-player-plaque");
    expect(mobileHomeShellEntry).not.toContain(".home-utility-grid");
  });

  it("keeps Bright School mobile commerce and warehouse as an import-only portrait entry", () => {
    const mobileCommerceEntry = readFileSync(
      new URL("./themes/bright-school/mobile/commerce-warehouse.css", import.meta.url),
      "utf8"
    );

    expect(cssImports(mobileCommerceEntry)).toEqual([
      "./commerce-warehouse/shop-layout.css",
      "./commerce-warehouse/warehouse-shell.css",
      "./commerce-warehouse/warehouse-items.css"
    ]);
    expect(mobileCommerceEntry).not.toContain(".shop-layout {");
    expect(mobileCommerceEntry).not.toContain(".shop-item {");
    expect(mobileCommerceEntry).not.toContain(".warehouse-grid");
    expect(mobileCommerceEntry).not.toContain(".warehouse-item");
  });

  it("keeps Bright School mobile house and profile as an import-only portrait entry", () => {
    const mobileHouseProfileEntry = readFileSync(
      new URL("./themes/bright-school/mobile/house-profile.css", import.meta.url),
      "utf8"
    );

    expect(cssImports(mobileHouseProfileEntry)).toEqual([
      "./house-profile/shell-profile-stats.css",
      "./house-profile/character-grid-cards.css",
      "./house-profile/owned-decorations.css",
      "./house-profile/character-detail-music.css"
    ]);
    expect(mobileHouseProfileEntry).not.toContain(".house-layout {");
    expect(mobileHouseProfileEntry).not.toContain(".character-list {");
    expect(mobileHouseProfileEntry).not.toContain(".owned-decoration-section");
    expect(mobileHouseProfileEntry).not.toContain(".character-detail-heading");
  });

  it("keeps Bright School mobile lists and settings as an import-only portrait entry", () => {
    const mobileListsSettingsEntry = readFileSync(
      new URL("./themes/bright-school/mobile/lists-settings.css", import.meta.url),
      "utf8"
    );

    expect(cssImports(mobileListsSettingsEntry)).toEqual([
      "./lists-settings/list-scroll-widths.css",
      "./lists-settings/watch-rows.css",
      "./lists-settings/friends-rows.css",
      "./lists-settings/table-shells.css",
      "./lists-settings/leaderboard-cards.css",
      "./lists-settings/replay-cards.css",
      "./lists-settings/toolbars-card-borders.css"
    ]);
    expect(mobileListsSettingsEntry).not.toContain(".leaderboard-table");
    expect(mobileListsSettingsEntry).not.toContain(".friends-row");
    expect(mobileListsSettingsEntry).not.toContain(".replay-table-row");
    expect(mobileListsSettingsEntry).not.toContain("@media (max-width");
  });

  it("keeps Bright School mobile room as an import-only portrait battle entry", () => {
    const mobileRoomEntry = readFileSync(new URL("./themes/bright-school/mobile/room.css", import.meta.url), "utf8");

    expect(cssImports(mobileRoomEntry)).toEqual([
      "./room/shell-header-menu.css",
      "./room/viewport-player-strips.css",
      "./room/board-stage.css",
      "./room/dock-actions.css",
      "./room/record-dialogs.css",
      "./room/touch-board-feedback.css",
      "./room/modal-sheets.css",
      "./room/flat-controls.css"
    ]);
    expect(mobileRoomEntry).not.toContain(".mobile-room-screen {");
    expect(mobileRoomEntry).not.toContain(".player-info {");
    expect(mobileRoomEntry).not.toContain(".mobile-room-dock {");
    expect(mobileRoomEntry).not.toContain(".character-record-dialog {");
  });

  it("keeps Bright School modals as an import-only modal cleanup entry", () => {
    const modalsEntry = readFileSync(new URL("./themes/bright-school/modals.css", import.meta.url), "utf8");

    expect(cssImports(modalsEntry)).toEqual([
      "./modals/handbook-decoration.css",
      "./modals/surface-cleanup.css",
      "./modals/settings-lobby-cleanup.css",
      "./modals/selected-actions.css",
      "./modals/leaderboard.css",
      "./modals/resume-personalization.css",
      "./modals/result-room-popovers.css",
      "./modals/stage-decoration-fixes.css"
    ]);
    expect(modalsEntry).not.toContain(".settings-modal");
    expect(modalsEntry).not.toContain(".resume-modal");
    expect(modalsEntry).not.toContain(".room-person-popover");
  });

  it("keeps Bright School effects as an import-only animation and board-effect entry", () => {
    const effectsEntry = readFileSync(new URL("./themes/bright-school/effects.css", import.meta.url), "utf8");

    expect(cssImports(effectsEntry)).toEqual([
      "./effects/selected-controls.css",
      "./effects/skill-action-active.css",
      "./effects/skill-action-disabled.css",
      "./effects/board-targeting.css",
      "./effects/board-marks.css",
      "./effects/home-image-entry-buttons.css",
      "./effects/keyframes.css",
      "./effects/reduced-motion.css"
    ]);
    expect(effectsEntry).not.toContain(".sortie-button.selected");
    expect(effectsEntry).not.toContain(".board-wrap.targeting");
    expect(effectsEntry).not.toContain("@keyframes bright-school-skill-action-glow");
  });

  it("keeps Bright School room as an import-only battle readability entry", () => {
    const roomEntry = readFileSync(new URL("./themes/bright-school/room.css", import.meta.url), "utf8");

    expect(cssImports(roomEntry)).toEqual([
      "./room/header-exit.css",
      "./room/player-status.css",
      "./room/skill-floating.css",
      "./room/player-name-controls.css",
      "./room/side-tags.css",
      "./room/board-coordinates.css",
      "./room/flat-controls.css"
    ]);
    expect(roomEntry).not.toContain(".desktop-room-screen .room-header");
    expect(roomEntry).not.toContain(".player-info.active-turn");
    expect(roomEntry).not.toContain(".board-wrap .coord-row");
  });

  it("keeps Bright School component repairs as an import-only domain entry", () => {
    const componentRepairsEntry = readFileSync(new URL("./themes/bright-school/component-repairs.css", import.meta.url), "utf8");

    expect(cssImports(componentRepairsEntry)).toEqual([
      "./component-repairs/foundation-home.css",
      "./component-repairs/shop.css",
      "./component-repairs/lists-profile.css",
      "./component-repairs/profile-actions.css",
      "./component-repairs/warehouse-character.css",
      "./component-repairs/character-music-player.css",
      "./component-repairs/room-board.css",
      "./component-repairs/chat.css",
      "./component-repairs/notebook-polish.css"
    ]);
    expect(componentRepairsEntry).not.toContain(".home-top-strip {");
    expect(componentRepairsEntry).not.toContain(".shop-sidebar {");
    expect(componentRepairsEntry).not.toContain(".board-stage {");
    expect(componentRepairsEntry).not.toContain(".chat-widget {");
  });

  it("keeps Bright School quality base as an import-only audit and refinement entry", () => {
    const qualityBaseEntry = readFileSync(new URL("./themes/bright-school/quality-base.css", import.meta.url), "utf8");

    expect(cssImports(qualityBaseEntry)).toEqual([
      "./quality-base/audit-foundation.css",
      "./quality-base/audit-home.css",
      "./quality-base/audit-commerce.css",
      "./quality-base/audit-profile-modals.css",
      "./quality-base/audit-room.css",
      "./quality-base/audit-compact.css",
      "./quality-base/refinement-foundation.css",
      "./quality-base/refinement-controls.css",
      "./quality-base/refinement-board.css",
      "./quality-base/sticker-motion.css"
    ]);
    expect(qualityBaseEntry).not.toContain(".home-top-strip {");
    expect(qualityBaseEntry).not.toContain(".shop-layout {");
    expect(qualityBaseEntry).not.toContain(".board-wrap {");
    expect(qualityBaseEntry).not.toContain(".home-image-entry:hover");
  });

  it("keeps Bright School firewall as an import-only anti-HUD bleed entry", () => {
    const firewallEntry = readFileSync(new URL("./themes/bright-school/firewall.css", import.meta.url), "utf8");

    expect(cssImports(firewallEntry)).toEqual([
      "./firewall/root-surfaces.css",
      "./firewall/explicit-surfaces.css",
      "./firewall/explicit-pseudo-elements.css",
      "./firewall/controls-forms.css",
      "./firewall/semantic-badges.css",
      "./firewall/generic-surfaces.css",
      "./firewall/announcement-controls.css",
      "./firewall/generic-pseudo-elements.css",
      "./firewall/typography.css"
    ]);
    expect(firewallEntry).not.toContain(".auth-panel,");
    expect(firewallEntry).not.toContain("[class*=\"panel\"]");
    expect(firewallEntry).not.toContain("button,");
    expect(firewallEntry).not.toContain("p,");
  });

  it("keeps volatile room and replay semantics in the final theme tree", () => {
    const themeCss = readCssWithImports(new URL("./themes.css", import.meta.url));

    expect(themeCss).toContain(".replay-table-row.outcome-win:hover");
    expect(themeCss).toContain(".replay-table-row.outcome-loss:focus-visible");
    expect(themeCss).toContain(".replay-table-row.outcome-draw");
    expect(themeCss).toContain("background: linear-gradient(135deg, #fff4bd, #fffbe7) !important");
    expect(themeCss).toContain(".result-badge.win");
    expect(themeCss).toContain("color: #d91528 !important");
    expect(themeCss).toContain(".result-badge.loss");
    expect(themeCss).toContain("color: #121217 !important");
    expect(themeCss).toContain(".result-badge.draw");
    expect(themeCss).toContain("color: #138a46 !important");
    expect(themeCss).toContain(".skill-chip.spent");
    expect(themeCss).toContain("linear-gradient(135deg, #ece7e3, #d8d7d6 52%, #f5f1ea) padding-box");
    expect(themeCss).toContain("bright-school-skill-action-glow");
    expect(themeCss).toContain("bright-school-board-targeting-glow");
    expect(themeCss).toContain(":is(.territory-mark, .dead-mark, .neutral-mark)");
  });

  it("keeps Bright School star points from occupying the move-preview pseudo element", () => {
    const roomBoardCss = readFileSync(new URL("./themes/bright-school/component-repairs/room-board.css", import.meta.url), "utf8");
    const boardTargetingCss = readFileSync(new URL("./themes/bright-school/effects/board-targeting.css", import.meta.url), "utf8");

    expect(roomBoardCss).toContain(".point.star:not(.black):not(.white):not(.erased)::after");
    expect(roomBoardCss).not.toContain(".point.star:not(.black):not(.white):not(.erased)::before");
    expect(boardTargetingCss).not.toContain(".point.star:not(.black):not(.white):not(.erased)::before");
  });

  it("keeps default board stones free of outline rings", () => {
    const sharedStoneCss = readCssWithImports(new URL("./room/board/stones-skill-effects.css", import.meta.url));
    const notebookPolishCss = readCssWithImports(
      new URL("./themes/bright-school/component-repairs/notebook-polish.css", import.meta.url),
    );
    const defaultStoneBlock = cssBlock(sharedStoneCss, ".stone");
    const brightBlackStoneBlock = cssBlock(
      notebookPolishCss,
      ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .black .stone:not(.decorated-stone)"
    );
    const brightWhiteStoneBlock = cssBlock(
      notebookPolishCss,
      ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .white .stone:not(.decorated-stone)"
    );

    expect(defaultStoneBlock).not.toContain("inset");
    expect(brightBlackStoneBlock).not.toContain("inset");
    expect(brightWhiteStoneBlock).not.toContain("inset");
    expect(brightBlackStoneBlock).toContain("border: 0 !important");
    expect(brightWhiteStoneBlock).toContain("border: 0 !important");
  });

  it("keeps Bright School mobile interaction polish in the final theme tree", () => {
    const themeCss = readCssWithImports(new URL("./themes.css", import.meta.url));

    expect(themeCss).toContain("@keyframes bright-mobile-sheet-in");
    expect(themeCss).toContain("bright-mobile-backdrop-in");
    expect(themeCss).toContain(".mobile-room-screen .point.previewable:active");
    expect(themeCss).toContain("touch-action: none !important");
    expect(themeCss).toContain("(prefers-reduced-motion: reduce)");
  });

  it("keeps Bright School mobile story long-text compression from reverting to the default modal grid", () => {
    const brightSchoolMobileCss = readCssWithImports(new URL("./themes/bright-school/mobile.css", import.meta.url));
    const defaultStoryGridIndex = brightSchoolMobileCss.indexOf(
      ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .onboarding-story-modal {"
    );
    const compressionStoryGridIndex = brightSchoolMobileCss.indexOf(
      ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .onboarding-story-modal.long-text-compress-portrait {"
    );

    expect(defaultStoryGridIndex).toBeGreaterThanOrEqual(0);
    expect(compressionStoryGridIndex).toBeGreaterThan(defaultStoryGridIndex);
    expect(brightSchoolMobileCss).toContain(
      "grid-template-rows: minmax(0, 4fr) minmax(50%, max-content) auto !important;"
    );
  });

  it("keeps the new-theme template aligned with the registry contract", () => {
    const template = readFileSync(new URL("./themes/_new-theme-template.css", import.meta.url), "utf8");

    expect(template).toContain("visualTheme.js");
    expect(template).toContain("themes.css");
    expect(template).toContain(".app-shell.player-theme-enabled.theme-example");
  });
});

function cssImports(source) {
  return [...source.matchAll(/@import\s+"([^"]+)";/g)].map((match) => match[1]);
}

function cssBlock(source, selector) {
  const start = source.indexOf(`${selector} {`);
  if (start < 0) return "";
  const bodyStart = source.indexOf("{", start);
  const bodyEnd = source.indexOf("}", bodyStart);
  return source.slice(start, bodyEnd + 1);
}

function readCssWithImports(url, seen = new Set()) {
  const key = url.href;
  if (seen.has(key)) return "";
  seen.add(key);

  const css = readFileSync(url, "utf8");
  return css.replace(/@import\s+"([^"]+)";/g, (_match, importPath) => {
    return readCssWithImports(new URL(importPath, url), seen);
  });
}
