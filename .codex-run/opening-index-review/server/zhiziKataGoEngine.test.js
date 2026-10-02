import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { COLORS, createGameState, playMove } from "../src/shared/game.js";
import { createZhiziKataGoEngine } from "./zhiziKataGoEngine.js";

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(payload)
  };
}

function enabledEnv(overrides = {}) {
  return {
    ZHIZI_ENABLED: "true",
    ZHIZI_ACCOUNT_PHONE: "13800000000",
    ZHIZI_ACCOUNT_PASSWORD: "test-only",
    ZHIZI_NPC_MIN_VISITS: "100",
    ZHIZI_AUDIT_MIN_VISITS: "50",
    ...overrides
  };
}

class FakeZhiziSocket extends EventEmitter {
  constructor({
    analysisLine = "info move K10 visits 120 winrate 0.62 scoreLead 1.1 prior 0.05 order 0 pv K10 D4 info move D10 visits 80 winrate 0.60 scoreLead 0.7 prior 0.12 order 1 pv D10 K4",
    disconnectOnCommand = ""
  } = {}) {
    super();
    this.analysisLine = analysisLine;
    this.disconnectOnCommand = disconnectOnCommand;
    this.stdin = [];
    this.disconnected = false;
    queueMicrotask(() => super.emit("ready"));
  }

  emit(event, ...args) {
    if (event !== "stdin") return super.emit(event, ...args);
    const command = String(args[0] ?? "").trim();
    this.stdin.push(command);
    const match = /^(\d+)\s+(.+)$/.exec(command);
    if (!match) return true;
    const id = Number(match[1]);
    const body = match[2];
    if (this.disconnectOnCommand && body.startsWith(this.disconnectOnCommand)) {
      this.disconnectOnCommand = "";
      queueMicrotask(() => super.emit("disconnect", "transport close"));
      return true;
    }
    if (body.startsWith("kata-analyze")) {
      queueMicrotask(() => super.emit("stdout", `=${id} ${this.analysisLine}\n`));
    } else if (body === "stop") {
      queueMicrotask(() => super.emit("stdout", `\n=${id}\n\n`));
    } else {
      queueMicrotask(() => super.emit("stdout", new TextEncoder().encode(`=${id}\n\n`)));
    }
    return true;
  }

  disconnect() {
    this.disconnected = true;
    super.emit("disconnect", "client disconnect");
  }
}

function successfulFetch() {
  return vi.fn(async (url, options) => {
    if (url.endsWith("/api/cluster/account/login")) {
      expect(JSON.parse(options.body)).toEqual({ phone: "13800000000", password: "test-only" });
      return jsonResponse({ token: "user-token" });
    }
    if (url.endsWith("/api/cluster/account/fetch-socketio-token")) {
      expect(options.headers.Authorization).toBe("Bearer user-token");
      expect(JSON.parse(options.body).args).toContain("--gpu-type vip-share");
      return jsonResponse({ token: "socket-token", socketIOURL: "https://socket.example/ikatago" });
    }
    throw new Error(`Unexpected URL: ${url}`);
  });
}

