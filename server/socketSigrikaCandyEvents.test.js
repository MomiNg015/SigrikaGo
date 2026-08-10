import { describe, expect, test, vi } from "vitest";
import { registerSigrikaCandySocketEvents } from "./socketSigrikaCandyEvents.js";

function setup({
  phase = "awaiting-duel",
  room = null,
  activeDuel = null,
  roomCode = room?.code ?? "",
  persistedRoomCode = roomCode
} = {}) {
  const handlers = {};
  let persistedUser = {
    id: "user-1",
    username: "moming",
    sigrikaCandyUseCount: 8,
    sigrikaCandyPhase: phase,
    sigrikaCandyOutcome: "",
    sigrikaCandyRoomCode: persistedRoomCode
  };
  const socket = {
    id: "socket-1",
    user: {
      id: "user-1",
      username: "moming",
      sigrikaCandyArc: { phase, roomCode }
    },
    on: vi.fn((event, handler) => {
      handlers[event] = handler;
    }),
    emit: vi.fn()
  };
  const emit = vi.fn();
  const userDelegate = {
    findUnique: vi.fn(async () => ({ ...persistedUser })),
    update: vi.fn(async ({ data }) => {
      persistedUser = { ...persistedUser, ...data };
      return { ...persistedUser };
    })
  };
  const deps = {
    io: { to: vi.fn(() => ({ emit })) },
    prisma: {
      user: userDelegate,
      $transaction: vi.fn((callback) => callback({ user: userDelegate }))
    },
    refreshSocketUser: vi.fn(async () => {}),
    createSigrikaCandyDuelRoom: vi.fn(() => ({
      code: "SIG01",
      sigrikaCandyDuel: { ownerUserId: "user-1" },
      players: [{ user: { id: "user-1" } }]
    })),
    findActiveSigrikaCandyDuel: vi.fn(() => activeDuel),
    findRoomForUser: vi.fn(() => room),
    attachSocketToRoom: vi.fn((roomCodeInput) => (
      [room, activeDuel].find((candidate) => candidate?.code === roomCodeInput) ?? null
    )),
    roomView: vi.fn((value) => ({ code: value.code, sigrikaCandyDuel: value.sigrikaCandyDuel })),
    broadcastRoomPresencePatch: vi.fn(),
    leaveMatchmaking: vi.fn(),
    broadcastLobbyStats: vi.fn(),
    runtimeServiceState: { admission: vi.fn(() => ({ ok: true })) }
  };
  registerSigrikaCandySocketEvents(socket, deps);
  return { deps, emit, handlers, socket };
}

