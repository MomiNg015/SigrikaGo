// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import HomeScreen from "./HomeScreen.jsx";
import MatchCharacterCardContent from "./MatchCharacterCardContent.jsx";
import { CHARACTERS } from "../shared/characters.js";

vi.mock("./matchSortieVoice.js", () => ({ playMatchSortieVoice: vi.fn() }));

afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });
const user = { id: "selection-player", selectedCharacter: "sigrika", ownedCharacters: ["sigrika", "aemeath", "nabomo"] };
it("shows rainbow card borders only for characters whose candy effect is active", () => {
  const effects = { sigrikaCandyDisabled: true, deniaRainbowGlow: true, aemeathRainbowMove: true, lynaeContraryVoice: true };
  const { container, rerender } = render(<>{Object.values(CHARACTERS).map(character => <MatchCharacterCardContent key={character.id} character={character} user={{ ...user, itemEffects: effects }} />)}</>);
  expect(container.querySelectorAll('.character-candy-border')).toHaveLength(4);
  expect(container.querySelector('img[src="/assets/items/rainbow-bean-candy.webp"]')).toBeNull();
  rerender(<>{Object.values(CHARACTERS).map(character => <MatchCharacterCardContent key={character.id} character={character} user={{ ...user, itemEffects: {} }} />)}</>);
  expect(container.querySelectorAll('.character-candy-border')).toHaveLength(0);
});
it("uses portrait-first painted cards with character palettes and no emblem header", () => {
  const { container } = render(<>{Object.values(CHARACTERS).map(character => <MatchCharacterCardContent key={character.id} character={character} user={user} />)}</>);
  for (const card of container.querySelectorAll(".match-character-id")) {
    const character = Object.values(CHARACTERS).find(entry => entry.name === card.querySelector(".match-character-name").textContent);
    expect(card.style.getPropertyValue("--match-character-color")).toBe(character.palette);
    expect(card.querySelector(".match-character-id-frame").getAttribute("src")).toBe("/assets/home/character-selection-id-v4.png");
    expect(card.querySelector(".match-character-id-emblem")).toBeNull();
  }
});
function setup(extra = {}) {
  const props = { user, characters: CHARACTERS, matchModePickerOpen: true, onNotice: vi.fn(), onStartMatch: vi.fn(), onStartPractice: vi.fn(), ...extra };
  return { ...render(<HomeScreen {...props} />), props };
}
it("keeps each stamp's random angle within bounds and stable through selection updates", () => {
  const props = { character: CHARACTERS.sigrika, user };
  const { container, rerender } = render(<MatchCharacterCardContent {...props} selectionStamp="flag" />);
  const angle = () => container.querySelector(".match-character-selection-stamp").style.getPropertyValue("--selection-stamp-tilt");
  const initialAngle = angle();
  expect(parseFloat(initialAngle)).toBeGreaterThanOrEqual(-15);
  expect(parseFloat(initialAngle)).toBeLessThanOrEqual(15);
  rerender(<MatchCharacterCardContent {...props} />);
  expect(container.querySelector(".match-character-selection-stamp")).toBeNull();
  rerender(<MatchCharacterCardContent {...props} selectionStamp={3} />);
  expect(angle()).toBe(initialAngle);
});
function select(title, id) {
  const category = title === "标准对弈" ? "标准对弈" : "玩些别的";
  const parent = screen.queryByRole("button", { name: category });
  if (!parent) fireEvent.click(screen.getByRole("button", { name: "返回" }));
  const button = screen.getByRole("button", { name: category });
  if (button.getAttribute("aria-expanded") !== "true") fireEvent.click(button);
  title = title === "标准对弈" ? "常规匹配" : title;
  fireEvent.click(screen.getByRole("button", { name: `${title}选择角色` }));
  fireEvent.click(screen.getByRole("button", { name: CHARACTERS[id].name }));
}
describe("match card character selection", () => {
  it("keeps practice selection independent, preserves difficulty through closing the picker, and starts explicitly", () => {
    localStorage.setItem(`sigrika-match-characters:${user.id}`, JSON.stringify({ regular: ["sigrika"], capture: ["nabomo"] }));
    const { props, unmount } = setup();
    fireEvent.click(screen.getByRole("button", { name: "准时宝陪练" }));
    fireEvent.click(screen.getByRole("button", { name: /高级/ }));
    expect(props.onStartPractice).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "准时宝对局选择角色" }));
    const picker = screen.getByRole("dialog", { name: "选择角色" });
    expect(within(picker).queryByRole("button", { name: "开始准时宝对局" })).toBeNull();
    fireEvent.click(within(picker).getByRole("button", { name: CHARACTERS.aemeath.name }));
    fireEvent.click(within(picker).getByRole("button", { name: CHARACTERS.nabomo.name }));
    expect(within(picker).queryByRole("button", { name: "开始准时宝对局" })).toBeNull();
    expect(screen.getByRole("dialog", { name: "选择角色" })).toBe(picker);
    expect(props.onStartPractice).not.toHaveBeenCalled();
    fireEvent.keyDown(picker, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "选择角色" })).toBeNull();
    expect(screen.getByRole("button", { name: /高级/ }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "开始准时宝对局" }));
    expect(props.onStartPractice).toHaveBeenCalledExactlyOnceWith({ difficulty: "advanced", playerColor: "random", characterId: "nabomo" });
    expect(props.onStartMatch).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(`sigrika-match-characters:${user.id}`))).toMatchObject({ regular: ["sigrika"], capture: ["nabomo"], practice: ["nabomo"] });
    unmount();
    setup();
    fireEvent.click(screen.getByRole("button", { name: "准时宝陪练" }));
    expect(screen.getByRole("button", { name: `准时宝对局选择角色：${CHARACTERS.nabomo.name}` })).toBeTruthy();
  });

  it("disables Start for an empty picker and closes without starting", () => {
    const { props } = setup({ user: { ...user, ownedCharacters: [] } });
    fireEvent.click(screen.getByRole("button", { name: "标准对弈" }));
    fireEvent.click(screen.getByRole("button", { name: "常规匹配选择角色" }));
    expect(screen.getByRole("button", { name: "开始标准对弈匹配" }).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "关闭选择角色" }));
    expect(props.onStartMatch).not.toHaveBeenCalled();
  });

  it.each(["标准对弈", "来下五子棋吗？", "常规匹配", "吃子挑战赛", "队际赛"])("blocks %s without a selection", (title) => {
    const { props, container } = setup();
    fireEvent.click(screen.getAllByRole("button", { name: title === "标准对弈" ? "标准对弈" : title === "来下五子棋吗？" ? "玩些别的" : "星炬对弈" }).at(-1));
    if (title === "标准对弈") title = "常规匹配";
    fireEvent.click(screen.getByRole("button", { name: title }));
    expect(props.onNotice).toHaveBeenCalledWith("尚未选择角色，无法匹配");
    expect(props.onStartMatch).not.toHaveBeenCalled();
    expect(props.onStartPractice).not.toHaveBeenCalled();
    expect(container.querySelector(".match-mode-count")).toBeNull();
  });
  it("persists separate entries and sends the shown identity instead of the default", () => {
    const { props, unmount } = setup();
    select("标准对弈", "aemeath");
    expect(screen.getByRole("dialog", { name: "选择角色" })).toBeTruthy();
    expect(props.onStartMatch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "开始标准对弈匹配" }));
    expect(props.onStartMatch).toHaveBeenCalledWith("standard", undefined, "aemeath");
    select("来下五子棋吗？", "nabomo");
    fireEvent.click(screen.getByRole("button", { name: "关闭选择角色" }));
    unmount();
    setup();
    fireEvent.click(screen.getByRole("button", { name: "标准对弈" }));
    expect(screen.getByRole("button", { name: `常规匹配选择角色：${CHARACTERS.aemeath.name}` })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "返回" }));
    fireEvent.click(screen.getByRole("button", { name: "玩些别的" }));
    expect(screen.getByRole("button", { name: `来下五子棋吗？选择角色：${CHARACTERS.nabomo.name}` })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "返回" }));
    fireEvent.click(screen.getAllByRole("button", { name: "星炬对弈" }).at(-1));
    expect(screen.getByRole("button", { name: "常规匹配选择角色" })).toBeTruthy();
  });
  it("saves team order without queuing and reuses it from the card", () => {
    const { props, unmount } = setup();
    fireEvent.click(screen.getAllByRole("button", { name: "星炬对弈" }).at(-1));
    fireEvent.click(screen.getByRole("button", { name: "队际赛选择角色2" }));
    for (const id of ["nabomo", "sigrika", "aemeath"]) fireEvent.click(screen.getByRole("button", { name: CHARACTERS[id].name }));
    expect(props.onStartMatch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "完成选人" }));
    fireEvent.click(screen.getByRole("button", { name: "队际赛" }));
    expect(props.onStartMatch).toHaveBeenCalledWith("team", ["nabomo", "sigrika", "aemeath"]);
    unmount();
    setup();
    fireEvent.click(screen.getAllByRole("button", { name: "星炬对弈" }).at(-1));
    expect(screen.getByRole("button", { name: `队际赛选择角色1：${CHARACTERS.nabomo.name}` })).toBeTruthy();
  });
  it("filters stale identities and isolates account changes", () => {
    localStorage.setItem(`sigrika-match-characters:${user.id}`, JSON.stringify({ standard: ["aemeath"], team: ["sigrika", "sigrika", "aemeath"] }));
    const { props, rerender } = setup({ user: { ...user, ownedCharacters: ["sigrika"] } });
    fireEvent.click(screen.getByRole("button", { name: "标准对弈" }));
    fireEvent.click(screen.getByRole("button", { name: "常规匹配" }));
    expect(props.onStartMatch).not.toHaveBeenCalled();
    rerender(<HomeScreen {...props} user={{ ...user, id: "other-player" }} />);
    expect(screen.getByRole("button", { name: "常规匹配选择角色" })).toBeTruthy();
  });
  it("keeps selection usable when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    const { props } = setup();
    select("标准对弈", "aemeath");
    fireEvent.click(screen.getByRole("button", { name: "开始标准对弈匹配" }));
    expect(props.onStartMatch).toHaveBeenCalledWith("standard", undefined, "aemeath");
  });
});
