export const MAX_ACTION_RECEIPTS_PER_USER = 64;
export const MAX_ACTION_ID_LENGTH = 128;

const ACTION_ID_PATTERN = /^[A-Za-z0-9:_-]+$/;

export function normalizeActionId(value) {
  const actionId = String(value ?? "").trim();
  if (!actionId) return "";
  if (actionId.length > MAX_ACTION_ID_LENGTH || !ACTION_ID_PATTERN.test(actionId)) return null;
  return actionId;
}

export function findRoomActionReceipt(room, userId, actionId) {
  if (!room || !userId || !actionId) return null;
  return (room.actionReceipts?.[userId] ?? []).find((receipt) => receipt.actionId === actionId) ?? null;
}

export function storeRoomActionReceipt(room, userId, receipt, {
  maxPerUser = MAX_ACTION_RECEIPTS_PER_USER
} = {}) {
  if (!room || !userId || !receipt?.actionId) return null;
  room.actionReceipts ??= {};
  const receipts = room.actionReceipts[userId] ?? [];
  const existing = receipts.find((candidate) => candidate.actionId === receipt.actionId);
  if (existing) return existing;
  const stored = serializableReceipt(receipt);
  room.actionReceipts[userId] = [...receipts, stored].slice(-Math.max(1, Number(maxPerUser) || 1));
  return stored;
}

export function normalizeRoomActionReceipts(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .map(([userId, receipts]) => [String(userId), normalizeReceiptList(receipts)])
    .filter(([userId, receipts]) => userId && receipts.length));
}

function normalizeReceiptList(receipts) {
  if (!Array.isArray(receipts)) return [];
  return receipts
    .map((receipt) => {
      const actionId = normalizeActionId(receipt?.actionId);
      if (!actionId) return null;
      return serializableReceipt({ ...receipt, actionId });
    })
    .filter(Boolean)
    .slice(-MAX_ACTION_RECEIPTS_PER_USER);
}

function serializableReceipt(receipt) {
  return {
    ok: receipt.ok === true,
    actionId: String(receipt.actionId),
    roomCode: String(receipt.roomCode ?? ""),
    revision: Number(receipt.revision ?? 0),
    ...(receipt.error ? { error: String(receipt.error) } : {}),
    ...(receipt.code ? { code: String(receipt.code) } : {})
  };
}
