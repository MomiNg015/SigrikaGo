import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { CHARACTERS } from "./characters.js";
import {
  COLORS,
  GAME_PHASES,
  canStartSkill,
  createDrawResult,
  createGameState,
  createTimeoutResult,
  collectGroup,
  erasePoint,
  flipStone,
  getPoint,
  markDeadGroup,
  passMove,
  playMove,
  pointId,
  prepareScoringState,
  protocolTakeover,
  randomBlast,
  randomLayout,
  resultWithInvalidFlagForGame,
  restoreSkillUse,
  rowSlash,
  resignGame,
  scoreGame,
  suspendUnexposedHiddenHands,
  activatePassiveSkill,
  gameViewForColor,
  useSkill
} from "./game.js";

function forceStone(state, x, y, color) {
  getPoint(state, pointId(x, y)).stone = color;
}

function collectTestGroup(state, startId) {
  const start = getPoint(state, startId);
  const stones = [];
  const liberties = new Set();
  const queue = [startId];
  const visited = new Set();
  while (queue.length) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    const point = getPoint(state, id);
    if (!point || point.stone !== start.stone) continue;
    stones.push(id);
    for (const neighborId of point.neighbors) {
      const neighbor = getPoint(state, neighborId);
      if (!neighbor?.valid) continue;
      if (!neighbor.stone) liberties.add(neighbor.id);
      else if (neighbor.stone === start.stone && !visited.has(neighbor.id)) queue.push(neighbor.id);
    }
  }
  return { stones, liberties };
}

function surroundWhiteBox(state) {
  for (let x = 1; x <= 5; x += 1) {
    forceStone(state, x, 1, COLORS.white);
    forceStone(state, x, 5, COLORS.white);
  }
  for (let y = 2; y <= 4; y += 1) {
    forceStone(state, 1, y, COLORS.white);
    forceStone(state, 5, y, COLORS.white);
  }
}

function functionSource(source, name, nextName) {
  const start = source.indexOf(`function ${name}`);
  const end = source.indexOf(`function ${nextName}`, start + 1);
  return source.slice(start, end);
}

