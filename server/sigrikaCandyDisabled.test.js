import { describe, expect, test, vi } from "vitest";
import { SIGRIKA_CANDY_CORRUPTION_ENABLED } from "../src/shared/sigrikaCandyAvailability.js";
import { SIGRIKA_CANDY_PHASES, normalizeSigrikaCandyArc } from "../src/shared/sigrikaCandyArc.js";
import { publicUser } from "./db.js";
import { defaultRainbowBeanCandyStoryDraft, selectRainbowBeanCandyStoryBranch } from "./rainbowBeanCandyStory.js";
import {
  completeSigrikaCandyRecovery, debugJumpSigrikaCandyToUseEight, getSigrikaCandyArcStory,
  markSigrikaCandyClimax, markSigrikaCandyDuelStarted, recoverMissingSigrikaCandyDuel,
  sigrikaCandyUseProgressData, startSigrikaCandyRecovery
} from "./sigrikaCandyArc.js";
import { registerSigrikaCandySocketEvents } from "./socketSigrikaCandyEvents.js";
import { createRoomConnectionLifecycle } from "./roomConnectionLifecycle.js";
import { createRoomPersistenceRestoreLifecycle } from "./roomPersistenceRestoreLifecycle.js";

describe("temporarily closed Sigrika corruption branch", () => {
  test("ships closed and keeps the ordinary first seven stories available", () => {
    expect(SIGRIKA_CANDY_CORRUPTION_ENABLED).toBe(false);
    for (let count = 0; count < 7; count += 1) {
      expect(sigrikaCandyUseProgressData({ sigrikaCandyUseCount: count })).toMatchObject({
        sigrikaCandyUseCount: count + 1, sigrikaCandyPhase: "normal"
      });
    }
    expect(sigrikaCandyUseProgressData({ sigrikaCandyUseCount: 7 })).toEqual({});
    const script = defaultRainbowBeanCandyStoryDraft("sigrika");
    expect(selectRainbowBeanCandyStoryBranch(script, "accepted", { characterId: "sigrika", useCount: 8 }).startNodeId)
      .toBe("use-7-start");
    expect(script.nodes.some((node) => node.id === "corruption-start")).toBe(true);
  });

  test.each(Object.values(SIGRIKA_CANDY_PHASES))("projects %s normally without destroying stored progress", async (phase) => {
    const saved = Object.freeze({ id: "u1", username: "player", sigrikaCandyUseCount: 8,
      sigrikaCandyPhase: phase, sigrikaCandyOutcome: "win", sigrikaCandyRoomCode: "SIG01" });
    const before = normalizeSigrikaCandyArc(saved);
    const publicArc = { useCount: 7, phase: "normal", outcome: "", roomCode: "", corrupted: false, active: true };
    expect(publicUser(saved).sigrikaCandyArc).toEqual(publicArc);
    expect(sigrikaCandyUseProgressData(saved)).toEqual({});
    const prisma = { user: { findUnique: vi.fn(async () => saved) }, storyScript: { findMany: vi.fn() } };
    expect(await getSigrikaCandyArcStory({ prisma, userId: saved.id })).toMatchObject({
      user: { sigrikaCandyArc: publicArc }, storyScript: null
    });
    expect(prisma.storyScript.findMany).not.toHaveBeenCalled();
    expect(normalizeSigrikaCandyArc(saved)).toEqual(before);
  });

  test.each([
    markSigrikaCandyClimax, debugJumpSigrikaCandyToUseEight, markSigrikaCandyDuelStarted,
    recoverMissingSigrikaCandyDuel, startSigrikaCandyRecovery, completeSigrikaCandyRecovery
  ])("blocks direct branch mutations before any storage access: %s", async (mutate) => {
    const prisma = { $transaction: vi.fn(), user: { findUnique: vi.fn(), update: vi.fn() } };
    await expect(mutate({ prisma, userId: "u1", roomCode: "SIG01", nodeEnv: "development" }))
      .rejects.toMatchObject({ status: 404, message: "黑化剧情暂未开放" });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  test.each(["duel-start", "duel-status", "duel-watch"])("blocks stale socket %s without creating or joining rooms", async (event) => {
    const handlers = {};
    const socket = { user: { id: "u1", sigrikaCandyArc: { phase: "awaiting-duel" } },
      on: (name, handler) => { handlers[name] = handler; } };
    const deps = { refreshSocketUser: vi.fn(), createSigrikaCandyDuelRoom: vi.fn(),
      attachSocketToRoom: vi.fn(), findActiveSigrikaCandyDuel: vi.fn(), leaveMatchmaking: vi.fn() };
    registerSigrikaCandySocketEvents(socket, deps);
    const acknowledge = vi.fn();
    await handlers[`sigrika-candy:${event}`]({}, acknowledge);
    expect(acknowledge).toHaveBeenCalledExactlyOnceWith({ ok: false, error: "黑化剧情暂未开放", code: "special_branch_disabled" });
    for (const spy of Object.values(deps)) expect(spy).not.toHaveBeenCalled();
  });

  test("suspends saved special rooms without starting timers or rewriting snapshots", async () => {
    const special = { code: "SIG01", sigrikaCandyDuel: { ownerUserId: "u1" } };
    const normal = { code: "GO001" };
    const rows = [special, normal].map((room) => ({ code: room.code, snapshot: JSON.stringify(room) }));
    const before = JSON.stringify(rows);
    const deps = { rooms: new Map(), listPersistedRooms: async () => rows,
      hydratePersistedRoom: (snapshot) => snapshot, ensureRestoredDisconnectedNotices: vi.fn(),
      registerRoom: vi.fn(), resumeRoomTimers: vi.fn(), persistRoom: vi.fn() };
    expect(await createRoomPersistenceRestoreLifecycle(deps).restorePersistedRooms({})).toEqual([normal]);
    expect([...deps.rooms.keys()]).toEqual([normal.code]);
    expect(deps.resumeRoomTimers).toHaveBeenCalledExactlyOnceWith(normal, {});
    expect(deps.persistRoom).toHaveBeenCalledExactlyOnceWith(normal, { force: true });
    expect(JSON.stringify(rows)).toBe(before);
  });

  test.each(["owner", "watcher"])("rejects generic room join by a special-room %s", (id) => {
    const room = { code: "SIG01", sigrikaCandyDuel: { ownerUserId: "owner" }, players: [{ user: { id: "owner" } }] };
    const socket = { id: "socket", join: vi.fn() };
    const persistRoom = vi.fn();
    const lifecycle = createRoomConnectionLifecycle({ rooms: new Map([[room.code, room]]),
      validateRoomCode: (value) => ({ ok: true, value }), persistRoom });
    expect(lifecycle.attachSocketToRoom(room.code, socket, { id, sigrikaCandyArc: { phase: "duel-active" } },
      { allowSigrikaCandySpectator: true })).toBeNull();
    expect(socket.join).not.toHaveBeenCalled();
    expect(persistRoom).not.toHaveBeenCalled();
  });
});
