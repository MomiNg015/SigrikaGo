import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { expect, test as base } from "@playwright/test";
import { syncStructuredUserAssets } from "../../server/userAssets.js";

// The server honors this namespace only in stability mode. Each test retains
// the normal limiter while unrelated automated journeys do not share a quota.
export const test = base.extend({
  extraHTTPHeaders: async ({ baseURL }, provide) => {
    if (!baseURL) throw new Error("Full-system tests require an isolated base URL");
    await provide({ "x-stability-scope": `full-${randomUUID()}` });
  }
});

export function openTestDatabase() {
  const port = process.env.E2E_CLIENT_PORT ?? "5317";
  const run = String(process.env.PLAYWRIGHT_RUN_ID ?? "").replaceAll(/[^a-zA-Z0-9_-]/g, "-");
  const file = path.resolve(".tmp", "playwright", `e2e-${port}-${run}.db`);
  if (!run || !fs.existsSync(file)) throw new Error("Full-system tests require the isolated E2E runner database");
  return new PrismaClient({ datasources: { db: { url: `file:${file.replaceAll("\\", "/")}` } } });
}

export async function api(request, auth, method, url, data, status = 200) {
  const response = await request.fetch(url, {
    method, headers: auth ? { Authorization: `Bearer ${auth.token}` } : {},
    ...(data === undefined ? {} : { data })
  });
  expect(response.status(), `${method} ${url}: ${await response.text()}`).toBe(status);
  return response.json();
}

export async function newPlayer(request, db, data = {}) {
  const username = `fx${randomUUID().replaceAll("-", "").slice(0, 6)}`;
  const auth = await api(request, null, "POST", "/api/auth/register", { username, password: "pwpass12" });
  const user = await db.user.update({ where: { id: auth.user.id }, data: {
    coins: 2000, ownedCharacters: "sigrika,denia",
    ownedItems: JSON.stringify({ "campus-recruitment-poster": 2, "magic-clock": 2,
      "rainbow-bean-candy": 2, "aemeath-flight-snow-memorial-ticket": 1 }),
    ...data
  } });
  await syncStructuredUserAssets(db, user);
  const ledger = await db.userProgressLedger.aggregate({ where: { userId: user.id, metric: "coins" }, _sum: { delta: true } });
  return { ...auth, username, password: "pwpass12", initialCoinLedger: ledger._sum.delta ?? 0 };
}

export async function freshUser(request, auth) {
  return (await api(request, auth, "GET", "/api/me")).user;
}

export async function itemCount(db, auth, itemId) {
  return (await db.userItem.findUnique({ where: { userId_itemId: { userId: auth.user.id, itemId } } }))?.quantity ?? 0;
}

export async function skipGuides(request, auth) {
  await api(request, auth, "POST", "/api/onboarding-story/completed", {});
  await api(request, auth, "POST", "/api/home-onboarding/start", {});
  await api(request, auth, "POST", "/api/home-onboarding/finish", { outcome: "skipped" });
}

export async function openHome(page, auth) {
  await skipGuides(page.request, auth);
  const next = await api(page.request, null, "POST", "/api/auth/login", {
    username: auth.username, password: auth.password, forceLogin: true
  });
  auth.token = next.token;
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "部员手册", exact: true })).toBeVisible({ timeout: 45_000 });
}

export function emitAck(socket, event, payload) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`${event} ACK timeout`)), 8000);
    socket.emit(event, payload, (result) => { clearTimeout(timeout); resolve(result); });
  });
}

export async function coinDelta(db, auth, beforeId) {
  const entries = await db.userProgressLedger.findMany({ where: {
    userId: auth.user.id, metric: "coins", ...(beforeId ? { createdAt: { gte: beforeId } } : {})
  } });
  return entries.reduce((total, entry) => total + entry.delta, 0) - (auth.initialCoinLedger ?? 0);
}
