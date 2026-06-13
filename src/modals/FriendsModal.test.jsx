import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import FriendsModal from "./FriendsModal.jsx";

describe("FriendsModal mobile layout", () => {
  it("renders an explicit close button in the main friends sheet", () => {
    const html = renderToStaticMarkup(createElement(FriendsModal, {
      token: "token",
      socket: null,
      characters: {},
      onNotice: () => {},
      onClose: () => {},
      onOpenReplay: () => {}
    }));

    expect(html).toContain("friends-modal-close");
    expect(html).toContain("aria-label=\"关闭好友窗口\"");
  });

  it("uses compact mobile friend cards instead of a horizontally scrolling table", () => {
    const css = readCssWithImports(new URL("../styles/mobile-modals.css", import.meta.url));
    const adaptiveCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));
    const brightSchoolMobileCss = readCssWithImports(new URL("../styles/themes/bright-school/mobile.css", import.meta.url));
    const phoneModalMedia = mediaBlock(css, "@media (max-width: 560px)");
    const adaptivePhoneMedia = mediaBlock(adaptiveCss, "@media (max-width: 768px)");

    expect(phoneModalMedia).toContain(".friends-list-heading");
    expect(phoneModalMedia).toContain("display: none");
    expect(phoneModalMedia).toContain(".friends-row");
    expect(phoneModalMedia).toContain("grid-template-areas:");
    expect(phoneModalMedia).toContain("\"status avatar info action\"");
    expect(phoneModalMedia).toContain(".friends-row > .friend-main");
    expect(phoneModalMedia).toContain("align-content: center");
    expect(phoneModalMedia).toContain("justify-items: center");
    expect(phoneModalMedia).toContain(".friends-row .friend-stats");
    expect(phoneModalMedia).toContain(".friends-list .quiet-text");
    expect(phoneModalMedia).toContain("width: 100%");
    expect(phoneModalMedia).not.toContain(".friends-row,\n  .friend-action-row {\n    min-width: 560px;");
    expect(adaptivePhoneMedia).toContain(".friends-list");
    expect(adaptivePhoneMedia).toContain("overflow-x: hidden");
    expect(adaptivePhoneMedia).toContain(".friends-row");
    expect(adaptivePhoneMedia).toContain("min-width: 0");
    expect(adaptivePhoneMedia).toContain("grid-template-areas:");
    expect(adaptivePhoneMedia).toContain("\"status avatar info action\"");
    expect(brightSchoolMobileCss).toContain(".friends-list,\n  .app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .watch-room-table {\n    overflow-x: hidden !important;");
    expect(brightSchoolMobileCss).toContain(".friends-row,\n  .app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .friend-action-row,\n  .app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .watch-room-row {\n    min-width: 0 !important;");
  });

  it("keeps desktop friend search clear of the close button", () => {
    const commerceCss = readCssWithImports(new URL("../styles/commerce-settings.css", import.meta.url));
    const brightSchoolRepairCss = readCssWithImports(new URL("../styles/themes/bright-school/component-repairs.css", import.meta.url));
    const desktopCommerceBlock = mediaBlock(commerceCss, "@media (min-width: 769px)");
    const desktopBrightSchoolBlock = mediaBlock(brightSchoolRepairCss, "@media (min-width: 769px)");

    expect(desktopCommerceBlock).toContain(".friends-modal-toolbar");
    expect(desktopCommerceBlock).toContain("padding-right: 64px");
    expect(desktopBrightSchoolBlock).toContain(".friends-modal .friends-modal-toolbar");
    expect(desktopBrightSchoolBlock).toContain("padding-right: 68px !important");
  });
});

function mediaBlock(css, marker) {
  const blocks = [];
  let start = css.indexOf(marker);
  while (start >= 0) {
    const next = css.indexOf("\n@media", start + 1);
    blocks.push(css.slice(start, next >= 0 ? next : undefined));
    start = css.indexOf(marker, start + marker.length);
  }
  return blocks.join("\n");
}

function readText(url) {
  return readFileSync(url, "utf8").replace(/\r\n/g, "\n");
}

function readCssWithImports(url, seen = new Set()) {
  const key = url.href;
  if (seen.has(key)) return "";
  seen.add(key);

  const css = readText(url);
  return css.replace(/@import\s+"([^"]+)";/g, (_match, importPath) => {
    return readCssWithImports(new URL(importPath, url), seen);
  });
}
