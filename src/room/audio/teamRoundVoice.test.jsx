// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRoomAudioEffects } from "./useRoomAudioEffects.js";
import { CHARACTERS } from "../../shared/characters.js";
import DesktopViewportGate from "../../app/DesktopViewportGate.jsx";
const voice = vi.hoisted(() => vi.fn());
vi.mock("../../audio/systemVoicePlayback.js", () => ({ playSystemVoice: voice }));
vi.mock("../../audio/playback.jsx", () => ({ playBoardSound: vi.fn(), preloadVoiceSound: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
let roomNumber = 0;
beforeEach(() => { roomNumber += 1; });
function props(round = 1, characterId = "sigrika") {
  const room = { code: `team-test-${roomNumber}`, mode: "team", team: { round }, chat: [],
    game: { phase: "opening", turn: "black", history: [], points: [] },
    players: [{ color: "black", characterId, user: { id: "self", selectedCharacter: "denia" }, time: { main: 300 } }] };
  return { room, displayRoom: room, role: "player", me: room.players[0], characters: CHARACTERS, isReplay: false, audioSettings: {} };
}
describe("team round voice", () => {
  it("does not replay after actual resize events cross the desktop viewport gate", () => {
    const previous = { width: window.innerWidth, height: window.innerHeight };
    const resize = (width, height) => {
      window.innerWidth = width;
      window.innerHeight = height;
      window.dispatchEvent(new Event("resize"));
    };
    try {
      resize(1440, 900);
      const initial = props();
      delete initial.room.team;
      initial.room.game.phase = "playing";
      initial.room.chat = [{ id: "resize-start", kind: "game-start" }];
      renderHook(useRoomAudioEffects, {
        initialProps: initial,
        wrapper: ({ children }) => <DesktopViewportGate>{children}</DesktopViewportGate>
      });
      expect(voice).toHaveBeenCalledOnce();
      act(() => resize(1000, 900));
      act(() => resize(1440, 900));
      expect(voice).toHaveBeenCalledOnce();
    } finally {
      cleanup();
      resize(previous.width, previous.height);
    }
  });

  it("keeps a resumed ordinary start silent after a later remount", () => {
    const initial = props();
    delete initial.room.team;
    initial.room.game.phase = "playing";
    initial.room.chat = [{ id: "resumed-start", kind: "game-start" }];
    initial.room.__audioResumeBaseline = true;
    const view = renderHook(useRoomAudioEffects, { initialProps: initial });
    view.unmount();
    delete initial.room.__audioResumeBaseline;
    renderHook(useRoomAudioEffects, { initialProps: initial });
    expect(voice).not.toHaveBeenCalled();
  });
  it("does not replay a round after the viewport gate remounts the room", () => {
    const view = renderHook(useRoomAudioEffects, { initialProps: props() });
    view.unmount();
    const mounted = renderHook(useRoomAudioEffects, { initialProps: props() });
    expect(voice).toHaveBeenCalledOnce();
    mounted.rerender(props(2, "aemeath"));
    expect(voice).toHaveBeenCalledTimes(2);
  });

  it("deduplicates ordinary starts across remounts while allowing a new start event", () => {
    const initial = props();
    delete initial.room.team;
    initial.room.mode = "spark";
    initial.room.game.phase = "playing";
    initial.room.chat = [{ id: "first", kind: "game-start" }];
    const view = renderHook(useRoomAudioEffects, { initialProps: initial });
    expect(voice).toHaveBeenCalledOnce();
    view.unmount();
    const mounted = renderHook(useRoomAudioEffects, { initialProps: initial });
    expect(voice).toHaveBeenCalledOnce();
    const nextRoom = { ...initial.room, chat: [{ id: "second", kind: "game-start" }] };
    mounted.rerender({ ...initial, room: nextRoom, displayRoom: nextRoom });
    expect(voice).toHaveBeenCalledTimes(2);
  });
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
