import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function readCssWithImports(url, seen = new Set()) {
  const key = url.href;
  if (seen.has(key)) {
    return "";
  }
  seen.add(key);

  const css = normalizeCss(readFileSync(url, "utf8"));
  return css.replace(/@import\s+"([^"]+)";/g, (_match, importPath) => {
    return readCssWithImports(new URL(importPath, url), seen);
  });
}

function normalizeCss(css) {
  return css.replace(/\r\n/g, "\n");
}

function cssBlockForSelector(css, selector) {
  const start = css.indexOf(selector);
  if (start < 0) return "";
  const end = css.indexOf("}", start);
  return end < 0 ? "" : css.slice(start, end + 1);
}

const hudCss = readCssWithImports(new URL("./hud-components.css", import.meta.url));
const themeEntryCss = normalizeCss(readFileSync(new URL("./themes.css", import.meta.url), "utf8"));
const themesCss = [
  readCssWithImports(new URL("./themes.css", import.meta.url)),
].join("\n");
const stylesCss = normalizeCss(readFileSync(new URL("../styles.css", import.meta.url), "utf8"));

describe("component-level HUD refinements", () => {
  it("keeps the skill burst banner visible above theme overlays", () => {
    const modalsCss = readCssWithImports(new URL("./modals.css", import.meta.url));

    expect(modalsCss).toContain(".skill-burst {");
    expect(modalsCss).toContain("z-index: 120");
    expect(modalsCss).toContain("animation: skill-burst-card 2s ease-in-out forwards, skill-burst-color 1.2s linear infinite");
    expect(modalsCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(modalsCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .skill-burst");
    expect(modalsCss).toContain("animation: none !important");
    expect(modalsCss).toContain("opacity: 1 !important");
    expect(modalsCss).not.toContain("effect-low");
    expect(themesCss).not.toContain("effect-low");
  });

  it("loads after all existing responsive and modal styles", () => {
    expect(stylesCss).toContain('@import "./styles/hud-components.css";');
    expect(stylesCss.trim().endsWith('@import "./styles/themes.css";')).toBe(true);
    expect(themeEntryCss).toContain('@import "./themes/shared.css";');
    expect(themeEntryCss).toContain('@import "./themes/isolation.css";');
    expect(themeEntryCss).toContain('@import "./themes/theme-components.css";');
    expect(themeEntryCss).toContain('@import "./themes/bright-school.css";');
    expect(themeEntryCss).not.toContain('@import "./themes/current.css";');
    expect(themeEntryCss).not.toContain('@import "./themes/original.css";');
    expect(themeEntryCss).not.toContain(".app-shell.player-theme-enabled .result-badge");
    expect(stylesCss.indexOf('@import "./styles/mobile-modals.css";')).toBeLessThan(
      stylesCss.indexOf('@import "./styles/hud-components.css";')
    );
    expect(stylesCss.indexOf('@import "./styles/hud-components.css";')).toBeLessThan(
      stylesCss.indexOf('@import "./styles/themes.css";')
    );
    expect(themeEntryCss.indexOf('@import "./themes/shared.css";')).toBeLessThan(
      themeEntryCss.indexOf('@import "./themes/isolation.css";')
    );
    expect(themeEntryCss.indexOf('@import "./themes/isolation.css";')).toBeLessThan(
      themeEntryCss.indexOf('@import "./themes/theme-components.css";')
    );
    expect(themeEntryCss.indexOf('@import "./themes/theme-components.css";')).toBeLessThan(
      themeEntryCss.indexOf('@import "./themes/bright-school.css";')
    );
  });

  it("rewrites native scrollbars and input surfaces globally", () => {
    expect(hudCss).toContain("*::-webkit-scrollbar");
    expect(hudCss).toContain("width: 4px");
    expect(hudCss).toContain("*::-webkit-scrollbar-track");
    expect(hudCss).toContain("background: rgba(0, 0, 0, 0.3)");
    expect(hudCss).toContain("*::-webkit-scrollbar-thumb");
    expect(hudCss).toContain("background: var(--hud-cyan)");
    expect(hudCss).toContain("box-shadow: 0 0 8px var(--hud-cyan)");
    expect(hudCss).toContain("textarea");
    expect(hudCss).toContain(".message-board-modal textarea");
    expect(hudCss).toContain("background: var(--hud-bg-deep) !important");
    expect(hudCss).toContain("border: 1px solid rgba(0, 255, 190, 0.4) !important");
    expect(hudCss).toContain("outline: none !important");
    expect(hudCss).toContain("border-color: var(--hud-cyan) !important");
  });

  it("fixes contrast for settings, auth, lock, decoration, and owned surfaces", () => {
    expect(hudCss).toContain("html,\nbody");
    expect(hudCss).toContain(".app-shell");
    expect(hudCss).toContain("#03070a");
    expect(hudCss).toContain(".settings-modal-content");
    expect(hudCss).toContain(".about-panel-block");
    expect(hudCss).toContain(".settings-panel");
    expect(hudCss).toContain("background: rgba(6, 18, 26, 0.95) !important");
    expect(hudCss).toContain(".about-panel-block p");
    expect(hudCss).toContain("color: #00ffbe !important");
    expect(hudCss).toContain(".audio-slider-item");
    expect(hudCss).toContain(".login-card-container");
    expect(hudCss).toContain(".register-card-container");
    expect(hudCss).toContain("border: 2px solid #00ffbe !important");
    expect(hudCss).toContain(".login-submit-btn");
    expect(hudCss).toContain(".terminal-enter-btn");
    expect(hudCss).toContain("color: #030a10 !important");
    expect(hudCss).toContain(".lock-character-card");
    expect(hudCss).toContain(".character-card.locked");
    expect(hudCss).toContain("color: #ff4e64 !important");
    expect(hudCss).toContain(".decoration-applied-box");
    expect(hudCss).toContain(".store-owned-tag");
    expect(hudCss).not.toContain("[class*=");
  });

  it("adds the anime pop-tech palette, stickers, soft tabs, and character projection effects", () => {
    expect(hudCss).toContain("--hud-pink: #ff76a3");
    expect(hudCss).toContain("--hud-jelly-bg");
    expect(hudCss).toContain(".house-manual-entry.hologram-entry::before");
    expect(hudCss).not.toContain("content: attr(data-hud)");
    expect(hudCss).toContain("linear-gradient(var(--hud-pink) 0 0) left 10px top 20px");
    expect(hudCss).toContain(".match-image-entry.hologram-entry::before");
    expect(hudCss).toContain("poptech-star-twinkle");
    expect(hudCss).toContain(".match-image-entry.hologram-entry::after");
    expect(hudCss).toContain("background: transparent");
    expect(hudCss).toContain("box-shadow: none");
    expect(hudCss).toContain(".shop-tabs button.active::before");
    expect(hudCss).toContain("background: var(--hud-pink)");
    expect(hudCss).toContain("transform: scale(1.03)");
  });

  it("adds member handbook archive readability overrides", () => {
    expect(hudCss).toContain(".top-stats-bar .stat > span");
    expect(hudCss).toContain("font-size: 11px !important");
    expect(hudCss).toContain(".top-stats-bar .stat strong");
    expect(hudCss).toContain('font-family: "Chakra Petch", "Courier New", monospace !important');
    expect(hudCss).toContain("font-size: 22px !important");
    expect(hudCss).toContain("text-shadow: 0 0 8px rgba(0, 255, 190, 0.4)");
    expect(hudCss).toContain(".character-grid-container");
    expect(hudCss).toContain("border-right: none !important");
    expect(hudCss).toContain(".character-grid-container::-webkit-scrollbar");
    expect(hudCss).toContain("width: 3px");
    expect(hudCss).toContain(".decorations-section");
    expect(hudCss).toContain("background: rgba(5, 12, 19, 0.75) !important");
    expect(hudCss).toContain("border: 1px dashed rgba(0, 255, 190, 0.3) !important");
    expect(hudCss).toContain(".character-details-modal");
    expect(hudCss).toContain("background: rgba(4, 9, 14, 0.98) !important");
    expect(hudCss).toContain(".character-details-modal .skill-title-row strong");
    expect(hudCss).toContain(".character-details-modal .acquisition-method strong");
    expect(hudCss).toContain("font-weight: bold !important");
  });

  it("turns the home art entries into transparent hologram projections", () => {
    const entryBlock = hudCss.match(/\.home-image-entry\.hologram-entry,[\s\S]+?\.home-image-entry\.hologram-entry:focus-visible\s*\{[^}]+\}/)?.[0] ?? "";
    const platformBlock = hudCss.match(/\.home-image-entry\.hologram-entry::after\s*\{[^}]+\}/)?.[0] ?? "";

    expect(entryBlock).toContain("border: 0 !important");
    expect(entryBlock).toContain("background: transparent !important");
    expect(entryBlock).toContain("box-shadow: none !important");
    expect(entryBlock).toContain("clip-path: none");
    expect(platformBlock).toContain('content: ""');
    expect(platformBlock).toContain("height: 0");
    expect(platformBlock).toContain("background: transparent");
    expect(platformBlock).toContain("box-shadow: none");
    expect(platformBlock).toContain("transform: none");
  });

  it("upgrades character detail and sortie labels without JSX behavior changes", () => {
    expect(hudCss).toContain(".deploy-tag,");
    expect(hudCss).toContain(".character-card.portrait-card:not(.is-deployed):not(.locked)::after");
    expect(hudCss).toContain('content: "READY (');
    expect(hudCss).toContain("background: transparent !important");
    expect(hudCss).toContain("clip-path: polygon(7px 0, 100% 0, calc(100% - 7px) 100%, 0 100%)");
    expect(hudCss).toContain(".character-detail,");
    expect(hudCss).toContain("rgba(5, 15, 22, 0.95)");
    expect(hudCss).toContain(".character-detail .close-button::before");
    expect(hudCss).toContain(".character-detail .close-button::after");
    expect(hudCss).toContain("background: var(--hud-cyan)");
  });

  it("hardens shop, warehouse, and friends nested controls", () => {
    const ownedBadgeBlock = hudCss.match(/\.shop-item\.owned::before\s*\{[^}]+\}/)?.[0] ?? "";

    expect(hudCss).toContain(".shop-pagination button");
    expect(hudCss).toContain("border-radius: 0 !important");
    expect(hudCss).toContain("clip-path: none !important");
    expect(hudCss).toContain(".shop-pagination button.active::before");
    expect(hudCss).toContain("left top / 10px 2px no-repeat");
    expect(hudCss).toContain(".shop-item.owned::before");
    expect(ownedBadgeBlock).toContain("content:");
    expect(hudCss).toContain("transform: skewX(-15deg)");
    expect(hudCss).toContain(".warehouse-item,");
    expect(hudCss).toContain("rgba(5, 15, 22, 0.78) !important");
    expect(hudCss).toContain(".friend-action-row");
    expect(hudCss).toContain("background: rgba(10, 25, 30, 0.9) !important");
    expect(hudCss).toContain(".friend-action-row button");
    expect(hudCss).toContain("padding: 8px 16px");
    expect(hudCss).toContain("color: #ffffff !important");
  });

  it("loads the single Bright School player theme layer after HUD styles", () => {
    expect(stylesCss.trim().endsWith('@import "./styles/themes.css";')).toBe(true);
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school");
    expect(themesCss).not.toContain(".app-shell.player-theme-enabled.theme-current");
    expect(themesCss).not.toContain(".app-shell.player-theme-enabled.theme-original");
    expect(themesCss).toContain("--theme-bg: #fffbf2");
    expect(themesCss).toContain("clip-path: none !important");
    expect(themesCss).toContain("backdrop-filter: none !important");
  });

  it("provides a Bright School isolation layer for the single player skin", () => {
    expect(themesCss).toContain("Bright School isolation layer.");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school");
    expect(themesCss).toContain("--theme-isolation-bg");
    expect(themesCss).toContain(":where(\n  .auth-panel");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school :where(\n  .home-terminal-screen");
    expect(themesCss).toContain("content: none !important");
    expect(themesCss).toContain("clip-path: none !important");
    expect(themesCss).toContain("backdrop-filter: none !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school :where(\n  button");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school :where(\n  input:not([type=\"checkbox\"]):not([type=\"radio\"]):not([type=\"range\"]):not([type=\"color\"])");

    const isolationCss = readFileSync(new URL("./themes/isolation.css", import.meta.url), "utf8");
    expect(isolationCss).not.toContain("theme-original");
    expect(isolationCss).not.toContain("theme-current");
    expect(isolationCss).not.toContain("admin-theme-isolated");
    expect(isolationCss).not.toContain("\n.shop-item");
    expect(isolationCss).not.toContain("\n.player-info");
  });

  it("adds a scoped Bright School theme without leaking into other themes", () => {
    expect(themesCss).toContain("--theme-bg: #fffbf2");
    expect(themesCss).toContain("--theme-paper-grid");
    expect(themesCss).toContain("--theme-border: #4a3736");
    expect(themesCss).toContain("--theme-radius: 16px");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school .home-image-entry");
    expect(themesCss).toContain("border: 3px solid #4a3736 !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school .home-grid-featured > .home-utility-grid .utility-entry");
    expect(themesCss).toContain("transform: scale(1.05) translateY(-3px) !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school .player-info");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school .chat-box");
    expect(themesCss).toContain("background-size: 15px 15px !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school .character-grid-container");
    expect(themesCss).toContain("border-right: none !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school .decorations-section");
    expect(themesCss).toContain("border: 2px dashed #4a3736 !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school .character-details-modal");
    expect(themesCss).toContain("background: #ffffff !important");
    expect(themesCss).toContain("color: #ff9ebb !important");
  });

  it("adds a high-specificity Bright School contrast purge", () => {
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school");
    expect(themesCss).toContain("color: #3d2b25 !important");
    expect(themesCss).toContain("font-weight: bold !important");
    expect(themesCss).toContain("text-shadow: none !important");
    expect(themesCss).toContain("border: 3px solid #3d2b25 !important");
    expect(themesCss).toContain("box-shadow: 4px 4px 0 #3d2b25 !important");
    expect(themesCss).toContain("input::placeholder");
    expect(themesCss).toContain("background-color: #fff0f6 !important");
    expect(themesCss).toContain("border: 2px dashed #3d2b25 !important");
    expect(themesCss).toContain("border-right: none !important");
    expect(themesCss).toContain(".theme-bright-school.theme-bright-school .home-grid-featured > .home-utility-grid .utility-entry:nth-child(2n)");
    expect(themesCss).toContain("background: #ffffff !important");
    expect(themesCss).toContain(".theme-bright-school.theme-bright-school .settings-tabs button.active");
    expect(themesCss).toContain("background: #ff9ebb !important");
  });

  it("adds static-gallery parity polish for the Bright School theme", () => {
    expect(themesCss).toContain("/* Static gallery parity polish.");
    expect(themesCss).not.toContain(".app-shell.player-theme-enabled.theme-current:has(.home-screen)");
    expect(themesCss).not.toContain(".app-shell.player-theme-enabled.theme-original:has(.home-screen)");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school .home-image-entry");
    expect(themesCss).toContain("filter: drop-shadow(0 14px 20px rgba(61, 43, 37, 0.22)) !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .home-image-entry:hover");
    expect(themesCss).toContain("background-size: 15px 15px !important");
  });

  it("keeps the Bright School surface contracts scoped against tech-HUD bleed-through", () => {
    expect(themesCss).toContain("Bright School semantic surface contracts.");
    expect(themesCss).toContain("Bright School final explicit anti-bleed contract.");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school .home-top-strip .icon-button");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school .utility-entry > *");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school .board-stage::before");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school .player-info::before");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school .action-bar button::before");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school:has(.home-screen)::before");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .small-modal::before");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .home-image-entry::before");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .skill-chip::after");
    expect(themesCss).not.toContain('[class*="panel"]');
    expect(themesCss).not.toContain('[class*="card"]');
    expect(themesCss).not.toContain('[class*="item"]');
    expect(themesCss).not.toContain('[class*="row"]');
    expect(themesCss).not.toContain('[class*="dock"]');
    expect(themesCss).toContain("content: none !important");
    expect(themesCss).toContain("backdrop-filter: none !important");
    expect(themesCss).toContain("transform: none !important");
    expect(themesCss).toContain("clip-path: none !important");
    expect(themesCss).toContain("--bright-shadow: 4px 4px 0 #3d2b25");
    expect(themesCss).toContain("box-shadow: 3px 3px 0px #4a3736 !important");

    const finalSurfaceContract = themesCss.slice(
      themesCss.indexOf("Bright School final explicit anti-bleed contract.")
    );
    expect(finalSurfaceContract).not.toContain("theme-current");
    expect(finalSurfaceContract).not.toContain("theme-original");
    expect(finalSurfaceContract).not.toContain("\n.shop-item");
    expect(finalSurfaceContract).not.toContain("\n.player-info");
  });

  it("restores Bright School component details after the surface contracts", () => {
    expect(themesCss).toContain("Bright School component repair layer.");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-sidebar");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-mascot-bubble");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-mascot-slot img");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school *::-webkit-scrollbar-thumb");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-item > img");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-category-decoration .stone-decoration-preview");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .warehouse-character-grid");
    expect(themesCss).toContain("grid-template-columns: repeat(5, minmax(0, 1fr)) !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .profile-resume-hero");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .character-detail-art img");
    expect(themesCss).toContain("filter: drop-shadow(16px 18px 0 rgba(31, 22, 18, 0.32)) !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .point:not(.black):not(.white):not(.erased)::after");
    expect(themesCss).toContain("background: rgba(222, 234, 202, 0.84) !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .skill-chip");
    expect(themesCss).toContain("background: linear-gradient(135deg, #ffe0ec, #d9f1eb 48%, #fff6dd) !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .room-code-label");
  });

  it("keeps the Bright School shop modal centered and free from tactical bleed-through", () => {
    expect(themesCss).toContain("Bright School shop modal polish layer.");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-wallet-wrap");
    expect(themesCss).toContain("background: linear-gradient(135deg, #fff8c7, #f6cf6a 42%, #d89b2b 100%) !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-mascot-slot img");
    expect(themesCss).toContain("background: transparent !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-content.shop-category-decoration::after");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-item-empty");
    expect(themesCss).toContain("linear-gradient(135deg, rgba(245, 241, 234, 0.98), rgba(224, 218, 210, 0.98)) !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-category-character.shop-item > img");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-category-decoration.shop-item .stone-decoration-preview");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-item-detail-modal");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-detail-stats div");
    expect(themesCss).toContain("grid-template-rows: clamp(92px, 12vw, 124px) minmax(28px, auto) 1fr 42px !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-detail-stats .shop-detail-status-owned");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-item .primary-action.shop-action-owned");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-item .primary-action.shop-action-sold-out");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-category-decoration.shop-item .stone-decoration-preview span");
    expect(themesCss).toContain("min-height: 132px !important");
  });

  it("keeps Bright School lobby labels and avatar mounts readable", () => {
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .home-image-entry::before");
    expect(themesCss).not.toContain("content: attr(data-hud) !important");
    expect(themesCss).toContain('content: "" !important');
    expect(themesCss).toContain("pointer-events: none !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .match-image-entry::before");
    expect(themesCss).not.toContain('content: "匹配对局" !important');
    expect(themesCss).not.toContain('content: "\u9356\u5f52\u53a4\u7035\u7470\u772c" !important');
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .home-image-entry:active");
    expect(themesCss).toContain("transform: translateY(1px) scale(0.985) !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .home-brand-title");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .home-player-plaque .plaque-avatar");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .home-player-plaque .plaque-avatar img");
    expect(themesCss).toContain("background: transparent !important");
    expect(themesCss).toContain("border: 0 !important");
  });

  it("unifies Bright School cute typography and repairs warehouse/profile text blocks", () => {
    expect(themesCss).toContain("Bright School cute typography and warehouse/profile repair layer.");
    expect(themesCss).toContain('"Microsoft YaHei UI", "Microsoft YaHei", system-ui, sans-serif !important');
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .profile-resume-stats > span");
    expect(themesCss).toContain("clip-path: none !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .warehouse-header .quiet-text");
    expect(themesCss).toContain("background: transparent !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .warehouse-item strong");
    expect(themesCss).toContain("background: linear-gradient(135deg, #ffdfeb, #fff8e5) !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .warehouse-item span");
    expect(themesCss).toContain("position: absolute !important");
    expect(themesCss).toContain("left: 18px !important");
    expect(themesCss).toContain("bottom: 14px !important");
  });

  it("cleans up Bright School handbook roster and decoration controls", () => {
    expect(themesCss).toContain("Bright School handbook decoration and roster cleanup layer.");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .character-card.locked");
    expect(themesCss).toContain("background: linear-gradient(135deg, #eee9e2, #ddd7cf) !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .character-card.locked .sortie-button");
    expect(themesCss).toContain("display: none !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .deploy-tag");
    expect(themesCss).toContain("background: #dff5df !important");
    expect(themesCss).toContain("color: #235534 !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .owned-decoration-header");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .decoration-reset-action");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .owned-decoration-chip.selected");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .owned-decoration-chip .stone-decoration-preview span");
  });

  it("keeps Bright School final handbook/settings/lobby cleanup scoped", () => {
    const finalCleanupStart = themesCss.indexOf("Bright School final surface cleanup");
    const selectedActionsStart = themesCss.indexOf(
      ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .mode-tabs button.active",
      finalCleanupStart
    );
    const finalCleanup = themesCss.slice(finalCleanupStart, selectedActionsStart);

    expect(themesCss).toContain("Bright School final surface cleanup for handbook/settings/lobby comments.");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .owned-decoration-list::after");
    expect(themesCss).toContain("border: 0 !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .decoration-reset-action svg");
    expect(themesCss).toContain("width: 16px !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .settings-modal .settings-panel.settings-modal-content");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .match-portrait");
    expect(themesCss).toContain("drop-shadow(8px 10px 0 rgba(61, 43, 37, 0.2))");
    expect(finalCleanup).not.toContain(".home-player-plaque.tactical-id-card");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .leaderboard-header .quiet-text");

    expect(finalCleanup).not.toContain("theme-current");
    expect(finalCleanup).not.toContain("theme-original");
    expect(finalCleanup).not.toContain("admin-theme-isolated");
  });

  it("uses the Bright School generated student ID plaque shell instead of legacy paperclips", () => {
    const plaquePolish = themesCss.slice(themesCss.indexOf("Bright School lobby material polish for browser comments."));
    const rowClipBlocks = plaquePolish.match(/\.home-player-row\.tactical-id-row::before,[\s\S]+?\.home-player-row\.tactical-id-row::after\s*\{[^}]+\}/g) ?? [];
    const rowClipBlock = rowClipBlocks[rowClipBlocks.length - 1] ?? "";
    const plaqueBlock = cssBlockForSelector(
      plaquePolish,
      ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .home-player-plaque.tactical-id-card"
    );

    expect(plaquePolish).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .home-player-zone::before");
    expect(plaquePolish).toContain("content: none !important");
    expect(plaquePolish).toContain("display: none !important");
    expect(plaquePolish).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .home-player-row.tactical-id-row::before");
    expect(rowClipBlock).toContain("content: none !important");
    expect(rowClipBlock).toContain("display: none !important");
    expect(rowClipBlock).not.toContain("border-bottom-color: transparent !important");
    expect(rowClipBlock).not.toContain("inset 0 0 0 3px #d7e1e6");
    expect(plaqueBlock).toContain("--home-plaque-name-column-min: calc(12ch + 1.2em)");
    expect(plaqueBlock).toContain('url("/assets/home/student-id-nameplate.webp")');
    expect(plaqueBlock).toContain('url("/assets/home/student-id-nameplate.png")');
    expect(plaqueBlock).toContain("appearance: none !important");
    expect(plaqueBlock).toContain("background-color: transparent !important");
    expect(plaqueBlock).toContain("border: 0 !important");
    expect(plaqueBlock).toContain("border-radius: 0 !important");
    expect(plaqueBlock).toContain("box-shadow: none !important");
    expect(plaqueBlock).toContain("grid-template-columns: 72px minmax(0, 1fr) minmax(108px, 116px) !important");
    expect(plaqueBlock).toContain("column-gap: 10px !important");
    expect(plaqueBlock).toContain("overflow: hidden !important");
    expect(plaquePolish).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .home-player-plaque.tactical-id-card > strong");
    expect(plaquePolish).toContain("overflow: hidden !important");
    expect(plaquePolish).toContain("padding-right: 6px !important");
    expect(plaquePolish).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .home-player-plaque.tactical-id-card .user-identity-name");
    expect(plaquePolish).toContain("--user-nameplate-scale: 1.12");
    expect(plaquePolish).toContain("width: 100% !important");
    expect(plaquePolish).toContain("min-width: 0 !important");
    expect(plaquePolish).toContain("overflow: hidden !important");
    expect(plaquePolish).toContain("flex: 1 1 auto !important");
    expect(plaquePolish).toContain("width: var(--user-nameplate-width) !important");
    expect(plaquePolish).not.toContain("user-identity-fit-font-size");
    expect(plaquePolish).toContain("text-overflow: clip !important");
    expect(plaquePolish).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .house-manual-entry.hologram-entry::before");
    expect(plaquePolish).toContain('content: "" !important');
  });

  it("keeps Bright School stage content transparent and preserves match motion", () => {
    const stageCleanup = themesCss.slice(themesCss.indexOf("Bright School targeted fixes for stage content transparency"));

    expect(themesCss).toContain("Bright School targeted fixes for stage content transparency and decoration wrappers.");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .home-main-panel.home-terminal-main::before");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .home-main-panel .home-stage");
    expect(themesCss).toContain('--home-main-panel-bg: url("/assets/home/home-main-panel-desktop.webp")');
    expect(themesCss).toContain('--home-main-panel-bg: url("/assets/home/home-main-panel-mobile.webp")');
    expect(themesCss).toContain("background-size: 100% 100% !important");
    expect(stageCleanup).not.toContain(".home-main-panel.home-terminal-main,\n");
    expect(themesCss).toContain("background-color: transparent !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .house-modal > .owned-decoration-section.decoration-applied-box > .owned-decoration-list");
    expect(themesCss).toContain("border-style: none !important");
    expect(themesCss).toContain("border-bottom: 0 !important");
    expect(themesCss).toContain("animation: match-hop 0.9s ease-in-out infinite !important");
    expect(themesCss).toContain("will-change: transform !important");
  });

  it("keeps Bright School room player labels and board coordinates clean", () => {
    expect(themesCss).toContain("Bright School room replay/battle readability fixes.");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .player-info .name-button");
    expect(themesCss).toContain("text-decoration: underline !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .room-info-tag.black-side");
    expect(themesCss).toContain("background: #1f1714 !important");
    expect(themesCss).toContain("color: #ffffff !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .room-info-tag.white-side");
    expect(themesCss).toContain("background: #ffffff !important");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .board-wrap .coord-row");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .board-wrap .coord-col::after");
    expect(themesCss).toContain("background-color: transparent !important");
  });

  it("loads shared user identity cosmetics for username surfaces", () => {
    expect(hudCss).toContain(".user-identity.has-nameplate");
    expect(hudCss).toContain("--user-nameplate-base-width: 96px");
    expect(hudCss).toContain("--user-nameplate-base-height: 25.6px");
    expect(hudCss).toContain("--user-nameplate-width: calc(var(--user-nameplate-base-width) * var(--user-nameplate-scale))");
    expect(hudCss).toContain("--user-nameplate-height: calc(var(--user-nameplate-base-height) * var(--user-nameplate-scale))");
    expect(hudCss).toContain("--user-identity-name-tag-padding-x: 0.72em");
    expect(hudCss).toContain("--user-identity-name-tag-radius: 0");
    expect(hudCss).toContain("width: auto");
    expect(hudCss).toContain("max-width: var(--user-identity-name-tag-max-width)");
    expect(hudCss).toContain("box-sizing: content-box");
    expect(hudCss).toContain("border: 0");
    expect(hudCss).toContain("border-radius: var(--user-identity-name-tag-radius)");
    expect(hudCss).toContain("line-height: 1.22");
    expect(hudCss).toContain("background-color: transparent");
    expect(hudCss).toContain("background-image: none");
    expect(hudCss).toContain("box-shadow: none");
    expect(hudCss).toContain("background-position: left center");
    expect(hudCss).toContain("background-size: 100% 100%");
    expect(hudCss).toContain(".user-identity-name-tag");
    expect(hudCss).toContain(".user-identity.has-nameplate .user-identity-name-tag");
    expect(hudCss).toContain("width: var(--user-nameplate-width)");
    expect(hudCss).toContain("height: var(--user-nameplate-height)");
    expect(hudCss).toContain("--user-nameplate-font-size: calc(15px * var(--user-nameplate-scale))");
    expect(hudCss).toContain(".user-identity.has-nameplate .user-identity-name {\n  font-size: var(--user-nameplate-font-size)");
    expect(hudCss).toContain(".leaderboard-player .user-identity {\n  justify-self: center");
    expect(hudCss).toContain(".leaderboard-player .user-identity-main {\n  justify-content: center");
    expect(hudCss).toContain(".leaderboard-player .user-identity-name-tag");
    expect(hudCss).toContain("@media (max-width: 768px)");
    expect(hudCss).toContain("--user-nameplate-scale: 0.92");
    expect(hudCss).toContain("--user-identity-name-tag-padding-x: 0.52em");
    expect(hudCss).toContain(".user-identity.compact.has-nameplate");
    expect(hudCss).toContain("--user-nameplate-scale: 0.8");
    expect(hudCss).toContain("--user-identity-name-tag-max-width: 8em");
    expect(hudCss).toContain("--user-identity-name-tag-padding-x: 0.46em");
    expect(hudCss).toContain(".mobile-room-screen .name-button .user-identity.has-nameplate");
    expect(hudCss).toContain("--user-nameplate-scale: 0.76");
    expect(hudCss).toContain(".name-button .user-identity:not(.has-nameplate)");
    expect(hudCss).toContain(".user-identity-emblem");
    expect(hudCss).toContain(".leaderboard-player .user-identity");
    expect(hudCss).toContain(".friend-main .user-identity");
  });

  it("keeps the Bright School lobby stage free of solid fills behind the image panel", () => {
    expect(themesCss).toContain("Bright School lobby canvas background purge.");
    expect(themesCss).toContain(
      ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school main.home-screen.home-terminal-screen > section.home-main-panel.home-terminal-main",
    );
    expect(themesCss).toContain(
      ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school main.home-screen.home-terminal-screen > section.home-main-panel.home-terminal-main > section.home-grid-featured.home-stage",
    );

    const lobbyCanvasPurge = themesCss.slice(themesCss.indexOf("Bright School lobby canvas background purge."));
    expect(lobbyCanvasPurge).toContain("background: transparent !important");
    expect(lobbyCanvasPurge).toContain("background-image: none !important");
    expect(themesCss).toContain('background-image: var(--home-main-panel-bg) !important');
    expect(lobbyCanvasPurge).not.toContain("theme-current");
    expect(lobbyCanvasPurge).not.toContain("theme-original");
    expect(lobbyCanvasPurge).not.toContain("admin-theme-isolated");
  });

  it("adds a Bright School UI/UX audit guard for clarity, overflow, and future skins", () => {
    expect(themesCss).toContain("Bright School UI/UX Pro Max audit layer.");
    expect(themesCss).toContain("box-sizing: border-box !important");
    expect(themesCss).toContain("-webkit-font-smoothing: antialiased !important");
    expect(themesCss).toContain("text-rendering: optimizeLegibility !important");
    expect(themesCss).toContain("overflow-x: clip !important");
    expect(themesCss).toContain("@supports not (overflow: clip)");
    expect(themesCss).toContain("touch-action: manipulation !important");
    expect(themesCss).toContain("min-height: 44px !important");
    expect(themesCss).toContain("outline: 3px solid #ff9ebb !important");
    expect(themesCss).toContain("scrollbar-gutter: stable both-edges !important");
    expect(themesCss).toContain("font-variant-numeric: tabular-nums !important");
    expect(themesCss).toContain("grid-template-columns: minmax(170px, 220px) minmax(0, 1fr) !important");
    expect(themesCss).toContain("grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important");
    expect(themesCss).toContain("width: min(var(--board-size), 92vw) !important");
    expect(themesCss).toContain("background: #ffdfeb !important");
    expect(themesCss).toContain("@media (max-width: 800px)");

    const auditLayer = themesCss.slice(themesCss.indexOf("Bright School UI/UX Pro Max audit layer."));
    expect(auditLayer).not.toContain("theme-current");
    expect(auditLayer).not.toContain("theme-original");
    expect(auditLayer).not.toContain("admin-theme-isolated");
    expect(auditLayer).not.toContain("\n.shop-item");
    expect(auditLayer).not.toContain("\n.player-info");
  });

  it("adds a calmer Bright School visual refinement pass", () => {
    const imageEntryButtonsLayer = themesCss.slice(themesCss.indexOf("Bright School image-only home entry button feedback."));

    expect(themesCss).toContain("Bright School visual refinement layer.");
    expect(themesCss).toContain("--bright-shadow-soft: 4px 5px 0 rgba(61, 43, 37, 0.82)");
    expect(themesCss).toContain("--bright-shadow-lift: 7px 8px 0 rgba(61, 43, 37, 0.86), 0 14px 28px rgba(255, 158, 187, 0.2)");
    expect(themesCss).toContain("background: var(--bright-pink) !important");
    expect(themesCss).toContain("color: var(--bright-ink) !important");
    expect(themesCss).toContain("background-image: none !important");
    expect(themesCss).toContain("scrollbar-width: none !important");
    expect(themesCss).toContain("::-webkit-scrollbar");
    expect(themesCss).toContain("display: none !important");
    expect(themesCss).toContain("filter: drop-shadow(8px 10px 0 rgba(61, 43, 37, 0.16)) !important");
    expect(imageEntryButtonsLayer).not.toContain("drop-shadow(0 10px");
    expect(imageEntryButtonsLayer).not.toContain("drop-shadow(0 14px");
    expect(imageEntryButtonsLayer).toContain("transform: rotate(2deg) !important");
    expect(imageEntryButtonsLayer).toContain("background: transparent !important");
    expect(themesCss).toContain("transition:\n    transform 160ms ease-out");
    expect(themesCss).toContain("transform: translateY(-2px) scale(1.02) !important");
    expect(themesCss).toContain("transform: translateY(1px) scale(0.98) !important");
    expect(themesCss).toContain("Bright School selected control press depth.");
    expect(themesCss).toContain("Bright School skill targeting repair.");
    expect(themesCss).toContain(".mode-tabs button[aria-selected=\"true\"]");
    expect(themesCss).toContain(".achievement-tabs button[aria-selected=\"true\"]");
    expect(themesCss).toContain(".shop-tabs button.active:not(:disabled)");
    expect(themesCss).toContain(".friends-tabs button.active:not(:disabled)");
    expect(themesCss).toContain(".mobile-tab-button.active");
    expect(themesCss).toContain("transform: translateY(4px) scale(0.97) !important");
    expect(themesCss).toContain("inset 3px 3px 0 rgba(61, 43, 37, 0.24)");
    expect(themesCss).toContain("#edf0d7");
    expect(themesCss).toContain("@media (prefers-reduced-motion: reduce)");

    const visualRefinement = themesCss.slice(themesCss.indexOf("Bright School visual refinement layer."));
    expect(visualRefinement).not.toContain("theme-current");
    expect(visualRefinement).not.toContain("theme-original");
    expect(visualRefinement).not.toContain("admin-theme-isolated");
  });
});
