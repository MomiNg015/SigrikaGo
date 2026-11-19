const model = new URLSearchParams(location.search).get("model") === "amber" ? "amber" : "green";
const dialog = document.querySelector("dialog");
const tablet = document.querySelector(".tablet");
const display = document.querySelector(".display");
const bootLabel = document.querySelector("#boot-label");
const bootFill = document.querySelector(".boot-fill");
const studentId = document.querySelector("#student-id");
const openPlayer = document.querySelector("#open-player");
const power = document.querySelector("#power");
const sound = document.querySelector("#sound");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const timing = model === "green" ? { swing: 410, pause: 105 } : { swing: 485, pause: 145 };
let soundOn = true;
let audio;
let bootSound;
let bootTimer;
let loadingAnimation;
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
const playerRecords = [
  { rank: "三段", won: 57, lost: 36, drawn: 3, recent: "负胜和胜胜负胜负胜负" },
  { rank: "二段", won: 31, lost: 23, drawn: 1, recent: "胜负胜胜负胜负负胜胜" },
  { rank: "初段", won: 12, lost: 12, drawn: 0, recent: "负负胜胜胜负负胜负胜" },
];
const playerCharacterStats = [
  ["aemeath", "爱弥斯", 30, 14, 1],
  ["sigrika", "西格莉卡", 17, 13, 1],
  ["qiuyuan", "仇远", 10, 9, 1],
];
const openings = [
  [[2, 2], [6, 6], [2, 6], [6, 2], [4, 4], [3, 4], [4, 3], [3, 3]],
  [[4, 4], [5, 4], [4, 5], [4, 3], [3, 5], [5, 5]],
];
const characterTable = document.querySelector(".character-table");
const replayList = document.querySelector("#replay-list");
const replayBoard = document.querySelector("#replay-board");
const previousMove = document.querySelector("#previous-move");
const nextMove = document.querySelector("#next-move");
const back = document.querySelector("#back");
const screenTitle = document.querySelector("#screen-title");
const profileName = document.querySelector("#profile-name");
const profileAvatar = document.querySelector("#profile-avatar");
const modes = [...document.querySelectorAll("[data-mode]")];
const replayTrigger = document.querySelector("#jump-replays");
const pages = [...document.querySelectorAll("[data-page]")];
const reportField = document.querySelector("#report-field");
const reportText = document.querySelector("#report-text");
const confirmAction = document.querySelector("#confirm-action");
const actionStatus = document.querySelector("#action-status");
const blacklist = document.querySelector("#blacklist");
const profileActions = {
  achievements: { title: "成就", description: "已解锁 · 初次胜利、百局对弈" },
  customize: { title: "个性化", description: "预览用户名铭牌。", confirm: "切换铭牌" },
  blacklist: { title: "黑名单", description: "在样板中切换爱弥斯的黑名单状态。", confirm: "确认" },
  report: { title: "举报", description: "请填写举报原因。", confirm: "提交示例举报" },
};
let profileEntry = studentId;
let currentPage = "profile";
let activeMode = 0;
let activeAction;
let returnControl;
let returnScroll = 0;
let blacklisted = false;
let ownNameplate = false;
let replayButton;
let replayMoves = [];
let currentMove = 0;

function showPage(page, focus, scrollTop = 0) {
  currentPage = page;
  for (const view of pages) view.hidden = view.dataset.page !== page;
  const profileTitle = profileEntry === studentId ? "学生履历" : "玩家详细信息";
  const titles = { profile: profileTitle, replays: "对局记录", board: "棋谱片段", action: profileActions[activeAction]?.title };
  screenTitle.textContent = titles[page];
  back.hidden = page === "profile";
  back.textContent = page === "board" ? "‹ 对局记录" : `‹ ${profileEntry === studentId ? "履历" : "详细信息"}`;
  focus?.focus({ preventScroll: true });
  display.scrollTop = scrollTop;
}

function openSubpage(page, button) {
  returnControl = button;
  returnScroll = display.scrollTop;
  showPage(page, screenTitle);
}

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
  replayButton = undefined;
  document.querySelector("#replay-context").textContent = `${profileName.textContent} / ${modes[modeIndex].textContent}`;
  const otherNames = [profileEntry === studentId ? "爱弥斯" : "西格莉卡", "仇远", "长离", "莫宁"];
  const buttons = Array.from(recent.slice(-4)).reverse().map((result, index) => {
    const button = document.createElement("button");
    button.className = "replay-entry";
    button.type = "button";
    const opponent = document.createElement("span");
    opponent.textContent = `${profileName.textContent} 对 ${otherNames[index]}`;
    const badge = document.createElement("span");
    badge.dataset.result = result;
    badge.textContent = result;
    const action = document.createElement("span");
    action.textContent = "查看 ›";
    button.append(opponent, badge, action);
    button.addEventListener("click", () => {
      replayButton = button;
      replayMoves = openings[(index + modeIndex) % openings.length];
      currentMove = 0;
      document.querySelector("#replay-title").textContent = opponent.textContent;
      renderMove();
      showPage("board", screenTitle);
    });
    return button;
  });
  replayList.replaceChildren(...buttons);
}

