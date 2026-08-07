// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SIGRIKA_CANDY_DUEL } from "../shared/sigrikaCandyArc.js";
import { initialHomeEntryRandomState, nextHomeEntryRandomState, useBackgroundMusicTrack } from "./useBackgroundMusicTrack.js";

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

  it("forwards corrupted user and special-room state into the shared resolver", () => {
    const corruptedUser = { sigrikaCandyArc: { corrupted: true } };
    const { result, rerender } = renderHook(
      ({ room, user, view }) => useBackgroundMusicTrack({
        matchSuccess: false,
        musicTracks: undefined,
        resultModalOpen: false,
        room,
        user,
        view
      }),
      { initialProps: { room: null, user: corruptedUser, view: "home" } }
    );

    expect(result.current.id).toBe("sigrika-corruption-home");

    rerender({
      room: {
        matchSource: SIGRIKA_CANDY_DUEL.matchSource,
        game: { phase: "active" }
      },
      user: corruptedUser,
      view: "room"
    });

    expect(result.current.id).toBe("sigrika-corruption-duel");
  });
});
