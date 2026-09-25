// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import TeamLineupPicker from "./TeamLineupPicker.jsx";
import HomeScreen from "./HomeScreen.jsx";
import { CHARACTERS } from "../shared/characters.js";
afterEach(() => { cleanup(); localStorage.clear(); });
const user = { id: "team-user", selectedCharacter: "sigrika", ownedCharacters: ["sigrika", "aemeath", "nabomo"] };
describe("team selection", () => {
  it("uses click order, removes selected cards and remembers the confirmed lineup", () => {
    const onStart = vi.fn();
    const props = { user, characters: CHARACTERS, onClose: vi.fn(), onStart };
    const view = render(<TeamLineupPicker {...props} />);
    expect(screen.getByRole("heading", { name: "队际赛" }).querySelector("img")?.getAttribute("src")).toBe("/assets/window-titles/team-lineup.webp");
    expect(screen.getByText("(0-40手)")).toBeTruthy();
    expect(screen.getByText("(41-80手)")).toBeTruthy();
    expect(screen.getByText("(81手-终局)")).toBeTruthy();
    expect(screen.getByRole("button", { name: "开始匹配" }).disabled).toBe(true);
    for (const id of user.ownedCharacters) fireEvent.click(screen.getByRole("button", { name: CHARACTERS[id].name }));
    expect(screen.queryByRole("button", { name: /前移|后移/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: CHARACTERS.aemeath.name }));
    fireEvent.click(screen.getByRole("button", { name: CHARACTERS.aemeath.name }));
    fireEvent.click(screen.getByRole("button", { name: "开始匹配" }));
    expect(onStart).toHaveBeenCalledWith("team", ["sigrika", "nabomo", "aemeath"]);
    view.unmount();
    render(<TeamLineupPicker {...props} />);
    expect(within(screen.getByRole("region", { name: "第2位" })).getByAltText(CHARACTERS.nabomo.name).getAttribute("src")).toBeTruthy();
    expect(screen.getByRole("button", { name: "开始匹配" }).disabled).toBe(false);
  });
  it("rejects entering with only two available members", () => {
    const onNotice = vi.fn();
    render(<HomeScreen user={{ ...user, ownedCharacters: user.ownedCharacters.slice(0, 2) }} characters={CHARACTERS} matchModePickerOpen onNotice={onNotice} />);
    fireEvent.click(screen.getByRole("button", { name: /星炬对弈.*匹配中/ }));
    fireEvent.click(screen.getByRole("button", { name: "队际赛" }));
    expect(onNotice).toHaveBeenCalledWith("需要至少拥有3名部员才能参加");
    expect(screen.queryByRole("dialog", { name: "队际赛阵容" })).toBeNull();
  });
  it("drops unavailable saved members without auto-queuing", () => {
    localStorage.setItem(`sigrika-team-lineup:${user.id}`, JSON.stringify(user.ownedCharacters));
    const onStart = vi.fn();
    render(<TeamLineupPicker user={{ ...user, itemEffects: { sigrikaCandyDisabled: true } }} characters={CHARACTERS} onStart={onStart} />);
    expect(screen.getByRole("button", { name: "开始匹配" }).disabled).toBe(true);
    expect(onStart).not.toHaveBeenCalled();
  });
});
