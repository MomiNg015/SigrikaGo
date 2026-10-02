import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const report = [];
try {
  const page = await browser.newPage();
  await page.route("**/api/leaderboard?*", (route) => route.fulfill({ json: { players: route.request().url().includes("capture-challenge") ? [
    { id: "b", username: "落子有声", rank: "5段", captures: 35, ranking: 1, recordCharacter: "sigrika" },
    { id: "a", username: "吃子挑战者", rank: "3段", captures: 28, ranking: 2, recordCharacter: "denia" },
    { id: "c", username: "同分选手", rank: "4段", captures: 28, ranking: 2, recordCharacter: "sigrika" },
    { id: "d", username: "刚刚开始", rank: "3段", captures: 0, ranking: 4, recordCharacter: "denia" }
  ] : [] } }));
  for (const [name, width, height] of [["desktop",1440,900],["phone",390,844]]) {
    await page.setViewportSize({ width, height });
    for (const kind of ["entry", "leaderboard", "result"]) {
      await page.goto(`http://127.0.0.1:5189/.codex-run/capture-challenge/preview.html?kind=${kind}`, { waitUntil: "domcontentloaded" });
      if (kind === "entry") await page.getByRole("button", { name: "准时宝陪练", exact: true }).click();
      if (kind === "leaderboard") {
        await page.getByRole("tab", { name: "吃子赛" }).click();
        await page.getByText("纪录角色", { exact: true }).waitFor({ state: "attached" });
        await page.getByText("刚刚开始", { exact: true }).waitFor();
      }
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `.codex-run/capture-challenge/${name}-${kind}.png`, fullPage: true, animations: "disabled" });
      report.push(await page.evaluate(({name,kind}) => {
        const target = document.querySelector(kind === "result" ? ".capture-challenge-breakthrough" : kind === "entry" ? '[aria-label="吃子挑战赛！"]' : ".capture-leaderboard .leaderboard-row");
        const box = target?.getBoundingClientRect();
        const css = target ? getComputedStyle(target) : null;
        return { name, kind, documentOverflow: document.documentElement.scrollWidth > innerWidth,
          targetBox: box?.toJSON(), color: css?.color, columns: css?.gridTemplateColumns };
      }, {name,kind}));
    }
  }
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
