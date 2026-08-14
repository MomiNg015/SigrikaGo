import { chromium } from "playwright";

const baseUrl = "http://127.0.0.1:4187/.trellis/tasks/07-22-refine-aemeath-rainbow-move-effect/research/preview.html";
const outputDir = ".trellis/tasks/07-22-refine-aemeath-rainbow-move-effect/research";
const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe"
});

async function capture({ name, viewport, point = "6,6", reducedMotion = "no-preference", time = 220 }) {
  const context = await browser.newContext({ viewport, reducedMotion });
  const page = await context.newPage();
  await page.goto(`${baseUrl}?point=${encodeURIComponent(point)}`, { waitUntil: "networkidle" });
  if (reducedMotion !== "reduce") {
    await page.evaluate((currentTime) => {
      for (const animation of document.getAnimations()) {
        if (!animation.animationName?.startsWith("aemeath-rainbow")) continue;
        animation.pause();
        animation.currentTime = currentTime;
      }
    }, time);
  }
  const board = page.locator(".board-wrap");
  await board.screenshot({ path: `${outputDir}/${name}.png`, animations: "allow" });
  const metrics = await page.evaluate(() => {
    const boardRect = document.querySelector(".board-wrap").getBoundingClientRect();
    const effectRect = document.querySelector(".aemeath-rainbow-move").getBoundingClientRect();
    const stoneRect = document.querySelector(".point:has(.aemeath-rainbow-move) .stone").getBoundingClientRect();
    const coreRect = document.querySelector(".aemeath-rainbow-move__core").getBoundingClientRect();
    const center = (rect) => [rect.left + rect.width / 2, rect.top + rect.height / 2];
    const stoneCenter = center(stoneRect);
    const coreCenter = center(coreRect);
    const traceMetrics = [...document.querySelectorAll(".aemeath-rainbow-move__trace")].map((trace) => {
      const rect = trace.getBoundingClientRect();
      const style = getComputedStyle(trace);
      return {
        className: trace.className,
        rect: [Number(rect.width.toFixed(1)), Number(rect.height.toFixed(1))],
        width: style.width,
        maxWidth: style.maxWidth,
        opacity: style.opacity,
        transform: style.transform
      };
    });
    return {
      viewport: [window.innerWidth, window.innerHeight],
      board: [Math.round(boardRect.width), Math.round(boardRect.height)],
      effect: [Math.round(effectRect.width), Math.round(effectRect.height)],
      centerDelta: [
        Number((coreCenter[0] - stoneCenter[0]).toFixed(2)),
        Number((coreCenter[1] - stoneCenter[1]).toFixed(2))
      ],
      traces: traceMetrics,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  });
  console.log(name, JSON.stringify(metrics));
  await context.close();
}

await capture({ name: "desktop-peak", viewport: { width: 1440, height: 900 } });
await capture({ name: "desktop-late", viewport: { width: 1440, height: 900 }, time: 440 });
await capture({ name: "mobile-peak", viewport: { width: 390, height: 844 } });
await capture({ name: "mobile-corner-peak", viewport: { width: 390, height: 844 }, point: "0,0" });
await capture({ name: "mobile-reduced-motion", viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });

await browser.close();
