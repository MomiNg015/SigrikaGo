// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TeamLineupPicker from "./TeamLineupPicker.jsx";
import MatchCharacterPicker from "./MatchCharacterPicker.jsx";
import { CHARACTERS } from "../shared/characters.js";
import { playSystemVoice } from "../audio/systemVoicePlayback.js";
import { stopVoicePlayback } from "../audio/playback.jsx";
import { teamLineupSlots } from "./teamLineupSlots.js";
vi.mock("../audio/playback.jsx", () => ({ stopVoicePlayback: vi.fn() }));
vi.mock("../audio/systemVoicePlayback.js", () => ({ playSystemVoice: vi.fn() }));
afterEach(() => { cleanup(); localStorage.clear(); vi.clearAllMocks(); });

describe("fixed lineup positions and selection voice", () => {
  const user = { id: "lineup-test", ownedCharacters: ["sigrika", "aemeath", "nabomo", "denia"] };
  it("clears the middle position without moving the third and fills the first vacancy", () => {
    const onStart = vi.fn();
    render(<TeamLineupPicker user={user} characters={CHARACTERS} onStart={onStart} onClose={vi.fn()} />);
    for (const round of [1, 2, 3]) expect(screen.getByText(`Round ${round}`)).toBeTruthy();
    expect(document.querySelectorAll(".team-lineup-empty-card")).toHaveLength(3);
    expect(screen.queryByText("待选部员")).toBeNull();
    expect(screen.queryByText("点击移出此位置")).toBeNull();
    for (const name of ["西格莉卡", "爱弥斯", "娜波摩"]) fireEvent.click(screen.getByRole("button", { name, exact: true }));
    expect(screen.queryByText("点击移出此位置")).toBeNull();
    for (const [name, position] of [["西格莉卡", 1], ["爱弥斯", 2], ["娜波摩", 3]]) {
      const card = screen.getByRole("button", { name, exact: true });
      expect(card.getAttribute("aria-pressed")).toBe("true");
      expect(card.querySelector(".match-character-id > .match-character-selection-stamp").getAttribute("src")).toBe(`/assets/home/selection-stamp-${position}-v2.png`);
    }
    fireEvent.click(screen.getByRole("button", { name: "取消第2位：爱弥斯" }));
    expect(screen.getByRole("button", { name: "爱弥斯", exact: true }).querySelector(".match-character-selection-stamp")).toBeNull();
    expect(screen.getByRole("button", { name: "娜波摩", exact: true }).querySelector(".match-character-selection-stamp").getAttribute("alt")).toBe("第3位");
    expect(screen.getByRole("button", { name: "取消第3位：娜波摩" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "第2位待选" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "开始队际赛匹配" }).disabled).toBe(true);
    expect(JSON.parse(localStorage.getItem("sigrika-team-lineup:lineup-test"))).toEqual(["sigrika", "", "nabomo"]);
    expect(playSystemVoice).toHaveBeenCalledTimes(3);
    fireEvent.click(screen.getByRole("button", { name: "达妮娅", exact: true }));
    expect(screen.getByRole("button", { name: "达妮娅", exact: true }).querySelector(".match-character-selection-stamp").getAttribute("src")).toBe("/assets/home/selection-stamp-2-v2.png");
    fireEvent.click(screen.getByRole("button", { name: "开始队际赛匹配" }));
    expect(onStart).toHaveBeenCalledWith("team", ["sigrika", "denia", "nabomo"]);
  });
  it("interrupts voice before each single-mode selection and passes audio settings", () => {
    const onSelect = vi.fn(), audioSettings = { voice: .4 };
    render(<MatchCharacterPicker available={[CHARACTERS.sigrika, CHARACTERS.denia]} selected="sigrika" user={user} audioSettings={audioSettings} onSelect={onSelect} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: "西格莉卡", exact: true }).querySelector(".match-character-id > .match-character-selection-stamp").getAttribute("src")).toBe("/assets/home/selection-stamp-flag-v2.png");
    expect(screen.getByRole("button", { name: "达妮娅", exact: true }).querySelector(".match-character-selection-stamp")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "西格莉卡", exact: true }));
    fireEvent.click(screen.getByRole("button", { name: "达妮娅", exact: true }));
    expect(stopVoicePlayback).toHaveBeenCalledTimes(2);
    expect(playSystemVoice).toHaveBeenLastCalledWith("sortie", expect.objectContaining({ character: expect.objectContaining({ id: "denia" }), audioSettings }));
    expect(stopVoicePlayback.mock.invocationCallOrder[1]).toBeLessThan(playSystemVoice.mock.invocationCallOrder[1]);
    expect(onSelect).toHaveBeenLastCalledWith("denia");
  });
  it("retains position when a saved member becomes unavailable", () => {
    expect(teamLineupSlots(["sigrika", "denia", "nabomo"], new Set(["sigrika", "nabomo"]))).toEqual(["sigrika", "", "nabomo"]);
  });
  it("blocks duplicates, unowned members and newly unavailable members before starting", () => {
    const onStart = vi.fn();
    const { rerender } = render(<TeamLineupPicker user={user} characters={CHARACTERS} initialLineup={["sigrika", "sigrika", "unknown"]} onStart={onStart} onClose={vi.fn()}/>);
    const start = screen.getByRole("button", { name: "开始队际赛匹配" });
    expect(start.disabled).toBe(true);
    for (const name of ["爱弥斯", "娜波摩"]) fireEvent.click(screen.getByRole("button", { name, exact: true }));
    expect(start.disabled).toBe(false);
    rerender(<TeamLineupPicker user={{ ...user, itemEffects: { sigrikaCandyDisabled: true } }} characters={CHARACTERS} onStart={onStart} onClose={vi.fn()}/>);
    expect(start.disabled).toBe(true);
    fireEvent.click(start);
    expect(onStart).not.toHaveBeenCalled();
  });
});
