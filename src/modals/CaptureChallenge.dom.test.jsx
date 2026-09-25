// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CHARACTERS } from "../shared/characters.js";
import { CAPTURE_CHALLENGE_MODE, captureChallengeResultText } from "../shared/captureChallenge.js";
import HomeScreen from "../home/HomeScreen.jsx";
import LeaderboardModal from "./LeaderboardModal.jsx";
import ResultModal from "./gameLifecycle/ResultModal.jsx";
import OpeningModal from "./gameLifecycle/OpeningModal.jsx";
import { api } from "../api/client.js";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));
vi.mock("../audio/playback.jsx", () => ({ playEffectSound: vi.fn() }));
vi.mock("../audio/systemVoicePlayback.js", () => ({ playSystemVoice: vi.fn() }));
import { playSystemVoice } from "../audio/systemVoicePlayback.js";

afterEach(() => { cleanup(); vi.clearAllMocks(); });
const user = { id: "a", username: "挑战者", selectedCharacter: "sigrika", modeStats: {} };
const room = {
  matchSource: "practice", rated: false,
  practice: { challenge: CAPTURE_CHALLENGE_MODE, humanColor: "black", result: { captures: 23, rank: 2, breakthrough: true } },
  players: [{ color: "black", characterId: "sigrika", user }],
  game: { phase: "finished", winner: { reason: "capture-challenge", text: captureChallengeResultText(23, 2) } }
};

describe("capture challenge player flow", () => {
  it("starts advanced random-color challenge directly from the picker", async () => {
    const onStartPractice = vi.fn();
    render(<HomeScreen user={user} characters={CHARACTERS} matchModePickerOpen onStartPractice={onStartPractice} onStartMatch={vi.fn()} onMatchModePickerOpenChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /星炬对弈.*匹配中/ }));
    fireEvent.click(screen.getByRole("button", { name: "吃子挑战赛" }));
    expect(onStartPractice).toHaveBeenCalledWith({ difficulty: "advanced", playerColor: "random", challenge: CAPTURE_CHALLENGE_MODE });
  });

  it("displays tied server ranks and the record character including my pinned row", async () => {
    api.mockImplementation((url) => Promise.resolve({ players: url.includes(CAPTURE_CHALLENGE_MODE) ? [
      { id: "b", username: "第一名", rank: "3段", captures: 30, ranking: 1, recordCharacter: "sigrika" },
      { id: "a", username: user.username, rank: "4段", captures: 23, ranking: 2, recordCharacter: "denia", commonCharacter: "sigrika" },
      { id: "c", username: "并列玩家", rank: "3段", captures: 23, ranking: 2, recordCharacter: "sigrika" },
      { id: "d", username: "第四名", rank: "3段", captures: 0, ranking: 4, recordCharacter: "sigrika" }
    ] : [] }));
    const events = userEvent.setup();
    const { container } = render(<LeaderboardModal token="test" user={user} characters={CHARACTERS} onClose={vi.fn()} />);
    await events.click(screen.getByRole("tab", { name: "吃子赛" }));
    await screen.findByText("第四名");
    expect(api).toHaveBeenLastCalledWith(`/api/leaderboard?mode=${CAPTURE_CHALLENGE_MODE}`, { token: "test" });
    const rows = [...container.querySelectorAll(".leaderboard-list .leaderboard-row")];
    expect(rows.map((row) => row.dataset.rank)).toEqual(["1", "2", "2", "4"]);
    expect(rows[1].querySelector(".leaderboard-avatar").dataset.characterId).toBe("denia");
    expect(within(container.querySelector(".leaderboard-current")).getByText("#2")).toBeTruthy();
    expect(screen.queryByText("常用角色")).toBeNull();
    expect(screen.queryByText("胜率")).toBeNull();
    expect(screen.getByText("纪录角色")).toBeTruthy();
  });

  it("shows the exact result and breakthrough without a draw voice or label", () => {
    render(<ResultModal room={room} user={user} characters={CHARACTERS} onClose={vi.fn()} />);
    expect(screen.getByText("挑战完成")).toBeTruthy();
    expect(screen.getByText("你这次提了23个子，位列总排名中的第2位，可喜可贺！")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("突破个人最高排名！");
    expect(screen.queryByText("平局")).toBeNull();
    expect(playSystemVoice).not.toHaveBeenCalled();
  });

  it("omits breakthrough and clearly marks an early finish", () => {
    const early = { ...room, practice: { ...room.practice, result: null }, game: { ...room.game, winner: { reason: "resign", winnerColor: "white" } } };
    render(<ResultModal room={early} user={user} characters={CHARACTERS} onClose={vi.fn()} />);
    expect(screen.getByText("挑战未完成")).toBeTruthy();
    expect(screen.getByText("本次挑战未满100手，成绩不计入排行榜。")).toBeTruthy();
    expect(screen.queryByText("突破个人最高排名！")).toBeNull();
  });

  it("shows challenge rules instead of the ordinary 22-capture victory rule", () => {
    render(<OpeningModal room={room} player={{ color: "black" }} />);
    expect(screen.getByText("吃子挑战赛！双方共100手，只计提子，不可数子。")).toBeTruthy();
    expect(screen.queryByText(/22颗/)).toBeNull();
  });
});
