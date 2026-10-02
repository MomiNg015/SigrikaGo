import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { areRoomPeopleListPropsEqual } from "./RoomPeopleList.jsx";

describe("RoomPeopleList memo comparison", () => {
  it("stays memoized when room clock ticks only replace player time", () => {
    const baseProps = peopleProps();
    const previous = peopleProps({
      ...baseProps,
      room: roomWithPeople({
        players: [
          player({ color: "black", userId: "black-user", time: { main: 300 } }),
          player({ color: "white", userId: "white-user", time: { main: 300 } })
        ]
      })
    });
    const next = peopleProps({
      ...baseProps,
      room: roomWithPeople({
        players: [
          player({ color: "black", userId: "black-user", time: { main: 299 } }),
          player({ color: "white", userId: "white-user", time: { main: 300 } })
        ]
      })
    });

    expect(areRoomPeopleListPropsEqual(previous, next)).toBe(true);
  });

  it("rerenders when member visibility metadata changes", () => {
    const previous = peopleProps({
      room: roomWithPeople({
        players: [player({ color: "black", userId: "black-user", connected: true })],
        spectators: [spectator({ userId: "spectator-user" })]
      })
    });

    expect(areRoomPeopleListPropsEqual(previous, peopleProps({
      room: roomWithPeople({
        players: [player({ color: "black", userId: "black-user", connected: false })],
        spectators: [spectator({ userId: "spectator-user" })]
      })
    }))).toBe(false);
    expect(areRoomPeopleListPropsEqual(previous, peopleProps({
      room: roomWithPeople({
        players: [player({ color: "black", userId: "black-user", connected: true, username: "Renamed" })],
        spectators: [spectator({ userId: "spectator-user" })]
      })
    }))).toBe(false);
    expect(areRoomPeopleListPropsEqual(previous, peopleProps({
      room: roomWithPeople({
        players: [player({ color: "black", userId: "black-user", connected: true })],
        spectators: [spectator({ userId: "spectator-user" }), spectator({ userId: "new-spectator" })]
      })
    }))).toBe(false);
  });

  it("marks room member ratings with semantic rating typography", () => {
    const source = readFileSync(new URL("./RoomPeopleList.jsx", import.meta.url), "utf8");

    expect(source).toContain('className="text-rating-value">{person.rating}分');
  });
});

function peopleProps(overrides = {}) {
  return {
    room: roomWithPeople(),
    user: { id: "black-user" },
    characters: [],
    token: "token",
    onOpenReplay: noop,
    floatingLayerZ: undefined,
    onFloatingLayerRequest: noop,
    ...overrides
  };
}

function roomWithPeople({ players = [], spectators = [] } = {}) {
  return { code: "12345", players, spectators };
}

function player({ color, userId, username = userId, connected = true, time = { main: 300 } }) {
  return {
    color,
    connected,
    time,
    user: user({ id: userId, username })
  };
}

function spectator({ userId, username = userId }) {
  return { user: user({ id: userId, username }) };
}

function user({ id, username }) {
  return {
    id,
    username,
    rank: "3段",
    rating: 1000,
    achievementEquipment: null,
    achievementEquipmentAssets: null
  };
}

function noop() {}
