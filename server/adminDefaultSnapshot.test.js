import { describe, expect, it } from "vitest";
import { collectGroup, getPoint } from "../src/shared/game.js";
import { prepareScoringState, scoreGame } from "../src/shared/gameScoring.js";
import {
  applyTutorialNodeAction,
  applyTutorialSkillAction,
  createTutorialGameState
} from "../src/tutorial/tutorialGameState.js";
import { ADMIN_DEFAULT_CONFIG } from "./adminDefaultSnapshot.js";
import { validateStoryContent } from "./storyScripts.js";

const CHAPTER_SETUP_IDS = [
  "beginner-rules-setup",
  "beginner-forbidden-ko-setup",
  "beginner-connection-setup",
  "beginner-life-setup",
  "beginner-layout-setup",
  "beginner-middle-setup",
  "beginner-endgame-setup",
  "beginner-skill-setup"
];

const RETRY_BRANCHES = [
  ["beginner-forbidden-wrong", "beginner-forbidden-question"],
  ["beginner-ko-wrong-now", "beginner-ko-question"],
  ["beginner-ko-wrong-never", "beginner-ko-question"],
  ["beginner-connection-wrong-both", "beginner-connection-question"],
  ["beginner-connection-wrong-neither", "beginner-connection-question"],
  ["beginner-life-wrong-right", "beginner-life-question"],
  ["beginner-life-wrong-both", "beginner-life-question"],
  ["beginner-layout-wrong-edge", "beginner-layout-question"],
  ["beginner-layout-wrong-center", "beginner-layout-question"],
  ["beginner-middle-wrong-capture", "beginner-middle-question"],
  ["beginner-middle-wrong-center", "beginner-middle-question"],
  ["beginner-scoring-wrong-black", "beginner-scoring-question"],
  ["beginner-scoring-wrong-equal", "beginner-scoring-question"],
  ["beginner-skill-value-wrong", "beginner-skill-value-question"]
];

