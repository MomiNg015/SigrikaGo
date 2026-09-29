import express from "express";
import { RECRUITMENT_ITEM_TYPES } from "../src/shared/recruitment.js";
import { getPlayerOnboardingStory } from "./onboardingStory.js";

const FINISHED = ["completed", "skipped"];

export async function getHomeOnboarding({ prisma, userId }) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: {
    homeOnboardingStatus: true, onboardingRequired: true, onboardingAutoShownAt: true,
    onboardingCompletedAt: true, onboardingExitedAt: true, username: true
  } });
  if (!user) throw Object.assign(new Error("用户不存在"), { status: 404 });
  const status = user.homeOnboardingStatus ?? "pending";
  const { autoEligible } = await getPlayerOnboardingStory({ prisma, user });
  return { status, eligible: !FINISHED.includes(status) && !autoEligible };
}

export async function startHomeOnboarding({ prisma, userId }) {
  const state = await getHomeOnboarding({ prisma, userId });
  if (!state.eligible) return state;
  await prisma.user.updateMany({
    where: { id: userId, homeOnboardingStatus: "pending" },
    data: { homeOnboardingStatus: "active" }
  });
  return getHomeOnboarding({ prisma, userId });
}

export async function finishHomeOnboarding({ prisma, userId, outcome, now = new Date() }) {
  if (!FINISHED.includes(outcome)) throw Object.assign(new Error("无效的引导结束状态"), { status: 400 });
  return prisma.$transaction(async (tx) => {
    // Claim settlement with a conditional write, never a read-then-create reward check.
    const claimed = await tx.user.updateMany({
      where: { id: userId, homeOnboardingStatus: "active" },
      data: { homeOnboardingStatus: outcome, homeOnboardingFinishedAt: now, welcomeMailNoticeShownAt: now }
    });
    if (!claimed.count) {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { homeOnboardingStatus: true } });
      if (!FINISHED.includes(user?.homeOnboardingStatus)) {
        throw Object.assign(new Error("请先开始主界面引导"), { status: 409 });
      }
      return { status: user.homeOnboardingStatus, awarded: false };
    }
    for (const [itemId, label] of [
      [RECRUITMENT_ITEM_TYPES.campusPoster, "学院招募海报"],
      [RECRUITMENT_ITEM_TYPES.radioTicket, "先约电台广播券"]
    ]) {
      await tx.mailboxMessage.create({ data: {
        userId, sender: "西格莉卡", title: `围棋部招新物资 · ${label}`,
        body: `答应你的招募物品准备好啦！这次给你带来了3份${label}，领取后去招募窗口试试看吧。希望很快就能在围棋部见到更多新伙伴！\n\n——西格莉卡`,
        attachmentType: "item", attachmentItemId: itemId, attachmentQuantity: 3
      } });
    }
    return { status: outcome, awarded: true };
  });
}

export function createHomeOnboardingRouter({ prisma }) {
  const router = express.Router();
  const handle = (operation) => async (req, res, next) => {
    try { res.json(await operation({ prisma, userId: req.user.id, outcome: req.body?.outcome })); }
    catch (error) { next(error); }
  };
  router.get("/home-onboarding", handle(getHomeOnboarding));
  router.post("/home-onboarding/start", handle(startHomeOnboarding));
  router.post("/home-onboarding/finish", handle(finishHomeOnboarding));
  return router;
}
