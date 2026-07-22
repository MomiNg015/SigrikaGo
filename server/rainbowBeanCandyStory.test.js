import { describe, expect, it } from "vitest";
import {
  defaultRainbowBeanCandyStoryDraft,
  RAINBOW_BEAN_CANDY_REJECTION_PROBABILITY,
  rollRainbowBeanCandyOutcome,
  selectRainbowBeanCandyStoryBranch
} from "./rainbowBeanCandyStory.js";

describe("rainbow bean candy story", () => {
  it("uses a strict 35 percent rejection boundary for every supported character", () => {
    expect(RAINBOW_BEAN_CANDY_REJECTION_PROBABILITY).toBe(0.35);
    for (const characterId of ["sigrika", "denia", "aemeath"]) {
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
    for (const characterId of ["sigrika", "denia", "aemeath"]) {
      const draft = defaultRainbowBeanCandyStoryDraft(characterId);
      const narrationNodes = draft.nodes.filter((node) => node.type === "story" && !node.characterId);
      expect(narrationNodes.length).toBeGreaterThan(0);
      expect(narrationNodes.every((node) => node.speakerName === "" && node.characterId === "")).toBe(true);
      expect(draft.nodes.some((node) => node.speakerName === "旁白")).toBe(false);
    }
  });

  it("ships the Word-authored candy outcomes", () => {
    const sigrika = defaultRainbowBeanCandyStoryDraft("sigrika").nodes;
    const denia = defaultRainbowBeanCandyStoryDraft("denia").nodes;
    const aemeath = defaultRainbowBeanCandyStoryDraft("aemeath").nodes;

    expect(sigrika).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "accepted-unavailable", text: "看来暂时不能找她下棋了。" }),
      expect.objectContaining({ id: "rejected-return", text: "西格莉卡把糖果推了回来。看来今天没办法得逞了。" })
    ]));
    expect(denia).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "accepted-rays", text: expect.stringContaining("双眼和嘴巴里喷射而出") }),
      expect.objectContaining({ id: "accepted-chase", text: expect.stringContaining("三道乱晃的彩虹射线") }),
      expect.objectContaining({ id: "rejected-sleep", text: expect.stringContaining("糖果被完整地退了回来") })
    ]));
    expect(aemeath).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "accepted-ripple", text: "棋子接触交叉点的瞬间，一圈七彩像素光纹“啪”地绽开，沿着棋盘线飞快扩散。" }),
      expect.objectContaining({ id: "accepted-name", text: "好！这个状态就叫——彩虹落子模式！" }),
      expect.objectContaining({ id: "rejected-title", text: "诶，别走呀？标题我都想好了——《{username}的整蛊糖果首秀》！真的不考虑一下吗？" })
    ]));
  });
});
