const API_BASE = "";
let authRefreshHandler = null;

export function configureAuthRefresh(handler) {
  authRefreshHandler = handler;
}

export async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    const isHtml = text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html");
    throw new Error(isHtml
      ? "\u63a5\u53e3\u8fd4\u56de\u4e86\u524d\u7aef\u9875\u9762\u800c\u4e0d\u662f JSON\uff0c\u8bf7\u5237\u65b0\u9875\u9762\u5e76\u786e\u8ba4\u540e\u7aef\u670d\u52a1\u5df2\u542f\u52a8\u3002"
      : "\u63a5\u53e3\u8fd4\u56de\u683c\u5f0f\u4e0d\u662f JSON\u3002");
  }
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && options.token && !options.skipAuthRefresh && authRefreshHandler) {
      const refreshed = await authRefreshHandler();
      if (refreshed?.token) {
        return api(path, {
          ...options,
          token: refreshed.token,
          skipAuthRefresh: true
        });
      }
    }
    const error = new Error(data.error ?? "\u8bf7\u6c42\u5931\u8d25");
    error.status = response.status;
    error.code = data.code;
    error.data = data;
    throw error;
  }
  return data;
}

export async function adminApi(path, token, options = {}) {
  return api(`/api/admin${path}`, { ...options, token });
}

export async function uploadPortrait(file, token) {
  return uploadPortraitWithToken(file, token);
}

async function uploadPortraitWithToken(file, token, { skipAuthRefresh = false } = {}) {
  const form = new FormData();
  form.append("portrait", file);
  const response = await fetch(`${API_BASE}/api/admin/uploads/character-portrait`, {
    method: "POST",
    credentials: "same-origin",
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  const data = await response.json();
  if (response.status === 401 && token && !skipAuthRefresh && authRefreshHandler) {
    const refreshed = await authRefreshHandler();
    if (refreshed?.token) {
      return uploadPortraitWithToken(file, refreshed.token, { skipAuthRefresh: true });
    }
  }
  if (!response.ok) throw new Error(data.error ?? "\u4e0a\u4f20\u5931\u8d25");
  return data.url;
}
