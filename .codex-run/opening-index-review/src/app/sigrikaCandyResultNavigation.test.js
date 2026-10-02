import { describe, expect, it, vi } from "vitest";
import { exitSigrikaCandySpectatorResult } from "./sigrikaCandyResultNavigation.js";

describe("Sigrika candy spectator result navigation", () => {
  it("leaves the watched room and returns home without starting owner recovery", () => {
    const socket = { emit: vi.fn() };
    const closeResultModal = vi.fn();
    const setRoom = vi.fn();
    const setView = vi.fn();

    exitSigrikaCandySpectatorResult({
      roomCode: "SIG88",
      socket,
      closeResultModal,
      setRoom,
      setView
    });

    expect(socket.emit).toHaveBeenCalledWith("room:leave", { roomCode: "SIG88" });
    expect(closeResultModal).toHaveBeenCalledTimes(1);
    expect(setRoom).toHaveBeenCalledWith(null);
    expect(setView).toHaveBeenCalledWith("home");
  });
});
