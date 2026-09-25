import { describe, expect, it, vi } from "vitest";
import { COLORS, GAME_PHASES, playMove } from "../src/shared/game.js";
import { createPracticeRoom, createSigrikaCandyDuelRoom } from "./roomFactory.js";
import { createPracticeRoomAutomation } from "./practiceRoomAutomation.js";

function player() {
  return {
    user: {
      id: "human",
      username: "player",
      rating: 1000,
      rank: "3段",
      selectedCharacter: "sigrika",
      characterConfig: null
    },
    socketId: "socket-human"
  };
}

function automationHarness(room, {
  practiceEngine = {
    search: vi.fn().mockResolvedValue({
      ok: true,
      action: { type: "move", pointId: "3,3" }
    })
  },
  zhiziEngine = {
    isEnabled: () => false,
    close: vi.fn()
  }
} = {}) {
  let scheduledCallback = null;
  const rooms = new Map([[room.code, room]]);
  const handleGameAction = vi.fn(() => ({ ok: true, room }));
  const broadcastRoom = vi.fn();
  const appendSystem = vi.fn();
  const scheduleRoomClose = vi.fn();
  const persistRoom = vi.fn();
  const automation = createPracticeRoomAutomation({
    rooms,
    scheduleRoomTimeout: (_room, callback) => { scheduledCallback = callback; },
    handleGameAction,
    respondCounting: vi.fn(),
    respondDraw: vi.fn(),
    handleScoringAction: vi.fn(),
    appendSystem,
    appendNotices: vi.fn(),
    scheduleRoomClose,
    broadcastRoom,
    random: () => 0,
    practiceEngine,
    zhiziEngine,
    persistRoom
  });
  return {
    automation,
    practiceEngine,
    handleGameAction,
    broadcastRoom,
    appendSystem,
    scheduleRoomClose,
    persistRoom,
    run: () => scheduledCallback?.()
  };
}

