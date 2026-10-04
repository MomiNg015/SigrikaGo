// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import HouseModal from "../HouseModal.jsx";
import { CHARACTERS } from "../../shared/characters.js";

vi.mock("../../audio/playback.jsx", () => ({ playUiDetailOpenSound: vi.fn(), stopVoicePlayback: vi.fn() }));
vi.mock("../../audio/systemVoicePlayback.js", () => ({ playSystemVoice: vi.fn() }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function setup(overrides = {}, characters = [CHARACTERS.sigrika, CHARACTERS.baconbits]) {
  const onApplyDecoration = vi.fn().mockResolvedValue(undefined);
  const onSelectCharacter = vi.fn();
  render(<div className="app-shell player-theme-enabled theme-bright-school"><HouseModal
    user={{ selectedCharacter: "sigrika", ownedCharacters: ["sigrika"], ownedDecorations: ["paw-stone"], ...overrides }}
    characterListView={characters} audioSettings={{ muted: true }}
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

  it("opens anonymous hidden-character details from the strip without exposing identity", async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.queryByText("星炬学院")).toBeNull();
    expect(screen.queryByText("学生证")).toBeNull();
    expect(document.querySelector(".handbook-open-art")).toBeNull();
    expect(document.querySelector(".handbook-character-card")).toBeNull();
    expect(document.querySelector(".handbook-puzzle-panel").parentElement.classList.contains("house-modal")).toBe(true);
    expect(document.querySelectorAll(".handbook-puzzle-board > .handbook-puzzle-piece > button.handbook-puzzle-tile")).toHaveLength(2);
    const hiddenCharacter = screen.getByRole("button", { name: "未知角色详情", exact: true });
    expect(screen.queryByText("猪小仙")).toBeNull();
    expect(document.querySelector(".sortie-button")).toBeNull();
    await user.click(hiddenCharacter);
    expect(within(screen.getByRole("dialog", { name: "未知角色详情" })).getByText("暂无情报")).toBeTruthy();
    expect(screen.getByText("获得该角色后可查看完整情报。")).toBeTruthy();
    expect(screen.queryByText("猪小仙")).toBeNull();
    expect(screen.queryByText("猪小仙爆炸")).toBeNull();
    expect(screen.queryByRole("button", { name: "查看猪小仙的服装" })).toBeNull();
    await user.keyboard("{Escape}");
    expect(screen.queryByText("获得该角色后可查看完整情报。")).toBeNull();
    expect(document.activeElement).toBe(hiddenCharacter);
  });

  it("keeps all ten slices in catalog order and opens the existing character details", async () => {
    const user = userEvent.setup();
    const { onSelectCharacter } = setup({}, Object.values(CHARACTERS));
    const pieces = [...document.querySelectorAll(".handbook-puzzle-piece > button.handbook-puzzle-tile")];
    expect(pieces.map(piece => piece.getAttribute("aria-label"))).toEqual([
      "西格莉卡角色详情", "达妮娅角色详情（未拥有）", "爱弥斯角色详情（未拥有）",
      "未知角色详情", "琳奈角色详情（未拥有）", "仇远角色详情（未拥有）",
      "莫宁角色详情（未拥有）", "长离角色详情（未拥有）", "千咲角色详情（未拥有）", "娜波摩角色详情（未拥有）"
    ]);
    const sigrika = screen.getByRole("button", { name: "西格莉卡角色详情", exact: true });
    expect(sigrika.querySelector("img").getAttribute("src")).toBe("/assets/characters/handbook-sprites/sigrika.webp");
    await user.click(sigrika);
    const detail = screen.getByRole("dialog", { name: "西格莉卡角色详情", exact: true });
    expect(within(detail).getByText("星辉符文")).toBeTruthy();
    expect(within(detail).getByText("超频：3")).toBeTruthy();
    expect(within(detail).getByRole("button", { name: "查看西格莉卡的服装" })).toBeTruthy();
    expect(onSelectCharacter).not.toHaveBeenCalled();
  });

  it("keeps mobile guide activation direct and restores focus from touch details", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    setup();
    const user = userEvent.setup();
    const tile = screen.getByRole("button", { name: "西格莉卡角色详情", exact: true });
    await user.click(tile);
    expect(screen.getByRole("dialog", { name: "西格莉卡角色详情", exact: true })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "查看西格莉卡详情" })).toBeNull();
    await user.keyboard("{Escape}");
    expect(document.activeElement).toBe(tile);
    expect(tile.getAttribute("aria-expanded")).toBe("false");
    // HomeOnboarding uses HTMLElement.click(), whose detail is zero.
    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog", { name: "西格莉卡角色详情", exact: true })).toBeTruthy();
  });

  it("does not latch a mobile preview when a synthetic guide activation returns focus", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    setup();
    const tile = screen.getByRole("button", { name: "西格莉卡角色详情", exact: true });
    act(() => tile.click());
    expect(screen.getByRole("dialog", { name: "西格莉卡角色详情", exact: true })).toBeTruthy();
    await userEvent.setup().keyboard("{Escape}");
    expect(document.activeElement).toBe(tile);
    expect(tile.getAttribute("aria-expanded")).toBe("false");
    await userEvent.setup().keyboard("{ArrowRight}");
    expect(tile.getAttribute("aria-expanded")).toBe("true");
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
