import { describe, expect, test, vi } from "vitest";
import { registerSigrikaCandySocketEvents } from "./socketSigrikaCandyEvents.js";

function setup({ phase = "awaiting-duel", room = null } = {}) {
  const handlers = {};
  const socket = {
    id: "socket-1",
    user: {
      id: "user-1",
      username: "moming",
      sigrikaCandyArc: { phase, roomCode: room?.code ?? "" }
    },
    on: vi.fn((event, handler) => {
      handlers[event] = handler;
    })
  };
  const emit = vi.fn();
  const deps = {
    io: { to: vi.fn(() => ({ emit })) },
    prisma: {
      user: {
        update: vi.fn(async ({ data }) => ({
          id: "user-1",
          username: "moming",
          sigrikaCandyUseCount: 8,
          ...data
        }))
      }
    },
    refreshSocketUser: vi.fn(async () => {}),
    createSigrikaCandyDuelRoom: vi.fn(() => ({
      code: "SIG01",
      sigrikaCandyDuel: { ownerUserId: "user-1" },
      players: [{ user: { id: "user-1" } }]
    })),
    findRoomForUser: vi.fn(() => room),
    attachSocketToRoom: vi.fn(),
    roomView: vi.fn((value) => ({ code: value.code, sigrikaCandyDuel: value.sigrikaCandyDuel })),
    leaveMatchmaking: vi.fn(),
    broadcastLobbyStats: vi.fn()
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
    expect(deps.attachSocketToRoom).toHaveBeenCalledWith("SIG02", expect.anything(), expect.objectContaining({ id: "user-1" }));
    expect(emit).toHaveBeenCalledWith("match:found", expect.objectContaining({ code: "SIG02" }));
    expect(acknowledge).toHaveBeenCalledWith({ ok: true, roomCode: "SIG02", resumed: true });
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
});
