const TRACKED_STATS = [
  { key: "coins", label: "\u91d1\u5e01", type: "number" },
  { key: "rating", label: "\u79ef\u5206", type: "number" },
  { key: "rank", label: "\u6bb5\u4f4d", type: "text" }
];

export function buildStatChangeToasts(previousUser, nextUser) {
  if (!previousUser || !nextUser || previousUser.id !== nextUser.id) return [];
  return TRACKED_STATS
    .map((stat) => formatStatChange(stat, previousUser[stat.key], nextUser[stat.key]))
    .filter(Boolean)
    .map((text) => ({ tone: "reward", text }));
}

export function buildStatChangeToast(previousUser, nextUser) {
  const toasts = buildStatChangeToasts(previousUser, nextUser);
  if (!toasts.length) return null;
  return { tone: "reward", text: toasts.map((toast) => toast.text).join("\uff1b") };
}

function formatStatChange(stat, previousValue, nextValue) {
  if (previousValue === nextValue) return "";
  if (stat.type === "number") {
    const previousNumber = Number(previousValue);
    const nextNumber = Number(nextValue);
    if (!Number.isFinite(previousNumber) || !Number.isFinite(nextNumber)) return "";
    const delta = nextNumber - previousNumber;
    if (delta === 0) return "";
    return `${stat.label}${delta > 0 ? "+" : ""}${delta}`;
  }
  if (previousValue == null || nextValue == null) return "";
  return `${stat.label}${previousValue} \u2192 ${nextValue}`;
}
