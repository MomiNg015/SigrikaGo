import { preloadSiteEntry } from "./siteEntryPreload.js";

// This shell exists in the initial HTML, before React or application assets are ready.
export async function startSiteEntry({
  root,
  loadApplication,
  mountApplication,
  preload = preloadSiteEntry,
  reload = () => window.location.reload()
}) {
  const progress = root.querySelector('[role="progressbar"]');
  const fill = root.querySelector("[data-entry-fill]");
  const percent = root.querySelector("[data-entry-percent]");
  const status = root.querySelector("[data-entry-status]");
  const retry = root.querySelector("[data-entry-retry]");
  const update = (value) => {
    const next = Math.round(Math.max(0, Math.min(1, value)) * 100);
    progress?.setAttribute("aria-valuenow", String(next));
    if (fill) fill.style.transform = `scaleX(${next / 100})`;
    if (percent) percent.textContent = `${next}%`;
  };
  try {
    const [application, data] = await Promise.all([
      loadApplication(),
      preload({ onProgress: (value) => update(value * 0.95) })
    ]);
    update(1);
    mountApplication(application, data);
    return true;
  } catch {
    if (status) {
      status.textContent = "页面加载失败，请刷新重试";
      status.setAttribute("role", "alert");
      status.hidden = false;
    }
    if (retry) {
      retry.hidden = false;
      retry.addEventListener("click", reload, { once: true });
    }
    return false;
  }
}