describe("SigrikaGo rules", () => {
  it("looks up standard board points without linear array search", () => {
    const state = createGameState();
    state.points.find = () => {
      throw new Error("linear lookup should not run for standard points");
    };

    expect(getPoint(state, pointId(6, 6))).toMatchObject({ id: pointId(6, 6), x: 6, y: 6 });
  });

  it("falls back to id lookup for non-standard point arrays", () => {
    const state = createGameState();
    const first = state.points[0];
    const center = getPoint(state, pointId(6, 6));
    state.points[0] = center;
    state.points[6 * state.size + 6] = first;

    expect(getPoint(state, pointId(6, 6))).toBe(center);
  });

  it("returns no point for empty skill targets", () => {
    expect(getPoint(createGameState(), null)).toBeUndefined();
  });

  it("creates standard mode games on a 19-line board with no skill uses", () => {
    const state = createGameState([
      { color: COLORS.black, characterId: "sigrika" },
      { color: COLORS.white, characterId: "denia" }
    ], { mode: "standard" });

    expect(state.mode).toBe("standard");
    expect(state.size).toBe(19);
    expect(state.points).toHaveLength(19 * 19);
    expect(state.skillUses).toEqual({ black: 0, white: 0 });
    expect(state.skillEnabled).toBe(false);
  });

  it("collects connected groups without shifting queue arrays", () => {
    expect(collectGroup.toString()).not.toContain(".shift(");
  });

  it("traverses scoring regions without shifting queue arrays", () => {
    const source = readFileSync(new URL("./game.js", import.meta.url), "utf8");

    expect(functionSource(source, "collectPotentialDeadStones", "collectTerritory")).not.toContain(".shift(");
    expect(functionSource(source, "collectTerritoryIgnoringColor", "isUnexposedOpponentHiddenHand")).not.toContain(".shift(");
  });

  it("captures surrounded stones", () => {
    const state = createGameState();
    forceStone(state, 1, 1, COLORS.white);
    forceStone(state, 0, 1, COLORS.black);
    forceStone(state, 2, 1, COLORS.black);
    forceStone(state, 1, 0, COLORS.black);
    state.turn = COLORS.black;

    const result = playMove(state, COLORS.black, pointId(1, 2));

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(1, 1)).stone).toBe(null);
    expect(result.state.captures.black).toBe(1);
  });

  it("counts a captured group once when the new stone touches it from multiple sides", () => {
    const state = createGameState();
    forceStone(state, 0, 0, COLORS.white);
    forceStone(state, 1, 0, COLORS.white);
    forceStone(state, 0, 1, COLORS.white);
    forceStone(state, 2, 0, COLORS.black);
    forceStone(state, 0, 2, COLORS.black);
    state.turn = COLORS.black;

    const result = playMove(state, COLORS.black, pointId(1, 1));

    expect(result.ok).toBe(true);
    expect(result.state.captures.black).toBe(3);
    expect(result.state.history.at(-1).captures).toEqual([
      pointId(0, 1),
      pointId(0, 0),
      pointId(1, 0)
    ]);
    expect(getPoint(result.state, pointId(0, 0)).stone).toBe(null);
    expect(getPoint(result.state, pointId(1, 0)).stone).toBe(null);
    expect(getPoint(result.state, pointId(0, 1)).stone).toBe(null);
  });

  it("rejects suicide", () => {
    const state = createGameState();
    forceStone(state, 0, 1, COLORS.white);
    forceStone(state, 1, 0, COLORS.white);
    state.turn = COLORS.black;

    const result = playMove(state, COLORS.black, pointId(0, 0));

    expect(result.ok).toBe(false);
    expect(result.error).toBe("禁自杀");
  });

  it("creates a ko ban after single-stone capture", () => {
    const state = createGameState();
    forceStone(state, 1, 0, COLORS.white);
    forceStone(state, 0, 0, COLORS.black);
    forceStone(state, 2, 0, COLORS.black);
    forceStone(state, 0, 1, COLORS.white);
    forceStone(state, 2, 1, COLORS.white);
    forceStone(state, 1, 2, COLORS.white);
    state.turn = COLORS.black;

    const result = playMove(state, COLORS.black, pointId(1, 1));

    expect(result.ok).toBe(true);
    expect(result.state.ko).toBe(pointId(1, 0));
  });

  it("keeps playing after two consecutive passes until players request counting", () => {
    let state = createGameState();
    state = passMove(state, COLORS.black).state;
    state = passMove(state, COLORS.white).state;

    expect(state.phase).toBe("playing");
    expect(state.scoring).toBeNull();
    expect(state.passes).toBe(2);
  });

  it("erases an empty intersection and disconnects neighbors", () => {
    const state = createGameState([{ color: COLORS.black }]);
    state.turn = COLORS.black;
    const result = erasePoint(state, COLORS.black, pointId(6, 6));

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(6, 6)).valid).toBe(false);
    expect(getPoint(result.state, pointId(6, 5)).neighbors).not.toContain(pointId(6, 6));
    expect(result.state.skillCosts.black).toBe(3);
    expect(result.state.turn).toBe(COLORS.black);
  });

  it("flips a stone with Denia skill", () => {
    const state = createGameState([{ color: COLORS.black }]);
    forceStone(state, 4, 4, COLORS.white);

    const result = useSkill(state, COLORS.black, "denia", pointId(4, 4));

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(4, 4)).stone).toBe(COLORS.black);
    expect(result.state.skillUses.black).toBe(0);
    expect(result.state.skillCosts.black).toBe(3);
    expect(result.state.turn).toBe(COLORS.white);
    expect(result.state.history.at(-1).skill).toBe(CHARACTERS.denia.skill.name);
  });

  it("counts skill removals for the player who gains an opponent stone through flip skills", () => {
    const state = createGameState([{ color: COLORS.black }, { color: COLORS.white }]);
    forceStone(state, 4, 4, COLORS.white);

    const result = useSkill(state, COLORS.black, "denia", pointId(4, 4));

    expect(result.ok).toBe(true);
    expect(result.state.skillRemovals.black).toBe(1);
    expect(result.state.skillRemovals.white).toBe(0);
  });

  it("counts stones removed by skill follow-up cleanup as skill removals instead of captures", () => {
    const state = createGameState([{ color: COLORS.black }, { color: COLORS.white }]);
    forceStone(state, 1, 1, COLORS.white);
    forceStone(state, 1, 2, COLORS.white);
    forceStone(state, 0, 1, COLORS.black);
    forceStone(state, 2, 1, COLORS.black);
    forceStone(state, 0, 2, COLORS.black);
    forceStone(state, 2, 2, COLORS.black);
    forceStone(state, 1, 3, COLORS.black);

    const result = useSkill(state, COLORS.black, "denia", pointId(1, 1));

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(1, 2)).stone).toBe(null);
    expect(result.state.captures.black).toBe(0);
    expect(result.state.skillRemovals.black).toBe(2);
  });

  it("counts skill removals for the opponent when a flip gives away own stone", () => {
    const state = createGameState([{ color: COLORS.black }, { color: COLORS.white }]);
    forceStone(state, 4, 4, COLORS.black);

    const result = useSkill(state, COLORS.black, "denia", pointId(4, 4));

    expect(result.ok).toBe(true);
    expect(result.state.skillRemovals.black).toBe(0);
    expect(result.state.skillRemovals.white).toBe(1);
  });

  it("initializes configured skill uses from player character skills", () => {
    const state = createGameState([
      {
        color: COLORS.black,
        character: {
          skill: {
            effectType: "erase-point",
            name: "Locked Rune",
            uses: 0,
            freeTurn: true
          }
        }
      },
      {
        color: COLORS.white,
        character: {
          skill: {
            effectType: "flip-stone",
            name: "Double Hex",
            uses: 2,
            freeTurn: false
          }
        }
      }
    ]);

    expect(state.skillUses.black).toBe(0);
    expect(state.skillUses.white).toBe(2);
  });

  it("uses configured erase-point skill without consuming the turn", () => {
    const state = createGameState([{ color: COLORS.black }]);
    state.turn = COLORS.black;

    const result = useSkill(
      state,
      COLORS.black,
      {
        effectType: "erase-point",
        name: "星辰符文",
        uses: 1,
        freeTurn: true,
        targetRule: "empty-point",
        params: {}
      },
      pointId(6, 6)
    );

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(6, 6)).valid).toBe(false);
    expect(result.state.turn).toBe(COLORS.black);
    expect(result.state.history.at(-1)).toMatchObject({
      type: "skill",
      effectType: "erase-point",
      id: pointId(6, 6)
    });
  });

  it("activates Nabomo passive and disguises later stones only for the opponent view", () => {
    const state = createGameState([
      { color: COLORS.black, characterId: "nabomo", character: CHARACTERS.nabomo },
      { color: COLORS.white, characterId: "sigrika", character: CHARACTERS.sigrika }
    ]);

    const passive = activatePassiveSkill(state, COLORS.black, CHARACTERS.nabomo.skill);
    expect(passive.ok).toBe(true);
    expect(passive.state.passives.black.colorIllusion.active).toBe(true);
    expect(passive.state.history.at(-1)).toMatchObject({
      type: "skill",
      effectType: "color-illusion-passive",
      color: COLORS.black
    });

    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.79);
    const move = playMove(passive.state, COLORS.black, pointId(3, 3));
    randomSpy.mockRestore();

    expect(move.ok).toBe(true);
    expect(getPoint(move.state, pointId(3, 3)).stone).toBe(COLORS.black);
    expect(getPoint(gameViewForColor(move.state, COLORS.black), pointId(3, 3)).stone).toBe(COLORS.black);
    expect(getPoint(gameViewForColor(move.state, COLORS.white), pointId(3, 3)).stone).toBe(COLORS.white);
    expect(move.state.history.at(-1).colorIllusion).toMatchObject({
      owner: COLORS.black,
      visibleAs: COLORS.white
    });
  });

  it("reveals Nabomo disguised stones during counting and after the game ends", () => {
    const state = createGameState([
      { color: COLORS.black, characterId: "nabomo", character: CHARACTERS.nabomo },
      { color: COLORS.white, characterId: "sigrika", character: CHARACTERS.sigrika }
    ]);
    const passive = activatePassiveSkill(state, COLORS.black, CHARACTERS.nabomo.skill).state;
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.1);
    const move = playMove(passive, COLORS.black, pointId(3, 3)).state;
    randomSpy.mockRestore();

    expect(getPoint(gameViewForColor(move, COLORS.white), pointId(3, 3)).stone).toBe(COLORS.white);

    const counting = { ...move, phase: GAME_PHASES.markingDead };
    expect(getPoint(gameViewForColor(counting, COLORS.white), pointId(3, 3)).stone).toBe(COLORS.black);

    const finished = { ...move, phase: GAME_PHASES.finished };
    expect(getPoint(gameViewForColor(finished, COLORS.white), pointId(3, 3)).stone).toBe(COLORS.black);
  });

  it("keeps Nabomo disguised stones while counting is only requested", () => {
    const state = createGameState([
      { color: COLORS.black, characterId: "nabomo", character: CHARACTERS.nabomo },
      { color: COLORS.white, characterId: "sigrika", character: CHARACTERS.sigrika }
    ]);
    const passive = activatePassiveSkill(state, COLORS.black, CHARACTERS.nabomo.skill).state;
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.1);
    const move = playMove(passive, COLORS.black, pointId(3, 3)).state;
    randomSpy.mockRestore();

    const requested = { ...move, phase: GAME_PHASES.countingRequested };
    expect(getPoint(gameViewForColor(requested, COLORS.white), pointId(3, 3)).stone).toBe(COLORS.white);

    const markingDead = { ...move, phase: GAME_PHASES.markingDead };
    expect(getPoint(gameViewForColor(markingDead, COLORS.white), pointId(3, 3)).stone).toBe(COLORS.black);
  });

  it("lets Denia flip the real stone and clear Nabomo disguise on the target", () => {
    const state = createGameState([
      { color: COLORS.black, characterId: "nabomo", character: CHARACTERS.nabomo },
      { color: COLORS.white, characterId: "denia", character: CHARACTERS.denia }
    ]);
    const passive = activatePassiveSkill(state, COLORS.black, CHARACTERS.nabomo.skill).state;
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.1);
    let game = playMove(passive, COLORS.black, pointId(3, 3)).state;
    randomSpy.mockRestore();
    game.turn = COLORS.white;

    const result = flipStone(game, COLORS.white, pointId(3, 3), {
      skill: CHARACTERS.denia.skill,
      skillName: CHARACTERS.denia.skill.name,
      consumesTurn: false
    });

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(3, 3)).stone).toBe(COLORS.white);
    expect(getPoint(result.state, pointId(3, 3)).colorIllusion).toBe(null);
    expect(getPoint(gameViewForColor(result.state, COLORS.black), pointId(3, 3)).stone).toBe(COLORS.white);
    expect(getPoint(gameViewForColor(result.state, COLORS.white), pointId(3, 3)).stone).toBe(COLORS.white);
  });

  it("rejects Denia flip on spray stones", () => {
    const state = createGameState([{ color: COLORS.black }, { color: COLORS.white }]);
    forceStone(state, 4, 4, "spray");

    const result = useSkill(state, COLORS.black, "denia", pointId(4, 4));

    expect(result.ok).toBe(false);
    expect(getPoint(state, pointId(4, 4)).stone).toBe("spray");
  });

  it("adds configured numeric skill costs when a dynamic skill is used", () => {
    const state = createGameState([{ color: COLORS.black }]);
    state.turn = COLORS.black;

    const result = useSkill(
      state,
      COLORS.black,
      {
        effectType: "erase-point",
        name: "Costly Rune",
        uses: 1,
        freeTurn: true,
        targetRule: "empty-point",
        costType: "numeric",
        costValue: "5",
        params: {}
      },
      pointId(6, 6)
    );

    expect(result.ok).toBe(true);
    expect(result.state.skillCosts.black).toBe(5);
    expect(result.state.skillCostNotes.at(-1)).toMatchObject({
      color: COLORS.black,
      costType: "numeric",
      costValue: "5"
    });
  });

  it("keeps special skill costs as notes without changing numeric scoring cost", () => {
    const state = createGameState([{ color: COLORS.black }]);
    state.turn = COLORS.black;

    const result = useSkill(
      state,
      COLORS.black,
      {
        effectType: "erase-point",
        name: "Story Rune",
        uses: 1,
        freeTurn: true,
        targetRule: "empty-point",
        costType: "special",
        costValue: "下次读秒缩短",
        params: {}
      },
      pointId(6, 6)
    );

    expect(result.ok).toBe(true);
    expect(result.state.skillCosts.black).toBe(0);
    expect(result.state.skillCostNotes.at(-1)).toMatchObject({
      color: COLORS.black,
      costType: "special",
      costValue: "下次读秒缩短"
    });
  });

  it("uses configured flip-stone skill and consumes the turn", () => {
    const state = createGameState([{ color: COLORS.black }]);
    forceStone(state, 4, 4, COLORS.white);

    const result = useSkill(
      state,
      COLORS.black,
      {
        effectType: "flip-stone",
        name: "染移",
        uses: 1,
        freeTurn: false,
        targetRule: "stone",
        params: {}
      },
      pointId(4, 4)
    );

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(4, 4)).stone).toBe(COLORS.black);
    expect(result.state.turn).toBe(COLORS.white);
    expect(result.state.history.at(-1)).toMatchObject({
      type: "skill",
      effectType: "flip-stone",
      id: pointId(4, 4)
    });
  });

  it("uses configured flip-stone skill without consuming a free turn", () => {
    const state = createGameState([{ color: COLORS.black }]);
    forceStone(state, 4, 4, COLORS.white);

    const result = useSkill(
      state,
      COLORS.black,
      {
        effectType: "flip-stone",
        name: "Free Hex",
        uses: 1,
        freeTurn: true,
        targetRule: "stone",
        params: {}
      },
      pointId(4, 4)
    );

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(4, 4)).stone).toBe(COLORS.black);
    expect(result.state.turn).toBe(COLORS.black);
    expect(result.state.moveNumber).toBe(0);
  });

  it("uses Mornye protocol takeover to ban the opponent from an empty point without changing turn or liberties", () => {
    const state = createGameState([
      { color: COLORS.black, characterId: "mornye" },
      { color: COLORS.white, characterId: "sigrika" }
    ]);
    forceStone(state, 3, 4, COLORS.white);
    forceStone(state, 4, 3, COLORS.white);
    forceStone(state, 5, 4, COLORS.white);

    const result = useSkill(state, COLORS.black, "mornye", pointId(4, 4));

    expect(result.ok).toBe(true);
    const target = getPoint(result.state, pointId(4, 4));
    expect(target.valid).toBe(true);
    expect(target.stone).toBeNull();
    expect(target.protocolBan).toEqual({
      owner: COLORS.black,
      bannedColor: COLORS.white,
      effect: "protocol-takeover"
    });
    expect(collectTestGroup(result.state, pointId(3, 4)).liberties).toContain(pointId(4, 4));
    expect(result.state.skillCosts.black).toBe(2);
    expect(result.state.skillUses.black).toBe(0);
    expect(result.state.turn).toBe(COLORS.black);
    expect(result.state.moveNumber).toBe(0);
    expect(result.state.history.at(-1)).toMatchObject({
      type: "skill",
      effectType: "protocol-takeover",
      color: COLORS.black,
      id: pointId(4, 4),
      bannedColor: COLORS.white
    });
  });

  it("blocks banned-color moves and empty-point skill targets but allows stone-target skills on protocol points", () => {
    let state = createGameState([
      { color: COLORS.black, characterId: "mornye" },
      { color: COLORS.white, characterId: "sigrika" }
    ]);
    state = protocolTakeover(state, COLORS.black, pointId(4, 4), {
      skill: CHARACTERS.mornye.skill,
      skillName: CHARACTERS.mornye.skill.name,
      consumesTurn: false
    }).state;

    expect(playMove(state, COLORS.white, pointId(4, 4)).ok).toBe(false);
    expect(useSkill(state, COLORS.white, "sigrika", pointId(4, 4)).ok).toBe(false);

    state.turn = COLORS.black;
    const blackMove = playMove(state, COLORS.black, pointId(4, 4));
    expect(blackMove.ok).toBe(true);
    expect(getPoint(blackMove.state, pointId(4, 4)).protocolBan?.bannedColor).toBe(COLORS.white);

    blackMove.state.turn = COLORS.white;
    const flip = useSkill(blackMove.state, COLORS.white, "denia", pointId(4, 4));

    expect(flip.ok).toBe(true);
    expect(getPoint(flip.state, pointId(4, 4)).stone).toBe(COLORS.white);
    expect(getPoint(flip.state, pointId(4, 4)).protocolBan?.bannedColor).toBe(COLORS.white);
  });

  it("rejects protocol takeover targets that are occupied, erased, or already protocol banned", () => {
    const state = createGameState([
      { color: COLORS.black, characterId: "mornye" },
      { color: COLORS.white, characterId: "sigrika" }
    ]);
    forceStone(state, 3, 3, COLORS.white);
    getPoint(state, pointId(4, 4)).valid = false;
    getPoint(state, pointId(5, 5)).protocolBan = {
      owner: COLORS.white,
      bannedColor: COLORS.black,
      effect: "protocol-takeover"
    };

    expect(useSkill(state, COLORS.black, "mornye", pointId(3, 3)).ok).toBe(false);
    expect(useSkill(state, COLORS.black, "mornye", pointId(4, 4)).ok).toBe(false);
    expect(useSkill(state, COLORS.black, "mornye", pointId(5, 5)).ok).toBe(false);
  });

  it("keeps protocol bans through stone mutation and removal but clears them when the intersection is erased", () => {
    let state = createGameState([
      { color: COLORS.black, characterId: "mornye" },
      { color: COLORS.white, characterId: "sigrika" }
    ]);
    state = protocolTakeover(state, COLORS.black, pointId(4, 4), {
      skill: CHARACTERS.mornye.skill,
      skillName: CHARACTERS.mornye.skill.name,
      consumesTurn: false
    }).state;
    state.turn = COLORS.black;
    state = playMove(state, COLORS.black, pointId(4, 4)).state;
    state.turn = COLORS.white;
    state = flipStone(state, COLORS.white, pointId(4, 4), {
      skill: CHARACTERS.denia.skill,
      skillName: CHARACTERS.denia.skill.name,
      consumesTurn: false
    }).state;

    expect(getPoint(state, pointId(4, 4)).stone).toBe(COLORS.white);
    expect(getPoint(state, pointId(4, 4)).protocolBan?.bannedColor).toBe(COLORS.white);

    state = rowSlash(state, COLORS.black, pointId(4, 4), {
      skill: CHARACTERS.qiuyuan.skill,
      skillName: CHARACTERS.qiuyuan.skill.name,
      consumesTurn: false
    }).state;
    expect(getPoint(state, pointId(4, 4)).stone).toBeNull();
    expect(getPoint(state, pointId(4, 4)).protocolBan?.bannedColor).toBe(COLORS.white);

    state.turn = COLORS.black;
    const erased = erasePoint(state, COLORS.black, pointId(4, 4));
    expect(erased.ok).toBe(true);
    expect(getPoint(erased.state, pointId(4, 4)).valid).toBe(false);
    expect(getPoint(erased.state, pointId(4, 4)).protocolBan).toBeUndefined();
  });

  it("treats protocol-banned empty points as neutral for the banned color without polluting nearby territory", () => {
    const state = createGameState([
      { color: COLORS.black, characterId: "mornye" },
      { color: COLORS.white, characterId: "sigrika" }
    ]);
    surroundWhiteBox(state);
    getPoint(state, pointId(3, 3)).protocolBan = {
      owner: COLORS.black,
      bannedColor: COLORS.white,
      effect: "protocol-takeover"
    };
    const inside = new Set([
      pointId(2, 2), pointId(3, 2), pointId(4, 2),
      pointId(2, 3), pointId(3, 3), pointId(4, 3),
      pointId(2, 4), pointId(3, 4), pointId(4, 4)
    ]);
    const neutralOutside = state.points
      .filter((point) => point.valid && !point.stone && !inside.has(point.id))
      .map((point) => point.id);
    state.scoring = {
      ...prepareScoringState(state),
      neutralPoints: neutralOutside
    };
    state.scoring = prepareScoringState(state);

    expect(state.scoring.territory.white).not.toContain(pointId(3, 3));
    expect(state.scoring.territory.white).toEqual(expect.arrayContaining([
      pointId(2, 2),
      pointId(4, 4)
    ]));

    const result = scoreGame(state);
    expect(result.whiteTerritory).toBe(8);
  });

  it("uses Lynae spray skill to transform the target and one random eligible stone simultaneously", () => {
    const state = createGameState([{ color: COLORS.black }, { color: COLORS.white }]);
    forceStone(state, 4, 4, COLORS.white);
    forceStone(state, 5, 4, COLORS.black);
    const originalRandom = Math.random;
    Math.random = () => 0;

    try {
      const result = useSkill(
        state,
        COLORS.black,
        {
          effectType: "spray-stone",
          name: "流光溢彩",
          uses: 1,
          freeTurn: false,
          targetRule: "stone",
          costType: "numeric",
          costValue: "4",
          params: {}
        },
        pointId(4, 4)
      );

      expect(result.ok).toBe(true);
      expect(getPoint(result.state, pointId(4, 4)).stone).toBe("spray");
      expect(getPoint(result.state, pointId(5, 4)).stone).toBe("spray");
      expect(result.state.skillRemovals.black).toBe(0);
      expect(result.state.skillRemovals.white).toBe(1);
      expect(result.state.skillCosts.black).toBe(4);
      expect(result.state.turn).toBe(COLORS.white);
      expect(result.state.ko).toBeNull();
      expect(result.state.history.at(-1)).toMatchObject({
        type: "skill",
        effectType: "spray-stone",
        id: pointId(4, 4),
        randomTargetId: pointId(5, 4)
      });
    } finally {
      Math.random = originalRandom;
    }
  });

  it("lets Lynae spray skill resolve with only the selected eligible target", () => {
    const state = createGameState([{ color: COLORS.black }, { color: COLORS.white }]);
    forceStone(state, 4, 4, COLORS.black);
    forceStone(state, 5, 4, "spray");
    getPoint(state, pointId(6, 4)).stone = COLORS.white;
    getPoint(state, pointId(6, 4)).hiddenHand = {
      owner: COLORS.white,
      exposed: false,
      effect: "hidden-hand"
    };

    const result = useSkill(
      state,
      COLORS.black,
      {
        effectType: "spray-stone",
        name: "流光溢彩",
        uses: 1,
        freeTurn: false,
        targetRule: "stone",
        costType: "numeric",
        costValue: "4",
        params: {}
      },
      pointId(4, 4)
    );

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(4, 4)).stone).toBe("spray");
    expect(getPoint(result.state, pointId(5, 4)).stone).toBe("spray");
    expect(getPoint(result.state, pointId(6, 4)).stone).toBe(COLORS.white);
    expect(result.state.skillRemovals.black).toBe(-1);
    expect(result.state.skillRemovals.white).toBe(1);
    expect(result.state.history.at(-1).randomTargetId).toBeNull();
  });

  it("lets ordinary moves capture spray stones without capture credit", () => {
    const state = createGameState([{ color: COLORS.black }, { color: COLORS.white }]);
    forceStone(state, 1, 1, "spray");
    forceStone(state, 0, 1, COLORS.black);
    forceStone(state, 2, 1, COLORS.black);
    forceStone(state, 1, 0, COLORS.black);
    state.turn = COLORS.black;

    const result = playMove(state, COLORS.black, pointId(1, 2));

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(1, 1)).stone).toBeNull();
    expect(result.state.captures.black).toBe(0);
  });

  it("scores spray stones as neutral boundaries and neutral dead stones as no-credit removals", () => {
    const state = createGameState();
    forceStone(state, 0, 1, "spray");
    forceStone(state, 1, 0, "spray");
    state.scoring = prepareScoringState(state);

    const withSpray = scoreGame(state);
    expect(withSpray.blackTerritory).toBe(0);
    expect(withSpray.whiteTerritory).toBe(0);

    const marked = markDeadGroup(state, pointId(0, 1));
    expect(marked.ok).toBe(true);
    expect(marked.state.scoring.deadStones).toContain(pointId(0, 1));
    expect(marked.state.scoring.deadStoneOwners[pointId(0, 1)]).toBeUndefined();
  });

  it("uses configured random blast skill to remove stones in a random 3x3 area without consuming the turn", () => {
    const state = createGameState([{ color: COLORS.black }]);
    state.turn = COLORS.black;
    forceStone(state, 4, 4, COLORS.black);
    forceStone(state, 5, 4, COLORS.white);
    forceStone(state, 6, 6, COLORS.black);
    forceStone(state, 9, 9, COLORS.white);
    const originalRandom = Math.random;
    Math.random = () => 0;

    try {
      const result = useSkill(
        state,
        COLORS.black,
        {
          effectType: "random-blast",
          name: "猪小仙爆炸",
          uses: 1,
          freeTurn: true,
          targetRule: "none",
          costType: "numeric",
          costValue: "0",
          params: { size: 3 }
        },
        null
      );

      expect(result.ok).toBe(true);
      expect(getPoint(result.state, pointId(4, 4)).stone).toBeNull();
      expect(getPoint(result.state, pointId(5, 4)).stone).toBeNull();
      expect(getPoint(result.state, pointId(6, 6)).stone).toBe(COLORS.black);
      expect(getPoint(result.state, pointId(9, 9)).stone).toBe(COLORS.white);
      expect(getPoint(result.state, pointId(4, 4)).skillEffect).toBe("blast-marker");
      expect(getPoint(result.state, pointId(4, 4)).skillEffectOwner).toBe(COLORS.black);
      expect(result.state.history.at(-1).effectType).toBe("random-blast");
      expect(result.state.history.at(-1).marked).toHaveLength(9);
      expect(result.state.skillUses.black).toBe(0);
      expect(result.state.skillCosts.black).toBe(0);
      expect(result.state.skillRemovals.black).toBe(1);
      expect(result.state.skillRemovals.white).toBe(1);
      expect(result.state.turn).toBe(COLORS.black);
      expect(result.state.moveNumber).toBe(0);
      expect(result.state.history.at(-1).skill).toBe("猪小仙爆炸");
      const moveResult = playMove(result.state, COLORS.black, pointId(4, 4));
      expect(moveResult.ok).toBe(true);
      expect(getPoint(moveResult.state, pointId(4, 4)).stone).toBe(COLORS.black);
      expect(getPoint(moveResult.state, pointId(4, 4)).skillEffect).toBeNull();
      expect(getPoint(moveResult.state, pointId(5, 4)).skillEffect).toBeNull();
    } finally {
      Math.random = originalRandom;
    }
  });

  it("lets random blast remove spray stones without awarding black or white removals", () => {
    const state = createGameState([{ color: COLORS.black }, { color: COLORS.white }]);
    state.turn = COLORS.black;
    forceStone(state, 4, 4, "spray");
    forceStone(state, 5, 4, COLORS.white);
    const originalRandom = Math.random;
    Math.random = () => 0;

    try {
      const result = randomBlast(state, COLORS.black, {
        skill: {
          params: { size: 3 },
          costType: "numeric",
          costValue: "0"
        }
      });

      expect(result.ok).toBe(true);
      expect(getPoint(result.state, pointId(4, 4)).stone).toBeNull();
      expect(getPoint(result.state, pointId(5, 4)).stone).toBeNull();
      expect(result.state.skillRemovals.black).toBe(1);
      expect(result.state.skillRemovals.white).toBe(0);
    } finally {
      Math.random = originalRandom;
    }
  });

  it("uses QiuYuan row slash on any valid point and charges overclock for direct row removals", () => {
    const state = createGameState([
      { color: COLORS.black, characterId: "qiuyuan" },
      { color: COLORS.white, characterId: "sigrika" }
    ]);
    state.turn = COLORS.black;
    state.ko = pointId(2, 2);
    state.passes = 2;
    forceStone(state, 0, 4, COLORS.black);
    forceStone(state, 1, 4, COLORS.white);
    forceStone(state, 2, 4, "spray");
    forceStone(state, 3, 4, COLORS.white);
    getPoint(state, pointId(3, 4)).hiddenHand = {
      owner: COLORS.white,
      exposed: false,
      effect: "hidden-hand"
    };
    forceStone(state, 4, 4, COLORS.black);
    getPoint(state, pointId(4, 4)).colorIllusion = {
      owner: COLORS.black,
      visibleAs: COLORS.white,
      effect: "color-illusion-passive"
    };

    const result = useSkill(state, COLORS.black, "qiuyuan", pointId(6, 4));

    expect(result.ok).toBe(true);
    for (let x = 0; x <= 4; x += 1) {
      const point = getPoint(result.state, pointId(x, 4));
      expect(point.stone).toBeNull();
      expect(point.hiddenHand).toBeFalsy();
      expect(point.colorIllusion).toBeFalsy();
    }
    expect(result.notices ?? []).not.toContain("鍙戠幇闅愯棌鎵嬩簡锛?");
    expect(result.state.skillRemovals.black).toBe(1);
    expect(result.state.skillRemovals.white).toBe(2);
    expect(result.state.skillCosts.black).toBe(5);
    expect(result.state.skillUses.black).toBe(0);
    expect(result.state.turn).toBe(COLORS.white);
    expect(result.state.moveNumber).toBe(1);
    expect(result.state.passes).toBe(0);
    expect(result.state.ko).toBeNull();
    expect(result.state.rowEffects).toEqual([{
      effectType: "row-slash",
      owner: COLORS.black,
      clearAfterColor: COLORS.white,
      y: 4,
      id: pointId(6, 4)
    }]);
    expect(result.state.history.at(-1)).toMatchObject({
      type: "skill",
      effectType: "row-slash",
      row: 4,
      directRemoved: 5,
      overclockAdded: 5,
      removed: 5,
      removedByColor: { black: 2, white: 2, spray: 1 },
      directRemovals: expect.arrayContaining([
        expect.objectContaining({ id: pointId(0, 4), from: COLORS.black }),
        expect.objectContaining({ id: pointId(1, 4), from: COLORS.white }),
        expect.objectContaining({ id: pointId(2, 4), from: "spray" })
      ])
    });
  });

  it("lets QiuYuan row slash empty rows and rejects erased target points", () => {
    const state = createGameState([
      { color: COLORS.black, characterId: "qiuyuan" },
      { color: COLORS.white, characterId: "sigrika" }
    ]);
    state.turn = COLORS.black;

    const empty = useSkill(state, COLORS.black, "qiuyuan", pointId(6, 6));

    expect(empty.ok).toBe(true);
    expect(empty.state.skillCosts.black).toBe(0);
    expect(empty.state.skillUses.black).toBe(0);
    expect(empty.state.turn).toBe(COLORS.white);
    expect(empty.state.history.at(-1)).toMatchObject({
      effectType: "row-slash",
      directRemoved: 0,
      overclockAdded: 0
    });

    const invalidTargetState = createGameState([
      { color: COLORS.black, characterId: "qiuyuan" },
      { color: COLORS.white, characterId: "sigrika" }
    ]);
    getPoint(invalidTargetState, pointId(6, 6)).valid = false;
    const invalid = useSkill(invalidTargetState, COLORS.black, "qiuyuan", pointId(6, 6));

    expect(invalid.ok).toBe(false);
    expect(invalidTargetState.skillUses.black).toBe(1);
  });

  it("keeps QiuYuan chain cleanup out of row-slash overclock", () => {
    const state = createGameState([
      { color: COLORS.black, characterId: "qiuyuan" },
      { color: COLORS.white, characterId: "sigrika" }
    ]);
    forceStone(state, 10, 10, COLORS.white);
    forceStone(state, 9, 10, COLORS.black);
    forceStone(state, 11, 10, COLORS.black);
    forceStone(state, 10, 9, COLORS.black);
    forceStone(state, 10, 11, COLORS.black);

    const result = useSkill(state, COLORS.black, "qiuyuan", pointId(6, 6));

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(10, 10)).stone).toBeNull();
    expect(result.state.skillRemovals.black).toBe(0);
    expect(result.state.skillCosts.black).toBe(0);
    expect(result.state.history.at(-1).cleanupRemovals).toEqual([
      { color: COLORS.white, stones: [pointId(10, 10)], owner: COLORS.black }
    ]);
  });

  it("uses Chisa liberty purge after a legal move and clamps overclock from snapshot removals", () => {
    const state = createGameState([
      { color: COLORS.black, characterId: "chisa" },
      { color: COLORS.white, characterId: "sigrika" }
    ]);
    state.turn = COLORS.black;
    state.ko = pointId(12, 12);
    state.passes = 2;

    forceStone(state, 3, 3, COLORS.white);
    forceStone(state, 2, 3, COLORS.black);
    forceStone(state, 4, 3, COLORS.black);
    forceStone(state, 3, 2, COLORS.black);

    forceStone(state, 6, 6, COLORS.black);
    forceStone(state, 5, 6, COLORS.white);
    forceStone(state, 7, 6, COLORS.white);
    forceStone(state, 6, 5, COLORS.white);

    forceStone(state, 9, 9, "spray");
    forceStone(state, 8, 9, COLORS.white);
    forceStone(state, 10, 9, COLORS.white);
    forceStone(state, 9, 8, COLORS.white);

    const result = useSkill(state, COLORS.black, "chisa", pointId(0, 0));

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(0, 0)).stone).toBe(COLORS.black);
    expect(getPoint(result.state, pointId(0, 0)).skillEffect).toBe("liberty-purge-stone");
    expect(getPoint(result.state, pointId(0, 0)).skillEffectOwner).toBe(COLORS.black);
    expect(getPoint(result.state, pointId(3, 3)).stone).toBeNull();
    expect(getPoint(result.state, pointId(6, 6)).stone).toBeNull();
    expect(getPoint(result.state, pointId(9, 9)).stone).toBeNull();
    expect(result.state.skillRemovals.black).toBe(1);
    expect(result.state.skillRemovals.white).toBe(1);
    expect(result.state.skillCosts.black).toBe(1);
    expect(result.state.skillUses.black).toBe(0);
    expect(result.state.turn).toBe(COLORS.white);
    expect(result.state.moveNumber).toBe(1);
    expect(result.state.passes).toBe(0);
    expect(result.state.ko).toBeNull();
    expect(result.state.libertyPurgeMarks).toEqual([{
      effectType: "liberty-purge",
      owner: COLORS.black,
      clearAfterColor: COLORS.white,
      pointIds: [pointId(3, 3), pointId(6, 6), pointId(9, 9)]
    }]);
    expect(result.state.history.at(-1)).toMatchObject({
      type: "skill",
      effectType: "liberty-purge",
      id: pointId(0, 0),
      placedId: pointId(0, 0),
      rawOverclockDelta: 1,
      overclockAdded: 1,
      removed: 3,
      removedByColor: { white: 1, black: 1, spray: 1 },
      removalMarkIds: [pointId(3, 3), pointId(6, 6), pointId(9, 9)]
    });
  });

  it("lets Chisa reveal an opponent hidden hand without spending the skill", () => {
    const state = createGameState([
      { color: COLORS.black, characterId: "chisa" },
      { color: COLORS.white, characterId: "aemeath" }
    ]);
    const target = getPoint(state, pointId(4, 4));
    target.stone = COLORS.white;
    target.hiddenHand = {
      owner: COLORS.white,
      exposed: false,
      effect: "hidden-hand"
    };

    const result = useSkill(state, COLORS.black, "chisa", pointId(4, 4));

    expect(result.ok).toBe(true);
    expect(result.revealedOnly).toBe(true);
    expect(getPoint(result.state, pointId(4, 4)).hiddenHand.exposed).toBe(true);
    expect(result.state.skillUses.black).toBe(1);
    expect(result.state.turn).toBe(COLORS.black);
    expect(result.state.history).toEqual([]);
  });

  it("keeps Chisa removal marks through non-turn-consuming skills and clears them after the opponent turn ends", () => {
    const state = createGameState([
      { color: COLORS.black, characterId: "chisa" },
      { color: COLORS.white, characterId: "sigrika" }
    ]);
    forceStone(state, 3, 3, COLORS.white);
    forceStone(state, 2, 3, COLORS.black);
    forceStone(state, 4, 3, COLORS.black);
    forceStone(state, 3, 2, COLORS.black);

    const chisaResult = useSkill(state, COLORS.black, "chisa", pointId(0, 0));
    expect(chisaResult.ok).toBe(true);
    expect(chisaResult.state.libertyPurgeMarks?.[0]?.pointIds).toEqual([pointId(3, 3)]);

    const freeSkillResult = useSkill(chisaResult.state, COLORS.white, "sigrika", pointId(1, 1));
    expect(freeSkillResult.ok).toBe(true);
    expect(freeSkillResult.state.turn).toBe(COLORS.white);
    expect(freeSkillResult.state.libertyPurgeMarks?.[0]?.pointIds).toEqual([pointId(3, 3)]);

    const passResult = passMove(freeSkillResult.state, COLORS.white);
    expect(passResult.ok).toBe(true);
    expect(passResult.state.turn).toBe(COLORS.black);
    expect(passResult.state.libertyPurgeMarks).toEqual([]);
  });

  it("rejects Chisa targets that are not legal ordinary moves", () => {
    const occupied = createGameState([
      { color: COLORS.black, characterId: "chisa" },
      { color: COLORS.white, characterId: "sigrika" }
    ]);
    forceStone(occupied, 4, 4, COLORS.white);
    expect(useSkill(occupied, COLORS.black, "chisa", pointId(4, 4)).ok).toBe(false);

    const ko = createGameState([
      { color: COLORS.black, characterId: "chisa" },
      { color: COLORS.white, characterId: "sigrika" }
    ]);
    ko.ko = pointId(4, 4);
    expect(useSkill(ko, COLORS.black, "chisa", pointId(4, 4)).ok).toBe(false);

    const suicide = createGameState([
      { color: COLORS.black, characterId: "chisa" },
      { color: COLORS.white, characterId: "sigrika" }
    ]);
    forceStone(suicide, 0, 1, COLORS.white);
    forceStone(suicide, 1, 0, COLORS.white);
    expect(useSkill(suicide, COLORS.black, "chisa", pointId(0, 0)).ok).toBe(false);
  });

  it("clears QiuYuan slash marks on the opponent's next ordinary move", () => {
    const state = createGameState([
      { color: COLORS.black, characterId: "qiuyuan" },
      { color: COLORS.white, characterId: "sigrika" }
    ]);
    const slashed = rowSlash(state, COLORS.black, pointId(6, 6), {
      skill: CHARACTERS.qiuyuan.skill,
      skillName: CHARACTERS.qiuyuan.skill.name
    }).state;
    const whiteMove = playMove(slashed, COLORS.white, pointId(0, 0)).state;

    expect(whiteMove.rowEffects).toEqual([]);
  });

  it("chooses the random blast center from existing non-edge stones", () => {
    const state = createGameState([{ color: COLORS.black }]);
    state.turn = COLORS.black;
    forceStone(state, 0, 6, COLORS.white);
    forceStone(state, 4, 4, COLORS.black);
    forceStone(state, 9, 9, COLORS.white);
    const originalRandom = Math.random;
    Math.random = () => 0;

    try {
      const result = useSkill(state, COLORS.black, "baconbits", null);

      expect(result.ok).toBe(true);
      expect(result.state.history.at(-1).id).toBe(pointId(4, 4));
      expect(getPoint(result.state, pointId(0, 6)).stone).toBe(COLORS.white);
      expect(getPoint(result.state, pointId(4, 4)).stone).toBeNull();
    } finally {
      Math.random = originalRandom;
    }
  });

  it("rejects random blast when there are no non-edge stones", () => {
    const state = createGameState([{ color: COLORS.black }]);
    forceStone(state, 0, 0, COLORS.black);

    const result = randomBlast(state, COLORS.black, {
      skill: {
        params: { size: 3 },
        costType: "numeric",
        costValue: "0"
      }
    });

    expect(result.ok).toBe(false);
  });

  it("reports stone-dependent skills unavailable while the board has no stones", () => {
    const state = createGameState([{ color: COLORS.black, characterId: "denia" }]);

    expect(canStartSkill(state, "denia")).toBe(false);
    expect(canStartSkill(state, "baconbits")).toBe(false);
    expect(canStartSkill(state, "aemeath")).toBe(true);

    forceStone(state, 4, 4, COLORS.white);

    expect(canStartSkill(state, "denia")).toBe(true);
    expect(canStartSkill(state, "baconbits")).toBe(true);
  });

  it("places a hidden hand with Aemeath skill", () => {
    const state = createGameState([{ color: COLORS.black }]);

    const result = useSkill(state, COLORS.black, "aemeath", pointId(4, 4));

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(4, 4)).stone).toBe(COLORS.black);
    expect(getPoint(result.state, pointId(4, 4)).hiddenHand).toEqual({
      owner: COLORS.black,
      exposed: false,
      effect: "hidden-hand"
    });
    expect(result.state.skillUses.black).toBe(0);
    expect(result.state.skillCosts.black).toBe(0);
    expect(result.state.turn).toBe(COLORS.white);
  });

  it("creates Voyage Star after Aemeath hidden-hand without leaking the source in opponent views", () => {
    const state = createGameState([{ color: COLORS.black }, { color: COLORS.white }]);

    const result = useSkill(state, COLORS.black, "aemeath", pointId(4, 4));

    expect(result.ok).toBe(true);
    expect(result.state.derivedSkills.black).toMatchObject({
      effectType: "voyage-star",
      name: "远航星",
      uses: 1,
      sourceHiddenHandId: pointId(4, 4)
    });
    expect(gameViewForColor(result.state, COLORS.white).derivedSkills.black).toMatchObject({
      effectType: "voyage-star",
      uses: 1,
      sourceHiddenHandId: null
    });
  });

  it("keeps Voyage Star disabled if its hidden hand has been exposed", () => {
    let state = createGameState([{ color: COLORS.black }, { color: COLORS.white }]);
    state = useSkill(state, COLORS.black, "aemeath", pointId(6, 6)).state;
    state = playMove(state, COLORS.white, pointId(6, 6)).state;
    state.turn = COLORS.black;

    expect(canStartSkill(state, state.derivedSkills.black)).toBe(false);
    expect(useSkill(state, COLORS.black, state.derivedSkills.black, null).ok).toBe(false);
  });

  it("uses Voyage Star from the hidden-hand source, erases the cross, removes the outer stones, and keeps the turn", () => {
    let state = createGameState([{ color: COLORS.black }, { color: COLORS.white }]);
    state = useSkill(state, COLORS.black, "aemeath", pointId(6, 6)).state;
    forceStone(state, 5, 6, COLORS.white);
    forceStone(state, 7, 6, COLORS.black);
    forceStone(state, 6, 5, COLORS.white);
    forceStone(state, 6, 7, COLORS.black);
    forceStone(state, 4, 6, COLORS.white);
    forceStone(state, 8, 6, COLORS.white);
    forceStone(state, 6, 4, COLORS.black);
    state.turn = COLORS.black;

    const result = useSkill(state, COLORS.black, state.derivedSkills.black, null);

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(6, 6))).toMatchObject({
      valid: false,
      stone: null,
      skillEffect: "voyage-star-crater-point"
    });
    for (const id of [pointId(5, 6), pointId(7, 6), pointId(6, 5), pointId(6, 7)]) {
      expect(getPoint(result.state, id)).toMatchObject({
        valid: false,
        stone: null,
        skillEffect: "voyage-star-erased-point"
      });
    }
    for (const id of [pointId(4, 6), pointId(8, 6), pointId(6, 4)]) {
      expect(getPoint(result.state, id).stone).toBe(null);
    }
    expect(result.state.derivedSkills.black).toMatchObject({ uses: 0, spent: true, sourceHiddenHandId: null });
    expect(result.state.skillCosts.black).toBe(5);
    expect(result.state.turn).toBe(COLORS.black);
    expect(result.state.moveNumber).toBe(1);
    expect(result.state.history.at(-1)).toMatchObject({
      effectType: "voyage-star",
      id: pointId(6, 6),
      removed: 8,
      costValue: "5",
      musicTrackId: "aemeath-voyage-star-default"
    });
  });

  it("keeps Voyage Star centered on the exact hidden-hand coordinate", () => {
    let state = createGameState([{ color: COLORS.black }, { color: COLORS.white }]);
    const hiddenHandId = pointId(3, 4);
    state = useSkill(state, COLORS.black, "aemeath", hiddenHandId).state;
    state.turn = COLORS.black;

    const result = useSkill(state, COLORS.black, state.derivedSkills.black, null);

    expect(result.ok).toBe(true);
    expect(result.state.history.at(-1)).toMatchObject({
      effectType: "voyage-star",
      id: hiddenHandId,
      erasedPointIds: expect.arrayContaining([
        hiddenHandId,
        pointId(2, 4),
        pointId(4, 4),
        pointId(3, 3),
        pointId(3, 5)
      ])
    });
    expect(getPoint(result.state, hiddenHandId)).toMatchObject({
      valid: false,
      skillEffect: "voyage-star-crater-point"
    });
    expect(getPoint(result.state, pointId(4, 5)).valid).toBe(true);
  });

  it("creates a random test layout with 50 black and 50 white stones and no dead groups", () => {
    const state = createGameState();

    const result = randomLayout(state, { black: 50, white: 50 });

    expect(result.ok).toBe(true);
    expect(result.state.points.filter((point) => point.stone === COLORS.black)).toHaveLength(50);
    expect(result.state.points.filter((point) => point.stone === COLORS.white)).toHaveLength(50);
    for (const point of result.state.points.filter((candidate) => candidate.stone)) {
      expect(result.state.points.some((candidate) => candidate.id === point.id)).toBe(true);
      expect(result.state.points.find((candidate) => candidate.id === point.id)).toBe(point);
    }
    const visited = new Set();
    for (const point of result.state.points.filter((candidate) => candidate.stone)) {
      if (visited.has(point.id)) continue;
      const group = collectTestGroup(result.state, point.id);
      group.stones.forEach((stone) => visited.add(stone));
      expect(group.liberties.size).toBeGreaterThan(0);
    }
  });

  it("restores the current player's configured skill uses", () => {
    const state = createGameState([{ color: COLORS.black, character: { skill: { effectType: "erase-point", uses: 2 } } }]);
    state.skillUses.black = 0;

    const result = restoreSkillUse(state, COLORS.black);

    expect(result.ok).toBe(true);
    expect(result.state.skillUses.black).toBe(2);
  });

  it("reveals a hidden hand when it participates in a capture", () => {
    const state = createGameState([{ color: COLORS.black }]);
    forceStone(state, 4, 3, COLORS.black);
    forceStone(state, 3, 4, COLORS.black);
    forceStone(state, 5, 4, COLORS.black);
    forceStone(state, 4, 4, COLORS.white);
    state.turn = COLORS.black;

    const result = useSkill(state, COLORS.black, "aemeath", pointId(4, 5));

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(4, 4)).stone).toBe(null);
    expect(getPoint(result.state, pointId(4, 5)).hiddenHand.exposed).toBe(true);
    expect(result.state.history.at(-1).hiddenHandRevealed).toBe(true);
    expect(result.notices).toContain("发现隐藏手了！");
  });

  it("reveals a separate hidden hand that helps surround a captured group", () => {
    const state = createGameState();
    forceStone(state, 4, 3, COLORS.black);
    getPoint(state, pointId(4, 3)).hiddenHand = {
      owner: COLORS.black,
      exposed: false,
      effect: "hidden-hand"
    };
    forceStone(state, 3, 4, COLORS.black);
    forceStone(state, 5, 4, COLORS.black);
    forceStone(state, 4, 4, COLORS.white);
    state.turn = COLORS.black;

    const result = playMove(state, COLORS.black, pointId(4, 5));

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(4, 4)).stone).toBe(null);
    expect(getPoint(result.state, pointId(4, 3)).hiddenHand.exposed).toBe(true);
    expect(result.state.history.at(-1).hiddenHandRevealed).toBe(true);
    expect(result.notices).toContain("发现隐藏手了！");
  });

  it("reveals a hidden hand when the opponent tries to play on it without consuming the turn", () => {
    let state = createGameState([{ color: COLORS.black }, { color: COLORS.white }]);
    state = useSkill(state, COLORS.black, "aemeath", pointId(6, 6)).state;

    const result = playMove(state, COLORS.white, pointId(6, 6));

    expect(result.ok).toBe(true);
    expect(result.state.turn).toBe(COLORS.white);
    expect(result.state.moveNumber).toBe(1);
    expect(getPoint(result.state, pointId(6, 6)).stone).toBe(COLORS.black);
    expect(getPoint(result.state, pointId(6, 6)).hiddenHand.exposed).toBe(true);
    expect(result.notices).toContain("发现隐藏手了！");
  });

  it("temporarily removes unexposed hidden hands when counting starts", () => {
    let state = createGameState([{ color: COLORS.black }, { color: COLORS.white }]);
    state = useSkill(state, COLORS.black, "aemeath", pointId(3, 3)).state;
    state.phase = GAME_PHASES.countingRequested;
    suspendUnexposedHiddenHands(state);
    state.scoring = prepareScoringState(state);

    expect(state.phase).toBe("counting-requested");
    expect(getPoint(state, pointId(3, 3)).stone).toBe(null);
    expect(state.suspendedHiddenHands).toEqual([
      { id: pointId(3, 3), color: COLORS.black }
    ]);
  });

  it("scores with black komi of 2.75 stones", () => {
    const state = createGameState();
    forceStone(state, 0, 0, COLORS.black);
    forceStone(state, 12, 12, COLORS.white);
    state.scoring = prepareScoringState(state);

    const result = scoreGame(state);

    expect(result.blackAfterKomi).toBe(-1.75);
    expect(result.whiteAfterKomi).toBe(3.75);
    expect(result.formula.black).toMatchObject({
      stones: 1,
      territory: 0,
      komi: -2.75,
      total: -1.75
    });
    expect(result.formula.white).toMatchObject({
      stones: 1,
      territory: 0,
      komi: 2.75,
      total: 3.75
    });
    expect(result.marginValue).toBe(-5.5);
    expect(result.margin).toBe(2.75);
    expect(result.text).toBe("白胜2又3/4子");
  });

  it("scores standard mode with black komi of 3.75 stones and no skill costs", () => {
    const state = createGameState([], { mode: "standard" });
    forceStone(state, 0, 0, COLORS.black);
    forceStone(state, 18, 18, COLORS.white);
    state.skillCosts.black = 5;
    state.skillCosts.white = 2;
    state.scoring = prepareScoringState(state);

    const result = scoreGame(state);

    expect(result.blackAfterKomi).toBe(-2.75);
    expect(result.whiteAfterKomi).toBe(4.75);
    expect(result.blackSkillCost).toBe(0);
    expect(result.whiteSkillCost).toBe(0);
    expect(result.formula.black).toMatchObject({
      stones: 1,
      territory: 0,
      komi: -3.75,
      ownSkillCost: 0,
      opponentSkillCost: 0,
      total: -2.75
    });
    expect(result.formula.white).toMatchObject({
      stones: 1,
      territory: 0,
      komi: 3.75,
      ownSkillCost: 0,
      opponentSkillCost: 0,
      total: 4.75
    });
    expect(result.marginValue).toBe(-7.5);
    expect(result.margin).toBe(3.75);
  });

  it("subtracts numeric skill cost before deciding the scoring winner", () => {
    const state = createGameState();
    forceStone(state, 0, 0, COLORS.black);
    forceStone(state, 1, 0, COLORS.black);
    forceStone(state, 12, 12, COLORS.white);
    state.skillCosts.black = 3;
    state.scoring = prepareScoringState(state);

    const result = scoreGame(state);

    expect(result.blackSkillCost).toBe(3);
    expect(result.black).toBe(-3.75);
    expect(result.blackAfterKomi).toBe(-3.75);
    expect(result.white).toBe(6.75);
    expect(result.winnerColor).toBe(COLORS.white);
    expect(result.marginValue).toBe(-10.5);
    expect(result.margin).toBe(5.25);
    expect(result.text).toBe("白胜5又1/4子");
  });

  it("describes resignation as a midgame win for the opponent", () => {
    const state = createGameState();

    const result = resignGame(state, COLORS.white);

    expect(result.ok).toBe(true);
    expect(result.state.winner.winnerColor).toBe(COLORS.black);
    expect(result.state.winner.text).toBe("黑中盘胜");
  });

  it("marks any result through move 10 as an invalid game", () => {
    const state = createGameState();
    state.moveNumber = 10;

    expect(resultWithInvalidFlagForGame(state, createTimeoutResult(COLORS.white))).toMatchObject({
      winnerColor: COLORS.black,
      invalid: true
    });
  });

  it("keeps results after move 10 valid", () => {
    const state = createGameState();
    state.moveNumber = 11;

    expect(resultWithInvalidFlagForGame(state, createDrawResult("agreement"))).toEqual({
      winnerColor: null,
      reason: "agreement",
      text: "和棋"
    });
  });

  it("creates a draw result without a winner color", () => {
    const result = createDrawResult("agreement");

    expect(result).toEqual({
      winnerColor: null,
      reason: "agreement",
      text: "和棋"
    });
  });

  it("describes timeout as a timeout win for the opponent", () => {
    const result = createTimeoutResult(COLORS.white);

    expect(result).toEqual({
      winnerColor: COLORS.black,
      reason: "timeout",
      text: "黑超时胜"
    });
  });

  it("marks connected potential dead stones inside the opponent territory", () => {
    const state = createGameState();
    surroundWhiteBox(state);
    forceStone(state, 2, 2, COLORS.black);
    forceStone(state, 4, 2, COLORS.black);
    state.scoring = prepareScoringState(state);

    const result = markDeadGroup(state, pointId(2, 2), COLORS.black);

    expect(result.ok).toBe(true);
    expect(result.state.scoring.deadStones).toContain(pointId(2, 2));
    expect(result.state.scoring.deadStones).toContain(pointId(4, 2));
    expect(result.state.scoring.deadStoneOwners[pointId(2, 2)]).toBe(COLORS.white);
    expect(result.state.scoring.deadStoneOwners[pointId(4, 2)]).toBe(COLORS.white);
  });

  it("only lets a player mark their own stones as dead", () => {
    const state = createGameState();
    surroundWhiteBox(state);
    forceStone(state, 2, 2, COLORS.black);
    state.scoring = prepareScoringState(state);

    const result = markDeadGroup(state, pointId(2, 2), COLORS.white);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("只能标记自己颜色的死子");
  });

  it("scores by temporarily removing marked dead stones and preserving board stones", () => {
    const state = createGameState();
    surroundWhiteBox(state);
    forceStone(state, 2, 2, COLORS.black);
    const inside = new Set([
      pointId(2, 2), pointId(3, 2), pointId(4, 2),
      pointId(2, 3), pointId(3, 3), pointId(4, 3),
      pointId(2, 4), pointId(3, 4), pointId(4, 4)
    ]);
    const neutralOutside = state.points
      .filter((point) => point.valid && !point.stone && !inside.has(point.id))
      .map((point) => point.id);
    state.scoring = {
      ...prepareScoringState(state),
      deadStones: [pointId(2, 2)],
      deadStoneOwners: { [pointId(2, 2)]: COLORS.white },
      neutralPoints: neutralOutside
    };

    const result = scoreGame(state);

    expect(result.whiteTerritory).toBe(9);
    expect(result.white).toBe(27.75);
    expect(getPoint(state, pointId(2, 2)).stone).toBe(COLORS.black);
  });

  it("adds the opponent numeric skill cost to each scoring result", () => {
    const state = createGameState();
    forceStone(state, 0, 0, COLORS.black);
    forceStone(state, 12, 12, COLORS.white);
    state.skillCosts.black = 3;
    state.skillCosts.white = 1;
    state.scoring = prepareScoringState(state);

    const result = scoreGame(state);

    expect(result.formula.black).toMatchObject({
      ownSkillCost: -3,
      opponentSkillCost: 1,
      total: -3.75
    });
    expect(result.formula.white).toMatchObject({
      ownSkillCost: -1,
      opponentSkillCost: 3,
      total: 5.75
    });
    expect(result.marginValue).toBe(-9.5);
    expect(result.margin).toBe(4.75);
    expect(result.text).toBe("白胜4又3/4子");
  });

  it("counts positive and negative skill removals in scoring", () => {
    const state = createGameState();
    forceStone(state, 0, 0, COLORS.black);
    forceStone(state, 12, 12, COLORS.white);
    state.skillRemovals.black = -1;
    state.skillRemovals.white = 2;
    state.scoring = prepareScoringState(state);

    const result = scoreGame(state);

    expect(result.blackSkillRemovals).toBe(-1);
    expect(result.whiteSkillRemovals).toBe(2);
    expect(result.black).toBe(-2.75);
    expect(result.white).toBe(5.75);
    expect(result.formula.black).toMatchObject({
      stones: 1,
      skillRemovals: -1,
      total: -2.75
    });
    expect(result.formula.white).toMatchObject({
      stones: 1,
      skillRemovals: 2,
      total: 5.75
    });
  });

  it("unlocks ChangLi only after the opponent resolves an active skill", () => {
    const state = createGameState([
      { color: COLORS.black, characterId: "changli" },
      { color: COLORS.white, characterId: "sigrika" }
    ]);

    expect(canStartSkill(state, "changli")).toBe(false);
    state.history.push({ type: "skill", effectType: "color-illusion-passive", color: COLORS.white });
    expect(canStartSkill(state, "changli")).toBe(false);
    state.history.push({ type: "skill", effectType: "erase-point", color: COLORS.white });
    expect(canStartSkill(state, "changli")).toBe(true);
  });

  it("unlocks ChangLi after the opponent resolves hidden-hand active skill", () => {
    let state = createGameState([
      { color: COLORS.black, characterId: "changli" },
      { color: COLORS.white, characterId: "aemeath" }
    ]);
    state.turn = COLORS.white;

    const hiddenHand = useSkill(state, COLORS.white, "aemeath", pointId(3, 3));

    expect(hiddenHand.ok).toBe(true);
    state = hiddenHand.state;
    expect(state.history.at(-1)).toMatchObject({
      type: "skill",
      effectType: "hidden-hand",
      color: COLORS.white
    });
    expect(state.turn).toBe(COLORS.black);
    expect(canStartSkill(state, "changli")).toBe(true);
  });

  it("lets ChangLi take two normal moves after the skill resolves", () => {
    let state = createGameState([
      { color: COLORS.black, characterId: "changli" },
      { color: COLORS.white, characterId: "sigrika" }
    ]);
    state.history.push({ type: "skill", effectType: "erase-point", color: COLORS.white });

    const skillResult = useSkill(state, COLORS.black, "changli");
    expect(skillResult.ok).toBe(true);
    expect(skillResult.state.turn).toBe(COLORS.black);
    expect(skillResult.state.extraTurn).toMatchObject({ owner: COLORS.black, remaining: 2, used: 0 });
    expect(skillResult.state.skillCosts.black).toBe(3);

    const firstMove = playMove(skillResult.state, COLORS.black, pointId(3, 3));
    expect(firstMove.ok).toBe(true);
    expect(firstMove.state.turn).toBe(COLORS.black);
    expect(firstMove.state.extraTurn).toMatchObject({ owner: COLORS.black, remaining: 1, used: 1 });
    expect(getPoint(firstMove.state, pointId(3, 3)).skillEffect).toBe("double-move-stone");

    const secondMove = playMove(firstMove.state, COLORS.black, pointId(4, 4));
    expect(secondMove.ok).toBe(true);
    expect(secondMove.state.turn).toBe(COLORS.white);
    expect(secondMove.state.extraTurn).toBeNull();
    expect(secondMove.state.skillRemovals.black).toBe(1);
    expect(getPoint(secondMove.state, pointId(3, 3)).skillEffect).toBe("double-move-stone");
    expect(getPoint(secondMove.state, pointId(4, 4)).skillEffect).toBe("double-move-stone");
  });

  it("does not consume ChangLi extra moves on illegal move attempts", () => {
    let state = createGameState([
      { color: COLORS.black, characterId: "changli" },
      { color: COLORS.white, characterId: "sigrika" }
    ]);
    state.history.push({ type: "skill", effectType: "erase-point", color: COLORS.white });
    state = useSkill(state, COLORS.black, "changli").state;

    const illegal = playMove(state, COLORS.black, pointId(-1, -1));

    expect(illegal.ok).toBe(false);
    expect(state.extraTurn).toMatchObject({ owner: COLORS.black, remaining: 2, used: 0 });
  });

  it("clears ChangLi extra turn when the player passes", () => {
    let state = createGameState([
      { color: COLORS.black, characterId: "changli" },
      { color: COLORS.white, characterId: "sigrika" }
    ]);
    state.history.push({ type: "skill", effectType: "erase-point", color: COLORS.white });
    state = useSkill(state, COLORS.black, "changli").state;

    const result = passMove(state, COLORS.black);

    expect(result.ok).toBe(true);
    expect(result.state.turn).toBe(COLORS.white);
    expect(result.state.extraTurn).toBeNull();
    expect(result.state.passes).toBe(1);
  });
});
