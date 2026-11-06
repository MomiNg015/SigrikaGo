import { afterAll, beforeAll, expect, test } from "vitest";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { sqliteClientOptions } from "./sqliteClientOptions.js";
import { ensureRoomPersistenceSchema, upsertPersistedRoom } from "./roomPersistence.js";

let prisma;
let directory;
beforeAll(async () => {
  const root = path.resolve(".tmp");
  fs.mkdirSync(root, { recursive: true });
  directory = fs.mkdtempSync(path.join(root, "sqlite-concurrency-"));
  prisma = new PrismaClient(sqliteClientOptions({ DATABASE_URL: `file:${path.join(directory, "test.db").replaceAll("\\", "/")}` }));
  await ensureRoomPersistenceSchema(prisma);
});
afterAll(async () => {
  await prisma?.$disconnect();
  if (directory?.startsWith(path.resolve(".tmp") + path.sep)) fs.rmSync(directory, { recursive: true, force: true });
});

test("concurrent transactions and room snapshots preserve every latest revision without lock timeouts", async () => {
  for (let revision = 1; revision <= 3; revision += 1) {
    await Promise.all(Array.from({ length: 50 }, (_, index) => prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT COUNT(*) FROM PersistedRoom`;
      await upsertPersistedRoom(tx, { code: `ROOM${index}`, status: "active",
        snapshot: JSON.stringify({ revision, payload: "x".repeat(65_000) }) });
    }, { maxWait: 10_000 })));
  }
  const rows = await prisma.$queryRaw`SELECT code, snapshot FROM PersistedRoom`;
  expect(rows).toHaveLength(50);
  expect(new Set(rows.map(row => row.code)).size).toBe(50);
  for (const row of rows) expect(JSON.parse(row.snapshot).revision).toBe(3);
}, 30_000);
