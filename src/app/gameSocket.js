import { io } from "socket.io-client";
import { installSocketHandlers } from "./socketHandlers.js";

export function connectGameSocket({
  ioClient = io,
  socketBase,
  token,
  handlers,
  installHandlers = installSocketHandlers,
  buildRoomResumeRequest,
  onSocketReconnect
}) {
  const socket = ioClient(socketBase, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
    timeout: 6000
  });
  installHandlers(socket, handlers, { buildRoomResumeRequest, onSocketReconnect });
  return socket;
}
