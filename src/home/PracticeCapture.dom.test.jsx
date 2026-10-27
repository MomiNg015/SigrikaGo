// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import HomeScreen from "./HomeScreen.jsx";
import LeaderboardModal from "../modals/LeaderboardModal.jsx";
import { CHARACTERS } from "../shared/characters.js";
import { api } from "../api/client.js";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));
vi.mock("./matchSortieVoice.js", () => ({ playMatchSortieVoice: vi.fn() }));
const user = { id: "practice-user", username: "同学", ownedCharacters: ["sigrika", "denia"], modeStats: {} };
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); vi.clearAllMocks(); });
const click = name => fireEvent.click(screen.getByRole("button", { name, exact: true }));
function setup(extra = {}) {
  const props = { user, token: "session", characters: CHARACTERS, matchModePickerOpen: true, onStartPractice: vi.fn(), ...extra };
  const view = render(<HomeScreen {...props} />);
  click("准时宝陪练");
  return { ...view, props };
}
function selectCharacter() {
  click("准时宝对局选择角色");
  click(CHARACTERS.denia.name);
  click("关闭选择角色");
}

it("requires both selections, cycles once per click, shares the character and keeps capture advanced", () => {
  const { props } = setup();
  expect(screen.getByText("今天想找准时宝做什么呢？")).toBeTruthy();
  expect(screen.getByRole("button", { name: "START！" }).disabled).toBe(true);
  selectCharacter();
  expect(screen.getByRole("button", { name: "START！" }).disabled).toBe(true);
  for (const [current, next] of [["初级", "中级"], ["中级", "高级"], ["高级", "初级"]]) {
    click(`陪练等级：${current}，点击切换`);
    expect(screen.getByRole("button", { name: `陪练等级：${next}，点击切换` })).toBeTruthy();
    expect(screen.getByRole("button", { name: "沙包陪练" }).getAttribute("aria-pressed")).toBe("true");
  }
  click("吃子挑战赛");
  expect(screen.getByAltText("西格莉卡（惊讶）").getAttribute("src")).toContain("/sigrika/surprised.webp");
  expect(screen.getByText("随机猜先。在100手内尽可能多地提掉准时宝的棋子吧！吃得越多分数越高！")).toBeTruthy();
  click("START！");
  expect(props.onStartPractice).toHaveBeenLastCalledWith({ difficulty: "advanced", challenge: "capture-challenge", playerColor: "random", characterId: "denia" });
  click("沙包陪练");
  click("START！");
  expect(props.onStartPractice).toHaveBeenLastCalledWith({ difficulty: "beginner", playerColor: "random", characterId: "denia" });
});

it("restores the mode, difficulty and shared character on reopen/reload and isolates accounts", () => {
  const first = setup();
  selectCharacter();
  click("陪练等级：初级，点击切换");
  click("吃子挑战赛");
  click("关闭准时宝陪练");
  click("准时宝陪练");
  expect(screen.getByRole("button", { name: "吃子挑战赛" }).getAttribute("aria-pressed")).toBe("true");
  first.unmount();
  const second = setup();
  expect(screen.getByRole("button", { name: "START！" }).disabled).toBe(false);
  expect(screen.getByRole("button", { name: "陪练等级：中级，点击切换" })).toBeTruthy();
  second.rerender(<HomeScreen {...second.props} user={{ ...user, id: "another" }} />);
  expect(screen.getByText("今天想找准时宝做什么呢？")).toBeTruthy();
  expect(screen.getByRole("button", { name: "START！" }).disabled).toBe(true);
  expect(screen.getByRole("button", { name: "陪练等级：初级，点击切换" })).toBeTruthy();
  second.rerender(<HomeScreen {...second.props} user={{ ...user, ownedCharacters: ["sigrika"] }} />);
  expect(screen.getByRole("button", { name: "吃子挑战赛" }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByRole("button", { name: "START！" }).disabled).toBe(true);
});

it("opens the capture-only leaderboard without selecting a mode and closes only its layer", async () => {
  api.mockResolvedValue({ players: [] });
  setup();
  const trigger = screen.getByRole("button", { name: "吃子挑战赛排行榜" });
  trigger.focus();
  fireEvent.click(trigger);
  const board = await screen.findByRole("dialog", { name: "吃子挑战赛排行榜" });
  await within(board).findByText("暂无排行");
  expect(api).toHaveBeenCalledWith("/api/leaderboard?mode=capture-challenge", { token: "session" });
  expect(within(board).queryByRole("tab")).toBeNull();
  fireEvent.keyDown(board, { key: "Escape" });
  expect(screen.queryByRole("dialog", { name: "吃子挑战赛排行榜" })).toBeNull();
  expect(document.activeElement).toBe(trigger);
  expect(screen.getByText("今天想找准时宝做什么呢？")).toBeTruthy();
  expect(screen.getByRole("button", { name: "START！" }).disabled).toBe(true);
  click("吃子挑战赛排行榜");
  const reopened = await screen.findByRole("dialog", { name: "吃子挑战赛排行榜" });
  fireEvent.click(reopened.parentElement);
  expect(screen.getByRole("dialog", { name: "准时宝陪练" })).toBeTruthy();
});

it("keeps ordinary ranking tabs and supports capture request errors", async () => {
  api.mockRejectedValue(new Error("榜单加载失败"));
  const view = render(<LeaderboardModal token="session" user={user} characters={CHARACTERS} onClose={vi.fn()} />);
  expect(screen.getAllByRole("tab").map(element => element.textContent)).toEqual(["星炬", "标准", "五子棋"]);
  view.unmount();
  setup();
  click("吃子挑战赛排行榜");
  await waitFor(() => expect(screen.getByText("榜单加载失败")).toBeTruthy());
});

it.each(["broken-json", JSON.stringify({ mode: "unknown", difficulty: "legacy" })])("recovers from invalid preferences %s", saved => {
  localStorage.setItem(`sigrika-practice-options:${user.id}`, saved);
  setup();
  expect(screen.getByText("今天想找准时宝做什么呢？")).toBeTruthy();
  expect(screen.getByRole("button", { name: "陪练等级：初级，点击切换" })).toBeTruthy();
});

it("keeps selections usable and remembers them while mounted if storage is blocked", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  const { props } = setup();
  selectCharacter();
  click("陪练等级：初级，点击切换");
  click("关闭准时宝陪练");
  click("准时宝陪练");
  click("START！");
  expect(props.onStartPractice).toHaveBeenCalledWith({ difficulty: "intermediate", playerColor: "random", characterId: "denia" });
});
