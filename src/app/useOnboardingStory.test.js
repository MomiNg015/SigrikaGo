import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("useOnboardingStory wiring", () => {
  it("records completion and shows the one-time welcome mail notice after every exit path", () => {
    const source = readFileSync(new URL("./useOnboardingStory.js", import.meta.url), "utf8");

    expect(source).toContain('api("/api/onboarding-story/completed"');
    expect(source).toContain('api("/api/onboarding-story/exited"');
    expect(source).toContain("onComplete: markCompleted");
    expect(source).toContain("onExit: markExited");
    expect(source).toContain("AEMEATH_WELCOME_MAIL_TOAST");
    expect(source).toContain("if (data.showNotice) showToast?.(AEMEATH_WELCOME_MAIL_TOAST)");
  });
});
