// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHARACTER_SYSTEM_VOICES } from "../../shared/musicLibrary.js";
import { useRoomCountdownClock } from "../view/useRoomCountdownClock.js";
import { useRoomAudioEffects } from "./useRoomAudioEffects.js";

const audio = vi.hoisted(() => ({ playPreloadedVoiceSound: vi.fn(), preloadVoiceSound: vi.fn(), playBoardSound: vi.fn(), speakText: vi.fn() }));
vi.mock("../../audio/playback.jsx", () => audio);

const characters = Object.keys(CHARACTER_SYSTEM_VOICES).filter((id) => CHARACTER_SYSTEM_VOICES[id]["countdown-10"]);
function makeRoom(characterId, seconds) {
  return {
    code: "sync", chat: [], game: { phase: "playing", turn: "black", history: [], points: [] },
    players: [{ color: "black", characterId, connected: true, user: { id: "player" }, time: { main: 0, periods: 3, periodRemaining: seconds } }]
  };
}
function useCountdown(room) {
  const displayRoom = useRoomCountdownClock(room, true);
  useRoomAudioEffects({ activePlayer: displayRoom.players[0], audioSettings: { master: 100, voice: 100 }, characters: [], displayRoom, isReplay: false, me: displayRoom.players[0], replayStep: null, role: "player", room });
  return displayRoom.players[0].time.periodRemaining;
}

describe("every character's visual/voice countdown synchronization", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
    vi.clearAllMocks();
  });
  afterEach(() => vi.useRealTimers());

  it.each(characters)("keeps %s digits on the shared clock despite packet jitter", (id) => {
    const played = [];
    audio.playPreloadedVoiceSound.mockImplementation((src) => { played.push({ src, at: performance.now() }); });
    const { result, rerender, unmount } = renderHook(({ room }) => useCountdown(room), { initialProps: { room: makeRoom(id, 10) } });
    expect(result.current).toBe(10);
    for (let seconds = 9; seconds >= 1; seconds -= 1) {
      const expectedAt = (10 - seconds) * 1000;
      const receivedAt = expectedAt + (seconds % 2 ? -150 : 180);
      if (receivedAt > expectedAt) {
        act(() => vi.advanceTimersByTime(expectedAt - performance.now()));
        expect(result.current).toBe(seconds);
      }
      act(() => vi.advanceTimersByTime(receivedAt - performance.now()));
      rerender({ room: makeRoom(id, seconds) });
      if (receivedAt < expectedAt) {
        expect(result.current).toBe(seconds + 1);
        act(() => vi.advanceTimersByTime(expectedAt - performance.now()));
      }
      expect(result.current).toBe(seconds);
    }
    expect(played).toEqual(Array.from({ length: 10 }, (_, index) => ({ src: CHARACTER_SYSTEM_VOICES[id][`countdown-${10 - index}`], at: index * 1000 })));
    expect(audio.preloadVoiceSound).toHaveBeenCalledTimes(10);
    unmount();
  });

  it("cancels the owned digit when the game finishes and on unmount", () => {
    const cancel = vi.fn();
    audio.playPreloadedVoiceSound.mockReturnValue(cancel);
    const initialRoom = makeRoom("sigrika", 10);
    const { rerender, unmount } = renderHook(({ room }) => useCountdown(room), { initialProps: { room: initialRoom } });
    rerender({ room: { ...initialRoom, game: { ...initialRoom.game, phase: "finished" } } });
    expect(cancel).toHaveBeenCalledOnce();
    expect(audio.playPreloadedVoiceSound).toHaveBeenCalledOnce();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
