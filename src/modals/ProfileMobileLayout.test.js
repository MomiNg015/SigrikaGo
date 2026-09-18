import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { readCssWithImports } from "../styles/cssTestUtils.js";

describe("profile mobile layout contracts", () => {
  it("keeps transparent structure around the themed cards and long-record footer in explicit desktop rows", () => {
    const dossierCss = readFileSync(
      new URL("../styles/modals/profile-hero-cleanup.css", import.meta.url),
      "utf8"
    ).replace(/\r\n/g, "\n");
    const overviewCss = readFileSync(
      new URL("../styles/modals/profile-overview.css", import.meta.url),
      "utf8"
    );
    const recordsCss = readFileSync(
      new URL("../styles/modals/profile-character-records.css", import.meta.url),
      "utf8"
    );
    const nestedCss = readFileSync(
      new URL("../styles/modals/nested-profile.css", import.meta.url),
      "utf8"
    );
    const themeOwnerCss = readFileSync(
      new URL("../styles/themes/bright-school/quality-base/profile-dossier/surfaces-portraits.css", import.meta.url),
      "utf8"
    );
    const cardSurfaceCss = readFileSync(
      new URL("../styles/themes/bright-school/quality-base/profile-dossier/card-surfaces.css", import.meta.url),
      "utf8"
    );

    expect(dossierCss).toContain('grid-template-areas:\n    "status"\n    "overview"\n    "characters"\n    "actions"');
    expect(dossierCss).toContain(".profile-resume-view {\n  position: relative;");
    expect(dossierCss).toContain("overflow: hidden;\n  background: transparent;");
    expect(dossierCss).toContain("font-size: 2.3625rem;");
    expect(dossierCss).toContain("--user-nameplate-scale: 1.4;");
    expect(overviewCss).toContain(".profile-resume-status {\n  grid-area: status;");
    expect(overviewCss).toContain(".profile-summary-item .stat-tip-wrap {\n  position: static;");
    expect(overviewCss).toContain("top: calc(100% + 8px);");
    expect(overviewCss).toContain("bottom: auto;");
    expect(overviewCss).toContain(".profile-summary-item:nth-child(even) .stat-tip");
    expect(overviewCss).toContain(":has(.stat-tip-wrap:is(:hover, :focus-within))");
    expect(overviewCss).toContain("grid-area: overview;");
    expect(recordsCss).toContain(".profile-character-section {");
    expect(recordsCss).toContain("grid-area: characters;");
    expect(recordsCss).toContain("grid-template-rows: auto minmax(0, 1fr);");
    expect(recordsCss).toContain("gap: 4px;");
    expect(recordsCss).toContain(".profile-character-table-head > :is(h4, span)");
    expect(recordsCss).toContain(".profile-character-table-head");
    expect(recordsCss).toContain("--profile-character-scrollbar-gutter: 0px;");
    expect(recordsCss).toContain("font-size: 1.5rem;");
    expect(recordsCss).toContain("letter-spacing: 0;");
    expect(recordsCss).toContain("scrollbar-width: none;");
    expect(recordsCss).toContain("-ms-overflow-style: none;");
    expect(recordsCss).toContain(".profile-character-table-scroll::-webkit-scrollbar");
    expect(recordsCss).toContain("display: none;");
    expect(nestedCss).toContain(".profile-secondary-actions {\n  grid-area: actions;");
    expect(themeOwnerCss).toContain(".profile-resume-hero .profile-portrait-mask");
    expect(cardSurfaceCss).toContain(".profile-record-panel,");
    expect(cardSurfaceCss).toContain("background: transparent !important;");
    expect(cardSurfaceCss).toContain("--profile-dossier-card-surface: var(--bright-sheet);");
    expect(cardSurfaceCss).toContain("background: var(--profile-dossier-card-surface) !important;");
    expect(cardSurfaceCss).toContain("box-shadow: var(--profile-dossier-shadow-large) !important;");
    expect(cardSurfaceCss).toContain("box-shadow: var(--profile-dossier-shadow-medium) !important;");
    expect(cardSurfaceCss).toContain(
      ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .profile-character-table-scroll"
    );
    expect(cardSurfaceCss).toContain("scrollbar-width: none !important;");
    expect(cardSurfaceCss).toContain("scrollbar-gutter: auto !important;");
    expect(cardSurfaceCss).toContain(".profile-character-table-scroll::-webkit-scrollbar");
    expect(cardSurfaceCss).toContain("display: none !important;");
    expect(cardSurfaceCss).toContain("width: 0 !important;");
    expect(cardSurfaceCss).toContain("height: 0 !important;");
  });

  it("keeps social character records in one natural-height body scroller on short phones", () => {
    const css = readFileSync(new URL("../styles/mobile-adaptive/mobile-profile-records/character-record-cards.css", import.meta.url), "utf8");
    const body = css.match(/\.user-profile-modal \.profile-resume-view-social\s*\{([^}]+)\}/)?.[1] ?? "";
    expect(body).toContain("display: block !important");
    expect(body).toContain("overflow-y: auto !important");
    const list = css.match(/\.profile-resume-view-social \.profile-character-table-scroll\s*\{([^}]+)\}/)?.[1] ?? "";
    expect(list).toContain("height: auto !important");
    expect(list).toContain("max-height: none !important");
    expect(list).toContain("overflow: visible !important");
  });

  it("keeps the shared dossier compact without horizontal scrolling", () => {
    const finalMobileCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));
    const finalProfileCss = readFileSync(
      new URL("../styles/mobile-adaptive/mobile-profile-records/profile-shell-hero.css", import.meta.url),
      "utf8"
    ).replace(/\r\n/g, "\n");
    const phoneModalCss = readFileSync(new URL("../styles/modals/phone.css", import.meta.url), "utf8");
    const portraitHeaderCss = readFileSync(
      new URL("../styles/mobile-adaptive/bright-school-portrait/resume-modal-layout/header-grid.css", import.meta.url),
      "utf8"
    );
    const characterRecordsCss = readFileSync(
      new URL("../styles/mobile-adaptive/mobile-profile-records/character-record-list.css", import.meta.url),
      "utf8"
    );
    const characterRecordCardsCss = readFileSync(
      new URL("../styles/mobile-adaptive/mobile-profile-records/character-record-cards.css", import.meta.url),
      "utf8"
    );

    expect(finalMobileCss).toContain(".profile-resume-view .profile-resume-hero");
    expect(finalMobileCss).toContain('grid-template-areas:\n      "portrait identity"\n      "actions actions" !important');
    expect(finalMobileCss).toContain("overflow-x: hidden !important");
    expect(finalProfileCss).toContain(":is(.resume-modal, .user-profile-modal)");
    expect(finalProfileCss).toContain("overflow: hidden !important");
    expect(finalProfileCss).toContain(".profile-record-panel");
    expect(finalProfileCss).toContain("grid-template-rows: auto auto minmax(0, 1fr) auto !important");
    expect(finalProfileCss).toContain("overflow: visible !important");
    expect(finalProfileCss).toContain(".profile-resume-view .profile-hero-portrait > .profile-portrait-mask");
    expect(finalProfileCss).toContain("width: 108px !important");
    expect(finalProfileCss).toContain("height: 96px !important");
    expect(finalProfileCss).toContain("width: 80% !important");
    expect(finalProfileCss).toContain("height: 80% !important");
    expect(finalProfileCss).toContain("object-fit: contain !important");
    expect(finalProfileCss).toContain("font-size: 1.75rem !important");
    expect(finalProfileCss).toContain("--user-nameplate-scale: 1.288 !important");
    expect(finalProfileCss).toContain("width: var(--user-nameplate-width) !important");
    expect(finalProfileCss).toContain("height: var(--user-nameplate-height) !important");
    expect(finalProfileCss).toContain("justify-content: center !important");
    expect(finalMobileCss).toContain(".profile-summary-grid");
    expect(finalMobileCss).toContain("grid-template-columns: repeat(2, minmax(0, 1fr)) !important");
    expect(finalMobileCss).toContain(".profile-dossier-modal .profile-summary-item .stat-tip");
    expect(finalMobileCss).toContain("position: absolute !important");
    expect(finalMobileCss).toContain(".profile-rank-results");
    expect(finalMobileCss).toContain("grid-template-columns: repeat(10, minmax(0, 1fr)) !important");
    expect(finalMobileCss).toContain(".profile-character-table tbody tr");
    expect(finalMobileCss).toContain("display: table-row !important");
    expect(finalMobileCss).toContain("height: 60px !important");
    expect(finalMobileCss).toContain("display: table-header-group !important");
    expect(finalMobileCss).toContain("white-space: nowrap !important");
    expect(characterRecordsCss).toContain(".profile-character-table-head");
    expect(characterRecordsCss).toContain("display: grid !important");
    expect(characterRecordsCss).toContain("gap: 4px !important");
    expect(characterRecordsCss).toContain("overflow-y: auto !important");
    expect(characterRecordsCss).toContain("scrollbar-gutter: auto !important");
    expect(characterRecordsCss).toContain(".profile-character-table-head > :is(h4, span)");
    expect(characterRecordsCss).toContain("padding-inline: 2px !important");
    expect(characterRecordsCss).toContain(".profile-character-table-head > h4");
    expect(characterRecordsCss).toContain("padding-left: 4px !important");
    expect(characterRecordsCss).toContain("padding-right: 5px !important");
    expect(characterRecordsCss).toContain(".profile-character-table-head > span");
    expect(characterRecordsCss).toContain("text-align: center !important");
    expect(characterRecordsCss).toContain(
      ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .profile-character-table-scroll"
    );
    expect(characterRecordsCss).toContain(".profile-character-table-scroll::-webkit-scrollbar");
    expect(characterRecordsCss).toContain("display: none !important");
    expect(characterRecordsCss).toContain("width: 0 !important");
    expect(characterRecordsCss).toContain("height: 0 !important");
    expect(characterRecordsCss).toContain("clip-path: inset(50%) !important");
    expect(characterRecordCardsCss).toContain(".theme-bright-school .profile-character-table-head");
    expect(characterRecordCardsCss).toContain("display: grid !important");
    expect(characterRecordCardsCss).toContain("position: absolute !important");
    expect(characterRecordCardsCss).toContain("border-spacing: 0 7px !important");
    expect(characterRecordCardsCss).toContain("7%, var(--profile-dossier-card-surface, var(--bright-sheet))");
    expect(characterRecordCardsCss).toContain("box-shadow: 0 2px 0 rgba(61, 43, 37, 0.42) !important");
    expect(finalMobileCss).toContain(".profile-character-table .profile-character-identity");
    expect(finalMobileCss).toContain(".profile-character-table tbody td::before {\n    content: none !important");
    expect(finalMobileCss).toContain(".profile-character-table .profile-chain-portrait.small > .profile-portrait-mask");
    expect(finalMobileCss).toContain("width: 46px !important");
    expect(finalMobileCss).toContain("grid-template-columns: minmax(58px, 1.25fr) repeat(3, minmax(44px, 1fr)) !important");
    expect(finalMobileCss).toContain(".profile-character-col-identity");
    expect(finalMobileCss).toContain("width: 48% !important");
    expect(finalMobileCss).toContain(".profile-character-col-rate");
    expect(finalMobileCss).toContain("width: 19% !important");
    expect(finalMobileCss).toContain("width: 80% !important");
    expect(finalMobileCss).toContain("height: 80% !important");
    expect(finalMobileCss).toContain("object-fit: contain !important");
    expect(finalMobileCss).toContain("padding: 10px 12px 12px !important");
    expect(phoneModalCss).not.toContain(".profile-resume-hero img");
    expect(phoneModalCss).not.toContain(".profile-resume-stats");
    expect(portraitHeaderCss).toContain(".resume-header-actions .resume-close-button");
    expect(portraitHeaderCss).not.toContain(".resume-title-actions");
  });
});
