export function formatStockQuantity(value) {
  const quantity = Number(value ?? -1);
  if (quantity < 0) return "不限量";
  if (quantity === 0) return "售罄";
  return `${quantity}/用户`;
}

export function formatDateTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
