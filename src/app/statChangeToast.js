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
    .map(({ text, tone }) => ({ tone, text }));
}

export function buildStatChangeToast(previousUser, nextUser) {
  const toasts = buildStatChangeToasts(previousUser, nextUser);
  if (!toasts.length) return null;
  return {
    tone: toasts.every((toast) => toast.tone === "penalty") ? "penalty" : "reward",
    text: toasts.map((toast) => toast.text).join("\uff1b")
  };
}

function formatStatChange(stat, previousValue, nextValue) {
  if (previousValue === nextValue) return null;
  if (stat.type === "number") {
    const previousNumber = Number(previousValue);
    const nextNumber = Number(nextValue);
    if (!Number.isFinite(previousNumber) || !Number.isFinite(nextNumber)) return null;
    const delta = nextNumber - previousNumber;
    if (delta === 0) return null;
    return {
      text: `${stat.label}${delta > 0 ? "+" : ""}${delta}`,
      tone: delta < 0 ? "penalty" : "reward"
    };
  }
  if (previousValue == null || nextValue == null) return null;
  return {
    text: `${stat.label}${previousValue} \u2192 ${nextValue}`,
    tone: isRankDrop(previousValue, nextValue) ? "penalty" : "reward"
  };
}

function isRankDrop(previousRank, nextRank) {
  const previousValue = rankSortValue(previousRank);
  const nextValue = rankSortValue(nextRank);
  if (previousValue == null || nextValue == null) return false;
  return nextValue < previousValue;
}

function rankSortValue(rank) {
  const text = String(rank ?? "");
  const dan = text.match(/^(\d+)\u6bb5$/u);
  if (dan) return 100 + Number(dan[1]);
  const kyu = text.match(/^(\d+)\u7ea7$/u);
  if (kyu) return 100 - Number(kyu[1]);
  return null;
}
