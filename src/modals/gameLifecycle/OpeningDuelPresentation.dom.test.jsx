// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OpeningModal from "./OpeningModal.jsx";
import { normalizeRoomSnapshot } from "../../app/roomSnapshot.js";

let images;
let imageReady;
const player = { color: "white", characterId: "sigrika", user: { id: "self" } };
function room(overrides = {}) {
  return {
    code: "12345", role: "player", __openingPresentation: true,
    game: { phase: "opening" },
    openingEndsAt: Date.now() + 3000,
    players: [player, { color: "black", characterId: "denia", user: { id: "other" }, costumeSnapshot: { portraitUrl: "/costume.webp", portraitScalePercent: 110 } }],
    ...overrides
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(10000);
  images = [];
  imageReady = true;
  vi.stubGlobal("Image", class {
    constructor() { this.complete = imageReady; this.naturalWidth = imageReady ? 900 : 0; images.push(this); }
  });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("opening duel presentation", () => {
  it.each(["black", "white"])("keeps the local %s player on the self side independent of stone color", (color) => {
    const human = { ...player, color };
    const opponent = { ...player, color: color === "black" ? "white" : "black" };
    render(<OpeningModal room={room({ players: [opponent, human] })} player={human} />);
    expect(document.querySelector(".opening-duel-self").classList.contains(`opening-duel-${color}`)).toBe(true);
    expect(document.querySelector(".opening-duel-opponent").classList.contains(`opening-duel-${opponent.color}`)).toBe(true);
  });

  it("shows complete usernames under their stone-color portraits", () => {
    const blackName = "一段很长的黑方用户名";
    const whiteName = "LongWhitePlayerUsername";
    render(<OpeningModal room={room({ players: [
      { ...player, color: "black", user: { username: blackName } },
      { ...player, color: "white", user: { username: whiteName } }
    ] })} player={player} />);
    expect(document.querySelector(".opening-duel-black .opening-duel-username").textContent).toBe(blackName);
    expect(document.querySelector(".opening-duel-white .opening-duel-username").textContent).toBe(whiteName);
  });

  it.each([-60000, 60000])("shows the opening when the device clock differs from the server by %s ms", (offset) => {
    const snapshot = normalizeRoomSnapshot(room({ openingServerNow: Date.now() - offset, openingEndsAt: Date.now() - offset + 3000 }));
    const { rerender } = render(<OpeningModal room={snapshot} player={player} />);
    expect(document.querySelector(".opening-duel")).toBeTruthy();
    expect(screen.getByText("3 秒后正式开始")).toBeTruthy();
    act(() => vi.advanceTimersByTime(1000));
    rerender(<OpeningModal room={{ ...snapshot, __openingEndsAt: Date.now() + 3000 }} player={player} />);
    expect(screen.getByText("2 秒后正式开始")).toBeTruthy();
    act(() => vi.advanceTimersByTime(2000));
    expect(document.querySelector(".opening-duel,.opening-backdrop")).toBeNull();
  });

  it.each(["black", "white"])("uses the dedicated practice bot portrait when the bot plays %s without a character", (color) => {
    const human = { ...player, color: color === "black" ? "white" : "black" };
    const bot = { color, isBot: true, character: null, characterId: null, botProfile: { name: "准时宝", portraitUrl: "/practice-bot.webp" } };
    render(<OpeningModal room={room({ matchSource: "practice", players: [human, bot] })} player={human} />);
    const image = document.querySelector(`.opening-duel-${color} img`);
    expect(image.getAttribute("src")).toBe("/practice-bot.webp");
    expect(image.alt).toContain("准时宝");
    expect(document.querySelector(".opening-backdrop")).toBeNull();
  });

  it("orders by stone color, preserves costume framing and uses the server deadline", () => {
    render(<OpeningModal room={room()} player={player} />);
    const black = document.querySelector(".opening-duel-black img");
    expect(black.getAttribute("src")).toBe("/costume.webp");
    expect(black.style.scale).toBe("1.1");
    expect(document.querySelector(".opening-duel-white img").alt).toMatch(/^白方/);
    expect(screen.getByText("本局你执白")).toBeTruthy();
    expect(document.querySelector(".opening-duel").style.getPropertyValue("--opening-hold")).toBe("2600ms");
    act(() => vi.advanceTimersByTime(3000));
    expect(document.querySelector(".opening-duel")).toBeNull();
    expect(document.querySelector(".opening-backdrop")).toBeNull();
  });

  it.each([
    { __openingPresentation: false }, { role: "spectator" },
    { players: [player, { color: "black", character: null }] }
  ])("keeps simple opening for ineligible rooms: %j", (overrides) => {
    render(<OpeningModal room={room(overrides)} player={player} />);
    expect(document.querySelector(".opening-duel")).toBeNull();
    expect(screen.getByText("3 秒后正式开始")).toBeTruthy();
  });

  it("never interrupts the simple countdown with late-loading portraits", () => {
    imageReady = false;
    render(<OpeningModal room={room()} player={player} />);
    act(() => vi.advanceTimersByTime(201));
    act(() => images.forEach((image) => { image.complete = true; image.naturalWidth = 900; image.onload?.(); }));
    expect(document.querySelector(".opening-duel")).toBeNull();
    expect(document.querySelector(".opening-backdrop")).toBeTruthy();
  });

  it("immediately cancels on reconnection", () => {
    const snapshot = room();
    const { rerender } = render(<OpeningModal room={snapshot} player={player} />);
    expect(document.querySelector(".opening-duel")).toBeTruthy();
    rerender(<OpeningModal room={{ ...snapshot, __openingPresentation: false }} player={player} />);
    expect(document.querySelector(".opening-duel")).toBeNull();
    expect(document.querySelector(".opening-backdrop")).toBeTruthy();
  });

  it("does not begin an entrance when less than entry plus exit time remains", () => {
    render(<OpeningModal room={room({ openingEndsAt: Date.now() + 700 })} player={player} />);
    expect(document.querySelector(".opening-duel")).toBeNull();
  });

  it("preserves capture challenge rules in the cinematic", () => {
    render(<OpeningModal room={room({ matchSource: "practice", practice: { challenge: "capture-challenge" } })} player={player} />);
    expect(screen.getByText("吃子挑战赛！双方共100手，只计提子，不可数子。")).toBeTruthy();
  });

  it("allows the capture bot portrait to finish loading after the ordinary 200ms grace", () => {
    imageReady = false;
    render(<OpeningModal room={room({ matchSource: "practice", practice: { challenge: "capture-challenge" } })} player={player} />);
    act(() => vi.advanceTimersByTime(300));
    act(() => images.forEach((image) => { image.complete = true; image.naturalWidth = 900; image.onload?.(); }));
    expect(document.querySelector(".opening-duel")).toBeTruthy();
  });

  it("falls back if a portrait fails to load", () => {
    imageReady = false;
    render(<OpeningModal room={room()} player={player} />);
    act(() => images[0].onerror());
    expect(document.querySelector(".opening-duel")).toBeNull();
    expect(document.querySelector(".opening-backdrop")).toBeTruthy();
  });
});
