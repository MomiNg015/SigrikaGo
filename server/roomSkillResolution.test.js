import { describe, expect, test, vi } from "vitest";
import { COLORS, GAME_PHASES, createGameState } from "../src/shared/game.js";
import { CHARACTERS } from "../src/shared/characters.js";
import {
  SKILL_BOARD_EFFECT_DURATION_MS,
  SKILL_BANNER_DURATION_MS,
  SKILL_PREVIEW_DELAY_MS,
  skillPreviewResolutionDelay,
  buildPendingSkillPreview,
  createPendingSkillResolution,
  createRoomSkillLifecycle,
  pendingSkillResolutionDelay,
  canSchedulePendingSkillResolution
} from "./roomSkillResolution.js";

describe("room skill resolution helpers", () => {
  test("creates a serializable pending skill resolution snapshot", () => {
    const game = { phase: "playing", history: [{ type: "skill" }] };
    const resolution = createPendingSkillResolution({
      pendingSkillId: "skill-1",
      game,
      notices: ["notice"],
      playerColor: "black",
      now: () => 1000
    });

    expect(resolution).toEqual({
      pendingSkillId: "skill-1",
      resolvesAt: 1000 + SKILL_PREVIEW_DELAY_MS,
      game,
      notices: ["notice"],
      playerColor: "black",
      effectsEnabled: true
    });
    expect(JSON.parse(JSON.stringify(resolution))).toEqual(resolution);
  });

  test("keeps the preview window long enough for the banner and board effect", () => {
    expect(SKILL_BANNER_DURATION_MS).toBe(2000);
    expect(SKILL_BOARD_EFFECT_DURATION_MS).toBe(1800);
    expect(SKILL_PREVIEW_DELAY_MS).toBeGreaterThanOrEqual(
      SKILL_BANNER_DURATION_MS + SKILL_BOARD_EFFECT_DURATION_MS
    );
  });

  test("resolves immediately after the banner when skill effects are disabled", () => {
    const game = { phase: "playing", history: [{ type: "skill" }] };
    const resolution = createPendingSkillResolution({
      pendingSkillId: "skill-1",
      game,
      notices: [],
      playerColor: "black",
      effectsEnabled: false,
      now: () => 1000
    });

    expect(skillPreviewResolutionDelay({ effectsEnabled: false })).toBe(SKILL_BANNER_DURATION_MS);
    expect(resolution).toMatchObject({
      resolvesAt: 1000 + SKILL_BANNER_DURATION_MS,
      effectsEnabled: false
    });
  });

  test("resolves Nabomo passive at banner end so the board transition starts without a gap", () => {
    const game = {
      phase: "playing",
      history: [{ type: "skill", effectType: "color-illusion-passive" }]
    };
    const resolution = createPendingSkillResolution({
      pendingSkillId: "skill-nabomo",
      game,
      notices: [],
      playerColor: "black",
      effectType: "color-illusion-passive",
      now: () => 1000
    });

    expect(skillPreviewResolutionDelay({ effectType: "color-illusion-passive" })).toBe(
      SKILL_BANNER_DURATION_MS
    );
    expect(resolution).toMatchObject({
      resolvesAt: 1000 + SKILL_BANNER_DURATION_MS,
      effectsEnabled: true
    });
  });

  test("resolves Denia flip-stone while the bubble cover hides the stone", () => {
    const game = {
      phase: "playing",
      history: [{ type: "skill", effectType: "flip-stone", id: "6,6" }]
    };
    const resolution = createPendingSkillResolution({
      pendingSkillId: "skill-denia",
      game,
      notices: [],
      playerColor: "black",
      effectType: "flip-stone",
      now: () => 1000
    });

    expect(skillPreviewResolutionDelay({ effectType: "flip-stone" })).toBe(3040);
    expect(resolution).toMatchObject({
      resolvesAt: 4040,
      effectsEnabled: true
    });
  });

  test("resolves Voyage Star during the full-board whiteout", () => {
    const game = {
      phase: "playing",
      history: [{ type: "skill", effectType: "voyage-star", id: "6,6" }]
    };
    const resolution = createPendingSkillResolution({
      pendingSkillId: "skill-voyage-star",
      game,
      notices: [],
      playerColor: "black",
      effectType: "voyage-star",
      now: () => 1000
    });

    expect(skillPreviewResolutionDelay({ effectType: "voyage-star" })).toBe(2936);
    expect(resolution).toMatchObject({
      resolvesAt: 3936,
      effectsEnabled: true
    });
  });

  test("calculates remaining delay for restored pending skill snapshots", () => {
    expect(pendingSkillResolutionDelay({ resolvesAt: 2500 }, { now: () => 1000 })).toBe(1500);
    expect(pendingSkillResolutionDelay({ resolvesAt: 500 }, { now: () => 1000 })).toBe(0);
  });

  test("requires both a pending skill id and a resolved game snapshot before scheduling", () => {
    expect(canSchedulePendingSkillResolution({ pendingSkillId: "skill-1", game: {} })).toBe(true);
    expect(canSchedulePendingSkillResolution({ pendingSkillId: "", game: {} })).toBe(false);
    expect(canSchedulePendingSkillResolution({ pendingSkillId: "skill-1", game: null })).toBe(false);
    expect(canSchedulePendingSkillResolution(null)).toBe(false);
  });

  test("builds pending skill preview metadata from the resolved skill action", () => {
    const preview = buildPendingSkillPreview({
      pendingSkillId: "skill-1",
      player: {
        color: COLORS.black,
        characterId: "sigrika",
        character: CHARACTERS.sigrika,
        user: {
          username: "alice",
          itemEffects: { doubleCoins: true }
        }
      },
      character: CHARACTERS.sigrika,
      skill: CHARACTERS.sigrika.skill,
      requestedTargetId: "3-3",
      resolvedGame: {
        history: [{
          type: "skill",
          effectType: "random-blast",
          id: "12-12",
          marked: ["11-11", "12-12"],
          removed: 2,
          removedByColor: COLORS.white
        }]
      },
      resolvesAt: 2000
    });

    expect(preview).toMatchObject({
      id: "skill-1",
      color: COLORS.black,
      username: "alice",
      characterId: "sigrika",
      characterName: CHARACTERS.sigrika.name,
      skillName: CHARACTERS.sigrika.skill.name,
      effectType: "random-blast",
      targetId: "12-12",
      affectedPointIds: ["11-11", "12-12"],
      markedPointIds: ["11-11", "12-12"],
      removed: 2,
      removedByColor: COLORS.white,
      resolvesAt: 2000,
      bannerDurationMs: SKILL_BANNER_DURATION_MS,
      boardEffectDurationMs: SKILL_BOARD_EFFECT_DURATION_MS
    });
  });

  test("builds Chisa pending skill preview metadata from placement and removal marks", () => {
    const preview = buildPendingSkillPreview({
      pendingSkillId: "skill-chisa",
      player: {
        color: COLORS.black,
        characterId: "chisa",
        character: CHARACTERS.chisa,
        user: { username: "alice", itemEffects: {} }
      },
      character: CHARACTERS.chisa,
      skill: CHARACTERS.chisa.skill,
      requestedTargetId: "0,0",
      resolvedGame: {
        history: [{
          type: "skill",
          effectType: "liberty-purge",
          id: "0,0",
          removalMarkIds: ["3,3", "6,6"],
          removed: 2,
          removedByColor: { black: 1, white: 1 }
        }]
      },
      resolvesAt: 2000
    });

    expect(preview).toMatchObject({
      id: "skill-chisa",
      characterId: "chisa",
      effectType: "liberty-purge",
      targetId: "0,0",
      affectedPointIds: ["0,0", "3,3", "6,6"],
      removalMarkIds: ["3,3", "6,6"],
      removed: 2,
      removedByColor: { black: 1, white: 1 },
      boardEffectDurationMs: SKILL_BOARD_EFFECT_DURATION_MS
    });
  });

  test("builds Voyage Star pending preview metadata with fixed music and hidden-hand center", () => {
    const preview = buildPendingSkillPreview({
      pendingSkillId: "skill-voyage-star",
      player: {
        color: COLORS.black,
        characterId: "aemeath",
        character: CHARACTERS.aemeath,
        user: { username: "alice", itemEffects: {} }
      },
      character: CHARACTERS.aemeath,
      skill: {
        effectType: "voyage-star",
        name: "远航星",
        musicTrackId: "aemeath-voyage-star-default"
      },
      requestedTargetId: null,
      resolvedGame: {
        history: [{
          type: "skill",
          effectType: "voyage-star",
          id: "6,6",
          erasedPointIds: ["6,6", "5,6", "7,6", "6,5", "6,7"],
          secondaryRemovalIds: ["4,6", "8,6"],
          affectedPointIds: ["6,6", "5,6", "7,6", "6,5", "6,7", "4,6", "8,6"],
          directRemovals: [{ id: "4,6", from: COLORS.white }],
          removed: 1,
          removedByColor: { white: 1 },
          musicTrackId: "aemeath-voyage-star-default"
        }]
      },
      resolvesAt: 2000
    });

    expect(preview).toMatchObject({
      id: "skill-voyage-star",
      characterId: "aemeath",
      skillName: "远航星",
      effectType: "voyage-star",
      targetId: "6,6",
      musicTrackId: "aemeath-voyage-star-default",
      erasedPointIds: ["6,6", "5,6", "7,6", "6,5", "6,7"],
      secondaryRemovalIds: ["4,6", "8,6"],
      affectedPointIds: ["6,6", "5,6", "7,6", "6,5", "6,7", "4,6", "8,6"],
      removedStones: [{ id: "4,6", from: COLORS.white }],
      boardEffectDurationMs: SKILL_BOARD_EFFECT_DURATION_MS
    });
  });

  test("builds QiuYuan row-slash preview metadata with removed stone colors", () => {
    const preview = buildPendingSkillPreview({
      pendingSkillId: "skill-qiuyuan",
      player: {
        color: COLORS.black,
        characterId: "qiuyuan",
        character: CHARACTERS.qiuyuan,
        user: { username: "alice", itemEffects: {} }
      },
      character: CHARACTERS.qiuyuan,
      skill: CHARACTERS.qiuyuan.skill,
      requestedTargetId: "3,5",
      resolvedGame: {
        size: 13,
        history: [{
          type: "skill",
          effectType: "row-slash",
          id: "3,5",
          row: 5,
          directRemovals: [
            { id: "0,5", from: COLORS.white, owner: COLORS.black },
            { id: "1,5", from: "spray", owner: null }
          ],
          removed: 2,
          removedByColor: { white: 1, spray: 1 }
        }]
      },
      resolvesAt: 2000
    });

    expect(preview).toMatchObject({
      id: "skill-qiuyuan",
      effectType: "row-slash",
      targetId: "3,5",
      row: 5,
      affectedPointIds: Array.from({ length: 13 }, (_item, x) => `${x},5`),
      removedStones: [
        { id: "0,5", from: COLORS.white },
        { id: "1,5", from: "spray" }
      ],
      removed: 2,
      removedByColor: { white: 1, spray: 1 }
    });
  });

  test("extends Chisa pending resolution until every removal slash can play", () => {
    const removalMarkIds = ["0,1", "1,1", "2,1", "3,1", "4,1", "5,1", "6,1", "7,1"];
    const game = {
      phase: "playing",
      history: [{
        type: "skill",
        effectType: "liberty-purge",
        id: "0,0",
        removalMarkIds
      }]
    };
    const resolution = createPendingSkillResolution({
      pendingSkillId: "skill-chisa-many",
      game,
      playerColor: COLORS.black,
      effectType: "liberty-purge",
      now: () => 1000
    });
    const preview = buildPendingSkillPreview({
      pendingSkillId: "skill-chisa-many",
      player: {
        color: COLORS.black,
        characterId: "chisa",
        character: CHARACTERS.chisa,
        user: { username: "alice", itemEffects: {} }
      },
      character: CHARACTERS.chisa,
      skill: CHARACTERS.chisa.skill,
      requestedTargetId: "0,0",
      resolvedGame: game,
      resolvesAt: resolution.resolvesAt
    });

    expect(preview.boardEffectDurationMs).toBe(2530);
    expect(resolution.resolvesAt).toBe(1000 + SKILL_BANNER_DURATION_MS + preview.boardEffectDurationMs);
  });

  test("marks disabled effect previews with a zero board-effect window", () => {
    const preview = buildPendingSkillPreview({
      pendingSkillId: "skill-disabled",
      player: {
        color: COLORS.black,
        characterId: "sigrika",
        character: CHARACTERS.sigrika,
        user: { username: "alice", itemEffects: {} }
      },
      character: CHARACTERS.sigrika,
      skill: CHARACTERS.sigrika.skill,
      requestedTargetId: "0,0",
      resolvedGame: {
        history: [{ type: "skill", effectType: "erase-point", id: "0,0" }]
      },
      resolvesAt: 2000,
      effectsEnabled: false
    });

    expect(preview.effectsEnabled).toBe(false);
    expect(preview.boardEffectDurationMs).toBe(0);
  });


  test("rejects active skills in gomoku rooms before target validation", () => {
    const room = {
      code: "12345",
      players: [],
      game: createGameState([{ userId: "alice", color: COLORS.black, characterId: "sigrika" }], { mode: "gomoku" })
    };
    const lifecycle = createRoomSkillLifecycle({
      rooms: new Map([[room.code, room]]),
      scheduleRoomTimeout: vi.fn(),
      appendSystem: vi.fn(),
      appendNotices: vi.fn(),
      resetByoYomi: vi.fn(),
      scheduleRoomClose: vi.fn(),
      broadcastRoom: vi.fn()
    });

    expect(lifecycle.startActiveSkill({
      room,
      player: {
        color: COLORS.black,
        characterId: "sigrika",
        character: CHARACTERS.sigrika,
        user: { username: "alice" }
      },
      action: { type: "skill", pointId: "0,0" },
      io: {}
    })).toEqual({ ok: false, error: "五子棋不能使用技能" });
  });

  test("schedules and completes pending skill resolutions through injected room lifecycle hooks", () => {
    const room = {
      code: "12345",
      players: [{
        color: COLORS.black,
        user: { username: "alice" }
      }],
      game: {
        phase: GAME_PHASES.skillPreview,
        pendingSkill: { id: "skill-1" }
      },
      pendingSkillResolution: {
        pendingSkillId: "skill-1",
        resolvesAt: Date.now(),
        playerColor: COLORS.black,
        game: {
          phase: GAME_PHASES.playing,
          pendingSkill: { id: "skill-1" },
          history: [{ type: "skill" }]
        },
        notices: ["notice"]
      }
    };
    const scheduled = [];
    const appendNotices = vi.fn();
    const resetByoYomi = vi.fn();
    const scheduleRoomClose = vi.fn();
    const broadcastRoom = vi.fn();
    const lifecycle = createRoomSkillLifecycle({
      rooms: new Map([[room.code, room]]),
      scheduleRoomTimeout: (targetRoom, callback, delay) => {
        scheduled.push({ targetRoom, callback, delay });
      },
      appendSystem: vi.fn(),
      appendNotices,
      resetByoYomi,
      scheduleRoomClose,
      broadcastRoom
    });

    expect(lifecycle.schedulePendingSkillResolution(room, {})).toBe(true);
    expect(scheduled).toHaveLength(1);

    scheduled[0].callback();

    expect(room.pendingSkillResolution).toBeNull();
    expect(room.game).toMatchObject({
      phase: GAME_PHASES.playing,
      pendingSkill: null
    });
    expect(resetByoYomi).toHaveBeenCalledWith(room.players[0]);
    expect(appendNotices).toHaveBeenCalledWith(room, ["notice"]);
    expect(scheduleRoomClose).not.toHaveBeenCalled();
    expect(broadcastRoom).toHaveBeenCalledWith({}, room);
  });
});
