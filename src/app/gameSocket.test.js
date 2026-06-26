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
    expect(ioClient).toHaveBeenCalledWith("http://localhost:5173", {
      auth: { token: "token-1" },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      timeout: 6000
    });
    expect(installHandlers).toHaveBeenCalledWith(socket, handlers, { buildRoomResumeRequest });
  });

  it("connects only after resume handlers are installed", () => {
    const callOrder = [];
    const socket = {
      connect: vi.fn(() => callOrder.push("connect"))
    };
    const ioClient = vi.fn(() => {
      callOrder.push("create");
      return socket;
    });
    const installHandlers = vi.fn(() => callOrder.push("install"));

    connectGameSocket({
      ioClient,
      socketBase: "http://localhost:5173",
      token: "token-1",
      handlers: {},
      installHandlers,
      buildRoomResumeRequest: vi.fn()
    });

    expect(callOrder).toEqual(["create", "install", "connect"]);
    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  it("queues an immediate room resume after connecting", () => {
    const socket = {
      connect: vi.fn(),
      emit: vi.fn()
    };
    const ioClient = vi.fn(() => socket);
    const installHandlers = vi.fn();
    const buildRoomResumeRequest = vi.fn(() => ({ roomCode: "12345" }));

    connectGameSocket({
      ioClient,
      socketBase: "http://localhost:5173",
      token: "token-1",
      handlers: {},
      installHandlers,
      buildRoomResumeRequest
    });

    expect(socket.connect).toHaveBeenCalledBefore(socket.emit);
    expect(socket.emit).toHaveBeenCalledWith("room:resume", { roomCode: "12345" });
  });
});
