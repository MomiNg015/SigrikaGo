const model = new URLSearchParams(location.search).get("model") === "amber" ? "amber" : "green";
const dialog = document.querySelector("dialog");
const tablet = document.querySelector(".tablet");
const display = document.querySelector(".display");
const studentId = document.querySelector("#student-id");
const power = document.querySelector("#power");
const sound = document.querySelector("#sound");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const timing = model === "green" ? { swing: 410, pause: 105 } : { swing: 485, pause: 145 };
let soundOn = true;
let audio;
let bootSound;
let bootTimer;
let entrance;

document.body.dataset.model = model;
document.querySelector("#device-code").textContent = model === "green" ? "/ EDU–01" : "/ FIELD–02";
document.querySelector(`a[data-model="${model}"]`).setAttribute("aria-current", "page");

const records = [
  { rank: "四段", won: 76, lost: 48, drawn: 4, recent: "胜胜负胜和胜负胜负胜" },
  { rank: "三段", won: 43, lost: 36, drawn: 3, recent: "负胜胜负胜和负胜负胜" },
  { rank: "二段", won: 21, lost: 15, drawn: 0, recent: "胜负胜负胜胜负负胜胜" },
];

const characterStats = [
  ["sigrika", "西格莉卡", 39, 19, 2],
  ["aemeath", "爱弥斯", 22, 18, 1],
  ["qiuyuan", "仇远", 15, 11, 1],
];
const openings = [
  [[2, 2], [6, 6], [2, 6], [6, 2], [4, 4], [3, 4], [4, 3], [3, 3]],
  [[4, 4], [5, 4], [4, 5], [4, 3], [3, 5], [5, 5]],
];
const characterTable = document.querySelector(".character-table");
const replayList = document.querySelector("#replay-list");
const replayView = document.querySelector("#replay-view");
const replayBoard = document.querySelector("#replay-board");
const previousMove = document.querySelector("#previous-move");
const nextMove = document.querySelector("#next-move");
let replayButton;
let replayMoves = [];
let currentMove = 0;

function makeCharacterRow([id, name, wins, losses, draws]) {
  const row = document.createElement("tr");
  const character = document.createElement("th");
  character.scope = "row";
  const portrait = new Image(24, 24);
  portrait.src = `../../../public/assets/characters/handbook-chibi-sprites/${id}-avatar.webp`;
  portrait.alt = "";
  character.append(portrait, name);
  row.append(character);
  const total = wins + losses + draws;
  const values = [[total], [wins, "胜"], [losses, "负"], [draws, "和"], [`${(100 * wins / total).toFixed(1)}%`]];
  for (const [value, result] of values) {
    const cell = row.insertCell();
    cell.className = "number";
    cell.textContent = value;
    if (result) cell.dataset.result = result;
  }
  return row;
}

function renderMove() {
  const stones = replayMoves.slice(0, currentMove).map(([column, row], index) => {
    const stone = document.createElement("span");
    stone.className = index % 2 ? "white-stone" : "black-stone";
    stone.style.left = `${column * 12.5}%`;
    stone.style.top = `${row * 12.5}%`;
    return stone;
  });
  replayBoard.replaceChildren(...stones);
  replayBoard.setAttribute("aria-label", currentMove === 0 ? "初始棋盘" : `第 ${currentMove} 手后的棋盘`);
  document.querySelector("#move-count").textContent = `${currentMove} / ${replayMoves.length} 手`;
  previousMove.setAttribute("aria-disabled", currentMove === 0);
  nextMove.setAttribute("aria-disabled", currentMove === replayMoves.length);
}

function showReplays(recent, modeIndex) {
  replayView.hidden = true;
  replayButton = undefined;
  const buttons = Array.from(recent.slice(-2)).reverse().map((result, index) => {
    const button = document.createElement("button");
    button.className = "replay-entry";
    button.type = "button";
    button.setAttribute("aria-controls", "replay-view");
    button.setAttribute("aria-expanded", "false");
    const opponent = document.createElement("span");
    opponent.textContent = `西格莉卡 对 ${index === 0 ? "爱弥斯" : "仇远"}`;
    const badge = document.createElement("span");
    badge.dataset.result = result;
    badge.textContent = result;
    const action = document.createElement("span");
    action.textContent = "查看 ›";
    button.append(opponent, badge, action);
    button.addEventListener("click", () => {
      replayButton?.setAttribute("aria-expanded", "false");
      replayButton = button;
      button.setAttribute("aria-expanded", "true");
      replayMoves = openings[(index + modeIndex) % openings.length];
      currentMove = 0;
      replayView.hidden = false;
      renderMove();
      document.querySelector("#replay-title").focus();
    });
    return button;
  });
  replayList.replaceChildren(...buttons);
}

