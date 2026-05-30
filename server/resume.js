import { GAME_PHASES } from "../src/shared/game.js";

export async function resumePayloadForUser({ prisma, userId, roomCode = "", findRoomForUser, roomView }) {
  const room = findRoomForUser(userId, roomCode);
  if (room) {
    const view = roomView(room, userId);
    return room.game.phase === GAME_PHASES.finished
      ? { type: "result", room: view }
      : { type: "room", room: view };
  }

  if (!roomCode) return { type: "none" };
  const record = await prisma.gameRecord.findFirst({
    where: {
      roomCode,
      OR: [
        { blackUserId: userId },
        { whiteUserId: userId }
      ]
    },
    orderBy: { createdAt: "desc" }
  });
  if (!record) return { type: "none" };

  let recordRoom;
  try {
    recordRoom = JSON.parse(record.snapshot);
  } catch {
    return { type: "none" };
  }

  return {
    type: "result",
    recordId: record.id,
    room: recordRoom
  };
}
