import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { statusTextForWatchRoom, watchRoomRowKey, joinWatchRoomFromList } from "./WatchModal.jsx";
import WatchModal from "./WatchModal.jsx";
import { readCssWithImports } from "../styles/cssTestUtils.js";

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

  it("uses a bounded ledger with mobile score placards and an explicit type column", () => {
    const css = readCssWithImports(new URL("../styles/mobile-adaptive/watch-ledger.css", import.meta.url));
    const mobile = readCssWithImports(new URL("../styles/mobile-adaptive/watch-ledger-mobile.css", import.meta.url));
    expect(mobile).toContain("overflow-wrap: anywhere");
    expect(mobile).toContain(".room-move-placard");
    expect(css).toContain("var(--window-sticker-available-height)");
    expect(css).toContain(".wl-scroll { flex: 1; min-height: 0; overflow: auto;");
    const html = renderToStaticMarkup(createElement(WatchModal, { characters: {} }));
    expect(html).not.toContain('role="tab"');
    expect(html).not.toContain('window-bookmark-host');
    expect(html).toContain('aria-label="搜索房间或玩家"');
  });
});
