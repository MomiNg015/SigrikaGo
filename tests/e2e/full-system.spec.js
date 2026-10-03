import { expect } from "@playwright/test";
import { DEFAULT_RECRUITMENT_CONFIG } from "../../src/shared/recruitment.js";
import { connectSocket, waitForSocketEvent } from "../stability/helpers.js";
import { test, api, newPlayer, openTestDatabase, freshUser, itemCount, coinDelta } from "./full-system-helpers.js";

let db;
let admin;
test.beforeAll(async ({ request }) => {
  db = openTestDatabase();
  admin = await newPlayer(request, db, { role: "admin" });
});
test.afterAll(async () => { await db?.$disconnect(); });

test("private APIs and admin writes enforce anonymous/player permissions", async ({ playwright, request }) => {
  const anonymous = await playwright.request.newContext({ baseURL: process.env.E2E_CLIENT_PORT
    ? `http://127.0.0.1:${process.env.E2E_CLIENT_PORT}` : "http://127.0.0.1:5317" });
  try {
    for (const url of ["/api/me", "/api/items/inventory", "/api/mailbox", "/api/social", "/api/replays"])
      await api(anonymous, null, "GET", url, undefined, 401);
  } finally { await anonymous.dispose(); }
  const player = await newPlayer(request, db);
  await api(request, player, "GET", "/api/admin/users", undefined, 403);
  await api(request, player, "POST", "/api/admin/gacha-pools", {}, 403);
  expect((await api(request, admin, "GET", "/api/admin/users")).users.length).toBeGreaterThan(0);
});

test("character purchase, selection, candy and inventory persist without duplicate charges", async ({ request }) => {
  const player = await newPlayer(request, db);
  const item = await db.shopItem.create({ data: {
    name: "全量角色", category: "character", targetId: "aemeath", priceCoins: 25
  } });
  await api(request, player, "POST", `/api/shop/${item.id}/purchase`, {});
  expect((await freshUser(request, player)).coins).toBe(1975);
  expect(await db.userCharacter.count({ where: { userId: player.user.id, characterSlug: "aemeath" } })).toBe(1);
  await api(request, player, "POST", "/api/me/character", { characterId: "aemeath" });
  expect((await freshUser(request, player)).selectedCharacter).toBe("aemeath");
  const duplicate = await request.post(`/api/shop/${item.id}/purchase`, { headers: { Authorization: `Bearer ${player.token}` }, data: {} });
  expect([400, 409]).toContain(duplicate.status());
  expect((await freshUser(request, player)).coins).toBe(1975);
  const candy = await api(request, player, "POST", "/api/items/rainbow-bean-candy/use", { characterId: "sigrika" });
  expect(candy.itemUseOutcome).toBe("accepted");
  expect(candy.user.itemEffects.sigrikaCandyDisabled).toBe(true);
  expect(await itemCount(db, player, "rainbow-bean-candy")).toBe(1);
  const inventory = await api(request, player, "GET", "/api/items/inventory");
  expect(JSON.stringify(inventory)).toContain("rainbow-bean-candy");
});

test("concurrent purchases respect each user item quota without double charge", async ({ request }) => {
  const player = await newPlayer(request, db);
  const item = await db.shopItem.create({ data: {
    name: "全量限量道具", category: "item", targetId: "campus-recruitment-poster", priceCoins: 25, stockQuantity: 1
  } });
  const before = await itemCount(db, player, item.targetId);
  const results = await Promise.all([1, 2].map(() => request.post(`/api/shop/${item.id}/purchase`, {
    headers: { Authorization: `Bearer ${player.token}` }, data: {}
  })));
  expect(results.filter((response) => response.status() === 200)).toHaveLength(1);
  expect(results.every((response) => [200, 400, 409].includes(response.status()))).toBe(true);
  expect((await freshUser(request, player)).coins).toBe(1975);
  expect(await itemCount(db, player, item.targetId)).toBe(before + 1);
  expect((await api(request, player, "GET", "/api/shop")).items.find((entry) => entry.id === item.id).remainingStock).toBe(0);
  expect(await coinDelta(db, player)).toBe(-25);
});

