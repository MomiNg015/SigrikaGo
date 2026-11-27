import { describe, it, expect, vi } from "vitest";
import { onClientEvent } from "./socketClientEvent.js";

function player(handler) {
  const socket = { on: vi.fn(), emit: vi.fn() };
  onClientEvent(socket, "game:action", handler);
  return { receive: socket.on.mock.calls[0][1], feedback: socket.emit };
}

describe("client event isolation", () => {
  it("rejects invalid arguments before calling the game handler", async () => {
    const handler = vi.fn();
    const sender = player(handler);
    const ack = vi.fn();
    await sender.receive(null, ack);
    await sender.receive({}, {});
    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ code: "invalid_payload" }));
    expect(sender.feedback).toHaveBeenCalledTimes(1);
    expect(handler).not.toHaveBeenCalled();
  });

  it("preserves optional payloads and acknowledgements", async () => {
    const handle = vi.fn();
    const sender = player(handle);
    const ack = vi.fn();
    const payload = { roomCode: "12345" };
    await sender.receive();
    await sender.receive(ack);
    await sender.receive(payload, ack);
    expect(handle.mock.calls).toEqual([[undefined, undefined], [undefined, ack], [payload, ack]]);
    expect(sender.feedback).not.toHaveBeenCalled();
  });

  it.each([
    () => { throw new Error("game error"); },
    async () => { throw new Error("storage error"); }
  ])("isolates handler failures while another player can act", async (fail) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const sender = player(fail);
      const move = vi.fn();
      const other = player(move);
      await sender.receive({});
      await other.receive({ move: 1 });
      expect(sender.feedback).toHaveBeenCalledTimes(1);
      expect(other.feedback).not.toHaveBeenCalled();
      expect(move).toHaveBeenCalledWith({ move: 1 }, undefined);
    } finally {
      log.mockRestore();
    }
  });
});
