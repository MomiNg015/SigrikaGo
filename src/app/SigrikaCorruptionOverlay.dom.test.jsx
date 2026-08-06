// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { subscribeBackgroundMusicPause } from "../audio/backgroundMusicPause.js";
import SigrikaCorruptionOverlay from "./SigrikaCorruptionOverlay.jsx";

describe("Sigrika corruption presentation boundary", () => {
  it("pauses BGM while mounted and releases the pause when corruption ends", () => {
    const pauseStates = [];
    const unsubscribe = subscribeBackgroundMusicPause((paused) => pauseStates.push(paused));
    const view = render(<SigrikaCorruptionOverlay />);

    expect(pauseStates.at(-1)).toBe(true);
    expect(view.container.querySelectorAll(".sigrika-corruption-field__tear")).toHaveLength(3);
    expect(view.container.querySelectorAll(".sigrika-corruption-field__block")).toHaveLength(6);

    view.unmount();
    expect(pauseStates.at(-1)).toBe(false);
    unsubscribe();
  });
});
