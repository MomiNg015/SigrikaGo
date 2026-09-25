// @vitest-environment jsdom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRoomAudioEffects } from "./useRoomAudioEffects.js";
import { CHARACTERS } from "../../shared/characters.js";
const voice = vi.hoisted(() => vi.fn());
vi.mock("../../audio/systemVoicePlayback.js", () => ({ playSystemVoice: voice }));
vi.mock("../../audio/playback.jsx", () => ({ playBoardSound: vi.fn(), preloadVoiceSound: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function props(round = 1, characterId = "sigrika") {
  const room = { code: "team-test", mode: "team", team: { round }, chat: [],
    game: { phase: "opening", turn: "black", history: [], points: [] },
    players: [{ color: "black", characterId, user: { id: "self", selectedCharacter: "denia" }, time: { main: 300 } }] };
  return { room, displayRoom: room, role: "player", me: room.players[0], characters: CHARACTERS, isReplay: false, audioSettings: {} };
}
describe("team round voice", () => {
  it("plays the current own character once per round and suppresses the ordinary start voice", () => {
    const initial = props();
    const { rerender } = renderHook(useRoomAudioEffects, { initialProps: initial });
    expect(voice).toHaveBeenCalledWith("sortie", expect.objectContaining({ character: expect.objectContaining({ id: "sigrika" }) }));
    rerender(props());
    expect(voice).toHaveBeenCalledOnce();
    const second = props(2, "aemeath");
    rerender(second);
    expect(voice).toHaveBeenCalledTimes(2);
    expect(voice.mock.calls[1][1].character.id).toBe("aemeath");
    rerender({ ...second, displayRoom: { ...second.room, chat: [{ id: "start", kind: "game-start" }], game: { ...second.room.game, phase: "playing" } } });
    expect(voice).toHaveBeenCalledTimes(2);
  });
  it("never plays sortie to spectators or during replay", () => {
    const view = renderHook(useRoomAudioEffects, { initialProps: { ...props(), role: "spectator" } });
    expect(voice).not.toHaveBeenCalled();
    view.rerender({ ...props(), role: "player", isReplay: true });
    expect(voice).not.toHaveBeenCalled();
  });
  it("does not replay the resumed round's voice, but plays the next round", () => {
    const resumed = props(2, "aemeath");
    resumed.room.__audioResumeBaseline = true;
    const view = renderHook(useRoomAudioEffects, { initialProps: resumed });
    expect(voice).not.toHaveBeenCalled();
    view.rerender(props(2, "aemeath"));
    expect(voice).not.toHaveBeenCalled();
    view.rerender(props(3, "nabomo"));
    expect(voice).toHaveBeenCalledWith("sortie", expect.objectContaining({ character: expect.objectContaining({ id: "nabomo" }) }));
  });
});
