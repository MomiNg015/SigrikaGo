const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("C:/Users/Moming/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const SOURCE_PATH = "src/app/SigrikaCorruptionTransition.jsx";
const OUTPUT_DIR = "C:/Users/Moming/.codex/visualizations/2026/08/07/019fdb21-7245-7500-a4e6-ff14843fe6c6";
const CHROME_PATH = "C:/Program Files/Google/Chrome/Application/chrome.exe";

function readArray(source, name) {
  const match = source.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\n\\]);`));
  if (!match) throw new Error(`Missing ${name}`);
  return Function(`return ${match[1]}`)();
}

async function main() {
  const label = process.argv[2] || "current";
  const mobile = process.argv[3] === "mobile";
  const source = fs.readFileSync(SOURCE_PATH, "utf8");
  const slices = readArray(source, "TRANSITION_SLICES");
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    isMobile: mobile,
    hasTouch: mobile
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });

  await page.evaluate(({ slices }) => {
    document.querySelector(".sigrika-theme-transition")?.remove();
    let host = document.querySelector(".app-shell");
    if (!host) {
      host = document.createElement("main");
      host.className = "app-shell player-theme-enabled theme-bright-school";
      host.style.cssText = "position:fixed;inset:0;display:grid;place-items:center;background:var(--theme-bg,#e8edf0);overflow:hidden";
      host.innerHTML = '<section style="width:min(760px,80vw);height:58vh;background:var(--theme-panel-bg,#f5f0e5);border:3px solid var(--theme-border,#1d2730);box-shadow:12px 12px 0 rgba(18,28,38,.18);display:grid;place-items:center;color:var(--theme-text,#1d2730);font:700 32px system-ui">NORMAL INTERFACE</section>';
      document.body.append(host);
    }

    const root = document.createElement("div");
    root.className = "sigrika-theme-transition";
    root.dataset.direction = "enter";
    root.dataset.phase = "covering";
    root.setAttribute("aria-hidden", "true");
    root.style.setProperty("--sigrika-transition-cover-duration", "210ms");
    root.style.setProperty("--sigrika-transition-reveal-duration", "260ms");

    for (const className of ["veil", "pulse"]) {
      const child = document.createElement("span");
      child.className = `sigrika-theme-transition__${className}`;
      root.append(child);
    }

    const sliceRoot = document.createElement("span");
    sliceRoot.className = "sigrika-theme-transition__slices";
    slices.forEach((item, index) => {
      const child = document.createElement("span");
      child.className = "sigrika-theme-transition__slice";
      child.style.setProperty("--sigrika-transition-slice-height", item.height);
      child.style.setProperty("--sigrika-transition-slice-index", index);
      child.style.setProperty("--sigrika-transition-slice-origin", item.origin);
      child.style.setProperty("--sigrika-transition-slice-top", item.top);
      child.style.setProperty("--sigrika-transition-slice-travel", item.travel);
      sliceRoot.append(child);
    });
    root.append(sliceRoot);

    for (const modifier of ["upper", "lower"]) {
      const child = document.createElement("span");
      child.className = `sigrika-theme-transition__fault sigrika-theme-transition__fault--${modifier}`;
      root.append(child);
    }
    host.append(root);
  }, { slices });

  await page.waitForTimeout(100);
  const captures = [];
  for (const progress of [0.2, 0.38, 0.62, 0.78]) {
    await page.evaluate((value) => {
      const root = document.querySelector(".sigrika-theme-transition");
      for (const animation of root.getAnimations({ subtree: true })) {
        animation.pause();
        const duration = Number(animation.effect.getTiming().duration) || 1000;
        animation.currentTime = duration * value;
      }
    }, progress);
    const file = path.join(OUTPUT_DIR, `transition-${label}-${Math.round(progress * 100)}.png`);
    await page.screenshot({ path: file });
    const visibility = await page.evaluate(() => ({
      visibleFaults: [...document.querySelectorAll(".sigrika-theme-transition__fault")]
        .filter((element) => Number(getComputedStyle(element).opacity) > 0.15).length,
      visibleSlices: [...document.querySelectorAll(".sigrika-theme-transition__slice")]
        .filter((element) => Number(getComputedStyle(element).opacity) > 0.15).length
    }));
    captures.push({ file, progress, visibility });
  }

  console.log(JSON.stringify(captures, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