describe("practice room automation", () => {
  it("keeps the advanced challenge playing after 22 captures", async () => {
    const room = createPracticeRoom(player(), { difficulty: "advanced", challenge: "capture-challenge", playerColor: "black" });
    room.game.phase = GAME_PHASES.playing;
    room.game.turn = COLORS.white;
    room.game.captures.black = 30;
    const harness = automationHarness(room);
    harness.automation.schedule(room, {});
    await harness.run();
    expect(room.game.phase).toBe(GAME_PHASES.playing);
    expect(harness.practiceEngine.search).toHaveBeenCalledOnce();
    expect(harness.handleGameAction).toHaveBeenCalledOnce();
    expect(harness.scheduleRoomClose).not.toHaveBeenCalled();
  });
  for (const difficulty of ["beginner", "intermediate", "advanced"]) {
    it(`makes ${difficulty} resign at 22 ordinary captures without early-invalid marking`, async () => {
      const room = createPracticeRoom(player(), { difficulty, playerColor: "black", random: () => 0 });
      room.game.phase = GAME_PHASES.playing;
      room.game.turn = COLORS.white;
      room.game.captures.black = 22;
      const harness = automationHarness(room);

      harness.automation.schedule(room, {});
      await harness.run();

      expect(room.game.phase).toBe(GAME_PHASES.finished);
      expect(room.game.winner).toMatchObject({ winnerColor: COLORS.black, reason: "resign" });
      expect(room.game.winner.invalid).toBeUndefined();
      expect(harness.handleGameAction).not.toHaveBeenCalled();
      expect(harness.broadcastRoom).toHaveBeenCalledWith({}, room);
    });
  }

  it("keeps the old 11-capture threshold for a restored beginner room without an explicit target", async () => {
    const room = createPracticeRoom(player(), { difficulty: "beginner", playerColor: "black", random: () => 0 });
    delete room.practice.captureResignThreshold;
    room.game.phase = GAME_PHASES.playing;
    room.game.turn = COLORS.white;
    room.game.captures.black = 11;
    const harness = automationHarness(room);

    harness.automation.schedule(room, {});
    await harness.run();

    expect(room.game.phase).toBe(GAME_PHASES.finished);
    expect(harness.handleGameAction).not.toHaveBeenCalled();
  });

  it("does not count skill removals toward the resignation threshold", async () => {
    const room = createPracticeRoom(player(), { difficulty: "beginner", playerColor: "black", random: () => 0 });
    room.game.phase = GAME_PHASES.playing;
    room.game.turn = COLORS.white;
    room.game.captures.black = 0;
    room.game.skillRemovals.black = 99;
    const harness = automationHarness(room);

    harness.automation.schedule(room, {});
    await harness.run();

    expect(room.game.phase).toBe(GAME_PHASES.playing);
    expect(harness.handleGameAction).toHaveBeenCalledWith(room.code, room.practice.botActorId, expect.objectContaining({ type: "move" }), {});
  });

  it("never capture-resigns the Sigrika duel and falls back from level 10 to level 5 in the same turn", async () => {
    const room = createSigrikaCandyDuelRoom(player(), { random: () => 0 });
    room.game.phase = GAME_PHASES.playing;
    room.game.turn = room.sigrikaCandyDuel.botColor;
    room.sigrikaCandyDuel.openingPresentationStage = "done";
    room.game.captures[room.sigrikaCandyDuel.humanColor] = 99;
    const practiceEngine = {
      search: vi.fn()
        .mockResolvedValueOnce({ ok: false, reason: "timeout" })
        .mockResolvedValueOnce({ ok: true, action: { type: "move", pointId: "3,3" } })
    };
    const harness = automationHarness(room, { practiceEngine });

    harness.automation.schedule(room, {});
    await harness.run();

    expect(room.game.phase).toBe(GAME_PHASES.playing);
    expect(practiceEngine.search.mock.calls.map((call) => call[2].engine.level)).toEqual([10, 5]);
    expect(harness.handleGameAction).toHaveBeenCalledWith(
      room.code,
      room.practice.botActorId,
      { type: "move", pointId: "3,3" },
      {}
    );
    expect(harness.appendSystem).toHaveBeenCalledWith(room, "高级 GNU Go 响应异常，正在切换后备计算。", { kind: "engine-fallback" });
    expect(harness.appendSystem).not.toHaveBeenCalledWith(
      room,
      "西格莉卡？正在思考。",
      { kind: "npc-thinking" }
    );
  });

  it("shows the one-time opening line and no-effect Secret Sun Sixth Seat before Sigrika moves", async () => {
    const room = createSigrikaCandyDuelRoom(player(), { random: () => 0 });
    room.game.phase = GAME_PHASES.playing;
    room.game.turn = room.sigrikaCandyDuel.botColor;
    const gameBeforePresentation = structuredClone(room.game);
    const harness = automationHarness(room);

    harness.automation.schedule(room, {});
    await harness.run();
    expect(room.sigrikaCandyDuel.presentation).toEqual({
      sequence: 1,
      type: "dialogue",
      speaker: "西格莉卡？",
      text: "那么，让你看看才能的差距吧。"
    });
    expect(harness.handleGameAction).not.toHaveBeenCalled();

    await harness.run();
    expect(room.sigrikaCandyDuel.presentation).toEqual({
      sequence: 2,
      type: "skill",
      speaker: "西格莉卡？",
      skillName: "秘日六席"
    });
    expect(room.game).toEqual(gameBeforePresentation);
    expect(harness.appendSystem).toHaveBeenCalledWith(
      room,
      "西格莉卡？发动了“秘日六席”。",
      { kind: "sigrika-opening-skill" }
    );

    await harness.run();
    expect(room.sigrikaCandyDuel).toMatchObject({
      openingPresentationStage: "done",
      presentation: null
    });
    expect(room.game).toEqual(gameBeforePresentation);
    expect(harness.handleGameAction).not.toHaveBeenCalled();

    await harness.run();
    expect(harness.handleGameAction).toHaveBeenCalledWith(
      room.code,
      room.practice.botActorId,
      expect.objectContaining({ type: "move" }),
      {}
    );
  });

  it("plays the three cheating-reaction lines and no-effect Seven Deadly Sins before normal play resumes", async () => {
    const room = createSigrikaCandyDuelRoom(player(), { random: () => 0 });
    room.game.phase = GAME_PHASES.playing;
    room.game.turn = room.sigrikaCandyDuel.botColor;
    room.sigrikaCandyDuel.openingPresentationStage = "done";
    room.game.moveNumber = 35;
    room.game.history.push({
      type: "move",
      color: room.sigrikaCandyDuel.humanColor,
      id: "3,3",
      moveNumber: 35
    });
    room.sigrikaCandyDuel.aiAgreementAudit = {
      eligibleMoves: 34,
      top1Hits: 31,
      hardMoveHits: 31,
      pending: {
        playerColor: room.sigrikaCandyDuel.humanColor,
        positionMoveNumber: 34,
        expectedMoveNumber: 35,
        candidates: [
          { pointId: "3,3", order: 0, scoreLead: 5, winrate: 0.7, prior: 0.01 },
          { pointId: "4,4", order: 1, scoreLead: 3, winrate: 0.64, prior: 0.5 },
          { pointId: "5,5", order: 2, scoreLead: 2, winrate: 0.61, prior: 0.4 },
          { pointId: "6,6", order: 3, scoreLead: 1, winrate: 0.58, prior: 0.3 }
        ]
      }
    };
    const gameBeforePresentation = structuredClone(room.game);
    const harness = automationHarness(room);

    harness.automation.schedule(room, {});
    expect(room.sigrikaCandyDuel).toMatchObject({
      aiAgreementTriggered: true,
      aiReactionPresentationStage: "pending",
      aiAgreementTrigger: { reason: "extreme-35", moveNumber: 35 }
    });
    await harness.run();
    await harness.run();
    await harness.run();
    expect(room.sigrikaCandyDuel.presentation).toEqual({
      sequence: 3,
      type: "dialogue",
      speaker: "西格莉卡？",
      text: "行吧，那就用恶的方式来结束这令人失望的一局吧。"
    });

    await harness.run();
    expect(room.sigrikaCandyDuel.presentation).toEqual({
      sequence: 4,
      type: "skill",
      speaker: "西格莉卡？",
      skillName: "七宗罪"
    });
    expect(room.game).toEqual(gameBeforePresentation);
    expect(harness.handleGameAction).not.toHaveBeenCalled();
    expect(harness.appendSystem.mock.calls
      .filter(([, , options]) => options?.kind?.startsWith("sigrika-ai-reaction"))
      .map(([, text]) => text))
      .toEqual([
        "为什么你所展示的力量，和那个禁忌的来源这么像...",
        "我懂了......我懂了！那么你也是恶啊！",
        "行吧，那就用恶的方式来结束这令人失望的一局吧。",
        "西格莉卡？发动了“七宗罪”。"
      ]);

    await harness.run();
    expect(room.sigrikaCandyDuel).toMatchObject({
      aiReactionPresentationStage: "done",
      presentation: null
    });
    expect(room.game).toEqual(gameBeforePresentation);

    await harness.run();
    expect(harness.handleGameAction).toHaveBeenCalledWith(
      room.code,
      room.practice.botActorId,
      expect.objectContaining({ type: "move" }),
      {}
    );
  });

  it("uses Zhizi for Sigrika and stores human agreement analysis only on the server", async () => {
    const room = createSigrikaCandyDuelRoom(player(), { random: () => 0 });
    room.game.phase = GAME_PHASES.playing;
    room.game.turn = room.sigrikaCandyDuel.humanColor;
    room.game.moveNumber = 20;
    const zhiziEngine = {
      isEnabled: () => true,
      close: vi.fn(),
      search: vi.fn(),
      analyze: vi.fn(async () => ({
        ok: true,
        size: 13,
        minVisits: 200,
        rootInfo: { visits: 350 },
        candidates: [
          { move: "D10", order: 0, visits: 350, scoreLead: 4, winrate: 0.65, prior: 0.04 },
          { move: "K10", order: 1, visits: 180, scoreLead: 3, winrate: 0.62, prior: 0.12 },
          { move: "D4", order: 2, visits: 120, scoreLead: 2.5, winrate: 0.6, prior: 0.1 }
        ]
      }))
    };
    const harness = automationHarness(room, { zhiziEngine });

    harness.automation.schedule(room, {});
    await harness.run();

    expect(zhiziEngine.analyze).toHaveBeenCalledWith(
      expect.objectContaining({ moveNumber: 20, size: 13 }),
      room.sigrikaCandyDuel.humanColor,
      { purpose: "audit" }
    );
    expect(room.sigrikaCandyDuel.aiAgreementAudit.pending).toMatchObject({
      positionMoveNumber: 20,
      expectedMoveNumber: 21
    });
    expect(harness.persistRoom).toHaveBeenCalledWith(room, { force: true });

    const move = playMove(room.game, room.sigrikaCandyDuel.humanColor, "3,3", { colorIllusion: null });
    expect(move.ok).toBe(true);
    room.game = move.state;
    harness.automation.schedule(room, {});

    expect(room.sigrikaCandyDuel.aiAgreementAudit.pending).toBeNull();
    expect(room.sigrikaCandyDuel.aiAgreementAudit.eligibleMoves).toBe(1);
    expect(room.sigrikaCandyDuel.aiAgreementAudit.top1Hits).toBe(1);
  });

  it("uses the local heuristic for beginner without calling GNU Go", async () => {
    const room = createPracticeRoom(player(), { difficulty: "beginner", playerColor: "black", random: () => 0 });
    room.game.phase = GAME_PHASES.playing;
    room.game.turn = COLORS.white;
    const practiceEngine = { search: vi.fn() };
    const harness = automationHarness(room, { practiceEngine });

    harness.automation.schedule(room, {});
    await harness.run();

    expect(practiceEngine.search).not.toHaveBeenCalled();
    expect(harness.handleGameAction).toHaveBeenCalledWith(
      room.code,
      room.practice.botActorId,
      expect.objectContaining({ type: "move" }),
      {}
    );
  });

  it.each(["intermediate", "advanced", "basic"])("uses GNU Go for %s moves", async (difficulty) => {
    const room = createPracticeRoom(player(), { difficulty, playerColor: "black", random: () => 0 });
    room.game.phase = GAME_PHASES.playing;
    room.game.turn = COLORS.white;
    const practiceEngine = {
      search: vi.fn().mockResolvedValue({
        ok: true,
        action: { type: "move", pointId: "3,3" }
      })
    };
    const harness = automationHarness(room, { practiceEngine });

    harness.automation.schedule(room, {});
    await harness.run();

    expect(practiceEngine.search).toHaveBeenCalledWith(
      expect.objectContaining({ size: 13 }),
      COLORS.white,
      expect.objectContaining({
        id: difficulty,
        strategy: "gnugo"
      })
    );
    expect(harness.handleGameAction).toHaveBeenCalledWith(
      room.code,
      room.practice.botActorId,
      { type: "move", pointId: "3,3" },
      {}
    );
  });

  it("keeps one bot action in flight while GNU Go is thinking", async () => {
    const room = createPracticeRoom(player(), { difficulty: "advanced", playerColor: "black", random: () => 0 });
    room.game.phase = GAME_PHASES.playing;
    room.game.turn = COLORS.white;
    let resolveSearch;
    const practiceEngine = {
      search: vi.fn(() => new Promise((resolve) => { resolveSearch = resolve; }))
    };
    const harness = automationHarness(room, { practiceEngine });

    harness.automation.schedule(room, {});
    const pending = harness.run();
    expect(harness.automation.schedule(room, {})).toBe(false);
    resolveSearch({ ok: false, reason: "busy" });
    await pending;

    expect(practiceEngine.search).toHaveBeenCalledTimes(1);
    expect(harness.handleGameAction).not.toHaveBeenCalled();
  });

  it("does not fall back to homemade moves and closes after three engine failures", async () => {
    const room = createPracticeRoom(player(), { difficulty: "advanced", playerColor: "black", random: () => 0 });
    room.game.phase = GAME_PHASES.playing;
    room.game.turn = COLORS.white;
    const practiceEngine = {
      search: vi.fn().mockResolvedValue({ ok: false, reason: "unavailable" })
    };
    const harness = automationHarness(room, { practiceEngine });

    harness.automation.schedule(room, {});
    await harness.run();
    await harness.run();
    await harness.run();

    expect(practiceEngine.search).toHaveBeenCalledTimes(3);
    expect(harness.handleGameAction).not.toHaveBeenCalled();
    expect(room.game.phase).toBe(GAME_PHASES.finished);
    expect(room.game.winner).toMatchObject({
      winnerColor: COLORS.black,
      reason: "resign"
    });
    expect(harness.appendSystem).toHaveBeenCalledWith(
      room,
      "准时宝的 GNU Go 引擎暂时不可用，本局已结束。"
    );
    expect(harness.scheduleRoomClose).toHaveBeenCalledWith(room.code, {});
  });
});
