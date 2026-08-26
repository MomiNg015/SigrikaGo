// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import ResumeModal from "./ResumeModal.jsx";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));

describe("ResumeModal authoritative record stats", () => {
  afterEach(cleanup);

  beforeEach(() => {
    api.mockReset();
  });

  it("uses the same server profile stats shown in user details instead of replay-page rows", async () => {
    const onOpenAchievements = vi.fn();
    const onOpenPersonalization = vi.fn();
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
        onOpenAchievements={onOpenAchievements}
        onOpenPersonalization={onOpenPersonalization}
        onOpenReplay={() => {}}
      />
    );

    await waitFor(() => expect(screen.getAllByText("12局").length).toBeGreaterThan(0));
    expect(screen.getByRole("cell", { name: "12" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "7" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "3" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "2" })).toBeTruthy();
    expect(screen.getAllByText("58.3%")).toHaveLength(2);
    expect(screen.getByText("1260分")).toBeTruthy();
    expect(document.querySelectorAll(".profile-portrait-mask")).toHaveLength(2);
    expect(document.querySelector(".profile-hero-portrait > .profile-portrait-mask > img")).toBeTruthy();
    expect(document.querySelector(".profile-character-table .profile-chain-portrait.small > .profile-portrait-mask > img")).toBeTruthy();
    expect(screen.getByRole("tooltip", {
      name: "对局中获得的积分会根据对手的实力动态增减。友谊赛不会增减积分。"
    })).toBeTruthy();
    expect(screen.getByRole("tooltip", {
      name: "每个模式独立记录最近十盘：累计7胜升一级或一段，累计8负降一级或一段；升降后重新记录。最高9段，最低18级。"
    })).toBeTruthy();
    expect(screen.getByLabelText("履历操作").textContent).toBe("个性化");
    expect(document.querySelector(".profile-recent-section .profile-section-heading .profile-replay-button")).toBeTruthy();
    expect(screen.queryByText("点赞", { exact: false })).toBeNull();
    expect(screen.queryByText("加好友")).toBeNull();
    expect(screen.queryByText("举报")).toBeNull();
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["星炬", "标准", "五子棋"]);
    expect([...document.querySelector(".resume-header-actions").children].map((element) => {
      if (element.matches(".achievement-entry-action")) return "成就";
      if (element.matches(".resume-wallet")) return "金币";
      if (element.matches(".resume-close-button")) return "关闭";
      return "未知";
    })).toEqual(["成就", "金币", "关闭"]);
    fireEvent.click(screen.getByRole("button", { name: "成就" }));
    fireEvent.click(screen.getByRole("button", { name: "个性化" }));
    expect(onOpenAchievements).toHaveBeenCalledTimes(1);
    expect(onOpenPersonalization).toHaveBeenCalledTimes(1);
    expect(api).toHaveBeenCalledWith("/api/users/user-1/profile?mode=spark", { token: "token" });
  });

  it("keeps the previous mode visible and prevents duplicate requests while switching", async () => {
    const nextModeRequest = deferred();
    api
      .mockResolvedValueOnce({
        profile: {
          id: "user-1",
          username: "moming",
          rating: 1260,
          rank: "4段",
          recordStats: { totalGames: 12, wins: 7, losses: 3, draws: 2 },
          characterStats: []
        }
      })
      .mockReturnValueOnce(nextModeRequest.promise);

    render(
      <ResumeModal
        user={{ id: "user-1", username: "moming", rating: 900, rank: "2段", coins: 100, itemEffects: {} }}
        token="token"
        characterListView={[{ id: "sigrika", name: "西格莉卡", portrait: "/sigrika.webp" }]}
        onClose={() => {}}
        onOpenAchievements={() => {}}
        onOpenPersonalization={() => {}}
        onOpenReplay={() => {}}
      />
    );

    await waitFor(() => expect(screen.getByText("1260分")).toBeTruthy());
    fireEvent.click(screen.getByRole("tab", { name: "标准" }));
    expect(screen.getByText("1260分")).toBeTruthy();
    expect(screen.getByText("正在载入标准战绩，当前仍显示星炬。")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "星炬" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getAllByRole("tab").every((tab) => tab.getAttribute("aria-disabled") === "true")).toBe(true);
    fireEvent.click(screen.getByRole("tab", { name: "五子棋" }));
    expect(api).toHaveBeenCalledTimes(2);

    nextModeRequest.resolve({
      profile: {
        id: "user-1",
        username: "moming",
        rating: 1420,
        rank: "5段",
        recordStats: { totalGames: 20, wins: 12, losses: 7, draws: 1 },
        characterStats: []
      }
    });
    await waitFor(() => expect(screen.getByText("1420分")).toBeTruthy());
    expect(screen.getByRole("tab", { name: "标准" }).getAttribute("aria-selected")).toBe("true");
  });

  it("keeps the selected mode and data aligned after failure, then retries explicitly", async () => {
    const failedRequest = deferred();
    const retryRequest = deferred();
    api
      .mockResolvedValueOnce({
        profile: {
          id: "user-1",
          username: "moming",
          rating: 1260,
          rank: "4段",
          recordStats: { totalGames: 12, wins: 7, losses: 3, draws: 2 },
          characterStats: []
        }
      })
      .mockReturnValueOnce(failedRequest.promise)
      .mockReturnValueOnce(retryRequest.promise);

    render(
      <ResumeModal
        user={{ id: "user-1", username: "moming", rating: 900, rank: "2段", coins: 100, itemEffects: {} }}
        token="token"
        characterListView={[{ id: "sigrika", name: "西格莉卡", portrait: "/sigrika.webp" }]}
        onClose={() => {}}
        onOpenAchievements={() => {}}
        onOpenPersonalization={() => {}}
        onOpenReplay={() => {}}
      />
    );

    await waitFor(() => expect(screen.getByText("1260分")).toBeTruthy());
    fireEvent.click(screen.getByRole("tab", { name: "标准" }));
    failedRequest.reject(new Error("标准模式加载失败"));

    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("标准模式加载失败"));
    expect(screen.getByRole("tab", { name: "星炬" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("1260分")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "重新加载" }));
    expect(api).toHaveBeenCalledTimes(3);
    retryRequest.resolve({
      profile: {
        id: "user-1",
        username: "moming",
        rating: 1500,
        rank: "6段",
        recordStats: { totalGames: 30, wins: 20, losses: 8, draws: 2 },
        characterStats: []
      }
    });

    await waitFor(() => expect(screen.getByText("1500分")).toBeTruthy());
    expect(screen.getByRole("tab", { name: "标准" }).getAttribute("aria-selected")).toBe("true");
  });

  it("connects tabs to one panel and supports arrow-key mode selection", async () => {
    api.mockResolvedValue({
      profile: {
        id: "user-1",
        username: "moming",
        rating: 1260,
        rank: "4段",
        recordStats: { totalGames: 12, wins: 7, losses: 3, draws: 2 },
        characterStats: []
      }
    });

    render(
      <ResumeModal
        user={{ id: "user-1", username: "moming", coins: 100, itemEffects: {} }}
        token="token"
        characterListView={[{ id: "sigrika", name: "西格莉卡", portrait: "/sigrika.webp" }]}
        onClose={() => {}}
        onOpenAchievements={() => {}}
        onOpenPersonalization={() => {}}
        onOpenReplay={() => {}}
      />
    );

    await waitFor(() => expect(screen.getByText("1260分")).toBeTruthy());
    const sparkTab = screen.getByRole("tab", { name: "星炬" });
    const panel = screen.getByRole("tabpanel");
    expect(sparkTab.getAttribute("aria-controls")).toBe(panel.id);
    fireEvent.keyDown(sparkTab, { key: "ArrowRight" });
    await waitFor(() => expect(screen.getByRole("tab", { name: "标准" }).getAttribute("aria-selected")).toBe("true"));
  });
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}
