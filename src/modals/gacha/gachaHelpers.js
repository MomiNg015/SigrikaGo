export function selectInitialGachaPool(pools = []) {
  return pools.find(Boolean) ?? null;
}

export function formatGachaDateRange(pool = {}) {
  if (pool.permanent) return "permanent";
  if (pool.openDateRange) return pool.openDateRange;
  if (!pool.startsAt && !pool.endsAt) return "";
  return `${formatDate(pool.startsAt)}-${formatDate(pool.endsAt)}`;
}

export function formatGachaRemaining(remainingMs) {
  if (remainingMs == null) return "permanent";
  const totalMinutes = Math.max(0, Math.ceil(Number(remainingMs) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function buildGachaRewardLabel(reward = {}) {
  const quantity = Number(reward.quantity ?? 1);
  if (reward.type === "coins") return `${quantity} coins`;
  if (reward.type === "item") return `${reward.targetId || reward.name || "item"} x${quantity}`;
  if (reward.chainAdded > 0) return `${reward.targetId || reward.name || "character"} +${reward.chainAdded} chain`;
  if (reward.blueGemsAdded > 0) return `${reward.targetId || reward.name || reward.type} -> ${reward.blueGemsAdded} gems`;
  return `${reward.name || reward.targetId || reward.type} x${quantity}`;
}

export function gachaPrizeTypeLabel(type) {
  if (type === "character") return "角色";
  if (type === "decoration") return "装饰";
  if (type === "item") return "道具";
  if (type === "music") return "音乐";
  if (type === "coins") return "金币";
  return "奖项";
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}
