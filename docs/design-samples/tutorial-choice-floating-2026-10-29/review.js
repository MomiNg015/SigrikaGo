const sizes = { phone: [390, 844], small: [360, 640], desktop: [1440, 900] };
const frame = document.querySelector("#scene");
const host = document.querySelector(".preview-host");
const wrapper = document.querySelector(".preview-frame");
let device = "phone";
let visible = true;
function fit() {
  const [width, height] = sizes[device];
  const availableHeight = Math.max(280, innerHeight - host.getBoundingClientRect().top - 54);
  const scale = Math.min(1, host.clientWidth / width, availableHeight / height);
  frame.style.width = `${width}px`; frame.style.height = `${height}px`;
  frame.style.transform = `scale(${scale})`;
  wrapper.style.width = `${width * scale}px`; wrapper.style.height = `${height * scale}px`;
  document.querySelector("#viewport-size").textContent = `${width} × ${height}`;
}
function send(action) { frame.contentWindow.postMessage({ source: "choice-review", action, scenario: document.querySelector("#scenario").value }, location.origin); }
document.querySelectorAll("[data-device]").forEach(button => button.addEventListener("click", () => {
  device = button.dataset.device;
  document.querySelectorAll("[data-device]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
  fit();
}));
function resetVisible() { visible = true; document.querySelector("#visibility").textContent = "隐藏选项"; document.querySelector("#visibility").setAttribute("aria-pressed", "true"); }
document.querySelector("#replay").addEventListener("click", () => { resetVisible(); send("replay"); });
document.querySelector("#scenario").addEventListener("change", () => { resetVisible(); send("scenario"); document.querySelector("#open-scene").href = `./scene.html?scenario=${document.querySelector("#scenario").value}`; });
document.querySelector("#visibility").addEventListener("click", event => { visible = !visible; event.currentTarget.textContent = visible ? "隐藏选项" : "显示选项"; event.currentTarget.setAttribute("aria-pressed", String(visible)); send(visible ? "show" : "hide"); });
frame.addEventListener("load", () => send("scenario"));
new ResizeObserver(fit).observe(host);
addEventListener("resize", fit);
fit();
