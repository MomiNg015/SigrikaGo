const variants = {
  focus: { name: "A / 收拢聚焦", description: "四个墨色角标反复向内收拢，两次聚焦后稍作停顿。目标本身保持稳定。" },
  halo: { name: "B / 扩散光圈", description: "两道暖黄色光圈从目标边缘向外扩散。亮色轮廓更醒目，适合按钮和棋盘区域。" },
  hand: { name: "C / 手绘点按", description: "纸白色手指反复靠近目标，轻点时出现三根短线。指尖对准点击位置，手机上也能看清。" }
};
const sizes = { phone: [390, 844], small: [320, 568], desktop: [1440, 900] };
const frame = document.querySelector("#scene");
const host = document.querySelector(".preview-host");
const wrapper = document.querySelector(".preview-frame");
let variant = "focus", device = "phone", paused = false;
function fit() {
  const [width, height] = sizes[device];
  const availableHeight = innerWidth > 760 ? Math.max(360, innerHeight - host.getBoundingClientRect().top - 60) : innerHeight * 0.85;
  const scale = Math.min(1, (host.clientWidth - 12) / width, availableHeight / height);
  frame.style.width = `${width}px`; frame.style.height = `${height}px`; frame.style.transform = `scale(${scale})`;
  wrapper.style.width = `${width * scale}px`; wrapper.style.height = `${height * scale}px`;
  document.querySelector("#viewport-size").textContent = `${width} × ${height}`;
}
function send(action = "settings") {
  const target = document.querySelector("#target").value;
  frame.contentWindow.postMessage({ source: "action-cue-review", action, variant, target, paused }, location.origin);
  document.querySelector("#open-scene").href = `./scene.html?variant=${variant}&target=${target}`;
}
document.querySelectorAll("[data-variant]").forEach(button => button.addEventListener("click", () => {
  variant = button.dataset.variant;
  document.querySelectorAll("[data-variant]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
  document.querySelector("#variant-name").textContent = variants[variant].name;
  document.querySelector("#description").textContent = variants[variant].description;
  send();
}));
document.querySelectorAll("[data-device]").forEach(button => button.addEventListener("click", () => {
  device = button.dataset.device;
  document.querySelectorAll("[data-device]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
  fit();
}));
document.querySelector("#target").addEventListener("change", () => send("replay"));
document.querySelector("#replay").addEventListener("click", () => send("replay"));
document.querySelector("#pause").addEventListener("click", event => {
  paused = !paused;
  event.currentTarget.textContent = paused ? "播放动效" : "暂停动效";
  event.currentTarget.setAttribute("aria-pressed", String(paused)); send();
});
addEventListener("message", event => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.source !== "action-cue-scene") return;
  document.querySelector("#progress").textContent = event.data.message;
});
frame.addEventListener("load", () => send());
new ResizeObserver(fit).observe(host);
addEventListener("resize", fit);
fit();