test("single/ten draws and concurrent insufficient-balance draws keep wallet, rewards and history consistent", async ({ request }) => {
  const pool = await db.gachaPool.create({ data: {
    name: "全量确定性奖池", permanent: true, singleDrawPrice: 50, tenDrawPrice: 500,
    prizes: { create: [{ type: "item", targetId: "campus-recruitment-poster", quantity: 1,
      probabilityBasisPoints: 10000, name: "贴报" }] }
  } });
  const player = await newPlayer(request, db);
  const before = await itemCount(db, player, "campus-recruitment-poster");
  for (const count of [1, 10]) await api(request, player, "POST", `/api/gacha/pools/${pool.id}/draw`, { count });
  expect((await freshUser(request, player)).coins).toBe(1450);
  expect(await itemCount(db, player, "campus-recruitment-poster")).toBe(before + 11);
  expect(await db.gachaDraw.count({ where: { userId: player.user.id } })).toBe(2);
  expect(await db.gachaDrawReward.count({ where: { draw: { userId: player.user.id } } })).toBe(11);
  expect(await coinDelta(db, player)).toBe(-550);
  expect(JSON.stringify(await api(request, player, "GET", "/api/gacha/history"))).toContain(pool.name);
  const poor = await newPlayer(request, db, { coins: 50 });
  const poorBefore = await itemCount(db, poor, "campus-recruitment-poster");
  const results = await Promise.all([1, 2].map(() => request.post(`/api/gacha/pools/${pool.id}/draw`, {
    headers: { Authorization: `Bearer ${poor.token}` }, data: { count: 1 }
  })));
  expect(results.filter((response) => response.status() === 200)).toHaveLength(1);
  expect(results.every((response) => [200, 400, 409].includes(response.status()))).toBe(true);
  expect((await freshUser(request, poor)).coins).toBe(0);
  expect(await itemCount(db, poor, "campus-recruitment-poster")).toBe(poorBefore + 1);
  expect(await db.gachaDraw.count({ where: { userId: poor.user.id } })).toBe(1);
  expect(await coinDelta(db, poor)).toBe(-50);
});

test("timed recruitment, fast-forward and fixed-ticket claims persist once and unlock selection", async ({ request }) => {
  test.setTimeout(45_000);
  await api(request, admin, "PATCH", "/api/admin/recruitment-config", {
    ...DEFAULT_RECRUITMENT_CONFIG, durationMs: 30000, successRates: [100, 100, 100]
  });
  const player = await newPlayer(request, db);
  await api(request, player, "POST", "/api/recruitment/start", { itemType: "campus-recruitment-poster" });
  await api(request, player, "POST", "/api/recruitment/claim", {}, 400);
  await api(request, player, "POST", "/api/recruitment/fast-forward", { itemType: "magic-clock" });
  await expect.poll(async () => {
    const { task } = await api(request, player, "GET", "/api/recruitment");
    return new Date(task.readyAt).getTime() <= Date.now();
  }, { timeout: 12_000 }).toBe(true);
  const { task } = await api(request, player, "POST", "/api/recruitment/claim", {});
  expect(task.result.type).toBe("success");
  const recruited = task.result.characterId;
  expect(recruited).toBeTruthy();
  await api(request, player, "POST", "/api/me/character", { characterId: recruited });
  await api(request, player, "POST", "/api/recruitment/claim", {}, 404);
  expect(await itemCount(db, player, "campus-recruitment-poster")).toBe(1);
  expect(await itemCount(db, player, "magic-clock")).toBe(1);
  const fixed = await newPlayer(request, db);
  await api(request, fixed, "POST", "/api/recruitment/start", { itemType: "aemeath-flight-snow-memorial-ticket" });
  await api(request, fixed, "POST", "/api/recruitment/interrupt-cinematic", {});
  await api(request, fixed, "POST", "/api/recruitment/claim", {});
  expect(await db.userCharacter.count({ where: { userId: fixed.user.id, characterSlug: "aemeath" } })).toBe(1);
});

