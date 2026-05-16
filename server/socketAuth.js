import jwt from "jsonwebtoken";
import { USER_STATUS } from "./adminConfig.js";
import { publicUser } from "./db.js";
import { resolveSelectedCharacter } from "./characterSelection.js";

export async function authenticateSocketUser({ token, jwtSecret, prisma, characterSelectionData }) {
  const payload = jwt.verify(token, jwtSecret);
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new Error("unauthorized");
  if (user.status === USER_STATUS.banned) throw new Error("forbidden");

  const socketUser = publicUser(user);
  const { characters, disabledSlugs } = await characterSelectionData();
  const selected = resolveSelectedCharacter(socketUser.selectedCharacter, characters, disabledSlugs);
  return {
    ...socketUser,
    selectedCharacter: selected.characterId,
    characterConfig: selected.characterConfig
  };
}
