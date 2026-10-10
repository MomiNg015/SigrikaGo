import { describe, expect, it, vi } from "vitest";
import { createDeniaPapers, deniaPaperPose, drawDeniaPapers } from "./deniaPaperSwarm.js";

describe("bounded paper swarm", () => {
  it.each([390, 1440])( "keeps three distinct depths at %i px", (width) => {
    const papers = createDeniaPapers(width, 844);
    const layers = [0, 1, 2].map(depth => papers.filter(p => p.depth === depth));
    expect(Math.max(...layers[0].map(p => p.size))).toBeLessThan(Math.min(...layers[1].map(p => p.size)));
    expect(Math.max(...layers[1].map(p => p.size))).toBeLessThan(Math.min(...layers[2].map(p => p.size)));
    expect(layers[2].length).toBeLessThan(layers[1].length);
    expect(papers).toEqual(createDeniaPapers(width, 844));
  });
  it("gives papers independent curved paths, continuous tumble and left-to-right travel", () => {
    const papers = createDeniaPapers(390, 844);
    for (const paper of papers) {
      const before = deniaPaperPose(paper, 1400);
      const after = deniaPaperPose(paper, 2000);
      expect(after.x).toBeGreaterThan(before.x);
      expect(after.y).not.toBe(before.y);
      expect(after.angle).not.toBe(before.angle);
      expect(after.fold).toBeGreaterThanOrEqual(.18);
    }
    expect(new Set(papers.map(p => p.speed)).size).toBe(papers.length);
  });
  it("caps the particle budget, culls offscreen pieces and clears outside the effect window", () => {
    const context = Object.fromEntries(["clearRect", "drawImage", "save", "restore", "translate", "rotate", "scale"].map(key => [key, vi.fn()]));
    const papers = createDeniaPapers(3840, 2160);
    expect(papers.length).toBeLessThanOrEqual(1600);
    const frames = Array(3).fill({});
    drawDeniaPapers(context, frames, papers, 3840, 2160, 1250);
    expect(context.drawImage.mock.calls.length).toBeLessThan(papers.length);
    context.drawImage.mockClear();
    drawDeniaPapers(context, frames, papers, 3840, 2160, 999);
    drawDeniaPapers(context, frames, papers, 3840, 2160, 2500);
    expect(context.drawImage).not.toHaveBeenCalled();
    expect(context.clearRect).toHaveBeenCalledTimes(3);
  });
});