test("admin mail attachments cannot be stolen, deleted before claim or awarded twice", async ({ request }) => {
  const player = await newPlayer(request, db);
  const other = await newPlayer(request, db);
  const title = `full-mail-${Date.now()}`;
  await api(request, admin, "POST", "/api/admin/mailbox/batches", {
    targetMode: "user", recipientUserId: player.user.id, sender: "全量测试", title, body: "金币附件",
    attachmentType: "coins", attachmentQuantity: 37
  });
  const { messages } = await api(request, player, "GET", "/api/mailbox");
  const message = messages.find((entry) => entry.title === title);
  expect(message).toBeTruthy();
  for (const action of ["read", "claim"]) await api(request, other, "POST", `/api/mailbox/${message.id}/${action}`, {}, 404);
  await api(request, other, "DELETE", `/api/mailbox/${message.id}`, undefined, 404);
  const unclaimedDelete = await request.delete(`/api/mailbox/${message.id}`, { headers: { Authorization: `Bearer ${player.token}` } });
  expect([400, 409]).toContain(unclaimedDelete.status());
  const before = (await freshUser(request, player)).coins;
  const claims = await Promise.all([1, 2].map(() => request.post(`/api/mailbox/${message.id}/claim`, {
    headers: { Authorization: `Bearer ${player.token}` }, data: {}
  })));
  expect(claims.every((response) => response.status() === 200)).toBe(true);
  expect((await freshUser(request, player)).coins).toBe(before + 37);
  await api(request, player, "DELETE", `/api/mailbox/${message.id}`);
  expect((await api(request, player, "GET", "/api/mailbox")).messages.some((entry) => entry.id === message.id)).toBe(false);
  const itemBefore = await itemCount(db, player, "magic-clock");
  await api(request, admin, "POST", "/api/admin/mailbox/batches", {
    targetMode: "user", recipientUserId: player.user.id, sender: "全量测试", title: `${title}-item`, body: "道具附件",
    attachmentType: "item", attachmentItemId: "magic-clock", attachmentQuantity: 2
  });
  const itemMail = (await api(request, player, "GET", "/api/mailbox")).messages.find((entry) => entry.title === `${title}-item`);
  await api(request, player, "POST", `/api/mailbox/${itemMail.id}/claim`, {});
  await api(request, player, "POST", `/api/mailbox/${itemMail.id}/claim`, {});
  expect(await itemCount(db, player, "magic-clock")).toBe(itemBefore + 2);
});

test("announcement publishing/read state and player feedback reach the administration APIs", async ({ request }) => {
  const player = await newPlayer(request, db);
  const marker = `full-content-${Date.now()}`;
  const created = await api(request, admin, "POST", "/api/admin/announcements", {
    kind: "announcement", action: "publish", title: marker, body: "全量测试正文", pinned: true
  });
  const entry = created.entry;
  expect(entry?.id).toBeTruthy();
  const list = await api(request, player, "GET", "/api/announcements?kind=announcement&offset=0&limit=20");
  expect(list.items.find((item) => item.id === entry.id)?.isUnread).toBe(true);
  await api(request, player, "POST", `/api/announcements/${entry.id}/read`, {});
  expect((await api(request, player, "GET", "/api/announcements?kind=announcement&offset=0&limit=20"))
    .items.find((item) => item.id === entry.id)?.isUnread).toBe(false);
  await api(request, player, "POST", "/api/feedback", { content: marker });
  expect(JSON.stringify(await api(request, admin, "GET", "/api/admin/feedback"))).toContain(marker);
});

