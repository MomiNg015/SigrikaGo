// @vitest-environment jsdom
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import LeaderboardModal from "./LeaderboardModal.jsx";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));
afterEach(cleanup);

it("uses server tie rankings in both ordinary rows and the pinned current-user row", async () => {
  api.mockResolvedValue({ players: ["a", "b", "c"].map((id, index) => ({
    id, username: id, ranking: index < 2 ? 1 : 3, rank: "3段", stars: 2,
    totalGames: 2, wins: 1, losses: 1, draws: 0
  })) });
  const { container } = render(<LeaderboardModal token="token" user={{ id: "b" }} characters={[]} onClose={() => {}} />);
  await waitFor(() => expect(container.querySelectorAll(".leaderboard-row")).toHaveLength(4));
  expect([...container.querySelectorAll(".leaderboard-row")].map((row) => row.dataset.rank)).toEqual(["1", "1", "3", "1"]);
});
