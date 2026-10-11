import { describe, expect, it } from "vitest";
import { reconcileSpectatorSeats, spectatorAppearance, spectatorUsers } from "./spectatorPresence.js";

describe("spectator presence", () => {
  it("uses the actual roster, deduplicates users and excludes either player after the game", () => {
    const room = { role: "spectator", players: [{ user: { id: "p" } }], spectators: [
      { user: { id: "p" } }, { user: { id: "self" } }, { user: { id: "self", username: "new" } }, {}
    ] };
    expect(spectatorUsers(room)).toEqual([{ id: "self", username: "new" }]);
  });

  it("preserves positions on reorder, departure and return; only new arrivals animate", () => {
    const initial = reconcileSpectatorSeats(null, "room", ["a", "b", "c"]);
    expect(Object.values(initial.seats).every((seat) => !seat.animate)).toBe(true);
    const joined = reconcileSpectatorSeats(initial, "room", ["d", "c", "a", "b"]);
    expect(joined.seats.a).toEqual(initial.seats.a);
    expect(joined.seats.d.animate).toBe(true);
    const left = reconcileSpectatorSeats(joined, "room", ["a", "c", "d"]);
    expect(left.seats.d.animate).toBe(false);
    const returned = reconcileSpectatorSeats(left, "room", ["a", "b", "c", "d"]);
    expect(returned.seats.b).toEqual(initial.seats.b);
    expect(returned.seats.c).toEqual(initial.seats.c);
  });

  it("reuses vacancies without collisions and resets the cache for another room", () => {
    let state = reconcileSpectatorSeats(null, "room", ["a", "b"]);
    state = reconcileSpectatorSeats(state, "room", ["b"]);
    state = reconcileSpectatorSeats(state, "room", ["b", "c"]);
    state = reconcileSpectatorSeats(state, "room", ["a", "b", "c"]);
    expect(new Set(Object.values(state.seats).map((seat) => seat.slot)).size).toBe(3);
    const next = reconcileSpectatorSeats(state, "other", ["a"]);
    expect(next.seats.a.slot).toBe(0);
    expect(next.seats.a.animate).toBe(false);
    expect(Object.keys(next.cache)).toEqual(["a"]);
  });

  it("resolves equipped art with a same-character fallback and never invents an unknown character", () => {
    const appearance = spectatorAppearance({ selectedCharacter: "sigrika", equippedCostumes: { sigrika: { portraitUrl: "/outfit.png" } } });
    expect(appearance.src).toBe("/outfit.png");
    expect(appearance.fallback).toContain("sigrika");
    expect(appearance.fallback).not.toBe(appearance.src);
    expect(spectatorAppearance({ selectedCharacter: "missing" })).toEqual({ src: "", fallback: "" });
  });
});
