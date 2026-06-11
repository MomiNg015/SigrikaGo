import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { statusTextForWatchRoom, watchRoomRowKey, joinWatchRoomFromList } from "./WatchModal.jsx";
import WatchModal from "./WatchModal.jsx";

describe("WatchModal helpers", () => {
  it("labels the watch modal as the match list", () => {
    const html = renderToStaticMarkup(createElement(WatchModal, {
      token: "token",
      characters: {},
      onJoinRoom: () => {},
      onClose: () => {}
    }));

    expect(html).toContain("对局列表");
    expect(html).not.toContain("<h2>观战</h2>");
  });

  it("formats room statuses for the watch list", () => {
    expect(statusTextForWatchRoom({ status: "playing" })).toBe("对局中");
    expect(statusTextForWatchRoom({ status: "finished" })).toBe("已结束");
  });

  it("uses room code as the row key", () => {
    expect(watchRoomRowKey({ code: "12345" })).toBe("12345");
  });

  it("joins the selected room and closes the modal", () => {
    const emitJoin = vi.fn();
    const onClose = vi.fn();

    joinWatchRoomFromList({ code: "67890" }, { emitJoin, onClose });

    expect(emitJoin).toHaveBeenCalledWith("67890");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("uses compact mobile watch cards instead of a horizontally scrolling table", () => {
    const css = readText(new URL("../styles/mobile-modals.css", import.meta.url));
    const adaptiveCss = readText(new URL("../styles/mobile-adaptive.css", import.meta.url));
    const brightSchoolMobileCss = readText(new URL("../styles/themes/bright-school/mobile.css", import.meta.url));
    const phoneModalMedia = mediaBlock(css, "@media (max-width: 560px)");
    const adaptivePhoneMedia = mediaBlock(adaptiveCss, "@media (max-width: 768px)");

    expect(phoneModalMedia).toContain(".watch-room-table");
    expect(phoneModalMedia).toContain("overflow-x: hidden");
    expect(phoneModalMedia).toContain(".watch-room-head");
    expect(phoneModalMedia).toContain("display: none");
    expect(phoneModalMedia).toContain(".watch-room-row");
    expect(phoneModalMedia).toContain("grid-template-areas:");
    expect(phoneModalMedia).toContain("\"code status\"");
    expect(phoneModalMedia).toContain("\"black white\"");
    expect(phoneModalMedia).not.toContain("\"black black\"");
    expect(phoneModalMedia).not.toContain("min-width: 680px");
    expect(phoneModalMedia).not.toContain("--watch-room-grid-columns");
    expect(phoneModalMedia).toContain(".watch-list-modal .inline-close");
    expect(phoneModalMedia).toContain("position: static");
    expect(adaptivePhoneMedia).toContain(".watch-room-table");
    expect(adaptivePhoneMedia).toContain("overflow-x: hidden");
    expect(adaptivePhoneMedia).toContain(".watch-room-row");
    expect(adaptivePhoneMedia).toContain("min-width: 0");
    expect(brightSchoolMobileCss).toContain(".watch-room-table {\n    overflow-x: hidden !important;");
    expect(brightSchoolMobileCss).toContain(".watch-room-row {\n    min-width: 0 !important;");
  });

  it("keeps watch mode tabs compact above the room table", () => {
    const css = readText(new URL("../styles/lobby.css", import.meta.url));

    expect(css).toContain("grid-template-rows: auto auto minmax(318px, 1fr) auto auto;");
    expect(css).toContain(".watch-list-modal .mode-tabs");
    expect(css).toContain("grid-template-columns: repeat(2, max-content);");
    expect(css).toContain("min-height: 44px;");
    expect(css).toContain("grid-template-rows: auto auto minmax(220px, 1fr) auto auto;");
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(css).toContain("min-height: 40px;");
  });

  it("keeps watch list headers and rows on the same mobile columns", () => {
    const css = readText(new URL("../styles/mobile-modals.css", import.meta.url));
    const phoneModalMedia = mediaBlock(css, "@media (max-width: 560px)");

    expect(phoneModalMedia).toContain("padding: 0 8px");
    expect(phoneModalMedia).toContain(".watch-room-row");
    expect(phoneModalMedia).toContain("display: grid");
    expect(phoneModalMedia).toContain(".small-modal .watch-room-row");
    expect(phoneModalMedia).toContain("grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)");
    expect(phoneModalMedia).toContain(".watch-player-cell");
    expect(phoneModalMedia).toContain("min-width: 0");
    expect(phoneModalMedia).toContain("justify-self: stretch");
    expect(phoneModalMedia).toContain("justify-content: center");
    expect(phoneModalMedia).toContain(".watch-list-modal .inline-close");
    expect(phoneModalMedia).toContain("position: static");
  });
});

function mediaBlock(css, marker) {
  const start = css.indexOf(marker);
  if (start < 0) return "";
  const next = css.indexOf("\n@media", start + 1);
  return css.slice(start, next >= 0 ? next : undefined);
}

function readText(url) {
  return readFileSync(url, "utf8").replace(/\r\n/g, "\n");
}
