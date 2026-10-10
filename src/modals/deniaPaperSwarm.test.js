import { describe, expect, it, vi } from "vitest";
import { createDeniaPapers, drawDeniaPapers } from "./deniaPaperSwarm.js";

describe("bounded paper swarm", () => {
  it.each([[390, 34, 56], [1440, 44, 76]])("uses the requested size range at %i px", (width, min, max) => {
    const papers = createDeniaPapers(width, 844);
    expect(papers.every((paper) => paper.size >= min && paper.size <= max)).toBe(true);
  });
  it("bounds draw calls independently of apparent density and clears outside the effect window", () => {
    const context = { clearRect: vi.fn(), drawImage: vi.fn() };
    const field = { width: 2272, height: 1012 };
    const loose = createDeniaPapers(1440, 900).slice(0, 64);
    const frames = Array(12).fill({});
    drawDeniaPapers(context, frames, { field, loose }, 1440, 900, 1750);
    expect(context.drawImage.mock.calls.length).toBeLessThanOrEqual(72);
    context.drawImage.mockClear();
    drawDeniaPapers(context, frames, { field, loose }, 1440, 900, 999);
    drawDeniaPapers(context, frames, { field, loose }, 1440, 900, 2500);
    expect(context.drawImage).not.toHaveBeenCalled();
    expect(context.clearRect).toHaveBeenCalledTimes(3);
  });
});
