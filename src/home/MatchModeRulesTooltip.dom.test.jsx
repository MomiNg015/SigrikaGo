// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import HomeScreen from "./HomeScreen.jsx";
import { CHARACTERS } from "../shared/characters.js";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function setup(desktop, onStartMatch = () => {}) {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: desktop, addEventListener() {}, removeEventListener() {} })));
  render(<HomeScreen user={{ username: "test", selectedCharacter: "sigrika", role: "player" }} characters={CHARACTERS} matchModePickerOpen onStartMatch={onStartMatch} />);
  return screen.getByRole("button", { name: /星炬对弈.*匹配中/ });
}

describe("mode rules hover", () => {
  it("keeps rules out of cards and shows and dismisses desktop hover rules", () => {
    const button = setup(true);
    expect(button.textContent).not.toContain("黑贴");
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.pointerEnter(button, { clientX: 200, clientY: 160 });
    expect(screen.getByRole("tooltip").textContent).toContain("黑贴2又3/4子");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.pointerEnter(button);
    fireEvent.pointerLeave(button);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("does not show rules on mobile even when a pointer event is synthesized", () => {
    const button = setup(false);
    fireEvent.pointerEnter(button);
    fireEvent.pointerMove(button);
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(button.textContent).not.toContain("黑贴");
  });

  it("toggles mobile info separately from matching and dismisses on outside input", () => {
    const onStartMatch = vi.fn();
    const modeButton = setup(false, onStartMatch);
    const info = screen.getByRole("button", { name: "查看星炬对弈规则" });
    expect(modeButton.contains(info)).toBe(false);
    fireEvent.click(info);
    expect(screen.getByRole("tooltip").textContent).toContain("黑贴2又3/4子");
    expect(info.getAttribute("aria-expanded")).toBe("true");
    expect(onStartMatch).not.toHaveBeenCalled();
    fireEvent.click(info);
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.click(info);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.click(modeButton);
    expect(onStartMatch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /常规匹配.*匹配中/ }));
    expect(onStartMatch).toHaveBeenCalledWith("spark");
  });
});
