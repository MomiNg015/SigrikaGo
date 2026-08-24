import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { readCssWithImports } from "../styles/cssTestUtils.js";

describe("profile mobile layout contracts", () => {
  it("keeps the transparent dossier and long-record footer in explicit desktop rows", () => {
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

    expect(dossierCss).toContain('grid-template-areas:\n    "status"\n    "overview"\n    "characters"\n    "actions"');
    expect(dossierCss).toContain(".profile-resume-view {\n  position: relative;");
    expect(dossierCss).toContain("overflow: hidden;\n  background: transparent;");
    expect(overviewCss).toContain(".profile-resume-status {\n  grid-area: status;");
    expect(overviewCss).toContain("grid-area: overview;");
    expect(recordsCss).toContain(".profile-character-section {\n  grid-area: characters;");
    expect(nestedCss).toContain(".profile-secondary-actions {\n  grid-area: actions;");
    expect(themeOwnerCss).toContain(".profile-record-panel,");
    expect(themeOwnerCss).toContain("background: transparent !important;");
  });

  it("keeps the shared dossier single-column without horizontal scrolling", () => {
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

    expect(finalMobileCss).toContain(".profile-resume-view .profile-resume-hero");
    expect(finalMobileCss).toContain('grid-template-areas:\n      "portrait identity"\n      "actions actions" !important');
    expect(finalMobileCss).toContain("overflow-x: hidden !important");
    expect(finalProfileCss).toContain(":is(.resume-modal, .user-profile-modal)");
    expect(finalProfileCss).toContain("overflow: hidden !important");
    expect(finalProfileCss).toContain(".profile-record-panel");
    expect(finalProfileCss).toContain("overflow-y: auto !important");
    expect(finalProfileCss).toContain(".profile-resume-view .profile-hero-portrait > .profile-portrait-mask");
    expect(finalProfileCss).toContain("width: 118px !important");
    expect(finalProfileCss).toContain("height: 106px !important");
    expect(finalProfileCss).toContain("scroll-padding-bottom: 18px !important");
    expect(finalMobileCss).toContain(".profile-summary-grid");
    expect(finalMobileCss).toContain("grid-template-columns: repeat(2, minmax(0, 1fr)) !important");
    expect(finalMobileCss).toContain(".profile-rank-results");
    expect(finalMobileCss).toContain("grid-template-columns: repeat(10, minmax(0, 1fr)) !important");
    expect(finalMobileCss).toContain(".profile-character-table tbody tr");
    expect(finalMobileCss).toContain("display: table-row !important");
    expect(finalMobileCss).toContain("height: 60px !important");
    expect(finalMobileCss).toContain("display: table-header-group !important");
    expect(finalMobileCss).toContain("white-space: nowrap !important");
    expect(finalMobileCss).toContain(".profile-character-table .profile-character-identity");
    expect(finalMobileCss).toContain(".profile-character-table tbody td::before {\n    content: none !important");
    expect(finalMobileCss).toContain(".profile-character-table .profile-chain-portrait.small > .profile-portrait-mask");
    expect(finalMobileCss).toContain("width: 40px !important");
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
