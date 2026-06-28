import express from "express";
import {
  getPlayerOnboardingStory,
  markOnboardingAutoShown
} from "./onboardingStory.js";

export function createOnboardingStoryRouteHandlers({
  prisma,
  getPlayerOnboardingStoryFn = getPlayerOnboardingStory,
  markOnboardingAutoShownFn = markOnboardingAutoShown
}) {
  async function getStory(req, res) {
    try {
      res.json(await getPlayerOnboardingStoryFn({ prisma, user: req.user }));
    } catch (error) {
      sendRouteError(res, error);
    }
  }

  async function markAutoShown(req, res) {
    try {
      res.json(await markOnboardingAutoShownFn({ prisma, user: req.user }));
    } catch (error) {
      sendRouteError(res, error);
    }
  }

  return { getStory, markAutoShown };
}

export function createOnboardingStoryRouter(deps) {
  const router = express.Router();
  const handlers = createOnboardingStoryRouteHandlers(deps);
  router.get("/onboarding-story", handlers.getStory);
  router.post("/onboarding-story/auto-shown", handlers.markAutoShown);
  return router;
}

function sendRouteError(res, error) {
  res.status(error.status ?? 500).json({
    error: error.message ?? "\u65b0\u624b\u5f15\u5bfc\u8bf7\u6c42\u5931\u8d25"
  });
}
