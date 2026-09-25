import { describe, expect, it, vi } from "vitest";
import { createRoom } from "./roomFactory.js";
import { resolveTeamLineup, advanceTeamRound } from "./teamMatch.js";
import { buildRoomView } from "./roomView.js";
import { roomPersistenceSnapshot, hydratePersistedRoom } from "./roomStatePersistence.js";
import { createRoomMatchmakingQueue } from "./roomMatchmakingQueue.js";
import { saveGameRecord } from "./roomResultPersistence.js";
import { canStartSkill, GAME_PHASES, playMove } from "../src/shared/game.js";
import { CHARACTERS } from "../src/shared/characters.js";
import { replayGameAt, replayRoomAt } from "../src/room/roomView.js";
import { watchPlayerSummary } from "./roomPresence.js";

const ids = ["sigrika", "aemeath", "nabomo"];
function actor(id) {
  const user = { id, username: id, selectedCharacter: "nabomo", ownedCharacters: ids, itemEffects: {} };
  return { user, socketId: id, mode: "team", teamLineup: resolveTeamLineup(user, ids).lineup };
}
function room() {
  return createRoom(actor("one"), actor("two"), { random: () => 0.75 });
}

describe("team match contract", () => {
  it("validates ownership, distinct identity, disabled and blocked characters", () => {
    const user = actor("one").user;
    expect(resolveTeamLineup({ ...user, ownedCharacters: ids.slice(0, 2) }, ids).error).toBe("需要至少拥有3名部员才能参加");
    expect(resolveTeamLineup(user, ["sigrika", "sigrika", "aemeath"]).ok).toBe(false);
    expect(resolveTeamLineup(user, ids, { disabledSlugs: new Set(["aemeath"]) }).ok).toBe(false);
    expect(resolveTeamLineup({ ...user, itemEffects: { sigrikaCandyDisabled: true } }, ids).ok).toBe(false);
    expect(resolveTeamLineup(user, ["sigrika", "aemeath", "denia"]).ok).toBe(false);
  });
  it("queues teams independently in arrival order", () => {
    const queue = createRoomMatchmakingQueue();
    queue.join({ ...actor("ordinary"), mode: "spark" });
    expect(queue.join(actor("one")).matched).toBe(false);
    expect(queue.join(actor("two")).opponent.user.id).toBe("one");
    expect(queue.list().map((p) => p.user.id)).toEqual(["ordinary"]);
  });
  it("projects only own and revealed lineup, then reveals both on finish", () => {
    const state = room();
    const own = buildRoomView(state, "one");
    expect(own.players[0].teamLineup.map((p) => p.characterId)).toEqual(ids);
    expect(own.players[1].teamLineup.map((p) => p.characterId)).toEqual([ids[0], null, null]);
    expect(buildRoomView(state, "observer").players.every((p) => p.teamLineup[1].character === null)).toBe(true);
    expect(own.game.players.every((p) => p.characterId === ids[0])).toBe(true);
    expect(watchPlayerSummary(state, "black").user.selectedCharacter).toBe(ids[0]);
    state.game.phase = GAME_PHASES.finished;
    expect(buildRoomView(state, "observer").players.every((p) => p.teamLineup[2].characterId === ids[2])).toBe(true);
  });
  it("waits for chained moves, uses absolute limits, resets personal skills and preserves board/cost/clock", () => {
    const state = room();
    state.game.phase = GAME_PHASES.playing;
    state.game.moveNumber = 40;
    state.game.extraTurn = { color: "black", remaining: 2 };
    const scheduleGameStart = vi.fn();
    expect(advanceTeamRound(state, { scheduleGameStart })).toBe(false);
    state.game.extraTurn = null;
    state.game.moveNumber = 43;
    state.game.skillCosts.black = 15;
    state.game.points[0].stone = "black";
    state.game.derivedSkills.black = { effectType: "voyage-star", uses: 1 };
    state.game.history.push({ type: "skill", color: "white", effectType: "erase-point" });
    expect(canStartSkill(state.game, { effectType: "double-move" })).toBe(true);
    const clock = structuredClone(state.players[0].time);
    expect(advanceTeamRound(state, { now: () => 1000, scheduleGameStart })).toBe(true);
    expect(state.openingEndsAt).toBe(6000);
    expect(state.game.phase).toBe("opening");
    expect(state.team.rounds[1]).toEqual({ round: 2, startMove: 44 });
    expect(state.game.derivedSkills).toEqual({});
    expect(state.game.skillCosts.black).toBe(15);
    expect(state.game.points[0].stone).toBe("black");
    expect(state.players[0].time).toEqual(clock);
    expect(state.game.skillUses.black).toBe(CHARACTERS.aemeath.skill.uses);
    expect(canStartSkill(state.game, { effectType: "double-move" })).toBe(false);
    expect(playMove(state.game, state.game.turn, "2,2").ok).toBe(false);
    state.game.phase = "playing";
    state.game.moveNumber = 80;
    expect(advanceTeamRound(state)).toBe(true);
    expect(state.team.round).toBe(3);
    expect(scheduleGameStart).toHaveBeenCalledOnce();
  });
  it("does not switch during skill presentation or after terminal state; survives restoration", () => {
    const state = room();
    state.game.moveNumber = 80;
    state.game.phase = "skill-preview";
    expect(advanceTeamRound(state)).toBe(false);
    state.game.phase = "finished";
    expect(advanceTeamRound(state)).toBe(false);
    const restored = hydratePersistedRoom(roomPersistenceSnapshot(state));
    expect(restored.team).toEqual(state.team);
    expect(restored.players[0].teamLineup).toEqual(state.players[0].teamLineup);
  });
  it("saves replay only even for an early finish, without writing user rewards", async () => {
    const state = room();
    state.game.phase = "finished";
    state.game.winner = { winnerColor: "black", reason: "resign", text: "黑胜", invalid: true };
    const prisma = { gameRecord: { create: vi.fn().mockResolvedValue({}) }, user: { update: vi.fn() } };
    await saveGameRecord({ prisma, room: state });
    expect(prisma.gameRecord.create).toHaveBeenCalledOnce();
    expect(prisma.user.update).not.toHaveBeenCalled();
    const data = prisma.gameRecord.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ mode: "team", rated: false, matchSource: "team" });
    expect(JSON.parse(data.snapshot).players[1].teamLineup[2].characterId).toBe("nabomo");
  });
  it("replays the correct characters and independent skill state on both sides of a boundary", () => {
    const state = room();
    state.game.phase = "playing";
    state.game.moveNumber = 40;
    advanceTeamRound(state);
    state.game.phase = "finished";
    expect(replayRoomAt(buildRoomView(state, "one"), 0).players[0].characterId).toBe("sigrika");
    expect(replayRoomAt(buildRoomView(state, "one"), 1).players[0].characterId).toBe("aemeath");
    expect(replayGameAt(state, 1).skillUses.black).toBe(CHARACTERS.aemeath.skill.uses);
  });
});