describe("Zhizi KataGo engine", () => {
  it("does not touch the network while disabled", async () => {
    const fetchImpl = vi.fn();
    const socketFactory = vi.fn();
    const engine = createZhiziKataGoEngine({ env: {}, fetchImpl, socketFactory });

    await expect(engine.search(createGameState(), COLORS.black)).resolves.toEqual({
      ok: false,
      reason: "disabled"
    });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(socketFactory).not.toHaveBeenCalled();
  });

  it("prewarms a ready VIP-share GTP session without starting analysis", async () => {
    const fetchImpl = successfulFetch();
    let socket = null;
    const socketFactory = vi.fn(() => {
      socket = new FakeZhiziSocket();
      return socket;
    });
    const engine = createZhiziKataGoEngine({
      env: enabledEnv(),
      fetchImpl,
      socketFactory
    });

    await expect(engine.ensureAvailable()).resolves.toEqual({
      ok: true,
      name: "Zhizi KataGo",
      mode: "vip-share"
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(socketFactory).toHaveBeenCalledTimes(1);
    expect(socket.stdin).toEqual([
      expect.stringMatching(/^\d+ kata-set-param maxTime 5$/)
    ]);
    expect(socket.stdin.some((command) => command.includes("kata-analyze"))).toBe(false);
    engine.close();
  });

  it("shares one in-flight session opening between prewarm and the first search", async () => {
    const fetchImpl = successfulFetch();
    const sockets = [];
    const socketFactory = vi.fn(() => {
      const socket = new FakeZhiziSocket();
      sockets.push(socket);
      return socket;
    });
    const engine = createZhiziKataGoEngine({
      env: enabledEnv(),
      fetchImpl,
      socketFactory
    });

    const [prewarm, search] = await Promise.all([
      engine.ensureAvailable(),
      engine.search(createGameState(), COLORS.black)
    ]);

    expect(prewarm).toMatchObject({ ok: true, mode: "vip-share" });
    expect(search).toMatchObject({ ok: true, action: { type: "move", pointId: "9,3" } });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(socketFactory).toHaveBeenCalledTimes(1);
    expect(sockets).toHaveLength(1);
    expect(sockets[0].stdin.filter((command) => command.includes("kata-set-param"))).toHaveLength(1);
    engine.close();
  });

  it("logs in, allocates VIP share, replays the board, and returns the Top-1 action", async () => {
    const fetchImpl = successfulFetch();
    let socket = null;
    const socketFactory = vi.fn(() => {
      socket = new FakeZhiziSocket();
      return socket;
    });
    const engine = createZhiziKataGoEngine({
      env: enabledEnv(),
      fetchImpl,
      socketFactory
    });
    let game = createGameState([
      { userId: "black", color: COLORS.black },
      { userId: "white", color: COLORS.white }
    ]);
    game.komi = 2.75;
    game = playMove(game, COLORS.black, "3,3").state;

    await expect(engine.search(game, COLORS.white)).resolves.toMatchObject({
      ok: true,
      action: { type: "move", pointId: "9,3" },
      engine: { name: "Zhizi KataGo", mode: "vip-share" },
      analysis: {
        candidates: [
          expect.objectContaining({ move: "K10", order: 0, prior: 0.05 }),
          expect.objectContaining({ move: "D10", order: 1 })
        ]
      }
    });

    expect(socketFactory).toHaveBeenCalledWith("https://socket.example/ikatago", expect.objectContaining({
      path: "/socket.io.v4",
      query: { "zz-socketio-token": "socket-token" },
      transports: ["websocket"],
      reconnection: false
    }));
    expect(socket.stdin).toEqual(expect.arrayContaining([
      expect.stringMatching(/^\d+ kata-set-param maxTime 5$/),
      expect.stringMatching(/^\d+ boardsize 13$/),
      expect.stringMatching(/^\d+ kata-set-rules chinese$/),
      expect.stringMatching(/^\d+ komi 5\.5$/),
      expect.stringMatching(/^\d+ clear_board$/),
      expect.stringMatching(/^\d+ play B D10$/),
      expect.stringMatching(/^\d+ kata-analyze W 10 rootInfo true$/),
      expect.stringMatching(/^\d+ stop$/)
    ]));
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    engine.close();
    expect(socket.disconnected).toBe(true);
  });

  it("stops at the cloud think-time limit and keeps the streamed Zhizi candidate", async () => {
    let socket = null;
    const engine = createZhiziKataGoEngine({
      env: enabledEnv({
        ZHIZI_NPC_MIN_VISITS: "1000",
        ZHIZI_SEARCH_TIMEOUT_MS: "1000"
      }),
      fetchImpl: successfulFetch(),
      socketFactory: () => {
        socket = new FakeZhiziSocket({
          analysisLine: "info move K10 visits 25 winrate 0.55 scoreLead 0.3 prior 0.05 order 0 pv K10"
        });
        return socket;
      },
      setTimer: (callback, delay) => setTimeout(callback, delay === 1_000 ? 0 : delay),
      clearTimer: clearTimeout
    });

    await expect(engine.search(createGameState(), COLORS.black)).resolves.toMatchObject({
      ok: true,
      action: { type: "move", pointId: "9,3" },
      analysis: {
        partial: true,
        candidates: [expect.objectContaining({ move: "K10", visits: 25 })]
      },
      engine: { name: "Zhizi KataGo", mode: "vip-share" }
    });
    expect(socket.stdin).toEqual(expect.arrayContaining([
      expect.stringMatching(/^\d+ kata-set-param maxTime 1$/),
      expect.stringMatching(/^\d+ stop$/)
    ]));
    engine.close();
  });

  it("does not start a second five-second search when the time limit yields no candidate", async () => {
    let allocations = 0;
    const fetchImpl = vi.fn(async (url, options) => {
      if (url.endsWith("/api/cluster/account/login")) {
        return jsonResponse({ token: "user-token" });
      }
      if (url.endsWith("/api/cluster/account/fetch-socketio-token")) {
        allocations += 1;
        expect(options.headers.Authorization).toBe("Bearer user-token");
        return jsonResponse({ token: "socket-token", socketIOURL: "https://socket.example/ikatago" });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    const engine = createZhiziKataGoEngine({
      env: enabledEnv({ ZHIZI_SEARCH_TIMEOUT_MS: "1000" }),
      fetchImpl,
      socketFactory: () => new FakeZhiziSocket({ analysisLine: "" }),
      setTimer: (callback, delay) => setTimeout(callback, delay === 1_000 ? 0 : delay),
      clearTimer: clearTimeout
    });

    await expect(engine.search(createGameState(), COLORS.black)).resolves.toEqual({
      ok: false,
      reason: "timeout"
    });
    expect(allocations).toBe(1);
    engine.close();
  });

  it("rejects concurrent analyses through the one-session slot", async () => {
    const fetchImpl = successfulFetch();
    let socket = null;
    const engine = createZhiziKataGoEngine({
      env: enabledEnv({ ZHIZI_SEARCH_TIMEOUT_MS: "1000" }),
      fetchImpl,
      socketFactory: () => {
        socket = new FakeZhiziSocket({ analysisLine: "" });
        return socket;
      }
    });
    const game = createGameState();

    const first = engine.analyze(game, COLORS.black);
    await vi.waitFor(() => expect(socket.stdin.some((command) => command.includes("kata-analyze"))).toBe(true));
    await expect(engine.analyze(game, COLORS.black)).resolves.toEqual({ ok: false, reason: "busy" });
    const analysisCommand = socket.stdin.find((command) => command.includes("kata-analyze"));
    const id = Number(analysisCommand.split(" ", 1)[0]);
    socket.analysisLine = "info move K10 visits 120 winrate 0.6 scoreLead 1 order 0 pv K10";
    socket.emit("stdout", `=${id} ${socket.analysisLine}\n`);

    await expect(first).resolves.toMatchObject({ ok: true });
    engine.close();
  });

  it("re-authenticates once when the cached bearer token is rejected", async () => {
    let logins = 0;
    let allocations = 0;
    const fetchImpl = vi.fn(async (url) => {
      if (url.endsWith("/login")) {
        logins += 1;
        return jsonResponse({ token: `user-token-${logins}` });
      }
      allocations += 1;
      return allocations === 1
        ? jsonResponse({ key: "not_authorized" }, 401)
        : jsonResponse({ token: "socket-token", socketIOURL: "https://socket.example/ikatago" });
    });
    const engine = createZhiziKataGoEngine({
      env: enabledEnv(),
      fetchImpl,
      socketFactory: () => new FakeZhiziSocket()
    });

    await expect(engine.analyze(createGameState(), COLORS.black)).resolves.toMatchObject({ ok: true });
    expect(logins).toBe(2);
    expect(allocations).toBe(2);
    engine.close();
  });

  it.each([
    ["authentication", "/login", 401],
    ["unavailable", "/fetch-socketio-token", 403]
  ])("maps rejected account/session access to %s without leaking the response", async (reason, rejectedPath, status) => {
    const fetchImpl = vi.fn(async (url) => {
      if (url.endsWith(rejectedPath)) return jsonResponse({ message: "remote secret detail" }, status);
      if (url.endsWith("/login")) return jsonResponse({ token: "user-token" });
      throw new Error(`Unexpected URL: ${url}`);
    });
    const socketFactory = vi.fn();
    const engine = createZhiziKataGoEngine({ env: enabledEnv(), fetchImpl, socketFactory });

    await expect(engine.analyze(createGameState(), COLORS.black)).resolves.toEqual({ ok: false, reason });
    expect(socketFactory).not.toHaveBeenCalled();
    engine.close();
  });

  it("allocates a fresh socket token and replays the whole position after disconnect", async () => {
    let allocations = 0;
    const fetchImpl = vi.fn(async (url) => {
      if (url.endsWith("/login")) return jsonResponse({ token: "user-token" });
      allocations += 1;
      return jsonResponse({ token: `socket-token-${allocations}`, socketIOURL: "https://socket.example/ikatago" });
    });
    const sockets = [];
    const engine = createZhiziKataGoEngine({
      env: enabledEnv(),
      fetchImpl,
      socketFactory: () => {
        const socket = new FakeZhiziSocket({
          disconnectOnCommand: sockets.length === 0 ? "boardsize" : ""
        });
        sockets.push(socket);
        return socket;
      }
    });
    let game = createGameState();
    game = playMove(game, COLORS.black, "3,3").state;

    await expect(engine.analyze(game, COLORS.white)).resolves.toMatchObject({ ok: true });

    expect(allocations).toBe(2);
    expect(sockets).toHaveLength(2);
    expect(sockets[1].stdin).toEqual(expect.arrayContaining([
      expect.stringMatching(/boardsize 13$/),
      expect.stringMatching(/play B D10$/),
      expect.stringMatching(/kata-analyze W/)
    ]));
    engine.close();
  });
});
