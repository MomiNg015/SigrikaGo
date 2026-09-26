import { isLocalPractice, LOCAL_PRACTICE_VERSION } from "../shared/localPractice.js";
import { practiceDifficulty } from "../shared/practiceMode.js";
import { practiceEngineClient } from "./practiceEngineClient.js";

export function installLocalPracticeController(socket, {
  getRoom, showToast = () => {}, engine = practiceEngineClient,
  page = globalThis.document, setTimer = setTimeout, clearTimer = clearTimeout,
  setLoop = setInterval, clearLoop = clearInterval
}) {
  let disposed = false;
  let generation = 0;
  let roomCode = "";
  let computing = null;
  let requesting = false;
  let blocked = false;
  const timers = new Map();

  function pause(closeEngine = true) {
    generation += 1;
    computing = null;
    if (closeEngine) engine.close();
    for (const [timer, resolve] of timers) { clearTimer(timer); resolve(null); }
    timers.clear();
  }

  function acknowledge(event, payload) {
    return new Promise((resolve) => {
      const timer = setTimer(() => { timers.delete(timer); resolve(null); }, 5000);
      timers.set(timer, resolve);
      socket.emit(event, payload, (result) => {
        if (!timers.has(timer)) return;
        clearTimer(timer);
        timers.delete(timer);
        resolve(result);
      });
    });
  }

  function sleep(ms) {
    return new Promise((resolve) => {
      const timer = setTimer(() => { timers.delete(timer); resolve(); }, ms);
      timers.set(timer, resolve);
    });
  }

  const active = (epoch) => !disposed && epoch === generation && socket.connected !== false && page?.visibilityState !== "hidden";

  async function calculate(job) {
    const epoch = generation;
    computing = job.id;
    try {
      let action;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          await engine.ensureReady(job.difficulty);
          if (!active(epoch)) return;
          action = await engine.search(job);
          break;
        } catch (error) {
          if (!active(epoch)) return;
          engine.close();
          if (attempt === 1) throw error;
        }
      }
      if (!active(epoch)) return;
      await sleep(practiceDifficulty(job.difficulty).delayMs[0]);
      const payload = { roomCode: job.roomCode, jobId: job.id, positionVersion: job.positionVersion,
        action: action.type === "pass" ? { type: "pass" } : { type: "move", pointId: action.pointId } };
      // Lost ACKs retry the same job, never perform an extra move/search.
      for (let attempt = 0; attempt < 3 && active(epoch); attempt += 1) {
        const result = await acknowledge("practice:computed", payload);
        if (result?.ok || result?.code === "local_practice_stale") return;
        if (result && result.code !== "local_practice_wait") throw new Error("result_rejected");
        await sleep(500);
      }
    } catch {
      if (active(epoch)) {
        blocked = true;
        engine.close();
        showToast("本机陪练计算失败，已暂停。请刷新页面重试，或结束本局。", "warning");
      }
    } finally {
      if (generation === epoch && computing === job.id) computing = null;
    }
  }

  async function tick() {
    if (disposed || socket.connected === false || page?.visibilityState === "hidden") return;
    const room = getRoom();
    const nextCode = isLocalPractice(room) && room.role === "player" && room.game?.phase !== "finished" ? room.code : "";
    if (nextCode !== roomCode) { pause(Boolean(roomCode || computing)); roomCode = nextCode; blocked = false; }
    if (!roomCode || requesting || blocked) return;
    requesting = true;
    const epoch = generation;
    try {
      const response = await acknowledge("practice:compute", { roomCode, version: LOCAL_PRACTICE_VERSION });
      if (!active(epoch)) return;
      if (response?.code === "local_practice_version") {
        blocked = true;
        showToast("陪练引擎已更新，请刷新页面继续本局。", "warning");
      }
      if (response?.ok && !response.job && computing) pause();
      if (response?.job && !computing) void calculate(response.job);
    } finally {
      requesting = false;
    }
  }

  function onVisibility() {
    if (page?.visibilityState === "hidden" && roomCode && socket.connected !== false) {
      socket.emit("practice:compute", { roomCode, version: LOCAL_PRACTICE_VERSION, active: false });
    }
    pause();
    blocked = false;
    void tick();
  }
  const onDisconnect = () => pause();
  const onConnect = () => { blocked = false; void tick(); };
  page?.addEventListener("visibilitychange", onVisibility);
  socket.on("disconnect", onDisconnect);
  socket.on("connect", onConnect);
  const interval = setLoop(() => void tick(), 1500);
  void tick();
  return () => {
    disposed = true;
    pause();
    clearLoop(interval);
    page?.removeEventListener("visibilitychange", onVisibility);
    socket.off("disconnect", onDisconnect);
    socket.off("connect", onConnect);
  };
}
