// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import HomeScreen from "./HomeScreen.jsx";
import MatchCharacterCardContent from "./MatchCharacterCardContent.jsx";
import { CHARACTERS } from "../shared/characters.js";

afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });
const user = { id: "selection-player", selectedCharacter: "sigrika", ownedCharacters: ["sigrika", "aemeath", "nabomo"] };
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
function select(title, id) {
  fireEvent.click(screen.getByRole("button", { name: `${title}选择角色` }));
  fireEvent.click(screen.getByRole("button", { name: CHARACTERS[id].name }));
}
describe("match card character selection", () => {
  it.each(["标准对弈", "来下五子棋吗？", "常规匹配", "吃子挑战赛", "队际赛"])("blocks %s without a selection", (title) => {
    const { props, container } = setup();
    if (!["标准对弈", "来下五子棋吗？"].includes(title)) fireEvent.click(screen.getAllByRole("button", { name: "星炬对弈" }).at(-1));
    fireEvent.click(screen.getByRole("button", { name: title }));
    expect(props.onNotice).toHaveBeenCalledWith("尚未选择角色，无法匹配");
    expect(props.onStartMatch).not.toHaveBeenCalled();
    expect(props.onStartPractice).not.toHaveBeenCalled();
    expect(container.querySelector(".match-mode-count")).toBeNull();
  });
  it("persists separate entries and sends the shown identity instead of the default", () => {
    const { props, unmount } = setup();
    select("标准对弈", "aemeath");
    expect(screen.queryByRole("dialog", { name: "选择角色" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "标准对弈" }));
    expect(props.onStartMatch).toHaveBeenCalledWith("standard", undefined, "aemeath");
    select("来下五子棋吗？", "nabomo");
    unmount();
    setup();
    expect(screen.getByRole("button", { name: `标准对弈选择角色：${CHARACTERS.aemeath.name}` })).toBeTruthy();
    expect(screen.getByRole("button", { name: `来下五子棋吗？选择角色：${CHARACTERS.nabomo.name}` })).toBeTruthy();
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
    expect(props.onStartMatch).not.toHaveBeenCalled();
    rerender(<HomeScreen {...props} user={{ ...user, id: "other-player" }} />);
    expect(screen.getByRole("button", { name: "标准对弈选择角色" })).toBeTruthy();
  });
  it("keeps selection usable when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    const { props } = setup();
    select("标准对弈", "aemeath");
    fireEvent.click(screen.getByRole("button", { name: "标准对弈" }));
    expect(props.onStartMatch).toHaveBeenCalledWith("standard", undefined, "aemeath");
  });
});
