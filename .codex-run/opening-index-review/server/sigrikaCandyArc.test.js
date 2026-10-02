import { describe, expect, test } from "vitest";
import {
  SIGRIKA_CANDY_OUTCOMES,
  SIGRIKA_CANDY_PHASES,
  normalizeSigrikaCandyArc,
  sigrikaCandyUseStartNodeId
} from "../src/shared/sigrikaCandyArc.js";
import {
  cancelRainbowBeanCandyEffect,
  debugJumpSigrikaCandyToUseEight,
  sigrikaCandyClimaxData,
  sigrikaCandyDebugJumpData,
  sigrikaCandyMissingDuelRecoveryData,
  sigrikaCandyRecoveryCompletedData,
  sigrikaCandyRecoveryStartedData,
  sigrikaCandyResultData,
  sigrikaCandyUseProgressData
} from "./sigrikaCandyArc.js";

describe("Sigrika rainbow candy arc", () => {
  test("increments normal uses and selects an independent story start for uses one through seven", () => {
    expect(sigrikaCandyUseProgressData({ sigrikaCandyUseCount: 0 })).toMatchObject({
      sigrikaCandyUseCount: 1,
      sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.normal
    });
    expect(Array.from({ length: 7 }, (_, index) => sigrikaCandyUseStartNodeId(index + 1))).toEqual([
      "use-1-start",
      "use-2-start",
      "use-3-start",
      "use-4-start",
      "use-5-start",
      "use-6-start",
      "use-7-start"
    ]);
  });

  test("moves the eighth use into the mandatory corruption story", () => {
    expect(sigrikaCandyUseProgressData({
      sigrikaCandyUseCount: 7,
      sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.normal
    })).toEqual({
      sigrikaCandyUseCount: 8,
      sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.corruptionStory,
      sigrikaCandyOutcome: "",
      sigrikaCandyRoomCode: ""
    });
    expect(sigrikaCandyUseStartNodeId(8)).toBe("corruption-start");
  });

  test("lets the development story shortcut persist the real eighth-use state", async () => {
    expect(sigrikaCandyDebugJumpData({
      sigrikaCandyUseCount: 3,
      sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.normal
    })).toEqual({
      sigrikaCandyUseCount: 8,
      sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.corruptionStory,
      sigrikaCandyOutcome: "",
      sigrikaCandyRoomCode: ""
    });
    expect(() => sigrikaCandyDebugJumpData({
      sigrikaCandyUseCount: 0,
      sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.normal
    })).toThrow("请先进入");

    const prisma = makeArcPrisma({
      sigrikaCandyUseCount: 3,
      sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.normal
    });
    const result = await debugJumpSigrikaCandyToUseEight({
      prisma,
      userId: "user-1",
      nodeEnv: "development"
    });
    expect(result.sigrikaCandyArc).toMatchObject({ useCount: 8, phase: SIGRIKA_CANDY_PHASES.corruptionStory });
    expect(result.equippedCostumes.sigrika).toMatchObject({ portraitUrl: "/assets/costumes/portraits/sigrika-test.webp" });

    await expect(debugJumpSigrikaCandyToUseEight({
      prisma: makeArcPrisma(),
      userId: "user-1",
      nodeEnv: "production"
    })).rejects.toMatchObject({ status: 404 });
  });

  test("does not allow another candy use while the special arc is active", () => {
    expect(() => sigrikaCandyUseProgressData({
      sigrikaCandyUseCount: 8,
      sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.awaitingDuel
    })).toThrow("异常剧情尚未结束");
  });

  test("transitions through climax, result and recovery without introducing a draw outcome", () => {
    expect(sigrikaCandyClimaxData({
      sigrikaCandyUseCount: 8,
      sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.corruptionStory
    })).toEqual({ sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.awaitingDuel });
    expect(sigrikaCandyResultData(SIGRIKA_CANDY_OUTCOMES.win)).toEqual({
      sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.resultPending,
      sigrikaCandyOutcome: SIGRIKA_CANDY_OUTCOMES.win
    });
    expect(() => sigrikaCandyResultData("draw")).toThrow("结果无效");
    expect(sigrikaCandyRecoveryStartedData({
      sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.resultPending,
      sigrikaCandyOutcome: SIGRIKA_CANDY_OUTCOMES.loss
    })).toEqual({ sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.recoveryStory });
  });

  test("rolls a missing active duel back only when the expected room still owns the arc", () => {
    const activeUser = {
      sigrikaCandyUseCount: 8,
      sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.duelActive,
      sigrikaCandyRoomCode: "67975"
    };
    expect(sigrikaCandyMissingDuelRecoveryData(activeUser, "67975")).toEqual({
      sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.awaitingDuel,
      sigrikaCandyRoomCode: "",
      sigrikaCandyOutcome: ""
    });
    expect(sigrikaCandyMissingDuelRecoveryData(activeUser, "OTHER")).toEqual({});
    expect(sigrikaCandyMissingDuelRecoveryData({
      ...activeUser,
      sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.resultPending
    }, "67975")).toEqual({});
  });

  test("recovery clears only Sigrika's ordinary candy effect and resets the persistent arc", () => {
    const data = sigrikaCandyRecoveryCompletedData({
      sigrikaCandyUseCount: 8,
      sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.recoveryStory,
      sigrikaCandyOutcome: SIGRIKA_CANDY_OUTCOMES.loss,
      sigrikaCandyRoomCode: "ABCDE",
      itemEffects: JSON.stringify({
        sigrikaCandyDisabled: true,
        deniaRainbowGlow: true
      })
    });

    expect(JSON.parse(data.itemEffects)).toEqual({ deniaRainbowGlow: true });
    expect(data).toMatchObject({
      sigrikaCandyUseCount: 0,
      sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.normal,
      sigrikaCandyOutcome: "",
      sigrikaCandyRoomCode: ""
    });
  });

  test("normalizes corrupt persisted values into a safe public arc", () => {
    expect(normalizeSigrikaCandyArc({
      sigrikaCandyUseCount: 99,
      sigrikaCandyPhase: "unknown",
      sigrikaCandyOutcome: "draw"
    })).toEqual({
      useCount: 8,
      phase: SIGRIKA_CANDY_PHASES.normal,
      outcome: "",
      roomCode: "",
      corrupted: false,
      active: true
    });
  });

  test("allows candy badge cancellation only in non-production debug runtimes and never bypasses corruption", async () => {
    const makePrisma = (phase = SIGRIKA_CANDY_PHASES.normal) => {
      let current = {
        id: "user-1",
        username: "moming",
        sigrikaCandyUseCount: 3,
        sigrikaCandyPhase: phase,
        itemEffects: JSON.stringify({ sigrikaCandyDisabled: true, deniaRainbowGlow: true })
      };
      const costumeEquipment = [{
        characterSlug: "denia",
        costume: {
          id: "denia-costume-01",
          name: "达妮娅测试服装",
          characterSlug: "denia",
          portraitUrl: "/assets/costumes/portraits/denia-costume-01.webp",
          enabled: true
        }
      }];
      let userItemEffects = [
        { effectKey: "sigrikaCandyDisabled", effectValue: "true" },
        { effectKey: "deniaRainbowGlow", effectValue: "true" }
      ];
      const tx = {
        user: {
          findUnique: async ({ include } = {}) => ({
            ...current,
            ...(include?.costumeEquipment ? { costumeEquipment } : {}),
            ...(include?.userItemEffects ? { userItemEffects } : {})
          }),
          update: async ({ data }) => {
            current = { ...current, ...data };
            return current;
          }
        },
        userItemEffect: {
          deleteMany: async ({ where }) => {
            const keep = new Set(where.effectKey.notIn);
            userItemEffects = userItemEffects.filter((entry) => keep.has(entry.effectKey));
            return { count: 1 };
          },
          upsert: async ({ create }) => {
            userItemEffects = userItemEffects.filter((entry) => entry.effectKey !== create.effectKey);
            userItemEffects.push({ effectKey: create.effectKey, effectValue: create.effectValue });
            return create;
          }
        }
      };
      return { $transaction: (callback) => callback(tx) };
    };

    await expect(cancelRainbowBeanCandyEffect({
      prisma: makePrisma(),
      userId: "user-1",
      characterId: "sigrika",
      nodeEnv: "production"
    })).rejects.toMatchObject({ status: 404 });

    const localResult = await cancelRainbowBeanCandyEffect({
      prisma: makePrisma(),
      userId: "user-1",
      characterId: "sigrika",
      nodeEnv: undefined
    });
    expect(localResult.user.itemEffects).toEqual({ deniaRainbowGlow: true });

    const result = await cancelRainbowBeanCandyEffect({
      prisma: makePrisma(),
      userId: "user-1",
      characterId: "sigrika",
      nodeEnv: "development"
    });
    expect(result.user.itemEffects).toEqual({ deniaRainbowGlow: true });
    expect(result.user.sigrikaCandyArc).toMatchObject({ useCount: 3, phase: "normal" });
    expect(result.user.equippedCostumes.denia).toMatchObject({
      id: "denia-costume-01",
      portraitUrl: "/assets/costumes/portraits/denia-costume-01.webp"
    });

    await expect(cancelRainbowBeanCandyEffect({
      prisma: makePrisma(SIGRIKA_CANDY_PHASES.awaitingDuel),
      userId: "user-1",
      characterId: "sigrika",
      nodeEnv: "development"
    })).rejects.toMatchObject({ status: 409 });
  });
});