function showRecord(index) {
  const { rank, won, lost, drawn, recent } = records[index];
  const games = won + lost + drawn;
  const fields = { rank, won, lost, drawn, games, rate: `${(100 * won / games).toFixed(1)}%` };
  for (const [key, value] of Object.entries(fields)) {
    document.getElementById(key).textContent = value;
  }
  document.querySelector(".history").replaceChildren(...Array.from(recent, (result) => {
    const cell = document.createElement("span");
    cell.textContent = result;
    cell.dataset.result = result;
    return cell;
  }));
  for (const button of document.querySelectorAll("[data-mode]")) {
    button.setAttribute("aria-pressed", Number(button.dataset.mode) === index);
  }
  characterTable.hidden = index !== 0;
  document.querySelector("#character-empty").hidden = index === 0;
  showReplays(recent, index);
}

function cueBoot(delay) {
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!soundOn || !AudioEngine) return;
  audio ??= new AudioEngine();
  audio.resume().catch(() => {});
  const start = audio.currentTime + delay / 1000;
  const tone = audio.createOscillator();
  const volume = audio.createGain();
  const green = model === "green";
  tone.type = green ? "triangle" : "sine";
  tone.frequency.setValueAtTime(green ? 125 : 245, start);
  tone.frequency.exponentialRampToValueAtTime(green ? 880 : 620, start + 0.085);
  tone.frequency.exponentialRampToValueAtTime(green ? 510 : 930, start + 0.155);
  volume.gain.setValueAtTime(0.001, start);
  volume.gain.exponentialRampToValueAtTime(0.12, start + 0.035);
  volume.gain.exponentialRampToValueAtTime(0.001, start + 0.215);
  tone.connect(volume).connect(audio.destination);
  tone.start(start);
  tone.stop(start + 0.22);
  bootSound = tone;
  tone.onended = () => {
    if (bootSound === tone) bootSound = undefined;
    tone.disconnect();
    volume.disconnect();
  };
}

function openTablet() {
  if (dialog.open) return;
  const origin = document.querySelector(".id-portrait").getBoundingClientRect();
  showRecord(0);
  display.scrollTop = 0;
  tablet.dataset.phase = "off";
  dialog.showModal();
  const target = tablet.getBoundingClientRect();
  const x = origin.left + origin.width / 2 - target.left - target.width / 2;
  const y = origin.top + origin.height / 2 - target.top - target.height / 2;
  const animate = !reducedMotion.matches;
  const bootDelay = animate ? timing.swing + timing.pause : 80;
  cueBoot(bootDelay);
  if (animate) {
    entrance = tablet.animate([
      { transform: `translate(${x}px,${y}px) rotate(${model === "green" ? -24 : 27}deg) scale(.16)`, opacity: 0.35 },
      { transform: "translate(0,0) rotate(0) scale(1)", opacity: 1 },
    ], { duration: timing.swing, easing: "cubic-bezier(.19,.88,.27,1)" });
  }
  bootTimer = setTimeout(() => {
    if (!dialog.open) return;
    tablet.dataset.phase = "on";
    display.inert = false;
  }, bootDelay);
}

function closeTablet() {
  clearTimeout(bootTimer);
  entrance?.cancel();
  bootSound?.stop();
  bootSound = undefined;
  display.inert = true;
  tablet.dataset.phase = "off";
  dialog.close();
  studentId.focus();
}

studentId.addEventListener("click", openTablet);
power.addEventListener("click", closeTablet);
dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeTablet();
});
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeTablet();
});
sound.addEventListener("click", () => {
  soundOn = !soundOn;
  sound.setAttribute("aria-pressed", soundOn);
});
for (const button of document.querySelectorAll("[data-mode]")) {
  button.addEventListener("click", () => showRecord(Number(button.dataset.mode)));
}
document.querySelector("#character-rows").replaceChildren(...characterStats.map(makeCharacterRow));
document.querySelector("#jump-replays").addEventListener("click", () => {
  document.querySelector("#replay-heading").focus();
});
document.querySelector("#close-replay").addEventListener("click", () => {
  replayView.hidden = true;
  replayButton.setAttribute("aria-expanded", "false");
  replayButton.focus();
});
previousMove.addEventListener("click", () => {
  if (currentMove === 0) return;
  currentMove -= 1;
  renderMove();
});
nextMove.addEventListener("click", () => {
  if (currentMove === replayMoves.length) return;
  currentMove += 1;
  renderMove();
});
showRecord(0);
