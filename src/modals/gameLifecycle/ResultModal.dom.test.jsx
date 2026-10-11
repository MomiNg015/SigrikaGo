// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ResultModal from "./ResultModal.jsx";
import { resultRankDeltaText } from "./lifecycleHelpers.js";
import { CHARACTERS } from "../../shared/characters.js";

vi.mock("../../audio/playback.jsx", () => ({ playEffectSound: vi.fn() }));
vi.mock("../../audio/systemVoicePlayback.js", () => ({ playSystemVoice: vi.fn() }));
afterEach(cleanup);
const user = { id: "self", username: "不能出现的用户名", rank: "3段", stars: 2 };
const room = { code: "done", players: [{ color: "black", characterId: "sigrika", user }], game: { phase: "finished", winner: { winnerColor: "black" }, resultRewards: { self: { rank: 0, stars: 1, rankAfter: "3段", starsAfter: 3, coins: 50 } } } };
describe("compact result actions and rank changes", () => {
  it("omits username and keeps board return separate from leaving", () => {
    const onClose = vi.fn(); const onLeaveRoom = vi.fn();
    render(<ResultModal room={room} user={user} characters={CHARACTERS} onClose={onClose} onLeaveRoom={onLeaveRoom} />);
    expect(screen.queryByText(user.username)).toBeNull();
    expect(screen.getByText("+1星")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "返回棋盘" }));
    expect(onClose).toHaveBeenCalledTimes(1); expect(onLeaveRoom).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "退出房间" }));
    expect(onLeaveRoom).toHaveBeenCalledTimes(1); expect(onClose).toHaveBeenCalledTimes(1);
  });
  it("preserves the special duel continuation without a bypass exit", () => {
    const onSpecialContinue = vi.fn();
    render(<ResultModal room={{ ...room, sigrikaCandyDuel: true }} user={user} characters={CHARACTERS} onClose={vi.fn()} onLeaveRoom={vi.fn()} onSpecialContinue={onSpecialContinue} />);
    expect(screen.queryByRole("button", { name: "退出房间" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "继续" }));
    expect(onSpecialContinue).toHaveBeenCalledWith({ owner: true });
  });
  it.each([
    [{ rank: 0, stars: 1 }, "+1星"], [{ rank: 0, stars: -1 }, "-1星"],
    [{ rank: 1, stars: -4, rankAfter: "5段" }, "+1段"],
    [{ rank: -1, stars: 2, rankAfter: "3段" }, "-1段"],
    [{ rank: 2, stars: -2, rankAfter: "1段" }, "+1段"],
    [{ rank: -2, stars: 2, rankAfter: "1级" }, "-1段"],
    [{ rank: 1, rankAfter: "2级" }, "+1级"],
    [{ rank: 0, stars: 0, rating: -250, rankAfter: "9段" }, "-250分"],
    [{ rank: 0, stars: 0, rating: 0, rankAfter: "3段" }, "无变化"],
    [{ rating: 0, coins: 50 }, ""], [null, ""],
  ])("formats authoritative delta %j as %s", (reward, text) => expect(resultRankDeltaText(reward)).toBe(text));
});
