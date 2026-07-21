import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { getPoint } from "../src/shared/game.js";
import {
  applyTutorialNodeAction,
  applyTutorialSkillAction,
  createTutorialGameState
} from "../src/tutorial/tutorialGameState.js";
import { ADMIN_DEFAULT_CONFIG } from "./adminDefaultSnapshot.js";
import { validateStoryContent } from "./storyScripts.js";

const EXPECTED_BEGINNER_HASH = "a56162ce952045db59800134f369772e0588f87a4c3f934f5d970933248e3ddb";
const EXPECTED_EXPERIENCED_HASH = "47bcf6c16625552e2fa9d1aa8297cf1cf28f33c716c19e2f86147d9ed143af27";

const BOARD_EXPECTATIONS = Object.freeze({
  "doc-setup-1": expectedBoard(
    "K11 D10 K10 D5 C4 D4 E4 N4 C3 D3 N3 L2 M2 N2",
    "M5 N5 M4 B3 K3 M3 C2",
    "K3"
  ),
  "doc-setup-2": expectedBoard(
    "D11 L11 C10 E10 K10 M10 J9 L4 M4 A3 B3 K3 M3 N3 B2 C2 L2 N2 C1 L1 M1 N1",
    "D10 J10 L10 K9 M9 L8 K5 L5 M5 N5 B4 C4 J4 K4 N4 C3 D3 H3 A2 D2 H2 J2 K2 B1 D1 K1",
    "N4"
  ),
  "doc-setup-3": expectedBoard(
    "B13 C13 D13 K13 A12 C12 E12 K12 L12 M12 N12 A11 E11 A7 B7 C7 M7 C6 L6 M6 D5 L5 D4 K4 D3 K3 D2 H2 K2 A1 B1 C1 D1",
    "E13 F13 J13 F12 J12 C11 G11 J11 K11 L11 M11 N11 A10 B10 C10 D10 E10 F10 G10 A6 B6 B5 C5 M5 C4 L4 N4 C3 L3 A2 B2 C2 L2",
    "H2"
  ),
  "doc-setup-4": expectedBoard(
    "D13 K13 D12 K12 D11 K11 L11 M11 N11 A10 B10 C10 D10 B5 C5 D5 J5 K5 L5 M5 N5 A4 B4 D4 E4 J4 A3 E3 J3 K3 L3 M3 N3 D2 E2 C1 D1 L1",
    "L13 M13 L12 M12 C4 B3 D3 A2 C2 J2 K2 L2 M2 N2 B1 J1 M1",
    "N5"
  ),
  "doc-setup-5": expectedBoard(
    "B13 H13 B12 C12 D12 F12 G12 H12 J12 C11 J11 K11 A10 B10 C10 K10 C9 D9 K9 J8 K8 C7 D7 E7 G7 H7 F6 F5 G5 H5 K5 B4 D4 J4 A3 B3 C3 D3 E3 F3 K3 E2 K2 L2 B1 E1 F1 L1",
    "C13 D13 E13 F13 G13 A12 E12 A11 D11 E11 F11 G11 H11 D10 F10 H10 J10 B9 E9 J9 B8 E8 F8 G8 H8 B7 F7 E6 A5 B5 C5 D5 E5 A4 C4 E4 F4 G4 H4 G3 J3 F2 G2 J2 G1 J1 K1",
    "H13"
  ),
  "doc-setup-6": expectedBoard(
    "D13 D12 D11 A10 B10 C10 G8 H8 F7 J7 G6 H6 F3 G3 E2 H2 E1 H1",
    "",
    "H1"
  ),
  "doc-setup-7": expectedBoard("K10 K3", "C11 C4", "C11")
});

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

  it("ships the Aemeath 100 spark wins nameplate reward and achievement", () => {
    const reward = ADMIN_DEFAULT_CONFIG.achievementRewardAssets.find(({ id }) => id === "reward-aemeath-spark-100-wins-nameplate");
    const achievement = ADMIN_DEFAULT_CONFIG.achievements.find(({ key }) => key === "aemeath-spark-100-wins");

    expect(reward).toMatchObject({
      type: "nameplate",
      name: "飞行雪绒，出击！",
      imageUrl: "/assets/achievements/aemeath-spark-100-wins-nameplate.png",
      text: "用户名背景",
      sortOrder: 130
    });
    expect(achievement).toMatchObject({
      name: "飞行雪绒，出击！",
      content: "使用爱弥斯在星炬对弈中获得100胜",
      conditionType: "mode_character_wins",
      rewardAssetId: reward.id,
      sortOrder: 130
    });
    expect(JSON.parse(achievement.conditionParams)).toEqual({
      mode: "spark",
      characterId: "aemeath",
      value: 100
    });
  });

  it("publishes the Word-authored beginner graph while retaining both experienced branches", () => {
    const script = onboardingScript();
    const draftNodes = JSON.parse(script.draftNodesJson);
    const publishedNodes = JSON.parse(script.publishedNodesJson);
    const nodesById = new Map(draftNodes.map((node) => [node.id, node]));

    expect(publishedNodes).toEqual(draftNodes);
    expect(new Set(draftNodes.map((node) => node.id)).size).toBe(draftNodes.length);
    expect(validateStoryContent({
      startNodeId: script.draftStartNodeId,
      initialBoard: JSON.parse(script.draftInitialBoardJson),
      nodes: draftNodes
    }, { publishing: true }).nodes).toHaveLength(draftNodes.length);

    expect(nodesById.get("node-4-4-2")?.nextNodeId).toBe("node-4-4-3");
    expect(nodesById.get("node-4-4-3")).toMatchObject({
      type: "story",
      characterId: "denia",
      text: "西西，虽然我知道你喜欢鸟。但是打比方的话，我觉得用拉海洛方块更合适呢。",
      manualContinueEnabled: true,
      autoContinueEnabled: false,
      nextNodeId: "node-4-4-5",
      options: [{
        label: "听你们这么说，感觉有点像贪吃蛇。",
        nextNodeId: "node-4-4-5",
        revealDelaySeconds: "",
        transitionDelaySeconds: 0.2
      }]
    });
    expect(nodesById.has("node-4-4-4")).toBe(false);
    expect(nodesById.get("node-4-4-5")).toMatchObject({
      type: "story",
      characterId: "sigrika",
      text: "不要纠结在这种地方嘛！",
      manualContinueEnabled: true,
      autoContinueEnabled: false,
      nextNodeId: "node-4-4-6"
    });
    expect(nodesById.get("node-4-4-6")).toMatchObject({
      type: "story",
      characterId: "sigrika",
      text: "唔......那就不背术语啦！{username}，坐到这边来，我们还是从棋盘上走一遍吧。",
      manualContinueEnabled: true,
      autoContinueEnabled: false,
      nextNodeId: "doc-setup-1"
    });
    expect([...nodesById.keys()].some((id) => id.startsWith("beginner-"))).toBe(false);
    expect(nodesById.get("node-3")?.options).toEqual([
      expect.objectContaining({ label: "其实我完全不会下围棋...", nextNodeId: "node-4" }),
      expect.objectContaining({ label: "略懂一些", nextNodeId: "story-46" }),
      expect.objectContaining({ label: "我超强的哦!", nextNodeId: "story-15" })
    ]);
    expect(hashNodes(draftNodes.filter((node) => node.id.startsWith("doc-")))).toBe(EXPECTED_BEGINNER_HASH);
    expect(hashNodes(experiencedNodes(draftNodes))).toBe(EXPECTED_EXPERIENCED_HASH);
  });

  it("locks all seven authored positions and their display-only last-move markers", () => {
    const nodesById = onboardingNodesById();
    for (const [nodeId, expected] of Object.entries(BOARD_EXPECTATIONS)) {
      expect(nodesById.get(nodeId)?.boardSetup).toEqual(expected);
      const state = createTutorialGameState({ initialBoard: expected });
      expect(state.tutorialLastMovePointId).toBe(expected.lastMovePointId);
    }
    expect(nodesById.get("doc-a1-reset")?.boardSetup).toEqual(BOARD_EXPECTATIONS["doc-setup-2"]);
    expect(nodesById.get("doc-b11-reset")?.boardSetup).toEqual(BOARD_EXPECTATIONS["doc-setup-3"]);
    expect(nodesById.get("doc-skill-setup")?.boardSetup).toEqual(nodesById.get("story-51")?.boardSetup);
  });

  it("executes D9, L9, A1, J3, and L3 against the real rules", () => {
    const nodes = onboardingNodesById();
    let state = createTutorialGameState({ initialBoard: nodes.get("doc-setup-2").boardSetup });

    state = runMove(state, nodes.get("doc-capture-move"));
    expect(getPoint(state, visiblePoint("D10"))?.stone).toBe(null);
    expect(getPoint(state, visiblePoint("D9"))?.stone).toBe("black");

    state = runMove(state, nodes.get("doc-forbidden-move"));
    expect(getPoint(state, visiblePoint("L10"))?.stone).toBe(null);
    expect(getPoint(state, visiblePoint("L9"))?.stone).toBe("black");

    state = runMove(state, nodes.get("doc-a1-move"));
    expect(getPoint(state, visiblePoint("A2"))?.stone).toBe(null);
    expect(getPoint(state, visiblePoint("A1"))?.stone).toBe("black");

    state = runMove(state, nodes.get("doc-false-eye-j3"));
    state = runMove(state, nodes.get("doc-false-eye-l3"));
    expect(getPoint(state, visiblePoint("J3"))?.stone).toBe("white");
    expect(getPoint(state, visiblePoint("L3"))?.stone).toBe("white");
  });

  it("applies the A1 wrong move, scripted A4 reply, and silent reset", () => {
    const nodes = onboardingNodesById();
    const initial = createTutorialGameState({ initialBoard: nodes.get("doc-setup-2").boardSetup });
    const wrong = applyTutorialNodeAction(initial, nodes.get("doc-a1-move"), { pointId: visiblePoint("H13") });

    expect(wrong).toMatchObject({ ok: true, wrongMove: true, nextNodeId: "doc-a1-wrong-npc" });
    expect(getPoint(wrong.state, visiblePoint("H13"))?.stone).toBe("black");
    const reply = applyTutorialNodeAction(wrong.state, nodes.get("doc-a1-wrong-npc"), { pointId: visiblePoint("A4") });
    expect(reply.ok).toBe(true);
    expect(getPoint(reply.state, visiblePoint("A4"))?.stone).toBe("white");
    const reset = applyTutorialNodeAction(reply.state, nodes.get("doc-a1-reset"));
    expect(reset.ok).toBe(true);
    expect(boardStones(reset.state)).toEqual(boardStones(initial));
    expect(nodes.get("doc-a1-reset")).toMatchObject({ boardSetupLoadingEnabled: false, autoContinueDelaySeconds: 0 });
  });

  it("branches only D11 for the B11 counterattack and solves B11, M13, and A4", () => {
    const nodes = onboardingNodesById();
    const initial = createTutorialGameState({ initialBoard: nodes.get("doc-setup-3").boardSetup });
    const ordinaryWrong = applyTutorialNodeAction(initial, nodes.get("doc-b11-move"), { pointId: visiblePoint("H13") });
    expect(ordinaryWrong).toMatchObject({ ok: false, message: "再好好想想？" });

    const specialWrong = applyTutorialNodeAction(initial, nodes.get("doc-b11-move"), { pointId: visiblePoint("D11") });
    expect(specialWrong).toMatchObject({ ok: true, wrongMove: true, nextNodeId: "doc-b11-counter" });
    expect(getPoint(specialWrong.state, visiblePoint("D11"))?.stone).toBe("black");
    const counter = applyTutorialNodeAction(specialWrong.state, nodes.get("doc-b11-counter"), { pointId: visiblePoint("B11") });
    expect(counter.ok).toBe(true);
    expect(getPoint(counter.state, visiblePoint("B11"))?.stone).toBe("white");

    let solved = runMove(initial, nodes.get("doc-b11-move"));
    solved = runMove(solved, nodes.get("doc-m13-move"));
    solved = runMove(solved, nodes.get("doc-knife-a4"));
    expect(getPoint(solved, visiblePoint("B11"))?.stone).toBe("black");
    expect(getPoint(solved, visiblePoint("M13"))?.stone).toBe("black");
    expect(getPoint(solved, visiblePoint("A4"))?.stone).toBe("black");
  });

  it("runs the copied skill demonstration at F3, G4, and F5", () => {
    const nodes = onboardingNodesById();
    const initial = createTutorialGameState({ initialBoard: nodes.get("doc-skill-setup").boardSetup });
    const sigrika = applyTutorialSkillAction(initial, nodes.get("doc-skill-f3"), {
      pointId: visiblePoint("F3"),
      pendingSkillId: "doc-sigrika-skill"
    });
    expect(sigrika.ok).toBe(true);
    expect(getPoint(sigrika.resolvedState, visiblePoint("F3"))?.valid).toBe(false);

    const followed = applyTutorialNodeAction(sigrika.resolvedState, nodes.get("doc-skill-g4"), { pointId: visiblePoint("G4") });
    expect(followed.ok).toBe(true);
    expect(getPoint(followed.state, visiblePoint("G4"))?.stone).toBe("black");

    const denia = applyTutorialSkillAction(followed.state, nodes.get("doc-skill-f5"), {
      pointId: visiblePoint("F5"),
      pendingSkillId: "doc-denia-skill"
    });
    expect(denia.ok).toBe(true);
    expect(getPoint(denia.resolvedState, visiblePoint("F5"))?.stone).toBe("white");
  });

  it("keeps un-guided moves hidden, retry edges reachable, and authored pacing intact", () => {
    const nodes = onboardingNodesById();
    for (const nodeId of ["doc-capture-move", "doc-a1-move", "doc-b11-move", "doc-m13-move"]) {
      expect(nodes.get(nodeId)?.targetHighlightEnabled).toBe(false);
    }
    expect(nodes.get("doc-forbidden-move")?.targetHighlightEnabled).toBe(true);
    expect(nodes.get("doc-a1-move")).toMatchObject({ wrongMovePointId: "", applyWrongMove: true, wrongMoveNextNodeId: "doc-a1-wrong-npc" });
    expect(nodes.get("doc-b11-move")).toMatchObject({ wrongMovePointId: visiblePoint("D11"), applyWrongMove: true, wrongMoveNextNodeId: "doc-b11-counter" });
    const wrongAnswerNodeIds = [
      "doc-liberty-wrong-1",
      "doc-liberty-wrong-2",
      "doc-capture-wrong",
      "doc-forbidden-wrong",
      "doc-a1-wrong-npc",
      "doc-false-eye-wrong",
      "doc-b11-wrong",
      "doc-territory-wrong-1",
      "doc-territory-wrong-2",
      "doc-territory-wrong-3",
      "doc-final-count-wrong",
      "doc-opening-wrong",
      "doc-go-name"
    ];
    for (const nodeId of wrongAnswerNodeIds) {
      expect(nodes.get(nodeId)).toMatchObject({
        manualContinueEnabled: true,
        autoContinueEnabled: false
      });
    }
    expect([...nodes.values()]
      .filter((node) => node.id.startsWith("doc-") && node.text && node.autoContinueEnabled === true)
      .map((node) => node.id)).toEqual([
      "doc-false-eye-correct",
      "doc-skill-162",
      "doc-skill-175"
    ]);
    expect(nodes.get("doc-false-eye-question")?.options).toEqual([
      expect.objectContaining({ label: "左上那个", nextNodeId: "doc-false-eye-correct" }),
      expect.objectContaining({ label: "右下那个", nextNodeId: "doc-false-eye-wrong" }),
      expect.objectContaining({ label: "我觉得都是真眼啊！", nextNodeId: "doc-false-eye-wrong" })
    ]);
    expect(nodes.get("doc-false-eye-wrong")).toMatchObject({
      speakerName: "达妮娅",
      characterId: "denia",
      text: "想想前面说的可以落子在禁入点的情况，再看看哪个眼是肯能被白棋率先攻破的？",
      nextNodeId: "doc-false-eye-question"
    });
    for (const node of [...nodes.values()].filter((entry) => entry.id.startsWith("doc-"))) {
      for (const entry of node.options ?? []) expect(entry.transitionDelaySeconds).toBe(0.2);
      if (["npc-move", "npc-skill"].includes(node.type)) {
        expect(Number(node.actionStartDelaySeconds)).toBeGreaterThanOrEqual(0.65);
        expect(Number(node.replyDelaySeconds)).toBeGreaterThanOrEqual(0.35);
      }
    }
    expect(nodes.has("doc-story-152")).toBe(false);
    expect(nodes.get("doc-story-151")).toMatchObject({
      type: "story",
      nextNodeId: "doc-story-153",
      options: [{
        label: "（目瞪口呆地看着西格莉卡把自己地脸颊拍扁了）",
        nextNodeId: "doc-story-153",
        revealDelaySeconds: "",
        transitionDelaySeconds: 0.2
      }]
    });
    expect(nodes.get("doc-skill-172")?.text).toContain("而是还是有代价的");
    expect(nodes.get("doc-story-194")?.text).toBe("哦对了，忘记自我介绍了。我是星炬学院围棋部部长，西格莉卡！{username}，以后还请多多指教呢！");
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

function expectedBoard(black, white, lastMove) {
  return {
    mode: "spark",
    stones: [
      ...coordinateList(black).map((pointId) => ({ pointId, color: "black" })),
      ...coordinateList(white).map((pointId) => ({ pointId, color: "white" }))
    ],
    lastMovePointId: visiblePoint(lastMove)
  };
}

function coordinateList(value) {
  return String(value ?? "").trim().split(/\s+/).filter(Boolean).map(visiblePoint);
}

function visiblePoint(value) {
  const match = /^([A-T])(\d+)$/.exec(String(value));
  const x = "ABCDEFGHJKLMNOPQRST".indexOf(match?.[1] ?? "");
  if (x < 0 || !match) throw new Error(`Invalid coordinate ${value}`);
  return `${x},${13 - Number(match[2])}`;
}

function runMove(state, node) {
  const result = applyTutorialNodeAction(state, node, { pointId: node.pointId });
  expect(result.ok).toBe(true);
  return result.state;
}

function boardStones(state) {
  return state.points.filter((point) => point.stone).map((point) => ({ pointId: point.id, color: point.stone }));
}

function hashNodes(nodes) {
  return crypto.createHash("sha256").update(JSON.stringify(nodes)).digest("hex");
}

function experiencedNodes(nodes) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const reachable = new Set();
  const stack = ["story-15", "story-46"];
  while (stack.length) {
    const id = stack.pop();
    if (!id || reachable.has(id) || !byId.has(id)) continue;
    reachable.add(id);
    const node = byId.get(id);
    if (node.nextNodeId) stack.push(node.nextNodeId);
    for (const entry of node.options ?? []) if (entry.nextNodeId) stack.push(entry.nextNodeId);
  }
  return nodes.filter((node) => reachable.has(node.id));
}
