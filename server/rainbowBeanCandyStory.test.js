import { describe, expect, it } from "vitest";
import {
  defaultRainbowBeanCandyStoryDraft,
  RAINBOW_BEAN_CANDY_REJECTION_PROBABILITY,
  rollRainbowBeanCandyOutcome,
  selectRainbowBeanCandyStoryBranch
} from "./rainbowBeanCandyStory.js";

describe("rainbow bean candy story", () => {
  it("always accepts for Sigrika and keeps a strict 35 percent rejection boundary for the other supported characters", () => {
    expect(RAINBOW_BEAN_CANDY_REJECTION_PROBABILITY).toBe(0.35);
    expect(rollRainbowBeanCandyOutcome("sigrika", () => 0)).toBe("accepted");
    for (const characterId of ["denia", "aemeath", "lynae"]) {
      expect(rollRainbowBeanCandyOutcome(characterId, () => 0)).toBe("rejected");
      expect(rollRainbowBeanCandyOutcome(characterId, () => 0.349999)).toBe("rejected");
      expect(rollRainbowBeanCandyOutcome(characterId, () => 0.35)).toBe("accepted");
      expect(rollRainbowBeanCandyOutcome(characterId, () => 0.99)).toBe("accepted");
    }
  });

  it("selects the runtime start node without mutating the published script", () => {
    const script = { startNodeId: "accepted-start", nodes: [{ id: "accepted-start" }, { id: "rejected-start" }] };
    const rejected = selectRainbowBeanCandyStoryBranch(script, "rejected");

    expect(rejected.startNodeId).toBe("rejected-start");
    expect(script.startNodeId).toBe("accepted-start");
  });

  it("keeps every narration node free of speaker and character labels", () => {
    for (const characterId of ["sigrika", "denia", "aemeath", "lynae"]) {
      const draft = defaultRainbowBeanCandyStoryDraft(characterId);
      const narrationNodes = draft.nodes.filter((node) => node.type === "story" && !node.characterId);
      expect(narrationNodes.length).toBeGreaterThan(0);
      expect(narrationNodes.every((node) => node.speakerName === "" && node.characterId === "")).toBe(true);
      expect(draft.nodes.some((node) => node.speakerName === "旁白")).toBe(false);
    }
  });

  it("ships the document scenes while preserving Sigrika's separate corruption and recovery arc", () => {
    const sigrika = defaultRainbowBeanCandyStoryDraft("sigrika").nodes;
    const denia = defaultRainbowBeanCandyStoryDraft("denia").nodes;
    const aemeath = defaultRainbowBeanCandyStoryDraft("aemeath").nodes;
    const lynae = defaultRainbowBeanCandyStoryDraft("lynae").nodes;

    expect(sigrika).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "use-1-start", nextNodeId: "shared-effect-start" }),
      expect.objectContaining({ id: "use-7-start", nextNodeId: "shared-effect-start" }),
      expect.objectContaining({ id: "corruption-climax" }),
      expect.objectContaining({ id: "recovery-win-start" }),
      expect.objectContaining({ id: "recovery-loss-start" })
    ]));
    expect(denia).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "accepted-rays", text: expect.stringContaining("双眼和嘴巴里喷射而出") }),
      expect.objectContaining({ id: "accepted-chase", text: expect.stringContaining("三道乱晃的彩虹射线") }),
      expect.objectContaining({ id: "rejected-sleep", text: "达妮娅趴在桌子上，把脸埋在了臂弯中。" })
    ]));
    expect(aemeath).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "accepted-ripple", text: "棋子接触交叉点的瞬间，一圈七彩像素光纹“啪”地绽开，沿着棋盘线飞快扩散，然后消失。" }),
      expect.objectContaining({ id: "accepted-name", text: "好！这个状态就叫——彩虹落子模式！" }),
      expect.objectContaining({ id: "rejected-title", text: "诶，别走呀？标题我都想好了——《{username}的整蛊糖果首秀》！真的不考虑一下吗？" })
    ]));
    expect(lynae).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "accepted-correct", text: "不是！我刚才明明想说的是难吃！" }),
      expect.objectContaining({ id: "accepted-boring", text: "这颗糖很无聊——不对，是无聊！非常无聊！" }),
      expect.objectContaining({ id: "accepted-cover-mouth", text: "琳奈突然捂住了嘴，朝你挤眉弄眼。", characterId: "", speakerName: "" }),
      expect.objectContaining({ id: "rejected-boundary", text: "哼哼，类似的惊喜我见多了。" }),
      expect.objectContaining({ id: "rejected-interest", nextNodeId: "" })
    ]));
    expect(sigrika.some((node) => node.id.startsWith("rejected-"))).toBe(false);
    for (let useCount = 1; useCount <= 7; useCount += 1) {
      const script = selectRainbowBeanCandyStoryBranch(
        defaultRainbowBeanCandyStoryDraft("sigrika"), "accepted", { characterId: "sigrika", useCount }
      );
      const nodes = new Map(script.nodes.map((node) => [node.id, node]));
      const visited = new Set();
      let node = nodes.get(script.startNodeId);
      while (node) {
        expect(visited.has(node.id)).toBe(false);
        visited.add(node.id);
        expect(node.text).not.toContain("占位");
        node = nodes.get(node.options[0]?.nextNodeId || node.nextNodeId);
      }
      expect(visited.has("shared-effect-unavailable")).toBe(true);
    }
  });
});
