import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { readCssWithImports } from "./cssTestUtils.js";

const rootStylesPath = fileURLToPath(new URL("../styles.css", import.meta.url));
const stylesDir = dirname(fileURLToPath(new URL("./base.css", import.meta.url)));

const ROOT_STYLE_IMPORTS = [
  "./styles/base.css",
  "./styles/lobby.css",
  "./styles/room.css",
  "./styles/modals.css",
  "./styles/commerce-settings.css",
  "./styles/responsive.css",
  "./styles/mobile-home.css",
  "./styles/home-terminal.css",
  "./styles/mobile-room.css",
  "./styles/room-terminal.css",
  "./styles/mobile-modals.css",
  "./styles/hud-components.css",
  "./styles/tailwind.css",
  "./styles/themes.css"
];

const DOMAIN_STYLE_FILES = new Set(ROOT_STYLE_IMPORTS.map((importPath) => basename(importPath)));
const LAZY_ROUTE_STYLE_FILES = new Set(["admin.css"]);
const SECONDARY_ENTRY_STYLE_FILES = new Set(["mobile-adaptive.css"]);
const DOMAIN_STYLE_DIRECTORIES = new Set([
  "admin",
  "base",
  "commerce",
  "home-terminal",
  "hud-components",
  "lobby",
  "mobile-adaptive",
  "mobile-home",
  "mobile-modals",
  "mobile-room",
  "modals",
  "responsive",
  "room",
  "room-terminal",
  "themes"
]);
const TEST_STYLE_FILES = new Set([
  "cssLayerInventory.test.js",
  "hudComponents.test.js",
  "styleContract.test.js",
  "themeContract.test.js"
]);
const DOCUMENTATION_FILES = new Set(["README.md"]);
const CSS_SIZE_GUARD_BYTES = 6000;
const KNOWN_OVERSIZED_CSS_FILES = new Map([]);

function cssImports(source) {
  return [...source.matchAll(/@import\s+"([^"]+)"[^;]*;/g)].map((match) => match[1]);
}

function concreteCssAfterImports(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/@import\s+"[^"]+"[^;]*;\s*/g, "")
    .trim();
}

function normalizedCssSize(source) {
  return Buffer.byteLength(source.replace(/\r\n/g, "\n"), "utf8");
}

function cssFilesUnder(dir) {
  return readdirSync(dir)
    .flatMap((entry) => {
      const fullPath = join(dir, entry);
      if (statSync(fullPath).isDirectory()) return cssFilesUnder(fullPath);
      return entry.endsWith(".css") ? [fullPath] : [];
    });
}