function showRecord(index) {
  activeMode = index;
  const profileRecords = profileEntry === studentId ? records : playerRecords;
  const { rank, won, lost, drawn, recent } = profileRecords[index];
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
  for (const button of modes) {
    button.setAttribute("aria-pressed", Number(button.dataset.mode) === index);
  }
  characterTable.hidden = index !== 0;
  document.querySelector("#character-empty").hidden = index === 0;
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

function openTablet(event) {
  if (dialog.open) return;
  profileEntry = event.currentTarget;
  const own = profileEntry === studentId;
  const sourcePortrait = profileEntry.querySelector(own ? ".id-portrait" : "img");
  const origin = sourcePortrait.getBoundingClientRect();
  profileName.textContent = own ? "西格莉卡" : "爱弥斯";
  bootLabel.textContent = own ? "正在读取学生履历…" : "正在读取玩家详细信息…";
  profileName.classList.toggle("nameplate", own && ownNameplate);
  profileAvatar.src = sourcePortrait.src;
  document.querySelector("#own-actions").hidden = !own;
  document.querySelector("#player-actions").hidden = own;
  document.querySelector("#character-rows").replaceChildren(...(own ? characterStats : playerCharacterStats).map(makeCharacterRow));
  dialog.setAttribute("aria-label", own ? "学生履历" : "玩家详细信息");
  showRecord(0);
  showPage("profile");
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
  bootTimer = setTimeout(() => startLoading(animate), bootDelay);
}

function startLoading(animate) {
  tablet.dataset.phase = "loading";
  loadingAnimation = bootFill.animate(
    [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: animate ? "inset(0)" : "inset(0 100% 0 0)" }],
    { duration: 1500, easing: "steps(20, start)", fill: "forwards" },
  );
  loadingAnimation.finished.then(() => {
    tablet.dataset.phase = "on";
    display.inert = false;
  }, () => {
    // Closing the tablet cancels the pending reveal.
  });
}

function closeTablet() {
  clearTimeout(bootTimer);
  loadingAnimation?.cancel();
  entrance?.cancel();
  bootSound?.stop();
  bootSound = undefined;
  display.inert = true;
  tablet.dataset.phase = "off";
  dialog.close();
  profileEntry.focus();
}

studentId.addEventListener("click", openTablet);
openPlayer.addEventListener("click", openTablet);
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
for (const button of modes) {
  button.addEventListener("click", () => showRecord(Number(button.dataset.mode)));
}
replayTrigger.addEventListener("click", () => {
  const profileRecords = profileEntry === studentId ? records : playerRecords;
  showReplays(profileRecords[activeMode].recent, activeMode);
  openSubpage("replays", replayTrigger);
});
back.addEventListener("click", () => {
  if (currentPage === "board") {
    showPage("replays", replayButton);
    replayButton.scrollIntoView({ block: "nearest" });
    return;
  }
  showPage("profile", returnControl, returnScroll);
});
for (const button of document.querySelectorAll("[data-action]")) {
  button.addEventListener("click", () => {
    activeAction = button.dataset.action;
    const action = profileActions[activeAction];
    document.querySelector("#action-description").textContent = action.description;
    confirmAction.hidden = !action.confirm;
    confirmAction.textContent = action.confirm ?? "";
    reportField.hidden = activeAction !== "report";
    reportText.required = !reportField.hidden;
    reportText.value = "";
    actionStatus.textContent = "";
    openSubpage("action", button);
  });
}
document.querySelector("#action-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (activeAction === "report") actionStatus.textContent = "已记录示例举报";
  if (activeAction === "customize") {
    ownNameplate = profileName.classList.toggle("nameplate");
    actionStatus.textContent = ownNameplate ? "已启用铭牌" : "已恢复默认用户名";
  }
  if (activeAction === "blacklist") {
    blacklisted = !blacklisted;
    blacklist.textContent = blacklisted ? "移出黑名单" : "加入黑名单";
    actionStatus.textContent = blacklisted ? "已加入黑名单" : "已移出黑名单";
  }
});
document.querySelector("#like").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const liked = button.getAttribute("aria-pressed") === "false";
  button.setAttribute("aria-pressed", liked);
  button.querySelector(".number").textContent = liked ? "13" : "12";
});
document.querySelector("#friend").addEventListener("click", (event) => {
  event.currentTarget.textContent = "已申请";
  event.currentTarget.disabled = true;
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
