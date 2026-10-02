import express from "express";
import { normalizeGameModeId } from "../src/shared/gameModes.js";
import { validateUsername } from "./security.js";
import {
  deleteRelationship,
  createUserReport,
  getUserProfile,
  getUserProfileByUsername,
  getUserReplays,
  likeUserProfile,
  listSocialUsers,
  RELATIONSHIP_TYPES,
  setRelationship
} from "./social.js";

export function createSocialRouteHandlers({
  prisma,
  statusForUser,
  deleteRelationshipFn = deleteRelationship,
  getUserProfileByUsernameFn = getUserProfileByUsername,
  getUserProfileFn = getUserProfile,
  getUserReplaysFn = getUserReplays,
  likeUserProfileFn = likeUserProfile,
  createUserReportFn = createUserReport,
  listSocialUsersFn = listSocialUsers,
  normalizeMode = normalizeGameModeId,
  setRelationshipFn = setRelationship,
  validateUsernameFn = validateUsername
}) {
  const socialListFor = (userId) => listSocialUsersFn({ prisma, userId, statusForUser });

  async function listSocial(req, res) {
    res.json(await socialListFor(req.user.id));
  }

  async function addFriend(req, res) {
    try {
      await setRelationshipFn({
        prisma,
        ownerUserId: req.user.id,
        targetUserId: req.params.targetId,
        type: RELATIONSHIP_TYPES.friend
      });
      res.json(await socialListFor(req.user.id));
    } catch (error) {
      res.status(error.status ?? 500).json({ error: error.message ?? "\u64cd\u4f5c\u5931\u8d25" });
    }
  }

  async function removeFriend(req, res) {
    await deleteRelationshipFn({
      prisma,
      ownerUserId: req.user.id,
      targetUserId: req.params.targetId,
      type: RELATIONSHIP_TYPES.friend
    });
    res.json(await socialListFor(req.user.id));
  }

  async function addBlacklist(req, res) {
    try {
      await setRelationshipFn({
        prisma,
        ownerUserId: req.user.id,
        targetUserId: req.params.targetId,
        type: RELATIONSHIP_TYPES.blacklist
      });
      res.json(await socialListFor(req.user.id));
    } catch (error) {
      res.status(error.status ?? 500).json({ error: error.message ?? "\u64cd\u4f5c\u5931\u8d25" });
    }
  }

  async function removeBlacklist(req, res) {
    await deleteRelationshipFn({
      prisma,
      ownerUserId: req.user.id,
      targetUserId: req.params.targetId,
      type: RELATIONSHIP_TYPES.blacklist
    });
    res.json(await socialListFor(req.user.id));
  }

  async function searchProfile(req, res) {
    const usernameResult = validateUsernameFn(req.query.username);
    if (!usernameResult.ok) {
      res.status(400).json({ error: usernameResult.error });
      return;
    }
    const profile = await getUserProfileByUsernameFn({
      prisma,
      username: usernameResult.value,
      viewerId: req.user.id,
      statusForUser,
      mode: normalizeMode(req.query.mode)
    });
    if (!profile) {
      res.status(404).json({ error: "\u8be5\u7528\u6237\u4e0d\u5b58\u5728" });
      return;
    }
    res.json({ profile });
  }

  async function getProfile(req, res) {
    const profile = await getUserProfileFn({
      prisma,
      userId: req.params.id,
      viewerId: req.user.id,
      statusForUser,
      mode: normalizeMode(req.query.mode)
    });
    if (!profile) {
      res.status(404).json({ error: "\u7528\u6237\u4e0d\u5b58\u5728" });
      return;
    }
    res.json({ profile });
  }

  async function getReplays(req, res) {
    const page = await getUserReplaysFn({
      prisma,
      userId: req.params.id,
      mode: normalizeMode(req.query.mode),
      cursor: req.query.cursor
    });
    if (!page) {
      res.status(404).json({ error: "\u7528\u6237\u4e0d\u5b58\u5728" });
      return;
    }
    res.json(page);
  }

  async function likeProfile(req, res) {
    try {
      res.json(await likeUserProfileFn({
        prisma,
        likerUserId: req.user.id,
        targetUserId: req.params.id
      }));
    } catch (error) {
      res.status(error.status ?? 500).json({ error: error.message ?? "点赞失败" });
    }
  }

  async function reportProfile(req, res) {
    try {
      res.json(await createUserReportFn({
        prisma,
        reporter: req.user,
        reportedUserId: req.params.id,
        content: req.body.content
      }));
    } catch (error) {
      res.status(error.status ?? 500).json({ error: error.message ?? "举报提交失败" });
    }
  }

  return {
    listSocial,
    addFriend,
    removeFriend,
    addBlacklist,
    removeBlacklist,
    searchProfile,
    getProfile,
    getReplays,
    likeProfile,
    reportProfile
  };
}

export function createSocialRouter({ authHttp, ...deps }) {
  const router = express.Router();
  const handlers = createSocialRouteHandlers(deps);
  router.get("/social", authHttp, handlers.listSocial);
  router.post("/social/friends/:targetId", authHttp, handlers.addFriend);
  router.delete("/social/friends/:targetId", authHttp, handlers.removeFriend);
  router.post("/social/blacklist/:targetId", authHttp, handlers.addBlacklist);
  router.delete("/social/blacklist/:targetId", authHttp, handlers.removeBlacklist);
  router.get("/users/search/profile", authHttp, handlers.searchProfile);
  router.get("/users/:id/profile", authHttp, handlers.getProfile);
  router.post("/users/:id/like", authHttp, handlers.likeProfile);
  router.post("/users/:id/report", authHttp, handlers.reportProfile);
  router.get("/users/:id/replays", handlers.getReplays);
  return router;
}
