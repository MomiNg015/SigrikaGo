import { describe, expect, it, vi } from "vitest";
import { initialHomeEntryRandomState, nextHomeEntryRandomState } from "./useBackgroundMusicTrack.js";

describe("background music track hook helpers", () => {
  it("keeps a home entry random value stable until the user leaves home", () => {
    const createRandom = vi.fn()
      .mockReturnValueOnce(0.25)
      .mockReturnValueOnce(0.75);

    const firstHome = nextHomeEntryRandomState(initialHomeEntryRandomState(), "home", createRandom);
    const sameHome = nextHomeEntryRandomState(firstHome, "home", createRandom);
    const room = nextHomeEntryRandomState(sameHome, "room", createRandom);
    const secondHome = nextHomeEntryRandomState(room, "home", createRandom);

    expect(firstHome.random).toBe(0.25);
    expect(sameHome).toBe(firstHome);
    expect(room).toEqual({ view: "room", random: null });
    expect(secondHome.random).toBe(0.75);
    expect(createRandom).toHaveBeenCalledTimes(2);
  });
});
