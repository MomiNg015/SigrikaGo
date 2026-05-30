import { io } from "socket.io-client";
import { installSocketHandlers } from "./socketHandlers.js";

export function connectGameSocket({
  ioClient = io,
  socketBase,
  token,
  handlers,
  installHandlers = installSocketHandlers,
  buildRoomResumeRequest
}) {
  const socket = ioClient(socketBase, { auth: { token } });
  installHandlers(socket, handlers, { buildRoomResumeRequest });
  return socket;
}
