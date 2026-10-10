// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import ResumeModal from "./ResumeModal.jsx";
import { UserProfileCard } from "./UserProfileCard.jsx";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));
afterEach(cleanup);
beforeEach(() => { api.mockReset(); });

it.each(["self", "social"])("loads independent team stats, retries failures, and scopes %s replay browsing", async (context) => {
  const user = { id: "u", username: "部员", mode: "spark", rank: "8段", stars: 8, recordStats: { totalGames: 20, wins: 12, losses: 8 } };
  const team = { ...user, mode: "team", rank: "4段", stars: 3, recentResults: ["win", "draw", "loss"],
    recordStats: { totalGames: 3, wins: 1, losses: 1, draws: 1 },
    characterStats: [{ characterId: "sigrika", total: 3, wins: 1, losses: 1, draws: 1 }] };
  let rejectTeam;
  let teamCalls = 0;
  api.mockImplementation((url) => {
    if (url.includes("/replays?")) return Promise.resolve({ records: [], nextCursor: null });
    if (url.endsWith("profile?mode=team")) {
      teamCalls += 1;
      if (teamCalls === 1) return new Promise((_resolve, reject) => { rejectTeam = reject; });
      return Promise.resolve({ profile: team });
    }
    return Promise.resolve({ profile: user });
  });
  const props = { user, token: "token", characters: [], characterListView: [], onClose: vi.fn(), onOpenReplay: vi.fn() };
  render(context === "self" ? <ResumeModal {...props} /> : <UserProfileCard {...props} />);
  await waitFor(() => expect(screen.getByRole("button", { name: "队际赛" }).disabled).toBe(false));
  fireEvent.click(screen.getByRole("button", { name: "队际赛" }));
  expect(screen.getByText("8段")).toBeTruthy();
  expect(screen.getByRole("button", { name: "队际赛" }).disabled).toBe(true);
  rejectTeam(new Error("队际赛暂时不可用"));
  await screen.findByRole("alert");
  expect(screen.getByText("8段")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "重新加载" }));
  await screen.findByText("队际赛战绩");
  expect(screen.getByText("4段")).toBeTruthy();
  expect(screen.getByLabelText("总对局 3局")).toBeTruthy();
  expect(screen.getByRole("columnheader", { name: "出场次数" })).toBeTruthy();
  expect(document.querySelector(".recent-result-marker-draw").textContent).toBe("和");
  fireEvent.click(screen.getByRole("button", { name: "对局回放" }));
  await waitFor(() => expect(api.mock.calls.some(([url]) => url.startsWith(context === "self" ? "/api/replays?mode=team" : "/api/users/u/replays?mode=team"))).toBe(true));
  expect(api.mock.calls.filter(([url]) => url.includes("/replays?")).every(([url]) => !url.includes("scope=regular"))).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "关闭对局回放" }));
  fireEvent.click(screen.getByRole("button", { name: "常规匹配" }));
  await screen.findByText("8段");
  expect(screen.getByText("升降级战绩")).toBeTruthy();
});
