// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import HouseModal from "../HouseModal.jsx";
import { CHARACTERS } from "../../shared/characters.js";

vi.mock("../../audio/playback.jsx", () => ({ playUiDetailOpenSound: vi.fn(), stopVoicePlayback: vi.fn() }));
vi.mock("../../audio/systemVoicePlayback.js", () => ({ playSystemVoice: vi.fn() }));

afterEach(cleanup);

function setup(overrides = {}) {
  const onApplyDecoration = vi.fn().mockResolvedValue(undefined);
  const onSelectCharacter = vi.fn();
  render(<div className="app-shell player-theme-enabled theme-bright-school"><HouseModal
    user={{ selectedCharacter: "sigrika", ownedCharacters: ["sigrika"], ownedDecorations: ["paw-stone"], ...overrides }}
    characterListView={[CHARACTERS.sigrika, CHARACTERS.baconbits]} audioSettings={{ muted: true }}
    onApplyDecoration={onApplyDecoration} onSelectCharacter={onSelectCharacter} onClose={() => {}}
  /></div>);
  return { onApplyDecoration, onSelectCharacter };
}

describe("member handbook pages", () => {
  it("switches the visible page through bookmarks and keeps decoration actions working", async () => {
    const user = userEvent.setup();
    const { onApplyDecoration } = setup();
    expect(screen.getByRole("tabpanel", { name: "角色" })).toBeTruthy();
    expect(screen.queryByRole("tabpanel", { name: "装饰" })).toBeNull();
    await user.click(screen.getByRole("tab", { name: "装饰" }));
    expect(screen.queryByRole("tabpanel", { name: "角色" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "爪印棋子" }));
    expect(onApplyDecoration).toHaveBeenCalledWith("paw-stone");
    screen.getByRole("tab", { name: "装饰" }).focus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "角色" }).getAttribute("aria-selected")).toBe("true");
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("tabpanel", { name: "装饰" })).toBeTruthy();
  });

  it("uses the current palette, protects hidden identity, and isolates keyboard sortie from details", async () => {
    const user = userEvent.setup();
    const { onSelectCharacter } = setup();
    const card = screen.getByRole("button", { name: "西格莉卡的学生证" });
    expect(card.style.getPropertyValue("--character-theme-color")).toBe(CHARACTERS.sigrika.palette);
    expect(screen.getByRole("img", { name: "暂无情报" })).toBeTruthy();
    expect(screen.queryByText("猪小仙")).toBeNull();
    screen.getByRole("button", { name: "出战中" }).focus();
    await user.keyboard("{Enter}");
    expect(onSelectCharacter).toHaveBeenCalledOnce();
    expect(document.querySelector(".character-details-modal")).toBeNull();
    card.focus();
    await user.keyboard(" ");
    expect(document.querySelector(".character-details-modal")).toBeTruthy();
  });

  it("keeps the corrupted archive separate from normal book navigation", () => {
    setup({ sigrikaCandyArc: { corrupted: true } });
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByText("星炬学院")).toBeNull();
    expect(document.querySelector(".handbook-opening-cover")).toBeNull();
    expect(screen.getAllByRole("img", { name: "西格莉卡？" }).length).toBeGreaterThan(0);
  });
});
