// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { isBackgroundMusicPauseRequested } from "../audio/backgroundMusicPause.js";
import SigrikaCorruptionOverlay from "./SigrikaCorruptionOverlay.jsx";

describe("Sigrika corruption presentation boundary", () => {
  it("renders the damage field without suppressing the dedicated corruption BGM", () => {
    expect(isBackgroundMusicPauseRequested()).toBe(false);
    const view = render(<SigrikaCorruptionOverlay />);

    expect(isBackgroundMusicPauseRequested()).toBe(false);
    expect(view.container.querySelectorAll(".sigrika-corruption-field__tear")).toHaveLength(3);
    expect(view.container.querySelectorAll(".sigrika-corruption-field__block")).toHaveLength(6);

    view.unmount();
    expect(isBackgroundMusicPauseRequested()).toBe(false);
  });
});
