export const PROGRESS_METRICS = {
  coins: "coins",
  rating: "rating"
};

export const PROGRESS_REASONS = {
  adminUpdate: "admin.update",
  gameResult: "game.result",
  gachaDraw: "gacha.draw",
  mailboxClaim: "mailbox.claim",
  costumePurchase: "costume.purchase",
  shopPurchase: "shop.purchase"
};

export function progressLedgerCreateOperation(prisma, entry) {
  if (!prisma?.userProgressLedger?.create) return null;
  const data = normalizeProgressLedgerEntry(entry);
  if (!data) return null;
  return prisma.userProgressLedger.create({ data });
}

export function progressLedgerCreateOperations(prisma, entries = []) {
  return entries
    .map((entry) => progressLedgerCreateOperation(prisma, entry))
    .filter(Boolean);
}

export function normalizeProgressLedgerEntry(entry = {}) {
  const userId = String(entry.userId ?? "").trim();
  const metric = String(entry.metric ?? "").trim();
  const delta = parseInteger(entry.delta);
  if (!userId || !metric || delta == null || delta === 0) return null;
  return {
    userId,
    metric,
    delta,
    beforeValue: parseOptionalInteger(entry.beforeValue),
    afterValue: parseOptionalInteger(entry.afterValue),
    reason: String(entry.reason ?? "").trim(),
    refType: String(entry.refType ?? "").trim(),
    refId: String(entry.refId ?? "").trim()
  };
}

function parseOptionalInteger(value) {
  if (value == null) return null;
  return parseInteger(value);
}

function parseInteger(value) {
  if (typeof value === "number") return Number.isSafeInteger(value) ? value : null;
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) return Number(value);
  return null;
}
