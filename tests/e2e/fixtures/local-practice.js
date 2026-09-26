import { io } from "socket.io-client";
import { practiceEngineClient } from "../../../src/practice/practiceEngineClient.js";
import { LOCAL_PRACTICE_VERSION } from "../../../src/shared/localPractice.js";
import { installLocalPracticeController } from "../../../src/practice/localPracticeController.js";
import { legalPracticeGtpVertices, gtpVertexToPointId } from "../../../src/shared/practiceBotPosition.js";

const status = document.getElementById("status");
let room = null;
let socket;
const errors = [];
function receiveRoom(next) {
  room = next;
  sessionStorage.setItem("practice-room", room.code);
  status.textContent = JSON.stringify({ code: room.code, phase: room.game.phase, move: room.game.moveNumber });
  if (room.game.phase === "preloading") socket.emit("room:preload-ready", { roomCode: room.code });
}
async function connect(token) {
  sessionStorage.setItem("practice-token", token);
  socket = io({ auth: { token }, transports: ["websocket"] });
  socket.on("match:found", receiveRoom);
  socket.on("room:update", receiveRoom);
  socket.on("error:toast", (error) => errors.push(error));
  socket.on("connect", () => {
    const code = sessionStorage.getItem("practice-room");
    if (code) socket.emit("room:resume", { roomCode: code });
  });
  installLocalPracticeController(socket, { getRoom: () => room, showToast: (text) => errors.push(text) });
  await new Promise((resolve, reject) => { socket.once("connect", resolve); socket.once("connect_error", reject); });
}
window.practiceTest = {
  connect, errors, get room() { return room; },
  // Keep the integration fixture focused on the real Worker/socket boundary.
  // The application transition (cancel/readiness/error UI) has its own unit tests.
  start: async (options) => {
    try {
      await practiceEngineClient.ensureReady(options.difficulty);
      const ack = await new Promise((resolve) => socket.emit("practice:start", {
        ...options, engineVersion: LOCAL_PRACTICE_VERSION
      }, resolve));
      if (!ack.ok) errors.push(ack.error ?? ack.code);
    } catch (error) { errors.push(error.message); }
  },
  move: () => new Promise((resolve) => {
    const vertex = legalPracticeGtpVertices(room.game, room.practice.humanColor)[0];
    socket.emit("game:action", { roomCode: room.code, action: vertex
      ? { type: "move", pointId: gtpVertexToPointId(vertex, room.game.size) } : { type: "pass" } }, resolve);
  })
};
const token = sessionStorage.getItem("practice-token");
if (token) void connect(token);
status.textContent = "ready";
