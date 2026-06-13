import { GAME_PHASES } from "../src/shared/game.js";

export function appendSystem(room, text, options = {}) {
  room.chat.push({
    id: crypto.randomUUID(),
    type: "system",
    kind: options.kind ?? null,
    moveNumber: room.game.moveNumber,
    text,
    createdAt: Date.now()
  });
}

export function appendNotices(room, notices = []) {
  for (const text of notices) {
    appendSystem(room, text);
  }
}

export function ensureRestoredDisconnectedNotices(room) {
  if (room.game.phase === GAME_PHASES.finished) return;
  for (const player of room.players) {
    if (player.socketId || !player.disconnectedAt) continue;
    const username = player.user?.username ?? "";
    const alreadyAnnounced = room.chat.some((message) => (
      message.kind === "disconnect"
      && message.text?.includes(username)
      && message.text?.includes("断线中")
    ));
    if (!alreadyAnnounced) appendSystem(room, `${username}断线中。`, { kind: "disconnect" });
  }
}
