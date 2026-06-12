import { normalizeGameModeId } from "../src/shared/gameModes.js";
import { createRoom } from "./roomFactory.js";

export function createRoomCreationLifecycle({
  rooms,
  matchmakingQueue,
  isRoomCodeTaken,
  persistRoom,
  startGameClock,
  scheduleGameStart,
  roomView,
  appendSystem,
  broadcastRoom
}) {
  function joinMatchmaking(player, io, { canPair = () => true } = {}) {
    const match = matchmakingQueue.join(player, { canPair });
    if (!match.matched) return null;

    const first = match.opponent;
    const room = createRoom(first, match.player, {
      modeInput: match.mode,
      isCodeTaken: isRoomCodeTaken
    });
    registerCreatedRoom(room, io);
    emitMatchFound(io, room, first, player);
    appendSystem(room, "\u5339\u914d\u6210\u529f\uff0c3\u79d2\u540e\u8fdb\u5165\u661f\u70ac\u5bf9\u5f08\u3002");
    broadcastRoom(io, room);
    return room;
  }

  function createDirectRoom(first, second, io, modeInput = "spark") {
    const mode = normalizeGameModeId(modeInput);
    matchmakingQueue.removeUser(first.user.id);
    matchmakingQueue.removeUser(second.user.id);
    const room = createRoom({ ...first, mode }, { ...second, mode }, {
      modeInput: mode,
      isCodeTaken: isRoomCodeTaken
    });
    registerCreatedRoom(room, io);
    appendSystem(room, "\u5bf9\u5c40\u7533\u8bf7\u5df2\u540c\u610f\uff0c3\u79d2\u540e\u8fdb\u5165\u661f\u70ac\u5bf9\u5f08\u3002");
    emitMatchFound(io, room, first, second);
    broadcastRoom(io, room);
    return room;
  }

  function registerCreatedRoom(room, io) {
    rooms.set(room.code, room);
    persistRoom(room, { force: true });
    startGameClock(room, io);
    scheduleGameStart(room, io);
  }

  function emitMatchFound(io, room, first, second) {
    io.to(first.socketId).emit("match:found", roomView(room, first.user.id));
    io.to(second.socketId).emit("match:found", roomView(room, second.user.id));
  }

  return {
    joinMatchmaking,
    createDirectRoom
  };
}
