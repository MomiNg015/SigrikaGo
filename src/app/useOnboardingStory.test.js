import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("useOnboardingStory wiring", () => {
  it("opens onboarding tutorial playback with a completion callback", () => {
    const source = readFileSync(new URL("./useOnboardingStory.js", import.meta.url), "utf8");

    expect(source).toContain('api("/api/onboarding-story/completed"');
    expect(source).toContain("openStoryPlayer?.(data.script, onboardingStoryLabels(), { onComplete: markCompleted })");
  });
});
