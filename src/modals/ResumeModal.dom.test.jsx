// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import ResumeModal from "./ResumeModal.jsx";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));

describe("ResumeModal authoritative record stats", () => {
  beforeEach(() => {
    api.mockReset();
  });

  it("uses the same server profile stats shown in user details instead of replay-page rows", async () => {
    api.mockResolvedValue({
      profile: {
        id: "user-1",
        username: "moming",
        rating: 1260,
        rank: "4段",
        recentResults: ["win", "loss"],
        recordStats: { totalGames: 12, wins: 7, losses: 3, draws: 2 },
        characterStats: [{
          characterId: "sigrika",
          total: 12,
          wins: 7,
          losses: 3,
          draws: 2,
          winRate: "58.3%"
        }]
      }
    });

    render(
      <ResumeModal
        user={{
          id: "user-1",
          username: "moming",
          rating: 900,
          rank: "2段",
          coins: 100,
          itemEffects: {},
          modeStats: {
            spark: { rating: 900, rank: "2段", recentResults: [], wins: 1, losses: 0, draws: 0 }
          }
        }}
        token="token"
        characterListView={[{ id: "sigrika", name: "西格莉卡", portrait: "/sigrika.webp" }]}
        onClose={() => {}}
        onOpenAchievements={() => {}}
        onOpenPersonalization={() => {}}
        onOpenReplay={() => {}}
      />
    );

    await waitFor(() => expect(screen.getAllByText("12局").length).toBeGreaterThan(0));
    expect(screen.getByText("7胜3负2和")).toBeTruthy();
    expect(screen.getByText("58.3%")).toBeTruthy();
    expect(screen.getByText("1260")).toBeTruthy();
    expect(api).toHaveBeenCalledWith("/api/users/user-1/profile?mode=spark", { token: "token" });
  });
});
