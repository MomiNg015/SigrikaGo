import express from "express";
import { USER_ROLES } from "./adminConfig.js";
import { canUseVerificationFixtures } from "./security.js";
import { parseCharacterAssetList, serializeAssetList } from "./userAssets.js";
import { canonicalCharacterId } from "../src/shared/characterAliases.js";

export function createVerificationFixtureHandlers({ prisma, env = process.env }) {
  function rejectUnlessEnabled(res) {
    if (canUseVerificationFixtures(env)) return false;
    res.status(404).json({ error: "Not found" });
    return true;
  }

  async function grantCharacter(req, res) {
    if (rejectUnlessEnabled(res)) return;
    const characterId = canonicalCharacterId(String(req.body.characterId ?? "").trim());
    if (!/^[a-z0-9-]{1,48}$/.test(characterId)) {
      res.status(400).json({ error: "Invalid verification character" });
      return;
    }
    const ownedCharacters = parseCharacterAssetList(req.user.ownedCharacters);
    if (!ownedCharacters.includes(characterId)) ownedCharacters.push(characterId);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { ownedCharacters: serializeAssetList(ownedCharacters) }
    });
    res.json({ ok: true });
  }

  async function promoteAdmin(req, res) {
    if (rejectUnlessEnabled(res)) return;
    await prisma.user.update({
      where: { id: req.user.id },
      data: { role: USER_ROLES.admin }
    });
    res.json({ ok: true });
  }

  return { grantCharacter, promoteAdmin };
}

export function createVerificationFixtureRouter(deps) {
  const router = express.Router();
  const handlers = createVerificationFixtureHandlers(deps);
  router.post("/me/characters", handlers.grantCharacter);
  router.post("/me/admin", handlers.promoteAdmin);
  return router;
}
