import { describe, expect, it, vi } from "vitest";
import { createOnboardingStoryRouteHandlers } from "./onboardingStoryRoutes.js";

describe("onboarding story route handlers", () => {
  it("binds the authenticated user when reading the player onboarding story", async () => {
    const getPlayerOnboardingStoryFn = vi.fn(async () => ({ script: null, autoEligible: false }));
    const handlers = createOnboardingStoryRouteHandlers({ prisma: {}, getPlayerOnboardingStoryFn });
    const req = { user: { id: "user-1" } };
    const res = responseCollector();

    await handlers.getStory(req, res);

    expect(getPlayerOnboardingStoryFn).toHaveBeenCalledWith({
      prisma: {},
      user: req.user
    });
    expect(res.body).toEqual({ script: null, autoEligible: false });
  });

  it("binds the authenticated user when marking automatic display", async () => {
    const markOnboardingAutoShownFn = vi.fn(async () => ({ ok: true }));
    const handlers = createOnboardingStoryRouteHandlers({ prisma: {}, markOnboardingAutoShownFn });
    const req = { user: { id: "user-1" } };
    const res = responseCollector();

    await handlers.markAutoShown(req, res);

    expect(markOnboardingAutoShownFn).toHaveBeenCalledWith({
      prisma: {},
      user: req.user
    });
    expect(res.body).toEqual({ ok: true });
  });

  it("binds the authenticated user when marking tutorial completion", async () => {
    const markOnboardingCompletedFn = vi.fn(async () => ({ ok: true }));
    const handlers = createOnboardingStoryRouteHandlers({ prisma: {}, markOnboardingCompletedFn });
    const req = { user: { id: "user-1" } };
    const res = responseCollector();

    await handlers.markCompleted(req, res);

    expect(markOnboardingCompletedFn).toHaveBeenCalledWith({
      prisma: {},
      user: req.user
    });
    expect(res.body).toEqual({ ok: true });
  });

  it("atomically records the one-time welcome-mail notice after onboarding exits", async () => {
    const markWelcomeMailNoticeShownFn = vi.fn(async () => ({ ok: true, showNotice: true }));
    const handlers = createOnboardingStoryRouteHandlers({ prisma: {}, markWelcomeMailNoticeShownFn });
    const req = { user: { id: "user-1" } };
    const res = responseCollector();

    await handlers.markExited(req, res);

    expect(markWelcomeMailNoticeShownFn).toHaveBeenCalledWith({
      prisma: {},
      userId: "user-1",
      now: expect.any(Date)
    });
    expect(res.body).toEqual({ ok: true, showNotice: true });
  });

  it("returns domain errors as JSON", async () => {
    const error = Object.assign(new Error("新手引导不存在"), { status: 404 });
    const handlers = createOnboardingStoryRouteHandlers({
      prisma: {},
      getPlayerOnboardingStoryFn: async () => { throw error; }
    });
    const res = responseCollector();

    await handlers.getStory({ user: { id: "user-1" } }, res);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: "新手引导不存在" });
  });
});

function responseCollector() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}
