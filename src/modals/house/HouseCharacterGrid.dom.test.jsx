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

function pointer(element, type, pointerType = "mouse", relatedTarget = null, properties = {}) {
  const event = new Event(type, { bubbles: true });
  Object.defineProperties(event, { pointerType: { value: pointerType }, relatedTarget: { value: relatedTarget },
    ...Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, { value }])) });
  fireEvent(element, event);
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
    const locked = container.querySelector('[data-character-id="denia"] button');
    expect(locked.disabled).toBe(true);
    expect(locked.getAttribute("title")).toBeNull();
    pointer(locked, "pointerover");
    pointer(locked, "pointermove", "mouse", null, { movementX: 20 });
    act(() => { locked.focus(); locked.click(); });
    fireEvent.keyDown(locked, { key: "Enter" });
    await userEvent.setup().click(locked);
    expect(locked.getAttribute("aria-expanded")).toBe("false");
    expect(container.textContent).not.toContain("达妮娅");
    expect(onOpenCharacterDetail).not.toHaveBeenCalled();
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

  it("opens mobile details directly without an extra action or latched preview", async () => {
    mockViewport(true);
    const { onOpenCharacterDetail, onSelectCharacter } = renderGrid({ itemEffects: {} });
    const user = userEvent.setup();
    const tile = screen.getByRole("button", { name: "西格莉卡角色详情" });
    await user.click(tile);
    expect(tile.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("button", { name: "查看西格莉卡详情" })).toBeNull();
    expect(onOpenCharacterDetail).toHaveBeenCalledOnce();
    expect(onOpenCharacterDetail).toHaveBeenCalledWith(CHARACTERS.sigrika);
    expect(onSelectCharacter).not.toHaveBeenCalled();
  });

  it("keeps HomeOnboarding's programmatic guide click direct on mobile", () => {
    mockViewport(true);
    const { container, onOpenCharacterDetail } = renderGrid({ itemEffects: {} });
    act(() => container.querySelector('[data-home-guide="sigrika-card"]').click());
    expect(onOpenCharacterDetail).toHaveBeenCalledWith(CHARACTERS.sigrika);
  });

  it("keeps unavailable Baconbits static while keeping every portrait source out of markup", async () => {
    mockViewport(true);
    const { container, onOpenUnknownDetail, onOpenCharacterDetail } = renderGrid({
      characters: [CHARACTERS.baconbits], owned: new Set(), itemEffects: {} });
    const tile = screen.getByRole("button", { name: "暂无情报" });
    pointer(tile, "pointerover");
    await userEvent.setup().click(tile);
    expect(tile.disabled).toBe(true);
    expect(tile.getAttribute("aria-expanded")).toBe("false");
    expect(container.textContent).not.toContain("猪小仙");
    const piece = container.querySelector(".is-missing-data");
    expect(piece.querySelector("img, .handbook-puzzle-silhouette, .handbook-puzzle-question, .handbook-strip-name")).toBeNull();
    expect(piece.querySelector("[style*=mask]")).toBeNull();
    expect(piece.querySelector(".handbook-missing-label").textContent).toBe("暂无情报");
    expect(onOpenUnknownDetail).not.toHaveBeenCalled();
    expect(onOpenCharacterDetail).not.toHaveBeenCalled();
  });

  it("keeps mobile portrait sides tied to catalog positions even across locked characters", () => {
    mockViewport(true);
    const { container } = renderGrid({ characters: [CHARACTERS.sigrika, CHARACTERS.denia, CHARACTERS.aemeath, CHARACTERS.baconbits], itemEffects: {} });
    expect([...container.querySelectorAll(".handbook-puzzle-piece")].map((piece) => piece.dataset.portraitSide)).toEqual(["left", "right", "left", "right"]);
    expect(container.querySelectorAll(".handbook-strip-name")).toHaveLength(1);
  });

  it("keeps faction emblems decorative and excludes them from unavailable slots", async () => {
    mockViewport(true);
    const { container, onOpenCharacterDetail } = renderGrid({
      characters: [CHARACTERS.sigrika, CHARACTERS.denia, CHARACTERS.nabomo, CHARACTERS.aemeath, CHARACTERS.baconbits],
      owned: new Set(["sigrika", "aemeath"]), itemEffects: {}
    });
    const sigrika = screen.getByRole("button", { name: "西格莉卡角色详情" });
    const paper = sigrika.querySelector(".handbook-strip-paper");
    expect(paper.getAttribute("aria-hidden")).toBe("true");
    const emblem = paper.querySelector(".handbook-strip-emblem");
    expect(emblem.getAttribute("aria-hidden")).toBe("true");
    expect(emblem.style.maskImage).toContain("/assets/factions/roya.webp");
    expect(sigrika.querySelectorAll("img")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "爱弥斯角色详情" }).querySelector(".handbook-strip-paper")).not.toBeNull();
    for (const piece of container.querySelectorAll(".is-unowned")) {
      expect(piece.querySelector(".handbook-strip-paper, .handbook-strip-emblem")).toBeNull();
      expect(piece.innerHTML).not.toContain("/assets/factions/");
    }
    await userEvent.setup().click(sigrika);
    expect(onOpenCharacterDetail).toHaveBeenCalledWith(CHARACTERS.sigrika);
  });

  it("uses the user-directed faction mapping without inferring one for the mascot or additions", () => {
    mockViewport(false);
    const newcomer = { ...CHARACTERS.sigrika, id: "newcomer", name: "新部员" };
    const characters = [...Object.values(CHARACTERS), newcomer];
    const { container } = renderGrid({ characters, owned: new Set(characters.map(({ id }) => id)), itemEffects: {} });
    const expected = { sigrika: "roya.webp", denia: "startorch.webp", aemeath: "startorch.webp", lynae: "startorch.webp",
      mornye: "startorch.webp", chisa: "startorch.webp", nabomo: "startorch.webp", changli: "huanglong.png", qiuyuan: "huanglong.png" };
    for (const [id, file] of Object.entries(expected)) {
      const tile = container.querySelector(`[data-character-id="${id}"] .handbook-puzzle-tile`);
      const emblem = tile.querySelector(".handbook-strip-emblem");
      expect(emblem.style.maskImage).toContain(`/assets/factions/${file}`);
      expect(Number(emblem.style.getPropertyValue("--handbook-emblem-strength"))).toBeGreaterThan(1);
      expect(tile.querySelectorAll("img")).toHaveLength(1);
    }
    expect(container.querySelector('[data-character-id="baconbits"] .handbook-strip-emblem')).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "下一页" }));
    expect(container.querySelector('[data-character-id="newcomer"] .handbook-strip-emblem')).toBeNull();
  });

  it("clears expansion on orientation changes and pagination", async () => {
    const resize = mockViewport(true);
    const characters = Array.from({ length: 11 }, (_, index) => ({ ...CHARACTERS.sigrika, id: `member-${index}`, name: `部员${index}` }));
    renderGrid({ characters, owned: new Set(characters.map(({ id }) => id)), itemEffects: {} });
    const user = userEvent.setup();
    const tile = screen.getByRole("button", { name: "部员0角色详情" });
    pointer(tile, "pointerover");
    expect(tile.getAttribute("aria-expanded")).toBe("true");
    resize(false);
    expect(tile.getAttribute("aria-expanded")).toBe("false");
    resize(true);
    pointer(tile, "pointerover");
    await user.click(screen.getByRole("button", { name: "下一页" }));
    expect(screen.queryByRole("button", { name: "部员0角色详情" })).toBeNull();
    expect(screen.getByRole("button", { name: "部员10角色详情" }).getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps a focused keyboard preview on pointer leave and collapses on blur", () => {
    mockViewport(false);
    const { container } = renderGrid({ itemEffects: {} });
    const tile = screen.getByRole("button", { name: "西格莉卡角色详情" });
    act(() => tile.focus());
    fireEvent.pointerLeave(container.querySelector(".handbook-puzzle-board"));
    expect(tile.getAttribute("aria-expanded")).toBe("true");
    act(() => tile.blur());
    expect(tile.getAttribute("aria-expanded")).toBe("false");
  });

  it("restores the focused keyboard strip after a different mouse preview leaves the board", () => {
    mockViewport(false);
    const { container } = renderGrid({ characters: [CHARACTERS.sigrika, CHARACTERS.denia], owned: new Set(["sigrika", "denia"]), itemEffects: {} });
    const first = screen.getByRole("button", { name: "西格莉卡角色详情" });
    const second = screen.getByRole("button", { name: "达妮娅角色详情" });
    act(() => first.focus());
    const board = container.querySelector(".handbook-puzzle-board");
    pointer(second, "pointerover");
    expect(second.getAttribute("aria-expanded")).toBe("true");
    fireEvent.pointerLeave(board);
    expect(first.getAttribute("aria-expanded")).toBe("true");
    expect(second.getAttribute("aria-expanded")).toBe("false");
  });

  it("clears a narrow mouse preview when its strip is no longer hovered", () => {
    mockViewport(true);
    const { container } = renderGrid({ itemEffects: {} });
    const tile = screen.getByRole("button", { name: "西格莉卡角色详情" });
    pointer(tile, "pointerover");
    expect(tile.getAttribute("aria-expanded")).toBe("true");
    pointer(tile, "pointerout", "mouse", document.body);
    expect(tile.getAttribute("aria-expanded")).toBe("false");
    pointer(tile, "pointerover");
    fireEvent.scroll(container.querySelector(".handbook-puzzle-panel"));
    expect(tile.getAttribute("aria-expanded")).toBe("false");
  });

  it("does not alter touch target geometry on contact, release, cancellation or focus", () => {
    mockViewport(true);
    renderGrid({ itemEffects: {} });
    const tile = screen.getByRole("button", { name: "西格莉卡角色详情" });
    pointer(tile, "pointerdown", "touch");
    act(() => tile.focus());
    expect(tile.getAttribute("aria-expanded")).toBe("false");
    pointer(tile, "pointerup", "touch");
    expect(tile.getAttribute("aria-expanded")).toBe("false");
    pointer(tile, "pointercancel", "touch");
    expect(tile.getAttribute("aria-expanded")).toBe("false");
    fireEvent.keyDown(tile, { key: "ArrowRight" });
    expect(tile.getAttribute("aria-expanded")).toBe("true");
  });

  it("keeps a previously expanded touch target stable until its native click opens details", () => {
    mockViewport(true);
    const { onOpenCharacterDetail } = renderGrid({ itemEffects: {} });
    const tile = screen.getByRole("button", { name: "西格莉卡角色详情" });
    act(() => tile.focus());
    expect(tile.getAttribute("aria-expanded")).toBe("true");
    pointer(tile, "pointerdown", "touch");
    pointer(tile, "pointerup", "touch");
    fireEvent.pointerLeave(tile.closest(".handbook-puzzle-board"));
    expect(tile.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(tile, { detail: 1 });
    expect(onOpenCharacterDetail).toHaveBeenCalledOnce();
    expect(tile.getAttribute("aria-expanded")).toBe("false");
  });

  it("ignores post-touch ghost hover until the mouse genuinely moves, while allowing new keyboard input", () => {
    mockViewport(true);
    const { onOpenCharacterDetail } = renderGrid({ itemEffects: {} });
    const tile = screen.getByRole("button", { name: "西格莉卡角色详情" });
    pointer(tile, "pointerover");
    expect(tile.getAttribute("aria-expanded")).toBe("true");
    pointer(tile, "pointerdown", "touch");
    pointer(tile, "pointerup", "touch");
    fireEvent.click(tile, { detail: 1 });
    expect(onOpenCharacterDetail).toHaveBeenCalledOnce();
    act(() => tile.blur());
    fireEvent.keyDown(window, { key: "Escape" });
    act(() => tile.focus());
    pointer(tile, "pointerover");
    pointer(tile, "pointermove", "mouse", null, { movementX: 0, movementY: 0 });
    pointer(tile, "pointermove", "mouse", null,
      { movementX: 20, movementY: 8, sourceCapabilities: { firesTouchEvents: true } });
    expect(tile.getAttribute("aria-expanded")).toBe("false");
    fireEvent.keyDown(tile, { key: "ArrowRight" });
    expect(tile.getAttribute("aria-expanded")).toBe("true");
    act(() => tile.blur());
    pointer(tile, "pointerover");
    expect(tile.getAttribute("aria-expanded")).toBe("false");
    pointer(tile, "pointermove", "mouse", null, { movementX: 1, movementY: 0 });
    expect(tile.getAttribute("aria-expanded")).toBe("true");
    pointer(tile, "pointerout", "mouse", document.body);
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
