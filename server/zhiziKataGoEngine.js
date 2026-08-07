import { io as socketIoClient } from "socket.io-client";
import {
  resolveZhiziKataGoConfig,
  zhiziKataGoConfigErrors
} from "./zhiziKataGoConfig.js";
import {
  buildKataGoPositionCommands,
  decodeZhiziSocketPayload,
  kataCandidateToAction,
  parseKataAnalyzeLine
} from "./zhiziKataGoProtocol.js";

const ENGINE_NAME = "Zhizi KataGo";

export function createZhiziKataGoEngine({
  env = process.env,
  fetchImpl = globalThis.fetch,
  socketFactory = socketIoClient,
  setTimer = setTimeout,
  clearTimer = clearTimeout
} = {}) {
  const config = resolveZhiziKataGoConfig(env);
  const configErrors = zhiziKataGoConfigErrors(env);
  let userToken = null;
  let session = null;
  let sessionOpening = null;
  let sessionEpoch = 0;
  let activeRequest = null;
  let idleTimer = null;

  function isEnabled() {
    return config.enabled;
  }

  async function ensureAvailable() {
    if (!config.enabled) return { ok: false, reason: "disabled" };
    if (configErrors.length > 0) return { ok: false, reason: "configuration" };
    try {
      await currentSession();
      scheduleIdleClose();
      return { ok: true, name: ENGINE_NAME, mode: "vip-share" };
    } catch (error) {
      return { ok: false, reason: engineReason(error) };
    }
  }

  async function analyze(gameView, playerColor, { purpose = "audit" } = {}) {
    if (!config.enabled) return { ok: false, reason: "disabled" };
    if (configErrors.length > 0) return { ok: false, reason: "configuration" };
    if (activeRequest) return { ok: false, reason: "busy" };
    const position = buildKataGoPositionCommands(gameView);
    if (!position.ok) return position;

    const pending = analyzeWithRecovery(position, playerColor, purpose).finally(() => {
      if (activeRequest === pending) activeRequest = null;
    });
    activeRequest = pending;
    return pending;
  }

  async function search(gameView, botColor) {
    const result = await analyze(gameView, botColor, { purpose: "npc" });
    if (!result.ok) return result;
    const action = result.candidates
      .map((candidate) => kataCandidateToAction(candidate, result.size))
      .find(Boolean);
    if (!action) return { ok: false, reason: "invalid-result" };
    return {
      ok: true,
      action,
      analysis: result,
      engine: { name: ENGINE_NAME, mode: "vip-share" }
    };
  }

  async function analyzeWithRecovery(position, playerColor, purpose) {
    let lastError = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const activeSession = await currentSession();
        await activeSession.synchronize(position.commands);
        const result = await activeSession.analyze(playerColor, {
          minVisits: purpose === "npc" ? config.npcMinVisits : config.auditMinVisits,
          intervalCs: config.analysisIntervalCs,
          timeoutMs: config.searchTimeoutMs,
          maxCandidates: config.maxCandidates
        });
        scheduleIdleClose();
        return {
          ok: true,
          size: position.size,
          purpose,
          minVisits: purpose === "npc" ? config.npcMinVisits : config.auditMinVisits,
          ...result,
          engine: { name: ENGINE_NAME, mode: "vip-share" }
        };
      } catch (error) {
        lastError = error;
        closeSession();
        if (!retryableSessionError(error) || attempt > 0) break;
      }
    }
    return { ok: false, reason: engineReason(lastError) };
  }

  async function currentSession() {
    if (session?.isOpen()) return session;
    if (sessionOpening) return sessionOpening;

    const openingEpoch = sessionEpoch;
    const pending = openSession(openingEpoch).finally(() => {
      if (sessionOpening === pending) sessionOpening = null;
    });
    sessionOpening = pending;
    return pending;
  }

  async function openSession(openingEpoch) {
    const sessionToken = await fetchSessionToken();
    let nextSession = null;
    nextSession = await connectGtpSession({
      socketFactory,
      socketIOURL: sessionToken.socketIOURL,
      socketToken: sessionToken.token,
      connectTimeoutMs: config.connectTimeoutMs,
      commandTimeoutMs: config.commandTimeoutMs,
      setTimer,
      clearTimer,
      onClosed: () => {
        if (session === nextSession) session = null;
      }
    });
    try {
      await nextSession.setSearchTimeLimit(config.searchTimeoutMs);
      if (sessionEpoch !== openingEpoch) {
        throw engineError("connection", "Zhizi KataGo session was closed while opening");
      }
      session = nextSession;
      return nextSession;
    } catch (error) {
      nextSession.close();
      throw error;
    }
  }

  async function bearerToken(force = false) {
    if (userToken && !force) return userToken;
    const identifier = config.phone
      ? { phone: config.phone }
      : { email: config.email };
    const account = await requestJson("/api/cluster/account/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...identifier, password: config.password })
    });
    if (!account?.token) throw engineError("invalid-response", "Zhizi login response omitted its token");
    userToken = account.token;
    return userToken;
  }

  async function fetchSessionToken() {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const token = await bearerToken(attempt > 0);
      try {
        const result = await requestJson("/api/cluster/account/fetch-socketio-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ args: config.engineArgs })
        });
        if (!result?.token || !result?.socketIOURL) {
          throw engineError("invalid-response", "Zhizi session response omitted Socket.IO credentials");
        }
        return result;
      } catch (error) {
        if (error?.status !== 401 || attempt > 0) throw error;
        userToken = null;
      }
    }
    throw engineError("authentication", "Zhizi authentication failed");
  }

  async function requestJson(path, options) {
    const abortController = new AbortController();
    const timeout = setTimer(() => abortController.abort(), config.connectTimeoutMs);
    timeout?.unref?.();
    try {
      const response = await fetchImpl(`${config.baseUrl}${path}`, {
        ...options,
        signal: abortController.signal
      });
      const raw = await response.text();
      let payload = null;
      try {
        payload = raw ? JSON.parse(raw) : null;
      } catch {
        payload = null;
      }
      if (!response.ok) {
        const error = engineError(
          response.status === 401 ? "authentication" : "unavailable",
          `Zhizi request failed with HTTP ${response.status}`
        );
        error.status = response.status;
        error.remoteKey = safeRemoteKey(payload);
        throw error;
      }
      return payload;
    } catch (error) {
      if (error?.name === "AbortError") throw engineError("timeout", "Zhizi REST request timed out");
      throw error;
    } finally {
      clearTimer(timeout);
    }
  }

  function scheduleIdleClose() {
    if (idleTimer) clearTimer(idleTimer);
    idleTimer = setTimer(() => closeSession(), config.idleTimeoutMs);
    idleTimer?.unref?.();
  }

  function closeSession() {
    sessionEpoch += 1;
    if (idleTimer) clearTimer(idleTimer);
    idleTimer = null;
    const closing = session;
    session = null;
    sessionOpening = null;
    closing?.close();
  }

  function close() {
    closeSession();
    userToken = null;
  }

  return {
    analyze,
    close,
    ensureAvailable,
    isEnabled,
    search
  };
}

