import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
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
});