function makeArcPrisma(overrides = {}) {
  let current = {
    id: "user-1",
    username: "moming",
    selectedCharacter: "sigrika",
    ownedCharacters: "sigrika",
    ownedItems: "{}",
    itemEffects: JSON.stringify({ sigrikaCandyDisabled: true }),
    ownedDecorations: "",
    sigrikaCandyUseCount: 1,
    sigrikaCandyPhase: SIGRIKA_CANDY_PHASES.normal,
    sigrikaCandyOutcome: "",
    sigrikaCandyRoomCode: "",
    ...overrides
  };
  const relations = {
    userCharacters: [],
    userDecorations: [],
    userItems: [],
    userItemEffects: [{ effectKey: "sigrikaCandyDisabled", effectValue: "true" }],
    userCostumes: [],
    costumeEquipment: [{
      characterSlug: "sigrika",
      costume: {
        id: "sigrika-test",
        characterSlug: "sigrika",
        portraitUrl: "/assets/costumes/portraits/sigrika-test.webp",
        enabled: true
      }
    }],
    modeStats: []
  };
  const tx = {
    user: {
      findUnique: async ({ include } = {}) => ({ ...current, ...(include ? relations : {}) }),
      update: async ({ data }) => {
        current = { ...current, ...data };
        return current;
      }
    }
  };
  return { $transaction: (callback) => callback(tx) };
}