describe("root CSS entry contract", () => {
  it("keeps styles.css import order stable", () => {
    const source = readFileSync(rootStylesPath, "utf8");

    expect(cssImports(source)).toEqual(ROOT_STYLE_IMPORTS);
  });

  it("keeps themes.css as the final root style layer", () => {
    expect(ROOT_STYLE_IMPORTS.at(-1)).toBe("./styles/themes.css");
  });

  it("keeps Tailwind as a prefixed utility layer before theme overrides", () => {
    const source = readFileSync(rootStylesPath, "utf8");
    const rootImports = cssImports(source);
    const tailwindEntry = readFileSync(new URL("./tailwind.css", import.meta.url), "utf8");

    expect(rootImports.indexOf("./styles/tailwind.css")).toBe(rootImports.indexOf("./styles/themes.css") - 1);
    expect(rootImports[rootImports.indexOf("./styles/tailwind.css") - 1]).toBe("./styles/hud-components.css");
    expect(tailwindEntry).toContain('@import "tailwindcss/theme.css" layer(theme) prefix(tw);');
    expect(tailwindEntry).toContain('@import "tailwindcss/utilities.css" layer(utilities) prefix(tw);');
    expect(tailwindEntry).not.toContain("preflight");
  });

  it("keeps art font usage semantic and opt-in", () => {
    const baseCss = readCssWithImports(new URL("./base.css", import.meta.url));
    const fontAssetPath = fileURLToPath(new URL("../../public/assets/fonts/WuWa-Lahai-Roi-Regular.ttf", import.meta.url));

    expect(statSync(fontAssetPath).isFile()).toBe(true);
    expect(baseCss).toContain('font-family: "Sigrika Accent Latin";');
    expect(baseCss).toContain('src: url("/assets/fonts/WuWa-Lahai-Roi-Regular.ttf") format("truetype")');
    expect(baseCss).toContain("U+0030-0039");
    expect(baseCss).toContain("U+0041-005A");
    expect(baseCss).toContain("U+0061-007A");
    expect(baseCss).toContain('--font-display-accent: "Sigrika Accent Latin";');
    expect(baseCss).toContain('--font-numeric-accent: "Sigrika Accent Latin";');
    expect(baseCss).toContain(".text-display-accent");
    expect(baseCss).toContain(".text-rating-value");
    expect(baseCss).toContain(".text-clock-value");
    expect(baseCss).toContain("font-variant-numeric: tabular-nums");
    expect(baseCss).toContain("text-transform: uppercase");
  });

  it("keeps top-level style files either imported or intentionally non-CSS tests", () => {
    const topLevelFiles = readdirSync(stylesDir).filter((entry) => !statSync(join(stylesDir, entry)).isDirectory());
    const unexpectedFiles = topLevelFiles.filter((entry) => {
      if (entry.endsWith(".css")) {
        return !DOMAIN_STYLE_FILES.has(entry)
          && !SECONDARY_ENTRY_STYLE_FILES.has(entry)
          && !LAZY_ROUTE_STYLE_FILES.has(entry);
      }
      if (entry.endsWith(".test.js")) return !TEST_STYLE_FILES.has(entry);
      if (entry.endsWith(".md")) return !DOCUMENTATION_FILES.has(entry);
      return false;
    });

    expect(unexpectedFiles).toEqual([]);
  });

  it("keeps CSS files with imports as import-only entries", () => {
    const filesWithMixedImports = cssFilesUnder(stylesDir)
      .map((filePath) => {
        const source = readFileSync(filePath, "utf8");

        return {
          path: relative(stylesDir, filePath).replaceAll("\\", "/"),
          hasImports: cssImports(source).length > 0,
          concreteCss: concreteCssAfterImports(source)
        };
      })
      .filter(({ hasImports, concreteCss }) => hasImports && concreteCss.length > 0)
      .map(({ path }) => path);

    expect(filesWithMixedImports).toEqual([]);
  });

  it("prevents new oversized CSS files and growth in known CSS debt files", () => {
    const oversizedCssFiles = cssFilesUnder(stylesDir)
      .map((filePath) => {
        const source = readFileSync(filePath, "utf8");

        return {
          path: relative(stylesDir, filePath).replaceAll("\\", "/"),
          bytes: normalizedCssSize(source)
        };
      })
      .filter(({ bytes }) => bytes >= CSS_SIZE_GUARD_BYTES);

    const unexpectedOversizedFiles = oversizedCssFiles.filter(({ path }) => !KNOWN_OVERSIZED_CSS_FILES.has(path));
    const expandedKnownDebtFiles = oversizedCssFiles
      .filter(({ path, bytes }) => {
        const currentLimit = KNOWN_OVERSIZED_CSS_FILES.get(path);

        return currentLimit !== undefined && bytes > currentLimit;
      })
      .map(({ path, bytes }) => ({ path, bytes, limit: KNOWN_OVERSIZED_CSS_FILES.get(path) }));

    expect(unexpectedOversizedFiles).toEqual([]);
    expect(expandedKnownDebtFiles).toEqual([]);
  });

  it("keeps mobile-adaptive.css as the final theme entry safety layer", () => {
    const themeEntry = readFileSync(new URL("./themes.css", import.meta.url), "utf8");

    expect(cssImports(themeEntry).at(-1)).toBe("./mobile-adaptive.css");

    const sharedThemeEntry = readFileSync(new URL("./themes/shared.css", import.meta.url), "utf8");
    expect(cssImports(sharedThemeEntry)).toEqual([
      "./shared/player-theme-tokens.css",
      "./shared/theme-settings-panel.css",
      "./shared/player-theme-wiring.css"
    ]);
    expect(sharedThemeEntry).not.toContain(".app-shell.player-theme-enabled {");

    const themeComponentsEntry = readFileSync(new URL("./themes/theme-components.css", import.meta.url), "utf8");
    expect(cssImports(themeComponentsEntry)).toEqual([
      "./theme-components/outcome-skill-states.css",
      "./theme-components/replay-outcome-win.css",
      "./theme-components/replay-outcome-loss.css",
      "./theme-components/replay-outcome-draw.css"
    ]);
    expect(themeComponentsEntry).not.toContain(".timer.byo-yomi");
  });

  it("keeps Bright School component repairs as import-only theme overlays", () => {
    const componentRepairsEntry = readFileSync(
      new URL("./themes/bright-school/component-repairs.css", import.meta.url),
      "utf8"
    );

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

    const foundationHomeEntry = readFileSync(
      new URL("./themes/bright-school/component-repairs/foundation-home.css", import.meta.url),
      "utf8"
    );
    expect(cssImports(foundationHomeEntry)).toEqual([
      "./foundation-home/scrollbar-auth.css",
      "./foundation-home/home-brand-status.css",
      "./foundation-home/home-image-entry.css"
    ]);
    expect(foundationHomeEntry).not.toContain(".home-top-strip {");

    const warehouseCharacterEntry = readFileSync(
      new URL("./themes/bright-school/component-repairs/warehouse-character.css", import.meta.url),
      "utf8"
    );
    expect(cssImports(warehouseCharacterEntry)).toEqual([
      "./warehouse-character/decoration-owned.css",
      "./warehouse-character/character-detail.css",
      "./warehouse-character/profile-character-badges.css",
      "./warehouse-character/character-target-modal.css"
    ]);
    expect(warehouseCharacterEntry).not.toContain(".character-detail {");

    const notebookPolishEntry = readFileSync(
      new URL("./themes/bright-school/component-repairs/notebook-polish.css", import.meta.url),
      "utf8"
    );
    expect(cssImports(notebookPolishEntry)).toEqual([
      "./notebook-polish/tape-rings-stones.css",
      "./notebook-polish/lobby-notebook-background.css",
      "./notebook-polish/home-entry-badges.css"
    ]);
    expect(notebookPolishEntry).not.toContain(".home-grid-featured {");
  });

  it("keeps Bright School mobile room dock actions as import-only theme overlays", () => {
    const brightSchoolMobileRoomEntry = readFileSync(
      new URL("./themes/bright-school/mobile/room.css", import.meta.url),
      "utf8"
    );
    expect(cssImports(brightSchoolMobileRoomEntry)).toContain("./room/dock-actions.css");

    const dockActionsEntry = readFileSync(
      new URL("./themes/bright-school/mobile/room/dock-actions.css", import.meta.url),
      "utf8"
    );
    expect(cssImports(dockActionsEntry)).toEqual([
      "./dock-actions/dock-tabs-shell.css",
      "./dock-actions/action-panel-hint.css",
      "./dock-actions/action-grid.css",
      "./dock-actions/decision-bar.css",
      "./dock-actions/action-button-labels.css"
    ]);
    expect(dockActionsEntry).not.toContain(".mobile-room-dock {");

    const shellHeaderMenuEntry = readFileSync(
      new URL("./themes/bright-school/mobile/room/shell-header-menu.css", import.meta.url),
      "utf8"
    );
    expect(cssImports(shellHeaderMenuEntry)).toEqual([
      "./shell-header-menu/screen-shell.css",
      "./shell-header-menu/header-title-tags.css",
      "./shell-header-menu/menu-buttons.css",
      "./shell-header-menu/menu-panel.css",
      "./shell-header-menu/menu-panel-items.css"
    ]);
    expect(shellHeaderMenuEntry).not.toContain(".mobile-room-screen {");

    const viewportPlayerStripsEntry = readFileSync(
      new URL("./themes/bright-school/mobile/room/viewport-player-strips.css", import.meta.url),
      "utf8"
    );
    expect(cssImports(viewportPlayerStripsEntry)).toEqual([
      "./viewport-player-strips/viewport-shell.css",
      "./viewport-player-strips/player-card-grid.css",
      "./viewport-player-strips/portrait-badge.css",
      "./viewport-player-strips/player-meta-name.css",
      "./viewport-player-strips/timer-captures-skill.css"
    ]);
    expect(viewportPlayerStripsEntry).not.toContain(".player-info {");
  });

  it("keeps Bright School mobile modal shell as an import-only theme overlay", () => {
    const modalShellEntry = readFileSync(
      new URL("./themes/bright-school/mobile/modal-shell.css", import.meta.url),
      "utf8"
    );

    expect(cssImports(modalShellEntry)).toEqual([
      "./modal-shell/shell-surfaces.css",
      "./modal-shell/scroll-controls.css"
    ]);
    expect(modalShellEntry).not.toContain(".modal-backdrop {");
    expect(modalShellEntry).not.toContain(".close-button {");
  });

  it("keeps Bright School refinement board as an import-only protected overlay", () => {
    const refinementBoardEntry = readFileSync(
      new URL("./themes/bright-school/quality-base/refinement-board.css", import.meta.url),
      "utf8"
    );

    expect(cssImports(refinementBoardEntry)).toEqual([
      "./refinement-board/board-surface-points.css",
      "./refinement-board/board-lines-layer.css",
      "./refinement-board/row-effects-shell.css",
      "./refinement-board/row-slash-art.css",
      "./refinement-board/board-lines-stroke.css",
      "./refinement-board/stone-position.css"
    ]);
    expect(refinementBoardEntry).not.toContain(".board .point");
  });

  it("hides native number input spinner controls while preserving number inputs", () => {
    const baseCss = readCssWithImports(new URL("./base.css", import.meta.url));

    expect(baseCss).toContain('input[type="number"]');
    expect(baseCss).toContain("appearance: textfield");
    expect(baseCss).toContain('input[type="number"]::-webkit-outer-spin-button');
    expect(baseCss).toContain('input[type="number"]::-webkit-inner-spin-button');
    expect(baseCss).toContain("-webkit-appearance: none");
  });

  it("keeps selected tab and toggle buttons visually pressed in the shared base layer", () => {
    const baseCss = readCssWithImports(new URL("./base.css", import.meta.url));

    expect(baseCss).toContain(".mode-tabs button[aria-selected=\"true\"]");
    expect(baseCss).toContain(".achievement-tabs button[aria-selected=\"true\"]");
    expect(baseCss).toContain(".mobile-tab-button.active");
    expect(baseCss).toContain("transform: translateY(1px) scale(0.985)");
    expect(baseCss).toContain("inset 0 2px 5px rgba(45, 36, 48, 0.16)");
  });

  it("keeps the preload screen centered with wrapping text", () => {
    const baseCss = readCssWithImports(new URL("./base.css", import.meta.url));

    expect(baseCss).toContain(".asset-preload-screen");
    expect(baseCss).toContain("min-height: 100dvh");
    expect(baseCss).toContain("place-items: center");
    expect(baseCss).toContain("background: transparent");
    expect(baseCss).toContain("width: min(520px, calc(100vw - 32px))");
    expect(baseCss).toContain(".preload-character");
    expect(baseCss).toContain("preload-character-hop");
    expect(baseCss).toContain(".preload-character img");
    expect(baseCss).toContain("filter: none");
    expect(baseCss).toContain(".preload-title");
    expect(baseCss).toContain(".preload-status");
    expect(baseCss).toContain(".preload-tip");
    expect(baseCss).toContain("white-space: normal");
    expect(baseCss).toContain("overflow-wrap: anywhere");
  });

  it("keeps the final Bright School preload panel background-free", () => {
    const preloadCss = readFileSync(
      new URL("./mobile-adaptive/bright-school-overrides/preload.css", import.meta.url),
      "utf8"
    );

    expect(preloadCss).toContain(".asset-preload-panel");
    expect(preloadCss).toContain("background-color: transparent !important");
    expect(preloadCss).toContain("background-image: none !important");
    expect(preloadCss).toContain(
      ".asset-preload-panel.asset-preload-panel.asset-preload-panel.asset-preload-panel"
    );
    expect(preloadCss).not.toContain(":has(.asset-preload-screen)");
  });

  it("keeps mobile settings tabs and match mode status on one line", () => {
    const mobileCss = readCssWithImports(new URL("./mobile-adaptive.css", import.meta.url));
    const matchModeCss = readCssWithImports(new URL("./modals.css", import.meta.url));

    expect(mobileCss).toContain(".settings-modal .settings-tabs");
    expect(mobileCss).toContain("grid-template-columns: repeat(3, minmax(0, 1fr)) !important");
    expect(mobileCss).toContain(".settings-modal .settings-tabs button");
    expect(mobileCss).toContain("white-space: nowrap !important");
    expect(mobileCss).toContain(".settings-modal h2");
    expect(mobileCss).toContain("line-height: 1.22 !important");
    expect(mobileCss).toContain("overflow: visible !important");
    expect(matchModeCss).toContain(".match-mode-rules");
    expect(matchModeCss).toContain(".match-mode-rule-line");
    expect(matchModeCss).toContain("justify-content: stretch");
    expect(matchModeCss).toContain("margin-left: auto");
    expect(matchModeCss).toContain(".match-mode-count small");
    expect(matchModeCss).toContain("white-space: nowrap !important");
    expect(matchModeCss).toContain("overflow-wrap: normal !important");
    expect(mobileCss).toContain(".match-mode-count");
    expect(mobileCss).toContain("justify-self: end !important");
    expect(mobileCss).toContain("margin-left: auto !important");
  });

  it("keeps base.css as an import-only shared foundation entry", () => {
    const baseEntry = readFileSync(new URL("./base.css", import.meta.url), "utf8");

    expect(cssImports(baseEntry)).toEqual([
      "./base/foundation.css",
      "./base/asset-preload.css",
      "./base/surfaces-forms-actions.css",
      "./base/topbar-room-tags.css",
      "./base/home-legacy-grid.css",
      "./base/home-stage-artboard.css",
      "./base/home-stage-toolbox.css",
      "./base/home-unavailable-entry.css",
      "./base/message-feedback.css"
    ]);
    expect(baseEntry).not.toContain(":root {");
    expect(baseEntry).not.toContain(".home-screen {");
    expect(baseEntry).not.toContain(".message-board-modal {");

    const legacyHomeGridEntry = readFileSync(new URL("./base/home-legacy-grid.css", import.meta.url), "utf8");
    expect(cssImports(legacyHomeGridEntry)).toEqual([
      "./home-legacy-grid/layout.css",
      "./home-legacy-grid/player-plaque.css",
      "./home-legacy-grid/match-feature.css",
      "./home-legacy-grid/entry-cards.css",
      "./home-legacy-grid/utility-grid.css"
    ]);
    expect(legacyHomeGridEntry).not.toContain(".home-grid,");
  });

  it("keeps admin.css as an import-only admin console entry", () => {
    const adminEntry = readFileSync(new URL("./admin.css", import.meta.url), "utf8");
    const adminConsoleSource = readFileSync(new URL("../admin/AdminConsole.jsx", import.meta.url), "utf8");

    expect(ROOT_STYLE_IMPORTS).not.toContain("./styles/admin.css");
    expect(adminConsoleSource).toContain('import "../styles/admin.css";');
    expect(cssImports(adminEntry)).toEqual([
      "./admin/shell-layout.css",
      "./admin/shared-surfaces.css",
      "./admin/analytics.css",
      "./admin/characters.css",
      "./admin/audit-feedback.css",
      "./admin/gacha.css",
      "./admin/achievements.css",
      "./admin/announcements.css",
      "./admin/onboarding-story.css",
      "./admin/onboarding-board-editor.css",
      "./admin/mailbox.css",
      "./admin/responsive.css",
      "./admin/polish.css"
    ]);
    expect(adminEntry).not.toContain(".admin-screen {");
    expect(adminEntry).not.toContain(".admin-table {");
    expect(adminEntry).not.toContain(".admin-gacha-board");
  });

  it("keeps admin analytics and polish styles as import-only sub-entries", () => {
    const analyticsEntry = readFileSync(new URL("./admin/analytics.css", import.meta.url), "utf8");
    const polishEntry = readFileSync(new URL("./admin/polish.css", import.meta.url), "utf8");

    expect(cssImports(analyticsEntry)).toEqual([
      "./analytics/brief.css",
      "./analytics/lists.css",
      "./analytics/operations.css"
    ]);
    expect(analyticsEntry).not.toContain(".admin-analytics-page {");
    expect(analyticsEntry).not.toContain(".admin-bar-row {");

    expect(cssImports(polishEntry)).toEqual([
      "./polish/tokens-surfaces.css",
      "./polish/forms-actions.css",
      "./polish/hud-isolation.css",
      "./polish/tables-specials.css"
    ]);
    expect(polishEntry).not.toContain(".admin-screen {");
    expect(polishEntry).not.toContain(".admin-table th");
  });

  it("keeps lobby.css as an import-only lobby and house entry", () => {
    const lobbyEntry = readFileSync(new URL("./lobby.css", import.meta.url), "utf8");

    expect(cssImports(lobbyEntry)).toEqual([
      "./lobby/panels-profile.css",
      "./lobby/characters.css",
      "./lobby/match-watch-entry.css",
      "./lobby/watch-list.css",
      "./lobby/watch-list-responsive.css"
    ]);
    expect(lobbyEntry).not.toContain(".profile-grid {");
    expect(lobbyEntry).not.toContain(".character-list {");
    expect(lobbyEntry).not.toContain(".watch-list-modal");
  });

  it("keeps the mobile interaction safety layer touch friendly", () => {
    const mobileCss = readCssWithImports(new URL("./mobile-adaptive.css", import.meta.url));
    const touchConfirmBlock = mobileCss.match(/\.point\.touch-confirming\s*\{[^}]+\}/)?.[0] ?? "";

    expect(mobileCss).toContain("--mobile-tap-duration: 120ms");
    expect(mobileCss).toContain("-webkit-tap-highlight-color: transparent");
    expect(mobileCss).toContain(".point.previewable:active");
    expect(mobileCss).toContain("touch-action: none");
    expect(touchConfirmBlock).not.toContain("transform: scale");
    expect(mobileCss).toContain("@keyframes mobile-sheet-in");
    expect(mobileCss).toContain("@media (max-width: 768px) and (prefers-reduced-motion: reduce)");
  });

  it("keeps mobile-adaptive.css as an import-only safety entry", () => {
    const mobileEntry = readFileSync(new URL("./mobile-adaptive.css", import.meta.url), "utf8");

    expect(cssImports(mobileEntry)).toEqual([
      "./mobile-adaptive/desktop-home-footer.css",
      "./mobile-adaptive/admin-fullscreen.css",
      "./mobile-adaptive/phone-core.css",
      "./mobile-adaptive/phone-character-detail-music.css",
      "./mobile-adaptive/phone-gacha.css",
      "./mobile-adaptive/phone-recruitment.css",
      "./mobile-adaptive/phone-shop.css",
      "./mobile-adaptive/phone-social-warehouse.css",
      "./mobile-adaptive/phone-interactions.css",
      "./mobile-adaptive/coarse-house.css",
      "./mobile-adaptive/motion-keyframes.css",
      "./mobile-adaptive/mobile-room-portrait.css",
      "./mobile-adaptive/mobile-profile-records.css",
      "./mobile-adaptive/mobile-profile-hero-results.css",
      "./mobile-adaptive/mobile-profile-social-actions.css",
      "./mobile-adaptive/profile-report-dialog.css",
      "./mobile-adaptive/mobile-room-landscape.css",
      "./mobile-adaptive/narrow-phone.css",
      "./mobile-adaptive/bright-school-overrides.css",
      "./mobile-adaptive/reduced-motion.css",
      "./mobile-adaptive/home-narrow-desktop.css",
      "./mobile-adaptive/bright-school-portrait.css",
      "./mobile-adaptive/announcement-detail.css",
      "./mobile-adaptive/semantic-accent-typography.css"
    ]);
    expect(mobileEntry).not.toContain(".gacha-modal {");
    expect(mobileEntry).not.toContain(".mobile-room-screen {");
    expect(mobileEntry).not.toContain(".home-mobile-menu-panel");

    const phoneCoreEntry = readFileSync(new URL("./mobile-adaptive/phone-core.css", import.meta.url), "utf8");
    expect(cssImports(phoneCoreEntry)).toEqual([
      "./phone-core/match-mode.css",
      "./phone-core/global-shell-controls.css",
      "./phone-core/modal-tabs-shell.css",
      "./phone-core/scroll-detail-result.css"
    ]);
    expect(phoneCoreEntry).not.toContain(".match-mode-modal {");

    const phoneGachaEntry = readFileSync(new URL("./mobile-adaptive/phone-gacha.css", import.meta.url), "utf8");
    expect(cssImports(phoneGachaEntry)).toEqual([
      "./phone-gacha/modal-tabs.css",
      "./phone-gacha/stage-machine.css",
      "./phone-gacha/controls-actions.css",
      "./phone-gacha/list-result-dialogs.css"
    ]);
    expect(phoneGachaEntry).not.toContain(".gacha-modal {");

    const mobileProfileRecordsEntry = readFileSync(
      new URL("./mobile-adaptive/mobile-profile-records.css", import.meta.url),
      "utf8"
    );
    expect(cssImports(mobileProfileRecordsEntry)).toEqual([
      "./mobile-profile-records/profile-shell-hero.css",
      "./mobile-profile-records/character-record-list.css",
      "./mobile-profile-records/footer-resume-stats.css"
    ]);
    expect(mobileProfileRecordsEntry).not.toContain(".user-profile-card {");
  });

  it("keeps mobile room portrait safety styles as an import-only sub-entry", () => {
    const mobileRoomPortraitEntry = readFileSync(
      new URL("./mobile-adaptive/mobile-room-portrait.css", import.meta.url),
      "utf8"
    );

    expect(cssImports(mobileRoomPortraitEntry)).toEqual([
      "./mobile-room-portrait/shell-header-menu.css",
      "./mobile-room-portrait/neutral-chrome-reset.css",
      "./mobile-room-portrait/viewport-shell.css",
      "./mobile-room-portrait/player-strips.css",
      "./mobile-room-portrait/board-viewport.css",
      "./mobile-room-portrait/dock-panels.css",
      "./mobile-room-portrait/action-decision-controls.css"
    ]);
    expect(mobileRoomPortraitEntry).not.toContain(".mobile-room-screen {");
    expect(mobileRoomPortraitEntry).not.toContain(".player-info {");
    expect(mobileRoomPortraitEntry).not.toContain(".mobile-tab-panel .action-bar");
    expect(mobileRoomPortraitEntry).not.toContain("@media (max-width");
  });

  it("keeps Bright School mobile overrides as an import-only guard entry", () => {
    const brightSchoolOverridesEntry = readFileSync(
      new URL("./mobile-adaptive/bright-school-overrides.css", import.meta.url),
      "utf8"
    );

    expect(cssImports(brightSchoolOverridesEntry)).toEqual([
      "./bright-school-overrides/character-deploy-state.css",
      "./bright-school-overrides/home-auth-header.css",
      "./bright-school-overrides/replay-dialog.css",
      "./bright-school-overrides/profile-house-records.css",
      "./bright-school-overrides/shop-cards.css",
      "./bright-school-overrides/leaderboard-cards.css",
      "./bright-school-overrides/leaderboard-top-ranks.css",
      "./bright-school-overrides/preload.css"
    ]);
    expect(brightSchoolOverridesEntry).not.toContain(".home-mobile-menu-panel");
    expect(brightSchoolOverridesEntry).not.toContain(".character-record-dialog");
    expect(brightSchoolOverridesEntry).not.toContain(".leaderboard-row");

    const leaderboardCardsEntry = readFileSync(
      new URL("./mobile-adaptive/bright-school-overrides/leaderboard-cards.css", import.meta.url),
      "utf8"
    );
    expect(cssImports(leaderboardCardsEntry)).toEqual([
      "./leaderboard-cards/modal-list-shell.css",
      "./leaderboard-cards/player-identity.css",
      "./leaderboard-cards/score-record.css",
      "./leaderboard-cards/rank-current.css"
    ]);
    expect(leaderboardCardsEntry).not.toContain(".leaderboard-modal {");
  });

  it("keeps Bright School mobile profile-house-records as an import-only guard sub-entry", () => {
    const profileHouseRecordsEntry = readFileSync(
      new URL("./mobile-adaptive/bright-school-overrides/profile-house-records.css", import.meta.url),
      "utf8"
    );

    expect(cssImports(profileHouseRecordsEntry)).toEqual([
      "./profile-house-records/house-profile-stats.css",
      "./profile-house-records/profile-resume-stats.css",
      "./profile-house-records/character-record-dialog.css",
      "./profile-house-records/resume-character-records.css"
    ]);
    expect(profileHouseRecordsEntry).not.toContain(".profile-grid.top-stats-bar");
    expect(profileHouseRecordsEntry).not.toContain(".character-record-dialog");
    expect(profileHouseRecordsEntry).not.toContain(".resume-character-records");
    expect(profileHouseRecordsEntry).not.toContain("@media (max-width");
  });

  it("keeps Bright School narrow desktop home safety as an import-only guard entry", () => {
    const homeNarrowDesktopEntry = readFileSync(
      new URL("./mobile-adaptive/home-narrow-desktop.css", import.meta.url),
      "utf8"
    );

    expect(cssImports(homeNarrowDesktopEntry)).toEqual([
      "./home-narrow-desktop/region-reset.css",
      "./home-narrow-desktop/wide-stage.css",
      "./home-narrow-desktop/compact-stage.css",
      "./home-narrow-desktop/micro-stage-scroll.css",
      "./home-narrow-desktop/short-height-stack.css"
    ]);
    expect(homeNarrowDesktopEntry).not.toContain(".home-player-zone");
    expect(homeNarrowDesktopEntry).not.toContain(".home-grid-featured.home-stage");
    expect(homeNarrowDesktopEntry).not.toContain("@media (min-width");
  });

  it("keeps Bright School portrait as an import-only final guard entry", () => {
    const brightSchoolPortraitEntry = readFileSync(
      new URL("./mobile-adaptive/bright-school-portrait.css", import.meta.url),
      "utf8"
    );

    expect(cssImports(brightSchoolPortraitEntry)).toEqual([
      "./bright-school-portrait/resume-modal-layout.css",
      "./bright-school-portrait/resume-character-records.css",
      "./bright-school-portrait/home-player-plaque.css",
      "./bright-school-portrait/shop-wallet.css",
      "./bright-school-portrait/settings-tabs.css",
      "./bright-school-portrait/mobile-room-chat.css",
      "./bright-school-portrait/mailbox-modal.css",
      "./bright-school-portrait/character-detail.css"
    ]);
    expect(brightSchoolPortraitEntry).not.toContain(".resume-header-actions {");
    expect(brightSchoolPortraitEntry).not.toContain(".mobile-room-screen .chat-popover");
    expect(brightSchoolPortraitEntry).not.toContain(".character-detail-heading");

    const resumeModalLayoutEntry = readFileSync(
      new URL("./mobile-adaptive/bright-school-portrait/resume-modal-layout.css", import.meta.url),
      "utf8"
    );
    expect(cssImports(resumeModalLayoutEntry)).toEqual([
      "./resume-modal-layout/actions-stats-records.css",
      "./resume-modal-layout/header-grid.css",
      "./resume-modal-layout/achievement-personalization.css"
    ]);
    expect(resumeModalLayoutEntry).not.toContain(".resume-header-actions {");

    const settingsTabsEntry = readFileSync(
      new URL("./mobile-adaptive/bright-school-portrait/settings-tabs.css", import.meta.url),
      "utf8"
    );
    expect(cssImports(settingsTabsEntry)).toEqual([
      "./settings-tabs/shell-theme-grid.css",
      "./settings-tabs/audio-volume-title.css",
      "./settings-tabs/shared-active-tabs.css"
    ]);
    expect(settingsTabsEntry).not.toContain(".settings-modal h2");
  });

  it("keeps semantic accent typography above Bright School broad resets", () => {
    const mobileCss = readCssWithImports(new URL("./mobile-adaptive.css", import.meta.url));
    const semanticAccentCss = readFileSync(
      new URL("./mobile-adaptive/semantic-accent-typography.css", import.meta.url),
      "utf8"
    );

    expect(semanticAccentCss).toContain(".text-display-accent");
    expect(semanticAccentCss).toContain(".text-rating-value");
    expect(semanticAccentCss).toContain(".text-clock-value");
    expect(semanticAccentCss).toContain("font-family: var(--font-numeric-accent), var(--font-ui-default) !important");
    expect(semanticAccentCss).toContain("text-transform: uppercase !important");
    expect(semanticAccentCss).toContain(".timer .text-clock-value .timer-primary");
    expect(semanticAccentCss).toContain(".timer.main-time .text-clock-value");
    expect(semanticAccentCss).toContain("color: #1c171a !important");
    expect(semanticAccentCss).toContain("color: #df2f2f !important");
    expect(semanticAccentCss).toContain("border: 0 !important");
    expect(semanticAccentCss).toContain("box-shadow: none !important");
    expect(semanticAccentCss).toContain("background: var(--timer-track-fill) !important");
    expect(semanticAccentCss).not.toContain(".digital-timer");

    expect(mobileCss).toContain(
      ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school :is(\n  .text-rating-value,\n  .text-clock-value\n)"
    );
    expect(mobileCss).toContain(".timer.final-byo-yomi .text-clock-value");
  });

  it("keeps nested CSS files under approved domain entry maps", () => {
    const nestedCssFiles = cssFilesUnder(stylesDir)
      .map((filePath) => relative(stylesDir, filePath).replaceAll("\\", "/"))
      .filter((filePath) => filePath.includes("/"));

    expect(nestedCssFiles.every((filePath) => DOMAIN_STYLE_DIRECTORIES.has(filePath.split("/")[0]))).toBe(true);
  });

  it("keeps commerce-settings.css as an import-only domain entry", () => {
    const commerceEntry = readFileSync(new URL("./commerce-settings.css", import.meta.url), "utf8");

    expect(cssImports(commerceEntry)).toEqual([
      "./commerce/gacha.css",
      "./commerce/recruitment.css",
      "./commerce/social-profile.css",
      "./commerce/shop-settings.css",
      "./commerce/terminal-polish.css",
      "./commerce/warehouse-toast.css"
    ]);
    expect(commerceEntry).not.toContain(".gacha-modal {");
    expect(commerceEntry).not.toContain(".shop-modal {");
    expect(commerceEntry).not.toContain(".warehouse-modal {");
  });

  it("keeps commerce shop-settings.css as an import-only commerce sub-entry", () => {
    const shopSettingsEntry = readFileSync(new URL("./commerce/shop-settings.css", import.meta.url), "utf8");

    expect(cssImports(shopSettingsEntry)).toEqual([
      "./shop-settings/owned-decoration-header.css",
      "./shop-settings/shop-shell-tabs.css",
      "./shop-settings/settings-panel.css",
      "./shop-settings/shop-grid-cards.css",
      "./shop-settings/shop-detail-pagination.css",
      "./shop-settings/compact-shop-media.css",
      "./shop-settings/compact-modal-safety.css",
      "./shop-settings/phone-layouts.css"
    ]);
    expect(shopSettingsEntry).not.toContain(".shop-modal {");
    expect(shopSettingsEntry).not.toContain(".shop-item {");
    expect(shopSettingsEntry).not.toContain(".warehouse-grid {");
  });

  it("keeps commerce warehouse-toast.css as an import-only commerce sub-entry", () => {
    const warehouseToastEntry = readFileSync(new URL("./commerce/warehouse-toast.css", import.meta.url), "utf8");

    expect(cssImports(warehouseToastEntry)).toEqual([
      "./warehouse-toast/modal-list.css",
      "./warehouse-toast/character-target.css",
      "./warehouse-toast/toast-stack.css",
      "./warehouse-toast/phone-layouts.css"
    ]);
    expect(warehouseToastEntry).not.toContain(".warehouse-modal {");
    expect(warehouseToastEntry).not.toContain(".toast-stack {");
    expect(warehouseToastEntry).not.toContain("@keyframes toast-fade");
  });

  it("keeps commerce gacha.css as an import-only commerce sub-entry", () => {
    const gachaEntry = readFileSync(new URL("./commerce/gacha.css", import.meta.url), "utf8");

    expect(cssImports(gachaEntry)).toEqual([
      "./gacha/modal-tabs.css",
      "./gacha/featured-stack.css",
      "./gacha/machine-stage.css",
      "./gacha/featured-prize.css",
      "./gacha/control-panel.css",
      "./gacha/list-result-dialogs.css",
      "./gacha/animations.css"
    ]);
    expect(gachaEntry).not.toContain(".gacha-modal {");
    expect(gachaEntry).not.toContain(".gacha-main {");
    expect(gachaEntry).not.toContain(".gacha-result-card");
    expect(gachaEntry).not.toContain("@keyframes gacha-drum-spin");
  });

  it("keeps commerce recruitment.css as an import-only commerce sub-entry", () => {
    const recruitmentEntry = readFileSync(new URL("./commerce/recruitment.css", import.meta.url), "utf8");
    const recruitmentShell = readFileSync(new URL("./commerce/recruitment/modal-shell.css", import.meta.url), "utf8");
    const recruitmentBoardEntry = readFileSync(new URL("./commerce/recruitment/board.css", import.meta.url), "utf8");
    const recruitmentBoard = readCssWithImports(new URL("./commerce/recruitment/board.css", import.meta.url));
    const phoneRecruitment = readFileSync(new URL("./mobile-adaptive/phone-recruitment.css", import.meta.url), "utf8");

    expect(cssImports(recruitmentEntry)).toEqual([
      "./recruitment/modal-shell.css",
      "./recruitment/board.css",
      "./recruitment/countdown.css",
      "./recruitment/actions.css"
    ]);
    expect(cssImports(recruitmentBoardEntry)).toEqual([
      "./board/surface.css",
      "./board/cards.css",
      "./board/motion.css"
    ]);
    expect(recruitmentEntry).not.toContain(".recruitment-modal {");
    expect(recruitmentBoardEntry).not.toContain(".recruitment-board {");
    expect(recruitmentShell).toContain("position: relative;");
    const recruitmentCountdown = readFileSync(new URL("./commerce/recruitment/countdown.css", import.meta.url), "utf8");
    expect(recruitmentBoard).toContain("--recruitment-board-background-image: url(\"/assets/recruitment/notice-board-flat-candidate.webp\")");
    expect(recruitmentBoard).toContain("var(--recruitment-board-background-image)");
    expect(recruitmentBoard).toContain("/assets/recruitment/celebration-flat-candidate.webp");
    expect(recruitmentBoard).toContain("/assets/recruitment/recruitment-letter-paper-flat.webp");
    expect(recruitmentBoard).toContain("/assets/recruitment/recruitment-envelope-flat.webp");
    expect(recruitmentBoard).toContain(".recruitment-item-watermark-art");
    expect(recruitmentBoard).toContain("transform: translate(-50%, -50%) rotate(20deg) scale(1.04);");
    expect(recruitmentBoard).toContain("opacity: 0.3;");
    expect(recruitmentBoard).toContain(".recruitment-ready-card");
    expect(recruitmentBoard).toContain(".recruitment-pending-panel");
    expect(recruitmentBoard).toContain("border: 0;");
    expect(recruitmentBoard).toContain("background: transparent;");
    expect(recruitmentBoard).toContain(".recruitment-pending-panel > div");
    expect(recruitmentBoard).toContain("align-self: center;");
    expect(recruitmentBoard).toContain("@keyframes recruitment-paper-pop");
    expect(recruitmentBoard).toContain(".recruitment-selection-card p");
    expect(recruitmentBoard).toContain("color: #b53434;");
    expect(statSync(new URL("../../public/assets/recruitment/notice-board-flat-candidate.webp", import.meta.url)).size).toBeLessThan(100_000);
    expect(statSync(new URL("../../public/assets/recruitment/celebration-flat-candidate.webp", import.meta.url)).size).toBeLessThan(100_000);
    expect(statSync(new URL("../../public/assets/recruitment/stationery-flat-candidate.webp", import.meta.url)).size).toBeLessThan(100_000);
    expect(statSync(new URL("../../public/assets/recruitment/recruitment-letter-paper-flat.webp", import.meta.url)).size).toBeLessThan(100_000);
    expect(statSync(new URL("../../public/assets/recruitment/recruitment-envelope-flat.webp", import.meta.url)).size).toBeLessThan(100_000);
    expect(recruitmentCountdown).toContain(".recruitment-countdown-row");
    expect(recruitmentCountdown).toContain(".recruitment-pending-panel b");
    expect(recruitmentCountdown).toContain("background: transparent;");
    expect(recruitmentCountdown).toContain("box-shadow: none;");
    expect(recruitmentCountdown).not.toContain("repeating-linear-gradient");
    expect(recruitmentCountdown).not.toContain("border: 3px solid #3d2b25;");
    expect(recruitmentCountdown).toContain("font-family: \"Courier New\", Consolas, monospace;");
    expect(recruitmentCountdown).toContain("text-shadow:");
    expect(recruitmentCountdown).toContain(".recruitment-fast-forward-button");
    expect(phoneRecruitment).toContain(".recruitment-empty-board::before");
    expect(phoneRecruitment).toContain(".recruitment-fast-forward-button");
    expect(phoneRecruitment).toContain(".recruitment-result-actions");
    expect(phoneRecruitment).toContain(".recruitment-result-actions .recruitment-use-button:active:not(:disabled)");
    expect(phoneRecruitment).toContain(".recruitment-status-card");
    expect(phoneRecruitment).toContain("grid-template-columns: minmax(0, 1fr) !important;");
    expect(phoneRecruitment).toContain(".recruitment-ready-card .primary-action");
    expect(phoneRecruitment).toContain(".recruitment-pending-panel");
    expect(phoneRecruitment).toContain("border: 0 !important;");
    expect(phoneRecruitment).toContain("background: transparent !important;");
    expect(phoneRecruitment).toContain(".recruitment-item-watermark-art");
    expect(phoneRecruitment).toContain("height: 142% !important;");
    expect(phoneRecruitment).toContain("opacity: 0.28 !important;");
    expect(phoneRecruitment).toContain(".recruitment-item-button span");
    expect(phoneRecruitment).toContain("display: none !important;");
    expect(phoneRecruitment).toContain(".recruitment-use-button:disabled");
  });

  it("keeps commerce social-profile.css as an import-only commerce sub-entry", () => {
    const socialProfileEntry = readFileSync(new URL("./commerce/social-profile.css", import.meta.url), "utf8");

    expect(cssImports(socialProfileEntry)).toEqual([
      "./social-profile/modal-shells.css",
      "./social-profile/friends-toolbar-search.css",
      "./social-profile/friends-list-status.css",
      "./social-profile/friend-actions-notices.css",
      "./social-profile/duel-request-banner.css",
      "./social-profile/leaderboard-table.css",
      "./social-profile/owned-decoration-section.css"
    ]);
    expect(socialProfileEntry).not.toContain(".friends-row {");
    expect(socialProfileEntry).not.toContain(".duel-request-banner {");
    expect(socialProfileEntry).not.toContain(".leaderboard-table {");
    expect(socialProfileEntry).not.toContain("@keyframes duel-request-drop");
  });

  it("keeps commerce terminal-polish.css as an import-only commerce sub-entry", () => {
    const terminalPolishEntry = readFileSync(new URL("./commerce/terminal-polish.css", import.meta.url), "utf8");

    expect(cssImports(terminalPolishEntry)).toEqual([
      "./terminal-polish/headers-profile.css",
      "./terminal-polish/character-cards.css",
      "./terminal-polish/shop-shell-tabs.css",
      "./terminal-polish/item-cards-empty.css",
      "./terminal-polish/lists-status.css",
      "./terminal-polish/settings-warehouse-target.css",
      "./terminal-polish/compact-phone.css"
    ]);
    expect(terminalPolishEntry).not.toContain(".leaderboard-header,");
    expect(terminalPolishEntry).not.toContain(".shop-modal {");
    expect(terminalPolishEntry).not.toContain(".leaderboard-row,");
    expect(terminalPolishEntry).not.toContain("@media (max-width");
  });

  it("keeps responsive.css as an import-only breakpoint entry", () => {
    const responsiveEntry = readFileSync(new URL("./responsive.css", import.meta.url), "utf8");

    expect(cssImports(responsiveEntry)).toEqual([
      "./responsive/tablet-home-admin-room.css",
      "./responsive/tablet-landscape.css",
      "./responsive/compact-battle-room.css",
      "./responsive/phone-portrait-room.css",
      "./responsive/short-landscape-room.css",
      "./responsive/small-phone-admin-forms.css"
    ]);
    expect(responsiveEntry).not.toContain(".home-grid-featured {");
    expect(responsiveEntry).not.toContain(".mobile-room-screen {");
    expect(responsiveEntry).not.toContain(".admin-crud-drawer {");

    const phonePortraitRoomEntry = readFileSync(new URL("./responsive/phone-portrait-room.css", import.meta.url), "utf8");
    expect(cssImports(phonePortraitRoomEntry)).toEqual([
      "./phone-portrait-room/shell-layout.css",
      "./phone-portrait-room/player-panels.css",
      "./phone-portrait-room/board-viewport.css",
      "./phone-portrait-room/tabs-actions.css"
    ]);
    expect(phonePortraitRoomEntry).not.toContain(".mobile-room-screen {");
  });

  it("keeps mobile-room.css as an import-only mobile battle entry", () => {
    const mobileRoomEntry = readFileSync(new URL("./mobile-room.css", import.meta.url), "utf8");

    expect(cssImports(mobileRoomEntry)).toEqual([
      "./mobile-room/base-shell-dock.css",
      "./mobile-room/portrait-room.css",
      "./mobile-room/narrow-portrait.css",
      "./mobile-room/landscape-room.css",
      "./mobile-room/short-landscape-room.css",
      "./mobile-room/reduced-motion.css"
    ]);
    expect(mobileRoomEntry).not.toContain(".mobile-room-screen {");
    expect(mobileRoomEntry).not.toContain(".mobile-room-viewport {");
    expect(mobileRoomEntry).not.toContain(".mobile-tab-panel .action-bar");

    const portraitRoomEntry = readFileSync(new URL("./mobile-room/portrait-room.css", import.meta.url), "utf8");
    expect(cssImports(portraitRoomEntry)).toEqual([
      "./portrait-room/shell-viewport.css",
      "./portrait-room/player-card-layout.css",
      "./portrait-room/header-menu.css",
      "./portrait-room/portrait-badges.css",
      "./portrait-room/player-meta-timers.css",
      "./portrait-room/skill-replay-popover.css",
      "./portrait-room/board-dock-tabs.css",
      "./portrait-room/decision-actions-hint.css"
    ]);
    expect(portraitRoomEntry).not.toContain(".mobile-room-screen {");
  });

  it("keeps mobile room base shell and dock styles as an import-only sub-entry", () => {
    const baseShellDockEntry = readFileSync(new URL("./mobile-room/base-shell-dock.css", import.meta.url), "utf8");

    expect(cssImports(baseShellDockEntry)).toEqual([
      "./base-shell-dock/shell-header-menu.css",
      "./base-shell-dock/flat-control-reset.css",
      "./base-shell-dock/viewport-dock-shell.css",
      "./base-shell-dock/player-timer-strip.css",
      "./base-shell-dock/board-viewport.css",
      "./base-shell-dock/dock-tabs-actions.css",
      "./base-shell-dock/decision-chat-panel.css"
    ]);
    expect(baseShellDockEntry).not.toContain(".mobile-room-screen {");
    expect(baseShellDockEntry).not.toContain(".mobile-room-viewport {");
    expect(baseShellDockEntry).not.toContain(".mobile-tab-panel .action-bar");
  });

  it("keeps mobile-home.css as an import-only mobile lobby entry", () => {
    const mobileHomeEntry = readFileSync(new URL("./mobile-home.css", import.meta.url), "utf8");

    expect(cssImports(mobileHomeEntry)).toEqual([
      "./mobile-home/base-portrait.css",
      "./mobile-home/narrow-phone.css",
      "./mobile-home/landscape.css"
    ]);
    expect(mobileHomeEntry).not.toContain(".app-shell:has(.home-screen)");
    expect(mobileHomeEntry).not.toContain(".home-grid-featured");
    expect(mobileHomeEntry).not.toContain("@media (max-width: 900px)");
  });

  it("keeps mobile-modals.css as an import-only mobile modal entry", () => {
    const mobileModalsEntry = readFileSync(new URL("./mobile-modals.css", import.meta.url), "utf8");

    expect(cssImports(mobileModalsEntry)).toEqual([
      "./mobile-modals/backdrop-base.css",
      "./mobile-modals/compact-modal-shell.css",
      "./mobile-modals/phone-modal-shell-watch.css",
      "./mobile-modals/phone-replay-profile.css",
      "./mobile-modals/phone-shop-buttons.css",
      "./mobile-modals/phone-leaderboard.css",
      "./mobile-modals/phone-friends.css",
      "./mobile-modals/phone-house-resume.css",
      "./mobile-modals/reduced-motion.css"
    ]);
    expect(mobileModalsEntry).not.toContain(".modal-backdrop {");
    expect(mobileModalsEntry).not.toContain(".leaderboard-row");
    expect(mobileModalsEntry).not.toContain(".house-modal .character-list");

    const phoneHouseResumeEntry = readFileSync(new URL("./mobile-modals/phone-house-resume.css", import.meta.url), "utf8");
    expect(cssImports(phoneHouseResumeEntry)).toEqual([
      "./phone-house-resume/shell-header.css",
      "./phone-house-resume/stats-records.css",
      "./phone-house-resume/character-list.css",
      "./phone-house-resume/decorations.css",
      "./phone-house-resume/achievement-personalization.css"
    ]);
    expect(phoneHouseResumeEntry).not.toContain(".house-modal {");
  });

  it("keeps hud-components.css as an import-only HUD compatibility entry", () => {
    const hudEntry = readFileSync(new URL("./hud-components.css", import.meta.url), "utf8");

    expect(cssImports(hudEntry)).toEqual([
      "./hud-components/hud-hardening.css",
      "./hud-components/narrow-hud-tweaks.css",
      "./hud-components/pop-tech-terminal.css",
      "./hud-components/handbook-readability.css",
      "./hud-components/character-chain-badge.css",
      "./hud-components/user-identity.css"
    ]);
    expect(hudEntry).not.toContain(".app-shell {");
    expect(hudEntry).not.toContain(".shop-tabs button.active");
    expect(hudEntry).not.toContain(".character-chain-badge");

    const popTechEntry = readFileSync(new URL("./hud-components/pop-tech-terminal.css", import.meta.url), "utf8");
    expect(cssImports(popTechEntry)).toEqual([
      "./pop-tech-terminal/tokens.css",
      "./pop-tech-terminal/modal-surfaces.css",
      "./pop-tech-terminal/interactive-motion.css",
      "./pop-tech-terminal/home-hologram.css",
      "./pop-tech-terminal/character-deploy.css",
      "./pop-tech-terminal/tabs-actions.css",
      "./pop-tech-terminal/keyframes.css"
    ]);
    expect(popTechEntry).not.toContain(".small-modal,");

    const userIdentityEntry = readFileSync(new URL("./hud-components/user-identity.css", import.meta.url), "utf8");
    expect(cssImports(userIdentityEntry)).toEqual([
      "./user-identity/core.css",
      "./user-identity/context-surfaces.css",
      "./user-identity/phone-layouts.css"
    ]);
    expect(userIdentityEntry).not.toContain(".user-identity {");
    expect(userIdentityEntry).not.toContain(".leaderboard-player .user-identity");
    expect(userIdentityEntry).not.toContain("@media (max-width");
  });

  it("keeps HUD hardening as an import-only component sub-entry", () => {
    const hudHardeningEntry = readFileSync(new URL("./hud-components/hud-hardening.css", import.meta.url), "utf8");

    expect(cssImports(hudHardeningEntry)).toEqual([
      "./hud-hardening/tokens-shell-scrollbars.css",
      "./hud-hardening/inputs-settings-auth.css",
      "./hud-hardening/inventory-state-tags.css",
      "./hud-hardening/home-hologram-entries.css",
      "./hud-hardening/character-deploy-detail.css",
      "./hud-hardening/shop-pagination-owned.css",
      "./hud-hardening/warehouse-surfaces.css",
      "./hud-hardening/friend-actions.css"
    ]);
    expect(hudHardeningEntry).not.toContain(":root {");
    expect(hudHardeningEntry).not.toContain(".login-card-container");
    expect(hudHardeningEntry).not.toContain(".character-detail");
    expect(hudHardeningEntry).not.toContain(".shop-pagination button");
  });

  it("keeps room.css as an import-only domain entry", () => {
    const roomEntry = readFileSync(new URL("./room.css", import.meta.url), "utf8");
    const tutorialBattleEntry = readFileSync(new URL("./room/tutorial-battle-screen.css", import.meta.url), "utf8");
    const tutorialBattleSource = readFileSync(new URL("../tutorial/TutorialBattleScreen.jsx", import.meta.url), "utf8");

    expect(cssImports(roomEntry)).toEqual([
      "./room/layout-tabs.css",
      "./room/players-timers-skills.css",
      "./room/board.css",
      "./room/actions-requests.css",
      "./room/people-floating-replay.css",
      "./room/chat-responsive.css"
    ]);
    expect(tutorialBattleSource).toContain('import "../styles/room/tutorial-battle-screen.css";');
    expect(cssImports(tutorialBattleEntry)).toEqual([
      "./tutorial-battle-screen/overlay-choice.css",
      "./tutorial-battle-screen/actions-targets.css",
      "./tutorial-battle-screen/target-ring.css",
      "./tutorial-battle-screen/no-character-portraits.css",
      "./tutorial-battle-screen/loading-motion.css"
    ]);
    expect(roomEntry).not.toContain(".battle-layout {");
    expect(roomEntry).not.toContain(".board {");
    expect(roomEntry).not.toContain(".chat-widget {");
    expect(roomEntry).not.toContain("./room/tutorial-battle-screen.css");
    expect(tutorialBattleEntry).not.toContain(".tutorial-battle-dialogue {");

    const actionsRequestsEntry = readFileSync(new URL("./room/actions-requests.css", import.meta.url), "utf8");
    expect(cssImports(actionsRequestsEntry)).toEqual([
      "./actions-requests/toggles-action-bar.css",
      "./actions-requests/decision-scoring.css",
      "./actions-requests/request-toast.css",
      "./actions-requests/action-states-tools.css",
      "./actions-requests/replay-disabled.css"
    ]);
    expect(actionsRequestsEntry).not.toContain(".decision-bar {");
  });

  it("keeps room board styles as an import-only board sub-entry", () => {
    const boardEntry = readFileSync(new URL("./room/board.css", import.meta.url), "utf8");

    expect(cssImports(boardEntry)).toEqual([
      "./board/frame-coordinates.css",
      "./board/row-slash.css",
      "./board/ambient-fog.css",
      "./board/effects-canvas-motion.css",
      "./board/points-preview.css",
      "./board/stones-skill-effects.css",
      "./board/row-slash-stone-effects.css",
      "./board/liberty-purge-stone-effects.css",
      "./board/spray-stone-effects.css",
      "./board/gomoku-winning-line.css",
      "./board/latest-touch-void.css",
      "./board/grid-scoring.css"
    ]);
    expect(boardEntry).not.toContain(".board-wrap {");
    expect(boardEntry).not.toContain(".board-row-slash {");
    expect(boardEntry).not.toContain(".point {");
    expect(boardEntry).not.toContain(".board-lines {");

    const stonesSkillEffectsEntry = readFileSync(
      new URL("./room/board/stones-skill-effects.css", import.meta.url),
      "utf8"
    );
    expect(cssImports(stonesSkillEffectsEntry)).toEqual([
      "./stones-skill-effects/stone-base.css",
      "./stones-skill-effects/hidden-flip-double.css",
      "./stones-skill-effects/transient-markers.css",
      "./stones-skill-effects/voyage-star-keyframes.css",
      "./stones-skill-effects/protocol-ban.css",
      "./stones-skill-effects/liberty-purge.css",
      "./stones-skill-effects/stone-effect-keyframes.css"
    ]);
    expect(stonesSkillEffectsEntry).not.toContain(".stone {");
  });

  it("keeps room players, timers, and skills as an import-only room sub-entry", () => {
    const playersTimersSkillsEntry = readFileSync(new URL("./room/players-timers-skills.css", import.meta.url), "utf8");

    expect(cssImports(playersTimersSkillsEntry)).toEqual([
      "./players-timers-skills/side-layout.css",
      "./players-timers-skills/player-card.css",
      "./players-timers-skills/captures-tooltips.css",
      "./players-timers-skills/timers.css",
      "./players-timers-skills/skill-chips.css",
      "./players-timers-skills/mobile-tap-tooltip.css",
      "./players-timers-skills/color-badges.css"
    ]);
    expect(playersTimersSkillsEntry).not.toContain(".player-info {");
    expect(playersTimersSkillsEntry).not.toContain(".timer {");
    expect(playersTimersSkillsEntry).not.toContain(".skill-chip");
    expect(playersTimersSkillsEntry).not.toContain(".mobile-tap-tooltip");
  });

  it("keeps room-terminal.css as an import-only battlefield skin entry", () => {
    const roomTerminalEntry = readFileSync(new URL("./room-terminal.css", import.meta.url), "utf8");

    expect(cssImports(roomTerminalEntry)).toEqual([
      "./room-terminal/shell-theme.css",
      "./room-terminal/header-tags.css",
      "./room-terminal/players-timers-skills.css",
      "./room-terminal/board-actions.css",
      "./room-terminal/panels-chat-replay.css",
      "./room-terminal/mobile-portrait.css",
      "./room-terminal/mobile-landscape.css"
    ]);
    expect(roomTerminalEntry).not.toContain(".app-shell:has(.room-screen)");
    expect(roomTerminalEntry).not.toContain(".player-info.self");
    expect(roomTerminalEntry).not.toContain(".mobile-room-screen .mobile-room-viewport");

    const roomTerminalPlayersEntry = readFileSync(
      new URL("./room-terminal/players-timers-skills.css", import.meta.url),
      "utf8"
    );
    expect(cssImports(roomTerminalPlayersEntry)).toEqual([
      "./players-timers-skills/player-panels.css",
      "./players-timers-skills/identity-captures.css",
      "./players-timers-skills/timers.css",
      "./players-timers-skills/skill-chip-detail.css",
      "./players-timers-skills/keyframes.css"
    ]);
    expect(roomTerminalPlayersEntry).not.toContain(".player-info {");
  });

  it("keeps home-terminal.css as an import-only lobby skin entry", () => {
    const homeTerminalEntry = readFileSync(new URL("./home-terminal.css", import.meta.url), "utf8");

    expect(cssImports(homeTerminalEntry)).toEqual([
      "./home-terminal/shell-background.css",
      "./home-terminal/top-strip.css",
      "./home-terminal/layout-player.css",
      "./home-terminal/entries.css",
      "./home-terminal/utility-footer-motion.css",
      "./home-terminal/recruitment-alert.css",
      "./home-terminal/mobile.css"
    ]);
    expect(homeTerminalEntry).not.toContain(".app-shell:has(.home-screen)");
    expect(homeTerminalEntry).not.toContain(".home-player-zone");
    expect(homeTerminalEntry).not.toContain("@media (max-width: 768px)");
  });

  it("keeps modals.css as an import-only domain entry", () => {
    const modalsEntry = readFileSync(new URL("./modals.css", import.meta.url), "utf8");

    expect(cssImports(modalsEntry)).toEqual([
      "./modals/base-result-skill.css",
      "./modals/result-modal.css",
      "./modals/replay-mode-resume.css",
      "./modals/nested-profile.css",
      "./modals/profile-character-records.css",
      "./modals/profile-hero-cleanup.css",
      "./modals/profile-social-actions.css",
      "./modals/character-opening.css",
      "./modals/character-music-player.css",
      "./modals/phone.css",
      "./modals/terminal-system.css",
      "./modals/mailbox.css",
      "./modals/announcement.css",
      "./modals/onboarding-story.css",
      "./modals/tutorial-session.css"
    ]);
    expect(modalsEntry).not.toContain(".modal-backdrop {");
    expect(modalsEntry).not.toContain(".resume-modal {");
    expect(modalsEntry).not.toContain(".character-detail {");

    const characterOpeningEntry = readFileSync(new URL("./modals/character-opening.css", import.meta.url), "utf8");
    expect(cssImports(characterOpeningEntry)).toEqual([
      "./character-opening/detail.css",
      "./character-opening/skill-copy.css",
      "./character-opening/replay-match.css",
      "./character-opening/opening-animation.css",
      "./character-opening/keyframes.css"
    ]);
    expect(characterOpeningEntry).not.toContain(".character-detail {");

    const onboardingStoryEntry = readFileSync(new URL("./modals/onboarding-story.css", import.meta.url), "utf8");
    expect(cssImports(onboardingStoryEntry)).toEqual([
      "./onboarding-story/shell.css",
      "./onboarding-story/portrait-text.css",
      "./onboarding-story/actions-skip.css",
      "./onboarding-story/mobile.css"
    ]);
    expect(onboardingStoryEntry).not.toContain(".onboarding-story-modal {");
  });

  it("keeps admin console full-width after theme and HUD layers", () => {
    const mobileAdaptiveEntry = readFileSync(new URL("./mobile-adaptive.css", import.meta.url), "utf8");
    const mobileCss = readCssWithImports(new URL("./mobile-adaptive.css", import.meta.url));

    expect(cssImports(mobileAdaptiveEntry)).toContain("./mobile-adaptive/admin-fullscreen.css");
    expect(mobileCss).toContain(".app-shell:has(.admin-screen)");
    expect(mobileCss).toContain("background: #f6f7fb !important");
    expect(mobileCss).toContain(".app-shell:has(.admin-screen)::before");
    expect(mobileCss).toContain(".admin-screen");
    expect(mobileCss).toContain("width: 100vw");
    expect(mobileCss).toContain("max-width: none");
  });

  it("keeps terminal modal system styles as an import-only sub-entry", () => {
    const terminalSystemEntry = readFileSync(new URL("./modals/terminal-system.css", import.meta.url), "utf8");

    expect(cssImports(terminalSystemEntry)).toEqual([
      "./terminal-system/tokens-backdrop.css",
      "./terminal-system/modal-chrome.css",
      "./terminal-system/close-header-actions.css",
      "./terminal-system/terminal-buttons.css",
      "./terminal-system/replay-profile-surfaces.css",
      "./terminal-system/result-modal.css",
      "./terminal-system/outcomes-resume-actions.css"
    ]);
    expect(terminalSystemEntry).not.toContain(":root {");
    expect(terminalSystemEntry).not.toContain(".small-modal,");
    expect(terminalSystemEntry).not.toContain(".primary-action,");
    expect(terminalSystemEntry).not.toContain(".result-modal.black-win");
  });

  it("keeps replay, mode, resume, achievement, and personalization modal styles as an import-only sub-entry", () => {
    const replayModeResumeEntry = readFileSync(new URL("./modals/replay-mode-resume.css", import.meta.url), "utf8");

    expect(cssImports(replayModeResumeEntry)).toEqual([
      "./replay-mode-resume/replay-list-table.css",
      "./replay-mode-resume/resume-header-actions.css",
      "./replay-mode-resume/match-mode-tabs.css",
      "./replay-mode-resume/resume-modal-layout.css",
      "./replay-mode-resume/achievement-modal.css",
      "./replay-mode-resume/personalization-preview-grid.css",
      "./replay-mode-resume/personalization-picker.css",
      "./replay-mode-resume/resume-character-records.css"
    ]);
    expect(replayModeResumeEntry).not.toContain(".replay-list {");
    expect(replayModeResumeEntry).not.toContain(".resume-modal {");
    expect(replayModeResumeEntry).not.toContain(".achievement-modal,");
    expect(replayModeResumeEntry).not.toContain(".personalization-modal {");
    expect(replayModeResumeEntry).not.toContain(".resume-character-records {");
  });
});
