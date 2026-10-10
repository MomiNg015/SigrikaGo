// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import { CHARACTERS } from "../shared/characters.js";
import ProfileResumeView from "./ProfileResumeView.jsx";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));
afterEach(cleanup);
beforeEach(() => api.mockReset());
const props = { context: "self", user: { id: "a", username: "部员", rank: "5级" }, characters: CHARACTERS, mode: "spark", token: "token", stats: {} };

describe("profile folder play navigation", () => {
  it("keeps rank on the record page and replaces it with challenge results", async () => {
    api.mockResolvedValue({ record: { captures: 86, ranking: 12, characterId: "sigrika", costumeSnapshot: { portraitUrl: "/best.webp" } } });
    const { container } = render(<ProfileResumeView {...props} />);
    expect(screen.getByText("段位").closest(".profile-folder-page")).toBeTruthy();
    expect(container.querySelector(".profile-resume-hero .rank-progress")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "吃子挑战赛" }));
    await screen.findByLabelText("吃子挑战成绩");
    expect(screen.queryByText("段位", { exact: true })).toBeNull();
    expect(screen.getByText("86")).toBeTruthy();
    expect(container.querySelector(".profile-capture-character img").getAttribute("src")).toBe("/best.webp");
    expect(api).toHaveBeenCalledWith("/api/users/a/capture-record", { token: "token" });
  });

  it("shows request errors and retries without presenting a false empty record", async () => {
    api.mockRejectedValueOnce(new Error("网络不可用")).mockResolvedValueOnce({ record: null });
    render(<ProfileResumeView {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "吃子挑战赛" }));
    await screen.findByRole("alert");
    expect(screen.queryByText("暂无吃子挑战成绩")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "重新加载" }));
    await screen.findByText("暂无吃子挑战成绩");
  });

  it("ignores an old user's challenge response after the profile changes", async () => {
    let resolveOld;
    api.mockReturnValueOnce(new Promise(resolve => { resolveOld = resolve; })).mockResolvedValueOnce({ record: null });
    const { rerender } = render(<ProfileResumeView {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "吃子挑战赛" }));
    rerender(<ProfileResumeView {...props} user={{ id: "b", rank: "1段" }} />);
    fireEvent.click(screen.getByRole("button", { name: "吃子挑战赛" }));
    await screen.findByText("暂无吃子挑战成绩");
    resolveOld({ record: { captures: 999, ranking: 1, characterId: "sigrika" } });
    await waitFor(() => expect(screen.queryByText("999")).toBeNull());
  });

  it("requests the independent team profile before changing the selected play", () => {
    const onModeChange = vi.fn();
    const { rerender } = render(<ProfileResumeView {...props} onModeChange={onModeChange} />);
    fireEvent.click(screen.getByRole("button", { name: "队际赛" }));
    expect(onModeChange).toHaveBeenCalledWith("team");
    expect(screen.getByText("升降级战绩")).toBeTruthy();
    rerender(<ProfileResumeView {...props} mode="team" recentResults={["win", "draw", "loss"]}
      characterStats={[{ characterId: "sigrika", total: 3, wins: 1, losses: 1, draws: 1 }]} />);
    expect(screen.getByText("队际赛战绩")).toBeTruthy();
    expect(screen.getByText("段位", { exact: true })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "出场次数" })).toBeTruthy();
    expect(document.querySelector(".recent-result-marker-draw").textContent).toBe("和");
    expect(screen.getByRole("button", { name: "队际赛" }).getAttribute("aria-pressed")).toBe("true");
  });
});
