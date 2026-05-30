import { describe, expect, it, vi } from "vitest";
import { connectGameSocket } from "./gameSocket.js";

describe("game socket connection", () => {
  it("creates a socket with token auth and installs handlers with resume support", () => {
    const socket = { id: "socket-1" };
    const ioClient = vi.fn(() => socket);
    const installHandlers = vi.fn();
    const handlers = { roomUpdate: vi.fn() };
    const buildRoomResumeRequest = vi.fn();

    const result = connectGameSocket({
      ioClient,
      socketBase: "http://localhost:5173",
      token: "token-1",
      handlers,
      installHandlers,
      buildRoomResumeRequest
    });

    expect(result).toBe(socket);
    expect(ioClient).toHaveBeenCalledWith("http://localhost:5173", { auth: { token: "token-1" } });
    expect(installHandlers).toHaveBeenCalledWith(socket, handlers, { buildRoomResumeRequest });
  });
});
