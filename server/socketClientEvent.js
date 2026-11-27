export function onClientEvent(socket, event, handler) {
  socket.on(event, async (...args) => {
    const acknowledge = typeof args.at(-1) === "function" ? args.pop() : undefined;
    if (args.length === 2 && args[1] === undefined) args.pop();
    const [payload] = args;
    function reject(code, error) {
      if (acknowledge) acknowledge({ ok: false, code, error });
      else socket.emit("error:toast", error);
    }
    if (args.length > 1 || (payload !== undefined && (payload === null || typeof payload !== "object"
      || Array.isArray(payload) || ArrayBuffer.isView(payload) || payload instanceof ArrayBuffer))) {
      reject("invalid_payload", "操作格式有误，请重试");
      return;
    }
    try {
      await handler(payload, acknowledge);
    } catch (error) {
      console.error("Socket event failed", event, error);
      reject("socket_event_failed", "操作未完成，请刷新确认当前状态");
    }
  });
}
