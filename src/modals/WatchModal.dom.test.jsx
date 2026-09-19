// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import WatchModal from "./WatchModal.jsx";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));

describe("WatchModal mode tabs", () => {
  beforeEach(() => {
    api.mockReset();
  });

  afterEach(cleanup);

  it("keeps labels free of counts and loads rooms when switching modes", async () => {
    api.mockResolvedValue({
      rooms: [],
      roomCounts: { spark: 2, standard: 1, gomoku: 3 }
    });

    render(
      <WatchModal
        token="token"
        characters={{}}
        onJoinRoom={() => {}}
        onClose={() => {}}
      />
    );

    await waitFor(() => expect(screen.getByRole("tab", { name: "星炬" })).toBeTruthy());
    expect(screen.getByRole("tab", { name: "标准" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "五子棋" })).toBeTruthy();
    expect(api).toHaveBeenCalledWith("/api/rooms/watch?mode=spark", { token: "token" });
    expect(document.querySelector(".watch-mode-count")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "标准", exact: true }));
    await waitFor(() => expect(api).toHaveBeenCalledWith("/api/rooms/watch?mode=standard", { token: "token" }));
    expect(screen.getByRole("tab", { name: "标准", exact: true }).getAttribute("aria-selected")).toBe("true");
  });
});
