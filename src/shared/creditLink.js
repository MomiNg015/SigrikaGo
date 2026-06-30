export function normalizeCreditName(value) {
  return String(value ?? "").trim();
}

export function normalizeCreditUrl(value) {
  const url = String(value ?? "").trim();
  if (!url) return "";
  if (/^\/(?!\/)[^\s<>]*$/.test(url)) return url;
  if (/[\s<>]/.test(url)) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return url;
  } catch {
    return null;
  }
  return null;
}
