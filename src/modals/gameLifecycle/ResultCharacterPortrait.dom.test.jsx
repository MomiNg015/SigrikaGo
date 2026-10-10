// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ResultModal from "./ResultModal.jsx";
import ResultCharacterPortrait from "./ResultCharacterPortrait.jsx";
import { CHARACTERS } from "../../shared/characters.js";
import { RESULT_CHARACTER_EXPRESSIONS } from "../../shared/resultCharacterPortraits.js";

vi.mock("../../audio/playback.jsx", () => ({ playEffectSound: vi.fn() }));
vi.mock("../../audio/systemVoicePlayback.js", () => ({ playSystemVoice: vi.fn() }));
afterEach(cleanup);
const user = { id: "self", username: "测试玩家" };
function roomFor(id, winnerColor = "black") {
  return { rated: false, players: [
    { color: "black", characterId: id, user },
    { color: "white", characterId: "sigrika", user: { id: "opponent" } }
  ], game: { phase: "finished", winner: { winnerColor, text: "对局结束" } } };
}

describe("result portrait rendering", () => {
  it.each(Object.keys(RESULT_CHARACTER_EXPRESSIONS))("renders %s victory, defeat and draw in the actual result modal", (id) => {
    const props = { user, characters: CHARACTERS, onClose: vi.fn() };
    const { rerender } = render(<ResultModal {...props} room={roomFor(id)} />);
    const expression = () => screen.getByAltText(CHARACTERS[id].name).getAttribute("data-result-expression");
    expect(expression()).toBe(RESULT_CHARACTER_EXPRESSIONS[id].win);
    rerender(<ResultModal {...props} room={roomFor(id, "white")} />);
    expect(expression()).toBe(RESULT_CHARACTER_EXPRESSIONS[id].loss);
    rerender(<ResultModal {...props} room={roomFor(id, null)} />);
    expect(expression()).toBe("surprised");
  });

  it("falls back once to the frozen same-character appearance and resets on the next reaction", () => {
    const props = { character: CHARACTERS.denia, costumeSnapshot: { portraitUrl: "/frozen.webp" } };
    const { rerender } = render(<ResultCharacterPortrait {...props} outcome="win" />);
    fireEvent.error(screen.getByAltText("达妮娅"));
    expect(screen.getByAltText("达妮娅").getAttribute("src")).toBe("/frozen.webp");
    fireEvent.error(screen.getByAltText("达妮娅"));
    expect(screen.getByAltText("达妮娅").getAttribute("src")).toBe("/frozen.webp");
    rerender(<ResultCharacterPortrait {...props} outcome="draw" />);
    expect(screen.getByAltText("达妮娅").getAttribute("src")).toContain("denia/surprised.webp");
  });

  it("gives a spectator the winning actor's victory reaction", () => {
    render(<ResultModal room={roomFor("aemeath")} user={{ id: "spectator" }} characters={CHARACTERS} onClose={vi.fn()} />);
    expect(screen.getByAltText("爱弥斯").getAttribute("data-result-expression")).toBe("closed_smile");
  });
});
