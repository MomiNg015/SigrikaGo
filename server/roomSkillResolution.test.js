import { describe, expect, test, vi } from "vitest";
import { COLORS, GAME_PHASES } from "../src/shared/game.js";
import { CHARACTERS } from "../src/shared/characters.js";
import {
  SKILL_BOARD_EFFECT_DURATION_MS,
  SKILL_BANNER_DURATION_MS,
  SKILL_PREVIEW_DELAY_MS,
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
      playerColor: "black"
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
