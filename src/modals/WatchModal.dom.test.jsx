// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import WatchModal from "./WatchModal.jsx";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));

describe("WatchModal room counts", () => {
  beforeEach(() => {
    api.mockReset();
  });

  afterEach(cleanup);

  it("shows all mode room counts from the selected-mode response", async () => {
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

    await waitFor(() => expect(screen.getByRole("tab", { name: "星炬，2 个房间" })).toBeTruthy());
    expect(screen.getByRole("tab", { name: "标准，1 个房间" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "五子棋，3 个房间" })).toBeTruthy();
    expect(api).toHaveBeenCalledWith("/api/rooms/watch?mode=spark", { token: "token" });
  });
});