test("blacklisting blocks live invitations and removing it restores a private match", async ({ request, baseURL }) => {
  const first = await newPlayer(request, db);
  const second = await newPlayer(request, db);
  await api(request, first, "POST", `/api/social/friends/${second.user.id}`, {});
  await api(request, first, "POST", `/api/social/blacklist/${second.user.id}`, {});
  const relationships = await api(request, first, "GET", "/api/social");
  expect(relationships.friends.some((entry) => entry.id === second.user.id)).toBe(false);
  expect(relationships.blacklist.some((entry) => entry.id === second.user.id)).toBe(true);
  const sockets = await Promise.all([second, first].map((auth) => connectSocket(baseURL, auth.token)));
  try {
    let invitations = 0;
    sockets[1].on("duel:incoming", () => { invitations += 1; });
    const rejected = waitForSocketEvent(sockets[0], "duel:rejected");
    sockets[0].emit("duel:request", { targetUserId: first.user.id, mode: "spark" });
    expect(await rejected).toBeTruthy();
    expect(invitations).toBe(0);
    await api(request, first, "DELETE", `/api/social/blacklist/${second.user.id}`);
    const incoming = waitForSocketEvent(sockets[1], "duel:incoming");
    sockets[0].emit("duel:request", { targetUserId: first.user.id, mode: "spark" });
    const invitation = await incoming;
    const found = waitForSocketEvent(sockets[0], "match:found");
    sockets[1].emit("duel:respond", { requestId: invitation.requestId, accepted: true });
    expect((await found).rated).toBe(false);
  } finally { sockets.forEach((socket) => socket.disconnect()); }
  const before = await db.userProfileLike.count();
  for (const _index of [1, 2]) await api(request, first, "POST", `/api/users/${second.user.id}/like`, {});
  expect(await db.userProfileLike.count()).toBe(before + 1);
  const marker = `full-report-${Date.now()}`;
  await api(request, first, "POST", `/api/users/${second.user.id}/report`, { content: marker });
  expect(JSON.stringify(await api(request, admin, "GET", "/api/admin/user-reports"))).toContain(marker);
});

test("forced login and admin password reset revoke the old session and live socket", async ({ request, baseURL }) => {
  const player = await newPlayer(request, db);
  let socket = await connectSocket(baseURL, player.token);
  try {
    await api(request, null, "POST", "/api/auth/login", { username: player.username, password: player.password }, 409);
    const disconnected = waitForSocketEvent(socket, "disconnect");
    const next = await api(request, null, "POST", "/api/auth/login", { username: player.username, password: player.password, forceLogin: true });
    await disconnected;
    await api(request, player, "GET", "/api/me", undefined, 401);
    player.token = next.token;
    socket = await connectSocket(baseURL, player.token);
    const resetDisconnect = waitForSocketEvent(socket, "disconnect");
    await api(request, admin, "POST", `/api/admin/users/${player.user.id}/reset-password`, { password: "new-secret-12" });
    await resetDisconnect;
    await api(request, player, "GET", "/api/me", undefined, 401);
    await api(request, null, "POST", "/api/auth/refresh", {}, 401);
    await api(request, null, "POST", "/api/auth/login", { username: player.username, password: "new-secret-12" });
  } finally { socket.disconnect(); }
});

test("banning an online account stops its live socket and unban restores login", async ({ request, baseURL }) => {
  const player = await newPlayer(request, db);
  const socket = await connectSocket(baseURL, player.token);
  try {
    await api(request, admin, "POST", `/api/admin/users/${player.user.id}/ban`, { reason: "full-test-ban" });
    await expect.poll(() => socket.connected, { timeout: 5000 }).toBe(false);
    await api(request, player, "GET", "/api/me", undefined, 403);
    await api(request, null, "POST", "/api/auth/login", { username: player.username, password: player.password }, 403);
    await api(request, admin, "POST", `/api/admin/users/${player.user.id}/unban`, {});
    await api(request, null, "POST", "/api/auth/login", { username: player.username, password: player.password });
  } finally { socket.disconnect(); }
});