export const zhiziKataGoEngine = createZhiziKataGoEngine();

async function connectGtpSession({
  socketFactory,
  socketIOURL,
  socketToken,
  connectTimeoutMs,
  commandTimeoutMs,
  setTimer,
  clearTimer,
  onClosed
}) {
  const socket = socketFactory(socketIOURL, {
    path: "/socket.io.v4",
    query: { "zz-socketio-token": socketToken },
    transports: ["websocket"],
    reconnection: false,
    timeout: connectTimeoutMs
  });
  let open = true;
  let stdoutBuffer = "";
  let nextCommandId = 1;
  let currentResponse = null;
  let activeAnalysis = null;
  const responseWaiters = new Map();

  await new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimer(() => finish(engineError("timeout", "Zhizi KataGo ready timed out")), connectTimeoutMs);
    timeout?.unref?.();
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimer(timeout);
      error ? reject(error) : resolve();
    };
    socket.once("ready", () => finish());
    socket.once("connect_error", () => finish(engineError("connection", "Zhizi Socket.IO connection failed")));
    socket.once("disconnect", () => finish(engineError("connection", "Zhizi Socket.IO disconnected before ready")));
  }).catch((error) => {
    open = false;
    socket.disconnect();
    throw error;
  });

  socket.on("stdout", (payload) => {
    stdoutBuffer += decodeZhiziSocketPayload(payload);
    const lines = stdoutBuffer.split(/\r?\n/);
    stdoutBuffer = lines.pop() ?? "";
    for (const line of lines) processLine(line);
  });
  socket.on("disconnect", () => failSession(engineError("connection", "Zhizi Socket.IO disconnected")));
  socket.on("connect_error", () => failSession(engineError("connection", "Zhizi Socket.IO connection failed")));

  async function synchronize(commands) {
    for (const command of commands) await sendCommand(command);
  }

  function setSearchTimeLimit(timeoutMs) {
    return sendCommand(`kata-set-param maxTime ${formatSeconds(timeoutMs)}`);
  }

  function sendCommand(command, timeoutMs = commandTimeoutMs) {
    if (!open) return Promise.reject(engineError("connection", "Zhizi KataGo session is closed"));
    const id = nextCommandId++;
    return new Promise((resolve, reject) => {
      const timeout = setTimer(() => {
        responseWaiters.delete(id);
        reject(engineError("timeout", `Zhizi GTP command timed out: ${commandName(command)}`));
      }, timeoutMs);
      timeout?.unref?.();
      responseWaiters.set(id, {
        resolve: (response) => {
          clearTimer(timeout);
          resolve(response);
        },
        reject: (error) => {
          clearTimer(timeout);
          reject(error);
        }
      });
      socket.emit("stdin", `${id} ${command}\n`);
    });
  }

  function analyze(playerColor, {
    minVisits,
    intervalCs,
    timeoutMs,
    maxCandidates
  }) {
    if (!open) return Promise.reject(engineError("connection", "Zhizi KataGo session is closed"));
    if (activeAnalysis) return Promise.reject(engineError("busy", "Zhizi KataGo analysis is already active"));
    const id = nextCommandId++;
    return new Promise((resolve, reject) => {
      const timeout = setTimer(() => completeAnalysis(true), timeoutMs);
      timeout?.unref?.();
      activeAnalysis = {
        id,
        candidates: new Map(),
        rootInfo: null,
        minVisits,
        maxCandidates,
        timeout,
        resolve,
        reject,
        finishing: false
      };
      socket.emit("stdin", `${id} kata-analyze ${gtpColor(playerColor)} ${intervalCs} rootInfo true\n`);
    });
  }

  function processLine(line) {
    if (activeAnalysis && /\b(?:info\s+move|rootInfo)\b/.test(line)) {
      const update = parseKataAnalyzeLine(line);
      for (const candidate of update.candidates) {
        activeAnalysis.candidates.set(candidate.move.toUpperCase(), candidate);
      }
      if (update.rootInfo) activeAnalysis.rootInfo = update.rootInfo;
      const top = [...activeAnalysis.candidates.values()].find((candidate) => candidate.order === 0);
      const visits = activeAnalysis.rootInfo?.visits ?? top?.visits ?? 0;
      if (visits >= activeAnalysis.minVisits) void completeAnalysis(false);
    }

    if (line === "") {
      finishCurrentResponse();
      return;
    }
    const responseStart = /^([=?])\s*(\d+)?(?:\s+(.*))?$/.exec(line);
    if (responseStart) {
      finishCurrentResponse();
      currentResponse = {
        ok: responseStart[1] === "=",
        id: Number(responseStart[2]),
        lines: responseStart[3] ? [responseStart[3]] : []
      };
      return;
    }
    if (currentResponse) currentResponse.lines.push(line);
  }

  function finishCurrentResponse() {
    if (!currentResponse) return;
    const response = currentResponse;
    currentResponse = null;
    const waiter = responseWaiters.get(response.id);
    if (!waiter) return;
    responseWaiters.delete(response.id);
    if (!response.ok) {
      waiter.reject(engineError("gtp-error", `Zhizi GTP command failed with id ${response.id}`));
      return;
    }
    waiter.resolve(response.lines.join("\n").trim());
  }

  async function completeAnalysis(timedOut) {
    const analysis = activeAnalysis;
    if (!analysis || analysis.finishing) return;
    analysis.finishing = true;
    clearTimer(analysis.timeout);
    activeAnalysis = null;
    const candidates = [...analysis.candidates.values()]
      .sort((left, right) => left.order - right.order)
      .slice(0, analysis.maxCandidates);
    await sendCommand("stop", Math.min(commandTimeoutMs, 1_500)).catch(() => null);
    if (!candidates.length) {
      analysis.reject(engineError(
        timedOut ? "search-time-limit" : "invalid-response",
        "Zhizi KataGo returned no candidates"
      ));
      return;
    }
    analysis.resolve({
      candidates,
      rootInfo: analysis.rootInfo,
      partial: timedOut
    });
  }

  function failSession(error) {
    if (!open) return;
    open = false;
    const analysis = activeAnalysis;
    activeAnalysis = null;
    if (analysis) {
      clearTimer(analysis.timeout);
      analysis.reject(error);
    }
    for (const waiter of responseWaiters.values()) waiter.reject(error);
    responseWaiters.clear();
    onClosed();
  }

  function close() {
    if (!open) return;
    try {
      socket.emit("stdin", "stop\n");
    } catch {}
    failSession(engineError("connection", "Zhizi KataGo session closed"));
    socket.removeAllListeners();
    socket.disconnect();
  }

  return {
    analyze,
    close,
    isOpen: () => open,
    setSearchTimeLimit,
    synchronize
  };
}

function formatSeconds(milliseconds) {
  return String(Number((Number(milliseconds) / 1_000).toFixed(3)));
}

function gtpColor(color) {
  return color === "white" ? "W" : "B";
}

function commandName(command) {
  return String(command ?? "").trim().split(/\s+/, 1)[0] || "unknown";
}

function safeRemoteKey(payload) {
  const value = String(payload?.key ?? payload?.code ?? "").trim();
  return /^[a-z0-9_-]{1,80}$/i.test(value) ? value : "";
}

function retryableSessionError(error) {
  return ["connection", "timeout"].includes(error?.reason);
}

function engineReason(error) {
  if (error?.reason === "search-time-limit") return "timeout";
  if ([
    "authentication",
    "busy",
    "configuration",
    "connection",
    "disabled",
    "gtp-error",
    "invalid-response",
    "timeout",
    "unavailable",
    "unsupported-history"
  ].includes(error?.reason)) return error.reason;
  return "error";
}

function engineError(reason, message) {
  const error = new Error(message);
  error.reason = reason;
  return error;
}
