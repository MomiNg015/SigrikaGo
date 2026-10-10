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

  it("loads only team replays and forwards the selected replay id", async () => {
    api.mockResolvedValue({ records: [{ id: "team-1", blackUserId: "a", whiteUserId: "b", winnerColor: "black", resultText: "黑胜", moveCount: 42, createdAt: "2026-10-10", teamLineups: { black: [{ characterId: "sigrika" }], white: [{ characterId: "aemeath" }] } }], nextCursor: null });
    const onOpenReplay = vi.fn();
    render(<ProfileResumeView {...props} onOpenReplay={onOpenReplay} />);
    fireEvent.click(screen.getByRole("button", { name: "队际赛" }));
    await screen.findByText("黑胜");
    expect(screen.queryByText("段位", { exact: true })).toBeNull();
    expect(api.mock.calls[0][0]).toBe("/api/users/a/replays?mode=team");
    fireEvent.click(screen.getByRole("button", { name: "对局回放" }));
    expect(onOpenReplay).toHaveBeenCalledWith("team-1");
  });
});
