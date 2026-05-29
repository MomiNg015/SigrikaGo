import jwt from "jsonwebtoken";
import { USER_STATUS } from "./adminConfig.js";
import { publicUser } from "./db.js";
import { resolveSelectedCharacter } from "./characterSelection.js";
import { blockedCharactersForItemEffects } from "./itemEffects.js";

export async function authenticateSocketUser({ token, jwtSecret, prisma, characterSelectionData, isSessionActive = null }) {
  const payload = jwt.verify(token, jwtSecret);
  if (isSessionActive && !isSessionActive(payload.sub, payload.sid)) throw new Error("unauthorized");
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new Error("unauthorized");
  if (user.status === USER_STATUS.banned) throw new Error("forbidden");

  const socketUser = publicUser(user);
  const { characters, disabledSlugs } = await characterSelectionData();
  const selected = resolveSelectedCharacter(
    socketUser.selectedCharacter,
    characters,
    disabledSlugs,
    socketUser.ownedCharacters,
    blockedCharactersForItemEffects(socketUser.itemEffects)
  );
  const authenticatedUser = {
    ...socketUser,
    selectedCharacter: selected.characterId,
    characterConfig: selected.characterConfig
  };
  Object.defineProperty(authenticatedUser, "sessionId", {
    value: payload.sid ?? null,
    enumerable: false
  });
  return authenticatedUser;
}

export function createSocketUserRefresher({ jwtSecret, prisma, characterSelectionData, isSessionActive = null }) {
  return async function refreshSocketUser(socket) {
    const user = await authenticateSocketUser({
      token: socket.handshake.auth?.token,
      jwtSecret,
      prisma,
      characterSelectionData,
      isSessionActive
    });
    socket.user = user;
    socket.data ??= {};
    socket.data.sessionId = user.sessionId;
    return user;
  };
}
