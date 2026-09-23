// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SIGRIKA_CANDY_DUEL } from "../shared/sigrikaCandyArc.js";
import { initialHomeEntryRandomState, nextHomeEntryRandomState, useBackgroundMusicTrack } from "./useBackgroundMusicTrack.js";

describe("background music track hook helpers", () => {
  it("keeps the last skill music through team handoffs until a new skill occurs", () => {
    const lineup = ["sigrika", "aemeath", "nabomo"].map((characterId) => ({ characterId }));
    const history = [{ type: "skill", color: "black" }];
    const props = (round, phase = "playing") => ({
      view: "room", user: {}, resultModalOpen: false,
      room: { code: "team", mode: "team", team: { round }, players: [{ color: "black", characterId: lineup[round - 1].characterId, teamLineup: lineup }], game: { phase, history: [...history] } }
    });
    const { result, rerender } = renderHook(useBackgroundMusicTrack, { initialProps: props(1) });
    const before = result.current;
    expect(before).toBeTruthy();
    history.push({ type: "team-round", round: 2 });
    rerender(props(2, "opening"));
    expect(result.current).toEqual(before);
    rerender(props(2));
    expect(result.current).toEqual(before);
    history.push({ type: "team-round", round: 3 });
    rerender(props(3, "opening"));
    expect(result.current).toEqual(before);
    history.push({ type: "skill", color: "black" });
    rerender(props(3));
    expect(result.current.id).not.toBe(before.id);
    const resumed = renderHook(useBackgroundMusicTrack, { initialProps: props(3) });
    expect(resumed.result.current).toEqual(result.current);
    rerender(props(3, "finished"));
    expect(result.current).toBeNull();
  });

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
        sigrikaCandyDuel: { musicStarted: false },
        game: { phase: "active" }
      },
      user: corruptedUser,
      view: "room"
    });

    expect(result.current).toBeNull();

    rerender({
      room: {
        matchSource: SIGRIKA_CANDY_DUEL.matchSource,
        sigrikaCandyDuel: { musicStarted: true },
        game: { phase: "active" }
      },
      user: corruptedUser,
      view: "room"
    });

    expect(result.current.id).toBe("sigrika-corruption-duel");
  });
});
