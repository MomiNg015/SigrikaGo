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
    const css = readFileSync(new URL("../styles/mobile-modals.css", import.meta.url), "utf8");
    const adaptiveCss = readFileSync(new URL("../styles/mobile-adaptive.css", import.meta.url), "utf8");
    const brightSchoolMobileCss = readFileSync(new URL("../styles/themes/bright-school/mobile.css", import.meta.url), "utf8");
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
});

function mediaBlock(css, marker) {
  const start = css.indexOf(marker);
  if (start < 0) return "";
  const next = css.indexOf("\n@media", start + 1);
  return css.slice(start, next >= 0 ? next : undefined);
}
