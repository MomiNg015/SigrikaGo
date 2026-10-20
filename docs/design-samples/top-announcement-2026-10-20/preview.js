import { LONG_NOTICE, SHORT_NOTICE } from "./samples.js";

const frames = [...document.querySelectorAll("iframe")];
const stage = document.querySelector(".preview-stage");
const editor = document.querySelector("#notice-text");
editor.value = LONG_NOTICE;
let variant = new URLSearchParams(location.search).get("variant") || "mint";
if (!["mint", "ribbon", "ink"].includes(variant)) variant = "mint";
let compare = new URLSearchParams(location.search).has("compare");
let savedText = LONG_NOTICE;

function broadcast() {
  frames.forEach((frame) => frame.contentWindow?.postMessage({ type: "announcement-preview", enabled: document.querySelector("#enabled").checked, text: savedText }, location.origin));
}
function renderSelection() {
  document.querySelectorAll("[data-variant]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.variant === variant)));
  document.querySelectorAll("[data-frame]").forEach((card) => { card.hidden = !compare && card.dataset.frame !== variant; });
  stage.classList.toggle("compare", compare);
  document.querySelector("#compare-view").setAttribute("aria-pressed", String(compare));
  document.querySelector("#focus-view").setAttribute("aria-pressed", String(!compare));
}
function count() { document.querySelector("#character-count").textContent = `${editor.value.length} / 500`; }
document.querySelectorAll("[data-variant]").forEach((button) => button.addEventListener("click", () => { variant = button.dataset.variant; compare = false; renderSelection(); }));
document.querySelector("#focus-view").addEventListener("click", () => { compare = false; renderSelection(); });
document.querySelector("#compare-view").addEventListener("click", () => { compare = true; renderSelection(); });
document.querySelectorAll("[data-width]").forEach((button) => button.addEventListener("click", () => {
  stage.dataset.width = button.dataset.width;
  document.querySelectorAll("[data-width]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
}));
document.querySelector("#enabled").addEventListener("change", (event) => {
  document.querySelector("#enabled-label").textContent = event.target.checked ? "公告已开启" : "公告已关闭";
  document.querySelector("#save-status").textContent = event.target.checked ? "公告已在本地预览中开启。" : "公告已在本地预览中关闭，不保留空白占位。";
  broadcast();
});
document.querySelector("#editor").addEventListener("submit", (event) => {
  event.preventDefault();
  savedText = editor.value.replace(/\s+/gu, " ").trim();
  broadcast();
  document.querySelector("#save-status").textContent = savedText ? "已应用到三版预览。仅在本页生效，刷新后恢复示例。" : "公告内容为空，已自动隐藏公告栏。";
});
document.querySelectorAll("[data-preset]").forEach((button) => button.addEventListener("click", () => {
  editor.value = button.dataset.preset === "short" ? SHORT_NOTICE : LONG_NOTICE;
  count(); document.querySelector("#editor").requestSubmit();
}));
editor.addEventListener("input", count);
frames.forEach((frame) => frame.addEventListener("load", broadcast));
window.addEventListener("message", (event) => {
  if (event.origin === location.origin && frames.some((frame) => frame.contentWindow === event.source) && event.data?.type === "announcement-ready") broadcast();
});
renderSelection(); count();
