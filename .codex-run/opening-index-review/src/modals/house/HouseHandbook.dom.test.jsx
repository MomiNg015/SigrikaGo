// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
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

  it("restores the original card surface and protects hidden identity", () => {
    setup();
    expect(screen.queryByText("星炬学院")).toBeNull();
    expect(screen.queryByText("学生证")).toBeNull();
    expect(document.querySelector(".handbook-open-art")).toBeNull();
    expect(document.querySelector(".handbook-character-card")).toBeNull();
    expect(document.querySelector(".character-grid-container").parentElement.classList.contains("house-modal")).toBe(true);
    expect(screen.getByRole("img", { name: "暂无情报" })).toBeTruthy();
    expect(screen.queryByText("猪小仙")).toBeNull();
  });

  it("places default stones first and resets an equipped decoration through the existing action", async () => {
    const user = userEvent.setup();
    const { onApplyDecoration } = setup({ selectedStoneDecoration: "paw-stone" });
    await user.click(screen.getByRole("tab", { name: "装饰" }));
    const panel = screen.getByRole("tabpanel", { name: "装饰" });
    const buttons = within(panel).getAllByRole("button");
    expect(buttons.map(button => button.getAttribute("aria-label"))).toEqual(["默认棋子", "爪印棋子"]);
    expect(within(panel).queryByRole("heading")).toBeNull();
    expect(within(panel).queryByRole("button", { name: "恢复初始装饰" })).toBeNull();
    expect(buttons[1].disabled).toBe(true);
    await user.click(buttons[0]);
    expect(onApplyDecoration).toHaveBeenCalledWith("");
  });

  it("keeps the default option selected when no decorations are owned", async () => {
    const user = userEvent.setup();
    setup({ ownedDecorations: [] });
    await user.click(screen.getByRole("tab", { name: "装饰" }));
    const button = screen.getByRole("button", { name: "默认棋子" });
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByText("暂无装饰。")).toBeNull();
  });

  it("keeps the corrupted archive separate from normal book navigation", () => {
    setup({ sigrikaCandyArc: { corrupted: true } });
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByText("星炬学院")).toBeNull();
    expect(document.querySelector(".handbook-opening-cover")).toBeNull();
    expect(screen.getAllByRole("img", { name: "西格莉卡？" }).length).toBeGreaterThan(0);
  });
});
