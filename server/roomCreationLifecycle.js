import { gameModeById, normalizeGameModeId } from "../src/shared/gameModes.js";
import { createRoom } from "./roomFactory.js";

export function createRoomCreationLifecycle({
  rooms,
  matchmakingQueue,
  isRoomCodeTaken,
  persistRoom,
  startGameClock,
  scheduleRoomPreloadTimeout = () => {},
  roomView,
  appendSystem,
  broadcastRoom,
  registerRoom = () => {}
}) {
  function joinMatchmaking(player, io, { canPair = () => true } = {}) {
    const match = matchmakingQueue.join(player, { canPair });
    if (!match.matched) return null;

    const first = match.opponent;
    const room = createRoom(first, match.player, {
      modeInput: match.mode,
      rated: true,
      matchSource: "matchmaking",
      isCodeTaken: isRoomCodeTaken
    });
    registerCreatedRoom(room, io);
    emitMatchFound(io, room, first, player);
    appendRoomCreatedNotices(room, "匹配成功");
    broadcastRoom(io, room);
    return room;
  }

  function createDirectRoom(first, second, io, modeInput = "spark") {
    const mode = normalizeGameModeId(modeInput);
    matchmakingQueue.removeUser(first.user.id);
    matchmakingQueue.removeUser(second.user.id);
    const room = createRoom({ ...first, mode }, { ...second, mode }, {
      modeInput: mode,
      rated: false,
      matchSource: "duel",
      isCodeTaken: isRoomCodeTaken
    });
    registerCreatedRoom(room, io);
    appendRoomCreatedNotices(room, "对局申请已同意");
    emitMatchFound(io, room, first, second);
    broadcastRoom(io, room);
    return room;
  }

  function registerCreatedRoom(room, io) {
    rooms.set(room.code, room);
    registerRoom(room);
    persistRoom(room, { force: true });
    startGameClock(room, io);
    scheduleRoomPreloadTimeout(room, io);
  }

  function emitMatchFound(io, room, first, second) {
    io.to(first.socketId).emit("match:found", roomView(room, first.user.id));
    io.to(second.socketId).emit("match:found", roomView(room, second.user.id));
  }

  function appendRoomCreatedNotices(room, prefix) {
    const mode = gameModeById(room.mode ?? room.game?.mode);
    appendSystem(room, `${prefix}，3秒后进入${mode.shortTitle}对弈。`);
    if (mode.family === "gomoku") {
      const blackPlayer = room.players.find((player) => player.color === "black");
      appendSystem(room, `已自动猜先，${blackPlayer?.user?.username ?? "黑方"}执黑先行。`);
    }
  }

  return {
    joinMatchmaking,
    createDirectRoom
  };
}
