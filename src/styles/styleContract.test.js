import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { readCssWithImports } from "./cssTestUtils.js";

const rootStylesPath = fileURLToPath(new URL("../styles.css", import.meta.url));
const stylesDir = dirname(fileURLToPath(new URL("./base.css", import.meta.url)));

const ROOT_STYLE_IMPORTS = [
  "./styles/base.css",
  "./styles/admin.css",
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
  "./styles/themes.css"
];

const DOMAIN_STYLE_FILES = new Set(ROOT_STYLE_IMPORTS.map((importPath) => basename(importPath)));
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
const TEST_STYLE_FILES = new Set(["hudComponents.test.js", "styleContract.test.js", "themeContract.test.js"]);
const DOCUMENTATION_FILES = new Set(["README.md"]);

function cssImports(source) {
  return [...source.matchAll(/@import\s+"([^"]+)";/g)].map((match) => match[1]);
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

  it("keeps top-level style files either imported or intentionally non-CSS tests", () => {
    const topLevelFiles = readdirSync(stylesDir).filter((entry) => !statSync(join(stylesDir, entry)).isDirectory());
    const unexpectedFiles = topLevelFiles.filter((entry) => {
      if (entry.endsWith(".css")) return !DOMAIN_STYLE_FILES.has(entry) && !SECONDARY_ENTRY_STYLE_FILES.has(entry);
      if (entry.endsWith(".test.js")) return !TEST_STYLE_FILES.has(entry);
      if (entry.endsWith(".md")) return !DOCUMENTATION_FILES.has(entry);
      return false;
    });

    expect(unexpectedFiles).toEqual([]);
  });

  it("keeps mobile-adaptive.css as the final theme entry safety layer", () => {
    const themeEntry = readFileSync(new URL("./themes.css", import.meta.url), "utf8");

    expect(cssImports(themeEntry).at(-1)).toBe("./mobile-adaptive.css");
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

  it("keeps base.css as an import-only shared foundation entry", () => {
    const baseEntry = readFileSync(new URL("./base.css", import.meta.url), "utf8");

    expect(cssImports(baseEntry)).toEqual([
      "./base/foundation.css",
      "./base/asset-preload.css",
      "./base/surfaces-forms-actions.css",
      "./base/topbar-room-tags.css",
      "./base/home-legacy-grid.css",
      "./base/home-stage-artboard.css",
      "./base/message-feedback.css"
    ]);
    expect(baseEntry).not.toContain(":root {");
    expect(baseEntry).not.toContain(".home-screen {");
    expect(baseEntry).not.toContain(".message-board-modal {");
  });

  it("keeps admin.css as an import-only admin console entry", () => {
    const adminEntry = readFileSync(new URL("./admin.css", import.meta.url), "utf8");

    expect(cssImports(adminEntry)).toEqual([
      "./admin/shell-layout.css",
      "./admin/shared-surfaces.css",
      "./admin/characters.css",
      "./admin/audit-feedback.css",
      "./admin/gacha.css",
      "./admin/achievements.css",
      "./admin/responsive.css"
    ]);
    expect(adminEntry).not.toContain(".admin-screen {");
    expect(adminEntry).not.toContain(".admin-table {");
    expect(adminEntry).not.toContain(".admin-gacha-board");
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
      "./mobile-adaptive/phone-core.css",
      "./mobile-adaptive/phone-gacha.css",
      "./mobile-adaptive/phone-shop.css",
      "./mobile-adaptive/phone-social-warehouse.css",
      "./mobile-adaptive/phone-interactions.css",
      "./mobile-adaptive/coarse-house.css",
      "./mobile-adaptive/motion-keyframes.css",
      "./mobile-adaptive/mobile-room-portrait.css",
      "./mobile-adaptive/mobile-profile-records.css",
      "./mobile-adaptive/mobile-room-landscape.css",
      "./mobile-adaptive/narrow-phone.css",
      "./mobile-adaptive/bright-school-overrides.css",
      "./mobile-adaptive/reduced-motion.css",
      "./mobile-adaptive/home-narrow-desktop.css",
      "./mobile-adaptive/bright-school-portrait.css"
    ]);
    expect(mobileEntry).not.toContain(".gacha-modal {");
    expect(mobileEntry).not.toContain(".mobile-room-screen {");
    expect(mobileEntry).not.toContain(".home-mobile-menu-panel");
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
      "./bright-school-overrides/leaderboard-cards.css"
    ]);
    expect(brightSchoolOverridesEntry).not.toContain(".home-mobile-menu-panel");
    expect(brightSchoolOverridesEntry).not.toContain(".character-record-dialog");
    expect(brightSchoolOverridesEntry).not.toContain(".leaderboard-row");
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
  });

  it("keeps room.css as an import-only domain entry", () => {
    const roomEntry = readFileSync(new URL("./room.css", import.meta.url), "utf8");

    expect(cssImports(roomEntry)).toEqual([
      "./room/layout-tabs.css",
      "./room/players-timers-skills.css",
      "./room/board.css",
      "./room/actions-requests.css",
      "./room/people-floating-replay.css",
      "./room/chat-responsive.css"
    ]);
    expect(roomEntry).not.toContain(".battle-layout {");
    expect(roomEntry).not.toContain(".board {");
    expect(roomEntry).not.toContain(".chat-widget {");
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
  });

  it("keeps home-terminal.css as an import-only lobby skin entry", () => {
    const homeTerminalEntry = readFileSync(new URL("./home-terminal.css", import.meta.url), "utf8");

    expect(cssImports(homeTerminalEntry)).toEqual([
      "./home-terminal/shell-background.css",
      "./home-terminal/top-strip.css",
      "./home-terminal/layout-player.css",
      "./home-terminal/entries.css",
      "./home-terminal/utility-footer-motion.css",
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
      "./modals/replay-mode-resume.css",
      "./modals/nested-profile.css",
      "./modals/character-opening.css",
      "./modals/phone.css",
      "./modals/terminal-system.css"
    ]);
    expect(modalsEntry).not.toContain(".modal-backdrop {");
    expect(modalsEntry).not.toContain(".resume-modal {");
    expect(modalsEntry).not.toContain(".character-detail {");
  });
});
