import { describe, expect, it } from "vitest";
import { areOperationHintPropsEqual } from "./OperationHint.jsx";

describe("OperationHint memo comparison", () => {
  it("stays memoized when room clock ticks only replace player time", () => {
    const previous = hintProps({
      room: roomState({
        players: [
          player({ color: "black", userId: "black-user", time: { main: 300 } }),
          player({ color: "white", userId: "white-user", time: { main: 300 } })
        ]
      })
    });
    const next = hintProps({
      room: roomState({
        players: [
          player({ color: "black", userId: "black-user", time: { main: 299 } }),
          player({ color: "white", userId: "white-user", time: { main: 300 } })
        ]
      })
    });

    expect(areOperationHintPropsEqual(previous, next)).toBe(true);
  });

  it("rerenders when action-relevant room state changes", () => {
    const previous = hintProps({
      room: roomState({
        game: { phase: "playing", turn: "black" },
        players: [
          player({ color: "black", userId: "black-user" }),
          player({ color: "white", userId: "white-user" })
        ]
      })
    });

    expect(areOperationHintPropsEqual(previous, hintProps({
      room: roomState({
        game: { phase: "playing", turn: "white" },
        players: previous.room.players
      })
    }))).toBe(false);
    expect(areOperationHintPropsEqual(previous, hintProps({
      room: roomState({
        game: { phase: "finished", turn: "black" },
        players: previous.room.players
      })
    }))).toBe(false);
    expect(areOperationHintPropsEqual(previous, hintProps({
      room: roomState({
        game: { phase: "playing", turn: "black" },
        players: [
          player({ color: "black", userId: "other-user" }),
          player({ color: "white", userId: "white-user" })
        ]
      })
    }))).toBe(false);
  });
});

function hintProps(overrides = {}) {
  return {
    room: roomState(),
    user: { id: "black-user" },
    scoring: null,
    drawRequest: null,
    ...overrides
  };
}

function roomState({ game = { phase: "playing", turn: "black" }, players = [] } = {}) {
  return { code: "12345", game, players };
}

function player({ color, userId, time = { main: 300 } }) {
  return { color, time, user: { id: userId } };
}