describe("Sigrika candy socket events", () => {
  test("creates the special private room immediately from the awaiting phase", async () => {
    const { deps, handlers, socket } = setup();
    const acknowledge = vi.fn();

    await handlers["sigrika-candy:duel-start"]({}, acknowledge);

    expect(deps.leaveMatchmaking).toHaveBeenCalledWith("user-1");
    expect(deps.createSigrikaCandyDuelRoom).toHaveBeenCalledWith({
      user: expect.objectContaining({ id: "user-1" }),
      socketId: "socket-1",
      mode: "spark"
    }, deps.io);
    expect(deps.prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        sigrikaCandyPhase: "duel-active",
        sigrikaCandyRoomCode: "SIG01",
        sigrikaCandyOutcome: ""
      }
    });
    expect(socket.user.sigrikaCandyArc).toMatchObject({ phase: "duel-active", roomCode: "SIG01" });
    expect(acknowledge).toHaveBeenCalledWith({ ok: true, roomCode: "SIG01" });
  });

  test("resumes the persisted owner room instead of creating a second duel", async () => {
    const room = { code: "SIG02", sigrikaCandyDuel: { ownerUserId: "user-1" } };
    const { deps, emit, handlers } = setup({ phase: "duel-active", room });
    const acknowledge = vi.fn();

    await handlers["sigrika-candy:duel-start"]({}, acknowledge);

    expect(deps.createSigrikaCandyDuelRoom).not.toHaveBeenCalled();
    expect(deps.runtimeServiceState.admission).not.toHaveBeenCalled();
    expect(deps.attachSocketToRoom).toHaveBeenCalledWith("SIG02", expect.anything(), expect.objectContaining({ id: "user-1" }));
    expect(emit).toHaveBeenCalledWith("match:found", expect.objectContaining({ code: "SIG02" }));
    expect(acknowledge).toHaveBeenCalledWith({ ok: true, roomCode: "SIG02", resumed: true });
  });

  test("resets a missing active duel and creates a fresh room only after a second click", async () => {
    const { deps, handlers, socket } = setup({ phase: "duel-active", roomCode: "67975" });
    const firstAcknowledge = vi.fn();

    await handlers["sigrika-candy:duel-start"]({}, firstAcknowledge);

    expect(deps.createSigrikaCandyDuelRoom).not.toHaveBeenCalled();
    expect(deps.prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        sigrikaCandyPhase: "awaiting-duel",
        sigrikaCandyRoomCode: "",
        sigrikaCandyOutcome: ""
      }
    });
    expect(socket.user.sigrikaCandyArc).toMatchObject({ phase: "awaiting-duel", roomCode: "" });
    expect(firstAcknowledge).toHaveBeenCalledWith(expect.objectContaining({
      ok: false,
      code: "special_room_reset",
      sigrikaCandyArc: expect.objectContaining({ phase: "awaiting-duel", roomCode: "" })
    }));

    const secondAcknowledge = vi.fn();
    await handlers["sigrika-candy:duel-start"]({}, secondAcknowledge);

    expect(deps.createSigrikaCandyDuelRoom).toHaveBeenCalledTimes(1);
    expect(secondAcknowledge).toHaveBeenCalledWith({ ok: true, roomCode: "SIG01" });
  });

  test("preserves a newer duel link when the inspected room code is already stale", async () => {
    const { deps, handlers } = setup({
      phase: "duel-active",
      roomCode: "OLD01",
      persistedRoomCode: "NEW01"
    });
    const acknowledge = vi.fn();

    await handlers["sigrika-candy:duel-start"]({}, acknowledge);

    expect(deps.prisma.user.update).not.toHaveBeenCalled();
    expect(deps.createSigrikaCandyDuelRoom).not.toHaveBeenCalled();
    expect(acknowledge).toHaveBeenCalledWith(expect.objectContaining({
      ok: false,
      code: "special_phase_changed",
      sigrikaCandyArc: expect.objectContaining({ phase: "duel-active", roomCode: "NEW01" })
    }));
  });

  test("rejects starts outside the persistent duel phases", async () => {
    const { deps, handlers } = setup({ phase: "normal" });
    const acknowledge = vi.fn();

    await handlers["sigrika-candy:duel-start"]({}, acknowledge);

    expect(deps.createSigrikaCandyDuelRoom).not.toHaveBeenCalled();
    expect(acknowledge).toHaveBeenCalledWith(expect.objectContaining({
      ok: false,
      code: "invalid_special_phase"
    }));
  });

  test("reports another player's active duel without exposing it to ordinary users", async () => {
    const activeDuel = {
      code: "SIG88",
      game: { phase: "playing" },
      sigrikaCandyDuel: { ownerUserId: "other-user" }
    };
    const authorized = setup({ activeDuel });
    const authorizedAck = vi.fn();

    await authorized.handlers["sigrika-candy:duel-status"]({}, authorizedAck);

    expect(authorizedAck).toHaveBeenCalledWith({ ok: true, status: "occupied" });

    const ordinary = setup({ phase: "normal", activeDuel });
    const ordinaryAck = vi.fn();
    await ordinary.handlers["sigrika-candy:duel-status"]({}, ordinaryAck);

    expect(ordinaryAck).toHaveBeenCalledWith(expect.objectContaining({
      ok: false,
      code: "invalid_special_phase"
    }));
    expect(ordinary.deps.findActiveSigrikaCandyDuel).not.toHaveBeenCalled();
  });

  test("preserves challenge intent when another duel wins the creation race", async () => {
    const activeDuel = {
      code: "SIG88",
      game: { phase: "preloading" },
      sigrikaCandyDuel: { ownerUserId: "other-user" }
    };
    const { deps, handlers } = setup({ activeDuel });
    const acknowledge = vi.fn();

    await handlers["sigrika-candy:duel-start"]({}, acknowledge);

    expect(deps.createSigrikaCandyDuelRoom).not.toHaveBeenCalled();
    expect(deps.attachSocketToRoom).not.toHaveBeenCalled();
    expect(acknowledge).toHaveBeenCalledWith({
      ok: false,
      error: "西格莉卡？已经开始和别人对局了。",
      code: "special_duel_occupied",
      status: "occupied"
    });
  });

  test("attaches an authorized corrupted user directly as a special-duel spectator", async () => {
    const activeDuel = {
      code: "SIG88",
      game: { phase: "playing" },
      players: [],
      spectators: [],
      sigrikaCandyDuel: { ownerUserId: "other-user" }
    };
    const { deps, handlers, socket } = setup({ activeDuel });
    const acknowledge = vi.fn();

    await handlers["sigrika-candy:duel-watch"]({}, acknowledge);

    expect(deps.runtimeServiceState.admission).toHaveBeenCalledWith("spectator", {
      room: activeDuel,
      userId: "user-1"
    });
    expect(deps.attachSocketToRoom).toHaveBeenCalledWith(
      "SIG88",
      socket,
      expect.objectContaining({ id: "user-1" }),
      { allowSigrikaCandySpectator: true }
    );
    expect(socket.emit).toHaveBeenCalledWith("room:update", expect.objectContaining({ code: "SIG88" }));
    expect(deps.broadcastRoomPresencePatch).toHaveBeenCalledWith(deps.io, activeDuel);
    expect(acknowledge).toHaveBeenCalledWith({ ok: true, roomCode: "SIG88" });
  });

  test("preserves watch intent when the active duel has just ended", async () => {
    const { deps, handlers } = setup();
    const acknowledge = vi.fn();

    await handlers["sigrika-candy:duel-watch"]({}, acknowledge);

    expect(deps.createSigrikaCandyDuelRoom).not.toHaveBeenCalled();
    expect(acknowledge).toHaveBeenCalledWith({
      ok: false,
      error: "这盘决战已经结束了。",
      code: "special_watch_ended",
      status: "available"
    });
  });
});
