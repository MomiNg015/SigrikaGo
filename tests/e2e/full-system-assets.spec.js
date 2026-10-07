import fs from "node:fs";
import ExcelJS from "exceljs";
import { expect } from "@playwright/test";
import { test, api, newPlayer, openTestDatabase, openHome } from "./full-system-helpers.js";

let db;
test.beforeAll(() => { db = openTestDatabase(); });
test.afterAll(async () => { await db?.$disconnect(); });

test("portrait uploads enforce permissions, MIME, size and serve the saved image", async ({ request, playwright, baseURL }) => {
  const admin = await newPlayer(request, db, { role: "admin" });
  const player = await newPlayer(request, db);
  const endpoint = "/api/admin/uploads/character-portrait";
  const buffer = fs.readFileSync("public/assets/preload/orange-mascot.png");
  const anonymous = await playwright.request.newContext({ baseURL });
  try {
    expect((await anonymous.post(endpoint, { multipart: { portrait: { name: "portrait.png", mimeType: "image/png", buffer } } })).status()).toBe(401);
  } finally { await anonymous.dispose(); }
  expect((await request.post(endpoint, { headers: { Authorization: `Bearer ${player.token}` },
    multipart: { portrait: { name: "portrait.png", mimeType: "image/png", buffer } } })).status()).toBe(403);
  const headers = { Authorization: `Bearer ${admin.token}` };
  const uploaded = await request.post(endpoint, { headers, multipart: { portrait: { name: "portrait.png", mimeType: "image/png", buffer } } });
  expect(uploaded.status(), await uploaded.text()).toBe(200);
  const { url } = await uploaded.json();
  const image = await anonymousImage(request, url);
  expect(image.headers()["content-type"]).toContain("image/png");
  expect(await image.body()).toEqual(buffer);
  for (const portrait of [
    { name: "wrong.jpg", mimeType: "image/jpeg", buffer },
    { name: "unsafe.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg></svg>") },
    { name: "fake.png", mimeType: "image/png", buffer: Buffer.from("not an image") }
  ]) expect((await request.post(endpoint, { headers, multipart: { portrait } })).status()).toBe(400);
  expect((await request.post(endpoint, { headers, multipart: { portrait: {
    name: "huge.png", mimeType: "image/png", buffer: Buffer.alloc(3 * 1024 * 1024 + 1)
  } } })).status()).toBe(413);
  expect((await request.post(endpoint, { headers, data: {} })).status()).toBe(400);
});

async function anonymousImage(request, url) {
  // Upload reads are public; using no Bearer also checks the static route.
  const response = await request.get(url);
  expect(response.status()).toBe(200);
  return response;
}

test("key images, fonts, audio and WASM support real binary reads and range requests", async ({ request }) => {
  for (const [url, mime] of [
    ["/assets/login-sigrika-mascot.webp", "image/webp"],
    ["/assets/preload/orange-mascot.png", "image/png"],
    ["/assets/music/godown_clear.ogg", "audio/"],
    ["/assets/voice/aemeath_match_start.ogg", "audio/"],
    ["/assets/fonts/WuWa-Lahai-Roi-Regular.ttf", "font/"],
    ["/assets/fonts/DottedSongtiCircleRegular.otf", "font/"],
    ["/engines/gnugo-3.8/gnugo.wasm", "application/wasm"]
  ]) {
    const head = await request.head(url);
    expect(head.status(), url).toBe(200);
    expect(head.headers()["content-type"], url).toContain(mime);
    expect(Number(head.headers()["content-length"]), url).toBeGreaterThan(64);
    const chunk = await request.get(url, { headers: { Range: "bytes=0-63" } });
    expect(chunk.status(), url).toBe(206);
    expect(chunk.headers()["content-range"], url).toMatch(/^bytes 0-63\//);
    expect((await chunk.body()).length, url).toBe(64);
  }
});

test("story Excel export/import stays local until draft save and preserves the published script", async ({ page, request }) => {
  test.setTimeout(90_000);
  const admin = await newPlayer(request, db, { role: "admin" });
  await openHome(page, admin);
  await page.getByRole("button", { name: "打开后台管理", exact: true }).click();
  const response = page.waitForResponse((entry) => new URL(entry.url()).pathname === "/api/admin/story-scripts");
  await page.locator(".admin-sidebar").getByRole("button", { name: "剧情教学", exact: true }).click();
  const original = (await (await response).json()).scripts.find((script) => script.key === "onboarding.default");
  expect(original).toBeTruthy();
  const card = page.locator(".admin-story-workbench-script-card").filter({ hasText: original.key });
  await card.locator(":scope > button").click();
  const pendingDownload = page.waitForEvent("download");
  await card.getByRole("button", { name: `导出 ${original.title} Excel`, exact: true }).click();
  const download = await pendingDownload;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(await download.path());
  expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
    "脚本信息", "草稿-节点", "草稿-选项", "草稿-棋盘动作", "发布版-节点", "发布版-选项", "发布版-棋盘动作", "原始JSON"
  ]);
  expect(workbook.getWorksheet("草稿-节点").rowCount).toBe(original.draft.nodes.length + 1);
  let writes = 0;
  page.on("request", (entry) => {
    if (entry.method() === "PATCH" && entry.url().includes("/api/admin/story-scripts/")) writes += 1;
  });
  await page.getByLabel("导入剧情教学 Excel").setInputFiles(await download.path());
  const summary = page.getByRole("region", { name: "Excel 导入变更摘要" });
  await expect(summary).toContainText("Excel 校验通过");
  await expect(summary).toContainText("未变化");
  await summary.getByRole("button", { name: "应用到草稿", exact: true }).click();
  const title = `Excel验收${Date.now()}`;
  workbook.getWorksheet("脚本信息").eachRow((row) => { if (row.getCell(1).value === "脚本标题") row.getCell(2).value = title; });
  const edited = test.info().outputPath("edited-story.xlsx");
  await workbook.xlsx.writeFile(edited);
  await page.getByLabel("导入剧情教学 Excel").setInputFiles(edited);
  await expect(summary).toContainText("Excel 校验通过");
  await summary.getByRole("button", { name: "应用到草稿", exact: true }).click();
  await expect(page.getByLabel("脚本标题", { exact: true })).toHaveValue(title);
  expect(writes).toBe(0);
  const saved = page.waitForResponse((entry) => entry.request().method() === "PATCH" && entry.url().includes("/api/admin/story-scripts/"));
  await page.getByRole("button", { name: "保存草稿", exact: true }).click();
  expect((await saved).status()).toBe(200);
  const persisted = (await api(request, admin, "GET", "/api/admin/story-scripts")).scripts.find((script) => script.key === original.key);
  expect(persisted.title).toBe(title);
  // Present blank Excel columns explicitly opt out of sprite selection;
  // legacy nodes with absent fields gain these defaults during import.
  expect(persisted.draft).toEqual({
    ...original.draft,
    nodes: original.draft.nodes.map((node) => ({ appearanceId: "", expressionId: "", ...node }))
  });
  expect(persisted.published).toEqual(original.published);
  await api(request, admin, "PATCH", `/api/admin/story-scripts/${original.key}`, {
    action: "save-draft", title: original.title, triggerType: original.triggerType,
    triggerParams: original.triggerParams, draft: original.draft
  });
});
