export async function ensureRoomPersistenceSchema(prisma) {
  if (!prisma?.$executeRaw) return;
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS PersistedRoom (
      code TEXT NOT NULL PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'active',
      snapshot TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS PersistedRoom_status_idx ON PersistedRoom(status)`;
}

export async function upsertPersistedRoom(prisma, { code, status, snapshot }) {
  if (!prisma?.$executeRaw) return;
  await prisma.$executeRaw`
    INSERT INTO PersistedRoom (code, status, snapshot, createdAt, updatedAt)
    VALUES (${code}, ${status}, ${snapshot}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(code)
    DO UPDATE SET status = ${status}, snapshot = ${snapshot}, updatedAt = CURRENT_TIMESTAMP
  `;
}

export async function listPersistedRooms(prisma) {
  if (!prisma?.$queryRaw) return [];
  return prisma.$queryRaw`
    SELECT code, status, snapshot
    FROM PersistedRoom
    WHERE status IN ('active', 'finished')
  `;
}

export async function deletePersistedRoom(prisma, code) {
  if (!prisma?.$executeRaw) return;
  await prisma.$executeRaw`DELETE FROM PersistedRoom WHERE code = ${code}`;
}
