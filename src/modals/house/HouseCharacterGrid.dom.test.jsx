// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CHARACTERS } from "../../shared/characters.js";
import HouseCharacterGrid from "./HouseCharacterGrid.jsx";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function mockViewport(mobile) {
  let change;
  const media = { matches: mobile, addEventListener: vi.fn((_event, listener) => { change = listener; }), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", vi.fn(() => media));
  return (next) => act(() => { media.matches = next; change(); });
}

function renderGrid(overrides = {}) {
  const onCancelCandyEffect = vi.fn();
  const onOpenCharacterDetail = vi.fn();
  const onOpenUnknownDetail = vi.fn();
  const onSelectCharacter = vi.fn();
  const result = render(
    <HouseCharacterGrid
      audioSettings={{}}
      characters={[CHARACTERS.sigrika]}
      itemEffects={{ sigrikaCandyDisabled: true }}
      owned={new Set(["sigrika"])}
      selectedCharacter="sigrika"
      user={{
        id: 1,
        selectedCharacter: "sigrika",
        itemEffects: { sigrikaCandyDisabled: true }
      }}
      candyEffectCancellationEnabled
      onCancelCandyEffect={onCancelCandyEffect}
      onOpenCharacterDetail={onOpenCharacterDetail}
      onOpenUnknownDetail={onOpenUnknownDetail}
      onSelectCharacter={onSelectCharacter}
      {...overrides}
    />
  );

  return { ...result, onCancelCandyEffect, onOpenCharacterDetail, onOpenUnknownDetail, onSelectCharacter };
}

describe("HouseCharacterGrid ordered portrait strips", () => {
  it("preserves incoming order for owned and locked portraits without selecting a character", async () => {
    mockViewport(false);
    const characters = [CHARACTERS.denia, CHARACTERS.sigrika, CHARACTERS.aemeath];
    const { container, onSelectCharacter, onOpenCharacterDetail } = renderGrid({ characters, itemEffects: {} });
    expect([...container.querySelectorAll(".handbook-puzzle-piece")].map((piece) => piece.dataset.characterId))
      .toEqual(["denia", "sigrika", "aemeath"]);
    await userEvent.setup().click(screen.getByRole("button", { name: "达妮娅角色详情（未拥有）" }));
    expect(onOpenCharacterDetail).toHaveBeenCalledWith(CHARACTERS.denia);
    expect(onSelectCharacter).not.toHaveBeenCalled();
  });

  it("previews with keyboard focus and opens details with Enter", async () => {
    mockViewport(false);
    const { onOpenCharacterDetail } = renderGrid({ itemEffects: {} });
    const tile = screen.getByRole("button", { name: "西格莉卡角色详情" });
    act(() => tile.focus());
    expect(tile.getAttribute("aria-expanded")).toBe("true");
    expect(onOpenCharacterDetail).not.toHaveBeenCalled();
    await userEvent.setup().keyboard("{Enter}");
    expect(onOpenCharacterDetail).toHaveBeenCalledOnce();
  });

  it("expands a mobile tap before the separate detail action opens details", async () => {
    mockViewport(true);
    const { onOpenCharacterDetail, onSelectCharacter } = renderGrid({ itemEffects: {} });
    const user = userEvent.setup();
    const tile = screen.getByRole("button", { name: "西格莉卡角色详情" });
    await user.click(tile);
    expect(tile.getAttribute("aria-expanded")).toBe("true");
    expect(onOpenCharacterDetail).not.toHaveBeenCalled();
    await user.click(tile);
    expect(onOpenCharacterDetail).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "查看西格莉卡详情" }));
    expect(onOpenCharacterDetail).toHaveBeenCalledWith(CHARACTERS.sigrika);
    expect(onSelectCharacter).not.toHaveBeenCalled();
  });

  it("keeps HomeOnboarding's programmatic guide click direct on mobile", () => {
    mockViewport(true);
    const { container, onOpenCharacterDetail } = renderGrid({ itemEffects: {} });
    act(() => container.querySelector('[data-home-guide="sigrika-card"]').click());
    expect(onOpenCharacterDetail).toHaveBeenCalledWith(CHARACTERS.sigrika);
  });

  it("keeps unknown Baconbits anonymous through the mobile preview and detail action", async () => {
    mockViewport(true);
    const { container, onOpenUnknownDetail, onOpenCharacterDetail } = renderGrid({
      characters: [CHARACTERS.baconbits], owned: new Set(), itemEffects: {} });
    await userEvent.setup().click(screen.getByRole("button", { name: "未知角色详情" }));
    expect(container.textContent).not.toContain("猪小仙");
    await userEvent.setup().click(screen.getByRole("button", { name: "查看未知角色详情" }));
    expect(onOpenUnknownDetail).toHaveBeenCalledOnce();
    expect(onOpenCharacterDetail).not.toHaveBeenCalled();
  });

  it("clears expansion on orientation changes and pagination", async () => {
    const resize = mockViewport(true);
    const characters = Array.from({ length: 11 }, (_, index) => ({ ...CHARACTERS.sigrika, id: `member-${index}`, name: `部员${index}` }));
    renderGrid({ characters, itemEffects: {} });
    const user = userEvent.setup();
    const tile = screen.getByRole("button", { name: "部员0角色详情（未拥有）" });
    await user.click(tile);
    expect(tile.getAttribute("aria-expanded")).toBe("true");
    resize(false);
    expect(tile.getAttribute("aria-expanded")).toBe("false");
    resize(true);
    await user.click(tile);
    await user.click(screen.getByRole("button", { name: "下一页" }));
    expect(screen.queryByRole("button", { name: "查看部员0详情" })).toBeNull();
    expect(screen.getByRole("button", { name: "部员10角色详情（未拥有）" }).getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps a focused keyboard preview on pointer leave and collapses on blur", () => {
    mockViewport(false);
    const { container } = renderGrid({ itemEffects: {} });
    const tile = screen.getByRole("button", { name: "西格莉卡角色详情" });
    act(() => tile.focus());
    vi.spyOn(container.querySelector(".handbook-puzzle-board"), "querySelector").mockReturnValue(tile);
    fireEvent.pointerLeave(container.querySelector(".handbook-puzzle-board"));
    expect(tile.getAttribute("aria-expanded")).toBe("true");
    act(() => tile.blur());
    expect(tile.getAttribute("aria-expanded")).toBe("false");
  });
});

describe("HouseCharacterGrid candy effect cancellation", () => {
  it("cancels from the candy icon without opening the character card", async () => {
    const user = userEvent.setup();
    const { onCancelCandyEffect, onOpenCharacterDetail } = renderGrid();

    await user.click(screen.getByRole("button", {
      name: "取消西格莉卡的彩虹豆豆跳跳糖效果中"
    }));

    expect(onCancelCandyEffect).toHaveBeenCalledOnce();
    expect(onCancelCandyEffect).toHaveBeenCalledWith("sigrika");
    expect(onOpenCharacterDetail).not.toHaveBeenCalled();
  });

  it("keeps Enter and Space cancellation isolated from the character card", async () => {
    const user = userEvent.setup();
    const { onCancelCandyEffect, onOpenCharacterDetail } = renderGrid();
    const cancelButton = screen.getByRole("button", {
      name: "取消西格莉卡的彩虹豆豆跳跳糖效果中"
    });

    cancelButton.focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(onCancelCandyEffect).toHaveBeenCalledTimes(2);
    expect(onOpenCharacterDetail).not.toHaveBeenCalled();
  });
});
