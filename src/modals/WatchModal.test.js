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

  it("keeps watch list headers and rows on the same mobile columns", () => {
    const css = readFileSync(new URL("../styles/mobile-modals.css", import.meta.url), "utf8");
    const phoneModalMedia = mediaBlock(css, "@media (max-width: 560px)");

    expect(phoneModalMedia).toContain("--watch-room-grid-columns");
    expect(phoneModalMedia).toContain(".watch-room-head");
    expect(phoneModalMedia).toContain("padding: 0 8px");
    expect(phoneModalMedia).toContain(".watch-room-head,");
    expect(phoneModalMedia).toContain(".watch-room-row");
    expect(phoneModalMedia).toContain("display: grid");
    expect(phoneModalMedia).toContain(".small-modal .watch-room-row");
    expect(phoneModalMedia).toContain("grid-template-columns: var(--watch-room-grid-columns)");
    expect(phoneModalMedia).toContain(".watch-player-cell");
    expect(phoneModalMedia).toContain("min-width: 0");
    expect(phoneModalMedia).toContain("justify-self: stretch");
    expect(phoneModalMedia).toContain("justify-content: center");
  });
});

function mediaBlock(css, marker) {
  const start = css.indexOf(marker);
  if (start < 0) return "";
  const next = css.indexOf("\n@media", start + 1);
  return css.slice(start, next >= 0 ? next : undefined);
}
