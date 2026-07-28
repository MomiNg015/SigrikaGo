export const MAX_IRIS_LINKS = 30;

export const DEFAULT_IRIS_LINKS = [
  {
    href: "https://www.weiqi.org.cn/",
    title: "中国围棋协会",
    description: "赛事资讯 · 行业动态"
  },
  {
    href: "https://online-go.com/",
    title: "Online Go Server",
    description: "线上对弈 · 棋局复盘"
  },
  {
    href: "https://senseis.xmp.net/",
    title: "Sensei’s Library",
    description: "围棋术语与知识 Wiki"
  }
];

export function normalizeIrisLinks(value, { fallback = DEFAULT_IRIS_LINKS } = {}) {
  const parsed = parseIrisLinks(value);
  const source = Array.isArray(parsed) ? parsed : fallback;

  return source
    .slice(0, MAX_IRIS_LINKS)
    .map((entry) => normalizeIrisLink(entry))
    .filter(Boolean);
}

export function irisLinksFromSettings(settings = {}) {
  return normalizeIrisLinks(settings.irisLinks);
}

export function irisLinksSettingJson(value = DEFAULT_IRIS_LINKS) {
  return JSON.stringify(normalizeIrisLinks(value), null, 2);
}

function parseIrisLinks(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeIrisLink(entry) {
  if (!entry || typeof entry !== "object") return null;
  const title = String(entry.title ?? "").trim().slice(0, 80);
  const description = String(entry.description ?? "").trim().slice(0, 120);
  const href = normalizeHttpUrl(entry.href);
  if (!title || !href) return null;
  return {
    href,
    title,
    description,
    host: new URL(href).hostname.replace(/^www\./, "")
  };
}

function normalizeHttpUrl(value) {
  const candidate = String(value ?? "").trim().slice(0, 500);
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}
