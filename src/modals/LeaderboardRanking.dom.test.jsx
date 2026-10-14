// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import LeaderboardModal from "./LeaderboardModal.jsx";
import LeaderboardStandings from "./leaderboard/LeaderboardStandings.jsx";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

const player = (id, ranking, extra = {}) => ({ id, username: id, ranking, rank: "3段", stars: 2, totalGames: 2, wins: 1, losses: 1, draws: 0, ...extra });
const standings = (players, user = "b", capture = false, characters = []) => render(<LeaderboardStandings players={players} characters={characters} capture={capture} isCurrentUser={entry => entry.id === user}/>);

it("uses server order for unique places even if an old payload still contains ties", async () => {
  api.mockResolvedValue({ players: [player("a", 1), player("b", 1), player("c", 3), player("d", 4)] });
  const { container } = render(<LeaderboardModal token="token" user={{ id: "b" }} characters={[]} onClose={() => {}} />);
  await waitFor(() => expect(container.querySelectorAll(".lp-winner")).toHaveLength(3));
  expect([...container.querySelectorAll(".lp-winner")].map(row => row.dataset.rank)).toEqual(["1", "2", "3"]);
  expect([...container.querySelectorAll(".lp-scroll > .lp-row")].map(row => row.dataset.rank)).toEqual(["4"]);
  expect(container.querySelector(".lp-pinned").dataset.rank).toBe("2");
  expect(container.querySelectorAll('.lp-scroll [aria-label="第2名 b"]')).toHaveLength(1);
});

it("centers a sole champion without creating runners-up and shows unranked current users", () => {
  const { container, getByText } = standings([player("a", 1)]);
  expect(container.querySelectorAll(".lp-winner")).toHaveLength(1);
  expect(container.querySelector(".lp-winner").style.gridColumn).toBe("2");
  expect(container.querySelector(".lp-columns")).toBeNull();
  expect(getByText("未上榜")).toBeTruthy();
});

it("caps the gold/silver/bronze podium at three and moves remaining equal scorers into the list", () => {
  const { container } = standings([player("a", 1), player("b", 2), player("c", 2), player("d", 2), player("e", 5)]);
  expect(container.querySelectorAll(".lp-winner")).toHaveLength(3);
  expect([...container.querySelectorAll(".lp-winner")].map(row => row.dataset.rank)).toEqual(["1", "2", "3"]);
  expect([...container.querySelectorAll(".lp-scroll > .lp-row")].map(row => row.dataset.rank)).toEqual(["4", "5"]);
});

it("keeps zero-game rates finite and uses shared star caps and nine-dan points", () => {
  const { container } = standings([player("top1", 1), player("top2", 2), player("top3", 3), player("a", 4, { totalGames: 0, wins: 0, rank: "8段", stars: 1 }), player("b", 5, { rank: "9段", rating: 2350 })]);
  expect(container.querySelector(".lp-row .lp-rate b").textContent).toBe("0.0%");
  expect(container.querySelector(".lp-compact-rank").textContent).toBe("8段1/8");
  expect(container.querySelector(".lp-pinned .lp-compact-rank").textContent).toBe("9段2350分");
  expect(container.querySelector(".lp-pinned").dataset.rank).toBe("5");
});

it("uses capture record characters and costume snapshots without match stats", () => {
  const characters = { record: { id: "record", name: "纪录角色", portrait: "/record.webp" }, common: { id: "common", portrait: "/common.webp" } };
  const { container } = standings([player("b", 1, { recordCharacter: "record", commonCharacter: "common", captures: 128, costumeSnapshot: { portraitUrl: "/record-costume.webp" } })], "b", true, characters);
  expect(container.querySelector(".lp-avatar").dataset.characterId).toBe("record");
  expect(container.querySelector(".lp-avatar img").getAttribute("src")).toBe("/record-costume.webp");
  expect(container.querySelector(".lp-captures").textContent).toBe("128子");
  expect(container.querySelector(".lp-metrics")).toBeNull();
  fireEvent.error(container.querySelector(".lp-avatar img"));
  expect(container.querySelector(".lp-avatar-fallback").textContent).toBe("b");
});

it("shows loading, empty and failure states without retaining a stale list", async () => {
  api.mockResolvedValueOnce({ players: [] }).mockRejectedValueOnce(new Error("加载失败"));
  const { getByText, getByRole, container } = render(<LeaderboardModal token="token" user={{ id: "b" }} characters={[]} onClose={() => {}} />);
  expect(getByText("加载中...")).toBeTruthy();
  await waitFor(() => expect(getByText("暂无排行")).toBeTruthy());
  fireEvent.click(getByRole("tab", { name: "吃子赛" }));
  await waitFor(() => expect(getByText("加载失败")).toBeTruthy());
  expect(container.querySelector(".lp-standings")).toBeNull();
});

it("ignores an old mode response after the newer mode has loaded", async () => {
  let resolveOld;
  api.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; })).mockResolvedValueOnce({ players: [player("capture", 1, { captures: 52 })] });
  const { getByRole, container } = render(<LeaderboardModal token="token" user={{ id: "b" }} characters={[]} onClose={() => {}} />);
  fireEvent.click(getByRole("tab", { name: "吃子赛" }));
  await waitFor(() => expect(container.querySelector(".lp-captures")?.textContent).toBe("52子"));
  await act(async () => resolveOld({ players: [player("stale", 1)] }));
  expect(container.querySelector(".lp-winner").getAttribute("aria-label")).toBe("第1名 capture");
});