describe("admin default onboarding story snapshot", () => {
  it("ships the Danya 100 spark wins nameplate reward and achievement", () => {
    const reward = ADMIN_DEFAULT_CONFIG.achievementRewardAssets.find(({ id }) => id === "reward-denia-spark-100-wins-nameplate");
    const achievement = ADMIN_DEFAULT_CONFIG.achievements.find(({ key }) => key === "denia-spark-100-wins");

    expect(reward).toMatchObject({
      type: "nameplate",
      name: "百次回响",
      imageUrl: "/assets/achievements/denia-spark-100-wins-nameplate.png",
      text: "用户名背景",
      sortOrder: 120
    });
    expect(achievement).toMatchObject({
      name: "百次回响",
      content: "使用达妮娅在星炬对弈中获得100胜",
      conditionType: "mode_character_wins",
      rewardAssetId: reward.id,
      sortOrder: 120
    });
    expect(JSON.parse(achievement.conditionParams)).toEqual({
      mode: "spark",
      characterId: "denia",
      value: 100
    });
  });

  it("publishes a complete four-chapter beginner graph without changing the other level branches", () => {
    const script = onboardingScript();
    const draftNodes = JSON.parse(script.draftNodesJson);
    const publishedNodes = JSON.parse(script.publishedNodesJson);
    const nodesById = new Map(draftNodes.map((node) => [node.id, node]));

    expect(publishedNodes).toEqual(draftNodes);
    expect(new Set(draftNodes.map((node) => node.id)).size).toBe(draftNodes.length);
    expect(CHAPTER_SETUP_IDS.every((id) => nodesById.has(id))).toBe(true);
    expect(validateStoryContent({
      startNodeId: script.draftStartNodeId,
      initialBoard: JSON.parse(script.draftInitialBoardJson),
      nodes: draftNodes
    }, { publishing: true }).nodes).toHaveLength(draftNodes.length);

    expect(nodesById.get("node-4-4-2")?.nextNodeId).toBe("beginner-course-denia");
    expect(nodesById.get("beginner-course-sigrika-end")?.nextNodeId).toBe("node-4-5");
    expect(nodesById.has("beginner-practice-denia")).toBe(false);

    expect(nodesById.get("node-3")?.options).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "其实我完全不会下围棋...", nextNodeId: "node-4" }),
      expect.objectContaining({ label: "略懂一些", nextNodeId: "story-46" }),
      expect.objectContaining({ label: "我超强的哦!", nextNodeId: "story-15" })
    ]));

    for (const [wrongNodeId, questionNodeId] of RETRY_BRANCHES) {
      expect(nodesById.get(wrongNodeId)?.nextNodeId).toBe(questionNodeId);
    }
  });

  it("teaches escaping an atari before capturing a connected two-stone group", () => {
    const nodesById = onboardingNodesById();
    const state = createTutorialGameState({
      initialBoard: nodesById.get("beginner-rules-setup").boardSetup
    });

    const escaped = applyTutorialNodeAction(
      state,
      nodesById.get("beginner-escape-move"),
      { pointId: "3,4" }
    );
    expect(escaped.ok).toBe(true);
    expect(collectGroup(escaped.state, "3,3").stones.sort()).toEqual([
      "3,3",
      "3,4"
    ]);

    const captured = applyTutorialNodeAction(
      escaped.state,
      nodesById.get("beginner-capture-move"),
      { pointId: "9,10" }
    );
    expect(captured.ok).toBe(true);
    expect(getPoint(captured.state, "9,8")?.stone).toBe(null);
    expect(getPoint(captured.state, "9,9")?.stone).toBe(null);
    expect(getPoint(captured.state, "9,10")?.stone).toBe("black");
    expect(captured.state.captures.black).toBe(2);
  });

  it("uses the real rules for a forbidden point and a ko recapture ban", () => {
    const nodesById = onboardingNodesById();
    const state = createTutorialGameState({
      initialBoard: nodesById.get("beginner-forbidden-ko-setup").boardSetup
    });

    const suicide = applyTutorialNodeAction(state, {
      type: "player-move",
      pointId: "2,2",
      color: "black"
    }, { pointId: "2,2" });
    expect(suicide.ok).toBe(false);
    expect(suicide.error).toContain("禁自杀");

    const koCapture = applyTutorialNodeAction(
      state,
      nodesById.get("beginner-ko-capture"),
      { pointId: "6,7" }
    );
    expect(koCapture.ok).toBe(true);
    expect(getPoint(koCapture.state, "6,6")?.stone).toBe(null);
    expect(koCapture.state.ko).toBe("6,6");

    const immediateRecapture = applyTutorialNodeAction(koCapture.state, {
      type: "player-move",
      pointId: "6,6",
      color: "white"
    }, { pointId: "6,6" });
    expect(immediateRecapture.ok).toBe(false);
    expect(immediateRecapture.error).toContain("劫禁着点");
  });

  it("connects the left stones while preserving the authored cut and eye diagrams", () => {
    const nodesById = onboardingNodesById();
    const connectionState = createTutorialGameState({
      initialBoard: nodesById.get("beginner-connection-setup").boardSetup
    });
    const connected = applyTutorialNodeAction(
      connectionState,
      nodesById.get("beginner-connection-move"),
      { pointId: "4,3" }
    );

    expect(connected.ok).toBe(true);
    expect(collectGroup(connected.state, "3,3").stones.sort()).toEqual([
      "3,3",
      "4,3",
      "5,3"
    ]);
    expect(collectGroup(connected.state, "8,8").stones).toHaveLength(1);
    expect(collectGroup(connected.state, "9,9").stones).toHaveLength(1);

    const lifeState = createTutorialGameState({
      initialBoard: nodesById.get("beginner-life-setup").boardSetup
    });
    expect(collectGroup(lifeState, "1,1").stones).toHaveLength(13);
    expect(getPoint(lifeState, "2,2")?.stone).toBe(null);
    expect(getPoint(lifeState, "4,2")?.stone).toBe(null);
    expect(getPoint(lifeState, "8,2")?.stone).toBe(null);
    expect(getPoint(lifeState, "11,1")?.stone).toBe(null);
    expect(getPoint(lifeState, "10,0")?.stone).toBe("white");
    expect(getPoint(lifeState, "12,0")?.stone).toBe("white");
  });

  it("runs the corner-opening sequence and reuses the existing middle-game snapshot", () => {
    const nodesById = onboardingNodesById();
    let state = createTutorialGameState({
      initialBoard: nodesById.get("beginner-layout-setup").boardSetup
    });

    for (const nodeId of [
      "beginner-layout-first-move",
      "beginner-layout-npc-move",
      "beginner-layout-second-move"
    ]) {
      const node = nodesById.get(nodeId);
      const result = applyTutorialNodeAction(state, node, { pointId: node.pointId });
      expect(result.ok).toBe(true);
      state = result.state;
    }

    expect(getPoint(state, "3,3")?.stone).toBe("black");
    expect(getPoint(state, "9,9")?.stone).toBe("white");
    expect(getPoint(state, "9,3")?.stone).toBe("black");
    expect(nodesById.get("beginner-middle-setup")?.boardSetup).toEqual(
      nodesById.get("story-16")?.boardSetup
    );
    expect(nodesById.get("beginner-middle-choice")?.options[1]).toMatchObject({
      label: "先看弱棋、连接和地盘，再决定攻击方向",
      nextNodeId: "beginner-middle-correct"
    });
  });

  it("finishes the authored endgame with the real Spark scoring result", () => {
    const nodesById = onboardingNodesById();
    const state = createTutorialGameState({
      initialBoard: nodesById.get("beginner-endgame-setup").boardSetup
    });
    const closed = applyTutorialNodeAction(
      state,
      nodesById.get("beginner-endgame-move"),
      { pointId: "3,4" }
    );
    closed.state.scoring = prepareScoringState(closed.state);

    expect(closed.ok).toBe(true);
    expect(closed.state.scoring.territory.black.sort()).toEqual([
      "2,2",
      "2,3",
      "3,2",
      "3,3"
    ]);
    expect(closed.state.scoring.territory.white.sort()).toEqual([
      "10,8",
      "10,9",
      "8,8",
      "8,9",
      "9,8",
      "9,9"
    ]);
    expect(scoreGame(closed.state)).toMatchObject({
      blackStones: 10,
      blackTerritory: 4,
      whiteStones: 10,
      whiteTerritory: 6,
      blackSkillRemovals: 0,
      whiteSkillRemovals: 0,
      blackSkillCost: 0,
      whiteSkillCost: 0,
      winnerColor: "white",
      margin: 3.75,
      text: "白胜3又3/4子"
    });
  });

  it("demonstrates Sigrika skill removals, overclock, and the retained free move", () => {
    const nodesById = onboardingNodesById();
    const state = createTutorialGameState({
      initialBoard: nodesById.get("beginner-skill-setup").boardSetup
    });
    const skill = applyTutorialSkillAction(
      state,
      nodesById.get("beginner-skill-cast"),
      { pointId: "6,7", pendingSkillId: "beginner-sigrika-skill" }
    );

    expect(skill.ok).toBe(true);
    expect(getPoint(skill.resolvedState, "6,5")?.stone).toBe(null);
    expect(getPoint(skill.resolvedState, "6,6")?.stone).toBe(null);
    expect(skill.resolvedState.skillRemovals.white).toBe(2);
    expect(skill.resolvedState.skillCosts.white).toBe(3);

    const followMove = applyTutorialNodeAction(
      skill.resolvedState,
      nodesById.get("beginner-skill-follow-move"),
      { pointId: "9,9" }
    );
    expect(followMove.ok).toBe(true);
    expect(getPoint(followMove.state, "9,9")?.stone).toBe("white");
  });

  it("keeps dialogue manual, action nodes automatic, and all special-rule copy present", () => {
    const nodesById = onboardingNodesById();
    const beginnerNodes = [...nodesById.values()].filter((node) => node.id.startsWith("beginner-"));
    const dialogues = beginnerNodes.filter((node) => node.type === "npc-dialogue");
    const automaticTypes = new Set(["board-setup", "player-move", "npc-move", "player-choice", "npc-skill", "counting-start"]);
    const automaticNodes = beginnerNodes.filter((node) => automaticTypes.has(node.type));
    const combinedText = beginnerNodes.map((node) => node.text).filter(Boolean).join("\n");

    expect(dialogues.every((node) => (
      node.manualContinueEnabled === true && node.autoContinueEnabled === false
    ))).toBe(true);
    expect(automaticNodes.every((node) => (
      node.manualContinueEnabled === false && node.autoContinueEnabled === true
    ))).toBe(true);
    expect(nodesById.get("beginner-counting-start")).toMatchObject({
      type: "counting-start",
      actor: "player"
    });
    expect(combinedText).toContain("金角银边草肚皮");
    expect(combinedText).toContain("真眼");
    expect(combinedText).toContain("假眼");
    expect(combinedText).toContain("除子");
    expect(combinedText).toContain("超频");
    expect(combinedText).toContain("二又四分之三子");
    expect(combinedText).toContain("标准 19 路模式关闭技能");
    expect(combinedText).toContain("普通提子不会再重复加分");
  });

  it("keeps the existing experienced-player battle content while using a compact readable pace", () => {
    const nodesById = onboardingNodesById();

    expect(nodesById.get("story-15")).toMatchObject({
      nextNodeId: "story-16",
      text: "这么厉害的吗？哼哼，那要不现在跟我下一盘试试看？"
    });
    expect(nodesById.get("story-46")?.options).toEqual([
      expect.objectContaining({
        label: "好的",
        nextNodeId: "story-16",
        transitionDelaySeconds: 0.2
      })
    ]);

    expect(nodesById.get("story-16")).toMatchObject({
      type: "board-setup",
      autoContinueDelaySeconds: 1
    });
    expect(nodesById.get("story-51")).toMatchObject({
      type: "board-setup",
      autoContinueDelaySeconds: 1
    });
    expect(nodesById.get("story-17")).toMatchObject({
      actionStartDelaySeconds: 0.8,
      replyDelaySeconds: 0.3,
      autoContinueDelaySeconds: 0.75
    });
    expect(nodesById.get("story-24")).toMatchObject({
      actionStartDelaySeconds: 0.7,
      replyDelaySeconds: 0.35,
      autoContinueDelaySeconds: 0.85
    });
    expect(nodesById.get("story-29")).toMatchObject({
      type: "npc-skill",
      actionStartDelaySeconds: 0.65,
      replyDelaySeconds: 0.35,
      autoContinueDelaySeconds: 0.3
    });
    expect(nodesById.get("story-55")).toMatchObject({
      type: "npc-skill",
      actionStartDelaySeconds: 0.65,
      replyDelaySeconds: 0.35,
      autoContinueDelaySeconds: 0.35
    });
    expect(nodesById.get("story-59")).toMatchObject({
      type: "player-skill",
      autoContinueDelaySeconds: 0.8
    });
    expect(nodesById.get("story-27")?.autoContinueDelaySeconds).toBe(1.2);
    expect(nodesById.get("story-28")?.autoContinueDelaySeconds).toBe(1);
    expect(nodesById.get("story-54")?.autoContinueDelaySeconds).toBe(1.2);
    expect(nodesById.get("story-58")?.autoContinueDelaySeconds).toBe(1);

    for (const nodeId of ["story-61", "story-62"]) {
      expect(nodesById.get(nodeId)).toMatchObject({
        type: "npc-dialogue",
        manualContinueEnabled: true,
        autoContinueEnabled: false,
        autoContinueDelaySeconds: ""
      });
    }
    for (const nodeId of [
      "story-26",
      "branch-25",
      "story-31",
      "branch-32",
      "story-36",
      "branch-37",
      "story-52",
      "story-53",
      "story-57",
      "story-60"
    ]) {
      expect(nodesById.get(nodeId)?.options[0]?.transitionDelaySeconds).toBe(0.2);
    }
  });
});

function onboardingScript() {
  const script = ADMIN_DEFAULT_CONFIG.storyScripts.find((entry) => entry.key === "onboarding.default");
  if (!script) throw new Error("Missing onboarding.default in admin default snapshot");
  return script;
}

function onboardingNodesById() {
  const nodes = JSON.parse(onboardingScript().draftNodesJson);
  return new Map(nodes.map((node) => [node.id, node]));
}
